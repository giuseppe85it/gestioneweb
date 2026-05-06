import { useState } from "react";
import { runToolUseConversation } from "./backend/chatIaBackendBridge";
import ChatIaComposerInput from "./components/ChatIaComposerInput";
import ChatIaLoadingIndicator from "./components/ChatIaLoadingIndicator";
import ChatIaMessageList from "./components/ChatIaMessageList";
import ChatIaReportModal from "./components/ChatIaReportModal";
import type {
  ChatIaArchiveEntry,
  ChatIaMessage,
  ChatIaReport,
  ChatZeroInvenzioniMessage,
} from "./core/chatIaTypes";
import { initToolRegistry } from "./tools";
import "./chatIa.css";

initToolRegistry();

function createMessageId(): string {
  return `chat-tool-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

function createAssistantMessage(finalMessage: ChatZeroInvenzioniMessage): ChatIaMessage {
  return {
    id: createMessageId(),
    role: "assistente",
    createdAt: new Date().toISOString(),
    text: "",
    status: finalMessage.action === "error" ? "failed" : "completed",
    sector: null,
    outputKind: "text",
    entities: [],
    card: null,
    table: null,
    report: null,
    archiveEntries: [],
    blocks: [],
    notices: [],
    zeroMessage: finalMessage,
    error: null,
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
      setErrorMessage("La chat IA non e riuscita a preparare la risposta.");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <main className="chat-ia-page">
      <section className="chat-ia-shell" aria-label="Chat IA NEXT">
        <header className="chat-ia-header">
          <div>
            <p className="chat-ia-eyebrow">NEXT</p>
            <h1>Chat IA NEXT</h1>
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
