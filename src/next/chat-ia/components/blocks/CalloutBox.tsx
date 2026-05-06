import type { ChatIaBlockCallout } from "../../core/chatIaTypes";

type CalloutBoxProps = {
  block: ChatIaBlockCallout;
};

export default function CalloutBox({ block }: CalloutBoxProps) {
  return (
    <section className={`chat-ia-viz-callout chat-ia-viz-callout--${block.tone}`}>
      <strong>{block.title}</strong>
      <p>{block.text}</p>
    </section>
  );
}
