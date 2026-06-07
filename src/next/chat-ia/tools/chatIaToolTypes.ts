import type {
  ChatIaArchiveEntry,
  ChatIaOutputBlock as CoreChatIaOutputBlock,
  ChatIaReport,
  ChatIaStructuredCard,
  ChatIaTable,
} from "../core/chatIaTypes";

export type ChatIaJsonSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties: false;
};

export type ChatIaToolOutputKind =
  | "text"
  | "card"
  | "table"
  | "chart"
  | "report"
  | "archive_list"
  | "ui_action";

export type ChatIaToolItem = {
  /**
   * Fingerprint obbligatorio per record provenienti dai tool.
   * Deve essere il document id Firestore reale o un id composto stabile.
   */
  _id: string;
  [key: string]: unknown;
};

export type ChatIaToolDefinition = {
  name: string;
  description: string;
  parameters: ChatIaJsonSchema;
  outputKindHint?: ChatIaToolOutputKind;
};

export type ChatIaToolExecutionContext = {
  requestId: string;
  sessionId: string;
  prompt: string;
  nowIso: string;
};

export type ChatIaToolHandler<TInput = unknown, TOutput = unknown> = {
  name: string;
  descriptionForOpenAi: string;
  parameters: ChatIaJsonSchema;
  outputKindHint: ChatIaToolOutputKind;
  timeoutMs?: number;
  run(input: TInput, context: ChatIaToolExecutionContext): Promise<TOutput>;
};

export type ChatIaToolRequest = {
  requestId: string;
  sessionId: string;
  prompt: string;
  arguments: Record<string, unknown>;
};

export type ChatIaToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type ChatIaToolResult = {
  toolCallId: string;
  name: string;
  ok: boolean;
  data?: unknown;
  error?: {
    code: "validation_error" | "not_found" | "timeout" | "tool_error";
    message: string;
  };
  outputKind?: ChatIaToolOutputKind;
};

export type ChatIaToolUseRequest = {
  operation: "run_tool_use_turn";
  requestId: string;
  actorId?: string;
  sessionId: string;
  iteration: number;
  prompt: string;
  messages: Array<{
    role: "user" | "assistant" | "tool";
    content: string;
    toolCallId?: string;
    name?: string;
  }>;
  tools: ChatIaToolDefinition[];
  toolResults?: ChatIaToolResult[];
  responseId?: string | null;
};

export type ChatIaOpenAiUsage = {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
};

export type ChatIaCostEstimate = {
  currency: "USD";
  inputUsd: number | null;
  outputUsd: number | null;
  totalUsd: number | null;
  pricingVersion: string;
};

export type ChatIaBlockText = { kind: "text"; text: string };

export type ChatIaBlockCard = { kind: "card"; card: ChatIaStructuredCard };

export type ChatIaBlockTable = { kind: "table"; table: ChatIaTable };

export type ChatIaBlockChart = {
  kind: "chart";
  chart: {
    type: "bar" | "line" | "pie";
    title: string;
    data: Array<Record<string, string | number | null>>;
    xKey?: string;
    yKey?: string;
  };
};

export type ChatIaBlockReport = { kind: "report"; report: ChatIaReport };

export type ChatIaBlockArchive = {
  kind: "archive_list";
  entries: ChatIaArchiveEntry[];
};

export type ChatIaBlockUiAction = {
  kind: "ui_action";
  action: {
    label: string;
    route?: string;
    modal?: string;
    params?: Record<string, string>;
  };
};

export type ChatIaOutputBlock = CoreChatIaOutputBlock;

export type ChatIaAssistantFinalMessage = {
  text: string;
  status: "completed" | "partial" | "failed";
  blocks: ChatIaOutputBlock[];
  entities: Array<{ kind: string; value: string }>;
  sources: Array<{ label: string; toolName?: string; path?: string }>;
  notices: string[];
};

export type ChatIaToolUseResponse =
  | {
      mode: "tool_calls";
      responseId: string | null;
      model: string;
      toolCalls: ChatIaToolCall[];
      usage: ChatIaOpenAiUsage | null;
      costEstimate: ChatIaCostEstimate | null;
    }
  | {
      mode: "final";
      responseId: string | null;
      model: string;
      finalMessage: ChatIaAssistantFinalMessage;
      usage: ChatIaOpenAiUsage | null;
      costEstimate: ChatIaCostEstimate | null;
    };
