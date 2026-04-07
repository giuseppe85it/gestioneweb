# Change Report - 2026-04-07 12:32

## Task
Implementazione di `Manutenzioni` NEXT come modulo scrivente sostitutivo, con vista interna `Mappa storico`.

## Perimetro
- solo file whitelisted del prompt
- nessuna modifica alla madre legacy
- nessuna route nuova

## Attivita svolte
- trasformata `src/next/NextManutenzioniPage.tsx` da pagina read-only a modulo operativo con:
  - dashboard
  - storico
  - form creazione/modifica
  - eliminazione
  - vista interna `Mappa storico`
- esteso `src/next/domain/nextManutenzioniDomain.ts` con writer business compatibili su:
  - `@manutenzioni`
  - `@inventario`
  - `@materialiconsegnati`
- creati i file dedicati alla nuova vista mappa:
  - `src/next/domain/nextMappaStoricoDomain.ts`
  - `src/next/mezziHotspotAreas.ts`
  - `src/next/NextMappaStoricoPage.tsx`
  - `src/next/next-mappa-storico.css`
- aggiornata la barriera clone in `src/utils/cloneWriteBarrier.ts` con deroga chirurgica solo per `/next/manutenzioni`
- aggiornati i tracker di stato e contesto

## Evidenze principali
- `@manutenzioni` viene scritto mantenendo la shape legacy reale verificata dall'audit.
- Gli effetti legacy su `@inventario` e `@materialiconsegnati` vengono replicati con la stessa prudenza del modulo madre, senza reinterpretazioni arbitrarie.
- La convergenza gomme non viene riscritta da zero: la pagina e la mappa riusano i domain NEXT gia verificati.
- `Km ultimo rifornimento` viene mostrato solo tramite `nextRifornimentiDomain.ts`.
- I nuovi dati visuali restano separati dai contratti business:
  - `@mezzi_foto_viste`
  - `@mezzi_hotspot_mapping`
  - `mezzi_foto/{targa}/{vista}_{timestamp}.{ext}`

## Verifiche eseguite
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextMappaStoricoDomain.ts src/next/mezziHotspotAreas.ts src/next/NextMappaStoricoPage.tsx src/utils/cloneWriteBarrier.ts` -> `OK`
- `npm run build` -> `OK`
- runtime reale su `http://127.0.0.1:4173/next/manutenzioni`:
  - apertura route senza errori
  - verifica che il modulo non sia piu read-only
  - creazione, modifica ed eliminazione reale di una manutenzione di test su mezzo `TI178456`, poi rimossa
  - convergenza gomme verificata sullo stesso mezzo (`gommeItems > 0`)
  - vista interna `Mappa storico` verificata con:
    - label `Km ultimo rifornimento`
    - upload foto vista
    - hotspot
    - dettaglio zona
    - ricerca
    - filtri/modali

## Limiti dichiarati
- Stato modulo mantenuto `PARZIALE` fino ad audit separato.
- Il test runtime foto ha ripristinato i metadati visuali ma puo lasciare un file binario di prova in Storage, perche questa patch non introduce un flusso delete foto.
