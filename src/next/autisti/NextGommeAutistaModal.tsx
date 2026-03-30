/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { getAutistaLocal, getMezzoLocal } from "./nextAutistiSessionStorage";
import { getItemSync, setItemSync } from "./nextAutistiStorageSync";
import NextModalGomme, { type CambioGommeData } from "./NextModalGomme";

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
type ConfigGomme = { assi: AsseConfig[] };

const KEY_GOMME_TMP = "@cambi_gomme_autisti_tmp";

function normalizeTarga(value?: string | null) {
  return value ? String(value).toUpperCase().replace(/\s+/g, "").trim() : "";
}

function isRotazioneDisabled(categoria?: string) {
  const cat = String(categoria || "").toLowerCase().trim();
  return cat.includes("trattore")
    || cat.includes("motrice 2")
    || cat.includes("motrice 3")
    || cat.includes("motrice 4");
}

function buildConfig(categoria?: string): ConfigGomme {
  const cat = (categoria || "").toLowerCase();

  if (cat.includes("trattore")) {
    return {
      assi: [
        { id: "anteriore", label: "Anteriore", wheelsCount: 2 },
        { id: "posteriore", label: "Posteriore", wheelsCount: 4 },
      ],
    };
  }
  if (cat.includes("motrice 4")) {
    return {
      assi: [
        { id: "anteriore", label: "Anteriore", wheelsCount: 2 },
        { id: "asse1", label: "1 asse", wheelsCount: 2 },
        { id: "asse2", label: "2 asse", wheelsCount: 4 },
        { id: "asse3", label: "3 asse", wheelsCount: 4 },
      ],
    };
  }
  if (cat.includes("motrice 3")) {
    return {
      assi: [
        { id: "anteriore", label: "Anteriore", wheelsCount: 2 },
        { id: "asse1", label: "1 asse", wheelsCount: 4 },
        { id: "asse2", label: "2 asse", wheelsCount: 2 },
      ],
    };
  }
  if (cat.includes("motrice 2")) {
    return {
      assi: [
        { id: "anteriore", label: "Anteriore", wheelsCount: 2 },
        { id: "asse1", label: "1 asse", wheelsCount: 4 },
      ],
    };
  }
  if (cat.includes("biga")) {
    return {
      assi: [
        { id: "asse1", label: "1 asse", wheelsCount: 4 },
        { id: "asse2", label: "2 asse", wheelsCount: 4 },
      ],
    };
  }

  return {
    assi: [
      { id: "asse1", label: "1 asse", wheelsCount: 4 },
      { id: "asse2", label: "2 asse", wheelsCount: 4 },
      { id: "asse3", label: "3 asse", wheelsCount: 4 },
    ],
  };
}

function buildAssiRotationOptions(categoria?: string) {
  const assiNumerati = buildConfig(categoria).assi.filter((asse) => asse.id.startsWith("asse"));
  const count = assiNumerati.length;
  if (count === 2) return ["1<->2"];
  if (count === 3) return ["1<->2", "2<->3", "1<->3"];
  return [];
}

function genId() {
  const cryptoApi = globalThis.crypto as Crypto | undefined;
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }

  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && Array.isArray((value as { value?: unknown[] }).value)) {
    return (value as { value: T[] }).value;
  }
  return [];
}

export default function NextGommeAutistaModal({ open, onClose, onSaved }: Props) {
  const [targetType, setTargetType] = useState<TargetType>("motrice");
  const [mode, setMode] = useState<ModeType>("cambio");
  const [tipoIntervento, setTipoIntervento] = useState<TipoIntervento>("sostituzione");
  const [km, setKm] = useState("");
  const [gommeData, setGommeData] = useState<CambioGommeData | null>(null);
  const [gommeOpen, setGommeOpen] = useState(false);
  const [rotazioneSchema, setRotazioneSchema] = useState("");
  const [haSpostatoAssi, setHaSpostatoAssi] = useState<"si" | "no">("no");
  const [haSostituitoGomme, setHaSostituitoGomme] = useState<"si" | "no" | null>(null);
  const [mezzoLocal, setMezzoLocal] = useState<any>(null);
  const [autistaLocal, setAutistaLocal] = useState<any>(null);
  const [mezziList, setMezziList] = useState<MezzoRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMezzoLocal(getMezzoLocal());
    setAutistaLocal(getAutistaLocal());
    void (async () => {
      const raw = await getItemSync("@mezzi_aziendali");
      setMezziList(asArray<MezzoRecord>(raw));
    })();
  }, [open]);

  const mezziByTarga = useMemo(() => {
    const map = new Map<string, MezzoRecord>();
    mezziList.forEach((mezzo) => {
      const targa = normalizeTarga(
        mezzo?.targa ?? mezzo?.targaCamion ?? mezzo?.targaMotrice ?? mezzo?.targaRimorchio ?? "",
      );
      if (targa) {
        map.set(targa, mezzo);
      }
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
    const mezzo = mezziByTarga.get(targetTarga);
    const value = mezzo?.categoria ?? mezzo?.categoriaMezzo ?? mezzo?.tipoMezzo ?? mezzo?.tipo ?? null;
    return value ? String(value) : "";
  }, [mezziByTarga, targetTarga]);

  const rotazioneOptions = useMemo(() => buildAssiRotationOptions(categoria), [categoria]);
  const rotazioneDisabled = useMemo(() => isRotazioneDisabled(categoria), [categoria]);

  useEffect(() => {
    setGommeData(null);
    setRotazioneSchema("");
    setHaSpostatoAssi("no");
    setHaSostituitoGomme(null);
  }, [categoria, targetType]);

  useEffect(() => {
    if (rotazioneDisabled && mode === "rotazione") {
      setMode("cambio");
    }
  }, [mode, rotazioneDisabled]);

  if (!open) {
    return null;
  }

  const kmNum = Number(km);
  const kmValid = Number.isFinite(kmNum) && kmNum > 0;
  const targetOk = Boolean(targetTarga);
  const categoriaOk = Boolean(categoria);
  const cambioOk = mode === "cambio" && Boolean(gommeData?.gommeIds?.length);
  const rotazioneHaCambio = haSostituitoGomme === "si";
  const rotazioneCambioOk = !rotazioneHaCambio || Boolean(gommeData?.gommeIds?.length);
  const rotazioneOk =
    mode === "rotazione"
    && !rotazioneDisabled
    && haSpostatoAssi === "si"
    && Boolean(rotazioneSchema)
    && haSostituitoGomme !== null
    && rotazioneCambioOk;
  const canSave = targetOk && categoriaOk && kmValid && (cambioOk || rotazioneOk);

  async function handleSave() {
    if (!canSave) {
      setError("Compila i campi obbligatori.");
      return;
    }

    const asseCambioNum = (() => {
      const asseId = gommeData?.asseId || "";
      const match = /asse(\d+)/i.exec(String(asseId));
      if (match) return Number(match[1]);
      const labelMatch = /(\d+)/.exec(String(gommeData?.asseLabel || ""));
      return labelMatch ? Number(labelMatch[1]) : null;
    })();

    const assiCambioList =
      mode === "rotazione" && rotazioneHaCambio && Number.isFinite(asseCambioNum)
        ? [Number(asseCambioNum)]
        : [];
    const assiCambioLabel = assiCambioList.join(", ");
    const rotazioneTextValue =
      mode === "rotazione" && haSpostatoAssi === "si" && rotazioneSchema
        ? `Rotazione assi ${rotazioneSchema}${assiCambioList.length ? `; cambio gomme assi: ${assiCambioLabel}` : ""}`
        : "";
    const rotazioneAssiValue =
      mode === "rotazione" && haSpostatoAssi === "si" && rotazioneSchema
        ? (() => {
            const match = /(\d)\s*<->\s*(\d)/.exec(rotazioneSchema);
            if (!match) return null;
            const from = Number(match[1]);
            const to = Number(match[2]);
            return Number.isFinite(from) && Number.isFinite(to) ? { from, to } : null;
          })()
        : null;

    const record = {
      id: genId(),
      targetType,
      targetTarga,
      categoria,
      km: kmNum,
      data: Date.now(),
      marca:
        mode === "cambio"
          ? String(gommeData?.marca ?? "").trim() || null
          : mode === "rotazione" && rotazioneHaCambio
            ? String(gommeData?.marca ?? "").trim() || null
            : null,
      tipo: mode === "cambio" ? tipoIntervento : "rotazione",
      gommeIds:
        mode === "cambio"
          ? gommeData?.gommeIds ?? []
          : mode === "rotazione" && rotazioneHaCambio
            ? gommeData?.gommeIds ?? []
            : [],
      asseId:
        mode === "cambio"
          ? gommeData?.asseId ?? null
          : mode === "rotazione" && rotazioneHaCambio
            ? gommeData?.asseId ?? null
            : null,
      asseLabel:
        mode === "cambio"
          ? gommeData?.asseLabel ?? null
          : mode === "rotazione" && rotazioneHaCambio
            ? gommeData?.asseLabel ?? null
            : null,
      rotazioneSchema: mode === "rotazione" ? (haSpostatoAssi === "si" ? rotazioneSchema : "") : null,
      rotazioneText: mode === "rotazione" ? rotazioneTextValue || "" : null,
      rotazioneAssi: rotazioneAssiValue,
      assiConCambioGomme: assiCambioList,
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
      source: "next-clone",
      syncState: "local-only",
    };

    const raw = await getItemSync(KEY_GOMME_TMP);
    const list = asArray<any>(raw);
    await setItemSync(KEY_GOMME_TMP, [record, ...list]);
    setError(null);
    setGommeData(null);
    setRotazioneSchema("");
    setHaSpostatoAssi("no");
    setHaSostituitoGomme(null);
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
            <button type="button" onClick={() => setTargetType("motrice")}>
              MOTRICE
            </button>
            <button type="button" onClick={() => setTargetType("rimorchio")}>
              RIMORCHIO
            </button>
          </div>
          <div style={{ marginTop: 6, fontSize: 13 }}>
            Targa: <strong>{targetTargaRaw ?? "-"}</strong>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Categoria</div>
          <div>{categoria || "-"}</div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Modalita</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setMode("cambio")}>
              CAMBIO
            </button>
            <button type="button" onClick={() => setMode("rotazione")} disabled={rotazioneDisabled}>
              ROTAZIONE
            </button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700 }}>KM</span>
            <input value={km} onChange={(event) => setKm(event.target.value)} placeholder="Inserisci km" />
          </label>
        </div>

        {mode === "cambio" ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Tipo intervento</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setTipoIntervento("sostituzione")}>
                Sostituzione
              </button>
              <button type="button" onClick={() => setTipoIntervento("riparazione")}>
                Riparazione
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 700 }}>Hai spostato assi?</span>
              <select value={haSpostatoAssi} onChange={(event) => setHaSpostatoAssi(event.target.value as "si" | "no")}>
                <option value="no">No</option>
                <option value="si">Si</option>
              </select>
            </label>
            {haSpostatoAssi === "si" ? (
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 700 }}>Schema rotazione</span>
                <select value={rotazioneSchema} onChange={(event) => setRotazioneSchema(event.target.value)}>
                  <option value="">Seleziona schema</option>
                  {rotazioneOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 700 }}>Hai sostituito gomme?</span>
              <select
                value={haSostituitoGomme ?? ""}
                onChange={(event) => setHaSostituitoGomme((event.target.value || null) as "si" | "no" | null)}
              >
                <option value="">Seleziona</option>
                <option value="no">No</option>
                <option value="si">Si</option>
              </select>
            </label>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <button type="button" onClick={() => setGommeOpen(true)}>
            Apri selezione gomme
          </button>
          {gommeData ? (
            <div style={{ marginTop: 8, fontSize: 13 }}>
              {gommeData.asseLabel} · {gommeData.numeroGomme} gomme · {gommeData.marca || "marca n/d"}
            </div>
          ) : null}
        </div>

        {error ? <div style={{ marginTop: 12, color: "#d32f2f", fontSize: 13 }}>{error}</div> : null}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button type="button" onClick={onClose}>
            Annulla
          </button>
          <button type="button" onClick={() => void handleSave()} disabled={!canSave}>
            SALVA LOCALE
          </button>
        </div>
      </div>

      <NextModalGomme
        open={gommeOpen}
        targa={targetTarga}
        categoria={categoria}
        kmIniziale={km}
        onClose={() => setGommeOpen(false)}
        onConfirm={(data) => {
          setGommeData(data);
          if (data.km) {
            setKm(data.km);
          }
          setGommeOpen(false);
        }}
      />
    </div>
  );
}
