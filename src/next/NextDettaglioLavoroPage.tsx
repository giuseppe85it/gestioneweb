import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import NextClonePageScaffold from "./NextClonePageScaffold";
import {
  readNextDettaglioLavoroSnapshot,
  type NextLavoriDetailSnapshot,
} from "./domain/nextLavoriDomain";
import {
  markNextLavoriCloneDeleted,
  upsertNextLavoriCloneOverride,
} from "./nextLavoriCloneState";
import { formatEditableDateUI } from "./nextDateFormat";

export default function NextDettaglioLavoroPage() {
  const navigate = useNavigate();
  const { lavoroId } = useParams<{ lavoroId: string }>();
  const [searchParams] = useSearchParams();
  const [snapshot, setSnapshot] = useState<NextLavoriDetailSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [esecutore, setEsecutore] = useState("");
  const [editDescrizione, setEditDescrizione] = useState("");
  const [editData, setEditData] = useState("");

  const backTo = useMemo(() => {
    return searchParams.get("from") === "lavori-eseguiti"
      ? "/next/lavori-eseguiti"
      : "/next/lavori-in-attesa";
  }, [searchParams]);

  const reload = useCallback(async () => {
    if (!lavoroId) {
      setSnapshot(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const nextSnapshot = await readNextDettaglioLavoroSnapshot(lavoroId);
      setSnapshot(nextSnapshot);
      setEditDescrizione(nextSnapshot?.target.descrizione ?? "");
      setEditData(formatEditableDateUI(nextSnapshot?.target.dataInserimento ?? ""));
    } catch (loadError) {
      setSnapshot(null);
      setError(loadError instanceof Error ? loadError.message : "Impossibile leggere il dettaglio lavoro.");
    } finally {
      setLoading(false);
    }
  }, [lavoroId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const applyExecute = async () => {
    if (!snapshot?.target) {
      return;
    }
    upsertNextLavoriCloneOverride(snapshot.target.id, {
      eseguito: true,
      chiHaEseguito: esecutore.trim() || "clone_next",
      dataEsecuzione: new Date().toISOString(),
    });
    setNotice("Lavoro marcato come eseguito nel clone.");
    await reload();
  };

  const applyEdit = async () => {
    if (!snapshot?.target) {
      return;
    }
    upsertNextLavoriCloneOverride(snapshot.target.id, {
      descrizione: editDescrizione.trim() || snapshot.target.descrizione,
      dataInserimento: editData || snapshot.target.dataInserimento || "",
    });
    setNotice("Dettaglio lavoro aggiornato nel clone.");
    await reload();
  };

  const applyDelete = async () => {
    if (!snapshot?.target) {
      return;
    }
    markNextLavoriCloneDeleted(snapshot.target.id);
    navigate(backTo);
  };

  return (
    <NextClonePageScaffold
      eyebrow="Gestione Operativa / Lavori"
      title="Dettaglio lavoro"
      description="Route NEXT autonoma del dettaglio lavoro: gruppo, stato e aggiornamenti clone-local restano nel perimetro NEXT."
      backTo={backTo}
      backLabel="Torna alla lista"
      notice={
        <div style={{ display: "grid", gap: 12 }}>
          {loading ? <div className="next-clone-placeholder">Caricamento dettaglio lavoro...</div> : null}
          {error ? <div className="next-clone-placeholder">{error}</div> : null}
          {notice ? <div className="next-clone-placeholder">{notice}</div> : null}
          {snapshot ? (
            <p style={{ margin: 0 }}>
              Gruppo: {snapshot.detailGroup.label} | Elementi: {snapshot.counts.totalItems} | Aperti: {snapshot.counts.aperti}
            </p>
          ) : null}
        </div>
      }
    >
      {snapshot ? (
        <div style={{ display: "grid", gap: 16 }}>
          <div className="next-clone-placeholder" style={{ display: "grid", gap: 12 }}>
            <strong>{snapshot.target.descrizione}</strong>
            <div style={{ fontSize: 12, color: "#475569" }}>
              {snapshot.target.targa ?? "MAGAZZINO"} | Inserito {snapshot.target.dataInserimento ?? "-"} |
              Stato {snapshot.target.eseguito ? "ESEGUITO" : "APERTO"}
            </div>
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span>Esecutore clone</span>
                <input value={esecutore} onChange={(event) => setEsecutore(event.target.value)} placeholder="Chi ha eseguito" />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span>Descrizione</span>
                <input value={editDescrizione} onChange={(event) => setEditDescrizione(event.target.value)} />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span>Data inserimento</span>
                <input type="text" value={editData} onChange={(event) => setEditData(event.target.value)} placeholder="gg mm aaaa" />
              </label>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={() => void applyEdit()}>
                Salva modifica nel clone
              </button>
              <button type="button" onClick={() => void applyExecute()} disabled={snapshot.target.eseguito}>
                {snapshot.target.eseguito ? "Gia eseguito" : "Segna eseguito nel clone"}
              </button>
              <button type="button" onClick={() => void applyDelete()}>
                Elimina dal clone
              </button>
            </div>
          </div>

          <div className="next-clone-placeholder" style={{ display: "grid", gap: 12 }}>
            <strong>Elementi del gruppo</strong>
            {snapshot.items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: item.isPrimary ? "#f8fafc" : "#ffffff",
                }}
              >
                <div>
                  <strong>{item.descrizione}</strong>
                  <div style={{ fontSize: 12, color: "#475569" }}>
                    {item.targa ?? "MAGAZZINO"} | {item.dataInserimento ?? "-"} | {item.urgenza ?? "media"}
                  </div>
                </div>
                <span className="next-clone-readonly-badge">
                  {item.eseguito ? "ESEGUITO" : "APERTO"}
                </span>
              </div>
            ))}
          </div>

          {snapshot.limitations.length ? (
            <div className="next-clone-placeholder">
              <strong>Limiti del reader</strong>
              <ul style={{ margin: "8px 0 0 16px" }}>
                {snapshot.limitations.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </NextClonePageScaffold>
  );
}
