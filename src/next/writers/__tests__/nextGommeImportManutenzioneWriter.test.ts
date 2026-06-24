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

import {
  importGommeEventoComeManutenzioneEseguita,
  isGommeEventoImportato,
} from "../nextGommeImportManutenzioneWriter";

type RawRecord = Record<string, unknown>;

const CAMBI_GOMME_TMP_KEY = "@cambi_gomme_autisti_tmp";

function seed(eventi: RawRecord[]): void {
  store.clear();
  store.set("@manutenzioni", []);
  store.set(CAMBI_GOMME_TMP_KEY, eventi);
}

function readManutenzioni(): RawRecord[] {
  const value = store.get("@manutenzioni");
  return Array.isArray(value) ? (value as RawRecord[]) : [];
}

function readTmp(): RawRecord[] {
  const value = store.get(CAMBI_GOMME_TMP_KEY);
  return Array.isArray(value) ? (value as RawRecord[]) : [];
}

describe("nextGommeImportManutenzioneWriter", () => {
  beforeEach(() => {
    seed([]);
  });

  it("crea una manutenzione gomme ESEGUITA ordinaria e marca l'evento importato", async () => {
    const evento: RawRecord = {
      id: "G-1",
      targetTarga: "TI178456",
      categoria: "motrice",
      km: 120000,
      data: Date.UTC(2026, 5, 10),
      marca: "Michelin",
      asseId: "asse2",
      autista: { nome: "Mario Rossi" },
      stato: "nuovo",
      letta: false,
    };
    seed([evento]);

    const result = await importGommeEventoComeManutenzioneEseguita({
      eventoId: "G-1",
      targa: "TI178456",
      data: "2026-06-10",
      km: 120000,
      asseId: "asse2",
      marca: "Michelin",
      interventoTipo: "ordinario",
      segnalatoDa: "Mario Rossi",
    });

    expect(result.ok).toBe(true);
    expect(result.manutenzioneId).toBeTruthy();

    const created = readManutenzioni()[0];
    expect(created.stato).toBe("eseguita");
    expect(created.dataEsecuzione).toBe("2026-06-10");
    expect(created.targa).toBe("TI178456");
    expect(created.km).toBe(120000);
    expect(created.gommeInterventoTipo).toBe("ordinario");
    expect(created.assiCoinvolti).toEqual(["asse2"]);
    expect(created.gommePerAsse).toEqual([
      { asseId: "asse2", dataCambio: "2026-06-10", kmCambio: 120000 },
    ]);

    const tmp = readTmp()[0];
    expect(tmp.stato).toBe("importato");
    expect(tmp.linkedManutenzioneId).toBe(result.manutenzioneId);
    expect(isGommeEventoImportato(tmp)).toBe(true);
  });

  it("è idempotente: non reimporta un evento già importato", async () => {
    seed([
      {
        id: "G-2",
        targetTarga: "TI178456",
        stato: "importato",
        linkedManutenzioneId: "M-prev",
      },
    ]);

    const result = await importGommeEventoComeManutenzioneEseguita({
      eventoId: "G-2",
      targa: "TI178456",
      data: "2026-06-10",
      km: null,
      asseId: "asse1",
      interventoTipo: "ordinario",
    });

    expect(result.ok).toBe(false);
    expect(readManutenzioni()).toHaveLength(0);
  });

  it("rifiuta un import ordinario senza asse", async () => {
    seed([{ id: "G-3", targetTarga: "TI178456", stato: "nuovo" }]);

    const result = await importGommeEventoComeManutenzioneEseguita({
      eventoId: "G-3",
      targa: "TI178456",
      data: "2026-06-10",
      km: null,
      asseId: null,
      interventoTipo: "ordinario",
    });

    expect(result.ok).toBe(false);
    expect(readManutenzioni()).toHaveLength(0);
  });

  it("crea una manutenzione gomme straordinaria con motivo", async () => {
    seed([{ id: "G-4", targetTarga: "TI178456", stato: "nuovo" }]);

    const result = await importGommeEventoComeManutenzioneEseguita({
      eventoId: "G-4",
      targa: "TI178456",
      data: "2026-06-10",
      km: null,
      asseId: "asse1",
      interventoTipo: "straordinario",
      motivo: "foratura",
    });

    expect(result.ok).toBe(true);
    const created = readManutenzioni()[0];
    expect(created.stato).toBe("eseguita");
    expect(created.gommeInterventoTipo).toBe("straordinario");
    expect(created.gommeStraordinario).toEqual({
      asseId: "asse1",
      quantita: null,
      motivo: "foratura",
    });
  });
});
