# CONTINUITY REPORT - Libretti Export clone

## Contesto generale
- Il progetto e nella fase di clone `read-only` fedele della madre su `src/next/*`.

## Modulo/area su cui si stava lavorando
- Hub `Intelligenza Artificiale`
- Primo sottomodulo reale clone-safe `Libretti (Export PDF)`

## Stato attuale
- `/next/ia` resta il hub reale madre del clone.
- `/next/libretti-export` e ora apribile con lista mezzi, selezione e anteprima PDF locale.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Route clone dedicata
- Reader/domain dedicato
- UI lista/selezione
- Modal clone locale per preview

## Prossimo step di migrazione
- Valutare se aprire in un secondo step il solo download locale oppure mantenere il perimetro fermo alla preview.

## Moduli impattati
- `Intelligenza Artificiale`
- `Libretti Export`
- `Anagrafiche flotta`

## Contratti dati coinvolti
- `storage/@mezzi_aziendali`
- `librettoUrl`
- `librettoStoragePath`

## Ultime modifiche eseguite
- Aggiunta route `/next/libretti-export`
- Resa cliccabile la card `Libretti (Export PDF)` nel hub `/next/ia`
- Creati page/domain/modal clone dedicati senza share o download

## File coinvolti
- src/App.tsx
- src/next/NextIntelligenzaArtificialePage.tsx
- src/next/NextLibrettiExportPage.tsx
- src/next/NextPdfPreviewModal.tsx
- src/next/domain/nextLibrettiExportDomain.ts
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/product/STATO_MIGRAZIONE_NEXT.md

## Decisioni gia prese
- Non riusare direttamente `src/pages/LibrettiExport.tsx`.
- Nessuna azione esterna/browser nel primo step clone-safe.
- Nessuna lettura raw nella UI clone.

## Vincoli da non rompere
- Madre intoccabile.
- Tutte le modifiche runtime restano confinate a `/next`.
- Nessuna scrittura, share, download, upload o runtime IA nel clone.

## Parti da verificare
- Se convenga in futuro aprire il solo download locale senza allargare il perimetro.
- Se estendere `Libretti Export` a un quick link diretto: oggi non consigliato per fedelta alla madre.

## Rischi aperti
- Il fallback immagini resta dipendente dal path Storage reale e dalle policy effettive.
- `Libretti Export` legge un dominio sensibile (`@mezzi_aziendali`), anche se ora solo tramite layer clone.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md` -> Policy Storage effettive

## Prossimo passo consigliato
- Audit mirato su eventuale apertura clone-safe del solo `Archivio Libretti`, separandolo dal writer `IALibretto`.

## Cosa NON fare nel prossimo task
- Non riattivare `Condividi`, `Copia link`, `Apri WhatsApp` o `Scarica` dentro il modal clone senza una decisione esplicita.
- Non riusare direttamente la pagina madre `LibrettiExport`.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
