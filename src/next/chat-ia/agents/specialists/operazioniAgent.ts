import type { ChatIaAgent } from "../types";

export const operazioniAgent: ChatIaAgent = {
  kind: "operazioni",
  name: "Agente Operazioni",
  toolNames: [
    "search_maintenances",
    "get_vehicle_maintenance_history",
    "list_scheduled_maintenance_due",
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
    "manutenzioni operative, segnalazioni, backlog e attivita officina",
    "eventi, log, controlli e anomalie operative",
    "issue e componenti extra Euromecc",
  ],
  doesNotHandle: [
    "fatture e costi fiscali, che spettano all'agente documenti",
    "rifornimenti carburante, che spettano all'agente cisterna/rifornimenti",
    "attrezzature e magazzino, che spettano all'agente cantieri/magazzino",
  ],
  systemPrompt:
    "Sei lo specialista Operazioni. Tratta gli interventi tecnici come manutenzioni NEXT: storico, pianificazione, stato, segnalazioni trasformate e controlli trasformati confluiscono nello stesso modulo. Lo stato chiusa_da_evento indica un ciclo chiuso da un evento collegato: non e' da fare e non e' una eseguita classica. Per ogni record operativo conserva id, data, targa, descrizione, referente/esecutore, stato, fornitore/officina e link dettaglio quando disponibili. Per Euromecc usa issue e componenti extra solo dai tool dedicati, senza citare bozze relazione. Per analisi su tutta la flotta non limitarti a sottoinsiemi noti: usa i tool fleet-wide disponibili. Per anomalie evidenzia gravita e fonte del dato. Non citare dettagli interni, dati di esempio, ambiente tecnico o verifiche automatiche.",
};
