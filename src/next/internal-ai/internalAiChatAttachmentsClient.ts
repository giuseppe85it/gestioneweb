import type {
  InternalAiChatAttachment,
  InternalAiChatAttachmentKind,
  InternalAiChatAttachmentPreviewMode,
} from "./internalAiTypes";
import { getInternalAiServerAdapterBaseUrl } from "./internalAiServerRepoUnderstandingClient";
import {
  INTERNAL_AI_SERVER_ADAPTER_PORT,
  INTERNAL_AI_SERVER_ADAPTER_ROUTES,
  type InternalAiServerAdapterResponseEnvelope,
  type InternalAiServerAttachmentsRepositoryRequestBody,
  type InternalAiServerAttachmentsRepositoryResponseData,
  type InternalAiServerAttachmentsRepositoryState,
} from "../../../backend/internal-ai/src/internalAiServerPersistenceContracts";

export type InternalAiChatAttachmentsRepositorySnapshotResult =
  | {
      status: "ready";
      message: string;
      payload: InternalAiChatAttachment[];
    }
  | {
      status: "not_enabled" | "error";
      message: string;
      payload: null;
    };

export type InternalAiChatAttachmentUploadResult =
  | {
      status: "ready";
      message: string;
      attachment: InternalAiChatAttachment;
      repositoryState: InternalAiChatAttachment[];
    }
  | {
      status: "not_enabled" | "error";
      message: string;
      attachment: InternalAiChatAttachment | null;
      repositoryState: null;
    };

export type InternalAiChatAttachmentRemovalResult =
  | {
      status: "ready";
      message: string;
      attachment: InternalAiChatAttachment | null;
      repositoryState: InternalAiChatAttachment[];
    }
  | {
      status: "not_enabled" | "error" | "not_found";
      message: string;
      attachment: InternalAiChatAttachment | null;
      repositoryState: null;
    };

function getConfiguredBaseUrl(): string | null {
  const configured = import.meta.env.VITE_INTERNAL_AI_BACKEND_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/g, "");
  }

  const baseUrl = getInternalAiServerAdapterBaseUrl();
  if (baseUrl) {
    return baseUrl;
  }

  if (typeof window === "undefined") {
    return null;
  }

  const { hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `http://127.0.0.1:${INTERNAL_AI_SERVER_ADAPTER_PORT}`;
  }

  return null;
}

async function postToServer<TData>(
  path: string,
  body: Record<string, unknown>,
): Promise<InternalAiServerAdapterResponseEnvelope<TData> | null> {
  const baseUrl = getConfiguredBaseUrl();
  if (!baseUrl) {
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(body),
    });
    const rawJson = await response.json().catch(() => null);

    if (!rawJson || typeof rawJson !== "object") {
      return null;
    }

    return rawJson as InternalAiServerAdapterResponseEnvelope<TData>;
  } catch {
    return null;
  }
}

function buildRequestId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function inferAttachmentKind(fileName: string, mimeType: string | null): InternalAiChatAttachmentKind {
  const normalizedMime = String(mimeType ?? "").toLowerCase();
  const extension = fileName.toLowerCase().split(".").pop() ?? "";

  if (normalizedMime === "application/pdf" || extension === "pdf") {
    return "pdf";
  }

  if (normalizedMime.startsWith("image/")) {
    return "image";
  }

  if (normalizedMime.startsWith("text/") || ["txt", "md"].includes(extension)) {
    return "text";
  }

  if (["doc", "docx", "odt"].includes(extension)) {
    return "document";
  }

  if (["xls", "xlsx", "csv"].includes(extension)) {
    return "spreadsheet";
  }

  return "other";
}

function inferPreviewMode(kind: InternalAiChatAttachmentKind): InternalAiChatAttachmentPreviewMode {
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

function sanitizeFileName(fileName: string): string {
  return String(fileName ?? "allegato")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "allegato";
}

function buildLocalAttachmentNote(kind: InternalAiChatAttachmentKind): string {
  if (kind === "image") {
    return "Immagine IA-only allegata in locale. Il file resta nella chat ma non ha ancora analisi visiva profonda.";
  }

  if (kind === "pdf") {
    return "PDF IA-only allegato in locale. Il file resta collegato alla chat ma non ha ancora parsing profondo.";
  }

  if (kind === "text") {
    return "Documento testuale IA-only allegato in locale. L'estratto testuale puo essere usato come contesto.";
  }

  return "Allegato IA-only collegato in locale. Il file e disponibile alla chat, ma non ha parsing profondo.";
}

function createLocalAttachmentRecord(args: {
  file: File;
  objectUrl: string;
  textExcerpt: string | null;
}): InternalAiChatAttachment {
  const kind = inferAttachmentKind(args.file.name, args.file.type || null);
  const uploadedAt = new Date().toISOString();

  return {
    id: `local-attach-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    threadId: "main_chat",
    fileName: sanitizeFileName(args.file.name),
    mimeType: args.file.type || null,
    sizeBytes: args.file.size,
    kind,
    storageMode: "local_browser_only",
    previewMode: inferPreviewMode(kind),
    persisted: false,
    uploadedAt,
    note: buildLocalAttachmentNote(kind),
    textExcerpt: args.textExcerpt,
    serverAssetPath: null,
    localObjectUrl: args.objectUrl,
  };
}

function normalizeRepositoryState(state: InternalAiServerAttachmentsRepositoryState): InternalAiChatAttachment[] {
  return Array.isArray(state.items) ? state.items : [];
}

export function buildInternalAiChatAttachmentAssetUrl(
  attachment: InternalAiChatAttachment | null | undefined,
): string | null {
  if (!attachment) {
    return null;
  }

  if (attachment.storageMode === "local_browser_only") {
    return attachment.localObjectUrl ?? null;
  }

  const baseUrl = getConfiguredBaseUrl();
  if (!baseUrl || !attachment.serverAssetPath) {
    return attachment.localObjectUrl ?? null;
  }

  return `${baseUrl}${attachment.serverAssetPath}`;
}

export function buildInternalAiChatAttachmentPreviewLabel(
  attachment: InternalAiChatAttachment,
): string {
  if (attachment.previewMode === "image") {
    return "Immagine";
  }
  if (attachment.previewMode === "pdf") {
    return "PDF";
  }
  if (attachment.previewMode === "text") {
    return "Testo";
  }
  return "Download";
}

export async function readInternalAiServerChatAttachmentsSnapshot(): Promise<InternalAiChatAttachmentsRepositorySnapshotResult> {
  const baseUrl = getConfiguredBaseUrl();
  if (!baseUrl) {
    return {
      status: "not_enabled",
      message:
        "Adapter server-side non configurato nel browser corrente: resta attivo il fallback locale per gli allegati IA-only.",
      payload: null,
    };
  }

  const response = await postToServer<InternalAiServerAttachmentsRepositoryResponseData>(
    INTERNAL_AI_SERVER_ADAPTER_ROUTES.attachmentsRepository,
    {
      operation: "list_thread_attachments",
      actorId: "next-ia-interna",
      requestId: buildRequestId("attachments-read"),
      threadId: "main_chat",
    } satisfies InternalAiServerAttachmentsRepositoryRequestBody,
  );

  if (!response || response.endpointId !== "attachments.repository") {
    return {
      status: "not_enabled",
      message:
        "Endpoint attachments.repository non raggiungibile sull'adapter server-side: resta attivo il fallback locale per gli allegati IA-only.",
      payload: null,
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      message: response.message,
      payload: null,
    };
  }

  return {
    status: "ready",
    message: response.message,
    payload: normalizeRepositoryState(response.data.repositoryState),
  };
}

export async function uploadInternalAiServerChatAttachment(file: File): Promise<InternalAiChatAttachmentUploadResult> {
  const baseUrl = getConfiguredBaseUrl();
  if (!baseUrl) {
    const objectUrl = URL.createObjectURL(file);
    return {
      status: "not_enabled",
      message:
        "Adapter server-side non configurato: l'allegato resta disponibile solo in memoria locale del browser.",
      attachment: createLocalAttachmentRecord({ file, objectUrl, textExcerpt: null }),
      repositoryState: null,
    };
  }

  const contentBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Lettura file non riuscita."));
    reader.readAsDataURL(file);
  });

  const kind = inferAttachmentKind(file.name, file.type || null);
  const textExcerpt =
    kind === "text"
      ? (await file.text().catch(() => "")).trim().slice(0, 1600) || null
      : null;

  const response = await postToServer<InternalAiServerAttachmentsRepositoryResponseData>(
    INTERNAL_AI_SERVER_ADAPTER_ROUTES.attachmentsRepository,
    {
      operation: "upload_thread_attachment",
      actorId: "next-ia-interna",
      requestId: buildRequestId("attachments-upload"),
      threadId: "main_chat",
      fileName: file.name,
      mimeType: file.type || null,
      sizeBytes: file.size,
      contentBase64,
      textExcerpt,
    } satisfies InternalAiServerAttachmentsRepositoryRequestBody,
  );

  if (!response || response.endpointId !== "attachments.repository" || !response.ok) {
    const objectUrl = URL.createObjectURL(file);
    return {
      status: "error",
      message:
        response?.message ??
        "Endpoint attachments.repository non disponibile: l'allegato resta disponibile solo in memoria locale del browser.",
      attachment: createLocalAttachmentRecord({ file, objectUrl, textExcerpt }),
      repositoryState: null,
    };
  }

  if (!response.data.attachment) {
    const objectUrl = URL.createObjectURL(file);
    return {
      status: "error",
      message:
        response.message ??
        "Upload IA-only completato senza un allegato materializzato; resta disponibile solo il fallback locale.",
      attachment: createLocalAttachmentRecord({ file, objectUrl, textExcerpt }),
      repositoryState: null,
    };
  }

  return {
    status: "ready",
    message: response.message,
    attachment: response.data.attachment,
    repositoryState: normalizeRepositoryState(response.data.repositoryState),
  };
}

export async function removeInternalAiServerChatAttachment(
  attachmentId: string,
): Promise<InternalAiChatAttachmentRemovalResult> {
  const baseUrl = getConfiguredBaseUrl();
  if (!baseUrl) {
    return {
      status: "not_enabled",
      message:
        "Adapter server-side non configurato: non e possibile rimuovere allegati persistiti dal browser corrente.",
      attachment: null,
      repositoryState: null,
    };
  }

  const response = await postToServer<InternalAiServerAttachmentsRepositoryResponseData>(
    INTERNAL_AI_SERVER_ADAPTER_ROUTES.attachmentsRepository,
    {
      operation: "remove_thread_attachment",
      actorId: "next-ia-interna",
      requestId: buildRequestId("attachments-remove"),
      threadId: "main_chat",
      attachmentId,
    } satisfies InternalAiServerAttachmentsRepositoryRequestBody,
  );

  if (!response || response.endpointId !== "attachments.repository") {
    return {
      status: "not_enabled",
      message:
        "Endpoint attachments.repository non raggiungibile sull'adapter server-side: rimozione non completata.",
      attachment: null,
      repositoryState: null,
    };
  }

  if (!response.ok) {
    return {
      status: response.status === "not_found" ? "not_found" : "error",
      message: response.message,
      attachment: null,
      repositoryState: null,
    };
  }

  return {
    status: "ready",
    message: response.message,
    attachment: response.data.attachment,
    repositoryState: normalizeRepositoryState(response.data.repositoryState),
  };
}
