import { useEffect, useMemo, useState } from "react";
import {
  applyArchivistaVehicleUpdate,
  archiveArchivistaDocumentRecord,
  buildArchivistaVehicleUpdatePreview,
  findArchivistaDuplicateCandidates,
  formatValue,
  normalizeText,
  readArchivistaVehicles,
  type ArchivistaArchiveResult,
  type ArchivistaDuplicateCandidate,
  type ArchivistaDuplicateChoice,
} from "./ArchivistaArchiveClient";
import { getInternalAiServerAdapterBaseUrl } from "./internalAiServerRepoUnderstandingClient";

const DOCUMENT_ANALYZE_PATH = "/internal-ai-backend/documents/documento-mezzo-analyze";

type ArchivistaDocumentoMezzoSubtype =
  | "libretto"
  | "assicurazione"
  | "revisione"
  | "collaudo";

type ArchivistaDocumentoMezzoAnalysis = {
  stato?: string;
  tipoDocumento?: string;
  sottotipoDocumento?: string;
  fornitore?: string;
  numeroDocumento?: string;
  dataDocumento?: string;
  targa?: string;
  telaio?: string;
  proprietario?: string;
  assicurazione?: string;
  marca?: string;
  modello?: string;
  dataImmatricolazione?: string;
  dataScadenza?: string;
  dataUltimoCollaudo?: string;
  dataScadenzaRevisione?: string;
  testo?: string;
  riassuntoBreve?: string;
  avvisi?: string[];
  campiMancanti?: string[];
};

type ArchivistaDocumentoMezzoApiResponse = {
  ok?: boolean;
  message?: string;
  data?: {
    analysis?: ArchivistaDocumentoMezzoAnalysis;
  };
  error?: string;
};

type AnalysisStatus = "idle" | "loading" | "success" | "error";
type DuplicateStatus = "idle" | "checking" | "ready" | "duplicates_found" | "error";
type ArchiveStatus = "idle" | "saving" | "success" | "error";

type VehicleOption = {
  id: string;
  targa: string;
  label: string;
};

type RawVehicle = Record<string, unknown> & {
  id?: string;
  targa?: string;
};

const SUBTYPE_OPTIONS: Array<{
  id: ArchivistaDocumentoMezzoSubtype;
  label: string;
  description: string;
}> = [
  { id: "libretto", label: "Libretto", description: "Dati veicolo, telaio e immatricolazione." },
  {
    id: "assicurazione",
    label: "Assicurazione",
    description: "Compagnia, copertura e riferimenti principali.",
  },
  { id: "revisione", label: "Revisione", description: "Scadenze e riferimenti revisione." },
  { id: "collaudo", label: "Collaudo", description: "Esito e data del collaudo mezzo." },
];

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
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

function normalizeAnalysisPayload(payload: unknown): ArchivistaDocumentoMezzoAnalysis | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as ArchivistaDocumentoMezzoApiResponse;
  if (record.data?.analysis && typeof record.data.analysis === "object") {
    return record.data.analysis;
  }

  return payload as ArchivistaDocumentoMezzoAnalysis;
}

function getDocumentAnalyzeUrl(): string | null {
  const baseUrl = getInternalAiServerAdapterBaseUrl();
  return baseUrl ? `${baseUrl}${DOCUMENT_ANALYZE_PATH}` : null;
}

function toVehicleOptions(rawVehicles: Array<Record<string, unknown>>): VehicleOption[] {
  return rawVehicles
    .map((entry) => {
      const id = normalizeText(entry.id);
      const targa = normalizeText(entry.targa).toUpperCase();
      const marca = normalizeText(entry.marca);
      const modello = normalizeText(entry.modello);
      if (!id || !targa) {
        return null;
      }
      return {
        id,
        targa,
        label: [targa, [marca, modello].filter(Boolean).join(" ")].filter(Boolean).join(" · "),
      };
    })
    .filter((entry): entry is VehicleOption => Boolean(entry))
    .sort((left, right) => left.targa.localeCompare(right.targa, "it"));
}

function buildMissingFields(analysis: ArchivistaDocumentoMezzoAnalysis | null): string[] {
  if (!analysis) {
    return [];
  }

  if (Array.isArray(analysis.campiMancanti) && analysis.campiMancanti.length > 0) {
    return analysis.campiMancanti.filter(Boolean);
  }

  const missing: string[] = [];
  if (!normalizeText(analysis.targa)) {
    missing.push("Targa mezzo");
  }
  if (!normalizeText(analysis.dataDocumento)) {
    missing.push("Data documento");
  }
  return missing;
}

export default function ArchivistaDocumentoMezzoBridge() {
  const [selectedSubtype, setSelectedSubtype] =
    useState<ArchivistaDocumentoMezzoSubtype>("libretto");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>("idle");
  const [analysis, setAnalysis] = useState<ArchivistaDocumentoMezzoAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawVehicles, setRawVehicles] = useState<RawVehicle[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [duplicateStatus, setDuplicateStatus] = useState<DuplicateStatus>("idle");
  const [duplicateCandidates, setDuplicateCandidates] = useState<ArchivistaDuplicateCandidate[]>([]);
  const [selectedDuplicateId, setSelectedDuplicateId] = useState<string>("");
  const [duplicateChoice, setDuplicateChoice] = useState<ArchivistaDuplicateChoice | null>(null);
  const [archiveStatus, setArchiveStatus] = useState<ArchiveStatus>("idle");
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [archiveResult, setArchiveResult] = useState<ArchivistaArchiveResult | null>(null);
  const [applyVehicleUpdateChoice, setApplyVehicleUpdateChoice] = useState<boolean>(false);
  const [vehicleUpdateMessage, setVehicleUpdateMessage] = useState<string | null>(null);

  useEffect(() => {
    readArchivistaVehicles()
      .then((items) => {
        setRawVehicles(items as RawVehicle[]);
        setVehicles(toVehicleOptions(items));
      })
      .catch(() => {
        setRawVehicles([]);
        setVehicles([]);
      });
  }, []);

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

  const selectedVehicle = useMemo(
    () => vehicles.find((entry) => entry.id === selectedVehicleId) ?? null,
    [selectedVehicleId, vehicles],
  );
  const selectedVehicleRecord = useMemo(
    () => rawVehicles.find((entry) => normalizeText(entry.id) === selectedVehicleId) ?? null,
    [rawVehicles, selectedVehicleId],
  );

  const missingFields = useMemo(() => buildMissingFields(analysis), [analysis]);
  const warnings = useMemo(() => {
    if (!analysis) {
      return [];
    }

    const nextWarnings = Array.isArray(analysis.avvisi) ? [...analysis.avvisi] : [];
    if (!selectedVehicleId) {
      nextWarnings.push("Seleziona il mezzo corretto prima di archiviare il documento.");
    }
    if (!normalizeText(analysis.targa)) {
      nextWarnings.push("La targa non e stata letta in modo chiaro: puo servire una scelta manuale del mezzo.");
    }
    return Array.from(new Set(nextWarnings.filter(Boolean)));
  }, [analysis, selectedVehicleId]);

  const summaryText = useMemo(() => {
    if (!analysis) {
      return "Seleziona il sottotipo, carica il documento e avvia l'analisi. Archivista mostra prima la review, poi ti chiede conferma esplicita per archiviare e per eventuale update del mezzo.";
    }

    return (
      normalizeText(analysis.riassuntoBreve) ||
      "Documento mezzo analizzato. Puoi collegarlo al mezzo corretto, verificare duplicati e decidere se aggiornare o no i campi del mezzo."
    );
  }, [analysis]);

  const vehicleUpdatePreview = useMemo(() => {
    if (!analysis || !selectedVehicleRecord) {
      return [];
    }

    return buildArchivistaVehicleUpdatePreview({
      mezzo: selectedVehicleRecord,
      subtype: selectedSubtype,
      analysis: analysis as unknown as Record<string, unknown>,
    });
  }, [analysis, selectedSubtype, selectedVehicleRecord]);

  const duplicateCandidateSelected =
    duplicateCandidates.find((entry) => entry.id === selectedDuplicateId) ??
    duplicateCandidates[0] ??
    null;

  const statusLabel =
    analysisStatus === "loading"
      ? "Analisi in corso"
      : analysisStatus === "success"
        ? "Analisi completata"
        : analysisStatus === "error"
          ? "Errore analisi"
          : "Pronto per analizzare";

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
      setVehicleUpdateMessage(null);
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
          "Backend IA OpenAI non disponibile in questo ambiente. Avvia il server IA separato per analizzare il documento mezzo.",
        );
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedFile.name,
          contentBase64: base64,
          mimeType,
          documentSubtypeHint: selectedSubtype,
        }),
      });

      const rawPayload = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        const errorText =
          rawPayload &&
          typeof rawPayload === "object" &&
          "message" in rawPayload &&
          typeof (rawPayload as { message?: unknown }).message === "string"
            ? (rawPayload as { message: string }).message
            : "Errore durante l'analisi del documento mezzo.";
        throw new Error(errorText);
      }

      const normalizedAnalysis = normalizeAnalysisPayload(rawPayload);
      if (!normalizedAnalysis) {
        throw new Error("Analisi non disponibile per il documento selezionato.");
      }

      setAnalysis(normalizedAnalysis);
      setAnalysisStatus("success");

      const nextRawVehicles = await readArchivistaVehicles();
      const nextVehicles = toVehicleOptions(nextRawVehicles);
      setRawVehicles(nextRawVehicles as RawVehicle[]);
      setVehicles(nextVehicles);
      const matchedVehicle =
        nextVehicles.find((entry) => entry.targa === normalizeText(normalizedAnalysis.targa).toUpperCase()) ??
        null;
      setSelectedVehicleId(matchedVehicle?.id ?? "");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Errore durante l'analisi.");
      setAnalysisStatus("error");
    }
  };

  const handleCheckDuplicates = async () => {
    if (!analysis) {
      return;
    }

    try {
      setDuplicateStatus("checking");
      setArchiveError(null);

      const matches = await findArchivistaDuplicateCandidates({
        family: "documento_mezzo",
        target: "@documenti_mezzi",
        fornitore: analysis.fornitore,
        numeroDocumento: analysis.numeroDocumento,
        dataDocumento: analysis.dataDocumento,
        targa: selectedVehicle?.targa || analysis.targa,
      });

      setDuplicateCandidates(matches);
      setSelectedDuplicateId(matches[0]?.id ?? "");
      setDuplicateChoice(null);
      setDuplicateStatus(matches.length ? "duplicates_found" : "ready");
    } catch (error) {
      setArchiveError(
        error instanceof Error
          ? error.message
          : "Controllo duplicati non completato per il documento mezzo.",
      );
      setDuplicateStatus("error");
    }
  };

  const handleArchive = async () => {
    if (!selectedFile || !analysis) {
      return;
    }
    if (duplicateStatus === "idle") {
      setArchiveError("Controlla duplicati prima della conferma finale.");
      return;
    }
    if (!selectedVehicleId) {
      setArchiveError("Seleziona il mezzo corretto prima della conferma di archiviazione.");
      return;
    }
    if (duplicateStatus === "duplicates_found" && !duplicateChoice) {
      setArchiveError("Scegli prima come gestire il possibile duplicato trovato in archivio.");
      return;
    }

    try {
      setArchiveStatus("saving");
      setArchiveError(null);
      setVehicleUpdateMessage(null);

      const result = await archiveArchivistaDocumentRecord({
        family: "documento_mezzo",
        context: "documento_mezzo",
        targetCollection: "@documenti_mezzi",
        categoriaArchivio: "MEZZO",
        selectedFile,
        fileName: selectedFile.name,
        duplicateChoice,
        duplicateCandidate: duplicateCandidateSelected,
        basePayload: {
          tipoDocumento: analysis.tipoDocumento,
          sottotipoDocumentoMezzo: selectedSubtype,
          fornitore: analysis.fornitore || null,
          numeroDocumento: analysis.numeroDocumento || null,
          dataDocumento: analysis.dataDocumento || null,
          targa: selectedVehicle?.targa || analysis.targa || null,
          mezzoId: selectedVehicleId,
          telaio: analysis.telaio || null,
          proprietario: analysis.proprietario || null,
          assicurazione: analysis.assicurazione || null,
          marca: analysis.marca || null,
          modello: analysis.modello || null,
          dataImmatricolazione: analysis.dataImmatricolazione || null,
          dataScadenza: analysis.dataScadenza || null,
          dataUltimoCollaudo: analysis.dataUltimoCollaudo || null,
          dataScadenzaRevisione: analysis.dataScadenzaRevisione || null,
          riassuntoBreve: analysis.riassuntoBreve || null,
          testo: analysis.testo || null,
          campiMancanti: missingFields,
          avvisi: warnings,
          documentoMezzoAggiornamentoConfermato: applyVehicleUpdateChoice,
        },
      });

      if (applyVehicleUpdateChoice && result.status === "archived") {
        const vehicleUpdate = await applyArchivistaVehicleUpdate({
          mezzoId: selectedVehicleId,
          subtype: selectedSubtype,
          analysis: analysis as unknown as Record<string, unknown>,
        });
        setVehicleUpdateMessage(
          vehicleUpdate.appliedFields.length
            ? `Campi mezzo aggiornati su conferma: ${vehicleUpdate.appliedFields
                .map((field) => field.label)
                .join(", ")}.`
            : "Nessun campo mezzo cambiato: i valori letti coincidevano gia con il mezzo selezionato.",
        );
      }

      setArchiveResult(result);
      setArchiveStatus("success");
    } catch (error) {
      setArchiveError(error instanceof Error ? error.message : "Archiviazione non completata.");
      setArchiveStatus("error");
    }
  };

  return (
    <div className="ia-archivista-bridge">
      <div className="ia-archivista-bridge__intro iai-card">
        <div className="ia-archivista-bridge__intro-copy">
          <p className="internal-ai-card__eyebrow iai-sec-label">Ramo attivo in questo step</p>
          <h3>Documento mezzo</h3>
          <p>{summaryText}</p>
        </div>
        <span className="ia-archivista__flow-badge is-active">Attivo ora</span>
      </div>

      <div className="ia-archivista-bridge__segmented iai-card">
        {SUBTYPE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`ia-archivista-bridge__segment ${selectedSubtype === option.id ? "is-active" : ""}`}
            onClick={() => {
              setSelectedSubtype(option.id);
              setArchiveResult(null);
              setArchiveStatus("idle");
            }}
          >
            <strong>{option.label}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>

      <label className="ia-archivista__upload ia-archivista-bridge__upload iai-card">
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(event) => {
            const nextFile = event.target.files?.[0] ?? null;
            setSelectedFile(nextFile);
            setAnalysis(null);
            setAnalysisStatus("idle");
            setErrorMessage(null);
            setArchiveResult(null);
            setArchiveStatus("idle");
            setDuplicateStatus("idle");
            setDuplicateCandidates([]);
            setDuplicateChoice(null);
            setSelectedDuplicateId("");
          }}
        />
        <strong className="iai-upload-combo-label">Carica documento mezzo</strong>
        <span className="iai-upload-hint">
          PDF, foto e scansioni. Prima scegli il sottotipo, poi analizzi il documento.
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
          className="internal-ai-search__button ia-archivista__analyze-button iai-btn-analizza"
          disabled={!selectedFile || analysisStatus === "loading"}
          onClick={handleAnalyze}
        >
          {analysisStatus === "loading" ? "Analisi in corso..." : "Analizza documento"}
        </button>
        <p className="internal-ai-card__meta">
          Nessun salvataggio parte da solo: prima review, poi verifica duplicati, poi conferma.
        </p>
      </div>

      {errorMessage ? <div className="ia-archivista__notice iai-avvisi-banner">{errorMessage}</div> : null}
      {archiveError ? <div className="ia-archivista__notice iai-avvisi-banner">{archiveError}</div> : null}

      <div className="ia-archivista-bridge__review-grid iai-top-grid iai-top-grid--stacked-right">
        <article className="internal-ai-card ia-archivista-bridge__review-card iai-doc-viewer">
          <div className="ia-archivista-bridge__review-head">
            <p className="internal-ai-card__eyebrow">Documento originale</p>
            <strong>{selectedFile ? selectedFile.name : "In attesa del file"}</strong>
          </div>

          {imagePreviewUrl ? (
            <img
              src={imagePreviewUrl}
              alt="Anteprima documento mezzo caricato"
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
            <p>
              {analysisStatus === "success"
                ? "Review documento mezzo pronta per la verifica utente."
                : "Questo ramo archivia prima il documento e aggiorna il mezzo solo su conferma esplicita."}
            </p>
          </div>
        </article>

        <article className="internal-ai-card ia-archivista-bridge__review-card iai-fields-card">
          <div className="ia-archivista-bridge__review-head">
            <p className="internal-ai-card__eyebrow">Dati letti</p>
            <strong>Review Documento mezzo</strong>
          </div>

          <dl className="ia-archivista-bridge__facts">
            <div className={!normalizeText(analysis?.tipoDocumento) ? "is-missing" : ""}>
              <dt>Sottotipo letto</dt>
              <dd>{formatValue(analysis?.tipoDocumento || selectedSubtype)}</dd>
            </div>
            <div className={!normalizeText(analysis?.targa) ? "is-missing" : ""}>
              <dt>Targa</dt>
              <dd>{formatValue(analysis?.targa)}</dd>
            </div>
            <div className={!normalizeText(analysis?.telaio) ? "is-missing" : ""}>
              <dt>Telaio</dt>
              <dd>{formatValue(analysis?.telaio)}</dd>
            </div>
            <div>
              <dt>Proprietario</dt>
              <dd>{formatValue(analysis?.proprietario)}</dd>
            </div>
            <div>
              <dt>Assicurazione / Ente</dt>
              <dd>{formatValue(analysis?.assicurazione || analysis?.fornitore)}</dd>
            </div>
            <div className={!normalizeText(analysis?.dataDocumento) ? "is-missing" : ""}>
              <dt>Data documento</dt>
              <dd>{formatValue(analysis?.dataDocumento)}</dd>
            </div>
            <div>
              <dt>Scadenza letta</dt>
              <dd>{formatValue(analysis?.dataScadenza || analysis?.dataScadenzaRevisione)}</dd>
            </div>
            <div>
              <dt>Ultimo collaudo</dt>
              <dd>{formatValue(analysis?.dataUltimoCollaudo)}</dd>
            </div>
          </dl>

          <div className="ia-archivista-bridge__summary">
            <p className="internal-ai-card__eyebrow">Riassunto breve</p>
            <p>{summaryText}</p>
          </div>
        </article>

        <article className="internal-ai-card ia-archivista-bridge__review-card iai-card">
          <div className="ia-archivista-bridge__review-head">
            <p className="internal-ai-card__eyebrow">Esito proposto</p>
            <strong>Archivio prima, update mezzo solo se vuoi</strong>
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
              <strong>Aggiornamento mezzo sempre esplicito</strong>
              <p>Archivista non aggiorna il mezzo in silenzio: lo fa solo se lo confermi tu.</p>
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
                Nessun avviso forte rilevato in questa review.
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
              <p>Nessun campo mancante forte rilevato per questo documento.</p>
            )}
          </div>
        </article>
      </div>

      <div className="ia-archivista-bridge__archive-grid iai-archive-grid">
        <article className="internal-ai-card ia-archivista-bridge__review-card iai-card">
          <div className="ia-archivista-bridge__review-head">
            <p className="internal-ai-card__eyebrow">Collegamento al mezzo</p>
            <strong>Mezzo da collegare</strong>
          </div>

          <label className="ia-archivista-bridge__field">
            <span>Mezzo</span>
            <select
              value={selectedVehicleId}
              onChange={(event) => setSelectedVehicleId(event.target.value)}
              disabled={!vehicles.length}
            >
              <option value="">Seleziona il mezzo</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.label}
                </option>
              ))}
            </select>
          </label>

          <div className="ia-archivista-bridge__inline-choice">
            <label>
              <input
                type="checkbox"
                checked={applyVehicleUpdateChoice}
                onChange={(event) => setApplyVehicleUpdateChoice(event.target.checked)}
              />
              <span>Aggiorna anche i campi del mezzo dopo l'archiviazione</span>
            </label>
          </div>

          {vehicleUpdatePreview.length ? (
            <div className="ia-archivista-bridge__rows">
              {vehicleUpdatePreview.map((field) => (
                <article key={field.key} className="ia-archivista-bridge__row">
                  <strong>{field.label}</strong>
                  <div className="ia-archivista-bridge__row-meta">
                    <span>Attuale: {field.currentValue}</span>
                    <span>Nuovo: {field.nextValue}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="ia-archivista-bridge__empty">
              <p className="ia-archivista-bridge__empty-title">Nessun update obbligato</p>
              <p className="ia-archivista-bridge__empty-copy">
                Puoi archiviare anche senza aggiornare il mezzo, oppure confermare l'update solo se i valori ti tornano.
              </p>
            </div>
          )}

          {vehicleUpdateMessage ? (
            <div className="ia-archivista-bridge__callout is-highlight">
              <strong>Update mezzo completato</strong>
              <p>{vehicleUpdateMessage}</p>
            </div>
          ) : null}
        </article>

        <article className="internal-ai-card ia-archivista-bridge__review-card iai-card">
          <div className="ia-archivista-bridge__review-head">
            <p className="internal-ai-card__eyebrow">Controllo duplicati</p>
            <strong>Archivio Documento mezzo</strong>
          </div>

          <div className="ia-archivista-bridge__actions">
            <button
              type="button"
              className="internal-ai-search__button ia-archivista__analyze-button iai-btn-analizza"
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

      <article className="internal-ai-card ia-archivista-bridge__review-card iai-confirm-bar">
        <div className="ia-archivista-bridge__review-head">
          <p className="internal-ai-card__eyebrow">Conferma finale</p>
          <strong>Archiviazione Documento mezzo</strong>
        </div>

        <div className="ia-archivista-bridge__actions">
          <button
            type="button"
            className="internal-ai-search__button ia-archivista__analyze-button iai-btn-conferma"
            disabled={
              !analysis ||
              !selectedFile ||
              !selectedVehicleId ||
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

        {archiveResult ? (
          <div className="ia-archivista-bridge__callout-stack">
            <div className="ia-archivista-bridge__callout is-highlight">
              <strong>Documento archiviato</strong>
              <p>{archiveResult.message}</p>
            </div>
            {archiveResult.fileUrl ? (
              <div className="ia-archivista-bridge__callout">
                <strong>Originale archiviato</strong>
                <p>
                  <a href={archiveResult.fileUrl} target="_blank" rel="noreferrer">
                    Apri originale archiviato
                  </a>
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </article>
    </div>
  );
}
