# CONTINUITY REPORT - Flusso rifornimenti

## Contesto generale
- Il progetto sta normalizzando i domini dati prima di estenderli nella NEXT.
- `D04 Rifornimenti e consumi` era gia noto come dominio sensibile per via di dataset doppi e merge legacy.

## Modulo/area su cui si stava lavorando
- Audit tecnico end-to-end del flusso rifornimenti.
- Perimetro solo documentale, nessuna patch runtime.

## Stato attuale
- Il flusso reale dei rifornimenti nel codice e ora abbastanza chiaro.
- Resta da verificare solo il contenuto live del doc `storage/@rifornimenti` da ambiente con permessi adeguati.

## Legacy o Next
- ENTRAMBI

## Stato area/modulo nella NEXT
- DA VERIFICARE

## Cosa e gia stato importato/migrato
- Niente di nuovo in questo task.
- La NEXT non e stata modificata.

## Prossimo step di migrazione
- Valutare un eventuale reader NEXT minimale che legga solo `@rifornimenti.items` e solo il sottoinsieme canonico gia documentato.

## Moduli impattati
- `src/autisti/Rifornimento.tsx`
- `src/autistiInbox/AutistiAdmin.tsx`
- `src/pages/DossierMezzo.tsx`
- `src/pages/RifornimentiEconomiaSection.tsx`
- `src/pages/DossierRifornimenti.tsx`
- `src/pages/AnalisiEconomica.tsx`
- `src/pages/CentroControllo.tsx`
- `src/utils/homeEvents.ts`
- `src/pages/Autista360.tsx`
- `src/pages/Mezzo360.tsx`
- `src/pages/CisternaCaravate/CisternaCaravatePage.tsx`
- `src/pages/CisternaCaravate/CisternaSchedeTest.tsx`

## Contratti dati coinvolti
- `@rifornimenti_autisti_tmp`
- `@rifornimenti`
- `storageSync`

## Ultime modifiche eseguite
- Creato il documento master del flusso reale rifornimenti.
- Distinti writer, reader tmp-only e reader con merge dossier/tmp.
- Chiarita la strategia da seguire e i pattern da non copiare nella NEXT.

## File coinvolti
- docs/data/FLUSSO_REALE_RIFORNIMENTI.md
- docs/change-reports/2026-03-08_2050_docs_flusso-reale-rifornimenti.md
- docs/continuity-reports/2026-03-08_2050_continuity_flusso-rifornimenti.md

## Decisioni gia prese
- La NEXT non deve leggere `@rifornimenti_autisti_tmp`.
- La NEXT non deve copiare merge euristici o fallback `value.items`.
- Il riferimento principale per il flusso end-to-end e ora `docs/data/FLUSSO_REALE_RIFORNIMENTI.md`.

## Vincoli da non rompere
- Nessuna modifica al gestionale madre o all'app autisti per questo filone documentale.
- Nessuna scrittura dati nuova nella NEXT.
- Dominio logico, dataset fisico e tolleranze legacy vanno tenuti separati.

## Parti da verificare
- Presenza reale live di `items` top-level in `storage/@rifornimenti`.
- Eventuali residui live di shape legacy non visibili dal solo repo.

## Rischi aperti
- Importare `D04` nella NEXT copiando le tolleranze legacy sporcherebbe subito il Dossier NEXT.
- Trattare `km` o `costo` come obbligatori nel canonico attuale puo generare letture incomplete.

## Punti da verificare collegati
- `DA VERIFICARE`

## Prossimo passo consigliato
- Se si apre un task NEXT su `D04`, partire da `docs/data/FLUSSO_REALE_RIFORNIMENTI.md` e da `docs/data/CHECK_REALE_RIFORNIMENTI_ITEMS.md`, limitando l'eventuale reader al sottoinsieme canonico minimo.

## Cosa NON fare nel prossimo task
- Non leggere `@rifornimenti_autisti_tmp` nella NEXT.
- Non introdurre merge dossier/tmp o fallback euristici.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/data/REGOLE_STRUTTURA_DATI.md`
- `docs/data/DOMINI_DATI_CANONICI.md`
- `docs/data/AUDIT_RIFORNIMENTI_NEXT_READONLY.md`
- `docs/data/CHECK_REALE_RIFORNIMENTI_ITEMS.md`
- `docs/data/FLUSSO_REALE_RIFORNIMENTI.md`
