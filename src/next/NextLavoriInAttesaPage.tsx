import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NextClonePageScaffold from "./NextClonePageScaffold";
import {
  buildNextDettaglioLavoroPath,
  readNextLavoriInAttesaSnapshot,
  type NextLavoriListaSnapshot,
} from "./domain/nextLavoriDomain";

export default function NextLavoriInAttesaPage() {
  const [snapshot, setSnapshot] = useState<NextLavoriListaSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const nextSnapshot = await readNextLavoriInAttesaSnapshot();
        if (!mounted) {
          return;
        }
        setSnapshot(nextSnapshot);
      } catch (loadError) {
        if (!mounted) {
          return;
        }
        setSnapshot(null);
        setError(loadError instanceof Error ? loadError.message : "Impossibile leggere i lavori in attesa.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <NextClonePageScaffold
      eyebrow="Gestione Operativa / Lavori"
      title="Lavori in attesa"
      description="Route NEXT autonoma della backlog list open, letta dal reader D02 senza montare la madre."
      backTo="/next/lavori-da-eseguire"
      backLabel="Lavori da eseguire"
      notice={
        <div style={{ display: "grid", gap: 12 }}>
          {loading ? <div className="next-clone-placeholder">Caricamento lavori in attesa...</div> : null}
          {error ? <div className="next-clone-placeholder">{error}</div> : null}
          {snapshot ? (
            <p style={{ margin: 0 }}>
              Lavori letti: {snapshot.counts.totalLavori} | Gruppi: {snapshot.counts.totalGruppi} |
              Gruppi mezzo: {snapshot.counts.gruppiMezzo}
            </p>
          ) : null}
        </div>
      }
    >
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link to="/next/lavori-da-eseguire">Apri nuovi lavori</Link>
          <Link to="/next/lavori-eseguiti">Storico eseguiti</Link>
        </div>

        {snapshot?.groups.length ? (
          snapshot.groups.map((group) => (
            <div key={group.key} className="next-clone-placeholder" style={{ display: "grid", gap: 12 }}>
              <div>
                <strong>{group.label}</strong>
                <div style={{ fontSize: 12, color: "#475569" }}>
                  {group.kind === "mezzo" ? "Gruppo mezzo" : "Gruppo magazzino"} | Totale {group.counts.total}
                </div>
              </div>
              {group.items.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <strong>{item.descrizione}</strong>
                    <div style={{ fontSize: 12, color: "#475569" }}>
                      {item.targa ?? "MAGAZZINO"} | {item.dataInserimento ?? "-"} | {item.urgenza ?? "media"}
                    </div>
                  </div>
                  <Link to={buildNextDettaglioLavoroPath({ lavoroId: item.id, from: "lavori-in-attesa" })}>
                    Apri dettaglio
                  </Link>
                </div>
              ))}
            </div>
          ))
        ) : snapshot && !loading ? (
          <div className="next-clone-placeholder">Nessun lavoro in attesa leggibile.</div>
        ) : null}
      </div>
    </NextClonePageScaffold>
  );
}
