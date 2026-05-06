import { test } from "@playwright/test";
import {
  assertContainsAny,
  assertNoChatFailure,
  getLastResponseAsText,
  openChatToolUse,
  sendPrompt,
} from "./helpers/chatHelpers";

const cases: Array<{ name: string; prompt: string; expected: Array<string | RegExp> }> = [
  { name: "mezzi lista totale", prompt: "lista mezzi della flotta", expected: ["mezzi", "flotta"] },
  { name: "mezzi semirimorchi", prompt: "lista semirimorchi asse fisso", expected: ["semirimorchio", "asse"] },
  { name: "scadenze revisioni", prompt: "mezzi con revisione in scadenza", expected: ["revisione", "scadenza"] },
  { name: "autisti elenco", prompt: "lista autisti", expected: ["autisti", "nome"] },
  {
    name: "profilo operativo autista",
    prompt: "profilo operativo Sandro Calabrese ultime settimane",
    expected: ["Sandro", "Calabrese", "profilo", "attivita"],
  },
  { name: "manutenzioni periodo", prompt: "manutenzioni effettuate ad aprile 2026", expected: ["manutenzioni", "aprile", "2026"] },
  { name: "manutenzioni programmate", prompt: "manutenzioni programmate prossimi 3 mesi", expected: ["manutenzioni", "programmate"] },
  { name: "manutenzione singolo mezzo", prompt: "storico manutenzioni TI282780", expected: ["TI282780", "manutenzioni"] },
  { name: "lavori aperti flotta", prompt: "lavori aperti su tutta la flotta", expected: ["lavori", "aperti", "flotta"] },
  { name: "lavori eseguiti aprile", prompt: "lavori eseguiti aprile 2026", expected: ["lavori", "aprile", "2026"] },
  { name: "rifornimenti singolo mezzo", prompt: "rifornimenti TI233827 aprile 2026", expected: ["TI233827", "rifornimenti", "aprile"] },
  { name: "rifornimenti aggregati", prompt: "totale litri rifornimenti TI298409", expected: ["TI298409", "litri", "totale"] },
  { name: "confronto fonti carburante", prompt: "confronta rifornimenti cisterna e distributori aprile 2026", expected: ["cisterna", "distributori", "rifornimenti"] },
  {
    name: "documenti targa",
    prompt: "documenti e fatture TI113417",
    expected: ["TI113417", "fatture", "documenti"],
  },
  { name: "fornitore fattura", prompt: "chi e il fornitore della fattura 81?", expected: ["fornitore", "81"] },
  { name: "costi mezzo", prompt: "riepilogo costi TI113417 per categoria", expected: ["TI113417", "costi", "categoria"] },
  { name: "eventi mezzo", prompt: "eventi e segnalazioni TI233827", expected: ["TI233827", "eventi", "segnalazioni"] },
  {
    name: "timeline mezzo",
    prompt: "timeline completa TI282780",
    expected: ["TI282780", "timeline", "rifornimento", "lavoro", "documento"],
  },
  {
    name: "cisterna snapshot",
    prompt: "snapshot cisterna Caravate aprile 2026",
    expected: ["cisterna", "Caravate", "aprile"],
  },
  {
    name: "cisterna riconciliazione",
    prompt: "riconcilia cisterna mese aprile 2026",
    expected: ["cisterna", "riconcilia", "aprile"],
  },
  { name: "inventario", prompt: "materiali disponibili in inventario", expected: ["inventario", "materiali"] },
  { name: "movimenti materiali", prompt: "movimenti materiali aprile 2026", expected: ["materiali", "movimenti", "aprile"] },
  { name: "materiali per mezzo", prompt: "materiali consegnati a TI282780", expected: ["TI282780", "materiali"] },
  { name: "attrezzature cantiere", prompt: "attrezzature cantiere GTL PALAZZETTO", expected: ["attrezzature", "GTL", "PALAZZETTO"] },
  { name: "fornitori", prompt: "lista fornitori collegati a officine", expected: ["fornitori", "officine"] },
  { name: "officine", prompt: "lista officine disponibili", expected: ["officine", "lista"] },
  { name: "euromecc", prompt: "stato Euromecc e priorita aperte", expected: ["Euromecc", "priorita", "stato"] },
  { name: "outlier costi", prompt: "trova outlier costi documenti", expected: ["outlier", "costi"] },
  { name: "media consumi", prompt: "media consumi TI233827", expected: ["TI233827", "media", "consumi"] },
  { name: "multi dominio", prompt: "incrocia TI113417 con fatture, costi e lavori officina", expected: ["TI113417", "fatture", "costi", "lavori"] },
];

test.beforeEach(async ({ page }) => {
  await openChatToolUse(page);
});

for (const item of cases) {
  test(`incrocio ${item.name}`, async ({ page }) => {
    await sendPrompt(page, item.prompt);
    const text = await getLastResponseAsText(page);
    assertNoChatFailure(text);
    assertContainsAny(text, item.expected);
  });
}
