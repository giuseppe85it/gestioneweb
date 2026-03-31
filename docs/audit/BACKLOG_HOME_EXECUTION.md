# BACKLOG HOME EXECUTION

## Modulo
- `Home`

## Route
- `/next`

## Stato iniziale
- `APERTO`
- La route era gia nativa NEXT, ma il modulo usava ancora overlay clone-only locali su alert, prenotazioni collaudo, pre-collaudi, revisione e luogo rimorchio.
- Il domain D10 riassorbiva questi overlay locali invece di leggere solo i dataset reali della madre.
- La UI mostrava anche un blocco aggiuntivo `D03 autisti` non presente nella madre.

## Stato durante il run
- Rimossa la dipendenza runtime da `nextHomeCloneState` per la route `Home`.
- Riallineata la lettura D10 ai dataset reali della madre senza overlay locali Home.
- Riallineata la lettura D03 della `Home` alla sola fonte madre, senza overlay storage locali e senza segnali clone-only.
- Rimossa la fonte aggiuntiva `autistiSnapshot.assignments` dalla costruzione delle suggestioni autista.
- Convertite le principali azioni mutatevoli della `Home` in blocchi read-only espliciti.

## Stato finale
- `APERTO`
- `Home` legge ora alert, mezzi, sessioni, eventi, segnalazioni e controlli dai dataset reali della madre attraverso layer NEXT.
- Le scritture reali restano bloccate e le precedenti mutazioni clone-only locali della `Home` non vengono piu persistite.
- Le suggestioni autista sono ora allineate al criterio madre `sessioni + mezzi`; il gap mirato e stato risolto.
- Resta aperto solo il vincolo operativo di non promuovere il modulo a `CHIUSO` in questo prompt.

## Blocco reale
- Nessun file extra richiesto in questo task.
