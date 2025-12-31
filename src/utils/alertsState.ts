export type AlertMetaType = "revisione" | "segnalazione" | "conflitto";

export type AlertMeta = {
  type: AlertMetaType;
  ref: string;
};

export type AlertStateItem = {
  ackAt: number | null;
  snoozeUntil: number | null;
  lastShownAt: number | null;
  meta: AlertMeta;
};

export type AlertsState = {
  version: 1;
  items: Record<string, AlertStateItem>;
};

export const ALERTS_STATE_VERSION = 1 as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const PRUNE_AFTER_MS = 90 * DAY_MS;

function toNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isMetaType(value: unknown): value is AlertMetaType {
  return value === "revisione" || value === "segnalazione" || value === "conflitto";
}

export function createEmptyAlertsState(): AlertsState {
  return { version: ALERTS_STATE_VERSION, items: {} };
}

export function normalizeTargaForAlertId(value: string | null | undefined): string {
  return String(value ?? "").toUpperCase().replace(/\s+/g, "").trim();
}

export function stableHash32(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

export function parseAlertsState(raw: unknown): AlertsState {
  if (!raw || typeof raw !== "object") return createEmptyAlertsState();
  const rec = raw as Record<string, unknown>;
  if (rec.version !== ALERTS_STATE_VERSION) return createEmptyAlertsState();
  const itemsRaw = rec.items;
  if (!itemsRaw || typeof itemsRaw !== "object") return createEmptyAlertsState();

  const items: Record<string, AlertStateItem> = {};
  for (const [alertId, itemRaw] of Object.entries(itemsRaw as Record<string, unknown>)) {
    if (!itemRaw || typeof itemRaw !== "object") continue;
    const itemRec = itemRaw as Record<string, unknown>;
    const metaRaw = itemRec.meta;
    if (!metaRaw || typeof metaRaw !== "object") continue;
    const metaRec = metaRaw as Record<string, unknown>;
    if (!isMetaType(metaRec.type)) continue;
    const ref = typeof metaRec.ref === "string" ? metaRec.ref : String(metaRec.ref ?? "");

    items[alertId] = {
      ackAt: toNullableNumber(itemRec.ackAt),
      snoozeUntil: toNullableNumber(itemRec.snoozeUntil),
      lastShownAt: toNullableNumber(itemRec.lastShownAt),
      meta: { type: metaRec.type, ref },
    };
  }

  return { version: ALERTS_STATE_VERSION, items };
}

export function isMetaChanged(prev: AlertMeta | null | undefined, next: AlertMeta): boolean {
  if (!prev) return true;
  return prev.type !== next.type || prev.ref !== next.ref;
}

export function pruneAlertsState(
  state: AlertsState,
  now: number,
  candidateAlertIds?: Set<string>
): { state: AlertsState; didChange: boolean } {
  const threshold = now - PRUNE_AFTER_MS;
  let didChange = false;
  const nextItems: Record<string, AlertStateItem> = { ...state.items };

  for (const [alertId, item] of Object.entries(nextItems)) {
    const snoozeAt = item.snoozeUntil ?? 0;
    const ackAt = item.ackAt ?? 0;
    if (snoozeAt < threshold && ackAt < threshold) {
      delete nextItems[alertId];
      didChange = true;
      continue;
    }

    if (candidateAlertIds && !candidateAlertIds.has(alertId)) {
      const lastSeen = item.lastShownAt ?? 0;
      if (lastSeen > 0 && lastSeen < threshold) {
        delete nextItems[alertId];
        didChange = true;
      }
    }
  }

  if (!didChange) return { state, didChange: false };
  return { state: { ...state, items: nextItems }, didChange: true };
}

export type AlertAction = "snooze_1d" | "snooze_3d" | "ack";

export function applyAlertAction(
  prev: AlertsState,
  alertId: string,
  meta: AlertMeta,
  action: AlertAction,
  now: number
): AlertsState {
  const next: AlertsState = { version: ALERTS_STATE_VERSION, items: { ...prev.items } };
  const base: AlertStateItem = next.items[alertId] ?? {
    ackAt: null,
    snoozeUntil: null,
    lastShownAt: null,
    meta,
  };

  const nextItem: AlertStateItem = {
    ackAt: action === "ack" ? now : null,
    snoozeUntil:
      action === "snooze_1d"
        ? now + DAY_MS
        : action === "snooze_3d"
        ? now + 3 * DAY_MS
        : null,
    lastShownAt: now,
    meta,
  };

  if (base.meta && !isMetaChanged(base.meta, meta)) {
    nextItem.meta = base.meta;
  }

  next.items[alertId] = nextItem;
  return next;
}

