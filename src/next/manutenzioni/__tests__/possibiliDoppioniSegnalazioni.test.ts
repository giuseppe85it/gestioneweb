import { describe, expect, it } from "vitest";
import { trovaPossibiliDoppioniSegnalazioni } from "../possibiliDoppioniSegnalazioni";
import type { NextAutistiSegnalazioneSectionItem } from "../../domain/nextAutistiDomain";

function seg(id: string, tipo: string, descrizione: string): NextAutistiSegnalazioneSectionItem {
  return { id, tipo, descrizione, targa: "TI123456" } as unknown as NextAutistiSegnalazioneSectionItem;
}

describe("trovaPossibiliDoppioniSegnalazioni", () => {
  it("segnala due segnalazioni con lo stesso tipo specifico", () => {
    const out = trovaPossibiliDoppioniSegnalazioni([
      seg("a", "gomme", "Gomma anteriore destra consumata"),
      seg("b", "gomme", "Da controllare le coperture davanti"),
      seg("c", "freni", "Fischio in frenata"),
    ]);
    expect(out.has("a")).toBe(true);
    expect(out.has("b")).toBe(true);
    expect(out.has("c")).toBe(false);
  });

  it("NON segnala due tipi generici 'altro' con testi diversi", () => {
    const out = trovaPossibiliDoppioniSegnalazioni([
      seg("a", "altro", "Perdita aria dal soffione ultimo asse"),
      seg("b", "altro", "Spia motore accesa sul cruscotto"),
    ]);
    expect(out.size).toBe(0);
  });

  it("segnala due 'altro' con descrizioni molto simili (anche con accenti)", () => {
    const out = trovaPossibiliDoppioniSegnalazioni([
      seg("a", "altro", "Aria condizionata non funziona più in cabina"),
      seg("b", "altro", "Non funziona l'aria condizionata della cabina"),
    ]);
    expect(out.has("a")).toBe(true);
    expect(out.has("b")).toBe(true);
  });

  it("ignora parole comuni: 'problema al camion' non basta", () => {
    const out = trovaPossibiliDoppioniSegnalazioni([
      seg("a", "altro", "Problema al camion da verificare"),
      seg("b", "altro", "Problema camion: fanale rotto da verificare"),
    ]);
    expect(out.size).toBe(0);
  });

  it("lista con una sola segnalazione: nessun doppione", () => {
    expect(trovaPossibiliDoppioniSegnalazioni([seg("a", "gomme", "x")]).size).toBe(0);
  });
});
