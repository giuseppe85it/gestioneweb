// Archivio Storico NEXT â€” Step 5 (PROMPT 29.9) â€” ArchivioFeed.
// Orchestratore centrale del modulo: monta toolbar + subtabs +
// feed body con raggruppamento per giorno e card espansa inline.

import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";

import type {
  ArchivioStoricoPdfInput,
  ArchivioStoricoPdfKind,
  ArchivioStoricoPdfRow,
} from "../../../utils/pdfEngine";
import type { NextManutenzioneStato } from "../../domain/nextManutenzioniDomain";

import {
  extractTimestamp,
  type ArchivioEventoModalRequest,
  type ArchivioRecord,
  type ArchivioRecordKind,
} from "./archivioTypes";
import { ArchivioConfirmDelete } from "./ArchivioConfirmDelete";
import { ArchivioDaySeparator } from "./ArchivioDaySeparator";
import { ArchivioEmptyState } from "./ArchivioEmptyState";
import { ArchivioSubTabs, type ArchivioDensity } from "./ArchivioSubTabs";
import { ArchivioToolbar } from "./ArchivioToolbar";
import { useArchivioData } from "./hooks/useArchivioData";
import { useArchivioFilters } from "./hooks/useArchivioFilters";
import { useArchivioHide } from "./hooks/useArchivioHide";
import { useArchivioSearch } from "./hooks/useArchivioSearch";
import { useArchivioUrlState } from "./hooks/useArchivioUrlState";
import { ArchivioRowExpanded } from "./rows/ArchivioRowExpanded";
import { ArchivioRowManutenzione } from "./rows/ArchivioRowManutenzione";
import { ArchivioRowRichiesta } from "./rows/ArchivioRowRichiesta";
import { ArchivioRowSegnalazione } from "./rows/ArchivioRowSegnalazione";
import { toDisplay, toDisplayDateTime } from "../../helpers/dateUnica";
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
      sublabel: toDisplay(d) || "-",
    };
  }
  if (isSameDay(d, yesterday)) {
    return {
      key: "yesterday",
      groupKey: "yesterday",
      label: "Ieri",
      sublabel: toDisplay(d) || "-",
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
  onRequestPdfPreview?: (input: ArchivioStoricoPdfInput) => void;
  generatingPdf?: boolean;
};

const KIND_LABEL: Record<ArchivioRecordKind, string> = {
  manutenzione: "Manutenzioni",
  segnalazione: "Segnalazioni",
  richiesta: "Richieste",
};

function formatManutenzioneStatoLabel(
  stato: NextManutenzioneStato | null | undefined,
): string {
  if (stato === "daFare") return "Da fare";
  if (stato === "programmata") return "Programmata";
  if (stato === "chiusa_da_evento") return "Chiusa da evento";
  if (stato === "eseguita") return "Eseguita";
  // PROMPT 44 — D6: legacy senza stato → "Storico" (solo display).
  return "Storico";
}

function fmtPdfDate(ts: number | null): { data: string; ora: string } {
  if (ts === null || !Number.isFinite(ts) || ts === 0) {
    return { data: "", ora: "" };
  }
  const label = toDisplayDateTime(ts);
  if (!label) return { data: "", ora: "" };
  const [data = "", ora = ""] = label.split(" ");
  return { data, ora };
}

function mapManutenzioneToPdfRow(record: ArchivioRecord): ArchivioStoricoPdfRow {
  if (record.kind !== "manutenzione") {
    return {
      data: "",
      ora: "",
      targa: "",
      titolo: "",
      autoreAperto: null,
      autoreChiuso: null,
      statoLabel: "",
      urgenzaLabel: null,
      noteExtra: null,
    };
  }
  const ts: number = extractTimestamp(record);
  const dt = fmtPdfDate(ts > 0 ? ts : null);
  const data = record.data;
  return {
    data: dt.data,
    ora: dt.ora,
    targa: (data.targa ?? "").toUpperCase(),
    titolo: data.descrizione || "",
    autoreAperto: null,
    autoreChiuso: data.fornitore ?? null,
    statoLabel: formatManutenzioneStatoLabel(data.stato),
    urgenzaLabel:
      data.tipo === "compressore"
        ? "Compressore"
        : data.tipo === "attrezzature"
          ? "Attrezzature"
          : "Mezzo",
    noteExtra: data.fornitore ?? null,
  };
}

function mapSegnalazioneToPdfRow(record: ArchivioRecord): ArchivioStoricoPdfRow {
  if (record.kind !== "segnalazione") {
    return {
      data: "",
      ora: "",
      targa: "",
      titolo: "",
      autoreAperto: null,
      autoreChiuso: null,
      statoLabel: "",
      urgenzaLabel: null,
      noteExtra: null,
    };
  }
  const data = record.data;
  const dt = fmtPdfDate(data.timestamp);
  const stato: string = data.chiusa
    ? "Chiusa"
    : data.hasLinkedLavoro
      ? "Manutenzione generata"
      : "Aperta";
  return {
    data: dt.data,
    ora: dt.ora,
    targa: (data.targa ?? "").toUpperCase(),
    titolo: data.descrizione || "",
    autoreAperto: data.autistaNome,
    autoreChiuso: data.chiusaBy,
    statoLabel: stato,
    urgenzaLabel: data.tipo || null,
    noteExtra: null,
  };
}

function mapRichiestaToPdfRow(record: ArchivioRecord): ArchivioStoricoPdfRow {
  if (record.kind !== "richiesta") {
    return {
      data: "",
      ora: "",
      targa: "",
      titolo: "",
      autoreAperto: null,
      autoreChiuso: null,
      statoLabel: "",
      urgenzaLabel: null,
      noteExtra: null,
    };
  }
  const data = record.data;
  const dt = fmtPdfDate(data.timestamp);
  const stato: string = data.evasa ? "Evasa" : "Aperta";
  return {
    data: dt.data,
    ora: dt.ora,
    targa: (data.targa ?? "").toUpperCase(),
    titolo: data.testo || "",
    autoreAperto: data.autistaNome,
    autoreChiuso: data.evasaBy,
    statoLabel: stato,
    urgenzaLabel: null,
    noteExtra: null,
  };
}

function mapRecordsToPdfRows(
  records: ArchivioRecord[],
  kind: ArchivioRecordKind,
): ArchivioStoricoPdfRow[] {
  switch (kind) {
    case "manutenzione":
      return records.map(mapManutenzioneToPdfRow);
    case "segnalazione":
      return records.map(mapSegnalazioneToPdfRow);
    case "richiesta":
      return records.map(mapRichiestaToPdfRow);
  }
}

function formatPeriodoLabel(fromTs: number, toTs: number): string {
  const fmt = (ts: number): string => toDisplay(ts) || "â€”";
  if (fromTs === 0) {
    return `Tutto lo storico (fino al ${fmt(toTs)})`;
  }
  return `${fmt(fromTs)} â†’ ${fmt(toTs)}`;
}

export function ArchivioFeed({
  onOpenEventoModal,
  onRequestPdfPreview,
  generatingPdf,
}: Props): ReactElement {
  const dataState = useArchivioData();
  const hideState = useArchivioHide({ refetch: dataState.refetch });
  const urlState = useArchivioUrlState();
  const filtersState = useArchivioFilters({
    urlState: urlState.state,
    onChange: urlState.update,
  });
  const activeKind: ArchivioRecordKind = urlState.state.subTab;
  const setActiveKind = useCallback(
    (k: ArchivioRecordKind): void => {
      urlState.update({ subTab: k });
    },
    [urlState],
  );
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

  // PROMPT 31.1: handler hide per riga. Estrae titolo readable per il
  // testo della conferma. Soft-hide: scrive `nascostoInArchivio: true`
  // sul record via writer NEXT (vedi nextArchivioHideWriter.ts).
  const handleRequestElimina = useCallback(
    (record: ArchivioRecord): void => {
      const kindLabel: string = KIND_LABEL[record.kind];
      const recordTitle: string | null =
        record.kind === "richiesta"
          ? record.data.testo
          : record.data.descrizione;
      hideState.openConfirm({
        kind: record.kind,
        recordId: record.data.id,
        kindLabel,
        recordTitle,
      });
    },
    [hideState],
  );

  // Step 1: applica filtri globali (senza search) per kind.
  const filteredByKind = useMemo(() => {
    return {
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

  // Step 2: applica search (modalita' C) â€” produce records+counts per kind.
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

  const handleRequestPdf = useCallback((): void => {
    if (!onRequestPdfPreview) return;
    const kindPdf: ArchivioStoricoPdfKind = activeKind;
    const rows: ArchivioStoricoPdfRow[] = mapRecordsToPdfRows(
      sortedActive,
      activeKind,
    );
    const input: ArchivioStoricoPdfInput = {
      kind: kindPdf,
      kindLabel: KIND_LABEL[activeKind],
      filters: {
        autista: filtersState.filters.autista,
        targa: filtersState.filters.targa,
        periodoLabel: formatPeriodoLabel(
          filtersState.filters.periodo.fromTs,
          filtersState.filters.periodo.toTs,
        ),
        searchQuery: filtersState.filters.search,
      },
      records: rows,
      totalCount: sortedActive.length,
      generatedAtTs: Date.now(),
    };
    onRequestPdfPreview(input);
  }, [
    onRequestPdfPreview,
    activeKind,
    sortedActive,
    filtersState.filters.autista,
    filtersState.filters.targa,
    filtersState.filters.periodo.fromTs,
    filtersState.filters.periodo.toTs,
    filtersState.filters.search,
  ]);

  // Banner click should not steal expand event.
  // (No interactive elements inside row container besides the chevron.)
  useEffect(() => {
    // Quando cambio kind, riduco lo stato espanso allo spazio attivo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedIds(new Set<string>());
  }, [activeKind]);

  if (dataState.loading) {
    return (
      <div className="archivio-loading" role="status">
        Caricamento archivioâ€¦
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
        setStatoManutenzione={filtersState.setStatoManutenzione}
        resetFilters={filtersState.resetFilters}
        countActiveFilters={filtersState.countActiveFilters()}
        resultsTotalCount={searchState.totalCount}
        autistaOptions={autistaOptions}
        targaOptions={targaOptions}
        onRequestPdfPreview={onRequestPdfPreview ? handleRequestPdf : undefined}
        generatingPdf={generatingPdf ?? false}
        activeKindResultsCount={sortedActive.length}
        activeKind={activeKind}
        statoManutenzione={filtersState.statoManutenzione}
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
            Filtro Autista ignorato in questa scheda â€” le manutenzioni non hanno un autista, mostrato l&apos;elenco completo del periodo.
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
                const targaRaw: string | null = record.data.targa ?? null;
                const targaKey: string | null = targaRaw
                  ? targaRaw.trim().toUpperCase()
                  : null;
                const mezzoMeta = targaKey
                  ? dataState.flotta.get(targaKey) ?? null
                  : null;
                return (
                  <div key={id} className="archivio-row-wrap">
                    {record.kind === "manutenzione" ? (
                      <ArchivioRowManutenzione
                        record={record}
                        isExpanded={isExpanded}
                        onToggleExpand={() => handleToggleExpand(id)}
                        mezzoMeta={mezzoMeta}
                        onEliminaArchivio={() => handleRequestElimina(record)}
                      />
                    ) : record.kind === "segnalazione" ? (
                      <ArchivioRowSegnalazione
                        record={record}
                        isExpanded={isExpanded}
                        onToggleExpand={() => handleToggleExpand(id)}
                        mezzoMeta={mezzoMeta}
                        onOpenEventoModal={onOpenEventoModal}
                        onEliminaArchivio={() => handleRequestElimina(record)}
                      />
                    ) : (
                      <ArchivioRowRichiesta
                        record={record}
                        isExpanded={isExpanded}
                        onToggleExpand={() => handleToggleExpand(id)}
                        mezzoMeta={mezzoMeta}
                        onOpenEventoModal={onOpenEventoModal}
                        onEliminaArchivio={() => handleRequestElimina(record)}
                      />
                    )}
                    {isExpanded ? <ArchivioRowExpanded record={record} /> : null}
                  </div>
                );
              })}
            </section>
          ))
        )}
      </div>
      <ArchivioConfirmDelete
        open={hideState.confirmOpen}
        kindLabel={hideState.pending?.kindLabel ?? "voce"}
        recordTitle={hideState.pending?.recordTitle ?? null}
        busy={hideState.busy}
        errorMessage={hideState.errorMessage}
        onConfirm={() => void hideState.executeHide()}
        onCancel={hideState.cancelConfirm}
      />
    </>
  );
}
