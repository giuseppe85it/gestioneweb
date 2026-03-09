# CONTINUITY REPORT - NEXT D04 rifornimenti

## Contesto generale
- la NEXT resta separata dalla legacy e cresce per domini `read-only`
- il Dossier Mezzo aveva gia `D01` stabile e `D02` minimo; ora entra anche un primo `D04` controllato

## Modulo/area su cui si stava lavorando
- Dossier Mezzo NEXT
- primo layer di normalizzazione `D04 Rifornimenti e consumi`

## Stato attuale
- `D01` e `D02` restano attivi nel Dossier
- `D04` entra solo come `canonico ridotto` dal dataset `storage/@rifornimenti.items`

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- elenco mezzi `read-only`
- Dossier Mezzo `read-only`
- blocco tecnico `D02` minimo
- blocco rifornimenti `D04` tramite layer dedicato NEXT

## Prossimo step di migrazione
- valutare se estendere `D04` oltre il canonico ridotto oppure passare al dominio successivo del Dossier

## Moduli impattati
- src/next/NextDossierMezzoPage.tsx
- src/next/nextRifornimentiConsumiDomain.ts

## Contratti dati coinvolti
- storage/@rifornimenti.items
- storage/@mezzi_aziendali
- storage/@lavori
- storage/@manutenzioni

## Ultime modifiche eseguite
- creato il layer `src/next/nextRifornimentiConsumiDomain.ts`
- integrato il blocco rifornimenti nel `Dossier Mezzo NEXT`
- aggiornati stato migrazione, stato progetto e storico decisioni

## File coinvolti
- src/next/nextRifornimentiConsumiDomain.ts
- src/next/NextDossierMezzoPage.tsx
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/STATO_ATTUALE_PROGETTO.md
- docs/product/STORICO_DECISIONI_PROGETTO.md

## Decisioni gia prese
- il madre non si tocca se la normalizzazione NEXT basta
- `D04` in NEXT non legge `tmp` e non replica merge/fallback legacy

## Vincoli da non rompere
- nessun writer NEXT su `D04`
- nessuna lettura `@rifornimenti_autisti_tmp` o `value.items`
- il Dossier deve leggere solo il modello pulito prodotto dal layer

## Parti da verificare
- copertura reale di `km` e `costo` nel dataset live
- eventuale estensione futura del contratto `D04` oltre il blocco ridotto

## Rischi aperti
- il blocco D04 non equivale ancora alla resa completa del madre
- `data` resta una label display e non un timestamp canonico nel layer corrente

## Punti da verificare collegati
- docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md

## Prossimo passo consigliato
- decidere se il prossimo task deve estendere `D04` in modo controllato o importare un nuovo dominio mezzo-centrico

## Cosa NON fare nel prossimo task
- non leggere `tmp` direttamente in UI
- non copiare i merge legacy fuori dal layer `D04`

## Commit/hash rilevanti
- NON ESEGUITO - patch locale next d04 canonico ridotto

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/data/DOMINI_DATI_CANONICI.md`
- `docs/data/AUDIT_RIFORNIMENTI_NEXT_READONLY.md`
- `docs/data/CHECK_REALE_RIFORNIMENTI_ITEMS.md`
- `docs/data/FLUSSO_REALE_RIFORNIMENTI.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
