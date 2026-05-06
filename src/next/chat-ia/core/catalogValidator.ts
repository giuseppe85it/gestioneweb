import type {
  ActionEnum,
  AccompanimentKindEnum,
  ChatZeroInvenzioniMessage,
  EntityKindEnum,
  PeriodPresetEnum,
  ViewEnum,
} from "./chatIaTypes";

const actionEnum: readonly ActionEnum[] = [
  "view_open",
  "disambiguation_request",
  "clarification_request",
  "error",
  "report_request",
];

const viewEnum: readonly ViewEnum[] = [
  "Driver360",
  "Vehicle360",
  "Site360",
  "Euromecc360",
  "Ricerca360",
];

const entityKindEnum: readonly EntityKindEnum[] = [
  "driver",
  "vehicle",
  "site",
  "supplier",
  "euromecc",
];

const periodPresetEnum: readonly PeriodPresetEnum[] = [
  "all",
  "last_7d",
  "last_30d",
  "last_90d",
  "this_month",
  "this_year",
  "custom",
];

const accompanimentKindEnum: readonly AccompanimentKindEnum[] = [
  "view_opened",
  "no_results",
  "disambiguation_required",
  "clarify_too_many_results",
  "clarify_period_required",
  "error_intent_not_in_catalog",
  "error_view_unavailable",
];

const forbiddenFields = new Set([
  "text",
  "blocks",
  "entities",
  "sources",
  "notices",
  "summary",
  "narrative",
  "description",
  "comment",
  "explanation",
  "reasoning",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function collectForbiddenFields(value: unknown, errors: string[], path = ""): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectForbiddenFields(item, errors, `${path}[${index}]`));
    return;
  }

  if (!isRecord(value)) return;

  Object.entries(value).forEach(([key, child]) => {
    const childPath = path ? `${path}.${key}` : key;
    if (forbiddenFields.has(key)) {
      errors.push(`${childPath} vietato`);
    }
    collectForbiddenFields(child, errors, childPath);
  });
}

function isEnumValue<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === "string" && values.includes(value as T);
}

export function buildZeroInvenzioniErrorMessage(): ChatZeroInvenzioniMessage {
  return {
    action: "error",
    view: null,
    filters: null,
    resolvedFilters: null,
    clarification: null,
    disambiguation: null,
    report: null,
    accompaniment: { kind: "error_intent_not_in_catalog", params: null },
  };
}

export function validateChatZeroInvenzioniMessage(value: unknown): {
  valid: boolean;
  errors: string[];
  finalMessage: ChatZeroInvenzioniMessage;
} {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return {
      valid: false,
      errors: ["messaggio non oggetto"],
      finalMessage: buildZeroInvenzioniErrorMessage(),
    };
  }

  collectForbiddenFields(value, errors);

  if (!isEnumValue(value.action, actionEnum)) errors.push("action non valido");
  if (value.view !== null && !isEnumValue(value.view, viewEnum)) errors.push("view non valido");

  if (value.filters !== null) {
    if (!isRecord(value.filters)) {
      errors.push("filters non valido");
    } else {
      if (value.filters.searchText !== null && typeof value.filters.searchText !== "string") {
        errors.push("filters.searchText non valido");
      }
      if (
        value.filters.entityKind !== null &&
        !isEnumValue(value.filters.entityKind, entityKindEnum)
      ) {
        errors.push("filters.entityKind non valido");
      }
      if (
        value.filters.periodPreset !== null &&
        !isEnumValue(value.filters.periodPreset, periodPresetEnum)
      ) {
        errors.push("filters.periodPreset non valido");
      }
    }
  }

  if (value.accompaniment === null || !isRecord(value.accompaniment)) {
    errors.push("accompaniment non valido");
  } else if (!isEnumValue(value.accompaniment.kind, accompanimentKindEnum)) {
    errors.push("accompaniment.kind non valido");
  }

  return {
    valid: errors.length === 0,
    errors,
    finalMessage: errors.length === 0 ? (value as ChatZeroInvenzioniMessage) : buildZeroInvenzioniErrorMessage(),
  };
}
