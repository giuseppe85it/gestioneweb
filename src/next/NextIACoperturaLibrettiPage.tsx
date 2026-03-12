import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import NextClonePageScaffold from "./NextClonePageScaffold";
import { NEXT_IA_PATH } from "./nextStructuralPaths";
import "../pages/IA/IACoperturaLibretti.css";

type MezzoRecord = {
  id?: string;
  targa?: string;
  categoria?: string;
  librettoUrl?: string | null;
  fotoUrl?: string | null;
};

function hasValue(value?: string | null) {
  return Boolean(typeof value === "string" && value.trim().length > 0);
}

export default function NextIACoperturaLibrettiPage() {
  const [mezzi, setMezzi] = useState<MezzoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "storage", "@mezzi_aziendali"));
        const list = snap.exists() ? snap.data().value || [] : [];
        setMezzi(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error("Errore caricamento copertura libretti clone:", error);
        setMezzi([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const filteredRows = useMemo(() => {
    const needle = search.trim().toUpperCase();
    return mezzi
      .filter((mezzo) => {
        if (!needle) return true;
        return String(mezzo.targa || "").toUpperCase().includes(needle);
      })
      .sort((left, right) => String(left.targa || "").localeCompare(String(right.targa || "")));
  }, [mezzi, search]);

  const missingLibretto = filteredRows.filter((mezzo) => !hasValue(mezzo.librettoUrl)).length;
  const missingFoto = filteredRows.filter((mezzo) => !hasValue(mezzo.fotoUrl)).length;

  return (
    <NextClonePageScaffold
      eyebrow="IA"
      title="Copertura Libretti + Foto"
      description="Route clone autonoma della pagina madre di copertura. Repair URL, upload e scritture sul dataset mezzi restano bloccati."
      backTo={NEXT_IA_PATH}
      backLabel="Hub IA"
      notice={
        <p>
          Il clone espone lo stato reale di copertura, ma non permette di riparare o caricare
          libretti/foto.
        </p>
      }
    >
      <div className="copertura-page">
        <div className="copertura-toolbar">
          <input
            type="text"
            className="copertura-search"
            placeholder="Cerca targa"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <span className="go-badge">Senza libretto: {missingLibretto}</span>
          <span className="go-badge">Senza foto: {missingFoto}</span>
        </div>

        {loading ? (
          <div className="next-clone-placeholder">Caricamento copertura libretti...</div>
        ) : (
          <div className="copertura-grid">
            {filteredRows.map((mezzo) => (
              <div key={String(mezzo.id ?? mezzo.targa)} className="copertura-row">
                <div className="copertura-main">
                  <strong>{String(mezzo.targa || "-").toUpperCase()}</strong>
                  <span>{mezzo.categoria || "Senza categoria"}</span>
                </div>
                <div className="copertura-statuses">
                  <span className={`copertura-pill ${hasValue(mezzo.librettoUrl) ? "ok" : "warn"}`}>
                    {hasValue(mezzo.librettoUrl) ? "Libretto OK" : "Libretto mancante"}
                  </span>
                  <span className={`copertura-pill ${hasValue(mezzo.fotoUrl) ? "ok" : "warn"}`}>
                    {hasValue(mezzo.fotoUrl) ? "Foto OK" : "Foto mancante"}
                  </span>
                </div>
                <div className="copertura-actions">
                  <button type="button" disabled title="Clone read-only">
                    Carica libretto
                  </button>
                  <button type="button" disabled title="Clone read-only">
                    Ripara
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </NextClonePageScaffold>
  );
}

