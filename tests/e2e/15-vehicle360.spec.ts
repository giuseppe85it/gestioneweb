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
}

test.beforeEach(async ({ page }) => {
  await openNextChat(page);
});

test.skip("apre Vehicle360 con targa runtime anonimizzata", async () => {
  test.skip(
    true,
    "DEFERRED: helper Node lato test con Firebase Admin non presente; policy Playwright vieta targhe reali hardcoded.",
  );
});

test("Vehicle360 no match usa no_results e CertifiedView", async ({ page }) => {
  await sendPrompt(page, "apri vista mezzo ZZ000000", 120000);
  const message = getLastAssistantMessage(page);

  await expect(message.locator('[data-chat-zero-view="Vehicle360"]')).toHaveCount(1, { timeout: 45000 });
  await expect(message.locator(".chat-ia-accompaniment")).toContainText("Nessun risultato disponibile");
  await expect(message.locator('[data-certified360-view="Vehicle360"]')).toHaveCount(1);
  await expect(message.locator("[data-certified360-empty]")).toContainText(
    "dato non trovato nelle fonti autorizzate",
  );
  await expect(message.locator('[data-certified360-view="Site360"]')).toHaveCount(0);
  await expect(message.locator("details[data-relation-proof]")).toHaveCount(0);

  const text = await message.innerText();
  expect(text).not.toContain("Vista richiesta non ancora disponibile");
  assertNoTechnicalRaw(text);
});
