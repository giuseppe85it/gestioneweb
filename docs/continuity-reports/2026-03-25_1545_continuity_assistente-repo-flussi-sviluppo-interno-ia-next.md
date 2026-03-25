# CONTINUITY REPORT - IA interna NEXT / repo-flussi-integrazione

## Contesto generale
- il progetto resta nella fase di clone `read-only` della madre, con NEXT come unico perimetro di evoluzione e backend IA separato per retrieval/orchestrazione controllata;
- il nucleo business della console IA era gia stato rafforzato su verticale mezzo/Home/tecnica e aperture realistiche D04, D07, D08; questo task ha aggiunto il lato assistente tecnico interno su repo e flussi.

## Modulo/area su cui si stava lavorando
- IA interna NEXT
- repo understanding, orchestrazione chat e guida integrazione moduli/flussi

## Stato attuale
- stabile il canale server-side `orchestrator.chat` per richieste repo/flussi con risposta deterministica sopra snapshot read-only;
- stabile anche il fallback locale dell'orchestrator sui prompt repo/flussi, con priorita rispetto al motore business unificato;
- in corso solo l'eventuale ampliamento futuro dei playbook curati verso altri domini o edge case del runtime legacy.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- UI chat unica `/next/ia/interna`
- backend IA separato read-only
- snapshot repo/UI curata
- playbook repo/flussi/integrazione
- suggerimenti rapidi dedicati ai prompt tecnici interni

## Prossimo step di migrazione
- se richiesto, ampliare i playbook repo/flussi su moduli specifici aggiuntivi mantenendo la stessa struttura pratica e la distinzione dei layer.

## Moduli impattati
- IA interna NEXT
- backend IA separato
- repo understanding
- output selector chat

## Contratti dati coinvolti
- nessuno

## Ultime modifiche eseguite
- aggiunta mappa layer `madre / NEXT / backend IA / domain-read-model / renderer / documentazione`;
- aggiunta risposta deterministica server-side per richieste repo/flussi;
- allargato l'orchestrator locale a flussi, impatti, nuovi moduli e capability IA tecniche;
- corretto il routing per evitare che i prompt repo vengano assorbiti dal motore business unificato;
- aggiornata la UI della pagina IA con nuovi prompt bussola e copy piu esplicito.

## File coinvolti
- `backend/internal-ai/server/internal-ai-repo-understanding.js`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiOutputSelector.ts`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- la capability repo/flussi deve restare dentro il perimetro IA interna NEXT e backend IA separato, senza trasformarsi in agente che patcha il repository;
- le richieste repo/flussi devono distinguere sempre madre, NEXT, backend IA e read model;
- per questo canale l'output deve essere pratico e fisso, non un parere astratto del modello.

## Vincoli da non rompere
- madre intoccabile;
- nessuna scrittura business o live bridge Firebase/Storage;
- nessun refactor largo del motore business unificato;
- tutti i testi visibili in UI in italiano;
- nessun file fuori whitelist senza nuova autorizzazione.

## Parti da verificare
- copertura futura dei playbook su domini oltre quelli oggi curati;
- eventuale smoke browser end-to-end stabile del composer IA in runner locale, separato dalla verifica gia chiusa su endpoint server-side reale.

## Rischi aperti
- i playbook repo/flussi restano curati e non AST-complete, quindi i casi molto periferici possono richiedere un task dedicato;
- la UI locale puo portare ambiti console predefiniti che non devono mai tornare a sovrascrivere il routing repo/flussi.

## Punti da verificare collegati
- nessun nuovo punto aperto formalizzato in `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- se il team vuole approfondire un dominio tecnico specifico, aprire un task mirato su un solo flusso o macro-area e riusare la stessa struttura `Sintesi / Moduli / File / Perimetro / Intervento / Rischio / Integrazione / Azione`.

## Cosa NON fare nel prossimo task
- non spostare logica business nel backend IA solo per ottenere una risposta tecnica piu ricca;
- non usare la pagina IA come nuova UI canonica dei moduli business;
- non riaprire la madre o writer legacy per facilitare il repo understanding.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/flow-master/MAPPA_MAESTRA_FLUSSI_GESTIONALE.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
