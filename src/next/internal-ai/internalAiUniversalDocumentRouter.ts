import { buildNextMagazzinoPath } from "../nextStructuralPaths";
import type { InternalAiChatAttachment } from "./internalAiTypes";
import type {
  InternalAiUniversalActionIntent,
  InternalAiUniversalDocumentClassification,
  InternalAiUniversalDocumentRoute,
  InternalAiUniversalRequestState,
} from "./internalAiUniversalTypes";

function normalizeText(value: string | null | undefined): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectWarehouseInvoiceAttachment(haystack: string): {
  warehouseInvoice: boolean;
  strongSignal: boolean;
  adBlueSignal: boolean;
  hasInventorySignal: boolean;
} {
  const hasInventorySignal =
    /\b(material\w*|articol\w*|qta|quantita|magazzin\w*|adblue|mariba|ricamb\w*|ferrament\w*|vernic\w*|bullon\w*|consumabil\w*)\b/.test(
      haystack,
    );
  const hasInvoiceSignal =
    /\b(fattur\w*|ddt|bolla\w*|imponibil\w*|iva|total\w*|fornitor\w*|arriv\w*)\b/.test(
      haystack,
    );
  const adBlueSignal = /\badblue\b/.test(haystack);

  return {
    warehouseInvoice: hasInventorySignal && hasInvoiceSignal,
    strongSignal: hasInventorySignal && hasInvoiceSignal,
    adBlueSignal,
    hasInventorySignal,
  };
}

function buildActionIntentFromRoute(route: InternalAiUniversalDocumentRoute): InternalAiUniversalActionIntent {
  return {
    type:
      route.status === "inbox_documentale" ? "route_to_inbox" : "prepare_preview",
    label: route.status === "inbox_documentale" ? "Apri inbox documentale universale" : `Apri ${route.fileName}`,
    moduleId: route.targetModuleId,
    path: route.targetPath,
    hookId: route.targetHookId,
    capabilityId: route.targetCapabilityId,
    reason: route.rationale[0] ?? "Instradamento documentale del clone.",
    payloadPreview: route.rationale,
    handoff: route.handoffPayload,
  };
}

function classifyAttachment(
  attachment: InternalAiChatAttachment,
  prompt: string,
): {
  classification: InternalAiUniversalDocumentClassification;
  confidence: InternalAiUniversalDocumentRoute["confidence"];
  rationale: string[];
  targetModuleId: string;
  suggestedModuleLabel: string;
  targetHookId: string | null;
  targetPath: string;
  targetCapabilityId: string | null;
  ambiguity: InternalAiUniversalDocumentRoute["ambiguity"];
  status: InternalAiUniversalRequestState;
} {
  const normalizedPrompt = normalizeText(prompt);
  const fileName = normalizeText(attachment.fileName);
  const excerpt = normalizeText(attachment.textExcerpt);
  const haystack = [fileName, excerpt, normalizedPrompt].join(" ");
  const mentionsSupplier = /\bfornitore\b/.test(normalizedPrompt);
  const hasVehicleContext =
    /\b(mezzo|targa|dossier|revisione|autocarro)\b/.test(haystack) ||
    /\b[a-z]{2}\d{3}[a-z]{2}\b/i.test(haystack);

  if (/\blibretto\b/.test(haystack) || /\bcarta di circolazione\b/.test(haystack)) {
    return {
      classification: "libretto_mezzo",
      confidence: "alta",
      rationale: [
        "Il file richiama in modo forte il libretto/carta di circolazione.",
        "Il flusso corretto del clone e `IA > Libretto`.",
      ],
      targetModuleId: "next.ia_hub",
      suggestedModuleLabel: "Hub IA clone",
      targetHookId: "ia.libretto",
      targetPath: "/next/ia/libretto",
      targetCapabilityId: "clone.libretto-preview",
      ambiguity: "bassa",
      status: "pronto_prefill",
    };
  }

  if (/\bpreventiv|quotaz|offerta\b/.test(haystack) || (mentionsSupplier && attachment.kind !== "image")) {
    return {
      classification: "preventivo_fornitore",
      confidence: mentionsSupplier ? "alta" : "media",
      rationale: [
        "Il file ha segnali di preventivo/offerta o il testo impone il vincolo `fornitore`.",
        "Il flusso corretto del clone e procurement/acquisti.",
      ],
      targetModuleId: "next.procurement",
      suggestedModuleLabel: "Procurement / ordini / fornitori",
      targetHookId: "procurement.main",
      targetPath: "/next/acquisti",
      targetCapabilityId: "clone.preventivi-preview",
      ambiguity: mentionsSupplier ? "bassa" : "media",
      status: mentionsSupplier ? "pronto_prefill" : "da_verificare",
    };
  }

  if (/\bcisterna|scheda test|caravate\b/.test(haystack)) {
    return {
      classification: "documento_cisterna",
      confidence: "media",
      rationale: [
        "Il file richiama il verticale cisterna.",
        "Il punto corretto del clone resta la route specialistica `/next/cisterna/ia`.",
      ],
      targetModuleId: "next.cisterna",
      suggestedModuleLabel: "Cisterna",
      targetHookId: "cisterna.ia",
      targetPath: "/next/cisterna/ia",
      targetCapabilityId: "legacy.cisterna-extraction",
      ambiguity: "media",
      status: "pronto_prefill",
    };
  }

  const warehouseInvoiceDetection = detectWarehouseInvoiceAttachment(haystack);
  if (
    warehouseInvoiceDetection.hasInventorySignal ||
    warehouseInvoiceDetection.warehouseInvoice ||
    attachment.kind === "spreadsheet"
  ) {
    const warehouseInvoice = warehouseInvoiceDetection.warehouseInvoice;
    const adBlueInvoice = warehouseInvoiceDetection.adBlueSignal && warehouseInvoice;
    const plainInventoryDocument = !warehouseInvoice;
    return {
      classification: "tabella_materiali",
      confidence:
        plainInventoryDocument || adBlueInvoice || warehouseInvoiceDetection.strongSignal
          ? "media"
          : "prudente",
      rationale: warehouseInvoice
        ? [
            adBlueInvoice
              ? "Il file sembra una fattura AdBlue del dominio Magazzino."
              : "Il file sembra una fattura/documento materiali del dominio Magazzino.",
            "Il clone lo instrada alla vista documenti e costi di Magazzino per la decisione controllata su riconciliazione o carico stock.",
          ]
        : [
            "Il file sembra una tabella materiali/inventario.",
            "Il clone oggi lo colloca meglio nel modulo Magazzino canonico.",
          ],
      targetModuleId: "next.magazzino",
      suggestedModuleLabel: "Magazzino",
      targetHookId: warehouseInvoice ? "magazzino.docs" : "inventario.main",
      targetPath: warehouseInvoice
        ? buildNextMagazzinoPath("documenti-costi")
        : buildNextMagazzinoPath("inventario"),
      targetCapabilityId: null,
      ambiguity: plainInventoryDocument && attachment.kind === "spreadsheet" ? "bassa" : "media",
      status: warehouseInvoice
        ? warehouseInvoiceDetection.strongSignal
          ? "pronto_prefill"
          : "da_verificare"
        : "pronto_prefill",
    };
  }

  if (
    hasVehicleContext &&
    (/\bfattur|ddt|document|allegat|pdf\b/.test(haystack) || attachment.kind === "pdf")
  ) {
    return {
      classification: "documento_mezzo",
      confidence: "media",
      rationale: [
        "Il file appare come documento generico del gestionale.",
        "Il clone lo instrada nel flusso documentale IA e non in un modulo arbitrario.",
      ],
      targetModuleId: "next.ia_hub",
      suggestedModuleLabel: "Hub IA clone",
      targetHookId: "ia.documenti",
      targetPath: "/next/ia/documenti",
      targetCapabilityId: "clone.documents-preview",
      ambiguity: "media",
      status: "pronto_prefill",
    };
  }

  if (attachment.kind === "text") {
    return {
      classification: "testo_operativo",
      confidence: "prudente",
      rationale: [
        "L'allegato e testuale e puo fungere da contesto per la chat universale.",
        "Resta nella chat universale finche non emerge un modulo target piu forte.",
      ],
      targetModuleId: "next.ia_interna",
      suggestedModuleLabel: "IA interna universale",
      targetHookId: "ia.interna",
      targetPath: "/next/ia/interna",
      targetCapabilityId: "backend.chat.controlled",
      ambiguity: "media",
      status: "solo_risposta",
    };
  }

  if (attachment.kind === "image") {
    return {
      classification: "immagine_generica",
      confidence: "prudente",
      rationale: [
        "Immagine senza segnali abbastanza forti per un modulo univoco.",
        "Il sistema la porta nella inbox documentale universale, non la butta nel dominio sbagliato.",
      ],
      targetModuleId: "next.ia_interna",
      suggestedModuleLabel: "IA interna universale",
      targetHookId: "ia.richieste",
      targetPath: "/next/ia/interna/richieste",
      targetCapabilityId: "backend.chat.controlled",
      ambiguity: "alta",
      status: "inbox_documentale",
    };
  }

  return {
    classification: "documento_ambiguo",
    confidence: "da_verificare",
    rationale: [
      "Il file non espone segnali sufficienti per un routing sicuro.",
      "Il sistema lo mantiene nella inbox documentale universale del clone/NEXT.",
    ],
    targetModuleId: "next.ia_interna",
    suggestedModuleLabel: "IA interna universale",
    targetHookId: "ia.richieste",
    targetPath: "/next/ia/interna/richieste",
    targetCapabilityId: "backend.chat.controlled",
    ambiguity: "alta",
    status: "inbox_documentale",
  };
}

export function routeInternalAiUniversalDocuments(args: {
  attachments: InternalAiChatAttachment[];
  prompt: string;
}): {
  routes: InternalAiUniversalDocumentRoute[];
  actionIntents: InternalAiUniversalActionIntent[];
} {
  const routes = args.attachments.map((attachment) => {
    const result = classifyAttachment(attachment, args.prompt);
    return {
      attachmentId: attachment.id,
      fileName: attachment.fileName,
      classification: result.classification,
      confidence: result.confidence,
      rationale: result.rationale,
      targetModuleId: result.targetModuleId,
      suggestedModuleLabel: result.suggestedModuleLabel,
      targetHookId: result.targetHookId,
      targetPath: result.targetPath,
      targetCapabilityId: result.targetCapabilityId,
      ambiguity: result.ambiguity,
      status: result.status,
      entityCandidateLabels: [],
      handoffPayload: null,
    };
  });

  return {
    routes,
    actionIntents: routes.map(buildActionIntentFromRoute),
  };
}
