// PROMPT 44 — D1: test del closure orchestrator.
//
// Verifica che la propagazione della chiusura di una manutenzione alla sorgente
// collegata (segnalazione/controllo) avvenga correttamente, sia idempotente e
// no-op quando non c'e' legame.

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
  runWithCloneWriteScopedAllowance: vi.fn(async (_scope: string, fn: () => Promise<unknown>) => fn()),
}));

import { propagateChiusuraToLegame } from "../closureOrchestrator";

type RawRecord = Record<string, unknown>;

function seed(key: string, records: RawRecord[]): void {
  store.set(key, records);
}

function read(key: string): RawRecord[] {
  const value = store.get(key);
  return Array.isArray(value) ? (value as RawRecord[]) : [];
}

describe("closureOrchestrator — propagateChiusuraToLegame (D1)", () => {
  beforeEach(() => {
    store.clear();
  });

  it("manutenzione legata a segnalazione: propaga e chiude la segnalazione", async () => {
    seed("@segnalazioni_autisti_tmp", [
      { id: "seg-1", targa: "TI113417", stato: "presa_in_carico", linkedLavoroId: "man-1" },
    ]);
    const esito = await propagateChiusuraToLegame({
      id: "man-1",
      stato: "eseguita",
      origineTipo: "segnalazione",
      origineRefId: "seg-1",
      origineRefKey: "@segnalazioni_autisti_tmp",
    });
    expect(esito).toMatchObject({
      ok: true,
      propagated: true,
      propagatedCount: 1,
      targetTipo: "segnalazione",
      targetId: "seg-1",
    });
    const segs = read("@segnalazioni_autisti_tmp");
    expect(segs[0].stato).toBe("chiusa");
    expect(segs[0].chiusuraDi).toBe("manutenzione");
    expect(segs[0].chiusuraRefId).toBe("man-1");
    expect(typeof segs[0].chiusuraData).toBe("number");
  });

  it("manutenzione senza legame: no-op, nessun errore", async () => {
    seed("@segnalazioni_autisti_tmp", [
      { id: "seg-1", stato: "presa_in_carico" },
    ]);
    const esito = await propagateChiusuraToLegame({
      id: "man-99",
      stato: "eseguita",
    });
    expect(esito).toEqual({
      ok: true,
      propagated: false,
      reason: "no-legame",
      propagatedCount: 0,
      failures: [],
    });
    expect(read("@segnalazioni_autisti_tmp")[0].stato).toBe("presa_in_carico");
  });

  it("manutenzione legata a controllo KO: propaga e chiude il controllo", async () => {
    seed("@controlli_mezzo_autisti", [
      { id: "ctl-1", targa: "TI113417", stato: "presa_in_carico", linkedLavoroId: "man-2" },
    ]);
    const esito = await propagateChiusuraToLegame({
      id: "man-2",
      stato: "eseguita",
      origineTipo: "controllo",
      origineRefId: "ctl-1",
      origineRefKey: "@controlli_mezzo_autisti",
    });
    expect(esito).toMatchObject({
      ok: true,
      propagated: true,
      propagatedCount: 1,
      targetTipo: "controllo",
      targetId: "ctl-1",
    });
    const ctls = read("@controlli_mezzo_autisti");
    expect(ctls[0].stato).toBe("chiusa");
    expect(ctls[0].chiusuraDi).toBe("manutenzione");
    expect(ctls[0].chiusuraRefId).toBe("man-2");
  });

  it("manutenzione con origineRefs multiple: propaga a tutte le sorgenti", async () => {
    seed("@segnalazioni_autisti_tmp", [
      { id: "seg-1", stato: "presa_in_carico", linkedLavoroId: "man-multi" },
      { id: "seg-2", stato: "presa_in_carico", linkedLavoroId: "man-multi" },
    ]);
    seed("@controlli_mezzo_autisti", [
      { id: "ctl-1", letta: true, linkedLavoroId: "man-multi" },
    ]);

    const esito = await propagateChiusuraToLegame({
      id: "man-multi",
      stato: "eseguita",
      origineRefs: [
        { tipo: "segnalazione", refId: "seg-1", refKey: "@segnalazioni_autisti_tmp" },
        { tipo: "segnalazione", refId: "seg-2", refKey: "@segnalazioni_autisti_tmp" },
        { tipo: "controllo", refId: "ctl-1", refKey: "@controlli_mezzo_autisti" },
      ],
    });

    expect(esito).toMatchObject({
      ok: true,
      propagated: true,
      propagatedCount: 3,
      failures: [],
    });
    expect(read("@segnalazioni_autisti_tmp").map((record) => record.stato)).toEqual([
      "chiusa",
      "chiusa",
    ]);
    expect(read("@controlli_mezzo_autisti")[0].stato).toBe("chiusa");
  });

  it("doppia chiamata: idempotente (stesso patch, nessun danno)", async () => {
    seed("@segnalazioni_autisti_tmp", [
      { id: "seg-x", stato: "presa_in_carico", linkedLavoroId: "man-x" },
    ]);
    const manutenzione = {
      id: "man-x",
      stato: "eseguita",
      origineTipo: "segnalazione",
      origineRefId: "seg-x",
    };
    const first = await propagateChiusuraToLegame(manutenzione, { chiusuraData: 1000 });
    const second = await propagateChiusuraToLegame(manutenzione, { chiusuraData: 2000 });
    expect(first).toMatchObject({ ok: true, propagated: true });
    expect(second).toMatchObject({ ok: true, propagated: true });
    const segs = read("@segnalazioni_autisti_tmp");
    expect(segs).toHaveLength(1);
    expect(segs[0].stato).toBe("chiusa");
    expect(segs[0].chiusuraData).toBe(2000); // ultima scrittura vince, niente duplicati
  });
});
