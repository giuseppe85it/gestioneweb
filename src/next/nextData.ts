export type NextAreaId =
  | "centro-controllo"
  | "mezzi-dossier"
  | "operativita-globale"
  | "ia-gestionale"
  | "strumenti-trasversali";

export type NextAreaTone = "default" | "accent" | "warning" | "success";

export type NextUiGrammar =
  | "Centro di controllo"
  | "Dossier"
  | "Materiali da ordinare"
  | "Area Capo";

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
    id: "ia-gestionale",
    path: "/next/ia-gestionale",
    label: "IA Gestionale",
    scope: "Assistente business",
  },
  {
    id: "strumenti-trasversali",
    path: "/next/strumenti-trasversali",
    label: "Strumenti Trasversali",
    scope: "Sistema e governance",
  },
] as const;

export const NEXT_AREAS: Record<NextAreaId, NextAreaConfig> = {
  "centro-controllo": {
    id: "centro-controllo",
    navLabel: "Centro di Controllo",
    shortLabel: "Centro",
    eyebrow: "Cockpit operativo",
    title: "Centro di Controllo NEXT",
    description:
      "Shell reale e separata per il cockpit amministrativo della nuova app. In questa fase resta un contenitore read-only, pronto a ospitare priorita, alert, code operative e ricerca globale senza sostituire la home legacy.",
    phase: "V1 shell read-only",
    primaryGrammar: "Centro di controllo",
    searchPlaceholder: "Targa, badge, alert, ordine",
    shellFocus: "Home NEXT = IA in alto + Centro di Comando sotto",
    visibility: ["Account gestionale", "Super Admin"],
    cards: [
      {
        label: "Priorita oggi",
        value: "Placeholder",
        meta: "Banda alta per alert, scadenze e code da presidiare",
        tone: "accent",
      },
      {
        label: "Ponte al Dossier",
        value: "Sempre visibile",
        meta: "Ogni record targa-correlato dovra aprire il Dossier Mezzo",
        tone: "success",
      },
      {
        label: "Dati reali",
        value: "Non collegati",
        meta: "La pagina non legge ancora dataset runtime",
        tone: "warning",
      },
    ],
    sections: [
      {
        title: "Blocchi shell gia predisposti",
        description:
          "Header globale, metrica rapida, coda prioritaria, accessi rapidi e report table placeholder in linea con blueprint e wireframe.",
        items: [
          "Ricerca globale pronta ad accogliere targa, badge, id lavoro e id ordine",
          "Area alert/scadenze separata dai blocchi di report",
          "Toolbar contestuale pronta per filtri rapidi ed export PDF standard",
        ],
      },
      {
        title: "Perche partire da qui",
        description:
          "Il Centro di Controllo e una delle due superfici ufficiali della IA Business v1. Qui la shell serve a fissare gerarchie, densita e navigazione senza introdurre logica nuova.",
        tone: "accent",
        items: [
          "Sintesi stato sistema",
          "Priorita e anomalie",
          "Ingressi rapidi ai futuri moduli NEXT",
        ],
      },
      {
        title: "Non ancora incluso",
        description:
          "La pagina non sostituisce la home attuale e non implementa writer, scadenze reali o ricerca globale funzionante.",
        tone: "warning",
        items: [
          "Nessun collegamento a dataset runtime",
          "Nessuna nuova scrittura",
          "Nessun rimpiazzo della home legacy",
        ],
      },
    ],
  },
  "mezzi-dossier": {
    id: "mezzi-dossier",
    navLabel: "Mezzi / Dossier",
    shortLabel: "Dossier",
    eyebrow: "Area mezzo-centrica",
    title: "Mezzi / Dossier NEXT",
    description:
      "Macro-area combinata che rende visibile da subito il cuore mezzo-centrico della NEXT. La shell separa overview flotta, accesso rapido al Dossier e blocchi contestuali senza importare ancora i moduli legacy.",
    phase: "V1 shell read-only",
    primaryGrammar: "Dossier",
    searchPlaceholder: "Targa, categoria, autista",
    shellFocus: "D01 attivo, Dossier dettaglio-first, convergenze pulite",
    visibility: ["Account gestionale", "Super Admin"],
    cards: [
      {
        label: "Pivot primario",
        value: "Targa / mezzo",
        meta: "La targa resta il cardine informativo dell'area admin",
        tone: "accent",
      },
      {
        label: "Dossier",
        value: "Cuore del sistema",
        meta: "Header mezzo, overview, scadenze e pannelli contestuali",
        tone: "success",
      },
      {
        label: "Modulo reale",
        value: "Non importato",
        meta: "Questa pagina prepara la shell, non migra ancora i reader legacy",
        tone: "warning",
      },
    ],
    sections: [
      {
        title: "Struttura visiva prevista",
        description:
          "La shell espone fascia overview, reminder/scadenze, ponte a documenti, costi e timeline, con enfasi sul contesto mezzo e su CTA ridotte ma leggibili.",
        items: [
          "Header mezzo forte e banda stato",
          "Blocchi overview prima del dettaglio storico",
          "Azioni contestuali per PDF e IA senza trasformarle in moduli isolati",
        ],
      },
      {
        title: "Predisposizione IA v1",
        description:
          "Il Dossier e la prima superficie prevista per la IA Business v1. La shell chiarisce dove collocheremo riassunto stato mezzo, anomalie, scadenze e suggerimenti motivati.",
        tone: "accent",
        items: [
          "Output read-only e spiegabile",
          "Fonti dati e periodo espliciti",
          "Marcatura DA VERIFICARE quando il collegamento non e pienamente affidabile",
        ],
      },
      {
        title: "Limiti iniziali",
        description:
          "Nessuna timeline reale, nessun costo letto, nessuna manutenzione importata. La pagina fissa solo la grammatica visiva della futura area mezzo-centrica.",
        tone: "warning",
      },
    ],
  },
  "operativita-globale": {
    id: "operativita-globale",
    navLabel: "Operativita Globale",
    shortLabel: "Operativita",
    eyebrow: "Workflow e code",
    title: "Operativita Globale NEXT",
    description:
      "Area separata per workflow, task e code operative. La shell prepara liste, gruppi stato e pannelli dettaglio senza migrare ancora lavori, manutenzioni o flussi materiali.",
    phase: "V1 shell read-only",
    primaryGrammar: "Materiali da ordinare",
    searchPlaceholder: "Fornitore, ordine, materiale",
    shellFocus: "Workbench globale per procurement, stock e intake",
    visibility: ["Account gestionale", "Super Admin"],
    cards: [
      {
        label: "Famiglia layout",
        value: "Workflow shell",
        meta: "Ispirata a Acquisti, CentroControllo e inbox operative",
        tone: "accent",
      },
      {
        label: "Ponte al mezzo",
        value: "Previsto",
        meta: "Ogni task targa-correlato dovra offrire accesso diretto al Dossier",
        tone: "success",
      },
      {
        label: "Scritture",
        value: "0",
        meta: "Nessun task o workflow attivo in questa fase",
        tone: "warning",
      },
    ],
    sections: [
      {
        title: "Blocchi shell",
        description:
          "Titolo area, KPI code, toolbar filtri rapidi, lista task, pannello dettaglio e azioni contestuali sono gia separati e pronti a evolvere in veri moduli.",
      },
      {
        title: "Cosa ci entrera dopo",
        description:
          "Lavori, monitor backlog, presa in carico, lettura eventi autisti e collegamenti a magazzino. Tutto pero restera in read-only finche i contratti critici non saranno consolidati.",
        items: [
          "Lavori e manutenzioni",
          "Code operative giornaliere",
          "Drill-down verso record targa-correlati",
        ],
      },
      {
        title: "Perimetro attuale",
        description:
          "Solo shell navigabile. Nessun import di logica, nessun writer, nessun cambio ai workflow legacy.",
        tone: "warning",
      },
    ],
  },
  "ia-gestionale": {
    id: "ia-gestionale",
    navLabel: "IA Gestionale",
    shortLabel: "IA",
    eyebrow: "Assistente business",
    title: "IA Gestionale NEXT",
    description:
      "Questa macro-area rende finalmente visibile la futura IA Business della NEXT. La shell espone il perimetro reale della v1 e separa chiaramente cio che appartiene all'assistenza runtime da cio che restera audit tecnico su repo, docs e dati.",
    phase: "V1 shell read-only",
    primaryGrammar: "Centro di controllo",
    searchPlaceholder: "Superficie, sorgente, periodo",
    shellFocus: "Motore unico sopra layer puliti e spiegabili",
    visibility: ["Account gestionale", "Super Admin"],
    cards: [
      {
        label: "Perimetro v1",
        value: "Read-only",
        meta: "Nessuna scrittura, nessuna patch, nessuna correzione dati",
        tone: "warning",
      },
      {
        label: "Superfici iniziali",
        value: "Dossier + Centro",
        meta: "Le due aree piu sensate per partire senza rompere il sistema",
        tone: "success",
      },
      {
        label: "Capability separata",
        value: "Audit tecnico fuori runtime",
        meta: "Repo/docs/dati non vanno fusi nella stessa UX business",
        tone: "accent",
      },
    ],
    sections: [
      {
        title: "Cosa dovra fare la v1",
        description:
          "Riassunto stato mezzo o stato sistema, scadenze, anomalie, priorita e suggerimenti motivati con spiegabilita obbligatoria della risposta.",
        items: [
          "Fonte dati esplicita",
          "Modulo sorgente esplicito",
          "Periodo letto",
          "Marcatura DA VERIFICARE se l'affidabilita non e piena",
        ],
      },
      {
        title: "Punto di arrivo",
        description:
          "L'area restera estendibile a documenti, PDF intelligenti, acquisti, inventario e report assistiti, ma solo con rollout progressivo e controllato.",
        tone: "accent",
      },
      {
        title: "Non fare subito",
        description:
          "Questa shell fissa anche i confini: niente IA onnisciente su tutti i moduli, niente audit repo nella stessa runtime business, niente patch autonome, niente scritture.",
        tone: "warning",
        items: [
          "No audit repo/docs dentro l'esperienza utente NEXT",
          "No automazioni rischiose",
          "No supporto dichiarato come completo su flussi non canonici",
        ],
      },
    ],
  },
  "strumenti-trasversali": {
    id: "strumenti-trasversali",
    navLabel: "Strumenti Trasversali",
    shortLabel: "Strumenti",
    eyebrow: "Supporto tecnico e governance",
    title: "Strumenti Trasversali NEXT",
    description:
      "Area placeholder per PDF standard, ricerca globale, scadenze, audit log, visibilita moduli e strumenti di supporto. La shell e predisposta per governance e permessi futuri, senza introdurre ancora enforcement o funzioni runtime nuove.",
    phase: "V1 shell read-only",
    primaryGrammar: "Area Capo",
    searchPlaceholder: "Servizio, permesso, PDF",
    shellFocus: "Governance tecnica, PDF standard, routing e accessi",
    visibility: ["Super Admin", "Account gestionale"],
    cards: [
      {
        label: "PDF standard",
        value: "Capability tecnica",
        meta: "Separati dai PDF intelligenti dell'IA Gestionale",
        tone: "success",
      },
      {
        label: "Permessi",
        value: "Predisposizione UI",
        meta: "Scope visibili ma nessun gating applicato in questa fase",
        tone: "accent",
      },
      {
        label: "Audit tecnico",
        value: "Separato",
        meta: "Non confuso con la IA Business runtime della NEXT",
        tone: "warning",
      },
    ],
    sections: [
      {
        title: "Cosa deve vivere qui",
        description:
          "Ricerca globale, notifiche, PDF standard, supporto tecnico, configurazioni e strumenti di sistema che non devono sporcare le aree business.",
      },
      {
        title: "Predisposizione permessi",
        description:
          "La shell mostra in modo esplicito scope previsti per le macro-aree, ma non introduce ancora guard o enforcement server-side.",
        items: [
          "Visibilita modulo per ruolo",
          "Scope su dati sensibili",
          "Area tecnica distinta dal flusso operativo",
        ],
      },
      {
        title: "Limiti attuali",
        description:
          "Nessun audit log reale, nessuna ricerca globale funzionante, nessun pannello permessi. Solo struttura pronta ad accogliere questi moduli in seguito.",
        tone: "warning",
      },
    ],
  },
};
