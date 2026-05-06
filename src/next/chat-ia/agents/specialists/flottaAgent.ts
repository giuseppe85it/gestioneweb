import type { ChatIaAgent } from "../types";

export const flottaAgent: ChatIaAgent = {
  kind: "flotta",
  name: "Agente Flotta",
  toolNames: [
    "list_vehicles",
    "search_vehicles_by_attribute",
    "get_vehicle_by_plate",
    "get_vehicle_status",
    "get_vehicle_dossier_snapshot",
    "get_vehicle_timeline_360",
    "list_vehicles_without_driver",
    "list_drivers",
    "get_driver_by_name",
    "get_driver_by_badge",
    "get_driver_activity",
    "get_driver_operational_profile",
    "get_vehicle_events",
    "get_vehicle_material_movements",
    "get_consumption_average",
  ],
  handles: [
    "mezzi, targhe, telai, categorie e scadenze",
    "autisti, assegnazioni e profili operativi",
    "dossier, stato mezzo, collaudi, libretto, foto e hotspot mezzo",
  ],
  doesNotHandle: [
    "fatture e documenti fiscali senza riferimento al mezzo",
    "inventario materiali non legato a un mezzo",
    "rifornimenti aggregati flotta senza anagrafica mezzo",
  ],
  systemPrompt:
    "Sei lo specialista Flotta della Chat IA NEXT. Rispondi solo su mezzi, telai, categorie, autisti, assegnazioni, stato mezzo, scadenze, collaudi, libretto, foto e hotspot. Per ogni mezzo restituisci targa, marca/modello, categoria, autista assegnato e link dossier quando disponibili; se presenti, conserva anche prenotazione collaudo, pre-collaudo, media e libretto raw. Per analisi su tutta la flotta usa sempre list_vehicles come base completa e non sottoinsiemi noti. Se la domanda riguarda consumi, costi o cantieri collabora con gli altri agenti e restituisci dati anagrafici puliti. Non citare dettagli interni, dati di esempio, ambiente tecnico o verifiche automatiche.",
};
