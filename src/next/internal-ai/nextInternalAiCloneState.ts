import type { NextDocumentiCostiCurrency } from "../domain/nextDocumentiCostiDomain";

const NEXT_INTERNAL_AI_DOCUMENTI_KEY = "@next_clone:internal-ai:documenti";

export type NextInternalAiCloneDocumentoRow = {
  id: string;
  descrizione: string;
  quantita: number | null;
  unita: string | null;
  prezzoUnitario: number | null;
  importo: number | null;
};

export type NextInternalAiCloneDocumentoRecord = {
  id: string;
  collectionKey: "@documenti_mezzi" | "@documenti_magazzino" | "@documenti_generici";
  tipoDocumento: string;
  categoriaArchivio: "MEZZO" | "MAGAZZINO" | "GENERICO";
  targa: string | null;
  mezzoTarga: string | null;
  fornitore: string;
  numeroDocumento: string;
  dataDocumento: string;
  totaleDocumento: number | null;
  valuta: NextDocumentiCostiCurrency;
  testo: string;
  fileUrl: string | null;
  righe: NextInternalAiCloneDocumentoRow[];
  createdAt: number;
  updatedAt: number;
  source: "next-clone-ia";
  needsReview: boolean;
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function parseCloneArray<T>(raw: string | null): T[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readNextInternalAiCloneDocumenti(): NextInternalAiCloneDocumentoRecord[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  return parseCloneArray<NextInternalAiCloneDocumentoRecord>(
    window.localStorage.getItem(NEXT_INTERNAL_AI_DOCUMENTI_KEY),
  ).filter((entry) => Boolean(entry?.id));
}

export function upsertNextInternalAiCloneDocumento(
  record: NextInternalAiCloneDocumentoRecord,
) {
  if (!canUseLocalStorage()) {
    return;
  }

  const current = readNextInternalAiCloneDocumenti().filter(
    (entry) => entry.id !== record.id,
  );
  window.localStorage.setItem(
    NEXT_INTERNAL_AI_DOCUMENTI_KEY,
    JSON.stringify([record, ...current]),
  );
}
