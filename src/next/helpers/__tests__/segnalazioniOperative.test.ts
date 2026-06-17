import { describe, expect, it } from "vitest";
import {
  getNextSegnalazioneOperativaTarga,
  isNextSegnalazioneOperativa,
} from "../segnalazioniOperative";

describe("segnalazioniOperative", () => {
  it("accetta una segnalazione aperta con targa reale", () => {
    expect(
      isNextSegnalazioneOperativa({
        targa: "ti 123 ab",
        stato: "nuova",
        letta: false,
      }),
    ).toBe(true);
  });

  it("riconosce la targa dai campi alternativi", () => {
    expect(getNextSegnalazioneOperativaTarga({ targaCamion: " ti-987 " })).toBe("TI987");
    expect(getNextSegnalazioneOperativaTarga({ targaMotrice: " ab 123 cd " })).toBe("AB123CD");
    expect(getNextSegnalazioneOperativaTarga({ targaRimorchio: " xx.456 " })).toBe("XX456");
  });

  it("rifiuta segnalazioni senza targa utile", () => {
    expect(isNextSegnalazioneOperativa({ targa: "-" })).toBe(false);
    expect(isNextSegnalazioneOperativa({ descrizione: "Senza mezzo" })).toBe(false);
  });

  it("rifiuta segnalazioni chiuse", () => {
    expect(isNextSegnalazioneOperativa({ targa: "TI123", chiusa: true })).toBe(false);
    expect(isNextSegnalazioneOperativa({ targa: "TI123", stato: "CHIUSA" })).toBe(false);
    expect(isNextSegnalazioneOperativa({ targa: "TI123", chiusuraRefId: "lav-1" })).toBe(false);
    expect(isNextSegnalazioneOperativa({ targa: "TI123", chiusuraData: 1715688000000 })).toBe(false);
  });

  it("rifiuta segnalazioni gia collegate a un lavoro", () => {
    expect(isNextSegnalazioneOperativa({ targa: "TI123", linkedLavoroId: "lav-1" })).toBe(false);
    expect(isNextSegnalazioneOperativa({ targa: "TI123", linkedLavoroIds: ["lav-1"] })).toBe(false);
    expect(isNextSegnalazioneOperativa({ targa: "TI123", hasLinkedLavoro: true })).toBe(false);
  });
});
