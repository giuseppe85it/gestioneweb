import {
  NEXT_ATTREZZATURE_CANTIERI_PATH,
  NEXT_AUTISTI_ADMIN_PATH,
  NEXT_AUTISTI_APP_PATH,
  NEXT_AUTISTI_INBOX_PATH,
  NEXT_CENTRO_CONTROLLO_PATH,
  NEXT_CISTERNA_PATH,
  NEXT_DOSSIER_LISTA_PATH,
  NEXT_EUROMECC_PATH,
  NEXT_HOME_PATH,
  NEXT_MAGAZZINO_PATH,
  NEXT_IA_APIKEY_PATH,
  NEXT_IA_COPERTURA_LIBRETTI_PATH,
  NEXT_IA_DOCUMENTI_PATH,
  NEXT_IA_LIBRETTO_PATH,
  NEXT_LIBRETTI_EXPORT_PATH,
  NEXT_LAVORI_DA_ESEGUIRE_PATH,
  NEXT_MANUTENZIONI_PATH,
  NEXT_MATERIALI_DA_ORDINARE_PATH,
  NEXT_MEZZI_PATH,
  NEXT_STRUMENTI_UNISCI_DOCUMENTI_PATH,
} from "./nextStructuralPaths";

export type NextAreaId =
  | "centro-controllo"
  | "mezzi-dossier"
  | "operativita-globale"
  | "capo"
  | "anagrafiche"
  | "colleghi"
  | "fornitori"
  | "ia"
  | "libretti-export"
  | "cisterna";

export type NextRouteModuleId =
  | "home"
  | NextAreaId
  | "euromecc"
  | "autisti-inbox"
  | "autisti-admin"
  | "autista-separato"
  | "autista-legacy-redirect"
  | "ia-legacy-redirect";

export type NextRouteModuleStatus =
  | "ACTIVE"
  | "ACTIVE_PARTIAL"
  | "SEPARATE_EXPERIENCE"
  | "TECHNICAL_REDIRECT";

export type NextAreaTone = "default" | "accent" | "warning" | "success";

export type NextUiGrammar =
  | "Centro di controllo"
  | "Dossier"
  | "Workflow operativo"
  | "Area Capo"
  | "Anagrafica"
  | "Modulo IA"
  | "Export PDF"
  | "Modulo specialistico";

export type NextSummaryCard = {
  label: string;
  value: string;
  meta: string;
  tone?: NextAreaTone;
};

export type NextSection = {
  title: string;
  description: string;
  items?: string[];
  tone?: NextAreaTone;
};

export type NextAreaConfig = {
  id: NextAreaId;
  routePath: string;
  relatedPaths?: string[];
  navLabel: string;
  shortLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  phase: string;
  primaryGrammar: NextUiGrammar;
  searchPlaceholder: string;
  shellFocus: string;
  visibility: string[];
  cards: NextSummaryCard[];
  sections: NextSection[];
};

export type NextRouteModuleEntry = {
  id: NextRouteModuleId;
  path: string;
  label: string;
  status: NextRouteModuleStatus;
  note: string;
};

export type NextShellNavSectionId =
  | "principale"
  | "flotta"
  | "operativita"
  | "magazzino"
  | "strumenti"
  | "anagrafiche"
  | "cisterna"
  | "ia"
  | "autisti"
  | "gestione"
  | "sistema";

export type NextShellNavItem = {
  id: string;
  label: string;
  path?: string;
  exact?: boolean;
  disabled?: boolean;
  queryParamKey?: string;
  queryParamValue?: string;
};

export type NextShellNavSection = {
  id: NextShellNavSectionId;
  title: string;
  items: readonly NextShellNavItem[];
};

export const NEXT_SHELL_NAV_SECTIONS: readonly NextShellNavSection[] = [
  {
    id: "principale",
    title: "PRINCIPALE",
    items: [
      { id: "dashboard", label: "Dashboard", path: NEXT_HOME_PATH, exact: true },
      { id: "alert", label: "Alert", path: NEXT_CENTRO_CONTROLLO_PATH },
      {
        id: "segnalazioni",
        label: "Segnalazioni",
        path: `${NEXT_AUTISTI_INBOX_PATH}/segnalazioni`,
      },
    ],
  },
  {
    id: "flotta",
    title: "FLOTTA",
    items: [
      { id: "motrici", label: "Motrici e trattori", path: NEXT_DOSSIER_LISTA_PATH },
      { id: "rimorchi", label: "Rimorchi", disabled: true },
      {
        id: "scadenze",
        label: "Scadenze",
        queryParamKey: "scadenze",
        queryParamValue: "tutte",
      },
      { id: "dossier", label: "Dossier mezzo", path: NEXT_DOSSIER_LISTA_PATH },
    ],
  },
  {
    id: "operativita",
    title: "OPERATIVITA'",
    items: [
      { id: "lavori", label: "Lavori", path: NEXT_LAVORI_DA_ESEGUIRE_PATH },
      { id: "manutenzioni", label: "Manutenzioni", path: NEXT_MANUTENZIONI_PATH },
    ],
  },
  {
    id: "magazzino",
    title: "MAGAZZINO",
    items: [
      { id: "magazzino", label: "Magazzino", path: NEXT_MAGAZZINO_PATH },
      {
        id: "materiali-da-ordinare",
        label: "Materiali da ordinare",
        path: NEXT_MATERIALI_DA_ORDINARE_PATH,
      },
      {
        id: "attrezzature",
        label: "Attrezzature cantieri",
        path: NEXT_ATTREZZATURE_CANTIERI_PATH,
      },
      {
        id: "euromecc",
        label: "Euromecc",
        path: NEXT_EUROMECC_PATH,
      },
    ],
  },
  {
    id: "strumenti",
    title: "STRUMENTI",
    items: [
      {
        id: "unisci-documenti",
        label: "Unisci documenti",
        path: NEXT_STRUMENTI_UNISCI_DOCUMENTI_PATH,
      },
    ],
  },
  {
    id: "anagrafiche",
    title: "ANAGRAFICHE",
    items: [
      { id: "anagrafiche", label: "Anagrafiche", path: "/next/anagrafiche" },
      { id: "mezzi-aziendali", label: "Mezzi aziendali", path: NEXT_MEZZI_PATH },
    ],
  },
  {
    id: "cisterna",
    title: "CISTERNA",
    items: [{ id: "cisterna-caravate", label: "Cisterna Caravate", path: NEXT_CISTERNA_PATH }],
  },
  {
    id: "ia",
    title: "IA",
    items: [
      { id: "ia-libretto", label: "Libretto", path: NEXT_IA_LIBRETTO_PATH },
      { id: "ia-documenti", label: "Documenti", path: NEXT_IA_DOCUMENTI_PATH },
      {
        id: "ia-copertura-libretti",
        label: "Copertura libretti",
        path: NEXT_IA_COPERTURA_LIBRETTI_PATH,
      },
      { id: "libretti-export", label: "Export libretti", path: NEXT_LIBRETTI_EXPORT_PATH },
    ],
  },
  {
    id: "autisti",
    title: "AUTISTI",
    items: [
      { id: "app-autisti", label: "App Autisti", path: NEXT_AUTISTI_APP_PATH },
      { id: "autisti-inbox", label: "Autisti Inbox", path: NEXT_AUTISTI_INBOX_PATH },
      { id: "autisti-admin", label: "Autisti Admin", path: NEXT_AUTISTI_ADMIN_PATH },
    ],
  },
  {
    id: "gestione",
    title: "GESTIONE",
    items: [{ id: "area-capo", label: "Area capo", path: "/next/capo/mezzi" }],
  },
  {
    id: "sistema",
    title: "SISTEMA",
    items: [
      { id: "api-key", label: "API Key", path: NEXT_IA_APIKEY_PATH },
      { id: "impostazioni", label: "Impostazioni", disabled: true },
    ],
  },
] as const;

// Ingressi top-level della shell clone. Non coincidono con l'intero catalogo delle
// route attive, che e descritto in NEXT_ROUTE_MODULES.
export const NEXT_NAV_ITEMS = [
  {
    id: "home",
    path: "/next",
    label: "Home",
    scope: "Dashboard madre",
  },
  {
    id: "centro-controllo",
    path: "/next/centro-controllo",
    label: "Centro Controllo",
    scope: "Pagina madre dedicata",
  },
  {
    id: "operativita-globale",
    path: "/next/gestione-operativa",
    label: "Gestione Operativa",
    scope: "Workflow e code",
  },
  {
    id: "mezzi-dossier",
    path: "/next/mezzi",
    label: "Mezzi",
    scope: "Anagrafiche flotta",
  },
  {
    id: "dossier-lista",
    path: "/next/dossiermezzi",
    label: "Dossier Mezzi",
    scope: "Ingresso dossier madre-like",
  },
  {
    id: "ia",
    path: "/next/ia",
    label: "IA",
    scope: "Hub madre + sotto-moduli clone-safe",
  },
  {
    id: "libretti-export",
    path: "/next/libretti-export",
    label: "Libretti Export",
    scope: "Export PDF clone-safe",
  },
  {
    id: "cisterna",
    path: "/next/cisterna",
    label: "Cisterna",
    scope: "Archivio, report e moduli clone-safe",
  },
  {
    id: "anagrafiche",
    path: "/next/anagrafiche",
    label: "Anagrafiche",
    scope: "Colleghi, fornitori e officine",
  },
  {
    id: "autisti-inbox",
    path: "/next/autisti-inbox",
    label: "Autisti Inbox",
    scope: "Home inbox e listati admin",
  },
  {
    id: "autisti-admin",
    path: "/next/autisti-admin",
    label: "Autisti Admin",
    scope: "Centro rettifica dati reader-first",
  },
  {
    id: "autista-separato",
    path: "/next/autisti",
    label: "App Autisti",
    scope: "Esperienza autista clone-safe separata",
  },
] as const;

export const NEXT_ROUTE_MODULES: NextRouteModuleEntry[] = [
  {
    id: "home",
    path: "/next",
    label: "Home",
    status: "ACTIVE",
    note: "Controparte clone autonoma della Home madre, separata dal Centro Controllo.",
  },
  {
    id: "centro-controllo",
    path: "/next/centro-controllo",
    label: "Centro di Controllo",
    status: "ACTIVE",
    note: "Controparte clone autonoma della pagina madre `CentroControllo`, separata dalla Home clone.",
  },
  {
    id: "operativita-globale",
    path: "/next/gestione-operativa",
    label: "Operativita Globale",
    status: "ACTIVE_PARTIAL",
    note: "Famiglia NEXT riallineata a route autonome per `Gestione Operativa`, `Magazzino`, `Attrezzature Cantieri`, `Manutenzioni`, procurement, liste lavori, `Autisti Inbox` e `Autisti Admin`; `/next/magazzino` governa il contratto stock lato NEXT, mentre `/next/inventario` e `/next/materiali-consegnati` restano solo redirect di compatibilita.",
  },
  {
    id: "euromecc",
    path: NEXT_EUROMECC_PATH,
    label: "Euromecc",
    status: "ACTIVE_PARTIAL",
    note: "Modulo nativo NEXT sotto `MAGAZZINO`, senza dipendenze dalla madre e con scrittura reale limitata alle collection Firestore dedicate `euromecc_pending`, `euromecc_done`, `euromecc_issues`.",
  },
  {
    id: "mezzi-dossier",
    path: "/next/mezzi",
    label: "Mezzi / Dossier",
    status: "ACTIVE",
    note: "Famiglia clone read-only riallineata su `Mezzi`, `Dossier Mezzi`, dossier dettaglio, `Dossier Gomme`, `Dossier Rifornimenti` e `Analisi Economica` come route autonome.",
  },
  {
    id: "capo",
    path: "/next/capo/mezzi",
    label: "Area Capo",
    status: "ACTIVE_PARTIAL",
    note: "Route attive per overview mezzi e costi, con approvazioni e PDF timbrati ancora bloccati.",
  },
  {
    id: "anagrafiche",
    path: "/next/anagrafiche",
    label: "Anagrafiche",
    status: "ACTIVE",
    note: "Modulo NEXT unificato per Colleghi, Fornitori e Officine con scrittura Firestore scoped dalla barriera clone.",
  },
  {
    id: "colleghi",
    path: "/next/colleghi",
    label: "Colleghi",
    status: "ACTIVE",
    note: "Anagrafica clone read-only realmente consultabile.",
  },
  {
    id: "fornitori",
    path: "/next/fornitori",
    label: "Fornitori",
    status: "ACTIVE",
    note: "Anagrafica clone read-only realmente consultabile.",
  },
  {
    id: "autisti-inbox",
    path: "/next/autisti-inbox",
    label: "Autisti Inbox",
    status: "ACTIVE",
    note: "Home inbox clone-safe con `NextAutistiEventoModal` e sei listati dedicati (`cambio-mezzo`, `log-accessi`, `gomme`, `controlli`, `segnalazioni`, `richiesta-attrezzature`).",
  },
  {
    id: "autisti-admin",
    path: "/next/autisti-admin",
    label: "Autisti Admin",
    status: "ACTIVE_PARTIAL",
    note: "Controparte reader-first del centro rettifica dati: tabs, filtri, foto e PDF in consultazione, senza rettifiche, `crea lavoro` o delete allegati.",
  },
  {
    id: "ia",
    path: "/next/ia",
    label: "Intelligenza Artificiale",
    status: "ACTIVE_PARTIAL",
    note: "Hub clone strutturalmente riallineato alla madre, con child route autonome per `apikey`, `libretto`, `documenti`, `copertura-libretti` e `Libretti Export`; tutte le scritture restano neutralizzate.",
  },
  {
    id: "libretti-export",
    path: "/next/libretti-export",
    label: "Libretti (Export PDF)",
    status: "ACTIVE_PARTIAL",
    note: "Perimetro clone-safe minimo: lista, selezione e anteprima PDF locale.",
  },
  {
    id: "cisterna",
    path: "/next/cisterna",
    label: "Cisterna",
    status: "ACTIVE_PARTIAL",
    note: "Route base clone-safe con archivio, report mensile e ripartizioni per targa; anche `Cisterna IA` e `Schede Test` sono ora navigabili, ma upload, analisi, save/update ed export restano bloccati.",
  },
  {
    id: "autista-separato",
    path: "/next/autisti",
    label: "Area Autista",
    status: "ACTIVE_PARTIAL",
    note: "Terza tranche clone-safe completata sui tre moduli auditati: `AutistiGate`, `LoginAutista`, `SetupMezzo`, `ControlloMezzo`, `HomeAutista`, `CambioMezzoAutista`, `Rifornimento` clone-local, `Segnalazioni` con foto solo locali, `RichiestaAttrezzature` con foto solo locali e flusso `Gomme` raggiungibile dalla home clone, con sessione locale namespaced, route legacy riscritte su `/next/autisti/*` e scritture madre esplicitamente non sincronizzate.",
  },
  {
    id: "autista-legacy-redirect",
    path: "/next/autista",
    label: "Redirect legacy area autista",
    status: "TECHNICAL_REDIRECT",
    note: "Redirect tecnico verso `/next/autisti` per non lasciare rotto il vecchio placeholder autista separato.",
  },
  {
    id: "ia-legacy-redirect",
    path: "/next/ia-gestionale",
    label: "Redirect legacy IA",
    status: "TECHNICAL_REDIRECT",
    note: "Redirect tecnico verso /next/ia per non lasciare il vecchio path rotto.",
  },
];

export const NEXT_AREAS: Record<NextAreaId, NextAreaConfig> = {
  "centro-controllo": {
    id: "centro-controllo",
    routePath: "/next/centro-controllo",
    navLabel: "Centro di Controllo",
    shortLabel: "Centro",
    eyebrow: "Cockpit operativo",
    title: "Centro di Controllo",
    description:
      "Controparte clone autonoma della pagina madre `CentroControllo`, separata dalla Home clone e collegata ai moduli gia aperti.",
    phase: "Importato read-only",
    primaryGrammar: "Centro di controllo",
    searchPlaceholder: "Targa, badge, alert, ordine",
    shellFocus: "Priorita, quick link e ponte al dossier",
    visibility: ["Account gestionale", "Super Admin"],
    cards: [
      {
        label: "Stato runtime",
        value: "Attivo",
        meta: "La pagina esiste ora come route autonoma distinta dalla Home clone.",
        tone: "accent",
      },
      {
        label: "Dati reali",
        value: "Letture attive",
        meta: "La pagina usa snapshot clone-safe su eventi, alert, flotta e code operative.",
        tone: "success",
      },
      {
        label: "Scritture",
        value: "0",
        meta: "Quick link e azioni restano bloccati quando il modulo madre non e ancora clone-safe.",
        tone: "warning",
      },
    ],
    sections: [
      {
        title: "Ruolo reale nel clone",
        description:
          "Replica la pagina madre di controllo operativo e resta distinta dalla Home clone principale.",
        items: [
          "Accesso rapido ai moduli clone-safe",
          "Quick link disabilitati per aree ancora non aperte",
          "Ponte diretto al dossier mezzo e alle code operative",
        ],
      },
      {
        title: "Moduli gia collegati",
        description:
          "Dal Centro di Controllo sono gia risolti gli ingressi verso Dossier, Operativita Globale, Area Capo, Colleghi, Fornitori, hub IA, Cisterna, `Autisti Inbox`, `Autisti Admin` e app autisti separata.",
        tone: "accent",
      },
      {
        title: "Gap ancora espliciti",
        description:
          "Restano visibili ma non risolti i quick link verso `Lavori Da Eseguire` e i figli IA ancora unsafe; le aree autisti gia attive sono ora riallineate al perimetro clone.",
        tone: "warning",
      },
    ],
  },
  "mezzi-dossier": {
    id: "mezzi-dossier",
    routePath: "/next/mezzi",
    relatedPaths: [
      "/next/dossiermezzi",
      "/next/dossiermezzi/:targa",
      "/next/dossier/:targa",
      "/next/dossier/:targa/gomme",
      "/next/dossier/:targa/rifornimenti",
      "/next/analisi-economica/:targa",
    ],
    navLabel: "Mezzi / Dossier",
    shortLabel: "Dossier",
    eyebrow: "Area mezzo-centrica",
    title: "Mezzi / Dossier",
    description:
      "Area clone read-only riallineata a `Mezzi`, `Dossier Mezzi`, dossier dettaglio, `Dossier Gomme`, `Dossier Rifornimenti` e `Analisi Economica` come route vere.",
    phase: "Importato read-only",
    primaryGrammar: "Dossier",
    searchPlaceholder: "Targa, categoria, autista",
    shellFocus: "Lista flotta e apertura del dossier mezzo",
    visibility: ["Account gestionale", "Super Admin"],
    cards: [
      {
        label: "Flotta",
        value: "Attiva",
        meta: "La lista mezzi legge il dataset reale e apre il dossier dedicato per targa.",
        tone: "accent",
      },
      {
        label: "Dossier",
        value: "Attivo",
        meta: "Il clone aggrega anagrafica, lavori, materiali, manutenzioni, rifornimenti, documenti e costi in sola lettura.",
        tone: "success",
      },
      {
        label: "Parita routing",
        value: "Route vere",
        meta: "Mezzi, Dossier Lista, Dossier dettaglio, Gomme, Rifornimenti e Analisi Economica sono tutti raggiungibili come pagine autonome.",
        tone: "success",
      },
    ],
    sections: [
      {
        title: "Copertura reale",
        description:
          "Il clone copre lista flotta, lista dossier, dossier mezzo e sottopagine dedicate usando layer read-only dedicati.",
        items: [
          "Lista mezzi clone-safe",
          "Lista dossier mezzi clone-safe",
          "Dossier mezzo read-only",
          "Route clone dedicate per Gomme, Rifornimenti e Analisi Economica",
        ],
      },
      {
        title: "Blocchi ancora attivi",
        description:
          "Il clone mantiene tutte le azioni scriventi fuori perimetro e lascia bloccati gli output che richiedono approvazioni o side effect.",
        tone: "accent",
      },
      {
        title: "Differenza dal madre",
        description:
          "La copertura strutturale delle route madre e ora riallineata; restano bloccate solo le azioni scriventi o distruttive.",
        tone: "accent",
      },
    ],
  },
  "operativita-globale": {
    id: "operativita-globale",
    routePath: "/next/gestione-operativa",
    relatedPaths: [
      "/next/magazzino",
      "/next/inventario",
      "/next/materiali-consegnati",
      "/next/attrezzature-cantieri",
      "/next/manutenzioni",
      "/next/acquisti",
      "/next/acquisti/dettaglio/:ordineId",
      "/next/materiali-da-ordinare",
      "/next/ordini-in-attesa",
      "/next/ordini-arrivati",
      "/next/dettaglio-ordine/:ordineId",
      "/next/lavori-da-eseguire",
      "/next/lavori-in-attesa",
      "/next/lavori-eseguiti",
      "/next/dettagliolavori/:lavoroId",
      "/next/autisti-inbox",
      "/next/autisti-inbox/cambio-mezzo",
      "/next/autisti-inbox/log-accessi",
      "/next/autisti-inbox/gomme",
      "/next/autisti-inbox/controlli",
      "/next/autisti-inbox/segnalazioni",
      "/next/autisti-inbox/richiesta-attrezzature",
      "/next/autisti-admin",
    ],
    navLabel: "Operativita Globale",
    shortLabel: "Operativita",
    eyebrow: "Workflow e code",
    title: "Operativita Globale",
    description:
      "Famiglia NEXT riallineata alla madre con ingresso unificato `Magazzino`, pagine autonome per attrezzature, manutenzioni, procurement, backlog lavori, `Autisti Inbox` e `Autisti Admin`; il contratto stock lato NEXT e governato da `/next/magazzino`, mentre procurement e documenti restano superfici di supporto o preview.",
    phase: "Operativo parziale",
    primaryGrammar: "Workflow operativo",
    searchPlaceholder: "Fornitore, ordine, materiale",
    shellFocus: "Code operative, workbench procurement e ponte al dossier",
    visibility: ["Account gestionale", "Super Admin"],
    cards: [
      {
        label: "Sezioni attive",
        value: "8+",
        meta: "`Magazzino` unifica inventario, materiali consegnati, cisterne AdBlue e supporti documentali/costi; attrezzature, manutenzioni, procurement, liste lavori, `Autisti Inbox` e `Autisti Admin` restano navigabili come superfici dedicate.",
        tone: "accent",
      },
      {
        label: "Stock canonico NEXT",
        value: "/next/magazzino",
        meta: "Carichi/scarichi stock nel perimetro NEXT passano dal contratto `Magazzino`; procurement e documenti restano supporto o preview.",
        tone: "success",
      },
      {
        label: "Parita route",
        value: "Route vere",
        meta: "Le principali pagine madre sono ora raggiungibili come route autonome invece che come sezioni query-driven.",
        tone: "success",
      },
    ],
    sections: [
      {
        title: "Copertura reale",
        description:
          "La famiglia non e piu compressa in una sola route: il clone legge snapshot reali, rende navigabili le principali pagine globali della madre come route autonome e usa `/next/magazzino` come punto operativo canonico del dominio stock.",
      },
      {
        title: "Supporti e preview",
        description:
          "Ordini, arrivi, preventivi e listino procurement restano leggibili come supporto; il consolidamento stock degli arrivi e i carichi documentali passano invece da `Magazzino`.",
        tone: "accent",
      },
      {
        title: "Differenza dal madre",
        description:
          "La struttura di pagine e allineata, ma la NEXT non riapre i writer legacy procurement: li assorbe nel contratto stock di `Magazzino` o li mantiene come supporto/read-only.",
        tone: "accent",
      },
    ],
  },
  "capo": {
    id: "capo",
    routePath: "/next/capo/mezzi",
    relatedPaths: ["/next/capo/costi/:targa"],
    navLabel: "Area Capo",
    shortLabel: "Capo",
    eyebrow: "Controllo costi e approvazioni",
    title: "Area Capo",
    description:
      "Controparte clone read-only delle route madre capo, con overview mezzi, costi e approvazioni ancora bloccate nei punti scriventi.",
    phase: "Importato read-only parziale",
    primaryGrammar: "Area Capo",
    searchPlaceholder: "Targa, costo, preventivo",
    shellFocus: "Overview mezzi, costi e anteprime non scriventi",
    visibility: ["Account gestionale", "Super Admin"],
    cards: [
      {
        label: "Route attive",
        value: "2",
        meta: "Sono aperte le route clone per overview mezzi e costi per targa.",
        tone: "accent",
      },
      {
        label: "Preview",
        value: "Locale",
        meta: "Le anteprime PDF leggibili restano disponibili senza riattivare approvazioni o PDF timbrati.",
        tone: "success",
      },
      {
        label: "Blocchi",
        value: "Approvazioni e PDF timbrati",
        meta: "Le azioni operative della madre restano esplicitamente disabilitate nel clone.",
        tone: "warning",
      },
    ],
    sections: [
      {
        title: "Copertura reale",
        description:
          "Il clone apre la dashboard capo e la vista costi per mezzo, mantenendo il ruolo di supervisione in sola lettura.",
      },
      {
        title: "Perche la copertura resta parziale",
        description:
          "La route madre mescola consultazione, approvazione stati e PDF timbrati: il clone conserva solo il perimetro leggibile.",
        tone: "accent",
      },
    ],
  },
  "anagrafiche": {
    id: "anagrafiche",
    routePath: "/next/anagrafiche",
    relatedPaths: ["/next/colleghi", "/next/fornitori"],
    navLabel: "Anagrafiche",
    shortLabel: "Anagrafiche",
    eyebrow: "Anagrafiche operative",
    title: "Anagrafiche",
    description:
      "Modulo NEXT unificato per gestire Colleghi, Fornitori e Officine con modale riutilizzabile e writer Firestore scoped.",
    phase: "Modulo NEXT scrivente",
    primaryGrammar: "Anagrafica",
    searchPlaceholder: "Nome, telefono, citta",
    shellFocus: "Lista e modifica anagrafiche condivise",
    visibility: ["Account gestionale", "Super Admin"],
    cards: [
      {
        label: "Tab",
        value: "3",
        meta: "Colleghi, Fornitori e Officine sono raccolti in una pagina unica.",
        tone: "accent",
      },
      {
        label: "Writer",
        value: "Firestore",
        meta: "Le scritture passano da writer dedicato e barrier scoped.",
        tone: "success",
      },
    ],
    sections: [
      {
        title: "Copertura reale",
        description:
          "La route unificata sostituisce le superfici anagrafiche separate e mantiene alias compatibili per Colleghi e Fornitori.",
      },
    ],
  },
  "colleghi": {
    id: "colleghi",
    routePath: "/next/colleghi",
    navLabel: "Colleghi",
    shortLabel: "Colleghi",
    eyebrow: "Anagrafica persone",
    title: "Colleghi",
    description:
      "Modulo clone read-only per consultare l'anagrafica colleghi senza riattivare creazione, modifica, delete o PDF.",
    phase: "Importato read-only",
    primaryGrammar: "Anagrafica",
    searchPlaceholder: "Nome, badge, ruolo",
    shellFocus: "Consultazione anagrafica e dettagli non scriventi",
    visibility: ["Account gestionale", "Super Admin"],
    cards: [
      {
        label: "Anagrafica",
        value: "Attiva",
        meta: "La lista e il dettaglio sono gia consultabili nel clone.",
        tone: "accent",
      },
      {
        label: "Writer",
        value: "0",
        meta: "Aggiunta, modifica, eliminazione e PDF restano bloccati.",
        tone: "warning",
      },
    ],
    sections: [
      {
        title: "Copertura reale",
        description:
          "Il clone mantiene il modulo madre come anagrafica consultabile, senza introdurre azioni operative nuove.",
      },
    ],
  },
  "fornitori": {
    id: "fornitori",
    routePath: "/next/fornitori",
    navLabel: "Fornitori",
    shortLabel: "Fornitori",
    eyebrow: "Anagrafica fornitori",
    title: "Fornitori",
    description:
      "Modulo clone read-only per consultare l'anagrafica fornitori senza riattivare creazione, modifica, delete o PDF.",
    phase: "Importato read-only",
    primaryGrammar: "Anagrafica",
    searchPlaceholder: "Fornitore, categoria, contatto",
    shellFocus: "Consultazione anagrafica e dettagli non scriventi",
    visibility: ["Account gestionale", "Super Admin"],
    cards: [
      {
        label: "Anagrafica",
        value: "Attiva",
        meta: "La lista e il dettaglio sono gia consultabili nel clone.",
        tone: "accent",
      },
      {
        label: "Writer",
        value: "0",
        meta: "Aggiunta, modifica, eliminazione e PDF restano bloccati.",
        tone: "warning",
      },
    ],
    sections: [
      {
        title: "Copertura reale",
        description:
          "Il clone mantiene il modulo madre come anagrafica consultabile, senza introdurre azioni operative nuove.",
      },
    ],
  },
  "ia": {
    id: "ia",
    routePath: "/next/ia",
    relatedPaths: [
      "/next/ia/apikey",
      "/next/ia/libretto",
      "/next/ia/documenti",
      "/next/ia/copertura-libretti",
      "/next/libretti-export",
    ],
    navLabel: "Intelligenza Artificiale",
    shortLabel: "IA",
    eyebrow: "Modulo IA",
    title: "Intelligenza Artificiale",
    description:
      "Hub clone read-only del modulo madre, riallineato anche sulla famiglia di child route autonome.",
    phase: "Hub + child route strutturali",
    primaryGrammar: "Modulo IA",
    searchPlaceholder: "Strumento IA",
    shellFocus: "Hub madre, blocchi unsafe e primo figlio clone-safe",
    visibility: ["Account gestionale", "Super Admin"],
    cards: [
      {
        label: "Modulo madre",
        value: "Intelligenza Artificiale",
        meta: "Il clone espone il vero hub della madre, senza residui semantici concettuali.",
        tone: "accent",
      },
      {
        label: "Perimetro clone",
        value: "Hub + child route IA",
        meta: "Le pagine figlie si aprono davvero; il clone neutralizza configurazione, upload, analisi e salvataggi.",
        tone: "success",
      },
      {
        label: "Side effect",
        value: "0",
        meta: "Nessuna API key, upload o chiamata IA viene eseguita dal clone.",
        tone: "warning",
      },
    ],
    sections: [
      {
        title: "Ingressi mostrati nel clone",
        description:
          "Il clone mostra le card reali del modulo madre e apre l'intera famiglia di child route strutturali.",
      },
      {
        title: "Perche i moduli figli restano bloccati",
        description:
          "Le pagine figlie sono strutturalmente presenti, ma il clone continua a neutralizzare configurazione sensibile, upload, salvataggi Firestore/Storage, runtime esterni e il nuovo sottosistema IA interno resta confinato a chat controllata, preview e archivio locale isolato.",
        tone: "accent",
        items: [
          "API key Gemini",
          "Upload libretto e documenti",
          "Scritture su dataset documentali e mezzi",
          "Runtime IA esterni o funzioni writer-heavy",
          "Chat/orchestratore locale controllato, retrieval read-only, archivio artifact IA e approval workflow solo mock",
        ],
      },
      {
        title: "Differenza minima dal madre",
        description:
          "Il clone mantiene il ruolo del hub e delle sue pagine figlie, ma lascia bloccate tutte le funzioni operative con side effect.",
        tone: "warning",
      },
    ],
  },
  "libretti-export": {
    id: "libretti-export",
    routePath: "/next/libretti-export",
    navLabel: "Libretti (Export PDF)",
    shortLabel: "Libretti Export",
    eyebrow: "Modulo documentale",
    title: "Libretti (Export PDF)",
    description:
      "Controparte clone-safe della route madre dedicata ai libretti, limitata a lista mezzi con libretto, selezione e anteprima PDF locale.",
    phase: "Importato read-only parziale",
    primaryGrammar: "Export PDF",
    searchPlaceholder: "Targa, categoria, libretto",
    shellFocus: "Lista mezzi, selezione e anteprima locale",
    visibility: ["Account gestionale", "Super Admin"],
    cards: [
      {
        label: "Flusso attivo",
        value: "Lista + selezione + preview",
        meta: "Il clone apre la pagina dedicata e genera un'anteprima PDF locale senza attivare azioni esterne.",
        tone: "accent",
      },
      {
        label: "Azioni esterne",
        value: "Bloccate",
        meta: "Condivisione, copia link, WhatsApp e download restano fuori dal primo step clone-safe.",
        tone: "warning",
      },
      {
        label: "Scritture",
        value: "0",
        meta: "Nessuna mutazione dataset, nessun upload e nessun runtime IA vengono attivati.",
        tone: "success",
      },
    ],
    sections: [
      {
        title: "Perimetro aperto",
        description:
          "La pagina clone riusa il ruolo del modulo madre ma non il suo runtime completo: solo lista mezzi, selezione e anteprima PDF locale.",
      },
      {
        title: "Differenza dal madre",
        description:
          "La route madre supporta anche azioni locali piu ampie; nel clone restano escluse per mantenere un perimetro read-only minimo e sicuro.",
        tone: "warning",
      },
    ],
  },
  "cisterna": {
    id: "cisterna",
    routePath: "/next/cisterna",
    relatedPaths: ["/next/cisterna/ia", "/next/cisterna/schede-test"],
    navLabel: "Cisterna",
    shortLabel: "Cisterna",
    eyebrow: "Modulo specialistico",
    title: "Cisterna",
    description:
      "Controparte clone-safe della route madre base `/cisterna`, limitata ad archivio documenti, report mensile e tabelle per targa in sola lettura.",
    phase: "Importato read-only parziale",
    primaryGrammar: "Modulo specialistico",
    searchPlaceholder: "Mese, documento, targa cisterna",
    shellFocus: "Archivio, report mensile e dettaglio per targa",
    visibility: ["Account gestionale", "Super Admin"],
    cards: [
      {
        label: "Perimetro aperto",
        value: "Archivio + report + targhe",
        meta: "La route base madre e ora leggibile nel clone senza importare editor o writer.",
        tone: "accent",
      },
      {
        label: "Sottoroute attive",
        value: "IA + Schede Test",
        meta: "Le due sottoroute clone-safe sono navigabili, ma restano protette su upload, analisi e salvataggi.",
        tone: "success",
      },
      {
        label: "Blocchi attivi",
        value: "Upload, export e salvataggi",
        meta: "Restano bloccati conferma duplicati, cambio EUR/CHF, export PDF e ogni mutazione su archivio o schede.",
        tone: "warning",
      },
    ],
    sections: [
      {
        title: "Copertura reale",
        description:
          "Il clone apre solo il sotto-perimetro consultivo gia verificato nella madre: archivio, report mensile e ripartizione per targa del mese selezionato.",
      },
      {
        title: "Blocchi ancora attivi",
        description:
          "Le sottoroute `/cisterna/ia` e `/cisterna/schede-test` sono navigabili nel clone, ma restano bloccati conferma duplicati, salvataggio cambio, analisi IA, edit schede ed export PDF.",
        tone: "accent",
      },
      {
        title: "Gestione incompleti",
        description:
          "Quando la derivazione non e pienamente ricostruibile il clone mostra warning e riduce il report, senza introdurre scritture o inferenze non dimostrate.",
        tone: "warning",
      },
    ],
  },
};
