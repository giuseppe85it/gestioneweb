import type { NextAnagraficheFlottaMezzoItem } from "../../../nextAnagraficheFlottaDomain";
import type { ChatIaMezzoTargaMatch } from "./chatIaMezziTypes";

export function normalizeChatIaMezzoTarga(value: unknown): string {
  return value === null || value === undefined
    ? ""
    : String(value).trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isChatIaMezzoFuzzySameTarga(candidate: unknown, target: unknown): boolean {
  const normalizedCandidate = normalizeChatIaMezzoTarga(candidate);
  const normalizedTarget = normalizeChatIaMezzoTarga(target);
  if (!normalizedCandidate || !normalizedTarget || normalizedCandidate === normalizedTarget) {
    return false;
  }
  if (Math.abs(normalizedCandidate.length - normalizedTarget.length) > 1) {
    return false;
  }

  const minLength = Math.min(normalizedCandidate.length, normalizedTarget.length);
  let diff = 0;
  for (let index = 0; index < minLength; index += 1) {
    if (normalizedCandidate[index] !== normalizedTarget[index]) {
      diff += 1;
    }
    if (diff > 1) return false;
  }
  return true;
}

export function isChatIaMezzoSameTarga(candidate: unknown, target: unknown): boolean {
  const normalizedCandidate = normalizeChatIaMezzoTarga(candidate);
  const normalizedTarget = normalizeChatIaMezzoTarga(target);
  return (
    normalizedCandidate === normalizedTarget ||
    isChatIaMezzoFuzzySameTarga(normalizedCandidate, normalizedTarget)
  );
}

export function resolveChatIaMezzoTarga(args: {
  requestedTarga: unknown;
  mezzi: NextAnagraficheFlottaMezzoItem[];
}): ChatIaMezzoTargaMatch {
  const requestedTarga = normalizeChatIaMezzoTarga(args.requestedTarga);
  if (!requestedTarga) return { status: "not_found", requestedTarga };

  const exact = args.mezzi.find((mezzo) => normalizeChatIaMezzoTarga(mezzo.targa) === requestedTarga);
  if (exact) {
    return {
      status: "found",
      requestedTarga,
      resolvedTarga: exact.targa,
      matchKind: "exact",
    };
  }

  const fuzzyCandidates = args.mezzi
    .map((mezzo) => normalizeChatIaMezzoTarga(mezzo.targa))
    .filter((targa) => isChatIaMezzoFuzzySameTarga(targa, requestedTarga));
  const uniqueCandidates = [...new Set(fuzzyCandidates)];

  if (uniqueCandidates.length === 1) {
    return {
      status: "found",
      requestedTarga,
      resolvedTarga: uniqueCandidates[0],
      matchKind: "fuzzy",
    };
  }

  if (uniqueCandidates.length > 1) {
    return { status: "ambiguous", requestedTarga, candidates: uniqueCandidates };
  }

  return { status: "not_found", requestedTarga };
}
