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

const CONTROLLI_KEY = "@controlli_mezzo_autisti";

async function readControllo(id: string) {
  const snapshot = await readNextAutistiReadOnlySnapshot(Date.now(), {
    includeLocalClone: false,
    includeStorageOverlay: false,
  });
  const row = snapshot.controlliRows.find((r) => r.id === id);
  if (!row) throw new Error(`controllo ${id} non trovato nello snapshot`);
  return row;
}

/**
 * Congela la simmetria controlli <-> segnalazioni: la derivazione `chiuso`
 * del controllo (nextAutistiDomain.ts) deve riconoscere TUTTE le forme di
 * chiusura riconosciute dalle segnalazioni (vedi segnalazioniOperative.ts e
 * normalizeSegnalazioneSectionItem 600-604): flag forte `chiuso:true`,
 * chiusura strutturata `stato==="chiusa"`, `chiusuraData`, `chiusuraRefId`.
 */
describe("nextAutistiDomain - controllo KO: derivazione `chiuso` allineata alle segnalazioni", () => {
  beforeEach(() => {
    storageRecords.clear();
  });

  it("flag forte legacy: `chiuso: true` => chiuso", async () => {
    storageRecords.set(CONTROLLI_KEY, [
      { id: "C-FORTE", targaCamion: "TI111111", ko: true, chiuso: true },
    ]);
    const row = await readControllo("C-FORTE");
    expect(row.isKo).toBe(true);
    expect(row.chiuso).toBe(true);
  });

  it("chiusura da evento `stato: 'chiusa'` (senza chiuso:true) => chiuso", async () => {
    storageRecords.set(CONTROLLI_KEY, [
      {
        id: "C-STATO",
        targaCamion: "TI222222",
        ko: true,
        stato: "chiusa",
        chiusuraDi: "manutenzione",
        chiusuraRefId: "M-1",
      },
    ]);
    const row = await readControllo("C-STATO");
    expect(row.isKo).toBe(true);
    expect(row.chiuso).toBe(true);
  });

  it("traccia `chiusuraData` (number) => chiuso, e alimenta dataChiusura in fallback", async () => {
    const ms = 1_769_000_000_000;
    storageRecords.set(CONTROLLI_KEY, [
      { id: "C-DATA", targaCamion: "TI333333", ko: true, chiusuraData: ms },
    ]);
    const row = await readControllo("C-DATA");
    expect(row.chiuso).toBe(true);
    expect(row.dataChiusura).toBe(ms);
  });

  it("traccia `chiusuraRefId` => chiuso", async () => {
    storageRecords.set(CONTROLLI_KEY, [
      { id: "C-REF", targaCamion: "TI444444", ko: true, chiusuraRefId: "from-lavoro-x" },
    ]);
    const row = await readControllo("C-REF");
    expect(row.chiuso).toBe(true);
  });

  it("controllo KO senza alcun timbro di chiusura => aperto (chiuso=false)", async () => {
    storageRecords.set(CONTROLLI_KEY, [
      { id: "C-APERTO", targaCamion: "TI555555", ko: true },
    ]);
    const row = await readControllo("C-APERTO");
    expect(row.isKo).toBe(true);
    expect(row.chiuso).toBe(false);
    expect(row.dataChiusura).toBeNull();
  });

  it("dataChiusura legacy ha precedenza sul fallback chiusuraData", async () => {
    const legacy = 1_700_000_000_000;
    const evento = 1_769_000_000_000;
    storageRecords.set(CONTROLLI_KEY, [
      {
        id: "C-PREC",
        targaCamion: "TI666666",
        ko: true,
        chiuso: true,
        dataChiusura: legacy,
        chiusuraData: evento,
      },
    ]);
    const row = await readControllo("C-PREC");
    expect(row.dataChiusura).toBe(legacy);
  });
});
