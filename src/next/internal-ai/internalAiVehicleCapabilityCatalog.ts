import type {
  InternalAiVehicleCapabilityDescriptor,
  InternalAiVehicleCapabilityId,
} from "./internalAiTypes";

export const INTERNAL_AI_VEHICLE_CAPABILITY_CATALOG: InternalAiVehicleCapabilityDescriptor[] = [
  {
    id: "mezzo.status.dossier",
    title: "Stato operativo mezzo",
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
      "Questa e la capability canonica e prioritaria della prima verticale per richieste di stato mezzo/targa.",
      "Legge solo reader NEXT read-only della prima verticale: D01 anagrafica mezzo, D10 stato operativo e D02 operativita tecnica.",
      "D04, D05, D06, D07 e D08 restano fuori verticale consolidata e vengono dichiarati come limite.",
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
        "Dimmi lo stato del mezzo AB123CD",
        "Fammi capire la situazione della targa AB123CD",
        "Che problemi, alert o lavori ha la targa AB123CD",
      ],
    },
  },
  {
    id: "mezzo.preview.libretto",
    title: "Alert, revisione e stato operativo",
    domain: "mezzo_dossier",
    targetScope: "single_vehicle",
    requiredFilters: ["targa"],
    optionalFilters: ["periodo"],
    metrics: ["vehicle_identity", "technical_flags", "source_coverage", "missing_data"],
    groupBy: ["none"],
    outputKind: "chat_answer",
    bridgeCapabilityId: null,
    limitations: [
      "Legge solo segnali D10 mezzo-centrici gia governati nel clone: alert, revisioni, focus e sessioni correlate alla targa.",
      "Non trasforma feed autista o alert UI in verita assoluta: limiti e qualita restano dichiarati.",
    ],
    plannerHints: {
      keywords: [
        "alert",
        "revisione",
        "revisioni",
        "stato operativo",
        "controllo ko",
        "segnalazione",
        "promemoria",
      ],
      verbs: ["spiega", "mostra", "controlla", "verifica", "dimmi", "analizza"],
      samplePrompts: [
        "Spiegami gli alert del mezzo AB123CD",
        "Controlla revisione e stato operativo di AB123CD",
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
      "Legge solo il reader NEXT D02 per lavori e manutenzioni legati davvero alla targa.",
      "Non apre costi, documenti, procurement o materiali: quei domini non fanno parte della prima verticale consolidata.",
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
    id: "mezzo.report.overview",
    title: "Report targa mezzo",
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
      "Genera solo un report read-only della prima verticale D01 + D10 + D02, mantenendo il PDF gia esistente come output.",
      "Il report targa resta capability distinta e secondaria rispetto allo stato operativo mezzo in chat.",
      "Rifornimenti, costi, documenti, procurement e altri verticali restano fuori dal report consolidato e vengono dichiarati come limite.",
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
        "Preparami il report targa AB123CD",
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
