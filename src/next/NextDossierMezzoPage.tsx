import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { generateDossierMezzoPDFBlob } from "../utils/pdfEngine";
import PdfPreviewModal from "../components/PdfPreviewModal";
import NextAnalisiEconomicaPage from "./NextAnalisiEconomicaPage";
import NextDossierGommePage from "./NextDossierGommePage";
import NextDossierRifornimentiPage from "./NextDossierRifornimentiPage";
import { readNextMezzoRifornimentiSnapshot } from "./domain/nextRifornimentiDomain";
import {
  buildNextDossierMezzoLegacyView,
  readNextDossierMezzoCompositeSnapshot,
  type NextDossierMezzoIdentity,
  type NextDossierMezzoLegacyViewState,
  type NextDossierRifornimentoLegacyItem,
} from "./domain/nextDossierMezzoDomain";
import {
  mapNextDocumentiCostiItemsToLegacyView,
  readNextMezzoDocumentiCostiSnapshot,
  type NextDocumentiCostiCurrency,
  type NextDocumentiMagazzinoSupportDocument,
} from "./domain/nextDocumentiCostiDomain";
import {
  mapNextManutenzioniItemsToLegacyView,
  readNextMezzoManutenzioniGommeSnapshot,
} from "./domain/nextManutenzioniGommeDomain";
import type { NextScheduledMaintenance } from "./domain/nextManutenzioniDomain";
import {
  buildNextLavoriLegacyDossierView,
  readNextMezzoLavoriSnapshot,
} from "./domain/nextLavoriDomain";
import {
  buildNextMaterialiMovimentiLegacyDossierView,
  buildNextMezzoMaterialiMovimentiSnapshot,
  readNextMaterialiMovimentiSnapshot,
} from "./domain/nextMaterialiMovimentiDomain";
import {
  buildPdfShareText,
  buildWhatsAppShareUrl,
  copyTextToClipboard,
  openPreview,
  revokePdfPreviewUrl,
  sharePdfFile,
} from "../utils/pdfPreview";
import { formatDateTimeUI, formatDateUI } from "../utils/dateFormat";
import "../pages/DossierMezzo.css";
import "./next-shell.css";

const CLONE_READ_ONLY_TITLE = "Non disponibile nel clone read-only";

// Normalizza la targa togliendo spazi, simboli e differenze
const normalizeTarga = (t?: unknown) => {
  if (typeof t !== "string") return "";
  return t.toUpperCase().replace(/[^A-Z0-9]/g, "").trim();
};

type Currency = NextDocumentiCostiCurrency;


type Mezzo = NextDossierMezzoIdentity;

type Rifornimento = NextDossierRifornimentoLegacyItem;

interface FatturaPreventivo {
  id: string;
  mezzoTarga?: string;
  tipo: "PREVENTIVO" | "FATTURA";
  data?: string;
  timestamp?: number | null;
  descrizione?: string;
  importo?: number;
  valuta?: Currency;
  currency?: Currency;
  fornitoreLabel?: string;
  fileUrl?: string | null;   // <── AGGIUNTO
  sourceKey?: string;
  sourceDocId?: string | null;
}

interface Manutenzione {
  id: string;
  targa?: string;
  tipo?: string;
  data?: string;
  timestamp?: number | null;
  km?: number;
  ore?: number;
  descrizione?: string;
}

type DossierState = Omit<
  NextDossierMezzoLegacyViewState,
  "manutenzioni" | "scheduledMaintenance"
> & {
  documentiMagazzino: NextDocumentiMagazzinoSupportDocument[];
};

const EMPTY_DOSSIER_STATE: DossierState = {
  mezzo: null,
  lavoriDaEseguire: [],
  lavoriInAttesa: [],
  lavoriEseguiti: [],
  movimentiMateriali: [],
  rifornimenti: [],
  documentiCosti: [],
  documentiMagazzino: [],
};

const DossierMezzo: React.FC = () => {
  const { targa } = useParams<{ targa: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeView = searchParams.get("view");

  const [state, setState] = useState<DossierState>(EMPTY_DOSSIER_STATE); /*
  documentiMagazzino: [],   // <── AGGIUNTO
});

  */
  const [manutenzioni, setManutenzioni] = useState<Manutenzione[]>([]);
  const [scheduledMaintenance, setScheduledMaintenance] = useState<NextScheduledMaintenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAttesaModal, setShowAttesaModal] = useState(false);
  const [showEseguitiModal, setShowEseguitiModal] = useState(false);
  const [showManutenzioniModal, setShowManutenzioniModal] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState("dossier-mezzo.pdf");
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState("Anteprima PDF dossier mezzo");
  const [pdfShareContext, setPdfShareContext] = useState("Dossier mezzo");
  const [pdfShareDate, setPdfShareDate] = useState<string | null>(null);
  const [pdfShareHint, setPdfShareHint] = useState<string | null>(null);
  const [showLibrettoModal, setShowLibrettoModal] = useState(false);
  const [librettoLoadErrors, setLibrettoLoadErrors] = useState<Record<string, boolean>>({});
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoModalUrl, setPhotoModalUrl] = useState<string | null>(null);

  const formatFileDate = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const resolveFileNameFromUrl = (url: string, fallback: string) => {
    try {
      const parsed = new URL(url);
      const candidate = parsed.pathname.split("/").pop();
      if (!candidate) return fallback;
      return decodeURIComponent(candidate);
    } catch {
      return fallback;
    }
  };

  const closePdfPreview = () => {
    revokePdfPreviewUrl(pdfPreviewUrl);
    setPdfPreviewOpen(false);
    setPdfPreviewUrl(null);
    setPdfPreviewBlob(null);
    setPdfShareHint(null);
  };

  const openDocumento = (url: string) => {
    const fallbackName = `documento-mezzo-${formatFileDate()}.pdf`;
    setPdfShareHint(null);
    revokePdfPreviewUrl(pdfPreviewUrl);
    setPdfPreviewBlob(null);
    setPdfPreviewFileName(resolveFileNameFromUrl(url, fallbackName));
    setPdfPreviewTitle("Anteprima PDF documento mezzo");
    setPdfShareContext("Documento mezzo");
    setPdfShareDate(null);
    setPdfPreviewUrl(url);
    setPdfPreviewOpen(true);
  };

const openPhotoViewer = (url: string) => {
  setPhotoModalUrl(url);
  setShowPhotoModal(true);
};

const closePhotoViewer = () => {
  setShowPhotoModal(false);
  setPhotoModalUrl(null);
};

const isPdfUrl = (url: string) => {
  const u = String(url || "").toLowerCase();
  return u.includes(".pdf") || u.includes("application/pdf");
};

useEffect(() => {
  if (!showPhotoModal) return;
  const handleKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setShowPhotoModal(false);
      setPhotoModalUrl(null);
    }
  };
  window.addEventListener("keydown", handleKey);
  return () => window.removeEventListener("keydown", handleKey);
}, [showPhotoModal]);

useEffect(() => {
  return () => {
    revokePdfPreviewUrl(pdfPreviewUrl);
  };
}, [pdfPreviewUrl]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (activeView) {
        return;
      }

      if (!targa) {
        setError("Targa non specificata.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const snapshot = await readNextDossierMezzoCompositeSnapshot(targa);

        if (!cancelled) {
          if (!snapshot) {
            setState(EMPTY_DOSSIER_STATE);
            setManutenzioni([]);
            setScheduledMaintenance(null);
            setLoading(false);
            return;
          }

          const view = buildNextDossierMezzoLegacyView(snapshot);
          const {
            manutenzioni: manutenzioniView,
            scheduledMaintenance: scheduledMaintenanceView,
            ...dossierState
          } = view;

          setState({
            ...dossierState,
            documentiMagazzino: [],
          });
          setManutenzioni(manutenzioniView);
          setScheduledMaintenance(scheduledMaintenanceView);
          setLoading(false);
          return;
        }

        return;

        const mezziDocRef = doc(db, "storage", "@mezzi_aziendali");
        const mezziSnap = await getDoc(mezziDocRef);
        const mezziData = mezziSnap.data() || {};
        const mezziArray = (mezziData.value || []) as Mezzo[];
        const legacyTarga = targa ?? "";

        const mezzo = mezziArray.find(
          (m) => m.targa?.toUpperCase().trim() === legacyTarga.toUpperCase().trim()
        );

        const [
          lavoriSnapshot,
          materialiMovimentiSnapshot,
          rifornimentiSnapshot,
          documentiCostiSnapshot,
          manutenzioniGommeSnapshot,
        ] = await Promise.all([
          readNextMezzoLavoriSnapshot(legacyTarga),
          readNextMaterialiMovimentiSnapshot(),
          readNextMezzoRifornimentiSnapshot(legacyTarga),
          readNextMezzoDocumentiCostiSnapshot(legacyTarga),
          readNextMezzoManutenzioniGommeSnapshot(legacyTarga),
        ]);
        const {
          lavoriDaEseguire,
          lavoriInAttesa,
          lavoriEseguiti,
        } = buildNextLavoriLegacyDossierView(lavoriSnapshot);
        const rifornimentiPerMezzo: Rifornimento[] = rifornimentiSnapshot.items.map((entry) => ({
          id: entry.id,
          targaCamion: entry.targa,
          data: entry.timestamp,
          litri: entry.litri,
          km: entry.km,
          tipo: entry.tipo,
          autistaNome: entry.autista,
          badgeAutista: entry.badgeAutista,
        }));
let docsMag: NextDocumentiMagazzinoSupportDocument[] = [];

        const documentiCostiReadOnly = mapNextDocumentiCostiItemsToLegacyView(
          documentiCostiSnapshot.items
        );
        docsMag = documentiCostiSnapshot.materialCostSupport.documents;
        const movimentiPerMezzo = buildNextMaterialiMovimentiLegacyDossierView(
          buildNextMezzoMaterialiMovimentiSnapshot({
            baseSnapshot: materialiMovimentiSnapshot,
            targa: legacyTarga,
            mezzoId: mezzo?.id ?? null,
            materialCostSupportDocuments: docsMag,
          })
        );

        const manArray = mapNextManutenzioniItemsToLegacyView(
          manutenzioniGommeSnapshot.maintenanceItems
        );

        if (!cancelled) {
setState({
  mezzo: mezzo || null,
  lavoriDaEseguire,
  lavoriInAttesa,
  lavoriEseguiti,
  movimentiMateriali: movimentiPerMezzo,
  rifornimenti: rifornimentiPerMezzo,
  documentiCosti: documentiCostiReadOnly,
  documentiMagazzino: docsMag,   // <── AGGIUNTO
});
          setManutenzioni(manArray);
          setScheduledMaintenance(manutenzioniGommeSnapshot.scheduledMaintenance);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Errore durante il caricamento del dossier.");
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [activeView, targa]);

  const handleBack = () => {
    navigate("/next/mezzi-dossier");
  };

  const buildDossierPdfPayload = () => ({
    mezzo: state.mezzo,
    mezzoFotoUrl: state.mezzo?.fotoUrl ?? null,
    mezzoFotoStoragePath:
      state.mezzo?.fotoStoragePath ?? state.mezzo?.fotoPath ?? null,
    lavoriDaEseguire: state.lavoriDaEseguire,
    lavoriInAttesa: state.lavoriInAttesa,
    lavoriEseguiti: state.lavoriEseguiti,
    rifornimenti: state.rifornimenti,
    segnalazioni: null,
    controlli: null,
    targa,
  });

  const handleOpenPdf = async () => {
    try {
      const fileDate = formatFileDate();
      const targaLabel = normalizeTarga(state.mezzo?.targa || targa || "mezzo") || "mezzo";
      const preview = await openPreview({
        source: async () => generateDossierMezzoPDFBlob(buildDossierPdfPayload()),
        fileName: `dossier-mezzo-${targaLabel}-${fileDate}.pdf`,
        previousUrl: pdfPreviewUrl,
      });
      setPdfShareHint(null);
      setPdfPreviewBlob(preview.blob);
      setPdfPreviewFileName(preview.fileName);
      setPdfPreviewTitle(`Anteprima PDF dossier ${targaLabel}`);
      setPdfShareContext(`Dossier mezzo ${targaLabel}`);
      setPdfShareDate(fileDate);
      setPdfPreviewUrl(preview.url);
      setPdfPreviewOpen(true);
    } catch (err) {
      console.error("Errore generazione PDF dossier:", err);
      alert("Errore durante la generazione dell'anteprima PDF.");
    }
  };

  const buildPdfShareMessage = () => {
    return buildPdfShareText({
      contextLabel: pdfShareContext || "Dossier mezzo",
      dateLabel: pdfShareDate,
      fileName: pdfPreviewFileName || "dossier-mezzo.pdf",
      url: pdfPreviewUrl,
    });
  };

  const handleSharePDF = async () => {
    if (!pdfPreviewBlob) {
      const copied = await copyTextToClipboard(buildPdfShareMessage());
      setPdfShareHint(copied ? "Link copiato." : "Apri prima un'anteprima PDF.");
      return;
    }

    const result = await sharePdfFile({
      blob: pdfPreviewBlob,
      fileName: pdfPreviewFileName || "dossier-mezzo.pdf",
      title: pdfPreviewTitle || "Anteprima PDF dossier mezzo",
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

  const handleCopyPdfText = async () => {
    const copied = await copyTextToClipboard(buildPdfShareMessage());
    setPdfShareHint(copied ? "Testo copiato." : "Copia non disponibile.");
  };

  const handleWhatsAppPdf = () => {
    const shareText = buildPdfShareMessage();
    const url = buildWhatsAppShareUrl(shareText);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (activeView === "analisi") {
    return <NextAnalisiEconomicaPage />;
  }

  if (activeView === "gomme") {
    return <NextDossierGommePage />;
  }

  if (activeView === "rifornimenti") {
    return <NextDossierRifornimentiPage />;
  }


  if (loading) {
    return (
      <div className="dossier-wrapper">
        <div className="dossier-loading">Caricamento dossier in corso…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dossier-wrapper">
        <div className="dossier-error">
          <p>{error}</p>
          <button className="dossier-button" onClick={handleBack}>
            Torna all’elenco mezzi
          </button>
        </div>
      </div>
    );
  }

  if (!state.mezzo) {
    return (
      <div className="dossier-wrapper">
        <div className="dossier-error">
          <p>Nessun mezzo trovato per la targa: {targa}</p>
          <button className="dossier-button" onClick={handleBack}>
            Torna all’elenco mezzi
          </button>
        </div>
      </div>
    );
  }

  const { mezzo } = state;
  const librettoUrls = [mezzo.librettoUrl]
    .filter((u): u is string => typeof u === "string")
    .map((u) => u.trim())
    .filter(Boolean);

  const totaleLitri = state.rifornimenti.reduce(
    (sum, r) => sum + (r.litri || 0),
    0
  );
  void totaleLitri;

  const formatDateTime = (ts?: number | null) => {
    return formatDateTimeUI(ts ?? null);
  };

  const parseItalianDate = (d?: string): number => {
    if (!d) return 0;
    const parts = d.split(" ");
    if (parts.length < 3) return 0;
    const [gg, mm, yyyy] = parts;
    return new Date(`${yyyy}-${mm}-${gg}`).getTime();
  };

const preventivi = state.documentiCosti
  .filter((d) => d.tipo === "PREVENTIVO")
  .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));

const fatture = state.documentiCosti
  .filter((d) => d.tipo === "FATTURA")
  .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));

  const sumByCurrency = (items: FatturaPreventivo[]) => {
    let chf = 0;
    let eur = 0;
    let unknown = 0;
    items.forEach((d) => {
      const imp = typeof d.importo === "number" && !Number.isNaN(d.importo)
        ? d.importo
        : null;
      if (imp == null) return;
      const curr = d.valuta ?? "UNKNOWN";
      if (curr === "CHF") chf += imp;
      else if (curr === "EUR") eur += imp;
      else unknown += 1;
    });
    return { chf, eur, unknown };
  };

  const preventiviTotals = sumByCurrency(preventivi);
  const fattureTotals = sumByCurrency(fatture);

  const renderAmountWithCurrency = (
    value: number | undefined,
    currency: Currency
  ) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "Importo n/d";
    if (currency === "UNKNOWN") {
      return (
        <>
          {value.toFixed(2)}
          <span className="dossier-badge badge-info" style={{ marginLeft: "6px" }}>
            VALUTA DA VERIFICARE
          </span>
        </>
      );
    }
    return `${value.toFixed(2)} ${currency}`;
  };

 
  const urgenzaRank = (u?: string): number => {
    switch ((u || "").toUpperCase()) {
      case "ALTA":
        return 3;
      case "MEDIA":
        return 2;
      case "BASSA":
        return 1;
      default:
        return 0;
    }
  };

  const lavoriInAttesaMostrati = [...state.lavoriInAttesa]
    .sort((a, b) => {
      const rankDiff = urgenzaRank(b.urgenza) - urgenzaRank(a.urgenza);
      if (rankDiff !== 0) return rankDiff;
      return (
        parseItalianDate(b.dataInserimento) -
        parseItalianDate(a.dataInserimento)
      );
    })
    .slice(0, 3);

  const lavoriEseguitiMostrati = [...state.lavoriEseguiti]
    .sort(
      (a, b) =>
        parseItalianDate(b.dataInserimento) -
        parseItalianDate(a.dataInserimento)
    )
    .slice(0, 3);

  const tg = mezzo.targa.toUpperCase().trim();

  const manutenzioniPerTarga = manutenzioni
    .filter((m) => (m.targa || "").toUpperCase().trim() === tg)
    .sort(
      (a, b) =>
        (b.timestamp ?? parseItalianDate(b.data)) -
        (a.timestamp ?? parseItalianDate(a.data))
    );

  const manutenzioniMostrate = manutenzioniPerTarga.slice(0, 3);

  const manutenzioneProgrammataAttiva =
    scheduledMaintenance?.enabled ?? Boolean(mezzo.manutenzioneProgrammata);
  const manutenzioneContratto =
    scheduledMaintenance?.contratto ?? mezzo.manutenzioneContratto ?? "-";
  const manutenzioneDataInizio =
    scheduledMaintenance?.dataInizio ?? mezzo.manutenzioneDataInizio ?? null;
  const manutenzioneDataFine =
    scheduledMaintenance?.dataFine ?? mezzo.manutenzioneDataFine ?? null;
  const manutenzioneKmMax =
    scheduledMaintenance?.kmMax ?? mezzo.manutenzioneKmMax ?? "-";

  const formatKmOre = (m: Manutenzione): string => {
    const tipo = (m.tipo || "").toLowerCase();
    if (tipo === "mezzo" && m.km != null) {
      return `${m.km} KM`;
    }
    if (tipo === "altro" && m.ore != null) {
      return `${m.ore} ORE`;
    }
    if (m.km != null) {
      return `${m.km} KM`;
    }
    if (m.ore != null) {
      return `${m.ore} ORE`;
    }
    return "-";
  };
  // ========================
// Trova prezzo unitario dai documenti magazzino
// ========================
const trovaPrezzoUnitarioLegacy = (descrMov?: string): number | null => {
  if (!descrMov) return null;

  const target = descrMov.toUpperCase().trim();

  for (const doc of state.documentiMagazzino || []) {
    const righe = Array.isArray(doc.voci) ? doc.voci : [];

    for (const r of righe) {
      const desc = (r.descrizione || "").toUpperCase().trim();
      if (!desc) continue;

      // match morbido
      if (desc.includes(target) || target.includes(desc)) {
        // 1) prezzoUnitario già estratto
        if (r.prezzoUnitario != null) {
          return Number(r.prezzoUnitario);
        }

        // 2) importo + quantita → calcolo
        const imp = Number(r.importo);
        const q = Number(r.quantita);
        if (imp > 0 && q > 0) {
          return imp / q;
        }

        return null;
      }
    }
  }

  return null;
};

void trovaPrezzoUnitarioLegacy;

return (
  <div className="dossier-wrapper">

    <PdfPreviewModal
      open={pdfPreviewOpen}
      title={pdfPreviewTitle}
      pdfUrl={pdfPreviewUrl}
      fileName={pdfPreviewFileName}
      hint={pdfShareHint}
      onClose={closePdfPreview}
      onShare={handleSharePDF}
      onCopyLink={handleCopyPdfText}
      onWhatsApp={handleWhatsAppPdf}
    />

    {showLibrettoModal && (
      <div
        className="dossier-modal-overlay"
        onClick={() => setShowLibrettoModal(false)}
      >
        <div
          className="dossier-modal dossier-libretto-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="dossier-modal-header">
            <h2>Libretto - {mezzo.targa}</h2>
            <button
              className="dossier-button"
              type="button"
              onClick={() => setShowLibrettoModal(false)}
            >
              Chiudi
            </button>
          </div>

          <div className="dossier-modal-body dossier-libretto-body">
            {librettoUrls.length === 0 ? (
              <div className="dossier-empty">
                Nessun libretto associato.
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    className="dossier-button"
                    type="button"
                    disabled
                    title={CLONE_READ_ONLY_TITLE}
                  >
                    Vai a IA Libretto
                  </button>
                  <button
                    className="dossier-button"
                    type="button"
                    disabled
                    title={CLONE_READ_ONLY_TITLE}
                  >
                    Cerca in Archivio IA
                  </button>
                </div>
              </div>
            ) : (
              librettoUrls.map((url, index) => (
                <div key={`${url}_${index}`} className="dossier-libretto-item">
                  {isPdfUrl(url) ? (
                    <>
                      <iframe
                        src={url}
                        className="dossier-libretto-frame"
                        title={`Libretto PDF ${index + 1}`}
                      />
                      <div className="dossier-libretto-actions">
                        <button
                          type="button"
                          className="dossier-button"
                          onClick={() => openDocumento(url)}
                        >
                          Anteprima PDF
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="dossier-libretto-image-wrap">
                      {librettoLoadErrors[url] ? (
                        <div className="dossier-empty">
                          Impossibile caricare la foto.
                        </div>
                      ) : (
                        <img
                          src={url}
                          className="dossier-libretto-img"
                          alt={`Libretto ${index + 1}`}
                          onError={() =>
                            setLibrettoLoadErrors((prev) => ({
                              ...prev,
                              [url]: true,
                            }))
                          }
                        />
                      )}
                      <div className="dossier-libretto-actions">
                        <a
                          className="dossier-button"
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Apri immagine
                        </a>
                        {librettoLoadErrors[url] && (
                          <button
                            className="dossier-button"
                            type="button"
                            disabled
                            title={CLONE_READ_ONLY_TITLE}
                          >
                            Cerca in Archivio IA
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )}

    {showPhotoModal && photoModalUrl && (
      <div className="dossier-modal-overlay" onClick={closePhotoViewer}>
        <div
          className="dossier-modal dossier-photo-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="dossier-modal-header">
            <h2>Foto mezzo</h2>
            <button
              className="dossier-button"
              type="button"
              onClick={closePhotoViewer}
            >
              Chiudi
            </button>
          </div>
          <div className="dossier-modal-body dossier-photo-modal-body">
            <img
              src={photoModalUrl}
              alt={`Foto mezzo ${mezzo.targa}`}
              className="dossier-photo-modal-img"
            />
          </div>
        </div>
      </div>
    )}

    <div className="dossier-header-bar">
      <button className="dossier-button ghost" onClick={handleBack}>
        ⟵ Mezzi
      </button>

      <div className="dossier-header-center">
        <img src="/logo.png" alt="Logo" className="dossier-logo" />
        <div className="dossier-header-text">
          <span className="dossier-header-label">DOSSIER MEZZO</span>
          <h1 className="dossier-header-title">
            {mezzo.marca} {mezzo.modello} — {mezzo.targa}
          </h1>
        </div>
      </div>

<div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
  <button
    className="dossier-button"
    type="button"
    onClick={() => navigate(`/next/mezzi-dossier/${encodeURIComponent(mezzo.targa)}?view=analisi`)}
  >
    Analisi Economica
  </button>

  <button
    className="dossier-button"
    type="button"
    onClick={() => navigate(`/next/mezzi-dossier/${encodeURIComponent(mezzo.targa)}?view=gomme`)}
  >
    Gomme
  </button>

  <button
    className="dossier-button"
    type="button"
    onClick={() => navigate(`/next/mezzi-dossier/${encodeURIComponent(mezzo.targa)}?view=rifornimenti`)}
  >
    Rifornimenti (dettaglio)
  </button>

  <button
    className="dossier-button"
    type="button"
    onClick={() => setShowLibrettoModal(true)}
  >
    LIBRETTO
  </button>

  <button
    className="dossier-button primary"
    type="button"
    onClick={handleOpenPdf}
  >
    Anteprima PDF
  </button>
</div>
    </div>

    <div className="dossier-grid">
      {/* DATI TECNICI */}
      <section className="dossier-card dossier-card-large">
        <div className="dossier-card-header">
          <h2>Dati tecnici</h2>
        </div>

        <div className="dossier-card-body dossier-tech-grid">
          <div className="dossier-tech-block">
            <h3>Identificazione</h3>
            <ul>
              <li>
                <span>Proprietario</span>
                <strong>{mezzo.proprietario || "-"}</strong>
              </li>
              <li>
                <span>Targa</span>
                <strong>{mezzo.targa}</strong>
              </li>
              <li>
  <span>Autista abituale</span>
  <strong>{mezzo.autistaNome || "-"}</strong>
</li>

              <li>
                <span>Telaio / VIN</span>
                <strong>{mezzo.telaio || "-"}</strong>
              </li>
              <li>
                <span>Assicurazione</span>
                <strong>{mezzo.assicurazione || "-"}</strong>
              </li>
            </ul>
          </div>

          <div className="dossier-tech-block">
            <h3>Caratteristiche</h3>
            <ul>
              <li>
                <span>Marca</span>
                <strong>{mezzo.marca || "-"}</strong>
              </li>
              <li>
                <span>Modello</span>
                <strong>{mezzo.modello || "-"}</strong>
              </li>
              <li>
                <span>Categoria</span>
                <strong>{mezzo.categoria || "-"}</strong>
              </li>
              <li>
                <span>Colore</span>
                <strong>{mezzo.colore || "-"}</strong>
              </li>
            </ul>
          </div>

            <div className="dossier-tech-block">
              <h3>Motore e massa</h3>
              <ul>
                <li>
                  <span>Cilindrata</span>
                  <strong>{mezzo.cilindrata || "-"}</strong>
                </li>
                <li>
                  <span>Potenza</span>
                  <strong>{mezzo.potenza || "-"}</strong>
                </li>
                <li>
                  <span>Massa complessiva</span>
                  <strong>{mezzo.massaComplessiva || "-"}</strong>
                </li>
                <li>
                  <span>Anno</span>
                  <strong>{mezzo.anno || "-"}</strong>
                </li>
              </ul>
            </div>

            <div className="dossier-tech-block">
              <h3>Scadenze</h3>
              <ul>
                <li>
                  <span>Immatricolazione</span>
                  <strong>{formatDateUI(mezzo.dataImmatricolazione)}</strong>
                </li>
                <li>
                  <span>Revisione</span>
                  <strong>{formatDateUI(mezzo.dataScadenzaRevisione)}</strong>
                </li>
                <li>
                  <span>Note</span>
                  <strong style={{ whiteSpace: "pre-line" }}>{mezzo.note || "-"}</strong>
                </li>
                <li>
  <span>Manutenzione programmata</span>
  <strong>
    {manutenzioneProgrammataAttiva ? "ATTIVA" : "NON ATTIVA"}
  </strong>
</li>

{manutenzioneProgrammataAttiva && (
  <>
    <li>
      <span>Contratto</span>
      <strong>{manutenzioneContratto}</strong>
    </li>
    <li>
      <span>Periodo</span>
      <strong>
        {formatDateUI(manutenzioneDataInizio)} &rarr;{" "}
        {formatDateUI(manutenzioneDataFine)}
      </strong>
    </li>
    <li>
      <span>KM massimi</span>
      <strong>{manutenzioneKmMax}</strong>
    </li>
  </>
)}

              </ul>
            </div>
          </div>
        </section>

        {/* FOTO MEZZO */}
        <section className="dossier-card dossier-photo-card">
          <div className="dossier-card-header">
            <h2>Foto mezzo</h2>
          </div>

          <div className="dossier-card-body dossier-photo-body">
            {mezzo.fotoUrl ? (
              <div
                className="dossier-photo-thumb"
                role="button"
                tabIndex={0}
                aria-label="Apri foto mezzo"
                onClick={() => openPhotoViewer(mezzo.fotoUrl!)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openPhotoViewer(mezzo.fotoUrl!);
                  }
                }}
              >
                <div className="dossier-mezzo-photo-frame">
                  <div
                    className="dossier-mezzo-photo-bg"
                    style={{ backgroundImage: `url(${mezzo.fotoUrl})` }}
                  />
                  <img
                    src={mezzo.fotoUrl}
                    alt={mezzo.targa}
                    className="dossier-mezzo-photo"
                  />
                </div>
              </div>
            ) : (
              <div className="dossier-photo-placeholder">
                Nessuna foto caricata
              </div>
            )}
          </div>
        </section>

        {/* LAVORI */}
        <section className="dossier-card">
          <div className="dossier-card-header">
            <h2>Lavori</h2>
          </div>

          <div className="dossier-card-body dossier-work-grid">
            <div>
              <h3>In attesa</h3>

              {lavoriInAttesaMostrati.length === 0 ? (
                <p className="dossier-empty">Nessun lavoro in attesa.</p>
              ) : (
                <ul className="dossier-list">
                  {lavoriInAttesaMostrati.map((l) => (
                    <li
                      key={l.id}
                      className="dossier-list-item"
                      title={CLONE_READ_ONLY_TITLE}
                      style={{ cursor: "default" }}
                    >
                      <div className="dossier-list-main">
                        <span className="dossier-badge badge-info">
                          IN ATTESA
                        </span>
                        <strong>{l.descrizione}</strong>
                      </div>
                      <div className="dossier-list-meta">
                        <span>{l.dettagli}</span>
                        <span>{l.dataInserimento}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <button
                className="dossier-button"
                type="button"
                onClick={() => setShowAttesaModal(true)}
                style={{ marginTop: "12px" }}
              >
                Mostra tutti
              </button>
            </div>

            <div>
              <h3>Eseguiti</h3>

              {lavoriEseguitiMostrati.length === 0 ? (
                <p className="dossier-empty">Nessun lavoro eseguito.</p>
              ) : (
                <ul className="dossier-list">
                  {lavoriEseguitiMostrati.map((l) => (
                    <li
                      key={l.id}
                      className="dossier-list-item"
                      title={CLONE_READ_ONLY_TITLE}
                      style={{ cursor: "default" }}
                    >
                      <div className="dossier-list-main">
                        <span className="dossier-badge badge-success">
                          ESEGUITO
                        </span>
                        <strong>{l.descrizione}</strong>
                      </div>
                      <div className="dossier-list-meta">
                        <span>{l.dettagli}</span>
                        <span>{l.dataInserimento}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <button
                className="dossier-button"
                type="button"
                onClick={() => setShowEseguitiModal(true)}
                style={{ marginTop: "12px" }}
              >
                Mostra tutti
              </button>
            </div>
          </div>
        </section>

        {/* MANUTENZIONI */}
        <section className="dossier-card">
          <div className="dossier-card-header">
            <h2>Manutenzioni</h2>
            <button
              className="dossier-button"
              type="button"
              onClick={() => setShowManutenzioniModal(true)}
            >
              Mostra tutti
            </button>
          </div>

          <div className="dossier-card-body">
            {manutenzioniMostrate.length === 0 ? (
              <p className="dossier-empty">
                Nessuna manutenzione registrata per questo mezzo.
              </p>
            ) : (
              <ul className="dossier-list">
                {manutenzioniMostrate.map((m) => (
                  <li key={m.id} className="dossier-list-item">
                    <div className="dossier-list-main">
                      <strong>{m.descrizione || "-"}</strong>
                    </div>
                    <div className="dossier-list-meta">
                      <span>{m.data || "-"}</span>
                      <span>{formatKmOre(m)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* MATERIALI */}
        <section className="dossier-card dossier-card-full">
          <div className="dossier-card-header">
            <h2>Materiali e movimenti inventario</h2>
          </div>

          <div className="dossier-card-body">
            {state.movimentiMateriali.length === 0 ? (
              <p className="dossier-empty">
                Nessun movimento materiali registrato per questo mezzo.
              </p>
            ) : (
              <div className="dossier-table-wrapper">
                <table className="dossier-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrizione</th>
                      <th>Q.tà</th>
                      <th>Destinatario</th>
                      <th>Fornitore</th>
                      <th>Motivo</th>
                            <th>Costo</th>

                    </tr>
                  </thead>

                  <tbody>
                    {state.movimentiMateriali.map((m) => (
                      <tr key={m.id}>
                        <td>{m.data || "-"}</td>
                        <td>{m.descrizione || m.materialeLabel || "-"}</td>
                        <td>
                          {m.quantita} {m.unita}
                        </td>
                        <td>{m.destinatario?.label || "-"}</td>
                        <td>{m.fornitore || m.fornitoreLabel || "-"}</td>
                        <td>{m.motivo || "-"}</td>
<td>
  {(() => {
    const pu = m.costoTotale;
    if (pu == null) return "–";

    const totale = pu;

    return renderAmountWithCurrency(totale, m.costoCurrency ?? "UNKNOWN");
  })()}
</td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* RIFORNIMENTI */}
        <section className="dossier-card">
          <div className="dossier-card-header">
            <h2>Rifornimenti</h2>
          </div>

          <div className="dossier-card-body">
            {state.rifornimenti.length === 0 ? (
              <p className="dossier-empty">
                Nessun rifornimento registrato per questo mezzo.
              </p>
            ) : (
              <div className="dossier-table-wrapper">
                <table className="dossier-table">
                  <thead>
                    <tr>
                      <th>Data/Ora</th>
                      <th>Litri</th>
                      <th>Km</th>
                      <th>Tipo</th>
                      <th>Autista</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.rifornimenti.map((r) => (
                      <tr key={r.id}>
                        <td>{formatDateTime(r.data)}</td>
                        <td>{r.litri ?? "-"}</td>
                        <td>{r.km ?? "-"}</td>
                        <td>{r.tipo ?? "-"}</td>
                        <td>
                          {r.autistaNome
                            ? `${r.autistaNome}${
                                r.badgeAutista ? ` (${r.badgeAutista})` : ""
                              }`
                            : r.badgeAutista ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* COSTI */}
        {/* PREVENTIVI */}
        <section className="dossier-card">
          <div className="dossier-card-header">
            <h2>Preventivi</h2>

            <div className="dossier-chip">
              Totale preventivi:{" "}
              <strong>CHF {preventiviTotals.chf.toFixed(2)}</strong>
              <span style={{ marginLeft: "8px" }}>
                EUR {preventiviTotals.eur.toFixed(2)}
              </span>
              {preventiviTotals.unknown > 0 && (
                <span className="dossier-badge badge-info" style={{ marginLeft: "8px" }}>
                  VALUTA DA VERIFICARE ({preventiviTotals.unknown})
                </span>
              )}
            </div>
          </div>

          <div className="dossier-card-body">
            {preventivi.length === 0 ? (
              <p className="dossier-empty">
                Nessun preventivo registrato.
              </p>
            ) : (
              <ul className="dossier-list">
                {preventivi.map((d) => (
                  <li key={d.id} className="dossier-list-item">
                    <div className="dossier-list-main">
                      <span className="dossier-badge badge-info">
                        {d.tipo}
                      </span>
                      <strong>{d.descrizione || "-"}</strong>
                    </div>

<div className="dossier-list-meta">
  <span>{d.data}</span>
  <span>{renderAmountWithCurrency(d.importo, d.valuta ?? "UNKNOWN")}</span>
  <span>{d.fornitoreLabel || "-"}</span>

  {d.fileUrl && (
<button
  className="dossier-button"
  type="button"
  onClick={() => openDocumento(d.fileUrl!)}
>
  Anteprima PDF
</button>
  )}
<button
  className="dossier-button"
  type="button"
  disabled
  title="Clone read-only"
>
  Elimina
</button>
</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* FATTURE */}
        <section className="dossier-card">
          <div className="dossier-card-header">
            <h2>Fatture</h2>

            <div className="dossier-chip">
              Totale fatture:{" "}
              <strong>CHF {fattureTotals.chf.toFixed(2)}</strong>
              <span style={{ marginLeft: "8px" }}>
                EUR {fattureTotals.eur.toFixed(2)}
              </span>
              {fattureTotals.unknown > 0 && (
                <span className="dossier-badge badge-info" style={{ marginLeft: "8px" }}>
                  VALUTA DA VERIFICARE ({fattureTotals.unknown})
                </span>
              )}
            </div>
          </div>

          <div className="dossier-card-body">
            {fatture.length === 0 ? (
              <p className="dossier-empty">
                Nessuna fattura registrata.
              </p>
            ) : (
              <ul className="dossier-list">
                {fatture.map((d) => (
                  <li key={d.id} className="dossier-list-item">
                    <div className="dossier-list-main">
                      <span className="dossier-badge badge-danger">
                        {d.tipo}
                      </span>
                      <strong>{d.descrizione || "-"}</strong>
                    </div>

<div className="dossier-list-meta">
  <span>{d.data}</span>
  <span>{renderAmountWithCurrency(d.importo, d.valuta ?? "UNKNOWN")}</span>
  <span>{d.fornitoreLabel || "-"}</span>

  {d.fileUrl && (
<button
  className="dossier-button"
  type="button"
  onClick={() => openDocumento(d.fileUrl!)}
>
  Anteprima PDF
</button>
  )}
</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
       </div>    

      {/* MODALI */}
      {showAttesaModal && (
        <div className="dossier-modal-overlay">
          <div className="dossier-modal">
            <div className="dossier-modal-header">
              <h2>Lavori in attesa — {targa}</h2>
              <button
                className="dossier-button"
                onClick={() => setShowAttesaModal(false)}
              >
                Chiudi
              </button>
            </div>

            <div className="dossier-modal-body">
              {state.lavoriInAttesa.length === 0 ? (
                <p>Nessun lavoro in attesa.</p>
              ) : (
                <ul className="dossier-list">
                  {state.lavoriInAttesa.map((l) => (
                    <li
                      key={l.id}
                      className="dossier-list-item"
                      title={CLONE_READ_ONLY_TITLE}
                      style={{ cursor: "default" }}
                    >
                      <div className="dossier-list-main">
                        <span className="dossier-badge badge-info">
                          IN ATTESA
                        </span>
                        <strong>{l.descrizione}</strong>
                      </div>
                      <div className="dossier-list-meta">
                        <span>{l.dettagli}</span>
                        <span>{l.dataInserimento}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {showEseguitiModal && (
        <div className="dossier-modal-overlay">
          <div className="dossier-modal">
            <div className="dossier-modal-header">
              <h2>Lavori eseguiti — {targa}</h2>
              <button
                className="dossier-button"
                onClick={() => setShowEseguitiModal(false)}
              >
                Chiudi
              </button>
            </div>

            <div className="dossier-modal-body">
              {state.lavoriEseguiti.length === 0 ? (
                <p>Nessun lavoro eseguito.</p>
              ) : (
                <ul className="dossier-list">
                  {state.lavoriEseguiti.map((l) => (
                    <li
                      key={l.id}
                      className="dossier-list-item"
                      title={CLONE_READ_ONLY_TITLE}
                      style={{ cursor: "default" }}
                    >
                      <div className="dossier-list-main">
                        <span className="dossier-badge badge-success">
                          ESEGUITO
                        </span>
                        <strong>{l.descrizione}</strong>
                      </div>
                      <div className="dossier-list-meta">
                        <span>{l.dettagli}</span>
                        <span>{l.dataInserimento}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {showManutenzioniModal && (
        <div className="dossier-modal-overlay">
          <div className="dossier-modal">
            <div className="dossier-modal-header">
              <h2>Manutenzioni — {targa}</h2>
              <button
                className="dossier-button"
                onClick={() => setShowManutenzioniModal(false)}
              >
                Chiudi
              </button>
            </div>

            <div className="dossier-modal-body">
              {manutenzioniPerTarga.length === 0 ? (
                <p>Nessuna manutenzione registrata.</p>
              ) : (
                <ul className="dossier-list">
                  {manutenzioniPerTarga.map((m) => (
                    <li key={m.id} className="dossier-list-item">
                      <div className="dossier-list-main">
                        <strong>{m.descrizione || "-"}</strong>
                      </div>
                      <div className="dossier-list-meta">
                        <span>{m.data || "-"}</span>
                        <span>{formatKmOre(m)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
     </div>
  );
}  

export default DossierMezzo;




