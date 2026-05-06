import { expect, test, type Locator, type Page } from "@playwright/test";
import { getLastAssistantMessage, openChatToolUse, sendPrompt } from "./helpers/chatHelpers";
import { normalizePlate, readStorageDataset, type RawRecord } from "./helpers/firestoreHelpers";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getRuntimePlate(records: RawRecord[]): string {
  return (
    records
      .map((entry) => normalizePlate(entry.targa))
      .find((plate) => /^[A-Z]{2}\d{6}$/.test(plate)) ?? ""
  );
}

async function getRuntimeDriverNameWithRelation(): Promise<string> {
  const [drivers, vehicles] = await Promise.all([
    readStorageDataset("@colleghi"),
    readStorageDataset("@mezzi_aziendali"),
  ]);
  const driverIdsWithVehicle = new Set(
    vehicles
      .filter((entry) => normalizePlate(entry.targa) && text(entry.autistaId))
      .map((entry) => text(entry.autistaId)),
  );
  const driver = drivers.find((entry) => driverIdsWithVehicle.has(text(entry.id)) && text(entry.nome));
  return text(driver?.nome);
}

async function getRuntimePlateWithRelation(): Promise<string> {
  const vehicles = await readStorageDataset("@mezzi_aziendali");
  const vehicle = vehicles.find((entry) => normalizePlate(entry.targa) && text(entry.autistaId));
  return normalizePlate(vehicle?.targa);
}

async function waitForDriver360Ready(message: Locator): Promise<void> {
  await expect(message.locator("[data-driver360]")).toHaveCount(1, { timeout: 45000 });
  await expect(message).not.toContainText("Caricamento profilo autista", { timeout: 45000 });
}

async function assertProofDefaultState(message: Locator, options: { required: boolean }): Promise<boolean> {
  const panels = message.locator("[data-proof-panel]");
  if (!options.required && (await panels.count()) === 0) {
    return false;
  }
  expect(await panels.count()).toBeGreaterThan(0);
  const details = message.locator("details[data-relation-proof]");
  expect(await details.count()).toBeGreaterThan(0);
  for (let index = 0; index < await details.count(); index += 1) {
    await expect(details.nth(index)).not.toHaveAttribute("open", "");
  }
  return true;
}

async function assertProofContent(message: Locator): Promise<void> {
  const first = message.locator("details[data-relation-proof]").first();
  await first.click();
  await expect(first).toContainText(/Provenienza|Relazione/);
  expect(await first.innerText()).not.toMatch(/note|telefono|url/i);
}

async function askAndAssertProof(
  page: Page,
  prompt: string,
  viewSelector: string,
  options: { requireProof: boolean; waitForDriver?: boolean } = { requireProof: true },
): Promise<void> {
  await sendPrompt(page, prompt, 120000);
  const message = getLastAssistantMessage(page);
  await expect(message.locator(viewSelector)).toHaveCount(1, { timeout: 45000 });
  if (options.waitForDriver) {
    await waitForDriver360Ready(message);
  }
  const hasProof = await assertProofDefaultState(message, { required: options.requireProof });
  expect(await message.innerText()).not.toMatch(/sourceRecordId|sourceField|https:\/\/firebasestorage/i);
  if (hasProof) {
    await assertProofContent(message);
  } else {
    await expect(message.locator("[data-certified360-empty], .chat-ia-accompaniment").first()).toContainText(
      /dato non trovato nelle fonti autorizzate|Nessun risultato disponibile|Vista richiesta non ancora disponibile/,
    );
  }
}

test.beforeEach(async ({ page }) => {
  await openChatToolUse(page);
});

test("pannello prove collassato su Driver360", async ({ page }) => {
  const driverName = await getRuntimeDriverNameWithRelation();
  test.skip(!driverName, "Nessun autista runtime con relazione certificabile nel dataset autorizzato.");
  await askAndAssertProof(page, `profilo autista ${driverName}`, "[data-driver360]", {
    requireProof: true,
    waitForDriver: true,
  });
});

test("pannello prove collassato su Vehicle360", async ({ page }) => {
  const plate = await getRuntimePlateWithRelation();
  test.skip(!plate, "Nessun mezzo runtime con relazione certificabile nel dataset autorizzato.");
  await askAndAssertProof(page, `mezzo ${plate}`, '[data-certified360-view="Vehicle360"]');
});

test("pannello prove collassato su Site360, Euromecc360 e Ricerca360", async ({ page }) => {
  const vehicles = await readStorageDataset("@mezzi_aziendali");
  const plate = getRuntimePlate(vehicles);
  test.skip(!plate, "Nessuna targa runtime disponibile nel dataset autorizzato.");

  await askAndAssertProof(page, "schede cisterna", '[data-certified360-view="Site360"]', { requireProof: false });
  await askAndAssertProof(page, "stato euromecc", '[data-certified360-view="Euromecc360"]', { requireProof: false });
  await askAndAssertProof(page, `ricerca ${plate}`, '[data-certified360-view="Ricerca360"]', { requireProof: false });
});
