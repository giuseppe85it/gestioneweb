# Change Report — Dossier Mezzo: Flusso Fattura → Manutenzione

**Data:** 2026-04-11
**Tipo:** patch — nuova capability write

## Obiettivo

Implementare il flusso "Fattura → Manutenzione" nel Dossier Mezzo NEXT:
ogni riga fattura espone un bottone "Crea manutenzione" che apre un modal con parsing IA del PDF
e consente di salvare una manutenzione reale pre-compilata, collegata al documento tramite `sourceDocumentId`.
Dopo il salvataggio il bottone diventa badge "✓ Manutenzione collegata" (anti-duplicazione).

## File toccati

| File | Modifica |
|------|---------|
| `src/next/domain/nextManutenzioniDomain.ts` | `sourceDocumentId` aggiunto a 4 punti |
| `src/next/domain/nextManutenzioniGommeDomain.ts` | `sourceDocumentId?` nei tipi di view |
| `src/next/domain/nextDossierMezzoDomain.ts` | nuova `hasLinkedManutenzione` |
| `src/next/NextEuromeccPage.tsx` | `callPdfAiEnhance` resa `export` |
| `src/next/NextDossierFatturaToManutenzioneModal.tsx` | nuovo file — modal completo |
| `src/next/NextDossierMezzoPage.tsx` | bottone/badge + mount modal |
| `src/utils/cloneWriteBarrier.ts` | deroga Dossier per write keys |

## Dettaglio modifiche

### `nextManutenzioniDomain.ts`
- `NextManutenzioniLegacyDatasetRecord`: `sourceDocumentId?: string | null`
- `NextManutenzioneBusinessSavePayload`: `sourceDocumentId?: string | null`
- `NextMaintenanceHistoryItem`: `sourceDocumentId: string | null` (required, normalizzato)
- `toHistoryItem()`: `sourceDocumentId: normalizeOptionalText(raw.sourceDocumentId)`
- `sanitizeBusinessRecord()`: spread condizionale `sourceDocumentId` se presente nel payload

### `nextManutenzioniGommeDomain.ts`
- `NextManutenzioneReadOnlyItem`: `sourceDocumentId?: string | null` (opzionale per non rompere costruttori inline in NextManutenzioniPage.tsx)
- `NextManutenzioneLegacyViewItem`: `sourceDocumentId?: string | null`
- `toMaintenanceItem()`: `sourceDocumentId: item.sourceDocumentId ?? null`
- `mapNextManutenzioniItemsToLegacyView()`: `sourceDocumentId: item.sourceDocumentId ?? undefined`

### `nextDossierMezzoDomain.ts`
Aggiunta in coda al file:
```ts
export function hasLinkedManutenzione(
  manutenzioni: NextDossierManutenzioneLegacyItem[],
  documentId: string
): boolean {
  return manutenzioni.some(
    (m) => m.sourceDocumentId != null && m.sourceDocumentId === documentId
  );
}
```

### `NextEuromeccPage.tsx`
`callPdfAiEnhance` cambiata da `async function` a `export async function` con commento
`// eslint-disable-next-line react-refresh/only-export-components` per soddisfare la lint rule.

### `NextDossierFatturaToManutenzioneModal.tsx` (nuovo)
Modal React con:
- `fetchPdfAsBase64(url)`: fetch blob → FileReader base64
- On mount: se `fattura.fileUrl` assente → salta IA, pre-fill da campi fattura, mostra warning
- Se `fileUrl` presente: chiama `callPdfAiEnhance({ imageBase64 })` → parse JSON `{ descrizione, officina, data, importo, materiali[] }`
- Su fallback IA: pre-fill da fattura + messaggio "Analisi automatica non riuscita"
- `handleSave()`: valida targa+descrizione, imposta `fromInventario: false` su tutti i materiali, chiama `saveNextManutenzioneBusinessRecord({ sourceDocumentId: fattura.id })`
- Props: `fattura`, `targa`, `onClose`, `onSaved`

### `NextDossierMezzoPage.tsx`
1. Import `hasLinkedManutenzione` dal domain, import modal
2. Stato `fatturaModal: NextDossierFatturaPreventivoLegacyItem | null`
3. In `renderDocList` per `kind === "fattura"`: bottone/badge condizionale dopo il link PDF
4. Mount modal con `onSaved` che ricarica il dossier via `readNextDossierMezzoCompositeSnapshot`

### `cloneWriteBarrier.ts`
```ts
const DOSSIER_ALLOWED_WRITE_PATH_PREFIXES = ["/next/dossiermezzi/", "/next/dossier/"] as const;
const DOSSIER_ALLOWED_STORAGE_KEYS = new Set(["@manutenzioni", "@inventario", "@materialiconsegnati"]);
```
- Funzione `isAllowedDossierCloneWritePath(pathname)` basata su prefix match
- Blocco in `isAllowedCloneWriteException`: consente `storageSync.setItemSync` per le 3 chiavi dai percorsi Dossier

`@inventario` e `@materialiconsegnati` incluse perché `persistLegacyMaterialEffects` (chiamata sempre da `saveNextManutenzioneBusinessRecord`) scrive entrambe le chiavi anche con lista materiali vuota.

## Perché `fromInventario: false`
Tutti i materiali estratti dall'IA nel modal vengono salvati con `fromInventario: false` per evitare
che il writer deduca quantità dall'inventario per materiali non provenienti da uno scarico magazzino.

## Stato verifica
- `npm run build` → OK (nessun errore TS, warning jspdf preesistente)
- Verifica runtime su dati live: DA VERIFICARE
