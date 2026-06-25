// BUG 65 Fase 4 — test di rendering del modale "Aggancia universale".
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { NextAgganciaUniversaleModal } from "../NextAgganciaUniversaleModal";
import type { CandidatoAggancioUniversale } from "../../helpers/candidatiAggancioUniversale";

const manutenzione = {
  id: "M1",
  targa: "TI178456",
  categoria: "Motrice",
  descrizione: "Tagliando",
};

function candidato(
  tipo: CandidatoAggancioUniversale["tipo"],
  id: string,
  descrizione: string,
): CandidatoAggancioUniversale {
  return {
    tipo,
    refKey: "@x",
    id,
    targa: "TI178456",
    categoria: "Motrice",
    descrizione,
    stato: "aperto",
    dataIso: "2026-06-01",
  };
}

describe("NextAgganciaUniversaleModal", () => {
  it("mostra le schede in alto con i conteggi e apre la prima non vuota", () => {
    const html = renderToStaticMarkup(
      <NextAgganciaUniversaleModal
        manutenzione={manutenzione}
        candidati={[
          candidato("controllo", "C1", "Controllo freni KO"),
          candidato("segnalazione", "S1", "Gomma forata"),
          candidato("manutenzione", "M2", "Altra manutenzione"),
        ]}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    // Le tre schede con i conteggi.
    expect(html).toContain("Controlli KO (1)");
    expect(html).toContain("Segnalazioni (1)");
    expect(html).toContain("Manutenzioni (1)");
    expect(html).toContain("TI178456");
    // La scheda attiva di default e' la prima non vuota (Controlli KO): i suoi
    // candidati sono mostrati, quelli delle altre schede no.
    expect(html).toContain("Controllo freni KO");
    expect(html).not.toContain("Gomma forata");
    expect(html).not.toContain("Altra manutenzione");
  });

  it("mostra il messaggio di lista vuota quando non ci sono candidati", () => {
    const html = renderToStaticMarkup(
      <NextAgganciaUniversaleModal
        manutenzione={manutenzione}
        candidati={[]}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(html).toContain("Nessun record agganciabile");
  });
});
