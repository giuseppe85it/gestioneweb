// Archivio Storico NEXT — Step 5 (PROMPT 29.9) — ArchivioFeed.
// Orchestratore centrale del modulo: monta toolbar + subtabs +
// feed body con raggruppamento per giorno e card espansa inline.

import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";

import {
  extractTimestamp,
  type ArchivioEventoModalRequest,
  type ArchivioRecord,
  type ArchivioRecordKind,
} from "./archivioTypes";
import { ArchivioDaySeparator } from "./ArchivioDaySeparator";
import { ArchivioEmptyState } from "./ArchivioEmptyState";
import { ArchivioSubTabs, type ArchivioDensity } from "./ArchivioSubTabs";
import { ArchivioToolbar } from "./ArchivioToolbar";
import { useArchivioData } from "./hooks/useArchivioData";
import { useArchivioFilters } from "./hooks/useArchivioFilters";
import { useArchivioSearch } from "./hooks/useArchivioSearch";
import { ArchivioRowExpanded } from "./rows/ArchivioRowExpanded";
import { ArchivioRowLavoro } from "./rows/ArchivioRowLavoro";
import { ArchivioRowManutenzione } from "./rows/ArchivioRowManutenzione";
import { ArchivioRowRichiesta } from "./rows/ArchivioRowRichiesta";
import { ArchivioRowSegnalazione } from "./rows/ArchivioRowSegnalazione";
import "./styles/archivioStorico.css";

const MONTH_LABELS_LONG: ReadonlyArray<string> = [
  "gennaio",
  "febbraio",
  "marzo",
  "aprile",
  "maggio",
  "giugno",
  "luglio",
  "agosto",
  "settembre",
  "ottobre",
  "novembre",
  "dicembre",
];

const WEEKDAY_LABELS_LONG: ReadonlyArray<string> = [
  "domenica",
  "lunedì",
  "martedì",
  "mercoledì",
  "giovedì",
  "venerdì",
  "sabato",
];

const DENSITY_STORAGE_KEY = "archivio.densita";

function loadDensityFromStorage(): ArchivioDensity {
  if (typeof window === "undefined") return "comoda";
  try {
    const raw: string | null = window.localStorage.getItem(DENSITY_STORAGE_KEY);
    if (raw === "compatta") return "compatta";
    return "comoda";
  } catch {
    return "comoda";
  }
}

function persistDensity(value: ArchivioDensity): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DENSITY_STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

type GroupKey = "today" | "yesterday" | "this-week" | "this-month" | "month";

type GroupBucket = {
  key: string;
  label: string;
  sublabel?: string;
  records: ArchivioRecord[];
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function startOfWeekMonday(d: Date): Date {
  const sd: Date = startOfDay(d);
  const day: number = sd.getDay();
  const diff: number = day === 0 ? 6 : day - 1;
  return new Date(sd.getTime() - diff * 24 * 60 * 60 * 1000);
}

function classifyDate(ts: number, now: Date): {
  key: GroupKey;
  groupKey: string;
  label: string;
  sublabel?: string;
} {
  const d: Date = new Date(ts);
  const today: Date = startOfDay(now);
  const yesterday: Date = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  if (isSameDay(d, today)) {
    return {
      key: "today",
      groupKey: "today",
      label: "Oggi",
      sublabel: `${WEEKDAY_LABELS_LONG[d.getDay()]} ${d.getDate()} ${MONTH_LABELS_LONG[d.getMonth()]}`,
    };
  }
  if (isSameDay(d, yesterday)) {
    return {
      key: "yesterday",
      groupKey: "yesterday",
      label: "Ieri",
      sublabel: `${WEEKDAY_LABELS_LONG[d.getDay()]} ${d.getDate()} ${MONTH_LABELS_LONG[d.getMonth()]}`,
    };
  }
  const weekStart: Date = startOfWeekMonday(now);
  if (d.getTime() >= weekStart.getTime() && d.getTime() < today.getTime()) {
    return {
      key: "this-week",
      groupKey: "this-week",
      label: "Questa settimana",
    };
  }
  if (isSameMonth(d, now)) {
    return {
      key: "this-month",
      groupKey: `month-${d.getFullYear()}-${d.getMonth()}`,
      label: MONTH_LABELS_LONG[d.getMonth()],
      sublabel: String(d.getFullYear()),
    };
  }
  return {
    key: "month",
    groupKey: `month-${d.getFullYear()}-${d.getMonth()}`,
    label: MONTH_LABELS_LONG[d.getMonth()],
    sublabel: String(d.getFullYear()),
  };
}

function groupByDay(
  records: ArchivioRecord[],
  now: Date,
): GroupBucket[] {
  const order: string[] = [];
  const map: Map<string, GroupBucket> = new Map<string, GroupBucket>();
  for (const r of records) {
    const ts: number = extractTimestamp(r);
    if (ts === 0) continue;
    const { groupKey, label, sublabel } = classifyDate(ts, now);
    if (!map.has(groupKey)) {
      map.set(groupKey, { key: groupKey, label, sublabel, records: [] });
      order.push(groupKey);
    }
    map.get(groupKey)!.records.push(r);
  }
  return order
    .map((k: string) => map.get(k))
    .filter((g: GroupBucket | undefined): g is GroupBucket => Boolean(g));
}

type Props = {
  onOpenEventoModal?: (req: ArchivioEventoModalRequest) => void;
};

export function ArchivioFeed({ onOpenEventoModal }: Props): ReactElement {
  const dataState = useArchivioData();
  const filtersState = useArchivioFilters();
  const [activeKind, setActiveKind] = useState<ArchivioRecordKind>("lavoro");
  const [density, setDensity] = useState<ArchivioDensity>(loadDensityFromStorage());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set<string>());

  const handleSetDensity = useCallback((d: ArchivioDensity): void => {
    setDensity(d);
    persistDensity(d);
  }, []);

  const handleToggleExpand = useCallback((id: string): void => {
    setExpandedIds((prev: Set<string>) => {
      const next: Set<string> = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleResetFilters = useCallback((): void => {
    filtersState.resetFilters();
  }, [filtersState]);

  // Step 1: applica filtri globali (senza search) per kind.
  const filteredByKind = useMemo(() => {
    return {
      lavoro: filtersState.applyFilters(dataState.records.lavoro, "lavoro"),
      manutenzione: filtersState.applyFilters(
        dataState.records.manutenzione,
        "manutenzione",
      ),
      segnalazione: filtersState.applyFilters(
        dataState.records.segnalazione,
        "segnalazione",
      ),
      richiesta: filtersState.applyFilters(dataState.records.richiesta, "richiesta"),
    };
  }, [dataState.records, filtersState]);

  // Step 2: applica search (modalita' C) — produce records+counts per kind.
  const searchState = useArchivioSearch({
    records: filteredByKind,
    search: filtersState.filters.search,
  });

  const autistaOptions: string[] = useMemo(
    () => filtersState.getAutistaOptions(dataState.records),
    [filtersState, dataState.records],
  );
  const targaOptions: string[] = useMemo(
    () => filtersState.getTargaOptions(dataState.records),
    [filtersState, dataState.records],
  );

  const activeRecords: ArchivioRecord[] = searchState.records[activeKind];
  const sortedActive: ArchivioRecord[] = useMemo(() => {
    return [...activeRecords].sort(
      (a: ArchivioRecord, b: ArchivioRecord) =>
        extractTimestamp(b) - extractTimestamp(a),
    );
  }, [activeRecords]);

  const groups: GroupBucket[] = useMemo(() => {
    return groupByDay(sortedActive, new Date());
  }, [sortedActive]);

  const showManutenzioniBanner: boolean =
    activeKind === "manutenzione" && Boolean(filtersState.filters.autista);

  // Banner click should not steal expand event.
  // (No interactive elements inside row container besides the chevron.)
  useEffect(() => {
    // Quando cambio kind, riduco lo stato espanso allo spazio attivo.
    setExpandedIds(new Set<string>());
  }, [activeKind]);

  if (dataState.loading) {
    return (
      <div className="archivio-loading" role="status">
        Caricamento archivio…
      </div>
    );
  }
  if (dataState.error) {
    return (
      <div className="archivio-error" role="alert">
        Errore caricamento archivio: {dataState.error.message}
        <button
          type="button"
          className="archivio-empty-action"
          onClick={() => void dataState.refetch()}
          style={{ marginLeft: 12 }}
        >
          Riprova
        </button>
      </div>
    );
  }

  return (
    <>
      <ArchivioToolbar
        filters={filtersState.filters}
        defaultPeriodo={filtersState.defaultPeriodo}
        setAutista={filtersState.setAutista}
        setTarga={filtersState.setTarga}
        setPeriodo={filtersState.setPeriodo}
        setSearch={filtersState.setSearch}
        resetFilters={filtersState.resetFilters}
        countActiveFilters={filtersState.countActiveFilters()}
        resultsTotalCount={searchState.totalCount}
        autistaOptions={autistaOptions}
        targaOptions={targaOptions}
      />
      <ArchivioSubTabs
        activeKind={activeKind}
        setActiveKind={setActiveKind}
        counts={searchState.counts}
        density={density}
        setDensity={handleSetDensity}
      />
      <div
        className={`archivio-feed-wrap ${density === "compatta" ? "is-compact" : ""}`}
        data-active-pane={activeKind}
      >
        {showManutenzioniBanner ? (
          <div className="archivio-manut-banner" role="note">
            Filtro Autista ignorato in questa scheda — le manutenzioni non hanno un autista, mostrato l&apos;elenco completo del periodo.
          </div>
        ) : null}
        {sortedActive.length === 0 ? (
          <ArchivioEmptyState onReset={handleResetFilters} />
        ) : (
          groups.map((group: GroupBucket) => (
            <section key={group.key} className="archivio-feed-pane is-active">
              <ArchivioDaySeparator
                label={group.label}
                sublabel={group.sublabel}
                count={group.records.length}
              />
              {group.records.map((record: ArchivioRecord) => {
                const id: string = record.data.id;
                const isExpanded: boolean = expandedIds.has(id);
                const targaRaw: string | null =
                  record.kind === "lavoro"
                    ? (record.data.mezzoTarga ?? record.data.targa ?? null)
                    : (record.data.targa ?? null);
                const targaKey: string | null = targaRaw
                  ? targaRaw.trim().toUpperCase()
                  : null;
                const mezzoMeta = targaKey
                  ? dataState.flotta.get(targaKey) ?? null
                  : null;
                return (
                  <div key={id} className="archivio-row-wrap">
                    {record.kind === "lavoro" ? (
                      <ArchivioRowLavoro
                        record={record}
                        isExpanded={isExpanded}
                        onToggleExpand={() => handleToggleExpand(id)}
                        mezzoMeta={mezzoMeta}
                      />
                    ) : record.kind === "manutenzione" ? (
                      <ArchivioRowManutenzione
                        record={record}
                        isExpanded={isExpanded}
                        onToggleExpand={() => handleToggleExpand(id)}
                        mezzoMeta={mezzoMeta}
                      />
                    ) : record.kind === "segnalazione" ? (
                      <ArchivioRowSegnalazione
                        record={record}
                        isExpanded={isExpanded}
                        onToggleExpand={() => handleToggleExpand(id)}
                        mezzoMeta={mezzoMeta}
                      />
                    ) : (
                      <ArchivioRowRichiesta
                        record={record}
                        isExpanded={isExpanded}
                        onToggleExpand={() => handleToggleExpand(id)}
                        mezzoMeta={mezzoMeta}
                      />
                    )}
                    {isExpanded ? (
                      <ArchivioRowExpanded
                        record={record}
                        onOpenEventoModal={onOpenEventoModal}
                      />
                    ) : null}
                  </div>
                );
              })}
            </section>
          ))
        )}
      </div>
    </>
  );
}
