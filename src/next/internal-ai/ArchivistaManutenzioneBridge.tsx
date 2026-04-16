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
  prezzo: string;
  codice: string;
  unita: string;
  kind: MaintenanceRowKind;
};

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

function getRowPrice(row: ArchivistaManutenzioneVoce): string {
  return normalizeScalar(row.prezzoUnitario) || normalizeScalar(row.prezzo);
}

function getRowQuantity(row: ArchivistaManutenzioneVoce): string {
  const quantity = normalizeScalar(row.quantita);
  const unit = normalizeText(row.unita);
  if (quantity && unit) {
    return `${quantity} ${unit}`;
  }
  return quantity;
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
  const [previewScale, setPreviewScale] = useState(1);
  const [previewRotation, setPreviewRotation] = useState(0);
  const [currency, setCurrency] = useState<"EUR" | "CHF">("EUR");
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
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

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
        quantita: formatValue(getRowQuantity(row), "-"),
        importo: formatValue(getRowAmount(row), "-"),
        prezzo: formatValue(getRowPrice(row), "-"),
        codice: formatValue(row.codice ?? row.codiceArticolo, "-"),
        unita: formatValue(row.unita, "-"),
        kind,
      };
    });
  }, [analysis?.voci]);

  useEffect(() => {
    if (!analysis) {
      setSelectedRowKeys([]);
      return;
    }
    setSelectedRowKeys(reviewRows.map((_, index) => `row-${index}`));
  }, [analysis, reviewRows]);

  const selectedRows = reviewRows.filter((_, index) => selectedRowKeys.includes(`row-${index}`));

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
    if (!selectedRows.length && reviewRows.length) {
      nextWarnings.push("Tutte le righe sono state escluse dalla tabella importabile.");
    }
    return uniqueList(nextWarnings);
  }, [analysis, reviewRows, selectedRows]);

  const duplicateCandidateSelected =
    duplicateCandidates.find((entry) => entry.id === selectedDuplicateId) ??
    duplicateCandidates[0] ??
    null;

  const summaryText = useMemo(() => {
    if (!analysis) {
      return "Carica una fattura o un DDT di officina e avvia l'analisi. Archivista prepara la review manutenzione, controlla duplicati e archivia il documento solo dopo la tua conferma esplicita.";
    }

    if (normalizeText(analysis.riassuntoBreve)) {
      return normalizeText(analysis.riassuntoBreve);
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

    return summaryParts.length
      ? `Documento letto per il ramo Manutenzione: ${summaryParts.join(", ")}.`
      : "Documento letto per il ramo Manutenzione con alcuni campi ancora da verificare.";
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
        ? "La review sotto mostra dati letti, righe trovate e punti da verificare."
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
          if (
            "message" in rawPayload &&
            typeof (rawPayload as { message?: unknown }).message === "string"
          ) {
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
          riassuntoBreve: summaryText,
          avvisi: warnings,
          campiMancanti: missingFields,
          valutaDocumento: currency,
          voci: selectedRows.map((row) => ({
            descrizione: row.descrizione,
            categoria: row.categoria,
            quantita: row.quantita,
            unita: row.unita,
            importo: row.importo,
            codice: row.codice,
            prezzoUnitario: row.prezzo,
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

  const toggleRow = (rowKey: string) => {
    setSelectedRowKeys((current) =>
      current.includes(rowKey) ? current.filter((entry) => entry !== rowKey) : [...current, rowKey],
    );
  };

  return (
    <div className="ia-archivista-bridge">
      <section className="next-panel ia-archivista__upload-shell iai-card">
        <div className="ia-archivista__upload-shell-head">
          <div>
            <p className="internal-ai-card__eyebrow iai-sec-label">Upload + Analizza</p>
            <h3 className="iai-upload-combo-label">Fattura / DDT + Manutenzione</h3>
          </div>
          <span className="ia-archivista__flow-badge is-active">Attivo ora</span>
        </div>

        <p className="ia-archivista__upload-shell-copy">
          {summaryText} Nessuna manutenzione viene creata in questo passaggio.
        </p>

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
              setArchiveError(null);
              setArchiveResult(null);
              setPreviewScale(1);
              setPreviewRotation(0);
            }}
          />
          <strong className="iai-btn-file">Scegli file</strong>
          <span className="iai-upload-hint">
            PDF, foto e scansioni. Il ramo resta distinto da Magazzino e non apre business flow.
          </span>
        </label>

        <div className="ia-archivista-bridge__upload-footer iai-upload-footer">
          <div className="ia-archivista-bridge__file-meta">
            {selectedFile ? (
              <>
                <span className="iai-file-chip">
                  {selectedFile.name}
                  <span className="iai-chip-badge">
                  {selectedFile.type === "application/pdf" ? "PDF pronto" : "Immagine pronta"}
                  </span>
                </span>
              </>
            ) : (
              <span className="iai-upload-hint">Nessun file selezionato</span>
            )}
          </div>

          <div className="ia-archivista-bridge__actions">
            <details className="internal-ai-nav__secondary">
              <summary title="Apri opzioni secondarie">...</summary>
              <div className="internal-ai-nav__secondary-links">
                <p className="internal-ai-card__meta">
                  Archivio solo su conferma. Nessun collegamento o creazione manutenzione in questo step.
                </p>
              </div>
            </details>
            <button
              type="button"
              className="internal-ai-search__button ia-archivista__analyze-button iai-btn-analizza"
              disabled={!selectedFile || analysisStatus === "loading"}
              onClick={handleAnalyze}
              title="Avvia l'analisi manutenzione del documento caricato"
            >
              {analysisStatus === "loading" ? "Analisi in corso..." : "Analizza documento"}
            </button>
          </div>
        </div>
      </section>

      {errorMessage ? <div className="ia-archivista__notice iai-avvisi-banner">{errorMessage}</div> : null}
      {archiveError ? <div className="ia-archivista__notice iai-avvisi-banner">{archiveError}</div> : null}

      <section className="ia-archivista-bridge__main-shell iai-top-grid">
        <article className="next-panel ia-archivista-bridge__preview-card iai-doc-viewer">
          <div className="ia-archivista-bridge__review-head iai-doc-topbar">
            <p className="internal-ai-card__eyebrow iai-doc-fname">Documento</p>
            <strong>{selectedFile ? selectedFile.name : "Anteprima in attesa"}</strong>
          </div>

          <div className="ia-archivista-bridge__preview-toolbar">
            <button
              type="button"
              className="ia-archivista-bridge__ghost-button iai-doc-tbtn"
              onClick={() => setPreviewScale((value) => Math.min(2, value + 0.1))}
              disabled={!imagePreviewUrl}
              title="Aumenta zoom anteprima"
            >
              Zoom +
            </button>
            <button
              type="button"
              className="ia-archivista-bridge__ghost-button iai-doc-tbtn"
              onClick={() => setPreviewScale((value) => Math.max(0.8, value - 0.1))}
              disabled={!imagePreviewUrl}
              title="Riduci zoom anteprima"
            >
              Zoom -
            </button>
            <button
              type="button"
              className="ia-archivista-bridge__ghost-button iai-doc-tbtn"
              onClick={() => setPreviewRotation((value) => value + 90)}
              disabled={!imagePreviewUrl}
              title="Ruota anteprima"
            >
              Ruota
            </button>
          </div>

          {imagePreviewUrl ? (
            <div className="ia-archivista-bridge__preview-frame iai-doc-body">
              <img
                src={imagePreviewUrl}
                alt="Anteprima documento caricato"
                className="ia-archivista-bridge__image-preview iai-doc-sheet-img"
                style={{ transform: `scale(${previewScale}) rotate(${previewRotation}deg)` }}
              />
            </div>
          ) : (
            <div className="ia-archivista-bridge__preview-placeholder iai-doc-body">
              {selectedFile
                ? "Per i PDF l'anteprima visuale si apre dal file originale archiviato."
                : "Qui vedrai il documento grande e controllabile a colpo d'occhio."}
            </div>
          )}
        </article>

        <aside className="ia-archivista-bridge__details-stack">
          <article className="next-panel ia-archivista-bridge__detail-card iai-fields-card">
            <div className="ia-archivista-bridge__review-head">
              <p className="internal-ai-card__eyebrow iai-sec-label">Dati estratti</p>
              <strong>Campi principali</strong>
            </div>

            <dl className="ia-archivista-bridge__facts iai-fields-list">
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
                <dt>Valuta</dt>
                <dd>
                  <select
                    className="ia-archivista-bridge__compact-select iai-field-select"
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value as "EUR" | "CHF")}
                    title="Seleziona la valuta del documento"
                  >
                    <option value="EUR">EUR</option>
                    <option value="CHF">CHF</option>
                  </select>
                </dd>
              </div>
            </dl>
          </article>

          <article className="next-panel ia-archivista-bridge__detail-card iai-card">
            <div className="ia-archivista-bridge__status-box">
              <p className="internal-ai-card__eyebrow">Stato analisi</p>
              <strong>{statusLabel}</strong>
              <p>{statusDescription}</p>
            </div>

            <div className="ia-archivista-bridge__summary">
              <p className="internal-ai-card__eyebrow">Riassunto breve</p>
              <p>{summaryText}</p>
            </div>

            <div className="ia-archivista-bridge__warnings">
              <p className="internal-ai-card__eyebrow">Avvisi e campi mancanti</p>
              {warnings.length ? (
                <ul className="ia-archivista-bridge__warning-list">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : (
                <p className="ia-archivista-bridge__warning-empty">
                  Nessun avviso forte: resta comunque richiesta la verifica utente.
                </p>
              )}
              {missingFields.length ? (
                <div className="ia-archivista-bridge__pill-row">
                  {missingFields.map((field) => (
                    <span key={field} className="ia-archivista-bridge__mini-pill">
                      {field}
                    </span>
                  ))}
                </div>
              ) : null}
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
                    ? "L'originale archiviato e disponibile nel link finale."
                    : "L'archiviazione finale parte solo dopo la conferma dell'utente."}
                </p>
              </div>
              <div className="ia-archivista-bridge__callout is-warning">
                <strong>Nessuna manutenzione ancora creata</strong>
                <p>Il sistema non crea e non aggiorna manutenzioni in questo step.</p>
              </div>
            </div>
          </article>
        </aside>
      </section>

      <section className="next-panel ia-archivista-bridge__rows-shell iai-card">
        <div className="ia-archivista-bridge__review-head iai-righe-header">
          <p className="internal-ai-card__eyebrow iai-sec-label">Righe documento</p>
          <strong>
            {reviewRows.length ? "Materiali, manodopera e ricambi" : "Nessuna riga letta"}
          </strong>
        </div>

        {reviewRows.length ? (
          <div className="ia-archivista-bridge__table-wrap">
            <table className="ia-archivista-bridge__table iai-righe-table">
              <thead>
                <tr>
                  <th>Descrizione</th>
                  <th>Quantita</th>
                  <th>Unita</th>
                  <th>Prezzo</th>
                  <th>Totale</th>
                  <th>Importa</th>
                </tr>
              </thead>
              <tbody>
                {reviewRows.map((row, index) => {
                  const rowKey = `row-${index}`;
                  const isSelected = selectedRowKeys.includes(rowKey);
                  return (
                    <tr key={rowKey} className={!isSelected ? "iai-row-unchecked" : ""}>
                      <td>
                        <div className="ia-archivista-bridge__table-cell-main">
                          <strong>{row.descrizione}</strong>
                          <span>{row.kind}</span>
                        </div>
                      </td>
                      <td>{row.quantita}</td>
                      <td>{row.unita}</td>
                      <td>{row.prezzo}</td>
                      <td>{row.importo}</td>
                      <td>
                        <label className="ia-archivista-bridge__table-check iai-row-cb">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(rowKey)}
                          />
                          <span>{isSelected ? "Si" : "No"}</span>
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ia-archivista-bridge__empty">
            <p className="ia-archivista-bridge__empty-title">Nessuna riga strutturata trovata</p>
            <p className="ia-archivista-bridge__empty-copy">
              Il documento puo comunque essere utile per la review, ma i dettagli non sono stati letti in modo affidabile.
            </p>
          </div>
        )}
      </section>

      <section className="ia-archivista-bridge__final-shell">
        <article className="next-panel ia-archivista-bridge__detail-card iai-card">
          <div className="ia-archivista-bridge__review-head">
            <p className="internal-ai-card__eyebrow">Duplicati</p>
            <strong>Scegli solo se trovi un match forte</strong>
          </div>

          <div className="ia-archivista-bridge__actions">
            <button
              type="button"
              className="internal-ai-search__button ia-archivista__analyze-button iai-btn-analizza"
              disabled={!analysis || duplicateStatus === "checking"}
              onClick={handleCheckDuplicates}
              title="Controlla se esiste gia un documento molto simile in archivio"
            >
              {duplicateStatus === "checking" ? "Controllo in corso..." : "Controlla duplicati"}
            </button>
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
                      title="Seleziona questo documento come match di confronto"
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
              <p>Puoi procedere con la conferma finale dell&apos;archiviazione.</p>
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
                title="Non crea un nuovo record"
              >
                Stesso documento
              </button>
              <button
                type="button"
                className={`ia-archivista-bridge__choice ${duplicateChoice === "versione_migliore" ? "is-active" : ""}`}
                onClick={() => setDuplicateChoice("versione_migliore")}
                title="Archivia una nuova versione mantenendo il precedente"
              >
                Versione migliore
              </button>
              <button
                type="button"
                className={`ia-archivista-bridge__choice ${duplicateChoice === "documento_diverso" ? "is-active" : ""}`}
                onClick={() => setDuplicateChoice("documento_diverso")}
                title="Archivia come documento separato"
              >
                Documento diverso
              </button>
            </div>
          ) : null}
        </article>

        <article className="next-panel ia-archivista-bridge__detail-card iai-confirm-bar">
          <div className="ia-archivista-bridge__review-head">
            <p className="internal-ai-card__eyebrow">Convalida finale</p>
            <strong>Archiviazione Fattura / DDT + Manutenzione</strong>
          </div>

          <div className="ia-archivista-bridge__final-actions">
            <button
              type="button"
              className="internal-ai-search__button ia-archivista__analyze-button iai-btn-conferma"
              disabled={
                !analysis ||
                !selectedFile ||
                archiveStatus === "saving" ||
                duplicateStatus === "idle" ||
                duplicateStatus === "checking" ||
                (duplicateStatus === "duplicates_found" && !duplicateChoice)
              }
              onClick={handleArchive}
              title="Conferma l'archiviazione finale del documento"
            >
              {archiveStatus === "saving" ? "Archiviazione in corso..." : "Conferma e archivia"}
            </button>
            <a
              href="/next/ia/documenti"
              className="internal-ai-nav__link"
              title="Apri lo storico documenti"
            >
              Apri storico
            </a>
            <details className="internal-ai-nav__secondary">
              <summary title="Apri opzioni secondarie">...</summary>
              <div className="internal-ai-nav__secondary-links">
                {archiveResult?.fileUrl ? (
                  <a href={archiveResult.fileUrl} target="_blank" rel="noreferrer">
                    Apri originale archiviato
                  </a>
                ) : (
                  <p className="internal-ai-card__meta">
                    L&apos;originale archiviato sara disponibile qui dopo la conferma finale.
                  </p>
                )}
              </div>
            </details>
          </div>
        </article>
      </section>
    </div>
  );
}
