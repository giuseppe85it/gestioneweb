# Change Report

## Timestamp
- `2026-04-22 11:33:49`

## Obiettivo
- Attivare in Archivista il ramo `Preventivo -> Manutenzione` con UI coerente al bridge manutenzione ma con pipeline dati sempre e solo su `storage/@preventivi`.

## File toccati
- `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx`
- `src/next/internal-ai/ArchivistaArchiveClient.ts`
- `src/next/NextIAArchivistaPage.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `CONTEXT_CLAUDE.md`
- mirror corrispondenti in `docs/fonti-pronte/*`

## Modifiche reali
- creato `ArchivistaPreventivoManutenzioneBridge.tsx` con UI step-based coerente al bridge `Fattura / DDT + Manutenzione`;
- il nuovo bridge usa:
  - endpoint `documents/preventivo-magazzino-analyze`
  - duplicate check su `@preventivi`
  - family `preventivo_magazzino`
  - writer `archiveArchivistaPreventivoRecord(...)`
- `NextIAArchivistaPage.tsx` attiva il ramo `preventivo -> manutenzione` nel dispatcher e lo monta come bridge reale;
- `ArchivistaArchiveClient.ts` estende in modo additivo il payload preventivo con `metadatiMezzo`.

## Strategia targa/km
- `Opzione B`
- `targa` e `km` vengono salvati nel record preventivo dentro `metadatiMezzo: { targa, km }`, senza alterare la shape canonica esistente del preventivo oltre a questo blocco additivo.

## Family usata
- `preventivo_magazzino`

## Verifiche tecniche
- `npx eslint src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx src/next/internal-ai/ArchivistaArchiveClient.ts src/next/NextIAArchivistaPage.tsx` -> `OK`
- `npm run build` -> `OK`
- `npm run lint` -> `KO` per errori globali preesistenti fuori dal perimetro patch

## Stato onesto
- Patch runtime: `COMPLETATA`
- Verifica browser del nuovo ramo Archivista: `DA VERIFICARE`

## Rischi residui
- il nuovo bridge non e stato ancora verificato live su `/next/ia/archivista`;
- il record finale in `storage/@preventivi` con `metadatiMezzo` resta da controllare su dataset reale;
- il lint di progetto resta rosso per problemi storici non introdotti da questa patch.
