# CONTINUITY REPORT - Audit Centro di Controllo NEXT runtime

## Contesto generale
- Il progetto NEXT resta in fase clone read-only della madre, con layer normalizzati disponibili in varie aree ma non sempre agganciati ai path ufficiali.

## Modulo/area su cui si stava lavorando
- Centro di Controllo NEXT
- Audit documentale del runtime reale della route `/next/centro-controllo`

## Stato attuale
- La route ufficiale `/next/centro-controllo` monta `NextCentroControlloClonePage`, che wrappa `CentroControllo` della madre con soli adattamenti clone-safe.
- Il layer `src/next/domain/nextCentroControlloDomain.ts` esiste, legge dataset reali e normalizza dati, ma oggi alimenta `NextCentroControlloPage.tsx`, non il path ufficiale.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Clone read-only del Centro di Controllo madre sulla route ufficiale.
- Surface alternativa NEXT con domain D10/D03 e quick link, ma non agganciata al path ufficiale.

## Prossimo step di migrazione
- Se si vorra rendere il Centro di Controllo NEXT davvero piu pulito della madre, il passo corretto non e un redesign: e decidere se e come spostare il path ufficiale dal wrapper clone al layer D10 gia presente.

## Moduli impattati
- `Centro di Controllo`
- `D10 Centro di Controllo / Eventi`
- `D03 Autisti read-only`

## Contratti dati coinvolti
- `@alerts_state`
- `@mezzi_aziendali`
- `@autisti_sessione_attive`
- `@storico_eventi_operativi`
- `@segnalazioni_autisti_tmp`
- `@controlli_mezzo_autisti`
- `@richieste_attrezzature_autisti_tmp`
- `autisti_eventi`

## Ultime modifiche eseguite
- Creato `docs/audit/AUDIT_CENTRO_DI_CONTROLLO_NEXT.md`.
- Aggiornato `docs/product/STATO_MIGRAZIONE_NEXT.md` con il risultato runtime dell'audit.
- Aggiornato `docs/product/REGISTRO_MODIFICHE_CLONE.md`.

## File coinvolti
- `docs/audit/AUDIT_CENTRO_DI_CONTROLLO_NEXT.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `src/App.tsx`
- `src/next/NextCentroControlloClonePage.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/next/domain/nextAutistiDomain.ts`

## Decisioni gia prese
- L'audit deve seguire il runtime reale della NEXT, non la documentazione ottimistica.
- La route ufficiale e la fonte di verita per stabilire cosa il modulo mostra davvero oggi.

## Vincoli da non rompere
- Madre intoccabile.
- Nessuna patch runtime in questo task.
- Nessuna reinterpretazione UX: solo audit del modulo reale.

## Parti da verificare
- Se esiste gia una decisione approvata per agganciare il path ufficiale al layer D10.
- Se il dataset `@alerts_state` resta coerente con gli alert derivati dal domain.
- Se la quality `derived_acceptable` copre tutti i casi KO e revisione senza falsi positivi.

## Rischi aperti
- La NEXT puo sembrare piu normalizzata di quanto sia davvero sul path ufficiale.
- Il path ufficiale continua a ereditare logiche raw della madre anche se nel repo esiste un domain migliore.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Usare questo audit come base di una decisione secca: o il path ufficiale resta clone wrapper consapevole, o viene riallineato al layer D10 con analisi di parita funzionale prima di ogni patch.

## Cosa NON fare nel prossimo task
- Non dichiarare il Centro di Controllo NEXT "gia normalizzato" senza distinguere il path ufficiale dal cockpit alternativo.
- Non spostare la route ufficiale su `NextCentroControlloPage.tsx` senza verificare la perdita delle tab rifornimenti/segnalazioni/controlli/richieste della pagina importata.

## Commit/hash rilevanti
- `NON ESEGUITO`

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/data/DOMINI_DATI_CANONICI.md`
- `docs/data/REGOLE_STRUTTURA_DATI.md`
- `docs/flow-master/MAPPA_MAESTRA_FLUSSI_GESTIONALE.md`
- `docs/audit/AUDIT_CENTRO_DI_CONTROLLO_NEXT.md`
