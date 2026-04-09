# Change Report - 2026-04-08 22:15

## Obiettivo
- Eliminare il doppione tra `Ultimo intervento mezzo` e `Ultime manutenzioni mezzo`.
- Rendere `Calibra` una vera modalita di spostamento marker con persistenza clone-side nel viewer tecnico di `Manutenzioni`.

## File toccati
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextMappaStoricoPage.tsx`
- `src/next/domain/nextMappaStoricoDomain.ts`
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/next/next-mappa-storico.css`
- documentazione di stato clone/NEXT

## Modifiche applicate
- Deduplicata la lista `Ultime manutenzioni mezzo` nel parent `NextManutenzioniPage`, filtrando il record gia mostrato nel box `Ultimo intervento mezzo`.
- Introdotto in `nextMappaStoricoDomain` un layer clone-side per override tecnici:
  - lettura override per `categoriaKey + vista`
  - salvataggio override per `categoriaKey + vista + targetId + x + y`
- Esportato in `nextManutenzioniGommeDomain` l'helper per risolvere la chiave tecnica categoria usata dal viewer.
- In `NextMappaStoricoPage`:
  - palette target calibrabili selezionabile;
  - click sul disegno per posizionare un target;
  - drag di marker gia salvati;
  - salvataggio al rilascio;
  - rilettura override persistiti e reuse nel viewer tecnico.

## Persistenza override
- Tipo persistenza: clone-side locale
- Domain: `src/next/domain/nextMappaStoricoDomain.ts`
- Chiave: dataset visuale separato da hotspot/foto business
- Ambito: `categoria mezzo + vista + target`

## Verifiche eseguite
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx src/next/domain/nextMappaStoricoDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts src/next/mezziHotspotAreas.ts` -> OK
- `npm run build` -> OK

## Rischi residui
- Gli override sono clone-side e non ancora sincronizzati con backend/business.
- In vista normale il viewer continua a privilegiare il dato reale della manutenzione aperta; i marker calibrati sono usati soprattutto nel ramo `Calibra`.
