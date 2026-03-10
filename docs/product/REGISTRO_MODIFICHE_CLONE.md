# REGISTRO MODIFICHE CLONE

## 1. Scopo
Questo file e il registro ufficiale, permanente e centrale di tutte le modifiche fatte al clone `read-only` della madre in `src/next/*`.

Serve a:
- mantenere una traccia unica e leggibile delle patch clone;
- evitare dipendenza dalla memoria della chat;
- chiarire cosa e stato cambiato nel clone, con quale impatto e come verificarlo;
- distinguere le modifiche clone-specifiche da quelle eventualmente candidabili alla madre.

## 2. Regola operativa ufficiale
- Ogni patch futura che modifica il clone deve aggiungere una nuova voce in questo registro.
- Per "modifica del clone" si intende almeno una di queste condizioni:
  - modifica a `src/next/*`;
  - modifica documentale che cambia stato, regole, perimetro o tracciabilita del clone;
  - introduzione o rimozione di blocchi `read-only`, guard-rail, badge o route del clone.
- Nessuna patch sul clone e considerata completa se non aggiorna anche questo registro.
- Le nuove voci vanno aggiunte in testa alla sezione storica, dalla piu recente alla meno recente.

## 3. Template obbligatorio di ogni nuova voce
- DATA:
- TITOLO MODIFICA:
- OBIETTIVO:
- FILE TOCCATI:
- COSA E STATO CAMBIATO:
- IMPATTO SU UI / LETTURA / BLOCCO SCRITTURE:
- COME VERIFICARE:
- SE E CANDIDABILE A ESSERE PORTATO NELLA MADRE IN FUTURO: SI / NO / DA VALUTARE
- NOTE:

## 4. Registro storico

### Voce 2026-03-10 12
- DATA: 2026-03-10
- TITOLO MODIFICA: Normalizzazione lettura Centro di Controllo ed eventi nel clone
- OBIETTIVO: Spostare la lettura clone di alert, focus operativi, sessioni, segnalazioni e storico eventi dentro un layer read-only unico, senza cambiare la UX del Centro di Controllo.
- FILE TOCCATI:
  - `src/next/domain/nextCentroControlloDomain.ts`
  - `src/next/domain/nextStatoOperativoDomain.ts`
  - `src/next/NextCentroControlloPage.tsx`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
- COSA E STATO CAMBIATO:
  - Creato il layer clone `src/next/domain/nextCentroControlloDomain.ts` come reader unico read-only per `@alerts_state`, `@mezzi_aziendali`, `@autisti_sessione_attive`, `@storico_eventi_operativi`, `@segnalazioni_autisti_tmp` e `@controlli_mezzo_autisti`.
  - Normalizzati nel layer alert, focus operativi, sessioni attive, revisioni, mezzi incompleti, eventi importanti autisti e ultimi eventi di posizione, confinando aggregazioni e fallback nel dominio.
  - Convertito `src/next/domain/nextStatoOperativoDomain.ts` in alias di compatibilita verso il nuovo layer per evitare doppie logiche nel clone.
  - Collegato `NextCentroControlloPage` al nuovo snapshot dominio, rimuovendo dalla pagina le letture multiple sparse e parte del rumore locale superato.
- IMPATTO SU UI / LETTURA / BLOCCO SCRITTURE:
  - UI: invariata; il Centro di Controllo clone mantiene blocchi, ordine e orientamento della madre.
  - Lettura: piu stabile e tracciabile, con aggregazioni legacy spostate fuori dalla pagina e centralizzate nel layer read-only.
  - Blocco scritture: invariato; nessun writer, upload o side effect nuovo.
- COME VERIFICARE:
  - Aprire `/next/centro-controllo` e verificare alert, focus, sessioni attive, revisioni e mezzi incompleti.
  - Verificare che gli eventi importanti autisti e i richiami ai dossier restino visibili come prima.
  - Eseguire `npm run build`.
- SE E CANDIDABILE A ESSERE PORTATO NELLA MADRE IN FUTURO: DA VALUTARE
- NOTE:
  - Il layer resta prudente: `@alerts_state` viene usato solo come metadata read-only del clone e le ambiguita residue restano esposte come limiti del dominio.

### Voce 2026-03-10 11
- DATA: 2026-03-10
- TITOLO MODIFICA: Normalizzazione lettura manutenzioni e gomme nel clone
- OBIETTIVO: Portare storico manutenzioni, pianificazione mezzo e derivazione eventi gomme del clone dentro un layer read-only unico, senza cambiare la UX del Dossier o di Analisi Economica.
- FILE TOCCATI:
  - `src/next/domain/nextManutenzioniDomain.ts`
  - `src/next/domain/nextManutenzioniGommeDomain.ts`
  - `src/next/NextGommeEconomiaSection.tsx`
  - `src/next/NextDossierGommePage.tsx`
  - `src/next/NextDossierMezzoPage.tsx`
  - `src/next/NextAnalisiEconomicaPage.tsx`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
- COSA E STATO CAMBIATO:
  - Creato il layer clone `src/next/domain/nextManutenzioniGommeDomain.ts`, costruito sopra il reader manutenzioni gia esistente e dedicato a storico manutenzioni, pianificazione mezzo e parsing prudente dei blocchi `CAMBIO GOMME`.
  - Esteso `src/next/domain/nextManutenzioniDomain.ts` per esporre anche il fornitore quando gia presente o ricavabile dal record legacy.
  - Sostituito nel clone il riuso del componente madre `GommeEconomiaSection` con `src/next/NextGommeEconomiaSection.tsx`, che mantiene la stessa UI ma legge solo il nuovo layer read-only.
  - Collegato `NextDossierMezzoPage` al nuovo layer per storico manutenzioni e manutenzione programmata del mezzo, lasciando invariata la struttura del Dossier.
- IMPATTO SU UI / LETTURA / BLOCCO SCRITTURE:
  - UI: invariata; Dossier Gomme, blocco manutenzioni del Dossier e blocco gomme in Analisi Economica conservano ordine e resa del clone.
  - Lettura: piu coerente e tracciabile su `@manutenzioni` e `@mezzi_aziendali`, con parsing gomme confinato nel dominio e non piu sparso nelle pagine.
  - Blocco scritture: invariato; nessun writer, upload o side effect nuovo.
- COME VERIFICARE:
  - Aprire `/next/mezzi-dossier/:targa` e verificare che storico manutenzioni e pianificazione mezzo restino visibili come prima.
  - Aprire `/next/mezzi-dossier/:targa?view=gomme` e verificare che statistiche, storico e grafici gomme restino uguali nel clone.
  - Aprire `/next/mezzi-dossier/:targa?view=analisi` e verificare che il blocco gomme usi il nuovo componente NEXT.
  - Eseguire `npm run build`.
- SE E CANDIDABILE A ESSERE PORTATO NELLA MADRE IN FUTURO: DA VALUTARE
- NOTE:
  - Il layer resta prudente: gli eventi autisti `@cambi_gomme_autisti_tmp` e `@gomme_eventi` non entrano in questo reader perche la madre nel Dossier Gomme oggi legge ancora `@manutenzioni`.

### Voce 2026-03-10 10
- DATA: 2026-03-10
- TITOLO MODIFICA: Micro-pulizia rumore residuo dominio documenti e costi nel clone
- OBIETTIVO: Rimuovere in modo mirato il codice locale ormai superato dal layer `nextDocumentiCostiDomain`, senza cambiare UX, lettura o perimetro del clone.
- FILE TOCCATI:
  - `src/next/NextDossierMezzoPage.tsx`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- COSA E STATO CAMBIATO:
  - Rimossi da `NextDossierMezzoPage` i commenti e le tracce residue del vecchio ramo locale di lettura documenti/costi.
  - Eliminata la variabile morta `targaNorm2`, non piu usata dopo il passaggio al layer read-only.
  - Riallineato il nome file PDF del dossier all'helper gia attivo `normalizeTarga`, senza introdurre nuove logiche.
- IMPATTO SU UI / LETTURA / BLOCCO SCRITTURE:
  - UI: invariata.
  - Lettura: invariata nei dati mostrati; resta attivo solo il reader unico del layer documenti/costi.
  - Blocco scritture: invariato.
- COME VERIFICARE:
  - Aprire `/next/mezzi-dossier/:targa` e verificare che preventivi, fatture e costi materiali si carichino come prima.
  - Aprire `/next/mezzi-dossier/:targa?view=analisi` e verificare che `Analisi Economica` resti invariata.
  - Eseguire `npm run build`.
- SE E CANDIDABILE A ESSERE PORTATO NELLA MADRE IN FUTURO: NO
- NOTE:
  - Micro-pulizia tecnica limitata al clone; nessun refactor largo e nessun cambio di dominio.

### Voce 2026-03-10 09
- DATA: 2026-03-10
- TITOLO MODIFICA: Normalizzazione lettura documenti e costi nel clone
- OBIETTIVO: Portare la lettura clone di `@costiMezzo` e delle collezioni documentali IA dentro un layer read-only unico, con merge/dedup prudente e supporto stabile al Dossier e ad Analisi Economica.
- FILE TOCCATI:
  - `src/next/domain/nextDocumentiCostiDomain.ts`
  - `src/next/NextDossierMezzoPage.tsx`
  - `src/next/NextAnalisiEconomicaPage.tsx`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
- COSA E STATO CAMBIATO:
  - Consolidato `src/next/domain/nextDocumentiCostiDomain.ts` come reader unico clone per `@costiMezzo`, `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`.
  - Normalizzate nel layer targa, tipo documento, categoria, data/timestamp, importo, valuta, fornitore, file, sorgente, qualita e flags.
  - Aggiunto nel layer un dedup prudente cross-source solo su chiavi sicure (`id` condiviso o `fileUrl`), lasciando espliciti i limiti dove la convergenza non e dimostrabile.
  - Esposto nel layer anche il supporto read-only delle righe `voci` da `@documenti_magazzino` usato dal Dossier per i costi materiali.
  - Collegati al layer il Dossier clone e `Analisi Economica` clone, lasciando invariata la UX.
- IMPATTO SU UI / LETTURA / BLOCCO SCRITTURE:
  - UI: invariata; stesso ordine blocchi e stessa resa del clone.
  - Lettura: piu coerente tra Dossier e Analisi Economica, con dedup/merge confinati nel dominio e data model tracciabile.
  - Blocco scritture: invariato; il layer e solo read-only e non introduce writer o side effect.
- COME VERIFICARE:
  - Aprire `/next/mezzi-dossier/:targa` e verificare che preventivi, fatture e costo materiali del clone si carichino senza cambiare layout.
  - Aprire `/next/mezzi-dossier/:targa?view=analisi` e verificare che riepiloghi, fornitori e documenti recenti leggano lo stesso layer.
  - Eseguire `npm run build`.
- SE E CANDIDABILE A ESSERE PORTATO NELLA MADRE IN FUTURO: DA VALUTARE
- NOTE:
  - Il layer resta prudente: non legge `@preventivi`, non entra nelle approvazioni e non forza merge deboli tra dominio costi e procurement globale.

### Voce 2026-03-10 08
- DATA: 2026-03-10
- TITOLO MODIFICA: Normalizzazione lettura rifornimenti nel clone
- OBIETTIVO: Spostare la lettura rifornimenti del clone da shape legacy sparse e merge locali a un layer read-only unico, tracciabile e riusabile.
- FILE TOCCATI:
  - `src/next/domain/nextRifornimentiDomain.ts`
  - `src/next/domain/nextDossierMezzoDomain.ts`
  - `src/next/NextRifornimentiEconomiaSection.tsx`
  - `src/next/NextDossierRifornimentiPage.tsx`
  - `src/next/NextDossierMezzoPage.tsx`
  - `src/next/NextAnalisiEconomicaPage.tsx`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
- COSA E STATO CAMBIATO:
  - Creato il layer ufficiale clone `src/next/domain/nextRifornimentiDomain.ts`.
  - Normalizzate nel layer le shape reali di `@rifornimenti` e `@rifornimenti_autisti_tmp`, con merge controllato solo nel dominio.
  - Aggiunti nel modello clone i campi puliti `targa`, `timestamp`, `dataLabel`, `litri`, `km`, `costo`, `valuta`, `tipo`, `autista`, `source`, `quality`, `flags`.
  - Creata una sezione rifornimenti clone che replica la UI della madre ma legge solo dal nuovo layer.
  - Collegati al layer il dettaglio rifornimenti clone, il blocco rifornimenti nel Dossier clone e il blocco rifornimenti dentro `Analisi Economica` clone.
- IMPATTO SU UI / LETTURA / BLOCCO SCRITTURE:
  - UI: invariata nel clone; stessa struttura visiva della madre.
  - Lettura: piu coerente tra Dossier clone, dettaglio rifornimenti clone e Analisi Economica clone.
  - Blocco scritture: invariato; il layer e solo read-only e non apre nuovi writer.
- COME VERIFICARE:
  - Aprire `/next/mezzi-dossier/:targa?view=rifornimenti` e verificare che la sezione si carichi dal clone senza usare il componente madre.
  - Aprire `/next/mezzi-dossier/:targa` e verificare che la tabella rifornimenti del Dossier mostri gli stessi blocchi ma con dati letti dal nuovo layer.
  - Aprire `/next/mezzi-dossier/:targa?view=analisi` e verificare che il blocco rifornimenti usi la stessa lettura clone.
  - Eseguire `npm run build`.
- SE E CANDIDABILE A ESSERE PORTATO NELLA MADRE IN FUTURO: DA VALUTARE
- NOTE:
  - Il layer resta transitorio: privilegia `@rifornimenti` come base ma usa ancora `@rifornimenti_autisti_tmp` solo dentro il dominio quando il dato business reale nel repo non e autosufficiente.

### Voce 2026-03-10 00
- DATA: 2026-03-10
- TITOLO MODIFICA: Hardening read-only forte del clone `/next`
- OBIETTIVO: Blindare il clone attuale rispetto a scritture, side effect persistenti e uscite verso superfici legacy della madre potenzialmente scriventi.
- FILE TOCCATI:
  - `src/next/NextShell.tsx`
  - `src/next/next-shell.css`
  - `src/next/NextCentroControlloPage.tsx`
  - `src/next/NextDossierMezzoPage.tsx`
  - `src/next/NextMezziDossierPage.tsx`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
- COSA E STATO CAMBIATO:
  - Bloccato l'accesso diretto dal clone alla madre nella topbar.
  - Disattivati nel clone i link e i pulsanti che uscivano verso route legacy non clonate o potenzialmente scriventi.
  - Resi no-op espliciti i principali handler di scrittura o side effect rimasti nel codice clone di `Centro Controllo`, `Dossier Mezzo` e `Mezzi`.
  - Disabilitate nel clone le azioni che simulavano workflow operativi reali senza poter salvare davvero.
  - Disabilitata anche l'esportazione PDF alert del `Centro Controllo` per evitare side effect locali non necessari nel perimetro blindato.
  - Riallineata la navigazione interna per restare dentro `/next` quando esiste una destinazione clone sicura.
- IMPATTO SU UI / LETTURA / BLOCCO SCRITTURE:
  - UI: il clone mantiene struttura e lettura della madre, ma mostra come non disponibili le azioni non sicure.
  - Lettura: invariata sui dataset reali gia letti dal clone.
  - Blocco scritture: rafforzato su prenotazioni/revisioni, rettifiche rapide, ricerca autista, IA libretto, upload foto, save/delete e preferenze persistenti locali.
- COME VERIFICARE:
  - Aprire `/next/centro-controllo` e verificare che alert actions, prenotazioni/revisioni, rettifiche e link rapidi non portino piu a superfici legacy scriventi.
  - Aprire `/next/mezzi-dossier` e verificare che IA libretto, upload foto e save/delete siano bloccati in modo esplicito.
  - Aprire `/next/mezzi-dossier/:targa` e verificare che `LIBRETTO` resti dentro il clone e che i lavori non aprano piu dettagli legacy.
  - Verificare che dalla topbar `/next` non sia piu possibile aprire la madre.
- SE E CANDIDABILE A ESSERE PORTATO NELLA MADRE IN FUTURO: NO
- NOTE:
  - Hardening clone-specifico: serve a proteggere la madre mantenendo il clone fedele ma isolato.

### Voce 2026-03-10 01
- DATA: 2026-03-10
- TITOLO MODIFICA: Istituzione del registro ufficiale modifiche clone
- OBIETTIVO: Rendere obbligatoria e automatica la tracciabilita di ogni patch futura sul clone `read-only`.
- FILE TOCCATI:
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `AGENTS.md`
  - `docs/change-reports/2026-03-10_1322_docs_registro-modifiche-clone.md`
  - `docs/continuity-reports/2026-03-10_1322_continuity_registro-modifiche-clone.md`
- COSA E STATO CAMBIATO:
  - Creato il registro ufficiale centrale del clone.
  - Definita la struttura obbligatoria di ogni nuova voce.
  - Resa vincolante in `AGENTS.md` la regola che nessuna patch clone e completa senza aggiornare il registro.
  - Agganciato il registro anche al workflow della migrazione NEXT.
  - Creati i report di change e continuity del task documentale.
- IMPATTO SU UI / LETTURA / BLOCCO SCRITTURE:
  - UI: nessun impatto runtime.
  - Lettura: nessun impatto sui dataset.
  - Blocco scritture: nessun impatto runtime, ma aumenta il controllo documentale obbligatorio sulle patch clone.
- COME VERIFICARE:
  - Aprire questo file e verificare presenza di template + voci storiche.
  - Aprire `AGENTS.md` e verificare la nuova regola vincolante sul registro clone.
  - Aprire `docs/product/STATO_MIGRAZIONE_NEXT.md` e verificare il richiamo al registro clone nel workflow.
- SE E CANDIDABILE A ESSERE PORTATO NELLA MADRE IN FUTURO: NO
- NOTE:
  - Questa voce inaugura il registro ufficiale.

### Voce 2026-03-10 02
- DATA: 2026-03-10
- TITOLO MODIFICA: Archiviazione della NEXT precedente
- OBIETTIVO: Sospendere in modo tracciabile la strategia NEXT pre-clone e conservarne il recupero.
- FILE TOCCATI:
  - `src/_archive_next_pre_clone/next-2026-03-10-active/*`
  - `docs/_archive/2026-03-10-next-strategia-pre-clone/STATO_MIGRAZIONE_NEXT.pre-clone-2026-03-10.md`
  - `docs/_archive/2026-03-10-next-strategia-pre-clone/MATRICE_ESECUTIVA_NEXT.pre-clone-2026-03-10.md`
- COSA E STATO CAMBIATO:
  - Archiviata la snapshot della NEXT precedente.
  - Archiviati anche i documenti di stato della strategia sospesa.
- IMPATTO SU UI / LETTURA / BLOCCO SCRITTURE:
  - UI: il ramo sperimentale precedente esce dal percorso attivo.
  - Lettura: nessun cambiamento sui dati reali della madre.
  - Blocco scritture: prepara il passaggio a un clone con scritture interamente neutralizzate.
- COME VERIFICARE:
  - Controllare presenza della cartella `src/_archive_next_pre_clone/next-2026-03-10-active/`.
  - Controllare presenza delle snapshot in `docs/_archive/2026-03-10-next-strategia-pre-clone/`.
- SE E CANDIDABILE A ESSERE PORTATO NELLA MADRE IN FUTURO: NO
- NOTE:
  - Voce ricostruita da repo e documenti del nuovo corso.

### Voce 2026-03-10 03
- DATA: 2026-03-10
- TITOLO MODIFICA: Avvio del clone fedele `read-only` della madre
- OBIETTIVO: Stabilire `src/next/*` come clone 1:1 pratico della madre, senza reinterpretazione e senza toccare la legacy.
- FILE TOCCATI:
  - `src/next/NextShell.tsx`
  - `src/next/NextCentroControlloPage.tsx`
  - `src/next/NextOperativitaGlobalePage.tsx`
  - `src/next/NextMezziDossierPage.tsx`
  - `src/next/NextDossierMezzoPage.tsx`
  - `src/next/next-shell.css`
- COSA E STATO CAMBIATO:
  - Ricostruite nel clone le prime schermate madri prioritarie.
  - Riallineata la UX del clone alla madre come criterio principale del nuovo corso.
- IMPATTO SU UI / LETTURA / BLOCCO SCRITTURE:
  - UI: il clone passa da shell reinterpretata a clone fedele delle schermate madri prioritarie.
  - Lettura: il clone continua a leggere dati reali della madre.
  - Blocco scritture: impostato come vincolo trasversale di base del nuovo corso.
- COME VERIFICARE:
  - Aprire `/next/centro-controllo`, `/next/operativita-globale`, `/next/mezzi-dossier` e `/next/mezzi-dossier/:targa`.
  - Verificare che la navigazione clone resti separata dalla madre ma ne replichi il comportamento pratico.
- SE E CANDIDABILE A ESSERE PORTATO NELLA MADRE IN FUTURO: NO
- NOTE:
  - Voce ricostruita da stato repo e `docs/product/STATO_MIGRAZIONE_NEXT.md`.

### Voce 2026-03-10 04
- DATA: 2026-03-10
- TITOLO MODIFICA: Blocco totale scritture nel clone
- OBIETTIVO: Neutralizzare qualsiasi create/update/delete/upload/import/side effect nei blocchi clone attivi.
- FILE TOCCATI:
  - `src/next/NextCentroControlloPage.tsx`
  - `src/next/NextOperativitaGlobalePage.tsx`
  - `src/next/NextMezziDossierPage.tsx`
  - `src/next/NextDossierMezzoPage.tsx`
  - `src/next/next-shell.css`
- COSA E STATO CAMBIATO:
  - Disabilitate o neutralizzate le azioni di scrittura nei blocchi clone attivi.
  - Mantenute solo le letture e le azioni locali non persistenti utili alla consultazione.
- IMPATTO SU UI / LETTURA / BLOCCO SCRITTURE:
  - UI: pulsanti e azioni scriventi risultano disattivati o bloccati.
  - Lettura: invariata sui dati reali della madre.
  - Blocco scritture: attivo come regola concreta in tutte le aree clone prioritarie.
- COME VERIFICARE:
  - Entrare nelle pagine clone principali e verificare che le azioni scriventi siano assenti o disabilitate.
  - Verificare che la consultazione continui a funzionare senza chiamate di persistenza.
- SE E CANDIDABILE A ESSERE PORTATO NELLA MADRE IN FUTURO: NO
- NOTE:
  - Voce ricostruita da repo recente; il blocco scritture e parte identitaria del clone, non della madre.

### Voce 2026-03-10 05
- DATA: 2026-03-10
- TITOLO MODIFICA: Clonazione di Home, Gestione Operativa, Mezzi e Dossier
- OBIETTIVO: Portare nel clone il primo nucleo madre ad alta priorita con copertura reale e consultabile.
- FILE TOCCATI:
  - `src/next/NextCentroControlloPage.tsx`
  - `src/next/NextOperativitaGlobalePage.tsx`
  - `src/next/NextMezziDossierPage.tsx`
  - `src/next/NextDossierMezzoPage.tsx`
- COSA E STATO CAMBIATO:
  - Clonate le aree madre prioritarie del nuovo corso.
  - Attivato il percorso `Mezzi -> Dossier` come asse centrale del clone.
- IMPATTO SU UI / LETTURA / BLOCCO SCRITTURE:
  - UI: disponibili nel clone i principali ingressi operativi gia richiesti.
  - Lettura: mantenuta sui dataset reali letti dal madre nei blocchi clonati.
  - Blocco scritture: i flussi restano consultativi.
- COME VERIFICARE:
  - Aprire le quattro aree clone prioritarie e confrontarne struttura pratica e ordine dei blocchi con la madre.
  - Verificare che le letture mostrino dati reali e che non siano presenti writer attivi.
- SE E CANDIDABILE A ESSERE PORTATO NELLA MADRE IN FUTURO: NO
- NOTE:
  - Voce ricostruita da repo recente e stato migrazione clone.

### Voce 2026-03-10 06
- DATA: 2026-03-10
- TITOLO MODIFICA: Clonazione di Dossier Gomme, Dossier Rifornimenti e Analisi Economica
- OBIETTIVO: Completare i principali blocchi secondari collegati al Dossier e alla lettura economica nel clone `read-only`.
- FILE TOCCATI:
  - `src/next/NextDossierGommePage.tsx`
  - `src/next/NextDossierRifornimentiPage.tsx`
  - `src/next/NextAnalisiEconomicaPage.tsx`
  - `src/next/NextDossierMezzoPage.tsx`
  - `src/next/NextShell.tsx`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
- COSA E STATO CAMBIATO:
  - Aggiunte nel clone le tre viste mancanti collegate al Dossier.
  - Collegati i pulsanti del Dossier clone alle tre viste dedicate.
  - In `Analisi Economica` bloccata la rigenerazione IA, mantenendo invece la lettura e la preview PDF.
- IMPATTO SU UI / LETTURA / BLOCCO SCRITTURE:
  - UI: il clone guadagna le tre schermate secondarie principali del Dossier.
  - Lettura: vengono letti gli stessi dataset del madre per gomme, rifornimenti, costi, documenti IA e snapshot analitiche.
  - Blocco scritture: rigenerazione IA e delete restano bloccati nel clone.
- COME VERIFICARE:
  - Aprire `/next/mezzi-dossier/:targa` e usare i pulsanti `Analisi Economica`, `Gomme`, `Rifornimenti (dettaglio)`.
  - Verificare che le tre viste mostrino dati reali e che le azioni scriventi restino disabilitate.
  - Verificare `npm run build`.
- SE E CANDIDABILE A ESSERE PORTATO NELLA MADRE IN FUTURO: NO
- NOTE:
  - Voce ricostruita da patch clone recente gia presente nel repo.

### Voce 2026-03-10 07
- DATA: 2026-03-10
- TITOLO MODIFICA: Indicatore visivo globale `CLONE READ-ONLY`
- OBIETTIVO: Distinguere sempre il clone dalla madre con un marcatore sobrio ma stabile.
- FILE TOCCATI:
  - `src/next/NextShell.tsx`
  - `src/next/next-shell.css`
- COSA E STATO CAMBIATO:
  - Reso esplicito nella topbar sticky il badge `CLONE READ-ONLY`.
- IMPATTO SU UI / LETTURA / BLOCCO SCRITTURE:
  - UI: distinzione visiva costante del clone.
  - Lettura: nessun impatto.
  - Blocco scritture: nessun impatto tecnico diretto, ma rafforza il contesto operativo corretto.
- COME VERIFICARE:
  - Aprire qualunque route `/next/*` e verificare presenza del badge nella topbar.
- SE E CANDIDABILE A ESSERE PORTATO NELLA MADRE IN FUTURO: NO
- NOTE:
  - Voce clone-specifica.
