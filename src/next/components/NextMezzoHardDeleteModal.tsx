import { useEffect, useState } from "react";
import {
  hardDeleteMezzo,
  previewHardDeleteCounts,
  type HardDeleteResult,
  type HardDeletePreview,
} from "../nextMezzoHardDeleteWriter";
import "./sinottica-flotta-v2-design-tokens.css";

type Props = {
  open: boolean;
  targa: string | null;
  mezzoId: string | null;
  onClose: () => void;
  onDeleted: (result: HardDeleteResult) => void;
};

const ZERO_PREVIEW: HardDeletePreview = {
  mezzi: 0,
  rifornimentiDossier: 0,
  rifornimentiTmp: 0,
  manutenzioni: 0,
  lavori: 0,
  segnalazioni: 0,
  controlli: 0,
  richieste: 0,
  gommeTmp: 0,
  gommeEventi: 0,
  sessioni: 0,
};

export default function NextMezzoHardDeleteModal({
  open,
  targa,
  mezzoId,
  onClose,
  onDeleted,
}: Props) {
  const [preview, setPreview] = useState<HardDeletePreview>(ZERO_PREVIEW);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [typedTarga, setTypedTarga] = useState<string>("");
  const [deleting, setDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !targa || !mezzoId) {
      setPreview(ZERO_PREVIEW);
      setTypedTarga("");
      setErrorMessage(null);
      return;
    }
    let cancelled: boolean = false;
    setLoadingPreview(true);
    setErrorMessage(null);
    void (async () => {
      try {
        const counts: HardDeletePreview = await previewHardDeleteCounts(
          targa,
          mezzoId,
        );
        if (!cancelled) setPreview(counts);
      } catch (err: unknown) {
        if (!cancelled) {
          setErrorMessage(
            err instanceof Error ? err.message : "Errore pre-conteggio.",
          );
        }
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, targa, mezzoId]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, deleting]);

  if (!open || !targa || !mezzoId) return null;

  const canDelete: boolean = typedTarga === targa && !deleting;

  return (
    <div
      className="cc-sinottica-scope-v2"
      onClick={() => {
        if (!deleting) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        background: "rgba(22, 24, 28, 0.7)",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          border: "2px solid var(--bad)",
          borderRadius: "6px",
          boxShadow: "var(--shadow-pop)",
          width: "min(560px, 100%)",
          maxHeight: "85vh",
          overflowY: "auto",
          fontFamily: "var(--font-sans)",
        }}
      >
        <header
          style={{
            padding: "16px 20px",
            background: "var(--bad-bg)",
            borderBottom: "1px solid var(--rule)",
          }}
        >
          <div
            style={{
              font: "500 10.5px/1 var(--font-sans)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--bad)",
              marginBottom: "6px",
            }}
          >
            Eliminazione definitiva
          </div>
          <div
            style={{
              font: "600 18px/1.2 var(--font-mono)",
              color: "var(--ink-1)",
            }}
          >
            Mezzo {targa}
          </div>
        </header>

        <div style={{ padding: "16px 20px" }}>
          <div
            style={{
              padding: "12px 14px",
              background: "var(--bad-bg)",
              color: "var(--bad)",
              border: "1px solid color-mix(in srgb, var(--bad) 22%, transparent)",
              borderRadius: "4px",
              font: "400 12.5px/1.45 var(--font-sans)",
              marginBottom: "14px",
            }}
          >
            <strong>Operazione IRREVERSIBILE.</strong> Questa azione cancella
            TUTTI i dati legati al mezzo: anagrafica, rifornimenti, manutenzioni,
            lavori, segnalazioni, controlli, richieste attrezzature, gomme,
            sessioni autisti.
          </div>

          {loadingPreview ? (
            <div
              style={{
                padding: "12px",
                color: "var(--ink-3)",
                font: "400 12.5px/1.4 var(--font-sans)",
              }}
            >
              Pre-conteggio record in corso…
            </div>
          ) : (
            <div
              style={{
                marginBottom: "14px",
                padding: "10px 12px",
                background: "var(--surface-2)",
                border: "1px solid var(--rule)",
                borderRadius: "4px",
                font: "400 12.5px/1.5 var(--font-sans)",
                color: "var(--ink-2)",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                Record che verranno eliminati:
              </div>
              <ul style={{ margin: 0, padding: "0 0 0 18px" }}>
                <li>Anagrafica mezzo: {preview.mezzi}</li>
                <li>Rifornimenti (dossier): {preview.rifornimentiDossier}</li>
                <li>Rifornimenti (tmp autisti): {preview.rifornimentiTmp}</li>
                <li>Manutenzioni: {preview.manutenzioni}</li>
                <li>Lavori: {preview.lavori}</li>
                <li>Segnalazioni: {preview.segnalazioni}</li>
                <li>Controlli: {preview.controlli}</li>
                <li>Richieste attrezzature: {preview.richieste}</li>
                <li>Gomme (tmp): {preview.gommeTmp}</li>
                <li>Gomme (eventi): {preview.gommeEventi}</li>
                <li>Sessioni autisti attive: {preview.sessioni}</li>
              </ul>
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                padding: "10px 12px",
                background: "var(--bad-bg)",
                color: "var(--bad)",
                border: "1px solid color-mix(in srgb, var(--bad) 22%, transparent)",
                borderRadius: "4px",
                font: "500 12.5px/1.4 var(--font-sans)",
                marginBottom: "12px",
              }}
            >
              {errorMessage}
            </div>
          )}

          <label
            style={{
              display: "block",
              font: "500 12.5px/1.4 var(--font-sans)",
              color: "var(--ink-2)",
              marginBottom: "6px",
            }}
          >
            Per confermare, digita la targa esatta del mezzo:
          </label>
          <input
            type="text"
            value={typedTarga}
            onChange={(e) => setTypedTarga(e.target.value)}
            disabled={deleting}
            autoComplete="off"
            spellCheck={false}
            placeholder={targa}
            style={{
              width: "100%",
              height: "38px",
              padding: "0 12px",
              border: "1px solid var(--rule-strong)",
              borderRadius: "4px",
              font: "500 14px/1 var(--font-mono)",
              color: "var(--ink-1)",
              background: "var(--surface)",
              marginBottom: "16px",
              textTransform: "uppercase",
            }}
          />

          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              style={{
                appearance: "none",
                border: "1px solid var(--rule-strong)",
                background: "var(--surface)",
                color: "var(--ink-2)",
                padding: "9px 16px",
                borderRadius: "4px",
                cursor: deleting ? "wait" : "pointer",
                font: "500 12.5px/1 var(--font-sans)",
              }}
            >
              Annulla
            </button>
            <button
              type="button"
              disabled={!canDelete}
              onClick={async () => {
                setDeleting(true);
                setErrorMessage(null);
                try {
                  const result: HardDeleteResult = await hardDeleteMezzo(
                    targa,
                    mezzoId,
                  );
                  if (!result.ok) {
                    setErrorMessage(result.error || "Errore eliminazione.");
                    return;
                  }
                  onDeleted(result);
                } catch (err: unknown) {
                  setErrorMessage(
                    err instanceof Error ? err.message : "Errore eliminazione.",
                  );
                } finally {
                  setDeleting(false);
                }
              }}
              style={{
                appearance: "none",
                border: "1px solid var(--bad)",
                background: canDelete ? "var(--bad)" : "var(--neutral-pill-bg)",
                color: canDelete ? "#fff" : "var(--ink-4)",
                padding: "9px 16px",
                borderRadius: "4px",
                cursor: canDelete ? "pointer" : "not-allowed",
                font: "600 12.5px/1 var(--font-sans)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {deleting ? "Eliminazione…" : "Elimina definitivamente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
