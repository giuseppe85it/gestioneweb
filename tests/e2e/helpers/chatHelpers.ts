import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { expect, type Locator, type Page } from "@playwright/test";

const BACKEND_BASE_URL = process.env.CHAT_IA_BACKEND_URL ?? "http://127.0.0.1:4310";
const METRICS_PATH = resolve(process.cwd(), "test-results", "chat-ia-e2e-metrics.ndjson");

/**
 * REGOLA TEST E2E - VERITA DINAMICA
 *
 * I test E2E NON devono mai contenere valori hardcoded che dipendono
 * dai dati del gestionale. Tutti i conteggi, classifiche, top N, date
 * e ID devono essere calcolati a runtime tramite firestoreHelpers.
 *
 * I test che usano hardcoded si rompono ogni volta che i dati cambiano
 * (rifornimenti aggiunti, manutenzioni eseguite, mezzi modificati).
 *
 * Pattern corretto:
 *   const expected = await getRifornimentiByPeriodo(...);
 *   expect(actual).toBe(expected.length);
 *
 * Pattern vietato:
 *   expect(actual).toBe(70); // si rompe quando si aggiungono rifornimenti
 *
 * Eccezione: valori che NON dipendono dai dati Firestore (status HTTP,
 * presenza di un blocco UI, formato output) possono essere hardcoded.
 */

export type ChatMetric = {
  prompt: string;
  durationMs: number;
  responseLength: number;
  ok: boolean;
};

export async function installInternalAiBackendProxy(page: Page): Promise<void> {
  await page.route("**/internal-ai-backend/**", async (route) => {
    const request = route.request();
    const requestUrl = new URL(request.url());
    const backendUrl = `${BACKEND_BASE_URL}${requestUrl.pathname}${requestUrl.search}`;
    const headers = { ...request.headers() };
    delete headers.host;
    delete headers.origin;
    delete headers.referer;

    const response = await fetch(backendUrl, {
      method: request.method(),
      headers,
      body: request.method() === "GET" || request.method() === "HEAD" ? undefined : request.postDataBuffer(),
    });

    await route.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: Buffer.from(await response.arrayBuffer()),
    });
  });
}

export async function openChatToolUse(page: Page): Promise<void> {
  await installInternalAiBackendProxy(page);
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await page.goto("/next/chat-tool", { waitUntil: "domcontentloaded" });
    try {
      await expect(page.getByRole("heading", { name: "Chat IA NEXT Tool Use" })).toBeVisible({ timeout: 30000 });
      await expect(page.getByLabel("Messaggio Chat IA NEXT")).toBeVisible({ timeout: 30000 });
      return;
    } catch (error) {
      if (attempt === 3) throw error;
      await page.waitForTimeout(1000);
    }
  }
}

export async function sendPrompt(page: Page, prompt: string, timeoutMs = 120000): Promise<ChatMetric> {
  const beforeCount = await page.locator(".chat-ia-message--assistente").count();
  const startedAt = Date.now();
  await page.getByLabel("Messaggio Chat IA NEXT").fill(prompt);
  await page.getByRole("button", { name: "Invia" }).click();
  await expect(page.locator(".chat-ia-message--assistente")).toHaveCount(beforeCount + 1, { timeout: timeoutMs });
  await expect(page.locator(".chat-ia-loading")).toHaveCount(0, { timeout: 10000 }).catch(() => undefined);
  const text = await getLastResponseAsText(page);
  const metric = {
    prompt,
    durationMs: Date.now() - startedAt,
    responseLength: text.length,
    ok: !isChatFailureResponse(text),
  };
  recordChatMetric(metric);
  return metric;
}

export async function waitForResponse(page: Page, expectedAssistantCount: number, timeoutMs = 120000): Promise<void> {
  await expect(page.locator(".chat-ia-message--assistente")).toHaveCount(expectedAssistantCount, { timeout: timeoutMs });
}

export function getLastAssistantMessage(page: Page): Locator {
  return page.locator(".chat-ia-message--assistente").last();
}

export async function getLastAssistantResponse(page: Page): Promise<string> {
  const message = getLastAssistantMessage(page);
  const structuredText = message.locator(".chat-ia-accompaniment").last();
  if (await structuredText.count()) {
    return (await structuredText.textContent())?.trim() ?? "";
  }
  return ((await message.textContent()) ?? "").replace(/\s+/g, " ").trim();
}

export async function getLastResponseAsText(page: Page): Promise<string> {
  return ((await getLastAssistantMessage(page).textContent()) ?? "").replace(/\s+/g, " ").trim();
}

export async function extractTableData(page: Page): Promise<string[][]> {
  const rows = getLastAssistantMessage(page).locator("table tbody tr");
  const count = await rows.count();
  const output: string[][] = [];
  for (let index = 0; index < count; index += 1) {
    const cells = rows.nth(index).locator("td");
    const cellCount = await cells.count();
    const row: string[] = [];
    for (let cellIndex = 0; cellIndex < cellCount; cellIndex += 1) {
      row.push(((await cells.nth(cellIndex).textContent()) ?? "").trim());
    }
    output.push(row);
  }
  return output;
}

export function assertNoChatFailure(text: string): void {
  expect.soft(text, "La risposta non deve essere vuota").not.toHaveLength(0);
  expect(text).not.toMatch(HARD_FAILURE_RESPONSE_PATTERN);
}

export function assertContainsAll(text: string, expected: Array<string | RegExp>): void {
  for (const item of expected) {
    if (typeof item === "string") {
      expect(text.toLowerCase()).toContain(item.toLowerCase());
    } else {
      expect(text).toMatch(item);
    }
  }
}

export function assertContainsAny(text: string, expected: Array<string | RegExp>): void {
  const matches = expected.some((item) => (
    typeof item === "string" ? text.toLowerCase().includes(item.toLowerCase()) : item.test(text)
  ));
  expect(matches, `Risposta attesa con almeno uno fra: ${expected.map(String).join(", ")}\nRisposta: ${text}`).toBe(true);
}

export async function askAndExpect(page: Page, prompt: string, expected: Array<string | RegExp>, timeoutMs = 120000): Promise<string> {
  await sendPrompt(page, prompt, timeoutMs);
  const text = await getLastResponseAsText(page);
  assertNoChatFailure(text);
  assertContainsAll(text, expected);
  return text;
}

export function normalizeForAssert(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function isChatFailureResponse(text: string): boolean {
  return KNOWN_BLOCKED_RESPONSE_PATTERN.test(text);
}

function recordChatMetric(metric: ChatMetric): void {
  mkdirSync(dirname(METRICS_PATH), { recursive: true });
  appendFileSync(METRICS_PATH, `${JSON.stringify({ ...metric, ts: new Date().toISOString() })}\n`, "utf8");
}

const HARD_FAILURE_RESPONSE_PATTERN = /limite di iterazioni|timeout|non e riuscita|non è riuscita|errore provider|Risposta provider incapsulata/i;
const KNOWN_BLOCKED_RESPONSE_PATTERN = /limite di iterazioni|timeout|non e riuscita|non è riuscita|errore provider|Risposta provider incapsulata|Fallback anti-allucinazione|Nessun record verificabile disponibile|non verificabile/i;
