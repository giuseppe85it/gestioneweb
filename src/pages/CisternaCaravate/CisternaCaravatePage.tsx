import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { db } from "../../firebase";
import {
  CISTERNA_DOCUMENTI_COLLECTION,
  CISTERNA_PARAMETRI_COLLECTION,
  CISTERNA_REFUEL_TAG,
  CISTERNA_SCHEDE_COLLECTION,
  currentMonthKey,
  monthLabel,
  monthKeyFromDate,
  RIFORNIMENTI_AUTISTI_KEY,
} from "../../cisterna/collections";
import type {
  CisternaDocumento,
  CisternaParametroMensile,
  RifornimentoAutistaRecord,
} from "../../cisterna/types";
import "./CisternaCaravatePage.css";

type TabKey = "archivio" | "report" | "targhe";

type CisternaSchedaRow = {
  data?: string | null;
  targa?: string | null;
  litri?: number | null;
  nome?: string | null;
  azienda?: string | null;
};

type CisternaSchedaDoc = {
  id: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  source?: "manual" | "ia" | string | null;
  rowCount?: number | null;
  rows?: CisternaSchedaRow[] | null;
  needsReview?: boolean;
  mese?: string | null;
  yearMonth?: string | null;
};

type VeritaRow = {
  id: string;
  dataKey: string;
  targa: string;
  litri: number;
  nome: string;
  autista: string;
  azienda: string;
  timestamp: number;
  source: "manuale" | "autisti";
};

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
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

function getDocDate(docItem: CisternaDocumento): Date | null {
  const fromData = toDateFromUnknown(docItem.dataDocumento);
  if (fromData) return fromData;
  return toDateFromUnknown(docItem.createdAt);
}

function getRefuelDate(record: RifornimentoAutistaRecord): Date | null {
  return (
    toDateFromUnknown(record.data) ||
    toDateFromUnknown(record.timestamp) ||
    null
  );
}

function getRefuelTarga(record: RifornimentoAutistaRecord): string {
  const raw =
    record.targaCamion ?? record.targaMotrice ?? record.mezzoTarga ?? "";
  return String(raw).trim().toUpperCase();
}

function getRefuelAutista(record: RifornimentoAutistaRecord): string {
  const direct = [
    record.autistaNome,
    record.nomeAutista,
    typeof record.autista === "string" ? record.autista : null,
    typeof record.autista === "object" && record.autista
      ? record.autista.nome
      : null,
  ]
    .map((value) => String(value ?? "").trim())
    .find((value) => value !== "");

  return direct || "-";
}

function formatLitri(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "-";
  const rounded = Math.round(value * 100) / 100;
  const text = rounded.toFixed(2);
  return text.replace(/\.?0+$/, "");
}

function formatMoney(
  value: number | null,
  currency: "EUR" | "CHF",
  emptyLabel = "N/D"
): string {
  if (value == null || !Number.isFinite(value)) return emptyLabel;
  return new Intl.NumberFormat("it-CH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatRatio(
  value: number | null,
  currency: "EUR" | "CHF",
  emptyLabel = "N/D"
): string {
  if (value == null || !Number.isFinite(value)) return emptyLabel;
  const amount = new Intl.NumberFormat("it-CH", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value);
  return `${amount} ${currency}/L`;
}

async function toDataUrlFromAsset(path: string): Promise<string | null> {
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function formatDateKey(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function normalizeDateKey(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const match = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (!match) return "";
  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = Number(match[3]);
  if (match[3].length === 2) year += 2000;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return "";
  }
  return formatDateKey(date);
}

function normalizeCurrency(value: unknown): "CHF" | "EUR" | "UNKNOWN" {
  const raw = String(value ?? "").toUpperCase().trim();
  if (!raw) return "UNKNOWN";
  if (raw.includes("CHF") || raw.includes("FR")) return "CHF";
  if (raw.includes("EUR") || raw.includes("EURO")) return "EUR";
  return "UNKNOWN";
}

function isManualScheda(docItem: CisternaSchedaDoc): boolean {
  const source = String(docItem.source ?? "").trim().toLowerCase();
  return source === "manual";
}

function sanitizeForFirestore<T>(value: T, inArray = false): T {
  if (value === undefined) {
    return (inArray ? null : undefined) as T;
  }
  if (value === null) return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForFirestore(item, true)) as T;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    Object.entries(obj).forEach(([key, val]) => {
      const cleaned = sanitizeForFirestore(val, false);
      if (cleaned !== undefined) {
        next[key] = cleaned;
      }
    });
    return next as T;
  }
  return value;
}

function getDocumentoLitri(docItem: CisternaDocumento): number | null {
  return toNumberOrNull(
    docItem.litriTotali ?? docItem.litri15C ?? docItem.litriAmbiente ?? null
  );
}

function getSchedaDate(docItem: CisternaSchedaDoc): Date | null {
  const fromCreated = toDateFromUnknown(docItem.createdAt);
  if (fromCreated) return fromCreated;
  const firstRow = Array.isArray(docItem.rows) ? docItem.rows[0] : null;
  if (firstRow?.data) return toDateFromUnknown(firstRow.data);
  return null;
}

function getSchedaRecencyMs(docItem: CisternaSchedaDoc): number {
  const updated = toDateFromUnknown(docItem.updatedAt)?.getTime() ?? 0;
  if (updated > 0) return updated;
  return toDateFromUnknown(docItem.createdAt)?.getTime() ?? 0;
}

function getSchedaTarga(docItem: CisternaSchedaDoc): string {
  const firstRow = Array.isArray(docItem.rows) ? docItem.rows[0] : null;
  return String(firstRow?.targa ?? "").trim().toUpperCase();
}

function isFatturaDoc(docItem: CisternaDocumento): boolean {
  const tipo = String(docItem.tipoDocumento ?? "").trim().toLowerCase();
  const nomeFile = String(docItem.nomeFile ?? "").trim().toLowerCase();
  return tipo.includes("fattur") || nomeFile.includes("fattur");
}

function isBollettinoDoc(docItem: CisternaDocumento): boolean {
  const tipo = String(docItem.tipoDocumento ?? "").trim().toLowerCase();
  const nomeFile = String(docItem.nomeFile ?? "").trim().toLowerCase();
  return (
    tipo.includes("bollett") ||
    tipo.includes("bolla") ||
    tipo.includes("ddt") ||
    nomeFile.includes("bollett") ||
    nomeFile.includes("bolla") ||
    nomeFile.includes("ddt")
  );
}

export default function CisternaCaravatePage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabKey>("archivio");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey());

  const [docs, setDocs] = useState<CisternaDocumento[]>([]);
  const [docsLoading, setDocsLoading] = useState<boolean>(true);
  const [docsError, setDocsError] = useState<string>("");

  const [refuels, setRefuels] = useState<RifornimentoAutistaRecord[]>([]);
  const [refuelsLoading, setRefuelsLoading] = useState<boolean>(true);
  const [refuelsError, setRefuelsError] = useState<string>("");

  const [schedeDocs, setSchedeDocs] = useState<CisternaSchedaDoc[]>([]);
  const [schedeLoading, setSchedeLoading] = useState<boolean>(true);
  const [schedeError, setSchedeError] = useState<string>("");

  const [cambioInput, setCambioInput] = useState<string>("");
  const [savingCambio, setSavingCambio] = useState<boolean>(false);
  const [cambioStatus, setCambioStatus] = useState<string>("");
  const [dupChoiceByGroup, setDupChoiceByGroup] = useState<Record<string, string>>(
    {}
  );
  const [dupSavingByGroup, setDupSavingByGroup] = useState<Record<string, boolean>>(
    {}
  );
  const [dupErrorByGroup, setDupErrorByGroup] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    let cancelled = false;

    const loadDocs = async () => {
      setDocsLoading(true);
      setDocsError("");
      try {
        const snap = await getDocs(collection(db, CISTERNA_DOCUMENTI_COLLECTION));
        const rows: CisternaDocumento[] = [];
        snap.forEach((docSnap) => {
          const raw = docSnap.data() as Partial<CisternaDocumento>;
          rows.push({
            id: docSnap.id,
            ...raw,
            litri15C: toNumberOrNull(raw.litri15C),
            litriAmbiente: toNumberOrNull(raw.litriAmbiente),
          });
        });

        rows.sort((a, b) => {
          const aMs = getDocDate(a)?.getTime() ?? 0;
          const bMs = getDocDate(b)?.getTime() ?? 0;
          return bMs - aMs;
        });

        if (!cancelled) {
          setDocs(rows);
          setDocsLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setDocsError(err?.message || "Errore caricamento documenti cisterna.");
          setDocsLoading(false);
        }
      }
    };

    void loadDocs();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadRefuels = async () => {
      setRefuelsLoading(true);
      setRefuelsError("");
      try {
        const ref = doc(db, "storage", RIFORNIMENTI_AUTISTI_KEY);
        const snap = await getDoc(ref);
        const raw = snap.exists() ? snap.data() : {};
        const value = Array.isArray(raw?.value)
          ? raw.value
          : Array.isArray(raw)
          ? raw
          : [];
        if (!cancelled) {
          setRefuels(value as RifornimentoAutistaRecord[]);
          setRefuelsLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setRefuelsError(
            err?.message || "Errore caricamento rifornimenti autisti."
          );
          setRefuelsLoading(false);
        }
      }
    };

    void loadRefuels();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadSchede = async () => {
      setSchedeLoading(true);
      setSchedeError("");
      try {
        const snap = await getDocs(collection(db, CISTERNA_SCHEDE_COLLECTION));
        const rows: CisternaSchedaDoc[] = [];
        snap.forEach((docSnap) => {
          const raw = docSnap.data() as Partial<CisternaSchedaDoc>;
          rows.push({
            id: docSnap.id,
            ...raw,
          });
        });

        rows.sort((a, b) => {
          const aMs = getSchedaDate(a)?.getTime() ?? 0;
          const bMs = getSchedaDate(b)?.getTime() ?? 0;
          if (bMs !== aMs) return bMs - aMs;
          return getSchedaTarga(a).localeCompare(getSchedaTarga(b));
        });

        if (!cancelled) {
          setSchedeDocs(rows);
          setSchedeLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setSchedeError(err?.message || "Errore caricamento schede carburante.");
          setSchedeLoading(false);
        }
      }
    };

    void loadSchede();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadCambio = async () => {
      setCambioStatus("");
      try {
        const ref = doc(db, CISTERNA_PARAMETRI_COLLECTION, selectedMonth);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          if (!cancelled) setCambioInput("");
          return;
        }
        const data = snap.data() as Partial<CisternaParametroMensile>;
        const value = toNumberOrNull(data.cambioEurChf);
        if (!cancelled) {
          setCambioInput(value == null ? "" : String(value));
        }
      } catch (err: any) {
        if (!cancelled) {
          setCambioStatus(
            err?.message || "Errore lettura parametro mensile EUR->CHF."
          );
        }
      }
    };

    void loadCambio();

    return () => {
      cancelled = true;
    };
  }, [selectedMonth]);

  const docsOfMonth = useMemo(() => {
    return docs.filter((item) => {
      const d = getDocDate(item);
      if (!d) return false;
      return monthKeyFromDate(d) === selectedMonth;
    });
  }, [docs, selectedMonth]);

  const refuelsCaravateOfMonth = useMemo(() => {
    return refuels.filter((item) => {
      const tipo = String(item.tipo ?? "").trim().toLowerCase();
      if (tipo !== CISTERNA_REFUEL_TAG) return false;
      const d = getRefuelDate(item);
      if (!d) return false;
      return monthKeyFromDate(d) === selectedMonth;
    });
  }, [refuels, selectedMonth]);

  const refuelsMonthlyRows = useMemo(() => {
    return [...refuelsCaravateOfMonth]
      .map((item, index) => {
        const d = getRefuelDate(item);
        const dateLabel = d ? d.toLocaleDateString("it-CH") : "-";
        return {
          id: String(item.id ?? `${index}_${dateLabel}_${getRefuelTarga(item)}`),
          date: d,
          dateLabel,
          targa: getRefuelTarga(item) || "NON INDICATA",
          litri: toNumberOrNull(item.litri) ?? 0,
          autista: getRefuelAutista(item),
        };
      })
      .sort((a, b) => {
        const aMs = a.date?.getTime() ?? 0;
        const bMs = b.date?.getTime() ?? 0;
        if (bMs !== aMs) return bMs - aMs;
        return a.targa.localeCompare(b.targa);
      });
  }, [refuelsCaravateOfMonth]);

  const schedeOfMonth = useMemo(() => {
    return schedeDocs.filter((item) => {
      const ym = String(item.yearMonth ?? item.mese ?? "").trim();
      if (ym) return ym === selectedMonth;
      const d = getSchedaDate(item);
      if (!d) return false;
      return monthKeyFromDate(d) === selectedMonth;
    });
  }, [schedeDocs, selectedMonth]);

  const schedeOfMonthSorted = useMemo(() => {
    return [...schedeOfMonth].sort((a, b) => {
      const aMs = getSchedaDate(a)?.getTime() ?? 0;
      const bMs = getSchedaDate(b)?.getTime() ?? 0;
      if (bMs !== aMs) return bMs - aMs;
      return getSchedaTarga(a).localeCompare(getSchedaTarga(b));
    });
  }, [schedeOfMonth]);

  const manualSchedeOfMonth = useMemo(() => {
    return schedeOfMonth
      .filter((item) => isManualScheda(item))
      .sort((a, b) => {
        const aMs = getSchedaRecencyMs(a);
        const bMs = getSchedaRecencyMs(b);
        if (bMs !== aMs) return bMs - aMs;
        return b.id.localeCompare(a.id);
      });
  }, [schedeOfMonth]);

  const latestManualScheda = manualSchedeOfMonth[0] ?? null;

  const autistiSupportRows = useMemo(() => {
    return refuelsCaravateOfMonth
      .map((item, index) => {
        const dateObj = getRefuelDate(item);
        const dataKey = dateObj ? formatDateKey(dateObj) : "";
        const targa = getRefuelTarga(item) || "NON INDICATA";
        return {
          id: String(item.id ?? `${index}_${dataKey}_${targa}`),
          dataKey,
          targa,
          litri: toNumberOrNull(item.litri) ?? 0,
          nome: "",
          autista: getRefuelAutista(item),
          azienda: "-",
          timestamp: dateObj?.getTime() ?? 0,
          source: "autisti" as const,
        };
      })
      .filter((row) => row.dataKey && row.targa && row.litri > 0)
      .sort((a, b) => {
        if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp;
        return a.targa.localeCompare(b.targa);
      });
  }, [refuelsCaravateOfMonth]);

  const manualVeritaRows = useMemo(() => {
    if (!latestManualScheda || !Array.isArray(latestManualScheda.rows)) return [];
    return latestManualScheda.rows
      .map((row, index) => {
        const dataKey = normalizeDateKey(row.data);
        const targa = String(row.targa ?? "").trim().toUpperCase();
        const litri = toNumberOrNull(row.litri) ?? 0;
        const timestamp = (() => {
          if (!dataKey) return 0;
          const [dd, mm, yyyy] = dataKey.split("/");
          const day = Number(dd);
          const month = Number(mm);
          const year = Number(yyyy);
          const date = new Date(year, month - 1, day);
          if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
          ) {
            return 0;
          }
          return date.getTime();
        })();
        return {
          id: `${latestManualScheda.id}_${index}`,
          dataKey,
          targa,
          litri,
          nome: String(row.nome ?? "").trim(),
          autista: "",
          azienda: String(row.azienda ?? "GHIELMICEMENTI").trim() || "GHIELMICEMENTI",
          timestamp,
          source: "manuale" as const,
        };
      })
      .filter((row) => row.dataKey && row.targa && row.litri > 0)
      .sort((a, b) => {
        if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp;
        return a.targa.localeCompare(b.targa);
      });
  }, [latestManualScheda]);

  const hasManualTruth = Boolean(latestManualScheda);

  const datasetVeritaRows: VeritaRow[] = useMemo(() => {
    if (hasManualTruth) return manualVeritaRows;
    return autistiSupportRows;
  }, [hasManualTruth, manualVeritaRows, autistiSupportRows]);

  const datasetSupportRows: VeritaRow[] = useMemo(() => {
    if (!hasManualTruth) return [];
    return autistiSupportRows;
  }, [hasManualTruth, autistiSupportRows]);

  const fattureDocs = useMemo(() => {
    return docsOfMonth
      .filter((docItem) => isFatturaDoc(docItem))
      .sort((a, b) => {
        const aMs = getDocDate(a)?.getTime() ?? 0;
        const bMs = getDocDate(b)?.getTime() ?? 0;
        if (bMs !== aMs) return bMs - aMs;
        return String(a.fornitore ?? "").localeCompare(String(b.fornitore ?? ""));
      });
  }, [docsOfMonth]);

  const bollettiniDocs = useMemo(() => {
    return docsOfMonth
      .filter((docItem) => isBollettinoDoc(docItem))
      .sort((a, b) => {
        const aMs = getDocDate(a)?.getTime() ?? 0;
        const bMs = getDocDate(b)?.getTime() ?? 0;
        if (bMs !== aMs) return bMs - aMs;
        return String(a.fornitore ?? "").localeCompare(String(b.fornitore ?? ""));
      });
  }, [docsOfMonth]);

  const bollettiniGroups = useMemo(() => {
    const map = new Map<string, { key: string; dataDocumento: string; docs: CisternaDocumento[] }>();
    bollettiniDocs.forEach((docItem) => {
      const dataKey = String(docItem.dataDocumento ?? "").trim();
      if (!dataKey) return;
      const groupKey = `${selectedMonth}__${dataKey}`;
      const group = map.get(groupKey) ?? {
        key: groupKey,
        dataDocumento: dataKey,
        docs: [],
      };
      group.docs.push(docItem);
      map.set(groupKey, group);
    });
    return Array.from(map.values());
  }, [bollettiniDocs, selectedMonth]);

  const duplicateGroups = useMemo(() => {
    return bollettiniGroups.filter((group) => group.docs.length > 1);
  }, [bollettiniGroups]);

  const duplicateChoiceInfo = useMemo(() => {
    const map = new Map<
      string,
      { chosenId: string; hasPersistedChoice: boolean; defaultChosenId: string }
    >();
    duplicateGroups.forEach((group) => {
      const chosenDoc = group.docs.find((docItem) => docItem.dupChosen);
      const maxDoc = group.docs.reduce((prev, current) => {
        const prevLitri = getDocumentoLitri(prev) ?? -Infinity;
        const nextLitri = getDocumentoLitri(current) ?? -Infinity;
        return nextLitri > prevLitri ? current : prev;
      }, group.docs[0]);
      const defaultChosenId = chosenDoc?.id ?? maxDoc.id;
      map.set(group.key, {
        chosenId: defaultChosenId,
        hasPersistedChoice: Boolean(chosenDoc || group.docs.some((doc) => doc.dupIgnored)),
        defaultChosenId,
      });
    });
    return map;
  }, [duplicateGroups]);

  useEffect(() => {
    setDupChoiceByGroup((prev) => {
      const next = { ...prev };
      const validKeys = new Set(duplicateGroups.map((group) => group.key));
      Object.keys(next).forEach((key) => {
        if (!validKeys.has(key)) delete next[key];
      });
      duplicateGroups.forEach((group) => {
        const ids = new Set(group.docs.map((doc) => doc.id));
        const current = next[group.key];
        if (!current || !ids.has(current)) {
          const info = duplicateChoiceInfo.get(group.key);
          next[group.key] = info?.defaultChosenId ?? group.docs[0].id;
        }
      });
      return next;
    });
  }, [duplicateGroups, duplicateChoiceInfo]);

  const bollettiniEffectiveDocs = useMemo(() => {
    const effective: CisternaDocumento[] = [];
    bollettiniDocs.forEach((docItem) => {
      if (docItem.dupIgnored) return;
      const dataKey = String(docItem.dataDocumento ?? "").trim();
      if (!dataKey) {
        effective.push(docItem);
        return;
      }
      const groupKey = `${selectedMonth}__${dataKey}`;
      const info = duplicateChoiceInfo.get(groupKey);
      if (!info) {
        effective.push(docItem);
        return;
      }
      const chosenId = dupChoiceByGroup[groupKey] ?? info.chosenId;
      if (docItem.id === chosenId) {
        effective.push(docItem);
      }
    });
    return effective;
  }, [bollettiniDocs, duplicateChoiceInfo, dupChoiceByGroup, selectedMonth]);

  const litriDocumentiMese = useMemo(() => {
    const nonBollettiniLitri = docsOfMonth
      .filter((item) => !isBollettinoDoc(item))
      .reduce((sum, item) => sum + (toNumberOrNull(item.litri15C) ?? 0), 0);
    const bollettiniLitri = bollettiniEffectiveDocs.reduce(
      (sum, item) => sum + (getDocumentoLitri(item) ?? 0),
      0
    );
    return nonBollettiniLitri + bollettiniLitri;
  }, [docsOfMonth, bollettiniEffectiveDocs]);

  const litriTotaliMese = useMemo(
    () => datasetVeritaRows.reduce((sum, row) => sum + row.litri, 0),
    [datasetVeritaRows]
  );

  const litriSupportoMese = useMemo(
    () => datasetSupportRows.reduce((sum, row) => sum + row.litri, 0),
    [datasetSupportRows]
  );

  const deltaLitriSupporto = litriTotaliMese - litriSupportoMese;

  const cambioValue = useMemo(() => toNumberOrNull(cambioInput), [cambioInput]);

  const fatturaCostData = useMemo(() => {
    let totalEur = 0;
    let totalChf = 0;
    let missingTotalCount = 0;
    let unknownCurrencyCount = 0;
    const currencySet = new Set<"EUR" | "CHF">();

    fattureDocs.forEach((item) => {
      const total = toNumberOrNull(item.totaleDocumento);
      if (total == null) {
        missingTotalCount += 1;
        return;
      }
      const currency = normalizeCurrency(item.valuta ?? item.currency);
      if (currency !== "EUR" && currency !== "CHF") {
        unknownCurrencyCount += 1;
        return;
      }
      currencySet.add(currency);
      if (currency === "EUR") totalEur += total;
      if (currency === "CHF") totalChf += total;
    });

    const baseCurrency = currencySet.size === 1 ? Array.from(currencySet)[0] : null;
    const mixedCurrency = currencySet.size > 1;
    const totalFatturaValuta =
      baseCurrency === "EUR"
        ? totalEur
        : baseCurrency === "CHF"
        ? totalChf
        : null;
    const hasFatture = fattureDocs.length > 0;
    const hasValidFattura =
      hasFatture &&
      !mixedCurrency &&
      missingTotalCount === 0 &&
      unknownCurrencyCount === 0 &&
      totalFatturaValuta != null;

    const costoPerLitroValuta =
      hasValidFattura && litriTotaliMese > 0 && totalFatturaValuta != null
        ? totalFatturaValuta / litriTotaliMese
        : null;

    const totalChfNormalized =
      baseCurrency === "EUR"
        ? cambioValue && cambioValue > 0 && totalFatturaValuta != null
          ? totalFatturaValuta * cambioValue
          : null
        : baseCurrency === "CHF"
        ? totalFatturaValuta
        : null;

    const costoPerLitroChf =
      baseCurrency === "EUR"
        ? cambioValue && cambioValue > 0 && costoPerLitroValuta != null
          ? costoPerLitroValuta * cambioValue
          : null
        : baseCurrency === "CHF"
        ? costoPerLitroValuta
        : null;

    const needsCambioForChf = baseCurrency === "EUR" && !(cambioValue && cambioValue > 0);

    return {
      hasFatture,
      hasValidFattura,
      baseCurrency,
      mixedCurrency,
      missingTotalCount,
      unknownCurrencyCount,
      totalFatturaValuta,
      costoPerLitroValuta,
      totalChfNormalized,
      costoPerLitroChf,
      needsCambioForChf,
    };
  }, [fattureDocs, cambioValue, litriTotaliMese]);

  const costoSummaryLine = useMemo(() => {
    const totalValutaLabel =
      fatturaCostData.baseCurrency && fatturaCostData.totalFatturaValuta != null
        ? formatMoney(fatturaCostData.totalFatturaValuta, fatturaCostData.baseCurrency)
        : "N/D";
    const cambioLabel =
      cambioValue != null && cambioValue > 0
        ? new Intl.NumberFormat("it-CH", {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4,
          }).format(cambioValue)
        : "N/D";
    const totaleChfLabel = formatMoney(fatturaCostData.totalChfNormalized, "CHF");
    const costoLtValutaLabel =
      fatturaCostData.baseCurrency != null
        ? formatRatio(fatturaCostData.costoPerLitroValuta, fatturaCostData.baseCurrency)
        : "N/D";
    const costoLtChfLabel = formatRatio(fatturaCostData.costoPerLitroChf, "CHF");
    return `Totale fatture: ${totalValutaLabel} | Cambio: ${cambioLabel} | Totale CHF: ${totaleChfLabel} | Costo/lt: ${costoLtValutaLabel} / ${costoLtChfLabel}`;
  }, [fatturaCostData, cambioValue]);

  const handleConfirmDupChoice = async (groupKey: string) => {
    const group = duplicateGroups.find((item) => item.key === groupKey);
    if (!group) return;
    const chosenId = dupChoiceByGroup[groupKey];
    if (!chosenId) return;

    setDupSavingByGroup((prev) => ({ ...prev, [groupKey]: true }));
    setDupErrorByGroup((prev) => ({ ...prev, [groupKey]: "" }));

    try {
      const updates = group.docs.map((docItem) => {
        const payload = sanitizeForFirestore({
          dupGroupKey: groupKey,
          dupChosen: docItem.id === chosenId,
          dupIgnored: docItem.id !== chosenId,
          updatedAt: serverTimestamp(),
        });
        return updateDoc(
          doc(db, CISTERNA_DOCUMENTI_COLLECTION, docItem.id),
          payload
        );
      });
      await Promise.all(updates);

      setDocs((prev) =>
        prev.map((docItem) => {
          if (!group.docs.some((item) => item.id === docItem.id)) return docItem;
          return {
            ...docItem,
            dupGroupKey: groupKey,
            dupChosen: docItem.id === chosenId,
            dupIgnored: docItem.id !== chosenId,
          };
        })
      );
    } catch (err: any) {
      setDupErrorByGroup((prev) => ({
        ...prev,
        [groupKey]: err?.message || "Errore durante il salvataggio della scelta.",
      }));
    } finally {
      setDupSavingByGroup((prev) => ({ ...prev, [groupKey]: false }));
    }
  };

  const litriPerTarga = useMemo(() => {
    const map = new Map<string, number>();
    datasetVeritaRows.forEach((row) => {
      map.set(row.targa, (map.get(row.targa) ?? 0) + row.litri);
    });
    return Array.from(map.entries())
      .map(([targa, litri]) => ({
        targa,
        litri,
        costoStimatoValuta:
          fatturaCostData.costoPerLitroValuta == null
            ? null
            : litri * fatturaCostData.costoPerLitroValuta,
        costoStimatoChf:
          fatturaCostData.costoPerLitroChf == null
            ? null
            : litri * fatturaCostData.costoPerLitroChf,
      }))
      .sort((a, b) => a.targa.localeCompare(b.targa));
  }, [datasetVeritaRows, fatturaCostData.costoPerLitroValuta, fatturaCostData.costoPerLitroChf]);

  const supportByDateTarga = useMemo(() => {
    const map = new Map<string, { litri: number; count: number }>();
    datasetSupportRows.forEach((row) => {
      const key = `${row.dataKey}__${row.targa}`;
      const current = map.get(key) ?? { litri: 0, count: 0 };
      current.litri += row.litri;
      current.count += 1;
      map.set(key, current);
    });
    return map;
  }, [datasetSupportRows]);

  const detailRows = useMemo(() => {
    return datasetVeritaRows.map((row) => {
      const supportKey = `${row.dataKey}__${row.targa}`;
      const support = supportByDateTarga.get(supportKey) ?? null;
      const diff = support ? row.litri - support.litri : null;
      const isMatch = support ? Math.abs(diff || 0) <= 2 : false;
      return {
        id: row.id,
        data: row.dataKey,
        targa: row.targa,
        litri: row.litri,
        nome: row.nome,
        autista: row.autista,
        azienda: row.azienda,
        supportLitri: support?.litri ?? null,
        supportCount: support?.count ?? 0,
        supportStatus: support ? (isMatch ? "MATCH" : "DIFFERENZA") : "-",
        diff,
      };
    });
  }, [datasetVeritaRows, supportByDateTarga]);

  const handleSaveCambio = async () => {
    setSavingCambio(true);
    setCambioStatus("");
    try {
      const cambio = toNumberOrNull(cambioInput);
      await setDoc(
        doc(db, CISTERNA_PARAMETRI_COLLECTION, selectedMonth),
        {
          mese: selectedMonth,
          cambioEurChf: cambio,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setCambioStatus("Cambio EUR->CHF salvato.");
    } catch (err: any) {
      setCambioStatus(err?.message || "Errore salvataggio cambio EUR->CHF.");
    } finally {
      setSavingCambio(false);
    }
  };

  const formatEstimatedCostLabel = (row: {
    costoStimatoValuta: number | null;
    costoStimatoChf: number | null;
  }): string => {
    if (!fatturaCostData.baseCurrency) return "N/D";
    const costoValuta =
      row.costoStimatoValuta == null
        ? "N/D"
        : formatMoney(row.costoStimatoValuta, fatturaCostData.baseCurrency);
    if (fatturaCostData.baseCurrency === "CHF") return costoValuta;
    const costoChf =
      row.costoStimatoChf == null ? "N/D" : formatMoney(row.costoStimatoChf, "CHF");
    return `${costoValuta} / ${costoChf}`;
  };

  const handleExportReportPdf = async () => {
    const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const marginX = 40;
    let y = 44;

    const logoDataUrl = await toDataUrlFromAsset("/logo.png");
    if (logoDataUrl) {
      pdf.addImage(logoDataUrl, "PNG", marginX, y - 14, 34, 34);
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(17);
    pdf.text("Cisterna Caravate - Report Mensile", marginX + (logoDataUrl ? 44 : 0), y);
    y += 22;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text(`Mese: ${monthLabel(selectedMonth)}`, marginX + (logoDataUrl ? 44 : 0), y);
    y += 22;

    const summaryRows: Array<[string, string]> = [
      [
        "Fonte litri",
        hasManualTruth
          ? "Scheda manuale"
          : "Autisti (nessuna scheda manuale nel mese)",
      ],
      ["Litri totali mese", `${litriTotaliMese.toFixed(2)} L`],
      [
        "Totale fatture (valuta)",
        fatturaCostData.baseCurrency && fatturaCostData.totalFatturaValuta != null
          ? formatMoney(fatturaCostData.totalFatturaValuta, fatturaCostData.baseCurrency)
          : "N/D",
      ],
      ["Cambio EUR->CHF", cambioValue != null && cambioValue > 0 ? String(cambioValue) : "N/D"],
      ["Totale convertito CHF", formatMoney(fatturaCostData.totalChfNormalized, "CHF")],
      [
        "Prezzo/lt (valuta)",
        fatturaCostData.baseCurrency
          ? formatRatio(fatturaCostData.costoPerLitroValuta, fatturaCostData.baseCurrency)
          : "N/D",
      ],
      ["Prezzo/lt (CHF)", formatRatio(fatturaCostData.costoPerLitroChf, "CHF")],
    ];

    autoTable(pdf, {
      startY: y,
      margin: { left: marginX, right: marginX },
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 6,
        lineColor: [220, 227, 238],
      },
      columnStyles: {
        0: { fillColor: [247, 251, 255], fontStyle: "bold", cellWidth: 170 },
        1: { cellWidth: "auto" },
      },
      body: summaryRows,
    });

    const afterSummaryY = (pdf as any).lastAutoTable?.finalY
      ? (pdf as any).lastAutoTable.finalY + 16
      : y + 120;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Tabella targhe", marginX, afterSummaryY);

    autoTable(pdf, {
      startY: afterSummaryY + 8,
      margin: { left: marginX, right: marginX },
      head: [["Targa", "Litri", "Costo stimato (valuta)", "Costo stimato (CHF)"]],
      body: litriPerTarga.map((row) => [
        row.targa,
        `${row.litri.toFixed(2)} L`,
        fatturaCostData.baseCurrency
          ? formatMoney(row.costoStimatoValuta, fatturaCostData.baseCurrency)
          : "N/D",
        formatMoney(row.costoStimatoChf, "CHF"),
      ]),
      headStyles: { fillColor: [13, 93, 166], textColor: [255, 255, 255] },
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 6,
        lineColor: [220, 227, 238],
      },
      alternateRowStyles: { fillColor: [250, 252, 255] },
    });

    const footerY = pdf.internal.pageSize.getHeight() - 24;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(
      costoSummaryLine.length > 140 ? `${costoSummaryLine.slice(0, 140)}...` : costoSummaryLine,
      marginX,
      footerY,
      { maxWidth: pageWidth - marginX * 2 }
    );
    pdf.save(`cisterna-report-mensile-${selectedMonth}.pdf`);
  };

  return (
    <div className="cisterna-page">
      <div className="cisterna-shell">
        <header className="cisterna-head">
          <div>
            <h1>Cisterna Caravate</h1>
            <p>
              Archivio separato documenti e report quantitativo mensile.
            </p>
          </div>
          <div className="cisterna-head-actions">
            <button type="button" onClick={() => navigate("/cisterna/ia")}>
              Apri IA Cisterna
            </button>
            <button
              type="button"
              onClick={() =>
                navigate(`/cisterna/schede-test?month=${encodeURIComponent(selectedMonth)}`)
              }
            >
              Test Scheda (IA)
            </button>
            <button type="button" onClick={() => navigate("/")}>
              Home
            </button>
          </div>
        </header>

        <section className="cisterna-controls">
          <label>
            Mese
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </label>

          <div className="cisterna-cambio-box">
            <div className="cisterna-cambio-title">{"Cambio EUR->CHF (manuale)"}</div>
            <div className="cisterna-cambio-row">
              <input
                type="number"
                step="0.0001"
                placeholder="Es. 0.96"
                value={cambioInput}
                onChange={(e) => setCambioInput(e.target.value)}
              />
              <button
                type="button"
                onClick={handleSaveCambio}
                disabled={savingCambio}
              >
                {savingCambio ? "Salvataggio..." : "Salva"}
              </button>
            </div>
            {cambioStatus ? (
              <div className="cisterna-cambio-status">{cambioStatus}</div>
            ) : null}
            {fatturaCostData.baseCurrency === "EUR" ? (
              <div className="cisterna-cambio-preview">
                Importo convertito CHF: {formatMoney(fatturaCostData.totalChfNormalized, "CHF")}
              </div>
            ) : null}
          </div>
        </section>

        <nav className="cisterna-tabs">
          <button
            type="button"
            className={activeTab === "archivio" ? "active" : ""}
            onClick={() => setActiveTab("archivio")}
          >
            Archivio
          </button>
          <button
            type="button"
            className={activeTab === "report" ? "active" : ""}
            onClick={() => setActiveTab("report")}
          >
            Report Mensile
          </button>
          <button
            type="button"
            className={activeTab === "targhe" ? "active" : ""}
            onClick={() => setActiveTab("targhe")}
          >
            Targhe + Dettaglio
          </button>
        </nav>

                        {activeTab === "archivio" ? (
          <section className="cisterna-card">
            <h2>Archivio mensile - {monthLabel(selectedMonth)}</h2>
            <div className="cisterna-archivio-grid">
              <article className="cisterna-archivio-block">
                <div className="cisterna-archivio-head">
                  <h3>Rifornimenti autisti</h3>
                  <span className="cisterna-archivio-count">
                    {refuelsMonthlyRows.length}
                  </span>
                </div>
                <p className="cisterna-archivio-note">
                  Supporto archivio: quando presente, fa fede la scheda manuale.
                </p>
                {refuelsLoading ? <div>Caricamento rifornimenti...</div> : null}
                {refuelsError ? (
                  <div className="cisterna-error">{refuelsError}</div>
                ) : null}
                {!refuelsLoading && !refuelsError && refuelsMonthlyRows.length === 0 ? (
                  <div>Nessun rifornimento autisti per questo mese.</div>
                ) : null}
                {!refuelsLoading && !refuelsError && refuelsMonthlyRows.length > 0 ? (
                  <ul className="cisterna-archivio-list">
                    {refuelsMonthlyRows.map((row) => (
                      <li key={row.id} className="cisterna-archivio-item">
                        <div className="cisterna-archivio-main">
                          <strong>{row.dateLabel}</strong>
                          <span>{row.targa}</span>
                        </div>
                        <div className="cisterna-archivio-meta">
                          <span>{formatLitri(row.litri)} L</span>
                          <span>{row.autista}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>

              <article className="cisterna-archivio-block">
                <div className="cisterna-archivio-head">
                  <h3>Fatture</h3>
                  <span className="cisterna-archivio-count">
                    {fattureDocs.length}
                  </span>
                </div>
                {docsLoading ? <div>Caricamento documenti...</div> : null}
                {docsError ? <div className="cisterna-error">{docsError}</div> : null}
                {!docsLoading && !docsError && fattureDocs.length === 0 ? (
                  <div>Nessuna fattura per questo mese.</div>
                ) : null}
                {!docsLoading && !docsError && fattureDocs.length > 0 ? (
                  <ul className="cisterna-archivio-list">
                    {fattureDocs.map((item) => {
                      const d = getDocDate(item);
                      const dateLabel = d ? d.toLocaleDateString("it-CH") : "-";
                      return (
                        <li key={item.id} className="cisterna-archivio-item">
                          <div className="cisterna-archivio-main">
                            <strong>{dateLabel}</strong>
                            <span>{item.fornitore || "-"}</span>
                            <span>{item.prodotto || "-"}</span>
                          </div>
                          <div className="cisterna-archivio-meta">
                            <span>{formatLitri(item.litri15C ?? null)} L</span>
                            {item.fileUrl ? (
                              <a
                                className="cisterna-archivio-link"
                                href={item.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Apri
                              </a>
                            ) : (
                              <span>-</span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </article>

              <article className="cisterna-archivio-block">
                <div className="cisterna-archivio-head">
                  <h3>Bollettini</h3>
                  <span className="cisterna-archivio-count">
                    {bollettiniEffectiveDocs.length}
                  </span>
                </div>
                {duplicateGroups.length > 0 ? (
                  <div className="cisterna-dup-section">
                    <strong>DOPPIO BOLLETTINO</strong>
                    <p>
                      Sono presenti piu bollettini per la stessa data. Scegli
                      quello valido. Gli altri verranno ignorati nei conteggi.
                    </p>
                    {duplicateGroups.map((group) => {
                      const info = duplicateChoiceInfo.get(group.key);
                      const currentChoice = dupChoiceByGroup[group.key];
                      const hasPersisted = info?.hasPersistedChoice ?? false;
                      const inputName = `dup-${group.key.replace(/[^\w-]/g, "_")}`;
                      return (
                        <div key={group.key} className="cisterna-dup-card">
                          <div className="cisterna-dup-head">
                            DOPPIO BOLLETTINO - {group.dataDocumento}
                          </div>
                          {!hasPersisted ? (
                            <div className="cisterna-dup-warning">
                              Scelta non confermata: verra usato il bollettino con
                              piu litri finche non confermi.
                            </div>
                          ) : null}
                          <div className="cisterna-dup-list">
                            {group.docs.map((item) => {
                              const litri = getDocumentoLitri(item);
                              const isValue = currentChoice === item.id;
                              const badgeClass = isValue
                                ? "value"
                                : "ignored";
                              const badgeLabel = isValue ? "VALORE" : "IGNORATO";
                              return (
                                <label
                                  key={item.id}
                                  className={`cisterna-dup-item ${
                                    isValue ? "selected" : ""
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={inputName}
                                    checked={isValue}
                                    onChange={() =>
                                      setDupChoiceByGroup((prev) => ({
                                        ...prev,
                                        [group.key]: item.id,
                                      }))
                                    }
                                  />
                                  <div className="cisterna-dup-meta">
                                    <strong>{formatLitri(litri ?? null)} L</strong>
                                    <span>
                                      Numero: {item.numeroDocumento || "-"}
                                    </span>
                                    <span>Fornitore: {item.fornitore || "-"}</span>
                                  </div>
                                  <div className="cisterna-dup-actions">
                                    <span
                                      className={`cisterna-dup-badge ${badgeClass}`}
                                    >
                                      {badgeLabel}
                                    </span>
                                    {item.fileUrl ? (
                                      <a
                                        className="cisterna-archivio-link"
                                        href={item.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        Apri file
                                      </a>
                                    ) : (
                                      <span>-</span>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                          {dupErrorByGroup[group.key] ? (
                            <div className="cisterna-error">
                              {dupErrorByGroup[group.key]}
                            </div>
                          ) : null}
                          <div className="cisterna-dup-confirm">
                            <button
                              type="button"
                              onClick={() => handleConfirmDupChoice(group.key)}
                              disabled={dupSavingByGroup[group.key]}
                            >
                              {dupSavingByGroup[group.key]
                                ? "Salvataggio..."
                                : "Conferma scelta"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
                {docsLoading ? <div>Caricamento documenti...</div> : null}
                {docsError ? <div className="cisterna-error">{docsError}</div> : null}
                {!docsLoading && !docsError && bollettiniDocs.length === 0 ? (
                  <div>Nessun bollettino per questo mese.</div>
                ) : null}
                {!docsLoading && !docsError && bollettiniDocs.length > 0 ? (
                  <ul className="cisterna-archivio-list">
                    {bollettiniDocs.map((item) => {
                      const d = getDocDate(item);
                      const dateLabel = d ? d.toLocaleDateString("it-CH") : "-";
                      return (
                        <li key={item.id} className="cisterna-archivio-item">
                          <div className="cisterna-archivio-main">
                            <strong>{dateLabel}</strong>
                            <span>{item.fornitore || "-"}</span>
                            <span>{item.prodotto || "-"}</span>
                          </div>
                          <div className="cisterna-archivio-meta">
                            <span>{formatLitri(item.litri15C ?? null)} L</span>
                            {item.fileUrl ? (
                              <a
                                className="cisterna-archivio-link"
                                href={item.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Apri
                              </a>
                            ) : (
                              <span>-</span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </article>
            </div>

            <h3 className="cisterna-subtitle">
              Archivio documenti - {monthLabel(selectedMonth)}
            </h3>
            {docsLoading ? <div>Caricamento documenti...</div> : null}
            {docsError ? <div className="cisterna-error">{docsError}</div> : null}
            {!docsLoading && !docsError && docsOfMonth.length === 0 ? (
              <div>Nessun documento in questo mese.</div>
            ) : null}
            {!docsLoading && !docsError && docsOfMonth.length > 0 ? (
              <div className="cisterna-table-wrap">
                <table className="cisterna-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Tipo</th>
                      <th>Fornitore</th>
                      <th>Prodotto</th>
                      <th>Litri 15°C</th>
                      <th>Luogo consegna</th>
                      <th>File</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docsOfMonth.map((item) => (
                      <tr key={item.id}>
                        <td>{item.dataDocumento || "-"}</td>
                        <td>{item.tipoDocumento || "-"}</td>
                        <td>{item.fornitore || "-"}</td>
                        <td>{item.prodotto || "-"}</td>
                        <td>{item.litri15C ?? "-"}</td>
                        <td>{item.luogoConsegna || "-"}</td>
                        <td>
                          {item.fileUrl ? (
                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Apri
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <h3 className="cisterna-subtitle">
              Schede carburante - {monthLabel(selectedMonth)}
            </h3>
            {schedeLoading ? <div>Caricamento schede...</div> : null}
            {schedeError ? (
              <div className="cisterna-error">{schedeError}</div>
            ) : null}
            {!schedeLoading && !schedeError && schedeOfMonthSorted.length === 0 ? (
              <div>Nessuna scheda per questo mese.</div>
            ) : null}
            {!schedeLoading && !schedeError && schedeOfMonthSorted.length > 0 ? (
              <ul className="cisterna-archivio-list">
                {schedeOfMonthSorted.map((item) => {
                  const created = getSchedaDate(item);
                  const dateLabel = created
                    ? created.toLocaleString("it-CH")
                    : item.yearMonth || item.mese || "-";
                  const sourceLabel =
                    item.source === "manual"
                      ? "Manuale"
                      : item.source === "ia"
                      ? "IA"
                      : item.source || "-";
                  const rowsCount =
                    item.rowCount ?? (Array.isArray(item.rows) ? item.rows.length : 0);
                  return (
                    <li key={item.id} className="cisterna-archivio-item">
                      <div className="cisterna-archivio-main">
                        <strong>{dateLabel}</strong>
                        <span>
                          {sourceLabel} - {rowsCount} righe
                        </span>
                        {getSchedaTarga(item) ? (
                          <span>Targa: {getSchedaTarga(item)}</span>
                        ) : null}
                      </div>
                      <div className="cisterna-archivio-meta">
                        <span
                          className={`cisterna-archivio-badge ${
                            item.needsReview ? "warn" : "ok"
                          }`}
                        >
                          {item.needsReview ? "Da verificare" : "OK"}
                        </span>
                        <div className="cisterna-archivio-actions">
                          <button
                            type="button"
                            className="cisterna-archivio-action"
                            onClick={() =>
                              navigate(
                                `/cisterna/schede-test?edit=${encodeURIComponent(item.id)}&month=${encodeURIComponent(selectedMonth)}`
                              )
                            }
                            title="Apri o modifica questa scheda"
                          >
                            Apri/Modifica
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>
        ) : null}

        {activeTab === "report" ? (
          <section className="cisterna-card">
            <div className="cisterna-report-head">
              <h2>Report Mensile - {monthLabel(selectedMonth)}</h2>
              <button
                type="button"
                className="cisterna-report-export"
                onClick={handleExportReportPdf}
              >
                Esporta PDF
              </button>
            </div>
            {refuelsLoading ? <div>Caricamento rifornimenti...</div> : null}
            {refuelsError ? (
              <div className="cisterna-error">{refuelsError}</div>
            ) : null}
            <p className="cisterna-source-banner">
              Fonte litri:{" "}
              {hasManualTruth
                ? "Scheda manuale"
                : "Autisti (nessuna scheda manuale nel mese)"}
            </p>
            <div className="cisterna-kpi-grid">
              <article>
                <span>Litri totali mese (verita)</span>
                <strong>{litriTotaliMese.toFixed(2)} L</strong>
              </article>
              <article>
                <span>Totale fatture (valuta)</span>
                <strong>
                  {fatturaCostData.baseCurrency && fatturaCostData.totalFatturaValuta != null
                    ? formatMoney(
                        fatturaCostData.totalFatturaValuta,
                        fatturaCostData.baseCurrency
                      )
                    : "N/D"}
                </strong>
              </article>
              <article>
                <span>Importo convertito CHF</span>
                <strong>
                  {formatMoney(fatturaCostData.totalChfNormalized, "CHF")}
                </strong>
              </article>
              <article>
                <span>Prezzo/lt</span>
                <strong className="cisterna-money-stack">
                  <span>
                    {fatturaCostData.baseCurrency
                      ? formatRatio(
                          fatturaCostData.costoPerLitroValuta,
                          fatturaCostData.baseCurrency
                        )
                      : "N/D"}
                  </span>
                  <span>{formatRatio(fatturaCostData.costoPerLitroChf, "CHF")}</span>
                </strong>
              </article>
            </div>
            <p className="cisterna-report-summary-line">{costoSummaryLine}</p>
            {hasManualTruth ? (
              <p className="cisterna-note">
                Supporto autisti: {litriSupportoMese.toFixed(2)} L. Differenza con
                scheda manuale: {deltaLitriSupporto.toFixed(2)} L.
              </p>
            ) : null}
            {!fatturaCostData.hasFatture ? (
              <p className="cisterna-note">Costo/lt non disponibile (manca fattura).</p>
            ) : null}
            {fatturaCostData.hasFatture && fatturaCostData.missingTotalCount > 0 ? (
              <p className="cisterna-note">
                Costo/lt non disponibile (totale documento mancante in almeno una fattura).
              </p>
            ) : null}
            {fatturaCostData.hasFatture && fatturaCostData.unknownCurrencyCount > 0 ? (
              <p className="cisterna-note">
                Costo/lt non disponibile (valuta documento non riconosciuta).
              </p>
            ) : null}
            {fatturaCostData.hasFatture && fatturaCostData.mixedCurrency ? (
              <p className="cisterna-note">
                Costo/lt non disponibile (valute miste nelle fatture del mese).
              </p>
            ) : null}
            {fatturaCostData.hasFatture && fatturaCostData.needsCambioForChf ? (
              <p className="cisterna-note">
                {"Totale CHF non disponibile: imposta il cambio EUR->CHF."}
              </p>
            ) : null}
            {fatturaCostData.hasFatture &&
            fatturaCostData.hasValidFattura &&
            litriTotaliMese <= 0 ? (
              <p className="cisterna-note">
                Costo/lt non disponibile (litri totali mese pari a zero).
              </p>
            ) : null}
            <p className="cisterna-note">
              Litri documenti cisterna (con gestione duplicati bollettini):{" "}
              {litriDocumentiMese.toFixed(2)} L.
            </p>
          </section>
        ) : null}

        {activeTab === "targhe" ? (
          <section className="cisterna-card">
            <h2>Targhe + Dettaglio - {monthLabel(selectedMonth)}</h2>
            <p className="cisterna-source-banner">
              Fonte litri:{" "}
              {hasManualTruth
                ? "Scheda manuale"
                : "Autisti (nessuna scheda manuale nel mese)"}
            </p>
            {litriPerTarga.length === 0 ? (
              <div>Nessun dato disponibile nel mese selezionato.</div>
            ) : (
              <div className="cisterna-table-wrap">
                <table className="cisterna-table">
                  <thead>
                    <tr>
                      <th>Targa</th>
                      <th>Litri</th>
                      <th>Costo stimato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {litriPerTarga.map((row) => (
                      <tr key={row.targa}>
                        <td>{row.targa}</td>
                        <td>{row.litri.toFixed(2)} L</td>
                        <td>{formatEstimatedCostLabel(row)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h3 className="cisterna-subtitle">Dettaglio litri del mese</h3>
            {detailRows.length === 0 ? (
              <div>Nessun dettaglio disponibile per il mese selezionato.</div>
            ) : (
              <div className="cisterna-table-wrap">
                <table className="cisterna-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Targa</th>
                      <th>Litri</th>
                      <th>Nome/Autista</th>
                      {hasManualTruth ? <th>Azienda</th> : null}
                      {hasManualTruth ? <th>Autisti (supporto)</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {detailRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.data}</td>
                        <td>{row.targa}</td>
                        <td>{row.litri.toFixed(2)} L</td>
                        <td>{row.nome || row.autista || "-"}</td>
                        {hasManualTruth ? <td>{row.azienda || "-"}</td> : null}
                        {hasManualTruth ? (
                          <td>
                            {row.supportLitri == null ? (
                              <div className="cisterna-support-empty">Nessun match</div>
                            ) : (
                              <div className="cisterna-support-box">
                                <strong>{row.supportLitri.toFixed(2)} L</strong>
                                <span>{row.supportStatus}</span>
                                <span>
                                  Diff: {row.diff == null ? "-" : row.diff.toFixed(2)} L
                                </span>
                              </div>
                            )}
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}


