# CONTINUITY REPORT - D03 autisti canonico read-only per NEXT e IA interna

## Contesto generale
- Il clone NEXT resta `read-only`, con IA interna gia rafforzata su planner multi-dominio, affidabilita D04, priorita flotta, quadro mezzo, costi/documenti, procurement e assistente repo.
- Questo step chiude `D03` come dominio autisti canonico dedicato, senza scritture business e senza dipendere solo dai reader del cockpit globale.

## Modulo/area su cui si stava lavorando
- dominio `D03 Autisti`
- console `/next/ia/interna`
- `/next/centro-controllo`
- `/next/gestione-operativa`
- area autisti clone-safe

## Stato attuale
- Esiste `src/next/domain/nextAutistiDomain.ts` come snapshot read-only D03.
- Il dominio espone assegnazioni autista-mezzo, segnali/eventi, anomalie, confini e contesto locale clone.
- La console IA risponde ora in modo stabile su segnali autisti, collegamento targa-autista, riepilogo flusso, anomalie dati e confine `madre / NEXT / locale`.
- Il Centro di Controllo mostra un blocco `D03 autisti canonico`.
- Gestione Operativa mostra un banner D03 in sola lettura.
- Le pagine autisti clone-safe dichiarano il salvataggio locale.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- lettura diretta clone-safe di `@autisti_sessione_attive`
- lettura diretta clone-safe di `@storico_eventi_operativi`
- lettura diretta clone-safe di `@segnalazioni_autisti_tmp`
- lettura diretta clone-safe di `@controlli_mezzo_autisti`
- lettura diretta clone-safe di `@richieste_attrezzature_autisti_tmp`
- fallback prudente di `autisti_eventi`
- contesto locale clone autisti namespaced
- capability IA D03 per segnali, collegamenti, anomalie e confini

## Prossimo step di migrazione
- eventuale affinamento futuro delle superfici admin/inbox autisti sopra questo read model, senza riaprire scritture o sincronizzazioni reali.

## Moduli impattati
- `src/next/domain/nextAutistiDomain.ts`
- `src/next/domain/nextStatoOperativoDomain.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/NextInternalAiPage.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/NextGestioneOperativaPage.tsx`
- `src/next/autisti/NextAutistiCloneLayout.tsx`
- `src/next/autisti/NextAutistiRifornimentoPage.tsx`
- `src/next/autisti/NextAutistiSegnalazioniPage.tsx`
- `src/next/autisti/NextAutistiRichiestaAttrezzaturePage.tsx`

## Contratti dati coinvolti
- `storage/@autisti_sessione_attive`
- `storage/@storico_eventi_operativi`
- `storage/@segnalazioni_autisti_tmp`
- `storage/@controlli_mezzo_autisti`
- `storage/@richieste_attrezzature_autisti_tmp`
- `collection/autisti_eventi`
- localStorage namespaced clone autisti

## Ultime modifiche eseguite
- creato il nuovo read model D03 con normalizzazione di badge, autista, targa, timestamp, tipo evento e affidabilita collegamento;
- introdotto il ramo IA `drivers_readonly`;
- corrette le precedenze del composer D03 per distinguere segnali, collegamenti, riepilogo flusso, anomalie e confine;
- aggiunti banner e copy clone-safe in Centro di Controllo, Gestione Operativa e area autisti;
- etichettati i salvataggi autisti come locali.

## File coinvolti
- `src/next/domain/nextAutistiDomain.ts`
- `src/next/domain/nextStatoOperativoDomain.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/NextInternalAiPage.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/NextGestioneOperativaPage.tsx`
- `src/next/autisti/NextAutistiCloneLayout.tsx`
- `src/next/autisti/NextAutistiRifornimentoPage.tsx`
- `src/next/autisti/NextAutistiSegnalazioniPage.tsx`
- `src/next/autisti/NextAutistiRichiestaAttrezzaturePage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- Meglio separare in modo esplicito madre, clone locale e fallback legacy che farli sembrare un unico flusso certo.
- `autisti_eventi` resta supporto prudente e non fonte primaria.
- Le azioni del clone autisti che non sincronizzano la madre devono dirlo nel testo del pulsante.
- Il Centro di Controllo puo usare D03, ma non deve sostituirlo con merge impliciti propri.

## Vincoli da non rompere
- madre intoccabile
- nessuna scrittura business nel clone
- nessuna sincronizzazione reale dei salvataggi autisti clone
- nessun refactor largo dell'app autisti
- nessuna scorciatoia D10/D04 usata come surrogato di D03

## Parti da verificare
- Se in futuro verra importata un'area admin/inbox autisti piu forte, va costruita sopra `nextAutistiDomain` e non sopra shape legacy sparse.
- I metadati tecnici nel thread IA possono ancora essere ripuliti in un task futuro di resa business-first.

## Rischi aperti
- Il fallback `autisti_eventi` resta numericamente presente e va sempre trattato come prudente.
- I segnali locali clone possono creare aspettative di sincronizzazione se altre superfici future non rispettano il copy introdotto qui.

## Punti da verificare collegati
- NO

## Prossimo passo consigliato
- estendere le superfici autisti admin/inbox clone-safe solo sopra questo read model D03, mantenendo separati madre, locale clone e fallback legacy.

## Cosa NON fare nel prossimo task
- Non usare di nuovo `D10` come shortcut per domande D03 specifiche.
- Non promuovere `autisti_eventi` a fonte forte senza nuova evidenza.
- Non riattivare scritture o sincronizzazioni reali nell'area autisti clone-safe.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/data/DOMINI_DATI_CANONICI.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/data/REGOLE_STRUTTURA_DATI.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
