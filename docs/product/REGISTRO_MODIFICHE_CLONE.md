# REGISTRO MODIFICHE CLONE

## 2026-06-16 1615

DATA: `2026-06-16`
TITOLO: `Home NEXT targa dossier`
FILE TOCCATI: `src/next/NextHomePage.tsx`, `src/next/domain/nextCentroControlloDomain.ts`, `src/next/next-home.css`
COSA: Rimossa la seconda card bassa `Manutenzioni da fare`. La targa nelle card luogo mezzi/rimorchi apre il dossier NEXT e mostra su hover/focus una mini scheda read-only con foto, categoria, autista e sessione attiva.
ESITO: `FATTO`
NOTE: Nessuna nuova scrittura, nessun barrier/writer/madre toccato.

## 2026-06-10 1615

DATA: `2026-06-10`
TITOLO: `Doppia vista DX SX Dettaglio gomme`
FILE TOCCATI: `src/next/NextMappaStoricoPage.tsx`, `src/next/next-mappa-storico.css`, `docs/product/STATO_MIGRAZIONE_NEXT.md`, `docs/product/REGISTRO_MODIFICHE_CLONE.md`
COSA: Nel Dettaglio gomme, quando la categoria mezzo e' risolta, vengono mostrate entrambe le immagini `wheelGeom` della stessa categoria: DX sopra e SX sotto. Il fallback generico resta solo se manca la categoria.
ESITO: `FATTO`
NOTE: `npm run build` OK. Nessuna maschera accesa, nessun writer/domain/barrier/dato business toccato.

## 2026-06-10 1605

DATA: `2026-06-10`
TITOLO: `Rimozione debug resolver Dettaglio gomme`
FILE TOCCATI: `src/next/NextMappaStoricoPage.tsx`, `src/next/next-mappa-storico.css`, `docs/product/STATO_MIGRAZIONE_NEXT.md`, `docs/product/REGISTRO_MODIFICHE_CLONE.md`
COSA: Rimosso dal Dettaglio gomme il box debug visibile del resolver immagine e i relativi stili CSS dedicati. La logica resolver e la scelta immagine restano invariate.
ESITO: `FATTO`
NOTE: `npm run build` OK. Nessuna maschera accesa, nessun writer/domain/barrier/dato business toccato.

## 2026-06-10 1545

DATA: `2026-06-10`
TITOLO: `Resolver immagine mezzo Dettaglio gomme allineato ad Autisti`
FILE TOCCATI: `src/next/NextMappaStoricoPage.tsx`, `src/next/next-mappa-storico.css`, `docs/product/STATO_MIGRAZIONE_NEXT.md`, `docs/product/REGISTRO_MODIFICHE_CLONE.md`
COSA: Il Dettaglio gomme usa la stessa mappa di Gomme Autisti (`wheelGeom` + regola categoria equivalente a `resolveWheelGeomKey`) e mostra un box debug con categoria/key/lato/path/fallback. Se la categoria e' nota ma il lato manca, usa la vista DX della categoria come default dichiarato, non il fallback generico.
ESITO: `FATTO`
NOTE: `npm run build` OK. Nessuna maschera accesa, nessuna deduzione interna/esterna, nessun writer/domain/barrier/dato business toccato.

## 2026-06-10 1525

DATA: `2026-06-10`
TITOLO: `Schema gomme nel Dettaglio manutenzione`
FILE TOCCATI: `src/next/NextMappaStoricoPage.tsx`, `src/next/next-mappa-storico.css`, `docs/product/STATO_MIGRAZIONE_NEXT.md`, `docs/product/REGISTRO_MODIFICHE_CLONE.md`
COSA: Integrata nel Dettaglio gomme una sezione derivata dal mock `.pen`: schema mezzo neutro, card dati intervento e maschere validate solo come preview tecnica non derivata dai dati reali.
ESITO: `FATTO`
NOTE: `npm run build` OK; verificata apertura record gomme, record non-gomme e `/next/dev/gomme-demo`. Nessuna posizione singola inventata, nessun writer/domain/barrier/dato business toccato.

## 2026-06-08 0000

DATA: `2026-06-08`
TITOLO: `Demo isolata TyreVehicleView`
FILE TOCCATI: `src/next/components/TyreVehicleView.tsx`, `src/next/components/tyreVehicleView.css`, `src/next/NextTyreVehicleViewDemoPage.tsx`, `src/App.tsx`
COSA: Creata route temporanea `/next/dev/gomme-demo` per validare PNG neutro + overlay SVG dinamico del battistrada gomme. Demo senza lettura/scrittura dati business e senza integrazione nel Dettaglio reale.
ESITO: `FATTO`
NOTE: Pencil non usato; nessun writer/domain/barrier toccato.

## 2026-06-09 0000

DATA: `2026-06-09`
TITOLO: `Correzione demo TyreVehicleView bocciata`
FILE TOCCATI: `src/next/components/TyreVehicleView.tsx`, `src/next/components/tyreVehicleView.css`, `src/next/NextTyreVehicleViewDemoPage.tsx`
COSA: Corretta solo la demo `/next/dev/gomme-demo`: preview approvazione grande, camion piu' leggibile, maschere pneumatico piu' piene con foro cerchione visibile e colori rosso/scuro senza effetto marker.
ESITO: `FATTO`
NOTE: Nessuna integrazione nel Dettaglio reale; nessun dato business letto o scritto.

## 2026-06-09 0010

DATA: `2026-06-09`
TITOLO: `Demo gomme con ruote vettoriali dinamiche`
FILE TOCCATI: `src/next/components/TyreVehicleView.tsx`, `src/next/components/tyreVehicleView.css`, `src/next/NextTyreVehicleViewDemoPage.tsx`
COSA: Rifatta la demo `/next/dev/gomme-demo` cambiando metodo: il PNG camion resta neutro e sopra ogni ruota viene disegnata una ruota SVG completa con pneumatico pieno colorabile, cerchione, mozzo e bulloni.
ESITO: `FATTO`
NOTE: Nessuna integrazione nel Dettaglio reale; nessun PNG rosso fisso; nessun dato business letto o scritto.

## 2026-06-09 0020

DATA: `2026-06-09`
TITOLO: `Demo gomme con maschere estratte da reference`
FILE TOCCATI: `scripts/extract-gomme-reference-masks.mjs`, `docs/mockups/gomme-assets/*`, `src/next/components/TyreVehicleView.tsx`, `src/next/components/tyreVehicleView.css`, `src/next/NextTyreVehicleViewDemoPage.tsx`
COSA: Creata estrazione maschere dal confronto tra `public/gomme/trattore_cisternaDX.png` e reference approvata. La demo applica colore dinamico solo sulle maschere pneumatico generate.
ESITO: `FATTO`
NOTE: Build verde e controllo visivo su `/next/dev/gomme-demo`; nessuna ruota SVG inventata, nessun marker, nessun dato business letto o scritto.

## 2026-06-09 0030

DATA: `2026-06-09`
TITOLO: `Pacchetto maschere gomme DX completo`
FILE TOCCATI: `scripts/extract-gomme-reference-masks.mjs`, `docs/mockups/gomme-assets/*`, `src/next/NextTyreVehicleViewDemoPage.tsx`
COSA: Estesa l'estrazione maschere per il modello `trattore_cisternaDX.png`: il posteriore viene separato in esterna e interna/laterale, oltre alla maschera anteriore.
ESITO: `FATTO`
NOTE: Build verde e controllo visivo su `/next/dev/gomme-demo`; metodo approvato invariato.

## 2026-06-09 0040

DATA: `2026-06-09`
TITOLO: `Logica combinazioni gomme trattore cisterna DX`
FILE TOCCATI: `src/next/NextTyreVehicleViewDemoPage.tsx`, `src/next/components/tyreVehicleView.css`, `scripts/extract-gomme-reference-masks.mjs`, `docs/mockups/gomme-assets/trattore_cisternaDX_masks_manifest.json`
COSA: Demo aggiornata con 6 gomme logiche, rendering delle sole 3 visibili in DX e casi obbligatori per straordinario, ordinario per asse e dati incompleti senza posizione.
ESITO: `FATTO`
NOTE: Build verde e controllo visivo su `/next/dev/gomme-demo`; metodo maschere invariato, nessuna integrazione nel Dettaglio reale.

## 2026-06-09 0050

DATA: `2026-06-09`
TITOLO: `Recovery demo maschere DX`
FILE TOCCATI: `src/next/NextTyreVehicleViewDemoPage.tsx`, `scripts/extract-gomme-reference-masks.mjs`, `docs/mockups/gomme-assets/*`
COSA: Recuperata la demo separando debug maschera singola da combinazioni ordinarie. Nei debug le altre gomme DX sono neutre; ordinari mantengono stato logico DX+SX ma renderizzano solo DX.
ESITO: `FATTO`
NOTE: Build verde e controllo visivo su `/next/dev/gomme-demo`; metodo maschere invariato, nessun Dettaglio reale, writer, domain o dati business toccati.

## 2026-06-09 1625

DATA: `2026-06-09`
TITOLO: `Pipeline reference maschere gomme DX`
FILE TOCCATI: `scripts/generate-trattore-cisterna-dx-references.mjs`, `scripts/build-tyre-masks-from-reference.mjs`, `docs/mockups/gomme-assets/trattore_cisternaDX/*`, `src/next/NextTyreVehicleViewDemoPage.tsx`, `src/next/components/tyreVehicleView.css`
COSA: Creata pipeline DX: reference singole generate da PNG neutro, maschere estratte dai pixel rossi e demo con reference/maschera/rendering dinamico.
ESITO: `FATTO`
NOTE: Build verde e controllo visivo su `/next/dev/gomme-demo`; nessuna integrazione nel Dettaglio reale, nessun dato business letto o scritto.

## 2026-06-10 0005

DATA: `2026-06-10`
TITOLO: `Demo combinazioni maschere SVG gomme DX`
FILE TOCCATI: `src/next/NextTyreVehicleViewDemoPage.tsx`, `src/next/components/tyreVehicleView.css`, `docs/product/STATO_MIGRAZIONE_NEXT.md`, `docs/product/REGISTRO_MODIFICHE_CLONE.md`
COSA: Demo `/next/dev/gomme-demo` aggiornata con overlay SVG interattivo su `trattore_cisternaDX.png`, 3 maschere battistrada indipendenti, checkbox, preset e tutte le 8 combinazioni.
ESITO: `FATTO`
NOTE: Build verde; nessuna integrazione nel Dettaglio reale, nessun dato business letto o scritto.

## 2026-06-10 0025

DATA: `2026-06-10`
TITOLO: `Demo gomme con base neutra da schema colorato`
FILE TOCCATI: `docs/mockups/*`, `src/next/NextTyreVehicleViewDemoPage.tsx`, `docs/product/STATO_MIGRAZIONE_NEXT.md`, `docs/product/REGISTRO_MODIFICHE_CLONE.md`
COSA: Creata `schema delle gomme_neutra.png` dalla stessa geometria del mockup colorato e generate tre maschere da rosso/blu/giallo. La demo usa la neutra e applica overlay colore da mask PNG in SVG.
ESITO: `FATTO`
NOTE: Build verde e controllo browser su `/next/dev/gomme-demo`; preset `Gemellato completo` e `Tutte` verificati.

## 2026-06-16 1502

DATA: `2026-06-16`
TITOLO: `Home NEXT salva luogo mezzi`
FILE TOCCATI: `src/next/NextHomePage.tsx`, `src/next/writers/nextHomeLuogoMezzoWriter.ts`, `src/utils/cloneWriteBarrier.ts`
COSA: Il pulsante Modifica/Salva del luogo motrici/rimorchi scrive ora solo `@storico_eventi_operativi`, aggiornando `luogo` sull'evento esistente o creando un `CAMBIO_ASSETTO` admin coerente con la madre. Rimosso il falso overlay locale e sostituita la card mezzi fissa con conteggi reali.
ESITO: `FATTO`
NOTE: Lint mirato, test writer 6/6 e build canonica OK; verifica browser live solo non distruttiva.
