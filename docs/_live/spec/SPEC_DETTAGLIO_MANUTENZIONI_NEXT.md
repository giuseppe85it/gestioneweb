# SPEC — Tab Dettaglio manutenzioni: restyling split view (NEXT)

**Modulo**: `/next/manutenzioni` — tab "Dettaglio" (view interno `"mappa"`)
**File target principale**: `src/next/NextMappaStoricoPage.tsx` (ramo `embedded=true`, senza `photoManager`, ref runtime `r.430`)
**File padre**: `src/next/NextManutenzioniPage.tsx`
**Mockup visuale**: `docs/_live/mockup/MOCKUP_DETTAGLIO_MANUTENZIONI_V3.html`
**Nota mockup**: il file mockup va salvato manualmente dal product owner in questo path prima dell'implementazione. Al momento della verifica spec il file potrebbe non essere ancora versionato.
**Stato**: IN_CORSO
**Data creazione**: 2026-04-23

---

## 1. Obiettivo in una riga

Sostituire il contenuto attuale della tab "Dettaglio" con una **split view lista + pannello dettaglio** (stile Gmail/Outlook): a sinistra lo storico manutenzioni del mezzo selezionato con filtri per tipo, a destra il dettaglio della manutenzione selezionata con tutti i campi del dominio, bottoni contestuali testuali, e sezione condizionale per gomme. Rimuovere lo schema tecnico del camion, la card "dettaglio mezzo" ridondante, i bottoni fissi in fondo.

Nessun cambio alla logica dati: stessi hook, stessi selector, stesso contratto con il parent. Solo UI diversa.

---

## 2. Perimetro file

### CREA
Nessun file sorgente nuovo.

### MODIFICA (sorgente)
- `src/next/NextMappaStoricoPage.tsx` — **solo ramo `embedded=true` senza `photoManager`** (ref runtime `r.430`). Il ramo `photoManager` (`r.378`) e il ramo default non-embedded (`r.659`) NON vanno toccati.
- `src/next/NextManutenzioniPage.tsx` — SOLO per:
  - estendere `selectedMaintenance` passato al componente con i campi oggi non passati ma presenti nel dominio (`ore`, `sottotipo`, `gommePerAsse`, `gommeInterventoTipo`, `gommeStraordinario`, `sourceDocumentCurrency`)
  - nessuna altra modifica
- `src/next/next-mappa-storico.css` — SOLO per aggiungere nuove classi `man2-detail-v2__*` (o prefisso simile coerente). Le classi `man2-*` e `ms-*` esistenti NON vanno modificate né rimosse (il ramo non-embedded le usa ancora).

### MODIFICA (documentazione, solo se pertinente)
- `docs/_live/STATO_MIGRAZIONE_NEXT.md` — voce stato Manutenzioni
- `docs/_live/REGISTRO_MODIFICHE_CLONE.md` — voce BREVE formato esistente
- `CONTEXT_CLAUDE.md` — bullet "Ultimo task completato"
- `docs/_live/INDICE_SPEC.md` — aggiornare voce spec a IMPLEMENTATA al termine

### NON TOCCARE
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/next/domain/nextRifornimentiDomain.ts`
- `src/utils/cloneWriteBarrier.ts`
- `src/utils/pdfEngine.ts`
- Firebase rules
- Ramo `photoManager` di `NextMappaStoricoPage` (`r.378`)
- Ramo default non-embedded di `NextMappaStoricoPage` (`r.659`)
- Altre tab di `/next/manutenzioni` (Dashboard, Nuova/Modifica, Quadro manutenzioni PDF)
- Qualunque file Madre legacy fuori da `src/next/`
- Cartelle docs deprecate: `docs/product/`, `docs/fonti-pronte/`, `docs/change-reports/`, `docs/continuity-reports/`

### VIETATO CREARE
- Change-report, continuity-report, audit MD (cartelle deprecate)
- Mirror in altre cartelle
- File MD fuori da `docs/_live/`

---

## 3. Fatti certi dal codice (audit PROMPT 21)

Questi fatti vanno **assunti veri** e non reinterpretati:

1. La tab "Dettaglio" corrisponde al view interno `view === "mappa"` e monta `NextMappaStoricoPage` (ref: `NextManutenzioniPage.tsx:2958-3010`).
2. Il componente ha 3 rami runtime, in quest'ordine:
   - ramo `photoManager` quando la prop `photoManager` e presente (ref: `NextMappaStoricoPage.tsx:378`)
   - ramo `embedded=true` senza `photoManager` (tab Dettaglio, ref: `NextMappaStoricoPage.tsx:430`)
   - ramo default non-embedded (ref: `NextMappaStoricoPage.tsx:659`)
   **Il restyling tocca SOLO il ramo embedded (`r.430`, no `photoManager`)**.
3. Contratto props esistente (ref: `NextMappaStoricoPage.tsx:24-57`):
   `targa`, `embedded?`, `photoManager?`, `selectedMaintenance?`, `mezzoInfo?`, `onOpenPdf?`, `onOpenDossier?`, `onEditLatest?`, `onSelectMaintenance?`.
4. Il parent passa oggi `selectedMaintenance` ridotto (ref: `NextManutenzioniPage.tsx:2961-2976`) con soli: `id`, `data`, `descrizione`, `assiCoinvolti`, `km`, `tipo`, `materiali`, `importo`, `sourceDocumentId`, `sourceDocumentFileUrl`, `fornitore`.
5. Campi esistenti nel dominio ma NON passati al componente embedded (da estendere nel parent):
   - `ore` (ref: `nextManutenzioniDomain.ts:113-114`)
   - `sottotipo` (ref: `nextManutenzioniDomain.ts:115`)
   - `gommePerAsse`, `gommeInterventoTipo`, `gommeStraordinario` (ref: `nextManutenzioniDomain.ts:123-125`)
   - `sourceDocumentCurrency` (ref: `nextManutenzioniDomain.ts:129`)
6. Shape materiali (ref: `nextManutenzioniDomain.ts:101-108`): `id`, `label`, `quantita`, `unita`, `fromInventario`, `refId?`. **Costo unitario NON esiste**. Unico valore economico: `importo?` a livello manutenzione.
7. Sorgente storico: `storicoMezzoOrdinato` già filtrato e ordinato desc per data in `NextManutenzioniPage.tsx:949-955`. Il componente riceve solo il record selezionato, NON la lista. **Per il restyling serve che il parent passi anche la lista completa** (nuova prop, vedi §5.2).
8. Pattern edit esistente: `handleEdit(item)` in `NextManutenzioniPage.tsx:1393-1421` imposta editingId, carica campi form, imposta `selectedDetailRecordId`, poi `setView("form")`. La tab oggi aggancia `onEditLatest` che il parent implementa come `handleEdit(selectedDetailRecord ?? latestRecord)` (ref: `NextManutenzioniPage.tsx:3003-3010`).
9. Pattern dossier: `navigate(buildNextDossierPath(...))` in `NextManutenzioniPage.tsx:3000-3001`. Già coerente col resto del file.
10. Pattern "Apri quadro PDF": `setView("pdf")` nel parent (ref: `NextManutenzioniPage.tsx:2999`). Nel restyling questa azione diventa "Scarica PDF singolo" e deve invocare l'export PDF per singolo mezzo già implementato (stessa funzione che genera il PDF dal pulsante PDF nel Quadro manutenzioni).
11. Contratto link esterno recordId: `/next/manutenzioni?targa=X&recordId=Y` apre la tab Dettaglio con record Y preselezionato (ref: `NextManutenzioniPage.tsx:1225-1247`). **Questo contratto va PRESERVATO**.
12. CSS file unico: `next-mappa-storico.css`, contiene sia `ms-*` (ramo non-embedded) sia `man2-*` (ramo embedded attuale). Nel restyling aggiungiamo nuovi prefissi senza toccare i due esistenti.

---

## 4. Nuovo contratto props (minimale estensione)

Il componente `NextMappaStoricoPage` nel ramo `embedded=true` riceverà:

### Props invariate
- `targa: string`
- `embedded: true`
- `mezzoInfo?: MezzoInfo` (già presente, invariato; `MezzoInfo` qui indica un alias locale introdotto nella patch per dare nome al contratto inline esistente, non un tipo esportato già presente)
- `onOpenDossier?: () => void` (invariato)
- `onEditLatest?: () => void` (invariato, ora agisce sempre sul record selezionato, mai più come "latest fallback" dato che il restyling garantisce sempre una selezione esplicita)

### Props estese
- `selectedMaintenance?: SelectedMaintenance | null` — **shape estesa** per includere anche: `ore?`, `sottotipo?`, `gommePerAsse?`, `gommeInterventoTipo?`, `gommeStraordinario?`, `sourceDocumentCurrency?`. Tutti opzionali, retrocompatibili.
- `onSelectMaintenance?: (recordId: string | null) => void` — **ESTESO**: contratto attuale `(recordId: string) => void`, da estendere per supportare `null` in caso di deselezione al secondo click. Il parent `NextManutenzioniPage` deve accettare `null` e fare `setSelectedDetailRecordId(null)`.

**Nota tipi locali**
- `NextManutenzioniLegacyDatasetRecord` (`nextManutenzioniDomain.ts:110-129`) resta l'unico tipo dominio reale di riferimento.
- `ManutenzioneLegacy` e `SelectedMaintenance` sono alias LOCALI introdotti nella patch in `NextMappaStoricoPage.tsx`, non tipi esportati già esistenti.
- Strategia consigliata per leggibilità:
  - `type ManutenzioneLegacy = NextManutenzioniLegacyDatasetRecord`
  - `type SelectedMaintenance = Partial<NextManutenzioniLegacyDatasetRecord> & { id: string }`
- `MezzoInfo` può restare tipo locale del file per dare nome al contratto inline esistente.

### Props nuove
- `storicoManutenzioni: ManutenzioneLegacy[]` — la lista completa del mezzo, già ordinata desc. Il parent passa `storicoMezzoOrdinato` qui. **Questa lista serve al ramo embedded per costruire la sidebar sinistra**.
- `kmAttuali?: number | null` — km attuali del mezzo, per il calcolo Δ km nella lista e nel dettaglio. Sorgente: `kmUltimoByTarga[activeTarga]` nel parent. `kmUltimoByTarga` è un `Record<string, number | null>`, non una `Map` (ref: `NextManutenzioniPage.tsx:783-816` costruzione, `:833` state, `:968` lettura).
- `onOpenDocument?: (record: ManutenzioneLegacy) => void` — handler per "Apri documento". Il parent implementa aprendo `sourceDocumentFileUrl` in nuova tab via `window.open`. Disattivato nel bottone se `!sourceDocumentId || !sourceDocumentFileUrl`.
- `onDownloadPdfSingle?: (record: ManutenzioneLegacy) => void` — handler per "Scarica PDF singolo". Il parent implementa invocando l'export PDF singolo mezzo con filtro sul record specifico, oppure (scelta implementativa) aprendo il PDF singolo del mezzo alla sezione della manutenzione selezionata. **Decisione implementativa del parent**.

### Props rimosse (o rese irrilevanti)
- `photoManager` — resta nel contratto per il ramo `photoManager` (`r.378`), ma il ramo `embedded=true` non lo consuma più (già oggi non lo consuma)
- `onOpenPdf` — resta nel contratto per retrocompatibilità, ma la tab `embedded=true` non lo espone più come bottone (lo "Scarica PDF singolo" passa da `onDownloadPdfSingle`, semanticamente diverso)

---

## 5. Specifica funzionale — 7 blocchi

### 5.1 Rimozioni (pulizia del ramo embedded)

Nel ramo `embedded=true` di `NextMappaStoricoPage`, eliminare:

- **Schema tecnico / viewer SVG**: blocco `viewerImageSrc` + `man2-detail-surface--viewer` (ref: `NextMappaStoricoPage.tsx:369-376`, `515-537`). Rimuovere anche la chiamata a `resolveNextManutenzioneTechnicalView(...)` nel ramo embedded. Il ramo non-embedded la mantiene.
- **Toggle vista Sinistra/Destra**: `DETAIL_VISTE` e bottoni `man2-vista-btn` (ref: `NextMappaStoricoPage.tsx:63`, `446-460`). Stato locale `vistaAttiva` diventa inutile nel ramo embedded — rimuoverlo o marcarlo come usato solo in non-embedded.
- **Card "Dettaglio mezzo" laterale**: `aside.man2-detail-card--side` con info mezzo e liste laterali (ref: `NextMappaStoricoPage.tsx:556-635`). Le info essenziali sono già nella striscia mezzo in alto di `NextManutenzioniPage`, non duplicarle.
- **KPI strip "Vista attiva / Record selezionato / Storico totale"** (ref: `NextMappaStoricoPage.tsx:540-553`). Informazione ridondante, via.
- **Bottoni fissi in fondo**: `Apri dossier mezzo`, `Apri quadro PDF`, `Apri fattura` condizionale, `Modifica manutenzione aperta` (ref: `NextMappaStoricoPage.tsx:638-655`). Spostati nei bottoni contestuali del pannello dettaglio destro.
- **Pannello "Manutenzione selezionata" attuale** (ref: `NextMappaStoricoPage.tsx:464-493`) e sezione materiali esistente (ref: `NextMappaStoricoPage.tsx:496-512`): sostituiti dal nuovo layout del pannello dettaglio destro.

### 5.2 Layout split view

Il ramo embedded renderizza una griglia a 2 colonne:
- Colonna sinistra fissa 420px
- Colonna destra flessibile
- Gap 16px
- Altezza minima 720px (scroll interno per entrambe le colonne, non dell'intera pagina)
- Contenitore esterno su sfondo crema `#f5f1e8`, bordo arrotondato 16px, padding 16px

**Prefisso CSS proposto**: `man2-detail-v2__*` (per distinguere da `man2-detail-*` esistente che non va toccato).

### 5.3 Colonna sinistra: lista storico

Contenuto della colonna sinistra:

**Header**:
- Titolo `STORICO MANUTENZIONI` in minuscolo espanso uppercase
- Badge count totale a destra in pill crema
- Background `#faf7f0`, border-bottom grigio chiaro

**Filtri a chip** (riga sotto header):
- Chip `Tutte (N)` attiva di default
- Chip per ogni tipo presente nello storico: `Mezzo (N)`, `Gomme (N)`, `Rimorchio (N)`, `Compressore (N)` (solo se il conteggio > 0)
- Chip attiva: fondo nero, testo bianco
- Chip inattiva: fondo trasparente, bordo `#d6d3cd`, testo `#57534e`
- Click su chip filtra la lista (stato locale nel componente)

**Lista scrollabile**:
- Altezza massima 640px, scroll interno
- Ogni voce: grid 3 colonne (data 60px / body flessibile / right auto)
- **Data**: mese/anno in alto in grigio piccolo, giorno grande nero sotto
- **Body**: titolo manutenzione in bold troncato, riga sotto con fornitore · km (grigio, troncata)
- **Right**: pill tipo (mezzo/gomme/rimorchio/compressore con colori distintivi) + sotto `+X.XXX km fa` in verde se delta > 0
- Voce selezionata: background `#faf3e1`, border-left 3px `#c9a86a`
- Hover: background `#faf7f0`
- Click toggla selezione (click su voce già selezionata deseleziona)
- Nota comportamento: la deselezione chiama `onSelectMaintenance(null)`. Il pannello destro torna allo stato vuoto.

**Fallback vuoto**: se lo storico è vuoto, messaggio centrato "Nessuna manutenzione per questo mezzo"

**Titolo voce (per "titolo")**:
- Preferenza: `sottotipo` se presente
- Fallback: prima frase della `descrizione` (fino a 60 caratteri o primo `.`)
- Ulteriore fallback: `tipo` capitalizzato

### 5.4 Colonna destra: pannello dettaglio

**Stato vuoto** (nessuna manutenzione selezionata):
- Centrato verticalmente e orizzontalmente
- Icona emoji 📋 dentro cerchio crema
- Titolo "Seleziona una manutenzione"
- Sottotitolo "Clicca una voce dalla lista a sinistra per vederne tutti i dettagli."

**Stato popolato** (record selezionato):

Header del pannello:
- Titolo grande (18px bold) = titolo record (stessa logica del §5.3)
- A destra del titolo: **4 bottoni contestuali testuali** su una riga:
  - `Modifica` (nero primario, background `#1a1a1a`, testo bianco) → invoca `onEditLatest`
  - `Apri dossier` (bianco bordo grigio) → invoca `onOpenDossier`
  - `Apri documento` (bianco bordo grigio) → invoca `onOpenDocument(record)`. **Disattivato** (`disabled`, opacità 0.35) se `!record.sourceDocumentId || !record.sourceDocumentFileUrl`
  - `Scarica PDF` (bianco bordo grigio) → invoca `onDownloadPdfSingle(record)`
- Meta riga sotto: `{data} · {sottotipo ?? '—'} · {fornitore ?? 'Fornitore non indicato'}` in grigio piccolo
- Background header `#faf7f0`, border-bottom grigio chiaro

Body del pannello (scrollabile internamente, max-height 680px):

**(1) KPI strip scura top**
- Background gradient scuro `#1a1a1a → #2a2a2a`, padding 14/18
- Grid 3 colonne
- Ogni KPI: label oro uppercase 9px + valore grande bianco
  - `Km intervento`: `{km formattato} km` (o `—` se null)
  - `Δ km da oggi`: calcolato come `kmAttuali - record.km`, formattato come `+X.XXX` (verde chiaro `#86efac` se > 0), `0`, o `—`
  - `Importo`: formatato come currency con `sourceDocumentCurrency ?? 'EUR'`, oppure `—` se `importo` null

**(2) Grid campi 2×2**
- `Tipo intervento`: pill colorata secondo tipo
- `Sottotipo`: testo, muted italic se mancante
- `Fornitore`: testo, muted italic se mancante
- `Ore di lavoro`: `{ore} h` se presente, altrimenti muted "Non registrate"

**(3) Sezione "Descrizione intervento"**
- Sezione con titolo uppercase piccolo
- Box `#faf7f0` bordo arrotondato, padding 14/16, line-height 1.55
- Contenuto: `record.descrizione`
- Se descrizione vuota: testo italic muted "Nessuna descrizione inserita"

**(4) Sezione condizionale "Dettagli intervento gomme"**
Appare SOLO se `record.tipo === "gomme"` E almeno uno di: `assiCoinvolti`, `gommePerAsse`, `gommeInterventoTipo`.
- Box gialla `#fef3c7`, bordo `#fde68a`
- Se `gommeStraordinario === true`: badge rosso "STRAORDINARIO" nel titolo sezione
- Righe label/valore:
  - `Assi coinvolti`: chip per ogni asse (es. "Anteriore", "Posteriore")
  - `Tipo intervento`: `gommeInterventoTipo` (es. "rotazione", "sostituzione")
  - Per ogni entry di `gommePerAsse`: riga `{asse} → {marca} · {misura} · {intervento}`

**(5) Sezione "Materiali / ricambi utilizzati"**
- Titolo + count pill
- Per ogni materiale: riga grid 2 colonne `{label}` sinistra + `{quantita} {unita}` destra in pill piccola
- Se vuoto: testo italic muted "Nessun materiale registrato per questo intervento"
- **Nessun costo** (non esiste nel dominio)

**(6) Sezione "Documento collegato"**
- Se presente: link cliccabile con emoji 📄 + id documento, sottolineato marrone. Click invoca `onOpenDocument(record)`
- Se assente: testo italic muted "Nessun documento allegato a questa manutenzione"

### 5.5 Preselezione da link esterno

Quando si arriva a `/next/manutenzioni?targa=X&recordId=Y`:
- Il parent già gestisce: imposta `selectedDetailRecordId=Y` + `view="mappa"` (ref: `NextManutenzioniPage.tsx:1225-1247`)
- Il componente riceve `selectedMaintenance` già popolato
- La lista sinistra deve **scrollare automaticamente** fino a mettere la voce selezionata in vista al mount/change
- Implementazione suggerita: `useEffect` su `selectedMaintenance?.id` con `ref.scrollIntoView({block: 'nearest'})`

### 5.6 Comportamento responsive

Target desktop primario. Su schermi < 900px:
- Split view collassa a colonna singola
- Lista sopra, dettaglio sotto
- Quando selezioni una voce dalla lista, smooth scroll al dettaglio
- Decisione implementativa: accettabile anche lasciare lo scroll naturale se più semplice

### 5.7 Accessibilità

- Bottoni testuali con `aria-label` dove il testo non basta
- Bottone `Apri documento` disabilitato: `disabled` attribute + `aria-disabled="true"`
- Righe lista: `role="button"`, `tabindex="0"`, supporto `Enter`/`Space` per selezionare
- Focus visibile su voce lista selezionata via keyboard

---

## 6. Vincoli tecnici

- **Zero any TypeScript**. Se serve un tipo per la nuova prop `storicoManutenzioni`, per `SelectedMaintenance` esteso o per `MezzoInfo`, definirlo nel file come alias locale; non assumere tipi esportati inesistenti.
- **Zero nuove librerie**: React + CSS nativo. Nessun componente UI library.
- **ESLint**: patch non deve introdurre nuovi errori. Lint globale può restare al baseline 582/567/15 ma non peggiorare.
- **Build**: `npm run build` deve passare.
- **Coerenza visiva**: colori e stili devono ricalcare la palette del resto di `/next/manutenzioni` (crema `#f5f1e8`, nero `#1a1a1a`, oro `#c9a86a`).

---

## 7. Test runtime richiesti al product owner post-patch

1. Aprire `/next/manutenzioni`, selezionare un mezzo dalla dropdown, cliccare tab "Dettaglio"
2. Verificare che lo schema tecnico del camion (Vista Sinistra/Destra SVG) **non compaia più**
3. Verificare che la card "Dettaglio mezzo" in fondo (con Targa/Autista/Categoria ecc. ripetuti) **non compaia più**
4. Verificare la presenza della split view: lista a sinistra + pannello vuoto a destra
5. Cliccare una voce della lista: il pannello a destra si popola con tutti i dettagli
6. Cliccare di nuovo sulla voce selezionata: si deseleziona, pannello destro torna allo stato vuoto
7. Testare i filtri a chip in cima alla lista (Tutte/Mezzo/Gomme/Rimorchio): la lista si filtra coerentemente
8. Selezionare una manutenzione di tipo **gomme** con dettagli (assi, marca, tipo): verificare che la **sezione gialla "Dettagli intervento gomme"** appaia nel pannello destro
9. Selezionare una manutenzione di tipo **mezzo**: verificare che la sezione gialla gomme **NON appaia**
10. Selezionare una manutenzione **con** documento collegato: bottone `Apri documento` attivo, click apre il PDF in nuova tab
11. Selezionare una manutenzione **senza** documento collegato: bottone `Apri documento` grigiato, non cliccabile
12. Cliccare `Modifica`: apre la tab "Nuova / Modifica" con la manutenzione selezionata
13. Cliccare `Apri dossier`: apre il dossier del mezzo
14. Cliccare `Scarica PDF`: scarica/genera PDF singolo
15. Aprire manualmente l'URL `/next/manutenzioni?targa=TI113417&recordId=<id_reale>`: la tab Dettaglio si apre con quella manutenzione già selezionata e visibile nella lista (scroll automatico)
16. Verificare che le altre 3 tab (Dashboard, Nuova/Modifica, Quadro manutenzioni PDF) continuino a funzionare come prima

---

## 8. Output richiesto da Codex al termine della patch

- `PATCH COMPLETATA` o `PATCH PARZIALE`
- `FILE LETTI`
- `FILE MODIFICATI` (previsti: `NextMappaStoricoPage.tsx`, `NextManutenzioniPage.tsx`, `next-mappa-storico.css` + docs `_live/` pertinenti)
- `RIMOZIONI CONFERMATE`: elenco delle 6 cose rimosse da §5.1
- `NUOVE PROPS CONTRATTO`: elenco effettivo (previste: `storicoManutenzioni`, `kmAttuali`, `onOpenDocument`, `onDownloadPdfSingle`; estensione `selectedMaintenance`)
- `STRATEGIA SCARICA PDF SINGOLO`: quale funzione esistente viene riusata e come viene filtrato il PDF sul singolo record
- `PREFISSO CSS USATO`: il prefisso scelto per le nuove classi (consigliato `man2-detail-v2__*`)
- `FILTRO LISTA RESPONSIVE`: breakpoint scelto per collasso colonna (default `< 900px` se non altrimenti specificato)
- `BUILD`: esito
- `LINT`: esito con delta rispetto al baseline 582/567/15
- `CHECKLIST VERIFICA RUNTIME`: i 16 punti del §7 riformattati
- `DOMANDE APERTE`

---

## 9. Divieti assoluti

- Vietato toccare il ramo `photoManager` di `NextMappaStoricoPage` (`r.378`)
- Vietato toccare il ramo default non-embedded di `NextMappaStoricoPage` (`r.659`)
- Vietato toccare le classi CSS `man2-*` e `ms-*` esistenti
- Vietato toccare domain, writer, barrier
- Vietato cambiare il contratto della route esterna (targa + recordId via query string)
- Vietato modificare altre tab di `/next/manutenzioni`
- Vietato introdurre nuove librerie
- Vietato reinterpretare il mockup: colori, posizioni, copy devono ricalcare il mockup fedelmente. Libertà concessa solo su: comportamento responsive < 900px, scelta esatta della label "titolo voce lista" dove il mockup usa testi fittizi
- Vietato inventare tipi esportati inesistenti: `MezzoInfo`, `SelectedMaintenance`, `ManutenzioneLegacy` in questa spec indicano alias LOCALI da introdurre nella patch, non tipi già presenti nel repo
- Vietato inventare campi di dati: se un campo del record serve e non esiste, fermarsi con `SERVE DECISIONE PRODUCT OWNER`
- Vietato creare change-report, continuity-report, audit, mirror in cartelle deprecate
- Vietato introdurre any TypeScript
- Vietato inserire Link/NavLink: continuare con pattern `navigate()` + `<button>` dove serve

---

## 10. Riferimenti

- Mockup visuale: `docs/_live/mockup/MOCKUP_DETTAGLIO_MANUTENZIONI_V3.html`
  - nota: il file mockup va salvato manualmente dal product owner in questo path prima dell'implementazione. Al momento della verifica spec il file potrebbe non essere ancora versionato.
- Audit preliminare: output PROMPT 21 (disponibile in chat, non salvato come file)
- File target: `src/next/NextMappaStoricoPage.tsx`, `src/next/NextManutenzioniPage.tsx`, `src/next/next-mappa-storico.css`
- Regole documentali: `AGENTS.md` sezione "REGOLA FILE DI DOCUMENTAZIONE"
- Spec correlate: `SPEC_QUADRO_MANUTENZIONI_PDF_NEXT.md` (tab sorella già implementata, utile come riferimento per stile bottoni e palette)
