// PROMPT 50 R2 — test del writer esplicito `segnaPresaInCaricoSegnalazione`.

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

import { segnaPresaInCaricoSegnalazione } from "../presaInCaricoSegnalazioneWriter";

type RawRecord = Record<string, unknown>;

function seed(segnalazioni: RawRecord[]): void {
  store.clear();
  store.set("@segnalazioni_autisti_tmp", segnalazioni);
}

function segnalazioni(): RawRecord[] {
  return (store.get("@segnalazioni_autisti_tmp") as RawRecord[]) ?? [];
}

describe("segnaPresaInCaricoSegnalazione (PROMPT 50 R2)", () => {
  beforeEach(() => {
    store.clear();
  });

  it("A — segna presa in carico una segnalazione 'nuova': scrive dataPresaInCarico, stato='presa_in_carico', letta=true", async () => {
    seed([{ id: "S1", stato: "nuova", letta: false }]);
    const res = await segnaPresaInCaricoSegnalazione({
      segnalazioneId: "S1",
      dataPresaInCarico: "2026-05-15",
    });
    expect(res.ok).toBe(true);
    const s = segnalazioni()[0];
    expect(s.dataPresaInCarico).toBe("2026-05-15");
    expect(s.stato).toBe("presa_in_carico");
    expect(s.letta).toBe(true);
  });

  it("B — idempotente: se dataPresaInCarico gia' valorizzata -> alreadyMarked, zero scritture", async () => {
    seed([
      { id: "S2", stato: "presa_in_carico", letta: true, dataPresaInCarico: "2026-05-08" },
    ]);
    const pre = JSON.stringify(segnalazioni());
    const res = await segnaPresaInCaricoSegnalazione({
      segnalazioneId: "S2",
      dataPresaInCarico: "2026-05-15",
    });
    expect(res.ok).toBe(true);
    expect(res.alreadyMarked).toBe(true);
    expect(JSON.stringify(segnalazioni())).toBe(pre);
  });

  it("C — segnalazione inesistente: errore", async () => {
    seed([]);
    const res = await segnaPresaInCaricoSegnalazione({
      segnalazioneId: "S-INESISTENTE",
    });
    expect(res.ok).toBe(false);
    expect(res.error).toContain("non trovata");
  });

  it("D — default `dataPresaInCarico` = toISO(new Date()) quando non passato (azione utente esplicita)", async () => {
    seed([{ id: "S3", stato: "nuova", letta: false }]);
    const res = await segnaPresaInCaricoSegnalazione({ segnalazioneId: "S3" });
    expect(res.ok).toBe(true);
    const s = segnalazioni()[0];
    expect(typeof s.dataPresaInCarico).toBe("string");
    expect((s.dataPresaInCarico as string).length).toBeGreaterThan(0);
  });
});
