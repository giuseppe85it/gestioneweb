import { useEffect, useMemo, useState } from "react";
import {
  getNextAssiOptionsForCategoria,
  type NextManutenzioneAsseCoinvoltoId,
} from "../../next/domain/nextManutenzioniGommeDomain";
import {
  findManutenzioniGommeDaCompletare,
  type GommeImportInterventoTipo,
  type GommeImportManutenzioneInput,
  type ManutenzioneDaCompletare,
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
 * UFFICIALE "eseguita". L'admin segna ESATTAMENTE cosa è stato cambiato: uno o
 * più assi (caselle) + numero gomme + km/marca/data e ordinario/straordinario,
 * prima della scrittura nello storico. Nessuna scrittura qui: il modale raccoglie
 * i campi e li passa via `onConfirm`.
 */
export default function GommeImportModal({ evento, saving, onClose, onConfirm }: Props) {
  const categoria = evento?.categoria ?? null;
  const targa = String(evento?.targetTarga ?? evento?.targa ?? "").toUpperCase();
  const autistaNome = evento?.autista?.nome ?? evento?.autistaNome ?? null;

  const assiOptions = useMemo(
    () => getNextAssiOptionsForCategoria(categoria),
    [categoria],
  );
  const wheelsById = useMemo(
    () => new Map(assiOptions.map((opt) => [opt.id, opt.wheelsCount] as const)),
    [assiOptions],
  );

  const [data, setData] = useState("");
  const [km, setKm] = useState("");
  const [marca, setMarca] = useState("");
  const [assi, setAssi] = useState<NextManutenzioneAsseCoinvoltoId[]>([]);
  const [numeroGomme, setNumeroGomme] = useState("");
  const [interventoTipo, setInterventoTipo] = useState<GommeImportInterventoTipo>("ordinario");
  const [motivo, setMotivo] = useState("");
  // BUG doppione gomme — scelta esplicita: completare una manutenzione esistente
  // (segnalazione/da fare) invece di crearne una nuova. Default = crea nuovo.
  const [candidati, setCandidati] = useState<ManutenzioneDaCompletare[]>([]);
  const [completaTargetId, setCompletaTargetId] = useState<string | null>(null);

  const sumWheels = (ids: NextManutenzioneAsseCoinvoltoId[]) =>
    ids.reduce((tot, id) => tot + (wheelsById.get(id) ?? 0), 0);

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
    const prefilled =
      prefAsse && assiOptions.some((opt) => opt.id === prefAsse) ? [prefAsse] : [];
    setAssi(prefilled);
    const wheels = prefilled.reduce((tot, id) => tot + (wheelsById.get(id) ?? 0), 0);
    setNumeroGomme(wheels > 0 ? String(wheels) : "");
    setInterventoTipo("ordinario");
    setMotivo("");
    setCompletaTargetId(null);
  }, [evento, assiOptions, wheelsById]);

  // Cerca manutenzioni gomme aperte per questo mezzo+asse: se esistono, il modale
  // OFFRE all'admin di completarle invece di creare un doppione (scelta esplicita).
  useEffect(() => {
    if (!evento || assi.length === 0) {
      setCandidati([]);
      return;
    }
    let active = true;
    findManutenzioniGommeDaCompletare(targa, assi)
      .then((found) => {
        if (active) setCandidati(found);
      })
      .catch(() => {
        if (active) setCandidati([]);
      });
    return () => {
      active = false;
    };
  }, [evento, assi, targa]);

  // Se l'opzione scelta non e' piu' tra i candidati, torna a "crea nuovo".
  useEffect(() => {
    if (completaTargetId && !candidati.some((c) => c.id === completaTargetId)) {
      setCompletaTargetId(null);
    }
  }, [candidati, completaTargetId]);

  if (!evento) return null;

  const toggleAsse = (id: NextManutenzioneAsseCoinvoltoId) => {
    setAssi((prev) => {
      const next = prev.includes(id)
        ? prev.filter((entry) => entry !== id)
        : [...prev, id];
      // ricalcola il numero gomme suggerito in base agli assi spuntati
      const wheels = sumWheels(next);
      setNumeroGomme(wheels > 0 ? String(wheels) : "");
      return next;
    });
  };

  const kmTrim = km.trim();
  const kmValue =
    kmTrim === ""
      ? null
      : Number.isFinite(Number(kmTrim.replace(",", ".")))
        ? Number(kmTrim.replace(",", "."))
        : NaN;
  const kmInvalid = kmValue !== null && Number.isNaN(kmValue);

  const numTrim = numeroGomme.trim();
  const numValue = numTrim === "" ? null : Math.trunc(Number(numTrim));
  const numInvalid = numValue !== null && (!Number.isFinite(numValue) || numValue < 0);

  const assiMancanti = interventoTipo === "ordinario" && assi.length === 0;
  const canConfirm = Boolean(data) && !kmInvalid && !numInvalid && !assiMancanti && !saving;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm({
      eventoId: String(evento.id ?? ""),
      targa,
      data,
      km: kmValue,
      assiCoinvolti: assi,
      numeroGomme: numValue,
      marca: marca.trim() || null,
      interventoTipo,
      motivo: motivo.trim() || null,
      segnalatoDa: autistaNome ? String(autistaNome) : null,
      completaManutenzioneId: completaTargetId,
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
                {autistaNome ? ` · autista ${autistaNome}` : ""}. Segna cosa è stato cambiato
                e conferma: verrà creata una manutenzione gomme <strong>eseguita</strong> nello
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
              </div>

              <label style={{ display: "block", marginTop: 12 }}>
                Assi cambiati{interventoTipo === "ordinario" ? " (spunta tutti quelli cambiati)" : " (facoltativo)"}
              </label>
              {assiOptions.length === 0 ? (
                <p className="aa-td-sub">
                  Nessun asse configurato per questa categoria mezzo: puoi importare come
                  straordinario.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    margin: "6px 0 4px",
                  }}
                >
                  {assiOptions.map((opt) => {
                    const checked = assi.includes(opt.id);
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        className={checked ? "edit aa-crow-primary" : "edit"}
                        onClick={() => toggleAsse(opt.id)}
                        style={{ minWidth: 130, textAlign: "left" }}
                      >
                        {checked ? "☑ " : "☐ "}
                        {opt.label}
                        <span className="aa-td-sub" style={{ display: "block", fontWeight: 400 }}>
                          {opt.wheelsCount} gomme
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {candidati.length > 0 ? (
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: "block" }}>
                    Esiste già una manutenzione aperta per questo mezzo e asse — scegli:
                  </label>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      margin: "6px 0 4px",
                    }}
                  >
                    <button
                      type="button"
                      className={completaTargetId === null ? "edit aa-crow-primary" : "edit"}
                      onClick={() => setCompletaTargetId(null)}
                      style={{ textAlign: "left" }}
                    >
                      {completaTargetId === null ? "◉ " : "○ "}
                      Crea un NUOVO record (cambio separato)
                    </button>
                    {candidati.map((cand) => {
                      const meta = [
                        cand.data,
                        cand.km != null ? `segnalato a ${cand.km} km` : null,
                        cand.stato,
                      ]
                        .filter(Boolean)
                        .join(" · ");
                      return (
                        <button
                          type="button"
                          key={cand.id}
                          className={completaTargetId === cand.id ? "edit aa-crow-primary" : "edit"}
                          onClick={() => setCompletaTargetId(cand.id)}
                          style={{ textAlign: "left" }}
                        >
                          {completaTargetId === cand.id ? "◉ " : "○ "}
                          Completa questa: {cand.descrizione.slice(0, 70)}
                          {cand.descrizione.length > 70 ? "…" : ""}
                          {meta ? (
                            <span
                              className="aa-td-sub"
                              style={{ display: "block", fontWeight: 400 }}
                            >
                              {meta}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  {completaTargetId ? (
                    <p className="aa-td-sub" style={{ margin: "2px 0 0" }}>
                      Verrà completata la manutenzione scelta: il km di prima resta come
                      «km segnalazione», questi km diventano il «km cambio». Niente doppione.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="admin-edit-grid" style={{ marginTop: 12 }}>
                <label>
                  Numero gomme cambiate
                  <input
                    inputMode="numeric"
                    value={numeroGomme}
                    onChange={(e) => setNumeroGomme(e.target.value)}
                    placeholder="(es. 6)"
                  />
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

              {assiMancanti ? (
                <p className="aa-td-sub" style={{ color: "#b4232a" }}>
                  Per un cambio gomme ordinario spunta almeno un asse.
                </p>
              ) : null}
              {kmInvalid ? (
                <p className="aa-td-sub" style={{ color: "#b4232a" }}>
                  KM non valido.
                </p>
              ) : null}
              {numInvalid ? (
                <p className="aa-td-sub" style={{ color: "#b4232a" }}>
                  Numero gomme non valido.
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
