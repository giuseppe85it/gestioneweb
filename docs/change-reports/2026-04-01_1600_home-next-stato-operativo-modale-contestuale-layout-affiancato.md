# Change Report - 2026-04-01 16:00

## Contesto
- Prompt 8 in `MODE = OPERAIO`.
- Perimetro ammesso: `src/next/NextCentroControlloPage.tsx`, `src/next/components/StatoOperativoCard.tsx` e documentazione clone.
- Obiettivo: correggere `Vedi tutto` della card `Stato operativo` e affiancare la card a `Alert` nella parte alta della Home NEXT.

## Verifica preliminare nel codice
- Runtime NEXT letto:
  - `src/next/NextCentroControlloPage.tsx`
  - `src/next/components/StatoOperativoCard.tsx`
- Fatti verificati:
  - `Vedi tutto` era ancora un `Link` calcolato tramite `viewAllPath`, quindi non apriva un dettaglio contestuale alla tab;
  - `HomeAlertCard` e `StatoOperativoCard` erano montate nella stessa colonna `.home-col`, quindi restavano una sotto l'altra anche su desktop;
  - i dataset completi richiesti dal modale erano gia tutti disponibili nel runtime:
    - `sessioniAttive`
    - `rimorchiDaMostrare`
    - `motriciTrattoriDaMostrare`

## Modifica applicata
- In `src/next/components/StatoOperativoCard.tsx`:
  - sostituito `Vedi tutto` da link a bottone contestuale;
  - aggiunto modale full-overlay reale con chiusura sempre visibile;
  - aggiunti filtri locali:
    - `Sessioni`: `targa` + `autista`
    - `Rimorchi`: `targa`
    - `Motrici`: `targa`
  - mantenuto il riuso dei dataset gia letti e dei link NEXT esistenti sulle singole righe.
- In `src/next/NextCentroControlloPage.tsx`:
  - `Alert` e `Stato operativo` sono stati spostati nello stesso contenitore alto con griglia responsive locale, per affiancamento su desktop e stack su viewport piccole.

## File toccati
- `src/next/NextCentroControlloPage.tsx`
- `src/next/components/StatoOperativoCard.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-04-01_1600_home-next-stato-operativo-modale-contestuale-layout-affiancato.md`
- `docs/continuity-reports/2026-04-01_1600_continuity_home-next-stato-operativo-modale-contestuale-layout-affiancato.md`

## Esito verifica
- Build eseguita con `npm run build`: OK.
- Warning residui preesistenti: `jspdf` e chunk size Vite.

## Limiti residui
- Le righe dentro il modale continuano correttamente a portare alle superfici NEXT gia esistenti, ma non e stato introdotto un nuovo dettaglio dedicato per non allargare il perimetro oltre il task richiesto.
