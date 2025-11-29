import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import "./DossierLista.css";

interface Mezzo {
  targa: string;
  marca?: string;
  modello?: string;
  fotoUrl?: string | null;
}

export default function DossierLista() {
  const [mezzi, setMezzi] = useState<Mezzo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMezzi = async () => {
      const snap = await getDoc(doc(db, "storage", "@mezzi_aziendali")); // ✔️ MODIFICATO
      const data = snap.data() || {};
      const items = (data.value || []) as Mezzo[];
      setMezzi(items);
      setLoading(false);
    };

    loadMezzi();
  }, []);

  if (loading) {
    return <div className="dossierlista-loading">Caricamento…</div>;
  }

  return (
    <div className="dossierlista-wrapper">
      <h1 className="dossierlista-title">Dossier Mezzi</h1>

      <div className="dossierlista-grid">
        {mezzi.map((mezzo) => (
          <Link
            key={mezzo.targa}
            to={`/dossiermezzi/${mezzo.targa}`}
            className="dossierlista-card"
          >
            {mezzo.fotoUrl ? (
              <img
                src={mezzo.fotoUrl}
                alt={mezzo.targa}
                className="dossierlista-img"
              />
            ) : (
              <div className="dossierlista-placeholder">Nessuna foto</div>
            )}

            <div className="dossierlista-info">
              <strong>{mezzo.targa}</strong>
              <span>
                {mezzo.marca} {mezzo.modello}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
