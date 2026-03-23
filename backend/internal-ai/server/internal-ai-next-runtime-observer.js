import fs from "node:fs/promises";
import path from "node:path";
import { getInternalAiRuntimeDataRoot } from "./internal-ai-persistence.js";

const runtimeDataRoot = getInternalAiRuntimeDataRoot();
const runtimeObserverDirName = "next-runtime-observer";
const runtimeObserverDirPath = path.join(runtimeDataRoot, runtimeObserverDirName);
const runtimeObserverSnapshotPath = path.join(
  runtimeDataRoot,
  "next_runtime_observer_snapshot.json",
);

export const INTERNAL_AI_NEXT_RUNTIME_OBSERVER_BASE_URL =
  process.env.INTERNAL_AI_NEXT_BASE_URL?.trim() || "http://127.0.0.1:4173";

function createGuidanceEntry(entry) {
  return {
    alternativeSurfaceKinds: [],
    fileRoles: ["page_shell"],
    evidenceRouteIds: [],
    confidence: "media",
    antiPatterns: [],
    ...entry,
  };
}

export const INTERNAL_AI_NEXT_RUNTIME_OBSERVER_ROUTE_SPECS = [
  {
    id: "next-home",
    label: "Home NEXT",
    path: "/next",
    screenType: "cockpit",
    sourcePaths: ["src/next/NextHomePage.tsx", "src/pages/Home.tsx"],
    notes: ["Ingresso clone-side del gestionale con quick link e priorita globali."],
  },
  {
    id: "next-centro-controllo",
    label: "Centro di Controllo",
    path: "/next/centro-controllo",
    screenType: "cockpit",
    sourcePaths: ["src/next/NextCentroControlloClonePage.tsx", "src/pages/CentroControllo.tsx"],
    notes: ["Cockpit operativo read-only con rifornimenti, manutenzioni, richieste e preview PDF."],
  },
  {
    id: "next-gestione-operativa",
    label: "Gestione Operativa",
    path: "/next/gestione-operativa",
    screenType: "operativita_globale",
    sourcePaths: ["src/next/NextGestioneOperativaPage.tsx", "src/pages/GestioneOperativa.tsx"],
    notes: ["Hub globale per magazzino, materiali, manutenzioni e attrezzature."],
  },
  {
    id: "next-mezzi",
    label: "Mezzi",
    path: "/next/mezzi",
    screenType: "mezzo_centrico",
    sourcePaths: ["src/next/NextMezziPage.tsx", "src/pages/Mezzi.tsx"],
    notes: ["Anagrafica flotta e punto di ingresso verso il dossier."],
  },
  {
    id: "next-dossier-lista",
    label: "Dossier lista mezzi",
    path: "/next/dossiermezzi",
    screenType: "mezzo_centrico",
    sourcePaths: ["src/next/NextDossierListaPage.tsx", "src/pages/DossierLista.tsx"],
    notes: ["Lista mezzi e porte di accesso verso dossier, gomme e rifornimenti."],
  },
  {
    id: "next-ia-hub",
    label: "Hub IA clone",
    path: "/next/ia",
    screenType: "documentale",
    sourcePaths: ["src/next/NextIntelligenzaArtificialePage.tsx", "src/pages/IA/IAHome.tsx"],
    notes: ["Hub clone-safe delle superfici IA legacy, distinto dalla nuova IA interna."],
  },
  {
    id: "next-ia-interna",
    label: "IA interna NEXT",
    path: "/next/ia/interna",
    screenType: "ia_interna",
    sourcePaths: [
      "src/next/NextInternalAiPage.tsx",
      "backend/internal-ai/server/internal-ai-adapter.js",
    ],
    notes: ["Chat controllata, artifact, repo understanding e runtime read-only della nuova IA."],
  },
  {
    id: "next-ia-interna-sessioni",
    label: "IA interna - Sessioni",
    path: "/next/ia/interna/sessioni",
    screenType: "ia_interna",
    sourcePaths: ["src/next/NextInternalAiPage.tsx"],
    notes: ["Sottosezione sessioni della nuova IA interna."],
  },
  {
    id: "next-ia-interna-richieste",
    label: "IA interna - Richieste",
    path: "/next/ia/interna/richieste",
    screenType: "ia_interna",
    sourcePaths: ["src/next/NextInternalAiPage.tsx"],
    notes: ["Sottosezione richieste e workflow della nuova IA interna."],
  },
  {
    id: "next-ia-interna-artifacts",
    label: "IA interna - Artifact",
    path: "/next/ia/interna/artifacts",
    screenType: "ia_interna",
    sourcePaths: ["src/next/NextInternalAiPage.tsx"],
    notes: ["Archivio artifact dedicato del sottosistema IA interno."],
  },
  {
    id: "next-ia-interna-audit",
    label: "IA interna - Audit",
    path: "/next/ia/interna/audit",
    screenType: "ia_interna",
    sourcePaths: ["src/next/NextInternalAiPage.tsx"],
    notes: ["Registro audit e traceability del sottosistema IA interno."],
  },
  {
    id: "next-acquisti",
    label: "Acquisti",
    path: "/next/acquisti",
    screenType: "procurement",
    sourcePaths: ["src/next/NextAcquistiPage.tsx", "src/pages/Acquisti.tsx"],
    safeStateProbes: [
      {
        id: "tab-ordini",
        label: "Tab Ordini",
        kind: "tab_state",
        selector: 'button:has-text("Ordini"), [role="tab"]:has-text("Ordini"), a:has-text("Ordini")',
      },
      {
        id: "tab-arrivi",
        label: "Tab Arrivi",
        kind: "tab_state",
        selector: 'button:has-text("Arrivi"), [role="tab"]:has-text("Arrivi"), a:has-text("Arrivi")',
      },
      {
        id: "tab-prezzi-preventivi",
        label: "Tab Prezzi e Preventivi",
        kind: "tab_state",
        selector:
          'button:has-text("Prezzi & Preventivi"), [role="tab"]:has-text("Prezzi & Preventivi"), a:has-text("Prezzi & Preventivi")',
      },
      {
        id: "tab-listino",
        label: "Tab Listino Prezzi",
        kind: "tab_state",
        selector:
          'button:has-text("Listino Prezzi"), [role="tab"]:has-text("Listino Prezzi"), a:has-text("Listino Prezzi")',
      },
    ],
    notes: ["Dominio ordini/preventivi globale, non ideale come primo hook IA mezzo-centrico."],
  },
  {
    id: "next-autisti-inbox",
    label: "Autisti Inbox",
    path: "/next/autisti-inbox",
    screenType: "autista",
    sourcePaths: ["src/next/NextAutistiInboxHomePage.tsx", "src/autistiInbox/AutistiInboxHome.tsx"],
    notes: ["Raccolta e rettifica eventi autisti in sola lettura clone-safe."],
  },
  {
    id: "next-autisti-admin",
    label: "Autisti Admin",
    path: "/next/autisti-admin",
    screenType: "autista",
    sourcePaths: ["src/next/NextAutistiAdminPage.tsx", "src/autistiInbox/AutistiAdmin.tsx"],
    notes: ["Backoffice eventi autisti e centro rettifica clone-safe."],
  },
  {
    id: "next-cisterna",
    label: "Cisterna",
    path: "/next/cisterna",
    screenType: "specialistico",
    sourcePaths: ["src/next/NextCisternaPage.tsx", "src/pages/CisternaCaravate/CisternaCaravatePage.tsx"],
    notes: ["Verticale specialistico separato dal dossier standard."],
  },
];

export const INTERNAL_AI_NEXT_RUNTIME_DYNAMIC_ROUTE_SPECS = [
  {
    id: "next-dossier-dettaglio",
    label: "Dossier mezzo",
    screenType: "mezzo_centrico",
    sourcePaths: ["src/next/NextDossierMezzoPage.tsx", "src/pages/DossierMezzo.tsx"],
    discoveryFromRouteId: "next-dossier-lista",
    startPath: "/next/dossiermezzi",
    discoverySteps: [
      {
        kind: "click_selector",
        selector: "div.dossierlista-card",
        label: "Apri gruppo dossier",
      },
      {
        kind: "click_selector",
        selector: "a.dossierlista-card",
        label: "Apri primo dossier mezzo",
      },
    ],
    notes: ["Dettaglio mezzo osservato in modo read-only partendo dalla lista dossier."],
  },
  {
    id: "next-analisi-economica-dettaglio",
    label: "Analisi economica",
    screenType: "mezzo_centrico",
    sourcePaths: ["src/next/NextAnalisiEconomicaPage.tsx", "src/pages/AnalisiEconomica.tsx"],
    discoveryFromRouteId: "next-dossier-lista",
    startPath: "/next/dossiermezzi",
    discoverySteps: [
      {
        kind: "click_selector",
        selector: "div.dossierlista-card",
        label: "Apri gruppo dossier",
      },
      {
        kind: "click_selector",
        selector: "a.dossierlista-card",
        label: "Apri primo dossier mezzo",
      },
      {
        kind: "click_selector",
        selector: 'button:has-text("Analisi Economica"), a:has-text("Analisi Economica")',
        label: "Apri Analisi Economica",
      },
    ],
    notes: ["Vista economica osservata partendo dal dossier mezzo in sola lettura."],
  },
  {
    id: "next-dossier-gomme",
    label: "Dossier mezzo - Gomme",
    screenType: "mezzo_centrico",
    sourcePaths: ["src/pages/DossierMezzo.tsx"],
    discoveryFromRouteId: "next-dossier-lista",
    startPath: "/next/dossiermezzi",
    discoverySteps: [
      {
        kind: "click_selector",
        selector: "div.dossierlista-card",
        label: "Apri gruppo dossier",
      },
      {
        kind: "click_selector",
        selector: "a.dossierlista-card",
        label: "Apri primo dossier mezzo",
      },
      {
        kind: "click_selector",
        selector: 'button:has-text("Gomme"), a:has-text("Gomme")',
        label: "Apri sezione Gomme",
      },
    ],
    notes: ["Sottosezione gomme del dossier osservata in sola lettura."],
  },
  {
    id: "next-dossier-rifornimenti",
    label: "Dossier mezzo - Rifornimenti",
    screenType: "mezzo_centrico",
    sourcePaths: ["src/pages/DossierMezzo.tsx"],
    discoveryFromRouteId: "next-dossier-lista",
    startPath: "/next/dossiermezzi",
    discoverySteps: [
      {
        kind: "click_selector",
        selector: "div.dossierlista-card",
        label: "Apri gruppo dossier",
      },
      {
        kind: "click_selector",
        selector: "a.dossierlista-card",
        label: "Apri primo dossier mezzo",
      },
      {
        kind: "click_selector",
        selector:
          'button:has-text("Rifornimenti (dettaglio)"), a:has-text("Rifornimenti (dettaglio)")',
        label: "Apri dettaglio rifornimenti",
      },
    ],
    notes: ["Sottosezione rifornimenti del dossier osservata in sola lettura."],
  },
];

export const INTERNAL_AI_NEXT_UI_INTEGRATION_GUIDANCE = [
  createGuidanceEntry({
    id: "mezzo-centric-section",
    domainType: "mezzo_centrico",
    whenToUse:
      "Funzione legata a una singola targa, al suo storico tecnico, ai documenti del mezzo o ai costi del mezzo.",
    recommendedModuleLabel: "Dossier Mezzo",
    recommendedRoutePaths: ["/next/dossier/:targa", "/next/analisi-economica/:targa"],
    recommendedSurfaceKinds: ["section", "tab", "card", "button"],
    primarySurfaceKind: "section",
    alternativeSurfaceKinds: ["tab", "card", "button"],
    candidateSourcePaths: [
      "src/pages/DossierMezzo.tsx",
      "src/pages/AnalisiEconomica.tsx",
      "src/next/domain/nextDossierMezzoDomain.ts",
    ],
    fileRoles: ["page_shell", "page_section", "domain_reader", "toolbar_action"],
    impactedModules: ["Mezzi", "Dossier Mezzo", "Analisi Economica"],
    avoidModules: ["/next/gestione-operativa", "/next/acquisti"],
    evidenceRouteIds: [
      "next-dossier-lista",
      "next-dossier-dettaglio",
      "next-analisi-economica-dettaglio",
      "next-dossier-gomme",
      "next-dossier-rifornimenti",
    ],
    confidence: "alta",
    antiPatterns: [
      "Aprire una pagina globale separata per una funzione che dipende da una singola targa.",
      "Duplicare logica dossier dentro Centro di Controllo o Gestione Operativa.",
    ],
    why:
      "Il repo converge i flussi targa-centrici nel dossier; partire da qui evita duplicazioni di logica tra pagine globali.",
  }),
  createGuidanceEntry({
    id: "cockpit-priority-card",
    domainType: "cockpit_globale",
    whenToUse:
      "Funzione di allerta, priorita giornaliera, coda operativa, sintesi o ranking che attraversa piu domini.",
    recommendedModuleLabel: "Centro di Controllo",
    recommendedRoutePaths: ["/next/centro-controllo", "/next"],
    recommendedSurfaceKinds: ["card", "tab", "section", "button"],
    primarySurfaceKind: "card",
    alternativeSurfaceKinds: ["tab", "section", "button"],
    candidateSourcePaths: [
      "src/pages/CentroControllo.tsx",
      "src/pages/Home.tsx",
      "src/next/domain/nextCentroControlloDomain.ts",
    ],
    fileRoles: ["page_shell", "page_section", "domain_reader", "toolbar_action"],
    impactedModules: ["Home", "Centro di Controllo", "Autisti Inbox"],
    avoidModules: ["/next/dossier/:targa", "/next/cisterna"],
    evidenceRouteIds: ["next-home", "next-centro-controllo"],
    confidence: "alta",
    antiPatterns: [
      "Mettere code globali o alert nel dossier mezzo.",
      "Usare la chat IA come nuova pagina cockpit operativa.",
    ],
    why:
      "Le funzioni cockpit devono restare globali e sintetiche; non vanno disperse dentro viste dettaglio del mezzo.",
  }),
  createGuidanceEntry({
    id: "operativita-global-page",
    domainType: "operativita_globale",
    whenToUse:
      "Funzione su magazzino, materiali, attrezzature, manutenzioni globali o workbench condivisi non mezzo-centrici.",
    recommendedModuleLabel: "Gestione Operativa",
    recommendedRoutePaths: ["/next/gestione-operativa", "/next/inventario"],
    recommendedSurfaceKinds: ["page", "tab", "card", "button"],
    primarySurfaceKind: "page",
    alternativeSurfaceKinds: ["tab", "card", "button"],
    candidateSourcePaths: [
      "src/pages/GestioneOperativa.tsx",
      "src/pages/Inventario.tsx",
      "src/next/domain/nextOperativitaGlobaleDomain.ts",
    ],
    fileRoles: ["page_shell", "page_section", "domain_reader", "routing_entry"],
    impactedModules: ["Gestione Operativa", "Inventario", "Manutenzioni"],
    avoidModules: ["/next/dossier/:targa"],
    evidenceRouteIds: ["next-gestione-operativa"],
    confidence: "alta",
    antiPatterns: [
      "Forzare flussi di stock o workbench globali dentro il dossier.",
      "Spezzare una funzione operativa globale in piu modali isolate senza vista principale.",
    ],
    why:
      "Il repo tratta questi flussi come globali; portarli nel dossier farebbe perdere il confine tra stock condiviso e storico mezzo.",
  }),
  createGuidanceEntry({
    id: "documental-preview-modal",
    domainType: "documentale",
    whenToUse:
      "Preview, confronto, lettura o download di documenti, libretti, preventivi o report strutturati.",
    recommendedModuleLabel: "Dossier / IA interna / hub IA clone",
    recommendedRoutePaths: ["/next/dossier/:targa", "/next/ia", "/next/ia/interna"],
    recommendedSurfaceKinds: ["modal", "button", "card", "section"],
    primarySurfaceKind: "modal",
    alternativeSurfaceKinds: ["button", "card", "section"],
    candidateSourcePaths: [
      "src/components/PdfPreviewModal.tsx",
      "src/next/NextPdfPreviewModal.tsx",
      "src/next/NextInternalAiPage.tsx",
      "src/next/domain/nextDocumentiCostiDomain.ts",
    ],
    fileRoles: ["modal_component", "page_section", "toolbar_action", "domain_reader"],
    impactedModules: ["Dossier Mezzo", "IA interna", "Hub IA clone", "Analisi Economica"],
    avoidModules: ["/next/gestione-operativa"],
    evidenceRouteIds: [
      "next-ia-hub",
      "next-ia-interna",
      "next-dossier-dettaglio",
      "next-analisi-economica-dettaglio",
    ],
    confidence: "alta",
    antiPatterns: [
      "Riversare il report completo nel thread chat.",
      "Aprire una pagina business nuova solo per leggere un documento o un report.",
    ],
    why:
      "Nel repo la preview documentale e gia un pattern forte basato su modali dedicate e non su muri di testo in pagina.",
  }),
  createGuidanceEntry({
    id: "procurement-tab-workbench",
    domainType: "procurement",
    whenToUse:
      "Funzione su ordini, arrivi, preventivi o workbench materiali che richiede stato proprio ma resta globale e non targa-centrica.",
    recommendedModuleLabel: "Acquisti / procurement read-only",
    recommendedRoutePaths: ["/next/acquisti", "/next/acquisti/dettaglio/:ordineId"],
    recommendedSurfaceKinds: ["tab", "page", "card", "button"],
    primarySurfaceKind: "tab",
    alternativeSurfaceKinds: ["page", "card", "button"],
    candidateSourcePaths: [
      "src/next/NextAcquistiPage.tsx",
      "src/next/NextProcurementReadOnlyPanel.tsx",
      "src/next/domain/nextProcurementDomain.ts",
    ],
    fileRoles: ["page_shell", "page_section", "domain_reader", "routing_entry"],
    impactedModules: ["Acquisti", "Ordini", "Arrivi", "Preventivi"],
    avoidModules: ["/next/dossier/:targa", "/next/ia/interna"],
    evidenceRouteIds: ["next-acquisti"],
    confidence: "alta",
    antiPatterns: [
      "Agganciare preventivi globali alla chat IA come se fossero il canale operativo principale.",
      "Mescolare ordini globali e contesto mezzo senza un filtro esplicito.",
    ],
    why:
      "Il repo separa gia il procurement come flusso globale con proprie code e tab; innestarlo altrove confonderebbe ownership e stato operativo.",
  }),
  createGuidanceEntry({
    id: "autista-ops-flow",
    domainType: "autista",
    whenToUse:
      "Funzione che nasce dal campo, da sessioni autista, segnalazioni, controlli o rettifiche inbox/admin.",
    recommendedModuleLabel: "Autisti Inbox / Autisti Admin",
    recommendedRoutePaths: ["/next/autisti-inbox", "/next/autisti-admin", "/next/centro-controllo"],
    recommendedSurfaceKinds: ["tab", "card", "button", "section"],
    primarySurfaceKind: "section",
    alternativeSurfaceKinds: ["tab", "card", "button"],
    candidateSourcePaths: [
      "src/autistiInbox/AutistiInboxHome.tsx",
      "src/autistiInbox/AutistiAdmin.tsx",
      "src/next/domain/nextCentroControlloDomain.ts",
    ],
    fileRoles: ["page_shell", "page_section", "domain_reader", "toolbar_action"],
    impactedModules: ["Autisti Inbox", "Autisti Admin", "Centro di Controllo", "Dossier Mezzo"],
    avoidModules: ["/next/ia/interna", "/next/acquisti"],
    evidenceRouteIds: ["next-autisti-inbox", "next-autisti-admin", "next-centro-controllo"],
    confidence: "media",
    antiPatterns: [
      "Aprire la rettifica autista dentro la chat IA.",
      "Far nascere un flusso autista operativo nel dossier mezzo come fonte primaria.",
    ],
    why:
      "Gli eventi autisti sono cross-area e ancora sensibili; vanno instradati nei punti di rettifica e cockpit prima di diventare insight strutturati.",
  }),
  createGuidanceEntry({
    id: "ia-internal-overlay",
    domainType: "ia_interna",
    whenToUse:
      "Funzione che serve a spiegare il gestionale, generare artifact, guidare l'utente o proporre integrazioni senza modificare il business runtime.",
    recommendedModuleLabel: "IA interna NEXT",
    recommendedRoutePaths: ["/next/ia/interna"],
    recommendedSurfaceKinds: ["card", "section", "modal", "button"],
    primarySurfaceKind: "section",
    alternativeSurfaceKinds: ["card", "modal", "button"],
    candidateSourcePaths: [
      "src/next/NextInternalAiPage.tsx",
      "src/next/internal-ai/internalAiContracts.ts",
      "backend/internal-ai/server/internal-ai-repo-understanding.js",
    ],
    fileRoles: ["page_shell", "page_section", "bridge", "domain_reader"],
    impactedModules: ["IA interna NEXT", "backend IA separato"],
    avoidModules: ["/", "/next/acquisti", "/next/dossier/:targa"],
    evidenceRouteIds: [
      "next-ia-interna",
      "next-ia-interna-sessioni",
      "next-ia-interna-richieste",
      "next-ia-interna-artifacts",
      "next-ia-interna-audit",
    ],
    confidence: "alta",
    antiPatterns: [
      "Usare l'IA interna per applicare da sola modifiche strutturali alla NEXT.",
      "Spostare funzioni business permanenti dentro il pannello IA come nuova UI canonica.",
    ],
    why:
      "Le capability di spiegazione, preview e guida strutturale devono restare nell'overlay IA e non contaminare direttamente i moduli business.",
  }),
  createGuidanceEntry({
    id: "cisterna-specialist-area",
    domainType: "specialistico",
    whenToUse:
      "Funzione dedicata al verticale cisterna o ad altri verticali specialistici con flussi, documenti e metriche proprie.",
    recommendedModuleLabel: "Cisterna",
    recommendedRoutePaths: ["/next/cisterna", "/next/cisterna/ia", "/next/cisterna/schede-test"],
    recommendedSurfaceKinds: ["page", "tab", "card", "button"],
    primarySurfaceKind: "page",
    alternativeSurfaceKinds: ["tab", "card", "button"],
    candidateSourcePaths: [
      "src/pages/CisternaCaravate/CisternaCaravatePage.tsx",
      "src/next/domain/nextCisternaDomain.ts",
    ],
    fileRoles: ["page_shell", "page_section", "domain_reader", "routing_entry"],
    impactedModules: ["Cisterna", "Cisterna IA", "Schede Test"],
    avoidModules: ["/next/dossier/:targa", "/next/ia/interna"],
    evidenceRouteIds: ["next-cisterna"],
    confidence: "media",
    antiPatterns: [
      "Forzare il verticale cisterna dentro il dossier standard.",
      "Mescolare funzioni cisterna e cockpit generico senza perimetro esplicito.",
    ],
    why:
      "Il dominio cisterna e specialistico e non conviene forzarlo dentro il dossier standard o nella IA generalista del clone.",
  }),
];

export function createDefaultNextRuntimeObserverSnapshot() {
  return {
    version: 1,
    sourceMode: "playwright_next_readonly_runtime",
    status: "not_observed",
    baseUrl: null,
    observedAt: null,
    routeCount: 0,
    screenshotCount: 0,
    stateCount: 0,
    nextOnly: true,
    screenshotDirectory: path.join("backend/internal-ai/runtime-data", runtimeObserverDirName),
    routes: [],
    notes: [
      "Osservazione runtime NEXT non ancora eseguita.",
      "La nuova IA continua a basarsi sulla snapshot repo/UI controllata finche non esiste un crawl runtime verificato.",
    ],
    limitations: [
      "Nessuno screenshot o DOM snapshot runtime ancora disponibile nel contenitore IA dedicato.",
      "Modali e stati che richiedono interazione non distruttiva non sono ancora osservati automaticamente.",
    ],
  };
}

export function getNextRuntimeObserverDirPath() {
  return runtimeObserverDirPath;
}

export function getNextRuntimeObserverSnapshotPath() {
  return runtimeObserverSnapshotPath;
}

export async function readNextRuntimeObserverSnapshot() {
  try {
    const raw = await fs.readFile(runtimeObserverSnapshotPath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      ...createDefaultNextRuntimeObserverSnapshot(),
      ...parsed,
      stateCount:
        typeof parsed?.stateCount === "number"
          ? parsed.stateCount
          : Array.isArray(parsed?.routes)
            ? parsed.routes.reduce(
                (total, route) => total + (Array.isArray(route?.stateObservations) ? route.stateObservations.length : 0),
                0,
              )
            : 0,
    };
  } catch {
    return createDefaultNextRuntimeObserverSnapshot();
  }
}

export async function writeNextRuntimeObserverSnapshot(snapshot) {
  await fs.mkdir(runtimeDataRoot, { recursive: true });
  await fs.mkdir(runtimeObserverDirPath, { recursive: true });
  await fs.writeFile(runtimeObserverSnapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  return snapshot;
}

export function buildNextRuntimeObserverMeta(snapshot) {
  return {
    status: snapshot.status,
    sourceMode: snapshot.sourceMode,
    observedAt: snapshot.observedAt,
    routeCount: snapshot.routeCount,
    screenshotCount: snapshot.screenshotCount,
    stateCount: snapshot.stateCount ?? 0,
    nextOnly: snapshot.nextOnly,
    limitations: snapshot.limitations ?? [],
    notes: snapshot.notes ?? [],
  };
}
