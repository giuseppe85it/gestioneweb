import type { ChatIaToolHandler } from "../chatIaToolTypes";

type Input = { targa?: unknown; categoria?: unknown };

export const toolGetWheelGeometryConfig: ChatIaToolHandler<Input> = {
  name: "get_wheel_geometry_config",
  descriptionForOpenAi:
    "Recupera configurazioni o override geometria gomme se il dato e disponibile. Oggi resta bloccato perche il reader clone-safe dedicato non esiste nel perimetro consentito.",
  parameters: {
    type: "object",
    properties: {
      targa: { type: "string" },
      categoria: { type: "string" },
    },
    additionalProperties: false,
  },
  outputKindHint: "text",
  async run() {
    return {
      blocked: true,
      reason: "NUOVO_READER richiesto da registry, ma il prompt vieta modifiche reader in questo task.",
      sourceKey: "@wheelGeom_override_v1",
      checkedSources: ["src/pages/ModalGomme.tsx"],
    };
  },
};

export default toolGetWheelGeometryConfig;
