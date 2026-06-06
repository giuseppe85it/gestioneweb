import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type RawRecord = Record<string, unknown>;

const store = new Map<string, unknown>();

function readList(key: string): RawRecord[] {
  const value = store.get(key);
  return Array.isArray(value) ? (value as RawRecord[]) : [];
}

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

import { saveNextManutenzioneBusinessRecord } from "../nextManutenzioniDomain";
import { toISO } from "../../helpers/dateUnica";
import { agganciaSegnalazioniAManutenzioneEsistenteBatch } from "../../writers/agganciaSegnalazioneAManutenzioneEsistenteWriter";

function seed(segnalazioni: RawRecord[]): void {
  store.clear();
  store.set("@manutenzioni", []);
  store.set("@segnalazioni_autisti_tmp", segnalazioni);
}

function normalizeTestText(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function resolveSegnalazioneAutoreReale(item: RawRecord): string | null {
  return normalizeTestText(item.autistaNome) || normalizeTestText(item.badgeAutista) || null;
}

function buildSegnalatoDaGruppo(items: RawRecord[]): string {
  const seen = new Set<string>();
  const names: string[] = [];
  items.forEach((item) => {
    const autore = resolveSegnalazioneAutoreReale(item);
    if (!autore) return;
    const key = autore.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    names.push(autore);
  });
  return names.length > 0 ? names.join(", ") : "Autisti";
}

async function creaLavoroDaGruppo(ids: string[]) {
  const segnalazioniTarget = ids
    .map((id) => readList("@segnalazioni_autisti_tmp").find((item) => item.id === id))
    .filter((item): item is RawRecord => Boolean(item));
  const oldestSegnalazioneTimestamp = segnalazioniTarget.reduce<number | null>((oldest, item) => {
    if (typeof item.timestamp !== "number") return oldest;
    if (oldest == null) return item.timestamp;
    return item.timestamp < oldest ? item.timestamp : oldest;
  }, null);
  const dataInserimento = toISO(oldestSegnalazioneTimestamp) ?? toISO(new Date()) ?? "";
  const saved = await saveNextManutenzioneBusinessRecord({
    targa: "TI298409",
    tipo: "mezzo",
    fornitore: null,
    km: null,
    ore: null,
    sottotipo: null,
    descrizione: "Freni - Pedale duro + Luci - Faro spento",
    eseguito: null,
    data: dataInserimento,
    dataEsecuzione: null,
    dataProgrammata: null,
    stato: "daFare",
    importo: null,
    materiali: [],
    assiCoinvolti: [],
    gommePerAsse: [],
    gommeInterventoTipo: null,
    gommeStraordinario: null,
    origineTipo: "manuale",
    origineRefId: null,
    origineRefKey: null,
    segnalatoDa: buildSegnalatoDaGruppo(segnalazioniTarget),
    eseguitoDa: null,
    urgenza: "media",
  });

  const aggancio = await agganciaSegnalazioniAManutenzioneEsistenteBatch({
    manutenzioneTargetId: saved.id,
    sorgenti: ids.map((id) => ({
      sorgenteId: id,
      sorgenteTipo: "segnalazione",
    })),
  });

  return { saved, aggancio };
}

describe("gruppo segnalazioni -> lavoro Da fare", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-04T12:00:00"));
    seed([
      { id: "S1", targa: "TI298409", stato: "nuova", descrizione: "Pedale duro", tipo: "Freni" },
      { id: "S2", targa: "TI298409", stato: "nuova", descrizione: "Faro spento", tipo: "Luci" },
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("crea una manutenzione daFare e aggancia N segnalazioni sui due lati", async () => {
    const { saved, aggancio } = await creaLavoroDaGruppo(["S1", "S2"]);

    expect(aggancio.ok).toBe(true);
    expect(aggancio.successes).toHaveLength(2);
    expect(aggancio.failures).toHaveLength(0);

    const manutenzioni = readList("@manutenzioni");
    expect(manutenzioni).toHaveLength(1);
    expect(saved.stato).toBe("daFare");
    expect(saved.data).toBe("2026-06-04");
    expect(saved.origineRefs).toBeUndefined();
    expect(manutenzioni[0].origineRefs).toEqual([
      { tipo: "segnalazione", refId: "S1", refKey: "@segnalazioni_autisti_tmp" },
      { tipo: "segnalazione", refId: "S2", refKey: "@segnalazioni_autisti_tmp" },
    ]);

    const segnalazioni = readList("@segnalazioni_autisti_tmp");
    expect(segnalazioni.find((item) => item.id === "S1")?.linkedLavoroId).toBe(saved.id);
    expect(segnalazioni.find((item) => item.id === "S2")?.linkedLavoroId).toBe(saved.id);
  });

  it("gestisce aggancio parziale e retry sulle sole fallite", async () => {
    seed([
      { id: "S1", targa: "TI298409", stato: "nuova", descrizione: "Pedale duro", tipo: "Freni" },
    ]);

    const { saved, aggancio } = await creaLavoroDaGruppo(["S1", "S2"]);

    expect(aggancio.ok).toBe(false);
    expect(aggancio.successes).toHaveLength(1);
    expect(aggancio.failures.map((failure) => failure.sorgenteId)).toEqual(["S2"]);
    expect(readList("@segnalazioni_autisti_tmp").find((item) => item.id === "S1")?.linkedLavoroId).toBe(saved.id);

    store.set("@segnalazioni_autisti_tmp", [
      ...readList("@segnalazioni_autisti_tmp"),
      { id: "S2", targa: "TI298409", stato: "nuova", descrizione: "Faro spento", tipo: "Luci" },
    ]);

    const retry = await agganciaSegnalazioniAManutenzioneEsistenteBatch({
      manutenzioneTargetId: saved.id,
      sorgenti: aggancio.failures.map((failure) => ({
        sorgenteId: failure.sorgenteId,
        sorgenteTipo: failure.sorgenteTipo,
      })),
    });

    expect(retry.ok).toBe(true);
    expect(retry.successes).toHaveLength(1);
    expect(readList("@segnalazioni_autisti_tmp").find((item) => item.id === "S2")?.linkedLavoroId).toBe(saved.id);
    expect(readList("@manutenzioni")[0].origineRefs).toHaveLength(2);
  });

  it("usa come data lavoro la segnalazione piu' vecchia tra quelle selezionate", async () => {
    seed([
      {
        id: "S1",
        targa: "TI298409",
        stato: "nuova",
        descrizione: "Pedale duro",
        tipo: "Freni",
        timestamp: new Date("2026-06-02T10:00:00").getTime(),
      },
      {
        id: "S2",
        targa: "TI298409",
        stato: "nuova",
        descrizione: "Faro spento",
        tipo: "Luci",
        timestamp: new Date("2026-05-28T18:00:00").getTime(),
      },
    ]);

    const { saved } = await creaLavoroDaGruppo(["S1", "S2"]);

    expect(saved.data).toBe("2026-05-28");
    expect(readList("@manutenzioni")[0].data).toBe("2026-05-28");
  });

  it("se le segnalazioni selezionate non hanno timestamp usa oggi come fallback", async () => {
    const { saved } = await creaLavoroDaGruppo(["S1", "S2"]);

    expect(saved.data).toBe("2026-06-04");
    expect(readList("@manutenzioni")[0].data).toBe("2026-06-04");
  });

  it("valorizza segnalatoDa con un solo autista reale", async () => {
    seed([
      {
        id: "S1",
        targa: "TI298409",
        stato: "nuova",
        descrizione: "Pedale duro",
        tipo: "Freni",
        autistaNome: "Mario Rossi",
      },
      {
        id: "S2",
        targa: "TI298409",
        stato: "nuova",
        descrizione: "Faro spento",
        tipo: "Luci",
        autistaNome: "Mario Rossi",
      },
    ]);

    const { saved } = await creaLavoroDaGruppo(["S1", "S2"]);

    expect(saved.segnalatoDa).toBe("Mario Rossi");
    expect(readList("@manutenzioni")[0].segnalatoDa).toBe("Mario Rossi");
  });

  it("valorizza segnalatoDa concatenando autisti diversi in ordine", async () => {
    seed([
      {
        id: "S1",
        targa: "TI298409",
        stato: "nuova",
        descrizione: "Pedale duro",
        tipo: "Freni",
        autistaNome: "Mario Rossi",
      },
      {
        id: "S2",
        targa: "TI298409",
        stato: "nuova",
        descrizione: "Faro spento",
        tipo: "Luci",
        autistaNome: "Luigi Verdi",
      },
    ]);

    const { saved } = await creaLavoroDaGruppo(["S1", "S2"]);

    expect(saved.segnalatoDa).toBe("Mario Rossi, Luigi Verdi");
    expect(readList("@manutenzioni")[0].segnalatoDa).toBe("Mario Rossi, Luigi Verdi");
  });

  it("usa fallback Autisti se nessuna origine ha nome o badge", async () => {
    const { saved } = await creaLavoroDaGruppo(["S1", "S2"]);

    expect(saved.segnalatoDa).toBe("Autisti");
    expect(readList("@manutenzioni")[0].segnalatoDa).toBe("Autisti");
  });
});
