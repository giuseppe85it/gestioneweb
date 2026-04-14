import {
  NEXT_AUTISTI_ADMIN_PATH,
  NEXT_AUTISTI_INBOX_PATH,
  NEXT_CISTERNA_IA_PATH,
  NEXT_INTERNAL_AI_REQUESTS_PATH,
  NEXT_IA_DOCUMENTI_PATH,
  NEXT_IA_LIBRETTO_PATH,
  NEXT_LIBRETTI_EXPORT_PATH,
  NEXT_MATERIALI_CONSEGNATI_PATH,
  NEXT_MEZZI_PATH,
  buildNextMagazzinoPath,
} from "../nextStructuralPaths";
import type { InternalAiChatAttachment } from "./internalAiTypes";
import {
  buildInternalAiLogicalDocumentAggregate,
  buildInternalAiAttachmentDocumentSignalText,
  buildInternalAiDocumentRowsJson,
  getInternalAiAttachmentDocumentRows,
  getInternalAiAttachmentPrimaryDocumentRow,
} from "./internalAiDocumentAnalysis";
import {
  INTERNAL_AI_UNIVERSAL_MODULES,
  INTERNAL_AI_UNIVERSAL_UI_HOOKS,
} from "./internalAiUniversalContracts";
import type {
  InternalAiUniversalActionIntent,
  InternalAiUniversalDocumentInboxItem,
  InternalAiUniversalDocumentRoute,
  InternalAiUniversalEntityMatch,
  InternalAiUniversalEntityRef,
  InternalAiUniversalEntityResolution,
  InternalAiUniversalHandoffPayload,
  InternalAiUniversalNormalizedValue,
  InternalAiUniversalRequestResolution,
} from "./internalAiUniversalTypes";
import { buildInitialInternalAiUniversalHandoffLifecycle } from "./internalAiUniversalHandoffLifecycle";

function normalizeText(value: string | null | undefined): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function isGenericEntityLabel(value: string | null | undefined): boolean {
  const normalized = normalizeText(value).toLowerCase();
  return (
    normalized.length === 0 ||
    [
      "fornitore",
      "materiale",
      "documento",
      "ordine",
      "targa",
      "mezzo",
      "dossier",
    ].includes(normalized)
  );
}

function formatEntityCandidateLabel(match: InternalAiUniversalEntityMatch): string | null {
  const label = match.matchedLabel ?? match.normalizedValue;
  if (isGenericEntityLabel(label)) {
    return null;
  }
  return `${match.entityKind}:${label}`;
}

function normalizeKey(value: string): string {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildHandoffId(seed: string): string {
  return `handoff-${normalizeKey(seed) || "universal"}`;
}

function formatScalarNumber(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function appendHandoffQuery(path: string, handoffId: string): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}iaHandoff=${encodeURIComponent(handoffId)}`;
}

function appendRouteQuery(
  path: string,
  entries: Record<string, InternalAiUniversalNormalizedValue | undefined>,
): string {
  const next = new URLSearchParams(path.includes("?") ? path.split("?")[1] : "");

  Object.entries(entries).forEach(([key, value]) => {
    const normalized = Array.isArray(value)
      ? value.map((entry) => normalizeText(entry)).filter(Boolean).join(", ")
      : typeof value === "number" || typeof value === "boolean"
        ? String(value)
        : normalizeText(value);
    if (!normalized) {
      return;
    }
    next.set(key, normalized);
  });

  const basePath = path.split("?")[0] ?? path;
  const serialized = next.toString();
  return serialized ? `${basePath}?${serialized}` : basePath;
}

function pickEntityMatch(
  matches: InternalAiUniversalEntityMatch[],
  preferredKinds: string[],
): InternalAiUniversalEntityMatch | null {
  for (const entityKind of preferredKinds) {
    const exact = matches.find(
      (entry) => entry.entityKind === entityKind && entry.status === "exact",
    );
    if (exact) {
      return exact;
    }

    const candidate = matches.find((entry) => entry.entityKind === entityKind);
    if (candidate) {
      return candidate;
    }
  }

  return matches[0] ?? null;
}

function toEntityRef(match: InternalAiUniversalEntityMatch | null): InternalAiUniversalEntityRef | null {
  if (!match) {
    return null;
  }

  return {
    entityKind: match.entityKind,
    matchedId: match.matchedId,
    label: match.matchedLabel ?? match.normalizedValue,
    normalizedValue: match.normalizedValue,
    lookupKey: match.lookupKey,
  };
}

function cleanRecord(
  input: Record<string, InternalAiUniversalNormalizedValue | undefined>,
): Record<string, InternalAiUniversalNormalizedValue> {
  const output: Record<string, InternalAiUniversalNormalizedValue> = {};

  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    if (Array.isArray(value) && value.length === 0) {
      return;
    }

    if (typeof value === "string" && value.trim().length === 0) {
      return;
    }

    output[key] = value;
  });

  return output;
}

function buildPayloadPreview(payload: InternalAiUniversalHandoffPayload): string[] {
  const prefillEntries = Object.entries(payload.prefillCanonico)
    .slice(0, 5)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`);

  return [
    `stato ${payload.statoRichiesta}`,
    `azione ${payload.azioneRichiesta}`,
    ...prefillEntries,
  ];
}

function finalizeHandoffPayload(
  payload: Omit<
    InternalAiUniversalHandoffPayload,
    | "routeTarget"
    | "statoConsumo"
    | "ultimoModuloConsumatore"
    | "ultimoPathConsumatore"
    | "ultimoAggiornamento"
    | "cronologiaConsumo"
  > & { routeTarget: string },
): InternalAiUniversalHandoffPayload {
  const decoratedRouteTarget = decorateRouteTarget(payload);
  return {
    ...payload,
    routeTarget: appendHandoffQuery(decoratedRouteTarget, payload.handoffId),
    ...buildInitialInternalAiUniversalHandoffLifecycle(),
  };
}

function decorateRouteTarget(
  payload: Omit<
    InternalAiUniversalHandoffPayload,
    | "routeTarget"
    | "statoConsumo"
    | "ultimoModuloConsumatore"
    | "ultimoPathConsumatore"
    | "ultimoAggiornamento"
    | "cronologiaConsumo"
  > & { routeTarget: string },
): string {
  if (payload.moduloTarget === "next.dossier") {
    return appendRouteQuery(NEXT_MEZZI_PATH, {
      targa: payload.entityRef?.entityKind === "targa" ? payload.entityRef.normalizedValue : null,
      mezzoId: payload.entityRef?.matchedId,
      highlightMissing: payload.campiDaVerificare.length ? "1" : null,
    });
  }

  if (payload.moduloTarget === "next.procurement") {
    return appendRouteQuery(payload.routeTarget, {
      fornitore: payload.prefillCanonico.fornitore,
      materiale: payload.prefillCanonico.materiale,
      documentoNome: payload.prefillCanonico.documentoNome,
      orderId:
        payload.entityRef?.entityKind === "ordine"
          ? payload.entityRef.matchedId ?? payload.entityRef.normalizedValue
          : null,
    });
  }

  if (payload.moduloTarget === "next.magazzino") {
    return appendRouteQuery(payload.routeTarget, {
      queryMateriale: payload.prefillCanonico.queryMateriale ?? payload.prefillCanonico.materiale,
      targa:
        payload.entityRef?.entityKind === "targa" ? payload.entityRef.normalizedValue : null,
      documentoNome: payload.prefillCanonico.documentoNome,
    });
  }

  if (payload.moduloTarget === "next.ia_hub") {
    const isLibretto = payload.documentType === "libretto_mezzo";
    return appendRouteQuery(payload.routeTarget, {
      targa:
        payload.entityRef?.entityKind === "targa" || payload.entityRef?.entityKind === "mezzo"
          ? payload.entityRef.normalizedValue
          : null,
      archive: isLibretto ? "1" : null,
      documentoNome: payload.prefillCanonico.documentoNome,
    });
  }

  if (payload.moduloTarget === "next.libretti_export") {
    return appendRouteQuery(payload.routeTarget, {
      targa:
        payload.entityRef?.entityKind === "targa" || payload.entityRef?.entityKind === "mezzo"
          ? payload.entityRef.normalizedValue
          : null,
    });
  }

  if (payload.moduloTarget === "next.cisterna") {
    return appendRouteQuery(payload.routeTarget, {
      targa:
        payload.entityRef?.entityKind === "targa" || payload.entityRef?.entityKind === "cisterna"
          ? payload.entityRef.normalizedValue
          : null,
      documentoNome: payload.prefillCanonico.documentoNome,
    });
  }

  if (payload.moduloTarget === "next.autisti") {
    const basePath =
      payload.routeTarget.includes(NEXT_AUTISTI_INBOX_PATH) ? NEXT_AUTISTI_INBOX_PATH : NEXT_AUTISTI_ADMIN_PATH;
    return appendRouteQuery(basePath, {
      badge:
        payload.entityRef?.entityKind === "badge"
          ? payload.entityRef.normalizedValue
          : payload.entityRef?.lookupKey === "badge"
            ? payload.entityRef.normalizedValue
            : null,
      autista:
        payload.entityRef?.entityKind === "autista" || payload.entityRef?.entityKind === "badge"
          ? payload.entityRef.label
          : null,
      targa:
        payload.entityRef?.entityKind === "targa" ? payload.entityRef.normalizedValue : null,
    });
  }

  return payload.routeTarget;
}

function buildActionIntentFromHandoff(
  payload: InternalAiUniversalHandoffPayload,
  label: string,
): InternalAiUniversalActionIntent {
  const routePath = payload.routeTarget.split("?")[0] ?? payload.routeTarget;
  const hook =
    INTERNAL_AI_UNIVERSAL_UI_HOOKS.find((entry) => {
      const hookPath = entry.path.split("/:")[0];
      return routePath === entry.path || routePath.startsWith(hookPath);
    }) ?? null;

  return {
    type:
      payload.statoRichiesta === "inbox_documentale"
        ? "route_to_inbox"
        : payload.azioneRichiesta === "apri_modulo_con_prefill"
          ? "prepare_preview"
          : "open_route",
    label,
    moduleId: payload.moduloTarget,
    path: payload.routeTarget,
    hookId: hook?.hookId ?? null,
    capabilityId: payload.capabilityRiutilizzata,
    reason: payload.motivoInstradamento,
    payloadPreview: buildPayloadPreview(payload),
    handoff: payload,
  };
}

function extractSupplierConstraint(prompt: string): string | null {
  const match = prompt.match(/\bfornitore\s+([^,.;:\n]+)/i);
  return match?.[1] ? normalizeText(match[1]) : null;
}

function buildWarehouseDocumentHaystack(args: {
  prompt: string;
  attachment: InternalAiChatAttachment;
}): string {
  return normalizeText(
    [
      args.prompt,
      args.attachment.fileName,
      args.attachment.textExcerpt,
      buildInternalAiAttachmentDocumentSignalText(args.attachment),
    ].join(" "),
  )
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function detectWarehouseInvoiceDocument(args: {
  prompt: string;
  attachment: InternalAiChatAttachment;
}): {
  warehouseInvoice: boolean;
  adBlueInvoice: boolean;
} {
  const haystack = buildWarehouseDocumentHaystack(args);
  const documentType = normalizeText(args.attachment.documentAnalysis?.tipoDocumento).toLowerCase();
  const extractedRows = getInternalAiAttachmentDocumentRows(args.attachment);
  const hasWarehouseSignal =
    extractedRows.length > 0 ||
    /\b(material\w*|articol\w*|qta|quantita|magazzin\w*|adblue|mariba|ricamb\w*|ferrament\w*|vernic\w*|bullon\w*|consumabil\w*)\b/.test(
      haystack,
    );
  const hasInvoiceSignal =
    documentType === "fattura" ||
    documentType === "ddt" ||
    /\b(fattur\w*|ddt|bolla\w*|imponibil\w*|iva|total\w*|fornitor\w*|arriv\w*)\b/.test(
      haystack,
    );
  return (
    {
      warehouseInvoice: hasWarehouseSignal && hasInvoiceSignal,
      adBlueInvoice: hasWarehouseSignal && hasInvoiceSignal && /\badblue\b/.test(haystack),
    }
  );
}

function buildBaseDocumentData(args: {
  prompt: string;
  attachment: InternalAiChatAttachment;
  entityResolution: InternalAiUniversalEntityResolution;
  route: InternalAiUniversalDocumentRoute;
}) {
  const supplierConstraint = extractSupplierConstraint(args.prompt);
  const entityLabels = args.entityResolution.matches
    .slice(0, 5)
    .map((entry) => formatEntityCandidateLabel(entry))
    .filter((entry): entry is string => Boolean(entry));
  const analysis = args.attachment.documentAnalysis;
  const rows = getInternalAiAttachmentDocumentRows(args.attachment);
  const primaryRow = getInternalAiAttachmentPrimaryDocumentRow(args.attachment);
  const rowDescriptions = rows
    .map((row) => row.descrizione)
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, 8);
  const articleCodes = rows
    .map((row) => row.codiceArticolo)
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, 8);
  const notes = analysis?.noteImportanti?.slice(0, 6) ?? [];

  return {
    supplierConstraint,
    entityLabels,
    normalizedData: cleanRecord({
      fileName: args.attachment.fileName,
      attachmentKind: args.attachment.kind,
      promptConstraintFornitore: supplierConstraint,
      textExcerpt:
        analysis?.testoEstrattoBreve
          ? normalizeText(analysis.testoEstrattoBreve).slice(0, 240)
          : args.attachment.textExcerpt
            ? normalizeText(args.attachment.textExcerpt).slice(0, 240)
            : null,
      entityCandidates: entityLabels,
      documentClassification: args.route.classification,
      tipoDocumento: analysis?.tipoDocumento ?? null,
      fornitore: analysis?.fornitore ?? null,
      numeroDocumento: analysis?.numeroDocumento ?? null,
      dataDocumento: analysis?.dataDocumento ?? null,
      destinatario: analysis?.destinatario ?? null,
      valuta: analysis?.valuta ?? null,
      imponibile: formatScalarNumber(analysis?.imponibile),
      ivaImporto: formatScalarNumber(analysis?.ivaImporto),
      ivaPercentuale: analysis?.ivaPercentuale ?? null,
      totaleDocumento: formatScalarNumber(analysis?.totaleDocumento),
      noteImportanti: notes,
      righeMaterialiCount: rows.length || null,
      righeMaterialiJson: buildInternalAiDocumentRowsJson(rows),
      materialiEstratti: rowDescriptions,
      codiciArticolo: articleCodes,
      materiale: primaryRow?.descrizione ?? null,
      descrizione: primaryRow?.descrizione ?? null,
      quantita: formatScalarNumber(primaryRow?.quantita),
      unita: primaryRow?.unita ?? null,
      prezzoUnitario: formatScalarNumber(primaryRow?.prezzoUnitario),
      totaleRiga: formatScalarNumber(primaryRow?.totaleRiga),
      extractionStatus: analysis?.stato ?? null,
      extractionSource: analysis?.tipoSorgente ?? null,
    }),
  };
}

function getModuleLabel(moduleId: string): string {
  return (
    INTERNAL_AI_UNIVERSAL_MODULES.find((entry) => entry.moduleId === moduleId)?.label ?? moduleId
  );
}

function buildDocumentHandoffPayload(args: {
  prompt: string;
  attachment: InternalAiChatAttachment;
  entityResolution: InternalAiUniversalEntityResolution;
  requestResolution: InternalAiUniversalRequestResolution;
  route: InternalAiUniversalDocumentRoute;
}): InternalAiUniversalHandoffPayload {
  const base = buildBaseDocumentData(args);
  const analysis = args.attachment.documentAnalysis;
  const extractedRows = getInternalAiAttachmentDocumentRows(args.attachment);
  const primaryRow = getInternalAiAttachmentPrimaryDocumentRow(args.attachment);
  const targaRef = toEntityRef(
    pickEntityMatch(args.entityResolution.matches, ["targa", "mezzo", "dossier"]),
  );
  const supplierRef = toEntityRef(
    pickEntityMatch(args.entityResolution.matches, ["fornitore"]),
  );
  const materialRef = toEntityRef(
    pickEntityMatch(args.entityResolution.matches, ["materiale"]),
  );
  const driverRef = toEntityRef(
    pickEntityMatch(args.entityResolution.matches, ["autista", "badge"]),
  );
  const cisternaRef = toEntityRef(
    pickEntityMatch(args.entityResolution.matches, ["cisterna", "targa"]),
  );
  const safeTargaValue =
    targaRef && /\b[a-z]{2}\d{3}[a-z]{2}\b/i.test(targaRef.normalizedValue)
      ? targaRef.normalizedValue
      : null;
  const safeSupplierLabel =
    supplierRef && !/^(fornitore|documento|materiale)$/i.test(supplierRef.label)
      ? supplierRef.label
      : null;
  const safeMaterialLabel =
    materialRef &&
    !/^(targa|mezzo|dossier|fornitore|ordine|materiale|documento)$/i.test(materialRef.label)
      ? materialRef.label
      : null;
  const extractedSupplier = analysis?.fornitore ?? null;
  const extractedMaterialLabel = primaryRow?.descrizione ?? extractedRows[0]?.descrizione ?? null;

  switch (args.route.classification) {
    case "libretto_mezzo": {
      const campiMancanti = targaRef ? [] : ["targa"];
      return finalizeHandoffPayload({
        handoffId: buildHandoffId(`${args.attachment.id}-libretto`),
        attachmentId: args.attachment.id,
        moduloTarget: "next.ia_hub",
        routeTarget: NEXT_IA_LIBRETTO_PATH,
        tipoEntita: targaRef?.entityKind ?? "nessuna",
        entityRef: targaRef,
        documentType: "libretto_mezzo",
        datiEstrattiNormalizzati: base.normalizedData,
        prefillCanonico: cleanRecord({
          flusso: "libretto_mezzo",
          targa: targaRef?.normalizedValue ?? null,
          documentoNome: args.attachment.fileName,
          routeSecondaria: NEXT_LIBRETTI_EXPORT_PATH,
          vistaTarget: "libretto",
        }),
        confidence: targaRef ? "alta" : "media",
        statoRichiesta: targaRef ? "pronto_prefill" : "da_verificare",
        motivoInstradamento: "Il file e riconosciuto come libretto e va aperto nel flusso libretti del clone.",
        capabilityRiutilizzata: "clone.libretto-preview",
        azioneRichiesta: "apri_modulo_con_prefill",
        campiMancanti,
        campiDaVerificare: campiMancanti,
        adapterCoinvolti: ["adapter.d01", "adapter.d07d08"],
      });
    }
    case "preventivo_fornitore": {
      const entityRef = supplierRef ?? targaRef;
      const campiMancanti = supplierRef ? [] : ["fornitore"];
      return finalizeHandoffPayload({
        handoffId: buildHandoffId(`${args.attachment.id}-procurement`),
        attachmentId: args.attachment.id,
        moduloTarget: "next.procurement",
        routeTarget: args.route.targetPath,
        tipoEntita: entityRef?.entityKind ?? "nessuna",
        entityRef,
        documentType: "preventivo_fornitore",
        datiEstrattiNormalizzati: base.normalizedData,
        prefillCanonico: cleanRecord({
          flusso: "procurement_preventivi",
          fornitore: safeSupplierLabel ?? extractedSupplier ?? base.supplierConstraint ?? null,
          materiale: safeMaterialLabel ?? extractedMaterialLabel,
          targa: targaRef?.normalizedValue ?? null,
          documentoNome: args.attachment.fileName,
          vistaTarget: "acquisti",
          tabTarget: "ordini",
        }),
        confidence: safeSupplierLabel || extractedSupplier || base.supplierConstraint ? "alta" : "media",
        statoRichiesta:
          safeSupplierLabel || extractedSupplier || base.supplierConstraint || extractedRows.length > 0
            ? "pronto_prefill"
            : "da_verificare",
        motivoInstradamento:
          "Il file e classificato come preventivo fornitore e va agganciato al procurement con vincolo forte sul fornitore quando disponibile.",
        capabilityRiutilizzata: "clone.preventivi-preview",
        azioneRichiesta: "apri_modulo_con_prefill",
        campiMancanti,
        campiDaVerificare: campiMancanti,
        adapterCoinvolti: ["adapter.d06"],
      });
    }
    case "documento_cisterna": {
      const campiMancanti = cisternaRef ? [] : ["targa_o_riferimento_cisterna"];
      return finalizeHandoffPayload({
        handoffId: buildHandoffId(`${args.attachment.id}-cisterna`),
        attachmentId: args.attachment.id,
        moduloTarget: "next.cisterna",
        routeTarget: NEXT_CISTERNA_IA_PATH,
        tipoEntita: cisternaRef?.entityKind ?? "nessuna",
        entityRef: cisternaRef,
        documentType: "documento_cisterna",
        datiEstrattiNormalizzati: base.normalizedData,
        prefillCanonico: cleanRecord({
          flusso: "cisterna_documenti",
          targa: cisternaRef?.normalizedValue ?? null,
          documentoNome: args.attachment.fileName,
          vistaTarget: "cisterna_ia",
        }),
        confidence: cisternaRef ? "media" : "prudente",
        statoRichiesta: cisternaRef ? "pronto_prefill" : "da_verificare",
        motivoInstradamento:
          "Il file richiama il verticale cisterna e viene instradato al flusso specialistico corretto.",
        capabilityRiutilizzata: "legacy.cisterna-extraction",
        azioneRichiesta: "apri_modulo_con_prefill",
        campiMancanti,
        campiDaVerificare: campiMancanti,
        adapterCoinvolti: ["adapter.d09"],
      });
    }
    case "tabella_materiali": {
      const warehouseInvoiceDetection = detectWarehouseInvoiceDocument({
        prompt: args.prompt,
        attachment: args.attachment,
      });
      const warehouseInvoice = warehouseInvoiceDetection.warehouseInvoice;
      const adBlueInvoice = warehouseInvoiceDetection.adBlueInvoice;
      const routeTarget = warehouseInvoice
        ? buildNextMagazzinoPath("documenti-costi")
        : buildNextMagazzinoPath("inventario");
      const inferredMaterialLabel = adBlueInvoice ? "AdBlue" : null;
      const campiDaVerificare = [
        ...(args.route.status === "da_verificare" ? ["classificazione_documento"] : []),
        ...(extractedRows.length === 0 ? ["righe"] : []),
      ];
      return finalizeHandoffPayload({
        handoffId: buildHandoffId(`${args.attachment.id}-materiali`),
        attachmentId: args.attachment.id,
        moduloTarget: "next.magazzino",
        routeTarget,
        tipoEntita: materialRef?.entityKind ?? "nessuna",
        entityRef: materialRef,
        documentType: "tabella_materiali",
        datiEstrattiNormalizzati: base.normalizedData,
        prefillCanonico: cleanRecord({
          flusso: warehouseInvoice ? "fatture_magazzino" : "inventario_materiali",
          queryMateriale: safeMaterialLabel ?? extractedMaterialLabel ?? inferredMaterialLabel,
          materiale: safeMaterialLabel ?? extractedMaterialLabel ?? inferredMaterialLabel,
          fornitore: safeSupplierLabel ?? extractedSupplier ?? base.supplierConstraint ?? null,
          quantita: formatScalarNumber(primaryRow?.quantita),
          unita: primaryRow?.unita ?? null,
          prezzoUnitario: formatScalarNumber(primaryRow?.prezzoUnitario),
          totaleRiga: formatScalarNumber(primaryRow?.totaleRiga),
          targa: safeTargaValue,
          documentoNome: args.attachment.fileName,
          prompt: args.prompt,
          vistaTarget: warehouseInvoice ? "documenti-costi" : "inventario",
          warehouseInvoiceHint: warehouseInvoice ? "1" : null,
          warehouseInvoiceMode: adBlueInvoice
            ? "carica_stock_adblue"
            : warehouseInvoice
              ? "riconcilia_o_verifica"
              : null,
        }),
        confidence:
          warehouseInvoice &&
          (materialRef || safeSupplierLabel || extractedSupplier || base.supplierConstraint || extractedRows.length > 0)
            ? "alta"
            : args.route.status === "da_verificare"
              ? "prudente"
            : materialRef || extractedRows.length > 0
              ? "media"
              : "prudente",
        statoRichiesta:
          args.route.status === "da_verificare" || extractedRows.length === 0
            ? "da_verificare"
            : "pronto_prefill",
        motivoInstradamento:
          warehouseInvoice
            ? "La fattura materiali viene instradata alla vista documenti e costi di Magazzino per la decisione controllata tra riconciliazione senza carico e carico stock AdBlue."
            : "La tabella materiali viene instradata al modulo Magazzino canonico con prefill uniforme del clone.",
        capabilityRiutilizzata: null,
        azioneRichiesta: "apri_modulo_con_prefill",
        campiMancanti: [],
        campiDaVerificare,
        adapterCoinvolti: ["adapter.d05"],
      });
    }
    case "documento_mezzo": {
      const campiDaVerificare = targaRef ? [] : ["targa"];
      return finalizeHandoffPayload({
        handoffId: buildHandoffId(`${args.attachment.id}-documenti`),
        attachmentId: args.attachment.id,
        moduloTarget: "next.ia_hub",
        routeTarget: NEXT_IA_DOCUMENTI_PATH,
        tipoEntita: targaRef?.entityKind ?? "nessuna",
        entityRef: targaRef,
        documentType: "documento_mezzo",
        datiEstrattiNormalizzati: base.normalizedData,
        prefillCanonico: cleanRecord({
          flusso: "documenti_mezzo",
          targa: targaRef?.normalizedValue ?? null,
          documentoNome: args.attachment.fileName,
          vistaTarget: "documenti",
        }),
        confidence: targaRef ? "media" : "prudente",
        statoRichiesta: targaRef ? "pronto_prefill" : "da_verificare",
        motivoInstradamento:
          "Il documento ha contesto mezzo sufficientemente forte per il flusso documentale del clone.",
        capabilityRiutilizzata: "clone.documents-preview",
        azioneRichiesta: "apri_modulo_con_prefill",
        campiMancanti: [],
        campiDaVerificare,
        adapterCoinvolti: ["adapter.d07d08"],
      });
    }
    case "testo_operativo": {
      return finalizeHandoffPayload({
        handoffId: buildHandoffId(`${args.attachment.id}-testo-operativo`),
        attachmentId: args.attachment.id,
        moduloTarget: "next.ia_interna",
        routeTarget: args.route.targetPath,
        tipoEntita: driverRef?.entityKind ?? targaRef?.entityKind ?? "nessuna",
        entityRef: driverRef ?? targaRef,
        documentType: "testo_operativo",
        datiEstrattiNormalizzati: base.normalizedData,
        prefillCanonico: cleanRecord({
          flusso: "chat_universale",
          prompt: normalizeText(args.prompt).slice(0, 240),
        }),
        confidence: "prudente",
        statoRichiesta: "solo_risposta",
        motivoInstradamento:
          "Il testo allegato resta nel perimetro della chat universale finche non emerge un modulo target piu forte.",
        capabilityRiutilizzata: "backend.chat.controlled",
        azioneRichiesta: "continua_in_chat",
        campiMancanti: [],
        campiDaVerificare: [],
        adapterCoinvolti: args.requestResolution.selectedAdapterIds,
      });
    }
    case "immagine_generica":
    case "documento_ambiguo":
    default: {
      return finalizeHandoffPayload({
        handoffId: buildHandoffId(`${args.attachment.id}-inbox`),
        attachmentId: args.attachment.id,
        moduloTarget: "next.ia_interna",
        routeTarget: NEXT_INTERNAL_AI_REQUESTS_PATH,
        tipoEntita: "nessuna",
        entityRef: null,
        documentType: args.route.classification,
        datiEstrattiNormalizzati: base.normalizedData,
        prefillCanonico: cleanRecord({
          flusso: "inbox_documentale_universale",
          suggerimentoModulo: getModuleLabel(args.route.targetModuleId),
          prompt: normalizeText(args.prompt).slice(0, 240),
        }),
        confidence: args.route.confidence,
        statoRichiesta: "inbox_documentale",
        motivoInstradamento:
          "Il documento non ha abbastanza segnali per un invio sicuro e viene mantenuto nella inbox documentale universale.",
        capabilityRiutilizzata: "backend.chat.controlled",
        azioneRichiesta: "apri_inbox_documentale",
        campiMancanti: [],
        campiDaVerificare: ["modulo_target_definitivo", "classificazione_finale"],
        adapterCoinvolti: args.requestResolution.selectedAdapterIds,
      });
    }
  }
}

function buildSecondaryLibrettiExportHandoff(
  payload: InternalAiUniversalHandoffPayload,
): InternalAiUniversalHandoffPayload | null {
  if (payload.documentType !== "libretto_mezzo" || !payload.entityRef?.normalizedValue) {
    return null;
  }

  return finalizeHandoffPayload({
    handoffId: `${payload.handoffId}-export`,
    attachmentId: payload.attachmentId,
    moduloTarget: "next.libretti_export",
    routeTarget: NEXT_LIBRETTI_EXPORT_PATH,
    tipoEntita: payload.entityRef.entityKind,
    entityRef: payload.entityRef,
    documentType: payload.documentType,
    datiEstrattiNormalizzati: payload.datiEstrattiNormalizzati,
    prefillCanonico: cleanRecord({
      flusso: "libretti_export",
      targa: payload.entityRef.normalizedValue,
      origine: "handoff_libretto_universale",
    }),
    confidence: payload.confidence,
    statoRichiesta: "pronto_prefill",
    motivoInstradamento: "Il libretto puo essere aperto anche nel flusso export PDF dedicato del clone.",
    capabilityRiutilizzata: payload.capabilityRiutilizzata,
    azioneRichiesta: "apri_modulo_con_prefill",
    campiMancanti: [],
    campiDaVerificare: [],
    adapterCoinvolti: payload.adapterCoinvolti,
  });
}

function buildRequestHandoffPayload(args: {
  prompt: string;
  entityResolution: InternalAiUniversalEntityResolution;
  requestResolution: InternalAiUniversalRequestResolution;
}): InternalAiUniversalHandoffPayload | null {
  const primaryAction = args.requestResolution.primaryActionIntent;
  if (!primaryAction) {
    return null;
  }

  const preferredEntity = toEntityRef(
    pickEntityMatch(args.entityResolution.matches, [
      "targa",
      "autista",
      "badge",
      "cisterna",
      "materiale",
      "fornitore",
      "ordine",
    ]),
  );
  const preferredMatch =
    preferredEntity
      ? args.entityResolution.matches.find(
          (entry) =>
            entry.entityKind === preferredEntity.entityKind &&
            entry.normalizedValue === preferredEntity.normalizedValue &&
            entry.matchedId === preferredEntity.matchedId,
        ) ?? null
      : null;

  const useMaterialsRoute =
    (primaryAction.moduleId === "next.operativita" ||
      primaryAction.moduleId === "next.magazzino") &&
    /\b(moviment|consegnat)\b/i.test(args.prompt);

  const routeTarget = useMaterialsRoute
    ? primaryAction.moduleId === "next.magazzino"
      ? buildNextMagazzinoPath("materiali-consegnati")
      : NEXT_MATERIALI_CONSEGNATI_PATH
    : primaryAction.path;

  const moduleTarget = primaryAction.moduleId;
  const campiDaVerificare =
    preferredEntity || primaryAction.moduleId === "next.ia_interna" ? [] : ["entita_principale"];

  const azioneRichiesta =
    primaryAction.moduleId === "next.ia_interna"
      ? "continua_in_chat"
      : Object.keys(cleanRecord({
          targa: preferredEntity?.entityKind === "targa" ? preferredEntity.normalizedValue : null,
          autista:
            preferredEntity?.entityKind === "autista" || preferredEntity?.entityKind === "badge"
              ? preferredEntity.label
              : null,
          materiale: preferredEntity?.entityKind === "materiale" ? preferredEntity.label : null,
          fornitore: preferredEntity?.entityKind === "fornitore" ? preferredEntity.label : null,
          cisterna: preferredEntity?.entityKind === "cisterna" ? preferredEntity.label : null,
        })).length > 0
        ? "apri_modulo_con_prefill"
        : "apri_modulo";

  return finalizeHandoffPayload({
    handoffId: buildHandoffId(
      `${moduleTarget}-${preferredEntity?.normalizedValue ?? normalizeText(args.prompt).slice(0, 40)}`,
    ),
    attachmentId: null,
    moduloTarget: moduleTarget,
    routeTarget,
    tipoEntita: preferredEntity?.entityKind ?? "nessuna",
    entityRef: preferredEntity,
    documentType: "richiesta_testuale",
    datiEstrattiNormalizzati: cleanRecord({
      prompt: normalizeText(args.prompt).slice(0, 240),
      focus: args.requestResolution.focusLabel,
      adapterCoinvolti: args.requestResolution.selectedAdapterIds,
      vincoliForti: args.requestResolution.explicitConstraints,
    }),
    prefillCanonico: cleanRecord({
      targa: preferredEntity?.entityKind === "targa" ? preferredEntity.normalizedValue : null,
      autista:
        preferredEntity?.entityKind === "autista" || preferredEntity?.entityKind === "badge"
          ? preferredEntity.label
          : null,
      badge:
        preferredEntity?.entityKind === "badge"
          ? preferredEntity.normalizedValue
          : preferredEntity?.lookupKey === "badge"
            ? preferredEntity.normalizedValue
            : null,
      materiale: preferredEntity?.entityKind === "materiale" ? preferredEntity.label : null,
      fornitore: preferredEntity?.entityKind === "fornitore" ? preferredEntity.label : null,
      cisterna: preferredEntity?.entityKind === "cisterna" ? preferredEntity.label : null,
      vistaTarget: getModuleLabel(moduleTarget),
    }),
    confidence: preferredMatch?.confidence ?? "media",
    statoRichiesta: campiDaVerificare.length ? "da_verificare" : "pronto_handoff",
    motivoInstradamento: primaryAction.reason,
    capabilityRiutilizzata: primaryAction.capabilityId,
    azioneRichiesta,
    campiMancanti: [],
    campiDaVerificare,
    adapterCoinvolti: args.requestResolution.selectedAdapterIds,
  });
}

function dedupeHandoffs(
  handoffs: InternalAiUniversalHandoffPayload[],
): InternalAiUniversalHandoffPayload[] {
  const seen = new Set<string>();
  return handoffs.filter((entry) => {
    if (seen.has(entry.handoffId)) {
      return false;
    }
    seen.add(entry.handoffId);
    return true;
  });
}

function dedupeDefinedStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function applyLogicalDocumentMetadataToPayload(args: {
  payload: InternalAiUniversalHandoffPayload;
  attachmentCount: number;
  fileNames: string[];
  conflictFields: string[];
}): InternalAiUniversalHandoffPayload {
  if (args.attachmentCount <= 1) {
    return args.payload;
  }

  return finalizeHandoffPayload({
    ...args.payload,
    datiEstrattiNormalizzati: cleanRecord({
      ...args.payload.datiEstrattiNormalizzati,
      documentoLogicoUnico: "1",
      allegatiDocumentoLogicoCount: String(args.attachmentCount),
      allegatiDocumentoLogicoNomi: args.fileNames.slice(0, 6),
      campiDocumentoLogicoDaVerificare: args.conflictFields,
    }),
    prefillCanonico: cleanRecord({
      ...args.payload.prefillCanonico,
      documentoLogicoUnico: "1",
      allegatiDocumentoLogicoCount: String(args.attachmentCount),
    }),
    campiDaVerificare: dedupeDefinedStrings([
      ...args.payload.campiDaVerificare,
      ...args.conflictFields,
    ]),
  });
}

export function buildInternalAiUniversalHandoffs(args: {
  prompt: string;
  attachments: InternalAiChatAttachment[];
  entityResolution: InternalAiUniversalEntityResolution;
  requestResolution: InternalAiUniversalRequestResolution;
  documentRoutes: InternalAiUniversalDocumentRoute[];
  treatAttachmentsAsSingleDocument?: boolean;
}): {
  handoffPayloads: InternalAiUniversalHandoffPayload[];
  actionIntents: InternalAiUniversalActionIntent[];
  documentInboxItems: InternalAiUniversalDocumentInboxItem[];
} {
  const attachmentMap = new Map(args.attachments.map((entry) => [entry.id, entry]));
  const logicalDocumentAggregate =
    Boolean(args.treatAttachmentsAsSingleDocument) && args.attachments.length > 1
      ? buildInternalAiLogicalDocumentAggregate(args.attachments)
      : null;
  const documentEntries = args.documentRoutes.flatMap((route) => {
    const attachment = attachmentMap.get(route.attachmentId);
    if (!attachment) {
      return [];
    }

    const sourceAttachment =
      logicalDocumentAggregate?.documentAnalysis || logicalDocumentAggregate?.textExcerpt
        ? {
            ...attachment,
            textExcerpt: logicalDocumentAggregate.textExcerpt ?? attachment.textExcerpt,
            documentAnalysis:
              logicalDocumentAggregate.documentAnalysis ?? attachment.documentAnalysis,
          }
        : attachment;

    const primaryPayloadBase = buildDocumentHandoffPayload({
      prompt: args.prompt,
      attachment: sourceAttachment,
      entityResolution: args.entityResolution,
      requestResolution: args.requestResolution,
      route,
    });
    const primaryPayload = logicalDocumentAggregate
      ? applyLogicalDocumentMetadataToPayload({
          payload: primaryPayloadBase,
          attachmentCount: logicalDocumentAggregate.attachmentCount,
          fileNames: logicalDocumentAggregate.fileNames,
          conflictFields: logicalDocumentAggregate.conflictFields,
        })
      : primaryPayloadBase;
    const extraLibretti = buildSecondaryLibrettiExportHandoff(primaryPayload);
    return [
      {
        route,
        primaryPayload,
        payloads: extraLibretti ? [primaryPayload, extraLibretti] : [primaryPayload],
      },
    ];
  });

  const requestHandoff = buildRequestHandoffPayload({
    prompt: args.prompt,
    entityResolution: args.entityResolution,
    requestResolution: args.requestResolution,
  });

  const handoffPayloads = dedupeHandoffs([
    ...documentEntries.flatMap((entry) => entry.payloads),
    ...(requestHandoff ? [requestHandoff] : []),
  ]);

  const actionIntents = handoffPayloads.map((payload) =>
    buildActionIntentFromHandoff(
      payload,
      payload.statoRichiesta === "inbox_documentale"
        ? "Apri inbox documentale universale"
        : `Apri ${getModuleLabel(payload.moduloTarget)}`,
    ),
  );

  const documentInboxItems = documentEntries.flatMap((entry) => {
    const payload = entry.primaryPayload;
    if (!["inbox_documentale", "da_verificare"].includes(payload.statoRichiesta)) {
      return [];
    }

    return [
      {
        inboxId: `inbox-${entry.route.attachmentId}`,
        attachmentId: entry.route.attachmentId,
        fileName: entry.route.fileName,
        classification: entry.route.classification,
        motivoClassificazione: entry.route.rationale,
        suggestedModuleId:
          payload.statoRichiesta === "inbox_documentale"
            ? entry.route.targetModuleId
            : payload.moduloTarget,
        suggestedModuleLabel:
          payload.statoRichiesta === "inbox_documentale"
            ? entry.route.suggestedModuleLabel
            : getModuleLabel(payload.moduloTarget),
        suggestedPath: payload.routeTarget,
        entityCandidateLabels: args.entityResolution.matches
          .slice(0, 4)
          .map((entry) => formatEntityCandidateLabel(entry))
          .filter((entry): entry is string => Boolean(entry)),
        status: payload.statoRichiesta,
        azioniPossibili: actionIntents.filter(
          (actionIntent) =>
            actionIntent.handoff?.handoffId === payload.handoffId ||
            actionIntent.handoff?.documentType === entry.route.classification,
        ),
        handoffPayload: payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  });

  return {
    handoffPayloads,
    actionIntents,
    documentInboxItems,
  };
}
