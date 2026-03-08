# CONTINUITY REPORT - NEXT Operativita Globale

## Contesto generale
- la legacy resta il sistema attivo stabile e la NEXT cresce in parallelo nello stesso repo
- la shell NEXT runtime su `/next/*` esiste gia ed e separata dalla legacy
- dopo `Mezzi / Dossier` e `Centro di Controllo`, anche `Operativita Globale` supera il placeholder generico

## Modulo/area su cui si stava lavorando
- area principale: `Operativita Globale`
- perimetro task recente: creare una shell reale dei domini globali non mezzo-centrici, senza dati runtime e senza copiare i moduli legacy

## Stato attuale
- `/next/operativita-globale` e ora una pagina strutturata e navigabile
- la pagina chiarisce domini globali, confine con il Dossier, collocazione futura di `Acquisti & Magazzino` e ruolo futuro dell'IA sui flussi globali
- non ci sono letture o scritture dati

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO SOLO UI

## Cosa e gia stato importato/migrato
- shell dedicata della macro-area
- UI strutturata dell'area globale
- collegamenti interni NEXT coerenti con il ruolo selezionato
- nessuna logica business, nessuna lettura dati, nessuna scrittura

## Prossimo step di migrazione
- introdurre una prima sottosezione read-only utile del dominio globale, con provenienza dati chiara e confine stabile verso il Dossier

## Moduli impattati
- src/App.tsx
- src/next/NextOperativitaGlobalePage.tsx
- src/next/next-shell.css

## Contratti dati coinvolti
- nessuno

## Ultime modifiche eseguite
- sostituito il placeholder generico di `/next/operativita-globale` con una pagina dedicata
- chiarito in UI il confine tra domini globali condivisi e contesto mezzo-centrico del Dossier
- aggiornati tracker NEXT, stato progetto e storico decisioni

## File coinvolti
- src/App.tsx
- src/next/NextOperativitaGlobalePage.tsx
- src/next/next-shell.css
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/STATO_ATTUALE_PROGETTO.md
- docs/product/STORICO_DECISIONI_PROGETTO.md

## Decisioni gia prese
- `Operativita Globale` deve restare distinta dal `Dossier Mezzo`
- la shell globale della NEXT deve accogliere i domini `Acquisti & Magazzino` senza trascinare shell standalone disallineate
- questa fase resta solo UI/read-only di predisposizione, senza backend e senza scritture

## Vincoli da non rompere
- non toccare la UX o il runtime della legacy
- non clonare `Acquisti`, `Inventario` o `MaterialiDaOrdinare` dentro la NEXT
- non introdurre letture o scritture dati prima di una fase read-only esplicita
- mantenere coerenza con blueprint, design system, wireframe e stato migrazione NEXT

## Parti da verificare
- quale sottosezione globale conviene importare per prima in read-only
- quale reader canonico usare per ordini, inventario o documenti globali
- come mostrare l'eventuale IA contestuale senza anticipare la v1 ufficiale su Centro di Controllo e Dossier

## Rischi aperti
- rischio di trasformare la macro-area in un miscuglio di moduli senza grammatica unica
- rischio di mescolare troppo presto flussi globali e mezzo-centrici prima di chiarire i reader canonici

## Punti da verificare collegati
- coerenza inventario / materiali
- contratto definitivo allegati preventivi
- governance endpoint IA multipli
- matrice ruoli/permessi definitiva

## Prossimo passo consigliato
- scegliere una prima sottosezione globale read-only piccola ma reale, ad esempio `Acquisti & Magazzino` o una vista inventario

## Cosa NON fare nel prossimo task
- non importare insieme ordini, inventario, consegne e documenti
- non aggiungere dati finti per simulare KPI o backlog
- non introdurre backend, scritture o sync nascosti

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
- `docs/ui-blueprint/BLUEPRINT_GRAFICO_NEXT.md`
- `docs/ui-blueprint/DESIGN_SYSTEM_NEXT.md`
- `docs/ui-blueprint/WIREFRAME_LOGICI_NEXT.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
