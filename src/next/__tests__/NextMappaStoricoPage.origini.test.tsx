import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  MappaStoricoOriginiSection,
  buildMappaStoricoSelectedRecordChiuso,
} from "../NextMappaStoricoPage";
import { buildFraseStoria } from "../helpers/frasestoriaRecord";

describe("NextMappaStoricoPage dettaglio v2 origini", () => {
  it("usa la data origine reale nella frase storia del caso f7fdb252 TI233827", () => {
    const manutenzione = {
      id: "M-f7fdb252",
      targa: "TI233827",
      stato: "eseguita",
      data: "2026-05-18",
      fornitore: "OFFICINA",
      origineTipo: "segnalazione",
      origineRefKey: "@segnalazioni_autisti_tmp",
      origineRefId: "f7fdb252",
    };
    const sorgenti = [
      {
        id: "f7fdb252",
        __origineTipo: "segnalazione",
        data: "2026-04-29",
        autistaNome: "GIUSEPPE",
        descrizione: "Segnalazione su TI233827",
      },
    ];

    const recordChiuso = buildMappaStoricoSelectedRecordChiuso(manutenzione, null, sorgenti);

    expect(recordChiuso?.dataApertura).toBe("2026-04-29");
    expect(buildFraseStoria(recordChiuso!)).toBe(
      "Segnalazione di GIUSEPPE del 29/04/2026, eseguita il 18/05/2026. Risolta dall'intervento officina OFFICINA.",
    );
  });

  it("renderizza le origini nel dettaglio eseguita quando presenti", () => {
    const html = renderToStaticMarkup(
      <MappaStoricoOriginiSection
        hasOrigins={true}
        originCount={1}
        sourceRecords={[
          {
            id: "f7fdb252",
            __origineTipo: "segnalazione",
            data: "2026-04-29",
            autistaNome: "GIUSEPPE",
            descrizione: "Segnalazione su TI233827",
          },
        ]}
      />,
    );

    expect(html).toContain("Origini collegate");
    expect(html).toContain("GIUSEPPE");
    expect(html).toContain("29/04/2026");
    expect(html).toContain("Segnalazione su TI233827");
  });

  it("non renderizza il blocco origini nel dettaglio eseguita senza legami origine", () => {
    const html = renderToStaticMarkup(
      <MappaStoricoOriginiSection hasOrigins={false} originCount={0} sourceRecords={[]} />,
    );

    expect(html).toBe("");
  });
});
