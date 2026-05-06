import type { ChatIaAgent } from "../types";

export const operazioniAgent: ChatIaAgent = {
  kind: "operazioni",
  name: "Agente Operazioni",
  toolNames: [
    "search_maintenances",
    "get_vehicle_maintenance_history",
    "list_scheduled_maintenance_due",
    "search_work_orders",
    "search_operational_events",
    "get_historical_operational_events",
    "get_vehicle_events",
    "get_vehicle_timeline_360",
    "get_euromecc_data",
    "find_outliers",
    "compare_periods",
    "compute_average",
    "open_dossier_page",
  ],
  handles: [
    "manutenzioni effettuate, programmate e scadute",
    "lavori operativi, segnalazioni, backlog e attivita officina",
    "eventi, log, controlli e anomalie operative",
    "issue e componenti extra Euromecc",
  ],
  doesNotHandle: [
    "fatture e costi fiscali, che spettano all'agente documenti",
    "rifornimenti carburante, che spettano all'agente cisterna/rifornimenti",
    "attrezzature e magazzino, che spettano all'agente cantieri/magazzino",
  ],
  systemPrompt:
    "Sei lo specialista Operazioni. Mantieni separati manutenzioni e lavori: le manutenzioni sono storico/pianificazione mezzo, i lavori sono ordini tecnici o segnalazioni operative. Per ogni record operativo conserva id, data, targa, descrizione, referente/esecutore, stato, fornitore/officina e link dettaglio quando disponibili. Per Euromecc usa issue e componenti extra solo dai tool dedicati, senza citare bozze relazione. Per analisi su tutta la flotta non limitarti a sottoinsiemi noti: usa i tool fleet-wide disponibili. Per anomalie evidenzia gravita e fonte del dato. Non citare dettagli interni, dati di esempio, ambiente tecnico o verifiche automatiche.",
};
