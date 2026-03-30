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
import "../pages/LibrettiExport.css";
import {
  generateNextLibrettiExportPreview,
  readNextLibrettiExportSnapshot,
  type NextLibrettiExportItem,
  type NextLibrettiExportSnapshot,
} from "./domain/nextLibrettiExportDomain";
import { NEXT_IA_PATH } from "./nextStructuralPaths";

const CATEGORY_ORDER = [
  "trattore stradale",
  "motrice 2 assi",
  "motrice 3 assi",
  "motrice 4 assi",
  "semirimorchio asse fisso",
  "semirimorchio asse sterzante",
  "pianale",
  "biga",
  "centina",
  "vasca",
] as const;
const ALTRO_CATEGORY = "Altro";

type LibrettiGroup = {
  category: string;
  rows: NextLibrettiExportItem[];
};

function formatFileDate() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function normalizeCategoryKey(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function resolveCategoryGroup(categoria: string): string {
  const key = normalizeCategoryKey(categoria);
  const match = CATEGORY_ORDER.find((item) => normalizeCategoryKey(item) === key);
  return match ?? ALTRO_CATEGORY;
}

export default function NextLibrettiExportPage() {
  const navigate = useNavigate();

  const [snapshot, setSnapshot] = useState<NextLibrettiExportSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [generating, setGenerating] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState("libretti.pdf");
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState("Anteprima PDF libretti");
  const [pdfShareHint, setPdfShareHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const nextSnapshot = await readNextLibrettiExportSnapshot();
        if (cancelled) return;
        setSnapshot(nextSnapshot);
      } catch (loadError) {
        if (cancelled) return;
        setSnapshot(null);
        setError(
          loadError instanceof Error ? loadError.message : "Errore caricamento mezzi.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      revokePdfPreviewUrl(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const rows = useMemo(() => snapshot?.items ?? [], [snapshot]);

  const selectedRows = useMemo(
    () => rows.filter((row) => selected[row.id]),
    [rows, selected],
  );

  const groupedRows = useMemo<LibrettiGroup[]>(() => {
    const categoryMap = new Map<string, NextLibrettiExportItem[]>();
    rows.forEach((row) => {
      const category = resolveCategoryGroup(row.categoria);
      const list = categoryMap.get(category) ?? [];
      list.push(row);
      categoryMap.set(category, list);
    });

    return [...CATEGORY_ORDER, ALTRO_CATEGORY]
      .map((category) => ({
        category,
        rows: [...(categoryMap.get(category) ?? [])].sort((left, right) =>
          left.targa.localeCompare(right.targa, "it", { sensitivity: "base" }),
        ),
      }))
      .filter((group) => group.rows.length > 0);
  }, [rows]);

  const selectedCount = selectedRows.length;
  const rowsWithLibretto = rows.length;

  const closePdfPreview = () => {
    revokePdfPreviewUrl(pdfPreviewUrl);
    setPdfPreviewOpen(false);
    setPdfPreviewUrl(null);
    setPdfPreviewBlob(null);
    setPdfShareHint(null);
  };

  const buildShareMessage = () =>
    buildPdfShareText({
      contextLabel: "Export libretti mezzi",
      dateLabel: formatFileDate(),
      fileName: pdfPreviewFileName || "libretti.pdf",
      url: pdfPreviewUrl,
    });

  const handleSharePDF = async () => {
    if (!pdfPreviewBlob) {
      const copied = await copyTextToClipboard(buildShareMessage());
      setPdfShareHint(copied ? "Link copiato." : "Apri prima un'anteprima PDF.");
      return;
    }

    const result = await sharePdfFile({
      blob: pdfPreviewBlob,
      fileName: pdfPreviewFileName || "libretti.pdf",
      title: pdfPreviewTitle || "Anteprima PDF libretti",
      text: buildShareMessage(),
    });

    if (result.status === "shared") {
      setPdfShareHint("PDF condiviso.");
      return;
    }
    if (result.status === "aborted") return;

    const copied = await copyTextToClipboard(buildShareMessage());
    setPdfShareHint(
      copied
        ? "Condivisione non disponibile: testo copiato."
        : "Condivisione non disponibile.",
    );
  };

  const handleCopyPDFText = async () => {
    const copied = await copyTextToClipboard(buildShareMessage());
    setPdfShareHint(copied ? "Testo copiato." : "Copia non disponibile.");
  };

  const handleWhatsAppPDF = () => {
    const text = buildShareMessage();
    window.open(buildWhatsAppShareUrl(text), "_blank", "noopener,noreferrer");
  };

  const toggleSelected = (id: string) => {
    setSelected((current) => ({ ...current, [id]: !current[id] }));
  };

  const handlePreview = async () => {
    if (selectedCount === 0) return;

    try {
      setGenerating(true);
      const preview = await openPreview({
        source: async () => {
          const generated = await generateNextLibrettiExportPreview(selectedRows);
          return { blob: generated.blob, fileName: generated.fileName };
        },
        fileName: `libretti_${formatFileDate()}_${selectedRows.length}.pdf`,
        previousUrl: pdfPreviewUrl,
      });

      setPdfShareHint(null);
      setPdfPreviewBlob(preview.blob);
      setPdfPreviewFileName(preview.fileName);
      setPdfPreviewTitle(`Anteprima PDF libretti (${selectedRows.length} targhe)`);
      setPdfPreviewUrl(preview.url);
      setPdfPreviewOpen(true);
    } catch (loadError) {
      console.error("Errore anteprima PDF libretti:", loadError);
      window.alert("Impossibile generare l'anteprima PDF.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="libretti-export-page">
      <div className="libretti-export-shell">
        <header className="libretti-export-header">
          <button
            type="button"
            className="libretti-export-back"
            onClick={() => navigate(NEXT_IA_PATH)}
          >
            Torna a IA
          </button>
          <h1>Libretti (Export PDF)</h1>
          <p>
            Seleziona piu mezzi e genera un unico PDF con i libretti raggruppati per
            targa.
          </p>
        </header>

        <div className="libretti-export-toolbar">
          <div className="libretti-export-meta">
            <span>Mezzi: {snapshot?.counts.totalMezzi ?? rows.length}</span>
            <span>Con libretto: {rowsWithLibretto}</span>
          </div>
          <button
            type="button"
            className="libretti-export-cta"
            disabled={selectedCount === 0 || generating}
            onClick={() => {
              void handlePreview();
            }}
          >
            {generating
              ? "Generazione PDF..."
              : `Anteprima PDF (${selectedCount} selezionati)`}
          </button>
        </div>

        {pdfShareHint ? <div className="libretti-export-state">{pdfShareHint}</div> : null}
        {!loading && !error && snapshot?.limitations.length ? (
          <div className="libretti-export-state">
            {snapshot.limitations.join(" ")}
          </div>
        ) : null}

        {loading ? (
          <div className="libretti-export-state">Caricamento mezzi...</div>
        ) : error ? (
          <div className="libretti-export-state libretti-export-state--error">{error}</div>
        ) : rows.length === 0 ? (
          <div className="libretti-export-state">Nessun mezzo disponibile.</div>
        ) : (
          groupedRows.map((group) => (
            <section key={group.category} className="libretti-export-group">
              <h2 className="libretti-export-group-title">{group.category.toUpperCase()}</h2>
              <div className="libretti-export-grid">
                {group.rows.map((row) => (
                  <label
                    key={row.id}
                    className={`libretti-card ${selected[row.id] ? "is-selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(selected[row.id])}
                      onChange={() => toggleSelected(row.id)}
                    />
                    <span className="libretti-card-check" aria-hidden="true" />

                    <div className="libretti-card-body">
                      <div className="libretti-card-targa">{row.targa}</div>
                      <div className="libretti-card-label">{row.label}</div>
                      <span className="libretti-card-badge">✓ Libretto</span>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          ))
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
}
