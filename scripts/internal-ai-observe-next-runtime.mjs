import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import {
  INTERNAL_AI_NEXT_RUNTIME_OBSERVER_CATALOG_VERSION,
  INTERNAL_AI_NEXT_RUNTIME_DYNAMIC_ROUTE_SPECS,
  INTERNAL_AI_NEXT_RUNTIME_OBSERVER_BASE_URL,
  INTERNAL_AI_NEXT_RUNTIME_OBSERVER_ROUTE_SPECS,
  createDefaultNextRuntimeObserverSnapshot,
  getNextRuntimeObserverDirPath,
  writeNextRuntimeObserverSnapshot,
} from "../backend/internal-ai/server/internal-ai-next-runtime-observer.js";

const baseUrl = process.env.INTERNAL_AI_NEXT_BASE_URL?.trim() || INTERNAL_AI_NEXT_RUNTIME_OBSERVER_BASE_URL;
const browserChannel = process.env.INTERNAL_AI_NEXT_BROWSER_CHANNEL?.trim() || "msedge";
const headless = process.env.INTERNAL_AI_NEXT_OBSERVER_HEADLESS !== "0";
const shouldAutostartNext = process.env.INTERNAL_AI_NEXT_OBSERVER_AUTOSTART !== "0";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function toSafeFileName(value) {
  return String(value ?? "runtime")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatRuntimePath(url) {
  return `${url.pathname}${url.search}`;
}

async function isNextAvailable() {
  try {
    const response = await fetch(new URL("/next", baseUrl));
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureNextServerAvailable() {
  if (await isNextAvailable()) {
    return null;
  }

  if (!shouldAutostartNext) {
    throw new Error(`NEXT locale non raggiungibile su ${baseUrl} e autostart disabilitato.`);
  }

  const url = new URL(baseUrl);
  const host = url.hostname || "127.0.0.1";
  const port = url.port || "4173";
  const child =
    process.platform === "win32"
      ? spawn(
          "cmd.exe",
          ["/c", "npm", "run", "dev", "--", "--host", host, "--port", port],
          {
            cwd: repoRoot,
            stdio: "ignore",
            shell: false,
          },
        )
      : spawn("npm", ["run", "dev", "--", "--host", host, "--port", port], {
          cwd: repoRoot,
          stdio: "ignore",
          shell: false,
        });

  for (let attempt = 0; attempt < 45; attempt += 1) {
    if (await isNextAvailable()) {
      return child;
    }
    await sleep(2000);
  }

  child.kill("SIGTERM");
  throw new Error(`NEXT locale non raggiungibile su ${baseUrl} dopo l'autostart.`);
}

async function waitForAppHydration(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => null);
  await page.waitForSelector("#root", { timeout: 15000 }).catch(() => null);
  await page
    .waitForFunction(
      () => {
        const root = document.querySelector("#root");
        if (!root) {
          return false;
        }

        const text = (root.textContent ?? "").replace(/\s+/g, " ").trim();
        return text.length > 40;
      },
      { timeout: 15000 },
    )
    .catch(() => null);
  await page.waitForTimeout(700);
}

async function collectScreenSnapshot(page) {
  return page.evaluate(() => {
    const textOf = (value) => String(value?.textContent ?? "").replace(/\s+/g, " ").trim();
    const normalizeLocal = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
    const isVisible = (element) => {
      if (!(element instanceof HTMLElement)) {
        return false;
      }

      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity || "1") > 0 &&
        rect.width > 0 &&
        rect.height > 0
      );
    };

    const uniqueTexts = (items, max = 12) =>
      Array.from(new Set(items.map((entry) => entry.trim()).filter(Boolean))).slice(0, max);

    const uniqueObjects = (items, keyOf, max = 18) => {
      const seen = new Set();
      const results = [];
      for (const entry of items) {
        const key = keyOf(entry);
        if (!key || seen.has(key)) {
          continue;
        }
        seen.add(key);
        results.push(entry);
        if (results.length >= max) {
          break;
        }
      }
      return results;
    };

    const collectTexts = (selector, max = 12) =>
      uniqueTexts(
        Array.from(document.querySelectorAll(selector))
          .filter((element) => isVisible(element))
          .map((element) => textOf(element))
          .filter((entry) => entry.length > 1),
        max,
      );

    const visibleSections = collectTexts(
      "main section h2, main section h3, .next-panel h2, .next-panel h3",
      12,
    );
    const visibleCards = collectTexts(
      "article h3, .next-panel__header h2, .internal-ai-card h3, .internal-ai-card__eyebrow",
      14,
    );
    const visibleTabs = collectTexts(
      '[role="tab"], .next-tabs button, .next-tabs a, .internal-ai-tab',
      12,
    );
    const visibleButtons = collectTexts("button, [role='button']", 16);
    const visibleDialogs = collectTexts(
      '[role="dialog"] h1, [role="dialog"] h2, [role="dialog"] h3, .modal h2',
      10,
    );

    const linkEntries = Array.from(document.querySelectorAll("a[href]"))
      .filter((element) => isVisible(element))
      .map((element) => {
        const href = element.getAttribute("href") ?? "";
        if (!href) {
          return null;
        }

        try {
          const url = new URL(href, window.location.origin);
          return {
            label: textOf(element) || url.pathname,
            path: url.pathname,
          };
        } catch {
          return null;
        }
      })
      .filter((entry) => entry && entry.path.startsWith("/next"))
      .slice(0, 18);

    const surfaceEntries = uniqueObjects(
      [
        ...visibleSections.map((label) => ({
          kind: "section",
          label,
          targetPath: null,
          safeToProbe: false,
        })),
        ...visibleCards.map((label) => ({
          kind: "card",
          label,
          targetPath: null,
          safeToProbe: false,
        })),
        ...visibleTabs.map((label) => ({
          kind: "tab_trigger",
          label,
          targetPath: null,
          safeToProbe: true,
        })),
        ...visibleButtons.map((label) => ({
          kind: "button_trigger",
          label,
          targetPath: null,
          safeToProbe: false,
        })),
        ...linkEntries.map((entry) => ({
          kind: "route_link",
          label: entry.label,
          targetPath: entry.path,
          safeToProbe: true,
        })),
        ...visibleDialogs.map((label) => ({
          kind: "modal_trigger",
          label,
          targetPath: null,
          safeToProbe: false,
        })),
      ],
      (entry) => `${entry.kind}:${entry.label}:${entry.targetPath ?? ""}`,
      20,
    );

    const main = document.querySelector("main");
    const mainText = normalizeLocal(main?.textContent ?? document.body.textContent ?? "").slice(0, 720);

    return {
      pageTitle: document.title ? normalizeLocal(document.title) : null,
      mainHeading:
        collectTexts("h1", 1)[0] ?? collectTexts("main h2, .next-panel h2", 1)[0] ?? null,
      visibleHeadings: collectTexts("h1, h2, h3", 12),
      visibleSections,
      visibleCards,
      visibleTabs,
      visibleButtons,
      visibleLinks: uniqueObjects(linkEntries, (entry) => `${entry.label}:${entry.path}`, 16),
      visibleDialogs,
      surfaceEntries,
      bodySnippet: mainText || null,
    };
  });
}

function createBaseObservation(spec, pathOverride = null) {
  return {
    id: spec.id,
    label: spec.label,
    path: pathOverride || spec.path || spec.startPath || "/next",
    finalPath: null,
    screenType: spec.screenType,
    status: "unavailable",
    observedAt: new Date().toISOString(),
    discoveredFromRouteId: spec.discoveryFromRouteId ?? null,
    sourcePaths: spec.sourcePaths ?? [],
    pageTitle: null,
    mainHeading: null,
    visibleHeadings: [],
    visibleSections: [],
    visibleCards: [],
    visibleTabs: [],
    visibleButtons: [],
    visibleLinks: [],
    visibleDialogs: [],
    bodySnippet: null,
    screenshotFileName: null,
    screenshotRelativePath: null,
    coverageLevel: spec.discoveryFromRouteId ? "dynamic_route_resolved" : "route_only",
    surfaceEntries: [],
    stateObservations: [],
    notes: [...(spec.notes ?? [])],
    limitations: [],
  };
}

async function writeScreenshot(page, fileName) {
  const screenshotDir = getNextRuntimeObserverDirPath();
  const screenshotAbsolutePath = path.join(screenshotDir, fileName);
  await fs.mkdir(screenshotDir, { recursive: true });
  await page.screenshot({ path: screenshotAbsolutePath, fullPage: true });
  return {
    screenshotFileName: fileName,
    screenshotRelativePath: path.join(
      "backend/internal-ai/runtime-data/next-runtime-observer",
      fileName,
    ),
  };
}

function classifyObservationStatus(observation) {
  const evidenceCount =
    observation.visibleHeadings.length +
    observation.visibleCards.length +
    observation.visibleTabs.length +
    observation.visibleButtons.length +
    observation.surfaceEntries.length;

  return evidenceCount > 0 || (observation.bodySnippet ?? "").length > 80 ? "observed" : "partial";
}

async function isSelectorVisible(page, selector, timeout = 1200, state = "visible") {
  if (typeof selector !== "string" || !selector.trim()) {
    return false;
  }

  try {
    await page.locator(selector).first().waitFor({ state, timeout });
    return true;
  } catch {
    return false;
  }
}

async function applyInteractionSteps(page, steps) {
  for (const step of steps ?? []) {
    if (step.kind !== "click_selector") {
      continue;
    }

    const locator = page.locator(step.selector).first();
    await locator.waitFor({ state: "visible", timeout: 7000 });
    await locator.click();
    await waitForAppHydration(page);
  }
}

async function readTriggerGuardrailState(locator) {
  try {
    return await locator.evaluate((element) => {
      const htmlElement = element instanceof HTMLElement ? element : null;
      const nativeDisabled =
        htmlElement && "disabled" in htmlElement ? Boolean(htmlElement.disabled) : false;

      return {
        nativeDisabled,
        ariaDisabled: htmlElement?.getAttribute("aria-disabled") ?? null,
        cloneBlocked:
          htmlElement?.getAttribute("data-next-clone-blocked") ??
          htmlElement?.closest?.("[data-next-clone-blocked='true']")?.getAttribute?.(
            "data-next-clone-blocked",
          ) ??
          null,
      };
    });
  } catch {
    return {
      nativeDisabled: false,
      ariaDisabled: null,
      cloneBlocked: null,
    };
  }
}

async function observeStateProbe(page, routeSpec, routePath, probe) {
  const observation = {
    id: `${routeSpec.id}:${probe.id}`,
    label: probe.label,
    kind: probe.kind ?? "route_state",
    triggerLabel: probe.label,
    finalPath: null,
    status: "unavailable",
    mainHeading: null,
    visibleSections: [],
    visibleDialogs: [],
    screenshotFileName: null,
    screenshotRelativePath: null,
    notes: [
      "Stato osservato tramite interazione read-only esplicitamente whitelistata.",
      ...(probe.notes ?? []),
    ],
    limitations: [],
  };

  try {
    const probeRoutePath =
      typeof probe.routePathOverride === "string" && probe.routePathOverride.trim()
        ? probe.routePathOverride
        : routePath;

    await page.goto(new URL(probeRoutePath, baseUrl).toString(), {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForAppHydration(page);

    await applyInteractionSteps(page, probe.prepareSteps);

    const successSelector =
      typeof probe.successSelector === "string" && probe.successSelector.trim()
        ? probe.successSelector
        : null;
    const successState = probe.successState === "attached" ? "attached" : "visible";
    const alreadySatisfied =
      probe.skipClickIfSuccessVisible === true && successSelector
        ? await isSelectorVisible(page, successSelector, 1200, successState)
        : false;

    if (!alreadySatisfied) {
      const trigger = page.locator(probe.selector).first();
      await trigger.waitFor({ state: "visible", timeout: 6000 });

      const guardrailState = await readTriggerGuardrailState(trigger);
      if (
        guardrailState.nativeDisabled ||
        guardrailState.ariaDisabled === "true" ||
        guardrailState.cloneBlocked === "true"
      ) {
        observation.limitations.push(
          "Trigger visibile ma disabilitato dal guard rail read-only del clone.",
        );
        return observation;
      }

      await trigger.click();
      await waitForAppHydration(page);
    } else {
      observation.notes.push("Stato gia visibile nel render iniziale della schermata.");
    }

    if (typeof probe.settleMs === "number" && probe.settleMs > 0) {
      await page.waitForTimeout(probe.settleMs);
    }

    if (successSelector) {
      await page.locator(successSelector).first().waitFor({ state: successState, timeout: 5000 });
    }

    const currentUrl = new URL(page.url());
    observation.finalPath = formatRuntimePath(currentUrl);
    if (!currentUrl.pathname.startsWith("/next")) {
      observation.limitations.push(
        "Lo stato ha portato fuori dal perimetro /next/* e non viene considerato coperto.",
      );
      return observation;
    }

    const runtimeData = await collectScreenSnapshot(page);
    observation.mainHeading = runtimeData.mainHeading;
    observation.visibleSections = runtimeData.visibleSections;
    observation.visibleDialogs = runtimeData.visibleDialogs;
    Object.assign(
      observation,
      await writeScreenshot(page, `${toSafeFileName(routeSpec.id)}--${toSafeFileName(probe.id)}.png`),
    );
    observation.status = classifyObservationStatus(runtimeData);

    if (!runtimeData.visibleDialogs.length && probe.kind === "dialog_state") {
      observation.limitations.push("Il dialog non e rimasto visibile in modo stabile durante il probe.");
    }

    return observation;
  } catch (error) {
    observation.limitations.push(
      error instanceof Error
        ? `Stato non osservabile in modo affidabile: ${error.message}`
        : "Stato non osservabile per errore non classificato.",
    );
    return observation;
  }
}

async function observeRoute(page, spec) {
  const routePath = spec.path;
  const observation = createBaseObservation(spec, routePath);

  try {
    await page.goto(new URL(routePath, baseUrl).toString(), {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForAppHydration(page);

    const currentUrl = new URL(page.url());
    observation.finalPath = formatRuntimePath(currentUrl);
    if (!currentUrl.pathname.startsWith("/next")) {
      observation.limitations.push(
        "La schermata ha deviato fuori dal perimetro /next/* e non viene considerata coperta.",
      );
      return observation;
    }

    const runtimeData = await collectScreenSnapshot(page);
    Object.assign(observation, runtimeData);
    Object.assign(observation, await writeScreenshot(page, `${toSafeFileName(spec.id)}.png`));
    observation.status = classifyObservationStatus(observation);

    if (Array.isArray(spec.safeStateProbes) && spec.safeStateProbes.length) {
      for (const probe of spec.safeStateProbes) {
        const stateObservation = await observeStateProbe(
          page,
          spec,
          observation.finalPath || routePath,
          probe,
        );
        observation.stateObservations.push(stateObservation);
      }
      if (observation.stateObservations.some((entry) => entry.status === "observed")) {
        observation.coverageLevel = "interactive_readonly";
      }
    }

    if (!observation.visibleDialogs.length) {
      observation.limitations.push(
        "La schermata e stata osservata senza aprire modali o dialoghi non esplicitamente whitelistati.",
      );
    }
    if (!observation.visibleTabs.length) {
      observation.limitations.push("Nessun tab visibile osservato su questa schermata.");
    }

    return observation;
  } catch (error) {
    observation.limitations.push(
      error instanceof Error
        ? `Osservazione runtime non completata: ${error.message}`
        : "Osservazione runtime non completata per errore non classificato.",
    );
    return observation;
  }
}

async function applyDiscoverySteps(page, spec) {
  await page.goto(new URL(spec.startPath, baseUrl).toString(), {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await waitForAppHydration(page);
  await applyInteractionSteps(page, spec.discoverySteps);
}

async function observeDynamicRoute(page, spec) {
  const observation = createBaseObservation(spec, spec.startPath);

  try {
    await applyDiscoverySteps(page, spec);

    const currentUrl = new URL(page.url());
    observation.finalPath = formatRuntimePath(currentUrl);
    if (!currentUrl.pathname.startsWith("/next")) {
      observation.limitations.push(
        "La discovery dinamica ha portato fuori dal perimetro /next/* e non viene considerata coperta.",
      );
      return observation;
    }

    if (
      Array.isArray(spec.expectedPathPrefixes) &&
      spec.expectedPathPrefixes.length > 0 &&
      !spec.expectedPathPrefixes.some((prefix) => currentUrl.pathname.startsWith(prefix))
    ) {
      observation.limitations.push(
        `La discovery non ha raggiunto il path atteso per ${spec.label}: ${currentUrl.pathname}.`,
      );
      return observation;
    }

    const runtimeData = await collectScreenSnapshot(page);
    Object.assign(observation, runtimeData);
    Object.assign(observation, await writeScreenshot(page, `${toSafeFileName(spec.id)}.png`));
    observation.status = classifyObservationStatus(observation);
    observation.coverageLevel =
      observation.status === "observed" ? "dynamic_route_resolved" : observation.coverageLevel;
    observation.notes.push(
      "La route e stata raggiunta con una catena di interazioni whitelist-safe e read-only.",
    );

    if (Array.isArray(spec.safeStateProbes) && spec.safeStateProbes.length) {
      for (const probe of spec.safeStateProbes) {
        const stateObservation = await observeStateProbe(page, spec, observation.finalPath, probe);
        observation.stateObservations.push(stateObservation);
      }
      if (observation.stateObservations.some((entry) => entry.status === "observed")) {
        observation.coverageLevel = "interactive_readonly";
      }
    }

    if (!observation.visibleDialogs.length) {
      observation.limitations.push(
        "Nessun dialog o modale e stato aperto durante la discovery dinamica.",
      );
    }

    return observation;
  } catch (error) {
    observation.limitations.push(
      error instanceof Error
        ? `Route dinamica non osservabile in modo affidabile: ${error.message}`
        : "Route dinamica non osservabile per errore non classificato.",
    );
    return observation;
  }
}

async function launchObserverBrowser() {
  try {
    return await chromium.launch({ channel: browserChannel, headless });
  } catch {
    return chromium.launch({ headless });
  }
}

function buildStatusCounts(entries) {
  return {
    observed: entries.filter((entry) => entry.status === "observed").length,
    partial: entries.filter((entry) => entry.status === "partial").length,
    unavailable: entries.filter((entry) => entry.status === "unavailable").length,
  };
}

async function main() {
  const nextServerProcess = await ensureNextServerAvailable();
  const browser = await launchObserverBrowser();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const observations = [];

  try {
    for (const spec of INTERNAL_AI_NEXT_RUNTIME_OBSERVER_ROUTE_SPECS) {
      observations.push(await observeRoute(page, spec));
    }

    for (const spec of INTERNAL_AI_NEXT_RUNTIME_DYNAMIC_ROUTE_SPECS) {
      observations.push(await observeDynamicRoute(page, spec));
    }
  } finally {
    await page.close().catch(() => null);
    await context.close().catch(() => null);
    await browser.close().catch(() => null);
    if (nextServerProcess) {
      nextServerProcess.kill("SIGTERM");
    }
  }

  const routeStatusCounts = buildStatusCounts(observations);
  const stateObservations = observations.flatMap((entry) => entry.stateObservations);
  const stateStatusCounts = buildStatusCounts(stateObservations);
  const screenshotCount =
    observations.filter((entry) => entry.screenshotFileName).length +
    observations.reduce(
      (total, entry) =>
        total + entry.stateObservations.filter((stateObservation) => stateObservation.screenshotFileName).length,
      0,
    );
  const stateCount = stateObservations.length;

  const snapshot = {
    ...createDefaultNextRuntimeObserverSnapshot(),
    catalogVersion: INTERNAL_AI_NEXT_RUNTIME_OBSERVER_CATALOG_VERSION,
    status:
      routeStatusCounts.observed === 0
        ? routeStatusCounts.partial > 0
          ? "partial"
          : "error"
        : routeStatusCounts.partial > 0 ||
            routeStatusCounts.unavailable > 0 ||
            stateStatusCounts.partial > 0 ||
            stateStatusCounts.unavailable > 0
          ? "partial"
          : "observed",
    baseUrl,
    observedAt: new Date().toISOString(),
    routeCount: observations.length,
    observedRouteCount: routeStatusCounts.observed,
    partialRouteCount: routeStatusCounts.partial,
    unavailableRouteCount: routeStatusCounts.unavailable,
    screenshotCount,
    stateCount,
    observedStateCount: stateStatusCounts.observed,
    partialStateCount: stateStatusCounts.partial,
    unavailableStateCount: stateStatusCounts.unavailable,
    routes: observations,
    notes: [
      "Crawl Playwright eseguito solo su route /next/* whitelistate.",
      "Sono ammesse solo interazioni whitelist-safe e read-only per tab o percorsi dinamici gia verificati.",
      "Nessun submit, upload, salvataggio o uscita dal perimetro /next/* e stata eseguita dall'osservatore.",
      `Catalogo observer: ${INTERNAL_AI_NEXT_RUNTIME_OBSERVER_CATALOG_VERSION}. Route osservate ${routeStatusCounts.observed}/${observations.length}, stati osservati ${stateStatusCounts.observed}/${stateCount}.`,
    ],
    limitations: [
      "La copertura runtime resta comunque parziale: modali, menu o stati non whitelistati restano fuori osservazione.",
      "Le schermate che dipendono da dati reali mostrano solo il contesto visibile nel momento del crawl locale.",
      "La madre non viene toccata: l'osservazione resta confinata al perimetro /next/*.",
    ],
  };

  await writeNextRuntimeObserverSnapshot(snapshot);

  console.log(
    JSON.stringify(
      {
        ok: true,
        status: snapshot.status,
        baseUrl: snapshot.baseUrl,
        routeCount: snapshot.routeCount,
        observedRouteCount: snapshot.observedRouteCount,
        partialRouteCount: snapshot.partialRouteCount,
        unavailableRouteCount: snapshot.unavailableRouteCount,
        screenshotCount: snapshot.screenshotCount,
        stateCount: snapshot.stateCount,
        observedStateCount: snapshot.observedStateCount,
        partialStateCount: snapshot.partialStateCount,
        unavailableStateCount: snapshot.unavailableStateCount,
      },
      null,
      2,
    ),
  );
}

await main();
