import { expect, test } from "@playwright/test";
import { getLastAssistantMessage, openChatToolUse, sendPrompt } from "./helpers/chatHelpers";

test.beforeEach(async ({ page }) => {
  await openChatToolUse(page);
});

test("renderizza blocchi ranking, summary e trend", async ({ page }) => {
  await sendPrompt(page, "Dimmi che mezzo ha consumato di piu negli ultimi 2 mesi e fammi la media al km/lt e mettila in ordine decrescente", 60000);
  const message = getLastAssistantMessage(page);
  await expect(message.locator(".chat-ia-viz-summary-card-big")).toBeVisible();
  await expect(message.locator(".chat-ia-viz-ranking-table")).toBeVisible();
  await expect(message.locator(".chat-ia-viz-trend-chart-line svg")).toBeVisible();
});

test("renderizza confronto, metriche e grafico barre", async ({ page }) => {
  await sendPrompt(page, "Controlla i rifornimenti degli ultimi 4 mesi e dimmi chi ha consumato di piu, e poi fai un comparazione di autisti per capire chi ha consumato di piu", 60000);
  const message = getLastAssistantMessage(page);
  await expect(message.locator(".chat-ia-viz-metric-card-grid")).toBeVisible();
  await expect(message.locator(".chat-ia-viz-comparison-split")).toBeVisible();
  await expect(message.locator(".chat-ia-viz-bar-chart-compare svg")).toBeVisible();
});

test("renderizza pie chart e callout anomalie economiche", async ({ page }) => {
  await sendPrompt(page, "Trova mezzi della stessa categoria che hanno costi totali molto diversi tra loro e dimmi chi e il fornitore piu frequente di quelli piu costosi", 60000);
  const message = getLastAssistantMessage(page);
  await expect(message.locator(".chat-ia-viz-pie-chart svg")).toBeVisible();
  await expect(message.locator(".chat-ia-viz-callout")).toBeVisible();
});

test("renderizza tabella stilizzata, timeline e layout misto", async ({ page }) => {
  await sendPrompt(page, "Controlla in lavori o in manutenzioni chi lo ha eseguito negli ultimi mese e prepara un report", 60000);
  const message = getLastAssistantMessage(page);
  await expect(message.locator(".chat-ia-viz-mixed-layout")).toBeVisible();
  await expect(message.locator(".chat-ia-viz-data-table-styled")).toBeVisible();
  await expect(message.locator(".chat-ia-viz-bar-chart-compare")).toBeVisible();
});
