import { useEffect, useMemo, useRef, useState } from "react";
import NextClonePageScaffold from "./NextClonePageScaffold";
import {
  readInternalAiLibrettoPreview,
  type InternalAiLibrettoPreviewReadResult,
} from "./internal-ai/internalAiLibrettoPreviewFacade";
import { readNextMezzoByTarga } from "./nextAnagraficheFlottaDomain";
import InternalAiUniversalHandoffBanner from "./internal-ai/InternalAiUniversalHandoffBanner";
import { useInternalAiUniversalHandoffConsumer } from "./internal-ai/internalAiUniversalHandoffConsumer";
import "../pages/IA/IALibretto.css";

function normalizeTarga(value: string | null | undefined) {
  return String(value ?? "").trim().toUpperCase();
}

function classLabel(value: "diretto" | "plausibile" | "fuori_perimetro") {
  if (value === "diretto") return "Diretto";
  if (value === "plausibile") return "Plausibile";
  return "Fuori perimetro";
}

export default function NextIALibrettoPage() {
  const handoff = useInternalAiUniversalHandoffConsumer({ moduleId: "next.ia_hub" });
  const lifecycleRef = useRef<string | null>(null);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<InternalAiLibrettoPreviewReadResult | null>(null);
  const [mezzoUrl, setMezzoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");
  const [notice, setNotice] = useState<string>("");

  const activeTarga = useMemo(() => {
    if (handoff.state.status === "ready" && handoff.state.payload.documentType === "libretto_mezzo") {
      return normalizeTarga(handoff.state.prefill.targa);
    }
    return normalizeTarga(query);
  }, [handoff.state, query]);

  useEffect(() => {
    if (!activeTarga) {
      setResult(null);
      setMezzoUrl(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const [previewResult, mezzo] = await Promise.all([
          readInternalAiLibrettoPreview(activeTarga),
          readNextMezzoByTarga(activeTarga),
        ]);
        if (cancelled) return;
        setResult(previewResult);
        setMezzoUrl(mezzo?.librettoUrl ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [activeTarga]);

  useEffect(() => {
    if (handoff.state.status !== "ready" || handoff.state.payload.documentType !== "libretto_mezzo") {
      return;
    }
    if (lifecycleRef.current === handoff.state.payload.handoffId) {
      return;
    }
    handoff.acknowledge("prefill_applicato", "Il clone NEXT ha agganciato la targa del libretto nel layer preview.");
    handoff.acknowledge(
      handoff.state.requiresVerification ? "da_verificare" : "completato",
      handoff.state.requiresVerification
        ? "Preview libretto aperta con prefill ma ancora da verificare."
        : "Preview libretto aperta sul mezzo corretto nel clone.",
    );
    lifecycleRef.current = handoff.state.payload.handoffId;
  }, [handoff]);

  return (
    <NextClonePageScaffold
      eyebrow="IA / Libretti"
      title="IA Libretto"
      description="Pagina NEXT nativa: stessa grammatica operativa del libretto, ma solo preview clone-safe dei dati gia leggibili sul mezzo."
      backTo="/next/ia"
      backLabel="Torna a IA"
      notice={
        <div style={{ display: "grid", gap: 12 }}>
          {handoff.state.status === "ready" && handoff.state.payload.documentType === "libretto_mezzo" ? (
            <InternalAiUniversalHandoffBanner
              title="Handoff IA consumato su Libretto"
              description="La route NEXT usa la targa del payload per aprire subito il mezzo corretto."
              payload={handoff.state.payload}
            />
          ) : null}
          {notice ? <div className="next-clone-placeholder">{notice}</div> : null}
          {loading ? <div className="next-clone-placeholder">Caricamento preview libretto...</div> : null}
          {result && result.status !== "ready" ? <div className="next-clone-placeholder">{result.message}</div> : null}
        </div>
      }
      actions={
        mezzoUrl ? (
          <button type="button" className="next-clone-header-action" onClick={() => window.open(mezzoUrl, "_blank", "noopener,noreferrer")}>
            Apri libretto corrente
          </button>
        ) : null
      }
    >
      <div style={{ display: "grid", gap: 16 }}>
        <section className="next-clone-placeholder">
          <div style={{ display: "grid", gap: 10 }}>
            <strong>Ricerca mezzo</strong>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Inserisci targa"
                style={{ minWidth: 220 }}
              />
              <button type="button" onClick={() => setQuery((current) => current.trim().toUpperCase())}>
                Carica preview
              </button>
            </div>
          </div>
        </section>

        <section className="next-clone-placeholder">
          <div style={{ display: "grid", gap: 10 }}>
            <strong>Nuovo file libretto</strong>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (!file) return;
                setPreviewName(file.name);
                if (file.type.startsWith("image/")) {
                  const reader = new FileReader();
                  reader.onload = () => setPreviewFile(typeof reader.result === "string" ? reader.result : null);
                  reader.readAsDataURL(file);
                } else {
                  setPreviewFile(null);
                }
              }}
            />
            {previewName ? <div>File selezionato: {previewName}</div> : null}
            {previewFile ? <img src={previewFile} alt={previewName} style={{ maxWidth: 320, borderRadius: 12 }} /> : null}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() =>
                  setNotice("Nel clone l'analisi OCR del libretto resta bloccata: la pagina usa solo il layer preview gia leggibile.")
                }
              >
                Analizza documento
              </button>
              <button
                type="button"
                onClick={() =>
                  setNotice("Nel clone il salvataggio del libretto sul mezzo resta bloccato.")
                }
              >
                Salva su mezzo
              </button>
            </div>
          </div>
        </section>

        {result?.status === "ready" ? (
          <>
            <section className="next-clone-placeholder">
              <strong>{result.preview.title}</strong>
              <p style={{ margin: "8px 0 0" }}>{result.preview.subtitle}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 12 }}>
                {result.preview.cards.map((card) => (
                  <div key={card.label} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "#fff" }}>
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
                    <div key={item.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "#fff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <strong>{item.title}</strong>
                        <span className="next-clone-readonly-badge">{classLabel(item.classification)}</span>
                      </div>
                      <div style={{ marginTop: 8 }}>{item.valueLabel}</div>
                      <div style={{ marginTop: 8, fontSize: 12, color: "#475569" }}>
                        Fonte {item.sourceLabel} · {item.traceabilityLabel}
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
                {bucket.notes.length ? (
                  <ul style={{ margin: "12px 0 0 16px" }}>
                    {bucket.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </>
        ) : null}
      </div>
    </NextClonePageScaffold>
  );
}
