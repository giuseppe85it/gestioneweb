import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { CisternaAutistaEvent, RifornimentoAutistaRecord } from "./types";

export const CISTERNA_DOCUMENTI_COLLECTION = "@documenti_cisterna";
export const CISTERNA_SCHEDE_COLLECTION = "@cisterna_schede_ia";
export const CISTERNA_PARAMETRI_COLLECTION = "@cisterna_parametri_mensili";
export const RIFORNIMENTI_AUTISTI_KEY = "@rifornimenti_autisti_tmp";
export const CISTERNA_REFUEL_TAG = "caravate";

const STORAGE_MEZZI_KEY = "@mezzi_aziendali";
const STORAGE_COLLEGHI_KEY = "@colleghi";

export function monthKeyFromDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

export function currentMonthKey(): string {
  return monthKeyFromDate(new Date());
}

export function monthLabel(monthKey: string): string {
  const [yearRaw, monthRaw] = monthKey.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return monthKey;
  }
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("it-CH", { month: "long", year: "numeric" });
}

function toDateFromUnknown(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  if (typeof value === "number") {
    const ms = value > 1_000_000_000_000 ? value : value * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === "string") {
    const direct = new Date(value);
    if (!Number.isNaN(direct.getTime())) return direct;

    const m = value.trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
    if (m) {
      const day = Number(m[1]);
      const month = Number(m[2]) - 1;
      const year = Number(m[3].length === 2 ? `20${m[3]}` : m[3]);
      const d = new Date(year, month, day);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  if (typeof value === "object" && value !== null) {
    const maybeTs = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };
    if (typeof maybeTs.toDate === "function") {
      const d = maybeTs.toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof maybeTs.seconds === "number") {
      const d = new Date(maybeTs.seconds * 1000);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof maybeTs._seconds === "number") {
      const d = new Date(maybeTs._seconds * 1000);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  return null;
}

function formatDateKey(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function normalizeTarga(value: string): string {
  return String(value || "").trim().toUpperCase();
}

function normalizeLitri(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
}

export function normalizeAutistiEvents(
  records: RifornimentoAutistaRecord[]
): CisternaAutistaEvent[] {
  return records
    .map((record) => {
      const date =
        toDateFromUnknown(record.data) || toDateFromUnknown(record.timestamp);
      if (!date) return null;

      const targaRaw =
        record.targaCamion ?? record.targaMotrice ?? record.mezzoTarga ?? "";
      const targa = normalizeTarga(String(targaRaw ?? ""));
      if (!targa) return null;

      const litri = normalizeLitri(record.litri);
      const data = formatDateKey(date);
      const ora = date.toLocaleTimeString("it-CH", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return {
        id: record.id,
        originId:
          record.id ?? record.autistaId ?? record.badgeAutista ?? record.nomeAutista ?? "",
        targa,
        data,
        dataOra: date.toISOString(),
        ora,
        litri,
        timestamp: date.getTime(),
      } as CisternaAutistaEvent;
    })
    .filter((item): item is CisternaAutistaEvent => Boolean(item));
}

export function getAutistiEventsFor(
  events: CisternaAutistaEvent[],
  dateKey: string,
  targa: string
): CisternaAutistaEvent[] {
  const dateValue = String(dateKey || "").trim();
  const targaValue = normalizeTarga(targa);
  if (!dateValue || !targaValue) return [];
  return events.filter(
    (event) => event.data === dateValue && event.targa === targaValue
  );
}

function unwrapStorageList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const withValue = raw as { value?: unknown };
    if (Array.isArray(withValue.value)) return withValue.value;
  }
  return [];
}

function buildUniqueList(
  items: unknown[],
  getValue: (item: any) => unknown
): string[] {
  const map = new Map<string, string>();
  items.forEach((item) => {
    const raw = getValue(item);
    const text = String(raw ?? "").trim();
    if (!text) return;
    const key = text.toLowerCase();
    if (!map.has(key)) map.set(key, text);
  });
  return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
}

export async function getMezziTarghe(): Promise<string[]> {
  const snap = await getDoc(doc(db, "storage", STORAGE_MEZZI_KEY));
  if (!snap.exists()) return [];
  const list = unwrapStorageList(snap.data());
  return buildUniqueList(list, (item) => item?.targa ?? "");
}

export async function getColleghiNomi(): Promise<string[]> {
  const snap = await getDoc(doc(db, "storage", STORAGE_COLLEGHI_KEY));
  if (!snap.exists()) return [];
  const list = unwrapStorageList(snap.data());
  return buildUniqueList(list, (item) => item?.nome ?? "");
}
