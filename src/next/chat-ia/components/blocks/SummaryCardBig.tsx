import type { ChatIaBlockSummaryCardBig } from "../../core/chatIaTypes";
import ChatIaEntityLink from "./ChatIaEntityLink";

type SummaryCardBigProps = {
  block: ChatIaBlockSummaryCardBig;
};

export default function SummaryCardBig({ block }: SummaryCardBigProps) {
  return (
    <section className={`chat-ia-viz-card chat-ia-viz-card--${block.tone ?? "info"} chat-ia-viz-summary-card-big`}>
      <div className="chat-ia-viz-icon" aria-hidden="true">{block.icon ?? "metric"}</div>
      <div>
        <h3>{block.title}</h3>
        <p className="chat-ia-viz-big-value">
          {block.value}
          {block.unit ? <span>{block.unit}</span> : null}
        </p>
        {block.subtitle ? <p className="chat-ia-viz-muted">{block.subtitle}</p> : null}
        {block.trendLabel ? <p className="chat-ia-viz-trend">{block.trendLabel}</p> : null}
        <ChatIaEntityLink action={block.action} />
      </div>
    </section>
  );
}
