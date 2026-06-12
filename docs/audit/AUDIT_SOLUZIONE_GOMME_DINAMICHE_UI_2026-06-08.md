# AUDIT SOLUZIONE GOMME DINAMICHE UI - 2026-06-08

## 1. Scopo

Questo audit verifica come ottenere nella UI reale del Dettaglio Manutenzioni gomme l'effetto visivo approvato: pneumatico/battistrada colorato direttamente, non marker, pallini, anelli esterni o mezze lune sopra la ruota.

Pencil non e' la soluzione tecnica finale. Pencil resta solo mock layout e riferimento visivo. La UI reale deve produrre colore dinamico in base ai dati del record gomme:

- base camion neutra;
- rosso solo sulla gomma sostituita;
- nero/grigio scuro sulle altre gomme del mezzo, quando serve mostrarle;
- cerchione centrale visibile;
- nessun simbolo alternativo sopra la ruota;
- resa simile alla reference approvata, dove il pneumatico sembra realmente colorato.

Questo audit non modifica runtime, React, CSS, immagini, writer, domain o barrier.

## 2. Fonti lette

Documenti:

- `docs/plan/PIANO_FLUSSI_UI_GOMME_MANUTENZIONI_NEXT_2026-06-08.md`
- `docs/audit/AUDIT_SCHEMA_IMPORT_GOMME_MANUTENZIONI_NEXT_2026-06-08.md`

Codice:

- `src/components/wheels.ts`
- `src/components/TruckGommeSvg.tsx`
- `src/next/autisti/NextModalGomme.tsx`
- `src/next/NextMappaStoricoPage.tsx`
- `src/next/NextManutenzioniPage.tsx`
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/next/domain/nextMappaStoricoDomain.ts`
- `src/next/next-mappa-storico.css`

Asset:

- tutti i file sotto `public/gomme/*`
- asset correlati trovati: `public/cisterna.png`, `public/header_camion.png`

## 3. Asset attuali

### 3.1 Immagini disponibili

Tutte le immagini tecniche gomme sotto `public/gomme/` sono PNG:

| Categoria / key | Vista DX | Vista SX | Formato | Note |
| --- | --- | --- | --- | --- |
| `biga` | `public/gomme/bigaDX.png` | `public/gomme/bigaSX.png` | PNG | line-art |
| `motrice2assi` | `public/gomme/motrice2assiDX.png` | `public/gomme/motrice2assiSx.png` | PNG | line-art |
| `motrice3assi` | `public/gomme/motrice3assiDX.png` | `public/gomme/motrice3assiSX.png` | PNG | line-art |
| `motrice4assi` | `public/gomme/motrice4assiDX.png` | `public/gomme/motrice4assiSX.png` | PNG | line-art |
| `pianale` | `public/gomme/pianaleDX.png` | `public/gomme/pianaleSX.png` | PNG | line-art |
| `vasca` | `public/gomme/vascaDX.png` | `public/gomme/vascaSX.png` | PNG | line-art |
| `centina` | `public/gomme/centinaDX.png` | `public/gomme/centinaSX.png` | PNG | line-art |
| `trattore` | `public/gomme/trattore_cisternaDX.png` | `public/gomme/trattore_cisternaSX.png` | PNG | line-art |
| `semirimorchioFissi` | `public/gomme/semirimorchioassefissoDX.png` | `public/gomme/semirimorchioassefissoSX.png` | PNG | line-art |
| `semirimorchioSterzante` | `public/gomme/semirimorchioassesterzanteDX.png` | `public/gomme/semirimorchioassesterzanteSX.png` | PNG | line-art |

Asset correlati:

- `public/cisterna.png`: icona/illustrazione verde, non utile per overlay gomme realistico DX/SX;
- `public/header_camion.png`: foto stradale generica, non utile per colore dinamico per ruota.

Verdetto asset attuali: **PARZIALE**. Sono utilizzabili come base neutra per overlay dinamico, ma non sono asset realistici/fotografici. Sono PNG raster line-art con ruote disegnate.

### 3.2 Geometria ruote gia presente

`src/components/wheels.ts` contiene gia la mappa categoria -> immagine DX/SX -> punti ruota:

- interfaccia `WheelGeomEntry` con `imageDX`, `imageSX`, `dx`, `sx` (`src/components/wheels.ts:9-14`);
- categorie esportate in `wheelGeom` (`src/components/wheels.ts:213-224`);
- esempio trattore: `trattore_cisternaDX.png`, `trattore_cisternaSX.png` e tre punti per lato (`src/components/wheels.ts:159-171`).

Questa mappa e' il punto migliore da riusare per centri ruota e categoria. Oggi pero' contiene solo `cx/cy`, non diametro, raggio pneumatico o path battistrada.

### 3.3 Uso attuale nell'app autisti

`src/next/autisti/NextModalGomme.tsx`:

- importa `TruckGommeSvg` e `wheelGeom` (`NextModalGomme.tsx:3-5`);
- calcola `backgroundImage` da `wheelGeom` (`NextModalGomme.tsx:209-228`);
- passa `backgroundImage` e `wheels` a `TruckGommeSvg` (`NextModalGomme.tsx:419-433`);
- ha gia una chiave override locale `@wheelGeom_override_v1` per calibrare coordinate (`NextModalGomme.tsx:49-55`, `231-257`).

`src/components/TruckGommeSvg.tsx`:

- disegna il PNG dentro un `<svg viewBox="0 0 360 180">` (`TruckGommeSvg.tsx:41-52`);
- oggi disegna per ogni ruota un `<circle r={8} fill="none">` e un hit area `<circle r={18}>` (`TruckGommeSvg.tsx:55-97`).

Verdetto: il meccanismo SVG sopra PNG esiste gia, ma il rendering attuale e' a cerchi-marker. Non soddisfa la reference approvata.

## 4. Dove entra nel Dettaglio Manutenzioni

`NextMappaStoricoPage` riconosce un record gomme con:

- `assiCoinvolti`;
- `gommePerAsse`;
- `gommeInterventoTipo`;
- `tipo === "gomme"`;
- testo con `GOMME` / `PNEUM`.

Righe reali: `src/next/NextMappaStoricoPage.tsx:376-385`.

Il dettaglio gomme attuale mostra:

- sezione "Dettagli intervento gomme";
- badge `STRAORDINARIO` quando `gommeStraordinario` esiste;
- assi coinvolti;
- tipo intervento;
- righe `gommePerAsse` con data e km.

Righe reali: `src/next/NextMappaStoricoPage.tsx:1137-1178`.

`nextManutenzioniGommeDomain` ha gia una funzione tecnica di view per categoria:

- risolve categoria -> key tecnica (`nextManutenzioniGommeDomain.ts:413-427`);
- costruisce ruote tecniche da `wheelGeom` (`436-470`);
- ritorna `backgroundImage` e `wheels` per vista destra/sinistra (`485-505`).

Questa funzione e' un buon aggancio futuro per evitare una seconda logica di geometria.

## 5. Confronto soluzioni

### A. PNG base + overlay SVG path sopra ogni pneumatico

Descrizione:

- mantenere PNG neutri sotto `public/gomme`;
- sopra il PNG disegnare SVG dinamico;
- per ogni ruota disegnare una corona/path del battistrada, non un cerchio pieno;
- usare `wheelGeom` per centro ruota;
- aggiungere parametri per ruota: `cx`, `cy`, `outerRadius`, `innerRadius`, eventuale `rx/ry`, eventuale `path` custom per ruote in prospettiva o parziali.

Pro:

- riusa asset e logica esistenti;
- non richiede modificare PNG;
- colore dinamico immediato via props/dati;
- puo rappresentare rosso/grigio/hover senza nuovi file immagine;
- puo partire da `TruckGommeSvg` come base concettuale, sostituendo i cerchi-marker con tyre tread overlay;
- compatibile con `resolveNextManutenzioneTechnicalView`.

Contro:

- con soli `cx/cy` non basta per precisione "battistrada": servono diametri/raggi per ruota;
- le ruote in prospettiva o parzialmente coperte possono richiedere path custom, non solo corona circolare;
- la fedelta visiva dipende dalla qualita della calibrazione per categoria/lato.

Difficolta: **MEDIA** per una demo, **MEDIA/ALTA** per coprire tutte le categorie con precisione.

Fedelta visiva: **BUONA** se si aggiungono parametri per raggio/spessore e, dove serve, path per pneumatici parziali.

Colore dinamico: **SI**.

Fattibile con codice attuale: **SI**, con estensione non distruttiva della geometria gomme. Non serve nuovo schema Firestore.

### B. SVG unico con path separati per pneumatici

Descrizione:

- sostituire ogni PNG con un SVG vettoriale completo;
- ogni pneumatico diventa un path separato colorabile;
- base camion neutra e gomme come layer vettoriali.

Pro:

- massima pulizia tecnica;
- colore battistrada davvero integrato nel disegno;
- hover/selezione/accessibilita piu puliti;
- nessuna incertezza di overlay rispetto al raster.

Contro:

- gli asset attuali sono PNG, non SVG;
- servirebbe ridisegnare o convertire ogni categoria/lato;
- conversioni automatiche da PNG line-art possono produrre path sporchi e non governabili;
- costo asset alto.

Difficolta: **ALTA**.

Fedelta visiva: **OTTIMA** se gli SVG sono disegnati bene.

Colore dinamico: **SI**.

Fattibile con codice attuale: **NON subito**. Serve produzione asset SVG separati per categoria/lato.

### C. PNG base + mask PNG per ogni pneumatico

Descrizione:

- mantenere PNG mezzo neutro;
- aggiungere una mask PNG trasparente per ogni gomma o gruppo gomme;
- colorare la mask via CSS/filter/blend o usare varianti colorate.

Pro:

- fedelta migliore di un cerchio se le mask sono disegnate bene;
- funziona anche con ruote parziali e prospettiva;
- non richiede convertire tutto il camion in SVG.

Contro:

- moltiplica gli asset;
- ogni categoria/lato/ruota richiede una mask allineata;
- naming e manutenzione asset diventano pesanti;
- colore dinamico via CSS su PNG mask e' meno pulito di SVG;
- rischio disallineamento se scala/crop cambiano.

Difficolta: **MEDIA/ALTA**.

Fedelta visiva: **BUONA/OTTIMA** con mask curate.

Colore dinamico: **SI, ma meno pulito**.

Fattibile con codice attuale: **PARZIALE**. Servirebbe creare asset mask nuovi, oggi non presenti.

### D. Generare nuovi asset per ogni categoria mezzo

Descrizione:

- produrre nuovi render/immagini per ogni categoria, possibilmente gia predisposti per gomme colorabili.

Pro:

- puo migliorare molto la resa estetica del camion;
- puo superare il limite line-art attuale.

Contro:

- rischio incoerenza tra categorie;
- servono DX/SX coerenti e con ruote nella stessa scala di coordinate;
- se sono PNG statici non risolvono da soli il colore dinamico;
- se si generano gia varianti rosse/grigie, esplode il numero di asset e si perde dinamicita.

Difficolta: **ALTA**.

Fedelta visiva: **VARIABILE**.

Colore dinamico: **NO**, se sono solo PNG statici; **SI** solo se accompagnati da overlay/mask/SVG.

Fattibile con codice attuale: **NO come soluzione unica**. Puo essere un miglioramento asset futuro, non la soluzione dinamica.

## 6. Soluzione consigliata

Soluzione consigliata: **A. PNG base neutro + overlay SVG/path separati per ogni pneumatico**.

Motivo:

- e' la strada piu compatibile con il codice reale;
- riusa `public/gomme/*`;
- riusa `wheelGeom` e la logica gia esistente in App Autisti / NEXT;
- permette colore dinamico vero;
- non richiede nuovo schema Firestore;
- non richiede nuove route;
- puo essere prototipata in modo isolato prima di toccare il Dettaglio reale.

Correzione necessaria rispetto allo stato attuale:

- non usare piu `circle r=8` come marker visivo, perche' il componente attuale produce indicatori sopra la ruota (`TruckGommeSvg.tsx:66-76`);
- mantenere un hit area trasparente separato se serve interazione (`TruckGommeSvg.tsx:77-96`);
- introdurre un layer visuale `TyreTreadOverlay` che disegna il battistrada come corona/path aderente al pneumatico.

## 7. Geometria necessaria

`wheelGeom` oggi contiene solo:

```ts
{ cx: number; cy: number }
```

Per l'effetto approvato serve estendere la geometria UI, non il dato business, con parametri visuali per ruota:

```ts
type TyreTreadShape = {
  id: string;
  axisId: string;
  cx: number;
  cy: number;
  outerRadius: number;
  innerRadius: number;
  rx?: number;
  ry?: number;
  rotationDeg?: number;
  visiblePath?: string;
};
```

Regole:

- `outerRadius`: bordo esterno del pneumatico nel PNG;
- `innerRadius`: appena fuori dal cerchione, cosi il cerchione resta visibile;
- `rx/ry`: utile per ruote in prospettiva;
- `rotationDeg`: utile per ellissi inclinate;
- `visiblePath`: opzionale per ruote parzialmente coperte, dove una corona completa sarebbe falsa.

Nota: questa e' geometria UI/asset, non nuovo schema Firestore. Non deve entrare in `@manutenzioni`.

## 8. Mapping dati -> colore

La UI del Dettaglio deve ricevere una lista ruote visuali e uno stato calcolato dal record:

- gomma sostituita -> rosso;
- gomma non sostituita / altra gomma del mezzo -> nero/grigio scuro;
- dato mancante -> neutro, nessun colore o pneumatico base non evidenziato;
- hover/selezione futura -> bordo blu sottile o focus ring separato, senza cambiare la regola cromatica principale.

Per record straordinario:

- se `gommeStraordinario.asseId` e `quantita` permettono identificare una ruota precisa, colorare quella ruota rossa;
- se il dato indica solo asse ma non posizione ruota, colorare in rosso solo dopo scelta utente o mostrare asse senza fingere una ruota precisa;
- se il dato e' parziale, non inventare posizione.

Per record ordinario:

- assi in `gommePerAsse` / `assiCoinvolti` possono colorare tutte le gomme dell'asse come sostituite, se il dato di business lo rappresenta;
- le altre gomme visibili restano grigio scuro o neutre secondo scelta UI.

## 9. Prototipo futuro isolato

Prima di toccare `NextMappaStoricoPage`, conviene creare una demo isolata e verificabile.

File candidati futuri:

- `src/next/components/TyreVehicleView.tsx`
- `src/next/components/tyreVehicleView.css`
- eventuale test/demo story interna se il repo ha pattern coerente

Responsabilita del componente:

- ricevere `backgroundImage`;
- ricevere geometria ruote;
- ricevere stato ruote (`sostituita`, `altra`, `neutra`);
- disegnare PNG base;
- disegnare overlay SVG/path del battistrada;
- mantenere hit area separata e trasparente se serve interazione;
- non leggere Firestore;
- non scrivere dati.

Solo dopo approvazione della demo:

- integrare il componente nel blocco gomme di `NextMappaStoricoPage`;
- usare `resolveNextManutenzioneTechnicalView` o helper analogo per categoria/lato;
- mappare i dati del record selezionato agli stati visuali.

## 10. Limiti

### 10.1 Cosa non puo fare Pencil

Pencil non e' la soluzione finale per il colore dinamico. Nel mock puo simulare il battistrada con overlay, ma:

- non modifica realmente i pixel del PNG;
- non garantisce precisione per tutte le categorie;
- non produce componenti React dinamici;
- non risolve hover, selezione o mapping da dati reali.

### 10.2 Cosa non deve fare Codex con PNG fissi

Non bisogna:

- modificare manualmente i PNG per ogni caso dati;
- generare varianti statiche rosse/grigie per ogni combinazione di gomme;
- usare marker o pallini sopra la ruota;
- spacciare un PNG statico come UI dinamica;
- inventare nuove categorie o nuovi stati.

### 10.3 Asset necessari per qualita superiore

Con gli asset attuali la soluzione e' fattibile ma la resa camion resta line-art. Per un salto visivo servirebbero:

- asset DX/SX piu realistici ma neutri;
- oppure SVG vettoriali con path pneumatici separati;
- oppure mask precise per ogni pneumatico/categoria/lato.

Gli asset attuali sono sufficienti per una prima UI dinamica vera; non sono sufficienti per una resa fotografica.

## 11. Verifiche e build

Verifiche eseguite:

- censimento `public/gomme/*`;
- lettura `wheels.ts`;
- lettura `TruckGommeSvg.tsx`;
- lettura `NextModalGomme.tsx`;
- lettura `nextManutenzioniGommeDomain.ts`;
- lettura punti rilevanti di `NextMappaStoricoPage.tsx`;
- lettura punti rilevanti di `NextManutenzioniPage.tsx`;
- lettura `nextMappaStoricoDomain.ts`;
- lettura `next-mappa-storico.css`;
- confronto tecnico delle soluzioni A/B/C/D.

Build non eseguita: questo task e' solo audit documentale e non modifica runtime. La futura execution runtime dovra avere gate `npm run build`.

## 12. Verdetto

1. Pencil come soluzione finale: **NO**.
2. Soluzione dinamica vera: **SI**, con PNG neutro + overlay SVG/path per battistrada.
3. Asset attuali utilizzabili: **PARZIALE**.
4. Soluzione consigliata: **base camion neutra PNG + overlay SVG/path separati per ogni pneumatico**.
5. File futuri probabili:
   - `src/next/components/TyreVehicleView.tsx`
   - `src/next/components/tyreVehicleView.css`
   - eventuale estensione geometria UI collegata a `wheelGeom`
   - integrazione successiva in `src/next/NextMappaStoricoPage.tsx`
6. Non serve nuovo schema Firestore per il colore.
7. Non serve nuova route.
8. La prossima execution consigliata e' una demo isolata del componente `TyreVehicleView`, non l'integrazione immediata nel Dettaglio reale.
