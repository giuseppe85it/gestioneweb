import fs from "node:fs/promises";
import path from "node:path";
import { getInternalAiRuntimeDataRoot } from "./internal-ai-persistence.js";

const ATTACHMENTS_DIR = path.join(getInternalAiRuntimeDataRoot(), "chat-attachments");
const MAX_ATTACHMENT_SIZE_BYTES = 4 * 1024 * 1024;

function sanitizeFileName(fileName) {
  return String(fileName ?? "allegato")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "allegato";
}

export function buildInternalAiChatAttachmentFilePath(attachmentId, fileName) {
  const safeFileName = sanitizeFileName(fileName);
  return path.join(ATTACHMENTS_DIR, `${attachmentId}-${safeFileName}`);
}

function inferAttachmentKind(fileName, mimeType) {
  const normalizedMime = String(mimeType ?? "").toLowerCase();
  const extension = path.extname(fileName).toLowerCase();

  if (normalizedMime === "application/pdf" || extension === ".pdf") {
    return "pdf";
  }

  if (normalizedMime.startsWith("image/")) {
    return "image";
  }

  if (normalizedMime.startsWith("text/") || [".txt", ".md"].includes(extension)) {
    return "text";
  }

  if ([".doc", ".docx", ".odt"].includes(extension)) {
    return "document";
  }

  if ([".xls", ".xlsx", ".csv"].includes(extension)) {
    return "spreadsheet";
  }

  return "other";
}

function inferPreviewMode(kind) {
  if (kind === "image") {
    return "image";
  }
  if (kind === "pdf") {
    return "pdf";
  }
  if (kind === "text") {
    return "text";
  }
  return "download_only";
}

function buildAttachmentNote(kind) {
  if (kind === "image") {
    return "Immagine IA-only allegata al thread. Posso usarla come contesto dichiarato, ma non ho ancora analisi visiva profonda collegata.";
  }
  if (kind === "pdf") {
    return "PDF IA-only allegato al thread. Posso usarlo come contesto documentale dichiarato, ma non ho ancora estrazione profonda del contenuto.";
  }
  if (kind === "text") {
    return "Documento testuale IA-only allegato al thread. Posso usare l'estratto testuale disponibile come contesto.";
  }
  if (kind === "document" || kind === "spreadsheet") {
    return "Documento IA-only allegato al thread. Il file e disponibile come contesto e apertura manuale, ma non e ancora parserizzato in profondita.";
  }
  return "Allegato IA-only disponibile nel thread. Il file e collegato alla conversazione, ma non esiste ancora parsing profondo per questo formato.";
}

export function createAttachmentId() {
  return `attach-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getInternalAiChatAttachmentsDir() {
  return ATTACHMENTS_DIR;
}

export function getInternalAiChatAttachmentMaxSizeBytes() {
  return MAX_ATTACHMENT_SIZE_BYTES;
}

export function buildInternalAiChatAttachmentAssetPath(attachmentId) {
  return `/internal-ai-backend/attachments/assets/${encodeURIComponent(attachmentId)}`;
}

export function materializeInternalAiChatAttachmentRecord(args) {
  const kind = inferAttachmentKind(args.fileName, args.mimeType);
  return {
    id: args.id,
    threadId: "main_chat",
    fileName: sanitizeFileName(args.fileName),
    mimeType: args.mimeType || null,
    sizeBytes: args.sizeBytes,
    kind,
    storageMode: "server_file_isolated",
    previewMode: inferPreviewMode(kind),
    persisted: true,
    uploadedAt: args.uploadedAt,
    note: buildAttachmentNote(kind),
    textExcerpt:
      typeof args.textExcerpt === "string" && args.textExcerpt.trim()
        ? args.textExcerpt.trim().slice(0, 1600)
        : null,
    serverAssetPath: buildInternalAiChatAttachmentAssetPath(args.id),
    localObjectUrl: null,
  };
}

export async function ensureInternalAiChatAttachmentsDir() {
  await fs.mkdir(ATTACHMENTS_DIR, { recursive: true });
}

export async function writeInternalAiChatAttachmentFile(args) {
  await ensureInternalAiChatAttachmentsDir();
  const absolutePath = buildInternalAiChatAttachmentFilePath(args.id, args.fileName);
  await fs.writeFile(absolutePath, Buffer.from(args.contentBase64, "base64"));
  return absolutePath;
}

export async function deleteInternalAiChatAttachmentFile(absolutePath) {
  if (!absolutePath) {
    return;
  }

  await fs.unlink(absolutePath).catch(() => {});
}
