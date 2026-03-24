# CONTINUITY REPORT - Capability canonica stato operativo mezzo

## Contesto generale
- Il progetto resta in fase clone NEXT read-only con madre intoccabile e sottosistema IA interno isolato.
- Dopo i prompt 68 e 69 la prima verticale era consolidata e il thread ragionava per domini, ma mancava ancora una capability piccola e canonica che mettesse al centro lo stato del mezzo.

## Modulo/area su cui si stava lavorando
- Chat IA interna NEXT
- Capability canonica `stato_operativo_mezzo`

## Stato attuale
- `stato_operativo_mezzo` e ora il percorso principale per richieste tipo `stato mezzo/targa`.
- La capability legge solo `D01`, `D10`, `D02` tramite reader canonici NEXT.
- Il `report targa` resta separato come capability PDF/preview e non definisce piu la verticale.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Routing prioritario stato mezzo
- Output `chat_structured` dedicato
- Distinzione chiara da `report targa`
- Nessuna scrittura business

## Prossimo step di migrazione
- Solo se richiesto, affinare in un task separato il mapping dei segnali D10 per targa senza riaprire altri domini o infrastruttura.

## Moduli impattati
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiOutputSelector.ts`
- `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`
- `src/next/NextInternalAiPage.tsx`

## Contratti dati coinvolti
- `storage/@mezzi_aziendali`
- `@alerts_state`
- `@autisti_sessione_attive`
- `@storico_eventi_operativi`
- `@segnalazioni_autisti_tmp`
- `@controlli_mezzo_autisti`
- `storage/@lavori`
- `storage/@manutenzioni`

## Ultime modifiche eseguite
- Inserito routing prioritario `stato_operativo_mezzo`.
- Tolta la dipendenza del caso `stato mezzo` dal percorso report o dal facade storico.
- Reso esplicito in pagina che lo stato operativo mezzo e la capability canonica della V1.

## File coinvolti
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiOutputSelector.ts`
- `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- Il centro della prima verticale e `stato_operativo_mezzo`.
- Le fonti canoniche sono solo `D01`, `D10`, `D02`.
- Il `report targa` resta separato e secondario.

## Vincoli da non rompere
- Madre intoccabile.
- Nessuna scrittura business o backend live nuovo.
- Nessuna riapertura di `D03-D09`.
- Nessun tocco ad allegati, observer o live bridge.

## Parti da verificare
- Da verificare se serva in futuro una lettura ancora piu precisa dei segnali D10 direttamente collegabili a una targa.

## Rischi aperti
- Alcuni segnali D10 restano per natura feed operativi e non sempre sono collegabili in modo pienamente affidabile alla singola targa.
- Il thread deve continuare a dichiarare `DA VERIFICARE` quando il collegamento non e forte.

## Punti da verificare collegati
- Nessun nuovo punto formalizzato in `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md` da questo task.

## Prossimo passo consigliato
- Piccolo task dedicato, se richiesto, solo sul raffinamento D10 per targa dentro `stato_operativo_mezzo`, senza toccare altri domini.

## Cosa NON fare nel prossimo task
- Non riportare `stato mezzo` sul Dossier largo.
- Non confondere di nuovo `stato_operativo_mezzo` con `report targa`.
- Non riaprire domini esterni o infrastruttura IA.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
