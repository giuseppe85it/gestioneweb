import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDownloadURL, ref } from "firebase/storage";
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
  generateLibrettiPhotosPDFBlob,
  type LibrettiPhotosSection,
} from "../utils/pdfEngine";
import { storage } from "../firebase";
import { getItemSync } from "../utils/storageSync";
import "./LibrettiExport.css";

type MezzoRaw = {
  id?: string;
  targa?: string;
  categoria?: string;
  tipo?: string;
  marca?: string;
  modello?: string;
  librettoUrl?: string | null;
  librettoStoragePath?: string | null;
};

type MezzoRow = {
  id: string;
  targa: string;
  label: string;
  categoria: string;
  librettoUrl: string;
  librettoStoragePath: string;
  hasLibretto: boolean;
};

const MEZZI_KEY = "@mezzi_aziendali";
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
const URL_CHECK_TIMEOUT_MS = 7000;

const normalizeTarga = (value: unknown): string =>
  String(value ?? "").trim().toUpperCase();

const safeText = (value: unknown): string => String(value ?? "").trim();
const normalizeCategoryKey = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const resolveCategoryGroup = (categoria: string): string => {
  const key = normalizeCategoryKey(categoria);
  const match = CATEGORY_ORDER.find((item) => normalizeCategoryKey(item) === key);
  return match ?? ALTRO_CATEGORY;
};

const resolveLabel = (mezzo: MezzoRaw): string => {
  const categoria = safeText(mezzo.categoria);
  if (categoria) return categoria;

  const tipo = safeText(mezzo.tipo);
  if (tipo) return tipo;

  const marca = safeText(mezzo.marca);
  const modello = safeText(mezzo.modello);
  const marcaModello = [marca, modello].filter(Boolean).join(" ");
  return marcaModello || "-";
};

const formatFileDate = () => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const fetchWithTimeout = async (
  url: string,
  method: "HEAD" | "GET",
  timeoutMs = URL_CHECK_TIMEOUT_MS
) => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method,
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timer);
  }
};

const isUrlReachable = async (url: string) => {
  const target = safeText(url);
  if (!target) return false;

  try {
    const head = await fetchWithTimeout(target, "HEAD");
    if (head.ok) return true;
    if (head.status === 404) return false;
  } catch {
    // fallback GET
  }

  try {
    const get = await fetchWithTimeout(target, "GET");
    return get.ok;
  } catch {
    return false;
  }
};

export default function LibrettiExport() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<MezzoRow[]>([]);
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

        const raw = await getItemSync(MEZZI_KEY);
        const list = Array.isArray(raw) ? raw : [];

        const mapped = list
          .map((item, index) => {
            const mezzo = (item || {}) as MezzoRaw;
            const targa = normalizeTarga(mezzo.targa);
            if (!targa) return null;

            const librettoUrl = safeText(mezzo.librettoUrl);
            return {
              id: safeText(mezzo.id) || `${targa}_${index}`,
              targa,
              label: resolveLabel(mezzo),
              categoria: safeText(mezzo.categoria),
              librettoUrl,
              librettoStoragePath: safeText(mezzo.librettoStoragePath),
              hasLibretto: Boolean(librettoUrl),
            } satisfies MezzoRow;
          })
          .filter((item): item is MezzoRow => Boolean(item))
          .sort((a, b) => a.targa.localeCompare(b.targa));

        if (!cancelled) setRows(mapped);
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Errore caricamento mezzi.";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectableRows = useMemo(
    () => rows.filter((row) => row.hasLibretto),
    [rows]
  );

  const selectedRows = useMemo(
    () => selectableRows.filter((row) => selected[row.id]),
    [selectableRows, selected]
  );

  const selectedCount = selectedRows.length;
  const rowsWithLibretto = useMemo(
    () => rows.filter((row) => row.hasLibretto).length,
    [rows]
  );

  const groupedRows = useMemo(() => {
    const categoryMap = new Map<string, MezzoRow[]>();
    selectableRows.forEach((row) => {
      const category = resolveCategoryGroup(row.categoria);
      const list = categoryMap.get(category) ?? [];
      list.push(row);
      categoryMap.set(category, list);
    });

    return [...CATEGORY_ORDER, ALTRO_CATEGORY]
      .map((category) => ({
        category,
        rows: [...(categoryMap.get(category) ?? [])].sort((a, b) =>
          a.targa.localeCompare(b.targa)
        ),
      }))
      .filter((group) => group.rows.length > 0);
  }, [selectableRows]);

  const closePdfPreview = () => {
    revokePdfPreviewUrl(pdfPreviewUrl);
    setPdfPreviewOpen(false);
    setPdfPreviewUrl(null);
    setPdfPreviewBlob(null);
    setPdfShareHint(null);
  };

  useEffect(() => {
    return () => {
      revokePdfPreviewUrl(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

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
        : "Condivisione non disponibile."
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
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePreview = async () => {
    if (selectedCount === 0) return;

    const sections: LibrettiPhotosSection[] = [];

    for (const row of selectedRows) {
      let selectedImageRef = row.librettoUrl;
      let urlReachable = await isUrlReachable(row.librettoUrl);

      if (!urlReachable && row.librettoStoragePath) {
        try {
          const repairedUrl = await getDownloadURL(ref(storage, row.librettoStoragePath));
          if (repairedUrl) {
            selectedImageRef = repairedUrl;
            urlReachable = true;
          }
        } catch (err) {
          console.error("Fallback downloadURL fallito:", {
            targa: row.targa,
            storagePath: row.librettoStoragePath,
            error: err,
          });
        }
      }

      const imageRef = selectedImageRef || row.librettoUrl;
      if (!imageRef) continue;

      sections.push({
        targa: row.targa,
        label: row.label,
        images: [imageRef],
      });

      if (!urlReachable) {
        console.warn("Libretto non raggiungibile anche dopo fallback:", {
          targa: row.targa,
          librettoUrl: row.librettoUrl,
          librettoStoragePath: row.librettoStoragePath,
        });
      }
    }

    if (sections.length === 0) {
      alert("Nessun libretto disponibile nelle targhe selezionate.");
      return;
    }

    try {
      setGenerating(true);
      const fileDate = formatFileDate();
      const preview = await openPreview({
        source: () =>
          generateLibrettiPhotosPDFBlob({
            title: "Libretti mezzi",
            sections,
            fileName: `libretti_${fileDate}_${sections.length}`,
          }),
        fileName: `libretti_${fileDate}_${sections.length}.pdf`,
        previousUrl: pdfPreviewUrl,
      });

      setPdfShareHint(null);
      setPdfPreviewBlob(preview.blob);
      setPdfPreviewFileName(preview.fileName);
      setPdfPreviewTitle(`Anteprima PDF libretti (${sections.length} targhe)`);
      setPdfPreviewUrl(preview.url);
      setPdfPreviewOpen(true);
    } catch (err) {
      console.error("Errore anteprima PDF libretti:", err);
      alert("Impossibile generare l'anteprima PDF.");
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
            onClick={() => navigate("/ia")}
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
            <span>Mezzi: {rows.length}</span>
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

        {loading ? (
          <div className="libretti-export-state">Caricamento mezzi...</div>
        ) : error ? (
          <div className="libretti-export-state libretti-export-state--error">{error}</div>
        ) : selectableRows.length === 0 ? (
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
