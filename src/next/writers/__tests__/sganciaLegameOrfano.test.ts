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

import { sganciaLegameManutenzione, sganciaLegameOrfano } from "../sganciaLegameOrfanoWriter";

type RawRecord = Record<string, unknown>;

function seed(
  manutenzioni: RawRecord[] = [],
  segnalazioni: RawRecord[] = [],
  controlli: RawRecord[] = [],
): void {
  store.clear();
  store.set("@manutenzioni", manutenzioni);
  store.set("@segnalazioni_autisti_tmp", segnalazioni);
  store.set("@controlli_mezzo_autisti", controlli);
}

function manutenzioni(): RawRecord[] {
  return (store.get("@manutenzioni") as RawRecord[]) ?? [];
}

function segnalazioni(): RawRecord[] {
  return (store.get("@segnalazioni_autisti_tmp") as RawRecord[]) ?? [];
}

function controlli(): RawRecord[] {
  return (store.get("@controlli_mezzo_autisti") as RawRecord[]) ?? [];
}

describe("sganciaLegameOrfano / sganciaLegameManutenzione", () => {
  beforeEach(() => {
    store.clear();
  });

  it("sgancio segnalazione con linkedLavoroId orfano: cancella legame e ripristina stato", async () => {
    seed(
      [{ id: "M-EXISTING", targa: "TI113417", stato: "daFare" }],
      [
        {
          id: "S1",
          targa: "TI113417",
          linkedLavoroId: "M-ORFANO",
          linkedMultiple: false,
          stato: "presa_in_carico",
          letta: true,
          dataPresaInCarico: "2026-05-08",
          autistaNome: "Mario Rossi",
        },
      ],
    );
    const res = await sganciaLegameOrfano({ sorgenteId: "S1", sorgenteTipo: "segnalazione" });
    expect(res.ok).toBe(true);

    const segn = segnalazioni()[0];
    expect(segn.linkedLavoroId).toBeNull();
    expect(segn.linkedLavoroIds).toBeNull();
    expect(segn.linkedMultiple).toBe(false);
    expect(segn.dataPresaInCarico).toBeNull();
    expect(segn.stato).toBe("nuova");
    expect(segn.letta).toBe(false);
    expect(segn.autistaNome).toBe("Mario Rossi");
    expect(segn.targa).toBe("TI113417");
  });

  it("idempotente: sorgente senza legami -> alreadyClean", async () => {
    seed([], [{ id: "S2", targa: "TI113417", stato: "nuova", letta: false }]);
    const segnPre = JSON.stringify(segnalazioni());
    const res = await sganciaLegameOrfano({ sorgenteId: "S2", sorgenteTipo: "segnalazione" });
    expect(res.ok).toBe(true);
    expect(res.alreadyClean).toBe(true);
    expect(JSON.stringify(segnalazioni())).toBe(segnPre);
  });

  it("legame non orfano nel writer orfano: errore esplicito, zero scritture", async () => {
    seed(
      [{ id: "M-EXISTS", targa: "TI113417", stato: "daFare" }],
      [{ id: "S3", targa: "TI113417", linkedLavoroId: "M-EXISTS", linkedMultiple: false, stato: "presa_in_carico" }],
    );
    const segnPre = JSON.stringify(segnalazioni());
    const res = await sganciaLegameOrfano({ sorgenteId: "S3", sorgenteTipo: "segnalazione" });
    expect(res.ok).toBe(false);
    expect(res.error).toContain("non e' orfano");
    expect(JSON.stringify(segnalazioni())).toBe(segnPre);
  });

  it("sgancio controllo orfano: cancella linkedLavoroId, letta=false, no campo stato", async () => {
    seed(
      [],
      [],
      [
        {
          id: "C1",
          targaCamion: "TI113417",
          linkedLavoroId: "M-ORFANO",
          linkedMultiple: false,
          letta: true,
          check: { gomme: false },
        },
      ],
    );
    const res = await sganciaLegameOrfano({ sorgenteId: "C1", sorgenteTipo: "controllo" });
    expect(res.ok).toBe(true);

    const ctrl = controlli()[0];
    expect(ctrl.linkedLavoroId).toBeNull();
    expect(ctrl.letta).toBe(false);
    expect(ctrl.stato).toBeUndefined();
    expect((ctrl.check as Record<string, unknown>).gomme).toBe(false);
  });

  it("sgancio manuale valido: cancella source e rimuove origine dal target", async () => {
    seed(
      [
        {
          id: "M-VALID",
          targa: "TI113417",
          stato: "daFare",
          origineRefs: [
            { tipo: "segnalazione", refId: "S-VALID", refKey: "@segnalazioni_autisti_tmp" },
          ],
          origineTipo: "segnalazione",
          origineRefId: "S-VALID",
          origineRefKey: "@segnalazioni_autisti_tmp",
        },
      ],
      [
        {
          id: "S-VALID",
          targa: "TI113417",
          linkedLavoroId: "M-VALID",
          linkedMultiple: false,
          stato: "presa_in_carico",
          letta: true,
        },
      ],
    );
    const res = await sganciaLegameManutenzione({
      sorgenteId: "S-VALID",
      sorgenteTipo: "segnalazione",
      manutenzioneId: "M-VALID",
    });
    expect(res.ok).toBe(true);
    expect(res.removedIds).toEqual(["M-VALID"]);
    const segn = segnalazioni()[0];
    expect(segn.linkedLavoroId).toBeNull();
    expect(segn.linkedLavoroIds).toBeNull();
    expect(segn.stato).toBe("nuova");
    const target = manutenzioni()[0];
    expect(target.origineRefs).toEqual([]);
    expect(target.origineRefId).toBeNull();
  });

  it("sorgente inesistente: errore", async () => {
    seed([], []);
    const res = await sganciaLegameOrfano({ sorgenteId: "S-INESISTENTE", sorgenteTipo: "segnalazione" });
    expect(res.ok).toBe(false);
    expect(res.error).toContain("non trovata");
  });
});
