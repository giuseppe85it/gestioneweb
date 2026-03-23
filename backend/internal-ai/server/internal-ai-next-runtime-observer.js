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

function buildTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export const INTERNAL_AI_NEXT_RUNTIME_OBSERVER_CATALOG_VERSION = "2026-03-23-total-ui-v1";

const runtimeObserverTodayIsoDate = buildTodayIsoDate();
const runtimeObserverCurrentMonthKey = buildCurrentMonthKey();

export const INTERNAL_AI_NEXT_RUNTIME_OBSERVER_ROUTE_SPECS = [
  {
    id: "next-home",
    label: "Home NEXT",
    path: "/next",
    screenType: "cockpit",
    sourcePaths: ["src/next/NextHomePage.tsx", "src/pages/Home.tsx"],
    safeStateProbes: [
      {
        id: "quicklinks-accordion",
        label: "Quick link operativi",
        kind: "card_state",
        selector: ".quick-accordion-toggle",
        successSelector: ".quick-accordion-body",
      },
      {
        id: "important-events-modal",
        label: "Eventi importanti autisti",
        kind: "dialog_state",
        selector: 'button:has-text("Vedi tutto")',
        successSelector: '.home-modal[aria-modal="true"], .home-modal-backdrop .home-modal',
      },
    ],
    notes: ["Ingresso clone-side del gestionale con quick link, priorita globali e modali locali non distruttive."],
  },
  {
    id: "next-centro-controllo",
    label: "Centro di Controllo",
    path: "/next/centro-controllo",
    screenType: "cockpit",
    sourcePaths: ["src/next/NextCentroControlloClonePage.tsx", "src/pages/CentroControllo.tsx"],
    safeStateProbes: [
      {
        id: "tab-rifornimenti",
        label: "Tab rifornimenti",
        kind: "tab_state",
        selector: '.cc-tabs button:has-text("Report rifornimenti")',
        successSelector: "#cc-anchor-rifornimenti",
      },
      {
        id: "tab-segnalazioni",
        label: "Tab segnalazioni",
        kind: "tab_state",
        selector: '.cc-tabs button:has-text("Segnalazioni")',
        successSelector: "#cc-anchor-segnalazioni",
      },
      {
        id: "tab-controlli",
        label: "Tab controlli",
        kind: "tab_state",
        selector: '.cc-tabs button:has-text("Controlli")',
        successSelector: "#cc-anchor-controlli",
      },
      {
        id: "tab-richieste",
        label: "Tab richieste",
        kind: "tab_state",
        selector: '.cc-tabs button:has-text("Richieste")',
        successSelector: "#cc-anchor-richieste",
      },
    ],
    notes: ["Cockpit operativo read-only con tab, filtri, richieste e preview PDF locali."],
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
    safeStateProbes: [
      {
        id: "categoria-dossier",
        label: "Categoria dossier aperta",
        kind: "card_state",
        selector: "div.dossierlista-card",
        successSelector: "a.dossierlista-card",
      },
    ],
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
    id: "next-ia-apikey",
    label: "IA - API key",
    path: "/next/ia/apikey",
    screenType: "documentale",
    sourcePaths: ["src/next/NextIAApiKeyPage.tsx", "src/pages/IA/IAApiKey.tsx"],
    safeStateProbes: [
      {
        id: "toggle-apikey",
        label: "Mostra API key",
        kind: "detail_state",
        selector: '.ia-apikey-toggle:has-text("Mostra")',
        successSelector: '.ia-apikey-toggle:has-text("Nascondi")',
      },
    ],
    notes: ["Pagina configurazione visibile ma sempre nel perimetro clone-safe senza segreti reali lato client."],
  },
  {
    id: "next-ia-libretto-archive",
    label: "IA - Libretto (archivio)",
    path: "/next/ia/libretto?archive=1",
    screenType: "documentale",
    sourcePaths: ["src/next/NextIALibrettoPage.tsx", "src/pages/IA/IALibretto.tsx"],
    notes: ["Vista archivio libretto osservata in GET-only con query state esplicito."],
  },
  {
    id: "next-ia-documenti",
    label: "IA - Documenti",
    path: "/next/ia/documenti",
    screenType: "documentale",
    sourcePaths: ["src/next/NextIADocumentiPage.tsx", "src/pages/IA/IADocumenti.tsx"],
    notes: ["Vista documentale legacy-clone osservabile solo in sola lettura; upload e salvataggi restano bloccati."],
  },
  {
    id: "next-ia-copertura-libretti",
    label: "IA - Copertura libretti",
    path: "/next/ia/copertura-libretti",
    screenType: "documentale",
    sourcePaths: ["src/next/NextIACoperturaLibrettiPage.tsx", "src/pages/IA/IACoperturaLibretti.tsx"],
    notes: ["Matrice copertura libretti clone-safe con filtri GET-only e upload neutralizzati."],
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
    id: "next-libretti-export",
    label: "Libretti Export",
    path: "/next/libretti-export",
    screenType: "documentale",
    sourcePaths: ["src/next/NextLibrettiExportPage.tsx"],
    notes: ["Perimetro clone-safe minimo: lista, selezione e anteprima PDF locale."],
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
        successSelector: '[role="tab"][aria-selected="true"]:has-text("Ordini"), .acq-tab.is-active:has-text("Ordini")',
      },
      {
        id: "tab-arrivi",
        label: "Tab Arrivi",
        kind: "tab_state",
        selector: 'button:has-text("Arrivi"), [role="tab"]:has-text("Arrivi"), a:has-text("Arrivi")',
        successSelector: '[role="tab"][aria-selected="true"]:has-text("Arrivi"), .acq-tab.is-active:has-text("Arrivi")',
      },
      {
        id: "tab-prezzi-preventivi",
        label: "Tab Prezzi e Preventivi",
        kind: "tab_state",
        selector:
          'button:has-text("Prezzi & Preventivi"), [role="tab"]:has-text("Prezzi & Preventivi"), a:has-text("Prezzi & Preventivi")',
        successSelector:
          '[role="tab"][aria-selected="true"]:has-text("Prezzi & Preventivi"), .acq-tab.is-active:has-text("Prezzi & Preventivi")',
      },
      {
        id: "tab-listino",
        label: "Tab Listino Prezzi",
        kind: "tab_state",
        selector:
          'button:has-text("Listino Prezzi"), [role="tab"]:has-text("Listino Prezzi"), a:has-text("Listino Prezzi")',
        successSelector:
          '[role="tab"][aria-selected="true"]:has-text("Listino Prezzi"), .acq-tab.is-active:has-text("Listino Prezzi")',
      },
      {
        id: "menu-ordine",
        label: "Menu ordine read-only",
        kind: "menu_state",
        selector: ".acq-kebab-trigger",
        successSelector: ".acq-kebab-menu",
      },
    ],
    notes: ["Dominio ordini/preventivi globale, non ideale come primo hook IA mezzo-centrico."],
  },
  {
    id: "next-operativita-globale-redirect",
    label: "Operativita Globale (redirect tecnico)",
    path: "/next/operativita-globale",
    screenType: "operativita_globale",
    sourcePaths: ["src/next/NextOperativitaLegacyRedirect.tsx", "src/next/NextGestioneOperativaPage.tsx"],
    notes: ["Redirect tecnico mantenuto per compatibilita verso la route reale /next/gestione-operativa."],
  },
  {
    id: "next-inventario",
    label: "Inventario",
    path: "/next/inventario",
    screenType: "operativita_globale",
    sourcePaths: ["src/next/NextInventarioPage.tsx", "src/pages/Inventario.tsx"],
    notes: ["Workbench inventario read-only con preview PDF locale e writer bloccati."],
  },
  {
    id: "next-materiali-consegnati",
    label: "Materiali Consegnati",
    path: "/next/materiali-consegnati",
    screenType: "operativita_globale",
    sourcePaths: ["src/next/NextMaterialiConsegnatiPage.tsx", "src/pages/MaterialiConsegnati.tsx"],
    notes: ["Lista destinatari, dettaglio locale e preview PDF nel perimetro clone-safe."],
  },
  {
    id: "next-attrezzature-cantieri",
    label: "Attrezzature Cantieri",
    path: "/next/attrezzature-cantieri",
    screenType: "operativita_globale",
    sourcePaths: ["src/next/NextAttrezzatureCantieriPage.tsx", "src/pages/AttrezzatureCantieri.tsx"],
    notes: ["Registro attrezzature con filtri, scope export e preview PDF, senza edit operative."],
  },
  {
    id: "next-manutenzioni",
    label: "Manutenzioni",
    path: "/next/manutenzioni",
    screenType: "operativita_globale",
    sourcePaths: ["src/next/NextManutenzioniPage.tsx", "src/pages/Manutenzioni.tsx"],
    notes: ["Storico manutenzioni read-only con filtri e anteprima PDF."],
  },
  {
    id: "next-materiali-da-ordinare",
    label: "Materiali Da Ordinare",
    path: "/next/materiali-da-ordinare",
    screenType: "operativita_globale",
    sourcePaths: ["src/next/NextMaterialiDaOrdinarePage.tsx", "src/pages/MaterialiDaOrdinare.tsx"],
    notes: ["Worklist procurement a basso rischio con sole letture clone-safe."],
  },
  {
    id: "next-ordini-in-attesa",
    label: "Ordini in Attesa",
    path: "/next/ordini-in-attesa",
    screenType: "procurement",
    sourcePaths: ["src/next/NextOrdiniInAttesaPage.tsx", "src/pages/OrdiniInAttesa.tsx"],
    notes: ["Lista ordini pending con dettaglio e preview PDF locale."],
  },
  {
    id: "next-ordini-arrivati",
    label: "Ordini Arrivati",
    path: "/next/ordini-arrivati",
    screenType: "procurement",
    sourcePaths: ["src/next/NextOrdiniArrivatiPage.tsx", "src/pages/OrdiniArrivati.tsx"],
    notes: ["Lista ordini arrivati con drill-down read-only e preview PDF locale."],
  },
  {
    id: "next-lavori-da-eseguire",
    label: "Lavori Da Eseguire",
    path: "/next/lavori-da-eseguire",
    screenType: "operativita_globale",
    sourcePaths: ["src/next/NextLavoriDaEseguirePage.tsx", "src/pages/LavoriDaEseguire.tsx"],
    notes: ["Vista backlog clone-safe con soli stati preparatori e writer bloccati."],
  },
  {
    id: "next-lavori-in-attesa",
    label: "Lavori in Attesa",
    path: "/next/lavori-in-attesa",
    screenType: "operativita_globale",
    sourcePaths: ["src/next/NextLavoriInAttesaPage.tsx", "src/pages/LavoriInAttesa.tsx"],
    notes: ["Lista globale lavori in attesa con route dettaglio ora leggibile in sola lettura."],
  },
  {
    id: "next-lavori-eseguiti",
    label: "Lavori Eseguiti",
    path: "/next/lavori-eseguiti",
    screenType: "operativita_globale",
    sourcePaths: ["src/next/NextLavoriEseguitiPage.tsx", "src/pages/LavoriEseguiti.tsx"],
    notes: ["Lista lavori eseguiti con navigazione clone-safe al dettaglio."],
  },
  {
    id: "next-capo-mezzi",
    label: "Area Capo - Mezzi",
    path: "/next/capo/mezzi",
    screenType: "mezzo_centrico",
    sourcePaths: ["src/next/NextCapoMezziPage.tsx", "src/pages/CapoMezzi.tsx"],
    notes: ["Overview per targa verso costi e documenti in sola lettura."],
  },
  {
    id: "next-colleghi",
    label: "Colleghi",
    path: "/next/colleghi",
    screenType: "documentale",
    sourcePaths: ["src/next/NextColleghiPage.tsx", "src/pages/Colleghi.tsx"],
    safeStateProbes: [
      {
        id: "modal-collega",
        label: "Dettaglio collega",
        kind: "dialog_state",
        selector: ".coll-item",
        successSelector: ".modal-container",
      },
    ],
    notes: ["Anagrafica colleghi con dettaglio modale read-only."],
  },
  {
    id: "next-fornitori",
    label: "Fornitori",
    path: "/next/fornitori",
    screenType: "documentale",
    sourcePaths: ["src/next/NextFornitoriPage.tsx", "src/pages/Fornitori.tsx"],
    notes: ["Anagrafica fornitori consultabile in sola lettura."],
  },
  {
    id: "next-autisti-inbox",
    label: "Autisti Inbox",
    path: "/next/autisti-inbox",
    screenType: "autista",
    sourcePaths: ["src/next/NextAutistiInboxHomePage.tsx", "src/autistiInbox/AutistiInboxHome.tsx"],
    safeStateProbes: [
      {
        id: "inbox-menu",
        label: "Menu inbox",
        kind: "menu_state",
        selector: ".autisti-menu-btn",
        successSelector: ".autisti-menu",
      },
      {
        id: "sessione-dettaglio",
        label: "Dettaglio sessione attiva",
        kind: "dialog_state",
        selector: ".sessione-row",
        successSelector: ".aix-modal",
      },
    ],
    notes: ["Raccolta e rettifica eventi autisti in sola lettura clone-safe."],
  },
  {
    id: "next-autisti-admin",
    label: "Autisti Admin",
    path: "/next/autisti-admin",
    screenType: "autista",
    sourcePaths: ["src/next/NextAutistiAdminPage.tsx", "src/autistiInbox/AutistiAdmin.tsx"],
    safeStateProbes: [
      {
        id: "tab-segnalazioni-admin",
        label: "Tab segnalazioni admin",
        kind: "tab_state",
        selector: '.autisti-admin-tabs .tab:has-text("Segnalazioni")',
        successSelector: '.autisti-admin-tabs .tab.active:has-text("Segnalazioni")',
      },
      {
        id: "tab-gomme-admin",
        label: "Tab gomme admin",
        kind: "tab_state",
        selector: '.autisti-admin-tabs .tab:has-text("Gomme")',
        successSelector: '.autisti-admin-tabs .tab.active:has-text("Gomme")',
      },
    ],
    notes: ["Backoffice eventi autisti e centro rettifica clone-safe."],
  },
  {
    id: "next-cisterna",
    label: "Cisterna",
    path: "/next/cisterna",
    screenType: "specialistico",
    sourcePaths: ["src/next/NextCisternaPage.tsx", "src/pages/CisternaCaravate/CisternaCaravatePage.tsx"],
    safeStateProbes: [
      {
        id: "month-picker",
        label: "Selettore mese",
        kind: "menu_state",
        selector: ".cisterna-month-picker-trigger",
        successSelector: ".cisterna-month-popover",
      },
      {
        id: "tab-report",
        label: "Tab report",
        kind: "tab_state",
        selector: '.cisterna-tabs button:has-text("Report")',
        successSelector: '.cisterna-tabs button.active:has-text("Report")',
      },
    ],
    notes: ["Verticale specialistico separato dal dossier standard."],
  },
  {
    id: "next-cisterna-ia",
    label: "Cisterna IA",
    path: `/next/cisterna/ia?month=${runtimeObserverCurrentMonthKey}`,
    screenType: "specialistico",
    sourcePaths: ["src/next/NextCisternaIAPage.tsx", "src/pages/CisternaCaravate/CisternaCaravateIA.tsx"],
    notes: ["Vista cisterna IA osservata con query month GET-only e senza attivare analisi o save."],
  },
  {
    id: "next-cisterna-schede-test",
    label: "Cisterna Schede Test",
    path: `/next/cisterna/schede-test?month=${runtimeObserverCurrentMonthKey}`,
    screenType: "specialistico",
    sourcePaths: ["src/next/NextCisternaSchedeTestPage.tsx", "src/pages/CisternaCaravate/CisternaSchedeTest.tsx"],
    notes: ["Vista schede test osservata in sola lettura sul mese corrente, senza entrare in edit/upload/save."],
  },
  {
    id: "next-autisti-inbox-cambio-mezzo",
    label: "Autisti Inbox - Cambio mezzo",
    path: `/next/autisti-inbox/cambio-mezzo?day=${runtimeObserverTodayIsoDate}`,
    screenType: "autista",
    sourcePaths: ["src/next/NextAutistiInboxCambioMezzoPage.tsx", "src/autistiInbox/CambioMezzoInbox.tsx"],
    notes: ["Listato cambio mezzo osservato con query day GET-only."],
  },
  {
    id: "next-autisti-inbox-log-accessi",
    label: "Autisti Inbox - Log accessi",
    path: "/next/autisti-inbox/log-accessi",
    screenType: "autista",
    sourcePaths: ["src/next/NextAutistiInboxLogAccessiPage.tsx", "src/autistiInbox/AutistiLogAccessiAll.tsx"],
    notes: ["Log accessi clone-safe con filtri locali non distruttivi."],
  },
  {
    id: "next-autisti-inbox-gomme",
    label: "Autisti Inbox - Gomme",
    path: "/next/autisti-inbox/gomme",
    screenType: "autista",
    sourcePaths: ["src/next/NextAutistiInboxGommePage.tsx", "src/autistiInbox/AutistiGommeAll.tsx"],
    notes: ["Listato gomme autisti con filtri/toggle locali e writer disattivati."],
  },
  {
    id: "next-autisti-inbox-controlli",
    label: "Autisti Inbox - Controlli",
    path: "/next/autisti-inbox/controlli",
    screenType: "autista",
    sourcePaths: ["src/next/NextAutistiInboxControlliPage.tsx", "src/autistiInbox/AutistiControlliAll.tsx"],
    notes: ["Listato controlli autisti read-only con preview PDF locale."],
  },
  {
    id: "next-autisti-inbox-segnalazioni",
    label: "Autisti Inbox - Segnalazioni",
    path: "/next/autisti-inbox/segnalazioni",
    screenType: "autista",
    sourcePaths: ["src/next/NextAutistiInboxSegnalazioniPage.tsx", "src/autistiInbox/AutistiSegnalazioniAll.tsx"],
    notes: ["Listato segnalazioni con accordion, foto e preview PDF senza side effect business."],
  },
  {
    id: "next-autisti-inbox-richiesta-attrezzature",
    label: "Autisti Inbox - Richieste attrezzature",
    path: "/next/autisti-inbox/richiesta-attrezzature",
    screenType: "autista",
    sourcePaths: ["src/next/NextAutistiInboxRichiestaAttrezzaturePage.tsx", "src/autistiInbox/RichiestaAttrezzatureAll.tsx"],
    notes: ["Listato richieste attrezzature con accordion e preview PDF clone-safe."],
  },
  {
    id: "next-mezzi-dossier-redirect",
    label: "Mezzi Dossier (redirect tecnico)",
    path: "/next/mezzi-dossier",
    screenType: "mezzo_centrico",
    sourcePaths: ["src/next/NextMezziDossierLegacyRedirect.tsx", "src/next/NextDossierListaPage.tsx"],
    notes: ["Redirect tecnico conservato per non lasciare rotto il path legacy mezzo-dossier."],
  },
  {
    id: "next-ia-gestionale-redirect",
    label: "IA Gestionale (redirect tecnico)",
    path: "/next/ia-gestionale",
    screenType: "documentale",
    sourcePaths: ["src/next/NextLegacyIaRedirect.tsx", "src/next/NextIntelligenzaArtificialePage.tsx"],
    notes: ["Redirect tecnico verso /next/ia per non perdere il vecchio path legacy."],
  },
  {
    id: "next-autisti-login",
    label: "Autisti - Login",
    path: "/next/autisti/login",
    screenType: "autista",
    sourcePaths: ["src/next/NextAutistiLoginPage.tsx", "src/autisti/LoginAutista.tsx"],
    notes: ["Ingresso clone-safe dell'app autisti separata; il resto del subtree resta legato a bootstrap sessione locale."],
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
    expectedPathPrefixes: ["/next/dossier/", "/next/dossiermezzi/"],
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
    safeStateProbes: [
      {
        id: "modal-lavori-attesa",
        label: "Dossier - lavori in attesa",
        kind: "dialog_state",
        selector: '.dossier-card .dossier-button:has-text("Mostra tutti")',
        successSelector: ".dossier-modal-card",
      },
      {
        id: "foto-mezzo",
        label: "Dossier - foto mezzo",
        kind: "dialog_state",
        selector: 'button[aria-label="Apri foto mezzo"]',
        successSelector: ".dossier-photo-modal",
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
    expectedPathPrefixes: ["/next/analisi-economica/"],
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
    expectedPathPrefixes: ["/next/dossier/"],
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
    expectedPathPrefixes: ["/next/dossier/"],
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
    safeStateProbes: [
      {
        id: "range-mese",
        label: "Rifornimenti - range mese",
        kind: "filter_state",
        selector: 'button:has-text("MESE")',
        successSelector: 'button.dossier-button.primary:has-text("MESE")',
      },
      {
        id: "range-12-mesi",
        label: "Rifornimenti - range 12 mesi",
        kind: "filter_state",
        selector: 'button:has-text("12 mesi")',
        successSelector: 'button.dossier-button.primary:has-text("12 mesi")',
      },
    ],
    notes: ["Sottosezione rifornimenti del dossier osservata in sola lettura."],
  },
  {
    id: "next-capo-costi-dettaglio",
    label: "Area Capo - Costi mezzo",
    screenType: "mezzo_centrico",
    sourcePaths: ["src/next/NextCapoCostiMezzoPage.tsx", "src/pages/CapoCostiMezzo.tsx"],
    discoveryFromRouteId: "next-capo-mezzi",
    startPath: "/next/capo/mezzi",
    expectedPathPrefixes: ["/next/capo/costi/"],
    discoverySteps: [
      {
        kind: "click_selector",
        selector: ".capo-mezzo-card",
        label: "Apri costi mezzo",
      },
    ],
    safeStateProbes: [
      {
        id: "capo-tab-preventivi",
        label: "Capo - tab preventivi",
        kind: "tab_state",
        selector: '.capo-tab:has-text("Preventivi")',
        successSelector: '.capo-tab.active:has-text("Preventivi")',
      },
      {
        id: "capo-solo-da-valutare",
        label: "Capo - solo da valutare",
        kind: "filter_state",
        selector: ".capo-approvazioni-toggle input",
        successSelector: ".capo-approvazioni-toggle input:checked",
      },
    ],
    notes: ["Drill-down costi mezzo raggiunto in sola lettura dalla overview capo."],
  },
  {
    id: "next-acquisti-dettaglio",
    label: "Acquisti - dettaglio ordine inline",
    screenType: "procurement",
    sourcePaths: ["src/next/NextDettaglioOrdinePage.tsx", "src/pages/Acquisti.tsx"],
    discoveryFromRouteId: "next-acquisti",
    startPath: "/next/acquisti",
    expectedPathPrefixes: ["/next/acquisti/dettaglio/"],
    discoverySteps: [
      {
        kind: "click_selector",
        selector: 'button:has-text("Apri")',
        label: "Apri dettaglio ordine inline",
      },
    ],
    notes: ["Dettaglio ordine inline procurement osservato da Acquisti con interazione read-only."],
  },
  {
    id: "next-dettaglio-ordine",
    label: "Dettaglio ordine",
    screenType: "procurement",
    sourcePaths: ["src/next/NextDettaglioOrdinePage.tsx", "src/pages/DettaglioOrdine.tsx"],
    discoveryFromRouteId: "next-ordini-in-attesa",
    startPath: "/next/ordini-in-attesa",
    expectedPathPrefixes: ["/next/dettaglio-ordine/"],
    discoverySteps: [
      {
        kind: "click_selector",
        selector: 'button:has-text("Dettaglio ordine")',
        label: "Apri dettaglio ordine dalla lista",
      },
    ],
    notes: ["Dettaglio ordine standalone osservato dalla coda ordini in attesa."],
  },
  {
    id: "next-dettaglio-lavoro",
    label: "Dettaglio lavoro",
    screenType: "operativita_globale",
    sourcePaths: ["src/next/NextDettaglioLavoroPage.tsx", "src/pages/DettaglioLavoro.tsx"],
    discoveryFromRouteId: "next-lavori-in-attesa",
    startPath: "/next/lavori-in-attesa",
    expectedPathPrefixes: ["/next/dettagliolavori/"],
    discoverySteps: [
      {
        kind: "click_selector",
        selector: "a.lavori-row",
        label: "Apri primo dettaglio lavoro",
      },
    ],
    notes: ["Dettaglio lavoro raggiunto dalla lista globale lavori in attesa."],
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
    evidenceRouteIds: [
      "next-gestione-operativa",
      "next-operativita-globale-redirect",
      "next-inventario",
      "next-materiali-consegnati",
      "next-attrezzature-cantieri",
      "next-manutenzioni",
      "next-materiali-da-ordinare",
      "next-lavori-da-eseguire",
      "next-lavori-in-attesa",
      "next-lavori-eseguiti",
      "next-dettaglio-lavoro",
    ],
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
      "next-ia-libretto-archive",
      "next-ia-documenti",
      "next-libretti-export",
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
    evidenceRouteIds: [
      "next-acquisti",
      "next-acquisti-dettaglio",
      "next-ordini-in-attesa",
      "next-ordini-arrivati",
      "next-dettaglio-ordine",
    ],
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
    evidenceRouteIds: [
      "next-autisti-inbox",
      "next-autisti-inbox-cambio-mezzo",
      "next-autisti-inbox-log-accessi",
      "next-autisti-inbox-gomme",
      "next-autisti-inbox-controlli",
      "next-autisti-inbox-segnalazioni",
      "next-autisti-inbox-richiesta-attrezzature",
      "next-autisti-admin",
      "next-centro-controllo",
    ],
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
    evidenceRouteIds: ["next-cisterna", "next-cisterna-ia", "next-cisterna-schede-test"],
    confidence: "media",
    antiPatterns: [
      "Forzare il verticale cisterna dentro il dossier standard.",
      "Mescolare funzioni cisterna e cockpit generico senza perimetro esplicito.",
    ],
    why:
      "Il dominio cisterna e specialistico e non conviene forzarlo dentro il dossier standard o nella IA generalista del clone.",
  }),
];

function buildRuntimeObserverStatusCounts(routes) {
  const routeEntries = Array.isArray(routes) ? routes : [];
  const stateEntries = routeEntries.flatMap((route) =>
    Array.isArray(route?.stateObservations) ? route.stateObservations : [],
  );

  return {
    observedRouteCount: routeEntries.filter((route) => route?.status === "observed").length,
    partialRouteCount: routeEntries.filter((route) => route?.status === "partial").length,
    unavailableRouteCount: routeEntries.filter((route) => route?.status === "unavailable").length,
    stateCount: stateEntries.length,
    observedStateCount: stateEntries.filter((state) => state?.status === "observed").length,
    partialStateCount: stateEntries.filter((state) => state?.status === "partial").length,
    unavailableStateCount: stateEntries.filter((state) => state?.status === "unavailable").length,
  };
}

export function createDefaultNextRuntimeObserverSnapshot() {
  return {
    version: 1,
    sourceMode: "playwright_next_readonly_runtime",
    status: "not_observed",
    catalogVersion: INTERNAL_AI_NEXT_RUNTIME_OBSERVER_CATALOG_VERSION,
    baseUrl: null,
    observedAt: null,
    routeCount: 0,
    observedRouteCount: 0,
    partialRouteCount: 0,
    unavailableRouteCount: 0,
    screenshotCount: 0,
    stateCount: 0,
    observedStateCount: 0,
    partialStateCount: 0,
    unavailableStateCount: 0,
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
    const counts = buildRuntimeObserverStatusCounts(parsed?.routes);
    return {
      ...createDefaultNextRuntimeObserverSnapshot(),
      ...parsed,
      catalogVersion:
        typeof parsed?.catalogVersion === "string"
          ? parsed.catalogVersion
          : INTERNAL_AI_NEXT_RUNTIME_OBSERVER_CATALOG_VERSION,
      observedRouteCount:
        typeof parsed?.observedRouteCount === "number"
          ? parsed.observedRouteCount
          : counts.observedRouteCount,
      partialRouteCount:
        typeof parsed?.partialRouteCount === "number"
          ? parsed.partialRouteCount
          : counts.partialRouteCount,
      unavailableRouteCount:
        typeof parsed?.unavailableRouteCount === "number"
          ? parsed.unavailableRouteCount
          : counts.unavailableRouteCount,
      stateCount:
        typeof parsed?.stateCount === "number"
          ? parsed.stateCount
          : counts.stateCount,
      observedStateCount:
        typeof parsed?.observedStateCount === "number"
          ? parsed.observedStateCount
          : counts.observedStateCount,
      partialStateCount:
        typeof parsed?.partialStateCount === "number"
          ? parsed.partialStateCount
          : counts.partialStateCount,
      unavailableStateCount:
        typeof parsed?.unavailableStateCount === "number"
          ? parsed.unavailableStateCount
          : counts.unavailableStateCount,
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
    catalogVersion:
      typeof snapshot.catalogVersion === "string"
        ? snapshot.catalogVersion
        : INTERNAL_AI_NEXT_RUNTIME_OBSERVER_CATALOG_VERSION,
    observedAt: snapshot.observedAt,
    routeCount: snapshot.routeCount,
    observedRouteCount: snapshot.observedRouteCount ?? 0,
    partialRouteCount: snapshot.partialRouteCount ?? 0,
    unavailableRouteCount: snapshot.unavailableRouteCount ?? 0,
    screenshotCount: snapshot.screenshotCount,
    stateCount: snapshot.stateCount ?? 0,
    observedStateCount: snapshot.observedStateCount ?? 0,
    partialStateCount: snapshot.partialStateCount ?? 0,
    unavailableStateCount: snapshot.unavailableStateCount ?? 0,
    nextOnly: snapshot.nextOnly,
    limitations: snapshot.limitations ?? [],
    notes: snapshot.notes ?? [],
  };
}
