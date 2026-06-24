import { useEffect, useMemo, useState } from "react";
import {
  getNextAssiOptionsForCategoria,
  type NextManutenzioneAsseCoinvoltoId,
} from "../../next/domain/nextManutenzioniGommeDomain";
import type {
  GommeImportInterventoTipo,
  GommeImportManutenzioneInput,
} from "../../next/writers/nextGommeImportManutenzioneWriter";

type Props = {
  /** record evento gomme (`@cambi_gomme_autisti_tmp`) da importare, o null se chiuso */
  evento: any | null;
  saving?: boolean;
  onClose: () => void;
  onConfirm: (input: GommeImportManutenzioneInput) => void;
};

const ASSE_IDS: NextManutenzioneAsseCoinvoltoId[] = [
  "anteriore",
  "posteriore",
  "asse1",
  "asse2",
  "asse3",
];

function tsToYmd(value: unknown): string {
  let ms: number | null = null;
  if (typeof value === "number" && Number.isFinite(value)) ms = value;
  else if (typeof value === "string" && value.trim()) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) ms = parsed;
  }
  if (ms === null) return new Date().toISOString().substring(0, 10);
  const d = new Date(ms);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeAsseId(value: unknown): NextManutenzioneAsseCoinvoltoId | "" {
  const normalized = String(value ?? "").trim().toLowerCase();
  return (ASSE_IDS as string[]).includes(normalized)
    ? (normalized as NextManutenzioneAsseCoinvoltoId)
    : "";
}

/**
 * BUG 54 — schermata di conferma per importare un evento gomme come manutenzione
 * UFFICIALE "eseguita". L'admin rivede/corregge asse, km, marca, data e sceglie
 * ordinario/straordinario prima della scrittura nello storico. Nessuna scrittura
 * qui: il modale raccoglie i campi e li passa via `onConfirm`.
 */
export default function GommeImportModal({ evento, saving, onClose, onConfirm }: Props) {
  const categoria = evento?.categoria ?? null;
  const targa = String(evento?.targetTarga ?? evento?.targa ?? "").toUpperCase();
  const autistaNome = evento?.autista?.nome ?? evento?.autistaNome ?? null;

  const assiOptions = useMemo(
    () => getNextAssiOptionsForCategoria(categoria),
    [categoria],
  );

  const [data, setData] = useState("");
  const [km, setKm] = useState("");
  const [marca, setMarca] = useState("");
  const [asseId, setAsseId] = useState<NextManutenzioneAsseCoinvoltoId | "">("");
  const [interventoTipo, setInterventoTipo] = useState<GommeImportInterventoTipo>("ordinario");
  const [motivo, setMotivo] = useState("");

  // Prefill dei campi quando si apre un nuovo evento.
  useEffect(() => {
    if (!evento) return;
    setData(tsToYmd(evento.data ?? evento.timestamp));
    setKm(
      evento.km === null || evento.km === undefined || evento.km === ""
        ? ""
        : String(evento.km),
    );
    setMarca(String(evento.marca ?? "").trim());
    const prefAsse = normalizeAsseId(evento.asseId);
    // tiene l'asse precompilato solo se valido per la categoria del mezzo
    setAsseId(
      prefAsse && assiOptions.some((opt) => opt.id === prefAsse) ? prefAsse : "",
    );
    setInterventoTipo("ordinario");
    setMotivo("");
  }, [evento, assiOptions]);

  if (!evento) return null;

  const kmTrim = km.trim();
  const kmValue =
    kmTrim === "" ? null : Number.isFinite(Number(kmTrim.replace(",", "."))) ? Number(kmTrim.replace(",", ".")) : NaN;
  const kmInvalid = kmValue !== null && Number.isNaN(kmValue);
  const asseMancante = interventoTipo === "ordinario" && !asseId;
  const canConfirm = Boolean(data) && !kmInvalid && !asseMancante && !saving;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm({
      eventoId: String(evento.id ?? ""),
      targa,
      data,
      km: kmValue,
      asseId: asseId || null,
      marca: marca.trim() || null,
      interventoTipo,
      motivo: motivo.trim() || null,
      segnalatoDa: autistaNome ? String(autistaNome) : null,
    });
  };

  return (
    <div className="aix-backdrop" onMouseDown={onClose}>
      <div className="aix-modal admin-edit-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="aix-head">
          <h3>Importa nello storico manutenzioni</h3>
          <button className="aix-close" type="button" onClick={onClose}>
            CHIUDI
          </button>
        </div>

        <div className="aix-body admin-edit-body">
          <div className="admin-edit-scroll">
            <div className="admin-edit-section">
              <p className="aa-td-sub" style={{ marginTop: 0 }}>
                Mezzo <strong>{targa || "—"}</strong>
                {autistaNome ? ` · autista ${autistaNome}` : ""}. Controlla i dati e
                conferma: verrà creata una manutenzione gomme <strong>eseguita</strong> nello
                storico ufficiale.
              </p>

              <div className="admin-edit-grid">
                <label>
                  Data esecuzione
                  <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
                </label>

                <label>
                  Tipo intervento
                  <select
                    value={interventoTipo}
                    onChange={(e) =>
                      setInterventoTipo(e.target.value as GommeImportInterventoTipo)
                    }
                  >
                    <option value="ordinario">Ordinario (cambio gomme)</option>
                    <option value="straordinario">Straordinario (guasto/foratura)</option>
                  </select>
                </label>

                <label>
                  Asse
                  <select
                    value={asseId}
                    onChange={(e) =>
                      setAsseId(e.target.value as NextManutenzioneAsseCoinvoltoId | "")
                    }
                  >
                    <option value="">
                      {interventoTipo === "ordinario" ? "Seleziona asse…" : "(facoltativo)"}
                    </option>
                    {assiOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  KM
                  <input
                    inputMode="numeric"
                    value={km}
                    onChange={(e) => setKm(e.target.value)}
                    placeholder="(facoltativo)"
                  />
                </label>

                {interventoTipo === "ordinario" ? (
                  <label>
                    Marca
                    <input
                      value={marca}
                      onChange={(e) => setMarca(e.target.value)}
                      placeholder="(facoltativo)"
                    />
                  </label>
                ) : (
                  <label className="admin-edit-full">
                    Motivo
                    <input
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="(es. foratura, usura, taglio)"
                    />
                  </label>
                )}
              </div>

              {asseMancante ? (
                <p className="aa-td-sub" style={{ color: "#b4232a" }}>
                  Per un cambio gomme ordinario l'asse è obbligatorio.
                </p>
              ) : null}
              {kmInvalid ? (
                <p className="aa-td-sub" style={{ color: "#b4232a" }}>
                  KM non valido.
                </p>
              ) : null}
              {assiOptions.length === 0 ? (
                <p className="aa-td-sub">
                  Nessun asse configurato per questa categoria mezzo: puoi importare come
                  straordinario.
                </p>
              ) : null}
            </div>
          </div>

          <div className="aix-actions">
            <button type="button" className="edit" onClick={onClose} disabled={saving}>
              Annulla
            </button>
            <button
              type="button"
              className="edit aa-crow-primary"
              onClick={handleConfirm}
              disabled={!canConfirm}
            >
              {saving ? "Creazione…" : "Conferma e crea manutenzione"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
