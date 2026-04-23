# CONTINUITY REPORT — Rimozione 4 stub Archivista NEXT

Data: 2026-04-22  
Task di riferimento: Prompt 11 — Rimozione stub Archivista  
Change report: `docs/change-reports/2026-04-22_1954_patch_rimozione-stub-archivista.md`

---

## Stato Archivista NEXT dopo questa patch

Il modulo `NextIAArchivistaPage` gestisce ora esattamente **5 rami attivi**:

| Combinazione | Family | Target archivio |
|---|---|---|
| `fattura_ddt:magazzino` | `fattura_ddt_magazzino` | `@documenti_magazzino` |
| `fattura_ddt:manutenzione` | `fattura_ddt_manutenzione` | `@documenti_mezzi` |
| `documento_mezzo:documento_mezzo` | `documento_mezzo` | `@documenti_mezzi` |
| `preventivo:magazzino` | `preventivo_magazzino` | `storage/@preventivi` |
| `preventivo:manutenzione` | `preventivo_manutenzione` | `storage/@preventivi` |

## Cosa è stato rimosso

4 entry `not_available` da `FLOW_MATRIX` in `src/next/NextIAArchivistaPage.tsx`:
- `"fattura_ddt:documento_mezzo"`
- `"preventivo:documento_mezzo"`
- `"documento_mezzo:magazzino"`
- `"documento_mezzo:manutenzione"`

Queste combinazioni non avevano bridge, family in `ArchivistaArchiveClient.ts`, path Storage dedicati né dati salvati. Erano dead code inaccessibile da UI.

## Cosa NON è stato toccato

- Tutti i bridge attivi in `src/next/internal-ai/`
- `ArchivistaArchiveClient.ts`
- `storage.rules`
- `cloneWriteBarrier.ts`
- `isContextAllowed` (guard residuo per preset malformati — preservato)
- `DESTINATION_OPTIONS` (dropdown UI — invariato)
- `HomeInternalAiLauncher.tsx` (launcher rapido — invariato)

## Checklist verifica runtime (product owner)

- [ ] Aprire `/next/ia/archivista` → dropdown mostra solo 5 combinazioni attive
- [ ] Selezionare "Documento mezzo" → il ramo libretto monta correttamente `ArchivistaDocumentoMezzoBridge`
- [ ] Eseguire un upload su `Fattura / DDT → Magazzino` → archiviazione in `@documenti_magazzino` OK
- [ ] Eseguire un upload su `Fattura / DDT → Manutenzione` → archiviazione in `@documenti_mezzi` OK
- [ ] Eseguire un upload su `Preventivo → Magazzino` → archiviazione in `storage/@preventivi` OK
- [ ] Eseguire un upload su `Preventivo → Manutenzione` → archiviazione in `storage/@preventivi` OK

## Debito tecnico noto (invariato da questa patch)

- Verify browser live dei rami preventivo con dati reali: `DA VERIFICARE` (ereditato da patch precedente)
- Record storici `preventivo_manutenzione` archiviati prima della patch di distinzione famiglie con `family: "preventivo_magazzino"`: debito noto, nessuna migrazione prevista.
