import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  MappaStoricoOriginiSection,
  buildMappaStoricoSelectedRecordChiuso,
  getMappaStoricoSegnalazioniAperte,
  richiudiMappaStoricoSegnalazioniAperte,
} from "../NextMappaStoricoPage";
import { buildFraseStoria } from "../helpers/frasestoriaRecord";

const chiudiSegnalazioneDaEventoMock = vi.hoisted(() => vi.fn());

vi.mock("../writers/nextChiusuraEventoWriter", () => ({
  chiudiSegnalazioneDaEvento: chiudiSegnalazioneDaEventoMock,
}));

describe("NextMappaStoricoPage dettaglio v2 origini", () => {
  beforeEach(() => {
    chiudiSegnalazioneDaEventoMock.mockReset();
    chiudiSegnalazioneDaEventoMock.mockResolvedValue({ ok: true, updated: 1 });
  });

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

  it("D4a: segnala solo le segnalazioni origine ancora aperte", () => {
    const aperte = getMappaStoricoSegnalazioniAperte([
      { id: "S-APERTA", __origineTipo: "segnalazione", stato: "presa_in_carico" },
      { id: "S-CHIUSA", __origineTipo: "segnalazione", stato: "chiusa", chiusuraData: 1770000000000 },
      { id: "C-APERTO", __origineTipo: "controllo", stato: "presa_in_carico" },
    ]);

    expect(aperte.map((record) => record.id)).toEqual(["S-APERTA"]);
  });

  it("D4a: richiudi chiama il writer solo sulle segnalazioni aperte", async () => {
    const result = await richiudiMappaStoricoSegnalazioniAperte({
      manutenzione: {
        id: "M-ESEGUITA",
        targa: "TI233827",
        stato: "eseguita",
        data: "2026-05-18",
      },
      sourceRecords: [
        { id: "S-APERTA", __origineTipo: "segnalazione", stato: "presa_in_carico" },
        { id: "S-CHIUSA", __origineTipo: "segnalazione", stato: "chiusa", chiusuraData: 1770000000000 },
        { id: "C-APERTO", __origineTipo: "controllo", stato: "presa_in_carico" },
      ],
    });

    expect(result.requestedIds).toEqual(["S-APERTA"]);
    expect(result.closedIds).toEqual(["S-APERTA"]);
    expect(chiudiSegnalazioneDaEventoMock).toHaveBeenCalledTimes(1);
    expect(chiudiSegnalazioneDaEventoMock).toHaveBeenCalledWith(
      "S-APERTA",
      "manutenzione",
      "M-ESEGUITA",
      Date.parse("2026-05-18"),
    );
  });

  it("D4a: nessuna segnalazione aperta non genera richiami al writer", async () => {
    const result = await richiudiMappaStoricoSegnalazioniAperte({
      manutenzione: {
        id: "M-ESEGUITA",
        targa: "TI233827",
        stato: "eseguita",
        data: "2026-05-18",
      },
      sourceRecords: [
        { id: "S-CHIUSA", __origineTipo: "segnalazione", stato: "chiusa", chiusuraData: 1770000000000 },
      ],
    });

    expect(result.requestedIds).toEqual([]);
    expect(chiudiSegnalazioneDaEventoMock).not.toHaveBeenCalled();
  });
});
