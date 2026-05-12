// Archivio Storico NEXT — Step 2 (PROMPT 29.7) — useArchivioFilters.
// Stato globale dei filtri (autista, targa, periodo, search), funzione
// pura `applyFilters` per kind-discriminato, helper opzioni autista/targa,
// conteggio filtri attivi, reset. Sola lettura, niente side effect su
// Firestore.
//
// Riferimento SPEC:
//   §6   filtri globali
//   §6.1.bis  filtro Autista su Manutenzioni (D5+D5-bis: IGNORATO,
//             funzione applyFilters ritorna i record manutenzione
//             invariati quando filtro autista e' attivo; banner UI
//             gestito dal componente di Step 5).

import { useCallback, useMemo, useState } from "react";

import {
  extractTimestamp,
  type ArchivioFilters,
  type ArchivioPeriodo,
  type ArchivioRecord,
  type ArchivioRecordKind,
  type ArchivioRecordsByKind,
} from "../archivioTypes";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_PERIOD_DAYS = 30;

export type UseArchivioFiltersState = {
  filters: ArchivioFilters;
  defaultPeriodo: ArchivioPeriodo;
  setAutista: (value: string | null) => void;
  setTarga: (value: string | null) => void;
  setPeriodo: (periodo: ArchivioPeriodo) => void;
  setSearch: (value: string) => void;
  applyFilters: (
    records: ArchivioRecord[],
    kind: ArchivioRecordKind,
  ) => ArchivioRecord[];
  countActiveFilters: () => number;
  resetFilters: () => void;
  getAutistaOptions: (allRecords: ArchivioRecordsByKind) => string[];
  getTargaOptions: (allRecords: ArchivioRecordsByKind) => string[];
};

function buildDefaultPeriodo(): ArchivioPeriodo {
  const now: number = Date.now();
  return {
    fromTs: now - DEFAULT_PERIOD_DAYS * DAY_MS,
    toTs: now,
  };
}

function normalizeText(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function containsCaseInsensitive(
  field: string | null | undefined,
  query: string,
): boolean {
  if (!query) return true;
  const normalizedField: string = normalizeText(field);
  if (!normalizedField) return false;
  return normalizedField.includes(query);
}

function extractTargaForKind(record: ArchivioRecord): string | null {
  switch (record.kind) {
    case "lavoro": {
      return record.data.mezzoTarga ?? record.data.targa ?? null;
    }
    case "manutenzione": {
      return record.data.targa ?? null;
    }
    case "segnalazione": {
      return record.data.targa ?? null;
    }
    case "richiesta": {
      return record.data.targa ?? null;
    }
  }
}

function extractAutistiForKind(record: ArchivioRecord): string[] {
  switch (record.kind) {
    case "lavoro": {
      const list: string[] = [];
      const segnalatoDa: string | null = record.data.segnalatoDa ?? null;
      const chiHaEseguito: string | null = record.data.chiHaEseguito ?? null;
      if (segnalatoDa) list.push(segnalatoDa);
      if (chiHaEseguito) list.push(chiHaEseguito);
      return list;
    }
    case "manutenzione": {
      // D5: il filtro Autista non si applica alle manutenzioni.
      // L'helper getAutistaOptions esclude le manutenzioni; qui
      // ritorna lista vuota cosi' anche un eventuale chiamante
      // diretto non trova match accidentali.
      return [];
    }
    case "segnalazione": {
      return record.data.autistaNome ? [record.data.autistaNome] : [];
    }
    case "richiesta": {
      return record.data.autistaNome ? [record.data.autistaNome] : [];
    }
  }
}

function isPeriodoDefault(
  current: ArchivioPeriodo,
  reference: ArchivioPeriodo,
): boolean {
  return (
    current.fromTs === reference.fromTs && current.toTs === reference.toTs
  );
}

export const useArchivioFilters = (): UseArchivioFiltersState => {
  const defaultPeriodo: ArchivioPeriodo = useMemo(buildDefaultPeriodo, []);

  const [autista, setAutistaState] = useState<string | null>(null);
  const [targa, setTargaState] = useState<string | null>(null);
  const [periodo, setPeriodoState] = useState<ArchivioPeriodo>(defaultPeriodo);
  const [search, setSearchState] = useState<string>("");

  const filters: ArchivioFilters = useMemo(
    () => ({ autista, targa, periodo, search }),
    [autista, targa, periodo, search],
  );

  const setAutista = useCallback((value: string | null): void => {
    setAutistaState(value && value.trim() ? value.trim() : null);
  }, []);

  const setTarga = useCallback((value: string | null): void => {
    setTargaState(
      value && value.trim() ? value.trim().toUpperCase() : null,
    );
  }, []);

  const setPeriodo = useCallback((next: ArchivioPeriodo): void => {
    setPeriodoState(next);
  }, []);

  const setSearch = useCallback((value: string): void => {
    setSearchState(value);
  }, []);

  const resetFilters = useCallback((): void => {
    setAutistaState(null);
    setTargaState(null);
    setPeriodoState(defaultPeriodo);
    setSearchState("");
  }, [defaultPeriodo]);

  const applyFilters = useCallback(
    (records: ArchivioRecord[], kind: ArchivioRecordKind): ArchivioRecord[] => {
      const normalizedAutista: string = normalizeText(autista);
      const normalizedTarga: string = normalizeText(targa);
      const fromTs: number = periodo.fromTs;
      const toTs: number = periodo.toTs;
      const ignoreAutistaForKind: boolean = kind === "manutenzione";

      return records.filter((record: ArchivioRecord) => {
        const ts: number = extractTimestamp(record);
        if (ts !== 0) {
          if (ts < fromTs) return false;
          if (ts > toTs) return false;
        }

        if (normalizedTarga) {
          const recordTarga: string = normalizeText(extractTargaForKind(record));
          if (!recordTarga.includes(normalizedTarga)) return false;
        }

        if (normalizedAutista && !ignoreAutistaForKind) {
          const autisti: string[] = extractAutistiForKind(record);
          if (autisti.length === 0) return false;
          const matched: boolean = autisti.some((name: string) =>
            containsCaseInsensitive(name, normalizedAutista),
          );
          if (!matched) return false;
        }

        return true;
      });
    },
    [autista, targa, periodo],
  );

  const countActiveFilters = useCallback((): number => {
    let count: number = 0;
    if (autista) count += 1;
    if (targa) count += 1;
    if (search.trim()) count += 1;
    if (!isPeriodoDefault(periodo, defaultPeriodo)) count += 1;
    return count;
  }, [autista, targa, search, periodo, defaultPeriodo]);

  const getAutistaOptions = useCallback(
    (allRecords: ArchivioRecordsByKind): string[] => {
      const set: Set<string> = new Set<string>();
      const collect = (records: ArchivioRecord[]): void => {
        for (const r of records) {
          if (r.kind === "manutenzione") continue;
          for (const name of extractAutistiForKind(r)) {
            const trimmed: string = name.trim();
            if (trimmed) set.add(trimmed);
          }
        }
      };
      collect(allRecords.lavoro);
      collect(allRecords.segnalazione);
      collect(allRecords.richiesta);
      return Array.from(set).sort((a, b) =>
        a.localeCompare(b, "it", { sensitivity: "base" }),
      );
    },
    [],
  );

  const getTargaOptions = useCallback(
    (allRecords: ArchivioRecordsByKind): string[] => {
      const set: Set<string> = new Set<string>();
      const collect = (records: ArchivioRecord[]): void => {
        for (const r of records) {
          const t: string = String(extractTargaForKind(r) ?? "").trim().toUpperCase();
          if (t) set.add(t);
        }
      };
      collect(allRecords.lavoro);
      collect(allRecords.manutenzione);
      collect(allRecords.segnalazione);
      collect(allRecords.richiesta);
      return Array.from(set).sort();
    },
    [],
  );

  const state: UseArchivioFiltersState = useMemo(
    () => ({
      filters,
      defaultPeriodo,
      setAutista,
      setTarga,
      setPeriodo,
      setSearch,
      applyFilters,
      countActiveFilters,
      resetFilters,
      getAutistaOptions,
      getTargaOptions,
    }),
    [
      filters,
      defaultPeriodo,
      setAutista,
      setTarga,
      setPeriodo,
      setSearch,
      applyFilters,
      countActiveFilters,
      resetFilters,
      getAutistaOptions,
      getTargaOptions,
    ],
  );

  return state;
};
