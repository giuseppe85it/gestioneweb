import { useEffect, useMemo, useState } from "react";
import { getAutistaLocal, getMezzoLocal } from "./autistiStorage";
import { getItemSync, setItemSync } from "../utils/storageSync";
import ModalGomme, { type CambioGommeData } from "../pages/ModalGomme";
import { wheelGeom } from "../components/wheels";

type TargetType = "motrice" | "rimorchio";
type ModeType = "cambio" | "rotazione";
type TipoIntervento = "sostituzione" | "riparazione";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

type MezzoRecord = {
  targa?: string | null;
  targaCamion?: string | null;
  targaMotrice?: string | null;
  targaRimorchio?: string | null;
  categoria?: string | null;
  categoriaMezzo?: string | null;
  tipoMezzo?: string | null;
  tipo?: string | null;
};

type AsseConfig = { id: string; label: string; wheelsCount: number };
type ConfigGomme = { tipoLabel: string; assi: AsseConfig[] };

const KEY_GOMME_TMP = "@cambi_gomme_autisti_tmp";

function normalizeTarga(value?: string | null) {
  return value ? String(value).toUpperCase().replace(/\s+/g, "").trim() : "";
}

function buildConfig(categoria?: string): ConfigGomme {
  const cat = (categoria || "").toLowerCase();
  let config: ConfigGomme = { tipoLabel: categoria || "Mezzo", assi: [] };

  if (cat.includes("trattore")) {
    config = {
      tipoLabel: "Trattore",
      assi: [
        { id: "anteriore", label: "Anteriore", wheelsCount: 2 },
        { id: "posteriore", label: "Posteriore", wheelsCount: 4 },
      ],
    };
  } else if (cat.includes("motrice 4")) {
    config = {
      tipoLabel: "Motrice 4 assi",
      assi: [
        { id: "anteriore", label: "Anteriore", wheelsCount: 2 },
        { id: "asse1", label: "1 asse", wheelsCount: 2 },
        { id: "asse2", label: "2 asse", wheelsCount: 4 },
        { id: "asse3", label: "3 asse", wheelsCount: 4 },
      ],
    };
  } else if (cat.includes("motrice 3")) {
    config = {
      tipoLabel: "Motrice 3 assi",
      assi: [
        { id: "anteriore", label: "Anteriore", wheelsCount: 2 },
        { id: "asse1", label: "1 asse", wheelsCount: 4 },
        { id: "asse2", label: "2 asse", wheelsCount: 2 },
      ],
    };
  } else if (cat.includes("motrice 2")) {
    config = {
      tipoLabel: "Motrice 2 assi",
      assi: [
        { id: "anteriore", label: "Anteriore", wheelsCount: 2 },
        { id: "asse1", label: "1 asse", wheelsCount: 4 },
      ],
    };
  } else if (cat.includes("biga")) {
    config = {
      tipoLabel: "Rimorchio 2 assi",
      assi: [
        { id: "asse1", label: "1 asse", wheelsCount: 4 },
        { id: "asse2", label: "2 asse", wheelsCount: 4 },
      ],
    };
  } else if (
    cat.includes("rimorchio") ||
    cat.includes("pianale") ||
    cat.includes("centina") ||
    cat.includes("vasca")
  ) {
    config = {
      tipoLabel: "Rimorchio 3 assi",
      assi: [
        { id: "asse1", label: "1 asse", wheelsCount: 4 },
        { id: "asse2", label: "2 asse", wheelsCount: 4 },
        { id: "asse3", label: "3 asse", wheelsCount: 4 },
      ],
    };
  }

  return config;
}

type WheelGeomKey = keyof typeof wheelGeom;

function resolveWheelGeomKey(categoria?: string): WheelGeomKey | undefined {
  const cat = (categoria || "").toLowerCase();
  if (!cat) return undefined;
  if (cat.includes("motrice 4")) return "motrice4assi";
  if (cat.includes("motrice 3")) return "motrice3assi";
  if (cat.includes("motrice 2")) return "motrice2assi";
  if (cat.includes("biga")) return "biga";
  if (cat.includes("pianale")) return "pianale";
  if (cat.includes("vasca")) return "vasca";
  if (cat.includes("centina")) return "centina";
  if (cat.includes("semirimorchio") && cat.includes("sterz"))
    return "semirimorchioSterzante";
  if (cat.includes("semirimorchio")) return "semirimorchioFissi";
  if (cat.includes("trattore")) return "trattore";
  return undefined;
}

function buildAssiRotationOptions(categoria?: string) {
  const config = buildConfig(categoria);
  const assiNumerati = config.assi.filter((a) => a.id.startsWith("asse"));
  const n = assiNumerati.length;
  if (n === 2) return ["1<->2"];
  if (n === 3) return ["1->2,2->3,3->1"];
  if (n === 4) return ["1->2,2->3,3->4,4->1"];
  return [];
}

function genId() {
  const c: any = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function GommeAutistaModal({ open, onClose, onSaved }: Props) {
  const [targetType, setTargetType] = useState<TargetType>("motrice");
  const [mode, setMode] = useState<ModeType>("cambio");
  const [tipoIntervento, setTipoIntervento] = useState<TipoIntervento>(
    "sostituzione"
  );
  const [km, setKm] = useState("");
  const [gommeData, setGommeData] = useState<CambioGommeData | null>(null);
  const [gommeOpen, setGommeOpen] = useState(false);
  const [rotazioneSchema, setRotazioneSchema] = useState("");
  const [rotazioneText, setRotazioneText] = useState("");
  const [mezzoLocal, setMezzoLocal] = useState<any>(null);
  const [autistaLocal, setAutistaLocal] = useState<any>(null);
  const [mezziList, setMezziList] = useState<MezzoRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMezzoLocal(getMezzoLocal());
    setAutistaLocal(getAutistaLocal());
    (async () => {
      const raw = await getItemSync("@mezzi_aziendali");
      const list = Array.isArray(raw)
        ? raw
        : raw?.value && Array.isArray(raw.value)
        ? raw.value
        : [];
      setMezziList(list);
    })();
  }, [open]);

  const mezziByTarga = useMemo(() => {
    const map = new Map<string, MezzoRecord>();
    mezziList.forEach((m) => {
      const targa = normalizeTarga(
        m?.targa ?? m?.targaCamion ?? m?.targaMotrice ?? m?.targaRimorchio ?? ""
      );
      if (targa) map.set(targa, m);
    });
    return map;
  }, [mezziList]);

  const targetTargaRaw =
    targetType === "motrice"
      ? mezzoLocal?.targaCamion ?? mezzoLocal?.targaMotrice ?? null
      : mezzoLocal?.targaRimorchio ?? null;
  const targetTarga = normalizeTarga(targetTargaRaw);

  const categoria = useMemo(() => {
    if (!targetTarga) return "";
    const m = mezziByTarga.get(targetTarga);
    const value =
      m?.categoria ?? m?.categoriaMezzo ?? m?.tipoMezzo ?? m?.tipo ?? null;
    return value ? String(value) : "";
  }, [mezziByTarga, targetTarga]);

  const geomKey = useMemo(() => resolveWheelGeomKey(categoria), [categoria]);
  const rotazioneOptions = useMemo(
    () => buildAssiRotationOptions(categoria),
    [categoria]
  );

  useEffect(() => {
    setGommeData(null);
    setRotazioneSchema("");
    setRotazioneText("");
  }, [targetType, categoria, mode]);

  if (!open) return null;

  const kmNum = Number(km);
  const kmValid = Number.isFinite(kmNum) && kmNum > 0;
  const targetOk = !!targetTarga;
  const categoriaOk = !!categoria && !!geomKey;
  const cambioOk =
    mode === "cambio" &&
    !!gommeData &&
    Array.isArray(gommeData.gommeIds) &&
    gommeData.gommeIds.length > 0;
  const rotazioneOk =
    mode === "rotazione" &&
    (!!rotazioneSchema || rotazioneText.trim().length > 2);
  const canSave = targetOk && categoriaOk && kmValid && (cambioOk || rotazioneOk);

  async function handleSave() {
    if (!canSave) {
      setError("Compila i campi obbligatori.");
      return;
    }
    const record: any = {
      id: genId(),
      targetType,
      targetTarga,
      categoria,
      km: kmNum,
      data: Date.now(),
      tipo: mode === "cambio" ? tipoIntervento : "rotazione",
      gommeIds: mode === "cambio" ? gommeData?.gommeIds ?? [] : [],
      asseId: mode === "cambio" ? gommeData?.asseId ?? null : null,
      asseLabel: mode === "cambio" ? gommeData?.asseLabel ?? null : null,
      rotazioneSchema: mode === "rotazione" ? rotazioneSchema || null : null,
      rotazioneText: mode === "rotazione" ? rotazioneText.trim() || null : null,
      autista: {
        id: autistaLocal?.id ?? null,
        nome: autistaLocal?.nome ?? null,
        badge: autistaLocal?.badge ?? null,
      },
      contesto: {
        targaCamion: mezzoLocal?.targaCamion ?? null,
        targaRimorchio: mezzoLocal?.targaRimorchio ?? null,
      },
      stato: "nuovo",
      letta: false,
    };
    const raw = await getItemSync(KEY_GOMME_TMP);
    const list = Array.isArray(raw)
      ? raw
      : raw?.value && Array.isArray(raw.value)
      ? raw.value
      : [];
    await setItemSync(KEY_GOMME_TMP, [record, ...list]);
    setError(null);
    setGommeData(null);
    setRotazioneSchema("");
    setRotazioneText("");
    onSaved?.();
    onClose();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: "min(92vw, 520px)",
          background: "#fff",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>Gomme</h3>
          <button type="button" onClick={onClose}>
            Chiudi
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Target</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setTargetType("motrice")}
              style={{
                flex: 1,
                padding: "10px 12px",
                background: targetType === "motrice" ? "#2e7d32" : "#f1f1f1",
                color: targetType === "motrice" ? "#fff" : "#222",
                border: "1px solid #ddd",
                borderRadius: 8,
              }}
            >
              MOTRICE
            </button>
            <button
              type="button"
              onClick={() => setTargetType("rimorchio")}
              style={{
                flex: 1,
                padding: "10px 12px",
                background: targetType === "rimorchio" ? "#2e7d32" : "#f1f1f1",
                color: targetType === "rimorchio" ? "#fff" : "#222",
                border: "1px solid #ddd",
                borderRadius: 8,
              }}
            >
              RIMORCHIO
            </button>
          </div>
          <div style={{ marginTop: 6, fontSize: 13 }}>
            Targa: <strong>{targetTargaRaw ?? "-"}</strong>
          </div>
          {!targetOk ? (
            <div style={{ color: "#d32f2f", fontSize: 13, marginTop: 4 }}>
              Targa mancante per questo target.
            </div>
          ) : null}
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Categoria</div>
          <div>{categoria || "-"}</div>
          {!categoriaOk ? (
            <div style={{ color: "#d32f2f", fontSize: 13, marginTop: 4 }}>
              Categoria mancante per questa targa.
            </div>
          ) : null}
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Modalita</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setMode("cambio")}
              style={{
                flex: 1,
                padding: "10px 12px",
                background: mode === "cambio" ? "#2e7d32" : "#f1f1f1",
                color: mode === "cambio" ? "#fff" : "#222",
                border: "1px solid #ddd",
                borderRadius: 8,
              }}
            >
              CAMBIO
            </button>
            <button
              type="button"
              onClick={() => setMode("rotazione")}
              style={{
                flex: 1,
                padding: "10px 12px",
                background: mode === "rotazione" ? "#2e7d32" : "#f1f1f1",
                color: mode === "rotazione" ? "#fff" : "#222",
                border: "1px solid #ddd",
                borderRadius: 8,
              }}
            >
              ROTAZIONE
            </button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>KM</div>
          <input
            type="number"
            value={km}
            onChange={(e) => setKm(e.target.value)}
            placeholder="Inserisci km"
            style={{ width: "100%", padding: "8px 10px", borderRadius: 6 }}
          />
        </div>

        {mode === "cambio" ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              Tipo intervento
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setTipoIntervento("sostituzione")}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  background:
                    tipoIntervento === "sostituzione" ? "#2e7d32" : "#f1f1f1",
                  color:
                    tipoIntervento === "sostituzione" ? "#fff" : "#222",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              >
                SOSTITUZIONE
              </button>
              <button
                type="button"
                onClick={() => setTipoIntervento("riparazione")}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  background:
                    tipoIntervento === "riparazione" ? "#2e7d32" : "#f1f1f1",
                  color: tipoIntervento === "riparazione" ? "#fff" : "#222",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              >
                RIPARAZIONE
              </button>
            </div>
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setGommeOpen(true)}
                disabled={!targetOk || !categoriaOk}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "#1976d2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  opacity: !targetOk || !categoriaOk ? 0.6 : 1,
                }}
              >
                Seleziona gomme
              </button>
              {gommeData?.gommeIds?.length ? (
                <div style={{ marginTop: 6, fontSize: 13 }}>
                  Gomme selezionate: {gommeData.gommeIds.length}
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              Rotazione assi
            </div>
            {rotazioneOptions.length > 0 ? (
              <select
                value={rotazioneSchema}
                onChange={(e) => setRotazioneSchema(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6 }}
              >
                <option value="">Seleziona schema</option>
                {rotazioneOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <textarea
                value={rotazioneText}
                onChange={(e) => setRotazioneText(e.target.value)}
                placeholder="Descrivi la rotazione (es: invertito posteriore dx/sx)"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6 }}
              />
            )}
          </div>
        )}

        {error ? (
          <div style={{ color: "#d32f2f", marginTop: 10 }}>{error}</div>
        ) : null}

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button type="button" onClick={onClose} style={{ flex: 1 }}>
            Annulla
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            style={{
              flex: 1,
              background: "#2e7d32",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 12px",
              opacity: canSave ? 1 : 0.6,
            }}
          >
            Salva
          </button>
        </div>
      </div>

      <ModalGomme
        open={gommeOpen}
        targa={String(targetTargaRaw ?? "")}
        categoria={categoria}
        kmIniziale={km}
        enableCalibration={false}
        onClose={() => setGommeOpen(false)}
        onConfirm={(data) => {
          setGommeData(data);
          setGommeOpen(false);
        }}
      />
    </div>
  );
}
