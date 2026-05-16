// PROMPT 44 — D3: test del modulo cicloLegame (accesso unificato).

import { describe, expect, it } from "vitest";
import {
  isLegameOrfano,
  readChiusuraTrace,
  readLegameLavoro,
  readLegameOrigine,
  writeLegameLavoro,
  writeLegameOrigine,
} from "../cicloLegame";

describe("cicloLegame — readLegameOrigine", () => {
  it("legge `origineTipo/origineRefId/origineRefKey` su una manutenzione canonica", () => {
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

  it("tollera alias `origineId/origineKey` come fallback in lettura", () => {
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

describe("cicloLegame — readLegameLavoro", () => {
  it("legge `linkedLavoroId` (string)", () => {
    expect(readLegameLavoro({ linkedLavoroId: "man-1" })).toEqual(["man-1"]);
  });

  it("legge `linkedLavoroIds` (array) e deduplica", () => {
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

describe("cicloLegame — readChiusuraTrace", () => {
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

describe("cicloLegame — writeLegameOrigine", () => {
  it("scrive SOLO i 3 campi canonici, nessun altro", () => {
    const out = writeLegameOrigine({ tipo: "segnalazione", refId: "seg-1", refKey: "@segnalazioni_autisti_tmp" });
    expect(out).toEqual({
      origineTipo: "segnalazione",
      origineRefId: "seg-1",
      origineRefKey: "@segnalazioni_autisti_tmp",
    });
    expect(Object.keys(out)).toHaveLength(3);
  });
});

describe("cicloLegame — writeLegameLavoro", () => {
  it("singolo id: `linkedLavoroId` + `linkedMultiple:false`", () => {
    expect(writeLegameLavoro(["man-1"])).toEqual({ linkedLavoroId: "man-1", linkedMultiple: false });
  });

  it("multiplo: `linkedLavoroIds` + `linkedMultiple:true`, dedup", () => {
    expect(writeLegameLavoro(["man-1", "man-2", "man-1"])).toEqual({
      linkedLavoroIds: ["man-1", "man-2"],
      linkedMultiple: true,
    });
  });

  it("array vuoto: {} (niente scrittura)", () => {
    expect(writeLegameLavoro([])).toEqual({});
    expect(writeLegameLavoro([""])).toEqual({});
  });
});

// PROMPT 47 T2 — detection legame orfano
describe("cicloLegame — isLegameOrfano", () => {
  it("sorgente senza linkedLavoroId/Ids: false (non orfana, non collegata)", () => {
    expect(isLegameOrfano({ id: "s1", targa: "TI113417" }, [])).toBe(false);
    expect(isLegameOrfano({ id: "s2", linkedLavoroId: null }, [{ id: "m1" }])).toBe(false);
  });

  it("linkedLavoroId presente, target esiste in snapshot: false", () => {
    const sorgente = { id: "s1", linkedLavoroId: "m1", linkedMultiple: false };
    const snapshot = [{ id: "m1", targa: "TI113417" }, { id: "m2", targa: "TI113417" }];
    expect(isLegameOrfano(sorgente, snapshot)).toBe(false);
  });

  it("linkedLavoroId presente ma target NON esiste in snapshot: true (orfano)", () => {
    const sorgente = { id: "s1", linkedLavoroId: "m-fantasma", linkedMultiple: false };
    const snapshot = [{ id: "m1", targa: "TI113417" }];
    expect(isLegameOrfano(sorgente, snapshot)).toBe(true);
  });

  it("linkedLavoroIds multipli, anche UNO assente -> true", () => {
    const sorgente = { linkedLavoroIds: ["m1", "m-orfano"], linkedMultiple: true };
    expect(isLegameOrfano(sorgente, [{ id: "m1" }, { id: "m2" }])).toBe(true);
  });
});
