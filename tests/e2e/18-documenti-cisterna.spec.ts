import { expect, test, type Locator } from "@playwright/test";
import { getLastAssistantMessage, openChatToolUse, sendPrompt } from "./helpers/chatHelpers";
import { getFattureByTarga, normalizePlate, readStorageDataset } from "./helpers/firestoreHelpers";

function assertNoTechnicalRaw(text: string): void {
  expect(text).not.toContain("sourceRecordId");
  expect(text).not.toContain("sourceField");
  expect(text).not.toContain("boundaryEntryId");
  expect(text).not.toContain("accessModeUsed");
  expect(text).not.toContain("collection_empty");
  expect(text).not.toContain("firestore_error");
  expect(text).not.toContain("downloadUrl");
  expect(text).not.toContain("fileUrl");
  expect(text).not.toContain("pdfUrl");
  expect(text).not.toContain("https://firebasestorage");
}

async function assertProofsCollapsed(messageTextRoot: Locator): Promise<void> {
  const proofs = messageTextRoot.locator("details[data-relation-proof]");
  const proofCount = await proofs.count();
  for (let index = 0; index < proofCount; index += 1) {
    await expect(proofs.nth(index)).not.toHaveAttribute("open", "");
  }
}

test.beforeEach(async ({ page }) => {
  await openChatToolUse(page);
});

test("documenti mezzo runtime non espone URL o grezzo tecnico", async ({ page }) => {
  const vehicles = await readStorageDataset("@mezzi_aziendali");
  const plate =
    vehicles
      .map((entry) => normalizePlate(entry.targa))
      .find((candidate) => candidate && /^[A-Z]{2}\d{6}$/.test(candidate) && candidate.length > 0) ?? "";
  test.skip(!plate, "Nessuna targa runtime disponibile nel dataset autorizzato.");

  await getFattureByTarga(plate);
  await sendPrompt(page, `documenti mezzo ${plate}`, 120000);
  const message = getLastAssistantMessage(page);

  await expect(message.locator('[data-chat-zero-view="Vehicle360"]')).toHaveCount(1, { timeout: 45000 });
  await expect(message.locator('[data-certified360-view="Vehicle360"]')).toHaveCount(1);
  await expect(message.locator(".certified360__header")).toContainText("Profilo mezzo");

  await assertProofsCollapsed(message);
  assertNoTechnicalRaw(await message.innerText());
});

test("schede cisterna mostra sezione certificata o no_results pulito", async ({ page }) => {
  await sendPrompt(page, "schede cisterna", 120000);
  const message = getLastAssistantMessage(page);

  const certifiedViews = message.locator("[data-certified360-view]");
  expect(await certifiedViews.count()).toBeGreaterThan(0);
  await expect(message).not.toContainText("vista non ancora coperta dal motore generico");

  const recordCount = await message.locator("[data-certified360-record]").count();
  if (recordCount === 0) {
    await expect(message.locator("[data-certified360-empty], .chat-ia-accompaniment").first()).toContainText(
      /dato non trovato nelle fonti autorizzate|Nessun risultato disponibile/,
    );
  }

  await assertProofsCollapsed(message);
  assertNoTechnicalRaw(await message.innerText());
});
