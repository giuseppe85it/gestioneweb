import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import PdfPreviewModal from "../components/PdfPreviewModal";
import { NextLavoriRealDetailView } from "./NextDettaglioLavoroPage";
import { formatDateUI } from "../utils/dateFormat";
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
import type { Lavoro, TipoLavoro, Urgenza } from "../types/lavori";
import { isLavoroEseguito, isLavoroInAttesaGlobal } from "../utils/lavoriSelectors";
import "./next-lavori.css";

type NextLavoriTab = "in-attesa" | "eseguiti" | "aggiungi";

type NextLavoriUnifiedDashboardProps = {
  forcedTab?: NextLavoriTab;
};

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

type TableRow = {
  item: Lavoro;
  mezzo: MezzoLite | null;
};

const LAVORI_KEY = "@lavori";
const MEZZI_KEY = "@mezzi_aziendali";

const TAB_LABELS: Record<NextLavoriTab, string> = {
  "in-attesa": "In attesa",
  eseguiti: "Eseguiti",
  aggiungi: "Aggiungi",
};

const normalizeTarga = (value?: string | null) =>
  String(value ?? "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .trim();

const toLavoriArray = (value: unknown): Lavoro[] =>
  Array.isArray(value) ? (value as Lavoro[]) : [];

const toMezziArray = (value: unknown): MezzoLite[] =>
  Array.isArray(value) ? (value as MezzoLite[]) : [];

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
  String(item?.segnalatoDa ?? "").trim() || "—";

const getAutistaSolitoLabel = (mezzo?: MezzoLite | null) => {
  if (!mezzo) return "—";

  const objectName =
    mezzo.autista && typeof mezzo.autista === "object"
      ? String(mezzo.autista.nome ?? "").trim()
      : "";
  const directValue =
    typeof mezzo.autista === "string" ? String(mezzo.autista).trim() : objectName;

  return String(mezzo.autistaNome ?? mezzo.nomeAutista ?? directValue ?? "").trim() || "—";
};

const getUrgencyLabel = (urgenza?: Urgenza) => {
  if (urgenza === "alta") return "Alta";
  if (urgenza === "media") return "Media";
  if (urgenza === "bassa") return "Bassa";
  return "Media";
};

const getUrgencyClass = (urgenza?: Urgenza) => {
  if (urgenza === "alta") return "nl-badge nl-badge--alta";
  if (urgenza === "bassa") return "nl-badge nl-badge--bassa";
  return "nl-badge nl-badge--media";
};

const getStatusBadgeClass = (value: "in-attesa" | "eseguito") =>
  value === "eseguito" ? "nl-badge nl-badge--success" : "nl-badge nl-badge--info";

const getStatusLabel = (value: "in-attesa" | "eseguito") =>
  value === "eseguito" ? "Eseguito" : "In attesa";

const getPriorityRowClass = (urgenza?: Urgenza) => {
  if (urgenza === "alta") return "nl-row-priority--alta";
  if (urgenza === "bassa") return "nl-row-priority--bassa";
  return "nl-row-priority--media";
};

const formatFileDate = () => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const buildPendingPdfRows = (rows: TableRow[]) =>
  rows.map(({ item, mezzo }) => ({
    Mezzo: item.targa || "Magazzino",
    Descrizione: item.descrizione,
    "Segnalato da": getSegnalatoDaLabel(item),
    "Autista solito": getAutistaSolitoLabel(mezzo),
    Tipo: item.tipo === "magazzino" ? "Magazzino" : "Targa",
    Urgenza: getUrgencyLabel(item.urgenza),
    Inserimento: formatDateUI(item.dataInserimento ?? null),
    Stato: getStatusLabel("in-attesa"),
  }));

const buildDonePdfRows = (rows: TableRow[]) =>
  rows.map(({ item, mezzo }) => ({
    Mezzo: item.targa || "Magazzino",
    Descrizione: item.descrizione,
    "Segnalato da": getSegnalatoDaLabel(item),
    "Autista solito": getAutistaSolitoLabel(mezzo),
    "Urgenza originale": getUrgencyLabel(item.urgenza),
    Inserimento: formatDateUI(item.dataInserimento ?? null),
    Esecuzione: formatDateUI(item.dataEsecuzione ?? null),
    "Eseguito da": item.chiHaEseguito || "—",
  }));

const getMonthToken = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${mm}`;
};

const getMonthLabel = (value: string) => {
  if (!value) return "Tutti i mesi";
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });
};

const getEsecutoreInitials = (value?: string | null) => {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "—";
  const initials = normalized
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return initials || "—";
};

const todayInputValue = () => new Date().toISOString().substring(0, 10);

async function loadLavoriData() {
  const [lavoriValue, mezziValue] = await Promise.all([
    getItemSync(LAVORI_KEY),
    getItemSync(MEZZI_KEY),
  ]);

  const mezzi = toMezziArray(mezziValue);
  const mezziByTarga = new Map<string, MezzoLite>();
  mezzi.forEach((entry) => {
    const key = normalizeTarga(entry.targa ?? entry.mezzoTarga ?? "");
    if (key) {
      mezziByTarga.set(key, entry);
    }
  });

  return {
    lavori: toLavoriArray(lavoriValue),
    mezzi,
    mezziByTarga,
  };
}

function resolveActiveTab(
  pathname: string,
  queryTab: string | null,
  forcedTab?: NextLavoriTab,
): NextLavoriTab {
  if (forcedTab) return forcedTab;
  if (pathname.endsWith("/lavori-in-attesa")) return "in-attesa";
  if (pathname.endsWith("/lavori-eseguiti")) return "eseguiti";
  if (queryTab === "aggiungi") return "aggiungi";
  if (queryTab === "eseguiti") return "eseguiti";
  return "in-attesa";
}

export function NextLavoriUnifiedDashboard({
  forcedTab,
}: NextLavoriUnifiedDashboardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mezzi, setMezzi] = useState<MezzoLite[]>([]);
  const [mezziByTarga, setMezziByTarga] = useState<Map<string, MezzoLite>>(
    () => new Map(),
  );
  const [allLavori, setAllLavori] = useState<Lavoro[]>([]);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);

  const [tipo, setTipo] = useState<TipoLavoro>("magazzino");
  const [targa, setTarga] = useState("");
  const [filtroTarga, setFiltroTarga] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [dataInserimento, setDataInserimento] = useState(todayInputValue());
  const [urgenza, setUrgenza] = useState<Urgenza>("bassa");
  const [listaTemporanei, setListaTemporanei] = useState<Lavoro[]>([]);
  const [gruppoIdCorrente, setGruppoIdCorrente] = useState<string | null>(null);

  const [pendingSearch, setPendingSearch] = useState("");
  const [pendingUrgencyFilter, setPendingUrgencyFilter] = useState("tutte");
  const [pendingTypeFilter, setPendingTypeFilter] = useState("tutti");
  const [doneSearch, setDoneSearch] = useState("");
  const [doneMonthFilter, setDoneMonthFilter] = useState("tutti");
  const [doneTypeFilter, setDoneTypeFilter] = useState("tutti");

  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState("lavori.pdf");
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState("Anteprima PDF lavori");
  const [pdfShareHint, setPdfShareHint] = useState<string | null>(null);

  const activeTab = resolveActiveTab(
    location.pathname,
    searchParams.get("tab"),
    forcedTab,
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { lavori, mezzi: nextMezzi, mezziByTarga: nextMezziByTarga } =
        await loadLavoriData();
      setAllLavori(lavori);
      setMezzi(nextMezzi);
      setMezziByTarga(nextMezziByTarga);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossibile leggere i lavori.",
      );
      setAllLavori([]);
      setMezzi([]);
      setMezziByTarga(new Map());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    return () => {
      revokePdfPreviewUrl(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const pendingItems = useMemo(
    () =>
      allLavori
        .filter((entry) => isLavoroInAttesaGlobal(entry))
        .sort(
          (left, right) =>
            new Date(right.dataInserimento || "").getTime() -
            new Date(left.dataInserimento || "").getTime(),
        ),
    [allLavori],
  );

  const doneItems = useMemo(
    () =>
      allLavori
        .filter((entry) => isLavoroEseguito(entry))
        .sort(
          (left, right) =>
            new Date(right.dataEsecuzione || right.dataInserimento || "").getTime() -
            new Date(left.dataEsecuzione || left.dataInserimento || "").getTime(),
        ),
    [allLavori],
  );

  const pendingRows = useMemo<TableRow[]>(
    () =>
      pendingItems.map((item) => ({
        item,
        mezzo: item.targa
          ? mezziByTarga.get(normalizeTarga(item.targa)) ?? null
          : null,
      })),
    [pendingItems, mezziByTarga],
  );

  const doneRows = useMemo<TableRow[]>(
    () =>
      doneItems.map((item) => ({
        item,
        mezzo: item.targa
          ? mezziByTarga.get(normalizeTarga(item.targa)) ?? null
          : null,
      })),
    [doneItems, mezziByTarga],
  );

  const pendingSearchNorm = normalizeTarga(pendingSearch);
  const doneSearchNorm = normalizeTarga(doneSearch);

  const filteredPendingRows = useMemo(
    () =>
      pendingRows.filter(({ item }) => {
        const matchesSearch =
          !pendingSearchNorm ||
          normalizeTarga(item.targa).includes(pendingSearchNorm) ||
          item.descrizione.toUpperCase().includes(pendingSearchNorm);
        const matchesUrgency =
          pendingUrgencyFilter === "tutte" || item.urgenza === pendingUrgencyFilter;
        const matchesType =
          pendingTypeFilter === "tutti" || item.tipo === pendingTypeFilter;
        return matchesSearch && matchesUrgency && matchesType;
      }),
    [pendingRows, pendingSearchNorm, pendingUrgencyFilter, pendingTypeFilter],
  );

  const filteredDoneRows = useMemo(
    () =>
      doneRows.filter(({ item }) => {
        const matchesSearch =
          !doneSearchNorm ||
          normalizeTarga(item.targa).includes(doneSearchNorm) ||
          item.descrizione.toUpperCase().includes(doneSearchNorm);
        const matchesType = doneTypeFilter === "tutti" || item.tipo === doneTypeFilter;
        const monthToken = getMonthToken(item.dataEsecuzione || item.dataInserimento);
        const matchesMonth =
          doneMonthFilter === "tutti" || monthToken === doneMonthFilter;
        return matchesSearch && matchesType && matchesMonth;
      }),
    [doneRows, doneMonthFilter, doneSearchNorm, doneTypeFilter],
  );

  const availableMonths = useMemo(() => {
    const tokens = Array.from(
      new Set(
        doneRows
          .map(({ item }) => getMonthToken(item.dataEsecuzione || item.dataInserimento))
          .filter(Boolean),
      ),
    );
    return tokens.sort((left, right) => right.localeCompare(left));
  }, [doneRows]);

  const stats = useMemo(() => {
    const pendingHigh = pendingItems.filter((item) => item.urgenza === "alta").length;
    const uniquePendingGroups = new Set(
      pendingItems.map((item) => item.gruppoId || `single:${item.id}`),
    ).size;
    const doneCurrentMonth = doneItems.filter((item) => {
      if (!item.dataEsecuzione) return false;
      return getMonthToken(item.dataEsecuzione) === getMonthToken(new Date().toISOString());
    }).length;

    return [
      {
        label: "Lavori in attesa",
        value: String(pendingItems.length),
        sub: `${uniquePendingGroups} gruppi aperti`,
      },
      {
        label: "Lavori eseguiti",
        value: String(doneItems.length),
        sub: `${doneCurrentMonth} chiusi nel mese corrente`,
      },
      {
        label: "Alta priorità",
        value: String(pendingHigh),
        sub: "Interventi da seguire subito",
      },
      {
        label: "Voci temporanee",
        value: String(listaTemporanei.length),
        sub: gruppoIdCorrente ? "Gruppo pronto al salvataggio" : "Nessun gruppo aperto",
      },
    ];
  }, [doneItems, gruppoIdCorrente, listaTemporanei.length, pendingItems]);

  const mezziSuggestions = useMemo(() => {
    const query = normalizeTarga(filtroTarga || targa);
    if (!query) {
      return mezzi.slice(0, 6);
    }

    return mezzi
      .filter((entry) =>
        normalizeTarga(entry.targa ?? entry.mezzoTarga ?? "").includes(query),
      )
      .slice(0, 6);
  }, [filtroTarga, mezzi, targa]);

  const goToTab = (tab: NextLavoriTab) => {
    if (tab === "in-attesa") {
      navigate("/next/lavori-in-attesa");
      return;
    }
    if (tab === "eseguiti") {
      navigate("/next/lavori-eseguiti");
      return;
    }
    navigate("/next/lavori-da-eseguire?tab=aggiungi");
  };

  const openDetail = (itemId: string) => {
    setSelectedDetailId(itemId);
  };

  const closeDetail = () => {
    setSelectedDetailId(null);
  };

  const resetForm = () => {
    setTipo("magazzino");
    setTarga("");
    setFiltroTarga("");
    setDescrizione("");
    setDataInserimento(todayInputValue());
    setUrgenza("bassa");
    setListaTemporanei([]);
    setGruppoIdCorrente(null);
  };

  const aggiungiLavoro = () => {
    if (!descrizione.trim()) {
      window.alert("Inserisci una descrizione");
      return;
    }

    if (tipo === "targa" && !targa.trim()) {
      window.alert("Inserisci la targa");
      return;
    }

    const gruppoId = gruppoIdCorrente ?? uuidv4();
    if (!gruppoIdCorrente) {
      setGruppoIdCorrente(gruppoId);
    }

    const nuovo: Lavoro = {
      id: uuidv4(),
      gruppoId,
      tipo,
      targa: tipo === "targa" ? targa.toUpperCase() : "",
      descrizione: descrizione.trim(),
      dataInserimento,
      eseguito: false,
      urgenza,
      segnalatoDa: "utente",
      sottoElementi: [],
    };

    setListaTemporanei((current) => [...current, nuovo]);
    setDescrizione("");
    setTarga("");
    setFiltroTarga("");
    setUrgenza("bassa");
    setNotice(`Voce "${nuovo.descrizione}" aggiunta al gruppo temporaneo.`);
  };

  const removeTempItem = (itemId: string) => {
    setListaTemporanei((current) => current.filter((entry) => entry.id !== itemId));
  };

  const salvaGruppo = async () => {
    if (listaTemporanei.length === 0) {
      window.alert("Non ci sono lavori da salvare");
      return;
    }

    const esistenti = toLavoriArray(await getItemSync(LAVORI_KEY));
    const nuovi = [...esistenti, ...listaTemporanei];
    await setItemSync(LAVORI_KEY, nuovi);
    setNotice(`Gruppo lavori salvato (${listaTemporanei.length} voci).`);
    resetForm();
    await loadAll();
    navigate("/next/lavori-in-attesa");
  };

  const closePdfPreview = () => {
    revokePdfPreviewUrl(pdfPreviewUrl);
    setPdfPreviewOpen(false);
    setPdfPreviewUrl(null);
    setPdfPreviewBlob(null);
    setPdfShareHint(null);
  };

  const buildPdfShareMessage = () =>
    buildPdfShareText({
      contextLabel: pdfPreviewTitle,
      dateLabel: formatFileDate(),
      fileName: pdfPreviewFileName || "lavori.pdf",
      url: pdfPreviewUrl,
    });

  const handleSharePDF = async () => {
    if (!pdfPreviewBlob) {
      const copied = await copyTextToClipboard(buildPdfShareMessage());
      setPdfShareHint(copied ? "Link copiato." : "Apri prima un'anteprima PDF.");
      return;
    }

    const result = await sharePdfFile({
      blob: pdfPreviewBlob,
      fileName: pdfPreviewFileName || "lavori.pdf",
      title: pdfPreviewTitle || "Anteprima PDF lavori",
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
    window.open(
      buildWhatsAppShareUrl(buildPdfShareMessage()),
      "_blank",
      "noopener,noreferrer",
    );
  };

  const openPendingPdf = async () => {
    const rows = buildPendingPdfRows(filteredPendingRows);
    const columns = [
      "Mezzo",
      "Descrizione",
      "Segnalato da",
      "Autista solito",
      "Tipo",
      "Urgenza",
      "Inserimento",
      "Stato",
    ];

    try {
      const fileDate = formatFileDate();
      const preview = await openPreview({
        source: async () =>
          generateSmartPDFBlob({
            kind: "table",
            title: "Lavori in attesa",
            rows,
            columns,
            orientation: "landscape",
            fontSize: 8,
            tableWidth: "auto",
            overflow: "linebreak",
          }),
        fileName: `lavori-in-attesa-${fileDate}.pdf`,
        previousUrl: pdfPreviewUrl,
      });
      setPdfShareHint(null);
      setPdfPreviewBlob(preview.blob);
      setPdfPreviewFileName(preview.fileName);
      setPdfPreviewTitle("Anteprima PDF lavori in attesa");
      setPdfPreviewUrl(preview.url);
      setPdfPreviewOpen(true);
    } catch (previewError) {
      console.error("Errore anteprima PDF lavori in attesa:", previewError);
    }
  };

  const openDonePdf = async () => {
    const rows = buildDonePdfRows(filteredDoneRows);
    const columns = [
      "Mezzo",
      "Descrizione",
      "Segnalato da",
      "Autista solito",
      "Urgenza originale",
      "Inserimento",
      "Esecuzione",
      "Eseguito da",
    ];

    try {
      const fileDate = formatFileDate();
      const preview = await openPreview({
        source: async () =>
          generateSmartPDFBlob({
            kind: "table",
            title: "Lavori eseguiti",
            rows,
            columns,
            orientation: "landscape",
            fontSize: 8,
            tableWidth: "auto",
            overflow: "linebreak",
          }),
        fileName: `lavori-eseguiti-${fileDate}.pdf`,
        previousUrl: pdfPreviewUrl,
      });
      setPdfShareHint(null);
      setPdfPreviewBlob(preview.blob);
      setPdfPreviewFileName(preview.fileName);
      setPdfPreviewTitle("Anteprima PDF lavori eseguiti");
      setPdfPreviewUrl(preview.url);
      setPdfPreviewOpen(true);
    } catch (previewError) {
      console.error("Errore anteprima PDF lavori eseguiti:", previewError);
    }
  };

  return (
    <div className="nl-page">
      <div className="nl-shell">
        <header className="nl-topbar">
          <div>
            <div className="nl-topbar__eyebrow">Operatività</div>
            <h1 className="nl-topbar__title">Lavori</h1>
          </div>

          <div className="nl-tabs" role="tablist" aria-label="Navigazione lavori">
            {(["in-attesa", "eseguiti", "aggiungi"] as NextLavoriTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                className={`nl-tab ${activeTab === tab ? "is-active" : ""}`}
                onClick={() => goToTab(tab)}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </header>

        <section className="nl-stats">
          {stats.map((stat) => (
            <article key={stat.label} className="nl-stat-card">
              <div className="nl-stat-card__label">{stat.label}</div>
              <div className="nl-stat-card__value">{stat.value}</div>
              <div className="nl-stat-card__sub">{stat.sub}</div>
            </article>
          ))}
        </section>

        {notice ? <div className="nl-inline-notice">{notice}</div> : null}
        {error ? <div className="nl-empty">{error}</div> : null}
        {loading ? <div className="nl-empty">Caricamento lavori...</div> : null}

        {!loading && activeTab === "in-attesa" ? (
          <section className="nl-card">
            <div className="nl-card__header">
              <div>
                <h2 className="nl-card__title">Lavori in attesa</h2>
                <div className="nl-card__subtitle">
                  Vista unificata con dati e azioni reali del modulo Lavori.
                </div>
              </div>
              <div className="nl-card__actions">
                <button
                  type="button"
                  className="nl-button nl-button--ghost"
                  onClick={() => void openPendingPdf()}
                >
                  Export PDF
                </button>
                <button
                  type="button"
                  className="nl-button nl-button--primary"
                  onClick={() => goToTab("aggiungi")}
                >
                  + Aggiungi
                </button>
              </div>
            </div>

            <div className="nl-filters">
              <input
                className="nl-field__input"
                type="text"
                placeholder="Cerca per targa o descrizione"
                value={pendingSearch}
                onChange={(event) => setPendingSearch(event.target.value)}
              />
              <select
                className="nl-field__input"
                value={pendingUrgencyFilter}
                onChange={(event) => setPendingUrgencyFilter(event.target.value)}
              >
                <option value="tutte">Tutte le urgenze</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="bassa">Bassa</option>
              </select>
              <select
                className="nl-field__input"
                value={pendingTypeFilter}
                onChange={(event) => setPendingTypeFilter(event.target.value)}
              >
                <option value="tutti">Tutti i tipi</option>
                <option value="targa">Targa</option>
                <option value="magazzino">Magazzino</option>
              </select>
            </div>

            <div className="nl-table-wrap">
              <table className="nl-table">
                <thead>
                  <tr>
                    <th>Mezzo</th>
                    <th>Descrizione lavoro</th>
                    <th>Tipo</th>
                    <th>Urgenza</th>
                    <th>Data</th>
                    <th>Stato</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPendingRows.map(({ item, mezzo }) => (
                    <tr key={item.id} className={getPriorityRowClass(item.urgenza)}>
                      <td>
                        <div className="nl-mezzo-cell">
                          <div className="nl-mezzo-cell__photo">
                            {getMezzoPhoto(mezzo) ? (
                              <img
                                src={getMezzoPhoto(mezzo)}
                                alt={item.targa || "Magazzino"}
                                className="nl-mezzo-cell__photo-img"
                              />
                            ) : (
                              <div className="nl-mezzo-cell__photo-placeholder">
                                {item.targa ? "MEZZO" : "MAG"}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="nl-mezzo-cell__title">
                              {item.targa || "Magazzino"}
                            </div>
                            <div className="nl-mezzo-cell__meta">
                              {getMezzoMeta(mezzo) || "Nessun dettaglio mezzo"}
                            </div>
                            <div className="nl-mezzo-cell__meta nl-mezzo-cell__meta--secondary">
                              Autista solito: {getAutistaSolitoLabel(mezzo)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="nl-cell-stack">
                          <div className="nl-cell-stack__title">{item.descrizione}</div>
                          <div className="nl-cell-stack__meta">
                            Segnalato da: {getSegnalatoDaLabel(item)}
                          </div>
                        </div>
                      </td>
                      <td>{item.tipo === "magazzino" ? "Magazzino" : "Targa"}</td>
                      <td>
                        <span className={getUrgencyClass(item.urgenza)}>
                          {getUrgencyLabel(item.urgenza)}
                        </span>
                      </td>
                      <td>{formatDateUI(item.dataInserimento ?? null)}</td>
                      <td>
                        <span className={getStatusBadgeClass("in-attesa")}>
                          {getStatusLabel("in-attesa")}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="nl-link-button"
                          onClick={() => openDetail(item.id)}
                        >
                          Dettaglio →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredPendingRows.length === 0 ? (
                <div className="nl-empty">Nessun lavoro in attesa per i filtri correnti.</div>
              ) : null}
            </div>
          </section>
        ) : null}

        {!loading && activeTab === "eseguiti" ? (
          <section className="nl-card">
            <div className="nl-card__header">
              <div>
                <h2 className="nl-card__title">Lavori eseguiti</h2>
                <div className="nl-card__subtitle">
                  Storico lavori con le stesse letture e gli stessi dettagli reali.
                </div>
              </div>
              <div className="nl-card__actions">
                <button
                  type="button"
                  className="nl-button nl-button--ghost"
                  onClick={() => void openDonePdf()}
                >
                  Export PDF
                </button>
              </div>
            </div>

            <div className="nl-filters">
              <input
                className="nl-field__input"
                type="text"
                placeholder="Cerca per targa o descrizione"
                value={doneSearch}
                onChange={(event) => setDoneSearch(event.target.value)}
              />
              <select
                className="nl-field__input"
                value={doneMonthFilter}
                onChange={(event) => setDoneMonthFilter(event.target.value)}
              >
                <option value="tutti">Tutti i mesi</option>
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {getMonthLabel(month)}
                  </option>
                ))}
              </select>
              <select
                className="nl-field__input"
                value={doneTypeFilter}
                onChange={(event) => setDoneTypeFilter(event.target.value)}
              >
                <option value="tutti">Tutti i tipi</option>
                <option value="targa">Targa</option>
                <option value="magazzino">Magazzino</option>
              </select>
            </div>

            <div className="nl-table-wrap">
              <table className="nl-table">
                <thead>
                  <tr>
                    <th>Mezzo</th>
                    <th>Descrizione lavoro</th>
                    <th>Tipo</th>
                    <th>Urgenza originale</th>
                    <th>Data esecuzione</th>
                    <th>Eseguito da</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDoneRows.map(({ item, mezzo }) => (
                    <tr key={item.id} className={getPriorityRowClass(item.urgenza)}>
                      <td>
                        <div className="nl-mezzo-cell">
                          <div className="nl-mezzo-cell__photo">
                            {getMezzoPhoto(mezzo) ? (
                              <img
                                src={getMezzoPhoto(mezzo)}
                                alt={item.targa || "Magazzino"}
                                className="nl-mezzo-cell__photo-img"
                              />
                            ) : (
                              <div className="nl-mezzo-cell__photo-placeholder">
                                {item.targa ? "MEZZO" : "MAG"}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="nl-mezzo-cell__title">
                              {item.targa || "Magazzino"}
                            </div>
                            <div className="nl-mezzo-cell__meta">
                              {getMezzoMeta(mezzo) || "Nessun dettaglio mezzo"}
                            </div>
                            <div className="nl-mezzo-cell__meta nl-mezzo-cell__meta--secondary">
                              Autista solito: {getAutistaSolitoLabel(mezzo)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="nl-cell-stack">
                          <div className="nl-cell-stack__title">{item.descrizione}</div>
                          <div className="nl-cell-stack__meta">
                            Segnalato da: {getSegnalatoDaLabel(item)}
                          </div>
                        </div>
                      </td>
                      <td>{item.tipo === "magazzino" ? "Magazzino" : "Targa"}</td>
                      <td>
                        <span className={getUrgencyClass(item.urgenza)}>
                          {getUrgencyLabel(item.urgenza)}
                        </span>
                      </td>
                      <td>{formatDateUI(item.dataEsecuzione ?? null)}</td>
                      <td>
                        <div className="nl-executor">
                          <span className="nl-executor__avatar">
                            {getEsecutoreInitials(item.chiHaEseguito)}
                          </span>
                          <span>{item.chiHaEseguito || "—"}</span>
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="nl-link-button"
                          onClick={() => openDetail(item.id)}
                        >
                          Dettaglio →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredDoneRows.length === 0 ? (
                <div className="nl-empty">Nessun lavoro eseguito per i filtri correnti.</div>
              ) : null}
            </div>
          </section>
        ) : null}

        {!loading && activeTab === "aggiungi" ? (
          <section className="nl-card">
            <div className="nl-card__header">
              <div>
                <h2 className="nl-card__title">Aggiungi gruppo lavori</h2>
                <div className="nl-card__subtitle">
                  Form reale del modulo attuale, mantenuto con salvataggio su dataset lavori.
                </div>
              </div>
            </div>

            <div className="nl-add-layout">
              <div className="nl-add-form">
                <div className="nl-add-switch">
                  <button
                    type="button"
                    className={`nl-toggle ${tipo === "magazzino" ? "is-active" : ""}`}
                    onClick={() => setTipo("magazzino")}
                  >
                    Magazzino
                  </button>
                  <button
                    type="button"
                    className={`nl-toggle ${tipo === "targa" ? "is-active" : ""}`}
                    onClick={() => setTipo("targa")}
                  >
                    Targa
                  </button>
                </div>

                <div className="nl-form-grid">
                  <label className="nl-field">
                    <span className="nl-field__label">Data</span>
                    <input
                      className="nl-field__input"
                      type="date"
                      value={dataInserimento}
                      onChange={(event) => setDataInserimento(event.target.value)}
                    />
                  </label>

                  {tipo === "targa" ? (
                    <label className="nl-field">
                      <span className="nl-field__label">Targa mezzo</span>
                      <div className="nl-autocomplete">
                        <input
                          className="nl-field__input"
                          type="text"
                          placeholder="Inserisci targa"
                          value={targa}
                          onChange={(event) => {
                            const value = event.target.value.toUpperCase();
                            setTarga(value);
                            setFiltroTarga(value);
                          }}
                        />
                        {filtroTarga.length > 0 ? (
                          <div className="nl-autocomplete__menu">
                            {mezziSuggestions.map((mezzo) => (
                              <button
                                key={mezzo.id || mezzo.targa || mezzo.mezzoTarga}
                                type="button"
                                className="nl-autocomplete__item"
                                onClick={() => {
                                  setTarga(mezzo.targa || mezzo.mezzoTarga || "");
                                  setFiltroTarga("");
                                }}
                              >
                                {(mezzo.targa || mezzo.mezzoTarga || "—").toUpperCase()} ·{" "}
                                {[mezzo.marca, mezzo.modello].filter(Boolean).join(" ")}
                              </button>
                            ))}
                            {mezziSuggestions.length === 0 ? (
                              <div className="nl-autocomplete__empty">
                                Nessuna targa trovata
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </label>
                  ) : null}

                  <label className="nl-field nl-field--full">
                    <span className="nl-field__label">Descrizione voce lavoro</span>
                    <input
                      className="nl-field__input"
                      type="text"
                      placeholder="Descrizione lavoro"
                      value={descrizione}
                      onChange={(event) => setDescrizione(event.target.value)}
                    />
                  </label>
                </div>

                <div className="nl-urgency-switch">
                  {(["bassa", "media", "alta"] as Urgenza[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`nl-urgency-choice nl-urgency-choice--${value} ${urgenza === value ? "is-active" : ""}`}
                      onClick={() => setUrgenza(value)}
                    >
                      {getUrgencyLabel(value)}
                    </button>
                  ))}
                </div>

                <div className="nl-card__actions">
                  <button
                    type="button"
                    className="nl-button nl-button--ghost"
                    onClick={resetForm}
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    className="nl-button nl-button--primary"
                    onClick={aggiungiLavoro}
                  >
                    + Aggiungi voce
                  </button>
                </div>
              </div>

              <div className="nl-temp-list">
                <div className="nl-temp-list__header">
                  <div>
                    <h3 className="nl-temp-list__title">Voci del gruppo</h3>
                    <div className="nl-temp-list__sub">
                      {listaTemporanei.length === 0
                        ? "Nessuna voce temporanea"
                        : `${listaTemporanei.length} voci pronte al salvataggio`}
                    </div>
                  </div>
                </div>

                <div className="nl-temp-list__rows">
                  {listaTemporanei.map((entry) => (
                    <div key={entry.id} className="nl-temp-item">
                      <div>
                        <div className="nl-temp-item__title">{entry.descrizione}</div>
                        <div className="nl-temp-item__meta">
                          {entry.targa || "Magazzino"} · {formatDateUI(entry.dataInserimento)}
                        </div>
                      </div>
                      <div className="nl-temp-item__actions">
                        <span className={getUrgencyClass(entry.urgenza)}>
                          {getUrgencyLabel(entry.urgenza)}
                        </span>
                        <button
                          type="button"
                          className="nl-link-button"
                          onClick={() => removeTempItem(entry.id)}
                        >
                          Rimuovi
                        </button>
                      </div>
                    </div>
                  ))}

                  {listaTemporanei.length === 0 ? (
                    <div className="nl-empty">Aggiungi una voce per creare il gruppo lavori.</div>
                  ) : null}
                </div>

                <div className="nl-card__actions">
                  <button
                    type="button"
                    className="nl-button nl-button--ghost"
                    onClick={resetForm}
                  >
                    Svuota
                  </button>
                  <button
                    type="button"
                    className="nl-button nl-button--primary"
                    onClick={() => void salvaGruppo()}
                  >
                    Salva gruppo lavori
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {selectedDetailId ? (
          <div className="nl-modal__backdrop" role="presentation">
            <div className="nl-modal nl-modal--detail" role="dialog" aria-modal="true">
              <NextLavoriRealDetailView
                lavoroId={selectedDetailId}
                embedded
                onClose={closeDetail}
                onMutationComplete={loadAll}
              />
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
    </div>
  );
}

export default function NextLavoriDaEseguirePage() {
  return <NextLavoriUnifiedDashboard />;
}
