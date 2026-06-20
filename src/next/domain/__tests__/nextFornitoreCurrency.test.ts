import { describe, expect, it } from "vitest";
import {
  buildFornitoreCurrencyMap,
  inheritCurrencyFromFornitore,
  normalizeFornitoreMatchKey,
} from "../nextFornitoreCurrency";

describe("normalizeFornitoreMatchKey", () => {
  it("normalizza maiuscole, spazi e accenti", () => {
    expect(normalizeFornitoreMatchKey("  Truck   Service  ")).toBe("TRUCK SERVICE");
    expect(normalizeFornitoreMatchKey("Garage Süd")).toBe("GARAGE SUD");
  });

  it("rimuove i suffissi societari finali ma non l'unico token", () => {
    expect(normalizeFornitoreMatchKey("Truck Service Sagl")).toBe("TRUCK SERVICE");
    expect(normalizeFornitoreMatchKey("ACME S.r.l.")).toBe("ACME");
    expect(normalizeFornitoreMatchKey("SA")).toBe("SA");
  });

  it("ritorna stringa vuota se non normalizzabile", () => {
    expect(normalizeFornitoreMatchKey("")).toBe("");
    expect(normalizeFornitoreMatchKey("   ")).toBe("");
    expect(normalizeFornitoreMatchKey(null)).toBe("");
  });

  it("fa combaciare varianti dello stesso fornitore", () => {
    expect(normalizeFornitoreMatchKey("TRUCK SERVICE SAGL")).toBe(
      normalizeFornitoreMatchKey("Truck Service"),
    );
  });
});

describe("buildFornitoreCurrencyMap", () => {
  it("indicizza solo i fornitori con valuta valorizzata", () => {
    const map = buildFornitoreCurrencyMap([
      { nome: "Truck Service Sagl", valuta: "CHF" },
      { nome: "Ricambi Italia", valuta: "EUR" },
      { nome: "Senza Valuta", valuta: null },
    ]);
    expect(map.get("TRUCK SERVICE")).toBe("CHF");
    expect(map.get("RICAMBI ITALIA")).toBe("EUR");
    expect(map.has("SENZA VALUTA")).toBe(false);
  });

  it("scarta le chiavi in conflitto (stesso nome normalizzato, valute diverse)", () => {
    const map = buildFornitoreCurrencyMap([
      { nome: "Truck Service Sagl", valuta: "CHF" },
      { nome: "Truck Service", valuta: "EUR" },
    ]);
    // ambiguo: nessuno dei due eredita
    expect(map.has("TRUCK SERVICE")).toBe(false);
  });
});

describe("inheritCurrencyFromFornitore", () => {
  const map = buildFornitoreCurrencyMap([
    { nome: "Truck Service Sagl", valuta: "CHF" },
  ]);

  it("eredita la valuta del fornitore quando manca/è UNKNOWN", () => {
    expect(inheritCurrencyFromFornitore("UNKNOWN", "TRUCK SERVICE", map)).toBe("CHF");
    expect(inheritCurrencyFromFornitore(null, "Truck Service Sagl", map)).toBe("CHF");
    expect(inheritCurrencyFromFornitore("", "truck service", map)).toBe("CHF");
  });

  it("non sovrascrive una valuta già esplicita", () => {
    expect(inheritCurrencyFromFornitore("EUR", "TRUCK SERVICE", map)).toBeNull();
    expect(inheritCurrencyFromFornitore("CHF", "TRUCK SERVICE", map)).toBeNull();
  });

  it("non eredita se il fornitore non è in mappa o manca", () => {
    expect(inheritCurrencyFromFornitore("UNKNOWN", "Fornitore Ignoto", map)).toBeNull();
    expect(inheritCurrencyFromFornitore("UNKNOWN", null, map)).toBeNull();
    expect(inheritCurrencyFromFornitore("UNKNOWN", "TRUCK SERVICE", new Map())).toBeNull();
  });
});
