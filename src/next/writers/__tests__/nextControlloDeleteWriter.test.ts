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

vi.mock("../../../firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: (_db: unknown, collection: string, key: string) => ({ collection, key }),
  getDoc: vi.fn((reference: { key: string }) =>
    Promise.resolve({
      exists: () => store.has(reference.key),
      data: () => store.get(reference.key),
    }),
  ),
}));

import { deleteControlloAutista } from "../nextControlloDeleteWriter";

type RawRecord = Record<string, unknown>;

function seed(args: { controlli?: RawRecord[]; manutenzioni?: RawRecord[] }): void {
  store.clear();
  store.set("@controlli_mezzo_autisti", args.controlli ?? []);
  store.set("@manutenzioni", args.manutenzioni ?? []);
}

function readList(key: string): RawRecord[] {
  const value = store.get(key);
  return Array.isArray(value) ? (value as RawRecord[]) : [];
}

describe("nextControlloDeleteWriter", () => {
  beforeEach(() => {
    seed({});
  });

  it("elimina un controllo non collegato", async () => {
    seed({
      controlli: [
        { id: "C-1", note: "Freni" },
        { id: "C-2", note: "Luci" },
      ],
    });

    const result = await deleteControlloAutista({ controlloId: "C-1" });

    expect(result.ok).toBe(true);
    expect(readList("@controlli_mezzo_autisti").map((r) => r.id)).toEqual(["C-2"]);
    expect(readList("@manutenzioni")).toEqual([]);
  });

  it("ripulisce il back-link orfano: manutenzione collegata via origineRefs al controllo", async () => {
    seed({
      controlli: [{ id: "C-ORF", note: "Gomme" }],
      manutenzioni: [
        {
          id: "M-ORF",
          stato: "eseguita",
          origineTipo: "controllo",
          origineRefId: "C-ORF",
          origineRefKey: "@controlli_mezzo_autisti",
          origineRefs: [
            { tipo: "controllo", refId: "C-ORF", refKey: "@controlli_mezzo_autisti" },
          ],
        },
        { id: "M-ALTRA", stato: "daFare", descrizione: "Non collegata" },
      ],
    });

    const result = await deleteControlloAutista({ controlloId: "C-ORF" });

    expect(result.ok).toBe(true);
    expect(result.detachedManutenzioneIds).toEqual(["M-ORF"]);
    expect(readList("@controlli_mezzo_autisti")).toEqual([]);
    const manutenzioni = readList("@manutenzioni");
    expect(manutenzioni[0]).toMatchObject({
      id: "M-ORF",
      stato: "eseguita",
      origineTipo: null,
      origineRefId: null,
      origineRefKey: null,
      origineRefs: [],
    });
    expect(manutenzioni[1]).toMatchObject({ id: "M-ALTRA", stato: "daFare" });
  });

  it("ripulisce anche il forward-link (controllo.linkedLavoroId -> manutenzione)", async () => {
    seed({
      controlli: [
        {
          id: "C-FWD",
          note: "Sterzo",
          linkedLavoroId: "M-FWD",
        },
      ],
      manutenzioni: [
        {
          id: "M-FWD",
          stato: "daFare",
          origineTipo: "controllo",
          origineRefId: "C-FWD",
          origineRefKey: "@controlli_mezzo_autisti",
          origineRefs: [
            { tipo: "controllo", refId: "C-FWD", refKey: "@controlli_mezzo_autisti" },
          ],
        },
      ],
    });

    const result = await deleteControlloAutista({ controlloId: "C-FWD" });

    expect(result.ok).toBe(true);
    expect(result.detachedManutenzioneIds).toEqual(["M-FWD"]);
    expect(readList("@controlli_mezzo_autisti")).toEqual([]);
    expect(readList("@manutenzioni")[0]).toMatchObject({
      id: "M-FWD",
      origineRefs: [],
    });
  });

  it("ritorna errore se il controllo non esiste", async () => {
    seed({ controlli: [{ id: "C-1" }] });
    const result = await deleteControlloAutista({ controlloId: "C-INESISTENTE" });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/non trovato/i);
  });
});
