# CONTINUITY REPORT - NEXT Mezzi / Dossier

## Contesto generale
- il progetto mantiene la legacy come sistema attivo stabile e fa crescere la NEXT in parallelo nello stesso repo
- la shell NEXT su route `/next/*` esiste gia ed e separata dalla legacy
- l'area `Mezzi / Dossier` e il primo step reale oltre il placeholder generico

## Modulo/area su cui si stava lavorando
- area principale: `Mezzi / Dossier`
- perimetro task recente: costruire una shell reale, navigabile e coerente, senza dati reali e senza migrare la logica del Dossier legacy

## Stato attuale
- la NEXT ha ora una pagina strutturata su `/next/mezzi-dossier`
- la pagina chiarisce ingresso area mezzi, centralita del Dossier, flussi che convergono nel Dossier e differenza da Operativita Globale
- non ci sono ancora letture o scritture dati

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO SOLO UI

## Cosa e gia stato importato/migrato
- shell dedicata
- UI strutturata dell'area Mezzi / Dossier
- spiegazione delle convergenze e dei moduli futuri
- nessuna logica business, nessuna lettura dati, nessuna scrittura

## Prossimo step di migrazione
- introdurre il primo import read-only realmente utile del Dossier, partendo da una vista minima e controllata per elenco mezzi o header dossier

## Moduli impattati
- src/App.tsx
- src/next/NextRoleGuard.tsx
- src/next/NextMezziDossierPage.tsx
- src/next/next-shell.css

## Contratti dati coinvolti
- nessuno

## Ultime modifiche eseguite
- sostituito il placeholder generico di `/next/mezzi-dossier` con una pagina dedicata
- chiarita in UI la gerarchia tra ingresso area, dossier, convergenze e moduli futuri
- aggiornati tracker NEXT, stato progetto e storico decisioni

## File coinvolti
- src/App.tsx
- src/next/NextRoleGuard.tsx
- src/next/NextMezziDossierPage.tsx
- src/next/next-shell.css
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/STATO_ATTUALE_PROGETTO.md
- docs/product/STORICO_DECISIONI_PROGETTO.md

## Decisioni gia prese
- il primo step reale della NEXT parte da `Mezzi / Dossier`
- il `Dossier Mezzo` resta il cuore del sistema nella NEXT
- questa fase resta solo UI/read-only di predisposizione, senza backend e senza scritture

## Vincoli da non rompere
- non toccare la UX o il runtime della legacy
- non clonare il `DossierMezzo` legacy dentro la NEXT senza analisi dedicata
- non introdurre letture o scritture Firestore/Storage in questa area senza task esplicito
- mantenere la coerenza con blueprint, design system e stato migrazione NEXT

## Parti da verificare
- quali sezioni del Dossier conviene importare per prime in read-only
- quale reader canonico usare per elenco mezzi e header dossier
- rapporto preciso tra futuri moduli mezzo-centrici e Operativita Globale nella NEXT

## Rischi aperti
- rischio di trasformare la pagina in un clone incompleto della legacy se si aggiungono sezioni senza ordine
- rischio di confondere shell UI e migrazione business reale se non si aggiorna il tracker NEXT a ogni step

## Punti da verificare collegati
- matrice ruoli/permessi definitiva
- policy Firestore reali/versionate
- governance endpoint IA multipli
- stream eventi autisti canonico definitivo

## Prossimo passo consigliato
- costruire il primo frammento read-only utile del Dossier nella NEXT, con perimetro minimo e dati chiaramente tracciati

## Cosa NON fare nel prossimo task
- non importare lavori, materiali, rifornimenti e documenti tutti insieme
- non introdurre scritture o sync nascosti
- non cambiare le altre macro-aree oltre il minimo necessario

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
