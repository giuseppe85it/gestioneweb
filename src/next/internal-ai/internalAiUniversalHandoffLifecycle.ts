import type {
  InternalAiUniversalHandoffConsumptionEntry,
  InternalAiUniversalHandoffConsumptionStatus,
  InternalAiUniversalHandoffPayload,
} from "./internalAiUniversalTypes";

const HANDOFF_STATUS_RANK: Record<InternalAiUniversalHandoffConsumptionStatus, number> = {
  creato: 0,
  instradato: 1,
  letto_dal_modulo: 2,
  prefill_applicato: 3,
  da_verificare: 4,
  errore: 5,
  completato: 6,
};

function buildHistoryEntry(args: {
  status: InternalAiUniversalHandoffConsumptionStatus;
  at: string;
  moduleId?: string | null;
  routePath?: string | null;
  note?: string | null;
}): InternalAiUniversalHandoffConsumptionEntry {
  return {
    status: args.status,
    at: args.at,
    moduleId: args.moduleId ?? null,
    routePath: args.routePath ?? null,
    note: args.note ?? null,
  };
}

function sortHistory(entries: InternalAiUniversalHandoffConsumptionEntry[]) {
  return [...entries].sort((left, right) => left.at.localeCompare(right.at));
}

function dedupeHistory(
  entries: InternalAiUniversalHandoffConsumptionEntry[],
): InternalAiUniversalHandoffConsumptionEntry[] {
  const seen = new Set<string>();

  return sortHistory(entries).filter((entry) => {
    const key = [
      entry.status,
      entry.at,
      entry.moduleId ?? "",
      entry.routePath ?? "",
      entry.note ?? "",
    ].join("|");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function hasLifecycleFields(
  payload: InternalAiUniversalHandoffPayload,
): payload is InternalAiUniversalHandoffPayload &
  Required<
    Pick<
      InternalAiUniversalHandoffPayload,
      | "statoConsumo"
      | "ultimoModuloConsumatore"
      | "ultimoPathConsumatore"
      | "ultimoAggiornamento"
      | "cronologiaConsumo"
    >
  > {
  return Array.isArray(payload.cronologiaConsumo) && typeof payload.ultimoAggiornamento === "string";
}

export function ensureInternalAiUniversalHandoffPayload(
  payload: InternalAiUniversalHandoffPayload,
): InternalAiUniversalHandoffPayload {
  if (hasLifecycleFields(payload)) {
    return {
      ...payload,
      cronologiaConsumo: dedupeHistory(payload.cronologiaConsumo),
    };
  }

  const fallbackAt = new Date().toISOString();
  const basePayload = payload as InternalAiUniversalHandoffPayload;
  return {
    ...basePayload,
    statoConsumo: "creato",
    ultimoModuloConsumatore: null,
    ultimoPathConsumatore: null,
    ultimoAggiornamento: fallbackAt,
    cronologiaConsumo: [
      buildHistoryEntry({
        status: "creato",
        at: fallbackAt,
        note: "Payload creato prima dell'introduzione del tracciamento lifecycle.",
      }),
    ],
  };
}

export function buildInitialInternalAiUniversalHandoffLifecycle(args?: {
  note?: string | null;
}): Pick<
  InternalAiUniversalHandoffPayload,
  | "statoConsumo"
  | "ultimoModuloConsumatore"
  | "ultimoPathConsumatore"
  | "ultimoAggiornamento"
  | "cronologiaConsumo"
> {
  const at = new Date().toISOString();
  return {
    statoConsumo: "creato",
    ultimoModuloConsumatore: null,
    ultimoPathConsumatore: null,
    ultimoAggiornamento: at,
    cronologiaConsumo: [
      buildHistoryEntry({
        status: "creato",
        at,
        note: args?.note ?? "Payload standard creato dal gateway universale.",
      }),
    ],
  };
}

export function mergeInternalAiUniversalHandoffPayload(
  current: InternalAiUniversalHandoffPayload,
  incoming: InternalAiUniversalHandoffPayload,
): InternalAiUniversalHandoffPayload {
  const normalizedCurrent = ensureInternalAiUniversalHandoffPayload(current);
  const normalizedIncoming = ensureInternalAiUniversalHandoffPayload(incoming);
  const currentRank = HANDOFF_STATUS_RANK[normalizedCurrent.statoConsumo];
  const incomingRank = HANDOFF_STATUS_RANK[normalizedIncoming.statoConsumo];
  const lifecycleOwner =
    incomingRank > currentRank ||
    (incomingRank === currentRank &&
      normalizedIncoming.ultimoAggiornamento.localeCompare(normalizedCurrent.ultimoAggiornamento) > 0)
      ? normalizedIncoming
      : normalizedCurrent;

  return {
    ...normalizedCurrent,
    ...normalizedIncoming,
    statoConsumo: lifecycleOwner.statoConsumo,
    ultimoModuloConsumatore: lifecycleOwner.ultimoModuloConsumatore,
    ultimoPathConsumatore: lifecycleOwner.ultimoPathConsumatore,
    ultimoAggiornamento: lifecycleOwner.ultimoAggiornamento,
    cronologiaConsumo: dedupeHistory([
      ...normalizedCurrent.cronologiaConsumo,
      ...normalizedIncoming.cronologiaConsumo,
    ]),
  };
}

export function applyInternalAiUniversalHandoffLifecycleUpdate(
  payload: InternalAiUniversalHandoffPayload,
  args: {
    status: InternalAiUniversalHandoffConsumptionStatus;
    moduleId?: string | null;
    routePath?: string | null;
    note?: string | null;
  },
): InternalAiUniversalHandoffPayload {
  const normalized = ensureInternalAiUniversalHandoffPayload(payload);
  const at = new Date().toISOString();
  const lastEntry = normalized.cronologiaConsumo[normalized.cronologiaConsumo.length - 1] ?? null;
  const moduleId = args.moduleId ?? normalized.ultimoModuloConsumatore ?? null;
  const routePath = args.routePath ?? normalized.ultimoPathConsumatore ?? null;
  const note = args.note ?? null;

  const nextEntry = buildHistoryEntry({
    status: args.status,
    at,
    moduleId,
    routePath,
    note,
  });

  const shouldAppendEntry =
    !lastEntry ||
    lastEntry.status !== nextEntry.status ||
    lastEntry.moduleId !== nextEntry.moduleId ||
    lastEntry.routePath !== nextEntry.routePath ||
    lastEntry.note !== nextEntry.note;

  const nextRank = HANDOFF_STATUS_RANK[args.status];
  const currentRank = HANDOFF_STATUS_RANK[normalized.statoConsumo];
  const nextStatus = nextRank >= currentRank ? args.status : normalized.statoConsumo;

  return {
    ...normalized,
    statoConsumo: nextStatus,
    ultimoModuloConsumatore: moduleId,
    ultimoPathConsumatore: routePath,
    ultimoAggiornamento: at,
    cronologiaConsumo: shouldAppendEntry
      ? dedupeHistory([...normalized.cronologiaConsumo, nextEntry]).slice(-24)
      : normalized.cronologiaConsumo,
  };
}
