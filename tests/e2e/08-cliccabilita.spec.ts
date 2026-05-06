import { expect, test } from "@playwright/test";
import { getLastAssistantMessage, openChatToolUse, sendPrompt } from "./helpers/chatHelpers";

test.beforeEach(async ({ page }) => {
  await openChatToolUse(page);
});

test("D1 rende cliccabili i mezzi verso il dossier", async ({ page }) => {
  await sendPrompt(page, "Dimmi che mezzo ha consumato di piu negli ultimi 2 mesi e fammi la media al km/lt e mettila in ordine decrescente", 60000);
  const link = getLastAssistantMessage(page).getByRole("link", { name: /Apri dossier/i }).first();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/next\/dossier\/[A-Z0-9]+/);
});

test("D2 rende cliccabili le manutenzioni verso il modulo manutenzioni", async ({ page }) => {
  await sendPrompt(page, "Controlla l'ultima manutenzione di questo mese e controlla se e stata fatta una manutenzione analoga prima", 60000);
  const link = getLastAssistantMessage(page).getByRole("link", { name: /Apri manutenzione/i }).first();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/next\/manutenzioni/);
});

test("D5 rende cliccabili gli autisti verso anagrafiche colleghi", async ({ page }) => {
  await sendPrompt(page, "Controlla i rifornimenti degli ultimi 4 mesi e dimmi chi ha consumato di piu, e poi fai un comparazione di autisti per capire chi ha consumato di piu", 60000);
  const link = getLastAssistantMessage(page).getByRole("link", { name: /Apri collega/i }).first();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/next\/anagrafiche\?tab=colleghi/);
});

test("D6 rende cliccabili i documenti o il dossier mezzo collegato", async ({ page }) => {
  await sendPrompt(page, "Trova mezzi della stessa categoria che hanno costi totali molto diversi tra loro e dimmi chi e il fornitore piu frequente di quelli piu costosi", 60000);
  const link = getLastAssistantMessage(page).getByRole("link", { name: /Apri documento|Apri dossier/i }).first();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/next\/(dossier\/[A-Z0-9]+|ia\/documenti)/);
});

test("D8 rende cliccabili i cantieri verso attrezzature cantieri", async ({ page }) => {
  await sendPrompt(page, "Per ogni cantiere dimmi quante attrezzature ci sono e quali mezzi sono stati assegnati li negli ultimi 30 giorni", 60000);
  const link = getLastAssistantMessage(page).getByRole("link", { name: /Apri cantiere/i }).first();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/next\/attrezzature-cantieri/);
});
