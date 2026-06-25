import { describe, expect, it } from "vitest";
import {
  addCollegamento,
  defaultRefKeyForTipo,
  hasCollegamento,
  readCollegamenti,
  removeCollegamento,
  writeCollegamenti,
  type LegameUniversaleRef,
} from "../legamiUniversali";

describe("legamiUniversali - readCollegamenti", () => {
  it("ritorna [] se il campo manca o non e' un array", () => {
    expect(readCollegamenti({})).toEqual([]);
    expect(readCollegamenti({ collegamenti: "x" })).toEqual([]);
    expect(readCollegamenti(null)).toEqual([]);
  });

  it("legge collegamenti validi e completa refKey mancante dal tipo", () => {
    const out = readCollegamenti({
      collegamenti: [
        { tipo: "manutenzione", refId: "M-2" },
        { tipo: "segnalazione", refId: "S-9", refKey: "@segnalazioni_autisti_tmp" },
      ],
    });
    expect(out).toEqual([
      { tipo: "manutenzione", refId: "M-2", refKey: "@manutenzioni" },
      { tipo: "segnalazione", refId: "S-9", refKey: "@segnalazioni_autisti_tmp" },
    ]);
  });

  it("scarta entry con tipo non valido o refId vuoto", () => {
    const out = readCollegamenti({
      collegamenti: [
        { tipo: "fattura_xyz", refId: "1" },
        { tipo: "manutenzione", refId: "" },
        { tipo: "documento", refId: "D-1" },
      ],
    });
    expect(out).toEqual([{ tipo: "documento", refId: "D-1", refKey: "@documenti_mezzi" }]);
  });

  it("deduplica per tipo+refId", () => {
    const out = readCollegamenti({
      collegamenti: [
        { tipo: "manutenzione", refId: "M-2" },
        { tipo: "manutenzione", refId: "M-2", refKey: "@manutenzioni" },
      ],
    });
    expect(out).toHaveLength(1);
  });
});

describe("legamiUniversali - write/add/remove/has", () => {
  it("writeCollegamenti normalizza e patcha solo il campo collegamenti", () => {
    const refs: LegameUniversaleRef[] = [
      { tipo: "controllo", refId: "C-1", refKey: null },
    ];
    expect(writeCollegamenti(refs)).toEqual({
      collegamenti: [{ tipo: "controllo", refId: "C-1", refKey: "@controlli_mezzo_autisti" }],
    });
  });

  it("addCollegamento e' idempotente per tipo+refId", () => {
    const r1 = addCollegamento({}, { tipo: "manutenzione", refId: "M-5", refKey: null });
    const r2 = addCollegamento(r1, { tipo: "manutenzione", refId: "M-5", refKey: null });
    expect(readCollegamenti(r2)).toHaveLength(1);
  });

  it("removeCollegamento toglie il solo ref indicato", () => {
    const base = writeCollegamenti([
      { tipo: "manutenzione", refId: "M-1", refKey: null },
      { tipo: "segnalazione", refId: "S-1", refKey: null },
    ]);
    const out = removeCollegamento(base, { tipo: "manutenzione", refId: "M-1" });
    expect(readCollegamenti(out)).toEqual([
      { tipo: "segnalazione", refId: "S-1", refKey: "@segnalazioni_autisti_tmp" },
    ]);
  });

  it("hasCollegamento riconosce un collegamento esistente", () => {
    const base = addCollegamento({}, { tipo: "documento", refId: "D-7", refKey: null });
    expect(hasCollegamento(base, { tipo: "documento", refId: "D-7" })).toBe(true);
    expect(hasCollegamento(base, { tipo: "documento", refId: "D-8" })).toBe(false);
  });

  it("defaultRefKeyForTipo mappa ogni tipo alla sua collezione", () => {
    expect(defaultRefKeyForTipo("manutenzione")).toBe("@manutenzioni");
    expect(defaultRefKeyForTipo("segnalazione")).toBe("@segnalazioni_autisti_tmp");
    expect(defaultRefKeyForTipo("controllo")).toBe("@controlli_mezzo_autisti");
    expect(defaultRefKeyForTipo("documento")).toBe("@documenti_mezzi");
  });
});
