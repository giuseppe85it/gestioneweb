import type {
  InternalAiVehicleCapabilityDescriptor,
  InternalAiVehicleCapabilityId,
} from "./internalAiTypes";

export const INTERNAL_AI_VEHICLE_CAPABILITY_CATALOG: InternalAiVehicleCapabilityDescriptor[] = [
  {
    id: "mezzo.status.dossier",
    title: "Criticita e stato operativo mezzo",
    domain: "mezzo_dossier",
    targetScope: "single_vehicle",
    requiredFilters: ["targa"],
    optionalFilters: ["periodo"],
    metrics: [
      "vehicle_identity",
      "technical_flags",
      "maintenance_count",
      "work_count",
      "missing_data",
      "source_coverage",
    ],
    groupBy: ["none"],
    outputKind: "chat_answer",
    bridgeCapabilityId: null,
    limitations: [
      "Questa capability governa criticita, scadenze, alert, lavori aperti e manutenzioni della targa.",
      "Legge solo layer NEXT read-only consolidati: D01 anagrafica, D10 stato operativo e D02 backlog tecnico.",
      "Non apre rifornimenti, documenti o procurement se la richiesta non li chiede davvero.",
    ],
    plannerHints: {
      keywords: [
        "stato mezzo",
        "stato targa",
        "come sta oggi",
        "come sta la targa",
        "che situazione ha",
        "situazione mezzo",
        "problemi mezzo",
        "problemi targa",
        "quadro mezzo",
        "quadro operativo",
      ],
      verbs: ["mostra", "spiega", "controlla", "verifica", "dimmi", "riassumi", "analizza"],
      samplePrompts: [
        "Dimmi quale criticita ha oggi il mezzo AB123CD",
        "Fammi capire la situazione della targa AB123CD",
        "Che problemi, alert o lavori ha la targa AB123CD",
      ],
    },
  },
  {
    id: "mezzo.summary.rifornimenti",
    title: "Rifornimenti e consumi mezzo",
    domain: "mezzo_dossier",
    targetScope: "single_vehicle",
    requiredFilters: ["targa"],
    optionalFilters: ["periodo"],
    metrics: ["vehicle_identity", "source_coverage", "missing_data"],
    groupBy: ["none"],
    outputKind: "chat_answer",
    bridgeCapabilityId: null,
    limitations: [
      "Usa il dominio D04 read-only per rifornimenti e consumi, con calcoli deterministici su litri, km analizzati e anomalie record.",
      "Non allarga automaticamente la richiesta a criticita o quadro completo mezzo.",
    ],
    plannerHints: {
      keywords: [
        "rifornimenti",
        "consumi",
        "carburante",
        "km/l",
        "km per lt",
        "km per litro",
        "l/100km",
        "anomalie rifornimenti",
      ],
      verbs: ["mostra", "controlla", "verifica", "dimmi", "analizza", "crea"],
      samplePrompts: [
        "Dimmi i consumi del mezzo AB123CD negli ultimi 30 giorni",
        "Ci sono anomalie nei rifornimenti di AB123CD",
      ],
    },
  },
  {
    id: "mezzo.preview.libretto",
    title: "Scadenze, collaudi e pre-collaudi",
    domain: "mezzo_dossier",
    targetScope: "single_vehicle",
    requiredFilters: ["targa"],
    optionalFilters: ["periodo"],
    metrics: ["vehicle_identity", "technical_flags", "source_coverage", "missing_data"],
    groupBy: ["none"],
    outputKind: "chat_answer",
    bridgeCapabilityId: null,
    limitations: [
      "Legge solo segnali mezzo-centrici D10 gia governati nel clone: revisioni, collaudi, pre-collaudi, alert e focus collegati alla targa.",
      "Le raccomandazioni di pre-collaudo sono deterministiche e basate solo su scadenza vicina e assenza di dato pre-collaudo.",
    ],
    plannerHints: {
      keywords: [
        "revisione",
        "revisioni",
        "collaudo",
        "precollaudo",
        "pre-collaudo",
        "scadenze",
      ],
      verbs: ["spiega", "mostra", "controlla", "verifica", "dimmi", "analizza"],
      samplePrompts: [
        "Dimmi quali mezzi stanno per andare a collaudo",
        "Controlla revisione e pre-collaudo di AB123CD",
      ],
    },
  },
  {
    id: "mezzo.preview.preventivi",
    title: "Backlog tecnico lavori e manutenzioni",
    domain: "mezzo_dossier",
    targetScope: "single_vehicle",
    requiredFilters: ["targa"],
    optionalFilters: ["periodo"],
    metrics: [
      "vehicle_identity",
      "maintenance_count",
      "work_count",
      "source_coverage",
      "missing_data",
    ],
    groupBy: ["none"],
    outputKind: "chat_answer",
    bridgeCapabilityId: null,
    limitations: [
      "Legge solo il layer NEXT D02 per lavori e manutenzioni legati davvero alla targa.",
      "Puoi usarla sia per il backlog del singolo mezzo sia dentro le priorita flotte quando servono incroci con D10.",
    ],
    plannerHints: {
      keywords: [
        "lavori",
        "manutenzioni",
        "manutenzione",
        "backlog tecnico",
        "tecnico",
        "interventi",
      ],
      verbs: ["elenca", "mostra", "spiega", "riassumi", "dimmi", "analizza", "controlla"],
      samplePrompts: [
        "Che lavori e manutenzioni aperte ha AB123CD",
        "Fammi il backlog tecnico del mezzo AB123CD",
      ],
    },
  },
  {
    id: "mezzo.report.economic",
    title: "Classifica priorita mezzi",
    domain: "mezzo_dossier",
    targetScope: "single_vehicle",
    requiredFilters: [],
    optionalFilters: ["periodo"],
    metrics: [
      "technical_flags",
      "maintenance_count",
      "work_count",
      "source_coverage",
      "missing_data",
    ],
    groupBy: ["none"],
    outputKind: "chat_answer",
    bridgeCapabilityId: null,
    limitations: [
      "Incrocia solo segnali read-only dimostrabili: D10 per scadenze/alert/focus e D02 per backlog tecnico.",
      "Non inventa punteggi arbitrari: la priorita nasce da regole deterministiche e motivazioni esplicite.",
    ],
    plannerHints: {
      keywords: [
        "priorita",
        "classifica",
        "mezzo piu critico",
        "mezzi critici",
        "attenzione oggi",
      ],
      verbs: ["dimmi", "analizza", "incrocia", "ordina", "classifica"],
      samplePrompts: [
        "Quale mezzo e piu critico oggi",
        "Fammi una priorita dei mezzi che richiedono intervento",
      ],
    },
  },
  {
    id: "mezzo.preview.documents",
    title: "Documenti e costi mezzo",
    domain: "mezzo_dossier",
    targetScope: "single_vehicle",
    requiredFilters: ["targa"],
    optionalFilters: ["periodo"],
    metrics: ["vehicle_identity", "source_coverage", "missing_data"],
    groupBy: ["none"],
    outputKind: "chat_answer",
    bridgeCapabilityId: null,
    limitations: [
      "Legge domini D07/D08 in sola lettura quando la richiesta chiede davvero costi o documenti.",
      "I collegamenti restano prudenti se documenti e costi non hanno una targa forte o una data dimostrabile.",
    ],
    plannerHints: {
      keywords: ["costi", "documenti", "fatture", "preventivi", "allegati"],
      verbs: ["mostra", "analizza", "riassumi", "dimmi"],
      samplePrompts: [
        "Mostrami documenti e costi del mezzo AB123CD",
        "Dimmi i documenti rilevanti della targa AB123CD",
      ],
    },
  },
  {
    id: "mezzo.report.overview",
    title: "Quadro completo mezzo / report",
    domain: "mezzo_dossier",
    targetScope: "single_vehicle",
    requiredFilters: ["targa"],
    optionalFilters: ["periodo"],
    metrics: [
      "vehicle_identity",
      "technical_flags",
      "maintenance_count",
      "work_count",
      "missing_data",
      "source_coverage",
    ],
    groupBy: ["none"],
    outputKind: "report_preview",
    bridgeCapabilityId: "vehicle-report-preview",
    limitations: [
      "Genera un report read-only della targa riusando il renderer gia esistente e scegliendo solo gli ambiti richiesti dal planner.",
      "Il quadro completo viene aperto solo se la richiesta lo chiede in modo esplicito, non come fallback automatico.",
      "I domini ancora parziali vengono dichiarati come limite nel report finale.",
    ],
    plannerHints: {
      keywords: [
        "report",
        "pdf",
        "relazione",
        "sintesi strutturata",
        "documento",
        "anteprima",
        "preview",
      ],
      verbs: ["crea", "genera", "prepara", "fammi", "aprimi"],
      samplePrompts: [
        "Crea un report per il mezzo AB123CD ultimi 30 giorni",
        "Fammi un quadro completo della targa AB123CD",
      ],
    },
  },
];

export function readInternalAiVehicleCapabilityCatalog(): InternalAiVehicleCapabilityDescriptor[] {
  return INTERNAL_AI_VEHICLE_CAPABILITY_CATALOG;
}

export function findInternalAiVehicleCapabilityDescriptor(
  capabilityId: InternalAiVehicleCapabilityId,
): InternalAiVehicleCapabilityDescriptor | null {
  return (
    INTERNAL_AI_VEHICLE_CAPABILITY_CATALOG.find((entry) => entry.id === capabilityId) ?? null
  );
}
