import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { openPreview, revokePdfPreviewUrl } from "../utils/pdfPreview";
import "./next-shell.css";
import "../pages/LibrettiExport.css";
import NextPdfPreviewModal from "./NextPdfPreviewModal";
import {
  generateNextLibrettiExportPreview,
  readNextLibrettiExportSnapshot,
  type NextLibrettiExportItem,
} from "./domain/nextLibrettiExportDomain";
import InternalAiUniversalHandoffBanner from "./internal-ai/InternalAiUniversalHandoffBanner";
import { useInternalAiUniversalHandoffConsumer } from "./internal-ai/internalAiUniversalHandoffConsumer";

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

function normalizeCategoryKey(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function resolveCategoryGroup(categoria: string): string {
  const key = normalizeCategoryKey(categoria);
  const match = CATEGORY_ORDER.find((item) => normalizeCategoryKey(item) === key);
  return match ?? ALTRO_CATEGORY;
}

function NextLibrettiExportPage() {
  const handoff = useInternalAiUniversalHandoffConsumer({
    moduleId: "next.libretti_export",
  });
  const location = useLocation();
  const backToIa = location.search ? `/next/ia${location.search}` : "/next/ia";
  const lifecycleRef = useRef<string | null>(null);

  const [rows, setRows] = useState<NextLibrettiExportItem[]>([]);
  const [totalMezzi, setTotalMezzi] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [generating, setGenerating] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState("Anteprima PDF libretti");
  const [previewNote, setPreviewNote] = useState<string | null>(
    "Condivisione, copia link, WhatsApp e download restano bloccati nel clone read-only."
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const snapshot = await readNextLibrettiExportSnapshot();
        if (cancelled) return;
        setRows(snapshot.items);
        setTotalMezzi(snapshot.counts.totalMezzi);
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Errore caricamento libretti.";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
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

  const selectedRows = useMemo(
    () => rows.filter((row) => selected[row.id]),
    [rows, selected]
  );

  useEffect(() => {
    if (handoff.state.status !== "ready" || !rows.length) {
      return;
    }

    const targetTarga = handoff.state.prefill.targa?.toLowerCase();
    if (!targetTarga) {
      return;
    }

    const matched = rows.find((row) => row.targa.toLowerCase() === targetTarga);
    if (!matched) {
      return;
    }

    setSelected((current) => ({
      ...current,
      [matched.id]: true,
    }));

    if (lifecycleRef.current === handoff.state.payload.handoffId) {
      return;
    }

    handoff.acknowledge(
      "prefill_applicato",
      "Libretti Export ha selezionato la targa richiesta dal payload IA.",
    );
    handoff.acknowledge(
      handoff.state.requiresVerification ? "da_verificare" : "completato",
      handoff.state.requiresVerification
        ? "Libretti Export ha applicato il prefill ma resta una verifica aperta sui campi segnalati."
        : "Libretti Export ha agganciato il payload IA e seleziona il libretto corretto.",
    );
    lifecycleRef.current = handoff.state.payload.handoffId;
  }, [handoff, rows]);

  const groupedRows = useMemo(() => {
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
          left.targa.localeCompare(right.targa, "it", { sensitivity: "base" })
        ),
      }))
      .filter((group) => group.rows.length > 0);
  }, [rows]);

  const closePdfPreview = () => {
    revokePdfPreviewUrl(pdfPreviewUrl);
    setPdfPreviewOpen(false);
    setPdfPreviewUrl(null);
    setPreviewNote("Condivisione, copia link, WhatsApp e download restano bloccati nel clone read-only.");
  };

  const toggleSelected = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePreview = async () => {
    if (selectedRows.length === 0) return;

    try {
      setGenerating(true);
      setError(null);
      const preview = await openPreview({
        source: async () => generateNextLibrettiExportPreview(selectedRows),
        previousUrl: pdfPreviewUrl,
      });
      setPdfPreviewTitle(`Anteprima PDF libretti (${selectedRows.length} targhe)`);
      setPdfPreviewUrl(preview.url);
      setPdfPreviewOpen(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Impossibile generare l'anteprima PDF.";
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="libretti-export-page">
      <div className="libretti-export-shell">
        <header className="libretti-export-header">
          <Link to={backToIa} className="libretti-export-back">
            Torna a IA
          </Link>
          <h1>Libretti (Export PDF)</h1>
          <p>
            Seleziona piu mezzi e genera un unico PDF con i libretti raggruppati per
            targa.
          </p>
        </header>

        <section className="next-clone-placeholder" style={{ marginBottom: 20 }}>
          {handoff.state.status === "ready" ? (
            <InternalAiUniversalHandoffBanner
              title="Handoff IA consumato su Libretti Export"
              description="La route export riceve il payload standard, seleziona la targa corretta e mantiene l'anteprima PDF nel perimetro clone-safe."
              payload={handoff.state.payload}
            />
          ) : null}
          {handoff.state.status === "error" ? (
            <div className="next-clone-placeholder" style={{ marginBottom: 12 }}>
              {handoff.state.errorMessage}
            </div>
          ) : null}
          <p>
            Nel clone questa pagina apre solo lista mezzi con libretto, selezione e
            anteprima PDF locale.
          </p>
          <p style={{ marginTop: 12 }}>
            Condivisione, copia link, WhatsApp e download restano bloccati nel primo
            step clone-safe.
          </p>
        </section>

        <div className="libretti-export-toolbar">
          <div className="libretti-export-meta">
            <span>Mezzi: {totalMezzi}</span>
            <span>Con libretto: {rows.length}</span>
          </div>
          <button
            type="button"
            className="libretti-export-cta"
            disabled={selectedRows.length === 0 || generating}
            onClick={() => {
              void handlePreview();
            }}
          >
            {generating
              ? "Generazione PDF..."
              : `Anteprima PDF (${selectedRows.length} selezionati)`}
          </button>
        </div>

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
                      <span className="libretti-card-badge">Libretto</span>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <NextPdfPreviewModal
        open={pdfPreviewOpen}
        title={pdfPreviewTitle}
        pdfUrl={pdfPreviewUrl}
        note={previewNote}
        onClose={closePdfPreview}
      />
    </div>
  );
}

export default NextLibrettiExportPage;
