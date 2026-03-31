# CONTINUITY REPORT - Home NEXT read-only

## Contesto generale
- La fase corrente resta di execution mirata modulo per modulo sul clone/NEXT.
- La `Home` era uno dei moduli con scarto residuo reale tra lettura fedele della madre e overlay clone-only locale.

## Modulo/area su cui si stava lavorando
- `Home`
- route `/next`

## Stato attuale
- La `Home` e una pagina NEXT vera e non monta la madre come runtime finale.
- Legge i dataset reali della madre per alert, mezzi, sessioni, eventi, segnalazioni e controlli.
- Le azioni mutatevoli restano bloccate in modo esplicito e non vengono piu riassorbite in overlay locali della `Home`.
- Il modulo non e ancora promuovibile a `CHIUSO`.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- UI principale della `Home`
- modal eventi autisti NEXT
- lettura D10 e D03
- blocco scritture read-only

## Prossimo step di migrazione
- Eseguire un audit dedicato post-patch della `Home` per decidere se il delta residuo consente `CHIUSO` oppure mantiene `APERTO`.

## Moduli impattati
- `Home`
- `Centro di Controllo` solo via domain D10 condiviso

## Contratti dati coinvolti
- `@alerts_state`
- `@mezzi_aziendali`
- `@autisti_sessione_attive`
- `@storico_eventi_operativi`
- `@segnalazioni_autisti_tmp`
- `@controlli_mezzo_autisti`

## Ultime modifiche eseguite
- Rimossa la persistenza clone-only locale dalla `Home`.
- Riallineata la lettura D10 ai dataset reali senza overlay `nextHomeCloneState`.
- Riallineata la lettura D03 della `Home` senza overlay storage locali o segnali clone-only.
- Rimossa dalla UI della `Home` la riga extra `D03 autisti`.

## File coinvolti
- `src/next/NextCentroControlloPage.tsx`
- `src/next/components/NextHomeAutistiEventoModal.tsx`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/next/domain/nextAutistiDomain.ts`

## Decisioni gia prese
- La `Home` deve restare read-only.
- Non sono ammesse scritture business reali nel clone.
- Non sono piu ammesse persistenze clone-only locali come sostituto fittizio delle scritture madre.

## Vincoli da non rompere
- Non toccare `src/pages/Home.tsx`.
- Non degradare i layer NEXT puliti gia esistenti.
- Non reintrodurre overlay locali promotibili solo nel clone per mascherare gap di parity.

## Parti da verificare
- Se il blocco esplicito delle scritture read-only e sufficiente a considerare la `Home` una copia fedele utile della madre.
- Se la modale eventi autisti copre tutti i flussi utili richiesti senza altri scarti madre/NEXT.

## Rischi aperti
- La `Home` puo ancora restare `APERTO` perche i flussi madre scriventi non sono equivalenti, ma solo bloccati.
- I domain D10/D03 sono condivisi: eventuali task futuri su Autisti o Centro di Controllo devono ricordare che la `Home` li usa ora in modalita piu strettamente mother-read-only.

## Punti da verificare collegati
- Nessuno aggiornato in questo task.

## Prossimo passo consigliato
- Audit di verifica mirato solo su `Home`, con confronto UI/flussi/dati madre vs clone dopo questa patch.

## Cosa NON fare nel prossimo task
- Non reintrodurre `nextHomeCloneState` o altre persistenze locali per simulare azioni madre.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`
- `docs/audit/AUDIT_GENERALE_TOTALE_NEXT_VS_MADRE.md`
- `docs/audit/BACKLOG_HOME_EXECUTION.md`
