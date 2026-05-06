import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import {
  assertNoChatFailure,
  getLastAssistantMessage,
  getLastResponseAsText,
  openChatToolUse,
  sendPrompt,
} from "./helpers/chatHelpers";
import { normalizePlate, parseToolDate, readStorageDataset, type RawRecord } from "./helpers/firestoreHelpers";

const D1_PROMPT = "dimmi che mezzo ha consumato di piu negli ultimi 2 mesi e fammi la media al km/lt e mettila in ordine decrescente";
const D5_PROMPT = "Controlla i rifornimenti degli ultimi 4 mesi e dimmi chi ha consumato di piu, e poi fai un comparazione di autisti per capire chi ha consumato di piu";
const D7_PROMPT = "Quale autista percorre piu km al mese in media e che tipo di mezzo guida prevalentemente?";
const D8_PROMPT = "Per ogni cantiere dimmi quante attrezzature ci sono e quali mezzi sono stati assegnati li negli ultimi 30 giorni";

const forbiddenLeakage = [
  /test e2e/i,
  /verit[àa] di base/i,
  /mezzi principali disponibili/i,
  /ambiente di sviluppo/i,
  /@\w+/i,
];

function lastMonthsPeriod(months: number): { from: Date; to: Date } {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth() - months + 1, 1),
    to: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999),
  };
}

function recordDate(record: RawRecord): Date | null {
  return parseToolDate(record.data ?? record.dataDisplay ?? record.dataLabel ?? record.timestamp ?? record.createdAt);
}

function inPeriod(value: Date | null, period: { from: Date; to: Date }): boolean {
  if (!value) return false;
  const time = value.getTime();
  return time >= period.from.getTime() && time <= period.to.getTime();
}

function recordPlate(record: RawRecord): string {
  return normalizePlate(`${record.targa ?? ""} ${record.mezzoTarga ?? ""}`);
}

async function countVehiclesWithRefuelings(months: number): Promise<number> {
  const period = lastMonthsPeriod(months);
  const rows = [
    ...(await readStorageDataset("@rifornimenti")),
    ...(await readStorageDataset("@rifornimenti_autisti_tmp")),
  ];
  const plates = new Set<string>();
  for (const row of rows) {
    const plate = recordPlate(row);
    if (!plate) continue;
    if (inPeriod(recordDate(row), period)) plates.add(plate);
  }
  return plates.size;
}

async function countSitesWithEquipment(): Promise<number> {
  const rows = await readStorageDataset("@attrezzature_cantieri");
  const sites = new Set<string>();
  for (const row of rows) {
    const label = `${row.cantiereLabel ?? row.sourceCantiereLabel ?? row.cantiereId ?? row.sourceCantiereId ?? ""}`.trim();
    if (label) sites.add(label.toLowerCase());
  }
  return sites.size;
}

async function assertNoLeakage(text: string): Promise<void> {
  for (const forbidden of forbiddenLeakage) {
    expect(text).not.toMatch(forbidden);
  }
}

test.beforeEach(async ({ page }) => {
  await openChatToolUse(page);
});

test("D1 usa la flotta reale e non due targhe fisse", async ({ page }) => {
  const expectedVehicles = await countVehiclesWithRefuelings(2);
  await sendPrompt(page, D1_PROMPT, 90000);
  const text = await getLastResponseAsText(page);
  assertNoChatFailure(text);
  await assertNoLeakage(text);
  expect(text.toLowerCase()).toContain("tutta la flotta");

  const rankingRows = await getLastAssistantMessage(page).locator(".chat-ia-viz-ranking-row").count();
  if (expectedVehicles >= 5) {
    expect(rankingRows).toBeGreaterThanOrEqual(5);
  }
  expect(rankingRows).toBeGreaterThan(2);
});

test("D5 e D7 mantengono coerenza con i mezzi con rifornimenti", async ({ page }) => {
  const expectedVehicles = await countVehiclesWithRefuelings(4);

  await sendPrompt(page, D5_PROMPT, 90000);
  const d5Text = await getLastResponseAsText(page);
  assertNoChatFailure(d5Text);
  await assertNoLeakage(d5Text);
  const d5Rows = await getLastAssistantMessage(page).locator(".chat-ia-viz-ranking-row").count();
  if (expectedVehicles >= 5) expect(d5Rows).toBeGreaterThanOrEqual(5);

  await sendPrompt(page, D7_PROMPT, 90000);
  const d7Text = await getLastResponseAsText(page);
  assertNoChatFailure(d7Text);
  await assertNoLeakage(d7Text);
  const d7Rows = await getLastAssistantMessage(page).locator(".chat-ia-viz-data-table-styled tbody tr").count();
  if (expectedVehicles >= 5) expect(d7Rows).toBeGreaterThanOrEqual(5);
});

test("D8 usa tutti i cantieri disponibili e non un cantiere hardcoded", async ({ page }) => {
  const expectedSites = await countSitesWithEquipment();
  await sendPrompt(page, D8_PROMPT, 90000);
  const text = await getLastResponseAsText(page);
  assertNoChatFailure(text);
  await assertNoLeakage(text);
  expect(text.toLowerCase()).toContain("tutti i cantieri");

  const rows = await getLastAssistantMessage(page).locator(".chat-ia-viz-data-table-styled tbody tr").count();
  if (expectedSites >= 5) expect(rows).toBeGreaterThanOrEqual(5);
});

test("sorgenti multi-agente senza targhe hardcoded e leakage storico", async () => {
  const files = [
    "src/next/chat-ia/agents/orchestrator.ts",
    "src/next/chat-ia/agents/analytics.ts",
    "src/next/chat-ia/agents/visualization.ts",
    "backend/internal-ai/server/internal-ai-adapter.js",
  ];
  const text = files.map((file) => readFileSync(resolve(process.cwd(), file), "utf8")).join("\n");
  expect(text).not.toMatch(/TI282780|TI233827|TI298409|TI113417/);
  expect(text).not.toMatch(/test E2E|mezzi principali disponibili|GTL PALAZZETTO|verita di base/i);
});
