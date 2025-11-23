// src/pages/MaterialiDaOrdinare.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MaterialeOrdine, Ordine, UnitaMisura } from "../types/ordini";
import { uploadMaterialImage, deleteMaterialImage } from "../utils/materialImages";

import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

import "./MaterialiDaOrdinare.css";

interface Fornitore {
  id: string;
  nome: string;
}

const ORDINI_DOC_ID = "@ordini";
const generaId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const oggi = () => {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, "0")} ${String(
    d.getMonth() + 1
  ).padStart(2, "0")} ${d.getFullYear()}`;
};

// immagini automatiche in base alla descrizione
const immaginiAutomatiche: { pattern: RegExp; url: string }[] = [
  { pattern: /cemento/i, url: "/materiali/cemento.png" },
  { pattern: /pvc|tubo/i, url: "/materiali/tubo-pvc.png" },
  { pattern: /piastrella/i, url: "/materiali/piastrelle.png" },
  { pattern: /legno|assi/i, url: "/materiali/legno.png" },
];

function trovaImmagineAutomatica(desc: string): string | null {
  for (const m of immaginiAutomatiche) {
    if (m.pattern.test(desc)) return m.url;
  }
  return null;
}

const MaterialiDaOrdinare: React.FC = () => {
  const navigate = useNavigate();

  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const [fornitoreId, setFornitoreId] = useState<string>("");
  const [fornitoreNome, setFornitoreNome] = useState<string>("");

  const [isNuovoFornitore, setIsNuovoFornitore] = useState<boolean>(false);
  const [nomeFornitorePersonalizzato, setNomeFornitorePersonalizzato] =
    useState<string>("");

  const [descrizione, setDescrizione] = useState("");
  const [quantita, setQuantita] = useState("");
  const [unita, setUnita] = useState<UnitaMisura>("pz");

  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);

  const [materiali, setMateriali] = useState<MaterialeOrdine[]>([]);
  const [loading, setLoading] = useState(false);

  // Carica fornitori
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "storage", "@fornitori"));
        if (snap.exists()) {
          const arr = (snap.data()?.value || []) as any[];
          const conv: Fornitore[] = arr.map((f) => ({
            id: f.id || generaId(),
            nome: f.nome || f.ragioneSociale || "",
          }));
          setFornitori(conv);
        }
      } catch (err) {
        console.error("Errore caricamento fornitori:", err);
      }
    };
    load();
  }, []);

  const handleSelectFornitore = (id: string) => {
    if (id === "nuovo") {
      setIsNuovoFornitore(true);
      setFornitoreId("nuovo");
      setFornitoreNome("");
      return;
    }

    setIsNuovoFornitore(false);
    setFornitoreId(id);

    const f = fornitori.find((x) => x.id === id);
    setFornitoreNome(f?.nome || "");
  };

  const handleDescrizioneBlur = () => {
    if (fotoFile || fotoPreview) return;
    const auto = trovaImmagineAutomatica(descrizione);
    if (auto) setFotoPreview(auto);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const resetMateriale = () => {
    setDescrizione("");
    setQuantita("");
    setUnita("pz");
    setFotoFile(null);
    setFotoPreview(null);
  };

  const aggiungiMateriale = async () => {
    if (!descrizione.trim() || !quantita.trim()) return;

    const id = generaId();
    let fotoUrl: string | null = fotoPreview || null;
    let fotoStoragePath: string | null = null;

    if (fotoFile) {
      try {
        const uploaded = await uploadMaterialImage(fotoFile, id);
        fotoUrl = uploaded.fotoUrl;
        fotoStoragePath = uploaded.fotoStoragePath;
      } catch (err) {
        console.error("Errore upload immagine:", err);
      }
    }

    const nuovo: MaterialeOrdine = {
      id,
      descrizione: descrizione.trim().toUpperCase(),
      quantita: parseFloat(quantita),
      unita,
      arrivato: false,
      fotoUrl,
      fotoStoragePath,
    };

    setMateriali((p) => [...p, nuovo]);
    resetMateriale();
  };

  const eliminaMateriale = async (id: string) => {
    const mat = materiali.find((m) => m.id === id);
    if (mat?.fotoStoragePath) await deleteMaterialImage(mat.fotoStoragePath);
    setMateriali((p) => p.filter((m) => m.id !== id));
  };

  const salvaOrdine = async () => {
    if (!materiali.length) return;

    let nomeFinale = fornitoreNome;

    if (isNuovoFornitore && nomeFornitorePersonalizzato.trim() !== "") {
      nomeFinale = nomeFornitorePersonalizzato.trim().toUpperCase();
    }

    if (!nomeFinale) return;

    setLoading(true);
    try {
      const ref = doc(collection(db, "storage"), ORDINI_DOC_ID);
      const snap = await getDoc(ref);
      const existing: Ordine[] = snap.exists()
        ? ((snap.data()?.value as Ordine[]) || [])
        : [];

    const nuovoOrdine: Ordine = {
  id: generaId(),
  idFornitore: fornitoreId === "nuovo" ? generaId() : fornitoreId,
  nomeFornitore: nomeFinale,
  dataOrdine: oggi(),
  materiali,
  arrivato: false,     // ← OBBLIGATORIO
};

      const updated = [...existing, nuovoOrdine];
      await setDoc(ref, { value: updated }, { merge: true });

      setMateriali([]);
      setFornitoreId("");
      setFornitoreNome("");
      setNomeFornitorePersonalizzato("");
      setIsNuovoFornitore(false);
    } catch (err) {
      console.error("Errore salvataggio ordine:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mdo-page">
      <div className="mdo-card">
        <header className="mdo-header">
          <div className="mdo-header-left">
            <img src="/logo.png" className="mdo-logo" alt="logo" />
            <div className="mdo-header-title">MATERIALI DA ORDINARE</div>
          </div>

          <button
            className="mdo-header-button"
            onClick={salvaOrdine}
            disabled={
              loading ||
              materiali.length === 0 ||
              (!fornitoreNome && !nomeFornitorePersonalizzato.trim())
            }
          >
            {loading ? "SALVO..." : "CONFERMA ORDINE"}
          </button>
        </header>

        <div className="mdo-form">
          <div className="mdo-field">
            <label>Fornitore</label>
            <select
              value={fornitoreId}
              onChange={(e) => handleSelectFornitore(e.target.value)}
            >
              <option value="">Seleziona</option>
              {fornitori.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
              <option value="nuovo">+ Nuovo fornitore</option>
            </select>
          </div>

          {isNuovoFornitore && (
            <div className="mdo-field">
              <label>Nome nuovo fornitore</label>
              <input
                type="text"
                value={nomeFornitorePersonalizzato}
                onChange={(e) =>
                  setNomeFornitorePersonalizzato(e.target.value)
                }
              />
            </div>
          )}

          <div className="mdo-grid">
            <div className="mdo-field">
              <label>Descrizione</label>
              <input
                type="text"
                value={descrizione}
                onChange={(e) => setDescrizione(e.target.value)}
                onBlur={handleDescrizioneBlur}
              />
            </div>
            <div className="mdo-field">
              <label>Quantità</label>
              <input
                type="number"
                value={quantita}
                onChange={(e) => setQuantita(e.target.value)}
              />
            </div>
            <div className="mdo-field">
              <label>Unità</label>
              <select value={unita} onChange={(e) => setUnita(e.target.value)}>
                <option value="pz">pz</option>
                <option value="m">m</option>
                <option value="kg">kg</option>
                <option value="lt">lt</option>
              </select>
            </div>
          </div>

          <div className="mdo-photo-row">
            <div className="mdo-photo-preview">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Anteprima materiale" />
              ) : (
                <div className="mdo-photo-placeholder">Nessuna foto</div>
              )}
            </div>

            <div className="mdo-photo-actions">
              <label className="mdo-upload-button">
                Carica foto
                <input type="file" accept="image/*" onChange={handleFileChange} />
              </label>

              <button
                className="mdo-secondary-button"
                onClick={() => {
                  setFotoFile(null);
                  setFotoPreview(null);
                }}
              >
                Rimuovi foto
              </button>
            </div>
          </div>

          <button
            className="mdo-add-button"
            onClick={aggiungiMateriale}
            disabled={!descrizione.trim() || !quantita.trim()}
          >
            AGGIUNGI MATERIALE
          </button>
        </div>

        <div className="mdo-list">
          <div className="mdo-list-header">
            <span>Materiali inseriti</span>
            <span>{materiali.length}</span>
          </div>

          {materiali.length === 0 ? (
            <div className="mdo-empty">Nessun materiale inserito.</div>
          ) : (
            <div className="mdo-list-scroll">
              {materiali.map((m) => (
                <div key={m.id} className="mdo-item">
                  <div className="mdo-item-photo">
                    {m.fotoUrl ? (
                      <img src={m.fotoUrl} alt={m.descrizione} />
                    ) : (
                      <div className="mdo-photo-placeholder small">Foto</div>
                    )}
                  </div>

                  <div className="mdo-item-main">
                    <div className="mdo-item-desc">{m.descrizione}</div>
                    <div className="mdo-item-meta">
                      {m.quantita} {m.unita}
                    </div>
                  </div>

                  <div className="mdo-item-actions">
                    <button className="mdo-delete" onClick={() => eliminaMateriale(m.id)}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mdo-footer">
          <button
            className="mdo-footer-button"
            onClick={() => navigate("/ordini-in-attesa")}
          >
            VAI A ORDINI IN ATTESA
          </button>

          <button
            className="mdo-footer-button mdo-footer-alt"
            onClick={() => navigate("/ordini-arrivati")}
          >
            VAI A ORDINI ARRIVATI
          </button>
        </div>

      </div>
    </div>
  );
};

export default MaterialiDaOrdinare;
