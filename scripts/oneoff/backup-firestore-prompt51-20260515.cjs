/**
 * backup-firestore-prompt51-20260515.cjs
 * ----------------------------------------------------------------------------
 * PROMPT 51 FASE 0 — Backup READ-ONLY del Firestore live, fresco, PRIMA della
 * ripulitura timestamp sporchi (PROMPT 51 FASE 1+2).
 *
 * Esporta in JSON pretty:
 *  - storage/@manutenzioni
 *  - storage/@segnalazioni_autisti_tmp
 *  - storage/@controlli_mezzo_autisti
 *
 * Output dir: C:\tmp\backup_firestore_prompt51_<YYYYMMDD>_<hhmmss>\
 *
 * Uso: node scripts/oneoff/backup-firestore-prompt51-20260515.cjs
 * ----------------------------------------------------------------------------
 */

"use strict";

const fs = require("fs");
const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "..", "..", "backend", "internal-ai", ".env"),
});
const {
  getInternalAiFirebaseAdminReadonlyContext,
} = require("../../backend/internal-ai/server/internal-ai-firebase-admin.js");

const STORAGE_COLLECTION = "storage";
const KEYS = ["@manutenzioni", "@segnalazioni_autisti_tmp", "@controlli_mezzo_autisti"];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function nowStamp() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
  const hms = `${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
  return `${ymd}_${hms}`;
}

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
  const stamp = nowStamp();
  const outDir = path.join("C:\\tmp", `backup_firestore_prompt51_${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });
  console.log(`[backup-P51] out dir: ${outDir}`);

  const firestore = await getFirestore();
  const summary = { generatedAt: new Date().toISOString(), outDir, files: [] };

  for (const key of KEYS) {
    const safe = key.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filePath = path.join(outDir, `${safe}.json`);
    const snap = await firestore.collection(STORAGE_COLLECTION).doc(key).get();
    const raw = snap.exists ? snap.data() : null;
    const count = unwrapList(raw).length;
    fs.writeFileSync(
      filePath,
      JSON.stringify(
        {
          meta: {
            key,
            collection: STORAGE_COLLECTION,
            exists: snap.exists,
            recordCount: count,
            exportedAt: new Date().toISOString(),
          },
          raw,
        },
        null,
        2,
      ),
      "utf8",
    );
    summary.files.push({ key, filePath, count, exists: snap.exists });
    console.log(`  [export] ${key} → ${count} record (${path.basename(filePath)})`);
  }

  const summaryPath = path.join(outDir, "_summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");
  console.log(`[summary] ${summaryPath}`);
  console.log(`BACKUP_DIR=${outDir}`);
}

main().catch((err) => {
  console.error("ERRORE BACKUP P51:", err);
  process.exitCode = 1;
});
