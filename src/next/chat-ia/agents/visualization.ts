import type {
  ChatIaAssistantFinalMessage,
  ChatIaBlockCallout,
  ChatIaBlockMetricCardGrid,
  ChatIaBlockNestedList,
  ChatIaBlockSummaryCardBig,
  ChatIaOutputBlock,
  ChatIaVisualizationMetric,
} from "../core/chatIaTypes";
import type { ChatIaAnalyticsMetric, ChatIaAnalyticsResult } from "./types";

function metricFromAnalytics(item: ChatIaAnalyticsMetric): ChatIaVisualizationMetric {
  return {
    label: item.label,
    value: item.value,
    unit: item.unit ?? null,
    subtitle: item.detail ?? null,
    tone: "info",
    metadata: item.metadata ?? [],
    action: item.action ?? null,
  };
}

function metric(label: string, value: string | number, unit?: string | null, detail?: string | null): ChatIaVisualizationMetric {
  return { label, value, unit: unit ?? null, subtitle: detail ?? null, tone: "info", metadata: [], action: null };
}

function summaryFromMetric(title: string, metricItem: ChatIaVisualizationMetric | undefined): ChatIaBlockSummaryCardBig {
  return {
    kind: "summary_card_big",
    title,
    value: metricItem?.value ?? "n.d.",
    unit: metricItem?.unit ?? null,
    subtitle: metricItem?.subtitle ?? null,
    trendLabel: null,
    tone: "info",
    icon: "gauge",
    action: metricItem?.action ?? null,
  };
}

function metricsGrid(title: string, metrics: ChatIaVisualizationMetric[]): ChatIaBlockMetricCardGrid {
  return {
    kind: "metric_card_grid",
    title,
    metrics: metrics.length ? metrics : [metric("Dati", "n.d.", null, "Nessuna metrica disponibile")],
  };
}

function calloutBlocks(analytics: ChatIaAnalyticsResult): ChatIaBlockCallout[] {
  return analytics.callouts.map((callout) => ({
    kind: "callout",
    tone: callout.tone,
    title: callout.title,
    text: callout.text,
  }));
}

function fingerprint(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function rankingBlock(analytics: ChatIaAnalyticsResult): ChatIaOutputBlock | null {
  if (analytics.rankings.length === 0) return null;
  const maxValue = Math.max(...analytics.rankings.map((row) => row.value), 1);
  return {
    kind: "ranking_table",
    title: analytics.questionId === "D9" ? "Classifica esecutori" : "Classifica",
    valueLabel: analytics.rankings[0]?.unit ?? "valore",
    rows: analytics.rankings.slice(0, 8).map((row, index) => ({
      _id: fingerprint(row._id, `ranking:${analytics.questionId}:${index + 1}:${row.label}`),
      rank: index + 1,
      label: row.label,
      value: row.value,
      unit: row.unit ?? null,
      detail: row.detail ?? null,
      barValue: Math.round((row.value / maxValue) * 100),
      tone: index === 0 ? "ok" : index < 3 ? "info" : "neutral",
      metadata: row.metadata ?? [],
      action: row.action ?? null,
    })),
  };
}

function trendBlock(analytics: ChatIaAnalyticsResult): ChatIaOutputBlock | null {
  if (analytics.trend.length === 0) return null;
  return {
    kind: "trend_chart_line",
    title: "Trend sintetico",
    valueLabel: analytics.trend[0]?.unit ?? "valore",
    data: analytics.trend.slice(0, 8).map((row) => ({
      label: row.label,
      value: row.value,
      secondaryValue: null,
      group: row.detail ?? null,
      tone: "info",
    })),
  };
}

function barBlock(analytics: ChatIaAnalyticsResult, title = "Confronto"): ChatIaOutputBlock | null {
  const rows = analytics.comparison.length ? analytics.comparison : analytics.rankings;
  if (rows.length === 0) return null;
  return {
    kind: "bar_chart_compare",
    title,
    valueLabel: rows[0]?.unit ?? "valore",
    data: rows.slice(0, 8).map((row) => ({
      label: row.label,
      value: Number(row.value) || 0,
      secondaryValue: null,
      group: row.detail ?? null,
      tone: "info",
    })),
  };
}

function pieBlock(analytics: ChatIaAnalyticsResult): ChatIaOutputBlock | null {
  const rows = analytics.trend.length ? analytics.trend : analytics.rankings;
  if (rows.length === 0) return null;
  return {
    kind: "pie_chart",
    title: "Distribuzione",
    data: rows.slice(0, 6).map((row) => ({
      label: row.label,
      value: row.value,
      secondaryValue: null,
      group: row.detail ?? null,
      tone: "info",
    })),
  };
}

function tableBlocks(analytics: ChatIaAnalyticsResult, limit = 2): ChatIaOutputBlock[] {
  return analytics.tables.slice(0, limit).map((table) => ({
    kind: "data_table_styled",
    table: {
      ...table,
      rows: table.rows.slice(0, 10).map((row, index) => ({
        _id: fingerprint(row._id, `table:${analytics.questionId}:${table.title}:${index + 1}`),
        ...row,
      })),
      rowActions: table.rowActions?.slice(0, 10) ?? [],
      accentKey: table.columns[0]?.key ?? null,
    },
  }));
}

function timelineBlock(analytics: ChatIaAnalyticsResult): ChatIaOutputBlock | null {
  if (analytics.timeline.length === 0) return null;
  return {
    kind: "timeline",
    title: "Timeline",
    items: analytics.timeline.slice(0, 8).map((item) => ({
      _id: fingerprint(item._id, `timeline:${analytics.questionId}:${item.date}:${item.title}`),
      date: item.date,
      title: item.title,
      description: item.description ?? null,
      tone: "info",
      icon: "activity",
      metadata: item.metadata ?? [],
      action: item.action ?? null,
    })),
  };
}

function nestedListBlocks(analytics: ChatIaAnalyticsResult): ChatIaBlockNestedList[] {
  return analytics.nestedLists.map((list) => ({
    kind: "nested_list",
    title: list.title,
    groups: list.groups.map((group) => ({
      title: group.title,
      subtitle: group.subtitle ?? null,
      items: group.items.map((item) => ({
        _id: fingerprint(item._id, `nested:${analytics.questionId}:${group.title}:${item.title}`),
        title: item.title,
        subtitle: item.subtitle ?? null,
        description: item.description ?? null,
        metadata: item.metadata ?? [],
        action: item.action ?? null,
      })),
    })),
  }));
}

function splitBlock(analytics: ChatIaAnalyticsResult): ChatIaOutputBlock | null {
  const left = analytics.comparison[0] ?? analytics.metrics[0];
  const right = analytics.comparison[1] ?? analytics.metrics[1];
  if (!left || !right) return null;
  const comparisonLabel = analytics.questionId === "D5"
    ? "consumi tra autisti"
    : analytics.questionId === "D7"
      ? "km medi e tipo mezzo prevalente"
      : "indicatori principali";
  return {
    kind: "comparison_split",
    title: `Confronto: ${comparisonLabel}`,
    comparisonLabel,
    left: metricFromAnalytics(left),
    right: metricFromAnalytics(right),
    note: "Confronto calcolato sui dati letti dagli agenti specialisti.",
  };
}

function mixedLayoutBlock(analytics: ChatIaAnalyticsResult): ChatIaOutputBlock {
  return {
    kind: "mixed_layout",
    title: "Report operativo",
    sections: [
      { title: "Sintesi", text: analytics.narrative, tone: "info" },
      {
        title: "Totali",
        text: analytics.metrics.map((item) => `${item.label}: ${item.value}${item.unit ? ` ${item.unit}` : ""}`).join(" - ") || "n.d.",
        tone: "ok",
      },
      {
        title: "Azioni",
        text: analytics.callouts[0]?.text ?? "Verifica i record principali prima di aprire attivita operative.",
        tone: analytics.callouts[0]?.tone ?? "warning",
      },
    ],
  };
}

function compactBlocks(blocks: Array<ChatIaOutputBlock | null>): ChatIaOutputBlock[] {
  return blocks.filter((block): block is ChatIaOutputBlock => Boolean(block));
}

export function buildVisualizationMessage(analytics: ChatIaAnalyticsResult): ChatIaAssistantFinalMessage {
  const metrics = analytics.metrics.map(metricFromAnalytics);
  const blocksByQuestion: Record<ChatIaAnalyticsResult["questionId"], ChatIaOutputBlock[]> = {
    D1: compactBlocks([
      summaryFromMetric("Mezzo con consumo maggiore", metrics[0]),
      metricsGrid("Metriche consumo", metrics),
      rankingBlock(analytics),
      trendBlock(analytics),
      ...calloutBlocks(analytics),
    ]),
    D2: compactBlocks([
      summaryFromMetric("Ultima manutenzione", metrics[0]),
      timelineBlock(analytics),
      ...tableBlocks(analytics, 1),
      ...nestedListBlocks(analytics),
      ...calloutBlocks(analytics),
    ]),
    D3: compactBlocks([timelineBlock(analytics), ...tableBlocks(analytics, 1), ...calloutBlocks(analytics)]),
    D4: compactBlocks([...calloutBlocks(analytics), rankingBlock(analytics), ...tableBlocks(analytics, 1)]),
    D5: compactBlocks([
      metricsGrid("Consumi ultimi 4 mesi", metrics),
      splitBlock(analytics),
      rankingBlock(analytics),
      barBlock(analytics, "Comparazione autisti"),
    ]),
    D6: compactBlocks([
      summaryFromMetric("Outlier costo", metrics[0]),
      rankingBlock(analytics),
      pieBlock(analytics),
      barBlock(analytics, "Fornitori frequenti"),
      ...tableBlocks(analytics, 2),
      ...calloutBlocks(analytics),
    ]),
    D7: compactBlocks([
      summaryFromMetric("Autista top", metrics[0]),
      splitBlock(analytics),
      ...tableBlocks(analytics, 1),
      ...calloutBlocks(analytics),
    ]),
    D8: compactBlocks([
      metricsGrid("Cantieri e attrezzature", metrics),
      ...tableBlocks(analytics, 1),
      timelineBlock(analytics),
      ...calloutBlocks(analytics),
    ]),
    D9: compactBlocks([
      mixedLayoutBlock(analytics),
      barBlock(analytics, "Lavori vs manutenzioni"),
      rankingBlock(analytics),
      ...tableBlocks(analytics, 1),
    ]),
  };

  return {
    text: analytics.narrative,
    status: "completed",
    blocks: blocksByQuestion[analytics.questionId],
    entities: analytics.rankings.slice(0, 4).map((row) => ({ kind: "analytics_item", value: row.label })),
    sources: analytics.sources,
    notices: [],
  };
}
