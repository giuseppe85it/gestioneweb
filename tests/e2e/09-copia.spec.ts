import { expect, test } from "@playwright/test";
import { getLastAssistantMessage, openChatToolUse, sendPrompt } from "./helpers/chatHelpers";

test.beforeEach(async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://localhost:5173" });
  await openChatToolUse(page);
});

test("ogni messaggio assistente espone copia e scrive testo leggibile negli appunti", async ({ page }) => {
  await sendPrompt(page, "Dimmi che mezzo ha consumato di piu negli ultimi 2 mesi e fammi la media al km/lt e mettila in ordine decrescente", 60000);
  const message = getLastAssistantMessage(page);
  const copyButton = message.getByRole("button", { name: "Copia" });
  await expect(copyButton).toBeVisible();
  await copyButton.click();
  await expect(message.getByRole("button", { name: "Copiato" })).toBeVisible();
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toContain("Mezzo");
  expect(clipboardText).toContain("Classifica");
  expect(clipboardText.length).toBeGreaterThan(80);
});
