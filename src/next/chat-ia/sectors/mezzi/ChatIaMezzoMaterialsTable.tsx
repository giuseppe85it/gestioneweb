import type { NextMezzoMaterialiMovimentiSnapshot } from "../../../domain/nextMaterialiMovimentiDomain";

function formatQuantity(value: number | null, unit: string | null): string {
  if (value === null) return "n.d.";
  return unit ? `${value} ${unit}` : String(value);
}

export default function ChatIaMezzoMaterialsTable({
  snapshot,
}: {
  snapshot: NextMezzoMaterialiMovimentiSnapshot;
}) {
  if (snapshot.items.length === 0) {
    return <p className="chat-ia-mezzo-empty">Nessun materiale consegnato trovato.</p>;
  }

  return (
    <table className="chat-ia-mezzo-table">
      <thead>
        <tr>
          <th>Data</th>
          <th>Materiale</th>
          <th>Qta</th>
          <th>Fornitore</th>
          <th>Costo</th>
        </tr>
      </thead>
      <tbody>
        {snapshot.items.map((item) => (
          <tr key={item.id}>
            <td>{item.data ?? "n.d."}</td>
            <td>{item.materiale ?? item.descrizione ?? "n.d."}</td>
            <td>{formatQuantity(item.quantita, item.unita)}</td>
            <td>{item.fornitore ?? "n.d."}</td>
            <td>{item.costoTotale !== null ? `${item.costoTotale} ${item.costoCurrency}` : "n.d."}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
