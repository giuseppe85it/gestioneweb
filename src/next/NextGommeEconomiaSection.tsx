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
  type NextGommeReadOnlyItem,
} from "./domain/nextManutenzioniGommeDomain";

type DataScope = "legacy_parity" | "extended";

type Props = {
  targa: string;
  dataScope?: DataScope;
};

function parseLegacyDate(value: string | null | undefined) {
  const raw = String(value || "").trim();
  if (!raw) return 0;
  const direct = new Date(raw).getTime();
  if (Number.isFinite(direct)) return direct;
  const match = raw.match(/^(\d{1,2})\s+(\d{1,2})\s+(\d{4})$/);
  if (!match) return 0;
  return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), 12, 0, 0, 0).getTime();
}

export default function NextGommeEconomiaSection({
  targa,
  dataScope = "extended",
}: Props) {
  const [sostituzioni, setSostituzioni] = useState<NextGommeLegacyViewItem[]>([]);
  const [gommeItems, setGommeItems] = useState<NextGommeReadOnlyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targa) {
      setSostituzioni([]);
      setGommeItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const snapshot = await readNextMezzoManutenzioniGommeSnapshot(targa);
        if (cancelled) return;
        const visibleItems =
          dataScope === "legacy_parity"
            ? snapshot.gommeItems.filter(
                (item) => item.sourceOrigin === "manutenzione_derivata",
              )
            : snapshot.gommeItems;
        setGommeItems(visibleItems);
        setSostituzioni(mapNextGommeItemsToLegacyView(visibleItems));
      } catch (error) {
        console.error("Errore caricamento DossierGomme NEXT:", error);
        if (cancelled) return;
        setSostituzioni([]);
        setGommeItems([]);
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
  }, [dataScope, targa]);

  const sortedGommeItems = useMemo(
    () =>
      [...gommeItems].sort((left, right) => {
        const byTimestamp =
          (right.timestamp ?? parseLegacyDate(right.dataLabel ?? right.data)) -
          (left.timestamp ?? parseLegacyDate(left.dataLabel ?? left.data));
        if (byTimestamp !== 0) return byTimestamp;
        return right.id.localeCompare(left.id, "it", { sensitivity: "base" });
      }),
    [gommeItems],
  );

  const sorted = [...sostituzioni].sort((a, b) => {
    const [ggA, mmA, yyyyA] = (a.data || "").split(" ");
    const [ggB, mmB, yyyyB] = (b.data || "").split(" ");
    const tsA = new Date(`${yyyyA}-${mmA}-${ggA}`).getTime() || 0;
    const tsB = new Date(`${yyyyB}-${mmB}-${ggB}`).getTime() || 0;
    return tsB - tsA;
  });

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

  const ordinarioPerAsse = useMemo(() => {
    const latestByAsse = new Map<string, NextGommeReadOnlyItem>();
    sortedGommeItems
      .filter((item) => item.modalita !== "straordinario")
      .forEach((item) => {
        const key = (item.asseLabel || item.posizione || item.evento || item.id).trim();
        if (!key || latestByAsse.has(key)) return;
        latestByAsse.set(key, item);
      });

    return Array.from(latestByAsse.values());
  }, [sortedGommeItems]);

  const eventiStraordinari = useMemo(
    () => sortedGommeItems.filter((item) => item.modalita === "straordinario"),
    [sortedGommeItems],
  );

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
              <strong>Assi ordinari tracciati:</strong>
              <span>{ordinarioPerAsse.length}</span>
            </li>
            <li className="dossier-list-item">
              <strong>Eventi straordinari:</strong>
              <span>{eventiStraordinari.length}</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="dossier-card">
        <div className="dossier-card-header">
          <h2>Stato ordinario per asse</h2>
        </div>
        <div className="dossier-card-body">
          {!ordinarioPerAsse.length ? (
            <p className="dossier-empty">Nessun cambio gomme ordinario disponibile.</p>
          ) : (
            <ul className="dossier-list">
              {ordinarioPerAsse.map((item) => (
                <li key={item.id} className="dossier-list-item">
                  <div className="dossier-list-main">
                    <strong>{item.asseLabel || item.posizione || "Asse non indicato"}</strong>
                  </div>
                  <div className="dossier-list-meta">
                    <span>{item.dataLabel || item.data || "-"}</span>
                    <span>{item.km != null ? `${item.km} km` : "km n/d"}</span>
                    <span>{item.fornitore || "-"}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="dossier-card">
        <div className="dossier-card-header">
          <h2>Eventi straordinari</h2>
        </div>
        <div className="dossier-card-body">
          {!eventiStraordinari.length ? (
            <p className="dossier-empty">Nessun evento gomme straordinario registrato.</p>
          ) : (
            <ul className="dossier-list">
              {eventiStraordinari.slice(0, 5).map((item) => (
                <li key={item.id} className="dossier-list-item">
                  <div className="dossier-list-main">
                    <strong>{item.interventoTipo || item.evento}</strong>
                  </div>
                  <div className="dossier-list-meta">
                    <span>{item.dataLabel || item.data || "-"}</span>
                    <span>{item.asseLabel || item.posizione || "-"}</span>
                    <span>
                      {item.quantita != null
                        ? `${item.quantita} gomma${item.quantita === 1 ? "" : "e"}`
                        : "quantita n/d"}
                    </span>
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
          <h2>Storico sostituzioni</h2>
        </div>
        <div className="dossier-card-body">
          {!sorted.length ? (
            <p className="dossier-empty">Ancora nessuna sostituzione.</p>
          ) : (
            <ul className="dossier-list">
              {sortedGommeItems.map((item) => (
                <li key={item.id} className="dossier-list-item">
                  <div className="dossier-list-main">
                    <strong>{item.evento}</strong>
                  </div>
                  <div className="dossier-list-meta">
                    <span>{item.dataLabel || item.data || "-"}</span>
                    <span>{item.asseLabel || item.posizione || "-"}</span>
                    <span>{item.km != null ? `${item.km} km` : "km n/d"}</span>
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
