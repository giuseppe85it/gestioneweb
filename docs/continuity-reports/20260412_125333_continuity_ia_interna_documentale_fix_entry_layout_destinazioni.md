# Continuity Report - IA interna documentale fix entry, layout, destinazioni

## Stato raggiunto
- `/next/ia/interna` entra sempre sulla home documentale pulita;
- la review desktop e viewport-fit con page-scroll bloccato in review attiva e scroll interni nelle card;
- `Apri originale`, CTA destinazione e ritorno alla home documentale restano sempre visibili;
- `/next/ia/documenti` resta superficie secondaria/storico con filtri e CTA coerenti;
- le destinazioni finali reali sono:
  - magazzino -> `/next/magazzino?tab=inventario`
  - manutenzioni -> `/next/manutenzioni?targa=<targa>`
  - preventivi -> `/next/dossier/<targa>#preventivi`
  - da verificare -> `/next/ia/interna?reviewDocumentId=...`

## File chiave
- `src/next/NextInternalAiPage.tsx`
- `src/next/NextIADocumentiPage.tsx`
- `src/pages/IA/IADocumenti.tsx`
- `src/next/internal-ai/internal-ai.css`
- `src/next/nextStructuralPaths.ts`
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextDossierMezzoPage.tsx`

## Dettagli da ricordare
- l'entry state pulito dipende dalla rimozione dell'auto-open review persistita in `NextInternalAiPage.tsx`;
- la riapertura review usa query `reviewDocumentId` / `reviewSourceKey` e non uno stato implicito persistito;
- la chiusura review deve continuare a chiamare `resetCurrentDocument()` dal motore riusato;
- il target `Manutenzioni` funziona perche `NextManutenzioniPage.tsx` legge `?targa=` e preseleziona il mezzo;
- il target `Preventivi` funziona perche `NextDossierMezzoPage.tsx` legge `#preventivi` e scorre alla sezione dopo il load;
- il ramo `Da verificare` non ha un record live cliccabile nel dataset corrente, ma riusa la stessa riapertura review verificata con `Riapri review`.

## Verifiche gia fatte
- lint mirato TS/TSX `OK`
- CSS: warning noto per file ignorato dalla config ESLint del repo
- `npm run build` `OK`
- browser verificato davvero su:
  - `/next/ia/interna`
  - `/next/ia/documenti`
  - `/next/magazzino?tab=inventario`
  - `/next/manutenzioni?targa=TI324623`
  - `/next/dossier/TI313387#preventivi`

## Rischi residui
- nuovi upload live end-to-end sui rami finali ancora da ri-verificare con file reali correnti;
- assenza nel dataset corrente di una riga storica `Da verificare` cliccabile per test diretto del pulsante `Vai a`;
- warning build storici su chunk grandi e `jspdf` restano invariati e non dipendono da questa patch.
