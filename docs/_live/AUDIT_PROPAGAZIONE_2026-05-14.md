# AUDIT PROPAGAZIONE — PARSING DATE + COPERTURA `chiusa_da_evento` — 2026-05-14

> Generato al termine del PROMPT 38b (audit multi-agent, 4 sub-agent paralleli read-only).
> Esito: **PASS** — mappatura completa. Zero modifiche a `src/`, `backend/`, `scripts/`.
> Questo audit identifica e NON patcha. La Sezione C è una mappa interventi, non codice.

## Metodo

4 sub-agent `Explore` (read-only, modello sonnet ≈ reasoning medium) lanciati in
parallelo, ciascuno con perimetro file dedicato:
- **DATE-DOMAIN** — `src/next/domain/` + `src/next/helpers/` (escluso `parseRobusto.ts`)
- **DATE-UI** — `src/next/*.tsx`, `components/`, `autistiInbox/`, `centroControllo/`
- **CHIUSURA-LISTE** — `NextManutenzioniPage.tsx`, `autistiInbox/`, `centroControllo/`, `domain/`
- **CHIUSURA-PDF** — motore PDF Quadro + chiamanti

Soluzione di riferimento per il parsing: `src/next/helpers/parseRobusto.ts`
(`parseDataRobusta` / `getDataRiferimentoRecord`). Una location è "problematica" se
parsa una data di record Firestore senza passare da lì.

Nota perimetro: le cartelle `src/next/dossier/` e `src/next/mappa/` non esistono — i
file dossier/mappa vivono come `*.tsx` top-level (es. `NextDossierMezzoPage.tsx`,
`NextMappaStoricoPage.tsx`) e sono stati coperti da DATE-UI.

---

## Sezione A — Parsing Date

Conteggio merge DATE-DOMAIN + DATE-UI: **CRITICA 7 · MEDIA 18 · BASSA 7 · TRACCIA 3**.

Pattern di bug ricorrente — due varianti:
1. **Solo-legacy**: parser regex `dd/mm/yyyy` che su ISO `yyyy-mm-dd` ritorna `null` o
   un risultato sbagliato (es. inversione giorno/anno). È il bug esatto del caso 8/12
   maggio (PROMPT 37/38a).
2. **UTC-midnight**: `new Date("2026-05-08")` / `Date.parse("2026-05-08")` su ISO breve
   interpreta la data come mezzanotte UTC, non locale → shift di fuso su filtri/sort.

### A.1 — Gravità CRITICA (7)

Il parse fallisce o dà fallback errato su ISO `yyyy-mm-dd`, in contesti di filtro/sort/confronto.

| file:riga | snippet | nota |
|---|---|---|
| `src/next/domain/nextAutistiDomain.ts:287` | `const parsed = Date.parse(raw);` | `toTimestamp` senza legacy-check: ISO → UTC midnight, offset timezone su filtri temporali autisti |
| `src/next/domain/nextDocumentiMezzoDomain.ts:120` | `const parsed = Date.parse(raw);` | `toTimestamp` identico: ISO → UTC su `data/dataDocumento/createdAt` |
| `src/next/domain/nextSegnalazioniControlliDomain.ts:155` | `const parsed = Date.parse(raw);` | `toTimestamp` su `record.data` — **caldo**: tocca segnalazioni/controlli, fonte del flusso aggancio/chiusura |
| `src/next/NextManutenzioniPage.tsx:163` | `function parseLegacyDate(value): Date \| null` | parser locale solo `dd mm yyyy`: ISO → `null`; usato in filtri/sort/groupBy mese (`:179-230`, `:1596`). **Pagina dove vivono i record `from-lavoro-*`** |
| `src/next/NextMappaStoricoPage.tsx:100` | `function parseLegacyDateParts(value)` | solo regex `dd/mm/yyyy`; su ISO ritorna `{day:"—",…}` → rendering errato lista storico (`:613`) |
| `src/next/NextGommeEconomiaSection.tsx:101` | `new Date(\`${yyyyA}-${mmA}-${ggA}\`).getTime() \|\| 0` | sort `sostituzioni`: ricostruisce ISO invertendo parti di `dd mm yyyy` — se `data` è già ISO le parti vengono **scambiate** → data totalmente sbagliata |
| `src/next/NextGommeEconomiaSection.tsx:29` | `const direct = new Date(raw).getTime();` | `parseLegacyDate` locale: ISO ok da `new Date` ma se non-finite ritorna `0` invece di `null`; usato nel sort `:90` |

### A.2 — Gravità MEDIA (18)

Il parse funziona ma è fragile: gestisce solo legacy, oppure ISO via `new Date`/`Date.parse`
con ambiguità UTC-midnight, oppure non gestisce i Firestore Timestamp.

| file:riga | snippet | nota |
|---|---|---|
| `src/next/domain/nextDocumentiCostiDomain.ts:545-559` | `dmyMatch = raw.match(…)` … `new Date(raw)` | `parseDateFlexible`: legacy-first, fallback `new Date(raw)` — ISO via UTC, nessun ramo ISO esplicito |
| `src/next/domain/nextRifornimentiDomain.ts:416-431` | `dmyMatch = raw.match(…)` … `new Date(raw)` | `parseDateFlexible`, stesso pattern |
| `src/next/domain/nextCapoDomain.ts:162-176` | `const direct = new Date(raw)` | `parseDateFlexible`: `new Date(raw)` prima della regex; ISO ok ma UTC midnight |
| `src/next/domain/nextAttrezzatureCantieriDomain.ts:193-207` | `const direct = new Date(raw)` | copia di `parseDateFlexible`, stessa ambiguità UTC |
| `src/next/domain/nextDossierMezzoDomain.ts:274-288` | `const direct = new Date(raw)` | copia di `parseDateFlexible`, ISO via UTC midnight |
| `src/next/domain/nextManutenzioniGommeDomain.ts:578-592` | `const direct = new Date(raw)` | copia di `parseDateFlexible`; usato in sort comparazione date |
| `src/next/domain/nextMaterialiMovimentiDomain.ts:468-483` | `const direct = new Date(raw)` | copia di `parseDateFlexible` |
| `src/next/domain/nextProcurementDomain.ts:466-483` | `const parsedIso = new Date(raw)` | copia di `parseDateFlexible` |
| `src/next/domain/nextCisternaDomain.ts:280-289` | `const direct = new Date(value)` | `toDateFromUnknown`: ISO via `new Date` (UTC), poi legacy regex |
| `src/next/domain/nextAnalisiEconomicaDomain.ts:90` | `const parsed = new Date(normalized)` | `toTimestamp`: `new Date(string)` diretto, ISO → UTC |
| `src/next/NextAnalisiEconomicaPage.tsx:64` | `const direct = new Date(raw)` | `parseDateFlexible` locale: gestisce ISO+legacy ma non Firestore Timestamp |
| `src/next/NextCapoCostiMezzoPage.tsx:41` | `const direct = new Date(raw)` | `parseDateFlexible` locale, no Timestamp; usato in sort/display `:253`,`:390` |
| `src/next/NextCapoCostiMezzoPage.tsx:77` | `timestamp ? new Date(timestamp) : parseDateFlexible(value)` | fallback su parser locale se `timestamp` assente; Timestamp Firestore non gestito |
| `src/next/NextDossierMezzoPage.tsx:57` | `const direct = new Date(raw)` | `parseDateFlexible` locale, no Firestore Timestamp |
| `src/next/NextCentroControlloParityPage.tsx:421` | `const d = new Date(raw)` | fallback finale `parseDateFlexible` locale; completo (gestisce Timestamp `:389-398`) ma non condiviso |
| `src/next/NextCentroControlloSinottica.tsx:197` | `const direct = new Date(trimmed)` | `parseDateFlexible` locale, no Timestamp; usato in sort `:288` e filtri scadenze `:621`,`:688` |
| `src/next/NextRifornimentiEconomiaSection.tsx:86` | `const d = new Date(raw)` | `parseDateFlex` locale: gestisce `.toDate()` ma non `{seconds}` raw — parzialmente robusto |
| `src/next/components/NextImportGommeChiusuraModal.tsx:81` | `const parsed = Date.parse(raw);` | `Date.parse` su campo `data`: ok su ISO ma no Timestamp Firestore, no legacy italiano — **modale del flusso chiusura** |

### A.3 — Gravità BASSA / TRACCIA (7 + 3)

**BASSA** — parse corretto nel contesto ma codice duplicato di `parseRobusto` (refactor opportuno, non bug):
| file:riga | nota |
|---|---|
| `src/next/domain/nextDocumentiCostiDomain.ts:570` | `new Date(timestamp)` su `number` già risolto — corretto, duplicato |
| `src/next/domain/nextCapoDomain.ts:258` | `new Date(item.timestamp)` su `number` normalizzato — corretto, duplicato |
| `src/next/NextAttrezzatureCantieriWritePanel.tsx:119` | `new Date(trimmed)` display-only, no sort/filtro |
| `src/next/NextCentroControlloPage.tsx:341` | `Date.parse(normalized)` come ultimo tentativo in `toSegnalazioneTimestamp` — robusto nel contesto |
| `src/next/autistiInbox/NextAutistiAdminNative.tsx:99` | `Date.parse(v)` in `toTs` su campo `timestamp` (non `data`) — robusto |
| `src/next/autistiInbox/NextAutistiInboxHomeNative.tsx:175` | `Date.parse(value)` in `toTs` su `timestamp` log accessi |
| `src/next/autistiInbox/NextAutistiLogAccessiAllNative.tsx:39` | `Date.parse(value)` in `toTs` su `timestamp` |

**TRACCIA** — uso di parser legacy intenzionale su soli dati a formato fisso noto:
| file:riga | nota |
|---|---|
| `src/next/helpers/eventiCompatibili.ts:84` | `Date.parse(raw)` come fallback nel `parseDateMs` proprio dell'helper; legge storage gomme locale. Vedi C7 — l'intero helper ha un parser parallelo a `parseRobusto` |
| `src/next/NextManutenzioniPage.tsx:596` | `parseLegacyDate(getMaintenancePdfDateValue(item))` su dataset legacy `dd mm yyyy` — ma se arrivano record ISO eredita il bug di `:163` (vedi A.1) |
| `src/next/NextMappaStoricoPage.tsx:613` | `parseLegacyDateParts(item.data)` display-only storico legacy — su record ISO rendering silenziosamente errato (vedi A.1 `:100`) |

---

## Sezione B — Copertura `chiusa_da_evento`

### B.1 — Liste correnti

**Esito: nessuna superficie non corretta.** Lo stato `chiusa_da_evento` è gestito
coerentemente in tutte le liste/conteggi/KPI verificati: escluso dalle viste "aperte",
mostrato in storico/archivio con badge dedicato.

| superficie | file:riga | gestisce? | comportamento | corretto? |
|---|---|---|---|---|
| `resolveMaintenanceStato` (parser stato) | `NextManutenzioniPage.tsx:335-343` | SI | riconosce `chiusa_da_evento` come stato valido; ignoti → `daFare` | SI |
| Tab "Da fare" (`manutenzioniOperative`) | `NextManutenzioniPage.tsx:1334-1340` | SI | filtra `daFare\|programmata`; `chiusa_da_evento` escluso | SI |
| KPI "Manutenzioni da fare" per targa | `NextManutenzioniPage.tsx:1078-1083`,`:1326` | SI | usa snapshot `daFare\|programmata`; non contato | SI |
| Reader snapshot "da fare" | `nextManutenzioniDomain.ts:905-909` | SI | filtra `stato === "daFare"`; escluso | SI |
| Reader snapshot "da fare + programmata" | `nextManutenzioniDomain.ts:912-917` | SI | filtra `daFare\|programmata`; escluso | SI |
| Sinottica CC — feed `manutenzioniDaFare` | `NextCentroControlloParityPage.tsx:991-1005` | SI | usa `readNextManutenzioniDaFareSnapshot` (solo `daFare`) | SI |
| Sinottica — KPI urgenti (`lvUrg`) | `NextCentroControlloSinottica.tsx:701-703` | SI | conta da lista che non contiene `chiusa_da_evento` | SI |
| Dossier Mezzo — lavori eseguiti | `nextDossierMezzoDomain.ts:924` | SI | `chiusa_da_evento` mappa in `lavoriEseguiti` | SI |
| Dossier Mezzo — lavori in attesa | `nextDossierMezzoDomain.ts:920-922` | SI | solo `daFare\|programmata` in pending; escluso | SI |
| Dossier Mezzo — `keySignals` (riepilogo) | `nextDossierMezzoDomain.ts:654` | SI | conta solo `daFare\|programmata` come aperta | SI |
| Archivio Storico — tipo filtro stato | `useArchivioFilters.ts:99-104` | SI | `chiusa_da_evento` tra i valori selezionabili | SI |
| Archivio Storico — toolbar select | `ArchivioToolbar.tsx:191` | SI | option `chiusa_da_evento` nel dropdown | SI |
| Archivio Storico — `applyFilters` | `useArchivioFilters.ts:287-294` | PARZIALE | match diretto su `stato`; fallback `?? "eseguita"` (`:292`) → record con `stato` null mai filtrabili come `chiusa_da_evento` | SI (per record con stato valorizzato) |
| Archivio — row badge stato | `ArchivioRowManutenzione.tsx:50-54` | SI | label "CHIUSA DA EVENTO" mappata esplicitamente | SI |
| Archivio Feed — `formatManutenzioneStatoLabel` | `ArchivioFeed.tsx:193-199` | SI | ramo esplicito → "Chiusa da evento" | SI |
| Inbox autisti (HomeNative) | `NextAutistiInboxHomeNative.tsx` | N/A | non gestisce `@manutenzioni` (mostra rifornimenti/segnalazioni/controlli/cambi) | SI |

Unica imperfezione non bloccante: `useArchivioFilters.ts:292` — il fallback `?? "eseguita"`
fa sì che un record `@manutenzioni` con `stato` nullo non sia mai selezionabile col filtro
`chiusa_da_evento`. Non genera falsi positivi; accettabile (record senza stato non attesi).

### B.2 — PDF Quadro manutenzioni

**A — Filtro / toggle.** Default `pdfIncludeOperative = true` (`NextManutenzioniPage.tsx:1122`).
`isPdfOperativeMaintenance` (`:505-508`) ritorna `true` **solo** per `daFare` e `programmata`.
Il filtro `pdfFilteredItems` (`:1447-1472`): se `pdfIncludeOperative && isOperative` il
record passa sempre; altrimenti è filtrato per periodo. `chiusa_da_evento` **non è
"operativo"**: cade nel ramo periodo ed è trattato esattamente come `eseguita` — entra nel
PDF se rientra nella finestra temporale, sia col toggle ON che OFF. Non c'è alcun
trattamento dedicato. Comportamento di fatto accettabile (è un record concluso), ma
`chiusa_da_evento` **non è distinguibile** nel PDF da una `eseguita` classica.

**B — Riga origine / chiusura.** La riga **origine è PRESENTE**: `buildPdfOriginNote`
(`:464-484`) produce "Segnalato da X il Y" / "Controllo KO di X del Y", appesa alla
descrizione da `buildPdfDescrizioneWithOrigin` (`:486-492`), stampata nella cella
Descrizione delle autoTable (`:2373` single-targa, `:2515` multi-targa).
La riga **chiusura è ASSENTE**: `buildChiusuraDaEventoTitle` (`:359-366`) costruisce già
"Chiusa dal cambio gomme del ZZ" da `chiusuraDi`/`chiusuraData`, ma è usata **solo nella
UI** come attributo `title` HTML (`:2711`, `:2822`) — mai passata al body del PDF.
Punto di inserimento naturale: `buildPdfDescrizioneWithOrigin` (`:486-492`), aggiungendo
un secondo `\n` con `buildChiusuraDaEventoTitle(item)` quando definito.

File/funzioni coinvolti: `src/next/NextManutenzioniPage.tsx` — `isPdfOperativeMaintenance`
(`:505`), `pdfFilteredItems` (`:1447`), `buildPdfOriginNote` (`:464`),
`buildPdfDescrizioneWithOrigin` (`:486`), `buildChiusuraDaEventoTitle` (`:359`),
autoTable body single-targa (`:2358`/`:2373`), multi-targa (`:2500`/`:2515`).

---

## Sezione C — Interventi proposti

Mappa "dove intervenire", ordinata per priorità. Nessuna proposta di codice.

| # | Intervento | Perché | File principali | Stima |
|---|---|---|---|---|
| C1 | Sostituire `parseLegacyDate` di `NextManutenzioniPage` con `parseDataRobusta` | È la pagina dove vivono i record `from-lavoro-*` ISO; oggi filtri/sort/groupBy mese li perdono. Stesso bug di 38a, non fixato a monte | `NextManutenzioniPage.tsx:163` (+ usi `:179-230`,`:596`,`:1596`) | M |
| C2 | Allineare i 3 reader `toTimestamp` (`Date.parse` raw) a `parseDataRobusta` | CRITICA: ISO → UTC midnight su filtri temporali. `nextSegnalazioniControlliDomain` tocca il flusso aggancio/chiusura | `nextSegnalazioniControlliDomain.ts:155`, `nextAutistiDomain.ts:287`, `nextDocumentiMezzoDomain.ts:120` | M |
| C3 | Fixare il sort gomme che inverte le parti data | `NextGommeEconomiaSection:101` scambia giorno/anno se `data` è ISO → ordinamento gomme totalmente sbagliato | `NextGommeEconomiaSection.tsx:29`,`:101` (sort `:90`) | S-M |
| C4 | Sostituire `parseLegacyDateParts` di `NextMappaStoricoPage` con `parseDataRobusta` | CRITICA: su record ISO il dettaglio storico mostra `day:"—"` / rendering errato, in silenzio | `NextMappaStoricoPage.tsx:100` (usi `:613`) | S-M |
| C5 | Stampare la riga di chiusura nel PDF Quadro | `buildChiusuraDaEventoTitle` esiste ma il PDF non la stampa: Giuseppe non vede "Chiusa dal cambio gomme del ZZ" sul cartaceo | `NextManutenzioniPage.tsx:486-492` (riusa `:359`) | S |
| C6 | Decidere il trattamento di `chiusa_da_evento` nel filtro PDF | Oggi è indistinguibile da `eseguita`. Va deciso: segue il toggle "Includi da fare e programmate", o resta nel ramo periodo, o ha un toggle proprio | `NextManutenzioniPage.tsx:505`,`:1447-1472` | S (decisione + 1 riga) |
| C7 | Allineare il `parseDateMs` proprio di `eventiCompatibili.ts` a `parseRobusto` | L'helper centrale del flusso aggancio ha un parser parallelo: rischio di drift futuro rispetto alla soluzione di riferimento | `helpers/eventiCompatibili.ts:54-86` | S |
| C8 | Consolidare le ~10 copie di `parseDateFlexible`/`toDateFromUnknown` nei domain su `parseDataRobusta` | MEDIA diffusa: ambiguità UTC-midnight + duplicazione. Un solo parser elimina la classe di bug | `nextDocumentiCostiDomain`, `nextRifornimentiDomain`, `nextCapoDomain`, `nextAttrezzatureCantieriDomain`, `nextDossierMezzoDomain`, `nextManutenzioniGommeDomain`, `nextMaterialiMovimentiDomain`, `nextProcurementDomain`, `nextCisternaDomain`, `nextAnalisiEconomicaDomain` | L |
| C9 | Consolidare le ~7 copie UI di `parseDateFlexible` su `parseDataRobusta` | MEDIA diffusa lato componenti; alcune non gestiscono i Firestore Timestamp | `NextAnalisiEconomicaPage.tsx:64`, `NextCapoCostiMezzoPage.tsx:41`,`:77`, `NextDossierMezzoPage.tsx:57`, `NextCentroControlloParityPage.tsx:421`, `NextCentroControlloSinottica.tsx:197`, `NextRifornimentiEconomiaSection.tsx:86`, `NextImportGommeChiusuraModal.tsx:81` | L |
| C10 | Rivedere il fallback `?? "eseguita"` del filtro Archivio | BASSA: record `@manutenzioni` con `stato` nullo non sono filtrabili come `chiusa_da_evento`. Solo se emergono record senza stato | `useArchivioFilters.ts:292` | S |

### Priorità consigliata

- **Prima ondata (CRITICA, sblocca i bug reali):** C1 → C2 → C3 → C4.
- **Seconda ondata (copertura `chiusa_da_evento`, taglia piccola):** C5 → C6 → C7.
- **Terza ondata (igiene / refactor anti-drift):** C8 → C9 → C10.

C6 richiede una decisione di Giuseppe prima di essere eseguito (vedi B.2-A).

---

## Stato Firestore

**Invariato.** Zero scritture, zero script eseguiti, zero query live. I numeri citati
sono ripresi dalla `DISCOVERY_DOPPIONI_GOMME_2026-05-14.md` e dagli audit PROMPT 34/37.
Unico effetto su disco: la creazione di questo file.
