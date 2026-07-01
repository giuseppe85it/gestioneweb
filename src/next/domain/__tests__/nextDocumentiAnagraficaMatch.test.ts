import { describe, expect, it } from "vitest";
import {
  buildAnagraficaMatchIndex,
  resolveNomeOfficinaVivo,
  resolveOfficinaLabelVivo,
} from "../nextDocumentiAnagraficaMatch";
import type { NextOfficinaReadOnlyItem } from "../nextOfficineDomain";
import type { NextFornitoreReadOnlyItem } from "../nextFornitoriDomain";

// Costruttori minimi: il match usa solo id + nome.
const off = (id: string, nome: string): NextOfficinaReadOnlyItem =>
  ({ id, nome } as NextOfficinaReadOnlyItem);
const frn = (id: string, nome: string): NextFornitoreReadOnlyItem =>
  ({ id, nome } as NextFornitoreReadOnlyItem);

describe("resolveNomeOfficinaVivo", () => {
  const index = buildAnagraficaMatchIndex(
    [off("o1", "Agustoni"), off("o2", "Officina Rossi")],
    [frn("f1", "Ferramenta Bianchi SRL")],
  );

  it("nome esatto → nome canonico dall'anagrafica officine", () => {
    expect(resolveNomeOfficinaVivo("Officina Rossi", index)).toBe("Officina Rossi");
  });

  it("refuso di battitura → nome corretto dall'anagrafica (Augustoni → Agustoni)", () => {
    expect(resolveNomeOfficinaVivo("Augustoni", index)).toBe("Agustoni");
  });

  it("testo non presente in @officine → mantiene il testo salvato", () => {
    expect(resolveNomeOfficinaVivo("Carrozzeria Sconosciuta", index)).toBe(
      "Carrozzeria Sconosciuta",
    );
  });

  it("testo vuoto/spazi/null → null", () => {
    expect(resolveNomeOfficinaVivo("   ", index)).toBeNull();
    expect(resolveNomeOfficinaVivo(null, index)).toBeNull();
    expect(resolveNomeOfficinaVivo(undefined, index)).toBeNull();
  });

  it("nome che corrisponde a un FORNITORE (non un'officina) → NON risolve, tiene il testo", () => {
    // "Ferramenta Bianchi SRL" è in @fornitori: nel contesto officina il nome NON
    // va sostituito con quello del fornitore. Resta il testo salvato (senza SRL).
    expect(resolveNomeOfficinaVivo("Ferramenta Bianchi", index)).toBe("Ferramenta Bianchi");
  });
});

describe("resolveOfficinaLabelVivo (alla fonte, indice opzionale)", () => {
  const index = buildAnagraficaMatchIndex([off("o1", "Agustoni")], []);

  it("con indice: risolve verso l'anagrafica (Augustoni → Agustoni)", () => {
    expect(resolveOfficinaLabelVivo("Augustoni", index)).toBe("Agustoni");
  });

  it("con indice ma testo non-officina: tiene il testo", () => {
    expect(resolveOfficinaLabelVivo("Carrozzeria Sconosciuta", index)).toBe(
      "Carrozzeria Sconosciuta",
    );
  });

  it("senza indice (null): ritorna l'etichetta invariata (retrocompatibile)", () => {
    expect(resolveOfficinaLabelVivo("Augustoni", null)).toBe("Augustoni");
  });

  it("etichetta null resta null (con o senza indice)", () => {
    expect(resolveOfficinaLabelVivo(null, index)).toBeNull();
    expect(resolveOfficinaLabelVivo(null, null)).toBeNull();
  });
});
