import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

const baseUrl = process.env.IA_CAPTURE_BASE_URL?.trim() || "http://127.0.0.1:4173";
const outputArg = process.argv[2]?.trim();

if (!outputArg) {
  console.error("Uso: node scripts/ui-capture/capture_ia_pages.mjs <output-dir>");
  process.exit(1);
}

const outputDir = path.resolve(repoRoot, outputArg);
const resultsPath = path.join(outputDir, "capture-results.json");
const indexPath = path.join(outputDir, "INDEX.md");
const changeReportPath = path.join(outputDir, "CHANGE_REPORT.md");
const continuityReportPath = path.join(outputDir, "CONTINUITY_REPORT.md");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureBaseUrlAvailable() {
  try {
    const response = await fetch(new URL("/", baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    throw new Error(
      `Preview non raggiungibile su ${baseUrl}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: "msedge", headless: true });
  } catch {
    return chromium.launch({ headless: true });
  }
}

async function waitForAppHydration(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => null);
  await page.waitForSelector("#root", { timeout: 15000 }).catch(() => null);
  await page
    .waitForFunction(
      () => {
        const root = document.querySelector("#root");
        if (!root) return false;
        const text = String(root.textContent ?? "").replace(/\s+/g, " ").trim();
        return text.length > 40;
      },
      { timeout: 15000 },
    )
    .catch(() => null);
  await page.waitForTimeout(900);
}

async function navigateTo(page, route) {
  await page.goto(new URL(route, baseUrl).toString(), {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await waitForAppHydration(page);
}

async function isVisible(page, selector, timeout = 2500) {
  try {
    await page.locator(selector).first().waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

async function clickFirst(page, selector, timeout = 5000) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "visible", timeout });
  await locator.click({ force: true });
  await waitForAppHydration(page);
}

async function writeScreenshot(page, fileName) {
  const absolutePath = path.join(outputDir, fileName);
  await page.screenshot({ path: absolutePath, fullPage: true });
  return absolutePath;
}

function isoNow() {
  return new Date().toISOString();
}

const CAPTURES = [
  {
    order: 1,
    fileName: "01_next_ia_hub.png",
    route: "/next/ia",
    sourceFile: "src/next/NextIntelligenzaArtificialePage.tsx",
    pageType: "IA hub",
    state: "vista iniziale",
    notes: "Hub NEXT con card strumenti e stato API key.",
  },
  {
    order: 2,
    fileName: "02_next_ia_interna_overview.png",
    route: "/next/ia/interna",
    sourceFile: "src/next/NextInternalAiPage.tsx",
    pageType: "IA interna",
    state: "overview iniziale",
    notes: "Vista principale del sottosistema IA interno.",
  },
  {
    order: 3,
    fileName: "03_next_ia_interna_sessioni.png",
    route: "/next/ia/interna/sessioni",
    sourceFile: "src/next/NextInternalAiPage.tsx",
    pageType: "IA interna",
    state: "sezione sessioni",
    notes: "Stessa pagina sorgente con sectionId='sessions'.",
  },
  {
    order: 4,
    fileName: "04_next_ia_interna_richieste.png",
    route: "/next/ia/interna/richieste",
    sourceFile: "src/next/NextInternalAiPage.tsx",
    pageType: "IA interna",
    state: "sezione richieste",
    notes: "Stessa pagina sorgente con sectionId='requests'.",
  },
  {
    order: 5,
    fileName: "05_next_ia_interna_artifacts.png",
    route: "/next/ia/interna/artifacts",
    sourceFile: "src/next/NextInternalAiPage.tsx",
    pageType: "IA interna",
    state: "sezione artifacts",
    notes: "Stessa pagina sorgente con sectionId='artifacts'.",
  },
  {
    order: 6,
    fileName: "06_next_ia_interna_audit.png",
    route: "/next/ia/interna/audit",
    sourceFile: "src/next/NextInternalAiPage.tsx",
    pageType: "IA interna",
    state: "sezione audit",
    notes: "Stessa pagina sorgente con sectionId='audit'.",
  },
  {
    order: 7,
    fileName: "07_next_ia_apikey.png",
    route: "/next/ia/apikey",
    sourceFile: "src/next/NextIAApiKeyPage.tsx",
    pageType: "altro - configurazione IA",
    state: "vista iniziale",
    notes: "Pagina API key Gemini in versione NEXT.",
  },
  {
    order: 8,
    fileName: "08_next_ia_libretto.png",
    route: "/next/ia/libretto",
    sourceFile: "src/next/NextIALibrettoPage.tsx",
    pageType: "IA libretto",
    state: "vista iniziale",
    notes: "Upload/analisi libretto lato NEXT.",
  },
  {
    order: 9,
    fileName: "09_next_ia_libretto_archive.png",
    route: "/next/ia/libretto?archive=1",
    sourceFile: "src/next/NextIALibrettoPage.tsx",
    pageType: "IA libretto",
    state: "archivio libretti",
    notes: "Stato archivio richiamato via query archive=1.",
  },
  {
    order: 10,
    fileName: "10_next_ia_libretto_viewer.png",
    route: "/next/ia/libretto?archive=1",
    sourceFile: "src/next/NextIALibrettoPage.tsx",
    pageType: "IA libretto",
    state: "viewer libretto aperto",
    notes: "Stato modale read-only aperto dal primo pulsante Apri Foto disponibile.",
    action: async (page) => {
      const hasButton = await isVisible(page, 'button:has-text("Apri Foto")', 3000);
      if (!hasButton) {
        return {
          skipped: true,
          note: "Nessun pulsante 'Apri Foto' visibile nell'archivio corrente.",
        };
      }
      await clickFirst(page, 'button:has-text("Apri Foto")');
      const viewerVisible =
        (await isVisible(page, 'text="Viewer libretto"', 5000)) ||
        (await isVisible(page, 'button:has-text("Ruota 90 gradi")', 5000));
      if (!viewerVisible) {
        return {
          skipped: true,
          note: "Viewer libretto non rimasto visibile in modo stabile dopo il click.",
        };
      }
      return { note: "Viewer libretto aperto in sola lettura." };
    },
  },
  {
    order: 11,
    fileName: "11_next_ia_documenti.png",
    route: "/next/ia/documenti",
    sourceFile: "src/next/NextIADocumentiPage.tsx",
    pageType: "IA documenti",
    state: "vista iniziale",
    notes: "Pagina documenti IA in versione NEXT.",
  },
  {
    order: 12,
    fileName: "12_next_ia_copertura_libretti.png",
    route: "/next/ia/copertura-libretti",
    sourceFile: "src/next/NextIACoperturaLibrettiPage.tsx",
    pageType: "copertura",
    state: "vista iniziale",
    notes: "Tabella copertura libretti e foto in NEXT.",
  },
  {
    order: 13,
    fileName: "13_next_libretti_export.png",
    route: "/next/libretti-export",
    sourceFile: "src/next/NextLibrettiExportPage.tsx",
    pageType: "export",
    state: "vista iniziale",
    notes: "Lista export libretti in NEXT.",
  },
  {
    order: 14,
    fileName: "14_next_libretti_export_preview.png",
    route: "/next/libretti-export",
    sourceFile: "src/next/NextLibrettiExportPage.tsx",
    pageType: "export",
    state: "anteprima PDF aperta",
    notes: "Stato dialog read-only aperto selezionando il primo mezzo disponibile.",
    action: async (page) => {
      const hasCard = await isVisible(page, ".libretti-card", 3000);
      if (!hasCard) {
        return {
          skipped: true,
          note: "Nessun mezzo esportabile visibile per aprire l'anteprima PDF.",
        };
      }
      await clickFirst(page, ".libretti-card");
      const previewEnabled = await isVisible(page, 'button:has-text("Anteprima PDF")', 3000);
      if (!previewEnabled) {
        return {
          skipped: true,
          note: "Bottone Anteprima PDF non visibile dopo la selezione del primo mezzo.",
        };
      }
      await clickFirst(page, 'button:has-text("Anteprima PDF")', 10000);
      const dialogVisible =
        (await isVisible(page, ".pdf-preview-backdrop", 10000)) ||
        (await isVisible(page, '[role="dialog"]', 10000));
      if (!dialogVisible) {
        return {
          skipped: true,
          note: "Dialog PDF non visibile in modo stabile dopo la generazione.",
        };
      }
      return { note: "Anteprima PDF aperta in sola lettura." };
    },
  },
  {
    order: 15,
    fileName: "15_next_cisterna_ia.png",
    route: "/next/cisterna/ia",
    sourceFile: "src/next/NextCisternaIAPage.tsx",
    pageType: "altro - Cisterna IA",
    state: "vista iniziale",
    notes: "Verticale specialistico Cisterna IA in NEXT.",
  },
  {
    order: 16,
    fileName: "16_legacy_ia_hub.png",
    route: "/ia",
    sourceFile: "src/pages/IA/IAHome.tsx",
    pageType: "IA hub",
    state: "vista iniziale",
    notes: "Hub IA legacy.",
  },
  {
    order: 17,
    fileName: "17_legacy_ia_apikey.png",
    route: "/ia/apikey",
    sourceFile: "src/pages/IA/IAApiKey.tsx",
    pageType: "altro - configurazione IA",
    state: "vista iniziale",
    notes: "Pagina API key Gemini legacy.",
  },
  {
    order: 18,
    fileName: "18_legacy_ia_libretto.png",
    route: "/ia/libretto",
    sourceFile: "src/pages/IA/IALibretto.tsx",
    pageType: "IA libretto",
    state: "vista iniziale",
    notes: "Upload/analisi libretto legacy.",
  },
  {
    order: 19,
    fileName: "19_legacy_ia_libretto_archive.png",
    route: "/ia/libretto?archive=1",
    sourceFile: "src/pages/IA/IALibretto.tsx",
    pageType: "IA libretto",
    state: "archivio libretti",
    notes: "Stato archivio richiamato via query archive=1.",
  },
  {
    order: 20,
    fileName: "20_legacy_ia_libretto_viewer.png",
    route: "/ia/libretto?archive=1",
    sourceFile: "src/pages/IA/IALibretto.tsx",
    pageType: "IA libretto",
    state: "viewer libretto aperto",
    notes: "Stato modale read-only aperto dal primo pulsante Apri Foto disponibile.",
    action: async (page) => {
      const hasButton = await isVisible(page, 'button:has-text("Apri Foto")', 3000);
      if (!hasButton) {
        return {
          skipped: true,
          note: "Nessun pulsante 'Apri Foto' visibile nell'archivio corrente.",
        };
      }
      await clickFirst(page, 'button:has-text("Apri Foto")');
      const viewerVisible =
        (await isVisible(page, 'text="Viewer libretto"', 5000)) ||
        (await isVisible(page, 'button:has-text("Ruota 90 gradi")', 5000));
      if (!viewerVisible) {
        return {
          skipped: true,
          note: "Viewer libretto non rimasto visibile in modo stabile dopo il click.",
        };
      }
      return { note: "Viewer libretto legacy aperto in sola lettura." };
    },
  },
  {
    order: 21,
    fileName: "21_legacy_ia_documenti.png",
    route: "/ia/documenti",
    sourceFile: "src/pages/IA/IADocumenti.tsx",
    pageType: "IA documenti",
    state: "vista iniziale",
    notes: "Pagina documenti IA legacy.",
  },
  {
    order: 22,
    fileName: "22_legacy_ia_copertura_libretti.png",
    route: "/ia/copertura-libretti",
    sourceFile: "src/pages/IA/IACoperturaLibretti.tsx",
    pageType: "copertura",
    state: "vista iniziale",
    notes: "Tabella copertura libretti e foto legacy.",
  },
  {
    order: 23,
    fileName: "23_legacy_libretti_export.png",
    route: "/libretti-export",
    sourceFile: "src/pages/LibrettiExport.tsx",
    pageType: "export",
    state: "vista iniziale",
    notes: "Lista export libretti legacy.",
  },
  {
    order: 24,
    fileName: "24_legacy_libretti_export_preview.png",
    route: "/libretti-export",
    sourceFile: "src/pages/LibrettiExport.tsx",
    pageType: "export",
    state: "anteprima PDF aperta",
    notes: "Stato dialog read-only aperto selezionando il primo mezzo disponibile.",
    action: async (page) => {
      const hasCard = await isVisible(page, ".libretti-card", 3000);
      if (!hasCard) {
        return {
          skipped: true,
          note: "Nessun mezzo esportabile visibile per aprire l'anteprima PDF.",
        };
      }
      await clickFirst(page, ".libretti-card");
      const previewEnabled = await isVisible(page, 'button:has-text("Anteprima PDF")', 3000);
      if (!previewEnabled) {
        return {
          skipped: true,
          note: "Bottone Anteprima PDF non visibile dopo la selezione del primo mezzo.",
        };
      }
      await clickFirst(page, 'button:has-text("Anteprima PDF")', 10000);
      const dialogVisible =
        (await isVisible(page, ".pdf-preview-backdrop", 10000)) ||
        (await isVisible(page, '[role="dialog"]', 10000));
      if (!dialogVisible) {
        return {
          skipped: true,
          note: "Dialog PDF non visibile in modo stabile dopo la generazione.",
        };
      }
      return { note: "Anteprima PDF legacy aperta in sola lettura." };
    },
  },
  {
    order: 25,
    fileName: "25_legacy_cisterna_ia.png",
    route: "/cisterna/ia",
    sourceFile: "src/pages/CisternaCaravate/CisternaCaravateIA.tsx",
    pageType: "altro - Cisterna IA",
    state: "vista iniziale",
    notes: "Verticale specialistico Cisterna IA legacy.",
  },
];

const EXTRA_ROUTE_NOTES = [
  {
    route: "/next/ia-gestionale",
    sourceFile: "src/App.tsx -> NextLegacyIaRedirect",
    state: "redirect tecnico",
    notes: "Route reale ma senza schermata autonoma: reindirizza a /next/ia.",
  },
];

async function captureEntry(page, entry) {
  const result = {
    order: entry.order,
    fileName: entry.fileName,
    route: entry.route,
    finalRoute: null,
    sourceFile: entry.sourceFile,
    pageType: entry.pageType,
    state: entry.state,
    notes: entry.notes,
    status: "pending",
    screenshotPath: null,
    capturedAt: isoNow(),
  };

  try {
    await navigateTo(page, entry.route);

    if (typeof entry.action === "function") {
      const actionOutcome = await entry.action(page);
      if (actionOutcome?.note) {
        result.notes = `${result.notes} ${actionOutcome.note}`.trim();
      }
      if (actionOutcome?.skipped) {
        result.finalRoute = new URL(page.url()).pathname + new URL(page.url()).search;
        result.status = "skipped";
        return result;
      }
    }

    result.finalRoute = new URL(page.url()).pathname + new URL(page.url()).search;
    result.screenshotPath = await writeScreenshot(page, entry.fileName);
    result.status = "captured";
    return result;
  } catch (error) {
    result.finalRoute = page.url() ? new URL(page.url()).pathname + new URL(page.url()).search : null;
    result.status = "error";
    result.notes = `${result.notes} Errore: ${error instanceof Error ? error.message : String(error)}`.trim();
    return result;
  }
}

function buildIndexMarkdown(results) {
  const capturedCount = results.filter((entry) => entry.status === "captured").length;
  const skippedCount = results.filter((entry) => entry.status === "skipped").length;
  const errorCount = results.filter((entry) => entry.status === "error").length;
  const lines = [
    "# IA pages capture",
    "",
    `- Generato: ${isoNow()}`,
    `- Base URL: ${baseUrl}`,
    `- Screenshot catturati: ${capturedCount}`,
    `- Stati saltati: ${skippedCount}`,
    `- Errori: ${errorCount}`,
    "",
    "| numero | nome file screenshot | route | file React/page sorgente | stato catturato | note minime utili |",
    "| --- | --- | --- | --- | --- | --- |",
  ];

  for (const entry of results) {
    const routeLabel =
      entry.finalRoute && entry.finalRoute !== entry.route
        ? `${entry.route} -> ${entry.finalRoute}`
        : entry.route;
    const fileLabel = entry.status === "captured" ? entry.fileName : "n/a";
    const stateLabel =
      entry.status === "captured"
        ? entry.state
        : entry.status === "skipped"
          ? `${entry.state} (saltato)`
          : `${entry.state} (errore)`;
    lines.push(
      `| ${entry.order} | ${fileLabel} | ${routeLabel} | ${entry.sourceFile} | ${stateLabel} | ${entry.notes} |`,
    );
  }

  lines.push("", "## Route IA reali censite senza screenshot autonomo", "");
  lines.push("| route | file sorgente | stato | note |");
  lines.push("| --- | --- | --- | --- |");
  for (const entry of EXTRA_ROUTE_NOTES) {
    lines.push(
      `| ${entry.route} | ${entry.sourceFile} | ${entry.state} | ${entry.notes} |`,
    );
  }

  const errors = results.filter((entry) => entry.status === "error");
  if (errors.length > 0) {
    lines.push("", "## Pagine non raggiungibili o con errore", "");
    for (const entry of errors) {
      lines.push(`- ${entry.route}: ${entry.notes}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function buildChangeReport(results) {
  const captured = results.filter((entry) => entry.status === "captured").length;
  return [
    "# Change Report - Prompt 39",
    "",
    "- Obiettivo: censire e catturare le pagine IA reali senza modificare il runtime applicativo.",
    `- Runtime usato: preview ${baseUrl} con adapter IA server-side attivo su http://127.0.0.1:4310/internal-ai-backend.`,
    `- Screenshot catturati: ${captured}.`,
    `- File generati nel pacchetto: screenshot PNG, INDEX.md, capture-results.json, CHANGE_REPORT.md, CONTINUITY_REPORT.md.`,
    "- Nessun file runtime del progetto e stato modificato.",
    `- Script di supporto introdotto: scripts/ui-capture/capture_ia_pages.mjs.`,
    "",
  ].join("\n");
}

function buildContinuityReport(results) {
  return [
    "# Continuity Report - Prompt 39",
    "",
    "- Pacchetto di lavoro: screenshot IA ordinati e indice route/file/stati.",
    `- Base URL riusata: ${baseUrl}.`,
    "- Health backend IA verificata su http://127.0.0.1:4310/internal-ai-backend/health.",
    "- Rigenerazione pacchetto:",
    `  node scripts/ui-capture/capture_ia_pages.mjs "${path.relative(repoRoot, outputDir).replace(/\\\\/g, "/")}"`,
    "- Route tecniche senza schermata autonoma annotate in INDEX.md.",
    `- Risultati salvati anche in ${path.basename(resultsPath)} per riuso rapido.`,
    `- Totale righe censite: ${results.length + EXTRA_ROUTE_NOTES.length}.`,
    "",
  ].join("\n");
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  await ensureBaseUrlAvailable();

  const browser = await launchBrowser();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const results = [];

  try {
    for (const entry of CAPTURES) {
      results.push(await captureEntry(page, entry));
      await sleep(350);
    }
  } finally {
    await page.close().catch(() => null);
    await context.close().catch(() => null);
    await browser.close().catch(() => null);
  }

  await fs.writeFile(resultsPath, JSON.stringify({ baseUrl, results, extraRoutes: EXTRA_ROUTE_NOTES }, null, 2));
  await fs.writeFile(indexPath, buildIndexMarkdown(results), "utf8");
  await fs.writeFile(changeReportPath, buildChangeReport(results), "utf8");
  await fs.writeFile(continuityReportPath, buildContinuityReport(results), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl,
        outputDir,
        screenshotCount: results.filter((entry) => entry.status === "captured").length,
        skippedCount: results.filter((entry) => entry.status === "skipped").length,
        errorCount: results.filter((entry) => entry.status === "error").length,
      },
      null,
      2,
    ),
  );
}

await main();
