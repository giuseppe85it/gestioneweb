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
  NEXT_HOME_LUOGO_MEZZO_WRITE_SCOPE: "next_home_luogo_mezzo_write_scope",
  runWithCloneWriteScopedAllowance: vi.fn(async (_scope: string, fn: () => Promise<unknown>) => fn()),
}));

import { saveNextHomeLuogoMezzo } from "../nextHomeLuogoMezzoWriter";

type RawRecord = Record<string, unknown>;

function readEventi(): unknown {
  return store.get("@storico_eventi_operativi");
}

describe("nextHomeLuogoMezzoWriter", () => {
  beforeEach(() => {
    store.clear();
    vi.restoreAllMocks();
  });

  it("aggiorna solo il luogo dell'evento esistente per id", async () => {
    store.set("@storico_eventi_operativi", [
      { id: "evt-1", tipo: "CAMBIO_ASSETTO", timestamp: 100, luogo: "Vecchio", extra: "ok" },
    ]);

    const result = await saveNextHomeLuogoMezzo({
      targa: "TI123",
      luogo: "Deposito",
      assetKind: "rimorchio",
      eventId: "evt-1",
    });

    expect(result).toEqual({ ok: true, mode: "updated", recordId: "evt-1" });
    const eventi = readEventi() as RawRecord[];
    expect(eventi[0]).toMatchObject({ id: "evt-1", timestamp: 100, luogo: "Deposito", extra: "ok" });
  });

  it("usa eventIndex come fallback quando l'id non e trovato", async () => {
    store.set("@storico_eventi_operativi", [
      { id: "evt-1", luogo: "Uno" },
      { id: "evt-2", luogo: "Due" },
    ]);

    const result = await saveNextHomeLuogoMezzo({
      targa: "TI123",
      luogo: "Piazzale",
      assetKind: "motrice_o_trattore",
      eventId: "missing",
      eventIndex: 1,
    });

    expect(result).toEqual({ ok: true, mode: "updated", recordId: "evt-2" });
    const eventi = readEventi() as RawRecord[];
    expect(eventi[0].luogo).toBe("Uno");
    expect(eventi[1].luogo).toBe("Piazzale");
  });

  it("crea un evento admin se non esiste un evento collegato", async () => {
    vi.spyOn(Date, "now").mockReturnValue(123456);
    store.set("@storico_eventi_operativi", []);

    const result = await saveNextHomeLuogoMezzo({
      targa: " ti 123 ",
      luogo: "Officina",
      assetKind: "rimorchio",
    });

    expect(result).toEqual({
      ok: true,
      mode: "created",
      recordId: "CAMBIO_ASSETTO-ADMIN-123456-TI123",
    });
    const eventi = readEventi() as RawRecord[];
    expect(eventi[0]).toMatchObject({
      id: "CAMBIO_ASSETTO-ADMIN-123456-TI123",
      tipo: "CAMBIO_ASSETTO",
      timestamp: 123456,
      badgeAutista: "ADMIN",
      autistaNome: "UFFICIO",
      luogo: "Officina",
      source: "Home NEXT",
    });
    expect(eventi[0].prima).toMatchObject({ targaRimorchio: "TI123", rimorchio: "TI123" });
    expect(eventi[0].dopo).toMatchObject({ targaRimorchio: "TI123", rimorchio: "TI123" });
  });

  it("preserva shape value", async () => {
    store.set("@storico_eventi_operativi", { value: [{ id: "evt-1", luogo: "Uno" }], meta: "x" });

    await saveNextHomeLuogoMezzo({
      targa: "TI123",
      luogo: "Nuovo",
      assetKind: "rimorchio",
      eventId: "evt-1",
    });

    expect(readEventi()).toEqual({ value: [{ id: "evt-1", luogo: "Nuovo" }], meta: "x" });
  });

  it("preserva shape items", async () => {
    store.set("@storico_eventi_operativi", { items: [{ id: "evt-1", luogo: "Uno" }], meta: "x" });

    await saveNextHomeLuogoMezzo({
      targa: "TI123",
      luogo: "Nuovo",
      assetKind: "rimorchio",
      eventId: "evt-1",
    });

    expect(readEventi()).toEqual({ items: [{ id: "evt-1", luogo: "Nuovo" }], meta: "x" });
  });

  it("rifiuta targa o luogo vuoti senza scrivere", async () => {
    store.set("@storico_eventi_operativi", [{ id: "evt-1", luogo: "Uno" }]);

    await expect(
      saveNextHomeLuogoMezzo({ targa: "", luogo: "Nuovo", assetKind: "rimorchio" }),
    ).resolves.toEqual({ ok: false, reason: "targa_mancante" });
    await expect(
      saveNextHomeLuogoMezzo({ targa: "TI123", luogo: " ", assetKind: "rimorchio" }),
    ).resolves.toEqual({ ok: false, reason: "luogo_mancante" });
    expect(readEventi()).toEqual([{ id: "evt-1", luogo: "Uno" }]);
  });
});
