# CONTINUITY REPORT - D04 rifornimenti canonici

## Contesto generale
- la NEXT resta read-only e separata dalla legacy
- il dominio `D04 Rifornimenti e consumi` non e stato importato nella NEXT in questo task

## Modulo/area su cui si stava lavorando
- normalizzazione documentale del dominio dati `D04`
- perimetro limitato a contratto canonico, transizione `tmp -> canonico` e stato dominio

## Stato attuale
- `@rifornimenti` e ora definito come dataset business target del dominio
- `@rifornimenti_autisti_tmp` e definito come staging operativo
- il runtime legacy continua pero a leggere e fondere dataset multipli

## Legacy o Next
- ENTRAMBI

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Dossier NEXT con `D01` read-only
- Dossier NEXT con primo blocco `D02` read-only
- nessun import `D04` nella NEXT

## Prossimo step di migrazione
- progettare un reader NEXT `D04` solo se legge esclusivamente `@rifornimenti.items` e non usa fallback sul tmp

## Moduli impattati
- docs/data/DOMINI_DATI_CANONICI.md
- docs/data/REGOLE_STRUTTURA_DATI.md
- docs/product/STORICO_DECISIONI_PROGETTO.md

## Contratti dati coinvolti
- `@rifornimenti`
- `@rifornimenti_autisti_tmp`

## Ultime modifiche eseguite
- documentato il flusso reale attuale di `D04`
- fissata la shape target canonica del dataset business
- spostato `D04` a stato `SENSIBILE` sul piano architetturale

## File coinvolti
- docs/data/DOMINI_DATI_CANONICI.md
- docs/data/REGOLE_STRUTTURA_DATI.md
- docs/product/STORICO_DECISIONI_PROGETTO.md

## Decisioni gia prese
- il dataset business target di `D04` e `@rifornimenti`
- `@rifornimenti_autisti_tmp` non deve entrare nei reader business NEXT

## Vincoli da non rompere
- non toccare legacy runtime per chiudere il contratto solo documentale
- non usare merge tmp/canonico lato reader nella NEXT
- non dichiarare importabile `D04` senza verificare il dataset canonico reale

## Parti da verificare
- applicazione runtime futura della shape unica `items`
- qualita reale dei campi `km`, `timestamp`, `costo`, `source`, `validation` nel canonico

## Rischi aperti
- alcuni reader legacy continuano a usare il tmp come sorgente o fallback
- il canonico reale puo ancora contenere record incompleti o shape storiche

## Punti da verificare collegati
- `docs/data/DOMINI_DATI_CANONICI.md` punto aperto su allineamento runtime del contratto `tmp -> canonico`

## Prossimo passo consigliato
- fare un audit mirato dei record reali `@rifornimenti` per misurare quanto il dataset canonico e gia leggibile senza merge

## Cosa NON fare nel prossimo task
- non importare `D04` nella NEXT leggendo insieme tmp e canonico

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

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
