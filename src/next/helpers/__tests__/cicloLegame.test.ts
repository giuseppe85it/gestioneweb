import { describe, expect, it } from "vitest";
import {
  addLegameOrigine,
  isLegameOrfano,
  readChiusuraTrace,
  readLegameLavoro,
  readLegameOrigine,
  readLegamiOrigine,
  removeLegameOrigine,
  writeLegameLavoro,
  writeLegameOrigine,
  writeLegamiOrigine,
} from "../cicloLegame";

describe("cicloLegame - readLegameOrigine", () => {
  it("legge origineTipo/origineRefId/origineRefKey su una manutenzione canonica", () => {
    const out = readLegameOrigine({
      origineTipo: "segnalazione",
      origineRefId: "seg-123",
      origineRefKey: "@segnalazioni_autisti_tmp",
    });
    expect(out).toEqual({
      tipo: "segnalazione",
      refId: "seg-123",
      refKey: "@segnalazioni_autisti_tmp",
    });
  });

  it("ritorna null se origineTipo manca o non e' valido", () => {
    expect(readLegameOrigine({})).toBeNull();
    expect(readLegameOrigine({ origineTipo: "xyz" })).toBeNull();
    expect(readLegameOrigine(null)).toBeNull();
  });

  it("tollera alias origineId/origineKey come fallback in lettura", () => {
    const out = readLegameOrigine({
      origineTipo: "controllo",
      origineId: "ctl-1",
      origineKey: "@controlli_mezzo_autisti",
    });
    expect(out).toEqual({
      tipo: "controllo",
      refId: "ctl-1",
      refKey: "@controlli_mezzo_autisti",
    });
  });
});

describe("cicloLegame - readLegamiOrigine", () => {
  it("legge origineRefs e deduplica", () => {
    expect(
      readLegamiOrigine({
        origineRefs: [
          { tipo: "segnalazione", refId: "seg-1", refKey: "@segnalazioni_autisti_tmp" },
          { tipo: "segnalazione", refId: "seg-1", refKey: "@segnalazioni_autisti_tmp" },
          { tipo: "controllo", refId: "ctl-1", refKey: "@controlli_mezzo_autisti" },
        ],
      }),
    ).toEqual([
      { tipo: "segnalazione", refId: "seg-1", refKey: "@segnalazioni_autisti_tmp" },
      { tipo: "controllo", refId: "ctl-1", refKey: "@controlli_mezzo_autisti" },
    ]);
  });

  it("fallback da origine singola legacy", () => {
    expect(
      readLegamiOrigine({
        origineTipo: "controllo",
        origineRefId: "ctl-legacy",
        origineRefKey: "@controlli_mezzo_autisti",
      }),
    ).toEqual([
      { tipo: "controllo", refId: "ctl-legacy", refKey: "@controlli_mezzo_autisti" },
    ]);
  });
});

describe("cicloLegame - readLegameLavoro", () => {
  it("legge linkedLavoroId string", () => {
    expect(readLegameLavoro({ linkedLavoroId: "man-1" })).toEqual(["man-1"]);
  });

  it("legge linkedLavoroIds array e deduplica", () => {
    expect(readLegameLavoro({ linkedLavoroIds: ["man-1", "man-2", "man-1"] })).toEqual([
      "man-1",
      "man-2",
    ]);
  });

  it("merge tollerante di single + array", () => {
    expect(
      readLegameLavoro({ linkedLavoroId: "man-3", linkedLavoroIds: ["man-3", "man-4"] }),
    ).toEqual(["man-3", "man-4"]);
  });

  it("ritorna [] se nessun campo presente", () => {
    expect(readLegameLavoro({})).toEqual([]);
    expect(readLegameLavoro(null)).toEqual([]);
  });
});

describe("cicloLegame - readChiusuraTrace", () => {
  it("legge la traccia di chiusura", () => {
    const out = readChiusuraTrace({
      chiusuraDi: "gomme_evento",
      chiusuraRefId: "evt-99",
      chiusuraData: 1234567890,
    });
    expect(out).toEqual({
      chiusuraDi: "gomme_evento",
      chiusuraRefId: "evt-99",
      chiusuraData: 1234567890,
    });
  });

  it("ritorna null se chiusuraDi manca", () => {
    expect(readChiusuraTrace({ chiusuraRefId: "x" })).toBeNull();
    expect(readChiusuraTrace({})).toBeNull();
  });
});

describe("cicloLegame - writeLegameOrigine/writeLegamiOrigine", () => {
  it("scrive mirror legacy + origineRefs per segnalazione/controllo", () => {
    expect(
      writeLegameOrigine({
        tipo: "segnalazione",
        refId: "seg-1",
        refKey: "@segnalazioni_autisti_tmp",
      }),
    ).toEqual({
      origineTipo: "segnalazione",
      origineRefId: "seg-1",
      origineRefKey: "@segnalazioni_autisti_tmp",
      origineRefs: [
        {
          tipo: "segnalazione",
          refId: "seg-1",
          refKey: "@segnalazioni_autisti_tmp",
        },
      ],
    });
  });

  it("writeLegamiOrigine mantiene mirror legacy sul primo elemento", () => {
    expect(
      writeLegamiOrigine([
        { tipo: "segnalazione", refId: "seg-1", refKey: "@segnalazioni_autisti_tmp" },
        { tipo: "controllo", refId: "ctl-1", refKey: "@controlli_mezzo_autisti" },
      ]),
    ).toEqual({
      origineRefs: [
        { tipo: "segnalazione", refId: "seg-1", refKey: "@segnalazioni_autisti_tmp" },
        { tipo: "controllo", refId: "ctl-1", refKey: "@controlli_mezzo_autisti" },
      ],
      origineTipo: "segnalazione",
      origineRefId: "seg-1",
      origineRefKey: "@segnalazioni_autisti_tmp",
    });
  });

  it("add/remove mantiene il mirror legacy coerente", () => {
    const base = {
      origineTipo: "segnalazione",
      origineRefId: "seg-1",
      origineRefKey: "@segnalazioni_autisti_tmp",
    };
    const added = addLegameOrigine(base, {
      tipo: "controllo",
      refId: "ctl-1",
      refKey: "@controlli_mezzo_autisti",
    });
    expect(readLegamiOrigine(added)).toHaveLength(2);
    expect(removeLegameOrigine(added, { tipo: "segnalazione", refId: "seg-1" })).toEqual({
      origineRefs: [{ tipo: "controllo", refId: "ctl-1", refKey: "@controlli_mezzo_autisti" }],
      origineTipo: "controllo",
      origineRefId: "ctl-1",
      origineRefKey: "@controlli_mezzo_autisti",
    });
  });
});

describe("cicloLegame - writeLegameLavoro", () => {
  it("singolo id: linkedLavoroId + cleanup array", () => {
    expect(writeLegameLavoro(["man-1"])).toEqual({
      linkedLavoroId: "man-1",
      linkedLavoroIds: null,
      linkedMultiple: false,
    });
  });

  it("multiplo: linkedLavoroIds + cleanup singolo", () => {
    expect(writeLegameLavoro(["man-1", "man-2", "man-1"])).toEqual({
      linkedLavoroId: null,
      linkedLavoroIds: ["man-1", "man-2"],
      linkedMultiple: true,
    });
  });

  it("array vuoto: clear esplicito dei campi link", () => {
    expect(writeLegameLavoro([])).toEqual({
      linkedLavoroId: null,
      linkedLavoroIds: null,
      linkedMultiple: false,
    });
    expect(writeLegameLavoro([""])).toEqual({
      linkedLavoroId: null,
      linkedLavoroIds: null,
      linkedMultiple: false,
    });
  });
});

describe("cicloLegame - isLegameOrfano", () => {
  it("sorgente senza linkedLavoroId/Ids: false", () => {
    expect(isLegameOrfano({ id: "s1", targa: "TI113417" }, [])).toBe(false);
    expect(isLegameOrfano({ id: "s2", linkedLavoroId: null }, [{ id: "m1" }])).toBe(false);
  });

  it("linkedLavoroId presente, target esiste in snapshot: false", () => {
    const sorgente = { id: "s1", linkedLavoroId: "m1", linkedMultiple: false };
    const snapshot = [{ id: "m1", targa: "TI113417" }, { id: "m2", targa: "TI113417" }];
    expect(isLegameOrfano(sorgente, snapshot)).toBe(false);
  });

  it("linkedLavoroId presente ma target non esiste in snapshot: true", () => {
    const sorgente = { id: "s1", linkedLavoroId: "m-fantasma", linkedMultiple: false };
    const snapshot = [{ id: "m1", targa: "TI113417" }];
    expect(isLegameOrfano(sorgente, snapshot)).toBe(true);
  });

  it("linkedLavoroIds multipli, anche uno assente -> true", () => {
    const sorgente = { linkedLavoroIds: ["m1", "m-orfano"], linkedMultiple: true };
    expect(isLegameOrfano(sorgente, [{ id: "m1" }, { id: "m2" }])).toBe(true);
  });
});
