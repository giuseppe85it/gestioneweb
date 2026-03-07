# AUDIT GRAFICA ATTUALE

## Scopo audit

Verificare dal solo repository la UI attuale del gestionale per capire:
- quali pattern grafici e componenti esistono davvero;
- dove sono usati;
- quali sono coerenti e riutilizzabili;
- quali sono transitori, vecchi o frammentati;
- quali moduli possono diventare base grafica della nuova app NEXT.

Questo audit e stato eseguito in sola lettura. Non include browser, screenshot o verifica percettiva finale della resa visiva. Quando un punto richiede controllo reale su spaziature, gerarchie, contrasto o responsive, e marcato come `DA VERIFICARE VISIVAMENTE`.

## Metodo usato

- Lettura dei documenti base di progetto e delle regole operative.
- Mappatura delle route reali in `src/App.tsx:95-184`.
- Analisi delle pagine principali `src/pages/*`, `src/autistiInbox/*`, `src/autisti/*`, dei CSS dedicati e dei componenti trasversali.
- Verifica del riuso reale di componenti come `PdfPreviewModal`, `TargaPicker`, `AutistiEventoModal`.
- Ricerca di segnali di frammentazione: classi duplicate, prefix CSS locali, inline style ricorrenti, file placeholder, residue legacy e file backup.

## Aree analizzate

1. Home / Centro di Controllo
2. Flotta / Mezzi
3. Dossier
4. Operativita
5. Magazzino
6. Analisi
7. Autisti
8. Sistema / Supporto

## Panoramica generale della UI attuale

- Il repository non mostra una UI unica e omogenea, ma almeno tre strati distinti: moduli legacy CRUD, moduli transitori di consolidamento e moduli recenti piu vicini a un vero gestionale.
- I nuclei piu forti sono `DossierMezzo`, `CentroControllo`, `Acquisti`, `AutistiInboxHome`, `AutistiAdmin`, `CapoMezzi` e `CapoCostiMezzo`.
- Esistono componenti trasversali reali e gia utili come standard NEXT: `PdfPreviewModal` (`src/components/PdfPreviewModal.tsx:17-83`), `TargaPicker` (`src/components/TargaPicker.tsx:16-137`) e `AutistiEventoModal` (`src/components/AutistiEventoModal.tsx:41-1085`).
- Il riuso oggi avviene piu per componenti funzionali o per import diretto di CSS esistente che per un design system vero. L'esempio migliore e `AnalisiEconomica`, che importa direttamente `./DossierMezzo.css` in `src/pages/AnalisiEconomica.tsx:23-25`.
- Il rischio principale per la NEXT non e la totale assenza di basi buone, ma il contrario: esistono piu linguaggi validi ma separati (`home-`, `cc-`, `dossier-`, `acq-`, `capo-`, `aix-`, `cisterna-`) e senza uno standard unico si rischia di replicare la frammentazione.
- Restano segnali di legacy e igiene incompleta: classi `.btn-primary/.btn-secondary/.btn-danger` duplicate in piu file (`src/pages/Colleghi.css:135-176`, `src/pages/Fornitori.css:103-144`, `src/pages/Mezzi.css:188-197`, `src/pages/OrdiniInAttesa.css:123-215`, `src/pages/DettaglioOrdine.css:60-117`), residui Vite in `src/App.css:9-41` e un backup `src/autistiInbox/AutistiInboxHome.tsx.bak2`.

## Home / Centro di Controllo

### Pattern e componenti principali trovati

- `Home` usa un guscio dashboard ricco con `home-shell`, `home-card` e pannelli verticali/orizzontali in `src/pages/Home.tsx:2423-3615` e `src/pages/Home.css:16-209,1725-1861,1900-1941`.
- I blocchi principali reali della home sono: ricerca 360, alert, sessioni attive, revisioni, rimorchi, motrici/trattori, collegamenti rapidi, piu modali trasversali (`src/pages/Home.tsx:2473-3505`, `3605-3615`).
- `CentroControllo` ha un pattern piu strettamente gestionale con summary cards, toolbar filtri, tabelle report, card KO/OK e preview PDF in `src/pages/CentroControllo.tsx:1279-1703` e `src/pages/CentroControllo.css:1-413`.

### Punti forti

- `CentroControllo` e uno dei moduli piu vicini a un backend console/reporting reale: summary grid, filtri per mese/anno/targa, tabelle dense, badge di stato e card di controllo sono coerenti e leggibili.
- `Home` ha un buon impianto da cockpit operativo e una densita informativa utile per la legacy.
- La home aggancia componenti trasversali veri (`AutistiImportantEventsModal`, `AutistiEventoModal`) e non solo markup locale.

### Punti deboli

- `Home` mescola molti sottopattern nella stessa pagina; e forte come dashboard, ma molto locale e poco esportabile cosi com'e.
- Restano inline style e micro-regole puntuali dentro la pagina (`src/pages/Home.tsx:2473,2606,2760,2835,3087,3214,3342,3498` e altre).
- `CentroControllo` e internamente coerente ma usa comunque un dialetto CSS tutto suo (`cc-*`) e non converge ancora con `Dossier` o `Acquisti`.

### Coerenza visiva

- `Home`: `BUONA` all'interno della pagina, `DISCRETA` rispetto agli altri moduli.
- `CentroControllo`: `FORTE` all'interno della pagina, `BUONA` come candidata a standard report/table.

### Giudizio sintetico

- `Home`: `DA RIFINIRE`, qualita `BUONA`.
- `CentroControllo`: `DA MANTENERE`, qualita `FORTE`.

### Cosa puo essere riusato nella NEXT

- Shell dashboard a card e quick links della home.
- Pattern `summary cards + filters + reporting table + badge` di `CentroControllo`.
- Pattern `control-card` KO/OK di `CentroControllo`.

### Note

- Spaziature, ritmo visivo tra pannelli, peso percepito delle animazioni e resa responsive della home sono `DA VERIFICARE VISIVAMENTE`.

## Flotta / Mezzi

### Pattern e componenti principali trovati

- `Mezzi` resta una pagina ibrida tra form/lista e vecchio layout "premium 430", con classi come `premium-card-430`, `card-header`, `btn-primary`, `btn-secondary`, `btn-danger` (`src/pages/Mezzi.css:1-197`).
- Il markup di `Mezzi` contiene ancora blocchi misti, inline style e porzioni che sembrano nate per debug o gestione locale estesa (`src/pages/Mezzi.tsx:1013-1078,1605-1729`).
- La parte piu moderna della flotta sta nelle pagine `CapoMezzi` e `CapoCostiMezzo`: card per mezzo, filtri, KPI, tab, card documento e approvazioni (`src/pages/CapoMezzi.tsx:390-527`, `src/pages/CapoCostiMezzo.tsx:738-1052`; CSS in `src/pages/CapoMezzi.css:1-257` e `src/pages/CapoCostiMezzo.css:1-521`).

### Punti forti

- `CapoMezzi` ha una struttura chiara per navigare gruppi e metriche mezzo.
- `CapoCostiMezzo` e un buon workbench analitico: KPI card, month chips, tab, card documento e lista approvazioni.
- La flotta ha gia almeno un linguaggio grafico piu vicino a NEXT, ma non e la pagina `Mezzi`.

### Punti deboli

- `Mezzi` e il caso piu evidente di area business importante ancora appoggiata a un linguaggio legacy/ibrido.
- Duplicazione di bottoni generici e termini non specifici (`card`, `btn`, `page-container`) rende difficile elevare `Mezzi` a standard.
- La coesistenza di `Mezzi` vecchio e pagine `Capo*` piu recenti produce una flotta visivamente spezzata.

### Coerenza visiva

- Area complessiva: `DISCRETA`.
- `Capo*`: `BUONA`.
- `Mezzi`: `DEBOLE` come standard grafico.

### Giudizio sintetico

- Area Flotta / Mezzi: `DA UNIFICARE`, qualita `DISCRETA`.
- `Mezzi`: `DA SUPERARE`.
- `CapoMezzi` e `CapoCostiMezzo`: `DA MANTENERE` con rifinitura.

### Cosa puo essere riusato nella NEXT

- Card mezzo e metriche di `CapoMezzi`.
- KPI, chip stato, tab e approvazioni di `CapoCostiMezzo`.
- Non conviene riusare come standard il vecchio layout `premium-card-430` di `Mezzi`.

### Note

- La resa visiva di `Mezzo360` e delle pagine collegate esiste nel repo ma non e stata verificata con browser; l'integrazione finale con flotta/dossier e `DA VERIFICARE VISIVAMENTE`.

## Dossier

### Pattern e componenti principali trovati

- `DossierMezzo` e il modulo piu strutturato per dettaglio entita: wrapper, header bar, grid, card, liste, tabelle, badge e modale dedicata (`src/pages/DossierMezzo.tsx:766-1125,1364-1669,1717-1817`; `src/pages/DossierMezzo.css:3-492`).
- `DossierLista` esiste come accesso alla lista mezzi ma mostra ancora vari inline style (`src/pages/DossierLista.tsx:99-121`), quindi il vero standard forte oggi e il dettaglio, non la lista.
- `PdfPreviewModal` e agganciato direttamente al dossier in `src/pages/DossierMezzo.tsx:978`.

### Punti forti

- Il dossier ha un'impostazione da vero gestionale: pagina entita, informazioni strutturate, documenti, costi, stato e accesso a sezioni correlate.
- E gia il linguaggio grafico che il repo tende a riusare altrove: `AnalisiEconomica` importa `DossierMezzo.css`.
- La gerarchia `header -> overview -> card -> tabella/lista -> modal` e la piu matura del progetto.

### Punti deboli

- `DossierMezzo.tsx` e molto grande e contiene ancora varie eccezioni inline.
- Alcune parti del dettaglio sono forti come sistema, altre sembrano crescita incrementale nello stesso file.
- La lista ingressi al dossier non e rifinita quanto il dettaglio.

### Coerenza visiva

- `FORTE` nel dettaglio.
- `DISCRETA` tra lista e dettaglio.

### Giudizio sintetico

- Area Dossier: `DA MANTENERE`, qualita `FORTE`.

### Cosa puo essere riusato nella NEXT

- Shell del dettaglio mezzo.
- Header bar, badge stato, card header/body, tabelle dossier, modal dossier.
- Questo e il candidato piu forte a diventare standard detail page della NEXT.

### Note

- Tipografia, densita contenuti e responsive del dossier sono `DA VERIFICARE VISIVAMENTE`, ma il codice indica con chiarezza una base molto solida.

## Operativita

### Pattern e componenti principali trovati

- `GestioneOperativa` e dichiarata nel file stesso come semplice hub senza logica di business (`src/pages/GestioneOperativa.tsx:1-14`), con card azione e preview (`src/pages/GestioneOperativa.tsx:99-210`, `src/pages/GestioneOperativa.css:13-203`).
- `LavoriDaEseguire` usa un pattern piu task-oriented, quasi mobile/phone layout, con `lde-page`, `lde-phone`, `lde-tabs`, `lavori-btn` (`src/pages/LavoriDaEseguire.tsx:108-312`, `src/pages/LavoriDaEseguire.css:2-146`).
- `LavoriInAttesa` e piu gestionale di `LavoriDaEseguire`: card contenitore, bottoni condivisi e `PdfPreviewModal` (`src/pages/LavoriInAttesa.tsx:347-502`, `src/pages/LavoriInAttesa.css:1-66`).
- `CisternaCaravatePage` e una workbench specialistica con card, tabelle, KPI grid e pill azienda (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1290-2027`, `src/pages/CisternaCaravate/CisternaCaravatePage.css:1-639`).

### Punti forti

- L'area ha gia sottopattern utili per casi specifici: task board leggera, workbench specialistico, hub operativo.
- `CisternaCaravatePage` e una buona prova che il progetto sa costruire UI specialistiche dense ma leggibili.
- `LavoriInAttesa` e piu vicino a un gestionale di quanto non lo sia il vecchio form puro.

### Punti deboli

- Non esiste ancora un solo linguaggio operativo: `go-*`, `lde-*`, `lia-*`, `cisterna-*` sono mondi paralleli.
- `GestioneOperativa` e dichiaratamente solo un hub; non va scambiata per base completa della NEXT.
- I pattern lavori sono utili ma non ancora maturi quanto dossier/centro controllo/acquisti.

### Coerenza visiva

- `DISCRETA` per area, con forte dispersione tra sotto-moduli.

### Giudizio sintetico

- Area Operativita: `DA UNIFICARE`, qualita `DISCRETA`.

### Cosa puo essere riusato nella NEXT

- Specialist table/KPI pattern di `CisternaCaravatePage`.
- Alcuni pattern card/action di `LavoriInAttesa`.
- Non conviene usare `GestioneOperativa` come standard finale; puo restare modello di hub leggero.

### Note

- Ordine visivo, densita percepita e priorita dei CTA nei moduli lavori/cisterna sono `DA VERIFICARE VISIVAMENTE`.

## Magazzino

### Pattern e componenti principali trovati

- `Acquisti` e il modulo piu maturo dell'area: shell, header, tab, pannelli, bottoni, pill, input, tabella dettaglio e preview PDF (`src/pages/Acquisti.tsx:6168-6381`, `src/pages/Acquisti.css:1-744,416-744`).
- `Acquisti` incorpora e sovrascrive visivamente `MaterialiDaOrdinare` tramite import doppio di CSS (`src/pages/Acquisti.tsx:21-22`) e un grande blocco di override `.acq-tab-panel--fabbisogni .mdo-*` (`src/pages/Acquisti.css:775-1643`).
- `MaterialiDaOrdinare` standalone ha pattern utili (tab, panel, sticky bar, modal, tabella), ma contiene anche placeholder espliciti e tab non ancora mature (`src/pages/MaterialiDaOrdinare.tsx:523,578-599,734-886`; `src/pages/MaterialiDaOrdinare.css:147-705`).
- L'area magazzino/ordini usa anche `PdfPreviewModal` in moduli come `Inventario`, `MaterialiConsegnati`, `OrdiniInAttesa`, `OrdiniArrivati`.

### Punti forti

- `Acquisti` e gia una base da gestionale vero: flusso per schede, stati, dettaglio, gestione materiali e preview PDF.
- Il modulo mostra uno sforzo chiaro di convergenza su un linguaggio piu solido dell'area.
- Le `acq-pill` e le `acq-btn` hanno gia un comportamento abbastanza coerente all'interno della pagina.

### Punti deboli

- La convergenza attuale passa da override profondi del modulo precedente, non da componenti standard. Questo e utile nel breve ma fragile come standard NEXT.
- `MaterialiDaOrdinare` standalone non va preso come benchmark finale: contiene placeholder e tab read-only dichiarate nel codice.
- L'area ha piu pagine vicine come business, ma non ancora unificate in un solo kit.

### Coerenza visiva

- `Acquisti`: `FORTE` dentro il modulo.
- Area complessiva: `BUONA` ma ancora stratificata.

### Giudizio sintetico

- Area Magazzino: `DA RIFINIRE`, qualita `BUONA`.
- `Acquisti`: `DA MANTENERE`.
- `MaterialiDaOrdinare` standalone: `DA SUPERARE` come standard finale, pur mantenendo la logica.

### Cosa puo essere riusato nella NEXT

- Shell a tab e dettaglio di `Acquisti`.
- Pattern `button/pill/input/detail-table`.
- Non conviene trascinare nella NEXT il coupling CSS `Acquisti -> MaterialiDaOrdinare`.

### Note

- La resa reale di gerarchie tabellari dense e scroll orizzontali e `DA VERIFICARE VISIVAMENTE`.

## Analisi

### Pattern e componenti principali trovati

- `AnalisiEconomica` riusa direttamente lo stile Dossier (`src/pages/AnalisiEconomica.tsx:23-25`) e applica card dossier a sezioni analitiche (`src/pages/AnalisiEconomica.tsx:948-1184`).
- Le sezioni `GommeEconomiaSection` e `RifornimentiEconomiaSection` vengono montate come submoduli (`src/pages/AnalisiEconomica.tsx:1038-1039`).
- L'area mantiene `PdfPreviewModal` come standard di preview anche nell'analisi (`src/pages/AnalisiEconomica.tsx:1184`).

### Punti forti

- Questa e la prova piu forte di riuso visivo reale gia presente nel repo: l'analisi non inventa un nuovo linguaggio ma si appoggia al dossier.
- Per una NEXT targa-centrica e un segnale corretto: analisi come estensione del dettaglio mezzo, non come mondo a parte.

### Punti deboli

- Restano inline style sia in `AnalisiEconomica` sia in sottosezioni come `RifornimentiEconomiaSection`.
- L'area analisi eredita bene il guscio, ma non ha ancora componenti condivise piu profonde oltre al CSS importato.

### Coerenza visiva

- `BUONA`, soprattutto in relazione al Dossier.

### Giudizio sintetico

- Area Analisi: `DA MANTENERE`, qualita `BUONA`.

### Cosa puo essere riusato nella NEXT

- Convergenza `analisi dentro il dossier`.
- Card analitiche su shell dossier.
- Preview PDF condivisa.

### Note

- La leggibilita reale delle sezioni economiche piu dense e `DA VERIFICARE VISIVAMENTE`.

## Autisti

### Pattern e componenti principali trovati

- L'area admin/autisti usa una dashboard operativa reale in `AutistiInboxHome` con widget riusati (`SessioniAttiveCard`, `RifornimentiCard`), `daily-card`, modali e accesso ai dettagli (`src/autistiInbox/AutistiInboxHome.tsx:389-889`, `src/autistiInbox/AutistiInboxHome.css:8-527`).
- `AutistiAdmin` e una workbench form-heavy ma strutturata, con sezioni edit, griglie, picker targa e preview PDF (`src/autistiInbox/AutistiAdmin.tsx:2979-3668`, `src/autistiInbox/AutistiAdmin.css:597-758`).
- L'app autista mobile (`HomeAutista`) usa un linguaggio separato e piu pragmatico (`src/autisti/HomeAutista.tsx:343-465`, `src/autisti/autisti.css:59-114`), con un modale sgancio costruito quasi tutto inline (`src/autisti/HomeAutista.tsx:408-465`).

### Punti forti

- `AutistiInboxHome` e uno dei migliori moduli operativi del repo: informazioni vive, alert, card giornaliere e accesso rapido ad azioni/contesto.
- `AutistiAdmin` ha gia struttura da backoffice vero, soprattutto nelle modali editing.
- `TargaPicker` entra in piu flussi reali di `AutistiAdmin`, segno di riuso concreto.

### Punti deboli

- La separazione tra area admin e area autista mobile e giusta come prodotto, ma oggi la UI admin e quella mobile non derivano da un sistema condiviso.
- `HomeAutista` e utile per il campo, ma non puo diventare standard grafico admin.
- E presente un file backup `src/autistiInbox/AutistiInboxHome.tsx.bak2`, segnale di igiene da consolidare.

### Coerenza visiva

- Admin (`AutistiInboxHome`, `AutistiAdmin`): `BUONA`.
- Mobile autista: `DISCRETA`.
- Area complessiva: `DISCRETA/BUONA`, ma volutamente biforcata.

### Giudizio sintetico

- Area Autisti: `DA UNIFICARE` sul lato admin, qualita `BUONA`.
- `AutistiInboxHome` e `AutistiAdmin`: `DA MANTENERE` con rifinitura.
- `HomeAutista`: `DA RIFINIRE` come UI mobile di campo, non come standard globale.

### Cosa puo essere riusato nella NEXT

- Daily cards e widget inbox lato admin.
- Form workbench di `AutistiAdmin`.
- `TargaPicker` e `AutistiEventoModal` come componenti di supporto.

### Note

- Coerenza percettiva tra admin desktop e mobile autista e `DA VERIFICARE VISIVAMENTE`.

## Sistema / Supporto

### Pattern e componenti principali trovati

- `IAHome` e un launcher pulito a card/stato per strumenti IA (`src/pages/IA/IAHome.tsx:40-190`, `src/pages/IA/IAHome.css:1-126`).
- `PdfPreviewModal` e il componente trasversale piu forte del repo: e importato in almeno dossier, centro controllo, acquisti, analisi, inventario, lavori, cisterna/autisti e moduli capo.
- `TargaPicker` e un piccolo componente di selezione riusato davvero in `AutistiAdmin`.
- `AutistiEventoModal` e un support component complesso che integra a sua volta `TargaPicker` e `PdfPreviewModal` (`src/components/AutistiEventoModal.tsx:41-1085`).
- A livello di shell applicativa restano residui generici di bootstrap Vite in `src/App.css:9-41` (`.logo`, `.card`, `.read-the-docs`) e route molto numerose sotto la stessa app shell (`src/App.tsx:95-184`).

### Punti forti

- I componenti trasversali piu utili esistono gia: il repo non parte da zero.
- `IAHome` e un buon modello per pagine "launcher/supporto" a stato.
- `PdfPreviewModal` e gia di fatto uno standard condiviso.

### Punti deboli

- Il layer sistema/supporto non e ancora formalizzato come design system.
- Alcuni residui legacy (`App.css`, backup file) indicano che la UI e cresciuta per accumulo.
- Il riuso e concreto ma non ancora governato con token e primitive canoniche.

### Coerenza visiva

- `BUONA` per i componenti riusati.
- `DISCRETA` a livello di governance generale.

### Giudizio sintetico

- Area Sistema / Supporto: `DA RIFINIRE`, qualita `BUONA`.

### Cosa puo essere riusato nella NEXT

- `PdfPreviewModal` come modal standard di preview documentale.
- `TargaPicker` come entity picker leggero.
- `IAHome` come riferimento per landing interne e launcher tools.

### Note

- Spaziature, proporzioni e contrasto finali dei componenti riusati sono `DA VERIFICARE VISIVAMENTE`.

## Pattern migliori del progetto

1. Shell e gerarchia del `DossierMezzo`.
2. `CentroControllo` come report console con filtri, summary card, tabelle e card KO/OK.
3. `Acquisti` come workflow multi-tab con gestione stati, pill e tabelle dettaglio.
4. `AutistiInboxHome` come dashboard operativa ad alta densita.
5. `CapoCostiMezzo` come workbench analitico/costi.
6. `PdfPreviewModal` come componente trasversale gia standardizzabile.

## Pattern peggiori o piu vecchi

1. `Mezzi` e il vecchio layout `premium-card-430` come standard flotta.
2. CRUD semplici `Colleghi` e `Fornitori` con classi `.btn-*` generiche duplicate.
3. `MaterialiDaOrdinare` standalone come riferimento grafico finale, perche contiene placeholder espliciti.
4. `HomeAutista` per quanto riguarda i modali inline non componentizzati.
5. Accumulo di classi generiche/residui globali (`src/App.css`) e file backup (`AutistiInboxHome.tsx.bak2`).

## Moduli piu "da gestionale vero"

- `DossierMezzo`
- `CentroControllo`
- `Acquisti`
- `AutistiInboxHome`
- `AutistiAdmin`
- `CapoCostiMezzo`
- `CapoMezzi`
- `CisternaCaravatePage` come workbench specialistica

## Rischio di incoerenza se si rifa la NEXT senza standard UI

- Alto rischio di duplicare di nuovo shell pagina, card, tabelle, badge, toolbar filtri e modali in piu varianti simili ma incompatibili.
- Alto rischio di trascinare coupling locale invece di standardizzare componenti: il caso piu chiaro oggi e `Acquisti` che sovrascrive `MaterialiDaOrdinare`.
- Rischio medio di perdere i moduli migliori perche "sembrano solo legacy", quando in realta contengono gia pattern forti da consolidare.
- Rischio basso/immediato sui flussi legacy se l'audit resta documentale; il rischio vero e soprattutto architetturale/futuro se si progetta la NEXT senza questo mapping.
