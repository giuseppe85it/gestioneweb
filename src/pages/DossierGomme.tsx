import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
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
  Line
} from "recharts";

interface SostituzioneGomme {
  id: string;
  data: string; // gg mm aaaa
  posizione: "anteriori" | "posteriori";
  marca: string;
  km: number;
  costo: number;
  fornitore: string;
}

export default function DossierGomme() {
  const { targa } = useParams<{ targa: string }>();
  const navigate = useNavigate();

  const [sostituzioni, setSostituzioni] = useState<SostituzioneGomme[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    data: "",
    posizione: "anteriori",
    marca: "",
    km: "",
    costo: "",
    fornitore: "",
  });

  // ================================
  // CARICAMENTO DATI
  // ================================
  useEffect(() => {
    if (!targa) return;

    const load = async () => {
      const ref = doc(db, "@gomme_mezzi", targa.toUpperCase());
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setSostituzioni(data.sostituzioni || []);
      }

      setLoading(false);
    };

    load();
  }, [targa]);

  // Ordina sostituzioni dalla più recente alla più vecchia
  const sorted = [...sostituzioni].sort((a, b) => {
    const [ggA, mmA, yyyyA] = a.data.split(" ");
    const [ggB, mmB, yyyyB] = b.data.split(" ");
    return new Date(`${yyyyB}-${mmB}-${ggB}`).getTime() -
           new Date(`${yyyyA}-${mmA}-${ggA}`).getTime();
  });

  const ultima = sorted[0] || null;

  const costoMedio = useMemo(() => {
    if (!sostituzioni.length) return 0;
    const tot = sostituzioni.reduce((s, g) => s + g.costo, 0);
    return tot / sostituzioni.length;
  }, [sostituzioni]);

  // ================================
  // FORM → SALVATAGGIO
  // ================================
  const handleSave = async () => {
    if (!targa) return;

    const ref = doc(db, "@gomme_mezzi", targa.toUpperCase());

    const newItem: SostituzioneGomme = {
      id: crypto.randomUUID(),
      data: formData.data,
      posizione: formData.posizione as "anteriori" | "posteriori",
      marca: formData.marca,
      km: Number(formData.km),
      costo: Number(formData.costo),
      fornitore: formData.fornitore,
    };

    const snap = await getDoc(ref);
    const current = snap.exists() ? snap.data().sostituzioni || [] : [];

    await setDoc(ref, {
      sostituzioni: [newItem, ...current],
    });

    setSostituzioni([newItem, ...sostituzioni]);
    setShowForm(false);
  };

  // ================================
  // GRAFICO COSTI ANNUALI
  // ================================
  const costiAnnuali = useMemo(() => {
    const m: Record<string, number> = {};

    sostituzioni.forEach((g) => {
      const anno = g.data.split(" ")[2];
      m[anno] = (m[anno] || 0) + g.costo;
    });

    return Object.entries(m).map(([anno, totale]) => ({
      anno,
      totale,
    }));
  }, [sostituzioni]);

  // ================================
  // GRAFICO DURATA GOMME
  // ================================
  const durataKm = useMemo(() => {
    const arr: { data: string; kmPercorsi: number }[] = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      const curr = sorted[i];
      const next = sorted[i + 1];

      arr.push({
        data: curr.data,
        kmPercorsi: curr.km - next.km,
      });
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

      {/* Pulsante aggiunta */}
      <button
        className="dossier-button primary"
        onClick={() => setShowForm(true)}
        style={{ marginBottom: "20px" }}
      >
        + Aggiungi sostituzione gomme
      </button>

      {/* FORM MODAL */}
      {showForm && (
        <div className="dossier-modal">
          <div className="dossier-modal-content">
            <h2>Nuova sostituzione gomme</h2>

            <div className="dossier-input-group">
              <label>Data</label>
              <input
                type="text"
                placeholder="gg mm aaaa"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              />
            </div>

            <div className="dossier-input-group">
              <label>Posizione</label>
              <select
                value={formData.posizione}
                onChange={(e) => setFormData({ ...formData, posizione: e.target.value })}
              >
                <option value="anteriori">Anteriori</option>
                <option value="posteriori">Posteriori</option>
              </select>
            </div>

            <div className="dossier-input-group">
              <label>Marca</label>
              <input
                type="text"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
              />
            </div>

            <div className="dossier-input-group">
              <label>Km del mezzo</label>
              <input
                type="number"
                value={formData.km}
                onChange={(e) => setFormData({ ...formData, km: e.target.value })}
              />
            </div>

            <div className="dossier-input-group">
              <label>Costo (CHF)</label>
              <input
                type="number"
                value={formData.costo}
                onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
              />
            </div>

            <div className="dossier-input-group">
              <label>Fornitore</label>
              <input
                type="text"
                value={formData.fornitore}
                onChange={(e) => setFormData({ ...formData, fornitore: e.target.value })}
              />
            </div>

            <div className="dossier-modal-buttons">
              <button className="dossier-button ghost" onClick={() => setShowForm(false)}>
                Annulla
              </button>
              <button className="dossier-button primary" onClick={handleSave}>
                Salva
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <strong>Fornitore:</strong> <span>{ultima.fornitore}</span>
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
                      <span>{g.fornitore}</span>
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
                <Bar dataKey="totale" fill="#3c7f5a" radius={[5, 5, 0, 0]} />
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
                  stroke="#14532d"
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
