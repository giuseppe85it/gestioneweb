import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { formatDateUI } from "../utils/dateFormat";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  ComposedChart,
  Legend,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
} from "recharts";

type RifornimentoRecord = {
  id?: string;
  mezzoTarga?: string | null;
  targaCamion?: string | null;
  targaMotrice?: string | null;
  data?: string | number | null;
  timestamp?: string | number | null;
  litri?: number | null;
  km?: number | null;
  costo?: number | null;
  importo?: number | null;
  distributore?: string | null;
  note?: string | null;
};

type Props = { targa: string };
type RangeFilter = "MESE" | 3 | 6 | 9 | 12;
type RifornimentoNorm = RifornimentoRecord & {
  dateObj: Date;
  kmNum: number | null;
  litriNum: number | null;
};

const normalizeTarga = (value?: unknown): string => {
  if (typeof value !== "string") return "";
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").trim();
};

const toNumber = (value: unknown): number | null => {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = String(value).trim();
  if (!raw) return null;
  const normalized = raw.replace(",", ".").replace(/[^\d.\-]/g, "");
  if (!normalized) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
};

const parseDateFlex = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "object" && (value as any)?.toDate) {
    const d = (value as any).toDate();
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
  }
  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value !== "string") return null;

  const raw = value.trim();
  if (!raw) return null;

  if (raw.includes("-")) {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const match = raw.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:,\s*(\d{1,2}):(\d{2}))?$/
  );
  if (match) {
    const [, dd, mm, yyyy, hh, min] = match;
    const d = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(hh || 0),
      Number(min || 0),
      0
    );
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const ts = Date.parse(raw);
  if (!Number.isNaN(ts)) return new Date(ts);
  return null;
};

const formatDateLabel = (value: unknown): string => {
  const d = parseDateFlex(value);
  if (!d) return "—";
  return formatDateUI(d);
};

const formatDayShort = (value: Date): string => formatDateUI(value);

const formatDayKeyShort = (dayKey: string): string => {
  return formatDayKeyLong(dayKey);
};

const formatDayKeyLong = (dayKey: string): string => {
  const [yyyy, mm, dd] = dayKey.split("-");
  if (!yyyy || !mm || !dd) return "—";
  return `${dd}/${mm}/${yyyy}`;
};

const getDayKey = (value: Date): string => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const toLocalDayKey = (value: Date): string => {
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const getRecordKey = (
  r: RifornimentoRecord & {
    dateObj?: Date;
    kmNum?: number | null;
    litriNum?: number | null;
  }
): string =>
  String(
    r.id ??
      `${r.dateObj ? r.dateObj.getTime() : "nodate"}_${r.litriNum ?? "nol"}_${
        r.kmNum ?? "nokm"
      }`
  );

const FuelDot = ({
  cx,
  cy,
  value,
  payload,
  onPick,
}: {
  cx?: number;
  cy?: number;
  value?: number;
  payload?: any;
  onPick?: (payload?: any) => void;
}) => {
  if (cx == null || cy == null) return null;
  const v = typeof value === "number" ? value : 0;
  if (v <= 0) {
    return <circle cx={cx} cy={cy} r={2} fill="#999" />;
  }
  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill="#2f6fed"
      style={{ cursor: "pointer" }}
      onClick={(e) => {
        e.stopPropagation();
        onPick?.(payload);
      }}
    />
  );
};

export default function RifornimentiEconomiaSection({ targa }: Props) {
  const [items, setItems] = useState<RifornimentoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangeMonths, setRangeMonths] = useState<RangeFilter>(6);
  const [startRef, setStartRef] = useState<RifornimentoNorm | null>(null);
  const [endRef, setEndRef] = useState<RifornimentoNorm | null>(null);
  const [periodStartRef, setPeriodStartRef] = useState<RifornimentoNorm | null>(null);
  const [periodEndRef, setPeriodEndRef] = useState<RifornimentoNorm | null>(null);

  useEffect(() => {
    if (!targa) {
      setItems([]);
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const ref = doc(db, "storage", "@rifornimenti");
        const tmpRef = doc(db, "storage", "@rifornimenti_autisti_tmp");
        const [snap, tmpSnap] = await Promise.all([getDoc(ref), getDoc(tmpRef)]);

        if (!snap.exists()) {
          setItems([]);
          setLoading(false);
          return;
        }

        const raw = snap.data();
        let list: any[] = [];
        if (Array.isArray(raw)) {
          list = raw;
        } else if (Array.isArray((raw as any)?.items)) {
          list = (raw as any).items;
        } else if (Array.isArray((raw as any)?.value?.items)) {
          list = (raw as any).value.items;
        } else if (Array.isArray((raw as any)?.value)) {
          list = (raw as any).value;
        }

        const tmpRaw = tmpSnap.exists() ? tmpSnap.data() : null;
        let tmpList: any[] = [];
        if (Array.isArray(tmpRaw)) {
          tmpList = tmpRaw;
        } else if (Array.isArray((tmpRaw as any)?.items)) {
          tmpList = (tmpRaw as any).items;
        } else if (Array.isArray((tmpRaw as any)?.value?.items)) {
          tmpList = (tmpRaw as any).value.items;
        } else if (Array.isArray((tmpRaw as any)?.value)) {
          tmpList = (tmpRaw as any).value;
        }

        const targaNorm = normalizeTarga(targa);
        const filtered = list.filter((r) => {
          const rawTarga =
            r?.mezzoTarga ?? r?.targaCamion ?? r?.targaMotrice ?? null;
          return normalizeTarga(rawTarga) === targaNorm;
        });

        let countBaseNoKm = 0;
        let countMatchedKm = 0;

        const enriched = filtered.map((base) => {
          const kmBase = toNumber((base as any)?.km);
          if (kmBase != null && kmBase > 0) return base;
          countBaseNoKm += 1;

          const baseDate =
            parseDateFlex((base as any)?.data) ||
            parseDateFlex((base as any)?.dataOra) ||
            parseDateFlex((base as any)?.timestamp);
          const baseLitri = toNumber((base as any)?.litri);

          const candidates = tmpList.filter((tmp) => {
            const targaTmp = normalizeTarga(tmp?.targaCamion ?? tmp?.targaMotrice ?? tmp?.mezzoTarga);
            if (targaTmp !== targaNorm) return false;
            const litriTmp = toNumber(tmp?.litri);
            if (baseLitri == null || litriTmp == null || baseLitri !== litriTmp) return false;
            return true;
          });

          let best: any = null;
          let bestDiff = Number.POSITIVE_INFINITY;

          candidates.forEach((tmp) => {
            if (!baseDate) return;
            const tmpDate =
              parseDateFlex(tmp?.data) ||
              parseDateFlex(tmp?.dataOra) ||
              parseDateFlex(tmp?.timestamp);
            if (!tmpDate) return;
            const diffMin = Math.abs(tmpDate.getTime() - baseDate.getTime()) / 60000;
            if (diffMin <= 10 && diffMin < bestDiff) {
              bestDiff = diffMin;
              best = tmp;
            }
          });

          if (!best && baseDate) {
            candidates.forEach((tmp) => {
              const tmpDate =
                parseDateFlex(tmp?.data) ||
                parseDateFlex(tmp?.dataOra) ||
                parseDateFlex(tmp?.timestamp);
              if (!tmpDate) return;
              const sameDay =
                tmpDate.getFullYear() === baseDate.getFullYear() &&
                tmpDate.getMonth() === baseDate.getMonth() &&
                tmpDate.getDate() === baseDate.getDate();
              if (!sameDay) return;
              const diffMin = Math.abs(tmpDate.getTime() - baseDate.getTime()) / 60000;
              if (diffMin < bestDiff) {
                bestDiff = diffMin;
                best = tmp;
              }
            });
          }

          if (best) {
            const kmTmp = toNumber(best?.km);
            if (kmTmp != null) {
              countMatchedKm += 1;
              return { ...base, km: kmTmp };
            }
          }

          return base;
        });

        console.debug("[Rifornimenti][merge]", {
          countBase: filtered.length,
          countBaseNoKm,
          countMatchedKm,
        });

        setItems(enriched);
      } catch (e) {
        console.error("Errore caricamento rifornimenti:", e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [targa]);

  const normalized = useMemo(() => {
    return items
      .map((r) => {
        const dateObj =
          parseDateFlex(r.data) ||
          parseDateFlex((r as any)?.dataOra) ||
          parseDateFlex(r.timestamp);
        return {
          ...r,
          dateObj,
          kmNum: toNumber(r.km),
          litriNum: toNumber(r.litri),
        };
      })
      .filter((r) => !!r.dateObj) as RifornimentoNorm[];
  }, [items]);

  const sorted = useMemo(
    () =>
      [...normalized].sort(
        (a, b) => a.dateObj.getTime() - b.dateObj.getTime()
      ),
    [normalized]
  );

  const last10 = [...sorted]
    .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime())
    .slice(0, 10);

  const rangeData = useMemo(() => {
    const now = new Date();
    const start =
      rangeMonths === "MESE"
        ? new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
        : new Date(
            now.getFullYear(),
            now.getMonth() - (rangeMonths - 1),
            1
          );
    const startTs = start.getTime();
    const endTs = now.getTime();

    const filtered = sorted.filter((r) => {
      const ts = r.dateObj.getTime();
      return ts >= startTs && ts <= endTs;
    });

    const months: Array<{ key: string; label: string }> = [];
    const monthsCount = rangeMonths === "MESE" ? 1 : rangeMonths;
    for (let i = monthsCount - 1; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = formatDateUI(d);
      months.push({ key, label });
    }

    const litriByMonth: Record<string, number> = {};
    const recordsByMonth: Record<string, typeof filtered> = {};
    months.forEach((m) => {
      litriByMonth[m.key] = 0;
      recordsByMonth[m.key] = [];
    });

    const monthKeys = new Set(months.map((m) => m.key));
    filtered.forEach((r) => {
      const d = r.dateObj;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthKeys.has(key)) return;
      const litri = typeof r.litriNum === "number" ? r.litriNum : 0;
      litriByMonth[key] += litri;
      recordsByMonth[key].push(r);
    });

    const monthData = months.map((m) => {
      const monthRecords = recordsByMonth[m.key] || [];
      const kmSeries = monthRecords
        .filter((r) => typeof r.kmNum === "number" && (r.kmNum as number) > 0)
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

      let kmMese: number | null = null;
      if (kmSeries.length >= 2) {
        const kmStart = kmSeries[0].kmNum as number;
        const kmEnd = kmSeries[kmSeries.length - 1].kmNum as number;
        const delta = kmEnd - kmStart;
        kmMese = delta > 0 ? Math.round(delta) : null;
      }

      return {
        mese: m.label,
        litri: litriByMonth[m.key],
        km: kmMese,
      };
    });

    const totalLitriRange = filtered.reduce(
      (sum, r) => sum + (r.litriNum || 0),
      0
    );

    return { filtered, monthData, totalLitriRange };
  }, [sorted, rangeMonths]);

  const dailyPeriodData = useMemo(() => {
    const now = new Date();
    const start =
      rangeMonths === "MESE"
        ? new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
        : new Date(
            now.getFullYear(),
            now.getMonth() - (rangeMonths - 1),
            1
          );
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(0, 0, 0, 0);

    const byDay = new Map<
      string,
      { litri: number; kmMin: number | null; kmMax: number | null; count: number }
    >();

    rangeData.filtered.forEach((r) => {
      const key = toLocalDayKey(r.dateObj);
      const entry = byDay.get(key) ?? {
        litri: 0,
        kmMin: null,
        kmMax: null,
        count: 0,
      };
      const litri = typeof r.litriNum === "number" ? r.litriNum : 0;
      entry.litri += litri;
      if (litri > 0) entry.count += 1;
      if (typeof r.kmNum === "number" && r.kmNum > 0) {
        entry.kmMin = entry.kmMin == null ? r.kmNum : Math.min(entry.kmMin, r.kmNum);
        entry.kmMax = entry.kmMax == null ? r.kmNum : Math.max(entry.kmMax, r.kmNum);
      }
      byDay.set(key, entry);
    });

    const data: Array<{
      dayKey: string;
      labelShort: string;
      labelLong: string;
      litri: number;
      kmMin: number | null;
      kmMax: number | null;
      count: number;
    }> = [];
    const cursor = new Date(start);
    while (cursor.getTime() <= end.getTime()) {
      const key = toLocalDayKey(cursor);
      const entry = byDay.get(key);
      data.push({
        dayKey: key,
        labelShort: formatDayShort(cursor),
        labelLong: formatDateUI(cursor),
        litri: entry?.litri ?? 0,
        kmMin: entry?.kmMin ?? null,
        kmMax: entry?.kmMax ?? null,
        count: entry?.count ?? 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return { data, start, end };
  }, [rangeData.filtered, rangeMonths]);

  const totalLitriAll = useMemo(
    () => sorted.reduce((sum, r) => sum + (r.litriNum || 0), 0),
    [sorted]
  );

  const kmPercorsiPeriodo = useMemo(() => {
    if (!rangeData.filtered.length) return null;
    const kmSeries = rangeData.filtered
      .filter((r) => typeof r.kmNum === "number" && (r.kmNum as number) > 0)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    if (kmSeries.length < 2) return null;
    const kmStart = kmSeries[0].kmNum as number;
    const kmEnd = kmSeries[kmSeries.length - 1].kmNum as number;
    const kmPercorsi = kmEnd - kmStart;
    if (kmPercorsi <= 0) return null;
    return Math.round(kmPercorsi);
  }, [rangeData.filtered]);

  const consumoMedioPeriodo = useMemo(() => {
    if (!rangeData.filtered.length) return null;

    const litriTotPeriodo = rangeData.filtered.reduce(
      (sum, r) => sum + (typeof r.litriNum === "number" ? r.litriNum : 0),
      0
    );

    if (kmPercorsiPeriodo == null || kmPercorsiPeriodo < 50) {
      console.debug("[Rifornimenti][consumo] no-data", {
        kmStart: kmPercorsiPeriodo == null ? null : 0,
        kmEnd: kmPercorsiPeriodo == null ? null : kmPercorsiPeriodo,
        kmPercorsi: kmPercorsiPeriodo,
        litriTotPeriodo,
      });
      return null;
    }

    const consumo = (litriTotPeriodo / kmPercorsiPeriodo) * 100;
    console.debug("[Rifornimenti][consumo] ok", {
      kmPercorsi: kmPercorsiPeriodo,
      litriTotPeriodo,
      consumo,
    });
    return Math.round(consumo * 10) / 10;
  }, [rangeData.filtered, kmPercorsiPeriodo]);

  const last7Days = useMemo(() => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);

    const labelByKey: Record<string, string> = {};
    const keyByLabel: Record<string, string> = {};
    const dayBuckets: Array<{ key: string; label: string }> = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = getDayKey(d);
      const label = formatDateUI(d);
      labelByKey[key] = label;
      keyByLabel[label] = key;
      dayBuckets.push({ key, label });
    }

    const litriByDay: Record<string, number> = {};
    dayBuckets.forEach((b) => {
      litriByDay[b.key] = 0;
    });

    let hasData = false;
    const consumoByDay = new Map<
      string,
      {
        consumo?: {
          consumoL100: number;
          kmPerLitro: number;
          deltaKm: number;
          prevDate: Date;
          currDate: Date;
          litriCurr: number;
        };
        currDate: Date;
      }
    >();

    sorted.forEach((r) => {
      const key = getDayKey(r.dateObj);
      if (!(key in litriByDay)) return;
      const litri = typeof r.litriNum === "number" ? r.litriNum : 0;
      if (litri) hasData = true;
      litriByDay[key] += litri;
    });

    const consumoPerRecord = new Map<
      string,
      {
        consumoL100: number;
        kmPerLitro: number;
        deltaKm: number;
        prevDate: Date;
        currDate: Date;
        litriCurr: number;
      }
    >();

    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (
        typeof prev.kmNum !== "number" ||
        typeof curr.kmNum !== "number" ||
        typeof curr.litriNum !== "number"
      ) {
        continue;
      }
      const deltaKm = (curr.kmNum as number) - (prev.kmNum as number);
      if (deltaKm <= 0 || deltaKm < 50) continue;
      const litriCurr = curr.litriNum as number;
      if (litriCurr <= 0) continue;
      const consumoL100 = (litriCurr / deltaKm) * 100;
      const kmPerLitro = deltaKm / litriCurr;
      consumoPerRecord.set(getRecordKey(curr), {
        consumoL100,
        kmPerLitro,
        deltaKm,
        prevDate: prev.dateObj,
        currDate: curr.dateObj,
        litriCurr,
      });
    }

    const dayKeySet = new Set(dayBuckets.map((b) => b.key));
    sorted.forEach((r) => {
      const dayKey = getDayKey(r.dateObj);
      if (!dayKeySet.has(dayKey)) return;
      const meta = consumoPerRecord.get(getRecordKey(r));
      const existing = consumoByDay.get(dayKey);
      if (!existing || r.dateObj.getTime() > existing.currDate.getTime()) {
        consumoByDay.set(dayKey, { consumo: meta, currDate: r.dateObj });
      }
    });

    const data = dayBuckets.map((b) => {
      const consumo = consumoByDay.get(b.key)?.consumo;
      return {
        dayKey: b.key,
        giorno: b.label,
        litri: litriByDay[b.key],
        consumoL100: consumo ? Math.round(consumo.consumoL100 * 10) / 10 : null,
        consumoMeta: consumo,
      };
    });

    return { data, hasData, labelByKey, keyByLabel };
  }, [sorted]);

  const chartData = useMemo(() => last7Days.data, [last7Days.data]);

  const refuelsByDay = useMemo(() => {
    const map = new Map<string, RifornimentoNorm[]>();
    sorted.forEach((r) => {
      const key = getDayKey(r.dateObj);
      const existing = map.get(key);
      if (existing) {
        existing.push(r);
      } else {
        map.set(key, [r]);
      }
    });
    return map;
  }, [sorted]);

  const refuelsByLocalDay = useMemo(() => {
    const map = new Map<string, RifornimentoNorm[]>();
    sorted.forEach((r) => {
      const key = toLocalDayKey(r.dateObj);
      const existing = map.get(key);
      if (existing) {
        existing.push(r);
      } else {
        map.set(key, [r]);
      }
    });
    return map;
  }, [sorted]);

  const selectionInfo = useMemo(() => {
    if (!startRef || !endRef) return null;
    let start = startRef;
    let end = endRef;
    if (end.dateObj.getTime() < start.dateObj.getTime()) {
      [start, end] = [end, start];
    }

    const startLabel =
      last7Days.labelByKey[getDayKey(start.dateObj)] ?? formatDayShort(start.dateObj);
    const endLabel =
      last7Days.labelByKey[getDayKey(end.dateObj)] ?? formatDayShort(end.dateObj);

    const hasKm =
      typeof start.kmNum === "number" &&
      typeof end.kmNum === "number" &&
      start.kmNum > 0 &&
      end.kmNum > 0;
    const deltaKm = hasKm ? (end.kmNum as number) - (start.kmNum as number) : null;
    const deltaKmValid = deltaKm != null && deltaKm >= 50;

    const startTime = start.dateObj.getTime();
    const endTime = end.dateObj.getTime();
    let countRange = 0;
    const litriRange = sorted.reduce((sum, r) => {
      const t = r.dateObj.getTime();
      if (t > startTime && t <= endTime) {
        const litri = typeof r.litriNum === "number" ? r.litriNum : 0;
        if (litri > 0) countRange += 1;
        return sum + litri;
      }
      return sum;
    }, 0);

    const consumo =
      deltaKmValid && litriRange > 0 ? (litriRange / (deltaKm as number)) * 100 : null;
    const kmPerLitro =
      deltaKmValid && litriRange > 0 ? (deltaKm as number) / litriRange : null;

    return {
      startLabel,
      endLabel,
      deltaKm,
      deltaKmValid,
      litriRange,
      countRange,
      consumo,
      kmPerLitro,
    };
  }, [startRef, endRef, last7Days.labelByKey, sorted]);

  const selectionMarks = useMemo(() => {
    if (!startRef || !endRef) return null;
    const startKey = getDayKey(startRef.dateObj);
    const endKey = getDayKey(endRef.dateObj);
    const startIndex = chartData.findIndex((row) => row.dayKey === startKey);
    const endIndex = chartData.findIndex((row) => row.dayKey === endKey);
    if (startIndex < 0 || endIndex < 0) return null;

    const [fromIndex, toIndex] =
      startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex];

    const startRow = chartData[startIndex];
    const endRow = chartData[endIndex];
    const fromLabel = chartData[fromIndex].giorno;
    const toLabel = chartData[toIndex].giorno;

    return {
      startLabel: startRow.giorno,
      endLabel: endRow.giorno,
      fromLabel,
      toLabel,
      startY: typeof startRow.litri === "number" ? startRow.litri : 0,
      endY: typeof endRow.litri === "number" ? endRow.litri : 0,
    };
  }, [chartData, startRef, endRef]);

  const startDisplay = useMemo(() => {
    if (!startRef) return "--/--";
    const label =
      last7Days.labelByKey[getDayKey(startRef.dateObj)] ?? formatDayShort(startRef.dateObj);
    const km =
      typeof startRef.kmNum === "number" ? Math.round(startRef.kmNum) : "--";
    const litri =
      typeof startRef.litriNum === "number" ? Math.round(startRef.litriNum) : "--";
    return `${label} (km ${km} | L ${litri})`;
  }, [startRef, last7Days.labelByKey]);

  const endDisplay = useMemo(() => {
    if (!endRef) return "--/--";
    const label =
      last7Days.labelByKey[getDayKey(endRef.dateObj)] ?? formatDayShort(endRef.dateObj);
    const km = typeof endRef.kmNum === "number" ? Math.round(endRef.kmNum) : "--";
    const litri =
      typeof endRef.litriNum === "number" ? Math.round(endRef.litriNum) : "--";
    return `${label} (km ${km} | L ${litri})`;
  }, [endRef, last7Days.labelByKey]);

  const periodStartDisplay = useMemo(() => {
    if (!periodStartRef) return "--/--";
    const label = formatDayKeyShort(toLocalDayKey(periodStartRef.dateObj));
    const km =
      typeof periodStartRef.kmNum === "number" ? Math.round(periodStartRef.kmNum) : "--";
    const litri =
      typeof periodStartRef.litriNum === "number"
        ? Math.round(periodStartRef.litriNum)
        : "--";
    return `${label} (km ${km} | L ${litri})`;
  }, [periodStartRef]);

  const periodEndDisplay = useMemo(() => {
    if (!periodEndRef) return "--/--";
    const label = formatDayKeyShort(toLocalDayKey(periodEndRef.dateObj));
    const km =
      typeof periodEndRef.kmNum === "number" ? Math.round(periodEndRef.kmNum) : "--";
    const litri =
      typeof periodEndRef.litriNum === "number" ? Math.round(periodEndRef.litriNum) : "--";
    return `${label} (km ${km} | L ${litri})`;
  }, [periodEndRef]);

  const periodSelectionInfo = useMemo(() => {
    if (!periodStartRef || !periodEndRef) return null;
    let start = periodStartRef;
    let end = periodEndRef;
    if (end.dateObj.getTime() < start.dateObj.getTime()) {
      [start, end] = [end, start];
    }

    const startLabel = formatDayKeyShort(toLocalDayKey(start.dateObj));
    const endLabel = formatDayKeyShort(toLocalDayKey(end.dateObj));

    const hasKm =
      typeof start.kmNum === "number" &&
      typeof end.kmNum === "number" &&
      start.kmNum > 0 &&
      end.kmNum > 0;
    const deltaKm = hasKm ? (end.kmNum as number) - (start.kmNum as number) : null;
    const deltaKmValid = deltaKm != null && deltaKm > 0;

    const startTime = start.dateObj.getTime();
    const endTime = end.dateObj.getTime();
    let countRange = 0;
    const litriRange = sorted.reduce((sum, r) => {
      const t = r.dateObj.getTime();
      if (t >= startTime && t <= endTime) {
        const litri = typeof r.litriNum === "number" ? r.litriNum : 0;
        if (litri > 0) countRange += 1;
        return sum + litri;
      }
      return sum;
    }, 0);

    const consumo =
      deltaKmValid && litriRange > 0 ? (litriRange / (deltaKm as number)) * 100 : null;
    const kmPerLitro =
      deltaKmValid && litriRange > 0 ? (deltaKm as number) / litriRange : null;

    return {
      startLabel,
      endLabel,
      deltaKm,
      deltaKmValid,
      litriRange,
      countRange,
      consumo,
      kmPerLitro,
    };
  }, [periodStartRef, periodEndRef, sorted]);

  const periodSelectionMarks = useMemo(() => {
    if (!periodStartRef || !periodEndRef) return null;
    const startKey = toLocalDayKey(periodStartRef.dateObj);
    const endKey = toLocalDayKey(periodEndRef.dateObj);
    const startIndex = dailyPeriodData.data.findIndex((row) => row.dayKey === startKey);
    const endIndex = dailyPeriodData.data.findIndex((row) => row.dayKey === endKey);
    if (startIndex < 0 || endIndex < 0) return null;

    const [fromIndex, toIndex] =
      startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex];

    const startRow = dailyPeriodData.data[startIndex];
    const endRow = dailyPeriodData.data[endIndex];

    return {
      startKey,
      endKey,
      fromKey: dailyPeriodData.data[fromIndex].dayKey,
      toKey: dailyPeriodData.data[toIndex].dayKey,
      startY: typeof startRow.litri === "number" ? startRow.litri : 0,
      endY: typeof endRow.litri === "number" ? endRow.litri : 0,
    };
  }, [dailyPeriodData.data, periodStartRef, periodEndRef]);

  const periodTickInterval = useMemo(() => {
    const count = dailyPeriodData.data.length;
    if (count <= 12) return 0;
    return Math.max(Math.floor(count / 10) - 1, 0);
  }, [dailyPeriodData.data.length]);

  const findRefuelOfDay = (
    dayKey: string,
    map: Map<string, RifornimentoNorm[]>
  ): RifornimentoNorm | null => {
    const dayItems = map.get(dayKey) ?? [];
    const withLitri = dayItems.filter(
      (r) => typeof r.litriNum === "number" && (r.litriNum as number) > 0
    );
    if (!withLitri.length) return null;
    const withKm = withLitri.filter(
      (r) => typeof r.kmNum === "number" && (r.kmNum as number) > 0
    );
    const candidates = withKm.length ? withKm : withLitri;
    const sortedCandidates = [...candidates].sort(
      (a, b) => a.dateObj.getTime() - b.dateObj.getTime()
    );
    return sortedCandidates[sortedCandidates.length - 1] ?? null;
  };

  const pickDay = (dayKey: string) => {
    const refuelOfDay = findRefuelOfDay(dayKey, refuelsByDay);
    if (!refuelOfDay) return;

    if (!startRef) {
      setStartRef(refuelOfDay);
      setEndRef(null);
      return;
    }

    if (startRef && !endRef) {
      if (getDayKey(refuelOfDay.dateObj) === getDayKey(startRef.dateObj)) return;
      setEndRef(refuelOfDay);
      return;
    }

    setStartRef(refuelOfDay);
    setEndRef(null);
  };

  const handlePickDay = (payload?: { [key: string]: any }) => {
    const labelKey = payload?.giorno;
    if (!labelKey) return;
    const dayKey =
      last7Days.keyByLabel[labelKey] ??
      chartData.find((row) => row.giorno === labelKey)?.dayKey;
    if (!dayKey) return;
    pickDay(dayKey);
  };

  const pickPeriodDay = (dayKey: string) => {
    const refuelOfDay = findRefuelOfDay(dayKey, refuelsByLocalDay);
    if (!refuelOfDay) return;

    if (!periodStartRef) {
      setPeriodStartRef(refuelOfDay);
      setPeriodEndRef(null);
      return;
    }

    if (periodStartRef && !periodEndRef) {
      if (toLocalDayKey(refuelOfDay.dateObj) === toLocalDayKey(periodStartRef.dateObj)) return;
      setPeriodEndRef(refuelOfDay);
      return;
    }

    setPeriodStartRef(refuelOfDay);
    setPeriodEndRef(null);
  };

  const handlePickPeriodDay = (payload?: { [key: string]: any }) => {
    const dayKey = payload?.dayKey;
    if (!dayKey) return;
    pickPeriodDay(dayKey);
  };

  const resetSelection = () => {
    setStartRef(null);
    setEndRef(null);
  };

  const resetPeriodSelection = () => {
    setPeriodStartRef(null);
    setPeriodEndRef(null);
  };

  if (!targa) return null;

  if (loading) {
    return (
      <section className="dossier-card dossier-card-full">
        <div className="dossier-card-body">
          <div className="dossier-loading">Caricamento…</div>
        </div>
      </section>
    );
  }

  if (!sorted.length) {
    return (
      <section className="dossier-card dossier-card-full">
        <div className="dossier-card-header">
          <h2>Rifornimenti</h2>
        </div>
        <div className="dossier-card-body">
          <p className="dossier-empty">Nessun rifornimento per questa targa.</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="dossier-card">
        <div className="dossier-card-header">
          <h2>Riepilogo rifornimenti</h2>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {(["MESE", 3, 6, 9, 12] as RangeFilter[]).map((value) => (
              <button
                key={value}
                type="button"
                className={`dossier-button ${rangeMonths === value ? "primary" : "ghost"}`}
                onClick={() => setRangeMonths(value)}
              >
                {value === "MESE" ? "MESE" : `${value} mesi`}
              </button>
            ))}
          </div>
        </div>
        <div className="dossier-card-body">
          <ul className="dossier-list">
            <li className="dossier-list-item">
              <strong>Totale litri (periodo)</strong>
              <span>{rangeData.totalLitriRange.toFixed(2)}</span>
            </li>
            <li className="dossier-list-item">
              <strong>Totale litri (tutto)</strong>
              <span>{totalLitriAll.toFixed(2)}</span>
            </li>
            <li className="dossier-list-item">
              <strong>Costo</strong>
              <span>Non disponibile</span>
            </li>
            <li className="dossier-list-item">
              <strong>KM nel periodo</strong>
              <span>
                {kmPercorsiPeriodo != null
                  ? kmPercorsiPeriodo.toFixed(0)
                  : "non calcolabili (km mancanti/non coerenti)"}
              </span>
            </li>
            <li className="dossier-list-item">
              <strong>Consumo medio (periodo)</strong>
              <span>
                {consumoMedioPeriodo != null
                  ? `${consumoMedioPeriodo.toFixed(1)} L/100km`
                  : "dati insufficienti"}
              </span>
            </li>
            {rangeMonths === 12 && (
              <li className="dossier-list-item">
                <strong>Totale litri (12 mesi)</strong>
                <span>{rangeData.totalLitriRange.toFixed(2)}</span>
              </li>
            )}
          </ul>
        </div>
      </section>

      <section className="dossier-card dossier-card-full">
        <div className="dossier-card-header">
          <h2>Ultimi rifornimenti</h2>
        </div>
        <div className="dossier-card-body">
          <ul className="dossier-list">
            {last10.map((r) => (
              <li key={String(r.id)} className="dossier-list-item">
                <div className="dossier-list-main">
                  <strong>{formatDateLabel(r.dateObj)}</strong>
                </div>
                <div className="dossier-list-meta">
                  <span>{r.litriNum != null ? `${r.litriNum} L` : "-"}</span>
                  <span>{r.kmNum != null ? `${r.kmNum} km` : "-"}</span>
                  <span>{r.distributore || "-"}</span>
                  <span>{r.note || "-"}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="dossier-card dossier-card-full">
        <div
          className="dossier-card-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <h2>Litri giornalieri (periodo)</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <div
              style={{
                padding: "4px 8px",
                border: "1px solid #d0d0d0",
                borderRadius: "999px",
                fontSize: "12px",
                background: "#f7f7f7",
              }}
            >
              START: {periodStartDisplay}
            </div>
            <div
              style={{
                padding: "4px 8px",
                border: "1px solid #d0d0d0",
                borderRadius: "999px",
                fontSize: "12px",
                background: "#f7f7f7",
              }}
            >
              END: {periodEndDisplay}
            </div>
            <button
              type="button"
              className="dossier-button ghost"
              style={{ padding: "4px 8px", fontSize: "12px" }}
              onClick={resetPeriodSelection}
            >
              Reset
            </button>
          </div>
        </div>
        <div className="dossier-card-body">
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={dailyPeriodData.data}>
              <XAxis
                dataKey="dayKey"
                interval={periodTickInterval}
                tickFormatter={(value) => formatDayKeyShort(String(value))}
              />
              <YAxis yAxisId="left" />
              <Legend />
              {periodSelectionMarks && (
                <>
                  <ReferenceArea
                    x1={periodSelectionMarks.fromKey}
                    x2={periodSelectionMarks.toKey}
                    fill="#8884d8"
                    fillOpacity={0.08}
                    stroke="#8884d8"
                    strokeDasharray="4 4"
                  />
                  <ReferenceLine
                    x={periodSelectionMarks.startKey}
                    stroke="#8884d8"
                    strokeDasharray="4 4"
                  />
                  <ReferenceLine
                    x={periodSelectionMarks.endKey}
                    stroke="#8884d8"
                    strokeDasharray="4 4"
                  />
                  <ReferenceDot
                    x={periodSelectionMarks.startKey}
                    y={periodSelectionMarks.startY}
                    r={5}
                    fill="#8884d8"
                    stroke="none"
                  />
                  <ReferenceDot
                    x={periodSelectionMarks.endKey}
                    y={periodSelectionMarks.endY}
                    r={5}
                    fill="#8884d8"
                    stroke="none"
                  />
                </>
              )}
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const row: any = payload[0]?.payload;
                  if (!row) return null;
                  const dayKey = row.dayKey;
                  const label =
                    row.labelLong ?? (dayKey ? formatDayKeyLong(String(dayKey)) : "");
                  const litri = row.litri;
                  const kmEnd = row.kmMax;
                  const startKey = periodStartRef ? toLocalDayKey(periodStartRef.dateObj) : null;
                  const endKey = periodEndRef ? toLocalDayKey(periodEndRef.dateObj) : null;
                  const isStart = !!startKey && dayKey === startKey;
                  const isEnd = !!endKey && dayKey === endKey;

                  return (
                    <div className="dossier-tooltip">
                      <div><strong>{label}</strong></div>
                      <div>Litri giorno: {litri ? litri : 0}</div>
                      {kmEnd != null && <div>Km (fine giorno): {Math.round(kmEnd)}</div>}
                      {isStart && <div>START</div>}
                      {isEnd && <div>END</div>}
                    </div>
                  );
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="litri"
                strokeWidth={3}
                name="Litri riforniti"
                dot={<FuelDot onPick={handlePickPeriodDay} />}
                activeDot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
          {periodSelectionInfo && (
            <div
              style={{
                marginTop: "10px",
                padding: "8px 10px",
                border: "1px dashed #c7c7c7",
                borderRadius: "6px",
              }}
            >
              <strong>
                Dal {periodSelectionInfo.startLabel} al {periodSelectionInfo.endLabel}
              </strong>
              {periodSelectionInfo.deltaKmValid ? (
                <div>ΔKM: {Math.round(periodSelectionInfo.deltaKm as number)}</div>
              ) : (
                <div>ΔKM non calcolabile (km mancanti o non coerenti)</div>
              )}
              {periodSelectionInfo.litriRange > 0 ? (
                <div>
                  Litri consumati nel range: {periodSelectionInfo.litriRange.toFixed(2)}
                </div>
              ) : (
                <div>Nessun rifornimento nel range</div>
              )}
              {periodSelectionInfo.consumo != null && (
                <div>Consumo: {periodSelectionInfo.consumo.toFixed(1)} L/100km</div>
              )}
              {periodSelectionInfo.kmPerLitro != null && (
                <div>Equivalente: {periodSelectionInfo.kmPerLitro.toFixed(2)} km/L</div>
              )}
              <div>Rifornimenti inclusi: {periodSelectionInfo.countRange}</div>
            </div>
          )}
        </div>
      </section>

      <section className="dossier-card dossier-card-full">
        <div
          className="dossier-card-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <h2>Rifornimenti giornalieri (Litri)</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <div
              style={{
                padding: "4px 8px",
                border: "1px solid #d0d0d0",
                borderRadius: "999px",
                fontSize: "12px",
                background: "#f7f7f7",
              }}
            >
              START: {startDisplay}
            </div>
            <div
              style={{
                padding: "4px 8px",
                border: "1px solid #d0d0d0",
                borderRadius: "999px",
                fontSize: "12px",
                background: "#f7f7f7",
              }}
            >
              END: {endDisplay}
            </div>
            <button
              type="button"
              className="dossier-button ghost"
              style={{ padding: "4px 8px", fontSize: "12px" }}
              onClick={resetSelection}
            >
              Reset
            </button>
          </div>
        </div>
        <div className="dossier-card-body">
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData}>
              <XAxis dataKey="giorno" />
              <YAxis yAxisId="left" />
              <Legend />
              {selectionMarks && (
                <>
                  <ReferenceArea
                    x1={selectionMarks.fromLabel}
                    x2={selectionMarks.toLabel}
                    fill="#8884d8"
                    fillOpacity={0.08}
                    stroke="#8884d8"
                    strokeDasharray="4 4"
                  />
                  <ReferenceLine
                    x={selectionMarks.startLabel}
                    stroke="#8884d8"
                    strokeDasharray="4 4"
                  />
                  <ReferenceLine
                    x={selectionMarks.endLabel}
                    stroke="#8884d8"
                    strokeDasharray="4 4"
                  />
                  <ReferenceDot
                    x={selectionMarks.startLabel}
                    y={selectionMarks.startY}
                    r={5}
                    fill="#8884d8"
                    stroke="none"
                  />
                  <ReferenceDot
                    x={selectionMarks.endLabel}
                    y={selectionMarks.endY}
                    r={5}
                    fill="#8884d8"
                    stroke="none"
                  />
                </>
              )}
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const row: any = payload[0]?.payload;
                  if (!row) return null;
                  const litri = row.litri;
                  const startKey = startRef ? getDayKey(startRef.dateObj) : null;
                  const endKey = endRef ? getDayKey(endRef.dateObj) : null;
                  const isStart = !!startKey && row.dayKey === startKey;
                  const isEnd = !!endKey && row.dayKey === endKey;

                  return (
                    <div className="dossier-tooltip">
                      <div><strong>{label}</strong></div>
                      <div>Litri giorno: {litri ? litri : 0}</div>
                      {isStart && <div>START</div>}
                      {isEnd && <div>END</div>}
                    </div>
                  );
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="litri"
                strokeWidth={3}
                name="Litri riforniti"
                dot={<FuelDot onPick={handlePickDay} />}
                activeDot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{ marginTop: "6px", fontSize: "12px", color: "#6b6b6b" }}>
            Clicca sui punti con litri &gt; 0 per selezionare START e END.
          </div>
          {!last7Days.hasData && (
            <div className="dossier-empty" style={{ marginTop: "8px" }}>
              Nessun rifornimento negli ultimi 7 giorni.
            </div>
          )}
          {selectionInfo && (
            <div
              style={{
                marginTop: "10px",
                padding: "8px 10px",
                border: "1px dashed #c7c7c7",
                borderRadius: "6px",
              }}
            >
              <strong>
                Dal {selectionInfo.startLabel} al {selectionInfo.endLabel}
              </strong>
              {selectionInfo.deltaKmValid ? (
                <div>ΔKM: {Math.round(selectionInfo.deltaKm as number)}</div>
              ) : (
                <div>ΔKM non calcolabile (km mancanti o non coerenti)</div>
              )}
              {selectionInfo.litriRange > 0 ? (
                <div>
                  Litri consumati nel range: {selectionInfo.litriRange.toFixed(2)}
                </div>
              ) : (
                <div>Nessun rifornimento nel range</div>
              )}
              {selectionInfo.consumo != null && (
                <div>Consumo: {selectionInfo.consumo.toFixed(1)} L/100km</div>
              )}
              {selectionInfo.kmPerLitro != null && (
                <div>Equivalente: {selectionInfo.kmPerLitro.toFixed(2)} km/L</div>
              )}
              <div>Rifornimenti inclusi: {selectionInfo.countRange}</div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
