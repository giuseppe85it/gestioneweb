import {
  type AlertMetaType,
  type AlertsState,
  parseAlertsState,
} from "../../utils/alertsState";
import { readNextUnifiedStorageDocument } from "./nextUnifiedReadRegistryDomain";

const ALERTS_STATE_KEY = "@alerts_state" as const;

export const NEXT_ALERTS_STATE_DOMAIN = {
  code: "D14-IA-ALERTS-STATE",
  name: "Stato notifiche e alert salvato",
  logicalDatasets: [ALERTS_STATE_KEY] as const,
  activeReadOnlyDataset: ALERTS_STATE_KEY,
  normalizationStrategy: "LAYER NEXT READ-ONLY SU storage/@alerts_state",
} as const;

export type NextAlertsStateQuality = "certo" | "parziale" | "da_verificare";

export type NextAlertsStateItem = {
  id: string;
  ackAt: number | null;
  ackAtLabel: string | null;
  snoozeUntil: number | null;
  snoozeUntilLabel: string | null;
  lastShownAt: number | null;
  lastShownAtLabel: string | null;
  meta: {
    type: AlertMetaType;
    ref: string;
  };
  isAcked: boolean;
  isSnoozed: boolean;
  isActive: boolean;
  sourceCollection: "storage";
  sourceKey: typeof ALERTS_STATE_KEY;
  quality: NextAlertsStateQuality;
  flags: string[];
};

export type NextAlertsStateSnapshot = {
  domainCode: typeof NEXT_ALERTS_STATE_DOMAIN.code;
  domainName: typeof NEXT_ALERTS_STATE_DOMAIN.name;
  logicalDatasets: readonly string[];
  activeReadOnlyDataset: typeof NEXT_ALERTS_STATE_DOMAIN.activeReadOnlyDataset;
  normalizationStrategy: typeof NEXT_ALERTS_STATE_DOMAIN.normalizationStrategy;
  sourceStatus: "ready" | "missing" | "error";
  sourceId: string;
  version: AlertsState["version"];
  items: NextAlertsStateItem[];
  counts: {
    total: number;
    acked: number;
    snoozed: number;
    active: number;
    byType: Record<AlertMetaType, number>;
  };
  limitations: string[];
};

export type ReadNextAlertsStateOptions = {
  now?: number;
};

function formatTimestamp(timestamp: number | null): string | null {
  if (timestamp === null) return null;
  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function deriveQuality(flags: string[]): NextAlertsStateQuality {
  if (flags.length === 0) return "certo";
  return flags.length === 1 ? "parziale" : "da_verificare";
}

function mapAlertStateItem(args: {
  id: string;
  item: AlertsState["items"][string];
  now: number;
}): NextAlertsStateItem {
  const { id, item, now } = args;
  const isAcked = item.ackAt !== null;
  const isSnoozed = item.snoozeUntil !== null && item.snoozeUntil > now;
  const flags: string[] = [];

  if (!item.meta.ref) flags.push("meta_ref_assente");
  if (item.lastShownAt === null) flags.push("last_shown_at_assente");

  return {
    id,
    ackAt: item.ackAt,
    ackAtLabel: formatTimestamp(item.ackAt),
    snoozeUntil: item.snoozeUntil,
    snoozeUntilLabel: formatTimestamp(item.snoozeUntil),
    lastShownAt: item.lastShownAt,
    lastShownAtLabel: formatTimestamp(item.lastShownAt),
    meta: item.meta,
    isAcked,
    isSnoozed,
    isActive: !isAcked && !isSnoozed,
    sourceCollection: "storage",
    sourceKey: ALERTS_STATE_KEY,
    quality: deriveQuality(flags),
    flags,
  };
}

export async function readNextAlertsStateSnapshot(
  options: ReadNextAlertsStateOptions = {},
): Promise<NextAlertsStateSnapshot> {
  const now = options.now ?? Date.now();
  const readResult = await readNextUnifiedStorageDocument({ key: ALERTS_STATE_KEY });
  const state = parseAlertsState(readResult.rawDocument);
  const items = Object.entries(state.items)
    .map(([id, item]) => mapAlertStateItem({ id, item, now }))
    .sort((left, right) => {
      const timeDelta = (right.lastShownAt ?? 0) - (left.lastShownAt ?? 0);
      if (timeDelta !== 0) return timeDelta;
      return left.id.localeCompare(right.id, "it", { sensitivity: "base" });
    });

  return {
    domainCode: NEXT_ALERTS_STATE_DOMAIN.code,
    domainName: NEXT_ALERTS_STATE_DOMAIN.name,
    logicalDatasets: NEXT_ALERTS_STATE_DOMAIN.logicalDatasets,
    activeReadOnlyDataset: NEXT_ALERTS_STATE_DOMAIN.activeReadOnlyDataset,
    normalizationStrategy: NEXT_ALERTS_STATE_DOMAIN.normalizationStrategy,
    sourceStatus: readResult.status,
    sourceId: readResult.sourceId,
    version: state.version,
    items,
    counts: {
      total: items.length,
      acked: items.filter((item) => item.isAcked).length,
      snoozed: items.filter((item) => item.isSnoozed).length,
      active: items.filter((item) => item.isActive).length,
      byType: {
        revisione: items.filter((item) => item.meta.type === "revisione").length,
        segnalazione: items.filter((item) => item.meta.type === "segnalazione").length,
        conflitto: items.filter((item) => item.meta.type === "conflitto").length,
      },
    },
    limitations: [
      ...readResult.notes,
      readResult.status !== "ready"
        ? "Lo stato alert non e disponibile: il reader restituisce una lista vuota normalizzata."
        : null,
      "Il reader espone solo ack/snooze/lastShown salvati: non ricalcola la lista alert operativa.",
    ].filter((entry): entry is string => Boolean(entry)),
  };
}
