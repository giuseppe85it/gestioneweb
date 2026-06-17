# STATO MIGRAZIONE NEXT

## 2026-06-17 - Segnalazioni operative allineate a Manutenzioni

Le superfici operative NEXT leggono ora le segnalazioni con lo stesso criterio della lista `Segnalazioni aperte` di `/next/manutenzioni`.

- Nuovo helper condiviso `src/next/helpers/segnalazioniOperative.ts`.
- Una segnalazione e' operativa solo se ha targa reale, non risulta chiusa (`chiusa`, `stato`, `chiusuraRefId`, `chiusuraData`) e non e' gia collegata a un lavoro (`linkedLavoroId`, `linkedLavoroIds`, `hasLinkedLavoro`).
- Home NEXT usa `counters.segnalazioniOperative` per la card e passa al modale solo `snapshot.segnalazioniOperative`.
- Centro Controllo Parity usa lo stesso filtro per tab `Segnalazioni autisti` e sinottica; il filtro `Solo nuove` non e' piu attivo di default.
- `/next/manutenzioni` usa lo stesso helper per `Segnalazioni aperte`, evitando divergenze future.
- Verifica browser locale: Home `Segnalazioni 5 da gestire`, modale con `5 risultati da dati reali`, Centro Controllo `Da gestire: 5`.
- Nessuna nuova scrittura o modifica alla madre legacy.

Stato: **HOME/CENTRO/MANUTENZIONI NEXT ALLINEATI SULLE SEGNALAZIONI OPERATIVE**.

## 2026-06-16 - Home NEXT modale Segnalazioni stile Centro rettifica

Il modale aperto dalla card `Segnalazioni` della Home NEXT `/next` e' stato riallineato al Centro rettifica dati.

- Il contenuto non usa piu il pannello visuale custom `next-home__seg-modal` come superficie principale, ma una finestra con classi `aix-backdrop aa-module-backdrop` e `aix-modal aa-module-window`.
- Il render resta via portal su `document.body`; il flusso della Home non contiene righe o gruppi segnalazioni.
- Righe, gruppi, toolbar e menu azioni sono compatti e coerenti con il modulo rettifica: ricerca targa con icona/placeholder, select `Tutti gli ambiti`, `Modifica` primaria, altre azioni nel menu.
- Su mobile la finestra occupa il viewport e usa scroll interno, evitando l'effetto di blocco sotto pagina.
- Nessuna nuova scrittura o modifica alla madre legacy.

Stato: **HOME NEXT PARZIALE, MODALE SEGNALAZIONI RIALLINEATO A RETTIFICA**.

## 2026-06-16 - Home NEXT contatori alti e modale segnalazioni

La Home NEXT `/next` mostra ora le 4 card contatore subito sotto `Dashboard`/data, prima di scadenze, manutenzioni e IA.

- La sola card cliccabile e' `Segnalazioni`: apre un modale NEXT dedicato, senza importare runtime `src/autistiInbox`.
- Il modale viene montato con portal su `document.body`, quindi resta overlay reale anche su mobile e non entra nel flusso verticale della Home.
- Il modale legge le segnalazioni reali gia normalizzate nello snapshot D10: filtri targa/ambito/solo nuove, gruppi `Nuove` e `Lette`, righe con data, autista, badge, ambito, motrice, rimorchio, stato, foto e descrizione.
- Azioni disponibili: `Modifica`, `Anteprima PDF`, `Crea lavoro`, `Elimina`.
- `Modifica` usa il nuovo writer `src/next/writers/nextHomeSegnalazioneAdminWriter.ts` e scrive solo `@segnalazioni_autisti_tmp` da `/next` con scope dedicato.
- `Crea lavoro` riusa il writer NEXT esistente verso `@manutenzioni`; `Elimina` riusa il writer NEXT esistente con delete foto sotto `autisti/segnalazioni/*`.
- Ogni azione scrivente chiede conferma prima di partire; apertura modale e filtri restano read-only.
- Madre legacy non toccata.

Stato: **HOME NEXT PARZIALE, MODALE SEGNALAZIONI ADMIN AGGIUNTO CON SCRITTURE CHIRURGICHE**.

## 2026-06-16 - Home NEXT targa dossier e mini scheda

La Home NEXT `/next` rimuove il widget basso duplicato `Manutenzioni da fare`: resta la card alta a destra con conteggi e prime righe operative.

- Nelle card luogo mezzi/rimorchi la targa e' ora il solo link verso il dossier NEXT `/next/dossier/:targa`.
- La riga flotta non apre piu Autisti Admin; `Modifica / Salva` resta separato e continua a usare il writer luogo gia aperto.
- Su hover/focus della targa appare una mini scheda read-only con categoria, foto mezzo se presente, autista abituale e sessione attiva.
- I dati della mini scheda derivano dallo snapshot D10 gia letto dalla Home: `@mezzi_aziendali` e `@autisti_sessione_attive` in sola lettura.
- `D10MezzoItem` espone ora `fotoUrl`, `fotoPath`, `fotoStoragePath` per permettere alla Home di mostrare la foto senza nuove query.
- Nessun writer, barrier, dataset di scrittura o madre legacy toccato.

Stato: **HOME NEXT PARZIALE, UI DOSSIER RAPIDA READ-ONLY AGGIUNTA**.

## 2026-06-16 - Home NEXT salva luogo mezzi/rimorchi

La Home NEXT `/next` non usa piu un overlay React temporaneo per il campo luogo di motrici e rimorchi liberi.

- Il pulsante `Modifica / Salva` chiama ora `src/next/writers/nextHomeLuogoMezzoWriter.ts`.
- La sola scrittura aperta e' `storageSync.setItemSync("@storico_eventi_operativi")` dal path `/next`, protetta dallo scope `NEXT_HOME_LUOGO_MEZZO_WRITE_SCOPE` in `src/utils/cloneWriteBarrier.ts`.
- Se la riga ha un evento sorgente, il writer aggiorna solo il campo `luogo` e preserva timestamp e resto payload.
- Se manca un evento sorgente, il writer crea un evento `CAMBIO_ASSETTO` admin con `source: "Home NEXT"`, coerente con la madre.
- Nessuna scrittura aperta su `@mezzi_aziendali`, `@alerts_state`, manutenzioni, inventario, procurement o altre card Home.
- La card `Mezzi attivi` usa conteggi reali da `readNextCentroControlloSnapshot()` invece dei valori fissi `12 / 15`.
- Il reader procurement della Home usa `includeCloneOverlays: false`.

Stato: **HOME NEXT PARZIALE, SCRITTURA LUOGO MEZZO APERTA IN MODO CHIRURGICO**.

## 2026-06-10 - Resolver immagine mezzo nel Dettaglio gomme

Il Dettaglio manutenzione gomme ora sceglie l'immagine mezzo seguendo la stessa fonte usata da Gomme Autisti: `src/components/wheels.ts` e la regola equivalente a `resolveWheelGeomKey(categoria)`.

- La categoria viene risolta solo da campi categoria strutturati (`mezzoInfo.categoria`, `categoria`, `categoriaMezzo`, `tipoMezzo`, `targetType`), non da descrizioni libere.
- `mezzoInfo.categoria` viene usata solo se la targa di `mezzoInfo` coincide con la targa del record selezionato; questo evita che un record rimorchio erediti la categoria del trattore della pagina.
- L'ordine di mappatura replica Gomme Autisti: motrice 4/3/2 prima di trattore, poi rimorchi/categorie specifiche.
- Se la categoria e' riconosciuta, il Dettaglio mostra sempre entrambe le viste `wheelGeom` della stessa categoria: DX in alto e SX in basso.
- Il lato eventualmente riconosciuto resta informazione di contesto, ma non limita la visualizzazione a una sola immagine.
- Il fallback generico resta solo quando manca anche la categoria/`wheelGeomKey`; i record con testo `LATO SX` non possono mostrare asset DX.
- Nessuna maschera gomma viene accesa e nessuna posizione interna/esterna viene dedotta.
- Nessun writer, domain, barrier, Firestore, Storage o madre legacy toccato.

Stato: **DETTAGLIO GOMME - IMMAGINE MEZZO RISOLTA, MASCHERE NON ATTIVE**.

Nota 2026-06-10: il box debug temporaneo del resolver e' stato rimosso dal Dettaglio gomme dopo la verifica della mappatura.

## 2026-06-10 - Schema gomme integrato nel Dettaglio manutenzione

Il Dettaglio manutenzione di `/next/manutenzioni` mostra ora una sezione visuale gomme quando il record selezionato e' una manutenzione gomme.

- Punto di integrazione: `NextManutenzioniPage` -> view `mappa` -> `NextMappaStoricoPage`.
- Layout derivato dal mock `.pen` validato: area gialla, schema mezzo a sinistra, card dati intervento a destra.
- Base visuale usata: `docs/mockups/schema delle gomme_neutra.png`.
- Maschere validate elencate solo come preview tecnica: anteriore DX, posteriore DX esterna, posteriore DX interna.
- Le maschere precise non vengono accese dai dati reali, perche' `@manutenzioni` oggi distingue asse/tipo/km/motivo/quantita ma non singola posizione pneumatico.
- Nessun writer, domain, barrier, Firestore, Storage o madre legacy toccato.

Stato: **UI DETTAGLIO GOMME INTEGRATA - POSIZIONI SINGOLE NON DEDOTTE**.

## 2026-06-08 - Demo tecnica gomme dinamiche

Creata demo tecnica isolata per validare la visualizzazione gomme dinamica prima dell'integrazione nel Dettaglio Manutenzioni.

- Route temporanea: `/next/dev/gomme-demo`.
- Etichetta visibile: `DEMO TECNICA - NON MODULO`.
- Componente: `src/next/components/TyreVehicleView.tsx`.
- CSS: `src/next/components/tyreVehicleView.css`.
- Nessun dato business letto o scritto.
- Nessuna integrazione in `NextMappaStoricoPage`.
- Nessun writer, domain, barrier o Firestore toccato.
- Pencil non usato: resta solo riferimento mock.

Stato: **DEMO TECNICA ISOLATA**.

## 2026-06-09 - Correzione demo gomme bocciata

La demo `/next/dev/gomme-demo` e' stata corretta senza integrazione nel Dettaglio reale.

- Aggiunta sezione principale `Preview approvazione effetto`.
- Camion mostrato piu' grande per valutare il colore dei pneumatici.
- Maschere SVG rese piu' piene e aderenti alla gomma, con foro centrale per lasciare visibile il cerchione.
- Stato `replaced` rosso; stato `default` grigio/nero scuro; stato `neutral` quasi invisibile.
- Nessun dato business letto o scritto.
- Nessun writer, domain, barrier, Dettaglio reale o asset `public/gomme/*` toccato.

Stato: **DEMO TECNICA ISOLATA - IN CORREZIONE VISIVA**.

## 2026-06-09 - Cambio metodo demo gomme: ruote vettoriali

La demo `/next/dev/gomme-demo` e' stata rifatta cambiando metodo:

- Il PNG camion resta base neutra.
- Ogni ruota visibile viene ricostruita sopra il PNG come SVG dinamico completo.
- Il pneumatico e' un elemento pieno colorabile via stato.
- Cerchione, mozzo e bulloni sono ridisegnati sopra il pneumatico.
- `replaced` usa pneumatico rosso; `default` usa pneumatico grigio/nero scuro; `neutral` non ridisegna ruote.
- Nessun PNG rosso fisso creato.
- Nessun dato business letto o scritto.
- Nessuna integrazione nel Dettaglio reale.

Stato: **DEMO TECNICA ISOLATA - RUOTE VETTORIALI DINAMICHE**.

## 2026-06-09 - Soluzione demo gomme con maschere da reference

La demo `/next/dev/gomme-demo` e' stata aggiornata alla soluzione finale richiesta:

- Asset neutro usato: `public/gomme/trattore_cisternaDX.png`.
- Reference approvata usata: `docs/mockups/gomme-assets/camion_reference_gomme_colorate.png`.
- Tool creato: `scripts/extract-gomme-reference-masks.mjs`.
- Maschere generate:
  - `docs/mockups/gomme-assets/mask_front_right.png`
  - `docs/mockups/gomme-assets/mask_rear_right_outer.png`
  - `docs/mockups/gomme-assets/trattore_cisternaDX_masks_manifest.json`
- `TyreVehicleView` non disegna piu' ruote SVG finte: applica colore dinamico tramite maschere PNG full-size.
- Nessun dato business letto o scritto.
- Nessuna integrazione nel Dettaglio reale.

Stato: **DEMO TECNICA ISOLATA - MASCHERE DA REFERENCE**.

## 2026-06-09 - Pacchetto completo maschere trattore cisterna DX

Esteso il pacchetto maschere per tutte le gomme visibili del modello `trattore_cisternaDX.png`.

- Tool aggiornato: `scripts/extract-gomme-reference-masks.mjs`.
- Maschere disponibili:
  - `mask_front_right.png`
  - `mask_rear_right_outer.png`
  - `mask_rear_right_inner.png`
- La maschera posteriore e' stata separata in faccia esterna e porzione interna/laterale, sempre partendo dalla reference approvata.
- La demo `/next/dev/gomme-demo` usa tutte le maschere con colore dinamico da stato.
- Metodo invariato: base neutra, maschere pneumatico, nessun PNG finale colorato, nessun cerchio/marker/ruota finta.

Stato: **DEMO TECNICA ISOLATA - PACCHETTO MASCHERE DX COMPLETO**.

## 2026-06-09 - Logica completa combinazioni trattore cisterna DX

La demo `/next/dev/gomme-demo` ora distingue le 6 gomme logiche del trattore cisterna:

- `front_right`
- `front_left`
- `rear_right_outer`
- `rear_right_inner`
- `rear_left_outer`
- `rear_left_inner`

Nella vista `trattore_cisternaDX.png` sono renderizzate solo le maschere visibili DX:

- `front_right`
- `rear_right_outer`
- `rear_right_inner`

Gli scenari demo coprono straordinari singoli, coppia gemellata destra, ordinario asse anteriore DX+SX, ordinario asse posteriore DX+SX, ordinario completo e dato incompleto senza posizione. Metodo invariato: camion neutro, maschere pneumatico, colore dinamico da stato.

## 2026-06-09 - Recovery DX: maschere separate da logica

La demo `trattore_cisternaDX` e' stata ripulita separando:

- debug maschera singola, con tutte le altre gomme DX neutre;
- combinazioni ordinarie, con stato logico completo DX+SX;
- caso dato incompleto, senza colorare posizioni inventate.

Il manifest DX resta limitato alle sole gomme visibili `front_right`, `rear_right_outer`, `rear_right_inner`. Le gomme SX sono solo stato logico futuro e non sono renderizzate nella vista DX.

## 2026-06-09 - Pipeline reference -> maschere DX

La demo `/next/dev/gomme-demo` ora usa una pipeline esplicita per `trattore_cisternaDX`:

- `scripts/generate-trattore-cisterna-dx-references.mjs` crea le tre reference singole da `public/gomme/trattore_cisternaDX.png`;
- `scripts/build-tyre-masks-from-reference.mjs` estrae i pixel rossi e genera le tre maschere runtime;
- gli asset vivono in `docs/mockups/gomme-assets/trattore_cisternaDX/`;
- la demo mostra reference, maschera e rendering dinamico per `front_right`, `rear_right_outer`, `rear_right_inner`.

Il runtime resta invariato nel metodo: PNG neutro sotto, maschere sopra, colore dinamico da stato. Nessuna integrazione nel Dettaglio Manutenzioni, nessun dato business letto o scritto.

## 2026-06-10 - Demo combinazioni SVG trattore cisterna DX

La route `/next/dev/gomme-demo` e' stata ricondotta a una demo tecnica interattiva per il modello `public/gomme/trattore_cisternaDX.png`.

- riferimento visuale letto: `docs/mockups/schema delle gomme.png`;
- maschere SVG indipendenti: `anterioreDxBattistrada`, `posterioreDxEsternaBattistrada`, `posterioreDxInternaBattistrada`;
- controlli: checkbox singole e preset `Nessuna`, `Solo anteriore`, `Solo esterna`, `Solo interna`, `Gemellato completo`, `Tutte`;
- sezione combinazioni: tutte le 8 combinazioni possibili delle tre gomme DX.

La demo resta isolata: nessuna integrazione nel Dettaglio Manutenzioni, nessun dato business letto o scritto.

## 2026-06-10 - Demo gomme da schema colorato

La demo `/next/dev/gomme-demo` ora usa lo schema colorato come fonte geometrica unica:

- input colorato: `docs/mockups/schema delle gomme.png` (`1450x1085`);
- base neutra generata: `docs/mockups/schema delle gomme_neutra.png` (`1450x1085`);
- maschere generate dai colori: `schema_gomme_mask_anteriore_dx.png`, `schema_gomme_mask_posteriore_dx_esterna.png`, `schema_gomme_mask_posteriore_dx_interna.png`.

Questa versione non usa `public/gomme/trattore_cisternaDX.png` come base per le maschere, per evitare disallineamenti geometrici. La demo resta isolata e non legge/scrive dati business.
