import { expect, test } from "@playwright/test";
import { getLastAssistantMessage, openChatToolUse, sendPrompt } from "./helpers/chatHelpers";
import { normalizePlate, readStorageDataset, type RawRecord } from "./helpers/firestoreHelpers";

function isStrictRuntimePlate(value: string): boolean {
  return /^[A-Z]{2}\d{6}$/.test(value);
}

async function runtimeVehiclePlateAfterFirstRecord(): Promise<string> {
  const vehicles = await readStorageDataset("@mezzi_aziendali");
  return (
    vehicles
      .map((entry: RawRecord, index) => ({ index, plate: normalizePlate(entry.targa) }))
      .find((entry) => entry.index > 0 && isStrictRuntimePlate(entry.plate))?.plate ?? ""
  );
}

test.beforeEach(async ({ page }) => {
  await openChatToolUse(page);
});

test("lookup targa Vehicle360 non dipende dal primo record del dataset", async ({ page }) => {
  const plate = await runtimeVehiclePlateAfterFirstRecord();
  test.skip(!plate, "Dataset runtime senza targa valida dopo il primo record autorizzato.");

  await sendPrompt(page, plate, 120000);
  const message = getLastAssistantMessage(page);
  const view = message.locator('[data-certified360-view="Vehicle360"]');

  await expect(view).toHaveCount(1, { timeout: 45000 });
  await expect(view.locator("[data-certified360-record]").first()).toContainText(plate, { timeout: 45000 });
  await expect(view).not.toContainText("dato non trovato nelle fonti autorizzate");
  await expect(message.locator('[data-chat-zero-view="none"]')).toHaveCount(0);
  expect(await message.innerText()).not.toMatch(/sourceRecordId|sourceField|https:\/\/firebasestorage|firebasestorage/i);
});
