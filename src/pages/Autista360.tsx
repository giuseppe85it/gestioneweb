import "./Autista360.css";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getItemSync } from "../utils/storageSync";

const SESSIONI_KEY = "@autisti_sessione_attive";
const SEGNALAZIONI_KEY = "@segnalazioni_autisti_tmp";
const CONTROLLI_KEY = "@controlli_mezzo_autisti";
const RIFORNIMENTI_KEY = "@rifornimenti_autisti_tmp";
const RICHIESTE_ATTREZZATURE_KEY = "@richieste_attrezzature_autisti_tmp";
const GOMME_KEY = "@cambi_gomme_autisti_tmp";
const GOMME_EVENTI_KEY = "@gomme_eventi";
const EVENTI_OPERATIVI_KEY = "@storico_eventi_operativi";
const TARGA_PLACEHOLDER = "TARGA NON DISPONIBILE";

const FILTER_TYPES = [
  "All",
  "Agganci",
  "Sganci",
  "Segnalazioni",
  "Controlli",
  "Rifornimenti",
  "Richieste",
  "Gomme",
  "Storico",
];

const DEFAULT_TS_FIELDS = ["timestamp", "ts", "dataOra", "data", "date", "createdAt", "updatedAt"];
const SESSION_START_FIELDS = [...DEFAULT_TS_FIELDS, "dataInizio", "startAt"];
const SESSION_END_FIELDS = [
  "revokedAt",
  "chiusuraTimestamp",
  "chiusura",
  "endAt",
  "dataFine",
  "dataChiusura",
  "closedAt",
];

type BadgeMatch = "EXACT" | "WEAK";

type TimelineEvent = {
  ts: number;
  tsRaw?: string;
  dateLabel: string;
  type: string;
  title: string;
  subtitle?: string;
  targa: string;
  targaCamion?: string;
  targaRimorchio?: string;
  badge?: string;
  photo?: boolean;
  sourceKey: string;
  rawRefId?: string;
  badgeMatch: BadgeMatch;
  motrice?: string;
  rimorchio?: string;
  beforeMotrice?: string;
  afterMotrice?: string;
  beforeRimorchio?: string;
  afterRimorchio?: string;
  isChangeEvent?: boolean;
  extra?: string[];
};

type NameMatch = {
  badgeKey: string;
  badgeLabel: string;
  nameLabel: string;
  count: number;
};

type DataBuckets = {
  sessioni: any[];
  segnalazioni: any[];
  controlli: any[];
  rifornimenti: any[];
  richieste: any[];
  gomme: any[];
  gommeEventi: any[];
  storico: any[];
};

function unwrapList(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.value)) return value.value;
  if (value && Array.isArray(value.items)) return value.items;
  return [];
}

function normalizeBadge(value: any): string {
  return String(value || "").trim();
}

function normalizeBadgeKey(value: any): string {
  return normalizeBadge(value).toLowerCase();
}

function normalizeName(value: any): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeNameKey(value: any): string {
  return normalizeName(value).toLowerCase();
}

function normalizeTarga(value: any): string {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

function formatTargaLabel(value: any): string {
  const raw = String(value || "").trim();
  if (!raw) return TARGA_PLACEHOLDER;
  if (raw.toUpperCase() === TARGA_PLACEHOLDER) return TARGA_PLACEHOLDER;
  const normalized = normalizeTarga(raw);
  return normalized || TARGA_PLACEHOLDER;
}

function toMillis(value: any): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value < 1e12 ? value * 1000 : value;
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === "object") {
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.seconds === "number") return value.seconds * 1000;
  }
  return null;
}

function getTimestamp(record: any, keys: string[]): number | null {
  if (!record || typeof record !== "object") return null;
  for (const key of keys) {
    const millis = toMillis(record[key]);
    if (millis !== null) return millis;
  }
  return null;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatDateLabel(ts: number): string {
  if (!ts) return "Data non disponibile";
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "Data non disponibile";
  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  return `${day} ${month} ${year} ${hours}:${minutes}`;
}

function getStringFromRecord(record: any, keys: string[]): string {
  if (!record || typeof record !== "object") return "";
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function getRawTimestampLabel(record: any): string {
  if (!record || typeof record !== "object") return "";
  const raw =
    record?.timestamp ??
    record?.data ??
    record?.dataOra ??
    record?.createdAt ??
    record?.updatedAt;
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (raw && typeof raw === "object") {
    if (typeof raw.toMillis === "function") {
      const ts = raw.toMillis();
      return typeof ts === "number" && Number.isFinite(ts) ? String(ts) : "";
    }
    if (typeof raw.seconds === "number") return String(raw.seconds * 1000);
  }
  return "";
}

function getRawValueFromKeys(record: any, keys: string[]): string {
  if (!record || typeof record !== "object") return "";
  for (const key of keys) {
    const raw = record[key];
    if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
    if (typeof raw === "string" && raw.trim()) return raw.trim();
    if (raw && typeof raw === "object") {
      if (typeof raw.toMillis === "function") {
        const ts = raw.toMillis();
        return typeof ts === "number" && Number.isFinite(ts) ? String(ts) : "";
      }
      if (typeof raw.seconds === "number") return String(raw.seconds * 1000);
    }
  }
  return "";
}

function getTargaFromRecord(record: any): string {
  if (!record || typeof record !== "object") return TARGA_PLACEHOLDER;
  const candidates = [
    record?.targa,
    record?.targaCamion,
    record?.targacamion,
    record?.targaRimorchio,
    record?.targarimorchio,
    record?.camion?.targa,
    record?.rimorchio?.targa,
    record?.targaMotrice,
    record?.motriceTarga,
    record?.motrice?.targa,
    record?.rimorchioTarga,
    record?.prima?.targaMotrice,
    record?.dopo?.targaMotrice,
    record?.prima?.targaRimorchio,
    record?.dopo?.targaRimorchio,
  ];
  for (const candidate of candidates) {
    const normalized = normalizeTarga(candidate);
    if (normalized) return normalized;
  }
  return TARGA_PLACEHOLDER;
}

function getBeforeAfterMotrice(record: any): { before: string; after: string } {
  const before = normalizeTarga(
    record?.prima?.targaMotrice ??
      record?.prima?.motrice ??
      record?.prima?.targaCamion ??
      record?.primaMotrice ??
      record?.targaMotricePrima ??
      null
  );
  const after = normalizeTarga(
    record?.dopo?.targaMotrice ??
      record?.dopo?.motrice ??
      record?.dopo?.targaCamion ??
      record?.dopoMotrice ??
      record?.targaMotriceDopo ??
      null
  );
  return { before, after };
}

function getBeforeAfterRimorchio(record: any): { before: string; after: string } {
  const before = normalizeTarga(
    record?.prima?.targaRimorchio ??
      record?.prima?.rimorchio ??
      record?.primaRimorchio ??
      record?.targaRimorchioPrima ??
      null
  );
  const after = normalizeTarga(
    record?.dopo?.targaRimorchio ??
      record?.dopo?.rimorchio ??
      record?.dopoRimorchio ??
      record?.targaRimorchioDopo ??
      null
  );
  return { before, after };
}

function getNumericLabel(value: any): string {
  if (value == null) return "";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim()) return value.trim();
  return "";
}

function formatLitri(value: any): string {
  const raw = getNumericLabel(value);
  if (!raw) return "";
  return /\bL\b/i.test(raw) ? raw : `${raw} L`;
}

function formatCosto(value: any): string {
  if (typeof value === "number" && Number.isFinite(value)) return `${value} €`;
  if (typeof value === "string" && value.trim()) return value.trim();
  return "";
}

function getStatusFromRecord(record: any): string {
  const status = getStringFromRecord(record, ["stato", "status"]);
  if (status) return status;
  const readFlag = record?.letto ?? record?.letta ?? record?.isRead;
  if (typeof readFlag === "boolean") return readFlag ? "Letta" : "Nuova";
  return "";
}

function hasPhoto(record: any): boolean {
  if (!record || typeof record !== "object") return false;
  const direct =
    record.fotoUrl ??
    record.fotoDataUrl ??
    record.fotoStoragePath ??
    record.fotoStoragePaths ??
    record.fotoUrls ??
    record.foto;
  if (!direct) return false;
  if (Array.isArray(direct)) return direct.length > 0;
  if (typeof direct === "string") return direct.trim().length > 0;
  if (typeof direct === "object") {
    return Boolean(direct.url || direct.path || direct.storagePath);
  }
  return false;
}

function extractKoItems(record: any): string[] {
  const buckets = [
    record?.koList,
    record?.koItems,
    record?.anomalie,
    record?.problemi,
    record?.difetti,
    record?.errori,
    record?.controlliKo,
    record?.koDetails,
  ];
  const items: string[] = [];
  buckets.forEach((bucket) => {
    if (!Array.isArray(bucket)) return;
    bucket.forEach((entry) => {
      if (typeof entry === "string" && entry.trim()) {
        items.push(entry.trim());
        return;
      }
      if (entry && typeof entry === "object") {
        const label = getStringFromRecord(entry, [
          "label",
          "nome",
          "titolo",
          "descrizione",
          "name",
          "testo",
        ]);
        if (label) items.push(label);
      }
    });
  });
  return Array.from(new Set(items));
}

function getBadgeFromRecord(record: any): string {
  const direct = getStringFromRecord(record, [
    "badgeAutista",
    "badge",
    "autistaBadge",
    "badge_autista",
    "badgeId",
    "badgeID",
    "badgeAutistaId",
  ]);
  if (direct) return direct;
  const nested = getStringFromRecord(record?.autista, ["badge", "badgeAutista", "badgeId"]);
  if (nested) return nested;
  const driver = getStringFromRecord(record?.driver, ["badge", "badgeId"]);
  if (driver) return driver;
  return "";
}

function getNameFromRecord(record: any): string {
  if (typeof record?.autista === "string") return record.autista.trim();
  if (typeof record?.driver === "string") return record.driver.trim();
  const direct = getStringFromRecord(record, [
    "autistaNome",
    "nomeAutista",
    "autista",
    "nome",
    "driverName",
    "autistaName",
  ]);
  if (direct) return direct;
  const nested = getStringFromRecord(record?.autista, ["nome", "name"]);
  if (nested) return nested;
  const driver = getStringFromRecord(record?.driver, ["nome", "name"]);
  if (driver) return driver;
  return "";
}

function getRawRefId(record: any): string {
  const value = record?.id ?? record?.uid ?? record?.uuid ?? record?.key ?? record?.refId;
  return value ? String(value) : "";
}

function getMotriceFromRecord(record: any): string {
  return normalizeTarga(
    record?.targaMotrice ??
      record?.motriceTarga ??
      record?.motrice?.targa ??
      record?.targaCamion ??
      record?.targaTrattore ??
      record?.targa ??
      record?.targaMezzo ??
      record?.mezzo
  );
}

function getRimorchioFromRecord(record: any): string {
  return normalizeTarga(
    record?.targaRimorchio ??
      record?.rimorchioTarga ??
      record?.rimorchio?.targa ??
      record?.rimorchio
  );
}

function resolveBadgeMatch(
  recordBadge: string,
  recordName: string,
  targetBadgeKey: string,
  primaryNameKey: string
): BadgeMatch | null {
  const badgeKey = normalizeBadgeKey(recordBadge);
  if (badgeKey && badgeKey === targetBadgeKey) return "EXACT";
  if (badgeKey) return null;
  const nameKey = normalizeNameKey(recordName);
  if (!nameKey || !primaryNameKey) return null;
  return nameKey === primaryNameKey ? "WEAK" : null;
}

function typeClassName(type: string): string {
  const slug = type.toLowerCase().replace(/\s+/g, "-");
  return `type-pill type-${slug}`;
}

function parseDateInput(value: string, endOfDay: boolean): number | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  const date = new Date(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  );
  if (Number.isNaN(date.getTime())) return null;
  return date.getTime();
}

function joinParts(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => (part ? String(part).trim() : ""))
    .filter((part) => part)
    .join(" | ");
}

function ensureSubtitle(value: string): string {
  return value || "Dettaglio non disponibile";
}

function buildSubtitle(parts: Array<string | null | undefined>): string {
  return ensureSubtitle(joinParts(parts));
}

function buildChangeLine(
  label: string,
  beforeValue?: string,
  afterValue?: string
): string | null {
  const before = normalizeTarga(beforeValue);
  const after = normalizeTarga(afterValue);
  if (!before && !after) return null;
  if (before && after) {
    return `${label}: ${before} -> ${after}`;
  }
  if (!before && after) {
    return `${label}: ${after} (precedente non disponibile)`;
  }
  if (before && !after) {
    return `${label}: ${before} -> -`;
  }
  return `${label}: ${after || before}`;
}

function buildChangeSubtitle(event: TimelineEvent): string {
  const lines: Array<string | null | undefined> = [];
  lines.push(buildChangeLine("Motrice", event.beforeMotrice, event.afterMotrice));
  lines.push(buildChangeLine("Rimorchio", event.beforeRimorchio, event.afterRimorchio));
  if (event.extra?.length) lines.push(...event.extra);
  return buildSubtitle(lines);
}

function applyDerivedChangeHistory(events: TimelineEvent[]) {
  const history = new Map<string, { motrice?: string; rimorchio?: string }>();
  const ordered = [...events].sort((a, b) => a.ts - b.ts);
  ordered.forEach((event) => {
    const badgeKey = normalizeBadgeKey(event.badge);
    if (!badgeKey) return;
    const last = history.get(badgeKey) || {};
    const currentMotrice = event.afterMotrice ?? event.motrice ?? "";
    const currentRimorchio = event.afterRimorchio ?? event.rimorchio ?? "";

    if (event.isChangeEvent) {
      if (event.beforeMotrice == null && currentMotrice && last.motrice) {
        event.beforeMotrice = last.motrice;
      }
      if (event.afterMotrice == null && currentMotrice) {
        event.afterMotrice = currentMotrice;
      }
      if (event.beforeRimorchio == null && currentRimorchio && last.rimorchio) {
        event.beforeRimorchio = last.rimorchio;
      }
      if (event.afterRimorchio == null && currentRimorchio) {
        event.afterRimorchio = currentRimorchio;
      }
    }

    if (currentMotrice) last.motrice = currentMotrice;
    if (currentRimorchio) last.rimorchio = currentRimorchio;
    history.set(badgeKey, last);
  });
}

function formatOperativoLabel(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const upper = raw.toUpperCase().replace(/\s+/g, "_");
  if (upper.includes("ASSETTO") && upper.includes("CAMBIO")) return "Cambio assetto";
  if (upper.includes("ASSETTO") && upper.includes("INIZIO")) return "Inizio assetto";
  if (upper.includes("ASSETTO") && upper.includes("FINE")) return "Fine assetto";
  if (upper.includes("CAMBIO")) return "Cambio";
  if (upper.includes("AGGANCIO")) return "Aggancio";
  if (upper.includes("SGANCIO")) return "Sgancio";
  if (upper.includes("IMPORT")) return "Import";
  if (upper.includes("MODIFICA")) return "Modifica";
  return raw;
}

function Autista360() {
  const navigate = useNavigate();
  const { badge } = useParams();
  const [searchParams] = useSearchParams();
  const badgeLabel = normalizeBadge(badge);
  const badgeKey = normalizeBadgeKey(badgeLabel);
  const nameQueryRaw = searchParams.get("nome") || "";
  const nameQueryLabel = normalizeName(nameQueryRaw);
  const nameQueryKey = normalizeNameKey(nameQueryLabel);
  const isBadgeMode = Boolean(badgeKey);
  const isNameMode = !isBadgeMode && Boolean(nameQueryKey);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DataBuckets>({
    sessioni: [],
    segnalazioni: [],
    controlli: [],
    rifornimenti: [],
    richieste: [],
    gomme: [],
    gommeEventi: [],
    storico: [],
  });
  const [filterType, setFilterType] = useState("All");
  const [filterTarga, setFilterTarga] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [selectedNameBadgeKey, setSelectedNameBadgeKey] = useState<string | null>(
    null
  );

  useEffect(() => {
    setSelectedNameBadgeKey(null);
  }, [badgeKey, nameQueryKey]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [
          sessioniRaw,
          segnalazioniRaw,
          controlliRaw,
          rifornimentiRaw,
          richiesteRaw,
          gommeRaw,
          gommeEventiRaw,
          storicoRaw,
        ] = await Promise.all([
          getItemSync(SESSIONI_KEY),
          getItemSync(SEGNALAZIONI_KEY),
          getItemSync(CONTROLLI_KEY),
          getItemSync(RIFORNIMENTI_KEY),
          getItemSync(RICHIESTE_ATTREZZATURE_KEY),
          getItemSync(GOMME_KEY),
          getItemSync(GOMME_EVENTI_KEY),
          getItemSync(EVENTI_OPERATIVI_KEY),
        ]);
        if (!mounted) return;
        setData({
          sessioni: unwrapList(sessioniRaw),
          segnalazioni: unwrapList(segnalazioniRaw),
          controlli: unwrapList(controlliRaw),
          rifornimenti: unwrapList(rifornimentiRaw),
          richieste: unwrapList(richiesteRaw),
          gomme: unwrapList(gommeRaw),
          gommeEventi: unwrapList(gommeEventiRaw),
          storico: unwrapList(storicoRaw),
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const primaryName = useMemo(() => {
    if (!badgeKey) return "";
    const counts = new Map<string, { count: number; label: string }>();
    const addName = (record: any) => {
      const recordBadge = getBadgeFromRecord(record);
      if (normalizeBadgeKey(recordBadge) !== badgeKey) return;
      const name = getNameFromRecord(record);
      if (!name) return;
      const key = normalizeNameKey(name);
      const current = counts.get(key);
      if (current) {
        current.count += 1;
      } else {
        counts.set(key, { count: 1, label: name });
      }
    };

    [
      data.sessioni,
      data.segnalazioni,
      data.controlli,
      data.rifornimenti,
      data.richieste,
      data.gomme,
      data.gommeEventi,
      data.storico,
    ].forEach((list) => list.forEach(addName));

    let bestLabel = "";
    let bestCount = 0;
    counts.forEach((value) => {
      if (value.count > bestCount) {
        bestCount = value.count;
        bestLabel = value.label;
      }
    });
    return bestLabel;
  }, [badgeKey, data]);

  const { events, activeSession, nameMatches, derivedBadgeLabel } = useMemo(() => {
    if (!isBadgeMode && !isNameMode) {
      return {
        events: [] as TimelineEvent[],
        activeSession: null as any,
        nameMatches: [] as NameMatch[],
        derivedBadgeLabel: "",
      };
    }
    const primaryNameKey = normalizeNameKey(primaryName);
    const events: TimelineEvent[] = [];
    let activeSession: any = null;
    const nameMatchesMap = new Map<string, NameMatch>();

    const registerNameMatch = (recordBadge: string, recordName: string) => {
      if (!isNameMode) return;
      const badgeLabel = normalizeBadge(recordBadge);
      const badgeKeyValue = normalizeBadgeKey(recordBadge) || "__no_badge__";
      const nameLabel = normalizeName(recordName) || nameQueryLabel || "Nome non disponibile";
      const existing = nameMatchesMap.get(badgeKeyValue);
      if (existing) {
        existing.count += 1;
        if (!existing.badgeLabel && badgeLabel) existing.badgeLabel = badgeLabel;
        if (!existing.nameLabel && nameLabel) existing.nameLabel = nameLabel;
      } else {
        nameMatchesMap.set(badgeKeyValue, {
          badgeKey: badgeKeyValue,
          badgeLabel,
          nameLabel,
          count: 1,
        });
      }
    };

    const pushEvent = (
      payload: Omit<TimelineEvent, "dateLabel" | "badge">,
      recordBadge: string,
      recordName: string
    ) => {
      const normalizedTarga = formatTargaLabel(payload.targa);
      events.push({
        ...payload,
        targa: normalizedTarga,
        badge: recordBadge,
        dateLabel: formatDateLabel(payload.ts),
      });
      registerNameMatch(recordBadge, recordName);
    };

    const matchRecord = (record: any) => {
      const recordBadge = getBadgeFromRecord(record);
      const recordName = getNameFromRecord(record);
      if (isBadgeMode) {
        const badgeMatch = resolveBadgeMatch(
          recordBadge,
          recordName,
          badgeKey,
          primaryNameKey
        );
        if (!badgeMatch) return null;
        return { badgeMatch, recordBadge, recordName };
      }
      if (isNameMode) {
        const nameKey = normalizeNameKey(recordName);
        if (!nameKey || nameKey !== nameQueryKey) return null;
        return { badgeMatch: "EXACT" as BadgeMatch, recordBadge, recordName };
      }
      return null;
    };

    data.sessioni.forEach((record) => {
      const matchInfo = matchRecord(record);
      if (!matchInfo) return;

      const targa = getTargaFromRecord(record);
      const motrice = getMotriceFromRecord(record);
      const rimorchio = getRimorchioFromRecord(record);
      const startTs = getTimestamp(record, SESSION_START_FIELDS) ?? 0;
      const startTsRaw =
        getRawValueFromKeys(record, SESSION_START_FIELDS) || getRawTimestampLabel(record);
      pushEvent(
        {
          ts: startTs,
          tsRaw: startTsRaw,
          type: "Agganci",
          title: `Aggancio: ${targa}`,
          subtitle: "",
          targa,
          sourceKey: SESSIONI_KEY,
          rawRefId: getRawRefId(record),
          badgeMatch: matchInfo.badgeMatch,
          motrice,
          rimorchio,
          afterMotrice: motrice || undefined,
          afterRimorchio: rimorchio || undefined,
          isChangeEvent: true,
        },
        matchInfo.recordBadge,
        matchInfo.recordName
      );

      const endTs = getTimestamp(record, SESSION_END_FIELDS);
      if (endTs !== null) {
        const endTsRaw =
          getRawValueFromKeys(record, SESSION_END_FIELDS) || getRawTimestampLabel(record);
        pushEvent(
          {
            ts: endTs,
            tsRaw: endTsRaw,
            type: "Sganci",
            title: `Sgancio: ${targa}`,
            subtitle: "",
            targa,
            sourceKey: SESSIONI_KEY,
            rawRefId: getRawRefId(record),
            badgeMatch: matchInfo.badgeMatch,
            motrice,
            rimorchio,
            beforeMotrice: motrice || undefined,
            beforeRimorchio: rimorchio || undefined,
            afterMotrice: "",
            afterRimorchio: "",
            isChangeEvent: true,
          },
          matchInfo.recordBadge,
          matchInfo.recordName
        );
      }

      if (!activeSession) {
        const isClosed = Boolean(
          record?.revoked ||
            record?.chiusura ||
            record?.closed ||
            record?.dataFine ||
            record?.endAt ||
            record?.revokedAt ||
            record?.chiusuraTimestamp
        );
        if (!isClosed) activeSession = record;
      }
    });

    const buildSimpleEvent = (
      record: any,
      type: string,
      sourceKey: string,
      title: string,
      subtitle: string,
      targa: string,
      photo?: boolean,
      extraPayload?: Partial<TimelineEvent>
    ) => {
      const matchInfo = matchRecord(record);
      if (!matchInfo) return;
      const ts = getTimestamp(record, DEFAULT_TS_FIELDS) ?? 0;
      const tsRaw =
        getRawValueFromKeys(record, DEFAULT_TS_FIELDS) || getRawTimestampLabel(record);
      pushEvent(
        {
          ts,
          tsRaw,
          type,
          title,
          subtitle: ensureSubtitle(subtitle),
          targa,
          photo,
          sourceKey,
          rawRefId: getRawRefId(record),
          badgeMatch: matchInfo.badgeMatch,
          ...(extraPayload || {}),
        },
        matchInfo.recordBadge,
        matchInfo.recordName
      );
    };

    data.segnalazioni.forEach((record) => {
      const targa = getTargaFromRecord(record);
      const categoria = getStringFromRecord(record, [
        "categoria",
        "tipo",
        "area",
        "titolo",
        "segnalazioneTipo",
      ]);
      const descr = getStringFromRecord(record, [
        "descrizione",
        "messaggio",
        "testo",
        "note",
        "dettaglio",
      ]);
      const gravita = getStringFromRecord(record, [
        "gravita",
        "priorita",
        "urgenza",
        "severity",
      ]);
      const statoRaw = getStatusFromRecord(record);
      const stato = statoRaw ? statoRaw.toUpperCase() : "";
      const subtitle = buildSubtitle([
        categoria ? `Categoria: ${categoria}` : "",
        descr ? `Descrizione: ${descr}` : "",
        gravita ? `Gravita: ${gravita}` : "",
        stato ? `Stato: ${stato}` : "",
      ]);
      const foto = hasPhoto(record);
      buildSimpleEvent(
        record,
        "Segnalazioni",
        SEGNALAZIONI_KEY,
        `Segnalazione: ${targa}`,
        subtitle,
        targa,
        foto
      );
    });

    data.controlli.forEach((record) => {
      const targaCamion = normalizeTarga(
        record?.targaCamion ?? record?.targacamion ?? record?.camion?.targa
      );
      const targaRimorchio = normalizeTarga(
        record?.targaRimorchio ?? record?.targarimorchio ?? record?.rimorchio?.targa
      );
      const targa = targaCamion || targaRimorchio || getTargaFromRecord(record);
      const esitoRaw = getStringFromRecord(record, ["esito", "risultato", "status", "stato"]);
      const esitoUpper = esitoRaw.toUpperCase();
      const isKo =
        record?.ko === true ||
        record?.esito === false ||
        esitoUpper === "KO";
      const koItems = extractKoItems(record);
      const koCountRaw =
        record?.koCount ?? record?.numeroKo ?? record?.totaleKo ?? record?.koTotali;
      const koCount = Number.isFinite(Number(koCountRaw))
        ? Number(koCountRaw)
        : koItems.length;
      const koSummary = koItems.slice(0, 5).join(", ");
      const note = getStringFromRecord(record, ["note", "dettaglio", "messaggio"]);
      const esitoLine = isKo
        ? `Esito: KO${koCount ? ` (${koCount} KO)` : ""}`
        : "Esito: OK";
      const subtitle = buildSubtitle([
        targaCamion ? `Camion: ${targaCamion}` : "",
        targaRimorchio ? `Rimorchio: ${targaRimorchio}` : "",
        esitoLine,
        koSummary ? `KO principali: ${koSummary}` : "",
        note ? `Note: ${note}` : "",
      ]);
      const title = `Controllo mezzo: ${targa}`;
      buildSimpleEvent(
        record,
        "Controlli",
        CONTROLLI_KEY,
        title,
        subtitle,
        targa,
        undefined,
        {
          targaCamion: targaCamion || undefined,
          targaRimorchio: targaRimorchio || undefined,
        }
      );
    });

    data.rifornimenti.forEach((record) => {
      const targa = getTargaFromRecord(record);
      const litri = formatLitri(record?.litri ?? record?.quantita ?? record?.qta);
      const distributore = getStringFromRecord(record, [
        "distributore",
        "puntoVendita",
        "stazione",
        "fornitore",
        "impianto",
      ]);
      const costo = formatCosto(record?.costo ?? record?.importo ?? record?.totale ?? record?.prezzo);
      const note = getStringFromRecord(record, ["note", "messaggio", "dettaglio", "commento"]);
      const subtitle = buildSubtitle([
        litri ? `Litri: ${litri}` : "",
        distributore ? `Distributore: ${distributore}` : "",
        costo ? `Costo: ${costo}` : "",
        note ? `Note: ${note}` : "",
      ]);
      buildSimpleEvent(
        record,
        "Rifornimenti",
        RIFORNIMENTI_KEY,
        `Rifornimento: ${targa}`,
        subtitle,
        targa
      );
    });

    data.richieste.forEach((record) => {
      const targa = getTargaFromRecord(record);
      const item = getStringFromRecord(record, [
        "attrezzatura",
        "attrezzature",
        "materiale",
        "descrizione",
        "richiesta",
        "messaggio",
      ]);
      const note = getStringFromRecord(record, ["note", "motivazione", "cantiere"]);
      const foto = hasPhoto(record);
      const subtitle = buildSubtitle([
        item ? `Richiesta: ${item}` : "",
        note ? `Note: ${note}` : "",
        `Foto: ${foto ? "SI" : "NO"}`,
      ]);
      buildSimpleEvent(
        record,
        "Richieste",
        RICHIESTE_ATTREZZATURE_KEY,
        `Richiesta attrezzature: ${targa}`,
        subtitle,
        targa,
        foto
      );
    });

    const addGommeEvent = (record: any, sourceKey: string) => {
      const targa = getTargaFromRecord(record);
      const tipo = getStringFromRecord(record, ["tipo", "azione", "stato", "esito"]);
      const note = getStringFromRecord(record, ["note", "dettaglio", "messaggio"]);
      const subtitle = buildSubtitle([
        tipo ? `Tipo: ${tipo}` : "",
        note ? `Note: ${note}` : "",
      ]);
      buildSimpleEvent(
        record,
        "Gomme",
        sourceKey,
        `Evento gomme: ${targa}`,
        subtitle,
        targa
      );
    };

    data.gomme.forEach((record) => addGommeEvent(record, GOMME_KEY));
    data.gommeEventi.forEach((record) => addGommeEvent(record, GOMME_EVENTI_KEY));

    data.storico.forEach((record) => {
      const matchInfo = matchRecord(record);
      if (!matchInfo) return;

      const targa = getTargaFromRecord(record);
      const motrice = getMotriceFromRecord(record);
      const rimorchio = getRimorchioFromRecord(record);
      const luogo = getStringFromRecord(record, ["luogo", "cantiere", "destinazione", "zona"]);
      const statoCarico = getStringFromRecord(record, ["statoCarico", "carico"]);
      const condizioni = getStringFromRecord(record, ["condizioni", "condizione", "statoMezzo"]);
      const note = getStringFromRecord(record, ["note", "dettaglio", "descrizione"]);
      const tipoRaw = getStringFromRecord(record, [
        "tipo",
        "tipoOperativo",
        "azione",
        "evento",
        "operation",
        "op",
        "azioneOperativa",
      ]);
      const tipoLabel = formatOperativoLabel(tipoRaw);
      const tipoUpper = String(tipoRaw || "").toUpperCase();
      const autista = getNameFromRecord(record);
      const badgeLabel = getBadgeFromRecord(record);
      const motriceChange = getBeforeAfterMotrice(record);
      const rimorchioChange = getBeforeAfterRimorchio(record);
      const motriceChanged =
        motriceChange.before &&
        motriceChange.after &&
        motriceChange.before !== motriceChange.after;
      const rimorchioChanged =
        rimorchioChange.before &&
        rimorchioChange.after &&
        rimorchioChange.before !== rimorchioChange.after;
      const hasBeforeAfter =
        motriceChange.before ||
        motriceChange.after ||
        rimorchioChange.before ||
        rimorchioChange.after;

      let actionLabel = "";
      if (motriceChanged && rimorchioChanged) {
        actionLabel = "Cambio assetto";
      } else if (motriceChanged) {
        actionLabel = "Cambio motrice";
      } else if (rimorchioChanged) {
        actionLabel = "Cambio rimorchio";
      } else if (!motriceChange.before && motriceChange.after) {
        actionLabel = "Aggancio motrice";
      } else if (motriceChange.before && !motriceChange.after) {
        actionLabel = "Sgancio motrice";
      } else if (!rimorchioChange.before && rimorchioChange.after) {
        actionLabel = "Aggancio rimorchio";
      } else if (rimorchioChange.before && !rimorchioChange.after) {
        actionLabel = "Sgancio rimorchio";
      }

      const title = actionLabel
        ? `${actionLabel}: ${targa}`
        : tipoLabel
        ? `Evento operativo: ${tipoLabel} - ${targa}`
        : `Evento operativo: ${targa}`;
      const extra = [
        autista ? `Autista: ${autista}` : "",
        badgeLabel ? `Badge ${badgeLabel}` : "",
        luogo ? `Luogo: ${luogo}` : "",
        statoCarico ? `Stato carico: ${statoCarico}` : "",
        condizioni ? `Condizioni: ${condizioni}` : "",
        note ? `Dettaglio: ${note}` : "",
      ].filter(Boolean);

      const ts = getTimestamp(record, DEFAULT_TS_FIELDS) ?? 0;
      const tsRaw =
        getRawValueFromKeys(record, DEFAULT_TS_FIELDS) || getRawTimestampLabel(record);
      pushEvent(
        {
          ts,
          tsRaw,
          type: "Storico",
          title,
          subtitle: buildSubtitle(extra),
          targa,
          sourceKey: EVENTI_OPERATIVI_KEY,
          rawRefId: getRawRefId(record),
          badgeMatch: matchInfo.badgeMatch,
          motrice,
          rimorchio,
          beforeMotrice: motriceChange.before || undefined,
          afterMotrice: motriceChange.after || undefined,
          beforeRimorchio: rimorchioChange.before || undefined,
          afterRimorchio: rimorchioChange.after || undefined,
          isChangeEvent:
            Boolean(hasBeforeAfter) ||
            /CAMBIO|AGGANCIO|SGANCIO|ASSETTO/.test(tipoUpper),
          extra: extra.length ? extra : undefined,
        },
        matchInfo.recordBadge,
        matchInfo.recordName
      );
    });

    applyDerivedChangeHistory(events);
    events.forEach((event) => {
      if (event.isChangeEvent) {
        event.subtitle = buildChangeSubtitle(event);
        return;
      }
      if (!event.subtitle) {
        event.subtitle = ensureSubtitle(event.subtitle || "");
      }
    });

    events.sort((a, b) => b.ts - a.ts);

    const nameMatches = Array.from(nameMatchesMap.values()).sort(
      (a, b) => b.count - a.count
    );
    let derivedBadgeLabel = "";
    if (isNameMode) {
      const badgeLabels = nameMatches
        .map((match) => match.badgeLabel)
        .filter((label) => label);
      const uniqueBadges = new Set(badgeLabels.map((label) => normalizeBadgeKey(label)));
      if (uniqueBadges.size === 1) {
        derivedBadgeLabel = badgeLabels[0];
      }
    }

    return { events, activeSession, nameMatches, derivedBadgeLabel };
  }, [
    isBadgeMode,
    isNameMode,
    badgeKey,
    nameQueryKey,
    nameQueryLabel,
    primaryName,
    data,
  ]);

  const headerName = useMemo(() => {
    if (isNameMode && nameQueryLabel) return nameQueryLabel;
    if (primaryName) return primaryName;
    if (activeSession) {
      const name = getNameFromRecord(activeSession);
      if (name) return name;
    }
    return "Nome non disponibile";
  }, [isNameMode, nameQueryLabel, primaryName, activeSession]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((event) => {
      counts[event.type] = (counts[event.type] || 0) + 1;
    });
    return counts;
  }, [events]);

  const headerBadgeLabel = isNameMode
    ? derivedBadgeLabel || "NON DETERMINABILE"
    : badgeLabel || "-";
  const showNameMatches = isNameMode && !loading && nameMatches.length > 1;
  const noNameMatches = isNameMode && !loading && nameMatches.length === 0;
  const limitedMatches = useMemo(() => nameMatches.slice(0, 10), [nameMatches]);

  const filteredEvents = useMemo(() => {
    const targaQuery = normalizeTarga(filterTarga);
    const fromTs = parseDateInput(filterFrom, false);
    const toTs = parseDateInput(filterTo, true);

    return events.filter((event) => {
      if (filterType !== "All" && event.type !== filterType) return false;
      if (isNameMode && selectedNameBadgeKey) {
        const eventBadgeKey = normalizeBadgeKey(event.badge) || "__no_badge__";
        if (eventBadgeKey !== selectedNameBadgeKey) return false;
      }
      if (targaQuery) {
        const eventTarga = normalizeTarga(event.targa);
        if (!eventTarga.includes(targaQuery)) return false;
      }
      if ((fromTs !== null || toTs !== null) && event.ts <= 0) return false;
      if (fromTs !== null && event.ts < fromTs) return false;
      if (toTs !== null && event.ts > toTs) return false;
      return true;
    });
  }, [
    events,
    filterType,
    filterTarga,
    filterFrom,
    filterTo,
    isNameMode,
    selectedNameBadgeKey,
  ]);

  const activeMotrice = activeSession ? getMotriceFromRecord(activeSession) : "";
  const activeRimorchio = activeSession ? getRimorchioFromRecord(activeSession) : "";
  const activeSessionDetails = joinParts([
    activeMotrice ? `Motrice ${activeMotrice}` : "",
    activeRimorchio ? `Rimorchio ${activeRimorchio}` : "",
  ]);
  const activeSessionLabel = activeSession
    ? `Sessione attiva${activeSessionDetails ? ` - ${activeSessionDetails}` : ""}`
    : "Nessuna sessione attiva";

  return (
    <div className="autista-360-page">
      <div className="autista-360-shell">
        <div className="autista-360-card autista-360-header-card">
          <div className="autista-360-header-main">
            <Link to="/" className="autista-360-logo" aria-label="Torna alla Home">
              <img src="/logo.png" alt="Logo" />
            </Link>
            <div className="autista-360-kicker">Autista 360</div>
            <div className="autista-360-badge">Badge {headerBadgeLabel}</div>
            {isNameMode ? (
              <div className="autista-360-search-name">
                Ricerca per nome: {nameQueryLabel || "NON DETERMINABILE"}
              </div>
            ) : null}
            <h1 className="autista-360-title">Profilo autista</h1>
            <div className="autista-360-name">{headerName}</div>
            <div className={`autista-360-session ${activeSession ? "is-active" : ""}`}>
              {activeSessionLabel}
            </div>
          </div>
          <div className="autista-360-stats">
            {FILTER_TYPES.filter((type) => type !== "All").map((type) => {
              const isActive = filterType === type;
              return (
                <button
                  key={type}
                  type="button"
                  className={`autista-360-stat ${isActive ? "is-active" : ""}`}
                  aria-pressed={isActive}
                  onClick={() =>
                    setFilterType((current) => (current === type ? "All" : type))
                  }
                >
                  <span className="autista-360-stat-label">{type}</span>
                  <span className="autista-360-stat-value">{typeCounts[type] || 0}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="autista-360-card autista-360-filters-card">
          <div className="autista-360-filters">
            <label className="filter-field">
              <span>Tipo evento</span>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                {FILTER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="filter-field">
              <span>Targa</span>
              <input
                type="text"
                placeholder="Filtra targa"
                value={filterTarga}
                onChange={(e) => setFilterTarga(e.target.value)}
              />
            </label>
            <label className="filter-field">
              <span>Dal</span>
              <input
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
              />
            </label>
            <label className="filter-field">
              <span>Al</span>
              <input
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
              />
            </label>
          </div>
        </div>

        {showNameMatches ? (
          <div className="autista-360-card autista-360-matches-card">
            <div className="autista-360-matches-head">
              <h2>Possibili match</h2>
              <span>{nameMatches.length} trovati</span>
            </div>
            <div className="match-list">
              {limitedMatches.map((match) => {
                const badgeLabel = match.badgeLabel || "NON DETERMINABILE";
                const isSelectable = !match.badgeLabel;
                const isActive = selectedNameBadgeKey === match.badgeKey;
                return (
                  <button
                    key={`${match.badgeKey}-${match.nameLabel}`}
                    type="button"
                    className={`match-item ${isActive ? "is-active" : ""}`}
                    onClick={() => {
                      if (match.badgeLabel) {
                        navigate(`/autista-360/${encodeURIComponent(match.badgeLabel)}`);
                        return;
                      }
                      if (!isSelectable) return;
                      setSelectedNameBadgeKey((current) =>
                        current === match.badgeKey ? null : match.badgeKey
                      );
                    }}
                  >
                    <div className="match-item-main">
                      <div className="match-name">{match.nameLabel}</div>
                      <div className="match-badge">Badge {badgeLabel}</div>
                    </div>
                    <div className="match-count">{match.count} eventi</div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="autista-360-card autista-360-timeline-card">
          <div className="autista-360-timeline-head">
            <h2>Timeline</h2>
            <span>{filteredEvents.length} eventi</span>
          </div>
          {loading ? (
            <div className="timeline-empty">Caricamento dati...</div>
          ) : noNameMatches ? (
            <div className="timeline-empty">Nessun autista trovato</div>
          ) : filteredEvents.length === 0 ? (
            <div className="timeline-empty">Nessun evento trovato</div>
          ) : (
            <div className="timeline-list">
              {filteredEvents.map((event, index) => {
                const meta = event.subtitle || "";
                const detailRows: Array<{ label: string; value: string }> = [
                  { label: "SourceKey", value: event.sourceKey },
                  {
                    label: "TS originale",
                    value: event.tsRaw || (event.ts ? String(event.ts) : "-"),
                  },
                  { label: "Targa estratta", value: event.targa },
                ];
                if (event.targaCamion) {
                  detailRows.push({ label: "Targa camion", value: event.targaCamion });
                }
                if (event.targaRimorchio) {
                  detailRows.push({
                    label: "Targa rimorchio",
                    value: event.targaRimorchio,
                  });
                }
                if (event.beforeMotrice || event.afterMotrice) {
                  detailRows.push({
                    label: "Motrice",
                    value: `${event.beforeMotrice || "-"} -> ${event.afterMotrice || "-"}`,
                  });
                }
                if (event.beforeRimorchio || event.afterRimorchio) {
                  detailRows.push({
                    label: "Rimorchio",
                    value: `${event.beforeRimorchio || "-"} -> ${event.afterRimorchio || "-"}`,
                  });
                }
                if (event.rawRefId) {
                  detailRows.push({ label: "Id/Ref", value: event.rawRefId });
                }
                return (
                  <div
                    key={`${event.sourceKey}-${event.rawRefId || index}`}
                    className="timeline-row"
                  >
                    <div className="timeline-date">{event.dateLabel}</div>
                    <div className="timeline-body">
                      <div className="timeline-title">
                        <span className={typeClassName(event.type)}>{event.type}</span>
                        <span className="timeline-title-text">{event.title}</span>
                        {event.badgeMatch === "WEAK" ? (
                          <span className="match-pill">MATCH DEBOLE</span>
                        ) : null}
                        {event.photo ? <span className="photo-pill">📷 Foto</span> : null}
                      </div>
                      {meta ? <div className="timeline-meta">{meta}</div> : null}
                      <details className="timeline-details">
                        <summary>Dettagli</summary>
                        <div className="timeline-details-body">
                          {detailRows.map((row) => (
                            <div key={row.label} className="timeline-details-row">
                              <span className="timeline-details-label">{row.label}:</span>
                              <span>{row.value}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Autista360;
