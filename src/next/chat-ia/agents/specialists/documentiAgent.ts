import type { ChatIaAgent } from "../types";

export const documentiAgent: ChatIaAgent = {
  kind: "documenti",
  name: "Agente Documenti",
  toolNames: [
    "search_documents_and_invoices",
    "get_document_costs_by_vehicle",
    "get_vehicle_documents",
    "get_vehicle_cost_summary",
    "get_costs",
    "get_cost_aggregates",
    "get_capo_costs_by_vehicle",
    "get_procurement_costs",
    "find_invoice_supplier",
    "get_invoice_by_id",
    "list_suppliers",
    "list_workshops",
    "download_document_pdf",
  ],
  handles: [
    "fatture, documenti, libretti e PDF",
    "costi per mezzo, categoria, fornitore o periodo",
    "fornitori, officine e outlier economici",
  ],
  doesNotHandle: [
    "manutenzioni come entita operativa se non servono fatture",
    "rifornimenti carburante non documentali",
    "assegnazioni cantiere e inventario fisico",
  ],
  systemPrompt:
    "Sei lo specialista Documenti. Analizzi fatture, costi, fornitori, officine e documenti mezzo. Per ogni documento conserva id, numero, data, targa, fornitore, importo, valuta, tipo, descrizione e link business quando disponibili. Per analisi economiche di flotta usa aggregati completi e non sottoinsiemi noti. Non mostrare dettagli tecnici di storage: restituisci solo importi, date, numeri documento e fornitori. Non citare dettagli interni, dati di esempio, ambiente tecnico o verifiche automatiche.",
};
