import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NextClonePageScaffold from "./NextClonePageScaffold";
import {
  readNextManutenzioniLegacyDataset,
  type NextManutenzioniLegacyDatasetRecord,
} from "./domain/nextManutenzioniDomain";
import { buildNextDossierPath } from "./nextStructuralPaths";

export default function NextManutenzioniPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NextManutenzioniLegacyDatasetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const nextItems = await readNextManutenzioniLegacyDataset();
        if (cancelled) return;
        setItems(nextItems);
      } catch (loadError) {
        console.error("Errore caricamento manutenzioni clone:", loadError);
        if (!cancelled) {
          setItems([]);
          setError("Impossibile leggere lo storico manutenzioni del clone.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(
    () => ({
      total: items.length,
      withTarga: items.filter((item) => Boolean(item.targa.trim())).length,
      withSupplier: items.filter((item) => Boolean(item.fornitore?.trim())).length,
      withMateriali: items.filter((item) => (item.materiali?.length ?? 0) > 0).length,
    }),
    [items],
  );

  return (
    <NextClonePageScaffold
      eyebrow="Gestione Operativa / Manutenzioni"
      title="Manutenzioni"
      description="Route NEXT autonoma dello storico manutenzioni globale, con salto ai dossier mezzo e nessun mount finale del legacy."
      backTo="/next/gestione-operativa"
      backLabel="Gestione Operativa"
      notice={
        <div style={{ display: "grid", gap: 12 }}>
          {loading ? <div className="next-clone-placeholder">Caricamento manutenzioni clone...</div> : null}
          {error ? <div className="next-clone-placeholder">{error}</div> : null}
          {!loading && !error ? (
            <p style={{ margin: 0 }}>
              Manutenzioni lette: {counts.total} | Con targa: {counts.withTarga} | Con fornitore:{" "}
              {counts.withSupplier} | Con materiali: {counts.withMateriali}
            </p>
          ) : null}
        </div>
      }
    >
      {!loading && !error ? (
        <div className="go-storico">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="go-storico-row">
                <span>{item.data ?? "-"}</span>
                <span>
                  {item.targa.trim() ? (
                    <button
                      type="button"
                      className="go-link-btn"
                      style={{ marginTop: 0, padding: "2px 8px", fontSize: "0.75rem" }}
                      onClick={() => navigate(buildNextDossierPath(item.targa))}
                    >
                      {item.targa}
                    </button>
                  ) : (
                    "-"
                  )}
                </span>
                <span>
                  {item.tipo === "compressore" ? "COMPRESSORE - " : "MEZZO - "}
                  {item.descrizione ?? "-"}
                  {(item.materiali?.length ?? 0) > 0
                    ? ` - materiali ${item.materiali?.length ?? 0}`
                    : ""}
                  {item.fornitore ? ` - ${item.fornitore}` : ""}
                </span>
              </div>
            ))
          ) : (
            <div className="go-storico-row">
              <span>-</span>
              <span>-</span>
              <span>Nessuna manutenzione leggibile</span>
            </div>
          )}
        </div>
      ) : null}
    </NextClonePageScaffold>
  );
}
