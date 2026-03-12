import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { buildNextDossierPath, NEXT_MEZZI_PATH } from "./nextStructuralPaths";
import "./next-clone-page-scaffold.css";
import "./next-shell.css";
import "../pages/DossierLista.css";

type Mezzo = {
  targa: string;
  marca: string;
  modello: string;
  categoria: string;
  fotoUrl?: string | null;
};

export default function NextDossierListaPage() {
  const [mezzi, setMezzi] = useState<Mezzo[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaSelezionata, setCategoriaSelezionata] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const ref = doc(db, "storage", "@mezzi_aziendali");
        const snap = await getDoc(ref);
        const raw = snap.exists() ? snap.data() : null;
        const list = Array.isArray(raw)
          ? (raw as Mezzo[])
          : raw && Array.isArray(raw.value)
            ? (raw.value as Mezzo[])
            : [];
        if (!mounted) return;
        setMezzi(list);
      } catch (error) {
        console.error("Errore caricamento Dossier Mezzi clone:", error);
        if (!mounted) return;
        setMezzi([]);
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

  const categorieMap = useMemo(() => {
    const map: Record<string, Mezzo[]> = {};
    mezzi.forEach((mezzo) => {
      const categoria = String(mezzo.categoria || "Senza categoria").trim();
      if (!map[categoria]) {
        map[categoria] = [];
      }
      map[categoria].push(mezzo);
    });
    return map;
  }, [mezzi]);

  const categorie = useMemo(() => Object.keys(categorieMap).sort(), [categorieMap]);

  if (loading) {
    return <div className="dossierlista-loading">Caricamento...</div>;
  }

  return (
    <div className="dossierlista-wrapper">
      <div className="next-structural-page__pill-row" style={{ marginBottom: 16 }}>
        <Link className="next-structural-page__back" to={NEXT_MEZZI_PATH}>
          Torna a Mezzi
        </Link>
        <span className="next-clone-readonly-badge">CLONE READ-ONLY</span>
      </div>

      <h1 className="dossierlista-title">
        {categoriaSelezionata ? categoriaSelezionata : "Dossier Mezzi"}
      </h1>

      {!categoriaSelezionata ? (
        <div className="dossierlista-grid">
          {categorie.map((cat) => (
            <button
              key={cat}
              type="button"
              className="dossierlista-card"
              style={{ cursor: "pointer", padding: "22px", textAlign: "left" }}
              onClick={() => setCategoriaSelezionata(cat)}
            >
              <div
                className="dossierlista-info"
                style={{ fontSize: "18px", fontWeight: "700" }}
              >
                {cat.toUpperCase()}
              </div>
              <div className="dossierlista-info" style={{ fontSize: "13px", opacity: 0.7 }}>
                {categorieMap[cat].length} mezzi
              </div>
            </button>
          ))}
        </div>
      ) : (
        <>
          <button
            type="button"
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
            {"<- Categorie"}
          </button>

          <div className="dossierlista-grid">
            {categorieMap[categoriaSelezionata].map((mezzo) => (
              <Link
                key={mezzo.targa}
                to={buildNextDossierPath(mezzo.targa)}
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
