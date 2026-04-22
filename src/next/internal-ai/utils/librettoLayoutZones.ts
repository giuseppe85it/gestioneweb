export type LibrettoTemplateField = {
  key: string;
  label: string;
  inputType?: "text" | "textarea";
  variant?: "plain" | "mono" | "date" | "plate";
  colSpan?: number;
};

export type LibrettoTemplateZone = {
  id: string;
  title: string;
  description: string;
  columns: number;
  fields: LibrettoTemplateField[];
};

export const LIBRETTO_LAYOUT_ZONES: LibrettoTemplateZone[] = [
  {
    id: "identificazione",
    title: "Identificazione veicolo",
    description: "Zona frontale del libretto con dati principali del mezzo.",
    columns: 4,
    fields: [
      { key: "targa", label: "Targa", variant: "plate" },
      { key: "colore", label: "Colore" },
      { key: "genereVeicolo", label: "Genere veicolo" },
      { key: "marcaTipo", label: "Marca e tipo", colSpan: 2 },
      { key: "categoria", label: "Categoria" },
      { key: "carrozzeria", label: "Carrozzeria" },
    ],
  },
  {
    id: "proprietario",
    title: "Proprietario e coperture",
    description: "Zona anagrafica del titolare del mezzo.",
    columns: 2,
    fields: [
      { key: "proprietario", label: "Proprietario", colSpan: 2 },
      { key: "indirizzo", label: "Indirizzo", colSpan: 2 },
      { key: "localita", label: "Località", colSpan: 2 },
      { key: "nAvs", label: "N. AVS", variant: "mono" },
      { key: "statoOrigine", label: "Stato d'origine" },
      { key: "assicurazione", label: "Assicurazione", colSpan: 2 },
    ],
  },
  {
    id: "costruttivi",
    title: "Costruttivi e identificativi",
    description: "Zona dedicata ai riferimenti di telaio e omologazione.",
    columns: 2,
    fields: [
      { key: "telaio", label: "Telaio", variant: "mono", colSpan: 2 },
      { key: "approvazioneTipo", label: "Approvazione tipo", variant: "mono" },
      { key: "numeroMatricola", label: "Numero matricola", variant: "mono" },
    ],
  },
  {
    id: "tecnici",
    title: "Dati tecnici",
    description: "Zona dei valori tecnici riportati sul libretto.",
    columns: 2,
    fields: [
      { key: "cilindrata", label: "Cilindrata", variant: "mono" },
      { key: "potenza", label: "Potenza", variant: "mono" },
    ],
  },
  {
    id: "pesi",
    title: "Pesi e portate",
    description: "Zona fissa dei pesi principali del mezzo.",
    columns: 3,
    fields: [
      { key: "pesoVuoto", label: "Peso a vuoto", variant: "mono" },
      { key: "caricoUtileSella", label: "Carico utile / sella", variant: "mono" },
      { key: "pesoTotale", label: "Peso totale", variant: "mono" },
      { key: "pesoTotaleRimorchio", label: "Peso totale rimorchio", variant: "mono" },
      { key: "caricoSulLetto", label: "Carico sul letto", variant: "mono" },
      { key: "pesoRimorchiabile", label: "Peso rimorchiabile", variant: "mono" },
    ],
  },
  {
    id: "rilascio-collaudi",
    title: "Immatricolazione e collaudi",
    description: "Zona date del libretto da tenere separate.",
    columns: 2,
    fields: [
      { key: "primaImmatricolazione", label: "Prima immatricolazione", variant: "date" },
      { key: "luogoDataRilascio", label: "Luogo / data rilascio", variant: "date" },
      { key: "ultimoCollaudo", label: "Ultimo collaudo", variant: "date" },
      {
        key: "prossimoCollaudoRevisione",
        label: "Prossimo collaudo / revisione",
        variant: "date",
      },
    ],
  },
  {
    id: "annotazioni",
    title: "Annotazioni",
    description: "Campo libero del template fisso per note del libretto.",
    columns: 1,
    fields: [{ key: "annotazioni", label: "Annotazioni", inputType: "textarea", colSpan: 1 }],
  },
];
