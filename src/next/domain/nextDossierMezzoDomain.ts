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
    "Scheda identita mezzo",
    technical.status === "success" ? "Lavori aperti e chiusi del mezzo" : null,
    maintenance.status === "success" ? "Storico manutenzioni e pianificazione mezzo" : null,
    refuels.status === "success" ? "Rifornimenti recenti del mezzo" : null,
    documentCosts.status === "success" ? "Documenti e costi collegati alla targa" : null,
  ].filter((entry): entry is string => Boolean(entry));

  const excludedBlockLabels = [
    "nessuna modifica dati",
    "nessun workflow tecnico della madre",
    "nessuna vista eventi/autisti stile Mezzo360",
    "nessuna analisi economica completa del mezzo",
  ];

  const nextConvergenceLabels = [
    "allargare i documenti collegati al mezzo",
    "chiarire il confine con preventivi e ordini globali",
    "completare i collegamenti verso PDF e sintesi assistite",
    "preparare la lettura IA del Dossier senza toccare il runtime della madre",
  ];

  const readerLabels = [
    `Identita mezzo: ${NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.activeReadOnlyDataset}`,
    "Lavori: @lavori",
    "Manutenzioni: @manutenzioni + @mezzi_aziendali",
    "Rifornimenti: ricostruzione da @rifornimenti e feed campo",
    "Documenti e costi: @costiMezzo + collezioni documentali",
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
        ? `Rifornimenti letti: ${refuels.snapshot.counts.total} record utili.`
        : "Nessun rifornimento utile letto per questa targa."
      : "Rifornimenti non ancora disponibili nel Dossier.",
    documentCosts.status === "success"
      ? documentCosts.snapshot?.counts.total
        ? `Documenti e costi letti: ${documentCosts.snapshot.counts.total} record collegati al mezzo.`
        : "Nessun documento o costo utile letto per questa targa."
      : "Documenti e costi non ancora disponibili nel Dossier.",
  ];

  const successfulBlocks = [technical, maintenance, refuels, documentCosts].filter(
    (entry) => entry.status === "success"
  ).length;

  const statusLabel =
    successfulBlocks === 4
      ? "Quadro mezzo completo"
      : successfulBlocks > 0
      ? "Quadro mezzo parziale"
      : "Scheda mezzo in caricamento";

  const statusMeta =
    successfulBlocks === 4
      ? "Scheda mezzo, stato tecnico, manutenzioni, rifornimenti e documenti sono gia leggibili in un solo Dossier."
      : "Il Dossier resta mezzo-centrico anche quando un blocco non e disponibile.";

  const technicalLimitations = [
    technical.status === "error" ? technical.error : null,
    maintenance.status === "error" ? maintenance.error : null,
    ...(maintenance.snapshot?.limitations ?? []),
    "Il blocco tecnico resta in sola lettura: nessun dettaglio workflow lavori e nessun merge con costi o magazzino.",
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
