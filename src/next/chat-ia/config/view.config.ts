import type { ViewEnum } from "../core/chatIaTypes";
import type { RelationKindEnum } from "./relation.config";

export type ViewFieldConfig = {
  field: string;
  label: string;
  emptyText?: string;
};

export type ViewSectionConfig = {
  id: string;
  title: string;
  entryBoundaryId: string;
  fields: ViewFieldConfig[];
  emptyText: string;
};

export type ViewConfigStatus = "ready" | "placeholder";

export type ViewConfig = {
  viewKind: ViewEnum;
  title: string;
  status: ViewConfigStatus;
  entryBoundaryIds: string[];
  relationsToShow?: RelationKindEnum[];
  maxRecords: number;
  sections: ViewSectionConfig[];
  unavailableText?: string;
};

export const VIEW_CONFIGS: Record<ViewEnum, ViewConfig> = {
  Driver360: {
    viewKind: "Driver360",
    title: "Profilo autista",
    status: "ready",
    entryBoundaryIds: [
      "firestore-storage-colleghi-doc",
      "firestore-storage-autisti-sessioni-attive-doc",
      "firestore-storage-mezzi-aziendali-doc",
    ],
    maxRecords: 20,
    relationsToShow: ["driver_vehicle"],
    sections: [
      {
        id: "driver_identity",
        title: "Anagrafica certificata",
        entryBoundaryId: "firestore-storage-colleghi-doc",
        fields: [
          { field: "nome", label: "Nome" },
          { field: "badge", label: "Badge" },
        ],
        emptyText: "dato non trovato nelle fonti autorizzate",
      },
    ],
  },
  Vehicle360: {
    viewKind: "Vehicle360",
    title: "Profilo mezzo",
    status: "ready",
    entryBoundaryIds: [
      "firestore-storage-mezzi-aziendali-doc",
      "firestore-storage-rifornimenti-doc",
      "firestore-storage-rifornimenti-autisti-tmp-doc",
    ],
    maxRecords: 20,
    relationsToShow: ["driver_vehicle", "vehicle_refueling", "vehicle_maintenance"],
    sections: [
      {
        id: "vehicle_identity",
        title: "Anagrafica mezzo",
        entryBoundaryId: "firestore-storage-mezzi-aziendali-doc",
        fields: [
          { field: "targa", label: "Targa" },
          { field: "categoria", label: "Categoria" },
          { field: "marca", label: "Marca" },
          { field: "modello", label: "Modello" },
          { field: "telaio", label: "Telaio" },
          { field: "dataScadenzaRevisione", label: "Scadenza revisione" },
        ],
        emptyText: "dato non trovato nelle fonti autorizzate",
      },
    ],
  },
  Site360: {
    viewKind: "Site360",
    title: "Profilo cantiere",
    status: "ready",
    entryBoundaryIds: [
      "firestore-storage-lavori-doc",
      "firestore-storage-materiali-consegnati-doc",
      "firestore-storage-attrezzature-cantieri-doc",
      "firestore-storage-inventario-doc",
      "firestore-storage-ordini-doc",
      "firestore-storage-fornitori-doc",
      "firestore-documenti-magazzino-root",
      "firestore-documenti-generici-root",
      "firestore-documenti-cisterna-root",
      "firestore-cisterna-schede-ia-root",
      "firestore-cisterna-parametri-mensili-root",
    ],
    maxRecords: 20,
    relationsToShow: ["site_equipment", "material_supplier"],
    sections: [
      {
        id: "site_jobs",
        title: "Lavori e cantieri",
        entryBoundaryId: "firestore-storage-lavori-doc",
        fields: [
          { field: "cantiere", label: "Cantiere" },
          { field: "stato", label: "Stato" },
          { field: "tipo", label: "Tipo" },
          { field: "data", label: "Data" },
        ],
        emptyText: "dato non trovato nelle fonti autorizzate",
      },
      {
        id: "site_materials",
        title: "Materiali consegnati",
        entryBoundaryId: "firestore-storage-materiali-consegnati-doc",
        fields: [
          { field: "materiale", label: "Materiale" },
          { field: "codice", label: "Codice" },
          { field: "quantita", label: "Quantita" },
          { field: "cantiere", label: "Cantiere" },
        ],
        emptyText: "dato non trovato nelle fonti autorizzate",
      },
      {
        id: "site_documents",
        title: "Documenti",
        entryBoundaryId: "firestore-documenti-magazzino-root",
        fields: [
          { field: "tipoDocumento", label: "Tipo documento" },
          { field: "fornitore", label: "Fornitore" },
          { field: "dataDocumento", label: "Data" },
          { field: "totaleDocumento", label: "Totale" },
        ],
        emptyText: "dato non trovato nelle fonti autorizzate",
      },
      {
        id: "site_cisterna_documents",
        title: "Documenti cisterna",
        entryBoundaryId: "firestore-documenti-cisterna-root",
        fields: [
          { field: "tipoDocumento", label: "Tipo documento" },
          { field: "fornitore", label: "Fornitore" },
          { field: "yearMonth", label: "Mese" },
          { field: "litriTotali", label: "Litri" },
        ],
        emptyText: "dato non trovato nelle fonti autorizzate",
      },
      {
        id: "site_cisterna_sheets",
        title: "Schede cisterna",
        entryBoundaryId: "firestore-cisterna-schede-ia-root",
        fields: [
          { field: "yearMonth", label: "Mese" },
          { field: "rowCount", label: "Righe" },
          { field: "needsReview", label: "Da verificare" },
          { field: "fonte", label: "Fonte" },
        ],
        emptyText: "dato non trovato nelle fonti autorizzate",
      },
      {
        id: "site_cisterna_parameters",
        title: "Parametri cisterna",
        entryBoundaryId: "firestore-cisterna-parametri-mensili-root",
        fields: [
          { field: "mese", label: "Mese" },
          { field: "cambioEurChf", label: "Cambio EUR/CHF" },
          { field: "updatedAt", label: "Aggiornato" },
        ],
        emptyText: "dato non trovato nelle fonti autorizzate",
      },
    ],
  },
  Euromecc360: {
    viewKind: "Euromecc360",
    title: "Stato Euromecc",
    status: "ready",
    entryBoundaryIds: [
      "firestore-euromecc-pending-root",
      "firestore-euromecc-done-root",
      "firestore-euromecc-issues-root",
      "firestore-euromecc-area-meta-root",
      "firestore-euromecc-extra-components-root",
      "firestore-euromecc-relazioni-root",
    ],
    maxRecords: 20,
    relationsToShow: [],
    sections: [
      {
        id: "euromecc_pending",
        title: "Attivita aperte",
        entryBoundaryId: "firestore-euromecc-pending-root",
        fields: [
          { field: "areaKey", label: "Area" },
          { field: "subKey", label: "Sottoarea" },
          { field: "title", label: "Titolo" },
          { field: "priority", label: "Priorita" },
          { field: "dueDate", label: "Scadenza" },
        ],
        emptyText: "dato non trovato nelle fonti autorizzate",
      },
      {
        id: "euromecc_done",
        title: "Attivita completate",
        entryBoundaryId: "firestore-euromecc-done-root",
        fields: [
          { field: "areaKey", label: "Area" },
          { field: "subKey", label: "Sottoarea" },
          { field: "title", label: "Titolo" },
          { field: "doneDate", label: "Data completamento" },
          { field: "nextDate", label: "Prossima data" },
        ],
        emptyText: "dato non trovato nelle fonti autorizzate",
      },
      {
        id: "euromecc_issues",
        title: "Problemi aperti",
        entryBoundaryId: "firestore-euromecc-issues-root",
        fields: [
          { field: "areaKey", label: "Area" },
          { field: "subKey", label: "Sottoarea" },
          { field: "title", label: "Titolo" },
          { field: "type", label: "Tipo" },
          { field: "state", label: "Stato" },
        ],
        emptyText: "dato non trovato nelle fonti autorizzate",
      },
      {
        id: "euromecc_area_meta",
        title: "Metadati area",
        entryBoundaryId: "firestore-euromecc-area-meta-root",
        fields: [
          { field: "areaKey", label: "Area" },
          { field: "cementType", label: "Tipo cemento" },
          { field: "cementTypeShort", label: "Sigla cemento" },
          { field: "updatedAt", label: "Aggiornato" },
        ],
        emptyText: "dato non trovato nelle fonti autorizzate",
      },
      {
        id: "euromecc_components",
        title: "Componenti extra",
        entryBoundaryId: "firestore-euromecc-extra-components-root",
        fields: [
          { field: "areaKey", label: "Area" },
          { field: "subKey", label: "Sottoarea" },
          { field: "componentKey", label: "Componente" },
          { field: "componentName", label: "Nome" },
          { field: "state", label: "Stato" },
        ],
        emptyText: "dato non trovato nelle fonti autorizzate",
      },
      {
        id: "euromecc_relations",
        title: "Relazioni Euromecc",
        entryBoundaryId: "firestore-euromecc-relazioni-root",
        fields: [
          { field: "areaKey", label: "Area" },
          { field: "subKey", label: "Sottoarea" },
          { field: "relationKind", label: "Relazione" },
          { field: "status", label: "Stato" },
          { field: "updatedAt", label: "Aggiornato" },
        ],
        emptyText: "dato non trovato nelle fonti autorizzate",
      },
    ],
  },
  Ricerca360: {
    viewKind: "Ricerca360",
    title: "Ricerca certificata",
    status: "ready",
    entryBoundaryIds: [
      "firestore-storage-mezzi-aziendali-doc",
      "firestore-storage-lavori-doc",
      "firestore-storage-manutenzioni-doc",
      "firestore-documenti-mezzi-root",
      "firestore-documenti-magazzino-root",
      "firestore-documenti-generici-root",
      "firestore-documenti-cisterna-root",
      "firestore-cisterna-schede-ia-root",
      "firestore-cisterna-parametri-mensili-root",
      "firestore-storage-rifornimenti-doc",
      "firestore-storage-inventario-doc",
      "firestore-storage-materiali-consegnati-doc",
      "firestore-storage-ordini-doc",
      "firestore-storage-preventivi-doc",
      "firestore-storage-preventivi-approvazioni-doc",
      "firestore-storage-fornitori-doc",
      "firestore-storage-officine-doc",
    ],
    maxRecords: 20,
    relationsToShow: [
      "driver_vehicle",
      "vehicle_refueling",
      "vehicle_maintenance",
      "material_supplier",
      "site_equipment",
    ],
    sections: [
      {
        id: "search_vehicle",
        title: "Mezzi",
        entryBoundaryId: "firestore-storage-mezzi-aziendali-doc",
        fields: [
          { field: "targa", label: "Targa" },
          { field: "categoria", label: "Categoria" },
          { field: "marca", label: "Marca" },
          { field: "modello", label: "Modello" },
        ],
        emptyText: "dato non trovato nelle fonti autorizzate",
      },
      {
        id: "search_documents_vehicle",
        title: "Documenti mezzo",
        entryBoundaryId: "firestore-documenti-mezzi-root",
        fields: [
          { field: "tipoDocumento", label: "Tipo documento" },
          { field: "targa", label: "Targa" },
          { field: "fornitore", label: "Fornitore" },
          { field: "dataDocumento", label: "Data" },
        ],
        emptyText: "dato non trovato nelle fonti autorizzate",
      },
      {
        id: "search_documents_generic",
        title: "Documenti generici",
        entryBoundaryId: "firestore-documenti-generici-root",
        fields: [
          { field: "tipoDocumento", label: "Tipo documento" },
          { field: "fornitore", label: "Fornitore" },
          { field: "dataDocumento", label: "Data" },
          { field: "totaleDocumento", label: "Totale" },
        ],
        emptyText: "dato non trovato nelle fonti autorizzate",
      },
      {
        id: "search_cisterna_documents",
        title: "Documenti cisterna",
        entryBoundaryId: "firestore-documenti-cisterna-root",
        fields: [
          { field: "tipoDocumento", label: "Tipo documento" },
          { field: "fornitore", label: "Fornitore" },
          { field: "yearMonth", label: "Mese" },
          { field: "litriTotali", label: "Litri" },
        ],
        emptyText: "dato non trovato nelle fonti autorizzate",
      },
      {
        id: "search_cisterna_sheets",
        title: "Schede cisterna",
        entryBoundaryId: "firestore-cisterna-schede-ia-root",
        fields: [
          { field: "yearMonth", label: "Mese" },
          { field: "rowCount", label: "Righe" },
          { field: "needsReview", label: "Da verificare" },
          { field: "fonte", label: "Fonte" },
        ],
        emptyText: "dato non trovato nelle fonti autorizzate",
      },
    ],
  },
};

export function getViewConfig(viewKind: ViewEnum): ViewConfig {
  return VIEW_CONFIGS[viewKind];
}
