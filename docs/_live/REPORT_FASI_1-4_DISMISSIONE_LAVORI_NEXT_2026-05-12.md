# REPORT FASI 1-4 DISMISSIONE LAVORI NEXT - 2026-05-12

> Generato da Codex al termine dell'esecuzione del mega-prompt fasi 1-4.
> Riferimento SPEC: docs/product/SPEC_DISMISSIONE_LAVORI_NEXT.md
> Riferimento Audit base: docs/_live/AUDIT_DISMISSIONE_LAVORI_NEXT_2026-05-12.md
> Stato: FASI 1-4 PASS dopo PROMPT 13; pronto per cross-audit Claude Code e gate manuale runtime.

## 1. Sintesi esiti

| Fase | Nome | Esito | Durata stimata | File toccati count |
|---|---|---:|---:|---:|
| 1 | Estensione shape @manutenzioni | PASS | ~20 min | 1 |
| 2 | Nuovi writer manutenzione daFare | PASS | ~35 min | 2 |
| 3 | Migrazione una tantum | PASS (aspettativa backlink corretta da 41 a 17 validi: i 24 mancanti erano orfani preesistenti) | ~45 min | 1 |
| 4 | Repunting lettori indiretti | PASS | ~90 min | 9 |
| 5 | Report audit finale | REPORT AGGIORNATO | ~15 min | 1 |

## 2. FASE 1 - Estensione shape @manutenzioni

Esito: PASS.

File modificato: `src/next/domain/nextManutenzioniDomain.ts`.

Campi aggiunti alla shape e propagati in lettura/sanitizer permissivo:
`stato`, `dataProgrammata`, `origineTipo`, `origineRefId`, `origineRefKey`, `segnalatoDa`, `eseguitoDa`, `urgenza`.

Commento regola fallback inserito:

```ts
// Regola fallback legacy: i record @manutenzioni senza stato esplicito sono letti come eseguiti se hanno segnali di esecuzione (data/dataEsecuzione, km/ore, fornitore/eseguito o importo); altrimenti restano da fare.
```

Checkpoint 1: PASS. `npx eslint src/next/domain/nextManutenzioniDomain.ts` PASS con solo warning informativo `baseline-browser-mapping`; `npm run build` PASS; `rg` conferma gli 8 campi; nessun file fuori perimetro Fase 1 modificato.

## 3. FASE 2 - Nuovi writer manutenzione daFare

Esito: PASS.

Collocazione: `src/next/writers/nextManutenzioneDaFareCreateWriter.ts`.

Motivazione: modulo dedicato per tutti e tre i writer, senza toccare chiamanti UI e senza disabilitare la regola ESLint `react-refresh/only-export-components` sul componente `NextAutistiAdminNative.tsx`.

Funzioni esportate:
- `createManutenzioneDaFareFromSegnalazione`
- `createManutenzioneDaFareFromControllo`
- `createManutenzioneDaFareFromEvento`

Shape effettiva record nuovo:

```json
{
  "id": "<nuovo-id>",
  "tipo": "mezzo",
  "targa": "<targa>",
  "descrizione": "<descrizione>",
  "data": null,
  "stato": "daFare",
  "dataProgrammata": null,
  "urgenza": "alta|media|bassa",
  "segnalatoDa": "<origine>",
  "eseguitoDa": null,
  "origineTipo": "segnalazione|controllo|manuale",
  "origineRefId": "<id origine|null>",
  "origineRefKey": "@segnalazioni_autisti_tmp|@controlli_mezzo_autisti|null",
  "km": null,
  "ore": null,
  "fornitore": null,
  "importo": null,
  "sottotipo": null,
  "materiali": []
}
```

Barrier estesa: SI. `src/utils/cloneWriteBarrier.ts` aggiunge scope `centro_controllo_manutenzione_dafare_create_write`, key `@manutenzioni`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, path `/next/centro-controllo`, `/next/autisti-admin`, `/next/autisti-inbox`.

Vecchi writer intatti: SI. `rg` conferma `createLavoroFromSegnalazione`, `createLavoroFromControllo` e chiamate UI ancora presenti in `src/next/autistiInbox/NextAutistiAdminNative.tsx`; `git diff` sui chiamanti UI e su `src/next/nextLavoroCreateWriter.ts` e' vuoto.

Checkpoint 2: PASS. `npx eslint` sui file modificati PASS con solo warning informativo `baseline-browser-mapping`; `npm run build` PASS; nessuna UI migrata ai nuovi writer.

## 4. FASE 3 - Migrazione una tantum

Esito: PASS dopo correzione aspettativa backlink PROMPT 12/13.

Aggiornamento PROMPT 11/12/13: la diagnosi PROMPT 10 ha confermato Ipotesi A (`dotenv` assente nello script). Lo Step A ha patchato lo script con caricamento esplicito di `backend/internal-ai/.env` e riuso di `getInternalAiFirebaseAdminReadonlyContext`. Lo Step B ha migrato 18 record e riscritto 15 backlink segnalazioni + 2 backlink controlli. La diagnosi PROMPT 12 ha confermato che i 24 "mancanti" sono orfani preesistenti: puntano a id lavoro non presenti nei 18 `@lavori` migrati. Aspettativa corretta: 17 backlink validi riscritti su 17 validi attesi.

Path script: `scripts/oneoff/migrate-lavori-to-manutenzioni.cjs`.

Prima run output letterale:

```text
ESITO: FAIL
Firebase Admin non pronto: credential.mode=missing
```

Seconda run output idempotenza: NON ESEGUITA nel PROMPT 11 per STOP operativo basato sull'aspettativa numerica poi corretta.

Divergenze pre-check post-fix: 0.

Record migrati: 18.

Backlink validi riscritti: 15 segnalazioni + 2 controlli = 17/17.

Rollback eseguito: NO. Non richiesto: la migrazione ha scritto i 18 record target e i 17 backlink validi.

Checkpoint 3 iniziale PROMPT 9: FAIL. Motivo tecnico: `credential.mode=missing`; risolto nel PROMPT 11.

Checkpoint 3 post-diagnosi PROMPT 12/13: PASS. La run ha scritto i 18 record `from-lavoro-*` in `@manutenzioni` e ha riscritto tutti i backlink validi verso i 18 lavori migrati. I 24 residui sono orfani preesistenti e restano invariati per decisione A.

## 5. FASE 4 - Repunting lettori indiretti

Esito: PASS.

Fonte dati repuntata da `@lavori` a `@manutenzioni`:
- Categoria A: `stato === "daFare"`.
- Categoria B: tutti gli stati.

File modificati:
- `src/next/NextHomePage.tsx`
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextCentroControlloParityPage.tsx`
- `src/next/components/NextCentroControlloSinottica.tsx`
- `src/next/centroControllo/archivioStorico/hooks/useArchivioData.ts`
- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/nextOperativitaTecnicaDomain.ts`
- `src/utils/pdfEngine.ts`

Lettori repuntati:
- F-bis.1 Home: `readNextLavoriInAttesaSnapshot()` -> `readNextManutenzioniDaFareSnapshot()`.
- F-bis.2 Manutenzioni KPI: conteggio per targa da `readNextManutenzioniDaFareSnapshot()`.
- F-bis.3 Sinottica: `lavoriAperti` popolato da manutenzioni `daFare`; chip e KPI navigano a `/next/manutenzioni?recordId=...`.
- F-bis.4 Archivio storico: rimossa lettura `readNextLavoriArchivioSnapshot()`, feed manutenzioni da `@manutenzioni` tutti gli stati.
- F-bis.5 Dossier mezzo: sezione lavori alimentata da `readNextMezzoManutenzioniSnapshot()` e resa come manutenzioni da fare/eseguite.
- F-bis.6 Operativita tecnica: snapshot tecnico da `readNextMezzoManutenzioniSnapshot()`, contatori aperti/chiusi su `stato`.
- F-bis.20 PDF Dossier: payload invariato nei nomi esterni, ma contenuto e label renderizzati come manutenzioni.

Helper nuovi in `nextManutenzioniDomain`: nessuno in Fase 4. Riutilizzato `readNextManutenzioniDaFareSnapshot` gia' aggiunto in Fase 1.

Label aggiornate:
- `Lavori aperti` -> `Manutenzioni da fare`
- `Lavori in attesa` -> `Manutenzioni da fare`
- `Lavori urgenti` -> `Manutenzioni urgenti`
- `Segnalazioni aperte` -> `Manutenzioni da fare`
- Dossier `Lavori / In attesa / Eseguiti` -> `Manutenzioni / Da fare / Eseguite`
- PDF Dossier `Lavori` -> `Manutenzioni`

Verifica fuori perimetro: `git diff --name-only` su Chat IA/IA interna/backend IA, file modulo Lavori NEXT vietati, `App.tsx`, `nextData.ts`, `NextLegacyStorageBoundary` e `src/pages` e' vuoto.

Checkpoint 4: PASS. `npm run build` PASS; eslint sui file modificati PASS con warning non bloccanti preesistenti nel motore PDF; nessuno script di migrazione eseguito; nessuna scrittura Firestore.

## 6. Stato Firestore post-migrazione

- Stato: migrazione completata rispetto ai backlink validi; orfani preesistenti documentati e invariati.
- `@lavori`: 18 record, invariati.
- `@manutenzioni`: 74 record totali, inclusi 18 record migrati con id `from-lavoro-*`.
- `@segnalazioni_autisti_tmp`: 36 record totali, 32 con `linkedLavoroId`, 15 backlink validi riscritti a id manutenzione `from-lavoro-*`, 17 orfani preesistenti invariati.
- `@controlli_mezzo_autisti`: 349 record totali, 9 con `linkedLavoroId`/`linkedLavoroIds`, 2 record con backlink valido riscritto a id manutenzione `from-lavoro-*`, 7 orfani preesistenti invariati.
- Backlink validi attesi: 17. Backlink validi riscritti: 17. Esito: 100%.
- Orfani preesistenti: 24 record origine, 27 occorrenze link orfane; elenco completo in sezione 16.

## 7. File toccati totale (cross-fase)

- `src/next/domain/nextManutenzioniDomain.ts`
- `src/utils/cloneWriteBarrier.ts`
- `src/next/writers/nextManutenzioneDaFareCreateWriter.ts`
- `scripts/oneoff/migrate-lavori-to-manutenzioni.cjs`
- `src/next/NextHomePage.tsx`
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextCentroControlloParityPage.tsx`
- `src/next/components/NextCentroControlloSinottica.tsx`
- `src/next/centroControllo/archivioStorico/hooks/useArchivioData.ts`
- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/nextOperativitaTecnicaDomain.ts`
- `src/utils/pdfEngine.ts`
- `docs/product/SPEC_DISMISSIONE_LAVORI_NEXT.md`
- `docs/_live/REPORT_FASI_1-4_DISMISSIONE_LAVORI_NEXT_2026-05-12.md`

## 8. File NON toccati come da decisione J.10 (chat IA)

Verifica `git diff --name-only` vuota su:
- `src/next/chat-ia/**`
- `src/next/internal-ai/**`
- `backend/internal-ai/**`
- `src/next/internal-ai/InternalAiMezzoCard.tsx`

## 9. Script di migrazione presente nel repo

`scripts/oneoff/migrate-lavori-to-manutenzioni.cjs` resta nel repo per riesecuzione quando le credenziali Firebase Admin saranno disponibili.

## 10. Checklist per cross-audit Claude Code

- [ ] shape `@manutenzioni` esteso con 8 campi nuovi in `src/next/domain/nextManutenzioniDomain.ts`
- [ ] 3 nuovi writer esportati e nessuna chiamata UI ai nuovi writer nelle fasi eseguite
- [ ] vecchi writer `@lavori` intatti
- [ ] patch dotenv/context nello script di migrazione verificata
- [ ] 74 record in `@manutenzioni` presenti dopo la run PROMPT 11
- [ ] 17/17 backlink validi puntano a id manutenzione `from-lavoro-*`
- [ ] 24 orfani preesistenti documentati e lasciati invariati per decisione A
- [ ] 7 lettori indiretti Categorie A+B repuntati dopo Fase 3 PASS
- [ ] Home/Manutenzioni/Sinottica/Archivio/Dossier/Operativita/PDF leggono `@manutenzioni`
- [ ] file Categoria F chat IA verificati intatti
- [ ] file modulo Lavori NEXT non modificati
- [ ] `App.tsx`, `nextData.ts`, `NextLegacyStorageBoundary` non modificati
- [ ] `npm run build` PASS al termine del rerun completo
- [ ] eslint PASS sui file modificati

## 11. Checklist gate manuale runtime per Giuseppe

- [ ] `/next/home`: card "Manutenzioni da fare" mostra manutenzioni `daFare`
- [ ] `/next/manutenzioni`: KPI "Manutenzioni da fare" coerente per mezzo
- [ ] `/next/centro-controllo`: KPI "Manutenzioni urgenti" coerente
- [ ] `/next/dossier-mezzo`: sezione "Manutenzioni" mostra da fare/eseguite
- [ ] Centro Controllo gating segnalazioni: verificare che record con `linkedLavoroId` valorizzato restino esclusi dall'inbox, inclusi gli orfani preesistenti
- [ ] UI vecchia `Crea lavoro` ancora chiama vecchio writer: atteso nelle fasi eseguite
- [ ] `/next/lavori-in-attesa`: pagina ancora viva
- [ ] `/next/dettagliolavori/<idLavoroMigrato>`: verificare solo dopo migrazione riuscita

## 12. Cosa fa il prompt 5 (NON include nelle fasi 1-4)

- rimozione route `/next/lavori-*` da `App.tsx` e redirect compat `/next/dettagliolavori/:id`
- rimozione voce sidebar Lavori
- rimozione file pagine Lavori
- rimozione deroghe cloneWriteBarrier lavori
- rimozione preset `lavori` da `NextLegacyStorageBoundary`
- migrazione UI verso `createManutenzioneDaFareFrom*`
- rimozione vecchi writer lavori
- rimozione script `scripts/oneoff/migrate-lavori-to-manutenzioni.cjs`

## 13. Backup pre-fasi

`C:\Users\giumi\AppData\Local\Temp\dismissione_lavori_backup_20260512_202255`

## 14. Note finali

- Comandi iniziali obbligatori: `git status` pulito, file SPEC/Audit/Diario presenti, build iniziale PASS.
- Build Fase 1 PASS e build Fase 2 PASS.
- Warning non bloccanti: Vite dynamic import/chunk size; ESLint `baseline-browser-mapping` informativo.
- STOP reale iniziale: Fase 3 bloccata da `Firebase Admin non pronto: credential.mode=missing`, risolto nel PROMPT 11.
- Correzione PROMPT 13: Fase 3 PASS dopo diagnosi PROMPT 12. I 24 "mancanti" sono orfani preesistenti, non fail della migrazione.

## 15. Aggiornamento post-fix PROMPT 11 (data: 2026-05-12)

### 15.1 Diagnosi applicata

PROMPT 10 ha identificato la causa del primo STOP Fase 3 come Ipotesi A: lo script `scripts/oneoff/migrate-lavori-to-manutenzioni.cjs` leggeva `process.env` senza caricare `backend/internal-ai/.env`. Il modulo backend espone solo `getInternalAiFirebaseAdminReadonlyContext`; il nome `readonly` e' convenzionale, il client Firestore esposto usa Firebase Admin SDK.

### 15.2 Step A - Patch script

Esito: PASS.

Patch applicata solo a `scripts/oneoff/migrate-lavori-to-manutenzioni.cjs`:
- caricamento esplicito `dotenv` da `backend/internal-ai/.env`;
- riuso di `getInternalAiFirebaseAdminReadonlyContext`;
- rimozione del bootstrap custom diretto di `firebase-admin`;
- `node -c scripts/oneoff/migrate-lavori-to-manutenzioni.cjs` PASS.

### 15.3 Step B - Riesecuzione Fase 3

Esito: PASS dopo correzione aspettativa PROMPT 13.

Pre-check prima della run:
- `@lavori`: atteso 18, trovato 18.
- `@manutenzioni`: atteso 56, trovato 56, migrati esistenti 0.
- `@segnalazioni_autisti_tmp`: atteso 36 totali / 32 linked, trovato 36 / 32.
- `@controlli_mezzo_autisti`: atteso 349 totali / 9 linked, trovato 349 / 9.

Prima run:

```text
PRECHECK: lavori=18 manutenzioniBase=56 manutenzioniTotali=56 migratiEsistenti=0 segnalazioniLinked=32 controlliLinked=9
DIVERGENZE_PRECHECK: 0
GUARD: tipoMagazzino=0 sottoElementiNonVuoti=0
DIVERGENZE_BACKLINK: 27
RISULTATO: migrati=18 skipIdempotenza=0 backlinkSegnalazioniRiscritti=15 backlinkControlliRiscritti=2 divergenze=27
ROLLBACK: NO
ESITO: PASS
```

Checkpoint Step B: PASS dopo correzione aspettativa PROMPT 13. Il prompt richiedeva inizialmente 32 backlink segnalazioni + 9 backlink controlli riscritti, ma PROMPT 12 ha dimostrato che solo 17 record puntavano ai 18 lavori migrati. La run ha riscritto 17/17 backlink validi. La seconda run di idempotenza non e' stata eseguita nel PROMPT 11 per STOP operativo basato sulla vecchia aspettativa.

Verifica conteggi dopo prima run:
- `@lavori`: 18.
- `@manutenzioni`: 74, di cui 18 `from-lavoro-*`.
- `@segnalazioni_autisti_tmp`: 36 totali, 32 linked, 15 `linkedLavoroId` con prefisso `from-lavoro-`.
- `@controlli_mezzo_autisti`: 349 totali, 9 linked, 2 `linkedLavoroId` con prefisso `from-lavoro-`.

### 15.4 Step C - Fase 4

Esito: PASS dopo ripresa PROMPT 13.

I 7 lettori indiretti principali delle Categorie A+B sono stati repuntati da `@lavori` a `@manutenzioni` dopo la correzione dell'aspettativa backlink. Dettaglio completo in sezione 17.

### 15.5 Stato operativo

Stato complessivo: FASI 1-4 PASS dopo PROMPT 13.

Decisione A: nessuna pulizia Firestore degli orfani in questa dismissione. I 24 record origine orfani restano invariati e sono candidati a task dedicato futuro.

## 16. Orfani preesistenti backlink

La diagnosi PROMPT 12 ha verificato che 24 record origine (17 segnalazioni + 7 controlli) hanno `linkedLavoroId` o `linkedLavoroIds` puntante a id lavori non presenti nei 18 record correnti di `@lavori`. Erano gia' rotti prima della migrazione e non sono causati dalla dismissione.

Decisione operativa A: gli orfani vengono lasciati invariati su Firestore. Nessuna correzione dati, nessun rollback, nessuna pulizia in questa fase.

Implicazione operativa: il gating `!hasLinkedLavoro` del Centro Controllo Sinottica li considera comunque "presi in carico", quindi non appaiono in inbox. Il comportamento resta invariato rispetto al pre-migrazione.

Elenco completo record orfani:

| # | Dataset | Record id | Campo | Valore orfano |
|---:|---|---|---|---|
| 1 | `@segnalazioni_autisti_tmp` | `48a06dc7-d209-42de-b2b3-89885a398a17` | `linkedLavoroId` | `f8c0e31c-14f0-41bb-9d24-334549a392da` |
| 2 | `@segnalazioni_autisti_tmp` | `9f55a179-67a0-4958-a2d3-ff518ae4e99a` | `linkedLavoroId` | `5ee4f7bf-562c-4c24-a021-2cacd4d4c702` |
| 3 | `@segnalazioni_autisti_tmp` | `82ff0b71-623b-4d72-8587-6b8d0be6b77f` | `linkedLavoroId` | `99f8c820-63c4-449c-a10b-7b2260c2ffc6` |
| 4 | `@segnalazioni_autisti_tmp` | `e8750e0e-e421-4d07-aa6d-03722fc13012` | `linkedLavoroId` | `b994ae30-9ea9-49f3-aa31-fc7438188808` |
| 5 | `@segnalazioni_autisti_tmp` | `f9e2e351-35a4-415d-b791-f638008518d3` | `linkedLavoroId` | `4d455c2a-3d18-4106-b8fe-8af344585aff` |
| 6 | `@segnalazioni_autisti_tmp` | `4017ba91-a08a-440c-a2d3-6015d8d5c797` | `linkedLavoroId` | `c624c75d-e672-46db-af37-9f7cc88456eb` |
| 7 | `@segnalazioni_autisti_tmp` | `fa8ee153-fda7-40f8-9347-bdc48961e56c` | `linkedLavoroId` | `4ffc49f9-e322-4ccd-bb07-046aafa7f7a3` |
| 8 | `@segnalazioni_autisti_tmp` | `eee4adb6-5623-4bed-858d-e3347cac4dde` | `linkedLavoroId` | `23c31228-9f39-447e-88d3-0539f7399ad9` |
| 9 | `@segnalazioni_autisti_tmp` | `b883f689-4c92-4a8e-8bf1-011e4bd99c79` | `linkedLavoroId` | `be49d61f-65a2-4c15-8349-90e8fbde5612` |
| 10 | `@segnalazioni_autisti_tmp` | `45feb9b9-3874-4219-814a-262f21799185` | `linkedLavoroId` | `deb7da3e-2412-40d3-89ab-437e91acd98f` |
| 11 | `@segnalazioni_autisti_tmp` | `7e9925c6-b92c-4daa-9209-b8bd496564a1` | `linkedLavoroId` | `1d8dfe6f-7d93-4333-963e-d14fb52cfc4a` |
| 12 | `@segnalazioni_autisti_tmp` | `c11828ee-9835-494a-8c08-91a18009ed78` | `linkedLavoroId` | `7eaa65ad-f74d-44d4-a5f1-df277b11c830` |
| 13 | `@segnalazioni_autisti_tmp` | `2a629be1-3395-4449-8a3f-2b67ffbce6b0` | `linkedLavoroId` | `74699f0a-83fe-4d6e-a43d-676de939a20f` |
| 14 | `@segnalazioni_autisti_tmp` | `6a64e3bd-4f9b-44e1-859a-90aa4d1f2c0f` | `linkedLavoroId` | `b090c8a5-8eb4-48da-8619-b4f86fcbcde0` |
| 15 | `@segnalazioni_autisti_tmp` | `ed063f99-e343-4642-8487-037e97b9a003` | `linkedLavoroId` | `dedc1377-1d4d-42b3-aff4-22f469a7a573` |
| 16 | `@segnalazioni_autisti_tmp` | `8bcb855c-920f-459b-9a84-b5b127cf11e5` | `linkedLavoroId` | `eab98d6b-768d-4a5d-9e5a-03e5278c2177` |
| 17 | `@segnalazioni_autisti_tmp` | `c2568521-a959-4791-aea8-485fb2c9e944` | `linkedLavoroId` | `8d2b5c5a-04bd-429a-87b7-739a41f11536` |
| 18 | `@controlli_mezzo_autisti` | `80049ab9-c74d-4687-9eca-67b061bd3eec` | `linkedLavoroIds` | `9a12c1c7-6ecd-45f4-8f0d-ab2cd50adf19`, `93beea7d-1245-4369-b955-ce9d211fa5e3` |
| 19 | `@controlli_mezzo_autisti` | `053b1e13-d021-4b95-b6ce-f968cc36dcaa` | `linkedLavoroId` | `016bb465-9f94-4beb-8338-b64d8e93f53a` |
| 20 | `@controlli_mezzo_autisti` | `5b28c840-e5ae-46a6-ad1a-aaa354d99192` | `linkedLavoroId` | `2c3fc010-3a3e-442e-8124-2fb720fdb532` |
| 21 | `@controlli_mezzo_autisti` | `25166fae-6344-4e4e-b40c-4ffb5dd4822c` | `linkedLavoroId` | `7420fd2e-cdad-4d71-b7f6-08550d13b39f` |
| 22 | `@controlli_mezzo_autisti` | `36af4b0d-b646-4da8-96aa-9324946eb228` | `linkedLavoroIds` | `c3ef6c33-482b-4a64-96b6-62a76c101808`, `aa3e15a8-3b4c-4b3b-8ee6-971d7e7fed77` |
| 23 | `@controlli_mezzo_autisti` | `d0934d91-b117-42ed-95c5-0a4bb704f048` | `linkedLavoroId` | `4c0a2df1-e445-4eeb-ba65-bbd6652f5432` |
| 24 | `@controlli_mezzo_autisti` | `48660226-d99a-44db-9b41-c340716338df` | `linkedLavoroId` | `26c60405-ffc4-4481-abe5-5746d483922f` |

Nota: i record orfani sono 24. Le occorrenze link orfane rilevate dalla diagnostica sono 27 perche' due controlli contengono due valori orfani in `linkedLavoroIds` e un controllo gia' riscritto contiene un secondo valore plurale orfano.

Riferimento operativo: candidati per task di pulizia futura, fuori scope dismissione Lavori NEXT.

## 17. Aggiornamento PROMPT 13 - completamento Step C/Fase 4 (data: 2026-05-12)

Step X ha corretto l'aspettativa backlink nel report e nella SPEC: la migrazione doveva riscrivere i record origine con `linkedLavoroId`/`linkedLavoroIds` puntante a uno dei 18 lavori migrati, non tutti i record con campo popolato. Esito corretto: 17 backlink validi riscritti su 17 validi attesi; i 24 record residui sono orfani preesistenti e restano invariati per decisione A.

Step C/Fase 4: PASS. File modificati:
- `src/next/NextHomePage.tsx`
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextCentroControlloParityPage.tsx`
- `src/next/components/NextCentroControlloSinottica.tsx`
- `src/next/centroControllo/archivioStorico/hooks/useArchivioData.ts`
- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/nextOperativitaTecnicaDomain.ts`
- `src/utils/pdfEngine.ts`

Lettori repuntati:
- Home: card/stat lavori aperti ora legge manutenzioni `daFare`.
- Manutenzioni: KPI per mezzo ora conta manutenzioni `daFare`.
- Centro Controllo/Sinottica: KPI e chip urgenti ora derivano da manutenzioni `daFare`.
- Archivio storico: feed cronologico da `@manutenzioni` tutti gli stati.
- Dossier mezzo: sezione lavori resa come manutenzioni da fare/eseguite.
- Operativita tecnica: snapshot tecnico da manutenzioni mezzo-centriche.
- PDF Dossier: payload invariato nei nomi esterni, label e contenuto convertiti a manutenzioni.

Helper nuovi in `nextManutenzioniDomain`: nessuno. E' stato riutilizzato il reader esistente `readNextManutenzioniDaFareSnapshot` e il reader mezzo-centrico gia' disponibile.

Label aggiornate: `Lavori aperti`/`Lavori in attesa` -> `Manutenzioni da fare`; `Lavori urgenti` -> `Manutenzioni urgenti`; `Segnalazioni aperte` -> `Manutenzioni da fare`; Dossier/PDF `Lavori` -> `Manutenzioni`, `In attesa` -> `Da fare`, `Eseguiti` -> `Eseguite`.

Verifiche PROMPT 13:
- `npx eslint` sui file modificati: PASS con warning non bloccanti preesistenti nel motore PDF e warning informativo `baseline-browser-mapping`.
- `npm run build`: PASS.
- `git diff --name-only` sui file vietati Categoria F, Categoria C, modulo Lavori NEXT, `App.tsx`, `nextData.ts`, `NextLegacyStorageBoundary` e `src/pages`: vuoto.
- Script di migrazione non eseguito.
- Firestore non modificato in PROMPT 13.

Prossimo passo: cross-audit Claude Code, poi gate manuale runtime Giuseppe, poi prompt 5 di rimozione UI Lavori.

## 18. Chiusura completa - PROMPT 25 (data: 2026-05-13)

La dismissione Lavori NEXT e' stata chiusa completamente nel report finale:

- `docs/_live/REPORT_FINALE_DISMISSIONE_LAVORI_NEXT_2026-05-13.md`

Esito finale: 13 buchi audit chiusi su 14, con solo il buco #10 rinviato esplicitamente. I file Lavori NEXT sono stati eliminati, le route NEXT legacy sono state convertite a redirect compat verso Manutenzioni, `cloneWriteBarrier.ts` non contiene piu' deroghe Lavori NEXT, e la chat IA e' stata scollegata da `nextLavoriDomain`/`@lavori` nel perimetro autorizzato.

Verifiche finali PROMPT 25:
- `npm run build`: PASS.
- `npx eslint` sui 3 file Z5-BIS: PASS.
- Residui funzionali Lavori NEXT: zero fuori dalle eccezioni dichiarate (`src/autistiInbox/AutistiAdmin.tsx`, `src/components/AutistiEventoModal.tsx`, `src/pages/`, `linkedLavoroId/Ids`).
- Firestore invariato: zero scritture nel PROMPT 25.
