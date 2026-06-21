import { useState, type ReactElement } from "react";

export type ProponiAgganciaSegnaleItem = {
  id: string;
  tipo: "segnalazione" | "controllo";
  descrizione: string;
  dataLabel: string;
};

type Props = {
  targa: string;
  descrizioneManutenzione: string;
  manutenzioneEseguita: boolean;
  segnali: ProponiAgganciaSegnaleItem[];
  busy?: boolean;
  onConfirm: (segnaliIds: string[]) => void;
  onCancel: () => void;
};

function tipoLabel(tipo: ProponiAgganciaSegnaleItem["tipo"]): string {
  return tipo === "segnalazione" ? "Segnalazione" : "Controllo KO";
}

export function NextProponiAgganciaSegnaliModal({
  targa,
  descrizioneManutenzione,
  manutenzioneEseguita,
  segnali,
  busy = false,
  onConfirm,
  onCancel,
}: Props): ReactElement {
  const [selected, setSelected] = useState<Set<string>>(() => new Set<string>());

  const toggle = (id: string): void => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirm = (): void => {
    if (selected.size === 0) return;
    onConfirm([...selected]);
  };

  return (
    <div
      className="aix-backdrop"
      onMouseDown={busy ? undefined : onCancel}
      data-testid="proponi-aggancia-backdrop"
    >
      <div
        className="aix-modal next-aggancia-legame-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="aix-head">
          <h3>Collega i segnali aperti del mezzo</h3>
          <button className="aix-close" type="button" onClick={onCancel} disabled={busy}>
            CHIUDI
          </button>
        </div>
        <div className="aix-body">
          <p style={{ marginTop: 0 }}>
            Hai registrato una manutenzione per <strong>{targa || "-"}</strong>
            {descrizioneManutenzione ? ` - ${descrizioneManutenzione}` : ""}.
          </p>
          <p style={{ color: "#475569", fontSize: 13, marginTop: 0 }}>
            Su questo mezzo ci sono <strong>{segnali.length}</strong>{" "}
            {segnali.length === 1 ? "segnale aperto" : "segnali aperti"}. Spunta quelli
            che questa manutenzione risolve:{" "}
            {manutenzioneEseguita
              ? "verranno collegati e chiusi."
              : "verranno collegati e si chiuderanno quando segnerai la manutenzione come eseguita."}
          </p>

          <section style={{ marginTop: 10 }}>
            {segnali.map((s) => (
              <label
                key={`${s.tipo}:${s.id}`}
                className="next-aggancia-legame-option"
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: "8px 0",
                }}
                data-testid="proponi-aggancia-segnale"
              >
                <input
                  type="checkbox"
                  checked={selected.has(s.id)}
                  onChange={() => toggle(s.id)}
                  disabled={busy}
                />
                <span className="next-aggancia-legame-option__body">
                  <strong className="next-aggancia-legame-option__title">
                    {tipoLabel(s.tipo)}
                    {s.dataLabel ? ` - ${s.dataLabel}` : ""}
                  </strong>
                  <span
                    className="next-aggancia-legame-option__meta"
                    style={{ display: "block", color: "#64748b", fontSize: 12 }}
                  >
                    {s.descrizione || "(senza descrizione)"}
                  </span>
                </span>
              </label>
            ))}
          </section>

          <div className="aix-actions">
            <button className="edit" type="button" onClick={onCancel} disabled={busy}>
              NON ORA
            </button>
            <button
              className="edit"
              type="button"
              onClick={confirm}
              disabled={busy || selected.size === 0}
              data-testid="proponi-aggancia-confirm"
            >
              COLLEGA I SELEZIONATI ({selected.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NextProponiAgganciaSegnaliModal;
