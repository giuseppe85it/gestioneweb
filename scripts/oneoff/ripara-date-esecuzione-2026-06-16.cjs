"use strict";

/**
 * RIPARAZIONE date manutenzioni: allinea `dataEsecuzione` a `data`.
 *
 * Bug storico: modificando una manutenzione ESEGUITA il campo `data` veniva
 * aggiornato ma `dataEsecuzione` no -> dashboard (legge `data`) e dettaglio
 * (legge `dataEsecuzione`) mostravano date diverse. Il fix di codice impedisce
 * nuove divergenze; questo script ripara i record gia' divergenti esistenti.
 *
 * Regola: per i record con `data` e `dataEsecuzione` ENTRAMBI valorizzati e
 * DIVERSI, imposta `dataEsecuzione = data` (la `data` guida dashboard, ordinamento
 * e chiusura segnalazioni: e' la fonte attiva).
 *
 * Sola lettura di default (DRY). Scrive solo con `--apply`.
 *   node scripts/oneoff/ripara-date-esecuzione-2026-06-16.cjs           # DRY
 *   node scripts/oneoff/ripara-date-esecuzione-2026-06-16.cjs --apply   # SCRIVE
 */

const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "..", "..", "backend", "internal-ai", ".env"),
});
const {
  getInternalAiFirebaseAdminReadonlyContext,
} = require("../../backend/internal-ai/server/internal-ai-firebase-admin.js");

const STORAGE_COLLECTION = "storage";
const MANUTENZIONI_KEY = "@manutenzioni";
const APPLY = process.argv.includes("--apply");

function text(v) {
  return String(v ?? "").trim();
}
function isRecord(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Individua la chiave dell'array dentro il documento storage e l'array stesso. */
function resolveArray(raw) {
  if (Array.isArray(raw)) return { key: null, arr: raw };
  if (isRecord(raw) && Array.isArray(raw.value)) return { key: "value", arr: raw.value };
  if (isRecord(raw) && Array.isArray(raw.items)) return { key: "items", arr: raw.items };
  return { key: null, arr: [] };
}

async function main() {
  const ctx = await getInternalAiFirebaseAdminReadonlyContext();
  if (ctx.status !== "ready" || !ctx.firestore) {
    throw new Error(`Firebase Admin non pronto: status=${ctx.status}`);
  }
  const db = ctx.firestore;

  console.log(`RIPARAZIONE dataEsecuzione -> data | modalita=${APPLY ? "APPLY (scrive)" : "DRY-RUN"}`);

  const docRef = db.collection(STORAGE_COLLECTION).doc(MANUTENZIONI_KEY);
  const snap = await docRef.get();
  if (!snap.exists) {
    console.log("Documento @manutenzioni non trovato.");
    return;
  }
  const raw = snap.data();
  const { key: arrKey, arr } = resolveArray(raw);
  console.log(`@manutenzioni: ${arr.length} record (arrayKey=${arrKey ?? "root"})`);

  const changes = [];
  const nextArr = arr.map((rec) => {
    if (!isRecord(rec)) return rec;
    const data = text(rec.data);
    const dataEsec = text(rec.dataEsecuzione);
    if (data && dataEsec && data !== dataEsec) {
      changes.push({ id: text(rec.id), targa: text(rec.targa), data, da: dataEsec, a: data });
      return { ...rec, dataEsecuzione: data };
    }
    return rec;
  });

  console.log(`\nRecord da riparare: ${changes.length}`);
  for (const c of changes) {
    console.log(`  id=${c.id} targa=${c.targa} | dataEsecuzione ${c.da} -> ${c.a} (= data ${c.data})`);
  }

  if (changes.length === 0) {
    console.log("\nNiente da fare.");
    return;
  }

  if (!APPLY) {
    console.log("\nDRY-RUN: nessuna scrittura. Rilancia con --apply per applicare.");
    return;
  }

  const nextRaw = arrKey ? { ...raw, [arrKey]: nextArr } : nextArr;
  await docRef.set(nextRaw, { merge: false });
  console.log("\nSCRITTO su Firestore. Verifica:");
  const after = resolveArray((await docRef.get()).data()).arr;
  for (const c of changes) {
    const rec = after.find((r) => text(r.id) === c.id);
    console.log(`  id=${c.id} -> dataEsecuzione=${text(rec && rec.dataEsecuzione)} (atteso ${c.a})`);
  }
}

main().catch((err) => {
  console.error("ERRORE riparazione:", err);
  process.exit(1);
});
