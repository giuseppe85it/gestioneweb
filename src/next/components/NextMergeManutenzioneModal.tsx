/**
 * PROMPT 45 T1c — Modale "Crea nuova vs Unisci a manutenzione esistente".
 *
 * Apre quando si sta per creare una manutenzione daFare da una segnalazione o
 * controllo KO, e per la stessa targa esistono gia' manutenzioni daFare o
 * programmate (forniti dalla pagina chiamante tramite `candidati`).
 *
 * Stateless verso il dataset: i candidati vengono caricati dal chiamante
 * (vedi `getManutenzioniCandidateMerge`) cosi' il bypass "0 candidati" resta
 * banale e non si apre il modale per nulla.
 */

import { useState, type ReactElement } from "react";

import type { ManutenzioneCandidataMerge } from "../helpers/manutenzioniCandidatiMerge";
import { toDisplay } from "../helpers/dateUnica";

export type MergeOrigineRecord = {
  id: string;
  targa: string;
  tipo: "segnalazione" | "controllo";
  descrizioneSorgente: string;
};

type Props = {
  origineRecord: MergeOrigineRecord;
  candidati: ManutenzioneCandidataMerge[];
  busy?: boolean;
  onConfirmCreaNuova: () => void;
  onConfirmMerge: (manutenzioneTargetId: string) => void;
  onCancel: () => void;
};

const NUOVA = "__nuova__" as const;

function formatStato(stato: "daFare" | "programmata"): string {
  return stato === "daFare" ? "Da fare" : "Programmata";
}

function buildSubLabel(c: ManutenzioneCandidataMerge): string {
  const parts: string[] = [];
  parts.push(formatStato(c.stato));
  const aperta = toDisplay(c.dataInserimentoIso);
  if (aperta) parts.push(`aperta il ${aperta}`);
  const programmata = toDisplay(c.dataProgrammataIso);
  if (programmata) parts.push(`programmata per ${programmata}`);
  return parts.join(" · ");
}

export function NextMergeManutenzioneModal({
  origineRecord,
  candidati,
  busy = false,
  onConfirmCreaNuova,
  onConfirmMerge,
  onCancel,
}: Props): ReactElement {
  const [choice, setChoice] = useState<string>(NUOVA);

  const tipoLabel = origineRecord.tipo === "segnalazione" ? "segnalazione" : "controllo";

  const confirm = (): void => {
    if (choice === NUOVA) {
      onConfirmCreaNuova();
      return;
    }
    onConfirmMerge(choice);
  };

  return (
    <div
      className="aix-backdrop"
      onMouseDown={busy ? undefined : onCancel}
      data-testid="merge-manutenzione-backdrop"
    >
      <div className="aix-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="aix-head">
          <h3>Crea nuova o unisci a esistente?</h3>
          <button className="aix-close" type="button" onClick={onCancel} disabled={busy}>
            CHIUDI
          </button>
        </div>
        <div className="aix-body">
          <p style={{ marginTop: 0 }}>
            Per la targa <strong>{origineRecord.targa || "-"}</strong> esistono gia'{" "}
            <strong>{candidati.length}</strong>{" "}
            {candidati.length === 1 ? "manutenzione aperta" : "manutenzioni aperte"}.
            Vuoi crearne una nuova oppure unire questa {tipoLabel} a una di quelle?
          </p>
          {origineRecord.descrizioneSorgente ? (
            <p style={{ color: "#64748b", fontSize: 13 }}>
              {origineRecord.descrizioneSorgente}
            </p>
          ) : null}

          <section style={{ marginTop: 10 }}>
            <label
              style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0" }}
            >
              <input
                type="radio"
                name="merge-choice"
                checked={choice === NUOVA}
                onChange={() => setChoice(NUOVA)}
                disabled={busy}
              />
              <span>
                <strong>Crea una nuova manutenzione da fare</strong>
                <span style={{ display: "block", color: "#64748b", fontSize: 12 }}>
                  Comportamento attuale: nasce un nuovo record collegato a questa{" "}
                  {tipoLabel}.
                </span>
              </span>
            </label>

            {candidati.length > 0 ? (
              <div style={{ marginTop: 6 }}>
                <div style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>
                  Oppure unisci a una manutenzione aperta esistente:
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
                    data-testid="merge-candidato"
                  >
                    <input
                      type="radio"
                      name="merge-choice"
                      checked={choice === c.id}
                      onChange={() => setChoice(c.id)}
                      disabled={busy}
                    />
                    <span>
                      <strong>{c.descrizione}</strong>
                      <span
                        style={{ display: "block", color: "#64748b", fontSize: 12 }}
                      >
                        {buildSubLabel(c)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ) : null}
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
              data-testid="merge-confirm"
            >
              CONFERMA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NextMergeManutenzioneModal;
