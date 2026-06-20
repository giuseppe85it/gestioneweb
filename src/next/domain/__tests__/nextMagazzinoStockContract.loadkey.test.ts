import { describe, expect, it } from "vitest";
import {
  buildNextMagazzinoProcurementArrivoLoadKey,
  buildNextMagazzinoStockLoadKey,
} from "../nextMagazzinoStockContract";

// Regression guard del dedup "una sola giacenza": la chiave anti-doppione del
// carico arrivi deve essere IDENTICA tra il writer (ordini) e il Magazzino, per
// lo stesso arrivo, altrimenti lo stesso materiale verrebbe contato due volte.
describe("buildNextMagazzinoProcurementArrivoLoadKey", () => {
  const base = {
    sourceDocId: "ORD123:MAT456",
    descrizione: "AdBlue",
    fornitore: "Fornitore X",
    unita: "lt",
    quantita: 10,
    data: "06/06/2026",
  };

  it("coincide con la chiave del flusso Magazzino (PROCUREMENT_ARRIVO, senza rowIndex)", () => {
    const helper = buildNextMagazzinoProcurementArrivoLoadKey(base);
    const magazzino = buildNextMagazzinoStockLoadKey({
      sourceType: "PROCUREMENT_ARRIVO",
      sourceDocId: base.sourceDocId,
      descrizione: base.descrizione,
      fornitore: base.fornitore,
      unita: base.unita,
      quantita: base.quantita,
      data: base.data,
    });
    expect(helper).toBe(magazzino);
  });

  it("non include un rowIndex (token NOROW), così la chiave è stabile per la riga d'arrivo", () => {
    expect(buildNextMagazzinoProcurementArrivoLoadKey(base)).toContain("NOROW");
  });

  it("stesso orderId:materialId => stessa chiave da entrambi i flussi", () => {
    const fromPanel = buildNextMagazzinoProcurementArrivoLoadKey({
      ...base,
      sourceDocId: `${"ORD123"}:${"MAT456"}`,
    });
    const fromMagazzino = buildNextMagazzinoProcurementArrivoLoadKey({
      ...base,
      sourceDocId: "ORD123:MAT456",
    });
    expect(fromPanel).toBe(fromMagazzino);
  });

  it("arrivi di materiali diversi => chiavi diverse", () => {
    const a = buildNextMagazzinoProcurementArrivoLoadKey(base);
    const b = buildNextMagazzinoProcurementArrivoLoadKey({
      ...base,
      sourceDocId: "ORD123:MAT999",
    });
    expect(a).not.toBe(b);
  });
});
