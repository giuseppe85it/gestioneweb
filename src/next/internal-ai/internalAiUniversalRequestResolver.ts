import {
  INTERNAL_AI_UNIVERSAL_ADAPTER_CONTRACTS,
  INTERNAL_AI_UNIVERSAL_AI_CAPABILITIES,
  INTERNAL_AI_UNIVERSAL_UI_HOOKS,
} from "./internalAiUniversalContracts";
import type {
  InternalAiUniversalActionIntent,
  InternalAiUniversalDocumentRoute,
  InternalAiUniversalEntityResolution,
  InternalAiUniversalRequestResolution,
} from "./internalAiUniversalTypes";

function buildActionIntentByHookId(
  hookId: string,
  reason: string,
  entityResolution: InternalAiUniversalEntityResolution,
  capabilityId: string | null = null,
): InternalAiUniversalActionIntent | null {
  const hook = INTERNAL_AI_UNIVERSAL_UI_HOOKS.find((entry) => entry.hookId === hookId) ?? null;
  if (!hook) {
    return null;
  }

  const resolvedTarga =
    entityResolution.matches.find((entry) => entry.entityKind === "targa")?.normalizedValue ?? null;
  const path =
    resolvedTarga && hook.path.includes(":targa")
      ? hook.path.replace(":targa", encodeURIComponent(resolvedTarga))
      : hook.path;

  return {
    type: hook.mode === "modal" ? "open_modal" : hook.mode === "panel" ? "open_panel" : "open_route",
    label: hook.label,
    moduleId: hook.moduleId,
    path,
    hookId: hook.hookId,
    capabilityId,
    reason,
    payloadPreview: [],
    handoff: null,
  };
}

function resolveWarehouseHookId(prompt: string): string {
  const normalizedPrompt = prompt.toLowerCase();
  const hasDocumentSignal =
    /\b(document|fattur|preventiv|cost|fornitor|listino|ordin|arriv)\b/.test(
      normalizedPrompt,
    );
  const hasAdBlueSignal = /\b(adblue|cistern)\b/.test(normalizedPrompt);

  if (hasDocumentSignal) {
    return "magazzino.docs";
  }

  if (hasAdBlueSignal) {
    return "magazzino.adblue";
  }

  if (/\b(moviment|consegnat|uscit)\b/.test(normalizedPrompt)) {
    return "materiali.main";
  }

  return "inventario.main";
}

function pushUnique(values: string[], nextValues: string[]) {
  nextValues.forEach((value) => {
    if (!values.includes(value)) {
      values.push(value);
    }
  });
}

function pushReason(reasoning: string[], message: string) {
  if (!reasoning.includes(message)) {
    reasoning.push(message);
  }
}

function pushConstraint(explicitConstraints: string[], message: string) {
  if (!explicitConstraints.includes(message)) {
    explicitConstraints.push(message);
  }
}

function setPrimaryAction(
  current: InternalAiUniversalActionIntent | null,
  next: InternalAiUniversalActionIntent | null,
): InternalAiUniversalActionIntent | null {
  return next ?? current;
}

function dedupeIds(values: string[]): string[] {
  return [...new Set(values)];
}

function applyDocumentRouteSignals(args: {
  prompt: string;
  documentRoutes: InternalAiUniversalDocumentRoute[];
  entityResolution: InternalAiUniversalEntityResolution;
  selectedAdapterIds: string[];
  selectedModuleIds: string[];
  reusableCapabilityIds: string[];
  reasoning: string[];
  explicitConstraints: string[];
  currentPrimaryAction: InternalAiUniversalActionIntent | null;
}): {
  focusLabel: string | null;
  priority: "alta" | "media" | "bassa";
  requestKind: InternalAiUniversalRequestResolution["requestKind"];
  primaryActionIntent: InternalAiUniversalActionIntent | null;
} {
  let focusLabel: string | null = null;
  const priority: "alta" | "media" | "bassa" = "alta";
  const requestKind: InternalAiUniversalRequestResolution["requestKind"] = "instradamento_documento";
  let primaryActionIntent = args.currentPrimaryAction;
  const prompt = args.prompt.toLowerCase();

  args.documentRoutes.forEach((route) => {
    switch (route.classification) {
      case "libretto_mezzo":
        focusLabel = "Libretto mezzo e documentazione flotta";
        pushUnique(args.selectedAdapterIds, ["adapter.d01", "adapter.d07d08"]);
        pushUnique(args.selectedModuleIds, ["next.ia_hub", "next.libretti_export"]);
        pushUnique(args.reusableCapabilityIds, ["clone.libretto-preview"]);
        pushReason(
          args.reasoning,
          "Il router documentale ha riconosciuto un libretto: il flusso corretto e IA > Libretto con export dedicato.",
        );
        primaryActionIntent = setPrimaryAction(
          primaryActionIntent,
          buildActionIntentByHookId(
            "ia.libretto",
            "Il documento e un libretto e va aperto nel flusso libretti del clone.",
            args.entityResolution,
            "clone.libretto-preview",
          ),
        );
        break;
      case "preventivo_fornitore":
        focusLabel = "Procurement / preventivi fornitore";
        pushUnique(args.selectedAdapterIds, ["adapter.d06"]);
        pushUnique(args.selectedModuleIds, ["next.procurement"]);
        pushUnique(args.reusableCapabilityIds, [
          "clone.preventivi-preview",
          "legacy.preventivo-extraction",
        ]);
        pushReason(
          args.reasoning,
          "Il router documentale ha classificato un preventivo fornitore: il flusso corretto e procurement.",
        );
        pushConstraint(
          args.explicitConstraints,
          "Se il testo dichiara esplicitamente `fornitore`, il router lo tratta come vincolo forte per D06.",
        );
        primaryActionIntent = setPrimaryAction(
          primaryActionIntent,
          buildActionIntentByHookId(
            "procurement.main",
            "Il documento va instradato al modulo procurement con payload uniforme.",
            args.entityResolution,
            "clone.preventivi-preview",
          ),
        );
        break;
      case "documento_cisterna":
        focusLabel = "Cisterna / documentazione specialistica";
        pushUnique(args.selectedAdapterIds, ["adapter.d09"]);
        pushUnique(args.selectedModuleIds, ["next.cisterna"]);
        pushUnique(args.reusableCapabilityIds, ["legacy.cisterna-extraction"]);
        pushReason(
          args.reasoning,
          "Il router documentale ha rilevato il verticale cisterna e lo instrada al modulo specialistico corretto.",
        );
        primaryActionIntent = setPrimaryAction(
          primaryActionIntent,
          buildActionIntentByHookId(
            "cisterna.ia",
            "Il documento va instradato a Cisterna IA senza collassare su altri domini.",
            args.entityResolution,
            "legacy.cisterna-extraction",
          ),
        );
        break;
      case "tabella_materiali":
        focusLabel = "Inventario / materiali / magazzino";
        pushUnique(args.selectedAdapterIds, ["adapter.d05"]);
        pushUnique(args.selectedModuleIds, ["next.magazzino"]);
        pushReason(
          args.reasoning,
          "Il router documentale ha riconosciuto una tabella materiali: il flusso corretto e il modulo Magazzino canonico.",
        );
        primaryActionIntent = setPrimaryAction(
          primaryActionIntent,
          buildActionIntentByHookId(
            resolveWarehouseHookId(prompt),
            "Il documento materiali viene agganciato al modulo Magazzino canonico del clone.",
            args.entityResolution,
            null,
          ),
        );
        break;
      case "documento_mezzo":
        focusLabel = "Documenti mezzo e dossier";
        pushUnique(args.selectedAdapterIds, ["adapter.d01", "adapter.d07d08"]);
        pushUnique(args.selectedModuleIds, ["next.ia_hub", "next.dossier"]);
        pushUnique(args.reusableCapabilityIds, ["clone.documents-preview"]);
        pushReason(
          args.reasoning,
          "Il router documentale ha rilevato un documento mezzo: la lettura deve restare tra documenti IA e dossier.",
        );
        primaryActionIntent = setPrimaryAction(
          primaryActionIntent,
          buildActionIntentByHookId(
            "ia.documenti",
            "Il documento ha contesto mezzo sufficientemente forte per il flusso documenti IA.",
            args.entityResolution,
            "clone.documents-preview",
          ),
        );
        break;
      case "documento_ambiguo":
      case "immagine_generica":
        focusLabel = "Inbox documentale universale";
        pushUnique(args.selectedAdapterIds, ["adapter.universal"]);
        pushUnique(args.selectedModuleIds, ["next.ia_interna"]);
        pushUnique(args.reusableCapabilityIds, ["backend.chat.controlled"]);
        pushReason(
          args.reasoning,
          "Il documento resta in inbox documentale universale: nessun invio automatico a un modulo sbagliato.",
        );
        pushConstraint(
          args.explicitConstraints,
          "I documenti ambigui o da verificare devono restare nella inbox documentale universale finche non emerge un target sicuro.",
        );
        primaryActionIntent = setPrimaryAction(
          primaryActionIntent,
          buildActionIntentByHookId(
            "ia.richieste",
            "Il documento ambiguo deve essere trattato nella inbox documentale universale del clone.",
            args.entityResolution,
            "backend.chat.controlled",
          ),
        );
        break;
      case "testo_operativo":
        pushUnique(args.selectedAdapterIds, ["adapter.universal"]);
        pushUnique(args.selectedModuleIds, ["next.ia_interna"]);
        pushUnique(args.reusableCapabilityIds, ["backend.chat.controlled"]);
        pushReason(
          args.reasoning,
          "L'allegato testuale resta dentro la chat universale finche il planner non seleziona un modulo piu forte.",
        );
        primaryActionIntent = setPrimaryAction(
          primaryActionIntent,
          buildActionIntentByHookId(
            "ia.interna",
            "Il contenuto testuale resta nella chat universale con eventuale handoff successivo.",
            args.entityResolution,
            "backend.chat.controlled",
          ),
        );
        break;
      default:
        break;
    }
  });

  return {
    focusLabel,
    priority,
    requestKind,
    primaryActionIntent,
  };
}

export function resolveInternalAiUniversalRequest(args: {
  prompt: string;
  entityResolution: InternalAiUniversalEntityResolution;
  hasAttachments: boolean;
  documentRoutes: InternalAiUniversalDocumentRoute[];
}): InternalAiUniversalRequestResolution {
  const prompt = args.prompt.toLowerCase();
  const entityKinds = args.entityResolution.matches.map((entry) => entry.entityKind);
  const selectedAdapterIds: string[] = [];
  const selectedModuleIds: string[] = [];
  const reusableCapabilityIds: string[] = [];
  const reasoning: string[] = [];
  const explicitConstraints: string[] = [];
  let requestKind: InternalAiUniversalRequestResolution["requestKind"] = "richiesta_generica";
  let priority: InternalAiUniversalRequestResolution["priority"] = "media";
  let focusLabel = "Chat universale clone/NEXT";
  let primaryActionIntent: InternalAiUniversalActionIntent | null = null;

  if (args.hasAttachments) {
    requestKind = "instradamento_documento";
    priority = "alta";
    focusLabel = "Routing documenti e allegati";
    pushUnique(selectedAdapterIds, ["adapter.universal"]);
    pushUnique(selectedModuleIds, ["next.ia_interna"]);
    pushReason(
      reasoning,
      "Sono presenti allegati: la richiesta va trattata come documento piu testo e non come semplice risposta isolata.",
    );
    primaryActionIntent =
      buildActionIntentByHookId(
        "ia.interna",
        "La chat universale resta il punto di ingresso per classificare e instradare allegati.",
        args.entityResolution,
        "backend.chat.controlled",
      ) ?? null;
  }

  if (args.documentRoutes.length > 0) {
    const routeSignals = applyDocumentRouteSignals({
      prompt: args.prompt,
      documentRoutes: args.documentRoutes,
      entityResolution: args.entityResolution,
      selectedAdapterIds,
      selectedModuleIds,
      reusableCapabilityIds,
      reasoning,
      explicitConstraints,
      currentPrimaryAction: primaryActionIntent,
    });
    requestKind = routeSignals.requestKind;
    priority = routeSignals.priority;
    focusLabel = routeSignals.focusLabel ?? focusLabel;
    primaryActionIntent = routeSignals.primaryActionIntent;
  }

  if (/\b(apri|portami|aggancia|vai su|instrada)\b/.test(prompt)) {
    requestKind = "richiesta_apertura_flusso";
    priority = "alta";
    pushReason(reasoning, "Il prompt chiede esplicitamente di aprire o agganciare un flusso UI.");
  }

  if (/\b(report|pdf|quadro completo|anteprima)\b/.test(prompt)) {
    requestKind = "report_strutturato";
    pushReason(reasoning, "Il prompt chiede un output strutturato o un documento.");
    pushUnique(selectedAdapterIds, ["adapter.universal"]);
  }

  if (/\b(file|route|moduli|dipendenze|repo|flusso|integrazione)\b/.test(prompt)) {
    requestKind = "analisi_repo_flussi";
    focusLabel = "Registry tecnico e punti di integrazione";
    pushUnique(selectedAdapterIds, ["adapter.repo"]);
    pushUnique(selectedModuleIds, ["next.ia_interna"]);
    pushUnique(reusableCapabilityIds, ["backend.repo-understanding"]);
    pushReason(reasoning, "Il prompt riguarda percorsi UI, moduli o punti di integrazione.");
  }

  if (
    requestKind === "richiesta_generica" &&
    (entityKinds.length > 0 || /\b(quadro|stato|situazione|dati|dimmi)\b/.test(prompt))
  ) {
    requestKind = "lookup_entita";
    focusLabel = "Lettura entita e moduli pertinenti";
    pushReason(reasoning, "La richiesta chiede dati interni sul gestionale partendo da entita risolte.");
  }

  if (
    requestKind === "lookup_entita" &&
    /\b(alert|scadenz|priorit|criticit|attenzion|oggi)\b/.test(prompt)
  ) {
    requestKind = "domanda_operativa";
    focusLabel = "Domanda operativa multi-modulo";
    pushReason(reasoning, "Il prompt richiede un quadro operativo, non solo lookup statico.");
  }

  if (entityKinds.includes("targa") || entityKinds.includes("dossier")) {
    pushUnique(selectedAdapterIds, ["adapter.d01", "adapter.d10"]);
    pushUnique(selectedModuleIds, ["next.dossier"]);
    pushReason(reasoning, "La richiesta tocca il perimetro mezzo/targa/dossier.");
  }

  if (/\b(riforniment|consum|carburante)\b/.test(prompt)) {
    pushUnique(selectedAdapterIds, ["adapter.d04"]);
    pushUnique(selectedModuleIds, ["next.dossier"]);
    pushReason(reasoning, "Il prompt chiede rifornimenti o consumi.");
  }

  if (/\b(lavor|manutenz|gomme|tecnic)\b/.test(prompt)) {
    pushUnique(selectedAdapterIds, ["adapter.d02"]);
    pushUnique(selectedModuleIds, ["next.operativita", "next.dossier"]);
    pushReason(reasoning, "Il prompt chiama lavori, manutenzioni o gomme.");
  }

  if (entityKinds.includes("autista") || entityKinds.includes("badge")) {
    pushUnique(selectedAdapterIds, ["adapter.d03"]);
    pushUnique(selectedModuleIds, ["next.autisti"]);
    pushReason(reasoning, "Sono presenti entita autista/badge.");
    primaryActionIntent =
      primaryActionIntent ??
      buildActionIntentByHookId(
        /\b(event|oggi|inbox|anomali|segnal)\b/.test(prompt) ? "autisti.inbox" : "autisti.admin",
        "La richiesta chiama il modulo autisti del clone in modo diretto e strutturale.",
        args.entityResolution,
        "clone.driver-report-preview",
      );
  }

  if (
    entityKinds.includes("fornitore") ||
    entityKinds.includes("ordine") ||
    /\b(preventiv|fornitor|ordini?|procurement|acquist)\b/.test(prompt)
  ) {
    pushUnique(selectedAdapterIds, ["adapter.d06"]);
    pushUnique(selectedModuleIds, ["next.procurement"]);
    pushUnique(reusableCapabilityIds, ["clone.preventivi-preview", "legacy.preventivo-extraction"]);
    pushReason(reasoning, "Il prompt entra nel perimetro procurement/fornitore/preventivi.");
    primaryActionIntent =
      primaryActionIntent ??
      buildActionIntentByHookId(
        "procurement.main",
        "Il modulo procurement e il target corretto per richieste su fornitori, ordini e preventivi.",
        args.entityResolution,
        "clone.preventivi-preview",
      );
  }

  if (entityKinds.includes("documento") || /\b(document|fattur|allegat|librett)\b/.test(prompt)) {
    pushUnique(selectedAdapterIds, ["adapter.d07d08"]);
    pushUnique(selectedModuleIds, ["next.ia_hub", "next.dossier"]);
    pushUnique(reusableCapabilityIds, ["clone.documents-preview", "clone.libretto-preview"]);
    pushReason(reasoning, "La richiesta richiede classificazione o lettura documentale.");
  }

  if (/\b(material|inventari|magazzin|attrezzatur)\b/.test(prompt)) {
    pushUnique(selectedAdapterIds, ["adapter.d05"]);
    pushUnique(selectedModuleIds, ["next.magazzino"]);
    pushReason(reasoning, "Il prompt tocca stock, materiali o attrezzature.");
    primaryActionIntent =
      buildActionIntentByHookId(
        resolveWarehouseHookId(prompt),
        "Il modulo operativo corretto e il Magazzino canonico del clone.",
        args.entityResolution,
        null,
      ) ?? primaryActionIntent;
  }

  if (
    /\b(euromecc|cemento|silo|fluidificant|blower|plc|hmi|carico ferrovia|carico camion)\b/.test(
      prompt,
    )
  ) {
    pushUnique(selectedAdapterIds, ["adapter.euromecc"]);
    pushUnique(selectedModuleIds, ["next.euromecc"]);
    pushUnique(reusableCapabilityIds, ["clone.euromecc-readonly"]);
    pushReason(
      reasoning,
      "Il prompt entra nel perimetro Euromecc e va letto tramite snapshot read-only dedicato del modulo nativo NEXT.",
    );
    pushConstraint(
      explicitConstraints,
      "Euromecc in IA interna resta strettamente read-only: nessuna scrittura o modifica alle collection dedicate del modulo.",
    );
    primaryActionIntent =
      primaryActionIntent ??
      buildActionIntentByHookId(
        "euromecc.main",
        "Il modulo target corretto per richieste sull'impianto Euromecc e la pagina nativa NEXT dedicata.",
        args.entityResolution,
        "clone.euromecc-readonly",
      );
  }

  if (/\b(cisterna|scheda test|impianto)\b/.test(prompt) || entityKinds.includes("cisterna")) {
    pushUnique(selectedAdapterIds, ["adapter.d09"]);
    pushUnique(selectedModuleIds, ["next.cisterna"]);
    pushReason(reasoning, "Il prompt chiama il verticale cisterna.");
    pushUnique(reusableCapabilityIds, ["legacy.cisterna-extraction"]);
    primaryActionIntent =
      primaryActionIntent ??
      buildActionIntentByHookId(
        "cisterna.ia",
        "Il verticale cisterna e leggibile, instradabile e agganciabile dal sistema universale.",
        args.entityResolution,
        "legacy.cisterna-extraction",
      );
  }

  if (!args.hasAttachments && requestKind !== "analisi_repo_flussi") {
    pushUnique(reusableCapabilityIds, ["backend.chat.controlled"]);
  }

  if (
    entityKinds.includes("targa") &&
    !/\b(riforniment|document|cost|preventiv|fornitor|magazzin|material|autist|cisterna)\b/.test(
      prompt,
    )
  ) {
    primaryActionIntent =
      primaryActionIntent ??
      buildActionIntentByHookId(
        "mezzi.main",
        "Per una richiesta mezzo-centrica il punto corretto nel clone e il modulo Mezzi con aggancio dossier gia predisposto.",
        args.entityResolution,
        "clone.vehicle-report-preview",
      );
  }

  if (/\b(libretto)\b/.test(prompt)) {
    primaryActionIntent =
      buildActionIntentByHookId(
        "ia.libretto",
        "Il prompt chiama in modo esplicito il flusso libretti del clone.",
        args.entityResolution,
        "clone.libretto-preview",
      ) ?? primaryActionIntent;
  }

  if (/\b(document|fattur|allegat)\b/.test(prompt) && !/\b(libretto)\b/.test(prompt)) {
    primaryActionIntent =
      buildActionIntentByHookId(
        "ia.documenti",
        "Il prompt chiede un flusso documentale del clone.",
        args.entityResolution,
        "clone.documents-preview",
      ) ?? primaryActionIntent;
  }

  const selectedAdapters = INTERNAL_AI_UNIVERSAL_ADAPTER_CONTRACTS.filter((adapter) =>
    selectedAdapterIds.includes(adapter.adapterId),
  );
  const adapterCapabilities = selectedAdapters.flatMap((adapter) => adapter.reusableCapabilityIds);
  const activeCapabilities = INTERNAL_AI_UNIVERSAL_AI_CAPABILITIES.filter((capability) =>
    [...reusableCapabilityIds, ...adapterCapabilities].includes(capability.capabilityId),
  );

  return {
    requestKind,
    priority,
    focusLabel,
    selectedModuleIds: dedupeIds(selectedModuleIds),
    selectedAdapterIds: dedupeIds(selectedAdapterIds),
    reusableCapabilityIds: dedupeIds(activeCapabilities.map((entry) => entry.capabilityId)),
    primaryActionIntent,
    reasoning,
    explicitConstraints,
  };
}
