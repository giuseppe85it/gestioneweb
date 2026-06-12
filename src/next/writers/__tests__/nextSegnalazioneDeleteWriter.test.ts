import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, unknown>();
const deletedStoragePaths: string[] = [];
const missingStoragePaths = new Set<string>();

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

vi.mock("../../../utils/storageWriteOps", () => ({
  deleteObject: vi.fn((reference: { fullPath?: string }) => {
    const path = String(reference.fullPath ?? "");
    if (missingStoragePaths.has(path)) {
      return Promise.reject({ code: "storage/object-not-found" });
    }
    deletedStoragePaths.push(path);
    return Promise.resolve();
  }),
}));

vi.mock("../../../firebase", () => ({
  storage: {},
}));

vi.mock("firebase/storage", () => ({
  ref: (_storage: unknown, path: string) => ({ fullPath: path }),
}));

import { deleteSegnalazioneAutista } from "../nextSegnalazioneDeleteWriter";

type RawRecord = Record<string, unknown>;

function seed(args: {
  segnalazioni?: RawRecord[];
  manutenzioni?: RawRecord[];
}): void {
  store.clear();
  store.set("@segnalazioni_autisti_tmp", args.segnalazioni ?? []);
  store.set("@manutenzioni", args.manutenzioni ?? []);
  deletedStoragePaths.length = 0;
  missingStoragePaths.clear();
}

function readList(key: string): RawRecord[] {
  const value = store.get(key);
  return Array.isArray(value) ? (value as RawRecord[]) : [];
}

describe("nextSegnalazioneDeleteWriter", () => {
  beforeEach(() => {
    seed({});
  });

  it("elimina una segnalazione non collegata", async () => {
    seed({
      segnalazioni: [
        { id: "S-1", descrizione: "Rumore freni" },
        { id: "S-2", descrizione: "Perdita olio" },
      ],
    });

    const result = await deleteSegnalazioneAutista({ segnalazioneId: "S-1" });

    expect(result.ok).toBe(true);
    expect(readList("@segnalazioni_autisti_tmp").map((record) => record.id)).toEqual(["S-2"]);
    expect(readList("@manutenzioni")).toEqual([]);
  });

  it("elimina una segnalazione collegata sganciando solo origineRefs sulla manutenzione", async () => {
    seed({
      segnalazioni: [
        {
          id: "S-LINK",
          linkedLavoroId: "M-1",
          linkedLavoroIds: ["M-2"],
        },
      ],
      manutenzioni: [
        {
          id: "M-1",
          stato: "daFare",
          descrizione: "Mantieni dati",
          origineTipo: "segnalazione",
          origineRefId: "S-LINK",
          origineRefKey: "@segnalazioni_autisti_tmp",
          origineRefs: [
            {
              tipo: "segnalazione",
              refId: "S-LINK",
              refKey: "@segnalazioni_autisti_tmp",
            },
          ],
        },
        {
          id: "M-2",
          stato: "programmata",
          origineRefs: [
            {
              tipo: "segnalazione",
              refId: "S-LINK",
              refKey: "@segnalazioni_autisti_tmp",
            },
            {
              tipo: "controllo",
              refId: "C-1",
              refKey: "@controlli_mezzo_autisti",
            },
          ],
        },
      ],
    });

    const result = await deleteSegnalazioneAutista({ segnalazioneId: "S-LINK" });

    expect(result.ok).toBe(true);
    expect(readList("@segnalazioni_autisti_tmp")).toEqual([]);
    const manutenzioni = readList("@manutenzioni");
    expect(manutenzioni[0]).toMatchObject({
      id: "M-1",
      stato: "daFare",
      descrizione: "Mantieni dati",
      origineTipo: null,
      origineRefId: null,
      origineRefKey: null,
      origineRefs: [],
    });
    expect(manutenzioni[1]).toMatchObject({
      id: "M-2",
      stato: "programmata",
      origineTipo: "controllo",
      origineRefId: "C-1",
      origineRefKey: "@controlli_mezzo_autisti",
      origineRefs: [
        {
          tipo: "controllo",
          refId: "C-1",
          refKey: "@controlli_mezzo_autisti",
        },
      ],
    });
  });

  it("elimina la segnalazione anche se una foto Storage e' gia assente", async () => {
    const missingPath = "autisti/segnalazioni/S-IMG/mancante.jpg";
    seed({
      segnalazioni: [
        {
          id: "S-IMG",
          fotoStoragePaths: [missingPath, "autisti/segnalazioni/S-IMG/presente.jpg"],
        },
      ],
    });
    missingStoragePaths.add(missingPath);

    const result = await deleteSegnalazioneAutista({ segnalazioneId: "S-IMG" });

    expect(result.ok).toBe(true);
    expect(result.deletedFotoPaths).toEqual([
      missingPath,
      "autisti/segnalazioni/S-IMG/presente.jpg",
    ]);
    expect(deletedStoragePaths).toEqual(["autisti/segnalazioni/S-IMG/presente.jpg"]);
    expect(readList("@segnalazioni_autisti_tmp")).toEqual([]);
  });
});
