# Audit procurement: padre vs sottomoduli

## Scopo audit
Verificare, su base codice reale, se nella madre e nella NEXT `Materiali da ordinare` abbia ormai sostituito il flusso procurement composto da `Ordini in attesa`, `Ordini arrivati` e `Dettaglio ordine`, oppure se questi ingressi restino vivi e autonomi.

## Metodo
- Lettura obbligatoria dei documenti di stato e audit gia presenti.
- Verifica delle route ufficiali in [src/App.tsx](c:/progetti/gestioneweb/src/App.tsx).
- Lettura dei runtime madre:
  - [src/pages/Acquisti.tsx](c:/progetti/gestioneweb/src/pages/Acquisti.tsx)
  - [src/pages/MaterialiDaOrdinare.tsx](c:/progetti/gestioneweb/src/pages/MaterialiDaOrdinare.tsx)
  - [src/pages/OrdiniInAttesa.tsx](c:/progetti/gestioneweb/src/pages/OrdiniInAttesa.tsx)
  - [src/pages/OrdiniArrivati.tsx](c:/progetti/gestioneweb/src/pages/OrdiniArrivati.tsx)
  - [src/pages/DettaglioOrdine.tsx](c:/progetti/gestioneweb/src/pages/DettaglioOrdine.tsx)
- Lettura dei runtime NEXT:
  - [src/next/NextAcquistiPage.tsx](c:/progetti/gestioneweb/src/next/NextAcquistiPage.tsx)
  - [src/next/NextOrdiniInAttesaPage.tsx](c:/progetti/gestioneweb/src/next/NextOrdiniInAttesaPage.tsx)
  - [src/next/NextOrdiniArrivatiPage.tsx](c:/progetti/gestioneweb/src/next/NextOrdiniArrivatiPage.tsx)
  - [src/next/NextDettaglioOrdinePage.tsx](c:/progetti/gestioneweb/src/next/NextDettaglioOrdinePage.tsx)
  - [src/next/NextProcurementStandalonePage.tsx](c:/progetti/gestioneweb/src/next/NextProcurementStandalonePage.tsx)
  - [src/next/NextProcurementReadOnlyPanel.tsx](c:/progetti/gestioneweb/src/next/NextProcurementReadOnlyPanel.tsx)
  - [src/next/NextMaterialiDaOrdinarePage.tsx](c:/progetti/gestioneweb/src/next/NextMaterialiDaOrdinarePage.tsx)
- Ricerca dei collegamenti reali da Home e tra moduli procurement.

## Analisi madre

### Route ufficiali procurement
In [src/App.tsx](c:/progetti/gestioneweb/src/App.tsx) risultano montate separatamente:
- `/acquisti` e `/acquisti/dettaglio/:ordineId`
- `/materiali-da-ordinare`
- `/ordini-in-attesa`
- `/ordini-arrivati`
- `/dettaglio-ordine/:ordineId`

### Punto di ingresso reale dalla Home
In [src/pages/Home.tsx](c:/progetti/gestioneweb/src/pages/Home.tsx) il collegamento etichettato `Materiali Da Ordinare` punta a `/acquisti`, non a `/materiali-da-ordinare`. Nella stessa lista compaiono anche ingressi distinti per `/ordini-in-attesa` e `/ordini-arrivati`.

### Ruolo di `Acquisti`
In [src/pages/Acquisti.tsx](c:/progetti/gestioneweb/src/pages/Acquisti.tsx) il modulo si presenta esplicitamente come `Modulo unico: ordine materiali, liste ordini e dettaglio ordine.` e gestisce:
- tab `Ordine materiali`
- tab `Ordini`
- tab `Arrivi`
- tab `Prezzi & Preventivi`
- tab `Listino Prezzi`
- dettaglio ordine tramite `/acquisti/dettaglio/:ordineId`

Fatto verificato: nella madre il padre reale del flusso procurement e `Acquisti`, non `Materiali da ordinare`.

### Ruolo di `Materiali da ordinare`
In [src/pages/MaterialiDaOrdinare.tsx](c:/progetti/gestioneweb/src/pages/MaterialiDaOrdinare.tsx):
- la tab `Fabbisogni` e l'unica effettivamente attiva;
- le altre tab mostrano `Sezione read-only in arrivo...`;
- sono presenti CTA esplicite verso `/ordini-in-attesa` e `/ordini-arrivati`.

Fatto verificato: `Materiali da ordinare` non assorbe il flusso procurement completo; resta una superficie specializzata sui fabbisogni/ordine materiali con rimando ai moduli ordini.

### Ruolo di `Ordini in attesa`, `Ordini arrivati`, `Dettaglio ordine`
- [src/pages/OrdiniInAttesa.tsx](c:/progetti/gestioneweb/src/pages/OrdiniInAttesa.tsx) legge `@ordini`, filtra gli ordini con materiali non arrivati e apre `/dettaglio-ordine/:id`.
- [src/pages/OrdiniArrivati.tsx](c:/progetti/gestioneweb/src/pages/OrdiniArrivati.tsx) legge `@ordini`, filtra gli ordini con almeno un materiale arrivato e apre `/dettaglio-ordine/:id`.
- [src/pages/DettaglioOrdine.tsx](c:/progetti/gestioneweb/src/pages/DettaglioOrdine.tsx) carica l'ordine, consente modifica, toggle arrivato, aggiunta/rimozione materiali e aggiorna anche `@inventario`.

Fatto verificato: nella madre i tre moduli restano vivi e autonomi. `Dettaglio ordine` non e solo pagina tecnica; e un editor vero del dominio procurement.

## Analisi NEXT

### Route ufficiali procurement
In [src/App.tsx](c:/progetti/gestioneweb/src/App.tsx) risultano montate separatamente:
- `/next/acquisti`
- `/next/acquisti/dettaglio/:ordineId`
- `/next/materiali-da-ordinare`
- `/next/ordini-in-attesa`
- `/next/ordini-arrivati`
- `/next/dettaglio-ordine/:ordineId`

### Ruolo di `Acquisti`, `Ordini in attesa`, `Ordini arrivati`, `Dettaglio ordine`
- [src/next/NextAcquistiPage.tsx](c:/progetti/gestioneweb/src/next/NextAcquistiPage.tsx) monta `NextProcurementStandalonePage` in mode `acquisti`.
- [src/next/NextOrdiniInAttesaPage.tsx](c:/progetti/gestioneweb/src/next/NextOrdiniInAttesaPage.tsx) monta lo stesso workbench in mode `ordini`.
- [src/next/NextOrdiniArrivatiPage.tsx](c:/progetti/gestioneweb/src/next/NextOrdiniArrivatiPage.tsx) monta lo stesso workbench in mode `arrivi`.
- [src/next/NextDettaglioOrdinePage.tsx](c:/progetti/gestioneweb/src/next/NextDettaglioOrdinePage.tsx) monta lo stesso workbench in mode `dettaglio`.

In [src/next/NextProcurementStandalonePage.tsx](c:/progetti/gestioneweb/src/next/NextProcurementStandalonePage.tsx) il componente:
- legge un unico snapshot procurement;
- decide la tab attiva in base al mode/URL;
- inoltra i click a `NextProcurementReadOnlyPanel`;
- usa `onTabChange` per navigare tra `/next/acquisti`, `/next/ordini-in-attesa`, `/next/ordini-arrivati`;
- usa `onOpenOrder` per aprire `/next/dettaglio-ordine/:ordineId`.

In [src/next/NextProcurementReadOnlyPanel.tsx](c:/progetti/gestioneweb/src/next/NextProcurementReadOnlyPanel.tsx) il pannello mostra una sola shell `Acquisti` con tab:
- `Ordine materiali | bloccato`
- `Ordini | read-only`
- `Arrivi | read-only`
- `Prezzi & Preventivi | preview`
- `Listino Prezzi | contesto`

Fatto verificato: nella NEXT `Ordini in attesa`, `Ordini arrivati` e `Dettaglio ordine` non sono moduli autonomi separati; sono viste/modi di un unico workbench procurement read-only.

### Ruolo di `Materiali da ordinare` nella NEXT
In [src/next/NextMaterialiDaOrdinarePage.tsx](c:/progetti/gestioneweb/src/next/NextMaterialiDaOrdinarePage.tsx):
- la pagina e dedicata e non riusa `NextProcurementStandalonePage`;
- la tab `Fabbisogni` e l'unica attiva;
- le altre tab mostrano `Sezione read-only in arrivo...`;
- restano CTA esplicite verso `/next/ordini-in-attesa` e `/next/ordini-arrivati`.

Fatto verificato: nella NEXT `Materiali da ordinare` e la superficie piu stabile e focalizzata per il punto di ingresso procurement top-level, ma non sostituisce da sola l'intero flusso ordini/arrivi/dettaglio.

## Schede moduli

### MODULO: Materiali da ordinare
- Perimetro: entrambi
- Route:
  - madre: `/materiali-da-ordinare`
  - NEXT: `/next/materiali-da-ordinare`
- File runtime:
  - madre: [src/pages/MaterialiDaOrdinare.tsx](c:/progetti/gestioneweb/src/pages/MaterialiDaOrdinare.tsx)
  - NEXT: [src/next/NextMaterialiDaOrdinarePage.tsx](c:/progetti/gestioneweb/src/next/NextMaterialiDaOrdinarePage.tsx)
- Serve a: gestire fabbisogni e bozza ordine materiali.
- Ingresso principale reale:
  - madre: route dedicata esiste, ma dalla Home il collegamento visibile etichettato `Materiali Da Ordinare` porta a `/acquisti`
  - NEXT: ingresso top-level piu stabile della famiglia procurement per `Gestione Operativa`
- Ingressi secondari reali:
  - madre: CTA interne verso `Ordini in attesa` e `Ordini arrivati`
  - NEXT: CTA interne verso `Ordini in attesa` e `Ordini arrivati`
- Da li si va a:
  - madre: `/ordini-in-attesa`, `/ordini-arrivati`
  - NEXT: `/next/ordini-in-attesa`, `/next/ordini-arrivati`
- Dipende da:
  - madre: `@fornitori`, `@ordini`, immagini materiali
  - NEXT: `readNextFornitoriSnapshot`
- E ancora un modulo autonomo?: si
- E un supporto del flusso procurement padre?: si
- Nella NEXT va tenuto come ingresso separato?: si
- Motivo: e la superficie piu chiara per aprire la famiglia procurement nella NEXT, ma non equivale all'intero workbench ordini/arrivi/dettaglio.
- Note prove/codice: route in [src/App.tsx](c:/progetti/gestioneweb/src/App.tsx); CTA a ordini/arrivi in [src/pages/MaterialiDaOrdinare.tsx](c:/progetti/gestioneweb/src/pages/MaterialiDaOrdinare.tsx) e [src/next/NextMaterialiDaOrdinarePage.tsx](c:/progetti/gestioneweb/src/next/NextMaterialiDaOrdinarePage.tsx)

### MODULO: Ordini in attesa
- Perimetro: entrambi
- Route:
  - madre: `/ordini-in-attesa`
  - NEXT: `/next/ordini-in-attesa`
- File runtime:
  - madre: [src/pages/OrdiniInAttesa.tsx](c:/progetti/gestioneweb/src/pages/OrdiniInAttesa.tsx)
  - NEXT: [src/next/NextOrdiniInAttesaPage.tsx](c:/progetti/gestioneweb/src/next/NextOrdiniInAttesaPage.tsx)
- Serve a: vedere gli ordini con materiali ancora pendenti.
- Ingresso principale reale:
  - madre: link diretto da Home e da `Materiali da ordinare`
  - NEXT: ingresso secondario del workbench procurement
- Ingressi secondari reali:
  - madre: `Acquisti` tab `Ordini`
  - NEXT: `NextProcurementReadOnlyPanel` tab `ordini`
- Da li si va a:
  - madre: `/dettaglio-ordine/:ordineId`
  - NEXT: `/next/dettaglio-ordine/:ordineId`
- Dipende da:
  - madre: `@ordini`
  - NEXT: snapshot procurement unico del workbench
- E ancora un modulo autonomo?: 
  - madre: si
  - NEXT: no
- E un supporto del flusso procurement padre?: si
- Nella NEXT va tenuto come ingresso separato?: no
- Motivo: nella NEXT e una vista del workbench comune, non un modulo indipendente.
- Note prove/codice: [src/pages/OrdiniInAttesa.tsx](c:/progetti/gestioneweb/src/pages/OrdiniInAttesa.tsx), [src/next/NextOrdiniInAttesaPage.tsx](c:/progetti/gestioneweb/src/next/NextOrdiniInAttesaPage.tsx), [src/next/NextProcurementStandalonePage.tsx](c:/progetti/gestioneweb/src/next/NextProcurementStandalonePage.tsx)

### MODULO: Ordini arrivati
- Perimetro: entrambi
- Route:
  - madre: `/ordini-arrivati`
  - NEXT: `/next/ordini-arrivati`
- File runtime:
  - madre: [src/pages/OrdiniArrivati.tsx](c:/progetti/gestioneweb/src/pages/OrdiniArrivati.tsx)
  - NEXT: [src/next/NextOrdiniArrivatiPage.tsx](c:/progetti/gestioneweb/src/next/NextOrdiniArrivatiPage.tsx)
- Serve a: vedere gli ordini con almeno una riga arrivata.
- Ingresso principale reale:
  - madre: link diretto da Home e da `Materiali da ordinare`
  - NEXT: ingresso secondario del workbench procurement
- Ingressi secondari reali:
  - madre: `Acquisti` tab `Arrivi`
  - NEXT: `NextProcurementReadOnlyPanel` tab `arrivi`
- Da li si va a:
  - madre: `/dettaglio-ordine/:ordineId`
  - NEXT: `/next/dettaglio-ordine/:ordineId`
- Dipende da:
  - madre: `@ordini`
  - NEXT: snapshot procurement unico del workbench
- E ancora un modulo autonomo?:
  - madre: si
  - NEXT: no
- E un supporto del flusso procurement padre?: si
- Nella NEXT va tenuto come ingresso separato?: no
- Motivo: nella NEXT e una vista del workbench comune, non un modulo indipendente.
- Note prove/codice: [src/pages/OrdiniArrivati.tsx](c:/progetti/gestioneweb/src/pages/OrdiniArrivati.tsx), [src/next/NextOrdiniArrivatiPage.tsx](c:/progetti/gestioneweb/src/next/NextOrdiniArrivatiPage.tsx), [src/next/NextProcurementReadOnlyPanel.tsx](c:/progetti/gestioneweb/src/next/NextProcurementReadOnlyPanel.tsx)

### MODULO: Dettaglio ordine
- Perimetro: entrambi
- Route:
  - madre: `/dettaglio-ordine/:ordineId`
  - NEXT: `/next/dettaglio-ordine/:ordineId`
- File runtime:
  - madre: [src/pages/DettaglioOrdine.tsx](c:/progetti/gestioneweb/src/pages/DettaglioOrdine.tsx)
  - NEXT: [src/next/NextDettaglioOrdinePage.tsx](c:/progetti/gestioneweb/src/next/NextDettaglioOrdinePage.tsx)
- Serve a: aprire il dettaglio di un ordine specifico.
- Ingresso principale reale:
  - madre: da `Ordini in attesa`, `Ordini arrivati` e `Acquisti`
  - NEXT: da `NextProcurementReadOnlyPanel`
- Ingressi secondari reali:
  - madre: `/acquisti/dettaglio/:ordineId`
  - NEXT: `/next/acquisti/dettaglio/:ordineId`
- Da li si va a:
  - madre: ritorno a `/ordini-in-attesa` o a `Acquisti`
  - NEXT: ritorno a `/next/ordini-in-attesa` o `/next/ordini-arrivati` in base al `from`
- Dipende da:
  - madre: `@ordini`, `@inventario`, immagini materiali
  - NEXT: snapshot procurement unico del workbench
- E ancora un modulo autonomo?:
  - madre: si
  - NEXT: no, e dettaglio read-only del workbench
- E un supporto del flusso procurement padre?: si
- Nella NEXT va tenuto come ingresso separato?: no
- Motivo: e una superficie di dettaglio, non un ingresso di famiglia.
- Note prove/codice: [src/pages/DettaglioOrdine.tsx](c:/progetti/gestioneweb/src/pages/DettaglioOrdine.tsx), [src/next/NextProcurementStandalonePage.tsx](c:/progetti/gestioneweb/src/next/NextProcurementStandalonePage.tsx)

## Confronto diretto madre vs NEXT
- Madre:
  - il padre reale del procurement e `Acquisti`;
  - `Materiali da ordinare` non sostituisce il flusso, ma ne copre la parte fabbisogni;
  - `Ordini in attesa`, `Ordini arrivati` e `Dettaglio ordine` restano moduli vivi, navigabili e operativi.
- NEXT:
  - `Materiali da ordinare` e la miglior porta top-level per la famiglia procurement;
  - `Ordini in attesa`, `Ordini arrivati` e `Dettaglio ordine` sono viste del medesimo workbench read-only;
  - `Materiali da ordinare` non assorbe davvero tutto il flusso, perche continua a delegare ordini/arrivi a route dedicate.

## Conclusione netta

### Madre
- `Materiali da ordinare` padre: no
- `Ordini in attesa` ingresso separato: si
- `Ordini arrivati` ingresso separato: si
- `Dettaglio ordine` ingresso separato: si

### NEXT
- `Materiali da ordinare` padre top-level consigliato: si
- `Ordini in attesa` ingresso separato: no
- `Ordini arrivati` ingresso separato: no
- `Dettaglio ordine` ingresso separato: no

## Decisione consigliata per la NEXT
- Tenere `Materiali da ordinare` come ingresso procurement principale in `Gestione Operativa`.
- Declassare `Ordini in attesa`, `Ordini arrivati` e `Dettaglio ordine` a superfici secondarie del workbench procurement.
- Non considerarli piu ingressi separati di famiglia nella Home o in `Gestione Operativa`.
- Trattare `/next/acquisti` come workbench procurement secondario/tecnico, non come entry point di primo livello, salvo bisogno esplicito di deep link.
