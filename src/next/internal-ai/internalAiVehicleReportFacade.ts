import {
  NEXT_ANAGRAFICHE_FLOTTA_DOMAIN,
  normalizeNextMezzoTarga,
  readNextMezzoByTarga,
  type NextAnagraficheFlottaMezzoItem,
} from "../nextAnagraficheFlottaDomain";
import {
  NEXT_OPERATIVITA_TECNICA_DOMAIN,
  readNextMezzoOperativitaTecnicaSnapshot,
  type NextManutenzioneTecnicaItem,
  type NextMezzoOperativitaTecnicaSnapshot,
} from "../nextOperativitaTecnicaDomain";
import type { NextLavoroReadOnlyItem } from "../domain/nextLavoriDomain";
import {
  NEXT_CENTRO_CONTROLLO_DOMAIN,
  readNextStatoOperativoSnapshot,
  type D10AlertItem,
  type D10FocusItem,
  type D10ImportantAutistiEventItem,
  type D10RevisionItem,
  type D10SessionItem,
  type D10Snapshot,
} from "../domain/nextCentroControlloDomain";
import { formatDateUI } from "../nextDateFormat";
import {
  describeInternalAiPeriodApplication,
  filterItemsByInternalAiReportPeriod,
  resolveInternalAiReportPeriodContext,
} from "./internalAiReportPeriod";
import type {
  InternalAiApprovalState,
  InternalAiPreviewState,
  InternalAiReportPeriodContext,
  InternalAiReportPeriodInput,
  InternalAiReportPeriodSectionStatus,
  InternalAiVehicleReportPreview,
  InternalAiVehicleReportSection,
  InternalAiVehicleReportSectionStatus,
  InternalAiVehicleReportSource,
  InternalAiVehicleReportSourceStatus,
} from "./internalAiTypes";

export type InternalAiVehicleReportReadResult =
  | {
      status: "invalid_query" | "not_found";
      normalizedTarga: string | null;
      message: string;
      report: null;
    }
  | {
      status: "ready";
      normalizedTarga: string;
      message: string;
      report: InternalAiVehicleReportPreview;
    };

export type InternalAiVehicleVerticalReadResult =
  | {
      status: "invalid_query" | "not_found";
      normalizedTarga: string | null;
      message: string;
      snapshot: null;
    }
  | {
      status: "ready";
      normalizedTarga: string;
      message: string;
      snapshot: InternalAiVehicleVerticalSnapshot;
    };

type PeriodAwareMeta = {
  periodStatus: InternalAiReportPeriodSectionStatus;
  periodNote: string | null;
};

export type InternalAiVehicleVerticalSnapshot = {
  mezzo: NextAnagraficheFlottaMezzoItem;
  operativita: NextMezzoOperativitaTecnicaSnapshot;
  statoOperativo: D10Snapshot;
  alerts: D10AlertItem[];
  focusItems: D10FocusItem[];
  revisioni: D10RevisionItem[];
  sessioni: D10SessionItem[];
  importantEvents: D10ImportantAutistiEventItem[];
  sourceDatasetLabels: string[];
  limitations: string[];
};

function takeNotes(notes: string[] | undefined, limit = 3): string[] {
  return (notes ?? []).filter(Boolean).slice(0, limit);
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim()))));
}

function formatCountLabel(value: number, suffix: string): string {
  return `${value} ${suffix}`;
}

function parseDateFlexible(value: string | null | undefined): number | null {
  if (!value) return null;

  const direct = Date.parse(value);
  if (!Number.isNaN(direct)) {
    return direct;
  }

  const match = value.match(/^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})$/);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const rawYear = Number(match[3]);
  const year = match[3].length === 2 ? Number(`20${rawYear}`) : rawYear;
  const parsed = new Date(year, month, day, 12, 0, 0, 0).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function formatDateFromTimestamp(value: number | null): string {
  if (value == null) return "non disponibile";
  return formatDateUI(value);
}

function mapSectionStateToStatus(args: {
  visibleCount: number;
  availableCount: number;
  context: InternalAiReportPeriodContext;
}): InternalAiVehicleReportSectionStatus {
  if (args.visibleCount > 0) return "completa";
  if (args.context.appliesFilter && args.availableCount > 0) return "parziale";
  return "vuota";
}

function mapSourceStatus(args: {
  visibleCount: number;
  availableCount: number;
  context: InternalAiReportPeriodContext;
}): InternalAiVehicleReportSourceStatus {
  if (args.visibleCount > 0) return "disponibile";
  if (args.context.appliesFilter && args.availableCount > 0) return "parziale";
  return "parziale";
}

function buildFilterablePeriodMeta(args: {
  context: InternalAiReportPeriodContext;
  noun: string;
  totalCount: number;
  matchingCount: number;
  outsideRangeCount: number;
  missingTimestampCount: number;
}): PeriodAwareMeta {
  if (!args.context.appliesFilter) {
    return {
      periodStatus: "nessun_filtro",
      periodNote: "Nessun filtro periodo attivo: la sezione legge tutto lo storico disponibile.",
    };
  }

  if (args.totalCount === 0) {
    return {
      periodStatus: "non_disponibile",
      periodNote: `Nessun record ${args.noun} leggibile da confrontare con il periodo attivo.`,
    };
  }

  if (args.matchingCount === 0 && args.missingTimestampCount === args.totalCount) {
    return {
      periodStatus: "non_disponibile",
      periodNote: `Il filtro periodo non e applicabile ai record ${args.noun}: manca una data affidabile su tutti gli elementi letti.`,
    };
  }

  return {
    periodStatus: "applicato",
    periodNote: describeInternalAiPeriodApplication({
      noun: args.noun,
      totalCount: args.totalCount,
      matchingCount: args.matchingCount,
      outsideRangeCount: args.outsideRangeCount,
      missingTimestampCount: args.missingTimestampCount,
      context: args.context,
    }),
  };
}

function buildStaticPeriodMeta(
  context: InternalAiReportPeriodContext,
  note: string,
): PeriodAwareMeta {
  if (!context.appliesFilter) {
    return {
      periodStatus: "nessun_filtro",
      periodNote: "Nessun filtro periodo attivo sul report corrente.",
    };
  }

  return {
    periodStatus: "non_applicabile",
    periodNote: note,
  };
}

function createSection(args: {
  id: string;
  title: string;
  status: InternalAiVehicleReportSectionStatus;
  summary: string;
  bullets: string[];
  notes?: string[];
  period: PeriodAwareMeta;
}): InternalAiVehicleReportSection {
  return {
    id: args.id,
    title: args.title,
    status: args.status,
    summary: args.summary,
    bullets: args.bullets,
    notes: takeNotes(args.notes, 4),
    periodStatus: args.period.periodStatus,
    periodNote: args.period.periodNote,
  };
}

function createSource(args: {
  id: string;
  title: string;
  status: InternalAiVehicleReportSourceStatus;
  description: string;
  datasetLabels: string[];
  countLabel: string | null;
  notes?: string[];
  period: PeriodAwareMeta;
}): InternalAiVehicleReportSource {
  return {
    id: args.id,
    title: args.title,
    status: args.status,
    description: args.description,
    datasetLabels: args.datasetLabels,
    countLabel: args.countLabel,
    notes: takeNotes(args.notes, 4),
    periodStatus: args.period.periodStatus,
    periodNote: args.period.periodNote,
  };
}

function buildPreviewStates(snapshot: InternalAiVehicleVerticalSnapshot): Pick<
  InternalAiVehicleReportPreview,
  "previewState" | "approvalState"
> {
  const hasEnoughData =
    snapshot.alerts.length > 0 ||
    snapshot.focusItems.length > 0 ||
    snapshot.operativita.counts.lavoriAperti > 0 ||
    snapshot.operativita.counts.manutenzioni > 0;

  const previewState: InternalAiPreviewState = {
    status: hasEnoughData ? "preview_ready" : "revision_requested",
    updatedAt: new Date().toISOString(),
    note: hasEnoughData
      ? "Anteprima report costruita dai reader canonici della prima verticale in sola lettura."
      : "Anteprima disponibile ma con copertura dati limitata; utile una revisione manuale.",
  };

  const approvalState: InternalAiApprovalState = {
    status: hasEnoughData ? "awaiting_approval" : "revision_requested",
    requestedBy: "ia.interna.preview",
    updatedAt: previewState.updatedAt,
    note: hasEnoughData
      ? "Report solo approvabile a livello di scaffolding, senza applicazione reale."
      : "Prima di considerarla approvabile va completata la verifica dei dati mancanti.",
  };

  return { previewState, approvalState };
}

function buildMissingData(
  snapshot: InternalAiVehicleVerticalSnapshot,
  periodContext: InternalAiReportPeriodContext,
): string[] {
  const missing: string[] = [];

  if (!snapshot.mezzo.autistaNome) {
    missing.push("Autista assegnato non disponibile nell'anagrafica flotta.");
  }
  if (!snapshot.mezzo.dataScadenzaRevisione) {
    missing.push("Scadenza revisione non disponibile nell'anagrafica flotta.");
  }
  if (snapshot.alerts.length === 0 && snapshot.focusItems.length === 0 && snapshot.revisioni.length === 0) {
    missing.push("Nessun alert, focus o revisione urgente leggibile per la targa nel layer D10.");
  }
  if (
    snapshot.operativita.counts.lavoriAperti === 0 &&
    snapshot.operativita.counts.lavoriChiusi === 0 &&
    snapshot.operativita.counts.manutenzioni === 0
  ) {
    missing.push("Nessun lavoro o manutenzione leggibile per la targa nel layer D02.");
  }
  if (periodContext.appliesFilter) {
    missing.push(
      "Il filtro periodo si applica a lavori, manutenzioni e segnali D10 datati; identita mezzo e scadenza revisione restano contesto statico.",
    );
  }

  missing.push(
    "Fuori perimetro consolidato: rifornimenti, costi, documenti, procurement, materiali e verticali specialistici.",
  );

  return missing;
}

function withPeriodNotes(
  base: InternalAiReportPeriodContext,
  extraNotes: string[],
): InternalAiReportPeriodContext {
  return {
    ...base,
    notes: [...base.notes, ...extraNotes.filter(Boolean)],
  };
}

function buildReport(
  snapshot: InternalAiVehicleVerticalSnapshot,
  periodInput?: InternalAiReportPeriodInput,
): InternalAiVehicleReportPreview {
  const generatedAt = new Date().toISOString();
  const periodBase = resolveInternalAiReportPeriodContext(periodInput);
  const previewStates = buildPreviewStates(snapshot);

  const lavoriItems = [...snapshot.operativita.lavoriAperti, ...snapshot.operativita.lavoriChiusi];
  const lavoriPeriod = filterItemsByInternalAiReportPeriod<NextLavoroReadOnlyItem>(
    lavoriItems,
    (item) => item.timestampEsecuzione ?? item.timestampInserimento,
    periodBase,
  );
  const lavoriDaEseguire = lavoriPeriod.filteredItems.filter((entry) => !entry.eseguito);
  const lavoriInAttesa = lavoriPeriod.filteredItems.filter((entry) => entry.matchesDossierInAttesaView);
  const lavoriEseguiti = lavoriPeriod.filteredItems.filter((entry) => entry.eseguito === true);
  const lavoriPeriodMeta = buildFilterablePeriodMeta({
    context: periodBase,
    noun: "lavori",
    totalCount: lavoriPeriod.totalCount,
    matchingCount: lavoriPeriod.matchingCount,
    outsideRangeCount: lavoriPeriod.outsideRangeCount,
    missingTimestampCount: lavoriPeriod.missingTimestampCount,
  });

  const manutenzioniItems = snapshot.operativita.manutenzioni;
  const manutenzioniPeriod = filterItemsByInternalAiReportPeriod<NextManutenzioneTecnicaItem>(
    manutenzioniItems,
    (item) => parseDateFlexible(item.data),
    periodBase,
  );
  const manutenzioniPeriodMeta = buildFilterablePeriodMeta({
    context: periodBase,
    noun: "manutenzioni",
    totalCount: manutenzioniPeriod.totalCount,
    matchingCount: manutenzioniPeriod.matchingCount,
    outsideRangeCount: manutenzioniPeriod.outsideRangeCount,
    missingTimestampCount: manutenzioniPeriod.missingTimestampCount,
  });

  const alertItems = [
    ...snapshot.alerts.map((item) => item.dueTs ?? item.eventTs),
    ...snapshot.focusItems.map((item) => item.eventTs),
    ...snapshot.importantEvents.map((item) => item.ts),
  ];
  const alertMatchingCount =
    !periodBase.appliesFilter
      ? alertItems.length
      : alertItems.filter((value) => {
          if (value == null) return false;
          if (periodBase.fromTimestamp != null && value < periodBase.fromTimestamp) return false;
          if (periodBase.toTimestamp != null && value > periodBase.toTimestamp) return false;
          return true;
        }).length;
  const alertOutsideRangeCount =
    !periodBase.appliesFilter
      ? 0
      : alertItems.filter((value) => {
          if (value == null) return false;
          if (periodBase.fromTimestamp != null && value < periodBase.fromTimestamp) return true;
          if (periodBase.toTimestamp != null && value > periodBase.toTimestamp) return true;
          return false;
        }).length;
  const statoOperativoPeriodMeta = buildFilterablePeriodMeta({
    context: periodBase,
    noun: "segnali operativi",
    totalCount: alertItems.length,
    matchingCount: alertMatchingCount,
    outsideRangeCount: alertOutsideRangeCount,
    missingTimestampCount: alertItems.filter((value) => value == null).length,
  });

  const identitaPeriodMeta = buildStaticPeriodMeta(
    periodBase,
    "La sezione identita mezzo e anagrafica non rappresenta eventi temporali filtrabili.",
  );
  const revisionePeriodMeta = buildStaticPeriodMeta(
    periodBase,
    "Le revisioni restano un segnale di stato corrente del mezzo e non uno storico filtrato per evento.",
  );

  const periodContext = withPeriodNotes(periodBase, [
    periodBase.appliesFilter
      ? "Filtro periodo applicato davvero a lavori, manutenzioni e segnali D10 con data leggibile."
      : "Il report mostra tutto il perimetro disponibile della prima verticale letto nel clone.",
    periodBase.appliesFilter
      ? "Identita mezzo e revisione restano visibili come contesto operativo anche fuori filtro stretto."
      : "",
  ]);

  const missingData = buildMissingData(snapshot, periodContext);
  const latestMaintenance = manutenzioniPeriod.filteredItems[0] ?? manutenzioniItems[0] ?? null;
  const activeRevision = snapshot.revisioni[0] ?? null;
  const revisionTone =
    activeRevision?.classe && activeRevision.classe.toLowerCase().includes("scad")
      ? "warning"
      : snapshot.mezzo.dataScadenzaRevisione
        ? "default"
        : "warning";

  const sections: InternalAiVehicleReportSection[] = [
    createSection({
      id: "identita-mezzo",
      title: "Identita mezzo",
      status: "completa",
      summary: "Intestazione mezzo costruita dal reader anagrafico D01 in sola lettura.",
      bullets: [
        `Targa: ${snapshot.mezzo.targa}`,
        `Categoria: ${snapshot.mezzo.categoria || "Non disponibile"}`,
        `Marca e modello: ${snapshot.mezzo.marcaModello || "Non disponibile"}`,
        `Autista dichiarato: ${snapshot.mezzo.autistaNome || "Non disponibile"}`,
        `Scadenza revisione: ${snapshot.mezzo.dataScadenzaRevisione || "Non disponibile"}`,
      ],
      notes: takeNotes(snapshot.mezzo.flags, 3),
      period: identitaPeriodMeta,
    }),
    createSection({
      id: "stato-operativo",
      title: "Stato operativo, alert e focus",
      status: mapSectionStateToStatus({
        visibleCount:
          snapshot.alerts.length + snapshot.focusItems.length + snapshot.importantEvents.length,
        availableCount:
          snapshot.alerts.length + snapshot.focusItems.length + snapshot.importantEvents.length,
        context: periodBase,
      }),
      summary:
        snapshot.alerts.length + snapshot.focusItems.length > 0
          ? `Trovati ${snapshot.alerts.length} alert e ${snapshot.focusItems.length} focus leggibili per la targa.`
          : "Nessun alert o focus attivo leggibile per la targa nel cockpit D10.",
      bullets: [
        `Alert visibili: ${snapshot.alerts.length}`,
        `Focus operativi: ${snapshot.focusItems.length}`,
        `Sessioni attive correlate: ${snapshot.sessioni.length}`,
        `Eventi Home importanti: ${snapshot.importantEvents.length}`,
      ],
      notes: takeNotes(
        [
          ...snapshot.alerts.slice(0, 2).map((item) => `${item.title}: ${item.detailText}`),
          ...snapshot.focusItems.slice(0, 2).map((item) => `${item.title}: ${item.detailText}`),
          ...takeNotes(snapshot.statoOperativo.limitations, 2),
        ],
        4,
      ),
      period: statoOperativoPeriodMeta,
    }),
    createSection({
      id: "revisione",
      title: "Revisione e scadenze",
      status: activeRevision || snapshot.mezzo.dataScadenzaRevisione ? "completa" : "vuota",
      summary: activeRevision
        ? `Segnale revisione attivo: ${activeRevision.classe}.`
        : snapshot.mezzo.dataScadenzaRevisione
          ? `Scadenza revisione disponibile in anagrafica: ${snapshot.mezzo.dataScadenzaRevisione}.`
          : "Scadenza revisione non disponibile per il mezzo.",
      bullets: [
        `Scadenza anagrafica: ${snapshot.mezzo.dataScadenzaRevisione || "non disponibile"}`,
        `Classe D10: ${activeRevision?.classe ?? "nessuna evidenza urgente"}`,
        `Data D10: ${formatDateFromTimestamp(activeRevision?.scadenzaTs ?? null)}`,
        `Autista associato: ${activeRevision?.autistaNome ?? snapshot.mezzo.autistaNome ?? "non disponibile"}`,
      ],
      notes: takeNotes(activeRevision ? activeRevision.flags : [], 2),
      period: revisionePeriodMeta,
    }),
    createSection({
      id: "lavori-operativita",
      title: "Lavori e backlog tecnico",
      status: mapSectionStateToStatus({
        visibleCount: lavoriPeriod.filteredItems.length,
        availableCount: lavoriItems.length,
        context: periodBase,
      }),
      summary:
        lavoriPeriod.filteredItems.length > 0
          ? `Trovati ${lavoriPeriod.filteredItems.length} lavori collegati alla targa nel periodo attivo.`
          : periodBase.appliesFilter && lavoriItems.length > 0
            ? "Nessun lavoro ricade nel periodo attivo, ma il layer D02 resta disponibile."
            : "Nessun lavoro collegato alla targa nel layer D02.",
      bullets: [
        `Da eseguire: ${lavoriDaEseguire.length}`,
        `In attesa: ${lavoriInAttesa.length}`,
        `Eseguiti: ${lavoriEseguiti.length}`,
        `Urgenza alta nel periodo: ${lavoriPeriod.filteredItems.filter((item) => item.urgenza === "alta").length}`,
      ],
      notes: takeNotes(
        lavoriPeriod.filteredItems.slice(0, 3).map((item) => item.descrizione ?? "Lavoro senza descrizione"),
        3,
      ),
      period: lavoriPeriodMeta,
    }),
    createSection({
      id: "manutenzioni",
      title: "Manutenzioni e storico tecnico",
      status: mapSectionStateToStatus({
        visibleCount: manutenzioniPeriod.filteredItems.length,
        availableCount: manutenzioniItems.length,
        context: periodBase,
      }),
      summary:
        manutenzioniPeriod.filteredItems.length > 0
          ? `Trovate ${manutenzioniPeriod.filteredItems.length} manutenzioni nel periodo attivo.`
          : periodBase.appliesFilter && manutenzioniItems.length > 0
            ? "Nessuna manutenzione ricade nel periodo attivo, ma lo storico tecnico D02 resta disponibile."
            : "Nessuna manutenzione leggibile per il mezzo nel layer D02.",
      bullets: [
        `Manutenzioni nel periodo: ${manutenzioniPeriod.filteredItems.length}`,
        `Con km valorizzati: ${manutenzioniPeriod.filteredItems.filter((item) => item.km != null).length}`,
        `Con ore valorizzate: ${manutenzioniPeriod.filteredItems.filter((item) => item.ore != null).length}`,
        `Ultimo intervento: ${latestMaintenance?.data ?? "non disponibile"}`,
      ],
      notes: takeNotes(
        manutenzioniPeriod.filteredItems
          .slice(0, 3)
          .map((item) => item.descrizione ?? item.tipo ?? "Manutenzione senza descrizione"),
        3,
      ),
      period: manutenzioniPeriodMeta,
    }),
  ];

  const sources: InternalAiVehicleReportSource[] = [
    createSource({
      id: "anagrafica",
      title: NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.name,
      status: "disponibile",
      description: "Identita mezzo letta dal reader canonico D01 della flotta NEXT.",
      datasetLabels: [...NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.logicalDatasets],
      countLabel: "1 mezzo letto",
      notes: takeNotes(snapshot.mezzo.flags, 2),
      period: identitaPeriodMeta,
    }),
    createSource({
      id: "stato-operativo",
      title: NEXT_CENTRO_CONTROLLO_DOMAIN.name,
      status: mapSourceStatus({
        visibleCount:
          snapshot.alerts.length +
          snapshot.focusItems.length +
          snapshot.importantEvents.length +
          snapshot.revisioni.length,
        availableCount:
          snapshot.alerts.length +
          snapshot.focusItems.length +
          snapshot.importantEvents.length +
          snapshot.revisioni.length,
        context: periodBase,
      }),
      description: "Alert, revisioni, focus e segnali Home letti dal read model D10 in sola lettura.",
      datasetLabels: [...NEXT_CENTRO_CONTROLLO_DOMAIN.logicalDatasets],
      countLabel: `${snapshot.alerts.length} alert, ${snapshot.focusItems.length} focus, ${snapshot.revisioni.length} revisioni`,
      notes: takeNotes(snapshot.statoOperativo.limitations, 3),
      period: statoOperativoPeriodMeta,
    }),
    createSource({
      id: "lavori",
      title: "Lavori mezzo-centrici",
      status: mapSourceStatus({
        visibleCount: lavoriPeriod.filteredItems.length,
        availableCount: lavoriItems.length,
        context: periodBase,
      }),
      description: "Lavori letti dal reader D02 dei lavori mezzo-centrici gia normalizzati nel clone.",
      datasetLabels: ["@lavori"],
      countLabel: formatCountLabel(lavoriPeriod.filteredItems.length, "lavori nel periodo"),
      notes: [],
      period: lavoriPeriodMeta,
    }),
    createSource({
      id: "manutenzioni",
      title: NEXT_OPERATIVITA_TECNICA_DOMAIN.name,
      status: mapSourceStatus({
        visibleCount: manutenzioniPeriod.filteredItems.length,
        availableCount: manutenzioniItems.length,
        context: periodBase,
      }),
      description: "Manutenzioni lette dal reader D02 dedicato all'operativita tecnica del mezzo.",
      datasetLabels: [...NEXT_OPERATIVITA_TECNICA_DOMAIN.logicalDatasets],
      countLabel: formatCountLabel(manutenzioniPeriod.filteredItems.length, "manutenzioni nel periodo"),
      notes: [],
      period: manutenzioniPeriodMeta,
    }),
  ];

  return {
    reportType: "targa",
    targetId: snapshot.mezzo.id,
    targetLabel: snapshot.mezzo.targa,
    mezzoTarga: snapshot.mezzo.targa,
    title: `Anteprima report targa ${snapshot.mezzo.targa}`,
    subtitle:
      "Report della prima verticale D01 + D10 + D02, costruito in sola lettura dai reader NEXT canonici e senza scritture.",
    generatedAt,
    header: {
      targa: snapshot.mezzo.targa,
      categoria: snapshot.mezzo.categoria,
      marcaModello: snapshot.mezzo.marcaModello,
      autistaNome: snapshot.mezzo.autistaNome,
      revisione: snapshot.mezzo.dataScadenzaRevisione,
      librettoPresente: Boolean(snapshot.mezzo.librettoUrl),
      manutenzioneProgrammata: snapshot.mezzo.manutenzioneProgrammata,
    },
    cards: [
      {
        label: "Alert e focus",
        value: String(snapshot.alerts.length + snapshot.focusItems.length),
        meta: `Revisioni ${snapshot.revisioni.length}, eventi Home ${snapshot.importantEvents.length}`,
        tone: snapshot.alerts.length + snapshot.focusItems.length > 0 ? "warning" : "default",
      },
      {
        label: "Revisione",
        value: snapshot.mezzo.dataScadenzaRevisione || "n/d",
        meta: activeRevision ? `Stato D10: ${activeRevision.classe}` : "Nessun alert revisione urgente",
        tone: revisionTone,
      },
      {
        label: "Lavori aperti",
        value: String(snapshot.operativita.counts.lavoriAperti),
        meta: `In attesa ${snapshot.operativita.lavoriAperti.filter((item) => item.matchesDossierInAttesaView).length}`,
        tone: snapshot.operativita.counts.lavoriAperti > 0 ? "warning" : "default",
      },
      {
        label: "Manutenzioni",
        value: String(snapshot.operativita.counts.manutenzioni),
        meta: `Ultimo intervento ${latestMaintenance?.data ?? "non disponibile"}`,
        tone: snapshot.operativita.counts.manutenzioni > 0 ? "success" : "warning",
      },
    ],
    periodContext,
    sections,
    missingData,
    evidences: uniqueStrings([
      `Reader anagrafico: ${NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.code}`,
      `Reader stato operativo: ${NEXT_CENTRO_CONTROLLO_DOMAIN.code}`,
      `Reader tecnico: ${NEXT_OPERATIVITA_TECNICA_DOMAIN.code}`,
      `Periodo attivo: ${periodContext.label}`,
      ...snapshot.alerts.slice(0, 2).map((item) => item.title),
      ...snapshot.operativita.lavoriAperti.slice(0, 2).map((item) => item.descrizione ?? "lavoro"),
      ...snapshot.operativita.manutenzioni
        .slice(0, 2)
        .map((item) => item.descrizione ?? item.tipo ?? "manutenzione"),
    ]),
    sources,
    previewState: previewStates.previewState,
    approvalState: previewStates.approvalState,
  };
}

export async function readInternalAiVehicleVerticalSnapshot(
  rawTarga: string,
): Promise<InternalAiVehicleVerticalReadResult> {
  const normalizedTarga = normalizeNextMezzoTarga(rawTarga);
  if (!normalizedTarga) {
    return {
      status: "invalid_query",
      normalizedTarga: null,
      message: "Inserisci una targa valida prima di interrogare la verticale mezzo/Home/tecnica.",
      snapshot: null,
    };
  }

  const [mezzo, operativita, statoOperativo] = await Promise.all([
    readNextMezzoByTarga(normalizedTarga),
    readNextMezzoOperativitaTecnicaSnapshot(normalizedTarga),
    readNextStatoOperativoSnapshot(),
  ]);

  if (!mezzo) {
    return {
      status: "not_found",
      normalizedTarga,
      message: `Nessun mezzo trovato nel clone in sola lettura per la targa ${normalizedTarga}.`,
      snapshot: null,
    };
  }

  const alerts = statoOperativo.alerts.filter((item) => item.mezzoTarga === normalizedTarga);
  const focusItems = statoOperativo.focusItems.filter((item) => item.mezzoTarga === normalizedTarga);
  const revisioni = statoOperativo.revisioni.filter((item) => item.targa === normalizedTarga);
  const sessioni = statoOperativo.sessioni.filter(
    (item) => item.targaMotrice === normalizedTarga || item.targaRimorchio === normalizedTarga,
  );
  const importantEvents = statoOperativo.importantAutistiItems.filter(
    (item) => normalizeNextMezzoTarga(item.targa) === normalizedTarga,
  );

  return {
    status: "ready",
    normalizedTarga,
    message: `Verticale mezzo/Home/tecnica letta in sola lettura per la targa ${normalizedTarga}.`,
    snapshot: {
      mezzo,
      operativita,
      statoOperativo,
      alerts,
      focusItems,
      revisioni,
      sessioni,
      importantEvents,
      sourceDatasetLabels: uniqueStrings([
        ...NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.logicalDatasets,
        ...NEXT_OPERATIVITA_TECNICA_DOMAIN.logicalDatasets,
        ...NEXT_CENTRO_CONTROLLO_DOMAIN.logicalDatasets,
      ]),
      limitations: uniqueStrings([
        "Prima verticale consolidata: D01 anagrafica mezzo, D10 stato operativo e D02 operativita tecnica.",
        "Le pagine clone Home e Centro Controllo restano superfici UI; la lettura canonica per la chat passa dai read model NEXT.",
        ...takeNotes(statoOperativo.limitations, 3),
        "D04, D05, D06, D07 e D08 restano fuori verticale consolidata in questo step.",
      ]),
    },
  };
}

export async function readInternalAiVehicleReportPreview(
  rawTarga: string,
  periodInput?: InternalAiReportPeriodInput,
): Promise<InternalAiVehicleReportReadResult> {
  const periodContext = resolveInternalAiReportPeriodContext(periodInput);
  if (!periodContext.isValid) {
    return {
      status: "invalid_query",
      normalizedTarga: normalizeNextMezzoTarga(rawTarga) || null,
      message: "Il periodo selezionato non e valido. Controlla le date da e a prima di generare l'anteprima.",
      report: null,
    };
  }

  const result = await readInternalAiVehicleVerticalSnapshot(rawTarga);
  if (result.status !== "ready") {
    return {
      status: result.status,
      normalizedTarga: result.normalizedTarga,
      message: result.message,
      report: null,
    };
  }

  return {
    status: "ready",
    normalizedTarga: result.normalizedTarga,
    message: `Anteprima report generata in sola lettura per la targa ${result.normalizedTarga} nel perimetro D01 + D10 + D02 con periodo ${periodContext.label}.`,
    report: buildReport(result.snapshot, periodInput),
  };
}
