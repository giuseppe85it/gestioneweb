export type NextGommeSelectionPrecision =
  | "ruote_esatte_v2"
  | "asse_completo"
  | "asse_lato"
  | "non_rappresentabile";

export type NextGommeSelectionSide = "destra" | "sinistra";

export type NextGommeSelectionV2Wheel = {
  id: string;
  lato: NextGommeSelectionSide;
  posizione: number;
};

export type NextGommeSelectionV2 = {
  versione: 2;
  asseId: string;
  ruote: NextGommeSelectionV2Wheel[];
};

export type NextGommeSelectionResolution = {
  precisione: NextGommeSelectionPrecision;
  asseId: string | null;
  asseIds: string[];
  lati: NextGommeSelectionSide[];
  ruote: NextGommeSelectionV2Wheel[];
  messaggio: string;
};

export type NextGommeSelectionInput = {
  asseId?: string | null;
  asseLabel?: string | null;
  assiIds?: string[] | null;
  assiLabels?: string[] | null;
  posizione?: string | null;
  gommeIds?: string[] | null;
  evento?: string | null;
  descrizione?: string | null;
  interventoTipo?: string | null;
  selezioneGommeV2?: unknown;
};

type NextOfficialGommeEventCandidate = {
  sourceOrigin: string;
  vehicleMatchReliability: string;
  vehicleMatchField: string;
  targetTarga?: string | null;
  sourceRecordId: string;
  timestamp: number | null;
};

export type NextGommeMaintenanceSelectionSource =
  | "evento_collegato"
  | "manutenzione"
  | "nessuna";

export type NextGommeMaintenanceSelectionResolution =
  NextGommeSelectionResolution & {
    fonte: NextGommeMaintenanceSelectionSource;
    eventoCollegatoId: string | null;
  };

export type NextGommeMaintenanceSelectionInput = {
  activeTarga: string;
  maintenance: {
    targa?: string | null;
    chiusuraDi?: string | null;
    chiusuraRefId?: string | null;
    assiCoinvolti?: string[] | null;
    gommePerAsse?: Array<{ asseId?: string | null }> | null;
    gommeStraordinario?: { asseId?: string | null } | null;
    gommeSelezione?: NextGommeSelectionInput | null;
  };
  officialEvents: Array<
    NextOfficialGommeEventCandidate &
      NextGommeSelectionInput
  >;
};

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeTarga(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function normalizeAsseId(value: unknown): string | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  if (normalized.includes("anter")) return "anteriore";
  if (normalized.includes("poster")) return "posteriore";

  const asseMatch =
    normalized.match(/\basse\s*([1-4])\b/) ??
    normalized.match(/\b([1-4])\s*(?:asse|a)\b/);
  if (asseMatch) return `asse${asseMatch[1]}`;

  const compact = normalized.replace(/\s+/g, "");
  if (/^asse[1-4]$/.test(compact)) return compact;
  return null;
}

function resolveSide(value: string): NextGommeSelectionSide | null {
  const normalized = normalizeText(value);
  if (
    /\b(?:lato\s*)?(?:sx|sinistr[oa]?)\b/.test(normalized)
  ) {
    return "sinistra";
  }
  if (
    /\b(?:lato\s*)?(?:dx|destr[oa]?)\b/.test(normalized)
  ) {
    return "destra";
  }
  return null;
}

function sanitizeV2(value: unknown): NextGommeSelectionV2 | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (raw.versione !== 2) return null;

  const asseId = normalizeAsseId(raw.asseId);
  if (!asseId || !Array.isArray(raw.ruote) || raw.ruote.length === 0) return null;

  const ruote: NextGommeSelectionV2Wheel[] = [];
  const uniqueIds = new Set<string>();
  const uniquePositions = new Set<string>();

  for (const entry of raw.ruote) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
    const wheel = entry as Record<string, unknown>;
    const id = typeof wheel.id === "string" ? wheel.id.trim() : "";
    const lato = wheel.lato === "destra" || wheel.lato === "sinistra" ? wheel.lato : null;
    const posizione = typeof wheel.posizione === "number" ? wheel.posizione : Number.NaN;
    if (!id || !lato || !Number.isInteger(posizione) || posizione < 0) return null;

    const idKey = `${lato}:${id}`;
    const positionKey = `${lato}:${posizione}`;
    if (uniqueIds.has(idKey) || uniquePositions.has(positionKey)) return null;
    uniqueIds.add(idKey);
    uniquePositions.add(positionKey);
    ruote.push({ id, lato, posizione });
  }

  return {
    versione: 2,
    asseId,
    ruote,
  };
}

function resolveLegacyWholeAxle(input: NextGommeSelectionInput): string | null {
  const asseId = normalizeAsseId(input.asseId);
  const gommeIds = (input.gommeIds ?? [])
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!asseId || gommeIds.length === 0) return null;

  const frequencies = new Map<string, number>();
  gommeIds.forEach((id) => frequencies.set(id, (frequencies.get(id) ?? 0) + 1));
  if (Array.from(frequencies.values()).some((count) => count !== 2)) return null;

  const normalizedAsse = normalizeText(asseId).replace(/\s+/g, "");
  const allCoherent = Array.from(frequencies.keys()).every((id) =>
    normalizeText(id).replace(/\s+/g, "").includes(normalizedAsse),
  );
  return allCoherent ? asseId : null;
}

function uniqueNormalizedAxisIds(values: unknown[]): string[] {
  return Array.from(
    new Set(
      values
        .map(normalizeAsseId)
        .filter((asseId): asseId is string => Boolean(asseId)),
    ),
  );
}

function isOrdinarySelection(input: NextGommeSelectionInput): boolean {
  const sourceText = [
    input.interventoTipo,
    input.evento,
    input.descrizione,
    input.asseLabel,
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ");
  const normalized = normalizeText(sourceText);
  return normalized.includes("ordinario") || normalized.includes("asse completo") || normalized.includes("piu assi");
}

function resolveWholeAxesFromSelection(input: NextGommeSelectionInput): string[] {
  const explicitAxes = uniqueNormalizedAxisIds(input.assiIds ?? []);
  if (explicitAxes.length > 0) return explicitAxes;

  const inferredFromIds = uniqueNormalizedAxisIds(input.gommeIds ?? []);
  if (inferredFromIds.length > 1) return inferredFromIds;
  if (inferredFromIds.length === 1 && isOrdinarySelection(input)) return inferredFromIds;
  return [];
}

export function resolveNextGommeSelectionReadOnly(
  input: NextGommeSelectionInput,
): NextGommeSelectionResolution {
  const v2 = sanitizeV2(input.selezioneGommeV2);
  if (v2) {
    return {
      precisione: "ruote_esatte_v2",
      asseId: v2.asseId,
      asseIds: [v2.asseId],
      lati: Array.from(new Set(v2.ruote.map((wheel) => wheel.lato))),
      ruote: v2.ruote,
      messaggio: "Posizione certificata a livello di singola ruota.",
    };
  }

  const wholeAxes = resolveWholeAxesFromSelection(input);
  if (wholeAxes.length > 0) {
    return {
      precisione: "asse_completo",
      asseId: wholeAxes[0] ?? null,
      asseIds: wholeAxes,
      lati: ["destra", "sinistra"],
      ruote: [],
      messaggio:
        wholeAxes.length === 1
          ? "Posizione certificata a livello di asse dalla selezione gomme della manutenzione."
          : "Posizioni certificate a livello di assi dalla selezione gomme della manutenzione.",
    };
  }

  const wholeAxle = resolveLegacyWholeAxle(input);
  if (wholeAxle) {
    return {
      precisione: "asse_completo",
      asseId: wholeAxle,
      asseIds: [wholeAxle],
      lati: ["destra", "sinistra"],
      ruote: [],
      messaggio:
        "Posizione certificata a livello di asse. La singola gomma interna o esterna non è disponibile nel record storico.",
    };
  }

  const sourceText = [
    input.asseId,
    input.asseLabel,
    input.posizione,
    input.evento,
    input.descrizione,
    input.interventoTipo,
    ...(input.gommeIds ?? []),
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ");
  const asseId = normalizeAsseId(input.asseId) ?? normalizeAsseId(sourceText);
  const lato = resolveSide(sourceText);

  if (asseId && lato) {
    return {
      precisione: "asse_lato",
      asseId,
      asseIds: [asseId],
      lati: [lato],
      ruote: [],
      messaggio:
        "Posizione certificata per asse e lato. La singola gomma interna o esterna non è disponibile nel record storico.",
    };
  }

  return {
    precisione: "non_rappresentabile",
    asseId: asseId ?? null,
    asseIds: asseId ? [asseId] : [],
    lati: [],
    ruote: [],
    messaggio:
      "Il record storico non contiene dati sufficienti per evidenziare ruote o assi senza introdurre supposizioni.",
  };
}

export function isNextGommeTechnicalWheelSelected(args: {
  resolution: NextGommeSelectionResolution;
  lato: NextGommeSelectionSide;
  wheelId: string;
  axisId: string;
}): boolean {
  const { resolution, lato, wheelId, axisId } = args;
  if (!resolution.lati.includes(lato)) return false;

  if (resolution.precisione === "ruote_esatte_v2") {
    return resolution.ruote.some((wheel) => wheel.lato === lato && wheel.id === wheelId);
  }

  return resolution.asseIds.includes(axisId);
}

export function resolveNextGommeMaintenanceSelectionReadOnly(
  input: NextGommeMaintenanceSelectionInput,
): NextGommeMaintenanceSelectionResolution {
  const activeTarga = normalizeTarga(input.activeTarga);
  const maintenanceTarga = normalizeTarga(input.maintenance.targa);
  const sameActiveVehicle = Boolean(
    activeTarga &&
      maintenanceTarga &&
      activeTarga === maintenanceTarga,
  );
  const linkedEventId =
    input.maintenance.chiusuraDi === "gomme_evento"
      ? String(input.maintenance.chiusuraRefId ?? "").trim()
      : "";

  if (sameActiveVehicle && linkedEventId) {
    const linkedEvent = input.officialEvents.find(
      (event) =>
        event.sourceOrigin === "evento_ufficiale" &&
        event.vehicleMatchReliability === "forte" &&
        event.vehicleMatchField === "targetTarga" &&
        event.sourceRecordId === linkedEventId &&
        normalizeTarga(event.targetTarga) === activeTarga,
    );

    if (linkedEvent) {
      return {
        ...resolveNextGommeSelectionReadOnly(linkedEvent),
        fonte: "evento_collegato",
        eventoCollegatoId: linkedEvent.sourceRecordId,
      };
    }
  }

  if (sameActiveVehicle && input.maintenance.gommeSelezione) {
    const resolvedSelection = resolveNextGommeSelectionReadOnly(input.maintenance.gommeSelezione);
    if (resolvedSelection.precisione !== "non_rappresentabile") {
      return {
        ...resolvedSelection,
        fonte: "manutenzione",
        eventoCollegatoId: null,
      };
    }
  }

  const maintenanceAxes = Array.from(
    new Set(
      [
        ...(input.maintenance.assiCoinvolti ?? []),
        ...(input.maintenance.gommePerAsse ?? []).map((entry) => entry.asseId),
        input.maintenance.gommeStraordinario?.asseId,
      ]
        .map(normalizeAsseId)
        .filter((asseId): asseId is string => Boolean(asseId)),
    ),
  );

  if (sameActiveVehicle && maintenanceAxes.length > 0) {
    return {
      precisione: "asse_completo",
      asseId: maintenanceAxes[0] ?? null,
      asseIds: maintenanceAxes,
      lati: ["destra", "sinistra"],
      ruote: [],
      fonte: "manutenzione",
      eventoCollegatoId: null,
      messaggio:
        maintenanceAxes.length === 1
          ? "Posizione certificata a livello di asse dalla manutenzione. La singola gomma interna o esterna non è disponibile."
          : "Posizioni certificate a livello di assi dalla manutenzione. Le singole gomme interne o esterne non sono disponibili.",
    };
  }

  return {
    precisione: "non_rappresentabile",
    asseId: null,
    asseIds: [],
    lati: [],
    ruote: [],
    fonte: "nessuna",
    eventoCollegatoId: null,
    messaggio:
      "La manutenzione non contiene assi strutturati e non ha un evento gomme ufficiale collegato utilizzabile.",
  };
}

export function selectNextOfficialGommeEvents<
  T extends NextOfficialGommeEventCandidate,
>(items: T[], activeTarga: string): T[] {
  const normalizedTarga = normalizeTarga(activeTarga);
  if (!normalizedTarga) return [];

  const byId = new Map<string, T>();
  items.forEach((item) => {
    if (
      item.sourceOrigin !== "evento_ufficiale" ||
      item.vehicleMatchReliability !== "forte" ||
      item.vehicleMatchField !== "targetTarga" ||
      normalizeTarga(item.targetTarga) !== normalizedTarga
    ) {
      return;
    }
    if (!byId.has(item.sourceRecordId)) byId.set(item.sourceRecordId, item);
  });

  return Array.from(byId.values()).sort((left, right) => {
    const timestampDelta = (right.timestamp ?? -1) - (left.timestamp ?? -1);
    return timestampDelta || left.sourceRecordId.localeCompare(right.sourceRecordId);
  });
}
