import type { MezzoDossierCardData } from "../../../internal-ai/internalAiTypes";
import {
  readNextAnagraficheFlottaSnapshot,
  readNextMezzoByTarga,
  type NextAnagraficheFlottaMezzoItem,
} from "../../../nextAnagraficheFlottaDomain";
import { readNextMezzoOperativitaTecnicaSnapshot } from "../../../nextOperativitaTecnicaDomain";
import {
  readNextMezzoManutenzioniSnapshot,
  type NextMaintenanceHistoryItem,
  type NextMezzoManutenzioniSnapshot,
} from "../../../domain/nextManutenzioniDomain";
import { readNextMezzoRifornimentiSnapshot } from "../../../domain/nextRifornimentiDomain";
import {
  buildNextMezzoMaterialiMovimentiSnapshot,
  readNextMaterialiMovimentiSnapshot,
} from "../../../domain/nextMaterialiMovimentiDomain";
import { readNextStatoOperativoSnapshot } from "../../../domain/nextCentroControlloDomain";
import { readNextMezzoSegnalazioniControlliSnapshot } from "../../../domain/nextSegnalazioniControlliDomain";
import { readNextMezzoDocumentiSnapshot } from "../../../domain/nextDocumentiMezzoDomain";
import type { D10AlertItem, D10FocusItem } from "../../../domain/nextCentroControlloDomain";
import type { ChatIaTable } from "../../core/chatIaTypes";
import {
  isChatIaMezzoSameTarga,
  normalizeChatIaMezzoTarga,
  resolveChatIaMezzoTarga,
} from "./chatIaMezziTarga";
import type {
  ChatIaMezzoDataResult,
  ChatIaMezzoLavoriCompatItem,
  ChatIaMezzoLavoriCompatSnapshot,
  ChatIaMezzoSnapshot,
} from "./chatIaMezziTypes";

function collectLimitations(snapshot: ChatIaMezzoSnapshot): string[] {
  return [
    ...snapshot.lavori.limitations,
    ...snapshot.rifornimenti.limitations,
    ...snapshot.materiali.limitations,
    ...snapshot.statoOperativo.limitations,
    ...snapshot.segnalazioniControlli.limitations,
    ...snapshot.documenti.limitations,
  ].filter((entry, index, list) => Boolean(entry) && list.indexOf(entry) === index);
}

function findMezzoByTarga(
  items: NextAnagraficheFlottaMezzoItem[],
  targa: string,
): NextAnagraficheFlottaMezzoItem | null {
  const normalized = normalizeChatIaMezzoTarga(targa);
  return items.find((mezzo) => normalizeChatIaMezzoTarga(mezzo.targa) === normalized) ?? null;
}

function toCardSeverity(value: D10AlertItem["severity"] | D10FocusItem["severity"]): "danger" | "warning" | "info" {
  return value === "danger" || value === "warning" ? value : "info";
}

function toCardAlert(item: D10AlertItem | D10FocusItem) {
  return {
    id: item.id,
    kind: item.kind,
    title: item.title,
    detailText: item.detailText,
    severity: toCardSeverity(item.severity),
    dateLabel: item.dateLabel,
    targetRoute: item.targetRoute,
  };
}

function isManutenzioneDaFare(item: NextMaintenanceHistoryItem): boolean {
  return item.stato === "daFare" || item.stato === "programmata";
}

function toLavoroCompatItem(item: NextMaintenanceHistoryItem): ChatIaMezzoLavoriCompatItem {
  const isEseguita = item.stato === "eseguita";
  return {
    id: item.id,
    gruppoId: null,
    targa: item.mezzoTarga,
    mezzoTarga: item.mezzoTarga,
    descrizione: item.descrizione ?? "Manutenzione",
    dettagli: item.tipo,
    dataInserimento: item.dataProgrammata ?? item.dataRaw,
    timestampInserimento: item.timestamp,
    dataEsecuzione: isEseguita ? item.dataRaw : null,
    timestampEsecuzione: isEseguita ? item.timestamp : null,
    eseguito: isEseguita,
    stato: item.stato,
    urgenza: item.urgenza,
    segnalatoDa: null,
    chiHaEseguito: item.eseguitoLabel,
  };
}

// Fonte: @manutenzioni; deroga J.10 controllata 2026-05-13.
function buildLavoriCompatFromManutenzioni(
  snapshot: NextMezzoManutenzioniSnapshot,
): ChatIaMezzoLavoriCompatSnapshot {
  const items = snapshot.historyItems.map(toLavoroCompatItem);
  const daEseguire = snapshot.historyItems.filter(isManutenzioneDaFare).map(toLavoroCompatItem);
  const eseguiti = snapshot.historyItems.filter((item) => item.stato === "eseguita").map(toLavoroCompatItem);
  const chiuseDaEvento = snapshot.historyItems
    .filter((item) => item.stato === "chiusa_da_evento")
    .map(toLavoroCompatItem);

  return {
    domainCode: snapshot.domainCode,
    domainName: snapshot.domainName,
    mezzoTarga: snapshot.mezzoTarga,
    logicalDatasets: snapshot.logicalDatasets,
    activeReadOnlyDataset: "@manutenzioni",
    normalizationStrategy: "manutenzioni-dafare-compat",
    outputContract: "chat-ia-mezzo-lavori-compat-da-manutenzioni",
    datasetShape: "items",
    items,
    daEseguire,
    inAttesa: daEseguire,
    eseguiti,
    counts: {
      total: items.length,
      daEseguire: daEseguire.length,
      inAttesa: daEseguire.length,
      eseguiti: eseguiti.length,
      chiuseDaEvento: chiuseDaEvento.length,
      apertiSenzaGruppo: daEseguire.length,
      withDettagli: items.filter((item) => Boolean(item.dettagli)).length,
      withDataEsecuzione: eseguiti.filter((item) => Boolean(item.dataEsecuzione)).length,
      withChiHaEseguito: eseguiti.filter((item) => Boolean(item.chiHaEseguito)).length,
      sourceSegnalazioni: 0,
      sourceControlli: 0,
    },
    limitations:
      chiuseDaEvento.length > 0
        ? [
            ...snapshot.limitations,
            `${chiuseDaEvento.length} manutenzioni chiuse da evento sono escluse da aperte ed eseguite classiche.`,
          ]
        : snapshot.limitations,
  };
}

export async function readChatIaMezzoSnapshot(requestedTarga: string): Promise<ChatIaMezzoDataResult> {
  const flotta = await readNextAnagraficheFlottaSnapshot();
  const match = resolveChatIaMezzoTarga({ requestedTarga, mezzi: flotta.items });
  if (match.status !== "found") {
    return { ok: false, match, snapshot: null };
  }

  const resolvedTarga = match.resolvedTarga;
  const mezzo = (await readNextMezzoByTarga(resolvedTarga)) ?? findMezzoByTarga(flotta.items, resolvedTarga);
  if (!mezzo) {
    return { ok: false, match: { status: "not_found", requestedTarga }, snapshot: null };
  }

  const [
    operativita,
    manutenzioni,
    rifornimenti,
    materialiBase,
    statoOperativo,
    segnalazioniControlli,
    documenti,
  ] = await Promise.all([
    readNextMezzoOperativitaTecnicaSnapshot(resolvedTarga),
    readNextMezzoManutenzioniSnapshot(resolvedTarga),
    readNextMezzoRifornimentiSnapshot(resolvedTarga),
    readNextMaterialiMovimentiSnapshot({ includeCloneOverlays: false }),
    readNextStatoOperativoSnapshot(),
    readNextMezzoSegnalazioniControlliSnapshot(resolvedTarga),
    readNextMezzoDocumentiSnapshot(resolvedTarga),
  ]);

  const materiali = buildNextMezzoMaterialiMovimentiSnapshot({
    baseSnapshot: materialiBase,
    targa: resolvedTarga,
    mezzoId: mezzo.id,
  });
  const lavori = buildLavoriCompatFromManutenzioni(manutenzioni);

  const snapshot: ChatIaMezzoSnapshot = {
    requestedTarga: normalizeChatIaMezzoTarga(requestedTarga),
    targa: resolvedTarga,
    matchKind: match.matchKind,
    mezzo,
    operativita,
    lavori,
    rifornimenti,
    materiali,
    statoOperativo,
    segnalazioniControlli,
    documenti,
    generatedAt: new Date().toISOString(),
    sources: [
      { label: "Anagrafica flotta", path: "storage/@mezzi_aziendali", domainCode: "D01" },
      { label: "Manutenzioni", path: "storage/@manutenzioni", domainCode: "D02" },
      { label: "Rifornimenti", path: "storage/@rifornimenti", domainCode: "D04" },
      { label: "Materiali consegnati", path: "storage/@materialiconsegnati", domainCode: "D05" },
      { label: "Stato operativo", path: "storage/@alerts_state + storage/@storico_eventi_operativi", domainCode: "D10" },
      { label: "Segnalazioni e controlli completi", path: "storage/@segnalazioni_autisti_tmp + storage/@controlli_mezzo_autisti", domainCode: "D11-MEZ-EVENTI" },
      { label: "Documenti completi", path: "@documenti_mezzi + @documenti_magazzino + @documenti_generici", domainCode: "D12-MEZ-DOCUMENTI" },
    ],
    missingData: [],
  };

  snapshot.missingData = collectLimitations(snapshot);
  return { ok: true, match, snapshot };
}

export function buildChatIaMezzoCardData(snapshot: ChatIaMezzoSnapshot): MezzoDossierCardData {
  const alerts = snapshot.statoOperativo.alerts.filter((item) =>
    isChatIaMezzoSameTarga(item.mezzoTarga, snapshot.targa),
  );
  const focusItems = snapshot.statoOperativo.focusItems.filter((item) =>
    isChatIaMezzoSameTarga(item.mezzoTarga, snapshot.targa),
  );
  const revisionUrgente = snapshot.statoOperativo.revisioniUrgenti.some((item) =>
    isChatIaMezzoSameTarga(item.targa, snapshot.targa),
  );

  return {
    targa: snapshot.mezzo.targa,
    categoria: snapshot.mezzo.categoria,
    marcaModello: snapshot.mezzo.marcaModello,
    anno: snapshot.mezzo.anno,
    tipo: snapshot.mezzo.tipo,
    autistaNome: snapshot.mezzo.autistaNome,
    fotoUrl: snapshot.mezzo.fotoUrl,
    dataScadenzaRevisione: snapshot.mezzo.dataScadenzaRevisione,
    dataScadenzaRevisioneTimestamp: snapshot.mezzo.dataScadenzaRevisioneTimestamp,
    revisioneUrgente: revisionUrgente,
    manutenzioneProgrammata: snapshot.mezzo.manutenzioneProgrammata,
    manutenzioneDataFine: snapshot.mezzo.manutenzioneDataFine,
    manutenzioneDataFineTimestamp: snapshot.mezzo.manutenzioneDataFineTimestamp,
    manutenzioneKmMax: snapshot.mezzo.manutenzioneKmMax,
    alerts: alerts.map(toCardAlert),
    focusItems: focusItems.map(toCardAlert),
    lavoriAperti: snapshot.operativita.lavoriAperti,
    lavoriChiusi: snapshot.operativita.lavoriChiusi,
    manutenzioniD02: snapshot.operativita.manutenzioni,
    counts: {
      lavoriAperti: snapshot.operativita.counts.lavoriAperti,
      lavoriChiusi: snapshot.operativita.counts.lavoriChiusi,
      manutenzioni: snapshot.operativita.counts.manutenzioni,
    },
    librettoUrl: snapshot.mezzo.librettoUrl,
  };
}

export function buildChatIaMezzoMaterialsTable(snapshot: ChatIaMezzoSnapshot): ChatIaTable {
  return {
    id: `mezzo-materiali-${snapshot.targa}`,
    title: `Materiali consegnati ${snapshot.targa}`,
    columns: [
      { key: "data", label: "Data" },
      { key: "materiale", label: "Materiale" },
      { key: "quantita", label: "Q.ta", align: "right" },
      { key: "fornitore", label: "Fornitore" },
      { key: "costo", label: "Costo", align: "right" },
    ],
    rows: snapshot.materiali.items.map((item) => ({
      data: item.data,
      materiale: item.materiale ?? item.descrizione,
      quantita: item.quantita,
      fornitore: item.fornitore,
      costo: item.costoTotale,
    })),
    emptyText: "Nessun materiale consegnato trovato per questo mezzo.",
  };
}

export function buildChatIaMezzoDocumentsTable(snapshot: ChatIaMezzoSnapshot): ChatIaTable {
  return {
    id: `mezzo-documenti-${snapshot.targa}`,
    title: `Documenti ${snapshot.targa}`,
    columns: [
      { key: "data", label: "Data" },
      { key: "tipo", label: "Tipo" },
      { key: "titolo", label: "Titolo" },
      { key: "fonte", label: "Fonte" },
      { key: "file", label: "File" },
    ],
    rows: snapshot.documenti.items.map((item) => ({
      data: item.dataDocumento,
      tipo: item.tipoDocumento,
      titolo: item.titolo ?? item.descrizione,
      fonte: item.sourceKey,
      file: item.fileUrl ? "si" : "no",
    })),
    emptyText: "Nessun documento trovato per questo mezzo.",
  };
}
