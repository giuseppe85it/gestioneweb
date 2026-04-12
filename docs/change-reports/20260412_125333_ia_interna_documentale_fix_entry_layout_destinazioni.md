# Change Report - IA interna documentale fix entry, layout, destinazioni

- Timestamp: `2026-04-12 12:53:33`
- Ambito: follow-up chirurgico del solo perimetro autorizzato IA interna documentale / route target correlate
- Rischio: `ELEVATO`

## Obiettivo
- far aprire `/next/ia/interna` sempre sulla home documentale pulita;
- rendere la review desktop viewport-fit senza page-scroll principale;
- riallineare `Vai a` alle destinazioni business reali:
  - magazzino -> inventario
  - manutenzioni -> targa corretta
  - preventivi -> dossier sulla sezione preventivi
  - da verificare -> review documento

## File runtime toccati
- `src/next/NextInternalAiPage.tsx`
- `src/next/NextIADocumentiPage.tsx`
- `src/pages/IA/IADocumenti.tsx`
- `src/next/internal-ai/internal-ai.css`
- `src/next/nextStructuralPaths.ts`
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextDossierMezzoPage.tsx`

## Modifiche applicate
- rimosso l'auto-open della review persistita all'ingresso di `/next/ia/interna`;
- aggiunta chiusura review che resetta davvero il motore documentale e torna alla home pulita;
- aggiunta riapertura review esplicita via query `reviewDocumentId` / `reviewSourceKey`;
- corretta la mappa destinazioni in `NextInternalAiPage.tsx` e `NextIADocumentiPage.tsx`:
  - `buildNextMagazzinoPath("inventario")`
  - `buildNextManutenzioniPath(targa)`
  - `buildNextDossierPreventiviPath(targa)`
  - review documento via `/next/ia/interna?reviewDocumentId=...`
- aggiunto `resetCurrentDocument()` nel motore riusato `useIADocumentiEngine()`;
- resa la review desktop viewport-fit con:
  - blocco page-scroll desktop quando la review e attiva;
  - colonne/card con scroll interni;
  - footer CTA fissi e sempre visibili;
- aggiunto supporto minimo ai target:
  - `NextManutenzioniPage.tsx` legge `?targa=...` e preseleziona il mezzo corretto;
  - `NextDossierMezzoPage.tsx` legge `#preventivi` e scorre alla sezione dedicata.

## Verifiche eseguite
- `npx eslint src/next/NextInternalAiPage.tsx src/next/NextIADocumentiPage.tsx src/pages/IA/IADocumenti.tsx src/next/NextManutenzioniPage.tsx src/next/NextDossierMezzoPage.tsx src/next/nextStructuralPaths.ts` -> `OK`
- `npx eslint src/next/internal-ai/internal-ai.css` -> warning noto: file ignorato dalla config ESLint del repo
- `npm run build` -> `OK`
- runtime browser verificato davvero su:
  - `/next/ia/interna`
  - `/next/ia/documenti`
  - `/next/magazzino?tab=inventario`
  - `/next/manutenzioni?targa=TI324623`
  - `/next/dossier/TI313387#preventivi`

## Evidenza runtime reale
- `/next/ia/interna` apre la home documentale pulita, senza review persistita aperta;
- `Riapri review` da `/next/ia/documenti` torna su `/next/ia/interna` con review attiva;
- la review desktop mostra CTA sempre visibili e scroll interni nelle card;
- `Apri originale` apre davvero il file originale in tab separata;
- `Vai a Inventario` porta a `/next/magazzino?tab=inventario`;
- `Vai a Manutenzioni` porta a `/next/manutenzioni?targa=TI324623` con mezzo preselezionato;
- `Vai al preventivo` porta a `/next/dossier/TI313387#preventivi` e aggancia la sezione `Preventivi`;
- il dataset corrente non espone un record storico live `Da verificare` cliccabile; il ramo reale usa la stessa riapertura review via query gia verificata con `Riapri review`.

## Impatto e limiti
- nessun motore documentale riscritto o duplicato;
- nessun writer nuovo aperto;
- nessun deep-link inventato fuori dal codice reale del repo;
- restano `DA VERIFICARE` nuovi upload live end-to-end sui rami finali con nuovi file del dataset corrente.
