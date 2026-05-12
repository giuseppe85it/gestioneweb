import { expect, test } from "@playwright/test";

// Archivio Storico NEXT — Step 9 (PROMPT 29.9): 12 test E2E SPEC §13.2.
// Pattern test: assertion di comportamento (visibilita', transizioni di
// stato, presenza/assenza elementi) — non count esatti perche' i dati
// Firestore sono live e variano nel tempo.

async function gotoArchivio(page: import("@playwright/test").Page) {
  await page.goto("/next/centro-controllo", { waitUntil: "domcontentloaded" });
  await page.getByRole("tab", { name: "Archivio storico" }).click();
  // Attende la toolbar archivio o lo stato di caricamento
  await expect(
    page.locator(".cc-archivio-scope-v1"),
  ).toBeVisible({ timeout: 30000 });
  // attende fine caricamento
  await page.waitForFunction(
    () => !document.querySelector(".cc-archivio-scope-v1 .archivio-loading"),
    null,
    { timeout: 30000 },
  );
}

test("01 — apertura tab Archivio da CC: toolbar + 4 sub-tab visibili", async ({
  page,
}) => {
  await gotoArchivio(page);
  await expect(page.locator(".archivio-toolbar")).toBeVisible();
  await expect(page.locator(".archivio-subtabs")).toBeVisible();
  await expect(
    page.locator(".archivio-subtabs .archivio-tab"),
  ).toHaveCount(4);
});

test("02 — default sub-tab Lavori attiva", async ({ page }) => {
  await gotoArchivio(page);
  const lavoriTab = page.locator(".archivio-subtabs .archivio-tab", {
    hasText: "Lavori",
  });
  await expect(lavoriTab).toHaveClass(/is-active/);
});

test("03 — tutte e 4 sub-tab cliccabili senza errori", async ({ page }) => {
  await gotoArchivio(page);
  for (const label of ["Manutenzioni", "Segnalazioni", "Richieste", "Lavori"]) {
    await page
      .locator(".archivio-subtabs .archivio-tab", { hasText: label })
      .click();
    await expect(
      page.locator(".archivio-subtabs .archivio-tab.is-active", {
        hasText: label,
      }),
    ).toBeVisible();
  }
});

test("04 — filtro Periodo default 'Ultimi 30 giorni' visibile", async ({
  page,
}) => {
  await gotoArchivio(page);
  await expect(page.locator(".archivio-ff-period")).toContainText(
    /Ultimi 30 giorni/i,
  );
  // SPEC §6.5: periodo "Ultimi 30 giorni" e' il DEFAULT e NON conta come
  // filtro attivo → chip ".archivio-filter-state" assente all'apertura.
  await expect(page.locator(".archivio-filter-state")).toHaveCount(0);
});

test("05 — apertura periodo + preset 'Tutto lo storico' rimuove il filtro periodo", async ({
  page,
}) => {
  await gotoArchivio(page);
  await page.locator(".archivio-ff-period-trigger").click();
  await page
    .locator(".archivio-ff-period-presets button", {
      hasText: "Tutto lo storico",
    })
    .click();
  await expect(
    page.locator(".archivio-ff-period .archivio-ff-value"),
  ).toHaveText(/Tutto lo storico/i);
});

test("06 — ricerca scoped: query no-match → 0 risultati", async ({
  page,
}) => {
  await gotoArchivio(page);
  await page.locator(".archivio-ff-period-trigger").click();
  await page
    .locator(".archivio-ff-period-presets button", {
      hasText: "Tutto lo storico",
    })
    .click();
  const searchInput = page.locator('.archivio-ff-search input[type="search"]');
  await searchInput.fill("xyznonesiste-archivio");
  // aspetta debounce + ricalcolo: usa poll su counts
  await expect
    .poll(
      async () => {
        const text: string = await page
          .locator(".archivio-toolbar-meta")
          .innerText();
        const match: RegExpMatchArray | null = text.match(/(\d+)\s+risultati/);
        return match ? Number.parseInt(match[1], 10) : -1;
      },
      { timeout: 10000, intervals: [200, 400, 800] },
    )
    .toBe(0);
});

test("07 — ricerca persiste cambiando sub-tab", async ({ page }) => {
  await gotoArchivio(page);
  const searchInput = page.locator('.archivio-ff-search input[type="search"]');
  await searchInput.click();
  await searchInput.fill("zzzzz-no-match");
  await page.waitForTimeout(400);
  await page
    .locator(".archivio-subtabs .archivio-tab", { hasText: "Manutenzioni" })
    .click();
  await expect(searchInput).toHaveValue("zzzzz-no-match", { timeout: 5000 });
  await page
    .locator(".archivio-subtabs .archivio-tab", { hasText: "Richieste" })
    .click();
  await expect(searchInput).toHaveValue("zzzzz-no-match", { timeout: 5000 });
});

test("08 — click chevron riga (se presente) toggla classe is-expanded", async ({
  page,
}) => {
  await gotoArchivio(page);
  await page.locator(".archivio-ff-period-trigger").click();
  await page
    .locator(".archivio-ff-period-presets button", {
      hasText: "Tutto lo storico",
    })
    .click();
  const firstRow = page.locator(".archivio-row").first();
  const rowExists: number = await firstRow.count();
  if (rowExists === 0) {
    test.skip(true, "Nessuna riga lavori disponibile per il test espansione");
    return;
  }
  const wasExpanded: boolean = await firstRow.evaluate((el: Element) =>
    el.classList.contains("is-expanded"),
  );
  await firstRow.click();
  await expect(firstRow).toHaveClass(
    wasExpanded ? /^(?!.*is-expanded).*$/ : /is-expanded/,
  );
});

test("09 — toggle Densità Compatta aggiunge classe is-compact", async ({
  page,
}) => {
  await gotoArchivio(page);
  await page
    .locator(".archivio-density-toggle button", { hasText: "Compatta" })
    .click();
  await expect(page.locator(".archivio-feed-wrap")).toHaveClass(
    /is-compact/,
  );
  await page
    .locator(".archivio-density-toggle button", { hasText: "Comoda" })
    .click();
  await expect(page.locator(".archivio-feed-wrap")).not.toHaveClass(
    /is-compact/,
  );
});

test("10 — empty state con filtri restrittivi + click 'Azzera filtri' ripristina", async ({
  page,
}) => {
  await gotoArchivio(page);
  // Allarga periodo per essere sicuri che la subtab attiva (lavoro)
  // abbia almeno qualche record prima del filtro restrittivo
  await page.locator(".archivio-ff-period-trigger").click();
  await page
    .locator(".archivio-ff-period-presets button", {
      hasText: "Tutto lo storico",
    })
    .click();
  const searchInput = page.locator('.archivio-ff-search input[type="search"]');
  await searchInput.fill("xyznonesiste-archivio-empty");
  await expect(page.locator(".archivio-empty")).toBeVisible({ timeout: 10000 });
  await page.locator(".archivio-empty-action").click();
  await expect(page.locator(".archivio-empty")).toHaveCount(0, {
    timeout: 5000,
  });
  await expect(searchInput).toHaveValue("");
});

test("11 — no regressioni Sinottica: torna alla tab Sinottica → Sinottica visibile", async ({
  page,
}) => {
  await gotoArchivio(page);
  await page
    .locator(".cc-page-tabs button", { hasText: "Sinottica flotta" })
    .click();
  // L'URL deve perdere `?tab=archivio`
  await expect(page).not.toHaveURL(/tab=archivio/, { timeout: 5000 });
  await expect(page.locator(".cc-archivio-scope-v1")).toHaveCount(0);
  // verifica che ci sia il contenuto Sinottica (cc-tabs interna con Report rifornimenti etc.)
  await expect(
    page.getByRole("button", { name: "Report rifornimenti", exact: true }),
  ).toBeVisible({ timeout: 10000 });
});

test("13 — foto mezzo: ogni riga rende <img> reale o fallback SVG", async ({
  page,
}) => {
  // PROMPT 30.1: la catena flotta→fotoUrl deve produrre nel DOM una
  // foto reale (<img>) quando disponibile, oppure un fallback SVG.
  await gotoArchivio(page);
  // Allarga periodo per massimizzare le righe disponibili
  await page.locator(".archivio-ff-period-trigger").click();
  await page
    .locator(".archivio-ff-period-presets button", {
      hasText: "Tutto lo storico",
    })
    .click();
  // Conta le foto: ogni .archivio-row-photo deve avere un figlio
  // <img> oppure <svg> (no entrambi assenti)
  const rows = page.locator(".archivio-row-photo");
  const rowCount: number = await rows.count();
  if (rowCount === 0) {
    test.skip(true, "Nessuna riga disponibile per il test foto");
    return;
  }
  for (let i = 0; i < Math.min(rowCount, 5); i += 1) {
    const photo = rows.nth(i);
    const hasImg: number = await photo.locator("img").count();
    const hasSvg: number = await photo.locator("svg").count();
    expect(hasImg + hasSvg).toBeGreaterThan(0);
  }
});

test("14 — click 'Apri dettaglio' su Lavori → naviga a /next/dettagliolavori/", async ({
  page,
}) => {
  await gotoArchivio(page);
  await page.locator(".archivio-ff-period-trigger").click();
  await page
    .locator(".archivio-ff-period-presets button", {
      hasText: "Tutto lo storico",
    })
    .click();
  const firstRow = page.locator(".archivio-row").first();
  const rowCount: number = await firstRow.count();
  if (rowCount === 0) {
    test.skip(true, "Nessun lavoro disponibile per il test navigate");
    return;
  }
  await firstRow.click();
  await page.locator(".archivio-row-open-btn").first().click();
  await expect(page).toHaveURL(/\/next\/dettagliolavori\//, { timeout: 10000 });
});

test("15 — apertura modale Segnalazione readOnly con badge consultazione", async ({
  page,
}) => {
  await gotoArchivio(page);
  await page.locator(".archivio-ff-period-trigger").click();
  await page
    .locator(".archivio-ff-period-presets button", {
      hasText: "Tutto lo storico",
    })
    .click();
  await page
    .locator(".archivio-subtabs .archivio-tab", { hasText: "Segnalazioni" })
    .click();
  // Wait robusto: aspetta finche' la prima riga ha type-chip Freni/Gomme/
  // Elettrico/Altro (presente solo su segnalazioni, NON su lavori). Si evita
  // il timing dell'aria-selected della tab.
  const segnRows = page.locator(
    ".archivio-row:has(.archivio-row-type-chip)",
  );
  await expect(segnRows.first()).toBeVisible({ timeout: 15000 });
  await segnRows.first().locator(".archivio-row-open-btn").click();
  // Verifica apertura modale (aix-modal e' il selettore esistente)
  await expect(page.locator(".aix-modal")).toBeVisible({ timeout: 10000 });
  // Verifica badge readOnly
  await expect(page.locator(".nhae-readonly-badge")).toBeVisible();
  await expect(page.locator(".nhae-readonly-badge")).toContainText(
    /Modalità consultazione/i,
  );
  // Verifica assenza bottoni azione (Marca chiusa / CREA LAVORO)
  await expect(page.locator(".aix-modal").getByText("Marca chiusa")).toHaveCount(0);
  await expect(page.locator(".aix-modal").getByText("CREA LAVORO")).toHaveCount(0);
});

test("16 — click 'Lavoro generato' su Segnalazione → naviga al lavoro", async ({
  page,
}) => {
  await gotoArchivio(page);
  await page.locator(".archivio-ff-period-trigger").click();
  await page
    .locator(".archivio-ff-period-presets button", {
      hasText: "Tutto lo storico",
    })
    .click();
  await page
    .locator(".archivio-subtabs .archivio-tab", { hasText: "Segnalazioni" })
    .click();
  // Wait sulla prima riga con type-chip (vedi commento test 15)
  await expect(
    page.locator(".archivio-row:has(.archivio-row-type-chip)").first(),
  ).toBeVisible({ timeout: 15000 });
  // Cerca una riga con step .is-gen (Lavoro generato)
  const genStep = page.locator(".archivio-tl-step.is-gen.archivio-tl-step-clickable").first();
  const genCount: number = await genStep.count();
  if (genCount === 0) {
    test.skip(true, "Nessuna segnalazione con linkedLavoroId disponibile");
    return;
  }
  await genStep.click();
  await expect(page).toHaveURL(/\/next\/dettagliolavori\//, { timeout: 10000 });
});

test("17 — URL state persiste sub-tab e filtri (back browser)", async ({
  page,
}) => {
  await gotoArchivio(page);
  // L'URL ora contiene ?tab=archivio
  await expect(page).toHaveURL(/tab=archivio/);
  // Cambia sub-tab a Segnalazioni → URL contiene asTab=segnalazione
  await page
    .locator(".archivio-subtabs .archivio-tab", { hasText: "Segnalazioni" })
    .click();
  await expect(page).toHaveURL(/asTab=segnalazione/, { timeout: 5000 });
  // Digita query → URL contiene asQ=
  const searchInput = page.locator('.archivio-ff-search input[type="search"]');
  await searchInput.fill("freni");
  await expect(page).toHaveURL(/asQ=freni/, { timeout: 5000 });
});

test("18 — Anteprima PDF: click apre modale con preview", async ({
  page,
}) => {
  await gotoArchivio(page);
  // Allarga periodo per assicurare almeno qualche record
  await page.locator(".archivio-ff-period-trigger").click();
  await page
    .locator(".archivio-ff-period-presets button", {
      hasText: "Tutto lo storico",
    })
    .click();
  // Wait per almeno una riga lavori (default sub-tab)
  await expect(page.locator(".archivio-row").first()).toBeVisible({
    timeout: 15000,
  });
  // Click "Anteprima PDF"
  const pdfBtn = page.locator(".archivio-pdf-btn");
  await expect(pdfBtn).toBeVisible();
  await expect(pdfBtn).toBeEnabled();
  await pdfBtn.click();
  // Modale PDF deve aprirsi (selettore esistente da PdfPreviewModal)
  await expect(page.locator(".pdf-preview-backdrop")).toBeVisible({
    timeout: 20000,
  });
  // Verifica presenza viewer (object o iframe)
  const viewer = page.locator(
    ".pdf-preview-viewer-wrap object, .pdf-preview-viewer-wrap iframe",
  );
  await expect(viewer.first()).toBeVisible({ timeout: 10000 });
  // Verifica bottoni azione presenti (Condividi/Copia link/WhatsApp)
  await expect(page.getByRole("button", { name: "Condividi" })).toBeVisible();
  // Chiusura modale (selettore preciso: bottone "Chiudi" dentro .pdf-preview-head,
  // evita di matchare "Chiudi menu principale" nella sidebar)
  await page.locator(".pdf-preview-head button", { hasText: "Chiudi" }).click();
  await expect(page.locator(".pdf-preview-backdrop")).toHaveCount(0, {
    timeout: 5000,
  });
});

test("19 — Elimina da archivio: kebab → conferma → record sparisce + persiste a reload", async ({
  page,
}) => {
  // PROMPT 31.1: soft-hide del record (nascostoInArchivio=true). Il
  // record resta integro nelle altre viste, sparisce dall'archivio.
  await gotoArchivio(page);
  // Allarga periodo per avere record in Segnalazioni
  await page.locator(".archivio-ff-period-trigger").click();
  await page
    .locator(".archivio-ff-period-presets button", {
      hasText: "Tutto lo storico",
    })
    .click();
  await page
    .locator(".archivio-subtabs .archivio-tab", { hasText: "Segnalazioni" })
    .click();
  // wait su righe segnalazioni (type-chip presente solo qui)
  const segnRows = page.locator(".archivio-row:has(.archivio-row-type-chip)");
  await expect(segnRows.first()).toBeVisible({ timeout: 15000 });
  const countInitial: number = await segnRows.count();
  if (countInitial === 0) {
    test.skip(true, "Nessuna segnalazione disponibile per il test elimina");
    return;
  }

  // STEP 1: apri kebab → menu visibile
  const firstKebab = segnRows.first().locator(".archivio-kebab-btn");
  await firstKebab.click();
  await expect(page.locator(".archivio-kebab-menu")).toBeVisible({
    timeout: 3000,
  });

  // STEP 2: click "Elimina" → confirm modal visibile
  await page
    .locator(".archivio-kebab-menu .archivio-kebab-item", { hasText: "Elimina" })
    .click();
  await expect(page.locator(".archivio-confirm-overlay")).toBeVisible({
    timeout: 3000,
  });

  // STEP 3: click "Annulla" → modale chiude, record ancora visibile
  await page
    .locator(".archivio-confirm-btn", { hasText: "Annulla" })
    .click();
  await expect(page.locator(".archivio-confirm-overlay")).toHaveCount(0, {
    timeout: 3000,
  });
  await expect(segnRows).toHaveCount(countInitial);

  // STEP 4: ri-apri kebab → Elimina → CONFERMA Elimina
  await firstKebab.click();
  await expect(page.locator(".archivio-kebab-menu")).toBeVisible({
    timeout: 3000,
  });
  await page
    .locator(".archivio-kebab-menu .archivio-kebab-item", { hasText: "Elimina" })
    .click();
  await expect(page.locator(".archivio-confirm-overlay")).toBeVisible({
    timeout: 3000,
  });
  await page
    .locator(".archivio-confirm-btn.is-danger", { hasText: /Elimina/i })
    .click();

  // STEP 5: attendi sparizione del modale + record diminuito di 1
  await expect(page.locator(".archivio-confirm-overlay")).toHaveCount(0, {
    timeout: 15000,
  });
  await expect(segnRows).toHaveCount(countInitial - 1, { timeout: 10000 });

  // STEP 6: reload pagina → record ancora nascosto (persistenza)
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("tab", { name: "Archivio storico" }).click();
  await expect(page.locator(".cc-archivio-scope-v1")).toBeVisible({
    timeout: 30000,
  });
  // attendi caricamento + apri "Tutto lo storico" + sub-tab Segnalazioni
  await page.waitForFunction(
    () => !document.querySelector(".cc-archivio-scope-v1 .archivio-loading"),
    null,
    { timeout: 30000 },
  );
  await page.locator(".archivio-ff-period-trigger").click();
  await page
    .locator(".archivio-ff-period-presets button", {
      hasText: "Tutto lo storico",
    })
    .click();
  await page
    .locator(".archivio-subtabs .archivio-tab", { hasText: "Segnalazioni" })
    .click();
  await expect(segnRows).toHaveCount(countInitial - 1, { timeout: 15000 });
});

test("12 — page-tabbar persiste cambiando sub-tab archivio", async ({
  page,
}) => {
  await gotoArchivio(page);
  await page
    .locator(".archivio-subtabs .archivio-tab", { hasText: "Segnalazioni" })
    .click();
  await expect(
    page.locator(".cc-page-tabs button.is-active", {
      hasText: "Archivio storico",
    }),
  ).toBeVisible();
  await page
    .locator(".archivio-subtabs .archivio-tab", { hasText: "Manutenzioni" })
    .click();
  await expect(
    page.locator(".cc-page-tabs button.is-active", {
      hasText: "Archivio storico",
    }),
  ).toBeVisible();
});
