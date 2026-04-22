# CENSIMENTO DOMINI DATI - STEP 1

## Stato documento
- Tipo: report intermedio di censimento / pre-normalizzazione
- Data: 2026-03-08
- Stato: CURRENT
- Nota: questo file NON e il contratto canonico finale dei dati

## 1. Obiettivo dello step
Questo step serve a fissare una fotografia leggera ma seria del repository per preparare lo step successivo di normalizzazione.

In questo report:
- si identificano i domini dati reali gia vivi nel repo;
- si mappano i moduli principali che li leggono o li scrivono;
- si evidenziano le aree piu dense o incoerenti;
- si propone la struttura del futuro file canonico completo.

Fuori perimetro in questo step:
- censimento campo-per-campo completo;
- refactor o patch applicative;
- modifica della legacy runtime;
- definizione finale del contratto dati canonico.

## 2. Mini analisi impatto iniziale
- Impatto architetturale: ALTO a livello conoscitivo, perche il repo usa dati condivisi tra molti moduli e la NEXT dovra riusare la stessa base dati iniziale.
- Impatto operativo: nessuno sul runtime in questo step, perche il lavoro e docs-only.
- Impatto dati: nessuna modifica ai dataset, ma emerge chiaramente che la normalizzazione futura dovra partire da pochi snodi ad alta densita.
- Lettura generale del repo: il centro reale dei dati oggi non e un DB relazionale o uno schema unico, ma una combinazione di `storage/<key>`, collection dedicate `@...`, path Firebase Storage e poche chiavi locali browser.

## 3. Strati dati reali emersi
1. `storage/<key>` via `getItemSync/setItemSync` in `src/utils/storageSync.ts`: strato dominante del legacy.
2. Collection Firestore dedicate `@...`: soprattutto documentale IA, analisi economica, dominio cisterna, configurazione IA.
3. Firebase Storage: allegati autisti, materiali, libretti, documenti PDF, preventivi.
4. localStorage: solo sessione locale autista e stato locale limitato.

## 4. Principali domini dati trovati

### 4.1 Anagrafiche flotta e persone
- Dataset principali:
  - `@mezzi_aziendali`
  - `@colleghi`
- File/moduli principali:
  - `src/pages/Mezzi.tsx`
  - `src/pages/DossierLista.tsx`
  - `src/pages/DossierMezzo.tsx`
  - `src/pages/Mezzo360.tsx`
  - `src/pages/Home.tsx`
  - `src/pages/CentroControllo.tsx`
  - `src/pages/IA/IALibretto.tsx`
  - `src/pages/IA/IACoperturaLibretti.tsx`
  - `src/autisti/SetupMezzo.tsx`
  - `src/autisti/LoginAutista.tsx`
- Lettura/scrittura:
  - `@mezzi_aziendali`: entrambe, con molti reader e writer multipli.
  - `@colleghi`: piu letto che scritto, ma resta anagrafica condivisa.
- Chiarezza/rischio:
  - medio-alta chiarezza sul ruolo del dominio;
  - rischio medio perche `@mezzi_aziendali` ha un merge custom dedicato in `storageSync.ts`, segnale che il dominio e gia sensibile.

### 4.2 Operativita tecnica mezzo
- Dataset principali:
  - `@lavori`
  - `@manutenzioni`
- File/moduli principali:
  - `src/pages/LavoriDaEseguire.tsx`
  - `src/pages/LavoriInAttesa.tsx`
  - `src/pages/LavoriEseguiti.tsx`
  - `src/pages/DettaglioLavoro.tsx`
  - `src/pages/Manutenzioni.tsx`
  - `src/pages/GestioneOperativa.tsx`
  - `src/pages/DossierMezzo.tsx`
  - `src/pages/Mezzo360.tsx`
  - `src/components/AutistiEventoModal.tsx`
  - `src/autistiInbox/AutistiAdmin.tsx`
- Lettura/scrittura:
  - entrambe le cose;
  - scrittura admin diretta e conversioni da flussi autisti.
- Chiarezza/rischio:
  - abbastanza chiaro come dominio;
  - rischio medio-alto per convergenza Dossier + possibili derivazioni da eventi autisti.

### 4.3 Autisti, sessioni ed eventi di campo
- Dataset principali:
  - `@autisti_sessione_attive`
  - `@storico_eventi_operativi`
  - fallback `autisti_eventi`
  - `@controlli_mezzo_autisti`
  - `@segnalazioni_autisti_tmp`
  - `@richieste_attrezzature_autisti_tmp`
  - `@cambi_gomme_autisti_tmp`
  - `@gomme_eventi`
- File/moduli principali:
  - `src/autisti/LoginAutista.tsx`
  - `src/autisti/HomeAutista.tsx`
  - `src/autisti/SetupMezzo.tsx`
  - `src/autisti/CambioMezzoAutista.tsx`
  - `src/autisti/ControlloMezzo.tsx`
  - `src/autisti/Segnalazioni.tsx`
  - `src/autisti/RichiestaAttrezzature.tsx`
  - `src/autisti/GommeAutistaModal.tsx`
  - `src/autistiInbox/AutistiInboxHome.tsx`
  - `src/autistiInbox/AutistiAdmin.tsx`
  - `src/pages/Home.tsx`
  - `src/pages/CentroControllo.tsx`
  - `src/pages/Autista360.tsx`
  - `src/pages/Mezzo360.tsx`
  - `src/utils/homeEvents.ts`
- Lettura/scrittura:
  - entrambe, con altissima densita di reader/writer.
- Chiarezza/rischio:
  - dominio reale fortissimo ma oggi il piu sensibile;
  - rischio alto per doppio stream eventi, dataset tmp/ufficiali e rettifiche admin distribuite.

### 4.4 Rifornimenti e consumi mezzo
- Dataset principali:
  - `@rifornimenti_autisti_tmp`
  - `@rifornimenti`
- File/moduli principali:
  - `src/autisti/Rifornimento.tsx`
  - `src/autistiInbox/AutistiAdmin.tsx`
  - `src/pages/DossierMezzo.tsx`
  - `src/pages/DossierRifornimenti.tsx`
  - `src/pages/CentroControllo.tsx`
  - `src/pages/Autista360.tsx`
  - `src/pages/Mezzo360.tsx`
  - `src/pages/RifornimentiEconomiaSection.tsx`
  - `src/pages/AnalisiEconomica.tsx`
  - `src/utils/homeEvents.ts`
- Lettura/scrittura:
  - entrambe;
  - generazione lato autisti, rettifica lato admin, consumo in Dossier e analisi.
- Chiarezza/rischio:
  - dominio chiarissimo come business;
  - rischio alto per convivenza tmp/canonico e shape non uniforme di `@rifornimenti`.

### 4.5 Magazzino, inventario e movimenti materiali
- Dataset principali:
  - `@inventario`
  - `@materialiconsegnati`
  - `@attrezzature_cantieri`
- File/moduli principali:
  - `src/pages/Inventario.tsx`
  - `src/pages/MaterialiConsegnati.tsx`
  - `src/pages/Manutenzioni.tsx`
  - `src/pages/GestioneOperativa.tsx`
  - `src/pages/DossierMezzo.tsx`
  - `src/pages/Mezzo360.tsx`
  - `src/pages/AttrezzatureCantieri.tsx`
  - `src/pages/IA/IADocumenti.tsx`
  - `src/pages/Acquisti.tsx`
  - `src/pages/DettaglioOrdine.tsx`
- Lettura/scrittura:
  - entrambe, con writer multipli.
- Chiarezza/rischio:
  - chiarezza media;
  - rischio alto perche inventario, consegne, manutenzioni e import IA insistono sugli stessi dati senza transazione evidente.

### 4.6 Procurement, ordini, preventivi e fornitori
- Dataset principali:
  - `@ordini`
  - `@preventivi`
  - `@listino_prezzi`
  - `@fornitori`
  - `@preventivi_approvazioni`
- File/moduli principali:
  - `src/pages/Acquisti.tsx`
  - `src/pages/DettaglioOrdine.tsx`
  - `src/pages/MaterialiDaOrdinare.tsx`
  - `src/pages/OrdiniInAttesa.tsx`
  - `src/pages/OrdiniArrivati.tsx`
  - `src/pages/Fornitori.tsx`
  - `src/pages/Inventario.tsx`
  - `src/pages/CapoCostiMezzo.tsx`
- Lettura/scrittura:
  - entrambe;
  - `Acquisti.tsx` e il modulo piu denso del dominio.
- Chiarezza/rischio:
  - abbastanza chiaro come dominio;
  - rischio alto per contratto allegati preventivi non canonico e per impatto laterale su inventario/listino.

### 4.7 Documentale IA, libretti e configurazione IA
- Dataset principali:
  - `@documenti_mezzi`
  - `@documenti_magazzino`
  - `@documenti_generici`
  - `@impostazioni_app/gemini`
  - path Storage `documenti_pdf/...`
  - path Storage `mezzi_aziendali/<mezzoId>/...`
- File/moduli principali:
  - `src/pages/IA/IADocumenti.tsx`
  - `src/pages/IA/IAApiKey.tsx`
  - `src/pages/IA/IALibretto.tsx`
  - `src/pages/IA/IACoperturaLibretti.tsx`
  - `src/pages/DossierMezzo.tsx`
  - `src/pages/Mezzo360.tsx`
  - `src/pages/AnalisiEconomica.tsx`
  - `src/pages/CapoCostiMezzo.tsx`
  - `src/pages/CapoMezzi.tsx`
- Lettura/scrittura:
  - entrambe;
  - IADocumenti e libretti scrivono, molte viste leggono.
- Chiarezza/rischio:
  - chiarezza media;
  - rischio alto perche unisce documenti, IA, Storage, costi e talvolta import magazzino.

### 4.8 Costi e analisi economica
- Dataset principali:
  - `@costiMezzo`
  - `@analisi_economica_mezzi`
  - letture da `@documenti_*`, `@rifornimenti`, `@manutenzioni`
- File/moduli principali:
  - `src/pages/AnalisiEconomica.tsx`
  - `src/pages/CapoCostiMezzo.tsx`
  - `src/pages/CapoMezzi.tsx`
  - `src/pages/DossierMezzo.tsx`
  - `src/pages/RifornimentiEconomiaSection.tsx`
  - `src/pages/GommeEconomiaSection.tsx`
- Lettura/scrittura:
  - prevalenza lettura e aggregazione;
  - scrittura su snapshot analisi IA e approvazioni preventivi.
- Chiarezza/rischio:
  - chiarezza media;
  - rischio medio-alto perche e un dominio derivato che dipende da piu sorgenti non perfettamente allineate.

### 4.9 Cisterna specialistica
- Dataset principali:
  - `@documenti_cisterna`
  - `@cisterna_schede_ia`
  - `@cisterna_parametri_mensili`
  - riuso di `@rifornimenti_autisti_tmp`
  - supporto da `@mezzi_aziendali` e `@colleghi`
- File/moduli principali:
  - `src/cisterna/collections.ts`
  - `src/pages/CisternaCaravate/CisternaCaravatePage.tsx`
  - `src/pages/CisternaCaravate/CisternaCaravateIA.tsx`
  - `src/pages/CisternaCaravate/CisternaSchedeTest.tsx`
- Lettura/scrittura:
  - entrambe, ma nel perimetro specialistico.
- Chiarezza/rischio:
  - dominio chiaro e separato;
  - rischio medio per integrazione parziale con flussi autisti/rifornimenti.

### 4.10 Stato operativo trasversale e supporto
- Dataset principali:
  - `@alerts_state`
- File/moduli principali:
  - `src/pages/Home.tsx`
- Lettura/scrittura:
  - entrambe, ma come stato operativo/UI e non come dominio business primario.
- Chiarezza/rischio:
  - chiaro;
  - rischio basso come dominio, ma va separato dal futuro file canonico business.

## 5. Aree piu dense o incoerenti
1. `AutistiAdmin.tsx`
   - e il nodo di rettifica/conversione piu denso;
   - tocca sessioni, eventi, segnalazioni, controlli, gomme, richieste, rifornimenti e lavori.
2. `Acquisti.tsx`
   - concentra ordini, preventivi, listino, inventario, Storage allegati e PDF;
   - e il punto piu pesante del procurement.
3. `DossierMezzo.tsx`
   - aggrega mezzi, lavori, manutenzioni, materiali, rifornimenti, documenti, costi;
   - e gia una vista convergente di fatto, anche prima della NEXT.
4. `Home.tsx` + `src/utils/homeEvents.ts`
   - usano molti feed autisti e stato alert;
   - contengono anche segnali di shape non uniforme su alcuni dataset.
5. `IADocumenti.tsx` + `AnalisiEconomica.tsx`
   - legano documenti, costi, IA, Storage, inventario e analisi;
   - sono cruciali per la futura normalizzazione read-only della NEXT.

## 6. Le 5 aree piu critiche per la futura normalizzazione NEXT
1. Stream autisti canonico
   - `@storico_eventi_operativi` e `autisti_eventi` convivono ancora.
2. Rifornimenti tmp vs canonico
   - `@rifornimenti_autisti_tmp` e `@rifornimenti` non sono ancora un contratto perfettamente pulito.
3. Inventario / consegne / manutenzioni / import IA
   - troppi writer sullo stesso dominio (`@inventario`, `@materialiconsegnati`).
4. Preventivi e allegati Storage
   - pattern multipli su `preventivi/ia/*` e `preventivi/<id>.pdf`.
5. Documenti IA e costi
   - `@documenti_*`, `@costiMezzo`, `@analisi_economica_mezzi` e i relativi endpoint esterni vanno letti come un blocco unico, non come moduli separati.

## 7. Valutazione dei documenti dati gia esistenti
- `docs/data/MAPPA_COMPLETA_DATI.md`
  - forte come mappa fisica key/collection/path;
  - non basta da sola per costruire il file canonico finale per domini.
- `docs/data/REGOLE_STRUTTURA_DATI.md`
  - forte come contratto entity-level ad alto livello;
  - non basta da sola per leggere densita modulo, collisioni writer/reader e priorita di normalizzazione.

### Esito
- I documenti esistenti sono buoni e riusabili.
- Pero per lo step successivo serve un nuovo file principale, dedicato ai domini canonici e alla normalizzazione.

## 8. Proposta di struttura del futuro file canonico finale

### Nome consigliato
- `docs/data/DOMINI_DATI_CANONICI.md`

### Struttura consigliata
1. Scopo, perimetro e legenda stati
2. Strati dati del progetto
   - `storage/<key>`
   - collection dedicate
   - Storage file/path
   - stato locale browser
3. Regole globali
   - chiavi logiche comuni
   - convenzioni `targa`, `id`, timestamp
   - criteri `CONFERMATO` / `DA VERIFICARE`
4. Indice domini canonici
5. Sezione per ogni dominio
   - missione del dominio
   - dataset fisici coinvolti
   - entita principali
   - writer reali
   - reader reali
   - moduli legacy coinvolti
   - collocazione target nella NEXT
   - livello di convergenza nel Dossier
   - incoerenze note
   - regole di normalizzazione consigliate
6. Relazioni cross-dominio
   - mezzo
   - autista/badge
   - fornitore
   - ordine/preventivo/documento
7. Punti aperti che bloccano la canonicalizzazione piena
8. Appendice
   - tabella dataset -> dominio
   - tabella file pivot -> dominio
   - tabella priorita normalizzazione

## 9. Decisione operativa per lo step 2
- Base sufficiente per costruire il file canonico finale: SI.
- Modalita consigliata:
  - non partire dalle singole chiavi in ordine alfabetico;
  - partire dai domini sopra identificati;
  - usare `MAPPA_COMPLETA_DATI` come sorgente fisica;
  - usare `REGOLE_STRUTTURA_DATI` come base entity-level;
  - marcare esplicitamente `DA VERIFICARE` sui 5 punti critici.

## 10. Esito finale secco
- **PRONTI PER STEP 2**

