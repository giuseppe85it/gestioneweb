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
const REPORT_PATH = path.resolve(
  __dirname,
  "migrate-dates-report-DRY.json",
);

// Fonte unica: docs/_live/AUDIT_DATE_FORMATO_NEXT_2026-05-14.md
// R1: NextManutenzioniPage.fromDateInputValue scrive @manutenzioni.data come "GG MM AAAA".
const AUDIT_TARGETS = [
  {
    collection: "@manutenzioni",
    storageDocId: "@manutenzioni",
    fields: ["data"],
    auditRef: "AUDIT_DATE_FORMATO_NEXT_2026-05-14.md:R1 / NextManutenzioniPage.tsx:231",
  },
];

const LEGACY_SPACE_RE = /^(\d{1,2})\s+(\d{1,2})\s+(\d{4})$/;
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_LIKE_FIELD_RE = /(^data$|data|date|timestamp|createdAt|updatedAt|chiusura)/i;

function pad2(value) {
  return String(value).padStart(2, "0");
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function unwrapStorageList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(isPlainObject);
  if (isPlainObject(raw)) {
    if (Array.isArray(raw.value)) return raw.value.filter(isPlainObject);
    if (Array.isArray(raw.items)) return raw.items.filter(isPlainObject);
  }
  return [];
}

function buildLocalDate(year, month, day) {
  const parsed = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function parseLegacySpaceToISO(value) {
  if (typeof value !== "string") return null;
  const match = value.trim().match(LEGACY_SPACE_RE);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const parsed = buildLocalDate(year, month, day);
  if (!parsed) return null;

  return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
}

function parseAnyDateLike(value) {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    if (!Number.isFinite(value) || Number.isNaN(value)) return null;
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }

  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null;
  }

  if (isPlainObject(value)) {
    if (typeof value.toDate === "function") {
      const parsed = value.toDate();
      return parsed instanceof Date && Number.isFinite(parsed.getTime()) ? parsed : null;
    }
    if (typeof value.toMillis === "function") {
      const parsed = new Date(Number(value.toMillis()));
      return Number.isFinite(parsed.getTime()) ? parsed : null;
    }
    if (typeof value.seconds === "number") {
      const millisFromNanos =
        typeof value.nanoseconds === "number" ? Math.floor(value.nanoseconds / 1_000_000) : 0;
      const parsed = new Date(value.seconds * 1000 + millisFromNanos);
      return Number.isFinite(parsed.getTime()) ? parsed : null;
    }
    if (typeof value._seconds === "number") {
      const millisFromNanos =
        typeof value._nanoseconds === "number" ? Math.floor(value._nanoseconds / 1_000_000) : 0;
      const parsed = new Date(value._seconds * 1000 + millisFromNanos);
      return Number.isFinite(parsed.getTime()) ? parsed : null;
    }
    return null;
  }

  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  const legacySpace = parseLegacySpaceToISO(raw);
  if (legacySpace) return new Date(`${legacySpace}T00:00:00`);

  const legacyItalian = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (legacyItalian) {
    const day = Number(legacyItalian[1]);
    const month = Number(legacyItalian[2]);
    const year = Number(legacyItalian[3]);
    const hours = legacyItalian[4] ? Number(legacyItalian[4]) : 0;
    const minutes = legacyItalian[5] ? Number(legacyItalian[5]) : 0;
    const parsed = new Date(year, month - 1, day, hours, minutes, 0, 0);
    if (
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day &&
      parsed.getHours() === hours &&
      parsed.getMinutes() === minutes
    ) {
      return parsed;
    }
    return null;
  }

  const parsed = new Date(raw);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function isAlreadySafeValue(value) {
  if (value === null || value === undefined || value === "") return true;
  if (typeof value === "string" && ISO_RE.test(value.trim())) return true;
  if (typeof value === "object" && value !== null) {
    return (
      typeof value.toDate === "function" ||
      typeof value.toMillis === "function" ||
      typeof value.seconds === "number" ||
      typeof value._seconds === "number"
    );
  }
  return parseAnyDateLike(value) !== null;
}

function readRecordId(record, index) {
  const candidates = [record.id, record.sourceDocumentId, record.uuid, record.key];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    if (typeof candidate === "number" && Number.isFinite(candidate)) return String(candidate);
  }
  return `index:${index}`;
}

async function getFirestore() {
  const adminContext = await getInternalAiFirebaseAdminReadonlyContext();
  if (adminContext.status !== "ready" || !adminContext.firestore) {
    const mode = adminContext.runtimeProbe?.credential?.mode ?? "unknown";
    throw new Error(
      `Firebase Admin non pronto: context.status=${adminContext.status} credential.mode=${mode}`,
    );
  }
  const mode = adminContext.runtimeProbe?.credential?.mode ?? "unknown";
  console.log(`[auth] Firebase Admin context pronto via: ${mode}`);
  return adminContext.firestore;
}

async function scanTarget(db, target) {
  const docRef = db.collection(STORAGE_COLLECTION).doc(target.storageDocId);
  const snap = await docRef.get();
  const data = snap.exists ? snap.data() : null;
  const rawValue = data && Object.prototype.hasOwnProperty.call(data, "value") ? data.value : data;
  const records = unwrapStorageList(rawValue);
  const migratedRecords = records.map((record) => ({ ...record }));
  const targetFields = new Set(target.fields);
  const changes = [];
  const parseErrors = [];
  const runtimeFieldsOutsideAudit = [];
  const runtimeFieldNames = new Set();

  records.forEach((record, index) => {
    const recordId = readRecordId(record, index);

    Object.keys(record).forEach((field) => {
      if (targetFields.has(field) || !DATE_LIKE_FIELD_RE.test(field)) return;
      if (runtimeFieldNames.has(field)) return;
      runtimeFieldNames.add(field);
      runtimeFieldsOutsideAudit.push({
        collection: target.collection,
        field,
        firstRecordId: recordId,
        sampleValue: record[field] ?? null,
        note: "Campo data-like rilevato a runtime ma non elencato come campo storage migrabile dall'audit.",
      });
    });

    target.fields.forEach((field) => {
      if (!Object.prototype.hasOwnProperty.call(record, field)) return;

      const before = record[field];
      const after = parseLegacySpaceToISO(before);

      if (after) {
        migratedRecords[index][field] = after;
        changes.push({
          collection: target.collection,
          documentId: recordId,
          field,
          before,
          after,
        });
        return;
      }

      if (!isAlreadySafeValue(before)) {
        parseErrors.push({
          collection: target.collection,
          documentId: recordId,
          field,
          value: before,
          note: "Valore non interpretabile dal parser compatibile dateUnica né dai legacy parser.",
        });
      }
    });
  });

  let firestoreWritesAttempted = 0;
  if (!DRY_RUN && changes.length > 0) {
    if (runtimeFieldsOutsideAudit.length > 0) {
      throw new Error(
        `Campi data-like fuori audit rilevati in ${target.collection}: migrazione reale bloccata.`,
      );
    }
    firestoreWritesAttempted += 1;
    await docRef.update({ value: migratedRecords });
  }

  return {
    target,
    firestoreDocExists: snap.exists,
    firestoreDocumentsScanned: snap.exists ? 1 : 0,
    logicalDocumentsScanned: records.length,
    fieldsConvertible: changes.length,
    changes,
    parseErrors,
    runtimeFieldsOutsideAudit,
    firestoreWritesAttempted,
  };
}

async function main() {
  if (DRY_RUN !== true) {
    throw new Error("Questo prompt richiede DRY_RUN = true. Ripristinare il flag prima di eseguire.");
  }

  const db = await getFirestore();
  const startedAt = new Date().toISOString();
  const results = [];

  for (const target of AUDIT_TARGETS) {
    results.push(await scanTarget(db, target));
  }

  const totalFirestoreWritesAttempted = results.reduce(
    (sum, result) => sum + result.firestoreWritesAttempted,
    0,
  );
  if (DRY_RUN && totalFirestoreWritesAttempted !== 0) {
    throw new Error(`DRY_RUN ha tentato ${totalFirestoreWritesAttempted} scritture Firestore.`);
  }

  const report = {
    title: "MIGRAZIONE DATE STORAGE ISO - DRY RUN",
    generatedAt: startedAt,
    dryRun: DRY_RUN,
    sourceOfTruth: "docs/_live/AUDIT_DATE_FORMATO_NEXT_2026-05-14.md",
    targets: AUDIT_TARGETS,
    summaryByCollection: Object.fromEntries(
      results.map((result) => [
        result.target.collection,
        {
          firestoreDocumentsScanned: result.firestoreDocumentsScanned,
          logicalDocumentsScanned: result.logicalDocumentsScanned,
          fieldsConvertible: result.fieldsConvertible,
          firestoreWritesAttempted: result.firestoreWritesAttempted,
        },
      ]),
    ),
    top10Examples: results.flatMap((result) => result.changes).slice(0, 10),
    changes: results.flatMap((result) => result.changes),
    campiNonInAuditMaTrovatiInRuntime: results.flatMap(
      (result) => result.runtimeFieldsOutsideAudit,
    ),
    parseErrors: results.flatMap((result) => result.parseErrors),
    firestoreWritesAttempted: totalFirestoreWritesAttempted,
    status:
      totalFirestoreWritesAttempted === 0
        ? "READ_ONLY_DRY_RUN_COMPLETED"
        : "DRY_RUN_WITH_WRITE_ATTEMPT_BLOCKED",
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("DRY_RUN =", DRY_RUN);
  console.log("Report:", REPORT_PATH);
  console.log("Documenti scansionati per collection:");
  for (const result of results) {
    console.log(
      `- ${result.target.collection}: firestoreDocs=${result.firestoreDocumentsScanned}, recordLogici=${result.logicalDocumentsScanned}`,
    );
  }
  console.log("Campi convertibili per collection:");
  for (const result of results) {
    console.log(`- ${result.target.collection}: ${result.fieldsConvertible}`);
  }
  console.log("Scritture Firestore tentate:", totalFirestoreWritesAttempted);
  console.log("READ-ONLY DRY RUN COMPLETED. Nessuna scrittura Firestore eseguita.");
}

main().catch((error) => {
  console.error("[migrate-dates-storage-iso] FAIL", error);
  process.exitCode = 1;
});
