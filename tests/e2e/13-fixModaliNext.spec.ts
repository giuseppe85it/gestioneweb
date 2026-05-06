import { expect, test } from "@playwright/test";
import { signInAnonymously } from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { auth, db } from "../../src/firebase";
import type { ChatIaToolExecutionContext } from "../../src/next/chat-ia/tools/chatIaToolTypes";
import { toolGetEuromeccData } from "../../src/next/chat-ia/tools/registry/toolGetEuromeccData";
import { toolGetVehicleByPlate } from "../../src/next/chat-ia/tools/registry/toolGetVehicleByPlate";
import { toolListVehicles } from "../../src/next/chat-ia/tools/registry/toolListVehicles";
import { toolListWorkshops } from "../../src/next/chat-ia/tools/registry/toolListWorkshops";

type RawRecord = Record<string, unknown>;

function context(prompt: string): ChatIaToolExecutionContext {
  return {
    requestId: `fix-modali-next-${Date.now()}`,
    sessionId: "fix-modali-next",
    prompt,
    nowIso: new Date().toISOString(),
  };
}

async function ensureAuth(): Promise<void> {
  if (auth.currentUser) return;
  await signInAnonymously(auth);
}

function isRecord(value: unknown): value is RawRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function norm(value: unknown): string {
  return text(value).toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizePlate(value: unknown): string {
  return text(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function record(value: unknown): RawRecord {
  return isRecord(value) ? value : {};
}

function array(value: unknown): RawRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function hasOwn(value: RawRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function normalizeDataset(data: RawRecord): RawRecord[] {
  const valueRecord = isRecord(data.value) ? data.value : null;
  const candidates = [data.items, valueRecord?.items, data.value, data.records, data.list];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate.filter(isRecord);
  }
  return Object.values(data).filter(isRecord);
}

async function readStorageDataset(key: string): Promise<RawRecord[]> {
  const snapshot = await getDoc(doc(db, "storage", key));
  return snapshot.exists() ? normalizeDataset(snapshot.data() as RawRecord) : [];
}

async function readCollectionDataset(collectionName: string): Promise<RawRecord[]> {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((entry) => ({ _id: entry.id, id: entry.id, ...entry.data() }));
}

async function firstVehicle(): Promise<RawRecord> {
  const vehicles = await readStorageDataset("@mezzi_aziendali");
  const found = vehicles.find((item) => normalizePlate(item.targa));
  expect(found, "Nessun mezzo reale nel dataset @mezzi_aziendali").toBeTruthy();
  return found as RawRecord;
}

async function firstVehicleWith(fieldName: "prenotazioneCollaudo" | "preCollaudo"): Promise<RawRecord> {
  const vehicles = await readStorageDataset("@mezzi_aziendali");
  const found = vehicles.find((item) => {
    const value = item[fieldName];
    return isRecord(value) && Object.keys(value).length > 0 && normalizePlate(item.targa);
  });
  expect(found, `Nessun mezzo reale con ${fieldName} nel dataset @mezzi_aziendali`).toBeTruthy();
  return found as RawRecord;
}

async function firstVehicleWithLibrettoRaw(): Promise<RawRecord> {
  const vehicles = await readStorageDataset("@mezzi_aziendali");
  const found = vehicles.find((item) => {
    const librettoRaw = item.libretto_raw;
    const hasRaw = isRecord(librettoRaw) && Object.keys(librettoRaw).length > 0;
    const hasExtractedFields = text(item.numeroMatricola) || text(item.matricola) || text(item.numeroAvs) || text(item.nAvs);
    return normalizePlate(item.targa) && (hasRaw || hasExtractedFields);
  });
  expect(found, "Nessun mezzo reale con libretto_raw o campi libretto nel dataset @mezzi_aziendali").toBeTruthy();
  return found as RawRecord;
}

async function runGetVehicleByPlate(targa: string): Promise<RawRecord> {
  const output = await toolGetVehicleByPlate.run({ targa }, context(`info mezzo ${targa}`));
  return record(output);
}

function assertRecordIds(items: RawRecord[]): void {
  for (const item of items) {
    expect(text(item._id ?? item.id), `Record senza fingerprint: ${JSON.stringify(item)}`).not.toBe("");
  }
}

test.beforeAll(async () => {
  await ensureAuth();
});

test("G1 - list_workshops espone descrizione scritta dalle officine", async () => {
  const rawWorkshops = await readStorageDataset("@officine");
  const rawWithDescription = rawWorkshops.find((item) => text(item.descrizione));

  const output = record(await toolListWorkshops.run({ limit: 200 }, context("lista officine con descrizione")));
  const items = array(output.items);

  expect(items.length).toBeGreaterThan(0);
  expect(items.every((item) => hasOwn(item, "descrizione"))).toBe(true);

  if (rawWithDescription) {
    const rawKey = norm(rawWithDescription.id) || norm(rawWithDescription.nome);
    const matched = items.find((item) => norm(item.id) === rawKey || norm(item.nome) === rawKey);
    expect(matched, "Officina raw con descrizione non ritrovata nel tool").toBeTruthy();
    expect(text(matched?.descrizione)).toBe(text(rawWithDescription.descrizione));
  }
});

test("G2 - list_vehicles espone sotto-oggetti collaudo, foto e libretto", async () => {
  const targetTarga = normalizePlate((await firstVehicle()).targa);
  const output = record(await toolListVehicles.run({ testo: targetTarga }, context(`info mezzo ${targetTarga}`)));
  const items = array(output.items);
  const vehicle = items.find((item) => normalizePlate(item.targa) === targetTarga);

  expect(vehicle, `${targetTarga} non restituito da list_vehicles`).toBeTruthy();
  for (const key of [
    "prenotazioneCollaudo",
    "preCollaudo",
    "fotoUrl",
    "fotoPath",
    "librettoUrl",
    "librettoStoragePath",
    "libretto_raw",
    "media",
    "fotoViste",
    "hotspots",
  ]) {
    expect(hasOwn(vehicle as RawRecord, key), `Campo mancante in list_vehicles: ${key}`).toBe(true);
  }
});

test("G3 - get_vehicle_by_plate espone prenotazione collaudo data ora luogo note", async () => {
  const rawVehicle = await firstVehicleWith("prenotazioneCollaudo");
  const rawPrenotazione = record(rawVehicle.prenotazioneCollaudo);
  const output = await runGetVehicleByPlate(normalizePlate(rawVehicle.targa));
  const prenotazione = record(output.prenotazioneCollaudo);

  expect(prenotazione.presente).toBe(true);
  for (const key of ["data", "ora", "luogo", "note"]) {
    expect(hasOwn(prenotazione, key), `Campo prenotazione mancante: ${key}`).toBe(true);
  }
  if (text(rawPrenotazione.ora)) expect(prenotazione.ora).toBe(text(rawPrenotazione.ora));
  if (text(rawPrenotazione.luogo)) expect(prenotazione.luogo).toBe(text(rawPrenotazione.luogo));
});

test("G4 - get_vehicle_by_plate espone pre-collaudo data officina lavoriPrevisti", async () => {
  const rawVehicle = await firstVehicleWith("preCollaudo");
  const rawPreCollaudo = record(rawVehicle.preCollaudo);
  const output = await runGetVehicleByPlate(normalizePlate(rawVehicle.targa));
  const preCollaudo = record(output.preCollaudo);

  expect(preCollaudo.presente).toBe(true);
  for (const key of ["data", "officina", "lavoriPrevisti"]) {
    expect(hasOwn(preCollaudo, key), `Campo pre-collaudo mancante: ${key}`).toBe(true);
  }
  if (text(rawPreCollaudo.officina)) expect(preCollaudo.officina).toBe(text(rawPreCollaudo.officina));
  if (text(rawPreCollaudo.lavoriPrevisti)) expect(preCollaudo.lavoriPrevisti).toBe(text(rawPreCollaudo.lavoriPrevisti));
});

test("G5 - revisione completata espone completata completataIl esito noteEsito", async () => {
  const rawVehicle = await firstVehicleWith("prenotazioneCollaudo");
  const rawPrenotazione = record(rawVehicle.prenotazioneCollaudo);
  const output = await runGetVehicleByPlate(normalizePlate(rawVehicle.targa));
  const prenotazione = record(output.prenotazioneCollaudo);

  for (const key of ["completata", "completataIl", "esito", "noteEsito"]) {
    expect(hasOwn(prenotazione, key), `Campo completamento collaudo mancante: ${key}`).toBe(true);
  }
  if (hasOwn(rawPrenotazione, "esito") && text(rawPrenotazione.esito)) {
    expect(prenotazione.esito).toBe(text(rawPrenotazione.esito));
  }
});

test("G6 - libretto_raw resta esposto come valore salvato sul mezzo", async () => {
  const rawVehicleRecord = await firstVehicleWithLibrettoRaw();
  const targa = normalizePlate(rawVehicleRecord.targa);

  const output = await runGetVehicleByPlate(targa);
  const librettoRaw = record(output.libretto_raw ?? record(output.vehicle).libretto_raw);
  const expectedMatricola = text(rawVehicleRecord.numeroMatricola ?? rawVehicleRecord.matricola);
  const expectedAvs = text(rawVehicleRecord.numeroAvs ?? rawVehicleRecord.nAvs ?? rawVehicleRecord.detentoreAfsAvs);

  expect(Object.keys(librettoRaw).length).toBeGreaterThan(0);
  if (expectedMatricola) expect(librettoRaw.numeroMatricola).toBe(expectedMatricola);
  if (expectedAvs) expect(librettoRaw.numeroAvs).toBe(expectedAvs);
});

test("G7 - foto vista mezzo sono integrate nel media dei tool mezzo", async () => {
  const photos = await readStorageDataset("@mezzi_foto_viste");
  const photo = photos.find((item) => normalizePlate(item.targa));
  const targa = photo ? normalizePlate(photo.targa) : normalizePlate((await firstVehicle()).targa);
  const expectedCount = photos.filter((item) => normalizePlate(item.targa) === targa).length;
  const output = await runGetVehicleByPlate(targa);
  const media = record(output.media);
  const fotoViste = array(media.foto_viste);

  expect(Array.isArray(output.fotoViste)).toBe(true);
  if (photo) {
    const expectedId = text(photo.id);
    expect(
      fotoViste.some((item) =>
        expectedId
          ? text(item._id) === expectedId || text(item.id) === expectedId
          : normalizePlate(item.targa) === targa && text(item._id),
      ),
    ).toBe(true);
  } else {
    expect(fotoViste.length).toBe(expectedCount);
  }
});

test("G8 - hotspot mappa mezzo sono integrati nel media dei tool mezzo", async () => {
  const hotspotsRaw = await readStorageDataset("@mezzi_hotspot_mapping");
  const hotspot = hotspotsRaw.find((item) => normalizePlate(item.targa));
  const targa = hotspot ? normalizePlate(hotspot.targa) : normalizePlate((await firstVehicle()).targa);
  const expectedCount = hotspotsRaw.filter((item) => normalizePlate(item.targa) === targa).length;
  const output = await runGetVehicleByPlate(targa);
  const media = record(output.media);
  const hotspots = array(media.hotspots);

  expect(Array.isArray(output.hotspots)).toBe(true);
  if (hotspot) {
    const expectedId = text(hotspot.id);
    expect(
      hotspots.some((item) =>
        expectedId
          ? text(item._id) === expectedId || text(item.id) === expectedId
          : normalizePlate(item.targa) === targa && text(item._id),
      ),
    ).toBe(true);
  } else {
    expect(hotspots.length).toBe(expectedCount);
  }
});

test("G9 - get_euromecc_data legge euromecc_issues ed euromecc_extra_components", async () => {
  const [issuesRaw, componentsRaw] = await Promise.all([
    readCollectionDataset("euromecc_issues"),
    readCollectionDataset("euromecc_extra_components"),
  ]);
  const output = record(await toolGetEuromeccData.run({ tipo: "all", limit: 200 }, context("stato euromecc")));
  const items = array(output.items);
  const issues = array(output.issues);
  const extraComponents = array(output.extraComponents);

  expect(items.length).toBe(issuesRaw.length + componentsRaw.length);
  expect(issues.length).toBe(issuesRaw.length);
  expect(extraComponents.length).toBe(componentsRaw.length);
  assertRecordIds(items);
  expect(items.every((item) => item.tipo === "issue" || item.tipo === "extra_component")).toBe(true);
});

test("Fingerprint - nuovi dati esposti mantengono _id reale o composto stabile", async () => {
  const targetTarga = normalizePlate((await firstVehicle()).targa);
  const workshops = array(record(await toolListWorkshops.run({ limit: 200 }, context("officine"))).items);
  const vehicleOutput = await runGetVehicleByPlate(targetTarga);
  const euromeccOutput = record(await toolGetEuromeccData.run({ tipo: "all", limit: 200 }, context("issue euromecc")));
  const euromeccItems = array(euromeccOutput.items);

  assertRecordIds(workshops);
  assertRecordIds([record(vehicleOutput.vehicle)]);
  assertRecordIds(euromeccItems);
});
