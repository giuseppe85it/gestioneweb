import type { ChatIaBlockRankingTable } from "../../core/chatIaTypes";
import ChatIaEntityLink from "./ChatIaEntityLink";

type RankingTableProps = {
  block: ChatIaBlockRankingTable;
};

export default function RankingTable({ block }: RankingTableProps) {
  return (
    <section className="chat-ia-viz-block chat-ia-viz-ranking-table">
      <h3>{block.title}</h3>
      <div className="chat-ia-viz-ranking-list">
        {block.rows.map((row) => (
          <div
            className={`chat-ia-viz-ranking-row chat-ia-viz-card--${row.tone ?? "neutral"}`}
            data-chat-ia-fingerprint={row._id}
            key={`${row.rank}-${row._id}`}
          >
            <span className="chat-ia-viz-rank">{row.rank}</span>
            <div className="chat-ia-viz-ranking-main">
              <div className="chat-ia-viz-ranking-heading">
                <strong>{row.label}</strong>
                <span>
                  {row.value}
                  {row.unit ? ` ${row.unit}` : ""}
                </span>
              </div>
              <div className="chat-ia-viz-bar" aria-hidden="true">
                <span style={{ width: `${Math.max(4, Math.min(100, row.barValue ?? 0))}%` }} />
              </div>
              {row.detail ? <small>{row.detail}</small> : null}
              {row.metadata?.length ? (
                <div className="chat-ia-viz-meta-row">
                  {row.metadata.map((item) => (
                    <span key={`${row.rank}-${item.label}`}>{item.label}: {item.value}</span>
                  ))}
                </div>
              ) : null}
              <ChatIaEntityLink action={row.action} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
