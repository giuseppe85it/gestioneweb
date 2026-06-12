# Piano Flussi e UI Gomme in Manutenzioni NEXT

## Summary

Preparare due execution future separate, senza nuovo modulo e senza nuova route:

1. **Logica import gomme verso `@manutenzioni`**: mantenere App Autisti, Autisti Inbox/Admin, `@cambi_gomme_autisti_tmp`, `@gomme_eventi` e chiusura candidati come oggi, aggiungendo solo la creazione/aggancio della manutenzione ufficiale nello schema gomme gia esistente.
2. **UI Dettaglio Manutenzioni gomme**: migliorare solo il Dettaglio embedded di Manutenzioni quando il record e' gomme, mostrando meglio ordinario/straordinario, assi, km, motivo, quantita, marca se disponibile, autista/segnalato da e origine.

Questo piano e' documentale: non implementa codice, non crea route, non crea moduli e non modifica runtime.

## Fatti Da Non Contraddire

- Lo schema gomme in `@manutenzioni` esiste gia: `gommeInterventoTipo`, `assiCoinvolti`, `gommePerAsse`, `gommeStraordinario`, piu campi generici `targa`, `data`, `dataEsecuzione`, `stato`, `descrizione`, `km`, `fornitore`, `segnalatoDa`, `origineRef*`, `chiusura*`.
- L'import attuale da Autisti Admin/InBox e' **PARZIALE**: puo chiudere candidati gia esistenti, ma non crea una nuova manutenzione ufficiale in `@manutenzioni`.
- Dossier legge `@manutenzioni`, `@cambi_gomme_autisti_tmp` e `@gomme_eventi`, ma non promuove eventi esterni a manutenzioni.
- UI da migliorare: solo Dettaglio Manutenzioni gomme.
- App Autisti resta sorgente dati e riferimento visuale/funzionale, non runtime da spostare.
- Madre legacy resta solo confronto: non usare `src/pages/Manutenzioni.tsx`, `src/autistiInbox/AutistiAdmin.tsx`, `src/components/AutistiEventoModal.tsx` come runtime.

## Piano Logica Flussi

Flusso target:

```text
App Autisti
  -> @cambi_gomme_autisti_tmp
Autisti Inbox / Admin
  -> import esistente
  -> @gomme_eventi come oggi
  -> chiusura candidati come oggi
  -> in piu: creazione/aggancio manutenzione ufficiale in @manutenzioni
Manutenzioni
  -> Dettaglio mostra il record gomme ufficiale
Dossier
  -> continua a leggere manutenzioni + eventi esterni
```

Per ogni passaggio:

- App Autisti: scrive evento tmp in `@cambi_gomme_autisti_tmp`; resta invariata.
- Autisti Inbox/Admin: resta il punto operativo di import; non si sposta il flusso.
- Import: continua ad appendere `@gomme_eventi` e a chiudere candidati gia esistenti.
- Nuova parte futura: creare o agganciare una manutenzione ufficiale in `@manutenzioni` usando lo schema gomme esistente.
- Manutenzioni: legge e mostra il record ufficiale nel Dettaglio.
- Dossier: resta reader, non writer.

Vietato cambiare:

- schema dati gomme;
- ruolo di App Autisti;
- ruolo di Autisti Inbox/Admin;
- Dossier come reader;
- madre legacy;
- route e moduli.

## Decisione Tecnica Per Il Writer

Decisione consigliata: **Opzione B, writer piccolo dedicato chiamato da `confirmImportGommeRecord`**.

### Opzione A - Estendere direttamente `confirmImportGommeRecord`

Pro:

- meno file iniziali;
- punto esatto del flusso gia esistente;
- facile seguire la sequenza import -> evento -> chiusure.

Contro:

- aumenta una funzione gia grande;
- mapping evento -> manutenzione meno isolato;
- idempotenza e test piu fragili;
- maggiore rischio di mescolare UI/orchestrazione e logica writer.

Rischio: **ELEVATO / EXTRA ELEVATO**.

File da toccare:

- `src/next/autistiInbox/NextAutistiAdminNative.tsx`;
- test collegati all'import gomme;
- `src/utils/cloneWriteBarrier.ts` se servono nuove deroghe.

Test necessari:

- import evento nuovo;
- import con candidato;
- import doppio;
- blocco barrier fuori scope;
- build.

Effetto barrier/scope:

- comunque richiede una deroga esplicita;
- rischio di aprire troppo direttamente la superficie admin.

Rischio duplicati:

- alto se l'idempotenza resta dentro la funzione UI/orchestratore.

### Opzione B - Writer piccolo dedicato chiamato dal flusso esistente

Pro:

- `confirmImportGommeRecord` resta orchestratore;
- mapping evento -> manutenzione isolato;
- test unitari piu chiari;
- idempotenza centralizzata;
- riuso controllato di `saveNextManutenzioneBusinessRecord`;
- scope barrier piu facile da motivare.

Contro:

- un file writer in piu;
- richiede disegno esplicito dell'interfaccia writer;
- richiede test nuovi.

Rischio: **EXTRA ELEVATO**, ma piu governabile dell'opzione A.

File da toccare:

- `src/next/autistiInbox/NextAutistiAdminNative.tsx` solo per chiamare il writer;
- nuovo writer piccolo in `src/next/writers/*`;
- test writer/import;
- `src/utils/cloneWriteBarrier.ts` per scope dedicato.

Test necessari:

- mapping ordinario;
- mapping straordinario;
- idempotenza;
- candidato esistente;
- nessun candidato;
- km sospetto;
- barrier.

Effetto barrier/scope:

- creare scope dedicato e limitato alle key necessarie.

Rischio duplicati:

- gestibile con idempotenza per id evento/origine.

Conclusione: usare **Opzione B**.

## Piano Barrier / Scope

Stato attuale:

- `CHIUSURA_DA_EVENTO` consente `@manutenzioni`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`.
- `CHIUSURA_DA_EVENTO` non consente `@gomme_eventi` e `@cambi_gomme_autisti_tmp`.
- `/next/autisti-admin` e' bloccato da `shouldBlockAdminMutations()`.
- `storageSync.setItemSync` inghiotte `CloneWriteBlockedError`, quindi una scrittura bloccata puo fallire silenziosamente.

Piano futuro:

- creare uno scope dedicato per ponte import gomme;
- limitare le key al minimo:
  - `@manutenzioni`;
  - `@gomme_eventi`;
  - `@cambi_gomme_autisti_tmp`;
  - eventuali `@segnalazioni_autisti_tmp` / `@controlli_mezzo_autisti` solo per chiusure gia previste;
- non aprire scope generici;
- non rendere tutta `/next/autisti-admin` scrivente;
- evitare scritture silenziose: il nuovo writer deve restituire esito esplicito e fallire visibilmente se il barrier blocca.

Decisione aperta per Giuseppe:

- se il writer deve partire da `/next/autisti-admin`, va gestito il blocco `shouldBlockAdminMutations`;
- alternativa piu sicura: agganciare il ponte a un path gia governato o aprire solo l'azione import gomme con scope dedicato.

## Piano Dati / Mapping Evento -> Manutenzione

Mapping futuro:

- `targetTarga` -> `targa`
- `data` -> `data` / `dataEsecuzione`
- `km` -> `km` e/o `gommePerAsse[].kmCambio`, solo se confermato/plausibile
- `asseId` -> `assiCoinvolti` o `gommeStraordinario.asseId`
- `tipo` / `gommeIds` / `rotazioneText` -> `descrizione`
- `marca` -> descrizione o visualizzazione, non nuovo campo raw
- `autista.nome` / `badge` -> `segnalatoDa`
- id evento -> `origineRefId` / `chiusuraRefId` dove coerente con il flusso
- key evento -> `origineRefKey`

Ordinario:

- se evento descrive cambio gomme per asse e il tipo e' trattabile come ordinario, scrivere:
  - `gommeInterventoTipo="ordinario"`;
  - `assiCoinvolti`;
  - `gommePerAsse`.

Straordinario:

- se evento descrive riparazione, foratura, valvola, gomma singola o intervento non pianificato, scrivere:
  - `gommeInterventoTipo="straordinario"`;
  - `gommeStraordinario`.

Dati mancanti:

- non inventare;
- lasciare campo assente/null;
- preservare il contenuto disponibile in descrizione.

Km sospetti:

- non scrivere `km` ufficiale se non plausibile o non confermato;
- riportare il valore nel testo solo se serve traccia, marcandolo come valore evento non salvato come km ufficiale.

Marca:

- non creare campo raw nuovo;
- se disponibile, conservarla in descrizione o visualizzarla da origine/evento.

Duplicati:

- idempotenza per id evento;
- se evento gia importato, non creare nuova manutenzione.

Candidato gia esistente:

- chiudere/agganciare candidato senza duplicare manutenzione.

Nessun candidato esistente:

- creare manutenzione ufficiale nuova in `@manutenzioni`.

## Piano Test Logica Flussi

Test futuri minimi:

1. Evento nuovo senza candidato -> crea una manutenzione gomme ufficiale.
2. Evento con candidato manutenzione aperta -> aggancia/chiude senza duplicare.
3. Evento gia importato -> non crea doppione.
4. Evento con km sospetto -> non scrive km ufficiale senza regola.
5. Evento straordinario -> crea `gommeStraordinario`.
6. Evento ordinario -> crea `gommePerAsse`.
7. Dossier legge dopo import.
8. Dettaglio Manutenzioni mostra dopo import.
9. Barrier blocca fuori scope.
10. `npm run build` verde.

## Piano UI Dettaglio Manutenzioni Gomme

Non creare modulo. Non creare route. Intervenire solo dentro `NextMappaStoricoPage` / Dettaglio embedded Manutenzioni.

La UI deve prendere spunto dalla UI gomme dell'app autisti, ma essere piu leggibile nel contesto storico manutenzioni.

Prevedere:

- blocco intestazione gomme;
- badge `ORDINARIO` / `STRAORDINARIO`;
- targa;
- data;
- stato;
- card assi;
- card km;
- card motivo;
- card quantita;
- card marca, solo se disponibile;
- card autista/segnalato da;
- card origine evento/segnalazione;
- card fornitore/officina;
- gestione dato mancante;
- distinzione tra record ufficiale in `@manutenzioni` e dato evento esterno.

Regole UI:

- se un dato manca: mostrare `non indicato`;
- non inventare marca o km;
- non mostrare eventi esterni come storico ufficiale se non esiste record in `@manutenzioni`;
- per record manuale: origine `manuale` o `non indicata`, secondo dati disponibili.

## Mock Testuale UI Da Far Approvare

### Dettaglio gomme ordinario

```text
[STORICO UFFICIALE] [ORDINARIO]
TI 123456 · 12/05/2026 · Eseguita

Assi aggiornati
- 1° asse: data cambio 12/05/2026 · km 383482
- 2° asse: data cambio 12/05/2026 · km 383482

Dati intervento
Km: 383482
Marca: Kumho
Fornitore: Valtellina Pneumatici
Segnalato da: Sandro Calabrese
Origine: evento gomme / app autisti
```

### Dettaglio gomme straordinario

```text
[STORICO UFFICIALE] [STRAORDINARIO]
TI 282780 · 26/05/2026 · Eseguita

Evento straordinario
Motivo: sostituzione valvola lato sx
Asse: 3° asse
Quantità: non indicata

Dati intervento
Km: non salvato / non indicato
Marca: non indicata
Segnalato da: Sandro Calabrese
Origine: evento gomme / app autisti
```

### Variante dato mancante

```text
[STORICO UFFICIALE] [ORDINARIO]
TI 000000 · data non indicata · Da fare

Assi aggiornati
- 1° asse: data cambio non indicata · km non indicato

Dati intervento
Marca: non indicata
Fornitore: non indicato
Segnalato da: non indicato
Origine: non indicata
```

### Variante record creato manualmente da Manutenzioni

```text
[STORICO UFFICIALE] [STRAORDINARIO]
TI 000000 · 08/06/2026 · Eseguita

Evento straordinario
Motivo: foratura / danno
Asse: posteriore
Quantità: 1

Dati intervento
Km: 123456
Fornitore: officina indicata nel record
Segnalato da: inserimento manuale Manutenzioni
Origine: manuale
```

## Piano Implementazione Futura A Step

### Step 1 - Execution writer/import

Obiettivo:

- aggiungere ponte evento gomme -> manutenzione ufficiale in `@manutenzioni`.

Whitelist probabile:

- `src/next/autistiInbox/NextAutistiAdminNative.tsx`;
- nuovo writer piccolo in `src/next/writers/*`;
- test writer/import;
- `src/utils/cloneWriteBarrier.ts`.

Rischio:

- **EXTRA ELEVATO**.

Test:

- test 1-10 del piano logica flussi.

Criteri accettazione:

- evento nuovo crea una sola manutenzione;
- candidato esistente non duplica;
- evento gia importato non duplica;
- barrier fuori scope blocca;
- build verde.

### Step 2 - Execution UI Dettaglio gomme

Obiettivo:

- migliorare solo il blocco dettaglio gomme in Manutenzioni.

Whitelist probabile:

- `src/next/NextMappaStoricoPage.tsx`;
- CSS NEXT gia pertinente solo se autorizzato in prompt execution;
- eventuali test render.

Rischio:

- **NORMALE**.

Test:

- record ordinario;
- record straordinario;
- dati mancanti;
- record manuale;
- record da evento;
- record non gomme invariato;
- build verde.

Criteri accettazione:

- mock approvato rispettato;
- nessun dato inventato;
- nessuna regressione non-gomme.

### Step 3 - Audit finale

Verificare:

- nessun modulo nuovo;
- nessuna route nuova;
- Dossier resta reader;
- madre non toccata;
- idempotenza import;
- Dettaglio mostra dati ufficiali;
- build/test verdi.

## File Da Toccare / Non Toccare In Futuro

### File candidati futuri

- `src/next/autistiInbox/NextAutistiAdminNative.tsx`
- `src/next/writers/*` nuovo writer dedicato
- `src/utils/cloneWriteBarrier.ts`
- `src/next/NextMappaStoricoPage.tsx`
- test mirati in `src/next/**/__tests__/` o percorso test esistente coerente

### File da non toccare

- `src/pages/Manutenzioni.tsx`
- `src/autistiInbox/AutistiAdmin.tsx`
- `src/components/AutistiEventoModal.tsx`
- Dossier come writer
- App Autisti salvo bug separato
- nuove route
- nuovi moduli
- schema dati nuovo

## Rischi E Decisioni Aperte

Rischi:

- writer/import: **EXTRA ELEVATO**;
- barrier/scope: **EXTRA ELEVATO**;
- duplicati: **ELEVATO**;
- km sospetti: **ELEVATO**;
- perdita marca/autista: **ELEVATO**;
- UI dettaglio: **NORMALE**;
- madre/legacy: **ELEVATO** se toccata, quindi vietato.

Decisioni da approvare prima della patch:

- dove far partire esattamente il writer;
- cosa fare con `/next/autisti-admin` read-only;
- regola per km sospetti;
- regola per marca;
- idempotenza evento gia importato;
- visualizzazione origine;
- approvazione mock UI.

## Verdetto Del Piano

1. Si puo procedere senza altro audit? **SI**.
2. Serve modulo nuovo? **NO**.
3. Serve route nuova? **NO**.
4. Prima execution consigliata: **logica flussi import**, poi UI dettaglio; oppure UI prima solo per approvazione visuale.
5. UI da vedere prima della patch: **SI**.
6. File piano creato: `docs/plan/PIANO_FLUSSI_UI_GOMME_MANUTENZIONI_NEXT_2026-06-08.md`.
7. Rischio complessivo: **EXTRA ELEVATO** per import/writer, **NORMALE** per UI dettaglio.
