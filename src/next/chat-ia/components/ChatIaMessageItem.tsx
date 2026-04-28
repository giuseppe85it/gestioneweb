import type { ChatIaMessage } from "../core/chatIaTypes";
import InternalAiMezzoCard from "../../internal-ai/InternalAiMezzoCard";
import ChatIaMezzoCard from "../sectors/mezzi/ChatIaMezzoCard";
import ChatIaMezzoDocumentsList from "../sectors/mezzi/ChatIaMezzoDocumentsList";
import ChatIaMezzoMaterialsTable from "../sectors/mezzi/ChatIaMezzoMaterialsTable";
import ChatIaMezzoTimeline from "../sectors/mezzi/ChatIaMezzoTimeline";
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
  const blocks = message.blocks ?? [];
  const chartBlocks = blocks.filter((block) => block.kind === "chart");
  const actionBlocks = blocks.filter((block) => block.kind === "ui_action");

  return (
    <>
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

export default function ChatIaMessageItem({ message, onOpenReport }: ChatIaMessageItemProps) {
  return (
    <article className={`chat-ia-message chat-ia-message--${message.role}`}>
      <div className="chat-ia-message-header">
        <span>{getRoleLabel(message.role)}</span>
        <time dateTime={message.createdAt}>
          {new Date(message.createdAt).toLocaleTimeString("it-IT", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>
      {message.text ? <p className="chat-ia-message-text">{message.text}</p> : null}
      {renderCard(message)}
      {renderTable(message)}
      {renderTimeline(message)}
      {renderToolUsePlaceholders(message)}
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
