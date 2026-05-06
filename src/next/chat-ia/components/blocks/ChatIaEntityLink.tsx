import type { ChatIaActionLink } from "../../core/chatIaTypes";

type ChatIaEntityLinkProps = {
  action?: ChatIaActionLink | null;
};

function normalizePlate(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function fallbackHref(action: ChatIaActionLink): string | null {
  if (action.href) return action.href;
  const entityId = action.entityId?.trim();
  if (!entityId) return null;
  const kind = action.entityKind?.toLowerCase() ?? "";
  if (kind === "mezzo" || kind === "targa") return `/next/dossier/${encodeURIComponent(normalizePlate(entityId))}`;
  if (kind === "rifornimento") return `/next/dossiermezzi?refuelingId=${encodeURIComponent(entityId)}`;
  if (kind === "manutenzione") return `/next/manutenzioni?recordId=${encodeURIComponent(entityId)}`;
  if (kind === "lavoro") return `/next/lavori-da-eseguire?recordId=${encodeURIComponent(entityId)}`;
  if (kind === "documento" || kind === "fattura") return `/next/ia/documenti?docId=${encodeURIComponent(entityId)}`;
  if (kind === "cantiere") return `/next/attrezzature-cantieri?cantiere=${encodeURIComponent(entityId)}`;
  if (kind === "autista") return "/next/anagrafiche?tab=colleghi";
  return null;
}

export default function ChatIaEntityLink({ action }: ChatIaEntityLinkProps) {
  if (!action) return null;
  const href = fallbackHref(action);
  if (href) {
    return (
      <a
        aria-label={`${action.label} ${action.entityId ?? ""}`.trim()}
        className="chat-ia-viz-action-link"
        data-chat-ia-entity-id={action.entityId ?? undefined}
        href={href}
      >
        {action.label}
        <span aria-hidden="true">-&gt;</span>
      </a>
    );
  }

  return (
    <button
      className="chat-ia-viz-action-link chat-ia-viz-action-link--button"
      onClick={() => window.alert("Pagina dettaglio non ancora disponibile per questo elemento")}
      type="button"
    >
      {action.label}
      <span aria-hidden="true">-&gt;</span>
    </button>
  );
}
