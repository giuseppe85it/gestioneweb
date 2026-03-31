import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../pages/DossierLista.css";
import { readNextAnagraficheFlottaSnapshot } from "./nextAnagraficheFlottaDomain";
import { buildNextDossierListaDetailPath } from "./nextStructuralPaths";

type DossierListaMezzo = {
  targa: string;
  marca: string;
  modello: string;
  categoria: string;
  fotoUrl: string | null;
};

function groupByCategoria(items: DossierListaMezzo[]) {
  const categories = new Map<string, DossierListaMezzo[]>();

  items.forEach((item) => {
    const categoria = (item.categoria || "Senza categoria").trim() || "Senza categoria";
    const list = categories.get(categoria) ?? [];
    list.push(item);
    categories.set(categoria, list);
  });

  return [...categories.entries()].sort(([left], [right]) =>
    left.localeCompare(right, "it", { sensitivity: "base" })
  );
}

export default function NextDossierListaPage() {
  const [mezzi, setMezzi] = useState<DossierListaMezzo[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaSelezionata, setCategoriaSelezionata] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const snapshot = await readNextAnagraficheFlottaSnapshot({
          includeClonePatches: false,
        });
        if (cancelled) return;

        setMezzi(
          snapshot.items.map((item) => ({
            targa: item.targa,
            marca: item.marca,
            modello: item.modello,
            categoria: item.categoria || "Senza categoria",
            fotoUrl: item.fotoUrl,
          }))
        );
      } catch (error) {
        console.error("Errore caricamento mezzi clone:", error);
        if (!cancelled) {
          setMezzi([]);
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

  const categorie = useMemo(() => groupByCategoria(mezzi), [mezzi]);
  const mezziCategoria = categoriaSelezionata
    ? categorie.find(([categoria]) => categoria === categoriaSelezionata)?.[1] ?? []
    : [];

  if (loading) {
    return <div className="dossierlista-loading">Caricamento...</div>;
  }

  return (
    <div className="dossierlista-wrapper">
      <h1 className="dossierlista-title">
        {categoriaSelezionata ? categoriaSelezionata : "Dossier Mezzi"}
      </h1>

      {!categoriaSelezionata && (
        <div className="dossierlista-grid">
          {categorie.map(([categoria, items]) => (
            <div
              key={categoria}
              className="dossierlista-card"
              style={{ cursor: "pointer", padding: "22px" }}
              onClick={() => setCategoriaSelezionata(categoria)}
            >
              <div className="dossierlista-info" style={{ fontSize: "18px", fontWeight: "700" }}>
                {categoria.toUpperCase()}
              </div>
              <div className="dossierlista-info" style={{ fontSize: "13px", opacity: 0.7 }}>
                {items.length} mezzi
              </div>
            </div>
          ))}
        </div>
      )}

      {categoriaSelezionata && (
        <>
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
            {"< Categorie"}
          </button>

          <div className="dossierlista-grid">
            {mezziCategoria.map((mezzo) => (
              <Link
                key={mezzo.targa}
                to={buildNextDossierListaDetailPath(mezzo.targa)}
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
