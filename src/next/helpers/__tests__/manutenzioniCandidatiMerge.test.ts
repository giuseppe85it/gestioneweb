// PROMPT 45 T1a — test del helper `getManutenzioniCandidateMerge`.
//
// Mock di `storageSync` come store in-memory: il helper e' un reader puro,
// nessuna scrittura attesa. Verifica: filtro targa + stato + finestra + sort.

import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, unknown>();

vi.mock("../../../utils/storageSync", () => ({
  getItemSync: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
  setItemSync: vi.fn((key: string, value: unknown) => {
    store.set(key, value);
    return Promise.resolve();
  }),
}));

import { getManutenzioniCandidateMerge } from "../manutenzioniCandidatiMerge";

function seed(records: Array<Record<string, unknown>>): void {
  store.clear();
  store.set("@manutenzioni", records);
}

describe("getManutenzioniCandidateMerge", () => {
  beforeEach(() => {
    store.clear();
  });

  it("ritorna [] quando @manutenzioni e' vuoto/assente", async () => {
    const out = await getManutenzioniCandidateMerge("TI113417");
    expect(out).toEqual([]);
  });

  it("filtra per targa + stato (daFare/programmata), esclude eseguite/chiuse e altre targhe", async () => {
    const oggi = new Date().toISOString().slice(0, 10);
    seed([
      { id: "a", targa: "TI113417", descrizione: "Gomme", stato: "daFare", dataInserimento: oggi },
      { id: "b", targa: "TI113417", descrizione: "Tagliando", stato: "programmata", dataInserimento: oggi },
      { id: "c", targa: "TI113417", descrizione: "Vecchia", stato: "eseguita", dataInserimento: oggi },
      { id: "d", targa: "TI113417", descrizione: "Chiusa evt", stato: "chiusa_da_evento", dataInserimento: oggi },
      { id: "e", targa: "TI998877", descrizione: "Altra targa", stato: "daFare", dataInserimento: oggi },
    ]);
    const out = await getManutenzioniCandidateMerge("TI113417");
    expect(out.map((c) => c.id).sort()).toEqual(["a", "b"]);
    expect(out.every((c) => c.targa === "TI113417")).toBe(true);
  });

  it("normalizza targa case-insensitive (input minuscolo, record maiuscolo)", async () => {
    const oggi = new Date().toISOString().slice(0, 10);
    seed([{ id: "a", targa: "TI113417", stato: "daFare", dataInserimento: oggi }]);
    const out = await getManutenzioniCandidateMerge("ti113417");
    expect(out.map((c) => c.id)).toEqual(["a"]);
  });

  it("esclude record con dataInserimento oltre la finestra (default 90gg)", async () => {
    const vecchia = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const recente = new Date().toISOString().slice(0, 10);
    seed([
      { id: "old", targa: "TI113417", stato: "daFare", dataInserimento: vecchia },
      { id: "new", targa: "TI113417", stato: "daFare", dataInserimento: recente },
    ]);
    const out = await getManutenzioniCandidateMerge("TI113417");
    expect(out.map((c) => c.id)).toEqual(["new"]);
  });

  it("ordina per dataInserimento desc (piu' recente prima)", async () => {
    const oggi = new Date().toISOString().slice(0, 10);
    const ieri = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    seed([
      { id: "ieri", targa: "TI113417", stato: "daFare", dataInserimento: ieri },
      { id: "oggi", targa: "TI113417", stato: "daFare", dataInserimento: oggi },
    ]);
    const out = await getManutenzioniCandidateMerge("TI113417");
    expect(out.map((c) => c.id)).toEqual(["oggi", "ieri"]);
  });
});
