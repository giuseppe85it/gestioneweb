import NextClonePageScaffold from "./NextClonePageScaffold";
import { NEXT_IA_PATH } from "./nextStructuralPaths";
import "../pages/IA/IADocumenti.css";

export default function NextIADocumentiPage() {
  return (
    <NextClonePageScaffold
      eyebrow="IA"
      title="Documenti IA"
      description="Route clone autonoma della pagina madre documenti IA. Upload, analisi, salvataggi documentali e sync inventario restano bloccati."
      backTo={NEXT_IA_PATH}
      backLabel="Hub IA"
      notice={
        <p>
          La pagina esiste ora come route clone vera. Il clone non nasconde il modulo, ma
          neutralizza upload file, analisi, salvataggi Firestore e aggiornamenti su inventario.
        </p>
      }
    >
      <div className="ia-doc-page">
        <div className="ia-doc-card">
          <div className="ia-doc-header">
            <h2>Analisi documento</h2>
            <p>Preventivi, fatture e documenti restano navigabili ma non operativi.</p>
          </div>

          <div className="ia-doc-upload-row">
            <label className="upload-label disabled" title="Clone read-only">
              Seleziona documento
            </label>
            <button className="ia-btn primary" type="button" disabled title="Clone read-only">
              Analizza con IA
            </button>
            <button className="ia-btn outline" type="button" disabled title="Clone read-only">
              Salva documento
            </button>
          </div>

          <div className="next-clone-placeholder" style={{ marginTop: 18 }}>
            <p>
              In questa fase il clone apre la pagina e mantiene la stessa autonomia di routing
              della madre, ma non attiva ancora il reader documentale completo ne gli upload.
            </p>
          </div>
        </div>
      </div>
    </NextClonePageScaffold>
  );
}

