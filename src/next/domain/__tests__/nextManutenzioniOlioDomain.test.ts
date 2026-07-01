import { describe, expect, it } from "vitest";
import { buildConsumoOlioPerMezzo } from "../nextManutenzioniOlioDomain";
import type { NextManutenzioniLegacyDatasetRecord } from "../nextManutenzioniDomain";

// La funzione usa: rabboccoOlio, stato, targa, km, olioLitri, data, id, fornitore (officina).
// Costruisco record minimi con cast, evitando di replicare tutti i campi del type.
function rec(
  partial: Partial<NextManutenzioniLegacyDatasetRecord>,
): NextManutenzioniLegacyDatasetRecord {
  return {
    id: "x",
    targa: "AB123",
    km: null,
    ore: null,
    sottotipo: null,
    descrizione: "Rabbocco olio motore",
    eseguito: null,
    data: "2026-01-01",
    tipo: "mezzo",
    stato: "eseguita",
    rabboccoOlio: true,
    olioLitri: null,
    ...partial,
  } as NextManutenzioniLegacyDatasetRecord;
}

describe("buildConsumoOlioPerMezzo", () => {
  it("calcola litri/1.000 km tra due rabbocchi con km crescenti", () => {
    const result = buildConsumoOlioPerMezzo([
      rec({ id: "1", km: 100000, olioLitri: 1, data: "2026-01-01" }),
      rec({ id: "2", km: 104000, olioLitri: 2, data: "2026-02-01" }),
    ]);
    expect(result).toHaveLength(1);
    const mezzo = result[0];
    // 2 L su 4000 km = 0,5 L/1000 km
    expect(mezzo.eventi[1].kmPercorsi).toBe(4000);
    expect(mezzo.eventi[1].consumoL1000).toBe(0.5);
    // Il primo rabbocco non ha intervallo
    expect(mezzo.eventi[0].consumoL1000).toBeNull();
    expect(mezzo.consumoMedioL1000).toBe(0.5);
    expect(mezzo.kmCoperti).toBe(4000);
    expect(mezzo.totaleLitri).toBe(3);
    expect(mezzo.rabbocchiSenzaKm).toBe(0);
  });

  it("esclude dal calcolo i rabbocchi senza km e li conta a parte", () => {
    const result = buildConsumoOlioPerMezzo([
      rec({ id: "1", km: 100000, olioLitri: 1 }),
      rec({ id: "2", km: null, olioLitri: 2 }),
      rec({ id: "3", km: 105000, olioLitri: 5 }),
    ]);
    const mezzo = result[0];
    expect(mezzo.rabbocchiSenzaKm).toBe(1);
    // L'intervallo è tra 100000 e 105000 = 5000 km, litri del rabbocco a 105000 = 5
    // 5 L / 5000 km * 1000 = 1,0
    const evento105 = mezzo.eventi.find((e) => e.km === 105000);
    expect(evento105?.consumoL1000).toBe(1);
    expect(mezzo.totaleLitri).toBe(8);
  });

  it("ignora record non-olio e non-eseguiti", () => {
    const result = buildConsumoOlioPerMezzo([
      rec({ id: "1", km: 100000, olioLitri: 1, rabboccoOlio: false }),
      rec({ id: "2", km: 104000, olioLitri: 2, stato: "daFare" }),
    ]);
    expect(result).toHaveLength(0);
  });

  it("non calcola consumo se il delta km non è positivo", () => {
    const result = buildConsumoOlioPerMezzo([
      rec({ id: "1", km: 100000, olioLitri: 1 }),
      rec({ id: "2", km: 100000, olioLitri: 2 }),
    ]);
    const mezzo = result[0];
    expect(mezzo.consumoMedioL1000).toBeNull();
    expect(mezzo.kmCoperti).toBe(0);
  });

  it("include un rabbocco fatto su una manutenzione di altro tipo (spunta olio universale)", () => {
    // Caso reale: intervento alla vaschetta refrigerante con anche un rabbocco olio.
    // Il calcolo guarda solo rabboccoOlio + stato + km + olioLitri, NON il tipo/descrizione.
    const result = buildConsumoOlioPerMezzo([
      rec({ id: "1", km: 100000, olioLitri: 1, descrizione: "Rabbocco olio motore" }),
      rec({
        id: "2",
        km: 104000,
        olioLitri: 11,
        descrizione: "Sostituzione vaschetta liquido refrigerante",
        rabboccoOlio: true,
        stato: "eseguita",
      }),
    ]);
    expect(result).toHaveLength(1);
    const mezzo = result[0];
    expect(mezzo.eventi).toHaveLength(2);
    // 11 L su 4000 km = 2,75 → arrotondato a 1 decimale = 2,8 L/1000 km
    expect(mezzo.eventi[1].kmPercorsi).toBe(4000);
    expect(mezzo.eventi[1].consumoL1000).toBe(2.8);
    expect(mezzo.totaleLitri).toBe(12);
  });

  it("raggruppa per targa normalizzata (spazi/maiuscole)", () => {
    const result = buildConsumoOlioPerMezzo([
      rec({ id: "1", targa: "ab 123", km: 100000, olioLitri: 1 }),
      rec({ id: "2", targa: "AB123", km: 104000, olioLitri: 2 }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].eventi).toHaveLength(2);
  });

  it("popola 'eseguito da' con l'officina (campo fornitore), null se vuoto", () => {
    const result = buildConsumoOlioPerMezzo([
      rec({ id: "1", km: 100000, olioLitri: 1, fornitore: "Agustoni" }),
      rec({ id: "2", km: 104000, olioLitri: 2, fornitore: "   " }),
      // Il vecchio snapshot `eseguitoDa` NON deve essere usato: conta solo `fornitore`.
      rec({ id: "3", km: 108000, olioLitri: 1, fornitore: "Rossi", eseguitoDa: "Augustoni" }),
    ]);
    const mezzo = result[0];
    const e1 = mezzo.eventi.find((e) => e.km === 100000);
    const e2 = mezzo.eventi.find((e) => e.km === 104000);
    const e3 = mezzo.eventi.find((e) => e.km === 108000);
    // officina presente → usata
    expect(e1?.eseguitoDa).toBe("Agustoni");
    // officina vuota/spazi → null (non stringa vuota)
    expect(e2?.eseguitoDa).toBeNull();
    // ignora il vecchio snapshot `eseguitoDa`, usa `fornitore`
    expect(e3?.eseguitoDa).toBe("Rossi");
  });
});
