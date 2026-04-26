/**
 * SPEC: docs/product/SPEC_ATTREZZATURE_CANTIERI_NEXT.md
 * Step E.1 scaffold: writer implementati, UI assente.
 */

import { db, storage } from "../firebase";
import { readNextAttrezzatureCantieriSnapshot } from "./domain/nextAttrezzatureCantieriDomain";
import type {
  NextAttrezzaturaMovimentoReadOnlyItem,
  NextAttrezzaturaMovimentoTipo,
} from "./domain/nextAttrezzatureCantieriDomain";
import { setDoc } from "../utils/firestoreWriteOps";
import { deleteObject, uploadBytes } from "../utils/storageWriteOps";

const STORAGE_COLLECTION = "storage";
const ATTREZZATURE_DOC_ID = "@attrezzature_cantieri";
const FOTO_STORAGE_PREFIX = "attrezzature/";

type AttrezzaturaMovimentoRecord = {
  id: string;
  tipo: NextAttrezzaturaMovimentoTipo;
  data: string;
  materialeCategoria: string;
  descrizione: string;
  quantita: number;
  unita: string;
  cantiereId: string;
  cantiereLabel: string;
  note: string | null;
  fotoUrl: string | null;
  fotoStoragePath: string | null;
  sourceCantiereId: string | null;
  sourceCantiereLabel: string | null;
};

export type CreateMovimentoAttrezzaturaParams = {
  tipo: NextAttrezzaturaMovimentoTipo;
  data: string;
  materialeCategoria: string;
  descrizione: string;
  quantita: number;
  unita: string;
  cantiereId: string;
  cantiereLabel: string;
  note: string | null;
  fotoFile: File | null;
  sourceCantiereId: string | null;
  sourceCantiereLabel: string | null;
};

export type EditMovimentoAttrezzaturaParams = {
  originalRecord: NextAttrezzaturaMovimentoReadOnlyItem;
  updatedFields: {
    tipo: NextAttrezzaturaMovimentoTipo;
    data: string;
    materialeCategoria: string;
    descrizione: string;
    quantita: number;
    unita: string;
    cantiereId: string;
    cantiereLabel: string;
    note: string | null;
    fotoUrl: string | null;
    fotoStoragePath: string | null;
    sourceCantiereId: string | null;
    sourceCantiereLabel: string | null;
  };
  newFotoFile: File | null;
  onSaved: () => void | Promise<void>;
};

export type DeleteMovimentoAttrezzaturaParams = {
  record: NextAttrezzaturaMovimentoReadOnlyItem;
  onDeleted: () => void | Promise<void>;
};

export type DeleteFotoMovimentoParams = {
  fotoStoragePath: string | null;
};

export type UploadFotoMovimentoResult = {
  fotoUrl: string;
  fotoStoragePath: string;
};

export type NextAttrezzatureCantieriWritePanelProps = {
  onAfterWrite?: () => void | Promise<void>;
};

type FirestoreDocumentData = Record<string, unknown>;

function buildId(): string {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeText(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function todayLegacyFormat(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${day} ${month} ${now.getFullYear()}`;
}

function getFileExtension(file: File): string {
  const match = normalizeText(file.name).match(/\.([A-Za-z0-9]+)$/);
  return match?.[1] ? match[1].toLowerCase() : "bin";
}

function isRecord(value: unknown): value is FirestoreDocumentData {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unwrapStorageArray(rawDoc: unknown): unknown[] {
  if (!rawDoc) return [];
  if (Array.isArray(rawDoc)) return rawDoc;
  if (!isRecord(rawDoc)) return [];
  if (Array.isArray(rawDoc.items)) return rawDoc.items;

  const value = rawDoc.value;
  if (Array.isArray(value)) return value;
  if (isRecord(value) && Array.isArray(value.items)) return value.items;

  return [];
}

function getRawMovementId(entry: unknown, index: number): string {
  if (!isRecord(entry)) return `attrezzatura:${index}`;
  const rawId = entry.id;
  return typeof rawId === "string" && rawId.trim() ? rawId.trim() : `attrezzatura:${index}`;
}

function validateMovementFields(input: {
  descrizione: string;
  quantita: number;
  unita: string;
  cantiereLabel: string;
}): string | null {
  if (!normalizeText(input.descrizione)) return "Inserisci una descrizione.";
  if (!Number.isFinite(input.quantita) || input.quantita <= 0) {
    return "Inserisci una quantita valida.";
  }
  if (!normalizeText(input.unita)) return "Inserisci una unita valida.";
  if (!normalizeText(input.cantiereLabel)) return "Inserisci un cantiere valido.";
  return null;
}

function resolveEditRecordId(record: NextAttrezzaturaMovimentoReadOnlyItem): string {
  const normalizedId = normalizeText(record.id);
  const reconstructed = record.flags.includes("id_ricostruito") || normalizedId.startsWith("attrezzatura:");
  return normalizedId && !reconstructed ? normalizedId : buildId();
}

function buildRecordFromCreate(
  params: CreateMovimentoAttrezzaturaParams,
  id: string,
  uploaded: UploadFotoMovimentoResult | null,
): AttrezzaturaMovimentoRecord {
  const cantiereId = normalizeText(params.cantiereId);
  const cantiereLabel = normalizeText(params.cantiereLabel) || cantiereId;

  return {
    id,
    tipo: params.tipo,
    data: normalizeText(params.data) || todayLegacyFormat(),
    materialeCategoria: normalizeText(params.materialeCategoria) || "TUBI",
    descrizione: normalizeText(params.descrizione),
    quantita: params.quantita,
    unita: normalizeText(params.unita),
    cantiereId,
    cantiereLabel,
    note: normalizeOptionalText(params.note),
    fotoUrl: uploaded?.fotoUrl ?? null,
    fotoStoragePath: uploaded?.fotoStoragePath ?? null,
    sourceCantiereId:
      params.tipo === "SPOSTATO" ? normalizeOptionalText(params.sourceCantiereId) : null,
    sourceCantiereLabel:
      params.tipo === "SPOSTATO"
        ? normalizeOptionalText(params.sourceCantiereLabel) ??
          normalizeOptionalText(params.sourceCantiereId)
        : null,
  };
}

function buildRecordFromEdit(
  params: EditMovimentoAttrezzaturaParams,
  id: string,
  fotoUrl: string | null,
  fotoStoragePath: string | null,
): AttrezzaturaMovimentoRecord {
  const cantiereId = normalizeText(params.updatedFields.cantiereId);
  const cantiereLabel = normalizeText(params.updatedFields.cantiereLabel) || cantiereId;

  return {
    id,
    tipo: params.updatedFields.tipo,
    data: normalizeText(params.updatedFields.data) || todayLegacyFormat(),
    materialeCategoria: normalizeText(params.updatedFields.materialeCategoria) || "TUBI",
    descrizione: normalizeText(params.updatedFields.descrizione),
    quantita: params.updatedFields.quantita,
    unita: normalizeText(params.updatedFields.unita),
    cantiereId,
    cantiereLabel,
    note: normalizeOptionalText(params.updatedFields.note),
    fotoUrl,
    fotoStoragePath,
    sourceCantiereId:
      params.updatedFields.tipo === "SPOSTATO"
        ? normalizeOptionalText(params.updatedFields.sourceCantiereId)
        : null,
    sourceCantiereLabel:
      params.updatedFields.tipo === "SPOSTATO"
        ? normalizeOptionalText(params.updatedFields.sourceCantiereLabel) ??
          normalizeOptionalText(params.updatedFields.sourceCantiereId)
        : null,
  };
}

async function getAttrezzatureDocumentReference() {
  const { collection, doc } = await import("firebase/firestore");
  return doc(collection(db, STORAGE_COLLECTION), ATTREZZATURE_DOC_ID);
}

async function readCurrentMovimenti(): Promise<unknown[]> {
  const { getDoc } = await import("firebase/firestore");
  const reference = await getAttrezzatureDocumentReference();
  const snapshot = await getDoc(reference);
  return snapshot.exists() ? unwrapStorageArray(snapshot.data()) : [];
}

async function writeMovimenti(items: unknown[]): Promise<void> {
  const reference = await getAttrezzatureDocumentReference();
  await setDoc(reference, { value: items });
  await readNextAttrezzatureCantieriSnapshot();
}

async function uploadFotoMovimento(params: {
  movimentoId: string;
  fotoFile: File;
}): Promise<UploadFotoMovimentoResult> {
  const { getDownloadURL, ref } = await import("firebase/storage");
  const extension = getFileExtension(params.fotoFile);
  const fotoStoragePath = `${FOTO_STORAGE_PREFIX}${params.movimentoId}-${Date.now()}.${extension}`;
  const storageReference = ref(storage, fotoStoragePath);

  await uploadBytes(storageReference, params.fotoFile);
  const fotoUrl = await getDownloadURL(storageReference);

  return { fotoUrl, fotoStoragePath };
}

async function deleteFotoMovimento(params: DeleteFotoMovimentoParams): Promise<void> {
  const fotoStoragePath = normalizeText(params.fotoStoragePath);
  if (!fotoStoragePath) return;

  try {
    const { ref } = await import("firebase/storage");
    await deleteObject(ref(storage, fotoStoragePath));
  } catch (error) {
    console.warn("Errore eliminazione foto attrezzatura ignorato:", error);
  }
}

async function createMovimentoAttrezzatura(
  params: CreateMovimentoAttrezzaturaParams,
): Promise<void> {
  const cantiereLabel = normalizeText(params.cantiereLabel) || normalizeText(params.cantiereId);
  const validationError = validateMovementFields({
    descrizione: params.descrizione,
    quantita: params.quantita,
    unita: params.unita,
    cantiereLabel,
  });
  if (validationError) {
    window.alert(validationError);
    return;
  }

  const id = buildId();
  let uploaded: UploadFotoMovimentoResult | null = null;

  if (params.fotoFile) {
    try {
      uploaded = await uploadFotoMovimento({ movimentoId: id, fotoFile: params.fotoFile });
    } catch (error) {
      console.error("Errore upload foto attrezzatura:", error);
      window.alert("Errore caricamento foto. Riprova.");
      return;
    }
  }

  const record = buildRecordFromCreate(params, id, uploaded);
  const items = await readCurrentMovimenti();
  await writeMovimenti([...items, record]);
}

async function editMovimentoAttrezzatura(
  params: EditMovimentoAttrezzaturaParams,
): Promise<void> {
  const cantiereLabel =
    normalizeText(params.updatedFields.cantiereLabel) || normalizeText(params.updatedFields.cantiereId);
  const validationError = validateMovementFields({
    descrizione: params.updatedFields.descrizione,
    quantita: params.updatedFields.quantita,
    unita: params.updatedFields.unita,
    cantiereLabel,
  });
  if (validationError) {
    window.alert(validationError);
    return;
  }

  const updatedId = resolveEditRecordId(params.originalRecord);
  let fotoUrl = normalizeOptionalText(params.updatedFields.fotoUrl);
  let fotoStoragePath = normalizeOptionalText(params.updatedFields.fotoStoragePath);

  if (params.newFotoFile) {
    try {
      const uploaded = await uploadFotoMovimento({
        movimentoId: updatedId,
        fotoFile: params.newFotoFile,
      });
      fotoUrl = uploaded.fotoUrl;
      fotoStoragePath = uploaded.fotoStoragePath;
    } catch (error) {
      console.error("Errore upload foto attrezzatura:", error);
      window.alert("Errore caricamento foto. Riprova.");
      return;
    }

    if (params.originalRecord.fotoStoragePath) {
      await deleteFotoMovimento({ fotoStoragePath: params.originalRecord.fotoStoragePath });
    }
  }

  const updated = buildRecordFromEdit(params, updatedId, fotoUrl, fotoStoragePath);
  const items = await readCurrentMovimenti();
  const nextItems = items.map((item, index) =>
    getRawMovementId(item, index) === params.originalRecord.id ? updated : item,
  );

  await writeMovimenti(nextItems);
  await params.onSaved();
}

const saveEditMovimentoAttrezzatura = editMovimentoAttrezzatura;

async function deleteMovimentoAttrezzatura(
  params: DeleteMovimentoAttrezzaturaParams,
): Promise<void> {
  if (params.record.fotoStoragePath) {
    await deleteFotoMovimento({ fotoStoragePath: params.record.fotoStoragePath });
  }

  const items = await readCurrentMovimenti();
  const nextItems = items.filter(
    (item, index) => getRawMovementId(item, index) !== params.record.id,
  );

  await writeMovimenti(nextItems);
  await params.onDeleted();
}

const removeEditFotoAttrezzatura = deleteFotoMovimento;

type NextAttrezzatureCantieriWritePanelComponent = ((
  props: NextAttrezzatureCantieriWritePanelProps,
) => null) & {
  createMovimentoAttrezzatura: typeof createMovimentoAttrezzatura;
  editMovimentoAttrezzatura: typeof editMovimentoAttrezzatura;
  saveEditMovimentoAttrezzatura: typeof saveEditMovimentoAttrezzatura;
  deleteMovimentoAttrezzatura: typeof deleteMovimentoAttrezzatura;
  uploadFotoMovimento: typeof uploadFotoMovimento;
  deleteFotoMovimento: typeof deleteFotoMovimento;
  removeEditFotoAttrezzatura: typeof removeEditFotoAttrezzatura;
};

const NextAttrezzatureCantieriWritePanel = ((
  props: NextAttrezzatureCantieriWritePanelProps,
) => {
  void props;
  return null;
}) as NextAttrezzatureCantieriWritePanelComponent;

NextAttrezzatureCantieriWritePanel.createMovimentoAttrezzatura = createMovimentoAttrezzatura;
NextAttrezzatureCantieriWritePanel.editMovimentoAttrezzatura = editMovimentoAttrezzatura;
NextAttrezzatureCantieriWritePanel.saveEditMovimentoAttrezzatura = saveEditMovimentoAttrezzatura;
NextAttrezzatureCantieriWritePanel.deleteMovimentoAttrezzatura = deleteMovimentoAttrezzatura;
NextAttrezzatureCantieriWritePanel.uploadFotoMovimento = uploadFotoMovimento;
NextAttrezzatureCantieriWritePanel.deleteFotoMovimento = deleteFotoMovimento;
NextAttrezzatureCantieriWritePanel.removeEditFotoAttrezzatura = removeEditFotoAttrezzatura;

export default NextAttrezzatureCantieriWritePanel;
