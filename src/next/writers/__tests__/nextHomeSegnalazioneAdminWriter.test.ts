import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, unknown>();
const scopes: string[] = [];

vi.mock("../../../utils/storageSync", () => ({
  getItemSync: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
  setItemSync: vi.fn((key: string, value: unknown) => {
    store.set(key, value);
    return Promise.resolve();
  }),
}));

vi.mock("../../../utils/cloneWriteBarrier", () => ({
  NEXT_HOME_SEGNALAZIONI_ADMIN_WRITE_SCOPE: "next_home_segnalazioni_admin_write_scope",
  runWithCloneWriteScopedAllowance: vi.fn(async (scope: string, fn: () => Promise<unknown>) => {
    scopes.push(scope);
    return fn();
  }),
}));

import { updateNextHomeSegnalazioneAdmin } from "../nextHomeSegnalazioneAdminWriter";

type RawRecord = Record<string, unknown>;

function readSegnalazioni(): unknown {
  return store.get("@segnalazioni_autisti_tmp");
}

describe("nextHomeSegnalazioneAdminWriter", () => {
  beforeEach(() => {
    store.clear();
    scopes.length = 0;
    vi.restoreAllMocks();
    vi.spyOn(Date, "now").mockReturnValue(2222);
  });

  it("aggiorna solo la segnalazione target e scrive adminEdit.patch", async () => {
    store.set("@segnalazioni_autisti_tmp", [
      { id: "S-1", descrizione: "Vecchia", targa: "TI111", letta: false },
      { id: "S-2", descrizione: "Altra", targa: "TI222" },
    ]);

    const result = await updateNextHomeSegnalazioneAdmin({
      id: "S-1",
      descrizione: "Nuova descrizione",
      letta: true,
      targaCamion: " ti 333 ",
      adminNote: "correzione admin",
    });

    expect(result).toEqual({ ok: true, recordId: "S-1", changed: true });
    expect(scopes).toEqual(["next_home_segnalazioni_admin_write_scope"]);
    const records = readSegnalazioni() as RawRecord[];
    expect(records[0]).toMatchObject({
      id: "S-1",
      descrizione: "Nuova descrizione",
      letta: true,
      targaCamion: "TI333",
      targaMotrice: "TI333",
      adminEdit: {
        edited: true,
        editedAt: 2222,
        editedBy: "admin",
        note: "correzione admin",
        patch: {
          descrizione: { from: "Vecchia", to: "Nuova descrizione" },
          letta: { from: false, to: true },
          targaCamion: { from: null, to: "TI333" },
          targaMotrice: { from: null, to: "TI333" },
        },
      },
    });
    expect(records[1]).toEqual({ id: "S-2", descrizione: "Altra", targa: "TI222" });
  });

  it("preserva shape items", async () => {
    store.set("@segnalazioni_autisti_tmp", { items: [{ id: "S-1", note: "Uno" }], meta: "x" });

    await updateNextHomeSegnalazioneAdmin({ id: "S-1", note: "Due" });

    expect(readSegnalazioni()).toMatchObject({
      items: [{ id: "S-1", note: "Due" }],
      meta: "x",
    });
  });

  it("preserva shape value array", async () => {
    store.set("@segnalazioni_autisti_tmp", { value: [{ id: "S-1", stato: "nuova" }], meta: "x" });

    await updateNextHomeSegnalazioneAdmin({ id: "S-1", stato: "presa_in_carico" });

    expect(readSegnalazioni()).toMatchObject({
      value: [{ id: "S-1", stato: "presa_in_carico" }],
      meta: "x",
    });
  });

  it("preserva shape value.items", async () => {
    store.set("@segnalazioni_autisti_tmp", {
      value: { items: [{ id: "S-1", flagVerifica: false }], page: 1 },
      meta: "x",
    });

    await updateNextHomeSegnalazioneAdmin({ id: "S-1", flagVerifica: true });

    expect(readSegnalazioni()).toMatchObject({
      value: { items: [{ id: "S-1", flagVerifica: true }], page: 1 },
      meta: "x",
    });
  });

  it("rifiuta id mancante o record inesistente senza scrivere", async () => {
    store.set("@segnalazioni_autisti_tmp", [{ id: "S-1", descrizione: "Uno" }]);

    await expect(updateNextHomeSegnalazioneAdmin({ id: "", note: "No" })).resolves.toEqual({
      ok: false,
      reason: "id_mancante",
    });
    await expect(updateNextHomeSegnalazioneAdmin({ id: "S-X", note: "No" })).resolves.toEqual({
      ok: false,
      reason: "record_non_trovato",
    });
    expect(readSegnalazioni()).toEqual([{ id: "S-1", descrizione: "Uno" }]);
    expect(scopes).toEqual([]);
  });
});
