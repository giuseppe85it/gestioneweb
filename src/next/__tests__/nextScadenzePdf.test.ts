import { describe, expect, it } from "vitest";
import {
  buildScadenzePdfFileName,
  buildScadenzePdfTableBody,
  filterScadenzePdfRows,
  summarizeScadenzePdfRows,
  type ScadenzePdfRow,
} from "../nextScadenzePdf";

const rows: ScadenzePdfRow[] = [
  {
    id: "m-1",
    categoria: "cronotachigrafo",
    categoriaLabel: "Cronotachigrafo",
    targa: "TI298409",
    mezzoLabel: "IVECO",
    autistaLabel: "Mario Rossi",
    tipoLabel: "Cronotachigrafo",
    stato: "scaduta",
    statoLabel: "Scaduta",
    scadenzaLabel: "01/06/2026 - 15 giorni fa",
    dettaglioLabel: "Base: tempo",
    prenotazioneLabel: "",
    preCollaudoLabel: "",
    note: "nota",
    sortSeverity: 4,
    sortValue: -15,
  },
  {
    id: "c-1",
    categoria: "collaudi",
    categoriaLabel: "Collaudi",
    targa: "TI324633",
    mezzoLabel: "SCANIA",
    autistaLabel: "",
    tipoLabel: "Collaudo",
    stato: "in_scadenza",
    statoLabel: "In scadenza",
    scadenzaLabel: "20/06/2026 - tra 3 giorni",
    dettaglioLabel: "",
    prenotazioneLabel: "prenotata per 19/06/2026",
    preCollaudoLabel: "pre-collaudo 18/06/2026",
    note: "",
    sortSeverity: 3,
    sortValue: 3,
  },
  {
    id: "e-1",
    categoria: "estintore",
    categoriaLabel: "Estintore",
    targa: "TI113417",
    mezzoLabel: "",
    autistaLabel: "",
    tipoLabel: "Estintore",
    stato: "ok",
    statoLabel: "OK",
    scadenzaLabel: "01/12/2026 - tra 167 giorni",
    dettaglioLabel: "Base: tempo",
    prenotazioneLabel: "",
    preCollaudoLabel: "",
    note: "",
    sortSeverity: 2,
    sortValue: 167,
  },
];

describe("nextScadenzePdf", () => {
  it("filtra per categoria senza perdere l'ordinamento operativo", () => {
    expect(filterScadenzePdfRows(rows, "collaudi").map((row) => row.id)).toEqual(["c-1"]);
    expect(filterScadenzePdfRows(rows, "tutte").map((row) => row.id)).toEqual(["m-1", "c-1", "e-1"]);
  });

  it("calcola i conteggi del riepilogo PDF", () => {
    expect(summarizeScadenzePdfRows(rows)).toEqual({
      totale: 3,
      scadute: 1,
      inScadenza: 1,
      ok: 1,
      daVerificare: 0,
    });
  });

  it("costruisce righe tabellari compatibili con autoTable", () => {
    const body = buildScadenzePdfTableBody(rows.slice(0, 1), "cronotachigrafo");
    expect(body[0]).toEqual([
      "TI298409",
      "IVECO / Mario Rossi",
      "Cronotachigrafo",
      "Scaduta",
      "01/06/2026 - 15 giorni fa",
      "-",
      "Base: tempo | nota",
    ]);
  });

  it("divide il PDF completo per categoria quando il filtro e' Tutte", () => {
    const body = buildScadenzePdfTableBody(rows, "tutte");

    expect(body[0]).toMatchObject([{ content: "Cronotachigrafo (1)", colSpan: 7 }]);
    expect(body[1]).toEqual([
      "TI298409",
      "IVECO / Mario Rossi",
      "Cronotachigrafo",
      "Scaduta",
      "01/06/2026 - 15 giorni fa",
      "-",
      "Base: tempo | nota",
    ]);
    expect(body[2]).toMatchObject([{ content: "Estintore (1)", colSpan: 7 }]);
    expect(body[4]).toMatchObject([{ content: "Collaudi (1)", colSpan: 7 }]);
  });

  it("produce una riga vuota esplicita quando non ci sono scadenze", () => {
    expect(buildScadenzePdfTableBody([])[0][6]).toMatch(/Nessuna scadenza/);
  });

  it("genera un nome file PDF stabile per categoria", () => {
    expect(buildScadenzePdfFileName("collaudi")).toMatch(/^scadenze-collaudi-\d{4}-\d{2}-\d{2}\.pdf$/);
  });
});
