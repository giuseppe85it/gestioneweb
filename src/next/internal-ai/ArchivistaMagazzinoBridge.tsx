import { useEffect, useMemo, useState } from "react";
import {
  archiveArchivistaDocumentRecord,
  findArchivistaDuplicateCandidates,
  formatValue,
  normalizeScalar,
  normalizeText,
  updateArchivistaDocumentRecordAnalysis,
  type ArchivistaArchiveResult,
  type ArchivistaDuplicateCandidate,
  type ArchivistaDuplicateChoice,
} from "./ArchivistaArchiveClient";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

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
  valutaDocumento?: string;
  riassuntoBreve?: string;
  avvisi?: string[];
  campiMancanti?: string[];
};

type ArchivistaMagazzinoPreloadDocument = {
  fileUrl: string;
  sourceDocId?: string;
  sourceKey?: string;
  tipoDocumento?: string;
  targa?: string;
  archivistaAnalysis?: ArchivistaMagazzinoAnalysis | null;
};

type ArchivistaMagazzinoBridgeProps = {
  preloadDocument?: ArchivistaMagazzinoPreloadDocument | null;
};

type ArchivistaMagazzinoApiResponse = {
  success?: boolean;
  data?: ArchivistaMagazzinoAnalysis;
  error?: string;
};

type AnalysisStatus = "idle" | "loading" | "success" | "error";
type DuplicateStatus = "idle" | "checking" | "ready" | "duplicates_found" | "error";
type ArchiveStatus = "idle" | "saving" | "success" | "error";

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

function extractPreloadFileNameFromUrl(fileUrl: string) {
  const rawName = fileUrl.split("?")[0].split("#")[0].split("/").pop() ?? "";
  if (!rawName) {
    return "";
  }

  try {
    return decodeURIComponent(rawName).split("/").filter(Boolean).pop() ?? "";
  } catch {
    return rawName.split("/").filter(Boolean).pop() ?? "";
  }
}

function getPreloadExtensionFromMimeType(mimeType: string) {
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  return "jpg";
}

function buildPreloadDocumentFileName(
  preloadDocument: ArchivistaMagazzinoPreloadDocument,
  mimeType: string,
) {
  const fileNameFromUrl = extractPreloadFileNameFromUrl(preloadDocument.fileUrl);
  if (fileNameFromUrl) {
    return fileNameFromUrl;
  }

  const documentLabel =
    normalizeText(preloadDocument.targa) ||
    normalizeText(preloadDocument.sourceDocId) ||
    "documento";
  const typeLabel = normalizeText(preloadDocument.tipoDocumento) || "fattura-ddt";
  return `${typeLabel}-${documentLabel}.${getPreloadExtensionFromMimeType(mimeType)}`;
}

async function readArchivistaMagazzinoArchiveRecord(
  archiveId: string | undefined,
): Promise<Record<string, unknown> | null> {
  const normalizedArchiveId = normalizeText(archiveId);
  if (!normalizedArchiveId) {
    return null;
  }

  const snapshot = await getDoc(doc(db, "@documenti_magazzino", normalizedArchiveId));
  return snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
}

function readArchivistaMagazzinoRows(value: unknown): ArchivistaMagazzinoVoce[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is ArchivistaMagazzinoVoce => !!entry && typeof entry === "object")
    : [];
}

function readArchivistaStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((entry) => normalizeText(entry)).filter(Boolean) : [];
}

function buildMagazzinoAnalysisFromArchive(
  archiveRecord: Record<string, unknown>,
): ArchivistaMagazzinoAnalysis {
  return {
    tipoDocumento: normalizeText(archiveRecord.tipoDocumento) || "FATTURA/DDT",
    fornitore: normalizeText(archiveRecord.fornitore),
    numeroDocumento: normalizeText(archiveRecord.numeroDocumento),
    dataDocumento: normalizeText(archiveRecord.dataDocumento),
    imponibile: archiveRecord.imponibile as string | number | undefined,
    ivaPercentuale: archiveRecord.ivaPercentuale as string | number | undefined,
    ivaImporto: archiveRecord.ivaImporto as string | number | undefined,
    totaleDocumento: archiveRecord.totaleDocumento as string | number | undefined,
    targa: normalizeText(archiveRecord.targa),
    testo: normalizeText(archiveRecord.testo),
    voci: readArchivistaMagazzinoRows(archiveRecord.voci),
    valutaDocumento: normalizeText(archiveRecord.valutaDocumento),
    riassuntoBreve: normalizeText(archiveRecord.riassuntoBreve),
    avvisi: readArchivistaStringList(archiveRecord.avvisi),
    campiMancanti: readArchivistaStringList(archiveRecord.campiMancanti),
  };
}

function isCompleteMagazzinoArchiveAnalysis(analysis: ArchivistaMagazzinoAnalysis): boolean {
  return (
    !!normalizeText(analysis.fornitore) &&
    !!normalizeText(analysis.numeroDocumento) &&
    !!normalizeText(analysis.dataDocumento) &&
    !!normalizeScalar(analysis.totaleDocumento) &&
    Array.isArray(analysis.voci) &&
    analysis.voci.length > 0
  );
}

async function analyzeMagazzinoFile(file: File): Promise<ArchivistaMagazzinoAnalysis> {
  const { base64, mimeType } = await fileToBase64(file);
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

  return normalizedAnalysis;
}

async function backfillMagazzinoAnalysis(
  archiveId: string | undefined,
  analysis: ArchivistaMagazzinoAnalysis,
): Promise<void> {
  const normalizedArchiveId = normalizeText(archiveId);
  if (!normalizedArchiveId) {
    return;
  }

  try {
    await updateArchivistaDocumentRecordAnalysis({
      targetCollection: "@documenti_magazzino",
      archiveId: normalizedArchiveId,
      archivistaAnalysis: { ...analysis },
    });
  } catch {
    return;
  }
}

export default function ArchivistaMagazzinoBridge({
  preloadDocument = null,
}: ArchivistaMagazzinoBridgeProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [previewRotation, setPreviewRotation] = useState(0);
  const [currency, setCurrency] = useState<"EUR" | "CHF">("EUR");
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>("idle");
  const [analysis, setAnalysis] = useState<ArchivistaMagazzinoAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateStatus, setDuplicateStatus] = useState<DuplicateStatus>("idle");
  const [duplicateCandidates, setDuplicateCandidates] = useState<ArchivistaDuplicateCandidate[]>([]);
  const [selectedDuplicateId, setSelectedDuplicateId] = useState<string>("");
  const [duplicateChoice, setDuplicateChoice] = useState<ArchivistaDuplicateChoice | null>(null);
  const [archiveStatus, setArchiveStatus] = useState<ArchiveStatus>("idle");
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [, setArchiveResult] = useState<ArchivistaArchiveResult | null>(null);
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

  useEffect(() => {
    const fileUrl = preloadDocument?.fileUrl;
    if (!fileUrl) {
      return;
    }

    let cancelled = false;

    const loadPreloadDocument = async () => {
      let activeAnalysis = preloadDocument?.archivistaAnalysis ?? null;
      try {
        setErrorMessage(null);
        if (!activeAnalysis) {
          const archiveRecord = await readArchivistaMagazzinoArchiveRecord(preloadDocument?.sourceDocId);
          if (cancelled) {
            return;
          }

          if (archiveRecord) {
            const reconstructedAnalysis = buildMagazzinoAnalysisFromArchive(archiveRecord);
            const complete = isCompleteMagazzinoArchiveAnalysis(reconstructedAnalysis);
            if (complete) {
              activeAnalysis = reconstructedAnalysis;
              setAnalysis(activeAnalysis);
              setAnalysisStatus("success");
              void backfillMagazzinoAnalysis(preloadDocument?.sourceDocId, activeAnalysis);
            } else {
              setAnalysisStatus("loading");
            }
          } else {
            setAnalysisStatus("loading");
          }
        } else {
          setAnalysis(activeAnalysis);
          setAnalysisStatus("success");
        }

        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Download documento non riuscito (${response.status}).`);
        }

        const blob = await response.blob();
        if (cancelled) {
          return;
        }

        const mimeType = blob.type || "application/octet-stream";
        const selectedFileFromPreload = new File(
          [blob],
          buildPreloadDocumentFileName(
            {
              fileUrl,
              sourceDocId: preloadDocument?.sourceDocId,
              sourceKey: preloadDocument?.sourceKey,
              tipoDocumento: preloadDocument?.tipoDocumento,
              targa: preloadDocument?.targa,
            },
            mimeType,
          ),
          { type: mimeType },
        );

        setSelectedFile(selectedFileFromPreload);
        setPreviewScale(1);
        setPreviewRotation(0);
        if (!activeAnalysis) {
          try {
            activeAnalysis = await analyzeMagazzinoFile(selectedFileFromPreload);
            if (cancelled) {
              return;
            }
            setAnalysis(activeAnalysis);
            setAnalysisStatus("success");
            void backfillMagazzinoAnalysis(preloadDocument?.sourceDocId, activeAnalysis);
          } catch {
            if (!cancelled) {
              setAnalysisStatus("idle");
            }
          }
        }
        setErrorMessage(null);
        setDuplicateStatus("idle");
        setDuplicateCandidates([]);
        setSelectedDuplicateId("");
        setDuplicateChoice(null);
        setArchiveStatus("idle");
        setArchiveError(null);
        setArchiveResult(null);
      } catch {
        if (!cancelled) {
          setSelectedFile(null);
          if (!activeAnalysis) {
            setAnalysisStatus("idle");
          }
          setErrorMessage("Riapertura documento fallita. Carica manualmente il file.");
        }
      }
    };

    void loadPreloadDocument();

    return () => {
      cancelled = true;
    };
  }, [
    preloadDocument?.fileUrl,
    preloadDocument?.sourceDocId,
    preloadDocument?.sourceKey,
    preloadDocument?.tipoDocumento,
    preloadDocument?.targa,
    preloadDocument?.archivistaAnalysis,
  ]);

  const rows = useMemo(() => analysis?.voci ?? [], [analysis?.voci]);

  useEffect(() => {
    if (!analysis) {
      setSelectedRowKeys([]);
      return;
    }

    setSelectedRowKeys(rows.map((_, index) => `row-${index}`));
  }, [analysis, rows]);

  const selectedRows = rows.filter((_, index) => selectedRowKeys.includes(`row-${index}`));

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
    if (!selectedRows.length && rows.length) {
      nextWarnings.push("Tutte le righe sono state escluse dalla tabella importabile.");
    }
    return nextWarnings;
  }, [analysis, rows, selectedRows]);

  const duplicateCandidateSelected =
    duplicateCandidates.find((entry) => entry.id === selectedDuplicateId) ??
    duplicateCandidates[0] ??
    null;

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

      const normalizedAnalysis = await analyzeMagazzinoFile(selectedFile);

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
        archivistaAnalysis: analysis,
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
          voci: selectedRows,
          valutaDocumento: currency,
          riassuntoBreve: `Documento ${analysis.tipoDocumento || "letto"} con ${rows.length} righe`,
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

  const handleDiscard = () => {
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setPreviewScale(1);
    setPreviewRotation(0);
    setAnalysisStatus("idle");
    setAnalysis(null);
    setErrorMessage(null);
    setDuplicateStatus("idle");
    setDuplicateCandidates([]);
    setSelectedDuplicateId("");
    setDuplicateChoice(null);
    setArchiveStatus("idle");
    setArchiveError(null);
    setArchiveResult(null);
    setSelectedRowKeys([]);
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
            <h3 className="iai-upload-combo-label">Fattura / DDT + Magazzino</h3>
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
              setArchiveError(null);
              setArchiveResult(null);
              setPreviewScale(1);
              setPreviewRotation(0);
            }}
          />
          <strong className="iai-btn-file">Scegli file</strong>
          <span className="iai-upload-hint">PDF e foto, un documento alla volta.</span>
        </label>

        <div className="iai-upload-footer">
          <div className="ia-archivista-bridge__file-meta">
            {selectedFile ? (
              <>
                <span className="iai-file-chip">
                  {selectedFile.name}
                  <span className="iai-chip-badge">Immagine preview</span>
                </span>
              </>
            ) : (
              <span className="iai-upload-hint">Nessun file selezionato</span>
            )}
          </div>
          <button
            type="button"
            className="iai-btn-analizza"
            disabled={!selectedFile || analysisStatus === "loading"}
            onClick={handleAnalyze}
          >
            {analysisStatus === "loading" ? "Analisi in corso..." : "Analizza doc →"}
          </button>
        </div>
      </section>

      {errorMessage ? <div className="ia-archivista__notice iai-avvisi-banner">{errorMessage}</div> : null}
      {archiveError ? <div className="ia-archivista__notice iai-avvisi-banner">{archiveError}</div> : null}

      <section className="next-panel iai-card">
        <p className="iai-sec-label">AVVISI E CAMPI MANCANTI</p>
        <p className="iai-upload-hint">
          {warnings.length
            ? [...warnings, ...missingFields].slice(0, 4).join(" · ")
            : "Nessun avviso bloccante. Mantieni la conferma finale utente."}
        </p>
      </section>

      <section className="iai-top-grid">
        <article className="next-panel ia-archivista-bridge__preview-card iai-doc-viewer">
          <div className="ia-archivista-bridge__review-head iai-doc-topbar">
            <p className="internal-ai-card__eyebrow iai-doc-fname">Documento</p>
            <strong>{selectedFile ? selectedFile.name : "Anteprima in attesa"}</strong>
          </div>

          <div className="ia-archivista-bridge__preview-toolbar">
            <button
              type="button"
              className="iai-doc-tbtn"
              onClick={() => setPreviewScale((value) => Math.min(2, value + 0.1))}
              disabled={!imagePreviewUrl}
              title="Aumenta zoom anteprima"
            >
              Zoom +
            </button>
            <button
              type="button"
              className="iai-doc-tbtn"
              onClick={() => setPreviewScale((value) => Math.max(0.8, value - 0.1))}
              disabled={!imagePreviewUrl}
              title="Riduci zoom anteprima"
            >
              Zoom -
            </button>
            <button
              type="button"
              className="iai-doc-tbtn"
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

        <article className="next-panel iai-fields-card">
          <p className="iai-sec-label">DATI ESTRATTI</p>
          <strong>Valuta</strong>
          <select
            className="iai-field-select"
            value={currency}
            onChange={(event) => setCurrency(event.target.value as "EUR" | "CHF")}
            title="Seleziona la valuta del documento"
          >
            <option value="EUR">EUR</option>
            <option value="CHF">CHF</option>
          </select>

          <dl className="iai-fields-card ia-archivista-bridge__facts">
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
          </dl>
        </article>
      </section>

      <section className="next-panel iai-card">
        <div className="iai-righe-header">
          <p className="iai-sec-label">RIGHE DOCUMENTO</p>
          <strong>{rows.length ? "Controlla le righe prima di archiviare" : "Nessuna riga letta"}</strong>
        </div>

        {rows.length ? (
          <div className="ia-archivista-bridge__table-wrap">
            <table className="iai-righe-table">
              <thead>
                <tr>
                  <th>Sel</th>
                  <th>Descrizione</th>
                  <th>Quantità</th>
                  <th>Unità</th>
                  <th>Prezzo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const rowKey = `row-${index}`;
                  const isSelected = selectedRowKeys.includes(rowKey);
                  return (
                    <tr key={rowKey} className={!isSelected ? "iai-row-unchecked" : ""}>
                      <td>
                        <label className="ia-archivista-bridge__table-check iai-row-cb">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(rowKey)}
                          />
                        </label>
                      </td>
                      <td>{normalizeText(row.descrizione) || `Voce ${index + 1}`}</td>
                      <td>{formatValue(row.quantita, "-")}</td>
                      <td>{formatValue(row.unita, "-")}</td>
                      <td>{formatValue(row.prezzoUnitario ?? row.prezzo, "-")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="iai-upload-hint">Carica e analizza per leggere le righe.</p>
        )}
      </section>

      <section className="next-panel iai-card">
        <div className="iai-righe-header">
          <p className="iai-sec-label">DUPLICATI</p>
          <strong>
            {duplicateStatus === "ready"
              ? "Nessun match forte"
              : duplicateStatus === "checking"
                ? "Controllo in corso..."
                : duplicateCandidates.length
                  ? "Match forte"
                  : "Controlla duplicati"}
          </strong>
        </div>

        {!analysis ? (
          <p className="iai-upload-hint">Avvia prima l&apos;analisi per verificare i possibili duplicati.</p>
        ) : duplicateStatus === "checking" ? (
          <p className="iai-upload-hint">Controllo duplicati in corso.</p>
        ) : duplicateCandidates.length ? (
          <>
            <div className="iai-confirm-bar" style={{ marginTop: 8 }}>
              <p className="iai-upload-hint">
                <strong>{duplicateCandidateSelected?.title}</strong>
                <span> · {duplicateCandidateSelected?.subtitle}</span>
              </p>
              <button
                type="button"
                className="iai-row-cb"
                onClick={() => setSelectedDuplicateId(duplicateCandidateSelected?.id || "")}
              >
                Seleziona
              </button>
            </div>
            <div className="ia-archivista-bridge__pill-row" style={{ marginTop: 8 }}>
              {duplicateCandidateSelected?.matchedFields.map((field) => (
                <span key={field} className="ia-archivista-bridge__mini-pill">
                  {field}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="iai-upload-hint">Nessun duplicato forte rilevato.</p>
        )}

        <div className="ia-archivista-bridge__actions" style={{ marginTop: 10 }}>
          <button
            type="button"
            className="iai-btn-analizza"
            disabled={!analysis || duplicateStatus === "checking"}
            onClick={handleCheckDuplicates}
          >
            {duplicateStatus === "checking" ? "Controllo in corso..." : "Controlla duplicati"}
          </button>
        </div>

        {duplicateCandidates.length ? (
          <div className="ia-archivista-bridge__choice-grid" style={{ marginTop: 8 }}>
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
      </section>

      <section className="iai-confirm-bar">
        <p className="iai-upload-hint">Conferma l&apos;archiviazione dopo controllo finale.</p>
        <div className="iai-confirm-bar">
          <button
            type="button"
            className="iai-btn-scarta"
            onClick={handleDiscard}
            disabled={archiveStatus === "saving"}
          >
            Scarta documento
          </button>
          <button
            type="button"
            className="iai-btn-conferma"
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
            {archiveStatus === "saving" ? "Archiviazione in corso..." : "Conferma e archivia →"}
          </button>
        </div>
      </section>
    </div>
  );
}
