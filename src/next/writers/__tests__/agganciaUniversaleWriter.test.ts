// BUG 65 Fase 3 — test del writer "Aggancia universale".

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

// Delegato: mock per verificare il routing di segnalazione/controllo.
const delegateMock = vi.fn(async () => ({ ok: true as const }));
vi.mock("../agganciaSegnalazioneAManutenzioneEsistenteWriter", () => ({
  CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE: "centro_controllo_legame_write",
  agganciaSegnalazioneAManutenzioneEsistente: (input: unknown) => delegateMock(input),
}));

// Auto-chiusura: mock per verificare che la manutenzione operativa venga chiusa.
const chiudiMock = vi.fn(async () => ({ ok: true as const, updated: 1 }));
vi.mock("../nextChiusuraEventoWriter", () => ({
  chiudiManutenzioneDaEvento: (...args: unknown[]) => chiudiMock(...args),
}));

import {
  agganciaUniversaleDaManutenzione,
  scollegaUniversaleDaManutenzione,
} from "../agganciaUniversaleWriter";
import { readCollegamenti } from "../../helpers/legamiUniversali";

type RawRecord = Record<string, unknown>;

function manutenzioni(): RawRecord[] {
  return (store.get("@manutenzioni") as RawRecord[]) ?? [];
}
function byId(id: string): RawRecord | undefined {
  return manutenzioni().find((r) => r.id === id);
}

beforeEach(() => {
  store.clear();
  delegateMock.mockClear();
  chiudiMock.mockClear();
  store.set("@manutenzioni", [
    { id: "M1", targa: "TI178456", descrizione: "Da fare", stato: "daFare", data: "2026-06-10" },
    { id: "M2", targa: "TI178456", descrizione: "Eseguita", stato: "eseguita", data: "2026-06-10" },
  ]);
});

describe("agganciaUniversaleDaManutenzione - manutenzione↔manutenzione", () => {
  it("scrive collegamenti simmetrici su entrambe le manutenzioni", async () => {
    const res = await agganciaUniversaleDaManutenzione({
      manutenzioneId: "M1",
      target: { tipo: "manutenzione", refId: "M2" },
    });
    expect(res.ok).toBe(true);
    expect(readCollegamenti(byId("M1"))).toEqual([
      { tipo: "manutenzione", refId: "M2", refKey: "@manutenzioni" },
    ]);
    expect(readCollegamenti(byId("M2"))).toEqual([
      { tipo: "manutenzione", refId: "M1", refKey: "@manutenzioni" },
    ]);
  });

  it("chiude la manutenzione operativa quando agganciata a una eseguita", async () => {
    await agganciaUniversaleDaManutenzione({
      manutenzioneId: "M1",
      target: { tipo: "manutenzione", refId: "M2" },
    });
    // M1 (daFare) viene chiusa, ereditando il riferimento alla M2 eseguita.
    expect(chiudiMock).toHaveBeenCalledTimes(1);
    const [operativaId, tipoEvento, altraId] = chiudiMock.mock.calls[0];
    expect(operativaId).toBe("M1");
    expect(tipoEvento).toBe("manutenzione_collegata");
    expect(altraId).toBe("M2");
  });

  it("NON chiude nulla se entrambe sono da fare", async () => {
    store.set("@manutenzioni", [
      { id: "A", targa: "TI1", descrizione: "x", stato: "daFare" },
      { id: "B", targa: "TI1", descrizione: "y", stato: "daFare" },
    ]);
    await agganciaUniversaleDaManutenzione({
      manutenzioneId: "A",
      target: { tipo: "manutenzione", refId: "B" },
    });
    expect(chiudiMock).not.toHaveBeenCalled();
  });

  it("rifiuta l'auto-aggancio", async () => {
    const res = await agganciaUniversaleDaManutenzione({
      manutenzioneId: "M1",
      target: { tipo: "manutenzione", refId: "M1" },
    });
    expect(res.ok).toBe(false);
  });

  it("errore se la manutenzione target non esiste", async () => {
    const res = await agganciaUniversaleDaManutenzione({
      manutenzioneId: "M1",
      target: { tipo: "manutenzione", refId: "NON_ESISTE" },
    });
    expect(res.ok).toBe(false);
  });
});

describe("agganciaUniversaleDaManutenzione - documento (asimmetrico)", () => {
  it("scrive collegamento solo lato manutenzione", async () => {
    const res = await agganciaUniversaleDaManutenzione({
      manutenzioneId: "M1",
      target: { tipo: "documento", refId: "DOC-9" },
    });
    expect(res.ok).toBe(true);
    expect(readCollegamenti(byId("M1"))).toEqual([
      { tipo: "documento", refId: "DOC-9", refKey: "@documenti_mezzi" },
    ]);
  });
});

describe("agganciaUniversaleDaManutenzione - delega segnalazione/controllo", () => {
  it("delega al writer esistente per i target segnalazione", async () => {
    const res = await agganciaUniversaleDaManutenzione({
      manutenzioneId: "M1",
      target: { tipo: "segnalazione", refId: "S-1" },
    });
    expect(res.ok).toBe(true);
    expect(delegateMock).toHaveBeenCalledWith({
      sorgenteId: "S-1",
      sorgenteTipo: "segnalazione",
      manutenzioneTargetId: "M1",
    });
  });

  it("delega al writer esistente per i target controllo", async () => {
    await agganciaUniversaleDaManutenzione({
      manutenzioneId: "M2",
      target: { tipo: "controllo", refId: "C-1" },
    });
    expect(delegateMock).toHaveBeenCalledWith({
      sorgenteId: "C-1",
      sorgenteTipo: "controllo",
      manutenzioneTargetId: "M2",
    });
  });
});

describe("agganciaUniversaleDaManutenzione - esito chiusura", () => {
  it("non dichiara ok se la chiusura della da-fare fallisce", async () => {
    chiudiMock.mockResolvedValueOnce({ ok: false, updated: 0, error: "boom" });
    const res = await agganciaUniversaleDaManutenzione({
      manutenzioneId: "M1",
      target: { tipo: "manutenzione", refId: "M2" },
    });
    expect(res.ok).toBe(false);
    // il legame resta comunque scritto (additivo)
    expect(readCollegamenti(byId("M1"))).toHaveLength(1);
  });
});

describe("scollegaUniversaleDaManutenzione", () => {
  it("rimuove il legame simmetrico manutenzione↔manutenzione", async () => {
    await agganciaUniversaleDaManutenzione({
      manutenzioneId: "M1",
      target: { tipo: "manutenzione", refId: "M2" },
    });
    const res = await scollegaUniversaleDaManutenzione({
      manutenzioneId: "M1",
      target: { tipo: "manutenzione", refId: "M2" },
    });
    expect(res.ok).toBe(true);
    expect(readCollegamenti(byId("M1"))).toEqual([]);
    expect(readCollegamenti(byId("M2"))).toEqual([]);
  });

  it("riapre la da-fare se era stata chiusa da questo aggancio", async () => {
    // Simula M1 gia' chiusa dall'aggancio verso M2.
    store.set("@manutenzioni", [
      {
        id: "M1",
        targa: "TI178456",
        descrizione: "Da fare",
        stato: "chiusa_da_evento",
        chiusuraDi: "manutenzione_collegata",
        chiusuraRefId: "M2",
        collegamenti: [{ tipo: "manutenzione", refId: "M2", refKey: "@manutenzioni" }],
      },
      {
        id: "M2",
        targa: "TI178456",
        descrizione: "Eseguita",
        stato: "eseguita",
        collegamenti: [{ tipo: "manutenzione", refId: "M1", refKey: "@manutenzioni" }],
      },
    ]);
    const res = await scollegaUniversaleDaManutenzione({
      manutenzioneId: "M1",
      target: { tipo: "manutenzione", refId: "M2" },
    });
    expect(res.ok).toBe(true);
    expect(byId("M1")?.stato).toBe("daFare");
    expect(byId("M1")?.chiusuraDi).toBeNull();
    expect(readCollegamenti(byId("M1"))).toEqual([]);
  });
});
