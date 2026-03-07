# DESIGN SYSTEM NEXT

## Scopo

Questo documento definisce gli standard grafici ufficiali della nuova app NEXT. Non descrive componenti React o CSS concreti, ma stabilisce:
- famiglie di layout;
- regole di composizione;
- pattern visivi comuni;
- uso funzionale di colori, stati e gerarchie;
- dove e perche ogni standard deve essere usato.

I riferimenti principali nel repo attuale sono:
- `DossierMezzo`
- `CentroControllo`
- `Acquisti`
- `AutistiInboxHome`
- `CapoCostiMezzo`
- componenti trasversali `PdfPreviewModal` e `TargaPicker`

## 1. Layout pagina standard

### Famiglie ufficiali

| Variante | Ispirazione repo | Perche scelta | Uso nella NEXT |
|---|---|---|---|
| Dashboard shell | `CentroControllo`, `Home`, `AutistiInboxHome` | Gestisce priorita, KPI, code, alert e accessi rapidi con alta densita leggibile | Centro di Controllo, inbox operative, monitor trasversali |
| Detail shell | `DossierMezzo`, `AnalisiEconomica` | E la grammatica piu forte per entita e contesto | Dossier Mezzo, dettagli documento/costo, viste entita-centriche |
| Workflow shell | `Acquisti` | Tiene insieme tab, stati, dettagli e azioni contestuali | Acquisti & Magazzino, workflow ordini, fabbisogni, consegne |
| Workbench shell | `CapoCostiMezzo`, `CisternaCaravatePage`, parti di `AutistiAdmin` | Utile per aree dense, specialistiche o amministrative | Costi, approvazioni, domini specialistici, backoffice |
| Field shell separata | `HomeAutista`, area autisti | Serve a non imporre la densita admin in mobile campo | Area autisti, fuori dalla shell admin principale |

### Regole

- Ogni pagina deve appartenere a una sola famiglia primaria.
- Le famiglie possono condividere componenti, ma non devono fondersi in layout ibridi.
- La barra titolo e la toolbar contestuale sono obbligatorie in tutte le famiglie, tranne eventuali landing pure.
- La pagina non deve avere piu di due livelli di struttura visiva prima del contenuto: header pagina e fascia strumenti.

## 2. Dashboard cards standard

### Tipi ufficiali

| Tipo | Ispirazione repo | Perche scelto | Uso nella NEXT |
|---|---|---|---|
| Summary card | `CentroControllo`, `CapoCostiMezzo` | Rende leggibili numeri chiave senza aprire tabelle | KPI, contatori, stati sintetici |
| Alert / queue card | `Home`, `AutistiInboxHome` | Comunica priorita e presa in carico | priorita oggi, eventi autisti, code aperte |
| Action card | `Home`, `GestioneOperativa`, `IAHome` | Utile per ingressi guidati a un flusso | accessi rapidi, launcher strumenti, azioni principali |
| Context card | `DossierMezzo`, `AnalisiEconomica` | Tiene assieme sintesi e contesto di una entita | overview mezzo, riepilogo documenti, riquadri analitici |

### Regole

- Una card non deve contenere contemporaneamente KPI, form, tabella e storia completa.
- Le dashboard card servono a orientare e ad aprire il dettaglio, non a sostituire il dettaglio.
- Le card con azione primaria devono avere una sola CTA dominante.
- Le card con alert devono esporre stato, contesto minimo e link alla destinazione.

## 3. Tabelle standard

### Varianti ufficiali

| Variante | Ispirazione repo | Perche scelta | Uso nella NEXT |
|---|---|---|---|
| Report table | `CentroControllo` | Ottima per monitor e filtri periodo/targa | report mensili, controlli, segnalazioni, richieste |
| Management table | `Acquisti`, `DossierMezzo` | Supporta righe con stato, azioni e valori operativi | ordini, materiali, documenti, costi |
| Specialist table | `CisternaCaravatePage`, `CapoCostiMezzo` | Gestisce domini piu tecnici e comparativi | costi, domini verticali, log specialistici |

### Regole

- L'intestazione tabella deve essere chiara e stabile.
- La prima o seconda colonna deve contenere l'entita principale o il link al dettaglio.
- Stati e badge stanno in colonna dedicata, non dispersi nel testo.
- Le azioni di riga sono compatte e coerenti: primaria visibile, secondarie in menu o gruppo azioni.
- Nelle tabelle con record targa-correlati, il ponte al `Dossier Mezzo` e obbligatorio.

## 4. Toolbar filtri standard

| Ispirazione repo | Perche scelta | Uso nella NEXT |
|---|---|---|
| `CentroControllo`, `CapoCostiMezzo`, `Acquisti`, parti di inbox autisti | Questi moduli mostrano gia il pattern piu utile: filtri leggibili, compatti e vicini al contenuto | dashboard, workbench, liste ordini, analisi, inbox |

### Regole

- A sinistra: filtri principali.
- A destra: azioni contestuali e export.
- Filtri veloci sempre visibili; filtri avanzati in pannello espandibile se servono.
- La toolbar non deve competere con il titolo pagina.
- I filtri devono essere coerenti per lingua e struttura: periodo, targa, stato, proprietario, tipo, source.

## 5. Badge stati standard

| Famiglia | Ispirazione repo | Perche scelta | Uso nella NEXT |
|---|---|---|---|
| Success / OK | `cc-badge ok`, `acq-pill is-ok`, `capo-approvazioni-status approved` | Stato positivo leggibile e diffuso nel repo | arrivato, approvato, ok, completo |
| Warning / Attenzione | `acq-pill is-warn`, `cc-summary-card warn`, alert home | Stato che richiede controllo ma non blocco immediato | in scadenza, parziale, da verificare |
| Danger / Critico | `cc-summary-card danger`, `acq-pill is-danger`, `capo-chip danger` | Stato bloccante o urgente | scaduto, KO, errore, mancante critico |
| Info / Contestuale | `dossier-badge badge-info`, `company-pill`, `ia-card-status` | Stato descrittivo non allarmistico | sorgente, tipo, categoria, contesto |
| Neutral / Pending | `capo-approvazioni-status pending`, badge non accentati | Serve per bozza o stato non ancora deciso | bozza, pending, non classificato |

### Regole

- Nessun badge deve basarsi solo sul colore: serve testo esplicito.
- La stessa semantica usa lo stesso colore funzionale in tutta la NEXT.
- I badge informativi non devono sembrare CTA.
- I badge critici devono comparire sempre sopra la piega nelle viste chiave.

## 6. Bottoni standard

| Tipo | Ispirazione repo | Perche scelto | Uso nella NEXT |
|---|---|---|---|
| Primary | `acq-btn--primary`, CTA dossier/home/centro controllo | Serve per la singola azione principale | salva, apri dettaglio, genera PDF, prendi in carico |
| Secondary | `cc-secondary-btn`, `acq-btn`, bottoni utilita | Supporta refresh, annulla, azioni non dominanti | aggiorna, annulla, apri pannello, filtri |
| Ghost / Text | `lavori-btn is-ghost`, link contestuali | Riduce rumore in liste dense | azioni secondarie di riga, toggle contestuali |
| Danger | `acq-btn--danger`, bottoni delete legacy da rifinire | Necessario per azioni distruttive | elimina, rimuovi, reset |
| Small / Inline | `acq-btn--small`, azioni compatte inbox/liste | Riduce il peso in tabelle e card dense | apri, preview, allega, segna stato |

### Regole

- Una pagina non deve avere piu di una primary CTA principale per fascia.
- Le azioni distruttive devono essere separate visivamente e richiedere conferma coerente.
- I bottoni inline devono avere dimensioni coerenti e non sembrare badge.
- La NEXT non deve riutilizzare il vecchio sistema `.btn-primary/.btn-secondary/.btn-danger` duplicato modulo per modulo.

## 7. Modali standard

| Variante | Ispirazione repo | Perche scelta | Uso nella NEXT |
|---|---|---|---|
| Preview modal | `PdfPreviewModal` | E gia il componente trasversale piu solido | PDF, documenti, allegati, export |
| Edit modal strutturata | `AutistiAdmin`, modali dossier | Utile per rettifiche e form medi, senza cambiare contesto pagina | edit evento, edit metadata, assegnazioni |
| Confirm modal | pattern implicito richiesto da azioni danger | Necessario per sicurezza operativa | elimina, reset, chiusura stato sensibile |

### Regole

- Le modali servono per preview, edit medio, conferma o azioni contestuali corte.
- I form lunghi o strategici devono avere pagina dedicata o pannello strutturato, non modal infinita.
- Le modali devono avere sempre: titolo chiaro, contesto, azioni finali, chiusura coerente.
- Niente modali costruite inline ad hoc nella NEXT se il design system prevede gia una shell modale.

## 8. Form / input standard

| Ispirazione repo | Perche scelta | Uso nella NEXT |
|---|---|---|
| `AutistiAdmin`, `Acquisti`, parti migliori di `CapoCostiMezzo` e `DossierMezzo` | Queste pagine mostrano form densi ma leggibili, con campi verticali o a griglia | sistema, backoffice, edit documenti, ordini, rettifiche |

### Regole

- Label sempre sopra il campo.
- Helper text solo se utile a ridurre errore.
- Errori vicino al campo e riepilogo in alto se il form e lungo.
- Griglia 2 colonne desktop, 1 colonna su width ridotta.
- `TargaPicker` diventa standard per selezioni targa.
- Campi numerici, data, stato e note devono mantenere ordine coerente tra moduli.

## 9. Pannelli dettaglio standard

| Ispirazione repo | Perche scelta | Uso nella NEXT |
|---|---|---|
| `DossierMezzo`, `AnalisiEconomica`, `CapoCostiMezzo` | Sono i pannelli piu maturi per contesto, stato e drill-down | Dossier, dettagli costo/documento, blocchi analitici |

### Regole

- Ogni pannello dettaglio ha header, corpo e azioni contestuali.
- Il titolo del pannello deve chiarire l'oggetto, non solo il tipo.
- I pannelli possono convivere in griglia, ma devono avere stessa grammatica interna.
- Il pannello dettaglio non deve diventare una pagina dentro la pagina.

## 10. Box riepilogo standard

| Ispirazione repo | Perche scelta | Uso nella NEXT |
|---|---|---|
| `CentroControllo`, `CapoCostiMezzo`, `CapoMezzi`, parti di `Acquisti` | Questi moduli usano bene contatori e riepiloghi brevi | header pagina, blocchi KPI, riepilogo ordini, overview mezzo |

### Regole

- Box riepilogo = numero o stato + etichetta + eventuale delta.
- Non deve contenere troppi testi descrittivi.
- Deve aiutare a capire subito se l'utente deve approfondire.
- Va usato sopra tabelle, non al posto di esse.

## 11. Spacing e gerarchie visive

### Regole base

- Usare una scala coerente basata su multipli piccoli regolari.
- Fasce principali pagina: ampie.
- Spazi interni card e pannelli: medi.
- Distanze tra label e campo: ridotte ma costanti.
- Distanze tra gruppi azioni: maggiori delle distanze tra elementi della stessa famiglia.

### Gerarchia

- Titolo pagina > sottotitolo/contesto > toolbar > contenuto.
- KPI e alert sopra liste e tabelle.
- CTA primaria visibile senza competere con tutti gli altri bottoni.
- I blocchi secondari devono retrocedere visivamente rispetto a stato, scadenze e alert.

## 12. Principi colori funzionali

Questo documento non fissa la palette definitiva in hex. Fissa le funzioni del colore. I valori finali restano `DA VERIFICARE` in fase di implementazione shell reale.

### Famiglie funzionali

- `Primary`: azione principale, navigazione attiva, focus strategico.
- `Neutral`: superfici, testo standard, divisioni, contenimento.
- `Info`: contesto, sorgente, categoria, stato descrittivo.
- `Success`: OK, completato, approvato.
- `Warning`: in verifica, parziale, in scadenza.
- `Danger`: scaduto, KO, errore, blocco.

### Regole

- Mai usare il colore come unico vettore di significato.
- Il colore deve essere stabile tra moduli: "warning" ha sempre stesso significato.
- Le pagine business non devono usare troppi accenti cromatici contemporaneamente.
- Le aree di sistema possono usare il warning/danger in modo piu sobrio e meno "dashboard".

## 13. Regole responsive essenziali

| Area | Regola |
|---|---|
| Shell admin | Sidebar collassabile sotto viewport ridotte; header sempre disponibile |
| Dashboard | Summary cards e queue cards passano da griglia ampia a stack ordinato |
| Tabelle | Toolbar filtri va in wrap; le colonne meno critiche devono degradare o condensarsi |
| Dossier | Header mezzo, badge e azioni devono impilarsi senza perdere il mezzo come focus |
| Workflow | Tabs e CTA devono restare raggiungibili senza overflow ingestibile |
| Modali | Altezza massima controllata e body scrollabile, non pagina scrollata sotto |

### Regole trasversali

- La primary action non deve sparire sotto fold stretto.
- Le entita chiave devono restare visibili anche quando la tabella degrada.
- Il passaggio mobile non deve trasformare tutto in card verbose se la lista e troppo operativa.
- L'area autisti mantiene regole responsive dedicate, non identiche alla shell admin.

## 14. Decisione operativa

Il design system ufficiale della NEXT deve quindi partire da:
- `DossierMezzo` come standard detail/context;
- `CentroControllo` come standard monitor/report;
- `Acquisti` come standard workflow globale;
- `AutistiInboxHome` e `AutistiAdmin` come riferimento operativo/backoffice;
- `CapoCostiMezzo` come riferimento workbench analitico;
- `PdfPreviewModal` e `TargaPicker` come componenti trasversali canonici.

Tutto cio che e legacy, duplicato o troppo locale va re-interpretato dentro questo sistema, non replicato.
