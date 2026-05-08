import { expect, test } from "@playwright/test";

type RawRow = {
  rowIndex: number;
  dataText: string;
  targa: string;
  autista: string;
  litri: number | null;
  km: number | null;
  fonte: string;
  mediaShownText: string;
  mediaShownValue: number | null;
  timestamp: number;
};

type Result = {
  rowIndex: number;
  dataText: string;
  targa: string;
  expected: number | null;
  shown: number | null;
  shownText: string;
  seedExists: boolean;
  seedAmbiguous: boolean;
  diff: number | null;
  status:
    | "OK"
    | "OK_NULL_SEMANTICO"
    | "KO_SEED_MANCANTE_SHOWN_OK"
    | "KO_VALORE_NON_DOVUTO"
    | "KO_SCOSTAMENTO"
    | "INDETERMINATO";
  motivo: string;
};

function parseItalianNumber(text: string): number | null {
  const cleaned = text
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "")
    .trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseItalianDate(text: string): number | null {
  const m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]) - 1;
  const year = Number(m[3]);
  return new Date(year, month, day, 12, 0, 0, 0).getTime();
}

function parseMediaShown(text: string): number | null {
  const t = text.trim();
  if (!t || t === "—" || t === "-") return null;
  const numericPart = t.replace(/\s*km\/L\s*$/i, "").replace(/⚠/g, "").trim();
  return parseItalianNumber(numericPart);
}

test("audit Media km/L: ogni riga rispetta (R.km - seed.km) / R.litri", async ({
  page,
}) => {
  await page.goto("/next/centro-controllo", { waitUntil: "domcontentloaded" });

  await page.getByRole("button", { name: "Report rifornimenti", exact: true }).click();

  const rifornimentiSection = page.locator("#cc-anchor-rifornimenti");
  await expect(rifornimentiSection).toBeVisible({ timeout: 30000 });

  const meseSelect = rifornimentiSection.locator("label", { hasText: "Mese" }).locator("select");
  const annoSelect = rifornimentiSection.locator("label", { hasText: "Anno" }).locator("select");

  await meseSelect.selectOption("all");
  await annoSelect.selectOption("all");

  await page.waitForTimeout(800);

  const tbody = rifornimentiSection.locator("table.cc-table tbody");
  const tbodyCount = await tbody.count();
  if (tbodyCount === 0) {
    console.log("[AUDIT MEDIA KM/L] Nessuna tabella rifornimenti trovata.");
    expect(tbodyCount, "Tabella rifornimenti assente").toBeGreaterThan(0);
    return;
  }
  await expect(tbody.locator("tr").first()).toBeVisible({ timeout: 30000 });

  const trLocators = await tbody.locator("tr").all();
  const rows: RawRow[] = [];
  for (let i = 0; i < trLocators.length; i += 1) {
    const cellTexts = await trLocators[i].locator("td").allInnerTexts();
    if (cellTexts.length < 7) continue;

    const dataText = (cellTexts[0] || "").trim();
    const targa = (cellTexts[1] || "").trim();
    const autista = (cellTexts[2] || "").trim();
    const litri = parseItalianNumber(cellTexts[3] || "");
    const km = parseItalianNumber(cellTexts[4] || "");
    const fonte = (cellTexts[5] || "").trim();
    const mediaShownText = (cellTexts[6] || "").trim();
    const mediaShownValue = parseMediaShown(mediaShownText);
    const timestamp = parseItalianDate(dataText);
    if (timestamp === null) continue;

    rows.push({
      rowIndex: i,
      dataText,
      targa,
      autista,
      litri,
      km,
      fonte,
      mediaShownText,
      mediaShownValue,
      timestamp,
    });
  }

  console.log(`[AUDIT MEDIA KM/L] righe estratte dal DOM: ${rows.length}`);

  const byTarga = new Map<string, RawRow[]>();
  for (const r of rows) {
    const list = byTarga.get(r.targa);
    if (list) list.push(r);
    else byTarga.set(r.targa, [r]);
  }
  for (const list of byTarga.values()) {
    list.sort((a, b) => a.timestamp - b.timestamp);
  }

  const results: Result[] = [];
  for (const r of rows) {
    const list = byTarga.get(r.targa) ?? [];

    let seed: RawRow | null = null;
    let seedAmbiguous = false;

    if (typeof r.km === "number" && r.km > 0) {
      for (let i = list.length - 1; i >= 0; i -= 1) {
        const c = list[i];
        if (c === r) continue;
        if (c.timestamp >= r.timestamp) continue;
        if (typeof c.km !== "number" || c.km <= 0) continue;
        if (c.km >= r.km) continue;
        seed = c;
        break;
      }
      for (const c of list) {
        if (c === r) continue;
        if (c.timestamp === r.timestamp) {
          seedAmbiguous = true;
          break;
        }
      }
    }

    let expected: number | null = null;
    if (
      seed &&
      typeof r.km === "number" &&
      r.km > 0 &&
      typeof r.litri === "number" &&
      r.litri > 0 &&
      typeof seed.km === "number"
    ) {
      expected = (r.km - seed.km) / r.litri;
    }

    const shown = r.mediaShownValue;
    let status: Result["status"];
    let motivo = "";
    let diff: number | null = null;

    if (shown === null && expected === null) {
      status = "OK_NULL_SEMANTICO";
      motivo = "Nessun seed valido nel DOM, '—' atteso";
    } else if (shown === null && expected !== null) {
      status = "KO_SEED_MANCANTE_SHOWN_OK";
      motivo = `Software mostra '—' ma il test ha trovato seed (calc=${expected.toFixed(
        4,
      )} km/L)`;
    } else if (shown !== null && expected === null) {
      status = "KO_VALORE_NON_DOVUTO";
      motivo = "Software mostra valore ma seed non trovato dal test";
    } else if (shown !== null && expected !== null) {
      diff = Math.abs(shown - expected);
      if (diff <= 0.01) {
        status = "OK";
      } else {
        status = "KO_SCOSTAMENTO";
        motivo = `scostamento ${diff.toFixed(4)} km/L`;
      }
    } else {
      status = "INDETERMINATO";
      motivo = "stato non classificabile";
    }

    if (seedAmbiguous && status !== "OK" && status !== "OK_NULL_SEMANTICO") {
      status = "INDETERMINATO";
      motivo = `${motivo} (timestamp identici nello stesso giorno: seed ambiguo dal DOM)`;
    }

    results.push({
      rowIndex: r.rowIndex,
      dataText: r.dataText,
      targa: r.targa,
      expected,
      shown,
      shownText: r.mediaShownText,
      seedExists: seed !== null,
      seedAmbiguous,
      diff,
      status,
      motivo,
    });
  }

  const ok = results.filter(
    (r) => r.status === "OK" || r.status === "OK_NULL_SEMANTICO",
  ).length;
  const ko = results.filter((r) => r.status.startsWith("KO_")).length;
  const indet = results.filter((r) => r.status === "INDETERMINATO").length;
  const okScostamenti = results
    .filter((r) => r.status === "OK" && r.diff !== null)
    .map((r) => r.diff as number);
  const mediaDiff = okScostamenti.length
    ? okScostamenti.reduce((s, d) => s + d, 0) / okScostamenti.length
    : 0;
  const maxDiff = okScostamenti.length ? Math.max(...okScostamenti) : 0;

  console.log(
    `[AUDIT MEDIA KM/L] OK: ${ok} | KO: ${ko} | INDETERMINATE: ${indet} | totale: ${results.length}`,
  );
  console.log(
    `[AUDIT MEDIA KM/L] scostamento medio assoluto (OK con valore): ${mediaDiff.toFixed(5)} km/L`,
  );
  console.log(
    `[AUDIT MEDIA KM/L] scostamento max assoluto (OK con valore): ${maxDiff.toFixed(5)} km/L`,
  );

  if (ko > 0) {
    console.log(`[AUDIT MEDIA KM/L] DETTAGLIO KO:`);
    for (const r of results) {
      if (!r.status.startsWith("KO_")) continue;
      const expectedTxt = r.expected !== null ? r.expected.toFixed(4) : "null";
      const diffTxt = r.diff !== null ? r.diff.toFixed(4) : "n/a";
      console.log(
        `  - data=${r.dataText} | targa=${r.targa} | shown=${r.shownText} | expected=${expectedTxt} | diff=${diffTxt} | ${r.motivo}`,
      );
    }
  }

  if (indet > 0) {
    console.log(`[AUDIT MEDIA KM/L] DETTAGLIO INDETERMINATE:`);
    for (const r of results) {
      if (r.status !== "INDETERMINATO") continue;
      console.log(
        `  - data=${r.dataText} | targa=${r.targa} | shown=${r.shownText} | ${r.motivo}`,
      );
    }
  }

  expect(
    ko,
    `${ko} righe con divergenza tra Media km/L mostrata e (R.km - seed.km) / R.litri (vedi output console per dettaglio).`,
  ).toBe(0);
});
