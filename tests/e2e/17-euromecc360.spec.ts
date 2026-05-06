import { expect, test } from "@playwright/test";
import { getLastAssistantMessage, openChatToolUse, sendPrompt } from "./helpers/chatHelpers";

function assertNoTechnicalRaw(text: string): void {
  expect(text).not.toContain("sourceRecordId");
  expect(text).not.toContain("sourceField");
  expect(text).not.toContain("boundaryEntryId");
  expect(text).not.toContain("accessModeUsed");
  expect(text).not.toContain("collection_empty");
  expect(text).not.toContain("firestore_error");
}

test("Euromecc360 mostra sezioni certificate e prove collassate", async ({ page }) => {
  await openChatToolUse(page);
  await sendPrompt(page, "stato euromecc", 120000);
  const message = getLastAssistantMessage(page);

  await expect(message.locator('[data-chat-zero-view="Euromecc360"]')).toHaveCount(1, { timeout: 45000 });
  await expect(message.locator('[data-certified360-view="Euromecc360"]')).toHaveCount(1);
  await expect(message.locator(".certified360__header")).toContainText("Stato Euromecc");
  await expect(message).not.toContainText("vista non ancora coperta dal motore generico");
  expect(await message.locator(".certified360__panel").count()).toBeGreaterThan(0);

  const recordCount = await message.locator("[data-certified360-record]").count();
  const proofs = message.locator("details[data-relation-proof]");
  if (recordCount > 0) {
    expect(await proofs.count()).toBeGreaterThan(0);
    const proofCount = await proofs.count();
    for (let index = 0; index < proofCount; index += 1) {
      await expect(proofs.nth(index)).not.toHaveAttribute("open", "");
    }
  } else {
    await expect(message.locator("[data-certified360-empty]")).toContainText(
      "dato non trovato nelle fonti autorizzate",
    );
  }

  assertNoTechnicalRaw(await message.innerText());
});
