import { expect, test } from "@playwright/test";
import { getLastAssistantMessage, openChatToolUse, sendPrompt } from "./helpers/chatHelpers";

test.beforeEach(async ({ page }) => {
  await openChatToolUse(page);
});

test("profilo autista Sandro Calabrese: nessun dato business in testo libero LLM", async ({ page }) => {
  await sendPrompt(page, "profilo autista Sandro Calabrese", 90000);
  const message = getLastAssistantMessage(page);
  const text = await message.innerText();

  await expect(message.locator(".chat-ia-message-text")).toHaveCount(0);
  await expect(message.locator("[data-chat-zero-action]")).toHaveCount(1);
  expect(text).not.toContain("TI313387");
  expect(text).not.toContain("TI113387");
  if (text.includes("TI282780")) {
    await expect(message.locator("[data-relation-proof]")).toContainText("sourceCollection");
  }
});

test("rifornimenti di oggi: nessuna data o targa generata nel testo assistente", async ({ page }) => {
  await sendPrompt(page, "mostrami i rifornimenti di oggi", 90000);
  const message = getLastAssistantMessage(page);
  const text = await message.innerText();

  await expect(message.locator(".chat-ia-message-text")).toHaveCount(0);
  await expect(message.locator("[data-chat-zero-action]")).toHaveCount(1);
  expect(text).not.toMatch(/\bTI\d{6}\b/);
  expect(text).not.toMatch(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/);
});
