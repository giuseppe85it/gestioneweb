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

import { agganciaSegnalazioneAManutenzioneEsistente } from "../agganciaSegnalazioneAManutenzioneEsistenteWriter";

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

describe("agganciaSegnalazioneAManutenzioneEsistente", () => {
  beforeEach(() => {
    store.clear();
  });

  it("target daFare stand-alone + segnalazione: aggancia e scrive origineRefs", async () => {
    seed(
      [{ id: "M1", targa: "TI113417", stato: "daFare", descrizione: "Tagliando" }],
      [{ id: "S1", targa: "TI113417", autistaNome: "Mario Rossi", stato: "nuova", letta: false }],
    );
    const res = await agganciaSegnalazioneAManutenzioneEsistente({
      sorgenteId: "S1",
      sorgenteTipo: "segnalazione",
      manutenzioneTargetId: "M1",
    });
    expect(res.ok).toBe(true);
    expect(res.manutenzioneId).toBe("M1");
    expect(res.chiusuraPropagata).toBe(false);

    const segn = segnalazioni()[0];
    expect(segn.linkedLavoroId).toBe("M1");
    expect(segn.linkedLavoroIds).toBeNull();
    expect(segn.stato).toBe("presa_in_carico");
    expect(segn.letta).toBe(true);
    expect(segn.dataPresaInCarico).toBeUndefined();

    const target = manutenzioni()[0];
    expect(target.origineTipo).toBe("segnalazione");
    expect(target.origineRefId).toBe("S1");
    expect(target.origineRefKey).toBe("@segnalazioni_autisti_tmp");
    expect(target.origineRefs).toEqual([
      { tipo: "segnalazione", refId: "S1", refKey: "@segnalazioni_autisti_tmp" },
    ]);
  });

  it("target eseguita: aggancia e propaga chiusura ereditando la data manutenzione", async () => {
    seed(
      [{ id: "M2", targa: "TI113417", stato: "eseguita", descrizione: "Cambio gomme", data: "2026-05-12" }],
      [{ id: "S2", targa: "TI113417", autistaNome: "Riccardo F.", stato: "nuova", letta: false }],
    );
    const res = await agganciaSegnalazioneAManutenzioneEsistente({
      sorgenteId: "S2",
      sorgenteTipo: "segnalazione",
      manutenzioneTargetId: "M2",
    });
    expect(res.ok).toBe(true);
    expect(res.chiusuraPropagata).toBe(true);

    const segn = segnalazioni()[0];
    expect(segn.stato).toBe("chiusa");
    expect(segn.chiusuraDi).toBe("manutenzione");
    expect(segn.chiusuraRefId).toBe("M2");
    expect(segn.chiusuraData).toBe(new Date(2026, 4, 12, 0, 0, 0, 0).getTime());

    const target = manutenzioni()[0];
    expect(target.origineRefs).toEqual([
      { tipo: "segnalazione", refId: "S2", refKey: "@segnalazioni_autisti_tmp" },
    ]);
  });

  it("idempotente: sorgente gia' linked e target gia' coerente -> alreadyLinked", async () => {
    seed(
      [
        {
          id: "M3",
          targa: "TI113417",
          stato: "daFare",
          descrizione: "X",
          origineRefs: [{ tipo: "segnalazione", refId: "S3", refKey: "@segnalazioni_autisti_tmp" }],
          origineTipo: "segnalazione",
          origineRefId: "S3",
          origineRefKey: "@segnalazioni_autisti_tmp",
        },
      ],
      [{ id: "S3", targa: "TI113417", linkedLavoroId: "M3", linkedMultiple: false, stato: "presa_in_carico", letta: true }],
    );
    const segnPre = JSON.stringify(segnalazioni());
    const manuPre = JSON.stringify(manutenzioni());
    const res = await agganciaSegnalazioneAManutenzioneEsistente({
      sorgenteId: "S3",
      sorgenteTipo: "segnalazione",
      manutenzioneTargetId: "M3",
    });
    expect(res.ok).toBe(true);
    expect(res.alreadyLinked).toBe(true);
    expect(JSON.stringify(segnalazioni())).toBe(segnPre);
    expect(JSON.stringify(manutenzioni())).toBe(manuPre);
  });

  it("cambio link: sposta la sorgente su M-NEW e mantiene il mirror legacy del primo origin", async () => {
    seed(
      [
        {
          id: "M-NEW",
          targa: "TI113417",
          stato: "daFare",
          descrizione: "Nuovo target",
          origineTipo: "controllo",
          origineRefId: "C-ALTRA",
          origineRefKey: "@controlli_mezzo_autisti",
        },
      ],
      [{ id: "S4", targa: "TI113417", linkedLavoroId: "M-OLD", linkedMultiple: false, stato: "presa_in_carico" }],
    );
    const res = await agganciaSegnalazioneAManutenzioneEsistente({
      sorgenteId: "S4",
      sorgenteTipo: "segnalazione",
      manutenzioneTargetId: "M-NEW",
    });
    expect(res.ok).toBe(true);
    expect(res.previousLinkedId).toBe("M-OLD");
    expect(segnalazioni()[0].linkedLavoroId).toBe("M-NEW");
    expect(segnalazioni()[0].linkedLavoroIds).toBeNull();

    const target = manutenzioni()[0];
    expect(target.origineRefs).toEqual([
      { tipo: "controllo", refId: "C-ALTRA", refKey: "@controlli_mezzo_autisti" },
      { tipo: "segnalazione", refId: "S4", refKey: "@segnalazioni_autisti_tmp" },
    ]);
    expect(target.origineTipo).toBe("controllo");
    expect(target.origineRefId).toBe("C-ALTRA");
  });

  it("target inesistente: errore esplicito, zero scritture", async () => {
    seed([], [{ id: "S5", targa: "TI113417" }]);
    const segnPre = JSON.stringify(segnalazioni());
    const res = await agganciaSegnalazioneAManutenzioneEsistente({
      sorgenteId: "S5",
      sorgenteTipo: "segnalazione",
      manutenzioneTargetId: "M-INESISTENTE",
    });
    expect(res.ok).toBe(false);
    expect(res.error).toContain("non trovata");
    expect(JSON.stringify(segnalazioni())).toBe(segnPre);
  });

  it("aggancio controllo a target daFare: linkedLavoroId + origineRefs, senza stato/dataPresaInCarico", async () => {
    seed(
      [{ id: "M6", targa: "TI113417", stato: "daFare", descrizione: "Test" }],
      [],
      [{ id: "C6", targaCamion: "TI113417", check: { freni: false }, letta: false }],
    );
    const res = await agganciaSegnalazioneAManutenzioneEsistente({
      sorgenteId: "C6",
      sorgenteTipo: "controllo",
      manutenzioneTargetId: "M6",
    });
    expect(res.ok).toBe(true);
    const ctrl = controlli()[0];
    expect(ctrl.linkedLavoroId).toBe("M6");
    expect(ctrl.letta).toBe(true);
    expect(ctrl.stato).toBeUndefined();
    expect(ctrl.dataPresaInCarico).toBeUndefined();
    expect(manutenzioni()[0].origineRefs).toEqual([
      { tipo: "controllo", refId: "C6", refKey: "@controlli_mezzo_autisti" },
    ]);
  });
});
