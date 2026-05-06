const PLATE_PATTERN = /\b[A-Z]{2}\d{6}\b/i;

const ENTITY_KEYWORDS = [
  { kind: "vehicle", patterns: [/\bmezzo\b/i, /\bveicolo\b/i, /\btarga\b/i, /\bflotta\b/i] },
  { kind: "driver", patterns: [/\bautista\b/i, /\bconducente\b/i, /\bdipendente\b/i] },
  { kind: "site", patterns: [/\bcantiere\b/i, /\bsito\b/i, /\bcommessa\b/i] },
  { kind: "supplier", patterns: [/\bfornitore\b/i, /\bofficina\b/i, /\bpartner\b/i] },
  { kind: "euromecc", patterns: [/\beuromecc\b/i] },
];

const PERIOD_KEYWORDS = [
  { preset: "last_7d", patterns: [/\bultimi\s+7\s+giorni\b/i, /\bultima\s+settimana\b/i] },
  { preset: "last_30d", patterns: [/\bultimi\s+30\s+giorni\b/i, /\bultimo\s+mese\b/i] },
  { preset: "last_90d", patterns: [/\bultimi\s+90\s+giorni\b/i, /\bultimo\s+trimestre\b/i] },
  { preset: "this_month", patterns: [/\bmese\s+corrente\b/i, /\bquesto\s+mese\b/i] },
  { preset: "this_year", patterns: [/\banno\s+corrente\b/i, /\bquest['’]anno\b/i] },
  { preset: "all", patterns: [/\btutto\b/i, /\bsempre\b/i, /\bcompleto\b/i] },
  { preset: "custom", patterns: [/\bdal\s+\d{1,2}[/-]\d{1,2}/i, /\btra\s+il\s+\d{1,2}/i] },
];

function normalizeSearchText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function detectEntityKind(text) {
  if (PLATE_PATTERN.test(text)) {
    return "vehicle";
  }

  for (const entry of ENTITY_KEYWORDS) {
    if (entry.patterns.some((pattern) => pattern.test(text))) {
      return entry.kind;
    }
  }

  return null;
}

function detectPeriodPreset(text) {
  for (const entry of PERIOD_KEYWORDS) {
    if (entry.patterns.some((pattern) => pattern.test(text))) {
      return entry.preset;
    }
  }

  return null;
}

export function buildChatZeroPreflightContext(prompt) {
  const searchText = normalizeSearchText(prompt);
  const plateMatch = searchText.match(PLATE_PATTERN);
  const entityKind = detectEntityKind(searchText);
  const periodPreset = detectPeriodPreset(searchText);

  const hints = {
    entityKind,
    periodPreset,
    platePatternDetected: plateMatch ? plateMatch[0].toUpperCase() : null,
  };

  return {
    searchText,
    hints,
    systemContext: [
      "CONTEXT PRE-LLM DETERMINISTICO NON CERTIFICATO",
      `searchTextNormalizzato: ${searchText || "null"}`,
      `entityKindHint: ${entityKind ?? "null"}`,
      `periodPresetHint: ${periodPreset ?? "null"}`,
      `platePatternDetected: ${hints.platePatternDetected ?? "null"}`,
      "Questi hint non sono dati certificati e non contengono id Firestore.",
    ].join("\n"),
  };
}
