import { describe, expect, it } from "vitest";
import { mapTipoDocumentoToOption, TIPO_DOCUMENTO_OPZIONI } from "../tipoDocumentoOptions";

describe("mapTipoDocumentoToOption", () => {
  it("riconosce i preventivi (preventivo/offerta)", () => {
    expect(mapTipoDocumentoToOption("preventivo")).toBe("preventivo");
    expect(mapTipoDocumentoToOption("Preventivo lavori officina")).toBe("preventivo");
    expect(mapTipoDocumentoToOption("OFFERTA")).toBe("preventivo");
  });

  it("riconosce i DDT (ddt/bolla/trasporto)", () => {
    expect(mapTipoDocumentoToOption("DDT")).toBe("ddt");
    expect(mapTipoDocumentoToOption("Documento di trasporto")).toBe("ddt");
    expect(mapTipoDocumentoToOption("Bolla di consegna")).toBe("ddt");
  });

  it("riconosce le fatture (fattura/invoice)", () => {
    expect(mapTipoDocumentoToOption("fattura")).toBe("fattura");
    expect(mapTipoDocumentoToOption("Fattura ufficiale n.123")).toBe("fattura");
    expect(mapTipoDocumentoToOption("invoice")).toBe("fattura");
  });

  it("riconosce i libretti", () => {
    expect(mapTipoDocumentoToOption("libretto")).toBe("libretto");
  });

  it("ricade su 'altro' per valori vuoti o non riconosciuti", () => {
    expect(mapTipoDocumentoToOption("altro")).toBe("altro");
    expect(mapTipoDocumentoToOption("")).toBe("altro");
    expect(mapTipoDocumentoToOption(null)).toBe("altro");
    expect(mapTipoDocumentoToOption("documento generico")).toBe("altro");
  });

  it("le opzioni del menu coprono tutti i valori restituiti dalla mappa", () => {
    const valoriMappa = ["preventivo", "ddt", "fattura", "libretto", "altro"];
    const valoriOpzioni = TIPO_DOCUMENTO_OPZIONI.map((o) => o.value);
    for (const v of valoriMappa) expect(valoriOpzioni).toContain(v);
  });
});
