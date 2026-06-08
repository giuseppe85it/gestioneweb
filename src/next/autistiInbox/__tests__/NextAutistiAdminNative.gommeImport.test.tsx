import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, unknown>();

vi.mock("../../autisti/nextAutistiHomeEvents", () => ({
  loadHomeEvents: vi.fn(() => Promise.resolve([])),
  loadRimorchiStatus: vi.fn(() => Promise.resolve([])),
}));

vi.mock("../nextAutistiAdminBridges", () => ({
  db: {},
  storage: {},
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  ref: vi.fn(),
  deleteObject: vi.fn(),
}));

vi.mock("../../autisti/nextAutistiStorageSync", () => ({
  getItemSync: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
  setItemSync: vi.fn((key: string, value: unknown) => {
    store.set(key, value);
    return Promise.resolve();
  }),
}));

vi.mock("../../../utils/pdfEngine", () => ({
  generateControlloPDFBlob: vi.fn(),
  generateSegnalazionePDFBlob: vi.fn(),
}));

vi.mock("../../../components/PdfPreviewModal", () => ({
  default: () => null,
}));

vi.mock("../../../utils/pdfPreview", () => ({
  buildPdfShareText: vi.fn(),
  buildWhatsAppShareUrl: vi.fn(),
  copyTextToClipboard: vi.fn(),
  openPreview: vi.fn(),
  revokePdfPreviewUrl: vi.fn(),
  sharePdfFile: vi.fn(),
}));

vi.mock("../../../utils/targhe", () => ({
  buildTargheList: vi.fn(() => []),
}));

vi.mock("../../../components/TargaPicker", () => ({
  default: () => null,
}));

vi.mock("../../writers/nextManutenzioneDaFareCreateWriter", () => ({
  agganciaSorgenteAManutenzioneEsistente: vi.fn(),
  createManutenzioneDaFareFromControllo: vi.fn(),
  createManutenzioneDaFareFromSegnalazione: vi.fn(),
}));

vi.mock("../../helpers/manutenzioniCandidatiMerge", () => ({
  getManutenzioniCandidateMerge: vi.fn(() => Promise.resolve([])),
}));

vi.mock("../../components/NextMergeManutenzioneModal", () => ({
  NextMergeManutenzioneModal: () => null,
}));

vi.mock("../../writers/nextChiusuraEventoWriter", () => ({
  chiudiControlloDaEvento: vi.fn(),
  chiudiManutenzioneDaEvento: vi.fn(),
  chiudiSegnalazioneDaEvento: vi.fn(),
  sganciaControlloDaEvento: vi.fn(),
  sganciaSegnalazioneDaEvento: vi.fn(),
}));

vi.mock("../../components/NextAggancioEventoModal", () => ({
  NextAggancioEventoModal: () => null,
}));

vi.mock("../../helpers/parseRobusto", () => ({
  getDataRiferimentoRecord: vi.fn(() => null),
}));

vi.mock("../../components/NextImportGommeChiusuraModal", () => ({
  NextImportGommeChiusuraModal: () => null,
}));

import { appendGommeEventoUfficialeIfMissing } from "../NextAutistiAdminNative";

type RawRecord = Record<string, unknown>;

function readEventi(): RawRecord[] {
  const value = store.get("@gomme_eventi");
  return Array.isArray(value) ? (value as RawRecord[]) : [];
}

describe("NextAutistiAdminNative - guardia import gomme", () => {
  beforeEach(() => {
    store.clear();
  });

  it("non appende due volte un evento ufficiale con lo stesso id", async () => {
    const record = { id: "EVT-GOMME-1", targa: "TI282780", letta: false, stato: "nuovo" };

    const first = await appendGommeEventoUfficialeIfMissing(record);
    const second = await appendGommeEventoUfficialeIfMissing({
      ...record,
      note: "secondo click",
    });

    expect(first.appended).toBe(true);
    expect(second.appended).toBe(false);
    expect(readEventi()).toHaveLength(1);
    expect(readEventi()[0]).toEqual({ id: "EVT-GOMME-1", targa: "TI282780" });
  });

  it("appende eventi ufficiali distinti", async () => {
    await appendGommeEventoUfficialeIfMissing({ id: "EVT-GOMME-1", targa: "TI282780" });
    await appendGommeEventoUfficialeIfMissing({ id: "EVT-GOMME-2", targa: "TI282780" });

    expect(readEventi().map((record) => record.id)).toEqual([
      "EVT-GOMME-1",
      "EVT-GOMME-2",
    ]);
  });
});
