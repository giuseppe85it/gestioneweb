# Audit Home - Flussi, Moduli, Ingressi

## 1. Scopo audit
Questo audit serve a ridurre il rumore della Home del gestionale senza perdere funzioni importanti.

L'obiettivo pratico e capire, con base nel codice reale del repo:
- quali moduli sono davvero centrali;
- quali ingressi sono duplicati;
- quali flussi generano urgenze, alert o ripresa lavoro;
- cosa ha senso tenere in Home;
- cosa va spostato in Navigazione rapida, ricerca o modulo padre.

## 2. Metodo
### Fatti verificati
Sono stati verificati:
- route e mount reali in `src/App.tsx`;
- runtime Home corrente in `src/next/NextHomePage.tsx` e `src/next/NextCentroControlloPage.tsx`;
- composizione Navigazione rapida in `src/next/components/QuickNavigationCard.tsx`;
- letture dati e dipendenze principali dei moduli NEXT sotto `src/next/*`;
- documentazione ufficiale di stato e architettura indicata dal prompt.

### Raccomandazioni e inferenze dichiarate
Le parti propositive del report sono raccomandazioni guidate, non fatti telemetrici:
- `Frequenza uso`;
- `Urgenza`;
- valutazione `Deve stare in home?`.

Quando un fatto non e dimostrabile dal repo e dalla documentazione letta, viene marcato `DA VERIFICARE`.

## 3. Moduli analizzati
1. Home NEXT / Centro di Controllo Home
2. Gestione Operativa
3. Dossier Mezzi
4. Mezzi
5. Autisti Inbox (admin)
6. Autisti Admin / Centro rettifica dati
7. App Autisti
8. IA interna
9. IA hub
10. IA Libretto
11. Acquisti / Procurement
12. Materiali da ordinare
13. Manutenzioni
14. Cisterna

## 4. Schede modulo complete

### MODULO: Home NEXT / Centro di Controllo Home
Serve a: cockpit operativo sintetico con alert, stato operativo, navigazione rapida e launcher IA interna.

Lo usa: admin, capi operativi, utenti che devono riprendere attivita urgenti o attraversare rapidamente il gestionale.

Ci si entra da:
- route `/next` in `src/App.tsx`;
- `NextHomePage` che monta `NextCentroControlloPage` in `src/next/NextHomePage.tsx`.

Da li si va a:
- modali alert e revisioni;
- `/next/autisti-inbox`, `/next/autisti-admin`, `/next/gestione-operativa`, `/next/mezzi`, `/next/dossiermezzi`, `/next/manutenzioni`, `/next/acquisti`, `/next/ia`, `/next/ia/libretto`, `/next/cisterna` e altri link rapidi definiti in `NextCentroControlloPage`.

Dipende da:
- `readNextCentroControlloSnapshot` in `src/next/domain/nextCentroControlloDomain.ts`;
- `@alerts_state`, `@mezzi_aziendali`, `@autisti_sessione_attive`, `@storico_eventi_operativi`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`;
- configurazione quick links locale in `src/next/NextCentroControlloPage.tsx`.

Genera:
- alert visuali;
- drill-down modali;
- esportazione PDF alert;
- launcher verso altri moduli.

Frequenza uso: alta

Urgenza: alta

Deve stare in home? si

Se no, da dove ci si arriva meglio? non applicabile

Note prove/codice:
- `src/App.tsx`
- `src/next/NextHomePage.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/domain/nextCentroControlloDomain.ts`

### MODULO: Gestione Operativa
Serve a: hub operativo globale per magazzino, consegne, manutenzioni e attrezzature.

Lo usa: ufficio operativo, coordinamento lavori, gestione materiali.

Ci si entra da:
- route `/next/gestione-operativa` in `src/App.tsx`;
- link rapido Home e Navigazione rapida;
- redirect legacy `/next/operativita-globale`.

Da li si va a:
- `/next/inventario`
- `/next/materiali-consegnati`
- `/next/manutenzioni`
- `/next/centro-controllo`
- `/next/attrezzature-cantieri`

Dipende da:
- `useNextOperativitaSnapshot`
- `readNextOperativitaGlobaleSnapshot`
- snapshot operativita, inventario, consegne e manutenzioni.

Genera:
- vista di coordinamento;
- accesso ai sotto-moduli operativi;
- riepiloghi criticita materiali e manutenzioni.

Frequenza uso: alta

Urgenza: media

Deve stare in home? forse

Se no, da dove ci si arriva meglio? da `Navigazione rapida` e dal menu principale come modulo padre dell'area operativa.

Note prove/codice:
- `src/App.tsx`
- `src/next/NextGestioneOperativaPage.tsx`
- `src/next/useNextOperativitaSnapshot.ts`

### MODULO: Dossier Mezzi
Serve a: vista composita per singolo mezzo con anagrafica, lavori, costi, rifornimenti, gomme e libretto.

Lo usa: amministrazione tecnica, capi mezzi, controllo costi, chi approfondisce un mezzo specifico.

Ci si entra da:
- `/next/dossiermezzi`
- `/next/dossiermezzi/:targa`
- `/next/dossier/:targa`
- click da `Mezzi`
- aperture da alert e moduli tecnici tramite `buildNextDossierPath`.

Da li si va a:
- dettaglio lavoro;
- IA Libretto;
- Analisi Economica;
- Dossier Gomme;
- Dossier Rifornimenti.

Dipende da:
- `readNextDossierMezzoCompositeSnapshot`
- dominio dossier composito con flotta, operativita, lavori, movimenti, manutenzioni, rifornimenti e analisi economica.

Genera:
- approfondimento completo del mezzo;
- modali dossier;
- accesso ai sotto-dettagli;
- esportazione/consultazione PDF libretto.

Frequenza uso: media

Urgenza: media

Deve stare in home? no

Se no, da dove ci si arriva meglio? da `Mezzi`, dalla ricerca rapida, dagli alert e dai link contestuali dei moduli tecnici.

Note prove/codice:
- `src/App.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/domain/nextDossierMezzoDomain.ts`

### MODULO: Mezzi
Serve a: lista anagrafica e filtro della flotta con accesso al dossier del singolo mezzo.

Lo usa: amministrazione tecnica, capi mezzi, chi cerca rapidamente una targa.

Ci si entra da:
- `/next/mezzi`
- Navigazione rapida/Home.

Da li si va a:
- dossier mezzo tramite `buildNextDossierPath`.

Dipende da:
- `readNextAnagraficheFlottaSnapshot`.

Genera:
- filtro e ricerca mezzi;
- accesso al dossier.

Frequenza uso: alta

Urgenza: media

Deve stare in home? forse

Se no, da dove ci si arriva meglio? da `Navigazione rapida`, ricerca globale e menu anagrafiche.

Note prove/codice:
- `src/App.tsx`
- `src/next/NextMezziPage.tsx`

### MODULO: Autisti Inbox (admin)
Serve a: inbox amministrativa degli eventi autisti con sessioni attive, cambi mezzo, segnalazioni, controlli, gomme, attrezzature e log accessi.

Lo usa: admin operativo e chi presidia cio che arriva dall'app autisti.

Ci si entra da:
- `/next/autisti-inbox`
- quick links Home/Navigazione rapida;
- richiami da `Stato operativo` e da alert.

Da li si va a:
- pagine segnalazioni, controlli, richiesta attrezzature, gomme, cambio mezzo, log accessi;
- modali dettaglio evento.

Dipende da:
- `loadHomeEvents`
- `loadActiveSessions`
- `@storico_eventi_operativi`
- sessioni attive e storage autisti.

Genera:
- presa in carico eventi autisti;
- drill-down giornaliero;
- modali e passaggio verso aree di rettifica.

Frequenza uso: alta

Urgenza: alta

Deve stare in home? forse

Se no, da dove ci si arriva meglio? da `Alert`, `Stato operativo` e `Navigazione rapida` come modulo padre degli eventi autisti.

Note prove/codice:
- `src/App.tsx`
- `src/next/NextAutistiInboxHomePage.tsx`
- `src/next/autistiInbox/NextAutistiInboxHomeNative.tsx`

### MODULO: Autisti Admin / Centro rettifica dati
Serve a: rettifica e amministrazione completa dei dati generati dagli autisti.

Lo usa: admin con ruolo di correzione e verifica.

Ci si entra da:
- `/next/autisti-admin`
- link rapido Home/Navigazione rapida;
- passaggi da Inbox.

Da li si va a:
- dettaglio lavori;
- rientro a `/next/centro-controllo`;
- rientro a `/next/autisti-inbox`.

Dipende da:
- `loadHomeEvents`
- `@autisti_sessione_attive`
- `@mezzi_aziendali`
- `@colleghi`
- `@controlli_mezzo_autisti`
- `@rifornimenti_autisti_tmp`
- `@rifornimenti`
- `@segnalazioni_autisti_tmp`
- `@richieste_attrezzature_autisti_tmp`
- `@storico_eventi_operativi`
- `@cambi_gomme_autisti_tmp`
- `@gomme_eventi`.

Genera:
- correzioni amministrative;
- PDF controllo/segnalazione;
- riconciliazioni dati.

Frequenza uso: media

Urgenza: media

Deve stare in home? no

Se no, da dove ci si arriva meglio? da `Autisti Inbox (admin)` o dalla ricerca/menu, non come accesso primario Home.

Note prove/codice:
- `src/App.tsx`
- `src/next/NextAutistiAdminPage.tsx`
- `src/next/autistiInbox/NextAutistiAdminNative.tsx`

### MODULO: App Autisti
Serve a: esperienza separata lato autista per rifornimenti, segnalazioni, controlli, richieste attrezzature e cambio mezzo.

Lo usa: autisti.

Ci si entra da:
- `/next/autisti/*`
- gate, login e home autista.

Da li si va a:
- rifornimento;
- segnalazioni;
- richiesta attrezzature;
- setup mezzo;
- cambio mezzo.

Dipende da:
- sessione autista;
- storage autisti;
- boundary legacy-storage per letture isolate.

Genera:
- eventi operativi;
- richieste;
- segnalazioni;
- rifornimenti;
- cambi mezzo.

Frequenza uso: alta per autisti, bassa per admin Home

Urgenza: media

Deve stare in home? no

Se no, da dove ci si arriva meglio? dal menu dedicato o da `Navigazione rapida`, non come blocco Home di primo livello per profili admin.

Note prove/codice:
- `src/App.tsx`
- `src/next/NextAutistiHomePage.tsx`
- `src/next/autisti/NextHomeAutistaNative.tsx`

### MODULO: IA interna
Serve a: workspace IA dedicato con chat, richieste, artifacts, audit e output operativi.

Lo usa: utenti interni che devono chiedere sintesi, generare output o lavorare con allegati e artifacts.

Ci si entra da:
- `/next/ia/interna`
- `/next/ia/interna/sessioni`
- `/next/ia/interna/richieste`
- `/next/ia/interna/artifacts`
- `/next/ia/interna/audit`
- launcher Home.

Da li si va a:
- conversazioni;
- artifacts;
- report preview;
- output PDF;
- audit interno IA.

Dipende da:
- sottosistema IA interna sotto `src/next/internal-ai/*`;
- orchestratore chat;
- repository mock/artifacts;
- bridge allegati;
- report preview/share.

Genera:
- richieste IA;
- output testuali e PDF;
- artifacts;
- audit trail IA.

Frequenza uso: media

Urgenza: media

Deve stare in home? si

Se no, da dove ci si arriva meglio? non applicabile; il launcher Home ha senso, ma la console completa deve restare nella route dedicata.

Note prove/codice:
- `src/App.tsx`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`

### MODULO: IA hub
Serve a: menu principale delle superfici IA non interne.

Lo usa: utenti che devono scegliere fra IA Libretto, IA Documenti, copertura libretti, export e strumenti affini.

Ci si entra da:
- `/next/ia`
- quick links Home/Navigazione rapida.

Da li si va a:
- `/next/ia/libretto`
- `/next/ia/documenti`
- `/next/ia/copertura-libretti`
- `/next/libretti-export`
- `/next/cisterna/ia`
- `/next/ia/apikey`.

Dipende da:
- configurazione IA;
- pagine figlie IA.

Genera:
- solo instradamento verso sottostrumenti.

Frequenza uso: media

Urgenza: bassa

Deve stare in home? no

Se no, da dove ci si arriva meglio? da `Navigazione rapida`, dal menu principale o dalla ricerca.

Note prove/codice:
- `src/App.tsx`
- `src/next/NextIntelligenzaArtificialePage.tsx`

### MODULO: IA Libretto
Serve a: consultazione archivio libretti e avvio analisi/upload legati ai libretti.

Lo usa: utenti tecnici o amministrativi che lavorano sui documenti dei mezzi.

Ci si entra da:
- `/next/ia/libretto`
- IA hub;
- pulsante dal dossier mezzo.

Da li si va a:
- `/next/ia/apikey`
- `/next/ia`
- archivio libretto filtrato.

Dipende da:
- `readNextIaConfigSnapshot`
- `readNextIaLibrettoArchiveSnapshot`.

Genera:
- consultazione archivio libretti;
- richieste di analisi/upload in clone read-only.

Frequenza uso: bassa

Urgenza: bassa

Deve stare in home? no

Se no, da dove ci si arriva meglio? da IA hub, dal dossier mezzo o dalla ricerca.

Note prove/codice:
- `src/App.tsx`
- `src/next/NextIALibrettoPage.tsx`

### MODULO: Acquisti / Procurement
Serve a: workspace centrale ordini, arrivi, preventivi e listino prezzi.

Lo usa: ufficio acquisti, magazzino, coordinamento materiali.

Ci si entra da:
- `/next/acquisti`
- link rapidi Home/Navigazione;
- percorsi secondari da pagine materiali/ordini.

Da li si va a:
- ordini in attesa;
- ordini arrivati;
- dettaglio ordine;
- tab interne acquisti.

Dipende da:
- `readNextProcurementSnapshot`
- dataset `@ordini`, `@preventivi`, `@preventivi_approvazioni`, `@listino_prezzi`.

Genera:
- ordini;
- arrivi;
- preventivi;
- passaggio ad altri moduli procurement.

Frequenza uso: media

Urgenza: media

Deve stare in home? forse

Se no, da dove ci si arriva meglio? da `Gestione Operativa`, `Navigazione rapida` o menu operativo.

Note prove/codice:
- `src/App.tsx`
- `src/next/NextAcquistiPage.tsx`
- `src/next/NextProcurementStandalonePage.tsx`
- `src/next/domain/nextProcurementDomain.ts`

### MODULO: Materiali da ordinare
Serve a: vista focalizzata su fabbisogni, ordini, arrivi e prezzi lato fornitori/materiali.

Lo usa: acquisti e magazzino.

Ci si entra da:
- `/next/materiali-da-ordinare`
- quick links Home/Navigazione.

Da li si va a:
- `/next/ordini-in-attesa`
- `/next/ordini-arrivati`.

Dipende da:
- `readNextFornitoriSnapshot`;
- anagrafiche fornitori e dataset collegati.

Genera:
- vista focalizzata procurement;
- accesso a ordini e arrivi.

Frequenza uso: media

Urgenza: media

Deve stare in home? no

Se no, da dove ci si arriva meglio? da `Acquisti / Procurement` come modulo padre.

Note prove/codice:
- `src/App.tsx`
- `src/next/NextMaterialiDaOrdinarePage.tsx`

### MODULO: Manutenzioni
Serve a: workspace manutentivo con storico, suggerimenti materiali e collegamenti al dossier mezzo.

Lo usa: manutenzione, operativita tecnica, capi mezzi.

Ci si entra da:
- `/next/manutenzioni`
- Gestione Operativa;
- quick links Home/Navigazione.

Da li si va a:
- dossier mezzo;
- modale gomme.

Dipende da:
- `readNextManutenzioniWorkspaceSnapshot`
- `readNextInventarioSnapshot`.

Genera:
- pianificazione/manutenzioni;
- suggerimenti materiali;
- passaggio al dossier.

Frequenza uso: media

Urgenza: alta

Deve stare in home? forse

Se no, da dove ci si arriva meglio? da `Gestione Operativa`, alert manutentivi futuri o ricerca per targa.

Note prove/codice:
- `src/App.tsx`
- `src/next/NextManutenzioniPage.tsx`

### MODULO: Cisterna
Serve a: gestione archivio, report e targhe della cisterna Caravate.

Lo usa: utenti specialisti del dominio cisterna/carburante.

Ci si entra da:
- `/next/cisterna`
- quick link Home/Navigazione;
- IA hub per la parte cisterna IA.

Da li si va a:
- home;
- IA Cisterna;
- scheda carburante test.

Dipende da:
- `readNextCisternaSnapshot`
- dominio cisterna con documenti, schede, parametri e rifornimenti autisti tmp.

Genera:
- archivio/report/targhe cisterna;
- output specialistici di dominio.

Frequenza uso: rara ma critica

Urgenza: media

Deve stare in home? no

Se no, da dove ci si arriva meglio? da `Navigazione rapida`, menu specialistico o ricerca.

Note prove/codice:
- `src/App.tsx`
- `src/next/NextCisternaPage.tsx`
- `src/next/domain/nextCisternaDomain.ts`

## 5. Accessi Home attuali o storici: perché sono in Home e cosa succede se li togli

### Accesso: Alert
- Perche e in Home? Perche e il punto di ripresa piu urgente e concentra revisioni, segnalazioni, eventi autisti e conflitti sessione.
- Si puo raggiungere gia da un altro punto? Si, ma in modo disperso: inbox, admin, dossier e moduli tecnici.
- Serve come accesso principale o e solo una scorciatoia? Accesso principale.
- Cosa succede se lo togli dalla Home? Si perde il cockpit di priorita; aumento di rumore operativo e tempi di presa in carico.

### Accesso: Stato operativo
- Perche e in Home? Perche sintetizza sessioni attive e collocazione mezzi/rimorchi.
- Si puo raggiungere gia da un altro punto? Si, tramite Autisti Inbox/Admin e moduli anagrafici.
- Serve come accesso principale o e solo una scorciatoia? Scorciatoia ad alta utilita.
- Cosa succede se lo togli dalla Home? Nessuna perdita di funzionalita, ma peggiora la lettura immediata dello stato giornaliero.

### Accesso: IA interna
- Perche e in Home? Perche funziona come ingresso trasversale a richieste, sintesi e ripresa lavoro.
- Si puo raggiungere gia da un altro punto? Si, dalla route dedicata `/next/ia/interna*`.
- Serve come accesso principale o e solo una scorciatoia? Accesso principale in forma di launcher, non di console completa.
- Cosa succede se lo togli dalla Home? La funzione resta raggiungibile, ma perde il ruolo di assistente operativo trasversale.

### Accesso: Navigazione rapida
- Perche e in Home? Perche raccoglie ingressi frequenti e preferiti.
- Si puo raggiungere gia da un altro punto? Parzialmente si, da menu e route dirette.
- Serve come accesso principale o e solo una scorciatoia? Scorciatoia organizzata.
- Cosa succede se lo togli dalla Home? La navigazione resta possibile, ma diventa piu lenta per chi usa scorciatoie ripetute.

### Accesso: Gestione Operativa
- Perche e in Home? Perche e il parent naturale di molta operativita.
- Si puo raggiungere gia da un altro punto? Si, da menu e Navigazione rapida.
- Serve come accesso principale o e solo una scorciatoia? Scorciatoia/punto di parent.
- Cosa succede se lo togli dalla Home? Impatto basso se resta forte in Navigazione rapida e menu.

### Accesso: Autisti Inbox (admin)
- Perche e in Home? Perche aggrega eventi reali prodotti dagli autisti.
- Si puo raggiungere gia da un altro punto? Si, da menu e da alert/stato operativo.
- Serve come accesso principale o e solo una scorciatoia? Modulo padre di dominio; in Home e soprattutto scorciatoia.
- Cosa succede se lo togli dalla Home? Impatto basso se alert e stato operativo continuano a rimandare correttamente alla Inbox.

### Accesso: Centro rettifica dati (admin)
- Perche e in Home? Storicamente come scorciatoia operativa verso le correzioni.
- Si puo raggiungere gia da un altro punto? Si, da Inbox admin e menu.
- Serve come accesso principale o e solo una scorciatoia? Solo scorciatoia.
- Cosa succede se lo togli dalla Home? Quasi nessuna perdita; si riduce rumore e si mantiene il flusso naturale Inbox -> Rettifica.

### Accesso: Mezzi / Dossier Mezzi
- Perche e in Home? Per accesso rapido a ricerca targa e dossier.
- Si puo raggiungere gia da un altro punto? Si, da menu, Navigazione rapida e ricerca.
- Serve come accesso principale o e solo una scorciatoia? Scorciatoia.
- Cosa succede se lo togli dalla Home? Nessuna perdita funzionale se la ricerca resta forte.

### Accesso: IA / IA Libretto
- Perche e in Home? Come scorciatoia verso strumenti specialistici.
- Si puo raggiungere gia da un altro punto? Si, dall'hub IA, dal dossier e dalla ricerca.
- Serve come accesso principale o e solo una scorciatoia? Solo scorciatoia.
- Cosa succede se lo togli dalla Home? Nessuna perdita strutturale; riduce rumore per strumenti specialistici.

## 6. Mappa duplicazioni Home
### Doppioni forti
- `Home /next` e `/next/centro-controllo`: due ingressi cockpit vicini come concetto, con rischio di confusione fra Home e Centro di Controllo.
- `Alert` e `Autisti Inbox (admin)`: stessa famiglia di eventi; Home deve restare sintesi, Inbox deve restare workspace completo.
- `Stato operativo` e `Autisti Inbox/Admin`: stesso perimetro sessioni/mezzi, ma con livelli di dettaglio diversi.
- `IA interna` e `IA hub`: due ingressi IA distinti; la Home deve privilegiare solo il launcher trasversale.

### Doppioni medi
- `Mezzi` e `Dossier Mezzi`: parent e child esposti entrambi come scorciatoie.
- `Acquisti`, `Materiali da ordinare`, `Ordini in attesa`, `Ordini arrivati`, `Materiali consegnati`, `Inventario`: molte entrate sullo stesso ecosistema procurement/magazzino.
- `Gestione Operativa` e alcuni suoi figli diretti: parent e child esposti nello stesso livello di shortcut.

### Doppioni bassi ma rumorosi
- `IA Libretto`, `IA Documenti`, `Libretti Export`, `Cisterna IA`: utili, ma specialistici e gia raggiungibili da IA hub o moduli padri.
- `App Autisti (telefono)` in Home admin: ingresso reale, ma secondario rispetto al dominio Inbox/Admin.

## 7. Proposta di classificazione Home
### Cose urgenti
- Alert
- Stato operativo
- ripresa rapida verso Autisti Inbox (admin) tramite alert/stato
- launcher IA interna come supporto trasversale

### Cose frequenti
- Navigazione rapida minimale
- Gestione Operativa
- Mezzi
- Dossier Mezzi tramite ricerca

### Cose da riprendere
- Manutenzioni
- Acquisti / Procurement
- Materiali da ordinare
- Autisti Inbox (admin)

### Cose che non devono stare in Home
- Centro rettifica dati (admin) come scorciatoia primaria
- IA Libretto
- IA Documenti
- Cisterna
- child routes procurement (`ordini in attesa`, `ordini arrivati`, `materiali consegnati`) esposte direttamente in Home
- doppio accesso `Mezzi` + `Dossier Mezzi` nello stesso livello Home
- App Autisti come shortcut prominente Home admin

## 8. Proposta finale di principio
### Cosa lasciare in Home
- `Alert`
- `Stato operativo`
- launcher `IA interna`
- `Navigazione rapida` minimale con ricerca + preferiti

### Cosa spostare in Navigazione rapida
- `Gestione Operativa`
- `Autisti Inbox (admin)`
- `Mezzi`
- `Dossier Mezzi`
- `Acquisti / Procurement`
- `Manutenzioni`
- `Cisterna`
- `IA` hub

### Cosa lasciare solo in menu o modulo padre
- `Centro rettifica dati (admin)` come figlio naturale della gestione eventi autisti
- `Materiali da ordinare`, `Ordini in attesa`, `Ordini arrivati`, `Materiali consegnati`, `Inventario` sotto parent procurement/operativita
- `IA Libretto`, `IA Documenti`, `Libretti Export`, `Cisterna IA` sotto parent IA
- `App Autisti` nel suo dominio separato

### Cosa delegare alla ricerca
- accesso per targa a `Mezzi` e `Dossier Mezzi`
- strumenti specialistici usati saltuariamente
- moduli verticali non urgenti

## 9. Conclusione netta e sintetica
Il codice reale del repo mostra che la Home deve restare un cockpit di urgenza e ripresa lavoro, non un menu esteso.

Le funzioni che meritano davvero la Home sono quelle che:
- condensano priorita;
- leggono stato operativo trasversale;
- permettono una ripresa rapida del lavoro.

Le scorciatoie che aprono moduli gia parentati altrove generano doppioni e rumore.

Principio finale raccomandato:
- Home = `Alert` + `Stato operativo` + launcher `IA interna` + `Navigazione rapida` minimale;
- i moduli completi restano in `Navigazione rapida`, menu o modulo padre;
- la ricerca assorbe gli accessi specialistici e per targa;
- `Centro rettifica dati (admin)` non deve essere un ingresso Home di primo livello;
- `IA interna` ha senso in Home solo come launcher, non come hub pesante.
