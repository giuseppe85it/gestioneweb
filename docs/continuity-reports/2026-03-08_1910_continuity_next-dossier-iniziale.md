# CONTINUITY REPORT - NEXT Dossier iniziale

## Contesto generale
- la NEXT ha ora i primi ingressi reali `read-only` sull'area mezzo-centrica
- la legacy resta attiva e invariata; nessuna route o writer legacy e stata sostituita

## Modulo/area su cui si stava lavorando
- `Mezzi / Dossier`
- apertura del primo Dossier Mezzo NEXT iniziale a partire dal dominio `D01`

## Stato attuale
- stabile: esistono elenco mezzi `read-only` e route detail `/next/mezzi-dossier/:targa`
- in corso: il Dossier dettaglio legge solo identita mezzo e non ha ancora convergenze da altri domini

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- lettura dati reali da `storage/@mezzi_aziendali`
- elenco mezzi NEXT con ricerca/filtro locale
- primo dettaglio/Dossier mezzo `read-only`

## Prossimo step di migrazione
- valutare il primo ingresso `read-only` del dominio `D02 Operativita tecnica mezzo` nel Dossier, ma solo con reader dedicato e senza toccare writer legacy

## Moduli impattati
- `src/next/NextMezziDossierPage.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/nextAnagraficheFlottaDomain.ts`
- `src/App.tsx`

## Contratti dati coinvolti
- `storage/@mezzi_aziendali`
- dominio logico `Anagrafiche flotta e persone`
- `@colleghi` resta mappato ma escluso dalla lettura in questa fase

## Ultime modifiche eseguite
- aggiunta route NEXT di dettaglio mezzo per targa
- collegato l'elenco mezzi al primo Dossier iniziale
- aggiornati `STATO_MIGRAZIONE_NEXT`, `STATO_ATTUALE_PROGETTO` e `STORICO_DECISIONI_PROGETTO`

## File coinvolti
- `src/App.tsx`
- `src/next/nextAnagraficheFlottaDomain.ts`
- `src/next/NextMezziDossierPage.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/next-shell.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`

## Decisioni gia prese
- il primo Dossier NEXT e importabile solo come nucleo iniziale `read-only`
- il dettaglio usa solo il dominio `D01` e non importa domini sensibili o bloccanti per riempimento
- la route canonica NEXT del primo dettaglio mezzo e `/next/mezzi-dossier/:targa`

## Vincoli da non rompere
- non importare nel Dossier domini oltre `D01` senza verifica in `docs/data/DOMINI_DATI_CANONICI.md`
- non introdurre scritture, backend o riuso diretto della logica `DossierMezzo` legacy
- non scambiare il Dossier iniziale per migrazione completa della parte mezzo-centrica

## Parti da verificare
- quando includere `@colleghi` in modo utile e non decorativo
- quale dominio mezzo-centrico importare dopo nel Dossier senza superare il livello di rischio consentito

## Rischi aperti
- il Dossier resta volutamente parziale e puo essere sovraesteso male se non si mantiene il vincolo dominio-centrico
- i domini `D04`, `D07` e `D08` non devono entrare nel dettaglio senza reader dedicati e note di provenienza

## Punti da verificare collegati
- restano validi i punti generali di `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`; nessun nuovo punto aperto e stato aggiunto in questo step

## Prossimo passo consigliato
- progettare il primo blocco operativo del Dossier con `D02 Operativita tecnica mezzo`, mantenendo lista e dettaglio separati e read-only

## Cosa NON fare nel prossimo task
- non leggere ancora rifornimenti, documenti, costi o IA contestuale solo per riempire il Dossier
- non introdurre scritture o shortcut che aggirano il reader canonico `D01`

## Commit/hash rilevanti
- NON ESEGUITO - patch locale next dossier-iniziale read-only

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/DOMINI_DATI_CANONICI.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
