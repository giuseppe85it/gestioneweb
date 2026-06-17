type SegnalazioneLike = Record<string, unknown>;

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeLower(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function normalizeTarga(value: unknown): string {
  return normalizeText(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function hasText(value: unknown): boolean {
  return normalizeText(value).length > 0;
}

function hasLinkedLavoro(record: SegnalazioneLike): boolean {
  if (record.hasLinkedLavoro === true) return true;
  if (hasText(record.linkedLavoroId)) return true;
  if (!Array.isArray(record.linkedLavoroIds)) return false;
  return record.linkedLavoroIds.some((entry) => hasText(entry));
}

function hasChiusuraTrace(record: SegnalazioneLike): boolean {
  if (hasText(record.chiusuraRefId)) return true;
  if (record.chiusuraData === null || record.chiusuraData === undefined) return false;
  return hasText(record.chiusuraData);
}

export function getNextSegnalazioneOperativaTarga(record: SegnalazioneLike): string {
  return (
    normalizeTarga(record.targa) ||
    normalizeTarga(record.targaCamion) ||
    normalizeTarga(record.targaMotrice) ||
    normalizeTarga(record.targaRimorchio)
  );
}

export function isNextSegnalazioneOperativa(record: SegnalazioneLike): boolean {
  if (!getNextSegnalazioneOperativaTarga(record)) return false;
  if (record.chiusa === true) return false;
  if (normalizeLower(record.stato) === "chiusa") return false;
  if (hasChiusuraTrace(record)) return false;
  if (hasLinkedLavoro(record)) return false;
  return true;
}
