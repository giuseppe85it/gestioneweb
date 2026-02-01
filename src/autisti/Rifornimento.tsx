import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./autisti.css";
import "./Rifornimento.css";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { getAutistaLocal, getMezzoLocal } from "../autisti/autistiStorage";
import { formatDateTimeUI, formatDateUI } from "../utils/dateFormat";

type TipoRifornimento = "caravate" | "distributore";
type MetodoPagamento = "piccadilly" | "eni" | "contanti";
type Paese = "IT" | "CH";

const KEY_RIFORNIMENTI = "@rifornimenti_autisti_tmp";
const DOSSIER_RIFORNIMENTI_KEY = "@rifornimenti";

function genId() {
  // compatibile ovunque
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function formatDateString(ts: number) {
  return formatDateUI(ts);
}

function toNumberOrNull(value: any) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildDistributore(record: any) {
  const parts: string[] = [];
  if (record?.tipo) parts.push(String(record.tipo));
  if (record?.paese) parts.push(String(record.paese));
  if (record?.metodoPagamento) parts.push(String(record.metodoPagamento));
  return parts.length ? parts.join(" ") : "-";
}

function buildDossierItem(record: any) {
  const id = String(record?.id ?? "");
  const ts = Number(record?.timestamp ?? record?.data ?? Date.now());
  const mezzoRaw =
    record?.targaCamion ?? record?.targaMotrice ?? record?.mezzoTarga ?? null;
  const mezzoTarga = mezzoRaw ? String(mezzoRaw).toUpperCase().trim() : null;
  return {
    id,
    mezzoTarga,
    data: formatDateString(ts),
    litri: toNumberOrNull(record?.litri),
    km: toNumberOrNull(record?.km),
    distributore: buildDistributore(record),
    costo: toNumberOrNull(record?.importo),
    note: record?.note != null ? String(record.note) : "",
  };
}

export default function Rifornimento() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [autista, setAutista] = useState<any>(null);
  const [mezzo, setMezzo] = useState<any>(null);

  const [tipo, setTipo] = useState<TipoRifornimento>("caravate");
  const [metodo, setMetodo] = useState<MetodoPagamento | null>(null);
  const [paese, setPaese] = useState<Paese | null>(null);

  const [km, setKm] = useState("");
  const [litri, setLitri] = useState("");
  const [importo, setImporto] = useState("");
  const [note, setNote] = useState("");
  const [targaConfirmed, setTargaConfirmed] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAlert, setShowAlert] = useState<string | null>(null);
  const [forceConfirm, setForceConfirm] = useState(false);

  const data = new Date();

  useEffect(() => {
    // SESSIONE SOLO LOCALE
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
    setTargaConfirmed(false);
  }, [navigate]);

  function formatKm(value: string) {
    const n = value.replace(/\D/g, "");
    return n.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function parseDecimal(value: string) {
    const normalized = String(value ?? "")
      .replace(",", ".")
      .trim();
    if (!normalized) return null;
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }

  function validate() {
    const e: Record<string, string> = {};

    if (!targaConfirmed) e.targa = "Conferma che la targa è corretta";
    if (!km) e.km = "Inserisci i km";
    if (!litri) {
      e.litri = "Inserisci i litri";
    } else {
      const litriNum = parseDecimal(litri);
      if (!litriNum || litriNum <= 0) e.litri = "Litri non validi";
    }

    if (tipo === "distributore") {
      if (!metodo) e.metodo = "Seleziona pagamento";
      if (!paese) e.paese = "Seleziona paese";
      if (metodo === "contanti" && !importo) e.importo = "Inserisci importo";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function saveCore(isForced: boolean) {
    if (!validate()) return;

    const kmNum = Number(km.replace(/\./g, ""));
    const litriNum = parseDecimal(litri) ?? NaN;

    if (!isForced) {
      if (litriNum > 1000) {
        setShowAlert("Quantità carburante molto alta. Confermi?");
        return;
      }
      if (kmNum < 1000) {
        setShowAlert("I km inseriti sembrano bassi. Confermi?");
        return;
      }
    }

    setLoading(true);

    const record = {
      id: genId(),

      autistaId: autista?.id || null,
      autistaNome: autista?.nome || null,
      badgeAutista: autista?.badge || null,

      targaCamion: mezzo?.targaCamion || null,
      targaRimorchio: mezzo?.targaRimorchio || null,

      tipo,
      metodoPagamento: tipo === "distributore" ? metodo : null,
      paese: tipo === "distributore" ? paese : null,

      km: kmNum,
      litri: litriNum,
      importo: metodo === "contanti" ? Number(importo) : null,

      note: note || null,

      data: Date.now(),
      flagVerifica: !!showAlert,
      confermatoAutista: true,
    };

    try {
      const current = (await getItemSync(KEY_RIFORNIMENTI)) || [];
      const next = Array.isArray(current) ? [...current, record] : [record];
      await setItemSync(KEY_RIFORNIMENTI, next);

      const dossierRef = doc(db, "storage", DOSSIER_RIFORNIMENTI_KEY);
      const dossierSnap = await getDoc(dossierRef);
      const dossierRaw = dossierSnap.exists() ? dossierSnap.data() : {};
      const dossier =
        dossierRaw && typeof dossierRaw === "object" ? dossierRaw : {};
      const items = Array.isArray(dossier.items)
        ? dossier.items
        : Array.isArray(dossier?.value?.items)
        ? dossier.value.items
        : [];
      const item = buildDossierItem(record);
      const idx = items.findIndex((i: any) => String(i?.id ?? "") === String(item.id));
      const updatedItems =
        idx >= 0
          ? items.map((i: any, index: number) => (index === idx ? item : i))
          : [...items, item];
      await setDoc(dossierRef, { ...dossier, items: updatedItems });

      setLoading(false);
      navigate("/autisti/home");
    } catch {
      setLoading(false);
      setShowAlert("Errore salvataggio rifornimento");
    }
  }

  async function handleSave() {
    await saveCore(forceConfirm);
  }

  if (!autista || !mezzo) return null;
  const targaCamionLabel = String(mezzo?.targaCamion ?? "-")
    .toUpperCase()
    .trim();

  return (
    <div className="autisti-container rifornimento-container">
      <h1 className="autisti-title">Rifornimento</h1>

      <div className="rf-section rf-targa-section">
        <div className="rf-targa-label">Targa mezzo</div>
        <div className="rf-targa-value">{targaCamionLabel}</div>

        <label className="rf-check">
          <input
            type="checkbox"
            checked={targaConfirmed}
            onChange={(e) => {
              setTargaConfirmed(e.target.checked);
              if (e.target.checked) {
                setErrors((prev) => {
                  if (!prev.targa) return prev;
                  const { targa: _targa, ...rest } = prev;
                  return rest;
                });
              }
            }}
          />
          <span>Confermo che la targa è corretta</span>
        </label>
        {errors.targa && <div className="rf-error">{errors.targa}</div>}

        <button
          type="button"
          className="rf-change-mezzo"
          onClick={() => navigate("/autisti/cambio-mezzo")}
        >
          Targa errata? Cambia mezzo
        </button>
      </div>

      {showAlert && (
        <div className="rf-alert">
          <p>{showAlert}</p>
          <button
            onClick={() => {
              setForceConfirm(true);
              setShowAlert(null);
              saveCore(true);
            }}
          >
            Conferma
          </button>
          <button
            onClick={() => {
              setShowAlert(null);
            }}
          >
            Modifica
          </button>
        </div>
      )}

      <div className="rf-section">
        <div className="rf-toggle">
          <button
            className={tipo === "caravate" ? "active green" : ""}
            onClick={() => {
              setTipo("caravate");
              setMetodo(null);
              setPaese(null);
            }}
          >
            CARAVATE
          </button>
          <button className={tipo === "distributore" ? "active green" : ""} onClick={() => setTipo("distributore")}>
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
          onChange={(e) => setKm(e.target.value)}
          className={errors.km ? "error" : ""}
        />
        {errors.km && <div className="rf-error">{errors.km}</div>}

        <input
          type="number"
          inputMode="decimal"
          pattern="[0-9]*[.,]?[0-9]*"
          step="0.01"
          placeholder="Litri riforniti"
          value={litri}
          onChange={(e) => setLitri(e.target.value)}
          className={errors.litri ? "error" : ""}
        />
        {errors.litri && <div className="rf-error">{errors.litri}</div>}

        <div className="rf-date">Data: {formatDateTimeUI(data)}</div>
      </div>

      {tipo === "distributore" && (
        <div className="rf-section">
          <div className="rf-toggle small">
            {["piccadilly", "eni", "contanti"].map((m) => (
              <button
                key={m}
                className={metodo === m ? "active green" : ""}
                onClick={() => setMetodo(m as MetodoPagamento)}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>
          {errors.metodo && <div className="rf-error">{errors.metodo}</div>}

          <div className="rf-toggle small">
            <button className={paese === "IT" ? "active green" : ""} onClick={() => setPaese("IT")}>
              ITALIA
            </button>
            <button className={paese === "CH" ? "active green" : ""} onClick={() => setPaese("CH")}>
              SVIZZERA
            </button>
          </div>
          {errors.paese && <div className="rf-error">{errors.paese}</div>}

          {metodo === "contanti" && (
            <>
              <input
                type="number"
                placeholder="Importo pagato EUR"
                value={importo}
                onChange={(e) => setImporto(e.target.value)}
                className={errors.importo ? "error" : ""}
              />
              {errors.importo && <div className="rf-error">{errors.importo}</div>}
            </>
          )}
        </div>
      )}

      <div className="rf-section">
        <textarea placeholder="Note (opzionale)" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <button className="autisti-button" onClick={handleSave} disabled={loading || !targaConfirmed}>
        {loading ? "Salvataggio..." : "Salva rifornimento"}
      </button>

      <button className="autisti-button secondary" onClick={() => navigate("/autisti/home")}>
        Indietro
      </button>
    </div>
  );
}
