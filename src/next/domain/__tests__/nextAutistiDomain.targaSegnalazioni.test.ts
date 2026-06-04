import { beforeEach, describe, expect, it, vi } from "vitest";

type RawRecord = Record<string, unknown>;

const storageRecords = new Map<string, RawRecord[]>();

vi.mock("../nextUnifiedReadRegistryDomain", () => ({
  readNextUnifiedStorageDocument: vi.fn(({ key }: { key: string }) =>
    Promise.resolve({ records: storageRecords.get(key) ?? [] }),
  ),
  readNextUnifiedCollection: vi.fn(() => Promise.resolve({ records: [] })),
}));

vi.mock("../../autisti/nextAutistiStorageSync", () => ({
  readNextAutistiStorageOverlay: vi.fn(() => undefined),
}));

vi.mock("../../autisti/nextAutistiCloneState", () => ({
  getNextAutistiCloneControlli: vi.fn(() => []),
}));

vi.mock("../../autisti/nextAutistiCloneRichiesteAttrezzature", () => ({
  getNextAutistiCloneRichiesteAttrezzature: vi.fn(() => []),
}));

vi.mock("../../autisti/nextAutistiCloneSegnalazioni", () => ({
  getNextAutistiCloneSegnalazioni: vi.fn(() => []),
}));

import { readNextAutistiReadOnlySnapshot } from "../nextAutistiDomain";

describe("nextAutistiDomain - precedenza targa segnalazioni", () => {
  beforeEach(() => {
    storageRecords.clear();
  });

  it("per una segnalazione rimorchio usa `targa` come targa principale e non `targaCamion`", async () => {
    storageRecords.set("@segnalazioni_autisti_tmp", [
      {
        id: "S-RIM",
        targa: "TI285997",
        targaCamion: "TI324623",
        targaRimorchio: "TI285997",
        ambito: "rimorchio",
        data: "2026-05-20",
        descrizione: "Problema rimorchio",
      },
    ]);

    const snapshot = await readNextAutistiReadOnlySnapshot(Date.now(), {
      includeLocalClone: false,
      includeStorageOverlay: false,
    });

    expect(snapshot.segnalazioniRows[0]).toMatchObject({
      targa: "TI285997",
      targaCamion: "TI324623",
      targaRimorchio: "TI285997",
      ambito: "rimorchio",
    });
    expect(snapshot.signals[0]).toMatchObject({
      mezzoTarga: "TI285997",
      targaMotrice: "TI324623",
      targaRimorchio: "TI285997",
    });
  });

  it("per una segnalazione motrice resta invariata quando `targa` e `targaCamion` coincidono", async () => {
    storageRecords.set("@segnalazioni_autisti_tmp", [
      {
        id: "S-MOT",
        targa: "TI324623",
        targaCamion: "TI324623",
        data: "2026-05-20",
        descrizione: "Problema motrice",
      },
    ]);

    const snapshot = await readNextAutistiReadOnlySnapshot(Date.now(), {
      includeLocalClone: false,
      includeStorageOverlay: false,
    });

    expect(snapshot.segnalazioniRows[0]).toMatchObject({
      targa: "TI324623",
      targaCamion: "TI324623",
      targaRimorchio: null,
    });
    expect(snapshot.signals[0]).toMatchObject({
      mezzoTarga: "TI324623",
      targaMotrice: "TI324623",
    });
  });

  it("se `targa` manca usa fallback `targaRimorchio` prima di `targaCamion`", async () => {
    storageRecords.set("@segnalazioni_autisti_tmp", [
      {
        id: "S-FALLBACK",
        targaCamion: "TI324623",
        targaRimorchio: "TI285997",
        ambito: "rimorchio",
        data: "2026-05-20",
        descrizione: "Fallback rimorchio",
      },
    ]);

    const snapshot = await readNextAutistiReadOnlySnapshot(Date.now(), {
      includeLocalClone: false,
      includeStorageOverlay: false,
    });

    expect(snapshot.segnalazioniRows[0].targa).toBe("TI285997");
    expect(snapshot.signals[0].mezzoTarga).toBe("TI285997");
  });
});
