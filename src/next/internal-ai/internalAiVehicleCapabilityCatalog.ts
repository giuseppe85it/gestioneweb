import type {
  InternalAiVehicleCapabilityDescriptor,
  InternalAiVehicleCapabilityId,
} from "./internalAiTypes";

export const INTERNAL_AI_VEHICLE_CAPABILITY_CATALOG: InternalAiVehicleCapabilityDescriptor[] = [
  {
    id: "mezzo.preview.libretto",
    title: "Preview libretto mezzo",
    domain: "mezzo_dossier",
    targetScope: "single_vehicle",
    requiredFilters: ["targa"],
    optionalFilters: [],
    metrics: ["vehicle_identity", "file_availability", "technical_flags", "missing_data"],
    groupBy: ["none"],
    outputKind: "chat_answer",
    bridgeCapabilityId: "libretto-preview",
    limitations: [
      "Legge solo campi gia presenti sul mezzo e copertura file gia ricostruita nel clone.",
      "OCR, upload, Cloud Run esterno e Storage business live restano fuori perimetro.",
    ],
    plannerHints: {
      keywords: ["libretto", "revisione", "immatricolazione", "telaio", "carta di circolazione"],
      verbs: ["mostra", "spiega", "controlla", "verifica", "dimmi"],
      samplePrompts: [
        "Controlla il libretto del mezzo AB123CD",
        "Spiegami le scadenze libretto per AB123CD",
      ],
    },
  },
  {
    id: "mezzo.preview.preventivi",
    title: "Preview preventivi collegabili al mezzo",
    domain: "mezzo_dossier",
    targetScope: "single_vehicle",
    requiredFilters: ["targa"],
    optionalFilters: [],
    metrics: [
      "document_count",
      "preventivi_count",
      "direct_documents",
      "plausible_documents",
      "source_coverage",
      "missing_data",
    ],
    groupBy: ["source", "none"],
    outputKind: "chat_answer",
    bridgeCapabilityId: "preventivi-preview",
    limitations: [
      "Usa solo preventivi gia leggibili in chiave mezzo-centrica e supporti separati dichiarati.",
      "Approvazioni, workflow procurement globale e PDF business restano fuori perimetro.",
    ],
    plannerHints: {
      keywords: ["preventivi", "preventivo", "offerte", "offerta", "fornitore"],
      verbs: ["elenca", "mostra", "spiega", "controlla", "dimmi"],
      samplePrompts: [
        "Elenca i preventivi del mezzo AB123CD",
        "Dimmi se ci sono preventivi collegabili al mezzo AB123CD",
      ],
    },
  },
  {
    id: "mezzo.preview.documents",
    title: "Preview documenti collegabili al mezzo",
    domain: "mezzo_dossier",
    targetScope: "single_vehicle",
    requiredFilters: ["targa"],
    optionalFilters: [],
    metrics: [
      "document_count",
      "direct_documents",
      "plausible_documents",
      "documenti_utili_count",
      "file_availability",
      "source_coverage",
      "missing_data",
    ],
    groupBy: ["document_type", "source", "none"],
    outputKind: "chat_answer",
    bridgeCapabilityId: "documents-preview",
    limitations: [
      "Distingue sempre tra documenti diretti, plausibili e fuori perimetro.",
      "Non apre OCR, upload o retrieval Storage live lato server.",
    ],
    plannerHints: {
      keywords: ["documenti", "documento", "allegati", "fatture", "fattura", "archivio"],
      verbs: ["elenca", "mostra", "spiega", "riassumi", "dimmi"],
      samplePrompts: [
        "Elenca i documenti del mezzo AB123CD",
        "Mostrami i documenti pertinenti per AB123CD",
      ],
    },
  },
  {
    id: "mezzo.report.economic",
    title: "Riepilogo costi mezzo",
    domain: "mezzo_dossier",
    targetScope: "single_vehicle",
    requiredFilters: ["targa"],
    optionalFilters: ["periodo"],
    metrics: [
      "document_count",
      "preventivi_count",
      "fatture_count",
      "documenti_utili_count",
      "cost_total_eur",
      "cost_total_chf",
      "missing_data",
      "source_coverage",
    ],
    groupBy: ["document_type", "source", "none"],
    outputKind: "chat_answer",
    bridgeCapabilityId: "economic-analysis-preview",
    limitations: [
      "Il riepilogo resta documentale e read-only: non diventa contabilita ufficiale o procurement live.",
      "Il filtro periodo si applica solo ai record con data affidabile.",
    ],
    plannerHints: {
      keywords: ["costi", "spese", "economica", "economico", "costo", "fatture", "preventivi"],
      verbs: ["riepiloga", "riassumi", "spiega", "analizza", "dimmi"],
      samplePrompts: [
        "Riepiloga i costi del mezzo AB123CD ultimi 90 giorni",
        "Fammi capire le spese del mezzo AB123CD",
      ],
    },
  },
  {
    id: "mezzo.report.overview",
    title: "Report mezzo PDF",
    domain: "mezzo_dossier",
    targetScope: "single_vehicle",
    requiredFilters: ["targa"],
    optionalFilters: ["periodo"],
    metrics: [
      "vehicle_identity",
      "technical_flags",
      "document_count",
      "refuel_count",
      "maintenance_count",
      "work_count",
      "missing_data",
      "source_coverage",
    ],
    groupBy: ["none"],
    outputKind: "report_preview",
    bridgeCapabilityId: "vehicle-report-preview",
    limitations: [
      "Genera solo preview/report read-only nel perimetro IA, mai scritture business automatiche.",
      "I blocchi senza data affidabile restano dichiarati come parziali o fuori filtro.",
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
        "Preparami il PDF del mezzo AB123CD",
      ],
    },
  },
  {
    id: "mezzo.status.dossier",
    title: "Stato sintetico Dossier mezzo",
    domain: "mezzo_dossier",
    targetScope: "single_vehicle",
    requiredFilters: ["targa"],
    optionalFilters: ["periodo"],
    metrics: [
      "vehicle_identity",
      "technical_flags",
      "document_count",
      "refuel_count",
      "maintenance_count",
      "work_count",
      "missing_data",
      "source_coverage",
    ],
    groupBy: ["none"],
    outputKind: "chat_answer",
    bridgeCapabilityId: null,
    limitations: [
      "Usa il composito Dossier clone-safe gia esistente e non legge pagine UI come fonte primaria.",
      "Non apre retrieval Firebase live largo e non tocca la madre.",
    ],
    plannerHints: {
      keywords: ["stato", "situazione", "dossier", "mezzo", "targa", "quadro sintetico"],
      verbs: ["dimmi", "spiega", "riassumi", "analizza", "fammi capire"],
      samplePrompts: [
        "Dimmi lo stato del mezzo AB123CD",
        "Fammi capire il dossier del mezzo AB123CD",
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
