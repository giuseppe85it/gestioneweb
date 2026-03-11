# CONTINUITY REPORT - Riallineamento metadata access e guard clone

## Contesto generale
- Il progetto resta nella fase di clone `read-only` fedele della madre su `src/next/*`.

## Modulo/area su cui si stava lavorando
- Metadata centrali del clone
- Access map frontend
- Guard minima delle route clone

## Stato attuale
- Le route clone gia aperte hanno ora un allineamento centrale coerente in `nextData.ts`, `nextAccess.ts` e `NextRoleGuard.tsx`.
- Nessun modulo business nuovo e stato aperto.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Catalogo aree clone aggiornato ai moduli realmente attivi
- Access map riallineata a `Capo`, `Colleghi`, `Fornitori`, `IA`, `Libretti Export`
- Guard minima agganciata davvero alla registry accessi

## Prossimo step di migrazione
- Audit o patch piccola sulle route madre oggi solo embedded, a partire da `Lavori` oppure `Analisi Economica` route dedicata.

## Moduli impattati
- `Centro di Controllo`
- `Mezzi / Dossier`
- `Operativita Globale`
- `Area Capo`
- `Colleghi`
- `Fornitori`
- `Intelligenza Artificiale`
- `Libretti Export`

## Contratti dati coinvolti
- Nessun contratto dati nuovo

## Ultime modifiche eseguite
- Aggiornata la mappa centrale `nextData.ts` con aree attive e stato reale del clone
- Aggiornata `nextAccess.ts` con permission key coerenti alle route attive
- Aggiornato `NextRoleGuard.tsx` per non restare una no-op scollegata dalle aree reali
- Sistemati gli `areaId` in `App.tsx` per `capo`, `libretti-export` e `autista-separato`

## File coinvolti
- src/App.tsx
- src/next/nextData.ts
- src/next/nextAccess.ts
- src/next/NextRoleGuard.tsx
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/product/STATO_MIGRAZIONE_NEXT.md

## Decisioni gia prese
- Nessuna nuova route business in questo task
- Nessun cambio UX visibile non necessario
- Guardia volutamente permissiva per non rompere il clone read-only

## Vincoli da non rompere
- Madre intoccabile
- Nessuna scrittura nel clone
- Nessuna semantica concettuale reintrodotta per `IA Gestionale` o famiglie non reali

## Parti da verificare
- Se in un task futuro convenga rendere la guardia effettivamente restrittiva dopo aver chiuso la matrice permessi definitiva
- Se riallineare anche la topbar ai moduli gia aperti oppure lasciarla minima

## Rischi aperti
- La matrice ruoli/permessi definitiva resta ancora aperta a livello progettuale
- Alcune route madre sono ancora coperte solo come viste embedded, non come route clone dedicate

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md` -> Matrice ruoli/permessi definitiva

## Prossimo passo consigliato
- Task piccolo su una famiglia reale oggi visibile ma non aperta, evitando refactor ampi del clone

## Cosa NON fare nel prossimo task
- Non trasformare questa guardia minima in auth reale
- Non usare metadata/access per aprire moduli non ancora auditati

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
