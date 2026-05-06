import { getInternalAiFirebaseAdminReadonlyContext } from "../internal-ai-firebase-admin.js";
import { readInternalAiFirebaseReadonlyBoundary } from "../internal-ai-firebase-readonly-boundary.js";
import { buildCatalogErrorMessage } from "./catalog-validator.js";

const DRIVER_DATASET_KEY = "@colleghi";
const MAX_DRIVER_CANDIDATES = 20;
const PLATE_TOKEN_PATTERN = /\b[A-Z]{2}\d{6}\b/gi;
const DRIVER_QUERY_STOPWORDS = new Set([
  "apri",
  "aprimi",
  "cerca",
  "dammi",
  "del",
  "della",
  "di",
  "driver",
  "fammi",
  "mostra",
  "mostrami",
  "profilo",
  "scheda",
  "autista",
  "conducente",
  "collega",
]);
const DRIVER_PROFILE_PATTERN = /\b(profilo|scheda|quadro|mostra|mostrami)\b.*\b(autista|conducente|driver|collega)\b|\b(autista|conducente|driver|collega)\b/i;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeForMatch(value) {
  return text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value) {
  return normalizeForMatch(value).replace(/\s+/g, "");
}

function normalizeDriverSearchText(value) {
  return text(value).replace(PLATE_TOKEN_PATTERN, " ").replace(/\s+/g, " ").trim();
}

function tokenizeDriverQuery(value) {
  return normalizeForMatch(normalizeDriverSearchText(value))
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token && !DRIVER_QUERY_STOPWORDS.has(token));
}

function unwrapStorageItems(rawDoc) {
  if (!rawDoc) return [];
  if (Array.isArray(rawDoc)) return rawDoc;
  if (!isPlainObject(rawDoc)) return [];
  if (Array.isArray(rawDoc.items)) return rawDoc.items;
  if (Array.isArray(rawDoc.value)) return rawDoc.value;
  if (isPlainObject(rawDoc.value) && Array.isArray(rawDoc.value.items)) {
    return rawDoc.value.items;
  }
  return [];
}

function getAllowedRead(datasetKey) {
  const boundary = readInternalAiFirebaseReadonlyBoundary();
  return boundary.firestore.allowedReads.find(
    (entry) =>
      entry.service === "firestore" &&
      entry.collection === "storage" &&
      entry.docId === datasetKey,
  ) ?? null;
}

function projectRecord(raw, allowedFields) {
  if (!isPlainObject(raw)) return null;
  const projected = {};
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(raw, field)) {
      projected[field] = raw[field];
    }
  }
  return projected;
}

function normalizeDriverRecord(raw, index) {
  const nome = text(raw.nome) || text(raw.nomeCompleto) || text(raw.label);
  if (!nome) return null;

  const id = text(raw.id) || text(raw.badge) || `collega:${index}`;
  const badge = text(raw.badge) || null;
  const codice = text(raw.codice) || null;
  const displayLabel = badge ? `${nome} (${badge})` : nome;

  return {
    id,
    nome,
    badge,
    codice,
    displayLabel,
    nameTokens: normalizeForMatch(nome).split(" ").filter(Boolean),
    nameCompact: compact(nome),
    badgeCompact: compact(badge),
    codiceCompact: compact(codice),
  };
}

function matchesDriver(driver, queryTokens, queryCompact) {
  if (!queryTokens.length && !queryCompact) return false;
  if (queryCompact && driver.nameCompact === queryCompact) return true;
  if (queryCompact && (driver.badgeCompact === queryCompact || driver.codiceCompact === queryCompact)) {
    return true;
  }
  if (!queryTokens.length) return false;
  return queryTokens.every((token) => driver.nameTokens.includes(token));
}

async function readDriverCandidates(firestore, searchText) {
  const allowedRead = getAllowedRead(DRIVER_DATASET_KEY);
  if (!allowedRead) {
    throw new Error("Boundary Driver360 mancante per storage/@colleghi");
  }

  const snapshot = await firestore.collection(allowedRead.collection).doc(allowedRead.docId).get();
  const rawItems = unwrapStorageItems(snapshot.exists ? snapshot.data() : null);
  const allowedFields = new Set(allowedRead.allowedFields);
  const drivers = rawItems
    .map((entry, index) => projectRecord(entry, allowedFields))
    .map((entry, index) => (entry ? normalizeDriverRecord(entry, index) : null))
    .filter(Boolean);

  const queryTokens = tokenizeDriverQuery(searchText);
  const queryCompact = compact(normalizeDriverSearchText(searchText));
  return drivers
    .filter((driver) => matchesDriver(driver, queryTokens, queryCompact))
    .sort((left, right) => left.displayLabel.localeCompare(right.displayLabel, "it", { sensitivity: "base" }));
}

function withResolvedFilters(message, resolvedFilters) {
  return {
    ...message,
    resolvedFilters: {
      ...(isPlainObject(message.resolvedFilters) ? message.resolvedFilters : {}),
      ...resolvedFilters,
    },
  };
}

function buildNoResultsMessage(message) {
  return {
    ...message,
    action: "error",
    resolvedFilters: null,
    disambiguation: null,
    accompaniment: { kind: "no_results", params: null },
  };
}

function buildTooManyResultsMessage(message, count) {
  return {
    ...message,
    action: "clarification_request",
    resolvedFilters: null,
    disambiguation: null,
    accompaniment: { kind: "clarify_too_many_results", params: { count } },
  };
}

function buildDisambiguationMessage(message, candidates) {
  return {
    ...message,
    action: "disambiguation_request",
    resolvedFilters: null,
    disambiguation: {
      disambiguation_required: true,
      candidates: candidates.map((candidate) => ({
        id: candidate.id,
        displayLabel: candidate.displayLabel,
        kind: "driver",
      })),
    },
    accompaniment: { kind: "disambiguation_required", params: { count: candidates.length } },
  };
}

function buildResolvedDriverMessage(message, candidate) {
  return {
    ...withResolvedFilters(message, { driverId: candidate.id }),
    action: "view_open",
    view: "Driver360",
    disambiguation: null,
    accompaniment: { kind: "view_opened", params: null },
  };
}

function shouldForceDriver360Routing(message, options) {
  if (message?.view === "Driver360" && message?.filters?.entityKind === "driver") {
    return false;
  }
  const prompt = text(options.prompt);
  if (!prompt) return false;
  const hintKind = options.preflightContext?.hints?.entityKind ?? null;
  return (hintKind === "driver" || hintKind === "vehicle" || hintKind === null) && DRIVER_PROFILE_PATTERN.test(prompt);
}

function normalizeDriver360Routing(message, options) {
  if (!shouldForceDriver360Routing(message, options)) {
    return message;
  }

  return {
    ...message,
    action: "view_open",
    view: "Driver360",
    filters: {
      searchText: text(message?.filters?.searchText) || text(options.prompt),
      entityKind: "driver",
      periodPreset: message?.filters?.periodPreset ?? options.preflightContext?.hints?.periodPreset ?? null,
    },
    clarification: null,
    disambiguation: null,
    report: null,
    accompaniment: { kind: "view_opened", params: null },
  };
}

async function resolveDriver360Message(message) {
  const searchText = text(message?.filters?.searchText);
  if (!searchText) {
    return {
      ...message,
      resolvedFilters: null,
      accompaniment: { kind: "no_results", params: null },
    };
  }

  const readonlyContext = await getInternalAiFirebaseAdminReadonlyContext();
  if (readonlyContext.status !== "ready" || !readonlyContext.firestore) {
    return buildCatalogErrorMessage();
  }

  const candidates = await readDriverCandidates(readonlyContext.firestore, searchText);
  if (candidates.length === 0) {
    return buildNoResultsMessage(message);
  }
  if (candidates.length > MAX_DRIVER_CANDIDATES) {
    return buildTooManyResultsMessage(message, candidates.length);
  }
  if (candidates.length === 1) {
    return buildResolvedDriverMessage(message, candidates[0]);
  }
  return buildDisambiguationMessage(message, candidates);
}

export async function resolvePostLlmMessage(message, options = {}) {
  const routedMessage = normalizeDriver360Routing(message, options);
  const finalMessage = {
    ...routedMessage,
    resolvedFilters: message?.resolvedFilters ?? null,
  };

  if (
    finalMessage?.view !== "Driver360" ||
    finalMessage?.filters === null ||
    finalMessage?.filters?.entityKind !== "driver"
  ) {
    return {
      finalMessage,
      resolutionApplied: false,
      reason: "not_driver360",
    };
  }

  try {
    return {
      finalMessage: await resolveDriver360Message(finalMessage),
      resolutionApplied: true,
      reason: "driver360_resolved",
    };
  } catch (error) {
    console.warn("[post-llm-resolver]", JSON.stringify({
      requestId: options.requestId ?? null,
      view: finalMessage.view,
      reason: error instanceof Error ? error.message : String(error),
    }));
    return {
      finalMessage: buildCatalogErrorMessage(),
      resolutionApplied: false,
      reason: "resolver_error",
    };
  }
}
