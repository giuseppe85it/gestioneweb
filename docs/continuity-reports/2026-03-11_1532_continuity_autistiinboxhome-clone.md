# CONTINUITY REPORT - Autisti Inbox Home clone

## Contesto generale
- La fase corrente resta quella del clone fedele `read-only` della madre in `src/next/*`.
- La barriera no-write e attiva e le letture clone sono state ripristinate dopo la correzione della fetch barrier.

## Modulo/area su cui si stava lavorando
- Autisti Inbox
- Importazione clone-safe della home inbox usando la variante `NextAutistiEventoModal`

## Stato attuale
- La famiglia `Autisti Inbox` ha ora nel clone la home `/next/autisti-inbox` e i sei listati dedicati.
- Restano fuori `Autista 360`, `Autisti Admin` e l'app autisti `/autisti/*`.

## Legacy o Next
- ENTRAMBI

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Home inbox clone-safe
- Sei listati inbox clone-safe
- Modal eventi autisti clone-safe

## Prossimo step di migrazione
- Valutare un audit dedicato su `Autista 360`, ora che la dipendenza dal modal writer e stata rimossa dal percorso clone.

## Moduli impattati
- `AutistiInboxHome`
- `NextAutistiEventoModal`
- routing `/next/autisti-inbox`

## Contratti dati coinvolti
- `@autisti_sessione_attive`
- `@storico_eventi_operativi`
- feed eventi autisti tramite `loadHomeEvents`

## Ultime modifiche eseguite
- Aggiunta la route clone `/next/autisti-inbox`.
- Riutilizzata `AutistiInboxHome` con wrapper clone-safe e path interni riallineati a `/next`.
- Collegato il dettaglio eventi della home al modal clone-safe gia predisposto.

## File coinvolti
- `src/App.tsx`
- `src/autistiInbox/AutistiInboxHome.tsx`
- `src/next/NextAutistiInboxHomePage.tsx`
- `src/next/nextData.ts`
- `src/next/nextAccess.ts`

## Decisioni gia prese
- Non aprire ancora `Autista 360`.
- Non aprire ancora `Autisti Admin`.
- Non riattivare routing legacy fuori dal subtree `/next`.

## Vincoli da non rompere
- Madre intoccabile fuori dagli adattamenti minimi necessari al profilo clone-safe.
- Nessuna scrittura reale verso la madre.
- Nessun uso di `AutistiEventoModal` legacy nel runtime clone dove la UX risulterebbe ambigua.

## Parti da verificare
- Coerenza del feed eventi autisti tra `@storico_eventi_operativi` e fallback legacy.
- Eventuale strategia per l'ingresso alla home inbox dal Centro Controllo, se richiesto in task futuro.

## Rischi aperti
- `Autista 360` resta un aggregatore strategico e piu accoppiato della home inbox.
- La famiglia autisti usa ancora dataset legacy con qualita non uniforme.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Audit dedicato di `Autista 360` partendo dal nuovo prerequisito clone-safe sul modal eventi.

## Cosa NON fare nel prossimo task
- Non aprire insieme `Autista 360` e `Autisti Admin`.
- Non reintrodurre link legacy fuori da `/next`.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
