import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../autisti/autisti.css";
import "../../autisti/Rifornimento.css";
import { getAutistaLocal, getMezzoLocal } from "../../autisti/autistiStorage";
import { formatDateTimeUI } from "../../utils/dateFormat";
import {
  NEXT_AUTISTI_BASE_PATH,
  NEXT_AUTISTI_CLONE_NOTICE_QUERY_PARAM,
} from "./nextAutistiCloneRuntime";
import {
  appendNextAutistiCloneRifornimento,
  type NextAutistiCloneMetodoPagamento,
  type NextAutistiClonePaese,
  type NextAutistiCloneRifornimentoRecord,
  type NextAutistiCloneTipoRifornimento,
} from "./nextAutistiCloneRifornimenti";

function genId() {
  const cryptoApi = globalThis.crypto as Crypto | undefined;
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }

  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function parseDecimal(value: string) {
  const normalized = String(value ?? "").replace(",", ".").trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatKm(value: string) {
  const numeric = value.replace(/\D/g, "");
  return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function buildHomePathWithNotice(noticeCode: string) {
  const params = new URLSearchParams();
  params.set(NEXT_AUTISTI_CLONE_NOTICE_QUERY_PARAM, noticeCode);

  return {
    pathname: `${NEXT_AUTISTI_BASE_PATH}/home`,
    search: `?${params.toString()}`,
  };
}

export default function NextAutistiRifornimentoPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [autista, setAutista] = useState<any>(null);
  const [mezzo, setMezzo] = useState<any>(null);
  const [tipo, setTipo] = useState<NextAutistiCloneTipoRifornimento>("caravate");
  const [metodo, setMetodo] = useState<NextAutistiCloneMetodoPagamento | null>(null);
  const [paese, setPaese] = useState<NextAutistiClonePaese | null>(null);
  const [km, setKm] = useState("");
  const [litri, setLitri] = useState("");
  const [importo, setImporto] = useState("");
  const [note, setNote] = useState("");
  const [targaConfirmed, setTargaConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAlert, setShowAlert] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [currentDate] = useState(() => new Date());

  useEffect(() => {
    const autistaLocale = getAutistaLocal();
    const mezzoLocale = getMezzoLocal();

    if (!autistaLocale?.badge) {
      navigate(`${NEXT_AUTISTI_BASE_PATH}/login`, { replace: true });
      return;
    }

    if (!mezzoLocale?.targaCamion) {
      navigate(`${NEXT_AUTISTI_BASE_PATH}/setup-mezzo`, { replace: true });
      return;
    }

    setAutista(autistaLocale);
    setMezzo(mezzoLocale);
    setTargaConfirmed(false);
  }, [navigate]);

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!targaConfirmed) {
      nextErrors.targa = "Conferma che la targa e corretta";
    }

    if (!km) {
      nextErrors.km = "Inserisci i km";
    }

    if (!litri) {
      nextErrors.litri = "Inserisci i litri";
    } else {
      const litriValue = parseDecimal(litri);
      if (!litriValue || litriValue <= 0) {
        nextErrors.litri = "Litri non validi";
      }
    }

    if (tipo === "distributore") {
      if (!metodo) {
        nextErrors.metodo = "Seleziona pagamento";
      }

      if (!paese) {
        nextErrors.paese = "Seleziona paese";
      }

      if (metodo === "contanti" && !importo) {
        nextErrors.importo = "Inserisci importo";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function saveCore(forceConfirm: boolean) {
    if (!validate()) {
      return;
    }

    const kmValue = Number(km.replace(/\./g, ""));
    const litriValue = parseDecimal(litri);

    if (!litriValue) {
      setErrors((current) => ({ ...current, litri: "Litri non validi" }));
      return;
    }

    if (!forceConfirm) {
      if (litriValue > 1000) {
        setShowAlert("Quantita carburante molto alta. Confermi?");
        return;
      }

      if (kmValue < 1000) {
        setShowAlert("I km inseriti sembrano bassi. Confermi?");
        return;
      }
    }

    setLoading(true);
    setSaveError(null);

    const record: NextAutistiCloneRifornimentoRecord = {
      id: genId(),
      autistaId: autista?.id ? String(autista.id) : null,
      autistaNome: autista?.nome ? String(autista.nome) : null,
      badgeAutista: autista?.badge ? String(autista.badge) : null,
      targaCamion: mezzo?.targaCamion ? String(mezzo.targaCamion).toUpperCase().trim() : null,
      targaRimorchio: mezzo?.targaRimorchio ? String(mezzo.targaRimorchio).toUpperCase().trim() : null,
      tipo,
      metodoPagamento: tipo === "distributore" ? metodo : null,
      paese: tipo === "distributore" ? paese : null,
      km: kmValue,
      litri: litriValue,
      importo: metodo === "contanti" ? parseDecimal(importo) : null,
      note: note.trim() ? note.trim() : null,
      data: Date.now(),
      flagVerifica: forceConfirm,
      confermatoAutista: true,
      source: "next-clone",
      syncState: "local-only",
    };

    try {
      appendNextAutistiCloneRifornimento(record);
      navigate(buildHomePathWithNotice("rifornimento-locale"), { replace: true });
    } catch {
      setSaveError("Errore salvataggio rifornimento nel clone");
      setLoading(false);
    }
  }

  function handleSave() {
    void saveCore(false);
  }

  if (!autista || !mezzo) {
    return null;
  }

  const targaCamionLabel = String(mezzo?.targaCamion ?? "-").toUpperCase().trim();

  return (
    <div className="autisti-container rifornimento-container">
      <h1 className="autisti-title">Rifornimento</h1>
      <p className="autisti-subtitle">
        Compilazione clone-safe: il salvataggio resta locale a <code>/next/autisti</code> e non aggiorna la madre.
      </p>

      <div className="rf-section rf-targa-section">
        <div className="rf-targa-label">Targa mezzo</div>
        <div className="rf-targa-value">{targaCamionLabel}</div>

        <label className="rf-check">
          <input
            type="checkbox"
            checked={targaConfirmed}
            onChange={(event) => {
              setTargaConfirmed(event.target.checked);
              if (event.target.checked) {
                setErrors((current) => {
                  if (!current.targa) {
                    return current;
                  }

                  const { targa: _ignored, ...rest } = current;
                  return rest;
                });
              }
            }}
          />
          <span>Confermo che la targa e corretta</span>
        </label>
        {errors.targa ? <div className="rf-error">{errors.targa}</div> : null}

        <button
          type="button"
          className="rf-change-mezzo"
          onClick={() => navigate(`${NEXT_AUTISTI_BASE_PATH}/cambio-mezzo`)}
        >
          Targa errata? Cambia mezzo
        </button>
      </div>

      {showAlert ? (
        <div className="rf-alert">
          <p>{showAlert}</p>
          <button
            type="button"
            onClick={() => {
              setShowAlert(null);
              void saveCore(true);
            }}
          >
            Conferma
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAlert(null);
            }}
          >
            Modifica
          </button>
        </div>
      ) : null}

      {saveError ? (
        <div className="rf-alert">
          <p>{saveError}</p>
        </div>
      ) : null}

      <div className="rf-section">
        <div className="rf-toggle">
          <button
            type="button"
            className={tipo === "caravate" ? "active green" : ""}
            onClick={() => {
              setTipo("caravate");
              setMetodo(null);
              setPaese(null);
            }}
          >
            CARAVATE
          </button>
          <button
            type="button"
            className={tipo === "distributore" ? "active green" : ""}
            onClick={() => setTipo("distributore")}
          >
            DISTRIBUTORE
          </button>
        </div>
      </div>

      <div className="rf-section">
        <input
          placeholder="Km attuali"
          inputMode="decimal"
          pattern="[0-9]*[.,]?[0-9]*"
          value={formatKm(km)}
          onChange={(event) => setKm(event.target.value)}
          className={errors.km ? "error" : ""}
        />
        {errors.km ? <div className="rf-error">{errors.km}</div> : null}

        <input
          type="number"
          inputMode="decimal"
          pattern="[0-9]*[.,]?[0-9]*"
          step="0.01"
          placeholder="Litri riforniti"
          value={litri}
          onChange={(event) => setLitri(event.target.value)}
          className={errors.litri ? "error" : ""}
        />
        {errors.litri ? <div className="rf-error">{errors.litri}</div> : null}

        <div className="rf-date">Data: {formatDateTimeUI(currentDate)}</div>
      </div>

      {tipo === "distributore" ? (
        <div className="rf-section">
          <div className="rf-toggle small">
            {(["piccadilly", "eni", "contanti"] as const).map((metodoPagamento) => (
              <button
                key={metodoPagamento}
                type="button"
                className={metodo === metodoPagamento ? "active green" : ""}
                onClick={() => setMetodo(metodoPagamento)}
              >
                {metodoPagamento.toUpperCase()}
              </button>
            ))}
          </div>
          {errors.metodo ? <div className="rf-error">{errors.metodo}</div> : null}

          <div className="rf-toggle small">
            <button
              type="button"
              className={paese === "IT" ? "active green" : ""}
              onClick={() => setPaese("IT")}
            >
              ITALIA
            </button>
            <button
              type="button"
              className={paese === "CH" ? "active green" : ""}
              onClick={() => setPaese("CH")}
            >
              SVIZZERA
            </button>
          </div>
          {errors.paese ? <div className="rf-error">{errors.paese}</div> : null}

          {metodo === "contanti" ? (
            <>
              <input
                type="number"
                placeholder="Importo pagato EUR"
                value={importo}
                onChange={(event) => setImporto(event.target.value)}
                className={errors.importo ? "error" : ""}
              />
              {errors.importo ? <div className="rf-error">{errors.importo}</div> : null}
            </>
          ) : null}
        </div>
      ) : null}

      <div className="rf-section">
        <textarea
          placeholder="Note (opzionale)"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>

      <button
        type="button"
        className="autisti-button"
        onClick={handleSave}
        disabled={loading || !targaConfirmed}
      >
        {loading ? "Salvataggio..." : "Salva rifornimento"}
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
