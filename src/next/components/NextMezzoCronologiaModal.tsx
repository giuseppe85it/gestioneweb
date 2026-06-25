import { useEffect, useState } from "react";
import {
  readNextSessioniStoricoPerTarga,
  type NextSessioneStoricoEvent,
} from "../domain/nextSessioniStoricoDomain";
import { toDisplayDateTime } from "../helpers/dateUnica";
import "./sinottica-flotta-v2-design-tokens.css";

type Props = {
  open: boolean;
  targa: string | null;
  onClose: () => void;
};

function formatDateLong(ts: number): string {
  return toDisplayDateTime(ts) || "---";
}

function badgeForTipo(tipo: string): { label: string; bg: string; color: string } {
  if (tipo === "INIZIO_ASSETTO") {
    return { label: "inizio", bg: "var(--info-bg)", color: "var(--info)" };
  }
  if (tipo === "CAMBIO_ASSETTO") {
    return { label: "cambio", bg: "var(--warn-bg)", color: "var(--warn)" };
  }
  return { label: "evento", bg: "var(--surface-2)", color: "var(--ink-3)" };
}

function describeAssetto(
  motrice: string | null,
  rimorchio: string | null,
): string {
  const parts: string[] = [];
  if (motrice) parts.push(motrice);
  if (rimorchio) parts.push(`R ${rimorchio}`);
  return parts.length > 0 ? parts.join(" + ") : "";
}

export function describeEvento(
  evento: NextSessioneStoricoEvent,
  targaContext: string | null,
): string {
  const autista: string = evento.autistaNome
    ? evento.autistaNome
    : "Autista non indicato";

  const primaM: string | null = evento.prima.targaMotrice;
  const primaR: string | null = evento.prima.targaRimorchio;
  const dopoM: string | null = evento.dopo.targaMotrice;
  const dopoR: string | null = evento.dopo.targaRimorchio;

  const primaStr: string = describeAssetto(primaM, primaR);
  const dopoStr: string = describeAssetto(dopoM, dopoR);

  if (!primaStr && !dopoStr) {
    return `${autista}: cambio assetto registrato`;
  }
  if (!primaStr && dopoStr) {
    return `${autista} ha preso ${dopoStr}`;
  }
  if (primaStr && !dopoStr) {
    return `${autista} ha lasciato ${primaStr}`;
  }
  if (primaStr === dopoStr) {
    const focus: string =
      targaContext && targaContext.toUpperCase() === (primaM ?? "").toUpperCase()
        ? primaM ?? primaStr
        : targaContext && targaContext.toUpperCase() === (primaR ?? "").toUpperCase()
          ? `R ${primaR}`
          : primaStr;
    return `${autista} ha confermato l'assetto su ${focus}`;
  }
  return `${autista} ha lasciato ${primaStr} e preso ${dopoStr}`;
}

export default function NextMezzoCronologiaModal({ open, targa, onClose }: Props) {
  const [events, setEvents] = useState<NextSessioneStoricoEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !targa) {
      setEvents([]);
      setErrorMessage(null);
      return;
    }
    let cancelled: boolean = false;
    setLoading(true);
    setErrorMessage(null);
    void (async () => {
      try {
        const list: NextSessioneStoricoEvent[] =
          await readNextSessioniStoricoPerTarga(targa);
        if (cancelled) return;
        setEvents(list);
      } catch (err: unknown) {
        if (cancelled) return;
        const message: string =
          err instanceof Error ? err.message : "Errore caricamento cronologia.";
        setErrorMessage(message);
        setEvents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, targa]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="cc-sinottica-scope-v2"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(22, 24, 28, 0.5)",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--rule)",
          borderRadius: "6px",
          boxShadow: "var(--shadow-pop)",
          width: "min(720px, 100%)",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          fontFamily: "var(--font-sans)",
        }}
      >
        <header
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid var(--rule)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                font: "500 10.5px/1 var(--font-sans)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--ink-3)",
                marginBottom: "4px",
              }}
            >
              Cronologia mezzo
            </div>
            <div
              style={{
                font: "600 18px/1.2 var(--font-mono)",
                color: "var(--ink-1)",
              }}
            >
              {targa ?? "—"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              appearance: "none",
              border: "1px solid var(--rule)",
              background: "var(--surface-2)",
              color: "var(--ink-2)",
              padding: "6px 12px",
              borderRadius: "4px",
              cursor: "pointer",
              font: "500 12.5px/1 var(--font-sans)",
            }}
          >
            Chiudi
          </button>
        </header>

        <div style={{ padding: "16px 22px", overflowY: "auto", flex: 1 }}>
          {loading && (
            <div
              style={{
                padding: "24px",
                textAlign: "center",
                color: "var(--ink-3)",
                font: "400 13px/1.4 var(--font-sans)",
              }}
            >
              Caricamento cronologia…
            </div>
          )}
          {errorMessage && (
            <div
              style={{
                padding: "12px 14px",
                background: "var(--bad-bg)",
                color: "var(--bad)",
                border: "1px solid color-mix(in srgb, var(--bad) 22%, transparent)",
                borderRadius: "4px",
                font: "500 12.5px/1.4 var(--font-sans)",
              }}
            >
              {errorMessage}
            </div>
          )}
          {!loading && !errorMessage && events.length === 0 && (
            <div
              style={{
                padding: "24px",
                textAlign: "center",
                color: "var(--ink-3)",
                font: "400 13px/1.4 var(--font-sans)",
              }}
            >
              Nessuna sessione storica registrata per questo mezzo.
            </div>
          )}
          {!loading && !errorMessage && events.length > 0 && (
            <ol
              style={{
                margin: 0,
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {events.map((ev: NextSessioneStoricoEvent) => {
                const badge = badgeForTipo(ev.tipo);
                const headline: string = describeEvento(ev, targa);
                const subtitle: string = ev.luogo
                  ? `${formatDateLong(ev.timestamp)} · ${ev.luogo}`
                  : formatDateLong(ev.timestamp);
                return (
                  <li
                    key={ev.id}
                    style={{
                      border: "1px solid var(--rule)",
                      borderRadius: "4px",
                      padding: "12px 14px",
                      background: "var(--surface)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "10px",
                      }}
                    >
                      <span
                        style={{
                          font: "500 14px/1.35 var(--font-sans)",
                          color: "var(--ink-1)",
                        }}
                      >
                        {headline}
                      </span>
                      <span
                        style={{
                          flex: "0 0 auto",
                          font: "500 10px/1 var(--font-sans)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: badge.color,
                          background: badge.bg,
                          border: "1px solid color-mix(in srgb, currentColor 22%, transparent)",
                          padding: "3px 7px",
                          borderRadius: "3px",
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <span
                      style={{
                        font: "400 12px/1.3 var(--font-sans)",
                        color: "var(--ink-3)",
                      }}
                    >
                      {subtitle}
                      {ev.badgeAutista ? ` · BADGE ${ev.badgeAutista}` : ""}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
