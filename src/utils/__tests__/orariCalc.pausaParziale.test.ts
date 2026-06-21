import { describe, expect, it } from "vitest";
import {
  aggregatiMese,
  calcTotaleNettoMinuti,
  monteOreGiornoMinuti,
  pausaEffettivaMinuti,
  pausaLabel,
  type OrarioGiornoRecord,
} from "../orariCalc";

// Helper: record "lavoro" completo per i test di aggregato.
function rec(over: Partial<OrarioGiornoRecord>): OrarioGiornoRecord {
  return {
    badge: "B1",
    data: "2026-06-01",
    tipo: "lavoro",
    inizio: "08:00",
    fine: "17:00", // lordo 540 min (9:00)
    notte: false,
    noPausa: false,
    note: "",
    createdAt: 0,
    updatedAt: 0,
    ...over,
  };
}

describe("pausaEffettivaMinuti — single source con fallback retrocompat", () => {
  it("usa pausaMin quando è un numero valido (parziale)", () => {
    expect(pausaEffettivaMinuti({ pausaMin: 30 })).toBe(30);
    expect(pausaEffettivaMinuti({ pausaMin: 0 })).toBe(0);
    expect(pausaEffettivaMinuti({ pausaMin: 45, noPausa: false })).toBe(45);
  });

  it("arrotonda pausaMin frazionari", () => {
    expect(pausaEffettivaMinuti({ pausaMin: 45.7 })).toBe(46);
  });

  it("retrocompat: record vecchio con solo noPausa (senza pausaMin)", () => {
    expect(pausaEffettivaMinuti({ noPausa: true })).toBe(0); // nessuna pausa
    expect(pausaEffettivaMinuti({ noPausa: false })).toBe(60); // pausa 1h piena
    expect(pausaEffettivaMinuti({})).toBe(60); // default
  });

  it("pausaMin non valido (negativo/null) → fallback su noPausa", () => {
    expect(pausaEffettivaMinuti({ pausaMin: -5, noPausa: false })).toBe(60);
    expect(pausaEffettivaMinuti({ pausaMin: null, noPausa: true })).toBe(0);
    expect(pausaEffettivaMinuti({ pausaMin: Number.NaN, noPausa: false })).toBe(60);
  });
});

describe("calcTotaleNettoMinuti — pausa parziale", () => {
  it("scala solo i minuti reali di pausa dal lordo", () => {
    expect(calcTotaleNettoMinuti({ tipo: "lavoro", inizio: "08:00", fine: "17:00", pausaMin: 30 })).toBe(510);
    expect(calcTotaleNettoMinuti({ tipo: "lavoro", inizio: "08:00", fine: "17:00", pausaMin: 0 })).toBe(540);
    expect(calcTotaleNettoMinuti({ tipo: "lavoro", inizio: "08:00", fine: "17:00", pausaMin: 60 })).toBe(480);
  });

  it("retrocompat: record vecchio con solo noPausa", () => {
    expect(calcTotaleNettoMinuti({ tipo: "lavoro", inizio: "08:00", fine: "17:00", noPausa: true })).toBe(540);
    expect(calcTotaleNettoMinuti({ tipo: "lavoro", inizio: "08:00", fine: "17:00", noPausa: false })).toBe(480);
  });

  it("turno oltre mezzanotte con pausa parziale", () => {
    // 22:00 → 06:00 = 480 lordo; pausa 30 → 450
    expect(calcTotaleNettoMinuti({ tipo: "lavoro", inizio: "22:00", fine: "06:00", pausaMin: 30 })).toBe(450);
  });

  it("pausa maggiore del lordo non porta il netto sotto zero", () => {
    // 08:00 → 08:20 = 20 lordo; pausa 60 → max(0, -40) = 0
    expect(calcTotaleNettoMinuti({ tipo: "lavoro", inizio: "08:00", fine: "08:20", pausaMin: 60 })).toBe(0);
  });

  it("assenza o orari mancanti → null", () => {
    expect(calcTotaleNettoMinuti({ tipo: "ferie", inizio: "08:00", fine: "17:00", pausaMin: 30 })).toBeNull();
    expect(calcTotaleNettoMinuti({ tipo: "lavoro", inizio: null, fine: "17:00", pausaMin: 30 })).toBeNull();
  });
});

describe("pausaLabel — Sì / No / X min", () => {
  it("etichette per i minuti reali", () => {
    expect(pausaLabel({ tipo: "lavoro", pausaMin: 0 })).toBe("No");
    expect(pausaLabel({ tipo: "lavoro", pausaMin: 60 })).toBe("Sì");
    expect(pausaLabel({ tipo: "lavoro", pausaMin: 30 })).toBe("30 min");
  });

  it("retrocompat e assenza", () => {
    expect(pausaLabel({ tipo: "lavoro", noPausa: true })).toBe("No");
    expect(pausaLabel({ tipo: "lavoro", noPausa: false })).toBe("Sì");
    expect(pausaLabel({ tipo: "ferie", pausaMin: 30 })).toBe("-");
  });
});

describe("monteOreGiornoMinuti — usa il netto con pausa parziale", () => {
  it("scarto su base 9h (540) col netto della pausa reale", () => {
    // netto 540 (pausa 0) → 0; netto 510 (pausa 30) → -30
    expect(monteOreGiornoMinuti({ tipo: "lavoro", inizio: "08:00", fine: "17:00", pausaMin: 0 })).toBe(0);
    expect(monteOreGiornoMinuti({ tipo: "lavoro", inizio: "08:00", fine: "17:00", pausaMin: 30 })).toBe(-30);
  });
});

describe("aggregatiMese — coerente con la pausa parziale", () => {
  it("somma i netti con i minuti di pausa reali", () => {
    const agg = aggregatiMese([
      rec({ data: "2026-06-01", pausaMin: 0 }), // netto 540
      rec({ data: "2026-06-02", pausaMin: 30 }), // netto 510
    ]);
    expect(agg.totaleMinuti).toBe(1050);
    expect(agg.giorniLavorati).toBe(2);
  });
});
