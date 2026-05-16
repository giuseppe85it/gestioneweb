// PROMPT 41 — Test del fix "modifica manutenzione: duplicazione record".
// Verifica che modificare un record esistente aggiorni LO STESSO record (niente
// duplicato), preservi il campo `data`, e tocchi solo `updatedAt`.
//
// `storageSync` e' mockato con uno store in-memory: il test isola la LOGICA del
// writer (identita' record, dedup, preservazione campi) senza Firestore ne' barrier.

import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, unknown>();

vi.mock("../../../utils/storageSync", () => ({
  getItemSync: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
  setItemSync: vi.fn((key: string, value: unknown) => {
    store.set(key, value);
    return Promise.resolve();
  }),
}));

import { saveNextManutenzioneBusinessRecord } from "../nextManutenzioniDomain";

type RawRecord = Record<string, unknown>;

function seed(records: RawRecord[]): void {
  store.clear();
  store.set("@manutenzioni", records);
}

function readStorico(): RawRecord[] {
  const value = store.get("@manutenzioni");
  return Array.isArray(value) ? (value as RawRecord[]) : [];
}

const basePayload = {
  targa: "TI298409",
  tipo: "mezzo" as const,
  descrizione: "Cambio gomme",
  data: "2026-05-08",
  importo: null,
};

describe("saveNextManutenzioneBusinessRecord — fix duplicazione (PROMPT 41)", () => {
  beforeEach(() => {
    store.clear();
  });

  it("modifica solo descrizione: stesso record, data e id invariati, updatedAt aggiornato", async () => {
    seed([
      { id: "rec-stabile-1", targa: "TI298409", descrizione: "Cambio gomme", data: "2026-05-08", stato: "eseguita" },
    ]);
    const saved = (await saveNextManutenzioneBusinessRecord({
      ...basePayload,
      editingSourceId: "rec-stabile-1",
      descrizione: "Cambio gomme - revisione",
    })) as RawRecord;
    const storico = readStorico();
    expect(storico).toHaveLength(1);
    expect(saved.id).toBe("rec-stabile-1");
    expect(saved.data).toBe("2026-05-08");
    expect(saved.descrizione).toBe("Cambio gomme - revisione");
    expect(typeof saved.updatedAt).toBe("number");
  });

  it("modifica officina (fornitore): stesso record, niente duplicato, data invariata", async () => {
    seed([
      { id: "rec-stabile-2", targa: "TI298409", descrizione: "Cambio gomme", data: "2026-05-08", fornitore: "" },
    ]);
    const saved = (await saveNextManutenzioneBusinessRecord({
      ...basePayload,
      editingSourceId: "rec-stabile-2",
      fornitore: "VALTELLINA PNEUMATICI",
    })) as RawRecord;
    const storico = readStorico();
    expect(storico).toHaveLength(1);
    expect(storico[0].id).toBe("rec-stabile-2");
    expect(saved.data).toBe("2026-05-08");
    expect(saved.fornitore).toBe("VALTELLINA PNEUMATICI");
  });

  it("modifica piu' campi insieme: un solo record, id e data invariati, updatedAt cambiato", async () => {
    seed([
      { id: "rec-stabile-3", targa: "TI298409", descrizione: "Cambio gomme", data: "2026-05-08", km: 100000 },
    ]);
    const saved = (await saveNextManutenzioneBusinessRecord({
      ...basePayload,
      editingSourceId: "rec-stabile-3",
      fornitore: "VALTELLINA PNEUMATICI",
      km: 383482,
      descrizione: "Cambio gomme ordinario",
    })) as RawRecord;
    const storico = readStorico();
    expect(storico).toHaveLength(1);
    expect(saved.id).toBe("rec-stabile-3");
    expect(saved.data).toBe("2026-05-08");
    expect(saved.km).toBe(383482);
    expect(saved.descrizione).toBe("Cambio gomme ordinario");
    expect(typeof saved.updatedAt).toBe("number");
  });

  it("record SENZA id reale: l'edit NON duplica, assegna un id reale persistito (via fingerprint)", async () => {
    // record privo di `id`: prima del fix l'edit produceva un duplicato.
    seed([
      { targa: "TI298409", descrizione: "Cambio gomme", data: "2026-05-08", stato: "eseguita" },
      { id: "altro-record", targa: "TI999999", descrizione: "Tagliando", data: "2026-04-01" },
    ]);
    const saved = (await saveNextManutenzioneBusinessRecord({
      ...basePayload,
      // id sintetico index-based, instabile, come quello prodotto da buildHistoryId
      editingSourceId: "manutenzione:TI298409:0",
      editingSourceFingerprint: {
        targa: "TI298409",
        data: "2026-05-08",
        descrizione: "Cambio gomme",
        stato: "eseguita",
      },
      fornitore: "VALTELLINA PNEUMATICI",
    })) as RawRecord;
    const storico = readStorico();
    // nessun duplicato: i record restano 2 (quello editato + l'altro)
    expect(storico).toHaveLength(2);
    // il record editato ora ha un id reale e stabile (non piu' index-based)
    expect(typeof saved.id).toBe("string");
    expect(String(saved.id)).not.toMatch(/^manutenzione:/);
    expect(String(saved.id).length).toBeGreaterThan(0);
    expect(saved.data).toBe("2026-05-08");
    expect(saved.fornitore).toBe("VALTELLINA PNEUMATICI");
    // l'altro record non e' stato toccato
    expect(storico.some((record) => record.id === "altro-record")).toBe(true);
  });

  it("creazione nuova (senza editingSourceId): aggiunge un record, non rimuove gli altri", async () => {
    seed([{ id: "esistente", targa: "TI100000", descrizione: "X", data: "2026-01-01" }]);
    const saved = (await saveNextManutenzioneBusinessRecord({
      ...basePayload,
      descrizione: "Nuovo intervento",
    })) as RawRecord;
    const storico = readStorico();
    expect(storico).toHaveLength(2);
    expect(typeof saved.id).toBe("string");
    expect(storico.some((record) => record.id === "esistente")).toBe(true);
  });
});
