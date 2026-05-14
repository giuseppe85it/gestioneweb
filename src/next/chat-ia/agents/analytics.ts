import type {
  ChatIaAgentResult,
  ChatIaAnalyticsResult,
  ChatIaAnalyticsTable,
  ChatIaArguteQuestionId,
  ChatIaOrchestratorPlan,
} from "./types";

type AnyRecord = Record<string, unknown>;

function isRecord(value: unknown): value is AnyRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, fallback = "n.d."): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function fingerprint(value: unknown, fallback = ""): string | null {
  const normalized = typeof value === "string" && value.trim() ? value.trim() : fallback;
  return normalized || null;
}

function number(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function routeForTarga(targa: unknown): string | null {
  const value = text(targa, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return value ? `/next/dossier/${encodeURIComponent(value)}` : null;
}

function routeForManutenzione(targa: unknown, id: unknown): string | null {
  const params = new URLSearchParams();
  const plate = text(targa, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (plate) params.set("targa", plate);
  const recordId = text(id, "");
  if (recordId) params.set("recordId", recordId);
  const serialized = params.toString();
  return serialized ? `/next/manutenzioni?${serialized}` : "/next/manutenzioni";
}

function routeForDocument(targa: unknown): string {
  return routeForTarga(targa) ?? "/next/ia/documenti";
}

function routeForAutista(): string {
  return "/next/anagrafiche?tab=colleghi";
}

function routeForCantiere(cantiere: unknown): string {
  const value = text(cantiere, "");
  return value ? `/next/attrezzature-cantieri?cantiere=${encodeURIComponent(value)}` : "/next/attrezzature-cantieri";
}

function action(label: string, href: string | null, entityKind?: string | null, entityId?: string | null) {
  return { label, href, entityKind: entityKind ?? null, entityId: entityId ?? null };
}

function meta(label: string, value: unknown) {
  const normalized = typeof value === "number" ? value : text(value, "");
  return normalized === "" ? null : { label, value: normalized };
}

function compactMeta(...items: Array<{ label: string; value: string | number } | null>) {
  return items.filter((item): item is { label: string; value: string | number } => Boolean(item));
}

function displayAmount(value: unknown, currency = "EUR"): string {
  const amount = number(value);
  return amount > 0 ? `${round(amount, 2)} ${currency}` : "n.d.";
}

function allToolData(agentResults: ChatIaAgentResult[], toolName: string): AnyRecord[] {
  return agentResults
    .flatMap((agentResult) => agentResult.toolResults)
    .filter((toolResult) => toolResult.name === toolName && toolResult.ok && isRecord(toolResult.data))
    .map((toolResult) => toolResult.data as AnyRecord);
}

function rowsFromData(data: AnyRecord | null): AnyRecord[] {
  if (!data) return [];
  for (const key of ["items", "rows", "buckets", "movimenti", "statoAttuale", "subtotali", "byMonth"]) {
    const value = data[key];
    if (Array.isArray(value)) return value.filter(isRecord);
  }
  return [];
}

function sourceList(agentResults: ChatIaAgentResult[]) {
  return agentResults.flatMap((agentResult) =>
    agentResult.toolResults
      .filter((toolResult) => toolResult.ok)
      .map((toolResult) => ({ label: agentResult.summary, toolName: toolResult.name })),
  );
}

function collectTruncationReasons(agentResults: ChatIaAgentResult[]): string[] {
  const reasons = new Set<string>();
  for (const agentResult of agentResults) {
    for (const toolResult of agentResult.toolResults) {
      if (!toolResult.ok || !isRecord(toolResult.data)) continue;
      const data = toolResult.data;
      if (data.is_truncated === true && typeof data.truncation_reason === "string") {
        reasons.add(data.truncation_reason);
      }
      if (data.topByTarga_is_truncated === true && typeof data.topByTarga_truncation_reason === "string") {
        reasons.add(data.topByTarga_truncation_reason);
      }
      for (const key of ["filteredItemsMeta", "filteredPeriodItemsMeta"]) {
        const metaValue = data[key];
        if (isRecord(metaValue) && metaValue.is_truncated === true && typeof metaValue.truncation_reason === "string") {
          reasons.add(metaValue.truncation_reason);
        }
      }
    }
  }
  return Array.from(reasons);
}

function withTruncationCallouts(result: ChatIaAnalyticsResult, agentResults: ChatIaAgentResult[]): ChatIaAnalyticsResult {
  const truncationCallouts = collectTruncationReasons(agentResults).map((reason) => ({
    tone: "info" as const,
    title: "Elenco parziale",
    text: reason,
  }));
  return truncationCallouts.length
    ? { ...result, callouts: [...result.callouts, ...truncationCallouts] }
    : result;
}

function emptyResult(questionId: ChatIaArguteQuestionId, title: string, agentResults: ChatIaAgentResult[]): ChatIaAnalyticsResult {
  return {
    questionId,
    title,
    narrative: "Ho attivato gli agenti specialisti, ma i tool non hanno restituito abbastanza dati per un calcolo completo.",
    metrics: [],
    rankings: [],
    comparison: [],
    trend: [],
    tables: [],
    timeline: [],
    nestedLists: [],
    callouts: [
      {
        tone: "warning",
        title: "Dati insufficienti",
        text: "La risposta resta prudente: restringi il periodo o indica un mezzo/autista per ottenere un confronto piu solido.",
      },
    ],
    sources: sourceList(agentResults),
  };
}

function vehicleLabel(record: AnyRecord): string {
  return text(record.targa ?? record.label, "mezzo n.d.");
}

function consumptionRows(agentResults: ChatIaAgentResult[]) {
  const fleetConsumptionRows = allToolData(agentResults, "fleet_consumption_analysis")
    .flatMap((record) => rowsFromData(record))
    .map((record) => ({
      _id: fingerprint(record._id ?? record.id, `targa:${text(record.targa, "")}`),
      targa: text(record.targa, "n.d."),
      litri: number(record.litriTotali),
      km: number(record.kmTotali),
      kmLitro: number(record.kmLitro),
      costo: number(record.costoTotale),
      categoria: text(record.categoria, "categoria n.d."),
      autista: text(record.autista, "autista n.d."),
      rifornimenti: number(record.rifornimenti),
    }))
    .filter((row) => row.litri > 0)
    .sort((left, right) => right.litri - left.litri);
  if (fleetConsumptionRows.length > 0) return fleetConsumptionRows;

  return allToolData(agentResults, "get_consumption_average")
    .map((record) => {
      const targa = text(record.targa, "n.d.");
      const litri = number(record.litriTotali);
      const km = number(record.kmTotali);
      const l100 = number(record.consumoL100Km);
      const kmLitro = litri > 0 && km > 0 ? km / litri : l100 > 0 ? 100 / l100 : 0;
      const mezzo = isRecord(record.mezzo) ? record.mezzo : {};
      return {
        _id: fingerprint(record._id ?? record.id, `targa:${targa}`),
        targa,
        litri,
        km,
        kmLitro,
        costo: number(record.costoTotale),
        categoria: text(mezzo.categoria, "categoria n.d."),
        autista: text(mezzo.autistaNome ?? mezzo.autista, "autista n.d."),
        rifornimenti: 0,
      };
    })
    .filter((row) => row.litri > 0)
    .sort((left, right) => right.litri - left.litri);
}

function analyzeConsumption(questionId: "D1" | "D5" | "D7", agentResults: ChatIaAgentResult[]): ChatIaAnalyticsResult {
  const rows = consumptionRows(agentResults);
  if (rows.length === 0) return emptyResult(questionId, "Analisi consumi", agentResults);
  const fleetConsumptionData = allToolData(agentResults, "fleet_consumption_analysis")[0] ?? {};
  const totalFleetVehicles = number(fleetConsumptionData.totalFleetVehicles);
  const top = rows[0];
  const driverBuckets = new Map<string, { label: string; litri: number; km: number; categoria: string }>();
  for (const row of rows) {
    const key = row.autista;
    const bucket = driverBuckets.get(key) ?? { label: key, litri: 0, km: 0, categoria: row.categoria };
    bucket.litri += row.litri;
    bucket.km += row.km;
    bucket.categoria = row.categoria;
    driverBuckets.set(key, bucket);
  }
  const driverRows = Array.from(driverBuckets.values()).sort((left, right) => right.litri - left.litri);
  const title = questionId === "D7" ? "Autista con piu km medi" : "Consumi mezzi e autisti";
  const topDriver = driverRows[0];
  const narrative = questionId === "D7"
    ? `Sulla flotta interrogata l'autista con piu km medi e ${topDriver?.label ?? "n.d."}. Mostro anche il tipo mezzo prevalente e i mezzi collegati.`
    : `Ho interrogato tutta la flotta: ${rows.length} mezzi hanno rifornimenti nel periodo. Il mezzo con piu litri e ${top.targa}; mostro la classifica ordinata in modo decrescente.`;

  return {
    questionId,
    title,
    narrative,
    metrics: [
      questionId === "D7"
        ? { label: "Autista top", value: topDriver?.label ?? "n.d.", detail: `${round(topDriver?.km ?? 0)} km stimati`, action: action("Apri collega", routeForAutista(), "autista", topDriver?.label) }
        : { label: "Mezzo top", value: top.targa, detail: `${round(top.litri)} l`, action: action("Apri dossier", routeForTarga(top.targa), "mezzo", top.targa) },
      { label: "Media km/l top", value: round(top.kmLitro, 2), unit: "km/l", detail: `${round(top.km)} km rilevati` },
      { label: "Mezzi confrontati", value: rows.length, unit: "mezzi" },
      { label: "Flotta interrogata", value: totalFleetVehicles || rows.length, unit: "mezzi" },
    ],
    rankings: rows.map((row) => ({
      _id: row._id,
      label: row.targa,
      value: round(row.litri, 1),
      unit: "l",
      detail: `${round(row.kmLitro, 2)} km/l - ${row.autista}`,
      metadata: compactMeta(
        meta("Autista", row.autista),
        meta("Categoria", row.categoria),
        meta("Rifornimenti", row.rifornimenti),
        meta("Costo", displayAmount(row.costo)),
      ),
      action: action("Apri dossier", routeForTarga(row.targa), "mezzo", row.targa),
    })),
    comparison: driverRows.slice(0, 4).map((row) => ({
      label: row.label,
      value: round(row.litri, 1),
      unit: "l",
      detail: row.categoria,
      metadata: compactMeta(meta("Km stimati", round(row.km, 1)), meta("Categoria prevalente", row.categoria)),
      action: action("Apri collega", routeForAutista(), "autista", row.label),
    })),
    trend: rows.map((row) => ({ label: row.targa, value: round(row.kmLitro, 2), unit: "km/l", detail: row.categoria })),
    tables: [
      {
        title: "Confronto consumi",
        columns: [
          { key: "targa", label: "Targa" },
          { key: "litri", label: "Litri", align: "right" },
          { key: "km_l", label: "Km/l", align: "right" },
          { key: "autista", label: "Autista" },
          { key: "categoria", label: "Categoria" },
          { key: "rifornimenti", label: "Rifornimenti", align: "right" },
          { key: "costo", label: "Costo", align: "right" },
        ],
        rows: rows.map((row) => ({
          targa: row.targa,
          litri: round(row.litri, 1),
          km_l: round(row.kmLitro, 2),
          autista: row.autista,
          categoria: row.categoria,
          rifornimenti: row.rifornimenti,
          costo: displayAmount(row.costo),
          _id: row._id,
        })),
        rowActions: rows.map((row) => action("Apri dossier", routeForTarga(row.targa), "mezzo", row.targa)),
        emptyText: "Nessun consumo disponibile.",
      },
    ],
    timeline: [],
    nestedLists: [],
    callouts: [
      {
        tone: "info",
        title: "Metodo",
        text: `Calcolo eseguito sui rifornimenti disponibili per tutta la flotta nel periodo richiesto. In visualizzazione mostro i primi ${Math.min(rows.length, 8)} mezzi ordinati per litri.`,
      },
    ],
    sources: sourceList(agentResults),
  };
}

function analyzeMaintenances(questionId: "D2", agentResults: ChatIaAgentResult[]): ChatIaAnalyticsResult {
  const rows = allToolData(agentResults, "search_maintenances")
    .flatMap((data) => rowsFromData(data))
    .filter((row, index, list) => {
      const id = text(row.id, "");
      if (!id) return index === list.findIndex((candidate) => JSON.stringify(candidate) === JSON.stringify(row));
      return index === list.findIndex((candidate) => text(candidate.id, "") === id);
    });
  if (rows.length === 0) return emptyResult(questionId, "Ultima manutenzione del mese", agentResults);
  const latest = rows[0];
  const analoghe = rows.slice(1, 6);
  const rowFingerprint = (row: AnyRecord) => fingerprint(row._id ?? row.id, `manutenzione:${text(row.id, text(row.targa, ""))}`);
  const actionForRow = (row: AnyRecord) => action("Apri manutenzione", routeForManutenzione(row.targa, row.id), "manutenzione", text(row.id ?? row._id, ""));
  return {
    questionId,
    title: "Ultima manutenzione del mese",
    narrative: `Ultima manutenzione rilevata: ${vehicleLabel(latest)} - ${text(latest.tipo, "tipo n.d.")}. Ho elencato le manutenzioni analoghe disponibili sotto la scheda principale.`,
    metrics: [
      { label: "Targa", value: vehicleLabel(latest), action: action("Apri dossier", routeForTarga(latest.targa), "mezzo", text(latest.targa, "")) },
      { label: "Data", value: text(latest.data, "n.d.") },
      {
        label: "Tipo",
        value: text(latest.tipo, "n.d."),
        detail: text(latest.descrizione_breve ?? latest.fornitore, "Descrizione non disponibile"),
        action: actionForRow(latest),
      },
    ],
    rankings: [],
    comparison: [],
    trend: [],
    tables: [
      {
        title: "Manutenzioni analoghe",
        columns: [
          { key: "data", label: "Data" },
          { key: "targa", label: "Targa" },
          { key: "tipo", label: "Tipo" },
          { key: "descrizione", label: "Descrizione" },
          { key: "fornitore", label: "Fornitore" },
          { key: "costo", label: "Costo", align: "right" },
        ],
        rows: analoghe.map((row) => ({
          _id: rowFingerprint(row),
          data: text(row.data, "n.d."),
          targa: text(row.targa, "n.d."),
          tipo: text(row.tipo, "n.d."),
          descrizione: text(row.descrizione_breve, "n.d."),
          fornitore: text(row.fornitore, "n.d."),
          costo: displayAmount(row.costo),
        })),
        rowActions: analoghe.map(actionForRow),
        emptyText: "Nessuna manutenzione analoga disponibile.",
      },
    ],
    timeline: rows.map((row) => ({
      _id: rowFingerprint(row),
      date: text(row.data, "n.d."),
      title: `${vehicleLabel(row)} - ${text(row.tipo, "manutenzione")}`,
      description: text(row.descrizione_breve ?? row.fornitore, ""),
      metadata: compactMeta(meta("Fornitore", row.fornitore), meta("Costo", displayAmount(row.costo)), meta("Stato", row.stato)),
      action: actionForRow(row),
    })),
    nestedLists: [
      {
        title: "Manutenzioni analoghe mostrate",
        groups: [
          {
            title: `${analoghe.length} manutenzioni analoghe disponibili`,
            subtitle: "Stesso ambito operativo nei dati restituiti dal gestionale",
            items: analoghe.map((row) => ({
              _id: rowFingerprint(row),
              title: `${text(row.targa, "n.d.")} - ${text(row.tipo, "manutenzione")}`,
              subtitle: text(row.data, "n.d."),
              description: text(row.descrizione_breve, "Descrizione non disponibile"),
              metadata: compactMeta(meta("Fornitore", row.fornitore), meta("Costo", displayAmount(row.costo)), meta("Stato", row.stato)),
              action: actionForRow(row),
            })),
          },
        ],
      },
    ],
    callouts: [
      {
        tone: rows.length > 1 ? "ok" : "info",
        title: "Manutenzioni analoghe",
        text: rows.length > 1
          ? `Ho trovato ${rows.length - 1} manutenzioni precedenti o analoghe nei dati disponibili e le mostro nella lista dedicata.`
          : "Non risultano analogie sufficienti nei dati disponibili.",
      },
    ],
    sources: sourceList(agentResults),
  };
}

function analyzeEvents(questionId: "D3" | "D4", agentResults: ChatIaAgentResult[]): ChatIaAnalyticsResult {
  const rows = rowsFromData(allToolData(agentResults, "search_operational_events")[0] ?? null);
  if (rows.length === 0) return emptyResult(questionId, questionId === "D3" ? "Log di accesso" : "Anomalie segnalazioni", agentResults);
  const anomalyWords = /anomalia|grave|alta|errore|alert|fermo|guasto|perdita|scad|mancante/i;
  const anomalies = rows.filter((row) => anomalyWords.test(JSON.stringify(row)));
  const eventFingerprint = (row: AnyRecord, index = 0) => fingerprint(row._id ?? row.id, `evento:${text(row.targa ?? row.autista ?? row.tipo, "record")}:${index + 1}`);
  const actionForEvent = (row: AnyRecord) => action(
    text(row.targa, "") ? "Apri dossier" : "Apri centro controllo",
    routeForTarga(row.targa) ?? "/next/centro-controllo",
    text(row.targa, "") ? "mezzo" : "evento",
    text(row.id, "") || text(row.targa, ""),
  );
  const table: ChatIaAnalyticsTable = {
    title: questionId === "D3" ? "Log ordinati per data" : "Segnalazioni classificate",
    columns: [
      { key: "data", label: "Data" },
      { key: "tipo", label: "Tipo" },
      { key: "soggetto", label: "Soggetto" },
      { key: "autore", label: "Autore" },
      { key: "stato", label: "Stato" },
      { key: "descrizione", label: "Descrizione" },
    ],
    rows: rows.map((row, index) => ({
      _id: eventFingerprint(row, index),
      data: text(row.data_italiana, "n.d."),
      tipo: text(row.tipo, "evento"),
      soggetto: text(row.targa ?? row.autista, "n.d."),
      autore: text(row.autista, "n.d."),
      stato: text(row.stato, "n.d."),
      descrizione: text(row.descrizione_breve, ""),
    })),
    rowActions: rows.map(actionForEvent),
    emptyText: "Nessun evento disponibile.",
  };
  return {
    questionId,
    title: questionId === "D3" ? "Log di accesso ordinati" : "Controllo anomalie segnalazioni",
    narrative: questionId === "D3"
      ? `Ho ordinato ${rows.length} eventi/log per data.`
      : `Ho analizzato ${rows.length} segnalazioni: ${anomalies.length} hanno segnali di possibile anomalia.`,
    metrics: [
      { label: "Eventi letti", value: rows.length },
      { label: "Anomalie", value: anomalies.length },
    ],
    rankings: anomalies.map((row, index) => ({
      _id: eventFingerprint(row, index),
      label: text(row.targa ?? row.autista ?? row.tipo, `anomalia ${index + 1}`),
      value: anomalies.length - index,
      unit: "score",
      detail: text(row.descrizione_breve, ""),
      metadata: compactMeta(meta("Data", row.data_italiana), meta("Tipo", row.tipo), meta("Autore", row.autista), meta("Stato", row.stato)),
      action: actionForEvent(row),
    })),
    comparison: [],
    trend: rows.map((row, index) => ({ label: text(row.data_italiana, `riga ${index + 1}`), value: index + 1 })),
    tables: [table],
    timeline: rows.map((row, index) => ({
      _id: eventFingerprint(row, index),
      date: text(row.data_italiana, "n.d."),
      title: text(row.tipo, "evento"),
      description: text(row.descrizione_breve, ""),
      metadata: compactMeta(meta("Soggetto", row.targa ?? row.autista), meta("Autore", row.autista), meta("Stato", row.stato)),
      action: actionForEvent(row),
    })),
    nestedLists: [],
    callouts: [
      {
        tone: anomalies.length > 0 ? "warning" : "ok",
        title: anomalies.length > 0 ? "Anomalie da verificare" : "Nessuna anomalia evidente",
        text: anomalies.length > 0
          ? "Le righe evidenziate contengono parole chiave operative critiche."
          : "Nei dati disponibili non emergono parole chiave critiche.",
      },
    ],
    sources: sourceList(agentResults),
  };
}

function analyzeCostOutliers(agentResults: ChatIaAgentResult[]): ChatIaAnalyticsResult {
  const vehicles = rowsFromData(allToolData(agentResults, "list_vehicles")[0] ?? null);
  const buckets = rowsFromData(allToolData(agentResults, "get_cost_aggregates")[0] ?? null)
    .map((row) => ({ _id: fingerprint(row._id ?? row.id, `targa:${text(row.key, "")}`), targa: text(row.key, ""), total: number(row.total) }))
    .filter((row) => row.targa && row.total > 0)
    .sort((left, right) => right.total - left.total);
  if (buckets.length === 0) return emptyResult("D6", "Outlier costi per categoria", agentResults);
  const categoryByPlate = new Map(vehicles.map((vehicle) => [text(vehicle.targa, ""), text(vehicle.categoria, "categoria n.d.")]));
  const supplierRows = rowsFromData(allToolData(agentResults, "search_documents_and_invoices")[0] ?? null);
  const suppliers = new Map<string, number>();
  supplierRows.forEach((row) => {
    const supplier = text(row.fornitore, "");
    if (supplier) suppliers.set(supplier, (suppliers.get(supplier) ?? 0) + 1);
  });
  const supplierRanking = Array.from(suppliers.entries())
    .map(([label, value]) => ({ label, value, unit: "doc" }))
    .sort((left, right) => right.value - left.value);
  const documentRows = supplierRows.slice(0, 10);
  return {
    questionId: "D6",
    title: "Outlier costi per categoria mezzo",
    narrative: `Il mezzo con costo maggiore nei dati disponibili e ${buckets[0].targa}. Ho incrociato costi, categoria e fornitori ricorrenti.`,
    metrics: [
      { label: "Top costo", value: round(buckets[0].total, 2), unit: "EUR", detail: buckets[0].targa },
      { label: "Mezzi confrontati", value: buckets.length },
      { label: "Fornitore piu frequente", value: supplierRanking[0]?.label ?? "n.d." },
    ],
    rankings: buckets.slice(0, 8).map((row) => ({
      _id: row._id,
      label: row.targa,
      value: round(row.total, 2),
      unit: "EUR",
      detail: categoryByPlate.get(row.targa) ?? "categoria n.d.",
      metadata: compactMeta(
        meta("Categoria", categoryByPlate.get(row.targa) ?? "categoria n.d."),
        meta("Documenti", supplierRows.filter((doc) => text(doc.targa, "") === row.targa).length),
      ),
      action: action("Apri dossier", routeForTarga(row.targa), "mezzo", row.targa),
    })),
    comparison: supplierRanking.slice(0, 4).map((row) => ({
      label: row.label,
      value: row.value,
      unit: "doc",
      detail: "Fornitore ricorrente sui documenti disponibili",
      action: action("Apri documenti", "/next/ia/documenti", "fornitore", row.label),
    })),
    trend: buckets.slice(0, 6).map((row) => ({ label: categoryByPlate.get(row.targa) ?? row.targa, value: round(row.total, 2) })),
    tables: [
      {
        title: "Mezzi piu costosi",
        columns: [
          { key: "targa", label: "Targa" },
          { key: "categoria", label: "Categoria" },
          { key: "costo", label: "Costo", align: "right" },
        ],
        rows: buckets.slice(0, 8).map((row) => ({
          _id: row._id,
          targa: row.targa,
          categoria: categoryByPlate.get(row.targa) ?? "n.d.",
          costo: round(row.total, 2),
        })),
        rowActions: buckets.slice(0, 8).map((row) => action("Apri dossier", routeForTarga(row.targa), "mezzo", row.targa)),
        emptyText: "Nessun costo disponibile.",
      },
      {
        title: "Fatture e documenti principali",
        columns: [
          { key: "numero", label: "Numero" },
          { key: "data", label: "Data" },
          { key: "targa", label: "Targa" },
          { key: "fornitore", label: "Fornitore" },
          { key: "importo", label: "Importo", align: "right" },
          { key: "tipo", label: "Tipo" },
          { key: "descrizione", label: "Descrizione" },
        ],
        rows: documentRows.map((row) => ({
          _id: fingerprint(row._id ?? row.id, `documento:${text(row.numero, text(row.targa, ""))}`),
          numero: text(row.numero, "n.d."),
          data: text(row.data_italiana, "n.d."),
          targa: text(row.targa, "n.d."),
          fornitore: text(row.fornitore, "n.d."),
          importo: displayAmount(row.importo, text(row.valuta, "EUR")),
          tipo: text(row.tipo, "documento"),
          descrizione: text(row.descrizione_breve ?? row.titolo, "n.d."),
        })),
        rowActions: documentRows.map((row) => action("Apri documento", routeForDocument(row.targa), "documento", text(row.id, ""))),
        emptyText: "Nessun documento principale disponibile.",
      },
    ],
    timeline: [],
    nestedLists: [],
    callouts: [
      {
        tone: "warning",
        title: "Outlier economici",
        text: "I valori piu alti vanno verificati con fatture e periodo prima di trarre conclusioni operative.",
      },
    ],
    sources: sourceList(agentResults),
  };
}

function analyzeSiteEquipment(agentResults: ChatIaAgentResult[]): ChatIaAnalyticsResult {
  const fleetSiteData = allToolData(agentResults, "fleet_site_equipment_analysis")[0] ?? null;
  if (fleetSiteData) {
    const rows = rowsFromData(fleetSiteData);
    const movements = Array.isArray(fleetSiteData.recentMovements) ? fleetSiteData.recentMovements.filter(isRecord) : [];
    const totalSites = number(fleetSiteData.totalSites) || rows.length;
    return {
      questionId: "D8",
      title: "Cantieri, attrezzature e mezzi assegnati",
      narrative: `Ho interrogato tutti i cantieri con attrezzature: risultano ${totalSites} cantieri nei dati disponibili.`,
      metrics: [
        { label: "Cantieri", value: totalSites },
        { label: "Movimenti attrezzature", value: number(fleetSiteData.totalMovements) },
        { label: "Righe mostrate", value: Math.min(rows.length, 10) },
      ],
      rankings: rows.map((row) => ({
        _id: fingerprint(row._id ?? row.cantiereId, `cantiere:${text(row.cantiere, "")}`),
        label: text(row.cantiere, "cantiere n.d."),
        value: number(row.attrezzature),
        unit: "attrezzature",
        detail: `${number(row.materiali)} materiali - mezzi assegnati se presenti nei movimenti`,
        metadata: compactMeta(meta("Materiali", number(row.materiali)), meta("Mezzi assegnati", number(row.mezzi_count))),
        action: action("Apri cantiere", routeForCantiere(row.cantiere), "cantiere", text(row.cantiereId ?? row.cantiere, "")),
      })),
      comparison: [],
      trend: [],
      tables: [
        {
          title: "Attrezzature per cantiere",
          columns: [
            { key: "cantiere", label: "Cantiere" },
            { key: "attrezzature", label: "Attrezzature", align: "right" },
            { key: "materiali", label: "Materiali", align: "right" },
            { key: "mezzi", label: "Mezzi assegnati" },
          ],
          rows: rows.slice(0, 10).map((row) => ({
            _id: fingerprint(row._id ?? row.cantiereId, `cantiere:${text(row.cantiere, "")}`),
            cantiere: text(row.cantiere, "n.d."),
            attrezzature: number(row.attrezzature),
            materiali: number(row.materiali),
            mezzi: text(row.mezzi, "Da eventi disponibili"),
          })),
          rowActions: rows.slice(0, 10).map((row) => action("Apri cantiere", routeForCantiere(row.cantiere), "cantiere", text(row.cantiereId ?? row.cantiere, ""))),
          emptyText: "Nessun cantiere disponibile.",
        },
      ],
      timeline: movements.slice(0, 6).map((row, index) => ({
        _id: fingerprint(row._id ?? row.id, `movimento:${index + 1}:${text(row.cantiere, "")}`),
        date: text(row.data_italiana, "n.d."),
        title: `${text(row.tipo, "movimento")} - ${text(row.cantiere, "cantiere n.d.")}`,
        description: text(row.descrizione, ""),
        metadata: compactMeta(meta("Cantiere", row.cantiere), meta("Tipo", row.tipo)),
        action: action("Apri cantiere", routeForCantiere(row.cantiere), "cantiere", text(row.cantiere, "")),
      })),
      nestedLists: [],
      callouts: [
        {
          tone: "info",
          title: "Perimetro cantieri",
          text: "La tabella usa tutti i cantieri presenti nel dataset attrezzature. I mezzi assegnati sono riportabili solo quando emergono dai movimenti o dagli eventi operativi disponibili.",
        },
      ],
      sources: sourceList(agentResults),
    };
  }

  const equipmentData = allToolData(agentResults, "get_site_equipment")[0] ?? null;
  const current = Array.isArray(equipmentData?.statoAttuale) ? equipmentData.statoAttuale.filter(isRecord) : [];
  const movements = Array.isArray(equipmentData?.movimenti) ? equipmentData.movimenti.filter(isRecord) : [];
  return {
    questionId: "D8",
    title: "Cantieri, attrezzature e mezzi assegnati",
    narrative: `Per il cantiere interrogato risultano ${current.length} attrezzature attuali e ${movements.length} movimenti storici nei dati disponibili.`,
    metrics: [
      { label: "Attrezzature attuali", value: current.length },
      { label: "Movimenti", value: movements.length },
      { label: "Cantiere", value: text(equipmentData?.cantiere, "cantiere richiesto") },
    ],
    rankings: [
      {
        _id: fingerprint(equipmentData?._id, `cantiere:${text(equipmentData?.cantiere, "")}`),
        label: text(equipmentData?.cantiere, "cantiere richiesto"),
        value: current.length,
        unit: "attrezzature",
        action: action("Apri cantiere", routeForCantiere(equipmentData?.cantiere), "cantiere", text(equipmentData?.cantiere, "")),
      },
    ],
    comparison: [],
    trend: [],
    tables: [
      {
        title: "Attrezzature e movimenti",
        columns: [
          { key: "cantiere", label: "Cantiere" },
          { key: "attrezzature", label: "Attrezzature", align: "right" },
          { key: "movimenti", label: "Movimenti", align: "right" },
        ],
        rows: [{ _id: fingerprint(equipmentData?._id, `cantiere:${text(equipmentData?.cantiere, "")}`), cantiere: text(equipmentData?.cantiere, "cantiere richiesto"), attrezzature: current.length, movimenti: movements.length }],
        rowActions: [action("Apri cantiere", routeForCantiere(equipmentData?.cantiere), "cantiere", text(equipmentData?.cantiere, ""))],
        emptyText: "Nessun cantiere disponibile.",
      },
    ],
    timeline: movements.slice(0, 6).map((row, index) => ({
      _id: fingerprint(row._id ?? row.id, `movimento:${index + 1}:${text(row.cantiere ?? row.cantiereLabel, "")}`),
      date: text(row.data_italiana, "n.d."),
      title: text(row.tipo, "movimento"),
      description: text(row.descrizione ?? row.materialeDescrizione ?? row.cantiereLabel, ""),
      metadata: compactMeta(meta("Cantiere", row.cantiere ?? row.cantiereLabel), meta("Tipo", row.tipo)),
      action: action("Apri cantiere", routeForCantiere(row.cantiere ?? row.cantiereLabel), "cantiere", text(row.cantiere ?? row.cantiereLabel, "")),
    })),
    nestedLists: [],
    callouts: [
      {
        tone: "info",
        title: "Mezzi assegnati",
        text: "L'incrocio mezzi/cantiere dipende dagli eventi operativi disponibili nel periodo e resta da filtrare per cantiere quando il dato non e valorizzato.",
      },
    ],
    sources: sourceList(agentResults),
  };
}

function analyzeExecutorReport(agentResults: ChatIaAgentResult[]): ChatIaAnalyticsResult {
  const maintenances: AnyRecord[] = rowsFromData(
    allToolData(agentResults, "search_maintenances")[0] ?? null,
  ).map((row) => ({ ...row, ambito: "manutenzione" }));
  const rows: AnyRecord[] = maintenances;
  if (rows.length === 0) {
    return emptyResult("D9", "Report esecutori manutenzioni", agentResults);
  }
  const buckets = new Map<string, { label: string; value: number; detail: string }>();
  for (const row of rows) {
    const label = text(row.assegnato_a ?? row.fornitore ?? row.targa, "esecutore n.d.");
    const current = buckets.get(label) ?? { label, value: 0, detail: "" };
    current.value += 1;
    current.detail = `${text(row.ambito, "attivita")} - ${text(row.targa, "n.d.")}`;
    buckets.set(label, current);
  }
  const ranking = Array.from(buckets.values()).sort((left, right) => right.value - left.value);
  const rowFingerprint = (row: AnyRecord, index = 0) => fingerprint(row._id ?? row.id, `${text(row.ambito, "record")}:${text(row.id, "") || index + 1}`);
  const rowAction = (row: AnyRecord) =>
    action("Apri manutenzione", routeForManutenzione(row.targa, row.id), "manutenzione", text(row.id, ""));
  return {
    questionId: "D9",
    title: "Report esecutori ultimo mese",
    narrative: `Ho raggruppato ${rows.length} manutenzioni per esecutore o referente disponibile.`,
    metrics: [
      { label: "Totale record", value: rows.length },
      { label: "Manutenzioni", value: maintenances.length },
    ],
    rankings: ranking.map((row) => ({
      label: row.label,
      value: row.value,
      unit: "record",
      detail: row.detail,
      metadata: compactMeta(meta("Record assegnati", row.value), meta("Ultimo dettaglio", row.detail)),
      action: action("Apri colleghi", routeForAutista(), "autista", row.label),
    })),
    comparison: [
      { label: "Manutenzioni", value: maintenances.length, unit: "record", detail: "Storico manutenzioni" },
    ],
    trend: [],
    tables: [
      {
        title: "Dettaglio report",
        columns: [
          { key: "ambito", label: "Ambito" },
          { key: "targa", label: "Targa" },
          { key: "data", label: "Data" },
          { key: "referente", label: "Referente" },
          { key: "descrizione", label: "Descrizione" },
        ],
        rows: rows.map((row, index) => ({
          _id: rowFingerprint(row, index),
          ambito: text(row.ambito, ""),
          targa: text(row.targa, "n.d."),
          data: text(row.data ?? row.data_italiana, "n.d."),
          referente: text(row.assegnato_a ?? row.fornitore, "n.d."),
          descrizione: text(row.descrizione_breve, "n.d."),
        })),
        rowActions: rows.map(rowAction),
        emptyText: "Nessun record disponibile.",
      },
    ],
    timeline: rows.map((row, index) => ({
      _id: rowFingerprint(row, index),
      date: text(row.data ?? row.data_italiana, "n.d."),
      title: `${text(row.ambito, "attivita")} - ${text(row.targa, "n.d.")}`,
      description: text(row.descrizione_breve, ""),
      metadata: compactMeta(meta("Referente", row.assegnato_a ?? row.fornitore), meta("Stato", row.stato), meta("Costo", displayAmount(row.costo))),
      action: rowAction(row),
    })),
    nestedLists: [],
    callouts: [
      {
        tone: "ok",
        title: "Report pronto",
        text: "I record sono aggregati sul modulo manutenzioni, unica entita operativa tecnica della NEXT.",
      },
    ],
    sources: sourceList(agentResults),
  };
}

export function analyzeMultiAgentResults(
  plan: ChatIaOrchestratorPlan,
  agentResults: ChatIaAgentResult[],
): ChatIaAnalyticsResult {
  const result = (() => {
    switch (plan.questionId) {
    case "D1":
    case "D5":
    case "D7":
      return analyzeConsumption(plan.questionId, agentResults);
    case "D2":
      return analyzeMaintenances(plan.questionId, agentResults);
    case "D3":
    case "D4":
      return analyzeEvents(plan.questionId, agentResults);
    case "D6":
      return analyzeCostOutliers(agentResults);
    case "D8":
      return analyzeSiteEquipment(agentResults);
    case "D9":
      return analyzeExecutorReport(agentResults);
    default:
      return emptyResult(plan.questionId, "Analisi multi-agente", agentResults);
    }
  })();
  return withTruncationCallouts(result, agentResults);
}
