# CONTINUITY REPORT - Chat IA prima verticale

## Contesto generale
- Il progetto resta in fase clone NEXT read-only con madre intoccabile e sottosistema IA interno isolato.
- La chat `/next/ia/interna` aveva gia una V1 utile, ma il percorso dati e il messaggio prodotto erano ancora troppo larghi rispetto alla prima verticale definita dal Prompt 67.

## Modulo/area su cui si stava lavorando
- Chat IA interna NEXT
- Consolidamento della prima verticale `D01 + D10 + D02`

## Stato attuale
- La chat e ora allineata ai casi della prima verticale mezzo/Home/tecnica.
- Il report targa e lo stato mezzo leggono reader canonici NEXT read-only di anagrafica, stato operativo e operativita tecnica.
- I confini verso domini esterni sono dichiarati nel thread invece di essere lasciati impliciti.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- UI chat principale
- Lettura dati read-only
- Artifact/PDF report targa
- Nessuna scrittura business

## Prossimo step di migrazione
- Rafforzare il dettaglio di `stato mezzo` con un piccolo mapping piu preciso dei segnali D10 per targa, senza riaprire domini esterni o cambiare l'infrastruttura IA.

## Moduli impattati
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiOutputSelector.ts`
- `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`
- `src/next/internal-ai/internalAiVehicleDossierHookFacade.ts`
- `src/next/internal-ai/internalAiVehicleReportFacade.ts`
- `src/next/NextInternalAiPage.tsx`

## Contratti dati coinvolti
- `storage/@mezzi_aziendali`
- `storage/@lavori`
- `storage/@manutenzioni`
- `@alerts_state`
- `@autisti_sessione_attive`
- `@storico_eventi_operativi`
- `@segnalazioni_autisti_tmp`
- `@controlli_mezzo_autisti`

## Ultime modifiche eseguite
- Stretti intenti e capability ai casi reali della prima verticale.
- Rimesso `report targa` sui reader canonici `D01`, `D10`, `D02`.
- Disattivati nella pratica output di integrazione e capability fuori verticale nel thread principale.
- Resa la UI della chat piu esplicita su use case, contesto e limiti.

## File coinvolti
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiOutputSelector.ts`
- `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`
- `src/next/internal-ai/internalAiVehicleDossierHookFacade.ts`
- `src/next/internal-ai/internalAiVehicleReportFacade.ts`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- La prima verticale della chat IA resta `D01 + D10 + D02`.
- Le pagine UI legacy possono essere analizzate come superfici, ma non diventano reader canonici IA.
- I domini `D03`, `D04`, `D05`, `D06`, `D07`, `D08` restano fuori dal consolidamento di questo thread.

## Vincoli da non rompere
- Madre intoccabile.
- Nessuna scrittura business o backend live nuovo.
- Nessun segreto lato client e nessun riuso dei moduli IA legacy come backend canonico.
- Nessuna patch fuori whitelist senza esplicita autorizzazione.

## Parti da verificare
- Da verificare se il mapping D10 per singola targa richiede in futuro un helper dedicato per distinguere meglio alert, revisioni e focus nel thread.
- Da verificare se i pannelli secondari della pagina IA vadano in futuro ridotti o lasciati solo come archivio tecnico, senza toccare ora il perimetro.

## Rischi aperti
- Il repo contiene ancora capability e preview storiche fuori prima verticale in altre aree della pagina, quindi serve disciplina nel non riattivarle dal thread.
- La Home clone continua a montare componenti legacy come superficie UI; il reader canonico resta comunque D10 e non la pagina.

## Punti da verificare collegati
- Nessun nuovo punto formalizzato in `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md` da questo task.

## Prossimo passo consigliato
- Piccolo task mirato sul testo/struttura della risposta `stato mezzo` per evidenziare meglio alert D10, revisione e backlog tecnico D02 per targa, senza cambiare infrastruttura o aprire domini esterni.

## Cosa NON fare nel prossimo task
- Non riaprire rifornimenti, costi, documenti, preventivi o autisti dedicati dentro il thread principale.
- Non reintrodurre il composito Dossier largo come reader canonico della chat.
- Non toccare madre, routing globale o backend IA live.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
