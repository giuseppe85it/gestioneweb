import { isChatIaMezzoSameTarga } from "./chatIaMezziTarga";
import type { ChatIaMezzoSnapshot, ChatIaMezzoTimelineEvent } from "./chatIaMezziTypes";

function fromDateText(value: string | null): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function dateLabelFromTimestamp(timestamp: number | null): string | null {
  if (!timestamp) return null;
  return new Date(timestamp).toLocaleDateString("it-IT");
}

function severityFromText(value: string | null | undefined): ChatIaMezzoTimelineEvent["severity"] {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("ko") || normalized.includes("alta") || normalized.includes("scad")) {
    return "danger";
  }
  if (normalized.includes("media") || normalized.includes("warning") || normalized.includes("attenzione")) {
    return "warning";
  }
  if (normalized.includes("ok") || normalized.includes("eseguit")) {
    return "ok";
  }
  return "neutral";
}

export function buildChatIaMezzoTimeline(snapshot: ChatIaMezzoSnapshot): ChatIaMezzoTimelineEvent[] {
  const eventi = snapshot.statoOperativo.eventiStorici
    .filter((item) => item.targasCoinvolte.some((targa) => isChatIaMezzoSameTarga(targa, snapshot.targa)))
    .map((item): ChatIaMezzoTimelineEvent => ({
      id: `evento-${item.id}`,
      source: "evento",
      title: item.tipo ?? "Evento operativo",
      detail: item.luogo ?? item.nomeAutista,
      dateLabel: dateLabelFromTimestamp(item.timestamp),
      timestamp: item.timestamp,
      severity: "neutral",
      sourceLabel: "Eventi operativi",
      sourceId: item.sourceRecordId,
    }));

  const segnalazioniControlli = snapshot.segnalazioniControlli.timelineItems.map(
    (item): ChatIaMezzoTimelineEvent => ({
      id: `${item.source}-${item.id}`,
      source: item.source,
      title: item.title,
      detail: item.detail ?? item.subtitle,
      dateLabel: item.data ?? dateLabelFromTimestamp(item.timestamp),
      timestamp: item.timestamp,
      severity: item.source === "controllo" ? severityFromText(item.title) : "warning",
      sourceLabel: item.source === "controllo" ? "Controlli mezzo" : "Segnalazioni autisti",
      sourceId: item.id,
    }),
  );

  const rifornimenti = snapshot.rifornimenti.items.map((item): ChatIaMezzoTimelineEvent => ({
    id: `rifornimento-${item.id}`,
    source: "rifornimento",
    title: `Rifornimento${item.litri !== null ? ` ${item.litri} l` : ""}`,
    detail: item.distributore ?? item.note,
    dateLabel: item.dataLabel ?? item.dataDisplay,
    timestamp: item.timestamp ?? item.timestampRicostruito,
    severity: "neutral",
    sourceLabel: "Rifornimenti",
    sourceId: item.id,
  }));

  const manutenzioni = snapshot.operativita.manutenzioni.map((item): ChatIaMezzoTimelineEvent => ({
    id: `manutenzione-${item.id}`,
    source: "manutenzione",
    title: item.descrizione ?? item.tipo ?? "Manutenzione",
    detail: item.km !== null ? `${item.km} km` : null,
    dateLabel: item.data,
    timestamp: fromDateText(item.data),
    severity: "ok",
    sourceLabel: "Manutenzioni",
    sourceId: item.id,
  }));

  const lavori = snapshot.lavori.items.map((item): ChatIaMezzoTimelineEvent => ({
    id: `lavoro-${item.id}`,
    source: "lavoro",
    title: item.descrizione ?? "Lavoro mezzo",
    detail: item.dettagli,
    dateLabel: item.dataEsecuzione ?? item.dataInserimento,
    timestamp: item.timestampEsecuzione ?? item.timestampInserimento,
    severity: item.eseguito ? "ok" : severityFromText(item.urgenza),
    sourceLabel: item.eseguito ? "Lavori eseguiti" : "Lavori aperti",
    sourceId: item.id,
  }));

  return [...eventi, ...segnalazioniControlli, ...rifornimenti, ...manutenzioni, ...lavori].sort(
    (left, right) => (right.timestamp ?? -1) - (left.timestamp ?? -1),
  );
}

export function limitChatIaMezzoTimeline(
  timeline: ChatIaMezzoTimelineEvent[],
  maxItems = 20,
): ChatIaMezzoTimelineEvent[] {
  return timeline.slice(0, maxItems);
}
