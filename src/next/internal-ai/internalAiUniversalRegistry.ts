import { NEXT_ROUTE_MODULES } from "../nextData";
import {
  INTERNAL_AI_UNIVERSAL_ADAPTER_CONTRACTS,
  INTERNAL_AI_UNIVERSAL_AI_CAPABILITIES,
  INTERNAL_AI_UNIVERSAL_ENTITY_MODEL,
  INTERNAL_AI_UNIVERSAL_GAPS,
  INTERNAL_AI_UNIVERSAL_MODULES,
  INTERNAL_AI_UNIVERSAL_UI_HOOKS,
} from "./internalAiUniversalContracts";
import type {
  InternalAiUniversalModuleRegistryEntry,
  InternalAiUniversalRegistrySnapshot,
} from "./internalAiUniversalTypes";

function buildRouteStatusIndex(): Map<string, { status: string; note: string }> {
  return new Map(
    NEXT_ROUTE_MODULES.map((entry) => [
      entry.path,
      {
        status: entry.status,
        note: entry.note,
      },
    ]),
  );
}

function enrichModules(modules: InternalAiUniversalModuleRegistryEntry[]) {
  const routeIndex = buildRouteStatusIndex();

  return modules.map((module) => {
    const routeNotes = module.routes.flatMap((routePath) => {
      const match = routeIndex.get(routePath);
      return match ? [`Route ${routePath}: ${match.status}. ${match.note}`] : [];
    });

    return {
      ...module,
      notes: [...module.notes, ...routeNotes],
    };
  });
}

function countUniqueRoutePaths(modules: InternalAiUniversalModuleRegistryEntry[]): number {
  return new Set(modules.flatMap((module) => module.routes)).size;
}

function countUniqueModals(modules: InternalAiUniversalModuleRegistryEntry[]): number {
  return new Set(modules.flatMap((module) => module.modals)).size;
}

export async function readInternalAiUniversalRegistrySnapshot(): Promise<InternalAiUniversalRegistrySnapshot> {
  const modules = enrichModules(INTERNAL_AI_UNIVERSAL_MODULES);

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      modules: modules.length,
      routes: countUniqueRoutePaths(modules),
      modals: countUniqueModals(modules),
      entityKinds: INTERNAL_AI_UNIVERSAL_ENTITY_MODEL.length,
      adapters: INTERNAL_AI_UNIVERSAL_ADAPTER_CONTRACTS.length,
      aiCapabilities: INTERNAL_AI_UNIVERSAL_AI_CAPABILITIES.length,
      absorbedAiCapabilities: INTERNAL_AI_UNIVERSAL_AI_CAPABILITIES.filter(
        (entry) => entry.status === "assorbita",
      ).length,
      uiHooks: INTERNAL_AI_UNIVERSAL_UI_HOOKS.length,
      gaps: INTERNAL_AI_UNIVERSAL_GAPS.length,
    },
    entities: INTERNAL_AI_UNIVERSAL_ENTITY_MODEL,
    uiHooks: INTERNAL_AI_UNIVERSAL_UI_HOOKS,
    modules,
    adapters: INTERNAL_AI_UNIVERSAL_ADAPTER_CONTRACTS,
    aiCapabilities: INTERNAL_AI_UNIVERSAL_AI_CAPABILITIES,
    gaps: INTERNAL_AI_UNIVERSAL_GAPS,
  };
}
