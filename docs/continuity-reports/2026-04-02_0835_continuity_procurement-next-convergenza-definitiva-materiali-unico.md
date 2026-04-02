# Continuity Report - 2026-04-02 08:35

## Stato raggiunto
- `/next/materiali-da-ordinare` e ora il procurement top-level canonico della NEXT.
- Ordini, arrivi e dettaglio ordine sono consultabili dentro il modulo unico.
- I path procurement secondari restano solo come alias di compatibilita verso il modulo unico.

## File chiave
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/NextProcurementConvergedSection.tsx`
- `src/next/NextProcurementReadOnlyPanel.tsx`
- `src/next/NextProcurementStandalonePage.tsx`

## Vincoli ancora validi
- Madre intoccabile.
- Nessuna scrittura business reale nel clone.
- `NextProcurementReadOnlyPanel` non va rimosso finche esistono consumer NEXT read-only fuori dal procurement top-level.

## Prossimo contesto utile
- Se in futuro si vorra rimuovere definitivamente i path procurement secondari, prima va riallineato anche il consumer fuori perimetro che usa ancora `NextProcurementReadOnlyPanel`.
