# AUDIT — STORIA SEGNALAZIONE / MANUTENZIONE / CONTROLLO CHIUSI — SUPERFICI NEXT

> Data: 2026-05-14 · Autore: Claude Code · Metodo: lettura statica del codice `src/next/`.
> Scopo: mappare ogni superficie del NEXT dove l'utente vede la *storia* di un record
> (segnalazione / controllo / manutenzione) che e stato chiuso, con qualunque modalita.
> Read-only: zero modifiche a codice. Regola "Esplorazione prima di asserzione" applicata —
> i punti non verificati nel codice sono marcati `DA VERIFICARE`.

## Sintesi esecutiva

Esiste un helper canonico — `src/next/helpers/storiaRecord.ts` (`getStoriaRecord` +
`formatStoriaRecordInline`) — e un componente canonico — `StoriaRecordTimeline`
(`src/next/components/StoriaRecordTimeline.tsx`) — che producono la storia a 3 segmenti:
*Segnalata/Controllo KO → Presa in carico → Eseguita / Risolta dal <evento>*.

Il componente canonico e usato in **4 superfici sulle manutenzioni**: pannello dettaglio
manutenzione (`NextMappaStoricoPage`), lista Dossier Mezzo, riga compatta ed espansa
dell'Archivio Storico. **Non** e usato per segnalazioni/controlli chiusi: l'Archivio
Storico li renderizza con una frase inline diversa (`renderSegnalazioneExpanded` →
"Chiusa il … da …"). La **lista principale `/next/manutenzioni`** (Dashboard "Ultimi
interventi" e "Manutenzioni operative") **non mostra la storia affatto**: solo un badge
di stato con la storia di chiusura nascosta in un `title` (tooltip al passaggio mouse).

Inoltre `formatChiusuraEventoTipo` / `buildChiusuraDaEventoTitle` sono **duplicati
localmente in 4 file** invece di importare l'export canonico di `storiaRecord.ts`, e
producono la frase di chiusura con date in formati diversi e con verbo diverso ("Chiusa
dal …" nei tooltip/PDF vs "Risolta dal …" nella timeline canonica). La chat IA categorizza
lo stato `chiusa_da_evento` ma non emette nessuna frase-storia narrativa.

Conclusione: la "storia" non e una superficie unica ma una **costellazione di rendering
parziali e divergenti**. Le decisioni aperte per Giuseppe sono in coda.

## A.1 — Superfici trovate

### S1 — Lista `/next/manutenzioni`: "Ultimi interventi" + "Manutenzioni operative"
- **File:riga**: `src/next/NextManutenzioniPage.tsx:2927-2968` (Ultimi interventi, `renderDashboard`); `:2812-2865` (Manutenzioni operative).
- **Componente storia**: nessuno. Badge stato (`getMaintenanceStatoBadgeStyle` + `formatMaintenanceStatoLabel`) con `title={buildChiusuraDaEventoTitle(item)}` (`:2845`, `:2956`).
- **Cosa mostra oggi**: descrizione (snippet), `item.data` raw (`:2942`), misura/fornitore/importo, badge stato ("CHIUSA DA EVENTO" / "ESEGUITA" / "DA FARE"), badge tipo. La storia di chiusura **esiste solo come tooltip** sul badge.
- **Frase storia**: solo nel tooltip → `"Chiusa dal <evento> del <data ora>"` (`buildChiusuraDaEventoTitle`, `:376-381`, usa `formatDateTimeUI`). Nessuna frase visibile a schermo.
- **Differenze**: nessuna timeline, nessuna frase inline, solo badge + tooltip.
- **Stato record coperto**: tutti (`daFare` / `programmata` / `eseguita` / `chiusa_da_evento`); il tooltip compare solo per `chiusa_da_evento`.

### S2 — Pannello dettaglio manutenzione (in `/next/manutenzioni`, vista mappa/dettaglio)
- **File:riga**: `src/next/NextMappaStoricoPage.tsx:868` (`<StoriaRecordTimeline storia={selectedRecordStoria} />`, non-compact); calcolo storia `:328-339`; badge `CHIUSA DA EVENTO` con tooltip `:703-711`.
- **Componente storia**: `StoriaRecordTimeline` (canonico, modalita estesa).
- **Cosa mostra oggi**: titolo intervento, badge "CHIUSA DA EVENTO" (se applicabile, con `title` da `buildChiusuraDaEventoTitle` locale `:150-157`), griglia campi, box descrizione, **poi la timeline a 3 segmenti**.
- **Frase storia**: `"Segnalata da X il GG MM AAAA - Presa in carico … il GG MM AAAA - Risolta dal cambio gomme del GG MM AAAA"` (label da `getStoriaRecord`, date `formatDateUI` = formato a spazi).
- **Particolarita**: se il record selezionato e un satellite, `findSatelliteChiusoDaEventoForRecord` (`:321-326`) collega l'evento gomme reale e lo passa come `eventoRecord` a `getStoriaRecord` — unica superficie che fa questo arricchimento.
- **Stato record coperto**: tutti.

### S3 — Dossier Mezzo: lista manutenzioni / lavori
- **File:riga**: `src/next/NextDossierMezzoPage.tsx:471` (`renderWorkItem` → `<StoriaRecordTimeline … compact />`); badge `:467` con `dossierWorkBadgeTitle` (`:92-99`).
- **Componente storia**: `StoriaRecordTimeline` (canonico, compact).
- **Cosa mostra oggi**: badge stato (label/classe/stile/`title` da helper *locali* `dossierWorkBadge*`), descrizione, riga meta `dettagli` + `item.dataInserimento` raw (`:470`), **poi la timeline compatta**.
- **Frase storia**: identica a S2 nel testo (`getStoriaRecord`), ma compatta.
- **Differenze**: badge con tooltip + timeline; mostra anche `item.dataInserimento` raw a fianco, che puo divergere dalle date nella timeline.
- **Stato record coperto**: tutti; le liste `attesa` / `eseguiti` / `manutenzioni` sono separate (`:458-462`).

### S4 — Archivio Storico CC: riga compatta manutenzione
- **File:riga**: `src/next/centroControllo/archivioStorico/rows/ArchivioRowManutenzione.tsx:169-172` (`<StoriaRecordTimeline … compact />`).
- **Componente storia**: `StoriaRecordTimeline` (canonico, compact) **+ una seconda mini-timeline** nel footer (`:197-210`, classe `archivio-timeline`: "Aperta" → `statoLabel`, con `formatTimelineStamp`).
- **Cosa mostra oggi**: blocco data a sinistra (`formatDateShort` di `ArchivioRowShared`, formato "8 mag / 2026 / 14:30"), foto, targa, chip tipo, **chip stato** con `title` da `statoTitle` locale (`:78-89`), descrizione, **timeline canonica**, fornitore/importo, **footer con seconda timeline Aperta/Stato**.
- **Frase storia**: due in contemporanea — quella canonica (`getStoriaRecord`) e quella del footer ("Aperta <stamp> … <STATO> <stamp>", entrambi con lo *stesso* `timelineStamp`, `:202` e `:208`).
- **Differenze**: e l'unica superficie con **due timeline sovrapposte** per lo stesso record.
- **Stato record coperto**: tutti.

### S5 — Archivio Storico CC: riga espansa
- **File:riga**: `src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx`.
  - manutenzione → `:80-83` `<StoriaRecordTimeline … compact />` (canonico).
  - segnalazione → `:221-243` `renderSegnalazioneExpanded`: blocco "Stato" con `"Chiusa il <formatDateTimeLong> da <chiusaBy>"` oppure `"Stato corrente: <stato>"`.
  - richiesta → `:275-297` `renderRichiestaExpanded`: `"Evasa il <formatDateTimeLong> da <evasaBy>"`.
- **Componente storia**: per le manutenzioni il canonico; per segnalazioni/richieste **una frase inline ad hoc**, NON il componente canonico.
- **Cosa mostra oggi**: manutenzione → descrizione + timeline + dettagli/materiali/gomme/documento. Segnalazione → descrizione + stato di chiusura + eventuale "Manutenzione generata" (`linkedLavoroId`) + foto. Richiesta → testo + stato evasione + foto.
- **Frase storia**: divergente — manutenzione "Segnalata… - Presa in carico… - Risolta dal…"; segnalazione "Chiusa il GG.MM.AAAA · HH:MI da <chiusaBy>"; richiesta "Evasa il GG.MM.AAAA · HH:MI da <evasaBy>".
- **Formato data**: `formatDateTimeLong` locale (`:17-29`) usa `GG.MM.AAAA · HH:MI` (punti), diverso da tutto il resto.
- **Stato record coperto**: manutenzioni tutte; segnalazioni/controlli: distingue solo `chiusa === true` vs "Stato corrente".

### S6 — PDF Quadro manutenzioni: tabella "Manutenzioni risolte tramite eventi esterni"
- **File:riga**: `src/next/NextManutenzioniPage.tsx:2302-2361` (`renderClosedByExternalTable`).
- **Componente storia**: nessuno — tabella `autoTable` dedicata.
- **Cosa mostra oggi**: 4 colonne — **Data origine** (`buildPdfClosedExternalOriginLabel` → nota origine o `formatMaintenancePdfDateLabel`), **Data chiusura** (`formatPdfChiusuraDateLabel` → `formatDateFull` = `GG/MM/AAAA`), **Descrizione** (`buildPdfDescrizione`), **Risolto da** (`buildChiusuraDaEventoTitle(item) ?? "Evento esterno"`).
- **Frase storia**: spezzata su 4 colonne; "Risolto da" contiene `"Chiusa dal <evento> del <data>"`. La nota origine ("Segnalato da X il Y") e in colonna 1 quando presente.
- **Differenze**: e l'unica resa tabellare; verbo "Chiusa dal" (non "Risolta dal"); date in `GG/MM/AAAA` (slash).
- **Stato record coperto**: solo `chiusa_da_evento` (filtro `isPdfClosedByExternalEvent` / `isSatelliteChiusoDaEvento`).

### S7 — Modale "Aggancia evento" (`NextAggancioEventoModal`)
- **File:riga**: `src/next/components/NextAggancioEventoModal.tsx`.
- **Componente storia**: nessuno — e una modale *pre-chiusura*, non mostra la storia di un record gia chiuso.
- **Cosa mostra oggi**: targa + `formatDateTimeUI(record.dataRiferimento)` come riferimento (`:130`); lista eventi gomme candidati con `formatDateTimeUI(evento.data)` + distanza giorni + asse + km (`:107`).
- **Frase storia**: assente per definizione. Mostra solo i candidati da agganciare.
- **Stato record coperto**: record ancora aperti (`daFare` / `programmata` gomme).

### S8 — Modale "Chiudi segnalazioni gomme correlate" (`NextImportGommeChiusuraModal`)
- **File:riga**: `src/next/components/NextImportGommeChiusuraModal.tsx`.
- **Componente storia**: nessuno — modale *pre-chiusura* multi-select.
- **Cosa mostra oggi**: targa; lista candidati (manutenzioni/segnalazioni/controlli aperti gomme) con `subtitle` = tipo + `formatDateTimeUI(timestamp)` + "N gg dal cambio" (`:169-176`, `:299`).
- **Frase storia**: assente. Mostra cosa *sta per* essere chiuso, non la storia di cio che e gia chiuso.
- **Stato record coperto**: record aperti.

### S9 — Chat IA NEXT
- **File:riga**: `src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts:103` (`.filter((item) => item.stato === "chiusa_da_evento")`); type `src/next/chat-ia/sectors/mezzi/chatIaMezziTypes.ts:53`.
- **Componente storia**: nessuno. La chat IA **categorizza** lo stato `chiusa_da_evento` in un bucket separato dalle eseguite, ma **non e stata trovata alcuna frase-storia narrativa** ("Risolta dal cambio gomme…") emessa verso l'utente.
- **Cosa mostra oggi**: `DA VERIFICARE` come la card mezzo / risposta chat etichetta esattamente un record `chiusa_da_evento` a video — il filtro esiste, la resa testuale non e stata individuata in questo audit.
- **Stato record coperto**: distingue `chiusa_da_evento` a livello di dato.

### S10 — `/next/autisti-inbox`
- **File:riga**: superfici di import in `src/next/autistiInbox/NextAutistiAdminNative.tsx`; modale evento `src/next/components/NextHomeAutistiEventoModal.tsx`.
- **Componente storia**: nessuno trovato. L'inbox gestisce l'*input* (segnalazioni/controlli/cambi gomme in arrivo) e le azioni di chiusura, non la *rilettura* della storia.
- **Cosa mostra oggi**: `DA VERIFICARE` se, dopo che una segnalazione viene chiusa via aggancio, l'inbox mostri la storia di chiusura. Dal codice letto, la storia di una segnalazione chiusa e visibile solo nell'**Archivio Storico espanso** (S5), non nell'inbox.
- **Stato record coperto**: segnalazioni/controlli prima della chiusura.

### Helper duplicati (trasversale alle superfici)
`formatChiusuraEventoTipo` e l'export canonico in `storiaRecord.ts:58`, ma esiste
**ri-dichiarato localmente** in: `ArchivioRowManutenzione.tsx:72`, `NextDossierMezzoPage.tsx:73`,
`NextMappaStoricoPage.tsx:144`, `NextManutenzioniPage.tsx:370`. `buildChiusuraDaEventoTitle`
ha una variante locale in `NextManutenzioniPage.tsx:376`, `NextMappaStoricoPage.tsx:150`,
`NextDossierMezzoPage.tsx:92` (`dossierWorkBadgeTitle`), `ArchivioRowManutenzione.tsx:78`
(`statoTitle`). Quattro copie + l'originale non riusato.

## A.2 — Tabella riepilogativa

| # | Superficie | Componente storia | Frase storia attuale | Differenze |
|---|---|---|---|---|
| S1 | Lista `/next/manutenzioni` (Ultimi interventi + operative) | nessuno | solo tooltip badge: "Chiusa dal <ev> del <data ora>" | storia invisibile senza hover |
| S2 | Pannello dettaglio manutenzione (`NextMappaStoricoPage`) | `StoriaRecordTimeline` esteso | "Segnalata… - Presa in carico… - Risolta dal <ev>…" | unica con arricchimento `eventoRecord` satellite |
| S3 | Dossier Mezzo lista lavori | `StoriaRecordTimeline` compact | idem S2 | badge tooltip locale + `dataInserimento` raw a fianco |
| S4 | Archivio Storico riga compatta | `StoriaRecordTimeline` compact **+ 2ª timeline footer** | canonica + "Aperta … / <STATO> …" | due timeline sovrapposte |
| S5 | Archivio Storico riga espansa | manut.: canonico · segn./rich.: frase ad hoc | manut. canonica · segn. "Chiusa il GG.MM.AAAA · HH:MI da X" | segn./rich. NON usano il componente canonico |
| S6 | PDF Quadro "risolte da eventi esterni" | tabella `autoTable` | 4 colonne; "Risolto da" = "Chiusa dal <ev> del <data>" | tabellare; verbo "Chiusa", date `GG/MM/AAAA` |
| S7 | Modale Aggancia evento | nessuno (pre-chiusura) | — (mostra candidati) | non e una superficie-storia |
| S8 | Modale Chiudi gomme correlate | nessuno (pre-chiusura) | — (mostra candidati aperti) | non e una superficie-storia |
| S9 | Chat IA | nessuno | nessuna frase narrativa trovata | categorizza lo stato, non lo racconta |
| S10 | `/next/autisti-inbox` | nessuno | `DA VERIFICARE` | storia segnalazione chiusa visibile solo in Archivio |

## A.3 — Elenco divergenze (stessa storia, resa diversa)

- **DIV-1 — Manutenzioni vs Segnalazioni/Controlli**: le manutenzioni usano
  `StoriaRecordTimeline` (3 segmenti); le segnalazioni/controlli chiusi in Archivio espanso
  (S5) usano una frase ad hoc "Chiusa il … da …". Stesso concetto, due rendering, due
  formati data. Gravita: **ALTA**.
- **DIV-2 — Verbo della chiusura**: la timeline canonica dice **"Risolta dal <evento>"**
  (`storiaRecord.ts:217`); i tooltip badge e il PDF dicono **"Chiusa dal <evento>"**
  (`buildChiusuraDaEventoTitle` nelle 4 copie locali). Gravita: **MEDIA**.
- **DIV-3 — Formato data dentro la storia**: timeline canonica → `formatDateUI` =
  `GG MM AAAA` (spazi); tooltip → `formatDateTimeUI` = `GG MM AAAA HH:MM`; Archivio espanso
  segnalazione → `formatDateTimeLong` = `GG.MM.AAAA · HH:MI` (punti); PDF → `formatDateFull`
  = `GG/MM/AAAA` (slash). Quattro formati per la stessa informazione. Gravita: **ALTA**.
- **DIV-4 — Doppia timeline in Archivio riga compatta (S4)**: `StoriaRecordTimeline`
  canonica + la mini-timeline `archivio-timeline` del footer convivono nella stessa riga,
  con stamp diversi. Gravita: **MEDIA**.
- **DIV-5 — Helper duplicati**: `formatChiusuraEventoTipo` / `buildChiusuraDaEventoTitle`
  ridichiarati in 4 file invece dell'export canonico — ogni copia puo divergere. Gravita:
  **MEDIA** (debito strutturale).

## A.4 — Elenco lacune (storia mancante o non accessibile)

- **LAC-1 — Lista `/next/manutenzioni` (S1)**: la storia di chiusura esiste solo come
  `title` HTML. Su mobile/touch il tooltip non e raggiungibile → storia di fatto invisibile
  nella superficie operativa principale.
- **LAC-2 — Chat IA (S9)**: distingue il dato `chiusa_da_evento` ma non emette una frase
  narrativa. L'utente che chiede "raccontami la storia di questa manutenzione" non riceve
  i 3 segmenti.
- **LAC-3 — `/next/autisti-inbox` (S10)**: `DA VERIFICARE` — dopo la chiusura di una
  segnalazione via aggancio, l'inbox non risulta mostrarne la storia; l'unico punto di
  rilettura e l'Archivio Storico espanso.
- **LAC-4 — Modali S7/S8**: per definizione pre-chiusura. Dopo aver chiuso piu record con
  `NextImportGommeChiusuraModal` non c'e un riepilogo "ecco cosa hai appena chiuso e con
  quale storia".
- **LAC-5 — Segnalazioni/controlli fuori Archivio**: la frase "Chiusa il … da …" delle
  segnalazioni vive solo in `ArchivioRowExpanded` (S5). Non c'e un pannello dettaglio
  segnalazione NEXT che mostri la stessa storia con il componente canonico.

## Domande aperte per Giuseppe

1. **Un solo componente storia o due?** Vuoi che segnalazioni/controlli chiusi (S5) usino
   lo stesso `StoriaRecordTimeline` delle manutenzioni, o resta la frase ad hoc?
2. **Verbo unico**: "Risolta dal cambio gomme" o "Chiusa dal cambio gomme"? Oggi
   convivono entrambi (DIV-2).
3. **Storia visibile nella lista `/next/manutenzioni`** (S1): vuoi la timeline inline
   anche li, o basta il tooltip? (impatta LAC-1, superficie operativa principale)
4. **Doppia timeline in Archivio compatto** (S4/DIV-4): tenere solo la canonica, solo il
   footer, o entrambe con ruoli distinti?
5. **Chat IA** (LAC-2): deve saper *raccontare* la storia (3 segmenti) o basta che
   distingua lo stato?
6. **Formato data unico nella storia**: collegato all'audit gemello
   `AUDIT_DATE_FORMATO_NEXT_2026-05-14.md` — quale formato per le date dentro la storia?
7. **Helper canonico** (DIV-5): consolidare le 4 copie locali di
   `formatChiusuraEventoTipo`/`buildChiusuraDaEventoTitle` sull'export di `storiaRecord.ts`?
8. **`/next/autisti-inbox`** (LAC-3): serve un punto di rilettura della storia dentro
   l'inbox, o l'Archivio Storico e sufficiente?

## Stato Firestore
Invariato. Audit di sola lettura. Unico effetto su disco: la creazione di questo file e
del file gemello `AUDIT_DATE_FORMATO_NEXT_2026-05-14.md`.
