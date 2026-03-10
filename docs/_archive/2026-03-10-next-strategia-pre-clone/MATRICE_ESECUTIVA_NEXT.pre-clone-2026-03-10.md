# MATRICE ESECUTIVA NEXT

Versione: 2026-03-09  
Stato: CURRENT  
Scopo: trasformare la regia gia fissata nei documenti del repository in una base esecutiva unica per i prossimi task NEXT.

## Fonte consolidata
Questa matrice consolida in forma operativa:
- `AGENTS.md`
- `docs/INDICE_DOCUMENTAZIONE_PROGETTO.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/architecture/FUNZIONI_TRASVERSALI.md`
- `docs/flow-master/MAPPA_MAESTRA_FLUSSI_GESTIONALE.md`
- `docs/flow-master/FLUSSI_OPERATIVI_CRITICI.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/data/DOMINI_DATI_CANONICI.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/ui-redesign/modules_master_map.md`
- `docs/ui-redesign/dossier_convergence_map.md`
- `docs/ui-redesign/verification_closure.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Come leggere la matrice
- `Importabile diretto`: dominio gia abbastanza stabile, leggibile in read-only con reader canonico pulito.
- `Normalizer dedicato`: dominio sensibile; la NEXT puo leggerlo solo tramite mapping esplicito e modello interno pulito.
- `Ricostruzione controllata`: dominio sensibile in cui il risultato utile richiede una ricostruzione confinata nel layer NEXT, senza copiare il caos legacy in UI/IA.
- `Bloccato per ora`: dominio da non importare come modulo normale finche non si chiudono i blocchi documentati.
- `Target IA futuro`: blocco da trattare come vista assistita o composizione futura, non come pagina da migrare 1:1.
- `Capability trasversale`: funzione cross-area, non modulo business da clonare.

---

## 1. Centro di Controllo

| Macro-area NEXT | Cluster / dominio | Scopo funzionale | Sorgenti legacy reali | Tipo di trattamento NEXT | Output target | Stato attuale | Dipendenze / note critiche | Prossimo step ammesso | Task vietati ora |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Centro di Controllo | D10 Stato operativo, alert e promemoria | Cabina di regia del giorno operativo: focus, alert, counters, priorita, link ai record critici | `@alerts_state`, `@mezzi_aziendali`, `@autisti_sessione_attive`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti` | Importabile diretto con layer pulito | UI NEXT classica + IA futura | Layer fatto + UI fatta | Restare cockpit, non copia di `Home`; ogni alert deve puntare a un record reale | Consolidare modello D10 e ampliare i link canonici ai record | Portare `homeEvents` raw in pagina; clonare widget `Home`; aprire scritture NEXT |
| Centro di Controllo | D03 Feed autisti verso cockpit | Esporre solo segnali operativi utili provenienti dall'area autisti, non migrare il runtime autista | `@storico_eventi_operativi`, `@autisti_sessione_attive`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@richieste_attrezzature_autisti_tmp` | Bloccato per ora come dominio pieno; lettura parziale controllata | UI NEXT classica + IA futura | Parziale | Stream canonico eventi ancora punto aperto; area autisti resta separata | Limitare i feed a segnali stabili con marcature esplicite dove serve | Importare `AutistiAdmin`; modellare l'autista come backoffice ridotto; usare `autisti_eventi` come sorgente certa |
| Centro di Controllo | D04 Segnali consumi / anomalie rifornimenti | Portare nel cockpit solo sintesi e anomalie consumo, non il flusso rifornimenti completo | `@rifornimenti`, `@rifornimenti_autisti_tmp` | Normalizer dedicato dopo consolidamento D04 dossier | UI NEXT classica + IA futura | Non iniziato | Va riusato il layer D04, non una seconda logica parallela per il cockpit | Riutilizzare il modello pulito D04 per card sintetiche read-only | Leggere tmp in UI; copiare `RifornimentiEconomiaSection`; creare merge cockpit separati |

## 2. Mezzi / Dossier

| Macro-area NEXT | Cluster / dominio | Scopo funzionale | Sorgenti legacy reali | Tipo di trattamento NEXT | Output target | Stato attuale | Dipendenze / note critiche | Prossimo step ammesso | Task vietati ora |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mezzi / Dossier | D01 Anagrafiche flotta e persone | Ingresso mezzi, identita mezzo, pivot targa stabile per tutto il Dossier | `@mezzi_aziendali`, `@colleghi`, `mezzi_aziendali/<mezzoId>/libretto.jpg` | Importabile diretto | UI NEXT classica + IA futura | Layer fatto + UI fatta | Dominio fondativo; mantenere `targa` e `id` stabili | Consolidare il modello D01 e aggiungere solo i campi davvero necessari al Dossier | Clonare `Mezzi.tsx`; introdurre scritture NEXT; deduplicazioni deboli su label |
| Mezzi / Dossier | D02 Operativita tecnica mezzo | Dare al Dossier backlog lavori, chiusi, manutenzioni essenziali e stato tecnico decisionabile | `@lavori`, `@manutenzioni`, relazioni con `@materialiconsegnati`, `@inventario` | Normalizer dedicato | UI NEXT classica + IA futura | Parziale | Dominio sensibile; il Dossier legge ma non scrive; conversioni da autisti e costi non sono ancora chiuse | Estendere il reader D02 per sottosezioni tecniche mirate, sempre read-only | Portare `DettaglioLavoro` o `Manutenzioni` 1:1; aprire writer Dossier; mischiare materiali/costi senza contratto |
| Mezzi / Dossier | D04 Rifornimenti e consumi | Dare al Dossier uno storico rifornimenti leggibile e utile senza esporre caos legacy | `@rifornimenti`, `@rifornimenti_autisti_tmp` | Ricostruzione controllata | UI NEXT classica + IA futura | Layer fatto + UI fatta parziale | La complessita D04 deve restare tutta nel layer NEXT con provenienza e qualita dato | Consolidare il contratto del modello pulito D04 e riusarlo anche fuori dalla pagina dettaglio | Leggere tmp in pagina; copiare merge legacy nei componenti; aprire scritture; dichiarare D04 gia canonico runtime |
| Mezzi / Dossier | D07 Documenti mezzo / libretti | Dare al Dossier un pannello documentale mezzo-centrico con provenienza chiara e filtri robusti | `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`, `documenti_pdf/...`, `mezzi_aziendali/<mezzoId>/libretto.jpg` | Normalizer dedicato | UI NEXT classica + IA futura | Non iniziato | Dominio documentale business-critical ma ancora da verificare; canali IA e libretti non sono ancora totalmente consolidati | Costruire un reader read-only per documenti mezzo con `sourceKey/sourceDocId/sourceType` | Clonare `DossierMezzo` documenti; aprire delete/edit NEXT; esporre segreti/config IA |
| Mezzi / Dossier | D08 Costi e analisi economica mezzo | Dare al Dossier una lettura economica spiegabile del mezzo, non la somma grezza di moduli legacy | `@costiMezzo`, `@analisi_economica_mezzi`, `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`, `@rifornimenti`, `@manutenzioni` | Normalizer dedicato | UI NEXT classica + IA futura | Non iniziato | Dominio derivato da piu sorgenti; va sempre dichiarata la provenienza del costo o del documento | Disegnare un layer read-only costi/documenti sintetico per il Dossier | Clonare `CapoCostiMezzo` o `AnalisiEconomica`; fare approvazioni NEXT; confondere costo sorgente con dato derivato |
| Mezzi / Dossier | D05 Materiali dossierizzati | Mostrare solo viste derivate per targa su materiali consegnati o consumati, senza trascinare il magazzino nel Dossier | `@materialiconsegnati`, `@inventario`, `@manutenzioni` | Bloccato per ora | UI NEXT classica + IA futura | Non iniziato | D05 e bloccante per importazione; il Dossier puo solo essere destinazione derivata futura | Aspettare la chiusura del contratto stock/movimenti e preparare solo il perimetro documentale | Importare `Inventario` o `MaterialiConsegnati` nel Dossier; usare stock raw in pagina |

## 3. Operativita Globale

| Macro-area NEXT | Cluster / dominio | Scopo funzionale | Sorgenti legacy reali | Tipo di trattamento NEXT | Output target | Stato attuale | Dipendenze / note critiche | Prossimo step ammesso | Task vietati ora |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Operativita Globale | D06 Procurement, ordini, preventivi, fornitori | Governare fabbisogno, ordini, arrivi, preventivi e fornitori come flusso globale, non mezzo-centrico | `@ordini`, `@preventivi`, `@listino_prezzi`, `@fornitori`, `@preventivi_approvazioni`, `preventivi/ia/...`, `preventivi/<id>.pdf` | Normalizer dedicato | UI NEXT classica + IA futura | Shell | Path allegati preventivi incoerenti; `Acquisti` miscela sottodomini multipli | Separare nel layer NEXT liste/stati ordini e resolver allegati read-only | Clonare `Acquisti.tsx`; aprire upload/edit preventivi NEXT; assumere un solo path allegati |
| Operativita Globale | D05 Magazzino, inventario, movimenti materiali | Governare stock, movimenti e consegne come dominio globale con viste derivate verso i mezzi | `@inventario`, `@materialiconsegnati`, `@attrezzature_cantieri`, `inventario/...`, `materiali/...` | Bloccato per ora | UI NEXT classica + IA futura | Shell | Writer multipli e collegamento non transazionale stock/consegna/manutenzione/import IA | Fermare l'import diretto e preparare una separazione esplicita stock vs movimento vs consegna | Migrare `Inventario` o `MaterialiConsegnati` 1:1; aprire scritture; dossierizzare il magazzino |
| Operativita Globale | D07 Intake documentale globale | Tenere globale l'intake documentale multi-dominio e usarlo come sorgente per domini puliti, non come UI dossierizzata | `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`, `documenti_pdf/...` | Capability trasversale con normalizer dedicato lato lettura | UI NEXT classica + IA futura | Shell | `IADocumenti` non e un semplice pannello mezzo; va trattato come pipeline globale | Delimitare quali output documentali devono alimentare Dossier, Operativita e IA | Spostare l'intera UI `IADocumenti` nel Dossier; trattare i documenti come dominio unico indifferenziato |
| Operativita Globale | D09 Cisterna specialistica | Mantenere il dominio cisterna separato e specialistico finche non esiste un perimetro shell definitivo | `@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili`, `documenti_pdf/cisterna/...` | Bloccato per ora | Non ancora previsto | Non iniziato | Dominio specialistico separato dal Dossier standard e dalla shell iniziale | Lasciare il dominio fuori dai primi import NEXT e documentare solo i punti di contatto | Trattarlo come pagina normale da spostare in NEXT; mescolarlo a D07 o D04 |

## 4. IA Gestionale

| Macro-area NEXT | Cluster / dominio | Scopo funzionale | Sorgenti legacy reali | Tipo di trattamento NEXT | Output target | Stato attuale | Dipendenze / note critiche | Prossimo step ammesso | Task vietati ora |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IA Gestionale | IA Business v1 su Dossier Mezzo | Fornire sintesi spiegabili su stato mezzo, anomalie, scadenze e segnali dossierizzati | Modelli puliti derivati da D01, D02, D04, futuri D07 e D08 | Target IA futuro | IA futura | UI fatta | Deve leggere solo modelli puliti; ogni risposta deve avere fonte, modulo, periodo, `DA VERIFICARE` se serve | Preparare il contratto di input IA per il Dossier, senza backend runtime | Collegare modelli o endpoint reali; leggere dataset raw; trasformarla in chat onnisciente |
| IA Gestionale | IA Business v1 su Centro di Controllo | Fornire lettura assistita del sistema: priorita, anomalie, scadenze, focus operativi | Modelli puliti D10 e feed ammessi dal cockpit | Target IA futuro | IA futura | UI fatta | La IA cockpit deve restare spiegabile e limitata ai segnali realmente stabilizzati | Definire il modello di input/output spiegabile sul cockpit | Fare audit tecnico repo nella stessa runtime; usare feed non canonici come se fossero stabili |
| IA Gestionale | Mezzo360 assistito / vista 360 futura | Evolvere la logica 360 in una vista assistita e composita, non migrare `Mezzo360` come pagina gemella | Futuri modelli puliti da D01, D02, D03, D04, D07, D08 | Target IA futuro | Entrambe | Non iniziato | `Mezzo360` e `Autista360` vanno trattati come composizioni future e non come pagine da importare | Preparare il perimetro informativo 360 per blocchi dati, senza UI clone | Copiare `Mezzo360.tsx`; fondere timeline raw nel Dossier; importare `Autista360` nella shell admin |

## 5. Strumenti Trasversali

| Macro-area NEXT | Cluster / dominio | Scopo funzionale | Sorgenti legacy reali | Tipo di trattamento NEXT | Output target | Stato attuale | Dipendenze / note critiche | Prossimo step ammesso | Task vietati ora |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Strumenti Trasversali | PDF standard cross-modulo | Tenere un solo comportamento PDF tecnico per export, preview e condivisione | `pdfEngine`, `pdfPreview`, dataset modulo-specifici | Capability trasversale | Entrambe | UI fatta | Distinguere PDF standard da PDF intelligenti IA; evitare motori paralleli | Mappare i casi PDF da riusare in NEXT senza attivare ancora export runtime | Portare PDF come modulo business; introdurre nuovi motori o copie locali |
| Strumenti Trasversali | Accessi, ruoli, permessi shell NEXT | Rendere esplicita la visibilita della shell senza fingere sicurezza gia chiusa | `nextAccess`, `NextRoleGuard`, regole documentali sicurezza/permessi | Capability trasversale | UI NEXT classica | Parziale | Il gating attuale e solo frontend; matrice permessi definitiva ancora aperta | Mantenere il gating tecnico e documentare chiaramente i limiti | Trattare il gating frontend come auth reale; aprire funzioni sensibili o dati economici |
| Strumenti Trasversali | Audit log trasversale | Tracciare future azioni sensibili, export e rettifiche quando si passera oltre la sola consultazione | Eventi applicativi futuri cross-modulo | Capability trasversale | Non ancora previsto | Non iniziato | Decisione confermata ma non implementata; serve prima del passaggio a scritture NEXT | Tenerlo nel perimetro architetturale e rimandare l'implementazione a prima fase scrivente | Inventare audit parziali sparsi per modulo; aprire scritture NEXT senza tracciabilita |
| Strumenti Trasversali | Routing canonico e ponte al Dossier | Mantenere una sola lettura navigazionale canonica e accessi rapidi verso il Dossier | Route legacy duplicate dossier/ordini, link targa nei moduli | Capability trasversale | UI NEXT classica + IA futura | Da consolidare | Alias legacy esistono ma non devono guidare la shell target | Consolidare le destinazioni canoniche NEXT e i link record -> Dossier | Portare alias legacy nella shell finale; creare nuovi percorsi duplicati |

---

## A. Regole operative globali
- Madre intoccabile: la NEXT legge la realta del legacy senza romperla.
- Niente clone legacy: si importano domini e funzioni, non pagine 1:1.
- Dominio prima della pagina: prima il dominio canonico, poi il dataset fisico, poi la UI.
- Raw solo nei layer: UI NEXT e IA NEXT leggono solo modelli puliti.
- Le 5 macro-aree shell sono definitive: `Centro di Controllo`, `Mezzi / Dossier`, `Operativita Globale`, `IA Gestionale`, `Strumenti Trasversali`.
- Area autisti separata: alimenta la NEXT tramite dati e segnali, non tramite fusione UI col backoffice.
- `Mezzo360` e target futuro assistito / IA, non pagina da migrare 1:1.

## B. Priorita esecutive
1. Consolidare D01 + D02 + D04 nel Dossier come modello mezzo-centrico pulito unico.
2. Stabilizzare D07 documenti mezzo e D08 costi/analisi in lettura read-only dossierizzata.
3. Riusare i modelli puliti gia ammessi per estendere il `Centro di Controllo` senza copiarne la Home legacy.
4. Separare in `Operativita Globale` il perimetro D06 procurement read-only dal blocco D05 ancora bloccato.
5. Definire il contratto di input/output della `IA Business v1` su Dossier e Centro di Controllo, senza backend runtime.

## C. Task da bloccare
- Importare moduli isolati senza passare dalla matrice dominio -> trattamento -> output.
- Clonare pagine legacy in `/next/*`.
- Portare tmp, raw o fallback direttamente in UI o IA.
- Aprire scritture NEXT su domini ancora in read-only o bloccati.
- Migrare `Mezzo360`, `Autista360`, `Acquisti`, `Inventario`, `AutistiAdmin` come pagine gemelle.
- Dossierizzare moduli globali o globalizzare blocchi mezzo-centrici per comodita UI.
- Trattare il gating frontend come sicurezza effettiva.

## Stato documento
- Questo file e la base esecutiva unica per i prossimi task NEXT.
- Se un task NEXT non puo essere ricondotto a una riga di questa matrice, va fermato prima della patch.
