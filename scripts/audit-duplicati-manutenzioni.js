import { initializeApp } from "firebase/app";
import { doc, getDoc, getFirestore } from "firebase/firestore/lite";

const STORAGE_COLLECTION = "storage";
const MANUTENZIONI_KEY = "@manutenzioni";

// Stessa configurazione client usata dal repo in src/firebase.ts.
const firebaseConfig = {
  apiKey: "AIzaSyD5UVGv-sdjYQnLrva35EQLYxxhjWNGMV4",
  authDomain: "gestionemanutenzione-934ef.firebaseapp.com",
  databaseURL: "https://gestionemanutenzione-934ef-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gestionemanutenzione-934ef",
  storageBucket: "gestionemanutenzione-934ef.firebasestorage.app",
  messagingSenderId: "716845762405",
  appId: "1:716845762405:web:1db7e030d07aaf5ac3e326",
};

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

// Replica letterale della normalizzazione targa del dominio flotta.
function normalizeNextMezzoTarga(value) {
  return normalizeText(value).toUpperCase().replace(/\s+/g, "");
}

function normalizeLegacyTipo(raw) {
  const tipo = normalizeText(raw?.tipo).toLowerCase();
  if (tipo === "compressore") return "compressore";
  if (tipo === "attrezzature") return "attrezzature";

  if (normalizeNumber(raw?.ore) !== null && normalizeNumber(raw?.km) === null) {
    return "compressore";
  }

  return "mezzo";
}

function unwrapStorageArray(rawDoc) {
  if (Array.isArray(rawDoc)) return rawDoc;
  if (Array.isArray(rawDoc?.value)) return rawDoc.value;
  if (Array.isArray(rawDoc?.items)) return rawDoc.items;
  if (rawDoc?.value && typeof rawDoc.value === "object") {
    const nested = rawDoc.value;
    if (Array.isArray(nested.items)) return nested.items;
  }
  return [];
}

function buildHistoryId(raw, index, mezzoTarga) {
  const id = normalizeText(raw?.id);
  if (id) return id;
  return `manutenzione:${mezzoTarga}:${index}`;
}

function normalizeDescriptionForCompare(value) {
  return normalizeText(value).replace(/\s+/g, " ").toLowerCase();
}

function getDescriptionDisplay(raw) {
  return (
    normalizeOptionalText(raw?.descrizione) ??
    normalizeOptionalText(raw?.tipo) ??
    "Manutenzione"
  );
}

function buildCanonicalRecord(raw, index) {
  const targa =
    normalizeNextMezzoTarga(raw?.targa) || normalizeText(raw?.targa).toUpperCase();
  const data = normalizeOptionalText(raw?.data);
  const km = normalizeNumber(raw?.km);
  const tipo = normalizeLegacyTipo(raw);
  const descrizione = getDescriptionDisplay(raw);
  const legacyId = buildHistoryId(raw, index, targa || "SENZA_TARGA");

  return {
    index,
    legacyId,
    rawId: normalizeOptionalText(raw?.id),
    targa,
    data,
    km,
    tipo,
    descrizione,
    descrizioneNorm: normalizeDescriptionForCompare(descrizione),
  };
}

function buildGroupKey(record) {
  return `${record.targa}||${record.data}||${String(record.km)}||${record.tipo}`;
}

function printGroup(group, position, total) {
  const descriptions = Array.from(
    new Map(group.records.map((record) => [record.descrizioneNorm, record.descrizione])).values(),
  );
  const hasDescriptionDiff = descriptions.length > 1;

  console.log("");
  console.log(
    `[${position}/${total}] targa=${group.targa} | data=${group.data} | km=${group.km} | tipo=${group.tipo} | record=${group.records.length}`,
  );
  console.log(
    `  ids coinvolti: ${group.records.map((record) => record.legacyId).join(", ")}`,
  );
  console.log(`  descrizioni diverse: ${hasDescriptionDiff ? "SI" : "NO"}`);

  if (hasDescriptionDiff) {
    console.log("  diff minima descrizioni:");
    group.records.forEach((record) => {
      console.log(
        `    - ${record.legacyId}${record.rawId ? ` (raw.id=${record.rawId})` : " (raw.id assente)"}: ${record.descrizione}`,
      );
    });
  }
}

async function readDatasetViaClientSdk() {
  const app = initializeApp(firebaseConfig, "audit-duplicati-manutenzioni-client");
  const db = getFirestore(app);
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, MANUTENZIONI_KEY));
  return snapshot.exists() ? snapshot.data() : null;
}

function parseJsonObject(rawValue) {
  if (!rawValue || typeof rawValue !== "string") return null;
  try {
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function readDatasetViaAdminSdk() {
  const [{ applicationDefault, cert, getApps, initializeApp: initializeAdminApp }, { getFirestore: getAdminFirestore }] =
    await Promise.all([
      import("firebase-admin/app"),
      import("firebase-admin/firestore"),
    ]);

  const serviceAccount = parseJsonObject(process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? "");
  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT?.trim() ??
    process.env.GCLOUD_PROJECT?.trim() ??
    serviceAccount?.project_id ??
    firebaseConfig.projectId;

  const adminApp =
    getApps().find((entry) => entry.name === "audit-duplicati-manutenzioni-admin") ??
    initializeAdminApp(
      {
        credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
        projectId,
      },
      "audit-duplicati-manutenzioni-admin",
    );

  const snapshot = await getAdminFirestore(adminApp)
    .collection(STORAGE_COLLECTION)
    .doc(MANUTENZIONI_KEY)
    .get();

  return snapshot.exists ? snapshot.data() : null;
}

async function readDatasetWithFallback() {
  try {
    return {
      mode: "client_sdk",
      rawDoc: await readDatasetViaClientSdk(),
    };
  } catch (clientError) {
    const errorCode = clientError && typeof clientError === "object" ? clientError.code : null;
    if (errorCode !== "permission-denied") {
      throw clientError;
    }

    const rawDoc = await readDatasetViaAdminSdk();
    return {
      mode: "admin_sdk",
      rawDoc,
    };
  }
}

async function main() {
  const { mode, rawDoc } = await readDatasetWithFallback();
  const rawItems = unwrapStorageArray(rawDoc);

  const records = rawItems
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      return buildCanonicalRecord(entry, index);
    })
    .filter(Boolean);

  const missingKeyRecords = records.filter(
    (record) => !record.targa || !record.data || record.km === null,
  );

  const groupsMap = new Map();
  for (const record of records) {
    if (!record.targa || !record.data || record.km === null) continue;
    const key = buildGroupKey(record);
    const existing = groupsMap.get(key);
    if (existing) {
      existing.records.push(record);
      continue;
    }
    groupsMap.set(key, {
      key,
      targa: record.targa,
      data: record.data,
      km: record.km,
      tipo: record.tipo,
      records: [record],
    });
  }

  const duplicateGroups = Array.from(groupsMap.values())
    .filter((group) => group.records.length >= 2)
    .sort((left, right) => {
      if (right.records.length !== left.records.length) {
        return right.records.length - left.records.length;
      }
      return left.targa.localeCompare(right.targa, "it", { sensitivity: "base" });
    });

  const totalDuplicateRecords = duplicateGroups.reduce(
    (sum, group) => sum + group.records.length,
    0,
  );

  const duplicateStatsByTarga = new Map();
  for (const group of duplicateGroups) {
    const current = duplicateStatsByTarga.get(group.targa) ?? {
      targa: group.targa,
      groups: 0,
      records: 0,
      extraDuplicates: 0,
    };
    current.groups += 1;
    current.records += group.records.length;
    current.extraDuplicates += group.records.length - 1;
    duplicateStatsByTarga.set(group.targa, current);
  }

  const topTarghe = Array.from(duplicateStatsByTarga.values())
    .sort((left, right) => {
      if (right.extraDuplicates !== left.extraDuplicates) {
        return right.extraDuplicates - left.extraDuplicates;
      }
      if (right.groups !== left.groups) {
        return right.groups - left.groups;
      }
      return left.targa.localeCompare(right.targa, "it", { sensitivity: "base" });
    })
    .slice(0, 5);

  console.log("=== AUDIT DUPLICATI MANUTENZIONI LEGACY ===");
  console.log(`Dataset: ${STORAGE_COLLECTION}/${MANUTENZIONI_KEY}`);
  console.log(`Modalita lettura: ${mode}`);
  console.log(`Totale record nel dataset: ${records.length}`);
  console.log(`Record con chiave mancante (targa/data/km): ${missingKeyRecords.length}`);
  console.log(`Totale gruppi di duplicati rilevati: ${duplicateGroups.length}`);
  console.log(`Totale record coinvolti in duplicati: ${totalDuplicateRecords}`);

  if (missingKeyRecords.length > 0) {
    console.log("");
    console.log("Record con chiave mancante:");
    missingKeyRecords.slice(0, 20).forEach((record) => {
      console.log(
        `  - ${record.legacyId}: targa=${record.targa || "MANCANTE"} | data=${record.data || "MANCANTE"} | km=${
          record.km === null ? "MANCANTE" : record.km
        } | tipo=${record.tipo}`,
      );
    });
    if (missingKeyRecords.length > 20) {
      console.log(`  ... altri ${missingKeyRecords.length - 20} record non mostrati`);
    }
  }

  if (duplicateGroups.length === 0) {
    console.log("");
    console.log("Nessun gruppo duplicato rilevato con la chiave business targa+data+km+tipo.");
  } else {
    duplicateGroups.forEach((group, index) => {
      printGroup(group, index + 1, duplicateGroups.length);
    });
  }

  console.log("");
  console.log("Top 5 targhe più colpite:");
  if (topTarghe.length === 0) {
    console.log("  (nessuna)");
  } else {
    topTarghe.forEach((item, index) => {
      console.log(
        `  ${index + 1}. ${item.targa} -> gruppi=${item.groups}, recordCoinvolti=${item.records}, duplicatiExtra=${item.extraDuplicates}`,
      );
    });
  }
}

main().catch((error) => {
  console.error("AUDIT FALLITO:", error);
  process.exitCode = 1;
});
