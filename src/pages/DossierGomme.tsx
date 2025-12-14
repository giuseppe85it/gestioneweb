// src/pages/DossierGomme.tsx

import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./DossierMezzo.css";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
} from "recharts";

// Manutenzioni minime che ci servono dal doc @manutenzioni
interface VoceManutenzione {
  id: string;
  targa: string;
  data: string; // "gg mm aaaa"
  descrizione: string;
}

interface SostituzioneGomme {
  id: string;
  data: string; // gg mm aaaa
  posizione: string; // es: "Anteriore", "1° asse", ecc.
  marca: string;
  km: number;
  costo: number; // per ora 0, in futuro da fatture IA
  fornitore: string; // per ora vuoto, in futuro da fatture IA
}

// Parser blocchi "CAMBIO GOMME – ..." dalla descrizione manutenzioni
function parseCambioGomme(voce: VoceManutenzione): SostituzioneGomme[] {
  if (!voce.descrizione || !voce.descrizione.includes("CAMBIO GOMME")) {
    return [];
  }

  const fornitore = (voce as any).eseguito?.trim().toUpperCase() || "";

  const parts = voce.descrizione.split("CAMBIO GOMME").slice(1);
  const results: SostituzioneGomme[] = [];

  parts.forEach((part, idx) => {
    const blocco = "CAMBIO GOMME" + part;
    const righe = blocco
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);

    let posizione = "";
    let marca = "";
    let km = 0;

    righe.forEach((riga) => {
      if (riga.toLowerCase().startsWith("asse:")) {
        posizione = riga.replace(/asse:/i, "").trim();
      } else if (riga.toLowerCase().startsWith("marca:")) {
        marca = riga.replace(/marca:/i, "").trim();
      } else if (riga.toLowerCase().startsWith("km mezzo:")) {
        const num = parseInt(
          riga.replace(/km mezzo:/i, "").replace(/[^\d]/g, ""),
          10
        );
        if (!Number.isNaN(num)) {
          km = num;
        }
      }
    });

    results.push({
      id: `${voce.id || "manut"}-${idx}`,
      data: voce.data || "",
      posizione: posizione || "Cambio gomme",
      marca,
      km,
      costo: 0,              // in futuro verrà dalla fattura IA
      fornitore: fornitore,  // ← AGGIUNTO QUI
    });
  });

  return results;
}

export default function DossierGomme() {
  const { targa } = useParams<{ targa: string }>();
  const navigate = useNavigate();

  const [sostituzioni, setSostituzioni] = useState<SostituzioneGomme[]>([]);
  const [loading, setLoading] = useState(true);

  // ================================
  // CARICAMENTO DATI DA @manutenzioni
  // ================================
  useEffect(() => {
    if (!targa) return;

    const load = async () => {
      setLoading(true);
      try {
        const ref = doc(db, "storage", "@manutenzioni");
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setSostituzioni([]);
          setLoading(false);
          return;
        }

        const raw = snap.data();
        let storico: VoceManutenzione[] = [];

        // Compatibile con storageSync (value) o array diretto
        if (Array.isArray(raw)) {
          storico = raw as VoceManutenzione[];
        } else if (raw && Array.isArray(raw.value)) {
          storico = raw.value as VoceManutenzione[];
        }

        const targaNorm = targa.toUpperCase().trim();
        const perMezzo = storico.filter(
          (v) => (v.targa || "").toUpperCase().trim() === targaNorm
        );

        // Estrai tutti i blocchi "CAMBIO GOMME" dalle manutenzioni del mezzo
        const tutteLeSostituzioni = perMezzo.flatMap(parseCambioGomme);

        setSostituzioni(tutteLeSostituzioni);
      } catch (e) {
        console.error("Errore caricamento DossierGomme:", e);
        setSostituzioni([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [targa]);

  // Ordina sostituzioni dalla più recente alla più vecchia
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
    const tot = sostituzioni.reduce((s, g) => s + (g.costo || 0), 0);
    return tot / sostituzioni.length;
  }, [sostituzioni]);

  // ================================
  // GRAFICO COSTI ANNUALI
  // (per ora userà costo = 0, in futuro verrà riempito da fatture IA)
  // ================================
  const costiAnnuali = useMemo(() => {
    const m: Record<string, number> = {};

    sostituzioni.forEach((g) => {
      const parts = (g.data || "").split(" ");
      const anno = parts[2] || "";
      if (!anno) return;
      m[anno] = (m[anno] || 0) + (g.costo || 0);
    });

    return Object.entries(m).map(([anno, totale]) => ({
      anno,
      totale,
    }));
  }, [sostituzioni]);

  // ================================
  // GRAFICO DURATA GOMME (km tra un cambio e il successivo)
  // ================================
  const durataKm = useMemo(() => {
    const arr: { data: string; kmPercorsi: number }[] = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      const curr = sorted[i];
      const next = sorted[i + 1];

      if (curr.km != null && next.km != null) {
        arr.push({
          data: curr.data,
          kmPercorsi: curr.km - next.km,
        });
      }
    }

    return arr;
  }, [sorted]);

  // ================================
  // RENDER
  // ================================

  if (loading) {
    return <div className="dossier-wrapper">Caricamento…</div>;
  }

  return (
    <div className="dossier-wrapper">
      {/* HEADER */}
      <div className="dossier-header-bar">
        <button className="dossier-button ghost" onClick={() => navigate(-1)}>
          ⟵ Dossier
        </button>

        <div className="dossier-header-center">
          <img src="/logo.png" alt="Logo" className="dossier-logo" />
          <div className="dossier-header-text">
            <span className="dossier-header-label">MANUTENZIONE GOMME</span>
            <h1 className="dossier-header-title">{targa}</h1>
          </div>
        </div>

        <div style={{ width: 120 }}></div>
      </div>

      {/* NESSUN FORM / NESSUN PULSANTE DI INSERIMENTO QUI */}

      <div className="dossier-grid">
        {/* CARD STATISTICHE */}
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

        {/* CARD ULTIMA SOSTITUZIONE */}
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
                  <strong>Marca:</strong> <span>{ultima.marca}</span>
                </li>
                <li className="dossier-list-item">
                  <strong>Costo:</strong> <span>{ultima.costo} CHF</span>
                </li>
                <li className="dossier-list-item">
                  <strong>Fornitore:</strong>{" "}
                  <span>{ultima.fornitore || "-"}</span>
                </li>
              </ul>
            )}
          </div>
        </section>

        {/* CARD STORICO */}
        <section className="dossier-card dossier-card-full">
          <div className="dossier-card-header">
            <h2>Storico sostituzioni</h2>
          </div>
          <div className="dossier-card-body">
            {!sorted.length ? (
              <p className="dossier-empty">Ancora nessuna sostituzione.</p>
            ) : (
              <ul className="dossier-list">
                {sorted.map((g) => (
                  <li key={g.id} className="dossier-list-item">
                    <div className="dossier-list-main">
                      <strong>{g.data}</strong> — {g.posizione} — {g.marca}
                    </div>
                    <div className="dossier-list-meta">
                      <span>{g.km} km</span>
                      <span>{g.costo} CHF</span>
                      <span>{g.fornitore || "-"}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* GRAFICO COSTI ANNUALI */}
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

        {/* GRAFICO DURATA */}
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
                <Line
                  type="monotone"
                  dataKey="kmPercorsi"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
