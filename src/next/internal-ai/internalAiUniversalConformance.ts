import {
  INTERNAL_AI_UNIVERSAL_ADAPTER_CONTRACTS,
  INTERNAL_AI_UNIVERSAL_MODULES,
  INTERNAL_AI_UNIVERSAL_UI_HOOKS,
} from "./internalAiUniversalContracts";
import type {
  InternalAiUniversalConformanceIssue,
  InternalAiUniversalConformanceSummary,
} from "./internalAiUniversalTypes";

const UNIVERSAL_GATE_RULE_LABEL =
  "Gate moduli futuri attivo: un modulo nuovo non e completo senza registry entry, contract adapter, hook UI e test minimi di conformita.";

function pushIssue(
  issues: InternalAiUniversalConformanceIssue[],
  nextIssue: InternalAiUniversalConformanceIssue,
) {
  if (issues.some((entry) => entry.issueId === nextIssue.issueId)) {
    return;
  }

  issues.push(nextIssue);
}

export function readInternalAiUniversalConformanceSummary(): InternalAiUniversalConformanceSummary {
  const issues: InternalAiUniversalConformanceIssue[] = [];
  const hookIds = new Set(INTERNAL_AI_UNIVERSAL_UI_HOOKS.map((entry) => entry.hookId));

  INTERNAL_AI_UNIVERSAL_MODULES.forEach((module) => {
    if (!module.routes.length) {
      pushIssue(issues, {
        issueId: `module-routes:${module.moduleId}`,
        severity: "blocking",
        scope: "module",
        targetId: module.moduleId,
        message: "Modulo privo di route dichiarate nel registry totale.",
      });
    }

    if (!module.entityKinds.length) {
      pushIssue(issues, {
        issueId: `module-entities:${module.moduleId}`,
        severity: "blocking",
        scope: "module",
        targetId: module.moduleId,
        message: "Modulo privo di entita dichiarate.",
      });
    }

    if (!module.readers.length) {
      pushIssue(issues, {
        issueId: `module-readers:${module.moduleId}`,
        severity: "blocking",
        scope: "module",
        targetId: module.moduleId,
        message: "Modulo privo di reader dichiarati nel registry.",
      });
    }

    if (!module.uiHookIds.length) {
      pushIssue(issues, {
        issueId: `module-hooks:${module.moduleId}`,
        severity: "blocking",
        scope: "module",
        targetId: module.moduleId,
        message: "Modulo senza hook UI dichiarati: non e agganciabile dalla chat universale.",
      });
    }

    module.uiHookIds.forEach((hookId) => {
      if (!hookIds.has(hookId)) {
        pushIssue(issues, {
          issueId: `module-hook-missing:${module.moduleId}:${hookId}`,
          severity: "blocking",
          scope: "module",
          targetId: module.moduleId,
          message: `Hook UI ${hookId} dichiarato dal modulo ma non presente nel catalogo hook.`,
        });
      }
    });
  });

  INTERNAL_AI_UNIVERSAL_ADAPTER_CONTRACTS.forEach((adapter) => {
    if (!adapter.futureReady) {
      pushIssue(issues, {
        issueId: `adapter-future-ready:${adapter.adapterId}`,
        severity: "blocking",
        scope: "adapter",
        targetId: adapter.adapterId,
        message: "Adapter non marcato come future-ready: non puo fungere da contract standard per moduli futuri.",
      });
    }

    if (!adapter.outputModel.trim()) {
      pushIssue(issues, {
        issueId: `adapter-output:${adapter.adapterId}`,
        severity: "blocking",
        scope: "adapter",
        targetId: adapter.adapterId,
        message: "Adapter senza output model normalizzato dichiarato.",
      });
    }

    if (!adapter.sourceReaders.length) {
      pushIssue(issues, {
        issueId: `adapter-readers:${adapter.adapterId}`,
        severity: "blocking",
        scope: "adapter",
        targetId: adapter.adapterId,
        message: "Adapter senza reader o sorgenti dichiarate.",
      });
    }

    if (!adapter.uiHookIds.length) {
      pushIssue(issues, {
        issueId: `adapter-hooks:${adapter.adapterId}`,
        severity: "warning",
        scope: "adapter",
        targetId: adapter.adapterId,
        message: "Adapter senza hook UI dichiarati: il routing resta solo teorico.",
      });
    }
  });

  const blockingIssues = issues.filter((entry) => entry.severity === "blocking").length;
  const warningIssues = issues.filter((entry) => entry.severity === "warning").length;

  return {
    gateStatus: blockingIssues === 0 ? "attivo" : "bloccato",
    blockingIssues,
    warningIssues,
    ruleLabel: UNIVERSAL_GATE_RULE_LABEL,
    issues,
  };
}
