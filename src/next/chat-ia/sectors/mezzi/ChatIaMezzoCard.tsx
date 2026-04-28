import InternalAiMezzoCard from "../../../internal-ai/InternalAiMezzoCard";
import { buildChatIaMezzoCardData } from "./chatIaMezziData";
import type { ChatIaMezzoSnapshot } from "./chatIaMezziTypes";

export default function ChatIaMezzoCard({ snapshot }: { snapshot: ChatIaMezzoSnapshot }) {
  const cardData = buildChatIaMezzoCardData(snapshot);

  return (
    <section className="chat-ia-mezzo-card">
      <InternalAiMezzoCard data={cardData} />
      <div className="chat-ia-mezzo-card__extra" aria-label="Dati settore Mezzi">
        <div>
          <strong>Documenti</strong>
          <span>{snapshot.documenti.counts.total}</span>
        </div>
        <div>
          <strong>Materiali</strong>
          <span>{snapshot.materiali.counts.total}</span>
        </div>
        <div>
          <strong>Segnalazioni</strong>
          <span>{snapshot.segnalazioniControlli.counts.segnalazioniTotali}</span>
        </div>
        <div>
          <strong>Controlli KO</strong>
          <span>{snapshot.segnalazioniControlli.counts.controlliKo}</span>
        </div>
      </div>
    </section>
  );
}
