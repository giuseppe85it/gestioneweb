import { useMemo, useState } from "react";
import type { ChatIaMessage } from "../core/chatIaTypes";
import InternalAiMezzoCard from "../../internal-ai/InternalAiMezzoCard";
import ChatIaMezzoCard from "../sectors/mezzi/ChatIaMezzoCard";
import ChatIaMezzoDocumentsList from "../sectors/mezzi/ChatIaMezzoDocumentsList";
import ChatIaMezzoMaterialsTable from "../sectors/mezzi/ChatIaMezzoMaterialsTable";
import ChatIaMezzoTimeline from "../sectors/mezzi/ChatIaMezzoTimeline";
import ChatIaVisualizationBlocks from "./blocks/ChatIaVisualizationBlocks";
import Driver360 from "../views/Driver360";
import CertifiedView from "../views/CertifiedView";
import Vehicle360 from "../views/Vehicle360";
import "../views/certifiedView.css";
import type { NextMezzoDocumentiSnapshot } from "../../domain/nextDocumentiMezzoDomain";
import type { NextMezzoMaterialiMovimentiSnapshot } from "../../domain/nextMaterialiMovimentiDomain";
import type { ChatIaMezzoSnapshot, ChatIaMezzoTimelineEvent } from "../sectors/mezzi/chatIaMezziTypes";

type ChatIaMessageItemProps = {
  message: ChatIaMessage;
  onOpenReport: (report: NonNullable<ChatIaMessage["report"]>, prompt: string) => void;
};

function getRoleLabel(role: ChatIaMessage["role"]): string {
  if (role === "utente") return "Tu";
  if (role === "sistema") return "Sistema";
  return "Assistente";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function renderCard(message: ChatIaMessage) {
  if (!message.card) return null;
  const maybeSnapshot = (message.card as Record<string, unknown>).snapshot;
  if (isRecord(maybeSnapshot)) {
    return <ChatIaMezzoCard snapshot={maybeSnapshot as ChatIaMezzoSnapshot} />;
  }
  if (message.card.kind === "mezzo_dossier") {
    return <InternalAiMezzoCard data={message.card.data} />;
  }
  if (message.card.kind === "summary_card") {
    return (
      <section className="chat-ia-message-card">
        <h3>{message.card.title}</h3>
        {message.card.rows.map((row) => (
          <p key={row.label}>
            <strong>{row.label}</strong>: {row.value}
          </p>
        ))}
      </section>
    );
  }

  return null;
}

function renderTable(message: ChatIaMessage) {
  if (!message.table) return null;

  const maybeSnapshot = message.table as typeof message.table & {
    kind?: string;
    snapshot?: unknown;
  };
  if (maybeSnapshot.kind === "mezzo_materiali" && isRecord(maybeSnapshot.snapshot)) {
    return <ChatIaMezzoMaterialsTable snapshot={maybeSnapshot.snapshot as NextMezzoMaterialiMovimentiSnapshot} />;
  }
  if (maybeSnapshot.kind === "mezzo_documenti" && isRecord(maybeSnapshot.snapshot)) {
    return <ChatIaMezzoDocumentsList snapshot={maybeSnapshot.snapshot as NextMezzoDocumentiSnapshot} />;
  }

  return (
    <section className="chat-ia-message-table">
      <h3>{message.table.title}</h3>
      <table>
        <thead>
          <tr>
            {message.table.columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {message.table.rows.length > 0 ? (
            message.table.rows.map((row, rowIndex) => (
              <tr key={`${message.table?.id ?? "table"}-${rowIndex}`}>
                {message.table?.columns.map((column) => (
                  <td key={column.key}>{row[column.key] ?? "n.d."}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={message.table.columns.length}>{message.table.emptyText}</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

function renderTimeline(message: ChatIaMessage) {
  const maybeMessage = message as ChatIaMessage & {
    timeline?: { events?: ChatIaMezzoTimelineEvent[] } | null;
  };
  return maybeMessage.timeline?.events ? <ChatIaMezzoTimeline events={maybeMessage.timeline.events} /> : null;
}

function renderToolUsePlaceholders(message: ChatIaMessage) {
  if (message.zeroMessage) return null;

  const blocks = message.blocks ?? [];
  const chartBlocks = blocks.filter((block) => block.kind === "chart");
  const actionBlocks = blocks.filter((block) => block.kind === "ui_action");

  return (
    <>
      <ChatIaVisualizationBlocks blocks={blocks} />
      {chartBlocks.map((block, index) => (
        <section className="chat-ia-message-card" key={`chart-${block.chart.title}-${index}`}>
          <h3>{block.chart.title}</h3>
          <p>Grafico disponibile nella risposta tool use. Rendering dedicato in arrivo.</p>
        </section>
      ))}
      {actionBlocks.map((block, index) => (
        <section className="chat-ia-message-card" key={`action-${block.action.label}-${index}`}>
          <h3>{block.action.label}</h3>
          <p>Azione UI disponibile nella risposta tool use. Attivazione controllata in arrivo.</p>
        </section>
      ))}
    </>
  );
}

function blockToCopyText(block: NonNullable<ChatIaMessage["blocks"]>[number]): string {
  if (block.kind === "text") return block.text;
  if (block.kind === "summary_card_big") return `${block.title}: ${block.value}${block.unit ? ` ${block.unit}` : ""}${block.subtitle ? ` - ${block.subtitle}` : ""}`;
  if (block.kind === "metric_card_grid") return [block.title, ...block.metrics.map((metric) => `${metric.label}: ${metric.value}${metric.unit ? ` ${metric.unit}` : ""}`)].join("\n");
  if (block.kind === "ranking_table") return [block.title, ...block.rows.map((row) => `${row.rank}. ${row.label}: ${row.value}${row.unit ? ` ${row.unit}` : ""}${row.detail ? ` - ${row.detail}` : ""}`)].join("\n");
  if (block.kind === "timeline") return [block.title, ...block.items.map((item) => `${item.date} - ${item.title}${item.description ? `: ${item.description}` : ""}`)].join("\n");
  if (block.kind === "data_table_styled") {
    const header = block.table.columns.map((column) => column.label).join(" | ");
    const rows = block.table.rows.map((row) => block.table.columns.map((column) => row[column.key] ?? "n.d.").join(" | "));
    return [block.table.title, header, ...rows].join("\n");
  }
  if (block.kind === "callout") return `${block.title}: ${block.text}`;
  if (block.kind === "comparison_split") return `${block.title}: ${block.left.label} ${block.left.value}${block.left.unit ? ` ${block.left.unit}` : ""} / ${block.right.label} ${block.right.value}${block.right.unit ? ` ${block.right.unit}` : ""}`;
  if (block.kind === "bar_chart_compare" || block.kind === "trend_chart_line" || block.kind === "pie_chart") return `${block.title}: ${block.data.map((point) => `${point.label} ${point.value}`).join(", ")}`;
  if (block.kind === "mixed_layout") return [block.title, ...block.sections.map((section) => `${section.title}: ${section.text}`)].join("\n");
  if (block.kind === "nested_list") return [block.title, ...block.groups.flatMap((group) => [group.title, ...group.items.map((item) => `${item.title}${item.description ? `: ${item.description}` : ""}`)])].join("\n");
  return "";
}

function getAccompanimentText(message: ChatIaMessage): string {
  const kind = message.zeroMessage?.accompaniment.kind;
  if (!kind) return "";

  const count = message.zeroMessage?.accompaniment.params?.count;
  if (kind === "no_results") return "Nessun risultato disponibile nel catalogo corrente.";
  if (kind === "disambiguation_required") return "Servono ulteriori dettagli per scegliere il risultato corretto.";
  if (kind === "clarify_too_many_results") return "Ho trovato troppi risultati. Specifica meglio la richiesta.";
  if (kind === "clarify_period_required") return "Per questa vista serve un periodo. Sceglilo dal calendario.";
  if (kind === "error_view_unavailable") return "Vista richiesta non ancora disponibile.";
  if (kind === "error_intent_not_in_catalog") return "Richiesta non disponibile nel catalogo attuale.";
  if (kind === "view_opened" && message.zeroMessage?.view === "Driver360") return "Profilo autista aperto.";
  if (kind === "view_opened") return "Vista richiesta non ancora disponibile.";
  return count ? `Richiesta instradata: ${count} risultati da chiarire.` : "Richiesta instradata.";
}

function renderCertifiedView(message: ChatIaMessage) {
  const zeroMessage = message.zeroMessage;
  if (!zeroMessage) return null;

  if (
    zeroMessage.view === "Driver360" &&
    (zeroMessage.action === "view_open" || zeroMessage.action === "disambiguation_request")
  ) {
    return <Driver360 message={zeroMessage} />;
  }

  if (zeroMessage.action === "view_open" && zeroMessage.view) {
    if (zeroMessage.view === "Vehicle360") {
      return <Vehicle360 message={zeroMessage} />;
    }
    return <CertifiedView message={zeroMessage} viewKind={zeroMessage.view} />;
  }

  return null;
}

function renderZeroInvenzioniMessage(message: ChatIaMessage) {
  if (!message.zeroMessage) return null;

  return (
    <section
      className="chat-ia-message-zero"
      data-chat-zero-action={message.zeroMessage.action}
      data-chat-zero-view={message.zeroMessage.view ?? "none"}
    >
      <p className="chat-ia-accompaniment">{getAccompanimentText(message)}</p>
      {renderCertifiedView(message)}
    </section>
  );
}

function isUncertifiedAssistantMessage(message: ChatIaMessage): boolean {
  return message.role === "assistente" && !message.zeroMessage;
}

function renderUncertifiedAssistantFallback(message: ChatIaMessage) {
  if (!isUncertifiedAssistantMessage(message)) return null;
  return (
    <section className="chat-ia-message-card" data-chat-zero-uncertified-fallback>
      <h3>Risposta non certificata</h3>
      <p>La richiesta non e' disponibile nel catalogo certificato attuale.</p>
    </section>
  );
}

function buildCopyText(message: ChatIaMessage): string {
  if (message.zeroMessage) {
    return getAccompanimentText(message);
  }

  if (isUncertifiedAssistantMessage(message)) {
    return "";
  }

  return [
    message.role === "assistente" ? "" : message.text,
    ...(message.blocks ?? []).map(blockToCopyText),
  ].filter(Boolean).join("\n\n");
}

export default function ChatIaMessageItem({ message, onOpenReport }: ChatIaMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const copyText = useMemo(() => buildCopyText(message), [message]);

  async function handleCopy() {
    if (!copyText.trim()) return;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(copyText);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = copyText;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <article className={`chat-ia-message chat-ia-message--${message.role}`}>
      <div className="chat-ia-message-header">
        <span>{getRoleLabel(message.role)}</span>
        <div className="chat-ia-message-header-actions">
          <time dateTime={message.createdAt}>
            {new Date(message.createdAt).toLocaleTimeString("it-IT", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
          {message.role === "assistente" ? (
            <button
              className="chat-ia-copy-button"
              disabled={!copyText.trim()}
              onClick={handleCopy}
              type="button"
            >
              {copied ? "Copiato" : "Copia"}
            </button>
          ) : null}
        </div>
      </div>
      {message.role !== "assistente" && message.text ? (
        <p className="chat-ia-user-text">{message.text}</p>
      ) : null}
      {renderZeroInvenzioniMessage(message)}
      {renderUncertifiedAssistantFallback(message)}
      {!message.zeroMessage && !isUncertifiedAssistantMessage(message) ? renderCard(message) : null}
      {!message.zeroMessage && !isUncertifiedAssistantMessage(message) ? renderTable(message) : null}
      {!message.zeroMessage && !isUncertifiedAssistantMessage(message) ? renderTimeline(message) : null}
      {!isUncertifiedAssistantMessage(message) ? renderToolUsePlaceholders(message) : null}
      {message.report ? (
        <button
          className="chat-ia-secondary-button"
          onClick={() => onOpenReport(message.report as NonNullable<ChatIaMessage["report"]>, message.text)}
          type="button"
        >
          Apri report
        </button>
      ) : null}
      {message.outputKind === "archive_list" ? (
        <p className="chat-ia-message-meta">{message.archiveEntries.length} report in archivio</p>
      ) : null}
    </article>
  );
}
