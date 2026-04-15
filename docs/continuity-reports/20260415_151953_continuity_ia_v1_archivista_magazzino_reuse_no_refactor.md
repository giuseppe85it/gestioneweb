# Continuity Report

- Timestamp: `2026-04-15 15:19:53`
- Task: `IA V1 Archivista - ramo Magazzino attivo`

## Punto di partenza
- Il repo aveva gia separato `IA Report` e `Archivista documenti`, ma `Archivista` era ancora una shell guidata senza analisi reale.
- L'unico motore documentale gia forte restava il ramo legacy dietro `estrazioneDocumenti`.
- La barrier permetteva quel `POST` solo da `/next/ia/interna`.

## Continuita garantita
- `IA Report` non viene toccata in profondita.
- `Archivista` resta non chat.
- Nessun writer business nuovo viene aperto.
- Magazzino non viene rifatto: viene riusata la stessa analisi documentale gia attiva nel progetto.

## Nuovo stato verificato
- `/next/ia/archivista` attiva davvero solo `Fattura / DDT + Magazzino`.
- La review resta interna ad Archivista e non espone la vecchia UI ibrida.
- Gli altri rami V1 restano visibili ma fermi.
- L'eccezione barrier resta stretta al solo `POST` verso `estrazioneDocumenti`, ora valida anche per `/next/ia/archivista`.

## File chiave da riaprire nel prossimo step
- `src/next/NextIAArchivistaPage.tsx`
- `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx`
- `src/next/internal-ai/internal-ai.css`
- `src/utils/cloneWriteBarrier.ts`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`

## Cosa resta fuori
- `Fattura / DDT + Manutenzione`
- `Documento mezzo`
- `Preventivo + Magazzino`
- qualunque salvataggio business o archiviazione finale guidata
- qualunque modifica a backend, functions, api, rules o Magazzino profondo

## Verifiche eseguite
- `npx eslint src/next/NextIAArchivistaPage.tsx src/next/internal-ai/ArchivistaMagazzinoBridge.tsx src/utils/cloneWriteBarrier.ts` -> `OK`
- `npm run build` -> `OK`
