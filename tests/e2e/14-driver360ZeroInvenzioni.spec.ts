import { expect, test } from "@playwright/test";
import { getLastAssistantMessage, openChatToolUse, sendPrompt } from "./helpers/chatHelpers";

async function waitForDriver360OrDisambiguation(pageTextSource: ReturnType<typeof getLastAssistantMessage>) {
  await expect(
    pageTextSource.locator("[data-driver360], [data-driver360-disambiguation]"),
  ).toHaveCount(1, { timeout: 45000 });
}

test.beforeEach(async ({ page }) => {
  await openChatToolUse(page);
});

test("profilo autista Sandro Calabrese apre Driver360 o disambiguazione backend", async ({ page }) => {
  await sendPrompt(page, "profilo autista Sandro Calabrese", 120000);
  const message = getLastAssistantMessage(page);
  await waitForDriver360OrDisambiguation(message);

  const text = await message.innerText();
  await expect(message.locator(".chat-ia-message-text")).toHaveCount(0);
  expect(text).not.toContain("Vista richiesta non ancora disponibile");
  expect(text).not.toContain("TI313387");
  expect(text).not.toContain("TI113387");

  if (text.includes("TI282780")) {
    const firstProof = message.locator("[data-relation-proof]").first();
    await expect(firstProof).toContainText("sourceCollection");
    await expect(firstProof).toContainText("rule");
    await expect(firstProof).toContainText("certainty");
  }
});

test("profilo autista Sandro non consente scelta LLM senza candidati backend", async ({ page }) => {
  await sendPrompt(page, "profilo autista Sandro", 120000);
  const message = getLastAssistantMessage(page);
  await waitForDriver360OrDisambiguation(message);

  const disambiguation = message.locator("[data-driver360-disambiguation]");
  if (await disambiguation.count()) {
    await expect(disambiguation.locator("[data-driver360-candidate]")).not.toHaveCount(0);
    await expect(message.locator("[data-driver360-vehicle]")).toHaveCount(0);
  }
});

test("profilo autista Sandro Calabrese con targa in query non certifica mezzo senza proof", async ({ page }) => {
  await sendPrompt(page, "profilo autista Sandro Calabrese TI313387", 120000);
  const message = getLastAssistantMessage(page);
  await waitForDriver360OrDisambiguation(message);

  const text = await message.innerText();
  expect(text).not.toContain("TI313387");
});

test("ogni mezzo mostrato in Driver360 espone relationProof", async ({ page }) => {
  await sendPrompt(page, "profilo autista Sandro Calabrese", 120000);
  const message = getLastAssistantMessage(page);
  await waitForDriver360OrDisambiguation(message);

  const vehicles = message.locator("[data-driver360-vehicle]");
  const vehicleCount = await vehicles.count();
  for (let index = 0; index < vehicleCount; index += 1) {
    const vehicle = vehicles.nth(index);
    await expect(vehicle.locator("[data-relation-proof]")).toHaveCount(1);
    await expect(vehicle.locator("[data-relation-proof]")).toContainText("sourceCollection");
    await expect(vehicle.locator("[data-relation-proof]")).toContainText("sourceRecordId");
    await expect(vehicle.locator("[data-relation-proof]")).toContainText("sourceField");
    await expect(vehicle.locator("[data-relation-proof]")).toContainText("rule");
    await expect(vehicle.locator("[data-relation-proof]")).toContainText("certainty");
  }
});
