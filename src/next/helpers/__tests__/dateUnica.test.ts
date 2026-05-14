// @ts-nocheck
import { describe, expect, it } from "vitest";

import {
  compareISO,
  fromUserInput,
  parseAnyDate,
  toDisplay,
  toDisplayDateTime,
  toISO,
} from "../dateUnica";

describe("dateUnica", () => {
  it("parsa Date JavaScript", () => {
    expect(toISO(new Date(2026, 4, 10))).toBe("2026-05-10");
  });

  it("parsa Firestore Timestamp con toDate", () => {
    expect(toDisplay({ toDate: () => new Date(2026, 4, 10) })).toBe("10/05/2026");
  });

  it("parsa Firestore Timestamp con toMillis", () => {
    const value = new Date(2026, 4, 10, 9, 15).getTime();
    expect(toDisplayDateTime({ toMillis: () => value })).toBe("10/05/2026 09:15");
  });

  it("parsa Firestore Timestamp con seconds e nanoseconds", () => {
    const base = new Date(2026, 4, 10, 12, 30).getTime();
    expect(toDisplayDateTime({ seconds: Math.floor(base / 1000), nanoseconds: 0 })).toBe(
      "10/05/2026 12:30",
    );
  });

  it("parsa timestamp millisecondi", () => {
    expect(toISO(new Date(2026, 4, 10).getTime())).toBe("2026-05-10");
  });

  it("parsa ISO breve yyyy-mm-dd senza slittamento di giorno", () => {
    expect(toDisplay("2026-05-10")).toBe("10/05/2026");
  });

  it("parsa ISO esteso con ora", () => {
    expect(toDisplayDateTime("2026-05-10T14:35:00")).toBe("10/05/2026 14:35");
  });

  it("parsa legacy con spazi", () => {
    expect(toISO("10 05 2026")).toBe("2026-05-10");
  });

  it("parsa legacy con slash", () => {
    expect(toISO("10/05/2026")).toBe("2026-05-10");
  });

  it("parsa legacy con punti", () => {
    expect(toISO("10.05.2026")).toBe("2026-05-10");
  });

  it("ritorna null o stringa vuota per valori vuoti", () => {
    expect(parseAnyDate(null)).toBeNull();
    expect(parseAnyDate(undefined)).toBeNull();
    expect(toDisplay("")).toBe("");
  });

  it("rifiuta date invalide", () => {
    expect(parseAnyDate("31/02/2026")).toBeNull();
    expect(toISO("not-a-date")).toBeNull();
  });

  it("converte input utente con slash trattino e punto in ISO", () => {
    expect(fromUserInput("10/05/2026")).toBe("2026-05-10");
    expect(fromUserInput("10-05-2026")).toBe("2026-05-10");
    expect(fromUserInput("10.05.2026")).toBe("2026-05-10");
  });

  it("ordina ISO in modo crescente e mette null in fondo", () => {
    expect(compareISO("2026-05-10", "2026-05-11")).toBeLessThan(0);
    expect(compareISO(null, "2026-05-11")).toBeGreaterThan(0);
  });
});
