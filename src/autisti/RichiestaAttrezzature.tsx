import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../autisti/autisti.css";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { getAutistaLocal, getMezzoLocal } from "./autistiStorage";

const KEY_RICHIESTE = "@richieste_attrezzature_autisti_tmp";

function genId() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function RichiestaAttrezzature() {
  const navigate = useNavigate();
  const [autista, setAutista] = useState<any>(null);
  const [mezzo, setMezzo] = useState<any>(null);

  const [testo, setTesto] = useState("");
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [fotoStoragePath, setFotoStoragePath] = useState<string | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [fotoUploading, setFotoUploading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    const a = getAutistaLocal();
    const m = getMezzoLocal();

    if (!a?.badge) {
      navigate("/autisti/login", { replace: true });
      return;
    }
    if (!m?.targaCamion) {
      navigate("/autisti/setup-mezzo", { replace: true });
      return;
    }

    setAutista(a);
    setMezzo(m);
  }, [navigate]);

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrore(null);

      const nextId = recordId ?? genId();
      if (!recordId) setRecordId(nextId);

      const ts = Date.now();
      const extFromName = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const extFromType = file.type.includes("png")
        ? "png"
        : file.type.includes("jpeg")
        ? "jpg"
        : file.type.includes("webp")
        ? "webp"
        : extFromName;
      const safeExt = ["jpg", "jpeg", "png", "webp"].includes(extFromType)
        ? extFromType
        : "jpg";
      const path = `autisti/richieste-attrezzature/${nextId}/${ts}.${safeExt}`;

      setFotoUploading(true);
      if (fotoStoragePath) {
        try {
          await deleteObject(ref(storage, fotoStoragePath));
        } catch (err) {
          console.error("Errore rimozione foto precedente", err);
        }
      }

      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFotoUrl(url);
      setFotoStoragePath(path);
    } catch (err) {
      console.error("Errore caricamento foto", err);
      setErrore("Errore caricamento foto");
    } finally {
      setFotoUploading(false);
      e.target.value = "";
    }
  }

  async function handleRemoveFoto() {
    if (fotoStoragePath) {
      try {
        await deleteObject(ref(storage, fotoStoragePath));
      } catch (err) {
        console.error("Errore rimozione foto", err);
      }
    }
    setFotoUrl(null);
    setFotoStoragePath(null);
    setRecordId(null);
  }

  async function invia() {
    setErrore(null);

    if (fotoUploading) {
      setErrore("Attendi il caricamento della foto");
      return;
    }

    const msg = testo.trim();
    if (msg.length < 3) {
      setErrore("Scrivi cosa ti serve");
      return;
    }

    setLoading(true);

    const now = Date.now();
    const id = recordId ?? genId();
    const record = {
      id,
      testo: msg,

      autistaNome: autista?.nome ?? null,
      badgeAutista: autista?.badge ?? null,

      targaCamion: mezzo?.targaCamion ?? null,
      targaRimorchio: mezzo?.targaRimorchio ?? null,

      fotoUrl: fotoUrl ?? null,
      fotoStoragePath: fotoStoragePath ?? null,

      timestamp: now,
      stato: "nuova",
      letta: false,
    };

    try {
      const current = (await getItemSync(KEY_RICHIESTE)) || [];
      const next = Array.isArray(current) ? [...current, record] : [record];
      await setItemSync(KEY_RICHIESTE, next);

      setTesto("");
      setFotoUrl(null);
      setFotoStoragePath(null);
      setRecordId(null);
      window.alert("Richiesta inviata");
      setLoading(false);
      navigate("/autisti/home", { replace: true });
    } catch {
      setLoading(false);
      setErrore("Errore invio richiesta");
    }
  }

  if (!autista || !mezzo) return null;

  return (
    <div className="autisti-container richiesta-attrezzature-page">
      <div className="richiesta-header">
        <button
          className="autisti-button secondary richiesta-back"
          type="button"
          onClick={() => navigate("/autisti/home")}
        >
          Indietro
        </button>
        <h1 className="autisti-title">Richiesta attrezzature</h1>
      </div>

      <div className="richiesta-meta">
        <div>
          <strong>Motrice:</strong> {mezzo?.targaCamion || "-"}
        </div>
        <div>
          <strong>Rimorchio:</strong> {mezzo?.targaRimorchio || "-"}
        </div>
        <div>
          <strong>Autista:</strong> {autista?.nome || "-"}
        </div>
      </div>

      <label className="richiesta-label" htmlFor="richiesta-testo">
        Messaggio
      </label>
      <textarea
        id="richiesta-testo"
        className="richiesta-textarea"
        value={testo}
        onChange={(e) => setTesto(e.target.value)}
        placeholder="Cosa ti serve?"
      />

      <div className="richiesta-foto">
        <label className="autisti-button secondary richiesta-foto-btn">
          Aggiungi foto
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFoto}
            style={{ display: "none" }}
          />
        </label>

        {fotoUploading ? (
          <div style={{ marginTop: 8, fontSize: 13 }}>Caricamento foto...</div>
        ) : null}

        {fotoUrl && (
          <div className="richiesta-foto-preview">
            <img src={fotoUrl} alt="foto" />
            <button
              className="autisti-button secondary"
              type="button"
              onClick={handleRemoveFoto}
              disabled={fotoUploading}
            >
              Rimuovi foto
            </button>
          </div>
        )}
      </div>

      {errore && <div className="richiesta-errore">{errore}</div>}

      <button
        className="autisti-button richiesta-submit"
        type="button"
        onClick={invia}
        disabled={loading}
      >
        {loading ? "INVIO..." : "INVIA RICHIESTA"}
      </button>
    </div>
  );
}
