// Client per l'endpoint IA "componi email" del backend interno (Archivista, porta 4310).
// Riceve appunti + tono (+ firma) e restituisce oggetto e corpo di una mail pronta,
// in italiano, tono formale o informale. Vive in utils/ perche' e' condiviso: lo usa
// il componente PdfPreviewModal (src/components), non solo i moduli NEXT.

const COMPOSE_EMAIL_ENDPOINT =
  "http://127.0.0.1:4310/internal-ai-backend/documents/compose-email";

export type EmailComposeTono = "formale" | "informale";

export type EmailComposeResult = {
  schemaVersion: "email_compose_v1";
  tono: EmailComposeTono;
  oggetto: string;
  corpo: string;
};

export type EmailComposeIaClientErrorCode =
  | "validation_error"
  | "provider_not_configured"
  | "upstream_error"
  | "network_error"
  | "unexpected_response";

export class EmailComposeIaClientError extends Error {
  readonly code: EmailComposeIaClientErrorCode;
  readonly httpStatus: number | null;

  constructor(
    code: EmailComposeIaClientErrorCode,
    message: string,
    httpStatus: number | null = null,
  ) {
    super(message);
    this.name = "EmailComposeIaClientError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

type EmailComposeEnvelope = {
  ok?: boolean;
  status?: string;
  message?: string;
  data?: {
    result?: EmailComposeResult;
    providerTarget?: unknown;
    traceEntryId?: string;
  };
};

function readErrorMessage(code: EmailComposeIaClientErrorCode): string {
  if (code === "validation_error") {
    return "Scrivi prima il contesto del messaggio, poi riprova.";
  }
  if (code === "provider_not_configured") {
    return "Servizio IA non configurato. Contatta l'amministratore.";
  }
  if (code === "upstream_error") {
    return "Scrittura IA non riuscita. Riprova.";
  }
  if (code === "network_error") {
    return "Assistente IA non raggiungibile: assicurati che l'Archivista sia avviato, oppure scrivi il testo a mano.";
  }
  return "Risposta IA non valida. Riprova.";
}

async function parseEnvelope(response: Response): Promise<EmailComposeEnvelope> {
  try {
    return (await response.json()) as EmailComposeEnvelope;
  } catch {
    return {};
  }
}

export async function composeEmailText(input: {
  contesto: string;
  tono: EmailComposeTono;
  istruzione?: string | null;
  firma?: string | null;
}): Promise<EmailComposeResult> {
  let response: Response;
  try {
    response = await fetch(COMPOSE_EMAIL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contesto: input.contesto,
        tono: input.tono,
        istruzione: input.istruzione ?? "",
        firma: input.firma ?? "",
      }),
    });
  } catch {
    throw new EmailComposeIaClientError("network_error", readErrorMessage("network_error"));
  }

  const envelope = await parseEnvelope(response);
  if (!response.ok || envelope.ok === false) {
    const normalizedStatus =
      envelope.status === "validation_error" ||
      envelope.status === "provider_not_configured" ||
      envelope.status === "upstream_error"
        ? (envelope.status as EmailComposeIaClientErrorCode)
        : "unexpected_response";

    throw new EmailComposeIaClientError(
      normalizedStatus,
      readErrorMessage(normalizedStatus),
      response.status,
    );
  }

  const result = envelope.data?.result;
  if (!result || result.schemaVersion !== "email_compose_v1") {
    throw new EmailComposeIaClientError(
      "unexpected_response",
      readErrorMessage("unexpected_response"),
      response.status,
    );
  }

  return result;
}

export { COMPOSE_EMAIL_ENDPOINT };
