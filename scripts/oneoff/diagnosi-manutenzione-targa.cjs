"use strict";

/**
 * Strumento di DIAGNOSI READ-ONLY del modulo manutenzioni, per targa.
 *
 * Obiettivo: vedere i DATI REALI salvati in Firestore senza interpretazioni UI,
 * per capire incongruenze su date, raggruppamenti e legami segnalazione<->manutenzione.
 *
 * Zero scritture. Usa il boundary admin read-only condiviso.
 *
 * Uso:
 *   node scripts/oneoff/diagnosi-manutenzione-targa.cjs [TARGA]
 * Esempi:
 *   node scripts/oneoff/diagnosi-manutenzione-targa.cjs TI233827
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

const ARG = (process.argv[2] || "TI233827").trim();
const TARGA = ARG.toUpperCase();
const AUDIT_MODE = ARG === "--audit" || TARGA === "ALL";
const SEARCH_TERM = (process.argv[3] || "").toUpperCase();

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.value)) return raw.value.filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.items)) return raw.items.filter(isRecord);
  return [];
}

function text(value) {
  return String(value ?? "").trim();
}

function normalizeTarga(value) {
  return text(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

async function readStorageList(db, key) {
  const snapshot = await db.collection(STORAGE_COLLECTION).doc(key).get();
  if (!snapshot.exists) return [];
  return unwrapList(snapshot.data());
}

/** Rende una stringa data ISO "YYYY-MM-DD" in GG/MM/AAAA, senza Date (no TZ). */
function isoToDisplay(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(text(value));
  if (!m) return null;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** Rende un timestamp ms in: ISO UTC, data UTC GG/MM/AAAA, data LOCALE GG/MM/AAAA. */
function msInfo(ms) {
  if (ms === null || ms === undefined || ms === "") return "—";
  const n = Number(ms);
  if (!Number.isFinite(n)) return `non-numerico(${JSON.stringify(ms)})`;
  const d = new Date(n);
  if (Number.isNaN(d.getTime())) return `invalido(${ms})`;
  const utc = `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
  const loc = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  return `ms=${n} | ISO=${d.toISOString()} | UTC=${utc} | LOCALE=${loc}`;
}

function snippet(value, len = 60) {
  const t = text(value).replace(/\s+/g, " ");
  return t.length > len ? `${t.slice(0, len)}…` : t;
}

function matchesTarga(record) {
  const target = normalizeTarga(TARGA);
  return [record.targa, record.targaCamion, record.targaRimorchio, record.targaMotrice]
    .map(normalizeTarga)
    .some((t) => t && t === target);
}

function line(s = "") {
  console.log(s);
}

function hasRealId(record) {
  const id = text(record.id);
  return Boolean(id) && !id.startsWith("manutenzione:");
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Replica esatta di hasLegacyExecutionFields (nextManutenzioniDomain.ts). */
function hasExecutionFields(record) {
  if (text(record.dataEsecuzione)) return true;
  if (num(record.km) !== null || num(record.ore) !== null) return true;
  return num(record.importo) !== null;
}

/** Replica di resolveLegacyManutenzioneStato: stato GREZZO se presente, altrimenti derivato. */
function derivedStato(record) {
  const raw = text(record.stato);
  if (raw) return raw;
  return hasExecutionFields(record) ? "eseguita(derivato)" : "daFare(derivato)";
}

/** Record MOSTRATO come da-fare ma con stato GREZZO assente -> il writer di
 *  raggruppamento (che legge lo stato grezzo) lo rifiuta con "stato mancante". */
function isDerivedDaFareSenzaStato(record) {
  return !text(record.stato) && !hasExecutionFields(record);
}

function auditAll(manutenzioni) {
  line(`# AUDIT GLOBALE @manutenzioni (${manutenzioni.length} record)`);
  line(`filtro ricerca targa contiene: ${SEARCH_TERM || "(nessuno)"}`);

  // 1) Divergenza data vs dataEsecuzione
  const diverg = manutenzioni.filter((r) => {
    const d = text(r.data);
    const de = text(r.dataEsecuzione);
    return d && de && d !== de;
  });
  line(`\n## 1) DIVERGENZA data != dataEsecuzione (${diverg.length})`);
  diverg.slice(0, 60).forEach((r) => {
    line(`   ${text(r.id).slice(0, 24).padEnd(24)} targa=${text(r.targa).padEnd(10)} data=${text(r.data)} | dataEsecuzione=${text(r.dataEsecuzione)} | stato=${text(r.stato) || "(assente)"}`);
  });

  // 2) Distribuzione stato GREZZO
  const byStato = new Map();
  for (const r of manutenzioni) {
    const k = text(r.stato) || "(assente)";
    byStato.set(k, (byStato.get(k) || 0) + 1);
  }
  line(`\n## 2) DISTRIBUZIONE stato GREZZO (campo persistito)`);
  for (const [k, n] of [...byStato.entries()].sort((a, b) => b[1] - a[1])) {
    line(`   ${String(k).padEnd(20)} ${n}`);
  }

  // 3) Da-fare ingroupabili (MOSTRATI da-fare ma stato grezzo assente)
  const ungroup = manutenzioni.filter(isDerivedDaFareSenzaStato);
  line(`\n## 3) 'DA FARE' DERIVATI NON RAGGRUPPABILI (mostrati da-fare ma stato grezzo assente -> writer rifiuta) (${ungroup.length})`);
  ungroup.slice(0, 60).forEach((r) => {
    line(`   ${text(r.id).slice(0, 24).padEnd(24)} idReale=${hasRealId(r)} targa=${text(r.targa).padEnd(10)} data=${text(r.data)} desc="${snippet(r.descrizione, 40)}"`);
  });

  // 4) Id sintetici (anch'essi non raggruppabili)
  const synthetic = manutenzioni.filter((r) => !hasRealId(r));
  line(`\n## 4) RECORD CON ID SINTETICO/ASSENTE (non raggruppabili) (${synthetic.length})`);
  synthetic.slice(0, 30).forEach((r) => {
    line(`   id="${text(r.id)}" targa=${text(r.targa)} stato=${text(r.stato) || "(assente)"}`);
  });

  // 5) Ricerca targa
  if (SEARCH_TERM) {
    const found = manutenzioni.filter((r) =>
      [r.targa, r.targaCamion, r.targaRimorchio, r.targaMotrice]
        .map((t) => text(t).toUpperCase())
        .some((t) => t.includes(SEARCH_TERM)),
    );
    line(`\n## 5) MANUTENZIONI con targa contenente "${SEARCH_TERM}" (${found.length})`);
    found.slice(0, 60).forEach((r) => {
      line(`   ${text(r.id).slice(0, 24).padEnd(24)} targa=${text(r.targa).padEnd(10)} statoGrezzo=${(text(r.stato) || "(assente)").padEnd(10)} mostrato=${derivedStato(r).padEnd(18)} data=${text(r.data)} desc="${snippet(r.descrizione, 30)}"`);
    });
  }
  line(`\n## DONE (audit)`);
}

async function main() {
  const ctx = await getInternalAiFirebaseAdminReadonlyContext();
  if (ctx.status !== "ready" || !ctx.firestore) {
    const mode = ctx.runtimeProbe?.credential?.mode ?? "unknown";
    throw new Error(`Firestore readonly non pronto: status=${ctx.status} credential.mode=${mode}`);
  }
  const db = ctx.firestore;

  if (AUDIT_MODE) {
    const manutenzioni = await readStorageList(db, KEY_MANUTENZIONI);
    auditAll(manutenzioni);
    return;
  }

  const [manutenzioni, segnalazioni, controlli] = await Promise.all([
    readStorageList(db, KEY_MANUTENZIONI),
    readStorageList(db, KEY_SEGNALAZIONI),
    readStorageList(db, KEY_CONTROLLI),
  ]);

  const man = manutenzioni.filter(matchesTarga);
  const seg = segnalazioni.filter(matchesTarga);
  const ctrl = controlli.filter(matchesTarga);

  line(`# DIAGNOSI MANUTENZIONE — targa ${TARGA}`);
  line(`credential.mode=${ctx.runtimeProbe?.credential?.mode ?? "unknown"} | TZ offset(min)=${new Date().getTimezoneOffset()}`);
  line(`@manutenzioni totali=${manutenzioni.length} (targa=${man.length}) | @segnalazioni totali=${segnalazioni.length} (targa=${seg.length}) | @controlli totali=${controlli.length} (targa=${ctrl.length})`);
  line("");

  line(`## MANUTENZIONI (${man.length})`);
  man
    .slice()
    .sort((a, b) => text(b.data).localeCompare(text(a.data)))
    .forEach((r, i) => {
      line(`\n[${i + 1}] id=${text(r.id)}`);
      line(`    statoGrezzo=${text(r.stato) || "(assente)"} -> statoMostrato=${derivedStato(r)} | tipo=${text(r.tipo)} | gommeInterventoTipo=${text(r.gommeInterventoTipo) || "—"}`);
      line(`    descrizione="${snippet(r.descrizione, 80)}"`);
      line(`    data="${text(r.data)}" -> ${isoToDisplay(r.data) || "?"}`);
      line(`    dataEsecuzione="${text(r.dataEsecuzione)}" -> ${isoToDisplay(r.dataEsecuzione) || "—"}`);
      line(`    dataProgrammata="${text(r.dataProgrammata)}" -> ${isoToDisplay(r.dataProgrammata) || "—"}`);
      line(`    chiusuraDi=${text(r.chiusuraDi) || "—"} | chiusuraRefId=${text(r.chiusuraRefId) || "—"}`);
      line(`    chiusuraData: ${msInfo(r.chiusuraData)}`);
      line(`    timestamp: ${msInfo(r.timestamp)} | createdAt: ${msInfo(r.createdAt)} | updatedAt: ${msInfo(r.updatedAt)}`);
      line(`    km=${text(r.km) || "—"} | gruppoManutenzioneId=${text(r.gruppoManutenzioneId) || "—"}`);
      line(`    origineTipo=${text(r.origineTipo) || "—"} | origineRefId=${text(r.origineRefId) || "—"} | origineRefKey=${text(r.origineRefKey) || "—"}`);
      if (Array.isArray(r.origineRefs) && r.origineRefs.length) {
        line(`    origineRefs=${JSON.stringify(r.origineRefs)}`);
      }
    });

  line(`\n\n## SEGNALAZIONI (${seg.length})`);
  seg
    .slice()
    .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0))
    .forEach((r, i) => {
      line(`\n[${i + 1}] id=${text(r.id)}`);
      line(`    stato=${text(r.stato) || "—"} | chiusa=${r.chiusa === true ? "true" : r.chiusa === false ? "false" : "—"} | letta=${r.letta === true ? "true" : "—"}`);
      line(`    tipoProblema=${text(r.tipoProblema) || text(r.tipo) || "—"} | descrizione="${snippet(r.descrizione, 80)}"`);
      line(`    timestamp: ${msInfo(r.timestamp)}`);
      line(`    dataChiusura: ${msInfo(r.dataChiusura)} | chiusuraData: ${msInfo(r.chiusuraData)}`);
      line(`    chiusuraDi=${text(r.chiusuraDi) || "—"} | chiusuraRefId=${text(r.chiusuraRefId) || "—"} | chiusaBy=${text(r.chiusaBy) || text(r.chiusa_by) || "—"}`);
      line(`    linkedLavoroId=${text(r.linkedLavoroId) || "—"} | linkedLavoroIds=${Array.isArray(r.linkedLavoroIds) ? JSON.stringify(r.linkedLavoroIds) : "—"}`);
      line(`    gruppoSegnalazioneId=${text(r.gruppoSegnalazioneId) || "—"} | gruppoSegnalazione=${text(r.gruppoSegnalazione) || "—"}`);
      const extraKeys = Object.keys(r).filter((k) => /grupp|delete|cancell|hidden|nascost|archiv/i.test(k));
      if (extraKeys.length) {
        line(`    altri-campi-rilevanti: ${extraKeys.map((k) => `${k}=${JSON.stringify(r[k])}`).join(" | ")}`);
      }
    });

  // Raggruppamenti
  line(`\n\n## GRUPPI MANUTENZIONI (gruppoManutenzioneId)`);
  const grpMan = new Map();
  for (const r of man) {
    const g = text(r.gruppoManutenzioneId);
    if (!g) continue;
    if (!grpMan.has(g)) grpMan.set(g, []);
    grpMan.get(g).push(r);
  }
  if (grpMan.size === 0) line("   (nessun gruppo manutenzioni)");
  for (const [g, list] of grpMan) {
    line(`   gruppo ${g}: ${list.length} record -> [${list.map((r) => `${text(r.id).slice(0, 8)}(${isoToDisplay(r.data) || "?"})`).join(", ")}]`);
  }

  line(`\n## GRUPPI SEGNALAZIONI (gruppoSegnalazioneId)`);
  const grpSeg = new Map();
  for (const r of seg) {
    const g = text(r.gruppoSegnalazioneId);
    if (!g) continue;
    if (!grpSeg.has(g)) grpSeg.set(g, []);
    grpSeg.get(g).push(r);
  }
  if (grpSeg.size === 0) line("   (nessun gruppo segnalazioni)");
  for (const [g, list] of grpSeg) {
    line(`   gruppo ${g}: ${list.length} record -> [${list.map((r) => `${text(r.id).slice(0, 8)}`).join(", ")}]`);
  }

  line(`\n\n## DONE`);
}

main().catch((err) => {
  console.error("ERRORE diagnosi:", err);
  process.exit(1);
});
