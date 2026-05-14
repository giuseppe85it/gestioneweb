/**
 * chiudi-dafare-gomme-orfana-2026-05-14.cjs
 * ----------------------------------------------------------------------------
 * Script una-tantum per chiudere retroattivamente la singola daFare gomme
 * matched dal discovery PROMPT 33.
 *
 * USO CONSIGLIATO:
 *   DRY_RUN=true  node scripts/oneoff/chiudi-dafare-gomme-orfana-2026-05-14.cjs
 *   DRY_RUN=false node scripts/oneoff/chiudi-dafare-gomme-orfana-2026-05-14.cjs
 *
 * Non viene eseguito dal PROMPT 34: il lancio resta manuale a Giuseppe.
 * ----------------------------------------------------------------------------
 */

"use strict";

const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "..", "..", "backend", "internal-ai", ".env"),
});
const {
  getInternalAiFirebaseAdminReadonlyContext,
} = require("../../backend/internal-ai/server/internal-ai-firebase-admin.js");

const STORAGE_COLLECTION = "storage";
const KEY_MANUTENZIONI = "@manutenzioni";
const ID_DAFARE = "from-lavoro-a5ba1512-2961-40a9-9c00-a27b6559bef2";
const ID_GOMME_EVENTO = "554348b3-f6ec-40e8-a861-6873af7cce56";
const DRY_RUN = process.env.DRY_RUN === "true";

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

async function getFirestore() {
  const adminContext = await getInternalAiFirebaseAdminReadonlyContext();
  if (adminContext.status !== "ready" || !adminContext.firestore) {
    const mode = adminContext.runtimeProbe?.credential?.mode ?? "unknown";
    throw new Error(`Firebase Admin non pronto: context.status=${adminContext.status} credential.mode=${mode}`);
  }
  return adminContext.firestore;
}

async function main() {
  const firestore = await getFirestore();
  const ref = firestore.collection(STORAGE_COLLECTION).doc(KEY_MANUTENZIONI);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Documento storage/${KEY_MANUTENZIONI} non trovato.`);

  const raw = snap.data()?.value ?? null;
  const list = unwrapList(raw);
  let updated = 0;
  const chiusuraData = Date.now();
  const nextList = list.map((record) => {
    if (String(record.id ?? "").trim() !== ID_DAFARE) return record;
    updated += 1;
    return {
      ...record,
      stato: "chiusa_da_evento",
      chiusuraDi: "gomme_evento",
      chiusuraRefId: ID_GOMME_EVENTO,
      chiusuraData,
    };
  });

  if (updated !== 1) {
    throw new Error(`Atteso 1 record da aggiornare, trovati ${updated}. Nessuna scrittura eseguita.`);
  }

  if (DRY_RUN) {
    console.log("[DRY RUN] Aggiornerei storage/@manutenzioni con:");
    console.log({
      id: ID_DAFARE,
      stato: "chiusa_da_evento",
      chiusuraDi: "gomme_evento",
      chiusuraRefId: ID_GOMME_EVENTO,
      chiusuraData,
    });
    console.log("DRY RUN COMPLETATO. Nessuna scrittura Firestore eseguita.");
    return;
  }

  await ref.update({ value: nextList });
  console.log("CHIUSURA RETROATTIVA COMPLETATA. 1 record aggiornato.");
}

main().catch((error) => {
  console.error("CHIUSURA RETROATTIVA FALLITA:", error);
  process.exitCode = 1;
});
