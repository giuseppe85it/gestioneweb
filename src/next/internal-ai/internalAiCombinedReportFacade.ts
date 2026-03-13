import { readNextCentroControlloSnapshot } from "../domain/nextCentroControlloDomain";
import {
  readNextMezzoRifornimentiSnapshot,
  type NextRifornimentoReadOnlyItem,
} from "../domain/nextRifornimentiDomain";
import {
  normalizeNextMezzoTarga,
  readNextAnagraficheFlottaSnapshot,
} from "../nextAnagraficheFlottaDomain";
import {
  describeInternalAiPeriodApplication,
  filterItemsByInternalAiReportPeriod,
  resolveInternalAiReportPeriodContext,
} from "./internalAiReportPeriod";
import {
  matchInternalAiDriverLayerIdentity,
  matchInternalAiDriverVehicleIdentity,
  normalizeInternalAiDriverIdentityText,
  type InternalAiDriverCrossLayerMatch,
} from "./internalAiDriverIdentity";
import type {
  InternalAiApprovalState,
  InternalAiCombinedMatchReliability,
  InternalAiCombinedReportPreview,
  InternalAiDriverLookupCandidate,
  InternalAiPreviewState,
  InternalAiReportPeriodContext,
  InternalAiReportPeriodInput,
  InternalAiReportPeriodSectionStatus,
  InternalAiVehicleReportSection,
  InternalAiVehicleReportSectionStatus,
  InternalAiVehicleReportSource,
  InternalAiVehicleReportSourceStatus,
} from "./internalAiTypes";
import { readInternalAiDriverReportPreview } from "./internalAiDriverReportFacade";
import { readInternalAiVehicleReportPreview } from "./internalAiVehicleReportFacade";

export type InternalAiCombinedReportReadResult =
  | {
      status: "invalid_query" | "not_found";
      normalizedTarga: string | null;
      normalizedDriverQuery: string | null;
      message: string;
      report: null;
    }
  | {
      status: "ready";
      normalizedTarga: string;
      normalizedDriverQuery: string;
      message: string;
      report: InternalAiCombinedReportPreview;
    };

type PeriodAwareMeta = {
  periodStatus: InternalAiReportPeriodSectionStatus;
  periodNote: string | null;
};

type MatchedDriverRecord<T> = {
  item: T;
  match: InternalAiDriverCrossLayerMatch;
};

function takeNotes(notes: string[] | undefined, limit = 3): string[] {
  return (notes ?? []).filter(Boolean).slice(0, limit);
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

function buildReusedFilteredPeriodMeta(
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
    periodStatus: "applicato",
    periodNote: note,
  };
}

function collectMatchedDriverRecords<T>(
  items: T[],
  getIdentity: (item: T) => {
    badgeAutista?: string | null;
    autistaNome?: string | null;
    nomeAutista?: string | null;
  },
  driver: { badge: string | null; nomeCompleto: string },
): MatchedDriverRecord<T>[] {
  return items
    .map((item) => ({
      item,
      match: matchInternalAiDriverLayerIdentity({
        driver,
        layerIdentity: getIdentity(item),
      }),
    }))
    .filter((entry) => entry.match.matched);
}

function countMatchedDriverRecordsByStrength<T>(
  items: MatchedDriverRecord<T>[],
  filteredItems?: T[],
): { forti: number; plausibili: number } {
  const visibleItems = filteredItems ? new Set(filteredItems) : null;

  return items.reduce(
    (accumulator, entry) => {
      if (visibleItems && !visibleItems.has(entry.item)) {
        return accumulator;
      }

      if (entry.match.strength === "forte") {
        accumulator.forti += 1;
      } else if (entry.match.strength === "plausibile") {
        accumulator.plausibili += 1;
      }

      return accumulator;
    },
    { forti: 0, plausibili: 0 },
  );
}

function buildPreviewStates(args: {
  reliability: InternalAiCombinedMatchReliability;
  combinedSignals: number;
  refuels: number;
}): Pick<InternalAiCombinedReportPreview, "previewState" | "approvalState"> {
  const usefulCoverage =
    args.reliability === "forte" || args.combinedSignals > 0 || args.refuels > 0;

  const previewState: InternalAiPreviewState = {
    status: usefulCoverage ? "preview_ready" : "revision_requested",
    updatedAt: new Date().toISOString(),
    note: usefulCoverage
      ? "Anteprima combinata costruita in sola lettura riusando i facade IA interni e i layer NEXT gia disponibili."
      : "Anteprima combinata disponibile ma con legame mezzo-autista non ancora dimostrabile dai dataset letti.",
  };

  const approvalState: InternalAiApprovalState = {
    status: usefulCoverage ? "awaiting_approval" : "revision_requested",
    requestedBy: "ia.interna.preview.combinato",
    updatedAt: previewState.updatedAt,
    note: usefulCoverage
      ? "Report combinato approvabile solo nel workflow mock del clone."
      : "Prima di considerarlo approvabile va chiarito meglio il legame mezzo-autista nei dati letti.",
  };

  return { previewState, approvalState };
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function sumCardValues(
  cards: { label: string; value: string }[],
  label: string,
): number {
  const card = cards.find((entry) => entry.label === label);
  return Number(card?.value ?? "0") || 0;
}

export async function readInternalAiCombinedReportPreview(args: {
  driverCandidate: InternalAiDriverLookupCandidate | null;
  rawTarga: string;
  rawDriverQuery: string;
  periodInput?: InternalAiReportPeriodInput;
}): Promise<InternalAiCombinedReportReadResult> {
  const normalizedTarga = normalizeNextMezzoTarga(args.rawTarga);
  const normalizedDriverQuery = normalizeInternalAiDriverIdentityText(
    args.rawDriverQuery,
  );
  const periodContext = resolveInternalAiReportPeriodContext(args.periodInput);

  if (!normalizedTarga || !normalizedDriverQuery) {
    return {
      status: "invalid_query",
      normalizedTarga,
      normalizedDriverQuery: normalizedDriverQuery || null,
      message:
        "Per la preview combinata servono sia un mezzo reale sia un autista reale selezionabile.",
      report: null,
    };
  }

  if (!periodContext.isValid) {
    return {
      status: "invalid_query",
      normalizedTarga,
      normalizedDriverQuery,
      message: "Il periodo selezionato non e valido. Controlla le date prima di generare il report combinato.",
      report: null,
    };
  }

  const [vehicleResult, driverResult] = await Promise.all([
    readInternalAiVehicleReportPreview(normalizedTarga, args.periodInput),
    readInternalAiDriverReportPreview(args.driverCandidate, normalizedDriverQuery, args.periodInput),
  ]);

  if (vehicleResult.status !== "ready") {
    return {
      status: vehicleResult.status,
      normalizedTarga: vehicleResult.normalizedTarga,
      normalizedDriverQuery,
      message: vehicleResult.message,
      report: null,
    };
  }

  if (driverResult.status !== "ready") {
    return {
      status: driverResult.status,
      normalizedTarga,
      normalizedDriverQuery: driverResult.normalizedDriverQuery,
      message: driverResult.message,
      report: null,
    };
  }

  const [flottaSnapshot, centroControlloSnapshot, mezzoRefuelsSnapshot] = await Promise.all([
    readNextAnagraficheFlottaSnapshot(),
    readNextCentroControlloSnapshot(),
    readNextMezzoRifornimentiSnapshot(vehicleResult.report.mezzoTarga),
  ]);

  const mezzo = flottaSnapshot.items.find((item) => item.targa === vehicleResult.report.mezzoTarga) ?? null;
  const driverName = driverResult.report.header.nomeCompleto;
  const driverBadge = driverResult.report.header.badge;
  const driverIdentity = {
    driverId: driverResult.report.autistaId,
    badge: driverBadge,
    nomeCompleto: driverName,
  };
  const vehicleAssociationMatch = mezzo
    ? matchInternalAiDriverVehicleIdentity({
        driver: driverIdentity,
        layerIdentity: {
          autistaId: mezzo.autistaId,
          autistaNome: mezzo.autistaNome,
        },
      })
    : null;
  const exactAutistaIdMatch = Boolean(
    vehicleAssociationMatch?.matched &&
      vehicleAssociationMatch.reason === "autista_id",
  );
  const declaredNameMatch = Boolean(
    vehicleAssociationMatch?.matched &&
      vehicleAssociationMatch.reason === "nome_fallback",
  );
  const hasVehicleIdConflict = Boolean(
    vehicleAssociationMatch?.reason === "autista_id_conflict",
  );

  const matchedSessionRecordsAll = collectMatchedDriverRecords(
    centroControlloSnapshot.sessioni.filter(
      (entry) =>
        entry.targaMotrice === vehicleResult.report.mezzoTarga ||
        entry.targaRimorchio === vehicleResult.report.mezzoTarga,
    ),
    (entry) => ({
      badgeAutista: entry.badgeAutista,
      nomeAutista: entry.nomeAutista,
    }),
    driverIdentity,
  );
  const matchedAlertRecordsAll = collectMatchedDriverRecords(
    centroControlloSnapshot.alerts.filter(
      (entry) => entry.mezzoTarga === vehicleResult.report.mezzoTarga,
    ),
    (entry) => ({
      badgeAutista: entry.badgeAutista,
      nomeAutista: entry.autistaNome,
    }),
    driverIdentity,
  );
  const matchedFocusRecordsAll = collectMatchedDriverRecords(
    centroControlloSnapshot.focusItems.filter(
      (entry) => entry.mezzoTarga === vehicleResult.report.mezzoTarga,
    ),
    (entry) => ({
      badgeAutista: entry.badgeAutista,
      nomeAutista: entry.autistaNome,
    }),
    driverIdentity,
  );
  const matchedRefuelRecordsAll = collectMatchedDriverRecords(
    mezzoRefuelsSnapshot.items,
    (item) => ({
      badgeAutista: item.badgeAutista,
      autistaNome: item.autistaNome,
    }),
    driverIdentity,
  );
  const sessionMatchesAll = matchedSessionRecordsAll.map((entry) => entry.item);
  const alertMatchesAll = matchedAlertRecordsAll.map((entry) => entry.item);
  const focusMatchesAll = matchedFocusRecordsAll.map((entry) => entry.item);
  const refuelMatchesAll = matchedRefuelRecordsAll.map((entry) => entry.item);

  const sessionMatches = filterItemsByInternalAiReportPeriod(
    sessionMatchesAll,
    (item) => item.timestamp,
    periodContext,
  );
  const alertMatches = filterItemsByInternalAiReportPeriod(
    alertMatchesAll,
    (item) => item.eventTs ?? item.dueTs,
    periodContext,
  );
  const focusMatches = filterItemsByInternalAiReportPeriod(
    focusMatchesAll,
    (item) => item.eventTs,
    periodContext,
  );
  const refuelMatches = filterItemsByInternalAiReportPeriod<NextRifornimentoReadOnlyItem>(
    refuelMatchesAll,
    (item) => item.timestampRicostruito,
    periodContext,
  );
  const sessionMatchCountsAll = countMatchedDriverRecordsByStrength(matchedSessionRecordsAll);
  const alertMatchCountsAll = countMatchedDriverRecordsByStrength(matchedAlertRecordsAll);
  const focusMatchCountsAll = countMatchedDriverRecordsByStrength(matchedFocusRecordsAll);
  const refuelMatchCountsAll = countMatchedDriverRecordsByStrength(matchedRefuelRecordsAll);
  const sessionMatchCountsPeriod = countMatchedDriverRecordsByStrength(
    matchedSessionRecordsAll,
    sessionMatches.filteredItems,
  );
  const alertMatchCountsPeriod = countMatchedDriverRecordsByStrength(
    matchedAlertRecordsAll,
    alertMatches.filteredItems,
  );
  const focusMatchCountsPeriod = countMatchedDriverRecordsByStrength(
    matchedFocusRecordsAll,
    focusMatches.filteredItems,
  );
  const refuelMatchCountsPeriod = countMatchedDriverRecordsByStrength(
    matchedRefuelRecordsAll,
    refuelMatches.filteredItems,
  );

  const combinedSignalsInPeriod =
    sessionMatches.filteredItems.length +
    alertMatches.filteredItems.length +
    focusMatches.filteredItems.length;
  const combinedSignalsAll =
    sessionMatchesAll.length + alertMatchesAll.length + focusMatchesAll.length;
  const strongOperationalMatchesAll =
    sessionMatchCountsAll.forti +
    alertMatchCountsAll.forti +
    focusMatchCountsAll.forti;
  const plausibleOperationalMatchesAll =
    sessionMatchCountsAll.plausibili +
    alertMatchCountsAll.plausibili +
    focusMatchCountsAll.plausibili;
  const strongOperationalMatchesPeriod =
    sessionMatchCountsPeriod.forti +
    alertMatchCountsPeriod.forti +
    focusMatchCountsPeriod.forti;
  const plausibleOperationalMatchesPeriod =
    sessionMatchCountsPeriod.plausibili +
    alertMatchCountsPeriod.plausibili +
    focusMatchCountsPeriod.plausibili;
  const strongCrossLayerMatchesAll =
    strongOperationalMatchesAll + refuelMatchCountsAll.forti;
  const plausibleCrossLayerMatchesAll =
    plausibleOperationalMatchesAll + refuelMatchCountsAll.plausibili;
  const latestCombinedSession = [...sessionMatches.filteredItems].sort(
    (left, right) => (right.timestamp ?? 0) - (left.timestamp ?? 0),
  )[0] ?? null;
  const latestCombinedRefuel = [...refuelMatches.filteredItems].sort(
    (left, right) => (right.timestampRicostruito ?? 0) - (left.timestampRicostruito ?? 0),
  )[0] ?? null;

  const reliability: InternalAiCombinedMatchReliability = exactAutistaIdMatch
    ? "forte"
    : strongCrossLayerMatchesAll > 0
      ? "forte"
      : hasVehicleIdConflict
        ? "non_dimostrabile"
        : declaredNameMatch || plausibleCrossLayerMatchesAll > 0
          ? "plausibile"
          : "non_dimostrabile";

  const reliabilityReason = exactAutistaIdMatch
    ? "Legame confermato dal dominio anagrafico D01: `autistaId` del mezzo coincide con l'autista selezionato."
    : strongCrossLayerMatchesAll > 0 && hasVehicleIdConflict
      ? "Legame forte nel periodo da badge coerente in D10/D04, ma l'anagrafica D01 del mezzo oggi punta a un autista diverso."
      : strongCrossLayerMatchesAll > 0
        ? "Legame forte nel periodo: almeno un segnale D10 o un rifornimento D04 conferma il badge dell'autista sul mezzo selezionato."
        : hasVehicleIdConflict
          ? "Il mezzo espone un `autistaId` diverso dall'autista selezionato e non esistono conferme forti da badge nei layer operativi letti."
          : declaredNameMatch
            ? "Legame plausibile da D01: il mezzo espone solo il nome autista dichiarato e coincide con l'autista selezionato."
            : plausibleCrossLayerMatchesAll > 0
              ? "Legame solo plausibile: i layer D10/D04 mostrano compatibilita sul nome, ma senza conferma badge."
              : "Il repo non mostra ancora un collegamento affidabile tra questo mezzo e questo autista nei layer letti.";

  const legamePeriodMeta = buildStaticPeriodMeta(
    periodContext,
    "La valutazione del legame mezzo-autista combina contesto anagrafico e segnali operativi; non tutto il ragionamento e riducibile al solo filtro periodo.",
  );
  const contextPeriodMeta = buildStaticPeriodMeta(
    periodContext,
    "Il contesto selezionato mostra identita mezzo, autista e periodo attivo: non e una sezione evento filtrabile.",
  );
  const intersezionePeriodMeta = buildFilterablePeriodMeta({
    context: periodContext,
    noun: "segnali combinati mezzo-autista",
    totalCount:
      sessionMatches.totalCount +
      alertMatches.totalCount +
      focusMatches.totalCount +
      refuelMatches.totalCount,
    matchingCount:
      sessionMatches.matchingCount +
      alertMatches.matchingCount +
      focusMatches.matchingCount +
      refuelMatches.matchingCount,
    outsideRangeCount:
      sessionMatches.outsideRangeCount +
      alertMatches.outsideRangeCount +
      focusMatches.outsideRangeCount +
      refuelMatches.outsideRangeCount,
    missingTimestampCount:
      sessionMatches.missingTimestampCount +
      alertMatches.missingTimestampCount +
      focusMatches.missingTimestampCount +
      refuelMatches.missingTimestampCount,
  });
  const reusedVehiclePeriodMeta = buildReusedFilteredPeriodMeta(
    periodContext,
    "Questa vista riassume il report mezzo gia filtrato con lo stesso contesto periodo del report combinato.",
  );
  const reusedDriverPeriodMeta = buildReusedFilteredPeriodMeta(
    periodContext,
    "Questa vista riassume il report autista gia filtrato con lo stesso contesto periodo del report combinato.",
  );

  const missingData = [
    !mezzo?.autistaId && !mezzo?.autistaNome
      ? "L'anagrafica del mezzo non espone ne `autistaId` ne `autistaNome` per questo abbinamento."
      : null,
    hasVehicleIdConflict
      ? "L'anagrafica D01 del mezzo espone oggi un `autistaId` diverso: il contesto periodo va letto separatamente dall'associazione corrente."
      : null,
    reliability === "non_dimostrabile"
      ? "Il legame mezzo-autista non e dimostrabile con i dataset letti nel clone: la preview resta solo contestuale."
      : null,
    combinedSignalsAll === 0
      ? "Nessun segnale D10 leggibile collega insieme mezzo e autista."
      : null,
    refuelMatchesAll.length === 0
      ? "Nessun rifornimento D04 del mezzo e attribuibile all'autista selezionato."
      : null,
    periodContext.appliesFilter && combinedSignalsAll > 0 && combinedSignalsInPeriod === 0
      ? "Esistono segnali mezzo-autista fuori dall'intervallo attivo, ma non nel periodo richiesto."
      : null,
    periodContext.appliesFilter && refuelMatchesAll.length > 0 && refuelMatches.filteredItems.length === 0
      ? "Esistono rifornimenti del mezzo attribuibili all'autista fuori periodo, ma non nel range attivo."
      : null,
  ].filter((entry): entry is string => Boolean(entry));

  const previewStates = buildPreviewStates({
    reliability,
    combinedSignals: combinedSignalsInPeriod,
    refuels: refuelMatches.filteredItems.length,
  });

  const vehicleReportDocumentCount = sumCardValues(vehicleResult.report.cards, "Documenti e costi");
  const vehicleReportMaintenanceCount = sumCardValues(vehicleResult.report.cards, "Manutenzioni");
  const driverReportSignalsCount = sumCardValues(driverResult.report.cards, "Alert e focus");

  const sections: InternalAiVehicleReportSection[] = [
    createSection({
      id: "contesto-combinato",
      title: "Contesto selezionato",
      status: "completa",
      summary:
        "La preview combinata riusa mezzo, autista e periodo gia selezionati nel sottosistema IA interno.",
      bullets: [
        `Mezzo: ${vehicleResult.report.mezzoTarga} - ${vehicleResult.report.header.marcaModello ?? vehicleResult.report.header.categoria ?? "contesto anagrafico minimo"}`,
        `Autista: ${driverName}${driverBadge ? ` (badge ${driverBadge})` : ""}`,
        `Periodo: ${periodContext.label}`,
        `Autista dichiarato sul mezzo: ${mezzo?.autistaNome ?? "Non disponibile"}`,
      ],
      notes: [
        reliabilityReason,
        latestCombinedSession
          ? `Ultima sessione combinata nel periodo: ${latestCombinedSession.targaMotrice ?? latestCombinedSession.targaRimorchio ?? "-"}`
          : "",
      ],
      period: contextPeriodMeta,
    }),
    createSection({
      id: "legame-mezzo-autista",
      title: "Livello di affidabilita del legame",
      status:
        reliability === "forte"
          ? "completa"
          : reliability === "plausibile"
            ? "parziale"
            : "vuota",
      summary: reliabilityReason,
      bullets: [
        exactAutistaIdMatch
          ? "Conferma forte D01: autistaId sul mezzo coincide con l'autista selezionato."
          : "Conferma forte D01: non disponibile.",
        declaredNameMatch
          ? "Conferma anagrafica debole D01: nome autista dichiarato sul mezzo coincidente."
          : "Conferma anagrafica debole D01: non emersa.",
        `Conferme badge D10/D04: ${strongCrossLayerMatchesAll}`,
        `Conferme da nome esatto D10/D04: ${plausibleCrossLayerMatchesAll}`,
        `Segnali D10 complessivi: ${combinedSignalsAll}`,
        `Rifornimenti D04 complessivi: ${refuelMatchesAll.length}`,
      ],
      notes: [
        "D10 e D04 usano il badge come conferma forte; il nome viene considerato solo quando il badge manca davvero.",
        hasVehicleIdConflict
          ? "Il mezzo ha un autista corrente diverso in D01: la lettura operativa nel periodo resta esplicita e separata."
          : "Se manca una conferma forte da badge o autistaId, il legame resta solo plausibile o non dimostrabile.",
      ],
      period: legamePeriodMeta,
    }),
    createSection({
      id: "intersezione-periodo",
      title: "Intersezione reale nel periodo",
      status:
        combinedSignalsInPeriod > 0 || refuelMatches.filteredItems.length > 0
          ? "completa"
          : periodContext.appliesFilter && (combinedSignalsAll > 0 || refuelMatchesAll.length > 0)
            ? "parziale"
            : "vuota",
      summary:
        combinedSignalsInPeriod > 0 || refuelMatches.filteredItems.length > 0
          ? "Nel periodo attivo esistono segnali che collegano davvero il mezzo e l'autista selezionati."
          : periodContext.appliesFilter && (combinedSignalsAll > 0 || refuelMatchesAll.length > 0)
            ? "Esistono segnali mezzo-autista ma cadono fuori dall'intervallo attivo."
            : "Nel perimetro attuale non emergono intersezioni temporali reali tra mezzo e autista.",
      bullets: [
        `Sessioni D10 nel periodo: ${sessionMatches.filteredItems.length}`,
        `Alert D10 nel periodo: ${alertMatches.filteredItems.length}`,
        `Focus D10 nel periodo: ${focusMatches.filteredItems.length}`,
        `Rifornimenti D04 nel periodo: ${refuelMatches.filteredItems.length}`,
        `Conferme badge nel periodo: ${strongOperationalMatchesPeriod + refuelMatchCountsPeriod.forti}`,
        `Conferme da nome esatto nel periodo: ${plausibleOperationalMatchesPeriod + refuelMatchCountsPeriod.plausibili}`,
      ],
      notes: [
        latestCombinedSession
          ? `Ultimo segnale operativo nel periodo sul mezzo ${vehicleResult.report.mezzoTarga}.`
          : "",
        latestCombinedRefuel
          ? `Ultimo rifornimento combinato nel periodo: ${latestCombinedRefuel.dataLabel ?? latestCombinedRefuel.dataDisplay ?? "data non disponibile"}.`
          : "",
      ],
      period: intersezionePeriodMeta,
    }),
    createSection({
      id: "vista-mezzo",
      title: "Vista mezzo nel periodo",
      status: vehicleResult.report.sections.some((entry) => entry.status === "completa")
        ? "completa"
        : vehicleResult.report.sections.some((entry) => entry.status === "parziale")
          ? "parziale"
          : "vuota",
      summary:
        "Riepilogo del report mezzo gia costruito con lo stesso periodo, mantenuto separato dalla sola intersezione mezzo-autista.",
      bullets: [
        `Lavori mezzo nel periodo: ${sumCardValues(vehicleResult.report.cards, "Lavori")}`,
        `Manutenzioni mezzo nel periodo: ${vehicleReportMaintenanceCount}`,
        `Rifornimenti mezzo nel periodo: ${sumCardValues(vehicleResult.report.cards, "Rifornimenti")}`,
        `Documenti/costi mezzo nel periodo: ${vehicleReportDocumentCount}`,
      ],
      notes: [
        "Questa sezione non dimostra da sola il legame con l'autista: riassume solo il contesto del mezzo.",
      ],
      period: reusedVehiclePeriodMeta,
    }),
    createSection({
      id: "vista-autista",
      title: "Vista autista nel periodo",
      status: driverResult.report.sections.some((entry) => entry.status === "completa")
        ? "completa"
        : driverResult.report.sections.some((entry) => entry.status === "parziale")
          ? "parziale"
          : "vuota",
      summary:
        "Riepilogo del report autista gia costruito con lo stesso periodo, mantenuto separato dalla sola intersezione col mezzo scelto.",
      bullets: [
        `Mezzi associati in anagrafica: ${driverResult.report.header.mezziAssociati}`,
        `Sessioni autista nel periodo: ${sumCardValues(driverResult.report.cards, "Sessioni attive")}`,
        `Alert/focus autista nel periodo: ${driverReportSignalsCount}`,
        `Rifornimenti collegati all'autista nel periodo: ${sumCardValues(driverResult.report.cards, "Rifornimenti collegati")}`,
      ],
      notes: [
        "Questa vista resta utile anche quando il legame col mezzo scelto e solo plausibile o non ancora dimostrabile.",
      ],
      period: reusedDriverPeriodMeta,
    }),
  ];

  const sources: InternalAiVehicleReportSource[] = [
    createSource({
      id: "facade-mezzo",
      title: "Facade report mezzo riusato",
      status: "disponibile",
      description:
        "Il report combinato riusa il facade read-only del report mezzo per evitare duplicazioni di logica nel clone.",
      datasetLabels: dedupe(vehicleResult.report.sources.flatMap((source) => source.datasetLabels)),
      countLabel: `${vehicleResult.report.sources.length} fonti mezzo`,
      notes: [
        `Periodo riusato: ${vehicleResult.report.periodContext.label}`,
      ],
      period: reusedVehiclePeriodMeta,
    }),
    createSource({
      id: "facade-autista",
      title: "Facade report autista riusato",
      status: "disponibile",
      description:
        "Il report combinato riusa il facade read-only del report autista per mantenere separati i due flussi base.",
      datasetLabels: dedupe(driverResult.report.sources.flatMap((source) => source.datasetLabels)),
      countLabel: `${driverResult.report.sources.length} fonti autista`,
      notes: [
        `Periodo riusato: ${driverResult.report.periodContext.label}`,
      ],
      period: reusedDriverPeriodMeta,
    }),
    createSource({
      id: "anagrafica-combinata",
      title: "Anagrafiche flotta e persone",
      status:
        reliability === "forte"
          ? "disponibile"
          : reliability === "plausibile"
            ? "parziale"
            : "parziale",
      description:
        "Fonte primaria per verificare se il mezzo espone un legame anagrafico leggibile verso l'autista selezionato, con priorita ad `autistaId`.",
      datasetLabels: ["storage/@mezzi_aziendali", "storage/@colleghi"],
      countLabel: exactAutistaIdMatch
        ? "legame forte da D01"
        : declaredNameMatch
          ? "legame plausibile da nome D01"
          : null,
      notes: [reliabilityReason],
      period: legamePeriodMeta,
    }),
    createSource({
      id: "centro-controllo-combinato",
      title: "Intersezione operativa D10",
      status:
        combinedSignalsInPeriod > 0
          ? "disponibile"
          : periodContext.appliesFilter && combinedSignalsAll > 0
            ? "parziale"
            : "parziale",
      description:
        "Sessioni, alert e focus del Centro Controllo sono filtrati sullo stesso mezzo e sullo stesso autista con priorita al badge.",
      datasetLabels: [...centroControlloSnapshot.logicalDatasets],
      countLabel: `${combinedSignalsInPeriod} segnali nel periodo`,
      notes: [
        "I record con badge incoerente non vengono considerati conferme anche se il nome coincide.",
        ...takeNotes(centroControlloSnapshot.limitations, 1),
      ],
      period: intersezionePeriodMeta,
    }),
    createSource({
      id: "rifornimenti-combinati",
      title: "Intersezione rifornimenti D04",
      status:
        refuelMatches.filteredItems.length > 0
          ? "disponibile"
          : periodContext.appliesFilter && refuelMatchesAll.length > 0
            ? "parziale"
            : "parziale",
      description:
        "Rifornimenti del mezzo filtrati sullo stesso autista tramite badge come chiave forte e nome solo come supporto prudente nel layer D04.",
      datasetLabels: [
        mezzoRefuelsSnapshot.activeReadOnlyDataset,
        ...mezzoRefuelsSnapshot.supportingReadOnlyDatasets,
      ],
      countLabel: `${refuelMatches.filteredItems.length} rifornimenti nel periodo`,
      notes: [
        "Il nome non supera mai un badge esplicitamente incoerente.",
        ...takeNotes(mezzoRefuelsSnapshot.limitations, 1),
      ],
      period: intersezionePeriodMeta,
    }),
  ];

  return {
    status: "ready",
    normalizedTarga,
    normalizedDriverQuery,
    message:
      `Anteprima combinata generata in sola lettura per ${normalizedTarga} + ${driverName} ` +
      `con periodo ${periodContext.label}.`,
    report: {
      reportType: "combinato",
      targetId: `${vehicleResult.report.targetId}::${driverResult.report.autistaId}`,
      targetLabel: `${vehicleResult.report.mezzoTarga} + ${driverName}`,
      mezzoTarga: vehicleResult.report.mezzoTarga,
      autistaId: driverResult.report.autistaId,
      title: `Anteprima report combinato ${vehicleResult.report.mezzoTarga} + ${driverName}`,
      subtitle:
        "Report combinato read-only che mantiene separati il contesto mezzo, il contesto autista e la sola intersezione realmente dimostrabile nel periodo.",
      generatedAt: new Date().toISOString(),
      header: {
        targa: vehicleResult.report.mezzoTarga,
        categoria: vehicleResult.report.header.categoria,
        marcaModello: vehicleResult.report.header.marcaModello,
        nomeCompletoAutista: driverName,
        badgeAutista: driverBadge,
        autistaDichiaratoSulMezzo: mezzo?.autistaNome ?? null,
        ultimoMezzoNotoAutista: driverResult.report.header.ultimoMezzoNoto,
        affidabilitaLegame: reliability,
        motivazioneLegame: reliabilityReason,
      },
      cards: [
        {
          label: "Affidabilita legame",
          value:
            reliability === "forte"
              ? "Forte"
              : reliability === "plausibile"
                ? "Plausibile"
                : "Non dimostrabile",
          meta: reliabilityReason,
          tone:
            reliability === "forte"
              ? "success"
              : reliability === "plausibile"
                ? "warning"
                : "warning",
        },
        {
          label: "Segnali D10 condivisi",
          value: String(combinedSignalsInPeriod),
          meta: `${sessionMatches.filteredItems.length} sessioni, ${alertMatches.filteredItems.length} alert, ${focusMatches.filteredItems.length} focus`,
          tone: combinedSignalsInPeriod > 0 ? "success" : "warning",
        },
        {
          label: "Rifornimenti in comune",
          value: String(refuelMatches.filteredItems.length),
          meta: latestCombinedRefuel?.dataLabel
            ? `Ultimo ${latestCombinedRefuel.dataLabel}`
            : "Nessun rifornimento in comune nel periodo",
          tone: refuelMatches.filteredItems.length > 0 ? "success" : "warning",
        },
        {
          label: "Copertura riusata",
          value: String(dedupe(sources.flatMap((source) => source.datasetLabels)).length),
          meta: `${vehicleResult.report.sources.length} fonti mezzo + ${driverResult.report.sources.length} fonti autista`,
          tone: "default",
        },
      ],
      periodContext: {
        ...periodContext,
        notes: [
          ...periodContext.notes,
          "Il report combinato applica il filtro periodo solo alle intersezioni D10/D04 e ai blocchi gia filtrati dei report mezzo/autista.",
          "L'affidabilita del legame segue una regola con priorita al badge: `autistaId` o badge coerente danno conferma forte, il nome resta solo supporto prudente.",
        ],
      },
      sections,
      missingData,
      evidences: [
        `Report mezzo riusato: ${vehicleResult.report.title}`,
        `Report autista riusato: ${driverResult.report.title}`,
        `Affidabilita legame: ${reliability}`,
        `Periodo attivo: ${periodContext.label}`,
        exactAutistaIdMatch
          ? "Conferma forte da anagrafica mezzo con autistaId."
          : strongCrossLayerMatchesAll > 0
            ? "Conferma forte da badge coerente nei segnali operativi o nei rifornimenti del mezzo."
            : "Nessuna conferma forte da autistaId o badge sul mezzo nel periodo letto.",
        latestCombinedSession
          ? `Segnale operativo combinato piu recente sul mezzo ${vehicleResult.report.mezzoTarga}.`
          : "Nessun segnale operativo combinato nel periodo attivo.",
        latestCombinedRefuel
          ? `Rifornimento combinato piu recente su ${latestCombinedRefuel.mezzoTarga}.`
          : "Nessun rifornimento combinato nel periodo attivo.",
      ],
      sources,
      previewState: previewStates.previewState,
      approvalState: previewStates.approvalState,
    },
  };
}
