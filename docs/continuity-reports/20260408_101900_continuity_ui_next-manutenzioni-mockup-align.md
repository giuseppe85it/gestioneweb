# Continuity Report - 2026-04-08 10:19:00

## Stato
PARZIALE

## Obiettivo chiuso in questo task
Riallineare la UI di `/next/manutenzioni` al mockup React allegato dall'utente, senza toccare business, reader/writer, hotspot logic o `pdfEngine`.

## Verifiche richieste
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx`
- `npm run build`

## Punti runtime da ricontrollare
- tab finali: `Dashboard`, `Nuova / Modifica`, `Dettaglio`, `Quadro manutenzioni PDF`
- dashboard con shell scura, card rapide, bottoni rapidi e ultimi interventi
- form grande con tagliando condizionale
- dettaglio embedded a 2 card
- quadro PDF con righe larghe, foto, `PDF`, `Apri dettaglio`

## Vincoli rimasti invariati
- nessuna modifica a domain, writer o shape Firestore
- nessuna modifica a `src/pages/Manutenzioni.css`
- nessuna modifica a upload foto, hotspot o `pdfEngine`
