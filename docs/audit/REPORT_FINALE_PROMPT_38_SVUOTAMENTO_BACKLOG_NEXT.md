# Report Finale Prompt 38 - Svuotamento Backlog Residuo NEXT

Data: 2026-03-29  
Prompt: 38  
Modalita: OPERAIO  
Stato: CHIUSURA PARZIALE VERIFICATA

## Scopo
Chiudere il backlog residuo del clone/NEXT eliminando, dove possibile nello stesso run, i wrapper finali della madre sui moduli ancora aperti.

## Regola di verifica usata
Un modulo e considerato chiuso solo se:
- la route NEXT non monta piu il runtime madre;
- la UI esterna e equivalente alla madre sul perimetro verificato;
- i flussi principali risultano replicati;
- modali e report/PDF principali sono presenti se usati dal modulo;
- sotto il modulo usa layer NEXT puliti o overlay clone-only espliciti;
- non restano accessi legacy critici nel runtime finale della route ufficiale.

## Chiusure reali del run

| Modulo | Runtime madre ancora montato? | UI equivalente | Flussi principali equivalenti | Modali principali equivalenti | Report/PDF principali equivalenti | Layer NEXT puliti sotto | Accessi legacy critici nel runtime finale | Verdetto |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Dossier Mezzo` | NO | SI | SI | SI | SI | SI | NO | `CHIUSO` |
| `Analisi Economica` | NO | SI | SI | SI | SI | SI | NO | `CHIUSO` |
| `Materiali da ordinare` | NO | SI | SI | SI | N/A | SI | NO | `CHIUSO` |

## Dettaglio chiusure

### `Dossier Mezzo`
- Route ufficiale: `src/next/NextDossierMezzoPage.tsx`
- Sorgente dati: `readNextDossierMezzoCompositeSnapshot()`
- Copertura replicata:
  - dati tecnici;
  - foto e modal foto;
  - lavori in attesa / eseguiti;
  - manutenzioni;
  - materiali;
  - rifornimenti;
  - preventivi / fatture;
  - modal libretto;
  - anteprima PDF dossier;
  - anteprima PDF documento.
- Layer clone-only aggiunti:
  - `nextDossierCloneState.ts` per nascondere localmente documenti e sovrascrivere l'analisi IA senza scrivere sulla madre.

### `Analisi Economica`
- Route ufficiale: `src/next/NextAnalisiEconomicaPage.tsx`
- Sorgente dati: `readNextDossierMezzoCompositeSnapshot()` + `buildNextAnalisiEconomicaLegacyView()`
- Copertura replicata:
  - riepilogo costi;
  - fornitori;
  - documenti recenti;
  - sezione gomme;
  - sezione rifornimenti;
  - blocco analisi IA;
  - anteprima PDF analisi economica.
- Layer clone-only aggiunti:
  - rigenerazione analisi IA salvata solo in `nextDossierCloneState.ts`.

### `Materiali da ordinare`
- Route ufficiale: `src/next/NextMaterialiDaOrdinarePage.tsx`
- Sorgente dati:
  - `readNextFornitoriSnapshot()` per i fornitori;
  - `nextProcurementCloneState.ts` per gli ordini clone-only confermati;
  - `readNextProcurementSnapshot()` tramite overlay nel domain `D06`.
- Copertura replicata:
  - header;
  - tab;
  - form nuovo fabbisogno;
  - foto locale / immagine automatica;
  - tabella materiali;
  - modali placeholder `Prezzi / Allegati / Note`;
  - sticky action bar;
  - conferma ordine clone-only;
  - navigazione verso viste NEXT ordini/arrivi.

## Moduli residui ancora aperti

| Modulo | Stato iniziale | Stato finale | Runtime madre ancora montato? | Motivo reale apertura | Dipendenza legacy ancora presente |
| --- | --- | --- | --- | --- | --- |
| `Acquisti / Preventivi / Listino` | `APERTO` | `APERTO` | NO | la superficie ufficiale e gia NEXT ma non replica ancora tutto il workflow madre su preventivi, listino, approvazioni e PDF operativi | `src/next/NextProcurementStandalonePage.tsx`, `src/next/NextProcurementReadOnlyPanel.tsx`, copertura madre completa in `src/pages/Acquisti.tsx` |
| `IA Libretto` | `APERTO` | `APERTO` | SI | la route ufficiale resta wrapper della madre | `src/next/NextIALibrettoPage.tsx` -> `src/pages/IA/IALibretto.tsx` |
| `IA Documenti` | `APERTO` | `APERTO` | SI | la route ufficiale resta wrapper della madre | `src/next/NextIADocumentiPage.tsx` -> `src/pages/IA/IADocumenti.tsx` |
| `IA Copertura Libretti` | `APERTO` | `APERTO` | SI | la route ufficiale resta wrapper della madre | `src/next/NextIACoperturaLibrettiPage.tsx` -> `src/pages/IA/IACoperturaLibretti.tsx` |
| `Cisterna` | `APERTO` | `APERTO` | SI | la route ufficiale resta wrapper della madre | `src/next/NextCisternaPage.tsx` -> `src/pages/CisternaCaravate/CisternaCaravatePage.tsx` |
| `Cisterna IA` | `APERTO` | `APERTO` | SI | la route ufficiale monta ancora il runtime legacy specialistico | `src/next/NextCisternaIAPage.tsx` -> `src/pages/CisternaCaravate/CisternaCaravateIA.tsx` |
| `Cisterna Schede Test` | `APERTO` | `APERTO` | SI | la route ufficiale resta wrapper della madre | `src/next/NextCisternaSchedeTestPage.tsx` -> `src/pages/CisternaCaravate/CisternaSchedeTest.tsx` |
| `Autisti / Inbox` | `APERTO` | `APERTO` | SI | molte route ufficiali NEXT montano ancora moduli legacy campo/inbox | `src/next/NextAutisti*Page.tsx`, `src/next/NextAutistiInbox*Page.tsx` -> `src/autisti/**`, `src/autistiInbox/**` |

## Verifiche eseguite
- `npx eslint src/next/NextDossierMezzoPage.tsx src/next/NextAnalisiEconomicaPage.tsx src/next/nextDossierCloneState.ts` -> OK
- `npx eslint src/next/NextMaterialiDaOrdinarePage.tsx src/next/nextProcurementCloneState.ts src/next/domain/nextProcurementDomain.ts` -> OK
- `npm run build` -> OK
- warning invariati:
  - `baseline-browser-mapping` datato;
  - chunk Vite grandi;
  - doppio import dinamico/statico di `jspdf`.

## Verdetto finale del run
- backlog residuo NON svuotato completamente;
- chiusure reali e dimostrate nel run: `Dossier Mezzo`, `Analisi Economica`, `Materiali da ordinare`;
- nessun blocco `SERVE FILE EXTRA` dimostrato: i residui rimasti aperti risultano ancora lavorabili nella whitelist, ma non sono stati chiusi in questo run.
