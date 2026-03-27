import { readNextFornitoriSnapshot } from "../domain/nextFornitoriDomain";
import {
  findInternalAiExactDriverMatch,
  matchInternalAiDriverLookupCandidates,
  readInternalAiDriverLookupCatalog,
} from "./internalAiDriverLookup";
import {
  findInternalAiExactVehicleMatch,
  matchInternalAiVehicleLookupCandidates,
  readInternalAiVehicleLookupCatalog,
} from "./internalAiVehicleLookup";
import { INTERNAL_AI_UNIVERSAL_ENTITY_MODEL } from "./internalAiUniversalContracts";
import type {
  InternalAiUniversalEntityMatch,
  InternalAiUniversalEntityResolution,
  InternalAiUniversalOrchestrationInput,
} from "./internalAiUniversalTypes";

let supplierSnapshotPromise: Promise<Awaited<ReturnType<typeof readNextFornitoriSnapshot>>> | null = null;

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeToken(value: string): string {
  return normalizeText(value).toLowerCase();
}

function ensureSupplierSnapshot() {
  if (!supplierSnapshotPromise) {
    supplierSnapshotPromise = readNextFornitoriSnapshot();
  }
  return supplierSnapshotPromise;
}

function pushUniqueMatch(
  matches: InternalAiUniversalEntityMatch[],
  nextMatch: InternalAiUniversalEntityMatch | null,
) {
  if (!nextMatch) {
    return;
  }

  const key = `${nextMatch.entityKind}:${nextMatch.normalizedValue}:${nextMatch.matchedId ?? "none"}`;
  if (
    matches.some(
      (entry) =>
        `${entry.entityKind}:${entry.normalizedValue}:${entry.matchedId ?? "none"}` === key,
    )
  ) {
    return;
  }

  matches.push(nextMatch);
}

function extractTargaCandidates(prompt: string, preferredTarga?: string | null): string[] {
  const candidates = new Set<string>();
  if (preferredTarga) {
    candidates.add(preferredTarga.toUpperCase());
  }

  (prompt.toUpperCase().match(/\b[A-Z]{2}\d{3}[A-Z]{2}\b/g) ?? []).forEach((entry) =>
    candidates.add(entry),
  );
  return [...candidates];
}

function buildResolutionContext(input: InternalAiUniversalOrchestrationInput): string {
  const attachmentSignals = input.attachments.flatMap((attachment) => [
    attachment.fileName,
    attachment.kind,
    attachment.textExcerpt ?? "",
  ]);

  return normalizeText([input.prompt, ...attachmentSignals].join(" "));
}

function extractChunkAfterKeyword(prompt: string, keywords: string[]): string | null {
  const lowered = prompt.toLowerCase();

  for (const keyword of keywords) {
    const index = lowered.indexOf(keyword);
    if (index === -1) {
      continue;
    }

    const chunk = prompt.slice(index + keyword.length).split(/[\n,.;:()]/)[0] ?? "";
    const cleaned = chunk
      .replace(/^(di|del|della|dei|degli|da|su|per|nel|nella|con)\s+/i, "")
      .replace(/\b(ultimi|ultimo|oggi|ieri|domani)\b.*$/i, "")
      .trim();
    if (cleaned.length >= 2) {
      return cleaned;
    }
  }

  return null;
}

async function resolveVehicleMatches(
  prompt: string,
  preferredTarga?: string | null,
): Promise<InternalAiUniversalEntityMatch[]> {
  const catalog = await readInternalAiVehicleLookupCatalog();
  const matches: InternalAiUniversalEntityMatch[] = [];

  extractTargaCandidates(prompt, preferredTarga).forEach((candidate) => {
    const exact = findInternalAiExactVehicleMatch(catalog, candidate);
    if (exact) {
      pushUniqueMatch(matches, {
        entityKind: "targa",
        rawValue: candidate,
        normalizedValue: exact.targa,
        status: "exact",
        confidence: "alta",
        matchedId: exact.id,
        matchedLabel: exact.targa,
        source: "catalogo mezzi clone-safe",
        lookupKey: "targa",
        note: "Corrispondenza targa confermata dal catalogo mezzi del clone.",
      });
      return;
    }

    pushUniqueMatch(matches, {
      entityKind: "targa",
      rawValue: candidate,
      normalizedValue: candidate,
      status: "heuristic",
      confidence: "prudente",
      matchedId: null,
      matchedLabel: candidate,
      source: "pattern targa nel prompt",
      lookupKey: "targa",
      note: "Targa rilevata per pattern, ma non ancora confermata dal catalogo mezzi.",
    });
  });

  const mezzoChunk = extractChunkAfterKeyword(prompt, ["mezzo ", "targa ", "camion "]);
  if (mezzoChunk && matches.length === 0) {
    const candidate = matchInternalAiVehicleLookupCandidates(catalog, mezzoChunk, 1)[0] ?? null;
    if (candidate) {
      pushUniqueMatch(matches, {
        entityKind: "mezzo",
        rawValue: mezzoChunk,
        normalizedValue: candidate.targa,
        status: "candidate",
        confidence: "media",
        matchedId: candidate.id,
        matchedLabel: `${candidate.targa} - ${candidate.categoria}`,
        source: "lookup mezzi clone-safe",
        lookupKey: "targa",
        note: "Mezzo candidato risolto dal catalogo mezzi del clone.",
      });
    }
  }

  return matches;
}

async function resolveDriverMatches(prompt: string): Promise<InternalAiUniversalEntityMatch[]> {
  const catalog = await readInternalAiDriverLookupCatalog();
  const matches: InternalAiUniversalEntityMatch[] = [];

  const badgeMatch = prompt.match(/\bbadge\s+([A-Z0-9-]{2,})\b/i);
  if (badgeMatch?.[1]) {
    const exact = findInternalAiExactDriverMatch(catalog, badgeMatch[1]);
    if (exact) {
      pushUniqueMatch(matches, {
        entityKind: "badge",
        rawValue: badgeMatch[1],
        normalizedValue: exact.badge ?? badgeMatch[1],
        status: "exact",
        confidence: "alta",
        matchedId: exact.id,
        matchedLabel: exact.nomeCompleto,
        source: "catalogo autisti clone-safe",
        lookupKey: "badge",
        note: "Badge risolto via matching badge-first del clone.",
      });
    }
  }

  const driverChunk = extractChunkAfterKeyword(prompt, ["autista ", "driver ", "collega "]);
  if (driverChunk) {
    const exact = findInternalAiExactDriverMatch(catalog, driverChunk);
    if (exact) {
      pushUniqueMatch(matches, {
        entityKind: "autista",
        rawValue: driverChunk,
        normalizedValue: exact.nomeCompleto,
        status: "exact",
        confidence: "alta",
        matchedId: exact.id,
        matchedLabel: exact.nomeCompleto,
        source: "catalogo autisti clone-safe",
        lookupKey: exact.badge ? "badge" : "nomeCompleto",
        note: "Autista confermato dal catalogo colleghi/autisti del clone.",
      });
    } else {
      const candidate = matchInternalAiDriverLookupCandidates(catalog, driverChunk, 1)[0] ?? null;
      if (candidate) {
        pushUniqueMatch(matches, {
          entityKind: "autista",
          rawValue: driverChunk,
          normalizedValue: candidate.nomeCompleto,
          status: "candidate",
          confidence: "media",
          matchedId: candidate.id,
          matchedLabel: candidate.nomeCompleto,
          source: "lookup autisti clone-safe",
          lookupKey: candidate.badge ? "badge" : "nomeCompleto",
          note: "Autista candidato risolto in modo prudente dal catalogo del clone.",
        });
      }
    }
  }

  return matches;
}

async function resolveSupplierMatches(prompt: string): Promise<InternalAiUniversalEntityMatch[]> {
  const supplierChunk = extractChunkAfterKeyword(prompt, ["fornitore ", "ragione sociale "]);
  if (!supplierChunk) {
    return [];
  }

  const snapshot = await ensureSupplierSnapshot();
  const normalized = normalizeToken(supplierChunk);
  const exact =
    snapshot.items.find((entry) => normalizeToken(entry.nome) === normalized) ?? null;
  if (exact) {
    return [
      {
        entityKind: "fornitore",
        rawValue: supplierChunk,
        normalizedValue: exact.nome,
        status: "exact",
        confidence: "alta",
        matchedId: exact.id,
        matchedLabel: exact.nome,
        source: "catalogo fornitori clone-safe",
        lookupKey: exact.codice ? "codice" : "nome",
        note: "Fornitore confermato dal catalogo fornitori del clone.",
      },
    ];
  }

  const candidate =
    snapshot.items.find((entry) => normalizeToken(entry.nome).includes(normalized)) ?? null;
  if (!candidate) {
    return [];
  }

  return [
    {
      entityKind: "fornitore",
      rawValue: supplierChunk,
      normalizedValue: candidate.nome,
      status: "candidate",
      confidence: "media",
      matchedId: candidate.id,
      matchedLabel: candidate.nome,
      source: "lookup fornitori clone-safe",
      lookupKey: candidate.codice ? "codice" : "nome",
      note: "Fornitore candidato risolto in modo prudente dal catalogo fornitori del clone.",
    },
  ];
}

function resolveKeywordEntities(prompt: string): InternalAiUniversalEntityMatch[] {
  const loweredPrompt = prompt.toLowerCase();

  return INTERNAL_AI_UNIVERSAL_ENTITY_MODEL.flatMap((descriptor) => {
    const matchedAlias = descriptor.aliases.find((alias) => loweredPrompt.includes(alias));
    if (!matchedAlias) {
      return [];
    }

    return [
      {
        entityKind: descriptor.entityKind,
        rawValue: matchedAlias,
        normalizedValue: matchedAlias,
        status: "heuristic",
        confidence: "prudente",
        matchedId: null,
        matchedLabel: descriptor.label,
        source: "vocabolario entita universale",
        lookupKey: descriptor.lookupKeys[0] ?? null,
        note: `Il prompt chiama il dominio ${descriptor.label.toLowerCase()}.`,
      },
    ];
  });
}

export async function resolveInternalAiUniversalEntities(
  input: InternalAiUniversalOrchestrationInput,
): Promise<InternalAiUniversalEntityResolution> {
  const prompt = normalizeText(input.prompt);
  const resolutionContext = buildResolutionContext(input);
  const matches: InternalAiUniversalEntityMatch[] = [];

  const [vehicleMatches, driverMatches, supplierMatches] = await Promise.all([
    resolveVehicleMatches(resolutionContext, input.preferredTarga ?? null),
    resolveDriverMatches(resolutionContext),
    resolveSupplierMatches(resolutionContext),
  ]);

  vehicleMatches.forEach((entry) => pushUniqueMatch(matches, entry));
  driverMatches.forEach((entry) => pushUniqueMatch(matches, entry));
  supplierMatches.forEach((entry) => pushUniqueMatch(matches, entry));
  resolveKeywordEntities(resolutionContext).forEach((entry) => pushUniqueMatch(matches, entry));

  return {
    prompt,
    matches,
    unresolvedHints: [
      matches.length === 0
        ? "Nessuna entita forte risolta dal clone: la richiesta resta multi-modulo e prudente."
        : null,
      !matches.some((entry) => entry.entityKind === "targa") &&
      prompt.toLowerCase().includes("mezzo")
        ? "Manca una targa forte: il dossier completo puo richiedere selezione guidata."
        : null,
    ].filter((entry): entry is string => Boolean(entry)),
  };
}
