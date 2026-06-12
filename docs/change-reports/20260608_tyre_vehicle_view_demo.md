# Change Report - Demo TyreVehicleView

## Perimetro

Demo tecnica isolata per validare la visualizzazione dinamica del battistrada gomme.

## File runtime toccati

- `src/next/components/TyreVehicleView.tsx`
- `src/next/components/tyreVehicleView.css`
- `src/next/NextTyreVehicleViewDemoPage.tsx`
- `src/App.tsx`

## Cosa cambia

- Aggiunto componente riutilizzabile `TyreVehicleView`.
- Il componente renderizza un PNG neutro da `public/gomme/*`.
- Sopra il PNG disegna path SVG con `fillRule="evenodd"` per colorare il pneumatico lasciando visibile il cerchione.
- Aggiunta route tecnica temporanea `/next/dev/gomme-demo`.
- La pagina demo mostra quattro stati statici: ordinario, straordinario, dati mancanti, asse completo.

## Cosa non cambia

- Nessuna integrazione nel Dettaglio Manutenzioni reale.
- Nessuna lettura o scrittura Firestore.
- Nessun writer toccato.
- Nessun domain business toccato.
- Nessuna modifica a `public/gomme/*`.
- Nessun uso di Pencil.

## Verifica

- Gate richiesto: `npm run build`.

## Correzione 2026-06-09 - Prompt 2A

La prima versione della demo e' stata bocciata perche' le gomme sembravano ancora marker o ciambelle sopra la ruota.

Correzioni applicate solo alla demo:

- Aggiunta sezione `Preview approvazione effetto` come vista principale grande.
- Aumentata la dimensione del camion nelle card demo.
- Aggiunto supporto a `treadPath` espliciti per maschere pneumatico regolabili.
- Rese piu' piene le maschere delle gomme: rosso su pneumatico sostituito, grigio/nero sulle altre gomme.
- Ridotti stroke e bordi per evitare l'effetto marker.
- Mantenuto foro centrale per lasciare visibile il cerchione.

Perimetro invariato:

- Nessuna integrazione nel Dettaglio Manutenzioni reale.
- Nessun writer/domain/barrier toccato.
- Nessun dato business letto o scritto.
- Nessuna modifica agli asset `public/gomme/*`.

Verifica:

- `npm run build` verde.

## Correzione 2026-06-09 - Prompt 2B

La soluzione a maschere/anelli sopra il PNG e' stata sostituita.

Nuovo metodo applicato solo alla demo:

- Il PNG camion resta base neutra.
- `TyreVehicleView` disegna ogni ruota come SVG completo tramite sotto-componente interno `VectorTyreWheel`.
- Il pneumatico e' un elemento pieno colorabile dinamicamente.
- Cerchione, mozzo e bulloni sono ridisegnati sopra il pneumatico.
- `neutral` non ridisegna la ruota.
- La pagina demo conserva `Preview approvazione effetto` come sezione principale.

Perimetro invariato:

- Nessuna integrazione nel Dettaglio Manutenzioni reale.
- Nessun writer/domain/barrier toccato.
- Nessun dato business letto o scritto.
- Nessuna modifica agli asset `public/gomme/*`.
- Nessun PNG rosso fisso creato.

Verifica:

- `npm run build` verde.
- Controllo visivo su `/next/dev/gomme-demo`: ruote SVG complete con cerchione ridisegnato sopra il pneumatico.

## Correzione 2026-06-09 - Maschere da reference

La soluzione a ruote SVG ridisegnate e' stata sostituita dalla soluzione richiesta con maschere estratte.

Nuovo metodo:

- Sorgente neutra: `public/gomme/trattore_cisternaDX.png`.
- Sorgente reference: `docs/mockups/gomme-assets/camion_reference_gomme_colorate.png`.
- Tool: `scripts/extract-gomme-reference-masks.mjs`.
- Output maschere:
  - `docs/mockups/gomme-assets/mask_front_right.png`
  - `docs/mockups/gomme-assets/mask_rear_right_outer.png`
- `TyreVehicleView` usa il camion neutro sotto e rettangoli colorati mascherati sopra.
- Il colore e' dinamico da stato: `replaced`, `default`, `neutral`.

Perimetro invariato:

- Nessuna integrazione nel Dettaglio Manutenzioni reale.
- Nessun writer/domain/barrier toccato.
- Nessun dato business letto o scritto.
- Nessuna modifica agli asset `public/gomme/*`.
- Nessun PNG rosso fisso per combinazioni.

## Aggiornamento 2026-06-09 - Pacchetto completo DX

Estesa la soluzione mantenendo il metodo approvato.

- Lo script `scripts/extract-gomme-reference-masks.mjs` genera ora 3 maschere:
  - `mask_front_right.png`
  - `mask_rear_right_outer.png`
  - `mask_rear_right_inner.png`
- La reference approvata contiene due aree rosse; la porzione posteriore viene separata in due maschere distinte usando solo i pixel della reference.
- La demo usa tutte le maschere del modello DX con colore dinamico da stato.

Invariato:

- camion neutro come base;
- nessun cerchio, marker o ruota finta;
- nessun PNG finale colorato;
- nessuna integrazione nel Dettaglio reale;
- nessun dato business letto o scritto.

## Aggiornamento 2026-06-09 - Logica combinazioni DX

La demo `trattore_cisternaDX` ora usa ID logici gomme con underscore:

- `front_right`
- `front_left`
- `rear_right_outer`
- `rear_right_inner`
- `rear_left_outer`
- `rear_left_inner`

Regola ordinario per asse:

- `anteriore` -> `front_right`, `front_left`
- `posteriore` -> `rear_right_outer`, `rear_right_inner`, `rear_left_outer`, `rear_left_inner`

La vista DX renderizza solo le maschere visibili (`front_right`, `rear_right_outer`, `rear_right_inner`). Gli scenari straordinari posteriori usano fallback neutro sulla gemella non coinvolta per evitare due colori sulla stessa gomma. Lo scenario con dato incompleto non colora nessuna posizione specifica.

Il manifest `trattore_cisternaDX_masks_manifest.json` ora espone `image`, `side`, `visibleTyres` e `tyreMasks` con `tyreId`, `axisId`, `side`, `position`, `mask`.

## Aggiornamento 2026-06-09 - Recovery DX

La demo e' stata recuperata separando verifica visuale e logica:

- `Debug maschera - anteriore destra`: solo `front_right` visibile.
- `Debug maschera - posteriore destra esterna`: solo `rear_right_outer` visibile.
- `Debug maschera - posteriore destra interna`: solo `rear_right_inner` visibile.
- `Straordinario - coppia gemellata destra`: rosse solo le due posteriori DX.
- Ordinari: stato logico completo DX+SX, rendering limitato alla vista DX.
- Dato incompleto: nessuna gomma colorata.

Il manifest DX contiene solo `front_right`, `rear_right_outer`, `rear_right_inner` come gomme visibili.

## Aggiornamento 2026-06-09 - Pipeline reference create da Codex

Sono stati aggiunti due script dedicati al modello `trattore_cisternaDX`:

- `scripts/generate-trattore-cisterna-dx-references.mjs`: genera da `public/gomme/trattore_cisternaDX.png` le reference rosse singole per `front_right`, `rear_right_outer`, `rear_right_inner`;
- `scripts/build-tyre-masks-from-reference.mjs`: estrae i pixel rossi dalle reference e crea le tre maschere runtime nella sottocartella `docs/mockups/gomme-assets/trattore_cisternaDX/`.

La demo `/next/dev/gomme-demo` mostra per ogni gomma DX:

- reference creata;
- maschera estratta;
- rendering dinamico con PNG neutro e colore da stato.

La logica ordinaria mantiene le gomme SX nello stato logico, ma nella vista DX renderizza solo le tre maschere presenti nel manifest DX.
