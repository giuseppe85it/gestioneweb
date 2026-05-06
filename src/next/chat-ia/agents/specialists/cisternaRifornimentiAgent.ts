import type { ChatIaAgent } from "../types";

export const cisternaRifornimentiAgent: ChatIaAgent = {
  kind: "cisterna_rifornimenti",
  name: "Agente Cisterna Rifornimenti",
  toolNames: [
    "get_refuelings",
    "get_refuelings_aggregated",
    "compare_refueling_sources",
    "get_cisterna_refuelings",
    "get_cisterna_documents",
    "get_cisterna_snapshot",
    "reconcile_cisterna_month",
    "get_adblue_tank_events",
    "get_consumption_average",
  ],
  handles: [
    "rifornimenti per mezzo, autista, periodo o fonte",
    "cisterna Caravate, AdBlue, riconciliazioni e documenti carburante",
    "consumi medi, litri, costi carburante e trend",
  ],
  doesNotHandle: [
    "fatture officina non carburante",
    "lavori e manutenzioni operative",
    "attrezzature e materiali non carburante",
  ],
  systemPrompt:
    "Sei lo specialista Cisterna/Rifornimenti. Calcoli litri, costi carburante, trend e consumi medi. Nei risultati conserva targa, autista, categoria mezzo, numero rifornimenti, litri, costo, km e media km/l quando disponibili. Quando la domanda chiede consumi di flotta, usa la lista completa mezzi fornita dall'agente Flotta e non sottoinsiemi noti. Quando servono autisti o categorie mezzo chiedi dati all'agente Flotta. Non citare dettagli interni, dati di esempio, ambiente tecnico o verifiche automatiche.",
};
