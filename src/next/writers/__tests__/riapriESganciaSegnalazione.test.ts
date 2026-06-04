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

import { riapriESganciaSegnalazione } from "../nextChiusuraEventoWriter";

type RawRecord = Record<string, unknown>;

function seed(manutenzioni: RawRecord[] = [], segnalazioni: RawRecord[] = []): void {
  store.clear();
  store.set("@manutenzioni", manutenzioni);
  store.set("@segnalazioni_autisti_tmp", segnalazioni);
}

function manutenzioni(): RawRecord[] {
  return (store.get("@manutenzioni") as RawRecord[]) ?? [];
}

function segnalazioni(): RawRecord[] {
  return (store.get("@segnalazioni_autisti_tmp") as RawRecord[]) ?? [];
}

describe("riapriESganciaSegnalazione", () => {
  beforeEach(() => {
    store.clear();
  });

  it("riapre una segnalazione chiusa manualmente e preserva i campi operativi", async () => {
    seed([], [
      {
        id: "S-MAN",
        chiusa: true,
        dataChiusura: 1710000000000,
        chiusa_by: "Centro Controllo",
        stato: "chiusa",
        letta: true,
        dataPresaInCarico: "2026-05-10T08:00:00.000Z",
      },
    ]);

    const result = await riapriESganciaSegnalazione("S-MAN");

    expect(result.ok).toBe(true);
    expect(result.updated).toBe(1);
    expect(segnalazioni()[0]).toMatchObject({
      chiusa: false,
      dataChiusura: null,
      chiusa_by: null,
      stato: "aperta",
      chiusuraDi: null,
      chiusuraRefId: null,
      chiusuraData: null,
      linkedLavoroId: null,
      linkedLavoroIds: null,
      linkedMultiple: false,
      letta: true,
      dataPresaInCarico: "2026-05-10T08:00:00.000Z",
    });
  });

  it("riapre una segnalazione chiusa da evento manutenzione e sgancia il target", async () => {
    seed(
      [
        {
          id: "M1",
          origineTipo: "segnalazione",
          origineRefId: "S-EVT",
          origineRefKey: "@segnalazioni_autisti_tmp",
          origineRefs: [
            { tipo: "segnalazione", refId: "S-EVT", refKey: "@segnalazioni_autisti_tmp" },
          ],
        },
      ],
      [
        {
          id: "S-EVT",
          stato: "chiusa",
          chiusuraDi: "manutenzione",
          chiusuraRefId: "M1",
          chiusuraData: 1710000000000,
          linkedLavoroId: "M1",
          linkedMultiple: false,
        },
      ],
    );

    const result = await riapriESganciaSegnalazione("S-EVT");

    expect(result.ok).toBe(true);
    expect(result.updated).toBe(2);
    expect(segnalazioni()[0]).toMatchObject({
      stato: "aperta",
      chiusa: false,
      chiusuraDi: null,
      chiusuraRefId: null,
      chiusuraData: null,
      linkedLavoroId: null,
      linkedLavoroIds: null,
      linkedMultiple: false,
    });
    expect(manutenzioni()[0]).toMatchObject({
      origineRefs: [],
      origineTipo: null,
      origineRefId: null,
      origineRefKey: null,
    });
  });

  it("sgancia da piu manutenzioni mantenendo le altre origini sui target", async () => {
    seed(
      [
        {
          id: "M1",
          origineRefs: [
            { tipo: "controllo", refId: "C1", refKey: "@controlli_mezzo_autisti" },
            { tipo: "segnalazione", refId: "S-MULTI", refKey: "@segnalazioni_autisti_tmp" },
          ],
          origineTipo: "controllo",
          origineRefId: "C1",
          origineRefKey: "@controlli_mezzo_autisti",
        },
        {
          id: "M2",
          origineRefs: [
            { tipo: "segnalazione", refId: "S-MULTI", refKey: "@segnalazioni_autisti_tmp" },
          ],
          origineTipo: "segnalazione",
          origineRefId: "S-MULTI",
          origineRefKey: "@segnalazioni_autisti_tmp",
        },
      ],
      [
        {
          id: "S-MULTI",
          chiusa: true,
          stato: "chiusa",
          linkedLavoroIds: ["M1", "M2"],
          linkedMultiple: true,
        },
      ],
    );

    const result = await riapriESganciaSegnalazione("S-MULTI");

    expect(result.ok).toBe(true);
    expect(result.updated).toBe(3);
    expect(segnalazioni()[0].linkedLavoroIds).toBeNull();
    expect(manutenzioni()[0]).toMatchObject({
      origineRefs: [{ tipo: "controllo", refId: "C1", refKey: "@controlli_mezzo_autisti" }],
      origineTipo: "controllo",
      origineRefId: "C1",
      origineRefKey: "@controlli_mezzo_autisti",
    });
    expect(manutenzioni()[1]).toMatchObject({
      origineRefs: [],
      origineTipo: null,
      origineRefId: null,
      origineRefKey: null,
    });
  });

  it("se non ha legami riapre solo la segnalazione", async () => {
    seed([{ id: "M-ALTRO", origineRefId: "S-ALTRO" }], [
      { id: "S-SOLO", chiusa: true, stato: "chiusa" },
    ]);

    const result = await riapriESganciaSegnalazione("S-SOLO");

    expect(result.ok).toBe(true);
    expect(result.updated).toBe(1);
    expect(manutenzioni()[0]).toMatchObject({ id: "M-ALTRO", origineRefId: "S-ALTRO" });
    expect(segnalazioni()[0]).toMatchObject({ stato: "aperta", chiusa: false });
  });

  it("riapre comunque la sorgente e segnala failure se un target linkato manca", async () => {
    seed([], [
      {
        id: "S-ORFANA",
        chiusa: true,
        stato: "chiusa",
        linkedLavoroId: "M-MANCANTE",
      },
    ]);

    const result = await riapriESganciaSegnalazione("S-ORFANA");

    expect(result.ok).toBe(false);
    expect(result.updated).toBe(1);
    expect(result.failures).toEqual(["Manutenzione collegata non trovata: M-MANCANTE"]);
    expect(segnalazioni()[0]).toMatchObject({
      stato: "aperta",
      chiusa: false,
      linkedLavoroId: null,
      linkedLavoroIds: null,
      linkedMultiple: false,
    });
  });
});
