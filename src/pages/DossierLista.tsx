import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./DossierLista.css"; // <-- usa il CSS corretto

interface Mezzo {
  targa: string;
  marca: string;
  modello: string;
  categoria: string;
  fotoUrl?: string | null;
}

export default function DossierLista() {
  const [mezzi, setMezzi] = useState<Mezzo[]>([]);
  const [loading, setLoading] = useState(true);

  // Categoria selezionata
  const [categoriaSelezionata, setCategoriaSelezionata] = useState<string | null>(null);

  // ================================================
  // CARICAMENTO MEZZI DA FIRESTORE
  // ================================================
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const ref = doc(db, "storage", "@mezzi_aziendali");
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setMezzi([]);
          setLoading(false);
          return;
        }

        const raw = snap.data();
        let lista: Mezzo[] = [];

        // storageSync compatibile
        if (Array.isArray(raw)) {
          lista = raw as Mezzo[];
        } else if (raw && Array.isArray(raw.value)) {
          lista = raw.value as Mezzo[];
        }

        setMezzi(lista);
      } catch (e) {
        console.error("Errore caricamento mezzi:", e);
        setMezzi([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ================================================
  // RAGGRUPPA MEZZI PER CATEGORIA
  // ================================================
  const categorieMap: Record<string, Mezzo[]> = {};
  mezzi.forEach((m) => {
    const cat = (m.categoria || "Senza categoria").trim();
    if (!categorieMap[cat]) categorieMap[cat] = [];
    categorieMap[cat].push(m);
  });

  const categorie = Object.keys(categorieMap).sort();

  // ================================================
  // RENDER
  // ================================================

  if (loading) {
    return <div className="dossierlista-loading">Caricamento…</div>;
  }

  return (
    <div className="dossierlista-wrapper">
      
      {/* =======================
          TITOLO / HEADER
      ======================== */}
      <h1 className="dossierlista-title">
        {categoriaSelezionata ? categoriaSelezionata : "Dossier Mezzi"}
      </h1>

      {/* =======================
          1. SCHERMATA CATEGORIE
      ======================== */}
      {!categoriaSelezionata && (
        <div className="dossierlista-grid">
          {categorie.map((cat) => (
            <div
              key={cat}
              className="dossierlista-card"
              style={{ cursor: "pointer", padding: "22px" }}
              onClick={() => setCategoriaSelezionata(cat)}
            >
              <div className="dossierlista-info" style={{ fontSize: "18px", fontWeight: "700" }}>
                {cat.toUpperCase()}
              </div>
              <div className="dossierlista-info" style={{ fontSize: "13px", opacity: 0.7 }}>
                {categorieMap[cat].length} mezzi
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =======================
          2. SCHERMATA MEZZI FILTRATI
      ======================== */}
      {categoriaSelezionata && (
        <>
          {/* Bottone per tornare indietro */}
          <button
            onClick={() => setCategoriaSelezionata(null)}
            style={{
              marginBottom: "20px",
              background: "transparent",
              border: "1px solid #333",
              padding: "6px 14px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            ← Categorie
          </button>

          <div className="dossierlista-grid">
            {categorieMap[categoriaSelezionata].map((mezzo) => (
              <Link
                key={mezzo.targa}
                to={`/dossiermezzi/${mezzo.targa}`}
                className="dossierlista-card"
              >
                {mezzo.fotoUrl ? (
                  <img src={mezzo.fotoUrl} alt={mezzo.targa} className="dossierlista-img" />
                ) : (
                  <div className="dossierlista-placeholder">Nessuna foto</div>
                )}

                <div className="dossierlista-info">
                  <strong>{mezzo.targa}</strong>
                  <div>
                    {mezzo.marca} {mezzo.modello}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
