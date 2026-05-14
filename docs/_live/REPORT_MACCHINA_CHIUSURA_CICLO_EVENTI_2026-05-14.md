# REPORT MACCHINA CHIUSURA CICLO EVENTI - 2026-05-14

> Report finale PROMPT 34.
> Obiettivo: chiudere il ciclo segnalazione/controllo/manutenzione quando un evento successivo, oggi cambio gomme, risolve il problema.
> Firestore non modificato durante il prompt. Le scritture avverranno solo da UI runtime o da script one-shot lanciato manualmente.

## 1. Architettura stati

### @manutenzioni

- `daFare`: manutenzione aperta.
- `programmata`: manutenzione aperta pianificata.
- `eseguita`: manutenzione eseguita classica.
- `chiusa_da_evento`: manutenzione aperta chiusa da un evento esterno tracciato.

Campi tracciabilita':
- `chiusuraDi`: tipo evento, per esempio `gomme_evento`.
- `chiusuraRefId`: id del record evento.
- `chiusuraData`: timestamp della chiusura.

### @segnalazioni_autisti_tmp

- `aperta` / assente: segnalazione ancora gestibile.
- `importata`: stato storico gia' esistente.
- `chiusa`: segnalazione chiusa da evento.

### @controlli_mezzo_autisti

- stato assente o legacy: controllo leggibile come prima.
- `chiusa`: controllo KO chiuso da evento.
- I controlli con `chiuso === true` restano compatibili.

## 2. Writer e barrier

Nuovo writer:
- `src/next/writers/nextChiusuraEventoWriter.ts`

Export:
- `chiudiManutenzioneDaEvento(idManutenzione, tipoEvento, idEvento)`
- `chiudiSegnalazioneDaEvento(idSegnalazione, tipoEvento, idEvento)`
- `chiudiControlloDaEvento(idControllo, tipoEvento, idEvento)`

Nuovo scope barrier:
- `next_chiusura_da_evento_write_scope`

Collection autorizzate nello scope:
- `@manutenzioni`
- `@segnalazioni_autisti_tmp`
- `@controlli_mezzo_autisti`

## 3. Flusso import cambio gomme

Pagina:
- `/next/autisti-inbox`

File:
- `src/next/autistiInbox/NextAutistiAdminNative.tsx`
- `src/next/components/NextImportGommeChiusuraModal.tsx`

Flusso:
1. Admin clicca `IMPORTA` su un record `@cambi_gomme_autisti_tmp`.
2. Prima della scrittura su `@gomme_eventi` si apre la modale multi-select.
3. La modale legge manutenzioni, segnalazioni e controlli aperti con keyword gomme per la stessa targa.
4. I match entro 30 giorni sono nella sezione `Suggerite entro 30 giorni` e sono pre-selezionati.
5. Gli altri match aperti sono nella sezione `Altre aperte` e non sono pre-selezionati.
6. Alla conferma viene creato il record `@gomme_eventi`.
7. Le righe selezionate vengono chiuse con `chiusuraDi = "gomme_evento"` e `chiusuraRefId = id @gomme_eventi`.
8. Il record tmp gomme viene marcato `importato`.

## 4. Badge e tooltip

Superfici aggiornate:
- Manutenzioni: ultimi interventi e dettaglio.
- Centro Controllo Archivio Storico: riga manutenzione.
- Dossier Mezzo: sezione manutenzioni e dettaglio.

Badge:
- `CHIUSA DA EVENTO`, grigio.

Tooltip:
- `Chiusa dal cambio gomme del <data>`

## 5. Filtri e KPI

Comportamento nuovo:
- `chiusa_da_evento` non appare nella tab `Da fare`.
- `chiusa_da_evento` non conta nei KPI di manutenzioni aperte/urgenti.
- `chiusa_da_evento` resta visibile nello storico e nell'archivio.
- Archivio Storico ha filtro stato `Chiusa da evento`.
- Dossier Mezzo colloca lo stato nella sezione chiusa, con badge distinto.

## 6. Chat IA

La chat IA continua a leggere `@manutenzioni`.

Regole:
- `chiusa_da_evento` non e' una manutenzione da fare.
- `chiusa_da_evento` non e' una eseguita classica.
- Nelle risposte va descritta come chiusa da evento quando i campi `chiusura*` sono disponibili.

## 7. Script una-tantum retroattivo

Script creato:
- `scripts/oneoff/chiudi-dafare-gomme-orfana-2026-05-14.cjs`

Record target:
- daFare: `from-lavoro-a5ba1512-2961-40a9-9c00-a27b6559bef2`
- evento gomme: `554348b3-f6ec-40e8-a861-6873af7cce56`
- targa: `TI298409`
- distanza: 4 giorni

Uso:

```powershell
$env:DRY_RUN='true'; node scripts/oneoff/chiudi-dafare-gomme-orfana-2026-05-14.cjs
$env:DRY_RUN='false'; node scripts/oneoff/chiudi-dafare-gomme-orfana-2026-05-14.cjs
```

Lo script non e' stato eseguito nel PROMPT 34.

## 7-bis. Aggancio/Sgancio retroattivo

Motivazione PROMPT 36:
- la modale multi-select del PROMPT 34 copre solo il caso `import nuovo da @cambi_gomme_autisti_tmp`;
- se il cambio gomme e' gia' stato importato in `@gomme_eventi`, serve una chiusura retroattiva manuale dal dettaglio del record aperto.

Superfici di accesso:
- `/next/manutenzioni`, tab dettaglio/mappa: dettaglio manutenzione da fare o programmata;
- `/next/autisti-inbox`, modale dettaglio segnalazione: segnalazioni gomme con stato `aperta` o `in_carico`;
- `/next/autisti-inbox`, modale dettaglio controllo: controlli KO gomme con stato `aperta` o `in_carico`.

Bottoni:
- `Aggancia evento`: visibile solo sui record aperti di dominio gomme;
- `Sgancia evento`: visibile solo su record gia' chiusi da `chiusuraDi = "gomme_evento"`.

Flusso aggancio:
1. L'admin apre il dettaglio del record aperto.
2. Clicca `Aggancia evento`.
3. La modale `NextAggancioEventoModal` legge `@gomme_eventi` per stessa targa con data successiva alla data del record.
4. Gli eventi entro 30 giorni entrano in `Suggeriti` e il primo e' preselezionato.
5. Gli eventi oltre 30 giorni entrano in `Altri`.
6. Conferma scrive lo stato di chiusura e i campi `chiusuraDi`, `chiusuraRefId`, `chiusuraData`.

Nota fix 2026-05-14 PROMPT 38a:
- parsing data centralizzato in `src/next/helpers/parseRobusto.ts` per gestire i formati presenti nei record: ISO `yyyy-mm-dd`, ISO esteso, legacy `dd/mm/yyyy`, timestamp millisecondi, `Date` e Firestore Timestamp;
- bug originale: le daFare `from-lavoro-*` avevano `data` in formato ISO, non riconosciuta dal parser legacy del chiamante; il fallback `Date.now()` rendeva la data riferimento successiva agli eventi gomme gia' importati ed escludeva il cambio del 12 maggio dal filtro.

Flusso sgancio:
1. L'admin apre un record chiuso da cambio gomme.
2. Clicca `Sgancia evento`.
3. Conferma il ripristino.
4. Il writer valida che `chiusuraDi === "gomme_evento"`.
5. Il record torna aperto (`daFare` per manutenzioni, `aperta` per segnalazioni/controlli) e i campi `chiusura*` vengono azzerati.

Nota progettuale:
- `Aggancia/Sgancia evento` e' il caso parallelo di `Completa`: `Completa` crea un evento sul record, `Aggancia` collega un evento gia' esistente altrove.
- Il helper `src/next/helpers/eventiCompatibili.ts` oggi supporta solo `gomme_evento`; quando esisteranno collection evento dedicate per olio, freni o altri cicli, lo stesso punto verra' esteso con registry esplicito.
- Lo sgancio di eventi diversi da `gomme_evento` e' volutamente bloccato finche' Giuseppe non autorizza un caso specifico.

## 7-ter. Visualizzazione storia + sparizione satellite

Decisione PROMPT 38d:
- una manutenzione `chiusa_da_evento` collegata a `gomme_evento` e' un record satellite, non una voce storica autonoma;
- nelle liste storiche normali compare solo il record evento principale, mentre il satellite resta leggibile tramite dettaglio diretto e tramite filtro esplicito `Chiusa da evento` nell'Archivio Storico;
- se l'utente esegue `Sgancia evento`, il record torna `daFare` o aperto e riappare nelle liste operative.

Implementazione:
- `src/next/helpers/storiaRecord.ts` centralizza la costruzione della storia leggibile del record;
- `src/next/components/StoriaRecordTimeline.tsx` renderizza la timeline compatta nelle superfici UI;
- `/next/manutenzioni`: la sidebar `Storico Manutenzioni` nasconde i satelliti, ma il dettaglio diretto resta disponibile; se il record evento ha un satellite correlato, il dettaglio mostra la storia completa;
- Dossier Mezzo: le liste `Eseguite` e `Storico manutenzioni` non duplicano piu' i satelliti `chiusa_da_evento`;
- Centro Controllo / Archivio Storico: vista normale senza satelliti, filtro stato `Chiusa da evento` ancora disponibile per audit e sgancio;
- PDF Quadro: i record `chiusa_da_evento` sono separati nella sezione `Manutenzioni risolte tramite eventi esterni`, con origine, data chiusura e testo `Risolto da`.

Regola di lettura:
- il record satellite non viene cancellato da Firestore;
- la sparizione e' solo una proiezione UI/read-model per evitare il doppio racconto della stessa storia.

## 8. Checklist gate manuale

- [ ] Aprire `/next/autisti-inbox`.
- [ ] Entrare nella tab gomme.
- [ ] Cliccare `IMPORTA` su un cambio gomme non importato.
- [ ] Verificare apertura modale chiusura ciclo.
- [ ] Verificare sezione `Suggerite entro 30 giorni`.
- [ ] Verificare default selezionato sui match suggeriti.
- [ ] Verificare sezione `Altre aperte` non pre-selezionata.
- [ ] Confermare con almeno un elemento selezionato.
- [ ] Verificare feedback `Cambio gomme creato`.
- [ ] Aprire `/next/manutenzioni`: la manutenzione chiusa non deve essere in tab Da fare.
- [ ] Aprire Archivio Storico: filtro `Chiusa da evento` deve mostrare la riga.
- [ ] Passare sul badge: tooltip con data evento.
- [ ] Aprire Dossier Mezzo della targa: il satellite `chiusa_da_evento` non deve comparire come voce separata nelle manutenzioni eseguite.
- [ ] Aprire `/next/manutenzioni` dettaglio evento: timeline leggibile con segnalazione, presa in carico se presente, e risoluzione da cambio gomme.
- [ ] Archivio Storico: vista normale senza satellite, filtro `Chiusa da evento` mostra il satellite per audit.
- [ ] PDF Quadro: sezione `Manutenzioni risolte tramite eventi esterni` presente quando ci sono record `chiusa_da_evento` nel periodo.
- [ ] Verificare che KPI manutenzioni aperte non aumenti.
- [ ] Eseguire script one-shot prima in dry run.
- [ ] Se dry run OK, eseguire script reale.
- [ ] Verificare visivamente la daFare `TI298409` come `CHIUSA DA EVENTO`.
- [ ] Aprire `/next/manutenzioni` e selezionare una manutenzione gomme `daFare`: bottone `Aggancia evento` visibile.
- [ ] Confermare aggancio verso un cambio gomme esistente: il record esce dalla tab `Da fare` e compare come `CHIUSA DA EVENTO`.
- [ ] Sullo stesso record chiuso: bottone `Sgancia evento` visibile, conferma ripristina `daFare`.
- [ ] Aprire una segnalazione gomme aperta in `/next/autisti-inbox`: bottone `AGGANCIA EVENTO` visibile nel modale edit.
- [ ] Aprire un controllo KO gomme aperto in `/next/autisti-inbox`: bottone `AGGANCIA EVENTO` visibile nel modale edit.
- [ ] Verificare che `SGANCIA EVENTO` appaia solo sui record con `chiusuraDi = gomme_evento`.

## 9. Debito residuo

- La chiusura evento e' implementata per cambio gomme. La stessa macchina puo' supportare eventi futuri (`olio_evento`, `manutenzione_eseguita`) senza cambiare schema.
- Lo script one-shot e' intenzionalmente manuale.
- Il record orfano senza match `TI280132` resta aperto: nessun evento gomme successivo corrispondente e' stato trovato nel discovery.

## 10. Stato Firestore

Durante PROMPT 34:
- zero scritture Firestore eseguite;
- `@lavori` non toccato;
- `@gomme_eventi` schema non modificato;
- `@cambi_gomme_autisti_tmp` schema non modificato.
