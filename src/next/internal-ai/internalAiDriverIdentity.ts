export type InternalAiDriverIdentity = {
  driverId?: string | null;
  badge?: string | null;
  nomeCompleto?: string | null;
};

export type InternalAiDriverLayerIdentity = {
  autistaId?: string | null;
  badgeAutista?: string | null;
  autistaNome?: string | null;
  nomeAutista?: string | null;
};

export type InternalAiDriverCrossLayerMatchStrength =
  | "forte"
  | "plausibile"
  | "non_dimostrabile";

export type InternalAiDriverCrossLayerMatchReason =
  | "autista_id"
  | "badge"
  | "nome_fallback"
  | "autista_id_conflict"
  | "badge_conflict"
  | "nome_non_coerente"
  | "identificativi_assenti";

export type InternalAiDriverCrossLayerMatch = {
  matched: boolean;
  strength: InternalAiDriverCrossLayerMatchStrength;
  reason: InternalAiDriverCrossLayerMatchReason;
};

export function normalizeInternalAiDriverIdentityText(
  value: string | null | undefined,
): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeInternalAiDriverIdentityName(
  value: string | null | undefined,
): string {
  return normalizeInternalAiDriverIdentityText(value)
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function normalizeInternalAiDriverIdentityBadge(
  value: string | null | undefined,
): string {
  return normalizeInternalAiDriverIdentityText(value).toUpperCase();
}

export function readInternalAiDriverLayerName(
  layerIdentity: InternalAiDriverLayerIdentity,
): string {
  return normalizeInternalAiDriverIdentityName(
    layerIdentity.autistaNome ?? layerIdentity.nomeAutista,
  );
}

export function matchInternalAiDriverLayerIdentity(args: {
  driver: InternalAiDriverIdentity;
  layerIdentity: InternalAiDriverLayerIdentity;
}): InternalAiDriverCrossLayerMatch {
  const driverBadge = normalizeInternalAiDriverIdentityBadge(args.driver.badge);
  const layerBadge = normalizeInternalAiDriverIdentityBadge(
    args.layerIdentity.badgeAutista,
  );

  if (driverBadge && layerBadge) {
    if (driverBadge === layerBadge) {
      return {
        matched: true,
        strength: "forte",
        reason: "badge",
      };
    }

    return {
      matched: false,
      strength: "non_dimostrabile",
      reason: "badge_conflict",
    };
  }

  const driverName = normalizeInternalAiDriverIdentityName(
    args.driver.nomeCompleto,
  );
  const layerName = readInternalAiDriverLayerName(args.layerIdentity);
  if (driverName && layerName && driverName === layerName) {
    return {
      matched: true,
      strength: "plausibile",
      reason: "nome_fallback",
    };
  }

  const hasAnyIdentity = Boolean(driverBadge || layerBadge || driverName || layerName);
  return {
    matched: false,
    strength: "non_dimostrabile",
    reason: hasAnyIdentity ? "nome_non_coerente" : "identificativi_assenti",
  };
}

export function matchInternalAiDriverVehicleIdentity(args: {
  driver: InternalAiDriverIdentity;
  layerIdentity: InternalAiDriverLayerIdentity;
}): InternalAiDriverCrossLayerMatch {
  const driverId = normalizeInternalAiDriverIdentityText(args.driver.driverId);
  const layerDriverId = normalizeInternalAiDriverIdentityText(
    args.layerIdentity.autistaId,
  );

  if (driverId && layerDriverId) {
    if (driverId === layerDriverId) {
      return {
        matched: true,
        strength: "forte",
        reason: "autista_id",
      };
    }

    return {
      matched: false,
      strength: "non_dimostrabile",
      reason: "autista_id_conflict",
    };
  }

  if (layerDriverId) {
    return {
      matched: false,
      strength: "non_dimostrabile",
      reason: "autista_id_conflict",
    };
  }

  const driverName = normalizeInternalAiDriverIdentityName(
    args.driver.nomeCompleto,
  );
  const layerName = readInternalAiDriverLayerName(args.layerIdentity);
  if (driverName && layerName && driverName === layerName) {
    return {
      matched: true,
      strength: "plausibile",
      reason: "nome_fallback",
    };
  }

  const hasAnyIdentity = Boolean(driverId || layerDriverId || driverName || layerName);
  return {
    matched: false,
    strength: "non_dimostrabile",
    reason: hasAnyIdentity ? "nome_non_coerente" : "identificativi_assenti",
  };
}
