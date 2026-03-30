/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import "../../autisti/autisti.css";
import "../../autisti/Segnalazioni.css";
import { getAutistaLocal, getMezzoLocal } from "./nextAutistiSessionStorage";
import { getItemSync } from "./nextAutistiStorageSync";
import {
  createNextAutistiCloneAttachmentFromFile,
  type NextAutistiCloneAttachment,
} from "./nextAutistiCloneAttachments";
import {
  NEXT_AUTISTI_BASE_PATH,
  NEXT_AUTISTI_CLONE_NOTICE_QUERY_PARAM,
} from "./nextAutistiCloneRuntime";
import {
  appendNextAutistiCloneSegnalazione,
  type NextAutistiClonePosizioneGomma,
  type NextAutistiCloneProblemaGomma,
  type NextAutistiCloneSegnalazioneAmbito,
  type NextAutistiCloneSegnalazioneRecord,
  type NextAutistiCloneSegnalazioneTipoProblema,
} from "./nextAutistiCloneSegnalazioni";

type MezzoAziendale = {
  id: string;
  targa: string;
  categoria?: string | null;
};

type MezzoAttivoLocal = {
  targaCamion: string | null;
  targaRimorchio: string | null;
  timestamp?: number;
};

const KEY_MEZZI = "@mezzi_aziendali";

function genId() {
  const cryptoApi = globalThis.crypto as Crypto | undefined;
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }

  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function toItDateTime(ts: number) {
  const date = new Date(ts);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${dd} ${mm} ${yyyy} - ${hh}:${mi}`;
}

function normalizeCategoria(cat?: string | null) {
  return (cat || "").toLowerCase().trim();
}

function getGommeOptions(
  ambito: NextAutistiCloneSegnalazioneAmbito | null,
  categoriaMezzo?: string | null,
): NextAutistiClonePosizioneGomma[] {
  const categoria = normalizeCategoria(categoriaMezzo);

  if (!ambito) {
    return [];
  }

  if (ambito === "motrice") {
    if (categoria.includes("motrice 4 assi")) {
      return ["anteriore", "asse1", "asse2", "asse3"];
    }
    if (categoria.includes("motrice 3 assi")) {
      return ["anteriore", "asse1", "asse2"];
    }
    if (categoria.includes("trattore")) {
      return ["anteriore", "posteriore"];
    }
    return ["anteriore", "posteriore"];
  }

  if (categoria.includes("semirimorchio")) {
    return ["asse1", "asse2", "asse3"];
  }
  if (categoria.includes("biga")) {
    return ["asse1", "asse2"];
  }
  return ["asse1", "asse2"];
}

function labelPosizione(posizione: NextAutistiClonePosizioneGomma) {
  switch (posizione) {
    case "anteriore":
      return "ANTERIORE";
    case "posteriore":
      return "POSTERIORE";
    case "asse1":
      return "ASSE 1";
    case "asse2":
      return "ASSE 2";
    default:
      return "ASSE 3";
  }
}

function labelTipo(tipo: NextAutistiCloneSegnalazioneTipoProblema) {
  switch (tipo) {
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
    default:
      return "ALTRO";
  }
}

function labelProblemaGomma(problema: NextAutistiCloneProblemaGomma) {
  switch (problema) {
    case "forata":
      return "FORATA";
    case "usurata":
      return "USURATA";
    case "da_controllare":
      return "DA CONTROLLARE";
    default:
      return "ALTRO";
  }
}

function buildHomePathWithNotice(noticeCode: string) {
  const params = new URLSearchParams();
  params.set(NEXT_AUTISTI_CLONE_NOTICE_QUERY_PARAM, noticeCode);

  return {
    pathname: `${NEXT_AUTISTI_BASE_PATH}/home`,
    search: `?${params.toString()}`,
  };
}

function extractMezziAziendali(raw: unknown): MezzoAziendale[] {
  if (Array.isArray(raw)) {
    return raw as MezzoAziendale[];
  }

  if (!raw || typeof raw !== "object") {
    return [];
  }

  const source = raw as Record<string, unknown>;
  if (Array.isArray(source.items)) {
    return source.items as MezzoAziendale[];
  }

  const value = source.value;
  if (value && typeof value === "object") {
    const nested = value as Record<string, unknown>;
    if (Array.isArray(nested.items)) {
      return nested.items as MezzoAziendale[];
    }
    const deepValue = nested.value;
    if (deepValue && typeof deepValue === "object") {
      const deep = deepValue as Record<string, unknown>;
      if (Array.isArray(deep.items)) {
        return deep.items as MezzoAziendale[];
      }
    }
  }

  return [];
}

export default function NextAutistiSegnalazioniPage() {
  const navigate = useNavigate();
  const nowTs = useMemo(() => Date.now(), []);

  const [loading, setLoading] = useState(false);
  const [autista, setAutista] = useState<any>(null);
  const [mezzoAttivo, setMezzoAttivo] = useState<MezzoAttivoLocal | null>(null);
  const [mezziAziendali, setMezziAziendali] = useState<MezzoAziendale[]>([]);
  const [ambito, setAmbito] = useState<NextAutistiCloneSegnalazioneAmbito | null>(null);
  const [tipo, setTipo] = useState<NextAutistiCloneSegnalazioneTipoProblema | null>(null);
  const [posizioneGomma, setPosizioneGomma] = useState<NextAutistiClonePosizioneGomma | null>(
    null,
  );
  const [problemaGomma, setProblemaGomma] =
    useState<NextAutistiCloneProblemaGomma | null>(null);
  const [descrizione, setDescrizione] = useState("");
  const [note, setNote] = useState("");
  const [foto, setFoto] = useState<NextAutistiCloneAttachment[]>([]);
  const [fotoPreparing, setFotoPreparing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const autistaLocale = getAutistaLocal();
      const mezzoLocale = getMezzoLocal();
      const mezziRaw = await getItemSync(KEY_MEZZI);

      if (!autistaLocale?.badge) {
        navigate(`${NEXT_AUTISTI_BASE_PATH}/login`, { replace: true });
        return;
      }
      if (!mezzoLocale?.targaCamion) {
        navigate(`${NEXT_AUTISTI_BASE_PATH}/setup-mezzo`, { replace: true });
        return;
      }

      setAutista(autistaLocale);
      setMezzoAttivo(mezzoLocale as MezzoAttivoLocal);
      setMezziAziendali(extractMezziAziendali(mezziRaw));
    })();
  }, [navigate]);

  function findMezzoByTarga(targa?: string | null) {
    if (!targa) {
      return null;
    }

    return (
      mezziAziendali.find(
        (mezzo) => (mezzo.targa || "").toUpperCase() === String(targa).toUpperCase(),
      ) || null
    );
  }

  const targaMotrice = mezzoAttivo?.targaCamion ?? null;
  const targaRimorchio = mezzoAttivo?.targaRimorchio ?? null;

  const mezzoMotrice = useMemo(
    () => findMezzoByTarga(targaMotrice),
    [mezziAziendali, targaMotrice],
  );
  const mezzoRimorchio = useMemo(
    () => findMezzoByTarga(targaRimorchio),
    [mezziAziendali, targaRimorchio],
  );

  const categoriaSelezionata = useMemo(() => {
    if (!ambito) {
      return null;
    }

    return ambito === "motrice"
      ? mezzoMotrice?.categoria ?? null
      : mezzoRimorchio?.categoria ?? null;
  }, [ambito, mezzoMotrice?.categoria, mezzoRimorchio?.categoria]);

  const gommeOptions = useMemo(
    () => getGommeOptions(ambito, categoriaSelezionata),
    [ambito, categoriaSelezionata],
  );

  function resetGomme() {
    setPosizioneGomma(null);
    setProblemaGomma(null);
  }

  function resetByAmbito(nextAmbito: NextAutistiCloneSegnalazioneAmbito) {
    if (nextAmbito === "rimorchio" && !targaRimorchio) {
      setAlertMsg("Nessun rimorchio agganciato. Seleziona MOTRICE.");
      setErrors({ ambito: "Nessun rimorchio agganciato" });
      return;
    }

    setAmbito(nextAmbito);
    setTipo(null);
    resetGomme();
    setErrors({});
    setAlertMsg(null);
  }

  function resetByTipo(nextTipo: NextAutistiCloneSegnalazioneTipoProblema) {
    setTipo(nextTipo);
    setErrors({});
    setAlertMsg(null);
    if (nextTipo !== "gomme") {
      resetGomme();
    }
  }

  function getPlaceholderDescrizione() {
    if (tipo === "motore") {
      return "Es. rumore anomalo, perdita olio, spia accesa...";
    }
    if (tipo === "gomme") {
      return "Es. gomma asse 2 molto consumata, vibra, perde aria...";
    }
    if (tipo === "freni") {
      return "Es. frena male, rumore, spia, aria...";
    }
    if (tipo === "idraulico") {
      return "Es. perdita olio, pistone, tubo, pressione...";
    }
    if (tipo === "elettrico") {
      return "Es. luci non funzionano, batteria, spie...";
    }
    return "Descrivi il problema in poche parole...";
  }

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!ambito) {
      nextErrors.ambito = "Seleziona MOTRICE o RIMORCHIO";
    }
    if (ambito === "rimorchio" && !targaRimorchio) {
      nextErrors.ambito = "Nessun rimorchio agganciato";
    }
    if (!tipo) {
      nextErrors.tipo = "Seleziona il tipo problema";
    }
    if (!descrizione.trim()) {
      nextErrors.descrizione = "Scrivi una descrizione";
    }

    if (tipo === "gomme") {
      if (!posizioneGomma) {
        nextErrors.posizioneGomma = "Seleziona asse/posizione";
      }
      if (!problemaGomma) {
        nextErrors.problemaGomma = "Seleziona il problema gomma";
      }
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setAlertMsg(`Manca: ${Object.values(nextErrors).join(" - ")}`);
      return false;
    }

    setAlertMsg(null);
    return true;
  }

  async function handleAddFoto(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const remaining = 3 - foto.length;
    if (remaining <= 0) {
      setAlertMsg("Hai gia inserito 3 foto (massimo).");
      event.target.value = "";
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remaining);
    setAlertMsg(null);
    setFotoPreparing(true);

    try {
      const prepared = await Promise.all(
        selectedFiles.map((file) => createNextAutistiCloneAttachmentFromFile(file)),
      );
      setFoto((current) => [...current, ...prepared]);
    } catch {
      setAlertMsg("Errore nella preparazione foto locale.");
    } finally {
      setFotoPreparing(false);
      event.target.value = "";
    }
  }

  function removeFoto(id: string) {
    setFoto((current) => current.filter((item) => item.id !== id));
  }

  async function handleSave() {
    if (fotoPreparing) {
      setAlertMsg("Attendi la preparazione delle foto.");
      return;
    }
    if (!validate()) {
      return;
    }

    setLoading(true);

    const isMotrice = ambito === "motrice";
    const targaSelezionata = isMotrice ? targaMotrice : targaRimorchio;
    const mezzoRef = isMotrice ? mezzoMotrice : mezzoRimorchio;

    const record: NextAutistiCloneSegnalazioneRecord = {
      id: genId(),
      ambito: ambito as NextAutistiCloneSegnalazioneAmbito,
      mezzoId: mezzoRef?.id || null,
      targa: targaSelezionata || null,
      categoriaMezzo: mezzoRef?.categoria || null,
      targaCamion: targaMotrice || null,
      targaRimorchio: targaRimorchio || null,
      autistaId: autista?.id ? String(autista.id) : null,
      autistaNome: autista?.nome ? String(autista.nome) : null,
      badgeAutista: autista?.badge ? String(autista.badge) : null,
      tipoProblema: tipo as NextAutistiCloneSegnalazioneTipoProblema,
      posizioneGomma: tipo === "gomme" ? posizioneGomma : null,
      problemaGomma: tipo === "gomme" ? problemaGomma : null,
      descrizione: descrizione.trim(),
      note: note.trim() || null,
      fotoUrls: foto.map((item) => item.previewUrl),
      fotoStoragePaths: [],
      attachments: foto,
      data: nowTs,
      stato: "nuova",
      letta: false,
      flagVerifica: false,
      motivoVerifica: null,
      source: "next-clone",
      syncState: "local-only",
    };

    try {
      appendNextAutistiCloneSegnalazione(record);
      setFoto([]);
      navigate(buildHomePathWithNotice("segnalazioni-locale"), { replace: true });
    } catch {
      setLoading(false);
      setAlertMsg("Errore salvataggio. Riprova.");
    }
  }

  if (!autista || !mezzoAttivo) {
    return null;
  }

  return (
    <div className="autisti-container seg-container">
      <h1 className="autisti-title">Segnalazione manutenzione</h1>

      <div className="seg-subtitle">
        {targaMotrice ? `Motrice: ${targaMotrice}` : "Motrice: -"}{" "}
        {targaRimorchio ? `- Rimorchio: ${targaRimorchio}` : "- Rimorchio: -"}{" "}
        {autista?.nome ? `- Autista: ${autista.nome}` : ""}
      </div>

      <p className="autisti-subtitle">
        Segnalazione e foto restano locali al clone: nessun upload, nessun side effect anticipato e nessuna sincronizzazione sulla madre.
      </p>

      {alertMsg ? <div className="seg-alert">{alertMsg}</div> : null}

      <div className="seg-section">
        <div className="seg-label">Dove e il problema</div>
        <div className="seg-toggle">
          <button
            type="button"
            className={ambito === "motrice" ? "active green" : errors.ambito ? "errorBtn" : ""}
            onClick={() => resetByAmbito("motrice")}
          >
            MOTRICE
          </button>
          <button
            type="button"
            className={
              ambito === "rimorchio" ? "active green" : errors.ambito ? "errorBtn" : ""
            }
            onClick={() => resetByAmbito("rimorchio")}
            disabled={!targaRimorchio}
            title={!targaRimorchio ? "Nessun rimorchio agganciato" : ""}
          >
            RIMORCHIO
          </button>
        </div>
        {errors.ambito ? <div className="seg-error">{errors.ambito}</div> : null}
      </div>

      <div className="seg-section">
        <div className="seg-label">Tipo problema</div>
        <div className="seg-grid">
          {(
            ["motore", "freni", "gomme", "idraulico", "elettrico", "altro"] as const
          ).map((item) => (
            <button
              key={item}
              type="button"
              className={`seg-chip ${tipo === item ? "active green" : ""} ${
                errors.tipo ? "errorBtn" : ""
              }`}
              onClick={() => resetByTipo(item)}
            >
              {labelTipo(item)}
            </button>
          ))}
        </div>
        {errors.tipo ? <div className="seg-error">{errors.tipo}</div> : null}
      </div>

      {tipo === "gomme" ? (
        <div className="seg-section">
          <div className="seg-label">Seleziona asse / posizione</div>

          <div className="seg-grid">
            {gommeOptions.map((item) => (
              <button
                key={item}
                type="button"
                className={`seg-chip ${posizioneGomma === item ? "active green" : ""} ${
                  errors.posizioneGomma ? "errorBtn" : ""
                }`}
                onClick={() => setPosizioneGomma(item)}
              >
                {labelPosizione(item)}
              </button>
            ))}
          </div>
          {errors.posizioneGomma ? <div className="seg-error">{errors.posizioneGomma}</div> : null}

          <div className="seg-label" style={{ marginTop: 12 }}>
            Problema gomma
          </div>
          <div className="seg-grid">
            {(["forata", "usurata", "da_controllare", "altro"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={`seg-chip ${problemaGomma === item ? "active green" : ""} ${
                  errors.problemaGomma ? "errorBtn" : ""
                }`}
                onClick={() => setProblemaGomma(item)}
              >
                {labelProblemaGomma(item)}
              </button>
            ))}
          </div>
          {errors.problemaGomma ? <div className="seg-error">{errors.problemaGomma}</div> : null}

          <div className="seg-hint">Consigliato: aggiungi una foto locale (massimo 3).</div>
        </div>
      ) : null}

      <div className="seg-section">
        <div className="seg-label">Foto (opzionale)</div>

        <label className="seg-photoBtn">
          + AGGIUNGI FOTO LOCALE
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handleAddFoto}
            style={{ display: "none" }}
          />
        </label>

        <div className="seg-hint">
          Le immagini restano solo nel clone: viene creata un&apos;anteprima locale e non parte nessun upload.
        </div>

        {fotoPreparing ? (
          <div style={{ marginTop: 8, fontSize: 12 }}>Preparazione foto locale in corso...</div>
        ) : null}

        {foto.length > 0 ? (
          <div className="seg-photoGrid">
            {foto.map((item) => (
              <div key={item.id} className="seg-photoCard">
                <img src={item.previewUrl} alt={item.name} className="seg-photoImg" />
                <button
                  type="button"
                  className="seg-photoRemove"
                  onClick={() => removeFoto(item.id)}
                >
                  RIMUOVI FOTO LOCALE
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="seg-section">
        <div className="seg-label">Descrizione</div>
        <textarea
          className={`seg-textarea ${errors.descrizione ? "errorField" : ""}`}
          placeholder={getPlaceholderDescrizione()}
          value={descrizione}
          onChange={(event) => setDescrizione(event.target.value)}
        />
        {errors.descrizione ? <div className="seg-error">{errors.descrizione}</div> : null}
      </div>

      <div className="seg-section">
        <div className="seg-label">Note (opzionale)</div>
        <textarea
          className="seg-textarea"
          placeholder="Note aggiuntive (opzionale)..."
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>

      <div className="seg-section">
        <div className="seg-label">Data</div>
        <div className="seg-date">{toItDateTime(nowTs)}</div>
      </div>

      <button
        type="button"
        className="autisti-button seg-save"
        onClick={() => {
          void handleSave();
        }}
        disabled={loading || fotoPreparing}
      >
        {loading ? "Salvataggio locale..." : "SALVA SEGNALAZIONE LOCALE"}
      </button>

      <button
        type="button"
        className="autisti-button secondary"
        onClick={() => navigate(`${NEXT_AUTISTI_BASE_PATH}/home`)}
      >
        Indietro
      </button>
    </div>
  );
}
