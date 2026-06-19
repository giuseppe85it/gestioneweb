import { describe, expect, it } from "vitest";
import {
  isNextGommeTechnicalWheelSelected,
  resolveNextGommeMaintenanceSelectionReadOnly,
  resolveNextGommeSelectionReadOnly,
  selectNextOfficialGommeEvents,
} from "../nextGommeSelectionReadOnly";
import { resolveNextManutenzioneTechnicalView } from "../nextManutenzioniGommeDomain";

describe("resolveNextGommeSelectionReadOnly", () => {
  it("riconosce un asse completo dai duplicati legacy bilaterali", () => {
    const result = resolveNextGommeSelectionReadOnly({
      asseId: "asse2",
      gommeIds: [
        "motrice4assi-asse2-2",
        "motrice4assi-asse2-3",
        "motrice4assi-asse2-2",
        "motrice4assi-asse2-3",
      ],
    });

    expect(result.precisione).toBe("asse_completo");
    expect(result.asseId).toBe("asse2");
    expect(result.lati).toEqual(["destra", "sinistra"]);
    expect(
      isNextGommeTechnicalWheelSelected({
        resolution: result,
        lato: "sinistra",
        wheelId: "qualunque-id",
        axisId: "asse2",
      }),
    ).toBe(true);
  });

  it("riconosce asse e lato senza inventare la singola gomma", () => {
    const result = resolveNextGommeSelectionReadOnly({
      asseLabel: "SOSTITUZIONE VALVOLA LATO SX 3 ASSE",
      gommeIds: ["semirimorchioFissi-asse3-2"],
    });

    expect(result.precisione).toBe("asse_lato");
    expect(result.asseId).toBe("asse3");
    expect(result.lati).toEqual(["sinistra"]);
    expect(result.messaggio).toContain("singola gomma");
  });

  it("usa una selezione V2 valida come fonte puntuale", () => {
    const result = resolveNextGommeSelectionReadOnly({
      asseId: "asse1",
      gommeIds: ["dato-legacy-incompleto"],
      selezioneGommeV2: {
        versione: 2,
        asseId: "asse1",
        ruote: [
          {
            id: "motrice2assi-destra-asse1-1",
            lato: "destra",
            posizione: 0,
          },
        ],
      },
    });

    expect(result.precisione).toBe("ruote_esatte_v2");
    expect(result.ruote).toHaveLength(1);
    expect(
      isNextGommeTechnicalWheelSelected({
        resolution: result,
        lato: "destra",
        wheelId: "motrice2assi-destra-asse1-1",
        axisId: "asse1",
      }),
    ).toBe(true);
  });

  it("rifiuta payload incompleti o incoerenti", () => {
    const result = resolveNextGommeSelectionReadOnly({
      asseId: "asse2",
      gommeIds: ["motrice3assi-asse2-3"],
      selezioneGommeV2: {
        versione: 2,
        asseId: "asse2",
        ruote: [{ id: "", lato: "destra", posizione: 0 }],
      },
    });

    expect(result.precisione).toBe("non_rappresentabile");
  });
});

describe("resolveNextGommeMaintenanceSelectionReadOnly", () => {
  const officialEvent = {
    sourceOrigin: "evento_ufficiale",
    vehicleMatchReliability: "forte",
    vehicleMatchField: "targetTarga",
    targetTarga: "TI123456",
    sourceRecordId: "evento-1",
    timestamp: 100,
    asseId: "asse2",
    gommeIds: [
      "motrice4assi-asse2-2",
      "motrice4assi-asse2-3",
      "motrice4assi-asse2-2",
      "motrice4assi-asse2-3",
    ],
  };

  it("evidenzia un asse strutturato nella manutenzione", () => {
    const result = resolveNextGommeMaintenanceSelectionReadOnly({
      activeTarga: "TI123456",
      maintenance: {
        targa: "TI123456",
        assiCoinvolti: ["posteriore"],
      },
      officialEvents: [],
    });

    expect(result.fonte).toBe("manutenzione");
    expect(result.asseIds).toEqual(["posteriore"]);
    expect(result.lati).toEqual(["destra", "sinistra"]);
  });

  it("supporta più assi strutturati nella stessa manutenzione", () => {
    const result = resolveNextGommeMaintenanceSelectionReadOnly({
      activeTarga: "TI123456",
      maintenance: {
        targa: "TI123456",
        assiCoinvolti: ["asse1"],
        gommePerAsse: [{ asseId: "asse2" }],
        gommeStraordinario: { asseId: "asse3" },
      },
      officialEvents: [],
    });

    expect(result.asseIds).toEqual(["asse1", "asse2", "asse3"]);
  });

  it("usa soltanto l'evento ufficiale collegato esattamente", () => {
    const result = resolveNextGommeMaintenanceSelectionReadOnly({
      activeTarga: "TI123456",
      maintenance: {
        targa: "TI123456",
        chiusuraDi: "gomme_evento",
        chiusuraRefId: "evento-1",
        assiCoinvolti: ["posteriore"],
      },
      officialEvents: [officialEvent],
    });

    expect(result.fonte).toBe("evento_collegato");
    expect(result.eventoCollegatoId).toBe("evento-1");
    expect(result.asseIds).toEqual(["asse2"]);
  });

  it("usa la selezione puntuale salvata sulla manutenzione prima del fallback per asse", () => {
    const result = resolveNextGommeMaintenanceSelectionReadOnly({
      activeTarga: "TI123456",
      maintenance: {
        targa: "TI123456",
        assiCoinvolti: ["posteriore"],
        gommeSelezione: {
          asseId: "asse1",
          asseLabel: "1 asse",
          gommeIds: ["motrice2assi-destra-asse1-1"],
          selezioneGommeV2: {
            versione: 2,
            asseId: "asse1",
            ruote: [
              {
                id: "motrice2assi-destra-asse1-1",
                lato: "destra",
                posizione: 1,
              },
            ],
          },
        },
      },
      officialEvents: [],
    });

    expect(result.fonte).toBe("manutenzione");
    expect(result.precisione).toBe("ruote_esatte_v2");
    expect(result.asseIds).toEqual(["asse1"]);
    expect(result.ruote).toHaveLength(1);
  });

  it("usa tutti gli assi espliciti della selezione gomme manutenzione", () => {
    const result = resolveNextGommeMaintenanceSelectionReadOnly({
      activeTarga: "TI123456",
      maintenance: {
        targa: "TI123456",
        assiCoinvolti: ["anteriore"],
        gommeSelezione: {
          asseId: null,
          asseLabel: "Piu assi",
          assiIds: ["anteriore", "posteriore"],
          assiLabels: ["Anteriore", "Posteriore"],
          gommeIds: [
            "trattore-destra-anteriore-0",
            "trattore-sinistra-anteriore-0",
            "trattore-destra-posteriore-1",
            "trattore-destra-posteriore-2",
            "trattore-sinistra-posteriore-1",
            "trattore-sinistra-posteriore-2",
          ],
          interventoTipo: "ordinario",
        },
      },
      officialEvents: [],
    });

    expect(result.fonte).toBe("manutenzione");
    expect(result.precisione).toBe("asse_completo");
    expect(result.asseIds).toEqual(["anteriore", "posteriore"]);
    expect(
      isNextGommeTechnicalWheelSelected({
        resolution: result,
        lato: "sinistra",
        wheelId: "qualunque",
        axisId: "posteriore",
      }),
    ).toBe(true);
  });

  it("ricostruisce tutti gli assi ordinari dai gommeIds per i record gia salvati", () => {
    const result = resolveNextGommeMaintenanceSelectionReadOnly({
      activeTarga: "TI123456",
      maintenance: {
        targa: "TI123456",
        assiCoinvolti: ["anteriore"],
        gommeSelezione: {
          asseId: null,
          asseLabel: "Piu assi",
          gommeIds: [
            "trattore-destra-anteriore-0",
            "trattore-sinistra-anteriore-0",
            "trattore-destra-posteriore-1",
            "trattore-destra-posteriore-2",
            "trattore-sinistra-posteriore-1",
            "trattore-sinistra-posteriore-2",
          ],
          interventoTipo: "ordinario",
        },
      },
      officialEvents: [],
    });

    expect(result.fonte).toBe("manutenzione");
    expect(result.asseIds).toEqual(["anteriore", "posteriore"]);
  });

  it("mantiene la precedenza dell'evento ufficiale collegato rispetto alla selezione manutenzione", () => {
    const result = resolveNextGommeMaintenanceSelectionReadOnly({
      activeTarga: "TI123456",
      maintenance: {
        targa: "TI123456",
        chiusuraDi: "gomme_evento",
        chiusuraRefId: "evento-1",
        assiCoinvolti: ["posteriore"],
        gommeSelezione: {
          asseId: "asse1",
          gommeIds: ["motrice2assi-destra-asse1-1"],
          selezioneGommeV2: {
            versione: 2,
            asseId: "asse1",
            ruote: [{ id: "motrice2assi-destra-asse1-1", lato: "destra", posizione: 1 }],
          },
        },
      },
      officialEvents: [officialEvent],
    });

    expect(result.fonte).toBe("evento_collegato");
    expect(result.asseIds).toEqual(["asse2"]);
  });

  it("ignora un evento della stessa targa ma non collegato", () => {
    const result = resolveNextGommeMaintenanceSelectionReadOnly({
      activeTarga: "TI123456",
      maintenance: {
        targa: "TI123456",
        assiCoinvolti: ["posteriore"],
      },
      officialEvents: [officialEvent],
    });

    expect(result.fonte).toBe("manutenzione");
    expect(result.asseIds).toEqual(["posteriore"]);
  });

  it("rifiuta un evento collegato appartenente a un'altra targa", () => {
    const result = resolveNextGommeMaintenanceSelectionReadOnly({
      activeTarga: "TI123456",
      maintenance: {
        targa: "TI123456",
        chiusuraDi: "gomme_evento",
        chiusuraRefId: "evento-1",
        assiCoinvolti: ["posteriore"],
      },
      officialEvents: [{ ...officialEvent, targetTarga: "TI999999" }],
    });

    expect(result.fonte).toBe("manutenzione");
    expect(result.asseIds).toEqual(["posteriore"]);
  });

  it("usa gli assi manutenzione quando l'evento collegato manca", () => {
    const result = resolveNextGommeMaintenanceSelectionReadOnly({
      activeTarga: "TI123456",
      maintenance: {
        targa: "TI123456",
        chiusuraDi: "gomme_evento",
        chiusuraRefId: "evento-assente",
        gommePerAsse: [{ asseId: "asse1" }],
      },
      officialEvents: [officialEvent],
    });

    expect(result.fonte).toBe("manutenzione");
    expect(result.asseIds).toEqual(["asse1"]);
  });

  it("non produce overlay per una categoria tecnica sconosciuta", () => {
    expect(
      resolveNextManutenzioneTechnicalView("categoria sconosciuta", "destra"),
    ).toBeNull();
  });
});

describe("selectNextOfficialGommeEvents", () => {
  const base = {
    vehicleMatchReliability: "forte",
    vehicleMatchField: "targetTarga",
    timestamp: 100,
  };

  it("include solo la targa attiva con match targetTarga forte", () => {
    const result = selectNextOfficialGommeEvents(
      [
        {
          ...base,
          sourceOrigin: "evento_ufficiale",
          targetTarga: "TI 123456",
          sourceRecordId: "evento-corretto",
        },
        {
          ...base,
          sourceOrigin: "evento_ufficiale",
          targetTarga: "TI999999",
          sourceRecordId: "altra-targa",
        },
      ],
      "TI123456",
    );

    expect(result.map((item) => item.sourceRecordId)).toEqual(["evento-corretto"]);
  });

  it("esclude TMP e mantiene una sola copia ufficiale per ID", () => {
    const result = selectNextOfficialGommeEvents(
      [
        {
          ...base,
          sourceOrigin: "evento_autista_tmp",
          targetTarga: "TI123456",
          sourceRecordId: "stesso-id",
        },
        {
          ...base,
          sourceOrigin: "evento_ufficiale",
          targetTarga: "TI123456",
          sourceRecordId: "stesso-id",
        },
        {
          ...base,
          sourceOrigin: "evento_ufficiale",
          targetTarga: "TI123456",
          sourceRecordId: "stesso-id",
        },
      ],
      "TI123456",
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.sourceOrigin).toBe("evento_ufficiale");
  });
});
