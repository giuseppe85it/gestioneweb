# Change Report

## Timestamp
- `2026-04-22 12:17:06`

## Obiettivo
- Distinguere in modo esplicito i record Archivista `Preventivo -> Magazzino` e `Preventivo -> Manutenzione` dentro `storage/@preventivi`, senza cambiare destinazione, UI o logica di cattura campi.

## File toccati
- `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx`
- `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx`
- `src/next/internal-ai/ArchivistaArchiveClient.ts`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `CONTEXT_CLAUDE.md`
- mirror corrispondenti in `docs/fonti-pronte/*`

## Modifiche reali
- `ArchivistaPreventivoManutenzioneBridge.tsx`:
  - usa ora family `preventivo_manutenzione`
  - passa `ambitoPreventivo: "manutenzione"`
  - limita il duplicate check a `preventivo_manutenzione`
- `ArchivistaPreventivoMagazzinoBridge.tsx`:
  - mantiene family `preventivo_magazzino`
  - passa `ambitoPreventivo: "magazzino"`
- `ArchivistaArchiveClient.ts`:
  - accetta `preventivo_manutenzione` come family valida
  - persiste `ambitoPreventivo` nel record archivista su `storage/@preventivi`
  - considera entrambe le family preventivo come upload sotto `preventivi/`
  - filtra i duplicate candidate per family reale del record

## Family usate
- `Preventivo -> Magazzino` -> `preventivo_magazzino`
- `Preventivo -> Manutenzione` -> `preventivo_manutenzione`

## Ambito preventivo
- `ArchivistaPreventivoMagazzinoBridge.tsx` -> `ambitoPreventivo: "magazzino"`
- `ArchivistaPreventivoManutenzioneBridge.tsx` -> `ambitoPreventivo: "manutenzione"`
- `ArchivistaArchiveClient.ts` persiste il campo nel record finale su `storage/@preventivi`

## Consumer NEXT verificati
- scansione passiva eseguita su `src/next/*` per `preventivo_magazzino`, `preventivo_manutenzione`, `famigliaArchivista`, `ambitoPreventivo`
- nei consumer NEXT letti nel task non risultano filtri hard-coded su `preventivo_magazzino` che escluderebbero i nuovi record `preventivo_manutenzione`

## Verifiche tecniche
- `npx eslint src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx src/next/internal-ai/ArchivistaArchiveClient.ts` -> `OK`
- `npm run build` -> `OK`
- `npm run lint` -> `KO` per errori globali preesistenti fuori dal perimetro patch

## Stato onesto
- Patch runtime: `COMPLETATA`
- Verifica browser dei due rami preventivo in Archivista: `DA VERIFICARE`

## Rischi residui
- eventuali record storici `Preventivo -> Manutenzione` gia archiviati prima di questa patch con family `preventivo_magazzino` restano invariati e non vengono migrati
- il dataset reale con preventivi dei due rami resta da verificare in browser e su `storage/@preventivi`
