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
  sorgenti?: AgganciaLegameSorgente[];
  mode: AgganciaLegameMode;
  legameAttuale?: { id: string; descrizione?: string } | null;
  candidati: ManutenzioneCandidataAggancio[];
  busy?: boolean;
  onConfirm: (manutenzioneTargetId: string) => void;
  onCancel: () => void;
};

function buildHeader(mode: AgganciaLegameMode, count: number): string {
  if (count > 1) return "Collega sorgenti a manutenzione";
  if (mode === "cambia") return "Cambia legame manutenzione";
  if (mode === "sostituisci-orfano") return "Sostituisci link rotto";
  return "Collega a manutenzione esistente";
}

function buildSubLabel(c: ManutenzioneCandidataAggancio): string {
  const parts: string[] = [];
  if (c.stato) parts.push(`stato ${c.stato}`);
  const data = toDisplay(c.dataIso);
  if (data) parts.push(data);
  if (c.fornitore) parts.push(c.fornitore);
  if (c.origineRefsCount > 0) parts.push(`${c.origineRefsCount} origini`);
  return parts.join(" - ");
}

export function NextAgganciaLegameModal({
  sorgente,
  sorgenti,
  mode,
  legameAttuale,
  candidati,
  busy = false,
  onConfirm,
  onCancel,
}: Props): ReactElement {
  const [choice, setChoice] = useState<string>("");
  const allSorgenti = sorgenti && sorgenti.length > 0 ? sorgenti : [sorgente];
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
      <div
        className="aix-modal next-aggancia-legame-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="aix-head">
          <h3>{buildHeader(mode, allSorgenti.length)}</h3>
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
              che non esiste piu'. Selezionandone una nuova qui sotto, il link verra' sostituito.
            </div>
          ) : null}

          {allSorgenti.length === 1 ? (
            <p className="next-aggancia-legame-source" style={{ marginTop: 0 }}>
              Sorgente: <strong>{sorgente.targa || "-"}</strong> -{" "}
              {sorgente.descrizione || "(senza descrizione)"}
            </p>
          ) : (
            <div style={{ marginTop: 0, marginBottom: 12 }}>
              <p style={{ margin: "0 0 6px" }}>
                Sorgenti selezionate: <strong>{allSorgenti.length}</strong>
              </p>
              <ul
                className="next-aggancia-legame-source-list"
                style={{ margin: 0, paddingLeft: 18, color: "#475569", fontSize: 13 }}
              >
                {allSorgenti.map((entry) => (
                  <li key={`${entry.tipo}:${entry.id}`}>
                    <strong>{entry.targa || "-"}</strong> -{" "}
                    {entry.descrizione || "(senza descrizione)"}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {mode === "cambia" && legameAttuale ? (
            <p style={{ color: "#64748b", fontSize: 13 }}>
              Attualmente collegata a: <code>{legameAttuale.id}</code>
              {legameAttuale.descrizione ? ` - ${legameAttuale.descrizione}` : ""}
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
                    className="next-aggancia-legame-option"
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
                    <span className="next-aggancia-legame-option__body">
                      <strong className="next-aggancia-legame-option__title">
                        {c.descrizione}
                      </strong>
                      <span
                        className="next-aggancia-legame-option__meta"
                        style={{ display: "block", color: "#64748b", fontSize: 12 }}
                      >
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
