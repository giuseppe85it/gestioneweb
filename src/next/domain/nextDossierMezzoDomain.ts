import {
  NEXT_ANAGRAFICHE_FLOTTA_DOMAIN,
  type NextMezzoListItem,
  normalizeNextMezzoTarga,
  readNextMezzoByTarga,
} from "../nextAnagraficheFlottaDomain";
import {
  type NextMezzoOperativitaTecnicaSnapshot,
  readNextMezzoOperativitaTecnicaSnapshot,
} from "../nextOperativitaTecnicaDomain";
import {
  type NextMezzoRifornimentiSnapshot,
  readNextMezzoRifornimentiSnapshot,
} from "../nextRifornimentiConsumiDomain";
import {
  type NextMezzoManutenzioniSnapshot,
  readNextMezzoManutenzioniSnapshot,
} from "./nextManutenzioniDomain";
import {
  type NextMezzoDocumentiCostiSnapshot,
  readNextMezzoDocumentiCostiSnapshot,
} from "./nextDocumentiCostiDomain";

export type NextDossierDomainSectionState<TSnapshot> = {
  status: "idle" | "loading" | "success" | "error";
  snapshot: TSnapshot | null;
  error: string | null;
};

export type NextDossierMezzoOverview = {
  mezzoTarga: string;
  importedBlockLabels: string[];
  excludedBlockLabels: string[];
  nextConvergenceLabels: string[];
  readerLabels: string[];
  statusLabel: string;
  statusMeta: string;
  keySignals: string[];
  technicalLimitations: string[];
  refuelLimitations: string[];
  documentCostLimitations: string[];
};

export type NextDossierMezzoCompositeSnapshot = {
  mezzo: NextMezzoListItem;
  technical: NextDossierDomainSectionState<NextMezzoOperativitaTecnicaSnapshot>;
  maintenance: NextDossierDomainSectionState<NextMezzoManutenzioniSnapshot>;
  refuels: NextDossierDomainSectionState<NextMezzoRifornimentiSnapshot>;
  documentCosts: NextDossierDomainSectionState<NextMezzoDocumentiCostiSnapshot>;
  overview: NextDossierMezzoOverview;
};

function buildOverview(args: {
  mezzo: NextMezzoListItem;
  technical: NextDossierDomainSectionState<NextMezzoOperativitaTecnicaSnapshot>;
  maintenance: NextDossierDomainSectionState<NextMezzoManutenzioniSnapshot>;
  refuels: NextDossierDomainSectionState<NextMezzoRifornimentiSnapshot>;
  documentCosts: NextDossierDomainSectionState<NextMezzoDocumentiCostiSnapshot>;
}): NextDossierMezzoOverview {
  const { mezzo, technical, maintenance, refuels, documentCosts } = args;
  const importedBlockLabels = [
    `D01 identita mezzo da ${mezzo.sourceCollection}/${mezzo.sourceKey}`,
    technical.status === "success"
      ? "D02 backlog lavori aperti e chiusi in sola lettura"
      : null,
    maintenance.status === "success"
      ? "Storico manutenzioni e manutenzione programmata in layer dedicato"
      : null,
    refuels.status === "success"
      ? "D04 rifornimenti ricostruiti con modello pulito unico"
      : null,
    documentCosts.status === "success"
      ? "D07 + D08 documenti e costi read-only con preview mezzo-centrica pulita"
      : null,
  ].filter((entry): entry is string => Boolean(entry));

  const excludedBlockLabels = [
    "nessun writer, modale o workflow della madre",
    "nessun uso di dataset tmp o raw direttamente nella UI",
    "nessuna migrazione 1:1 di DossierMezzo o Mezzo360 legacy",
    "nessun archivio globale `@preventivi`, nessuna approvazione preventivi e nessuna analisi economica completa nel Dossier",
  ];

  const nextConvergenceLabels = [
    "stabilizzare il quadro mezzo-centrico unico D01 + D02 + D04 + D07/D08",
    "estendere la copertura documentale mezzo verso libretti e altri allegati utili senza toccare l'intake globale",
    "chiarire il confine con `@preventivi` e allegati procurement senza globalizzare il Dossier",
    "preparazione input IA Business v1 su Dossier senza backend runtime",
  ];

  const readerLabels = [
    `D01 -> ${NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.activeReadOnlyDataset}`,
    "D02 -> @lavori + @manutenzioni con filtro targa",
    "D02-MAN -> @manutenzioni + @mezzi_aziendali",
    "D04 -> @rifornimenti + @rifornimenti_autisti_tmp confinati nel layer NEXT",
    "D07/D08 -> @costiMezzo + @documenti_mezzi + @documenti_magazzino + @documenti_generici",
  ];

  const keySignals = [
    technical.status === "success"
      ? technical.snapshot?.counts.lavoriAperti
        ? `Backlog tecnico attivo: ${technical.snapshot.counts.lavoriAperti} lavori aperti.`
        : "Backlog tecnico senza lavori aperti per questa targa."
      : "Backlog tecnico non ancora leggibile dal Dossier.",
    maintenance.status === "success"
      ? maintenance.snapshot?.scheduledMaintenance.enabled
        ? `Manutenzione programmata ${maintenance.snapshot.scheduledMaintenance.status}.`
        : "Nessuna manutenzione programmata attiva sul mezzo."
      : "Stato manutentivo non ancora leggibile nel Dossier.",
    refuels.status === "success"
      ? refuels.snapshot?.counts.total
        ? `Rifornimenti letti dal modello D04: ${refuels.snapshot.counts.total} record utili.`
        : "Nessun rifornimento utile letto dal modello D04."
      : "Rifornimenti D04 non ancora leggibili nel Dossier.",
    documentCosts.status === "success"
      ? documentCosts.snapshot?.counts.total
        ? `Documenti e costi letti dal layer D07/D08: ${documentCosts.snapshot.counts.total} record mezzo-centrici.`
        : "Nessun documento o costo utile letto dal layer D07/D08."
      : "Documenti e costi non ancora leggibili nel Dossier.",
  ];

  const successfulBlocks = [technical, maintenance, refuels, documentCosts].filter(
    (entry) => entry.status === "success"
  ).length;

  const statusLabel =
    successfulBlocks === 4
      ? "D01 consolidato + quadro mezzo attivo"
      : successfulBlocks > 0
      ? "D01 attivo con convergenze parziali"
      : "D01 attivo, convergenze in caricamento";

  const statusMeta =
    successfulBlocks === 4
      ? "Identita mezzo, stato tecnico, manutenzioni, rifornimenti e cluster documenti/costi sono gia composti in un solo Dossier read-only."
      : "Il Dossier resta mezzo-centrico anche quando una convergenza parziale non e disponibile: nessun fallback raw viene portato in UI.";

  const technicalLimitations = [
    technical.status === "error" ? technical.error : null,
    maintenance.status === "error" ? maintenance.error : null,
    ...(maintenance.snapshot?.limitations ?? []),
    "Il blocco tecnico resta read-only: nessun dettaglio workflow lavori, nessun writer e nessun merge con costi o magazzino.",
  ].filter((entry): entry is string => Boolean(entry));

  const refuelLimitations = [
    refuels.status === "error" ? refuels.error : null,
    ...(refuels.snapshot?.limitations ?? []),
  ].filter((entry): entry is string => Boolean(entry));

  const documentCostLimitations = [
    documentCosts.status === "error" ? documentCosts.error : null,
    ...(documentCosts.snapshot?.limitations ?? []),
  ].filter((entry): entry is string => Boolean(entry));

  return {
    mezzoTarga: mezzo.targa,
    importedBlockLabels,
    excludedBlockLabels,
    nextConvergenceLabels,
    readerLabels,
    statusLabel,
    statusMeta,
    keySignals,
    technicalLimitations,
    refuelLimitations,
    documentCostLimitations,
  };
}

export async function readNextDossierMezzoCompositeSnapshot(
  targa: string
): Promise<NextDossierMezzoCompositeSnapshot | null> {
  const mezzoTarga = normalizeNextMezzoTarga(targa);
  if (!mezzoTarga) {
    return null;
  }

  const mezzo = await readNextMezzoByTarga(mezzoTarga);
  if (!mezzo) {
    return null;
  }

  const [technicalResult, maintenanceResult, refuelsResult, documentCostsResult] =
    await Promise.allSettled([
    readNextMezzoOperativitaTecnicaSnapshot(mezzoTarga),
    readNextMezzoManutenzioniSnapshot(mezzoTarga),
    readNextMezzoRifornimentiSnapshot(mezzoTarga),
    readNextMezzoDocumentiCostiSnapshot(mezzoTarga),
  ]);

  const technical: NextDossierDomainSectionState<NextMezzoOperativitaTecnicaSnapshot> =
    technicalResult.status === "fulfilled"
      ? {
          status: "success",
          snapshot: technicalResult.value,
          error: null,
        }
      : {
          status: "error",
          snapshot: null,
          error: "Impossibile leggere il primo blocco tecnico dal reader canonico `D02`.",
        };

  const maintenance: NextDossierDomainSectionState<NextMezzoManutenzioniSnapshot> =
    maintenanceResult.status === "fulfilled"
      ? {
          status: "success",
          snapshot: maintenanceResult.value,
          error: null,
        }
      : {
          status: "error",
          snapshot: null,
          error: "Impossibile leggere il blocco manutenzioni dal layer read-only dedicato.",
        };

  const refuels: NextDossierDomainSectionState<NextMezzoRifornimentiSnapshot> =
    refuelsResult.status === "fulfilled"
      ? {
          status: "success",
          snapshot: refuelsResult.value,
          error: null,
        }
      : {
          status: "error",
          snapshot: null,
          error:
            "Impossibile leggere il blocco rifornimenti dal layer di normalizzazione `D04`.",
        };

  const documentCosts: NextDossierDomainSectionState<NextMezzoDocumentiCostiSnapshot> =
    documentCostsResult.status === "fulfilled"
      ? {
          status: "success",
          snapshot: documentCostsResult.value,
          error: null,
        }
      : {
          status: "error",
          snapshot: null,
          error:
            "Impossibile leggere il blocco documenti e costi dal layer read-only `D07/D08`.",
        };

  return {
    mezzo,
    technical,
    maintenance,
    refuels,
    documentCosts,
    overview: buildOverview({
      mezzo,
      technical,
      maintenance,
      refuels,
      documentCosts,
    }),
  };
}
