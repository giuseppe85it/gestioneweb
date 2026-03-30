# Backlog Execution - Prompt 49

## Problemi target

| Problema | Stato iniziale | Stato finale | File coinvolti | Blocco tecnico |
| --- | --- | --- | --- | --- |
| `Manutenzioni` NEXT con parsing/ordinamento storico non coerente con la madre e possibile esclusione di record visibili nella madre | `APERTO` | `CHIUSO` | `src/next/domain/nextManutenzioniDomain.ts`, `src/next/domain/nextOperativitaGlobaleDomain.ts`, `src/next/NextManutenzioniPage.tsx`, `src/next/nextDateFormat.ts` | Nessuno |
| Formato data visibile non uniforme in `src/next/**` | `APERTO` | `CHIUSO` | `src/next/nextDateFormat.ts`, file UI/domain/internal-ai NEXT che mostrano date visibili | Nessuno |

## Note operative
- `Manutenzioni` ora usa il parser NEXT `toNextDateValue()` con priorita esplicita su `gg mm aaaa`, ordinamento coerente e nessun filtro implicito sulle righe senza targa.
- Le date visibili della NEXT usano ora `gg mm aaaa` oppure `gg mm aaaa HH:mm` dove serve anche l'ora.
- Restano alcuni `input type="date"` solo come picker nativi nascosti (`aria-hidden="true"`); la data visibile resta nel formato NEXT.
- Verifica live del dataset Firestore `@manutenzioni` da CLI non disponibile nel contesto corrente per `permission-denied`; il controllo finale sul mismatch e quindi chiuso a livello di codice/runtime NEXT e di sweep UI.
