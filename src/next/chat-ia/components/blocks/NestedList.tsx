import type { ChatIaBlockNestedList } from "../../core/chatIaTypes";
import ChatIaEntityLink from "./ChatIaEntityLink";

type NestedListProps = {
  block: ChatIaBlockNestedList;
};

export default function NestedList({ block }: NestedListProps) {
  return (
    <section className="chat-ia-viz-block chat-ia-viz-nested-list">
      <h3>{block.title}</h3>
      <div className="chat-ia-viz-nested-groups">
        {block.groups.map((group) => (
          <article className="chat-ia-viz-nested-group" key={group.title}>
            <header>
              <strong>{group.title}</strong>
              {group.subtitle ? <span>{group.subtitle}</span> : null}
            </header>
            <div className="chat-ia-viz-nested-items">
              {group.items.length > 0 ? group.items.map((item) => (
                <div
                  className="chat-ia-viz-nested-item"
                  data-chat-ia-fingerprint={item._id}
                  key={`${group.title}-${item._id}`}
                >
                  <div>
                    <strong>{item.title}</strong>
                    {item.subtitle ? <span>{item.subtitle}</span> : null}
                  </div>
                  {item.description ? <p title={item.description}>{item.description}</p> : null}
                  {item.metadata?.length ? (
                    <div className="chat-ia-viz-meta-row">
                      {item.metadata.map((meta) => (
                        <span key={`${item.title}-${meta.label}`}>{meta.label}: {meta.value}</span>
                      ))}
                    </div>
                  ) : null}
                  <ChatIaEntityLink action={item.action} />
                </div>
              )) : <p className="chat-ia-viz-muted">Nessun elemento disponibile.</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
