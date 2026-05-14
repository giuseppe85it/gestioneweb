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
import { isSatelliteChiusoDaEvento } from "../../../helpers/storiaRecord";
import type {
  ArchivioUrlPeriodPreset,
  ArchivioUrlState,
} from "./useArchivioUrlState";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_PERIOD_DAYS = 30;

const PERIOD_PRESET_DAYS: Record<
  Exclude<ArchivioUrlPeriodPreset, "custom" | "all">,
  number
> = {
  "7g": 7,
  "30g": 30,
  "90g": 90,
  "12m": 365,
};

function periodFromUrl(
  state: ArchivioUrlState,
  defaultPeriodo: ArchivioPeriodo,
): ArchivioPeriodo {
  if (state.period === "all") {
    return { fromTs: 0, toTs: Date.now() };
  }
  if (state.period === "custom") {
    if (state.periodFrom !== null && state.periodTo !== null) {
      return { fromTs: state.periodFrom, toTs: state.periodTo };
    }
    return defaultPeriodo;
  }
  const days: number = PERIOD_PRESET_DAYS[state.period];
  const now: number = Date.now();
  return { fromTs: now - days * DAY_MS, toTs: now };
}

function periodToUrl(
  periodo: ArchivioPeriodo,
  defaultPeriodo: ArchivioPeriodo,
): Pick<ArchivioUrlState, "period" | "periodFrom" | "periodTo"> {
  if (periodo.fromTs === 0) {
    return { period: "all", periodFrom: null, periodTo: null };
  }
  if (
    periodo.fromTs === defaultPeriodo.fromTs &&
    periodo.toTs === defaultPeriodo.toTs
  ) {
    return { period: "30g", periodFrom: null, periodTo: null };
  }
  return {
    period: "custom",
    periodFrom: periodo.fromTs,
    periodTo: periodo.toTs,
  };
}

export type UseArchivioFiltersState = {
  filters: ArchivioFilters;
  defaultPeriodo: ArchivioPeriodo;
  statoManutenzione: ArchivioManutenzioneStatoFilter;
  setAutista: (value: string | null) => void;
  setTarga: (value: string | null) => void;
  setPeriodo: (periodo: ArchivioPeriodo) => void;
  setSearch: (value: string) => void;
  setStatoManutenzione: (value: ArchivioManutenzioneStatoFilter) => void;
  applyFilters: (
    records: ArchivioRecord[],
    kind: ArchivioRecordKind,
  ) => ArchivioRecord[];
  countActiveFilters: () => number;
  resetFilters: () => void;
  getAutistaOptions: (allRecords: ArchivioRecordsByKind) => string[];
  getTargaOptions: (allRecords: ArchivioRecordsByKind) => string[];
};

export type ArchivioManutenzioneStatoFilter =
  | "tutti"
  | "daFare"
  | "programmata"
  | "eseguita"
  | "chiusa_da_evento";

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

export type UseArchivioFiltersOptions = {
  urlState?: ArchivioUrlState;
  onChange?: (partial: Partial<ArchivioUrlState>) => void;
};

export const useArchivioFilters = (
  options?: UseArchivioFiltersOptions,
): UseArchivioFiltersState => {
  const defaultPeriodo: ArchivioPeriodo = useMemo(() => buildDefaultPeriodo(), []);
  const urlState: ArchivioUrlState | undefined = options?.urlState;
  const onChange = options?.onChange;

  // Inizializza da URL state se presente, altrimenti default React state.
  const [autista, setAutistaState] = useState<string | null>(
    urlState?.autista ?? null,
  );
  const [targa, setTargaState] = useState<string | null>(urlState?.targa ?? null);
  const [periodo, setPeriodoState] = useState<ArchivioPeriodo>(
    urlState ? periodFromUrl(urlState, defaultPeriodo) : defaultPeriodo,
  );
  const [search, setSearchState] = useState<string>(urlState?.q ?? "");
  const [statoManutenzione, setStatoManutenzioneState] =
    useState<ArchivioManutenzioneStatoFilter>("tutti");

  const filters: ArchivioFilters = useMemo(
    () => ({ autista, targa, periodo, search }),
    [autista, targa, periodo, search],
  );

  const setAutista = useCallback(
    (value: string | null): void => {
      const next: string | null = value && value.trim() ? value.trim() : null;
      setAutistaState(next);
      if (onChange) onChange({ autista: next });
    },
    [onChange],
  );

  const setTarga = useCallback(
    (value: string | null): void => {
      const next: string | null =
        value && value.trim() ? value.trim().toUpperCase() : null;
      setTargaState(next);
      if (onChange) onChange({ targa: next });
    },
    [onChange],
  );

  const setPeriodo = useCallback(
    (next: ArchivioPeriodo): void => {
      setPeriodoState(next);
      if (onChange) onChange(periodToUrl(next, defaultPeriodo));
    },
    [onChange, defaultPeriodo],
  );

  const setSearch = useCallback(
    (value: string): void => {
      setSearchState(value);
      if (onChange) onChange({ q: value });
    },
    [onChange],
  );

  const setStatoManutenzione = useCallback(
    (value: ArchivioManutenzioneStatoFilter): void => {
      setStatoManutenzioneState(value);
    },
    [],
  );

  const resetFilters = useCallback((): void => {
    setAutistaState(null);
    setTargaState(null);
    setPeriodoState(defaultPeriodo);
    setSearchState("");
    setStatoManutenzioneState("tutti");
    if (onChange) {
      onChange({
        autista: null,
        targa: null,
        period: "30g",
        periodFrom: null,
        periodTo: null,
        q: "",
      });
    }
  }, [defaultPeriodo, onChange]);

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

        if (kind === "manutenzione" && record.kind === "manutenzione") {
          const stato = record.data.stato ?? "eseguita";
          if (
            statoManutenzione === "tutti" &&
            isSatelliteChiusoDaEvento(record.data as unknown as Record<string, unknown>)
          ) {
            return false;
          }
          if (statoManutenzione === "tutti") return true;
          if (stato !== statoManutenzione) return false;
        }

        return true;
      });
    },
    [autista, targa, periodo, statoManutenzione],
  );

  const countActiveFilters = useCallback((): number => {
    let count: number = 0;
    if (autista) count += 1;
    if (targa) count += 1;
    if (search.trim()) count += 1;
    if (statoManutenzione !== "tutti") count += 1;
    if (!isPeriodoDefault(periodo, defaultPeriodo)) count += 1;
    return count;
  }, [autista, targa, search, statoManutenzione, periodo, defaultPeriodo]);

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
      statoManutenzione,
      setAutista,
      setTarga,
      setPeriodo,
      setSearch,
      setStatoManutenzione,
      applyFilters,
      countActiveFilters,
      resetFilters,
      getAutistaOptions,
      getTargaOptions,
    }),
    [
      filters,
      defaultPeriodo,
      statoManutenzione,
      setAutista,
      setTarga,
      setPeriodo,
      setSearch,
      setStatoManutenzione,
      applyFilters,
      countActiveFilters,
      resetFilters,
      getAutistaOptions,
      getTargaOptions,
    ],
  );

  return state;
};
