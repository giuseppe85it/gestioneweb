import { useMemo, useState, type ReactElement } from "react";

import type {
  CandidatoAggancioUniversale,
  CandidatoAggancioTipo,
} from "../helpers/candidatiAggancioUniversale";
import { toDisplay } from "../helpers/dateUnica";

export type AgganciaUniversaleSorgenteManutenzione = {
  id: string;
  targa: string;
  categoria: string | null;
  descrizione: string;
};

export type AgganciaUniversaleScelta = {
  tipo: CandidatoAggancioTipo;
  refId: string;
  refKey: string;
};

type Props = {
  manutenzione: AgganciaUniversaleSorgenteManutenzione;
  candidati: CandidatoAggancioUniversale[];
  busy?: boolean;
  onConfirm: (scelta: AgganciaUniversaleScelta) => void;
  onCancel: () => void;
};

const SEZIONI: Array<{ tipo: CandidatoAggancioTipo; titolo: string }> = [
  { tipo: "controllo", titolo: "Controlli KO" },
  { tipo: "segnalazione", titolo: "Segnalazioni" },
  { tipo: "manutenzione", titolo: "Manutenzioni" },
];

function buildSubLabel(c: CandidatoAggancioUniversale): string {
  const parts: string[] = [];
  if (c.categoria) parts.push(c.categoria);
  if (c.stato && c.stato !== "(senza stato)") parts.push(`stato ${c.stato}`);
  const data = toDisplay(c.dataIso);
  if (data) parts.push(data);
  return parts.join(" · ");
}

export function NextAgganciaUniversaleModal({
  manutenzione,
  candidati,
  busy = false,
  onConfirm,
  onCancel,
}: Props): ReactElement {
  // chiave univoca della scelta: "tipo:refId"
  const [choiceKey, setChoiceKey] = useState<string>("");
  // Scheda attiva selezionata dall'utente (null = usa la prima non vuota).
  const [activeTab, setActiveTab] = useState<CandidatoAggancioTipo | null>(null);

  const byTipo = useMemo(() => {
    const map = new Map<CandidatoAggancioTipo, CandidatoAggancioUniversale[]>();
    for (const c of candidati) {
      const list = map.get(c.tipo) ?? [];
      list.push(c);
      map.set(c.tipo, list);
    }
    return map;
  }, [candidati]);

  const countOf = (tipo: CandidatoAggancioTipo): number => byTipo.get(tipo)?.length ?? 0;
  const firstNonEmpty = SEZIONI.find((s) => countOf(s.tipo) > 0)?.tipo ?? null;
  const effectiveTab =
    activeTab && countOf(activeTab) > 0 ? activeTab : firstNonEmpty;
  const lista = effectiveTab ? byTipo.get(effectiveTab) ?? [] : [];

  const selected = useMemo(
    () => candidati.find((c) => `${c.tipo}:${c.id}` === choiceKey) ?? null,
    [candidati, choiceKey],
  );

  const confirm = (): void => {
    if (!selected) return;
    onConfirm({ tipo: selected.tipo, refId: selected.id, refKey: selected.refKey });
  };

  return (
    <div
      className="aix-backdrop"
      onMouseDown={busy ? undefined : onCancel}
      data-testid="aggancia-universale-backdrop"
    >
      <div
        className="aix-modal next-aggancia-legame-modal"
        style={{ width: "min(940px, 96vw)", maxWidth: "min(940px, 96vw)" }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="aix-head">
          <h3>Collega a un record esistente</h3>
          <button className="aix-close" type="button" onClick={onCancel} disabled={busy}>
            CHIUDI
          </button>
        </div>
        <div className="aix-body" style={{ maxHeight: "74vh" }}>
          <p className="next-aggancia-legame-source" style={{ marginTop: 0 }}>
            Manutenzione: <strong>{manutenzione.targa || "-"}</strong>
            {manutenzione.categoria ? ` (${manutenzione.categoria})` : ""} -{" "}
            {manutenzione.descrizione || "(senza descrizione)"}
          </p>

          {candidati.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: 13 }}>
              Nessun record agganciabile per la targa {manutenzione.targa || "-"} (ultimi 365 giorni).
            </p>
          ) : (
            <>
              {/* Bottoni-scheda in alto: clicco e si apre la sezione corrispondente. */}
              <div
                role="tablist"
                style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "6px 0 12px" }}
              >
                {SEZIONI.map(({ tipo, titolo }) => {
                  const count = countOf(tipo);
                  const isActive = effectiveTab === tipo;
                  return (
                    <button
                      key={tipo}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      disabled={count === 0}
                      onClick={() => setActiveTab(tipo)}
                      data-testid="aggancia-universale-tab"
                      style={{
                        padding: "8px 16px",
                        borderRadius: 999,
                        border: isActive ? "1px solid #166534" : "1px solid #dfe6dc",
                        background: isActive ? "#166534" : count === 0 ? "#f4f6f3" : "#ffffff",
                        color: isActive ? "#ffffff" : count === 0 ? "#9aa69a" : "#166534",
                        fontSize: 13,
                        fontWeight: 800,
                        letterSpacing: 0.3,
                        cursor: count === 0 ? "default" : "pointer",
                      }}
                    >
                      {titolo} ({count})
                    </button>
                  );
                })}
              </div>

              <div style={{ minHeight: 120 }}>
                {lista.map((c) => {
                  const key = `${c.tipo}:${c.id}`;
                  return (
                    <label
                      key={key}
                      className="next-aggancia-legame-option"
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                        padding: "10px 8px",
                        borderRadius: 8,
                        border: choiceKey === key ? "1px solid #166534" : "1px solid transparent",
                        background: choiceKey === key ? "#f0f7f1" : "transparent",
                      }}
                      data-testid="aggancia-universale-candidato"
                    >
                      <input
                        type="radio"
                        name="aggancia-universale-choice"
                        checked={choiceKey === key}
                        onChange={() => setChoiceKey(key)}
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
                  );
                })}
              </div>
            </>
          )}

          <div className="aix-actions">
            <button className="edit" type="button" onClick={onCancel} disabled={busy}>
              ANNULLA
            </button>
            <button
              className="edit"
              type="button"
              onClick={confirm}
              disabled={busy || !selected}
              data-testid="aggancia-universale-confirm"
            >
              AGGANCIA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NextAgganciaUniversaleModal;
