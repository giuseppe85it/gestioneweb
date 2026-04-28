import type { ChatIaArchiveEntry } from "../core/chatIaTypes";

type ChatIaArchivePanelProps = {
  entries: ChatIaArchiveEntry[];
  onOpenReport: (entry: ChatIaArchiveEntry) => void;
};

export default function ChatIaArchivePanel({ entries, onOpenReport }: ChatIaArchivePanelProps) {
  return (
    <section className="chat-ia-archive-panel" aria-label="Archivio report chat">
      <header className="chat-ia-archive-header">
        <h2>Archivio report</h2>
        <span>{entries.length} risultati</span>
      </header>
      {entries.length ? (
        <div className="chat-ia-archive-list">
          {entries.map((entry) => (
            <article className="chat-ia-archive-item" key={entry.id}>
              <div>
                <h3>{entry.title}</h3>
                <p>{entry.summary}</p>
                <small>
                  {entry.targetKind}: {entry.targetValue} - {entry.periodLabel ?? "periodo non indicato"}
                </small>
              </div>
              <button className="chat-ia-secondary-button" onClick={() => onOpenReport(entry)} type="button">
                Riapri
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p className="chat-ia-archive-empty">Archivio report vuoto per la richiesta indicata.</p>
      )}
    </section>
  );
}
