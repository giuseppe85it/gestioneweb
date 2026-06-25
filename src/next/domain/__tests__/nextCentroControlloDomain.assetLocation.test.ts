import { describe, expect, it } from "vitest";

import {
  buildAssetLocationLists,
  type D10MezzoItem,
  type D10SessionItem,
  type D10StoricoEventoItem,
} from "../nextCentroControlloDomain";

// Verifica la regola "il luogo va SOLO alle targhe effettivamente lasciate"
// (con l'eccezione dell'evento "imposta luogo a mano" dell'ufficio, prima===dopo).
// Vedi buildAssetLocationLists in nextCentroControlloDomain.ts.

const M = "TI100AA"; // motrice/trattore
const R = "TI900RR"; // semirimorchio

function mezzo(targa: string, categoria: string): D10MezzoItem {
  return {
    id: targa,
    targa,
    categoria,
    autistaNome: null,
    fotoUrl: null,
    fotoPath: null,
    fotoStoragePath: null,
    marca: null,
    modello: null,
    dataImmatricolazioneTs: null,
    dataUltimoCollaudoTs: null,
    dataScadenzaRevisioneTs: null,
    prenotazioneCollaudo: null,
    preCollaudo: null,
    note: null,
    manutenzioneProgrammata: false,
    manutenzioneDataFineTs: null,
    sourceDataset: "test",
    quality: "source_direct",
    flags: [],
  };
}

function evento(args: {
  ts: number;
  luogo: string | null;
  motricePrima?: string | null;
  motriceDopo?: string | null;
  rimorchioPrima?: string | null;
  rimorchioDopo?: string | null;
}): D10StoricoEventoItem {
  const motricePrima = args.motricePrima ?? null;
  const motriceDopo = args.motriceDopo ?? null;
  const rimorchioPrima = args.rimorchioPrima ?? null;
  const rimorchioDopo = args.rimorchioDopo ?? null;
  const targasCoinvolte = Array.from(
    new Set(
      [motricePrima, motriceDopo, rimorchioPrima, rimorchioDopo].filter(
        (v): v is string => Boolean(v),
      ),
    ),
  );
  return {
    id: `evt-${args.ts}`,
    tipo: "CAMBIO_ASSETTO",
    timestamp: args.ts,
    luogo: args.luogo,
    badgeAutista: null,
    nomeAutista: null,
    statoCarico: null,
    condizioni: null,
    targaMotricePrima: motricePrima,
    targaMotriceDopo: motriceDopo,
    targaRimorchioPrima: rimorchioPrima,
    targaRimorchioDopo: rimorchioDopo,
    targasCoinvolte,
    sourceDataset: "test",
    sourceRecordId: `evt-${args.ts}`,
    quality: "source_direct",
    flags: [],
  };
}

const NESSUNA_SESSIONE: D10SessionItem[] = [];
const FLOTTA: D10MezzoItem[] = [
  mezzo(M, "MOTRICE 3 ASSI"),
  mezzo(R, "SEMIRIMORCHIO ASSE FISSO"),
];

function luogoDi(
  result: ReturnType<typeof buildAssetLocationLists>,
  targa: string,
): string {
  const all = [...result.motriciTrattoriDaMostrare, ...result.rimorchiDaMostrare];
  const item = all.find((entry) => entry.targa === targa);
  if (!item) throw new Error(`targa ${targa} non trovata nelle liste`);
  return item.luogo;
}

describe("buildAssetLocationLists — attribuzione luogo solo alle targhe lasciate", () => {
  it("sgancio motrice: il rimorchio che resta NON eredita il luogo della motrice", () => {
    const eventi = [
      evento({ ts: 1000, luogo: "STABIO", motricePrima: M, motriceDopo: null, rimorchioPrima: R, rimorchioDopo: R }),
    ];
    const res = buildAssetLocationLists(FLOTTA, NESSUNA_SESSIONE, eventi);
    expect(luogoDi(res, M)).toBe("STABIO");
    expect(luogoDi(res, R)).toBe("Luogo non impostato");
  });

  it("sgancio rimorchio: solo il rimorchio prende il luogo, la motrice no", () => {
    const eventi = [
      evento({ ts: 1000, luogo: "MEV", motricePrima: M, motriceDopo: M, rimorchioPrima: R, rimorchioDopo: null }),
    ];
    const res = buildAssetLocationLists(FLOTTA, NESSUNA_SESSIONE, eventi);
    expect(luogoDi(res, R)).toBe("MEV");
    expect(luogoDi(res, M)).toBe("Luogo non impostato");
  });

  it("aggancio puro: l'evento di presa NON attribuisce il suo luogo", () => {
    const eventi = [
      evento({ ts: 1000, luogo: "MEV", motricePrima: null, motriceDopo: M, rimorchioPrima: null, rimorchioDopo: R }),
    ];
    const res = buildAssetLocationLists(FLOTTA, NESSUNA_SESSIONE, eventi);
    expect(luogoDi(res, M)).toBe("Luogo non impostato");
    expect(luogoDi(res, R)).toBe("Luogo non impostato");
  });

  it("aggancio successivo non sovrascrive con vuoto il luogo di un precedente sgancio", () => {
    const eventi = [
      evento({ ts: 1000, luogo: "STABIO", motricePrima: M, motriceDopo: null }),
      evento({ ts: 2000, luogo: null, motricePrima: null, motriceDopo: M }),
    ];
    const res = buildAssetLocationLists(FLOTTA, NESSUNA_SESSIONE, eventi);
    expect(luogoDi(res, M)).toBe("STABIO");
  });

  it("evento 'imposta luogo' dell'ufficio (prima === dopo) vale per la targa", () => {
    const eventi = [
      evento({ ts: 1000, luogo: "DEPOSITO CENTRALE", rimorchioPrima: R, rimorchioDopo: R }),
    ];
    const res = buildAssetLocationLists(FLOTTA, NESSUNA_SESSIONE, eventi);
    expect(luogoDi(res, R)).toBe("DEPOSITO CENTRALE");
  });

  it("lascio entrambi: motrice e rimorchio prendono lo stesso luogo", () => {
    const eventi = [
      evento({ ts: 1000, luogo: "STABIO", motricePrima: M, motriceDopo: null, rimorchioPrima: R, rimorchioDopo: null }),
    ];
    const res = buildAssetLocationLists(FLOTTA, NESSUNA_SESSIONE, eventi);
    expect(luogoDi(res, M)).toBe("STABIO");
    expect(luogoDi(res, R)).toBe("STABIO");
  });
});
