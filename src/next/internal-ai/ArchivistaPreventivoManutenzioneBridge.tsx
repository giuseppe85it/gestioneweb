import { useEffect, useMemo, useState } from "react";
import { PDFDocument } from "pdf-lib";
import {
  archiveArchivistaPreventivoRecord,
  findArchivistaDuplicateCandidates,
  formatValue,
  normalizeScalar,
  normalizeText,
  updateArchivistaPreventivoRecordAnalysis,
  type ArchivistaArchiveResult,
  type ArchivistaDuplicateCandidate,
  type ArchivistaDuplicateChoice,
  type ArchivistaReviewRow,
} from "./ArchivistaArchiveClient";
import { getInternalAiServerAdapterBaseUrl } from "./internalAiServerRepoUnderstandingClient";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

const DOCUMENT_ANALYZE_PATH = "/internal-ai-backend/documents/preventivo-magazzino-analyze";

type ArchivistaPreventivoManutenzioneAnalysis = {
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
  voci?: ArchivistaReviewRow[];
};

type ArchivistaPreventivoManutenzionePreloadDocument = {
  fileUrl: string;
  sourceDocId?: string;
  sourceKey?: string;
  tipoDocumento?: string;
  targa?: string;
  archivistaAnalysis?: ArchivistaPreventivoManutenzioneAnalysis | null;
};

type ArchivistaPreventivoManutenzioneBridgeProps = {
  preloadDocument?: ArchivistaPreventivoManutenzionePreloadDocument | null;
};

type ArchivistaPreventivoManutenzioneApiResponse = {
  ok?: boolean;
  message?: string;
  data?: {
    analysis?: ArchivistaPreventivoManutenzioneAnalysis;
  };
  error?: string;
};

type AnalysisStatus = "idle" | "loading" | "success" | "error";
type DuplicateStatus = "idle" | "checking" | "ready" | "duplicates_found" | "error";
type ArchiveStatus = "idle" | "saving" | "success" | "error";
type ReviewRowKind = "Materiali" | "Manodopera" | "Ricambi" | "Altro";

type ReviewRow = {
  descrizione: string;
  categoria: string;
  quantita: string;
  importo: string;
  prezzo: string;
  codice: string;
  unita: string;
  kind: ReviewRowKind;
};

type ReviewDraft = {
  tipoDocumento: string;
  fornitore: string;
  numeroDocumento: string;
  dataDocumento: string;
  totaleDocumento: string;
  targa: string;
  km: string;
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

function getRowAmount(row: ArchivistaReviewRow): string {
  return (
    normalizeScalar(row.importo) ||
    normalizeScalar(row.totale) ||
    normalizeScalar(row.prezzoUnitario)
  );
}

function getRowPrice(row: ArchivistaReviewRow): string {
  return normalizeScalar(row.prezzoUnitario);
}

function getRowQuantity(row: ArchivistaReviewRow): string {
  const quantity = normalizeScalar(row.quantita);
  const unit = normalizeText(row.unita);
  if (quantity && unit) {
    return `${quantity} ${unit}`;
  }
  return quantity;
}

function classifyReviewRow(row: ArchivistaReviewRow): ReviewRowKind {
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

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Errore lettura file."));
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  });
}

async function loadImageElement(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Impossibile caricare l'immagine selezionata."));
    image.src = dataUrl;
  });
}

async function imageFileToPngBytes(file: File): Promise<Uint8Array> {
  const imageDataUrl = await fileToDataUrl(file);
  const image = await loadImageElement(imageDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas non disponibile per preparare il documento multipagina.");
  }

  context.drawImage(image, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((nextBlob) => {
      if (nextBlob) {
        resolve(nextBlob);
        return;
      }
      reject(new Error("Conversione immagine non riuscita."));
    }, "image/png");
  });

  return new Uint8Array(await blob.arrayBuffer());
}

async function buildArchiveReadyFile(files: File[]): Promise<File> {
  if (files.length === 1) {
    return files[0];
  }

  const pdfDocument = await PDFDocument.create();

  for (const file of files) {
    const mimeType = normalizeText(file.type).toLowerCase();
    const lowerFileName = normalizeText(file.name).toLowerCase();

    if (mimeType === "application/pdf" || lowerFileName.endsWith(".pdf")) {
      const sourceDocument = await PDFDocument.load(await file.arrayBuffer());
      const copiedPages = await pdfDocument.copyPages(sourceDocument, sourceDocument.getPageIndices());
      copiedPages.forEach((page) => pdfDocument.addPage(page));
      continue;
    }

    if (mimeType.startsWith("image/")) {
      let embeddedImage = null;
      if (mimeType === "image/png") {
        embeddedImage = await pdfDocument.embedPng(await file.arrayBuffer());
      } else if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
        embeddedImage = await pdfDocument.embedJpg(await file.arrayBuffer());
      } else {
        embeddedImage = await pdfDocument.embedPng(await imageFileToPngBytes(file));
      }

      const page = pdfDocument.addPage([embeddedImage.width, embeddedImage.height]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: embeddedImage.width,
        height: embeddedImage.height,
      });
      continue;
    }

    throw new Error(`Formato non supportato per l'archiviazione multipagina: ${file.name}`);
  }

  const pdfBytes = await pdfDocument.save();
  const pdfBlobPart = pdfBytes as unknown as BlobPart;
  return new File([pdfBlobPart], `preventivo_manutenzione_${Date.now()}.pdf`, {
    type: "application/pdf",
  });
}

function normalizeAnalysisPayload(payload: unknown): ArchivistaPreventivoManutenzioneAnalysis | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as ArchivistaPreventivoManutenzioneApiResponse;
  if (record.data?.analysis && typeof record.data.analysis === "object") {
    return record.data.analysis;
  }

  return payload as ArchivistaPreventivoManutenzioneAnalysis;
}

function buildReviewDraft(
  analysis: ArchivistaPreventivoManutenzioneAnalysis,
): ReviewDraft {
  return {
    tipoDocumento: normalizeText(analysis.tipoDocumento),
    fornitore: normalizeText(analysis.fornitore),
    numeroDocumento: normalizeText(analysis.numeroDocumento),
    dataDocumento: normalizeText(analysis.dataDocumento),
    totaleDocumento: normalizeScalar(analysis.totaleDocumento),
    targa: normalizeText(analysis.targa),
    km: normalizeScalar(analysis.km),
  };
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
  preloadDocument: ArchivistaPreventivoManutenzionePreloadDocument,
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
  const typeLabel = normalizeText(preloadDocument.tipoDocumento) || "preventivo";
  return `${typeLabel}-${documentLabel}.${getPreloadExtensionFromMimeType(mimeType)}`;
}

async function readArchivistaPreventivoArchiveRecord(
  archiveId: string | undefined,
): Promise<Record<string, unknown> | null> {
  const normalizedArchiveId = normalizeText(archiveId);
  if (!normalizedArchiveId) {
    return null;
  }

  const snapshot = await getDoc(doc(db, "storage", "@preventivi"));
  const raw = snapshot.exists() ? snapshot.data() : null;
  const preventivi = Array.isArray(raw?.preventivi) ? raw.preventivi : [];
  return (
    preventivi.find(
      (entry): entry is Record<string, unknown> =>
        !!entry &&
        typeof entry === "object" &&
        normalizeText((entry as Record<string, unknown>).id) === normalizedArchiveId,
    ) ?? null
  );
}

function readArchivistaPreventivoRows(value: unknown): ArchivistaReviewRow[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is ArchivistaReviewRow => !!entry && typeof entry === "object")
    : [];
}

function readArchivistaStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((entry) => normalizeText(entry)).filter(Boolean) : [];
}

function readRecordObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function buildPreventivoManutenzioneAnalysisFromArchive(
  archiveRecord: Record<string, unknown>,
): ArchivistaPreventivoManutenzioneAnalysis {
  const metadatiMezzo = readRecordObject(archiveRecord.metadatiMezzo);
  return {
    stato: normalizeText(archiveRecord.stato) || "ricostruito_archivio",
    tipoDocumento: normalizeText(archiveRecord.tipoDocumento) || "preventivo",
    fornitore: normalizeText(archiveRecord.fornitoreNome) || normalizeText(archiveRecord.fornitore),
    numeroDocumento:
      normalizeText(archiveRecord.numeroPreventivo) || normalizeText(archiveRecord.numeroDocumento),
    dataDocumento:
      normalizeText(archiveRecord.dataPreventivo) || normalizeText(archiveRecord.dataDocumento),
    totaleDocumento: archiveRecord.totaleDocumento as string | number | undefined,
    targa: normalizeText(metadatiMezzo.targa) || normalizeText(archiveRecord.targa),
    km: (metadatiMezzo.km || archiveRecord.km) as string | number | undefined,
    testo: normalizeText(archiveRecord.testo),
    riassuntoBreve: normalizeText(archiveRecord.riassuntoBreve),
    avvisi: readArchivistaStringList(archiveRecord.avvisiArchivista || archiveRecord.avvisi),
    campiMancanti: readArchivistaStringList(
      archiveRecord.campiMancantiArchivista || archiveRecord.campiMancanti,
    ),
    voci: readArchivistaPreventivoRows(archiveRecord.righe || archiveRecord.voci),
  };
}

function isCompletePreventivoManutenzioneArchiveAnalysis(
  analysis: ArchivistaPreventivoManutenzioneAnalysis,
): boolean {
  return (
    !!normalizeText(analysis.targa) &&
    !!normalizeText(analysis.fornitore) &&
    !!normalizeText(analysis.dataDocumento) &&
    Array.isArray(analysis.voci) &&
    analysis.voci.length > 0
  );
}

async function analyzePreventivoManutenzioneFiles(
  files: File[],
): Promise<ArchivistaPreventivoManutenzioneAnalysis> {
  const pagesPayload = await Promise.all(
    files.map(async (file) => {
      const { base64, mimeType } = await fileToBase64(file);
      return {
        fileName: file.name,
        mimeType,
        contentBase64: base64,
      };
    }),
  );
  const endpoint = getDocumentAnalyzeUrl();
  if (!endpoint) {
    throw new Error(
      "Backend IA OpenAI non disponibile in questo ambiente. Avvia il server IA separato per analizzare il documento.",
    );
  }

  const requestBody =
    pagesPayload.length === 1
      ? {
          fileName: pagesPayload[0].fileName,
          fileBase64: pagesPayload[0].contentBase64,
          contentBase64: pagesPayload[0].contentBase64,
          mimeType: pagesPayload[0].mimeType,
        }
      : {
          pages: pagesPayload,
        };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
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

  return normalizedAnalysis;
}

async function backfillPreventivoManutenzioneAnalysis(
  archiveId: string | undefined,
  analysis: ArchivistaPreventivoManutenzioneAnalysis,
): Promise<void> {
  const normalizedArchiveId = normalizeText(archiveId);
  if (!normalizedArchiveId) {
    return;
  }

  try {
    await updateArchivistaPreventivoRecordAnalysis({
      archiveId: normalizedArchiveId,
      archivistaAnalysis: { ...analysis },
    });
  } catch {
    return;
  }
}

export default function ArchivistaPreventivoManutenzioneBridge({
  preloadDocument = null,
}: ArchivistaPreventivoManutenzioneBridgeProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<Array<string | null>>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [previewScale, setPreviewScale] = useState(1);
  const [previewRotation, setPreviewRotation] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>("idle");
  const [analysis, setAnalysis] = useState<ArchivistaPreventivoManutenzioneAnalysis | null>(null);
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft | null>(null);
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
    const nextPreviewUrls = selectedFiles.map((file) =>
      file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    );
    setImagePreviewUrls(nextPreviewUrls);

    return () => {
      nextPreviewUrls.forEach((previewUrl) => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      });
    };
  }, [selectedFiles]);

  useEffect(() => {
    if (!selectedFiles.length) {
      setActivePreviewIndex(0);
      return;
    }

    if (activePreviewIndex >= selectedFiles.length) {
      setActivePreviewIndex(selectedFiles.length - 1);
    }
  }, [activePreviewIndex, selectedFiles.length]);

  const activeSelectedFile = selectedFiles[activePreviewIndex] ?? selectedFiles[0] ?? null;
  const activeImagePreviewUrl = imagePreviewUrls[activePreviewIndex] ?? imagePreviewUrls[0] ?? null;

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
          const archiveRecord = await readArchivistaPreventivoArchiveRecord(preloadDocument?.sourceDocId);
          if (cancelled) {
            return;
          }

          if (archiveRecord) {
            const reconstructedAnalysis = buildPreventivoManutenzioneAnalysisFromArchive(archiveRecord);
            const complete = isCompletePreventivoManutenzioneArchiveAnalysis(reconstructedAnalysis);
            if (complete) {
              activeAnalysis = reconstructedAnalysis;
              setAnalysis(activeAnalysis);
              setReviewDraft(buildReviewDraft(activeAnalysis));
              setAnalysisStatus("success");
              void backfillPreventivoManutenzioneAnalysis(preloadDocument?.sourceDocId, activeAnalysis);
            } else {
              setAnalysisStatus("loading");
            }
          } else {
            setAnalysisStatus("loading");
          }
        } else {
          setAnalysis(activeAnalysis);
          setReviewDraft(buildReviewDraft(activeAnalysis));
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

        setSelectedFiles([selectedFileFromPreload]);
        setActivePreviewIndex(0);
        setPreviewScale(1);
        setPreviewRotation(0);
        if (!activeAnalysis) {
          try {
            activeAnalysis = await analyzePreventivoManutenzioneFiles([selectedFileFromPreload]);
            if (cancelled) {
              return;
            }
            setAnalysis(activeAnalysis);
            setReviewDraft(buildReviewDraft(activeAnalysis));
            setAnalysisStatus("success");
            void backfillPreventivoManutenzioneAnalysis(preloadDocument?.sourceDocId, activeAnalysis);
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
        setSelectedRowKeys([]);
      } catch {
        if (!cancelled) {
          setSelectedFiles([]);
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

  function resetWorkflowState() {
    setAnalysis(null);
    setReviewDraft(null);
    setAnalysisStatus("idle");
    setErrorMessage(null);
    setDuplicateStatus("idle");
    setDuplicateCandidates([]);
    setSelectedDuplicateId("");
    setDuplicateChoice(null);
    setArchiveStatus("idle");
    setArchiveError(null);
    setArchiveResult(null);
    setSelectedRowKeys([]);
  }

  function applySelectedFiles(nextFiles: File[]) {
    setSelectedFiles(nextFiles);
    setActivePreviewIndex(0);
    setPreviewScale(1);
    setPreviewRotation(0);
    resetWorkflowState();
  }

  function removeSelectedFile(indexToRemove: number) {
    applySelectedFiles(selectedFiles.filter((_, index) => index !== indexToRemove));
  }

  function patchReviewDraft(patch: Partial<ReviewDraft>) {
    setReviewDraft((current) => (current ? { ...current, ...patch } : current));
  }

  const reviewRows = useMemo<ReviewRow[]>(() => {
    return (analysis?.voci ?? []).map((row) => {
      const kind = classifyReviewRow(row);
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
    if (!reviewDraft) return [];
    if (Array.isArray(analysis?.campiMancanti) && analysis.campiMancanti.length > 0) {
      const nextMissing = [...analysis.campiMancanti];
      if (!normalizeText(reviewDraft.targa)) {
        nextMissing.push("Targa del mezzo");
      }
      return uniqueList(nextMissing);
    }

    const nextMissing: string[] = [];
    if (!normalizeText(reviewDraft.targa)) {
      nextMissing.push("Targa del mezzo");
    }
    if (!normalizeText(reviewDraft.fornitore)) {
      nextMissing.push("Fornitore officina");
    }
    if (!normalizeText(reviewDraft.dataDocumento)) {
      nextMissing.push("Data preventivo");
    }
    return uniqueList(nextMissing);
  }, [analysis?.campiMancanti, reviewDraft]);

  const warnings = useMemo(() => {
    if (!analysis || !reviewDraft) return [];

    const nextWarnings = Array.isArray(analysis.avvisi) ? [...analysis.avvisi] : [];
    if (!reviewRows.length) {
      nextWarnings.push(
        "Nessuna riga materiali, manodopera o ricambi e stata letta in modo strutturato.",
      );
    }
    if (!normalizeText(reviewDraft.targa)) {
      nextWarnings.push(
        "La targa non e stata letta in modo chiaro: compilala manualmente prima dell'archiviazione.",
      );
    }
    if (!normalizeText(reviewDraft.fornitore)) {
      nextWarnings.push("Il fornitore del preventivo richiede verifica manuale.");
    }
    if (!selectedRows.length && reviewRows.length) {
      nextWarnings.push("Tutte le righe sono state escluse dalla tabella archiviabile.");
    }
    return uniqueList(nextWarnings);
  }, [analysis, reviewDraft, reviewRows, selectedRows]);

  const duplicateCandidateSelected =
    duplicateCandidates.find((entry) => entry.id === selectedDuplicateId) ??
    duplicateCandidates[0] ??
    null;

  const summaryText = useMemo(() => {
    if (!analysis) {
      return "Carica un preventivo di officina e avvia l'analisi. Archivista prepara la review manutenzione, controlla duplicati e archivia il preventivo solo dopo la tua conferma esplicita.";
    }

    if (normalizeText(analysis.riassuntoBreve)) {
      return normalizeText(analysis.riassuntoBreve);
    }

    const summaryParts: string[] = [];
    const targa = normalizeText(reviewDraft?.targa);
    const supplier = normalizeText(reviewDraft?.fornitore);
    const date = normalizeText(reviewDraft?.dataDocumento);
    const total = normalizeScalar(reviewDraft?.totaleDocumento);

    if (targa) summaryParts.push(`mezzo ${targa}`);
    if (supplier) summaryParts.push(`officina ${supplier}`);
    if (date) summaryParts.push(`data ${date}`);
    if (total) summaryParts.push(`totale ${total}`);

    return summaryParts.length
      ? `Preventivo letto per il ramo Manutenzione: ${summaryParts.join(", ")}.`
      : "Preventivo letto per il ramo Manutenzione con alcuni campi ancora da verificare.";
  }, [analysis, reviewDraft]);

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
      ? "Il file viene letto dal backend OpenAI server-side dedicato alla review preventivi."
      : analysisStatus === "success"
        ? "La review sotto mostra dati letti, righe trovate e punti da verificare."
        : analysisStatus === "error"
          ? "Controlla il file e riprova."
          : "In questo step puoi analizzare un documento singolo o piu pagine dello stesso documento.";

  const handleAnalyze = async () => {
    if (!selectedFiles.length) {
      setErrorMessage("Carica prima almeno un file del documento.");
      setAnalysisStatus("error");
      return;
    }

    try {
      setAnalysisStatus("loading");
      setErrorMessage(null);
      setArchiveError(null);
      setArchiveResult(null);
      setAnalysis(null);
      setReviewDraft(null);
      setDuplicateStatus("idle");
      setDuplicateCandidates([]);
      setSelectedDuplicateId("");
      setDuplicateChoice(null);
      setArchiveStatus("idle");

      const normalizedAnalysis = await analyzePreventivoManutenzioneFiles(selectedFiles);

      setAnalysis(normalizedAnalysis);
      setReviewDraft(buildReviewDraft(normalizedAnalysis));
      setAnalysisStatus("success");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Errore durante l'analisi.");
      setAnalysisStatus("error");
    }
  };

  const handleCheckDuplicates = async () => {
    if (!reviewDraft) return;

    try {
      setDuplicateStatus("checking");
      setArchiveError(null);
      const matches = await findArchivistaDuplicateCandidates({
        family: "preventivo_manutenzione",
        target: "@preventivi",
        fornitore: reviewDraft.fornitore,
        numeroDocumento: reviewDraft.numeroDocumento,
        dataDocumento: reviewDraft.dataDocumento,
        totaleDocumento: reviewDraft.totaleDocumento,
        targa: reviewDraft.targa,
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
    if (!selectedFiles.length || !reviewDraft) return;
    if (duplicateStatus === "idle") {
      setArchiveError("Controlla duplicati prima della conferma finale.");
      return;
    }
    if (!normalizeText(reviewDraft.targa)) {
      setArchiveError("La targa e obbligatoria prima dell'archiviazione.");
      return;
    }
    if (duplicateStatus === "duplicates_found" && !duplicateChoice) {
      setArchiveError("Scegli prima come gestire il possibile duplicato trovato in archivio.");
      return;
    }

    try {
      setArchiveStatus("saving");
      setArchiveError(null);
      const archiveFile = await buildArchiveReadyFile(selectedFiles);
      const result = await archiveArchivistaPreventivoRecord({
        family: "preventivo_manutenzione",
        selectedFile: archiveFile,
        fileName: archiveFile.name,
        fornitore: reviewDraft.fornitore || null,
        numeroPreventivo: reviewDraft.numeroDocumento || null,
        dataPreventivo: reviewDraft.dataDocumento || null,
        totaleDocumento: reviewDraft.totaleDocumento || null,
        riassuntoBreve: summaryText,
        righe: selectedRows.map((row) => ({
          descrizione: row.descrizione,
          categoria: row.categoria,
          quantita: row.quantita,
          unita: row.unita,
          importo: row.importo,
          codice: row.codice,
          prezzoUnitario: row.prezzo,
        })),
        avvisi: warnings,
        campiMancanti: missingFields,
        ambitoPreventivo: "manutenzione",
        metadatiMezzo: {
          targa: reviewDraft.targa,
          km: reviewDraft.km || null,
        },
        duplicateChoice,
        duplicateCandidate: duplicateCandidateSelected,
        archivistaAnalysis: analysis,
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
      {/* UI clonata da ArchivistaManutenzioneBridge step 1 - upload multipagina e anteprima */}
      <section className="next-panel ia-archivista-bridge__step-card ia-archivista-bridge__step-card--upload iai-card">
        <div className="ia-archivista-bridge__step-head">
          <div className="ia-archivista-bridge__step-title-wrap">
            <span className="ia-archivista-bridge__step-number">1</span>
            <div className="ia-archivista-bridge__step-title-copy">
              <p className="internal-ai-card__eyebrow iai-sec-label">Step 1</p>
              <h3 className="ia-archivista-bridge__step-title">Carica il documento</h3>
            </div>
          </div>
        </div>

        <p className="ia-archivista__upload-shell-copy">{summaryText}</p>

        <div className="ia-archivista-bridge__thumb-grid">
          {selectedFiles.map((file, index) => {
            const previewUrl = imagePreviewUrls[index];
            const isActive = index === activePreviewIndex;
            return (
              <article
                key={`${file.name}-${file.size}-${index}`}
                className={`ia-archivista-bridge__thumb-card ${isActive ? "is-active" : ""}`}
              >
                <button
                  type="button"
                  className="ia-archivista-bridge__thumb-main"
                  onClick={() => setActivePreviewIndex(index)}
                  title="Apri questa pagina nell'anteprima principale"
                >
                  <div className="ia-archivista-bridge__thumb-badges">
                    <span className="ia-archivista-bridge__thumb-badge">PAG {index + 1}</span>
                  </div>
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={`Pagina ${index + 1}`}
                      className="ia-archivista-bridge__thumb-preview"
                    />
                  ) : (
                    <div className="ia-archivista-bridge__thumb-preview ia-archivista-bridge__thumb-preview--pdf">
                      PDF
                    </div>
                  )}
                  <span className="ia-archivista-bridge__thumb-name">{file.name}</span>
                </button>
                <button
                  type="button"
                  className="ia-archivista-bridge__thumb-remove"
                  onClick={() => removeSelectedFile(index)}
                  title="Rimuovi questa pagina dal documento corrente"
                >
                  X
                </button>
              </article>
            );
          })}

          <label className="ia-archivista-bridge__thumb-card ia-archivista-bridge__thumb-card--add">
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={(event) => {
                const nextFiles = Array.from(event.target.files ?? []);
                if (!nextFiles.length) {
                  event.currentTarget.value = "";
                  return;
                }
                applySelectedFiles([...selectedFiles, ...nextFiles]);
                event.currentTarget.value = "";
              }}
            />
            <span className="ia-archivista-bridge__thumb-add-sign">+</span>
            <strong>aggiungi pagina</strong>
          </label>
        </div>

        {activeSelectedFile ? (
          <div className="ia-archivista-bridge__step1-preview">
            <div className="ia-archivista-bridge__preview-toolbar">
              <button
                type="button"
                className="ia-archivista-bridge__ghost-button iai-doc-tbtn"
                onClick={() => setPreviewScale((value) => Math.min(2, value + 0.1))}
                disabled={!activeImagePreviewUrl}
                title="Aumenta zoom anteprima"
              >
                Zoom +
              </button>
              <button
                type="button"
                className="ia-archivista-bridge__ghost-button iai-doc-tbtn"
                onClick={() => setPreviewScale((value) => Math.max(0.8, value - 0.1))}
                disabled={!activeImagePreviewUrl}
                title="Riduci zoom anteprima"
              >
                Zoom -
              </button>
              <button
                type="button"
                className="ia-archivista-bridge__ghost-button iai-doc-tbtn"
                onClick={() => setPreviewRotation((value) => value + 90)}
                disabled={!activeImagePreviewUrl}
                title="Ruota anteprima"
              >
                Ruota
              </button>
            </div>
            {activeImagePreviewUrl ? (
              <div className="ia-archivista-bridge__preview-frame iai-doc-body">
                <img
                  src={activeImagePreviewUrl}
                  alt="Anteprima documento caricato"
                  className="ia-archivista-bridge__image-preview iai-doc-sheet-img"
                  style={{ transform: `scale(${previewScale}) rotate(${previewRotation}deg)` }}
                />
              </div>
            ) : (
              <div className="ia-archivista-bridge__preview-placeholder iai-doc-body">
                Per i PDF l&apos;anteprima visuale si apre dal file originale archiviato.
              </div>
            )}
          </div>
        ) : null}

        <button
          type="button"
          className="internal-ai-search__button ia-archivista__analyze-button iai-btn-analizza ia-archivista-bridge__step-primary"
          disabled={!selectedFiles.length || analysisStatus === "loading"}
          onClick={handleAnalyze}
          title="Avvia l'analisi del preventivo caricato"
        >
          {analysisStatus === "loading" ? "Analisi in corso..." : "Analizza documento"}
        </button>
      </section>

      {errorMessage ? <div className="ia-archivista__notice iai-avvisi-banner">{errorMessage}</div> : null}
      {archiveError ? <div className="ia-archivista__notice iai-avvisi-banner">{archiveError}</div> : null}

      {analysis && reviewDraft ? (
        <>
          {/* UI clonata da ArchivistaManutenzioneBridge step 2 - review analisi con campi mezzo-centrici */}
          <section className="next-panel ia-archivista-bridge__step-card iai-card">
            <div className="ia-archivista-bridge__step-head">
              <div className="ia-archivista-bridge__step-title-wrap">
                <span className="ia-archivista-bridge__step-number">2</span>
                <div className="ia-archivista-bridge__step-title-copy">
                  <p className="internal-ai-card__eyebrow iai-sec-label">Step 2</p>
                  <h3 className="ia-archivista-bridge__step-title">Risultato analisi</h3>
                </div>
              </div>
              <span className="ia-archivista-bridge__step-badge">{statusLabel}</span>
            </div>

            <div className="ia-archivista-bridge__summary-box">
              <p className="internal-ai-card__eyebrow">Riassunto breve</p>
              <p>{summaryText}</p>
            </div>

            <dl className="ia-archivista-bridge__step-facts">
              <div className={!normalizeText(reviewDraft.tipoDocumento) ? "is-missing" : ""}>
                <dt>Tipo</dt>
                <dd>{formatValue(reviewDraft.tipoDocumento)}</dd>
              </div>
              <div className={!normalizeText(reviewDraft.numeroDocumento) ? "is-missing" : ""}>
                <dt>Numero</dt>
                <dd>{formatValue(reviewDraft.numeroDocumento)}</dd>
              </div>
              <div className={!normalizeText(reviewDraft.dataDocumento) ? "is-missing" : ""}>
                <dt>Data</dt>
                <dd>{formatValue(reviewDraft.dataDocumento)}</dd>
              </div>
              <div className={!normalizeText(reviewDraft.targa) ? "is-missing" : ""}>
                <dt>Targa</dt>
                <dd>
                  <input
                    className="ia-archivista-bridge__compact-select iai-field-select"
                    type="text"
                    value={reviewDraft.targa}
                    onChange={(event) => patchReviewDraft({ targa: event.target.value })}
                    placeholder="Targa obbligatoria"
                  />
                </dd>
              </div>
              <div className={!normalizeText(reviewDraft.fornitore) ? "is-missing" : ""}>
                <dt>Officina</dt>
                <dd>{formatValue(reviewDraft.fornitore)}</dd>
              </div>
              <div>
                <dt>Km</dt>
                <dd>
                  <input
                    className="ia-archivista-bridge__compact-select iai-field-select"
                    type="text"
                    value={reviewDraft.km}
                    onChange={(event) => patchReviewDraft({ km: event.target.value })}
                    placeholder="Km opzionali"
                  />
                </dd>
              </div>
              <div className={!normalizeText(reviewDraft.totaleDocumento) ? "is-missing" : ""}>
                <dt>Totale</dt>
                <dd>{formatValue(reviewDraft.totaleDocumento)}</dd>
              </div>
            </dl>

            <div className="ia-archivista-bridge__divider" />

            {/* UI clonata da ArchivistaManutenzioneBridge step 2 - tabella righe review */}
            <div className="ia-archivista-bridge__collapsible">
              <div className="ia-archivista-bridge__collapsible-head is-static">
                <span>Materiali, manodopera e ricambi</span>
                <span className="ia-archivista-bridge__collapsible-meta">{reviewRows.length} voci</span>
              </div>

              {reviewRows.length ? (
                <div className="ia-archivista-bridge__table-wrap">
                  <table className="ia-archivista-bridge__table iai-righe-table">
                    <thead>
                      <tr>
                        <th>Importa</th>
                        <th>Descrizione</th>
                        <th>Q.ta</th>
                        <th>Importo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewRows.map((row, index) => {
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
                            <td>
                              <div className="ia-archivista-bridge__table-cell-main">
                                <strong>{row.descrizione}</strong>
                                <span>{row.kind}</span>
                              </div>
                            </td>
                            <td>{row.quantita}</td>
                            <td>{row.importo}</td>
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
                    Il documento puo comunque essere archiviato, ma i dettagli non sono stati letti in modo affidabile.
                  </p>
                </div>
              )}
            </div>

            <div className="ia-archivista-bridge__divider" />

            {/* UI clonata da ArchivistaManutenzioneBridge step 2 - avvisi e campi mancanti */}
            <div className="ia-archivista-bridge__warnings-panel">
              <div className="ia-archivista-bridge__status-box">
                <p className="internal-ai-card__eyebrow">Stato analisi</p>
                <strong>{statusLabel}</strong>
                <p>{statusDescription}</p>
              </div>
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

            <div className="ia-archivista-bridge__divider" />

            <div className="ia-archivista-bridge__step-actions">
              <button
                type="button"
                className="ia-archivista-bridge__ghost-button"
                onClick={resetWorkflowState}
                title="Annulla la review corrente e torna allo stato iniziale"
              >
                Annulla
              </button>
              <button
                type="button"
                className="internal-ai-search__button ia-archivista__analyze-button iai-btn-analizza"
                disabled={!reviewDraft || duplicateStatus === "checking"}
                onClick={handleCheckDuplicates}
                title="Controlla se esiste gia un preventivo molto simile in archivio"
              >
                {duplicateStatus === "checking" ? "Controllo in corso..." : "Controlla duplicati"}
              </button>
              <button
                type="button"
                className="internal-ai-search__button ia-archivista__analyze-button iai-btn-conferma"
                disabled={
                  !reviewDraft ||
                  !selectedFiles.length ||
                  archiveStatus === "saving" ||
                  duplicateStatus === "idle" ||
                  duplicateStatus === "checking" ||
                  (duplicateStatus === "duplicates_found" && !duplicateChoice)
                }
                onClick={handleArchive}
                title="Conferma l'archiviazione finale del preventivo"
              >
                {archiveStatus === "saving" ? "Archiviazione in corso..." : "Conferma e archivia"}
              </button>
            </div>
          </section>

          {/* UI clonata da ArchivistaManutenzioneBridge step 3 - controllo duplicati */}
          {duplicateStatus !== "idle" ? (
            <section className="next-panel ia-archivista-bridge__step-card iai-card">
              <div className="ia-archivista-bridge__step-head">
                <div className="ia-archivista-bridge__step-title-wrap">
                  <span className="ia-archivista-bridge__step-number">3</span>
                  <div className="ia-archivista-bridge__step-title-copy">
                    <p className="internal-ai-card__eyebrow iai-sec-label">Step 3</p>
                    <h3 className="ia-archivista-bridge__step-title">Controllo duplicati</h3>
                  </div>
                </div>
                <span className="ia-archivista-bridge__step-badge">
                  {duplicateCandidates.length} match trovati
                </span>
              </div>

              {duplicateCandidateSelected ? (
                <div className="ia-archivista-bridge__callout is-warning">
                  <strong>Documento simile trovato</strong>
                  <p>
                    {duplicateCandidateSelected.title}
                    {duplicateCandidateSelected.subtitle ? ` — ${duplicateCandidateSelected.subtitle}` : ""}
                  </p>
                </div>
              ) : duplicateStatus === "ready" ? (
                <div className="ia-archivista-bridge__callout is-highlight">
                  <strong>Nessun duplicato forte</strong>
                  <p>Puoi procedere con la conferma finale dell&apos;archiviazione.</p>
                </div>
              ) : (
                <div className="ia-archivista-bridge__empty">
                  <p className="ia-archivista-bridge__empty-title">Controllo in corso o non disponibile</p>
                  <p className="ia-archivista-bridge__empty-copy">
                    Verifica il risultato del controllo prima di archiviare definitivamente.
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
                    E lo stesso documento
                  </button>
                  <button
                    type="button"
                    className={`ia-archivista-bridge__choice ${duplicateChoice === "versione_migliore" ? "is-active" : ""}`}
                    onClick={() => setDuplicateChoice("versione_migliore")}
                    title="Archivia una nuova versione mantenendo il precedente"
                  >
                    E una versione migliore
                  </button>
                  <button
                    type="button"
                    className={`ia-archivista-bridge__choice ${duplicateChoice === "documento_diverso" ? "is-active" : ""}`}
                    onClick={() => setDuplicateChoice("documento_diverso")}
                    title="Archivia come documento separato"
                  >
                    E un documento diverso
                  </button>
                </div>
              ) : null}

              <div className="ia-archivista-bridge__step-actions">
                <button
                  type="button"
                  className="ia-archivista-bridge__ghost-button"
                  onClick={() => {
                    setDuplicateStatus("idle");
                    setDuplicateCandidates([]);
                    setSelectedDuplicateId("");
                    setDuplicateChoice(null);
                  }}
                  title="Chiudi il controllo duplicati e torna alla review"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  className="internal-ai-search__button ia-archivista__analyze-button iai-btn-conferma"
                  disabled={
                    !reviewDraft ||
                    !selectedFiles.length ||
                    archiveStatus === "saving" ||
                    duplicateStatus === "checking" ||
                    (duplicateStatus === "duplicates_found" && !duplicateChoice)
                  }
                  onClick={handleArchive}
                  title="Conferma l'archiviazione finale del preventivo"
                >
                  {archiveStatus === "saving" ? "Archiviazione in corso..." : "Conferma e archivia"}
                </button>
              </div>
            </section>
          ) : null}

          {/* UI clonata da ArchivistaManutenzioneBridge step 4 - conferma archivio senza creare manutenzione reale */}
          {archiveStatus === "success" ? (
            <section className="next-panel ia-archivista-bridge__step-card iai-card">
              <div className="ia-archivista-bridge__step-head">
                <div className="ia-archivista-bridge__step-title-wrap">
                  <span className="ia-archivista-bridge__step-number">4</span>
                  <div className="ia-archivista-bridge__step-title-copy">
                    <p className="internal-ai-card__eyebrow iai-sec-label">Step 4</p>
                    <h3 className="ia-archivista-bridge__step-title">Documento archiviato</h3>
                  </div>
                </div>
                <span className="ia-archivista-bridge__step-badge is-success">Archiviato</span>
              </div>

              <p className="ia-archivista-bridge__archive-line">
                {`${formatValue(reviewDraft.tipoDocumento || "Preventivo", "Preventivo")} ${formatValue(reviewDraft.numeroDocumento, "N.D.")} — ${formatValue(reviewDraft.fornitore, "Fornitore non letto")} — salvato in Preventivi -> ${formatValue(reviewDraft.targa, "targa da verificare")}`}
              </p>
              <div className="ia-archivista-bridge__callout is-highlight">
                <strong>Preventivo archiviato</strong>
                <p>{archiveResult?.message || "Il preventivo e stato archiviato correttamente in storage/@preventivi."}</p>
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
