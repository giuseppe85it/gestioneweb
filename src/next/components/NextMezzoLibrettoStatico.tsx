import { useEffect, useState } from "react";
import { getItemSync } from "../../utils/storageSync";
import { toDisplay } from "../helpers/dateUnica";
import {
  MEZZI_KEY,
  buildRawLibrettoFields,
  findMezzo,
  normalizeMezzoRecord,
  unwrapArray,
  type MezzoFormData,
  type RawLibrettoFields,
} from "./NextMezzoEditModal";
import "./next-mezzo-edit-modal.css";

// Libretto svizzero in SOLA LETTURA per il dossier. Riproduce 1:1 il layout del modale
// "Modifica dati mezzo" (stesse classi mezmod-*, stessa fonte @mezzi_aziendali), ma statico.

function fmtDate(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return toDisplay(raw) || raw;
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="mezmod-field">
      <span className="mezmod-label">{label}</span>
      <input className={`mezmod-input${mono ? " mezmod-input--mono" : ""}`} value={value} readOnly />
    </div>
  );
}

export default function NextMezzoLibrettoStatico({ mezzoId }: { mezzoId: string }) {
  const [formData, setFormData] = useState<MezzoFormData | null>(null);
  const [raw, setRaw] = useState<RawLibrettoFields>({});
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const records = unwrapArray(await getItemSync(MEZZI_KEY));
        const record = findMezzo(records, mezzoId);
        if (cancelled) return;
        if (!record) {
          setFormData(null);
          setError(true);
          return;
        }
        setFormData(normalizeMezzoRecord(record));
        setRaw(buildRawLibrettoFields(record));
        setError(false);
      } catch {
        if (!cancelled) {
          setFormData(null);
          setError(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mezzoId]);

  if (!formData) {
    return (
      <div className="mezmod-spread" style={{ borderTop: "none", borderBottom: "none" }}>
        <div className="mezmod-page">
          <div className="mezmod-field">{error ? "Libretto non disponibile." : "Caricamento libretto..."}</div>
        </div>
        <div className="mezmod-page" />
      </div>
    );
  }

  return (
    <div className="mezmod-spread" style={{ borderTop: "none", borderBottom: "none", overflow: "hidden" }}>
      {/* Pagina sinistra: detentore / domicilio / titolare / autista */}
      <div className="mezmod-page">
        <div className="mezmod-row">
          <div className="mezmod-rail">Detentore</div>
          <div className="mezmod-main">
            <Field label="N. AVS" value={raw.numeroAvs ?? ""} mono />
          </div>
        </div>

        <div className="mezmod-row">
          <div className="mezmod-rail">Ragione sociale</div>
          <div className="mezmod-main">
            <Field label="Proprietario" value={formData.proprietario} />
          </div>
        </div>

        <div className="mezmod-row">
          <div className="mezmod-rail">Domicilio</div>
          <div className="mezmod-main mezmod-split-v">
            <Field label="Indirizzo" value={raw.indirizzo ?? ""} />
            <Field label="Località" value={raw.localita ?? ""} />
          </div>
        </div>

        <div className="mezmod-row">
          <div className="mezmod-rail">Dati titolare</div>
          <div className="mezmod-main mezmod-split-h">
            <Field label="Stato d'origine" value={raw.statoOrigine ?? ""} />
            <Field label="Assicurazione" value={formData.assicurazione} />
          </div>
        </div>

        <div className="mezmod-strip">
          <span>Annotazioni cantonali</span>
          <span>Decisioni autorità</span>
          <span>Annotazioni</span>
        </div>

        <div className="mezmod-row mezmod-row--full">
          <div className="mezmod-main">
            <div className="mezmod-field">
              <span className="mezmod-label">Annotazioni</span>
              <textarea className="mezmod-textarea" value={formData.note} readOnly />
            </div>
          </div>
        </div>

        <div className="mezmod-row">
          <div className="mezmod-rail">Autista</div>
          <div className="mezmod-main mezmod-split-h">
            <Field label="Autista abituale" value={formData.autistaNome ?? ""} />
            <Field label="ID autista" value={formData.autistaId ?? ""} mono />
          </div>
        </div>

        {formData.manutenzioneProgrammata ? (
          <div className="mezmod-row mezmod-row--green">
            <div className="mezmod-rail mezmod-rail--green">Manut. programmata</div>
            <div className="mezmod-main">
              <div className="mezmod-mp-head">
                <span className="mezmod-mp-head__label">Contratto manutenzione programmata</span>
                <span className="mezmod-mp-head__badge">{formData.manutenzioneContratto || "attivo"}</span>
              </div>
              <div className="mezmod-split-h">
                <div className="mezmod-split-v">
                  <Field label="Inizio contratto" value={fmtDate(formData.manutenzioneDataInizio as string)} />
                  <Field label="Km massimi" value={String(formData.manutenzioneKmMax ?? "")} />
                </div>
                <div className="mezmod-split-v">
                  <Field label="Prossima scadenza" value={fmtDate(formData.manutenzioneDataFine as string)} />
                  <Field label="Note contratto" value={String(formData.manutenzioneContratto ?? "")} />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Pagina destra: dati tecnici del veicolo (codici libretto) */}
      <div className="mezmod-page">
        <div className="mezmod-row mezmod-row--plate">
          <div className="mezmod-code">A / 15</div>
          <div className="mezmod-main">
            <div className="mezmod-field">
              <span className="mezmod-label">Targa</span>
              <div className="mezmod-plate">
                <div className="mezmod-plate__side">
                  <span className="mezmod-plate__star">*</span>
                  <span className="mezmod-plate__country">CH</span>
                </div>
                <input className="mezmod-input mezmod-plate__input" value={formData.targa} readOnly />
              </div>
            </div>
          </div>
          <div className="mezmod-side">
            <Field label="Colore" value={formData.colore} />
          </div>
        </div>

        <div className="mezmod-row mezmod-row--tech">
          <div className="mezmod-code">19</div>
          <div className="mezmod-main mezmod-split-h">
            <Field label="Genere veicolo" value={raw.genereVeicolo ?? ""} />
            <Field label="Categoria" value={formData.categoria} />
          </div>
        </div>

        <div className="mezmod-row mezmod-row--tech">
          <div className="mezmod-code" />
          <div className="mezmod-main">
            <Field label="Tipo" value={formData.tipo} />
          </div>
        </div>

        <div className="mezmod-row mezmod-row--tech">
          <div className="mezmod-code">D / 21</div>
          <div className="mezmod-main mezmod-split-h">
            <Field label="Marca" value={formData.marca} />
            <Field label="Modello" value={formData.modello} />
          </div>
        </div>

        <div className="mezmod-row mezmod-row--tech">
          <div className="mezmod-code">E / 23</div>
          <div className="mezmod-main">
            <Field label="Telaio" value={formData.telaio} mono />
          </div>
        </div>

        <div className="mezmod-row mezmod-row--plate">
          <div className="mezmod-code">25</div>
          <div className="mezmod-main">
            <Field label="Carrozzeria" value={raw.carrozzeria ?? ""} />
          </div>
          <div className="mezmod-side">
            <Field label="Colore" value={formData.colore} />
          </div>
        </div>

        <div className="mezmod-row mezmod-row--tech">
          <div className="mezmod-code">Tech</div>
          <div className="mezmod-main">
            <div className="mezmod-tech">
              <div className="mezmod-tech-left">
                <Field label="Numero matricola" value={raw.numeroMatricola ?? ""} mono />
                <Field label="Approvazione tipo" value={raw.approvazioneTipo ?? ""} mono />
                <Field label="Cilindrata" value={formData.cilindrata} />
                <Field label="Potenza" value={formData.potenza} />
              </div>
              <div className="mezmod-tech-right">
                <Field label="Peso a vuoto" value={raw.pesoVuoto ?? ""} mono />
                <Field label="Carico utile / sella" value={raw.caricoUtileSella ?? ""} mono />
                <Field label="Peso totale" value={raw.pesoTotale ?? formData.massaComplessiva} mono />
                <Field label="Peso totale rimorchio" value={raw.pesoTotaleRimorchio ?? ""} mono />
                <Field label="Carico sul letto" value={raw.caricoSulLetto ?? ""} mono />
                <Field label="Peso rimorchiabile" value={raw.pesoRimorchiabile ?? ""} mono />
              </div>
            </div>
          </div>
        </div>

        <div className="mezmod-row mezmod-row--tech">
          <div className="mezmod-code">B / 36</div>
          <div className="mezmod-main mezmod-split-h">
            <Field label="Prima immatricolazione" value={fmtDate(formData.dataImmatricolazione)} />
            <Field label="Anno" value={String(formData.anno ?? "")} />
          </div>
        </div>

        <div className="mezmod-row mezmod-row--tech">
          <div className="mezmod-code">rilascio</div>
          <div className="mezmod-main">
            <Field label="Luogo / data rilascio" value={raw.luogoDataRilascio ?? ""} />
          </div>
        </div>

        <div className="mezmod-row mezmod-row--collaudo mezmod-row--tech">
          <div className="mezmod-code">38</div>
          <div className="mezmod-main">
            <Field label="Ultimo collaudo" value={fmtDate(formData.dataUltimoCollaudo)} />
          </div>
        </div>

        <div className="mezmod-row mezmod-row--collaudo mezmod-row--tech">
          <div className="mezmod-code">39</div>
          <div className="mezmod-main">
            <Field label="Prossimo collaudo / revisione" value={fmtDate(formData.dataScadenzaRevisione)} />
          </div>
        </div>

        <div className="mezmod-banner">
          <span className="mezmod-banner-dot" />
          <span>Registrato</span>
        </div>
      </div>
    </div>
  );
}
