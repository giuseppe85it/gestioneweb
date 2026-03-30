import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import NextClonePageScaffold from "./NextClonePageScaffold";
import { readNextCisternaSnapshot, type NextCisternaSnapshot } from "./domain/nextCisternaDomain";
import InternalAiUniversalHandoffBanner from "./internal-ai/InternalAiUniversalHandoffBanner";
import { useInternalAiUniversalHandoffConsumer } from "./internal-ai/internalAiUniversalHandoffConsumer";
import "../pages/CisternaCaravate/CisternaCaravateIA.css";

type DocumentoForm = {
  tipoDocumento: "fattura" | "bollettino";
  fornitore: string;
  destinatario: string;
  numeroDocumento: string;
  dataDocumento: string;
  litriTotali: string;
  totaleDocumento: string;
  valuta: "" | "EUR" | "CHF";
  prodotto: string;
  testo: string;
  daVerificare: boolean;
  motivoVerifica: string;
};

function buildInitialForm(fileName: string, note: string): DocumentoForm {
  const lower = fileName.toLowerCase();
  return {
    tipoDocumento: lower.includes("boll") || lower.includes("ddt") ? "bollettino" : "fattura",
    fornitore: "",
    destinatario: "",
    numeroDocumento: "",
    dataDocumento: "",
    litriTotali: "",
    totaleDocumento: "",
    valuta: "",
    prodotto: "",
    testo: note,
    daVerificare: true,
    motivoVerifica: "preview_clone_safe",
  };
}

export default function NextCisternaIAPage() {
  const navigate = useNavigate();
  const handoff = useInternalAiUniversalHandoffConsumer({
    moduleId: "next.cisterna",
  });
  const lifecycleRef = useRef<string | null>(null);
  const [snapshot, setSnapshot] = useState<NextCisternaSnapshot | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [form, setForm] = useState<DocumentoForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const nextSnapshot = await readNextCisternaSnapshot();
        if (!cancelled) {
          setSnapshot(nextSnapshot);
        }
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
    if (handoff.state.status !== "ready") {
      return;
    }
    if (lifecycleRef.current === handoff.state.payload.handoffId) {
      return;
    }
    handoff.acknowledge(
      "prefill_applicato",
      "Cisterna IA ha agganciato il payload standard e apre il contesto specialistico del clone.",
    );
    handoff.acknowledge(
      handoff.state.requiresVerification ? "da_verificare" : "completato",
      handoff.state.requiresVerification
        ? "Cisterna IA aperta con prefill ma ancora da verificare."
        : "Cisterna IA aperta nel verticale corretto del clone.",
    );
    lifecycleRef.current = handoff.state.payload.handoffId;
  }, [handoff]);

  const handoffNote = useMemo(() => {
    if (handoff.state.status !== "ready") {
      return "";
    }
    return handoff.state.payload.motivoInstradamento;
  }, [handoff.state]);

  return (
    <NextClonePageScaffold
      eyebrow="Cisterna / IA"
      title="Cisterna Caravate IA"
      description="Pagina NEXT nativa del verticale IA cisterna: stessa forma operativa del modulo madre, ma senza upload, analisi provider o salvataggi business reali."
      backTo="/next/cisterna"
      backLabel="Torna a Cisterna"
      notice={
        <div style={{ display: "grid", gap: 12 }}>
          {handoff.state.status === "ready" ? (
            <InternalAiUniversalHandoffBanner
              title="Handoff IA consumato su Cisterna"
              description="Il verticale cisterna del clone aggancia il payload standard e apre il contesto specialistico corretto."
              payload={handoff.state.payload}
            />
          ) : null}
          {notice ? <div className="next-clone-placeholder">{notice}</div> : null}
          {loading ? <div className="next-clone-placeholder">Caricamento contesto cisterna...</div> : null}
          {snapshot ? (
            <div className="next-clone-placeholder">
              Mese {snapshot.monthLabel} | Documenti {snapshot.counts.documents} | Schede {snapshot.counts.schede} | Supporto rifornimenti {snapshot.counts.supportRefuels}
            </div>
          ) : null}
        </div>
      }
      actions={
        <>
          <button type="button" className="next-clone-header-action" onClick={() => navigate("/next/cisterna")}>
            Vai a Cisterna
          </button>
          <button
            type="button"
            className="next-clone-header-action"
            onClick={() => navigate(`/next/cisterna/schede-test?month=${encodeURIComponent(snapshot?.monthKey ?? "")}`)}
          >
            Schede Test
          </button>
        </>
      }
    >
      <div className="cisterna-ia-page">
        <div className="cisterna-ia-shell">
          <section className="cisterna-ia-card">
            <h2>Fatture e Bollettini</h2>
            <label className="cisterna-ia-field">
              <span>File documento (PDF o immagine)</span>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                  }
                  setSelectedFile(file);
                  setForm(null);
                  setNotice("");
                  if (file && file.type.startsWith("image/")) {
                    setPreviewUrl(URL.createObjectURL(file));
                  } else {
                    setPreviewUrl("");
                  }
                }}
              />
            </label>

            {selectedFile ? (
              <div className="cisterna-ia-preview">
                {previewUrl ? (
                  <img src={previewUrl} alt={selectedFile.name} />
                ) : (
                  <div className="cisterna-ia-preview-file">
                    <strong>{selectedFile.name}</strong>
                    <span>Anteprima immagine non disponibile.</span>
                  </div>
                )}
              </div>
            ) : null}

            <div className="cisterna-ia-row">
              <button
                type="button"
                onClick={() => {
                  if (!selectedFile) {
                    setNotice("Seleziona un file prima dell'analisi.");
                    return;
                  }
                  setForm(buildInitialForm(selectedFile.name, handoffNote));
                  setNotice("Nel clone l'analisi IA non chiama il provider reale: la scheda resta in preview manuale da verificare.");
                }}
              >
                Analizza documento (IA)
              </button>
              <button
                type="button"
                onClick={() =>
                  setNotice("Nel clone il salvataggio nell'archivio Cisterna resta bloccato.")
                }
                disabled={!form}
              >
                Salva in archivio cisterna
              </button>
            </div>
          </section>

          {form ? (
            <section className="cisterna-ia-card">
              <div className="cisterna-ia-result-head">
                <h2>Risultato estrazione</h2>
                <span className="cisterna-ia-badge is-warning">DA VERIFICARE</span>
              </div>

              <div className="cisterna-ia-form-grid">
                <label className="cisterna-ia-field">
                  <span>Tipo documento</span>
                  <select
                    value={form.tipoDocumento}
                    onChange={(event) =>
                      setForm((current) => (current ? { ...current, tipoDocumento: event.target.value as DocumentoForm["tipoDocumento"] } : current))
                    }
                  >
                    <option value="fattura">Fattura</option>
                    <option value="bollettino">Bollettino / DAS</option>
                  </select>
                </label>

                <label className="cisterna-ia-field">
                  <span>Data documento</span>
                  <input value={form.dataDocumento} onChange={(event) => setForm((current) => (current ? { ...current, dataDocumento: event.target.value } : current))} />
                </label>

                <label className="cisterna-ia-field">
                  <span>Litri totali</span>
                  <input value={form.litriTotali} onChange={(event) => setForm((current) => (current ? { ...current, litriTotali: event.target.value } : current))} />
                </label>

                <label className="cisterna-ia-field">
                  <span>Totale documento</span>
                  <input value={form.totaleDocumento} onChange={(event) => setForm((current) => (current ? { ...current, totaleDocumento: event.target.value } : current))} />
                </label>

                <label className="cisterna-ia-field">
                  <span>Valuta</span>
                  <select
                    value={form.valuta}
                    onChange={(event) => setForm((current) => (current ? { ...current, valuta: event.target.value as DocumentoForm["valuta"] } : current))}
                  >
                    <option value="">Non definita</option>
                    <option value="EUR">EUR</option>
                    <option value="CHF">CHF</option>
                  </select>
                </label>

                <label className="cisterna-ia-field">
                  <span>Numero documento</span>
                  <input value={form.numeroDocumento} onChange={(event) => setForm((current) => (current ? { ...current, numeroDocumento: event.target.value } : current))} />
                </label>

                <label className="cisterna-ia-field">
                  <span>Fornitore</span>
                  <input value={form.fornitore} onChange={(event) => setForm((current) => (current ? { ...current, fornitore: event.target.value } : current))} />
                </label>

                <label className="cisterna-ia-field">
                  <span>Destinatario</span>
                  <input value={form.destinatario} onChange={(event) => setForm((current) => (current ? { ...current, destinatario: event.target.value } : current))} />
                </label>

                <label className="cisterna-ia-field">
                  <span>Prodotto</span>
                  <input value={form.prodotto} onChange={(event) => setForm((current) => (current ? { ...current, prodotto: event.target.value } : current))} />
                </label>
              </div>

              <label className="cisterna-ia-field">
                <span>Testo estratto (opzionale)</span>
                <textarea rows={4} value={form.testo} onChange={(event) => setForm((current) => (current ? { ...current, testo: event.target.value } : current))} />
              </label>

              <label className="cisterna-ia-field">
                <span>Motivo verifica</span>
                <input value={form.motivoVerifica} onChange={(event) => setForm((current) => (current ? { ...current, motivoVerifica: event.target.value } : current))} />
              </label>
            </section>
          ) : null}

          {snapshot ? (
            <section className="cisterna-ia-card">
              <h2>Archivio cisterna del mese</h2>
              <div className="cisterna-ia-form-grid">
                <div className="cisterna-ia-field">
                  <span>Documenti mese</span>
                  <strong>{snapshot.counts.documents}</strong>
                </div>
                <div className="cisterna-ia-field">
                  <span>Fatture</span>
                  <strong>{snapshot.counts.fatture}</strong>
                </div>
                <div className="cisterna-ia-field">
                  <span>Bollettini</span>
                  <strong>{snapshot.counts.bollettini}</strong>
                </div>
                <div className="cisterna-ia-field">
                  <span>Schede</span>
                  <strong>{snapshot.counts.schede}</strong>
                </div>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {snapshot.archive.documents.slice(0, 8).map((item) => (
                  <div key={item.id} className="next-clone-placeholder">
                    <strong>{item.dateLabel}</strong> - {item.fornitore || "-"} - {item.prodotto || "-"} - {item.litriLabel}
                    {item.fileUrl ? (
                      <a style={{ marginLeft: 8 }} href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                        Apri
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </NextClonePageScaffold>
  );
}
