export type NextMappaStoricoVista = "fronte" | "sinistra" | "destra" | "retro";

export type NextMezzoHotspotArea = {
  id: string;
  vista: NextMappaStoricoVista;
  label: string;
  description: string;
  keywords: string[];
  targetKind: "assi" | "fanali_specchi" | "attrezzature";
};

const HOTSPOT_AREAS: NextMezzoHotspotArea[] = [
  {
    id: "fronte-cabina",
    vista: "fronte",
    label: "Cabina frontale",
    description: "Parabrezza, cabina e parte frontale superiore.",
    keywords: ["cabina", "parabrezza", "frontale", "specchio", "tergicristallo"],
    targetKind: "fanali_specchi",
  },
  {
    id: "fronte-fanali",
    vista: "fronte",
    label: "Fanali anteriori",
    description: "Fanali, luci e indicatori anteriori.",
    keywords: [
      "fanale",
      "fanali",
      "faro",
      "fari",
      "luce anteriore",
      "luci anteriori",
      "freccia anteriore",
      "frecce anteriori",
      "indicatore anteriore",
      "indicatori anteriori",
    ],
    targetKind: "fanali_specchi",
  },
  {
    id: "fronte-paraurti",
    vista: "fronte",
    label: "Paraurti e griglia",
    description: "Paraurti, griglia, calandra e supporti frontali.",
    keywords: ["paraurti", "griglia", "calandra", "frontale", "urto"],
    targetKind: "attrezzature",
  },
  {
    id: "fronte-assale",
    vista: "fronte",
    label: "Assale anteriore",
    description: "Pneumatici anteriori, sterzo e freni dell'assale anteriore.",
    keywords: [
      "asse anteriore",
      "assi anteriori",
      "assale anteriore",
      "assali anteriori",
      "avantreno",
      "sterzo",
      "gomme anteriori",
      "gomma anteriore",
      "pneumatici anteriori",
      "pneumatico anteriore",
      "ruote anteriori",
      "ruota anteriore",
      "freni anteriori",
    ],
    targetKind: "assi",
  },
  {
    id: "sinistra-cabina",
    vista: "sinistra",
    label: "Cabina lato sinistro",
    description: "Porta, cabina e fiancata sinistra.",
    keywords: ["sinistra", "porta", "cabina", "fiancata", "specchio"],
    targetKind: "fanali_specchi",
  },
  {
    id: "sinistra-serbatoi",
    vista: "sinistra",
    label: "Serbatoi e pedana",
    description: "Serbatoi, pedana e componenti laterali bassi sinistri.",
    keywords: ["serbatoio", "pedana", "scala", "gasolio", "adblue", "sinistra"],
    targetKind: "attrezzature",
  },
  {
    id: "sinistra-assi",
    vista: "sinistra",
    label: "Assi e pneumatici sinistri",
    description: "Gomme, cerchi, freni e sospensioni lato sinistro.",
    keywords: [
      "gomma sinistra",
      "gomme sinistra",
      "gomma sinistro",
      "gomme sinistro",
      "pneumatico sinistro",
      "pneumatici sinistri",
      "ruota sinistra",
      "ruote sinistre",
      "asse sinistro",
      "assi sinistri",
      "assale sinistro",
      "assali sinistri",
      "freni sinistra",
      "freni sinistri",
      "lato sinistro",
    ],
    targetKind: "assi",
  },
  {
    id: "sinistra-telaio",
    vista: "sinistra",
    label: "Telaio lato sinistro",
    description: "Telaio, supporti e impianti laterali sinistri.",
    keywords: ["telaio", "supporto", "impianto", "aria", "sospensione", "sinistra"],
    targetKind: "attrezzature",
  },
  {
    id: "destra-cabina",
    vista: "destra",
    label: "Cabina lato destro",
    description: "Porta, cabina e fiancata destra.",
    keywords: ["destra", "porta", "cabina", "fiancata", "specchio"],
    targetKind: "fanali_specchi",
  },
  {
    id: "destra-impianti",
    vista: "destra",
    label: "Impianti lato destro",
    description: "Impianti, serbatoi e componenti laterali bassi destri.",
    keywords: ["impianto", "aria", "serbatoio", "adblue", "destra", "pedana"],
    targetKind: "attrezzature",
  },
  {
    id: "destra-assi",
    vista: "destra",
    label: "Assi e pneumatici destri",
    description: "Gomme, cerchi, freni e sospensioni lato destro.",
    keywords: [
      "gomma destra",
      "gomme destra",
      "gomma destro",
      "gomme destro",
      "pneumatico destro",
      "pneumatici destri",
      "ruota destra",
      "ruote destre",
      "asse destro",
      "assi destri",
      "assale destro",
      "assali destri",
      "freni destra",
      "freni destri",
      "lato destro",
    ],
    targetKind: "assi",
  },
  {
    id: "destra-telaio",
    vista: "destra",
    label: "Telaio lato destro",
    description: "Telaio e supporti strutturali lato destro.",
    keywords: ["telaio", "supporto", "struttura", "sospensione", "destra"],
    targetKind: "attrezzature",
  },
  {
    id: "retro-fanali",
    vista: "retro",
    label: "Fanali posteriori",
    description: "Fanali, luci, indicatori e gruppo ottico posteriore.",
    keywords: ["fanale", "faro", "luce", "posteriore", "retro"],
    targetKind: "fanali_specchi",
  },
  {
    id: "retro-portellone",
    vista: "retro",
    label: "Portellone e scarico",
    description: "Portellone, sponda, ganci e scarico posteriore.",
    keywords: ["portellone", "sponda", "gancio", "scarico", "retro", "posteriore"],
    targetKind: "attrezzature",
  },
  {
    id: "retro-assi",
    vista: "retro",
    label: "Assi posteriori",
    description: "Gomme, freni e assi posteriori o del rimorchio.",
    keywords: [
      "gomma posteriore",
      "gomme posteriori",
      "pneumatico posteriore",
      "pneumatici posteriori",
      "ruota posteriore",
      "ruote posteriori",
      "asse posteriore",
      "assi posteriori",
      "assale posteriore",
      "assali posteriori",
      "retrotreno",
      "rimorchio",
      "rimorchio posteriore",
      "freni posteriori",
    ],
    targetKind: "assi",
  },
  {
    id: "retro-telaio",
    vista: "retro",
    label: "Telaio posteriore",
    description: "Telaio, supporti, longheroni e parte strutturale posteriore.",
    keywords: ["telaio", "supporto", "longherone", "retro", "posteriore"],
    targetKind: "attrezzature",
  },
];

export function getNextMezzoHotspotAreas(): NextMezzoHotspotArea[] {
  return HOTSPOT_AREAS;
}

export function getNextMezzoHotspotAreasByVista(
  vista: NextMappaStoricoVista,
): NextMezzoHotspotArea[] {
  return HOTSPOT_AREAS.filter((area) => area.vista === vista);
}

export function getNextMezzoHotspotAreaById(id: string): NextMezzoHotspotArea | null {
  return HOTSPOT_AREAS.find((area) => area.id === id) ?? null;
}

export function getNextMezzoHotspotTargetKindById(
  id: string,
): NextMezzoHotspotArea["targetKind"] | null {
  return getNextMezzoHotspotAreaById(id)?.targetKind ?? null;
}
