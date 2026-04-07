import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PdfPreviewModal from "../components/PdfPreviewModal";
import { formatDateInput, formatDateUI } from "../utils/dateFormat";
import { generateSmartPDFBlob } from "../utils/pdfEngine";
import {
  buildPdfShareText,
  buildWhatsAppShareUrl,
  copyTextToClipboard,
  openPreview,
  revokePdfPreviewUrl,
  sharePdfFile,
} from "../utils/pdfPreview";
import { getItemSync, setItemSync } from "../utils/storageSync";
import type { Lavoro, Urgenza } from "../types/lavori";
import "./next-lavori.css";

type MezzoLite = {
  id?: string;
  targa?: string;
  mezzoTarga?: string;
  categoria?: string;
  marca?: string;
  modello?: string;
  descrizione?: string;
  autistaNome?: string | null;
  nomeAutista?: string | null;
  autista?: string | { nome?: string | null } | null;
  fotoURL?: string;
  fotoUrl?: string;
  photoURL?: string;
  immagineUrl?: string;
  imageUrl?: string;
  foto?: string;
};

type LavoroSourceRef = {
  type?: string | null;
  id?: string | null;
  key?: string | null;
  originType?: string | null;
  originId?: string | null;
  originKey?: string | null;
};

type LavoroWithSource = Lavoro & {
  dettagli?: string | null;
  note?: string | null;
  source?: LavoroSourceRef | null;
};

type SegnalazioneRawRecord = {
  id?: string | null;
  linkedLavoroId?: string | null;
  linkedLavoroIds?: unknown[] | null;
  targa?: string | null;
  targaCamion?: string | null;
  targaMotrice?: string | null;
  autistaNome?: string | null;
  nomeAutista?: string | null;
  badgeAutista?: string | null;
  badge?: string | null;
  tipoProblema?: string | null;
  tipo?: string | null;
  titolo?: string | null;
  descrizione?: string | null;
  note?: string | null;
  messaggio?: string | null;
  dettaglio?: string | null;
  testo?: string | null;
  stato?: string | null;
  timestamp?: string | number | null;
  data?: string | number | null;
  fotoUrls?: unknown[] | null;
};

type ControlloRawRecord = {
  id?: string | null;
  linkedLavoroId?: string | null;
  linkedLavoroIds?: unknown[] | null;
  target?: string | null;
  targaCamion?: string | null;
  targaMotrice?: string | null;
  targaRimorchio?: string | null;
  autistaNome?: string | null;
  nomeAutista?: string | null;
  badgeAutista?: string | null;
  badge?: string | null;
  note?: string | null;
  dettaglio?: string | null;
  messaggio?: string | null;
  check?: Record<string, unknown> | null;
  koItems?: unknown[] | null;
  esito?: string | null;
  ko?: boolean | null;
  ok?: boolean | null;
  tuttoOk?: boolean | null;
  obbligatorio?: boolean | null;
  timestamp?: string | number | null;
  data?: string | number | null;
};

type ResolvedOriginInfo = {
  itemId: string;
  kind: "segnalazione" | "controllo" | null;
  segnalazione: SegnalazioneRawRecord | null;
  controllo: ControlloRawRecord | null;
  isDeclaredOrigin: boolean;
};

export type NextLavoriDetailFrom =
  | "lavori-da-eseguire"
  | "lavori-in-attesa"
  | "lavori-eseguiti";

type NextLavoriRealDetailViewProps = {
  lavoroId: string;
  embedded?: boolean;
  onClose?: () => void;
  onMutationComplete?: () => Promise<void> | void;
};

const LAVORI_KEY = "@lavori";
const MEZZI_KEY = "@mezzi_aziendali";
const SEGNALAZIONI_KEY = "@segnalazioni_autisti_tmp";
const CONTROLLI_KEY = "@controlli_mezzo_autisti";
const EMPTY_LABEL = "—";

const normalizeTarga = (value?: string | null) =>
  String(value ?? "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .trim();

const normalizeLooseText = (value?: string | null) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const normalizeMatchText = (value?: string | null) =>
  normalizeLooseText(value)
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const safeText = (value?: string | null) => String(value ?? "").trim();

const toLavoriArray = (value: unknown): LavoroWithSource[] =>
  Array.isArray(value) ? (value as LavoroWithSource[]) : [];

const toMezziArray = (value: unknown): MezzoLite[] =>
  Array.isArray(value) ? (value as MezzoLite[]) : [];

const toSegnalazioniArray = (value: unknown): SegnalazioneRawRecord[] =>
  Array.isArray(value) ? (value as SegnalazioneRawRecord[]) : [];

const toControlliArray = (value: unknown): ControlloRawRecord[] =>
  Array.isArray(value) ? (value as ControlloRawRecord[]) : [];

const getMezzoPhoto = (mezzo?: MezzoLite | null) =>
  mezzo?.fotoURL ||
  mezzo?.fotoUrl ||
  mezzo?.photoURL ||
  mezzo?.immagineUrl ||
  mezzo?.imageUrl ||
  mezzo?.foto ||
  "";

const getMezzoMeta = (mezzo?: MezzoLite | null) => {
  const parts = [mezzo?.categoria, mezzo?.marca, mezzo?.modello, mezzo?.descrizione].filter(
    Boolean,
  ) as string[];
  return parts.join(" - ");
};

const getSegnalatoDaLabel = (item?: Lavoro | null) =>
  safeText(item?.segnalatoDa) || EMPTY_LABEL;

const getAutistaSolitoLabel = (mezzo?: MezzoLite | null) => {
  if (!mezzo) return EMPTY_LABEL;

  const objectName =
    mezzo.autista && typeof mezzo.autista === "object"
      ? safeText(mezzo.autista.nome)
      : "";
  const directValue = typeof mezzo.autista === "string" ? safeText(mezzo.autista) : objectName;

  return (
    safeText(mezzo.autistaNome) ||
    safeText(mezzo.nomeAutista) ||
    directValue ||
    EMPTY_LABEL
  );
};

const getUrgencyLabel = (urgenza?: Urgenza) => {
  if (urgenza === "alta") return "ALTA";
  if (urgenza === "media") return "MEDIA";
  if (urgenza === "bassa") return "BASSA";
  return "MEDIA";
};

const getUrgencyClass = (urgenza?: Urgenza) => {
  if (urgenza === "alta") return "nl-badge nl-badge--alta";
  if (urgenza === "bassa") return "nl-badge nl-badge--bassa";
  return "nl-badge nl-badge--media";
};

const formatFileDate = () => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const formatSegnalazioneDateTime = (timestamp: number | null) => {
  if (!timestamp) return EMPTY_LABEL;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return EMPTY_LABEL;
  return date.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toTimestampValue = (value?: string | number | null) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
};

const resolveBackPath = (from?: string | null) => {
  if (from === "lavori-eseguiti") return "/next/lavori-eseguiti";
  if (from === "lavori-da-eseguire") return "/next/lavori-da-eseguire?tab=aggiungi";
  return "/next/lavori-in-attesa";
};

const extractProblemHints = (item?: LavoroWithSource | null) => {
  const rawDescription = safeText(item?.descrizione);
  const match = rawDescription.match(/^Segnalazione:\s*(.+)$/i);
  if (!match) {
    return { detailText: "", typeText: "" };
  }

  const payload = match[1].trim();
  const separatorIndex = payload.indexOf(" - ");
  if (separatorIndex < 0) {
    return { detailText: payload, typeText: "" };
  }

  return {
    typeText: payload.slice(0, separatorIndex).trim(),
    detailText: payload.slice(separatorIndex + 3).trim(),
  };
};

const getSegnalazioneProblemText = (segnalazione?: SegnalazioneRawRecord | null) =>
  safeText(segnalazione?.descrizione) ||
  safeText(segnalazione?.note) ||
  safeText(segnalazione?.messaggio) ||
  safeText(segnalazione?.dettaglio) ||
  safeText(segnalazione?.testo);

const getControlloKoList = (controllo?: ControlloRawRecord | null) => {
  const koList: string[] = [];
  if (controllo?.check && typeof controllo.check === "object" && !Array.isArray(controllo.check)) {
    Object.entries(controllo.check).forEach(([key, value]) => {
      if (value === false) {
        koList.push(String(key).toUpperCase());
      }
    });
  }

  if (Array.isArray(controllo?.koItems)) {
    controllo.koItems.forEach((entry) => {
      const value = safeText(typeof entry === "string" ? entry : String(entry ?? ""));
      if (value) {
        koList.push(value.toUpperCase());
      }
    });
  }

  return Array.from(new Set(koList));
};

const isControlloKoRecord = (controllo?: ControlloRawRecord | null) =>
  controllo?.ko === true ||
  controllo?.ok === false ||
  controllo?.tuttoOk === false ||
  normalizeMatchText(controllo?.esito) === "ko" ||
  getControlloKoList(controllo).length > 0;

const getControlloProblemText = (controllo?: ControlloRawRecord | null) => {
  const noteText =
    safeText(controllo?.note) ||
    safeText(controllo?.dettaglio) ||
    safeText(controllo?.messaggio);
  const koList = getControlloKoList(controllo);
  if (noteText && koList.length > 0) {
    return `${noteText}\n\nCheck KO: ${koList.join(", ")}`;
  }
  if (noteText) {
    return noteText;
  }
  if (koList.length > 0) {
    return `Check KO: ${koList.join(", ")}`;
  }
  return "";
};

const isSegnalazioneOrigin = (item?: LavoroWithSource | null) => {
  const sourceType = normalizeMatchText(item?.source?.type ?? item?.source?.originType);
  if (sourceType === "segnalazione") return true;
  return /^Segnalazione:/i.test(safeText(item?.descrizione));
};

const isControlloOrigin = (item?: LavoroWithSource | null) => {
  const sourceType = normalizeMatchText(item?.source?.type ?? item?.source?.originType);
  if (sourceType === "controllo") return true;
  return /^Controllo KO:/i.test(safeText(item?.descrizione));
};

const getProblemaOrigineText = (item: LavoroWithSource, resolved: ResolvedOriginInfo) => {
  if (resolved.kind === "segnalazione" && resolved.segnalazione) {
    return (
      getSegnalazioneProblemText(resolved.segnalazione) ||
      "Nessuna descrizione presente nella segnalazione originale"
    );
  }

  if (resolved.kind === "controllo" && resolved.controllo) {
    return (
      getControlloProblemText(resolved.controllo) ||
      "Nessuna nota presente nel controllo originale"
    );
  }

  if (resolved.kind === "segnalazione") {
    return "Segnalazione originale non trovata";
  }

  if (resolved.kind === "controllo") {
    return "Controllo originale non trovato";
  }

  return extractProblemHints(item).detailText || EMPTY_LABEL;
};

const getOrigineActionLabel = (resolved: ResolvedOriginInfo) => {
  if (resolved.kind === "controllo") return "Apri controllo";
  return "Apri segnalazione";
};

const getOrigineMissingLabel = (resolved: ResolvedOriginInfo) => {
  if (resolved.kind === "controllo") return "Controllo originale non trovato";
  if (resolved.kind === "segnalazione") return "Segnalazione originale non trovata";
  return "";
};

const formatControlloTargetLabel = (controllo?: ControlloRawRecord | null) => {
  const target = normalizeMatchText(controllo?.target);
  if (target === "rimorchio") return "Rimorchio";
  if (target === "entrambi") return "Entrambi";
  return "Motrice";
};

const getControlloMezzoLabel = (controllo?: ControlloRawRecord | null) => {
  const motrice = safeText(controllo?.targaCamion ?? controllo?.targaMotrice);
  const rimorchio = safeText(controllo?.targaRimorchio);
  const target = normalizeMatchText(controllo?.target);

  if (target === "rimorchio") {
    return rimorchio || EMPTY_LABEL;
  }
  if (target === "entrambi") {
    if (motrice && rimorchio) {
      return `Motrice ${motrice} | Rimorchio ${rimorchio}`;
    }
    return motrice || rimorchio || EMPTY_LABEL;
  }
  return motrice || rimorchio || EMPTY_LABEL;
};

async function loadLavoriGroup(lavoroId: string) {
  const lavori = toLavoriArray(await getItemSync(LAVORI_KEY));
  const target = lavori.find((entry) => entry.id === lavoroId) ?? null;

  if (!target) {
    return { items: [] as LavoroWithSource[], target: null };
  }

  const items = target.gruppoId
    ? lavori.filter((entry) => entry.gruppoId === target.gruppoId)
    : [target];

  items.sort(
    (left, right) =>
      new Date(left.dataInserimento || "").getTime() -
      new Date(right.dataInserimento || "").getTime(),
  );

  return { items, target };
}

const resolveSegnalazioneForLavoro = (
  item: LavoroWithSource,
  segnalazioniRows: SegnalazioneRawRecord[],
): ResolvedOriginInfo => {
  const sourceType = normalizeMatchText(item.source?.type ?? item.source?.originType);
  const sourceId = safeText(item.source?.id ?? item.source?.originId);
  if (sourceType === "segnalazione" && sourceId) {
    return {
      itemId: item.id,
      kind: "segnalazione",
      segnalazione:
        segnalazioniRows.find((entry) => safeText(entry.id) === sourceId) ?? null,
      controllo: null,
      isDeclaredOrigin: true,
    };
  }

  const linkedCandidate =
    segnalazioniRows.find((entry) => safeText(entry.linkedLavoroId) === item.id) ??
    segnalazioniRows.find((entry) =>
      Array.isArray(entry.linkedLavoroIds)
        ? entry.linkedLavoroIds.some((linkedId) => safeText(String(linkedId)) === item.id)
        : false,
    ) ??
    null;

  if (linkedCandidate) {
    return {
      itemId: item.id,
      kind: "segnalazione",
      segnalazione: linkedCandidate,
      controllo: null,
      isDeclaredOrigin: true,
    };
  }

  const signalOrigin = isSegnalazioneOrigin(item);
  if (!signalOrigin) {
    return {
      itemId: item.id,
      kind: null,
      segnalazione: null,
      controllo: null,
      isDeclaredOrigin: false,
    };
  }

  const hints = extractProblemHints(item);
  const normalizedDescription = normalizeMatchText(hints.detailText);
  const normalizedType = normalizeMatchText(hints.typeText);
  const normalizedTarga = normalizeTarga(item.targa);
  const normalizedReporter = normalizeMatchText(item.segnalatoDa);

  if (!normalizedDescription) {
    return {
      itemId: item.id,
      kind: "segnalazione",
      segnalazione: null,
      controllo: null,
      isDeclaredOrigin: true,
    };
  }

  const candidates = segnalazioniRows.filter((entry) => {
    if (normalizedTarga && normalizeTarga(entry.targa) !== normalizedTarga) {
      return false;
    }

    const reporterCandidates = [entry.autistaNome, entry.badgeAutista]
      .map((value) => normalizeMatchText(value))
      .filter(Boolean);
    if (
      normalizedReporter &&
      reporterCandidates.length > 0 &&
      !reporterCandidates.includes(normalizedReporter)
    ) {
      return false;
    }

    if (
      normalizedType &&
      normalizeMatchText(entry.tipoProblema ?? entry.tipo ?? entry.titolo) !== normalizedType
    ) {
      return false;
    }

    return (
      normalizeMatchText(
        entry.descrizione ?? entry.note ?? entry.messaggio ?? entry.dettaglio ?? entry.testo,
      ) === normalizedDescription
    );
  });

  return {
    itemId: item.id,
    kind: "segnalazione",
    segnalazione: candidates.length === 1 ? candidates[0] : null,
    controllo: null,
    isDeclaredOrigin: true,
  };
};

const resolveControlloForLavoro = (
  item: LavoroWithSource,
  controlliRows: ControlloRawRecord[],
): ResolvedOriginInfo => {
  const sourceType = normalizeMatchText(item.source?.type ?? item.source?.originType);
  const sourceId = safeText(item.source?.id ?? item.source?.originId);
  if (sourceType === "controllo" && sourceId) {
    const directMatch =
      controlliRows.find((entry) => safeText(entry.id) === sourceId) ?? null;
    if (directMatch) {
      return {
        itemId: item.id,
        kind: "controllo",
        segnalazione: null,
        controllo: directMatch,
        isDeclaredOrigin: true,
      };
    }
  }

  const backlinkMatches = controlliRows.filter((entry) => {
    if (safeText(entry.linkedLavoroId) === item.id) {
      return true;
    }
    if (Array.isArray(entry.linkedLavoroIds)) {
      return entry.linkedLavoroIds.some((linkedId) => safeText(String(linkedId)) === item.id);
    }
    return false;
  });

  if (backlinkMatches.length === 1) {
    return {
      itemId: item.id,
      kind: "controllo",
      segnalazione: null,
      controllo: backlinkMatches[0],
      isDeclaredOrigin: true,
    };
  }

  if (sourceType === "controllo" || isControlloOrigin(item) || backlinkMatches.length > 1) {
    return {
      itemId: item.id,
      kind: "controllo",
      segnalazione: null,
      controllo: null,
      isDeclaredOrigin: true,
    };
  }

  return {
    itemId: item.id,
    kind: null,
    segnalazione: null,
    controllo: null,
    isDeclaredOrigin: false,
  };
};

const resolveOriginForLavoro = (
  item: LavoroWithSource,
  segnalazioniRows: SegnalazioneRawRecord[],
  controlliRows: ControlloRawRecord[],
): ResolvedOriginInfo => {
  const segnalazioneOrigin = resolveSegnalazioneForLavoro(item, segnalazioniRows);
  if (segnalazioneOrigin.isDeclaredOrigin) {
    return segnalazioneOrigin;
  }

  return resolveControlloForLavoro(item, controlliRows);
};

export function NextLavoriRealDetailView({
  lavoroId,
  embedded = false,
  onClose,
  onMutationComplete,
}: NextLavoriRealDetailViewProps) {
  const [items, setItems] = useState<LavoroWithSource[]>([]);
  const [mezzo, setMezzo] = useState<MezzoLite | null>(null);
  const [segnalazioniRows, setSegnalazioniRows] = useState<SegnalazioneRawRecord[]>([]);
  const [controlliRows, setControlliRows] = useState<ControlloRawRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [executeModalOpen, setExecuteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [nomeEsecutore, setNomeEsecutore] = useState("");
  const [descrizioneMod, setDescrizioneMod] = useState("");
  const [dataMod, setDataMod] = useState("");
  const [selectedItem, setSelectedItem] = useState<LavoroWithSource | null>(null);
  const [selectedSegnalazione, setSelectedSegnalazione] = useState<SegnalazioneRawRecord | null>(
    null,
  );
  const [selectedControllo, setSelectedControllo] = useState<ControlloRawRecord | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState("dettaglio-lavori.pdf");
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState("Anteprima PDF dettaglio lavori");
  const [pdfShareHint, setPdfShareHint] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!lavoroId) {
      setItems([]);
      setMezzo(null);
      setSegnalazioniRows([]);
      setControlliRows([]);
      setError("Lavoro non disponibile.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [{ items: nextItems, target }, mezziValue, segnalazioniValue, controlliValue] =
        await Promise.all([
          loadLavoriGroup(lavoroId),
          getItemSync(MEZZI_KEY),
          getItemSync(SEGNALAZIONI_KEY),
          getItemSync(CONTROLLI_KEY),
        ]);

      if (!target) {
        setItems([]);
        setMezzo(null);
        setSegnalazioniRows([]);
        setControlliRows([]);
        setError("Lavoro non trovato.");
        return;
      }

      const mezzi = toMezziArray(mezziValue);
      const mezzoTarga = normalizeTarga(target.targa);
      const matchingMezzo =
        mezzi.find(
          (entry) =>
            normalizeTarga(entry.targa ?? entry.mezzoTarga ?? "") === mezzoTarga,
        ) ?? null;

      setItems(nextItems);
      setMezzo(matchingMezzo);
      setSegnalazioniRows(toSegnalazioniArray(segnalazioniValue));
      setControlliRows(toControlliArray(controlliValue));
    } catch (loadError) {
      setItems([]);
      setMezzo(null);
      setSegnalazioniRows([]);
      setControlliRows([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossibile leggere il dettaglio lavoro.",
      );
    } finally {
      setLoading(false);
    }
  }, [lavoroId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    return () => {
      revokePdfPreviewUrl(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const target = items.find((entry) => entry.id === lavoroId) ?? items[0] ?? null;
  const resolvedOrigins = useMemo(() => {
    const map = new Map<string, ResolvedOriginInfo>();
    items.forEach((item) => {
      map.set(item.id, resolveOriginForLavoro(item, segnalazioniRows, controlliRows));
    });
    return map;
  }, [items, segnalazioniRows, controlliRows]);

  const headerTitle = target?.targa?.trim() || "Magazzino";
  const headerMeta = getMezzoMeta(mezzo);
  const headerPhoto = getMezzoPhoto(mezzo);
  const autistaSolito = getAutistaSolitoLabel(mezzo);

  const buildPdfShareMessage = () =>
    buildPdfShareText({
      contextLabel: "Dettaglio lavori",
      dateLabel: formatFileDate(),
      fileName: pdfPreviewFileName || "dettaglio-lavori.pdf",
      url: pdfPreviewUrl,
    });

  const closePdfPreview = () => {
    revokePdfPreviewUrl(pdfPreviewUrl);
    setPdfPreviewOpen(false);
    setPdfPreviewUrl(null);
    setPdfPreviewBlob(null);
    setPdfShareHint(null);
  };

  const handleSharePDF = async () => {
    if (!pdfPreviewBlob) {
      const copied = await copyTextToClipboard(buildPdfShareMessage());
      setPdfShareHint(copied ? "Link copiato." : "Apri prima un'anteprima PDF.");
      return;
    }

    const result = await sharePdfFile({
      blob: pdfPreviewBlob,
      fileName: pdfPreviewFileName || "dettaglio-lavori.pdf",
      title: pdfPreviewTitle || "Anteprima PDF dettaglio lavori",
      text: buildPdfShareMessage(),
    });

    if (result.status === "shared") {
      setPdfShareHint("PDF condiviso.");
      return;
    }
    if (result.status === "aborted") {
      return;
    }

    const copied = await copyTextToClipboard(buildPdfShareMessage());
    setPdfShareHint(
      copied
        ? "Condivisione non disponibile: testo copiato."
        : "Condivisione non disponibile.",
    );
  };

  const handleCopyPDFText = async () => {
    const copied = await copyTextToClipboard(buildPdfShareMessage());
    setPdfShareHint(copied ? "Testo copiato." : "Copia non disponibile.");
  };

  const handleWhatsAppPDF = () => {
    const text = buildPdfShareMessage();
    window.open(buildWhatsAppShareUrl(text), "_blank", "noopener,noreferrer");
  };

  const handlePreviewPDF = async () => {
    if (items.length === 0) return;

    const title = headerTitle === "Magazzino" ? "Magazzino" : `Targa ${headerTitle}`;
    const columns = [
      "Mezzo",
      "Descrizione",
      "Segnalato da",
      "Autista solito",
      "Urgenza",
      "Inserimento",
      "Esecuzione",
      "Eseguito da",
    ];
    const rows = items.map((item) => ({
      Mezzo: item.targa || "Magazzino",
      Descrizione: item.descrizione,
      "Segnalato da": getSegnalatoDaLabel(item),
      "Autista solito": autistaSolito,
      Urgenza: getUrgencyLabel(item.urgenza),
      Inserimento: formatDateUI(item.dataInserimento ?? null),
      Esecuzione: formatDateUI(item.dataEsecuzione ?? null),
      "Eseguito da": item.chiHaEseguito || EMPTY_LABEL,
    }));

    try {
      const fileDate = formatFileDate();
      const preview = await openPreview({
        source: async () =>
          generateSmartPDFBlob({
            kind: "table",
            title: `Dettaglio lavori - ${title}`,
            rows,
            columns,
            orientation: "landscape",
            fontSize: 8,
            tableWidth: "auto",
            overflow: "linebreak",
          }),
        fileName: `dettaglio-lavori-${title.replace(/\s+/g, "-")}-${fileDate}.pdf`,
        previousUrl: pdfPreviewUrl,
      });
      setPdfShareHint(null);
      setPdfPreviewBlob(preview.blob);
      setPdfPreviewFileName(preview.fileName);
      setPdfPreviewTitle(`Anteprima PDF dettaglio lavori - ${title}`);
      setPdfPreviewUrl(preview.url);
      setPdfPreviewOpen(true);
    } catch (previewError) {
      console.error("Errore anteprima dettaglio lavori:", previewError);
    }
  };

  const syncParent = async () => {
    await reload();
    await onMutationComplete?.();
  };

  const openExecuteModal = (item: LavoroWithSource) => {
    if (item.eseguito) return;
    setNotice(null);
    setSelectedItem(item);
    setNomeEsecutore(item.chiHaEseguito || "");
    setExecuteModalOpen(true);
  };

  const openEditModal = (item: LavoroWithSource) => {
    setNotice(null);
    setSelectedItem(item);
    setDescrizioneMod(item.descrizione);
    setDataMod(formatDateInput(item.dataInserimento || new Date()));
    setEditModalOpen(true);
  };

  const handleDelete = async (itemId: string) => {
    const item = items.find((entry) => entry.id === itemId) ?? null;
    if (!item) return;

    if (!window.confirm("Vuoi eliminare questo lavoro?")) {
      return;
    }

    const lavori = toLavoriArray(await getItemSync(LAVORI_KEY));
    const nextItems = lavori.filter((entry) => entry.id !== itemId);
    await setItemSync(LAVORI_KEY, nextItems);
    setNotice(`Lavoro "${item.descrizione}" eliminato.`);
    await syncParent();
  };

  const handleSaveExecute = async () => {
    if (!selectedItem) return;
    if (!nomeEsecutore.trim()) {
      window.alert("Inserisci chi ha eseguito");
      return;
    }

    const lavori = toLavoriArray(await getItemSync(LAVORI_KEY));
    const nextItems = lavori.map((entry) =>
      entry.id === selectedItem.id
        ? {
            ...entry,
            eseguito: true,
            chiHaEseguito: nomeEsecutore.trim(),
            dataEsecuzione: new Date().toISOString(),
          }
        : entry,
    );

    await setItemSync(LAVORI_KEY, nextItems);
    setExecuteModalOpen(false);
    setNomeEsecutore("");
    setNotice(`Lavoro "${selectedItem.descrizione}" segnato come eseguito.`);
    await syncParent();
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    if (!descrizioneMod.trim()) {
      window.alert("Inserisci una descrizione");
      return;
    }
    if (!dataMod.trim()) {
      window.alert("Inserisci la data");
      return;
    }

    const lavori = toLavoriArray(await getItemSync(LAVORI_KEY));
    const nextItems = lavori.map((entry) =>
      entry.id === selectedItem.id
        ? {
            ...entry,
            descrizione: descrizioneMod.trim(),
            dataInserimento: dataMod,
          }
        : entry,
    );

    await setItemSync(LAVORI_KEY, nextItems);
    setEditModalOpen(false);
    setNotice(`Lavoro "${selectedItem.descrizione}" aggiornato.`);
    await syncParent();
  };

  return (
    <div className={`nl-detail ${embedded ? "nl-detail--embedded" : ""}`}>
      <div className="nl-detail__header">
        <div className="nl-detail__identity">
          <div className="nl-detail__photo">
            {headerPhoto ? (
              <img src={headerPhoto} alt={headerTitle} className="nl-detail__photo-img" />
            ) : (
              <div className="nl-detail__photo-placeholder">
                {headerTitle === "Magazzino" ? "MAG" : "MEZZO"}
              </div>
            )}
          </div>
          <div>
            <div className="nl-detail__eyebrow">Dettaglio lavoro</div>
            <div className="nl-detail__title">{headerTitle}</div>
            {headerMeta ? <div className="nl-detail__meta">{headerMeta}</div> : null}
            <div className="nl-detail__meta">Autista solito: {autistaSolito}</div>
          </div>
        </div>

        <div className="nl-detail__header-actions">
          <button
            type="button"
            className="nl-button nl-button--ghost"
            onClick={() => void handlePreviewPDF()}
          >
            PDF
          </button>
          {onClose ? (
            <button type="button" className="nl-button nl-button--ghost" onClick={onClose}>
              Chiudi
            </button>
          ) : null}
        </div>
      </div>

      {loading ? <div className="nl-empty">Caricamento dettaglio lavoro...</div> : null}
      {error ? <div className="nl-empty">{error}</div> : null}
      {notice ? <div className="nl-inline-notice">{notice}</div> : null}

      <div className="nl-detail__body">
        {items.map((item) => {
          const resolved = resolvedOrigins.get(item.id) ?? {
            itemId: item.id,
            kind: null,
            segnalazione: null,
            controllo: null,
            isDeclaredOrigin: false,
          };
          const problemText = getProblemaOrigineText(item, resolved);

          return (
            <div
              key={item.id}
              className={`nl-detail-card ${item.eseguito ? "is-completed" : ""}`}
            >
              <div className="nl-detail-card__top">
                <div>
                  <div className="nl-detail-card__title">{item.descrizione}</div>
                  <div className="nl-detail-card__sub">
                    {item.targa?.trim() ? `Targa ${item.targa}` : "Magazzino"}
                  </div>
                </div>
                <span className={getUrgencyClass(item.urgenza)}>
                  {getUrgencyLabel(item.urgenza)}
                </span>
              </div>

              <div className="nl-detail-card__meta-grid">
                <div>
                  <span className="nl-detail-card__label">Inserito</span>
                  <strong>{formatDateUI(item.dataInserimento ?? null)}</strong>
                </div>
                <div>
                  <span className="nl-detail-card__label">Stato</span>
                  <strong>{item.eseguito ? "Eseguito" : "In attesa"}</strong>
                </div>
                <div>
                  <span className="nl-detail-card__label">Eseguito da</span>
                  <strong>{item.chiHaEseguito || EMPTY_LABEL}</strong>
                </div>
                <div>
                  <span className="nl-detail-card__label">Data esecuzione</span>
                  <strong>{formatDateUI(item.dataEsecuzione ?? null)}</strong>
                </div>
                <div>
                  <span className="nl-detail-card__label">Segnalato da</span>
                  <strong>{getSegnalatoDaLabel(item)}</strong>
                  {resolved.kind && (resolved.segnalazione || resolved.controllo) ? (
                    <button
                      type="button"
                      className="nl-link-button nl-detail-card__source-link"
                      onClick={() => {
                        if (resolved.segnalazione) {
                          setSelectedSegnalazione(resolved.segnalazione);
                        }
                        if (resolved.controllo) {
                          setSelectedControllo(resolved.controllo);
                        }
                      }}
                    >
                      {getOrigineActionLabel(resolved)}
                    </button>
                  ) : null}
                  {resolved.kind && !resolved.segnalazione && !resolved.controllo ? (
                    <span className="nl-detail-card__source-note">
                      {getOrigineMissingLabel(resolved)}
                    </span>
                  ) : null}
                </div>
                <div>
                  <span className="nl-detail-card__label">Autista solito</span>
                  <strong>{autistaSolito}</strong>
                </div>
              </div>

              <div className="nl-detail-card__problem">
                <div className="nl-detail-card__problem-head">
                  <span className="nl-detail-card__label">Problema / esito origine</span>
                  {resolved.kind && (resolved.segnalazione || resolved.controllo) ? (
                    <span className="nl-detail-card__problem-badge">Origine autista</span>
                  ) : null}
                </div>
                <div className="nl-detail-card__problem-text">{problemText}</div>
              </div>

              <div className="nl-detail-card__actions">
                <button
                  type="button"
                  className="nl-button nl-button--ghost"
                  onClick={() => openEditModal(item)}
                >
                  Modifica
                </button>
                <button
                  type="button"
                  className="nl-button nl-button--danger"
                  onClick={() => void handleDelete(item.id)}
                >
                  Elimina
                </button>
                <button
                  type="button"
                  className={`nl-button ${item.eseguito ? "nl-button--muted" : "nl-button--primary"}`}
                  onClick={() => openExecuteModal(item)}
                >
                  {item.eseguito ? "Eseguito" : "Segna come eseguito"}
                </button>
              </div>
            </div>
          );
        })}

        {!loading && !error && items.length === 0 ? (
          <div className="nl-empty">Nessun dettaglio disponibile.</div>
        ) : null}
      </div>

      {!embedded ? (
        <div className="nl-standalone-footer">
          <button type="button" className="nl-button nl-button--primary" onClick={onClose}>
            Torna indietro
          </button>
        </div>
      ) : null}

      {executeModalOpen ? (
        <div className="nl-modal__backdrop" role="presentation">
          <div className="nl-modal nl-modal--small" role="dialog" aria-modal="true">
            <div className="nl-modal__header">
              <div>
                <div className="nl-modal__eyebrow">Esecuzione lavoro</div>
                <div className="nl-modal__title">Chi ha eseguito?</div>
              </div>
              <button
                type="button"
                className="nl-modal__close"
                onClick={() => setExecuteModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="nl-modal__body">
              <label className="nl-field">
                <span className="nl-field__label">Nome esecutore</span>
                <input
                  className="nl-field__input"
                  value={nomeEsecutore}
                  onChange={(event) => setNomeEsecutore(event.target.value)}
                />
              </label>
            </div>
            <div className="nl-modal__footer">
              <button
                type="button"
                className="nl-button nl-button--ghost"
                onClick={() => setExecuteModalOpen(false)}
              >
                Annulla
              </button>
              <button
                type="button"
                className="nl-button nl-button--primary"
                onClick={() => void handleSaveExecute()}
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editModalOpen ? (
        <div className="nl-modal__backdrop" role="presentation">
          <div className="nl-modal nl-modal--small" role="dialog" aria-modal="true">
            <div className="nl-modal__header">
              <div>
                <div className="nl-modal__eyebrow">Modifica lavoro</div>
                <div className="nl-modal__title">Aggiorna descrizione e data</div>
              </div>
              <button
                type="button"
                className="nl-modal__close"
                onClick={() => setEditModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="nl-modal__body">
              <label className="nl-field">
                <span className="nl-field__label">Descrizione</span>
                <input
                  className="nl-field__input"
                  value={descrizioneMod}
                  onChange={(event) => setDescrizioneMod(event.target.value)}
                />
              </label>
              <label className="nl-field">
                <span className="nl-field__label">Data inserimento</span>
                <input
                  className="nl-field__input"
                  type="date"
                  value={dataMod}
                  onChange={(event) => setDataMod(event.target.value)}
                />
              </label>
            </div>
            <div className="nl-modal__footer">
              <button
                type="button"
                className="nl-button nl-button--ghost"
                onClick={() => setEditModalOpen(false)}
              >
                Annulla
              </button>
              <button
                type="button"
                className="nl-button nl-button--primary"
                onClick={() => void handleSaveEdit()}
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedSegnalazione ? (
        <div className="nl-modal__backdrop" role="presentation">
          <div className="nl-modal nl-modal--medium" role="dialog" aria-modal="true">
            <div className="nl-modal__header">
              <div>
                <div className="nl-modal__eyebrow">Segnalazione autista</div>
                <div className="nl-modal__title">Segnalazione originale</div>
              </div>
              <button
                type="button"
                className="nl-modal__close"
                onClick={() => setSelectedSegnalazione(null)}
              >
                ×
              </button>
            </div>
            <div className="nl-modal__body">
              <div className="nl-source-card">
                <div className="nl-source-grid">
                  <div>
                    <span className="nl-detail-card__label">Segnalato da</span>
                    <strong>
                      {safeText(
                        selectedSegnalazione.autistaNome ?? selectedSegnalazione.nomeAutista,
                      ) ||
                        safeText(selectedSegnalazione.badgeAutista ?? selectedSegnalazione.badge) ||
                        EMPTY_LABEL}
                    </strong>
                  </div>
                  <div>
                    <span className="nl-detail-card__label">Data e ora</span>
                    <strong>
                      {formatSegnalazioneDateTime(
                        toTimestampValue(
                          selectedSegnalazione.timestamp ?? selectedSegnalazione.data,
                        ),
                      )}
                    </strong>
                  </div>
                  <div>
                    <span className="nl-detail-card__label">Mezzo coinvolto</span>
                    <strong>
                      {safeText(
                        selectedSegnalazione.targa ??
                          selectedSegnalazione.targaCamion ??
                          selectedSegnalazione.targaMotrice,
                      ) || EMPTY_LABEL}
                    </strong>
                  </div>
                  <div>
                    <span className="nl-detail-card__label">Stato</span>
                    <strong>{safeText(selectedSegnalazione.stato) || EMPTY_LABEL}</strong>
                  </div>
                  <div>
                    <span className="nl-detail-card__label">Tipo problema</span>
                    <strong>
                      {safeText(
                        selectedSegnalazione.tipoProblema ??
                          selectedSegnalazione.tipo ??
                          selectedSegnalazione.titolo,
                      ) || EMPTY_LABEL}
                    </strong>
                  </div>
                  <div>
                    <span className="nl-detail-card__label">Foto allegate</span>
                    <strong>
                      {Array.isArray(selectedSegnalazione.fotoUrls)
                        ? selectedSegnalazione.fotoUrls.filter(Boolean).length
                        : 0}
                    </strong>
                  </div>
                </div>
                <div className="nl-source-card__body">
                  <span className="nl-detail-card__label">Descrizione reale</span>
                  <div className="nl-source-card__text">
                    {getSegnalazioneProblemText(selectedSegnalazione) ||
                      "Nessuna descrizione presente nella segnalazione originale"}
                  </div>
                </div>
              </div>
            </div>
            <div className="nl-modal__footer">
              <button
                type="button"
                className="nl-button nl-button--primary"
                onClick={() => setSelectedSegnalazione(null)}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedControllo ? (
        <div className="nl-modal__backdrop" role="presentation">
          <div className="nl-modal nl-modal--medium" role="dialog" aria-modal="true">
            <div className="nl-modal__header">
              <div>
                <div className="nl-modal__eyebrow">Controllo mezzo</div>
                <div className="nl-modal__title">Controllo originale</div>
              </div>
              <button
                type="button"
                className="nl-modal__close"
                aria-label="Chiudi modale controllo originale"
                onClick={() => setSelectedControllo(null)}
              >
                &times;
              </button>
            </div>
            <div className="nl-modal__body">
              <div className="nl-source-card">
                <div className="nl-source-grid">
                  <div>
                    <span className="nl-detail-card__label">Segnalato da</span>
                    <strong>
                      {safeText(
                        selectedControllo.autistaNome ?? selectedControllo.nomeAutista,
                      ) ||
                        safeText(selectedControllo.badgeAutista ?? selectedControllo.badge) ||
                        EMPTY_LABEL}
                    </strong>
                  </div>
                  <div>
                    <span className="nl-detail-card__label">Data e ora</span>
                    <strong>
                      {formatSegnalazioneDateTime(
                        toTimestampValue(selectedControllo.timestamp ?? selectedControllo.data),
                      )}
                    </strong>
                  </div>
                  <div>
                    <span className="nl-detail-card__label">Target</span>
                    <strong>{formatControlloTargetLabel(selectedControllo)}</strong>
                  </div>
                  <div>
                    <span className="nl-detail-card__label">Mezzo coinvolto</span>
                    <strong>{getControlloMezzoLabel(selectedControllo)}</strong>
                  </div>
                  <div>
                    <span className="nl-detail-card__label">Esito</span>
                    <strong>{isControlloKoRecord(selectedControllo) ? "KO" : "OK"}</strong>
                  </div>
                  <div>
                    <span className="nl-detail-card__label">Check KO</span>
                    <strong>
                      {getControlloKoList(selectedControllo).length > 0
                        ? getControlloKoList(selectedControllo).join(", ")
                        : EMPTY_LABEL}
                    </strong>
                  </div>
                </div>
                <div className="nl-source-card__body">
                  <span className="nl-detail-card__label">Nota / esito reale</span>
                  <div className="nl-source-card__text">
                    {getControlloProblemText(selectedControllo) ||
                      "Nessuna nota presente nel controllo originale"}
                  </div>
                </div>
              </div>
            </div>
            <div className="nl-modal__footer">
              <button
                type="button"
                className="nl-button nl-button--primary"
                onClick={() => setSelectedControllo(null)}
              >
                Chiudi
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
        onShare={handleSharePDF}
        onCopyLink={handleCopyPDFText}
        onWhatsApp={handleWhatsAppPDF}
      />
    </div>
  );
}

export default function NextDettaglioLavoroPage() {
  const navigate = useNavigate();
  const { lavoroId: paramId } = useParams<{ lavoroId?: string }>();
  const [searchParams] = useSearchParams();
  const lavoroId = searchParams.get("lavoroId") || paramId || "";
  const from = searchParams.get("from");

  const handleClose = () => {
    navigate(resolveBackPath(from));
  };

  return (
    <div className="nl-page">
      <div className="nl-shell">
        <NextLavoriRealDetailView lavoroId={lavoroId} onClose={handleClose} />
      </div>
    </div>
  );
}
