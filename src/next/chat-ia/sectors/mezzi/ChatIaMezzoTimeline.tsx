import type { ChatIaMezzoTimelineEvent } from "./chatIaMezziTypes";

export default function ChatIaMezzoTimeline({ events }: { events: ChatIaMezzoTimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="chat-ia-mezzo-empty">Nessun evento trovato per questo mezzo.</p>;
  }

  return (
    <ol className="chat-ia-mezzo-timeline">
      {events.map((event) => (
        <li key={event.id} className={`chat-ia-mezzo-timeline__item is-${event.severity}`}>
          <div className="chat-ia-mezzo-timeline__date">{event.dateLabel ?? "data n.d."}</div>
          <div className="chat-ia-mezzo-timeline__body">
            <strong>{event.title}</strong>
            <span>{event.sourceLabel}</span>
            {event.detail ? <p>{event.detail}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
