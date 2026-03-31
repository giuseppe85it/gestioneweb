# AUDIT centro-di-controllo LOOP

- modulo: `Centro di Controllo`
- route: `/next/centro-controllo`
- ciclo loop: `1/2`
- stato iniziale: `NOT_STARTED`
- esito audit finale del ciclo: `PASS`
- stato finale del modulo nel tracker: `CLOSED`

## Fonti lette
- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`
- `docs/audit/AUDIT_GENERALE_TOTALE_NEXT_VS_MADRE.md`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`
- `src/App.tsx`
- `src/pages/CentroControllo.tsx`
- `src/next/NextCentroControlloParityPage.tsx`
- `src/next/domain/nextAutistiDomain.ts`
- `src/next/domain/nextRifornimentiDomain.ts`
- `src/next/nextAnagraficheFlottaDomain.ts`

## Verdetto iniziale
- `NOT_STARTED`
- Gap reali emersi nella verifica del runtime ufficiale:
  - la route ufficiale usava il reader autisti D03 con overlay storage e clone locale attivi;
  - la route ufficiale usava l'anagrafica flotta con patch clone-only attive;
  - la UI visibile delle date non replicava il formato reale della madre in questo modulo.

## Patch applicate
- `src/next/NextCentroControlloParityPage.tsx`
  - `readNextAutistiReadOnlySnapshot()` viene ora invocato con `includeLocalClone: false` e `includeStorageOverlay: false`;
  - `readNextAnagraficheFlottaSnapshot()` viene ora invocato con `includeClonePatches: false`;
  - il formatter locale `formatDateIt` torna al formato madre `dd/mm/yyyy`.
- `src/next/nextAnagraficheFlottaDomain.ts`
  - aggiunta l'opzione `includeClonePatches` per escludere le patch clone-only nei moduli che devono restare aderenti alla madre.

## Verifica su codice reale post-patch
- route ufficiale:
  - `/next/centro-controllo` monta `NextCentroControlloParityPage` e non `NextMotherPage`;
  - non monta `src/pages/**`, `src/autisti/**` o `src/autistiInbox/**` come runtime finale.
- UI pratica:
  - tabs, tabelle, filtri, sezioni e CTA PDF restano equivalenti alla madre;
  - il formato data visibile torna a `dd/mm/yyyy`, come nella madre.
- flussi e modali:
  - il modulo resta di consultazione e preview PDF come nella madre;
  - non emergono modali o CTA clone-only nel runtime ufficiale.
- dati reali letti:
  - manutenzioni programmate lette da `@mezzi_aziendali` senza patch clone-only;
  - rifornimenti letti dal layer D04 senza storage overlay locali;
  - segnalazioni, controlli e richieste lette dai dataset madre senza clone locale o overlay storage.
- scritture reali:
  - il modulo non riapre scritture business reali;
  - non aggiunge persistenze locali clone-only nel runtime ufficiale.

## Gap reali residui
- nessuno nel perimetro `Centro di Controllo` verificato in questo ciclo.

## Criterio PASS
- `PASS` perche risultano vere tutte le condizioni critiche del modulo:
  - route ufficiale senza runtime finale madre;
  - UI pratica equivalente;
  - flussi utili equivalenti;
  - report/PDF equivalenti;
  - dati reali letti senza overlay clone-only;
  - nessuna scrittura reale attiva;
  - layer NEXT usati davvero sotto.

## Verifiche eseguite
- `npx eslint src/next/NextCentroControlloParityPage.tsx src/next/nextAnagraficheFlottaDomain.ts` -> `OK`
- `npm run build` -> `OK`

## Come verificare
1. Aprire `/next/centro-controllo`.
2. Confrontare tabs, tabelle e CTA PDF con la madre.
3. Verificare che le date visibili siano `dd/mm/yyyy`.
4. Verificare che le righe autisti non riflettano segnali solo locali del clone.
5. Verificare che i dati manutenzioni non riflettano patch clone-only di foto/libretto.
