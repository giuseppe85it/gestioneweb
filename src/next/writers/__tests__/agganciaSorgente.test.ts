// PROMPT 45 T1b — test del writer `agganciaSorgenteAManutenzioneEsistente`.
//
// Mock di storageSync (store in-memory) + cloneWriteBarrier (pass-through).
// Verifica: idempotenza, validazioni (target inesistente, stato non aperto,
// targa incoerente), patch corretto della sola sorgente, nessuna modifica
// del back-link sul target.

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

import { agganciaSorgenteAManutenzioneEsistente } from "../nextManutenzioneDaFareCreateWriter";

type RawRecord = Record<string, unknown>;

function seed(
  manutenzioni: RawRecord[],
  segnalazioni: RawRecord[] = [],
  controlli: RawRecord[] = [],
): void {
  store.clear();
  store.set("@manutenzioni", manutenzioni);
  store.set("@segnalazioni_autisti_tmp", segnalazioni);
  store.set("@controlli_mezzo_autisti", controlli);
}

function readSegnalazioni(): RawRecord[] {
  const value = store.get("@segnalazioni_autisti_tmp");
  return Array.isArray(value) ? (value as RawRecord[]) : [];
}

function readControlli(): RawRecord[] {
  const value = store.get("@controlli_mezzo_autisti");
  return Array.isArray(value) ? (value as RawRecord[]) : [];
}

function readManutenzioni(): RawRecord[] {
  const value = store.get("@manutenzioni");
  return Array.isArray(value) ? (value as RawRecord[]) : [];
}

describe("agganciaSorgenteAManutenzioneEsistente (PROMPT 45 T1)", () => {
  beforeEach(() => {
    store.clear();
  });

  it("A — merge segnalazione: patch sorgente con linkedLavoroId + presa_in_carico, target invariato", async () => {
    seed(
      [{ id: "M1", targa: "TI113417", stato: "daFare", descrizione: "Tagliando" }],
      [
        {
          id: "S1",
          targa: "TI113417",
          autistaNome: "Mario Rossi",
          stato: "nuova",
          letta: false,
        },
      ],
    );
    const res = await agganciaSorgenteAManutenzioneEsistente({
      manutenzioneTargetId: "M1",
      origineTipo: "segnalazione",
      origineRecord: readSegnalazioni()[0],
    });
    expect(res.ok).toBe(true);
    expect(res.manutenzioneId).toBe("M1");

    const segn = readSegnalazioni()[0];
    expect(segn.linkedLavoroId).toBe("M1");
    expect(segn.linkedMultiple).toBe(false);
    expect(segn.stato).toBe("presa_in_carico");
    expect(segn.letta).toBe(true);
    // PROMPT 50 R2: il writer P45 patchSegnalazione non scrive piu' dataPresaInCarico.
    expect(segn.dataPresaInCarico).toBeUndefined();

    // Target aggiornato con back-link multi-origine.
    const tgt = readManutenzioni()[0];
    expect(tgt.id).toBe("M1");
    expect(tgt.stato).toBe("daFare");
    expect(tgt.origineTipo).toBe("segnalazione");
    expect(tgt.origineRefId).toBe("S1");
    expect(tgt.origineRefKey).toBe("@segnalazioni_autisti_tmp");
    expect(tgt.origineRefs).toEqual([
      { tipo: "segnalazione", refId: "S1", refKey: "@segnalazioni_autisti_tmp" },
    ]);
  });

  it("B — merge controllo: patch sorgente con linkedLavoroId + letta", async () => {
    seed(
      [{ id: "M2", targa: "TI113417", stato: "programmata", descrizione: "Gomme" }],
      [],
      [{ id: "C1", targaCamion: "TI113417", check: { freni: false }, letta: false }],
    );
    const res = await agganciaSorgenteAManutenzioneEsistente({
      manutenzioneTargetId: "M2",
      origineTipo: "controllo",
      origineRecord: readControlli()[0],
    });
    expect(res.ok).toBe(true);

    const ctrl = readControlli()[0];
    expect(ctrl.linkedLavoroId).toBe("M2");
    expect(ctrl.letta).toBe(true);

    const tgt = readManutenzioni()[0];
    expect(tgt.origineRefs).toEqual([
      { tipo: "controllo", refId: "C1", refKey: "@controlli_mezzo_autisti" },
    ]);
  });

  it("C — target eseguita: ritorna ok:false con errore esplicito", async () => {
    seed(
      [{ id: "M3", targa: "TI113417", stato: "eseguita", descrizione: "Cambio gomme" }],
      [{ id: "S2", targa: "TI113417", autistaNome: "Luigi" }],
    );
    const res = await agganciaSorgenteAManutenzioneEsistente({
      manutenzioneTargetId: "M3",
      origineTipo: "segnalazione",
      origineRecord: readSegnalazioni()[0],
    });
    expect(res.ok).toBe(false);
    expect(res.error).toContain("chiusa o eseguita");
  });

  it("D — sorgente gia' linked al target: ritorna alreadyLinked, nessuna scrittura nuova", async () => {
    seed(
      [{ id: "M4", targa: "TI113417", stato: "daFare", descrizione: "X" }],
      [
        {
          id: "S3",
          targa: "TI113417",
          linkedLavoroId: "M4",
          linkedMultiple: false,
          letta: true,
          stato: "presa_in_carico",
        },
      ],
    );
    const segnPre = JSON.stringify(readSegnalazioni());
    const res = await agganciaSorgenteAManutenzioneEsistente({
      manutenzioneTargetId: "M4",
      origineTipo: "segnalazione",
      origineRecord: readSegnalazioni()[0],
    });
    expect(res.ok).toBe(true);
    expect(res.alreadyLinked).toBe(true);
    // Sorgente non riscritta.
    expect(JSON.stringify(readSegnalazioni())).toBe(segnPre);
  });

  it("E — target inesistente: errore esplicito", async () => {
    seed([], [{ id: "S4", targa: "TI113417", autistaNome: "L" }]);
    const res = await agganciaSorgenteAManutenzioneEsistente({
      manutenzioneTargetId: "M-INESISTENTE",
      origineTipo: "segnalazione",
      origineRecord: readSegnalazioni()[0],
    });
    expect(res.ok).toBe(false);
    expect(res.error).toContain("non trovata");
  });

  it("F — targa target diversa dalla sorgente: errore safety net", async () => {
    seed(
      [{ id: "M5", targa: "TI999999", stato: "daFare", descrizione: "Y" }],
      [{ id: "S5", targa: "TI113417", autistaNome: "X" }],
    );
    const res = await agganciaSorgenteAManutenzioneEsistente({
      manutenzioneTargetId: "M5",
      origineTipo: "segnalazione",
      origineRecord: readSegnalazioni()[0],
    });
    expect(res.ok).toBe(false);
    expect(res.error).toContain("diversa");
  });

  it("G — sorgente gia' linked ad altra manutenzione: rifiutato per non sovrascrivere", async () => {
    seed(
      [{ id: "M6", targa: "TI113417", stato: "daFare", descrizione: "Z" }],
      [
        {
          id: "S6",
          targa: "TI113417",
          linkedLavoroId: "M-OTHER",
          stato: "presa_in_carico",
          letta: true,
        },
      ],
    );
    const res = await agganciaSorgenteAManutenzioneEsistente({
      manutenzioneTargetId: "M6",
      origineTipo: "segnalazione",
      origineRecord: readSegnalazioni()[0],
    });
    expect(res.ok).toBe(false);
    expect(res.error).toContain("gia' collegata");
  });
});
