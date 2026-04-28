import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { db, storage } from "../../firebase";
import { addDoc, setDoc } from "../../utils/firestoreWriteOps";
import { getItemSync, setItemSync } from "../../utils/storageSync";
import { uploadBytes } from "../../utils/storageWriteOps";

export type ArchivistaFamily =
  | "fattura_ddt_magazzino"
  | "fattura_ddt_manutenzione"
  | "documento_mezzo"
  | "preventivo_magazzino"
  | "preventivo_manutenzione";

export type ArchivistaDuplicateChoice =
  | "stesso_documento"
  | "versione_migliore"
  | "documento_diverso";

export type ArchivistaDocumentCollectionTarget =
  | "@documenti_magazzino"
  | "@documenti_mezzi";

export type ArchivistaVehicleSubtype =
  | "libretto"
  | "assicurazione"
  | "revisione"
  | "collaudo";

export type ArchivistaReviewRow = {
  descrizione?: string | null;
  categoria?: string | null;
  quantita?: string | number | null;
  unita?: string | null;
  prezzoUnitario?: string | number | null;
  importo?: string | number | null;
  totale?: string | number | null;
  codice?: string | null;
  codiceArticolo?: string | null;
};

export type ArchivistaDuplicateCandidate = {
  id: string;
  target: string;
  title: string;
  subtitle: string;
  matchedFields: string[];
  fileUrl: string | null;
  fileStoragePath: string | null;
  family: ArchivistaFamily | null;
  rawRecord: Record<string, unknown>;
};

export type ArchivistaArchiveResult = {
  status: "archived" | "skipped_same";
  target: string;
  archiveId: string;
  fileUrl: string | null;
  fileStoragePath: string | null;
  duplicateChoice: ArchivistaDuplicateChoice | null;
  linkedPreviousId: string | null;
  message: string;
};

type ArchivistaDocumentArchiveArgs = {
  family: ArchivistaFamily;
  context: "magazzino" | "manutenzione" | "documento_mezzo";
  targetCollection: ArchivistaDocumentCollectionTarget;
  categoriaArchivio: "MAGAZZINO" | "MEZZO";
  selectedFile: File;
  fileName: string;
  basePayload: Record<string, unknown>;
  duplicateChoice?: ArchivistaDuplicateChoice | null;
  duplicateCandidate?: ArchivistaDuplicateCandidate | null;
};

type ArchivistaPreventivoArchiveArgs = {
  family: ArchivistaFamily;
  selectedFile: File;
  fileName: string;
  fornitore: string | null;
  numeroPreventivo: string | null;
  dataPreventivo: string | null;
  totaleDocumento: string | number | null;
  riassuntoBreve: string | null;
  righe: ArchivistaReviewRow[];
  avvisi: string[];
  campiMancanti: string[];
  ambitoPreventivo?: "magazzino" | "manutenzione" | null;
  metadatiMezzo?: {
    targa: string;
    km?: string | number | null;
  } | null;
  duplicateChoice?: ArchivistaDuplicateChoice | null;
  duplicateCandidate?: ArchivistaDuplicateCandidate | null;
};

type ArchivistaVehicle = Record<string, unknown> & {
  id?: string;
  targa?: string;
  marca?: string;
  modello?: string;
  telaio?: string;
  proprietario?: string;
  assicurazione?: string;
  dataImmatricolazione?: string;
  dataScadenzaRevisione?: string;
  dataUltimoCollaudo?: string;
  marcaModello?: string;
};

export type ArchivistaVehicleUpdateField = {
  key: string;
  label: string;
  currentValue: string;
  nextValue: string;
};

type ArchivistaVehicleUpdateArgs = {
  mezzoId: string;
  subtype: ArchivistaVehicleSubtype;
  analysis: Record<string, unknown>;
};

export function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeScalar(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value}`;
  }
  return normalizeText(value);
}

export function formatValue(value: unknown, fallback = "Non letto"): string {
  const normalized = normalizeScalar(value);
  return normalized || fallback;
}

export function normalizePlate(value: unknown): string {
  return normalizeScalar(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function normalizeDateKey(value: unknown): string {
  const text = normalizeScalar(value);
  if (!text) {
    return "";
  }

  const direct = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (direct) {
    const day = direct[1].padStart(2, "0");
    const month = direct[2].padStart(2, "0");
    const year = direct[3].length === 2 ? `20${direct[3]}` : direct[3];
    return `${year}-${month}-${day}`;
  }

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }

  return text.toLowerCase();
}

function normalizeNumberKey(value: unknown): string {
  const raw = normalizeScalar(value)
    .replace(/\s+/g, "")
    .replace(/[€$CHF]/gi, "");
  let text = raw;
  if (raw.includes(",") && raw.includes(".")) {
    const lastComma = raw.lastIndexOf(",");
    const lastDot = raw.lastIndexOf(".");
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    text = raw
      .replace(decimalSeparator === "," ? /\./g : /,/g, "")
      .replace(decimalSeparator, ".");
  } else if (raw.includes(",")) {
    text = raw.replace(/\./g, "").replace(",", ".");
  } else if (raw.includes(".")) {
    const parts = raw.split(".");
    text =
      parts.length > 2 || (parts.length === 2 && parts[1]?.length === 3)
        ? raw.replace(/\./g, "")
        : raw;
  }
  if (!text) {
    return "";
  }

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : text.toLowerCase();
}

function sanitizeFileName(value: string): string {
  const cleaned = value.replace(/[^\w.-]+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  return cleaned || "documento";
}

function buildStoragePathForFile(fileName: string, family: ArchivistaFamily, preferredId?: string): string {
  const safeName = sanitizeFileName(fileName);
  const stamp = preferredId || `${Date.now()}`;
  if (family === "preventivo_magazzino" || family === "preventivo_manutenzione") {
    return `preventivi/${stamp}_${safeName}`;
  }
  return `documenti_pdf/${stamp}_${safeName}`;
}

function sanitizeValue(value: unknown): unknown {
  if (value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry));
  }

  if (value && typeof value === "object") {
    if ("_methodName" in (value as Record<string, unknown>) || "isEqual" in (value as Record<string, unknown>)) {
      return value;
    }
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, sanitizeValue(nested)]),
    );
  }

  return value;
}

function buildDocumentTitle(rawRecord: Record<string, unknown>, fallbackFamily: string): string {
  const fornitore = normalizeScalar(rawRecord.fornitore) || normalizeScalar(rawRecord.fornitoreNome);
  const numero =
    normalizeScalar(rawRecord.numeroDocumento) || normalizeScalar(rawRecord.numeroPreventivo);
  const tipo =
    normalizeScalar(rawRecord.sottotipoDocumentoMezzo) ||
    normalizeScalar(rawRecord.tipoDocumento) ||
    fallbackFamily;

  return [tipo, fornitore, numero].filter(Boolean).join(" · ") || fallbackFamily;
}

function inferFamilyFromRecord(target: string, rawRecord: Record<string, unknown>): ArchivistaFamily | null {
  const explicit = normalizeText(rawRecord.famigliaArchivista);
  if (
    explicit === "fattura_ddt_magazzino" ||
    explicit === "fattura_ddt_manutenzione" ||
    explicit === "documento_mezzo" ||
    explicit === "preventivo_magazzino" ||
    explicit === "preventivo_manutenzione"
  ) {
    return explicit;
  }

  if (target === "@preventivi") {
    if (normalizeText(rawRecord.ambitoPreventivo) === "manutenzione") {
      return "preventivo_manutenzione";
    }
    return "preventivo_magazzino";
  }

  if (target === "@documenti_magazzino") {
    return "fattura_ddt_magazzino";
  }

  if (normalizeText(rawRecord.sottotipoDocumentoMezzo)) {
    return "documento_mezzo";
  }

  if (target === "@documenti_mezzi") {
    return "fattura_ddt_manutenzione";
  }

  return null;
}

function buildCandidateMatchFields(
  rawRecord: Record<string, unknown>,
  criteria: {
    family: ArchivistaFamily;
    fornitore?: string;
    numeroDocumento?: string;
    dataDocumento?: string;
    totaleDocumento?: string;
    targa?: string;
  },
): string[] {
  const matched: string[] = [];
  const family = inferFamilyFromRecord(String(rawRecord.__target ?? ""), rawRecord);
  if (family === criteria.family) {
    matched.push("Famiglia");
  }

  const supplier = normalizeScalar(rawRecord.fornitore) || normalizeScalar(rawRecord.fornitoreNome);
  if (criteria.fornitore && supplier && supplier.toLowerCase() === criteria.fornitore.toLowerCase()) {
    matched.push("Fornitore");
  }

  const number =
    normalizeScalar(rawRecord.numeroDocumento) || normalizeScalar(rawRecord.numeroPreventivo);
  if (criteria.numeroDocumento && number && number.toLowerCase() === criteria.numeroDocumento.toLowerCase()) {
    matched.push("Numero documento");
  }

  const date =
    normalizeDateKey(rawRecord.dataDocumento) || normalizeDateKey(rawRecord.dataPreventivo);
  if (criteria.dataDocumento && date && date === criteria.dataDocumento) {
    matched.push("Data");
  }

  const total = normalizeNumberKey(rawRecord.totaleDocumento);
  if (criteria.totaleDocumento && total && total === criteria.totaleDocumento) {
    matched.push("Totale");
  }

  const targa = normalizePlate(rawRecord.targa);
  if (criteria.targa && targa && targa === criteria.targa) {
    matched.push("Targa");
  }

  return matched;
}

function isStrongDuplicateMatch(matchedFields: string[]): boolean {
  const critical = new Set(["Numero documento", "Data", "Totale", "Targa"]);
  const criticalCount = matchedFields.filter((field) => critical.has(field)).length;
  return matchedFields.length >= 3 && criticalCount >= 2;
}

async function readDocumentCollectionRecords(
  targetCollection: ArchivistaDocumentCollectionTarget,
): Promise<Array<{ id: string; target: string; record: Record<string, unknown> }>> {
  const snapshot = await getDocs(collection(db, targetCollection));
  return snapshot.docs.map((entry) => ({
    id: entry.id,
    target: targetCollection,
    record: entry.data() as Record<string, unknown>,
  }));
}

async function readPreventiviRecords(): Promise<Array<{ id: string; target: string; record: Record<string, unknown> }>> {
  const refDoc = doc(db, "storage", "@preventivi");
  const snapshot = await getDoc(refDoc);
  const raw = snapshot.exists() ? snapshot.data() : null;
  const preventivi = Array.isArray(raw?.preventivi) ? raw.preventivi : [];
  return preventivi
    .filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object"))
    .map((entry) => ({
      id: normalizeText(entry.id) || `preventivo-${Math.random().toString(36).slice(2, 8)}`,
      target: "@preventivi",
      record: entry,
    }));
}

export async function findArchivistaDuplicateCandidates(args: {
  family: ArchivistaFamily;
  target: ArchivistaDocumentCollectionTarget | "@preventivi";
  fornitore?: string | null;
  numeroDocumento?: string | null;
  dataDocumento?: string | null;
  totaleDocumento?: string | number | null;
  targa?: string | null;
}): Promise<ArchivistaDuplicateCandidate[]> {
  const criteria = {
    family: args.family,
    fornitore: normalizeText(args.fornitore).toLowerCase(),
    numeroDocumento: normalizeText(args.numeroDocumento).toLowerCase(),
    dataDocumento: normalizeDateKey(args.dataDocumento),
    totaleDocumento: normalizeNumberKey(args.totaleDocumento),
    targa: normalizePlate(args.targa),
  };

  const sourceRecords =
    args.target === "@preventivi"
      ? await readPreventiviRecords()
      : await readDocumentCollectionRecords(args.target);

  return sourceRecords
    .map(({ id, target, record }) => {
      const rawRecord = { ...record, __target: target } as Record<string, unknown> & {
        __target: string;
      };
      const family = inferFamilyFromRecord(target, rawRecord);
      if (family !== criteria.family) {
        return null;
      }
      const matchedFields = buildCandidateMatchFields(rawRecord, criteria);
      if (!isStrongDuplicateMatch(matchedFields)) {
        return null;
      }

      return {
        id,
        target,
        title: buildDocumentTitle(rawRecord, target),
        subtitle: [
          normalizeScalar(rawRecord.dataDocumento) || normalizeScalar(rawRecord.dataPreventivo),
          normalizeScalar(rawRecord.totaleDocumento),
          normalizeScalar(rawRecord.targa),
        ]
          .filter(Boolean)
          .join(" · "),
        matchedFields,
        fileUrl:
          normalizeText(rawRecord.fileUrl) ||
          normalizeText(rawRecord.pdfUrl) ||
          (Array.isArray(rawRecord.imageUrls) ? normalizeText(rawRecord.imageUrls[0]) : "") ||
          null,
        fileStoragePath:
          normalizeText(rawRecord.fileStoragePath) ||
          normalizeText(rawRecord.pdfStoragePath) ||
          (Array.isArray(rawRecord.imageStoragePaths)
            ? normalizeText(rawRecord.imageStoragePaths[0])
            : "") ||
          null,
        family,
        rawRecord,
      } as ArchivistaDuplicateCandidate;
    })
    .filter((entry): entry is ArchivistaDuplicateCandidate => Boolean(entry))
    .slice(0, 3);
}

async function uploadArchivistaOriginalFile(args: {
  selectedFile: File;
  family: ArchivistaFamily;
  archiveId?: string;
}): Promise<{ fileUrl: string; fileStoragePath: string }> {
  const fileStoragePath = buildStoragePathForFile(args.selectedFile.name, args.family, args.archiveId);
  const storageRef = ref(storage, fileStoragePath);
  await uploadBytes(storageRef, args.selectedFile, {
    contentType: args.selectedFile.type || "application/octet-stream",
  });
  const fileUrl = await getDownloadURL(storageRef);
  return { fileUrl, fileStoragePath };
}

function buildDuplicateMetadata(
  duplicateChoice: ArchivistaDuplicateChoice | null | undefined,
  duplicateCandidate: ArchivistaDuplicateCandidate | null | undefined,
): Record<string, unknown> {
  return {
    duplicateChoice: duplicateChoice ?? null,
    duplicateOfId:
      duplicateChoice === "versione_migliore" && duplicateCandidate ? duplicateCandidate.id : null,
    duplicateTarget:
      duplicateChoice === "versione_migliore" && duplicateCandidate ? duplicateCandidate.target : null,
    archivedAsDifferentFromId:
      duplicateChoice === "documento_diverso" && duplicateCandidate ? duplicateCandidate.id : null,
  };
}

export async function archiveArchivistaDocumentRecord(
  args: ArchivistaDocumentArchiveArgs,
): Promise<ArchivistaArchiveResult> {
  const duplicateChoice = args.duplicateChoice ?? null;
  const duplicateCandidate = args.duplicateCandidate ?? null;

  if (duplicateChoice === "stesso_documento" && duplicateCandidate) {
    return {
      status: "skipped_same",
      target: duplicateCandidate.target,
      archiveId: duplicateCandidate.id,
      fileUrl: duplicateCandidate.fileUrl,
      fileStoragePath: duplicateCandidate.fileStoragePath,
      duplicateChoice,
      linkedPreviousId: duplicateCandidate.id,
      message: "Hai confermato che si tratta dello stesso documento: non viene creato un nuovo record.",
    };
  }

  const { fileUrl, fileStoragePath } = await uploadArchivistaOriginalFile({
    selectedFile: args.selectedFile,
    family: args.family,
  });

  const payload = sanitizeValue({
    ...args.basePayload,
    categoriaArchivio: args.categoriaArchivio,
    nomeFile: args.fileName,
    fileUrl,
    fileStoragePath,
    fonte: "IA_ARCHIVISTA_V1",
    famigliaArchivista: args.family,
    contestoArchivista: args.context,
    statoArchivio: "archiviato",
    createdAt: serverTimestamp(),
    ...buildDuplicateMetadata(duplicateChoice, duplicateCandidate),
  });

  const savedRef = await addDoc(collection(db, args.targetCollection), payload);

  return {
    status: "archived",
    target: args.targetCollection,
    archiveId: savedRef.id,
    fileUrl,
    fileStoragePath,
    duplicateChoice,
    linkedPreviousId:
      duplicateChoice === "versione_migliore" && duplicateCandidate ? duplicateCandidate.id : null,
    message:
      duplicateChoice === "versione_migliore"
        ? "Documento archiviato come versione migliore, mantenendo intatto l'originale precedente."
        : "Documento archiviato correttamente.",
  };
}

function sanitizePreventivoRows(rows: ArchivistaReviewRow[]): Array<Record<string, unknown>> {
  return rows.map((row, index) => ({
    id: `riga-${index + 1}`,
    descrizione: normalizeText(row.descrizione).toUpperCase() || `RIGA ${index + 1}`,
    unita: normalizeText(row.unita) || "pz",
    prezzoUnitario: Number(normalizeNumberKey(row.prezzoUnitario || row.importo || row.totale)) || 0,
    note: normalizeText(row.categoria) || undefined,
  }));
}

export async function archiveArchivistaPreventivoRecord(
  args: ArchivistaPreventivoArchiveArgs,
): Promise<ArchivistaArchiveResult> {
  const duplicateChoice = args.duplicateChoice ?? null;
  const duplicateCandidate = args.duplicateCandidate ?? null;

  if (duplicateChoice === "stesso_documento" && duplicateCandidate) {
    return {
      status: "skipped_same",
      target: duplicateCandidate.target,
      archiveId: duplicateCandidate.id,
      fileUrl: duplicateCandidate.fileUrl,
      fileStoragePath: duplicateCandidate.fileStoragePath,
      duplicateChoice,
      linkedPreviousId: duplicateCandidate.id,
      message: "Hai confermato che si tratta dello stesso preventivo: non viene creato un nuovo record.",
    };
  }

  const archiveId =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `prev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const { fileUrl, fileStoragePath } = await uploadArchivistaOriginalFile({
    selectedFile: args.selectedFile,
    family: args.family,
    archiveId,
  });

  const refDoc = doc(db, "storage", "@preventivi");
  const snapshot = await getDoc(refDoc);
  const currentRaw = snapshot.exists() ? snapshot.data() : null;
  const currentPreventivi = Array.isArray(currentRaw?.preventivi) ? currentRaw.preventivi : [];
  const now = Date.now();
  const isPdf = normalizeText(args.selectedFile.type).toLowerCase() === "application/pdf";

  const nuovoPreventivo = sanitizeValue({
    id: archiveId,
    fornitoreId: "ARCHIVISTA_V1",
    fornitoreNome: args.fornitore || "FORNITORE DA VERIFICARE",
    numeroPreventivo: args.numeroPreventivo || `SENZA-NUMERO-${archiveId.slice(0, 8)}`,
    dataPreventivo: args.dataPreventivo || "",
    totaleDocumento: args.totaleDocumento ?? null,
    pdfUrl: isPdf ? fileUrl : null,
    pdfStoragePath: isPdf ? fileStoragePath : null,
    imageStoragePaths: isPdf ? [] : [fileStoragePath],
    imageUrls: isPdf ? [] : [fileUrl],
    righe: sanitizePreventivoRows(args.righe),
    createdAt: now,
    updatedAt: now,
    famigliaArchivista: args.family,
    ambitoPreventivo: args.ambitoPreventivo ?? null,
    statoArchivio: "archiviato",
    riassuntoBreve: args.riassuntoBreve,
    avvisiArchivista: args.avvisi,
    campiMancantiArchivista: args.campiMancanti,
    metadatiMezzo: args.metadatiMezzo
      ? {
          targa: normalizeText(args.metadatiMezzo.targa),
          km: args.metadatiMezzo.km ?? null,
        }
      : null,
    ...buildDuplicateMetadata(duplicateChoice, duplicateCandidate),
  });

  const nextPreventivi = [nuovoPreventivo, ...currentPreventivi];
  await setDoc(refDoc, { preventivi: nextPreventivi }, { merge: true });

  return {
    status: "archived",
    target: "@preventivi",
    archiveId,
    fileUrl,
    fileStoragePath,
    duplicateChoice,
    linkedPreviousId:
      duplicateChoice === "versione_migliore" && duplicateCandidate ? duplicateCandidate.id : null,
    message:
      duplicateChoice === "versione_migliore"
        ? "Preventivo archiviato come versione migliore, mantenendo intatto il record precedente."
        : "Preventivo archiviato correttamente.",
  };
}

export async function readArchivistaVehicles(): Promise<ArchivistaVehicle[]> {
  const raw = await getItemSync("@mezzi_aziendali");
  return Array.isArray(raw) ? (raw as ArchivistaVehicle[]) : [];
}

function buildVehicleFieldUpdates(
  subtype: ArchivistaVehicleSubtype,
  mezzo: ArchivistaVehicle,
  analysis: Record<string, unknown>,
): ArchivistaVehicleUpdateField[] {
  const candidates: Array<{ key: string; label: string; nextValue: string }> = [];

  const common = [
    { key: "targa", label: "Targa", nextValue: normalizeText(analysis.targa) },
    { key: "marca", label: "Marca", nextValue: normalizeText(analysis.marca) },
    { key: "modello", label: "Modello", nextValue: normalizeText(analysis.modello) },
    { key: "telaio", label: "Telaio", nextValue: normalizeText(analysis.telaio) },
    { key: "proprietario", label: "Proprietario", nextValue: normalizeText(analysis.proprietario) },
    {
      key: "dataImmatricolazione",
      label: "Data immatricolazione",
      nextValue: normalizeText(analysis.dataImmatricolazione),
    },
  ];

  common.forEach((entry) => {
    if (entry.nextValue) {
      candidates.push(entry);
    }
  });

  if (subtype === "assicurazione") {
    const nextValue = normalizeText(analysis.assicurazione) || normalizeText(analysis.fornitore);
    if (nextValue) {
      candidates.push({ key: "assicurazione", label: "Assicurazione", nextValue });
    }
  }

  if (subtype === "revisione" || subtype === "collaudo") {
    if (normalizeText(analysis.dataUltimoCollaudo)) {
      candidates.push({
        key: "dataUltimoCollaudo",
        label: "Data ultimo collaudo",
        nextValue: normalizeText(analysis.dataUltimoCollaudo),
      });
    }
    if (normalizeText(analysis.dataScadenzaRevisione) || normalizeText(analysis.dataScadenza)) {
      candidates.push({
        key: "dataScadenzaRevisione",
        label: "Scadenza revisione",
        nextValue: normalizeText(analysis.dataScadenzaRevisione) || normalizeText(analysis.dataScadenza),
      });
    }
  }

  return candidates
    .map((entry) => ({
      ...entry,
      currentValue: normalizeScalar(mezzo[entry.key]) || "Vuoto",
    }))
    .filter((entry) => entry.nextValue && entry.currentValue !== entry.nextValue);
}

export function buildArchivistaVehicleUpdatePreview(args: {
  mezzo: ArchivistaVehicle | null;
  subtype: ArchivistaVehicleSubtype;
  analysis: Record<string, unknown>;
}): ArchivistaVehicleUpdateField[] {
  if (!args.mezzo) {
    return [];
  }
  return buildVehicleFieldUpdates(args.subtype, args.mezzo, args.analysis);
}

export async function applyArchivistaVehicleUpdate(
  args: ArchivistaVehicleUpdateArgs,
): Promise<{ updatedVehicleId: string; appliedFields: ArchivistaVehicleUpdateField[] }> {
  const mezzi = await readArchivistaVehicles();
  const index = mezzi.findIndex((entry) => normalizeText(entry.id) === args.mezzoId);
  if (index < 0) {
    throw new Error("Mezzo non trovato per l'aggiornamento confermato.");
  }

  const current = { ...mezzi[index] };
  const appliedFields = buildVehicleFieldUpdates(args.subtype, current, args.analysis);
  if (!appliedFields.length) {
    return { updatedVehicleId: args.mezzoId, appliedFields: [] };
  }

  appliedFields.forEach((field) => {
    current[field.key] = field.nextValue;
  });

  if (normalizeText(current.marca) || normalizeText(current.modello)) {
    current.marcaModello = [normalizeText(current.marca), normalizeText(current.modello)]
      .filter(Boolean)
      .join(" ");
  }

  const next = [...mezzi];
  next[index] = current;
  await setItemSync("@mezzi_aziendali", next);

  const refreshed = await readArchivistaVehicles();
  const refreshedVehicle = refreshed.find((entry) => normalizeText(entry.id) === args.mezzoId);
  if (!refreshedVehicle) {
    throw new Error("Aggiornamento mezzo non verificabile dopo il salvataggio.");
  }

  return { updatedVehicleId: args.mezzoId, appliedFields };
}
