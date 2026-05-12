// Archivio Storico NEXT — Step 2 (PROMPT 29.7) — useArchivioSearch.
// Modalita' C ibrida (SPEC §7): la sub-tab attiva e tutte le altre
// vengono filtrate per query testuale sui rispettivi campi indicizzati;
// il componente UI legge i 4 `counts` per popolare i badge della
// sub-tabbar. Funzione pura, nessun debounce qui (gestito dal
// componente ArchivioToolbar in Step 5).
//
// Campi indicizzati per kind (SPEC §7.2):
//   lavoro       : descrizione, dettagli, mezzoTarga, segnalatoDa, chiHaEseguito
//   manutenzione : descrizione, targa, fornitore, eseguito
//   segnalazione : descrizione, targa, autistaNome, tipo
//   richiesta    : testo, targa, autistaNome

import { useMemo } from "react";

import type {
  ArchivioRecord,
  ArchivioRecordsByKind,
} from "../archivioTypes";

export type UseArchivioSearchInput = {
  records: ArchivioRecordsByKind;
  search: string;
};

export type ArchivioCountsByKind = {
  lavoro: number;
  manutenzione: number;
  segnalazione: number;
  richiesta: number;
};

export type UseArchivioSearchState = {
  records: ArchivioRecordsByKind;
  counts: ArchivioCountsByKind;
  totalCount: number;
};

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

function tokenize(query: string): string[] {
  return query.split(/\s+/).filter((t: string) => t.length > 0);
}

function fieldIncludes(
  field: string | null | undefined,
  token: string,
): boolean {
  if (!field) return false;
  return field.toLowerCase().includes(token);
}

function getSearchableFields(record: ArchivioRecord): Array<string | null | undefined> {
  switch (record.kind) {
    case "lavoro": {
      return [
        record.data.descrizione,
        record.data.dettagli,
        record.data.mezzoTarga,
        record.data.targa,
        record.data.segnalatoDa,
        record.data.chiHaEseguito,
      ];
    }
    case "manutenzione": {
      return [
        record.data.descrizione,
        record.data.targa,
        record.data.fornitore ?? null,
        record.data.eseguito,
      ];
    }
    case "segnalazione": {
      return [
        record.data.descrizione,
        record.data.targa,
        record.data.autistaNome,
        record.data.tipo,
      ];
    }
    case "richiesta": {
      return [
        record.data.testo,
        record.data.targa,
        record.data.autistaNome,
      ];
    }
  }
}

function matchRecord(record: ArchivioRecord, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const fields: Array<string | null | undefined> = getSearchableFields(record);
  // AND su token, OR su campi: ogni token deve matchare almeno un campo.
  for (const token of tokens) {
    let matched: boolean = false;
    for (const field of fields) {
      if (fieldIncludes(field, token)) {
        matched = true;
        break;
      }
    }
    if (!matched) return false;
  }
  return true;
}

function filterByQuery(
  records: ArchivioRecord[],
  tokens: string[],
): ArchivioRecord[] {
  if (tokens.length === 0) return records;
  return records.filter((r: ArchivioRecord) => matchRecord(r, tokens));
}

export const useArchivioSearch = (
  params: UseArchivioSearchInput,
): UseArchivioSearchState => {
  const { records, search } = params;
  const state: UseArchivioSearchState = useMemo(() => {
    const normalized: string = normalizeQuery(search);
    const tokens: string[] = tokenize(normalized);

    const lavoro: ArchivioRecord[] = filterByQuery(records.lavoro, tokens);
    const manutenzione: ArchivioRecord[] = filterByQuery(
      records.manutenzione,
      tokens,
    );
    const segnalazione: ArchivioRecord[] = filterByQuery(
      records.segnalazione,
      tokens,
    );
    const richiesta: ArchivioRecord[] = filterByQuery(
      records.richiesta,
      tokens,
    );

    const counts: ArchivioCountsByKind = {
      lavoro: lavoro.length,
      manutenzione: manutenzione.length,
      segnalazione: segnalazione.length,
      richiesta: richiesta.length,
    };

    const totalCount: number =
      counts.lavoro + counts.manutenzione + counts.segnalazione + counts.richiesta;

    return {
      records: { lavoro, manutenzione, segnalazione, richiesta },
      counts,
      totalCount,
    };
  }, [records, search]);

  return state;
};
