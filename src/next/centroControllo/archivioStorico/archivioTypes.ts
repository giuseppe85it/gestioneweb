// Archivio Storico NEXT - type discriminated union per le 3 sezioni attive.
// Riferimento SPEC: docs/product/SPEC_ARCHIVIO_STORICO_NEXT.md sezione 5.0.
// R0 anti-allucinazione: riusa SOLO i type proiezione gia' esportati
// dai reader esistenti, niente shape inventate.

import { toNextDateValue } from "../../nextDateFormat";
import type { NextManutenzioniLegacyDatasetRecord } from "../../domain/nextManutenzioniDomain";
import type {
  NextAutistiRichiestaSectionItem,
  NextAutistiSegnalazioneSectionItem,
} from "../../domain/nextAutistiDomain";

export type ArchivioRecord =
  | { kind: "manutenzione"; data: NextManutenzioniLegacyDatasetRecord }
  | { kind: "segnalazione"; data: NextAutistiSegnalazioneSectionItem }
  | { kind: "richiesta"; data: NextAutistiRichiestaSectionItem };

export type ArchivioRecordKind = ArchivioRecord["kind"];

export type ArchivioRecordsByKind = {
  manutenzione: ArchivioRecord[];
  segnalazione: ArchivioRecord[];
  richiesta: ArchivioRecord[];
};

// Metadati mezzo (foto + categoria) calcolati dal Feed via JOIN con
// la mappa flotta in useArchivioData.
export type ArchivioMezzoMeta = {
  fotoUrl: string | null;
  categoria: string | null;
};

// Richiesta di apertura modale eventi dal modulo Archivio Storico verso
// il Centro Controllo parent.
export type ArchivioEventoModalRequest =
  | { tipo: "segnalazione"; segnalazioneId: string; targa: string | null }
  | { tipo: "richiesta_attrezzature"; richiestaId: string; targa: string | null };

export type ArchivioPeriodo = {
  fromTs: number;
  toTs: number;
};

export type ArchivioFilters = {
  autista: string | null;
  targa: string | null;
  periodo: ArchivioPeriodo;
  search: string;
};

// Estrae il timestamp di apertura del record archivio in ms epoch.
// Ritorna 0 quando il timestamp non e' ricostruibile.
export function extractTimestamp(record: ArchivioRecord): number {
  switch (record.kind) {
    case "manutenzione": {
      const parsed: Date | null = toNextDateValue(record.data.data);
      return parsed ? parsed.getTime() : 0;
    }
    case "segnalazione": {
      return record.data.timestamp ?? 0;
    }
    case "richiesta": {
      return record.data.timestamp ?? 0;
    }
  }
}
