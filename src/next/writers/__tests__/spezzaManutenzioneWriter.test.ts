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
  runWithCloneWriteScopedAllowance: vi.fn((_scope: string, fn: () => Promise<void>) => fn()),
}));

import { spezzaManutenzione } from "../spezzaManutenzioneWriter";

type RawRecord = Record<string, unknown>;

function seed(records: RawRecord[]): void {
  store.clear();
  store.set("@manutenzioni", records);
}

function manutenzioni(): RawRecord[] {
  const value = store.get("@manutenzioni");
  return Array.isArray(value) ? (value as RawRecord[]) : [];
}

const ORIGINALE_GOMME: RawRecord = {
  id: "orig-1",
  tipo: "mezzo",
  targa: "TI 123456",
  descrizione: "Cambio gomme + fanale posteriore",
  data: "2026-06-20",
  stato: "daFare",
  urgenza: "alta",
  segnalatoDa: "MARIO ROSSI",
  origineTipo: "segnalazione",
  origineRefId: "seg-9",
  materiali: [{ id: "mat-1", quantita: 2 }],
  gommeInterventoTipo: "ordinario",
  assiCoinvolti: ["anteriore"],
  rabboccoOlio: true,
  olioLitri: 2,
};

describe("spezzaManutenzioneWriter", () => {
  beforeEach(() => {
    store.clear();
  });

  it("crea il resto daFare con parentela, senza materiali né marker gomme/olio", async () => {
    seed([ORIGINALE_GOMME]);
    const result = await spezzaManutenzione({
      manutenzioneId: "orig-1",
      descrizioneResto: "Fanale posteriore da sostituire",
    });
    expect(result.ok).toBe(true);
    const list = manutenzioni();
    expect(list).toHaveLength(2);
    const resto = list[1];
    expect(resto.spezzatoDaId).toBe("orig-1");
    expect(resto.stato).toBe("daFare");
    expect(resto.tipo).toBe("mezzo");
    expect(resto.targa).toBe("TI123456");
    expect(resto.descrizione).toBe("Fanale posteriore da sostituire");
    expect(resto.data).toBe("2026-06-20");
    expect(resto.urgenza).toBe("alta");
    expect(resto.segnalatoDa).toBe("MARIO ROSSI");
    expect(resto.origineTipo).toBe("manuale");
    expect(resto.origineRefId).toBeNull();
    expect(resto.materiali).toEqual([]);
    expect(resto.km).toBeNull();
    expect("gommeInterventoTipo" in resto).toBe(false);
    expect("assiCoinvolti" in resto).toBe(false);
    expect("rabboccoOlio" in resto).toBe(false);
    expect("olioLitri" in resto).toBe(false);
    expect(resto.id).toBeTruthy();
    expect(resto.id).not.toBe("orig-1");
    // l'originale NON viene toccato senza descrizioneOriginale
    expect(list[0]).toEqual(ORIGINALE_GOMME);
  });

  it("caso Dividi: aggiorna la descrizione dell'originale e crea il resto", async () => {
    seed([ORIGINALE_GOMME]);
    const result = await spezzaManutenzione({
      manutenzioneId: "orig-1",
      descrizioneResto: "Fanale posteriore",
      descrizioneOriginale: "Cambio gomme",
    });
    expect(result.ok).toBe(true);
    const list = manutenzioni();
    expect(list[0].descrizione).toBe("Cambio gomme");
    // gli altri campi dell'originale restano intatti (merge additivo)
    expect(list[0].origineRefId).toBe("seg-9");
    expect(list[0].gommeInterventoTipo).toBe("ordinario");
    expect(list[1].descrizione).toBe("Fanale posteriore");
  });

  it("rifiuta id sintetico posizionale (record storico senza id stabile)", async () => {
    seed([ORIGINALE_GOMME]);
    const result = await spezzaManutenzione({
      manutenzioneId: "manutenzione:TI123456:3",
      descrizioneResto: "Qualcosa",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("id stabile");
    expect(manutenzioni()).toHaveLength(1);
  });

  it("rifiuta descrizione resto vuota e originale non trovato", async () => {
    seed([ORIGINALE_GOMME]);
    const vuota = await spezzaManutenzione({ manutenzioneId: "orig-1", descrizioneResto: "   " });
    expect(vuota.ok).toBe(false);
    const mancante = await spezzaManutenzione({ manutenzioneId: "orig-404", descrizioneResto: "X" });
    expect(mancante.ok).toBe(false);
    if (!mancante.ok) expect(mancante.error).toContain("non trovata");
    expect(manutenzioni()).toHaveLength(1);
  });

  it("genera id unici per resti creati in rapida successione", async () => {
    seed([ORIGINALE_GOMME]);
    const r1 = await spezzaManutenzione({ manutenzioneId: "orig-1", descrizioneResto: "Parte A" });
    const r2 = await spezzaManutenzione({ manutenzioneId: "orig-1", descrizioneResto: "Parte B" });
    expect(r1.ok && r2.ok).toBe(true);
    if (r1.ok && r2.ok) expect(r1.restoId).not.toBe(r2.restoId);
    expect(manutenzioni()).toHaveLength(3);
  });
});
