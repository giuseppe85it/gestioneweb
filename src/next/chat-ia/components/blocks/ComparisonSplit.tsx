import type { ChatIaBlockComparisonSplit, ChatIaVisualizationMetric } from "../../core/chatIaTypes";
import ChatIaEntityLink from "./ChatIaEntityLink";

type ComparisonSplitProps = {
  block: ChatIaBlockComparisonSplit;
};

function MetricSide({ metric }: { metric: ChatIaVisualizationMetric }) {
  return (
    <div className="chat-ia-viz-comparison-side">
      <span>{metric.label}</span>
      <strong>
        {metric.value}
        {metric.unit ? <small>{metric.unit}</small> : null}
      </strong>
      {metric.subtitle ? <p>{metric.subtitle}</p> : null}
      {metric.metadata?.length ? (
        <div className="chat-ia-viz-meta-row">
          {metric.metadata.map((item) => (
            <span key={`${metric.label}-${item.label}`}>{item.label}: {item.value}</span>
          ))}
        </div>
      ) : null}
      <ChatIaEntityLink action={metric.action} />
    </div>
  );
}

export default function ComparisonSplit({ block }: ComparisonSplitProps) {
  return (
    <section className="chat-ia-viz-block chat-ia-viz-comparison-split">
      <h3>{block.comparisonLabel ? `Confronto: ${block.comparisonLabel}` : block.title}</h3>
      <div className="chat-ia-viz-comparison-grid">
        <MetricSide metric={block.left} />
        <MetricSide metric={block.right} />
      </div>
      {block.note ? <p className="chat-ia-viz-muted">{block.note}</p> : null}
    </section>
  );
}
