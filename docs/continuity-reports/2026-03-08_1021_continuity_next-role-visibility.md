# CONTINUITY REPORT - NEXT ruolo e visibilita shell

## Contesto generale
- La legacy resta il sistema attivo stabile.
- La NEXT esiste nel runtime frontend su route dedicate `/next/*` e ora include anche una prima struttura di accesso/visibilita per ruolo solo lato frontend.

## Modulo/area su cui si stava lavorando
- Shell globale NEXT
- Predisposizione visibilita/accesso per ruoli `admin`, `gestionale`, `autista`

## Stato attuale
- La shell NEXT ha config ruoli centralizzata, menu dinamico, route guard leggere e schermata di accesso non consentito.
- Il ruolo autista non vede le macro-aree admin e atterra su una vista tecnica separata che ribadisce il perimetro distinto dall'area gestionale.
- Non esistono ancora auth reale, backend dedicato, reader dati o scritture nella NEXT.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- SHELL CREATA

## Cosa e gia stato importato/migrato
- shell
- navigazione
- UI placeholder delle 5 macro-aree
- visibilita/accesso frontend per ruolo
- nessuna lettura dati
- nessuna scrittura

## Prossimo step di migrazione
- Importare una prima superficie `read-only` reale nella NEXT, mantenendo il gating ruolo gia predisposto e senza introdurre auth fittizia o scritture.

## Moduli impattati
- `src/App.tsx`
- `src/next/*`
- tracker NEXT

## Contratti dati coinvolti
- nessuno

## Ultime modifiche eseguite
- Aggiunta config ruoli/permessi shell-only per `admin`, `gestionale`, `autista`
- Introdotto cambio vista ruolo via query param `role`
- Aggiunto blocco route non consentite e vista autista separata
- Aggiornato `docs/product/STATO_MIGRAZIONE_NEXT.md` con lo stato reale della predisposizione ruolo/accesso

## File coinvolti
- `src/App.tsx`
- `src/next/NextShell.tsx`
- `src/next/NextAreaPage.tsx`
- `src/next/nextData.ts`
- `src/next/nextAccess.ts`
- `src/next/NextRoleGuard.tsx`
- `src/next/NextAccessDeniedPage.tsx`
- `src/next/NextDriverExperiencePage.tsx`
- `src/next/NextRoleLandingRedirect.tsx`
- `src/next/next-shell.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`

## Decisioni gia prese
- La NEXT vive nello stesso repo ma su route dedicate e separate dalla legacy
- La shell NEXT puo preparare visibilita/accesso per ruolo prima della security reale
- L'autista resta esperienza separata e non va inglobato nella shell admin come gestionale ridotto

## Vincoli da non rompere
- Non sostituire `/` o alterare il comportamento delle route legacy
- Non introdurre scritture dati o backend/auth reale in modo implicito
- Non confondere il gating frontend con sicurezza vera
- Aggiornare sempre `docs/product/STATO_MIGRAZIONE_NEXT.md` quando la NEXT cambia stato

## Parti da verificare
- Matrice ruoli/permessi finale per singolo utente
- Strategia di ingresso reale alla NEXT quando arrivera auth non anonima
- Se `Strumenti Trasversali` restera admin-only o avra scope parziali per altri account gestionali

## Rischi aperti
- I punti aperti architetturali su IA/PDF, Storage/Firestore e contratti dati restano invariati
- Il worktree contiene modifiche pregresse non legate a questo task su altri documenti

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Portare nella NEXT una prima pagina `read-only` reale, ad esempio `Centro di Controllo` o `Dossier Mezzo`, usando il nuovo modello di visibilita gia pronto.

## Cosa NON fare nel prossimo task
- Non introdurre auth reale improvvisata solo per “chiudere il cerchio”
- Non migrare contemporaneamente piu moduli business e la matrice permessi finale
- Non toccare l'area autisti legacy come se la separazione fosse gia risolta definitivamente

## Commit/hash rilevanti
- `NON ESEGUITO`

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
