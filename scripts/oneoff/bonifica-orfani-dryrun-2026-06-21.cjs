"use strict";

/**
 * BONIFICA ORFANI — REPORT A SECCO (DRY-RUN, SOLA LETTURA, ZERO SCRITTURE).
 *
 * Mostra esattamente cosa una bonifica andrebbe a sistemare, SENZA toccare nulla:
 *   A) ORIGINI ORFANE: manutenzioni con origineRefs/origineRefId che puntano a una
 *      segnalazione/controllo NON piu' esistente. La bonifica rimuoverebbe quel
 *      riferimento orfano (removeLegameOrigine), lasciando intatte le origini valide.
 *   B) LINK ORFANI: segnalazioni/controlli con linkedLavoroId/linkedLavoroIds che
 *      puntano a una manutenzione NON piu' esistente. La bonifica azzererebbe il
 *      solo forward-link orfano (la sorgente torna operativa).
 *
 * NON modifica alcun dato. Per applicare servira' un passaggio separato ed esplicito.
 *
 * Uso:  node scripts/oneoff/bonifica-orfani-dryrun-2026-06-21.cjs
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

const isRecord = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v) => String(v ?? "").trim();
const line = (s = "") => console.log(s);
const idShort = (v) => text(v).slice(0, 10);

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

/** Raccoglie i riferimenti origine (back-link) di una manutenzione: {tipo, refId}. */
function manutOrigineRefs(r) {
  const out = [];
  const tipo0 = text(r.origineTipo);
  const refId0 = text(r.origineRefId);
  if (refId0) out.push({ tipo: tipo0 || "?", refId: refId0, via: "origineRefId" });
  if (Array.isArray(r.origineRefs)) {
    for (const ref of r.origineRefs) {
      if (!isRecord(ref)) continue;
      const refId = text(ref.refId ?? ref.origineRefId ?? ref.origineId);
      const tipo = text(ref.tipo ?? ref.origineTipo) || "?";
      if (refId) out.push({ tipo, refId, via: "origineRefs" });
    }
  }
  return out;
}

/** Forward-link sorgente -> manutenzione. */
function sorgenteLinkIds(r) {
  const ids = [];
  const single = text(r.linkedLavoroId);
  if (single) ids.push(single);
  if (Array.isArray(r.linkedLavoroIds)) {
    for (const x of r.linkedLavoroIds) if (text(x)) ids.push(text(x));
  }
  return [...new Set(ids)];
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

  const segIds = new Set(segn.map((r) => text(r.id)).filter(Boolean));
  const ctrlIds = new Set(ctrl.map((r) => text(r.id)).filter(Boolean));
  const manutIds = new Set(manut.map((r) => text(r.id)).filter(Boolean));

  line(`# BONIFICA ORFANI — REPORT A SECCO (sola lettura)`);
  line(`credential.mode=${ctx.runtimeProbe?.credential?.mode ?? "unknown"}`);
  line(`totali: @manutenzioni=${manut.length} | @segnalazioni=${segn.length} | @controlli=${ctrl.length}`);

  // ===== A) ORIGINI ORFANE sulle manutenzioni =====
  const manutDaPulire = [];
  for (const m of manut) {
    const refs = manutOrigineRefs(m);
    if (refs.length === 0) continue;
    // Orfano = riferimento a una SEGNALAZIONE o CONTROLLO (le uniche sorgenti
    // cancellabili) il cui id non esiste piu'. Gli altri tipi (gomme_evento,
    // evento, manuale) puntano a dataset diversi e NON sono orfani.
    const isSorgenteOrfana = (ref) =>
      (ref.tipo === "segnalazione" || ref.tipo === "controllo") &&
      !segIds.has(ref.refId) &&
      !ctrlIds.has(ref.refId);
    const orfani = refs.filter(isSorgenteOrfana);
    if (orfani.length === 0) continue;
    const validi = refs.filter((ref) => !isSorgenteOrfana(ref));
    manutDaPulire.push({ m, orfani, validiRestanti: validi.length });
  }

  line(`\n================ A) ORIGINI ORFANE (manutenzioni -> sorgente sparita) ================`);
  line(`Manutenzioni con almeno un riferimento origine ORFANO: ${manutDaPulire.length}`);
  const totRefOrfani = manutDaPulire.reduce((acc, x) => acc + x.orfani.length, 0);
  line(`Riferimenti origine orfani totali da rimuovere: ${totRefOrfani}`);
  line(`(la bonifica rimuove SOLO i riferimenti orfani; ${manutDaPulire.filter((x) => x.validiRestanti > 0).length} manutenzioni conservano anche origini valide)`);
  line(`\n  [dettaglio]`);
  for (const x of manutDaPulire) {
    const desc = text(x.m.descrizione).replace(/\s+/g, " ").slice(0, 50);
    const orfStr = x.orfani.map((o) => `${o.tipo}:${idShort(o.refId)}(${o.via})`).join(", ");
    line(`   manut ${idShort(x.m.id).padEnd(11)} stato=${(text(x.m.stato) || "—").padEnd(12)} orfani=[${orfStr}] restano ${x.validiRestanti} origini valide  "${desc}"`);
  }

  // ===== B) LINK ORFANI sulle sorgenti =====
  const sorgentiDaPulire = [];
  for (const [label, list] of [["segnalazione", segn], ["controllo", ctrl]]) {
    for (const s of list) {
      const ids = sorgenteLinkIds(s);
      if (ids.length === 0) continue;
      const orfani = ids.filter((id) => !manutIds.has(id));
      if (orfani.length === 0) continue;
      const validiRestanti = ids.filter((id) => manutIds.has(id)).length;
      sorgentiDaPulire.push({ tipo: label, s, orfani, validiRestanti });
    }
  }

  line(`\n================ B) LINK ORFANI (sorgente -> manutenzione sparita) ================`);
  line(`Sorgenti (segnalazioni/controlli) con linkedLavoroId ORFANO: ${sorgentiDaPulire.length}`);
  line(`\n  [dettaglio]`);
  for (const x of sorgentiDaPulire) {
    const desc = text(x.s.descrizione ?? x.s.note).replace(/\s+/g, " ").slice(0, 50);
    line(`   ${x.tipo.padEnd(12)} ${idShort(x.s.id).padEnd(11)} stato=${(text(x.s.stato) || "—").padEnd(12)} link_orfani=[${x.orfani.map(idShort).join(", ")}] restano ${x.validiRestanti} link validi  "${desc}"`);
  }

  line(`\n## RIEPILOGO`);
  line(`  A) manutenzioni da ripulire (rimozione ref orfani): ${manutDaPulire.length} (${totRefOrfani} ref)`);
  line(`  B) sorgenti da ripulire (azzeramento link orfano):  ${sorgentiDaPulire.length}`);
  line(`\nNESSUN DATO MODIFICATO (dry-run). Per applicare servira' un passaggio separato ed esplicito.`);
  line(`## DONE`);
}

main().catch((err) => {
  console.error("ERRORE bonifica-dryrun:", err);
  process.exit(1);
});
