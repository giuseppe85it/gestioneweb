import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, unknown>();
const firestoreDocs = new Map<string, unknown>();
let persistWrites = true;

vi.mock("../../../utils/storageSync", () => ({
  getItemSync: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
  setItemSync: vi.fn((key: string, value: unknown) => {
    if (persistWrites) store.set(key, value);
    return Promise.resolve();
  }),
}));

vi.mock("../../../utils/cloneWriteBarrier", () => ({
  CloneWriteBlockedError: class CloneWriteBlockedError extends Error {},
  assertCloneWriteAllowed: vi.fn(),
}));

vi.mock("../../../firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db: unknown, collectionName: string, id: string) => `${collectionName}/${id}`),
  getDoc: vi.fn((ref: string) =>
    Promise.resolve({
      exists: () => firestoreDocs.has(ref),
      data: () => firestoreDocs.get(ref),
    }),
  ),
}));

import {
  aggiungiAGruppoManutenzioni,
  creaGruppoManutenzioni,
  rimuoviDaGruppoManutenzioni,
} from "../gruppoManutenzioniWriter";
import {
  readNextManutenzioniLegacyDataset,
  readNextMezzoManutenzioniSnapshot,
} from "../../domain/nextManutenzioniDomain";

type RawRecord = Record<string, unknown>;

function seed(records: RawRecord[]): void {
  store.clear();
  store.set("@manutenzioni", records);
}

function manutenzioni(): RawRecord[] {
  const value = store.get("@manutenzioni");
  return Array.isArray(value) ? (value as RawRecord[]) : [];
}

function seedFirestore(records: RawRecord[]): void {
  firestoreDocs.clear();
  firestoreDocs.set("storage/@manutenzioni", { value: records });
  firestoreDocs.set("storage/@mezzi_aziendali", { value: [{ id: "MEZZO-1", targa: "TI298409" }] });
}

describe("gruppoManutenzioniWriter", () => {
  beforeEach(() => {
    store.clear();
    firestoreDocs.clear();
    persistWrites = true;
  });

  it("crea un gruppo valido su manutenzioni daFare della stessa targa", async () => {
    seed([
      { id: "M1", targa: "TI298409", stato: "daFare", descrizione: "Freni" },
      { id: "M2", targa: "TI298409", stato: "daFare", descrizione: "Gomme" },
      { id: "M3", targa: "TI000000", stato: "daFare", descrizione: "Altro" },
    ]);

    const result = await creaGruppoManutenzioni(["M1", "M2"]);

    expect(result.ok).toBe(true);
    expect(result.gruppoId).toBeTruthy();
    const records = manutenzioni();
    expect(records[0].gruppoManutenzioneId).toBe(result.gruppoId);
    expect(records[1].gruppoManutenzioneId).toBe(result.gruppoId);
    expect(records[2].gruppoManutenzioneId).toBeUndefined();
    expect(records[0].descrizione).toBe("Freni");
  });

  it("aggiunge una manutenzione libera a un gruppo coerente per targa", async () => {
    seed([
      { id: "M1", targa: "TI298409", stato: "daFare", gruppoManutenzioneId: "G1" },
      { id: "M2", targa: "TI298409", stato: "daFare" },
    ]);

    const result = await aggiungiAGruppoManutenzioni("G1", ["M2"]);

    expect(result.ok).toBe(true);
    expect(manutenzioni()[1].gruppoManutenzioneId).toBe("G1");
  });

  it("rimuove una manutenzione dal gruppo azzerando solo gruppoManutenzioneId", async () => {
    seed([
      { id: "M1", targa: "TI298409", stato: "daFare", gruppoManutenzioneId: "G1", descrizione: "Freni" },
      { id: "M2", targa: "TI298409", stato: "daFare", gruppoManutenzioneId: "G1" },
    ]);

    const result = await rimuoviDaGruppoManutenzioni(["M1"]);

    expect(result.ok).toBe(true);
    const records = manutenzioni();
    expect(records[0].gruppoManutenzioneId).toBeNull();
    expect(records[0].descrizione).toBe("Freni");
    expect(records[1].gruppoManutenzioneId).toBe("G1");
  });

  it("rifiuta la creazione con meno di due manutenzioni", async () => {
    seed([{ id: "M1", targa: "TI298409", stato: "daFare" }]);

    const result = await creaGruppoManutenzioni(["M1"]);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("almeno due");
    expect(manutenzioni()[0].gruppoManutenzioneId).toBeUndefined();
  });

  it("rifiuta targhe miste senza scritture parziali", async () => {
    seed([
      { id: "M1", targa: "TI298409", stato: "daFare" },
      { id: "M2", targa: "TI100000", stato: "daFare" },
    ]);

    const result = await creaGruppoManutenzioni(["M1", "M2"]);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("stessa targa");
    expect(manutenzioni()[0].gruppoManutenzioneId).toBeUndefined();
    expect(manutenzioni()[1].gruppoManutenzioneId).toBeUndefined();
  });

  it("rifiuta una manutenzione programmata", async () => {
    seed([
      { id: "M1", targa: "TI298409", stato: "daFare" },
      { id: "M2", targa: "TI298409", stato: "programmata" },
    ]);

    const result = await creaGruppoManutenzioni(["M1", "M2"]);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("programmata");
    expect(manutenzioni()[0].gruppoManutenzioneId).toBeUndefined();
    expect(manutenzioni()[1].gruppoManutenzioneId).toBeUndefined();
  });

  it("rifiuta una manutenzione gia in gruppo", async () => {
    seed([
      { id: "M1", targa: "TI298409", stato: "daFare", gruppoManutenzioneId: "G1" },
      { id: "M2", targa: "TI298409", stato: "daFare" },
    ]);

    const result = await creaGruppoManutenzioni(["M1", "M2"]);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("gia in un gruppo");
    expect(manutenzioni()[0].gruppoManutenzioneId).toBe("G1");
    expect(manutenzioni()[1].gruppoManutenzioneId).toBeUndefined();
  });

  it("rifiuta una manutenzione inesistente", async () => {
    seed([{ id: "M1", targa: "TI298409", stato: "daFare" }]);

    const result = await creaGruppoManutenzioni(["M1", "M2"]);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("non trovata");
    expect(manutenzioni()[0].gruppoManutenzioneId).toBeUndefined();
  });

  it("rifiuta una manutenzione senza raw.id", async () => {
    seed([
      { targa: "TI298409", stato: "daFare", descrizione: "Senza id" },
      { id: "M2", targa: "TI298409", stato: "daFare" },
    ]);

    const result = await creaGruppoManutenzioni(["", "M2"]);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("ID manutenzione reale mancante");
    expect(manutenzioni()[0].gruppoManutenzioneId).toBeUndefined();
    expect(manutenzioni()[1].gruppoManutenzioneId).toBeUndefined();
  });

  it("rifiuta una manutenzione con id sintetico manutenzione:*", async () => {
    seed([
      { id: "manutenzione:TI298409:0", targa: "TI298409", stato: "daFare" },
      { id: "M2", targa: "TI298409", stato: "daFare" },
    ]);

    const result = await creaGruppoManutenzioni(["manutenzione:TI298409:0", "M2"]);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("ID manutenzione reale mancante");
    expect(manutenzioni()[0].gruppoManutenzioneId).toBeUndefined();
    expect(manutenzioni()[1].gruppoManutenzioneId).toBeUndefined();
  });

  it("rifiuta gruppo target incoerente per targa", async () => {
    seed([
      { id: "M1", targa: "TI298409", stato: "daFare", gruppoManutenzioneId: "G1" },
      { id: "M2", targa: "TI999999", stato: "daFare", gruppoManutenzioneId: "G1" },
      { id: "M3", targa: "TI298409", stato: "daFare" },
    ]);

    const result = await aggiungiAGruppoManutenzioni("G1", ["M3"]);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("targhe diverse");
    expect(manutenzioni()[2].gruppoManutenzioneId).toBeUndefined();
  });

  it("ritorna ok:false se setItemSync non persiste e la verifica post-write fallisce", async () => {
    seed([
      { id: "M1", targa: "TI298409", stato: "daFare" },
      { id: "M2", targa: "TI298409", stato: "daFare" },
    ]);
    persistWrites = false;

    const result = await creaGruppoManutenzioni(["M1", "M2"]);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("post-write");
    expect(manutenzioni()[0].gruppoManutenzioneId).toBeUndefined();
    expect(manutenzioni()[1].gruppoManutenzioneId).toBeUndefined();
  });
});

describe("nextManutenzioniDomain gruppoManutenzioneId", () => {
  beforeEach(() => {
    store.clear();
    firestoreDocs.clear();
    persistWrites = true;
  });

  it("propaga gruppoManutenzioneId nel reader legacy e nel reader history", async () => {
    seedFirestore([
      {
        id: "M1",
        targa: "TI298409",
        stato: "daFare",
        descrizione: "Freni",
        data: "2026-05-20",
        gruppoManutenzioneId: "G-MAN-1",
      },
    ]);

    const legacy = await readNextManutenzioniLegacyDataset();
    const snapshot = await readNextMezzoManutenzioniSnapshot("TI298409");

    expect(legacy[0].gruppoManutenzioneId).toBe("G-MAN-1");
    expect(snapshot.historyItems[0].gruppoManutenzioneId).toBe("G-MAN-1");
  });
});
