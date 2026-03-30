# REPORT FINALE PROMPT 35 - PARITA NEXT VS MADRE

Data: 2026-03-29  
Stato: CURRENT

## 1. Scopo
Chiudere il perimetro residuo del clone/NEXT senza toccare la madre, portando dentro il clone le ultime letture ancora passanti da `storageSync` e verificando in modo avversariale cosa risulta davvero chiuso.

## 2. Base reale usata
- Report precedenti:
  - `docs/audit/REPORT_FINALE_PROMPT_33_PARITA_NEXT.md`
  - `docs/audit/REPORT_FINALE_PROMPT_34_PARITA_NEXT.md`
- Registri aggiornati:
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/MATRICE_ESECUTIVA_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Runtime verificato:
  - `src/next/nextLegacyAutistiOverlay.ts`
  - `src/next/NextLegacyStorageBoundary.tsx`
  - `src/next/NextHomePage.tsx`
  - `src/next/NextCentroControlloClonePage.tsx`
  - `src/next/NextLibrettiExportPage.tsx`
  - `src/next/NextIALibrettoPage.tsx`
  - `src/next/NextIADocumentiPage.tsx`
  - `src/next/NextIACoperturaLibrettiPage.tsx`
  - `src/next/NextDossierMezzoPage.tsx`
  - `src/next/NextAnalisiEconomicaPage.tsx`
  - route `/next/autisti/*` e `/next/autisti-inbox/*` toccate dal boundary `autisti`

## 3. Chiusure runtime eseguite davvero
- `Libretti Export` e ora una copia madre reale: la route ufficiale `/next/libretti-export` monta `src/pages/LibrettiExport.tsx` sopra `NextLegacyStorageBoundary` con preset `flotta`.
- Il dataset `@mezzi_aziendali` usato da `Libretti Export` passa quindi dal layer NEXT pulito prima di arrivare alla UI madre.

## 4. Hardening reale eseguito ma non sufficiente a chiusura
- Creato un overlay autisti clone-side che alimenta in shape legacy controllato:
  - `@autisti_sessione_attive`
  - `@storico_eventi_operativi`
  - `@segnalazioni_autisti_tmp`
  - `@controlli_mezzo_autisti`
  - `@richieste_attrezzature_autisti_tmp`
  - `@rifornimenti_autisti_tmp`
  - `@cambi_gomme_autisti_tmp`
- `Home` e `Centro di Controllo` leggono ora questi dataset dal boundary NEXT sui punti che passano da `storageSync`.
- Anche `IA Libretto`, `IA Documenti`, `IA Copertura Libretti`, `Dossier Mezzo`, `Analisi Economica`, app autisti e inbox autisti usano ora boundary dati NEXT aggiuntivi.
- Questi moduli non vengono comunque dichiarati chiusi quando la madre continua a contenere accessi diretti `getDoc/getDocs/setDoc/addDoc/uploadBytes/getDownloadURL` non sostituiti dal clone.

## 5. Moduli ora pari e puliti

| Modulo / Blocco | Stato finale | UI ufficiale NEXT | Layer dati finale | Note |
| --- | --- | --- | --- | --- |
| Mezzi | PARI | Pagina madre | Bridge D01 | Gia chiuso |
| Gestione Operativa | PARI | Pagina madre | Bridge D05/D02 | Gia chiuso |
| Inventario | PARI | Pagina madre | Bridge D05 | Gia chiuso |
| Materiali consegnati | PARI | Pagina madre | Bridge D05 + D01 | Gia chiuso |
| Attrezzature cantieri | PARI | Pagina madre | Bridge D05 | Gia chiuso |
| Manutenzioni | PARI | Pagina madre | Serializer D02 | Gia chiuso |
| Ordini in attesa | PARI | Pagina madre | Bridge D06 | Gia chiuso |
| Ordini arrivati | PARI | Pagina madre | Bridge D06 | Gia chiuso |
| Dettaglio ordine | PARI | Pagina madre | Bridge D06 + D05 | Gia chiuso |
| Lavori da eseguire | PARI | Pagina madre | Bridge D02 + D01 | Gia chiuso |
| Lavori in attesa | PARI | Pagina madre | Bridge D02 + D01 | Gia chiuso |
| Lavori eseguiti | PARI | Pagina madre | Bridge D02 + D01 | Gia chiuso |
| Dettaglio lavoro | PARI | Pagina madre | Bridge D02 | Gia chiuso |
| Dossier Lista | PARI | Replica clone madre-like | D01 | Gia chiuso |
| Dossier Gomme | PARI | Route clone dedicata | Layer NEXT dedicato | Gia chiuso |
| Dossier Rifornimenti | PARI | Route clone dedicata | Layer NEXT dedicato | Gia chiuso |
| Colleghi | PARI | Replica clone madre-like | D05 | Gia chiuso |
| Fornitori | PARI | Replica clone madre-like | D05 | Gia chiuso |
| IA Home | PARI | Replica clone madre-like | D11 | Gia chiuso |
| IA API Key | PARI | Replica clone madre-like | D11 | Gia chiuso |
| Libretti Export | PARI | Pagina madre | Boundary `flotta` + `nextLibrettiExportDomain` a monte | Chiuso nel prompt 35 |

## 6. Moduli ancora non chiusi

| Modulo / Blocco | Stato finale | Motivo tecnico reale | Servizio extra |
| --- | --- | --- | --- |
| Home | NON CHIUSO | UI madre montata, ma il clone blocca CTA e aree fuori perimetro e la pagina legacy conserva scritture via `setItemSync` non replicate 1:1 nel clone | Nessun `SERVE FILE EXTRA` dimostrato |
| Centro di Controllo | NON CHIUSO | Migliora il lato `storageSync`, ma `src/pages/CentroControllo.tsx` usa ancora `getDoc` diretto per dossier rifornimenti e tmp autisti | Nessun `SERVE FILE EXTRA` dimostrato |
| Materiali da ordinare | NON CHIUSO | La route ufficiale monta ancora la pagina madre con `getDoc/setDoc` diretti su fornitori e workflow non ancora replicato nel clone | Nessun `SERVE FILE EXTRA` dimostrato |
| Acquisti / Preventivi / Listino prezzi | NON CHIUSO | Il procurement core resta spezzato tra page legacy, Storage, Functions e segmenti clone read-only non equivalenti 1:1 | Nessun `SERVE FILE EXTRA` dimostrato |
| Dossier Mezzo | NON CHIUSO | Il boundary ripulisce i punti `storageSync`, ma la madre continua a leggere/scrivere direttamente costi, lavori, mezzi e documenti via Firestore | Nessun `SERVE FILE EXTRA` dimostrato |
| Analisi Economica | NON CHIUSO | Ora legge `@mezzi_aziendali` dal boundary, ma la pagina madre continua a usare `getDoc/getDocs/setDoc` diretti per analisi e documenti | Nessun `SERVE FILE EXTRA` dimostrato |
| Capo Mezzi | NON CHIUSO | Superficie clone diversa dalla madre; la parity esterna completa non e dimostrata | Nessun `SERVE FILE EXTRA` dimostrato |
| Capo Costi Mezzo | NON CHIUSO | Restano delta reali su approvazioni, stati e PDF timbrati rispetto alla madre | Nessun `SERVE FILE EXTRA` dimostrato |
| IA Libretto | NON CHIUSO | Il boundary `flotta` pulisce `@mezzi_aziendali`, ma il modulo legacy usa ancora `getDoc`, `getDownloadURL` e `setItemSync` su flusso non replicato nel clone | Nessun `SERVE FILE EXTRA` dimostrato |
| IA Documenti | NON CHIUSO | Il boundary riduce i raw su `@inventario`, ma il modulo legacy continua a usare `getDoc/getDocs/addDoc/uploadBytes` e import inventario diretto | Nessun `SERVE FILE EXTRA` dimostrato |
| IA Copertura Libretti | NON CHIUSO | Il boundary `flotta` non basta: la pagina madre continua a usare `getDoc`, `uploadBytes`, `getDownloadURL` e `setItemSync` diretti | Nessun `SERVE FILE EXTRA` dimostrato |
| Cisterna | NON CHIUSO | La route ufficiale monta ancora la pagina madre con `getDoc/getDocs/setDoc` diretti sul verticale D09 | Nessun `SERVE FILE EXTRA` dimostrato |
| Cisterna IA | NON CHIUSO | Il contesto clone-safe esiste, ma il modulo madre usa ancora Storage/Firestore e writer legacy | Nessun `SERVE FILE EXTRA` dimostrato |
| Cisterna Schede Test | NON CHIUSO | La superficie madre continua a usare Firestore e Storage diretti, inclusi salvataggi e upload | Nessun `SERVE FILE EXTRA` dimostrato |
| Autisti / Inbox | NON CHIUSO | Le route wrapper leggono ora dal boundary `autisti`, ma parte del runtime madre conserva mutazioni, dossier write-through e gestione allegati non replicate nel clone | Nessun `SERVE FILE EXTRA` dimostrato |

## 7. Fuori perimetro
- `Targa 360 / Mezzo360`
- `Autista 360`

## 8. Verifiche eseguite
- `npx eslint src/next/nextLegacyAutistiOverlay.ts src/next/NextLegacyStorageBoundary.tsx src/next/NextHomePage.tsx src/next/NextCentroControlloClonePage.tsx src/next/NextLibrettiExportPage.tsx src/next/NextIALibrettoPage.tsx src/next/NextIADocumentiPage.tsx src/next/NextIACoperturaLibrettiPage.tsx src/next/NextDossierMezzoPage.tsx src/next/NextAnalisiEconomicaPage.tsx src/next/NextAutistiLoginPage.tsx src/next/NextAutistiHomePage.tsx src/next/NextAutistiSetupMezzoPage.tsx src/next/NextAutistiCambioMezzoPage.tsx src/next/NextAutistiInboxHomePage.tsx src/next/NextAutistiInboxCambioMezzoPage.tsx src/next/NextAutistiInboxControlliPage.tsx src/next/NextAutistiInboxGommePage.tsx src/next/NextAutistiInboxLogAccessiPage.tsx src/next/NextAutistiInboxSegnalazioniPage.tsx src/next/NextAutistiInboxRichiestaAttrezzaturePage.tsx src/next/NextAutistiAdminPage.tsx`
- `npm run build`

Entrambe le verifiche risultano `OK`.

## 9. Verdetto finale
- Il prompt 35 non chiude il `100%` del perimetro target.
- Chiude davvero `Libretti Export` e rende piu pulito il perimetro autisti/IA/dossier sui punti `storageSync`.
- I moduli residui restano aperti non per mancanza di file fuori whitelist, ma perche la loro replica clone-side completa dentro `src/next/*` non e ancora stata costruita al livello di parity richiesto.
