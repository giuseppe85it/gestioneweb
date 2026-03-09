# STATO ATTUALE DEL PROGETTO

## 1. Situazione generale
- **Fase attuale del progetto**: consolidamento documentazione/regole operative e avvio dei primi ingressi `read-only` reali nella NEXT, incluso il primo Dossier Mezzo con convergenza tecnica minima e primo layer di normalizzazione dati `D04` confinato nella NEXT.
- **Stato app legacy**: attiva e riferimento operativo corrente.
- **Stato nuova app next**: shell runtime separata attiva, 5 macro-aree presenti, elenco mezzi `read-only` attivo e Dossier Mezzo NEXT gia leggibile con blocco tecnico `D02` in sola lettura e primo blocco rifornimenti `D04` tramite layer di normalizzazione NEXT a `canonico ridotto`.
- **Stato documentazione**: struttura madre disponibile, documenti core rinominati in italiano, indice e guida di ingresso presenti.
- **Stato processo Codex/report**: regole operative attive (`AGENTS.md`, `REGOLE_LAVORO_CODEX.md`) + template/report di change e continuity gia presenti.
- **Protocollo sicurezza modifiche**: attivo tramite `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`; ogni patch deve passare da analisi impatto prima dell'applicazione.
- **Audit repo vs docs**: eseguito con report dedicato in `docs/audit/`; emerse differenze ad alta priorita su endpoint IA/PDF, policy dati/sicurezza effettive e route legacy ancora attive.
- **Verifica infrastrutturale Firebase/Backend (2026-03-07)**: eseguita in sola lettura; criticita reali confermate su Storage se toccato senza analisi e su canali backend IA/PDF non canonici (`aiCore` non esportata nel repo backend, libretto su Cloud Run esterno); `estraiPreventivoIA` e `stamp_pdf` risultano invece flussi reali da consolidare/documentare.
- **Audit UI/Grafica repo (2026-03-07)**: eseguito in sola lettura; confermate basi forti da riusare per la NEXT (`Dossier`, `CentroControllo`, `Acquisti`, `AutistiInbox/Admin`, `Capo*`) e moduli legacy/transitori da superare o unificare (`Mezzi`, CRUD generici, `MaterialiDaOrdinare` standalone); criticita prevalente architetturale/documentale, non un bug operativo immediato.
- **Blueprint grafico NEXT (2026-03-07)**: creati blueprint visivo, design system, wireframe logici e mappa pattern da riusare in `docs/ui-blueprint/`; la fase successiva sara trasformare questo impianto documentale in shell UI reale della nuova app, lasciando invariata la legacy.
- **Registro ufficiale migrazione NEXT (2026-03-07)**: creato `docs/product/STATO_MIGRAZIONE_NEXT.md`; da ora ogni task futuro che tocca la nuova app deve aggiornarlo per tracciare shell, read-only, scrittura, parti legacy e blocchi, senza perdere contesto tra chat o sessioni.
- **Mappa maestra flussi gestionale (2026-03-07)**: creati `docs/flow-master/MAPPA_MAESTRA_FLUSSI_GESTIONALE.md`, `docs/flow-master/MAPPA_MAESTRA_FLUSSI_GESTIONALE.mmd` e `docs/flow-master/FLUSSI_OPERATIVI_CRITICI.md`; il progetto dispone ora di una vista unificata del funzionamento reale del gestionale prima della shell NEXT.
- **Decisione IA Gestionale per la NEXT (2026-03-07)**: fissata a livello architetturale/documentale; la shell target considera ora 5 macro-aree (`Centro di Controllo`, `Mezzi / Dossier`, `Operativita Globale`, `IA Gestionale`, `Strumenti Trasversali`) e chiarisce che la IA ha doppia natura: area visibile + motore trasversale, senza autorizzare implementazioni automatiche rischiose sulla legacy.
- **Perimetro reale IA v1 per la NEXT (2026-03-07)**: chiarito a livello architetturale/documentale; la prima versione sensata resta `read-only`, limitata inizialmente a `Dossier Mezzo` e `Centro di Controllo`, con obbligo di spiegabilita della risposta (`fonte dati`, `modulo sorgente`, `periodo`, marcatura `DA VERIFICARE` se l'affidabilita non e piena) e separazione netta dalla futura capability di audit tecnico su repo/docs/dati.
- **Shell reale NEXT nel runtime (2026-03-07)**: implementata nel frontend con route dedicate `/next/*`, layout separato, 5 macro-aree placeholder navigabili e nessuna nuova scrittura dati; la legacy resta raggiungibile e invariata sulle route attuali.
- **Visibilita/accesso ruolo nella shell NEXT (2026-03-08)**: predisposta una struttura frontend centralizzata per ruoli `admin`, `gestionale` e `autista`, con menu dinamico, guardie route leggere, simulazione tecnica via query param `role` e separazione esplicita dell'esperienza autista, senza auth reale o impatto sulla legacy.
- **Quinta area reale NEXT oltre il placeholder generico (2026-03-08)**: la macro-area `/next/strumenti-trasversali` e stata trasformata in una shell UI strutturata, `read-only`, che chiarisce il ruolo dei servizi condivisi della piattaforma, dei PDF standard, delle utility comuni e del confine rispetto a `IA Gestionale`, senza attivare ancora servizi runtime o tool legacy.
- **Quarta area reale NEXT oltre il placeholder generico (2026-03-08)**: la macro-area `/next/ia-gestionale` e stata trasformata in una shell UI strutturata, `read-only`, che chiarisce missione dell'assistente business, perimetro v1, superfici iniziali `Dossier` + `Centro di Controllo`, spiegabilita obbligatoria e separazione dalla `IA Audit Tecnico`, senza integrare ancora modelli, backend o dati runtime.
- **Terza area reale NEXT oltre il placeholder generico (2026-03-08)**: la macro-area `/next/operativita-globale` e stata trasformata in una shell UI strutturata, `read-only`, che chiarisce domini globali non mezzo-centrici, confine con il Dossier, collocazione futura di `Acquisti & Magazzino` e rapporto con IA futura, senza importare ancora logiche operative legacy.
- **Seconda area reale NEXT oltre il placeholder generico (2026-03-08)**: la macro-area `/next/centro-controllo` e stata trasformata in una shell UI strutturata, `read-only`, che chiarisce cabina di regia, priorita, alert, scadenze, convergenza dei flussi e collegamento con Dossier e IA futura, senza importare ancora logiche della Home legacy.
- **Prima area reale NEXT oltre il placeholder generico (2026-03-08)**: la macro-area `/next/mezzi-dossier` e stata trasformata in una shell UI strutturata, `read-only`, che chiarisce ingresso area mezzi, centralita del Dossier, convergenze mezzo-centriche e distinzione da `Operativita Globale`, senza importare ancora logiche business legacy.
- **Primo import reale dati nella NEXT (2026-03-08)**: `/next/mezzi-dossier` legge ora `storage/@mezzi_aziendali` tramite reader canonico dedicato al dominio `Anagrafiche flotta e persone`, limitato a campi stabili (`id`, `targa`, `categoria`, `marca`, `modello`, `autistaNome`), senza scritture e senza importare ancora il Dossier completo.
- **Primo Dossier Mezzo NEXT iniziale (2026-03-08)**: `/next/mezzi-dossier/:targa` espone ora un dettaglio mezzo `read-only` basato solo sul dominio `Anagrafiche flotta e persone`; mostra identita mezzo, stato di importazione e convergenze future, senza leggere ancora lavori, rifornimenti, documenti o costi.
- **Primo blocco tecnico reale nel Dossier NEXT (2026-03-08)**: il dettaglio `/next/mezzi-dossier/:targa` converge ora anche una porzione minima `read-only` del dominio `Operativita tecnica mezzo`, tramite reader canonico dedicato su `@lavori` e `@manutenzioni`, limitato a backlog lavori, lavori chiusi e manutenzioni essenziali per `targa`, senza writer, materiali, costi o ricostruzioni complete della logica legacy.
- **Primo layer di normalizzazione NEXT su `D04 Rifornimenti e consumi` (2026-03-08)**: il Dossier Mezzo NEXT legge ora anche un blocco rifornimenti minimale tramite layer dedicato `D04`, confinato nella NEXT, che accetta solo `storage/@rifornimenti.items`, non usa `@rifornimenti_autisti_tmp`, non applica merge reader-side e dichiara esplicitamente `km` e `costo` come campi opzionali/non garantiti.

## 2. Decisioni architetturali confermate
- Nuova app in parallelo alla legacy.
- Stessa base dati iniziale (senza duplicazione DB in partenza).
- Fase iniziale next in read-only.
- Home = Centro di Controllo.
- Dossier Mezzo = cuore del sistema.
- Moduli globali separati dai flussi targa-centrici.
- IA Gestionale / Assistente Gestionale come macro-area visibile della NEXT.
- IA integrata anche come funzione trasversale.
- IA Business NEXT v1 = `read-only`.
- Superfici iniziali IA Business NEXT v1 = `Dossier Mezzo` + `Centro di Controllo`.
- Risposta IA v1 con spiegabilita obbligatoria: fonte dati, modulo sorgente, periodo e marcatura `DA VERIFICARE` quando necessario.
- IA Business runtime della NEXT separata da una futura capability distinta di `IA Audit Tecnico` su repo/docs/dati.
- NEXT runtime visibile su route separate `/next/*`, senza sostituire `/` o alterare il comportamento delle route legacy.
- Predisposizione frontend NEXT per visibilita/accesso ruolo: `admin` vede tutte le macro-aree shell, `gestionale` vede solo aree abilitate dal preset tecnico, `autista` resta esperienza separata e non entra nella shell admin come utente ridotto.
- PDF gestito come funzione trasversale.
- Distinzione tra PDF standard tecnico e PDF intelligenti / report assistiti in area IA Gestionale.
- Area Autisti separata da area Admin.
- Modello permessi a 3 livelli (Super Admin / Account gestionale / Autista): **DA VERIFICARE** come conferma finale operativa.
- Governance IA: la IA segnala e motiva, l'utente decide, ChatGPT analizza/struttura, Codex applica; nessuna patch autonoma o nuova scrittura rischiosa autorizzata in questa fase.

## 3. Documenti principali da leggere
1. `docs/LEGGI_PRIMA.md`
2. `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
3. `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
4. `docs/data/MAPPA_COMPLETA_DATI.md`
5. `docs/security/SICUREZZA_E_PERMESSI.md`
6. `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
7. `docs/product/STATO_MIGRAZIONE_NEXT.md` per qualsiasi task che tocca la nuova app NEXT

## 4. Punti aperti da non dimenticare
- Stream eventi autisti canonico (`@storico_eventi_operativi` vs `autisti_eventi`).
- Contratto finale allegati preventivi (`preventivi/ia/*` vs `preventivi/<id>.pdf`).
- Matrice ruoli/permessi definitiva (distinzione admin/capo/account gestionale).
- Policy Firestore effettive (file `firestore.rules` non presente nel repo).
- Governance finale endpoint IA multipli.
- Standard UI canonico cross-modulo per la NEXT (ora definito a livello documentale, da tradurre in shell UI reale).
- Dettaglio e stato aggiornato: `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`.
- Esito dettagliato verifica infrastrutturale: `docs/audit/VERIFICA_INFRASTRUTTURA_FIREBASE_BACKEND.md`.
- Esito dettagliato audit UI repo: `docs/ui-audit/AUDIT_GRAFICA_ATTUALE.md`.
- Esito dettagliato blueprint UI NEXT: `docs/ui-blueprint/BLUEPRINT_GRAFICO_NEXT.md`.

## 5. Ultimi avanzamenti importanti
- Creata documentazione madre completa del progetto.
- Rinomina documenti core in italiano per maggiore leggibilita.
- `AGENTS.md` creato/aggiornato come guida operativa permanente.
- Struttura `change-reports` creata con regole e template.
- Struttura `continuity-reports` creata con regole e template.
- Creato `REGISTRO_PUNTI_DA_VERIFICARE` per memoria fissa dei temi aperti.
- Completata verifica reale Firebase/Backend con chiarimento di rischi immediati, futuri e solo documentali.
- Completato audit UI/grafica del repo con distinzione tra pattern da mantenere, rifinire, unificare o superare per la progettazione NEXT.
- Creato il blueprint grafico ufficiale della NEXT con design system e wireframe logici, pronto per guidare la futura costruzione della shell UI reale.
- Creato il registro ufficiale di migrazione della NEXT per tracciare in modo permanente cosa e shell, read-only, scrivente, legacy o ancora da verificare.
- Creata la mappa maestra dei flussi del gestionale con evidenza delle convergenze verso Dossier, moduli globali, capability trasversali e flussi critici.
- Formalizzata la decisione architetturale che introduce `IA Gestionale` come macro-area della NEXT con ruolo sia dedicato sia trasversale, mantenendo invariata la legacy.
- Formalizzato anche il perimetro reale della `IA Gestionale` v1: rollout progressivo, `read-only`, prime superfici `Dossier Mezzo` e `Centro di Controllo`, separazione dalla capability di audit tecnico su repository/documentazione/dati.
- Creata la shell reale della NEXT nel runtime applicativo con route dedicate `/next/*`, macro-aree navigabili, layout separato e placeholder coerenti con blueprint e design system, senza impattare i moduli legacy.
- Aggiunta nella shell NEXT una prima struttura solida di visibilita/accesso per ruolo, con simulazione tecnica `admin` / `gestionale` / `autista`, menu condizionale, blocco route non consentite e vista autista separata solo lato frontend.
- Trasformata `/next/strumenti-trasversali` nel quinto caso di area NEXT realmente strutturata oltre il placeholder iniziale, come shell `read-only` che esplicita servizi condivisi, PDF standard, utility comuni, richiami cross-area e confine netto rispetto a `IA Gestionale`.
- Trasformata `/next/ia-gestionale` nel quarto caso di area NEXT realmente strutturata oltre il placeholder iniziale, come shell `read-only` che esplicita missione, perimetro v1, spiegabilita obbligatoria, limiti iniziali e separazione dalla futura `IA Audit Tecnico`.
- Trasformata `/next/operativita-globale` nel terzo caso di area NEXT realmente strutturata oltre il placeholder iniziale, come shell workflow globale che distingue domini condivisi, confine con Dossier e collocazione futura di `Acquisti & Magazzino`.
- Trasformata `/next/centro-controllo` nel secondo caso di area NEXT realmente strutturata oltre il placeholder iniziale, come cockpit `read-only` che esplicita priorita, alert, scadenze, destinazioni modulo e spazio futuro per l'IA Business v1.
- Trasformata `/next/mezzi-dossier` nel primo caso di area NEXT realmente strutturata oltre il placeholder iniziale, con shell `detail-first` centrata sul Dossier e predisposta ai futuri import `read-only`.
- Avviato il primo import reale dati della NEXT sul dominio `Anagrafiche flotta e persone`: `/next/mezzi-dossier` espone ora un elenco mezzi `read-only` basato su `storage/@mezzi_aziendali`, con reader canonico dedicato e senza introdurre scritture o reader improvvisati da chiavi sparse.
- Attivato il primo Dossier Mezzo NEXT iniziale: dall'elenco mezzi si apre ora un dettaglio `read-only` su route dedicata `/next/mezzi-dossier/:targa`, sempre basato solo sul dominio stabile `D01` e costruito per preparare le future convergenze verso il Dossier senza clonare la legacy.
- Attivata la prima convergenza tecnica reale del Dossier NEXT: lo stesso dettaglio mezzo legge ora anche una porzione minima e controllata di `D02 Operativita tecnica mezzo`, tramite reader canonico dedicato su `@lavori` e `@manutenzioni`, mantenendo il Dossier `read-only` e separato da writer, materiali e costi legacy.
- Attivato il primo layer di normalizzazione NEXT sul dominio `D04 Rifornimenti e consumi`: il Dossier Mezzo legge ora un blocco rifornimenti minimale e `read-only` dal solo `storage/@rifornimenti.items`, con modello pulito interno NEXT, nessuna lettura `tmp` e nessun merge fuori dal layer dedicato.

## 6. Regola operativa obbligatoria
Prima di ogni nuovo task bisogna leggere almeno:
1. `docs/STATO_ATTUALE_PROGETTO.md`
2. `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
3. `docs/data/MAPPA_COMPLETA_DATI.md`
4. `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
5. `AGENTS.md`

Per ogni nuova patch e obbligatorio applicare anche:
6. `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`

Se il task tocca la NEXT, bisogna inoltre leggere e aggiornare:
7. `docs/product/STATO_MIGRAZIONE_NEXT.md`

## 7. Prossimo passo consigliato
Usare la shell NEXT, il gating frontend e le cinque macro-aree ormai strutturate `Centro di Controllo`, `Mezzi / Dossier`, `Operativita Globale`, `IA Gestionale` e `Strumenti Trasversali` come base per gli ingressi `read-only` reali gia avviati su flotta e Dossier, mantenere la legacy intatta sulle route correnti, non confondere ancora il cockpit con la `Home` legacy, l'area mezzi con una migrazione completa della logica dossier, `Operativita Globale` con il clone di `Acquisti`/`Inventario`, `IA Gestionale` con una IA runtime gia collegata o `Strumenti Trasversali` con tool gia attivi, tenere separata l'esperienza autista dalla shell admin, non scambiare la simulazione ruolo attuale per auth reale, estendere il Dossier solo dominio per dominio con reader canonici dedicati, chiudere in ordine i punti aperti ad alto impatto (`aiCore` canonico, policy Storage/Firestore effettive, governance endpoint IA/PDF, coerenza inventario/materiali, matrice permessi definitiva) e aggiornare subito `docs/product/STATO_MIGRAZIONE_NEXT.md`, `REGISTRO_PUNTI_DA_VERIFICARE` e questo file quando un flusso o una macro-area passa da shell a implementazione reale.

## 8. Stato documento
- **STATO: CURRENT**
