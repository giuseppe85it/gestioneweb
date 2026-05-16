/**
 * cleanup-timestamps-live-2026-05-15.cjs
 * ----------------------------------------------------------------------------
 * PROMPT 51 FASE 1+2 — Ripulitura timestamp sporchi su Firestore LIVE.
 *
 * Identifica e corregge:
 *
 *  CHECK_R1 — `chiusuraData` incoerente con la manutenzione collegata:
 *    record (segnalazione/controllo) ha `chiusuraRefId` valorizzato e `chiusuraData`
 *    differente (anche solo come giorno ISO) dalla data della manutenzione target.
 *    Correzione: `chiusuraData = parseISO(target.data)` (mezzanotte locale del giorno
 *    manutenzione).
 *
 *  CHECK_R2 — `dataPresaInCarico` artefatto:
 *    record segnalazione ha `dataPresaInCarico` valorizzato E `chiusuraRefId`
 *    valorizzato (= chiusa via aggancio) E `dataPresaInCarico` ricade nello stesso
 *    giorno della scrittura `chiusuraData` artefatta (= oggi 15/05) o nello stesso
 *    giorno della data manutenzione target.
 *    Correzione: rimuovi `dataPresaInCarico` (set to FieldValue.delete()).
 *
 * Modalita': DRY_RUN=true (default) — non scrive, produce report.
 *            DRY_RUN=false → scrive su Firestore live.
 *
 * Uso:
 *   node scripts/oneoff/cleanup-timestamps-live-2026-05-15.cjs                 # DRY
 *   DRY_RUN=false node scripts/oneoff/cleanup-timestamps-live-2026-05-15.cjs   # REAL
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
const MANUTENZIONI_KEY = "@manutenzioni";
const SEGNALAZIONI_KEY = "@segnalazioni_autisti_tmp";
const CONTROLLI_KEY = "@controlli_mezzo_autisti";

const DRY_RUN = process.env.DRY_RUN !== "false";
const OUT_DRY = path.resolve(process.cwd(), "scripts", "oneoff", "cleanup-timestamps-live-DRY.json");
const OUT_REAL = path.resolve(process.cwd(), "scripts", "oneoff", "cleanup-timestamps-live-REAL.json");

function normalizeText(value) {
  return String(value ?? "").trim();
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

function parseDataIsoMs(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const dt = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 0, 0, 0, 0);
    return Number.isFinite(dt.getTime()) ? dt.getTime() : null;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDayKey(ms) {
  if (typeof ms !== "number" || !Number.isFinite(ms)) return "";
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toDisplay(ms) {
  if (typeof ms !== "number" || !Number.isFinite(ms)) return "—";
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

async function getFirestore() {
  const ctx = await getInternalAiFirebaseAdminReadonlyContext();
  if (ctx.status !== "ready" || !ctx.firestore) {
    throw new Error(`Firebase Admin non pronto: status=${ctx.status}`);
  }
  return ctx.firestore;
}

async function readStorageDoc(firestore, key) {
  const snap = await firestore.collection(STORAGE_COLLECTION).doc(key).get();
  if (!snap.exists) return { exists: false, raw: null, list: [] };
  const raw = snap.data();
  return { exists: true, raw, list: unwrapList(raw) };
}

async function writeStorageDoc(firestore, key, raw) {
  // Mantieni la shape esistente: il documento e' `{ value: [...] }`.
  // Riusiamo l'oggetto raw esistente, sostituendone solo `value`.
  await firestore.collection(STORAGE_COLLECTION).doc(key).set(raw, { merge: false });
}

async function main() {
  const firestore = await getFirestore();
  console.log(`CLEANUP TIMESTAMPS LIVE — DRY_RUN=${DRY_RUN}`);
  console.log("");

  const manuDoc = await readStorageDoc(firestore, MANUTENZIONI_KEY);
  const segDoc = await readStorageDoc(firestore, SEGNALAZIONI_KEY);
  const ctrlDoc = await readStorageDoc(firestore, CONTROLLI_KEY);

  console.log(
    `[live] manutenzioni=${manuDoc.list.length} segnalazioni=${segDoc.list.length} controlli=${ctrlDoc.list.length}`,
  );

  const manuById = new Map();
  for (const m of manuDoc.list) {
    const id = normalizeText(m.id);
    if (id) manuById.set(id, m);
  }

  const r1Mismatch = [];
  const r2Artefatto = [];

  // CHECK_R1: chiusuraData != data manutenzione target (mismatch giorno)
  for (const { list, kind } of [
    { list: segDoc.list, kind: "segnalazione" },
    { list: ctrlDoc.list, kind: "controllo" },
  ]) {
    for (const rec of list) {
      const refId = normalizeText(rec.chiusuraRefId);
      if (!refId) continue;
      const target = manuById.get(refId);
      if (!target) continue;
      const targetMs = parseDataIsoMs(target.data);
      if (targetMs === null) continue;
      const currentMs =
        typeof rec.chiusuraData === "number" && Number.isFinite(rec.chiusuraData)
          ? rec.chiusuraData
          : null;
      if (currentMs === null) continue;
      const sameDay = toDayKey(currentMs) === toDayKey(targetMs);
      if (sameDay) continue;
      r1Mismatch.push({
        kind,
        id: normalizeText(rec.id),
        chiusuraRefId: refId,
        targa:
          normalizeText(rec.targa) ||
          normalizeText(rec.targaCamion) ||
          normalizeText(rec.targaRimorchio),
        autistaNome: normalizeText(rec.autistaNome) || null,
        before: { chiusuraData: currentMs, display: toDisplay(currentMs) },
        after: { chiusuraData: targetMs, display: toDisplay(targetMs) },
        manutenzioneData: target.data ?? null,
      });
    }
  }

  // CHECK_R2: dataPresaInCarico artefatto sulle segnalazioni
  for (const rec of segDoc.list) {
    const dpic = rec.dataPresaInCarico;
    if (typeof dpic !== "string" || !dpic.trim()) continue;
    const dpicMs = parseDataIsoMs(dpic);
    if (dpicMs === null) continue;
    const refId = normalizeText(rec.chiusuraRefId);
    if (!refId) continue; // R2 si applica solo a segnalazioni linked

    const chiusuraMs =
      typeof rec.chiusuraData === "number" && Number.isFinite(rec.chiusuraData)
        ? rec.chiusuraData
        : null;
    const target = manuById.get(refId) || null;
    const targetMs = target ? parseDataIsoMs(target.data) : null;

    let motivo = "";
    if (chiusuraMs !== null && toDayKey(dpicMs) === toDayKey(chiusuraMs)) {
      motivo = "stessoGiornoDiChiusuraDi";
    } else if (targetMs !== null && toDayKey(dpicMs) === toDayKey(targetMs)) {
      motivo = "stessoGiornoManutenzioneTarget";
    } else {
      // Heuristica aggiuntiva: dataPresaInCarico === oggi (giorno corrente del run)
      // → artefatto di click recente.
      const today = toDayKey(Date.now());
      if (toDayKey(dpicMs) === today) {
        motivo = "stessoGiornoDiOggi";
      } else {
        continue;
      }
    }

    r2Artefatto.push({
      kind: "segnalazione",
      id: normalizeText(rec.id),
      targa:
        normalizeText(rec.targa) ||
        normalizeText(rec.targaCamion) ||
        normalizeText(rec.targaRimorchio),
      autistaNome: normalizeText(rec.autistaNome) || null,
      before: { dataPresaInCarico: dpic },
      after: { dataPresaInCarico: null },
      motivo,
      chiusuraRefId: refId,
      chiusuraData: chiusuraMs,
    });
  }

  // Output preview
  console.log(`CHECK_R1 chiusuraData mismatch: ${r1Mismatch.length}`);
  for (const entry of r1Mismatch.slice(0, 10)) {
    console.log(
      `  ${entry.kind} ${entry.id} (${entry.targa} ${entry.autistaNome ?? "-"}) ${entry.before.display} → ${entry.after.display}`,
    );
  }
  console.log("");
  console.log(`CHECK_R2 dataPresaInCarico artefatto: ${r2Artefatto.length}`);
  for (const entry of r2Artefatto.slice(0, 10)) {
    console.log(
      `  ${entry.kind} ${entry.id} (${entry.targa} ${entry.autistaNome ?? "-"}) dataPresaInCarico ${entry.before.dataPresaInCarico} → null  [${entry.motivo}]`,
    );
  }
  console.log("");

  const totale = r1Mismatch.length + r2Artefatto.length;
  console.log(`Totale record da correggere: ${totale}`);

  // STOP HARD: se >= 20 e DRY → ferma prima della scrittura
  if (DRY_RUN && totale >= 20) {
    console.log(
      `\nSTOP HARD: ${totale} record >= 20. Rivedere heuristica prima di procedere a DRY_RUN=false.`,
    );
  }

  // Applica correzioni se DRY_RUN=false
  let segPatched = 0;
  let ctrlPatched = 0;
  if (!DRY_RUN) {
    console.log("\n[apply] DRY_RUN=false — applico correzioni su Firestore live");
    // Indice id → patch
    const segPatchById = new Map();
    const ctrlPatchById = new Map();
    for (const entry of r1Mismatch) {
      const map = entry.kind === "segnalazione" ? segPatchById : ctrlPatchById;
      const existing = map.get(entry.id) || {};
      existing.chiusuraData = entry.after.chiusuraData;
      map.set(entry.id, existing);
    }
    for (const entry of r2Artefatto) {
      const existing = segPatchById.get(entry.id) || {};
      existing.dataPresaInCarico = null;
      segPatchById.set(entry.id, existing);
    }

    // Patch segnalazioni
    const nextSegList = segDoc.list.map((rec) => {
      const patch = segPatchById.get(normalizeText(rec.id));
      if (!patch) return rec;
      segPatched += 1;
      return { ...rec, ...patch };
    });
    const nextCtrlList = ctrlDoc.list.map((rec) => {
      const patch = ctrlPatchById.get(normalizeText(rec.id));
      if (!patch) return rec;
      ctrlPatched += 1;
      return { ...rec, ...patch };
    });

    if (segPatched > 0) {
      const nextRaw = { ...(segDoc.raw || {}), value: nextSegList };
      await writeStorageDoc(firestore, SEGNALAZIONI_KEY, nextRaw);
      console.log(`  [write] segnalazioni patched=${segPatched}`);
    }
    if (ctrlPatched > 0) {
      const nextRaw = { ...(ctrlDoc.raw || {}), value: nextCtrlList };
      await writeStorageDoc(firestore, CONTROLLI_KEY, nextRaw);
      console.log(`  [write] controlli patched=${ctrlPatched}`);
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: DRY_RUN,
    counts: {
      manutenzioniTotal: manuDoc.list.length,
      segnalazioniTotal: segDoc.list.length,
      controlliTotal: ctrlDoc.list.length,
      r1Mismatch: r1Mismatch.length,
      r2Artefatto: r2Artefatto.length,
      segPatched: DRY_RUN ? 0 : segPatched,
      ctrlPatched: DRY_RUN ? 0 : ctrlPatched,
    },
    r1Mismatch,
    r2Artefatto,
  };
  const outPath = DRY_RUN ? OUT_DRY : OUT_REAL;
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`\nReport: ${outPath}`);

  if (DRY_RUN && totale > 0 && totale < 20) {
    console.log(`\nDRY OK. Riesegui con DRY_RUN=false per applicare le ${totale} correzioni.`);
  } else if (DRY_RUN && totale === 0) {
    console.log("\nNessun record da correggere. Nessuna azione necessaria.");
  }
}

main().catch((err) => {
  console.error("ERRORE CLEANUP P51:", err);
  process.exitCode = 1;
});
