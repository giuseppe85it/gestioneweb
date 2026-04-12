import { useEffect, useRef, useState } from "react";
import { callPdfAiEnhance } from "./NextEuromeccPage";
import {
  saveNextManutenzioneBusinessRecord,
  type NextManutenzioniLegacyMaterialRecord,
} from "./domain/nextManutenzioniDomain";
import type { NextDossierFatturaPreventivoLegacyItem } from "./domain/nextDossierMezzoDomain";

type TipoVoce = "mezzo" | "compressore" | "attrezzature";

type MaterialeRiga = {
  id: string;
  nome: string;
  quantita: number;
  unitaMisura: string;
  selezionato: boolean;
};

type AiResult = {
  descrizione: string;
  officina: string;
  data: string;
  importo: number | null;
  materiali: Array<{
    nome: string;
    quantita: number;
    unitaMisura: string;
    prezzoUnitario: number;
  }>;
};

type ParsePhase = "idle" | "parsing" | "ready";

function buildMaterialeId(index: number): string {
  return `mat_${Date.now()}_${index}`;
}

async function fetchPdfAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Errore download PDF: ${response.status}`);
  }
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("Errore lettura PDF"));
    reader.readAsDataURL(blob);
  });
}

function cleanJsonText(raw: string): string {
  return raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

const AI_PROMPT = `Sei un assistente tecnico specializzato in manutenzione veicoli.
Analizza la seguente fattura e restituisci SOLO un oggetto JSON,
senza testo aggiuntivo, senza markdown, senza backtick.

STRUTTURA JSON RICHIESTA:
{
  "descrizione": "descrizione sintetica del lavoro eseguito",
  "officina": "nome officina o fornitore",
  "data": "yyyy-MM-dd",
  "importo": numero o null,
  "materiali": [
    {
      "nome": "descrizione materiale o ricambio",
      "quantita": numero,
      "unitaMisura": "pz|lt|kg|mt|altro",
      "prezzoUnitario": numero o 0
    }
  ]
}

REGOLE:
- descrizione deve riassumere il lavoro principale
- officina e il nome di chi ha eseguito il lavoro
- data e la data della fattura in formato yyyy-MM-dd
- importo e il totale fattura come numero senza valuta, o null se non leggibile
- materiali e la lista dei ricambi/materiali elencati
- Se la quantita non e specificata usa 1
- Se l'unita non e specificata usa "pz"
- Non inventare dati non presenti nel documento`;

export default function NextDossierFatturaToManutenzioneModal(props: {
  fattura: NextDossierFatturaPreventivoLegacyItem;
  targa: string;
  onClose: () => void;
  onSaved: (manutenzioneId: string) => void;
}) {
  const { fattura, targa, onClose, onSaved } = props;

  const [phase, setPhase] = useState<ParsePhase>("idle");
  const [aiWarning, setAiWarning] = useState<string | null>(null);

  const [fieldTarga, setFieldTarga] = useState(targa);
  const [fieldData, setFieldData] = useState("");
  const [fieldTipo, setFieldTipo] = useState<TipoVoce>("mezzo");
  const [fieldDescrizione, setFieldDescrizione] = useState("");
  const [fieldEseguito, setFieldEseguito] = useState("");
  const [fieldKm, setFieldKm] = useState("");
  const [fieldOre, setFieldOre] = useState("");
  const [fieldImporto, setFieldImporto] = useState("");
  const [materiali, setMateriali] = useState<MaterialeRiga[]>([]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    async function runParsing() {
      if (!fattura.fileUrl) {
        setFieldData(fattura.data ?? "");
        setFieldDescrizione(fattura.descrizione ?? "");
        setFieldEseguito(fattura.fornitoreLabel ?? "");
        setFieldImporto(fattura.importo != null ? String(fattura.importo) : "");
        setAiWarning("Documento non disponibile per l'analisi automatica");
        setPhase("ready");
        return;
      }

      setPhase("parsing");
      try {
        const pdfBase64 = await fetchPdfAsBase64(fattura.fileUrl);
        const rawResult = await callPdfAiEnhance({
          inputText: AI_PROMPT,
          imageBase64: pdfBase64,
        });
        const cleaned = cleanJsonText(rawResult);
        const parsed = JSON.parse(cleaned) as AiResult;

        if (!mountedRef.current) return;

        setFieldData(parsed.data ?? fattura.data ?? "");
        setFieldDescrizione(parsed.descrizione ?? fattura.descrizione ?? "");
        setFieldEseguito(parsed.officina ?? fattura.fornitoreLabel ?? "");
        setFieldImporto(
          parsed.importo != null
            ? String(parsed.importo)
            : fattura.importo != null
              ? String(fattura.importo)
              : ""
        );
        setMateriali(
          (parsed.materiali ?? []).map((m, i) => ({
            id: buildMaterialeId(i),
            nome: m.nome ?? "",
            quantita: typeof m.quantita === "number" ? m.quantita : 1,
            unitaMisura: m.unitaMisura ?? "pz",
            selezionato: true,
          }))
        );
        setAiWarning(null);
      } catch {
        if (!mountedRef.current) return;
        setFieldData(fattura.data ?? "");
        setFieldDescrizione(fattura.descrizione ?? "");
        setFieldEseguito(fattura.fornitoreLabel ?? "");
        setFieldImporto(fattura.importo != null ? String(fattura.importo) : "");
        setAiWarning("Analisi automatica non riuscita — compila manualmente");
      } finally {
        if (mountedRef.current) setPhase("ready");
      }
    }

    void runParsing();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function addMaterialeVuoto() {
    setMateriali((prev) => [
      ...prev,
      {
        id: buildMaterialeId(prev.length),
        nome: "",
        quantita: 1,
        unitaMisura: "pz",
        selezionato: true,
      },
    ]);
  }

  function removeMateriale(id: string) {
    setMateriali((prev) => prev.filter((m) => m.id !== id));
  }

  function updateMateriale(id: string, patch: Partial<Omit<MaterialeRiga, "id">>) {
    setMateriali((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
    );
  }

  async function handleSave() {
    setValidationError(null);
    setSaveError(null);

    const targaNorm = fieldTarga.trim();
    const descrizioneNorm = fieldDescrizione.trim();

    if (!targaNorm) {
      setValidationError("La targa è obbligatoria.");
      return;
    }
    if (!descrizioneNorm) {
      setValidationError("La descrizione è obbligatoria.");
      return;
    }

    const materialiPayload: NextManutenzioniLegacyMaterialRecord[] = materiali
      .filter((m) => m.selezionato && m.nome.trim())
      .map((m) => ({
        id: m.id,
        label: m.nome.trim(),
        quantita: m.quantita > 0 ? m.quantita : 1,
        unita: m.unitaMisura.trim() || "pz",
        fromInventario: false,
      }));

    const kmParsed = fieldKm.trim() ? Number(fieldKm.trim()) : null;
    const oreParsed = fieldOre.trim() ? Number(fieldOre.trim()) : null;

    setSaving(true);
    try {
      const record = await saveNextManutenzioneBusinessRecord({
        targa: targaNorm,
        tipo: fieldTipo,
        descrizione: descrizioneNorm,
        data: fieldData.trim(),
        eseguito: fieldEseguito.trim() || null,
        fornitore: fieldEseguito.trim() || null,
        km: kmParsed != null && Number.isFinite(kmParsed) ? kmParsed : null,
        ore: oreParsed != null && Number.isFinite(oreParsed) ? oreParsed : null,
        materiali: materialiPayload,
        sourceDocumentId: fattura.id,
      });
      if (!mountedRef.current) return;
      onSaved(record.id);
      onClose();
    } catch (err) {
      if (!mountedRef.current) return;
      setSaveError(
        err instanceof Error ? err.message : "Errore salvataggio manutenzione."
      );
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }

  return (
    <div className="dossier-modal-overlay">
      <div className="dossier-modal" style={{ maxWidth: 680 }}>
        <div className="dossier-modal-header">
          <h2>Crea manutenzione da fattura</h2>
          <button className="dossier-button" type="button" onClick={onClose} disabled={saving}>
            Chiudi
          </button>
        </div>
        <div className="dossier-modal-body">
          {phase === "parsing" && (
            <p style={{ marginBottom: 12, color: "#666" }}>
              Analisi documento in corso...
            </p>
          )}
          {aiWarning && phase === "ready" && (
            <div
              style={{
                marginBottom: 12,
                padding: "8px 12px",
                background: "#fff3cd",
                border: "1px solid #ffc107",
                borderRadius: 6,
                fontSize: 13,
              }}
            >
              {aiWarning}
            </div>
          )}
          {phase === "ready" && (
            <>
              <div style={{ display: "grid", gap: 10 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                  Targa
                  <input
                    className="dossier-input"
                    type="text"
                    value={fieldTarga}
                    onChange={(e) => setFieldTarga(e.target.value)}
                    disabled={saving}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                  Data
                  <input
                    className="dossier-input"
                    type="date"
                    value={fieldData}
                    onChange={(e) => setFieldData(e.target.value)}
                    disabled={saving}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                  Tipo
                  <select
                    className="dossier-input"
                    value={fieldTipo}
                    onChange={(e) => setFieldTipo(e.target.value as TipoVoce)}
                    disabled={saving}
                  >
                    <option value="mezzo">Ordinaria (mezzo)</option>
                    <option value="attrezzature">Straordinaria (attrezzatura)</option>
                    <option value="compressore">Esterna (compressore)</option>
                  </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                  Descrizione
                  <textarea
                    className="dossier-input"
                    rows={3}
                    value={fieldDescrizione}
                    onChange={(e) => setFieldDescrizione(e.target.value)}
                    disabled={saving}
                    style={{ resize: "vertical" }}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                  Eseguito da / Officina
                  <input
                    className="dossier-input"
                    type="text"
                    value={fieldEseguito}
                    onChange={(e) => setFieldEseguito(e.target.value)}
                    disabled={saving}
                  />
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                    KM (opzionale)
                    <input
                      className="dossier-input"
                      type="number"
                      min={0}
                      value={fieldKm}
                      onChange={(e) => setFieldKm(e.target.value)}
                      disabled={saving}
                    />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                    Ore (opzionale)
                    <input
                      className="dossier-input"
                      type="number"
                      min={0}
                      value={fieldOre}
                      onChange={(e) => setFieldOre(e.target.value)}
                      disabled={saving}
                    />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                    Importo (opzionale)
                    <input
                      className="dossier-input"
                      type="number"
                      min={0}
                      step="0.01"
                      value={fieldImporto}
                      onChange={(e) => setFieldImporto(e.target.value)}
                      disabled={saving}
                    />
                  </label>
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Materiali / Ricambi</span>
                    <button
                      className="dossier-button"
                      type="button"
                      onClick={addMaterialeVuoto}
                      disabled={saving}
                      style={{ fontSize: 12 }}
                    >
                      + Aggiungi riga
                    </button>
                  </div>
                  {materiali.length === 0 ? (
                    <p style={{ fontSize: 12, color: "#888", margin: 0 }}>Nessun materiale. Aggiungi righe manualmente.</p>
                  ) : (
                    <div style={{ display: "grid", gap: 6 }}>
                      {materiali.map((m) => (
                        <div
                          key={m.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "auto 1fr 80px 70px auto",
                            gap: 6,
                            alignItems: "center",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={m.selezionato}
                            onChange={(e) => updateMateriale(m.id, { selezionato: e.target.checked })}
                            disabled={saving}
                          />
                          <input
                            className="dossier-input"
                            type="text"
                            placeholder="Nome materiale"
                            value={m.nome}
                            onChange={(e) => updateMateriale(m.id, { nome: e.target.value })}
                            disabled={saving}
                            style={{ fontSize: 12 }}
                          />
                          <input
                            className="dossier-input"
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="Q.ta"
                            value={m.quantita}
                            onChange={(e) =>
                              updateMateriale(m.id, { quantita: parseFloat(e.target.value) || 1 })
                            }
                            disabled={saving}
                            style={{ fontSize: 12 }}
                          />
                          <input
                            className="dossier-input"
                            type="text"
                            placeholder="u.m."
                            value={m.unitaMisura}
                            onChange={(e) => updateMateriale(m.id, { unitaMisura: e.target.value })}
                            disabled={saving}
                            style={{ fontSize: 12 }}
                          />
                          <button
                            className="dossier-button"
                            type="button"
                            onClick={() => removeMateriale(m.id)}
                            disabled={saving}
                            style={{ fontSize: 11, padding: "2px 6px" }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {validationError && (
                <p style={{ color: "#c0392b", marginTop: 10, fontSize: 13 }}>{validationError}</p>
              )}
              {saveError && (
                <p style={{ color: "#c0392b", marginTop: 10, fontSize: 13 }}>{saveError}</p>
              )}

              <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="dossier-button" type="button" onClick={onClose} disabled={saving}>
                  Annulla
                </button>
                <button
                  className="dossier-button primary"
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                >
                  {saving ? "Salvataggio..." : "Salva manutenzione"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
