"use strict";

/**
 * AUDIT READ-ONLY — Incrocio reale Sinottica (ex Centro di Controllo) <-> Manutenzioni.
 *
 * Obiettivo: misurare sui DATI REALI Firestore quante segnalazioni/controlli che la
 * Sinottica mostra come "aperti" hanno in realtà gia' una manutenzione, distinguendo:
 *   - LEGAME CERTO  : la manutenzione referenzia il record (origineRefs/origineRefId)
 *                     oppure il record referenzia la manutenzione (linkedLavoroId/Ids).
 *   - SOLA TARGA    : esiste una manutenzione sulla stessa targa (PLAUSIBILE, NON certo).
 *   - NESSUNA       : nessuna manutenzione per quella targa.
 * Isola anche il bug noto: CONTROLLI aperti ma con traccia di chiusura.
 *
 * ZERO scritture. Replica fedele dei filtri runtime:
 *   - segnalazioni: isNextSegnalazioneOperativa + derivazione `chiusa` (nextAutistiDomain.ts:600-604)
 *   - controlli   : isKo && !chiuso && !hasLinkedLavoro (NextCentroControlloParityPage.tsx:1471)
 *
 * Uso:  node scripts/oneoff/incrocio-sinottica-manutenzioni-2026-06-21.cjs
 */

const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "..", "..", "backend", "internal-ai", ".env"),
});
const {
  getInternalAiFirebaseAdminReadonlyContext,
} = require("../../backend/internal-ai/server/internal-ai-firebase-admin.js");

const STORAGE_COLLECTION = "storage";
const KEY_MANUTENZIONI = "@manutenzioni";
const KEY_SEGNALAZIONI = "@segnalazioni_autisti_tmp";
const KEY_CONTROLLI = "@controlli_mezzo_autisti";

// ---------- helper di base (allineati a diagnosi-manutenzione-targa.cjs) ----------
const isRecord = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v) => String(v ?? "").trim();
const lower = (v) => text(v).toLowerCase();
const normTarga = (v) => text(v).toUpperCase().replace(/[^A-Z0-9]/g, "");
const normOptTarga = (v) => normTarga(v) || null;
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
const line = (s = "") => console.log(s);

function unwrapList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.value)) return raw.value.filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.items)) return raw.items.filter(isRecord);
  return [];
}
async function readStorageList(db, key) {
  const snap = await db.collection(STORAGE_COLLECTION).doc(key).get();
  if (!snap.exists) return [];
  return unwrapList(snap.data());
}
function isoToDisplay(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(text(value));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}
function dateShort(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n)) return "—";
  const d = new Date(n);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}
const idShort = (v) => text(v).slice(0, 10);

// ---------- replica derivazioni targa (nextAutistiDomain.ts) ----------
function segnalazioneTargaMezzo(r) {
  const primary = normOptTarga(r.targa);
  const motrice = normOptTarga(r.targaMotrice ?? r.targaCamion);
  const explicitRimorchio = normOptTarga(r.targaRimorchio);
  const ambito = lower(r.ambito);
  const rimorchio =
    explicitRimorchio ??
    (ambito === "rimorchio" && primary && primary !== motrice ? primary : null);
  return primary ?? rimorchio ?? motrice; // = pickSegnalazioneTarga().mezzo
}
function controlloTargaMostrata(r) {
  const motrice = normOptTarga(r.targaMotrice ?? r.targaCamion ?? r.targa);
  const rimorchio = normOptTarga(r.targaRimorchio);
  return motrice ?? rimorchio; // Sinottica usa targaMotrice poi targaRimorchio
}
function manutenzioneTarga(r) {
  return (
    normOptTarga(r.targa) ??
    normOptTarga(r.targaMotrice ?? r.targaCamion) ??
    normOptTarga(r.targaRimorchio)
  );
}

// ---------- replica flag legame/chiusura ----------
function segHasLinkedLavoro(r) {
  if (text(r.linkedLavoroId)) return true;
  if (Array.isArray(r.linkedLavoroIds)) return r.linkedLavoroIds.some((x) => text(x));
  return false;
}
function segChiusaDerivata(r) {
  return (
    r.chiusa === true ||
    lower(r.stato) === "chiusa" ||
    typeof r.chiusuraData === "number" ||
    Boolean(text(r.chiusuraRefId))
  );
}
function isSegnalazioneApertaSinottica(r) {
  if (!segnalazioneTargaMezzo(r)) return false; // targa "-" => esclusa
  if (segChiusaDerivata(r)) return false;
  if (segHasLinkedLavoro(r)) return false;
  return true;
}

function controlloKoList(r) {
  const ko = [];
  if (r.check && isRecord(r.check)) {
    for (const [k, val] of Object.entries(r.check)) if (val === false) ko.push(String(k).toUpperCase());
  }
  if (Array.isArray(r.koItems)) for (const e of r.koItems) if (text(e)) ko.push(text(e).toUpperCase());
  return ko;
}
function controlloIsKo(r) {
  return (
    r.ko === true ||
    r.ok === false ||
    r.tuttoOk === false ||
    lower(r.esito) === "ko" ||
    controlloKoList(r).length > 0
  );
}
function ctrlHasLinkedLavoro(r) {
  if (text(r.linkedLavoroId)) return true;
  if (Array.isArray(r.linkedLavoroIds)) return r.linkedLavoroIds.some((x) => text(x));
  return false;
}
function ctrlHasChiusuraTrace(r) {
  return (
    lower(r.stato) === "chiusa" ||
    typeof r.chiusuraData === "number" ||
    Boolean(text(r.chiusuraRefId)) ||
    typeof r.dataChiusura === "number"
  );
}
function isControlloApertoSinottica(r) {
  if (!controlloIsKo(r)) return false;
  if (r.chiuso === true) return false; // unica condizione di chiusura vista dal filtro!
  if (ctrlHasLinkedLavoro(r)) return false;
  if (!controlloTargaMostrata(r)) return false; // .filter(r => r.targa !== "")
  return true;
}

// ---------- manutenzioni: stato + origine ----------
function manutHasExecutionFields(r) {
  if (text(r.dataEsecuzione)) return true;
  if (num(r.km) !== null || num(r.ore) !== null) return true;
  return num(r.importo) !== null;
}
function manutStatoMostrato(r) {
  const raw = lower(r.stato);
  if (raw) return raw;
  return manutHasExecutionFields(r) ? "eseguita(derivato)" : "dafare(derivato)";
}
function manutIsRisolta(r) {
  const s = manutStatoMostrato(r);
  return s.startsWith("eseguita") || s === "chiusa_da_evento";
}
/** Raccoglie ogni stringa-id presente nei campi origine della manutenzione. */
function manutOrigineIds(r) {
  const ids = new Set();
  const add = (v) => {
    const t = text(v);
    if (t) ids.add(t);
  };
  add(r.origineRefId);
  if (Array.isArray(r.origineRefs)) {
    for (const ref of r.origineRefs) {
      if (typeof ref === "string") add(ref);
      else if (isRecord(ref)) for (const val of Object.values(ref)) if (typeof val === "string") add(val);
    }
  }
  return ids;
}

function sampleStructure(label, records, keysOfInterest) {
  line(`\n--- struttura "${label}" (campioni reali, primi che valorizzano i campi) ---`);
  let shown = 0;
  for (const r of records) {
    const present = keysOfInterest.filter((k) => r[k] !== undefined && r[k] !== null && r[k] !== "");
    if (present.length === 0) continue;
    const dump = present.map((k) => `${k}=${JSON.stringify(r[k])}`).join(" | ");
    line(`   id=${idShort(r.id)} ${dump}`);
    if (++shown >= 8) break;
  }
  if (shown === 0) line("   (nessun record valorizza questi campi)");
}

async function main() {
  const ctx = await getInternalAiFirebaseAdminReadonlyContext();
  if (ctx.status !== "ready" || !ctx.firestore) {
    const mode = ctx.runtimeProbe?.credential?.mode ?? "unknown";
    throw new Error(`Firestore readonly non pronto: status=${ctx.status} credential.mode=${mode}`);
  }
  const db = ctx.firestore;

  const [manut, segn, ctrl] = await Promise.all([
    readStorageList(db, KEY_MANUTENZIONI),
    readStorageList(db, KEY_SEGNALAZIONI),
    readStorageList(db, KEY_CONTROLLI),
  ]);

  line(`# INCROCIO SINOTTICA <-> MANUTENZIONI (dati reali)`);
  line(`credential.mode=${ctx.runtimeProbe?.credential?.mode ?? "unknown"}`);
  line(`totali grezzi: @manutenzioni=${manut.length} | @segnalazioni=${segn.length} | @controlli=${ctrl.length}`);

  // 0) Introspezione struttura legame (per non assumere la forma dei campi)
  sampleStructure("@manutenzioni origine", manut, ["origineTipo", "origineRefId", "origineRefKey", "origineRefs"]);
  sampleStructure("@segnalazioni legame/chiusura", segn, [
    "stato", "chiusa", "chiusuraRefId", "chiusuraData", "dataChiusura", "linkedLavoroId", "linkedLavoroIds",
  ]);
  sampleStructure("@controlli legame/chiusura", ctrl, [
    "stato", "chiuso", "chiusuraRefId", "chiusuraData", "dataChiusura", "linkedLavoroId", "linkedLavoroIds", "ko", "ok", "tuttoOk", "esito",
  ]);

  // Indici manutenzioni
  const manutById = new Map();
  const manutByTarga = new Map();
  const origineIdToManut = new Map(); // idOrigine -> [manut]
  for (const m of manut) {
    if (text(m.id)) manutById.set(text(m.id), m);
    const t = manutenzioneTarga(m);
    if (t) {
      if (!manutByTarga.has(t)) manutByTarga.set(t, []);
      manutByTarga.get(t).push(m);
    }
    for (const oid of manutOrigineIds(m)) {
      if (!origineIdToManut.has(oid)) origineIdToManut.set(oid, []);
      origineIdToManut.get(oid).push(m);
    }
  }
  const manutConOrigine = manut.filter((m) => manutOrigineIds(m).size > 0);

  // ---------- classificazione di un record aperto ----------
  function classifica(rec, targa) {
    const id = text(rec.id);
    const claimers = origineIdToManut.get(id) || [];
    if (claimers.length > 0) {
      const risolta = claimers.some(manutIsRisolta);
      return { cat: "CERTO", claimers, risolta };
    }
    const sameTarga = targa ? manutByTarga.get(targa) || [] : [];
    if (sameTarga.length > 0) {
      const risolta = sameTarga.some(manutIsRisolta);
      return { cat: "TARGA", claimers: sameTarga, risolta };
    }
    return { cat: "NESSUNA", claimers: [], risolta: false };
  }

  // ===== SEGNALAZIONI =====
  const segAperte = segn
    .filter(isSegnalazioneApertaSinottica)
    .map((r) => ({ rec: r, targa: segnalazioneTargaMezzo(r) }));
  const segByCat = { CERTO: [], TARGA: [], NESSUNA: [] };
  for (const s of segAperte) {
    const c = classifica(s.rec, s.targa);
    segByCat[c.cat].push({ ...s, ...c });
  }

  // ===== CONTROLLI =====
  const ctrlAperti = ctrl
    .filter(isControlloApertoSinottica)
    .map((r) => ({ rec: r, targa: controlloTargaMostrata(r) }));
  const ctrlByCat = { CERTO: [], TARGA: [], NESSUNA: [] };
  for (const c of ctrlAperti) {
    const cl = classifica(c.rec, c.targa);
    ctrlByCat[cl.cat].push({ ...c, ...cl });
  }
  // bug noto: controlli aperti ma con traccia di chiusura (non riconosciuta dal filtro)
  const ctrlApertiConTracciaChiusura = ctrlAperti.filter((c) => ctrlHasChiusuraTrace(c.rec));

  // ---------- REPORT ----------
  line(`\n\n================ SEGNALAZIONI ================`);
  line(`Segnalazioni mostrate APERTE dalla Sinottica: ${segAperte.length}`);
  line(`  - con LEGAME CERTO a una manutenzione (origineRefs): ${segByCat.CERTO.length}  (di cui manutenzione gia' risolta: ${segByCat.CERTO.filter((x) => x.risolta).length})`);
  line(`  - SOLO stessa TARGA di una manutenzione (NON certo):  ${segByCat.TARGA.length}  (di cui targa con manut. risolta: ${segByCat.TARGA.filter((x) => x.risolta).length})`);
  line(`  - NESSUNA manutenzione per quella targa:              ${segByCat.NESSUNA.length}`);

  const dumpSeg = (arr, n) =>
    arr.slice(0, n).forEach((x) => {
      const m = x.claimers[0];
      line(
        `   targa=${(x.targa || "?").padEnd(9)} seg=${idShort(x.rec.id).padEnd(11)} stato=${(text(x.rec.stato) || "—").padEnd(14)} ts=${dateShort(x.rec.timestamp)}` +
          (m ? ` -> manut=${idShort(m.id)} stato=${manutStatoMostrato(m)} data=${isoToDisplay(m.data) || dateShort(m.timestamp)}` : ""),
      );
    });
  if (segByCat.CERTO.length) { line(`\n  [CERTO] esempi:`); dumpSeg(segByCat.CERTO, 20); }
  if (segByCat.TARGA.length) { line(`\n  [SOLO TARGA] esempi:`); dumpSeg(segByCat.TARGA, 20); }

  line(`\n\n================ CONTROLLI KO ================`);
  line(`Controlli KO mostrati APERTI dalla Sinottica: ${ctrlAperti.length}`);
  line(`  - con LEGAME CERTO a una manutenzione (origineRefs): ${ctrlByCat.CERTO.length}  (di cui manutenzione gia' risolta: ${ctrlByCat.CERTO.filter((x) => x.risolta).length})`);
  line(`  - SOLO stessa TARGA di una manutenzione (NON certo):  ${ctrlByCat.TARGA.length}  (di cui targa con manut. risolta: ${ctrlByCat.TARGA.filter((x) => x.risolta).length})`);
  line(`  - NESSUNA manutenzione per quella targa:              ${ctrlByCat.NESSUNA.length}`);
  line(`  >> BUG controlli: aperti MA con traccia di chiusura (stato=chiusa/chiusuraData/chiusuraRefId/dataChiusura): ${ctrlApertiConTracciaChiusura.length}`);

  const dumpCtrl = (arr, n) =>
    arr.slice(0, n).forEach((x) => {
      const m = x.claimers && x.claimers[0];
      line(
        `   targa=${(x.targa || "?").padEnd(9)} ctrl=${idShort(x.rec.id).padEnd(11)} stato=${(text(x.rec.stato) || "—").padEnd(10)} chiuso=${x.rec.chiuso === true} chiusuraData=${typeof x.rec.chiusuraData === "number" ? dateShort(x.rec.chiusuraData) : "—"} ts=${dateShort(x.rec.timestamp)}` +
          (m ? ` -> manut=${idShort(m.id)} stato=${manutStatoMostrato(m)}` : ""),
      );
    });
  if (ctrlByCat.CERTO.length) { line(`\n  [CERTO] esempi:`); dumpCtrl(ctrlByCat.CERTO, 20); }
  if (ctrlApertiConTracciaChiusura.length) { line(`\n  [BUG traccia-chiusura] esempi:`); dumpCtrl(ctrlApertiConTracciaChiusura, 20); }
  if (ctrlByCat.TARGA.length) { line(`\n  [SOLO TARGA] esempi:`); dumpCtrl(ctrlByCat.TARGA, 15); }

  // ===== verso opposto: manutenzioni che dichiarano un'origine =====
  line(`\n\n================ MANUTENZIONI con origine dichiarata ================`);
  line(`Manutenzioni con origineRefs/origineRefId valorizzato: ${manutConOrigine.length} su ${manut.length}`);
  let origineApertaCerta = 0, origineRisoltaMaAperta = 0, origineSana = 0, origineNonTrovata = 0;
  const esempiRisolteMaAperte = [];
  const allApertiIds = new Set([...segAperte, ...ctrlAperti].map((x) => text(x.rec.id)));
  const segById = new Map(segn.map((r) => [text(r.id), r]));
  const ctrlById = new Map(ctrl.map((r) => [text(r.id), r]));
  for (const m of manutConOrigine) {
    for (const oid of manutOrigineIds(m)) {
      const exists = segById.has(oid) || ctrlById.has(oid);
      if (!exists) { origineNonTrovata++; continue; }
      if (allApertiIds.has(oid)) {
        origineApertaCerta++;
        if (manutIsRisolta(m)) {
          origineRisoltaMaAperta++;
          if (esempiRisolteMaAperte.length < 20) {
            const o = segById.get(oid) || ctrlById.get(oid);
            esempiRisolteMaAperte.push(
              `   manut=${idShort(m.id)} stato=${manutStatoMostrato(m)} targa=${manutenzioneTarga(m) || "?"} -> origine=${idShort(oid)} (${segById.has(oid) ? "segn" : "ctrl"}) ANCORA APERTA`,
            );
          }
        }
      } else {
        origineSana++;
      }
    }
  }
  line(`  - origine ANCORA APERTA nella Sinottica (disallineamento certo): ${origineApertaCerta}`);
  line(`      di cui manutenzione gia' RISOLTA ma origine aperta:          ${origineRisoltaMaAperta}`);
  line(`  - origine correttamente chiusa/collegata (sano):                ${origineSana}`);
  line(`  - origine id non piu' presente nei dataset (orfano):            ${origineNonTrovata}`);
  if (esempiRisolteMaAperte.length) { line(`\n  [RISOLTA ma origine APERTA] esempi:`); esempiRisolteMaAperte.forEach(line); }

  // ===== sanity: link orfani sulle segnalazioni =====
  let segLinkOrfano = 0;
  for (const s of segn) {
    const ids = [];
    if (text(s.linkedLavoroId)) ids.push(text(s.linkedLavoroId));
    if (Array.isArray(s.linkedLavoroIds)) for (const x of s.linkedLavoroIds) if (text(x)) ids.push(text(x));
    if (ids.length && ids.every((id) => !manutById.has(id))) segLinkOrfano++;
  }
  line(`\n[sanity] segnalazioni con linkedLavoroId che NON punta ad alcuna manutenzione esistente (link orfano): ${segLinkOrfano}`);

  // ===== DETTAGLIO PER-CASO (per giudizio umano del match, niente supposizioni) =====
  const snip = (v, n = 70) => {
    const t = text(v).replace(/\s+/g, " ");
    return t.length > n ? `${t.slice(0, n)}…` : t || "—";
  };
  const descSeg = (r) => `${text(r.tipoProblema) || text(r.tipo) || "?"} — "${snip(r.descrizione ?? r.note ?? r.testo)}"`;
  const descCtrl = (r) => {
    const ko = controlloKoList(r);
    return `KO=[${ko.join(", ") || "?"}] note="${snip(r.note ?? r.dettaglio ?? r.messaggio, 50)}"`;
  };
  const flagsChiusura = (r) =>
    `chiuso/a=${r.chiuso === true || r.chiusa === true} stato=${text(r.stato) || "—"} chiusuraRefId=${text(r.chiusuraRefId) || "—"} chiusuraData=${typeof r.chiusuraData === "number" ? dateShort(r.chiusuraData) : "—"} dataChiusura=${typeof r.dataChiusura === "number" ? dateShort(r.dataChiusura) : (text(r.dataChiusura) || "—")} linkedLavoroId=${text(r.linkedLavoroId) || "—"} linkedLavoroIds=${Array.isArray(r.linkedLavoroIds) ? JSON.stringify(r.linkedLavoroIds) : "—"}`;
  const manutLinea = (m) =>
    `      manut ${idShort(m.id).padEnd(11)} stato=${manutStatoMostrato(m).padEnd(18)} data=${(isoToDisplay(m.data) || dateShort(m.timestamp)).padEnd(11)} origine=${text(m.origineTipo) || "—"} desc="${snip(m.descrizione, 60)}"`;

  line(`\n\n================ DETTAGLIO PER-CASO (verifica match descrizione) ================`);
  line(`\n--- SEGNALAZIONI aperte (${segAperte.length}) con le manutenzioni della STESSA targa ---`);
  for (const s of segAperte) {
    line(`\n  • targa ${s.targa} | seg ${idShort(s.rec.id)} | ${descSeg(s.rec)}`);
    line(`      timbri: ${flagsChiusura(s.rec)}`);
    const ms = (manutByTarga.get(s.targa) || []).slice().sort((a, b) => text(b.data).localeCompare(text(a.data)));
    if (!ms.length) line(`      (nessuna manutenzione su questa targa)`);
    else ms.forEach((m) => line(manutLinea(m)));
  }
  line(`\n--- CONTROLLI KO aperti (${ctrlAperti.length}) con le manutenzioni della STESSA targa ---`);
  for (const c of ctrlAperti) {
    line(`\n  • targa ${c.targa} | ctrl ${idShort(c.rec.id)} | ts=${dateShort(c.rec.timestamp)} | ${descCtrl(c.rec)}`);
    line(`      timbri: ${flagsChiusura(c.rec)}`);
    const ms = (manutByTarga.get(c.targa) || []).slice().sort((a, b) => text(b.data).localeCompare(text(a.data)));
    if (!ms.length) line(`      (nessuna manutenzione su questa targa)`);
    else ms.forEach((m) => line(manutLinea(m)));
  }

  // ===== BUG-CHECK REGOLA DI CHIUSURA (la domanda vera) =====
  // Un segnale deve SPARIRE dalla Sinottica quando e' chiuso o messo in manutenzione.
  // Verifichiamo che OGNI forma di chiusura presente nei dati sia riconosciuta dal filtro.
  line(`\n\n================ BUG-CHECK: la regola di chiusura e' completa? ================`);

  // --- SEGNALAZIONI: il filtro riconosce chiusa | stato=chiusa | chiusuraData | chiusuraRefId | linkedLavoro
  let segChiuseInQualcheForma = 0, segChiuseMaAncoraAperte = 0;
  for (const r of segn) {
    const tracciaQualsiasi =
      r.chiusa === true ||
      lower(r.stato) === "chiusa" ||
      typeof r.chiusuraData === "number" ||
      Boolean(text(r.chiusuraRefId)) ||
      typeof r.dataChiusura === "number" ||
      segHasLinkedLavoro(r);
    if (!tracciaQualsiasi) continue;
    segChiuseInQualcheForma++;
    if (isSegnalazioneApertaSinottica(r)) segChiuseMaAncoraAperte++; // <-- sarebbe un BUG
  }
  line(`SEGNALAZIONI con una qualsiasi forma di chiusura/aggancio: ${segChiuseInQualcheForma}`);
  line(`  -> di queste, ancora MOSTRATE come aperte (BUG): ${segChiuseMaAncoraAperte}`);

  // --- CONTROLLI: il filtro riconosce SOLO chiuso=true | linkedLavoro. NON stato=chiusa/chiusuraData/chiusuraRefId/dataChiusura.
  let ctrlChiusoForte = 0;          // chiuso === true (riconosciuto)
  let ctrlChiusuraDebole = 0;       // NO chiuso=true MA traccia debole (stato=chiusa/chiusuraData/...)
  let ctrlDeboleMaNascostoDalLink = 0; // debole + linkedLavoro -> nascosto SOLO grazie al link (rischio latente)
  let ctrlDeboleVisibilePerErrore = 0; // debole + NO link + isKo + targa -> BUG ATTIVO (visibile pur essendo chiuso)
  for (const r of ctrl) {
    if (r.chiuso === true) { ctrlChiusoForte++; continue; }
    const debole =
      lower(r.stato) === "chiusa" ||
      typeof r.chiusuraData === "number" ||
      Boolean(text(r.chiusuraRefId)) ||
      typeof r.dataChiusura === "number";
    if (!debole) continue;
    ctrlChiusuraDebole++;
    if (ctrlHasLinkedLavoro(r)) ctrlDeboleMaNascostoDalLink++;
    else if (controlloIsKo(r) && controlloTargaMostrata(r)) ctrlDeboleVisibilePerErrore++;
  }
  line(`\nCONTROLLI chiusi con flag forte (chiuso=true, riconosciuto dal filtro): ${ctrlChiusoForte}`);
  line(`CONTROLLI con chiusura "debole" non riconosciuta dal filtro (stato=chiusa/chiusuraData/...): ${ctrlChiusuraDebole}`);
  line(`  -> nascosti SOLO grazie al link a manutenzione (rischio latente se sganciati): ${ctrlDeboleMaNascostoDalLink}`);
  line(`  -> VISIBILI per errore pur essendo chiusi (BUG ATTIVO ORA): ${ctrlDeboleVisibilePerErrore}`);

  line(`\n## DONE`);
}

main().catch((err) => {
  console.error("ERRORE incrocio:", err);
  process.exit(1);
});
