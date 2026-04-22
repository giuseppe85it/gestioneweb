# FLUSSI OPERATIVI CRITICI

## Scopo del documento
Questo documento raccoglie i flussi operativi piu importanti e piu delicati del gestionale.

Serve a capire:
- quali passaggi hanno impatto reale sul lavoro quotidiano;
- quali flussi toccano dati condivisi o convergenze verso il Dossier;
- quali flussi non vanno toccati senza analisi aggiuntiva.

## Criteri di criticita
Un flusso e considerato critico quando vale almeno una di queste condizioni:
- tocca dataset condivisi tra piu moduli;
- ha writer multipli;
- porta dati nel Dossier Mezzo;
- coinvolge area autisti e area admin;
- usa Storage, IA o PDF;
- puo rompere operativita o coerenza dati se modificato male.

## Ruolo futuro della IA sui flussi critici
Nella NEXT questi flussi potranno essere letti anche dalla macro-area `IA Gestionale / Assistente Gestionale` per:
- segnalare anomalie e scadenze;
- suggerire azioni operative o controlli;
- costruire report assistiti e PDF intelligenti;
- confrontare dati, moduli e documenti per aiutare a capire dove nasce il problema.

Limite di governance:
- questa e una decisione architetturale/documentale;
- non autorizza patch autonome, nuove scritture o automazioni rischiose sulla legacy.

## Flussi critici principali

### 1. Creazione e gestione lavori da area admin
- **Punto di partenza**: `LavoriDaEseguire`, `DettaglioLavoro`, area lavori legacy.
- **Moduli toccati**: `LavoriDaEseguire`, `LavoriInAttesa`, `LavoriEseguiti`, `DettaglioLavoro`, `DossierMezzo`, `Mezzo360`.
- **Dati usati**: `@lavori`.
- **Arrivo finale**: backlog operativo, viste lavori, Dossier per targa.
- **Dossier**: si.
- **IA/PDF/scadenze**: PDF presenti a livello cross-modulo; scadenze/priorita indirette in Home/Centro [CONFERMATO a livello sistema].
- **Rischi o ambiguita**: origini multiple del lavoro; route legacy duplicate.

### 2. Evento autista trasformato in lavoro o manutenzione
- **Punto di partenza**: `AutistiAdmin`, `AutistiEventoModal`, eventi da controlli/segnalazioni.
- **Moduli toccati**: `AutistiAdmin`, `AutistiEventoModal`, area lavori, `Manutenzioni`, Dossier.
- **Dati usati**: `@controlli_mezzo_autisti`, `@segnalazioni_autisti_tmp`, `@lavori`, `@manutenzioni`.
- **Arrivo finale**: record operativo preso in carico lato admin e visibile per mezzo.
- **Dossier**: si.
- **IA/PDF/scadenze**: PDF evento autisti in area admin; scadenze dipendono dalla presa in carico [DA VERIFICARE].
- **Rischi o ambiguita**: manca audit log centralizzato; regole canoniche di conversione non unificate.

### 3. Rifornimento autista -> feed tmp -> feed canonico -> Dossier / Analisi
- **Punto di partenza**: `Rifornimento`.
- **Moduli toccati**: `Rifornimento`, `AutistiAdmin`, `Home`, `CentroControllo`, `DossierRifornimenti`, `DossierMezzo`, `AnalisiEconomica`.
- **Dati usati**: `@rifornimenti_autisti_tmp`, `@rifornimenti`.
- **Arrivo finale**: storico rifornimenti, vista dossier, sezioni economiche, report rifornimenti.
- **Dossier**: si.
- **IA/PDF/scadenze**: PDF report rifornimenti in Centro di Controllo; IA non centrale.
- **Rischi o ambiguita**: convivenza tmp/canonico e shape non uniforme di `@rifornimenti`.

### 4. Segnalazione autista -> inbox/admin -> presa in carico operativa
- **Punto di partenza**: `Segnalazioni`.
- **Moduli toccati**: app autisti, `AutistiInboxHome`, `AutistiSegnalazioniAll`, `AutistiAdmin`, `Home`, `CentroControllo`, viste 360.
- **Dati usati**: `@segnalazioni_autisti_tmp`, Storage `autisti/segnalazioni/...`.
- **Arrivo finale**: visibilita in inbox/admin, eventuale conversione in azione operativa.
- **Dossier**: si, se la segnalazione e agganciata a una targa.
- **IA/PDF/scadenze**: PDF segnalazione in area admin; IA non dimostrata come passaggio diretto.
- **Rischi o ambiguita**: stato/letta/rettifica distribuiti; audit centralizzato non dimostrato.

### 5. Controllo mezzo autista -> inbox/admin -> manutenzione o follow-up
- **Punto di partenza**: `ControlloMezzo`.
- **Moduli toccati**: app autisti, `AutistiControlliAll`, `AutistiAdmin`, `AutistiEventoModal`, `Manutenzioni`, Dossier.
- **Dati usati**: `@controlli_mezzo_autisti`, `@manutenzioni`, `@lavori`.
- **Arrivo finale**: checklist archiviate e possibili azioni tecniche sul mezzo.
- **Dossier**: si.
- **IA/PDF/scadenze**: PDF controllo mezzo in area admin; scadenze/manutenzioni collegate in modo parziale.
- **Rischi o ambiguita**: trasformazione KO -> azione operativa non centralizzata in un solo workflow.

### 6. Login / setup / cambio mezzo autista -> sessione live + storico eventi
- **Punto di partenza**: `LoginAutista`, `AutistiGate`, `SetupMezzo`, `CambioMezzoAutista`, `HomeAutista`.
- **Moduli toccati**: area autisti, `AutistiAdmin`, `AutistiInboxHome`, `AutistiLogAccessiAll`, `Home`, viste 360.
- **Dati usati**: `@autisti_sessione_attive`, `@storico_eventi_operativi`.
- **Arrivo finale**: monitoraggio sessioni e storico operativo autisti.
- **Dossier**: si, in modo indiretto quando l'evento e legato alla targa.
- **IA/PDF/scadenze**: PDF non centrale; alert/eventi si.
- **Rischi o ambiguita**: stream autisti alternativo `autisti_eventi` ancora aperto.

### 7. Fabbisogno materiali -> ordine -> arrivo -> aggiornamento inventario
- **Punto di partenza**: `MaterialiDaOrdinare`, `Acquisti`.
- **Moduli toccati**: `MaterialiDaOrdinare`, `Acquisti`, `DettaglioOrdine`, `OrdiniInAttesa`, `OrdiniArrivati`, `Inventario`.
- **Dati usati**: `@ordini`, `@inventario`, `@listino_prezzi`, `@fornitori`.
- **Arrivo finale**: ordine archiviato e stock aggiornato.
- **Dossier**: no come flusso principale; solo derivato se il materiale e poi collegato a una targa.
- **IA/PDF/scadenze**: PDF riepilogo ordine; IA su preventivi/documenti collegati.
- **Rischi o ambiguita**: `@inventario` aggiornato da piu moduli; alto rischio incoerenza se si tocca il flusso senza governare writer e precedenze.

### 8. Inventario -> materiali consegnati -> mezzo / operativita
- **Punto di partenza**: `Inventario`, `MaterialiConsegnati`, `Manutenzioni`.
- **Moduli toccati**: `Inventario`, `MaterialiConsegnati`, `GestioneOperativa`, `Manutenzioni`, Dossier.
- **Dati usati**: `@inventario`, `@materialiconsegnati`.
- **Arrivo finale**: storico consegne e consumo materiali.
- **Dossier**: si, quando la consegna e legata a una targa.
- **IA/PDF/scadenze**: PDF inventario e materiali consegnati; IA solo indiretta.
- **Rischi o ambiguita**: collegamento inventario/consegna non transazionale; rischio stock incoerente.

### 9. Documento IA di magazzino -> archivio documentale -> import in inventario
- **Punto di partenza**: `IADocumenti` con categoria `MAGAZZINO`.
- **Moduli toccati**: `IADocumenti`, `Inventario`, Dossier/Analisi per lettura successiva.
- **Dati usati**: Storage `documenti_pdf/...`, `@documenti_magazzino`, `@inventario`.
- **Arrivo finale**: documento archiviato e materiali importati nello stock.
- **Dossier**: parziale, se il documento o i materiali sono poi mezzo-correlati.
- **IA/PDF/scadenze**: IA centrale; PDF come file sorgente.
- **Rischi o ambiguita**: import inventario da IA aggiunge un altro writer allo stesso dominio stock.

### 10. Documento IA mezzo/fattura -> archivio -> Dossier / Analisi / Capo costi
- **Punto di partenza**: `IADocumenti`, `IALibretto`, `IACoperturaLibretti`.
- **Moduli toccati**: area IA, `DossierMezzo`, `AnalisiEconomica`, `CapoCostiMezzo`, `LibrettiExport`.
- **Dati usati**: `@documenti_mezzi`, Storage `documenti_pdf/...`, Storage `mezzi_aziendali/...`.
- **Arrivo finale**: documentazione mezzo letta in Dossier e aree economiche.
- **Dossier**: si.
- **IA/PDF/scadenze**: IA centrale; PDF/file originali centrali.
- **Rischi o ambiguita**: governance endpoint IA e reale canale libretto ancora da chiarire.

### 11. Preventivo manuale o IA -> Storage + archivio preventivi -> Acquisti / costi
- **Punto di partenza**: `Acquisti`.
- **Moduli toccati**: `Acquisti`, `DettaglioOrdine`, `CapoCostiMezzo` in lettura indiretta.
- **Dati usati**: `@preventivi`, Storage `preventivi/ia/...`, Storage `preventivi/<id>.pdf`.
- **Arrivo finale**: preventivo disponibile in Acquisti con allegati.
- **Dossier**: indiretto, tramite costi/documenti e modulo capo [DA VERIFICARE come convergenza canonica].
- **IA/PDF/scadenze**: IA forte con `estraiPreventivoIA`; PDF e allegati centrali.
- **Rischi o ambiguita**: contratto allegati preventivi e path Storage multipli sono un punto aperto alto.

### 12. Generazione PDF cross-modulo
- **Punto di partenza**: Home, CentroControllo, Dossier, Acquisti, Inventario, MaterialiConsegnati, AutistiAdmin, Libretti.
- **Moduli toccati**: molti moduli admin e parte autisti-admin.
- **Dati usati**: dataset modulo-specifici + `pdfEngine` / `pdfPreview`; area cisterna usa anche `jsPDF`.
- **Arrivo finale**: anteprima, export, condivisione file.
- **Dossier**: si, in modo diretto per il dossier mezzo.
- **IA/PDF/scadenze**: PDF e il cuore del flusso.
- **Rischi o ambiguita**: comportamento PDF non ancora completamente uniformato; esiste almeno un canale specialistico fuori `pdfEngine`.

### 13. Alert / scadenze / priorita -> Home / Centro -> navigazione record
- **Punto di partenza**: dataset mezzi, eventi autisti, dati mancanti e reminder persistiti.
- **Moduli toccati**: `Home`, `CentroControllo`, `homeEvents`, viste di dettaglio.
- **Dati usati**: `@alerts_state`, `@storico_eventi_operativi`, feed autisti tmp, dati mezzi.
- **Arrivo finale**: lista priorita, alert attivi, export PDF alert e navigazione al record.
- **Dossier**: si, quando l'alert e mezzo-centrico.
- **IA/PDF/scadenze**: scadenze e alert centrali; PDF export presente.
- **Rischi o ambiguita**: modello completo delle scadenze non ancora formalizzato come capability unica cross-modulo.

## Sintesi finale
I flussi piu sensibili oggi sono:
- autisti -> eventi -> inbox/admin -> dataset canonici;
- rifornimenti tmp/canonico;
- ordini/arrivi/inventario/consegne;
- documenti IA e preventivi;
- PDF cross-modulo;
- alert e priorita che guidano la lettura operativa.

Prima di ogni modifica su questi punti bisogna verificare:
1. dataset coinvolti;
2. writer e reader reali;
3. convergenza verso Dossier o modulo globale;
4. eventuale passaggio su IA, PDF, Storage o permessi;
5. presenza di incoerenze gia note nel registro punti aperti.
