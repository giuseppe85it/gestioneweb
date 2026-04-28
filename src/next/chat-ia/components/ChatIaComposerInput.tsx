import type { KeyboardEvent } from "react";

type ChatIaComposerInputProps = {
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  value: string;
};

export default function ChatIaComposerInput({
  disabled,
  onChange,
  onSubmit,
  value,
}: ChatIaComposerInputProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      className="chat-ia-composer"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <textarea
        aria-label="Messaggio Chat IA NEXT"
        className="chat-ia-composer-input"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Scrivi una targa, un autista o una domanda"
        rows={2}
        value={value}
      />
      <button className="chat-ia-send" disabled={disabled || !value.trim()} type="submit">
        Invia
      </button>
    </form>
  );
}
