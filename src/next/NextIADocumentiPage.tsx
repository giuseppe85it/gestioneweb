import { useEffect, useMemo, useRef, useState } from "react";
import NextClonePageScaffold from "./NextClonePageScaffold";
import {
  readNextMezzoDocumentiCostiSnapshot,
  type NextDocumentiCostiReadOnlyItem,
  type NextMezzoDocumentiCostiSnapshot,
} from "./domain/nextDocumentiCostiDomain";
import {
  readInternalAiDocumentsPreview,
  type InternalAiDocumentsPreviewReadResult,
} from "./internal-ai/internalAiDocumentsPreviewFacade";
import {
  upsertNextInternalAiCloneDocumento,
  type NextInternalAiCloneDocumentoRecord,
} from "./internal-ai/nextInternalAiCloneState";
import { upsertNextInventarioCloneRecord } from "./nextInventarioCloneState";
import InternalAiUniversalHandoffBanner from "./internal-ai/InternalAiUniversalHandoffBanner";
import { useInternalAiUniversalHandoffConsumer } from "./internal-ai/internalAiUniversalHandoffConsumer";
import "../pages/IA/IADocumenti.css";

type CategoriaArchivio = "MEZZO" | "MAGAZZINO" | "GENERICO";
type CurrencyOverride = "EUR" | "CHF";

function normalizeTarga(value: string | null | undefined) {
  return String(value ?? "").trim().toUpperCase();
}

function formatImporto(item: NextDocumentiCostiReadOnlyItem, override?: CurrencyOverride | null) {
  if (item.amount == null || !Number.isFinite(item.amount)) {
    return "Importo n/d";
  }

  const currency = override ?? (item.currency === "EUR" || item.currency === "CHF" ? item.currency : "N/D");
  return `${currency} ${item.amount.toFixed(2)}`;
}

function currencyNeedsVerify(item: NextDocumentiCostiReadOnlyItem, override?: CurrencyOverride | null) {
  if (override) {
    return false;
  }
  return item.currency !== "EUR" && item.currency !== "CHF";
}

function categoryLabel(value: CategoriaArchivio) {
  if (value === "MEZZO") return "MEZZO";
  if (value === "MAGAZZINO") return "MAGAZZINO";
  return "GENERICO";
}

function classLabel(value: "diretto" | "plausibile" | "fuori_perimetro") {
  if (value === "diretto") return "Diretto";
  if (value === "plausibile") return "Plausibile";
  return "Fuori perimetro";
}

function buildDraftTipoDocumento(
  category: CategoriaArchivio,
  fileName: string,
): NextInternalAiCloneDocumentoRecord["tipoDocumento"] {
  const normalized = fileName.toLowerCase();
  if (normalized.includes("preventiv")) return "PREVENTIVO";
  if (normalized.includes("fattur")) return "FATTURA";
  if (category === "MAGAZZINO") return "FATTURA";
  return "DOCUMENTO_UTILE";
}

export default function NextIADocumentiPage() {
  const handoff = useInternalAiUniversalHandoffConsumer({
    moduleId: "next.ia_hub",
  });
  const lifecycleRef = useRef<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoriaArchivio, setCategoriaArchivio] = useState<CategoriaArchivio>("GENERICO");
  const [result, setResult] = useState<InternalAiDocumentsPreviewReadResult | null>(null);
  const [snapshot, setSnapshot] = useState<NextMezzoDocumentiCostiSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [previewFileName, setPreviewFileName] = useState("");
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const [previewFileMime, setPreviewFileMime] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<NextDocumentiCostiReadOnlyItem | null>(null);
  const [currencyOverrides, setCurrencyOverrides] = useState<Record<string, CurrencyOverride>>({});
  const [refreshTick, setRefreshTick] = useState(0);
  const [analysisDraft, setAnalysisDraft] = useState<NextInternalAiCloneDocumentoRecord | null>(null);

  const activeTarga = useMemo(() => {
    if (handoff.state.status === "ready" && handoff.state.payload.documentType === "documento_mezzo") {
      return normalizeTarga(handoff.state.prefill.targa);
    }
    return normalizeTarga(query);
  }, [handoff.state, query]);

  useEffect(() => {
    if (!activeTarga) {
      setResult(null);
      setSnapshot(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const [previewResult, nextSnapshot] = await Promise.all([
          readInternalAiDocumentsPreview(activeTarga),
          readNextMezzoDocumentiCostiSnapshot(activeTarga),
        ]);
        if (cancelled) {
          return;
        }
        setResult(previewResult);
        setSnapshot(nextSnapshot);
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
  }, [activeTarga, refreshTick]);

  useEffect(() => {
    if (handoff.state.status !== "ready" || handoff.state.payload.documentType !== "documento_mezzo") {
      return;
    }

    if (lifecycleRef.current === handoff.state.payload.handoffId) {
      return;
    }

    handoff.acknowledge(
      "prefill_applicato",
      "Documenti IA ha agganciato la targa del payload e apre la preview documentale clone-safe.",
    );
    handoff.acknowledge(
      handoff.state.requiresVerification ? "da_verificare" : "completato",
      handoff.state.requiresVerification
        ? "Preview documenti aperta con prefill, ma alcuni campi restano da verificare."
        : "Preview documenti aperta sul mezzo corretto nel clone.",
    );
    lifecycleRef.current = handoff.state.payload.handoffId;
  }, [handoff]);

  return (
    <NextClonePageScaffold
      eyebrow="IA / Documenti"
      title="IA Documenti"
      description="Pagina NEXT nativa: stessa grammatica operativa del modulo documenti, ma sopra preview e dataset clone-safe senza OCR, upload o scritture business."
      backTo="/next/ia"
      backLabel="Torna a IA"
      notice={
        <div style={{ display: "grid", gap: 12 }}>
          {handoff.state.status === "ready" && handoff.state.payload.documentType === "documento_mezzo" ? (
            <InternalAiUniversalHandoffBanner
              title="Handoff IA consumato su Documenti"
              description="La route NEXT usa la targa del payload per aprire subito il contesto documentale corretto."
              payload={handoff.state.payload}
            />
          ) : null}
          {notice ? <div className="next-clone-placeholder">{notice}</div> : null}
          {loading ? <div className="next-clone-placeholder">Caricamento preview documenti...</div> : null}
          {result && result.status !== "ready" ? (
            <div className="next-clone-placeholder">{result.message}</div>
          ) : null}
        </div>
      }
    >
      <div style={{ display: "grid", gap: 16 }}>
        <section className="next-clone-placeholder">
          <div style={{ display: "grid", gap: 10 }}>
            <strong>Ricerca targa</strong>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Inserisci targa"
                style={{ minWidth: 220 }}
              />
              <button type="button" onClick={() => setQuery((current) => current.trim().toUpperCase())}>
                Carica contesto
              </button>
              <select
                value={categoriaArchivio}
                onChange={(event) => setCategoriaArchivio(event.target.value as CategoriaArchivio)}
              >
                <option value="GENERICO">GENERICO</option>
                <option value="MEZZO">MEZZO</option>
                <option value="MAGAZZINO">MAGAZZINO</option>
              </select>
            </div>
          </div>
        </section>

        <section className="next-clone-placeholder">
          <div style={{ display: "grid", gap: 10 }}>
            <strong>Nuovo documento</strong>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (!file) {
                  return;
                }
                setPreviewFileName(file.name);
                setPreviewFileMime(file.type);
                const reader = new FileReader();
                reader.onload = () =>
                  setPreviewFileUrl(typeof reader.result === "string" ? reader.result : null);
                reader.readAsDataURL(file);
                setAnalysisDraft(null);
              }}
            />
            <div>Archivio target: {categoryLabel(categoriaArchivio)}</div>
            {previewFileName ? <div>File selezionato: {previewFileName}</div> : null}
            {previewFileUrl && previewFileMime.startsWith("image/") ? (
              <img src={previewFileUrl} alt={previewFileName} style={{ maxWidth: 320, borderRadius: 12 }} />
            ) : null}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  if (!activeTarga) {
                    setNotice("Inserisci prima una targa valida.");
                    return;
                  }
                  if (!previewFileName || !previewFileUrl) {
                    setNotice("Seleziona prima un documento locale.");
                    return;
                  }
                  const createdAt = Date.now();
                  const documentId = `next-clone-doc:${activeTarga}:${createdAt}`;
                  const draft: NextInternalAiCloneDocumentoRecord = {
                    id: documentId,
                    collectionKey:
                      categoriaArchivio === "MEZZO"
                        ? "@documenti_mezzi"
                        : categoriaArchivio === "MAGAZZINO"
                        ? "@documenti_magazzino"
                        : "@documenti_generici",
                    tipoDocumento: buildDraftTipoDocumento(categoriaArchivio, previewFileName),
                    categoriaArchivio,
                    targa: activeTarga,
                    mezzoTarga: activeTarga,
                    fornitore: selectedDoc?.supplier ?? "Documento locale clone",
                    numeroDocumento: previewFileName,
                    dataDocumento: new Date(createdAt).toISOString(),
                    totaleDocumento: selectedDoc?.amount ?? null,
                    valuta:
                      currencyOverrides[selectedDoc?.id ?? ""] ??
                      selectedDoc?.currency ??
                      "UNKNOWN",
                    testo: `Analisi locale clone del documento ${previewFileName} per ${activeTarga}.`,
                    fileUrl: previewFileUrl,
                    righe: [
                      {
                        id: `${documentId}:riga-1`,
                        descrizione:
                          selectedDoc?.title ??
                          (categoriaArchivio === "MAGAZZINO"
                            ? "Materiale da verificare"
                            : "Documento locale clone"),
                        quantita: 1,
                        unita: "pz",
                        prezzoUnitario: selectedDoc?.amount ?? null,
                        importo: selectedDoc?.amount ?? null,
                      },
                    ],
                    createdAt,
                    updatedAt: createdAt,
                    source: "next-clone-ia",
                    needsReview: true,
                  };
                  setAnalysisDraft(draft);
                  setNotice(
                    `Analisi locale completata: ${previewFileName} e pronto per il salvataggio clone-only nell'archivio ${categoryLabel(categoriaArchivio)}.`,
                  );
                }}
              >
                Analizza con IA
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!analysisDraft) {
                    setNotice("Analizza prima un documento locale.");
                    return;
                  }
                  upsertNextInternalAiCloneDocumento({
                    ...analysisDraft,
                    updatedAt: Date.now(),
                  });
                  setNotice(`Documento locale salvato nel clone per ${activeTarga}.`);
                  setRefreshTick((current) => current + 1);
                }}
              >
                Salva Documento
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!analysisDraft || analysisDraft.righe.length === 0) {
                    setNotice("Analizza e salva prima un documento con almeno una riga.");
                    return;
                  }
                  analysisDraft.righe.forEach((row, index) => {
                    upsertNextInventarioCloneRecord({
                      id: `${analysisDraft.id}:inventario:${row.id || index}`,
                      descrizione: row.descrizione,
                      quantita: Math.max(1, row.quantita ?? 1),
                      unita: row.unita ?? "pz",
                      fornitore: analysisDraft.fornitore,
                      fotoUrl: previewFileMime.startsWith("image/") ? previewFileUrl : null,
                      fotoStoragePath: null,
                      __nextCloneOnly: true,
                      __nextCloneSavedAt: Date.now(),
                    });
                  });
                  setNotice(
                    `Importazione clone completata: ${analysisDraft.righe.length} righe inviate nell'inventario locale NEXT.`,
                  );
                }}
              >
                Importa materiali in Inventario
              </button>
            </div>
          </div>
        </section>

        {analysisDraft ? (
          <section className="next-clone-placeholder">
            <strong>Bozza IA locale</strong>
            <p style={{ margin: "8px 0 12px" }}>
              {analysisDraft.tipoDocumento} | Archivio {categoryLabel(analysisDraft.categoriaArchivio)} | Fornitore {analysisDraft.fornitore}
            </p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {analysisDraft.righe.map((row) => (
                <li key={row.id}>
                  {row.descrizione} - q.ta {row.quantita ?? 0} {row.unita ?? "pz"}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {result?.status === "ready" ? (
          <>
            <section className="next-clone-placeholder">
              <strong>{result.preview.title}</strong>
              <p style={{ margin: "8px 0 0" }}>{result.preview.subtitle}</p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 10,
                  marginTop: 12,
                }}
              >
                {result.preview.cards.map((card) => (
                  <div
                    key={card.label}
                    style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "#fff" }}
                  >
                    <div style={{ fontSize: 12, color: "#64748b" }}>{card.label}</div>
                    <strong style={{ display: "block", marginTop: 4 }}>{card.value}</strong>
                    <div style={{ marginTop: 6, fontSize: 12 }}>{card.meta}</div>
                  </div>
                ))}
              </div>
            </section>

            {result.preview.buckets.map((bucket) => (
              <section key={bucket.id} className="next-clone-placeholder">
                <strong>{bucket.title}</strong>
                <p style={{ margin: "8px 0 12px" }}>{bucket.summary}</p>
                <div style={{ display: "grid", gap: 10 }}>
                  {bucket.items.map((item) => (
                    <div
                      key={item.id}
                      style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "#fff" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <strong>{item.title}</strong>
                        <span className="next-clone-readonly-badge">{classLabel(item.classification)}</span>
                      </div>
                      <div style={{ marginTop: 8 }}>{item.summary}</div>
                      <div style={{ marginTop: 8, fontSize: 12, color: "#475569" }}>
                        Fonte {item.sourceLabel} - {item.traceabilityLabel}
                      </div>
                      {item.notes.length ? (
                        <ul style={{ margin: "8px 0 0 16px" }}>
                          {item.notes.map((note) => (
                            <li key={note}>{note}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </>
        ) : null}

        {snapshot ? (
          <section className="next-clone-placeholder">
            <strong>Documenti IA salvati</strong>
            <p style={{ margin: "8px 0 12px" }}>
              Targa {snapshot.mezzoTarga} | Totali {snapshot.counts.total} | Preventivi {snapshot.counts.preventivi} | Fatture {snapshot.counts.fatture}
            </p>
            {snapshot.items.length === 0 ? (
              <p style={{ margin: 0 }}>Nessun documento leggibile per questa targa.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {snapshot.items.map((item) => {
                  const override = currencyOverrides[item.id] ?? null;
                  const needsVerify = currencyNeedsVerify(item, override);
                  return (
                    <div
                      key={item.id}
                      style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "#fff" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <strong>{item.title}</strong>
                        <span className="next-clone-readonly-badge">{item.documentTypeLabel}</span>
                      </div>
                      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", fontSize: 13 }}>
                        <span>Targa: {item.targa || "-"}</span>
                        <span>Data: {item.dateLabel || "-"}</span>
                        <span>{formatImporto(item, override)}</span>
                        <span>Fornitore: {item.supplier || "-"}</span>
                      </div>
                      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {item.fileUrl ? (
                          <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                            APRI PDF
                          </a>
                        ) : (
                          <span>Nessun PDF</span>
                        )}
                        <span>Valuta: {override ?? item.currency}</span>
                        {needsVerify ? (
                          <button type="button" onClick={() => setSelectedDoc(item)}>
                            VALUTA DA VERIFICARE
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}

        {snapshot?.limitations.length ? (
          <section className="next-clone-placeholder">
            <strong>Limiti del layer documenti</strong>
            <ul style={{ margin: "8px 0 0 16px" }}>
              {snapshot.limitations.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {selectedDoc ? (
        <div className="iadoc-modal-overlay" onClick={() => setSelectedDoc(null)}>
          <div className="iadoc-modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>Imposta valuta</h3>
            <div className="iadoc-modal-meta">
              <span>Targa: {selectedDoc.targa || "-"}</span>
              <span>Data: {selectedDoc.dateLabel || "-"}</span>
              <span>{formatImporto(selectedDoc, currencyOverrides[selectedDoc.id] ?? null)}</span>
            </div>
            <div className="iadoc-modal-actions">
              <button
                type="button"
                className="ia-btn"
                onClick={() => {
                  setCurrencyOverrides((current) => ({ ...current, [selectedDoc.id]: "EUR" }));
                  setSelectedDoc(null);
                  setNotice("Valuta applicata solo nel clone locale della pagina documenti.");
                }}
              >
                EUR
              </button>
              <button
                type="button"
                className="ia-btn"
                onClick={() => {
                  setCurrencyOverrides((current) => ({ ...current, [selectedDoc.id]: "CHF" }));
                  setSelectedDoc(null);
                  setNotice("Valuta applicata solo nel clone locale della pagina documenti.");
                }}
              >
                CHF
              </button>
              <button type="button" className="ia-btn outline" onClick={() => setSelectedDoc(null)}>
                Annulla
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </NextClonePageScaffold>
  );
}
