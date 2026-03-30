import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CentroControllo from "../pages/CentroControllo";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";
import { NEXT_GESTIONE_OPERATIVA_PATH } from "./nextStructuralPaths";

const CENTRO_CONTROLLO_CLONE_BANNER =
  "Centro Controllo clone-safe: consultazione read-only di manutenzioni, rifornimenti e flussi autisti; PDF solo preview e nessuna scrittura business.";

const CENTRO_CONTROLLO_HEADER_DESCRIPTION =
  "Centro controllo clone-safe: consulta manutenzioni, rifornimenti e flussi autisti in sola lettura. I PDF restano preview di consultazione e i dati locali clone non aggiornano la madre.";

const BUTTON_LABEL_REPLACEMENTS = new Map<string, string>([
  ["Manutenzioni programmate", "Manutenzioni read-only"],
  ["Report rifornimenti", "Rifornimenti read-only"],
  ["Segnalazioni autisti", "Segnalazioni autisti (lettura)"],
  ["Controlli KO/OK", "Controlli KO/OK (lettura)"],
  ["Richieste attrezzature", "Richieste attrezzature (lettura)"],
  ["Aggiorna", "Aggiorna vista read-only"],
  ["Aggiorna dati", "Aggiorna vista read-only"],
  ["Anteprima PDF selezionati", "Anteprima PDF read-only"],
  ["Anteprima PDF mensile", "Anteprima PDF read-only"],
]);

const BUTTON_TITLE_REPLACEMENTS = new Map<string, string>([
  [
    "Aggiorna vista read-only",
    "Ricarica solo la vista clone-safe: nessuna sincronizzazione o scrittura sulla madre.",
  ],
  [
    "Anteprima PDF read-only",
    "Genera solo una preview PDF di consultazione dal clone, senza workflow business reali.",
  ],
]);

function normalizeButtonLabel(value: string | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function applyCentroControlloCloneSafeCopy(root: HTMLDivElement) {
  const headerDescription = root.querySelector(".cc-header p");
  if (headerDescription) {
    headerDescription.textContent = CENTRO_CONTROLLO_HEADER_DESCRIPTION;
  }

  root.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
    const normalizedLabel = normalizeButtonLabel(button.textContent);
    const replacement = BUTTON_LABEL_REPLACEMENTS.get(normalizedLabel);
    if (replacement) {
      button.textContent = replacement;
    }

    const updatedLabel = normalizeButtonLabel(button.textContent);
    const title = BUTTON_TITLE_REPLACEMENTS.get(updatedLabel);
    if (title) {
      button.title = title;
    }
  });
}

export default function NextCentroControlloClonePage() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    applyCentroControlloCloneSafeCopy(root);

    const interceptLegacyBack = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".cc-back")) return;
      event.preventDefault();
      event.stopPropagation();
      navigate(NEXT_GESTIONE_OPERATIVA_PATH);
    };

    const observer = new MutationObserver(() => {
      applyCentroControlloCloneSafeCopy(root);
    });
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    root.addEventListener("click", interceptLegacyBack, true);
    return () => {
      observer.disconnect();
      root.removeEventListener("click", interceptLegacyBack, true);
    };
  }, [navigate]);

  return (
    <NextLegacyStorageBoundary presets={["flotta", "autisti"]}>
      <div ref={rootRef}>
        <div
          style={{
            marginBottom: 12,
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            background: "#f8fafc",
            color: "#0f172a",
            fontSize: 14,
            lineHeight: 1.45,
          }}
        >
          <strong>Centro Controllo clone-safe.</strong> {CENTRO_CONTROLLO_CLONE_BANNER}
        </div>
        <CentroControllo />
      </div>
    </NextLegacyStorageBoundary>
  );
}

