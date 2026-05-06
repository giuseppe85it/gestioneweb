import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { collection, doc, getDoc, getDocs, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD5UVGv-sdjYQnLrva35EQLYxxhjWNGMV4",
  authDomain: "gestionemanutenzione-934ef.firebaseapp.com",
  databaseURL: "https://gestionemanutenzione-934ef-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gestionemanutenzione-934ef",
  storageBucket: "gestionemanutenzione-934ef.firebasestorage.app",
  messagingSenderId: "716845762405",
  appId: "1:716845762405:web:1db7e030d07aaf5ac3e326",
};

const app = getApps()[0] ?? initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export type RawRecord = Record<string, unknown>;

export type RifornimentiRankingRow = {
  targa: string;
  count: number;
  ids: string[];
};

export type RifornimentiPeriodoTruth = {
  total: number;
  items: RawRecord[];
  ranking: RifornimentiRankingRow[];
  topPlate: string;
  topCount: number;
};

export async function ensureFirestoreAuth(): Promise<void> {
  if (auth.currentUser) return;
  await signInAnonymously(auth);
}

export async function readStorageDataset(key: string): Promise<RawRecord[]> {
  await ensureFirestoreAuth();
  const snapshot = await getDoc(doc(db, "storage", key));
  if (!snapshot.exists()) return [];
  return normalizeDataset(snapshot.data());
}

export async function readCollectionDataset(key: string): Promise<RawRecord[]> {
  await ensureFirestoreAuth();
  const snapshot = await getDocs(collection(db, key));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
}

export async function getMezzoByTarga(targa: string): Promise<RawRecord | null> {
  const target = normalizePlate(targa);
  const items = await readStorageDataset("@mezzi_aziendali");
  return items.find((item) => normalizePlate(item.targa) === target) ?? null;
}

export async function countMezziTotali(): Promise<number> {
  return (await readStorageDataset("@mezzi_aziendali")).filter((item) => normalizePlate(item.targa)).length;
}

export async function getManutenzioniByPeriodo(from: string, to: string): Promise<RawRecord[]> {
  const fromMs = parseToolDate(from)?.getTime() ?? null;
  const toDate = parseToolDate(to);
  if (toDate) toDate.setHours(23, 59, 59, 999);
  const toMs = toDate?.getTime() ?? null;
  return (await readStorageDataset("@manutenzioni")).filter((item) => {
    const date = parseToolDate(item.data ?? item.dataDocumento ?? item.createdAt ?? item.timestamp);
    if (!date) return false;
    const ms = date.getTime();
    return (fromMs === null || ms >= fromMs) && (toMs === null || ms <= toMs);
  });
}

export async function countManutenzioniByMese(annoMese: string): Promise<number> {
  const [year, month] = annoMese.split("-").map(Number);
  const from = `01/${String(month).padStart(2, "0")}/${year}`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${String(lastDay).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
  return (await getManutenzioniByPeriodo(from, to)).length;
}

export async function getRifornimentiByTarga(targa: string, from?: string, to?: string): Promise<RawRecord[]> {
  const target = normalizePlate(targa);
  const items = [
    ...(await readStorageDataset("@rifornimenti")),
    ...(await readStorageDataset("@rifornimenti_autisti_tmp")),
  ];
  const fromMs = from ? parseToolDate(from)?.getTime() ?? null : null;
  const toDate = to ? parseToolDate(to) : null;
  if (toDate) toDate.setHours(23, 59, 59, 999);
  const toMs = toDate?.getTime() ?? null;
  return items.filter((item) => {
    const raw = JSON.stringify(item);
    const plateMatch = normalizePlate(`${item.targa ?? ""} ${item.mezzoTarga ?? ""} ${raw}`).includes(target);
    if (!plateMatch) return false;
    const date = parseToolDate(item.data ?? item.dataDisplay ?? item.dataLabel ?? item.timestamp);
    const ms = date?.getTime() ?? null;
    return (fromMs === null || (ms !== null && ms >= fromMs)) && (toMs === null || (ms !== null && ms <= toMs));
  });
}

export async function getRifornimentiByPeriodo(from: string, to: string): Promise<RawRecord[]> {
  const fromMs = parseToolDate(from)?.getTime() ?? null;
  const toDate = parseToolDate(to);
  if (toDate) toDate.setHours(23, 59, 59, 999);
  const toMs = toDate?.getTime() ?? null;
  const rows = [
    ...(await readStorageDataset("@rifornimenti")),
    ...(await readStorageDataset("@rifornimenti_autisti_tmp")),
  ].filter((row) => {
    const date = getRifornimentoDate(row);
    const ms = date?.getTime() ?? null;
    return ms !== null && (fromMs === null || ms >= fromMs) && (toMs === null || ms <= toMs);
  });

  return Array.from(new Map(rows.map((row) => [getRifornimentoStableKey(row), row])).values());
}

export async function getRifornimentiRankingByPeriodo(from: string, to: string): Promise<RifornimentiRankingRow[]> {
  const rows = await getRifornimentiByPeriodo(from, to);
  const byPlate = new Map<string, { count: number; ids: string[] }>();
  for (const row of rows) {
    const plate = getRifornimentoPlate(row);
    if (!plate) continue;
    const bucket = byPlate.get(plate) ?? { count: 0, ids: [] };
    bucket.count += 1;
    const id = getRecordId(row);
    if (id) bucket.ids.push(id);
    byPlate.set(plate, bucket);
  }

  return Array.from(byPlate.entries())
    .map(([targa, value]) => ({ targa, count: value.count, ids: value.ids }))
    .sort((left, right) => right.count - left.count || left.targa.localeCompare(right.targa));
}

export async function getRifornimentiTruthByPeriodo(from: string, to: string): Promise<RifornimentiPeriodoTruth> {
  const [items, ranking] = await Promise.all([
    getRifornimentiByPeriodo(from, to),
    getRifornimentiRankingByPeriodo(from, to),
  ]);
  const top = ranking[0];
  return {
    total: items.length,
    items,
    ranking,
    topPlate: top?.targa ?? "",
    topCount: top?.count ?? 0,
  };
}

export async function getFattureByTarga(targa: string): Promise<RawRecord[]> {
  const target = normalizePlate(targa);
  const items = [
    ...(await readStorageDataset("@documenti_mezzi")),
    ...(await readStorageDataset("@costiMezzo")),
    ...(await readCollectionDataset("@documenti_mezzi")),
    ...(await readCollectionDataset("@documenti_magazzino")),
    ...(await readCollectionDataset("@documenti_generici")),
    ...(await readCollectionDataset("@costiMezzo")),
  ];
  return items.filter((item) => normalizePlate(JSON.stringify(item)).includes(target));
}

export async function getEventiByTarga(targa: string): Promise<RawRecord[]> {
  const target = normalizePlate(targa);
  const keys = ["@storico_eventi_operativi", "@segnalazioni_autisti_tmp", "@controlli_mezzo_autisti"];
  const all = (await Promise.all(keys.map(readStorageDataset))).flat();
  return all.filter((item) => normalizePlate(JSON.stringify(item)).includes(target));
}

export async function getAttrezzatureByCantiere(cantiere: string): Promise<RawRecord[]> {
  const query = normalizeText(cantiere);
  return (await readStorageDataset("@attrezzature_cantieri")).filter((item) => normalizeText(JSON.stringify(item)).includes(query));
}

export async function getAutistaByNome(nome: string): Promise<RawRecord | null> {
  const query = normalizeText(nome);
  const items = await readStorageDataset("@colleghi");
  return items.find((item) => normalizeText(JSON.stringify(item)).includes(query)) ?? null;
}

export async function sumCostiMezzo(targa: string, year?: number): Promise<number> {
  const target = normalizePlate(targa);
  const items = await getFattureByTarga(target);
  return items.reduce((sum, item) => {
    const date = parseToolDate(item.dataDocumento ?? item.data ?? item.dateLabel ?? item.createdAt ?? item.timestamp);
    if (year && date?.getFullYear() !== year) return sum;
    return sum + (toNumber(item.importo ?? item.amount ?? item.totaleDocumento ?? item.totale ?? item.totaleFattura) ?? 0);
  }, 0);
}

export function normalizePlate(value: unknown): string {
  return typeof value === "string" ? value.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
}

export function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.toLowerCase().replace(/\s+/g, " ").trim() : "";
}

export function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", ".").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function parseToolDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") return new Date(Math.abs(value) < 10_000_000_000 ? value * 1000 : value);
  if (typeof value === "object") {
    const record = value as { seconds?: number; _seconds?: number; toDate?: () => Date };
    if (typeof record.toDate === "function") return record.toDate();
    if (typeof record.seconds === "number") return new Date(record.seconds * 1000);
    if (typeof record._seconds === "number") return new Date(record._seconds * 1000);
  }
  if (typeof value !== "string") return null;
  const text = value.trim();
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const italian = text.match(/^(\d{1,2})[/.\s-](\d{1,2})[/.\s-](\d{4})/);
  if (italian) return new Date(Number(italian[3]), Number(italian[2]) - 1, Number(italian[1]));
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getRifornimentoDate(value: RawRecord): Date | null {
  return parseToolDate(value.data ?? value.dataDisplay ?? value.dataLabel ?? value.timestamp);
}

function getRifornimentoStableKey(value: RawRecord): string {
  const id = getRecordId(value);
  if (id) return id;
  const date = getRifornimentoDate(value);
  const dateKey = date ? `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}` : "senza-data";
  return `${getRifornimentoPlate(value) || "SENZA_TARGA"}-${dateKey}-${value.litri ?? ""}-${value.km ?? ""}`;
}

function getRifornimentoPlate(value: RawRecord): string {
  const direct = normalizePlate(`${value.targa ?? ""} ${value.mezzoTarga ?? ""}`).match(/TI\d{6}/)?.[0];
  if (direct) return direct;
  return normalizePlate(JSON.stringify(value)).match(/TI\d{6}/)?.[0] ?? "";
}

function getRecordId(value: RawRecord): string {
  const id = value._id ?? value.id ?? value.sourceDocId ?? value.sourceRecordId ?? value.sourceId;
  return typeof id === "string" && id.trim() ? id.trim() : "";
}

function normalizeDataset(data: RawRecord): RawRecord[] {
  const candidates = [
    data.items,
    data.value && typeof data.value === "object" ? (data.value as RawRecord).items : null,
    data.value,
    data.records,
    data.list,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate.filter(isRecord);
  }
  const values = Object.values(data).filter(isRecord);
  return values.length > 0 ? values : [];
}

function isRecord(value: unknown): value is RawRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
