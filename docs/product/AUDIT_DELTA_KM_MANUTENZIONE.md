Data: 2026-04-22
Perimetro letto: `src/next/*` + `docs/product/AUDIT_QUADRO_MANUTENZIONI_PDF.md`

## Esito

Esiste gia' una logica NEXT che calcola il delta tra km attuali del mezzo e km dell'intervento, ma oggi e' locale alla pagina `NextManutenzioniPage` e viene mostrata nel tab "Quadro manutenzioni PDF".

Formula reale trovata:
- `src/next/NextManutenzioniPage.tsx:345-348`
- `deltaKm = currentKm - interventoKm` se entrambi presenti e `currentKm >= interventoKm`

Render UI reale:
- `src/next/NextManutenzioniPage.tsx:351-358` prepara `Km attuali`, `Km intervento`, `Δ km`
- `src/next/NextManutenzioniPage.tsx:1908-1911` renderizza `Δ km`

Origine dei km attuali nella stessa pagina:
- `src/next/NextManutenzioniPage.tsx:542` legge `readNextRifornimentiReadOnlySnapshot()`
- `src/next/NextManutenzioniPage.tsx:551-567` costruisce `kmUltimoByTarga` prendendo il km piu' recente per targa dai rifornimenti
- `src/next/NextManutenzioniPage.tsx:730` espone `kmUltimoRifornimento`
- `src/next/NextManutenzioniPage.tsx:859-860` passa quel valore al calcolo delta

## Match trovati

1. Delta km manutenzione generica rispetto ai km attuali del mezzo
- File:riga: `src/next/NextManutenzioniPage.tsx:336-360`
- Funzione/variabile: `buildPdfMetricInfo()` / `deltaKm`
- Calcolo: `currentKm - interventoKm`
- Dove appare: card del tab PDF in `src/next/NextManutenzioniPage.tsx:1898-1912`

2. Delta km gia' presente ma solo per gomme
- File:riga: `src/next/domain/nextManutenzioniGommeDomain.ts:488-519`
- Funzione/variabile: `buildNextGommeStateByAsse()` / `kmPercorsi`
- Calcolo: `kmAttuali - kmCambio`
- Dove appare: `src/next/NextManutenzioniPage.tsx:1958-1965` e `src/next/NextDossierMezzoPage.tsx:109-123`

3. Delta km nel dettaglio mappa storico, ma specifico gomme
- File:riga: `src/next/NextMappaStoricoPage.tsx:188-203`
- Funzione/variabile: `kmPercorsiDalCambio`
- Calcolo: `mezzoInfo.kmAttuali - selectedMaintenance.km` se il record selezionato e' gomme; altrimenti fallback su `latestGommeKmCambio`
- Dove appare: `src/next/NextMappaStoricoPage.tsx:576-580`

## Non trovato

- Nessun helper centralizzato dedicato a una manutenzione generica tipo `getKmSinceManutenzione`.
- In `src/next/domain/nextManutenzioniDomain.ts` non e' stata trovata una logica generale di delta km per singola manutenzione mezzo.
- In `src/next/NextDossierMezzoPage.tsx` non e' stata trovata una UI che mostri il delta km per una manutenzione generica; mostra solo `km | ore` (`src/next/NextDossierMezzoPage.tsx:102-107`, `:523-547`).

## Sorgente piu' affidabile dei km attuali nel layer NEXT

Match piu' solido trovato:
- dataset: `@rifornimenti` con convergenza read-only del feed campo `@rifornimenti_autisti_tmp`
- domain: `src/next/domain/nextRifornimentiDomain.ts:7-8`, `:1291`
- conferma dossier: `src/next/domain/nextDossierMezzoDomain.ts:897-904`, `:628`

Conclusione operativa dell'audit:
- per il modale futuro esiste gia' una formula riusabile nel clone (`km attuali - km intervento`);
- il riuso diretto oggi esiste solo come logica locale in `NextManutenzioniPage`;
- l'unico helper gia' centralizzato e' quello gomme (`buildNextGommeStateByAsse`), non una manutenzione generica.
