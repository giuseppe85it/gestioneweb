// PROMPT 42 — T1 — Test del writer di eliminazione manutenzione.
// Verifica: delete per id reale, delete per fingerprint (record senza id reale),
// delete record non trovato (-> false, array invariato), delete ultimo record.
//
// `storageSync` mockato in-memory: isola la logica del writer senza Firestore/barrier.

import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, unknown>();
const silentWriteSkipKeys = new Set<string>();

vi.mock("../../../utils/storageSync", () => ({
  getItemSync: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
  setItemSync: vi.fn((key: string, value: unknown) => {
    if (silentWriteSkipKeys.has(key)) return Promise.resolve();
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

import { deleteNextManutenzioneBusinessRecord } from "../nextManutenzioniDomain";

type RawRecord = Record<string, unknown>;

function seed(records: RawRecord[]): void {
  store.clear();
  silentWriteSkipKeys.clear();
  store.set("@manutenzioni", records);
  store.set("@segnalazioni_autisti_tmp", []);
  store.set("@controlli_mezzo_autisti", []);
}

function readStorico(): RawRecord[] {
  const value = store.get("@manutenzioni");
  return Array.isArray(value) ? (value as RawRecord[]) : [];
}

function readList(key: string): RawRecord[] {
  const value = store.get(key);
  return Array.isArray(value) ? (value as RawRecord[]) : [];
}

describe("deleteNextManutenzioneBusinessRecord — fix Quadro (PROMPT 42)", () => {
  beforeEach(() => {
    store.clear();
    silentWriteSkipKeys.clear();
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

  it("delete con sorgenti collegate: sgancia segnalazioni e controlli prima di eliminare", async () => {
    seed([
      {
        id: "M-LINK",
        targa: "TI100000",
        descrizione: "Lavoro collegato",
        data: "2026-04-01",
        origineRefs: [
          { tipo: "segnalazione", refId: "S-LINK", refKey: "@segnalazioni_autisti_tmp" },
          { tipo: "controllo", refId: "C-LINK", refKey: "@controlli_mezzo_autisti" },
        ],
      },
    ]);
    store.set("@segnalazioni_autisti_tmp", [
      {
        id: "S-LINK",
        linkedLavoroId: "M-LINK",
        linkedMultiple: false,
        stato: "presa_in_carico",
        letta: true,
        dataPresaInCarico: "2026-04-01",
      },
    ]);
    store.set("@controlli_mezzo_autisti", [
      { id: "C-LINK", linkedLavoroId: "M-LINK", linkedMultiple: false, letta: true },
    ]);

    const ok = await deleteNextManutenzioneBusinessRecord("M-LINK");

    expect(ok).toBe(true);
    expect(readStorico()).toHaveLength(0);
    expect(readList("@segnalazioni_autisti_tmp")[0]).toMatchObject({
      linkedLavoroId: null,
      linkedLavoroIds: null,
      linkedMultiple: false,
      stato: "nuova",
      letta: false,
      dataPresaInCarico: null,
    });
    expect(readList("@controlli_mezzo_autisti")[0]).toMatchObject({
      linkedLavoroId: null,
      linkedLavoroIds: null,
      linkedMultiple: false,
      letta: false,
    });
  });

  it("delete senza sorgenti mantiene il comportamento esistente", async () => {
    seed([
      { id: "rec-1", targa: "TI100000", descrizione: "A", data: "2026-01-01" },
      { id: "rec-2", targa: "TI200000", descrizione: "B", data: "2026-02-01" },
    ]);

    const ok = await deleteNextManutenzioneBusinessRecord("rec-2");

    expect(ok).toBe(true);
    expect(readStorico()).toEqual([
      { id: "rec-1", targa: "TI100000", descrizione: "A", data: "2026-01-01" },
    ]);
  });

  it("fallimento scrittura sgancio: il record manutenzione non viene eliminato", async () => {
    seed([
      {
        id: "M-FAIL",
        targa: "TI100000",
        descrizione: "Lavoro collegato",
        data: "2026-04-01",
        origineRefs: [
          { tipo: "segnalazione", refId: "S-FAIL", refKey: "@segnalazioni_autisti_tmp" },
        ],
      },
    ]);
    store.set("@segnalazioni_autisti_tmp", [
      {
        id: "S-FAIL",
        linkedLavoroId: "M-FAIL",
        linkedMultiple: false,
        stato: "presa_in_carico",
        letta: true,
      },
    ]);
    silentWriteSkipKeys.add("@segnalazioni_autisti_tmp");

    await expect(deleteNextManutenzioneBusinessRecord("M-FAIL")).rejects.toThrow(
      "Verifica sgancio sorgente collegata fallita",
    );

    expect(readStorico()).toHaveLength(1);
    expect(readStorico()[0].id).toBe("M-FAIL");
    expect(readList("@segnalazioni_autisti_tmp")[0].linkedLavoroId).toBe("M-FAIL");
  });

  it("sorgente trovata solo per scan linkedLavoroId viene comunque sganciata", async () => {
    seed([{ id: "M-SCAN", targa: "TI100000", descrizione: "Senza backlink", data: "2026-04-01" }]);
    store.set("@segnalazioni_autisti_tmp", [
      {
        id: "S-SCAN",
        linkedLavoroId: "M-SCAN",
        linkedMultiple: false,
        stato: "presa_in_carico",
        letta: true,
      },
    ]);

    const ok = await deleteNextManutenzioneBusinessRecord("M-SCAN");

    expect(ok).toBe(true);
    expect(readStorico()).toHaveLength(0);
    expect(readList("@segnalazioni_autisti_tmp")[0]).toMatchObject({
      linkedLavoroId: null,
      linkedLavoroIds: null,
      stato: "nuova",
      letta: false,
    });
  });
});
