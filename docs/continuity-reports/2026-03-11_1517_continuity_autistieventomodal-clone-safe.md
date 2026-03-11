# CONTINUITY REPORT - AutistiEventoModal clone-safe

## Contesto generale
- Il progetto resta nella fase di clone fedele `read-only` della madre su `src/next/*`.
- Le letture clone sono state ripristinate e la barriera no-write e attiva.

## Modulo/area su cui si stava lavorando
- Nodo tecnico autisti: `AutistiEventoModal`.
- Perimetro task: preparare la variante clone-safe senza aprire ancora `AutistiInboxHome` o `Autista 360`.

## Stato attuale
- Esiste ora una variante clone-safe del modal eventi autisti sotto `/next`.
- Il modal shared legacy mantiene il comportamento originale fuori dal clone.

## Legacy o Next
- ENTRAMBI

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Variante clone-safe del modal.
- Nessun nuovo modulo autisti aperto in questo task.

## Prossimo step di migrazione
- Montare `NextAutistiEventoModal` in `AutistiInboxHome` clone-safe e aprire la home inbox.

## Moduli impattati
- `src/components/AutistiEventoModal.tsx`
- `src/next/components/NextAutistiEventoModal.tsx`

## Contratti dati coinvolti
- `@lavori`
- `@segnalazioni_autisti_tmp`
- `@controlli_mezzo_autisti`
- `@cambi_gomme_autisti_tmp`
- `@gomme_eventi`
- `@manutenzioni`

## Ultime modifiche eseguite
- Aggiunta modalita opzionale `cloneSafe` al modal condiviso.
- Neutralizzate nel profilo clone-safe le CTA writer e la navigazione legacy verso `dettagliolavori`.
- Creato wrapper `/next` per il modal clone-safe.

## File coinvolti
- `src/components/AutistiEventoModal.tsx`
- `src/next/components/NextAutistiEventoModal.tsx`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Decisioni gia prese
- Non riusare il modal writer quasi as-is nel clone.
- Non aprire ancora `AutistiInboxHome` o `Autista 360` in questo task.
- Usare il dettaglio clone-safe lavori solo quando esiste un singolo `linkedLavoroId`.

## Vincoli da non rompere
- Madre intoccabile fuori dal comportamento necessario al clone.
- Nessuna scrittura reale verso la madre.
- Nessun uso di route legacy dal modal clone-safe.

## Parti da verificare
- Integrazione del wrapper clone-safe dentro `AutistiInboxHome`.
- Eventuale opportunita di montarlo anche nel futuro clone di `Autista 360`.

## Rischi aperti
- `Autista 360` resta modulo strategico per ultimo, anche dopo questa preparazione.
- Resta aperto il punto canonico su `@storico_eventi_operativi` vs `autisti_eventi`.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Mini progetto su `AutistiInboxHome` clone-safe usando `NextAutistiEventoModal`.

## Cosa NON fare nel prossimo task
- Non aprire insieme `Autista 360`.
- Non toccare `AutistiAdmin` o app autisti.
- Non riattivare CTA writer nel modal clone-safe.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
