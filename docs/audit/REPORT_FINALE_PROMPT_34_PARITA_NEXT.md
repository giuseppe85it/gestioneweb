# REPORT FINALE PROMPT 34 - PARITA NEXT VS MADRE

Data: 2026-03-29  
Stato: CURRENT

## 1. Scopo
Chiudere altri gap reali del clone/NEXT senza toccare la madre, portando nel solo `src/next/*` nuove superfici a comportamento madre-like sopra layer NEXT puliti.

## 2. Base reale usata
- Report precedente:
  - `docs/audit/REPORT_FINALE_PROMPT_33_PARITA_NEXT.md`
- Registri aggiornati:
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/MATRICE_ESECUTIVA_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Runtime verificato:
  - `src/next/NextDossierListaPage.tsx`
  - `src/next/NextColleghiPage.tsx`
  - `src/next/NextFornitoriPage.tsx`
  - `src/next/NextIntelligenzaArtificialePage.tsx`
  - `src/next/NextIAApiKeyPage.tsx`
  - `src/next/domain/nextIaConfigDomain.ts`
  - `src/next/nextAnagraficheFlottaDomain.ts`
  - `src/next/domain/nextColleghiDomain.ts`
  - `src/next/domain/nextFornitoriDomain.ts`

## 3. Chiusure runtime eseguite davvero
- `Dossier Lista` replica ora la pagina madre nel clone sopra `D01`, senza `getDoc` diretto dalla pagina legacy.
- `Colleghi` replica form, lista, modale dettagli e PDF della madre sopra `nextColleghiDomain`; il clone blocca solo il save/delete finale.
- `Fornitori` replica form, lista e PDF della madre sopra `nextFornitoriDomain`; il clone blocca solo il save/delete finale.
- `IA Home` replica il modulo madre e verifica la presenza della chiave API con `nextIaConfigDomain`.
- `IA API Key` replica la UI madre e legge la chiave dal nuovo reader `D11`; il salvataggio resta bloccato nel clone read-only.

## 4. Moduli ora pari e puliti

| Modulo / Blocco | Stato finale | UI ufficiale NEXT | Layer dati finale | Note |
| --- | --- | --- | --- | --- |
| Mezzi | PARI | Pagina madre `Mezzi` | Bridge D01 su `@mezzi_aziendali` + `@colleghi` | Chiusa nel prompt 33 |
| Gestione Operativa | PARI | Pagina madre `GestioneOperativa` | Bridge D05/D02 | Chiusa nel prompt 33 |
| Inventario | PARI | Pagina madre `Inventario` | Bridge D05 su `@inventario` | Chiusa nel prompt 33 |
| Materiali consegnati | PARI | Pagina madre `MaterialiConsegnati` | Bridge D05 + D01 | Chiusa nel prompt 33 |
| Attrezzature cantieri | PARI | Pagina madre `AttrezzatureCantieri` | Bridge D05 attrezzature | Chiusa nel prompt 33 |
| Manutenzioni | PARI | Pagina madre `Manutenzioni` | Serializer D02 su `@manutenzioni` | Chiusa nel prompt 33 |
| Ordini in attesa | PARI | Pagina madre `OrdiniInAttesa` | Bridge D06 su `@ordini` | Chiusa nel prompt 33 |
| Ordini arrivati | PARI | Pagina madre `OrdiniArrivati` | Bridge D06 su `@ordini` | Chiusa nel prompt 33 |
| Dettaglio ordine | PARI | Pagina madre `DettaglioOrdine` | Bridge D06 + D05 | Chiusa nel prompt 33 |
| Lavori da eseguire | PARI | Pagina madre `LavoriDaEseguire` | Bridge D02 + D01 | Chiusa nel prompt 33 |
| Lavori in attesa | PARI | Pagina madre `LavoriInAttesa` | Bridge D02 + D01 | Chiusa nel prompt 33 |
| Lavori eseguiti | PARI | Pagina madre `LavoriEseguiti` | Bridge D02 + D01 | Chiusa nel prompt 33 |
| Dettaglio lavoro | PARI | Pagina madre `DettaglioLavoro` | Bridge D02 | Chiusa nel prompt 33 |
| Dossier Lista | PARI | Replica clone madre-like | D01 `readNextAnagraficheFlottaSnapshot()` | Chiusa nel prompt 34 |
| Dossier Gomme | PARI | Route clone dedicata | Layer NEXT dedicato | Gia chiuso |
| Dossier Rifornimenti | PARI | Route clone dedicata | Layer NEXT dedicato | Gia chiuso |
| Colleghi | PARI | Replica clone madre-like | `nextColleghiDomain` | Chiusa nel prompt 34 |
| Fornitori | PARI | Replica clone madre-like | `nextFornitoriDomain` | Chiusa nel prompt 34 |
| IA Home | PARI | Replica clone madre-like | `nextIaConfigDomain` | Chiusa nel prompt 34 |
| IA API Key | PARI | Replica clone madre-like | `nextIaConfigDomain` | Chiusa nel prompt 34 |

## 5. Moduli ancora non chiusi

| Modulo / Blocco | Stato finale | Motivo reale residuo | SERVE FILE EXTRA |
| --- | --- | --- | --- |
| Home | NON CHIUSO | La route ufficiale monta ancora la pagina madre con logiche/eventi autisti non ancora replicate interamente nel clone pulito | NON DIMOSTRATO |
| Centro di Controllo | NON CHIUSO | Il path ufficiale usa ancora il wrapper clone della pagina madre invece della superficie D10 ufficiale unificata | NON DIMOSTRATO |
| Materiali da ordinare | NON CHIUSO | Serve replica clone completa del workflow sopra D06, oggi non ancora ricostruita | NON DIMOSTRATO |
| Acquisti / Preventivi / Listino prezzi | NON CHIUSO | Procurement core ancora spezzato tra UI madre, preview read-only e flussi non replicati 1:1 nel clone | NON DIMOSTRATO |
| Dossier Mezzo | NON CHIUSO | Backbone aggregato ancora non riallineato del tutto alla pagina madre sopra i layer puliti gia esistenti | NON DIMOSTRATO |
| Analisi Economica | NON CHIUSO | La pagina clone non replica ancora il comportamento esterno completo della madre sopra i readers documenti/costi | NON DIMOSTRATO |
| Capo Mezzi | NON CHIUSO | Superficie clone ancora non identica alla madre sul flusso completo di consultazione | NON DIMOSTRATO |
| Capo Costi Mezzo | NON CHIUSO | Restano aperti i delta su approvazioni, stati e PDF timbrati rispetto alla madre | NON DIMOSTRATO |
| IA Libretto | NON CHIUSO | La route ufficiale monta ancora la pagina madre con blocco save/upload, non una replica pulita completa | NON DIMOSTRATO |
| IA Documenti | NON CHIUSO | Il flusso clone non e ancora 1:1 pulito rispetto alla madre su upload/analisi/salvataggio | NON DIMOSTRATO |
| IA Copertura Libretti | NON CHIUSO | Mancano replica completa e boundary pulito del workflow madre | NON DIMOSTRATO |
| Libretti Export | NON CHIUSO | La pagina NEXT esiste ma non e ancora dimostrata come copia identica della madre | NON DIMOSTRATO |
| Cisterna | NON CHIUSO | Il verticale richiede ancora replica clone integrale sopra il dominio D09 | NON DIMOSTRATO |
| Cisterna IA | NON CHIUSO | La route resta funzionale ma non ancora chiusa come copia madre pulita | NON DIMOSTRATO |
| Cisterna Schede Test | NON CHIUSO | Manca ancora la replica clone completa sopra D09 | NON DIMOSTRATO |
| Autisti / Inbox | NON CHIUSO | Il perimetro resta ampio e ancora non riallineato 1:1 sopra un unico layer clone pulito | NON DIMOSTRATO |

## 6. Fuori perimetro
- `Targa 360 / Mezzo360`
- `Autista 360`

## 7. Verifiche eseguite
- `npx eslint src/next/domain/nextIaConfigDomain.ts src/next/NextDossierListaPage.tsx src/next/NextIntelligenzaArtificialePage.tsx src/next/NextIAApiKeyPage.tsx src/next/NextFornitoriPage.tsx src/next/NextColleghiPage.tsx`
- `npm run build`

Entrambe le verifiche risultano `OK`.

## 8. Verdetto finale
- Il prompt 34 chiude davvero altre 5 superfici senza toccare la madre.
- Il clone non e ancora al `100%` del perimetro target.
- In questo step non emerge un `SERVE FILE EXTRA` realmente dimostrato: il residuo resta ancora backlog di replica clone-side dentro `src/next/*`, non un blocco certo di whitelist.
