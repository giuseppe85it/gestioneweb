import { useEffect, useMemo, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { saveNextManutenzioneBusinessRecord } from "../domain/nextManutenzioniDomain";
import { runWithCloneWriteScopedAllowance } from "../../utils/cloneWriteBarrier";
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
type MaintenanceCreateStatus = "idle" | "prompt" | "editing" | "saving" | "success" | "declined";
type MaintenanceRowKind = "Materiali" | "Manodopera" | "Ricambi" | "Altro";
type MaintenanceTipo = "mezzo" | "compressore" | "attrezzature";
type MaintenanceSottotipo = "" | "motrice" | "trattore";

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

type MaintenanceDraftMaterial = {
  id: string;
  descrizione: string;
  quantita: string;
  unita: string;
  categoria: string;
  selected: boolean;
};

type MaintenanceDraft = {
  targa: string;
  data: string;
  tipo: MaintenanceTipo;
  sottotipo: MaintenanceSottotipo;
  fornitore: string;
  eseguito: string;
  km: string;
  descrizione: string;
  importo: string;
  materiali: MaintenanceDraftMaterial[];
  sourceDocumentId: string | null;
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
  return new File(
    [pdfBlobPart],
    `manutenzione_multipagina_${Date.now()}.pdf`,
    { type: "application/pdf" },
  );
}

function normalizeDateInputValue(value: unknown): string {
  const normalized = normalizeText(value);
  if (!normalized) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const directMatch = normalized.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (!directMatch) {
    return "";
  }

  const day = directMatch[1].padStart(2, "0");
  const month = directMatch[2].padStart(2, "0");
  const year = directMatch[3].length === 2 ? `20${directMatch[3]}` : directMatch[3];
  return `${year}-${month}-${day}`;
}

function parseOptionalNumber(value: string): number | null {
  const normalized = normalizeText(value).replace(",", ".");
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildMaintenanceDraft(args: {
  analysis: ArchivistaManutenzioneAnalysis;
  fallbackSummary: string;
  sourceDocumentId: string | null;
}): MaintenanceDraft {
  const materials = Array.isArray(args.analysis.voci)
    ? args.analysis.voci.map((row, index) => {
        const kind = classifyMaintenanceRow(row);
        return {
          id: `materiale-${index}`,
          descrizione: formatValue(row.descrizione, "Riga senza descrizione leggibile"),
          quantita: normalizeScalar(row.quantita) || "1",
          unita: normalizeText(row.unita) || "pz",
          categoria: normalizeText(row.categoria) || kind,
          selected: kind !== "Manodopera",
        };
      })
    : [];

  return {
    targa: normalizeText(args.analysis.targa),
    data: normalizeDateInputValue(args.analysis.dataDocumento),
    tipo: "mezzo",
    sottotipo: "",
    fornitore: normalizeText(args.analysis.fornitore),
    eseguito: "",
    km: normalizeScalar(args.analysis.km),
    descrizione: normalizeText(args.analysis.riassuntoBreve) || args.fallbackSummary,
    importo: normalizeScalar(args.analysis.totaleDocumento),
    materiali: materials,
    sourceDocumentId: args.sourceDocumentId,
  };
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<Array<string | null>>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
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
  const [maintenanceCreateStatus, setMaintenanceCreateStatus] =
    useState<MaintenanceCreateStatus>("idle");
  const [maintenanceDraft, setMaintenanceDraft] = useState<MaintenanceDraft | null>(null);
  const [maintenanceValidationError, setMaintenanceValidationError] = useState<string | null>(null);
  const [maintenanceSaveError, setMaintenanceSaveError] = useState<string | null>(null);
  const [createdMaintenanceId, setCreatedMaintenanceId] = useState<string | null>(null);
  const [showMateriali, setShowMateriali] = useState(true);
  const [showAvvisi, setShowAvvisi] = useState(false);

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

  function resetWorkflowState() {
    setAnalysis(null);
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
    setMaintenanceCreateStatus("idle");
    setMaintenanceDraft(null);
    setMaintenanceValidationError(null);
    setMaintenanceSaveError(null);
    setCreatedMaintenanceId(null);
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

  function patchMaintenanceDraft(patch: Partial<MaintenanceDraft>) {
    setMaintenanceDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function patchMaintenanceMaterial(
    materialId: string,
    patch: Partial<MaintenanceDraftMaterial>,
  ) {
    setMaintenanceDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        materiali: current.materiali.map((material) =>
          material.id === materialId ? { ...material, ...patch } : material,
        ),
      };
    });
  }

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
      setDuplicateStatus("idle");
      setDuplicateCandidates([]);
      setSelectedDuplicateId("");
      setDuplicateChoice(null);
      setArchiveStatus("idle");
      setMaintenanceCreateStatus("idle");
      setMaintenanceDraft(null);
      setMaintenanceValidationError(null);
      setMaintenanceSaveError(null);
      setCreatedMaintenanceId(null);

      const pagesPayload = await Promise.all(
        selectedFiles.map(async (file) => {
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
    if (!selectedFiles.length || !analysis) return;
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
      setMaintenanceValidationError(null);
      setMaintenanceSaveError(null);
      setCreatedMaintenanceId(null);
      const archiveFile = await buildArchiveReadyFile(selectedFiles);
      const result = await archiveArchivistaDocumentRecord({
        family: "fattura_ddt_manutenzione",
        context: "manutenzione",
        targetCollection: "@documenti_mezzi",
        categoriaArchivio: "MEZZO",
        selectedFile: archiveFile,
        fileName: archiveFile.name,
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
      setMaintenanceDraft(
        buildMaintenanceDraft({
          analysis,
          fallbackSummary: summaryText,
          sourceDocumentId: result.archiveId,
        }),
      );
      setMaintenanceCreateStatus("prompt");
    } catch (error) {
      setArchiveError(error instanceof Error ? error.message : "Archiviazione non completata.");
      setArchiveStatus("error");
    }
  };

  const handleStartMaintenanceCreation = () => {
    setMaintenanceCreateStatus("editing");
    setMaintenanceValidationError(null);
    setMaintenanceSaveError(null);
  };

  const handleArchiveOnly = () => {
    setMaintenanceCreateStatus("declined");
    setMaintenanceValidationError(null);
    setMaintenanceSaveError(null);
  };

  const handleCreateMaintenance = async () => {
    if (!maintenanceDraft) {
      return;
    }

    const normalizedTarga = normalizeText(maintenanceDraft.targa);
    const normalizedDescription = normalizeText(maintenanceDraft.descrizione);

    setMaintenanceValidationError(null);
    setMaintenanceSaveError(null);

    if (!normalizedTarga) {
      setMaintenanceValidationError("La targa e obbligatoria.");
      return;
    }

    if (!normalizedDescription) {
      setMaintenanceValidationError("La descrizione e obbligatoria.");
      return;
    }

    const materialsPayload = maintenanceDraft.materiali
      .filter((material) => material.selected && normalizeText(material.descrizione))
      .map((material, index) => ({
        id: material.id || `materiale-${index}`,
        label: normalizeText(material.descrizione),
        quantita: parseOptionalNumber(material.quantita) ?? 1,
        unita: normalizeText(material.unita) || "pz",
        fromInventario: false,
      }));

    const payload = {
      targa: normalizedTarga,
      tipo: maintenanceDraft.tipo,
      sottotipo: maintenanceDraft.sottotipo || null,
      fornitore: normalizeText(maintenanceDraft.fornitore) || null,
      km: parseOptionalNumber(maintenanceDraft.km),
      descrizione: normalizedDescription,
      eseguito: normalizeText(maintenanceDraft.eseguito) || null,
      data: normalizeText(maintenanceDraft.data),
      materiali: materialsPayload,
      sourceDocumentId: maintenanceDraft.sourceDocumentId,
      importo: parseOptionalNumber(maintenanceDraft.importo),
    };

    try {
      setMaintenanceCreateStatus("saving");
      const savedRecord = await runWithCloneWriteScopedAllowance(
        "internal_ai_magazzino_inline_magazzino",
        async () => saveNextManutenzioneBusinessRecord(payload),
      );
      setCreatedMaintenanceId(savedRecord.id);
      setMaintenanceCreateStatus("success");
    } catch (error) {
      setMaintenanceSaveError(
        error instanceof Error ? error.message : "Salvataggio manutenzione non completato.",
      );
      setMaintenanceCreateStatus("editing");
    }
  };

  const maintenanceStatusTitle =
    maintenanceCreateStatus === "success"
      ? "Manutenzione creata"
      : archiveStatus === "success"
        ? maintenanceCreateStatus === "declined"
          ? "Solo archiviazione completata"
          : "Step 2 disponibile"
        : "Nessuna manutenzione ancora creata";

  const maintenanceStatusCopy =
    maintenanceCreateStatus === "success"
      ? "La manutenzione e stata creata e collegata al documento archiviato."
      : archiveStatus === "success"
        ? maintenanceCreateStatus === "declined"
          ? "Hai scelto di fermarti all'archiviazione del documento."
          : "Dopo l'archiviazione puoi decidere se creare anche una manutenzione reale."
        : "Archivista prepara la review e archivia il documento; la manutenzione resta una scelta separata del secondo step.";

  const toggleRow = (rowKey: string) => {
    setSelectedRowKeys((current) =>
      current.includes(rowKey) ? current.filter((entry) => entry !== rowKey) : [...current, rowKey],
    );
  };

  return (
    <div className="ia-archivista-bridge">
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

        <p className="ia-archivista__upload-shell-copy">
          {summaryText} Dopo la conferma finale puoi scegliere se creare anche una manutenzione reale.
        </p>

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
          title="Avvia l'analisi manutenzione del documento caricato"
        >
          {analysisStatus === "loading" ? "Analisi in corso..." : "Analizza documento"}
        </button>
      </section>

      {errorMessage ? <div className="ia-archivista__notice iai-avvisi-banner">{errorMessage}</div> : null}
      {archiveError ? <div className="ia-archivista__notice iai-avvisi-banner">{archiveError}</div> : null}

      {analysis ? (
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
            <div className={!normalizeText(analysis.tipoDocumento) ? "is-missing" : ""}>
              <dt>Tipo</dt>
              <dd>{formatValue(analysis.tipoDocumento)}</dd>
            </div>
            <div className={!normalizeText(analysis.numeroDocumento) ? "is-missing" : ""}>
              <dt>Numero</dt>
              <dd>{formatValue(analysis.numeroDocumento)}</dd>
            </div>
            <div className={!normalizeText(analysis.dataDocumento) ? "is-missing" : ""}>
              <dt>Data</dt>
              <dd>{formatValue(analysis.dataDocumento)}</dd>
            </div>
            <div className={!normalizeText(analysis.targa) ? "is-missing" : ""}>
              <dt>Targa</dt>
              <dd>{formatValue(analysis.targa)}</dd>
            </div>
            <div className={!normalizeText(analysis.fornitore) ? "is-missing" : ""}>
              <dt>Officina</dt>
              <dd>{formatValue(analysis.fornitore)}</dd>
            </div>
            <div className={!normalizeScalar(analysis.km) ? "is-missing" : ""}>
              <dt>Km</dt>
              <dd>{formatValue(analysis.km)}</dd>
            </div>
            <div className={!normalizeScalar(analysis.totaleDocumento) ? "is-missing" : ""}>
              <dt>Totale</dt>
              <dd>{formatValue(analysis.totaleDocumento)}</dd>
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

          <div className="ia-archivista-bridge__divider" />

          <div className="ia-archivista-bridge__collapsible">
            <button
              type="button"
              className="ia-archivista-bridge__collapsible-head"
              onClick={() => setShowMateriali((value) => !value)}
            >
              <span>Materiali, manodopera e ricambi</span>
              <span className="ia-archivista-bridge__collapsible-meta">
                {reviewRows.length} voci {showMateriali ? "−" : "+"}
              </span>
            </button>

            {showMateriali ? (
              reviewRows.length ? (
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
                        const isDimmed = row.kind === "Manodopera" && !isSelected;
                        return (
                          <tr
                            key={rowKey}
                            className={!isSelected ? "iai-row-unchecked" : ""}
                            style={isDimmed ? { opacity: 0.48 } : undefined}
                          >
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
                    Il documento puo comunque essere utile per la review, ma i dettagli non sono stati letti in modo affidabile.
                  </p>
                </div>
              )
            ) : null}
          </div>

          <div className="ia-archivista-bridge__divider" />

          <div className="ia-archivista-bridge__collapsible">
            <button
              type="button"
              className="ia-archivista-bridge__collapsible-head"
              onClick={() => setShowAvvisi((value) => !value)}
            >
              <span>Avvisi</span>
              <span className="ia-archivista-bridge__collapsible-meta">
                {warnings.length + missingFields.length} elementi {showAvvisi ? "−" : "+"}
              </span>
            </button>

            {showAvvisi ? (
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
              disabled={!analysis || duplicateStatus === "checking"}
              onClick={handleCheckDuplicates}
              title="Controlla se esiste gia un documento molto simile in archivio"
            >
              {duplicateStatus === "checking" ? "Controllo in corso..." : "Controlla duplicati"}
            </button>
            <button
              type="button"
              className="internal-ai-search__button ia-archivista__analyze-button iai-btn-conferma"
              disabled={
                !analysis ||
                !selectedFiles.length ||
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
          </div>
        </section>
      ) : null}

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
                !analysis ||
                !selectedFiles.length ||
                archiveStatus === "saving" ||
                duplicateStatus === "checking" ||
                (duplicateStatus === "duplicates_found" && !duplicateChoice)
              }
              onClick={handleArchive}
              title="Conferma l'archiviazione finale del documento"
            >
              {archiveStatus === "saving" ? "Archiviazione in corso..." : "Conferma e archivia"}
            </button>
          </div>
        </section>
      ) : null}

      {archiveStatus === "success" ? (
        <>
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
              {`${formatValue(analysis?.tipoDocumento, "Fattura")} ${formatValue(analysis?.numeroDocumento, "N.D.")} — ${formatValue(analysis?.fornitore, "Fornitore non letto")} — salvata in Documenti e costi -> ${formatValue(analysis?.targa, "targa da verificare")}`}
            </p>
            <p className="internal-ai-card__meta">
              {archiveResult?.message || maintenanceStatusCopy}
            </p>

            {maintenanceCreateStatus === "prompt" ? (
              <div className="ia-archivista-bridge__success-bar">
                <div>
                  <strong>Vuoi creare anche la manutenzione?</strong>
                  <p>Puoi chiudere qui il flusso oppure aprire il form gia precompilato.</p>
                </div>
                <div className="ia-archivista-bridge__step-actions">
                  <button
                    type="button"
                    className="ia-archivista-bridge__ghost-button"
                    onClick={handleArchiveOnly}
                    title="Chiudi il flusso fermandoti all'archiviazione"
                  >
                    No, solo archivia
                  </button>
                  <button
                    type="button"
                    className="internal-ai-search__button ia-archivista__analyze-button iai-btn-conferma"
                    onClick={handleStartMaintenanceCreation}
                    title="Apri il form precompilato per creare la manutenzione"
                  >
                    Si, crea manutenzione
                  </button>
                </div>
              </div>
            ) : null}

            {maintenanceCreateStatus === "declined" ? (
              <div className="ia-archivista-bridge__callout is-highlight">
                <strong>{maintenanceStatusTitle}</strong>
                <p>{maintenanceStatusCopy}</p>
              </div>
            ) : null}
          </section>

          {(maintenanceCreateStatus === "editing" || maintenanceCreateStatus === "saving") &&
          maintenanceDraft ? (
            <section className="next-panel ia-archivista-bridge__step-card iai-card">
              <div className="ia-archivista-bridge__step-head">
                <div className="ia-archivista-bridge__step-title-wrap">
                  <span className="ia-archivista-bridge__step-number">5</span>
                  <div className="ia-archivista-bridge__step-title-copy">
                    <p className="internal-ai-card__eyebrow iai-sec-label">Step 5</p>
                    <h3 className="ia-archivista-bridge__step-title">Crea manutenzione</h3>
                  </div>
                </div>
              </div>

              <div className="ia-archivista-bridge__maintenance-form">
                <input type="hidden" value={maintenanceDraft.sourceDocumentId ?? ""} />

                <div className="ia-archivista-bridge__maintenance-grid">
                  <label className="ia-archivista-bridge__field-block">
                    <span>Targa</span>
                    <input
                      className="ia-archivista-bridge__compact-select iai-field-select"
                      type="text"
                      value={maintenanceDraft.targa}
                      onChange={(event) => patchMaintenanceDraft({ targa: event.target.value })}
                      disabled={maintenanceCreateStatus === "saving"}
                    />
                  </label>

                  <label className="ia-archivista-bridge__field-block">
                    <span>Data intervento</span>
                    <input
                      className="ia-archivista-bridge__compact-select iai-field-select"
                      type="date"
                      value={maintenanceDraft.data}
                      onChange={(event) => patchMaintenanceDraft({ data: event.target.value })}
                      disabled={maintenanceCreateStatus === "saving"}
                    />
                  </label>

                  <label className="ia-archivista-bridge__field-block">
                    <span>Tipo</span>
                    <select
                      className="ia-archivista-bridge__compact-select iai-field-select"
                      value={maintenanceDraft.tipo}
                      onChange={(event) =>
                        patchMaintenanceDraft({ tipo: event.target.value as MaintenanceTipo })
                      }
                      disabled={maintenanceCreateStatus === "saving"}
                    >
                      <option value="mezzo">mezzo</option>
                      <option value="compressore">compressore</option>
                      <option value="attrezzature">attrezzature</option>
                    </select>
                  </label>

                  <label className="ia-archivista-bridge__field-block">
                    <span>Sottotipo</span>
                    <select
                      className="ia-archivista-bridge__compact-select iai-field-select"
                      value={maintenanceDraft.sottotipo}
                      onChange={(event) =>
                        patchMaintenanceDraft({
                          sottotipo: event.target.value as MaintenanceSottotipo,
                        })
                      }
                      disabled={maintenanceCreateStatus === "saving"}
                    >
                      <option value="">Nessuno</option>
                      <option value="motrice">motrice</option>
                      <option value="trattore">trattore</option>
                    </select>
                  </label>

                  <label className="ia-archivista-bridge__field-block">
                    <span>Officina</span>
                    <input
                      className="ia-archivista-bridge__compact-select iai-field-select"
                      type="text"
                      value={maintenanceDraft.fornitore}
                      onChange={(event) => patchMaintenanceDraft({ fornitore: event.target.value })}
                      disabled={maintenanceCreateStatus === "saving"}
                    />
                  </label>

                  <label className="ia-archivista-bridge__field-block">
                    <span>Eseguito da</span>
                    <input
                      className="ia-archivista-bridge__compact-select iai-field-select"
                      type="text"
                      value={maintenanceDraft.eseguito}
                      onChange={(event) => patchMaintenanceDraft({ eseguito: event.target.value })}
                      disabled={maintenanceCreateStatus === "saving"}
                    />
                  </label>

                  <label className="ia-archivista-bridge__field-block">
                    <span>Km</span>
                    <input
                      className="ia-archivista-bridge__compact-select iai-field-select"
                      type="number"
                      min="0"
                      value={maintenanceDraft.km}
                      onChange={(event) => patchMaintenanceDraft({ km: event.target.value })}
                      disabled={maintenanceCreateStatus === "saving"}
                    />
                  </label>

                  <label className="ia-archivista-bridge__field-block">
                    <span>Importo</span>
                    <input
                      className="ia-archivista-bridge__compact-select iai-field-select"
                      type="number"
                      min="0"
                      step="0.01"
                      value={maintenanceDraft.importo}
                      onChange={(event) => patchMaintenanceDraft({ importo: event.target.value })}
                      disabled={maintenanceCreateStatus === "saving"}
                    />
                  </label>
                </div>

                <label className="ia-archivista-bridge__field-block ia-archivista-bridge__field-block--full">
                  <span>Descrizione</span>
                  <textarea
                    className="ia-archivista-bridge__compact-select iai-field-select"
                    rows={4}
                    value={maintenanceDraft.descrizione}
                    onChange={(event) => patchMaintenanceDraft({ descrizione: event.target.value })}
                    disabled={maintenanceCreateStatus === "saving"}
                    style={{ resize: "vertical" }}
                  />
                </label>

                <div className="ia-archivista-bridge__divider" />

                <div className="ia-archivista-bridge__collapsible">
                  <button
                    type="button"
                    className="ia-archivista-bridge__collapsible-head"
                    onClick={() => setShowMateriali((value) => !value)}
                  >
                    <span>Materiali da includere</span>
                    <span className="ia-archivista-bridge__collapsible-meta">
                      {maintenanceDraft.materiali.filter((material) => material.selected).length} selezionati {showMateriali ? "−" : "+"}
                    </span>
                  </button>

                  {showMateriali ? (
                    maintenanceDraft.materiali.length ? (
                      <div className="ia-archivista-bridge__table-wrap">
                        <table className="ia-archivista-bridge__table iai-righe-table">
                          <thead>
                            <tr>
                              <th>Includi</th>
                              <th>Descrizione</th>
                              <th>Q.ta</th>
                              <th>Unita</th>
                            </tr>
                          </thead>
                          <tbody>
                            {maintenanceDraft.materiali.map((material) => {
                              const isDimmed =
                                material.categoria.toUpperCase().includes("MANODOP") &&
                                !material.selected;
                              return (
                                <tr key={material.id} style={isDimmed ? { opacity: 0.48 } : undefined}>
                                  <td>
                                    <label className="ia-archivista-bridge__table-check iai-row-cb">
                                      <input
                                        type="checkbox"
                                        checked={material.selected}
                                        onChange={(event) =>
                                          patchMaintenanceMaterial(material.id, {
                                            selected: event.target.checked,
                                          })
                                        }
                                        disabled={maintenanceCreateStatus === "saving"}
                                      />
                                    </label>
                                  </td>
                                  <td>
                                    <div className="ia-archivista-bridge__table-cell-main">
                                      <strong>{material.descrizione}</strong>
                                      <span>{material.categoria}</span>
                                    </div>
                                  </td>
                                  <td>{material.quantita}</td>
                                  <td>{material.unita}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="ia-archivista-bridge__empty">
                        <p className="ia-archivista-bridge__empty-title">Nessuna voce strutturata</p>
                        <p className="ia-archivista-bridge__empty-copy">
                          L&apos;IA non ha estratto materiali o ricambi in modo affidabile da questo documento.
                        </p>
                      </div>
                    )
                  ) : null}
                </div>

                {maintenanceValidationError ? (
                  <div className="ia-archivista__notice iai-avvisi-banner">
                    {maintenanceValidationError}
                  </div>
                ) : null}

                {maintenanceSaveError ? (
                  <div className="ia-archivista__notice iai-avvisi-banner">
                    {maintenanceSaveError}
                  </div>
                ) : null}

                <div className="ia-archivista-bridge__step-actions">
                  <button
                    type="button"
                    className="ia-archivista-bridge__ghost-button"
                    onClick={handleArchiveOnly}
                    disabled={maintenanceCreateStatus === "saving"}
                    title="Chiudi il secondo step senza creare manutenzione"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    className="internal-ai-search__button ia-archivista__analyze-button iai-btn-conferma"
                    onClick={() => void handleCreateMaintenance()}
                    disabled={maintenanceCreateStatus === "saving"}
                    title="Salva la manutenzione collegata al documento archiviato"
                  >
                    {maintenanceCreateStatus === "saving"
                      ? "Salvataggio in corso..."
                      : "Salva manutenzione"}
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {maintenanceCreateStatus === "success" ? (
            <section className="next-panel ia-archivista-bridge__step-card iai-card">
              <div className="ia-archivista-bridge__step-head">
                <div className="ia-archivista-bridge__step-title-wrap">
                  <span className="ia-archivista-bridge__step-number">5</span>
                  <div className="ia-archivista-bridge__step-title-copy">
                    <p className="internal-ai-card__eyebrow iai-sec-label">Step 5</p>
                    <h3 className="ia-archivista-bridge__step-title">Manutenzione creata</h3>
                  </div>
                </div>
                <span className="ia-archivista-bridge__step-badge is-success">Manutenzione creata</span>
              </div>

              <div className="ia-archivista-bridge__callout is-highlight">
                <strong>Manutenzione creata</strong>
                <p>La manutenzione e stata salvata correttamente e collegata al documento archiviato.</p>
              </div>

              <div className="ia-archivista-bridge__step-actions">
                <a
                  href="/next/manutenzioni"
                  className="internal-ai-nav__link"
                  title="Apri il workbench Manutenzioni"
                >
                  Vai a /next/manutenzioni
                </a>
                {createdMaintenanceId ? (
                  <span className="internal-ai-card__meta">ID manutenzione: {createdMaintenanceId}</span>
                ) : null}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
