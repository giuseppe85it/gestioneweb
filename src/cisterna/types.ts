export type Currency = "EUR" | "CHF" | "UNKNOWN";
export type CisternaDocumentoTipo = "fattura" | "bollettino";
export type CisternaValuta = "EUR" | "CHF";

export interface CisternaDocumentoExtractData {
  tipoDocumento: CisternaDocumentoTipo | null;
  fornitore: string | null;
  destinatario: string | null;
  numeroDocumento: string | null;
  dataDocumento: string | null;
  yearMonth: string | null;
  litriTotali: number | null;
  totaleDocumento: number | null;
  valuta: CisternaValuta | null;
  prodotto: string | null;
  testo: string | null;
  daVerificare: boolean;
  motivoVerifica: string | null;
}

export interface CisternaDocumento {
  id: string;
  tipoDocumento?: string | null;
  dataDocumento?: string | null;
  fornitore?: string | null;
  destinatario?: string | null;
  luogoConsegna?: string | null;
  prodotto?: string | null;
  litriTotali?: number | null;
  litri15C?: number | null;
  litriAmbiente?: number | null;
  valuta?: string | null;
  currency?: string | null;
  totaleDocumento?: number | null;
  numeroDocumento?: string | null;
  yearMonth?: string | null;
  dupGroupKey?: string | null;
  dupChosen?: boolean;
  dupIgnored?: boolean;
  updatedAt?: unknown;
  testo?: string | null;
  fileUrl?: string | null;
  nomeFile?: string | null;
  fonte?: string | null;
  createdAt?: unknown;
  daVerificare?: boolean;
  motivoVerifica?: string | null;
}

export interface CisternaParametroMensile {
  mese: string;
  cambioEurChf: number | null;
  updatedAt?: unknown;
}

export interface RifornimentoAutistaRecord {
  id?: string;
  data?: number | string | null;
  timestamp?: number | string | null;
  targaCamion?: string | null;
  targaMotrice?: string | null;
  mezzoTarga?: string | null;
  litri?: number | string | null;
  tipo?: string | null;
  autistaId?: string | null;
  autistaNome?: string | null;
  nomeAutista?: string | null;
  autista?: string | { nome?: string | null } | null;
  badgeAutista?: string | null;
}

export interface CisternaAutistaEvent {
  id?: string;
  originId?: string;
  targa: string;
  data: string;
  dataOra?: string;
  ora?: string;
  litri: number | null;
  timestamp?: number;
}

export type CisternaSchedaFieldFlags = Record<string, "LOW_CONFIDENCE">;

export interface CisternaSchedaRow {
  rowIndexFromTop: number | null;
  separatorBefore: boolean;
  data: string | null;
  ora: string | null;
  targa: string | null;
  litriErogati: number | null;
  contatore: number | null;
  autistaNome: string | null;
  rawText: string | null;
  fieldFlags?: CisternaSchedaFieldFlags;
}

export interface CisternaSchedaExtractResult {
  mode: "LAST_10_ROWS";
  rows: CisternaSchedaRow[];
  needsReview: boolean;
  summary: {
    rowsExtracted: number;
    rowsWithIssues: number;
  };
}
