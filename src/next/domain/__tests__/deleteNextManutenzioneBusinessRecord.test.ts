// PROMPT 42 — T1 — Test del writer di eliminazione manutenzione.
// Verifica: delete per id reale, delete per fingerprint (record senza id reale),
// delete record non trovato (-> false, array invariato), delete ultimo record.
//
// `storageSync` mockato in-memory: isola la logica del writer senza Firestore/barrier.

import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, unknown>();

vi.mock("../../../utils/storageSync", () => ({
  getItemSync: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
  setItemSync: vi.fn((key: string, value: unknown) => {
    store.set(key, value);
    return Promise.resolve();
  }),
}));

import { deleteNextManutenzioneBusinessRecord } from "../nextManutenzioniDomain";

type RawRecord = Record<string, unknown>;

function seed(records: RawRecord[]): void {
  store.clear();
  store.set("@manutenzioni", records);
}

function readStorico(): RawRecord[] {
  const value = store.get("@manutenzioni");
  return Array.isArray(value) ? (value as RawRecord[]) : [];
}

describe("deleteNextManutenzioneBusinessRecord — fix Quadro (PROMPT 42)", () => {
  beforeEach(() => {
    store.clear();
  });

  it("delete per id reale: rimuove il record, gli altri restano invariati", async () => {
    seed([
      { id: "rec-1", targa: "TI100000", descrizione: "A", data: "2026-01-01" },
      { id: "rec-2", targa: "TI200000", descrizione: "B", data: "2026-02-01" },
    ]);
    const ok = await deleteNextManutenzioneBusinessRecord("rec-1");
    expect(ok).toBe(true);
    const storico = readStorico();
    expect(storico).toHaveLength(1);
    expect(storico[0].id).toBe("rec-2");
  });

  it("delete record senza id reale: lo ritrova via fingerprint e lo rimuove", async () => {
    seed([
      { targa: "TI298409", descrizione: "Cambio gomme", data: "2026-05-08", stato: "eseguita" },
      { id: "rec-altro", targa: "TI999999", descrizione: "Tagliando", data: "2026-04-01" },
    ]);
    const ok = await deleteNextManutenzioneBusinessRecord("manutenzione:TI298409:0", {
      targa: "TI298409",
      data: "2026-05-08",
      descrizione: "Cambio gomme",
      stato: "eseguita",
    });
    expect(ok).toBe(true);
    const storico = readStorico();
    expect(storico).toHaveLength(1);
    expect(storico[0].id).toBe("rec-altro");
  });

  it("delete record non trovato: ritorna false e l'array resta invariato", async () => {
    seed([{ id: "rec-1", targa: "TI100000", descrizione: "A", data: "2026-01-01" }]);
    const ok = await deleteNextManutenzioneBusinessRecord("id-inesistente", {
      targa: "TI000000",
      data: "1999-01-01",
      descrizione: "non esiste",
      stato: "eseguita",
    });
    expect(ok).toBe(false);
    expect(readStorico()).toHaveLength(1);
  });

  it("delete su mezzo con un solo record: l'array diventa vuoto", async () => {
    seed([{ id: "solo-1", targa: "TI500000", descrizione: "Unico", data: "2026-03-01" }]);
    const ok = await deleteNextManutenzioneBusinessRecord("solo-1");
    expect(ok).toBe(true);
    expect(readStorico()).toHaveLength(0);
  });
});
