import type { ChatIaAssistantFinalMessage } from "../core/chatIaTypes";
import type { ChatIaToolCall, ChatIaToolResult } from "../tools/chatIaToolTypes";

export type ChatIaAgentKind =
  | "orchestrator"
  | "flotta"
  | "operazioni"
  | "documenti"
  | "cisterna_rifornimenti"
  | "cantieri_magazzino"
  | "analytics"
  | "visualization";

export type ChatIaArguteQuestionId =
  | "D1"
  | "D2"
  | "D3"
  | "D4"
  | "D5"
  | "D6"
  | "D7"
  | "D8"
  | "D9";

export type ChatIaAgent = {
  kind: ChatIaAgentKind;
  name: string;
  systemPrompt: string;
  toolNames: string[];
  handles: string[];
  doesNotHandle: string[];
};

export type ChatIaAgentCall = {
  agentKind: ChatIaAgentKind;
  task: string;
  toolCalls: ChatIaToolCall[];
};

export type ChatIaAgentResult = {
  agentKind: ChatIaAgentKind;
  task: string;
  toolResults: ChatIaToolResult[];
  summary: string;
};

export type ChatIaOrchestratorPlan = {
  questionId: ChatIaArguteQuestionId;
  execution: "parallel" | "sequential";
  rationale: string;
  calls: ChatIaAgentCall[];
};

export type ChatIaAnalyticsMetric = {
  _id?: string | null;
  label: string;
  value: string | number;
  unit?: string | null;
  detail?: string | null;
  metadata?: Array<{ label: string; value: string | number }>;
  action?: { label: string; href: string | null; entityKind?: string | null; entityId?: string | null } | null;
};

export type ChatIaAnalyticsRank = {
  _id?: string | null;
  label: string;
  value: number;
  unit?: string | null;
  detail?: string | null;
  metadata?: Array<{ label: string; value: string | number }>;
  action?: { label: string; href: string | null; entityKind?: string | null; entityId?: string | null } | null;
};

export type ChatIaAnalyticsTable = {
  title: string;
  columns: Array<{ key: string; label: string; align?: "left" | "right" | "center" }>;
  rows: Array<Record<string, string | number | null>>;
  emptyText: string;
  rowActions?: Array<{ label: string; href: string | null; entityKind?: string | null; entityId?: string | null } | null>;
};

export type ChatIaAnalyticsTimelineItem = {
  _id?: string | null;
  date: string;
  title: string;
  description?: string | null;
  metadata?: Array<{ label: string; value: string | number }>;
  action?: { label: string; href: string | null; entityKind?: string | null; entityId?: string | null } | null;
};

export type ChatIaAnalyticsNestedList = {
  title: string;
  groups: Array<{
    title: string;
    subtitle?: string | null;
    items: Array<{
      _id?: string | null;
      title: string;
      subtitle?: string | null;
      description?: string | null;
      metadata?: Array<{ label: string; value: string | number }>;
      action?: { label: string; href: string | null; entityKind?: string | null; entityId?: string | null } | null;
    }>;
  }>;
};

export type ChatIaAnalyticsResult = {
  questionId: ChatIaArguteQuestionId;
  title: string;
  narrative: string;
  metrics: ChatIaAnalyticsMetric[];
  rankings: ChatIaAnalyticsRank[];
  comparison: ChatIaAnalyticsMetric[];
  trend: ChatIaAnalyticsRank[];
  tables: ChatIaAnalyticsTable[];
  timeline: ChatIaAnalyticsTimelineItem[];
  nestedLists: ChatIaAnalyticsNestedList[];
  callouts: Array<{ tone: "info" | "ok" | "warning" | "danger"; title: string; text: string }>;
  sources: Array<{ label: string; toolName?: string }>;
};

export type ChatIaMultiAgentRunResult = {
  plan: ChatIaOrchestratorPlan;
  agentResults: ChatIaAgentResult[];
  analytics: ChatIaAnalyticsResult;
  finalMessage: ChatIaAssistantFinalMessage;
};
