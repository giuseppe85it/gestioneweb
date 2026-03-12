import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import NextClonePageScaffold from "./NextClonePageScaffold";
import {
  NEXT_IA_APIKEY_PATH,
  NEXT_IA_PATH,
} from "./nextStructuralPaths";
import "../pages/IA/IALibretto.css";

type ArchiveMezzo = {
  id?: string;
  targa?: string;
  categoria?: string;
  marca?: string;
  modello?: string;
  librettoUrl?: string | null;
};

function normalizeTarga(value: string | null | undefined) {
  return String(value ?? "").trim().toUpperCase();
}

export default function NextIALibrettoPage() {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [apiKeyExists, setApiKeyExists] = useState<boolean | null>(null);
  const [archiveMezzi, setArchiveMezzi] = useState<ArchiveMezzo[]>([]);
  const [archiveFilter, setArchiveFilter] = useState(params.get("targa") ?? "");
  const archiveMode = params.get("archive") === "1";

  useEffect(() => {
    const load = async () => {
      try {
        const [apiSnap, mezziSnap] = await Promise.all([
          getDoc(doc(db, "@impostazioni_app", "gemini")),
          getDoc(doc(db, "storage", "@mezzi_aziendali")),
        ]);

        setApiKeyExists(Boolean(apiSnap.exists() && apiSnap.data().apiKey));
        const list = mezziSnap.exists() ? mezziSnap.data().value || [] : [];
        setArchiveMezzi(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error("Errore caricamento IA Libretto clone:", error);
        setApiKeyExists(false);
        setArchiveMezzi([]);
      }
    };

    void load();
  }, []);

  const filteredArchive = useMemo(() => {
    const needle = normalizeTarga(archiveFilter);
    return archiveMezzi
      .filter((mezzo) => Boolean(String(mezzo.librettoUrl || "").trim()))
      .filter((mezzo) => {
        if (!needle) return true;
        return normalizeTarga(mezzo.targa).includes(needle);
      })
      .sort((left, right) => normalizeTarga(left.targa).localeCompare(normalizeTarga(right.targa)));
  }, [archiveFilter, archiveMezzi]);

  return (
    <NextClonePageScaffold
      eyebrow="IA"
      title={archiveMode ? "Archivio Libretti" : "Estrazione Libretto"}
      description="Route clone autonoma della famiglia libretto. Upload, estrazione e salvataggio su mezzi restano bloccati; l'archivio gia presente resta consultabile."
      backTo={NEXT_IA_PATH}
      backLabel="Hub IA"
      notice={
        <div>
          <p>
            Stato API Key:{" "}
            <strong>{apiKeyExists === null ? "verifica..." : apiKeyExists ? "configurata" : "mancante"}</strong>
          </p>
          {!apiKeyExists ? (
            <p>
              Nel clone l&apos;utente puo comunque navigare la pagina, ma la configurazione resta
              consultabile solo da <Link to={NEXT_IA_APIKEY_PATH}>API Key IA</Link>.
            </p>
          ) : null}
        </div>
      }
    >
      <div className="ia-libretto-page">
        <div className="ia-libretto-card">
          <div className="ia-libretto-actions">
            <label className="upload-label disabled" title="Clone read-only">
              Carica libretto
            </label>
            <button className="ia-btn primary" type="button" disabled title="Clone read-only">
              Analizza con IA
            </button>
            <Link className="ia-btn outline" to={`${NEXT_IA_PATH}/libretto?archive=1`}>
              Archivio libretti
            </Link>
          </div>

          <div className="ia-libretto-preview" style={{ opacity: 0.7 }}>
            <div className="ia-libretto-preview-empty">
              Upload, anteprima locale e salvataggio restano bloccati nel clone.
            </div>
          </div>
        </div>

        <div className="ia-libretto-card">
          <div className="ia-libretto-archive-head">
            <h2>Archivio Libretti</h2>
            <input
              type="text"
              value={archiveFilter}
              onChange={(event) => setArchiveFilter(event.target.value)}
              placeholder="Filtra per targa"
              className="ia-libretto-search"
            />
          </div>

          {filteredArchive.length === 0 ? (
            <div className="ia-libretto-preview-empty">Nessun libretto disponibile.</div>
          ) : (
            <div className="ia-libretto-archive-list">
              {filteredArchive.map((mezzo) => (
                <div key={`${mezzo.id ?? mezzo.targa}`} className="ia-libretto-archive-row">
                  <div>
                    <strong>{normalizeTarga(mezzo.targa) || "-"}</strong>
                    <div>
                      {[mezzo.categoria, mezzo.marca, mezzo.modello].filter(Boolean).join(" - ") || "-"}
                    </div>
                  </div>
                  {mezzo.librettoUrl ? (
                    <a href={mezzo.librettoUrl} target="_blank" rel="noreferrer" className="ia-btn outline">
                      Apri
                    </a>
                  ) : (
                    <span className="go-badge">URL non disponibile</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </NextClonePageScaffold>
  );
}

