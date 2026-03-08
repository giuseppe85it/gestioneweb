# CONTINUITY REPORT - D04 next block

## Contesto generale
- la NEXT resta separata e `read-only`
- il Dossier NEXT legge solo `D01` e `D02` minimo

## Modulo/area su cui si stava lavorando
- verifica di importabilita `D04 Rifornimenti e consumi` nel Dossier NEXT
- perimetro limitato a eventuale convergenza minima `read-only`

## Stato attuale
- `D04` ha ora un target canonico documentato
- il dataset runtime `@rifornimenti.items` non e ancora allineato in modo dimostrabile al contratto richiesto dalla NEXT

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- elenco mezzi `D01`
- Dossier iniziale `D01`
- blocco tecnico minimo `D02`
- nessun blocco `D04`

## Prossimo step di migrazione
- verificare o riallineare fuori dalla NEXT il dataset business `@rifornimenti.items` affinche esponga davvero `timestamp`, `source` e `validation`

## Moduli impattati
- docs/product/STATO_MIGRAZIONE_NEXT.md

## Contratti dati coinvolti
- `@rifornimenti`
- `@rifornimenti_autisti_tmp`

## Ultime modifiche eseguite
- registrato il blocco `D04` nel tracker NEXT
- confermato che il Dossier NEXT non usa fallback su `tmp`

## File coinvolti
- docs/product/STATO_MIGRAZIONE_NEXT.md

## Decisioni gia prese
- `D04` non entra ancora nel Dossier NEXT
- la NEXT non puo leggere `value.items` o `@rifornimenti_autisti_tmp` per compensare il canonico

## Vincoli da non rompere
- non toccare la legacy rifornimenti
- non introdurre merge reader-side nella NEXT
- non importare campi non canonici per riempire il Dossier

## Parti da verificare
- presenza reale di `timestamp` numerico nel dataset business attivo
- presenza reale di `source` e `validation` in `@rifornimenti.items`

## Rischi aperti
- il canonico attuale puo restare leggibile solo parzialmente
- un import prematuro di `D04` reintrodurrebbe logiche legacy non canoniche nella NEXT

## Punti da verificare collegati
- `docs/data/DOMINI_DATI_CANONICI.md` punto aperto su allineamento runtime del contratto `tmp -> canonico`

## Prossimo passo consigliato
- audit mirato del writer canonico o dei record reali `@rifornimenti.items` prima di qualunque reader NEXT

## Cosa NON fare nel prossimo task
- non usare `data` formattata, `value.items` o `tmp` come scorciatoia per importare i rifornimenti nella NEXT

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/data/DOMINI_DATI_CANONICI.md`
- `docs/data/REGOLE_STRUTTURA_DATI.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
