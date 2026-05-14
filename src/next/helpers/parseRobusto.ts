/**
 * Converte formati data eterogenei in timestamp millisecondi.
 *
 * Esempi accettati:
 * - timestamp ms: 1778580122145
 * - ISO breve: "2026-05-08"
 * - ISO esteso: "2026-05-08T10:30:00Z"
 * - legacy italiano: "08/05/2026" oppure "08/05/2026 14:30"
 * - Date JavaScript: new Date("2026-05-08")
 * - Firestore Timestamp: oggetti con .toDate(), .toMillis() oppure seconds/nanoseconds
 *
 * Ritorna null per valori vuoti, non validi o non riconosciuti.
 */
export function parseDataRobusta(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    return Number.isFinite(value) && !Number.isNaN(value) ? value : null;
  }

  if (value instanceof Date) {
    const parsed = value.getTime();
    return Number.isFinite(parsed) && !Number.isNaN(parsed) ? parsed : null;
  }

  if (typeof value === "object" && value !== null) {
    const timestampLike = value as {
      toDate?: unknown;
      toMillis?: unknown;
      seconds?: unknown;
      nanoseconds?: unknown;
    };

    if (typeof timestampLike.toDate === "function") {
      const parsedDate = timestampLike.toDate();
      if (parsedDate instanceof Date) {
        const parsed = parsedDate.getTime();
        return Number.isFinite(parsed) && !Number.isNaN(parsed) ? parsed : null;
      }
    }

    if (typeof timestampLike.toMillis === "function") {
      const parsed = Number(timestampLike.toMillis());
      return Number.isFinite(parsed) && !Number.isNaN(parsed) ? parsed : null;
    }

    const seconds = Number(timestampLike.seconds);
    if (Number.isFinite(seconds)) {
      const nanoseconds = Number(timestampLike.nanoseconds);
      const millisFromNanos = Number.isFinite(nanoseconds) ? Math.floor(nanoseconds / 1_000_000) : 0;
      const parsed = seconds * 1000 + millisFromNanos;
      return Number.isFinite(parsed) && !Number.isNaN(parsed) ? parsed : null;
    }

    return null;
  }

  if (typeof value !== "string") return null;

  const raw = value.trim();
  if (!raw) return null;

  const legacy = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (legacy) {
    const day = Number(legacy[1]);
    const monthIndex = Number(legacy[2]) - 1;
    let year = Number(legacy[3]);
    const hours = legacy[4] ? Number(legacy[4]) : 0;
    const minutes = legacy[5] ? Number(legacy[5]) : 0;
    if (legacy[3].length === 2) year += year >= 70 ? 1900 : 2000;
    const parsed = new Date(year, monthIndex, day, hours, minutes).getTime();
    return Number.isFinite(parsed) && !Number.isNaN(parsed) ? parsed : null;
  }

  const parsed = new Date(raw).getTime();
  return Number.isFinite(parsed) && !Number.isNaN(parsed) ? parsed : null;
}

export function getDataRiferimentoRecord(record: Record<string, unknown>): number {
  const keys = ["dataInserimento", "createdAt", "timestamp", "data", "dataProgrammata", "dataEsecuzione"] as const;

  for (const key of keys) {
    const parsed = parseDataRobusta(record[key]);
    if (parsed !== null) return parsed;
  }

  console.warn("[parseRobusto] data riferimento record non disponibile, fallback Date.now()", {
    id: record.id,
    keys,
  });
  return Date.now();
}
