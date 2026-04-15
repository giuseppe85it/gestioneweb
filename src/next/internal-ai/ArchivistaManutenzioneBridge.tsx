import { useEffect, useMemo, useState } from "react";
import {
  archiveArchivistaDocumentRecord,
  findArchivistaDuplicateCandidates,
  type ArchivistaArchiveResult,
  type ArchivistaDuplicateCandidate,
  type ArchivistaDuplicateChoice,
} from "./ArchivistaArchiveClient";
import { getInternalAiServerAdapterBaseUrl } from "./internalAiServerRepoUnderstandingClient";

const DOCUMENT_ANALYZE_PATH = "/internal-ai-backend/documents/manutenzione-analyze";

type ArchivistaManutenzioneVoce = {
  descrizione?: string;
  categoria?: string;
  quantita?: string | number;
  prezzo?: string | number;
  prezzoUnitario?: string | number;
  importo?: string | number;
  totale?: string | number;
  codiceArticolo?: string;
  codice?: string;
  unita?: string;
};

type ArchivistaManutenzioneAnalysis = {
  stato?: string;
  tipoDocumento?: string;
  fornitore?: string;
  numeroDocumento?: string;
  dataDocumento?: string;
  totaleDocumento?: string | number;
  targa?: string;
  km?: string | number;
  testo?: string;
  riassuntoBreve?: string;
  avvisi?: string[];
  campiMancanti?: string[];
  voci?: ArchivistaManutenzioneVoce[];
};

type ArchivistaManutenzioneApiResponse = {
  ok?: boolean;
  message?: string;
  data?: {
    analysis?: ArchivistaManutenzioneAnalysis;
  };
  error?: string;
};

type AnalysisStatus = "idle" | "loading" | "success" | "error";
type DuplicateStatus = "idle" | "checking" | "ready" | "duplicates_found" | "error";
type ArchiveStatus = "idle" | "saving" | "success" | "error";
type MaintenanceRowKind = "Materiali" | "Manodopera" | "Ricambi" | "Altro";

type ReviewRow = {
  descrizione: string;
  categoria: string;
  quantita: string;
  importo: string;
  codice: string;
  unita: string;
  kind: MaintenanceRowKind;
  tone: "materiali" | "manodopera" | "ricambi" | "altro";
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeScalar(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value}`;
  }
  return normalizeText(value);
}

function uniqueList(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  values.forEach((value) => {
    const normalized = normalizeText(value);
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    output.push(normalized);
  });
  return output;
}

function getDocumentAnalyzeUrl(): string | null {
  const baseUrl = getInternalAiServerAdapterBaseUrl();
  return baseUrl ? `${baseUrl}${DOCUMENT_ANALYZE_PATH}` : null;
}

function formatValue(value: unknown, fallback = "Non letto"): string {
  const normalized = normalizeScalar(value);
  return normalized || fallback;
}

function toSearchableText(value: unknown): string {
  return normalizeScalar(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function looksLikeInvoiceOrDdt(tipoDocumento: string): boolean {
  const normalized = tipoDocumento.toUpperCase();
  return normalized.includes("FATTURA") || normalized.includes("DDT");
}

function getRowAmount(row: ArchivistaManutenzioneVoce): string {
  return (
    normalizeScalar(row.importo) ||
    normalizeScalar(row.totale) ||
    normalizeScalar(row.prezzoUnitario) ||
    normalizeScalar(row.prezzo)
  );
}

function getRowQuantity(row: ArchivistaManutenzioneVoce): string {
  const quantity = normalizeScalar(row.quantita);
  const unit = normalizeText(row.unita);
  if (quantity && unit) {
    return `${quantity} ${unit}`;
  }
  return quantity;
}

function getToneFromKind(kind: MaintenanceRowKind): ReviewRow["tone"] {
  if (kind === "Materiali") return "materiali";
  if (kind === "Manodopera") return "manodopera";
  if (kind === "Ricambi") return "ricambi";
  return "altro";
}

function classifyMaintenanceRow(row: ArchivistaManutenzioneVoce): MaintenanceRowKind {
  const searchable = `${toSearchableText(row.categoria)} ${toSearchableText(row.descrizione)}`;

  if (
    /MANODOP|LAVORAZION|INTERVENTO|SERVIZIO|OFFICINA|MONTAGGIO|TAGLIANDO|REVISIONE|RIPARAZION/.test(
      searchable,
    )
  ) {
    return "Manodopera";
  }

  if (
    /RICAMB|PASTIGL|DISCO|FILTRO|CINGHIA|BATTERIA|PNEUMATIC|CUSCINETTO|POMPA|FRIZION|TURBINA|LAMPAD|ALTERNATORE|AMMORTIZZ|KIT/.test(
      searchable,
    )
  ) {
    return "Ricambi";
  }

  if (
    /MATERIA|CONSUMAB|OLIO|LUBRIFIC|LIQUIDO|ADDITIV|GRASSO|VERNICE|SIGILLANTE|DETERGENT|ANTIGELO/.test(
      searchable,
    )
  ) {
    return "Materiali";
  }

  return "Altro";
}

function hasMaintenanceSignals(
  analysis: ArchivistaManutenzioneAnalysis | null,
  reviewRows: ReviewRow[],
): boolean {
  const signalSource = [
    analysis?.tipoDocumento,
    analysis?.fornitore,
    analysis?.testo,
    ...reviewRows.map((row) => `${row.kind} ${row.descrizione} ${row.categoria}`),
  ]
    .map(toSearchableText)
    .join(" ");

  return /OFFICINA|MANODOP|RICAMB|INTERVENTO|TAGLIANDO|REVISIONE|RIPARAZION|MOTORE|FRENI|FRIZION|PNEUMATIC/.test(
    signalSource,
  );
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

function normalizeAnalysisPayload(payload: unknown): ArchivistaManutenzioneAnalysis | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as ArchivistaManutenzioneApiResponse;
  if (record.data?.analysis && typeof record.data.analysis === "object") {
    return record.data.analysis;
  }

  return payload as ArchivistaManutenzioneAnalysis;
}

export default function ArchivistaManutenzioneBridge() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>("idle");
  const [analysis, setAnalysis] = useState<ArchivistaManutenzioneAnalysis | null>(null);
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

  const reviewRows = useMemo<ReviewRow[]>(() => {
    return (analysis?.voci ?? []).map((row) => {
      const kind = classifyMaintenanceRow(row);
      return {
        descrizione: formatValue(row.descrizione, "Riga senza descrizione leggibile"),
        categoria: normalizeText(row.categoria) || kind,
        quantita: formatValue(getRowQuantity(row)),
        importo: formatValue(getRowAmount(row)),
        codice: formatValue(row.codice ?? row.codiceArticolo),
        unita: formatValue(row.unita, "Non letta"),
        kind,
        tone: getToneFromKind(kind),
      };
    });
  }, [analysis?.voci]);

  const missingFields = useMemo(() => {
    if (!analysis) return [];
    if (Array.isArray(analysis.campiMancanti) && analysis.campiMancanti.length > 0) {
      return uniqueList(analysis.campiMancanti);
    }

    const nextMissing: string[] = [];
    if (!normalizeText(analysis.targa)) {
      nextMissing.push("Targa del mezzo");
    }
    if (!normalizeText(analysis.fornitore)) {
      nextMissing.push("Fornitore officina");
    }
    if (!normalizeText(analysis.dataDocumento)) {
      nextMissing.push("Data documento");
    }
    if (!normalizeScalar(analysis.totaleDocumento)) {
      nextMissing.push("Totale documento");
    }
    return uniqueList(nextMissing);
  }, [analysis]);

  const warnings = useMemo(() => {
    if (!analysis) return [];

    const nextWarnings = Array.isArray(analysis.avvisi) ? [...analysis.avvisi] : [];
    const tipoDocumento = normalizeText(analysis.tipoDocumento);
    if (tipoDocumento && !looksLikeInvoiceOrDdt(tipoDocumento)) {
      nextWarnings.push(
        `Il tipo letto e "${tipoDocumento}". Verifica che il file appartenga davvero al ramo Fattura / DDT Manutenzione.`,
      );
    }
    if (!reviewRows.length) {
      nextWarnings.push(
        "Nessuna riga materiali, manodopera o ricambi e stata letta in modo strutturato.",
      );
    }
    if (!hasMaintenanceSignals(analysis, reviewRows)) {
      nextWarnings.push(
        "Il contenuto letto non mostra segnali forti di manutenzione: controlla ramo scelto e leggibilita del documento.",
      );
    }
    if (!normalizeText(analysis.targa)) {
      nextWarnings.push(
        "La targa non e stata letta in modo chiaro: verifica se compare solo nel testo libero o in zone poco leggibili.",
      );
    }
    if (!normalizeScalar(analysis.totaleDocumento)) {
      nextWarnings.push("Il totale documento richiede verifica manuale.");
    }
    return uniqueList(nextWarnings);
  }, [analysis, reviewRows]);

  const duplicateCandidateSelected =
    duplicateCandidates.find((entry) => entry.id === selectedDuplicateId) ??
    duplicateCandidates[0] ??
    null;

  const summaryText = useMemo(() => {
    if (!analysis) {
      return "Carica una fattura o un DDT di officina e avvia l'analisi. Archivista prepara la review manutenzione, controlla duplicati e archivia il documento solo dopo la tua conferma esplicita.";
    }

    if (normalizeText(analysis.riassuntoBreve)) {
      return `${normalizeText(analysis.riassuntoBreve)} La review sotto resta solo analitica: il documento non viene ancora archiviato e non nasce nessuna manutenzione nuova.`;
    }

    const summaryParts: string[] = [];
    const targa = normalizeText(analysis.targa);
    const supplier = normalizeText(analysis.fornitore);
    const date = normalizeText(analysis.dataDocumento);
    const total = normalizeScalar(analysis.totaleDocumento);

    if (targa) summaryParts.push(`mezzo ${targa}`);
    if (supplier) summaryParts.push(`officina ${supplier}`);
    if (date) summaryParts.push(`data ${date}`);
    if (total) summaryParts.push(`totale ${total}`);

    const intro = summaryParts.length
      ? `Documento letto per il ramo Manutenzione: ${summaryParts.join(", ")}.`
      : "Documento letto per il ramo Manutenzione con alcuni campi ancora da verificare.";

    return `${intro} La review sotto resta separata dal business: puoi archiviare il documento, ma non nasce nessuna manutenzione nuova.`;
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
      ? "Il file viene letto dal backend OpenAI server-side dedicato alla review manutenzione."
      : analysisStatus === "success"
      ? "La review manutenzione sotto mostra dati letti, righe trovate e punti da verificare."
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
      const endpoint = getDocumentAnalyzeUrl();
      if (!endpoint) {
        throw new Error(
          "Backend IA OpenAI non disponibile in questo ambiente. Avvia il server IA separato per analizzare il documento.",
        );
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileBase64: base64,
          contentBase64: base64,
          mimeType,
        }),
      });

      const rawPayload = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        let errorText = "Errore durante l'analisi del documento.";
        if (rawPayload && typeof rawPayload === "object") {
          if ("message" in rawPayload && typeof (rawPayload as { message?: unknown }).message === "string") {
            errorText = (rawPayload as { message: string }).message;
          } else if (
            "error" in rawPayload &&
            typeof (rawPayload as { error?: unknown }).error === "string"
          ) {
            errorText = (rawPayload as { error: string }).error;
          }
        }
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
        family: "fattura_ddt_manutenzione",
        target: "@documenti_mezzi",
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
        family: "fattura_ddt_manutenzione",
        context: "manutenzione",
        targetCollection: "@documenti_mezzi",
        categoriaArchivio: "MEZZO",
        selectedFile,
        fileName: selectedFile.name,
        duplicateChoice,
        duplicateCandidate: duplicateCandidateSelected,
        basePayload: {
          tipoDocumento: analysis.tipoDocumento,
          fornitore: analysis.fornitore || null,
          numeroDocumento: analysis.numeroDocumento || null,
          dataDocumento: analysis.dataDocumento || null,
          totaleDocumento: analysis.totaleDocumento ?? null,
          targa: analysis.targa || null,
          km: analysis.km ?? null,
          testo: analysis.testo || null,
          riassuntoBreve: analysis.riassuntoBreve || summaryText,
          avvisi: warnings,
          campiMancanti: missingFields,
          voci: reviewRows.map((row) => ({
            descrizione: row.descrizione,
            categoria: row.categoria,
            quantita: row.quantita,
            unita: row.unita,
            importo: row.importo,
            codice: row.codice,
          })),
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
          <h3>Fattura / DDT + Manutenzione</h3>
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
        <strong>Carica fattura o DDT officina</strong>
        <span>
          Supporta PDF, foto e scansioni. In questo step analizzi il caso manutenzione ma non salvi
          ancora nulla.
        </span>
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
          Review distinta da Magazzino: archivio solo su conferma, nessuna manutenzione viene creata.
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
            <strong>Review Manutenzione</strong>
          </div>

          <dl className="ia-archivista-bridge__facts">
            <div className={!normalizeText(analysis?.tipoDocumento) ? "is-missing" : ""}>
              <dt>Tipo documento</dt>
              <dd>{formatValue(analysis?.tipoDocumento)}</dd>
            </div>
            <div className={!normalizeText(analysis?.fornitore) ? "is-missing" : ""}>
              <dt>Fornitore officina</dt>
              <dd>{formatValue(analysis?.fornitore)}</dd>
            </div>
            <div className={!normalizeText(analysis?.numeroDocumento) ? "is-missing" : ""}>
              <dt>Numero</dt>
              <dd>{formatValue(analysis?.numeroDocumento)}</dd>
            </div>
            <div className={!normalizeText(analysis?.dataDocumento) ? "is-missing" : ""}>
              <dt>Data</dt>
              <dd>{formatValue(analysis?.dataDocumento)}</dd>
            </div>
            <div className={!normalizeText(analysis?.targa) ? "is-missing" : ""}>
              <dt>Targa</dt>
              <dd>{formatValue(analysis?.targa)}</dd>
            </div>
            <div className={!normalizeScalar(analysis?.totaleDocumento) ? "is-missing" : ""}>
              <dt>Totale</dt>
              <dd>{formatValue(analysis?.totaleDocumento)}</dd>
            </div>
            <div className={!normalizeScalar(analysis?.km) ? "is-missing" : ""}>
              <dt>Km letti</dt>
              <dd>{formatValue(analysis?.km)}</dd>
            </div>
            <div>
              <dt>Righe lette</dt>
              <dd>{reviewRows.length}</dd>
            </div>
          </dl>

          <div className="ia-archivista-bridge__summary">
            <p className="internal-ai-card__eyebrow">Riassunto breve</p>
            <p>{summaryText}</p>
          </div>
        </article>

        <article className="internal-ai-card ia-archivista-bridge__review-card">
          <div className="ia-archivista-bridge__review-head">
            <p className="internal-ai-card__eyebrow">Esito proposto</p>
            <strong>Review pronta, archivio su conferma</strong>
          </div>

          <div className="ia-archivista-bridge__callout-stack">
            <div className="ia-archivista-bridge__callout is-highlight">
              <strong>{archiveResult ? "Documento archiviato" : "Documento analizzato"}</strong>
              <p>
                {archiveResult
                  ? archiveResult.message
                  : "La review manutenzione e pronta per la verifica utente."}
              </p>
            </div>
            <div className="ia-archivista-bridge__callout">
              <strong>{archiveResult ? "Originale disponibile" : "Non ancora archiviato"}</strong>
              <p>
                {archiveResult?.fileUrl
                  ? "L'originale archiviato e disponibile nel link qui sotto."
                  : "L'archiviazione finale parte solo dopo la conferma dell'utente."}
              </p>
            </div>
            <div className="ia-archivista-bridge__callout is-warning">
              <strong>Nessuna manutenzione ancora creata</strong>
              <p>Il sistema non crea e non aggiorna manutenzioni in questo step.</p>
            </div>
          </div>

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
                Nessun avviso forte: resta comunque richiesta la verifica utente prima dei passi
                successivi.
              </p>
            )}
          </div>

          <div className="ia-archivista-bridge__list-box">
            <p className="internal-ai-card__eyebrow">Campi mancanti</p>
            {missingFields.length ? (
              <ul className="ia-archivista-bridge__list">
                {missingFields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            ) : (
              <p className="ia-archivista-bridge__warning-empty">
                Nessun campo principale mancante tra targa, officina, data e totale.
              </p>
            )}
          </div>

          <div className="ia-archivista-bridge__next-actions">
            <p className="internal-ai-card__eyebrow">Passi futuri previsti</p>
            <div className="ia-archivista-bridge__next-action">
              <strong>Collega a manutenzione esistente</strong>
              <span>Opzione prevista piu avanti, non eseguibile in questa patch.</span>
            </div>
            <div className="ia-archivista-bridge__next-action">
              <strong>Crea nuova manutenzione</strong>
              <span>Opzione prevista piu avanti, non eseguibile in questa patch.</span>
            </div>
            <div className="ia-archivista-bridge__next-action">
              <strong>Lascia solo archiviato</strong>
              <span>Opzione prevista piu avanti, non eseguibile in questa patch.</span>
            </div>
          </div>
        </article>
      </div>

      <article className="internal-ai-card ia-archivista-bridge__rows-card">
        <div className="ia-archivista-bridge__review-head">
          <p className="internal-ai-card__eyebrow">Righe trovate</p>
          <strong>Materiali, manodopera e ricambi</strong>
        </div>

        {reviewRows.length ? (
          <div className="ia-archivista-bridge__rows">
            {reviewRows.map((row, index) => (
              <div className="ia-archivista-bridge__row" key={`${row.descrizione}-${index}`}>
                <div className="ia-archivista-bridge__row-head">
                  <strong>{row.descrizione}</strong>
                  <span className={`ia-archivista-bridge__tone-pill is-${row.tone}`}>
                    {row.kind}
                  </span>
                </div>
                <div className="ia-archivista-bridge__row-meta">
                  <span>Categoria letta: {row.categoria}</span>
                  <span>Quantita: {row.quantita}</span>
                  <span>Importo: {row.importo}</span>
                  <span>Codice: {row.codice}</span>
                </div>
                <p className="ia-archivista-bridge__row-note">Unita letta: {row.unita}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="ia-archivista-bridge__empty">
            <p className="ia-archivista-bridge__empty-title">Nessuna riga strutturata trovata</p>
            <p className="ia-archivista-bridge__empty-copy">
              Il documento puo comunque essere utile per la review, ma materiali, manodopera o
              ricambi non sono stati letti in modo affidabile.
            </p>
          </div>
        )}
      </article>

      <div className="ia-archivista-bridge__archive-grid">
        <article className="internal-ai-card ia-archivista-bridge__review-card">
          <div className="ia-archivista-bridge__review-head">
            <p className="internal-ai-card__eyebrow">Controllo duplicati</p>
            <strong>Archivio documenti mezzi</strong>
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

        <article className="internal-ai-card ia-archivista-bridge__review-card">
          <div className="ia-archivista-bridge__review-head">
            <p className="internal-ai-card__eyebrow">Conferma finale</p>
            <strong>Archiviazione Fattura / DDT + Manutenzione</strong>
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
      </div>
    </div>
  );
}
