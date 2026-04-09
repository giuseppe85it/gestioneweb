# AUDIT PROFONDO MANUTENZIONI NEXT CROSS-MODULO

- Data audit: 2026-04-09
- Prompt: 32
- Modalita: audit strutturale, nessuna patch runtime
- Perimetro patch consentito in questo run: solo documentazione audit/stato

## 1. Scopo
Verificare sul codice reale del repo se il modulo NEXT `Manutenzioni` e i suoi collegamenti con `Dossier`, `App Autisti`, `Quadro manutenzioni PDF`, `Dettaglio` e boundary NEXT vs madre restano coerenti dopo i cambi recenti su gomme ordinarie/straordinarie, dettaglio pulito e PDF.

## 2. File letti
- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`
- `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`
- `src/App.tsx`
- `src/utils/cloneWriteBarrier.ts`
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextMappaStoricoPage.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/NextDossierGommePage.tsx`
- `src/next/NextGommeEconomiaSection.tsx`
- `src/next/nextAnagraficheFlottaDomain.ts`
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/next/domain/nextMappaStoricoDomain.ts`
- `src/next/domain/nextRifornimentiDomain.ts`
- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/next/domain/nextOperativitaGlobaleDomain.ts`
- `src/pages/Manutenzioni.tsx`
- `src/pages/DossierMezzo.tsx`
- `src/pages/Mezzo360.tsx`

## 3. Moduli e collegamenti verificati
- Route ufficiale NEXT `/next/manutenzioni`
- Runtime `Dashboard / Nuova-Modifica / Dettaglio / Quadro manutenzioni PDF`
- Writer reale `saveNextManutenzioneBusinessRecord(...)`
- Reader gomme convergente `readNextMezzoManutenzioniGommeSnapshot(...)`
- Reader rifornimenti convergente `readNextRifornimentiReadOnlySnapshot(...)`
- Dossier NEXT composito `readNextDossierMezzoCompositeSnapshot(...)`
- Dossier Gomme NEXT `NextGommeEconomiaSection`
- Operativita Globale NEXT come consumatore laterale di `@manutenzioni`
- Parita minima con madre `src/pages/Manutenzioni.tsx`, `src/pages/DossierMezzo.tsx`, `src/pages/Mezzo360.tsx`

## 4. Stato per blocco

### Manutenzioni NEXT
- Stato: `PARZIALE`
- Verificato:
  - `/next/manutenzioni` monta direttamente `NextManutenzioniPage` sotto `NextRoleGuard`; non monta `NextMotherPage` o la pagina legacy come runtime finale.
  - Il caricamento pagina usa fonti reali e coerenti:
    - `readNextManutenzioniWorkspaceSnapshot()` -> `@manutenzioni` + `@mezzi_aziendali`
    - `readNextAnagraficheFlottaSnapshot({ includeClonePatches: false })` -> `@mezzi_aziendali` + `@colleghi`
    - `readNextRifornimentiReadOnlySnapshot()` -> `@rifornimenti` + `@rifornimenti_autisti_tmp`
    - `readNextLavoriInAttesaSnapshot()` -> lavori aperti per targa
  - Il writer `saveNextManutenzioneBusinessRecord(...)` salva in shape retrocompatibile su `@manutenzioni`, compresi:
    - `assiCoinvolti`
    - `gommePerAsse`
    - `gommeInterventoTipo`
    - `gommeStraordinario`
  - Il quadro usa davvero la distinzione strutturale tra ordinario e straordinario via `buildNextGommeStateByAsse(...)` e `buildNextGommeStraordinarieEvents(...)`.
- Limiti verificati:
  - Il writer non tocca solo `@manutenzioni`: modifica anche `@inventario` e `@materialiconsegnati`.
  - In `persistLegacyMaterialEffects(...)` ci sono due scritture consecutive sulla stessa chiave `@materialiconsegnati`; il secondo `setItemSync()` sovrascrive il primo. Il difetto e presente anche nella madre legacy, ma nel clone resta un punto fragile reale del writer.
  - `NextOperativitaGlobaleDomain` continua a leggere `@manutenzioni` come lista generica (`targa`, `descrizione`, `data`, `fornitore`) e non espone i nuovi campi strutturati gomme.

### Dettaglio
- Stato: `PARZIALE`
- Verificato:
  - Il binding al record aperto e coerente: `selectedDetailRecordId` viene risolto sullo storico della targa attiva e azzerato se il record sparisce dal contesto.
  - `openDetailForRecord(...)` porta il modulo su `view = "mappa"` con la stessa `targa` del record e passa a `NextMappaStoricoPage` il record selezionato.
  - Il ramo embedded non ha piu `Calibra`, marker, drag, overlay o salvataggi tecnici.
  - Restano solo le viste `Sinistra` e `Destra`.
- Limiti verificati:
  - L'immagine del viewer embedded non e derivata dal record aperto ma dalla categoria mezzo: usa sempre la tavola tecnica `public/gomme/*` per `sinistra/destra` quando esiste, con fallback alla foto vista.
  - Il dato testuale del record aperto e coerente, ma la superficie grafica resta categoria-centrica e non evento-centrica.

### Quadro manutenzioni PDF
- Stato: `PARZIALE`
- Verificato:
  - Il quadro filtra per soggetto (`mezzo`, `compressore`, `attrezzature`) e periodo usando lo storico reale del modulo.
  - La ricerca rapida quadro filtra i risultati mostrati per `targa` e `autista`.
  - L'export generale usa i risultati visibili (`pdfVisibleItems`), quindi rispetta i filtri attivi.
  - Per targa singola il PDF carica la foto reale del mezzo da `mezzoPreview.fotoUrl`; se l'URL non produce un'immagine valida usa un fallback neutro.
  - Il quadro separa:
    - stato gomme ordinario per asse
    - eventi gomme straordinari
- Limiti verificati:
  - L'export PDF e un ramo locale con `jsPDF` + `jspdf-autotable`, non una parity dimostrata con il PDF madre.
  - Il filtro `attrezzature` e coerente con il writer NEXT, ma non ha parity dimostrata con la madre, che nel file legacy letto continua a dichiarare solo `mezzo | compressore`.
  - La foto nel PDF dipende dalla raggiungibilita reale di `fotoUrl`.

### Collegamento con Dossier
- Stato: `PARZIALE`
- Verificato:
  - Il Dossier NEXT usa la stessa base mezzo reale di `@mezzi_aziendali` per foto/autista/categoria.
  - Il Dossier composito usa `readNextMezzoManutenzioniGommeSnapshot(...)`, quindi legge la stessa convergenza manutenzioni + gomme del modulo Manutenzioni/Dettaglio.
  - La lista manutenzioni principale del Dossier vede gli aggiornamenti scritti in `@manutenzioni`.
- Limiti verificati:
  - `buildNextDossierMezzoLegacyView(...)` riduce le manutenzioni a una vista legacy generica (`id`, `targa`, `tipo`, `data`, `km`, `ore`, `descrizione`) e perde i campi strutturati gomme.
  - `NextDossierMezzoPage` non mostra in chiaro:
    - stato gomme per asse
    - distinzione ordinario vs straordinario
    - motivo dello straordinario
  - `NextDossierGommePage` usa `NextGommeEconomiaSection` con `dataScope = "legacy_parity"`, quindi filtra i `gommeItems` ai soli item `sourceOrigin === "manutenzione_derivata"` ed esclude gli eventi gomme esterni tmp/ufficiali.
  - `NextGommeEconomiaSection` non costruisce il suo elenco a partire da `gommePerAsse` strutturato: usa `snapshot.gommeItems`, che per l'ordinario deriva ancora soprattutto dal parsing della descrizione testuale (`toGommeItems(...)`). Se il record ordinario ha `gommePerAsse` strutturato ma descrizione non parseabile, il Dossier Gomme puo non mostrare l'evento in modo pieno.
  - Gli straordinari arrivano a `gommeItems`, ma la vista legacy gomme conserva solo `posizione`, `marca`, `km`, `costo`, `fornitore`; il `motivo` dello straordinario non viene esposto in UI.

### Collegamento con App Autisti
- Stato: `PARZIALE`
- Verificato:
  - Il raccordo rifornimenti e reale:
    - feed autisti `@rifornimenti_autisti_tmp`
    - business `@rifornimenti`
    - merge controllato in `nextRifornimentiDomain`
  - Il raccordo gomme e reale:
    - `@cambi_gomme_autisti_tmp`
    - `@gomme_eventi`
    - convergenza read-only in `nextManutenzioniGommeDomain`
  - `Manutenzioni` e `Dossier` usano davvero questi reader convergenti, non una copia locale scollegata.
- Limiti verificati:
  - `Manutenzioni` e `Dossier` NEXT non leggono direttamente `@controlli_mezzo_autisti`, `@segnalazioni_autisti_tmp` o `@storico_eventi_operativi`; questo e coerente col runtime attuale, ma non replica il perimetro piu ampio della madre `Mezzo360`, che invece li usa nella timeline.
  - Il tema aperto sul doppio stream eventi autisti (`@storico_eventi_operativi` vs altri stream legacy) resta fuori chiusura.

### Boundary NEXT vs Madre
- Stato: `PARZIALE`
- Verificato:
  - La route NEXT ufficiale usa runtime nativo `NextManutenzioniPage`.
  - Le navigazioni principali dal modulo restano nel perimetro NEXT:
    - dettaglio embedded nativo
    - dossier NEXT via `buildNextDossierPath(...)`
  - La barriera clone consente scrittura solo su `/next/manutenzioni` e sulle chiavi whitelistate del modulo.
- Limiti verificati:
  - La route legacy `/manutenzioni` continua a esistere in parallelo.
  - Il modulo non e dimostrato equivalente alla madre sul PDF e sulla copertura completa dei flussi mezzo-centrici.
  - Altri consumatori NEXT di `@manutenzioni` restano ancora generici e non assorbono i nuovi campi strutturati gomme.

## 5. Flussi che risultano corretti
- Lettura workspace manutenzioni da `@manutenzioni` + `@mezzi_aziendali`.
- Preview mezzo, foto reale e autista da `@mezzi_aziendali` / flotta NEXT.
- Calcolo km attuali dal layer rifornimenti convergente.
- Salvataggio record in `@manutenzioni` con shape compatibile per:
  - ordinario per asse
  - straordinario puntuale
- Dettaglio aperto per `id` record della targa attiva.
- Quadro PDF con distinzione ordinario / straordinario.
- Dossier NEXT che vede la stessa base manutenzioni/gomme del dominio convergente.
- Convergenza autisti -> rifornimenti e autisti -> gomme ancora attiva nei reader NEXT.

## 6. Flussi fragili o rotti
- Writer materiali collegato a manutenzioni: doppia scrittura sulla stessa chiave `@materialiconsegnati` in `persistLegacyMaterialEffects(...)`; il primo payload viene sovrascritto dal secondo.
- Dossier principale: perde i campi strutturati gomme nella mappa legacy delle manutenzioni.
- Dossier Gomme: esclude in `legacy_parity` gli eventi gomme esterni tmp/ufficiali e dipende ancora dal parsing della descrizione per gran parte dell'ordinario.
- Straordinari gomme nel Dossier: il motivo non viene mostrato in UI legacy gomme.
- Operativita globale: consuma `@manutenzioni` come lista generica e ignora i nuovi campi strutturati.
- Parity con madre su `attrezzature` e PDF quadro: non dimostrata.

## 7. Shape dati, reader e writer reali

### Reader reali usati dal modulo o dai moduli collegati
- `readNextManutenzioniWorkspaceSnapshot()`:
  - storage `@manutenzioni`
  - storage `@mezzi_aziendali`
- `readNextAnagraficheFlottaSnapshot({ includeClonePatches: false })`:
  - storage `@mezzi_aziendali`
  - storage `@colleghi`
- `readNextRifornimentiReadOnlySnapshot()` / `readNextMezzoRifornimentiSnapshot()`:
  - storage `@rifornimenti`
  - storage `@rifornimenti_autisti_tmp`
- `readNextMezzoManutenzioniGommeSnapshot()`:
  - `@manutenzioni`
  - `@mezzi_aziendali`
  - `@cambi_gomme_autisti_tmp`
  - `@gomme_eventi`
- `readNextMappaStoricoSnapshot()`:
  - flotta NEXT per identita mezzo
  - manutenzioni/gomme convergenti
  - rifornimenti convergenti
  - `@mezzi_foto_viste`
  - `@mezzi_hotspot_mapping`
- `readNextDossierMezzoCompositeSnapshot()`:
  - identita mezzo da `@mezzi_aziendali`
  - manutenzioni/gomme convergenti
  - rifornimenti convergenti
  - altri reader dossier non oggetto primario di questo audit

### Writer reali
- `saveNextManutenzioneBusinessRecord()`:
  - scrive `@manutenzioni`
  - aggiorna `@inventario`
  - aggiorna `@materialiconsegnati`
- `deleteNextManutenzioneBusinessRecord()`:
  - scrive `@manutenzioni`
  - aggiorna `@inventario`
  - aggiorna `@materialiconsegnati`
- visual metadata mappa storico:
  - `@mezzi_foto_viste`
  - `@mezzi_hotspot_mapping`
  - Storage `mezzi_foto/...`

### Shape significative verificate
- record manutenzione NEXT/clone:
  - `targa`
  - `tipo`
  - `descrizione`
  - `data`
  - `km` o `ore`
  - `materiali`
  - `assiCoinvolti?`
  - `gommePerAsse?`
  - `gommeInterventoTipo?`
  - `gommeStraordinario?`
- preview mezzo:
  - `targa`
  - `marcaModello`
  - `categoria`
  - `autistaNome`
  - `fotoUrl`

## 8. Rischi residui
- Rischio writer materiali: medio-alto, perche tocca inventario e materiali consegnati oltre al record manutenzione.
- Rischio drift cross-modulo: alto, perche il quadro usa campi strutturati gomme che Dossier e Operativita Globale non mostrano ancora in modo equivalente.
- Rischio parity madre: alto, perche la madre `Mezzo360` continua a leggere timeline piu ampia da feed autisti e gomme raw, mentre il Dossier NEXT filtra di piu.
- Rischio PDF: medio, dipendente da `fotoUrl` raggiungibile e da un ramo locale custom non ancora certificato come parity.

## 9. Soluzioni consigliate
1. Correggere il writer materiali di `Manutenzioni` per non sovrascrivere due volte `@materialiconsegnati`.
2. Allineare `NextGommeEconomiaSection` e/o `nextManutenzioniGommeDomain` cosi che il Dossier Gomme possa leggere anche l'ordinario strutturato da `gommePerAsse`, non solo il parsing della descrizione.
3. Esporre nel Dossier almeno:
   - stato gomme per asse
   - eventi gomme straordinari con motivo
4. Valutare un adapter anche per `NextOperativitaGlobaleDomain` se il resto del gestionale deve vedere i nuovi campi gomme senza leggere raw.
5. Eseguire un audit separato di parity PDF quadro vs madre se il PDF rientra nei criteri di chiusura modulo.

## 10. File extra che servirebbero per eventuali fix
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/next/NextGommeEconomiaSection.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/next/domain/nextOperativitaGlobaleDomain.ts`

## 11. Verdetto finale audit
- `Manutenzioni NEXT` -> `PARZIALE`
- `Dettaglio` -> `PARZIALE`
- `Quadro manutenzioni PDF` -> `PARZIALE`
- `Collegamento con Dossier` -> `PARZIALE`
- `Collegamento con App Autisti` -> `PARZIALE`
- `Boundary NEXT vs Madre` -> `PARZIALE`

Nessun blocco puo essere dichiarato `CHIUSO` con la sola prova disponibile nel repo corrente.
