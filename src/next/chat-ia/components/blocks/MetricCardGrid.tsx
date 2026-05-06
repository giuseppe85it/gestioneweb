import type { ChatIaBlockMetricCardGrid } from "../../core/chatIaTypes";
import ChatIaEntityLink from "./ChatIaEntityLink";

type MetricCardGridProps = {
  block: ChatIaBlockMetricCardGrid;
};

export default function MetricCardGrid({ block }: MetricCardGridProps) {
  return (
    <section className="chat-ia-viz-block chat-ia-viz-metric-card-grid">
      <h3>{block.title}</h3>
      <div className="chat-ia-viz-metric-grid">
        {block.metrics.map((metric) => (
          <article className={`chat-ia-viz-metric chat-ia-viz-card--${metric.tone ?? "info"}`} key={metric.label}>
            <span className="chat-ia-viz-metric-label">{metric.label}</span>
            <strong>
              {metric.value}
              {metric.unit ? <small>{metric.unit}</small> : null}
            </strong>
            {metric.subtitle ? <span className="chat-ia-viz-muted">{metric.subtitle}</span> : null}
            {metric.metadata?.length ? (
              <div className="chat-ia-viz-meta-row">
                {metric.metadata.map((item) => (
                  <span key={`${metric.label}-${item.label}`}>{item.label}: {item.value}</span>
                ))}
              </div>
            ) : null}
            <ChatIaEntityLink action={metric.action} />
          </article>
        ))}
      </div>
    </section>
  );
}
