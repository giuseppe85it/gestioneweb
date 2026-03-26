# CONTINUITY REPORT - D06 procurement reale read-only per NEXT e IA interna

## Contesto generale
- Il clone NEXT resta `read-only`, con IA interna gia rafforzata su planner, affidabilita D04, priorita flotta, quadro mezzo, costi/documenti e assistente repo.
- Questo step chiude `D06` come dominio procurement leggibile e onesto nel clone, senza riattivare approvazioni, ordini materiali o PDF timbrati.

## Modulo/area su cui si stava lavorando
- dominio `D06 Procurement`
- clone `/next/acquisti`
- pagina `Capo Costi Mezzo`
- risposte IA su ordini, preventivi, approvazioni, CTA bloccate e stato reale del perimetro

## Stato attuale
- Esiste uno snapshot procurement read-only che aggrega ordini, righe materiali, arrivi, preventivi, approvazioni e listino.
- `/next/acquisti` mostra un workbench read-only in italiano con tabs realmente coerenti col perimetro clone-safe.
- `Capo Costi Mezzo` dichiara ora il confine del clone e le CTA bloccate.
- La console `/next/ia/interna` instrada i prompt D06 nel ramo `procurement_readonly` e non li lascia piu scivolare nel ramo costi/documenti per ambiguita lessicali come `Capo Costi`.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- lettura clone-safe ordini e righe materiali da `@ordini`
- lettura preventiva prudente di `@preventivi`
- lettura approvazioni prudente di `@preventivi_approvazioni`
- lettura listino prudente di `@listino_prezzi`
- capability IA interna per stato procurement, approvazioni, CTA bloccate e Capo Costi read-only

## Prossimo step di migrazione
- eventuale affinamento futuro del perimetro procurement solo se emerge un read model piu forte, senza riaprire scritture o workflow approvativi reali.

## Moduli impattati
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/NextInternalAiPage.tsx`
- `src/next/NextCapoCostiMezzoPage.tsx`
- `src/pages/Acquisti.tsx`

## Contratti dati coinvolti
- `storage/@ordini`
- `storage/@preventivi`
- `storage/@preventivi_approvazioni`
- `storage/@listino_prezzi`
- nuovo derivato read-only procurement nel layer `nextDocumentiCostiDomain`

## Ultime modifiche eseguite
- aggiunto uno snapshot procurement read-only con superfici `navigabile`, `preview`, `bloccata`;
- introdotto nel motore IA il ramo `procurement_readonly`;
- resa `/next/acquisti` una vista clone-safe realmente read-only;
- esplicitate le CTA bloccate su `Capo Costi Mezzo`;
- aggiornati i suggerimenti rapidi della console IA per coprire D06.

## File coinvolti
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/NextInternalAiPage.tsx`
- `src/next/NextCapoCostiMezzoPage.tsx`
- `src/pages/Acquisti.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- Meglio bloccare o marcare una CTA come preview che lasciarla sembrare attiva.
- `Capo Costi` non va trattato come contabilita o approvazione reale nel clone.
- `Prezzi & Preventivi`, `Listino Prezzi`, `Ordine materiali` e PDF timbrati restano fuori dal perimetro operativo importato.
- La IA deve dire con chiarezza quando procurement e solo lettura prudente.

## Vincoli da non rompere
- madre intoccabile
- nessuna scrittura business nel clone
- nessuna approvazione reale o `stamp_pdf`
- nessun refactor largo del modulo acquisti legacy
- nessuna promozione fittizia di preview a workflow reale

## Parti da verificare
- Se in futuro verranno importati altri pezzi del procurement vero, andranno rivalutati sia il read model sia le CTA oggi bloccate.
- Il comando eslint completo resta rosso per debito legacy nei file whitelisted `src/pages/Acquisti.tsx` e `src/next/NextCapoCostiMezzoPage.tsx`.

## Rischi aperti
- Preventivi, approvazioni e listino restano parziali rispetto al workflow completo della madre.
- Lo step migliora fiducia e chiarezza, ma non sostituisce un vero import futuro dei workflow procurement se mai verra richiesto.

## Punti da verificare collegati
- NO

## Prossimo passo consigliato
- mantenere D06 read-only e concentrarsi solo su bug reali o nuovi read model dimostrabili, senza riaprire superfici scriventi per parita cosmetica.

## Cosa NON fare nel prossimo task
- Non riattivare approva/rifiuta, ordine materiali o PDF timbrati solo per “far vedere” workflow piu ricchi.
- Non usare `D07/D08` come surrogato di `D06` per risposte procurement.
- Non duplicare nella chat IA sintesi procurement che non nascono dal layer read-only introdotto qui.

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
