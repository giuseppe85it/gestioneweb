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

const REPO_LAYER_BOUNDARIES = [
  {
    id: "madre",
    label: "Madre legacy",
    rootPaths: ["src/pages"],
    summary:
      "Mostra il flusso reale storico del gestionale ed e leggibile per capire il comportamento vero, ma non va patchata nei task della NEXT.",
  },
  {
    id: "next",
    label: "NEXT clone read-only",
    rootPaths: ["src/next"],
    summary:
      "E il perimetro di evoluzione controllata del clone: qui si possono rafforzare shell, pagine, IA interna e guard rail senza toccare la madre.",
  },
  {
    id: "backend_ia",
    label: "Backend IA separato",
    rootPaths: ["backend/internal-ai/server"],
    summary:
      "Ospita adapter, retrieval, repo understanding e orchestrazione server-side del sottosistema IA interno, senza scritture business.",
  },
  {
    id: "domain_read_model",
    label: "Domain / read model NEXT",
    rootPaths: ["src/next/domain", "src/next/nextRifornimentiConsumiDomain.ts"],
    summary:
      "E il punto corretto per normalizzare, leggere e spiegare i dati del clone: la UI e l'IA dovrebbero dipendere da questo layer e non dalla pagina legacy.",
  },
  {
    id: "renderer_ui",
    label: "Renderer / UI",
    rootPaths: ["src/next/*.tsx", "src/pages/*.tsx"],
    summary:
      "Mostra superfici, card, tab, sezioni e pagine. Va usato per capire l'esperienza utente, non come reader canonico della logica.",
  },
  {
    id: "docs_truth",
    label: "Documentazione di verita",
    rootPaths: ["docs"],
    summary:
      "Stato progetto, flussi, domini dati e regole operative che guidano il repo understanding in modo tracciabile.",
  },
];

const REPO_FLOW_PLAYBOOKS = [
  {
    id: "home_operativa",
    label: "Home operativa e Centro di Controllo",
    detectionPatterns: [
      "analizza la home",
      "analizza home",
      "analisi home",
      "spiegami la home",
      "home operativa",
      "alert della home",
      "revisioni della home",
      "stato operativo home",
      "centro controllo",
    ],
    architecturalArea: "D10 stato operativo, alert e cockpit read-only",
    connectedModules: ["Home", "Centro di Controllo", "Dossier Mezzo"],
    layerIds: ["docs_truth", "madre", "domain_read_model", "next", "renderer_ui"],
    filePaths: [
      "src/next/domain/nextCentroControlloDomain.ts",
      "src/next/NextHomePage.tsx",
      "src/next/NextCentroControlloClonePage.tsx",
      "src/pages/Home.tsx",
      "src/pages/CentroControllo.tsx",
    ],
    upstreamFlow: [
      "Home e Centro di Controllo leggono lo stesso perimetro di stato operativo e priorita giornaliera.",
    ],
    downstreamFlow: [
      "Il cockpit globale puo aprire approfondimenti verso il Dossier Mezzo e altre code operative.",
    ],
    whereIntervene:
      "Se vuoi chiarire o semplificare la Home, parti dal reader NEXT D10 e solo dopo dalla superficie clone o dalla pagina madre usata come riferimento.",
    impactRisk: "NORMALE",
    recommendedIntegrationPoint:
      "Domain/read model D10 nella NEXT, con eventuali aggiustamenti secondari sulla pagina clone e non sulla madre.",
    action:
      "Leggi prima il layer D10, poi allinea Home e Centro di Controllo come superfici dello stesso flusso operativo.",
    referenceDocPaths: [
      "docs/STATO_ATTUALE_PROGETTO.md",
      "docs/flow-master/MAPPA_MAESTRA_FLUSSI_GESTIONALE.md",
    ],
  },
  {
    id: "file_touch",
    label: "Mappa file/moduli del perimetro mezzo-Home",
    detectionPatterns: [
      "quale file tocco",
      "quale file devo toccare",
      "quali file devo toccare",
      "quali moduli sono coinvolti",
      "quali moduli coinvolti",
      "file coinvolti",
      "moduli coinvolti",
      "file da toccare",
      "mappa file",
    ],
    architecturalArea: "Mapping pratico file/moduli nella prima verticale clone-safe",
    connectedModules: ["Home", "Dossier Mezzo", "IA interna NEXT"],
    layerIds: ["docs_truth", "madre", "domain_read_model", "next", "backend_ia", "renderer_ui"],
    filePaths: [
      "src/next/domain/nextCentroControlloDomain.ts",
      "src/next/domain/nextDossierMezzoDomain.ts",
      "src/next/internal-ai/internalAiChatOrchestrator.ts",
      "src/next/internal-ai/internalAiOutputSelector.ts",
      "src/next/NextInternalAiPage.tsx",
      "src/pages/Home.tsx",
      "src/pages/DossierMezzo.tsx",
    ],
    upstreamFlow: [
      "La documentazione definisce ownership e perimetro, i domain reader NEXT consegnano il modello pulito.",
    ],
    downstreamFlow: [
      "La UI clone e il sottosistema IA consumano i read model e non dovrebbero ricostruire logica sporca in pagina.",
    ],
    whereIntervene:
      "Per capire cosa toccare separa sempre documenti, read model, UI clone e backend IA: sono layer diversi con rischi diversi.",
    impactRisk: "NORMALE",
    recommendedIntegrationPoint:
      "Il file corretto dipende dal layer owner: domain per logica, backend IA per orchestrazione, pagina clone per rendering.",
    action:
      "Apri prima i documenti di verita e il read model coinvolto, poi stringi il set minimo di file UI o IA da cambiare.",
    referenceDocPaths: [
      "docs/STATO_ATTUALE_PROGETTO.md",
      "docs/product/STATO_MIGRAZIONE_NEXT.md",
    ],
  },
  {
    id: "rifornimenti_flow",
    label: "Flusso rifornimenti D04",
    detectionPatterns: [
      "rifornimenti",
      "rifornimento",
      "carburante",
      "gasolio",
      "consumi",
      "km/l",
      "l/100km",
      "semplificare il flusso rifornimenti",
    ],
    architecturalArea: "D04 rifornimenti e consumi nel perimetro mezzo-centrico read-only",
    connectedModules: [
      "Dossier Mezzo",
      "Dossier Rifornimenti",
      "Analisi Economica",
      "IA interna NEXT",
    ],
    layerIds: ["docs_truth", "madre", "domain_read_model", "next", "backend_ia", "renderer_ui"],
    filePaths: [
      "src/next/domain/nextRifornimentiDomain.ts",
      "src/next/nextRifornimentiConsumiDomain.ts",
      "src/next/domain/nextDossierMezzoDomain.ts",
      "src/next/NextDossierRifornimentiPage.tsx",
      "src/next/NextRifornimentiEconomiaSection.tsx",
      "src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts",
      "src/pages/DossierRifornimenti.tsx",
    ],
    upstreamFlow: [
      "Il clone ricostruisce D04 nel layer NEXT e non dovrebbe leggere la pagina legacy come fonte canonica.",
      "Il Dossier Mezzo e il Dossier Rifornimenti convergono sullo stesso dominio read-only dei rifornimenti.",
    ],
    downstreamFlow: [
      "Analisi Economica, report fuel e spiegazioni IA leggono lo stesso perimetro D04 gia normalizzato.",
    ],
    whereIntervene:
      "Se vuoi semplificare il flusso rifornimenti, il punto giusto e il layer D04 della NEXT: prima i reader e le regole di normalizzazione, poi le pagine e infine i renderer IA.",
    impactRisk: "ELEVATO",
    recommendedIntegrationPoint:
      "Reader D04 e read model NEXT, con rifiniture nelle pagine dossier/rifornimenti e non dentro la madre o in logiche sparse nella chat.",
    action:
      "Mappa prima sorgenti, normalizzazione e consumatori del dato D04; poi accorpa la logica duplicata nel layer NEXT e lascia la UI come renderer.",
    referenceDocPaths: [
      "docs/data/DOMINI_DATI_CANONICI.md",
      "docs/flow-master/MAPPA_MAESTRA_FLUSSI_GESTIONALE.md",
      "docs/product/STATO_MIGRAZIONE_NEXT.md",
    ],
  },
  {
    id: "dossier_mezzo",
    label: "Dossier Mezzo e impatti collegati",
    detectionPatterns: ["dossier mezzo", "dossier mezzi", "mezzo dossier"],
    architecturalArea: "Aggregatore detail-first mezzo-centrico e sue estensioni read-only",
    connectedModules: [
      "Lista Dossier Mezzi",
      "Dossier Mezzo",
      "Dossier Rifornimenti",
      "Dossier Gomme",
      "Analisi Economica",
      "IA interna NEXT",
    ],
    layerIds: ["docs_truth", "madre", "domain_read_model", "next", "backend_ia", "renderer_ui"],
    filePaths: [
      "src/next/domain/nextDossierMezzoDomain.ts",
      "src/next/NextMezziDossierPage.tsx",
      "src/next/NextDossierMezzoPage.tsx",
      "src/next/NextDossierRifornimentiPage.tsx",
      "src/next/NextDossierGommePage.tsx",
      "src/next/NextAnalisiEconomicaPage.tsx",
      "src/next/internal-ai/internalAiVehicleDossierHookFacade.ts",
      "src/pages/DossierMezzo.tsx",
    ],
    upstreamFlow: [
      "La lista mezzi e il cockpit possono aprire il dettaglio mezzo, che e il nodo centrale delle viste targa-centriche.",
    ],
    downstreamFlow: [
      "Dal Dossier partono rifornimenti, gomme, analisi economica e capability IA mezzo-centriche.",
    ],
    whereIntervene:
      "Qualsiasi modifica al Dossier va letta come modifica all'aggregatore: non tocca solo una pagina, ma il modo in cui le viste targa-centriche convergono sul read model.",
    impactRisk: "ELEVATO",
    recommendedIntegrationPoint:
      "Prima il domain/read model del dossier, poi la pagina `NextDossierMezzoPage.tsx` e solo alla fine i pannelli derivati o le capability IA che lo leggono.",
    action:
      "Controlla sempre lista ingressi, dettaglio mezzo, estensioni dossier e hook IA mezzo-centrici prima di toccare il Dossier.",
    referenceDocPaths: [
      "docs/STATO_ATTUALE_PROGETTO.md",
      "docs/flow-master/MAPPA_MAESTRA_FLUSSI_GESTIONALE.md",
      "docs/product/STATO_MIGRAZIONE_NEXT.md",
    ],
  },
  {
    id: "nuovo_modulo",
    label: "Inserimento di un nuovo modulo",
    detectionPatterns: [
      "nuovo modulo",
      "aggiungere un nuovo modulo",
      "aggiungere modulo",
      "dove lo dovrei inserire",
      "dove va messo",
      "dove inserirlo",
      "come lo gestiresti nel perimetro next",
    ],
    architecturalArea: "Classificazione ownership prima dell'innesto nel clone NEXT",
    connectedModules: [
      "Shell NEXT",
      "Dossier Mezzo",
      "Centro di Controllo",
      "Gestione Operativa",
      "IA interna NEXT",
    ],
    layerIds: ["docs_truth", "next", "domain_read_model", "renderer_ui", "backend_ia"],
    filePaths: [
      "src/next/NextShell.tsx",
      "src/next/nextStructuralPaths.ts",
      "src/next/NextDossierMezzoPage.tsx",
      "src/next/NextCentroControlloPage.tsx",
      "src/next/NextInternalAiPage.tsx",
      "backend/internal-ai/server/internal-ai-repo-understanding.js",
    ],
    upstreamFlow: [
      "Il primo passo corretto non e creare una pagina: e classificare il modulo come mezzo-centrico, cockpit globale, operativita globale, documentale o IA.",
    ],
    downstreamFlow: [
      "Solo dopo la classificazione si decide se serve route autonoma, tab, card nel dossier o capability IA dedicata.",
    ],
    whereIntervene:
      "L'intervento corretto nasce dalla macro-area owner del flusso: Dossier per targa, Centro di Controllo per priorita globali, Gestione Operativa per workbench, IA interna per funzioni assistive.",
    impactRisk: "ELEVATO",
    recommendedIntegrationPoint:
      "Macro-area owner nella NEXT, con un read model dedicato se il modulo legge dati nuovi o normalizzati.",
    action:
      "Prima scegli owner, sorgente dati e read model; solo dopo apri pagina, card, tab o capability IA coerente con la macro-area.",
    referenceDocPaths: [
      "docs/STRUTTURA_COMPLETA_GESTIONALE.md",
      "docs/flow-master/MAPPA_MAESTRA_FLUSSI_GESTIONALE.md",
      "docs/product/STATO_MIGRAZIONE_NEXT.md",
    ],
  },
  {
    id: "perimetro_logica",
    label: "Distinzione madre / NEXT / backend IA / read model",
    detectionPatterns: [
      "questa logica vive",
      "vive nella madre",
      "vive nella next",
      "backend ia",
      "domain layer",
      "domain/read model",
      "read model",
      "renderer",
      "documentazione di verita",
      "quali file devo leggere per capirla bene",
    ],
    architecturalArea: "Ownership del layer e ordine corretto di lettura del repo",
    connectedModules: [
      "Madre legacy",
      "NEXT clone read-only",
      "Backend IA separato",
      "Domain/read model NEXT",
      "Renderer/UI",
      "Documentazione di verita",
    ],
    layerIds: ["docs_truth", "madre", "next", "domain_read_model", "renderer_ui", "backend_ia"],
    filePaths: [
      "docs/STATO_ATTUALE_PROGETTO.md",
      "docs/product/STATO_MIGRAZIONE_NEXT.md",
      "src/pages/DossierMezzo.tsx",
      "src/next/NextDossierMezzoPage.tsx",
      "src/next/domain/nextDossierMezzoDomain.ts",
      "backend/internal-ai/server/internal-ai-adapter.js",
      "backend/internal-ai/server/internal-ai-repo-understanding.js",
    ],
    upstreamFlow: [
      "La documentazione definisce ownership e confini; la madre mostra il flusso reale storico; il read model NEXT pulisce e consegna il dato alle superfici clone-safe.",
    ],
    downstreamFlow: [
      "Il backend IA e la UI dovrebbero consumare read model e snapshot controllate, non ricostruire la logica direttamente dalle pagine legacy.",
    ],
    whereIntervene:
      "Per capire dove vive una logica, leggi sempre nell'ordine: documentazione -> read model NEXT -> pagina clone -> pagina madre -> backend IA se la capability passa dal server.",
    impactRisk: "NORMALE",
    recommendedIntegrationPoint:
      "Il layer owner: domain/read model per logica e mapping, backend IA per orchestrazione server-side, UI per rendering e affordance.",
    action:
      "Non partire dal renderer. Identifica prima il layer owner e poi limita il set di file da studiare o cambiare.",
    referenceDocPaths: [
      "docs/STATO_ATTUALE_PROGETTO.md",
      "docs/data/DOMINI_DATI_CANONICI.md",
      "docs/product/STATO_MIGRAZIONE_NEXT.md",
    ],
  },
  {
    id: "ia_operational_flow",
    label: "Nuova funzione IA legata ai flussi operativi",
    detectionPatterns: [
      "nuova funzione ia",
      "funzione ia",
      "flussi operativi",
      "punto corretto di integrazione",
      "capability ia",
      "integrazione ia",
    ],
    architecturalArea: "Innestare una capability IA sopra read model NEXT e orchestrazione controllata",
    connectedModules: ["IA interna NEXT", "Backend IA separato", "Dossier Mezzo", "Centro di Controllo"],
    layerIds: ["docs_truth", "domain_read_model", "next", "backend_ia", "renderer_ui"],
    filePaths: [
      "src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts",
      "src/next/internal-ai/internalAiChatOrchestrator.ts",
      "src/next/internal-ai/internalAiOutputSelector.ts",
      "src/next/NextInternalAiPage.tsx",
      "backend/internal-ai/server/internal-ai-adapter.js",
      "backend/internal-ai/server/internal-ai-repo-understanding.js",
    ],
    upstreamFlow: [
      "La capability IA deve leggere un read model NEXT gia spiegabile e non collegarsi direttamente alla pagina madre o ai writer legacy.",
    ],
    downstreamFlow: [
      "L'output puo vivere nel thread, in un report o in una proposta di integrazione, ma senza trasformare l'IA nella nuova UI business canonica.",
    ],
    whereIntervene:
      "Il punto corretto di integrazione e sopra il read model NEXT e dentro l'orchestrazione IA, con output selector e pagina IA come renderer finale del risultato.",
    impactRisk: "ELEVATO",
    recommendedIntegrationPoint:
      "Read model NEXT -> orchestratore/motore IA -> output selector -> `NextInternalAiPage.tsx`; backend IA solo se serve retrieval o repo understanding server-side.",
    action:
      "Definisci prima quale flusso operativo legge, quale read model usa e quale formato di output serve; poi aggancia la capability nel layer IA e non nella madre.",
    referenceDocPaths: [
      "docs/product/CHECKLIST_IA_INTERNA.md",
      "docs/product/STATO_MIGRAZIONE_NEXT.md",
      "docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md",
    ],
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
  "moduli collegati",
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
  "inserire modulo",
  "nuovo modulo",
  "dove va messo",
  "dove inserirlo",
  "flusso",
  "flussi",
  "semplificare il flusso",
  "dove intervenire",
  "file da leggere",
  "file da toccare",
  "file coinvolti",
  "dipendenze",
  "rischio di impatto",
  "impatto",
  "impattare",
  "moduli impattati",
  "backend ia",
  "domain layer",
  "read model",
  "renderer",
  "documentazione di verita",
  "runtime",
];

function compactLine(line) {
  return line
    .replace(/^#+\s*/g, "")
    .replace(/^[-*]\s+/g, "")
    .replace(/`/g, "")
    .trim();
}

function normalizeRepoPrompt(prompt) {
  return String(prompt ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
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
    layerBoundaries: REPO_LAYER_BOUNDARIES,
    flowPlaybooks: buildRepoFlowPlaybookSnapshot(),
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
      "La snapshot include ora anche una mappa pratica dei layer madre/NEXT/backend IA/domain/UI e un catalogo operativo di flussi, impatti e punti di integrazione riusabili nella chat.",
      "L'audit Firebase allegato descrive readiness e blocchi reali per Firestore/Storage read-only lato server, senza aprire accessi business.",
      "L'osservatore runtime NEXT resta read-only e limitato alle route /next/* whitelistate: nessun click generico, nessun submit e nessuna scrittura business.",
    ],
    limitations: [
      "L'indice repository non e una parse completa di AST, JSX o dipendenze runtime: e un livello metadata-driven e controllato.",
      "La relazione madre vs NEXT e mappata solo per aree chiave e file rappresentativi, non per ogni componente del repo.",
      "Le risposte repo/flusso/infrastruttura restano guidate da playbook curati: aiutano su ownership, file e impatti, ma non sostituiscono una analisi completa di ogni edge case del runtime legacy.",
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
    layerBoundaryCount: snapshot.layerBoundaries?.length ?? REPO_LAYER_BOUNDARIES.length,
    flowPlaybookCount: snapshot.flowPlaybooks?.length ?? REPO_FLOW_PLAYBOOKS.length,
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
  const normalized = normalizeRepoPrompt(prompt);
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

function buildRepoFlowPlaybookSnapshot() {
  return REPO_FLOW_PLAYBOOKS.map((entry) => ({
    id: entry.id,
    label: entry.label,
    architecturalArea: entry.architecturalArea,
    connectedModules: entry.connectedModules,
    layerIds: entry.layerIds,
    filePaths: entry.filePaths,
    upstreamFlow: entry.upstreamFlow,
    downstreamFlow: entry.downstreamFlow,
    impactRisk: entry.impactRisk,
    recommendedIntegrationPoint: entry.recommendedIntegrationPoint,
    action: entry.action,
  }));
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
    layerBoundaries: snapshot.layerBoundaries ?? REPO_LAYER_BOUNDARIES,
    flowPlaybooks: snapshot.flowPlaybooks?.slice(0, 6) ?? buildRepoFlowPlaybookSnapshot().slice(0, 6),
    runtimeObserver: trimRuntimeObserverForChat(snapshot.runtimeObserver),
    integrationGuidance: snapshot.integrationGuidance,
    representativeRoutes: snapshot.representativeRoutes,
    screenRelations: snapshot.screenRelations,
    firebaseReadiness: snapshot.firebaseReadiness,
    notes: snapshot.notes.slice(0, 4),
    limitations: snapshot.limitations.slice(0, 4),
  };
}

function countPromptMatches(normalizedPrompt, patterns) {
  return patterns.reduce((count, pattern) => {
    return normalizedPrompt.includes(pattern) ? count + 1 : count;
  }, 0);
}

function findRepoFlowPlaybook(prompt) {
  const normalizedPrompt = normalizeRepoPrompt(prompt);
  let bestEntry = null;
  let bestScore = 0;

  for (const entry of REPO_FLOW_PLAYBOOKS) {
    const score = countPromptMatches(normalizedPrompt, entry.detectionPatterns);
    if (score > bestScore) {
      bestEntry = entry;
      bestScore = score;
    }
  }

  return bestScore > 0 ? bestEntry : null;
}

function findLayerBoundary(layerId) {
  return REPO_LAYER_BOUNDARIES.find((entry) => entry.id === layerId) ?? null;
}

function findDocumentTitle(snapshot, documentPath) {
  return snapshot.documents.find((document) => document.path === documentPath)?.title ?? null;
}

function findGuidanceEntryByPrompt(playbook, prompt, snapshot) {
  const normalizedPrompt = normalizeRepoPrompt(prompt);
  if (playbook.id === "ia_operational_flow") {
    return snapshot.integrationGuidance.find((entry) => entry.id === "ia-internal-overlay") ?? null;
  }

  if (playbook.id === "rifornimenti_flow" || playbook.id === "dossier_mezzo") {
    return snapshot.integrationGuidance.find((entry) => entry.id === "mezzo-centric-section") ?? null;
  }

  if (playbook.id === "home_operativa") {
    return snapshot.integrationGuidance.find((entry) => entry.id === "cockpit-priority-card") ?? null;
  }

  if (playbook.id === "nuovo_modulo") {
    if (normalizedPrompt.includes("ia")) {
      return snapshot.integrationGuidance.find((entry) => entry.id === "ia-internal-overlay") ?? null;
    }

    if (
      normalizedPrompt.includes("ordine") ||
      normalizedPrompt.includes("fornitor") ||
      normalizedPrompt.includes("preventiv") ||
      normalizedPrompt.includes("procurement")
    ) {
      return snapshot.integrationGuidance.find((entry) => entry.id === "procurement-tab-workbench") ?? null;
    }

    if (
      normalizedPrompt.includes("magazzin") ||
      normalizedPrompt.includes("inventari") ||
      normalizedPrompt.includes("material") ||
      normalizedPrompt.includes("lavor") ||
      normalizedPrompt.includes("manutenz")
    ) {
      return snapshot.integrationGuidance.find((entry) => entry.id === "operativita-global-page") ?? null;
    }

    if (
      normalizedPrompt.includes("alert") ||
      normalizedPrompt.includes("priorita") ||
      normalizedPrompt.includes("home") ||
      normalizedPrompt.includes("centro controllo")
    ) {
      return snapshot.integrationGuidance.find((entry) => entry.id === "cockpit-priority-card") ?? null;
    }

    return snapshot.integrationGuidance.find((entry) => entry.id === "mezzo-centric-section") ?? null;
  }

  return null;
}

function buildRepoOperationalReferences(playbook, snapshot, guidanceEntry) {
  const references = [];
  const seen = new Set();

  const pushReference = (type, label) => {
    if (!label || seen.has(`${type}:${label}`)) {
      return;
    }
    seen.add(`${type}:${label}`);
    references.push({ type, label, targa: null });
  };

  pushReference("repo_understanding", `Playbook repo/flussi: ${playbook.label}`);

  for (const documentPath of playbook.referenceDocPaths.slice(0, 3)) {
    const title = findDocumentTitle(snapshot, documentPath);
    pushReference("architecture_doc", title ?? documentPath);
  }

  for (const filePath of playbook.filePaths.slice(0, 3)) {
    pushReference("repo_understanding", `File chiave: ${filePath}`);
  }

  if (guidanceEntry) {
    pushReference(
      "integration_guidance",
      `Integrazione consigliata: ${guidanceEntry.recommendedModuleLabel}`,
    );
  }

  return references;
}

function buildFileAndLayerLines(playbook) {
  const lines = [];
  const seen = new Set();

  for (const filePath of playbook.filePaths) {
    if (seen.has(filePath)) {
      continue;
    }
    seen.add(filePath);
    lines.push(`- ${filePath}`);
  }

  for (const layerId of playbook.layerIds) {
    const layer = findLayerBoundary(layerId);
    if (!layer) {
      continue;
    }

    const label = `${layer.label}: ${layer.rootPaths.join(", ")}`;
    if (seen.has(label)) {
      continue;
    }

    seen.add(label);
    lines.push(`- ${label}`);
  }

  return lines;
}

function buildPerimeterLines(playbook) {
  return playbook.layerIds
    .map((layerId) => findLayerBoundary(layerId))
    .filter(Boolean)
    .map((layer) => `- ${layer.label}: ${layer.summary}`);
}

function buildConnectedModuleLines(playbook, guidanceEntry) {
  const items = Array.from(
    new Set([
      ...playbook.connectedModules,
      ...(guidanceEntry?.impactedModules ?? []),
    ]),
  );

  return items.map((entry) => `- ${entry}`);
}

function buildIntegrationPointLine(playbook, guidanceEntry) {
  if (!guidanceEntry) {
    return `- ${playbook.recommendedIntegrationPoint}`;
  }

  const routeLabel = guidanceEntry.recommendedRoutePaths.length
    ? ` sulle route ${guidanceEntry.recommendedRoutePaths.join(", ")}`
    : "";

  return (
    `- ${playbook.recommendedIntegrationPoint} ` +
    `(modulo consigliato: ${guidanceEntry.recommendedModuleLabel}, ` +
    `superficie primaria: ${guidanceEntry.primarySurfaceKind}${routeLabel}).`
  );
}

function formatSection(title, lines) {
  return `${title}:\n${lines.join("\n")}`;
}

export function buildRepoOperationalAnswer(prompt, snapshot) {
  const playbook = findRepoFlowPlaybook(prompt);
  if (!playbook) {
    return null;
  }

  const guidanceEntry = findGuidanceEntryByPrompt(playbook, prompt, snapshot);
  const sections = [
    formatSection("Sintesi breve", [
      `- ${playbook.whereIntervene}`,
      `- Area architetturale: ${playbook.architecturalArea}.`,
    ]),
    formatSection("Moduli collegati", buildConnectedModuleLines(playbook, guidanceEntry)),
    formatSection("Flusso a monte e a valle", [
      ...playbook.upstreamFlow.map((entry) => `- A monte: ${entry}`),
      ...playbook.downstreamFlow.map((entry) => `- A valle: ${entry}`),
    ]),
    formatSection("File/layer da leggere prima", buildFileAndLayerLines(playbook)),
    formatSection("Perimetro logica", buildPerimeterLines(playbook)),
    formatSection("Dove intervenire", [`- ${playbook.whereIntervene}`]),
    formatSection("Rischio impatto", [
      `- ${playbook.impactRisk}: verifica moduli collegati e dipendenze prima di toccare il layer owner.`,
    ]),
    formatSection("Punto consigliato di integrazione", [buildIntegrationPointLine(playbook, guidanceEntry)]),
    formatSection("Azione consigliata", [`- ${playbook.action}`]),
  ];

  return {
    playbookId: playbook.id,
    assistantText: sections.join("\n\n"),
    references: buildRepoOperationalReferences(playbook, snapshot, guidanceEntry),
  };
}
