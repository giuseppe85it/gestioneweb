import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PdfPreviewModal from "../components/PdfPreviewModal";
import { formatDateTimeUI, formatDateUI } from "./nextDateFormat";
import { generateDossierMezzoPDFBlob } from "../utils/pdfEngine";
import {
  buildPdfShareText,
  buildWhatsAppShareUrl,
  copyTextToClipboard,
  openPreview,
  revokePdfPreviewUrl,
  sharePdfFile,
} from "../utils/pdfPreview";
import "../pages/DossierMezzo.css";
import "./next-shell.css";
import NextMezzoEditModal from "./components/NextMezzoEditModal";
import { FraseStoriaRecord } from "./components/FraseStoriaRecord";
import {
  buildNextDossierMezzoLegacyView,
  readNextDossierMezzoCompositeSnapshot,
  type NextDossierFatturaPreventivoLegacyItem,
  type NextDossierLegacyWorkItem,
  type NextDossierManutenzioneLegacyItem,
  type NextDossierMezzoLegacyViewState,
} from "./domain/nextDossierMezzoDomain";
import { recordChiusoFromRaw } from "./helpers/frasestoriaRecord";
import { deleteNextDocumentoCosto } from "./domain/nextDocumentiCostiDomain";
import {
  buildNextAnalisiEconomicaPath,
  buildNextCentroControlloRifornimentiPath,
  buildNextManutenzioniPath,
  NEXT_DOSSIER_LISTA_PATH,
  NEXT_IA_DOCUMENTI_PATH,
} from "./nextStructuralPaths";
import { runWithCloneWriteScopedAllowance } from "../utils/cloneWriteBarrier";
import { toDisplay } from "./helpers/dateUnica";

type Currency = "EUR" | "CHF" | "UNKNOWN";

const CLONE_READ_ONLY_PREVENTIVO_DELETE_MESSAGE =
  "Clone read-only: eliminazione preventivo non disponibile.";
const DOSSIER_DELETE_SIMPLE_MESSAGE = "Eliminare questa fattura?";
const DOSSIER_DELETE_LINKED_MESSAGE =
  "Questa fattura ha una manutenzione collegata. Eliminando la fattura la manutenzione rimarra. Confermi l'eliminazione?";

function readErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function parseDateFlexible(value: string | number | null | undefined): Date | null {
  if (!value) return null;
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const raw = String(value).trim();
  if (!raw) return null;
  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;
  const dmy = raw.match(/^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})$/);
  if (!dmy) return null;
  const yearRaw = Number(dmy[3]);
  const year = dmy[3].length === 2 ? Number(`20${yearRaw}`) : yearRaw;
  const date = new Date(year, Number(dmy[2]) - 1, Number(dmy[1]), 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value: string | number | null | undefined) {
  return formatDateTimeUI(parseDateFlexible(value));
}

function formatDossierDate(value: string | number | null | undefined): string {
  return toDisplay(value) || String(value ?? "").trim() || "-";
}

function formatChiusuraEventoTipo(value: string | null | undefined): string {
  if (value === "gomme_evento") return "cambio gomme";
  if (value === "manutenzione_eseguita") return "manutenzione eseguita";
  return value ? value.replace(/_/g, " ") : "evento";
}

function dossierWorkBadgeLabel(item: NextDossierLegacyWorkItem, fallback: string): string {
  return item.stato === "chiusa_da_evento" ? "CHIUSA DA EVENTO" : fallback;
}

function dossierWorkBadgeClass(item: NextDossierLegacyWorkItem, fallback: string): string {
  return item.stato === "chiusa_da_evento" ? "badge-info" : fallback;
}

function dossierWorkBadgeStyle(item: NextDossierLegacyWorkItem): CSSProperties | undefined {
  if (item.stato !== "chiusa_da_evento") return undefined;
  return { background: "#f3f4f6", color: "#374151", borderColor: "#d1d5db" };
}

function dossierWorkBadgeTitle(item: NextDossierLegacyWorkItem): string | undefined {
  if (item.stato !== "chiusa_da_evento") return undefined;
  const evento = formatChiusuraEventoTipo(item.chiusuraDi);
  const data = item.chiusuraData ? formatDateTimeUI(item.chiusuraData) : "-";
  return data && data !== "-"
    ? `Chiusa dal ${evento} del ${data}`
    : `Chiusa dal ${evento}`;
}

function detectCurrency(input: unknown): Currency {
  if (!input) return "UNKNOWN";
  const text = String(input).toUpperCase();
  if (text.includes("CHF") || text.includes("FR.")) return "CHF";
  if (text.includes("EUR") || text.includes("EURO")) return "EUR";
  return "UNKNOWN";
}

function resolveCurrency(record: NextDossierFatturaPreventivoLegacyItem): Currency {
  const direct = detectCurrency(record.valuta ?? record.currency);
  if (direct !== "UNKNOWN") return direct;
  return detectCurrency([record.importo, record.descrizione, record.fornitoreLabel].filter(Boolean).join(" "));
}

function renderAmount(value: number | undefined, currency: Currency) {
  if (typeof value !== "number" || Number.isNaN(value)) return "Importo n/d";
  return currency === "UNKNOWN" ? `${value.toFixed(2)} (valuta da verificare)` : `${value.toFixed(2)} ${currency}`;
}

function buildTotals(items: NextDossierFatturaPreventivoLegacyItem[]) {
  return items.reduce(
    (acc, item) => {
      const amount = typeof item.importo === "number" && Number.isFinite(item.importo) ? item.importo : 0;
      const currency = resolveCurrency(item);
      if (currency === "CHF") acc.chf += amount;
      else if (currency === "EUR") acc.eur += amount;
      else if (amount > 0) acc.unknown += 1;
      return acc;
    },
    { chf: 0, eur: 0, unknown: 0 },
  );
}

function formatKmOre(item: NextDossierManutenzioneLegacyItem) {
  const parts: string[] = [];
  if (typeof item.km === "number" && Number.isFinite(item.km)) parts.push(`${item.km} km`);
  if (typeof item.ore === "number" && Number.isFinite(item.ore)) parts.push(`${item.ore} ore`);
  return parts.join(" | ") || "-";
}

function formatGommePerAsseMeta(item: NextDossierMezzoLegacyViewState["gommePerAsse"][number]) {
  const parts: string[] = [];
  parts.push(item.dataCambio ? `Cambio ${formatDossierDate(item.dataCambio)}` : "Data cambio n/d");
  if (item.isMotorizzato) {
    parts.push(
      typeof item.kmCambio === "number" && Number.isFinite(item.kmCambio)
        ? `${item.kmCambio} km`
        : "km cambio n/d",
    );
    if (typeof item.kmPercorsi === "number" && Number.isFinite(item.kmPercorsi)) {
      parts.push(`Percorsi ${item.kmPercorsi} km`);
    }
  }
  return parts.join(" | ");
}

function formatGommeStraordinarieMeta(
  item: NextDossierMezzoLegacyViewState["gommeStraordinarie"][number],
) {
  const parts: string[] = [];
  parts.push(formatDossierDate(item.dataLabel));
  if (item.asseLabel) parts.push(item.asseLabel);
  if (typeof item.quantita === "number" && Number.isFinite(item.quantita)) {
    parts.push(`${item.quantita} gomma${item.quantita === 1 ? "" : "e"}`);
  }
  if (item.fornitore) parts.push(item.fornitore);
  return parts.join(" | ");
}

const COMANDO_BAND_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  margin: "26px 2px 14px",
};

export default function NextDossierMezzoComandoPage() {
  const location = useLocation();
  const { targa } = useParams<{ targa: string }>();
  const navigate = useNavigate();
  const preventiviSectionRef = useRef<HTMLElement | null>(null);
  const [legacy, setLegacy] = useState<NextDossierMezzoLegacyViewState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<null | "attesa" | "eseguiti" | "manutenzioni" | "libretto" | "foto">(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfFileName, setPdfFileName] = useState("dossier-mezzo.pdf");
  const [pdfTitle, setPdfTitle] = useState("Anteprima PDF dossier mezzo");
  const [pdfHint, setPdfHint] = useState<string | null>(null);
  const [pdfContext, setPdfContext] = useState("Dossier mezzo");
  const [fatturaToDelete, setFatturaToDelete] =
    useState<NextDossierFatturaPreventivoLegacyItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const requestedSection = useMemo(
    () => location.hash.replace(/^#/, "").trim().toLowerCase(),
    [location.hash],
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!targa) {
        setError("Targa non specificata.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const nextSnapshot = await readNextDossierMezzoCompositeSnapshot(targa);
        if (cancelled) return;
        if (!nextSnapshot) {
          setLegacy(null);
          setError("Mezzo non trovato nel clone.");
          setLoading(false);
          return;
        }
        setLegacy(buildNextDossierMezzoLegacyView(nextSnapshot));
        setError(null);
        setLoading(false);
      } catch (loadError) {
        if (cancelled) return;
        setError(readErrorMessage(loadError, "Errore caricamento dossier mezzo clone."));
        setLegacy(null);
        setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [targa]);

  useEffect(() => () => revokePdfPreviewUrl(pdfUrl), [pdfUrl]);

  useEffect(() => {
    if (requestedSection !== "preventivi" || !legacy) {
      return undefined;
    }

    let timeoutId = 0;
    const scrollToPreventivi = () => {
      preventiviSectionRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
      timeoutId = window.setTimeout(() => {
        preventiviSectionRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
      }, 160);
    };

    const animationFrameId = window.requestAnimationFrame(scrollToPreventivi);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(timeoutId);
    };
  }, [legacy, requestedSection]);

  const mezzo = legacy?.mezzo ?? null;
  const docs = useMemo(() => legacy?.documentiCosti ?? [], [legacy]);
  const preventivi = useMemo(() => docs.filter((item) => item.tipo === "PREVENTIVO"), [docs]);
  const fatture = useMemo(() => docs.filter((item) => item.tipo === "FATTURA"), [docs]);
  const preventiviTotals = useMemo(() => buildTotals(preventivi), [preventivi]);
  const fattureTotals = useMemo(() => buildTotals(fatture), [fatture]);

  // --- Calcoli per la fascia "Centro di comando" (solo da dati gia caricati) ---
  const revisioneInfo = useMemo(() => {
    const d = parseDateFlexible(legacy?.mezzo?.dataScadenzaRevisione);
    if (!d) return { date: "-", days: null as number | null };
    const days = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
    return { date: formatDateUI(d), days };
  }, [legacy]);

  const costoAnno = useMemo(() => {
    const year = new Date().getFullYear();
    let chf = 0;
    let eur = 0;
    let unknown = 0;
    for (const item of docs) {
      const d = parseDateFlexible(item.data);
      if (!d || d.getFullYear() !== year) continue;
      const amount = typeof item.importo === "number" && Number.isFinite(item.importo) ? item.importo : 0;
      const cur = resolveCurrency(item);
      if (cur === "CHF") chf += amount;
      else if (cur === "EUR") eur += amount;
      else if (amount > 0) unknown += 1;
    }
    return { chf, eur, unknown, year };
  }, [docs]);

  const consumoMedio = useMemo(() => {
    const rows = (legacy?.rifornimenti ?? [])
      .filter((r) => typeof r.km === "number" && typeof r.litri === "number" && (r.km as number) > 0 && (r.litri as number) > 0)
      .map((r) => ({ km: r.km as number, litri: r.litri as number }))
      .sort((a, b) => a.km - b.km);
    if (rows.length < 2) return null;
    const kmTot = rows[rows.length - 1].km - rows[0].km;
    if (kmTot <= 0) return null;
    const litriTot = rows.slice(1).reduce((s, r) => s + r.litri, 0);
    if (litriTot <= 0) return null;
    return (litriTot / kmTot) * 100;
  }, [legacy]);

  const closePdf = () => {
    revokePdfPreviewUrl(pdfUrl);
    setPdfOpen(false);
    setPdfUrl(null);
    setPdfBlob(null);
    setPdfHint(null);
  };

  const buildShareMessage = () =>
    buildPdfShareText({
      contextLabel: pdfContext,
      dateLabel: formatDateUI(new Date()),
      fileName: pdfFileName,
      url: pdfUrl,
    });

  const onSharePdf = async () => {
    if (!pdfBlob) {
      const copied = await copyTextToClipboard(buildShareMessage());
      setPdfHint(copied ? "Link copiato." : "Apri prima un'anteprima PDF.");
      return;
    }
    const result = await sharePdfFile({
      blob: pdfBlob,
      fileName: pdfFileName,
      title: pdfTitle,
      text: buildShareMessage(),
    });
    if (result.status === "shared") {
      setPdfHint("PDF condiviso.");
      return;
    }
    if (result.status !== "aborted") {
      const copied = await copyTextToClipboard(buildShareMessage());
      setPdfHint(copied ? "Condivisione non disponibile: testo copiato." : "Condivisione non disponibile.");
    }
  };

  const openDocumentPdf = (url: string, title: string, fileName: string) => {
    revokePdfPreviewUrl(pdfUrl);
    setPdfBlob(null);
    setPdfUrl(url);
    setPdfOpen(true);
    setPdfTitle(title);
    setPdfFileName(fileName);
    setPdfContext(title);
    setPdfHint(null);
  };

  const openDossierPdf = async () => {
    if (!legacy || !mezzo) return;
    try {
      const preview = await openPreview({
        source: async () =>
          generateDossierMezzoPDFBlob({
            mezzo,
            mezzoFotoUrl: mezzo.fotoUrl ?? null,
            mezzoFotoStoragePath: mezzo.fotoStoragePath ?? mezzo.fotoPath ?? null,
            lavoriDaEseguire: legacy.lavoriDaEseguire,
            lavoriInAttesa: legacy.lavoriInAttesa,
            lavoriEseguiti: legacy.lavoriEseguiti,
            rifornimenti: legacy.rifornimenti,
            segnalazioni: [],
            controlli: [],
            targa: mezzo.targa,
          }),
      });
      revokePdfPreviewUrl(pdfUrl);
      setPdfBlob(preview.blob);
      setPdfUrl(preview.url);
      setPdfOpen(true);
      setPdfFileName(preview.fileName);
      setPdfTitle(`Anteprima PDF dossier ${mezzo.targa}`);
      setPdfContext(`Dossier mezzo ${mezzo.targa}`);
      setPdfHint(null);
    } catch (previewError) {
      window.alert(readErrorMessage(previewError, "Errore generazione anteprima PDF."));
    }
  };

  const blockPreventivoDelete = () => {
    window.alert(CLONE_READ_ONLY_PREVENTIVO_DELETE_MESSAGE);
  };

  const openFatturaDeleteConfirm = (item: NextDossierFatturaPreventivoLegacyItem) => {
    setFatturaToDelete(item);
    setDeleteError(null);
    setShowDeleteConfirm(true);
  };

  const closeFatturaDeleteConfirm = () => {
    if (deletePending) return;
    setShowDeleteConfirm(false);
    setFatturaToDelete(null);
    setDeleteError(null);
  };

  const confirmFatturaDelete = async () => {
    if (!fatturaToDelete || !targa) return;

    try {
      setDeletePending(true);
      setDeleteError(null);
      await runWithCloneWriteScopedAllowance(
        "internal_ai_magazzino_inline_magazzino",
        async () => deleteNextDocumentoCosto(fatturaToDelete),
      );

      try {
        const nextSnapshot = await readNextDossierMezzoCompositeSnapshot(targa);
        if (nextSnapshot) {
          setLegacy(buildNextDossierMezzoLegacyView(nextSnapshot));
        }
      } catch {
        /* fallback gestito sotto */
      }
      setLegacy((current) =>
        current
          ? {
              ...current,
              documentiCosti: current.documentiCosti.filter(
                (item) => item.id !== fatturaToDelete.id,
              ),
            }
          : current,
      );

      setShowDeleteConfirm(false);
      setFatturaToDelete(null);
      setDeleteError(null);
    } catch (deleteFatturaError) {
      setDeleteError(
        readErrorMessage(deleteFatturaError, "Eliminazione fattura non completata."),
      );
    } finally {
      setDeletePending(false);
    }
  };

  const openManutenzioneWorkItem = (item: { id: string; targa?: string | null; mezzoTarga?: string | null }) => {
    navigate(buildNextManutenzioniPath(item.targa ?? item.mezzoTarga ?? mezzo?.targa, item.id));
  };
  const openManutenzione = (item: NextDossierManutenzioneLegacyItem) => {
    setModal(null);
    navigate(buildNextManutenzioniPath(item.targa, item.id));
  };
  const reloadDossierSnapshot = async () => {
    if (!targa) return;
    const nextSnapshot = await readNextDossierMezzoCompositeSnapshot(targa);
    if (!nextSnapshot) {
      setLegacy(null);
      setError("Mezzo non trovato nel clone.");
      return;
    }
    setLegacy(buildNextDossierMezzoLegacyView(nextSnapshot));
    setError(null);
  };
  const handleMezzoSaved = () => {
    setShowEditModal(false);
    void reloadDossierSnapshot();
  };
  const handleMezzoDeleted = () => {
    setShowEditModal(false);
    navigate(NEXT_DOSSIER_LISTA_PATH);
  };
  const back = () => navigate(NEXT_DOSSIER_LISTA_PATH);

  if (loading) {
    return <div className="dossier-wrapper"><div className="dossier-card dossier-card-full"><div className="dossier-card-body"><div className="dossier-empty">Caricamento dossier mezzo...</div></div></div></div>;
  }

  if (error || !legacy || !mezzo) {
    return <div className="dossier-wrapper"><div className="dossier-card dossier-card-full"><div className="dossier-card-body"><div className="dossier-empty">{error || "Dossier non disponibile."}</div><button className="dossier-button" type="button" onClick={back} style={{ marginTop: 12 }}>Torna a Dossier Mezzi</button></div></div></div>;
  }

  const librettoUrl = String(mezzo.librettoUrl ?? "").trim();
  const headerTitle = `${mezzo.marca || "-"} ${mezzo.modello || "-"}`.trim();
  const lavoriLists = {
    attesa: legacy.lavoriInAttesa,
    eseguiti: legacy.lavoriEseguiti,
    manutenzioni: legacy.manutenzioni,
  } as const;

  const revDays = revisioneInfo.days;
  const revTone = revDays == null ? "#2f6bd6" : revDays < 0 ? "#cf3b3b" : revDays <= 30 ? "#c9820a" : "#1f9457";
  const lavoriDaFare = legacy.lavoriInAttesa;

  const renderWorkItem = (item: NextDossierLegacyWorkItem, badge: string, label: string) => (
    <li key={item.id} className="dossier-list-item" onClick={() => openManutenzioneWorkItem(item)} style={{ cursor: "pointer" }}>
      <div className="dossier-list-main">
        <span className={`dossier-badge ${dossierWorkBadgeClass(item, badge)}`} style={dossierWorkBadgeStyle(item)} title={dossierWorkBadgeTitle(item)}>{dossierWorkBadgeLabel(item, label)}</span>
        <strong>{item.descrizione}</strong>
      </div>
      <div className="dossier-list-meta"><span>{item.dettagli || "-"}</span><span>{formatDossierDate(item.dataInserimento)}</span></div>
      <FraseStoriaRecord {...recordChiusoFromRaw(item as unknown as Record<string, unknown>)} compact />
    </li>
  );

  const renderDocList = (items: NextDossierFatturaPreventivoLegacyItem[], kind: "preventivo" | "fattura") => (
    items.length === 0 ? <p className="dossier-empty">{kind === "preventivo" ? "Nessun preventivo registrato." : "Nessuna fattura registrata."}</p> : (
      <ul className="dossier-list">
        {items.map((item) => (
          <li key={item.id} className="dossier-list-item">
            <div className="dossier-list-main">
              <span className={`dossier-badge ${kind === "preventivo" ? "badge-info" : "badge-danger"}`}>{item.tipo}</span>
              <strong>{item.descrizione || "-"}</strong>
            </div>
            <div className="dossier-list-meta">
              <span>{formatDossierDate(item.data)}</span>
              <span>{renderAmount(item.importo, resolveCurrency(item))}</span>
              <span>{item.fornitoreLabel || "-"}</span>
              {item.fileUrl ? <button className="dossier-button" type="button" onClick={() => openDocumentPdf(item.fileUrl!, `Anteprima PDF ${kind}`, `${kind}-${item.id}.pdf`)}>Anteprima PDF</button> : null}
              {kind === "preventivo" ? <button className="dossier-button" type="button" onClick={blockPreventivoDelete}>Elimina</button> : null}
              {kind === "fattura" ? <button className="dossier-button" type="button" onClick={() => openFatturaDeleteConfirm(item)}>Elimina</button> : null}
            </div>
          </li>
        ))}
      </ul>
    )
  );

  return (
    <div className="dossier-wrapper dossier-comando-page">
      {modal === "libretto" ? (
        <div className="dossier-modal-overlay"><div className="dossier-modal" style={{ maxWidth: 960 }}><div className="dossier-modal-header"><h2>Libretto - {mezzo.targa}</h2><button className="dossier-button" type="button" onClick={() => setModal(null)}>Chiudi</button></div><div className="dossier-modal-body">{librettoUrl ? <div style={{ display: "grid", gap: 12 }}><img src={librettoUrl} alt={`Libretto ${mezzo.targa}`} style={{ width: "100%", borderRadius: 12 }} /><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="dossier-button" type="button" onClick={() => window.open(librettoUrl, "_blank", "noopener,noreferrer")}>Apri file</button></div></div> : <p className="dossier-empty">Nessun libretto disponibile per questo mezzo.</p>}</div></div></div>
      ) : null}
      {modal === "foto" && mezzo.fotoUrl ? (
        <div className="dossier-modal-overlay" onClick={() => setModal(null)}><div className="dossier-modal" style={{ maxWidth: 920 }} onClick={(event) => event.stopPropagation()}><div className="dossier-modal-header"><h2>Foto mezzo</h2><button className="dossier-button" type="button" onClick={() => setModal(null)}>Chiudi</button></div><div className="dossier-modal-body"><img src={mezzo.fotoUrl} alt={mezzo.targa} className="dossier-photo-modal-img" /></div></div></div>
      ) : null}
      {showDeleteConfirm && fatturaToDelete ? (
        <div className="dossier-modal-overlay" onClick={closeFatturaDeleteConfirm}>
          <div className="dossier-modal" style={{ maxWidth: 620 }} onClick={(event) => event.stopPropagation()}>
            <div className="dossier-modal-header">
              <h2>Conferma eliminazione fattura</h2>
              <button className="dossier-button" type="button" onClick={closeFatturaDeleteConfirm} disabled={deletePending}>Chiudi</button>
            </div>
            <div className="dossier-modal-body" style={{ display: "grid", gap: 12 }}>
              <p>
                {legacy.manutenzioni.some((record) => record.sourceDocumentId === fatturaToDelete.id)
                  ? DOSSIER_DELETE_LINKED_MESSAGE
                  : DOSSIER_DELETE_SIMPLE_MESSAGE}
              </p>
              <div className="dossier-list-meta">
                <span>{fatturaToDelete.descrizione || "-"}</span>
                <span>{formatDossierDate(fatturaToDelete.data)}</span>
                <span>{renderAmount(fatturaToDelete.importo, resolveCurrency(fatturaToDelete))}</span>
              </div>
              {deleteError ? <p className="dossier-empty" style={{ color: "#b42318", margin: 0 }}>{deleteError}</p> : null}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="dossier-button" type="button" onClick={confirmFatturaDelete} disabled={deletePending}>{deletePending ? "Eliminazione..." : "Conferma"}</button>
                <button className="dossier-button" type="button" onClick={closeFatturaDeleteConfirm} disabled={deletePending}>Annulla</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <NextMezzoEditModal
        mezzoId={mezzo.id}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSaved={handleMezzoSaved}
        onDeleted={handleMezzoDeleted}
      />

      <style>{`
        .cmd-top{display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:center;background:linear-gradient(180deg,#16243a,#0f1a2b);color:#eef2f8;border-radius:10px;padding:16px 18px;margin-bottom:14px;}
        .cmd-idleft{display:flex;gap:14px;align-items:center;}
        .cmd-photo{width:96px;height:70px;border-radius:7px;flex:none;background:#26344b;background-size:cover;background-position:center;border:1px solid #38496685;display:flex;align-items:center;justify-content:center;color:#8294b3;font-size:10px;text-transform:uppercase;}
        .cmd-plate{font-size:26px;font-weight:700;letter-spacing:.04em;line-height:1;}
        .cmd-model{font-size:14px;color:#c4d0e0;margin-top:3px;}
        .cmd-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;}
        .cmd-chip{font-size:12px;padding:3px 9px;border-radius:20px;background:#ffffff14;border:1px solid #ffffff26;color:#d8e2f0;}
        .cmd-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;max-width:440px;}
        .cmd-btn{font-size:12.5px;padding:8px 12px;border-radius:7px;cursor:pointer;background:#ffffff12;border:1px solid #ffffff2b;color:#e7eef8;white-space:nowrap;}
        .cmd-btn.primary{background:#2f6bd6;border-color:#2f6bd6;color:#fff;font-weight:600;}
        .cmd-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:14px;}
        .cmd-kpi{background:#fff;border:1px solid #e0e5ec;border-radius:10px;padding:14px 16px;position:relative;box-shadow:0 1px 2px rgba(20,30,45,.06);}
        .cmd-kpi .top{position:absolute;top:0;left:16px;right:16px;height:3px;border-radius:0 0 3px 3px;}
        .cmd-kpi .lab{font-size:12px;color:#5a6675;text-transform:uppercase;letter-spacing:.03em;}
        .cmd-kpi .val{font-size:25px;font-weight:700;margin-top:6px;line-height:1.05;}
        .cmd-kpi .val small{font-size:14px;font-weight:600;color:#5a6675;}
        .cmd-kpi .sub{font-size:12px;color:#8a94a2;margin-top:5px;}
        .cmd-summary{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .cmd-card{background:#fff;border:1px solid #e0e5ec;border-radius:10px;box-shadow:0 1px 2px rgba(20,30,45,.06);overflow:hidden;}
        .cmd-card h3{font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#5a6675;margin:0;padding:13px 16px;border-bottom:1px solid #eef1f5;}
        .cmd-row{display:flex;gap:11px;padding:11px 16px;border-bottom:1px solid #f1f4f8;align-items:flex-start;}
        .cmd-row:last-child{border-bottom:none;}
        .cmd-dot{width:9px;height:9px;border-radius:50%;margin-top:5px;flex:none;}
        .cmd-main{flex:1;min-width:0;}
        .cmd-title{font-size:13.5px;font-weight:600;}
        .cmd-sub{font-size:12px;color:#8a94a2;margin-top:2px;}
        .cmd-right{font-size:12.5px;font-weight:600;white-space:nowrap;}
        @media(max-width:1080px){.cmd-top{grid-template-columns:1fr}.cmd-kpis{grid-template-columns:repeat(2,1fr)}.cmd-summary{grid-template-columns:1fr}.cmd-actions{justify-content:flex-start;max-width:none}}

        /* === Re-skin del Dettaglio nello stile Centro di comando (un'unica grafica) === */
        .dossier-comando-page{background:#eef1f5 !important;}
        .dossier-comando-page .dossier-grid{display:grid !important;grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:14px !important;align-items:start !important;}
        .dossier-comando-page .dossier-card-full,.dossier-comando-page .dossier-card-large{grid-column:1 / -1 !important;}
        .dossier-comando-page .dossier-card{background:#fff !important;border:1px solid #e0e5ec !important;border-radius:10px !important;box-shadow:0 1px 2px rgba(20,30,45,.06) !important;}
        .dossier-comando-page .dossier-card-header{background:#fff !important;border-bottom:1px solid #eef1f5 !important;padding:12px 16px !important;}
        .dossier-comando-page .dossier-card-header h2{font-size:13px !important;text-transform:uppercase !important;letter-spacing:.05em !important;color:#5a6675 !important;margin:0 !important;font-weight:700 !important;}
        .dossier-comando-page .dossier-card-body{background:#fff !important;}
        .dossier-comando-page .dossier-tech-block h3{color:#8a94a2 !important;text-transform:uppercase;font-size:11px;letter-spacing:.05em;}
        .dossier-comando-page .dossier-tech-block li span,.dossier-comando-page .dossier-list-meta{color:#5a6675 !important;}
        .dossier-comando-page .dossier-list-item{background:#fff !important;border-bottom:1px solid #f1f4f8 !important;}
        .dossier-comando-page .dossier-table th{background:#f8fafc !important;color:#8a94a2 !important;text-transform:uppercase;font-size:11px;letter-spacing:.03em;border-bottom:1px solid #e0e5ec !important;}
        .dossier-comando-page .dossier-table td{border-bottom:1px solid #f1f4f8 !important;}
        .dossier-comando-page .dossier-button{background:#f1f4f8 !important;border:1px solid #dbe1ea !important;color:#2f3a4b !important;border-radius:7px !important;}
        .dossier-comando-page .dossier-button.primary{background:#2f6bd6 !important;border-color:#2f6bd6 !important;color:#fff !important;}
        .dossier-comando-page .dossier-chip{background:#f8fafc !important;color:#5a6675 !important;border:1px solid #eef1f5 !important;border-radius:7px;}
        .dossier-comando-page .dossier-empty{color:#8a94a2 !important;}
      `}</style>

      <div className="cmd-top">
        <div className="cmd-idleft">
          <div className="cmd-photo" style={mezzo.fotoUrl ? { backgroundImage: `url(${mezzo.fotoUrl})` } : undefined}>{mezzo.fotoUrl ? "" : "foto"}</div>
          <div>
            <div className="cmd-plate">{mezzo.targa}</div>
            <div className="cmd-model">{headerTitle}</div>
            <div className="cmd-chips">
              {mezzo.categoria ? <span className="cmd-chip">{mezzo.categoria}</span> : null}
              {mezzo.autistaNome ? <span className="cmd-chip">{mezzo.autistaNome}</span> : null}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: 11, letterSpacing: ".06em", color: "#9fb0c4" }}>DOSSIER MEZZO · CENTRO DI COMANDO</div>
        <div className="cmd-actions">
          <button className="cmd-btn" type="button" onClick={back}>&#8249; Mezzi</button>
          <button className="cmd-btn" type="button" onClick={() => navigate(buildNextAnalisiEconomicaPath(mezzo.targa))}>Analisi economica</button>
          <button className="cmd-btn" type="button" onClick={() => navigate(buildNextCentroControlloRifornimentiPath(mezzo.targa))}>Rifornimenti &#8599; Sinottica</button>
          <button className="cmd-btn" type="button" onClick={() => setModal("libretto")}>Libretto</button>
          <button className="cmd-btn primary" type="button" onClick={openDossierPdf}>Anteprima PDF</button>
        </div>
      </div>

      <div className="cmd-kpis">
        <div className="cmd-kpi"><span className="top" style={{ background: revTone }} /><div className="lab">Prossima revisione</div><div className="val" style={{ color: revTone }}>{revDays == null ? "-" : revDays < 0 ? "scaduta" : revDays}{revDays != null && revDays >= 0 ? <small> giorni</small> : null}</div><div className="sub">{revisioneInfo.date}{revDays != null && revDays < 0 ? ` · ${-revDays} gg fa` : ""}</div></div>
        <div className="cmd-kpi"><span className="top" style={{ background: "#2f6bd6" }} /><div className="lab">Costo anno {costoAnno.year}</div><div className="val">{costoAnno.chf.toFixed(0)} <small>CHF</small>{costoAnno.eur > 0 ? <small> + {costoAnno.eur.toFixed(0)} &euro;</small> : null}</div><div className="sub">{costoAnno.unknown > 0 ? `parziale · ${costoAnno.unknown} senza valuta` : "fatture + preventivi"}</div></div>
        <div className="cmd-kpi"><span className="top" style={{ background: "#2f6bd6" }} /><div className="lab">Consumo medio</div><div className="val">{consumoMedio == null ? "n/d" : consumoMedio.toFixed(1)}{consumoMedio != null ? <small> l/100 km</small> : null}</div><div className="sub">stima da rifornimenti</div></div>
        <div className="cmd-kpi"><span className="top" style={{ background: lavoriDaFare.length > 0 ? "#c9820a" : "#1f9457" }} /><div className="lab">Manutenzioni da fare</div><div className="val" style={{ color: lavoriDaFare.length > 0 ? "#c9820a" : "#1f9457" }}>{lavoriDaFare.length}</div><div className="sub">lavori in attesa</div></div>
      </div>

      <div className="cmd-summary">
        <div className="cmd-card">
          <h3>Scadenze &amp; Allerte</h3>
          <div className="cmd-row"><span className="cmd-dot" style={{ background: revTone }} /><div className="cmd-main"><div className="cmd-title">Revisione</div><div className="cmd-sub">{revisioneInfo.date}</div></div><div className="cmd-right" style={{ color: revTone }}>{revDays == null ? "-" : revDays < 0 ? `scaduta ${-revDays} gg` : `tra ${revDays} gg`}</div></div>
          <div className="cmd-row"><span className="cmd-dot" style={{ background: mezzo.manutenzioneProgrammata ? "#1f9457" : "#cfd6e0" }} /><div className="cmd-main"><div className="cmd-title">Manutenzione programmata</div><div className="cmd-sub">{mezzo.manutenzioneProgrammata ? (mezzo.manutenzioneContratto || "attiva") : "non attiva"}</div></div></div>
          {lavoriDaFare.length === 0 ? (
            <div className="cmd-row"><div className="cmd-main"><div className="cmd-sub">Nessun lavoro da fare.</div></div></div>
          ) : (
            lavoriDaFare.slice(0, 4).map((item) => (
              <div className="cmd-row" key={item.id}><span className="cmd-dot" style={{ background: "#c9820a" }} /><div className="cmd-main"><div className="cmd-title">{item.descrizione}</div><div className="cmd-sub">{item.dettagli || formatDossierDate(item.dataInserimento)}</div></div></div>
            ))
          )}
        </div>
        <div className="cmd-card">
          <h3>Costi (riepilogo)</h3>
          <div className="cmd-row"><div className="cmd-main"><div className="cmd-title">Fatture</div><div className="cmd-sub">{fatture.length} documenti</div></div><div className="cmd-right">CHF {fattureTotals.chf.toFixed(2)}{fattureTotals.eur > 0 ? ` · EUR ${fattureTotals.eur.toFixed(2)}` : ""}</div></div>
          <div className="cmd-row"><div className="cmd-main"><div className="cmd-title">Preventivi</div><div className="cmd-sub">{preventivi.length} documenti</div></div><div className="cmd-right">CHF {preventiviTotals.chf.toFixed(2)}{preventiviTotals.eur > 0 ? ` · EUR ${preventiviTotals.eur.toFixed(2)}` : ""}</div></div>
          <div className="cmd-row"><div className="cmd-main"><div className="cmd-title">Costo anno {costoAnno.year}</div>{costoAnno.unknown > 0 ? <div className="cmd-sub" style={{ color: "#b07a12" }}>{costoAnno.unknown} senza valuta</div> : null}</div><div className="cmd-right">CHF {costoAnno.chf.toFixed(2)}{costoAnno.eur > 0 ? ` · EUR ${costoAnno.eur.toFixed(2)}` : ""}</div></div>
        </div>
      </div>

      <div style={COMANDO_BAND_STYLE}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, whiteSpace: "nowrap" }}>Dettaglio completo</h2>
        <span style={{ fontSize: 12.5, color: "#8a94a2" }}>tutte le sezioni del dossier</span>
        <span style={{ flex: 1, height: 1, background: "#cfd6e0" }} />
      </div>

      <div className="dossier-grid">
        <section className="dossier-card dossier-card-large"><div className="dossier-card-header"><h2>Dati tecnici</h2><button className="dossier-button" type="button" onClick={() => setShowEditModal(true)} disabled={!mezzo}>+ Modifica</button></div><div className="dossier-card-body dossier-tech-grid">
          {[{ title: "Identificazione", rows: [["Proprietario", mezzo.proprietario], ["Targa", mezzo.targa], ["Autista abituale", mezzo.autistaNome], ["Telaio / VIN", mezzo.telaio], ["Assicurazione", mezzo.assicurazione]] }, { title: "Caratteristiche", rows: [["Marca", mezzo.marca], ["Modello", mezzo.modello], ["Categoria", mezzo.categoria], ["Colore", mezzo.colore]] }, { title: "Motore e massa", rows: [["Cilindrata", mezzo.cilindrata], ["Potenza", mezzo.potenza], ["Massa complessiva", mezzo.massaComplessiva], ["Anno", mezzo.anno]] }, { title: "Scadenze", rows: [["Immatricolazione", formatDateUI(parseDateFlexible(mezzo.dataImmatricolazione))], ["Revisione", formatDateUI(parseDateFlexible(mezzo.dataScadenzaRevisione))], ["Note", mezzo.note], ["Manutenzione programmata", mezzo.manutenzioneProgrammata ? "ATTIVA" : "NON ATTIVA"], ...(mezzo.manutenzioneProgrammata ? [["Contratto", mezzo.manutenzioneContratto], ["Periodo", `${formatDateUI(parseDateFlexible(mezzo.manutenzioneDataInizio))} - ${formatDateUI(parseDateFlexible(mezzo.manutenzioneDataFine))}`], ["KM massimi", mezzo.manutenzioneKmMax]] : [])] }].map((block) => (
            <div key={block.title} className="dossier-tech-block"><h3>{block.title}</h3><ul>{block.rows.map(([label, value]) => <li key={label}><span>{label}</span><strong style={label === "Note" ? { whiteSpace: "pre-line" } : undefined}>{String(value || "-")}</strong></li>)}</ul></div>
          ))}
        </div></section>

        <section className="dossier-card dossier-photo-card"><div className="dossier-card-header"><h2>Foto mezzo</h2></div><div className="dossier-card-body dossier-photo-body">{mezzo.fotoUrl ? <div className="dossier-photo-thumb" role="button" tabIndex={0} onClick={() => setModal("foto")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setModal("foto"); } }}><div className="dossier-mezzo-photo-frame"><div className="dossier-mezzo-photo-bg" style={{ backgroundImage: `url(${mezzo.fotoUrl})` }} /><img src={mezzo.fotoUrl} alt={mezzo.targa} className="dossier-mezzo-photo" /></div></div> : <div className="dossier-photo-placeholder">Nessuna foto caricata</div>}</div></section>

        <section className="dossier-card"><div className="dossier-card-header"><h2>Manutenzioni</h2></div><div className="dossier-card-body dossier-work-grid">
          {[{ title: "Da fare", items: legacy.lavoriInAttesa.slice(0, 3), badge: "badge-info", label: "DA FARE", modalKey: "attesa" as const }, { title: "Eseguite", items: legacy.lavoriEseguiti.slice(0, 3), badge: "badge-success", label: "ESEGUITA", modalKey: "eseguiti" as const }].map((group) => (
            <div key={group.title}><h3>{group.title}</h3>{group.items.length === 0 ? <p className="dossier-empty">{group.title === "Da fare" ? "Nessuna manutenzione da fare." : "Nessuna manutenzione eseguita."}</p> : <ul className="dossier-list">{group.items.map((item) => renderWorkItem(item, group.badge, group.label))}</ul>}<button className="dossier-button" type="button" onClick={() => setModal(group.modalKey)} style={{ marginTop: 12 }}>Mostra tutti</button></div>
          ))}
        </div></section>

        <section className="dossier-card"><div className="dossier-card-header"><h2>Storico manutenzioni</h2><button className="dossier-button" type="button" onClick={() => setModal("manutenzioni")}>Mostra tutti</button></div><div className="dossier-card-body">{legacy.manutenzioni.slice(0, 5).length === 0 ? <p className="dossier-empty">Nessuna manutenzione registrata per questo mezzo.</p> : <ul className="dossier-list">{legacy.manutenzioni.slice(0, 5).map((item) => <li key={item.id} className="dossier-list-item" onClick={() => openManutenzione(item)} style={{ cursor: "pointer" }}><div className="dossier-list-main"><strong>{item.descrizione || "-"}</strong></div><div className="dossier-list-meta"><span>{formatDossierDate(item.data)}</span><span>{formatKmOre(item)}</span></div></li>)}</ul>}</div></section>

        <section className="dossier-card dossier-card-full"><div className="dossier-card-header"><h2>Gomme</h2></div><div className="dossier-card-body">
          <h3 style={{ fontSize: 13, color: "#5a6675", margin: "0 0 8px" }}>Stato gomme per asse</h3>
          {legacy.gommePerAsse.length === 0 ? <p className="dossier-empty">Nessun cambio gomme ordinario strutturato disponibile.</p> : <ul className="dossier-list">{legacy.gommePerAsse.map((item) => <li key={item.asseId} className="dossier-list-item"><div className="dossier-list-main"><strong>{item.asseLabel}</strong></div><div className="dossier-list-meta"><span>{formatGommePerAsseMeta(item)}</span></div></li>)}</ul>}
          <h3 style={{ fontSize: 13, color: "#5a6675", margin: "16px 0 8px" }}>Eventi gomme straordinari</h3>
          {legacy.gommeStraordinarie.length === 0 ? <p className="dossier-empty">Nessun evento gomme straordinario registrato.</p> : <ul className="dossier-list">{legacy.gommeStraordinarie.slice(0, 5).map((item) => <li key={item.sourceMaintenanceId} className="dossier-list-item"><div className="dossier-list-main"><strong>{item.motivo || "Evento gomme straordinario"}</strong></div><div className="dossier-list-meta"><span>{formatGommeStraordinarieMeta(item)}</span></div></li>)}</ul>}
        </div></section>

        <section className="dossier-card dossier-card-full"><div className="dossier-card-header"><h2>Materiali e movimenti inventario</h2></div><div className="dossier-card-body">{legacy.movimentiMateriali.length === 0 ? <p className="dossier-empty">Nessun movimento materiali registrato per questo mezzo.</p> : <div className="dossier-table-wrapper"><table className="dossier-table"><thead><tr><th>Data</th><th>Descrizione</th><th>Q.ta</th><th>Destinatario</th><th>Fornitore</th><th>Motivo</th><th>Costo</th></tr></thead><tbody>{legacy.movimentiMateriali.map((item) => <tr key={item.id}><td>{formatDossierDate(item.data)}</td><td>{item.descrizione || item.materialeLabel || "-"}</td><td>{item.quantita ?? "-"} {item.unita ?? ""}</td><td>{item.destinatario?.label || "-"}</td><td>{item.fornitore || item.fornitoreLabel || "-"}</td><td>{item.motivo || "-"}</td><td>{item.costoTotale !== null && item.costoTotale !== undefined ? renderAmount(item.costoTotale, item.costoCurrency ?? "UNKNOWN") : "-"}</td></tr>)}</tbody></table></div>}</div></section>

        <section className="dossier-card"><div className="dossier-card-header"><h2>Rifornimenti</h2><button className="dossier-button" type="button" onClick={() => navigate(buildNextCentroControlloRifornimentiPath(mezzo.targa))}>Apri in Sinottica &#8599;</button></div><div className="dossier-card-body">{legacy.rifornimenti.length === 0 ? <p className="dossier-empty">Nessun rifornimento registrato per questo mezzo.</p> : <div className="dossier-table-wrapper"><table className="dossier-table"><thead><tr><th>Data/Ora</th><th>Litri</th><th>Km</th><th>Tipo</th><th>Autista</th></tr></thead><tbody>{legacy.rifornimenti.map((item) => <tr key={item.id}><td>{formatDateTime(item.data)}</td><td>{item.litri ?? "-"}</td><td>{item.km ?? "-"}</td><td>{item.tipo ?? "-"}</td><td>{item.autistaNome ? `${item.autistaNome}${item.badgeAutista ? ` (${item.badgeAutista})` : ""}` : item.badgeAutista ?? "-"}</td></tr>)}</tbody></table></div>}</div></section>

        <section ref={preventiviSectionRef} id="preventivi" className="dossier-card" tabIndex={-1}><div className="dossier-card-header"><h2>Preventivi</h2><div className="dossier-chip">Totale preventivi: <strong>CHF {preventiviTotals.chf.toFixed(2)}</strong><span style={{ marginLeft: 8 }}>EUR {preventiviTotals.eur.toFixed(2)}</span>{preventiviTotals.unknown > 0 ? <span className="dossier-badge badge-info" style={{ marginLeft: 8 }}>VALUTA DA VERIFICARE ({preventiviTotals.unknown})</span> : null}</div></div><div className="dossier-card-body">{renderDocList(preventivi, "preventivo")}</div></section>
        <section className="dossier-card"><div className="dossier-card-header"><div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><h2>Fatture</h2><button className="dossier-button ghost" type="button" onClick={() => navigate(NEXT_IA_DOCUMENTI_PATH)}>Vai allo storico -&gt;</button></div><div className="dossier-chip">Totale fatture: <strong>CHF {fattureTotals.chf.toFixed(2)}</strong><span style={{ marginLeft: 8 }}>EUR {fattureTotals.eur.toFixed(2)}</span>{fattureTotals.unknown > 0 ? <span className="dossier-badge badge-info" style={{ marginLeft: 8 }}>VALUTA DA VERIFICARE ({fattureTotals.unknown})</span> : null}</div></div><div className="dossier-card-body">{renderDocList(fatture, "fattura")}</div></section>
      </div>

      {(["attesa", "eseguiti", "manutenzioni"] as const).map((key) =>
        modal === key ? (
          <div key={key} className="dossier-modal-overlay">
            <div className="dossier-modal">
              <div className="dossier-modal-header">
                <h2>{key === "attesa" ? "Manutenzioni da fare" : key === "eseguiti" ? "Manutenzioni eseguite" : "Storico manutenzioni"} - {mezzo.targa}</h2>
                <button className="dossier-button" type="button" onClick={() => setModal(null)}>Chiudi</button>
              </div>
              <div className="dossier-modal-body">
                {key === "manutenzioni" ? (
                  lavoriLists.manutenzioni.length === 0 ? <p>Nessuna manutenzione registrata.</p> : <ul className="dossier-list">{lavoriLists.manutenzioni.map((item) => <li key={item.id} className="dossier-list-item" onClick={() => openManutenzione(item)} style={{ cursor: "pointer" }}><div className="dossier-list-main"><strong>{item.descrizione || "-"}</strong></div><div className="dossier-list-meta"><span>{formatDossierDate(item.data)}</span><span>{formatKmOre(item)}</span></div></li>)}</ul>
                ) : (
                  lavoriLists[key].length === 0 ? <p>{key === "attesa" ? "Nessuna manutenzione da fare." : "Nessuna manutenzione eseguita."}</p> : <ul className="dossier-list">{lavoriLists[key].map((item) => renderWorkItem(item, key === "attesa" ? "badge-info" : "badge-success", key === "attesa" ? "DA FARE" : "ESEGUITA"))}</ul>
                )}
              </div>
            </div>
          </div>
        ) : null,
      )}

      <PdfPreviewModal open={pdfOpen} title={pdfTitle} pdfUrl={pdfUrl} fileName={pdfFileName} hint={pdfHint} onClose={closePdf} onShare={onSharePdf} onCopyLink={async () => setPdfHint((await copyTextToClipboard(buildShareMessage())) ? "Testo copiato." : "Copia non disponibile.")} onWhatsApp={() => window.open(buildWhatsAppShareUrl(buildShareMessage()), "_blank", "noopener,noreferrer")} />
    </div>
  );
}
