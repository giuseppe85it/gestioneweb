# SPEC MEZZO EDIT MODAL NEXT — 2026-04-26

## 0. CONTESTO E OBIETTIVO

Questa SPEC definisce il nuovo modal `NextMezzoEditModal` per la modifica anagrafica di un mezzo dentro `NextDossierMezzoPage`, raggiungibile dalle route NEXT dossier mezzo. Il modal diventa il punto operativo di modifica anagrafica mezzo nella NEXT, in sostituzione della pagina `/next/mezzi`.

La SPEC descrive file, contratti, writer, deroga barriera, layout e comportamento runtime necessari per implementare il modal senza modificare la madre. Le decisioni sono vincolanti e derivano dal prompt di progetto, dagli audit `docs/audit/AUDIT_MEZZI_MADRE_VS_NEXT_2026-04-26.md`, `docs/audit/AUDIT_DOSSIER_MEZZO_LISTA_NEXT_2026-04-26.md`, `docs/audit/AUDIT_ARCHIVISTA_RIUSABILITA_EDIT_MEZZO_2026-04-26.md`, `docs/audit/CSS_ARCHIVISTA_NEXT_RAW_2026-04-26.md`, e dal codice reale verificato.

## 1. DECISIONI VINCOLANTI

- [✓] D1. Path componente modal: `src/next/components/NextMezzoEditModal.tsx`.
- [✓] D2. Path CSS modal: `src/next/components/next-mezzo-edit-modal.css`.
- [✓] D3. Path writer: `src/next/nextMezziWriter.ts`.
- [✓] D4. Funzioni writer esposte:
  - `updateNextMezzoAnagrafica(mezzoId: string, patch: Partial<Mezzo>): Promise<void>`
  - `deleteNextMezzo(mezzoId: string): Promise<void>`
- [✓] D5. Prefisso CSS: `mezmod-`. Nessuna collisione con `iai-`, `man-`, `mx-`, `mag-`, `man2-`.
- [✓] D6. Eliminazione mezzo: doppia conferma tramite modal di conferma dedicata, non `window.confirm`; conferma digitando la targa esatta.
- [✓] D7. Foto del mezzo: non gestita dal modal. Resta nella sezione Foto già presente in `NextDossierMezzoPage`.
- [✓] D8. Campi mostrati nel modal:
  - editabili: tutti i 27 campi del type `Mezzo` dichiarati in `src/pages/Mezzi.tsx:26`;
  - inclusi i 7 campi non coperti da Archivista: `manutenzioneProgrammata`, `manutenzioneDataInizio`, `manutenzioneDataFine`, `manutenzioneKmMax`, `manutenzioneContratto`, `autistaId`, `autistaNome`;
  - campi libretto svizzero read-only: visualizzati solo se popolati nel documento mezzo dentro `storage/@mezzi_aziendali`, senza aggiungerli al type `Mezzo` e senza scriverli.
- [✓] D9. Pagina `/next/mezzi`: tolta dal menu e dalla route operativa. La route deve diventare redirect a `/next/dossiermezzi`.
- [✓] D10. File da cancellare: `src/next/NextMezziPage.tsx`, `src/next/NextMezziDossierPage.tsx`.
- [✓] D11. Punto di ingresso del modal: bottone `+ Modifica` accanto al titolo `Dati tecnici` dentro `NextDossierMezzoPage`.
- [✓] D12. Persistenza: writer con pattern già attivo in Dossier Mezzo, cioè `runWithCloneWriteScopedAllowance` + `storageSync.setItemSync("@mezzi_aziendali", ...)`. Nessuna chiamata diretta a `firebase/firestore` o `firebase/storage`.
- [✓] D13. Barriera: aggiungere deroga in `src/utils/cloneWriteBarrier.ts` per scritture su `@mezzi_aziendali` quando la route è `/next/dossier/:targa` o `/next/dossiermezzi/:targa`, replicando i pattern `IA_LIBRETTO_ALLOWED_*` e `ARCHIVISTA_ALLOWED_*`.
- [✓] D14. Salvataggio: tutti i campi modificati vengono salvati in una singola `setItemSync`. In caso di errore, mostrare errore nel modal e non chiudere.
- [✓] D15. Annulla: chiude senza salvare, con avviso se esistono modifiche pending.
- [✓] D16. Stato modal: locale nel componente con `useState`. Niente Redux, niente context dedicato.

## 2. ARCHITETTURA FILE

### 2.1 File da creare

- `src/next/components/NextMezzoEditModal.tsx` (componente).
- `src/next/components/next-mezzo-edit-modal.css` (stili).
- `src/next/nextMezziWriter.ts` (writer).

### 2.2 File da modificare

- `src/next/NextDossierMezzoPage.tsx` (entry point del modal).
- `src/utils/cloneWriteBarrier.ts` (deroga).
- `src/App.tsx` (route `/next/mezzi` -> redirect).

### 2.3 File da cancellare

- `src/next/NextMezziPage.tsx`.
- `src/next/NextMezziDossierPage.tsx`.
- Non esiste un file CSS dedicato nella NEXT per Mezzi: nessun CSS `NextMezzi*` trovato sotto `src/next`.
- `src/pages/Mezzi.css` NON va cancellato perché è importato dalla NEXT esistente in `src/next/NextMezziPage.tsx:17` e `src/next/NextMezziDossierPage.tsx:7`.

## 3. CONTRATTO WRITER (nextMezziWriter.ts)

### 3.1 Funzioni esposte

```ts
export async function updateNextMezzoAnagrafica(
  mezzoId: string,
  patch: Partial<Mezzo>,
): Promise<void>;

export async function deleteNextMezzo(mezzoId: string): Promise<void>;
```

Il type `Mezzo` deve essere importato o ridefinito in modo coerente con il type madre verificato in `src/pages/Mezzi.tsx:26`. Il writer non deve esportare default.

### 3.2 Pattern interno

Il writer deve usare il pattern già attivo in Dossier Mezzo:

- `runWithCloneWriteScopedAllowance(...)`, verificato in `src/next/NextDossierMezzoPage.tsx:332`;
- `storageSync.setItemSync("@mezzi_aziendali", updatedArray, ...)`;
- nessun import diretto da `firebase/firestore`;
- nessun import diretto da `firebase/storage`;
- nessun uso di writer legacy della madre.

Flusso `updateNextMezzoAnagrafica`:

1. Validare `mezzoId`.
2. Leggere l'array corrente `@mezzi_aziendali`.
3. Trovare il mezzo con `id === mezzoId`.
4. Applicare il `patch` preservando campi non presenti nel patch.
5. Scrivere l'intero array aggiornato in una sola `setItemSync`.

Flusso `deleteNextMezzo`:

1. Validare `mezzoId`.
2. Leggere l'array corrente `@mezzi_aziendali`.
3. Filtrare il mezzo con `id === mezzoId`.
4. Scrivere l'array filtrato con `setItemSync`, usando opzioni coerenti con delete se richiesto dal wrapper.

### 3.3 Errori gestiti

- `mezzoId` vuoto: errore bloccante.
- Mezzo non trovato in `@mezzi_aziendali`: errore bloccante.
- `patch` vuoto: consentito solo come no-op esplicito se non ci sono modifiche dirty; il modal non deve chiamare il writer in questo caso.
- Errore `setItemSync`: propagato al modal; il modal mostra `errorMessage` e resta aperto.
- Campi libretto read-only non standard: preservati nel record raw, mai rimossi e mai scritti dal patch.
- Foto: `fotoUrl` e `fotoPath` devono essere preservati dal writer, non modificati dal modal.

## 4. DEROGA BARRIERA

### 4.1 Path da derogare

- Route: `/next/dossier/:targa`.
- Route: `/next/dossiermezzi/:targa`.
- Storage key: `@mezzi_aziendali`.

La verifica route deve operare sul pathname reale, quindi l'implementazione deve accettare path con targa dinamica dopo i prefissi `/next/dossier/` e `/next/dossiermezzi/`.

### 4.2 Pattern barriera

Pattern da replicare in `src/utils/cloneWriteBarrier.ts`:

- costanti `IA_LIBRETTO_ALLOWED_WRITE_PATH` e `IA_LIBRETTO_ALLOWED_STORAGE_KEYS`, verificate in `src/utils/cloneWriteBarrier.ts:92` e `src/utils/cloneWriteBarrier.ts:96`;
- helper dedicato `isAllowedArchivistaCloneWritePath`, verificato in `src/utils/cloneWriteBarrier.ts:258`, come pattern di riferimento per il controllo route;
- costante `ARCHIVISTA_ALLOWED_STORAGE_KEYS`, verificata in `src/utils/cloneWriteBarrier.ts:103`;
- ramo `storageSync.setItemSync` per `@mezzi_aziendali`, verificato in `src/utils/cloneWriteBarrier.ts:344` e `src/utils/cloneWriteBarrier.ts:372`.

La nuova deroga deve essere additiva e non deve indebolire le deroghe esistenti.

### 4.3 Nuove costanti suggerite

```ts
const DOSSIER_MEZZO_EDIT_ALLOWED_WRITE_PATH_PREFIXES = [
  "/next/dossier/",
  "/next/dossiermezzi/",
] as const;

const DOSSIER_MEZZO_EDIT_ALLOWED_STORAGE_KEYS = new Set(["@mezzi_aziendali"]);

function isAllowedDossierMezzoEditCloneWritePath(pathname: string): boolean {
  return DOSSIER_MEZZO_EDIT_ALLOWED_WRITE_PATH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
}
```

La SPEC usa le route funzionali `/next/dossier/:targa` e `/next/dossiermezzi/:targa`; nel codice il match deve essere implementato come controllo di prefisso sul pathname.

Il nuovo helper `isAllowedDossierMezzoEditCloneWritePath(pathname)` deve essere invocato dai rami `storageSync.setItemSync` esistenti per `@mezzi_aziendali`, in OR con i check già presenti per IA Libretto e Archivista alle righe verificate `src/utils/cloneWriteBarrier.ts:344` e `src/utils/cloneWriteBarrier.ts:372`. La modifica deve essere additiva, mai sostitutiva.

## 5. COMPONENTE NextMezzoEditModal

### 5.1 Props

```ts
export interface NextMezzoEditModalProps {
  mezzoId: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (mezzo: Mezzo) => void;
  onDeleted?: (mezzoId: string) => void;
}
```

### 5.2 Stato locale (useState)

- `formData: Mezzo | null`.
- `originalData: Mezzo | null`.
- `rawLibrettoFields: Record<string, unknown>`.
- `isDirty: boolean`.
- `isSaving: boolean`.
- `errorMessage: string | null`.
- `showDeleteConfirm: boolean`.
- `deleteConfirmInput: string`.
- Stato autisti per select: lista derivata da `@colleghi`, coerente con la sorgente madre `COLLEGHI_KEY = "@colleghi"` in `src/pages/Mezzi.tsx:13` e con il select autista in `src/pages/Mezzi.tsx:1275`. Il reader NEXT verificato è `readNextAnagraficheFlottaSnapshot`, che legge `@colleghi` in `src/next/nextAnagraficheFlottaDomain.ts:767` e restituisce `colleghi` in `src/next/nextAnagraficheFlottaDomain.ts:841`. Il type `NextAnagraficheFlottaCollegaItem` non espone un campo ruolo/autista (`src/next/nextAnagraficheFlottaDomain.ts:64`), quindi lo stato contiene tutti i colleghi, non una lista filtrata per ruolo.

### 5.3 Caricamento iniziale

Quando `isOpen` diventa `true`:

1. leggere `@mezzi_aziendali`;
2. trovare il record con `id === mezzoId`;
3. popolare `formData` e `originalData`;
4. estrarre i campi libretto read-only non standard presenti nel record raw;
5. leggere la lista autisti da `@colleghi` tramite `readNextAnagraficheFlottaSnapshot`: il reader legge il dataset in `src/next/nextAnagraficheFlottaDomain.ts:767` e restituisce `colleghi` in `src/next/nextAnagraficheFlottaDomain.ts:841`. Poiché il codice reale non espone un campo ruolo/autista nei colleghi (`src/next/nextAnagraficheFlottaDomain.ts:64`), la select usa tutti i colleghi;
6. azzerare `errorMessage`, `showDeleteConfirm`, `deleteConfirmInput`, `isSaving`.

Se il mezzo non viene trovato, il modal mostra errore e non renderizza il form editabile.

### 5.4 Layout struttura DOM

```txt
mezmod-overlay
  mezmod-modal
    mezmod-modal-head
      mezmod-modal-head__title
      mezmod-modal-head__close
    mezmod-spread
      mezmod-page mezmod-page--left
        righe amministrative
      mezmod-page mezmod-page--right
        righe tecniche libretto
    mezmod-modal-foot
      mezmod-btn-del
      mezmod-btn-cancel
      mezmod-btn-save
    mezmod-confirm-overlay (solo se showDeleteConfirm)
      mezmod-confirm-modal
```

Container modal:

- larghezza circa `1080px`;
- sfondo `#eceae2`;
- border-radius `14px`;
- border `1px solid #777`;
- blocchi verticali: header, spread, footer.

Header `mezmod-modal-head`:

- sfondo `#2f2618`;
- testo `#fff8ee`;
- padding `12px 18px`;
- sinistra: `Modifica dati mezzo · libretto di circolazione`;
- destra: bottone `Chiudi`, classe `mezmod-modal-head__close`, pill stondata con bordo bianco trasparente.

Spread `mezmod-spread`:

- grid a 2 colonne;
- pagina sinistra `440px`;
- pagina destra fluida;
- bordo sopra e sotto `1.5px solid #777`;
- sfondo tra pagine `#cfc9bc`;
- gap `0`;
- ogni pagina con sfondo `#eceae2`.

Pagina sinistra:

1. Riga `Detentore`: rail verticale `Detentore`, campo `N. AVS` mono read-only; riga nascosta se il campo libretto è assente.
2. Riga `Ragione sociale`: rail `Ragione sociale`, campo `Proprietario`, editabile, mappa a `proprietario`.
3. Riga `Domicilio`: rail `Domicilio`, split verticale con `Indirizzo` e `Località`, read-only; intera riga nascosta se entrambi assenti.
4. Riga `Dati titolare`: split orizzontale con `Stato d'origine` read-only se presente e `Assicurazione` editabile.
5. Strip annotazioni `mezmod-strip`: `Annotazioni cantonali` / `Decisioni autorità` / `Annotazioni`.
6. Riga textarea `Annotazioni`: textarea altezza `140px`, non resizable, mappa a `note`.
7. Riga `Autista`: select `Autista abituale`, mappa a `autistaId` + `autistaNome`; input mono disabled `ID autista`.
8. Riga `Manut. programmata`: rail verde `mezmod-rail--green`, main verde chiaro, header `Contratto manutenzione programmata`, checkbox `attivo`, badge `RENAULT / DAF`, sotto-griglia 2x2 con i 5 campi manutenzione programmata. Se `manutenzioneProgrammata` è false, i 4 input sotto restano visibili ma disabled.

Pagina destra:

1. Riga targa `A / 15`: code box, plate blu con `★` e `CH`, input targa mono large, side `Colore`.
2. Riga `19`: `Genere veicolo` read-only, nascosta se assente.
3. Riga `D / 21`: `Marca e tipo`, computed visuale `marca · modello`; in edit usare due input separati `marca` e `modello`.
4. Riga `E / 23`: `Telaio`, input mono, mappa a `telaio`.
5. Riga `25`: `Carrozzeria` read-only se presente + side `Colore`; stesso campo `colore` della riga targa, sincronizzato.
6. Tech grid `mezmod-tech`: sinistra `Numero matricola`, `Approvazione tipo`, `Cilindrata`, `Potenza`; destra `Peso a vuoto`, `Carico utile/sella`, `Peso totale`, `Peso totale rimorchio`, `Carico sul letto`, `Peso rimorchiabile`. I campi libretto sono read-only e nascosti se vuoti. `massaComplessiva` è mappata a `Peso totale` solo quando il campo libretto corrispondente non è presente.
7. Riga `B / 36`: `Prima immatricolazione`, mappa a `dataImmatricolazione`, side `Luogo / data rilascio` read-only se presente.
8. Riga `38`: `Ultimo collaudo`, mappa a `dataUltimoCollaudo`, sfondo `#dedad0`.
9. Riga `39`: `Prossimo collaudo / revisione`, mappa a `dataScadenzaRevisione`, sfondo `#dedad0`.
10. Banner `Registrato`: sempre visibile, allineato a destra, dot verde `#2d8a4e`, testo `#1e6e3c`.

Il banner `Registrato` è puramente decorativo, statico, sempre visibile, non condizionale. Non riflette stato reale del mezzo. Non attivabile, non disattivabile.

Footer `mezmod-modal-foot`:

- sfondo `#faf8f3`;
- padding `12px 18px`;
- gap `10px`;
- sinistra: `Elimina mezzo`, classe `mezmod-btn-del`;
- destra: `Annulla`, classe `mezmod-btn-cancel`, e `Salva modifiche`, classe `mezmod-btn-save`.

Modal conferma eliminazione:

- sub-component nello stesso file `NextMezzoEditModal.tsx`;
- overlay sopra il modal edit;
- titolo `Conferma eliminazione mezzo`;
- testo `Per confermare l'eliminazione, digita la targa esatta del mezzo: <TARGA>`;
- input testo;
- bottone `Elimina definitivamente` rosso disabled finché input diverso dalla targa esatta;
- bottone `Annulla`;
- conferma: `deleteNextMezzo(mezzoId)`, poi `onDeleted(mezzoId)` e `onClose()`.

### 5.5 Mappatura campi → type Mezzo

| Input UI | Classe CSS | Tipo HTML | Campo type Mezzo | Editable/readonly | Obbligatorio |
|---|---|---|---|---|---|
| ID mezzo | non renderizzato | hidden | `id` | readonly | sì |
| Tipo | `mezmod-input` | select | `tipo` | editable | no |
| Categoria | `mezmod-input` | text/select coerente con dati esistenti | `categoria` | editable | no |
| Targa | `mezmod-plate__input` | text | `targa` | editable | sì |
| Marca | `mezmod-input` | text | `marca` | editable | sì |
| Modello | `mezmod-input` | text | `modello` | editable | sì |
| Telaio | `mezmod-input mezmod-input--mono` | text | `telaio` | editable | no |
| Colore | `mezmod-input` | text | `colore` | editable | no |
| Cilindrata | `mezmod-input` | text | `cilindrata` | editable | no |
| Potenza | `mezmod-input` | text | `potenza` | editable | no |
| Peso totale / Massa complessiva | `mezmod-input` | text | `massaComplessiva` | editable se non sostituito da libretto read-only | no |
| Proprietario | `mezmod-input` | text | `proprietario` | editable | no |
| Assicurazione | `mezmod-input` | text | `assicurazione` | editable | no |
| Prima immatricolazione | `mezmod-input mezmod-input--date` | date | `dataImmatricolazione` | editable | sì |
| Prossimo collaudo / revisione | `mezmod-input mezmod-input--date` | date | `dataScadenzaRevisione` | editable | no |
| Ultimo collaudo | `mezmod-input mezmod-input--date` | date | `dataUltimoCollaudo` | editable | no |
| Manutenzione programmata attiva | `mezmod-mp-head__check` | checkbox | `manutenzioneProgrammata` | editable | no |
| Inizio contratto | `mezmod-input mezmod-input--date` | date | `manutenzioneDataInizio` | editable, disabled se non attiva | no |
| Prossima scadenza | `mezmod-input mezmod-input--date` | date | `manutenzioneDataFine` | editable, disabled se non attiva | no |
| Km massimi | `mezmod-input` | text | `manutenzioneKmMax` | editable, disabled se non attiva | no |
| Note contratto | `mezmod-input` | text | `manutenzioneContratto` | editable, disabled se non attiva | no |
| Annotazioni | `mezmod-textarea` | textarea | `note` | editable | no |
| Autista abituale | `mezmod-input` | select | `autistaId` | editable | no |
| Nome autista | non renderizzato come input separato | derived | `autistaNome` | aggiornato dalla select | no |
| Marca/modello legacy | non renderizzato | derived | `marcaModello` | ricalcolato sempre da marca + modello al salvataggio | no |
| Foto URL | non gestito dal modal | none | `fotoUrl` | preservato | no |
| Foto path | non gestito dal modal | none | `fotoPath` | preservato | no |

Campi libretto svizzero read-only opzionali: `numeroMatricola`, `approvazioneTipo`, `statoOrigine`, `indirizzo`, `localita`, `pesoVuoto`, `caricoUtileSella`, `pesoTotale`, `pesoTotaleRimorchio`, `caricoSulLetto`, `pesoRimorchiabile`, `genereVeicolo`, `carrozzeria`, `luogoDataRilascio`, `annotazioniCantonali`, `decisioniAutorita`, `numeroAvs`. Questi campi sono letti dal record raw solo se presenti, non aggiunti al type `Mezzo`, non scritti dal writer.

### 5.6 Validazione

Allineata alla madre in `src/pages/Mezzi.tsx:658`:

- `targa`: obbligatoria.
- `marca`: obbligatoria.
- `modello`: obbligatorio.
- `dataImmatricolazione`: obbligatoria.

Il modal mostra l'errore in banner rosso in alto e non invoca il writer se la validazione fallisce.

### 5.7 Salvataggio

Flusso:

1. Calcolare dirty fields confrontando `formData` e `originalData`.
2. Se non ci sono modifiche, chiudere o restare aperto senza chiamare il writer.
3. Validare i campi obbligatori.
4. `setIsSaving(true)`.
5. `updateNextMezzoAnagrafica(mezzoId, dirtyFields)`.
6. Se la chiamata riesce, chiamare `onSaved(updatedMezzo)` e `onClose()`.
7. Se la chiamata fallisce, `setErrorMessage(...)`, `setIsSaving(false)`, modal aperto.

Il bottone `Salva modifiche` è disabled durante save e mostra label `Salvataggio...`.

### 5.8 Eliminazione

Flusso:

1. Click `Elimina mezzo`.
2. `setShowDeleteConfirm(true)`.
3. Utente digita la targa esatta.
4. Il bottone `Elimina definitivamente` resta disabled finché `deleteConfirmInput !== formData.targa`.
5. Alla conferma: `deleteNextMezzo(mezzoId)`.
6. Successo: `onDeleted(mezzoId)` e `onClose()`.
7. Errore: banner rosso nel modal di conferma o nel modal principale, senza chiudere.

### 5.9 Comportamenti chiusura

- Click fuori dal modal: non chiude.
- ESC senza modifiche pending: chiude.
- ESC con modifiche pending: apre un sub-modal di conferma dedicato, non `window.confirm`.
- `Annulla` senza modifiche: chiude.
- `Annulla` con modifiche: apre lo stesso sub-modal di conferma dedicato.
- `Chiudi` header segue lo stesso comportamento di `Annulla`.

Sub-modal modifiche non salvate:

- titolo: `Modifiche non salvate`;
- testo: `Hai modifiche non salvate. Vuoi davvero chiudere senza salvare?`;
- bottone `Annulla`: resta nel modal edit;
- bottone `Chiudi senza salvare`: chiude e scarta le modifiche;
- coerente con il divieto D6 di usare `window.confirm`.

## 6. CSS (next-mezzo-edit-modal.css)

### 6.1 Variabili colore

- `#eceae2` sfondo modal e pagine.
- `#2f2618` header.
- `#777` bordi principali.
- `#aaa` bordi interni.
- `#1f3a6e` plate blu.
- `#2d8a4e` azione save e dot registrato.
- `#a32d2d` delete.
- `#1e6e3c` testo verde.
- `#c9dfc6` manutenzione header.
- `#d6e8d4` rail green.
- `#f0f6ee` sfondo manutenzione.
- `#faf8f3` footer.
- `#fff8ee` testo header.
- `#cfc9bc` sfondo tra pagine.
- `#dedad0` righe collaudo.
- `#e7e2d8` code box.

### 6.2 Selettori principali

- `mezmod-modal`
- `mezmod-modal-head`
- `mezmod-modal-head__close`
- `mezmod-spread`
- `mezmod-page`
- `mezmod-row`
- `mezmod-rail`
- `mezmod-code`
- `mezmod-main`
- `mezmod-side`
- `mezmod-split-h`
- `mezmod-split-v`
- `mezmod-tech`
- `mezmod-tech-left`
- `mezmod-tech-right`
- `mezmod-field`
- `mezmod-label`
- `mezmod-input`
- `mezmod-input--mono`
- `mezmod-input--date`
- `mezmod-textarea`
- `mezmod-row--plate`
- `mezmod-row--collaudo`
- `mezmod-strip`
- `mezmod-plate`
- `mezmod-plate__side`
- `mezmod-plate__star`
- `mezmod-plate__country`
- `mezmod-plate__input`
- `mezmod-banner`
- `mezmod-banner-dot`
- `mezmod-rail--green`
- `mezmod-row--green`
- `mezmod-mp-head`
- `mezmod-mp-head__label`
- `mezmod-mp-head__check`
- `mezmod-mp-head__badge`
- `mezmod-modal-foot`
- `mezmod-btn-del`
- `mezmod-btn-cancel`
- `mezmod-btn-save`
- `mezmod-confirm-overlay`
- `mezmod-confirm-modal`

### 6.3 Riferimento stilistico

Il riferimento visivo è il dump CSS Archivista `docs/audit/CSS_ARCHIVISTA_NEXT_RAW_2026-04-26.md`, in particolare le strutture `iai-*` usate dal flusso libretto. Il nuovo modal non deve importare classi `iai-*`: deve replicare il linguaggio visivo con classi `mezmod-*` dedicate.

## 7. INTEGRAZIONE NextDossierMezzoPage

### 7.1 Modifiche al render

In `src/next/NextDossierMezzoPage.tsx`, nella sezione `Dati tecnici` verificata in `src/next/NextDossierMezzoPage.tsx:514`, aggiungere il bottone `+ Modifica` accanto al titolo. Il click esegue `setShowEditModal(true)`.

### 7.2 Stato aggiunto

```ts
const [showEditModal, setShowEditModal] = useState(false);
```

### 7.3 Render del modal

```tsx
<NextMezzoEditModal
  mezzoId={mezzo.id}
  isOpen={showEditModal}
  onClose={() => setShowEditModal(false)}
  onSaved={handleMezzoSaved}
  onDeleted={handleMezzoDeleted}
/>
```

Il modal deve essere renderizzato nella pagina dossier mezzo e non nel router globale.

### 7.4 Refresh post-save

Dopo `onSaved`, `NextDossierMezzoPage` deve rileggere lo snapshot con `readNextDossierMezzoCompositeSnapshot(targa)` e aggiornare la vista legacy/composita già usata dalla pagina, replicando il pattern di refresh presente dopo delete documento in `src/next/NextDossierMezzoPage.tsx:336`.

### 7.5 Navigazione post-delete

Dopo `onDeleted`, navigare a `/next/dossiermezzi`.

## 8. ROUTE /next/mezzi

### 8.1 Decisione

- Togliere `/next/mezzi` dal menu di navigazione NEXT.
- In `src/App.tsx`, la route `/next/mezzi` non deve più montare `NextMezziPage`.
- La route deve diventare redirect a `/next/dossiermezzi`.
- Le route dossier correnti restano:
  - `/next/dossiermezzi`, verificata in `src/App.tsx:435`;
  - `/next/dossiermezzi/:targa`, verificata in `src/App.tsx:443`;
  - `/next/dossier/:targa`, verificata in `src/App.tsx:451`.

### 8.2 File da cancellare conseguentemente

Vedi sezione 2.3:

- `src/next/NextMezziPage.tsx`;
- `src/next/NextMezziDossierPage.tsx`;
- eventuale CSS associato solo se esiste sotto `src/next` e non è condiviso da altri moduli.

## 9. CHECKLIST CHIUSURA SCRIVENTE (10 PUNTI)

1. Zero disabled buttons senza business reason.
2. Zero alert `read-only` in codice.
3. Zero scritture solo su React state senza Firestore/Storage persistence.
4. Tutti i writer passano da wrapper autorizzati. Per questo modulo: `storageSync` via writer dedicato e scope `runWithCloneWriteScopedAllowance`; nessuna chiamata diretta Firebase.
5. `cloneWriteBarrier` ha deroga esplicita per il modulo.
6. Storage rules deployate: non applicabile al modal, perché non gestisce upload file.
7. Browser end-to-end test passa.
8. Test `rimuovi madre, modulo standalone`: dati persistono dopo refresh.
9. Cross-audit Codex + Claude Code conferma punti 1-7.
10. Confronto 1:1 con madre: ogni azione madre pertinente ha equivalente NEXT con stesso effetto.

## 10. ORDINE DI IMPLEMENTAZIONE FILE-PER-FILE

1. `src/next/nextMezziWriter.ts` (writer).
2. `src/utils/cloneWriteBarrier.ts` (deroga).
3. `src/next/components/next-mezzo-edit-modal.css` (stili).
4. `src/next/components/NextMezzoEditModal.tsx` (componente).
5. `src/next/NextDossierMezzoPage.tsx` (integrazione + bottone).
6. `src/App.tsx` (route `/next/mezzi` redirect).
7. Cancellazione `src/next/NextMezziPage.tsx`.
8. Cancellazione `src/next/NextMezziDossierPage.tsx`.

## 11. NOTE DI VERIFICA POST-IMPLEMENTAZIONE

- Verificare apertura modal da `Dati tecnici` con bottone `+ Modifica`.
- Verificare edit di tutti i campi del type `Mezzo` effettivamente renderizzati.
- Verificare che `fotoUrl` e `fotoPath` siano preservati e non gestiti dal modal.
- Verificare delete con typing della targa esatta.
- Verificare manutenzione programmata: checkbox on/off, input disabled quando off, salvataggio dei 5 campi.
- Verificare cambio autista: `autistaId` e `autistaNome` coerenti dopo salvataggio.
- Verificare refresh pagina dopo save e persistenza dopo reload.
- Verificare navigazione a `/next/dossiermezzi` dopo delete.
- Verificare nessuna regressione sulla sezione Foto già presente nel Dossier.
- Verificare `/next/mezzi` redirect a `/next/dossiermezzi`.
- Verificare menu NEXT senza voce operativa `/next/mezzi`.
- Verificare build TypeScript.
- Verificare lint sui file toccati.
- Verificare grep: nessun import diretto da `firebase/firestore` o `firebase/storage` nei nuovi writer/componenti.
- Verificare `cloneWriteBarrier.ts`: deroga presente solo per route dossier mezzo e `@mezzi_aziendali`.
