/**
 * Audit Modali NEXT vs Firestore vs Tool Chat IA.
 *
 * Script di sola lettura:
 * - scandisce src/next senza leggere contenuti Archivista;
 * - risolve le evidenze nel codice dei modali/form;
 * - legge Firestore con getDoc/getDocs;
 * - scrive solo output audit JSON e report Markdown.
 */

import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { collection, doc, getDoc, getDocs, getFirestore } from "firebase/firestore";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AUDIT_METADATA,
  CATEGORICAL_FIELDS_BY_PATH,
  MODAL_SPECS,
  TOOL_MAPPINGS,
} from "./auditModaliHelpers.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const SRC_NEXT = resolve(REPO_ROOT, "src", "next");
const OUTPUT_JSON = resolve(REPO_ROOT, "tests", "audit", "output", "modali-audit.json");
const OUTPUT_REPORT = resolve(REPO_ROOT, "docs", "audit", "AUDIT_MODALI_NEXT_VS_TOOL_2026-04-30.md");

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
const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
  const scanSummary = scanNextSource();
  const evidence = resolveEvidence(MODAL_SPECS);
  const firestorePaths = Array.from(
    new Set(MODAL_SPECS.flatMap((spec) => spec.writes.map((write) => write.path))),
  ).sort();

  await ensureAuth();
  const firestore = {};
  for (const path of firestorePaths) {
    firestore[path] = await auditFirestorePath(path);
  }

  const modalRows = MODAL_SPECS.map((spec) =>
    buildModalRow(spec, evidence[spec.id] ?? [], firestore),
  );
  const summary = buildSummary(modalRows, firestorePaths, scanSummary);
  const result = {
    metadata: {
      ...AUDIT_METADATA,
      generatedAt: new Date().toISOString(),
      script: relativePath(import.meta.url.replace("file:///", "").replace(/\//g, sep)),
      outputJson: relativePath(OUTPUT_JSON),
      outputReport: relativePath(OUTPUT_REPORT),
      firestoreWriteSafety: "Solo getDoc/getDocs. Nessuna funzione di write importata.",
    },
    summary,
    scanSummary,
    modalRows,
    firestore,
    toolMappings: TOOL_MAPPINGS,
    evidence,
  };

  mkdirSync(dirname(OUTPUT_JSON), { recursive: true });
  writeFileSync(OUTPUT_JSON, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  mkdirSync(dirname(OUTPUT_REPORT), { recursive: true });
  writeFileSync(OUTPUT_REPORT, buildReport(result), "utf8");

  console.log(
    JSON.stringify(
      {
        status: summary.status,
        modali: summary.modalCount,
        collections: summary.firestorePathCount,
        gaps: summary.gaps,
        outputJson: relativePath(OUTPUT_JSON),
        outputReport: relativePath(OUTPUT_REPORT),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

function relativePath(path) {
  return relative(REPO_ROOT, resolve(path)).split(sep).join("/");
}

function walkFiles(root) {
  const entries = [];
  if (!existsSync(root)) return entries;
  for (const name of readdirSync(root)) {
    const fullPath = join(root, name);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      entries.push(...walkFiles(fullPath));
    } else if (stat.isFile()) {
      entries.push(fullPath);
    }
  }
  return entries;
}

function isArchivistaPath(path) {
  return /archivista/i.test(path);
}

function isBackupPath(path) {
  const name = basename(path).toLowerCase();
  return name.includes(".bak") || name.includes("_bak") || name.endsWith(".old");
}

function isSourceLike(path) {
  return /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(path);
}

function scanNextSource() {
  const files = walkFiles(SRC_NEXT);
  const candidateNameRegex = /(Modal|Form|Dialog|Edit|Crea|Add|New)/;
  const writeRegex =
    /\b(setDoc|updateDoc|addDoc|deleteDoc|writeBatch|setItemSync|uploadBytes|uploadString|deleteObject)\b/;
  const importRegex = /(firebase\/firestore|firebase\/storage|firestoreWriteOps|storageWriteOps|storageSync)/;
  const scan = {
    srcNextRoot: "src/next",
    filesDiscovered: files.length,
    filesReadForStaticScan: 0,
    archivistaFilesExcludedWithoutReading: [],
    backupFilesExcludedFromActiveModalList: [],
    candidateNameFiles: [],
    directWriteFiles: [],
    localOnlyExcluded: [
      "src/next/autistiInbox/NextAutistiAdminNative.tsx",
      "src/next/autistiInbox/nextAutistiAdminBridges.ts",
      "src/next/autisti/nextAutistiStorageSync.ts",
    ],
    readOnlyModalFilesWithoutFirestoreWrite: [
      "src/next/autisti/NextGommeAutistaModal.tsx",
      "src/next/autisti/NextModalGomme.tsx",
      "src/next/components/NextHomeAutistiEventoModal.tsx",
      "src/next/components/NextAutistiEventoModal.tsx",
      "src/next/NextPdfPreviewModal.tsx",
    ],
  };

  for (const file of files) {
    const rel = relativePath(file);
    if (isArchivistaPath(rel)) {
      scan.archivistaFilesExcludedWithoutReading.push(rel);
      continue;
    }
    if (isBackupPath(rel)) {
      scan.backupFilesExcludedFromActiveModalList.push(rel);
      continue;
    }
    if (candidateNameRegex.test(basename(file))) {
      scan.candidateNameFiles.push(rel);
    }
    if (!isSourceLike(file)) continue;
    const text = readFileSync(file, "utf8");
    scan.filesReadForStaticScan += 1;
    if (writeRegex.test(text) && importRegex.test(text)) {
      scan.directWriteFiles.push(rel);
    }
  }

  scan.candidateNameFiles.sort();
  scan.directWriteFiles.sort();
  scan.archivistaFilesExcludedWithoutReading.sort();
  scan.backupFilesExcludedFromActiveModalList.sort();
  scan.modalSpecsDeclared = MODAL_SPECS.length;
  return scan;
}

function resolveEvidence(specs) {
  const result = {};
  for (const spec of specs) {
    result[spec.id] = [];
    for (const write of spec.writes) {
      for (const evidence of write.evidence ?? []) {
        result[spec.id].push({
          path: write.path,
          operation: write.operation,
          ...findPatternLine(evidence.file, evidence.pattern),
          pattern: evidence.pattern,
        });
      }
    }
  }
  return result;
}

function findPatternLine(file, pattern) {
  const fullPath = resolve(REPO_ROOT, file);
  if (!existsSync(fullPath)) {
    return { file, line: null, found: false, reason: "file_missing" };
  }
  const lines = readFileSync(fullPath, "utf8").split(/\r?\n/);
  const index = lines.findIndex((line) => line.includes(pattern));
  return {
    file,
    line: index >= 0 ? index + 1 : null,
    found: index >= 0,
    reason: index >= 0 ? null : "pattern_missing",
  };
}

async function ensureAuth() {
  if (auth.currentUser) return;
  await signInAnonymously(auth);
}

async function auditFirestorePath(path) {
  const primary =
    path.startsWith("storage/")
      ? await readStorageDoc(path.slice("storage/".length))
      : await readRootCollection(path);
  const alternatives = await readAlternatives(path);
  return {
    path,
    mode: path.startsWith("storage/") ? "storage_doc" : "root_collection",
    exists: primary.exists,
    count: primary.items.length,
    docExists: primary.docExists ?? null,
    collectionCount: primary.collectionCount ?? null,
    schema: computeFieldFrequency(primary.items),
    categoricalValues: computeCategoricalValues(
      primary.items,
      CATEGORICAL_FIELDS_BY_PATH[path] ?? guessCategoricalFields(primary.items),
    ),
    sampleIds: primary.items.slice(0, 5).map((item, index) => String(item.id ?? item._id ?? index)),
    alternativesChecked: alternatives,
    readError: primary.error ?? null,
  };
}

async function readAlternatives(path) {
  const alternatives = [];
  try {
    if (path.startsWith("storage/")) {
      const key = path.slice("storage/".length);
      const root = await readRootCollection(key);
      alternatives.push({
        path: key,
        mode: "root_collection",
        exists: root.exists,
        count: root.items.length,
        readError: root.error ?? null,
      });
    } else {
      const storage = await readStorageDoc(path);
      alternatives.push({
        path: `storage/${path}`,
        mode: "storage_doc",
        exists: storage.exists,
        count: storage.items.length,
        docExists: storage.docExists,
        readError: storage.error ?? null,
      });
    }
  } catch (error) {
    alternatives.push({ path: "alternative_check", error: errorMessage(error) });
  }
  return alternatives;
}

async function readStorageDoc(key) {
  try {
    const snapshot = await getDoc(doc(db, "storage", key));
    if (!snapshot.exists()) {
      return { exists: false, docExists: false, items: [] };
    }
    const data = snapshot.data();
    const items = extractItems(data);
    return { exists: true, docExists: true, items };
  } catch (error) {
    return { exists: false, docExists: null, items: [], error: errorMessage(error) };
  }
}

async function readRootCollection(path) {
  try {
    const snapshot = await getDocs(collection(db, path));
    const items = snapshot.docs.map((entry) => ({
      id: entry.id,
      ...entry.data(),
    }));
    return { exists: items.length > 0, collectionCount: items.length, items };
  } catch (error) {
    return { exists: false, collectionCount: null, items: [], error: errorMessage(error) };
  }
}

function extractItems(data) {
  if (!isRecord(data)) return [];
  const candidates = [
    data.items,
    isRecord(data.value) ? data.value.items : null,
    data.value,
    data.records,
    data.list,
    data.preventivi,
    data.voci,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate.filter(isRecord);
  }
  const values = Object.values(data).filter(isRecord);
  return values.length > 0 ? values : [];
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isEmpty(value) {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0) ||
    (isRecord(value) && Object.keys(value).length === 0)
  );
}

function typeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") {
    if (typeof value.toDate === "function") return "Firestore Timestamp";
    if (typeof value.seconds === "number" || typeof value._seconds === "number") {
      return "Timestamp-like";
    }
    return "object";
  }
  return typeof value;
}

function computeFieldFrequency(items) {
  const fields = {};
  for (const item of items) {
    if (!isRecord(item)) continue;
    for (const key of Object.keys(item)) {
      fields[key] ??= { present: 0, empty: 0, types: new Set() };
      const value = item[key];
      if (isEmpty(value)) {
        fields[key].empty += 1;
      } else {
        fields[key].present += 1;
        fields[key].types.add(typeOf(value));
      }
    }
  }
  const total = items.length || 1;
  return Object.fromEntries(
    Object.entries(fields)
      .map(([key, value]) => [
        key,
        {
          present: value.present,
          empty: value.empty,
          total: items.length,
          coverage: Number((value.present / total).toFixed(3)),
          types: Array.from(value.types).sort(),
        },
      ])
      .sort((left, right) => right[1].coverage - left[1].coverage || left[0].localeCompare(right[0])),
  );
}

function guessCategoricalFields(items) {
  const schema = computeFieldFrequency(items);
  return Object.entries(schema)
    .filter(([, value]) => value.types.includes("string") || value.types.includes("boolean"))
    .map(([key]) => key)
    .slice(0, 8);
}

function computeCategoricalValues(items, fields) {
  const result = {};
  for (const field of fields) {
    const counts = {};
    let missing = 0;
    for (const item of items) {
      if (!isRecord(item)) continue;
      const value = item[field];
      if (isEmpty(value)) {
        missing += 1;
        continue;
      }
      const key = typeof value === "string" ? value : JSON.stringify(value);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    result[field] = {
      distinct: Object.keys(counts).length,
      missing,
      values: Object.fromEntries(
        Object.entries(counts)
          .sort((left, right) => right[1] - left[1])
          .slice(0, 30),
      ),
    };
  }
  return result;
}

function buildModalRow(spec, evidence, firestore) {
  const pathResults = spec.writes.map((write) => {
    const mapping = TOOL_MAPPINGS[write.path] ?? null;
    const missingFields = mapping?.tools?.length
      ? write.fields
          .map((field) => field.name)
          .filter((fieldName) => !isFieldRead(fieldName, mapping.fieldsRead ?? []))
      : [];
    const alternateMappingPath = findAlternateMappingPath(write.path);
    let gap = "OK";
    if (!mapping || mapping.tools.length === 0) {
      gap = alternateMappingPath ? "GAP_PATH_DIVERSO" : "GAP_NESSUN_TOOL";
    } else if (missingFields.length > 0) {
      gap = "GAP_CAMPI_NON_LETTI";
    } else if (mapping.filterGaps?.length) {
      gap = "GAP_FILTRO_SBAGLIATO";
    }
    return {
      path: write.path,
      operation: write.operation,
      kind: write.kind,
      fieldsWritten: write.fields.map((field) => field.name),
      fieldsDetail: write.fields,
      firestore: summarizeFirestore(firestore[write.path]),
      tool: mapping
        ? {
            tools: mapping.tools,
            reader: mapping.reader,
            fieldsRead: mapping.fieldsRead,
            notes: mapping.notes ?? [],
            filterGaps: mapping.filterGaps ?? [],
          }
        : null,
      alternateMappingPath,
      missingFields,
      gap,
    };
  });

  const gaps = computeRowGaps(pathResults, spec);
  return {
    id: spec.id,
    modal: spec.modal,
    component: spec.component,
    file: spec.file,
    operations: spec.operations,
    firestorePaths: pathResults.map((entry) => entry.path),
    storageWrites: spec.storageWrites ?? [],
    evidence,
    paths: pathResults,
    gaps,
    status: gaps.length === 0 ? "OK" : "GAP",
  };
}

function summarizeFirestore(entry) {
  if (!entry) return null;
  return {
    exists: entry.exists,
    count: entry.count,
    schemaFields: Object.keys(entry.schema ?? {}),
    readError: entry.readError,
  };
}

function findAlternateMappingPath(path) {
  if (path.startsWith("storage/")) {
    const root = path.slice("storage/".length);
    return TOOL_MAPPINGS[root] ? root : null;
  }
  const storagePath = `storage/${path}`;
  return TOOL_MAPPINGS[storagePath] ? storagePath : null;
}

function normalizeField(fieldName) {
  return String(fieldName)
    .replace(/\[\]/g, "")
    .replace(/\.\d+\./g, ".")
    .trim();
}

function isFieldRead(fieldName, fieldsRead) {
  const field = normalizeField(fieldName);
  const parts = field.split(".");
  const parent = parts[0];
  return fieldsRead.some((candidate) => {
    const read = normalizeField(candidate);
    return field === read || parent === read || field.startsWith(`${read}.`) || read.startsWith(`${field}.`);
  });
}

function computeRowGaps(pathResults, spec) {
  const labels = new Set();
  for (const result of pathResults) {
    if (result.gap !== "OK") labels.add(result.gap);
    if (result.tool?.filterGaps?.length) labels.add("GAP_FILTRO_SBAGLIATO");
  }
  if (spec.writes.length === 0 && (spec.storageWrites ?? []).length > 0) {
    labels.add("GAP_NESSUN_TOOL");
  }
  return Array.from(labels).sort();
}

function buildSummary(modalRows, firestorePaths, scanSummary) {
  const gapRows = modalRows.filter((row) => row.gaps.length > 0);
  const gapCount = (label) => modalRows.filter((row) => row.gaps.includes(label)).length;
  const hasArchivistaExclusion = scanSummary.archivistaFilesExcludedWithoutReading.length > 0;
  return {
    status: hasArchivistaExclusion ? "AUDIT PARZIALE" : "AUDIT COMPLETATO",
    statusReason: hasArchivistaExclusion
      ? "Archivista non analizzato per divieto esplicito del prompt."
      : "Perimetro src/next analizzato senza esclusioni funzionali note.",
    modalCount: modalRows.length,
    firestorePathCount: firestorePaths.length,
    modaliWithDedicatedToolOk: modalRows.filter((row) => row.gaps.length === 0).length,
    modaliWithGap: gapRows.length,
    gaps: {
      GAP_NESSUN_TOOL: gapCount("GAP_NESSUN_TOOL"),
      GAP_PATH_DIVERSO: gapCount("GAP_PATH_DIVERSO"),
      GAP_CAMPI_NON_LETTI: gapCount("GAP_CAMPI_NON_LETTI"),
      GAP_FILTRO_SBAGLIATO: gapCount("GAP_FILTRO_SBAGLIATO"),
      OK: modalRows.filter((row) => row.gaps.length === 0).length,
    },
    topGaps: gapRows.slice(0, 10).map((row) => ({
      modal: row.modal,
      gaps: row.gaps,
      paths: row.firestorePaths,
      missingFields: row.paths.flatMap((path) => path.missingFields.map((field) => `${path.path}:${field}`)),
    })),
  };
}

function mdCell(value) {
  const text = Array.isArray(value) ? value.join(", ") : String(value ?? "");
  return text.replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
}

function fieldListForRow(row) {
  if (row.paths.length === 0) return "(solo Storage upload)";
  return row.paths
    .map((path) => `${path.path}: ${path.fieldsWritten.join(", ")}`)
    .join("<br>");
}

function toolListForRow(row) {
  if (row.paths.length === 0) return "NESSUNO";
  return row.paths
    .map((path) => `${path.path}: ${path.tool?.tools?.length ? path.tool.tools.join(", ") : "NESSUNO"}`)
    .join("<br>");
}

function fieldsReadForRow(row) {
  if (row.paths.length === 0) return "-";
  return row.paths
    .map((path) => `${path.path}: ${path.tool?.fieldsRead?.length ? path.tool.fieldsRead.join(", ") : "-"}`)
    .join("<br>");
}

function buildReport(result) {
  const lines = [];
  const { summary, modalRows, firestore, scanSummary } = result;
  lines.push("# Audit Modali NEXT vs Firestore vs Tool Chat IA");
  lines.push("Data: 2026-04-30");
  lines.push("Auditor: Codex (autonomo)");
  lines.push("Metodo: dal modale al tool, esaustivo nel perimetro consentito");
  lines.push("");
  lines.push("## Sommario");
  lines.push(`- Stato audit: ${summary.status}`);
  lines.push(`- Motivo stato: ${summary.statusReason}`);
  lines.push(`- N. modali/form NEXT censiti con scrittura Firestore o upload Storage: ${summary.modalCount}`);
  lines.push(`- N. path Firestore mappati: ${summary.firestorePathCount}`);
  lines.push(`- N. modali con tool dedicato OK: ${summary.modaliWithDedicatedToolOk}`);
  lines.push(`- N. modali con GAP: ${summary.modaliWithGap}`);
  lines.push(`- GAP_NESSUN_TOOL: ${summary.gaps.GAP_NESSUN_TOOL}`);
  lines.push(`- GAP_CAMPI_NON_LETTI: ${summary.gaps.GAP_CAMPI_NON_LETTI}`);
  lines.push(`- GAP_PATH_DIVERSO: ${summary.gaps.GAP_PATH_DIVERSO}`);
  lines.push(`- GAP_FILTRO_SBAGLIATO: ${summary.gaps.GAP_FILTRO_SBAGLIATO}`);
  lines.push("");
  lines.push("## Tabella Master");
  lines.push("| Modale | File | Operazione | Path Firestore | Campi Scritti | Tool Chat | Campi Letti | GAP |");
  lines.push("|---|---|---|---|---|---|---|---|");
  for (const row of modalRows) {
    lines.push(
      `| ${mdCell(row.modal)} | ${mdCell(row.file)} | ${mdCell(row.operations)} | ${mdCell(row.firestorePaths.length ? row.firestorePaths : "(solo Storage)") } | ${mdCell(fieldListForRow(row))} | ${mdCell(toolListForRow(row))} | ${mdCell(fieldsReadForRow(row))} | ${mdCell(row.gaps.length ? row.gaps : "OK")} |`,
    );
  }
  appendGapSection(lines, "## Sezione 1 - Modali Senza Tool (orfani)", modalRows, "GAP_NESSUN_TOOL");
  appendGapSection(lines, "## Sezione 2 - Modali con Path Diverso", modalRows, "GAP_PATH_DIVERSO");
  appendGapSection(lines, "## Sezione 3 - Modali con Campi Non Letti", modalRows, "GAP_CAMPI_NON_LETTI", true);
  appendGapSection(lines, "## Sezione 4 - Modali con Filtro Sbagliato", modalRows, "GAP_FILTRO_SBAGLIATO", false, true);
  appendOkSection(lines, modalRows);
  lines.push("## Allegato A - Schema Reale Collection");
  for (const [path, entry] of Object.entries(firestore)) {
    lines.push(`### ${path}`);
    lines.push(`- Esiste: ${entry.exists ? "SI" : "NO"}`);
    lines.push(`- Count record: ${entry.count}`);
    lines.push(`- Alternative controllate: ${entry.alternativesChecked.map((alt) => `${alt.path} count=${alt.count ?? "n.d."}`).join("; ")}`);
    if (entry.readError) lines.push(`- Errore lettura: ${entry.readError}`);
    lines.push("| Campo | Presente | Vuoto | Totale | Coverage | Tipi |");
    lines.push("|---|---:|---:|---:|---:|---|");
    for (const [field, stats] of Object.entries(entry.schema).slice(0, 80)) {
      lines.push(`| ${mdCell(field)} | ${stats.present} | ${stats.empty} | ${stats.total} | ${stats.coverage} | ${mdCell(stats.types)} |`);
    }
    lines.push("");
    lines.push("Valori distinti categoriali principali:");
    for (const [field, stats] of Object.entries(entry.categoricalValues)) {
      const values = Object.entries(stats.values)
        .map(([key, count]) => `${key}=${count}`)
        .join(", ");
      lines.push(`- ${field}: distinct=${stats.distinct}, missing=${stats.missing}${values ? `, ${values}` : ""}`);
    }
    lines.push("");
  }
  lines.push("## Allegato B - Lista Campi per Modale");
  for (const row of modalRows) {
    lines.push(`### ${row.modal}`);
    lines.push(`- File: ${row.file}`);
    if (row.storageWrites.length) {
      lines.push(`- Storage upload: ${row.storageWrites.map((entry) => `${entry.path} (${entry.type})`).join("; ")}`);
    }
    for (const path of row.paths) {
      lines.push(`- ${path.path}:`);
      for (const field of path.fieldsDetail) {
        lines.push(`  - ${field.name} | tipo=${field.type} | origine=${field.origin}`);
      }
    }
    if (row.paths.length === 0) lines.push("- Nessun record Firestore associato nel codice rilevato.");
  }
  lines.push("");
  lines.push("## Allegato C - Path Firestore Identificati");
  lines.push("| Path | Mode | Esiste | Count | Alternative |");
  lines.push("|---|---|---:|---:|---|");
  for (const [path, entry] of Object.entries(firestore)) {
    lines.push(
      `| ${mdCell(path)} | ${entry.mode} | ${entry.exists ? "SI" : "NO"} | ${entry.count} | ${mdCell(entry.alternativesChecked.map((alt) => `${alt.path}:${alt.count ?? "n.d."}`))} |`,
    );
  }
  lines.push("");
  lines.push("## Autoverifica");
  lines.push(`- V1 Lista modali esaustiva: PARZIALE, src/next scandita; Archivista escluso senza lettura per divieto esplicito. File scoperti: ${scanSummary.filesDiscovered}; file letti: ${scanSummary.filesReadForStaticScan}.`);
  lines.push("- V2 Per ogni modale identificato: campi scritti documentati in Allegato B.");
  lines.push("- V3 Per ogni path Firestore: realta verificata via getDoc/getDocs in Allegato C.");
  lines.push("- V4 Per ogni collection: schema reale estratto in Allegato A.");
  lines.push("- V5 Per ogni modale: tool chat associato o orfano dichiarato nella Tabella Master.");
  lines.push("- V6 Tabella master compilata per ogni modale/form censito.");
  lines.push("- V7 Script audit: verificare con node --check e node tests/audit/auditModaliNext.mjs.");
  lines.push("- V8 Lint: file .mjs fuori dal perimetro eslint TS/TSX del repo; verificare sintassi con node --check.");
  lines.push("");
  lines.push("## Esclusioni Misurate");
  lines.push(`- File Archivista esclusi senza lettura: ${scanSummary.archivistaFilesExcludedWithoutReading.length}`);
  lines.push(`- File backup esclusi da modali attivi: ${scanSummary.backupFilesExcludedFromActiveModalList.length}`);
  lines.push(`- File modali read-only/local-only esclusi: ${scanSummary.readOnlyModalFilesWithoutFirestoreWrite.join(", ")}`);
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function appendGapSection(lines, title, rows, label, includeMissing = false, includeFilters = false) {
  lines.push(title);
  const selected = rows.filter((row) => row.gaps.includes(label));
  if (selected.length === 0) {
    lines.push("- Nessuno.");
    lines.push("");
    return;
  }
  for (const row of selected) {
    lines.push(`- ${row.modal} | ${row.firestorePaths.join(", ") || "(solo Storage)"}`);
    if (includeMissing) {
      const missing = row.paths.flatMap((path) => path.missingFields.map((field) => `${path.path}:${field}`));
      lines.push(`  - Campi non letti: ${missing.join(", ") || "-"}`);
    }
    if (includeFilters) {
      const filters = row.paths.flatMap((path) => path.tool?.filterGaps ?? []);
      lines.push(`  - Filtri rilevati: ${filters.join(" | ") || "-"}`);
    }
  }
  lines.push("");
}

function appendOkSection(lines, rows) {
  lines.push("## Sezione 5 - Modali OK");
  const selected = rows.filter((row) => row.gaps.length === 0);
  if (selected.length === 0) {
    lines.push("- Nessuno.");
  } else {
    for (const row of selected) {
      lines.push(`- ${row.modal} | ${row.firestorePaths.join(", ")}`);
    }
  }
  lines.push("");
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
