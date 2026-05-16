// PROMPT 44 — D6: test etichetta "Storico" per stati vuoti/null.

import { describe, expect, it } from "vitest";
import { formatStatoManutenzione } from "../formatStatoManutenzione";

describe("formatStatoManutenzione (D6)", () => {
  it("null -> 'Storico'", () => {
    expect(formatStatoManutenzione(null)).toBe("Storico");
  });

  it("undefined -> 'Storico'", () => {
    expect(formatStatoManutenzione(undefined)).toBe("Storico");
  });

  it("stringa vuota -> 'Storico'", () => {
    expect(formatStatoManutenzione("")).toBe("Storico");
  });

  it("stringa solo whitespace -> 'Storico'", () => {
    expect(formatStatoManutenzione("   ")).toBe("Storico");
  });

  it("valore reale: 'eseguita' -> 'eseguita'", () => {
    expect(formatStatoManutenzione("eseguita")).toBe("eseguita");
  });

  it("valore reale: 'daFare' -> 'daFare'", () => {
    expect(formatStatoManutenzione("daFare")).toBe("daFare");
  });

  it("tipo non-stringa -> 'Storico'", () => {
    expect(formatStatoManutenzione(0)).toBe("Storico");
    expect(formatStatoManutenzione(false)).toBe("Storico");
    expect(formatStatoManutenzione({})).toBe("Storico");
  });

  it("trim su valori validi", () => {
    expect(formatStatoManutenzione("  eseguita  ")).toBe("eseguita");
  });
});
