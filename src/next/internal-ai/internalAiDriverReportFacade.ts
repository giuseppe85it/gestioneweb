import { readNextCentroControlloSnapshot } from "../domain/nextCentroControlloDomain";
import { readNextColleghiSnapshot, type NextCollegaReadOnlyItem } from "../domain/nextColleghiDomain";
import { readNextMezzoRifornimentiSnapshot, type NextRifornimentoReadOnlyItem } from "../domain/nextRifornimentiDomain";
import { readNextAnagraficheFlottaSnapshot } from "../nextAnagraficheFlottaDomain";
import {
  describeInternalAiPeriodApplication,
  filterItemsByInternalAiReportPeriod,
  resolveInternalAiReportPeriodContext,
} from "./internalAiReportPeriod";
import {
  matchInternalAiDriverLayerIdentity,
  matchInternalAiDriverVehicleIdentity,
  normalizeInternalAiDriverIdentityBadge,
  normalizeInternalAiDriverIdentityName,
  normalizeInternalAiDriverIdentityText,
  type InternalAiDriverCrossLayerMatch,
} from "./internalAiDriverIdentity";
import type {
  InternalAiApprovalState,
  InternalAiDriverLookupCandidate,
  InternalAiDriverReportPreview,
  InternalAiPreviewState,
  InternalAiReportPeriodContext,
  InternalAiReportPeriodInput,
  InternalAiReportPeriodSectionStatus,
  InternalAiVehicleReportSection,
  InternalAiVehicleReportSectionStatus,
  InternalAiVehicleReportSource,
  InternalAiVehicleReportSourceStatus,
} from "./internalAiTypes";

export type InternalAiDriverReportReadResult =
  | {
      status: "invalid_query" | "not_found";
      normalizedDriverQuery: string | null;
      message: string;
      report: null;
    }
  | {
      status: "ready";
      normalizedDriverQuery: string;
      message: string;
      report: InternalAiDriverReportPreview;
    };

type DriverVehicleAssociation = {
  id: string;
  targa: string;
  marcaModello: string | null;
  categoria: string;
  autistaNome: string | null;
  associationQuality: "certo" | "parziale";
  associationReason: "autista_id" | "nome_dichiarato";
};

type PeriodAwareMeta = {
  periodStatus: InternalAiReportPeriodSectionStatus;
  periodNote: string | null;
};

type DriverRefuelVehicleScope = {
  targhe: string[];
  associatedCount: number;
  observedCount: number;
  observedOnlyCount: number;
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

function findDriverRecord(
  items: NextCollegaReadOnlyItem[],
  candidate: InternalAiDriverLookupCandidate,
): NextCollegaReadOnlyItem | null {
  const candidateBadge = normalizeInternalAiDriverIdentityBadge(candidate.badge);
  const candidateName = normalizeInternalAiDriverIdentityName(candidate.nomeCompleto);
  const uniqueNameMatches = items.filter(
    (item) =>
      candidateName && normalizeInternalAiDriverIdentityName(item.nome) === candidateName,
  );

  return (
    items.find((item) => item.id === candidate.id) ??
    items.find(
      (item) =>
        candidateBadge &&
        normalizeInternalAiDriverIdentityBadge(item.badge) === candidateBadge,
    ) ??
    (uniqueNameMatches.length === 1 ? uniqueNameMatches[0] : null) ??
    null
  );
}

function buildAssociatedVehicles(
  candidate: InternalAiDriverLookupCandidate,
  snapshot: Awaited<ReturnType<typeof readNextAnagraficheFlottaSnapshot>>,
): DriverVehicleAssociation[] {
  const associations: DriverVehicleAssociation[] = [];

  snapshot.items.forEach((item) => {
    const match = matchInternalAiDriverVehicleIdentity({
      driver: {
        driverId: candidate.id,
        nomeCompleto: candidate.nomeCompleto,
      },
      layerIdentity: {
        autistaId: item.autistaId,
        autistaNome: item.autistaNome,
      },
    });
    if (!match.matched) {
      return;
    }

    if (match.reason === "autista_id" || match.reason === "nome_fallback") {
      associations.push({
        id: item.id,
        targa: item.targa,
        marcaModello: item.marcaModello || null,
        categoria: item.categoria,
        autistaNome: item.autistaNome,
        associationQuality: match.reason === "autista_id" ? "certo" : "parziale",
        associationReason:
          match.reason === "autista_id" ? "autista_id" : "nome_dichiarato",
      });
    }
  });

  return associations.sort((left, right) =>
    left.targa.localeCompare(right.targa, "it", { sensitivity: "base" }),
  );
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

function buildDriverRefuelVehicleScope(args: {
  associatedVehicles: DriverVehicleAssociation[];
  sessionVehicles: Array<string | null | undefined>;
  alertVehicles: Array<string | null | undefined>;
  focusVehicles: Array<string | null | undefined>;
}): DriverRefuelVehicleScope {
  const associated = new Set(
    args.associatedVehicles
      .map((vehicle) => normalizeInternalAiDriverIdentityText(vehicle.targa))
      .filter(Boolean),
  );
  const observed = new Set(
    [...args.sessionVehicles, ...args.alertVehicles, ...args.focusVehicles]
      .map((value) => normalizeInternalAiDriverIdentityText(value))
      .filter(Boolean),
  );
  const targhe = Array.from(new Set([...associated, ...observed])).sort((left, right) =>
    left.localeCompare(right, "it", { sensitivity: "base" }),
  );

  return {
    targhe,
    associatedCount: associated.size,
    observedCount: observed.size,
    observedOnlyCount: Array.from(observed).filter((targa) => !associated.has(targa)).length,
  };
}

function buildPreviewStates(args: {
  associatedVehiclesCount: number;
  sessionCount: number;
  matchedRefuelsCount: number;
}): Pick<InternalAiDriverReportPreview, "previewState" | "approvalState"> {
  const usefulCoverage =
    args.associatedVehiclesCount > 0 || args.sessionCount > 0 || args.matchedRefuelsCount > 0;

  const previewState: InternalAiPreviewState = {
    status: usefulCoverage ? "preview_ready" : "revision_requested",
    updatedAt: new Date().toISOString(),
    note: usefulCoverage
      ? "Anteprima autista costruita in sola lettura dai layer NEXT gia disponibili."
      : "Anteprima disponibile ma con copertura limitata; servono piu segnali leggibili per considerarla completa.",
  };

  const approvalState: InternalAiApprovalState = {
    status: usefulCoverage ? "awaiting_approval" : "revision_requested",
    requestedBy: "ia.interna.preview.autista",
    updatedAt: previewState.updatedAt,
    note: usefulCoverage
      ? "Report autista approvabile solo nel workflow mock del clone."
      : "Prima di considerarlo approvabile va chiarita la copertura dati del report autista.",
  };

  return { previewState, approvalState };
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

function mapSectionStatus(args: {
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

export async function readInternalAiDriverReportPreview(
  candidate: InternalAiDriverLookupCandidate | null,
  rawQuery: string,
  periodInput?: InternalAiReportPeriodInput,
): Promise<InternalAiDriverReportReadResult> {
  const normalizedDriverQuery = normalizeInternalAiDriverIdentityText(rawQuery);
  const periodBase = resolveInternalAiReportPeriodContext(periodInput);

  if (!normalizedDriverQuery) {
    return {
      status: "invalid_query",
      normalizedDriverQuery: normalizedDriverQuery || null,
      message: "Seleziona un autista reale oppure inserisci un nome o badge valido prima di avviare l'anteprima.",
      report: null,
    };
  }

  if (!periodBase.isValid) {
    return {
      status: "invalid_query",
      normalizedDriverQuery,
      message: "Il periodo selezionato non e valido. Controlla le date da e a prima di generare l'anteprima.",
      report: null,
    };
  }

  if (!candidate) {
    return {
      status: "not_found",
      normalizedDriverQuery,
      message: `Nessun autista reale trovato nel clone per ${normalizedDriverQuery}.`,
      report: null,
    };
  }

  const [colleghiSnapshot, flottaSnapshot, centroControlloSnapshot] = await Promise.all([
    readNextColleghiSnapshot(),
    readNextAnagraficheFlottaSnapshot(),
    readNextCentroControlloSnapshot(),
  ]);

  const driver = findDriverRecord(colleghiSnapshot.items, candidate);
  if (!driver) {
    return {
      status: "not_found",
      normalizedDriverQuery,
      message: `Nessun autista leggibile trovato nel clone per ${candidate.nomeCompleto}.`,
      report: null,
    };
  }

  const driverIdentity = {
    driverId: driver.id,
    badge: driver.badge,
    nomeCompleto: driver.nome,
  };
  const associatedVehicles = buildAssociatedVehicles(candidate, flottaSnapshot);
  const matchedDriverSessions = collectMatchedDriverRecords(
    centroControlloSnapshot.sessioni,
    (entry) => ({
      badgeAutista: entry.badgeAutista,
      nomeAutista: entry.nomeAutista,
    }),
    driverIdentity,
  );
  const matchedDriverAlerts = collectMatchedDriverRecords(
    centroControlloSnapshot.alerts,
    (entry) => ({
      badgeAutista: entry.badgeAutista,
      nomeAutista: entry.autistaNome,
    }),
    driverIdentity,
  );
  const matchedDriverFocusItems = collectMatchedDriverRecords(
    centroControlloSnapshot.focusItems,
    (entry) => ({
      badgeAutista: entry.badgeAutista,
      nomeAutista: entry.autistaNome,
    }),
    driverIdentity,
  );
  const driverSessions = matchedDriverSessions.map((entry) => entry.item);
  const driverAlerts = matchedDriverAlerts.map((entry) => entry.item);
  const driverFocusItems = matchedDriverFocusItems.map((entry) => entry.item);

  const refuelVehicleScope = buildDriverRefuelVehicleScope({
    associatedVehicles,
    sessionVehicles: driverSessions.flatMap((entry) => [entry.targaMotrice, entry.targaRimorchio]),
    alertVehicles: driverAlerts.map((entry) => entry.mezzoTarga),
    focusVehicles: driverFocusItems.map((entry) => entry.mezzoTarga),
  });
  const refuelSnapshots = await Promise.all(
    refuelVehicleScope.targhe.map((targa) => readNextMezzoRifornimentiSnapshot(targa)),
  );
  const matchedRefuelRecords = refuelSnapshots.flatMap((snapshot) =>
    collectMatchedDriverRecords(
      snapshot.items,
      (item) => ({
        badgeAutista: item.badgeAutista,
        autistaNome: item.autistaNome,
      }),
      driverIdentity,
    ),
  );
  const matchedRefuels = matchedRefuelRecords.map((entry) => entry.item);

  const refuelPeriod = filterItemsByInternalAiReportPeriod<NextRifornimentoReadOnlyItem>(
    matchedRefuels,
    (item) => item.timestampRicostruito,
    periodBase,
  );
  const refuelPeriodMeta = buildFilterablePeriodMeta({
    context: periodBase,
    noun: "rifornimenti autista",
    totalCount: refuelPeriod.totalCount,
    matchingCount: refuelPeriod.matchingCount,
    outsideRangeCount: refuelPeriod.outsideRangeCount,
    missingTimestampCount: refuelPeriod.missingTimestampCount,
  });

  const sessionPeriod = filterItemsByInternalAiReportPeriod(driverSessions, (item) => item.timestamp, periodBase);
  const alertPeriod = filterItemsByInternalAiReportPeriod(
    driverAlerts,
    (item) => item.eventTs ?? item.dueTs,
    periodBase,
  );
  const focusPeriod = filterItemsByInternalAiReportPeriod(driverFocusItems, (item) => item.eventTs, periodBase);
  const centroControlloPeriodMeta = buildFilterablePeriodMeta({
    context: periodBase,
    noun: "segnali operativi",
    totalCount: sessionPeriod.totalCount + alertPeriod.totalCount + focusPeriod.totalCount,
    matchingCount: sessionPeriod.matchingCount + alertPeriod.matchingCount + focusPeriod.matchingCount,
    outsideRangeCount:
      sessionPeriod.outsideRangeCount + alertPeriod.outsideRangeCount + focusPeriod.outsideRangeCount,
    missingTimestampCount:
      sessionPeriod.missingTimestampCount + alertPeriod.missingTimestampCount + focusPeriod.missingTimestampCount,
  });

  const filteredSessions = [...sessionPeriod.filteredItems].sort(
    (left, right) => (right.timestamp ?? 0) - (left.timestamp ?? 0),
  );
  const filteredAlerts = [...alertPeriod.filteredItems].sort(
    (left, right) => (right.eventTs ?? right.dueTs ?? 0) - (left.eventTs ?? left.dueTs ?? 0),
  );
  const filteredFocusItems = [...focusPeriod.filteredItems].sort(
    (left, right) => (right.eventTs ?? 0) - (left.eventTs ?? 0),
  );
  const sessionMatchCounts = countMatchedDriverRecordsByStrength(
    matchedDriverSessions,
    filteredSessions,
  );
  const alertMatchCounts = countMatchedDriverRecordsByStrength(
    matchedDriverAlerts,
    filteredAlerts,
  );
  const focusMatchCounts = countMatchedDriverRecordsByStrength(
    matchedDriverFocusItems,
    filteredFocusItems,
  );
  const refuelMatchCounts = countMatchedDriverRecordsByStrength(
    matchedRefuelRecords,
    refuelPeriod.filteredItems,
  );
  const strongOperationalMatches =
    sessionMatchCounts.forti + alertMatchCounts.forti + focusMatchCounts.forti;
  const plausibleOperationalMatches =
    sessionMatchCounts.plausibili +
    alertMatchCounts.plausibili +
    focusMatchCounts.plausibili;
  const latestSession = filteredSessions[0] ?? null;
  const latestRefuel = [...refuelPeriod.filteredItems].sort(
    (left, right) => (right.timestampRicostruito ?? 0) - (left.timestampRicostruito ?? 0),
  )[0] ?? null;

  const identitaPeriodMeta = buildStaticPeriodMeta(
    periodBase,
    "La scheda anagrafica autista non rappresenta eventi temporali filtrabili.",
  );
  const mezziPeriodMeta = buildStaticPeriodMeta(
    periodBase,
    "L'associazione mezzo-autista e mostrata come contesto anagrafico corrente, non come storico per periodo.",
  );
  const periodContext = withPeriodNotes(periodBase, [
    periodBase.appliesFilter
      ? "Filtro periodo applicato davvero a segnali operativi e rifornimenti collegabili all'autista."
      : "Il report mostra tutto lo storico disponibile delle sezioni temporali lette nel clone.",
    periodBase.appliesFilter
      ? "Dati base autista e mezzi associati restano visibili come contesto anagrafico non filtrabile."
      : "",
  ]);

  const missingData = [
    !driver.badge ? "Badge autista non valorizzato nell'anagrafica colleghi." : null,
    !driver.telefono ? "Telefono autista non presente nell'anagrafica colleghi." : null,
    associatedVehicles.length === 0
      ? "Nessun mezzo associato in modo leggibile all'autista nell'anagrafica flotta."
      : null,
    driverSessions.length === 0
      ? "Nessuna sessione attiva leggibile nel layer Centro Controllo per questo autista."
      : null,
    matchedRefuels.length === 0
      ? "Nessun rifornimento attribuibile all'autista con badge coerente o con nome esatto usato in assenza del badge nel perimetro letto."
      : null,
    periodBase.appliesFilter
      ? "Il filtro periodo non viene applicato ai dati base autista e ai mezzi associati, perche rappresentano contesto anagrafico corrente."
      : null,
  ].filter((entry): entry is string => Boolean(entry));

  const previewStates = buildPreviewStates({
    associatedVehiclesCount: associatedVehicles.length,
    sessionCount: filteredSessions.length,
    matchedRefuelsCount: refuelPeriod.filteredItems.length,
  });

  const sections: InternalAiVehicleReportSection[] = [
    createSection({
      id: "identita-autista",
      title: "Dati base autista",
      status: "completa",
      summary: "Anagrafica autista letta in sola lettura dal layer clone dei colleghi.",
      bullets: [
        `Nome: ${driver.nome}`,
        `Badge: ${driver.badge ?? "Non disponibile"}`,
        `Telefono: ${driver.telefono ?? "Non disponibile"}`,
        `Schede carburante: ${driver.schedeCarburante.length}`,
      ],
      notes: takeNotes(colleghiSnapshot.limitations),
      period: identitaPeriodMeta,
    }),
    createSection({
      id: "mezzi-associati",
      title: "Mezzi associati",
      status: associatedVehicles.length ? "completa" : "vuota",
      summary: associatedVehicles.length
        ? `Trovati ${associatedVehicles.length} mezzi collegati all'autista nel dominio anagrafico D01.`
        : "Nessun mezzo associato in modo leggibile all'autista nel layer anagrafico.",
      bullets: associatedVehicles.length
        ? associatedVehicles.slice(0, 6).map((vehicle) => {
            const reason =
              vehicle.associationReason === "autista_id"
                ? "conferma da autistaId"
                : "conferma da nome dichiarato sul mezzo";
            return `${vehicle.targa} - ${vehicle.marcaModello ?? vehicle.categoria} (${reason})`;
          })
        : ["Nessuna associazione mezzo disponibile."],
      notes: [
        "Il legame certo e dato da `autistaId`; il nome dichiarato sul mezzo resta una conferma solo parziale.",
      ],
      period: mezziPeriodMeta,
    }),
    createSection({
      id: "stato-operativo",
      title: "Stato operativo e ultimo mezzo noto",
      status: mapSectionStatus({
        visibleCount: filteredSessions.length + filteredAlerts.length + filteredFocusItems.length,
        availableCount: driverSessions.length + driverAlerts.length + driverFocusItems.length,
        context: periodBase,
      }),
      summary:
        filteredSessions.length || filteredAlerts.length || filteredFocusItems.length
          ? "Segnali operativi letti dal layer Centro Controllo nel periodo attivo."
          : periodBase.appliesFilter && (driverSessions.length || driverAlerts.length || driverFocusItems.length)
            ? "Nessun segnale operativo ricade nel periodo attivo, ma il layer Centro Controllo e disponibile."
            : "Nessun segnale operativo leggibile dal Centro Controllo per questo autista.",
      bullets: [
        `Sessioni attive: ${filteredSessions.length}`,
        `Ultimo mezzo noto: ${latestSession?.targaMotrice ?? latestSession?.targaRimorchio ?? "Non disponibile"}`,
        `Alert collegati: ${filteredAlerts.length}`,
        `Focus operativi: ${filteredFocusItems.length}`,
        `Conferme badge: ${strongOperationalMatches}`,
        `Conferme da nome esatto: ${plausibleOperationalMatches}`,
      ],
      notes: [
        ...takeNotes(centroControlloSnapshot.limitations, 2),
        "I segnali D10 usano badge come chiave forte; il nome entra solo se il badge manca davvero sul record o sul collega.",
        driverSessions.length === 0
          ? "Il layer D10 usa feed legacy normalizzati ma non li considera ancora canonici del dominio autisti."
          : null,
      ].filter((entry): entry is string => Boolean(entry)),
      period: centroControlloPeriodMeta,
    }),
    createSection({
      id: "rifornimenti-collegati",
      title: "Rifornimenti collegabili all'autista",
      status: mapSectionStatus({
        visibleCount: refuelPeriod.filteredItems.length,
        availableCount: matchedRefuels.length,
        context: periodBase,
      }),
      summary: refuelPeriod.filteredItems.length
        ? `Trovati ${refuelPeriod.filteredItems.length} rifornimenti collegabili all'autista nel periodo attivo.`
        : periodBase.appliesFilter && matchedRefuels.length > 0
          ? "Nessun rifornimento collegato ricade nel periodo attivo, ma il layer D04 e disponibile."
          : "Nessun rifornimento collegabile all'autista nel perimetro read-only usato dal clone.",
      bullets: [
        `Mezzi letti: ${refuelVehicleScope.targhe.length}`,
        `Mezzi da anagrafica: ${refuelVehicleScope.associatedCount}`,
        `Mezzi osservati nei segnali operativi: ${refuelVehicleScope.observedCount}`,
        `Conferme badge: ${refuelMatchCounts.forti}`,
        `Conferme da nome esatto: ${refuelMatchCounts.plausibili}`,
        `Rifornimenti con badge: ${refuelPeriod.filteredItems.filter((entry) => Boolean(entry.badgeAutista)).length}`,
        `Rifornimenti con costo: ${refuelPeriod.filteredItems.filter((entry) => entry.costo !== null).length}`,
        `Ultimo rifornimento: ${
          latestRefuel?.dataLabel ?? latestRefuel?.dataDisplay ?? "Non disponibile"
        }`,
      ],
      notes: [
        "Il collegamento usa il badge come chiave forte; il nome autista viene usato solo quando il badge manca davvero.",
        refuelVehicleScope.observedOnlyCount > 0
          ? `Inclusi anche ${refuelVehicleScope.observedOnlyCount} mezzi letti dai segnali D10 e non presenti nell'associazione anagrafica corrente.`
          : null,
        ...refuelSnapshots.flatMap((snapshot) => takeNotes(snapshot.limitations, 1)).slice(0, 2),
      ].filter((entry): entry is string => Boolean(entry)),
      period: refuelPeriodMeta,
    }),
  ];

  const sources: InternalAiVehicleReportSource[] = [
    createSource({
      id: "colleghi",
      title: "Anagrafica colleghi",
      status: "disponibile",
      description: "Fonte primaria per lookup e dati base autista del report.",
      datasetLabels: ["storage/@colleghi"],
      countLabel: "1 autista letto",
      notes: takeNotes(colleghiSnapshot.limitations, 2),
      period: identitaPeriodMeta,
    }),
    createSource({
      id: "flotta",
      title: "Anagrafica flotta",
      status: associatedVehicles.length ? "disponibile" : "parziale",
      description:
        "Fonte secondaria per ricostruire i mezzi associati all'autista con priorita ad `autistaId` e uso prudente del nome dichiarato solo in assenza del riferimento forte.",
      datasetLabels: ["storage/@mezzi_aziendali", "storage/@colleghi"],
      countLabel: `${associatedVehicles.length} mezzi`,
      notes: [
        "Il clone riusa il layer D01 delle anagrafiche; nessuna lettura raw in pagina.",
      ],
      period: mezziPeriodMeta,
    }),
    createSource({
      id: "centro-controllo",
      title: "Segnali operativi Centro Controllo",
      status: mapSourceStatus({
        visibleCount: filteredSessions.length + filteredAlerts.length + filteredFocusItems.length,
        availableCount: driverSessions.length + driverAlerts.length + driverFocusItems.length,
        context: periodBase,
      }),
      description:
        "Ultimo mezzo noto, sessioni e alert derivano dal layer D10 gia presente nel clone, basato su feed legacy normalizzati.",
      datasetLabels: [...centroControlloSnapshot.logicalDatasets],
      countLabel: `${filteredSessions.length} sessioni, ${filteredAlerts.length} alert, ${filteredFocusItems.length} focus`,
      notes: [
        "Priorita al badge sui segnali D10; il nome viene usato solo come confronto esatto in assenza del badge.",
        ...takeNotes(centroControlloSnapshot.limitations, 2),
      ],
      period: centroControlloPeriodMeta,
    }),
    createSource({
      id: "rifornimenti",
      title: "Rifornimenti read-only",
      status: mapSourceStatus({
        visibleCount: refuelPeriod.filteredItems.length,
        availableCount: matchedRefuels.length,
        context: periodBase,
      }),
      description:
        "Rifornimenti letti dai layer D04 dei mezzi associati o osservati nei segnali D10 dello stesso autista, poi filtrati con priorita al badge e uso prudente del nome esatto.",
      datasetLabels: ["storage/@rifornimenti", "storage/@rifornimenti_autisti_tmp"],
      countLabel: `${refuelPeriod.filteredItems.length} rifornimenti nel periodo`,
      notes: [
        "I record con badge esplicitamente incoerente non vengono considerati conferme anche se il nome coincide.",
      ],
      period: refuelPeriodMeta,
    }),
  ];

  return {
    status: "ready",
    normalizedDriverQuery,
    message: `Anteprima report generata in sola lettura per l'autista ${driver.nome} con periodo ${periodContext.label}.`,
    report: {
      reportType: "autista",
      targetId: driver.id,
      targetLabel: driver.nome,
      autistaId: driver.id,
      title: `Anteprima report autista ${driver.nome}`,
      subtitle:
        "Report autista costruito in sola lettura dai layer NEXT gia disponibili, con contesto periodo esplicito e senza scritture.",
      generatedAt: new Date().toISOString(),
      header: {
        nomeCompleto: driver.nome,
        badge: driver.badge,
        telefono: driver.telefono,
        telefonoPrivato: driver.telefonoPrivato,
        codice: driver.codice,
        descrizione: driver.descrizione,
        schedeCarburante: driver.schedeCarburante.length,
        mezziAssociati: associatedVehicles.length,
        ultimoMezzoNoto:
          latestSession?.targaMotrice ?? latestSession?.targaRimorchio ?? latestRefuel?.mezzoTarga ?? null,
        sessioneAttiva: Boolean(latestSession),
      },
      cards: [
        {
          label: "Mezzi associati",
          value: String(associatedVehicles.length),
          meta: associatedVehicles.length
            ? associatedVehicles.slice(0, 2).map((entry) => entry.targa).join(", ")
            : "Nessun mezzo associato leggibile",
          tone: associatedVehicles.length ? "success" : "warning",
        },
        {
          label: "Sessioni attive",
          value: String(filteredSessions.length),
          meta: latestSession?.statoSessione ?? "Nessuna sessione nel periodo",
          tone: filteredSessions.length ? "success" : "warning",
        },
        {
          label: "Alert e focus",
          value: String(filteredAlerts.length + filteredFocusItems.length),
          meta: `${filteredAlerts.length} alert, ${filteredFocusItems.length} focus`,
          tone: filteredAlerts.length + filteredFocusItems.length ? "warning" : "default",
        },
        {
          label: "Rifornimenti collegati",
          value: String(refuelPeriod.filteredItems.length),
          meta: latestRefuel?.mezzoTarga
            ? `Ultimo su ${latestRefuel.mezzoTarga}`
            : "Nessun rifornimento nel periodo",
          tone: refuelPeriod.filteredItems.length ? "success" : "warning",
        },
      ],
      periodContext,
      sections,
      missingData,
      evidences: [
        "Lookup autista da storage/@colleghi",
        "Mezzi associati letti da storage/@mezzi_aziendali",
        refuelVehicleScope.observedOnlyCount > 0
          ? `Esteso il perimetro rifornimenti con ${refuelVehicleScope.observedOnlyCount} mezzi osservati dal Centro Controllo`
          : "Perimetro rifornimenti basato sui mezzi associati e sui segnali operativi letti nel clone",
        `Periodo attivo: ${periodContext.label}`,
        latestSession
          ? `Ultimo mezzo noto dal Centro Controllo: ${latestSession.targaMotrice ?? latestSession.targaRimorchio ?? "-"}`
          : "Nessuna sessione attiva letta nel periodo dal Centro Controllo",
        latestRefuel?.mezzoTarga
          ? `Ultimo rifornimento collegato su ${latestRefuel.mezzoTarga}`
          : "Nessun rifornimento collegato all'autista nel periodo attivo",
      ],
      sources,
      previewState: previewStates.previewState,
      approvalState: previewStates.approvalState,
    },
  };
}
