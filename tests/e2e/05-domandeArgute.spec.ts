import { expect, test } from "@playwright/test";
import {
  assertContainsAny,
  assertNoChatFailure,
  getLastAssistantMessage,
  getLastResponseAsText,
  openChatToolUse,
  sendPrompt,
} from "./helpers/chatHelpers";

const cases: Array<{
  id: string;
  prompt: string;
  expectedText: Array<string | RegExp>;
  expectedBlocks: string[];
}> = [
  {
    id: "D1",
    prompt: "Dimmi che mezzo ha consumato di piu negli ultimi 2 mesi e fammi la media al km/lt e mettila in ordine decrescente",
    expectedText: ["mezzo", "litri", "Autista", "Categoria", "Rifornimenti", "Apri dossier"],
    expectedBlocks: [".chat-ia-viz-summary-card-big", ".chat-ia-viz-ranking-table", ".chat-ia-viz-trend-chart-line"],
  },
  {
    id: "D2",
    prompt: "Controlla l'ultima manutenzione di questo mese e controlla se e stata fatta una manutenzione analoga prima",
    expectedText: ["manutenzione", "Manutenzioni analoghe", "Descrizione", "Fornitore", "Apri manutenzione"],
    expectedBlocks: [".chat-ia-viz-summary-card-big", ".chat-ia-viz-timeline", ".chat-ia-viz-nested-list"],
  },
  {
    id: "D3",
    prompt: "Controlla i log di accesso e mettili in ordine di data",
    expectedText: ["eventi", "data", "Autore", "Descrizione", "Apri"],
    expectedBlocks: [".chat-ia-viz-timeline", ".chat-ia-viz-data-table-styled"],
  },
  {
    id: "D4",
    prompt: "Controlla le segnalazioni e dimmi se c'e qualche anomalia",
    expectedText: ["segnalazioni", "anomalia", "Descrizione", "Autore", "Stato"],
    expectedBlocks: [".chat-ia-viz-callout", ".chat-ia-viz-data-table-styled"],
  },
  {
    id: "D5",
    prompt: "Controlla i rifornimenti degli ultimi 4 mesi e dimmi chi ha consumato di piu, e poi fai un comparazione di autisti per capire chi ha consumato di piu",
    expectedText: ["litri", "autisti", "Confronto: consumi tra autisti", "Categoria", "Apri dossier"],
    expectedBlocks: [".chat-ia-viz-metric-card-grid", ".chat-ia-viz-bar-chart-compare", ".chat-ia-viz-ranking-table"],
  },
  {
    id: "D6",
    prompt: "Trova mezzi della stessa categoria che hanno costi totali molto diversi tra loro e dimmi chi e il fornitore piu frequente di quelli piu costosi",
    expectedText: ["costo", "fornitori", "Fatture e documenti principali", "Numero", "Importo", "Fornitore"],
    expectedBlocks: [".chat-ia-viz-summary-card-big", ".chat-ia-viz-ranking-table", ".chat-ia-viz-pie-chart", ".chat-ia-viz-data-table-styled"],
  },
  {
    id: "D7",
    prompt: "Quale autista percorre piu km al mese in media e che tipo di mezzo guida prevalentemente?",
    expectedText: ["autista", "km", "Confronto: km medi e tipo mezzo prevalente", "Categoria"],
    expectedBlocks: [".chat-ia-viz-summary-card-big", ".chat-ia-viz-comparison-split"],
  },
  {
    id: "D8",
    prompt: "Per ogni cantiere dimmi quante attrezzature ci sono e quali mezzi sono stati assegnati li negli ultimi 30 giorni",
    expectedText: ["attrezzature", "cantiere", "Mezzi assegnati", "Apri cantiere"],
    expectedBlocks: [".chat-ia-viz-metric-card-grid", ".chat-ia-viz-data-table-styled"],
  },
  {
    id: "D9",
    prompt: "Controlla in lavori o in manutenzioni chi lo ha eseguito negli ultimi mese e prepara un report",
    expectedText: ["lavori", "manutenzioni", "Descrizione", "Referente", "Apri"],
    expectedBlocks: [".chat-ia-viz-mixed-layout", ".chat-ia-viz-bar-chart-compare", ".chat-ia-viz-ranking-table"],
  },
];

const forbiddenLeakage = [
  /test e2e/i,
  /verit[àa] di base/i,
  /mezzi principali disponibili/i,
  /ambiente di sviluppo/i,
  /@\w+/i,
];

test.beforeEach(async ({ page }) => {
  await openChatToolUse(page);
});

for (const item of cases) {
  test(`domanda arguta ${item.id}`, async ({ page }) => {
    const metric = await sendPrompt(page, item.prompt, 60000);
    expect(metric.durationMs).toBeLessThan(30000);
    const text = await getLastResponseAsText(page);
    assertNoChatFailure(text);
    assertContainsAny(text, item.expectedText);
    for (const forbidden of forbiddenLeakage) {
      expect(text, `${item.id} non deve contenere leakage tecnico`).not.toMatch(forbidden);
    }
    const message = getLastAssistantMessage(page);
    for (const selector of item.expectedBlocks) {
      await expect(message.locator(selector).first(), `${item.id} deve renderizzare ${selector}`).toBeVisible({ timeout: 15000 });
    }
    expect(text).not.toMatch(/\|.*\|/);
  });
}
