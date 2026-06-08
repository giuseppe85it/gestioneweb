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
  createManutenzioneDaFareFromControllo,
  createManutenzioneDaFareFromSegnalazione,
} from "../nextManutenzioneDaFareCreateWriter";
import { saveNextManutenzioneBusinessRecord } from "../../domain/nextManutenzioniDomain";

type RawRecord = Record<string, unknown>;

function seed(args: {
  manutenzioni?: RawRecord[];
  segnalazioni?: RawRecord[];
  controlli?: RawRecord[];
}): void {
  store.clear();
  store.set("@manutenzioni", args.manutenzioni ?? []);
  store.set("@segnalazioni_autisti_tmp", args.segnalazioni ?? []);
  store.set("@controlli_mezzo_autisti", args.controlli ?? []);
}

function readManutenzioni(): RawRecord[] {
  const value = store.get("@manutenzioni");
  return Array.isArray(value) ? (value as RawRecord[]) : [];
}

describe("nextManutenzioneDaFareCreateWriter - marker gomme da sorgente", () => {
  beforeEach(() => {
    seed({});
  });

  it("crea daFare da segnalazione gomme con asse e motivo certi, senza tipo intervento", async () => {
    const segnalazione = {
      id: "S-GOMME-1",
      targa: "TI178456",
      tipoProblema: "gomme",
      posizioneGomma: "asse2",
      problemaGomma: "forata",
      descrizione: "Gomma forata",
      autistaNome: "Mario Rossi",
    };
    seed({ segnalazioni: [segnalazione] });

    const result = await createManutenzioneDaFareFromSegnalazione(segnalazione);

    expect(result.ok).toBe(true);
    const created = readManutenzioni()[0];
    expect(created.gommeInterventoTipo).toBeUndefined();
    expect(created.gommeStraordinario).toEqual({
      asseId: "asse2",
      quantita: null,
      motivo: "forata",
    });
  });

  it("crea daFare da segnalazione non-gomme senza marker strutturato", async () => {
    const segnalazione = {
      id: "S-FRENI-1",
      targa: "TI178456",
      tipoProblema: "freni",
      posizioneGomma: "asse2",
      problemaGomma: "forata",
      descrizione: "Rumore freni",
      autistaNome: "Mario Rossi",
    };
    seed({ segnalazioni: [segnalazione] });

    const result = await createManutenzioneDaFareFromSegnalazione(segnalazione);

    expect(result.ok).toBe(true);
    const created = readManutenzioni()[0];
    expect(created.gommeInterventoTipo).toBeUndefined();
    expect(created.gommeStraordinario).toBeUndefined();
    expect(created.assiCoinvolti).toBeUndefined();
    expect(created.gommePerAsse).toBeUndefined();
  });

  it("crea daFare da controllo KO gomme con asse e motivo solo se espliciti", async () => {
    const controllo = {
      id: "C-GOMME-1",
      target: "motrice",
      targaCamion: "TI279216",
      check: { gomme: false, luci: true },
      note: "usura pneumatici 1 asse",
      autistaNome: "Luigi Bianchi",
    };
    seed({ controlli: [controllo] });

    const result = await createManutenzioneDaFareFromControllo(controllo);

    expect(result.ok).toBe(true);
    const created = readManutenzioni()[0];
    expect(created.gommeInterventoTipo).toBeUndefined();
    expect(created.gommeStraordinario).toEqual({
      asseId: "asse1",
      quantita: null,
      motivo: "usura pneumatici 1 asse",
    });
  });

  it("il completamento successivo puo valorizzare il tipo gomme", async () => {
    const segnalazione = {
      id: "S-GOMME-2",
      targa: "TI178456",
      tipoProblema: "gomme",
      posizioneGomma: "asse2",
      problemaGomma: "forata",
      descrizione: "Gomma forata",
    };
    seed({ segnalazioni: [segnalazione] });

    const result = await createManutenzioneDaFareFromSegnalazione(segnalazione);
    expect(result.ok).toBe(true);
    const created = readManutenzioni()[0];

    const saved = (await saveNextManutenzioneBusinessRecord({
      editingSourceId: String(created.id),
      targa: String(created.targa),
      tipo: "mezzo",
      descrizione: String(created.descrizione),
      data: "2026-06-08",
      stato: "eseguita",
      importo: null,
      gommeInterventoTipo: "straordinario",
      gommeStraordinario: created.gommeStraordinario as {
        asseId: "asse2";
        quantita: null;
        motivo: string;
      },
    })) as RawRecord;

    expect(readManutenzioni()).toHaveLength(1);
    expect(saved.id).toBe(created.id);
    expect(saved.gommeInterventoTipo).toBe("straordinario");
    expect(saved.gommeStraordinario).toEqual({
      asseId: "asse2",
      quantita: null,
      motivo: "forata",
    });
  });
});
