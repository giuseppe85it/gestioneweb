import { collection, doc, getDoc } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { db, storage } from "../firebase";
import { setDoc } from "../utils/firestoreWriteOps";
import { uploadBytes } from "../utils/storageWriteOps";

export type Valuta = "CHF" | "EUR";

type PreventivoRiga = {
  id: string;
  descrizione: string;
  unita: string;
  prezzoUnitario: number;
  note?: string;
};

type Preventivo = {
  id: string;
  fornitoreId: string;
  fornitoreNome: string;
  numeroPreventivo: string;
  dataPreventivo: string;
  pdfUrl: string | null;
  pdfStoragePath: string | null;
  ricevutoDaWhatsapp?: boolean;
  ricevutoDaEmail?: boolean;
  imageStoragePaths?: string[];
  imageUrls?: string[];
  righe: PreventivoRiga[];
  createdAt: number;
  updatedAt: number;
};

type ListinoVoce = {
  id: string;
  fornitoreId: string;
  fornitoreNome: string;
  articoloCanonico: string;
  codiceArticolo?: string;
  note?: string;
  unita: string;
  valuta: Valuta;
  prezzoAttuale: number;
  fonteAttuale: {
    preventivoId: string;
    numeroPreventivo: string;
    dataPreventivo: string;
    note?: string;
    pdfUrl: string | null;
    pdfStoragePath: string | null;
    imageStoragePaths?: string[];
    imageUrls?: string[];
  };
  prezzoPrecedente?: number;
  fontePrecedente?: {
    preventivoId: string;
    numeroPreventivo: string;
    dataPreventivo: string;
    note?: string;
    imageStoragePaths?: string[];
    imageUrls?: string[];
  };
  trend: "down" | "up" | "same" | "new";
  deltaAbs?: number;
  deltaPct?: number;
  updatedAt: number;
};

type SaveNextPreventivoManualeInput = {
  testata: {
    fornitoreId: string;
    fornitoreNome: string;
    numeroPreventivo: string;
    dataPreventivo: string;
  };
  righe: Array<{
    descrizione: string;
    unita: string;
    prezzoUnitario: number;
    note?: string;
  }>;
  foto: File[];
  ricevutoDaWhatsapp?: boolean;
  ricevutoDaEmail?: boolean;
  pdfFile?: File | null;
  pdfStoragePath?: string | null;
  pdfUrl?: string | null;
  imageStoragePrefix?: string | null;
};

type SaveAndUpsertParams = {
  testata: {
    fornitoreId: string;
    fornitoreNome: string;
    numeroPreventivo: string;
    dataPreventivo: string;
  };
  righe: Array<{
    descrizione: string;
    codiceArticolo?: string;
    unita: string;
    prezzoUnitario: number;
    note?: string;
  }>;
  valuta: Valuta;
  foto: File[];
  ricevutoDaWhatsapp?: boolean;
  ricevutoDaEmail?: boolean;
  pdfFile?: File | null;
  pdfStoragePath?: string | null;
  pdfUrl?: string | null;
  imageStoragePrefix?: string | null;
  fonteAttualeUsesPreventivoPdf?: boolean | null;
};

const STORAGE_COLLECTION = "storage";
const PREVENTIVI_DOC_ID = "@preventivi";
const LISTINO_DOC_ID = "@listino_prezzi";
const DEFAULT_PREVENTIVO_STORAGE_PREFIX = "preventivi/manuali/";

function normalizeDescrizione(v: string) {
  return String(v || "")
    .toUpperCase()
    .trim()
    .replace(/[.\-_/]/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeUnita(v: string) {
  return String(v || "").toUpperCase().trim();
}

function normalizeArticoloCanonico(v: string) {
  return normalizeDescrizione(v);
}

function computeTrend(prezzoNuovo: number, prezzoPrecedente?: number) {
  if (prezzoPrecedente === undefined || prezzoPrecedente === null || !Number.isFinite(prezzoPrecedente)) {
    return { trend: "new" as const, deltaAbs: undefined as number | undefined, deltaPct: undefined as number | undefined };
  }
  const deltaAbs = prezzoNuovo - prezzoPrecedente;
  const deltaPct = prezzoPrecedente === 0 ? undefined : (deltaAbs / prezzoPrecedente) * 100;
  if (deltaAbs < 0) return { trend: "down" as const, deltaAbs, deltaPct };
  if (deltaAbs > 0) return { trend: "up" as const, deltaAbs, deltaPct };
  return { trend: "same" as const, deltaAbs, deltaPct: 0 };
}

function listinoKey(input: {
  fornitoreId: string;
  articoloCanonico: string;
  unita: string;
  valuta: Valuta;
}) {
  return [
    String(input.fornitoreId || "").trim(),
    normalizeArticoloCanonico(input.articoloCanonico),
    normalizeUnita(input.unita),
    input.valuta,
  ].join("|");
}

function sanitizeUndefinedToNull<T>(value: T): T {
  if (value === undefined) return null as T;
  if (value === null) return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeUndefinedToNull(item)) as T;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      out[key] = item === undefined ? null : sanitizeUndefinedToNull(item);
    });
    return out as T;
  }
  return value;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter((item) => item.length > 0);
}

const generaId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function readFileExtension(file: File): string {
  const match = String(file.name || "").trim().match(/\.([A-Za-z0-9]+)$/);
  if (match?.[1]) return String(match[1]).toLowerCase();
  return "bin";
}

async function uploadPreventivoManualeFoto(args: {
  preventivoId: string;
  foto: File[];
  prefix?: string | null;
  strict?: boolean;
}): Promise<{ imageStoragePaths: string[]; imageUrls: string[] }> {
  const imageStoragePaths: string[] = [];
  const imageUrls: string[] = [];
  const normalizedPrefix = String(args.prefix || DEFAULT_PREVENTIVO_STORAGE_PREFIX).trim() || DEFAULT_PREVENTIVO_STORAGE_PREFIX;

  for (let index = 0; index < args.foto.length; index += 1) {
    const file = args.foto[index];
    const extension = readFileExtension(file);
    const storagePath = `${normalizedPrefix}${args.preventivoId}_${index + 1}.${extension}`;

    try {
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      imageStoragePaths.push(storagePath);
      imageUrls.push(downloadUrl);
    } catch (error) {
      console.error("Errore upload foto preventivo manuale:", {
        storagePath,
        error,
      });
      if (args.strict) {
        throw new Error("Errore upload immagini preventivo.");
      }
    }
  }

  return { imageStoragePaths, imageUrls };
}

export async function saveNextPreventivoManuale(
  input: SaveNextPreventivoManualeInput,
): Promise<Preventivo> {
  const preventivoId = generaId();
  const normalizedImageStoragePrefix =
    String(input.imageStoragePrefix || DEFAULT_PREVENTIVO_STORAGE_PREFIX).trim() ||
    DEFAULT_PREVENTIVO_STORAGE_PREFIX;
  let pdfStoragePath: string | null = null;
  let pdfUrl: string | null = null;

  if (input.pdfFile) {
    const storagePath = `${normalizedImageStoragePrefix}${preventivoId}.pdf`;
    try {
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, input.pdfFile);
      pdfStoragePath = storagePath;
      pdfUrl = await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Errore upload PDF preventivo:", {
        storagePath,
        error,
      });
      throw new Error("Errore upload PDF preventivo.");
    }
  } else if (String(input.pdfStoragePath || "").trim()) {
    pdfStoragePath = String(input.pdfStoragePath || "").trim();
    pdfUrl = String(input.pdfUrl || "").trim() || null;
  }

  const { imageStoragePaths, imageUrls } = await uploadPreventivoManualeFoto({
    preventivoId,
    foto: input.foto,
    prefix: normalizedImageStoragePrefix,
    strict:
      normalizedImageStoragePrefix !== DEFAULT_PREVENTIVO_STORAGE_PREFIX ||
      Boolean(input.pdfFile || input.pdfStoragePath || input.pdfUrl),
  });

  const now = Date.now();
  const preventivo: Preventivo = {
    id: preventivoId,
    fornitoreId: input.testata.fornitoreId,
    fornitoreNome: input.testata.fornitoreNome,
    numeroPreventivo: input.testata.numeroPreventivo.trim(),
    dataPreventivo: input.testata.dataPreventivo,
    pdfUrl,
    pdfStoragePath,
    ...(input.ricevutoDaWhatsapp ? { ricevutoDaWhatsapp: true } : {}),
    ...(input.ricevutoDaEmail ? { ricevutoDaEmail: true } : {}),
    imageStoragePaths,
    imageUrls,
    righe: input.righe.map((riga) => ({
      id: generaId(),
      descrizione: riga.descrizione.trim(),
      unita: riga.unita.trim(),
      prezzoUnitario: Number(riga.prezzoUnitario),
      note: String(riga.note || "").trim() || undefined,
    })),
    createdAt: now,
    updatedAt: now,
  };

  const preventiviRef = doc(collection(db, STORAGE_COLLECTION), PREVENTIVI_DOC_ID);
  const preventiviSnap = await getDoc(preventiviRef);
  const currentPreventivi: Preventivo[] = preventiviSnap.exists()
    ? Array.isArray(preventiviSnap.data()?.preventivi)
      ? ((preventiviSnap.data()?.preventivi as Preventivo[]) || [])
      : []
    : [];

  await setDoc(
    preventiviRef,
    sanitizeUndefinedToNull({ preventivi: [preventivo, ...currentPreventivi] }),
    { merge: true },
  );

  return preventivo;
}

export async function upsertListinoFromPreventivoManuale(
  preventivo: Preventivo,
  valuta: Valuta,
  codiciArticoloPerRiga: (string | undefined)[],
  pdfFieldsForFonte?: { pdfStoragePath: string | null; pdfUrl: string | null } | null,
): Promise<void> {
  const listinoRef = doc(collection(db, STORAGE_COLLECTION), LISTINO_DOC_ID);
  const listinoSnap = await getDoc(listinoRef);
  const current: ListinoVoce[] = listinoSnap.exists()
    ? Array.isArray(listinoSnap.data()?.voci)
      ? ((listinoSnap.data()?.voci as ListinoVoce[]) || [])
      : []
    : [];

  let next = [...current];
  const now = Date.now();
  const sourceImageStoragePaths = asStringArray(preventivo.imageStoragePaths);
  const sourceImageUrls = asStringArray(preventivo.imageUrls);

  preventivo.righe.forEach((riga, index) => {
    const codiceArticoloDalForm = codiciArticoloPerRiga[index];
    const key = listinoKey({
      fornitoreId: preventivo.fornitoreId,
      articoloCanonico: riga.descrizione,
      unita: riga.unita,
      valuta,
    });

    const idx = next.findIndex((v) => listinoKey({
      fornitoreId: v.fornitoreId,
      articoloCanonico: v.articoloCanonico,
      unita: v.unita,
      valuta: v.valuta,
    }) === key);

    const nextFonteAttuale = {
      preventivoId: preventivo.id,
      numeroPreventivo: preventivo.numeroPreventivo,
      dataPreventivo: preventivo.dataPreventivo,
      note: riga.note || undefined,
      pdfUrl: pdfFieldsForFonte?.pdfUrl ?? null,
      pdfStoragePath: pdfFieldsForFonte?.pdfStoragePath ?? null,
      imageStoragePaths: sourceImageStoragePaths,
      imageUrls: sourceImageUrls,
    };

    if (idx >= 0) {
      const prev = next[idx];
      const trendData = computeTrend(riga.prezzoUnitario, prev.prezzoAttuale);
      next[idx] = {
        ...prev,
        articoloCanonico: normalizeArticoloCanonico(riga.descrizione),
        codiceArticolo: (codiceArticoloDalForm || "").trim() || undefined,
        unita: normalizeUnita(riga.unita),
        valuta,
        note: (riga.note || "").trim() || prev.note || undefined,
        prezzoPrecedente: prev.prezzoAttuale,
        fontePrecedente: {
          preventivoId: prev.fonteAttuale.preventivoId,
          numeroPreventivo: prev.fonteAttuale.numeroPreventivo,
          dataPreventivo: prev.fonteAttuale.dataPreventivo,
          note: String(prev.fonteAttuale.note || "").trim() || String(prev.note || "").trim() || undefined,
          imageStoragePaths: asStringArray(prev.fonteAttuale.imageStoragePaths),
          imageUrls: asStringArray(prev.fonteAttuale.imageUrls),
        },
        prezzoAttuale: riga.prezzoUnitario,
        fonteAttuale: nextFonteAttuale,
        trend: trendData.trend,
        deltaAbs: trendData.deltaAbs,
        deltaPct: trendData.deltaPct,
        updatedAt: now,
      };
      return;
    }

    next.push({
      id: generaId(),
      fornitoreId: preventivo.fornitoreId,
      fornitoreNome: preventivo.fornitoreNome,
      articoloCanonico: normalizeArticoloCanonico(riga.descrizione),
      codiceArticolo: (codiceArticoloDalForm || "").trim() || undefined,
      unita: normalizeUnita(riga.unita),
      valuta,
      note: (riga.note || "").trim() || undefined,
      prezzoAttuale: riga.prezzoUnitario,
      fonteAttuale: {
        preventivoId: preventivo.id,
        numeroPreventivo: preventivo.numeroPreventivo,
        dataPreventivo: preventivo.dataPreventivo,
        note: (riga.note || "").trim() || undefined,
        pdfUrl: pdfFieldsForFonte?.pdfUrl ?? null,
        pdfStoragePath: pdfFieldsForFonte?.pdfStoragePath ?? null,
        imageStoragePaths: sourceImageStoragePaths,
        imageUrls: sourceImageUrls,
      },
      trend: "new",
      updatedAt: now,
    });
  });

  next = next.sort((a, b) => b.updatedAt - a.updatedAt);
  await setDoc(listinoRef, sanitizeUndefinedToNull({ voci: next }), { merge: true });
}

export async function saveAndUpsert(params: SaveAndUpsertParams): Promise<void> {
  const preventivo = await saveNextPreventivoManuale({
    testata: params.testata,
    righe: params.righe.map((riga) => ({
      descrizione: riga.descrizione,
      unita: riga.unita,
      prezzoUnitario: riga.prezzoUnitario,
      note: riga.note,
    })),
    foto: params.foto,
    ricevutoDaWhatsapp: params.ricevutoDaWhatsapp ?? false,
    ricevutoDaEmail: params.ricevutoDaEmail ?? false,
    pdfFile: params.pdfFile ?? null,
    pdfStoragePath: params.pdfStoragePath ?? null,
    pdfUrl: params.pdfUrl ?? null,
    imageStoragePrefix: params.imageStoragePrefix ?? null,
  });

  try {
    const codiciArticolo = params.righe.map((riga) => riga.codiceArticolo);
    if (params.fonteAttualeUsesPreventivoPdf === true) {
      await upsertListinoFromPreventivoManuale(
        preventivo,
        params.valuta,
        codiciArticolo,
        {
          pdfStoragePath: preventivo.pdfStoragePath,
          pdfUrl: preventivo.pdfUrl,
        },
      );
    } else {
      await upsertListinoFromPreventivoManuale(
        preventivo,
        params.valuta,
        codiciArticolo,
      );
    }
  } catch (error) {
    console.error("Errore aggiornamento listino da preventivo manuale:", error);
    throw new Error("Preventivo salvato, ma aggiornamento listino non riuscito.");
  }
}
