import {
  createEmptyAlertsState,
  isMetaChanged,
  normalizeTargaForAlertId,
  parseAlertsState,
  pruneAlertsState,
  stableHash32,
  type AlertMeta,
  type AlertsState,
} from "../../utils/alertsState";
import { formatDateTimeUI, formatDateUI } from "../../utils/dateFormat";
import { getItemSync } from "../../utils/storageSync";
import { normalizeNextMezzoTarga } from "../nextAnagraficheFlottaDomain";

const ALERTS_STATE_KEY = "@alerts_state";
const MEZZI_KEY = "@mezzi_aziendali";
const SESSIONI_KEY = "@autisti_sessione_attive";
const SEGNALAZIONI_KEY = "@segnalazioni_autisti_tmp";
const CONTROLLI_KEY = "@controlli_mezzo_autisti";
const DAY_MS = 24 * 60 * 60 * 1000;

type MezzoRecord = Record<string, unknown>;
type SessioneRecord = Record<string, unknown>;
type SegnalazioneRecord = Record<string, unknown>;
type ControlloRecord = Record<string, unknown>;

export const NEXT_STATO_OPERATIVO_DOMAIN = {
  code: "D10",
  name: "Stato operativo, alert e promemoria",
  logicalDatasets: [
    ALERTS_STATE_KEY,
    MEZZI_KEY,
    SESSIONI_KEY,
    SEGNALAZIONI_KEY,
    CONTROLLI_KEY,
  ] as const,
  allowedAlertKinds: ["revisione", "conflitto_sessione", "segnalazione_nuova"] as const,
  allowedFocusKinds: ["controllo_ko", "mezzo_incompleto"] as const,
} as const;

export type D10Severity = "danger" | "warning" | "info";
export type D10Quality = "source_direct" | "derived_acceptable" | "excluded_from_v1";
export type D10AlertKind =
  (typeof NEXT_STATO_OPERATIVO_DOMAIN.allowedAlertKinds)[number];
export type D10FocusKind =
  (typeof NEXT_STATO_OPERATIVO_DOMAIN.allowedFocusKinds)[number];
export type D10TargetRouteKind = "dossier" | "mezzi" | "none";

export type D10AlertItem = {
  id: string;
  kind: D10AlertKind;
  title: string;
  detailText: string;
  severity: D10Severity;
  quality: D10Quality;
  mezzoTarga: string | null;
  autistaNome: string | null;
  badgeAutista: string | null;
  eventTs: number | null;
  dueTs: number | null;
  dateLabel: string | null;
  sourceDataset: string;
  sourceRecordId: string | null;
  targetRouteKind: D10TargetRouteKind;
  ackAt: number | null;
  snoozeUntil: number | null;
  lastShownAt: number | null;
};

export type D10FocusItem = {
  id: string;
  kind: D10FocusKind;
  title: string;
  detailText: string;
  severity: D10Severity;
  quality: D10Quality;
  mezzoTarga: string | null;
  autistaNome: string | null;
  badgeAutista: string | null;
  eventTs: number | null;
  dateLabel: string | null;
  sourceDataset: string;
  sourceRecordId: string | null;
  targetRouteKind: D10TargetRouteKind;
};

export type D10Snapshot = {
  domainCode: typeof NEXT_STATO_OPERATIVO_DOMAIN.code;
  domainName: typeof NEXT_STATO_OPERATIVO_DOMAIN.name;
  generatedAt: number;
  logicalDatasets: readonly string[];
  counters: {
    alertsVisible: number;
    revisioniScadute: number;
    revisioniInScadenza: number;
    conflittiSessione: number;
    segnalazioniNuove: number;
    controlliKo: number;
  };
  alerts: D10AlertItem[];
  focusItems: D10FocusItem[];
  limitations: string[];
};

type D10BuildInput = {
  alertsStateRaw: unknown;
  mezziRaw: unknown;
  sessioniRaw: unknown;
  segnalazioniRaw: unknown;
  controlliRaw: unknown;
  now?: number;
};

type BaseAlertCandidate = Omit<
  D10AlertItem,
  "ackAt" | "snoozeUntil" | "lastShownAt"
> & {
  meta: AlertMeta;
  sortBucket: number;
  sortValue: number;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeFreeText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxLen: number): string {
  if (value.length <= maxLen) return value;
  const sliceLen = Math.max(0, maxLen - 3);
  return `${value.slice(0, sliceLen).trimEnd()}...`;
}

function parseDateFlexible(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value > 1_000_000_000_000 ? value : value * 1000;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "object" && value !== null) {
    const maybe = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };

    if (typeof maybe.toDate === "function") {
      const date = maybe.toDate();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
    }

    if (typeof maybe.seconds === "number") {
      const date = new Date(maybe.seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof maybe._seconds === "number") {
      const date = new Date(maybe._seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  const isoLike = Date.parse(raw);
  if (!Number.isNaN(isoLike)) return new Date(isoLike);

  const dmyMatch = raw.match(/^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})$/);
  if (dmyMatch) {
    const yearRaw = Number(dmyMatch[3]);
    const year = dmyMatch[3].length === 2 ? Number(`20${yearRaw}`) : yearRaw;
    const month = Number(dmyMatch[2]) - 1;
    const day = Number(dmyMatch[1]);
    const date = new Date(year, month, day, 12, 0, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function toTimestamp(value: unknown): number | null {
  const parsed = parseDateFlexible(value);
  return parsed ? parsed.getTime() : null;
}

function formatDateLabel(ts: number | null): string | null {
  return ts === null ? null : formatDateUI(ts);
}

function formatDateTimeLabel(ts: number | null): string | null {
  return ts === null ? null : formatDateTimeUI(ts);
}

function formatGiorniLabel(days: number): string {
  if (days === 0) return "oggi";
  const abs = Math.abs(days);
  const base = abs === 1 ? "1 giorno" : `${abs} giorni`;
  return days < 0 ? `${base} fa` : `tra ${base}`;
}

function giorniDaOggi(target: Date | null, now: number): number | null {
  if (!target) return null;
  const today = new Date(now);
  const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const utcTarget = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((utcTarget - utcToday) / DAY_MS);
}

function calcolaProssimaRevisione(
  dataImmatricolazione: Date | null,
  dataUltimoCollaudo: Date | null,
  now: number
): Date | null {
  if (!dataImmatricolazione) {
    return dataUltimoCollaudo ? new Date(dataUltimoCollaudo) : null;
  }

  const immDate = new Date(dataImmatricolazione);
  immDate.setHours(12, 0, 0, 0);

  const today = new Date(now);
  today.setHours(12, 0, 0, 0);

  const firstRevision = new Date(immDate);
  firstRevision.setFullYear(firstRevision.getFullYear() + 4);

  if (!dataUltimoCollaudo) {
    if (firstRevision > today) return firstRevision;

    const afterFirst = new Date(firstRevision);
    while (afterFirst <= today) {
      afterFirst.setFullYear(afterFirst.getFullYear() + 2);
    }
    return afterFirst;
  }

  const lastCollaudo = new Date(dataUltimoCollaudo);
  lastCollaudo.setHours(12, 0, 0, 0);

  const nextFromCollaudo = new Date(lastCollaudo);
  nextFromCollaudo.setFullYear(nextFromCollaudo.getFullYear() + 2);

  const nextFromImmatricolazione = new Date(immDate);
  while (nextFromImmatricolazione <= today) {
    nextFromImmatricolazione.setFullYear(nextFromImmatricolazione.getFullYear() + 2);
  }

  return nextFromCollaudo > nextFromImmatricolazione
    ? nextFromCollaudo
    : nextFromImmatricolazione;
}

function unwrapArrayValue(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];

  const record = raw as Record<string, unknown>;
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.value)) return record.value;

  if (record.value && typeof record.value === "object") {
    const nested = record.value as Record<string, unknown>;
    if (Array.isArray(nested.items)) return nested.items;
  }

  return [];
}

function unwrapObjectValue(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as Record<string, unknown>;
}

function getMezzoId(record: MezzoRecord, index: number): string {
  const rawId = normalizeText(record.id);
  if (rawId) return rawId;

  const targa = normalizeNextMezzoTarga(record.targa);
  if (targa) return `mezzo:${targa}`;

  return `mezzo:${index}`;
}

function getSessionLabel(record: SessioneRecord): {
  badgeAutista: string | null;
  nomeAutista: string | null;
  label: string;
} {
  const badgeAutista = normalizeOptionalText(record.badgeAutista ?? record.badge);
  const nomeAutista = normalizeOptionalText(
    record.nomeAutista ?? record.autistaNome ?? record.autista
  );
  const badgeLabel = badgeAutista ? `badge ${badgeAutista}` : "badge -";
  const nomeLabel = nomeAutista ?? "-";
  return {
    badgeAutista,
    nomeAutista,
    label: `${badgeLabel} (${nomeLabel})`,
  };
}

function buildSegnalazioneTarga(record: SegnalazioneRecord): string | null {
  return normalizeNextMezzoTarga(
    record.targa ?? record.targaCamion ?? record.targaRimorchio ?? ""
  ) || null;
}

function buildControlloTarga(record: ControlloRecord): string | null {
  const target = normalizeText(record.target).toLowerCase();
  const targaMotrice = normalizeNextMezzoTarga(record.targaMotrice ?? record.targaCamion ?? "");
  const targaRimorchio = normalizeNextMezzoTarga(record.targaRimorchio ?? "");

  if (target === "rimorchio") return targaRimorchio || targaMotrice || null;
  if (target === "motrice") return targaMotrice || targaRimorchio || null;
  if (target === "entrambi") return targaMotrice || targaRimorchio || null;
  return targaRimorchio || targaMotrice || null;
}

function getSegnalazioneTimestamp(record: SegnalazioneRecord): number | null {
  return toTimestamp(record.timestamp) ?? toTimestamp(record.data);
}

function getControlloTimestamp(record: ControlloRecord): number | null {
  return toTimestamp(record.timestamp) ?? toTimestamp(record.data);
}

function normalizeSeverityValue(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function isHighSeverity(value: string): boolean {
  return (
    value.includes("alta") ||
    value.includes("high") ||
    value.includes("urgent") ||
    value.includes("urgente") ||
    value.includes("crit") ||
    value.includes("grave")
  );
}

function isSegnalazioneNuova(record: SegnalazioneRecord): boolean {
  return record.stato === "nuova" || record.letta === false;
}

function isSegnalazioneImportante(record: SegnalazioneRecord): boolean {
  if (record.flagVerifica === true) return true;
  const fields = [
    record.urgenza,
    record.priorita,
    record.gravita,
    record.severity,
    record.livello,
  ];
  return fields.some((value) => isHighSeverity(normalizeSeverityValue(value)));
}

function extractKoItems(record: ControlloRecord): string[] {
  const items: string[] = [];
  const check = record.check;

  if (check && typeof check === "object" && !Array.isArray(check)) {
    Object.entries(check as Record<string, unknown>).forEach(([key, value]) => {
      if (value === false) items.push(String(key).toUpperCase());
    });
  }

  const buckets = [
    record.koList,
    record.koItems,
    record.anomalie,
    record.problemi,
    record.difetti,
    record.errori,
    record.controlliKo,
    record.koDetails,
  ];

  buckets.forEach((bucket) => {
    if (!Array.isArray(bucket)) return;
    bucket.forEach((entry) => {
      if (typeof entry === "string") {
        const trimmed = entry.trim();
        if (trimmed) items.push(trimmed);
        return;
      }

      if (entry && typeof entry === "object") {
        const recordEntry = entry as Record<string, unknown>;
        const label =
          normalizeOptionalText(recordEntry.label) ??
          normalizeOptionalText(recordEntry.nome) ??
          normalizeOptionalText(recordEntry.titolo) ??
          normalizeOptionalText(recordEntry.descrizione) ??
          normalizeOptionalText(recordEntry.name) ??
          normalizeOptionalText(recordEntry.testo);
        if (label) items.push(label);
      }
    });
  });

  return Array.from(new Set(items));
}

function getControlloKoQuality(record: ControlloRecord): D10Quality {
  if (record.ko === true) return "source_direct";
  if (record.ok === false || record.tuttoOk === false || record.outcome === false) {
    return "source_direct";
  }
  if (record.esito === false) return "source_direct";

  const esito = normalizeText(record.esito ?? record.stato ?? record.outcome).toUpperCase();
  if (esito === "KO") return "source_direct";

  const check = record.check;
  if (check && typeof check === "object" && !Array.isArray(check)) {
    if (Object.values(check as Record<string, unknown>).some((value) => value === false)) {
      return "derived_acceptable";
    }
  }

  return extractKoItems(record).length > 0 ? "derived_acceptable" : "excluded_from_v1";
}

function isControlloKo(record: ControlloRecord): boolean {
  return getControlloKoQuality(record) !== "excluded_from_v1";
}

function getSegnalazionePreview(record: SegnalazioneRecord): string {
  const tipo = normalizeFreeText(record.tipoProblema);
  const descrizione = normalizeFreeText(record.descrizione);
  const note = normalizeFreeText(record.note ?? record.messaggio);
  const preview = descrizione || note || tipo || "Segnalazione";
  return truncateText(preview, 96);
}

function getControlloPreview(record: ControlloRecord): string {
  const koItems = extractKoItems(record);
  if (koItems.length > 0) {
    return truncateText(`KO: ${koItems.slice(0, 4).join(", ")}`, 96);
  }

  const note = normalizeFreeText(record.note ?? record.dettaglio ?? record.messaggio);
  if (note) return truncateText(note, 96);
  return "Controllo KO";
}

function getAlertStateForCandidate(
  state: AlertsState,
  candidate: BaseAlertCandidate,
  now: number
): {
  visible: boolean;
  ackAt: number | null;
  snoozeUntil: number | null;
  lastShownAt: number | null;
} {
  const item = state.items[candidate.id];
  if (!item || isMetaChanged(item.meta, candidate.meta)) {
    return { visible: true, ackAt: null, snoozeUntil: null, lastShownAt: null };
  }

  if (item.ackAt !== null) {
    return {
      visible: false,
      ackAt: item.ackAt,
      snoozeUntil: item.snoozeUntil,
      lastShownAt: item.lastShownAt,
    };
  }

  if (item.snoozeUntil !== null && now < item.snoozeUntil) {
    return {
      visible: false,
      ackAt: item.ackAt,
      snoozeUntil: item.snoozeUntil,
      lastShownAt: item.lastShownAt,
    };
  }

  return {
    visible: true,
    ackAt: item.ackAt,
    snoozeUntil: item.snoozeUntil,
    lastShownAt: item.lastShownAt,
  };
}

function buildRevisionAlertCandidates(
  mezzi: MezzoRecord[],
  now: number
): {
  candidates: BaseAlertCandidate[];
  revisioniScadute: number;
  revisioniInScadenza: number;
} {
  const candidates: BaseAlertCandidate[] = [];
  let revisioniScadute = 0;
  let revisioniInScadenza = 0;

  mezzi.forEach((record, index) => {
    const mezzoTarga = normalizeNextMezzoTarga(record.targa);
    if (!mezzoTarga) return;

    const explicitScadenza = parseDateFlexible(record.dataScadenzaRevisione);
    const immatricolazione = parseDateFlexible(record.dataImmatricolazione);
    const ultimoCollaudo = parseDateFlexible(record.dataUltimoCollaudo);
    const computedScadenza = explicitScadenza
      ? null
      : calcolaProssimaRevisione(immatricolazione, ultimoCollaudo, now);
    const scadenza = explicitScadenza ?? computedScadenza;
    const giorni = giorniDaOggi(scadenza, now);
    if (giorni === null || giorni > 30) return;

    const prenotazioneRaw =
      record.prenotazioneCollaudo && typeof record.prenotazioneCollaudo === "object"
        ? (record.prenotazioneCollaudo as Record<string, unknown>)
        : null;
    if (prenotazioneRaw?.completata === true) return;

    if (giorni < 0) revisioniScadute += 1;
    else revisioniInScadenza += 1;

    const dueTs = scadenza ? scadenza.getTime() : null;
    const prenData = normalizeOptionalText(prenotazioneRaw?.data);
    const prenOra = normalizeOptionalText(prenotazioneRaw?.ora);
    const prenDate = parseDateFlexible(prenData);
    const prenLabel = prenData
      ? ` | Prenotata ${formatDateLabel(prenDate ? prenDate.getTime() : null) ?? prenData}${
          prenOra ? ` ${prenOra}` : ""
        }`
      : "";

    const title = giorni < 0 ? "Revisione scaduta" : "Revisione in scadenza";
    const detailText = `${mezzoTarga} | ${giorni < 0 ? "Scaduta" : "Scade"} ${formatGiorniLabel(
      giorni
    )}${dueTs ? ` | ${formatDateLabel(dueTs)}` : ""}${prenLabel}`;
    const targaId = normalizeTargaForAlertId(mezzoTarga);

    candidates.push({
      id: `revisione:${targaId}`,
      kind: "revisione",
      title,
      detailText,
      severity: giorni < 0 ? "danger" : "warning",
      quality: explicitScadenza ? "source_direct" : "derived_acceptable",
      mezzoTarga,
      autistaNome: normalizeOptionalText(record.autistaNome),
      badgeAutista: null,
      eventTs: null,
      dueTs,
      dateLabel: formatDateLabel(dueTs),
      sourceDataset: MEZZI_KEY,
      sourceRecordId: getMezzoId(record, index),
      targetRouteKind: "dossier",
      meta: { type: "revisione", ref: String(dueTs ?? "") },
      sortBucket: giorni < 0 ? 0 : 1,
      sortValue: giorni,
    });
  });

  return { candidates, revisioniScadute, revisioniInScadenza };
}

function buildConflittoAlertCandidates(
  sessioni: SessioneRecord[]
): { candidates: BaseAlertCandidate[]; conflittiSessione: number } {
  const motrici = new Map<string, SessioneRecord[]>();
  const rimorchi = new Map<string, SessioneRecord[]>();

  sessioni.forEach((record) => {
    const targaMotrice = normalizeNextMezzoTarga(record.targaMotrice ?? record.targaCamion);
    const targaRimorchio = normalizeNextMezzoTarga(record.targaRimorchio);

    if (targaMotrice) {
      const list = motrici.get(targaMotrice) ?? [];
      list.push(record);
      motrici.set(targaMotrice, list);
    }

    if (targaRimorchio) {
      const list = rimorchi.get(targaRimorchio) ?? [];
      list.push(record);
      rimorchi.set(targaRimorchio, list);
    }
  });

  const candidates: BaseAlertCandidate[] = [];

  const pushConflict = (scope: "motrice" | "rimorchio", targa: string, items: SessioneRecord[]) => {
    if (items.length <= 1) return;

    const labels = Array.from(
      new Set(items.map((entry) => getSessionLabel(entry).label))
    ).sort((left, right) => left.localeCompare(right));
    const topTs = items
      .map((entry) => toTimestamp(entry.timestamp))
      .filter((value): value is number => value !== null)
      .sort((left, right) => right - left)[0] ?? null;

    const quality: D10Quality =
      labels.length > 1 ? "derived_acceptable" : "excluded_from_v1";

    candidates.push({
      id: `conflitto:${scope}:${targa}`,
      kind: "conflitto_sessione",
      title:
        scope === "motrice"
          ? "Conflitto sessione motrice"
          : "Conflitto sessione rimorchio",
      detailText: `${targa} | In uso da ${labels.length} sessioni | ${truncateText(
        labels.join(", "),
        120
      )}`,
      severity: "danger",
      quality,
      mezzoTarga: targa,
      autistaNome: null,
      badgeAutista: null,
      eventTs: topTs,
      dueTs: null,
      dateLabel: formatDateTimeLabel(topTs),
      sourceDataset: SESSIONI_KEY,
      sourceRecordId: targa,
      targetRouteKind: "dossier",
      meta: {
        type: "conflitto",
        ref: `v1:${stableHash32(
          [scope, targa, String(labels.length), labels.join("|")].join("|")
        )}`,
      },
      sortBucket: 0,
      sortValue: -(topTs ?? 0),
    });
  };

  Array.from(motrici.entries())
    .filter(([, items]) => items.length > 1)
    .forEach(([targa, items]) => pushConflict("motrice", targa, items));

  Array.from(rimorchi.entries())
    .filter(([, items]) => items.length > 1)
    .forEach(([targa, items]) => pushConflict("rimorchio", targa, items));

  return { candidates, conflittiSessione: candidates.length };
}

function buildSegnalazioneAlertCandidates(
  segnalazioni: SegnalazioneRecord[]
): { candidates: BaseAlertCandidate[]; segnalazioniNuove: number } {
  const candidates: BaseAlertCandidate[] = segnalazioni
    .filter((record) => isSegnalazioneNuova(record))
    .map((record) => {
      const ts = getSegnalazioneTimestamp(record);
      const mezzoTarga = buildSegnalazioneTarga(record);
      const targaId = normalizeTargaForAlertId(mezzoTarga);
      const idBase =
        normalizeOptionalText(record.id) ??
        stableHash32(
          [
            String(ts ?? 0),
            targaId,
            normalizeFreeText(record.badgeAutista),
            normalizeFreeText(record.tipoProblema),
            normalizeFreeText(record.descrizione),
          ].join("|")
        );
      const contentSignature = stableHash32(
        [
          String(ts ?? 0),
          targaId,
          normalizeFreeText(record.badgeAutista),
          normalizeFreeText(record.tipoProblema),
          normalizeFreeText(record.descrizione),
          normalizeFreeText(record.note ?? record.messaggio),
        ].join("|")
      );
      const typeLabel = truncateText(
        normalizeFreeText(record.tipoProblema) || "Segnalazione",
        48
      );
      const detailText = `${mezzoTarga || "Senza targa"} | ${
        formatDateTimeLabel(ts) ?? "Data non disponibile"
      } | ${typeLabel} | ${getSegnalazionePreview(record)}`;
      const meta: AlertMeta = {
        type: "segnalazione",
        ref: `v1:${ts ?? 0}:${contentSignature}`,
      };

      return {
        id: `segnalazione:${idBase}`,
        kind: "segnalazione_nuova" as const,
        title: isSegnalazioneImportante(record)
          ? "Segnalazione importante non letta"
          : "Segnalazione non letta",
        detailText,
        severity: "warning" as const,
        quality: "source_direct" as const,
        mezzoTarga,
        autistaNome: normalizeOptionalText(record.autistaNome ?? record.nomeAutista),
        badgeAutista: normalizeOptionalText(record.badgeAutista),
        eventTs: ts,
        dueTs: null,
        dateLabel: formatDateTimeLabel(ts),
        sourceDataset: SEGNALAZIONI_KEY,
        sourceRecordId: normalizeOptionalText(record.id) ?? idBase,
        targetRouteKind: (mezzoTarga ? "dossier" : "none") as D10TargetRouteKind,
        meta,
        sortBucket: 2,
        sortValue: -(ts ?? 0),
      };
    })
    .sort((left, right) => (right.eventTs ?? 0) - (left.eventTs ?? 0));

  return { candidates, segnalazioniNuove: candidates.length };
}

function buildControlloFocusItems(controlli: ControlloRecord[]): D10FocusItem[] {
  return controlli
    .filter((record) => isControlloKo(record))
    .map<D10FocusItem>((record) => {
      const ts = getControlloTimestamp(record);
      const mezzoTarga = buildControlloTarga(record);
      const idBase =
        normalizeOptionalText(record.id) ??
        stableHash32(
          [
            String(ts ?? 0),
            mezzoTarga ?? "",
            normalizeFreeText(record.badgeAutista ?? record.nomeAutista),
            normalizeFreeText(record.target),
          ].join("|")
        );

      return {
        id: `controllo:${idBase}`,
        kind: "controllo_ko",
        title: "Controllo KO",
        detailText: `${mezzoTarga || "Senza targa"} | ${
          formatDateTimeLabel(ts) ?? "Data non disponibile"
        } | ${getControlloPreview(record)}`,
        severity: "danger",
        quality: getControlloKoQuality(record),
        mezzoTarga,
        autistaNome: normalizeOptionalText(record.autistaNome ?? record.nomeAutista),
        badgeAutista: normalizeOptionalText(record.badgeAutista),
        eventTs: ts,
        dateLabel: formatDateTimeLabel(ts),
        sourceDataset: CONTROLLI_KEY,
        sourceRecordId: normalizeOptionalText(record.id) ?? idBase,
        targetRouteKind: mezzoTarga ? "dossier" : "none",
      };
    })
    .sort((left, right) => (right.eventTs ?? 0) - (left.eventTs ?? 0));
}

function buildMezzoIncompletoFocusItems(mezzi: MezzoRecord[]): D10FocusItem[] {
  return mezzi
    .map<D10FocusItem | null>((record, index) => {
      const mezzoTarga = normalizeNextMezzoTarga(record.targa) || null;
      const missingTarga = !mezzoTarga;
      const missingCategoria = !normalizeOptionalText(record.categoria);
      const missingAutista = !normalizeOptionalText(record.autistaNome);
      if (!missingTarga && !missingCategoria && !missingAutista) return null;

      const parts: string[] = [];
      if (missingTarga) parts.push("targa");
      if (missingCategoria) parts.push("categoria");
      if (missingAutista) parts.push("autista");

      return {
        id: `mezzo_incompleto:${getMezzoId(record, index)}`,
        kind: "mezzo_incompleto",
        title: "Mezzo incompleto",
        detailText: `${mezzoTarga || "Senza targa"} | Campi mancanti: ${parts.join(", ")}`,
        severity: missingTarga ? "danger" : "warning",
        quality: "source_direct",
        mezzoTarga,
        autistaNome: normalizeOptionalText(record.autistaNome),
        badgeAutista: null,
        eventTs: null,
        dateLabel: null,
        sourceDataset: MEZZI_KEY,
        sourceRecordId: getMezzoId(record, index),
        targetRouteKind: mezzoTarga ? "dossier" : "none",
      };
    })
    .filter((item): item is D10FocusItem => Boolean(item))
    .sort((left, right) => {
      const leftWeight = left.severity === "danger" ? 0 : 1;
      const rightWeight = right.severity === "danger" ? 0 : 1;
      if (leftWeight !== rightWeight) return leftWeight - rightWeight;
      return (left.mezzoTarga ?? "").localeCompare(right.mezzoTarga ?? "");
    });
}

function sortAlertCandidates(items: BaseAlertCandidate[]): BaseAlertCandidate[] {
  return [...items].sort((left, right) => {
    if (left.sortBucket !== right.sortBucket) return left.sortBucket - right.sortBucket;
    if (left.sortValue !== right.sortValue) return left.sortValue - right.sortValue;
    return left.title.localeCompare(right.title);
  });
}

export function buildNextStatoOperativoSnapshot(input: D10BuildInput): D10Snapshot {
  const now = input.now ?? Date.now();
  const mezzi = unwrapArrayValue(input.mezziRaw).filter(
    (entry): entry is MezzoRecord => Boolean(entry) && typeof entry === "object"
  );
  const sessioni = unwrapArrayValue(input.sessioniRaw).filter(
    (entry): entry is SessioneRecord => Boolean(entry) && typeof entry === "object"
  );
  const segnalazioni = unwrapArrayValue(input.segnalazioniRaw).filter(
    (entry): entry is SegnalazioneRecord => Boolean(entry) && typeof entry === "object"
  );
  const controlli = unwrapArrayValue(input.controlliRaw).filter(
    (entry): entry is ControlloRecord => Boolean(entry) && typeof entry === "object"
  );
  const rawAlertsState = unwrapObjectValue(input.alertsStateRaw);
  const parsedAlertsState = parseAlertsState(rawAlertsState ?? createEmptyAlertsState());

  const revisioni = buildRevisionAlertCandidates(mezzi, now);
  const conflitti = buildConflittoAlertCandidates(sessioni);
  const segnalazioniNuove = buildSegnalazioneAlertCandidates(segnalazioni);
  const allAlertCandidates = sortAlertCandidates([
    ...revisioni.candidates,
    ...conflitti.candidates,
    ...segnalazioniNuove.candidates,
  ]);

  const candidateAlertIds = new Set(allAlertCandidates.map((item) => item.id));
  const alertsState = pruneAlertsState(parsedAlertsState, now, candidateAlertIds).state;

  const alerts = allAlertCandidates
    .map((candidate) => {
      const state = getAlertStateForCandidate(alertsState, candidate, now);
      if (!state.visible) return null;

      return {
        id: candidate.id,
        kind: candidate.kind,
        title: candidate.title,
        detailText: candidate.detailText,
        severity: candidate.severity,
        quality: candidate.quality,
        mezzoTarga: candidate.mezzoTarga,
        autistaNome: candidate.autistaNome,
        badgeAutista: candidate.badgeAutista,
        eventTs: candidate.eventTs,
        dueTs: candidate.dueTs,
        dateLabel: candidate.dateLabel,
        sourceDataset: candidate.sourceDataset,
        sourceRecordId: candidate.sourceRecordId,
        targetRouteKind: candidate.targetRouteKind,
        ackAt: state.ackAt,
        snoozeUntil: state.snoozeUntil,
        lastShownAt: state.lastShownAt,
      };
    })
    .filter((item): item is D10AlertItem => Boolean(item));

  const controlloFocus = buildControlloFocusItems(controlli);
  const mezzoIncompletoFocus = buildMezzoIncompletoFocusItems(mezzi);
  const focusItems = [...controlloFocus, ...mezzoIncompletoFocus];

  return {
    domainCode: NEXT_STATO_OPERATIVO_DOMAIN.code,
    domainName: NEXT_STATO_OPERATIVO_DOMAIN.name,
    generatedAt: now,
    logicalDatasets: NEXT_STATO_OPERATIVO_DOMAIN.logicalDatasets,
    counters: {
      alertsVisible: alerts.length,
      revisioniScadute: revisioni.revisioniScadute,
      revisioniInScadenza: revisioni.revisioniInScadenza,
      conflittiSessione: conflitti.conflittiSessione,
      segnalazioniNuove: segnalazioniNuove.segnalazioniNuove,
      controlliKo: controlloFocus.length,
    },
    alerts,
    focusItems,
    limitations: [
      "D10 v1 usa @alerts_state solo per persistere ack/snooze/lastShownAt delle famiglie alert gia supportate dal legacy.",
      "Le scadenze cross-modulo non ancora formalizzate restano fuori: in v1 entra solo la revisione mezzo letta da @mezzi_aziendali.",
      "Segnalazioni nuove, controlli KO e conflitti sessione arrivano da feed operativi legacy e sono trattati come segnali derivati o di supporto, non come domini canonici importati.",
      "Richieste attrezzature, gomme, rifornimenti, homeEvents.ts e autisti_eventi sono esclusi volutamente da D10 v1.",
      "Mezzo incompleto entra solo come focus read-only senza persistenza ack/snooze dedicata.",
    ],
  };
}

export async function readNextStatoOperativoSnapshot(
  now: number = Date.now()
): Promise<D10Snapshot> {
  const [alertsStateRaw, mezziRaw, sessioniRaw, segnalazioniRaw, controlliRaw] =
    await Promise.all([
      getItemSync(ALERTS_STATE_KEY),
      getItemSync(MEZZI_KEY),
      getItemSync(SESSIONI_KEY),
      getItemSync(SEGNALAZIONI_KEY),
      getItemSync(CONTROLLI_KEY),
    ]);

  return buildNextStatoOperativoSnapshot({
    alertsStateRaw,
    mezziRaw,
    sessioniRaw,
    segnalazioniRaw,
    controlliRaw,
    now,
  });
}
