/* eslint-disable react-refresh/only-export-components -- Baseline storico: la pagina esporta helper usati dalla Sinottica. */
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PdfPreviewModal from "../components/PdfPreviewModal";
import {
  buildPdfShareText,
  buildWhatsAppShareUrl,
  copyTextToClipboard,
  openPreview,
  revokePdfPreviewUrl,
  sharePdfFile,
} from "../utils/pdfPreview";
import {
  generateRifornimentiMensiliPDFBlob,
  type RifornimentiMensiliPdfItem,
} from "../utils/pdfEngine";
import {
  readNextAutistiReadOnlySnapshot,
  type NextAutistiControlloSectionItem,
  type NextAutistiRichiestaSectionItem,
  type NextAutistiSegnalazioneSectionItem,
} from "./domain/nextAutistiDomain";
import { readNextRifornimentiReadOnlySnapshot } from "./domain/nextRifornimentiDomain";
import { readNextAnagraficheFlottaSnapshot } from "./nextAnagraficheFlottaDomain";
import { readNextColleghiSnapshot } from "./domain/nextColleghiDomain";
import {
  buildNextDossierPath,
  buildNextDossierGommePath,
  buildNextManutenzioniPath,
} from "./nextStructuralPaths";
import { toDisplay } from "./helpers/dateUnica";
import NextRifornimentoEditModal from "./components/NextRifornimentoEditModal";
import NextCentroControlloIndagineModal from "./components/NextCentroControlloIndagineModal";
import NextCentroControlloAnalisiModal from "./components/NextCentroControlloAnalisiModal";
import NextCentroControlloSinottica from "./components/NextCentroControlloSinottica";
import NextHomeAutistiEventoModal from "./components/NextHomeAutistiEventoModal";
import NextMezzoEditModal from "./components/NextMezzoEditModal";
import NextMezzoCronologiaModal from "./components/NextMezzoCronologiaModal";
import NextMezzoHardDeleteModal from "./components/NextMezzoHardDeleteModal";
import { markRichiestaEvasa } from "./nextRichiesteAttrezzatureWriter";
import { markSegnalazioneChiusa } from "./nextSegnalazioniWriter";
import { markControlloChiuso } from "./nextControlliWriter";
import { createManutenzioneDaFareFromEvento } from "./writers/nextManutenzioneDaFareCreateWriter";
import { NextArchivioStoricoTab } from "./centroControllo/archivioStorico/NextArchivioStoricoTab";
import type { ArchivioEventoModalRequest } from "./centroControllo/archivioStorico/archivioTypes";
import {
  readNextManutenzioniDaFareSnapshot,
  readNextManutenzioniLegacyDataset,
} from "./domain/nextManutenzioniDomain";
import { loadActiveSessions, type ActiveSession, type HomeEvent } from "../utils/homeEvents";
import {
  buildRefuelConsumptionIndex,
  buildRefuelRowsFromReadOnlyItems,
  buildRefuelSeedIndex,
  describeAnomaly,
  detectRefuelAnomalies,
  detectRefuelReportAnomalies,
  formatDateItDisplay,
  formatMediaLitriKm,
  formatNumberIt,
  normalizeTargaFilter,
} from "./helpers/refuelAnomalies";
import { isNextSegnalazioneOperativa } from "./helpers/segnalazioniOperative";
import type {
  Anomaly,
  AnomalyTarget,
  AnomalyType,
  MaintenanceStatus,
  RefuelConsumptionIndex,
  RefuelConsumptionSuspicion,
  RefuelRow,
  RefuelSource,
  RefuelSourceFilter,
  RefuelSourceKey,
  RefuelSeedIndex,
  ScheduledMaintenanceRow,
} from "./types/centroControlloTypes";
import "./next-centro-controllo.css";

export {
  describeAnomaly,
  detectRefuelAnomalies,
  detectRefuelReportAnomalies,
  formatDateItDisplay,
  formatDecimalIt,
  formatIntegerIt,
  formatMediaLitriKm,
  formatNumberIt,
  normalizeTargaFilter,
} from "./helpers/refuelAnomalies";

export type {
  Anomaly,
  AnomalyTarget,
  AnomalyType,
  MaintenanceStatus,
  RefuelConsumptionIndex,
  RefuelConsumptionSuspicion,
  RefuelRow,
  RefuelSource,
  RefuelSourceFilter,
  RefuelSourceKey,
  RefuelSeedIndex,
  ScheduledMaintenanceRow,
};

type CentroControlloViewMode = "sinottica" | "archivio" | "rifornimenti";
type MonthFilter = number | "all";
type YearFilter = number | "all";

type SegnalazioneRow = {
  id: string;
  ts: number;
  dateObj: Date | null;
  targa: string;
  targaFilterKey: string;
  autistaNome: string | null;
  badgeAutista: string | null;
  tipo: string;
  descrizione: string;
  stato: string;
  letta: boolean | null;
  isNuova: boolean;
  fotoCount: number;
  chiusa: boolean;
  hasLinkedLavoro: boolean;
};

type ControlloRow = {
  id: string;
  ts: number;
  dateObj: Date | null;
  targaMotrice: string;
  targaRimorchio: string;
  targaLabel: string;
  targaFilterKey: string;
  autistaNome: string | null;
  badgeAutista: string | null;
  koList: string[];
  isKo: boolean;
  note: string;
  chiuso: boolean;
  hasLinkedLavoro: boolean;
};

type RichiestaRow = {
  id: string;
  ts: number;
  dateObj: Date | null;
  targa: string;
  targaFilterKey: string;
  autistaNome: string | null;
  badgeAutista: string | null;
  testo: string;
  stato: string;
  letta: boolean | null;
  isNuova: boolean;
  hasFoto: boolean;
  evasa: boolean;
};


export const MONTH_NAMES = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;


const safeText = (value: unknown): string => String(value ?? "").trim();

const normalizeTarga = (value: unknown): string =>
  String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();


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

export const formatDateIt = (value: Date | null): string => {
  return toDisplay(value) || "--/--/----";
};


const startOfDay = (value: Date): Date =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);

const daysFromToday = (target: Date, today: Date): number =>
  Math.floor((startOfDay(target).getTime() - startOfDay(today).getTime()) / DAY_MS);

const evaluateMaintenanceStatus = (
  dateFine: Date | null,
  today: Date
): { status: MaintenanceStatus; daysToDeadline: number | null; priority: number } => {
  if (!dateFine) {
    return { status: "SENZA_DATA", daysToDeadline: null, priority: 3 };
  }
  const days = daysFromToday(dateFine, today);
  if (days < 0) return { status: "SCADUTA", daysToDeadline: days, priority: 0 };
  if (days <= 30) return { status: "IN_SCADENZA", daysToDeadline: days, priority: 1 };
  return { status: "OK", daysToDeadline: days, priority: 2 };
};


const mapSegnalazioneRow = (item: NextAutistiSegnalazioneSectionItem): SegnalazioneRow => ({
  id: item.id,
  ts: item.timestamp ?? 0,
  dateObj: item.timestamp ? new Date(item.timestamp) : null,
  targa: normalizeTarga(item.targa) || "-",
  targaFilterKey: normalizeTargaFilter(item.targa),
  autistaNome: item.autistaNome,
  badgeAutista: item.badgeAutista,
  tipo: item.tipo || "-",
  descrizione: item.descrizione || "-",
  stato: item.stato || "-",
  letta: item.letta,
  isNuova: item.isNuova,
  fotoCount: item.fotoCount,
  chiusa: item.chiusa,
  hasLinkedLavoro: item.hasLinkedLavoro,
});

const mapControlloRow = (item: NextAutistiControlloSectionItem): ControlloRow => {
  const targaMotrice = normalizeTarga(item.targaMotrice) || "-";
  const targaRimorchio = normalizeTarga(item.targaRimorchio) || "-";
  const targaFilterKey = [normalizeTargaFilter(item.targaMotrice), normalizeTargaFilter(item.targaRimorchio)]
    .filter(Boolean)
    .join(" ");
  const targaLabel =
    targaMotrice !== "-" && targaRimorchio !== "-"
      ? `MOTRICE ${targaMotrice} / RIMORCHIO ${targaRimorchio}`
      : targaMotrice !== "-"
      ? `MOTRICE ${targaMotrice}`
      : targaRimorchio !== "-"
      ? `RIMORCHIO ${targaRimorchio}`
      : "-";

  return {
    id: item.id,
    ts: item.timestamp ?? 0,
    dateObj: item.timestamp ? new Date(item.timestamp) : null,
    targaMotrice,
    targaRimorchio,
    targaLabel,
    targaFilterKey,
    autistaNome: item.autistaNome,
    badgeAutista: item.badgeAutista,
    koList: item.koList,
    isKo: item.isKo,
    note: item.note || "",
    chiuso: item.chiuso,
    hasLinkedLavoro: item.hasLinkedLavoro,
  };
};

const mapRichiestaRow = (item: NextAutistiRichiestaSectionItem): RichiestaRow => ({
  id: item.id,
  ts: item.timestamp ?? 0,
  dateObj: item.timestamp ? new Date(item.timestamp) : null,
  targa: normalizeTarga(item.targa) || "-",
  targaFilterKey: normalizeTargaFilter(item.targa),
  autistaNome: item.autistaNome,
  badgeAutista: item.badgeAutista,
  testo: item.testo || "-",
  stato: item.stato || "-",
  letta: item.letta,
  isNuova: item.isNuova,
  hasFoto: item.hasFoto,
  evasa: item.evasa,
});

export default function NextCentroControlloParityPage() {
  const navigate = useNavigate();
  // PROMPT 30.3: page-tabbar persistita via `?tab=...` (default "sinottica").
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const refuelAnomalyDeepLinkActive = searchParams.get("anomalie") === "1";
  const refuelAnomalyDeepLinkHandledRef = useRef(false);
  const archivioMode: CentroControlloViewMode =
    tabParam === "archivio" || tabParam === "rifornimenti" ? tabParam : "sinottica";
  const setArchivioMode = useCallback(
    (mode: CentroControlloViewMode): void => {
      setSearchParams(
        (prev: URLSearchParams) => {
          const next: URLSearchParams = new URLSearchParams(prev);
          if (mode === "sinottica") {
            next.delete("tab");
          } else {
            next.set("tab", mode);
          }
          if (mode !== "rifornimenti") {
            next.delete("anomalie");
          }
          return next;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const [scheduledMaintenances, setScheduledMaintenances] = useState<ScheduledMaintenanceRow[]>(
    []
  );
  const [loadingRefuels, setLoadingRefuels] = useState(false);
  const [refuelsLoadedOnce, setRefuelsLoadedOnce] = useState(false);
  const [refuelsError, setRefuelsError] = useState<string | null>(null);
  const [refuelRows, setRefuelRows] = useState<RefuelRow[]>([]);

  const [segnalazioniRows, setSegnalazioniRows] = useState<SegnalazioneRow[]>([]);

  const [controlliRows, setControlliRows] = useState<ControlloRow[]>([]);

  const [richiesteRows, setRichiesteRows] = useState<RichiestaRow[]>([]);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<MonthFilter>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<YearFilter>(now.getFullYear());
  const [targaFilterInput, setTargaFilterInput] = useState("");
  const [targaFilterSelected, setTargaFilterSelected] = useState<string | null>(null);

  // Deep-link: arrivando con ?tab=rifornimenti&targa=... pre-seleziona il filtro targa del Report rifornimenti.
  useEffect(() => {
    const targaParam = searchParams.get("targa");
    if (!targaParam) return;
    const value = targaParam.trim().toUpperCase();
    if (!value) return;
    setTargaFilterInput(value);
    setTargaFilterSelected(value);
    setSearchParams(
      (prev: URLSearchParams) => {
        const next = new URLSearchParams(prev);
        next.delete("targa");
        return next;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams]);
  const [targaDropdownOpen, setTargaDropdownOpen] = useState(false);
  const [autistaFilterInput, setAutistaFilterInput] = useState("");
  const [autistaFilterSelected, setAutistaFilterSelected] = useState<string | null>(null);
  const [autistaDropdownOpen, setAutistaDropdownOpen] = useState(false);
  const [refuelSourceFilter, setRefuelSourceFilter] = useState<RefuelSourceFilter>("all");
  const [anomaliesFilterActive, setAnomaliesFilterActive] = useState(false);
  const [investigationOpen, setInvestigationOpen] = useState(false);
  const [investigationRow, setInvestigationRow] = useState<RefuelRow | null>(null);
  const [editRifornimentoOpen, setEditRifornimentoOpen] = useState(false);
  const [editRifornimentoRow, setEditRifornimentoRow] = useState<RefuelRow | null>(null);

  const [analisiOpen, setAnalisiOpen] = useState(false);
  const [analisiInitialTab, setAnalisiInitialTab] = useState<
    "mezzi" | "autisti" | "confronta" | "andamento" | undefined
  >(undefined);
  const [analisiInitialAndamentoTarga, setAnalisiInitialAndamentoTarga] = useState<
    string | null
  >(null);
  const [mezzoEditModalOpen, setMezzoEditModalOpen] = useState(false);
  const [mezzoEditModalMezzoId, setMezzoEditModalMezzoId] = useState<string | null>(null);
  const [cronologiaOpen, setCronologiaOpen] = useState(false);
  const [cronologiaTarga, setCronologiaTarga] = useState<string | null>(null);
  const [eventModalEvents, setEventModalEvents] = useState<HomeEvent[]>([]);
  const [eventModalIndex, setEventModalIndex] = useState<number>(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [deleteModalTarga, setDeleteModalTarga] = useState<string | null>(null);
  const [deleteModalMezzoId, setDeleteModalMezzoId] = useState<string | null>(
    null,
  );

  const advanceAfterMark = useCallback((markedId: string) => {
    setEventModalEvents((prev: HomeEvent[]) => {
      if (prev.length <= 1) {
        setSinotticaEventoModalOpen(false);
        setSinotticaEventoModalEvent(null);
        setEventModalIndex(0);
        return [];
      }
      const filtered: HomeEvent[] = prev.filter(
        (e: HomeEvent) => e.id !== markedId,
      );
      if (filtered.length === 0) {
        setSinotticaEventoModalOpen(false);
        setSinotticaEventoModalEvent(null);
        setEventModalIndex(0);
        return [];
      }
      setEventModalIndex((prevIdx: number) => {
        const nextIdx: number = Math.min(prevIdx, filtered.length - 1);
        setSinotticaEventoModalEvent(filtered[nextIdx]);
        return nextIdx;
      });
      return filtered;
    });
  }, []);

  // PROMPT 30.2: apertura modale eventi dall'archivio storico in
  // modalita' read-only. Ricostruisce HomeEvent dai record gia'
  // caricati (segnalazioniRows/richiesteRows) — pattern speculare
  // a quello della Sinottica V2 a righe 1551-1623.
  const handleOpenEventoFromArchivio = useCallback(
    (req: ArchivioEventoModalRequest): void => {
      if (req.tipo === "segnalazione") {
        const s = segnalazioniRows.find((row) => row.id === req.segnalazioneId);
        if (!s) return;
        const event: HomeEvent = {
          id: s.id,
          tipo: "segnalazione",
          targa: s.targa,
          autista: s.autistaNome,
          timestamp: s.ts,
          payload: {
            tipo: s.tipo,
            tipoProblema: s.tipo,
            descrizione: s.descrizione,
            stato: s.stato,
            autistaNome: s.autistaNome,
            badgeAutista: s.badgeAutista,
            targa: s.targa,
          },
        };
        setSinotticaEventoModalEvent(event);
        setSinotticaEventoModalEditable(false);
        setSinotticaEventoModalOpen(true);
      } else {
        const q = richiesteRows.find((row) => row.id === req.richiestaId);
        if (!q) return;
        const event: HomeEvent = {
          id: q.id,
          tipo: "richiesta_attrezzature",
          targa: q.targa,
          autista: q.autistaNome,
          timestamp: q.ts,
          payload: {
            attrezzatura: q.testo,
            descrizione: q.testo,
            quantita: "",
            stato: q.stato,
            note: "",
            autistaNome: q.autistaNome,
            badgeAutista: q.badgeAutista,
            targa: q.targa,
          },
        };
        setSinotticaEventoModalEvent(event);
        setSinotticaEventoModalEditable(false);
        setSinotticaEventoModalOpen(true);
      }
    },
    [segnalazioniRows, richiesteRows],
  );

  const [colleghiList, setColleghiList] = useState<{ id: string; nome: string }[]>([]);
  const [mezziTargheList, setMezziTargheList] = useState<string[]>([]);
  const [sinotticaMezzi, setSinotticaMezzi] = useState<
    Array<{
      id: string;
      targa: string;
      categoria: string;
      tipo: "motrice" | "cisterna" | null;
      marca: string;
      modello: string;
      autistaNome: string | null;
      manutenzioneDataFineTimestamp: number | null;
      manutenzioneDataFine: string;
      manutenzioneContrattoAttivo: boolean;
      fotoUrl: string | null;
      dataScadenzaRevisioneTimestamp: number | null;
      dataUltimoCollaudoTimestamp: number | null;
    }>
  >([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [sinotticaEventoModalOpen, setSinotticaEventoModalOpen] = useState(false);
  const [sinotticaEventoModalEvent, setSinotticaEventoModalEvent] = useState<HomeEvent | null>(null);
  // PROMPT 30.2: flag editable separato, true di default per non rompere
  // i flussi Sinottica V2 (PROMPT 27.x). L'archivio storico lo setta a
  // false aprendo il modale via `handleOpenEventoFromArchivio`.
  const [sinotticaEventoModalEditable, setSinotticaEventoModalEditable] =
    useState<boolean>(true);
  const [manutenzioniDaFare, setManutenzioniDaFare] = useState<
    Array<{
      id: string;
      targa: string | null;
      urgenza: "alta" | "media" | "bassa" | null;
      eseguito: boolean;
    }>
  >([]);
  const [manutenzioniStorico, setManutenzioniStorico] = useState<
    Array<{
      id: string;
      targa: string;
      data: string;
      descrizione: string;
      gommeInterventoTipo?: "ordinario" | "straordinario" | null;
      gommeStraordinario?: {
        asseId: string | null;
        motivo: string | null;
      } | null;
    }>
  >([]);

  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState("rifornimenti-mensili.pdf");
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState("Anteprima PDF rifornimenti");
  const [pdfShareHint, setPdfShareHint] = useState<string | null>(null);
  const loadScheduledMaintenances = async () => {
    try {
      const snapshot = await readNextAnagraficheFlottaSnapshot({ includeClonePatches: false });
      const today = new Date();

      const mapped = snapshot.items
        .filter((item) => item.manutenzioneProgrammata)
        .map((item, idx) => {
          const targaNorm = normalizeTarga(item.targa);
          const rowId = safeText(item.id) || targaNorm || `mezzo_${idx}`;
          const dataFineRaw = safeText(item.manutenzioneDataFine);
          const dataFine = parseDateFlexible(dataFineRaw);
          const revisioneDate = parseDateFlexible(item.dataScadenzaRevisione);
          const { status, daysToDeadline, priority } = evaluateMaintenanceStatus(dataFine, today);
          return {
            id: rowId,
            targa: targaNorm || "-",
            categoria: safeText(item.categoria) || "-",
            manutenzioneDataFine: dataFine,
            manutenzioneDataFineRaw: dataFineRaw,
            manutenzioneContratto: safeText(item.manutenzioneContratto),
            manutenzioneKmMax: safeText(item.manutenzioneKmMax),
            dataScadenzaRevisione: revisioneDate,
            status,
            daysToDeadline,
            _priority: priority,
          };
        })
        .sort((a, b) => {
          if (a._priority !== b._priority) return a._priority - b._priority;
          if (a.daysToDeadline === null && b.daysToDeadline !== null) return 1;
          if (a.daysToDeadline !== null && b.daysToDeadline === null) return -1;
          if (a.daysToDeadline !== null && b.daysToDeadline !== null) {
            return a.daysToDeadline - b.daysToDeadline;
          }
          return a.targa.localeCompare(b.targa);
        })
        .map((row) => {
          const nextRow = { ...row } as ScheduledMaintenanceRow & { _priority?: number };
          delete nextRow._priority;
          return nextRow as ScheduledMaintenanceRow;
        });

      setScheduledMaintenances(mapped);
    } catch {
      setScheduledMaintenances([]);
    }
  };

  const loadRefuels = async () => {
    setLoadingRefuels(true);
    setRefuelsLoadedOnce(false);
    setRefuelsError(null);
    try {
      const snapshot = await readNextRifornimentiReadOnlySnapshot();
      setRefuelRows(buildRefuelRowsFromReadOnlyItems(snapshot.items));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Errore caricamento rifornimenti.";
      setRefuelsError(message);
      setRefuelRows([]);
    } finally {
      setLoadingRefuels(false);
      setRefuelsLoadedOnce(true);
    }
  };

  const loadAutistiReadOnlySections = async () => {
    try {
      const snapshot = await readNextAutistiReadOnlySnapshot(Date.now(), {
        includeLocalClone: false,
        includeStorageOverlay: false,
      });
      setSegnalazioniRows(snapshot.segnalazioniRows.map(mapSegnalazioneRow));
      setControlliRows(snapshot.controlliRows.map(mapControlloRow));
      setRichiesteRows(snapshot.richiesteRows.map(mapRichiestaRow));
    } catch {
      setSegnalazioniRows([]);
      setControlliRows([]);
      setRichiesteRows([]);
    }
  };

  const loadColleghiAnagrafica = async () => {
    try {
      const snapshot = await readNextColleghiSnapshot();
      const mapped = snapshot.items
        .map((item) => ({
          id: safeText(item.id),
          nome: safeText(item.nome),
        }))
        .filter((entry) => entry.nome.length > 0)
        .sort((left, right) =>
          left.nome.localeCompare(right.nome, "it", { sensitivity: "base" }),
        );
      setColleghiList(mapped);
    } catch {
      setColleghiList([]);
    }
  };

  const loadMezziAnagrafica = async () => {
    try {
      const snapshot = await readNextAnagraficheFlottaSnapshot({ includeClonePatches: false });
      const targheSet = new Set<string>();
      const mezziForSinottica: Array<{
        id: string;
        targa: string;
        categoria: string;
        tipo: "motrice" | "cisterna" | null;
        marca: string;
        modello: string;
        autistaNome: string | null;
        manutenzioneDataFineTimestamp: number | null;
        manutenzioneDataFine: string;
        manutenzioneContrattoAttivo: boolean;
        fotoUrl: string | null;
        dataScadenzaRevisioneTimestamp: number | null;
        dataUltimoCollaudoTimestamp: number | null;
      }> = [];
      for (const item of snapshot.items) {
        const targaNorm = normalizeTarga(item.targa);
        if (!targaNorm) continue;
        targheSet.add(targaNorm);
        mezziForSinottica.push({
          id: item.id,
          targa: targaNorm,
          categoria: item.categoria || "Senza categoria",
          tipo: item.tipo,
          marca: item.marca,
          modello: item.modello,
          autistaNome: item.autistaNome,
          manutenzioneDataFineTimestamp: item.manutenzioneDataFineTimestamp,
          manutenzioneDataFine: item.manutenzioneDataFine,
          manutenzioneContrattoAttivo: item.manutenzioneContrattoAttivo,
          fotoUrl: item.fotoUrl,
          dataScadenzaRevisioneTimestamp: item.dataScadenzaRevisioneTimestamp,
          dataUltimoCollaudoTimestamp: item.dataUltimoCollaudoTimestamp,
        });
      }
      const mapped = Array.from(targheSet).sort((left, right) =>
        left.localeCompare(right, "it", { sensitivity: "base" }),
      );
      setMezziTargheList(mapped);
      setSinotticaMezzi(
        mezziForSinottica.sort((a, b) =>
          a.targa.localeCompare(b.targa, "it", { sensitivity: "base" }),
        ),
      );
    } catch {
      setMezziTargheList([]);
      setSinotticaMezzi([]);
    }
  };

  const loadManutenzioniDaFare = async () => {
    try {
      const manutenzioniDaFare = await readNextManutenzioniDaFareSnapshot();
      const rows: Array<{
        id: string;
        targa: string | null;
        urgenza: "alta" | "media" | "bassa" | null;
        eseguito: boolean;
      }> = [];
      for (const item of manutenzioniDaFare) {
        rows.push({
          id: item.id,
          targa: item.targa ? normalizeTarga(item.targa) : null,
          urgenza: item.urgenza ?? null,
          eseguito: false,
        });
      }
      setManutenzioniDaFare(rows);
    } catch {
      setManutenzioniDaFare([]);
    }
  };

  const loadManutenzioniStorico = async () => {
    try {
      const records = await readNextManutenzioniLegacyDataset();
      const mapped = records.map((r) => ({
        id: r.id,
        targa: normalizeTarga(r.targa),
        data: r.data,
        descrizione: r.descrizione,
        gommeInterventoTipo: r.gommeInterventoTipo ?? null,
        gommeStraordinario: r.gommeStraordinario
          ? {
              asseId: r.gommeStraordinario.asseId ?? null,
              motivo: r.gommeStraordinario.motivo ?? null,
            }
          : null,
      }));
      setManutenzioniStorico(mapped);
    } catch {
      setManutenzioniStorico([]);
    }
  };

  const loadActiveSessionsCC = async () => {
    try {
      const sessions = await loadActiveSessions();
      setActiveSessions(sessions);
    } catch {
      setActiveSessions([]);
    }
  };

  useEffect(() => {
    void loadScheduledMaintenances();
    void loadRefuels();
    void loadAutistiReadOnlySections();
  }, []);

  useEffect(() => {
    void loadColleghiAnagrafica();
  }, []);

  useEffect(() => {
    void loadActiveSessionsCC();
  }, []);

  useEffect(() => {
    void loadManutenzioniDaFare();
    void loadManutenzioniStorico();
  }, []);

  useEffect(() => {
    void loadMezziAnagrafica();
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set<number>([new Date().getFullYear()]);
    refuelRows.forEach((item) => years.add(item.dateObj.getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [refuelRows]);

  const filteredMonthlyRefuels = useMemo(() => {
    const targaNorm = targaFilterSelected ? normalizeTarga(targaFilterSelected) : "";
    const autistaNorm = autistaFilterSelected
      ? autistaFilterSelected.trim().toLowerCase()
      : "";
    return refuelRows.filter((item) => {
      if (selectedMonth !== "all" && item.dateObj.getMonth() + 1 !== selectedMonth) return false;
      if (selectedYear !== "all" && item.dateObj.getFullYear() !== selectedYear) return false;
      if (targaNorm && item.targa !== targaNorm) return false;
      if (refuelSourceFilter !== "all" && item.sourceKey !== refuelSourceFilter) return false;
      if (autistaNorm) {
        const itemAutista = (item.autistaNome ?? "").trim().toLowerCase();
        if (itemAutista !== autistaNorm) return false;
      }
      return true;
    });
  }, [
    refuelRows,
    selectedMonth,
    selectedYear,
    targaFilterSelected,
    refuelSourceFilter,
    autistaFilterSelected,
  ]);

  const monthlyTotals = useMemo(() => {
    const litri = filteredMonthlyRefuels.reduce((sum, item) => sum + (item.litri ?? 0), 0);
    return {
      count: filteredMonthlyRefuels.length,
      litri,
    };
  }, [filteredMonthlyRefuels]);

  const colleghiSuggestions = useMemo(() => {
    const query = autistaFilterInput.trim().toLowerCase();
    if (!query) return colleghiList;
    return colleghiList.filter((entry) =>
      entry.nome.toLowerCase().includes(query),
    );
  }, [colleghiList, autistaFilterInput]);

  const targheSuggestions = useMemo(() => {
    const query = normalizeTargaFilter(targaFilterInput);
    if (!query) return mezziTargheList;
    return mezziTargheList.filter((targa) => targa.includes(query));
  }, [mezziTargheList, targaFilterInput]);

  const refuelSeedIndex = useMemo(() => {
    return buildRefuelSeedIndex(refuelRows);
  }, [refuelRows]);

  const refuelConsumptionIndex = useMemo(
    () => buildRefuelConsumptionIndex(refuelRows, refuelSeedIndex),
    [refuelRows, refuelSeedIndex],
  );

  const filteredMonthlyRefuelsWithMedia = useMemo(() => {
    const mediaById = new Map<string, { label: string; value: number | null }>();
    for (const row of filteredMonthlyRefuels) {
      const seed = refuelSeedIndex.findSeed(row);
      let mediaLabel = "—";
      let mediaValue: number | null = null;
      if (
        seed &&
        typeof row.km === "number" && row.km > 0 &&
        typeof seed.km === "number" && seed.km > 0 &&
        row.km > seed.km &&
        typeof row.litri === "number" && row.litri > 0
      ) {
        const mediaKmL = (row.km - seed.km) / row.litri;
        if (Number.isFinite(mediaKmL) && mediaKmL > 0) {
          mediaLabel = formatMediaLitriKm(mediaKmL);
          mediaValue = mediaKmL;
        }
      }
      mediaById.set(`${row.id}_${row.dateObj.getTime()}`, {
        label: mediaLabel,
        value: mediaValue,
      });
    }
    return filteredMonthlyRefuels.map((row) => {
      const entry = mediaById.get(`${row.id}_${row.dateObj.getTime()}`);
      return {
        row,
        mediaLitriKm: entry?.label ?? "—",
        mediaLitriKmValue: entry?.value ?? null,
      };
    });
  }, [filteredMonthlyRefuels, refuelSeedIndex]);

  const mediaFlottaMese = useMemo(() => {
    const subset =
      selectedMonth === "all" || selectedYear === "all"
        ? refuelRows
        : refuelRows.filter(
            (item) =>
              item.dateObj.getMonth() + 1 === selectedMonth &&
              item.dateObj.getFullYear() === selectedYear,
          );
    let sumKm = 0;
    let sumLitri = 0;
    for (const row of subset) {
      const seed = refuelSeedIndex.findSeed(row);
      if (
        seed &&
        typeof row.km === "number" && row.km > 0 &&
        typeof seed.km === "number" && seed.km > 0 &&
        row.km > seed.km &&
        typeof row.litri === "number" && row.litri > 0
      ) {
        const delta = row.km - seed.km;
        if (Number.isFinite(delta) && delta > 0) {
          sumKm += delta;
          sumLitri += row.litri;
        }
      }
    }
    if (sumLitri <= 0) {
      return {
        value: null as number | null,
        sogliaSopra: null as number | null,
        sogliaSotto: null as number | null,
      };
    }
    const value = sumKm / sumLitri;
    if (!Number.isFinite(value) || value <= 0) {
      return {
        value: null as number | null,
        sogliaSopra: null as number | null,
        sogliaSotto: null as number | null,
      };
    }
    return {
      value,
      sogliaSopra: value * 1.3,
      sogliaSotto: value * 0.7,
    };
  }, [refuelRows, selectedMonth, selectedYear, refuelSeedIndex]);


  const filteredMonthlyRefuelsWithAnomalies = useMemo(() => {
    return filteredMonthlyRefuelsWithMedia.map((entry) => {
      const seed = refuelSeedIndex.findSeed(entry.row);
      const anomalies = detectRefuelReportAnomalies(
        entry.row,
        seed,
        refuelConsumptionIndex,
      );
      const windowConsumption = refuelConsumptionIndex.getWindowConsumption(
        entry.row,
        seed,
      );
      return { ...entry, anomalies, windowConsumption };
    });
  }, [filteredMonthlyRefuelsWithMedia, refuelSeedIndex, refuelConsumptionIndex]);

  const anomaliesSummary = useMemo(() => {
    let totalRows = 0;
    let dataRows = 0;
    let kmRows = 0;
    let litriRows = 0;
    let consumoRows = 0;
    for (const entry of filteredMonthlyRefuelsWithAnomalies) {
      if (entry.anomalies.length === 0) continue;
      totalRows += 1;
      if (entry.anomalies.some((a) => a.target === "km" || a.target === "litri")) {
        dataRows += 1;
      }
      if (entry.anomalies.some((a) => a.target === "km")) kmRows += 1;
      if (entry.anomalies.some((a) => a.target === "litri")) litriRows += 1;
      if (entry.anomalies.some((a) => a.target === "consumo")) consumoRows += 1;
    }
    return { totalRows, dataRows, kmRows, litriRows, consumoRows };
  }, [filteredMonthlyRefuelsWithAnomalies]);

  const displayedRefuelsWithAnomalies = useMemo(() => {
    if (!anomaliesFilterActive) return filteredMonthlyRefuelsWithAnomalies;
    return filteredMonthlyRefuelsWithAnomalies.filter(
      (entry) => entry.anomalies.length > 0,
    );
  }, [filteredMonthlyRefuelsWithAnomalies, anomaliesFilterActive]);

  useEffect(() => {
    if (!refuelAnomalyDeepLinkActive) {
      refuelAnomalyDeepLinkHandledRef.current = false;
    }
  }, [refuelAnomalyDeepLinkActive]);

  useEffect(() => {
    if (!refuelAnomalyDeepLinkActive || archivioMode !== "rifornimenti") return;
    setAnomaliesFilterActive(true);
    if (loadingRefuels || !refuelsLoadedOnce || refuelAnomalyDeepLinkHandledRef.current) {
      return;
    }

    const mostRecent = filteredMonthlyRefuelsWithAnomalies
      .filter((entry) => entry.anomalies.length > 0)
      .sort(
        (left, right) =>
          right.row.dateObj.getTime() - left.row.dateObj.getTime(),
      )[0]?.row;

    refuelAnomalyDeepLinkHandledRef.current = true;
    if (mostRecent) {
      setInvestigationRow(mostRecent);
      setInvestigationOpen(true);
    }
  }, [
    archivioMode,
    filteredMonthlyRefuelsWithAnomalies,
    loadingRefuels,
    refuelAnomalyDeepLinkActive,
    refuelsLoadedOnce,
  ]);

  const closeInvestigationModal = useCallback(() => {
    setInvestigationOpen(false);
    setInvestigationRow(null);
    if (searchParams.has("anomalie")) {
      setSearchParams(
        (prev: URLSearchParams) => {
          const next = new URLSearchParams(prev);
          next.delete("anomalie");
          return next;
        },
        { replace: true },
      );
    }
  }, [searchParams, setSearchParams]);


  const segnalazioniOperativeRows = useMemo(
    () => segnalazioniRows.filter((row) => isNextSegnalazioneOperativa(row)),
    [segnalazioniRows]
  );

  const closePdfPreview = () => {
    revokePdfPreviewUrl(pdfPreviewUrl);
    setPdfPreviewOpen(false);
    setPdfPreviewUrl(null);
    setPdfPreviewBlob(null);
    setPdfShareHint(null);
  };

  useEffect(() => {
    return () => revokePdfPreviewUrl(pdfPreviewUrl);
  }, [pdfPreviewUrl]);

  const buildPdfItems = (): RifornimentiMensiliPdfItem[] =>
    filteredMonthlyRefuelsWithAnomalies.map((entry) => ({
      data: formatDateIt(entry.row.dateObj),
      targa: entry.row.targa,
      autistaNome: entry.row.autistaNome,
      litri: entry.row.litri,
      km: entry.row.km,
      fonteLabel: entry.row.sourceLabel,
      mediaKmLLabel: entry.mediaLitriKm,
      isAnomala: entry.anomalies.length > 0,
      hasKmAnomaly: entry.anomalies.some((a) => a.target === "km"),
      hasLitriAnomaly: entry.anomalies.some((a) => a.target === "litri"),
      hasConsumoAnomaly: entry.anomalies.some((a) => a.target === "consumo"),
    }));

  const buildAnomalieDettaglio = (): Array<{
    targa: string;
    dataDisplay: string;
    autistaNome: string;
    messages: string[];
  }> => {
    const anomale = filteredMonthlyRefuelsWithAnomalies.filter(
      (entry) => entry.anomalies.length > 0,
    );
    const detailEntries = anomale.map((entry) => {
      const seed = refuelSeedIndex.findSeed(entry.row);
      const messages = entry.anomalies.map((anomaly) =>
        describeAnomaly(anomaly, entry.row, seed),
      );
      return {
        targa: entry.row.targa,
        dataDisplay: formatDateItDisplay(entry.row.dateObj),
        autistaNome: entry.row.autistaNome ?? "—",
        messages,
        _ts: entry.row.dateObj.getTime(),
      };
    });
    detailEntries.sort((a, b) => {
      const targaCmp = a.targa.localeCompare(b.targa, "it", {
        sensitivity: "base",
      });
      if (targaCmp !== 0) return targaCmp;
      return b._ts - a._ts;
    });
    return detailEntries.map(({ targa, dataDisplay, autistaNome, messages }) => ({
      targa,
      dataDisplay,
      autistaNome,
      messages,
    }));
  };

  const buildShareMessage = () =>
    buildPdfShareText({
      contextLabel: "Report rifornimenti mensili",
      dateLabel:
        selectedMonth === "all" || selectedYear === "all"
          ? "Tutti i periodi"
          : `${String(selectedMonth).padStart(2, "0")}/${selectedYear}`,
      fileName: pdfPreviewFileName || "rifornimenti-mensili.pdf",
      url: pdfPreviewUrl,
    });

  const handlePreviewPdf = async () => {
    if (selectedMonth === "all" || selectedYear === "all") {
      window.alert("Seleziona un mese e un anno specifici per generare il PDF mensile.");
      return;
    }
    if (!filteredMonthlyRefuels.length) {
      window.alert("Nessun rifornimento nel periodo selezionato.");
      return;
    }
    try {
      setGeneratingPdf(true);
      const monthLabel = `${String(selectedMonth).padStart(2, "0")}-${selectedYear}`;
      const preview = await openPreview({
        source: () =>
          generateRifornimentiMensiliPDFBlob({
            mese: selectedMonth,
            anno: selectedYear,
            items: buildPdfItems(),
            filters: {
              targa: targaFilterSelected ? normalizeTarga(targaFilterSelected) || null : null,
            },
            mediaFlotta: {
              value: mediaFlottaMese.value,
              sogliaSopra: mediaFlottaMese.sogliaSopra,
              sogliaSotto: mediaFlottaMese.sogliaSotto,
            },
            anomalieSummary: {
              totalRows: anomaliesSummary.totalRows,
              dataRows: anomaliesSummary.dataRows,
              kmRows: anomaliesSummary.kmRows,
              litriRows: anomaliesSummary.litriRows,
              consumoRows: anomaliesSummary.consumoRows,
            },
            anomalieDettaglio: buildAnomalieDettaglio(),
          }),
        fileName: `rifornimenti_mensili_${monthLabel}.pdf`,
        previousUrl: pdfPreviewUrl,
      });

      setPdfShareHint(null);
      setPdfPreviewBlob(preview.blob);
      setPdfPreviewFileName(preview.fileName);
      setPdfPreviewTitle(
        `Anteprima PDF rifornimenti ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`
      );
      setPdfPreviewUrl(preview.url);
      setPdfPreviewOpen(true);
    } catch (err) {
      console.error("Errore anteprima PDF rifornimenti:", err);
      window.alert("Impossibile generare l'anteprima PDF.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleSharePdf = async () => {
    if (!pdfPreviewBlob) {
      const copied = await copyTextToClipboard(buildShareMessage());
      setPdfShareHint(copied ? "Link copiato." : "Apri prima un'anteprima PDF.");
      return;
    }
    const result = await sharePdfFile({
      blob: pdfPreviewBlob,
      fileName: pdfPreviewFileName || "rifornimenti-mensili.pdf",
      title: pdfPreviewTitle || "Anteprima PDF rifornimenti",
      text: buildShareMessage(),
    });

    if (result.status === "shared") {
      setPdfShareHint("PDF condiviso.");
      return;
    }
    if (result.status === "aborted") return;

    const copied = await copyTextToClipboard(buildShareMessage());
    setPdfShareHint(
      copied ? "Condivisione non disponibile: testo copiato." : "Condivisione non disponibile."
    );
  };

  const handleCopyPdfText = async () => {
    const copied = await copyTextToClipboard(buildShareMessage());
    setPdfShareHint(copied ? "Testo copiato." : "Copia non disponibile.");
  };

  const handleWhatsAppPdf = () => {
    window.open(buildWhatsAppShareUrl(buildShareMessage()), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="next-centro-controllo-scope cc-page">
      <div className="cc-shell">
        <header className="cc-header">
          <h1>Centro Controllo</h1>
          <p>
            Monitoraggio manutenzioni, rifornimenti e flussi autisti (segnalazioni, controlli,
            richieste).
          </p>
        </header>

        <div className="cc-page-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={archivioMode === "sinottica"}
            className={archivioMode === "sinottica" ? "is-active" : ""}
            onClick={() => setArchivioMode("sinottica")}
          >
            Sinottica flotta
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={archivioMode === "archivio"}
            className={archivioMode === "archivio" ? "is-active" : ""}
            onClick={() => setArchivioMode("archivio")}
          >
            Archivio storico
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={archivioMode === "rifornimenti"}
            className={archivioMode === "rifornimenti" ? "is-active" : ""}
            onClick={() => setArchivioMode("rifornimenti")}
          >
            Report rifornimenti
          </button>
        </div>

        {archivioMode === "archivio" ? (
          <NextArchivioStoricoTab
            onOpenEventoModal={handleOpenEventoFromArchivio}
          />
        ) : null}
        {archivioMode === "sinottica" ? (
        <>
        <NextCentroControlloSinottica
          mezzi={sinotticaMezzi}
          refuelRows={refuelRows}
          refuelSeedIndex={refuelSeedIndex}
          manutenzioniStorico={manutenzioniStorico}
          manutenzioniDaFare={manutenzioniDaFare}
          activeSessions={activeSessions}
          segnalazioniAperte={segnalazioniOperativeRows.map((row) => ({
              id: row.id,
              targa: row.targa,
              tipo: row.tipo,
              isNuova: row.isNuova,
              ts: row.ts,
              autistaNome: row.autistaNome,
              badgeAutista: row.badgeAutista,
              descrizione: row.descrizione,
              stato: row.stato,
            }))}
          controlliKo={controlliRows
            .filter((row) => row.isKo && !row.chiuso && !row.hasLinkedLavoro)
            .map((row) => {
              const targa =
                row.targaMotrice && row.targaMotrice !== "-"
                  ? row.targaMotrice
                  : row.targaRimorchio && row.targaRimorchio !== "-"
                    ? row.targaRimorchio
                    : "";
              return {
                id: row.id,
                targa,
                isKo: row.isKo,
                ts: row.ts,
                autistaNome: row.autistaNome,
                badgeAutista: row.badgeAutista,
                koList: row.koList,
                note: row.note,
                targaMotrice: row.targaMotrice,
                targaRimorchio: row.targaRimorchio,
              };
            })
            .filter((r) => r.targa !== "")}
          richiesteAperte={richiesteRows
            .filter((row) => !row.evasa && row.targa && row.targa !== "-")
            .map((row) => ({
              id: row.id,
              targa: row.targa,
              isNuova: row.isNuova,
              ts: row.ts,
              autistaNome: row.autistaNome,
              badgeAutista: row.badgeAutista,
              attrezzatura: row.testo,
              quantita: "",
              stato: row.stato,
              note: "",
            }))}
          onTargaClick={(targa) => navigate(buildNextDossierPath(targa))}
          onAnomalieClick={(targa) => {
            const targaUp: string = targa.toUpperCase();
            const candidates: RefuelRow[] = refuelRows
              .filter((r: RefuelRow) => (r.targa || "").toUpperCase() === targaUp)
              .filter((r: RefuelRow) => {
                const seed: RefuelRow | null = refuelSeedIndex.findSeed(r);
                return detectRefuelAnomalies(r, seed).length > 0;
              })
              .sort((a: RefuelRow, b: RefuelRow) =>
                (b.dateObj?.getTime() ?? 0) - (a.dateObj?.getTime() ?? 0),
              );
            const mostRecent: RefuelRow | undefined = candidates[0];
            if (mostRecent) {
              setInvestigationRow(mostRecent);
              setInvestigationOpen(true);
            } else {
              navigate(buildNextDossierPath(targa));
            }
          }}
          onGommeClick={(targa) => navigate(buildNextDossierGommePath(targa))}
          onDocumentiClick={(targa) =>
            navigate(`/next/scadenze-collaudi?targa=${encodeURIComponent(targa)}`)
          }
          onConsumoClick={(targa: string) => {
            setAnalisiInitialTab("andamento");
            setAnalisiInitialAndamentoTarga(targa);
            setAnalisiOpen(true);
          }}
          onFotoClick={(targa: string) => {
            setCronologiaTarga(targa);
            setCronologiaOpen(true);
          }}
          onFotoDelete={(targa: string) => {
            const targaUp: string = targa.toUpperCase();
            const mezzo = sinotticaMezzi.find(
              (m) => m.targa.toUpperCase() === targaUp,
            );
            if (!mezzo) return;
            setDeleteModalTarga(targa);
            setDeleteModalMezzoId(mezzo.id);
            setDeleteModalOpen(true);
          }}
          onChipListOpen={(
            _anchorRect: DOMRect,
            kind: "manutenzione" | "segnalazione" | "controllo" | "richiesta",
            targa: string,
            ids: string[],
          ) => {
            const targaUp: string = targa.toUpperCase();
            const idSet: Set<string> = new Set(ids);
            if (kind === "manutenzione") {
              const first: string | undefined = ids[0];
              if (first) navigate(buildNextManutenzioniPath(targa, first));
              return;
            }
            const list: HomeEvent[] = [];
            if (kind === "segnalazione") {
              segnalazioniRows
                .filter((s) => idSet.has(s.id))
                .forEach((s) => {
                  list.push({
                    id: s.id,
                    tipo: "segnalazione",
                    targa: s.targa,
                    autista: s.autistaNome,
                    timestamp: s.ts,
                    payload: {
                      tipo: s.tipo,
                      tipoProblema: s.tipo,
                      descrizione: s.descrizione,
                      stato: s.stato,
                      autistaNome: s.autistaNome,
                      badgeAutista: s.badgeAutista,
                      targa: s.targa,
                    },
                  });
                });
            } else if (kind === "controllo") {
              controlliRows
                .filter((c) => idSet.has(c.id))
                .forEach((c) => {
                  const targaCtrl: string =
                    c.targaMotrice && c.targaMotrice !== "-"
                      ? c.targaMotrice
                      : c.targaRimorchio && c.targaRimorchio !== "-"
                        ? c.targaRimorchio
                        : "";
                  list.push({
                    id: c.id,
                    tipo: "controllo",
                    targa: targaCtrl,
                    autista: c.autistaNome,
                    timestamp: c.ts,
                    payload: {
                      koList: c.koList,
                      anomalie: c.koList,
                      esito: c.isKo ? "KO" : "OK",
                      stato: c.isKo ? "KO" : "OK",
                      note: c.note,
                      autistaNome: c.autistaNome,
                      badgeAutista: c.badgeAutista,
                      targaMotrice: c.targaMotrice,
                      targaRimorchio: c.targaRimorchio,
                    },
                  });
                });
            } else {
              richiesteRows
                .filter((q) => idSet.has(q.id))
                .forEach((q) => {
                  list.push({
                    id: q.id,
                    tipo: "richiesta_attrezzature",
                    targa: q.targa,
                    autista: q.autistaNome,
                    timestamp: q.ts,
                    payload: {
                      attrezzatura: q.testo,
                      descrizione: q.testo,
                      quantita: "",
                      stato: q.stato,
                      note: "",
                      autistaNome: q.autistaNome,
                      badgeAutista: q.badgeAutista,
                      targa: q.targa,
                    },
                  });
                });
            }
            // unused targa context for now (used to disambiguate title if needed)
            void targaUp;
            if (list.length === 0) return;
            setEventModalEvents(list);
            setEventModalIndex(0);
            setSinotticaEventoModalEvent(list[0]);
            setSinotticaEventoModalOpen(true);
          }}
          onContrattoClick={(targa: string) => {
            const targaUp: string = targa.toUpperCase();
            const mezzo = sinotticaMezzi.find(
              (m) => m.targa.toUpperCase() === targaUp,
            );
            if (mezzo) {
              setMezzoEditModalMezzoId(mezzo.id);
              setMezzoEditModalOpen(true);
            }
          }}
          onManutenzioneClick={(recordId) =>
            navigate(buildNextManutenzioniPath(undefined, recordId))
          }
          onEventoChipClick={(event) => {
            setSinotticaEventoModalEvent(event);
            setSinotticaEventoModalOpen(true);
          }}
        />
        <NextMezzoCronologiaModal
          open={cronologiaOpen}
          targa={cronologiaTarga}
          onClose={() => {
            setCronologiaOpen(false);
            setCronologiaTarga(null);
          }}
        />
        <NextMezzoHardDeleteModal
          open={deleteModalOpen}
          targa={deleteModalTarga}
          mezzoId={deleteModalMezzoId}
          onClose={() => {
            setDeleteModalOpen(false);
            setDeleteModalTarga(null);
            setDeleteModalMezzoId(null);
          }}
          onDeleted={() => {
            setDeleteModalOpen(false);
            setDeleteModalTarga(null);
            setDeleteModalMezzoId(null);
            void loadMezziAnagrafica();
            void loadScheduledMaintenances();
            void loadRefuels();
            void loadAutistiReadOnlySections();
            void loadManutenzioniDaFare();
            void loadManutenzioniStorico();
            void loadActiveSessionsCC();
          }}
        />
        {mezzoEditModalMezzoId && (
          <NextMezzoEditModal
            mezzoId={mezzoEditModalMezzoId}
            isOpen={mezzoEditModalOpen}
            onClose={() => {
              setMezzoEditModalOpen(false);
              setMezzoEditModalMezzoId(null);
            }}
            onSaved={() => {
              setMezzoEditModalOpen(false);
              setMezzoEditModalMezzoId(null);
              void loadMezziAnagrafica();
              void loadScheduledMaintenances();
            }}
          />
        )}
        </>
        ) : null}

        {archivioMode === "rifornimenti" ? (
          <section className="cc-section" id="cc-anchor-rifornimenti">
            <div className="cc-section-head">
              <h2>Report rifornimenti mensili</h2>
              <div className="cc-actions">
                <button
                  type="button"
                  className="cc-secondary-btn"
                  disabled={loadingRefuels}
                  onClick={() => void loadRefuels()}
                >
                  Aggiorna dati
                </button>
                <button
                  type="button"
                  className="cc-secondary-btn"
                  disabled={loadingRefuels}
                  onClick={() => setAnalisiOpen(true)}
                >
                  Analisi consumi
                </button>
                <button
                  type="button"
                  className="cc-primary-btn"
                  disabled={
                    generatingPdf ||
                    loadingRefuels ||
                    selectedMonth === "all" ||
                    selectedYear === "all"
                  }
                  title={
                    selectedMonth === "all" || selectedYear === "all"
                      ? "Seleziona mese e anno specifici per generare il PDF"
                      : undefined
                  }
                  onClick={handlePreviewPdf}
                >
                  {generatingPdf ? "Generazione in corso..." : "Anteprima PDF mensile"}
                </button>
              </div>
            </div>

            <div className="cc-filters">
              <label>
                Mese
                <select
                  value={selectedMonth === "all" ? "all" : String(selectedMonth)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setSelectedMonth(raw === "all" ? "all" : Number(raw));
                  }}
                >
                  <option value="all">Tutto</option>
                  {MONTH_NAMES.map((label, idx) => (
                    <option key={label} value={idx + 1}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Anno
                <select
                  value={selectedYear === "all" ? "all" : String(selectedYear)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setSelectedYear(raw === "all" ? "all" : Number(raw));
                  }}
                >
                  <option value="all">Tutto</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>

              <label className="cc-targa-filter cc-combobox-label">
                Filtro targa
                <div className="cc-combobox">
                  <input
                    type="text"
                    placeholder="Es. TI315407"
                    value={targaFilterInput}
                    onFocus={() => setTargaDropdownOpen(true)}
                    onBlur={() => window.setTimeout(() => setTargaDropdownOpen(false), 120)}
                    onChange={(e) => {
                      setTargaFilterInput(e.target.value);
                      setTargaDropdownOpen(true);
                    }}
                  />
                  {(targaFilterInput.length > 0 || targaFilterSelected) && (
                    <button
                      type="button"
                      className="cc-combobox-clear"
                      aria-label="Cancella filtro targa"
                      onClick={() => {
                        setTargaFilterInput("");
                        setTargaFilterSelected(null);
                        setTargaDropdownOpen(false);
                      }}
                    >
                      ×
                    </button>
                  )}
                  {targaDropdownOpen && targheSuggestions.length > 0 && (
                    <ul className="cc-combobox-list" role="listbox">
                      {targheSuggestions.slice(0, 50).map((targa) => (
                        <li key={targa}>
                          <button
                            type="button"
                            className="cc-combobox-item"
                            role="option"
                            aria-selected={targaFilterSelected === targa}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setTargaFilterInput(targa);
                              setTargaFilterSelected(targa);
                              setTargaDropdownOpen(false);
                            }}
                          >
                            {targa}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </label>

              <label className="cc-combobox-label">
                Autista
                <div className="cc-combobox">
                  <input
                    type="text"
                    placeholder="Cerca autista..."
                    value={autistaFilterInput}
                    onFocus={() => setAutistaDropdownOpen(true)}
                    onBlur={() => window.setTimeout(() => setAutistaDropdownOpen(false), 120)}
                    onChange={(e) => {
                      setAutistaFilterInput(e.target.value);
                      setAutistaDropdownOpen(true);
                    }}
                  />
                  {(autistaFilterInput.length > 0 || autistaFilterSelected) && (
                    <button
                      type="button"
                      className="cc-combobox-clear"
                      aria-label="Cancella filtro autista"
                      onClick={() => {
                        setAutistaFilterInput("");
                        setAutistaFilterSelected(null);
                        setAutistaDropdownOpen(false);
                      }}
                    >
                      ×
                    </button>
                  )}
                  {autistaDropdownOpen && colleghiSuggestions.length > 0 && (
                    <ul className="cc-combobox-list" role="listbox">
                      {colleghiSuggestions.slice(0, 50).map((entry) => (
                        <li key={entry.id || entry.nome}>
                          <button
                            type="button"
                            className="cc-combobox-item"
                            role="option"
                            aria-selected={autistaFilterSelected === entry.nome}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setAutistaFilterInput(entry.nome);
                              setAutistaFilterSelected(entry.nome);
                              setAutistaDropdownOpen(false);
                            }}
                          >
                            {entry.nome}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </label>

              <label>
                Fonte
                <select
                  value={refuelSourceFilter}
                  onChange={(e) =>
                    setRefuelSourceFilter(e.target.value as RefuelSourceFilter)
                  }
                >
                  <option value="all">Tutte</option>
                  <option value="caravate">Caravate</option>
                  <option value="distributore_piccadilly">Distributore Piccadilly</option>
                  <option value="distributore_eni">Distributore Eni</option>
                  <option value="distributore_contanti">Distributore Contanti</option>
                </select>
              </label>
            </div>

            <div className="cc-summary-grid">
              <div className="cc-summary-card">
                <span>Rifornimenti</span>
                <strong>{monthlyTotals.count}</strong>
              </div>
              <div className="cc-summary-card">
                <span>Totale litri</span>
                <strong>{formatNumberIt(monthlyTotals.litri, 2)} L</strong>
              </div>
              <div className="cc-summary-card">
                <span>
                  Media flotta
                  <span
                    className="cc-summary-info"
                    title="Media pesata di tutti i camion del mese (km totali / litri totali). Non cambia con i filtri Targa/Autista/Fonte."
                    aria-label="Info Media flotta"
                  >
                    ?
                  </span>
                </span>
                <strong>
                  {mediaFlottaMese.value !== null
                    ? formatMediaLitriKm(mediaFlottaMese.value)
                    : "—"}
                </strong>
                {mediaFlottaMese.value !== null &&
                  mediaFlottaMese.sogliaSopra !== null &&
                  mediaFlottaMese.sogliaSotto !== null && (
                    <small className="cc-summary-sub">
                      Range tipico:{" "}
                      {mediaFlottaMese.sogliaSotto.toFixed(2).replace(".", ",")} –{" "}
                      {mediaFlottaMese.sogliaSopra.toFixed(2).replace(".", ",")} km/L
                    </small>
                  )}
              </div>
              <div
                className={`cc-summary-card cc-summary-card-clickable${
                  anomaliesFilterActive ? " cc-summary-card-active" : ""
                }`}
                onClick={() => setAnomaliesFilterActive((prev) => !prev)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setAnomaliesFilterActive((prev) => !prev);
                  }
                }}
                aria-pressed={anomaliesFilterActive}
                title={
                  anomaliesFilterActive
                    ? "Click per tornare alla vista normale"
                    : "Click per filtrare solo le righe con anomalie"
                }
              >
                <span>Anomalie</span>
                <strong>{anomaliesSummary.totalRows}</strong>
                {anomaliesSummary.totalRows > 0 && (
                  <>
                    {anomaliesSummary.dataRows > 0 && (
                      <small className="cc-summary-sub">
                        {anomaliesSummary.dataRows} errori dati
                      </small>
                    )}
                    {anomaliesSummary.consumoRows > 0 && (
                      <small className="cc-summary-sub">
                        {anomaliesSummary.consumoRows} consumi sospetti
                      </small>
                    )}
                  </>
                )}
              </div>
            </div>

            {loadingRefuels && <div className="cc-status">Caricamento rifornimenti...</div>}
            {refuelsError && <div className="cc-status error">{refuelsError}</div>}
            {!loadingRefuels && !refuelsError && filteredMonthlyRefuels.length === 0 && (
              <div className="cc-status">Nessun rifornimento per i filtri selezionati.</div>
            )}
            {!loadingRefuels &&
              !refuelsError &&
              filteredMonthlyRefuels.length > 0 &&
              anomaliesFilterActive &&
              displayedRefuelsWithAnomalies.length === 0 && (
                <div className="cc-status">Nessuna anomalia rilevata.</div>
              )}

            {!loadingRefuels && displayedRefuelsWithAnomalies.length > 0 && (
              <div className="cc-table-wrap">
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Targa</th>
                      <th>Autista</th>
                      <th>Litri</th>
                      <th>Km</th>
                      <th>Fonte</th>
                      <th>Stato</th>
                      <th className="cc-col-media">Media km/L</th>
                      <th className="cc-col-media">Media 4 rif.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedRefuelsWithAnomalies.map(
                      ({ row: item, mediaLitriKm, anomalies, windowConsumption }) => {
                        const kmAnomalies = anomalies.filter((a) => a.target === "km");
                        const litriAnomalies = anomalies.filter(
                          (a) => a.target === "litri",
                        );
                        const dataAnomalies = anomalies.filter(
                          (a) => a.target === "km" || a.target === "litri",
                        );
                        const consumoAnomalies = anomalies.filter(
                          (a) => a.target === "consumo",
                        );
                        const trClass =
                          dataAnomalies.length > 0
                            ? "cc-row-anomala"
                            : consumoAnomalies.length > 0
                              ? "cc-row-anomala-consumo"
                              : undefined;
                        const renderWarning = (list: Anomaly[]) => {
                          if (list.length === 0) return null;
                          const tooltip = list.map((a) => a.message).join(" · ");
                          return (
                            <button
                              type="button"
                              className="cc-cell-warning"
                              title={tooltip}
                              aria-label="Apri indagine anomalia"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInvestigationRow(item);
                                setInvestigationOpen(true);
                              }}
                            >
                              ⚠
                            </button>
                          );
                        };
                        const openInvestigation = (e: ReactMouseEvent) => {
                          e.stopPropagation();
                          setInvestigationRow(item);
                          setInvestigationOpen(true);
                        };
                        const renderAnomalyPills = () => {
                          if (anomalies.length === 0) {
                            return <span className="cc-muted-cell">-</span>;
                          }
                          return (
                            <div className="cc-anomaly-pill-row">
                              {dataAnomalies.length > 0 && (
                                <button
                                  type="button"
                                  className="cc-anomaly-pill cc-anomaly-pill-data"
                                  title={dataAnomalies.map((a) => a.message).join(" - ")}
                                  onClick={openInvestigation}
                                >
                                  Errore dati
                                </button>
                              )}
                              {consumoAnomalies.length > 0 && (
                                <button
                                  type="button"
                                  className="cc-anomaly-pill cc-anomaly-pill-consumo"
                                  title={consumoAnomalies.map((a) => a.message).join(" - ")}
                                  onClick={openInvestigation}
                                >
                                  Consumo sospetto
                                </button>
                              )}
                            </div>
                          );
                        };
                        const trClassNames = [trClass, "cc-row-clickable"]
                          .filter(Boolean)
                          .join(" ");
                        return (
                          <tr
                            key={`${item.id}_${item.dateObj.getTime()}`}
                            className={trClassNames}
                            title="Click per modificare il rifornimento"
                            onClick={() => {
                              setEditRifornimentoRow(item);
                              setEditRifornimentoOpen(true);
                            }}
                          >
                            <td>{formatDateIt(item.dateObj)}</td>
                            <td>
                              <button
                                type="button"
                                className="cc-targa-link"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(buildNextDossierPath(item.targa));
                                }}
                                title={`Apri dossier mezzo ${item.targa}`}
                              >
                                {item.targa}
                              </button>
                            </td>
                            <td>{item.autistaNome || "-"}</td>
                            <td>
                              {formatNumberIt(item.litri, 2)}
                              {renderWarning(litriAnomalies)}
                            </td>
                            <td>
                              {formatNumberIt(item.km, 0)}
                              {renderWarning(kmAnomalies)}
                            </td>
                            <td>{item.sourceLabel}</td>
                            <td>{renderAnomalyPills()}</td>
                            <td className="cc-col-media">{mediaLitriKm}</td>
                            <td
                              className={`cc-col-media${
                                windowConsumption?.isBelowThreshold
                                  ? " cc-cell-warning-consumo"
                                  : ""
                              }`}
                              title={
                                windowConsumption
                                  ? `Media degli ultimi ${windowConsumption.windowCount} rifornimenti, contro media storica ${formatMediaLitriKm(
                                      windowConsumption.baselineKmL,
                                    )}`
                                  : undefined
                              }
                            >
                              {windowConsumption
                                ? formatMediaLitriKm(windowConsumption.windowKmL)
                                : "—"}
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}

      </div>

      {/* PROMPT 30.2: NextHomeAutistiEventoModal montato fuori dalle viste
          principali cosi' e' raggiungibile sia dal click chip Sinottica V2
          sia dal click "Apri dettaglio" Archivio. */}
      {sinotticaEventoModalOpen && sinotticaEventoModalEvent && (
        <NextHomeAutistiEventoModal
          event={sinotticaEventoModalEvent}
          editable={sinotticaEventoModalEditable}
          eventsCount={eventModalEvents.length || undefined}
          eventIndex={
            eventModalEvents.length > 0 ? eventModalIndex : undefined
          }
          onPrevEvent={
            eventModalEvents.length > 1
              ? () => {
                  const nextIdx: number = Math.max(0, eventModalIndex - 1);
                  setEventModalIndex(nextIdx);
                  setSinotticaEventoModalEvent(eventModalEvents[nextIdx]);
                }
              : undefined
          }
          onNextEvent={
            eventModalEvents.length > 1
              ? () => {
                  const nextIdx: number = Math.min(
                    eventModalEvents.length - 1,
                    eventModalIndex + 1,
                  );
                  setEventModalIndex(nextIdx);
                  setSinotticaEventoModalEvent(eventModalEvents[nextIdx]);
                }
              : undefined
          }
          onMarkEvasa={async (id: string, dataMs: number) => {
            const result = await markRichiestaEvasa(id, dataMs);
            if (!result.ok) {
              throw new Error(result.error || "Errore.");
            }
            await loadAutistiReadOnlySections();
            advanceAfterMark(id);
          }}
          onMarkChiusa={async (id: string, dataMs: number) => {
            const result = await markSegnalazioneChiusa(id, dataMs);
            if (!result.ok) {
              throw new Error(result.error || "Errore.");
            }
            await loadAutistiReadOnlySections();
            advanceAfterMark(id);
          }}
          onMarkChiuso={async (id: string, dataMs: number) => {
            const result = await markControlloChiuso(id, dataMs);
            if (!result.ok) {
              throw new Error(result.error || "Errore.");
            }
            await loadAutistiReadOnlySections();
            advanceAfterMark(id);
          }}
          onCreateManutenzioneDaFare={async (input) => {
            const result = await createManutenzioneDaFareFromEvento(input);
            if (!result.ok) return result;
            await loadManutenzioniDaFare();
            await loadAutistiReadOnlySections();
            advanceAfterMark(input.origineId);
            return result;
          }}
          onClose={() => {
            setSinotticaEventoModalOpen(false);
            setSinotticaEventoModalEvent(null);
            setSinotticaEventoModalEditable(true);
            setEventModalEvents([]);
            setEventModalIndex(0);
          }}
        />
      )}

      <NextCentroControlloIndagineModal
        open={investigationOpen}
        row={investigationRow}
        onClose={closeInvestigationModal}
        refuelRows={refuelRows}
        refuelSeedIndex={refuelSeedIndex}
        refuelConsumptionIndex={refuelConsumptionIndex}
      />

      <NextCentroControlloAnalisiModal
        open={analisiOpen}
        onClose={() => {
          setAnalisiOpen(false);
          setAnalisiInitialTab(undefined);
          setAnalisiInitialAndamentoTarga(null);
        }}
        refuelRows={refuelRows}
        refuelSeedIndex={refuelSeedIndex}
        mezziTargheList={mezziTargheList}
        scheduledMaintenances={scheduledMaintenances}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        refuelSourceFilter={refuelSourceFilter}
        initialTab={analisiInitialTab}
        initialAndamentoTarga={analisiInitialAndamentoTarga}
      />


      <NextRifornimentoEditModal
        open={editRifornimentoOpen}
        row={editRifornimentoRow}
        onClose={() => {
          setEditRifornimentoOpen(false);
          setEditRifornimentoRow(null);
        }}
        onSaved={() => {
          setEditRifornimentoOpen(false);
          setEditRifornimentoRow(null);
          void loadRefuels();
        }}
      />

      <PdfPreviewModal
        open={pdfPreviewOpen}
        title={pdfPreviewTitle}
        pdfUrl={pdfPreviewUrl}
        fileName={pdfPreviewFileName}
        hint={pdfShareHint}
        onClose={closePdfPreview}
        onShare={handleSharePdf}
        onCopyLink={handleCopyPdfText}
        onWhatsApp={handleWhatsAppPdf}
      />
    </div>
  );
}
