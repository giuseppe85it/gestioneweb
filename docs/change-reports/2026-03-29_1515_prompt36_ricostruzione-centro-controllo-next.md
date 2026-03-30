# Change Report - 2026-03-29 1515 - Prompt 36 ricostruzione Centro di Controllo NEXT

## Obiettivo
Sostituire il wrapper madre del `Centro di Controllo` con una pagina NEXT vera, fedele alla madre lato UI e comportamento ma letta solo tramite layer puliti del clone.

## File toccati
- `src/next/NextCentroControlloParityPage.tsx`
- `src/next/domain/nextAutistiDomain.ts`
- `src/next/domain/nextRifornimentiDomain.ts`
- `src/App.tsx`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/audit/REPORT_FINALE_PROMPT_36_RICOSTRUZIONE_RESIDUI.md`
- `docs/change-reports/2026-03-29_1515_prompt36_ricostruzione-centro-controllo-next.md`
- `docs/continuity-reports/2026-03-29_1515_continuity_prompt36_ricostruzione-centro-controllo-next.md`

## Sintesi tecnica
- Creata `NextCentroControlloParityPage` partendo dalla logica reale della madre ma senza montare la pagina legacy come runtime finale.
- La route ufficiale `/next/centro-controllo` ora punta a questa pagina clone vera.
- `nextAutistiDomain.ts` espone adesso righe tabellari dedicate per segnalazioni, controlli e richieste.
- `nextRifornimentiDomain.ts` espone ora uno snapshot globale read-only dei rifornimenti, cosi il report mensile non legge piu `getDoc()` diretto dalla pagina.

## Verifiche
- `npx eslint src/next/NextCentroControlloParityPage.tsx src/next/domain/nextAutistiDomain.ts src/next/domain/nextRifornimentiDomain.ts src/App.tsx` -> OK
- `npm run build` -> OK

## Impatto
- Chiude davvero `Centro di Controllo`.
- Elimina il wrapper ufficiale della madre da questa route.
- Non tocca la madre e non riapre scritture business.

## Rischi residui
- `Home` e il resto del backlog residuo continuano a montare runtime legacy su altre route ufficiali.
- `NextCentroControlloClonePage` resta nel repo come residuo non ufficiale e va rimosso o archiviato in un passaggio dedicato quando non serve piu come riferimento.
