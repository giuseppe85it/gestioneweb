import { useState } from "react";
import ChatIaArchivePanel from "./ChatIaArchivePanel";
import ChatIaComposerInput from "./ChatIaComposerInput";
import ChatIaLoadingIndicator from "./ChatIaLoadingIndicator";
import ChatIaMessageList from "./ChatIaMessageList";
import ChatIaReportModal from "./ChatIaReportModal";
import { refineChatIaRunnerResult } from "../backend/chatIaBackendBridge";
import { buildNotHandledRunnerResult, getRunner } from "../core/chatIaSectorRegistry";
import { routeChatIaPrompt } from "../core/chatIaRouter";
import type { ChatIaArchiveEntry, ChatIaMessage, ChatIaReport, ChatIaRunnerResult } from "../core/chatIaTypes";
import { listChatIaReportArchiveEntries } from "../reports/chatIaReportArchive";

function createChatIaMessage(args: {
  role: ChatIaMessage["role"];
  text: string;
  status: ChatIaMessage["status"];
  result?: ChatIaRunnerResult | null;
  archiveEntries?: ChatIaArchiveEntry[];
}): ChatIaMessage {
  return {
    id: `chat-ia-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role: args.role,
    createdAt: new Date().toISOString(),
    text: args.text,
    status: args.status,
    sector: args.result?.sector ?? null,
    outputKind: args.result?.outputKind ?? "text",
    entities: args.result?.entities ?? [],
    card: args.result?.card ?? null,
    table: args.result?.table ?? null,
    report: args.result?.report ?? null,
    archiveEntries: args.archiveEntries ?? [],
    error: args.result?.error ?? null,
  };
}

function isDummyReportPrompt(prompt: string): boolean {
  const normalized = prompt.trim().toLowerCase();
  return normalized === "report dummy" || normalized === "test report ossatura";
}

function buildDummyReport(prompt: string, result: ChatIaRunnerResult): ChatIaReport {
  const nowIso = new Date().toISOString();
  const targa = result.entities.find((entity) => entity.kind === "targa")?.value ?? "OSSATURA";
  return {
    id: `chat-ia-dummy-${Date.now()}`,
    sector: result.sector,
    type: "puntuale",
    target: { kind: "targa", value: targa },
    title: "Report dummy ossatura Chat IA NEXT",
    summary: `Validazione tecnica generata dal prompt: ${prompt}`,
    generatedAt: nowIso,
    period: null,
    preview: null,
    sections: [
      {
        id: "ossatura",
        title: "Ossatura",
        summary: "La modale report, il PDF e il salvataggio archivio sono collegati.",
        bullets: [
          "La conversazione resta solo nella sessione corrente.",
          "Il report viene salvato solo dopo conferma utente.",
          "Il PDF usa l'adapter della nuova chat.",
        ],
        status: "complete",
      },
    ],
    sources: [{ label: "Spec ossatura Chat IA NEXT", path: "docs/product/SPEC_OSSATURA_CHAT_IA_NEXT.md" }],
    missingData: [],
  };
}

function getArchiveFilters(result: ChatIaRunnerResult) {
  const targa = result.entities.find((entity) => entity.kind === "targa");
  const autista = result.entities.find((entity) => entity.kind === "autista");
  if (targa) return { targetKind: "targa" as const, targetValue: targa.value, sector: result.sector };
  if (autista) return { targetKind: "autista" as const, targetValue: autista.value, sector: result.sector };
  return { sector: result.sector };
}

export default function ChatIaShell() {
  const [messages, setMessages] = useState<ChatIaMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [status, setStatus] = useState<"idle" | "reading">("idle");
  const [activeReport, setActiveReport] = useState<ChatIaReport | null>(null);
  const [activeReportPrompt, setActiveReportPrompt] = useState("");
  const [archiveEntries, setArchiveEntries] = useState<ChatIaArchiveEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    const prompt = inputValue.trim();
    if (!prompt || status === "reading") {
      return;
    }

    const userMessage = createChatIaMessage({
      role: "utente",
      text: prompt,
      status: "completed",
    });

    setMessages((current) => [...current, userMessage]);
    setInputValue("");
    setErrorMessage(null);
    setStatus("reading");

    try {
      const decision = routeChatIaPrompt({
        prompt,
        previousMessages: messages,
        now: new Date(),
      });
      const context = {
        nowIso: new Date().toISOString(),
        previousMessages: messages,
        period: decision.period,
        backend: {
          enabled: true,
          timeoutMs: 8000,
        },
      };
      const runner = decision.sector ? getRunner(decision.sector) : null;
      const result = runner?.canHandle(decision)
        ? await runner.run({ prompt, decision, context })
        : buildNotHandledRunnerResult({ prompt, decision, context });

      if (decision.asksArchive) {
        const entries = await listChatIaReportArchiveEntries(getArchiveFilters(result));
        setArchiveEntries(entries);
        const assistantMessage = createChatIaMessage({
          role: "assistente",
          text: entries.length
            ? `Ho trovato ${entries.length} report nell'archivio chat.`
            : "Archivio report vuoto per la richiesta indicata.",
          status: "completed",
          result: { ...result, outputKind: "archive_list" },
          archiveEntries: entries,
        });
        setMessages((current) => [...current, assistantMessage]);
        return;
      }

      if (isDummyReportPrompt(prompt)) {
        const report = buildDummyReport(prompt, result);
        setActiveReport(report);
        setActiveReportPrompt(prompt);
        setArchiveEntries([]);
        const assistantMessage = createChatIaMessage({
          role: "assistente",
          text: "Report dummy generato. Apri la modale per esportare PDF o salvare in archivio.",
          status: "completed",
          result: { ...result, outputKind: "report_modal", report, text: "Report dummy generato." },
        });
        setMessages((current) => [...current, assistantMessage]);
        return;
      }

      const backendResult = await refineChatIaRunnerResult({
        prompt,
        result,
        timeoutMs: context.backend.timeoutMs,
      });
      const assistantText = backendResult.notice
        ? `${backendResult.text}\n\n${backendResult.notice}`
        : backendResult.text;
      const assistantMessage = createChatIaMessage({
        role: "assistente",
        text: assistantText,
        status: result.status === "failed" ? "failed" : result.status === "partial" ? "partial" : "completed",
        result,
      });
      setMessages((current) => [...current, assistantMessage]);
    } catch {
      setErrorMessage("La chat non e riuscita a preparare la risposta.");
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
          {archiveEntries.length || messages.some((message) => message.outputKind === "archive_list") ? (
            <ChatIaArchivePanel
              entries={archiveEntries}
              onOpenReport={(entry) => {
                setActiveReport(entry.reportPayload);
                setActiveReportPrompt(entry.prompt);
              }}
            />
          ) : null}
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
            onSaved={(entry) => {
              setArchiveEntries((current) => [entry, ...current]);
              setMessages((current) => [
                ...current,
                createChatIaMessage({
                  role: "assistente",
                  text: "Report salvato nell'archivio chat",
                  status: "completed",
                  archiveEntries: [entry],
                }),
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
