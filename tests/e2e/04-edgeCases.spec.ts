import { test } from "@playwright/test";
import {
  assertContainsAny,
  assertNoChatFailure,
  getLastResponseAsText,
  openChatToolUse,
  sendPrompt,
} from "./helpers/chatHelpers";

const today = new Date();
const todayExpected = [
  String(today.getFullYear()),
  String(today.getDate()).padStart(2, "0"),
  today.toLocaleDateString("it-IT", { month: "long" }),
];

const cases: Array<{
  name: string;
  prompt: string;
  expected: Array<string | RegExp>;
  allowEmptyBusiness?: boolean;
}> = [
  { name: "targa minuscola", prompt: "trova mezzo ti282780", expected: ["TI282780"] },
  { name: "targa con spazio", prompt: "trova mezzo TI 282780", expected: ["TI282780"] },
  { name: "telaio senza spazi", prompt: "trova mezzo con telaio ZA9S35A48BAH02800", expected: ["TI282780", "09/04/2027"] },
  {
    name: "periodo mese scorso",
    prompt: "rifornimenti TI233827 il mese scorso",
    expected: ["TI233827", "rifornimenti"],
  },
  { name: "ultime settimane", prompt: "eventi operativi TI298409 ultime settimane", expected: ["TI298409", "eventi"] },
  { name: "risposta vuota attesa", prompt: "fatture mezzo INESISTENTE12345", expected: ["non", "fatture", "INESISTENTE12345"], allowEmptyBusiness: true },
  { name: "multi tool lista mezzi autisti", prompt: "lista mezzi e incrociali con autisti assegnati", expected: ["mezzi", "autisti"] },
  { name: "primo giorno mese", prompt: "manutenzioni del 01/04/2026", expected: ["manutenzioni", "01/04/2026", "aprile"] },
  { name: "ultimo giorno mese", prompt: "fatture del 31/03/2026 per TI113417", expected: ["TI113417", "31/03/2026", "fatture"] },
  { name: "domanda banale identita", prompt: "chi sei e cosa puoi fare nel gestionale?", expected: ["gestionale", "mezzi", "fatture", "manutenzioni"] },
  { name: "domanda banale data", prompt: "che giorno e oggi nel contesto della chat?", expected: todayExpected },
  { name: "parametri opzionali impliciti", prompt: "tutte le fatture per TI113417 senza limitare periodo o importo", expected: ["TI113417", "fatture"] },
];

test.beforeEach(async ({ page }) => {
  await openChatToolUse(page);
});

for (const item of cases) {
  test(`edge ${item.name}`, async ({ page }) => {
    await sendPrompt(page, item.prompt);
    const text = await getLastResponseAsText(page);
    assertNoChatFailure(text);
    assertContainsAny(text, item.expected);
  });
}
