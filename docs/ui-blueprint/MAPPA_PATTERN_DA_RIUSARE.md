# MAPPA PATTERN DA RIUSARE

## Scopo

Questo documento traduce l'audit UI del repo in decisioni pratiche per la NEXT. Distingue tra:
- pattern validi da trasformare in standard;
- pattern validi ma da rifinire;
- pattern da unificare per evitare duplicazioni;
- pattern vecchi o locali da non trascinare.

La classificazione qui sotto non giudica solo la qualita attuale del modulo. Tiene distinta anche la sua collocazione futura nella nuova app.

## 1. Pattern da riusare come standard

| Pattern / modulo | Riferimento repo attuale | Qualita attuale | Riuso consigliato nella NEXT | Limiti | Area target futura |
|---|---|---|---|---|---|
| Shell detail mezzo | `DossierMezzo` | FORTE | Trasformarla nello standard ufficiale delle pagine entita-centriche | Va alleggerita da eccezioni locali e resa piu modulare | Dossier Mezzo |
| Summary cards + filtri + report table | `CentroControllo` | FORTE | Standard per monitoraggio, report, code e dashboard amministrative | Oggi ancora molto `cc-*` locale | Centro di Controllo, Sistema, report globali |
| Shell workflow a schede | `Acquisti` | FORTE | Standard per aree con tabs, stato, dettaglio e azioni contestuali | Va separata dagli override profondi verso moduli legacy | Acquisti & Magazzino |
| Daily dashboard operativa | `AutistiInboxHome` | FORTE | Standard per inbox e code operative | Va riallineata al sistema comune di badge/toolbar/card | Autisti admin, Centro di Controllo operativo |
| Workbench costi/approvazioni | `CapoCostiMezzo` | BUONA | Standard per aree economiche e approvative dense | Va armonizzato con dossier e centro controllo | Flotta, Analisi, Sistema approvazioni |
| Preview documentale | `PdfPreviewModal` | FORTE | Standard trasversale preview PDF/documenti | Va solo inglobato nel design system ufficiale | Tutte le aree |
| Entity picker targa | `TargaPicker` | FORTE | Standard per selezione mezzo/targa | Puo richiedere varianti per altre entita | Tutte le aree admin |
| Analisi su shell dossier | `AnalisiEconomica` + `DossierMezzo.css` | BUONA | Standard per analisi mezzo-centriche come estensione del dossier | Resta da consolidare la profondita dei submoduli | Dossier / Analisi |

## 2. Pattern da rifinire

| Pattern / modulo | Riferimento repo attuale | Qualita attuale | Riuso consigliato nella NEXT | Limiti | Area target futura |
|---|---|---|---|---|---|
| Dashboard home come guscio iniziale | `Home` | BUONA | Tenere l'idea di cockpit con quick access e alert | Oggi troppo locale, con molte varianti interne | Centro di Controllo |
| Fleet overview cards | `CapoMezzi` | BUONA | Base per overview flotta e accesso al dossier | Non ancora convergente con il resto del sistema | Flotta |
| Edit workbench amministrativa | `AutistiAdmin` | BUONA | Base per modali/edit form strutturati | Densita alta, da normalizzare con form system unico | Autisti admin, Sistema |
| Launcher strumenti | `IAHome` | BUONA | Base per hub funzionali o launchpad interni | Non deve diventare il modello di tutte le aree business | IA & Documenti, Sistema |
| Workbench specialistica verticale | `CisternaCaravatePage` | BUONA | Riferimento per domini specialistici densi | Non va usata come standard generale dell'app | Domini specialistici |
| Atomi operativi Acquisti | `acq-btn`, `acq-pill`, `acq-input`, `acq-detail-table` | BUONA | Base per bottoni, pill, input e tabelle gestione | Oggi troppo legati al modulo `Acquisti` | Acquisti & Magazzino, aree workflow |
| Home autista come UX campo | `HomeAutista` | DISCRETA | Tenere il principio di flusso semplice e rapido per mobile | I modali inline e il linguaggio attuale non vanno copiati nell'admin | Shell autisti separata |

## 3. Pattern da unificare

| Pattern / modulo | Riferimento repo attuale | Qualita attuale | Riuso consigliato nella NEXT | Limiti | Area target futura |
|---|---|---|---|---|---|
| Toolbar filtri | `CentroControllo`, `CapoCostiMezzo`, `Acquisti`, inbox autisti | BUONA ma frammentata | Creare una sola toolbar filtri ufficiale | Oggi ogni modulo ha il proprio dialetto | Tutte le aree admin |
| Badge / chip / pill stato | `dossier-badge`, `cc-badge`, `acq-pill`, `capo-chip`, `company-pill` | DISCRETA/BUONA | Unificare in una sola grammatica di stato | Oggi stessa semantica usa nomi/stili diversi | Tutte le aree |
| Action cards / quick access | `Home`, `GestioneOperativa`, `IAHome` | DISCRETA | Tenere il concetto ma con una sola grammatica visiva | Oggi troppo variabili tra loro | Centro di Controllo, launcher interni |
| Task/list patterns | `LavoriDaEseguire`, `LavoriInAttesa`, inbox autisti | DISCRETA | Creare una famiglia unica di liste operative e task queue | Oggi ci sono shell diverse per scopo simile | Operativita, Autisti admin |
| Form densi amministrativi | `AutistiAdmin`, `CapoCostiMezzo`, parti di `Acquisti` | BUONA ma non uniforme | Normalizzare griglie, label, helper, errori, footer azioni | Oggi il comportamento form non e completamente stabile | Sistema, Backoffice, Workflow |

## 4. Pattern da superare

| Pattern / modulo | Riferimento repo attuale | Qualita attuale | Riuso consigliato nella NEXT | Limiti | Area target futura |
|---|---|---|---|---|---|
| Layout legacy `premium-card-430` | `Mezzi` | DEBOLE | Non riusare come standard grafico | Linguaggio vecchio, troppo locale, bottoni legacy | Nessuna; migrare solo la logica |
| CRUD legacy con `.btn-*` generici | `Colleghi`, `Fornitori`, parte di `Mezzi` | DEBOLE | Non riusare il pattern visivo; tenere solo struttura dati/logica | Duplica bottoni e semantiche | Sistema/Anagrafiche con nuovo shell |
| Modali inline ad hoc | `HomeAutista` e altri casi sparsi | DEBOLE/DISCRETA | Sostituire con modali standard | Fragili, non coerenti, difficili da governare | Nessuna; sostituzione sistemica |
| Residui globali non pertinenti | `src/App.css` (`.logo`, `.card`, `.read-the-docs`) | DEBOLE | Nessun riuso | Artefatti non legati al gestionale reale | Nessuna |
| Override profondi modulo-su-modulo come strategia permanente | `Acquisti` sopra `MaterialiDaOrdinare` | DISCRETA come transizione, debole come standard | Non usare nella NEXT come metodo di composizione | Accoppia troppo i moduli e rende fragile la manutenzione | Nessuna come standard |

## 5. Moduli buoni come funzione ma da collocare correttamente

| Modulo / funzione | Riferimento repo attuale | Qualita attuale | Riuso consigliato nella NEXT | Limiti | Area target futura |
|---|---|---|---|---|---|
| `MaterialiDaOrdinare` come funzione `Fabbisogni materiali` | `MaterialiDaOrdinare`, integrazione in `Acquisti` | Valida funzionalmente, DISCRETA come shell standalone | Mantenere la funzione e la logica di fabbisogno; integrarla nella shell globale `Acquisti & Magazzino` | La shell standalone attuale contiene placeholder e non va presa come standard finale | Acquisti & Magazzino > Fabbisogni |
| `GestioneOperativa` come hub | `GestioneOperativa` | DISCRETA | Tenerla come concetto di accesso/orchestrazione, non come modello completo di pagina verticale | Il file stesso la definisce hub e non modulo business completo | Centro di Controllo / accessi rapidi |
| `DossierLista` come accesso elenco | `DossierLista` | DISCRETA | Tenerla come ingresso alla parte mezzo-centrica, ma riallinearla allo standard Flotta/Dossier | Oggi e meno matura del dettaglio dossier | Flotta & Dossier |
| `Autista360` | `Autista360` | DISCRETA/BUONA | Tenerla come vista trasversale autista-eventi, senza confonderla con il Dossier Mezzo | Deve restare distinta dalla vista mezzo-centrica | Autisti / Analisi trasversale |

## 6. Decisione operativa finale

### Pattern validi da trasformare in standard

- `DossierMezzo`
- `CentroControllo`
- `Acquisti`
- `AutistiInboxHome`
- `CapoCostiMezzo`
- `PdfPreviewModal`
- `TargaPicker`

### Moduli buoni come funzione ma da riposizionare

- `MaterialiDaOrdinare`
- `GestioneOperativa`
- `DossierLista`
- `Autista360`

### Pattern vecchi da non trascinare

- `Mezzi` legacy come linguaggio grafico
- CRUD con `.btn-*` generici duplicati
- modali inline ad hoc
- residui globali non pertinenti

## Nota conclusiva su `MaterialiDaOrdinare`

`MaterialiDaOrdinare` non va classificato come modulo "debole" in senso funzionale. Dal repo risulta una funzione utile e viva, gia in convergenza verso `Acquisti`. La decisione corretta per la NEXT e:

- mantenere la funzione di `Fabbisogni materiali`;
- non assumere che la sua shell standalone attuale debba diventare lo standard grafico;
- collocarla nella futura area globale `Acquisti & Magazzino`, con relazione chiara a ordini, inventario e consegne.
