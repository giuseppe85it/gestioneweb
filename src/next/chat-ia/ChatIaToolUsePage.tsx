import { useState } from "react";
import { runToolUseConversation } from "./backend/chatIaBackendBridge";
import ChatIaComposerInput from "./components/ChatIaComposerInput";
import ChatIaLoadingIndicator from "./components/ChatIaLoadingIndicator";
import ChatIaMessageList from "./components/ChatIaMessageList";
import ChatIaReportModal from "./components/ChatIaReportModal";
import type {
  ChatIaArchiveEntry,
  ChatIaAssistantFinalMessage,
  ChatIaEntityRef,
  ChatIaMessage,
  ChatIaOutputBlock,
  ChatIaReport,
} from "./core/chatIaTypes";
import { initToolRegistry } from "./tools";
import "./chatIa.css";

initToolRegistry();

function createMessageId(): string {
  return `chat-tool-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeEntities(finalMessage: ChatIaAssistantFinalMessage): ChatIaEntityRef[] {
  return finalMessage.entities.map((entity) => {
    if (entity.kind === "targa") return { kind: "targa", value: entity.value };
    if (entity.kind === "autista") return { kind: "autista", value: entity.value };
    if (entity.kind === "fornitore") return { kind: "fornitore", value: entity.value };
    if (entity.kind === "materiale") return { kind: "materiale", value: entity.value };
    if (entity.kind === "cisterna") return { kind: "cisterna", value: entity.value };
    return { kind: "unknown", value: entity.value };
  });
}

function firstBlock<TKind extends ChatIaOutputBlock["kind"]>(
  blocks: ChatIaOutputBlock[],
  kind: TKind,
): Extract<ChatIaOutputBlock, { kind: TKind }> | null {
  return (blocks.find((block) => block.kind === kind) as Extract<ChatIaOutputBlock, { kind: TKind }> | undefined) ?? null;
}

function createUserMessage(text: string): ChatIaMessage {
  return {
    id: createMessageId(),
    role: "utente",
    createdAt: new Date().toISOString(),
    text,
    status: "completed",
    sector: null,
    outputKind: "text",
    entities: [],
    card: null,
    table: null,
    report: null,
    archiveEntries: [],
    blocks: [],
    notices: [],
    error: null,
  };
}

function createAssistantMessage(finalMessage: ChatIaAssistantFinalMessage): ChatIaMessage {
  const cardBlock = firstBlock(finalMessage.blocks, "card");
  const tableBlock = firstBlock(finalMessage.blocks, "table");
  const reportBlock = firstBlock(finalMessage.blocks, "report");
  const archiveBlock = firstBlock(finalMessage.blocks, "archive_list");
  const chartBlock = firstBlock(finalMessage.blocks, "chart");
  const actionBlock = firstBlock(finalMessage.blocks, "ui_action");
  const outputKind = chartBlock
    ? "chart"
    : actionBlock
      ? "ui_action"
      : archiveBlock
        ? "archive_list"
        : reportBlock
          ? "report"
          : tableBlock
            ? "table"
            : cardBlock
              ? "card"
              : "text";

  return {
    id: createMessageId(),
    role: "assistente",
    createdAt: new Date().toISOString(),
    text: finalMessage.notices.length
      ? `${finalMessage.text}\n\n${finalMessage.notices.join("\n")}`
      : finalMessage.text,
    status: finalMessage.status,
    sector: null,
    outputKind,
    entities: normalizeEntities(finalMessage),
    card: cardBlock?.card ?? null,
    table: tableBlock?.table ?? null,
    report: reportBlock?.report ?? null,
    archiveEntries: archiveBlock?.entries ?? [],
    blocks: finalMessage.blocks,
    notices: finalMessage.notices,
    error: finalMessage.status === "failed" ? finalMessage.text : null,
  };
}

export default function ChatIaToolUsePage() {
  const [messages, setMessages] = useState<ChatIaMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [status, setStatus] = useState<"idle" | "reading">("idle");
  const [activeReport, setActiveReport] = useState<ChatIaReport | null>(null);
  const [activeReportPrompt, setActiveReportPrompt] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    const prompt = inputValue.trim();
    if (!prompt || status === "reading") {
      return;
    }

    const userMessage = createUserMessage(prompt);
    const previousMessages = [...messages, userMessage];
    setMessages(previousMessages);
    setInputValue("");
    setErrorMessage(null);
    setStatus("reading");

    try {
      const finalMessage = await runToolUseConversation(prompt, {
        previousMessages: messages,
        actorId: "next-chat-tool",
      });
      setMessages((current) => [...current, createAssistantMessage(finalMessage)]);
    } catch {
      setErrorMessage("La chat tool use non e riuscita a preparare la risposta.");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <main className="chat-ia-page">
      <section className="chat-ia-shell" aria-label="Chat IA NEXT tool use">
        <header className="chat-ia-header">
          <div>
            <p className="chat-ia-eyebrow">NEXT</p>
            <h1>Chat IA NEXT Tool Use</h1>
          </div>
        </header>

        <div className="chat-ia-thread">
          <ChatIaMessageList
            messages={messages}
            onOpenReport={(report, promptFromMessage) => {
              setActiveReport(report);
              setActiveReportPrompt(promptFromMessage);
            }}
          />
          {status === "reading" ? <ChatIaLoadingIndicator /> : null}
        </div>

        {errorMessage ? <p className="chat-ia-error">{errorMessage}</p> : null}

        <ChatIaComposerInput
          disabled={status === "reading"}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          value={inputValue}
        />
        {activeReport ? (
          <ChatIaReportModal
            onClose={() => setActiveReport(null)}
            onSaved={(entry: ChatIaArchiveEntry) => {
              setMessages((current) => [
                ...current,
                createUserMessage(`Report salvato nell'archivio chat: ${entry.title}`),
              ]);
            }}
            prompt={activeReportPrompt}
            report={activeReport}
          />
        ) : null}
      </section>
    </main>
  );
}
