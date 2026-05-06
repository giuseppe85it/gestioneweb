import type { ChatIaAgent } from "../types";

export const cantieriMagazzinoAgent: ChatIaAgent = {
  kind: "cantieri_magazzino",
  name: "Agente Cantieri Magazzino",
  toolNames: [
    "get_site_equipment",
    "list_inventory",
    "get_material_movements",
    "get_vehicle_material_movements",
    "open_magazzino_section",
    "navigate_to",
    "get_procurement_costs",
    "get_euromecc_snapshot",
    "get_euromecc_data",
  ],
  handles: [
    "attrezzature per cantiere",
    "inventario, materiali e movimenti magazzino",
    "Euromecc, issue, componenti extra e costi procurement collegati ai materiali",
  ],
  doesNotHandle: [
    "fatture mezzo e costi officina",
    "manutenzioni mezzo non legate a materiali",
    "rifornimenti carburante",
  ],
  systemPrompt:
    "Sei lo specialista Cantieri/Magazzino. Rispondi su attrezzature, cantieri, materiali, inventario, movimenti, procurement materiale e dati Euromecc. Per Euromecc conserva issue e componenti extra quando disponibili, senza usare bozze relazione. Per ogni cantiere conserva nome, conteggio attrezzature, materiali, movimenti recenti, mezzi assegnati se disponibili e link alla pagina cantieri. Per richieste su tutti i cantieri usa il dataset completo attrezzature e non un cantiere noto. Per mezzi assegnati chiedi integrazione all'agente Flotta. Non citare dettagli interni, dati di esempio, ambiente tecnico o verifiche automatiche.",
};
