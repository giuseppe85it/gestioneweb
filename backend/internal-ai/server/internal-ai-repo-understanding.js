import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildFirebaseReadinessSnapshot } from "./internal-ai-firebase-readiness.js";
import {
  INTERNAL_AI_NEXT_UI_INTEGRATION_GUIDANCE,
  readNextRuntimeObserverSnapshot,
} from "./internal-ai-next-runtime-observer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const CURATED_DOCUMENTS = [
  {
    path: "docs/STATO_ATTUALE_PROGETTO.md",
    title: "Stato attuale del progetto",
    category: "stato",
  },
  {
    path: "docs/STRUTTURA_COMPLETA_GESTIONALE.md",
    title: "Struttura completa del gestionale",
    category: "architettura",
  },
  {
    path: "docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md",
    title: "Nuova struttura gestionale",
    category: "architettura",
  },
  {
    path: "docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md",
    title: "Linee guida sottosistema IA interna",
    category: "architettura",
  },
  {
    path: "docs/product/STATO_MIGRAZIONE_NEXT.md",
    title: "Stato migrazione NEXT",
    category: "ui",
  },
];

const CURATED_MODULE_AREAS = [
  {
    id: "next-shell",
    label: "Shell NEXT clone read-only",
    summary:
      "Punto di ingresso clone-side del gestionale, con route /next/*, macro-aree coerenti con la madre e blocco scritture attivo.",
    routePaths: ["/next", "/next/centro-controllo", "/next/gestione-operativa", "/next/ia/interna"],
    sourcePaths: ["src/next/NextShell.tsx", "src/next/nextStructuralPaths.ts"],
  },
  {
    id: "centro-controllo",
    label: "Centro di Controllo",
    summary:
      "Cockpit operativo che aggrega alert, manutenzioni, rifornimenti e richieste, con pattern tabellare e preview PDF.",
    routePaths: ["/next/centro-controllo"],
    sourcePaths: ["src/pages/CentroControllo.tsx", "src/components/PdfPreviewModal.tsx"],
  },
  {
    id: "dossier-mezzo",
    label: "Dossier Mezzo",
    summary:
      "Area detail-first mezzo-centrica che converge anagrafica, operativita tecnica, documenti, costi e collegamenti verso analisi.",
    routePaths: ["/next/dossiermezzi", "/next/dossier/:targa"],
    sourcePaths: ["src/pages/DossierMezzo.tsx", "src/next/nextStructuralPaths.ts"],
  },
  {
    id: "analisi-economica",
    label: "Analisi Economica",
    summary:
      "Vista di lettura economica del mezzo con indicatori, filtri e supporti documentali read-only coerenti con il dossier.",
    routePaths: ["/next/analisi-economica/:targa"],
    sourcePaths: ["src/pages/AnalisiEconomica.tsx", "src/next/nextStructuralPaths.ts"],
  },
  {
    id: "ia-interna",
    label: "IA interna controllata",
    summary:
      "Sottosistema isolato sotto /next/ia/interna* con preview-first, fallback espliciti, artifact dedicati e backend separato.",
    routePaths: [
      "/next/ia/interna",
      "/next/ia/interna/sessioni",
      "/next/ia/interna/richieste",
      "/next/ia/interna/artifacts",
      "/next/ia/interna/audit",
    ],
    sourcePaths: [
      "src/next/NextInternalAiPage.tsx",
      "src/next/internal-ai/internalAiContracts.ts",
      "backend/internal-ai/server/internal-ai-adapter.js",
    ],
  },
  {
    id: "next-runtime-observer",
    label: "Osservatore runtime NEXT",
    summary:
      "Crawl read-only delle route /next/* con screenshot, DOM snapshot controllato, stati whitelistati e mapping verso i file sorgente candidati.",
    routePaths: [
      "/next",
      "/next/centro-controllo",
      "/next/gestione-operativa",
      "/next/mezzi",
      "/next/dossiermezzi",
      "/next/ia/interna",
    ],
    sourcePaths: [
      "scripts/internal-ai-observe-next-runtime.mjs",
      "backend/internal-ai/server/internal-ai-next-runtime-observer.js",
    ],
  },
  {
    id: "pdf-preview",
    label: "Preview PDF e output leggibili",
    summary:
      "Pattern trasversale di anteprima, con modal dedicate, azioni di condivisione e separazione tra preview e scrittura business.",
    routePaths: [],
    sourcePaths: ["src/components/PdfPreviewModal.tsx", "src/next/NextPdfPreviewModal.tsx"],
  },
];

const CURATED_UI_PATTERNS = [
  {
    id: "shell-clone-readonly",
    label: "Shell clone read-only",
    summary:
      "La NEXT replica il perimetro della madre ma neutralizza writer e side effect, mantenendo route e struttura riconoscibili.",
    representativePaths: ["src/next/NextShell.tsx", "docs/product/STATO_MIGRAZIONE_NEXT.md"],
  },
  {
    id: "cockpit-operativo",
    label: "Cockpit operativo",
    summary:
      "Centro di Controllo usa blocchi di sintesi, tabelle operative e preview PDF come pattern di lettura trasversale.",
    representativePaths: ["src/pages/CentroControllo.tsx", "src/components/PdfPreviewModal.tsx"],
  },
  {
    id: "detail-first-dossier",
    label: "Dossier detail-first",
    summary:
      "Le viste mezzo-centriche partono dal dettaglio del mezzo e aggregano blocchi tematici collegati, senza nascondere limiti o fonti.",
    representativePaths: ["src/pages/DossierMezzo.tsx", "src/pages/AnalisiEconomica.tsx"],
  },
  {
    id: "preview-first-ia",
    label: "Preview-first IA interna",
    summary:
      "La IA interna mostra anteprime, limiti e fallback espliciti, con niente scritture business e niente autonomia di patch.",
    representativePaths: ["src/next/NextInternalAiPage.tsx", "backend/internal-ai/server/internal-ai-adapter.js"],
  },
  {
    id: "next-runtime-readonly",
    label: "Osservazione runtime NEXT read-only",
    summary:
      "La nuova IA puo vedere schermate NEXT reali a runtime tramite osservazione read-only e interazioni whitelist-safe, senza click distruttivi e senza uscire dal perimetro /next/*.",
    representativePaths: [
      "scripts/internal-ai-observe-next-runtime.mjs",
      "backend/internal-ai/server/internal-ai-next-runtime-observer.js",
    ],
  },
  {
    id: "modal-pdf-preview",
    label: "Modal preview documentale",
    summary:
      "Le anteprime documentali e PDF usano modal dedicate e azioni utente esplicite, non side effect automatici.",
    representativePaths: ["src/components/PdfPreviewModal.tsx", "src/next/NextPdfPreviewModal.tsx"],
  },
];

const CURATED_SCREEN_RELATIONS = [
  {
    from: "/next",
    to: "/next/centro-controllo",
    summary: "La home clone indirizza il cockpit operativo come vista di regia giornaliera.",
  },
  {
    from: "/next/dossiermezzi",
    to: "/next/dossier/:targa",
    summary: "La lista dossier porta al dettaglio del mezzo, che e il cuore del flusso mezzo-centrico.",
  },
  {
    from: "/next/dossier/:targa",
    to: "/next/analisi-economica/:targa",
    summary: "Il dossier collega la vista economica del mezzo come estensione read-only specializzata.",
  },
  {
    from: "/next/ia/interna",
    to: "/next/ia/interna/artifacts",
    summary: "La preview IA alimenta l'archivio artifact dedicato e separato dai dataset business.",
  },
  {
    from: "/next/ia/interna",
    to: "/next/ia/interna/audit",
    summary: "Ogni capability IA interna deve lasciare tracce leggibili e reversibili nel perimetro audit dedicato.",
  },
  {
    from: "/next/gestione-operativa",
    to: "/next/acquisti",
    summary: "Il workbench operativo globale instrada il procurement sulle route dedicate, senza comprimere tutto in una sola pagina hub.",
  },
  {
    from: "/next/gestione-operativa",
    to: "/next/lavori-in-attesa",
    summary: "Le code lavori vivono come route autonome leggibili e non piu solo come sotto-stato di una pagina globale.",
  },
  {
    from: "/next/acquisti",
    to: "/next/dettaglio-ordine/:ordineId",
    summary: "Il procurement apre il dettaglio ordine come vista propria read-only, distinta dal tab principale.",
  },
  {
    from: "/next/capo/mezzi",
    to: "/next/capo/costi/:targa",
    summary: "L'area capo parte dall'overview mezzi e apre il drill-down costi per targa come route dedicata.",
  },
  {
    from: "/next/autisti-inbox",
    to: "/next/autisti-inbox/segnalazioni",
    summary: "La inbox autisti si estende in listati specializzati per segnalazioni, controlli, gomme e richieste attrezzature.",
  },
  {
    from: "/next/ia",
    to: "/next/ia/libretto",
    summary: "L'hub IA clone-safe instrada verso strumenti documentali e viewer dedicati, non verso un'unica pagina monolitica.",
  },
  {
    from: "/next/cisterna",
    to: "/next/cisterna/ia",
    summary: "Il verticale cisterna apre un sottopercorso specialistico IA separato dal cockpit generale e dal dossier standard.",
  },
  {
    from: "/next/cisterna",
    to: "/next/cisterna/schede-test",
    summary: "La route schede test estende la verticale cisterna con query state di mese, mantenendo bloccati upload e save.",
  },
];

const CURATED_ROUTES = [
  { label: "Home NEXT", path: "/next", summary: "Ingresso clone read-only del gestionale." },
  {
    label: "Centro di Controllo",
    path: "/next/centro-controllo",
    summary: "Cockpit operativo, scadenze e preview PDF.",
  },
  {
    label: "Dossier lista mezzi",
    path: "/next/dossiermezzi",
    summary: "Lista mezzi e ingresso alle viste mezzo-centriche.",
  },
  {
    label: "Dossier mezzo",
    path: "/next/dossier/:targa",
    summary: "Vista detail-first del mezzo con convergenze operative.",
  },
  {
    label: "Analisi economica",
    path: "/next/analisi-economica/:targa",
    summary: "Vista economica dedicata del mezzo.",
  },
  {
    label: "IA interna overview",
    path: "/next/ia/interna",
    summary: "Chat controllata, preview report e capability IA isolate.",
  },
  {
    label: "Gestione Operativa",
    path: "/next/gestione-operativa",
    summary: "Hub operativo globale con pagine figlie autonome per stock, procurement e backlog lavori.",
  },
  {
    label: "Acquisti",
    path: "/next/acquisti",
    summary: "Workbench procurement read-only con tab, menu e route dettaglio dedicate.",
  },
  {
    label: "Dettaglio ordine",
    path: "/next/dettaglio-ordine/:ordineId",
    summary: "Drill-down ordine standalone osservabile in sola lettura dalle code procurement.",
  },
  {
    label: "Lavori in attesa",
    path: "/next/lavori-in-attesa",
    summary: "Lista globale lavori aperti con percorso dedicato al dettaglio.",
  },
  {
    label: "Dettaglio lavoro",
    path: "/next/dettagliolavori/:lavoroId",
    summary: "Drill-down del singolo lavoro raggiunto dalle liste globali clone-safe.",
  },
  {
    label: "Area Capo",
    path: "/next/capo/mezzi",
    summary: "Overview mezzi area capo con accesso al drill-down costi per targa.",
  },
  {
    label: "Capo costi mezzo",
    path: "/next/capo/costi/:targa",
    summary: "Vista costi per targa con tab, filtri e preview non scriventi.",
  },
  {
    label: "Autisti Inbox",
    path: "/next/autisti-inbox",
    summary: "Inbox autisti clone-safe con menu, modali dettaglio e listati dedicati.",
  },
  {
    label: "Autisti Segnalazioni",
    path: "/next/autisti-inbox/segnalazioni",
    summary: "Listato specializzato segnalazioni autisti con accordion, foto e preview PDF.",
  },
  {
    label: "Autisti Admin",
    path: "/next/autisti-admin",
    summary: "Centro rettifica reader-first con tab e filtri locali, senza write business.",
  },
  {
    label: "IA API key",
    path: "/next/ia/apikey",
    summary: "Pagina legacy-clone osservabile con toggle locale, senza segreti reali lato client.",
  },
  {
    label: "IA Libretto archivio",
    path: "/next/ia/libretto?archive=1",
    summary: "Viewer archivio libretti osservabile in GET-only con query state esplicito.",
  },
  {
    label: "Libretti Export",
    path: "/next/libretti-export",
    summary: "Perimetro export PDF clone-safe separato dall'hub IA.",
  },
  {
    label: "Cisterna",
    path: "/next/cisterna",
    summary: "Verticale specialistico con month picker, tab report e sottoroute dedicate.",
  },
  {
    label: "Cisterna IA",
    path: "/next/cisterna/ia",
    summary: "Sottoroute specialistica IA della verticale cisterna, osservata in sola lettura.",
  },
  {
    label: "Cisterna Schede Test",
    path: "/next/cisterna/schede-test",
    summary: "Route specialistica con query month e superficie edit ancora esclusa dal perimetro safe.",
  },
];

const CURATED_FILES = [
  "src/next/NextShell.tsx",
  "src/pages/Home.tsx",
  "src/pages/CentroControllo.tsx",
  "src/pages/DossierMezzo.tsx",
  "src/pages/AnalisiEconomica.tsx",
  "src/components/PdfPreviewModal.tsx",
  "src/next/NextPdfPreviewModal.tsx",
  "src/next/NextInternalAiPage.tsx",
  "src/next/nextStructuralPaths.ts",
  "scripts/internal-ai-observe-next-runtime.mjs",
  "backend/internal-ai/server/internal-ai-next-runtime-observer.js",
];

const REPO_ZONES = [
  {
    id: "next_clone",
    label: "NEXT clone",
    summary:
      "Perimetro clone-side read-only dove la scrittura resta ammessa solo per evoluzioni controllate del clone e del sottosistema IA.",
    rootPaths: ["src/next"],
    writePolicy: "next_backend_docs_only",
  },
  {
    id: "legacy_madre",
    label: "Madre legacy",
    summary:
      "Codice applicativo storico leggibile per comprensione e mappatura, ma non modificabile dai task della nuova IA interna.",
    rootPaths: ["src/pages"],
    writePolicy: "read_only_for_ai",
  },
  {
    id: "shared_ui",
    label: "UI condivisa",
    summary:
      "Componenti condivisi tra madre e NEXT utili per capire pattern visuali, modal e comportamenti riusati.",
    rootPaths: ["src/components"],
    writePolicy: "read_only_for_ai",
  },
  {
    id: "backend_internal_ai",
    label: "Backend IA separato",
    summary:
      "Adapter, persistenza e retrieval controllati del nuovo sottosistema IA interno, separati dai runtime legacy.",
    rootPaths: ["backend/internal-ai"],
    writePolicy: "next_backend_docs_only",
  },
  {
    id: "docs",
    label: "Documentazione di governo",
    summary:
      "Documenti di stato, architettura e tracciabilita usati come fonte di verita per il repo understanding controllato.",
    rootPaths: ["docs"],
    writePolicy: "next_backend_docs_only",
  },
];

const LEGACY_NEXT_RELATIONS = [
  {
    id: "shell-perimeter",
    label: "Perimetro shell madre vs NEXT",
    legacyPaths: ["src/pages/Home.tsx", "src/pages/CentroControllo.tsx"],
    nextPaths: ["src/next/NextShell.tsx", "src/next/nextStructuralPaths.ts"],
    summary:
      "La NEXT replica il perimetro di navigazione del gestionale senza diventare il runtime canonico della madre, mantenendo blocco scritture e routing dedicato sotto /next/*.",
  },
  {
    id: "dossier-analisi",
    label: "Vista mezzo-centrica e analisi economica",
    legacyPaths: ["src/pages/DossierMezzo.tsx", "src/pages/AnalisiEconomica.tsx"],
    nextPaths: ["src/next/nextStructuralPaths.ts"],
    summary:
      "Dossier e analisi economica restano fonti madre da leggere e mappare, mentre la NEXT mantiene il perimetro clone-side e il backend IA usa solo layer controllati o snapshot dedicati.",
  },
  {
    id: "ia-overlay",
    label: "IA interna come overlay isolato",
    legacyPaths: ["src/pages/IA/IAHome.tsx", "src/pages/IA/IADocumenti.tsx"],
    nextPaths: ["src/next/NextInternalAiPage.tsx", "backend/internal-ai/server/internal-ai-adapter.js"],
    summary:
      "La nuova IA interna non riusa il runtime legacy come backend canonico: legge il legacy solo come riferimento tecnico e usa un backend separato con guardrail propri.",
  },
];

const CONTROLLED_SCAN_SPECS = [
  { zoneId: "next_clone", rootPath: "src/next", maxFiles: 80 },
  { zoneId: "legacy_madre", rootPath: "src/pages", maxFiles: 80 },
  { zoneId: "shared_ui", rootPath: "src/components", maxFiles: 60 },
  { zoneId: "backend_internal_ai", rootPath: "backend/internal-ai", maxFiles: 60 },
];

const ALLOWED_FILE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".css", ".md"]);

const REPO_UNDERSTANDING_KEYWORDS = [
  "repository",
  "repo",
  "modulo",
  "moduli",
  "pagina",
  "pagine",
  "schermata",
  "schermate",
  "ui",
  "interfaccia",
  "layout",
  "componente",
  "componenti",
  "shell",
  "route",
  "percorso",
  "pattern",
  "dossier",
  "centro controllo",
  "analisi economica",
  "stile",
  "css",
  "convenzioni visive",
  "semplificare il gestionale",
  "madre",
  "next",
  "firestore",
  "storage",
  "firebase",
  "modale",
  "tab",
  "card",
  "bottone",
  "integrazione",
  "runtime",
];

function compactLine(line) {
  return line
    .replace(/^#+\s*/g, "")
    .replace(/^[-*]\s+/g, "")
    .replace(/`/g, "")
    .trim();
}

function inferFramework(relativePath) {
  if (relativePath.endsWith(".tsx")) {
    return "react";
  }
  if (relativePath.endsWith(".css")) {
    return "css";
  }
  if (relativePath.endsWith(".md")) {
    return "markdown";
  }
  if (relativePath.endsWith(".js")) {
    return "node";
  }
  if (relativePath.endsWith(".ts")) {
    return "typescript";
  }
  return "other";
}

function inferFileKind(relativePath, zoneId) {
  if (relativePath.endsWith(".css")) {
    return "style";
  }
  if (relativePath.endsWith(".md")) {
    return "document";
  }
  if (zoneId === "backend_internal_ai") {
    return "backend";
  }
  if (
    relativePath.includes("StructuralPaths") ||
    relativePath.endsWith("nextStructuralPaths.ts") ||
    relativePath.endsWith("NextShell.tsx")
  ) {
    return "routing";
  }
  if (zoneId === "legacy_madre") {
    return "page";
  }
  if (zoneId === "shared_ui") {
    return "component";
  }
  if (relativePath.includes("/internal-ai/")) {
    return "support";
  }
  if (relativePath.endsWith("Page.tsx")) {
    return "page";
  }
  return "support";
}

function inferUiRole(relativePath, kind, zoneId) {
  if (zoneId === "next_clone" && relativePath.endsWith("NextInternalAiPage.tsx")) {
    return "Pagina IA interna controllata";
  }
  if (kind === "style") {
    return "Foglio stile collegato a UI o shell";
  }
  if (kind === "routing") {
    return "Mappa route o shell di ingresso";
  }
  if (kind === "page") {
    return zoneId === "legacy_madre"
      ? "Pagina madre leggibile per mappatura"
      : "Pagina clone o UI dedicata";
  }
  if (kind === "component") {
    return "Componente UI riusabile";
  }
  if (kind === "backend") {
    return "Adapter o servizio del backend IA separato";
  }
  if (kind === "document") {
    return "Documento di supporto al repo understanding";
  }
  return "Supporto tecnico o contratto di contesto";
}

function findRelatedRoutePaths(relativePath) {
  const routes = new Set();

  for (const area of CURATED_MODULE_AREAS) {
    const matchesArea = area.sourcePaths.some((sourcePath) => {
      if (relativePath === sourcePath) {
        return true;
      }

      const sourceDir = sourcePath.includes("/") ? sourcePath.slice(0, sourcePath.lastIndexOf("/")) : sourcePath;
      return sourceDir && relativePath.startsWith(`${sourceDir}/`);
    });

    if (matchesArea) {
      area.routePaths.forEach((routePath) => routes.add(routePath));
    }
  }

  return Array.from(routes);
}

function resolveImportedCssPaths(relativePath, content) {
  if (!content || !/\.(ts|tsx|js)$/.test(relativePath)) {
    return [];
  }

  const directory = path.posix.dirname(relativePath.replace(/\\/g, "/"));
  const imports = new Set();
  const regex = /import\s+["']([^"']+\.css)["'];?/g;
  let match = regex.exec(content);

  while (match) {
    const importPath = match[1];
    const resolved = path.posix.normalize(path.posix.join(directory, importPath));
    imports.add(resolved);
    match = regex.exec(content);
  }

  return Array.from(imports);
}

async function summarizeDocument(relativePath) {
  try {
    const raw = await fs.readFile(path.join(repoRoot, relativePath), "utf8");
    const lines = raw
      .split(/\r?\n/)
      .map(compactLine)
      .filter((line) => line && !line.startsWith("|") && line !== "---");

    return lines.slice(0, 4).join(" ").slice(0, 320);
  } catch {
    return "Documento non leggibile dal backend IA separato nel runner corrente.";
  }
}

async function walkControlledFiles(rootPath, maxFiles) {
  const absoluteRoot = path.join(repoRoot, rootPath);
  const found = [];

  async function visit(relativeDir) {
    if (found.length >= maxFiles) {
      return;
    }

    const absoluteDir = relativeDir
      ? path.join(absoluteRoot, relativeDir)
      : absoluteRoot;

    let entries = [];
    try {
      entries = await fs.readdir(absoluteDir, { withFileTypes: true });
    } catch {
      return;
    }

    const sortedEntries = [...entries].sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of sortedEntries) {
      if (found.length >= maxFiles) {
        break;
      }

      const nextRelative = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (["node_modules", "dist", "coverage", "runtime-data"].includes(entry.name)) {
          continue;
        }
        await visit(nextRelative);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const extension = path.extname(entry.name).toLowerCase();
      if (!ALLOWED_FILE_EXTENSIONS.has(extension)) {
        continue;
      }

      found.push(`${rootPath}/${nextRelative}`.replace(/\\/g, "/"));
    }
  }

  await visit("");
  return found;
}

async function buildControlledFileIndex() {
  const entries = [];

  for (const spec of CONTROLLED_SCAN_SPECS) {
    const files = await walkControlledFiles(spec.rootPath, spec.maxFiles);
    for (const relativePath of files) {
      const absolutePath = path.join(repoRoot, relativePath);
      const fileStat = await fs.stat(absolutePath).catch(() => null);
      const content =
        inferFramework(relativePath) === "css" || inferFramework(relativePath) === "markdown"
          ? null
          : await fs.readFile(absolutePath, "utf8").catch(() => null);

      entries.push({
        path: relativePath,
        zoneId: spec.zoneId,
        kind: inferFileKind(relativePath, spec.zoneId),
        framework: inferFramework(relativePath),
        sizeBytes: fileStat?.size ?? 0,
        uiRole: inferUiRole(relativePath, inferFileKind(relativePath, spec.zoneId), spec.zoneId),
        relatedStylePaths: resolveImportedCssPaths(relativePath, content),
        relatedRoutePaths: findRelatedRoutePaths(relativePath),
      });
    }
  }

  return entries.sort((left, right) => left.path.localeCompare(right.path));
}

function buildStyleRelations(fileIndex) {
  return fileIndex
    .flatMap((entry) =>
      entry.relatedStylePaths.map((stylePath) => ({
        sourcePath: entry.path,
        stylePath,
        relation: "import_css",
      })),
    )
    .sort((left, right) => {
      const sourceComparison = left.sourcePath.localeCompare(right.sourcePath);
      return sourceComparison !== 0
        ? sourceComparison
        : left.stylePath.localeCompare(right.stylePath);
    });
}

export async function buildRepoUnderstandingSnapshot() {
  const [documents, fileIndex, firebaseReadiness, runtimeObserver] = await Promise.all([
    Promise.all(
      CURATED_DOCUMENTS.map(async (entry) => ({
        ...entry,
        summary: await summarizeDocument(entry.path),
      })),
    ),
    buildControlledFileIndex(),
    buildFirebaseReadinessSnapshot(),
    readNextRuntimeObserverSnapshot(),
  ]);

  const styleRelations = buildStyleRelations(fileIndex);

  return {
    version: 1,
    sourceMode: "server_filesystem_curated_readonly",
    builtAt: new Date().toISOString(),
    documents,
    moduleAreas: CURATED_MODULE_AREAS,
    uiPatterns: CURATED_UI_PATTERNS,
    repoZones: REPO_ZONES,
    fileIndex,
    styleRelations,
    legacyNextRelations: LEGACY_NEXT_RELATIONS,
    firebaseReadiness,
    runtimeObserver,
    integrationGuidance: INTERNAL_AI_NEXT_UI_INTEGRATION_GUIDANCE,
    screenRelations: CURATED_SCREEN_RELATIONS,
    representativeRoutes: CURATED_ROUTES,
    representativeFiles: Array.from(
      new Set([
        ...CURATED_FILES,
        ...fileIndex.slice(0, 24).map((entry) => entry.path),
      ]),
    ),
    notes: [
      "Snapshot controllata costruita dal backend IA separato leggendo documenti chiave e un indice filesystem limitato di codice, route-like file, componenti e CSS collegati.",
      "L'indice resta read-only, curato e tracciabile: nessuna scansione indiscriminata dell'intero repository e nessuna autonomia di patch.",
      "L'audit Firebase allegato descrive readiness e blocchi reali per Firestore/Storage read-only lato server, senza aprire accessi business.",
      "L'osservatore runtime NEXT resta read-only e limitato alle route /next/* whitelistate: nessun click generico, nessun submit e nessuna scrittura business.",
    ],
    limitations: [
      "L'indice repository non e una parse completa di AST, JSX o dipendenze runtime: e un livello metadata-driven e controllato.",
      "La relazione madre vs NEXT e mappata solo per aree chiave e file rappresentativi, non per ogni componente del repo.",
      "Firestore e Storage read-only server-side non sono ancora attivi nel backend IA separato: mancano access layer dedicato, credenziali server-side dimostrate e policy verificabili.",
      "La vista runtime della NEXT resta parziale: copre solo schermate e stati whitelistati, senza aprire flussi che richiedono interazioni potenzialmente mutanti.",
    ],
  };
}

export function buildRepoUnderstandingMeta(snapshot) {
  return {
    sourceMode: snapshot.sourceMode,
    builtAt: snapshot.builtAt,
    documentCount: snapshot.documents.length,
    moduleAreaCount: snapshot.moduleAreas.length,
    uiPatternCount: snapshot.uiPatterns.length,
    zoneCount: snapshot.repoZones.length,
    fileIndexCount: snapshot.fileIndex.length,
    styleRelationCount: snapshot.styleRelations.length,
    legacyNextRelationCount: snapshot.legacyNextRelations.length,
    runtimeObservedRouteCount:
      snapshot.runtimeObserver?.observedRouteCount ?? snapshot.runtimeObserver?.routeCount ?? 0,
    runtimeScreenshotCount: snapshot.runtimeObserver?.screenshotCount ?? 0,
    integrationGuidanceCount: snapshot.integrationGuidance?.length ?? 0,
    relationCount: snapshot.screenRelations.length,
    routeCount: snapshot.representativeRoutes.length,
    notes: snapshot.notes ?? [],
    limitations: snapshot.limitations ?? [],
  };
}

export function isRepoUnderstandingQuestion(prompt) {
  const normalized = String(prompt ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  return REPO_UNDERSTANDING_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function buildRepoUnderstandingReferences(snapshot) {
  return [
    {
      type: "repo_understanding",
      label: "Snapshot controllata repo/UI del backend IA separato",
      targa: null,
    },
    ...snapshot.documents.slice(0, 2).map((document) => ({
      type: "architecture_doc",
      label: document.title,
      targa: null,
    })),
    ...snapshot.uiPatterns.slice(0, 2).map((pattern) => ({
      type: "ui_pattern",
      label: pattern.label,
      targa: null,
    })),
    ...((snapshot.runtimeObserver?.observedRouteCount ?? snapshot.runtimeObserver?.routeCount)
      ? [
          {
            type: "runtime_observer",
            label: `Runtime NEXT osservato su ${snapshot.runtimeObserver.observedRouteCount ?? snapshot.runtimeObserver.routeCount} schermate`,
            targa: null,
          },
        ]
      : []),
  ];
}

function trimRuntimeObserverStateForChat(stateObservation) {
  return {
    id: stateObservation.id,
    label: stateObservation.label,
    kind: stateObservation.kind,
    status: stateObservation.status,
    finalPath: stateObservation.finalPath,
    mainHeading: stateObservation.mainHeading,
    visibleSections: stateObservation.visibleSections.slice(0, 3),
    visibleDialogs: stateObservation.visibleDialogs.slice(0, 2),
    limitations: stateObservation.limitations.slice(0, 1),
  };
}

function trimRuntimeObserverRouteForChat(route) {
  return {
    id: route.id,
    label: route.label,
    path: route.path,
    finalPath: route.finalPath,
    screenType: route.screenType,
    status: route.status,
    coverageLevel: route.coverageLevel,
    discoveredFromRouteId: route.discoveredFromRouteId,
    sourcePaths: route.sourcePaths.slice(0, 4),
    pageTitle: route.pageTitle,
    mainHeading: route.mainHeading,
    visibleHeadings: route.visibleHeadings.slice(0, 4),
    visibleSections: route.visibleSections.slice(0, 4),
    visibleTabs: route.visibleTabs.slice(0, 4),
    surfaceEntries: route.surfaceEntries.slice(0, 4).map((entry) => ({
      type: entry.type,
      label: entry.label,
    })),
    stateObservations: route.stateObservations.map(trimRuntimeObserverStateForChat),
    limitations: route.limitations.slice(0, 1),
  };
}

function trimRuntimeObserverForChat(runtimeObserver) {
  if (!runtimeObserver) {
    return null;
  }

  return {
    status: runtimeObserver.status,
    catalogVersion: runtimeObserver.catalogVersion,
    baseUrl: runtimeObserver.baseUrl,
    observedAt: runtimeObserver.observedAt,
    routeCount: runtimeObserver.routeCount,
    observedRouteCount: runtimeObserver.observedRouteCount,
    partialRouteCount: runtimeObserver.partialRouteCount,
    unavailableRouteCount: runtimeObserver.unavailableRouteCount,
    screenshotCount: runtimeObserver.screenshotCount,
    stateCount: runtimeObserver.stateCount,
    observedStateCount: runtimeObserver.observedStateCount,
    partialStateCount: runtimeObserver.partialStateCount,
    unavailableStateCount: runtimeObserver.unavailableStateCount,
    routes: runtimeObserver.routes.map(trimRuntimeObserverRouteForChat),
    notes: runtimeObserver.notes.slice(0, 4),
    limitations: runtimeObserver.limitations.slice(0, 6),
  };
}

export function trimRepoUnderstandingSnapshotForChat(snapshot) {
  return {
    builtAt: snapshot.builtAt,
    documents: snapshot.documents.slice(0, 4),
    moduleAreas: snapshot.moduleAreas.slice(0, 5),
    uiPatterns: snapshot.uiPatterns.slice(0, 5),
    repoZones: snapshot.repoZones.slice(0, 5),
    fileIndex: snapshot.fileIndex.slice(0, 16),
    styleRelations: snapshot.styleRelations.slice(0, 10),
    legacyNextRelations: snapshot.legacyNextRelations.slice(0, 6),
    runtimeObserver: trimRuntimeObserverForChat(snapshot.runtimeObserver),
    integrationGuidance: snapshot.integrationGuidance,
    representativeRoutes: snapshot.representativeRoutes,
    screenRelations: snapshot.screenRelations,
    firebaseReadiness: snapshot.firebaseReadiness,
    notes: snapshot.notes.slice(0, 4),
    limitations: snapshot.limitations.slice(0, 4),
  };
}
