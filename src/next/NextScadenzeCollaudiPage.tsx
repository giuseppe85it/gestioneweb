import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PdfPreviewModal from "../components/PdfPreviewModal";
import {
  buildPdfShareText,
  buildWhatsAppShareUrl,
  copyTextToClipboard,
  openPreview,
  revokePdfPreviewUrl,
  sharePdfFile,
} from "../utils/pdfPreview";
import { fromUserInput, toDisplay, toISO } from "./helpers/dateUnica";
import {
  readNextCentroControlloSnapshot,
  type D10MezzoItem,
  type D10PrenotazioneCollaudo,
  type D10PreCollaudo,
  type D10RevisionItem,
  type D10SessionItem,
  type D10Snapshot,
} from "./domain/nextCentroControlloDomain";
import {
  readNextOfficineSnapshot,
  type NextOfficinaReadOnlyItem,
} from "./domain/nextOfficineDomain";
import { buildNextDossierPath } from "./nextStructuralPaths";
import {
  markRevisioneCompletata,
  setPreCollaudo,
  setPrenotazioneCollaudo,
} from "./nextScadenzeCollaudiWriter";
import {
  evaluateScadenzaManutenzione,
  readKmCorrentiByTarga,
  readNextManutenzioniScadenzeSnapshot,
  settoreScadenza,
  type NextManutenzioneScadenzaItem,
  type NextManutenzioneScadenzaRecord,
  type NextManutenzioniScadenzeSnapshot,
  type NextScadenzaComponente,
  type NextScadenzaStato,
  type ScadenzaBase,
} from "./domain/nextManutenzioniScadenzeDomain";
import {
  deleteScadenzaManutenzione,
  saveScadenzaManutenzione,
} from "./nextManutenzioniScadenzeWriter";
import {
  filterScadenzePdfRows,
  generateScadenzePdfBlob,
  type ScadenzePdfCategoryFilter,
  type ScadenzePdfRow,
} from "./nextScadenzePdf";
import "./next-scadenze.css";

type FeedbackState = {
  tone: "warning" | "danger" | "success";
  text: string;
};

type PrenotazioneFormState = {
  data: string;
  ora: string;
  luogo: string;
  note: string;
};

type PreCollaudoFormState = {
  data: string;
  officina: string;
  lavoriPrevisti: string;
};

type RevisioneFormState = {
  data: string;
  esito: string;
  note: string;
};

type Operation =
  | {
      kind: "prenotazione";
      item: D10RevisionItem;
      variant: "create" | "edit";
      form: PrenotazioneFormState;
    }
  | {
      kind: "pre-collaudo";
      item: D10RevisionItem;
      variant: "create" | "edit";
      form: PreCollaudoFormState;
    }
  | {
      kind: "revisione";
      item: D10RevisionItem;
      form: RevisioneFormState;
    }
  | {
      kind: "cancella-prenotazione";
      item: D10RevisionItem;
      prenotazione: D10PrenotazioneCollaudo;
    };

type PreCollaudoWithLavori = D10PreCollaudo & {
  lavoriPrevisti?: string | null;
};

function formatDateLabel(timestamp: number | null): string {
  if (timestamp == null) return "-";
  return toDisplay(timestamp) || "-";
}

function formatEditableDate(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return toDisplay(raw) || raw;
}

function formatDateFieldValue(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return toDisplay(raw) || raw;
}

function normalizeDateForStorage(value: string): string | null {
  return fromUserInput(value) ?? toISO(value);
}

function formatGiorniLabel(giorni: number | null): string {
  if (giorni === null) return "n.d.";
  if (giorni === 0) return "oggi";
  const abs = Math.abs(giorni);
  const base = abs === 1 ? "1 giorno" : `${abs} giorni`;
  return giorni < 0 ? `${base} fa` : `tra ${base}`;
}

function sanitizeBookingTime(rawValue: string): string | null {
  let value = rawValue.replace(/\u00A0/g, " ").trim().replace(/\./g, ":");
  if (!value) return "";
  if (value.length >= 5) value = value.slice(0, 5);
  if (/^[0-9]:[0-5]\d$/.test(value)) value = `0${value}`;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  return value;
}

function formatPrenotazioneSummary(prenotazione: D10PrenotazioneCollaudo | null): string {
  if (!prenotazione) return "non prenotato";
  if (prenotazione.completata) {
    const completataIl = formatEditableDate(prenotazione.completataIl);
    return `completata${completataIl ? ` il ${completataIl}` : ""}`;
  }
  const dataLabel = formatEditableDate(prenotazione.data);
  const ora = String(prenotazione.ora ?? "").trim();
  const luogo = String(prenotazione.luogo ?? "").trim();
  const note = String(prenotazione.note ?? "").trim();
  return `prenotata per ${dataLabel || "data non disponibile"}${ora ? ` ${ora}` : ""}${
    luogo ? ` - ${luogo}` : ""
  }${note ? ` | ${note}` : ""}`;
}

function formatPreCollaudoSummary(preCollaudo: D10PreCollaudo | null): string {
  if (!preCollaudo) return "nessuno programmato";
  const dataLabel = formatEditableDate(preCollaudo.data);
  const officina = String(preCollaudo.officina ?? "").trim();
  return `${dataLabel || "data non disponibile"}${officina ? ` - ${officina}` : ""}`;
}

function getPreCollaudoLavori(preCollaudo: D10PreCollaudo | null): string {
  return String((preCollaudo as PreCollaudoWithLavori | null)?.lavoriPrevisti ?? "").trim();
}

function buildPrenotazioneForm(
  item: D10RevisionItem,
  variant: "create" | "edit",
): Operation {
  const current = item.prenotazioneCollaudo;
  return {
    kind: "prenotazione",
    item,
    variant,
    form: {
      data: formatDateFieldValue(current?.data),
      ora: String(current?.ora ?? "").trim(),
      luogo: String(current?.luogo ?? "").trim(),
      note: String(current?.note ?? "").trim(),
    },
  };
}

function buildPreCollaudoForm(
  item: D10RevisionItem,
  variant: "create" | "edit",
): Operation {
  const current = item.preCollaudo;
  return {
    kind: "pre-collaudo",
    item,
    variant,
    form: {
      data: formatDateFieldValue(current?.data),
      officina: String(current?.officina ?? "").trim(),
      lavoriPrevisti: getPreCollaudoLavori(current),
    },
  };
}

function buildRevisioneForm(item: D10RevisionItem): Operation {
  return {
    kind: "revisione",
    item,
    form: { data: "", esito: "", note: "" },
  };
}

function buildDeletePrenotazioneOperation(
  item: D10RevisionItem,
  prenotazione: D10PrenotazioneCollaudo,
): Operation {
  return {
    kind: "cancella-prenotazione",
    item,
    prenotazione,
  };
}

function readTargaFromSearch(search: string): string {
  const raw = new URLSearchParams(search).get("targa");
  if (!raw) return "";
  return raw.trim().toUpperCase();
}

function filterOfficine(items: NextOfficinaReadOnlyItem[], query: string): NextOfficinaReadOnlyItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("it");
  if (!normalizedQuery) return items.slice(0, 8);
  return items
    .filter((item) => {
      const target = [item.nome, item.citta, item.telefono]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("it");
      return target.includes(normalizedQuery);
    })
    .slice(0, 8);
}

function formatOfficinaMeta(item: NextOfficinaReadOnlyItem): string {
  return [item.citta, item.telefono].filter(Boolean).join(" - ");
}

// ————————————————————————————————————————————————————————————————
// Scadenze per settore (collaudi + manutenzioni): helper di presentazione
// ————————————————————————————————————————————————————————————————
// Settore di una scadenza nella pagina: i 4 predefiniti (collaudi + manutenzioni) e i
// personalizzati (key "custom:..."). Ogni voce porta con sé il proprio settore.
type SettorePagina = { key: string; label: string; icon: string };

const SETTORE_COLLAUDI_KEY = "collaudi";
const ICONA_CRONOTACHIGRAFO = '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>';
const ICONA_TAGLIANDI = '<path d="M14 7l3 3M3 21l3-1 9-9-2-2-9 9z"/><path d="M15 5l4 4"/>';
const ICONA_ESTINTORE = '<path d="M9 4h4v3H9zM10 7v13a2 2 0 0 0 4 0V7M15 6l3-1"/>';
const ICONA_COLLAUDI = '<path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>';
const ICONA_SETTORE_GENERICA =
  '<path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L3 13V3h10l7.59 7.59a2 2 0 0 1 0 2.82z"/><circle cx="7.5" cy="7.5" r="1.5"/>';

function iconaSettore(key: string): string {
  if (key === "cronotachigrafo") return ICONA_CRONOTACHIGRAFO;
  if (key === "tagliandi") return ICONA_TAGLIANDI;
  if (key === "estintore") return ICONA_ESTINTORE;
  if (key === SETTORE_COLLAUDI_KEY) return ICONA_COLLAUDI;
  return ICONA_SETTORE_GENERICA;
}

// Ordine dei settori nella pagina: predefiniti di manutenzione, poi i personalizzati, poi i collaudi.
function ordinePaginaSettore(key: string): number {
  if (key === "cronotachigrafo") return 0;
  if (key === "tagliandi") return 1;
  if (key === "estintore") return 2;
  if (key === SETTORE_COLLAUDI_KEY) return 9;
  return 5;
}

// Settore di una voce: collaudi è fisso; le manutenzioni derivano il settore dal tipo/label.
function settoreDiManutenzione(tipo: string, label: string): SettorePagina {
  const settore = settoreScadenza(tipo, label);
  return { key: settore.key, label: settore.label, icon: iconaSettore(settore.key) };
}

const STATO_SEVERITA: Record<NextScadenzaStato, number> = {
  scaduta: 4,
  in_scadenza: 3,
  ok: 2,
  valore_non_disponibile: 1,
  data_mancante: 0,
};

function pillClassForStato(stato: NextScadenzaStato): string {
  if (stato === "scaduta") return "pill pill-danger";
  if (stato === "in_scadenza") return "pill pill-warn";
  if (stato === "ok") return "pill pill-ok";
  return "pill pill-neutral";
}

function pillLabelForStato(stato: NextScadenzaStato): string {
  const labels: Record<NextScadenzaStato, string> = {
    scaduta: "Scaduta",
    in_scadenza: "In scadenza",
    ok: "OK",
    data_mancante: "Dati mancanti",
    valore_non_disponibile: "Da verificare",
  };
  return labels[stato];
}

// Stato di un collaudo (revisione) coerente col mockup, SENZA toccare la logica del dominio.
function statoCollaudo(item: D10RevisionItem): NextScadenzaStato {
  if (item.giorni === null) return "data_mancante";
  if (item.giorni < 0) return "scaduta";
  if (item.giorni <= 30) return "in_scadenza";
  return "ok";
}

function formatNumIt(value: number | null | undefined): string {
  return value == null ? "—" : Number(value).toLocaleString("it-IT");
}

// Colonna "Prossima": solo data/valore della componente (per la vista tabellare).
function formatProssima(componente: NextScadenzaComponente): string {
  if (componente.base === "tempo") {
    return componente.prossimaData ? toDisplay(componente.prossimaData) : "—";
  }
  if (componente.base === "km") {
    if (componente.stato === "data_mancante") return "km non impostati";
    return componente.prossimoValore != null ? `${formatNumIt(componente.prossimoValore)} km` : "—";
  }
  if (componente.stato === "data_mancante") return "ore non impostate";
  return componente.prossimoValore != null ? `${formatNumIt(componente.prossimoValore)} h` : "—";
}

// Colonna "Quando": tempo residuo / scaduto della componente (per la vista tabellare).
function formatQuando(componente: NextScadenzaComponente): string {
  if (componente.base === "tempo") {
    return componente.giorni != null ? formatGiorniLabel(componente.giorni) : "—";
  }
  if (componente.base === "km") {
    if (componente.stato === "valore_non_disponibile") return "km sconosciuti";
    if (componente.residuo == null) return "—";
    return componente.residuo < 0
      ? `oltre di ${formatNumIt(-componente.residuo)} km`
      : `residuo ${formatNumIt(componente.residuo)} km`;
  }
  return "ore non disponibili";
}

// Testo descrittivo di una componente manutenzione (replica fedele del mockup).
function formatComponenteTesto(componente: NextScadenzaComponente): string {
  if (componente.base === "tempo") {
    return componente.prossimaData
      ? `${toDisplay(componente.prossimaData)} · ${formatGiorniLabel(componente.giorni)}`
      : "data non impostata";
  }
  if (componente.base === "km") {
    if (componente.stato === "data_mancante") return "km non impostati";
    if (componente.stato === "valore_non_disponibile") return "km corrente sconosciuto";
    const residuo = componente.residuo ?? 0;
    return `${formatNumIt(componente.prossimoValore)} km · ${
      residuo < 0 ? "oltre di " + formatNumIt(-residuo) : "residuo " + formatNumIt(residuo)
    } km`;
  }
  if (componente.stato === "data_mancante") return "ore non impostate";
  return `${formatNumIt(componente.prossimoValore)} h · ore correnti non disponibili`;
}

// Stato del form "nuova/modifica scadenza" (il menu regola).
type ManutFormState = {
  editingId: string | null;
  targa: string;
  tipo: string;
  label: string;
  base: ScadenzaBase[];
  intervalloMesi: string;
  ultimaEsecuzioneData: string;
  prossimaScadenzaDataManuale: string;
  intervalloKm: string;
  ultimaEsecuzioneKm: string;
  prossimaScadenzaKmManuale: string;
  intervalloOre: string;
  ultimaEsecuzioneOre: string;
  note: string;
};

const TIPI_SCADENZA: { value: string; label: string }[] = [
  { value: "cronotachigrafo", label: "Cronotachigrafo" },
  { value: "tagliando_mezzo", label: "Tagliando mezzo" },
  { value: "tagliando_compressore", label: "Tagliando compressore" },
  { value: "estintore", label: "Estintore" },
  { value: "altro", label: "Altro…" },
];

function emptyManutForm(): ManutFormState {
  return {
    editingId: null,
    targa: "",
    tipo: "cronotachigrafo",
    label: "Cronotachigrafo",
    base: ["tempo"],
    intervalloMesi: "",
    ultimaEsecuzioneData: "",
    prossimaScadenzaDataManuale: "",
    intervalloKm: "",
    ultimaEsecuzioneKm: "",
    prossimaScadenzaKmManuale: "",
    intervalloOre: "",
    ultimaEsecuzioneOre: "",
    note: "",
  };
}

function numOrNull(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function NextScadenzeCollaudiPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const operationPanelRef = useRef<HTMLElement | null>(null);

  const [snapshot, setSnapshot] = useState<D10Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [operation, setOperation] = useState<Operation | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [officine, setOfficine] = useState<NextOfficinaReadOnlyItem[]>([]);
  const [officineOpen, setOfficineOpen] = useState(false);

  // Manutenzioni in scadenza (Fase A) + km correnti per targa.
  const [manutSnapshot, setManutSnapshot] = useState<NextManutenzioniScadenzeSnapshot | null>(null);
  const [kmByTarga, setKmByTarga] = useState<Map<string, number>>(new Map());
  // Filtri della nuova vista: settore, riquadro KPI, ricerca targa.
  const [filtroSettore, setFiltroSettore] = useState<string>("tutte");
  const [kpiFiltro, setKpiFiltro] = useState<{ ambito: "collaudo" | "manutenzione"; stato: NextScadenzaStato } | null>(null);
  const [queryTarga, setQueryTarga] = useState<string>(() => readTargaFromSearch(location.search));
  // Modal "nuova/modifica scadenza" (il menu regola).
  const [manutForm, setManutForm] = useState<ManutFormState | null>(null);
  const [manutSubmitting, setManutSubmitting] = useState(false);
  // Mini-form "Segna eseguita": registra l'esecuzione di una scadenza e
  // lascia che la prossima venga ricalcolata da ultima esecuzione + intervallo.
  const [eseguitaForm, setEseguitaForm] = useState<{
    item: NextManutenzioneScadenzaItem;
    data: string;
    km: string;
    ore: string;
  } | null>(null);
  const [eseguitaSubmitting, setEseguitaSubmitting] = useState(false);
  const [pdfPanelOpen, setPdfPanelOpen] = useState(false);
  const [pdfCategoria, setPdfCategoria] = useState<ScadenzePdfCategoryFilter>("tutte");
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState("scadenze-flotta.pdf");
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState("Anteprima PDF scadenze");
  const [pdfShareHint, setPdfShareHint] = useState<string | null>(null);

  const loadSnapshot = async () => {
    setLoading(true);
    try {
      const [nextSnapshot, manut, km] = await Promise.all([
        readNextCentroControlloSnapshot(Date.now()),
        readNextManutenzioniScadenzeSnapshot(Date.now()),
        readKmCorrentiByTarga(),
      ]);
      setSnapshot(nextSnapshot);
      setManutSnapshot(manut);
      setKmByTarga(km);
    } catch {
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [nextSnapshot, manut, km] = await Promise.all([
          readNextCentroControlloSnapshot(Date.now()),
          readNextManutenzioniScadenzeSnapshot(Date.now()),
          readKmCorrentiByTarga(),
        ]);
        if (!active) return;
        setSnapshot(nextSnapshot);
        setManutSnapshot(manut);
        setKmByTarga(km);
      } catch {
        if (!active) return;
        setSnapshot(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const officineSnapshot = await readNextOfficineSnapshot({ includeCloneOverlays: false });
        if (active) setOfficine(officineSnapshot.items);
      } catch {
        if (active) setOfficine([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && operation) {
        setOperation(null);
        setFeedback(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [operation]);

  useEffect(() => {
    if (!operation) return;
    window.requestAnimationFrame(() => {
      operationPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [operation]);

  useEffect(() => {
    return () => {
      revokePdfPreviewUrl(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const filteredOfficine = useMemo(() => {
    if (!operation || operation.kind !== "pre-collaudo") return [];
    return filterOfficine(officine, operation.form.officina);
  }, [officine, operation]);

  const openOperation = (nextOperation: Operation) => {
    setOperation(nextOperation);
    setFeedback(null);
    setOfficineOpen(nextOperation.kind === "pre-collaudo");
  };

  const closeOperation = () => {
    setOperation(null);
    setFeedback(null);
    setOfficineOpen(false);
  };

  const showValidationError = (text: string) => {
    setFeedback({ tone: "danger", text });
  };

  const showSuccess = (text: string) => {
    setFeedback({ tone: "success", text });
  };

  const handlePrenotazioneSubmit = async () => {
    if (!operation || operation.kind !== "prenotazione") return;
    const dataInput = operation.form.data.trim();
    if (!dataInput) {
      showValidationError("Inserisci la data della prenotazione collaudo.");
      return;
    }
    const normalizedData = normalizeDateForStorage(dataInput);
    if (!normalizedData) {
      showValidationError("Data non valida. Usa formato GG/MM/AAAA.");
      return;
    }
    const ora = sanitizeBookingTime(operation.form.ora);
    if (ora === null) {
      showValidationError("Ora non valida. Usa formato HH:mm.");
      return;
    }
    const targa = operation.item.targa;
    if (!targa) {
      showValidationError("Targa mancante per il mezzo selezionato.");
      return;
    }
    const luogo = operation.form.luogo.trim();
    const note = operation.form.note.trim();
    setSubmitting(true);
    try {
      await setPrenotazioneCollaudo(targa, {
        data: normalizedData,
        ora,
        ...(luogo ? { luogo } : {}),
        ...(note ? { note } : {}),
      });
      await loadSnapshot();
      setOperation(null);
      showSuccess("Prenotazione collaudo salvata.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore durante il salvataggio.";
      showValidationError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreCollaudoSubmit = async () => {
    if (!operation || operation.kind !== "pre-collaudo") return;
    const dataInput = operation.form.data.trim();
    if (!dataInput) {
      showValidationError("Inserisci la data del pre-collaudo.");
      return;
    }
    const normalizedData = normalizeDateForStorage(dataInput);
    if (!normalizedData) {
      showValidationError("Data non valida. Usa formato GG/MM/AAAA.");
      return;
    }
    const officina = operation.form.officina.trim();
    if (!officina) {
      showValidationError("Inserisci l'officina del pre-collaudo.");
      return;
    }
    const targa = operation.item.targa;
    if (!targa) {
      showValidationError("Targa mancante per il mezzo selezionato.");
      return;
    }
    const lavoriPrevisti = operation.form.lavoriPrevisti.trim();
    setSubmitting(true);
    try {
      await setPreCollaudo(targa, {
        data: normalizedData,
        officina,
        ...(lavoriPrevisti ? { lavoriPrevisti } : {}),
      });
      await loadSnapshot();
      setOperation(null);
      showSuccess("Pre-collaudo salvato.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore durante il salvataggio.";
      showValidationError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevisioneSubmit = async () => {
    if (!operation || operation.kind !== "revisione") return;
    const dataInput = operation.form.data.trim();
    if (!dataInput) {
      showValidationError("Inserisci la data della revisione.");
      return;
    }
    const normalizedData = normalizeDateForStorage(dataInput);
    if (!normalizedData) {
      showValidationError("Data non valida. Usa formato GG/MM/AAAA.");
      return;
    }
    const esito = operation.form.esito.trim();
    if (!esito) {
      showValidationError("Inserisci l'esito della revisione.");
      return;
    }
    const targa = operation.item.targa;
    if (!targa) {
      showValidationError("Targa mancante per il mezzo selezionato.");
      return;
    }
    const note = operation.form.note.trim();
    setSubmitting(true);
    try {
      await markRevisioneCompletata(targa, {
        data: normalizedData,
        esito,
        ...(note ? { note } : {}),
      });
      await loadSnapshot();
      setOperation(null);
      showSuccess("Revisione registrata.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore durante il salvataggio.";
      showValidationError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePrenotazioneSubmit = async () => {
    if (!operation || operation.kind !== "cancella-prenotazione") return;
    const targa = operation.item.targa;
    if (!targa) {
      showValidationError("Targa mancante per il mezzo selezionato.");
      return;
    }
    setSubmitting(true);
    try {
      await setPrenotazioneCollaudo(targa, null);
      await loadSnapshot();
      setOperation(null);
      showSuccess("Prenotazione collaudo cancellata.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore durante la cancellazione.";
      showValidationError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ————— Modal "nuova/modifica scadenza" (menu regola) —————
  const openNuovaManut = () => {
    const form = emptyManutForm();
    if (queryTarga) form.targa = queryTarga;
    setManutForm(form);
  };

  const openModificaManut = (item: NextManutenzioneScadenzaItem) => {
    const record = item.record;
    setManutForm({
      editingId: record.id,
      targa: record.targa,
      tipo: TIPI_SCADENZA.some((entry) => entry.value === record.tipo) ? record.tipo : "altro",
      label: record.label,
      base: record.base.length ? [...record.base] : ["tempo"],
      intervalloMesi: record.intervalloMesi != null ? String(record.intervalloMesi) : "",
      ultimaEsecuzioneData: record.ultimaEsecuzioneData ? toDisplay(record.ultimaEsecuzioneData) : "",
      prossimaScadenzaDataManuale: record.prossimaScadenzaDataManuale ? toDisplay(record.prossimaScadenzaDataManuale) : "",
      intervalloKm: record.intervalloKm != null ? String(record.intervalloKm) : "",
      ultimaEsecuzioneKm: record.ultimaEsecuzioneKm != null ? String(record.ultimaEsecuzioneKm) : "",
      prossimaScadenzaKmManuale: record.prossimaScadenzaKmManuale != null ? String(record.prossimaScadenzaKmManuale) : "",
      intervalloOre: record.intervalloOre != null ? String(record.intervalloOre) : "",
      ultimaEsecuzioneOre: record.ultimaEsecuzioneOre != null ? String(record.ultimaEsecuzioneOre) : "",
      note: record.note ?? "",
    });
  };

  const closeManut = () => setManutForm(null);

  const patchManut = (patch: Partial<ManutFormState>) =>
    setManutForm((current) => (current ? { ...current, ...patch } : current));

  const toggleBaseManut = (base: ScadenzaBase) =>
    setManutForm((current) => {
      if (!current) return current;
      const has = current.base.includes(base);
      const next = has ? current.base.filter((entry) => entry !== base) : [...current.base, base];
      return { ...current, base: next };
    });

  const handleManutTipoChange = (tipo: string) => {
    const found = TIPI_SCADENZA.find((entry) => entry.value === tipo);
    patchManut({ tipo, label: tipo === "altro" ? "" : found?.label ?? "" });
  };

  const salvaManut = async () => {
    if (!manutForm) return;
    if (manutForm.base.length === 0) {
      showValidationError("Seleziona almeno una base (tempo, km o ore).");
      return;
    }
    setManutSubmitting(true);
    try {
      await saveScadenzaManutenzione({
        id: manutForm.editingId,
        targa: manutForm.targa,
        tipo: manutForm.tipo,
        label: manutForm.label,
        base: manutForm.base,
        intervalloMesi: numOrNull(manutForm.intervalloMesi),
        ultimaEsecuzioneData: manutForm.ultimaEsecuzioneData || null,
        prossimaScadenzaDataManuale: manutForm.prossimaScadenzaDataManuale || null,
        intervalloKm: numOrNull(manutForm.intervalloKm),
        ultimaEsecuzioneKm: numOrNull(manutForm.ultimaEsecuzioneKm),
        prossimaScadenzaKmManuale: numOrNull(manutForm.prossimaScadenzaKmManuale),
        intervalloOre: numOrNull(manutForm.intervalloOre),
        ultimaEsecuzioneOre: numOrNull(manutForm.ultimaEsecuzioneOre),
        note: manutForm.note || null,
      });
      setManutForm(null);
      await loadSnapshot();
      showSuccess("Scadenza salvata.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore durante il salvataggio.";
      showValidationError(message);
    } finally {
      setManutSubmitting(false);
    }
  };

  const eliminaManut = async (item: NextManutenzioneScadenzaItem) => {
    if (!window.confirm(`Eliminare la scadenza "${item.label}" di ${item.targa}?`)) return;
    try {
      await deleteScadenzaManutenzione(item.id);
      await loadSnapshot();
      showSuccess("Scadenza eliminata.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore durante l'eliminazione.";
      showValidationError(message);
    }
  };

  // ————— "Segna eseguita": registra l'esecuzione e ricalcola la prossima —————
  const openEseguita = (item: NextManutenzioneScadenzaItem) => {
    const kmCorrente = kmByTarga.get(normTarga(item.targa)) ?? null;
    setEseguitaForm({
      item,
      // Data odierna proposta come comodità: è un campo modificabile che
      // l'utente conferma (la data salvata viene dall'input, non da Date.now()).
      data: toDisplay(Date.now()),
      km: item.base.includes("km") && kmCorrente != null ? String(kmCorrente) : "",
      ore: "",
    });
  };

  const closeEseguita = () => setEseguitaForm(null);

  const salvaEseguita = async () => {
    if (!eseguitaForm) return;
    const { item, data, km, ore } = eseguitaForm;
    const rec = item.record;
    if (rec.base.includes("tempo") && !data.trim()) {
      showValidationError("Inserisci la data di esecuzione.");
      return;
    }
    setEseguitaSubmitting(true);
    try {
      await saveScadenzaManutenzione({
        id: rec.id,
        targa: rec.targa,
        tipo: rec.tipo,
        label: rec.label,
        base: rec.base,
        intervalloMesi: rec.intervalloMesi ?? null,
        intervalloKm: rec.intervalloKm ?? null,
        intervalloOre: rec.intervalloOre ?? null,
        // Aggiorno l'ultima esecuzione con i valori inseriti (solo per le basi attive).
        ultimaEsecuzioneData: rec.base.includes("tempo") ? data : rec.ultimaEsecuzioneData ?? null,
        ultimaEsecuzioneKm: rec.base.includes("km") ? numOrNull(km) : rec.ultimaEsecuzioneKm ?? null,
        ultimaEsecuzioneOre: rec.base.includes("ore") ? numOrNull(ore) : rec.ultimaEsecuzioneOre ?? null,
        // Azzero gli override manuali: la prossima scadenza si ricalcola da ultima + intervallo.
        prossimaScadenzaDataManuale: null,
        prossimaScadenzaKmManuale: null,
        prossimaScadenzaOreManuale: null,
        note: rec.note ?? null,
        attiva: rec.attiva,
      });
      setEseguitaForm(null);
      await loadSnapshot();
      showSuccess("Esecuzione registrata: prossima scadenza ricalcolata.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore durante il salvataggio.";
      showValidationError(message);
    } finally {
      setEseguitaSubmitting(false);
    }
  };

  const renderFeedback = () =>
    feedback ? (
      <div className={`next-shell__scadenze-feedback next-shell__scadenze-feedback--${feedback.tone}`}>
        {feedback.text}
      </div>
    ) : null;

  const renderFieldLabel = (label: string, optional = false) => (
    <span className="next-shell__scadenze-field-label">
      {label}
      {optional ? <span> (opzionale)</span> : null}
    </span>
  );

  const renderOperationPanel = (itemId: string) => {
    if (!operation || operation.item.id !== itemId) return null;
    const targa = operation.item.targa || "-";

    if (operation.kind === "prenotazione") {
      return (
        <section className="next-shell__scadenze-operation" ref={operationPanelRef}>
          <div className="next-shell__scadenze-operation-head">
            <div className="next-shell__scadenze-operation-title">
              {operation.variant === "edit" ? "Modifica prenotazione" : "Prenota collaudo"}{" "}
              <span>-</span> {targa}
            </div>
            <button type="button" className="next-shell__scadenze-operation-cancel" onClick={closeOperation}>
              Annulla
            </button>
          </div>
          <div className="next-shell__scadenze-form-grid">
            <label className="next-shell__scadenze-field">
              {renderFieldLabel("Data prenotazione")}
              <input
                className="next-shell__scadenze-input"
                type="text"
                inputMode="numeric"
                placeholder="GG/MM/AAAA"
                value={operation.form.data}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "prenotazione"
                      ? { ...current, form: { ...current.form, data: value } }
                      : current,
                  );
                }}
              />
            </label>
            <label className="next-shell__scadenze-field">
              {renderFieldLabel("Ora", true)}
              <input
                className="next-shell__scadenze-input"
                type="time"
                value={operation.form.ora}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "prenotazione"
                      ? { ...current, form: { ...current.form, ora: value } }
                      : current,
                  );
                }}
              />
            </label>
            <label className="next-shell__scadenze-field">
              {renderFieldLabel("Luogo", true)}
              <input
                className="next-shell__scadenze-input"
                value={operation.form.luogo}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "prenotazione"
                      ? { ...current, form: { ...current.form, luogo: value } }
                      : current,
                  );
                }}
                placeholder="es. Officina Rossi, Lugano"
              />
            </label>
            <label className="next-shell__scadenze-field next-shell__scadenze-field--wide">
              {renderFieldLabel("Note", true)}
              <textarea
                className="next-shell__scadenze-textarea"
                value={operation.form.note}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "prenotazione"
                      ? { ...current, form: { ...current.form, note: value } }
                      : current,
                  );
                }}
              />
            </label>
          </div>
          {renderFeedback()}
          <div className="next-shell__scadenze-form-actions">
            <button
              type="button"
              className="next-shell__scadenze-action"
              onClick={closeOperation}
              disabled={submitting}
            >
              Annulla
            </button>
            <button
              type="button"
              className="next-shell__scadenze-action next-shell__scadenze-action--primary"
              onClick={() => void handlePrenotazioneSubmit()}
              disabled={submitting}
            >
              {submitting ? "Salvataggio..." : "Salva prenotazione"}
            </button>
          </div>
        </section>
      );
    }

    if (operation.kind === "pre-collaudo") {
      return (
        <section className="next-shell__scadenze-operation" ref={operationPanelRef}>
          <div className="next-shell__scadenze-operation-head">
            <div className="next-shell__scadenze-operation-title">
              Pre-collaudo <span>-</span> {targa}
            </div>
            <button type="button" className="next-shell__scadenze-operation-cancel" onClick={closeOperation}>
              Annulla
            </button>
          </div>
          <div className="next-shell__scadenze-form-grid">
            <label className="next-shell__scadenze-field">
              {renderFieldLabel("Data pre-collaudo")}
              <input
                className="next-shell__scadenze-input"
                type="text"
                inputMode="numeric"
                placeholder="GG/MM/AAAA"
                value={operation.form.data}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "pre-collaudo"
                      ? { ...current, form: { ...current.form, data: value } }
                      : current,
                  );
                }}
              />
            </label>
            <label className="next-shell__scadenze-field next-shell__scadenze-autocomplete">
              {renderFieldLabel("Officina")}
              <input
                className="next-shell__scadenze-input"
                value={operation.form.officina}
                onFocus={() => setOfficineOpen(true)}
                onBlur={() => setOfficineOpen(false)}
                onChange={(event) => {
                  const value = event.target.value;
                  setOfficineOpen(true);
                  setOperation((current) =>
                    current && current.kind === "pre-collaudo"
                      ? { ...current, form: { ...current.form, officina: value } }
                      : current,
                  );
                }}
                placeholder="Digita o seleziona un'officina"
                autoComplete="off"
              />
              {officineOpen && officine.length > 0 && filteredOfficine.length > 0 ? (
                <div className="next-shell__scadenze-autocomplete-menu">
                  {filteredOfficine.map((officina) => (
                    <button
                      key={officina.id}
                      type="button"
                      className="next-shell__scadenze-autocomplete-option"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setOperation((current) =>
                          current && current.kind === "pre-collaudo"
                            ? { ...current, form: { ...current.form, officina: officina.nome } }
                            : current,
                        );
                        setOfficineOpen(false);
                      }}
                    >
                      <span>{officina.nome}</span>
                      {formatOfficinaMeta(officina) ? <small>{formatOfficinaMeta(officina)}</small> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </label>
            <label className="next-shell__scadenze-field next-shell__scadenze-field--wide">
              {renderFieldLabel("Lavori previsti", true)}
              <textarea
                className="next-shell__scadenze-textarea next-shell__scadenze-textarea--short"
                value={operation.form.lavoriPrevisti}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "pre-collaudo"
                      ? { ...current, form: { ...current.form, lavoriPrevisti: value } }
                      : current,
                  );
                }}
                placeholder="es. prova freni, preparazione collaudo, controllo luci"
              />
            </label>
          </div>
          {renderFeedback()}
          <div className="next-shell__scadenze-form-actions">
            <button
              type="button"
              className="next-shell__scadenze-action"
              onClick={closeOperation}
              disabled={submitting}
            >
              Annulla
            </button>
            <button
              type="button"
              className="next-shell__scadenze-action next-shell__scadenze-action--primary"
              onClick={() => void handlePreCollaudoSubmit()}
              disabled={submitting}
            >
              {submitting ? "Salvataggio..." : "Salva pre-collaudo"}
            </button>
          </div>
        </section>
      );
    }

    if (operation.kind === "revisione") {
      return (
        <section className="next-shell__scadenze-operation" ref={operationPanelRef}>
          <div className="next-shell__scadenze-operation-head">
            <div className="next-shell__scadenze-operation-title">
              Segna revisione fatta <span>-</span> {targa}
            </div>
            <button type="button" className="next-shell__scadenze-operation-cancel" onClick={closeOperation}>
              Annulla
            </button>
          </div>
          <div className="next-shell__scadenze-form-grid">
            <label className="next-shell__scadenze-field">
              {renderFieldLabel("Data revisione")}
              <input
                className="next-shell__scadenze-input"
                type="text"
                inputMode="numeric"
                placeholder="GG/MM/AAAA"
                value={operation.form.data}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "revisione"
                      ? { ...current, form: { ...current.form, data: value } }
                      : current,
                  );
                }}
              />
            </label>
            <label className="next-shell__scadenze-field">
              {renderFieldLabel("Esito")}
              <input
                className="next-shell__scadenze-input"
                value={operation.form.esito}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "revisione"
                      ? { ...current, form: { ...current.form, esito: value } }
                      : current,
                  );
                }}
                placeholder="es. Superata"
              />
            </label>
            <label className="next-shell__scadenze-field next-shell__scadenze-field--wide">
              {renderFieldLabel("Note", true)}
              <textarea
                className="next-shell__scadenze-textarea"
                value={operation.form.note}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "revisione"
                      ? { ...current, form: { ...current.form, note: value } }
                      : current,
                  );
                }}
              />
            </label>
          </div>
          {renderFeedback()}
          <div className="next-shell__scadenze-form-actions">
            <button
              type="button"
              className="next-shell__scadenze-action"
              onClick={closeOperation}
              disabled={submitting}
            >
              Annulla
            </button>
            <button
              type="button"
              className="next-shell__scadenze-action next-shell__scadenze-action--primary"
              onClick={() => void handleRevisioneSubmit()}
              disabled={submitting}
            >
              {submitting ? "Salvataggio..." : "Salva revisione"}
            </button>
          </div>
        </section>
      );
    }

    return (
      <section
        className="next-shell__scadenze-operation next-shell__scadenze-operation--danger"
        ref={operationPanelRef}
      >
        <div className="next-shell__scadenze-operation-head">
          <div>
            <div className="next-shell__scadenze-operation-title">
              Cancellare la prenotazione collaudo?
            </div>
            <div className="next-shell__scadenze-operation-subtitle">
              Mezzo {targa} - prenotazione del {formatEditableDate(operation.prenotazione.data) || "-"}
            </div>
          </div>
        </div>
        {renderFeedback()}
        <div className="next-shell__scadenze-form-actions">
          <button
            type="button"
            className="next-shell__scadenze-action"
            onClick={closeOperation}
            disabled={submitting}
          >
            Annulla
          </button>
          <button
            type="button"
            className="next-shell__scadenze-action next-shell__scadenze-action--danger-fill"
            onClick={() => void handleDeletePrenotazioneSubmit()}
            disabled={submitting}
          >
            {submitting ? "Cancellazione..." : "Conferma cancellazione"}
          </button>
        </div>
      </section>
    );
  };

  // ————— Costruzione voci unificate (collaudi + manutenzioni) —————
  const revisioni: D10RevisionItem[] = snapshot?.revisioni ?? [];
  const manutItems: NextManutenzioneScadenzaItem[] = manutSnapshot?.items ?? [];
  const normTarga = (value: string | null | undefined): string =>
    String(value ?? "").trim().toUpperCase().replace(/\s+/g, "");

  // Mappe per mini-dossier e ricerca per autista (dati reali già nello snapshot).
  const mezzi: D10MezzoItem[] = snapshot?.mezzi ?? [];
  const sessioni: D10SessionItem[] = snapshot?.sessioni ?? [];
  const mezzoByTarga = new Map<string, D10MezzoItem>();
  mezzi.forEach((mezzo) => {
    if (mezzo.targa) mezzoByTarga.set(normTarga(mezzo.targa), mezzo);
  });
  const sessioneByTarga = new Map<string, D10SessionItem>();
  sessioni.forEach((sessione) => {
    if (sessione.targaMotrice) sessioneByTarga.set(normTarga(sessione.targaMotrice), sessione);
    if (sessione.targaRimorchio) sessioneByTarga.set(normTarga(sessione.targaRimorchio), sessione);
  });

  // Una targa è "trovata" se la query è contenuta nella targa oppure nel nome/badge
  // dell'autista che ha quel mezzo in sessione adesso.
  const matchTargaOrAutista = (targa: string): boolean => {
    if (normTarga(targa).includes(qNorm)) return true;
    const qUp = queryTarga.trim().toUpperCase();
    if (!qUp) return false;
    const sessione = sessioneByTarga.get(normTarga(targa));
    const autista = (sessione?.nomeAutista ?? "").toUpperCase();
    const badge = (sessione?.badgeAutista ?? "").toUpperCase();
    return autista.includes(qUp) || badge.includes(qUp);
  };

  // Targa con mini-dossier al passaggio del mouse (foto, categoria, sessione attiva).
  const renderTarga = (targa: string | null) => {
    const key = normTarga(targa);
    const mezzo = mezzoByTarga.get(key) ?? null;
    const sessione = sessioneByTarga.get(key) ?? null;
    const mezzoLabel = [mezzo?.marca, mezzo?.modello].filter(Boolean).join(" ");
    return (
      <div className="tgwrap">
        <div className="tg" onClick={() => targa && navigate(buildNextDossierPath(targa))}>
          {targa || "—"}
        </div>
        {targa && (mezzo || sessione) ? (
          <div className="tg-dossier" role="tooltip">
            {mezzo?.fotoUrl ? (
              <div className="tg-photo">
                <img src={mezzo.fotoUrl} alt={targa} loading="lazy" />
              </div>
            ) : (
              <div className="tg-photo tg-photo--empty">nessuna foto</div>
            )}
            <div className="tg-info">
              <div className="tg-title">{targa}</div>
              {mezzo?.categoria ? (
                <div className="tg-row">Categoria: <b>{mezzo.categoria}</b></div>
              ) : null}
              {mezzoLabel ? <div className="tg-row">{mezzoLabel}</div> : null}
              {sessione?.nomeAutista ? (
                <div className="tg-row">
                  In sessione: <b>{sessione.nomeAutista}</b>
                  {sessione.badgeAutista ? ` (${sessione.badgeAutista})` : ""}
                </div>
              ) : (
                <div className="tg-row tg-muted">Nessuna sessione attiva</div>
              )}
              {sessione?.statoSessione ? <div className="tg-row tg-muted">{sessione.statoSessione}</div> : null}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const targheDisponibili = Array.from(
    new Set(revisioni.map((item) => item.targa).filter((targa): targa is string => Boolean(targa))),
  ).sort((left, right) => left.localeCompare(right, "it"));

  type Voce =
    | { kind: "collaudo"; settore: SettorePagina; targa: string; stato: NextScadenzaStato; sev: number; sort: number; collaudo: D10RevisionItem }
    | { kind: "manutenzione"; settore: SettorePagina; targa: string; stato: NextScadenzaStato; sev: number; sort: number; manut: NextManutenzioneScadenzaItem };

  const settoreCollaudi: SettorePagina = { key: SETTORE_COLLAUDI_KEY, label: "Collaudi", icon: ICONA_COLLAUDI };
  const vociCollaudo: Voce[] = revisioni.map((item) => {
    // Coerente col dominio (nextCentroControlloDomain.ts:1310): un collaudo già
    // completato non è scaduto/in scadenza, anche se la data legacy non è aggiornata.
    const stato: NextScadenzaStato = item.prenotazioneCollaudo?.completata === true ? "ok" : statoCollaudo(item);
    return { kind: "collaudo", settore: settoreCollaudi, targa: item.targa ?? "", stato, sev: STATO_SEVERITA[stato], sort: item.giorni ?? 1_000_000, collaudo: item };
  });
  const vociManut: Voce[] = manutItems.map((item) => ({
    kind: "manutenzione",
    settore: settoreDiManutenzione(item.tipo, item.label),
    targa: item.targa,
    stato: item.stato,
    sev: STATO_SEVERITA[item.stato],
    sort: item.giorniMin ?? 1_000_000,
    manut: item,
  }));
  const tutteVoci = [...vociManut, ...vociCollaudo];

  // Settori presenti nei dati (per tab, sezioni, select PDF), ordinati.
  const settoriPresenti: SettorePagina[] = (() => {
    const map = new Map<string, SettorePagina>();
    for (const voce of tutteVoci) {
      if (!map.has(voce.settore.key)) map.set(voce.settore.key, voce.settore);
    }
    return [...map.values()].sort(
      (a, b) => ordinePaginaSettore(a.key) - ordinePaginaSettore(b.key) || a.label.localeCompare(b.label, "it"),
    );
  })();

  const colScadute = vociCollaudo.filter((v) => v.stato === "scaduta").length;
  const colProx = vociCollaudo.filter((v) => v.stato === "in_scadenza").length;
  const manScadute = vociManut.filter((v) => v.stato === "scaduta").length;
  const manProx = vociManut.filter((v) => v.stato === "in_scadenza").length;

  const visVoci = kpiFiltro
    ? tutteVoci.filter((v) => v.kind === kpiFiltro.ambito && v.stato === kpiFiltro.stato)
    : tutteVoci;
  const qNorm = normTarga(queryTarga);

  const toggleKpi = (ambito: "collaudo" | "manutenzione", stato: NextScadenzaStato) => {
    setKpiFiltro((current) => (current && current.ambito === ambito && current.stato === stato ? null : { ambito, stato }));
    setFiltroSettore("tutte");
  };
  const selezionaSettore = (key: string) => {
    setFiltroSettore(key);
    setKpiFiltro(null);
  };

  const catCount = (key: string) => visVoci.filter((v) => v.settore.key === key).length;
  const ordina = (voci: Voce[]) => [...voci].sort((a, b) => b.sev - a.sev || a.sort - b.sort);

  // Label di un settore/filtro PDF (incluse le categorie personalizzate presenti).
  const getCategoriaLabel = (key: string): string => {
    if (key === "tutte") return "Tutte";
    return settoriPresenti.find((settore) => settore.key === key)?.label ?? key;
  };

  const getMezzoSessioneLabels = (targa: string) => {
    const key = normTarga(targa);
    const mezzo = mezzoByTarga.get(key) ?? null;
    const sessione = sessioneByTarga.get(key) ?? null;
    return {
      mezzoLabel: [mezzo?.marca, mezzo?.modello].filter(Boolean).join(" "),
      autistaLabel: sessione?.nomeAutista ?? mezzo?.autistaNome ?? "",
    };
  };

  const buildPdfRow = (voce: Voce): ScadenzePdfRow => {
    if (voce.kind === "collaudo") {
      const item = voce.collaudo;
      const targa = item.targa ?? "";
      const prenotazione = item.prenotazioneCollaudo;
      const preCollaudo = item.preCollaudo;
      const completata = prenotazione?.completata === true;
      const stato: NextScadenzaStato = completata ? "ok" : statoCollaudo(item);
      const mezzoLabel = [item.marca, item.modello].filter(Boolean).join(" ");
      const lavori = getPreCollaudoLavori(preCollaudo);
      const labels = getMezzoSessioneLabels(targa);
      return {
        id: `collaudo-${item.id}`,
        categoria: voce.settore.key,
        categoriaLabel: voce.settore.label,
        targa,
        mezzoLabel: mezzoLabel || labels.mezzoLabel,
        autistaLabel: item.autistaNome ?? labels.autistaLabel,
        tipoLabel: "Collaudo",
        stato,
        statoLabel: completata ? "Completato" : pillLabelForStato(stato),
        scadenzaLabel: completata
          ? formatPrenotazioneSummary(prenotazione)
          : `${formatDateLabel(item.scadenzaTs)} - ${formatGiorniLabel(item.giorni)}`,
        dettaglioLabel: "",
        prenotazioneLabel: prenotazione ? formatPrenotazioneSummary(prenotazione) : "non prenotato",
        preCollaudoLabel: preCollaudo
          ? `pre-collaudo ${formatPreCollaudoSummary(preCollaudo)}${lavori ? ` - ${lavori}` : ""}`
          : "",
        note: item.flags.length ? item.flags.join(", ") : "",
        sortSeverity: STATO_SEVERITA[stato],
        sortValue: item.giorni ?? 1_000_000,
      };
    }

    const item = voce.manut;
    const labels = getMezzoSessioneLabels(item.targa);
    return {
      id: `manutenzione-${item.id}`,
      categoria: voce.settore.key,
      categoriaLabel: voce.settore.label,
      targa: item.targa,
      mezzoLabel: labels.mezzoLabel,
      autistaLabel: labels.autistaLabel,
      tipoLabel: item.label,
      stato: item.stato,
      statoLabel: pillLabelForStato(item.stato),
      scadenzaLabel: item.componenti.map(formatComponenteTesto).join(" | "),
      dettaglioLabel: item.base.length ? `Base: ${item.base.join(", ")}` : "",
      prenotazioneLabel: "",
      preCollaudoLabel: "",
      note: item.note ?? "",
      sortSeverity: STATO_SEVERITA[item.stato],
      sortValue: item.giorniMin ?? 1_000_000,
    };
  };

  const pdfBaseVoci = visVoci.filter((voce) => !qNorm || matchTargaOrAutista(voce.targa));
  const pdfRows = pdfBaseVoci.map(buildPdfRow);
  const pdfRowsSelezionate = filterScadenzePdfRows(pdfRows, pdfCategoria);

  const buildPdfFiltersLabel = () => {
    const parts: string[] = [];
    if (kpiFiltro) parts.push(`${kpiFiltro.ambito === "collaudo" ? "collaudi" : "manutenzioni"} ${pillLabelForStato(kpiFiltro.stato).toLowerCase()}`);
    if (queryTarga.trim()) parts.push(`ricerca ${queryTarga.trim()}`);
    if (filtroSettore !== "tutte") parts.push(`vista ${getCategoriaLabel(filtroSettore)}`);
    parts.push(`export ${getCategoriaLabel(pdfCategoria)}`);
    return parts.join(" - ");
  };

  const openPdfPanel = () => {
    setPdfCategoria(filtroSettore === "tutte" ? "tutte" : filtroSettore);
    setPdfPanelOpen(true);
    setPdfShareHint(null);
  };

  const ensurePdfPreviewReady = async () => {
    if (pdfRowsSelezionate.length === 0) {
      window.alert("Nessuna scadenza nel perimetro PDF selezionato.");
      return null;
    }
    setPdfGenerating(true);
    try {
      const preview = await openPreview({
        source: async () =>
          generateScadenzePdfBlob({
            rows: pdfRows,
            categoria: pdfCategoria,
            generatedAtLabel: toDisplay(Date.now()) || "",
            filtersLabel: buildPdfFiltersLabel(),
          }),
        previousUrl: pdfPreviewUrl,
      });
      setPdfPreviewBlob(preview.blob);
      setPdfPreviewFileName(preview.fileName);
      setPdfPreviewTitle(`Anteprima PDF scadenze - ${getCategoriaLabel(pdfCategoria)}`);
      setPdfPreviewUrl(preview.url);
      return preview;
    } catch (error) {
      console.error("Errore anteprima PDF scadenze:", error);
      window.alert("Impossibile generare l'anteprima PDF.");
      return null;
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleOpenPdfPreview = async () => {
    const preview = await ensurePdfPreviewReady();
    if (!preview) return;
    setPdfShareHint(null);
    setPdfPreviewOpen(true);
  };

  const buildPdfShareMessage = () =>
    buildPdfShareText({
      contextLabel: pdfPreviewTitle || "Scadenze",
      dateLabel: toDisplay(Date.now()),
      fileName: pdfPreviewFileName,
      url: pdfPreviewUrl,
    });

  const handleSharePdf = async () => {
    if (!pdfPreviewBlob) {
      setPdfShareHint("Apri prima un'anteprima PDF.");
      return;
    }
    const result = await sharePdfFile({
      blob: pdfPreviewBlob,
      fileName: pdfPreviewFileName,
      title: pdfPreviewTitle,
      text: buildPdfShareMessage(),
    });
    if (result.status === "shared") {
      setPdfShareHint("PDF condiviso.");
      return;
    }
    if (result.status === "aborted") return;
    const copied = await copyTextToClipboard(buildPdfShareMessage());
    setPdfShareHint(copied ? "Condivisione non disponibile: testo copiato." : "Condivisione non disponibile.");
  };

  const handleCopyPdfLink = async () => {
    const copied = await copyTextToClipboard(buildPdfShareMessage());
    setPdfShareHint(copied ? "Testo copiato negli appunti." : "Impossibile copiare automaticamente.");
  };

  const handleOpenWhatsAppPdf = () => {
    window.open(buildWhatsAppShareUrl(buildPdfShareMessage()), "_blank", "noopener,noreferrer");
  };

  const closePdfPreview = () => {
    setPdfPreviewOpen(false);
    setPdfPreviewBlob(null);
    setPdfShareHint(null);
    revokePdfPreviewUrl(pdfPreviewUrl);
    setPdfPreviewUrl(null);
  };

  const categoryIcon = (icon: string) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} dangerouslySetInnerHTML={{ __html: icon }} />
  );

  const renderRigaCollaudo = (item: D10RevisionItem) => {
    const prenotazione = item.prenotazioneCollaudo;
    const preCollaudo = item.preCollaudo;
    const prenCompletata = prenotazione?.completata === true;
    const stato: NextScadenzaStato = prenCompletata ? "ok" : statoCollaudo(item);
    const mezzoLabel = [item.marca, item.modello].filter(Boolean).join(" ");
    const hasPreCollaudo = Boolean(preCollaudo);
    const canOperate = Boolean(item.targa);
    return (
      <Fragment key={item.id}>
        <div className="row">
          {renderTarga(item.targa)}
          <div className="cell cell-scad">
            <div className="cell-title">Collaudo</div>
            {mezzoLabel ? <div className="cell-sub">{mezzoLabel}</div> : null}
          </div>
          <div className="cell">
            <span className={prenCompletata ? "pill pill-ok" : pillClassForStato(stato)}>
              {prenCompletata ? "Completato" : pillLabelForStato(stato)}
            </span>
          </div>
          <div className="cell cell-bases">
            <span className="chip">tempo</span>
          </div>
          <div className="cell">
            <div className="cell-data">{prenCompletata ? "—" : formatDateLabel(item.scadenzaTs)}</div>
          </div>
          <div className="cell">
            {prenCompletata ? (
              <div className="cell-when">{formatPrenotazioneSummary(prenotazione)}</div>
            ) : (
              <>
                <div className="cell-when">{formatGiorniLabel(item.giorni)}</div>
                <div className="cell-sub">
                  {prenotazione ? formatPrenotazioneSummary(prenotazione) : "non prenotato"}
                </div>
              </>
            )}
            {preCollaudo ? (
              <div className="cell-sub">pre-collaudo {formatPreCollaudoSummary(preCollaudo)}</div>
            ) : null}
          </div>
          <div className="acts">
            {canOperate ? (
              <>
                {!prenCompletata ? (
                  <button type="button" className="btn primary" onClick={() => openOperation(buildRevisioneForm(item))}>
                    Collaudo fatto
                  </button>
                ) : null}
                {prenotazione && !prenCompletata ? (
                  <>
                    <button type="button" className="btn" onClick={() => openOperation(buildPrenotazioneForm(item, "edit"))}>
                      Modifica prenotazione
                    </button>
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => openOperation(buildDeletePrenotazioneOperation(item, prenotazione))}
                    >
                      Cancella
                    </button>
                  </>
                ) : !prenotazione ? (
                  <button type="button" className="btn" onClick={() => openOperation(buildPrenotazioneForm(item, "create"))}>
                    Prenota collaudo
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn"
                  onClick={() => openOperation(buildPreCollaudoForm(item, hasPreCollaudo ? "edit" : "create"))}
                >
                  Pre-collaudo
                </button>
              </>
            ) : null}
          </div>
        </div>
        {renderOperationPanel(item.id)}
      </Fragment>
    );
  };

  const renderRigaManut = (item: NextManutenzioneScadenzaItem) => (
    <div className="row" key={item.id}>
      {renderTarga(item.targa)}
      <div className="cell cell-scad">
        <div className="cell-title">{item.label}</div>
        {item.note ? <div className="cell-sub">{item.note}</div> : null}
      </div>
      <div className="cell">
        <span className={pillClassForStato(item.stato)}>{pillLabelForStato(item.stato)}</span>
      </div>
      <div className="cell cell-bases">
        {item.base.map((base) => (
          <span className="chip" key={base}>
            {base}
          </span>
        ))}
      </div>
      <div className="cell">
        {item.componenti.map((componente, index) => (
          <div className="cell-data" key={index}>
            {formatProssima(componente)}
          </div>
        ))}
      </div>
      <div className="cell">
        {item.componenti.map((componente, index) => (
          <div className="cell-when" key={index}>
            {formatQuando(componente)}
          </div>
        ))}
      </div>
      <div className="acts">
        <button type="button" className="btn" onClick={() => openModificaManut(item)}>
          Modifica
        </button>
        <button type="button" className="btn primary" onClick={() => openEseguita(item)}>
          Segna eseguita
        </button>
        <button type="button" className="btn danger" onClick={() => void eliminaManut(item)}>
          Elimina
        </button>
      </div>
    </div>
  );

  const renderVoce = (voce: Voce) =>
    voce.kind === "collaudo" ? renderRigaCollaudo(voce.collaudo) : renderRigaManut(voce.manut);

  // Intestazione colonne della vista tabellare (stile Excel).
  const renderColonneHeader = () => (
    <div className="row-head">
      <span>Targa</span>
      <span>Scadenza</span>
      <span>Stato</span>
      <span>Base</span>
      <span>Prossima</span>
      <span>Quando</span>
      <span className="row-head-acts">Azioni</span>
    </div>
  );

  const cats = filtroSettore === "tutte" ? settoriPresenti : settoriPresenti.filter((c) => c.key === filtroSettore);

  // Anteprima stato nel modal regola.
  let previewItem: NextManutenzioneScadenzaItem | null = null;
  if (manutForm && manutForm.base.length) {
    const previewRecord: NextManutenzioneScadenzaRecord = {
      id: manutForm.editingId ?? "preview",
      targa: manutForm.targa,
      tipo: manutForm.tipo,
      label: manutForm.label || "Scadenza",
      base: manutForm.base,
      intervalloMesi: numOrNull(manutForm.intervalloMesi),
      ultimaEsecuzioneData: manutForm.ultimaEsecuzioneData || null,
      prossimaScadenzaDataManuale: manutForm.prossimaScadenzaDataManuale || null,
      intervalloKm: numOrNull(manutForm.intervalloKm),
      ultimaEsecuzioneKm: numOrNull(manutForm.ultimaEsecuzioneKm),
      prossimaScadenzaKmManuale: numOrNull(manutForm.prossimaScadenzaKmManuale),
      intervalloOre: numOrNull(manutForm.intervalloOre),
      ultimaEsecuzioneOre: numOrNull(manutForm.ultimaEsecuzioneOre),
      note: manutForm.note || null,
      attiva: true,
    };
    const km = kmByTarga.get(normTarga(manutForm.targa)) ?? null;
    previewItem = evaluateScadenzaManutenzione(previewRecord, { kmAttuali: km, oreAttuali: null }, Date.now());
  }

  // Anteprima della prossima scadenza dopo "Segna eseguita".
  let previewEseguitaItem: NextManutenzioneScadenzaItem | null = null;
  if (eseguitaForm) {
    const rec = eseguitaForm.item.record;
    const tempRecord: NextManutenzioneScadenzaRecord = {
      ...rec,
      ultimaEsecuzioneData: rec.base.includes("tempo")
        ? fromUserInput(eseguitaForm.data) ?? rec.ultimaEsecuzioneData ?? null
        : rec.ultimaEsecuzioneData ?? null,
      ultimaEsecuzioneKm: rec.base.includes("km") ? numOrNull(eseguitaForm.km) : rec.ultimaEsecuzioneKm ?? null,
      ultimaEsecuzioneOre: rec.base.includes("ore") ? numOrNull(eseguitaForm.ore) : rec.ultimaEsecuzioneOre ?? null,
      prossimaScadenzaDataManuale: null,
      prossimaScadenzaKmManuale: null,
      prossimaScadenzaOreManuale: null,
    };
    const kmEseg = kmByTarga.get(normTarga(rec.targa)) ?? null;
    previewEseguitaItem = evaluateScadenzaManutenzione(tempRecord, { kmAttuali: kmEseg, oreAttuali: null }, Date.now());
  }
  const baseAttiva = (base: ScadenzaBase) => Boolean(manutForm?.base.includes(base));
  const targheModal =
    manutForm && manutForm.targa && !targheDisponibili.includes(manutForm.targa)
      ? [manutForm.targa, ...targheDisponibili]
      : targheDisponibili;

  return (
    <div className="scd">
      <div className="pagehead">
        <div>
          <h1>Scadenze</h1>
          <div className="crumb">
            Flotta · Scadenze · per settore — oggi <b>{toDisplay(Date.now())}</b>
          </div>
        </div>
        <div className="right">
          <button type="button" className="btn" onClick={openPdfPanel}>
            Anteprima PDF
          </button>
          <button type="button" className="btn primary" onClick={openNuovaManut}>
            + Nuova scadenza
          </button>
        </div>
      </div>

      <div className="kpis">
        <div
          className={`kpi dng${kpiFiltro?.ambito === "collaudo" && kpiFiltro?.stato === "scaduta" ? " sel" : ""}`}
          onClick={() => toggleKpi("collaudo", "scaduta")}
          title="Filtra: collaudi scaduti"
        >
          <div className="k">Collaudi scaduti</div>
          <div className="v">{colScadute}</div>
        </div>
        <div
          className={`kpi wrn${kpiFiltro?.ambito === "collaudo" && kpiFiltro?.stato === "in_scadenza" ? " sel" : ""}`}
          onClick={() => toggleKpi("collaudo", "in_scadenza")}
          title="Filtra: collaudi in scadenza"
        >
          <div className="k">Collaudi in scadenza</div>
          <div className="v">{colProx}</div>
        </div>
        <div
          className={`kpi dng${kpiFiltro?.ambito === "manutenzione" && kpiFiltro?.stato === "scaduta" ? " sel" : ""}`}
          onClick={() => toggleKpi("manutenzione", "scaduta")}
          title="Filtra: manutenzioni scadute"
        >
          <div className="k">Manutenzioni scadute</div>
          <div className="v">{manScadute}</div>
        </div>
        <div
          className={`kpi wrn${kpiFiltro?.ambito === "manutenzione" && kpiFiltro?.stato === "in_scadenza" ? " sel" : ""}`}
          onClick={() => toggleKpi("manutenzione", "in_scadenza")}
          title="Filtra: manutenzioni in scadenza"
        >
          <div className="k">Manutenzioni in scadenza</div>
          <div className="v">{manProx}</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="tabbar">
          <button type="button" className={`tab${filtroSettore === "tutte" ? " active" : ""}`} onClick={() => selezionaSettore("tutte")}>
            Tutte <span className="n">{visVoci.length}</span>
          </button>
          {settoriPresenti.map((cat) => (
            <button
              key={cat.key}
              type="button"
              className={`tab${filtroSettore === cat.key ? " active" : ""}`}
              onClick={() => selezionaSettore(cat.key)}
            >
              {cat.label} <span className="n">{catCount(cat.key)}</span>
            </button>
          ))}
        </div>
        <div className="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4" />
          </svg>
          <input
            placeholder="Cerca per targa o autista…"
            value={queryTarga}
            onChange={(event) => setQueryTarga(event.target.value)}
          />
          {queryTarga ? (
            <button type="button" className="clr" onClick={() => setQueryTarga("")} title="Pulisci">
              ×
            </button>
          ) : null}
        </div>
      </div>

      {pdfPanelOpen ? (
        <div className="pdfbar">
          <div>
            <div className="pdfbar-title">Export PDF scadenze</div>
            <div className="pdfbar-sub">
              Parte dalla vista filtrata corrente. Righe pronte: <b>{pdfRowsSelezionate.length}</b>
            </div>
          </div>
          <label className="pdfbar-field">
            Categoria
            <select
              value={pdfCategoria}
              onChange={(event) => setPdfCategoria(event.target.value as ScadenzePdfCategoryFilter)}
            >
              <option value="tutte">Tutte</option>
              {settoriPresenti.map((settore) => (
                <option key={settore.key} value={settore.key}>
                  {settore.label}
                </option>
              ))}
            </select>
          </label>
          <div className="pdfbar-actions">
            <button type="button" className="btn" onClick={() => setPdfPanelOpen(false)}>
              Chiudi
            </button>
            <button type="button" className="btn primary" onClick={() => void handleOpenPdfPreview()} disabled={pdfGenerating}>
              {pdfGenerating ? "Generazione..." : "Apri anteprima"}
            </button>
          </div>
        </div>
      ) : null}

      {feedback ? renderFeedback() : null}

      {loading ? (
        <div className="card">
          <div className="empty">Caricamento scadenze…</div>
        </div>
      ) : qNorm ? (
        (() => {
          const targhe = Array.from(new Set(visVoci.map((v) => v.targa).filter((targa) => targa && matchTargaOrAutista(targa)))).sort();
          if (!targhe.length) {
            return (
              <div className="card">
                <div className="empty">Nessun mezzo trovato per "{queryTarga}".</div>
              </div>
            );
          }
          return targhe.map((targa) => {
            const rev = revisioni.find((item) => normTarga(item.targa) === normTarga(targa));
            const mezzoLabel = rev ? [rev.marca, rev.modello].filter(Boolean).join(" ") : "";
            const km = kmByTarga.get(normTarga(targa)) ?? null;
            const vTarga = visVoci.filter((v) => normTarga(v.targa) === normTarga(targa));
            return (
              <div className="card" key={targa}>
                <div className="dossier-h">
                  <div className="tgbig">{targa}</div>
                  <div className="info">
                    <b>{mezzoLabel || "Mezzo"}</b>
                    <span>Riepilogo scadenze del mezzo</span>
                  </div>
                  <div className="km">
                    <b>{km != null ? `${formatNumIt(km)} km` : "—"}</b>
                    <span>km corrente</span>
                  </div>
                </div>
                {settoriPresenti.map((cat) => {
                  const vs = ordina(vTarga.filter((v) => v.settore.key === cat.key));
                  return (
                    <Fragment key={cat.key}>
                      <div className="seclabel">
                        <span className="ico" style={{ background: "none", color: "var(--accent)" }}>
                          {categoryIcon(cat.icon)}
                        </span>
                        {cat.label}
                        <span className="ln" />
                      </div>
                      {vs.length ? (
                        <>
                          {renderColonneHeader()}
                          {vs.map(renderVoce)}
                        </>
                      ) : (
                        <div className="empty">Nessuna scadenza registrata in questo settore.</div>
                      )}
                    </Fragment>
                  );
                })}
              </div>
            );
          });
        })()
      ) : (
        cats.map((cat) => {
          const voci = ordina(visVoci.filter((v) => v.settore.key === cat.key));
          return (
            <div className="card" key={cat.key}>
              <div className="card-h">
                <h2>
                  <span className="ico">{categoryIcon(cat.icon)}</span> {cat.label}
                </h2>
                <span className="count">{voci.length}</span>
              </div>
              {voci.length ? (
                <>
                  {renderColonneHeader()}
                  {voci.map(renderVoce)}
                </>
              ) : (
                <div className="empty">Nessuna voce in questo settore.</div>
              )}
            </div>
          );
        })
      )}

      <div className="note">
        Le scadenze sono calcolate con soglia 30 giorni per le date e residuo 1.000 km per i km; le scadenze a ore senza
        contaore mostrano "ore non disponibili". I collaudi riusano il calcolo e i flussi esistenti.
      </div>

      {manutForm ? (
        <div className="scd-backdrop open" onClick={(event) => event.target === event.currentTarget && closeManut()}>
          <div className="modal">
            <div className="modal-h">
              <h3>{manutForm.editingId ? "Modifica scadenza" : "Nuova scadenza di manutenzione"}</h3>
              <button type="button" className="x" onClick={closeManut}>
                ×
              </button>
            </div>
            <div className="modal-b">
              <div className="grid2">
                <div className="field">
                  <label>Tipo / settore</label>
                  <select value={manutForm.tipo} onChange={(event) => handleManutTipoChange(event.target.value)}>
                    {TIPI_SCADENZA.map((entry) => (
                      <option key={entry.value} value={entry.value}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Mezzo (targa)</label>
                  <input
                    list="scd-targhe-list"
                    value={manutForm.targa}
                    onChange={(event) => patchManut({ targa: event.target.value })}
                    placeholder="Digita parte della targa…"
                    autoComplete="off"
                  />
                  <datalist id="scd-targhe-list">
                    {targheModal.map((targa) => (
                      <option key={targa} value={targa} />
                    ))}
                  </datalist>
                </div>
                <div className="field full">
                  <label>Etichetta mostrata</label>
                  <input value={manutForm.label} onChange={(event) => patchManut({ label: event.target.value })} />
                </div>
              </div>

              <div className="field full" style={{ marginTop: 14 }}>
                <label>Su cosa si basa la scadenza</label>
                <div className="bases">
                  <label>
                    <input type="checkbox" checked={baseAttiva("tempo")} onChange={() => toggleBaseManut("tempo")} /> A tempo
                  </label>
                  <label>
                    <input type="checkbox" checked={baseAttiva("km")} onChange={() => toggleBaseManut("km")} /> A km
                  </label>
                  <label>
                    <input type="checkbox" checked={baseAttiva("ore")} onChange={() => toggleBaseManut("ore")} /> A ore
                  </label>
                </div>
                <div className="help">Puoi selezionarne più di una: vale la più critica.</div>
              </div>

              {baseAttiva("tempo") ? (
                <div className="subgrid">
                  <h4>A tempo</h4>
                  <div className="grid2">
                    <div className="field">
                      <label>Intervallo (mesi)</label>
                      <input
                        type="number"
                        placeholder="es. 24"
                        value={manutForm.intervalloMesi}
                        onChange={(event) => patchManut({ intervalloMesi: event.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label>Ultima esecuzione (data)</label>
                      <input
                        type="text"
                        placeholder="gg/mm/aaaa"
                        value={manutForm.ultimaEsecuzioneData}
                        onChange={(event) => patchManut({ ultimaEsecuzioneData: event.target.value })}
                      />
                    </div>
                    <div className="field full">
                      <label>Oppure prossima scadenza a mano (data)</label>
                      <input
                        type="text"
                        placeholder="gg/mm/aaaa — prevale sul calcolo"
                        value={manutForm.prossimaScadenzaDataManuale}
                        onChange={(event) => patchManut({ prossimaScadenzaDataManuale: event.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {baseAttiva("km") ? (
                <div className="subgrid">
                  <h4>A km</h4>
                  <div className="grid2">
                    <div className="field">
                      <label>Intervallo (km)</label>
                      <input
                        type="number"
                        placeholder="es. 50000"
                        value={manutForm.intervalloKm}
                        onChange={(event) => patchManut({ intervalloKm: event.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label>Km all'ultima esecuzione</label>
                      <input
                        type="number"
                        placeholder="es. 120000"
                        value={manutForm.ultimaEsecuzioneKm}
                        onChange={(event) => patchManut({ ultimaEsecuzioneKm: event.target.value })}
                      />
                    </div>
                    <div className="field full">
                      <label>Oppure prossimo km a mano</label>
                      <input
                        type="number"
                        placeholder="prevale sul calcolo"
                        value={manutForm.prossimaScadenzaKmManuale}
                        onChange={(event) => patchManut({ prossimaScadenzaKmManuale: event.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {baseAttiva("ore") ? (
                <div className="subgrid">
                  <h4>A ore</h4>
                  <div className="grid2">
                    <div className="field">
                      <label>Intervallo (ore)</label>
                      <input
                        type="number"
                        placeholder="es. 500"
                        value={manutForm.intervalloOre}
                        onChange={(event) => patchManut({ intervalloOre: event.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label>Ore all'ultima esecuzione</label>
                      <input
                        type="number"
                        placeholder="es. 1200"
                        value={manutForm.ultimaEsecuzioneOre}
                        onChange={(event) => patchManut({ ultimaEsecuzioneOre: event.target.value })}
                      />
                    </div>
                  </div>
                  <div className="help">
                    In Fase 1 non c'è un contaore corrente affidabile: le scadenze a sole ore mostrano "ore non
                    disponibili".
                  </div>
                </div>
              ) : null}

              <div className="field full" style={{ marginTop: 14 }}>
                <label>Note</label>
                <textarea
                  rows={2}
                  placeholder="facoltative"
                  value={manutForm.note}
                  onChange={(event) => patchManut({ note: event.target.value })}
                />
              </div>

              <div className="preview">
                {previewItem ? (
                  <>
                    Anteprima: <span className={pillClassForStato(previewItem.stato)}>{pillLabelForStato(previewItem.stato)}</span>
                    {previewItem.componenti.map((componente, index) => (
                      <span key={index}>
                        <span className="chip">{componente.base}</span> {formatComponenteTesto(componente)}
                      </span>
                    ))}
                  </>
                ) : (
                  "Seleziona almeno una base."
                )}
              </div>
            </div>
            <div className="modal-f">
              <button type="button" className="btn" onClick={closeManut} disabled={manutSubmitting}>
                Annulla
              </button>
              <button type="button" className="btn primary" onClick={() => void salvaManut()} disabled={manutSubmitting}>
                {manutSubmitting ? "Salvataggio…" : "Salva scadenza"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {eseguitaForm ? (
        <div
          className="scd-backdrop open"
          onClick={(event) => event.target === event.currentTarget && closeEseguita()}
        >
          <div className="modal">
            <div className="modal-h">
              <h3>Segna eseguita — {eseguitaForm.item.label}</h3>
              <button type="button" className="x" onClick={closeEseguita}>
                ×
              </button>
            </div>
            <div className="modal-b">
              <div className="help" style={{ marginBottom: 12 }}>
                {eseguitaForm.item.targa} · registra quando/quanto è stata eseguita: la prossima scadenza
                verrà ricalcolata automaticamente.
              </div>
              <div className="grid2">
                {eseguitaForm.item.base.includes("tempo") ? (
                  <div className="field">
                    <label>Data esecuzione</label>
                    <input
                      type="text"
                      placeholder="gg/mm/aaaa"
                      value={eseguitaForm.data}
                      onChange={(event) =>
                        setEseguitaForm((current) => (current ? { ...current, data: event.target.value } : current))
                      }
                    />
                  </div>
                ) : null}
                {eseguitaForm.item.base.includes("km") ? (
                  <div className="field">
                    <label>Km all'esecuzione</label>
                    <input
                      type="number"
                      placeholder="es. 120000"
                      value={eseguitaForm.km}
                      onChange={(event) =>
                        setEseguitaForm((current) => (current ? { ...current, km: event.target.value } : current))
                      }
                    />
                  </div>
                ) : null}
                {eseguitaForm.item.base.includes("ore") ? (
                  <div className="field">
                    <label>Ore all'esecuzione</label>
                    <input
                      type="number"
                      placeholder="es. 1200"
                      value={eseguitaForm.ore}
                      onChange={(event) =>
                        setEseguitaForm((current) => (current ? { ...current, ore: event.target.value } : current))
                      }
                    />
                  </div>
                ) : null}
              </div>
              <div className="preview">
                {previewEseguitaItem ? (
                  <>
                    Nuova prossima scadenza:{" "}
                    {previewEseguitaItem.componenti.map((componente, index) => (
                      <span key={index}>
                        <span className="chip">{componente.base}</span> {formatComponenteTesto(componente)}
                      </span>
                    ))}
                  </>
                ) : (
                  "—"
                )}
              </div>
            </div>
            <div className="modal-f">
              <button type="button" className="btn" onClick={closeEseguita} disabled={eseguitaSubmitting}>
                Annulla
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => void salvaEseguita()}
                disabled={eseguitaSubmitting}
              >
                {eseguitaSubmitting ? "Salvataggio…" : "Conferma esecuzione"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <PdfPreviewModal
        open={pdfPreviewOpen}
        title={pdfPreviewTitle}
        pdfUrl={pdfPreviewUrl}
        fileName={pdfPreviewFileName}
        hint={pdfShareHint}
        onClose={closePdfPreview}
        onShare={() => void handleSharePdf()}
        onCopyLink={() => void handleCopyPdfLink()}
        onWhatsApp={handleOpenWhatsAppPdf}
      />
    </div>
  );
}
