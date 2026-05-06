import { expect, test, type Locator } from "@playwright/test";
import { getLastAssistantMessage, openChatToolUse, sendPrompt } from "./helpers/chatHelpers";
import { normalizePlate, readStorageDataset, type RawRecord } from "./helpers/firestoreHelpers";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function runtimePlate(): Promise<string> {
  const vehicles = await readStorageDataset("@mezzi_aziendali");
  return (
    vehicles
      .map((entry: RawRecord) => normalizePlate(entry.targa))
      .find((plate) => /^[A-Z]{2}\d{6}$/.test(plate)) ?? ""
  );
}

async function runtimePlateWithRelation(): Promise<string> {
  const vehicles = await readStorageDataset("@mezzi_aziendali");
  return normalizePlate(vehicles.find((entry) => normalizePlate(entry.targa) && text(entry.autistaId))?.targa);
}

async function runtimeDriverNameWithRelation(): Promise<string> {
  const [drivers, sessions] = await Promise.all([
    readStorageDataset("@colleghi"),
    readStorageDataset("@autisti_sessione_attive"),
  ]);
  const sessionBadgesWithVehicle = new Set(
    sessions
      .filter((entry) => normalizePlate(entry.targaMotrice) && text(entry.badgeAutista))
      .map((entry) => text(entry.badgeAutista).replace(/\s+/g, "").toLowerCase()),
  );
  return text(
    drivers.find(
      (entry) => sessionBadgesWithVehicle.has(text(entry.badge).replace(/\s+/g, "").toLowerCase()) && text(entry.nome),
    )?.nome,
  );
}

function assertNoFreeAssistantTextLeak(message: Locator): Promise<void> {
  return expect(message.locator("[data-chat-zero-uncertified-fallback]")).toHaveCount(0);
}

async function waitForDriver360Ready(message: Locator): Promise<void> {
  await expect(message.locator("[data-driver360]")).toHaveCount(1, { timeout: 45000 });
  await expect(message).not.toContainText("Caricamento profilo autista", { timeout: 45000 });
}

async function assertSmokeMessage(
  message: Locator,
  viewSelector: string,
  options: { requireProof: boolean; waitForDriver?: boolean },
): Promise<void> {
  await expect(message.locator(viewSelector)).toHaveCount(1, { timeout: 45000 });
  if (options.waitForDriver) {
    await waitForDriver360Ready(message);
  }
  const proofCount = await message.locator("[data-proof-panel]").count();
  if (options.requireProof) {
    expect(proofCount).toBeGreaterThan(0);
  }
  const details = message.locator("details[data-relation-proof]");
  for (let index = 0; index < await details.count(); index += 1) {
    await expect(details.nth(index)).not.toHaveAttribute("open", "");
  }
  await assertNoFreeAssistantTextLeak(message);
  expect(await message.innerText()).not.toMatch(/sourceRecordId|sourceField|https:\/\/firebasestorage/i);
}

test.beforeEach(async ({ page }) => {
  await openChatToolUse(page);
});

test("smoke intent runtime su cinque viste certificate", async ({ page }) => {
  const [plate, relationPlate, driverName] = await Promise.all([
    runtimePlate(),
    runtimePlateWithRelation(),
    runtimeDriverNameWithRelation(),
  ]);
  test.skip(!plate || !relationPlate || !driverName, "Dati runtime insufficienti per smoke sulle viste certificate.");

  const cases = [
    { prompt: `profilo autista ${driverName}`, selector: "[data-driver360]", requireProof: true, waitForDriver: true },
    { prompt: `mezzo ${relationPlate}`, selector: '[data-certified360-view="Vehicle360"]', requireProof: true },
    { prompt: "schede cisterna", selector: '[data-certified360-view="Site360"]', requireProof: false },
    { prompt: "stato euromecc", selector: '[data-certified360-view="Euromecc360"]', requireProof: false },
    { prompt: `ricerca ${plate}`, selector: '[data-certified360-view="Ricerca360"]', requireProof: false },
  ];

  for (const entry of cases) {
    await sendPrompt(page, entry.prompt, 120000);
    await assertSmokeMessage(getLastAssistantMessage(page), entry.selector, {
      requireProof: entry.requireProof,
      waitForDriver: entry.waitForDriver,
    });
  }
});

test("fallback intent non in catalogo resta parametrico", async ({ page }) => {
  await sendPrompt(page, "asdfghjkl", 120000);
  const message = getLastAssistantMessage(page);

  await expect(message.locator('[data-chat-zero-action="error"]')).toHaveCount(1, { timeout: 45000 });
  await expect(message.locator('[data-chat-zero-view="none"]')).toHaveCount(1);
  await expect(message.locator(".chat-ia-accompaniment")).toContainText(
    "Richiesta non disponibile nel catalogo attuale.",
  );
  await assertNoFreeAssistantTextLeak(message);
});
