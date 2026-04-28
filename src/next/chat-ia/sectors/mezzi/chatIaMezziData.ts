import type { MezzoDossierCardData } from "../../../internal-ai/internalAiTypes";
import {
  readNextAnagraficheFlottaSnapshot,
  readNextMezzoByTarga,
  type NextAnagraficheFlottaMezzoItem,
} from "../../../nextAnagraficheFlottaDomain";
import { readNextMezzoOperativitaTecnicaSnapshot } from "../../../nextOperativitaTecnicaDomain";
import { readNextMezzoLavoriSnapshot } from "../../../domain/nextLavoriDomain";
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
import type { ChatIaMezzoDataResult, ChatIaMezzoSnapshot } from "./chatIaMezziTypes";

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
    lavori,
    rifornimenti,
    materialiBase,
    statoOperativo,
    segnalazioniControlli,
    documenti,
  ] = await Promise.all([
    readNextMezzoOperativitaTecnicaSnapshot(resolvedTarga),
    readNextMezzoLavoriSnapshot(resolvedTarga),
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
      { label: "Lavori e manutenzioni", path: "storage/@lavori + storage/@manutenzioni", domainCode: "D02" },
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
