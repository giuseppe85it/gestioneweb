# CONTINUITY REPORT - Migrazione Cisterna IA clone

## Contesto generale
- Il clone fedele `read-only` continua a espandersi anche su moduli originariamente writer, sfruttando la barriera no-write.
- Dopo la Fase 2 mirata sui writer diretti Cisterna, il primo modulo portato dentro e `Cisterna IA`.

## Modulo/area su cui si stava lavorando
- `Cisterna IA`
- route clone `/next/cisterna/ia`

## Stato attuale
- `Cisterna IA` e raggiungibile dal clone.
- La pagina resta fedele al flusso della madre dove possibile, ma nel clone upload, analisi IA e salvataggio archivio vengono fermati dalla barriera e tradotti in messaggi utente leggibili.
- `Schede Test` resta fuori.

## Legacy o Next
- ENTRAMBI

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- route clone reale `/next/cisterna/ia`
- collegamento dalla base `/next/cisterna`
- adattamento clone-safe della pagina `CisternaCaravateIA`

## Prossimo step di migrazione
- eventuale audit o migrazione separata di `Schede Test`

## Moduli impattati
- Cisterna

## Contratti dati coinvolti
- nessuno

## Ultime modifiche eseguite
- aggiunta route clone Cisterna IA
- creato wrapper `NextCisternaIAPage`
- adattata gestione errori/barriera della pagina madre

## File coinvolti
- `src/App.tsx`
- `src/pages/CisternaCaravate/CisternaCaravateIA.tsx`
- `src/next/NextCisternaPage.tsx`
- `src/next/NextCisternaIAPage.tsx`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Decisioni gia prese
- Nessuna migrazione di `Schede Test` in questo task.
- Nessun refactor ampio del dominio Cisterna.
- Nessuna scrittura reale verso la madre dal clone.

## Vincoli da non rompere
- La madre deve restare invariata fuori dal subtree `/next`.
- La barriera no-write deve restare l’unico meccanismo che impedisce i writer, senza workaround che tocchino la madre.

## Parti da verificare
- eventuale UX futura di `Schede Test`
- eventuali affinamenti del feedback clone-safe se si apriranno altri moduli writer

## Rischi aperti
- `Cisterna IA` nel clone resta navigabile ma non completa il ciclo operativo reale.
- `Schede Test` rimane il punto piu delicato della famiglia Cisterna.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- non allargare subito a `Schede Test`; trattarlo con task dedicato

## Cosa NON fare nel prossimo task
- Non mischiare `Schede Test` ad altri moduli nella stessa patch.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
