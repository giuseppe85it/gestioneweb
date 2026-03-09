# STATO MIGRAZIONE NEXT

## 1. Scopo del documento
Questo documento e il registro ufficiale e permanente dello stato di migrazione della nuova app NEXT.

Serve a:
- capire in pochi minuti cosa esiste davvero nella NEXT e cosa no;
- evitare lavoro duplicato, importazioni parziali dimenticate e perdita di contesto tra chat/sessioni;
- distinguere chiaramente shell, UI importata, read-only, scrittura attiva e parti che restano legacy;
- lasciare una traccia stabile per ogni avanzamento reale su shell, pagine, moduli o integrazioni.

Va aggiornato ogni volta che un task tocca la NEXT e modifica anche solo uno di questi aspetti:
- stato di migrazione;
- livello di lettura/scrittura dati;
- decisione di mantenere una parte in legacy;
- rischi o blocchi emersi durante la migrazione.

## 2. Regole di lettura
Questo documento serve a capire, per ogni area/modulo della NEXT:
- se esiste gia qualcosa nel repo oppure no;
- se e presente solo una shell;
- se e stata importata solo la UI;
- se legge dati reali;
- se scrive dati reali;
- se resta in legacy;
- se una parte e ancora `DA VERIFICARE`.

Importante:
- questo documento non sostituisce `docs/STATO_ATTUALE_PROGETTO.md`;
- questo documento non sostituisce i change report del singolo task;
- questo documento non sostituisce i continuity report tra sessioni;
- questo documento traccia solo lo stato di avanzamento della NEXT e il suo rapporto con la legacy.
- alcune righe rappresentano macro-aree shell della NEXT, altre rappresentano moduli o domini funzionali interni.

## 3. Stati standard di migrazione

### `NON INIZIATO`
Significa che nel repo non e dimostrata alcuna implementazione reale della parte NEXT.

Usarlo quando:
- esiste solo documentazione o blueprint;
- non esiste ancora shell, route o modulo NEXT verificabile.

### `SHELL CREATA`
Significa che esiste il contenitore/base della schermata o area NEXT, ma senza una migrazione funzionale reale.

Usarlo quando:
- la shell e presente;
- la pagina puo anche essere navigabile;
- i contenuti sono placeholder, incompleti o non ancora importati.

### `IMPORTATO SOLO UI`
Significa che la struttura visiva e stata portata nella NEXT, ma senza lettura reale dei dati o con dati finti/mock/statici.

Usarlo quando:
- la UI e stata importata o ricostruita;
- non c'e ancora integrazione affidabile con dati reali.

### `IMPORTATO READ-ONLY`
Significa che il modulo NEXT legge dati reali ma non scrive.

Usarlo quando:
- il modulo e operativo in consultazione;
- eventuali azioni di modifica sono assenti o volutamente disattivate.

### `IMPORTATO CON SCRITTURA`
Significa che il modulo NEXT legge dati reali e abilita anche scrittura reale.

Usarlo quando:
- la scrittura e attiva almeno per una parte del flusso;
- la responsabilita sul dato non e piu solo legacy.

### `DA VERIFICARE`
Significa che non ci sono prove sufficienti per classificare con certezza lo stato reale.

Usarlo quando:
- il repo o i documenti non permettono di dimostrare il livello reale di migrazione;
- esistono segnali contraddittori o incompleti.

### `COMPLETATO`
Significa che, per il perimetro deciso, il modulo e considerato migrato nella NEXT.

Usarlo quando:
- shell, UI, dati e comportamento previsti risultano presenti nel perimetro concordato;
- eventuali dipendenze residue dalla legacy sono note e dichiarate.

### `RIMANE LEGACY`
Significa che la parte non viene migrata nella NEXT in questa fase e resta intenzionalmente sulla legacy.

Usarlo quando:
- la scelta e esplicita;
- la NEXT si limita eventualmente a un collegamento, una vista sintetica o un'integrazione.

## 4. Tipi standard di migrazione

### `RIUSO QUASI DIRETTO`
Usarlo quando la parte attuale e gia abbastanza solida da essere riportata quasi integralmente nella NEXT con adattamenti minimi.

### `RIUSO LOGICA + UI NUOVA`
Usarlo quando si intende conservare logica/contratti/struttura funzionale ma ricostruire la UI in modo coerente con la shell NEXT.

### `RISCRITTURA PULITA`
Usarlo quando conviene ricostruire il modulo in modo pulito invece di importarlo dal legacy.

### `LEGACY TEMPORANEO`
Usarlo quando la parte resta attiva nella legacy e la NEXT, per ora, non la sostituisce.

### `DA DECIDERE`
Usarlo quando il tipo di migrazione non e ancora dimostrabile o non e ancora stato deciso.

## 5. Tabella principale di avanzamento

Nota iniziale:
- questa versione del registro e aggiornata allo stato reale del repo al `2026-03-09`;
- nel repository e ora dimostrata una shell NEXT runtime separata, raggiungibile con route dedicate `/next/*`;
- le macro-aree NEXT restano separate dalla legacy; al momento `Flotta` legge dati reali in `read-only` tramite reader canonico `D01`, mentre il `Dossier Mezzo` combina `D01` con un primo blocco tecnico `D02` minimo e `read-only` e con un layer `D04` di `RICOSTRUZIONE CONTROLLATA NEXT` che usa base business + feed campo solo all'interno del layer; `Centro di Controllo`, `Operativita`, `IA Gestionale` e `Strumenti Trasversali` restano shell/UI senza lettura runtime reale;
- la shell NEXT include ora anche una struttura frontend centralizzata di visibilita/accesso per ruolo con simulazione tecnica `admin` / `gestionale` / `autista`, senza auth reale o backend dedicato.
- la macro-area `/next/strumenti-trasversali` non e piu solo placeholder generico: e ora una shell UI reale che chiarisce PDF standard, utility comuni, servizi condivisi, richiamo cross-area e distinzione da `IA Gestionale`, sempre senza servizi runtime.
- la macro-area `/next/ia-gestionale` non e piu solo placeholder generico: e ora una shell UI reale che chiarisce missione dell'assistente business, perimetro v1 `read-only`, superfici iniziali `Dossier` + `Centro di Controllo`, spiegabilita obbligatoria, limiti iniziali e separazione dalla `IA Audit Tecnico`, sempre senza dati runtime.
- la macro-area `/next/centro-controllo` non e piu solo placeholder generico: e ora una shell UI reale che chiarisce cabina di regia, priorita, alert, scadenze, destinazioni modulo e spazio futuro per la IA Business v1, sempre senza dati runtime.
- la macro-area `/next/operativita-globale` non e piu solo placeholder generico: e ora una shell UI reale che chiarisce domini globali, confine con il Dossier, flussi condivisi e spazio futuro per la IA sui moduli globali, sempre senza dati runtime.
- la macro-area `/next/mezzi-dossier` non e piu solo placeholder generico: ospita ora sia l'elenco mezzi NEXT `read-only` basato su `D01` sia un primo Dossier Mezzo read-only che combina `D01`, una convergenza minima `D02` su `@lavori` e `@manutenzioni` e un layer `D04` di `RICOSTRUZIONE CONTROLLATA NEXT`, sempre senza writer.
- `D04 Rifornimenti e consumi` entra nella NEXT dal `2026-03-09` come layer unico di ricostruzione controllata e confinata: legge internamente `@rifornimenti` e `@rifornimenti_autisti_tmp`, normalizza shape legacy, ricostruisce autista/badge/km/costo/timestamp quando possibile e consegna al Dossier solo un modello pulito con provenienza e qualita del dato. Nessuna scrittura nuova, nessuna modifica legacy e nessuna complessita D04 fuori dal layer.

| Area / Modulo | Stato migrazione | Tipo migrazione | Dati reali letti? | Scrittura attiva? | Legacy o Next? | File/moduli di riferimento attuali | Note / rischi | Ultimo aggiornamento | Commit hash |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Shell globale NEXT | SHELL CREATA | RISCRITTURA PULITA | si | no | NEXT | `src/App.tsx`; `src/next/NextShell.tsx`; `src/next/NextAreaPage.tsx`; `src/next/NextCentroControlloPage.tsx`; `src/next/NextMezziDossierPage.tsx`; `src/next/NextDossierMezzoPage.tsx`; `src/next/nextAnagraficheFlottaDomain.ts`; `src/next/nextOperativitaTecnicaDomain.ts`; `src/next/nextRifornimentiConsumiDomain.ts`; `src/next/NextOperativitaGlobalePage.tsx`; `src/next/NextIAGestionalePage.tsx`; `src/next/NextStrumentiTrasversaliPage.tsx`; `src/next/nextData.ts`; `src/next/nextAccess.ts`; `src/next/NextRoleGuard.tsx`; `src/next/NextAccessDeniedPage.tsx`; `src/next/NextDriverExperiencePage.tsx`; `src/next/NextRoleLandingRedirect.tsx`; `src/next/next-shell.css` | Shell runtime separata e navigabile creata sotto `/next/*`. Legacy invariata: nessuna route legacy sostituita e nessun writer NEXT attivo. `Centro di Controllo`, `Operativita Globale`, `IA Gestionale` e `Strumenti Trasversali` restano `IMPORTATO SOLO UI`; `Mezzi / Dossier` ospita ora sia l'elenco mezzi reale su `D01` sia un Dossier `read-only` che converge `D01`, il primo blocco tecnico `D02` minimo e un layer `D04` di ricostruzione controllata confinato nella NEXT, tramite reader dedicati e senza toccare la logica legacy. | 2026-03-09 | N/A - patch locale next d04 ricostruzione controllata |
| Home / Centro di Controllo | IMPORTATO SOLO UI | RIUSO LOGICA + UI NUOVA | no | no | NEXT | `src/next/NextCentroControlloPage.tsx`; `src/next/next-shell.css`; `docs/ui-blueprint/WIREFRAME_LOGICI_NEXT.md`; `docs/ui-blueprint/DESIGN_SYSTEM_NEXT.md` | `/next/centro-controllo` chiarisce ora il ruolo del cockpit globale: visione sistema, priorita, alert, scadenze, collegamenti al Dossier e alle altre macro-aree, spazio futuro per `IA Business NEXT` v1. Nessun dato runtime, nessuna ricerca reale, nessuna logica `Home` o `CentroControllo` legacy importata. | 2026-03-08 | N/A - patch locale centro-controllo next |
| Flotta | IMPORTATO READ-ONLY | RIUSO LOGICA + UI NUOVA | si | no | NEXT | `src/next/NextMezziDossierPage.tsx`; `src/next/nextAnagraficheFlottaDomain.ts`; `src/next/next-shell.css`; `docs/data/DOMINI_DATI_CANONICI.md` | `/next/mezzi-dossier` mostra ora l'elenco mezzi NEXT `read-only`: legge solo `storage/@mezzi_aziendali`, usa un mapping canonico minimo (`id`, `targa`, `categoria`, `marca`, `modello`, `autistaNome`), abilita ricerca/filtro locali e apre il Dossier iniziale tramite route `/next/mezzi-dossier/:targa`. `@colleghi` resta nel dominio ma non viene letto in questo step. Nessun writer e nessun dominio extra importato. | 2026-03-08 | N/A - patch locale next dossier-iniziale read-only |
| Dossier Mezzo | IMPORTATO READ-ONLY | RIUSO LOGICA + UI NUOVA | si | no | NEXT | `src/next/NextDossierMezzoPage.tsx`; `src/next/nextAnagraficheFlottaDomain.ts`; `src/next/nextOperativitaTecnicaDomain.ts`; `src/next/nextRifornimentiConsumiDomain.ts`; `src/App.tsx`; `src/next/next-shell.css`; `docs/data/DOMINI_DATI_CANONICI.md`; `docs/data/FLUSSO_REALE_RIFORNIMENTI.md` | `/next/mezzi-dossier/:targa` ospita ora un Dossier Mezzo NEXT `read-only` a tre ingressi controllati: identita mezzo su `D01`, primo blocco tecnico reale su `D02` e blocco rifornimenti `D04` tramite un solo layer NEXT di `RICOSTRUZIONE CONTROLLATA`. Il layer legge internamente dataset business e feed campo legacy, normalizza shape multiple, ricostruisce autista/badge/km/costo/timestamp quando possibile e consegna alla pagina solo un modello pulito con `dataDisplay`, `timestampRicostruito`, `litri`, `km`, `costo`, `distributore`, `note`, `autistaNome`, `badgeAutista`, `provenienza` e `fieldQuality`. Nessun clone del dossier legacy, nessun writer e nessuna complessita D04 fuori dal layer. | 2026-03-09 | N/A - patch locale next d04 ricostruzione controllata |
| Operativita | IMPORTATO SOLO UI | RIUSO LOGICA + UI NUOVA | no | no | NEXT | `src/next/NextOperativitaGlobalePage.tsx`; `src/next/next-shell.css`; `docs/ui-blueprint/WIREFRAME_LOGICI_NEXT.md`; `docs/ui-blueprint/MAPPA_PATTERN_DA_RIUSARE.md` | `/next/operativita-globale` chiarisce ora il ruolo della macro-area come contenitore dei domini globali non mezzo-centrici: `Acquisti & Magazzino`, inventario, movimenti materiali, documenti amministrativi e flussi condivisi. Esplicita anche il confine con il Dossier e il fatto che la IA qui entra solo in una fase successiva. Nessun dato runtime, nessuna logica legacy importata. | 2026-03-08 | N/A - patch locale operativita-globale next |
| IA Gestionale | IMPORTATO SOLO UI | RIUSO LOGICA + UI NUOVA | no | no | NEXT | `src/next/NextIAGestionalePage.tsx`; `src/next/next-shell.css`; `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`; `docs/architecture/FUNZIONI_TRASVERSALI.md` | `/next/ia-gestionale` chiarisce ora il ruolo dell'assistente business read-only: missione, perimetro v1, superfici iniziali `Dossier` + `Centro di Controllo`, spiegabilita obbligatoria, limiti iniziali, rollout progressivo e separazione dalla `IA Audit Tecnico`. Nessun backend, modello, documento o dato runtime collegato. | 2026-03-08 | N/A - patch locale ia-gestionale next |
| Strumenti Trasversali | IMPORTATO SOLO UI | RISCRITTURA PULITA | no | no | NEXT | `src/next/NextStrumentiTrasversaliPage.tsx`; `src/next/next-shell.css`; `docs/architecture/FUNZIONI_TRASVERSALI.md`; `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md` | `/next/strumenti-trasversali` chiarisce ora il ruolo dei servizi condivisi della piattaforma: PDF standard, utility comuni, supporto tecnico e richiami cross-area. Esplicita anche il confine con i moduli business e con `IA Gestionale`. Nessun servizio runtime, nessun export reale e nessuna logica legacy importata. | 2026-03-08 | N/A - patch locale strumenti-trasversali next |
| Magazzino | NON INIZIATO | RIUSO LOGICA + UI NUOVA | no | no | NEXT | `src/pages/Acquisti.tsx`; `src/pages/Inventario.tsx`; `src/pages/MaterialiDaOrdinare.tsx`; `src/pages/MaterialiConsegnati.tsx` | `MaterialiDaOrdinare` trattato come funzione valida ma da collocare nella shell nuova, non come shell autonoma da trascinare. | 2026-03-07 | N/A - inizializzazione registro |
| Analisi | NON INIZIATO | RIUSO LOGICA + UI NUOVA | no | no | NEXT | `src/pages/AnalisiEconomica.tsx`; `src/pages/CapoCostiMezzo.tsx` | Buona base analitica legacy, ma nessuna area analisi NEXT attiva e dimostrata. | 2026-03-07 | N/A - inizializzazione registro |
| Sistema / Utenti e permessi | SHELL CREATA | RISCRITTURA PULITA | no | no | NEXT | `docs/security/SICUREZZA_E_PERMESSI.md`; `src/next/nextAccess.ts`; `src/next/NextRoleGuard.tsx`; `src/next/NextAccessDeniedPage.tsx`; `src/next/NextDriverExperiencePage.tsx` | La NEXT ha ora una prima struttura frontend di visibilita/accesso: preset `admin`, `gestionale`, `autista`; menu condizionale; route guard leggere; separazione concettuale autista. Mancano ancora auth reale, pannello permessi e matrice finale per singolo utente. | 2026-03-08 | N/A - patch locale ruolo/accesso next |
| Area Autisti (integrazione/collegamento) | RIMANE LEGACY | LEGACY TEMPORANEO | no | no | LEGACY | `src/autisti/HomeAutista.tsx`; `src/autistiInbox/AutistiInboxHome.tsx`; `src/autistiInbox/AutistiAdmin.tsx`; `src/next/NextDriverExperiencePage.tsx` | Area attiva lato legacy; la shell NEXT espone ora solo una vista tecnica separata per ribadire che l'autista non entra nel backoffice admin come utente ridotto. Nessuna riscrittura autisti avviata. | 2026-03-08 | N/A - patch locale ruolo/accesso next |

## 6. Regole di aggiornamento
Regola operativa:
- ogni task futuro che tocca la NEXT deve aggiornare questo documento;
- ogni importazione o migrazione di modulo deve lasciare una traccia qui;
- se una parte passa da read-only a scrittura, l'aggiornamento va fatto subito;
- se una parte resta legacy, va segnato chiaramente;
- se emerge un blocco tecnico, architetturale o documentale, va scritto nelle note/rischi.

Aggiornamento minimo richiesto per ogni task NEXT:
1. individuare la riga o le righe coinvolte;
2. aggiornare almeno stato, note/rischi, data e hash commit quando il task cambia davvero lo stato della migrazione;
3. se il task non cambia lo stato ma chiarisce qualcosa di rilevante, aggiornare almeno le note;
4. se eccezionalmente il file non viene aggiornato, Codex deve spiegarlo esplicitamente in chat e nel change report.

## 7. Distinzione tra Legacy e Next
- La legacy resta il sistema attivo, stabile e operativo corrente.
- La NEXT cresce in parallelo, senza cancellare o riscrivere alla cieca la legacy.
- Questo documento traccia solo la nuova costruzione NEXT e il suo rapporto con i moduli legacy di origine.
- Il fatto che un modulo legacy sia una buona base non significa che sia gia migrato.

## 8. Stato documento
- **STATO: CURRENT**
