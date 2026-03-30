# Report Finale Prompt 39 - Chiusura Ultimi 8 Moduli NEXT

Data: 2026-03-29  
Prompt: 39  
Modalita: OPERAIO  
Stato: CHIUSURA VERIFICATA

## Scopo
Svuotare il backlog residuo del clone/NEXT sui moduli ancora aperti, eliminando i wrapper finali della madre e confermando la chiusura solo dove la route ufficiale non monta piu il runtime legacy come soluzione finale.

## Regola di verifica usata
Un modulo e considerato chiuso solo se:
- la route NEXT non monta piu `NextMotherPage` o pagine madre come runtime finale;
- la UI esterna resta equivalente alla madre nel perimetro operativo reale del modulo;
- flussi, modali e report/PDF principali risultano presenti dove previsti;
- sotto il modulo usa domain NEXT puliti o bridge clone-safe espliciti;
- non restano accessi legacy critici nel runtime finale.

## Verdetto modulo per modulo

| Modulo | Route NEXT monta ancora la madre? | UI equivalente | Flussi principali equivalenti | Modali principali equivalenti | Report/PDF principali equivalenti | Layer NEXT / bridge clone-safe sotto | Accessi legacy critici nel runtime finale | Verdetto |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Acquisti / Preventivi / Listino` | NO | SI | SI | SI | SI | SI | NO | `CHIUSO` |
| `IA Libretto` | NO | SI | SI | SI | N/A | SI | NO | `CHIUSO` |
| `IA Documenti` | NO | SI | SI | SI | SI | SI | NO | `CHIUSO` |
| `IA Copertura Libretti` | NO | SI | SI | SI | N/A | SI | NO | `CHIUSO` |
| `Cisterna` | NO | SI | SI | SI | SI | SI | NO | `CHIUSO` |
| `Cisterna IA` | NO | SI | SI | SI | N/A | SI | NO | `CHIUSO` |
| `Cisterna Schede Test` | NO | SI | SI | SI | N/A | SI | NO | `CHIUSO` |
| `Autisti / Inbox` | NO | SI | SI | SI | SI | SI | NO | `CHIUSO` |

## Dettaglio chiusure

### `Acquisti / Preventivi / Listino`
- Route ufficiali coinvolte:
  - `src/next/NextAcquistiPage.tsx`
  - `src/next/NextProcurementStandalonePage.tsx`
  - `src/next/NextProcurementReadOnlyPanel.tsx`
- Sorgente dati:
  - `src/next/domain/nextProcurementDomain.ts`
  - dataset `@ordini`, `@preventivi`, `@preventivi_approvazioni`, `@listino_prezzi`
- Chiusura verificata:
  - tabelle ordini, preventivi e listino lette dal domain `D06`;
  - nessun mount finale di `src/pages/Acquisti.tsx`.

### `IA Libretto`
- Route ufficiale: `src/next/NextIALibrettoPage.tsx`
- Sorgente dati:
  - `src/next/internal-ai/internalAiLibrettoPreviewFacade.ts`
  - `src/next/nextAnagraficheFlottaDomain.ts`
- Chiusura verificata:
  - ricerca per targa;
  - preview file / libretto;
  - nessun mount finale di `src/pages/IA/IALibretto.tsx`.

### `IA Documenti`
- Route ufficiale: `src/next/NextIADocumentiPage.tsx`
- Sorgente dati:
  - `src/next/domain/nextDocumentiCostiDomain.ts`
  - `src/next/internal-ai/internalAiDocumentsPreviewFacade.ts`
- Chiusura verificata:
  - archivio documenti madre-like;
  - selezione documento;
  - anteprima file/PDF clone-safe;
  - nessun mount finale di `src/pages/IA/IADocumenti.tsx`.

### `IA Copertura Libretti`
- Route ufficiale: `src/next/NextIACoperturaLibrettiPage.tsx`
- Sorgente dati:
  - `src/next/nextAnagraficheFlottaDomain.ts`
- Chiusura verificata:
  - tabella copertura;
  - filtri `ALL`, `MISSING_LIBRETTO`, `MISSING_FOTO`, `MISSING_BOTH`;
  - nessun mount finale di `src/pages/IA/IACoperturaLibretti.tsx`.

### `Cisterna`
- Route ufficiale: `src/next/NextCisternaPage.tsx`
- Sorgente dati:
  - `src/next/domain/nextCisternaDomain.ts`
- Chiusura verificata:
  - archivio;
  - report mensile;
  - ripartizione per targa;
  - export PDF clone-safe;
  - nessun mount finale di `src/pages/CisternaCaravate/CisternaCaravatePage.tsx`.

### `Cisterna IA`
- Route ufficiale: `src/next/NextCisternaIAPage.tsx`
- Sorgente dati:
  - `src/next/domain/nextCisternaDomain.ts`
  - handoff IA interno clone-safe
- Chiusura verificata:
  - preview IA verticale cisterna su dati gia normalizzati;
  - nessun mount finale di `src/pages/CisternaCaravate/CisternaCaravateIA.tsx`.

### `Cisterna Schede Test`
- Route ufficiale: `src/next/NextCisternaSchedeTestPage.tsx`
- Sorgente dati:
  - `src/next/domain/nextCisternaDomain.ts`
- Chiusura verificata:
  - lista schede;
  - filtri / stato revisione;
  - nessun mount finale di `src/pages/CisternaCaravate/CisternaSchedeTest.tsx`.

### `Autisti / Inbox`
- Route ufficiali coinvolte:
  - `src/next/NextAutistiLoginPage.tsx`
  - `src/next/NextAutistiHomePage.tsx`
  - `src/next/NextAutistiSetupMezzoPage.tsx`
  - `src/next/NextAutistiInboxHomePage.tsx`
  - `src/next/NextAutistiInboxCambioMezzoPage.tsx`
  - `src/next/NextAutistiInboxControlliPage.tsx`
  - `src/next/NextAutistiInboxGommePage.tsx`
  - `src/next/NextAutistiInboxLogAccessiPage.tsx`
  - `src/next/NextAutistiInboxRichiestaAttrezzaturePage.tsx`
  - `src/next/NextAutistiInboxSegnalazioniPage.tsx`
  - `src/next/NextAutistiAdminPage.tsx`
- Sorgente dati:
  - `src/next/domain/nextAutistiDomain.ts`
  - `src/next/NextLegacyStorageBoundary.tsx`
  - `src/next/autistiInbox/nextAutistiAdminBridges.ts`
  - copie NEXT native in `src/next/autisti/*` e `src/next/autistiInbox/*`
- Chiusura verificata:
  - nessuna route ufficiale monta piu `src/autisti/**` o `src/autistiInbox/**` come pagina finale;
  - le azioni clone-only restano non distruttive;
  - il bridge admin neutralizza save/delete reali mantenendo il comportamento esterno della madre.

## Controllo finale dipendenze
- controllo route ufficiali: nessun import di `NextMotherPage` nei file finali dei moduli target;
- controllo mount madre: nessuna route ufficiale dei moduli target importa piu pagine legacy `src/pages/**`, `src/autisti/**`, `src/autistiInbox/**` come runtime finale;
- riusi residui ammessi: CSS condivisi e alcuni helper/componenti locali non critici in area autisti, senza riaprire mount di pagine legacy o accessi raw sostanziali.

## Fuori perimetro confermato
- `Targa 360 / Mezzo360`
- `Autista 360`

## Verifiche eseguite
- `npx eslint src/next/domain/nextProcurementDomain.ts src/next/NextProcurementReadOnlyPanel.tsx src/next/NextProcurementStandalonePage.tsx src/next/NextAcquistiPage.tsx src/next/NextIALibrettoPage.tsx src/next/NextIADocumentiPage.tsx src/next/NextIACoperturaLibrettiPage.tsx src/next/domain/nextCisternaDomain.ts src/next/NextCisternaPage.tsx src/next/NextCisternaIAPage.tsx src/next/NextCisternaSchedeTestPage.tsx src/next/autisti/NextLoginAutistaNative.tsx src/next/autisti/NextHomeAutistaNative.tsx src/next/autisti/NextSetupMezzoNative.tsx src/next/autistiInbox/NextAutistiInboxHomeNative.tsx src/next/autistiInbox/NextCambioMezzoInboxNative.tsx src/next/autistiInbox/NextAutistiControlliAllNative.tsx src/next/autistiInbox/NextAutistiGommeAllNative.tsx src/next/autistiInbox/NextAutistiLogAccessiAllNative.tsx src/next/autistiInbox/NextRichiestaAttrezzatureAllNative.tsx src/next/autistiInbox/NextAutistiSegnalazioniAllNative.tsx src/next/autistiInbox/nextAutistiAdminBridges.ts src/next/autistiInbox/NextAutistiAdminNative.tsx src/next/NextAutistiLoginPage.tsx src/next/NextAutistiHomePage.tsx src/next/NextAutistiSetupMezzoPage.tsx src/next/NextAutistiInboxHomePage.tsx src/next/NextAutistiInboxCambioMezzoPage.tsx src/next/NextAutistiInboxControlliPage.tsx src/next/NextAutistiInboxGommePage.tsx src/next/NextAutistiInboxLogAccessiPage.tsx src/next/NextAutistiInboxRichiestaAttrezzaturePage.tsx src/next/NextAutistiInboxSegnalazioniPage.tsx src/next/NextAutistiAdminPage.tsx` -> OK
- `npm run build` -> OK

## Verdetto finale del run
- gli ultimi 8 moduli residui risultano chiusi nel perimetro target del clone/NEXT;
- non restano wrapper finali della madre sulle route ufficiali dei moduli target;
- `Targa 360 / Mezzo360` e `Autista 360` restano esplicitamente fuori perimetro.
