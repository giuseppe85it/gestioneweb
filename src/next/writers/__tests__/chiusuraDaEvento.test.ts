// PROMPT 44 — D4: test fallback fingerprint nella chiusura da evento.
//
// `storageSync` e' mockato con uno store in-memory: si isola la logica del writer
// (match per id, match per fingerprint, no-match) senza Firestore ne' barrier.

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

import { chiudiManutenzioneDaEvento } from "../nextChiusuraEventoWriter";

type RawRecord = Record<string, unknown>;

function seed(records: RawRecord[]): void {
  store.clear();
  store.set("@manutenzioni", records);
}

function readStorico(): RawRecord[] {
  const value = store.get("@manutenzioni");
  return Array.isArray(value) ? (value as RawRecord[]) : [];
}

describe("nextChiusuraEventoWriter — chiusura manutenzione da evento (D4)", () => {
  beforeEach(() => {
    store.clear();
  });

  it("match per id reale: chiude il record e scrive la traccia chiusura", async () => {
    seed([
      { id: "rec-1", targa: "TI113417", descrizione: "Cambio gomme", data: "2026-05-08", stato: "daFare" },
      { id: "rec-2", targa: "TI113417", descrizione: "Altro", data: "2026-05-01", stato: "eseguita" },
    ]);
    const result = await chiudiManutenzioneDaEvento("rec-1", "gomme_evento", "evt-99");
    expect(result.ok).toBe(true);
    expect(result.updated).toBe(1);
    const storico = readStorico();
    expect(storico[0].stato).toBe("chiusa_da_evento");
    expect(storico[0].chiusuraDi).toBe("gomme_evento");
    expect(storico[0].chiusuraRefId).toBe("evt-99");
    expect(typeof storico[0].chiusuraData).toBe("number");
    expect(storico[1].stato).toBe("eseguita");
  });

  it("record senza id reale, match per fingerprint: chiude col fallback", async () => {
    // Record legacy migrato: nessun campo `id` reale. Solo fingerprint identifica.
    seed([
      { targa: "TI113417", descrizione: "Cambio gomme", data: "2026-05-08", stato: "daFare" },
      { id: "rec-altro", targa: "TI113417", descrizione: "Altro", data: "2026-05-01", stato: "eseguita" },
    ]);
    const result = await chiudiManutenzioneDaEvento(
      "manutenzione:TI113417:0", // id sintetico per indice (PROMPT 41) — non matcha nulla
      "gomme_evento",
      "evt-100",
      undefined,
      { targa: "TI113417", data: "2026-05-08", descrizione: "Cambio gomme", stato: "daFare" },
    );
    expect(result.ok).toBe(true);
    expect(result.updated).toBe(1);
    const storico = readStorico();
    expect(storico[0].stato).toBe("chiusa_da_evento");
    expect(storico[0].chiusuraDi).toBe("gomme_evento");
    expect(storico[0].chiusuraRefId).toBe("evt-100");
    expect(storico[1].stato).toBe("eseguita"); // intatto
  });

  it("nessun match (id sconosciuto, nessun fingerprint compatibile): lista invariata", async () => {
    seed([
      { id: "rec-1", targa: "TI113417", descrizione: "Cambio gomme", data: "2026-05-08", stato: "daFare" },
    ]);
    const before = JSON.stringify(readStorico());
    const result = await chiudiManutenzioneDaEvento(
      "id-inesistente",
      "gomme_evento",
      "evt-101",
      undefined,
      { targa: "TG999999", data: "1999-01-01", descrizione: "Inesistente", stato: null },
    );
    expect(result.ok).toBe(false);
    expect(result.updated).toBe(0);
    expect(JSON.stringify(readStorico())).toBe(before);
  });
});
