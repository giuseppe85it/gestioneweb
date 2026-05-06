import { expect, test, type Locator } from "@playwright/test";
import { getLastAssistantMessage, openChatToolUse, sendPrompt } from "./helpers/chatHelpers";
import {
  getRifornimentiByTarga,
  normalizePlate,
  readStorageDataset,
} from "./helpers/firestoreHelpers";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function findVehicleWithRelation(): Promise<string> {
  const vehicles = await readStorageDataset("@mezzi_aziendali");
  const vehicle = vehicles.find((entry) => normalizePlate(entry.targa) && text(entry.autistaId));
  return normalizePlate(vehicle?.targa);
}

async function findVehicleWithRefueling(): Promise<string> {
  const vehicles = await readStorageDataset("@mezzi_aziendali");
  for (const vehicle of vehicles) {
    const plate = normalizePlate(vehicle.targa);
    if (!plate) continue;
    const refuelings = await getRifornimentiByTarga(plate);
    if (refuelings.length) return plate;
  }
  return "";
}

function assertNoMainCardLeak(textContent: string): void {
  expect(textContent).not.toContain("sourceRecordId");
  expect(textContent).not.toContain("sourceField");
  expect(textContent).not.toContain("boundaryEntryId");
  expect(textContent).not.toContain("accessModeUsed");
  expect(textContent).not.toMatch(/https:\/\/firebasestorage|downloadUrl|fileUrl|pdfUrl/i);
}

async function assertCollapsedProofPanel(message: Locator): Promise<void> {
  const panels = message.locator("[data-proof-panel]");
  expect(await panels.count()).toBeGreaterThan(0);
  const details = message.locator("details[data-relation-proof]");
  expect(await details.count()).toBeGreaterThan(0);
  for (let index = 0; index < await details.count(); index += 1) {
    await expect(details.nth(index)).not.toHaveAttribute("open", "");
  }
}

async function assertOpenedProofIsClean(message: Locator): Promise<void> {
  const detail = message.locator("details[data-relation-proof]").first();
  await detail.click();
  await expect(detail).toContainText(/Provenienza|Relazione/);
  expect(await detail.innerText()).not.toMatch(/note|telefono|url/i);
}

test.beforeEach(async ({ page }) => {
  await openChatToolUse(page);
});

test("mezzo runtime mostra relazione certificata con relationProof", async ({ page }) => {
  const plate = await findVehicleWithRelation();
  test.skip(!plate, "Nessun mezzo runtime con relazione certificabile nel dataset autorizzato.");

  await sendPrompt(page, `mezzo ${plate}`, 120000);
  const message = getLastAssistantMessage(page);

  await expect(message.locator('[data-chat-zero-view="Vehicle360"]')).toHaveCount(1, { timeout: 45000 });
  await expect(message.locator('[data-certified360-view="Vehicle360"]')).toHaveCount(1);
  await expect(message).toContainText("Relazioni certificate");
  await assertCollapsedProofPanel(message);
  assertNoMainCardLeak(await message.innerText());
  await assertOpenedProofIsClean(message);
});

test("rifornimenti runtime mostra sezione rifornimenti e relazione mezzo certificata", async ({ page }) => {
  const plate = await findVehicleWithRefueling();
  test.skip(!plate, "Nessun mezzo runtime con rifornimenti nel dataset autorizzato.");

  await sendPrompt(page, `rifornimenti ${plate}`, 120000);
  const message = getLastAssistantMessage(page);

  await expect(message.locator('[data-chat-zero-view="Vehicle360"]')).toHaveCount(1, { timeout: 45000 });
  await expect(message.locator('[data-certified360-view="Vehicle360"]')).toHaveCount(1);
  await expect(message.locator(".certified360__panel")).toContainText(/Rifornimenti|Anagrafica mezzo/);
  await assertCollapsedProofPanel(message);
  assertNoMainCardLeak(await message.innerText());
  await assertOpenedProofIsClean(message);
});
