# CHANGE REPORT - 2026-04-22 16:00 - fix leak preventivi manutenzione nel layer procurement

## Tipo intervento

Fix data isolation: esclusione dei record `preventivo_manutenzione` / `ambitoPreventivo: "manutenzione"` dalle pipeline procurement e dal registry IA universale.

## File runtime toccati

- `src/next/domain/nextProcurementDomain.ts`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`

## Diagnosi

I preventivi archiviati dal ramo `Archivista -> Preventivo + Manutenzione` vengono salvati in `storage/@preventivi` con il campo `ambitoPreventivo: "manutenzione"`. Lo stesso documento Firestore contiene anche i preventivi di acquisto magazzino (senza `ambitoPreventivo` o con `ambitoPreventivo: "magazzino"`).

Il domain procurement (`readNextProcurementSnapshot()`) leggeva tutti i record dell'array senza alcun filtro su `ambitoPreventivo`, causando la comparsa dei preventivi manutenzione in:
- tab `Prezzi & Preventivi` di `/next/materiali-da-ordinare`
- tab `documenti-costi` di `/next/magazzino` (eredita `procurementSnapshot.preventivi`)
- pipeline IA `readNextDocumentiCostiProcurementSupportSnapshot()` usata dal dossier mezzo
- registry universale IA (`storage/@preventivi` come `raw_storage_doc`)

L'audit completo e in `docs/product/AUDIT_PREVENTIVO_MANUTENZIONE_LEAK_PROCUREMENT.md` e `docs/product/AUDIT_LEAK_PREVENTIVO_MANUTENZIONE_COMPLETO.md`.

## Fix applicato

**Punto 1 — `nextProcurementDomain.ts:readNextProcurementSnapshot()`**

Aggiunto un filtro `.filter()` prima del `.map()` nella pipeline di costruzione di `preventivi`. La condizione esclude i record per cui `ambitoPreventivo === "manutenzione"` (uguaglianza stretta). Record senza il campo (undefined/null/assente — tutti i record storici) passano invariati: retrocompatibilita preservata.

**Punto 2 — `nextDocumentiCostiDomain.ts:readNextDocumentiCostiProcurementSupportSnapshot()`**

Esteso il filtro gia presente su `preventiviItems` con la condizione aggiuntiva `ambitoPreventivo !== "manutenzione"`. Stesso criterio di retrocompatibilita.

**Punto 3 — `internalAiUnifiedIntelligenceEngine.ts`**

Nel loop che materializza i descrittori `raw_storage_doc`, aggiunta logica specifica per `sourceId === "storage/@preventivi"`: i record vengono filtrati prima di passare a `snapshotFromRawStorage()`. Condizione: `r.ambitoPreventivo !== "manutenzione"`. Gli altri `raw_storage_doc` non sono impattati.

## Impatti attesi

- `snapshot.preventivi` in `readNextProcurementSnapshot()` non contiene piu record `preventivo_manutenzione`.
- Tab `Prezzi & Preventivi` in `Materiali da ordinare`: i preventivi manutenzione non compaiono piu.
- Tab `documenti-costi` in `Magazzino`: i preventivi manutenzione non compaiono piu (eredita il fix dal Punto 1).
- `readNextDocumentiCostiProcurementSupportSnapshot()`: i preventivi manutenzione sono esclusi anche dalla pipeline dossier procurement support.
- Registry universale IA: `storage/@preventivi` non espone piu record `ambitoPreventivo: "manutenzione"` come sorgente grezza.
- Record senza `ambitoPreventivo` (legacy pre-2026-04-22): nessun cambiamento, restano inclusi in tutte le pipeline.

## Vettori non toccati (gia sicuri o fuori perimetro)

- `NextProcurementReadOnlyPanel.tsx`: non espone lista individuale preventivi — non vettore di leak.
- `NextOperativitaGlobalePage.tsx`: non itera item preventivi — non vettore di leak.
- `NextDossierMezzoPage.tsx`: fuori scope del fix; il bug del campo `entry.targa` vs `entry.metadatiMezzo.targa` e un debito ortogonale registrato nell'audit.
- Bridge, `cloneWriteBarrier.ts`, `storage.rules`, IA orchestrator: non toccati.

## Rischio modifica

- BASSO. I tre fix sono filtri addizionali read-only senza effetti sui writer, sui shape persistiti o sui contratti Firestore. La retrocompatibilita e garantita dalla condizione di uguaglianza stretta.

## Verifiche eseguite

- `npm run build` -> **OK** (30.36s)
- `npm run lint` -> **582 problemi / 567 errori / 15 warning** — delta zero rispetto al baseline. Nessuna regressione introdotta.

## Commit hash

- NON ESEGUITO in questa sessione.

## Stato finale

- FATTO
