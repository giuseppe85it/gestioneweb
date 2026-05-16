// PROMPT 47 T1 — test del helper `getManutenzioniPerAggancio`.
//
// A differenza di `manutenzioniCandidatiMerge` (PROMPT 45), questo reader NON filtra
// per stato e usa finestra 365gg.

import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, unknown>();

vi.mock("../../../utils/storageSync", () => ({
  getItemSync: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
  setItemSync: vi.fn((key: string, value: unknown) => {
    store.set(key, value);
    return Promise.resolve();
  }),
}));

import { getManutenzioniPerAggancio } from "../manutenzioniPerAggancio";

function seed(records: Array<Record<string, unknown>>): void {
  store.clear();
  store.set("@manutenzioni", records);
}

describe("getManutenzioniPerAggancio (PROMPT 47 T1)", () => {
  beforeEach(() => {
    store.clear();
  });

  it("ritorna [] quando @manutenzioni vuoto", async () => {
    const out = await getManutenzioniPerAggancio("TI113417");
    expect(out).toEqual([]);
  });

  it("filtra per targa, INCLUDE tutti gli stati (daFare, programmata, eseguita, chiusa_da_evento)", async () => {
    const oggi = new Date().toISOString().slice(0, 10);
    seed([
      { id: "a", targa: "TI113417", descrizione: "Gomme", stato: "daFare", data: oggi },
      { id: "b", targa: "TI113417", descrizione: "Tagliando", stato: "programmata", data: oggi },
      { id: "c", targa: "TI113417", descrizione: "Cambio gomme", stato: "eseguita", data: oggi, fornitore: "VALTELLINA" },
      { id: "d", targa: "TI113417", descrizione: "Storico", stato: "chiusa_da_evento", data: oggi },
      { id: "e", targa: "TI998877", descrizione: "Altra targa", stato: "daFare", data: oggi },
    ]);
    const out = await getManutenzioniPerAggancio("TI113417");
    expect(out.map((c) => c.id).sort()).toEqual(["a", "b", "c", "d"]);
    expect(out.find((c) => c.id === "c")?.fornitore).toBe("VALTELLINA");
  });

  it("esclude record oltre 365gg (finestra default)", async () => {
    const vecchia = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const recente = new Date().toISOString().slice(0, 10);
    seed([
      { id: "old", targa: "TI113417", descrizione: "Old", stato: "eseguita", data: vecchia },
      { id: "new", targa: "TI113417", descrizione: "New", stato: "eseguita", data: recente },
    ]);
    const out = await getManutenzioniPerAggancio("TI113417");
    expect(out.map((c) => c.id)).toEqual(["new"]);
  });

  it("ordina per data desc (piu' recenti prima)", async () => {
    const ieri = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const oggi = new Date().toISOString().slice(0, 10);
    seed([
      { id: "ieri", targa: "TI113417", descrizione: "Old", stato: "eseguita", data: ieri },
      { id: "oggi", targa: "TI113417", descrizione: "New", stato: "daFare", data: oggi },
    ]);
    const out = await getManutenzioniPerAggancio("TI113417");
    expect(out.map((c) => c.id)).toEqual(["oggi", "ieri"]);
  });
});
