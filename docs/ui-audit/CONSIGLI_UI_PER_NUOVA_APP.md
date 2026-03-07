# CONSIGLI UI PER NUOVA APP

## Premessa

La nuova UI non deve partire da zero e non deve nemmeno copiare la legacy modulo per modulo. Il repository mostra gia alcune basi molto buone, ma non esiste ancora uno standard unico. La scelta corretta per la NEXT e consolidare i moduli migliori in un sistema coerente e smettere di far convivere piu dialetti CSS paralleli.

## 10 consigli pratici per la nuova UI

1. Usare `DossierMezzo` come riferimento canonico per tutte le detail page entita-centriche.
2. Usare `CentroControllo` come riferimento per pagine di reporting, monitoraggio, filtri e tabelle amministrative.
3. Usare `Acquisti` come modello per i workflow multi-tab e le schede di lavoro complesse, ma senza portare nella NEXT gli override profondi verso `MaterialiDaOrdinare`.
4. Separare chiaramente i gusci pagina della NEXT in pochi tipi canonici: dashboard, report/table, detail page, workflow a schede, workbench specialistica, mobile field app.
5. Portare subito nel nucleo standard `PdfPreviewModal`, `TargaPicker` e i pattern piu maturi di `AutistiEventoModal`.
6. Eliminare dalla nuova UI il linguaggio legacy basato su `.btn-primary/.btn-secondary/.btn-danger` duplicati in file diversi.
7. Unificare badge, chip e stati oggi sparsi tra `dossier-badge`, `cc-badge`, `acq-pill`, `capo-chip`, `company-pill`.
8. Definire una sola toolbar filtri standard riusabile per pagine come `CentroControllo`, `CapoCostiMezzo`, `Acquisti` e inbox admin.
9. Vietare nella NEXT modali costruite inline dentro le pagine quando esiste gia una primitiva modale o un wrapper riusabile.
10. Migrare i moduli deboli vestendo la logica esistente con shell nuove, non trascinando i vecchi CSS come standard grafico.

## Cosa prendere dai moduli migliori

- Da `DossierMezzo`: gerarchia pagina, header bar, card overview, liste, tabelle, badge, modal detail.
- Da `CentroControllo`: KPI cards, filtri, badge stato, tabelle dense, card di esito KO/OK.
- Da `Acquisti`: shell a schede, CTA contestuali, pill di stato, tabelle operative, flusso dettaglio.
- Da `AutistiInboxHome`: dashboard giornaliera, widget operativi e densita informativa gestibile.
- Da `AutistiAdmin`: sezione edit, griglia form, picker targa e struttura workbench.
- Da `CapoMezzi` e `CapoCostiMezzo`: pattern di overview flotta e cost workbench.
- Da `IAHome`: launcher interno a card/stato per strumenti e moduli di supporto.

## Cosa NON trascinare nella NEXT

- Il vecchio layout `premium-card-430` di `Mezzi` come standard visivo.
- Le classi bottone generiche duplicate tra CRUD e moduli legacy.
- `MaterialiDaOrdinare` standalone come riferimento finale, perche nel codice dichiara esplicitamente placeholder e tab non mature.
- I modali inline ad hoc come quello di `HomeAutista`.
- Gli override CSS profondi di un modulo sopra un altro (`Acquisti` sopra `MaterialiDaOrdinare`) come strategia permanente.
- I residui globali non pertinenti (`src/App.css` con `.logo`, `.card`, `.read-the-docs`) e i file backup nel repo.

## Primi elementi del design system da standardizzare

- Page shell: dashboard, report, detail, workflow, mobile.
- Section header con titolo, sottotitolo, contatori e area azioni.
- KPI card / summary card.
- Toolbar filtri standard.
- Tabs standard.
- Data table standard con stati, azioni e varianti dense.
- Card standard per liste/eventi/alert.
- Button system standard: primary, secondary, danger, ghost, small.
- Badge / chip / pill stato standard.
- Modal shell standard.
- Empty state / stato errore / stato loading standard.
- Picker entita standard (`TargaPicker` come base).
- Preview documentale standard (`PdfPreviewModal` come base).

## Moduli recenti che possono fare da riferimento grafico della nuova app

1. `DossierMezzo`
2. `CentroControllo`
3. `Acquisti`
4. `AutistiInboxHome`
5. `AutistiAdmin`
6. `CapoCostiMezzo`
7. `CapoMezzi`
8. `IAHome`
9. `CisternaCaravatePage` per i sottodomini specialistici

## Come costruire una UI piu lineare senza buttare via cio che di buono gia esiste

- Prima definire i 4-5 gusci pagina canonici e mappare ogni modulo reale del repo su uno di essi.
- Poi estrarre dalle aree migliori i componenti standard veramente riusabili: summary card, toolbar filtri, tabs, table, badge, modal, picker, preview documenti.
- Solo dopo rivestire i moduli legacy con i nuovi gusci, evitando di copiare i loro CSS come base.
- Mantenere distinta la UI admin dalla UI autista mobile, ma con stessi token base e stessi principi di stato/azioni/modali.
- Usare `Dossier` come asse principale della parte mezzo-centrica e `CentroControllo` come asse della parte report/monitoraggio.

## Conclusione operativa

La NEXT non deve essere un redesign astratto. Deve essere una convergenza guidata:
- `Dossier` come standard detail;
- `CentroControllo` come standard report;
- `Acquisti` come standard workflow;
- `AutistiInbox/Admin` come standard operativo eventi/backoffice;
- `PdfPreviewModal` e `TargaPicker` come primi componenti trasversali veri.

Tutto il resto va valutato rispetto a questi riferimenti, non rispetto alla media attuale del repo.
