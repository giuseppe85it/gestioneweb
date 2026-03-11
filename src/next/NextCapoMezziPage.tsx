import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../pages/CapoMezzi.css";
import "./next-shell.css";
import {
  readNextCapoMezziSnapshot,
  type NextCapoMezzoItem,
} from "./domain/nextCapoDomain";

const GROUP_ORDER = ["Motrici", "Trattori stradali", "Rimorchi / Semirimorchi", "Altro"] as const;

function formatAmountValue(value: number) {
  return value.toFixed(2);
}

export default function NextCapoMezziPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NextCapoMezzoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const snapshot = await readNextCapoMezziSnapshot();
        if (cancelled) return;
        setItems(snapshot.items);
        setLoading(false);
      } catch (loadError: any) {
        if (cancelled) return;
        setError(loadError?.message || "Errore caricamento mezzi.");
        setItems([]);
        setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const mezziOrdinati = useMemo(() => {
    const query = searchTerm.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    return items.filter((item) => !query || item.targa.includes(query));
  }, [items, searchTerm]);

  const groupedMezzi = useMemo(
    () =>
      GROUP_ORDER.map((group) => ({
        label: group,
        items: mezziOrdinati.filter((item) => item.groupLabel === group),
      })).filter((group) => group.items.length > 0),
    [mezziOrdinati]
  );

  return (
    <div className="capo-mezzi-wrapper">
      <div className="capo-mezzi-shell">
        <header className="capo-mezzi-header">
          <div className="capo-mezzi-title">
            <button
              type="button"
              className="capo-logo-button"
              onClick={() => navigate("/next/centro-controllo")}
              aria-label="Vai alla Home clone"
            >
              <img src="/logo.png" alt="Logo" />
            </button>
            <div>
              <h1>Mezzi</h1>
              <p>Seleziona un mezzo per vedere costi e documenti.</p>
            </div>
          </div>
        </header>

        <div className="capo-mezzi-controls">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cerca targa..."
          />
        </div>

        {loading && <div className="capo-mezzi-state">Caricamento mezzi...</div>}
        {error && !loading && <div className="capo-mezzi-state error">{error}</div>}

        {!loading && !error && mezziOrdinati.length === 0 && (
          <div className="capo-mezzi-state">Nessun mezzo trovato.</div>
        )}

        {!loading && !error && mezziOrdinati.length > 0 && (
          <div className="capo-mezzi-sections">
            {groupedMezzi.map((group) => (
              <section key={group.label} className="capo-mezzi-section">
                <div className="capo-mezzi-section-head">
                  <h2>{group.label}</h2>
                  <span>{group.items.length} mezzi</span>
                </div>
                <div className="capo-mezzi-grid">
                  {group.items.map((item) => {
                    const stats = item.stats;
                    return (
                      <button
                        key={item.mezzo.id || item.targa}
                        className="capo-mezzo-card"
                        type="button"
                        onClick={() =>
                          navigate(`/next/capo/costi/${encodeURIComponent(item.targa)}`)
                        }
                      >
                        <div className="capo-mezzo-photo">
                          {item.mezzo.fotoUrl ? (
                            <img src={item.mezzo.fotoUrl} alt={item.targa || "Foto mezzo"} />
                          ) : (
                            <div className="capo-mezzo-placeholder">Nessuna foto</div>
                          )}
                        </div>

                        <div className="capo-mezzo-body">
                          <div className="capo-mezzo-title">{item.targa || "Targa n/d"}</div>
                          <div className="capo-mezzo-desc">{item.description}</div>

                          <div className="capo-mezzo-metrics">
                            <div className="capo-mezzo-metric">
                              <span>Costo reale anno</span>
                              <div className="capo-mezzo-values">
                                {stats.fattureYearCHF > 0 && (
                                  <strong>CHF {formatAmountValue(stats.fattureYearCHF)}</strong>
                                )}
                                {stats.fattureYearEUR > 0 && (
                                  <strong>EUR {formatAmountValue(stats.fattureYearEUR)}</strong>
                                )}
                                {stats.fattureYearCHF === 0 && stats.fattureYearEUR === 0 && (
                                  <strong>0.00</strong>
                                )}
                              </div>
                            </div>
                            {(stats.fattureMonthCHF > 0 || stats.fattureMonthEUR > 0) && (
                              <div className="capo-mezzo-metric mini">
                                <span>Fatture mese</span>
                                <div className="capo-mezzo-values">
                                  {stats.fattureMonthCHF > 0 && (
                                    <strong>CHF {formatAmountValue(stats.fattureMonthCHF)}</strong>
                                  )}
                                  {stats.fattureMonthEUR > 0 && (
                                    <strong>EUR {formatAmountValue(stats.fattureMonthEUR)}</strong>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {(stats.preventiviYearCHF > 0 || stats.preventiviYearEUR > 0) && (
                            <div className="capo-mezzo-badge potential">
                              <span>Potenziale</span>
                              <div className="capo-mezzo-values">
                                {stats.preventiviYearCHF > 0 && (
                                  <strong>CHF {formatAmountValue(stats.preventiviYearCHF)}</strong>
                                )}
                                {stats.preventiviYearEUR > 0 && (
                                  <strong>EUR {formatAmountValue(stats.preventiviYearEUR)}</strong>
                                )}
                              </div>
                            </div>
                          )}

                          {stats.unknownCount > 0 && (
                            <div className="capo-mezzo-badge currency-warning">
                              VALUTA DA VERIFICARE ({stats.unknownCount})
                            </div>
                          )}

                          {stats.incomplete > 0 && (
                            <div className="capo-mezzo-badge incomplete">
                              Dati incompleti ({stats.incomplete})
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
