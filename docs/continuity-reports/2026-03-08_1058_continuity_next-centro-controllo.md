# CONTINUITY REPORT - NEXT Centro di Controllo

## Contesto generale
- la legacy resta il sistema attivo stabile e la NEXT cresce in parallelo nello stesso repo
- la shell NEXT runtime su `/next/*` esiste gia ed e separata dalla legacy
- dopo `Mezzi / Dossier`, anche `Centro di Controllo` supera il placeholder generico

## Modulo/area su cui si stava lavorando
- area principale: `Centro di Controllo`
- perimetro task recente: creare una shell reale del cockpit NEXT, senza dati runtime e senza copiare la home legacy

## Stato attuale
- `/next/centro-controllo` e ora una pagina strutturata e navigabile
- la pagina chiarisce visione generale del sistema, priorita, alert, scadenze, destinazioni verso Dossier e altre macro-aree, e spazio futuro per IA Business v1
- non ci sono letture o scritture dati

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO SOLO UI

## Cosa e gia stato importato/migrato
- shell dedicata della macro-area
- UI strutturata del cockpit
- collegamenti interni NEXT coerenti con il ruolo selezionato
- nessuna logica business, nessuna lettura dati, nessuna scrittura

## Prossimo step di migrazione
- introdurre il primo segnale reale read-only del cockpit, con destinazione chiara verso Dossier o modulo corretto

## Moduli impattati
- src/App.tsx
- src/next/NextCentroControlloPage.tsx
- src/next/next-shell.css

## Contratti dati coinvolti
- nessuno

## Ultime modifiche eseguite
- sostituito il placeholder generico di `/next/centro-controllo` con una pagina dedicata
- chiarita in UI la differenza tra cockpit globale, moduli di dettaglio e Dossier mezzo-centrico
- aggiornati tracker NEXT, stato progetto e storico decisioni

## File coinvolti
- src/App.tsx
- src/next/NextCentroControlloPage.tsx
- src/next/next-shell.css
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/STATO_ATTUALE_PROGETTO.md
- docs/product/STORICO_DECISIONI_PROGETTO.md

## Decisioni gia prese
- il `Centro di Controllo` e la home target della NEXT
- il cockpit deve aggregare e instradare, non sostituire i moduli che gestiscono il dettaglio
- questa fase resta solo UI/read-only di predisposizione, senza backend e senza scritture

## Vincoli da non rompere
- non toccare la UX o il runtime della legacy
- non clonare la `Home` legacy o `CentroControllo` legacy dentro la NEXT
- non introdurre letture o scritture dati prima di una fase read-only esplicita
- mantenere coerenza con blueprint, design system, wireframe e stato migrazione NEXT

## Parti da verificare
- quali segnali del cockpit conviene importare per primi in read-only
- quale reader canonico usare per alert, priorita o scadenze del Centro di Controllo
- come mostrare la futura IA Business v1 nel cockpit senza farla diventare il centro visivo della pagina

## Rischi aperti
- rischio di trasformare il cockpit in una dashboard generica senza destinazioni operative forti
- rischio di mescolare troppo presto dati di flussi ancora non canonici

## Punti da verificare collegati
- stream eventi autisti canonico definitivo
- policy Firestore reali/versionate
- governance endpoint IA multipli
- matrice ruoli/permessi definitiva

## Prossimo passo consigliato
- scegliere un primo blocco cockpit read-only piccolo ma reale, con provenienza dati chiara e drill-down coerente

## Cosa NON fare nel prossimo task
- non importare tutta la home legacy nella NEXT
- non aggiungere KPI o alert con numeri inventati
- non introdurre backend, scritture o filtri globali non canonici

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
