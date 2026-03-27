# AUDIT - Centro di Controllo madre e ecosistema collegato

## 1. Scopo audit

Questo audit verifica il modulo madre `CentroControllo` e il suo ecosistema reale nel repository, senza reinterpretarlo e senza proporre patch runtime.

Obiettivo operativo:
- descrivere cosa mostra davvero la pagina madre dedicata `CentroControllo`;
- mappare sorgenti dati, filtri, dipendenze, PDF e moduli a monte/valle;
- distinguere il modulo dedicato `CentroControllo` dalla `Home` madre, che nel repo reale resta una superficie separata ma sovrapposta;
- confrontare in modo duro il runtime madre con la NEXT attuale;
- indicare cosa va clonato 1:1 e cosa non va reinterpretato.

## 2. File realmente analizzati

### Documentazione
- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/data/DOMINI_DATI_CANONICI.md`
- `docs/data/REGOLE_STRUTTURA_DATI.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- `docs/flow-master/MAPPA_MAESTRA_FLUSSI_GESTIONALE.md`
- `docs/ui-audit/AUDIT_GRAFICA_ATTUALE.md`
- `docs/ui-blueprint/BLUEPRINT_GRAFICO_NEXT.md`
- `docs/change-reports/2026-03-08_1058_ui_next-centro-controllo-structured-shell.md`
- `docs/continuity-reports/2026-03-08_1058_continuity_next-centro-controllo.md`

### Runtime madre / shared
- `src/App.tsx`
- `src/pages/CentroControllo.tsx`
- `src/pages/CentroControllo.css`
- `src/pages/Home.tsx`
- `src/pages/GestioneOperativa.tsx`
- `src/pages/DossierMezzo.tsx`
- `src/pages/DossierRifornimenti.tsx`
- `src/pages/RifornimentiEconomiaSection.tsx`
- `src/pages/Mezzo360.tsx`
- `src/components/PdfPreviewModal.tsx`
- `src/components/AutistiImportantEventsModal.tsx`
- `src/components/AutistiEventoModal.tsx`
- `src/utils/storageSync.ts`
- `src/utils/homeEvents.ts`
- `src/utils/pdfEngine.ts`
- `src/utils/pdfPreview.ts`

### Writer / feeder madre
- `src/autisti/Rifornimento.tsx`
- `src/autisti/Segnalazioni.tsx`
- `src/autisti/ControlloMezzo.tsx`
- `src/autisti/RichiestaAttrezzature.tsx`
- `src/pages/Mezzi.tsx`
- `src/autistiInbox/AutistiAdmin.tsx`
- `src/autistiInbox/AutistiInboxHome.tsx`

### NEXT attuale collegata al Centro di Controllo
- `src/next/NextHomePage.tsx`
- `src/next/NextCentroControlloClonePage.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/next/nextData.ts`

## 3. Cosa mostra davvero il Centro di Controllo della madre

### Struttura reale della pagina

Il modulo madre dedicato `src/pages/CentroControllo.tsx` non coincide con `Home.tsx`. Nel repo reale esistono due superfici separate:
- `Home.tsx`: cabina piu ampia con alert, sessioni, revisioni, rimorchi, quick link, modal e scritture amministrative;
- `CentroControllo.tsx`: pagina dedicata e piu stretta, orientata a manutenzioni programmate, report rifornimenti mensili e tre feed autisti in lettura.

La pagina madre `CentroControllo` mostra davvero:
- header con bottone `Torna a Gestione Operativa`, titolo `Centro Controllo` e sottotitolo descrittivo;
- blocco `PRIORITA OGGI` con punteggio, label, targa, autista, motivo e data;
- 5 tab reali:
  - `Manutenzioni programmate`
  - `Report rifornimenti`
  - `Segnalazioni autisti`
  - `Controlli KO/OK`
  - `Richieste attrezzature`
- summary card e contatori per i blocchi che lo richiedono;
- filtri locali per periodo, targa e flag `solo nuove` dove previsto;
- anteprima PDF solo per:
  - manutenzioni selezionate
  - report rifornimenti mensili
- un solo modal dimostrato: `PdfPreviewModal`.

### Cosa non mostra

Non sono dimostrati nella pagina madre dedicata:
- quick link verso altri moduli;
- drill-down diretto a Dossier, Autisti Admin, Inbox o moduli procurement;
- ack/snooze alert;
- modali di presa in carico business;
- ricerca globale;
- blocchi `rimorchi`, `sessioni attive`, `missing dossier`, `prenotazioni collaudo` o `pre-collaudo`.

Questi elementi appartengono a `Home.tsx` o alla reinterpretazione NEXT `NextCentroControlloPage.tsx`, non al modulo madre dedicato `CentroControllo.tsx`.

## 4. Mappa blocchi UI -> sorgenti dati

| Blocco UI madre | File runtime | Sorgenti reali | Tipo lettura | Merge / fallback / note |
| --- | --- | --- | --- | --- |
| Header + ritorno | `src/pages/CentroControllo.tsx` | nessuna | UI pura | `navigate("/gestione-operativa")` |
| Priorita oggi | `src/pages/CentroControllo.tsx` | `@mezzi_aziendali`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@richieste_attrezzature_autisti_tmp` | derivata | sintetizza 4 blocchi, assegna score e ordina |
| Manutenzioni programmate | `src/pages/CentroControllo.tsx` | `storage/@mezzi_aziendali` via `getItemSync` | diretta + derivata | filtra solo record con `manutenzioneProgrammata`; status derivato da `manutenzioneDataFine` |
| Report rifornimenti mensili | `src/pages/CentroControllo.tsx` | `storage/@rifornimenti`, `storage/@rifornimenti_autisti_tmp` via `getDoc` Firestore | mista | merge dossier/tmp con dedup e completamento km/costo/autista |
| Segnalazioni autisti | `src/pages/CentroControllo.tsx` | `storage/@segnalazioni_autisti_tmp` via `getItemSync` | diretta + derivata | `isNuova` da `letta === false` o `stato === nuova`; conteggio foto da `fotoUrls` |
| Controlli KO/OK | `src/pages/CentroControllo.tsx` | `storage/@controlli_mezzo_autisti` via `getItemSync` | diretta + derivata | `KO` calcolato da campi `check` con valore `false` |
| Richieste attrezzature | `src/pages/CentroControllo.tsx` | `storage/@richieste_attrezzature_autisti_tmp` via `getItemSync` | diretta + derivata | `isNuova` da `letta/stato`; foto da `fotoUrl` singolo |
| PDF manutenzioni | `src/pages/CentroControllo.tsx` | `generateManutenzioniProgrammatePDFBlob` | derivata | nessun archivio PDF dimostrato; solo preview/share/download |
| PDF rifornimenti | `src/pages/CentroControllo.tsx` | `generateRifornimentiMensiliPDFBlob` | derivata | nessun archivio PDF dimostrato; solo preview/share/download |

## 5. Logiche e filtri reali

### Manutenzioni programmate

La tab `Manutenzioni programmate`:
- legge `@mezzi_aziendali`;
- include solo i mezzi con `manutenzioneProgrammata` truthy;
- usa questi campi reali:
  - `targa`
  - `categoria`
  - `manutenzioneDataFine`
  - `manutenzioneContratto`
  - `manutenzioneKmMax`
  - `dataScadenzaRevisione`
- calcola lo stato cosi:
  - `SCADUTA` se `manutenzioneDataFine < oggi`
  - `IN_SCADENZA` se `manutenzioneDataFine` e entro 30 giorni
  - `OK` se oltre 30 giorni
  - `SENZA_DATA` se la data non e valorizzata
- ordina per priorita di stato e poi per giorni alla scadenza;
- permette selezione multipla e PDF solo sugli elementi selezionati.

### Report rifornimenti mensili

La tab `Report rifornimenti`:
- legge direttamente Firestore, non il domain NEXT;
- usa due sorgenti reali:
  - `storage/@rifornimenti` come base canonica dossier
  - `storage/@rifornimenti_autisti_tmp` come feed di supporto / completamento
- scarta record senza targa normalizzata o senza data interpretabile;
- deduplica per `originId`, oppure per euristica:
  - stessa targa
  - litri comparabili
  - differenza max 10 minuti, o almeno stesso giorno
- usa il feed tmp per riempire campi mancanti nel record dossier:
  - `autistaNome`
  - `badgeAutista`
  - `km`
  - `costo`
  - `distributore`
  - `note`
- filtra solo localmente per:
  - mese
  - anno
  - filtro targa libero
- calcola `count`, `totale litri`, `totale costo`.

### Segnalazioni autisti

La tab `Segnalazioni autisti`:
- legge `@segnalazioni_autisti_tmp`;
- normalizza campi non uniformi (`tipoProblema` o `tipo`, `autistaNome` o alias);
- costruisce `targaFilterKey` combinando motrice/rimorchio;
- considera `nuova` una segnalazione se:
  - `letta === false`, oppure
  - `stato` normalizzato e `nuova`;
- attiva di default il filtro `Solo nuove`.

### Controlli KO/OK

La tab `Controlli KO/OK`:
- legge `@controlli_mezzo_autisti`;
- deriva la targa in base a `target`, `targaCamion/targaMotrice`, `targaRimorchio`;
- considera `KO` ogni check con almeno una voce di `check` a `false`;
- separa il rendering in due colonne, non in tab secondarie:
  - `KO`
  - `OK`
- usa solo filtro targa locale.

### Richieste attrezzature

La tab `Richieste attrezzature`:
- legge `@richieste_attrezzature_autisti_tmp`;
- normalizza alias autista/badge/targa;
- considera `nuova` la richiesta con stessa logica di segnalazioni (`letta === false` o `stato === nuova`);
- usa filtro targa e toggle `Solo nuove`, attivo di default.

### Priorita oggi

Il blocco `PRIORITA OGGI` non e un dataset autonomo. E un layer derivato costruito in pagina da:
- controlli KO recenti: score `100`, solo se nelle ultime 48 ore;
- manutenzioni:
  - `SCADUTA` -> score `90`
  - `IN_SCADENZA` -> score `70`
  - `SENZA_DATA` -> score `30`
- segnalazioni nuove -> score base `60`, piu `+15` se tipo `GOMME`;
- richieste attrezzature nuove -> score `40`.

Ordine reale:
- prima score discendente;
- poi timestamp discendente.

Limiti reali:
- il toggle `Solo alte priorita` agisce solo sul blocco priorita;
- il filtro targa del blocco priorita non ha un input proprio: riusa lo stato `targaFilter` della tab rifornimenti. Questo accoppiamento locale e reale e fragile.

## 6. Dipendenze e moduli collegati

### Utility, facade e dipendenze dirette del modulo madre

Il modulo madre dedicato richiama davvero:
- `useNavigate` da React Router;
- Firestore `doc/getDoc` su collection `storage`;
- `getItemSync` da `storageSync`;
- `PdfPreviewModal`;
- helper PDF/preview:
  - `openPreview`
  - `sharePdfFile`
  - `copyTextToClipboard`
  - `buildPdfShareText`
  - `buildWhatsAppShareUrl`
  - `revokePdfPreviewUrl`
- generatori PDF:
  - `generateManutenzioniProgrammatePDFBlob`
  - `generateRifornimentiMensiliPDFBlob`.

Non richiama direttamente:
- `homeEvents`
- `alertsState`
- `Next domain layer`
- `AutistiEventoModal`
- `AutistiImportantEventsModal`.

### Moduli madre che alimentano i dati mostrati

Feed upstream dimostrati:
- `src/pages/Mezzi.tsx`
  - scrive in `@mezzi_aziendali`
  - alimenta `manutenzioneProgrammata`, `manutenzioneDataFine`, `manutenzioneKmMax`, `manutenzioneContratto`, `dataScadenzaRevisione`
- `src/autisti/Rifornimento.tsx`
  - scrive in `@rifornimenti_autisti_tmp`
  - aggiorna anche `storage/@rifornimenti` via `setDoc`
- `src/autisti/Segnalazioni.tsx`
  - scrive in `@segnalazioni_autisti_tmp`
- `src/autisti/ControlloMezzo.tsx`
  - scrive in `@controlli_mezzo_autisti`
- `src/autisti/RichiestaAttrezzature.tsx`
  - scrive in `@richieste_attrezzature_autisti_tmp`
- `src/autistiInbox/AutistiAdmin.tsx`
  - legge e puo rettificare gli stessi feed; costruisce anche `buildDossierItem` per rifornimenti.

### Moduli che aprono o incapsulano il Centro di Controllo

Dimostrati:
- route legacy `App.tsx` -> `/centro-controllo` -> `CentroControllo`
- `GestioneOperativa.tsx` -> bottone `Apri Centro Controllo`
- NEXT attiva:
  - `/next/centro-controllo` -> `NextCentroControlloClonePage` -> `CentroControllo`
- NEXT separata:
  - `/next` -> `NextHomePage` -> `Home`

### Moduli che convergono sugli stessi dati ma non sono il Centro di Controllo dedicato

Convergenze vere:
- `Home.tsx`
  - legge `@mezzi_aziendali`, `@autisti_sessione_attive`, `@storico_eventi_operativi`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@alerts_state`
  - gestisce alert ack/snooze e quick link
- `DossierRifornimenti.tsx` / `RifornimentiEconomiaSection.tsx`
  - leggono `@rifornimenti` + `@rifornimenti_autisti_tmp`
  - usano logica di completamento km simile
- `DossierMezzo.tsx`
  - legge rifornimenti tmp per il mezzo
- `Mezzo360.tsx`
  - incrocia `@mezzi_aziendali`, `@autisti_sessione_attive`, `@storico_eventi_operativi`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@rifornimenti_autisti_tmp`, `@richieste_attrezzature_autisti_tmp`.

## 7. Convergenze con Dossier / moduli globali

### Convergenza reale con il Dossier

La convergenza piu forte del `CentroControllo` dedicato non e sull'intera Home ma sul perimetro mezzo/rifornimenti:
- il report rifornimenti del Centro di Controllo usa la stessa coppia di dataset letta dal Dossier;
- `RifornimentiEconomiaSection` completa i km mancanti usando il feed tmp, esattamente come il Centro di Controllo prova a completare riga dossier con supporto tmp;
- `DossierMezzo` e `Mezzo360` leggono gli stessi feed autisti per targa.

### Cosa converge con Home ma non con il CentroControllo dedicato

Converge con `Home.tsx`, non con `CentroControllo.tsx`:
- `@alerts_state`
- `@storico_eventi_operativi`
- sessioni attive come pannello dedicato
- rimorchi / motrici e loro ultimo luogo
- modal `Eventi importanti autisti`
- quick link e accessi rapidi cross-modulo
- azioni amministrative su prenotazioni / pre-collaudo / revisioni / luogo asset.

Conclusione: nel runtime reale la formula documentale `Home = Centro di Controllo` e una direzione target, non una descrizione fedele dell'implementazione madre attuale.

## 8. Stato confronto madre vs NEXT

### Cosa la NEXT copre gia davvero

Copertura reale gia presente:
- `/next/centro-controllo` usa `NextCentroControlloClonePage`, che wrappa la pagina madre `CentroControllo`;
- il wrapper clone-safe:
  - non cambia la struttura madre;
  - intercetta solo il back verso `/next/gestione-operativa`;
  - sostituisce testi CTA/tab con copy `read-only`;
  - aggiunge banner e sottotitolo clone-safe.

Quindi la NEXT attiva copre gia davvero, in forma clone-safe, la pagina dedicata `CentroControllo` con:
- le stesse 5 tab;
- gli stessi filtri locali;
- le stesse tabelle / card;
- la stessa logica PDF preview;
- le stesse sorgenti dati della madre.

### Cosa la NEXT copre solo parzialmente o in modo divergente

`NextCentroControlloPage.tsx` esiste ma non e la route attiva di `/next/centro-controllo`. E una superficie diversa, alimentata da `nextCentroControlloDomain.ts`, che mostra:
- alert;
- sessioni attive;
- revisioni urgenti;
- rimorchi / motrici e trattori;
- quick link;
- missing dossier;
- modal read-only bloccati.

Questa pagina NON replica fedelmente il modulo madre dedicato `CentroControllo`, perche:
- non ha la tab `Report rifornimenti` mensile della madre;
- non ha le tabelle dedicate `Segnalazioni autisti` e `Richieste attrezzature`;
- non ha la colonna doppia `Controlli KO/OK` della madre;
- non ha il flusso PDF manutenzioni / rifornimenti della madre;
- aggiunge quick link e pannelli che nella madre dedicata appartengono piu a `Home.tsx`.

### Cosa manca del tutto o resta ambiguo

Manca una verita documentale univoca sulla relazione tra:
- `Home` madre;
- `CentroControllo` madre;
- `/next`;
- `/next/centro-controllo`;
- `NextCentroControlloPage`.

Nel runtime la situazione e questa:
- `Home` legacy e `CentroControllo` legacy sono separati;
- `/next` clona `Home`;
- `/next/centro-controllo` clona `CentroControllo`;
- la versione domain-driven `NextCentroControlloPage` resta disponibile in codice ma non governa la route ufficiale.

## 9. Gap reali della NEXT sul Centro di Controllo

1. **Ambiguita architetturale tra clone fedele e pagina reinterpretata**
   - La route ufficiale usa il clone fedele.
   - Nel repo esiste pero una seconda pagina `NextCentroControlloPage` che racconta un'altra grammatica funzionale.
   - Rischio: future patch potrebbero scambiare la reinterpretazione per il clone 1:1.

2. **Formula documentale `Home = Centro di Controllo` non allineata al runtime reale**
   - Nel repo madre e nella NEXT attuale le due superfici restano separate.
   - Rischio: clonazione successiva fatta su presupposto sbagliato.

3. **Copertura D10 non equivalente al modulo madre dedicato**
   - `nextCentroControlloDomain.ts` copre alert/scadenze/sessioni/asset location.
   - Non copre l'intera grammatica del modulo dedicato `CentroControllo` madre.

4. **Report rifornimenti del modulo dedicato non sostituibile con il solo reader D10**
   - La madre usa un merge diretto `@rifornimenti` + `@rifornimenti_autisti_tmp`.
   - Questa logica non e contenuta nel perimetro D10 puro.

5. **Convergenza madre con Home non ancora risolta in modo esplicito**
   - La NEXT clona entrambe le superfici.
   - Manca un ordine di consolidamento dichiarato che distingua clone fedele da eventuale convergenza futura.

## 10. Rischi tecnici e dati sporchi

1. **Doppio canale rifornimenti**
   - `@rifornimenti` e `@rifornimenti_autisti_tmp` convivono.
   - La madre deduplica con euristiche, non con identita sempre affidabile.

2. **Shape storage non uniforme**
   - `unwrapList` deve gestire array diretti, `items`, `value.items`, `value`.
   - Questo vale sia nel Centro di Controllo sia nei moduli collegati.

3. **Parsing date permissivo**
   - `parseDateFlexible` accetta stringhe, numeri, timestamp Firestore e formati misti.
   - Una clonazione cieca puo ereditare casi borderline o ordinamenti non robusti.

4. **Filtro targa accoppiato male**
   - Il filtro targa della tab rifornimenti influenza anche `PRIORITA OGGI`.
   - Il coupling e reale ma poco visibile in UI.

5. **Campi stato/letta non uniformi**
   - Segnalazioni e richieste usano combinazioni `stato` + `letta`.
   - Il Centro di Controllo compensa con logica locale, non con contratto dati forte.

6. **Checklist controlli con shape aperta**
   - I `KO` dipendono dalle chiavi presenti in `check`.
   - Non esiste un set rigido dimostrato nel modulo dedicato.

7. **Incoerenza documentazione/runtime**
   - Il target documentale dice spesso `Home = Centro di Controllo`.
   - Il runtime reale mostra due superfici distinte e parzialmente sovrapposte.

8. **Letture dirette legacy**
   - Il modulo madre dedicato usa ancora letture dirette Firestore/storage, non un facade dominio unico.
   - Una clonazione cieca di questa logica dentro la NEXT pulita sarebbe pericolosa se non distinta dal clone fedele.

## 11. Cosa va clonato 1:1

Va clonato 1:1, se l'obiettivo e la fedelta alla madre dedicata `CentroControllo`:
- header con ritorno a `Gestione Operativa`;
- blocco `PRIORITA OGGI` con score, ordinamento e click-to-scroll;
- ordine e naming delle 5 tab;
- summary card e contatori di ciascuna tab;
- filtri reali di ciascun blocco;
- tab `Report rifornimenti` con doppia sorgente e merge;
- colonna doppia `Controlli KO/OK`;
- toggle `Solo nuove` di segnalazioni e richieste, attivo di default;
- workflow `Anteprima PDF` per manutenzioni e rifornimenti;
- distinzione tra pagina dedicata `CentroControllo` e `Home`.

## 12. Cosa NON va reinterpretato

Non va reinterpretato:
- il modulo dedicato `CentroControllo` come se fosse gia la `Home` estesa;
- il report rifornimenti come semplice badge o contatore;
- i feed autisti come unico blocco generico di alert;
- la pagina dedicata come cockpit D10-only senza i 5 blocchi madre;
- il clone fedele `/next/centro-controllo` come shell concettuale generica;
- la presenza di quick link cross-modulo come requisito della pagina madre dedicata: nel repo reale sono soprattutto su `Home`.

## 13. Cosa resta `DA VERIFICARE`

- se il business vuole davvero convergere `Home` e `CentroControllo` in una sola superficie finale oppure mantenere due superfici con ruoli diversi;
- se esistono entrypoint menu/ruolo ulteriori verso `/centro-controllo` oltre a quelli verificati in `App.tsx` e `GestioneOperativa.tsx`;
- se il flusso PDF rifornimenti/manutenzioni abbia vincoli di layout business non deducibili dal solo audit del codice chiamante;
- se il dominio D10 della NEXT debba restare support domain interno oppure diventare la futura base di una superficie nuova distinta dal clone 1:1.

## 14. Proposta di ordine corretto per clonazione NEXT del Centro di Controllo

1. **Congelare la verita runtime**
   - Trattare `src/pages/CentroControllo.tsx` come fonte primaria del modulo dedicato.
   - Trattare `src/pages/Home.tsx` come superficie separata, non come sinonimo automatico.

2. **Confermare la route ufficiale clone**
   - Mantenere `/next/centro-controllo` sul wrapper `NextCentroControlloClonePage` finche il clone 1:1 resta l'obiettivo.

3. **Separare clone fedele da reinterpretazione**
   - `NextCentroControlloPage.tsx` puo restare laboratorio / shell / reader surface, ma non va venduta come clone del modulo madre dedicato.

4. **Clonare prima i blocchi veri del modulo dedicato**
   - Manutenzioni programmate
   - Report rifornimenti
   - Segnalazioni autisti
   - Controlli KO/OK
   - Richieste attrezzature

5. **Solo dopo aprire il tema convergenza con Home**
   - Eventuali unificazioni con alert, quick link, sessioni, rimorchi o D10 vanno trattate come fase successiva e dichiarata, non come "clone" del modulo dedicato.

6. **Usare il domain layer NEXT come supporto, non come surrogato del clone**
   - `nextCentroControlloDomain.ts` e utile per normalizzazione e letture pulite.
   - Non sostituisce da solo la grammatica della pagina madre dedicata.

## Tabella finale secca

| Blocco madre | File madre | Sorgente dati | Stato NEXT | Azione richiesta | Rischio | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Header + ritorno a Gestione Operativa | `src/pages/CentroControllo.tsx` | nessuna | Coperto davvero su `/next/centro-controllo` | Mantenere clone 1:1 | Basso | Il wrapper clone intercetta solo il back |
| Priorita oggi | `src/pages/CentroControllo.tsx` | derivato da `@mezzi_aziendali`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@richieste_attrezzature_autisti_tmp` | Coperto sul clone fedele, non equivalente nella pagina D10 | Non sostituire con alert D10-only | Medio | Score e click-to-scroll sono parte della grammatica madre |
| Manutenzioni programmate | `src/pages/CentroControllo.tsx` | `@mezzi_aziendali` | Coperto davvero sul clone fedele | Preservare status e PDF selezione | Medio | Dipende dai campi manutenzione scritti in `Mezzi.tsx` |
| Report rifornimenti mensili | `src/pages/CentroControllo.tsx` | `@rifornimenti` + `@rifornimenti_autisti_tmp` | Coperto davvero sul clone fedele; non coperto da `NextCentroControlloPage` | Non perdere il merge dossier/tmp | Alto | Dupliche e completamento km/costo sono logica critica |
| Segnalazioni autisti | `src/pages/CentroControllo.tsx` | `@segnalazioni_autisti_tmp` | Coperto davvero sul clone fedele; parziale nella pagina D10 | Mantenere tabella e toggle `Solo nuove` | Medio | Stato/letta sporchi |
| Controlli KO/OK | `src/pages/CentroControllo.tsx` | `@controlli_mezzo_autisti` | Coperto davvero sul clone fedele; parziale nella pagina D10 | Mantenere doppia colonna KO/OK | Medio | `check` ha shape aperta |
| Richieste attrezzature | `src/pages/CentroControllo.tsx` | `@richieste_attrezzature_autisti_tmp` | Coperto davvero sul clone fedele; assente come blocco dedicato nella pagina D10 | Mantenere tabella e default `Solo nuove` | Medio | Feed autisti separato, stato non uniforme |
| Preview PDF | `src/pages/CentroControllo.tsx` + `src/components/PdfPreviewModal.tsx` | `pdfEngine` + `pdfPreview` | Coperto davvero sul clone fedele | Non degradare a placeholder | Medio | Solo preview/share/download, nessun workflow business |
| Home allargata | `src/pages/Home.tsx` | `@alerts_state`, `@autisti_sessione_attive`, `@storico_eventi_operativi`, feed autisti | Coperta su `/next`, ma distinta | Non confonderla col modulo dedicato | Alto | Punto di incoerenza principale tra documentazione e runtime |
| Reinterpretazione D10 | `src/next/NextCentroControlloPage.tsx` | `src/next/domain/nextCentroControlloDomain.ts` | Esiste ma non governa la route ufficiale | Tenerla separata dal clone 1:1 | Alto | E una pagina diversa, non la controparte fedele del modulo madre dedicato |
