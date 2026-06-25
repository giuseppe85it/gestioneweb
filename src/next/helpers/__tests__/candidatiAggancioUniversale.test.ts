// BUG 65 Fase 2 — test del lettore candidati universale (multi-sorgente + categoria).

import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, unknown>();

vi.mock("../../../utils/storageSync", () => ({
  getItemSync: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
  setItemSync: vi.fn((key: string, value: unknown) => {
    store.set(key, value);
    return Promise.resolve();
  }),
}));

import { getCandidatiAggancioUniversale } from "../candidatiAggancioUniversale";

const oggi = new Date().toISOString().slice(0, 10);

function seed() {
  store.clear();
  store.set("@mezzi_aziendali", [{ targa: "TI178456", categoria: "Motrice" }]);
  store.set("@manutenzioni", [
    { id: "m1", targa: "TI178456", descrizione: "Tagliando", stato: "eseguita", data: oggi },
    { id: "m2", targa: "TI999999", descrizione: "Altra targa", stato: "daFare", data: oggi },
  ]);
  store.set("@segnalazioni_autisti_tmp", [
    { id: "s1", targaCamion: "TI178456", tipoProblema: "gomme", descrizione: "Gomma forata", stato: "nuova", timestamp: Date.now() },
  ]);
  store.set("@controlli_mezzo_autisti", [
    { id: "c1", targaCamion: "TI178456", descrizione: "Controllo KO freni", esito: "ko", timestamp: Date.now() },
    // Controllo "tutto ok": NON deve comparire tra i candidati (rumore).
    { id: "c-ok", targaCamion: "TI178456", descrizione: "Controllo ok", ok: true, timestamp: Date.now() },
  ]);
}

describe("getCandidatiAggancioUniversale", () => {
  beforeEach(() => store.clear());

  it("ritorna candidati da manutenzioni + segnalazioni + SOLO controlli KO, con categoria", async () => {
    seed();
    const out = await getCandidatiAggancioUniversale({ targa: "TI178456" });
    // c-ok (controllo non KO) escluso.
    expect(out.map((c) => c.id).sort()).toEqual(["c1", "m1", "s1"]);
    expect(out.find((c) => c.id === "c-ok")).toBeUndefined();
    expect(out.every((c) => c.targa === "TI178456")).toBe(true);
    expect(out.every((c) => c.categoria === "Motrice")).toBe(true);
    const tipi = out.map((c) => c.tipo).sort();
    expect(tipi).toEqual(["controllo", "manutenzione", "segnalazione"]);
  });

  it("esclude un id specifico (la manutenzione di partenza)", async () => {
    seed();
    const out = await getCandidatiAggancioUniversale({ targa: "TI178456", escludiId: "m1" });
    expect(out.find((c) => c.id === "m1")).toBeUndefined();
  });

  it("senza targa restituisce tutte le targhe", async () => {
    seed();
    const out = await getCandidatiAggancioUniversale();
    expect(out.find((c) => c.id === "m2")).toBeDefined();
  });

  it("esclude i record oltre la finestra di 365 giorni", async () => {
    store.clear();
    store.set("@mezzi_aziendali", [{ targa: "TI178456", categoria: "Motrice" }]);
    const vecchia = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    store.set("@manutenzioni", [
      { id: "old", targa: "TI178456", descrizione: "Vecchia", stato: "eseguita", data: vecchia },
      { id: "new", targa: "TI178456", descrizione: "Recente", stato: "eseguita", data: oggi },
    ]);
    const out = await getCandidatiAggancioUniversale({ targa: "TI178456" });
    expect(out.map((c) => c.id)).toEqual(["new"]);
  });
});
