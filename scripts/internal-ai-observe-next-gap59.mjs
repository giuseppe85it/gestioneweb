import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import {
  INTERNAL_AI_NEXT_RUNTIME_OBSERVER_BASE_URL,
  INTERNAL_AI_NEXT_RUNTIME_OBSERVER_CATALOG_VERSION,
  getNextRuntimeObserverDirPath,
  readNextRuntimeObserverSnapshot,
  writeNextRuntimeObserverSnapshot,
} from "../backend/internal-ai/server/internal-ai-next-runtime-observer.js";

const baseUrl =
  process.env.INTERNAL_AI_NEXT_BASE_URL?.trim() || INTERNAL_AI_NEXT_RUNTIME_OBSERVER_BASE_URL;

function toSafeFileName(value) {
  return String(value ?? "runtime")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function waitForApp(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => null);
  await page.waitForTimeout(700);
}

async function isVisible(page, selector, timeout = 2500) {
  try {
    await page.locator(selector).first().waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

async function collectScreenSnapshot(page) {
  return page.evaluate(() => {
    const textOf = (value) => String(value?.textContent ?? "").replace(/\s+/g, " ").trim();
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

    const texts = (selector, max = 12) =>
      Array.from(document.querySelectorAll(selector))
        .filter((element) => isVisible(element))
        .map((element) => textOf(element))
        .filter(Boolean)
        .slice(0, max);

    const main = document.querySelector("main");

    return {
      pageTitle: document.title ? textOf({ textContent: document.title }) : null,
      mainHeading: texts("h1", 1)[0] ?? texts("main h2, .next-panel h2", 1)[0] ?? null,
      visibleHeadings: texts("h1, h2, h3", 12),
      visibleSections: texts("main section h2, main section h3, .next-panel h2, .next-panel h3", 12),
      visibleCards: texts("article h3, .next-panel__header h2, .internal-ai-card h3", 12),
      visibleTabs: texts('[role="tab"], .next-tabs button, .next-tabs a, .internal-ai-tab', 12),
      visibleButtons: texts("button, [role='button']", 16),
      visibleLinks: [],
      visibleDialogs: texts('[role="dialog"] h1, [role="dialog"] h2, [role="dialog"] h3, .modal h2', 10),
      surfaceEntries: [],
      bodySnippet: textOf(main ?? document.body).slice(0, 720) || null,
    };
  });
}

function classify(runtimeData) {
  const evidenceCount =
    runtimeData.visibleHeadings.length +
    runtimeData.visibleCards.length +
    runtimeData.visibleTabs.length +
    runtimeData.visibleButtons.length;
  return evidenceCount > 0 || (runtimeData.bodySnippet ?? "").length > 80 ? "observed" : "partial";
}

async function writeScreenshot(page, fileName) {
  const screenshotDir = getNextRuntimeObserverDirPath();
  await fs.mkdir(screenshotDir, { recursive: true });
  const absolutePath = path.join(screenshotDir, fileName);
  await page.screenshot({ path: absolutePath, fullPage: true });
  return {
    screenshotFileName: fileName,
    screenshotRelativePath: path.join(
      "backend/internal-ai/runtime-data/next-runtime-observer",
      fileName,
    ),
  };
}

function formatRuntimePath(url) {
  return `${url.pathname}${url.search}`;
}

function makeStateObservation(routeId, probeId, label, kind, notes = []) {
  return {
    id: `${routeId}:${probeId}`,
    label,
    kind,
    triggerLabel: label,
    finalPath: null,
    status: "unavailable",
    mainHeading: null,
    visibleSections: [],
    visibleDialogs: [],
    screenshotFileName: null,
    screenshotRelativePath: null,
    notes: [
      "Stato osservato tramite interazione read-only esplicitamente whitelistata.",
      ...notes,
    ],
    limitations: [],
  };
}

function assignStateResult(stateObservation, runtimeData, screenshot) {
  stateObservation.finalPath = runtimeData.finalPath;
  stateObservation.mainHeading = runtimeData.mainHeading;
  stateObservation.visibleSections = runtimeData.visibleSections;
  stateObservation.visibleDialogs = runtimeData.visibleDialogs;
  stateObservation.status = classify(runtimeData);
  Object.assign(stateObservation, screenshot);
  return stateObservation;
}

function findRoute(snapshot, routeId) {
  return snapshot.routes.find((entry) => entry.id === routeId);
}

function setRouteState(routeEntry, stateObservation) {
  const nextStates = Array.isArray(routeEntry.stateObservations)
    ? routeEntry.stateObservations.filter((entry) => entry.id !== stateObservation.id)
    : [];
  nextStates.push(stateObservation);
  routeEntry.stateObservations = nextStates;
}

async function observeState(page, config) {
  await page.goto(new URL(config.path, baseUrl).toString(), {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await waitForApp(page);

  if (typeof config.prepare === "function") {
    await config.prepare(page);
    await waitForApp(page);
  }

  return config.run(page);
}

async function main() {
  const snapshot = await readNextRuntimeObserverSnapshot();
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  try {
    const nextHome = findRoute(snapshot, "next-home");
    const acquistiRoute = findRoute(snapshot, "next-acquisti");
    const dossierRoute = findRoute(snapshot, "next-dossier-dettaglio");
    const rifornimentiRoute = findRoute(snapshot, "next-dossier-rifornimenti");
    const capoRoute = findRoute(snapshot, "next-capo-costi-dettaglio");
    const acquistiDetailRoute = findRoute(snapshot, "next-acquisti-dettaglio");

    if (!nextHome || !acquistiRoute || !dossierRoute || !rifornimentiRoute || !capoRoute || !acquistiDetailRoute) {
      throw new Error("Snapshot baseline incompleta: mancano alcune route del Prompt 59.");
    }

    const homeAccordion = makeStateObservation(
      "next-home",
      "quicklinks-accordion",
      "Quick link operativi",
      "card_state",
    );
    await observeState(page, {
      path: "/next",
      run: async (runtimePage) => {
        const toggle = runtimePage.locator(".quick-accordion-toggle").first();
        const wasOpen = (await toggle.getAttribute("aria-expanded").catch(() => null)) === "true";
        if (!wasOpen) {
          await toggle.click({ force: true });
          await waitForApp(runtimePage);
        }
        const runtimeData = await collectScreenSnapshot(runtimePage);
        runtimeData.finalPath = formatRuntimePath(new URL(runtimePage.url()));
        assignStateResult(
          homeAccordion,
          runtimeData,
          await writeScreenshot(runtimePage, `${toSafeFileName("next-home")}--${toSafeFileName("quicklinks-accordion")}.png`),
        );
        if (wasOpen) {
          homeAccordion.notes.push("Stato gia visibile nel render iniziale della schermata.");
        }
      },
    });
    setRouteState(nextHome, homeAccordion);

    const homeModal = makeStateObservation(
      "next-home",
      "important-events-modal",
      "Eventi importanti autisti",
      "dialog_state",
    );
    await observeState(page, {
      path: "/next",
      run: async (runtimePage) => {
        const trigger = runtimePage.locator('button:has-text("Vedi tutto")').first();
        await trigger.waitFor({ state: "visible", timeout: 4000 });
        const disabled = await trigger.getAttribute("disabled").catch(() => null);
        const ariaDisabled = await trigger.getAttribute("aria-disabled").catch(() => null);
        const cloneBlocked = await trigger.getAttribute("data-next-clone-blocked").catch(() => null);
        homeModal.finalPath = formatRuntimePath(new URL(runtimePage.url()));
        if (disabled !== null || ariaDisabled === "true" || cloneBlocked === "true") {
          homeModal.limitations.push(
            "Trigger visibile ma disabilitato dal guard rail read-only del clone.",
          );
        } else {
          homeModal.limitations.push("DA VERIFICARE: il trigger non risulta bloccato nel campione corrente.");
        }
      },
    });
    setRouteState(nextHome, homeModal);

    const acquistiMenu = makeStateObservation(
      "next-acquisti",
      "menu-ordine",
      "Menu ordine read-only",
      "menu_state",
    );
    await observeState(page, {
      path: "/next/acquisti",
      prepare: async (runtimePage) => {
        await runtimePage
          .locator('button:has-text("Ordini"), [role="tab"]:has-text("Ordini"), a:has-text("Ordini")')
          .first()
          .click({ force: true });
      },
      run: async (runtimePage) => {
        await runtimePage.locator(".acq-kebab-trigger").first().click({ force: true });
        await waitForApp(runtimePage);
        await runtimePage.locator(".acq-kebab-menu").first().waitFor({ state: "visible", timeout: 5000 });
        const runtimeData = await collectScreenSnapshot(runtimePage);
        runtimeData.finalPath = formatRuntimePath(new URL(runtimePage.url()));
        assignStateResult(
          acquistiMenu,
          runtimeData,
          await writeScreenshot(runtimePage, `${toSafeFileName("next-acquisti")}--${toSafeFileName("menu-ordine")}.png`),
        );
      },
    });
    setRouteState(acquistiRoute, acquistiMenu);

    const dossierLavori = makeStateObservation(
      "next-dossier-dettaglio",
      "modal-lavori-attesa",
      "Dossier - lavori in attesa",
      "dialog_state",
    );
    await observeState(page, {
      path: dossierRoute.finalPath || "/next/dossier/TI87448",
      run: async (runtimePage) => {
        await runtimePage
          .locator('.dossier-card .dossier-button:has-text("Mostra tutti")')
          .first()
          .click({ force: true });
        await waitForApp(runtimePage);
        await runtimePage.locator(".dossier-modal").first().waitFor({ state: "visible", timeout: 5000 });
        const runtimeData = await collectScreenSnapshot(runtimePage);
        runtimeData.finalPath = formatRuntimePath(new URL(runtimePage.url()));
        assignStateResult(
          dossierLavori,
          runtimeData,
          await writeScreenshot(runtimePage, `${toSafeFileName("next-dossier-dettaglio")}--${toSafeFileName("modal-lavori-attesa")}.png`),
        );
      },
    });
    setRouteState(dossierRoute, dossierLavori);

    const dossierFoto = makeStateObservation(
      "next-dossier-dettaglio",
      "foto-mezzo",
      "Dossier - foto mezzo",
      "dialog_state",
    );
    await observeState(page, {
      path: dossierRoute.finalPath || "/next/dossier/TI87448",
      run: async (runtimePage) => {
        await runtimePage.locator('[aria-label="Apri foto mezzo"]').first().click({ force: true });
        await waitForApp(runtimePage);
        await runtimePage.locator(".dossier-photo-modal").first().waitFor({ state: "visible", timeout: 5000 });
        const runtimeData = await collectScreenSnapshot(runtimePage);
        runtimeData.finalPath = formatRuntimePath(new URL(runtimePage.url()));
        assignStateResult(
          dossierFoto,
          runtimeData,
          await writeScreenshot(runtimePage, `${toSafeFileName("next-dossier-dettaglio")}--${toSafeFileName("foto-mezzo")}.png`),
        );
      },
    });
    setRouteState(dossierRoute, dossierFoto);

    const rifornimentiMese = makeStateObservation(
      "next-dossier-rifornimenti",
      "range-mese",
      "Rifornimenti - range mese",
      "filter_state",
      ["Probe eseguito su una targa del clone con rifornimenti reali visibili in runtime."],
    );
    await observeState(page, {
      path: "/next/dossier/TI313387/rifornimenti",
      run: async (runtimePage) => {
        await runtimePage.locator('button:has-text("MESE")').first().click({ force: true });
        await waitForApp(runtimePage);
        await runtimePage
          .locator('button.dossier-button.primary:has-text("MESE")')
          .first()
          .waitFor({ state: "visible", timeout: 5000 });
        const runtimeData = await collectScreenSnapshot(runtimePage);
        runtimeData.finalPath = formatRuntimePath(new URL(runtimePage.url()));
        assignStateResult(
          rifornimentiMese,
          runtimeData,
          await writeScreenshot(runtimePage, `${toSafeFileName("next-dossier-rifornimenti")}--${toSafeFileName("range-mese")}.png`),
        );
      },
    });
    setRouteState(rifornimentiRoute, rifornimentiMese);

    const rifornimenti12Mesi = makeStateObservation(
      "next-dossier-rifornimenti",
      "range-12-mesi",
      "Rifornimenti - range 12 mesi",
      "filter_state",
      ["Probe eseguito su una targa del clone con rifornimenti reali visibili in runtime."],
    );
    await observeState(page, {
      path: "/next/dossier/TI313387/rifornimenti",
      run: async (runtimePage) => {
        await runtimePage.locator('button:has-text("12 mesi")').first().click({ force: true });
        await waitForApp(runtimePage);
        await runtimePage
          .locator('button.dossier-button.primary:has-text("12 mesi")')
          .first()
          .waitFor({ state: "visible", timeout: 5000 });
        const runtimeData = await collectScreenSnapshot(runtimePage);
        runtimeData.finalPath = formatRuntimePath(new URL(runtimePage.url()));
        assignStateResult(
          rifornimenti12Mesi,
          runtimeData,
          await writeScreenshot(runtimePage, `${toSafeFileName("next-dossier-rifornimenti")}--${toSafeFileName("range-12-mesi")}.png`),
        );
      },
    });
    setRouteState(rifornimentiRoute, rifornimenti12Mesi);

    const capoToggle = makeStateObservation(
      "next-capo-costi-dettaglio",
      "capo-solo-da-valutare",
      "Capo - solo da valutare",
      "filter_state",
    );
    await observeState(page, {
      path: capoRoute.finalPath || "/next/capo/costi/TI313387",
      run: async (runtimePage) => {
        const toggle = runtimePage.locator(".capo-approvazioni-toggle input").first();
        const checked = await toggle.isChecked();
        if (!checked) {
          await toggle.click();
          await waitForApp(runtimePage);
        } else {
          capoToggle.notes.push("Stato gia visibile nel render iniziale della schermata.");
        }
        const runtimeData = await collectScreenSnapshot(runtimePage);
        runtimeData.finalPath = formatRuntimePath(new URL(runtimePage.url()));
        assignStateResult(
          capoToggle,
          runtimeData,
          await writeScreenshot(runtimePage, `${toSafeFileName("next-capo-costi-dettaglio")}--${toSafeFileName("capo-solo-da-valutare")}.png`),
        );
      },
    });
    setRouteState(capoRoute, capoToggle);

    await page.goto(new URL("/next/acquisti", baseUrl).toString(), {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForApp(page);
    await page
      .locator('button:has-text("Ordini"), [role="tab"]:has-text("Ordini"), a:has-text("Ordini")')
      .first()
      .click({ force: true });
    await waitForApp(page);
    await page.locator('button:has-text("Apri")').first().click({ force: true });
    await waitForApp(page);
    const acquistiDetailData = await collectScreenSnapshot(page);
    acquistiDetailData.finalPath = formatRuntimePath(new URL(page.url()));
    Object.assign(
      acquistiDetailRoute,
      acquistiDetailData,
      await writeScreenshot(page, `${toSafeFileName("next-acquisti-dettaglio")}.png`),
    );
    acquistiDetailRoute.status = classify(acquistiDetailData);
    acquistiDetailRoute.coverageLevel = "dynamic_route_resolved";
    acquistiDetailRoute.notes = [
      ...(acquistiDetailRoute.notes ?? []),
      "Route dinamica osservata nel micro-task Prompt 59 passando dal tab Ordini read-only.",
    ];
    acquistiDetailRoute.limitations = (acquistiDetailRoute.limitations ?? []).filter(
      (entry) => !String(entry).includes("Route dinamica non osservabile"),
    );

    snapshot.catalogVersion = INTERNAL_AI_NEXT_RUNTIME_OBSERVER_CATALOG_VERSION;
    snapshot.observedAt = new Date().toISOString();
    const routes = Array.isArray(snapshot.routes) ? snapshot.routes : [];
    const stateEntries = routes.flatMap((route) =>
      Array.isArray(route.stateObservations) ? route.stateObservations : [],
    );
    snapshot.routeCount = routes.length;
    snapshot.observedRouteCount = routes.filter((route) => route.status === "observed").length;
    snapshot.partialRouteCount = routes.filter((route) => route.status === "partial").length;
    snapshot.unavailableRouteCount = routes.filter((route) => route.status === "unavailable").length;
    snapshot.stateCount = stateEntries.length;
    snapshot.observedStateCount = stateEntries.filter((entry) => entry.status === "observed").length;
    snapshot.partialStateCount = stateEntries.filter((entry) => entry.status === "partial").length;
    snapshot.unavailableStateCount = stateEntries.filter((entry) => entry.status === "unavailable").length;
    snapshot.screenshotCount =
      routes.filter((route) => route.screenshotFileName).length +
      stateEntries.filter((entry) => entry.screenshotFileName).length;
    snapshot.status =
      snapshot.unavailableRouteCount === 0 &&
      snapshot.partialRouteCount === 0 &&
      snapshot.partialStateCount === 0 &&
      snapshot.unavailableStateCount === 0
        ? "observed"
        : "partial";
    snapshot.notes = [
      ...(snapshot.notes ?? []).filter(
        (entry) => !String(entry).includes("Catalogo observer:"),
      ),
      "Micro-refresh Prompt 59 eseguito solo sui gap residui con Playwright read-only.",
      `Catalogo observer: ${snapshot.catalogVersion}. Route osservate ${snapshot.observedRouteCount}/${snapshot.routeCount}, stati osservati ${snapshot.observedStateCount}/${snapshot.stateCount}.`,
    ];

    await writeNextRuntimeObserverSnapshot(snapshot);
    console.log(
      JSON.stringify(
        {
          ok: true,
          catalogVersion: snapshot.catalogVersion,
          observedAt: snapshot.observedAt,
          observedRouteCount: snapshot.observedRouteCount,
          routeCount: snapshot.routeCount,
          observedStateCount: snapshot.observedStateCount,
          stateCount: snapshot.stateCount,
          unavailableStateCount: snapshot.unavailableStateCount,
        },
        null,
        2,
      ),
    );
  } finally {
    await page.close().catch(() => null);
    await browser.close().catch(() => null);
  }
}

await main();
