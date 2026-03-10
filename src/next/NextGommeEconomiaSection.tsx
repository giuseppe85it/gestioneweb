import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  mapNextGommeItemsToLegacyView,
  readNextMezzoManutenzioniGommeSnapshot,
  type NextGommeLegacyViewItem,
} from "./domain/nextManutenzioniGommeDomain";

type Props = { targa: string };

export default function NextGommeEconomiaSection({ targa }: Props) {
  const [sostituzioni, setSostituzioni] = useState<NextGommeLegacyViewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targa) {
      setSostituzioni([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const snapshot = await readNextMezzoManutenzioniGommeSnapshot(targa);
        if (cancelled) return;
        setSostituzioni(mapNextGommeItemsToLegacyView(snapshot.gommeItems));
      } catch (error) {
        console.error("Errore caricamento DossierGomme NEXT:", error);
        if (cancelled) return;
        setSostituzioni([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [targa]);

  const sorted = [...sostituzioni].sort((a, b) => {
    const [ggA, mmA, yyyyA] = (a.data || "").split(" ");
    const [ggB, mmB, yyyyB] = (b.data || "").split(" ");
    const tsA = new Date(`${yyyyA}-${mmA}-${ggA}`).getTime() || 0;
    const tsB = new Date(`${yyyyB}-${mmB}-${ggB}`).getTime() || 0;
    return tsB - tsA;
  });

  const ultima = sorted[0] || null;

  const costoMedio = useMemo(() => {
    if (!sostituzioni.length) return 0;
    const totale = sostituzioni.reduce((sum, item) => sum + (item.costo || 0), 0);
    return totale / sostituzioni.length;
  }, [sostituzioni]);

  const costiAnnuali = useMemo(() => {
    const annuali: Record<string, number> = {};

    sostituzioni.forEach((item) => {
      const parts = (item.data || "").split(" ");
      const anno = parts[2] || "";
      if (!anno) return;
      annuali[anno] = (annuali[anno] || 0) + (item.costo || 0);
    });

    return Object.entries(annuali).map(([anno, totale]) => ({ anno, totale }));
  }, [sostituzioni]);

  const durataKm = useMemo(() => {
    const items: { data: string; kmPercorsi: number }[] = [];

    for (let index = 0; index < sorted.length - 1; index += 1) {
      const corrente = sorted[index];
      const successiva = sorted[index + 1];

      if (corrente.km != null && successiva.km != null) {
        items.push({
          data: corrente.data,
          kmPercorsi: corrente.km - successiva.km,
        });
      }
    }

    return items;
  }, [sorted]);

  if (!targa) return null;

  if (loading) {
    return (
      <section className="dossier-card dossier-card-full">
        <div className="dossier-card-body">
          <div className="dossier-loading">Caricamento...</div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="dossier-card">
        <div className="dossier-card-header">
          <h2>Statistiche Gomme</h2>
        </div>
        <div className="dossier-card-body">
          <ul className="dossier-list">
            <li className="dossier-list-item">
              <strong>Costo medio sostituzione:</strong>
              <span>{costoMedio.toFixed(2)} CHF</span>
            </li>
            <li className="dossier-list-item">
              <strong>Ultima posizione:</strong>
              <span>{ultima?.posizione || "-"}</span>
            </li>
            <li className="dossier-list-item">
              <strong>Marca recente:</strong>
              <span>{ultima?.marca || "-"}</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="dossier-card">
        <div className="dossier-card-header">
          <h2>Ultima sostituzione</h2>
        </div>
        <div className="dossier-card-body">
          {!ultima ? (
            <p className="dossier-empty">Nessuna sostituzione registrata.</p>
          ) : (
            <ul className="dossier-list">
              <li className="dossier-list-item">
                <strong>Data:</strong> <span>{ultima.data}</span>
              </li>
              <li className="dossier-list-item">
                <strong>Posizione:</strong> <span>{ultima.posizione}</span>
              </li>
              <li className="dossier-list-item">
                <strong>Marca:</strong> <span>{ultima.marca || "-"}</span>
              </li>
              <li className="dossier-list-item">
                <strong>Costo:</strong> <span>{ultima.costo} CHF</span>
              </li>
              <li className="dossier-list-item">
                <strong>Fornitore:</strong> <span>{ultima.fornitore || "-"}</span>
              </li>
            </ul>
          )}
        </div>
      </section>

      <section className="dossier-card dossier-card-full">
        <div className="dossier-card-header">
          <h2>Storico sostituzioni</h2>
        </div>
        <div className="dossier-card-body">
          {!sorted.length ? (
            <p className="dossier-empty">Ancora nessuna sostituzione.</p>
          ) : (
            <ul className="dossier-list">
              {sorted.map((item) => (
                <li key={item.id} className="dossier-list-item">
                  <div className="dossier-list-main">
                    <strong>{item.data}</strong> - {item.posizione} - {item.marca}
                  </div>
                  <div className="dossier-list-meta">
                    <span>{item.km} km</span>
                    <span>{item.costo} CHF</span>
                    <span>{item.fornitore || "-"}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="dossier-card dossier-card-full">
        <div className="dossier-card-header">
          <h2>Andamento costi annuali</h2>
        </div>
        <div className="dossier-card-body">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={costiAnnuali}>
              <XAxis dataKey="anno" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totale" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="dossier-card dossier-card-full">
        <div className="dossier-card-header">
          <h2>Durata gomme (km percorsi)</h2>
        </div>
        <div className="dossier-card-body">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={durataKm}>
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="kmPercorsi" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
}
