export type NextAreaId =
  | "centro-controllo"
  | "mezzi-dossier"
  | "operativita-globale"
  | "capo"
  | "colleghi"
  | "fornitori"
  | "ia"
  | "libretti-export"
  | "cisterna";

export type NextRouteModuleId = NextAreaId | "autista-separato" | "ia-legacy-redirect";

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

// Ingressi top-level della shell clone. Non coincidono con l'intero catalogo delle
// route attive, che e descritto in NEXT_ROUTE_MODULES.
export const NEXT_NAV_ITEMS = [
  {
    id: "centro-controllo",
    path: "/next/centro-controllo",
    label: "Centro di Controllo",
    scope: "Cockpit operativo",
  },
  {
    id: "mezzi-dossier",
    path: "/next/mezzi-dossier",
    label: "Mezzi / Dossier",
    scope: "Area mezzo-centrica",
  },
  {
    id: "operativita-globale",
    path: "/next/operativita-globale",
    label: "Operativita Globale",
    scope: "Workflow e code",
  },
  {
    id: "ia",
    path: "/next/ia",
    label: "Intelligenza Artificiale",
    scope: "Hub madre + sotto-moduli clone-safe",
  },
] as const;

export const NEXT_ROUTE_MODULES: NextRouteModuleEntry[] = [
  {
    id: "centro-controllo",
    path: "/next/centro-controllo",
    label: "Centro di Controllo",
    status: "ACTIVE",
    note: "Home clone read-only realmente navigabile.",
  },
  {
    id: "operativita-globale",
    path: "/next/operativita-globale",
    label: "Operativita Globale",
    status: "ACTIVE_PARTIAL",
    note: "Contenitore principale per inventario, materiali, attrezzature, manutenzioni, liste lavori, relativo dettaglio clone-safe, home `Autisti Inbox` clone-safe e i sei listati inbox gia importati (`cambio-mezzo`, `log-accessi`, `gomme`, `controlli`, `segnalazioni`, `richiesta-attrezzature`).",
  },
  {
    id: "mezzi-dossier",
    path: "/next/mezzi-dossier",
    label: "Mezzi / Dossier",
    status: "ACTIVE",
    note: "Lista flotta clone-safe e ingresso al dossier mezzo.",
  },
  {
    id: "capo",
    path: "/next/capo/mezzi",
    label: "Area Capo",
    status: "ACTIVE_PARTIAL",
    note: "Route attive per overview mezzi e costi, con approvazioni e PDF timbrati ancora bloccati.",
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
    id: "ia",
    path: "/next/ia",
    label: "Intelligenza Artificiale",
    status: "ACTIVE_PARTIAL",
    note: "Hub reale della madre, con card unsafe visibili ma bloccate.",
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
    note: "Route base clone-safe con archivio, report mensile e ripartizioni per targa; IA, schede-test, export e salvataggi restano bloccati.",
  },
  {
    id: "autista-separato",
    path: "/next/autista",
    label: "Area Autista",
    status: "SEPARATE_EXPERIENCE",
    note: "Route tecnica separata dal clone admin, lasciata come placeholder esplicito.",
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
      "Home clone read-only che legge dati reali, mostra priorita operative e collega i moduli clone-safe gia aperti.",
    phase: "Importato read-only",
    primaryGrammar: "Centro di controllo",
    searchPlaceholder: "Targa, badge, alert, ordine",
    shellFocus: "Priorita, quick link e ponte al dossier",
    visibility: ["Account gestionale", "Super Admin"],
    cards: [
      {
        label: "Stato runtime",
        value: "Attivo",
        meta: "Il clone espone una home realmente navigabile, non piu una shell puramente statica.",
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
          "Resta il cockpit principale del clone admin e la fonte di accesso ai moduli gia aperti o dichiaratamente bloccati.",
        items: [
          "Accesso rapido ai moduli clone-safe",
          "Quick link disabilitati per aree ancora non aperte",
          "Ponte diretto al dossier mezzo e alle code operative",
        ],
      },
      {
        title: "Moduli gia collegati",
        description:
          "Dal Centro di Controllo sono gia risolti gli ingressi verso Dossier, Operativita Globale, Area Capo, Colleghi, Fornitori e hub IA.",
        tone: "accent",
      },
      {
        title: "Gap ancora espliciti",
        description:
          "Restano visibili ma non risolti i quick link verso `Lavori Da Eseguire`, figli IA unsafe, la home `Autisti Inbox` e le aree autisti separate.",
        tone: "warning",
      },
    ],
  },
  "mezzi-dossier": {
    id: "mezzi-dossier",
    routePath: "/next/mezzi-dossier",
    relatedPaths: ["/next/mezzi-dossier/:targa", "/next/analisi-economica/:targa"],
    navLabel: "Mezzi / Dossier",
    shortLabel: "Dossier",
    eyebrow: "Area mezzo-centrica",
    title: "Mezzi / Dossier",
    description:
      "Area clone read-only per flotta, dossier mezzo, route dedicata di Analisi Economica e sottoviste collegate a gomme e rifornimenti.",
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
        value: "Parziale",
        meta: "Analisi Economica ha ora una route dedicata; gomme e rifornimenti restano ancora sottoviste interne del dossier.",
        tone: "warning",
      },
    ],
    sections: [
      {
        title: "Copertura reale",
        description:
          "Il clone copre lista flotta, dossier mezzo e viste interne piu importanti usando layer read-only dedicati.",
        items: [
          "Lista mezzi clone-safe",
          "Dossier mezzo read-only",
          "Route clone dedicata per Analisi Economica",
          "Sottoviste interne per gomme e rifornimenti",
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
          "La copertura funzionale e ampia, ma alcune route madre dedicate sono ancora riassorbite nel contenitore dossier clone.",
        tone: "warning",
      },
    ],
  },
  "operativita-globale": {
    id: "operativita-globale",
    routePath: "/next/operativita-globale",
    relatedPaths: [
      "/next/operativita-globale?section=inventario",
      "/next/operativita-globale?section=materiali",
      "/next/operativita-globale?section=attrezzature",
      "/next/operativita-globale?section=manutenzioni",
      "/next/operativita-globale?section=procurement",
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
    ],
    navLabel: "Operativita Globale",
    shortLabel: "Operativita",
    eyebrow: "Workflow e code",
    title: "Operativita Globale",
    description:
      "Workbench clone read-only che riunisce inventario, materiali, attrezzature, manutenzioni, backlog lavori, relativo dettaglio clone-safe, home `Autisti Inbox` clone-safe e i sei listati inbox gia importati.",
    phase: "Importato read-only",
    primaryGrammar: "Workflow operativo",
    searchPlaceholder: "Fornitore, ordine, materiale",
    shellFocus: "Code operative, workbench procurement e ponte al dossier",
    visibility: ["Account gestionale", "Super Admin"],
    cards: [
      {
        label: "Sezioni attive",
        value: "7+",
        meta: "Inventario, materiali, attrezzature, manutenzioni, procurement, liste lavori e dettaglio clone-safe sono navigabili in sola lettura.",
        tone: "accent",
      },
      {
        label: "Procurement clone-safe",
        value: "Ordini / Arrivi / Dettaglio",
        meta: "Le viste leggibili sono aperte; i tab writer-heavy restano bloccati.",
        tone: "success",
      },
      {
        label: "Parita route",
        value: "Parziale",
        meta: "La madre usa piu route dedicate; il clone le ricompone in una vista unica con deep link query-based.",
        tone: "warning",
      },
    ],
    sections: [
      {
        title: "Copertura reale",
        description:
          "La pagina non e piu una shell astratta: legge snapshot reali e rende navigabili i principali domini globali gia bonificati, compresi il dettaglio lavori clone-safe, la home `Autisti Inbox` clone-safe e i suoi primi sei listati.",
      },
      {
        title: "Tab ancora bloccati",
        description:
          "Ordine materiali, Prezzi & Preventivi e Listino Prezzi restano visibili ma bloccati finche non esiste una copertura read-only separata dai writer.",
        tone: "accent",
      },
      {
        title: "Differenza dal madre",
        description:
          "Inventario, materiali consegnati, attrezzature, manutenzioni e acquisti non hanno ancora una route clone dedicata 1:1.",
        tone: "warning",
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
    relatedPaths: ["/next/libretti-export"],
    navLabel: "Intelligenza Artificiale",
    shortLabel: "IA",
    eyebrow: "Modulo IA",
    title: "Intelligenza Artificiale",
    description:
      "Hub clone read-only del modulo madre, riallineato alla titolazione reale e ai sotto-moduli effettivamente attivi o bloccati.",
    phase: "Hub + primo modulo clone-safe",
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
        value: "Hub + Libretti Export",
        meta: "E aperto il solo figlio clone-safe; gli altri moduli IA restano visibili ma bloccati.",
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
          "Il clone mostra le card reali del modulo madre e rende attivo solo `Libretti (Export PDF)` nel perimetro read-only minimo.",
      },
      {
        title: "Perche i moduli figli restano bloccati",
        description:
          "I moduli figli non vengono aperti finche non saranno separati da configurazione sensibile, upload, salvataggi Firestore/Storage e runtime esterni.",
        tone: "accent",
        items: [
          "API key Gemini",
          "Upload libretto e documenti",
          "Scritture su dataset documentali e mezzi",
          "Runtime IA esterni o funzioni writer-heavy",
        ],
      },
      {
        title: "Differenza minima dal madre",
        description:
          "Il clone mantiene il ruolo del hub e il sotto-modulo clone-safe, ma lascia bloccate tutte le funzioni operative con side effect.",
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
        meta: "La route base madre e ora leggibile nel clone senza importare editor, upload o workflow IA.",
        tone: "accent",
      },
      {
        label: "Regole di derivazione",
        value: "Deterministiche",
        meta: "Il clone usa `dupChosen` persistito, altrimenti fallback al bollettino con piu litri, e privilegia l'ultima scheda manuale del mese.",
        tone: "success",
      },
      {
        label: "Blocchi attivi",
        value: "IA, schede, export e salvataggi",
        meta: "Restano fuori `Cisterna IA`, `Schede Test`, conferma duplicati, cambio EUR/CHF ed export PDF.",
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
          "Le sottoroute `/cisterna/ia` e `/cisterna/schede-test` restano fuori, insieme a conferma duplicati, salvataggio cambio, edit schede ed export PDF.",
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
