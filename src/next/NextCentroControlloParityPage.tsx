import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  generateManutenzioniProgrammatePDFBlob,
  generateRifornimentiMensiliPDFBlob,
  type ManutenzioneProgrammataPdfItem,
  type RifornimentiMensiliPdfItem,
} from "../utils/pdfEngine";
import {
  readNextAutistiReadOnlySnapshot,
  type NextAutistiControlloSectionItem,
  type NextAutistiRichiestaSectionItem,
  type NextAutistiSegnalazioneSectionItem,
} from "./domain/nextAutistiDomain";
import {
  readNextRifornimentiReadOnlySnapshot,
  type NextRifornimentoReadOnlyItem,
} from "./domain/nextRifornimentiDomain";
import { readNextAnagraficheFlottaSnapshot } from "./nextAnagraficheFlottaDomain";
import "../pages/CentroControllo.css";

type TabKey =
  | "manutenzioni"
  | "rifornimenti"
  | "segnalazioni"
  | "controlli"
  | "richieste";
type MaintenanceStatus = "SCADUTA" | "IN_SCADENZA" | "OK" | "SENZA_DATA";
type RefuelSource = "dossier" | "tmp" | "merged";

type ScheduledMaintenanceRow = {
  id: string;
  targa: string;
  categoria: string;
  manutenzioneDataFine: Date | null;
  manutenzioneDataFineRaw: string;
  manutenzioneContratto: string;
  manutenzioneKmMax: string;
  dataScadenzaRevisione: Date | null;
  status: MaintenanceStatus;
  daysToDeadline: number | null;
};

type RefuelRow = {
  id: string;
  originId: string;
  targa: string;
  dateObj: Date;
  autistaNome: string | null;
  badgeAutista: string | null;
  litri: number | null;
  km: number | null;
  costo: number | null;
  distributore: string;
  note: string;
  source: RefuelSource;
};

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
};

type PdfContext = "rifornimenti" | "manutenzioni";
type PrioritySource = "controlli" | "manutenzioni" | "segnalazioni" | "richieste";
type PriorityItem = {
  id: string;
  label: string;
  score: number;
  timestamp: number;
  targa: string;
  autista: string;
  motivo: string;
  source: PrioritySource;
  tab: TabKey;
  sectionId: string;
};

const MONTH_NAMES = [
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
const KO_PRIORITY_WINDOW_MS = 48 * 60 * 60 * 1000;
const PRIORITY_HIGH_THRESHOLD = 70;
const PRIORITY_MAX_ROWS = 15;

const safeText = (value: unknown): string => String(value ?? "").trim();

const normalizeTarga = (value: unknown): string =>
  String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();

const normalizeTargaFilter = (value: unknown): string =>
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

const shortText = (value: unknown, max = 90): string => {
  const text = safeText(value);
  if (!text) return "-";
  return text.length <= max ? text : `${text.slice(0, max - 1)}...`;
};

const formatDateIt = (value: Date | null): string => {
  if (!value) return "--/--/----";
  const dd = String(value.getDate()).padStart(2, "0");
  const mm = String(value.getMonth() + 1).padStart(2, "0");
  const yyyy = value.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const formatNumberIt = (value: number | null, fractionDigits = 2): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  return value.toLocaleString("it-IT", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
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

const mapRefuelSource = (item: NextRifornimentoReadOnlyItem): RefuelSource => {
  if (item.provenienza === "business") return "dossier";
  if (item.provenienza === "campo") return "tmp";
  return "merged";
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
});

const normalizeRefuelRecord = (
  record: Record<string, unknown> | null | undefined,
  index: number,
  source: RefuelSource
): RefuelRow | null => {
  const originId = safeText(record?.id);
  const targa = normalizeTarga(
    record?.mezzoTarga ??
      record?.targaCamion ??
      record?.targaMotrice ??
      record?.targaRimorchio ??
      record?.targa
  );
  const dateObj =
    parseDateFlexible(record?.data) ||
    parseDateFlexible(record?.dataOra) ||
    parseDateFlexible(record?.timestamp);
  if (!targa || !dateObj) return null;

  return {
    id: originId || `${source}_${index}`,
    originId,
    targa,
    dateObj,
    autistaNome: extractAutistaNome(record) || null,
    badgeAutista: safeText(record?.badgeAutista ?? record?.badge) || null,
    litri: toNumber(record?.litri),
    km: toNumber(record?.km),
    costo: toNumber(record?.costo ?? record?.importo),
    distributore: safeText(record?.distributore ?? record?.tipo),
    note: safeText(record?.note),
    source,
  };
};

export default function NextCentroControlloParityPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("manutenzioni");

  const [loadingMezzi, setLoadingMezzi] = useState(false);
  const [mezziError, setMezziError] = useState<string | null>(null);
  const [scheduledMaintenances, setScheduledMaintenances] = useState<ScheduledMaintenanceRow[]>(
    []
  );
  const [selectedMaintenanceIds, setSelectedMaintenanceIds] = useState<Record<string, boolean>>(
    {}
  );

  const [loadingRefuels, setLoadingRefuels] = useState(false);
  const [refuelsError, setRefuelsError] = useState<string | null>(null);
  const [refuelRows, setRefuelRows] = useState<RefuelRow[]>([]);

  const [loadingSegnalazioni, setLoadingSegnalazioni] = useState(false);
  const [segnalazioniError, setSegnalazioniError] = useState<string | null>(null);
  const [segnalazioniRows, setSegnalazioniRows] = useState<SegnalazioneRow[]>([]);
  const [segnalazioniFilterTarga, setSegnalazioniFilterTarga] = useState("");
  const [segnalazioniOnlyNuove, setSegnalazioniOnlyNuove] = useState(true);

  const [loadingControlli, setLoadingControlli] = useState(false);
  const [controlliError, setControlliError] = useState<string | null>(null);
  const [controlliRows, setControlliRows] = useState<ControlloRow[]>([]);
  const [controlliFilterTarga, setControlliFilterTarga] = useState("");

  const [loadingRichieste, setLoadingRichieste] = useState(false);
  const [richiesteError, setRichiesteError] = useState<string | null>(null);
  const [richiesteRows, setRichiesteRows] = useState<RichiestaRow[]>([]);
  const [richiesteFilterTarga, setRichiesteFilterTarga] = useState("");
  const [richiesteOnlyNuove, setRichiesteOnlyNuove] = useState(true);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [targaFilter, setTargaFilter] = useState("");

  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingMaintenancePdf, setGeneratingMaintenancePdf] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState("rifornimenti-mensili.pdf");
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState("Anteprima PDF rifornimenti");
  const [pdfShareHint, setPdfShareHint] = useState<string | null>(null);
  const [pdfContext, setPdfContext] = useState<PdfContext>("rifornimenti");
  const [priorityOnlyHigh, setPriorityOnlyHigh] = useState(false);

  const loadScheduledMaintenances = async () => {
    setLoadingMezzi(true);
    setMezziError(null);
    try {
      const snapshot = await readNextAnagraficheFlottaSnapshot();
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Errore caricamento mezzi.";
      setMezziError(message);
      setScheduledMaintenances([]);
    } finally {
      setLoadingMezzi(false);
    }
  };

  const loadRefuels = async () => {
    setLoadingRefuels(true);
    setRefuelsError(null);
    try {
      const snapshot = await readNextRifornimentiReadOnlySnapshot();
      const rows = snapshot.items
        .map((item, idx) =>
          normalizeRefuelRecord(
            {
              id: item.id,
              mezzoTarga: item.targa,
              autistaNome: item.autistaNome,
              badgeAutista: item.badgeAutista,
              litri: item.litri,
              km: item.km,
              costo: item.costo,
              distributore: item.distributore,
              note: item.note,
              timestamp: item.timestamp ?? item.timestampRicostruito ?? item.dataDisplay,
              data: item.dataDisplay,
            },
            idx,
            mapRefuelSource(item)
          )
        )
        .filter((item): item is RefuelRow => Boolean(item))
        .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
      setRefuelRows(rows);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Errore caricamento rifornimenti.";
      setRefuelsError(message);
      setRefuelRows([]);
    } finally {
      setLoadingRefuels(false);
    }
  };

  const loadAutistiReadOnlySections = async () => {
    setLoadingSegnalazioni(true);
    setSegnalazioniError(null);
    setLoadingControlli(true);
    setControlliError(null);
    setLoadingRichieste(true);
    setRichiesteError(null);

    try {
      const snapshot = await readNextAutistiReadOnlySnapshot();
      setSegnalazioniRows(snapshot.segnalazioniRows.map(mapSegnalazioneRow));
      setControlliRows(snapshot.controlliRows.map(mapControlloRow));
      setRichiesteRows(snapshot.richiesteRows.map(mapRichiestaRow));
      setSegnalazioniError(null);
      setControlliError(null);
      setRichiesteError(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Errore caricamento flussi autisti.";
      setSegnalazioniRows([]);
      setControlliRows([]);
      setRichiesteRows([]);
      setSegnalazioniError(message);
      setControlliError(message);
      setRichiesteError(message);
    } finally {
      setLoadingSegnalazioni(false);
      setLoadingControlli(false);
      setLoadingRichieste(false);
    }
  };

  useEffect(() => {
    void loadScheduledMaintenances();
    void loadRefuels();
    void loadAutistiReadOnlySections();
  }, []);

  useEffect(() => {
    setSelectedMaintenanceIds((prev) => {
      const validIds = new Set(scheduledMaintenances.map((row) => row.id));
      const next: Record<string, boolean> = {};
      Object.keys(prev).forEach((id) => {
        if (prev[id] && validIds.has(id)) next[id] = true;
      });
      return next;
    });
  }, [scheduledMaintenances]);

  const maintenanceCounters = useMemo(() => {
    return {
      total: scheduledMaintenances.length,
      scadute: scheduledMaintenances.filter((row) => row.status === "SCADUTA").length,
      inScadenza: scheduledMaintenances.filter((row) => row.status === "IN_SCADENZA").length,
      ok: scheduledMaintenances.filter((row) => row.status === "OK").length,
    };
  }, [scheduledMaintenances]);

  const selectedMaintenanceRows = useMemo(
    () => scheduledMaintenances.filter((row) => selectedMaintenanceIds[row.id]),
    [scheduledMaintenances, selectedMaintenanceIds]
  );

  const selectedMaintenanceCount = selectedMaintenanceRows.length;

  const availableYears = useMemo(() => {
    const years = new Set<number>([new Date().getFullYear()]);
    refuelRows.forEach((item) => years.add(item.dateObj.getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [refuelRows]);

  const filteredMonthlyRefuels = useMemo(() => {
    const targaNorm = normalizeTarga(targaFilter);
    return refuelRows.filter((item) => {
      if (item.dateObj.getMonth() + 1 !== selectedMonth) return false;
      if (item.dateObj.getFullYear() !== selectedYear) return false;
      if (targaNorm && !item.targa.includes(targaNorm)) return false;
      return true;
    });
  }, [refuelRows, selectedMonth, selectedYear, targaFilter]);

  const monthlyTotals = useMemo(() => {
    const litri = filteredMonthlyRefuels.reduce((sum, item) => sum + (item.litri ?? 0), 0);
    const costo = filteredMonthlyRefuels.reduce((sum, item) => sum + (item.costo ?? 0), 0);
    return {
      count: filteredMonthlyRefuels.length,
      litri,
      costo,
    };
  }, [filteredMonthlyRefuels]);

  const segnalazioniCounters = useMemo(
    () => ({
      totale: segnalazioniRows.length,
      nuove: segnalazioniRows.filter((row) => row.isNuova).length,
    }),
    [segnalazioniRows]
  );

  const segnalazioniFiltered = useMemo(() => {
    const targaKey = normalizeTargaFilter(segnalazioniFilterTarga);
    return segnalazioniRows.filter((row) => {
      if (segnalazioniOnlyNuove && !row.isNuova) return false;
      if (targaKey && !row.targaFilterKey.includes(targaKey)) return false;
      return true;
    });
  }, [segnalazioniRows, segnalazioniFilterTarga, segnalazioniOnlyNuove]);

  const controlliCounters = useMemo(
    () => ({
      ko: controlliRows.filter((row) => row.isKo).length,
      ok: controlliRows.filter((row) => !row.isKo).length,
    }),
    [controlliRows]
  );

  const controlliFiltered = useMemo(() => {
    const targaKey = normalizeTargaFilter(controlliFilterTarga);
    return controlliRows.filter((row) => {
      if (targaKey && !row.targaFilterKey.includes(targaKey)) return false;
      return true;
    });
  }, [controlliRows, controlliFilterTarga]);

  const controlliKoFiltered = useMemo(
    () => controlliFiltered.filter((row) => row.isKo),
    [controlliFiltered]
  );
  const controlliOkFiltered = useMemo(
    () => controlliFiltered.filter((row) => !row.isKo),
    [controlliFiltered]
  );

  const richiesteCounters = useMemo(
    () => ({
      totale: richiesteRows.length,
      nuove: richiesteRows.filter((row) => row.isNuova).length,
    }),
    [richiesteRows]
  );

  const richiesteFiltered = useMemo(() => {
    const targaKey = normalizeTargaFilter(richiesteFilterTarga);
    return richiesteRows.filter((row) => {
      if (richiesteOnlyNuove && !row.isNuova) return false;
      if (targaKey && !row.targaFilterKey.includes(targaKey)) return false;
      return true;
    });
  }, [richiesteRows, richiesteFilterTarga, richiesteOnlyNuove]);

  const priorityItems = useMemo(() => {
    const nowTs = Date.now();
    const globalTargaKey = normalizeTargaFilter(targaFilter);
    const priorityFromControlli: PriorityItem[] = controlliRows
      .filter((row) => row.isKo && row.ts > 0 && nowTs - row.ts <= KO_PRIORITY_WINDOW_MS)
      .map((row, idx) => {
        const autista = row.autistaNome
          ? `${row.autistaNome}${row.badgeAutista ? ` (${row.badgeAutista})` : ""}`
          : "-";
        return {
          id: `prio_ctrl_${row.id}_${idx}`,
          label: "CONTROLLO KO",
          score: 100,
          timestamp: row.ts,
          targa: row.targaLabel || "-",
          autista,
          motivo: row.koList.length ? `Check KO: ${row.koList.join(", ")}` : "Check KO",
          source: "controlli",
          tab: "controlli",
          sectionId: "cc-anchor-controlli",
        };
      });

    const priorityFromManutenzioni: PriorityItem[] = scheduledMaintenances
      .filter(
        (row) =>
          row.status === "SCADUTA" || row.status === "IN_SCADENZA" || row.status === "SENZA_DATA"
      )
      .map((row, idx) => {
        const score =
          row.status === "SCADUTA" ? 90 : row.status === "IN_SCADENZA" ? 70 : row.status === "SENZA_DATA" ? 30 : 0;
        const label =
          row.status === "SCADUTA"
            ? "MANUTENZIONE SCADUTA"
            : row.status === "IN_SCADENZA"
            ? "MANUTENZIONE IN SCADENZA"
            : "MANUTENZIONE: DATA MANCANTE";
        const timestamp = row.manutenzioneDataFine ? row.manutenzioneDataFine.getTime() : 0;
        const motivo =
          row.status === "SENZA_DATA"
            ? "Data fine non impostata"
            : `Data fine: ${formatDateIt(row.manutenzioneDataFine)}`;
        return {
          id: `prio_manut_${row.id}_${idx}`,
          label,
          score,
          timestamp,
          targa: row.targa || "-",
          autista: "-",
          motivo,
          source: "manutenzioni",
          tab: "manutenzioni",
          sectionId: "cc-anchor-manutenzioni",
        };
      });

    const priorityFromSegnalazioni: PriorityItem[] = segnalazioniRows
      .filter((row) => row.isNuova)
      .map((row, idx) => {
        const tipoUpper = row.tipo.toUpperCase();
        const score = 60 + (tipoUpper === "GOMME" ? 15 : 0);
        const autista = row.autistaNome
          ? `${row.autistaNome}${row.badgeAutista ? ` (${row.badgeAutista})` : ""}`
          : "-";
        return {
          id: `prio_segn_${row.id}_${idx}`,
          label: "SEGNALAZIONE",
          score,
          timestamp: row.ts,
          targa: row.targa || "-",
          autista,
          motivo: `${tipoUpper || "TIPO N/D"} - ${shortText(row.descrizione, 100)}`,
          source: "segnalazioni",
          tab: "segnalazioni",
          sectionId: "cc-anchor-segnalazioni",
        };
      });

    const priorityFromRichieste: PriorityItem[] = richiesteRows
      .filter((row) => row.isNuova)
      .map((row, idx) => {
        const autista = row.autistaNome
          ? `${row.autistaNome}${row.badgeAutista ? ` (${row.badgeAutista})` : ""}`
          : "-";
        return {
          id: `prio_rich_${row.id}_${idx}`,
          label: "RICHIESTA ATTREZZATURE",
          score: 40,
          timestamp: row.ts,
          targa: row.targa || "-",
          autista,
          motivo: shortText(row.testo, 100),
          source: "richieste",
          tab: "richieste",
          sectionId: "cc-anchor-richieste",
        };
      });

    const ordered = [
      ...priorityFromControlli,
      ...priorityFromManutenzioni,
      ...priorityFromSegnalazioni,
      ...priorityFromRichieste,
    ].sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return b.timestamp - a.timestamp;
    });

    if (!globalTargaKey) return ordered;
    return ordered.filter((item) =>
      normalizeTargaFilter(item.targa).includes(globalTargaKey)
    );
  }, [controlliRows, scheduledMaintenances, segnalazioniRows, richiesteRows, targaFilter]);

  const priorityHighCount = useMemo(
    () => priorityItems.filter((item) => item.score >= PRIORITY_HIGH_THRESHOLD).length,
    [priorityItems]
  );

  const priorityVisibleItems = useMemo(() => {
    const base = priorityOnlyHigh
      ? priorityItems.filter((item) => item.score >= PRIORITY_HIGH_THRESHOLD)
      : priorityItems;
    return base.slice(0, PRIORITY_MAX_ROWS);
  }, [priorityItems, priorityOnlyHigh]);

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
    filteredMonthlyRefuels.map((item) => ({
      data: formatDateIt(item.dateObj),
      targa: item.targa,
      autistaNome: item.autistaNome,
      litri: item.litri,
      km: item.km,
      costo: item.costo,
      distributore: item.distributore,
      note: item.note,
      source: item.source,
    }));

  const buildMaintenancePdfItems = (): ManutenzioneProgrammataPdfItem[] =>
    selectedMaintenanceRows.map((row) => ({
      targa: row.targa,
      dataFine: row.manutenzioneDataFine ? formatDateIt(row.manutenzioneDataFine) : "DATA MANCANTE",
      kmMax: row.manutenzioneKmMax || "-",
      contratto: row.manutenzioneContratto || "-",
      revisione: row.dataScadenzaRevisione ? formatDateIt(row.dataScadenzaRevisione) : "-",
    }));

  const selectAllMaintenances = () => {
    const next: Record<string, boolean> = {};
    scheduledMaintenances.forEach((row) => {
      next[row.id] = true;
    });
    setSelectedMaintenanceIds(next);
  };

  const deselectAllMaintenances = () => {
    setSelectedMaintenanceIds({});
  };

  const toggleMaintenanceSelection = (id: string) => {
    setSelectedMaintenanceIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const buildShareMessage = () =>
    pdfContext === "manutenzioni"
      ? buildPdfShareText({
          contextLabel: "Manutenzioni programmate selezionate",
          dateLabel: formatDateIt(new Date()),
          fileName: pdfPreviewFileName || "manutenzioni-programmate.pdf",
          url: pdfPreviewUrl,
        })
      : buildPdfShareText({
          contextLabel: "Report rifornimenti mensili",
          dateLabel: `${String(selectedMonth).padStart(2, "0")}/${selectedYear}`,
          fileName: pdfPreviewFileName || "rifornimenti-mensili.pdf",
          url: pdfPreviewUrl,
        });

  const handlePreviewMaintenancePdf = async () => {
    if (!selectedMaintenanceRows.length) {
      window.alert("Seleziona almeno un mezzo.");
      return;
    }
    try {
      setGeneratingMaintenancePdf(true);
      setPdfContext("manutenzioni");
      const preview = await openPreview({
        source: () =>
          generateManutenzioniProgrammatePDFBlob({
            titolo: "Manutenzioni programmate selezionate",
            dataReport: formatDateIt(new Date()),
            items: buildMaintenancePdfItems(),
          }),
        fileName: `manutenzioni_programmate_${formatDateIt(new Date()).replace(/\//g, "-")}.pdf`,
        previousUrl: pdfPreviewUrl,
      });

      setPdfShareHint(null);
      setPdfPreviewBlob(preview.blob);
      setPdfPreviewFileName(preview.fileName);
      setPdfPreviewTitle(`Anteprima PDF manutenzioni (${selectedMaintenanceRows.length})`);
      setPdfPreviewUrl(preview.url);
      setPdfPreviewOpen(true);
    } catch (err) {
      console.error("Errore anteprima PDF manutenzioni:", err);
      window.alert("Impossibile generare l'anteprima PDF.");
    } finally {
      setGeneratingMaintenancePdf(false);
    }
  };

  const handlePreviewPdf = async () => {
    if (!filteredMonthlyRefuels.length) {
      window.alert("Nessun rifornimento nel periodo selezionato.");
      return;
    }
    try {
      setGeneratingPdf(true);
      setPdfContext("rifornimenti");
      const monthLabel = `${String(selectedMonth).padStart(2, "0")}-${selectedYear}`;
      const preview = await openPreview({
        source: () =>
          generateRifornimentiMensiliPDFBlob({
            mese: selectedMonth,
            anno: selectedYear,
            items: buildPdfItems(),
            filters: {
              targa: normalizeTarga(targaFilter) || null,
            },
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

  const handlePriorityItemClick = (item: PriorityItem) => {
    if (activeTab !== item.tab) {
      setActiveTab(item.tab);
    }
    window.setTimeout(() => {
      const target = document.getElementById(item.sectionId);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, activeTab === item.tab ? 0 : 80);
  };

  return (
    <div className="cc-page">
      <div className="cc-shell">
        <header className="cc-header">
          <button className="cc-back" type="button" onClick={() => navigate("/next/gestione-operativa")}>
            Torna a Gestione Operativa
          </button>
          <h1>Centro Controllo</h1>
          <p>
            Monitoraggio manutenzioni, rifornimenti e flussi autisti (segnalazioni, controlli,
            richieste).
          </p>
        </header>

        <section className="cc-priority-section">
          <div className="cc-section-head">
            <h2>PRIORITA OGGI</h2>
            <div className="cc-actions">
              <span className="cc-inline-count">
                Totale: {priorityItems.length} | Alte priorita (soglia 70): {priorityHighCount}
              </span>
              <label className="cc-toggle">
                <input
                  type="checkbox"
                  checked={priorityOnlyHigh}
                  onChange={(e) => setPriorityOnlyHigh(e.target.checked)}
                />
                <span>Solo alte priorita</span>
              </label>
            </div>
          </div>

          {priorityVisibleItems.length === 0 ? (
            <div className="cc-status">Nessuna priorita da mostrare.</div>
          ) : (
            <div className="cc-priority-list">
              {priorityVisibleItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`cc-priority-row ${
                    item.score >= PRIORITY_HIGH_THRESHOLD ? "is-high" : ""
                  }`}
                  onClick={() => handlePriorityItemClick(item)}
                >
                  <span className="cc-priority-score">{item.score}</span>
                  <span className="cc-priority-label">{item.label}</span>
                  <span className="cc-priority-targa">{item.targa}</span>
                  <span className="cc-priority-autista">{item.autista}</span>
                  <span className="cc-priority-motivo">{item.motivo}</span>
                  <span className="cc-priority-date">
                    {formatDateIt(item.timestamp ? new Date(item.timestamp) : null)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <div className="cc-tabs">
          <button
            type="button"
            className={activeTab === "manutenzioni" ? "active" : ""}
            onClick={() => setActiveTab("manutenzioni")}
          >
            Manutenzioni programmate
          </button>
          <button
            type="button"
            className={activeTab === "rifornimenti" ? "active" : ""}
            onClick={() => setActiveTab("rifornimenti")}
          >
            Report rifornimenti
          </button>
          <button
            type="button"
            className={activeTab === "segnalazioni" ? "active" : ""}
            onClick={() => setActiveTab("segnalazioni")}
          >
            Segnalazioni autisti
          </button>
          <button
            type="button"
            className={activeTab === "controlli" ? "active" : ""}
            onClick={() => setActiveTab("controlli")}
          >
            Controlli KO/OK
          </button>
          <button
            type="button"
            className={activeTab === "richieste" ? "active" : ""}
            onClick={() => setActiveTab("richieste")}
          >
            Richieste attrezzature
          </button>
        </div>

        {activeTab === "manutenzioni" && (
          <section className="cc-section" id="cc-anchor-manutenzioni">
            <div className="cc-section-head">
              <h2>Manutenzioni programmate</h2>
              <button type="button" className="cc-secondary-btn" onClick={() => void loadScheduledMaintenances()}>
                Aggiorna
              </button>
            </div>

            <div className="cc-maintenance-actions">
              <button type="button" className="cc-secondary-btn" onClick={selectAllMaintenances}>
                Seleziona tutti
              </button>
              <button type="button" className="cc-secondary-btn" onClick={deselectAllMaintenances}>
                Deseleziona tutti
              </button>
              <span className="cc-selected-count">Selezionati: {selectedMaintenanceCount}</span>
              <button
                type="button"
                className="cc-primary-btn"
                disabled={selectedMaintenanceCount === 0 || generatingMaintenancePdf}
                onClick={handlePreviewMaintenancePdf}
              >
                {generatingMaintenancePdf
                  ? "Generazione in corso..."
                  : "Anteprima PDF selezionati"}
              </button>
            </div>

            <div className="cc-summary-grid">
              <div className="cc-summary-card">
                <span>Programmate</span>
                <strong>{maintenanceCounters.total}</strong>
              </div>
              <div className="cc-summary-card danger">
                <span>Scadute</span>
                <strong>{maintenanceCounters.scadute}</strong>
              </div>
              <div className="cc-summary-card warn">
                <span>In scadenza</span>
                <strong>{maintenanceCounters.inScadenza}</strong>
              </div>
              <div className="cc-summary-card ok">
                <span>OK</span>
                <strong>{maintenanceCounters.ok}</strong>
              </div>
            </div>

            {loadingMezzi && <div className="cc-status">Caricamento manutenzioni programmate...</div>}
            {mezziError && <div className="cc-status error">{mezziError}</div>}
            {!loadingMezzi && !mezziError && scheduledMaintenances.length === 0 && (
              <div className="cc-status">Nessuna manutenzione programmata trovata.</div>
            )}

            {!loadingMezzi && scheduledMaintenances.length > 0 && (
              <div className="cc-table-wrap">
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Targa</th>
                      <th>Categoria</th>
                      <th>Data fine</th>
                      <th>Stato</th>
                      <th>Dettagli</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduledMaintenances.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={Boolean(selectedMaintenanceIds[row.id])}
                            onChange={() => toggleMaintenanceSelection(row.id)}
                            aria-label={`Seleziona mezzo ${row.targa}`}
                          />
                        </td>
                        <td>{row.targa}</td>
                        <td>{row.categoria}</td>
                        <td>{formatDateIt(row.manutenzioneDataFine)}</td>
                        <td>
                          <span className={`cc-badge ${row.status.toLowerCase()}`}>{row.status}</span>
                        </td>
                        <td>
                          {row.manutenzioneContratto ? `Contratto: ${row.manutenzioneContratto}` : "-"}
                          {row.manutenzioneKmMax ? ` - Km max: ${row.manutenzioneKmMax}` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeTab === "rifornimenti" && (
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
                  className="cc-primary-btn"
                  disabled={generatingPdf || loadingRefuels}
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
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {MONTH_NAMES.map((label, idx) => (
                    <option key={label} value={idx + 1}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Anno
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>

              <label className="cc-targa-filter">
                Filtro targa
                <input
                  type="text"
                  placeholder="Es. TI315407"
                  value={targaFilter}
                  onChange={(e) => setTargaFilter(e.target.value)}
                />
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
                <span>Totale costo</span>
                <strong>{formatNumberIt(monthlyTotals.costo, 2)}</strong>
              </div>
            </div>

            {loadingRefuels && <div className="cc-status">Caricamento rifornimenti...</div>}
            {refuelsError && <div className="cc-status error">{refuelsError}</div>}
            {!loadingRefuels && !refuelsError && filteredMonthlyRefuels.length === 0 && (
              <div className="cc-status">Nessun rifornimento per i filtri selezionati.</div>
            )}

            {!loadingRefuels && filteredMonthlyRefuels.length > 0 && (
              <div className="cc-table-wrap">
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Targa</th>
                      <th>Autista</th>
                      <th>Litri</th>
                      <th>Km</th>
                      <th>Costo</th>
                      <th>Fonte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMonthlyRefuels.map((item) => (
                      <tr key={`${item.id}_${item.dateObj.getTime()}`}>
                        <td>{formatDateIt(item.dateObj)}</td>
                        <td>{item.targa}</td>
                        <td>{item.autistaNome || "-"}</td>
                        <td>{formatNumberIt(item.litri, 2)}</td>
                        <td>{formatNumberIt(item.km, 0)}</td>
                        <td>{formatNumberIt(item.costo, 2)}</td>
                        <td>{item.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeTab === "segnalazioni" && (
          <section className="cc-section" id="cc-anchor-segnalazioni">
            <div className="cc-section-head">
              <h2>Segnalazioni autisti</h2>
              <div className="cc-actions">
                <span className="cc-inline-count">
                  Totali: {segnalazioniCounters.totale} | Nuove: {segnalazioniCounters.nuove}
                </span>
                <button
                  type="button"
                  className="cc-secondary-btn"
                  disabled={loadingSegnalazioni}
                  onClick={() => void loadAutistiReadOnlySections()}
                >
                  Aggiorna dati
                </button>
              </div>
            </div>

            <div className="cc-filters cc-filters-compact">
              <label className="cc-targa-filter">
                Filtro targa
                <input
                  type="text"
                  placeholder="Es. TI315407"
                  value={segnalazioniFilterTarga}
                  onChange={(e) => setSegnalazioniFilterTarga(e.target.value)}
                />
              </label>
              <label className="cc-toggle">
                <input
                  type="checkbox"
                  checked={segnalazioniOnlyNuove}
                  onChange={(e) => setSegnalazioniOnlyNuove(e.target.checked)}
                />
                <span>Solo nuove</span>
              </label>
            </div>

            {loadingSegnalazioni && <div className="cc-status">Caricamento segnalazioni...</div>}
            {segnalazioniError && <div className="cc-status error">{segnalazioniError}</div>}
            {!loadingSegnalazioni && !segnalazioniError && segnalazioniFiltered.length === 0 && (
              <div className="cc-status">Nessuna segnalazione per i filtri selezionati.</div>
            )}

            {!loadingSegnalazioni && segnalazioniFiltered.length > 0 && (
              <div className="cc-table-wrap">
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Targa</th>
                      <th>Autista</th>
                      <th>Tipo</th>
                      <th>Descrizione</th>
                      <th>Stato</th>
                      <th>Foto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {segnalazioniFiltered.map((row, idx) => (
                      <tr key={`${row.id}_${row.ts}_${idx}`}>
                        <td>{formatDateIt(row.dateObj)}</td>
                        <td>{row.targa}</td>
                        <td>{row.autistaNome || "-"}</td>
                        <td>{row.tipo}</td>
                        <td>{row.descrizione}</td>
                        <td>{row.isNuova ? "NUOVA" : row.stato}</td>
                        <td>{row.fotoCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeTab === "controlli" && (
          <section className="cc-section" id="cc-anchor-controlli">
            <div className="cc-section-head">
              <h2>Controlli mezzo KO/OK</h2>
              <div className="cc-actions">
                <span className="cc-inline-count">
                  KO: {controlliCounters.ko} | OK: {controlliCounters.ok}
                </span>
                <button
                  type="button"
                  className="cc-secondary-btn"
                  disabled={loadingControlli}
                  onClick={() => void loadAutistiReadOnlySections()}
                >
                  Aggiorna dati
                </button>
              </div>
            </div>

            <div className="cc-filters cc-filters-compact">
              <label className="cc-targa-filter">
                Filtro targa
                <input
                  type="text"
                  placeholder="Es. TI315407"
                  value={controlliFilterTarga}
                  onChange={(e) => setControlliFilterTarga(e.target.value)}
                />
              </label>
            </div>

            {loadingControlli && <div className="cc-status">Caricamento controlli...</div>}
            {controlliError && <div className="cc-status error">{controlliError}</div>}
            {!loadingControlli && !controlliError && controlliFiltered.length === 0 && (
              <div className="cc-status">Nessun controllo per i filtri selezionati.</div>
            )}

            {!loadingControlli && controlliFiltered.length > 0 && (
              <div className="cc-two-columns">
                <div className="cc-column">
                  <h3 className="cc-column-title">KO ({controlliKoFiltered.length})</h3>
                  {controlliKoFiltered.length === 0 ? (
                    <div className="cc-status">Nessun controllo KO.</div>
                  ) : (
                    <div className="cc-card-list">
                      {controlliKoFiltered.map((row, idx) => (
                        <article className="cc-control-card ko" key={`${row.id}_${row.ts}_${idx}`}>
                          <div className="cc-control-row">
                            <span>{formatDateIt(row.dateObj)}</span>
                            <span className="cc-badge scaduta">KO</span>
                          </div>
                          <div className="cc-control-title">{row.targaLabel}</div>
                          <div className="cc-control-text">Autista: {row.autistaNome || "-"}</div>
                          <div className="cc-control-text">Check KO: {row.koList.join(", ")}</div>
                          {row.note ? <div className="cc-control-note">Note: {row.note}</div> : null}
                        </article>
                      ))}
                    </div>
                  )}
                </div>

                <div className="cc-column">
                  <h3 className="cc-column-title">OK ({controlliOkFiltered.length})</h3>
                  {controlliOkFiltered.length === 0 ? (
                    <div className="cc-status">Nessun controllo OK.</div>
                  ) : (
                    <div className="cc-card-list">
                      {controlliOkFiltered.map((row, idx) => (
                        <article className="cc-control-card ok" key={`${row.id}_${row.ts}_${idx}`}>
                          <div className="cc-control-row">
                            <span>{formatDateIt(row.dateObj)}</span>
                            <span className="cc-badge ok">OK</span>
                          </div>
                          <div className="cc-control-title">{row.targaLabel}</div>
                          <div className="cc-control-text">Autista: {row.autistaNome || "-"}</div>
                          <div className="cc-control-text">Check KO: nessuno</div>
                          {row.note ? <div className="cc-control-note">Note: {row.note}</div> : null}
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "richieste" && (
          <section className="cc-section" id="cc-anchor-richieste">
            <div className="cc-section-head">
              <h2>Richieste attrezzature</h2>
              <div className="cc-actions">
                <span className="cc-inline-count">
                  Totali: {richiesteCounters.totale} | Nuove: {richiesteCounters.nuove}
                </span>
                <button
                  type="button"
                  className="cc-secondary-btn"
                  disabled={loadingRichieste}
                  onClick={() => void loadAutistiReadOnlySections()}
                >
                  Aggiorna dati
                </button>
              </div>
            </div>

            <div className="cc-filters cc-filters-compact">
              <label className="cc-targa-filter">
                Filtro targa
                <input
                  type="text"
                  placeholder="Es. TI315407"
                  value={richiesteFilterTarga}
                  onChange={(e) => setRichiesteFilterTarga(e.target.value)}
                />
              </label>
              <label className="cc-toggle">
                <input
                  type="checkbox"
                  checked={richiesteOnlyNuove}
                  onChange={(e) => setRichiesteOnlyNuove(e.target.checked)}
                />
                <span>Solo nuove</span>
              </label>
            </div>

            {loadingRichieste && <div className="cc-status">Caricamento richieste...</div>}
            {richiesteError && <div className="cc-status error">{richiesteError}</div>}
            {!loadingRichieste && !richiesteError && richiesteFiltered.length === 0 && (
              <div className="cc-status">Nessuna richiesta per i filtri selezionati.</div>
            )}

            {!loadingRichieste && richiesteFiltered.length > 0 && (
              <div className="cc-table-wrap">
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Targa</th>
                      <th>Autista</th>
                      <th>Testo</th>
                      <th>Foto</th>
                      <th>Stato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {richiesteFiltered.map((row, idx) => (
                      <tr key={`${row.id}_${row.ts}_${idx}`}>
                        <td>{formatDateIt(row.dateObj)}</td>
                        <td>{row.targa}</td>
                        <td>{row.autistaNome || "-"}</td>
                        <td>{row.testo}</td>
                        <td>{row.hasFoto ? "SI" : "NO"}</td>
                        <td>{row.isNuova ? "NUOVA" : row.stato}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>

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
