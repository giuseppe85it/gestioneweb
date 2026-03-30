# Continuity Report - 2026-03-29 1246 - Prompt 35 hardening finale residuo NEXT

## Stato raggiunto
- `Libretti Export` e ora chiuso come superficie madre-like sopra layer NEXT pulito.
- Il perimetro autisti legacy letto da `storageSync` passa ora dal clone anche su `Home`, `Centro di Controllo`, app autisti e inbox autisti.
- `IA Libretto`, `IA Documenti`, `IA Copertura Libretti`, `Dossier Mezzo` e `Analisi Economica` hanno boundary dati piu puliti, ma non sono ancora chiusi.

## Decisione operativa da portare avanti
- Continuare solo con replica clone-side completa dei moduli residui dentro `src/next/*`.
- Non dichiarare chiusi moduli che restano agganciati a `getDoc/getDocs/setDoc/addDoc/uploadBytes` nella madre.
- Mantenere fuori perimetro `Targa 360 / Mezzo360` e `Autista 360`.

## Residuo vero
- `Home`
- `Centro di Controllo`
- `Materiali da ordinare`
- `Acquisti / Preventivi / Listino`
- `Dossier Mezzo`
- `Analisi Economica`
- `Capo`
- `IA Libretto / IA Documenti / IA Copertura Libretti`
- `Cisterna`
- `Autisti / Inbox`

## File guida per il prossimo passo
- `docs/audit/REPORT_FINALE_PROMPT_35_PARITA_NEXT.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Verifiche gia chiuse
- Lint sui file toccati: OK
- Build completa: OK
