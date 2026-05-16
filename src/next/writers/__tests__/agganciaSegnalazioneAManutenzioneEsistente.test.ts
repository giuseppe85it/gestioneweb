// PROMPT 47 T1 — test del writer `agganciaSegnalazioneAManutenzioneEsistente`.

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

import { agganciaSegnalazioneAManutenzioneEsistente } from "../agganciaSegnalazioneAManutenzioneEsistenteWriter";

type RawRecord = Record<string, unknown>;

function seed(
  manutenzioni: RawRecord[] = [],
  segnalazioni: RawRecord[] = [],
  controlli: RawRecord[] = [],
): void {
  store.clear();
  store.set("@manutenzioni", manutenzioni);
  store.set("@segnalazioni_autisti_tmp", segnalazioni);
  store.set("@controlli_mezzo_autisti", controlli);
}

function manutenzioni(): RawRecord[] {
  return (store.get("@manutenzioni") as RawRecord[]) ?? [];
}

function segnalazioni(): RawRecord[] {
  return (store.get("@segnalazioni_autisti_tmp") as RawRecord[]) ?? [];
}

function controlli(): RawRecord[] {
  return (store.get("@controlli_mezzo_autisti") as RawRecord[]) ?? [];
}

describe("agganciaSegnalazioneAManutenzioneEsistente (PROMPT 47 T1)", () => {
  beforeEach(() => {
    store.clear();
  });

  it("A — target daFare stand-alone + segnalazione orfana: aggancia, scrive back-link, NO chiusura propagata", async () => {
    seed(
      [{ id: "M1", targa: "TI113417", stato: "daFare", descrizione: "Tagliando" }],
      [{ id: "S1", targa: "TI113417", autistaNome: "Mario Rossi", stato: "nuova", letta: false }],
    );
    const res = await agganciaSegnalazioneAManutenzioneEsistente({
      sorgenteId: "S1",
      sorgenteTipo: "segnalazione",
      manutenzioneTargetId: "M1",
    });
    expect(res.ok).toBe(true);
    expect(res.manutenzioneId).toBe("M1");
    expect(res.chiusuraPropagata).toBe(false);

    const segn = segnalazioni()[0];
    expect(segn.linkedLavoroId).toBe("M1");
    expect(segn.stato).toBe("presa_in_carico");
    expect(segn.letta).toBe(true);
    // PROMPT 50 R2: dataPresaInCarico NON e' piu' scritta come effetto collaterale
    // dell'aggancio. Solo `segnaPresaInCaricoSegnalazione` (azione esplicita) la scrive.
    expect(segn.dataPresaInCarico).toBeUndefined();

    // Back-link scritto su target stand-alone
    const target = manutenzioni()[0];
    expect(target.origineTipo).toBe("segnalazione");
    expect(target.origineRefId).toBe("S1");
    expect(target.origineRefKey).toBe("@segnalazioni_autisti_tmp");
  });

  it("B — target eseguita stand-alone + segnalazione orfana: aggancia + back-link + chiusura propagata", async () => {
    seed(
      [{ id: "M2", targa: "TI113417", stato: "eseguita", descrizione: "Cambio gomme", data: "2026-05-12" }],
      [{ id: "S2", targa: "TI113417", autistaNome: "Riccardo F.", stato: "nuova", letta: false }],
    );
    const res = await agganciaSegnalazioneAManutenzioneEsistente({
      sorgenteId: "S2",
      sorgenteTipo: "segnalazione",
      manutenzioneTargetId: "M2",
    });
    expect(res.ok).toBe(true);
    expect(res.chiusuraPropagata).toBe(true);

    const segn = segnalazioni()[0];
    // chiudiSegnalazioneDaEvento scrive stato="chiusa", chiusuraDi="manutenzione", chiusuraRefId=M2
    expect(segn.stato).toBe("chiusa");
    expect(segn.chiusuraDi).toBe("manutenzione");
    expect(segn.chiusuraRefId).toBe("M2");

    // PROMPT 50 R1: chiusuraData EREDITA dalla data manutenzione (12/05/2026),
    // NON Date.now() (= 15/05 nel caso TI298409 reale).
    expect(typeof segn.chiusuraData).toBe("number");
    const expectedTs = new Date(2026, 4, 12, 0, 0, 0, 0).getTime(); // 12/05/2026 mezzanotte locale
    expect(segn.chiusuraData).toBe(expectedTs);

    // Back-link sul target stand-alone
    const target = manutenzioni()[0];
    expect(target.origineTipo).toBe("segnalazione");
    expect(target.origineRefId).toBe("S2");
  });

  it("C — idempotente: sorgente gia' linked al target -> alreadyLinked, zero scritture", async () => {
    seed(
      [{ id: "M3", targa: "TI113417", stato: "daFare", descrizione: "X", origineTipo: "segnalazione", origineRefId: "S3", origineRefKey: "@segnalazioni_autisti_tmp" }],
      [{ id: "S3", targa: "TI113417", linkedLavoroId: "M3", linkedMultiple: false, stato: "presa_in_carico", letta: true }],
    );
    const segnPre = JSON.stringify(segnalazioni());
    const manuPre = JSON.stringify(manutenzioni());
    const res = await agganciaSegnalazioneAManutenzioneEsistente({
      sorgenteId: "S3",
      sorgenteTipo: "segnalazione",
      manutenzioneTargetId: "M3",
    });
    expect(res.ok).toBe(true);
    expect(res.alreadyLinked).toBe(true);
    expect(JSON.stringify(segnalazioni())).toBe(segnPre);
    expect(JSON.stringify(manutenzioni())).toBe(manuPre);
  });

  it("D — cambio link: sorgente linked a M-OLD -> sovrascrive con M-NEW, NON sovrascrive back-link target gia' diverso (errore esplicito)", async () => {
    // Target M-NEW ha gia' back-link ad altra sorgente: rifiuto.
    seed(
      [
        {
          id: "M-NEW",
          targa: "TI113417",
          stato: "daFare",
          descrizione: "Nuovo target",
          origineTipo: "controllo",
          origineRefId: "C-ALTRA",
          origineRefKey: "@controlli_mezzo_autisti",
        },
      ],
      [{ id: "S4", targa: "TI113417", linkedLavoroId: "M-OLD", linkedMultiple: false, stato: "presa_in_carico" }],
    );
    const res = await agganciaSegnalazioneAManutenzioneEsistente({
      sorgenteId: "S4",
      sorgenteTipo: "segnalazione",
      manutenzioneTargetId: "M-NEW",
    });
    expect(res.ok).toBe(false);
    expect(res.error).toContain("gia' collegata a un'altra sorgente");
    // Sorgente NON e' stata modificata: linkedLavoroId resta M-OLD
    expect(segnalazioni()[0].linkedLavoroId).toBe("M-OLD");
  });

  it("E — target inesistente: errore esplicito, zero scritture", async () => {
    seed([], [{ id: "S5", targa: "TI113417" }]);
    const segnPre = JSON.stringify(segnalazioni());
    const res = await agganciaSegnalazioneAManutenzioneEsistente({
      sorgenteId: "S5",
      sorgenteTipo: "segnalazione",
      manutenzioneTargetId: "M-INESISTENTE",
    });
    expect(res.ok).toBe(false);
    expect(res.error).toContain("non trovata");
    expect(JSON.stringify(segnalazioni())).toBe(segnPre);
  });

  it("F — aggancio controllo a target daFare: linkedLavoroId + letta=true, NO stato/dataPresaInCarico", async () => {
    seed(
      [{ id: "M6", targa: "TI113417", stato: "daFare", descrizione: "Test" }],
      [],
      [{ id: "C6", targaCamion: "TI113417", check: { freni: false }, letta: false }],
    );
    const res = await agganciaSegnalazioneAManutenzioneEsistente({
      sorgenteId: "C6",
      sorgenteTipo: "controllo",
      manutenzioneTargetId: "M6",
    });
    expect(res.ok).toBe(true);
    const ctrl = controlli()[0];
    expect(ctrl.linkedLavoroId).toBe("M6");
    expect(ctrl.letta).toBe(true);
    // I controlli non hanno il campo `stato` o `dataPresaInCarico`
    expect(ctrl.stato).toBeUndefined();
    expect(ctrl.dataPresaInCarico).toBeUndefined();
  });
});
