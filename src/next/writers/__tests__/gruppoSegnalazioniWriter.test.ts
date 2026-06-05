import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, unknown>();

vi.mock("../../../utils/storageSync", () => ({
  getItemSync: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
  setItemSync: vi.fn((key: string, value: unknown) => {
    store.set(key, value);
    return Promise.resolve();
  }),
}));

vi.mock("../../../utils/cloneWriteBarrier", () => ({
  CloneWriteBlockedError: class CloneWriteBlockedError extends Error {},
  assertCloneWriteAllowed: vi.fn(),
  runWithCloneWriteScopedAllowance: vi.fn(
    async (_scope: string, fn: () => Promise<unknown>) => fn(),
  ),
}));

import {
  aggiungiAGruppo,
  creaGruppoSegnalazioni,
  rimuoviDaGruppo,
} from "../gruppoSegnalazioniWriter";

type RawRecord = Record<string, unknown>;

function seed(records: RawRecord[]): void {
  store.clear();
  store.set("@segnalazioni_autisti_tmp", records);
}

function segnalazioni(): RawRecord[] {
  const value = store.get("@segnalazioni_autisti_tmp");
  return Array.isArray(value) ? (value as RawRecord[]) : [];
}

describe("gruppoSegnalazioniWriter", () => {
  beforeEach(() => {
    store.clear();
  });

  it("crea un gruppo valido su segnalazioni aperte non collegate della stessa targa", async () => {
    seed([
      { id: "S1", targa: "TI298409", stato: "nuova" },
      { id: "S2", targa: "TI298409", stato: "presa_in_carico" },
      { id: "S3", targa: "TI000000", stato: "nuova" },
    ]);

    const result = await creaGruppoSegnalazioni(["S1", "S2"]);

    expect(result.ok).toBe(true);
    expect(result.gruppoId).toBeTruthy();
    const records = segnalazioni();
    expect(records[0].gruppoSegnalazioneId).toBe(result.gruppoId);
    expect(records[1].gruppoSegnalazioneId).toBe(result.gruppoId);
    expect(records[2].gruppoSegnalazioneId).toBeUndefined();
  });

  it("aggiunge una segnalazione libera a un gruppo coerente per targa", async () => {
    seed([
      { id: "S1", targa: "TI298409", stato: "nuova", gruppoSegnalazioneId: "G1" },
      { id: "S2", targa: "TI298409", stato: "nuova" },
    ]);

    const result = await aggiungiAGruppo("G1", ["S2"]);

    expect(result.ok).toBe(true);
    expect(segnalazioni()[1].gruppoSegnalazioneId).toBe("G1");
  });

  it("rimuove una segnalazione dal gruppo azzerando solo gruppoSegnalazioneId", async () => {
    seed([
      { id: "S1", targa: "TI298409", stato: "nuova", gruppoSegnalazioneId: "G1", descrizione: "Freni" },
      { id: "S2", targa: "TI298409", stato: "nuova", gruppoSegnalazioneId: "G1" },
    ]);

    const result = await rimuoviDaGruppo(["S1"]);

    expect(result.ok).toBe(true);
    const records = segnalazioni();
    expect(records[0].gruppoSegnalazioneId).toBeNull();
    expect(records[0].descrizione).toBe("Freni");
    expect(records[1].gruppoSegnalazioneId).toBe("G1");
  });

  it("rifiuta la creazione con targhe miste senza scritture parziali", async () => {
    seed([
      { id: "S1", targa: "TI298409", stato: "nuova" },
      { id: "S2", targa: "TI100000", stato: "nuova" },
    ]);

    const result = await creaGruppoSegnalazioni(["S1", "S2"]);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("stessa targa");
    expect(segnalazioni()[0].gruppoSegnalazioneId).toBeUndefined();
    expect(segnalazioni()[1].gruppoSegnalazioneId).toBeUndefined();
  });

  it("rifiuta una segnalazione gia in gruppo", async () => {
    seed([{ id: "S1", targa: "TI298409", stato: "nuova", gruppoSegnalazioneId: "G1" }]);

    const result = await creaGruppoSegnalazioni(["S1"]);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("gia in un gruppo");
    expect(segnalazioni()[0].gruppoSegnalazioneId).toBe("G1");
  });

  it("rifiuta una segnalazione collegata", async () => {
    seed([{ id: "S1", targa: "TI298409", stato: "nuova", linkedLavoroId: "M1" }]);

    const result = await creaGruppoSegnalazioni(["S1"]);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("gia collegata");
    expect(segnalazioni()[0].gruppoSegnalazioneId).toBeUndefined();
  });

  it("rifiuta una segnalazione chiusa", async () => {
    seed([{ id: "S1", targa: "TI298409", stato: "chiusa" }]);

    const result = await creaGruppoSegnalazioni(["S1"]);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("chiusa");
    expect(segnalazioni()[0].gruppoSegnalazioneId).toBeUndefined();
  });

  it("rifiuta una segnalazione inesistente", async () => {
    seed([{ id: "S1", targa: "TI298409", stato: "nuova" }]);

    const result = await creaGruppoSegnalazioni(["S2"]);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("non trovata");
    expect(segnalazioni()[0].gruppoSegnalazioneId).toBeUndefined();
  });
});
