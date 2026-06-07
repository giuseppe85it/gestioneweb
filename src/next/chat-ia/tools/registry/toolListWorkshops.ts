import { getItemSync } from "../../../../utils/storageSync";
import { readNextOfficineSnapshot } from "../../../domain/nextOfficineDomain";
import { buildTruncationMeta, truncationNotice } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type Input = { testo?: unknown; citta?: unknown; limit?: unknown };
type AnyRecord = Record<string, unknown>;

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function norm(value: unknown): string { return text(value).toLowerCase(); }
function limit(value: unknown): number { return typeof value === "number" && value > 0 ? Math.min(Math.floor(value), 200) : 50; }
function isRecord(value: unknown): value is AnyRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }

function unwrapArray(value: unknown): AnyRecord[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (!isRecord(value)) return [];
  const valueRecord = isRecord(value.value) ? value.value : null;
  const candidates = [value.items, valueRecord?.items, value.value, value.records, value.list];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate.filter(isRecord);
  }
  return Object.values(value).filter(isRecord);
}

function rawWorkshopKey(value: unknown): string {
  return norm(value).replace(/\s+/g, " ");
}

async function readRawWorkshopDescriptions(): Promise<Map<string, string>> {
  const records = unwrapArray(await getItemSync("@officine"));
  const descriptions = new Map<string, string>();
  records.forEach((record, index) => {
    const descrizione = text(record.descrizione);
    const id = text(record.id) || text(record.nome) || `officina:${index}`;
    const nome = text(record.nome) || text(record.ragioneSociale) || text(record.officina) || text(record.label);
    if (descrizione) {
      if (id) descriptions.set(rawWorkshopKey(id), descrizione);
      if (nome) descriptions.set(rawWorkshopKey(nome), descrizione);
    }
  });
  return descriptions;
}

export const toolListWorkshops: ChatIaToolHandler<Input> = {
  name: "list_workshops",
  descriptionForOpenAi:
    "Elenca o cerca officine registrate in NEXT, includendo nome, telefoni, citta e descrizione quando presente. Usa quando l'utente chiede officine, telefoni officina, descrizione officina o anagrafiche officine.",
  parameters: {
    type: "object",
    properties: { testo: { type: "string" }, citta: { type: "string" }, limit: { type: "number" } },
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const testo = norm(input.testo), citta = norm(input.citta);
    const [snapshot, rawDescriptions] = await Promise.all([
      readNextOfficineSnapshot(),
      readRawWorkshopDescriptions(),
    ]);
    const enrichedItems = snapshot.items.map((item) => {
      const descrizione = rawDescriptions.get(rawWorkshopKey(item.id)) ?? rawDescriptions.get(rawWorkshopKey(item.nome)) ?? null;
      return { _id: item.id || item.nome, ...item, descrizione };
    });
    const items = enrichedItems.filter((item) => (!testo || norm(JSON.stringify(item)).includes(testo)) && (!citta || norm(item.citta).includes(citta)));
    const requestedLimit = limit(input.limit);
    const shown = Math.min(items.length, requestedLimit);
    const truncation = buildTruncationMeta(items.length, shown, "officine");
    return {
      items: items.slice(0, requestedLimit),
      total: items.length,
      ...truncation,
      appliedFilters: { testo, citta },
      notices: truncationNotice(truncation),
    };
  },
};

export default toolListWorkshops;
