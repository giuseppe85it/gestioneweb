# Change Report - Prompt 46 - Chiusura `Home` e `Libretti Export`

- Data: 2026-03-30 14:08
- Prompt: 46
- Obiettivo: chiudere solo gli ultimi 2 moduli ancora `APERTO` nel perimetro target NEXT: `Home` e `Libretti Export`.

## File toccati
- `src/next/NextHomePage.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/components/NextHomeAutistiEventoModal.tsx`
- `src/next/NextLibrettiExportPage.tsx`
- `src/next/domain/nextLibrettiExportDomain.ts`
- `docs/audit/BACKLOG_ULTIMI_2_APERTI_EXECUTION.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Cambiamenti principali
- `Home`:
  - tolto `NextLegacyStorageBoundary` dalla route ufficiale `/next`;
  - la pagina continua a leggere da `D10`/`D03` e dagli overlay clone-local gia riassorbiti dal domain;
  - introdotta una modale eventi NEXT clone-safe che mantiene dettaglio, PDF, foto e collegamento ai lavori clone senza usare `storageSync`.
- `Libretti Export`:
  - riallineata la UI alla madre con header, gruppi per categoria e card selezionabili;
  - mantenute anteprima PDF, condivisione, copia link e WhatsApp sul flusso NEXT;
  - aggiornato il domain per dichiarare limiti veri del clone, senza segnare come bloccate azioni che la pagina supporta davvero.
- Documentazione:
  - creato il backlog persistente dei 2 moduli aperti;
  - aggiornati stato migrazione, matrice esecutiva e registro clone.

## Verifiche eseguite
- `npx eslint src/next/NextHomePage.tsx src/next/NextCentroControlloPage.tsx src/next/components/NextHomeAutistiEventoModal.tsx src/next/NextLibrettiExportPage.tsx src/next/domain/nextLibrettiExportDomain.ts` -> OK
- `npm run build` -> OK
- `rg -n "NextLegacyStorageBoundary|NextClonePageScaffold|AutistiEventoModal" src/next/NextHomePage.tsx src/next/NextCentroControlloPage.tsx src/next/components/NextHomeAutistiEventoModal.tsx src/next/NextLibrettiExportPage.tsx` -> `Home` non passa piu dal boundary legacy della route e `Libretti Export` non usa piu la workbench tabellare/scaffold.

## Esito
- `Home` -> `CHIUSO`
- `Libretti Export` -> `CHIUSO`
- Nessuna auto-certificazione finale dell'autonomia NEXT in questo report.
