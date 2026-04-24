# VERIFICA 3 PUNTI AUDIT 2026-04-23

Scopo: verificare 3 letture puntuali dell'audit `docs/audit/AUDIT_GAP_NEXT_VS_MADRE_2026-04-22.md` contro il codice reale del repository, senza rieseguire un audit totale. Riferimento oggetto della verifica: `docs/audit/AUDIT_GAP_NEXT_VS_MADRE_2026-04-22.md:36-46`, `docs/audit/AUDIT_GAP_NEXT_VS_MADRE_2026-04-22.md:80-89`, `docs/audit/AUDIT_GAP_NEXT_VS_MADRE_2026-04-22.md:132-140`.

## 1. Verifica `Materiali da ordinare`

### Writer reali presenti oggi nella NEXT

- La route NEXT ufficiale esiste ed e montata su `NextMaterialiDaOrdinarePage`: `src/App.tsx:289-293`.
- Dentro `NextMaterialiDaOrdinarePage` la conferma ordine non salva su Firestore o Storage: `salvaOrdine()` mostra il messaggio `Clone read-only: conferma ordine non disponibile.` e poi pulisce solo la bozza locale, senza writer reali su `@ordini`: `src/next/NextMaterialiDaOrdinarePage.tsx:1066-1080`.
- Anche la gestione foto nella pagina NEXT e locale: `aggiornaFotoMateriale()` usa `URL.createObjectURL(file)` e imposta `fotoStoragePath: null`, senza upload Storage: `src/next/NextMaterialiDaOrdinarePage.tsx:1017-1030`.
- La pagina NEXT monta pero il ramo procurement convergente sui tab `Prezzi & Preventivi` e `Listino Prezzi`: `src/next/NextMaterialiDaOrdinarePage.tsx:1921-1948`.
- Il modale manuale salva davvero passando da `saveAndUpsert(...)`: `src/next/NextPreventivoManualeModal.tsx:258-283`.
- Il modale IA salva davvero passando da `saveAndUpsert(...)`: `src/next/NextPreventivoIaModal.tsx:382-405`.
- Writer NEXT rilevato 1: upload immagini preventivo su Storage: `src/next/nextPreventivoManualeWriter.ts:193-225`.
- Writer NEXT rilevato 2: upload PDF preventivo su Storage: `src/next/nextPreventivoManualeWriter.ts:228-255`.
- Writer NEXT rilevato 3: `setDoc` di `storage/@preventivi`: `src/next/nextPreventivoManualeWriter.ts:290-302`.
- Writer NEXT rilevato 4: `setDoc` di `storage/@listino_prezzi`: `src/next/nextPreventivoManualeWriter.ts:307-409`.
- Writer NEXT rilevato 5: `fetch` POST al backend IA `preventivo-extract`: `src/next/nextPreventivoIaClient.ts:3-5`, `src/next/nextPreventivoIaClient.ts:73-84`.
- `saveAndUpsert(...)` usa i wrapper clone-safe `setDoc` e `uploadBytes`, non le API Firebase dirette: `src/next/nextPreventivoManualeWriter.ts:4-5`, `src/next/nextPreventivoManualeWriter.ts:298-302`, `src/next/nextPreventivoManualeWriter.ts:408`, `src/next/nextPreventivoManualeWriter.ts:411-431`.
- Gli upload reali NEXT sono su Storage `preventivi/manuali/*` e `preventivi/ia/*`: `src/next/nextPreventivoManualeWriter.ts:119`, `src/next/nextPreventivoManualeWriter.ts:206-213`, `src/next/nextPreventivoManualeWriter.ts:239-245`, `src/next/NextPreventivoIaModal.tsx:399-403`.
- Le scritture Firestore reali NEXT sono su `storage/@preventivi` e `storage/@listino_prezzi`: `src/next/nextPreventivoManualeWriter.ts:116-118`, `src/next/nextPreventivoManualeWriter.ts:290-302`, `src/next/nextPreventivoManualeWriter.ts:313-319`, `src/next/nextPreventivoManualeWriter.ts:407-408`.
- I wrapper passano esplicitamente dal barrier: `src/utils/firestoreWriteOps.ts:29-35`, `src/utils/storageWriteOps.ts:20-28`.
- Il barrier apre davvero solo questo perimetro per `/next/materiali-da-ordinare`: `storage/@preventivi`, `storage/@listino_prezzi`, `preventivi/manuali/`, `preventivi/ia/` e il fetch IA `preventivo-extract`: `src/utils/cloneWriteBarrier.ts:24-34`, `src/utils/cloneWriteBarrier.ts:402-414`.

### Writer presenti nella madre

- La madre legge i fornitori da Firestore ma il writer business principale e la conferma ordine su `@ordini`: `src/pages/MaterialiDaOrdinare.tsx:186-202`.
- La madre carica davvero la foto materiale via helper `uploadMaterialImage(...)`: `src/pages/MaterialiDaOrdinare.tsx:143-147`.
- La madre elimina davvero la foto materiale via helper `deleteMaterialImage(...)`: `src/pages/MaterialiDaOrdinare.tsx:167-170`.
- Writer madre rilevato 1: upload Storage immagine materiale: `src/utils/materialImages.ts:14-25`.
- Writer madre rilevato 2: delete Storage immagine materiale: `src/utils/materialImages.ts:36-42`.
- Writer madre rilevato 3: `setDoc` di `storage/@ordini`: `src/pages/MaterialiDaOrdinare.tsx:186-202`.
- L'helper legacy esegue upload reale su Storage con `uploadBytes(...)`: `src/utils/materialImages.ts:14-25`.
- L'helper legacy esegue delete reale su Storage con `deleteObject(...)`: `src/utils/materialImages.ts:36-42`.

### Verdetto parity scrivente

VERDETTO: `NO`.

- La madre salva l'ordine in `storage/@ordini` e persiste davvero le foto dei materiali: `src/pages/MaterialiDaOrdinare.tsx:143-147`, `src/pages/MaterialiDaOrdinare.tsx:186-202`, `src/utils/materialImages.ts:14-25`.
- La NEXT non salva l'ordine: il bottone `CONFERMA ORDINE` mostra un alert read-only e non chiama nessun writer su `@ordini`: `src/next/NextMaterialiDaOrdinarePage.tsx:1066-1080`.
- La NEXT non persiste le foto dei materiali del fabbisogno: usa solo preview locale con `URL.createObjectURL(...)`: `src/next/NextMaterialiDaOrdinarePage.tsx:1017-1030`.
- La NEXT ha invece scritture reali su `preventivi/listino`, cioe un perimetro diverso da quello scrivente della madre `MaterialiDaOrdinare.tsx`: `src/next/nextPreventivoManualeWriter.ts:290-302`, `src/next/nextPreventivoManualeWriter.ts:407-408`.

### Confronto con audit originale sezione 2.3

- L'audit originale classifica `MaterialiDaOrdinare` come `PARZIALE` per via di writer su `storage/@preventivi`, `storage/@listino_prezzi`, `preventivi/manuali/`, `preventivi/ia/`: `docs/audit/AUDIT_GAP_NEXT_VS_MADRE_2026-04-22.md:42`.
- La lettura e `PARZIALMENTE` corretta sul perimetro aperto del barrier, ma `NON` coincide con la parity scrivente reale verso la madre.
- L'audit ha letto bene l'apertura scrivente su `preventivi/listino`, ma ha letto male il punto chiave del modulo omonimo: oggi `Materiali da ordinare` NEXT non salva ancora l'ordine su `@ordini` e non persiste le foto materiali, quindi la parity scrivente con la madre non c'e: `src/next/NextMaterialiDaOrdinarePage.tsx:1066-1080`, `src/next/NextMaterialiDaOrdinarePage.tsx:1017-1030`.

## 2. Verifica `Dettaglio Ordine`

### Esistenza file e wiring route

- `src/next/NextDettaglioOrdinePage.tsx` esiste ancora come file autonomo: `src/next/NextDettaglioOrdinePage.tsx:1-4`.
- In `src/App.tsx` esistono ancora due route che montano `NextDettaglioOrdinePage`: `/next/acquisti/dettaglio/:ordineId` e `/next/dettaglio-ordine/:ordineId`: `src/App.tsx:281-285`, `src/App.tsx:321-324`.
- Pero `NextDettaglioOrdinePage` non contiene logica di dettaglio propria: restituisce solo `<NextProcurementStandalonePage mode="dettaglio" />`: `src/next/NextDettaglioOrdinePage.tsx:1-4`.
- `NextProcurementStandalonePage` in modalita `dettaglio` converte la route dedicata in redirect verso `NEXT_MATERIALI_DA_ORDINARE_PATH` con query string `orderId` e `from`: `src/next/NextProcurementStandalonePage.tsx:20-22`, `src/next/NextProcurementStandalonePage.tsx:54-63`.

### Dove vive oggi la logica di dettaglio

- In `NextMaterialiDaOrdinarePage` il dettaglio e guidato da `resolvedOrderId`; quando `orderId` e presente viene attivata la vista procurement di dettaglio dentro il modulo unico: `src/next/NextMaterialiDaOrdinarePage.tsx:1224-1229`, `src/next/NextMaterialiDaOrdinarePage.tsx:1283-1287`, `src/next/NextMaterialiDaOrdinarePage.tsx:1866-1912`.
- Il rendering effettivo del dettaglio avviene in `NextProcurementReadOnlyPanel`: se trova `orderId`, monta `OrderDetailPanel`: `src/next/NextProcurementReadOnlyPanel.tsx:1155-1169`, `src/next/NextProcurementReadOnlyPanel.tsx:1215-1224`.
- Il pannello `OrderDetailPanel` contiene la UI di dettaglio ordine, il bottone indietro, lo stato ordine, la modifica locale materiali e l'anteprima PDF: `src/next/NextProcurementReadOnlyPanel.tsx:435-457`, `src/next/NextProcurementReadOnlyPanel.tsx:542-557`, `src/next/NextProcurementReadOnlyPanel.tsx:772-821`.
- Il file di path helper conserva ancora una route nominale `buildNextDettaglioOrdinePath(...)`, ma la risoluzione dei percorsi operativi procurement continua a convergere su quel dettaglio come sottocaso dello stesso dominio: `src/next/nextStructuralPaths.ts:92-97`, `src/next/nextStructuralPaths.ts:114-119`.

### Verdetto inglobamento

VERDETTO: `SI`.

- Runtime alla mano, `DettaglioOrdine` non vive piu come modulo NEXT separato: la route dedicata sopravvive solo come wrapper di redirect verso il modulo unico procurement: `src/next/NextDettaglioOrdinePage.tsx:1-4`, `src/next/NextProcurementStandalonePage.tsx:54-63`.
- La logica reale di dettaglio oggi vive in `NextMaterialiDaOrdinarePage` + `NextProcurementReadOnlyPanel` + `OrderDetailPanel`: `src/next/NextMaterialiDaOrdinarePage.tsx:1866-1912`, `src/next/NextProcurementReadOnlyPanel.tsx:1215-1224`, `src/next/NextProcurementReadOnlyPanel.tsx:772-821`.

### Confronto con audit originale sezione 2.3

- L'audit originale tratta `DettaglioOrdine` come modulo separato `READ-ONLY - GAP CRITICO`: `docs/audit/AUDIT_GAP_NEXT_VS_MADRE_2026-04-22.md:46`, `docs/audit/AUDIT_GAP_NEXT_VS_MADRE_2026-04-22.md:160`.
- Questa lettura `NON` coincide con il codice attuale.
- Il file separato esiste ancora, ma il runtime e gia inglobato nel modulo unico procurement; il gap separato come "pagina autonoma da completare" oggi non e descritto correttamente dall'audit: `src/next/NextDettaglioOrdinePage.tsx:1-4`, `src/next/NextProcurementStandalonePage.tsx:54-63`.

## 3. Verifica `Mezzo360` e `Autista360`

### Stato codice `Mezzo360`

- `src/pages/Mezzo360.tsx` esiste: `src/pages/Mezzo360.tsx:1-12`.
- Oggi la route raggiungibile e solo legacy `/mezzo-360/:targa`, che monta `Mezzo360`: `src/App.tsx:87`, `src/App.tsx:684`.
- In `src/App.tsx` non risulta alcun import o mount `NextMezzo360*`; sulle route 360 il codice monta solo il legacy `Mezzo360`: `src/App.tsx:87`, `src/App.tsx:684`.
- Non emerge nel routing NEXT nessuna route `/next/mezzo-360/:targa`: nel blocco `src/App.tsx` le righe pertinenti mostrano solo la route legacy `Mezzo360`: `src/App.tsx:684`.

### Stato codice `Autista360`

- `src/pages/Autista360.tsx` esiste: `src/pages/Autista360.tsx:1-15`.
- Oggi le route raggiungibili sono solo legacy `/autista-360` e `/autista-360/:badge`, entrambe montano `Autista360`: `src/App.tsx:88`, `src/App.tsx:685-686`.
- `src/next/NextDriverExperiencePage.tsx` esiste, ma in `src/App.tsx` non e importato ne montato: `src/next/NextDriverExperiencePage.tsx:4-16`, `src/App.tsx:48-51`, `src/App.tsx:684-686`.
- `NextDriverExperiencePage` e un placeholder, non una pagina operativa equivalente: renderizza solo `Area Autista`, un testo di separazione e il link `Torna alla Home clone`: `src/next/NextDriverExperiencePage.tsx:6-10`.
- Il placeholder NEXT non espone reader o writer dominio autista nelle prime righe del file; espone solo shell testuale e link di ritorno: `src/next/NextDriverExperiencePage.tsx:4-10`.

### Conclusione secca punto 3

- `Mezzo360`: codice legacy presente e routato; nessun equivalente NEXT montato in `src/App.tsx`: `src/App.tsx:87`, `src/App.tsx:684`.
- `Autista360`: codice legacy presente e routato; esiste un file NEXT placeholder non routato e non equivalente funzionale: `src/App.tsx:88`, `src/App.tsx:685-686`, `src/next/NextDriverExperiencePage.tsx:6-10`.

### Confronto con audit originale sezioni 2.5 e 2.10

- La lettura dell'audit su `Mezzo360` coincide con il codice: pagina madre presente, nessuna pagina NEXT routata: `docs/audit/AUDIT_GAP_NEXT_VS_MADRE_2026-04-22.md:89`, `src/App.tsx:87`, `src/App.tsx:684`.
- La lettura dell'audit su `Autista360` coincide con il codice: file `NextDriverExperiencePage` esistente ma non montato e placeholder: `docs/audit/AUDIT_GAP_NEXT_VS_MADRE_2026-04-22.md:138-140`, `src/next/NextDriverExperiencePage.tsx:6-10`, `src/App.tsx:685-686`.

## Verdetto finale sintetico

- Punto 1 `Materiali da ordinare`: audit originale `PARZIALMENTE` corretto sul barrier aperto, ma `NON` corretto sulla parity scrivente rispetto alla madre; parity oggi `NO`: `docs/audit/AUDIT_GAP_NEXT_VS_MADRE_2026-04-22.md:42`, `src/next/NextMaterialiDaOrdinarePage.tsx:1066-1080`.
- Punto 2 `Dettaglio Ordine`: audit originale `NO`; il dettaglio oggi e inglobato runtime nel modulo unico procurement, con wrapper di redirect residuo: `docs/audit/AUDIT_GAP_NEXT_VS_MADRE_2026-04-22.md:46`, `src/next/NextProcurementStandalonePage.tsx:54-63`.
- Punto 3 `Mezzo360` e `Autista360`: audit originale `SI`; il codice conferma legacy routato, nessun `NextMezzo360` montato e `NextDriverExperiencePage` placeholder non routato: `docs/audit/AUDIT_GAP_NEXT_VS_MADRE_2026-04-22.md:89`, `docs/audit/AUDIT_GAP_NEXT_VS_MADRE_2026-04-22.md:138-140`, `src/App.tsx:684-686`, `src/next/NextDriverExperiencePage.tsx:6-10`.
