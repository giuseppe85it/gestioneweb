/**
 * Audit Firestore Coverage Chat IA NEXT — script di sola lettura.
 *
 * SCOPO: per ogni collection / dataset Firestore della NEXT app, raccogliere
 *   - count totale record
 *   - schema effettivo (campi presenti + frequenza)
 *   - valori distinti per campi categoriali chiave
 *   - sample record
 *
 * VINCOLI:
 *   - solo lettura (getDoc / getDocs). NESSUNA scrittura.
 *   - nessun side effect su collection esistenti.
 *   - emette JSON in tests/audit/output/firestore-coverage.json e summary su stdout.
 *
 * USO:
 *   node tests/audit/auditFirestoreCoverage.mjs
 *
 * Nota: file .mjs (non .ts) per essere eseguibile con Node senza toolchain extra.
 * La logica resta type-safe a livello runtime tramite normalizzazioni esplicite.
 */

import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { collection, doc, getDoc, getDocs, getFirestore } from "firebase/firestore";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const firebaseConfig = {
  apiKey: "AIzaSyD5UVGv-sdjYQnLrva35EQLYxxhjWNGMV4",
  authDomain: "gestionemanutenzione-934ef.firebaseapp.com",
  databaseURL: "https://gestionemanutenzione-934ef-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gestionemanutenzione-934ef",
  storageBucket: "gestionemanutenzione-934ef.firebasestorage.app",
  messagingSenderId: "716845762405",
  appId: "1:716845762405:web:1db7e030d07aaf5ac3e326",
};

const app = getApps()[0] ?? initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ----------------------- LISTE TARGET -----------------------

// Storage keys (documenti dentro la collection "storage" con campo items[])
// Sono le chiavi business effettivamente usate dai reader della NEXT.
const STORAGE_KEYS = [
  "@mezzi_aziendali",
  "@colleghi",
  "@fornitori",
  "@officine",
  "@lavori",
  "@manutenzioni",
  "@inventario",
  "@materialiconsegnati",
  "@rifornimenti",
  "@rifornimenti_autisti_tmp",
  "@ordini",
  "@preventivi",
  "@preventivi_approvazioni",
  "@listino_prezzi",
  "@costiMezzo",
  "@documenti_mezzi",
  "@documenti_magazzino",
  "@documenti_generici",
  "@attrezzature_cantieri",
  "@cisterne_adblue",
  "@alerts_state",
  "@segnalazioni_autisti_tmp",
  "@controlli_mezzo_autisti",
  "@storico_eventi_operativi",
  "@autisti_sessione_attive",
  "@richieste_attrezzature_autisti_tmp",
  "@cambi_gomme_autisti_tmp",
  "@gomme_eventi",
  "@mezzi_foto_viste",
  "@mezzi_hotspot_mapping",
  "@analisi_economica_mezzi",
  "@impostazioni_app",
];

// Collection root vere e proprie (non sotto storage)
const ROOT_COLLECTIONS = [
  "euromecc_pending",
  "euromecc_done",
  "euromecc_issues",
  "euromecc_area_meta",
  "euromecc_relazioni",
  "euromecc_extra_components",
  "autisti_eventi",
  "chat_ia_reports",
  // Ambigui: provati come root collection (potrebbero non esistere come tali)
  "@documenti_mezzi",
  "@documenti_magazzino",
  "@documenti_generici",
  "@costiMezzo",
  "@analisi_economica_mezzi",
];

// Campi categoriali da analizzare per ogni storage key (valori distinti + count)
const CATEGORICAL_FIELDS_BY_KEY = {
  "@mezzi_aziendali": ["categoria", "stato", "carrozzeria", "genereVeicolo", "trazione", "tipoMezzo"],
  "@manutenzioni": ["tipoIntervento", "stato", "categoria", "tipo"],
  "@lavori": ["statoVista", "stato", "tipo", "urgenza", "categoria"],
  "@documenti_mezzi": ["tipo", "kind", "tipoDocumento", "categoria"],
  "@documenti_magazzino": ["tipo", "kind", "categoria"],
  "@documenti_generici": ["tipo", "kind"],
  "@costiMezzo": ["tipo", "categoria"],
  "@rifornimenti": ["fonte", "fornitore", "carburante", "tipoRifornimento"],
  "@rifornimenti_autisti_tmp": ["fonte", "carburante"],
  "@colleghi": ["ruolo", "categoria", "stato"],
  "@inventario": ["categoria", "fornitore", "stato", "stockStatus"],
  "@materialiconsegnati": ["destinatario", "tipoDestinatario", "tipoMateriale"],
  "@ordini": ["stato", "fornitore"],
  "@preventivi": ["stato", "fornitore"],
  "@officine": ["citta"],
  "@fornitori": ["categoria", "tipo"],
  "@attrezzature_cantieri": ["tipo", "categoria"],
  "@storico_eventi_operativi": ["tipo", "fonte", "categoria"],
  "@segnalazioni_autisti_tmp": ["tipo", "stato"],
  "@controlli_mezzo_autisti": ["tipo", "esito"],
};

// Campi data da analizzare per range temporale e formato
const DATE_FIELDS_BY_KEY = {
  "@manutenzioni": ["data", "dataDocumento"],
  "@rifornimenti": ["data", "dataDisplay"],
  "@rifornimenti_autisti_tmp": ["data", "dataDisplay"],
  "@costiMezzo": ["dataDocumento", "data"],
  "@documenti_mezzi": ["dataDocumento", "data"],
  "@documenti_magazzino": ["dataDocumento", "data"],
  "@documenti_generici": ["dataDocumento", "data"],
  "@lavori": ["data", "dataInserimento", "dataChiusura"],
  "@storico_eventi_operativi": ["data", "timestamp", "createdAt"],
};

// ----------------------- HELPERS -----------------------

async function ensureAuth() {
  if (auth.currentUser) return;
  await signInAnonymously(auth);
}

function extractItems(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.items)) return data.items.filter(isRecord);
  if (data.value && typeof data.value === "object") {
    if (Array.isArray(data.value.items)) return data.value.items.filter(isRecord);
    if (Array.isArray(data.value)) return data.value.filter(isRecord);
  }
  if (Array.isArray(data.records)) return data.records.filter(isRecord);
  if (Array.isArray(data.list)) return data.list.filter(isRecord);
  const values = Object.values(data).filter(isRecord);
  return values.length > 0 ? values : [];
}

function isRecord(v) {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function isEmpty(v) {
  return v === null || v === undefined || v === "" ||
    (Array.isArray(v) && v.length === 0) ||
    (isRecord(v) && Object.keys(v).length === 0);
}

function computeFieldFrequency(items) {
  const freq = {};
  for (const item of items) {
    if (!isRecord(item)) continue;
    for (const k of Object.keys(item)) {
      if (!freq[k]) freq[k] = { present: 0, empty: 0, types: new Set() };
      const v = item[k];
      if (isEmpty(v)) freq[k].empty += 1;
      else {
        freq[k].present += 1;
        freq[k].types.add(typeOf(v));
      }
    }
  }
  const total = items.length || 1;
  return Object.fromEntries(
    Object.entries(freq)
      .map(([k, v]) => [k, {
        present: v.present,
        empty: v.empty,
        coverage: Number((v.present / total).toFixed(3)),
        types: Array.from(v.types),
      }])
      .sort((a, b) => b[1].coverage - a[1].coverage),
  );
}

function typeOf(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (typeof v === "object") {
    if (typeof v.toDate === "function") return "Timestamp";
    if (typeof v.seconds === "number") return "Timestamp-like";
    return "object";
  }
  return typeof v;
}

function computeCategoricalValues(items, fields) {
  const result = {};
  for (const f of fields) {
    const counts = {};
    for (const item of items) {
      if (!isRecord(item)) continue;
      const v = item[f];
      if (isEmpty(v)) continue;
      const norm = typeof v === "string" ? v : JSON.stringify(v);
      counts[norm] = (counts[norm] || 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    result[f] = {
      distinct: sorted.length,
      missing: items.filter((it) => isRecord(it) && isEmpty(it[f])).length,
      values: Object.fromEntries(sorted.slice(0, 30)),
    };
  }
  return result;
}

function parseDateLoose(v) {
  if (!v) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === "number") {
    return new Date(Math.abs(v) < 10_000_000_000 ? v * 1000 : v);
  }
  if (typeof v === "object") {
    if (typeof v.toDate === "function") return v.toDate();
    if (typeof v.seconds === "number") return new Date(v.seconds * 1000);
    if (typeof v._seconds === "number") return new Date(v._seconds * 1000);
  }
  if (typeof v !== "string") return null;
  const text = v.trim();
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const ita = text.match(/^(\d{1,2})[/.\s-](\d{1,2})[/.\s-](\d{4})/);
  if (ita) return new Date(Number(ita[3]), Number(ita[2]) - 1, Number(ita[1]));
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function computeDateProfile(items, fields) {
  const result = {};
  for (const f of fields) {
    const dates = [];
    let invalid = 0;
    let missing = 0;
    for (const item of items) {
      if (!isRecord(item)) continue;
      const raw = item[f];
      if (isEmpty(raw)) { missing += 1; continue; }
      const d = parseDateLoose(raw);
      if (!d || Number.isNaN(d.getTime())) { invalid += 1; continue; }
      dates.push(d.getTime());
    }
    if (dates.length === 0) {
      result[f] = { count: 0, missing, invalid };
      continue;
    }
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    const futureCutoff = Date.now() + 1000 * 60 * 60 * 24 * 365 * 5;
    const pastCutoff = new Date("1990-01-01").getTime();
    const future = dates.filter((d) => d > futureCutoff).length;
    const ancient = dates.filter((d) => d < pastCutoff).length;
    result[f] = {
      count: dates.length,
      missing,
      invalid,
      future,
      ancient,
      min: min.toISOString().slice(0, 10),
      max: max.toISOString().slice(0, 10),
    };
  }
  return result;
}

function findDuplicateIds(items) {
  const seen = new Map();
  for (const item of items) {
    const id = item?.id;
    if (id === undefined || id === null) continue;
    const key = String(id);
    seen.set(key, (seen.get(key) || 0) + 1);
  }
  const dups = Array.from(seen.entries()).filter(([, c]) => c > 1);
  return { totalDuplicates: dups.reduce((a, [, c]) => a + (c - 1), 0), examples: dups.slice(0, 5) };
}

function summarizeItem(item) {
  if (!isRecord(item)) return null;
  const out = {};
  for (const k of Object.keys(item).slice(0, 25)) {
    const v = item[k];
    if (typeof v === "string") out[k] = v.length > 80 ? v.slice(0, 80) + "…" : v;
    else if (typeof v === "number" || typeof v === "boolean") out[k] = v;
    else if (v === null || v === undefined) out[k] = null;
    else if (Array.isArray(v)) out[k] = `[array x${v.length}]`;
    else if (typeof v === "object") out[k] = `{${Object.keys(v).slice(0, 4).join(",")}}`;
    else out[k] = String(v);
  }
  return out;
}

// ----------------------- AUDIT -----------------------

async function auditStorageKey(key) {
  try {
    const snap = await getDoc(doc(db, "storage", key));
    if (!snap.exists()) {
      return { key, kind: "storage", exists: false, count: 0 };
    }
    const data = snap.data();
    const items = extractItems(data);
    const cats = computeCategoricalValues(items, CATEGORICAL_FIELDS_BY_KEY[key] ?? []);
    const dates = computeDateProfile(items, DATE_FIELDS_BY_KEY[key] ?? []);
    const dups = findDuplicateIds(items);
    return {
      key,
      kind: "storage",
      exists: true,
      docTopFields: Object.keys(data).slice(0, 20),
      count: items.length,
      sample: summarizeItem(items[0]),
      fieldFrequency: computeFieldFrequency(items),
      categoricals: cats,
      dates,
      duplicates: dups,
    };
  } catch (err) {
    return { key, kind: "storage", error: String(err?.message ?? err) };
  }
}

async function auditRootCollection(name) {
  try {
    const snap = await getDocs(collection(db, name));
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const cats = computeCategoricalValues(items, CATEGORICAL_FIELDS_BY_KEY[name] ?? []);
    const dates = computeDateProfile(items, DATE_FIELDS_BY_KEY[name] ?? []);
    return {
      name,
      kind: "collection",
      exists: snap.size > 0,
      count: snap.size,
      sample: summarizeItem(items[0]),
      fieldFrequency: computeFieldFrequency(items),
      categoricals: cats,
      dates,
    };
  } catch (err) {
    return { name, kind: "collection", error: String(err?.message ?? err) };
  }
}

// ----------------------- MAIN -----------------------

async function main() {
  console.log(`[audit] start ${new Date().toISOString()}`);
  await ensureAuth();
  console.log(`[audit] anonymous auth OK uid=${auth.currentUser?.uid?.slice(0, 8)}…`);

  const report = {
    date: new Date().toISOString(),
    project: firebaseConfig.projectId,
    storage: [],
    collections: [],
  };

  for (const k of STORAGE_KEYS) {
    process.stdout.write(`[audit] storage ${k} … `);
    const res = await auditStorageKey(k);
    report.storage.push(res);
    if (res.error) console.log("ERROR " + res.error.slice(0, 80));
    else if (!res.exists) console.log("MISSING");
    else console.log(`${res.count} items`);
  }

  for (const c of ROOT_COLLECTIONS) {
    process.stdout.write(`[audit] collection ${c} … `);
    const res = await auditRootCollection(c);
    report.collections.push(res);
    if (res.error) console.log("ERROR " + res.error.slice(0, 80));
    else console.log(`${res.count} docs`);
  }

  const outDir = resolve(__dirname, "output");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, "firestore-coverage.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\n[audit] report scritto in ${outPath}`);

  console.log("\n=== SUMMARY ===");
  console.log("STORAGE KEYS:");
  for (const s of report.storage) {
    if (s.error) console.log(`  ${s.key.padEnd(38)} ERROR ${s.error.slice(0, 60)}`);
    else if (!s.exists) console.log(`  ${s.key.padEnd(38)} MISSING`);
    else console.log(`  ${s.key.padEnd(38)} ${String(s.count).padStart(6)} items`);
  }
  console.log("ROOT COLLECTIONS:");
  for (const c of report.collections) {
    if (c.error) console.log(`  ${c.name.padEnd(38)} ERROR ${c.error.slice(0, 60)}`);
    else console.log(`  ${c.name.padEnd(38)} ${String(c.count).padStart(6)} docs`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[audit] FATAL", err);
    process.exit(1);
  });
