# CONTINUITY REPORT - Estensione realistica costi-documenti-report decisionali IA NEXT

## Contesto generale
- Il clone NEXT resta `read-only`, con la console `/next/ia/interna` gia consolidata su planner multi-dominio, affidabilita D04, priority engine flotta e quadro mezzo decisionale.
- Questo step apre `D07/D08` in modo realistico, senza riaprire la madre, senza aprire `D06` e senza fingere copertura piena su costi/documenti quando il dato resta parziale.

## Modulo/area su cui si stava lavorando
- dominio `D07/D08 Documenti e costi`
- output chat/report/PDF su costi, documenti e storico utile del mezzo
- rispetto del periodo anche per prompt economico-documentali

## Stato attuale
- Il layer `nextDocumentiCostiDomain` espone ora una vista business period-aware per targa.
- Il motore IA usa questa vista per costruire la sezione `Costi, documenti e storico utile`.
- Chat, report e PDF condividono lo stesso contenuto sostanziale sul perimetro costi/documenti.
- Il parser periodo riconosce anche `ultimi N mesi`; lo smoke reale ha confermato `ultimi 12 mesi -> 25/03/2025 - 25/03/2026`.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- lettura read-only `@costiMezzo`
- lettura read-only `@documenti_mezzi`
- lettura prudente `@documenti_magazzino` e `@documenti_generici`
- payload business condiviso tra thread, report e PDF sui casi costi/documenti/storico utile

## Prossimo step di migrazione
- Rafforzare, se richiesto, il perimetro repo-understanding / assistente sviluppo interno, senza riaprire il nucleo business gia chiuso.

## Moduli impattati
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`
- `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`
- `src/next/NextInternalAiPage.tsx`

## Contratti dati coinvolti
- `storage/@costiMezzo`
- `collection/@documenti_mezzi`
- `collection/@documenti_magazzino`
- `collection/@documenti_generici`
- nuovo derivato read-only period-aware sul layer `D07/D08`

## Ultime modifiche eseguite
- Aggiunta una vista `period-aware` con conteggi diretti/prudenziali, storico, costi leggibili e azione consigliata.
- Agganciato il motore IA a questa vista per comporre costi/documenti/storico utile in modo business-first.
- Corretto il parsing periodo su `ultimi N mesi`.
- Riallineato il thread per etichettare correttamente i casi `Costi e documenti`.

## File coinvolti
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`
- `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- Meglio dichiarare `nessun costo/documento leggibile nel periodo` che forzare copertura finta.
- I preventivi restano separati dal costo consuntivo.
- I documenti magazzino/generici restano collegamenti prudenziali e non vanno promossi a match certi.
- `D06` resta fuori: nessuna riapertura procurement come backend diretto del report costi/documenti.

## Vincoli da non rompere
- madre intoccabile
- nessuna scrittura business nel clone
- nessun refactor largo del motore unificato o del PDF engine
- nessuna promozione di dati prudenziali a dati certi

## Parti da verificare
- La targa `TI233827`, nel perimetro letto durante il task, non restituisce ancora costi/documenti leggibili nel layer `D07/D08`.
- Se in futuro emergono costi/documenti reali leggibili nel clone, va ricontrollata la resa dei totali e degli highlight con dati positivi, oltre ai casi di assenza dati gia testati.

## Rischi aperti
- Il valore del report costi/documenti dipende ancora dalla qualita reale del dato normalizzato a monte in `D07/D08`.
- Lo step rende trasparente il limite, ma non puo sostituire dati mancanti o non agganciati.

## Punti da verificare collegati
- NO

## Prossimo passo consigliato
- Proseguire con lo step roadmap successivo senza riaprire `D07/D08`, salvo nuovi bug reali sui dati o sui periodi.

## Cosa NON fare nel prossimo task
- Non aprire `D06` solo per far sembrare piu ricco il report.
- Non aggiungere fallback cosmetici quando costi/documenti non esistono nel periodo letto.
- Non sdoppiare il payload business tra chat e PDF.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/data/DOMINI_DATI_CANONICI.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
