# MATRICE COPERTURA UNIVERSALE IA NEXT

## 1. Scopo
Questa matrice descrive cosa il sistema universale del clone/NEXT assorbe davvero oggi e conferma che, nel perimetro attuale del clone, non restano gap aperti sotto il livello del target universale.

## 2. Matrice adapter -> copertura reale
| Adapter | Dominio | Entita principali | Hook UI principali | Coverage | Trust | Capability riusate | Gap principale |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `adapter.d01` | Flotta / dossier identita mezzo | targa, mezzo, dossier | mezzi, dossier, libretto | Assorbito | Alta | preview mezzo, preview libretto | Mezzi/Dossier consumano `iaHandoff` e aprono il contesto corretto |
| `adapter.d02` | Lavori / manutenzioni / gomme | targa, mezzo, evento operativo | manutenzioni, lavori, dossier | Assorbito | Alta | preview mezzo | Nessun gap aperto nel perimetro attuale |
| `adapter.d03` | Autisti / badge / colleghi | autista, badge, evento operativo | autisti inbox/admin/app | Assorbito | Media | preview autista | Inbox/Admin consumano `iaHandoff`; app autisti resta esperienza separata fuori target chat |
| `adapter.d04` | Rifornimenti / consumi | targa, mezzo, autista, badge | dossier rifornimenti, dossier | Assorbito | Media | preview mezzo | Nessun gap aperto nel perimetro attuale |
| `adapter.d05` | Magazzino reale / materiali | materiale, mezzo, targa | operativita, inventario, materiali | Assorbito | Media | repo-understanding | Inventario e materiali consumano `iaHandoff` con prefill reale |
| `adapter.d06` | Procurement / ordini / fornitori | fornitore, ordine, documento, materiale | acquisti, ordini attesa/arrivi | Assorbito | Media | preview preventivi, extraction legacy mappata | Acquisti, ordini e dettaglio consumano `iaHandoff` e applicano filtri/prefill |
| `adapter.d07d08` | Documenti / costi / analisi economica | documento, targa, mezzo, fornitore | documenti IA, analisi, dossier | Assorbito | Media | preview documenti, analisi legacy mappata | Documenti IA consuma `iaHandoff`; nessun gap aperto nel router documenti |
| `adapter.d09` | Cisterna | cisterna, documento, targa | cisterna, cisterna IA | Assorbito | Media | extraction cisterna legacy mappata | Cisterna IA consuma `iaHandoff`; verticale read-only per scelta, non per gap |
| `adapter.d10` | Centro di Controllo / stato operativo | targa, mezzo, evento operativo, autista | home, centro controllo | Assorbito | Alta | preview mezzo, retrieval clone-seeded | Nessun gap aperto nel perimetro attuale |
| `adapter.repo` | Registry tecnico / repo understanding | modulo, documento | IA interna, audit | Assorbito | Alta | repo-understanding backend | Non sostituisce il registry totale business/UI |
| `adapter.universal` | Gateway chat/request/orchestration | tutte le entita forti del seed | IA interna, inbox richieste, artifacts | Assorbito | Media | chat backend, retrieval clone-seeded, preview clone | Nessun gap aperto nel perimetro attuale del clone/NEXT |

## 3. Scenari architetturali gia coperti davvero
1. Richiesta libera su `mezzo / targa`
   - il sistema risolve la targa, seleziona `D01 + D10` e aggiunge `D02`, `D04`, `D07/D08`, `D05` o `D06` se il testo lo richiede
   - l'action intent principale apre il dossier del clone quando il prompt resta mezzo-centrico
2. Richiesta libera su `autista / badge`
   - il resolver usa il catalogo autisti clone-safe badge-first
   - il sistema seleziona `D03` e gli adapter collegati dal testo
3. Richiesta libera su `fornitore / ordine / preventivo`
   - il resolver usa il catalogo fornitori clone-safe
   - il request resolver porta la richiesta su `D06` e riusa le capability preventivi gia presenti
4. File o allegato nel thread
   - il document router distingue almeno `libretto_mezzo`, `preventivo_fornitore`, `documento_cisterna`, `documento_mezzo`, `tabella_materiali`, `testo_operativo`, `immagine_generica`, `documento_ambiguo`
   - ogni classificazione produce route target, `iaHandoff`, prefill canonico, action intent clone-safe e, se serve, inbox documentale universale
5. Domanda su repo, route, flussi o integrazioni
   - il request resolver seleziona `adapter.repo`
   - il sistema riusa la capability `backend.repo-understanding`

## 4. Stato finale del perimetro attuale
1. Nel perimetro oggi presente del clone/NEXT non restano gap aperti end-to-end del sistema universale.
2. Il live-read business lato backend IA resta correttamente chiuso, ma e un boundary fuori perimetro e non un gap del clone/NEXT attuale.

## 5. Regola di lettura della matrice
- `Assorbito` significa che il dominio esiste gia come adapter sotto il sistema universale e che handoff, routing e governance minima sono attivi.
- `Parziale` resta una categoria prevista dal contract, ma oggi non rimane aperta nei moduli del perimetro universale corrente.
- Nessun dominio va piu presentato come obiettivo finale isolato.
