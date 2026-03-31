import { normalizeNextMezzoTarga } from "../nextAnagraficheFlottaDomain";
import {
  getNextAutistiCloneControlli,
  type NextAutistiCloneControlloRecord,
} from "../autisti/nextAutistiCloneState";
import {
  getNextAutistiCloneRichiesteAttrezzature,
  type NextAutistiCloneRichiestaAttrezzatureRecord,
} from "../autisti/nextAutistiCloneRichiesteAttrezzature";
import {
  getNextAutistiCloneSegnalazioni,
  type NextAutistiCloneSegnalazioneRecord,
} from "../autisti/nextAutistiCloneSegnalazioni";
import { namespaceNextAutistiStorageKey } from "../autisti/nextAutistiCloneRuntime";
import {
  readNextUnifiedCollection,
  readNextUnifiedStorageDocument,
} from "./nextUnifiedReadRegistryDomain";
import { readNextAutistiStorageOverlay } from "../autisti/nextAutistiStorageSync";

const SESSIONI_KEY = "@autisti_sessione_attive";
const EVENTI_KEY = "@storico_eventi_operativi";
const SEGNALAZIONI_KEY = "@segnalazioni_autisti_tmp";
const CONTROLLI_KEY = "@controlli_mezzo_autisti";
const RICHIESTE_KEY = "@richieste_attrezzature_autisti_tmp";
const AUTISTI_EVENTI_COLLECTION = "autisti_eventi";

type RawRecord = Record<string, unknown>;

export const NEXT_AUTISTI_DOMAIN = {
  code: "D03",
  name: "Autisti, badge, sessioni ed eventi di campo",
  logicalDatasets: [
    SESSIONI_KEY,
    EVENTI_KEY,
    SEGNALAZIONI_KEY,
    CONTROLLI_KEY,
    RICHIESTE_KEY,
    AUTISTI_EVENTI_COLLECTION,
    "@autista_attivo_local",
    "@mezzo_attivo_autista_local",
  ] as const,
  activeReadOnlyDatasets: [
    SESSIONI_KEY,
    EVENTI_KEY,
    SEGNALAZIONI_KEY,
    CONTROLLI_KEY,
    RICHIESTE_KEY,
  ] as const,
  localCloneDatasets: [
    "@next_clone_autisti:autista",
    "@next_clone_autisti:mezzo",
    "@next_clone_autisti:controlli",
    "@next_clone_autisti:segnalazioni",
    "@next_clone_autisti:richieste-attrezzature",
  ] as const,
  normalizationStrategy:
    "READ MODEL D03 NEXT dedicato: madre read-only forte + legacy prudente + clone locale esplicito",
} as const;

export type NextAutistiLinkReliability =
  | "forte"
  | "prudente"
  | "locale_clone"
  | "non_dimostrabile";

export type NextAutistiDataOrigin =
  | "madre_storage"
  | "madre_collection_legacy"
  | "next_clone_locale";

export type NextAutistiAssignmentSource =
  | "sessione_attiva"
  | "storico_evento"
  | "clone_locale";

export type NextAutistiSignalKind =
  | "segnalazione"
  | "controllo"
  | "richiesta_attrezzature"
  | "evento_legacy"
  | "clone_segnalazione"
  | "clone_controllo"
  | "clone_richiesta_attrezzature";

export type NextAutistiCanonicalAssignment = {
  id: string;
  autistaNome: string | null;
  badgeAutista: string | null;
  targaMotrice: string | null;
  targaRimorchio: string | null;
  mezzoTarga: string | null;
  sessionStatus: string | null;
  timestamp: number | null;
  sourceDataset: string;
  sourceOrigin: NextAutistiDataOrigin;
  sourceKind: NextAutistiAssignmentSource;
  linkReliability: NextAutistiLinkReliability;
  flags: string[];
};

export type NextAutistiCanonicalSignal = {
  id: string;
  kind: NextAutistiSignalKind;
  titolo: string;
  descrizione: string;
  autistaNome: string | null;
  badgeAutista: string | null;
  targaMotrice: string | null;
  targaRimorchio: string | null;
  mezzoTarga: string | null;
  timestamp: number | null;
  requiresAttention: boolean;
  sourceDataset: string;
  sourceOrigin: NextAutistiDataOrigin;
  linkReliability: NextAutistiLinkReliability;
  flags: string[];
};

export type NextAutistiBoundaryItem = {
  id: string;
  title: string;
  count: number;
  statusLabel: "forte" | "prudente" | "locale" | "vuoto";
  note: string;
};

export type NextAutistiSegnalazioneSectionItem = {
  id: string;
  timestamp: number | null;
  targa: string | null;
  autistaNome: string | null;
  badgeAutista: string | null;
  tipo: string;
  descrizione: string;
  stato: string;
  letta: boolean | null;
  isNuova: boolean;
  fotoCount: number;
  sourceDataset: string;
  sourceOrigin: NextAutistiDataOrigin;
  flags: string[];
};

export type NextAutistiControlloSectionItem = {
  id: string;
  timestamp: number | null;
  targaMotrice: string | null;
  targaRimorchio: string | null;
  autistaNome: string | null;
  badgeAutista: string | null;
  koList: string[];
  isKo: boolean;
  note: string | null;
  sourceDataset: string;
  sourceOrigin: NextAutistiDataOrigin;
  flags: string[];
};

export type NextAutistiRichiestaSectionItem = {
  id: string;
  timestamp: number | null;
  targa: string | null;
  autistaNome: string | null;
  badgeAutista: string | null;
  testo: string;
  stato: string;
  letta: boolean | null;
  isNuova: boolean;
  hasFoto: boolean;
  sourceDataset: string;
  sourceOrigin: NextAutistiDataOrigin;
  flags: string[];
};

export type NextAutistiLocalContext = {
  autistaNome: string | null;
  badgeAutista: string | null;
  targaMotrice: string | null;
  targaRimorchio: string | null;
  notes: string[];
};

export type NextAutistiReadOnlySnapshot = {
  generatedAt: string;
  assignments: NextAutistiCanonicalAssignment[];
  signals: NextAutistiCanonicalSignal[];
  segnalazioniRows: NextAutistiSegnalazioneSectionItem[];
  controlliRows: NextAutistiControlloSectionItem[];
  richiesteRows: NextAutistiRichiestaSectionItem[];
  anomalies: string[];
  boundaries: NextAutistiBoundaryItem[];
  localContext: NextAutistiLocalContext;
  operationalStatus: {
    label: string;
    note: string;
    reliability: "affidabile" | "prudente" | "locale" | "da_verificare";
  };
  counts: {
    activeSessions: number;
    assignmentsStrong: number;
    assignmentsPrudent: number;
    attentionSignalsMother: number;
    attentionSignalsLocal: number;
    totalSignals: number;
    anomalies: number;
    legacyEvents: number;
  };
  limitations: string[];
};

type ReadNextAutistiReadOnlySnapshotOptions = {
  includeLocalClone?: boolean;
  includeStorageOverlay?: boolean;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeOptionalBadge(value: unknown): string | null {
  const normalized = normalizeOptionalText(value);
  return normalized ? normalized.replace(/\s+/g, "") : null;
}

function normalizeOptionalTarga(value: unknown): string | null {
  const normalized = normalizeOptionalText(value);
  return normalized ? normalizeNextMezzoTarga(normalized) ?? null : null;
}

function normalizeLowerText(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function normalizeFreeText(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function toTimestamp(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value > 1_000_000_000_000) return value;
    if (value > 1_000_000_000) return value * 1000;
  }

  const raw = normalizeOptionalText(value);
  if (!raw) return null;

  const numeric = Number(raw);
  if (Number.isFinite(numeric)) {
    if (numeric > 1_000_000_000_000) return numeric;
    if (numeric > 1_000_000_000) return numeric * 1000;
  }

  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function stableId(parts: Array<string | number | null | undefined>): string {
  return parts
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join("|");
}

function truncateText(value: string, maxLength: number): string {
  const trimmed = normalizeFreeText(value);
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function readLocalJsonRecord(key: string): RawRecord | null {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as RawRecord)
      : null;
  } catch {
    return null;
  }
}

function pickPrimaryTarga(record: {
  targa?: unknown;
  targaCamion?: unknown;
  targaMotrice?: unknown;
  targaRimorchio?: unknown;
}): {
  motrice: string | null;
  rimorchio: string | null;
  mezzo: string | null;
} {
  const motrice = normalizeOptionalTarga(
    record.targaMotrice ?? record.targaCamion ?? record.targa,
  );
  const rimorchio = normalizeOptionalTarga(record.targaRimorchio);
  return {
    motrice,
    rimorchio,
    mezzo: motrice ?? rimorchio,
  };
}

function normalizeSessionAssignment(
  record: RawRecord,
  index: number,
): NextAutistiCanonicalAssignment {
  const targa = pickPrimaryTarga(record);
  const autistaNome = normalizeOptionalText(
    record.nomeAutista ?? record.autistaNome ?? record.autista,
  );
  const badgeAutista = normalizeOptionalBadge(record.badgeAutista ?? record.badge);
  const flags: string[] = [];

  if (!autistaNome) flags.push("missing_nome_autista");
  if (!badgeAutista) flags.push("missing_badge");
  if (!targa.mezzo) flags.push("missing_targa");

  return {
    id:
      normalizeOptionalText(record.id) ??
      `sessione:${stableId([badgeAutista, targa.mezzo, index])}`,
    autistaNome,
    badgeAutista,
    targaMotrice: targa.motrice,
    targaRimorchio: targa.rimorchio,
    mezzoTarga: targa.mezzo,
    sessionStatus:
      normalizeOptionalText(record.statoSessione ?? record.stato ?? record.sessione) ?? null,
    timestamp: toTimestamp(record.timestamp),
    sourceDataset: SESSIONI_KEY,
    sourceOrigin: "madre_storage",
    sourceKind: "sessione_attiva",
    linkReliability:
      targa.mezzo && (badgeAutista || autistaNome)
        ? "forte"
        : targa.mezzo
          ? "prudente"
          : "non_dimostrabile",
    flags,
  };
}

function normalizeEventAssignment(
  record: RawRecord,
  index: number,
  sourceOrigin: NextAutistiDataOrigin,
  sourceDataset: string,
): NextAutistiCanonicalAssignment | null {
  const prima = record.prima && typeof record.prima === "object" ? (record.prima as RawRecord) : null;
  const dopo = record.dopo && typeof record.dopo === "object" ? (record.dopo as RawRecord) : null;
  const targaMotrice =
    normalizeOptionalTarga(
      record.dopoMotrice ??
        record.targaMotrice ??
        record.targaCamion ??
        dopo?.motrice ??
        dopo?.targaMotrice ??
        dopo?.targaCamion,
    ) ??
    normalizeOptionalTarga(
      record.primaMotrice ?? prima?.motrice ?? prima?.targaMotrice ?? prima?.targaCamion,
    );
  const targaRimorchio =
    normalizeOptionalTarga(
      record.dopoRimorchio ?? record.targaRimorchio ?? dopo?.rimorchio ?? dopo?.targaRimorchio,
    ) ??
    normalizeOptionalTarga(
      record.primaRimorchio ?? prima?.rimorchio ?? prima?.targaRimorchio,
    );
  const mezzoTarga = targaMotrice ?? targaRimorchio;
  const autistaNome = normalizeOptionalText(
    record.nomeAutista ?? record.autistaNome ?? record.autista,
  );
  const badgeAutista = normalizeOptionalBadge(record.badgeAutista ?? record.badge);
  const timestamp = toTimestamp(record.timestamp ?? record.data);
  const flags: string[] = [];

  if (!timestamp) flags.push("missing_timestamp");
  if (!mezzoTarga) flags.push("missing_targa");
  if (!badgeAutista && !autistaNome) flags.push("missing_autista");

  if (!mezzoTarga && !badgeAutista && !autistaNome) {
    return null;
  }

  return {
    id:
      normalizeOptionalText(record.id) ??
      `evento:${stableId([badgeAutista, autistaNome, mezzoTarga, timestamp, index])}`,
    autistaNome,
    badgeAutista,
    targaMotrice,
    targaRimorchio,
    mezzoTarga,
    sessionStatus: normalizeOptionalText(record.tipo ?? record.tipoOperativo ?? record.stato),
    timestamp,
    sourceDataset,
    sourceOrigin,
    sourceKind: "storico_evento",
    linkReliability:
      mezzoTarga && (badgeAutista || autistaNome)
        ? sourceOrigin === "madre_collection_legacy"
          ? "prudente"
          : "forte"
        : mezzoTarga || badgeAutista || autistaNome
          ? "prudente"
          : "non_dimostrabile",
    flags,
  };
}

function isHighSeverity(value: unknown): boolean {
  const normalized = normalizeLowerText(value);
  return (
    normalized.includes("alta") ||
    normalized.includes("urgent") ||
    normalized.includes("urgente") ||
    normalized.includes("grave") ||
    normalized.includes("crit")
  );
}

function buildSignalTitle(kind: NextAutistiSignalKind, rawTitle: string | null): string {
  if (rawTitle) {
    return rawTitle;
  }

  switch (kind) {
    case "segnalazione":
    case "clone_segnalazione":
      return "Segnalazione autista";
    case "controllo":
    case "clone_controllo":
      return "Controllo autista";
    case "richiesta_attrezzature":
    case "clone_richiesta_attrezzature":
      return "Richiesta attrezzature";
    default:
      return "Evento autista";
  }
}

function normalizeSegnalazioneSignal(
  record: RawRecord,
  index: number,
): NextAutistiCanonicalSignal {
  const targa = pickPrimaryTarga(record);
  const titolo = buildSignalTitle(
    "segnalazione",
    normalizeOptionalText(record.tipoProblema ?? record.titolo),
  );
  const descrizione = truncateText(
    normalizeFreeText(record.descrizione ?? record.note ?? record.messaggio ?? titolo),
    120,
  );
  const requiresAttention =
    record.letta === false ||
    normalizeLowerText(record.stato) === "nuova" ||
    record.flagVerifica === true ||
    isHighSeverity(record.urgenza ?? record.priorita ?? record.gravita ?? record.severity);
  const flags: string[] = [];

  if (!targa.mezzo) flags.push("missing_targa");
  if (!normalizeOptionalBadge(record.badgeAutista) && !normalizeOptionalText(record.autistaNome)) {
    flags.push("missing_autista");
  }

  return {
    id:
      normalizeOptionalText(record.id) ??
      `segnalazione:${stableId([
        targa.mezzo,
        normalizeOptionalBadge(record.badgeAutista ?? record.badge),
        index,
      ])}`,
    kind: "segnalazione",
    titolo,
    descrizione,
    autistaNome: normalizeOptionalText(record.autistaNome ?? record.nomeAutista),
    badgeAutista: normalizeOptionalBadge(record.badgeAutista ?? record.badge),
    targaMotrice: targa.motrice,
    targaRimorchio: targa.rimorchio,
    mezzoTarga: targa.mezzo,
    timestamp: toTimestamp(record.timestamp ?? record.data),
    requiresAttention,
    sourceDataset: SEGNALAZIONI_KEY,
    sourceOrigin: "madre_storage",
    linkReliability: targa.mezzo ? "forte" : "prudente",
    flags,
  };
}

function normalizeSegnalazioneSectionItem(
  record: RawRecord,
  index: number,
): NextAutistiSegnalazioneSectionItem {
  const targa = pickPrimaryTarga(record);
  const letta = typeof record.letta === "boolean" ? record.letta : null;
  return {
    id:
      normalizeOptionalText(record.id) ??
      `segnalazione:${stableId([
        targa.mezzo,
        normalizeOptionalBadge(record.badgeAutista ?? record.badge),
        index,
      ])}`,
    timestamp: toTimestamp(record.timestamp ?? record.data),
    targa: targa.mezzo,
    autistaNome: normalizeOptionalText(record.autistaNome ?? record.nomeAutista),
    badgeAutista: normalizeOptionalBadge(record.badgeAutista ?? record.badge),
    tipo: normalizeOptionalText(record.tipoProblema ?? record.tipo ?? record.titolo) ?? "-",
    descrizione:
      normalizeOptionalText(record.descrizione ?? record.note ?? record.messaggio) ?? "-",
    stato: normalizeOptionalText(record.stato)?.toUpperCase() ?? "-",
    letta,
    isNuova: letta === false || normalizeLowerText(record.stato) === "nuova",
    fotoCount: Array.isArray(record.fotoUrls) ? record.fotoUrls.filter(Boolean).length : 0,
    sourceDataset: SEGNALAZIONI_KEY,
    sourceOrigin: "madre_storage",
    flags: [
      !targa.mezzo ? "missing_targa" : "",
      !normalizeOptionalBadge(record.badgeAutista ?? record.badge) &&
      !normalizeOptionalText(record.autistaNome ?? record.nomeAutista)
        ? "missing_autista"
        : "",
    ].filter(Boolean),
  };
}

function extractCloneControlloIssues(record: NextAutistiCloneControlloRecord): string[] {
  return Object.entries(record.check)
    .filter(([, value]) => value === false)
    .map(([key]) => key.toUpperCase());
}

function normalizeControlloSignal(record: RawRecord, index: number): NextAutistiCanonicalSignal {
  const targa = pickPrimaryTarga(record);
  const koItems: string[] = [];

  if (record.check && typeof record.check === "object" && !Array.isArray(record.check)) {
    Object.entries(record.check as RawRecord).forEach(([key, value]) => {
      if (value === false) {
        koItems.push(String(key).toUpperCase());
      }
    });
  }
  if (Array.isArray(record.koItems)) {
    record.koItems.forEach((entry) => {
      if (typeof entry === "string" && entry.trim()) {
        koItems.push(entry.trim());
      }
    });
  }

  const isKo =
    record.ko === true ||
    record.ok === false ||
    record.tuttoOk === false ||
    normalizeLowerText(record.esito) === "ko" ||
    koItems.length > 0;
  const flags: string[] = [];

  if (!targa.mezzo) flags.push("missing_targa");
  if (!normalizeOptionalBadge(record.badgeAutista) && !normalizeOptionalText(record.autistaNome)) {
    flags.push("missing_autista");
  }

  return {
    id:
      normalizeOptionalText(record.id) ??
      `controllo:${stableId([
        targa.mezzo,
        normalizeOptionalBadge(record.badgeAutista ?? record.badge),
        index,
      ])}`,
    kind: "controllo",
    titolo: buildSignalTitle("controllo", koItems.length > 0 ? "Controllo KO" : null),
    descrizione: truncateText(
      koItems.length > 0
        ? `KO: ${koItems.slice(0, 4).join(", ")}`
        : normalizeFreeText(record.note ?? record.dettaglio ?? "Controllo autista"),
      120,
    ),
    autistaNome: normalizeOptionalText(record.autistaNome ?? record.nomeAutista),
    badgeAutista: normalizeOptionalBadge(record.badgeAutista ?? record.badge),
    targaMotrice: targa.motrice,
    targaRimorchio: targa.rimorchio,
    mezzoTarga: targa.mezzo,
    timestamp: toTimestamp(record.timestamp ?? record.data),
    requiresAttention: isKo,
    sourceDataset: CONTROLLI_KEY,
    sourceOrigin: "madre_storage",
    linkReliability: targa.mezzo ? "forte" : "prudente",
    flags,
  };
}

function normalizeControlloSectionItem(
  record: RawRecord,
  index: number,
): NextAutistiControlloSectionItem {
  const targa = pickPrimaryTarga(record);
  const koList: string[] = [];

  if (record.check && typeof record.check === "object" && !Array.isArray(record.check)) {
    Object.entries(record.check as RawRecord).forEach(([key, value]) => {
      if (value === false) {
        koList.push(String(key).toUpperCase());
      }
    });
  }

  if (Array.isArray(record.koItems)) {
    record.koItems.forEach((entry) => {
      if (typeof entry === "string" && entry.trim()) {
        koList.push(entry.trim().toUpperCase());
      }
    });
  }

  return {
    id:
      normalizeOptionalText(record.id) ??
      `controllo:${stableId([
        targa.mezzo,
        normalizeOptionalBadge(record.badgeAutista ?? record.badge),
        index,
      ])}`,
    timestamp: toTimestamp(record.timestamp ?? record.data),
    targaMotrice: targa.motrice,
    targaRimorchio: targa.rimorchio,
    autistaNome: normalizeOptionalText(record.autistaNome ?? record.nomeAutista),
    badgeAutista: normalizeOptionalBadge(record.badgeAutista ?? record.badge),
    koList,
    isKo:
      record.ko === true ||
      record.ok === false ||
      record.tuttoOk === false ||
      normalizeLowerText(record.esito) === "ko" ||
      koList.length > 0,
    note: normalizeOptionalText(record.note ?? record.dettaglio ?? record.messaggio),
    sourceDataset: CONTROLLI_KEY,
    sourceOrigin: "madre_storage",
    flags: [
      !targa.mezzo ? "missing_targa" : "",
      !normalizeOptionalBadge(record.badgeAutista ?? record.badge) &&
      !normalizeOptionalText(record.autistaNome ?? record.nomeAutista)
        ? "missing_autista"
        : "",
    ].filter(Boolean),
  };
}

function normalizeRichiestaSignal(record: RawRecord, index: number): NextAutistiCanonicalSignal {
  const targa = pickPrimaryTarga(record);
  const flags: string[] = [];

  if (!targa.mezzo) flags.push("missing_targa");
  if (!normalizeOptionalBadge(record.badgeAutista) && !normalizeOptionalText(record.autistaNome)) {
    flags.push("missing_autista");
  }

  return {
    id:
      normalizeOptionalText(record.id) ??
      `richiesta:${stableId([
        targa.mezzo,
        normalizeOptionalBadge(record.badgeAutista ?? record.badge),
        index,
      ])}`,
    kind: "richiesta_attrezzature",
    titolo: buildSignalTitle("richiesta_attrezzature", "Richiesta attrezzature"),
    descrizione: truncateText(
      normalizeFreeText(record.testo ?? record.descrizione ?? record.note ?? "Richiesta attrezzature"),
      120,
    ),
    autistaNome: normalizeOptionalText(record.autistaNome ?? record.nomeAutista),
    badgeAutista: normalizeOptionalBadge(record.badgeAutista ?? record.badge),
    targaMotrice: targa.motrice,
    targaRimorchio: targa.rimorchio,
    mezzoTarga: targa.mezzo,
    timestamp: toTimestamp(record.timestamp ?? record.data),
    requiresAttention:
      record.letta === false || normalizeLowerText(record.stato) === "nuova",
    sourceDataset: RICHIESTE_KEY,
    sourceOrigin: "madre_storage",
    linkReliability: targa.mezzo ? "forte" : "prudente",
    flags,
  };
}

function normalizeRichiestaSectionItem(
  record: RawRecord,
  index: number,
): NextAutistiRichiestaSectionItem {
  const targa = pickPrimaryTarga(record);
  const letta = typeof record.letta === "boolean" ? record.letta : null;
  return {
    id:
      normalizeOptionalText(record.id) ??
      `richiesta:${stableId([
        targa.mezzo,
        normalizeOptionalBadge(record.badgeAutista ?? record.badge),
        index,
      ])}`,
    timestamp: toTimestamp(record.timestamp ?? record.data),
    targa: targa.mezzo,
    autistaNome: normalizeOptionalText(record.autistaNome ?? record.nomeAutista),
    badgeAutista: normalizeOptionalBadge(record.badgeAutista ?? record.badge),
    testo:
      normalizeOptionalText(record.testo ?? record.descrizione ?? record.note) ?? "-",
    stato: normalizeOptionalText(record.stato)?.toUpperCase() ?? "-",
    letta,
    isNuova: letta === false || normalizeLowerText(record.stato) === "nuova",
    hasFoto: Boolean(normalizeOptionalText(record.fotoUrl)),
    sourceDataset: RICHIESTE_KEY,
    sourceOrigin: "madre_storage",
    flags: [
      !targa.mezzo ? "missing_targa" : "",
      !normalizeOptionalBadge(record.badgeAutista ?? record.badge) &&
      !normalizeOptionalText(record.autistaNome ?? record.nomeAutista)
        ? "missing_autista"
        : "",
    ].filter(Boolean),
  };
}

function normalizeCloneSegnalazioneSignal(
  record: NextAutistiCloneSegnalazioneRecord,
  index: number,
): NextAutistiCanonicalSignal {
  return {
    id: record.id || `clone-segnalazione:${index}`,
    kind: "clone_segnalazione",
    titolo: buildSignalTitle("clone_segnalazione", record.tipoProblema),
    descrizione: truncateText(record.descrizione || record.note || "Segnalazione locale clone", 120),
    autistaNome: record.autistaNome,
    badgeAutista: record.badgeAutista,
    targaMotrice: normalizeOptionalTarga(record.targaCamion),
    targaRimorchio: normalizeOptionalTarga(record.targaRimorchio),
    mezzoTarga: normalizeOptionalTarga(record.targa ?? record.targaCamion ?? record.targaRimorchio),
    timestamp: toTimestamp(record.data),
    requiresAttention: true,
    sourceDataset: "@next_clone_autisti:segnalazioni",
    sourceOrigin: "next_clone_locale",
    linkReliability: "locale_clone",
    flags: ["local_only", "non_sincronizzato"],
  };
}

function normalizeCloneSegnalazioneSectionItem(
  record: NextAutistiCloneSegnalazioneRecord,
  index: number,
): NextAutistiSegnalazioneSectionItem {
  return {
    id: record.id || `clone-segnalazione:${index}`,
    timestamp: toTimestamp(record.data),
    targa: normalizeOptionalTarga(record.targa ?? record.targaCamion ?? record.targaRimorchio),
    autistaNome: record.autistaNome,
    badgeAutista: record.badgeAutista,
    tipo: record.tipoProblema || "-",
    descrizione: record.descrizione || record.note || "-",
    stato: String(record.stato || "NUOVA").toUpperCase(),
    letta: record.letta,
    isNuova: true,
    fotoCount: Array.isArray(record.fotoUrls) ? record.fotoUrls.filter(Boolean).length : 0,
    sourceDataset: "@next_clone_autisti:segnalazioni",
    sourceOrigin: "next_clone_locale",
    flags: ["local_only", "non_sincronizzato"],
  };
}

function normalizeCloneControlloSignal(
  record: NextAutistiCloneControlloRecord,
  index: number,
): NextAutistiCanonicalSignal {
  const issues = extractCloneControlloIssues(record);
  return {
    id: record.id || `clone-controllo:${index}`,
    kind: "clone_controllo",
    titolo: buildSignalTitle(
      "clone_controllo",
      issues.length > 0 ? "Controllo locale con KO" : "Controllo locale",
    ),
    descrizione: truncateText(
      issues.length > 0 ? `KO: ${issues.join(", ")}` : record.note ?? "Controllo locale clone",
      120,
    ),
    autistaNome: record.autistaNome,
    badgeAutista: record.badgeAutista,
    targaMotrice: normalizeOptionalTarga(record.targaCamion),
    targaRimorchio: normalizeOptionalTarga(record.targaRimorchio),
    mezzoTarga: normalizeOptionalTarga(record.targaCamion ?? record.targaRimorchio),
    timestamp: toTimestamp(record.timestamp),
    requiresAttention: true,
    sourceDataset: "@next_clone_autisti:controlli",
    sourceOrigin: "next_clone_locale",
    linkReliability: "locale_clone",
    flags: ["local_only", "non_sincronizzato"],
  };
}

function normalizeCloneControlloSectionItem(
  record: NextAutistiCloneControlloRecord,
  index: number,
): NextAutistiControlloSectionItem {
  const issues = extractCloneControlloIssues(record);
  return {
    id: record.id || `clone-controllo:${index}`,
    timestamp: toTimestamp(record.timestamp),
    targaMotrice: normalizeOptionalTarga(record.targaCamion),
    targaRimorchio: normalizeOptionalTarga(record.targaRimorchio),
    autistaNome: record.autistaNome,
    badgeAutista: record.badgeAutista,
    koList: issues,
    isKo: issues.length > 0,
    note: record.note,
    sourceDataset: "@next_clone_autisti:controlli",
    sourceOrigin: "next_clone_locale",
    flags: ["local_only", "non_sincronizzato"],
  };
}

function normalizeCloneRichiestaSignal(
  record: NextAutistiCloneRichiestaAttrezzatureRecord,
  index: number,
): NextAutistiCanonicalSignal {
  return {
    id: record.id || `clone-richiesta:${index}`,
    kind: "clone_richiesta_attrezzature",
    titolo: buildSignalTitle(
      "clone_richiesta_attrezzature",
      "Richiesta attrezzature locale",
    ),
    descrizione: truncateText(record.testo || "Richiesta attrezzature locale clone", 120),
    autistaNome: record.autistaNome,
    badgeAutista: record.badgeAutista,
    targaMotrice: normalizeOptionalTarga(record.targaCamion),
    targaRimorchio: normalizeOptionalTarga(record.targaRimorchio),
    mezzoTarga: normalizeOptionalTarga(record.targaCamion ?? record.targaRimorchio),
    timestamp: toTimestamp(record.timestamp),
    requiresAttention: true,
    sourceDataset: "@next_clone_autisti:richieste-attrezzature",
    sourceOrigin: "next_clone_locale",
    linkReliability: "locale_clone",
    flags: ["local_only", "non_sincronizzato"],
  };
}

function normalizeCloneRichiestaSectionItem(
  record: NextAutistiCloneRichiestaAttrezzatureRecord,
  index: number,
): NextAutistiRichiestaSectionItem {
  return {
    id: record.id || `clone-richiesta:${index}`,
    timestamp: toTimestamp(record.timestamp),
    targa: normalizeOptionalTarga(record.targaCamion ?? record.targaRimorchio),
    autistaNome: record.autistaNome,
    badgeAutista: record.badgeAutista,
    testo: record.testo || "-",
    stato: String(record.stato || "NUOVA").toUpperCase(),
    letta: record.letta,
    isNuova: true,
    hasFoto: Boolean(record.fotoUrl),
    sourceDataset: "@next_clone_autisti:richieste-attrezzature",
    sourceOrigin: "next_clone_locale",
    flags: ["local_only", "non_sincronizzato"],
  };
}

function normalizeCloneAssignment(args: {
  autistaLocal: RawRecord | null;
  mezzoLocal: RawRecord | null;
}): NextAutistiCanonicalAssignment[] {
  const autistaNome = normalizeOptionalText(
    args.autistaLocal?.nome ?? args.autistaLocal?.nomeAutista ?? args.autistaLocal?.autistaNome,
  );
  const badgeAutista = normalizeOptionalBadge(
    args.autistaLocal?.badge ?? args.autistaLocal?.badgeAutista,
  );
  const targaMotrice = normalizeOptionalTarga(
    args.mezzoLocal?.targaCamion ?? args.mezzoLocal?.targaMotrice ?? args.mezzoLocal?.targa,
  );
  const targaRimorchio = normalizeOptionalTarga(args.mezzoLocal?.targaRimorchio);
  const mezzoTarga = targaMotrice ?? targaRimorchio;

  if (!autistaNome && !badgeAutista && !mezzoTarga) {
    return [];
  }

  return [
    {
      id: `clone-assignment:${stableId([badgeAutista, autistaNome, mezzoTarga])}`,
      autistaNome,
      badgeAutista,
      targaMotrice,
      targaRimorchio,
      mezzoTarga,
      sessionStatus: "Locale clone",
      timestamp: null,
      sourceDataset: "@next_clone_autisti:autista+mezzo",
      sourceOrigin: "next_clone_locale",
      sourceKind: "clone_locale",
      linkReliability:
        mezzoTarga && (badgeAutista || autistaNome) ? "locale_clone" : "non_dimostrabile",
      flags: ["local_only", "non_sincronizzato"],
    },
  ];
}

function dedupeAssignments(
  assignments: NextAutistiCanonicalAssignment[],
): NextAutistiCanonicalAssignment[] {
  const scoreMap: Record<NextAutistiLinkReliability, number> = {
    forte: 4,
    prudente: 3,
    locale_clone: 2,
    non_dimostrabile: 1,
  };
  const map = new Map<string, NextAutistiCanonicalAssignment>();

  assignments.forEach((entry) => {
    const key = stableId([
      entry.badgeAutista,
      entry.autistaNome?.toLowerCase(),
      entry.mezzoTarga,
      entry.sourceKind === "sessione_attiva" ? "sessione" : "altro",
    ]);
    const current = map.get(key);
    if (!current) {
      map.set(key, entry);
      return;
    }

    const currentScore = scoreMap[current.linkReliability];
    const nextScore = scoreMap[entry.linkReliability];
    const currentTs = current.timestamp ?? 0;
    const nextTs = entry.timestamp ?? 0;
    if (nextScore > currentScore || (nextScore === currentScore && nextTs > currentTs)) {
      map.set(key, entry);
    }
  });

  return Array.from(map.values()).sort((left, right) => {
    const scoreDelta = scoreMap[right.linkReliability] - scoreMap[left.linkReliability];
    if (scoreDelta !== 0) {
      return scoreDelta;
    }
    return (right.timestamp ?? 0) - (left.timestamp ?? 0);
  });
}

function dedupeSignals(signals: NextAutistiCanonicalSignal[]): NextAutistiCanonicalSignal[] {
  const map = new Map<string, NextAutistiCanonicalSignal>();

  signals.forEach((entry) => {
    const key = stableId([
      entry.kind,
      entry.badgeAutista,
      entry.mezzoTarga,
      entry.descrizione.toLowerCase(),
      entry.timestamp,
    ]);
    if (!map.has(key)) {
      map.set(key, entry);
    }
  });

  return Array.from(map.values()).sort(
    (left, right) => (right.timestamp ?? 0) - (left.timestamp ?? 0),
  );
}

function dedupeSectionItems<
  T extends {
    id: string;
    timestamp: number | null;
  },
>(items: T[]): T[] {
  const map = new Map<string, T>();

  items.forEach((entry) => {
    const current = map.get(entry.id);
    if (!current || (entry.timestamp ?? 0) >= (current.timestamp ?? 0)) {
      map.set(entry.id, entry);
    }
  });

  return Array.from(map.values()).sort(
    (left, right) => (right.timestamp ?? 0) - (left.timestamp ?? 0),
  );
}

function buildAnomalies(args: {
  sessionAssignments: NextAutistiCanonicalAssignment[];
  eventAssignments: NextAutistiCanonicalAssignment[];
  motherSignals: NextAutistiCanonicalSignal[];
  localSignals: NextAutistiCanonicalSignal[];
  legacyRecordsCount: number;
  localContext: NextAutistiLocalContext;
}): string[] {
  const anomalies: string[] = [];

  const sessionMissingFields = args.sessionAssignments.filter(
    (entry) => entry.flags.length > 0,
  ).length;
  if (sessionMissingFields > 0) {
    anomalies.push(
      `${sessionMissingFields} sessioni autista hanno badge, nome o targa incompleti.`,
    );
  }

  const eventMissingFields = args.eventAssignments.filter(
    (entry) => entry.flags.length > 0,
  ).length;
  if (eventMissingFields > 0) {
    anomalies.push(
      `${eventMissingFields} eventi autista usano un aggancio prudente o incompleto.`,
    );
  }

  const signalMissingLinks = args.motherSignals.filter((entry) =>
    entry.flags.includes("missing_targa"),
  ).length;
  if (signalMissingLinks > 0) {
    anomalies.push(
      `${signalMissingLinks} segnali autista non hanno una targa forte collegabile.`,
    );
  }

  if (args.localSignals.length > 0) {
    anomalies.push(
      `${args.localSignals.length} segnali autisti esistono solo nel clone locale e non sincronizzano la madre.`,
    );
  }

  if (args.legacyRecordsCount > 0) {
    anomalies.push(
      `${args.legacyRecordsCount} record arrivano dal fallback legacy autisti_eventi e restano solo prudenziali.`,
    );
  }

  if (
    (args.localContext.badgeAutista || args.localContext.autistaNome) &&
    !args.sessionAssignments.some(
      (entry) =>
        entry.linkReliability === "forte" &&
        (entry.badgeAutista === args.localContext.badgeAutista ||
          entry.autistaNome === args.localContext.autistaNome),
    )
  ) {
    anomalies.push(
      "Il contesto autista locale del clone non trova un aggancio forte nelle sessioni madre correnti.",
    );
  }

  return anomalies;
}

function buildBoundaries(args: {
  sessionCount: number;
  eventCount: number;
  motherSignalCount: number;
  localSignalCount: number;
  legacyCount: number;
}): NextAutistiBoundaryItem[] {
  return [
    {
      id: "madre-storage",
      title: "Madre letta in sola lettura",
      count: args.sessionCount + args.eventCount + args.motherSignalCount,
      statusLabel:
        args.sessionCount + args.eventCount + args.motherSignalCount > 0 ? "forte" : "vuoto",
      note:
        "Sessioni, eventi, segnalazioni, controlli e richieste autisti letti dalla madre senza scritture.",
    },
    {
      id: "clone-locale",
      title: "Flusso locale app autisti clone",
      count: args.localSignalCount,
      statusLabel: args.localSignalCount > 0 ? "locale" : "vuoto",
      note:
        "Segnalazioni, controlli e richieste salvati nel clone restano locali e non sincronizzano la madre.",
    },
    {
      id: "legacy-fallback",
      title: "Fallback legacy autisti_eventi",
      count: args.legacyCount,
      statusLabel: args.legacyCount > 0 ? "prudente" : "vuoto",
      note:
        "Collection legacy letta solo come supporto prudente e mai promossa a fonte forte del dominio.",
    },
  ];
}

function buildOperationalStatus(args: {
  strongAssignments: number;
  motherSignalCount: number;
  localSignalCount: number;
}): NextAutistiReadOnlySnapshot["operationalStatus"] {
  if (args.strongAssignments > 0 || args.motherSignalCount > 0) {
    return {
      label: "Operativo in sola lettura",
      note:
        "Il dominio D03 legge sessioni ed eventi madre in sola lettura e separa in modo esplicito il clone locale autisti.",
      reliability: "prudente",
    };
  }

  if (args.localSignalCount > 0) {
    return {
      label: "Solo locale clone",
      note:
        "Nel browser corrente risultano solo dati locali del clone autisti, senza un aggancio forte alla madre.",
      reliability: "locale",
    };
  }

  return {
    label: "Da verificare",
    note:
      "Le fonti D03 non restituiscono ancora abbastanza dati per un flusso autisti leggibile in modo forte.",
    reliability: "da_verificare",
  };
}

export function findNextAutistiAssignmentsByTarga(
  snapshot: NextAutistiReadOnlySnapshot,
  targa: string | null | undefined,
): NextAutistiCanonicalAssignment[] {
  const normalized = normalizeOptionalTarga(targa);
  if (!normalized) {
    return [];
  }

  const scoreMap: Record<NextAutistiLinkReliability, number> = {
    forte: 4,
    prudente: 3,
    locale_clone: 2,
    non_dimostrabile: 1,
  };

  return snapshot.assignments
    .filter(
      (entry) =>
        entry.mezzoTarga === normalized ||
        entry.targaMotrice === normalized ||
        entry.targaRimorchio === normalized,
    )
    .sort((left, right) => {
      const scoreDelta = scoreMap[right.linkReliability] - scoreMap[left.linkReliability];
      if (scoreDelta !== 0) {
        return scoreDelta;
      }
      return (right.timestamp ?? 0) - (left.timestamp ?? 0);
    });
}

export async function readNextAutistiReadOnlySnapshot(
  now = Date.now(),
  options: ReadNextAutistiReadOnlySnapshotOptions = {},
): Promise<NextAutistiReadOnlySnapshot> {
  const includeLocalClone = options.includeLocalClone !== false;
  const includeStorageOverlay = options.includeStorageOverlay !== false;
  const [
    sessioniResult,
    eventiResult,
    segnalazioniResult,
    controlliResult,
    richiesteResult,
    legacyEventiResult,
  ] = await Promise.all([
    readNextUnifiedStorageDocument({ key: SESSIONI_KEY }),
    readNextUnifiedStorageDocument({ key: EVENTI_KEY }),
    readNextUnifiedStorageDocument({ key: SEGNALAZIONI_KEY }),
    readNextUnifiedStorageDocument({ key: CONTROLLI_KEY }),
    readNextUnifiedStorageDocument({ key: RICHIESTE_KEY }),
    readNextUnifiedCollection({ collectionName: AUTISTI_EVENTI_COLLECTION }),
  ]);

  const cloneAutista = includeLocalClone
    ? readLocalJsonRecord(namespaceNextAutistiStorageKey("@autista_attivo_local"))
    : null;
  const cloneMezzo = includeLocalClone
    ? readLocalJsonRecord(namespaceNextAutistiStorageKey("@mezzo_attivo_autista_local"))
    : null;
  const cloneSegnalazioni = includeLocalClone ? getNextAutistiCloneSegnalazioni() : [];
  const cloneControlli = includeLocalClone ? getNextAutistiCloneControlli() : [];
  const cloneRichieste = includeLocalClone ? getNextAutistiCloneRichiesteAttrezzature() : [];
  const sessioniOverlay = includeStorageOverlay
    ? readNextAutistiStorageOverlay<RawRecord[]>(SESSIONI_KEY)
    : undefined;
  const eventiOverlay = includeStorageOverlay
    ? readNextAutistiStorageOverlay<RawRecord[]>(EVENTI_KEY)
    : undefined;
  const segnalazioniOverlay = includeStorageOverlay
    ? readNextAutistiStorageOverlay<RawRecord[]>(SEGNALAZIONI_KEY)
    : undefined;
  const controlliOverlay = includeStorageOverlay
    ? readNextAutistiStorageOverlay<RawRecord[]>(CONTROLLI_KEY)
    : undefined;
  const richiesteOverlay = includeStorageOverlay
    ? readNextAutistiStorageOverlay<RawRecord[]>(RICHIESTE_KEY)
    : undefined;
  const sessioniRecords = Array.isArray(sessioniOverlay) ? sessioniOverlay : sessioniResult.records;
  const eventiRecords = Array.isArray(eventiOverlay) ? eventiOverlay : eventiResult.records;
  const segnalazioniRecords = Array.isArray(segnalazioniOverlay)
    ? segnalazioniOverlay
    : segnalazioniResult.records;
  const controlliRecords = Array.isArray(controlliOverlay)
    ? controlliOverlay
    : controlliResult.records;
  const richiesteRecords = Array.isArray(richiesteOverlay)
    ? richiesteOverlay
    : richiesteResult.records;

  const sessionAssignments = sessioniRecords.map((record, index) =>
    normalizeSessionAssignment(record, index),
  );
  const eventAssignments = eventiRecords
    .map((record, index) =>
      normalizeEventAssignment(record, index, "madre_storage", EVENTI_KEY),
    )
    .filter((entry): entry is NextAutistiCanonicalAssignment => Boolean(entry));
  const legacyAssignments = legacyEventiResult.records
    .map((record, index) =>
      normalizeEventAssignment(
        record,
        index,
        "madre_collection_legacy",
        AUTISTI_EVENTI_COLLECTION,
      ),
    )
    .filter((entry): entry is NextAutistiCanonicalAssignment => Boolean(entry));
  const localAssignments = normalizeCloneAssignment({
    autistaLocal: cloneAutista,
    mezzoLocal: cloneMezzo,
  });

  const motherSignals = [
    ...segnalazioniRecords.map((record, index) =>
      normalizeSegnalazioneSignal(record, index),
    ),
    ...controlliRecords.map((record, index) =>
      normalizeControlloSignal(record, index),
    ),
    ...richiesteRecords.map((record, index) =>
      normalizeRichiestaSignal(record, index),
    ),
  ];
  const segnalazioniRows = dedupeSectionItems([
    ...segnalazioniRecords.map((record, index) =>
      normalizeSegnalazioneSectionItem(record, index),
    ),
    ...cloneSegnalazioni.map((record, index) =>
      normalizeCloneSegnalazioneSectionItem(record, index),
    ),
  ]);
  const controlliRows = dedupeSectionItems([
    ...controlliRecords.map((record, index) =>
      normalizeControlloSectionItem(record, index),
    ),
    ...cloneControlli.map((record, index) =>
      normalizeCloneControlloSectionItem(record, index),
    ),
  ]);
  const richiesteRows = dedupeSectionItems([
    ...richiesteRecords.map((record, index) =>
      normalizeRichiestaSectionItem(record, index),
    ),
    ...cloneRichieste.map((record, index) =>
      normalizeCloneRichiestaSectionItem(record, index),
    ),
  ]);
  const localSignals = [
    ...cloneSegnalazioni.map((record, index) =>
      normalizeCloneSegnalazioneSignal(record, index),
    ),
    ...cloneControlli.map((record, index) =>
      normalizeCloneControlloSignal(record, index),
    ),
    ...cloneRichieste.map((record, index) =>
      normalizeCloneRichiestaSignal(record, index),
    ),
  ];

  const assignments = dedupeAssignments([
    ...sessionAssignments,
    ...eventAssignments,
    ...legacyAssignments,
    ...localAssignments,
  ]);
  const signals = dedupeSignals([...motherSignals, ...localSignals]).filter((entry) => {
    if (!entry.timestamp) {
      return true;
    }
    return entry.timestamp <= now + 24 * 60 * 60 * 1000;
  });

  const localContext: NextAutistiLocalContext = {
    autistaNome: normalizeOptionalText(
      cloneAutista?.nome ?? cloneAutista?.nomeAutista ?? cloneAutista?.autistaNome,
    ),
    badgeAutista: normalizeOptionalBadge(cloneAutista?.badge ?? cloneAutista?.badgeAutista),
    targaMotrice: normalizeOptionalTarga(
      cloneMezzo?.targaCamion ?? cloneMezzo?.targaMotrice ?? cloneMezzo?.targa,
    ),
    targaRimorchio: normalizeOptionalTarga(cloneMezzo?.targaRimorchio),
    notes: [
      cloneAutista ? "Autista attivo locale letto dal browser corrente." : "",
      cloneMezzo ? "Mezzo attivo locale letto dal browser corrente." : "",
    ].filter(Boolean),
  };

  const assignmentsStrong = assignments.filter(
    (entry) => entry.linkReliability === "forte",
  ).length;
  const assignmentsPrudent = assignments.filter(
    (entry) => entry.linkReliability === "prudente",
  ).length;
  const attentionSignalsMother = motherSignals.filter(
    (entry) => entry.requiresAttention,
  ).length;
  const attentionSignalsLocal = localSignals.filter(
    (entry) => entry.requiresAttention,
  ).length;
  const anomalies = buildAnomalies({
    sessionAssignments,
    eventAssignments: [...eventAssignments, ...legacyAssignments],
    motherSignals,
    localSignals,
    legacyRecordsCount: legacyAssignments.length,
    localContext,
  });
  const boundaries = buildBoundaries({
    sessionCount: sessionAssignments.length,
    eventCount: eventAssignments.length,
    motherSignalCount: motherSignals.length,
    localSignalCount: localSignals.length,
    legacyCount: legacyAssignments.length,
  });
  const limitations = [
    legacyAssignments.length > 0
      ? "La collection autisti_eventi resta solo fallback prudente e non sostituisce lo storico operativo madre."
      : "",
    localSignals.length > 0
      ? "I dati creati nel clone autisti restano locali al browser corrente e non aggiornano la madre."
      : "",
    assignmentsStrong === 0 && assignmentsPrudent > 0
      ? "Gli agganci autista-mezzo correnti sono solo prudenziali: usare il dato con cautela."
      : "",
    sessioniResult.status !== "ready"
      ? "Le sessioni attive autisti non risultano leggibili in modo pieno nel browser corrente."
      : "",
  ].filter(Boolean);

  return {
    generatedAt: new Date().toISOString(),
    assignments,
    signals,
    segnalazioniRows,
    controlliRows,
    richiesteRows,
    anomalies,
    boundaries,
    localContext,
    operationalStatus: buildOperationalStatus({
      strongAssignments: assignmentsStrong,
      motherSignalCount: attentionSignalsMother,
      localSignalCount: attentionSignalsLocal,
    }),
    counts: {
      activeSessions: sessionAssignments.length,
      assignmentsStrong,
      assignmentsPrudent,
      attentionSignalsMother,
      attentionSignalsLocal,
      totalSignals: signals.length,
      anomalies: anomalies.length,
      legacyEvents: legacyAssignments.length,
    },
    limitations,
  };
}
