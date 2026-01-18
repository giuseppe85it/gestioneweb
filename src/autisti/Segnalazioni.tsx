import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./autisti.css";
import "./Segnalazioni.css";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { getAutistaLocal, getMezzoLocal } from "../autisti/autistiStorage";

type Ambito = "motrice" | "rimorchio";
type TipoProblema = "motore" | "freni" | "gomme" | "idraulico" | "elettrico" | "altro";
type PosizioneGomma = "anteriore" | "posteriore" | "asse1" | "asse2" | "asse3";
type ProblemaGomma = "forata" | "usurata" | "da_controllare" | "altro";

const KEY_SEGNALAZIONI = "@segnalazioni_autisti_tmp";
const KEY_MEZZI = "@mezzi_aziendali";

function genId() {
  // compatibile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function toItDateTime(ts: number) {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd} ${mm} ${yyyy} - ${hh}:${mi}`;
}

function normalizeCategoria(cat?: string | null) {
  return (cat || "").toLowerCase().trim();
}

function getGommeOptions(ambito: Ambito | null, categoriaMezzo?: string | null): PosizioneGomma[] {
  const cat = normalizeCategoria(categoriaMezzo);

  if (!ambito) return [];

  if (ambito === "motrice") {
    if (cat.includes("motrice 4 assi")) return ["anteriore", "asse1", "asse2", "asse3"];
    if (cat.includes("motrice 3 assi")) return ["anteriore", "asse1", "asse2"];
    if (cat.includes("trattore")) return ["anteriore", "posteriore"];
    return ["anteriore", "posteriore"];
  }

  if (cat.includes("semirimorchio")) return ["asse1", "asse2", "asse3"];
  if (cat.includes("biga")) return ["asse1", "asse2"];
  return ["asse1", "asse2"];
}

function labelPosizione(p: PosizioneGomma) {
  switch (p) {
    case "anteriore":
      return "ANTERIORE";
    case "posteriore":
      return "POSTERIORE";
    case "asse1":
      return "ASSE 1";
    case "asse2":
      return "ASSE 2";
    case "asse3":
      return "ASSE 3";
  }
}

function labelTipo(t: TipoProblema) {
  switch (t) {
    case "motore":
      return "MOTORE";
    case "freni":
      return "FRENI";
    case "gomme":
      return "GOMME";
    case "idraulico":
      return "IDRAULICO";
    case "elettrico":
      return "ELETTRICO";
    case "altro":
      return "ALTRO";
  }
}

function labelProblemaGomma(p: ProblemaGomma) {
  switch (p) {
    case "forata":
      return "FORATA";
    case "usurata":
      return "USURATA";
    case "da_controllare":
      return "DA CONTROLLARE";
    case "altro":
      return "ALTRO";
  }
}

type FotoLocal = { id: string; url: string; storagePath: string };

type MezzoAziendale = {
  id: string;
  targa: string;
  categoria?: string;
};

type MezzoAttivoLocal = {
  targaCamion: string | null;
  targaRimorchio: string | null;
  timestamp?: number;
};

export default function Segnalazioni() {
  const navigate = useNavigate();
  const nowTs = useMemo(() => Date.now(), []);

  const [loading, setLoading] = useState(false);

  const [autista, setAutista] = useState<any>(null);
  const [mezzoAttivo, setMezzoAttivo] = useState<MezzoAttivoLocal | null>(null);
  const [mezziAziendali, setMezziAziendali] = useState<MezzoAziendale[]>([]);

  const [ambito, setAmbito] = useState<Ambito | null>(null);
  const [tipo, setTipo] = useState<TipoProblema | null>(null);

  const [posizioneGomma, setPosizioneGomma] = useState<PosizioneGomma | null>(null);
  const [problemaGomma, setProblemaGomma] = useState<ProblemaGomma | null>(null);

  const [descrizione, setDescrizione] = useState("");
  const [note, setNote] = useState("");

  const [foto, setFoto] = useState<FotoLocal[]>([]);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [fotoUploading, setFotoUploading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // SESSIONE SOLO LOCALE
      const a = getAutistaLocal();
      const m = getMezzoLocal();
      const list = (await getItemSync(KEY_MEZZI)) || [];

      if (!a?.badge) {
        navigate("/autisti/login", { replace: true });
        return;
      }
      if (!m?.targaCamion) {
        navigate("/autisti/setup-mezzo", { replace: true });
        return;
      }

      setAutista(a || null);
      setMezzoAttivo((m as MezzoAttivoLocal) || null);
      setMezziAziendali(Array.isArray(list) ? list : []);
    })();
  }, [navigate]);

  function findMezzoByTarga(targa?: string | null) {
    if (!targa) return null;
    return mezziAziendali.find((x) => (x.targa || "").toUpperCase() === targa.toUpperCase()) || null;
  }

  const targaMotrice = mezzoAttivo?.targaCamion ?? null;
  const targaRimorchio = mezzoAttivo?.targaRimorchio ?? null;

  const mezzoMotrice = useMemo(() => findMezzoByTarga(targaMotrice), [mezziAziendali, targaMotrice]);
  const mezzoRimorchio = useMemo(() => findMezzoByTarga(targaRimorchio), [mezziAziendali, targaRimorchio]);

  const categoriaSelezionata = useMemo(() => {
    if (!ambito) return null;
    return ambito === "motrice" ? mezzoMotrice?.categoria ?? null : mezzoRimorchio?.categoria ?? null;
  }, [ambito, mezzoMotrice?.categoria, mezzoRimorchio?.categoria]);

  const gommeOptions = useMemo(
    () => getGommeOptions(ambito, categoriaSelezionata),
    [ambito, categoriaSelezionata]
  );

  function resetGomme() {
    setPosizioneGomma(null);
    setProblemaGomma(null);
  }

  function resetByAmbito(next: Ambito) {
    if (next === "rimorchio" && !targaRimorchio) {
      setAlertMsg("Nessun rimorchio agganciato. Seleziona MOTRICE.");
      setErrors({ ambito: "Nessun rimorchio agganciato" });
      return;
    }

    setAmbito(next);
    setTipo(null);
    resetGomme();
    setErrors({});
    setAlertMsg(null);
  }

  function resetByTipo(next: TipoProblema) {
    setTipo(next);
    setErrors({});
    setAlertMsg(null);
    if (next !== "gomme") resetGomme();
  }

  function getPlaceholderDescrizione() {
    if (tipo === "motore") return "Es. rumore anomalo, perdita olio, spia accesa...";
    if (tipo === "gomme") return "Es. gomma asse 2 molto consumata, vibra, perde aria...";
    if (tipo === "freni") return "Es. frena male, rumore, spia, aria...";
    if (tipo === "idraulico") return "Es. perdita olio, pistone, tubo, pressione...";
    if (tipo === "elettrico") return "Es. luci non funzionano, batteria, spie...";
    return "Descrivi il problema in poche parole...";
  }

  function validate() {
    const e: Record<string, string> = {};

    if (!ambito) e.ambito = "Seleziona MOTRICE o RIMORCHIO";
    if (ambito === "rimorchio" && !targaRimorchio) e.ambito = "Nessun rimorchio agganciato";

    if (!tipo) e.tipo = "Seleziona il tipo problema";
    if (!descrizione.trim()) e.descrizione = "Scrivi una descrizione";

    if (tipo === "gomme") {
      if (!posizioneGomma) e.posizioneGomma = "Seleziona asse/posizione";
      if (!problemaGomma) e.problemaGomma = "Seleziona il problema gomma";
    }

    setErrors(e);

    if (Object.keys(e).length > 0) {
      setAlertMsg("Manca: " + Object.values(e).join(" - "));
      return false;
    }

    setAlertMsg(null);
    return true;
  }

  async function handleAddFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = 3 - foto.length;
    if (remaining <= 0) {
      setAlertMsg("Hai gia inserito 3 foto (massimo).");
      e.target.value = "";
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);
    const baseId = recordId ?? genId();
    if (!recordId) setRecordId(baseId);
    setAlertMsg(null);
    setFotoUploading(true);

    const uploaded: FotoLocal[] = [];
    try {
      for (let i = 0; i < toUpload.length; i += 1) {
        const file = toUpload[i];
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
        const path = `autisti/segnalazioni/${baseId}/${ts}_${foto.length + i}.${safeExt}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        uploaded.push({ id: genId(), url, storagePath: path });
      }
      setFoto((prev) => [...prev, ...uploaded]);
    } catch (err) {
      console.error("Errore nel caricamento foto.", err);
      setAlertMsg("Errore nel caricamento foto.");
    } finally {
      setFotoUploading(false);
      e.target.value = "";
    }
  }

  function removeFoto(id: string) {
    setFoto((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleSave() {
    if (fotoUploading) {
      setAlertMsg("Attendi il caricamento delle foto.");
      return;
    }
    if (!validate()) return;

    setLoading(true);

    const isMotrice = ambito === "motrice";
    const targaSelezionata = isMotrice ? targaMotrice : targaRimorchio;
    const mezzoRef = isMotrice ? mezzoMotrice : mezzoRimorchio;

    const id = recordId ?? genId();
    const record = {
      id,

      ambito,

      mezzoId: mezzoRef?.id || null,
      targa: targaSelezionata || null,
      categoriaMezzo: mezzoRef?.categoria || null,

      targaCamion: targaMotrice || null,
      targaRimorchio: targaRimorchio || null,

      autistaId: autista?.id || null,
      autistaNome: autista?.nome || null,
      badgeAutista: autista?.badge || null,

      tipoProblema: tipo,

      posizioneGomma: tipo === "gomme" ? posizioneGomma : null,
      problemaGomma: tipo === "gomme" ? problemaGomma : null,

      descrizione: descrizione.trim(),
      note: note.trim() || null,

      fotoUrls: foto.map((f) => f.url),
      fotoStoragePaths: foto.map((f) => f.storagePath),
      data: nowTs,

      stato: "nuova",
      letta: false,

      flagVerifica: false,
      motivoVerifica: null,
    };

    try {
      const current = (await getItemSync(KEY_SEGNALAZIONI)) || [];
      const next = Array.isArray(current) ? [...current, record] : [record];
      await setItemSync(KEY_SEGNALAZIONI, next);

      setLoading(false);
      setRecordId(null);
      setFoto([]);
      navigate("/autisti/home");    } catch {
      setLoading(false);
      setAlertMsg("Errore salvataggio. Riprova.");
    }
  }

  return (
    <div className="autisti-container seg-container">
      <h1 className="autisti-title">Segnalazione manutenzione</h1>

      <div className="seg-subtitle">
        {targaMotrice ? `Motrice: ${targaMotrice}` : "Motrice: -"}{" "}
        {targaRimorchio ? `- Rimorchio: ${targaRimorchio}` : "- Rimorchio: -"}{" "}
        {autista?.nome ? `- Autista: ${autista.nome}` : ""}
      </div>

      {alertMsg && <div className="seg-alert">{alertMsg}</div>}

      <div className="seg-section">
        <div className="seg-label">Dove e' il problema</div>
        <div className="seg-toggle">
          <button
            className={ambito === "motrice" ? "active green" : errors.ambito ? "errorBtn" : ""}
            onClick={() => resetByAmbito("motrice")}
          >
            MOTRICE
          </button>
          <button
            className={ambito === "rimorchio" ? "active green" : errors.ambito ? "errorBtn" : ""}
            onClick={() => resetByAmbito("rimorchio")}
            disabled={!targaRimorchio}
            title={!targaRimorchio ? "Nessun rimorchio agganciato" : ""}
          >
            RIMORCHIO
          </button>
        </div>
        {errors.ambito && <div className="seg-error">{errors.ambito}</div>}
      </div>

      <div className="seg-section">
        <div className="seg-label">Tipo problema</div>

        <div className="seg-grid">
          {(["motore", "freni", "gomme", "idraulico", "elettrico", "altro"] as TipoProblema[]).map(
            (t) => (
              <button
                key={t}
                className={`seg-chip ${tipo === t ? "active green" : ""} ${errors.tipo ? "errorBtn" : ""}`}
                onClick={() => resetByTipo(t)}
              >
                {labelTipo(t)}
              </button>
            )
          )}
        </div>

        {errors.tipo && <div className="seg-error">{errors.tipo}</div>}
      </div>

      {tipo === "gomme" && (
        <div className="seg-section">
          <div className="seg-label">Seleziona asse / posizione</div>

          <div className="seg-grid">
            {gommeOptions.map((p) => (
              <button
                key={p}
                className={`seg-chip ${posizioneGomma === p ? "active green" : ""} ${errors.posizioneGomma ? "errorBtn" : ""}`}
                onClick={() => setPosizioneGomma(p)}
              >
                {labelPosizione(p)}
              </button>
            ))}
          </div>
          {errors.posizioneGomma && <div className="seg-error">{errors.posizioneGomma}</div>}

          <div className="seg-label" style={{ marginTop: 12 }}>
            Problema gomma
          </div>
          <div className="seg-grid">
            {(["forata", "usurata", "da_controllare", "altro"] as ProblemaGomma[]).map((p) => (
              <button
                key={p}
                className={`seg-chip ${problemaGomma === p ? "active green" : ""} ${errors.problemaGomma ? "errorBtn" : ""}`}
                onClick={() => setProblemaGomma(p)}
              >
                {labelProblemaGomma(p)}
              </button>
            ))}
          </div>
          {errors.problemaGomma && <div className="seg-error">{errors.problemaGomma}</div>}

          <div className="seg-hint">Consigliato: aggiungi una foto (massimo 3).</div>
        </div>
      )}

      <div className="seg-section">
        <div className="seg-label">Foto (opzionale)</div>

        <label className="seg-photoBtn">
          + AGGIUNGI FOTO
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handleAddFoto}
            style={{ display: "none" }}
          />
        </label>

        {fotoUploading && (
          <div style={{ marginTop: 8, fontSize: 12 }}>Caricamento foto in corso...</div>
        )}

        {foto.length > 0 && (
          <div className="seg-photoGrid">
            {foto.map((f) => (
              <div key={f.id} className="seg-photoCard">
                <img src={f.url} alt="foto" className="seg-photoImg" />
                <button className="seg-photoRemove" onClick={() => removeFoto(f.id)}>
                  RIMUOVI
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="seg-section">
        <div className="seg-label">Descrizione</div>
        <textarea
          className={`seg-textarea ${errors.descrizione ? "errorField" : ""}`}
          placeholder={getPlaceholderDescrizione()}
          value={descrizione}
          onChange={(e) => setDescrizione(e.target.value)}
        />
        {errors.descrizione && <div className="seg-error">{errors.descrizione}</div>}
      </div>

      <div className="seg-section">
        <div className="seg-label">Note (opzionale)</div>
        <textarea
          className="seg-textarea"
          placeholder="Note aggiuntive (opzionale)..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="seg-section">
        <div className="seg-label">Data</div>
        <div className="seg-date">{toItDateTime(nowTs)}</div>
      </div>

      <button className="autisti-button seg-save" onClick={handleSave} disabled={loading || fotoUploading}>
        {loading ? "Invio..." : "INVIA SEGNALAZIONE"}
      </button>

      <button className="autisti-button secondary" onClick={() => navigate("/autisti/home")}>
        Indietro
      </button>
    </div>
  );
}

