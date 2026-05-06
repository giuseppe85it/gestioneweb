import { expect, test } from "@playwright/test";
import { assertNoChatFailure, getLastResponseAsText, openChatToolUse, sendPrompt } from "./helpers/chatHelpers";
import { getRifornimentiTruthByPeriodo } from "./helpers/firestoreHelpers";

function expectQualifiedTruncationNotice(text: string): void {
  if (!/mostrat[oi].*prim[ei]|primi\s+\d+/i.test(text)) return;
  expect(text).toMatch(/\bdi\s+\d+\b|total[ei]/i);
}

test.describe("Chat IA - coerenza aggregati e dettagli", () => {
  test("rifornimenti: aggregato e dettaglio usano lo stesso conteggio canonico", async ({ page }) => {
    const truth = await getRifornimentiTruthByPeriodo("01/04/2026", "30/04/2026");
    const secondRankedPlate = truth.ranking.find((row) => row.targa !== truth.topPlate)?.targa;

    expect(truth.total).toBeGreaterThan(0);
    expect(truth.topPlate).not.toBe("");
    expect(truth.topCount).toBeGreaterThan(0);

    await openChatToolUse(page);
    await sendPrompt(page, "chi ha fatto piu rifornimenti aprile 2026?", 120000);
    const aggregate = await getLastResponseAsText(page);
    assertNoChatFailure(aggregate);
    expect(aggregate).toContain(truth.topPlate);
    expect(aggregate).toContain(String(truth.topCount));
    const topPlateIndex = aggregate.indexOf(truth.topPlate);
    expect(topPlateIndex).toBeGreaterThanOrEqual(0);
    if (secondRankedPlate) {
      const secondPlateIndex = aggregate.indexOf(secondRankedPlate);
      if (secondPlateIndex >= 0) {
        expect(topPlateIndex).toBeLessThan(secondPlateIndex);
      }
    }

    await sendPrompt(page, `mostrami il dettaglio dei rifornimenti di ${truth.topPlate} aprile 2026`, 120000);
    const detail = await getLastResponseAsText(page);
    assertNoChatFailure(detail);
    expect(detail).toContain(truth.topPlate);
    expect(detail).toContain(String(truth.topCount));
    expectQualifiedTruncationNotice(detail);
  });

  test("liste operative troncate dichiarano sempre totale reale e righe mostrate", async ({ page }) => {
    await openChatToolUse(page);
    const prompts = [
      "manutenzioni effettuate aprile 2026",
      "lavori aperti su tutta la flotta",
      "lista inventario magazzino",
    ];

    for (const prompt of prompts) {
      await sendPrompt(page, prompt, 120000);
      const text = await getLastResponseAsText(page);
      assertNoChatFailure(text);
      expectQualifiedTruncationNotice(text);
    }
  });
});
