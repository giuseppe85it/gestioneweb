import type { ChatIaBlockTimeline } from "../../core/chatIaTypes";
import ChatIaEntityLink from "./ChatIaEntityLink";

type TimelineProps = {
  block: ChatIaBlockTimeline;
};

export default function Timeline({ block }: TimelineProps) {
  return (
    <section className="chat-ia-viz-block chat-ia-viz-timeline">
      <h3>{block.title}</h3>
      <ol>
        {block.items.map((item, index) => (
          <li
            className={`chat-ia-viz-timeline-item chat-ia-viz-card--${item.tone ?? "info"}`}
            data-chat-ia-fingerprint={item._id}
            key={`${item._id}-${index}`}
          >
            <time>{item.date}</time>
            <strong>{item.title}</strong>
            {item.description ? <p>{item.description}</p> : null}
            {item.metadata?.length ? (
              <div className="chat-ia-viz-meta-row">
                {item.metadata.map((meta) => (
                  <span key={`${item.date}-${item.title}-${meta.label}`}>{meta.label}: {meta.value}</span>
                ))}
              </div>
            ) : null}
            <ChatIaEntityLink action={item.action} />
          </li>
        ))}
      </ol>
    </section>
  );
}
