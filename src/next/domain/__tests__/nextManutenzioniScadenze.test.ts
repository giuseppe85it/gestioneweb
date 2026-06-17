// Test della Fase A — scadenze di manutenzione (logica e dati, nessuna UI).
//
// Tutto in un unico file con un solo set di mock condivisi: `storageSync` (store in-memory)
// e `nextRifornimentiDomain` (km correnti per targa). Tenere i mock degli stessi moduli in
// file separati causerebbe leak tra file; qui sono coerenti per l'intera suite.
//
// Copre: calcolo PURO (tempo/km/ore + multi-base), writer (create/update/delete + date dal
// payload, mai da Date.now()), reader (assemblaggio snapshot + counters).

import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, unknown>();
const rifornimentiItems: Array<{ mezzoTarga: string; km: number | null; timestamp: number | null }> = [];

vi.mock("../../../utils/storageSync", () => ({
  getItemSync: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
  setItemSync: vi.fn((key: string, value: unknown) => {
    store.set(key, value);
    return Promise.resolve();
  }),
}));

vi.mock("../nextRifornimentiDomain", () => ({
  readNextRifornimentiReadOnlySnapshot: vi.fn(async () => ({ items: rifornimentiItems })),
}));

import {
  MANUTENZIONI_SCADENZE_KEY,
  evaluateScadenzaManutenzione,
  readNextManutenzioniScadenzeSnapshot,
  type NextManutenzioneScadenzaRecord,
  type ScadenzaBase,
} from "../nextManutenzioniScadenzeDomain";
import {
  deleteScadenzaManutenzione,
  saveScadenzaManutenzione,
} from "../../nextManutenzioniScadenzeWriter";

// 16 giugno 2026, mezzogiorno locale.
const NOW = new Date(2026, 5, 16, 12, 0, 0).getTime();

function makeRecord(
  overrides: Partial<NextManutenzioneScadenzaRecord> & { base: ScadenzaBase[] },
): NextManutenzioneScadenzaRecord {
  return {
    id: "s1",
    targa: "TI298409",
    tipo: "cronotachigrafo",
    label: "Cronotachigrafo",
    attiva: true,
    ...overrides,
  };
}

// ————————————————————————————————————————————————————————————————
// Calcolo PURO
// ————————————————————————————————————————————————————————————————

describe("evaluateScadenzaManutenzione — base tempo", () => {
  it("in scadenza: ultima esecuzione + intervallo mesi cade entro 30 giorni (oggi)", () => {
    const record = makeRecord({
      base: ["tempo"],
      ultimaEsecuzioneData: "2024-06-16",
      intervalloMesi: 24,
    });
    const item = evaluateScadenzaManutenzione(record, { kmAttuali: null, oreAttuali: null }, NOW);
    expect(item.stato).toBe("in_scadenza");
    expect(item.tone).toBe("warning");
    expect(item.componenti[0].prossimaData).toBe("2026-06-16");
    expect(item.componenti[0].giorni).toBe(0);
    expect(item.giorniMin).toBe(0);
  });

  it("scaduta: data manuale nel passato", () => {
    const record = makeRecord({ base: ["tempo"], prossimaScadenzaDataManuale: "2025-06-01" });
    const item = evaluateScadenzaManutenzione(record, { kmAttuali: null, oreAttuali: null }, NOW);
    expect(item.stato).toBe("scaduta");
    expect(item.tone).toBe("danger");
    expect(item.componenti[0].giorni).toBeLessThan(0);
  });

  it("ok: data futura oltre 30 giorni", () => {
    const record = makeRecord({ base: ["tempo"], prossimaScadenzaDataManuale: "2027-06-01" });
    const item = evaluateScadenzaManutenzione(record, { kmAttuali: null, oreAttuali: null }, NOW);
    expect(item.stato).toBe("ok");
    expect(item.tone).toBe("neutral");
  });

  it("data mancante: nessuna data e nessun intervallo", () => {
    const record = makeRecord({ base: ["tempo"] });
    const item = evaluateScadenzaManutenzione(record, { kmAttuali: null, oreAttuali: null }, NOW);
    expect(item.stato).toBe("data_mancante");
    expect(item.componenti[0].prossimaData).toBeNull();
  });

  it("l'override manuale prevale sul calcolo da regola", () => {
    const record = makeRecord({
      base: ["tempo"],
      ultimaEsecuzioneData: "2020-01-01",
      intervalloMesi: 24, // regola → 2022 (scaduta)
      prossimaScadenzaDataManuale: "2027-01-01", // override → ok
    });
    const item = evaluateScadenzaManutenzione(record, { kmAttuali: null, oreAttuali: null }, NOW);
    expect(item.stato).toBe("ok");
    expect(item.componenti[0].prossimaData).toBe("2027-01-01");
  });
});

describe("evaluateScadenzaManutenzione — base km", () => {
  it("in scadenza: residuo entro la soglia (1000 km)", () => {
    const record = makeRecord({ base: ["km"], prossimaScadenzaKmManuale: 100000 });
    const item = evaluateScadenzaManutenzione(record, { kmAttuali: 99500, oreAttuali: null }, NOW);
    expect(item.stato).toBe("in_scadenza");
    expect(item.componenti[0].residuo).toBe(500);
  });

  it("scaduta: km corrente oltre la soglia calcolata da ultima + intervallo", () => {
    const record = makeRecord({ base: ["km"], ultimaEsecuzioneKm: 50000, intervalloKm: 30000 });
    const item = evaluateScadenzaManutenzione(record, { kmAttuali: 90000, oreAttuali: null }, NOW);
    expect(item.stato).toBe("scaduta");
    expect(item.componenti[0].prossimoValore).toBe(80000);
    expect(item.componenti[0].residuo).toBe(-10000);
  });

  it("ok: residuo ampio", () => {
    const record = makeRecord({ base: ["km"], ultimaEsecuzioneKm: 50000, intervalloKm: 30000 });
    const item = evaluateScadenzaManutenzione(record, { kmAttuali: 60000, oreAttuali: null }, NOW);
    expect(item.stato).toBe("ok");
    expect(item.componenti[0].residuo).toBe(20000);
  });

  it("valore non disponibile: km corrente sconosciuto", () => {
    const record = makeRecord({ base: ["km"], prossimaScadenzaKmManuale: 100000 });
    const item = evaluateScadenzaManutenzione(record, { kmAttuali: null, oreAttuali: null }, NOW);
    expect(item.stato).toBe("valore_non_disponibile");
    expect(item.componenti[0].prossimoValore).toBe(100000);
  });

  it("data mancante: nessuna soglia ricavabile", () => {
    const record = makeRecord({ base: ["km"] });
    const item = evaluateScadenzaManutenzione(record, { kmAttuali: 100000, oreAttuali: null }, NOW);
    expect(item.stato).toBe("data_mancante");
  });
});

describe("evaluateScadenzaManutenzione — base ore", () => {
  it("valore non disponibile quando manca il contaore (Fase 1)", () => {
    const record = makeRecord({ base: ["ore"], prossimaScadenzaOreManuale: 1000 });
    const item = evaluateScadenzaManutenzione(record, { kmAttuali: null, oreAttuali: null }, NOW);
    expect(item.stato).toBe("valore_non_disponibile");
  });

  it("calcolabile se in futuro si fornisce un contaore", () => {
    const record = makeRecord({ base: ["ore"], ultimaEsecuzioneOre: 500, intervalloOre: 500 });
    const item = evaluateScadenzaManutenzione(record, { kmAttuali: null, oreAttuali: 980 }, NOW);
    expect(item.stato).toBe("in_scadenza"); // residuo 20 <= 50
    expect(item.componenti[0].residuo).toBe(20);
  });
});

describe("evaluateScadenzaManutenzione — multi-base", () => {
  it("vince lo stato peggiore tra le basi attive", () => {
    const record = makeRecord({
      base: ["tempo", "km"],
      prossimaScadenzaDataManuale: "2027-01-01", // tempo ok
      prossimaScadenzaKmManuale: 100, // km scaduta (corrente 200)
    });
    const item = evaluateScadenzaManutenzione(record, { kmAttuali: 200, oreAttuali: null }, NOW);
    expect(item.stato).toBe("scaduta");
    expect(item.componenti).toHaveLength(2);
  });
});

// ————————————————————————————————————————————————————————————————
// Writer
// ————————————————————————————————————————————————————————————————

type RawRecord = Record<string, unknown>;

function readSaved(): RawRecord[] {
  const value = store.get(MANUTENZIONI_SCADENZE_KEY);
  return Array.isArray(value) ? (value as RawRecord[]) : [];
}

function expectNoUndefined(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(expectNoUndefined);
    return;
  }
  if (value && typeof value === "object") {
    for (const entry of Object.values(value as RawRecord)) {
      expect(entry).not.toBeUndefined();
      expectNoUndefined(entry);
    }
  }
}

const basePayload = {
  targa: "TI298409",
  tipo: "cronotachigrafo",
  label: "Cronotachigrafo",
};

describe("saveScadenzaManutenzione", () => {
  beforeEach(() => {
    store.clear();
  });

  it("crea un nuovo record con id generato e updatedAt numerico", async () => {
    const saved = await saveScadenzaManutenzione({
      ...basePayload,
      base: ["tempo"],
      ultimaEsecuzioneData: "2024-06-16",
      intervalloMesi: 24,
    });
    expect(saved.id).toMatch(/^scad-/);
    expect(typeof saved.updatedAt).toBe("number");
    expect(saved.targa).toBe("TI298409");
    expect(saved.base).toEqual(["tempo"]);
    expect(readSaved()).toHaveLength(1);
    expectNoUndefined(readSaved());
  });

  it("normalizza la data dal formato utente (gg/mm/aaaa) a ISO, mai da Date.now()", async () => {
    const saved = await saveScadenzaManutenzione({
      ...basePayload,
      base: ["tempo"],
      ultimaEsecuzioneData: "16/06/2024",
      prossimaScadenzaDataManuale: "01/01/2027",
    });
    expect(saved.ultimaEsecuzioneData).toBe("2024-06-16");
    expect(saved.prossimaScadenzaDataManuale).toBe("2027-01-01");
  });

  it("aggiorna lo stesso record (stesso id, nessun duplicato)", async () => {
    const created = await saveScadenzaManutenzione({ ...basePayload, base: ["tempo"] });
    const updated = await saveScadenzaManutenzione({
      ...basePayload,
      base: ["tempo", "km"],
      id: created.id,
      label: "Cronotachigrafo (aggiornato)",
      intervalloKm: 100000,
    });
    const saved = readSaved();
    expect(saved).toHaveLength(1);
    expect(updated.id).toBe(created.id);
    expect(updated.label).toBe("Cronotachigrafo (aggiornato)");
    expect(updated.base).toEqual(["tempo", "km"]);
  });

  it("rifiuta payload senza targa", async () => {
    await expect(
      saveScadenzaManutenzione({ ...basePayload, base: ["tempo"], targa: "  " }),
    ).rejects.toThrow(/targa/i);
  });

  it("rifiuta payload senza alcuna base", async () => {
    await expect(saveScadenzaManutenzione({ ...basePayload, base: [] })).rejects.toThrow(/base/i);
  });
});

describe("deleteScadenzaManutenzione", () => {
  beforeEach(() => {
    store.clear();
  });

  it("elimina un record esistente e restituisce true", async () => {
    const created = await saveScadenzaManutenzione({ ...basePayload, base: ["tempo"] });
    const result = await deleteScadenzaManutenzione(created.id);
    expect(result).toBe(true);
    expect(readSaved()).toHaveLength(0);
  });

  it("restituisce false se l'id non esiste", async () => {
    await saveScadenzaManutenzione({ ...basePayload, base: ["tempo"] });
    const result = await deleteScadenzaManutenzione("inesistente");
    expect(result).toBe(false);
    expect(readSaved()).toHaveLength(1);
  });
});

// ————————————————————————————————————————————————————————————————
// Reader snapshot
// ————————————————————————————————————————————————————————————————

describe("readNextManutenzioniScadenzeSnapshot", () => {
  beforeEach(() => {
    store.clear();
    rifornimentiItems.length = 0;
  });

  it("assembla gli item e i counters usando il km corrente per targa", async () => {
    store.set(MANUTENZIONI_SCADENZE_KEY, [
      {
        id: "a",
        targa: "TI298409",
        tipo: "cronotachigrafo",
        label: "Cronotachigrafo",
        base: ["tempo"],
        prossimaScadenzaDataManuale: "2025-01-01", // scaduta
        attiva: true,
      },
      {
        id: "b",
        targa: "TI298409",
        tipo: "tagliando_mezzo",
        label: "Tagliando",
        base: ["km"],
        prossimaScadenzaKmManuale: 100000, // residuo 500 → in scadenza
        attiva: true,
      },
      {
        id: "c",
        targa: "TI298409",
        tipo: "estintore",
        label: "Estintore",
        base: ["tempo"],
        prossimaScadenzaDataManuale: "2025-02-01",
        attiva: false, // non conta nei counters
      },
    ]);
    rifornimentiItems.push(
      { mezzoTarga: "TI298409", km: 99500, timestamp: 2000 },
      { mezzoTarga: "TI298409", km: 90000, timestamp: 1000 }, // più vecchio, ignorato
    );

    const snapshot = await readNextManutenzioniScadenzeSnapshot(NOW);
    expect(snapshot.items).toHaveLength(3);

    const tagliando = snapshot.items.find((item) => item.id === "b");
    expect(tagliando?.stato).toBe("in_scadenza");
    expect(tagliando?.componenti[0].valoreCorrente).toBe(99500);

    expect(snapshot.counters.totali).toBe(2);
    expect(snapshot.counters.scadute).toBe(1);
    expect(snapshot.counters.inScadenza).toBe(1);
  });

  it("snapshot vuoto quando non ci sono record", async () => {
    const snapshot = await readNextManutenzioniScadenzeSnapshot(NOW);
    expect(snapshot.items).toHaveLength(0);
    expect(snapshot.counters).toEqual({ totali: 0, scadute: 0, inScadenza: 0 });
  });
});
