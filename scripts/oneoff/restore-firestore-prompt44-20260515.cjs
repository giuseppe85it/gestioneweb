/**
 * restore-firestore-prompt44-20260515.cjs
 * ----------------------------------------------------------------------------
 * PROMPT 44 — Script di ROLLBACK COMPLETO Firestore allo stato pre-PROMPT 44.
 *
 * RESTORE script — Cambia DRY_RUN=false e lancialo SOLO se vuoi rollback
 * completo dei dati allo stato pre-PROMPT 44. Sovrascrive le 5 collection con
 * il contenuto dei JSON di backup prodotti da backup-firestore-prompt44-*.cjs.
 *
 * Default: DRY_RUN = true (nessuna scrittura). Verifica conteggi e mostra cosa
 * verrebbe ripristinato.
 *
 * Uso:
 *   node scripts/oneoff/restore-firestore-prompt44-20260515.cjs <BACKUP_DIR>
 *   esempio: node scripts/oneoff/restore-firestore-prompt44-20260515.cjs C:\tmp\backup_firestore_prompt44_20260515_120000
 * ----------------------------------------------------------------------------
 */

"use strict";

const DRY_RUN = true;

const fs = require("fs");
const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "..", "..", "backend", "internal-ai", ".env"),
});
const {
  getInternalAiFirebaseAdminReadonlyContext,
} = require("../../backend/internal-ai/server/internal-ai-firebase-admin.js");

const STORAGE_COLLECTION = "storage";
const KEYS = [
  "@manutenzioni",
  "@segnalazioni_autisti_tmp",
  "@controlli_mezzo_autisti",
  "@gomme_eventi",
  "@officine",
];

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function unwrapList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(isPlainObject);
  if (isPlainObject(raw)) {
    if (Array.isArray(raw.value)) return raw.value.filter(isPlainObject);
    if (Array.isArray(raw.items)) return raw.items.filter(isPlainObject);
  }
  return [];
}

async function getFirestore() {
  const ctx = await getInternalAiFirebaseAdminReadonlyContext();
  if (ctx.status !== "ready" || !ctx.firestore) {
    const mode = ctx.runtimeProbe?.credential?.mode ?? "unknown";
    throw new Error(`Firebase Admin non pronto: status=${ctx.status} credential.mode=${mode}`);
  }
  return ctx.firestore;
}

async function main() {
  const backupDir = process.argv[2];
  if (!backupDir) {
    console.error("USO: node restore-firestore-prompt44-20260515.cjs <BACKUP_DIR>");
    process.exitCode = 1;
    return;
  }
  if (!fs.existsSync(backupDir)) {
    console.error(`Backup dir non esiste: ${backupDir}`);
    process.exitCode = 1;
    return;
  }

  console.log(`[restore] DRY_RUN=${DRY_RUN}`);
  console.log(`[restore] backup dir: ${backupDir}`);

  const firestore = await getFirestore();
  const summary = [];

  for (const key of KEYS) {
    const safe = key.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filePath = path.join(backupDir, `${safe}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`  [skip] ${key}: file mancante ${filePath}`);
      summary.push({ key, restored: false, reason: "file mancante" });
      continue;
    }
    const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const backupCount = unwrapList(payload.raw).length;

    const liveSnap = await firestore.collection(STORAGE_COLLECTION).doc(key).get();
    const liveCount = unwrapList(liveSnap.exists ? liveSnap.data() : null).length;

    console.log(`  [plan] ${key}: live=${liveCount} → backup=${backupCount}`);

    if (DRY_RUN) {
      summary.push({ key, restored: false, reason: "DRY_RUN", liveCount, backupCount });
      continue;
    }

    await firestore.collection(STORAGE_COLLECTION).doc(key).set(payload.raw, { merge: false });
    summary.push({ key, restored: true, liveCount, backupCount });
    console.log(`  [restore] ${key}: scritto (${backupCount} record)`);
  }

  console.log("");
  console.log("[restore] summary:");
  console.log(JSON.stringify(summary, null, 2));

  if (DRY_RUN) {
    console.log("");
    console.log("DRY_RUN=true → nessuna scrittura. Cambia DRY_RUN=false per applicare.");
  } else {
    console.log("");
    console.log("[restore] ROLLBACK APPLICATO.");
  }
}

main().catch((err) => {
  console.error("[restore] errore fatale:", err && err.stack ? err.stack : err);
  process.exitCode = 1;
});
