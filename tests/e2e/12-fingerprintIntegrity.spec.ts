import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  buildFingerprintFallbackFinalMessage,
  enrichToolResultsFingerprints,
  validateFingerprints,
} from "../../backend/internal-ai/server/lib/fingerprint-validator.js";
import {
  buildCatalogErrorMessage,
  validateChatZeroInvenzioniMessage,
} from "../../backend/internal-ai/server/lib/catalog-validator.js";

test("validator accetta solo fingerprint reali ritornati dai tool", () => {
  const toolResults = enrichToolResultsFingerprints([
    {
      toolCallId: "call-1",
      name: "get_refuelings",
      ok: true,
      data: {
        items: [
          {
            id: "real-refueling-1",
            data_italiana: "14/04/2026",
            litri: 100,
            targa: "TI324633",
          },
        ],
      },
    },
  ]);

  const validResponse = {
    text: "Rifornimento reale.",
    status: "completed",
    blocks: [
      {
        kind: "data_table_styled",
        table: {
          title: "Rifornimenti",
          columns: [{ key: "c1", label: "Data", align: "left" }],
          rows: [{ _id: "real-refueling-1", c1: "14/04/2026", c2: null, c3: null, c4: null, c5: null, c6: null, c7: null, c8: null }],
          emptyText: "Nessun dato.",
          accentKey: "c1",
          rowActions: [],
        },
      },
    ],
    entities: [],
    sources: [],
    notices: [],
  };

  expect(validateFingerprints(validResponse, toolResults, { prompt: "dettaglio rifornimenti" }).valid).toBe(true);

  const invalidIdResponse = structuredClone(validResponse);
  invalidIdResponse.blocks[0].table.rows[0]._id = "invented-refueling";
  const invalidIdValidation = validateFingerprints(invalidIdResponse, toolResults, { prompt: "dettaglio rifornimenti" });
  expect(invalidIdValidation.valid).toBe(false);
  expect(invalidIdValidation.invalidIds).toContain("invented-refueling");

  const invalidDateResponse = structuredClone(validResponse);
  invalidDateResponse.blocks[0].table.rows[0].c1 = "30/04/2026";
  const invalidDateValidation = validateFingerprints(invalidDateResponse, toolResults, { prompt: "dettaglio rifornimenti" });
  expect(invalidDateValidation.valid).toBe(false);
  expect(invalidDateValidation.invalidDateClaims[0]?.date).toBe("30/04/2026");
});

test("fallback anti-allucinazione restituisce solo dati raw verificati", () => {
  const toolResults = enrichToolResultsFingerprints([
    {
      toolCallId: "call-1",
      name: "get_refuelings",
      ok: true,
      data: {
        items: [
          {
            id: "real-refueling-1",
            data_italiana: "14/04/2026",
            litri: 100,
            targa: "TI324633",
          },
        ],
      },
    },
  ]);
  const invalidValidation = {
    valid: false,
    invalidIds: ["invented-refueling"],
    invalidDateClaims: [],
    missingFingerprintLocations: [],
    missingResponseFingerprints: false,
    totalResponseIds: 1,
    totalValidIds: 1,
    recordLocations: [],
  };
  const fallback = buildFingerprintFallbackFinalMessage(toolResults, invalidValidation);
  expect(fallback.status).toBe("partial");
  expect(JSON.stringify(fallback)).toContain("real-refueling-1");
  expect(JSON.stringify(fallback)).not.toContain("invented-refueling");
});

test("Catalog Validator chiude il buco delle risposte testuali senza blocchi record", () => {
  const toolResults = enrichToolResultsFingerprints([
    {
      toolCallId: "call-1",
      name: "search_vehicles_by_attribute",
      ok: true,
      data: {
        matches: [
          {
            id: "TI282780",
            targa: "TI282780",
            scadenza_revisione: "09/04/2027",
          },
        ],
      },
    },
  ]);

  const textOnlyResponse = {
    text: "Il mezzo TI282780 ha scadenza revisione 09/04/2027.",
    status: "completed",
    blocks: [],
    entities: [],
    sources: [],
    notices: [],
  };

  const validation = validateFingerprints(textOnlyResponse, toolResults, {
    prompt: "trova mezzo TI282780 e mostrami la scadenza revisione",
  });

  expect(validation.valid).toBe(true);
  expect(validation.fingerprintCoverageWarning).toBe(true);
  expect(validation.missingResponseFingerprints).toBe(false);

  const catalogValidation = validateChatZeroInvenzioniMessage(textOnlyResponse);
  expect(catalogValidation.valid).toBe(false);
  expect(catalogValidation.errors.join(" ")).toContain("text");
  expect(catalogValidation.errors.join(" ")).toContain("blocks");

  const fallback = buildCatalogErrorMessage();
  expect(fallback).toEqual({
    action: "error",
    view: null,
    filters: null,
    resolvedFilters: null,
    clarification: null,
    disambiguation: null,
    report: null,
    accompaniment: { kind: "error_intent_not_in_catalog", params: null },
  });
  expect(fallback).not.toHaveProperty("text");
  expect(fallback).not.toHaveProperty("blocks");
  expect(fallback).not.toHaveProperty("entities");
  expect(fallback).not.toHaveProperty("sources");
  expect(fallback).not.toHaveProperty("notices");
});

test("Catalog Validator rifiuta campi narrativi residui ed extra field", () => {
  const forbiddenFields = [
    "text",
    "blocks",
    "entities",
    "sources",
    "notices",
    "summary",
    "narrative",
    "description",
    "comment",
    "explanation",
    "reasoning",
  ];

  for (const field of forbiddenFields) {
    const candidate = {
      action: "error",
      view: null,
      filters: null,
      clarification: null,
      disambiguation: null,
      report: null,
      accompaniment: { kind: "error_intent_not_in_catalog", params: null },
      [field]: "vietato",
    };

    const validation = validateChatZeroInvenzioniMessage(candidate);
    expect(validation.valid, `campo vietato non respinto: ${field}`).toBe(false);
  }

  const extraFieldValidation = validateChatZeroInvenzioniMessage({
    action: "error",
    view: null,
    filters: null,
    clarification: null,
    disambiguation: null,
    report: null,
    accompaniment: { kind: "error_intent_not_in_catalog", params: null },
    extraField: true,
  });

  expect(extraFieldValidation.valid).toBe(false);
});

test("Catalog Validator rifiuta report con id, targhe o date finali prodotte dall'LLM", () => {
  const validation = validateChatZeroInvenzioniMessage({
    action: "report_request",
    view: null,
    filters: {
      searchText: "report mezzo",
      entityKind: "vehicle",
      periodPreset: "last_30d",
    },
    clarification: null,
    disambiguation: null,
    report: {
      template: "vehicle_monthly",
      subjectKind: "vehicle",
      periodPreset: "last_30d",
      vehiclePlate: "TI282780",
      period: { from: "2026-04-01", to: "2026-04-30" },
    },
    accompaniment: { kind: "view_opened", params: null },
  });

  expect(validation.valid).toBe(false);
  expect(validation.finalMessage).toEqual(buildCatalogErrorMessage());
});

test("Fase 1 blocca bypass multi-agente old-shape e rendering message.text", () => {
  const bridge = readFileSync("src/next/chat-ia/backend/chatIaBackendBridge.ts", "utf8");
  const messageItem = readFileSync("src/next/chat-ia/components/ChatIaMessageItem.tsx", "utf8");

  expect(bridge).not.toContain("runChatIaMultiAgentIfHandled");
  expect(bridge).toContain("multi_agent_bypass_disabled");
  expect(messageItem).not.toContain("chat-ia-message-text");
  expect(messageItem).toContain("data-chat-zero-action");
});
