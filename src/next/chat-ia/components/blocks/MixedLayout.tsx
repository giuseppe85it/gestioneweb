import type { ChatIaBlockMixedLayout } from "../../core/chatIaTypes";

type MixedLayoutProps = {
  block: ChatIaBlockMixedLayout;
};

export default function MixedLayout({ block }: MixedLayoutProps) {
  return (
    <section className="chat-ia-viz-block chat-ia-viz-mixed-layout">
      <h3>{block.title}</h3>
      <div className="chat-ia-viz-mixed-grid">
        {block.sections.map((section) => (
          <article className={`chat-ia-viz-mixed-section chat-ia-viz-card--${section.tone ?? "neutral"}`} key={section.title}>
            <strong>{section.title}</strong>
            <p>{section.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
