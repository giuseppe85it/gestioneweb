import { expect, test, type Page } from "@playwright/test";
import {
  getLastAssistantMessage,
  installInternalAiBackendProxy,
  sendPrompt,
} from "./helpers/chatHelpers";

async function openNextChat(page: Page): Promise<void> {
  await installInternalAiBackendProxy(page);
  await page.goto("/next/chat", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Chat IA NEXT" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByLabel("Messaggio Chat IA NEXT")).toBeVisible({ timeout: 30000 });
}

function assertNoTechnicalRaw(text: string): void {
  expect(text).not.toContain("sourceRecordId");
  expect(text).not.toContain("sourceField");
  expect(text).not.toContain("boundaryEntryId");
  expect(text).not.toContain("accessModeUsed");
  expect(text).not.toContain("collection_empty");
  expect(text).not.toContain("error_view_unavailable");
}

test.beforeEach(async ({ page }) => {
  await openNextChat(page);
});

test("Site360 sintetico mostra struttura configurata senza grezzo tecnico", async ({ page }) => {
  await sendPrompt(page, "apri cantiere ZZZ_DIAG_SITE", 120000);
  const message = getLastAssistantMessage(page);

  await expect(message.locator('[data-chat-zero-view="Site360"]')).toHaveCount(1, { timeout: 45000 });
  await expect(message.locator('[data-certified360-view="Site360"]')).toHaveCount(1);
  await expect(message.locator(".certified360__header")).toContainText("Profilo cantiere");
  await expect(message.locator("[data-certified360-empty]")).toContainText(
    "vista non ancora coperta dal motore generico",
  );
  await expect(message.locator("details[data-relation-proof]")).toHaveCount(0);

  assertNoTechnicalRaw(await message.innerText());
});

test("Ricerca360 con input fittizio usa no_results senza grezzo tecnico", async ({ page }) => {
  await sendPrompt(page, "ricerca generica ZZZ123456", 120000);
  const message = getLastAssistantMessage(page);

  await expect(message.locator('[data-chat-zero-view="Ricerca360"]')).toHaveCount(1, { timeout: 45000 });
  await expect(message.locator(".chat-ia-accompaniment")).toContainText("Nessun risultato disponibile");
  await expect(message.locator('[data-certified360-view="Ricerca360"]')).toHaveCount(1);
  await expect(message.locator("[data-certified360-empty]")).toContainText(
    "vista non ancora coperta dal motore generico",
  );

  assertNoTechnicalRaw(await message.innerText());
});
