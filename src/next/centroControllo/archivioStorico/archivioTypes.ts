// Archivio Storico NEXT — type discriminated union per le 4 collezioni.
// Riferimento SPEC: docs/product/SPEC_ARCHIVIO_STORICO_NEXT.md §5.0.
// R0 anti-allucinazione: riusa SOLO i type proiezione gia' esportati
// dai reader esistenti, niente shape inventate.

import { toNextDateValue } from "../../nextDateFormat";
import type { NextLavoriListaRow } from "../../domain/nextLavoriDomain";
import type { NextManutenzioniLegacyDatasetRecord } from "../../domain/nextManutenzioniDomain";
import type {
  NextAutistiRichiestaSectionItem,
  NextAutistiSegnalazioneSectionItem,
} from "../../domain/nextAutistiDomain";

// Nota Step 2 (PROMPT 29.7): per i Lavori si usa `NextLavoriListaRow`
// (proiezione snella esposta da `readNextLavoriArchivioSnapshot` via
// `NextLavoriListaSnapshot.groups[].items`). Lo SPEC §5.0 raccomandava
// `NextLavoroReadOnlyItem` per via di `source.*` (timeline "Generato
// da segnalazione" sui Lavori), ma il reader Step 1 non lo espone:
// quel branch della timeline e' gestito inversamente via
// `linkedLavoroId` sulle Segnalazioni (campo gia' presente). Upgrade
// futuro: estendere il reader per esporre `NextLavoroReadOnlyItem[]`
// quando servira' anche la freccia lavoro -> segnalazione.
export type ArchivioRecord =
  | { kind: "lavoro"; data: NextLavoriListaRow }
  | { kind: "manutenzione"; data: NextManutenzioniLegacyDatasetRecord }
  | { kind: "segnalazione"; data: NextAutistiSegnalazioneSectionItem }
  | { kind: "richiesta"; data: NextAutistiRichiestaSectionItem };

export type ArchivioRecordKind = ArchivioRecord["kind"];

// Mappa kind -> array di record. Usata da useArchivioData (Step 2),
// useArchivioFilters e useArchivioSearch.
export type ArchivioRecordsByKind = {
  lavoro: ArchivioRecord[];
  manutenzione: ArchivioRecord[];
  segnalazione: ArchivioRecord[];
  richiesta: ArchivioRecord[];
};

// Metadati mezzo (foto + categoria) calcolati dal Feed via JOIN con
// la mappa flotta in `useArchivioData`. PROMPT 30.1: usato dalle 4
// righe per renderizzare la foto reale via `ArchivioVeicoloPhoto`.
export type ArchivioMezzoMeta = {
  fotoUrl: string | null;
  categoria: string | null;
};

// Richiesta di apertura modale eventi (Segnalazione/Richiesta) dal
// modulo Archivio Storico verso il CC parent. PROMPT 30.2: la
// callback `onOpenEventoModal` riceve questo tipo e ricostruisce
// internamente l'HomeEvent + apre il modale con `editable=false`.
export type ArchivioEventoModalRequest =
  | { tipo: "segnalazione"; segnalazioneId: string; targa: string | null }
  | { tipo: "richiesta_attrezzature"; richiestaId: string; targa: string | null };

// Stato dei filtri globali (SPEC §6).
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
// - lavoro: `timestampInserimento` esposto dal reader.
// - manutenzione: il campo `data` e' una string legacy parsata con
//   `toNextDateValue` (lo stesso helper usato internamente dal reader
//   manutenzioni a riga 323 di nextManutenzioniDomain.ts).
// - segnalazione/richiesta: `timestamp` ms.
// Ritorna 0 quando il timestamp non e' ricostruibile (sort-safe, no NaN).
export function extractTimestamp(record: ArchivioRecord): number {
  switch (record.kind) {
    case "lavoro": {
      return record.data.timestampInserimento ?? 0;
    }
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
