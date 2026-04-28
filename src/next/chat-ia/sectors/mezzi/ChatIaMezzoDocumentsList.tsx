import type { NextMezzoDocumentiSnapshot } from "../../../domain/nextDocumentiMezzoDomain";

export default function ChatIaMezzoDocumentsList({ snapshot }: { snapshot: NextMezzoDocumentiSnapshot }) {
  if (snapshot.items.length === 0) {
    return <p className="chat-ia-mezzo-empty">Nessun documento collegato trovato.</p>;
  }

  return (
    <ul className="chat-ia-mezzo-documents">
      {snapshot.items.map((item) => (
        <li key={`${item.sourceKey}-${item.id}`} className="chat-ia-mezzo-documents__item">
          <div>
            <strong>{item.titolo ?? item.tipoDocumento ?? "Documento mezzo"}</strong>
            <span>
              {item.dataDocumento ?? "data n.d."} - {item.sourceKey}
            </span>
          </div>
          {item.fileUrl ? (
            <a href={item.fileUrl} target="_blank" rel="noreferrer">
              Apri file
            </a>
          ) : (
            <span>File non disponibile</span>
          )}
        </li>
      ))}
    </ul>
  );
}
