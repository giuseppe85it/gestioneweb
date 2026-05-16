# REPORT FIX — MODIFICA MANUTENZIONE: DUPLICAZIONE RECORD — 2026-05-14 (PROMPT 41)

> Modificare una manutenzione esistente produceva un secondo record in `@manutenzioni`.
> Fix applicato: Opzione 1 — id stabile alla radice. Esito: **PASS**.

## 1. Causa root

`src/next/domain/nextManutenzioniDomain.ts`:
- `buildHistoryId` (`:424-428`): un record SENZA campo `id` reale riceve un id
  `manutenzione:<targa>:<index>` che **dipende dalla posizione nell'array**.
- `toLegacyDatasetRecord` (`:651`) usa l'indice dell'array dello *snapshot della pagina*;
  `matchLegacyRecordById` (`:1100-1106`) ricalcola con l'indice dell'array *grezzo di
  storage*. I due indici coincidono solo per caso.
- Quando differiscono, `saveNextManutenzioneBusinessRecord`: `findLegacyRecordIndex` → `-1`
  → il `filter` non rimuove il record originale → l'`unshift` aggiunge un nuovo record →
  **duplicato**.
- Diagnosi completa: `docs/_live/DIAGNOSI_MODIFICA_MANUTENZIONE_2026-05-14.md`.

Il campo `data`: nell'edit normale il form lo preserva (`setData(item.data)` +
`value={toDisplay(data) || data}` + `toISO(data)` al salvataggio). Confermato a runtime
(vedi §4): `data` invariato dopo la modifica.

## 2. Fix applicato — Opzione 1 (id stabile alla radice)

`src/next/domain/nextManutenzioniDomain.ts`:
- **`NextManutenzioneBusinessSavePayload`** — aggiunto campo opzionale
  `editingSourceFingerprint` (tipo `NextManutenzioneEditingFingerprint`:
  `targa`/`data`/`descrizione`/`stato`).
- **`findLegacyRecordIndexByFingerprint`** (nuova funzione) — ritrova un record privo di
  `id` reale tramite i campi identificativi, senza dipendere dall'indice. Fallback
  transitorio: dopo il primo salvataggio il record ha un `id` reale.
- **`saveNextManutenzioneBusinessRecord`** — riscritto:
  - localizza il record per `id` reale e, in fallback, per fingerprint;
  - se il record esistente non ha un `id` reale (assente o sintetico `manutenzione:*`),
    gli assegna un `id` reale e persistito (`buildGeneratedId`) → i salvataggi futuri lo
    ritrovano sempre per `raw.id`;
  - rimozione del vecchio record **per indice trovato** (`filter((_, i) => i !== existingIndex)`),
    niente piu' ricalcolo di id sensibile alla posizione;
  - il record aggiornato riceve `updatedAt: Date.now()`; `data` resta quello del payload
    (gia' preservato dal form), nessun'altra modifica di shape.

`src/next/NextManutenzioniPage.tsx`:
- **`handleSave`** — passa `editingSourceFingerprint` costruito da `sourceRecord`
  (`targa`/`data`/`descrizione`/`stato`).

Prima/dopo (estratto chiave, `saveNextManutenzioneBusinessRecord`):
- PRIMA: `nextStorico = storicoRaw.filter((entry, index) => !matchLegacyRecordById(entry, index, editingSourceId))` → niente match ⇒ niente rimozione ⇒ `unshift` ⇒ duplicato.
- DOPO: `existingIndex` trovato per id o fingerprint ⇒ `nextStorico = storicoRaw.filter((_, index) => index !== existingIndex)` ⇒ rimozione certa ⇒ `unshift` ⇒ un solo record.

## 3. Test unitari aggiunti

`src/next/domain/__tests__/saveNextManutenzioneBusinessRecord.test.ts` — 5 casi, **5/5 PASS**:
1. modifica solo descrizione → stesso record, `data` e `id` invariati, `updatedAt` aggiornato;
2. modifica officina (`fornitore`) → niente duplicato, `data` invariata;
3. modifica multipla → un solo record, `id`/`data` invariati, `updatedAt` cambiato;
4. record SENZA `id` reale → l'edit NON duplica e assegna un `id` reale persistito (via fingerprint);
5. creazione nuova (senza `editingSourceId`) → aggiunge un record, non rimuove gli altri.

## 4. Verifica runtime — `scripts/oneoff/verify-modifica-manutenzione-2026-05-14.cjs`

Sweep Playwright su mezzo/manutenzione reale (fornitore originale `"Sciurba Autotruck snc"`),
modifica via UI del campo `fornitore` con un marker, salvataggio, riconteggio, ripristino.
**10/10 PASS:**

| Check | Esito |
|---|---|
| conteggio iniziale righe Dettaglio | PASS (righe=2) |
| apertura form Modifica (titolo "Modifica manutenzione") | PASS |
| compilazione campo Fornitore con marker | PASS |
| salvataggio modifica | PASS |
| **numero righe invariato dopo la modifica (niente duplicato)** | **PASS — prima=2 dopo=2** |
| riapertura form Modifica per verifica persistenza | PASS |
| **modifica persistita (Fornitore riletto dal form = marker)** | **PASS** |
| **numero righe invariato anche dopo il ripristino (secondo edit)** | **PASS — prima=2 dopo-ripristino=2** |
| Quadro PDF: pannello renderizzato | PASS (man2-pdf-row=15) |
| Archivio Storico CC raggiungibile | PASS |

Screenshot in `docs/_live/screenshots-modifica-manutenzione-2026-05-14/`. Il test e'
self-cleaning: il `fornitore` originale e' stato ripristinato; net-zero sui dati (solo
`updatedAt` aggiornato, comportamento corretto).

## 5. Verifiche tecniche

- `npx vitest run …/saveNextManutenzioneBusinessRecord.test.ts` → 5/5 PASS.
- `npx tsc --noEmit` → PASS.
- `npm run build` → PASS.
- `npx eslint` sui file toccati → PASS, 0 warning.
- Backup pre-fix: `C:\tmp\fix_modifica_manutenzione_20260514_201025\`.

## 6. Record gia' duplicati pre-fix — DA RIPULIRE MANUALMENTE

Il fix impedisce **nuove** duplicazioni ma NON ripulisce i record gia' duplicati prima
del fix (es. mezzo **TI298409**, manutenzione cambio gomme 08/05/2026 con doppione).
Per scelta di prompt non sono state fatte migration retroattive. Giuseppe decidera' se
ripulire i doppioni esistenti via UI (elimina dal Quadro/Dettaglio) o con uno script
una-tantum dedicato (non oggetto di questo prompt).

## 7. Perimetro

Toccati: `src/next/domain/nextManutenzioniDomain.ts`, `src/next/NextManutenzioniPage.tsx`,
+ nuovi: test, script di verifica, questa diagnosi/report, screenshots.
NON toccati: `src/pages/`, `src/autistiInbox/AutistiAdmin.tsx`, `dateUnica.ts`,
`cloneWriteBarrier.ts` (nessuna deroga aggiuntiva necessaria), frase storia /
`FraseStoriaRecord`, shape Firestore di `@manutenzioni` (l'aggiunta di `id`/`updatedAt` e'
additiva su campi gia' previsti). Nessuna migration retroattiva.

## 8. Stato Firestore

Il fix non scrive. Lo sweep di verifica ha modificato e poi ripristinato il `fornitore` di
una manutenzione reale (net-zero, solo `updatedAt` aggiornato).
