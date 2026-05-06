import { test } from "@playwright/test";
import { askAndExpect, assertContainsAny, assertNoChatFailure, getLastResponseAsText, openChatToolUse, sendPrompt } from "./helpers/chatHelpers";

test.beforeEach(async ({ page }) => {
  await openChatToolUse(page);
});

test("verita base 01 - ricerca telaio TI282780", async ({ page }) => {
  await askAndExpect(page, "trova mezzo con telaio n zA9 s35 a48 bah 028 00", [
    "TI282780",
    /O\.?ME\.?P\.?S/i,
    "CM35",
    "09/04/2027",
  ]);
});

test("verita base 02 - targa TI282780 dati principali", async ({ page }) => {
  await askAndExpect(page, "scheda mezzo TI282780 con autista e revisione", [
    "TI282780",
    "SANDRO CALABRESE",
    "09/04/2027",
  ]);
});

test("verita base 03 - categoria e anno TI282780", async ({ page }) => {
  await askAndExpect(page, "che categoria, anno, marca e modello ha TI282780?", [
    "semirimorchio",
    "2022",
    "CM35",
  ]);
});

test("verita base 04 - fattura Sciurba TI113417", async ({ page }) => {
  await askAndExpect(page, "ricerca tutte le fatture manutenzioni per ti113417", [
    "TI113417",
    /Sciurba|Autotruck/i,
    /1641[,.]28|1\.641[,.]28/i,
    "31/03/2026",
  ]);
});

test("verita base 05 - fattura numero 81", async ({ page }) => {
  await askAndExpect(page, "trova fattura numero 81 officina Sciurba", [
    "81",
    /Sciurba|Autotruck/i,
  ]);
});

test("verita base 06 - cantiere GTL Palazzetto", async ({ page }) => {
  await sendPrompt(page, "attrezzature del cantiere GTL PALAZZETTO LUGANO");
  const text = await getLastResponseAsText(page);
  assertNoChatFailure(text);
  assertContainsAny(text, ["GTL", "PALAZZETTO", "LUGANO", "attrezzature"]);
});

test("verita base 07 - TI233827 rifornimenti presenti", async ({ page }) => {
  await sendPrompt(page, "rifornimenti del mezzo TI233827");
  const text = await getLastResponseAsText(page);
  assertNoChatFailure(text);
  assertContainsAny(text, ["TI233827", "rifornimenti", "litri"]);
});

test("verita base 08 - TI298409 rifornimenti presenti", async ({ page }) => {
  await sendPrompt(page, "rifornimenti del mezzo TI298409");
  const text = await getLastResponseAsText(page);
  assertNoChatFailure(text);
  assertContainsAny(text, ["TI298409", "rifornimenti", "litri"]);
});

test("verita base 09 - manutenzioni aprile 2026 senza timeout", async ({ page }) => {
  await sendPrompt(page, "manutenzioni effettuate il mese di aprile?");
  const text = await getLastResponseAsText(page);
  assertNoChatFailure(text);
  assertContainsAny(text, ["manutenzioni", "aprile", "2026", "effettuate"]);
});

test("verita base 10 - date italiane non invertite", async ({ page }) => {
  await askAndExpect(page, "trova mezzo TI282780 e mostrami la scadenza revisione", [
    "TI282780",
    "09/04/2027",
  ]);
});
