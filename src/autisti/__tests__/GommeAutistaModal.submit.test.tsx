import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, unknown>();

vi.mock("../../utils/storageSync", () => ({
  getItemSync: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
  setItemSync: vi.fn((key: string, value: unknown) => {
    store.set(key, value);
    return Promise.resolve();
  }),
}));

vi.mock("../autistiStorage", () => ({
  getAutistaLocal: vi.fn(() => null),
  getMezzoLocal: vi.fn(() => null),
}));

vi.mock("../../pages/ModalGomme", () => ({
  default: () => null,
}));

vi.mock("../../components/wheels", () => ({
  wheelGeom: vi.fn(() => null),
}));

import { appendGommeAutistaTmpRecordIfMissing } from "../GommeAutistaModal";

type RawRecord = Record<string, unknown>;

function readTmp(): RawRecord[] {
  const value = store.get("@cambi_gomme_autisti_tmp");
  return Array.isArray(value) ? (value as RawRecord[]) : [];
}

describe("GommeAutistaModal - guardia doppio submit", () => {
  beforeEach(() => {
    store.clear();
  });

  it("non appende due volte un evento con lo stesso id", async () => {
    const record = { id: "EVT-1", targa: "TI282780", tipo: "sostituzione" };

    const first = await appendGommeAutistaTmpRecordIfMissing(record);
    const second = await appendGommeAutistaTmpRecordIfMissing({
      id: "EVT-1",
      targa: "TI282780",
      tipo: "sostituzione",
      nota: "doppio tap",
    });

    expect(first.appended).toBe(true);
    expect(second.appended).toBe(false);
    expect(readTmp()).toHaveLength(1);
    expect(readTmp()[0]).toEqual(record);
  });

  it("appende eventi distinti", async () => {
    await appendGommeAutistaTmpRecordIfMissing({ id: "EVT-1", targa: "TI282780" });
    await appendGommeAutistaTmpRecordIfMissing({ id: "EVT-2", targa: "TI282780" });

    expect(readTmp().map((record) => record.id)).toEqual(["EVT-2", "EVT-1"]);
  });
});
