import ChatIaMessageItem from "./ChatIaMessageItem";
import type { ChatIaMessage } from "../core/chatIaTypes";

type ChatIaMessageListProps = {
  messages: ChatIaMessage[];
  onOpenReport: (report: NonNullable<ChatIaMessage["report"]>, prompt: string) => void;
};

export default function ChatIaMessageList({ messages, onOpenReport }: ChatIaMessageListProps) {
  if (!messages.length) {
    return (
      <div className="chat-ia-empty">
        <p>Scrivi una targa, un autista o una domanda</p>
      </div>
    );
  }

  return (
    <div className="chat-ia-messages" aria-live="polite">
      {messages.map((message) => (
        <ChatIaMessageItem key={message.id} message={message} onOpenReport={onOpenReport} />
      ))}
    </div>
  );
}
