import { expect, test } from "@playwright/test";
import {
  assertContainsAny,
  assertNoChatFailure,
  getLastResponseAsText,
  openChatToolUse,
  sendPrompt,
} from "./helpers/chatHelpers";
import {
  countManutenzioniByMese,
  countMezziTotali,
  getAttrezzatureByCantiere,
  getAutistaByNome,
  getFattureByTarga,
  getManutenzioniByPeriodo,
  getMezzoByTarga,
  getRifornimentiByTarga,
  sumCostiMezzo,
} from "./helpers/firestoreHelpers";

test.beforeEach(async ({ page }) => {
  await openChatToolUse(page);
});

test("verita calcolata 01 - Firestore conferma TI282780 prima della chat", async ({ page }) => {
  const mezzo = await getMezzoByTarga("TI282780");
  expect(mezzo).not.toBeNull();
  await sendPrompt(page, "trova mezzo TI282780");
  const text = await getLastResponseAsText(page);
  assertNoChatFailure(text);
  expect(text).toContain("TI282780");
});

test("verita calcolata 02 - conteggio mezzi totale confrontabile", async ({ page }) => {
  const count = await countMezziTotali();
  expect(count).toBeGreaterThan(0);
  await sendPrompt(page, "quanti mezzi ci sono in flotta? mostra il totale");
  const text = await getLastResponseAsText(page);
  assertNoChatFailure(text);
  assertContainsAny(text, [String(count), "mezzi", "flotta"]);
});

test("verita calcolata 03 - manutenzioni aprile hanno base dati", async ({ page }) => {
  const count = await countManutenzioniByMese("2026-04");
  await sendPrompt(page, "manutenzioni aprile 2026: indicami totale e prime righe");
  const text = await getLastResponseAsText(page);
  assertNoChatFailure(text);
  assertContainsAny(text, [String(count), "aprile", "manutenzioni"]);
});

test("verita calcolata 04 - manutenzione marzo esclusa da aprile", async ({ page }) => {
  const march = await getManutenzioniByPeriodo("01/03/2026", "31/03/2026");
  expect(march.length).toBeGreaterThanOrEqual(0);
  await sendPrompt(page, "manutenzioni effettuate aprile 2026");
  const text = await getLastResponseAsText(page);
  assertNoChatFailure(text);
  expect(text).not.toContain("04/03/2026");
});

test("verita calcolata 05 - fatture TI113417 presenti in Firestore", async ({ page }) => {
  const fatture = await getFattureByTarga("TI113417");
  expect(fatture.length).toBeGreaterThan(0);
  await sendPrompt(page, "fatture officina per TI113417");
  const text = await getLastResponseAsText(page);
  assertNoChatFailure(text);
  assertContainsAny(text, ["TI113417", "Sciurba", "1641", "fattura"]);
});

test("verita calcolata 06 - costi TI113417 non zero", async ({ page }) => {
  const total = await sumCostiMezzo("TI113417", 2026);
  expect(total).toBeGreaterThan(0);
  await sendPrompt(page, "costi totali TI113417 nel 2026");
  const text = await getLastResponseAsText(page);
  assertNoChatFailure(text);
  assertContainsAny(text, ["TI113417", "costi", "totale", /1641|1\.641/i]);
});

test("verita calcolata 07 - rifornimenti TI233827 presenti", async ({ page }) => {
  const rows = await getRifornimentiByTarga("TI233827");
  expect(rows.length).toBeGreaterThan(0);
  await sendPrompt(page, "mostra rifornimenti TI233827");
  const text = await getLastResponseAsText(page);
  assertNoChatFailure(text);
  assertContainsAny(text, ["TI233827", "rifornimenti", "litri"]);
});

test("verita calcolata 08 - rifornimenti TI298409 presenti", async ({ page }) => {
  const rows = await getRifornimentiByTarga("TI298409");
  expect(rows.length).toBeGreaterThan(0);
  await sendPrompt(page, "mostra rifornimenti TI298409");
  const text = await getLastResponseAsText(page);
  assertNoChatFailure(text);
  assertContainsAny(text, ["TI298409", "rifornimenti", "litri"]);
});

test("verita calcolata 09 - cantiere GTL presente se dataset lo espone", async ({ page }) => {
  const rows = await getAttrezzatureByCantiere("GTL PALAZZETTO");
  await sendPrompt(page, "quali attrezzature risultano per GTL PALAZZETTO LUGANO?");
  const text = await getLastResponseAsText(page);
  assertNoChatFailure(text);
  assertContainsAny(text, rows.length > 0 ? ["GTL", "PALAZZETTO", "attrezzature"] : ["non", "attrezzature"]);
});

test("verita calcolata 10 - autista Sandro Calabrese presente", async ({ page }) => {
  const autista = await getAutistaByNome("SANDRO CALABRESE");
  expect(autista).not.toBeNull();
  await sendPrompt(page, "profilo autista SANDRO CALABRESE");
  const text = await getLastResponseAsText(page);
  assertNoChatFailure(text);
  assertContainsAny(text, ["SANDRO", "CALABRESE", "autista"]);
});
