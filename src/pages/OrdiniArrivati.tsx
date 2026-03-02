// src/pages/OrdiniArrivati.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getItemSync } from "../utils/storageSync";
import type { Ordine } from "../types/ordini";
import { generateSmartPDFBlob } from "../utils/pdfEngine";
import PdfPreviewModal from "../components/PdfPreviewModal";
import {
  buildPdfShareText,
  buildWhatsAppShareUrl,
  copyTextToClipboard,
  openPreview,
  revokePdfPreviewUrl,
  sharePdfFile,
} from "../utils/pdfPreview";
import "./OrdiniInAttesa.css"; // riuso lo stesso layout di OrdiniInAttesa

interface OrdiniArrivatiProps {
  embedded?: boolean;
}

const OrdiniArrivati: React.FC<OrdiniArrivatiProps> = ({ embedded = false }) => {
  const navigate = useNavigate();

  const [ordini, setOrdini] = useState<Ordine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState("ordini-arrivati.pdf");
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState("Anteprima PDF ordini arrivati");
  const [pdfShareHint, setPdfShareHint] = useState<string | null>(null);

  useEffect(() => {
    const loadOrdini = async () => {
      try {
        setLoading(true);
        setError(null);

        const ordiniRaw = await getItemSync("@ordini");
        const arr = Array.isArray(ordiniRaw) ? (ordiniRaw as Ordine[]) : [];

        const arrivati = arr.filter((ordine) =>
          ordine.materiali.some((m) => m.arrivato)
        );

        setOrdini(arrivati);
      } catch (err) {
        console.error("Errore caricamento ordini arrivati:", err);
        setError("Errore durante il caricamento degli ordini arrivati.");
      } finally {
        setLoading(false);
      }
    };

    void loadOrdini();
  }, []);

  const openDettaglio = (id: string) => {
    navigate(`/dettaglio-ordine/${id}`);
  };

  const formatFileDate = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
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
      contextLabel: "Ordini arrivati",
      dateLabel: formatFileDate(),
      fileName: pdfPreviewFileName || "ordini-arrivati.pdf",
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
      fileName: pdfPreviewFileName || "ordini-arrivati.pdf",
      title: pdfPreviewTitle || "Anteprima PDF ordini arrivati",
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

  const handleCopyPDFText = async () => {
    const copied = await copyTextToClipboard(buildPdfShareMessage());
    setPdfShareHint(copied ? "Testo copiato." : "Copia non disponibile.");
  };

  const handleWhatsAppPDF = () => {
    const text = buildPdfShareMessage();
    window.open(buildWhatsAppShareUrl(text), "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    return () => {
      revokePdfPreviewUrl(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const esportaPDF = async (ordine: Ordine) => {
    const ordiniFornitore = ordini.filter(
      (o) => o.nomeFornitore === ordine.nomeFornitore
    );

    const rows = ordiniFornitore.flatMap((o) =>
      o.materiali
        .filter((m) => m.arrivato)
        .map((m) => ({
          fornitore: o.nomeFornitore,
          dataOrdine: o.dataOrdine,
          descrizione: m.descrizione,
          quantita: `${m.quantita} ${m.unita}`,
          dataArrivo: m.dataArrivo ?? "",
        }))
    );

    if (rows.length === 0) return;

    try {
      const fileDate = formatFileDate();
      const preview = await openPreview({
        source: async () =>
          generateSmartPDFBlob({
            kind: "table",
            title: `Ordini Arrivati - ${ordine.nomeFornitore}`,
            columns: ["fornitore", "dataOrdine", "descrizione", "quantita", "dataArrivo"],
            rows,
          }),
        fileName: `ordini-arrivati-${(ordine.nomeFornitore || "fornitore").replace(/\s+/g, "-")}-${fileDate}.pdf`,
        previousUrl: pdfPreviewUrl,
      });

      setPdfShareHint(null);
      setPdfPreviewBlob(preview.blob);
      setPdfPreviewFileName(preview.fileName);
      setPdfPreviewTitle(`Anteprima PDF ordini arrivati - ${ordine.nomeFornitore}`);
      setPdfPreviewUrl(preview.url);
      setPdfPreviewOpen(true);
    } catch (err) {
      console.error("Errore anteprima PDF ordini arrivati:", err);
      setError("Errore durante la generazione dell'anteprima PDF.");
    }
  };

  if (loading) {
    return (
      <div className={`ordini-attesa-page${embedded ? " ordini-attesa-page--embedded" : ""}`}>
        <div className="ordini-attesa-card">
          <p>Caricamento ordini arrivati...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`ordini-attesa-page${embedded ? " ordini-attesa-page--embedded" : ""}`}>
      {!embedded && (
        <header className="ordini-attesa-header">
          <img
            src="/logo.png"
            alt="Logo"
            className="ordini-attesa-logo"
            onClick={() => navigate("/")}
          />
          <h1>Ordini Arrivati</h1>
        </header>
      )}

      <div className={`ordini-attesa-wrapper${embedded ? " ordini-attesa-wrapper--embedded" : ""}`}>
        {error && <p className="error-alert">{error}</p>}

        {ordini.length === 0 ? (
          <div className="no-orders-card">
            <p>Nessun ordine arrivato.</p>
          </div>
        ) : (
          <div className="orders-list">
            {ordini.map((ordine) => {
              const tot = ordine.materiali.length;
              const arr = ordine.materiali.filter((m) => m.arrivato).length;
              const nonArr = tot - arr;

              return (
                <div className="order-card" key={ordine.id}>
                  <div className="order-info">
                    <h2 className="order-title">{ordine.nomeFornitore}</h2>
                    <p className="order-date">Ordine del {ordine.dataOrdine}</p>

                    <div className="order-stats">
                      <span className="order-stat">
                        Totale materiali: <strong>{tot}</strong>
                      </span>
                      <span className="order-stat green">
                        Arrivati: <strong>{arr}</strong>
                      </span>
                      <span className="order-stat red">
                        In attesa: <strong>{nonArr}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="order-actions">
                    <button
                      className="btn-primary"
                      onClick={() => openDettaglio(ordine.id)}
                    >
                      Dettaglio ordine
                    </button>

                    <button
                      className="btn-secondary"
                      onClick={() => esportaPDF(ordine)}
                    >
                      Anteprima PDF
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
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
};

export default OrdiniArrivati;
