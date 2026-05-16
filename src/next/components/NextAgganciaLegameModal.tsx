/**
 * PROMPT 47 T1 — Modale "Aggancia/Cambia/Sostituisci legame manutenzione".
 *
 * Tre modes nella stessa UI:
 *  - "aggancia"           => sorgente senza legame: dropdown candidati per agganciare
 *  - "cambia"             => sorgente con legame valido: mostra link corrente + dropdown per cambiarlo
 *  - "sostituisci-orfano" => sorgente con legame orfano: banner warning + dropdown per sostituire
 *
 * I candidati sono passati come prop dal chiamante (vedi `getManutenzioniPerAggancio`).
 * Pattern UI copiato da NextMergeManutenzioneModal.tsx (PROMPT 45).
 */

import { useState, type ReactElement } from "react";

import type { ManutenzioneCandidataAggancio } from "../helpers/manutenzioniPerAggancio";
import { toDisplay } from "../helpers/dateUnica";

export type AgganciaLegameSorgente = {
  id: string;
  targa: string;
  tipo: "segnalazione" | "controllo";
  descrizione: string;
};

export type AgganciaLegameMode = "aggancia" | "cambia" | "sostituisci-orfano";

type Props = {
  sorgente: AgganciaLegameSorgente;
  mode: AgganciaLegameMode;
  legameAttuale?: { id: string; descrizione?: string } | null;
  candidati: ManutenzioneCandidataAggancio[];
  busy?: boolean;
  onConfirm: (manutenzioneTargetId: string) => void;
  onCancel: () => void;
};

function buildHeader(mode: AgganciaLegameMode): string {
  if (mode === "cambia") return "Cambia legame manutenzione";
  if (mode === "sostituisci-orfano") return "Sostituisci link rotto";
  return "Aggancia a manutenzione esistente";
}

function buildSubLabel(c: ManutenzioneCandidataAggancio): string {
  const parts: string[] = [];
  if (c.stato) parts.push(`stato ${c.stato}`);
  const data = toDisplay(c.dataIso);
  if (data) parts.push(data);
  if (c.fornitore) parts.push(c.fornitore);
  return parts.join(" · ");
}

export function NextAgganciaLegameModal({
  sorgente,
  mode,
  legameAttuale,
  candidati,
  busy = false,
  onConfirm,
  onCancel,
}: Props): ReactElement {
  const [choice, setChoice] = useState<string>("");

  const tipoLabel = sorgente.tipo === "segnalazione" ? "segnalazione" : "controllo";

  const confirm = (): void => {
    if (!choice) return;
    onConfirm(choice);
  };

  return (
    <div
      className="aix-backdrop"
      onMouseDown={busy ? undefined : onCancel}
      data-testid="aggancia-legame-backdrop"
    >
      <div className="aix-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="aix-head">
          <h3>{buildHeader(mode)}</h3>
          <button className="aix-close" type="button" onClick={onCancel} disabled={busy}>
            CHIUDI
          </button>
        </div>
        <div className="aix-body">
          {mode === "sostituisci-orfano" ? (
            <div
              style={{
                background: "#fff7ed",
                border: "1px solid #fdba74",
                color: "#9a3412",
                padding: "10px 12px",
                borderRadius: 6,
                marginBottom: 12,
                fontSize: 13,
              }}
            >
              <strong>Attenzione:</strong> questa {tipoLabel} e' collegata a una manutenzione
              che non esiste piu' (link rotto). Selezionandone una nuova qui sotto, il link
              verra' sostituito.
            </div>
          ) : null}

          <p style={{ marginTop: 0 }}>
            Sorgente: <strong>{sorgente.targa || "-"}</strong> — {sorgente.descrizione || "(senza descrizione)"}
          </p>

          {mode === "cambia" && legameAttuale ? (
            <p style={{ color: "#64748b", fontSize: 13 }}>
              Attualmente collegata a:{" "}
              <code>{legameAttuale.id}</code>
              {legameAttuale.descrizione ? ` — ${legameAttuale.descrizione}` : ""}
            </p>
          ) : null}

          <section style={{ marginTop: 10 }}>
            {candidati.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: 13 }}>
                Nessuna manutenzione disponibile per questa targa (ultimi 365 giorni).
              </p>
            ) : (
              <div>
                <div style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>
                  Seleziona una manutenzione esistente:
                </div>
                {candidati.map((c) => (
                  <label
                    key={c.id}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      padding: "8px 0",
                    }}
                    data-testid="aggancia-candidato"
                  >
                    <input
                      type="radio"
                      name="aggancia-choice"
                      checked={choice === c.id}
                      onChange={() => setChoice(c.id)}
                      disabled={busy}
                    />
                    <span>
                      <strong>{c.descrizione}</strong>
                      <span style={{ display: "block", color: "#64748b", fontSize: 12 }}>
                        {buildSubLabel(c)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </section>

          <div className="aix-actions">
            <button className="edit" type="button" onClick={onCancel} disabled={busy}>
              ANNULLA
            </button>
            <button
              className="edit"
              type="button"
              onClick={confirm}
              disabled={busy || !choice}
              data-testid="aggancia-confirm"
            >
              {mode === "cambia"
                ? "CONFERMA CAMBIO"
                : mode === "sostituisci-orfano"
                ? "SOSTITUISCI LINK"
                : "AGGANCIA"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NextAgganciaLegameModal;
