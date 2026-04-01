import "../pages/Home.css";
import "./next-shell.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import HomeAlertCard from "./components/HomeAlertCard";
import HomeInternalAiLauncher from "./components/HomeInternalAiLauncher";
import NextHomeAutistiEventoModal from "./components/NextHomeAutistiEventoModal";
import QuickNavigationCard from "./components/QuickNavigationCard";
import StatoOperativoCard from "./components/StatoOperativoCard";
import { formatDateInput, formatDateUI } from "./nextDateFormat";
import { generateTablePDF } from "../utils/pdfEngine";
import AutistiImportantEventsModal from "../components/AutistiImportantEventsModal";
import type { HomeEvent } from "../utils/homeEvents";
import { stableHash32 } from "../utils/alertsState";
import {
  readNextCentroControlloSnapshot,
  type D10AlertItem,
  type D10ImportantAutistiEventItem,
  type D10MissingMezzoItem,
  type D10PrenotazioneCollaudo,
  type D10PreCollaudo,
  type D10Snapshot,
} from "./domain/nextCentroControlloDomain";
import { readNextUnifiedStorageDocument } from "./domain/nextUnifiedReadRegistryDomain";
import {
  buildNextDossierPath,
  NEXT_AUTISTI_ADMIN_PATH,
  NEXT_AUTISTI_INBOX_PATH,
  NEXT_CENTRO_CONTROLLO_PATH,
  NEXT_CISTERNA_IA_PATH,
  NEXT_CISTERNA_PATH,
  NEXT_CISTERNA_SCHEDE_TEST_PATH,
  NEXT_DOSSIER_LISTA_PATH,
  NEXT_GESTIONE_OPERATIVA_PATH,
  NEXT_IA_APIKEY_PATH,
  NEXT_IA_COPERTURA_LIBRETTI_PATH,
  NEXT_IA_DOCUMENTI_PATH,
  NEXT_IA_LIBRETTO_PATH,
  NEXT_IA_PATH,
  NEXT_INVENTARIO_PATH,
  NEXT_LIBRETTI_EXPORT_PATH,
  NEXT_LAVORI_DA_ESEGUIRE_PATH,
  NEXT_LAVORI_ESEGUITI_PATH,
  NEXT_LAVORI_IN_ATTESA_PATH,
  NEXT_MANUTENZIONI_PATH,
  NEXT_MATERIALI_CONSEGNATI_PATH,
  NEXT_MATERIALI_DA_ORDINARE_PATH,
  NEXT_MEZZI_PATH,
  NEXT_ORDINI_ARRIVATI_PATH,
  NEXT_ORDINI_IN_ATTESA_PATH,
} from "./nextStructuralPaths";
import { normalizeNextMezzoTarga } from "./nextAnagraficheFlottaDomain";
const QUICKLINKS_STORAGE_KEY = "gm_quicklinks_favs_v1";

const CLONE_ACTION_BLOCKED_TITLE = "Clone in sola lettura: azione non disponibile";

function showReadOnlyActionBlocked(detail: string) {
  window.alert(`${CLONE_ACTION_BLOCKED_TITLE}\n\n${detail}`);
}

function resolveCloneSafeRoute(path: string): string | null {
  if (path.startsWith("/next/")) return path;
  if (path === "/autisti-inbox" || path.startsWith("/autisti-inbox/")) {
    return `/next${path}`;
  }
  if (path === "/autisti-admin") return NEXT_AUTISTI_ADMIN_PATH;
  if (path === "/autisti" || path.startsWith("/autisti/")) return `/next${path}`;
  if (path === "/ia") return NEXT_IA_PATH;
  if (path === "/ia/apikey") return NEXT_IA_APIKEY_PATH;
  if (path === "/ia/libretto") return NEXT_IA_LIBRETTO_PATH;
  if (path === "/ia/documenti") return NEXT_IA_DOCUMENTI_PATH;
  if (path === "/ia/copertura-libretti") return NEXT_IA_COPERTURA_LIBRETTI_PATH;
  if (path === "/libretti-export") return NEXT_LIBRETTI_EXPORT_PATH;
  if (path === "/centro-controllo") return NEXT_CENTRO_CONTROLLO_PATH;
  if (path === "/gestione-operativa") return NEXT_GESTIONE_OPERATIVA_PATH;
  if (path === "/inventario") return NEXT_INVENTARIO_PATH;
  if (path === "/materiali-consegnati") return NEXT_MATERIALI_CONSEGNATI_PATH;
  if (path === "/attrezzature-cantieri") return "/next/attrezzature-cantieri";
  if (path === "/manutenzioni") return NEXT_MANUTENZIONI_PATH;
  if (path === "/acquisti") return "/next/acquisti";
  if (path === "/materiali-da-ordinare") return NEXT_MATERIALI_DA_ORDINARE_PATH;
  if (path === "/ordini-in-attesa") return NEXT_ORDINI_IN_ATTESA_PATH;
  if (path === "/ordini-arrivati") return NEXT_ORDINI_ARRIVATI_PATH;
  if (path === "/lavori-da-eseguire") return NEXT_LAVORI_DA_ESEGUIRE_PATH;
  if (path === "/lavori-in-attesa") return NEXT_LAVORI_IN_ATTESA_PATH;
  if (path === "/lavori-eseguiti") return NEXT_LAVORI_ESEGUITI_PATH;
  if (path === "/cisterna") return NEXT_CISTERNA_PATH;
  if (path === "/cisterna/ia") return NEXT_CISTERNA_IA_PATH;
  if (path === "/cisterna/schede-test") return NEXT_CISTERNA_SCHEDE_TEST_PATH;
  if (path === "/mezzi") return NEXT_MEZZI_PATH;
  if (path === "/dossiermezzi") return NEXT_DOSSIER_LISTA_PATH;
  if (path === "/colleghi") return "/next/colleghi";
  if (path === "/fornitori") return "/next/fornitori";
  if (path === "/capo/mezzi") return "/next/capo/mezzi";
  if (path.startsWith("/capo/costi/")) {
    const targa = path.split("/").pop();
    return targa ? `/next/capo/costi/${encodeURIComponent(targa)}` : "/next/capo/mezzi";
  }
  return null;
}

type QuickLink = {
  id: string;
  to: string;
  label: string;
  description?: string;
};

type QuickLinkUsage = {
  count: number;
  lastUsedAt: number;
};

type QuickLinksStore = {
  pins: string[];
  usage: Record<string, QuickLinkUsage>;
};

type RimorchioEditState = {
  targa: string;
  luogo: string;
  eventId: string | null;
  eventIndex: number | null;
};

type MezzoRecord = {
  targa: string | null | undefined;
  categoria?: string | null | undefined;
  autistaNome?: string | null | undefined;
  marca?: string | null | undefined;
  modello?: string | null | undefined;
  prenotazioneCollaudo?: D10PrenotazioneCollaudo | null | undefined;
  preCollaudo?: D10PreCollaudo | null | undefined;
  id?: string | null | undefined;
};
type SegnalazioneRecord = Record<string, unknown>;
type MissingMezzo = D10MissingMezzoItem;
type PrenotazioneCollaudo = D10PrenotazioneCollaudo;
type PreCollaudo = D10PreCollaudo;
type AlertFilterId = "all" | D10AlertItem["kind"];
type SegnalazioneLookupEntry = {
  record: SegnalazioneRecord;
  explicitId: string | null;
  lookupId: string;
  timestamp: number | null;
  targa: string | null;
  autista: string | null;
  tipoProblema: string;
  preview: string;
};

const ALERT_FILTER_LABELS: Record<AlertFilterId, string> = {
  all: "Tutti",
  revisione: "Revisioni",
  conflitto_sessione: "Conflitti sessione",
  segnalazione_nuova: "Segnalazioni",
  eventi_importanti_autisti: "Eventi autisti",
};
const SEGNALAZIONI_STORAGE_KEY = "@segnalazioni_autisti_tmp";

function createQuickLinkId(item: { id?: string; to?: string; label: string }): string {
  if (item.id) return item.id;
  const toValue = String(item.to || "").trim();
  if (toValue) return `route:${toValue}`;
  const labelValue = String(item.label || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `label:${labelValue || "link"}`;
}

function buildQuickLinks(
  items: Array<{ to: string; label: string; id?: string; description?: string }>
): QuickLink[] {
  return items.map((item) => ({
    ...item,
    id: createQuickLinkId(item),
  }));
}

function normalizeQuickLinksStore(value: unknown): QuickLinksStore {
  const rawPins =
    value && typeof value === "object" && "pins" in value
      ? (value as { pins?: unknown }).pins
      : undefined;
  const pinsRaw = Array.isArray(rawPins) ? rawPins : [];
  const pins = Array.from(
    new Set(pinsRaw.filter((pin: unknown): pin is string => typeof pin === "string"))
  ).slice(0, 3);

  const rawUsage =
    value && typeof value === "object" && "usage" in value
      ? (value as { usage?: unknown }).usage
      : undefined;
  const usageSource =
    rawUsage && typeof rawUsage === "object" && !Array.isArray(rawUsage)
      ? (rawUsage as Record<string, unknown>)
      : {};
  const usage: Record<string, QuickLinkUsage> = {};
  Object.entries(usageSource).forEach(([id, entry]) => {
    if (!entry || typeof entry !== "object") return;
    const count = (entry as { count?: unknown }).count;
    const lastUsedAt = (entry as { lastUsedAt?: unknown }).lastUsedAt;
    if (typeof count !== "number" || typeof lastUsedAt !== "number") return;
    usage[id] = {
      count: Number.isFinite(count) && count > 0 ? count : 0,
      lastUsedAt: Number.isFinite(lastUsedAt) && lastUsedAt > 0 ? lastUsedAt : 0,
    };
  });
  return { pins, usage };
}

function readQuickLinksStore(): QuickLinksStore {
  if (typeof window === "undefined") return { pins: [], usage: {} };
  try {
    const raw = window.localStorage.getItem(QUICKLINKS_STORAGE_KEY);
    if (!raw) return { pins: [], usage: {} };
    const parsed: unknown = JSON.parse(raw);
    return normalizeQuickLinksStore(parsed);
  } catch {
    return { pins: [], usage: {} };
  }
}

function writeQuickLinksStore(next: QuickLinksStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUICKLINKS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    return;
  }
}

function getQuickLinkRecencyBonus(lastUsedAt: number, now: number): number {
  if (!lastUsedAt) return 0;
  const delta = now - lastUsedAt;
  if (delta <= 86_400_000) return 3;
  if (delta <= 604_800_000) return 1;
  return 0;
}

const QUICK_LINKS_OPERATIVO = buildQuickLinks([
  { to: "/gestione-operativa", label: "Gestione Operativa" },
  { to: "/attrezzature-cantieri", label: "Attrezzature Cantieri" },
  {
    to: "/autisti-admin",
    label: "Centro rettifica dati (admin)",
    description: "Correggi dati e risolvi anomalie operative.",
  },
  {
    to: "/autisti-inbox",
    label: "Autisti Inbox (admin)",
    description: "Vedi e gestisci cio che arriva dagli autisti.",
  },
  { to: "/manutenzioni", label: "Manutenzioni" },
  { to: "/lavori-da-eseguire", label: "Lavori Da Eseguire" },
  { to: "/lavori-eseguiti", label: "Lavori Eseguiti" },
  { to: "/lavori-in-attesa", label: "Lavori In Attesa" },
  { to: "/acquisti", label: "Materiali Da Ordinare" },
  { to: "/materiali-consegnati", label: "Materiali Consegnati" },
  { to: "/inventario", label: "Inventario" },
  { to: "/ordini-arrivati", label: "Ordini Arrivati" },
  { to: "/ordini-in-attesa", label: "Ordini In Attesa" },
  { to: "/ia", label: "IA" },
  { to: "/ia/libretto", label: "IA Libretto" },
  { to: "/ia/documenti", label: "IA Documenti" },
  { to: "/cisterna", label: "Cisterna Caravate" },
]);

const QUICK_LINKS_ANAGRAFICHE = buildQuickLinks([
  { to: "/mezzi", label: "Mezzi" },
  { to: "/dossiermezzi", label: "Dossier Mezzi" },
  { to: "/colleghi", label: "Colleghi" },
  { to: "/fornitori", label: "Fornitori" },
  {
    to: "/autisti",
    label: "Autisti App (telefono)",
    description: "Usata dagli autisti per inviare rifornimenti, segnalazioni e controlli.",
  },
]);

const QUICK_LINKS_ALL = [...QUICK_LINKS_OPERATIVO, ...QUICK_LINKS_ANAGRAFICHE];
const QUICK_LINKS_BY_ID = new Map(
  QUICK_LINKS_ALL.map((link) => [link.id, link])
);

function fmtTarga(value: string | null | undefined): string {
  return String(value || "").trim().toUpperCase();
}

function normalizeSegnalazioneText(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSegnalazioneOptionalText(value: unknown): string | null {
  const normalized = normalizeSegnalazioneText(value);
  return normalized || null;
}

function toSegnalazioneTimestamp(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return null;
    const numeric = Number(normalized);
    if (Number.isFinite(numeric)) return numeric;
    const parsed = Date.parse(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value && typeof value === "object") {
    const maybeTimestamp = value as {
      seconds?: unknown;
      nanoseconds?: unknown;
      toMillis?: (() => number) | unknown;
    };
    if (typeof maybeTimestamp.toMillis === "function") {
      const millis = maybeTimestamp.toMillis();
      return Number.isFinite(millis) ? millis : null;
    }
    if (typeof maybeTimestamp.seconds === "number" && Number.isFinite(maybeTimestamp.seconds)) {
      const nanoseconds =
        typeof maybeTimestamp.nanoseconds === "number" && Number.isFinite(maybeTimestamp.nanoseconds)
          ? maybeTimestamp.nanoseconds
          : 0;
      return maybeTimestamp.seconds * 1000 + Math.floor(nanoseconds / 1_000_000);
    }
  }
  return null;
}

function getSegnalazioneRecordTimestamp(record: SegnalazioneRecord): number | null {
  return toSegnalazioneTimestamp(record.timestamp) ?? toSegnalazioneTimestamp(record.data);
}

function getSegnalazioneRecordTarga(record: SegnalazioneRecord): string | null {
  const normalized = normalizeNextMezzoTarga(
    record.targa ?? record.targaCamion ?? record.targaRimorchio
  );
  return normalized || null;
}

function getSegnalazionePreview(record: SegnalazioneRecord): string {
  const tipo = normalizeSegnalazioneText(record.tipoProblema);
  const descrizione = normalizeSegnalazioneText(record.descrizione);
  const note = normalizeSegnalazioneText(record.note ?? record.messaggio);
  return descrizione || note || tipo || "Segnalazione";
}

function buildSegnalazioneRecordLookupEntry(
  record: SegnalazioneRecord,
  index: number
): SegnalazioneLookupEntry {
  const timestamp = getSegnalazioneRecordTimestamp(record);
  const targa = getSegnalazioneRecordTarga(record);
  const explicitId = normalizeSegnalazioneOptionalText(record.id);
  const lookupId =
    explicitId ??
    stableHash32(
      [
        String(timestamp ?? 0),
        targa ?? "",
        normalizeSegnalazioneText(record.badgeAutista),
        normalizeSegnalazioneText(record.tipoProblema),
        normalizeSegnalazioneText(record.descrizione),
        String(index),
      ].join("|")
    );

  return {
    record,
    explicitId,
    lookupId,
    timestamp,
    targa,
    autista:
      normalizeSegnalazioneOptionalText(record.autistaNome) ??
      normalizeSegnalazioneOptionalText(record.nomeAutista),
    tipoProblema: normalizeSegnalazioneText(record.tipoProblema),
    preview: getSegnalazionePreview(record),
  };
}

function buildHomeEventFromSegnalazioneRecord(
  entry: SegnalazioneLookupEntry,
  fallbackId: string
): HomeEvent {
  return {
    id: entry.explicitId ?? fallbackId,
    tipo: "segnalazione",
    targa: entry.targa,
    autista: entry.autista,
    timestamp: entry.timestamp ?? 0,
    payload: entry.record,
  };
}

async function readSegnalazioniRecords(): Promise<SegnalazioneRecord[]> {
  const result = await readNextUnifiedStorageDocument({ key: SEGNALAZIONI_STORAGE_KEY });
  if (result.status !== "ready") return [];
  return result.records.filter(
    (entry): entry is SegnalazioneRecord => Boolean(entry) && typeof entry === "object"
  );
}

function findSegnalazioneEntryForAlert(
  alert: D10AlertItem,
  lookup: {
    entries: SegnalazioneLookupEntry[];
    byId: Map<string, SegnalazioneLookupEntry>;
  }
): SegnalazioneLookupEntry | null {
  const sourceRecordId = normalizeSegnalazioneOptionalText(alert.sourceRecordId);
  if (sourceRecordId) {
    const directMatch = lookup.byId.get(sourceRecordId);
    if (directMatch) return directMatch;
  }

  const alertTarga = fmtTarga(alert.mezzoTarga);
  const alertTimestamp = alert.eventTs ?? null;
  const alertAutista = normalizeSegnalazioneOptionalText(alert.autistaNome);
  const detailText = normalizeSegnalazioneText(alert.detailText);
  const titleText = normalizeSegnalazioneText(alert.title);

  let bestMatch: SegnalazioneLookupEntry | null = null;
  let bestScore = -1;

  lookup.entries.forEach((entry) => {
    let score = 0;

    if (alertTarga && entry.targa === alertTarga) score += 6;
    if (alertTimestamp !== null && entry.timestamp === alertTimestamp) score += 6;
    if (
      alertTimestamp !== null &&
      entry.timestamp !== null &&
      Math.abs(entry.timestamp - alertTimestamp) <= 60_000
    ) {
      score += 3;
    }
    if (alertAutista && entry.autista === alertAutista) score += 2;
    if (detailText && entry.preview && detailText.includes(entry.preview)) score += 4;
    if (detailText && entry.tipoProblema && detailText.includes(entry.tipoProblema)) score += 3;
    if (titleText && entry.tipoProblema && titleText.includes(entry.tipoProblema)) score += 1;

    if (score > bestScore) {
      bestMatch = entry;
      bestScore = score;
    }
  });

  return bestScore >= 8 ? bestMatch : null;
}

function buildDate(yyyyStr: string, mmStr: string, ddStr: string): Date | null {
  const yyyy = Number(yyyyStr);
  const mm = Number(mmStr);
  const dd = Number(ddStr);
  if (!Number.isFinite(yyyy) || !Number.isFinite(mm) || !Number.isFinite(dd)) {
    return null;
  }
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const date = new Date(yyyy, mm - 1, dd, 12, 0, 0, 0);
  if (
    date.getFullYear() !== yyyy ||
    date.getMonth() !== mm - 1 ||
    date.getDate() !== dd
  ) {
    return null;
  }
  return date;
}

function parseDateFlexible(value: string | null | undefined): Date | null {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;

  const isoMatch = /(\d{4})-(\d{2})-(\d{2})/.exec(text);
  const dmyMatch = /(\d{2})[./\s](\d{2})[./\s](\d{4})/.exec(text);

  const candidates: Array<{ index: number; date: Date }> = [];
  if (isoMatch) {
    const date = buildDate(isoMatch[1], isoMatch[2], isoMatch[3]);
    if (date) candidates.push({ index: isoMatch.index, date });
  }
  if (dmyMatch) {
    const date = buildDate(dmyMatch[3], dmyMatch[2], dmyMatch[1]);
    if (date) candidates.push({ index: dmyMatch.index, date });
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => a.index - b.index);
  return candidates[0].date;
}

function formatDateForDisplay(date: Date | null): string {
  return formatDateUI(date);
}

function formatDateForInput(date: Date | null): string {
  return formatDateInput(date);
}

function normalizeFreeText(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeBookingText(value: string): string {
  return value
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}


function truncateText(value: string, maxLen: number): string {
  if (value.length <= maxLen) return value;
  return `${value.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`;
}

void truncateText;

function truncateAsciiText(value: string, maxLen: number): string {
  if (value.length <= maxLen) return value;
  const sliceLen = Math.max(0, maxLen - 3);
  return `${value.slice(0, sliceLen).trimEnd()}...`;
}

function formatGiorniLabel(giorni: number): string {
  if (giorni === 0) return "oggi";
  const abs = Math.abs(giorni);
  const base = abs === 1 ? "1 giorno" : `${abs} giorni`;
  return giorni < 0 ? `${base} fa` : `tra ${base}`;
}

function Home() {
  const navigate = useNavigate();
  const datePickerRef = useRef<HTMLInputElement | null>(null);
  const preCollaudoDatePickerRef = useRef<HTMLInputElement | null>(null);
  const revisioneDatePickerRef = useRef<HTMLInputElement | null>(null);
  const [snapshot, setSnapshot] = useState<D10Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [rimorchioEdit, setRimorchioEdit] = useState<RimorchioEditState | null>(null);
  const [quickLinksStore, setQuickLinksStore] = useState<QuickLinksStore>(() =>
    readQuickLinksStore()
  );
  const [prenotazioneModalOpen, setPrenotazioneModalOpen] = useState(false);
  const [prenotazioneTargetTarga, setPrenotazioneTargetTarga] = useState<string | null>(null);
  const [prenotazioneForm, setPrenotazioneForm] = useState({
    data: "",
    ora: "",
    luogo: "",
    note: "",
  });
  const [preCollaudoModalOpen, setPreCollaudoModalOpen] = useState(false);
  const [preCollaudoTargetTarga, setPreCollaudoTargetTarga] = useState<string | null>(null);
  const [preCollaudoForm, setPreCollaudoForm] = useState({
    data: "",
    officina: "",
  });
  const [revisioneModalOpen, setRevisioneModalOpen] = useState(false);
  const [revisioneTargetTarga, setRevisioneTargetTarga] = useState<string | null>(null);
  const [revisioneForm, setRevisioneForm] = useState({
    data: "",
    esito: "",
    note: "",
  });
  const [segnalazioniRecords, setSegnalazioniRecords] = useState<SegnalazioneRecord[]>([]);
  const [missingModalOpen, setMissingModalOpen] = useState(false);
  const [alertFilter, setAlertFilter] = useState<AlertFilterId>("all");
  const [selectedAlertEvent, setSelectedAlertEvent] = useState<HomeEvent | null>(null);
  const [importantEventsOpen, setImportantEventsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const loadSnapshot = async (now: number) => {
      try {
        const [nextSnapshot, segnalazioni] = await Promise.all([
          readNextCentroControlloSnapshot(now),
          readSegnalazioniRecords(),
        ]);
        if (!mounted) return;
        setSnapshot(nextSnapshot);
        setSegnalazioniRecords(segnalazioni);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadSnapshot(Date.now());
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const refreshSnapshot = async () => {
      try {
        const [nextSnapshot, segnalazioni] = await Promise.all([
          readNextCentroControlloSnapshot(Date.now()),
          readSegnalazioniRecords(),
        ]);
        if (!active) return;
        setSnapshot(nextSnapshot);
        setSegnalazioniRecords(segnalazioni);
      } catch (error) {
        void error;
      }
    };

    void refreshSnapshot();
    return () => {
      active = false;
    };
  }, [location.key]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void Promise.all([
        readNextCentroControlloSnapshot(Date.now()),
        readSegnalazioniRecords(),
      ])
        .then(([nextSnapshot, segnalazioni]) => {
          setSnapshot(nextSnapshot);
          setSegnalazioniRecords(segnalazioni);
        })
        .catch((error) => {
          void error;
        });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const mezzi = useMemo(() => snapshot?.mezzi ?? [], [snapshot]);
  const sessioni = useMemo(() => snapshot?.sessioni ?? [], [snapshot]);
  const alertItems = useMemo(() => snapshot?.alerts ?? [], [snapshot]);
  const importantAutistiItems = useMemo(
    () => snapshot?.importantAutistiItems ?? [],
    [snapshot],
  );
  const revisionItems = useMemo(() => snapshot?.revisioni ?? [], [snapshot]);
  const rimorchiDaMostrare = useMemo(() => snapshot?.rimorchiDaMostrare ?? [], [snapshot]);
  const motriciTrattoriDaMostrare = useMemo(
    () => snapshot?.motriciTrattoriDaMostrare ?? [],
    [snapshot],
  );
  const revisioniUrgenti = useMemo(() => snapshot?.revisioniUrgenti ?? [], [snapshot]);
  const mezziIncompleti = useMemo(() => snapshot?.missingMezzi ?? [], [snapshot]);
  const alertCounts = useMemo(() => {
    const counts: Record<AlertFilterId, number> = {
      all: alertItems.length,
      revisione: 0,
      conflitto_sessione: 0,
      segnalazione_nuova: 0,
      eventi_importanti_autisti: 0,
    };
    alertItems.forEach((alert) => {
      counts[alert.kind] += 1;
    });
    return counts;
  }, [alertItems]);
  const visibleAlertItems = useMemo(() => {
    if (alertFilter === "all") return alertItems;
    return alertItems.filter((alert) => alert.kind === alertFilter);
  }, [alertFilter, alertItems]);
  const alertFilterOptions = useMemo<
    Array<{ id: AlertFilterId; label: string; count: number }>
  >(
    () => [
      { id: "all", label: "Tutti", count: alertCounts.all },
      { id: "revisione", label: "Revisioni", count: alertCounts.revisione },
      {
        id: "segnalazione_nuova",
        label: "Segnalazioni",
        count: alertCounts.segnalazione_nuova,
      },
      {
        id: "eventi_importanti_autisti",
        label: "Eventi autisti",
        count: alertCounts.eventi_importanti_autisti,
      },
      {
        id: "conflitto_sessione",
        label: "Conflitti sessione",
        count: alertCounts.conflitto_sessione,
      },
    ],
    [alertCounts],
  );
  const revisionByTarga = useMemo(() => {
    return new Map(
      revisionItems
        .filter((item) => Boolean(fmtTarga(item.targa)))
        .map((item) => [fmtTarga(item.targa), item] as const),
    );
  }, [revisionItems]);
  const segnalazioniLookup = useMemo(() => {
    const entries = segnalazioniRecords.map(buildSegnalazioneRecordLookupEntry);
    const byId = new Map<string, SegnalazioneLookupEntry>();
    entries.forEach((entry) => {
      if (entry.explicitId) byId.set(entry.explicitId, entry);
      byId.set(entry.lookupId, entry);
    });
    return { entries, byId };
  }, [segnalazioniRecords]);
  const revCounts = {
    scadute: snapshot?.counters.revisioniScadute ?? 0,
    inScadenza: snapshot?.counters.revisioniInScadenza ?? 0,
  };
  const sessioniAttive = sessioni;

  const startRimorchioEdit = (rimorchio: {
    targa: string;
    luogoRaw: string;
    luogoEventId: string | null;
    luogoEventIndex: number | null;
  }) => {
    setRimorchioEdit({
      targa: rimorchio.targa,
      luogo: rimorchio.luogoRaw,
      eventId: rimorchio.luogoEventId,
      eventIndex: rimorchio.luogoEventIndex,
    });
  };

  const cancelRimorchioEdit = () => {
    setRimorchioEdit(null);
  };

  const saveRimorchioEdit = () => {
    if (!rimorchioEdit) return;

    const luogoValue = sanitizeBookingText(rimorchioEdit.luogo);
    if (!luogoValue) {
      window.alert("Inserisci il luogo del rimorchio.");
      return;
    }
    showReadOnlyActionBlocked(
      "L'aggiornamento del luogo rimorchio e disponibile solo nella madre.",
    );
  };

  const closePrenotazioneModal = () => {
    setPrenotazioneModalOpen(false);
    setPrenotazioneTargetTarga(null);
  };

  const closePreCollaudoModal = () => {
    setPreCollaudoModalOpen(false);
    setPreCollaudoTargetTarga(null);
  };

  const closeRevisioneModal = () => {
    setRevisioneModalOpen(false);
    setRevisioneTargetTarga(null);
  };

  const openRevisioneModal = (targa: string, current?: PrenotazioneCollaudo | null) => {
    const todayLabel = formatDateForDisplay(new Date());
    const currentDateRaw = current?.completataIl ? String(current.completataIl).trim() : "";
    const currentDate = currentDateRaw ? parseDateFlexible(currentDateRaw) : null;
    setRevisioneTargetTarga(targa);
    setRevisioneForm({
      data: currentDate ? formatDateForDisplay(currentDate) : todayLabel,
      esito: String(current?.esito ?? "").trim(),
      note: String(current?.noteEsito ?? "").trim(),
    });
    setRevisioneModalOpen(true);
  };

  const openPreCollaudoModal = (targa: string, current?: PreCollaudo | null) => {
    setPreCollaudoTargetTarga(targa);
    setPreCollaudoForm({
      data: String(current?.data ?? "").trim(),
      officina: String(current?.officina ?? "").trim(),
    });
    setPreCollaudoModalOpen(true);
  };

  const openPrenotazioneModal = (
    targa: string,
    current?: PrenotazioneCollaudo | null
  ) => {
    setPrenotazioneTargetTarga(targa);
    const luogoValue = current ? String(current?.luogo ?? "") : "Camorino";
    setPrenotazioneForm({
      data: String(current?.data ?? ""),
      ora: String(current?.ora ?? ""),
      luogo: luogoValue,
      note: String(current?.note ?? ""),
    });
    setPrenotazioneModalOpen(true);
  };

  const handlePrenotazioneSave = () => {
    if (!prenotazioneTargetTarga) return;
    const data = prenotazioneForm.data.trim();
    if (!data) {
      window.alert("Inserisci la data della prenotazione collaudo.");
      return;
    }
    if (!parseDateFlexible(data)) {
      window.alert("Data non valida. Usa formato gg mm aaaa oppure YYYY-MM-DD.");
      return;
    }

    const rawOra = prenotazioneForm.ora ?? "";
    let ora = rawOra.replace(/\u00A0/g, " ").trim().replace(/\./g, ":");
    if (ora.length >= 5) ora = ora.slice(0, 5);
    if (/^[0-9]:[0-5]\d$/.test(ora)) {
      ora = `0${ora}`;
    }
    if (ora && !/^([01]\d|2[0-3]):[0-5]\d$/.test(ora)) {
      window.alert("Ora non valida. Usa formato HH:mm.");
      return;
    }

    showReadOnlyActionBlocked(
      "La prenotazione collaudo si puo registrare solo nella madre.",
    );
  };

  const handlePreCollaudoSave = () => {
    if (!preCollaudoTargetTarga) return;
    const data = preCollaudoForm.data.trim();
    if (!data) {
      window.alert("Inserisci la data del pre-collaudo.");
      return;
    }
    if (!parseDateFlexible(data)) {
      window.alert("Data non valida. Usa formato gg mm aaaa oppure YYYY-MM-DD.");
      return;
    }

    const officina = preCollaudoForm.officina.trim();
    if (!officina) {
      window.alert("Inserisci l'officina del pre-collaudo.");
      return;
    }

    showReadOnlyActionBlocked(
      "La programmazione del pre-collaudo si puo registrare solo nella madre.",
    );
  };

  const handleRevisioneSave = () => {
    if (!revisioneTargetTarga) return;
    const dataRaw = revisioneForm.data.trim();
    if (!dataRaw) {
      window.alert("Inserisci la data della revisione.");
      return;
    }
    const parsedDate = parseDateFlexible(dataRaw);
    if (!parsedDate) {
      window.alert("Data non valida. Usa formato gg mm aaaa oppure YYYY-MM-DD.");
      return;
    }
    const esito = revisioneForm.esito.trim();
    if (!esito) {
      window.alert("Inserisci l'esito della revisione.");
      return;
    }

    void parsedDate;
    showReadOnlyActionBlocked(
      "La chiusura della revisione si puo registrare solo nella madre.",
    );
  };

  const openDatePicker = () => {
    const input =
      datePickerRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.click();
  };

  const openPreCollaudoDatePicker = () => {
    const input =
      preCollaudoDatePickerRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.click();
  };

  const openRevisioneDatePicker = () => {
    const input =
      revisioneDatePickerRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.click();
  };

  const handleDatePickerChange = (value: string) => {
    if (!value) return;
    const [year, month, day] = value.split("-");
    const picked = buildDate(year, month, day);
    if (!picked) return;
    setPrenotazioneForm((prev) => ({ ...prev, data: formatDateForDisplay(picked) }));
  };

  const handlePreCollaudoDatePickerChange = (value: string) => {
    if (!value) return;
    const [year, month, day] = value.split("-");
    const picked = buildDate(year, month, day);
    if (!picked) return;
    setPreCollaudoForm((prev) => ({ ...prev, data: formatDateForDisplay(picked) }));
  };

  const handleRevisioneDatePickerChange = (value: string) => {
    if (!value) return;
    const [year, month, day] = value.split("-");
    const picked = buildDate(year, month, day);
    if (!picked) return;
    setRevisioneForm((prev) => ({ ...prev, data: formatDateForDisplay(picked) }));
  };

  const handlePrenotazioneDelete = (targa: string) => {
    if (!window.confirm("Cancellare la prenotazione collaudo per questo mezzo?")) {
      return;
    }
    void targa;
    showReadOnlyActionBlocked(
      "La cancellazione della prenotazione collaudo e disponibile solo nella madre.",
    );
  };

  const openAlertItem = (alert: D10AlertItem) => {
    if (alert.kind === "revisione") {
      const mezzo = mezzoByTarga.get(fmtTarga(alert.mezzoTarga));
      openRevisioneModal(alert.mezzoTarga || "", mezzo?.prenotazioneCollaudo ?? null);
      return;
    }

    if (alert.kind === "segnalazione_nuova") {
      const segnalazioneEntry = findSegnalazioneEntryForAlert(alert, segnalazioniLookup);
      if (!segnalazioneEntry) {
        showReadOnlyActionBlocked(
          "Il dettaglio completo della segnalazione non e disponibile nel clone read-only."
        );
        return;
      }
      setSelectedAlertEvent(
        buildHomeEventFromSegnalazioneRecord(
          segnalazioneEntry,
          alert.sourceRecordId ?? alert.id
        )
      );
      return;
    }

    if (alert.kind === "eventi_importanti_autisti") {
      setImportantEventsOpen(true);
      return;
    }

    const targetRoute = alert.targetRoute ? resolveCloneSafeRoute(alert.targetRoute) : null;
    if (targetRoute) {
      navigate(targetRoute);
    }
  };

  const closeMissingModal = () => {
    setMissingModalOpen(false);
  };

  const handleMissingSelect = (item: MissingMezzo) => {
    const params = new URLSearchParams();
    if (item.id) {
      params.set("mezzoId", item.id);
    } else if (item.targa) {
      params.set("targa", item.targa);
    }
    params.set("highlightMissing", "1");
    setMissingModalOpen(false);
    const query = params.toString();
    navigate(NEXT_DOSSIER_LISTA_PATH + (query ? `?${query}` : ""));
  };

  const recordQuickLinkUse = (id: string) => {
    const now = Date.now();
    setQuickLinksStore((prev) => {
      const current = prev.usage[id] ?? { count: 0, lastUsedAt: 0 };
      const nextUsage = {
        ...prev.usage,
        [id]: { count: current.count + 1, lastUsedAt: now },
      };
      const next = { ...prev, usage: nextUsage };
      writeQuickLinksStore(next);
      return next;
    });
  };

  const toggleQuickLinkPin = (id: string) => {
    setQuickLinksStore((prev) => {
      const isPinned = prev.pins.includes(id);
      if (isPinned) {
        const next = {
          ...prev,
          pins: prev.pins.filter((pinId: string) => pinId !== id),
        };
        writeQuickLinksStore(next);
        return next;
      }
      const trimmedPins = prev.pins.slice(0, 2);
      const next = { ...prev, pins: [id, ...trimmedPins] };
      writeQuickLinksStore(next);
      return next;
    });
  };

  const mezzoByTarga = useMemo(() => {
    const map = new Map<string, MezzoRecord>();
    mezzi.forEach((m) => {
      const targa = fmtTarga(m.targa);
      if (targa) map.set(targa, m);
    });
    return map;
  }, [mezzi]);

  const getTargaTooltip = (targa: string | null | undefined) => {
    const key = fmtTarga(targa);
    if (!key) return "";
    const mezzo = mezzoByTarga.get(key);
    if (!mezzo) return "";
    const categoria = mezzo.categoria ? String(mezzo.categoria) : "-";
    const autista = mezzo.autistaNome ? String(mezzo.autistaNome) : "-";
    return `Categoria: ${categoria}\nAutista: ${autista}`;
  };

  const getMezzoLabel = (targa: string | null | undefined) => {
    const mezzo = mezzoByTarga.get(fmtTarga(targa));
    return [mezzo?.marca, mezzo?.modello]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join(" ");
  };

  const prenotazioneDateValue = formatDateForInput(
    parseDateFlexible(prenotazioneForm.data)
  );
  const preCollaudoDateValue = formatDateForInput(
    parseDateFlexible(preCollaudoForm.data)
  );
  const revisioneDateValue = formatDateForInput(
    parseDateFlexible(revisioneForm.data)
  );

  const quickPinnedIds = quickLinksStore.pins.filter((id) =>
    QUICK_LINKS_BY_ID.has(id)
  );
  const quickPinnedSet = new Set(quickPinnedIds);
  const quickFavorites = (() => {
    const now = Date.now();
    const pinnedLinks = quickPinnedIds
      .map((id) => QUICK_LINKS_BY_ID.get(id))
      .filter((link): link is QuickLink => Boolean(link));
    const scoredLinks = QUICK_LINKS_ALL
      .filter((link) => !quickPinnedSet.has(link.id))
      .map((link) => {
        const usage = quickLinksStore.usage[link.id];
        const count = usage?.count ?? 0;
        const lastUsedAt = usage?.lastUsedAt ?? 0;
        return {
          link,
          score: count + getQuickLinkRecencyBonus(lastUsedAt, now),
          lastUsedAt,
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.lastUsedAt !== a.lastUsedAt) return b.lastUsedAt - a.lastUsedAt;
        return a.link.label.localeCompare(b.link.label);
      })
      .map((item) => item.link);
    return [...pinnedLinks, ...scoredLinks].slice(0, 6);
  })();

  const canExportAlerts = !loading && visibleAlertItems.length > 0;

  const handleExportAlertsPdf = async () => {
    if (!canExportAlerts) {
      window.alert("Nessun alert da esportare.");
      return;
    }

    const rows = visibleAlertItems.map((alert) => [
      ALERT_FILTER_LABELS[alert.kind],
      alert.mezzoTarga || "-",
      alert.title,
      alert.detailText || "-",
      alert.dateLabel || (alert.eventTs ? formatDateForDisplay(new Date(alert.eventTs)) : "-"),
    ]);

    try {
      await generateTablePDF("Alert Home", rows, [
        "Categoria",
        "Targa",
        "Titolo",
        "Dettaglio",
        "Data",
      ]);
    } catch {
      window.alert("Errore durante l'esportazione PDF.");
    }
  };

  return (
    <div className="home-container">
      <div className="home-shell">
        <header className="home-hero">
          <div className="homeTopGrid">
            <div className="homeTopLeft" style={{ gridColumn: "1 / -1" }}>
              <div className="home-hero-logo">
                <img src="/logo.png" alt="Logo" />
              </div>
              <div className="home-hero-left homeTopLeftTexts">
                <div className="home-kicker">Centrale Operativa</div>
                <h1 className="home-title">Dashboard Admin</h1>
                <p className="home-subtitle">
                  Panoramica rapida su stato operativo, alert e revisioni. Tutti i pannelli
                  portano alle sezioni operative.
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="home-dashboard">
          <div className="home-grid">
            <section className="home-span2">
              <div className="home-top-row">
                <div className="home-top-card-slot">
                  <HomeAlertCard
                    canExportAlerts={canExportAlerts}
                    activeFilterId={alertFilter}
                    filterOptions={alertFilterOptions}
                    getTargaTooltip={getTargaTooltip}
                    loading={loading || !snapshot}
                    onExportAlertsPdf={handleExportAlertsPdf}
                    onFilterChange={setAlertFilter}
                    onOpenAlertItem={openAlertItem}
                    onOpenImportantEventsModal={() => setImportantEventsOpen(true)}
                    onOpenImportantEvent={(event) => setSelectedAlertEvent(event)}
                    onOpenPreCollaudoModal={openPreCollaudoModal}
                    onOpenRevisionModal={openRevisioneModal}
                    importantAutistiItems={importantAutistiItems}
                    revisionByTarga={revisionByTarga}
                    visibleAlertItems={visibleAlertItems}
                  />
                </div>

                <div className="home-top-card-slot">
                  <StatoOperativoCard
                    assetPath={NEXT_AUTISTI_ADMIN_PATH}
                    getMezzoLabel={getMezzoLabel}
                    getTargaTooltip={getTargaTooltip}
                    loading={loading}
                    motrici={motriciTrattoriDaMostrare}
                    onCancelRimorchioEdit={cancelRimorchioEdit}
                    onRimorchioDraftChange={(value) =>
                      setRimorchioEdit((prev) => (prev ? { ...prev, luogo: value } : prev))
                    }
                    onSaveRimorchioEdit={saveRimorchioEdit}
                    onStartRimorchioEdit={startRimorchioEdit}
                    rimorchioEdit={rimorchioEdit}
                    rimorchi={rimorchiDaMostrare}
                    sessioni={sessioniAttive}
                    sessioniPath={NEXT_AUTISTI_INBOX_PATH}
                  />
                </div>
              </div>
            </section>

            <section className="home-span2">
              <QuickNavigationCard
                allLinks={QUICK_LINKS_ALL}
                favorites={quickFavorites}
                anagraficheLinks={QUICK_LINKS_ANAGRAFICHE}
                operativoLinks={QUICK_LINKS_OPERATIVO}
                pinnedIds={quickPinnedIds}
                blockedTitle={CLONE_ACTION_BLOCKED_TITLE}
                onRecordLinkUse={recordQuickLinkUse}
                onTogglePin={toggleQuickLinkPin}
                resolveCloneSafeRoute={resolveCloneSafeRoute}
              />
            </section>

            <section className="home-span2">
              <section className="panel panel-search home-card home-full" style={{ animationDelay: "40ms" }}>
                <div className="panel-head home-card__head">
                  <div>
                    <h2 className="home-card__title">IA interna</h2>
                    <span className="home-card__subtitle">
                      Apri la conversazione completa in un modale operativo
                    </span>
                  </div>
                </div>
                <div className="home-card__body">
                  <HomeInternalAiLauncher />
                </div>
              </section>
            </section>

            {false ? (
              <>
            <section className="home-span2">
              <section className="panel panel-search home-card home-full" style={{ animationDelay: "40ms" }}>
                <div className="panel-head home-card__head">
                  <div>
                    <h2 className="home-card__title">IA interna</h2>
                    <span className="home-card__subtitle">
                      Apri la conversazione completa in un modale operativo
                    </span>
                  </div>
                </div>
                <div className="home-card__body">
                  <HomeInternalAiLauncher />
                </div>
              </section>
            </section>            <div className="home-col">
                <HomeAlertCard
                  canExportAlerts={canExportAlerts}
                  activeFilterId={alertFilter}
                  filterOptions={alertFilterOptions}
                  getTargaTooltip={getTargaTooltip}
                  loading={loading || !snapshot}
                  onExportAlertsPdf={handleExportAlertsPdf}
                  onFilterChange={setAlertFilter}
                  onOpenAlertItem={openAlertItem}
                  onOpenImportantEventsModal={() => setImportantEventsOpen(true)}
                  onOpenImportantEvent={(event) => setSelectedAlertEvent(event)}
                  onOpenPreCollaudoModal={openPreCollaudoModal}
                  onOpenRevisionModal={openRevisioneModal}
                  importantAutistiItems={importantAutistiItems}
                  revisionByTarga={revisionByTarga}
                  visibleAlertItems={visibleAlertItems}
                />

                <StatoOperativoCard
                  assetPath={NEXT_AUTISTI_ADMIN_PATH}
                  getMezzoLabel={getMezzoLabel}
                  getTargaTooltip={getTargaTooltip}
                  loading={loading}
                  motrici={motriciTrattoriDaMostrare}
                  onCancelRimorchioEdit={cancelRimorchioEdit}
                  onRimorchioDraftChange={(value) =>
                    setRimorchioEdit((prev) => (prev ? { ...prev, luogo: value } : prev))
                  }
                  onSaveRimorchioEdit={saveRimorchioEdit}
                  onStartRimorchioEdit={startRimorchioEdit}
                  rimorchioEdit={rimorchioEdit}
                  rimorchi={rimorchiDaMostrare}
                  sessioni={sessioniAttive}
                  sessioniPath={NEXT_AUTISTI_INBOX_PATH}
                />
              </div>
              <div className="home-col">
                <section
                  className="panel panel-revisioni home-card"
                  style={{ animationDelay: "180ms", display: "none" }}
                >
                  <div className="panel-head home-card__head">
                    <div>
                      <h2 className="home-card__title">Revisioni</h2>
                      <span className="home-card__subtitle">
                        Allarmi basati su immatricolazione e ultimo collaudo
                      </span>
                    </div>
                  </div>
                  <div className="home-card__body">
                    <div className="panel-stats">
                      <div className="stat-chip">
                        <span className="stat-label">Scadute</span>
                        <span className="stat-value">{revCounts.scadute}</span>
                      </div>
                      <div className="stat-chip">
                        <span className="stat-label">In scadenza</span>
                        <span className="stat-value">{revCounts.inScadenza}</span>
                      </div>
                    </div>
                    <div className="panel-body">
                    {loading ? (
                      <div className="panel-row panel-row-empty">
                        Caricamento dati...
                      </div>
                    ) : revisioniUrgenti.length === 0 ? (
                      <div className="panel-row panel-row-empty">
                        Nessuna revisione imminente
                      </div>
                    ) : (
                      revisioniUrgenti.map((r, idx) => {
                        const tooltip = getTargaTooltip(r.targa);
                        const scadenzaDate =
                          typeof r.scadenzaTs === "number" ? new Date(r.scadenzaTs) : null;
                        const giorniLabel =
                          r.giorni === null
                            ? "-"
                            : `${r.giorni > 0 ? "+" : ""}${r.giorni}g`;
                        const dossierPath = r.targa
                          ? buildNextDossierPath(r.targa)
                          : NEXT_DOSSIER_LISTA_PATH;
                        const mezzo = mezzoByTarga.get(fmtTarga(r.targa));
                        const prenotazione = mezzo?.prenotazioneCollaudo ?? null;
                        const preCollaudo = mezzo?.preCollaudo ?? null;
                        const hasPreCollaudo = Boolean(preCollaudo);
                        const prenCompletata = prenotazione?.completata === true;
                        const prenData = prenotazione?.data ? String(prenotazione.data).trim() : "";
                        const prenDate = prenData ? parseDateFlexible(prenData) : null;
                        let prenDateLabel = prenDate ? formatDateForDisplay(prenDate) : prenData;
                        let prenOra = prenotazione?.ora ? String(prenotazione.ora).trim() : "";
                        prenOra = prenOra ? sanitizeBookingText(prenOra) : "";
                        const prenLuogo = prenotazione?.luogo
                          ? sanitizeBookingText(normalizeFreeText(prenotazione.luogo))
                          : "";
                        const prenNote = prenotazione?.note
                          ? sanitizeBookingText(normalizeFreeText(prenotazione.note))
                          : "";
                        const prenCompletataRaw = prenotazione?.completataIl
                          ? String(prenotazione.completataIl).trim()
                          : "";
                        const prenCompletataDate = prenCompletataRaw
                          ? parseDateFlexible(prenCompletataRaw)
                          : null;
                        const prenCompletataLabel = prenCompletataDate
                          ? formatDateForDisplay(prenCompletataDate)
                          : prenCompletataRaw;
                        let prenLuogoShort = prenLuogo ? truncateAsciiText(prenLuogo, 40) : "";
                        const prenNoteShort = prenNote ? truncateAsciiText(prenNote, 70) : "";
                        if (prenotazione) {
                          if (prenCompletata) {
                            prenDateLabel = `COMPLETATA${prenCompletataLabel ? ` il ${prenCompletataLabel}` : ""}`;
                            prenOra = "";
                            prenLuogoShort = "";
                          } else {
                            prenDateLabel = `PRENOTATA per ${prenDateLabel}`;
                          }
                        }
                        const prenSummary = prenotazione
                          ? `${prenDateLabel}${prenOra ? ` ${prenOra}` : ""}${
                              prenLuogoShort ? ` - ${prenLuogoShort}` : ""
                            }`
                          : "";
                        const showMissingDanger = !prenotazione && r.giorni !== null && (r.giorni ?? 0) <= 30;
                        const scadenzaExtra =
                          r.giorni === null ? "" : ` (${formatGiorniLabel(r.giorni)})`;
                        const statusLabel =
                          r.giorni == null
                            ? "REVISIONE"
                            : r.giorni < 0
                            ? "REVISIONE SCADUTA"
                            : "REVISIONE IN SCADENZA";
                        const mezzoLabel = [r.marca, r.modello].filter(Boolean).join(" ");
                        const canEditPrenotazione = Boolean(r.targa);
                        return (
                          <div
                            key={r.targa || `rev-${idx}`}
                            className="panel-row panel-row-link"
                            role="link"
                            tabIndex={0}
                            onClick={() => navigate(dossierPath)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                navigate(dossierPath);
                              }
                            }}
                          >
                            <div className="row-main">
                              <div className="row-title">
                                <span
                                  className="targa"
                                  title={tooltip || undefined}
                                  style={{ fontSize: "18px", fontWeight: 700 }}
                                >
                                  {r.targa || "-"}
                                </span>
                                <span
                                  className={`status ${r.classe}`}
                                  style={{ fontSize: "12px", fontWeight: 600 }}
                                >
                                  {giorniLabel}
                                </span>
                              </div>
                              <div className="row-meta row-meta-stack">
                                <div className="row-meta-line" style={{ fontSize: "14px" }}>
                                  <span className="label">Stato:</span>{" "}
                                  <strong>{statusLabel}</strong>
                                </div>
                                <div className="row-meta-line" style={{ fontSize: "14px" }}>
                                  <span className="label">Scadenza:</span>{" "}
                                  <span>
                                    {formatDateForDisplay(scadenzaDate)}
                                    {scadenzaExtra}
                                  </span>
                                </div>
                                <div className="row-meta-line" style={{ fontSize: "14px" }}>
                                  <span className="label">Mezzo:</span>{" "}
                                  <span>{mezzoLabel || "-"}</span>
                                </div>
                                <div className="row-meta-line row-meta-booking">
                                  <span className="label">Prenotazione collaudo:</span>
                                  {prenotazione ? (
                                    <span className="booking-value">
                                      {prenSummary}
                                      {!prenCompletata && prenNoteShort ? (
                                        <span className="booking-note"> - {prenNoteShort}</span>
                                      ) : null}
                                    </span>
                                  ) : (
                                    <span className={`booking-missing ${showMissingDanger ? "danger" : ""}`}>
                                      NON PRENOTATO
                                    </span>
                                  )}
                                </div>
                                {canEditPrenotazione ? (
                                  <div className="row-meta-line row-meta-booking">
                                    <span className="booking-actions">
                                      {!prenCompletata ? (
                                        <button
                                          type="button"
                                          className="booking-action primary"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            openRevisioneModal(r.targa as string, prenotazione);
                                          }}
                                        >
                                          SEGNA REVISIONE FATTA
                                        </button>
                                      ) : null}
                                      {prenotazione && !prenCompletata ? (
                                        <>
                                          <button
                                            type="button"
                                            className="booking-action"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              openPrenotazioneModal(r.targa as string, prenotazione);
                                            }}
                                          >
                                            MODIFICA
                                          </button>
                                          <button
                                            type="button"
                                            className="booking-action danger"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              handlePrenotazioneDelete(r.targa as string);
                                            }}
                                          >
                                            CANCELLA
                                          </button>
                                        </>
                                      ) : !prenotazione ? (
                                        <button
                                          type="button"
                                          className="booking-action"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            openPrenotazioneModal(r.targa as string, null);
                                          }}
                                        >
                                          PRENOTA
                                        </button>
                                      ) : null}
                                    </span>
                                  </div>
                                ) : null}
                                <div className="row-meta-line row-meta-booking">
                                  <span className="label">Pre-collaudo:</span>
                                  {hasPreCollaudo ? (
                                    <span className="booking-value">
                                      <span className="badge">Pre-collaudo programmato</span>
                                    </span>
                                  ) : null}
                                  {canEditPrenotazione ? (
                                    <span className="booking-actions">
                                      {hasPreCollaudo ? (
                                        <button
                                          type="button"
                                          className="booking-action"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            openPreCollaudoModal(r.targa as string, preCollaudo);
                                          }}
                                        >
                                          MODIFICA
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          className="booking-action"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            openPreCollaudoModal(r.targa as string, null);
                                          }}
                                        >
                                          PRE-COLLAUDO
                                        </button>
                                      )}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                            <span className="row-arrow">-&gt;</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                  </div>
                </section>
              </div>
            {false ? (
              <>
            <div className="home-col">
                <section className="panel panel-rimorchi home-card" style={{ animationDelay: "60ms" }}>
            <div className="panel-head home-card__head">
              <div>
                <h2 className="home-card__title">Rimorchi: dove sono</h2>
                <span className="home-card__subtitle">Ultimo luogo da storico eventi</span>
              </div>
            </div>
            <div className="panel-body home-card__body">
              {loading ? (
                <div className="panel-row panel-row-empty">
                  Caricamento dati...
                </div>
              ) : rimorchiDaMostrare.length === 0 ? (
                <div className="panel-row panel-row-empty">
                  Nessun rimorchio trovato
                </div>
              ) : (
                rimorchiDaMostrare.map((r, idx) => {
                  const tooltip = getTargaTooltip(r.targa);
                  const mezzo = mezzoByTarga.get(fmtTarga(r.targa));
                  const labelMarca = mezzo?.marca ? String(mezzo.marca).trim() : "";
                  const labelModello = mezzo?.modello ? String(mezzo.modello).trim() : "";
                  const rimorchioLabel = [labelMarca, labelModello].filter(Boolean).join(" ");
                  const isEditing = rimorchioEdit?.targa === r.targa;
                  const canEdit = !r.inUso;

                  if (isEditing) {
                    return (
                      <div
                        key={r.targa || `rim-${idx}`}
                        className="panel-row panel-row-edit"
                      >
                      <div className="row-main">
                        <div className="row-title rimorchi-title">
                          <span className="targa" title={tooltip || undefined}>
                            {r.targa || "-"}
                          </span>
                          {rimorchioLabel ? (
                            <span className="rimorchi-model">— {rimorchioLabel}</span>
                          ) : null}
                          <span className={`status ${r.inUso ? "in-uso" : "sganciato"}`}>
                            {r.inUso ? "IN USO" : r.statusLabel}
                          </span>
                        </div>
                          <div className="rimorchi-edit">
                            <input
                              className="rimorchi-edit-input"
                              value={rimorchioEdit?.luogo ?? ""}
                              onChange={(event) =>
                                setRimorchioEdit((prev) =>
                                  prev ? { ...prev, luogo: event.target.value } : prev
                                )
                              }
                              placeholder="Inserisci luogo..."
                            />
                            <div className="rimorchi-edit-actions">
                              <button
                                type="button"
                                className="rimorchi-edit-btn"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  cancelRimorchioEdit();
                                }}
                              >
                                Annulla
                              </button>
                              <button
                                type="button"
                                className="rimorchi-edit-btn primary"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void saveRimorchioEdit();
                                }}
                              >
                                Salva
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={r.targa || `rim-${idx}`}
                      to={NEXT_AUTISTI_ADMIN_PATH}
                      className="panel-row"
                    >
                      <div className="row-main">
                        <div className="row-title rimorchi-title">
                          <span className="targa" title={tooltip || undefined}>
                            {r.targa || "-"}
                          </span>
                          {rimorchioLabel ? (
                            <span className="rimorchi-model">— {rimorchioLabel}</span>
                          ) : null}
                          <span className={`status ${r.inUso ? "in-uso" : "sganciato"}`}>
                            {r.inUso ? "IN USO" : r.statusLabel}
                          </span>
                        </div>
                        <div className="row-meta">
                          <span className="rimorchi-luogo">{r.luogo}</span>
                          {canEdit ? (
                            <button
                              type="button"
                              className="rimorchi-edit-btn"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                startRimorchioEdit(r);
                              }}
                            >
                              Modifica
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <span className="row-arrow">-&gt;</span>
                    </Link>
                  );
                })
              )}
            </div>
                </section>
              </div>
              <div className="home-col">
                <section className="panel panel-motrici home-card" style={{ animationDelay: "90ms" }}>
            <div className="panel-head home-card__head">
              <div>
                <h2 className="home-card__title">Motrici e trattori: dove sono</h2>
                <span className="home-card__subtitle">Ultimo luogo da storico eventi</span>
              </div>
            </div>
            <div className="panel-body home-card__body">
              {loading ? (
                <div className="panel-row panel-row-empty">
                  Caricamento dati...
                </div>
              ) : motriciTrattoriDaMostrare.length === 0 ? (
                <div className="panel-row panel-row-empty">
                  Nessun mezzo trovato
                </div>
              ) : (
                motriciTrattoriDaMostrare.map((r, idx) => {
                  const tooltip = getTargaTooltip(r.targa);
                  const mezzo = mezzoByTarga.get(fmtTarga(r.targa));
                  const labelMarca = mezzo?.marca ? String(mezzo.marca).trim() : "";
                  const labelModello = mezzo?.modello ? String(mezzo.modello).trim() : "";
                  const mezzoLabel = [labelMarca, labelModello].filter(Boolean).join(" ");
                  const isEditing = rimorchioEdit?.targa === r.targa;
                  const canEdit = !r.inUso;

                  if (isEditing) {
                    return (
                      <div
                        key={r.targa || `mot-${idx}`}
                        className="panel-row panel-row-edit"
                      >
                        <div className="row-main">
                          <div className="row-title rimorchi-title">
                            <span className="targa" title={tooltip || undefined}>
                              {r.targa || "-"}
                            </span>
                            {mezzoLabel ? (
                              <span className="rimorchi-model">— {mezzoLabel}</span>
                            ) : null}
                            <span className={`status ${r.inUso ? "in-uso" : "sganciato"}`}>
                              {r.inUso ? "IN USO" : r.statusLabel}
                            </span>
                          </div>
                          <div className="rimorchi-edit">
                            <input
                              className="rimorchi-edit-input"
                              value={rimorchioEdit?.luogo ?? ""}
                              onChange={(event) =>
                                setRimorchioEdit((prev) =>
                                  prev ? { ...prev, luogo: event.target.value } : prev
                                )
                              }
                              placeholder="Inserisci luogo..."
                            />
                            <div className="rimorchi-edit-actions">
                              <button
                                type="button"
                                className="rimorchi-edit-btn"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  cancelRimorchioEdit();
                                }}
                              >
                                Annulla
                              </button>
                              <button
                                type="button"
                                className="rimorchi-edit-btn primary"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void saveRimorchioEdit();
                                }}
                              >
                                Salva
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={r.targa || `mot-${idx}`}
                      to={NEXT_AUTISTI_ADMIN_PATH}
                      className="panel-row"
                    >
                      <div className="row-main">
                        <div className="row-title rimorchi-title">
                          <span className="targa" title={tooltip || undefined}>
                            {r.targa || "-"}
                          </span>
                          {mezzoLabel ? (
                            <span className="rimorchi-model">— {mezzoLabel}</span>
                          ) : null}
                          <span className={`status ${r.inUso ? "in-uso" : "sganciato"}`}>
                            {r.inUso ? "IN USO" : r.statusLabel}
                          </span>
                        </div>
                        <div className="row-meta">
                          <span className="rimorchi-luogo">{r.luogo}</span>
                          {canEdit ? (
                            <button
                              type="button"
                              className="rimorchi-edit-btn"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                startRimorchioEdit(r);
                              }}
                            >
                              Modifica
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <span className="row-arrow">-&gt;</span>
                    </Link>
                  );
                })
              )}
            </div>
                </section>
            </div>
              </>
            ) : null}

          {/*
          <section className="panel panel-revisioni home-card" style={{ animationDelay: "180ms" }}>
            <div className="panel-head home-card__head">
              <div>
                <h2 className="home-card__title">Revisioni</h2>
                <span className="home-card__subtitle">
                  Allarmi basati su immatricolazione e ultimo collaudo
                </span>
              </div>
            </div>
            <div className="home-card__body">
              <div className="panel-stats">
                <div className="stat-chip">
                  <span className="stat-label">Scadute</span>
                  <span className="stat-value">{revCounts.scadute}</span>
                </div>
                <div className="stat-chip">
                  <span className="stat-label">In scadenza</span>
                  <span className="stat-value">{revCounts.inScadenza}</span>
                </div>
              </div>
              <div className="panel-body">
              {loading ? (
                <div className="panel-row panel-row-empty">
                  Caricamento dati...
                </div>
              ) : revisioniUrgenti.length === 0 ? (
                <div className="panel-row panel-row-empty">
                  Nessuna revisione imminente
                </div>
              ) : (
                revisioniUrgenti.map((r, idx) => {
                  const tooltip = getTargaTooltip(r.targa);
                  const giorniLabel =
                    r.giorni === null
                      ? "-"
                      : `${r.giorni > 0 ? "+" : ""}${r.giorni}g`;
                  const dossierPath = r.targa
                    ? buildNextDossierPath(r.targa)
                    : NEXT_DOSSIER_LISTA_PATH;
                  const mezzo = mezzoByTarga.get(fmtTarga(r.targa));
                  const prenotazione = mezzo?.prenotazioneCollaudo ?? null;
                  const prenData = prenotazione?.data ? String(prenotazione.data).trim() : "";
                  const prenDate = prenData ? parseDateFlexible(prenData) : null;
                  const prenDateLabel = prenDate ? formatDateForDisplay(prenDate) : prenData;
                  const prenOra = prenotazione?.ora ? String(prenotazione.ora).trim() : "";
                  const prenLuogo = prenotazione?.luogo ? normalizeFreeText(prenotazione.luogo) : "";
                  const prenNote = prenotazione?.note ? normalizeFreeText(prenotazione.note) : "";
                  const prenLuogoShort = prenLuogo ? truncateText(prenLuogo, 40) : "";
                  const prenNoteShort = prenNote ? truncateText(prenNote, 70) : "";
                  const prenSummary = prenotazione
                    ? `${prenDateLabel}${prenOra ? ` ${prenOra}` : ""}${
                        prenLuogoShort ? ` — ${prenLuogoShort}` : ""
                      }`
                    : "";
                  const showMissingDanger = !prenotazione && r.giorni !== null && (r.giorni ?? 0) <= 30;
                  const scadenzaExtra =
                    r.giorni === null ? "" : ` (${formatGiorniLabel(r.giorni)})`;
                  const canEditPrenotazione = Boolean(r.targa);
                  return (
                    <div
                      key={r.targa || `rev-${idx}`}
                      className="panel-row panel-row-link"
                      role="link"
                      tabIndex={0}
                      onClick={() => navigate(dossierPath)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(dossierPath);
                        }
                      }}
                    >
                      <div className="row-main">
                        <div className="row-title">
                          <span className="targa" title={tooltip || undefined}>
                            {r.targa || "-"}
                          </span>
                          <span className={`status ${r.classe}`}>{giorniLabel}</span>
                        </div>
                        <div className="row-meta row-meta-stack">
                          <div className="row-meta-line">
                            <span>
                              Scadenza {formatDateForDisplay(r.scadenza)}
                              {scadenzaExtra}{" "}
                              {r.marca || r.modello
                                ? `- ${r.marca} ${r.modello}`.trim()
                                : ""}
                            </span>
                          </div>
                          <div className="row-meta-line row-meta-booking">
                            <span className="label">Prenotazione collaudo:</span>
                            {prenotazione ? (
                              <span className="booking-value">
                                {prenSummary}
                                {prenNoteShort ? (
                                  <span className="booking-note"> — {prenNoteShort}</span>
                                ) : null}
                              </span>
                            ) : (
                              <span className={`booking-missing ${showMissingDanger ? "danger" : ""}`}>
                                NON PRENOTATO
                              </span>
                            )}
                            {canEditPrenotazione ? (
                              <span className="booking-actions">
                                {prenotazione ? (
                                  <>
                                    <button
                                      type="button"
                                      className="booking-action"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        openPrenotazioneModal(r.targa as string, prenotazione);
                                      }}
                                    >
                                      MODIFICA
                                    </button>
                                    <button
                                      type="button"
                                      className="booking-action danger"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handlePrenotazioneDelete(r.targa as string);
                                      }}
                                    >
                                      CANCELLA
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    className="booking-action primary"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openPrenotazioneModal(r.targa as string, null);
                                    }}
                                  >
                                    PRENOTA
                                  </button>
                                )}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <span className="row-arrow">-&gt;</span>
                    </div>
                  );
                })
              )}
            </div>
            </div>
          </section>
          */}

            <section className="home-span2">
              <QuickNavigationCard
                allLinks={QUICK_LINKS_ALL}
                favorites={quickFavorites}
                anagraficheLinks={QUICK_LINKS_ANAGRAFICHE}
                operativoLinks={QUICK_LINKS_OPERATIVO}
                pinnedIds={quickPinnedIds}
                blockedTitle={CLONE_ACTION_BLOCKED_TITLE}
                onRecordLinkUse={recordQuickLinkUse}
                onTogglePin={toggleQuickLinkPin}
                resolveCloneSafeRoute={resolveCloneSafeRoute}
              />
            </section>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {prenotazioneModalOpen ? (
        <div
          className="home-modal-backdrop"
          onClick={closePrenotazioneModal}
          role="presentation"
        >
          <div
            className="home-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Prenotazione collaudo"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="home-modal-head">
              <div className="home-modal-title">Prenotazione collaudo</div>
              <div className="home-modal-subtitle">
                Targa <span className="targa">{prenotazioneTargetTarga || "-"}</span>
              </div>
            </div>

            <div className="home-modal-body">
              <label className="home-modal-field">
                <span className="home-modal-label">Data</span>
                <div className="home-modal-date-row">
                  <input
                    className="home-modal-input"
                    value={prenotazioneForm.data}
                    onChange={(e) =>
                      setPrenotazioneForm((prev) => ({ ...prev, data: e.target.value }))
                    }
                    placeholder="gg mm aaaa oppure YYYY-MM-DD"
                  />
                  <button
                    type="button"
                    className="home-modal-date-btn"
                    onClick={openDatePicker}
                    aria-label="Apri calendario"
                    title="Apri calendario"
                  >
                    CALENDARIO
                  </button>
                  <input
                    ref={datePickerRef}
                    className="home-modal-date-input"
                    type="date"
                    value={prenotazioneDateValue}
                    onChange={(e) => handleDatePickerChange(e.target.value)}
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>
              </label>

              <label className="home-modal-field">
                <span className="home-modal-label">Ora (opzionale)</span>
                <input
                  className="home-modal-input"
                  type="time"
                  value={prenotazioneForm.ora}
                  onChange={(e) =>
                    setPrenotazioneForm((prev) => ({ ...prev, ora: e.target.value }))
                  }
                />
              </label>

              <label className="home-modal-field">
                <span className="home-modal-label">Luogo (opzionale)</span>
                <input
                  className="home-modal-input"
                  value={prenotazioneForm.luogo}
                  onChange={(e) =>
                    setPrenotazioneForm((prev) => ({ ...prev, luogo: e.target.value }))
                  }
                  placeholder="Motorizzazione / officina / ..."
                />
              </label>

              <label className="home-modal-field">
                <span className="home-modal-label">Note (opzionale)</span>
                <textarea
                  className="home-modal-textarea"
                  value={prenotazioneForm.note}
                  onChange={(e) =>
                    setPrenotazioneForm((prev) => ({ ...prev, note: e.target.value }))
                  }
                  placeholder="Note brevi..."
                  rows={3}
                />
              </label>
            </div>

            <div className="home-modal-actions">
              <button
                type="button"
                className="home-modal-btn"
                onClick={closePrenotazioneModal}
              >
                ANNULLA
              </button>
              <button
                type="button"
                className="home-modal-btn primary"
                onClick={handlePrenotazioneSave}
              >
                SALVA
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {preCollaudoModalOpen ? (
        <div
          className="home-modal-backdrop"
          onClick={closePreCollaudoModal}
          role="presentation"
        >
          <div
            className="home-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Programmazione Pre-collaudo"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="home-modal-head">
              <div className="home-modal-title">Programmazione Pre-collaudo</div>
              <div className="home-modal-subtitle">
                Targa <span className="targa">{preCollaudoTargetTarga || "-"}</span>
              </div>
            </div>

            <div className="home-modal-body">
              <label className="home-modal-field">
                <span className="home-modal-label">Data</span>
                <div className="home-modal-date-row">
                  <input
                    className="home-modal-input"
                    value={preCollaudoForm.data}
                    onChange={(e) =>
                      setPreCollaudoForm((prev) => ({ ...prev, data: e.target.value }))
                    }
                    placeholder="gg mm aaaa oppure YYYY-MM-DD"
                  />
                  <button
                    type="button"
                    className="home-modal-date-btn"
                    onClick={openPreCollaudoDatePicker}
                    aria-label="Apri calendario"
                    title="Apri calendario"
                  >
                    CALENDARIO
                  </button>
                  <input
                    ref={preCollaudoDatePickerRef}
                    className="home-modal-date-input"
                    type="date"
                    value={preCollaudoDateValue}
                    onChange={(e) => handlePreCollaudoDatePickerChange(e.target.value)}
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>
              </label>

              <label className="home-modal-field">
                <span className="home-modal-label">Officina</span>
                <input
                  className="home-modal-input"
                  value={preCollaudoForm.officina}
                  onChange={(e) =>
                    setPreCollaudoForm((prev) => ({ ...prev, officina: e.target.value }))
                  }
                  placeholder="Officina / luogo..."
                />
              </label>
            </div>

            <div className="home-modal-actions">
              <button
                type="button"
                className="home-modal-btn"
                onClick={closePreCollaudoModal}
              >
                ANNULLA
              </button>
              <button
                type="button"
                className="home-modal-btn primary"
                onClick={handlePreCollaudoSave}
              >
                SALVA
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {revisioneModalOpen ? (
        <div
          className="home-modal-backdrop"
          onClick={closeRevisioneModal}
          role="presentation"
        >
          <div
            className="home-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Segna revisione fatta"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="home-modal-head">
              <div className="home-modal-title">Segna revisione fatta</div>
              <div className="home-modal-subtitle">
                Targa <span className="targa">{revisioneTargetTarga || "-"}</span>
              </div>
            </div>

            <div className="home-modal-body">
              <label className="home-modal-field">
                <span className="home-modal-label">Data</span>
                <div className="home-modal-date-row">
                  <input
                    className="home-modal-input"
                    value={revisioneForm.data}
                    onChange={(e) =>
                      setRevisioneForm((prev) => ({ ...prev, data: e.target.value }))
                    }
                    placeholder="gg mm aaaa oppure YYYY-MM-DD"
                  />
                  <button
                    type="button"
                    className="home-modal-date-btn"
                    onClick={openRevisioneDatePicker}
                    aria-label="Apri calendario"
                    title="Apri calendario"
                  >
                    CALENDARIO
                  </button>
                  <input
                    ref={revisioneDatePickerRef}
                    className="home-modal-date-input"
                    type="date"
                    value={revisioneDateValue}
                    onChange={(e) => handleRevisioneDatePickerChange(e.target.value)}
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>
              </label>

              <label className="home-modal-field">
                <span className="home-modal-label">Esito</span>
                <input
                  className="home-modal-input"
                  value={revisioneForm.esito}
                  onChange={(e) =>
                    setRevisioneForm((prev) => ({ ...prev, esito: e.target.value }))
                  }
                  placeholder="Es. OK / Respinta / ..."
                />
              </label>

              <label className="home-modal-field">
                <span className="home-modal-label">Note (opzionale)</span>
                <textarea
                  className="home-modal-textarea"
                  value={revisioneForm.note}
                  onChange={(e) =>
                    setRevisioneForm((prev) => ({ ...prev, note: e.target.value }))
                  }
                  placeholder="Note brevi..."
                  rows={3}
                />
              </label>
            </div>

            <div className="home-modal-actions">
              <button
                type="button"
                className="home-modal-btn"
                onClick={closeRevisioneModal}
              >
                ANNULLA
              </button>
              <button
                type="button"
                className="home-modal-btn primary"
                onClick={handleRevisioneSave}
              >
                SALVA
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AutistiImportantEventsModal
        open={importantEventsOpen}
        items={importantAutistiItems as D10ImportantAutistiEventItem[]}
        onClose={() => setImportantEventsOpen(false)}
        onSelect={(event) => {
          setSelectedAlertEvent(event);
          setImportantEventsOpen(false);
        }}
      />

      <NextHomeAutistiEventoModal
        event={selectedAlertEvent}
        onClose={() => setSelectedAlertEvent(null)}
      />

      {missingModalOpen ? (
        <div
          className="home-modal-backdrop"
          onClick={closeMissingModal}
          role="presentation"
        >
          <div
            className="home-modal missing-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Mezzi con dati mancanti"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="home-modal-head">
              <div className="home-modal-title">Mezzi con dati mancanti</div>
              <div className="home-modal-subtitle">
                {mezziIncompleti.length} mezzi da completare
              </div>
            </div>

            <div className="home-modal-body missing-modal-body">
              {mezziIncompleti.length === 0 ? (
                <div className="panel-row panel-row-empty">
                  Nessun mezzo incompleto
                </div>
              ) : (
                <div className="missing-list">
                  {mezziIncompleti.map((mezzo) => {
                    const targaLabel = mezzo.targa || "TARGA MANCANTE";
                    const categoriaLabel = mezzo.categoria || "MANCANTE";
                    const autistaLabel = mezzo.autistaNome || "MANCANTE";
                    return (
                      <button
                        key={mezzo.id || mezzo.targa || targaLabel}
                        type="button"
                        className="missing-item"
                        onClick={() => handleMissingSelect(mezzo)}
                      >
                        <div className="missing-item-main">
                          <div className="missing-item-title">
                            <span
                              className={`missing-item-targa ${
                                mezzo.missing.targa ? "is-missing" : ""
                              }`}
                            >
                              {targaLabel}
                            </span>
                            {mezzo.missing.targa ? (
                              <span className="missing-chip">MANCANTE</span>
                            ) : null}
                          </div>
                          <div className="missing-item-meta">
                            <span className="missing-label">Categoria:</span>
                            <span
                              className={`missing-value ${
                                mezzo.missing.categoria ? "is-missing" : ""
                              }`}
                            >
                              {categoriaLabel}
                            </span>
                            <span className="missing-sep">•</span>
                            <span className="missing-label">Autista:</span>
                            <span
                              className={`missing-value ${
                                mezzo.missing.autista ? "is-missing" : ""
                              }`}
                            >
                              {autistaLabel}
                            </span>
                          </div>
                        </div>
                        <span className="row-arrow">-&gt;</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="home-modal-actions">
              <button
                type="button"
                className="home-modal-btn"
                onClick={closeMissingModal}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Home;


