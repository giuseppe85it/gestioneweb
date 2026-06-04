// @ts-nocheck
import { describe, expect, it } from "vitest";

import { buildFraseStoria, recordChiusoFromRaw } from "../frasestoriaRecord";

describe("frasestoriaRecord — buildFraseStoria", () => {
  it("variante completa: apertura + presa in carico + esecuzione", () => {
    expect(
      buildFraseStoria({
        tipo: "segnalazione",
        dataApertura: "2026-03-01",
        dataPresaInCarico: "2026-03-02",
        dataEsecuzione: "2026-03-10",
      }),
    ).toBe(
      "Segnalazione del 01/03/2026, presa in carico il 02/03/2026, eseguita il 10/03/2026.",
    );
  });

  it("variante senza presa in carico: apertura + esecuzione", () => {
    expect(
      buildFraseStoria({
        tipo: "controllo_ko",
        dataApertura: "2026-04-01",
        dataEsecuzione: "2026-04-05",
      }),
    ).toBe("Controllo KO del 01/04/2026, eseguita il 05/04/2026.");
  });

  it("variante senza esecuzione: apertura + presa in carico", () => {
    expect(
      buildFraseStoria({
        tipo: "manutenzione",
        dataApertura: "2026-05-01",
        dataPresaInCarico: "2026-05-03",
      }),
    ).toBe("Manutenzione del 01/05/2026, presa in carico il 03/05/2026.");
  });

  it("variante solo apertura", () => {
    expect(buildFraseStoria({ tipo: "segnalazione", dataApertura: "2026-06-01" })).toBe(
      "Segnalazione del 01/06/2026.",
    );
  });

  it("suffisso evento autisti con data evento", () => {
    expect(
      buildFraseStoria({
        tipo: "manutenzione",
        dataApertura: "2026-05-08",
        dataPresaInCarico: "2026-05-09",
        dataEsecuzione: "2026-05-12",
        modalitaChiusura: "evento_autisti",
        dataEventoChiusura: "2026-05-12",
      }),
    ).toBe(
      "Manutenzione del 08/05/2026, presa in carico il 09/05/2026, eseguita il 12/05/2026. Risolta dal cambio gomme del 12/05/2026.",
    );
  });

  it("suffisso officina con nome officina", () => {
    expect(
      buildFraseStoria({
        tipo: "manutenzione",
        dataApertura: "2026-02-01",
        dataEsecuzione: "2026-02-10",
        modalitaChiusura: "officina",
        nomeOfficina: "Garage Rossi",
      }),
    ).toBe(
      "Manutenzione del 01/02/2026, eseguita il 10/02/2026. Risolta dall'intervento officina Garage Rossi.",
    );
  });

  it("suffisso chiusura manuale", () => {
    expect(
      buildFraseStoria({
        tipo: "manutenzione",
        dataApertura: "2026-01-01",
        dataEsecuzione: "2026-01-15",
        modalitaChiusura: "manuale",
      }),
    ).toBe("Manutenzione del 01/01/2026, eseguita il 15/01/2026. Chiusa manualmente.");
  });

  it("nessun suffisso quando modalitaChiusura non e' specificata", () => {
    expect(
      buildFraseStoria({
        tipo: "manutenzione",
        dataApertura: "2026-01-01",
        dataEsecuzione: "2026-01-15",
      }),
    ).toBe("Manutenzione del 01/01/2026, eseguita il 15/01/2026.");
  });

  it("evento autisti senza data evento: frase senza data finale", () => {
    expect(
      buildFraseStoria({
        tipo: "segnalazione",
        dataApertura: "2026-05-08",
        dataEsecuzione: "2026-05-12",
        modalitaChiusura: "evento_autisti",
      }),
    ).toBe("Segnalazione del 08/05/2026, eseguita il 12/05/2026. Risolta dal cambio gomme.");
  });

  it("officina senza nome officina: frase generica officina", () => {
    expect(
      buildFraseStoria({
        tipo: "manutenzione",
        dataApertura: "2026-02-01",
        dataEsecuzione: "2026-02-10",
        modalitaChiusura: "officina",
      }),
    ).toBe(
      "Manutenzione del 01/02/2026, eseguita il 10/02/2026. Risolta dall'intervento officina.",
    );
  });

  it("tipo sconosciuto: fallback etichetta 'Record'", () => {
    expect(
      buildFraseStoria({
        tipo: "altro_tipo_non_previsto",
        dataApertura: "2026-03-01",
      }),
    ).toBe("Record del 01/03/2026.");
  });

  it("date null/undefined: apertura assente -> solo tipo", () => {
    expect(
      buildFraseStoria({
        tipo: "segnalazione",
        dataApertura: null,
        dataPresaInCarico: undefined,
        dataEsecuzione: "",
      }),
    ).toBe("Segnalazione.");
  });

  it("formati data eterogenei normalizzati da dateUnica (ISO datetime + Firestore Timestamp)", () => {
    expect(
      buildFraseStoria({
        tipo: "manutenzione",
        dataApertura: "2026-05-12T15:11:38.489Z",
        dataEsecuzione: { toDate: () => new Date(2026, 4, 20) },
      }),
    ).toBe("Manutenzione del 12/05/2026, eseguita il 20/05/2026.");
  });

  it("data legacy a spazi e slash gestite", () => {
    expect(
      buildFraseStoria({
        tipo: "controllo_ko",
        dataApertura: "01 03 2026",
        dataEsecuzione: "10/03/2026",
      }),
    ).toBe("Controllo KO del 01/03/2026, eseguita il 10/03/2026.");
  });

  // PROMPT 45 T2 — nome autista nella prima riga
  it("T2: segnalatoDa valorizzato -> 'Segnalazione di Mario Rossi del 24/04/2026.'", () => {
    expect(
      buildFraseStoria({
        tipo: "segnalazione",
        dataApertura: "2026-04-24",
        segnalatoDa: "Mario Rossi",
      }),
    ).toBe("Segnalazione di Mario Rossi del 24/04/2026.");
  });

  it("T2: segnalatoDa = 'autista' (sentinel writer PROMPT 41) -> niente nome", () => {
    expect(
      buildFraseStoria({
        tipo: "controllo_ko",
        dataApertura: "2026-04-24",
        segnalatoDa: "autista",
      }),
    ).toBe("Controllo KO del 24/04/2026.");
  });

  it("T2: segnalatoDa funziona anche senza dataApertura -> '<Tipo> di <nome>.'", () => {
    expect(
      buildFraseStoria({
        tipo: "segnalazione",
        dataApertura: null,
        segnalatoDa: "Luigi Verdi",
      }),
    ).toBe("Segnalazione di Luigi Verdi.");
  });
});

describe("frasestoriaRecord — recordChiusoFromRaw", () => {
  it("chiusa_da_evento -> modalita' evento_autisti con data evento", () => {
    const rc = recordChiusoFromRaw({
      stato: "chiusa_da_evento",
      dataInserimento: "2026-05-08",
      chiusuraDi: "gomme_evento",
      chiusuraData: "2026-05-12",
    });
    expect(rc.modalitaChiusura).toBe("evento_autisti");
    expect(buildFraseStoria(rc)).toBe(
      "Manutenzione del 08/05/2026. Risolta dal cambio gomme del 12/05/2026.",
    );
  });

  it("eseguita con fornitore -> modalita' officina", () => {
    const rc = recordChiusoFromRaw({
      stato: "eseguita",
      dataInserimento: "2026-02-01",
      dataEsecuzione: "2026-02-10",
      fornitore: "Garage Rossi",
    });
    expect(rc.modalitaChiusura).toBe("officina");
    expect(rc.nomeOfficina).toBe("Garage Rossi");
    expect(buildFraseStoria(rc)).toBe(
      "Manutenzione del 01/02/2026, eseguita il 10/02/2026. Risolta dall'intervento officina Garage Rossi.",
    );
  });

  it("eseguita senza fornitore -> modalita' manuale", () => {
    const rc = recordChiusoFromRaw({
      stato: "eseguita",
      dataInserimento: "2026-01-01",
      dataEsecuzione: "2026-01-15",
    });
    expect(rc.modalitaChiusura).toBe("manuale");
    expect(buildFraseStoria(rc)).toBe(
      "Manutenzione del 01/01/2026, eseguita il 15/01/2026. Chiusa manualmente.",
    );
  });

  it("daFare -> nessuna modalita' di chiusura", () => {
    const rc = recordChiusoFromRaw({ stato: "daFare", dataInserimento: "2026-03-01" });
    expect(rc.modalitaChiusura).toBeUndefined();
    expect(buildFraseStoria(rc)).toBe("Manutenzione del 01/03/2026.");
  });

  it("origineTipo segnalazione/controllo determina il tipo", () => {
    expect(recordChiusoFromRaw({ origineTipo: "segnalazione", data: "2026-03-01" }).tipo).toBe(
      "segnalazione",
    );
    expect(recordChiusoFromRaw({ origineTipo: "controllo", data: "2026-03-01" }).tipo).toBe(
      "controllo_ko",
    );
  });

  it("tipoOverride forza il tipo", () => {
    const rc = recordChiusoFromRaw(
      { stato: "eseguita", dataInserimento: "2026-04-01", dataChiusura: "2026-04-05" },
      "segnalazione",
    );
    expect(rc.tipo).toBe("segnalazione");
  });

  it("record null/undefined non lancia", () => {
    expect(recordChiusoFromRaw(null).tipo).toBe("manutenzione");
    expect(buildFraseStoria(recordChiusoFromRaw(undefined))).toBe("Manutenzione.");
  });

  // PROMPT 44 — D7: dataPresaInCarico abilita la riga "presa in carico il GG/MM/AAAA".
  it("D7: record segnalazione con dataPresaInCarico -> frase contiene 'presa in carico il'", () => {
    const rc = recordChiusoFromRaw(
      {
        stato: "presa_in_carico",
        dataInserimento: "2026-05-08",
        dataPresaInCarico: "2026-05-10",
      },
      "segnalazione",
    );
    expect(buildFraseStoria(rc)).toBe(
      "Segnalazione del 08/05/2026, presa in carico il 10/05/2026.",
    );
  });

  it("D7: record segnalazione senza dataPresaInCarico -> riga 'presa in carico' assente", () => {
    const rc = recordChiusoFromRaw(
      { stato: "presa_in_carico", dataInserimento: "2026-05-08" },
      "segnalazione",
    );
    const frase = buildFraseStoria(rc);
    expect(frase).not.toContain("presa in carico");
    expect(frase).toBe("Segnalazione del 08/05/2026.");
  });

  // PROMPT 45 T2 — adapter legge segnalatoDa
  it("T2: recordChiusoFromRaw legge segnalatoDa dal record raw", () => {
    const rc = recordChiusoFromRaw(
      {
        stato: "daFare",
        dataInserimento: "2026-04-24",
        segnalatoDa: "Mario Rossi",
      },
      "segnalazione",
    );
    expect(rc.segnalatoDa).toBe("Mario Rossi");
    expect(buildFraseStoria(rc)).toBe("Segnalazione di Mario Rossi del 24/04/2026.");
  });

  it("T2: recordChiusoFromRaw fallback su autistaNome se segnalatoDa assente", () => {
    const rc = recordChiusoFromRaw(
      {
        stato: "daFare",
        dataInserimento: "2026-04-24",
        autistaNome: "Luigi Verdi",
      },
      "segnalazione",
    );
    expect(rc.segnalatoDa).toBe("Luigi Verdi");
    expect(buildFraseStoria(rc)).toBe("Segnalazione di Luigi Verdi del 24/04/2026.");
  });

  // PROMPT 49 — cross-read sorgente via options.sourceRecord
  it("P49: con sourceRecord valido, dataApertura/segnalatoDa letti dalla sorgente (non dalla manutenzione)", () => {
    // Simula scenario TI298409: manutenzione cambio gomme 12/05 stand-alone, agganciata
    // dopo a segnalazione 08/05 di RICCARDO FENDERICO via PROMPT 47.
    const manutenzione = {
      id: "M-1778587360877",
      data: "2026-05-12",
      stato: "eseguita",
      fornitore: "VALTELLINA PNEUMATICI",
      origineTipo: "segnalazione",
      origineRefId: "S-7d1d8009",
      origineRefKey: "@segnalazioni_autisti_tmp",
    };
    const sourceSegnalazione = {
      id: "S-7d1d8009",
      timestamp: Date.parse("2026-05-08T10:00:00Z"),
      data: "2026-05-08",
      autistaNome: "RICCARDO FENDERICO",
      descrizione: "4 gomme di trazione usurate",
    };
    const rc = recordChiusoFromRaw(manutenzione, undefined, { sourceRecord: sourceSegnalazione });
    expect(rc.tipo).toBe("segnalazione");
    expect(rc.segnalatoDa).toBe("RICCARDO FENDERICO");
    expect(buildFraseStoria(rc)).toBe(
      "Segnalazione di RICCARDO FENDERICO del 08/05/2026, eseguita il 12/05/2026. Risolta dall'intervento officina VALTELLINA PNEUMATICI.",
    );
  });

  it("P49: senza sourceRecord (legame orfano), fallback al record manutenzione stesso (comportamento pre-49)", () => {
    const manutenzione = {
      id: "M-stand-alone",
      data: "2026-05-12",
      stato: "eseguita",
      fornitore: "VALTELLINA PNEUMATICI",
      origineTipo: "segnalazione",
      origineRefId: "S-ORFANA",
    };
    const rc = recordChiusoFromRaw(manutenzione, undefined, { sourceRecord: null });
    // Senza sourceRecord, dataApertura pesca dal record stesso (= data manutenzione)
    expect(buildFraseStoria(rc)).toBe(
      "Segnalazione del 12/05/2026, eseguita il 12/05/2026. Risolta dall'intervento officina VALTELLINA PNEUMATICI.",
    );
  });

  // PROMPT 52 — segnalazione con stato="chiusa" + chiusuraData (P44 D1 chiudiSegnalazioneDaEvento)
  it("P52: segnalazione stato='chiusa' + chiusuraDi='manutenzione' + chiusuraData -> frase 'Chiusa manualmente' con dataEsecuzione=chiusuraData", () => {
    const chiusuraMs = new Date(2026, 4, 12, 0, 0, 0, 0).getTime(); // 12/05/2026 mezzanotte
    const rc = recordChiusoFromRaw({
      id: "S1",
      stato: "chiusa",
      timestamp: Date.parse("2026-05-08T10:00:00Z"),
      autistaNome: "RICCARDO FENDERICO",
      chiusuraDi: "manutenzione",
      chiusuraRefId: "M-1778587360877",
      chiusuraData: chiusuraMs,
    }, "segnalazione");
    expect(rc.modalitaChiusura).toBe("manuale");
    expect(buildFraseStoria(rc)).toBe(
      "Segnalazione di RICCARDO FENDERICO del 08/05/2026, eseguita il 12/05/2026. Chiusa manualmente.",
    );
  });

  it("P52: segnalazione stato='chiusa' + chiusuraDi='gomme_evento' -> frase 'Risolta dal cambio gomme del Z'", () => {
    const chiusuraMs = new Date(2026, 4, 12, 0, 0, 0, 0).getTime();
    const rc = recordChiusoFromRaw({
      id: "S2",
      stato: "chiusa",
      timestamp: Date.parse("2026-05-08T10:00:00Z"),
      autistaNome: "RICCARDO FENDERICO",
      chiusuraDi: "gomme_evento",
      chiusuraRefId: "evt-1",
      chiusuraData: chiusuraMs,
    }, "segnalazione");
    expect(rc.modalitaChiusura).toBe("evento_autisti");
    expect(buildFraseStoria(rc)).toBe(
      "Segnalazione di RICCARDO FENDERICO del 08/05/2026, eseguita il 12/05/2026. Risolta dal cambio gomme del 12/05/2026.",
    );
  });

  it("P49: sourceRecord presente sovrascrive autistaNome del record manutenzione", () => {
    const manutenzione = {
      data: "2026-05-12",
      stato: "eseguita",
      autistaNome: "QUALCHE ALTRO NOME",
      fornitore: "OFFICINA X",
      origineTipo: "segnalazione",
      origineRefId: "S-1",
    };
    const source = { id: "S-1", data: "2026-05-08", autistaNome: "RICCARDO FENDERICO" };
    const rc = recordChiusoFromRaw(manutenzione, undefined, { sourceRecord: source });
    expect(rc.segnalatoDa).toBe("RICCARDO FENDERICO");
  });

  it("P20: sourceRecords multipli usa la sorgente piu recente per la frase compatta", () => {
    const manutenzione = {
      data: "2026-05-12",
      stato: "eseguita",
      fornitore: "OFFICINA X",
      origineTipo: "segnalazione",
      origineRefId: "S-1",
    };
    const rc = recordChiusoFromRaw(manutenzione, undefined, {
      sourceRecords: [
        { id: "S-OLD", data: "2026-05-05", autistaNome: "AUTISTA VECCHIO" },
        { id: "S-NEW", data: "2026-05-08", autistaNome: "AUTISTA RECENTE" },
      ],
    });
    expect(rc.segnalatoDa).toBe("AUTISTA RECENTE");
    expect(buildFraseStoria(rc)).toContain("Segnalazione di AUTISTA RECENTE del 08/05/2026");
  });
});
