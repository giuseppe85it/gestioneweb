# CONTINUITY REPORT - Quadro mezzo e output IA NEXT

## Contesto generale
- Il clone NEXT resta in fase `read-only` fedele alla madre, con il sottosistema IA interno isolato sotto `/next/ia/interna`.
- Dopo planner multi-dominio, affidabilita D04 e priority engine flotta, questo step chiude il quadro mezzo decisionale e l'allineamento tra renderer.

## Modulo/area su cui si stava lavorando
- quadro completo mezzo della console IA interna
- coerenza tra thread chat, report corrente, modale e PDF

## Stato attuale
- Il quadro mezzo usa ora un payload business unico con ordine stabile e leggibile.
- Il thread espone solo i blocchi decisionali principali e nasconde dal primo piano i riferimenti tecnici non utili.
- Report corrente e PDF nascono dallo stesso contenuto sostanziale del thread.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- UI console IA clone-safe
- lettura dati read-only dal motore unificato
- report/modale/PDF del quadro mezzo riallineati sul payload business

## Prossimo step di migrazione
- Estendere in modo realistico costi e documenti, mantenendo il quadro mezzo decisionale come contenitore stabile e senza rifare il motore.

## Moduli impattati
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`
- `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`
- `src/next/NextInternalAiPage.tsx`

## Contratti dati coinvolti
- nessuno nuovo

## Ultime modifiche eseguite
- Introdotto un quadro mezzo decisionale con blocchi fissi e business-first.
- Riallineato il renderer professionale per rispettare ordine e contenuto del payload condiviso.
- Ripulito il thread chat da etichette o pill tecniche non utili al quadro mezzo.

## File coinvolti
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`
- `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- Il quadro mezzo non deve piu comportarsi come una overview rumorosa, ma come risposta decisionale orientata all'azione.
- Chat, report, modale e PDF devono divergere solo nel renderer, non nella sostanza business.

## Vincoli da non rompere
- madre intoccabile
- nessuna scrittura business nel clone NEXT
- niente refactor largo del PDF engine o del motore unificato

## Parti da verificare
- L'output selector puo ancora preferire il percorso report/PDF per richieste tipo `report completo`; il contenuto e allineato, ma la scelta formato resta da affinare solo se torna un problema reale.
- Costi e documenti restano visibili solo quando il payload li ritiene abbastanza leggibili e agganciati.

## Rischi aperti
- Un'estensione troppo aggressiva di costi/documenti puo riportare rumore nel quadro mezzo.
- Reintrodurre riferimenti tecnici nel thread rischia di peggiorare di nuovo la leggibilita business-first.

## Punti da verificare collegati
- nessuno esplicito

## Prossimo passo consigliato
- Aprire lo step successivo della roadmap su estensione realistica costi-documenti-report decisionali, riusando il quadro mezzo come tela stabile.

## Cosa NON fare nel prossimo task
- Non rifare il planner o il motore unificato.
- Non aggiungere nuove viste o dashboard fuori dal perimetro della console IA interna.

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
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
