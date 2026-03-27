# REGISTRY TOTALE CLONE NEXT

## 1. Scopo
Questo documento descrive il primo registry totale e interrogabile del clone/NEXT usato dalla chat/IA universale in `/next/ia/interna`.

Il registry non tratta i domini gia chiusi come prodotto finale. Li rifonde come adapter specializzati sotto un gateway universale che censisce moduli, route, viste, modali, entita, reader, capability IA riusabili, hook UI e gap reali.

## 2. Snapshot iniziale del registry universale
- Data base seed: `2026-03-26`
- Origine runtime: `src/next/internal-ai/internalAiUniversalContracts.ts`
- Lettura registry: `src/next/internal-ai/internalAiUniversalRegistry.ts`
- Conteggi attuali:
  - moduli censiti: `10`
  - route uniche censite: `30`
  - modali censite: `4`
  - tipi entita canonici: `10`
  - adapter standardizzati: `11`
  - capability IA censite: `13`
  - capability IA gia assorbite: `8`
  - hook UI censiti: `31`
  - gap espliciti nel perimetro attuale: `0`

## 3. Moduli censiti nel perimetro universale
1. `next.home`
   - Area: `Centro di Controllo`
   - Ruolo: ingresso generale del clone, alert rapidi, punto di convergenza verso dossier e IA
   - Stato: `assorbito`
2. `next.centro_controllo`
   - Area: `Centro di Controllo`
   - Ruolo: alert, scadenze, priorita, trigger consultivi
   - Stato: `assorbito`
3. `next.operativita`
   - Area: `Gestione Operativa`
   - Ruolo: workbench globale, inventario, materiali, manutenzioni, lavori
   - Stato: `assorbito`
4. `next.procurement`
   - Area: `Gestione Operativa`
   - Ruolo: ordini, fornitori, preventivi, procurement support
   - Stato: `assorbito`
5. `next.dossier`
   - Area: `Mezzi / Dossier`
   - Ruolo: cuore mezzo-centrico del clone, dossier, rifornimenti, analisi economica
   - Stato: `assorbito`
6. `next.ia_hub`
   - Area: `IA`
   - Ruolo: hub capability documentali e libretti gia presenti nel clone
   - Stato: `assorbito`
7. `next.ia_interna`
   - Area: `IA`
   - Ruolo: gateway universale, chat, sessioni, richieste, artifacts, audit
   - Stato: `assorbito`
8. `next.libretti_export`
   - Area: `IA / PDF`
   - Ruolo: utility PDF laterale legata ai libretti
   - Stato: `assorbito`
9. `next.cisterna`
   - Area: `Verticali specialistici`
   - Ruolo: verticale separato ma gia censito e leggibile
   - Stato: `assorbito`
10. `next.autisti`
    - Area: `Autisti`
    - Ruolo: inbox, admin reader-first, app clone autisti
    - Stato: `assorbito`

## 4. Adapter standard gia agganciati
1. `adapter.d01`
   - Copertura: identita mezzo, dossier base, associazione mezzo-autista, libretto
   - Stato: `assorbito`
2. `adapter.d02`
   - Copertura: lavori, manutenzioni, gomme
   - Stato: `assorbito`
3. `adapter.d03`
   - Copertura: autisti, badge, eventi operativi
   - Stato: `assorbito`
4. `adapter.d04`
   - Copertura: rifornimenti, consumi, anomalia carburante
   - Stato: `assorbito`
5. `adapter.d05`
   - Copertura: magazzino reale, inventario, materiali verso mezzi
   - Stato: `assorbito`
6. `adapter.d06`
   - Copertura: procurement, ordini, fornitori, preventivi
   - Stato: `assorbito`
7. `adapter.d07d08`
   - Copertura: documenti, costi, analisi economica
   - Stato: `assorbito`
8. `adapter.d09`
   - Copertura: cisterna
   - Stato: `assorbito`
9. `adapter.d10`
   - Copertura: stato operativo, alert, priorita, scadenze
   - Stato: `assorbito`
10. `adapter.repo`
    - Copertura: registry tecnico, route, dipendenze, punti di integrazione
    - Stato: `assorbito`
11. `adapter.universal`
   - Copertura: richiesta libera, action intent, routing documenti, selezione adapter
   - Stato: `assorbito`

## 5. Capability IA censite e riusabili
### 5.1 Capability gia assorbite
1. `backend.chat.controlled`
2. `backend.repo-understanding`
3. `backend.retrieval.clone-seeded`
4. `clone.vehicle-report-preview`
5. `clone.driver-report-preview`
6. `clone.documents-preview`
7. `clone.libretto-preview`
8. `clone.preventivi-preview`

### 5.2 Capability legacy mappate ma non canonizzate runtime
1. `legacy.libretto-extraction`
2. `legacy.documents-extraction`
3. `legacy.economic-analysis`
4. `legacy.preventivo-extraction`
5. `legacy.cisterna-extraction`

## 6. Hook UI gia censiti
Gli hook UI coprono route e modali gia reali del clone/NEXT. I principali punti di aggancio censiti oggi sono:
- Home clone e Centro di Controllo
- Gestione Operativa, Inventario, Materiali, Manutenzioni, Lavori
- Acquisti, Ordini in attesa, Ordini arrivati
- Mezzi, Lista dossier, Dossier dettaglio, Dossier rifornimenti, Analisi economica
- Hub IA clone, Libretto IA, Documenti IA
- IA interna, Sessioni, Inbox documentale universale, Artifacts, Audit, modale report IA
- Libretti export
- Cisterna e Cisterna IA
- Autisti inbox, admin e app clone

## 7. Stato gap del perimetro attuale
- Nel perimetro oggi presente del clone/NEXT non restano gap aperti del sistema universale.
- I moduli target correnti consumano il payload `iaHandoff`, applicano prefill reale o stato da verificare e aggiornano il ciclo di consumo nel repository IA interno.

## 7.b Boundary fuori perimetro corrente
- Il live-read business lato backend IA resta volutamente fuori perimetro: non e un gap del clone/NEXT attuale, ma un confine architetturale ancora chiuso.

## 8. Regola architetturale vincolante
Da questo punto in poi:
- il registry totale del clone/NEXT e il catalogo ufficiale del perimetro IA;
- i domini gia chiusi non sono piu roadmap finale ma adapter sotto il gateway universale;
- ogni nuovo modulo del clone/NEXT entra nel sistema solo se registrato qui e conforme al contract standard adapter.
