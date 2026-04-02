# Audit Procurement - Moduli rimovibili NEXT

## 1. Scopo audit
Verificare in modo definitivo se i moduli NEXT `Ordini in attesa`, `Ordini arrivati` e `Dettaglio ordine`:

- servono ancora al funzionamento reale di `Materiali da ordinare`;
- sono ancora collegati ad altri moduli NEXT;
- possono essere tolti dalla UI visibile di alto livello;
- possono essere candidati a rimozione o archiviazione dal codice NEXT.

## 2. Metodo
Audit solo su codice reale, senza patch runtime.

Letture usate:

- `src/App.tsx`
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/NextOrdiniInAttesaPage.tsx`
- `src/next/NextOrdiniArrivatiPage.tsx`
- `src/next/NextDettaglioOrdinePage.tsx`
- `src/next/NextProcurementStandalonePage.tsx`
- `src/next/NextProcurementReadOnlyPanel.tsx`
- `src/next/nextCloneNavigation.ts`
- `src/next/nextStructuralPaths.ts`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/internal-ai/internalAiUniversalContracts.ts`
- audit procurement gia prodotti in `docs/audit/*`

Regola adottata:

- esistenza di una route non basta per considerare vivo un modulo;
- un modulo e ancora necessario se ha ingressi, navigate, import o mount reali che lo tengono nel flusso;
- la decisione UI top-level e separata dalla necessita di mantenere il runtime tecnico.

## 3. Analisi di `Materiali da ordinare`

### Stato reale
`/next/materiali-da-ordinare` monta `src/next/NextMaterialiDaOrdinarePage.tsx`.

La pagina non importa `NextProcurementStandalonePage` e non monta direttamente:

- `Ordini in attesa`
- `Ordini arrivati`
- `Dettaglio ordine`

Quindi non esiste una dipendenza di componente diretta.

### Dipendenza di flusso reale
La pagina pero usa ancora le route procurement secondarie come uscite operative esplicite:

- `navigate(NEXT_ORDINI_IN_ATTESA_PATH)` in due punti
- `navigate(NEXT_ORDINI_ARRIVATI_PATH)` in due punti

Questi collegamenti sono presenti:

- nei quick link laterali;
- nella sticky action bar.

In piu la pagina dichiara esplicitamente che, in questa fase, e attiva solo la tab `Fabbisogni`, mentre le altre sezioni restano preview/read-only. Quindi oggi `Materiali da ordinare` non assorbe ancora da sola tutto il procurement: rimanda ancora alle superfici `Ordini in attesa` e `Ordini arrivati` per proseguire il flusso.

### Conclusione su `Materiali da ordinare`
- padre procurement top-level nella NEXT: `SI`
- sufficiente da sola a eliminare i moduli secondari: `NO`
- dipendenza reale da `Ordini in attesa` e `Ordini arrivati`: `SI`, a livello di route/flow
- dipendenza diretta da `Dettaglio ordine`: `NO`

## 4. Schede moduli

### MODULO: Ordini in attesa
Route: `/next/ordini-in-attesa`

File runtime: `src/next/NextOrdiniInAttesaPage.tsx`

Usato da `Materiali da ordinare`? `SI`

Usato da altri moduli NEXT? `SI`

Ingressi reali trovati:

- route ufficiale montata in `src/App.tsx`
- quick link e sticky bar di `NextMaterialiDaOrdinarePage`
- remap legacy in `src/next/nextCloneNavigation.ts`
- resolver clone-safe in `src/next/NextCentroControlloPage.tsx`
- routing operativita legacy in `src/next/nextStructuralPaths.ts`
- hook UI IA universale `procurement.attesa`

Collegamenti in uscita trovati:

- tab switch del workbench procurement verso `Ordini arrivati`
- apertura `Dettaglio ordine` via `buildNextDettaglioOrdinePath(orderId)`
- ritorno verso `/next/acquisti?tab=...` nel workbench condiviso

Dipendenze reali:

- `NextOrdiniInAttesaPage` monta `NextProcurementStandalonePage` con `mode="ordini"`
- `NextProcurementStandalonePage`
- `NextProcurementReadOnlyPanel`
- snapshot procurement read-only

Rischio se tolto dalla UI:

- basso se si intende solo toglierlo da card/menu top-level;
- alto se si intende rimuovere la schermata o la route, perche `Materiali da ordinare` e il workbench procurement lo usano ancora.

Rischio se tolto dal codice:

- alto

Decisione UI:

- declassare a supporto del flusso procurement;
- non esporre come ingresso top-level separato.

Decisione codice:

- mantenere nel codice NEXT.

Motivo:

Non e piu un modulo padre autonomo di famiglia, ma e ancora una superficie runtime viva e agganciata sia da `Materiali da ordinare` sia dal workbench procurement condiviso.

Note prove/codice:

- `src/App.tsx`
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/NextOrdiniInAttesaPage.tsx`
- `src/next/NextProcurementStandalonePage.tsx`
- `src/next/NextProcurementReadOnlyPanel.tsx`
- `src/next/nextCloneNavigation.ts`
- `src/next/nextStructuralPaths.ts`
- `src/next/internal-ai/internalAiUniversalContracts.ts`

### MODULO: Ordini arrivati
Route: `/next/ordini-arrivati`

File runtime: `src/next/NextOrdiniArrivatiPage.tsx`

Usato da `Materiali da ordinare`? `SI`

Usato da altri moduli NEXT? `SI`

Ingressi reali trovati:

- route ufficiale montata in `src/App.tsx`
- quick link e sticky bar di `NextMaterialiDaOrdinarePage`
- remap legacy in `src/next/nextCloneNavigation.ts`
- resolver clone-safe in `src/next/NextCentroControlloPage.tsx`
- routing operativita legacy in `src/next/nextStructuralPaths.ts`
- hook UI IA universale `procurement.arrivi`

Collegamenti in uscita trovati:

- tab switch del workbench procurement verso `Ordini in attesa`
- apertura `Dettaglio ordine` via `buildNextDettaglioOrdinePath(orderId)`
- ritorno verso `/next/acquisti?tab=...` nel workbench condiviso

Dipendenze reali:

- `NextOrdiniArrivatiPage` monta `NextProcurementStandalonePage` con `mode="arrivi"`
- `NextProcurementStandalonePage`
- `NextProcurementReadOnlyPanel`
- snapshot procurement read-only

Rischio se tolto dalla UI:

- basso se si intende solo toglierlo da card/menu top-level;
- alto se si intende rimuovere la schermata o la route, perche `Materiali da ordinare` e il workbench procurement lo usano ancora.

Rischio se tolto dal codice:

- alto

Decisione UI:

- declassare a supporto del flusso procurement;
- non esporre come ingresso top-level separato.

Decisione codice:

- mantenere nel codice NEXT.

Motivo:

Anche `Ordini arrivati` non regge piu come accesso famiglia separato, ma resta una vista viva del workbench procurement e una destinazione reale dei link di `Materiali da ordinare`.

Note prove/codice:

- `src/App.tsx`
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/NextOrdiniArrivatiPage.tsx`
- `src/next/NextProcurementStandalonePage.tsx`
- `src/next/NextProcurementReadOnlyPanel.tsx`
- `src/next/nextCloneNavigation.ts`
- `src/next/nextStructuralPaths.ts`
- `src/next/internal-ai/internalAiUniversalContracts.ts`

### MODULO: Dettaglio ordine
Route:

- `/next/dettaglio-ordine/:ordineId`
- `/next/acquisti/dettaglio/:ordineId`

File runtime: `src/next/NextDettaglioOrdinePage.tsx`

Usato da `Materiali da ordinare`? `NO`

Usato da altri moduli NEXT? `SI`

Ingressi reali trovati:

- route ufficiali montate in `src/App.tsx`
- apertura ordine da `NextProcurementStandalonePage.onOpenOrder`
- remap legacy di `/dettaglio-ordine/:id` e `/acquisti/dettaglio/:id` in `src/next/nextCloneNavigation.ts`
- builder `buildNextDettaglioOrdinePath` usato nei path strutturali NEXT

Collegamenti in uscita trovati:

- ritorno alla lista `Ordini in attesa` o `Ordini arrivati` tramite `onCloseOrder`

Dipendenze reali:

- `NextDettaglioOrdinePage` monta `NextProcurementStandalonePage` con `mode="dettaglio"`
- `NextProcurementStandalonePage`
- `NextProcurementReadOnlyPanel`
- `orderId` da route param

Rischio se tolto dalla UI:

- basso se si intende non esporlo mai come ingresso top-level;
- alto se si intende rimuovere la schermata di drill-down, perche si rompe l'apertura dettaglio dal workbench procurement.

Rischio se tolto dal codice:

- alto

Decisione UI:

- non esporre come modulo visibile separato;
- mantenere solo come drill-down interno del workbench procurement.

Decisione codice:

- mantenere nel codice NEXT.

Motivo:

`Dettaglio ordine` non e piu un ingresso autonomo di prodotto, ma resta ancora necessario al flusso read-only di apertura ordine dalle liste procurement.

Note prove/codice:

- `src/App.tsx`
- `src/next/NextDettaglioOrdinePage.tsx`
- `src/next/NextProcurementStandalonePage.tsx`
- `src/next/NextProcurementReadOnlyPanel.tsx`
- `src/next/nextCloneNavigation.ts`
- `src/next/nextStructuralPaths.ts`

## 5. Collegamenti reali con altri moduli NEXT

Collegamenti confermati:

- `Materiali da ordinare` -> `Ordini in attesa`
- `Materiali da ordinare` -> `Ordini arrivati`
- `Ordini in attesa` -> `Dettaglio ordine`
- `Ordini arrivati` -> `Dettaglio ordine`
- `Dettaglio ordine` -> ritorno a `Ordini in attesa` o `Ordini arrivati`
- mapping legacy e resolver centrali NEXT -> tutte e tre le route
- registry IA universale -> `Ordini in attesa` e `Ordini arrivati`

Collegamenti non dimostrati:

- `Materiali da ordinare` -> `Dettaglio ordine` diretto

## 6. Conclusione netta

### Ordini in attesa
- mantenere in UI come ingresso separato: `NO`
- declassare a supporto tecnico/runtime: `SI`
- rimuovere dalla UI top-level: `SI`
- rimuovere dalla UI NEXT in senso totale: `NO`
- candidare a rimozione codice: `NO`

### Ordini arrivati
- mantenere in UI come ingresso separato: `NO`
- declassare a supporto tecnico/runtime: `SI`
- rimuovere dalla UI top-level: `SI`
- rimuovere dalla UI NEXT in senso totale: `NO`
- candidare a rimozione codice: `NO`

### Dettaglio ordine
- mantenere in UI come ingresso separato: `NO`
- declassare a supporto tecnico/runtime: `SI`
- rimuovere dalla UI top-level: `SI`
- rimuovere dalla UI NEXT in senso totale: `NO`
- candidare a rimozione codice: `NO`

## 7. Decisione finale
Stato finale della famiglia procurement secondaria nella NEXT:

- `Materiali da ordinare` resta il padre procurement top-level;
- `Ordini in attesa`, `Ordini arrivati` e `Dettaglio ordine` non devono piu essere trattati come moduli famiglia autonomi;
- i tre moduli vanno tenuti come superfici secondarie/runtime di supporto;
- nessuno dei tre e oggi candidabile a rimozione codice senza un refactor esplicito di:
  - `NextMaterialiDaOrdinarePage`
  - `NextProcurementStandalonePage`
  - `NextProcurementReadOnlyPanel`
  - `nextCloneNavigation`
  - `nextStructuralPaths`
  - registry IA universale procurement

## 8. Punti DA VERIFICARE

- se esistono consumer esterni al perimetro NEXT che aprono ancora direttamente `/next/ordini-in-attesa` e `/next/ordini-arrivati` via link non indicizzati dal repo;
- se il registry IA universale procurement debba essere semplificato in una futura convergenza completa su `Materiali da ordinare`;
- se in una futura patch `Materiali da ordinare` assorbira davvero anche liste ordini/arrivi e drill-down, permettendo allora una rimozione runtime dei moduli secondari.
