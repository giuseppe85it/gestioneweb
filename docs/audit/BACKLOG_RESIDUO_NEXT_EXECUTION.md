# Backlog Residuo NEXT - Execution Tracker

Versione: 2026-03-29  
Stato: IN CORSO

## Regola d'uso
- Questo file serve solo a tenere il filo del run esecutivo sul backlog residuo NEXT.
- Per ogni modulo residuo si registra:
  - stato iniziale;
  - stato durante il run;
  - stato finale;
  - eventuale blocco reale con path preciso.
- `FUORI PERIMETRO`:
  - `Targa 360 / Mezzo360`
  - `Autista 360`

## Stato iniziale del run

| Modulo residuo | Stato iniziale | Stato durante il run | Stato finale | Blocco reale / path |
| --- | --- | --- | --- | --- |
| `Materiali da ordinare` | `APERTO` | `RICOSTRUZIONE NEXT + OVERLAY ORDINI` | `CHIUSO` | `sostituito con pagina NEXT nativa in src/next/NextMaterialiDaOrdinarePage.tsx` |
| `Acquisti / Preventivi / Listino` | `APERTO` | `ANALISI PROCUREMENT NATIVE + SUPPORTO D06` | `APERTO` | `src/next/NextProcurementStandalonePage.tsx`, `src/next/NextProcurementReadOnlyPanel.tsx`, copertura legacy completa ancora concentrata in `src/pages/Acquisti.tsx` |
| `Dossier Mezzo` | `APERTO` | `RICOSTRUZIONE NEXT SU D01/D02/D04/D07-D08` | `CHIUSO` | `sostituito con pagina NEXT nativa in src/next/NextDossierMezzoPage.tsx` |
| `Analisi Economica` | `APERTO` | `RICOSTRUZIONE NEXT SU DOSSIER DOMAIN + OVERLAY IA` | `CHIUSO` | `sostituito con pagina NEXT nativa in src/next/NextAnalisiEconomicaPage.tsx` |
| `IA Libretto` | `APERTO` | `ANALISI` | `APERTO` | `src/next/NextIALibrettoPage.tsx` -> `src/pages/IA/IALibretto.tsx` |
| `IA Documenti` | `APERTO` | `ANALISI` | `APERTO` | `src/next/NextIADocumentiPage.tsx` -> `src/pages/IA/IADocumenti.tsx` |
| `IA Copertura Libretti` | `APERTO` | `ANALISI` | `APERTO` | `src/next/NextIACoperturaLibrettiPage.tsx` -> `src/pages/IA/IACoperturaLibretti.tsx` |
| `Cisterna` | `APERTO` | `ANALISI` | `APERTO` | `src/next/NextCisternaPage.tsx` -> `src/pages/CisternaCaravate/CisternaCaravatePage.tsx` |
| `Cisterna IA` | `APERTO` | `ANALISI` | `APERTO` | `src/next/NextCisternaIAPage.tsx` -> `src/pages/CisternaCaravate/CisternaCaravateIA.tsx` |
| `Cisterna Schede Test` | `APERTO` | `ANALISI` | `APERTO` | `src/next/NextCisternaSchedeTestPage.tsx` -> `src/pages/CisternaCaravate/CisternaSchedeTest.tsx` |
| `Autisti / Inbox` | `APERTO` | `ANALISI` | `APERTO` | `wrapper ufficiali src/next/NextAutisti*Page.tsx e src/next/NextAutistiInbox*Page.tsx verso src/autisti/** e src/autistiInbox/**` |

## Note run
- Priorita dichiarata dal prompt 38: svuotare il backlog residuo nello stesso run.
- Vincolo assoluto: niente `NextMotherPage` o wrapper madre come chiusura finale dei moduli residui.
- Chiusure reali del run:
  - `Materiali da ordinare`
  - `Dossier Mezzo`
  - `Analisi Economica`
- Residui che montano ancora runtime madre a fine run:
  - `IA Libretto`
  - `IA Documenti`
  - `IA Copertura Libretti`
  - `Cisterna`
  - `Cisterna IA`
  - `Cisterna Schede Test`
  - `Autisti / Inbox`
- Residuo non wrapper ma ancora non equivalente alla madre:
  - `Acquisti / Preventivi / Listino`
