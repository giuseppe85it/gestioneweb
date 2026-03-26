const STORAGE_BUCKET = "gestionemanutenzione-934ef.firebasestorage.app";

const FIRESTORE_MEZZI_ALLOWED_FIELDS = Object.freeze([
  "id",
  "targa",
  "categoria",
  "marca",
  "modello",
  "autistaNome",
  "librettoUrl",
  "librettoStoragePath",
  "dataImmatricolazione",
  "dataScadenzaRevisione",
  "dataUltimoCollaudo",
  "telaio",
  "massaComplessiva",
]);

const FIRESTORE_ALLOWED_READS = Object.freeze([
  Object.freeze({
    id: "firestore-storage-mezzi-aziendali-doc",
    label: "Documento mezzo-centrico minimo",
    service: "firestore",
    accessMode: "exact_document",
    collection: "storage",
    docId: "@mezzi_aziendali",
    datasetKey: "@mezzi_aziendali",
    sourceOfTruth:
      "Perimetro D01 gia usato dal clone e dal retrieval seedato del backend IA per libretto/report mezzo.",
    matchStrategy: "single_targa_exact_match",
    requestLimits: {
      maxDocumentReadsPerRequest: 1,
      maxReturnedVehicleRecords: 1,
    },
    allowedFields: FIRESTORE_MEZZI_ALLOWED_FIELDS,
    forbiddenDomains: Object.freeze([
      "@rifornimenti",
      "@rifornimenti_autisti_tmp",
      "@costiMezzo",
      "@documenti_mezzi",
      "@documenti_magazzino",
      "@documenti_generici",
      "@preventivi",
      "@preventivi_approvazioni",
    ]),
  }),
]);

const STORAGE_ALLOWED_READS = Object.freeze([
  Object.freeze({
    id: "storage-libretto-path-from-mezzo",
    label: "Oggetto libretto puntato dal mezzo",
    service: "storage",
    accessMode: "exact_object_path_from_firestore_field",
    bucket: STORAGE_BUCKET,
    sourceCollection: "storage",
    sourceDocId: "@mezzi_aziendali",
    sourceField: "librettoStoragePath",
    sourceOfTruth:
      "Solo path ricavato da un mezzo gia whitelisted in storage/@mezzi_aziendali, senza listing del bucket.",
    requestLimits: {
      maxObjectReadsPerRequest: 1,
    },
    allowedOperations: Object.freeze(["metadata_probe", "exact_file_read"]),
    forbiddenPrefixes: Object.freeze([
      "documenti_pdf/",
      "preventivi/",
      "autisti/",
    ]),
  }),
]);

export const INTERNAL_AI_FIREBASE_READONLY_BOUNDARY = Object.freeze({
  mode: "live_read_closed",
  firestore: Object.freeze({
    allowedReads: FIRESTORE_ALLOWED_READS,
  }),
  storage: Object.freeze({
    bucket: STORAGE_BUCKET,
    allowedReads: STORAGE_ALLOWED_READS,
  }),
  notes: Object.freeze([
    "Verdetto operativo attuale: live-read business chiuso.",
    "Le voci allowedReads descrivono solo il confine massimo documentato e non autorizzano alcuna lettura live nel backend IA separato.",
    "Finche il confine resta chiuso, la IA usa solo read model NEXT, snapshot seedate dal clone e snapshot repo/UI curate.",
  ]),
});

export function readInternalAiFirebaseReadonlyBoundary() {
  return INTERNAL_AI_FIREBASE_READONLY_BOUNDARY;
}
