import type { NextRifornimentoReadOnlyItem } from "../domain/nextRifornimentiDomain";
import { toDisplay } from "./dateUnica";
import type {
  Anomaly,
  RefuelConsumptionIndex,
  RefuelConsumptionSuspicion,
  RefuelRow,
  RefuelSeedIndex,
  RefuelSource,
  RefuelSourceKey,
} from "../types/centroControlloTypes";

type MonthFilter = number | "all";
type YearFilter = number | "all";

export type RefuelAnomalySummary = {
  totalRows: number;
  dataRows: number;
  kmRows: number;
  litriRows: number;
  consumoRows: number;
};

// Il consumo è valutato su una FINESTRA mobile (somma km / somma litri), non sul singolo
// rifornimento: i pieni parziali e i rabbocchi si compensano dentro la somma, così il km/L
// diventa attendibile e l'anomalia descrive una tendenza, non un singolo pieno.
const CONSUMPTION_WINDOW_SIZE = 4; // rifornimenti aggregati nella finestra recente
const CONSUMPTION_BASELINE_MIN = 8; // rifornimenti storici minimi per la media di riferimento
const CONSUMPTION_SUSPICION_FACTOR = 0.7; // anomalia se la finestra recente è sotto il 70% della media storica
// I rifornimenti "parziali" (rabbocco: pochi litri per molti km → km/L altissimo; oppure pienone:
// molti litri per pochi km → km/L bassissimo) non rappresentano il consumo reale e falsano la media.
// Li riconosciamo come km/L troppo lontano dalla mediana di QUEL mezzo+autista, così la soglia si
// adatta a ogni mezzo (un furgone leggero e un camion pesante hanno consumi tipici diversi).
const CONSUMPTION_OUTLIER_LOW = 0.55; // sotto 0,55× la mediana = pienone, escluso dal calcolo
const CONSUMPTION_OUTLIER_HIGH = 1.8; // sopra 1,8× la mediana = rabbocco, escluso dal calcolo

const safeText = (value: unknown): string => String(value ?? "").trim();

const normalizeTarga = (value: unknown): string =>
  String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();

export const normalizeTargaFilter = (value: unknown): string =>
  String(value ?? "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .trim();

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const normalized = String(value).replace(",", ".").replace(/[^\d.-]/g, "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseDateFlexible = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  if (typeof value === "number") {
    const ms = value > 1_000_000_000_000 ? value : value * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === "object" && value !== null) {
    const maybe = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };
    if (typeof maybe.toDate === "function") {
      const d = maybe.toDate();
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
    }
    if (typeof maybe.seconds === "number") {
      const d = new Date(maybe.seconds * 1000);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof maybe._seconds === "number") {
      const d = new Date(maybe._seconds * 1000);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  const dmyWithTime = raw.match(
    /^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})(?:[,\s]+(\d{1,2}):(\d{2}))?$/
  );
  if (dmyWithTime) {
    const day = Number(dmyWithTime[1]);
    const month = Number(dmyWithTime[2]) - 1;
    const yearRaw = Number(dmyWithTime[3]);
    const year = dmyWithTime[3].length === 2 ? Number(`20${yearRaw}`) : yearRaw;
    const hh = Number(dmyWithTime[4] ?? "12");
    const mm = Number(dmyWithTime[5] ?? "00");
    const d = new Date(year, month, day, hh, mm, 0, 0);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
};

const extractAutistaNome = (record: Record<string, unknown> | null | undefined): string => {
  const direct = safeText(record?.autistaNome ?? record?.nomeAutista);
  if (direct) return direct;
  const rawAutista = record?.autista;
  if (typeof rawAutista === "string") {
    return safeText(rawAutista);
  }
  if (rawAutista && typeof rawAutista === "object") {
    return safeText((rawAutista as { nome?: unknown })?.nome);
  }
  return "";
};

const deriveRefuelSource = (
  tipoRaw: string | null,
  metodoRaw: string | null,
): { label: string; key: RefuelSourceKey } => {
  const tipo = (tipoRaw ?? "").toLowerCase().trim();
  const metodo = (metodoRaw ?? "").toLowerCase().trim();
  if (tipo === "caravate") {
    return { label: "Caravate", key: "caravate" };
  }
  if (tipo === "distributore") {
    if (metodo === "piccadilly") {
      return { label: "Distributore Piccadilly", key: "distributore_piccadilly" };
    }
    if (metodo === "eni") {
      return { label: "Distributore Eni", key: "distributore_eni" };
    }
    if (metodo === "contanti") {
      return { label: "Distributore Contanti", key: "distributore_contanti" };
    }
    return { label: "Distributore", key: "distributore_altro" };
  }
  return { label: "—", key: "non_determinato" };
};

export const formatMediaLitriKm = (value: number): string => {
  const fixed = value.toFixed(2);
  return `${fixed.replace(".", ",")} km/L`;
};

export function formatIntegerIt(value: number): string {
  return value.toLocaleString("it-IT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function formatDecimalIt(value: number, fractionDigits = 2): string {
  return value.toLocaleString("it-IT", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export const formatDateItDisplay = (value: Date | null): string => {
  return toDisplay(value) || "--/--/----";
};

export const formatNumberIt = (value: number | null, fractionDigits = 2): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  return value.toLocaleString("it-IT", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

export const mapRefuelSource = (item: NextRifornimentoReadOnlyItem): RefuelSource => {
  if (item.provenienza === "business") return "dossier";
  if (item.provenienza === "campo") return "tmp";
  return "merged";
};

export const normalizeRefuelRecord = (
  record: Record<string, unknown> | null | undefined,
  index: number,
  source: RefuelSource,
): RefuelRow | null => {
  const originId = safeText(record?.id);
  const targa = normalizeTarga(
    record?.mezzoTarga ??
      record?.targaCamion ??
      record?.targaMotrice ??
      record?.targaRimorchio ??
      record?.targa,
  );
  // FIX timestamp: usa l'ora reale (timestamp/dataOra) PRIMA del display giorno-only (data).
  // Il feed campo @rifornimenti_autisti_tmp porta l'ora reale; il business @rifornimenti solo
  // il giorno. Parsando "data" per prima, più rifornimenti nello stesso giorno collassavano
  // tutti a mezzogiorno, falsando ordine, seed precedente, delta km e km/L.
  const dateObj =
    parseDateFlexible(record?.timestamp) ||
    parseDateFlexible(record?.dataOra) ||
    parseDateFlexible(record?.data);
  if (!targa || !dateObj) return null;

  const tipoRawValue = record?.tipo;
  const tipoRaw = typeof tipoRawValue === "string" ? tipoRawValue : null;
  const metodoValue = record?.metodoPagamento;
  const metodoPagamento =
    metodoValue === "piccadilly" || metodoValue === "eni" || metodoValue === "contanti"
      ? metodoValue
      : null;
  const paeseValue = record?.paese;
  const paese = paeseValue === "IT" || paeseValue === "CH" ? paeseValue : null;
  const derived = deriveRefuelSource(tipoRaw, metodoPagamento);

  return {
    id: originId || `${source}_${index}`,
    originId,
    targa,
    dateObj,
    autistaNome: extractAutistaNome(record) || null,
    badgeAutista: safeText(record?.badgeAutista ?? record?.badge) || null,
    litri: toNumber(record?.litri),
    km: toNumber(record?.km),
    distributore: safeText(record?.distributore ?? record?.tipo),
    note: safeText(record?.note),
    source,
    tipoRaw,
    metodoPagamento,
    paese,
    sourceLabel: derived.label,
    sourceKey: derived.key,
  };
};

export function buildRefuelRowsFromReadOnlyItems(
  items: NextRifornimentoReadOnlyItem[],
): RefuelRow[] {
  return items
    .map((item, idx) =>
      normalizeRefuelRecord(
        {
          id: item.id,
          mezzoTarga: item.targa,
          autistaNome: item.autistaNome,
          badgeAutista: item.badgeAutista,
          litri: item.litri,
          km: item.km,
          distributore: item.distributore,
          note: item.note,
          timestamp: item.timestamp ?? item.timestampRicostruito ?? item.dataDisplay,
          data: item.dataDisplay,
          tipo: item.tipo,
          metodoPagamento: item.metodoPagamento,
          paese: item.paese,
        },
        idx,
        mapRefuelSource(item),
      ),
    )
    .filter((item): item is RefuelRow => Boolean(item))
    .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
}

export function buildRefuelSeedIndex(refuelRows: RefuelRow[]): RefuelSeedIndex {
  const fullSortedByTarga = new Map<string, RefuelRow[]>();
  const fullSorted = [...refuelRows].sort((left, right) => {
    const targaCompare = left.targa.localeCompare(right.targa, "it", { sensitivity: "base" });
    if (targaCompare !== 0) return targaCompare;
    return left.dateObj.getTime() - right.dateObj.getTime();
  });
  for (const row of fullSorted) {
    const list = fullSortedByTarga.get(row.targa);
    if (list) {
      list.push(row);
    } else {
      fullSortedByTarga.set(row.targa, [row]);
    }
  }
  const findSeed = (row: RefuelRow): RefuelRow | null => {
    const list = fullSortedByTarga.get(row.targa);
    if (!list || list.length === 0) return null;
    const rowTs = row.dateObj.getTime();
    for (let i = list.length - 1; i >= 0; i -= 1) {
      const candidate = list[i];
      if (
        candidate.dateObj.getTime() < rowTs &&
        typeof candidate.km === "number" &&
        candidate.km > 0
      ) {
        return candidate;
      }
    }
    return null;
  };
  return { findSeed };
}

const normalizeAutistaKey = (value: string | null | undefined): string =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const buildAutistaTargaConsumptionKey = (row: RefuelRow): string | null => {
  const autistaKey = normalizeAutistaKey(row.autistaNome);
  if (!autistaKey || !row.targa) return null;
  return `${row.targa}__${autistaKey}`;
};

const readRefuelConsumption = (
  row: RefuelRow,
  seed: RefuelRow | null,
): { km: number; litri: number; kmL: number } | null => {
  if (
    !seed ||
    typeof row.km !== "number" ||
    row.km <= 0 ||
    typeof seed.km !== "number" ||
    seed.km <= 0 ||
    row.km <= seed.km ||
    typeof row.litri !== "number" ||
    row.litri <= 0
  ) {
    return null;
  }
  const km = row.km - seed.km;
  const kmL = km / row.litri;
  if (!Number.isFinite(km) || km <= 0 || !Number.isFinite(kmL) || kmL <= 0) {
    return null;
  }
  return { km, litri: row.litri, kmL };
};

const median = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

export function buildRefuelConsumptionIndex(
  refuelRows: RefuelRow[],
  refuelSeedIndex: RefuelSeedIndex,
): RefuelConsumptionIndex {
  type ConsumptionEntry = {
    rowId: string;
    ts: number;
    km: number;
    litri: number;
    kmL: number;
  };

  // Raccolta grezza, in ordine cronologico, dei rifornimenti con consumo misurabile per coppia.
  const rawByAutistaTarga = new Map<string, ConsumptionEntry[]>();
  const sortedRows = [...refuelRows].sort(
    (a, b) => a.dateObj.getTime() - b.dateObj.getTime(),
  );
  for (const row of sortedRows) {
    const key = buildAutistaTargaConsumptionKey(row);
    if (!key) continue;
    const seed = refuelSeedIndex.findSeed(row);
    const consumption = readRefuelConsumption(row, seed);
    if (!consumption) continue;
    const entry = { rowId: row.id, ts: row.dateObj.getTime(), ...consumption };
    const list = rawByAutistaTarga.get(key);
    if (list) {
      list.push(entry);
    } else {
      rawByAutistaTarga.set(key, [entry]);
    }
  }

  // Filtro dei rifornimenti parziali (rabbocchi/pienoni): per ogni coppia teniamo solo i
  // rifornimenti con km/L vicino alla mediana del mezzo. Così finestra recente e baseline storica
  // confrontano consumi reali con consumi reali, non valori falsati da pieni non rappresentativi.
  const byAutistaTarga = new Map<string, ConsumptionEntry[]>();
  for (const [key, list] of rawByAutistaTarga) {
    const medianKmL = median(list.map((entry) => entry.kmL));
    if (medianKmL === null || medianKmL <= 0) {
      byAutistaTarga.set(key, list);
      continue;
    }
    const low = medianKmL * CONSUMPTION_OUTLIER_LOW;
    const high = medianKmL * CONSUMPTION_OUTLIER_HIGH;
    byAutistaTarga.set(
      key,
      list.filter((entry) => entry.kmL >= low && entry.kmL <= high),
    );
  }

  const aggregateKmL = (
    entries: Array<{ km: number; litri: number }>,
  ): number | null => {
    const totalKm = entries.reduce((sum, entry) => sum + entry.km, 0);
    const totalLitri = entries.reduce((sum, entry) => sum + entry.litri, 0);
    if (totalKm <= 0 || totalLitri <= 0) return null;
    const value = totalKm / totalLitri;
    return Number.isFinite(value) && value > 0 ? value : null;
  };

  // Media della finestra recente + baseline per un rifornimento, senza applicare la soglia.
  // Restituisce null se la finestra recente o la baseline storica non sono complete.
  const computeWindow = (
    row: RefuelRow,
    seed: RefuelRow | null,
  ): {
    windowKmL: number;
    baselineKmL: number;
    windowCount: number;
    baselineCount: number;
  } | null => {
    const key = buildAutistaTargaConsumptionKey(row);
    if (!key) return null;
    const current = readRefuelConsumption(row, seed);
    if (!current) return null;
    const list = byAutistaTarga.get(key) ?? [];
    const idx = list.findIndex(
      (entry) => entry.rowId === row.id && entry.ts === row.dateObj.getTime(),
    );
    // Serve una finestra recente completa (questo rifornimento la chiude) e una baseline
    // storica sufficiente che la precede.
    if (idx < 0 || idx + 1 < CONSUMPTION_WINDOW_SIZE) return null;

    const windowEntries = list.slice(idx - CONSUMPTION_WINDOW_SIZE + 1, idx + 1);
    const baselineEntries = list.slice(0, idx - CONSUMPTION_WINDOW_SIZE + 1);
    if (baselineEntries.length < CONSUMPTION_BASELINE_MIN) return null;

    const windowKmL = aggregateKmL(windowEntries);
    const baselineKmL = aggregateKmL(baselineEntries);
    if (windowKmL === null || baselineKmL === null) return null;

    return {
      windowKmL,
      baselineKmL,
      windowCount: windowEntries.length,
      baselineCount: baselineEntries.length,
    };
  };

  return {
    findSuspicion: (row, seed) => {
      const w = computeWindow(row, seed);
      if (!w) return null;
      if (w.windowKmL >= w.baselineKmL * CONSUMPTION_SUSPICION_FACTOR) return null;
      return {
        currentKmL: w.windowKmL,
        historicalKmL: w.baselineKmL,
        historyCount: w.baselineCount,
        windowCount: w.windowCount,
        deltaPercent: (w.windowKmL - w.baselineKmL) / w.baselineKmL,
        thresholdFactor: CONSUMPTION_SUSPICION_FACTOR,
      };
    },
    getWindowConsumption: (row, seed) => {
      const w = computeWindow(row, seed);
      if (!w) return null;
      return {
        windowKmL: w.windowKmL,
        baselineKmL: w.baselineKmL,
        windowCount: w.windowCount,
        baselineCount: w.baselineCount,
        isBelowThreshold: w.windowKmL < w.baselineKmL * CONSUMPTION_SUSPICION_FACTOR,
      };
    },
  };
}

const buildConsumptionSuspicionMessage = (
  suspicion: RefuelConsumptionSuspicion,
): string => {
  const delta = Math.round(Math.abs(suspicion.deltaPercent) * 100);
  return `Consumo recente in calo: media ultimi ${suspicion.windowCount} rifornimenti ${formatMediaLitriKm(
    suspicion.currentKmL,
  )} contro media storica ${formatMediaLitriKm(
    suspicion.historicalKmL,
  )} su ${suspicion.historyCount} rifornimenti precedenti dello stesso autista su questa targa (${delta}% peggiore).`;
};

export function describeAnomaly(
  anomaly: Anomaly,
  row: RefuelRow,
  seed: RefuelRow | null,
): string {
  const seedDate = seed ? formatDateItDisplay(seed.dateObj) : "—";
  const seedKmText =
    seed && typeof seed.km === "number" ? formatIntegerIt(seed.km) : "—";
  const rowKmText =
    typeof row.km === "number" ? formatIntegerIt(row.km) : "—";
  const rowKmRaw =
    row.km === null || row.km === undefined ? "assente" : String(row.km);
  const rowLitriRaw =
    row.litri === null || row.litri === undefined
      ? "assente"
      : String(row.litri);
  const rowLitriText =
    typeof row.litri === "number" ? formatDecimalIt(row.litri, 2) : "—";

  switch (anomaly.type) {
    case "KM_TORNANO_INDIETRO": {
      const diff =
        seed && typeof seed.km === "number" && typeof row.km === "number"
          ? formatIntegerIt(seed.km - row.km)
          : "—";
      return `Salto km incoerente: il rifornimento precedente del ${seedDate} ha km ${seedKmText}, superiori di ${diff} km a questo (km ${rowKmText}). Probabile errore di battitura su uno dei due record.`;
    }
    case "KM_SALTO_TROPPO_GRANDE": {
      const diff =
        seed && typeof seed.km === "number" && typeof row.km === "number"
          ? formatIntegerIt(row.km - seed.km)
          : "—";
      return `Salto km elevato: dal rifornimento precedente del ${seedDate} (km ${seedKmText}) sono stati percorsi ${diff} km. Verifica plausibilità (oltre soglia 1.200 km tra rifornimenti consecutivi).`;
    }
    case "KM_INVALIDI": {
      return `Km mancanti o non validi sul rifornimento. Valore registrato: ${rowKmRaw}.`;
    }
    case "KM_INVARIATI": {
      return `Km uguali al rifornimento precedente del ${seedDate} (km ${seedKmText}). Mezzo non si è mosso ma ha rifornito: verifica.`;
    }
    case "LITRI_TROPPO_ALTI": {
      return `Litri sospetti: registrati ${rowLitriText} L (oltre soglia 500 L per singolo rifornimento). Verifica il valore.`;
    }
    case "LITRI_NON_VALIDI": {
      return `Litri mancanti o non validi sul rifornimento. Valore registrato: ${rowLitriRaw}.`;
    }
    case "LITRI_TROPPO_BASSI": {
      return `Litri sospetti: registrati ${rowLitriText} L (sotto soglia 20 L, insolito per un camion). Verifica il valore.`;
    }
    case "CONSUMO_SOSPETTO_MEDIA_AUTISTA_TARGA": {
      const detail = anomaly.consumption;
      if (!detail) return anomaly.message;
      const delta = Math.round(Math.abs(detail.deltaPercent) * 100);
      return `Consumo recente peggiorato: gli ultimi ${detail.windowCount} rifornimenti di questo autista su questa targa rendono ${formatMediaLitriKm(
        detail.currentKmL,
      )}, contro la media storica ${formatMediaLitriKm(
        detail.historicalKmL,
      )} su ${detail.historyCount} rifornimenti precedenti (${delta}% peggiore). È una tendenza su più pieni, non un singolo rifornimento: verifica percorso, carico, stile di guida e stato del mezzo.`;
    }
    default:
      return anomaly.message;
  }
}

export function detectRefuelAnomalies(
  row: RefuelRow,
  seed: RefuelRow | null,
): Anomaly[] {
  const result: Anomaly[] = [];

  const rowKmInvalid =
    row.km === null ||
    row.km === undefined ||
    (typeof row.km === "number" && row.km <= 0);

  if (rowKmInvalid) {
    result.push({
      type: "KM_INVALIDI",
      target: "km",
      message: "Km mancanti o non validi",
    });
  } else if (
    seed &&
    typeof seed.km === "number" &&
    seed.km > 0 &&
    typeof row.km === "number" &&
    row.km > 0
  ) {
    if (row.km < seed.km) {
      result.push({
        type: "KM_TORNANO_INDIETRO",
        target: "km",
        message:
          "Km inferiori al rifornimento precedente (possibile errore di battitura)",
      });
    } else if (row.km > seed.km && row.km - seed.km > 1200) {
      result.push({
        type: "KM_SALTO_TROPPO_GRANDE",
        target: "km",
        message: "Salto km > 1200 dal rifornimento precedente",
      });
    } else if (row.km === seed.km) {
      result.push({
        type: "KM_INVARIATI",
        target: "km",
        message:
          "Km uguali al rifornimento precedente (mezzo non si è mosso ma ha rifornito)",
      });
    }
  }

  const rowLitriInvalid =
    row.litri === null ||
    row.litri === undefined ||
    (typeof row.litri === "number" && row.litri <= 0);

  if (rowLitriInvalid) {
    result.push({
      type: "LITRI_NON_VALIDI",
      target: "litri",
      message: "Litri mancanti o non validi",
    });
  } else if (typeof row.litri === "number" && row.litri > 0) {
    if (row.litri > 500) {
      result.push({
        type: "LITRI_TROPPO_ALTI",
        target: "litri",
        message: "Litri sospetti (> 500 L per singolo rifornimento)",
      });
    } else if (row.litri < 20) {
      result.push({
        type: "LITRI_TROPPO_BASSI",
        target: "litri",
        message:
          "Litri sospetti (< 20 L per singolo rifornimento, insolito per un camion)",
      });
    }
  }

  return result;
}

export function detectRefuelReportAnomalies(
  row: RefuelRow,
  seed: RefuelRow | null,
  refuelConsumptionIndex: RefuelConsumptionIndex,
): Anomaly[] {
  const dataAnomalies = detectRefuelAnomalies(row, seed);
  if (dataAnomalies.length > 0) return dataAnomalies;

  const suspicion = refuelConsumptionIndex.findSuspicion(row, seed);
  if (!suspicion) return dataAnomalies;

  return [
    {
      type: "CONSUMO_SOSPETTO_MEDIA_AUTISTA_TARGA",
      target: "consumo",
      message: buildConsumptionSuspicionMessage(suspicion),
      consumption: suspicion,
    },
  ];
}

const filterRefuelRowsByPeriod = (
  refuelRows: RefuelRow[],
  selectedMonth: MonthFilter,
  selectedYear: YearFilter,
): RefuelRow[] =>
  refuelRows.filter((item) => {
    if (selectedMonth !== "all" && item.dateObj.getMonth() + 1 !== selectedMonth) return false;
    if (selectedYear !== "all" && item.dateObj.getFullYear() !== selectedYear) return false;
    return true;
  });

export function buildRefuelReportAnomalySummary(
  refuelRows: RefuelRow[],
  options: { selectedMonth: MonthFilter; selectedYear: YearFilter },
): RefuelAnomalySummary {
  const refuelSeedIndex = buildRefuelSeedIndex(refuelRows);
  const refuelConsumptionIndex = buildRefuelConsumptionIndex(refuelRows, refuelSeedIndex);
  const filteredRows = filterRefuelRowsByPeriod(
    refuelRows,
    options.selectedMonth,
    options.selectedYear,
  );

  let totalRows = 0;
  let dataRows = 0;
  let kmRows = 0;
  let litriRows = 0;
  let consumoRows = 0;

  for (const row of filteredRows) {
    const seed = refuelSeedIndex.findSeed(row);
    const anomalies = detectRefuelReportAnomalies(row, seed, refuelConsumptionIndex);
    if (anomalies.length === 0) continue;
    totalRows += 1;
    if (anomalies.some((a) => a.target === "km" || a.target === "litri")) {
      dataRows += 1;
    }
    if (anomalies.some((a) => a.target === "km")) kmRows += 1;
    if (anomalies.some((a) => a.target === "litri")) litriRows += 1;
    if (anomalies.some((a) => a.target === "consumo")) consumoRows += 1;
  }

  return { totalRows, dataRows, kmRows, litriRows, consumoRows };
}
