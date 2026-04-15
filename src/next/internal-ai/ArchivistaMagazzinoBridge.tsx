import { useEffect, useMemo, useState } from "react";
import {
  archiveArchivistaDocumentRecord,
  findArchivistaDuplicateCandidates,
  formatValue,
  normalizeScalar,
  normalizeText,
  type ArchivistaArchiveResult,
  type ArchivistaDuplicateCandidate,
  type ArchivistaDuplicateChoice,
} from "./ArchivistaArchiveClient";

const DOCUMENT_ANALYZE_ENDPOINT =
  "https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/estrazioneDocumenti";

type ArchivistaMagazzinoVoce = {
  descrizione?: string;
  quantita?: string | number;
  prezzo?: string | number;
  prezzoUnitario?: string | number;
  importo?: string | number;
  totale?: string | number;
  codiceArticolo?: string;
  codice?: string;
  unita?: string;
};

type ArchivistaMagazzinoAnalysis = {
  tipoDocumento?: string;
  fornitore?: string;
  numeroDocumento?: string;
  dataDocumento?: string;
  imponibile?: string | number;
  ivaPercentuale?: string | number;
  ivaImporto?: string | number;
  totaleDocumento?: string | number;
  targa?: string;
  testo?: string;
  voci?: ArchivistaMagazzinoVoce[];
};

type ArchivistaMagazzinoApiResponse = {
  success?: boolean;
  data?: ArchivistaMagazzinoAnalysis;
  error?: string;
};

type AnalysisStatus = "idle" | "loading" | "success" | "error";
type DuplicateStatus = "idle" | "checking" | "ready" | "duplicates_found" | "error";
type ArchiveStatus = "idle" | "saving" | "success" | "error";

function formatRowsCount(value: ArchivistaMagazzinoVoce[] | undefined): string {
  return `${Array.isArray(value) ? value.length : 0}`;
}

function looksLikeMagazzinoDocument(tipoDocumento: string): boolean {
  const normalized = tipoDocumento.toUpperCase();
  return normalized.includes("FATTURA") || normalized.includes("DDT");
}

async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Errore lettura file."));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const parts = result.split(",");
      if (parts.length !== 2) {
        reject(new Error("Formato file non valido per l'analisi."));
        return;
      }
      resolve({
        base64: parts[1],
        mimeType: file.type || "application/octet-stream",
      });
    };
    reader.readAsDataURL(file);
  });
}

function normalizeAnalysisPayload(payload: unknown): ArchivistaMagazzinoAnalysis | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as ArchivistaMagazzinoApiResponse;
  if (record.data && typeof record.data === "object") {
    return record.data;
  }

  return payload as ArchivistaMagazzinoAnalysis;
}

export default function ArchivistaMagazzinoBridge() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>("idle");
  const [analysis, setAnalysis] = useState<ArchivistaMagazzinoAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateStatus, setDuplicateStatus] = useState<DuplicateStatus>("idle");
  const [duplicateCandidates, setDuplicateCandidates] = useState<ArchivistaDuplicateCandidate[]>([]);
  const [selectedDuplicateId, setSelectedDuplicateId] = useState<string>("");
  const [duplicateChoice, setDuplicateChoice] = useState<ArchivistaDuplicateChoice | null>(null);
  const [archiveStatus, setArchiveStatus] = useState<ArchiveStatus>("idle");
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [archiveResult, setArchiveResult] = useState<ArchivistaArchiveResult | null>(null);

  useEffect(() => {
    if (!selectedFile || !selectedFile.type.startsWith("image/")) {
      setImagePreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(selectedFile);
    setImagePreviewUrl(previewUrl);
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [selectedFile]);

  const rows = analysis?.voci ?? [];
  const missingFields = useMemo(() => {
    if (!analysis) return [];
    const nextMissing: string[] = [];
    if (!normalizeText(analysis.fornitore)) nextMissing.push("Fornitore");
    if (!normalizeText(analysis.numeroDocumento)) nextMissing.push("Numero documento");
    if (!normalizeText(analysis.dataDocumento)) nextMissing.push("Data documento");
    if (!normalizeScalar(analysis.totaleDocumento)) nextMissing.push("Totale documento");
    return nextMissing;
  }, [analysis]);

  const warnings = useMemo(() => {
    if (!analysis) return [];

    const nextWarnings: string[] = [];
    if (!normalizeText(analysis.fornitore)) {
      nextWarnings.push("Il fornitore non e stato letto in modo chiaro.");
    }
    if (!normalizeText(analysis.numeroDocumento)) {
      nextWarnings.push("Il numero documento non e stato letto in modo chiaro.");
    }
    if (!normalizeScalar(analysis.totaleDocumento)) {
      nextWarnings.push("Il totale documento non e stato letto in modo chiaro.");
    }
    if (!rows.length) {
      nextWarnings.push("Nessuna riga materiale trovata nel documento.");
    }
    const tipoDocumento = normalizeText(analysis.tipoDocumento);
    if (tipoDocumento && !looksLikeMagazzinoDocument(tipoDocumento)) {
      nextWarnings.push(
        `Il tipo letto e "${tipoDocumento}". Verifica che il file appartenga davvero al ramo Fattura / DDT Magazzino.`,
      );
    }
    return nextWarnings;
  }, [analysis, rows.length]);

  const duplicateCandidateSelected =
    duplicateCandidates.find((entry) => entry.id === selectedDuplicateId) ??
    duplicateCandidates[0] ??
    null;

  const summaryText = useMemo(() => {
    if (!analysis) {
      return "Carica una fattura o un DDT di magazzino e avvia l'analisi. Archivista prepara la review, controlla i duplicati e archivia il documento solo dopo la tua conferma esplicita.";
    }

    return "Analisi completata. Questa review riguarda solo il ramo Magazzino: puoi verificare duplicati e confermare l'archiviazione senza aprire carichi stock o altri handoff business.";
  }, [analysis]);

  const statusLabel =
    analysisStatus === "loading"
      ? "Analisi in corso"
      : analysisStatus === "success"
      ? "Analisi completata"
      : analysisStatus === "error"
      ? "Errore analisi"
      : "Pronto per analizzare";

  const statusDescription =
    analysisStatus === "loading"
      ? "Il file viene letto con il motore documentale gia attivo nel progetto."
      : analysisStatus === "success"
      ? "La review sotto mostra i dati principali e le righe trovate."
      : analysisStatus === "error"
      ? "Controlla il file e riprova."
      : "In questo step puoi analizzare un documento alla volta.";

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setErrorMessage("Carica prima un file o una foto del documento.");
      setAnalysisStatus("error");
      return;
    }

    try {
      setAnalysisStatus("loading");
      setErrorMessage(null);
      setArchiveError(null);
      setArchiveResult(null);
      setAnalysis(null);
      setDuplicateStatus("idle");
      setDuplicateCandidates([]);
      setSelectedDuplicateId("");
      setDuplicateChoice(null);
      setArchiveStatus("idle");

      const { base64, mimeType } = await fileToBase64(selectedFile);
      const response = await fetch(DOCUMENT_ANALYZE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: base64,
          mimeType,
        }),
      });

      const rawPayload = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        const errorText =
          rawPayload &&
          typeof rawPayload === "object" &&
          "error" in rawPayload &&
          typeof (rawPayload as { error?: unknown }).error === "string"
            ? (rawPayload as { error: string }).error
            : "Errore durante l'analisi del documento.";
        throw new Error(errorText);
      }

      const normalizedAnalysis = normalizeAnalysisPayload(rawPayload);
      if (!normalizedAnalysis) {
        throw new Error("Analisi non disponibile per il documento selezionato.");
      }

      setAnalysis(normalizedAnalysis);
      setAnalysisStatus("success");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Errore durante l'analisi.");
      setAnalysisStatus("error");
    }
  };

  const handleCheckDuplicates = async () => {
    if (!analysis) return;

    try {
      setDuplicateStatus("checking");
      setArchiveError(null);
      const matches = await findArchivistaDuplicateCandidates({
        family: "fattura_ddt_magazzino",
        target: "@documenti_magazzino",
        fornitore: analysis.fornitore,
        numeroDocumento: analysis.numeroDocumento,
        dataDocumento: analysis.dataDocumento,
        totaleDocumento: analysis.totaleDocumento,
        targa: analysis.targa,
      });

      setDuplicateCandidates(matches);
      setSelectedDuplicateId(matches[0]?.id ?? "");
      setDuplicateChoice(null);
      setDuplicateStatus(matches.length ? "duplicates_found" : "ready");
    } catch (error) {
      setArchiveError(
        error instanceof Error ? error.message : "Controllo duplicati non completato per il documento.",
      );
      setDuplicateStatus("error");
    }
  };

  const handleArchive = async () => {
    if (!selectedFile || !analysis) return;
    if (duplicateStatus === "idle") {
      setArchiveError("Controlla duplicati prima della conferma finale.");
      return;
    }
    if (duplicateStatus === "duplicates_found" && !duplicateChoice) {
      setArchiveError("Scegli prima come gestire il possibile duplicato trovato in archivio.");
      return;
    }

    try {
      setArchiveStatus("saving");
      setArchiveError(null);
      const result = await archiveArchivistaDocumentRecord({
        family: "fattura_ddt_magazzino",
        context: "magazzino",
        targetCollection: "@documenti_magazzino",
        categoriaArchivio: "MAGAZZINO",
        selectedFile,
        fileName: selectedFile.name,
        duplicateChoice,
        duplicateCandidate: duplicateCandidateSelected,
        basePayload: {
          tipoDocumento: analysis.tipoDocumento,
          fornitore: analysis.fornitore || null,
          numeroDocumento: analysis.numeroDocumento || null,
          dataDocumento: analysis.dataDocumento || null,
          imponibile: analysis.imponibile ?? null,
          ivaPercentuale: analysis.ivaPercentuale ?? null,
          ivaImporto: analysis.ivaImporto ?? null,
          totaleDocumento: analysis.totaleDocumento ?? null,
          targa: analysis.targa || null,
          testo: analysis.testo || null,
          voci: rows,
          riassuntoBreve: summaryText,
          avvisi: warnings,
          campiMancanti: missingFields,
        },
      });
      setArchiveResult(result);
      setArchiveStatus("success");
    } catch (error) {
      setArchiveError(error instanceof Error ? error.message : "Archiviazione non completata.");
      setArchiveStatus("error");
    }
  };

  return (
    <div className="ia-archivista-bridge">
      <div className="ia-archivista-bridge__intro">
        <div className="ia-archivista-bridge__intro-copy">
          <p className="internal-ai-card__eyebrow">Ramo attivo in questo step</p>
          <h3>Fattura / DDT + Magazzino</h3>
          <p>{summaryText}</p>
        </div>
        <span className="ia-archivista__flow-badge is-active">Attivo ora</span>
      </div>

      <label className="ia-archivista__upload ia-archivista-bridge__upload">
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(event) => {
            const nextFile = event.target.files?.[0] ?? null;
            setSelectedFile(nextFile);
            setAnalysis(null);
            setAnalysisStatus("idle");
            setErrorMessage(null);
          }}
        />
        <strong>Carica fattura o DDT di magazzino</strong>
        <span>Supporta PDF, foto e scansioni. In questo step analizzi un documento alla volta.</span>
        <p className="internal-ai-card__meta">
          {selectedFile ? selectedFile.name : "Nessun file selezionato"}
        </p>
      </label>

      {selectedFile ? (
        <div className="ia-archivista-bridge__file-meta">
          <span className="ia-archivista__file-pill">{selectedFile.name}</span>
          <span className="ia-archivista-bridge__file-hint">
            {selectedFile.type === "application/pdf" ? "PDF pronto" : "Immagine pronta"}
          </span>
        </div>
      ) : null}

      <div className="ia-archivista-bridge__actions">
        <button
          type="button"
          className="internal-ai-search__button ia-archivista__analyze-button"
          disabled={!selectedFile || analysisStatus === "loading"}
          onClick={handleAnalyze}
        >
          {analysisStatus === "loading" ? "Analisi in corso..." : "Analizza documento"}
        </button>
        <p className="internal-ai-card__meta">
          Nessun salvataggio parte in automatico: l'archiviazione avanza solo dopo la tua conferma.
        </p>
      </div>

      {errorMessage ? <div className="ia-archivista__notice">{errorMessage}</div> : null}
      {archiveError ? <div className="ia-archivista__notice">{archiveError}</div> : null}

      <div className="ia-archivista-bridge__review-grid">
        <article className="internal-ai-card ia-archivista-bridge__review-card">
          <div className="ia-archivista-bridge__review-head">
            <p className="internal-ai-card__eyebrow">Documento originale</p>
            <strong>{selectedFile ? selectedFile.name : "In attesa del file"}</strong>
          </div>

          {imagePreviewUrl ? (
            <img
              src={imagePreviewUrl}
              alt="Anteprima documento caricato"
              className="ia-archivista-bridge__image-preview"
            />
          ) : (
            <div className="ia-archivista-bridge__preview-placeholder">
              {selectedFile
                ? "Anteprima PDF disponibile dopo l'apertura del file originale."
                : "Qui vedrai l'anteprima del documento caricato."}
            </div>
          )}

          <div className="ia-archivista-bridge__status-box">
            <p className="internal-ai-card__eyebrow">Stato analisi</p>
            <strong>{statusLabel}</strong>
            <p>{statusDescription}</p>
          </div>
        </article>

        <article className="internal-ai-card ia-archivista-bridge__review-card">
          <div className="ia-archivista-bridge__review-head">
            <p className="internal-ai-card__eyebrow">Dati estratti principali</p>
            <strong>Review Magazzino</strong>
          </div>

          <dl className="ia-archivista-bridge__facts">
            <div>
              <dt>Tipo documento</dt>
              <dd>{formatValue(analysis?.tipoDocumento)}</dd>
            </div>
            <div>
              <dt>Fornitore</dt>
              <dd>{formatValue(analysis?.fornitore)}</dd>
            </div>
            <div>
              <dt>Numero</dt>
              <dd>{formatValue(analysis?.numeroDocumento)}</dd>
            </div>
            <div>
              <dt>Data</dt>
              <dd>{formatValue(analysis?.dataDocumento)}</dd>
            </div>
            <div>
              <dt>Totale</dt>
              <dd>{formatValue(analysis?.totaleDocumento)}</dd>
            </div>
            <div>
              <dt>Righe trovate</dt>
              <dd>{formatRowsCount(analysis?.voci)}</dd>
            </div>
          </dl>

          <div className="ia-archivista-bridge__summary">
            <p className="internal-ai-card__eyebrow">Riassunto breve</p>
            <p>{summaryText}</p>
          </div>
        </article>

        <article className="internal-ai-card ia-archivista-bridge__review-card">
          <div className="ia-archivista-bridge__review-head">
            <p className="internal-ai-card__eyebrow">Righe e avvisi</p>
            <strong>{rows.length ? "Dettaglio righe trovate" : "In attesa del risultato"}</strong>
          </div>

          {rows.length ? (
            <div className="ia-archivista-bridge__rows">
              {rows.map((row, index) => (
                <article
                  key={`${row.descrizione ?? "voce"}-${index}`}
                  className="ia-archivista-bridge__row"
                >
                  <strong>{normalizeText(row.descrizione) || `Voce ${index + 1}`}</strong>
                  <div className="ia-archivista-bridge__row-meta">
                    <span>Qta: {formatValue(row.quantita, "-")}</span>
                    <span>Unita: {formatValue(row.unita, "-")}</span>
                    <span>Prezzo: {formatValue(row.prezzoUnitario ?? row.prezzo, "-")}</span>
                    <span>Totale: {formatValue(row.importo ?? row.totale, "-")}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="ia-archivista-bridge__empty">
              <p className="ia-archivista-bridge__empty-title">Nessuna riga disponibile</p>
              <p className="ia-archivista-bridge__empty-copy">
                Dopo l&apos;analisi vedrai qui le righe materiali trovate nel documento.
              </p>
            </div>
          )}

          <div className="ia-archivista-bridge__warnings">
            <p className="internal-ai-card__eyebrow">Avvisi</p>
            {warnings.length ? (
              <ul className="ia-archivista-bridge__warning-list">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : (
              <p className="ia-archivista-bridge__warning-empty">
                Nessun avviso bloccante rilevato in questa review.
              </p>
            )}
          </div>
        </article>
      </div>

      <div className="ia-archivista-bridge__archive-grid">
        <article className="internal-ai-card ia-archivista-bridge__review-card">
          <div className="ia-archivista-bridge__review-head">
            <p className="internal-ai-card__eyebrow">Stato archivio</p>
            <strong>Conferma prima del salvataggio</strong>
          </div>

          <div className="ia-archivista-bridge__callout-stack">
            <div className="ia-archivista-bridge__callout is-highlight">
              <strong>{archiveResult ? "Documento archiviato" : "Documento analizzato"}</strong>
              <p>
                {archiveResult
                  ? archiveResult.message
                  : "La review e pronta. Il documento non e ancora archiviato finche non confermi."}
              </p>
            </div>
            <div className="ia-archivista-bridge__callout">
              <strong>{archiveResult ? "Originale disponibile" : "Non ancora archiviato"}</strong>
              <p>
                {archiveResult?.fileUrl
                  ? "L'originale archiviato e disponibile nel link qui sotto."
                  : "L'originale verra caricato solo dopo la conferma finale dell'utente."}
              </p>
            </div>
            <div className="ia-archivista-bridge__callout is-warning">
              <strong>Nessuna azione stock automatica</strong>
              <p>Questo ramo archivia il documento ma non carica stock e non apre business flow.</p>
            </div>
          </div>

          {archiveResult?.fileUrl ? (
            <div className="ia-archivista-bridge__callout">
              <strong>Originale archiviato</strong>
              <p>
                <a href={archiveResult.fileUrl} target="_blank" rel="noreferrer">
                  Apri originale archiviato
                </a>
              </p>
            </div>
          ) : null}
        </article>

        <article className="internal-ai-card ia-archivista-bridge__review-card">
          <div className="ia-archivista-bridge__review-head">
            <p className="internal-ai-card__eyebrow">Controllo duplicati</p>
            <strong>Archivio documenti magazzino</strong>
          </div>

          <div className="ia-archivista-bridge__actions">
            <button
              type="button"
              className="internal-ai-search__button ia-archivista__analyze-button"
              disabled={!analysis || duplicateStatus === "checking"}
              onClick={handleCheckDuplicates}
            >
              {duplicateStatus === "checking" ? "Controllo in corso..." : "Controlla duplicati"}
            </button>
            <p className="internal-ai-card__meta">
              Se il match e forte, Archivista ti chiede una scelta secca e non decide da solo.
            </p>
          </div>

          {duplicateCandidates.length ? (
            <div className="ia-archivista-bridge__rows">
              {duplicateCandidates.map((candidate) => (
                <article
                  key={candidate.id}
                  className={`ia-archivista-bridge__row ${selectedDuplicateId === candidate.id ? "is-selected" : ""}`}
                >
                  <div className="ia-archivista-bridge__row-head">
                    <strong>{candidate.title}</strong>
                    <button
                      type="button"
                      className="ia-archivista-bridge__ghost-button"
                      onClick={() => setSelectedDuplicateId(candidate.id)}
                    >
                      {selectedDuplicateId === candidate.id ? "Selezionato" : "Usa questo"}
                    </button>
                  </div>
                  <p className="ia-archivista-bridge__row-note">{candidate.subtitle || "Archivio esistente"}</p>
                  <div className="ia-archivista-bridge__pill-row">
                    {candidate.matchedFields.map((field) => (
                      <span key={field} className="ia-archivista-bridge__mini-pill">
                        {field}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : duplicateStatus === "ready" ? (
            <div className="ia-archivista-bridge__callout is-highlight">
              <strong>Nessun duplicato forte</strong>
              <p>Puoi procedere con la conferma finale dell'archiviazione.</p>
            </div>
          ) : (
            <div className="ia-archivista-bridge__empty">
              <p className="ia-archivista-bridge__empty-title">Controllo non ancora eseguito</p>
              <p className="ia-archivista-bridge__empty-copy">
                Prima della conferma finale puoi controllare se esiste gia un documento molto simile in archivio.
              </p>
            </div>
          )}

          {duplicateCandidateSelected ? (
            <div className="ia-archivista-bridge__choice-grid">
              <button
                type="button"
                className={`ia-archivista-bridge__choice ${duplicateChoice === "stesso_documento" ? "is-active" : ""}`}
                onClick={() => setDuplicateChoice("stesso_documento")}
              >
                Stesso documento
              </button>
              <button
                type="button"
                className={`ia-archivista-bridge__choice ${duplicateChoice === "versione_migliore" ? "is-active" : ""}`}
                onClick={() => setDuplicateChoice("versione_migliore")}
              >
                Versione migliore
              </button>
              <button
                type="button"
                className={`ia-archivista-bridge__choice ${duplicateChoice === "documento_diverso" ? "is-active" : ""}`}
                onClick={() => setDuplicateChoice("documento_diverso")}
              >
                Documento diverso
              </button>
            </div>
          ) : null}
        </article>
      </div>

      <article className="internal-ai-card ia-archivista-bridge__review-card">
        <div className="ia-archivista-bridge__review-head">
          <p className="internal-ai-card__eyebrow">Conferma finale</p>
          <strong>Archiviazione Fattura / DDT + Magazzino</strong>
        </div>

        <div className="ia-archivista-bridge__actions">
          <button
            type="button"
            className="internal-ai-search__button ia-archivista__analyze-button"
            disabled={
              !analysis ||
              !selectedFile ||
              archiveStatus === "saving" ||
              duplicateStatus === "idle" ||
              duplicateStatus === "checking" ||
              (duplicateStatus === "duplicates_found" && !duplicateChoice)
            }
            onClick={handleArchive}
          >
            {archiveStatus === "saving" ? "Archiviazione in corso..." : "Conferma e archivia"}
          </button>
          <p className="internal-ai-card__meta">
            Conferma esplicita richiesta: il documento viene archiviato solo quando premi il pulsante.
          </p>
        </div>
      </article>
    </div>
  );
}
