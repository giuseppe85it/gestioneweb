import {
  createDefaultInternalAiReportPeriodInput,
  createInternalAiCustomPeriodInput,
} from "./internalAiReportPeriod";
import { readInternalAiVehicleCapabilityCatalog } from "./internalAiVehicleCapabilityCatalog";
import type {
  InternalAiReportPeriodInput,
  InternalAiVehicleCapabilityConfidence,
  InternalAiVehicleCapabilityDescriptor,
  InternalAiVehicleCapabilityGroupBy,
  InternalAiVehicleCapabilityPlan,
} from "./internalAiTypes";

const VEHICLE_SCOPE_HINTS = [
  "mezzo",
  "targa",
  "dossier",
  "documenti",
  "documento",
  "libretto",
  "preventivi",
  "preventivo",
  "costi",
  "spese",
  "economica",
  "rifornimenti",
  "rifornimento",
  "carburante",
  "gasolio",
  "diesel",
  "consumi",
  "litri",
  "stato",
  "situazione",
];

const REPORT_HINTS = ["report", "pdf", "relazione", "sintesi strutturata", "documento", "preview", "anteprima"];

function normalizePrompt(prompt: string): string {
  return prompt.toLowerCase().replace(/\s+/g, " ").trim();
}

function extractTarga(prompt: string): string | null {
  const matches = prompt.toUpperCase().match(/[A-Z]{2}\s*\d{3,6}\s*[A-Z]{0,2}/g);
  if (!matches?.length) {
    return null;
  }

  return matches[0].replace(/\s+/g, "");
}

function extractPeriodSelection(
  prompt: string,
  fallback?: InternalAiReportPeriodInput,
): { input: InternalAiReportPeriodInput; label: string } {
  const normalized = normalizePrompt(prompt);
  if (normalized.includes("ultimi 30 giorni")) {
    return {
      input: { preset: "last_30_days", fromDate: null, toDate: null },
      label: "ultimi 30 giorni",
    };
  }

  if (normalized.includes("ultimi 90 giorni")) {
    return {
      input: { preset: "last_90_days", fromDate: null, toDate: null },
      label: "ultimi 90 giorni",
    };
  }

  if (normalized.includes("ultimo mese")) {
    return {
      input: { preset: "last_full_month", fromDate: null, toDate: null },
      label: "ultimo mese chiuso",
    };
  }

  const customMatch = prompt.match(
    /(?:dal|da)\s+(\d{1,4}[./-]\d{1,2}[./-]\d{1,4})\s+(?:al|a)\s+(\d{1,4}[./-]\d{1,2}[./-]\d{1,4})/i,
  );
  if (customMatch?.[1] && customMatch?.[2]) {
    return {
      input: createInternalAiCustomPeriodInput(customMatch[1], customMatch[2]),
      label: `intervallo ${customMatch[1]} - ${customMatch[2]}`,
    };
  }

  return {
    input: fallback ?? createDefaultInternalAiReportPeriodInput(),
    label: "tutto lo storico disponibile",
  };
}

function resolveGroupBy(
  prompt: string,
  descriptor: InternalAiVehicleCapabilityDescriptor,
): InternalAiVehicleCapabilityGroupBy {
  const normalized = normalizePrompt(prompt);
  if (
    descriptor.groupBy.includes("document_type") &&
    (normalized.includes("per tipo") ||
      normalized.includes("per categoria") ||
      normalized.includes("divisi per tipo"))
  ) {
    return "document_type";
  }

  if (
    descriptor.groupBy.includes("source") &&
    (normalized.includes("per fonte") || normalized.includes("divisi per fonte"))
  ) {
    return "source";
  }

  return descriptor.groupBy[0] ?? "none";
}

function clampConfidence(score: number): InternalAiVehicleCapabilityConfidence {
  if (score >= 8) {
    return "high";
  }

  if (score >= 4) {
    return "medium";
  }

  return "low";
}

function scoreCapability(
  descriptor: InternalAiVehicleCapabilityDescriptor,
  normalizedPrompt: string,
  rawTarga: string | null,
): { score: number; rationale: string[] } {
  let score = 0;
  const rationale: string[] = [];

  for (const keyword of descriptor.plannerHints.keywords) {
    if (normalizedPrompt.includes(keyword)) {
      score += 3;
      rationale.push(`keyword:${keyword}`);
    }
  }

  for (const verb of descriptor.plannerHints.verbs) {
    if (normalizedPrompt.includes(verb)) {
      score += 1;
      rationale.push(`verb:${verb}`);
    }
  }

  if (rawTarga && descriptor.requiredFilters.includes("targa")) {
    score += 2;
    rationale.push("filter:targa");
  }

  const reportRequested = REPORT_HINTS.some((hint) => normalizedPrompt.includes(hint));
  if (reportRequested && descriptor.outputKind === "report_preview") {
    score += 5;
    rationale.push("output:report_preview");
  }

  if (!reportRequested && descriptor.outputKind === "chat_answer") {
    score += 1;
  }

  return { score, rationale };
}

export function isInternalAiVehicleCapabilityCandidate(prompt: string): boolean {
  const normalized = normalizePrompt(prompt);
  const rawTarga = extractTarga(prompt);

  return Boolean(rawTarga) || VEHICLE_SCOPE_HINTS.some((hint) => normalized.includes(hint));
}

export function planInternalAiVehicleCapability(
  prompt: string,
  fallbackPeriodInput?: InternalAiReportPeriodInput,
): InternalAiVehicleCapabilityPlan | null {
  const normalizedPrompt = normalizePrompt(prompt);
  const rawTarga = extractTarga(prompt);

  if (!rawTarga && !VEHICLE_SCOPE_HINTS.some((hint) => normalizedPrompt.includes(hint))) {
    return null;
  }

  const periodSelection = extractPeriodSelection(prompt, fallbackPeriodInput);
  const descriptors = readInternalAiVehicleCapabilityCatalog();
  const scoredDescriptors = descriptors
    .map((descriptor) => ({
      descriptor,
      ...scoreCapability(descriptor, normalizedPrompt, rawTarga),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  const selected = scoredDescriptors[0]?.descriptor ?? descriptors[descriptors.length - 1];
  if (!selected) {
    return null;
  }

  const score = scoredDescriptors[0]?.score ?? 1;
  const rationale = scoredDescriptors[0]?.rationale ?? ["fallback:dossier_status"];

  return {
    capabilityId: selected.id,
    domain: selected.domain,
    targetScope: selected.targetScope,
    rawTarga,
    normalizedTarga: rawTarga,
    periodInput: periodSelection.input,
    periodLabel: periodSelection.label,
    outputKind: selected.outputKind,
    groupBy: resolveGroupBy(prompt, selected),
    metrics: [...selected.metrics],
    missingInputs: rawTarga ? [] : ["targa"],
    confidence: clampConfidence(score),
    rationale,
    limitations: [...selected.limitations],
    bridgeCapabilityId: selected.bridgeCapabilityId,
  };
}
