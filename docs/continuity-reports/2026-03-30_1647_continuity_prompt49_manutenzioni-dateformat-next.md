# Continuity Report - Prompt 49

## Contesto chiuso
Il prompt 49 ha lavorato solo su:
- riallineamento `Manutenzioni` NEXT vs madre;
- uniformazione del formato data visibile in tutta la NEXT.

## Stato finale
- `Manutenzioni` -> `CHIUSO`
- formato data visibile NEXT `gg mm aaaa` -> `CHIUSO`

## Punti da ricordare
- Il parser date NEXT forte ora e `src/next/nextDateFormat.ts`.
- `src/next/domain/nextManutenzioniDomain.ts` e il punto di verita per lo storico manutenzioni globale NEXT.
- `src/next/NextManutenzioniPage.tsx` non deve tornare a leggere lo storico da snapshot globali di supporto.
- I picker nativi `type="date"` residui servono solo come calendar hidden-input; la data visibile resta sempre formattata dalla NEXT.

## File guida per il prossimo audit
- `docs/audit/BACKLOG_MANUTENZIONI_DATEFORMAT_EXECUTION.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `src/next/nextDateFormat.ts`
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/NextManutenzioniPage.tsx`

## Verifiche da ripetere se serve
- `eslint` sui file NEXT toccati dal prompt 49
- `npm run build`
- `rg -n --glob 'src/next/**' '01/03/2026|31/03/2026|gg/mm/aaaa|dd/mm|DD/MM|YYYY-MM-DD|yyyy-mm-dd|dd-mm-yyyy|gg-mm-aaaa'`
- controllo mirato dei `type="date"` residui per confermare che siano solo hidden picker

## Limite esplicito
Il prossimo audit puo verificare la parity `Manutenzioni` anche contro il dato live della sorgente remota solo se il contesto permette la lettura del documento `storage/@manutenzioni`; questo prompt chiude l'execution sul codice NEXT, non un audit live del backend dati.
