# CONTINUITY REPORT - D04 rifornimenti items check

## Contesto generale
- Il progetto sta costruendo la NEXT per domini canonici, lasciando la legacy invariata.
- Dopo l'audit generale su `D04`, serviva capire se il solo canonico `@rifornimenti.items` fosse gia abbastanza pulito per un primo ingresso read-only minimo.

## Modulo/area su cui si stava lavorando
- Dominio dati `D04 Rifornimenti e consumi`
- Check mirato sul solo dataset business `@rifornimenti.items`

## Stato attuale
- Il repo conferma che i writer correnti popolano `@rifornimenti` con una proiezione ridotta e abbastanza regolare.
- Il live document Firestore non e stato leggibile da qui per permessi insufficienti, quindi resta `DA VERIFICARE` la diffusione reale dei record gia riallineati.

## Legacy o Next
- ENTRAMBI

## Stato area/modulo nella NEXT
- NON INIZIATO

## Cosa e gia stato importato/migrato
- Nessuna lettura `D04` nella NEXT.
- Esiste ora un check dedicato che identifica un sottoinsieme minimo importabile dal solo `@rifornimenti.items`.

## Prossimo step di migrazione
- Se si apre il prossimo task `D04` sulla NEXT, limitarsi al sottocontratto minimo:
  - `id`
  - `mezzoTarga`
  - `data`
  - `litri`
  - `distributore`
  - `note`
- `km` e `costo` solo come opzionali nullable, mai ricostruiti.

## Moduli impattati
- `src/autisti/Rifornimento.tsx`
- `src/autistiInbox/AutistiAdmin.tsx`
- `src/pages/RifornimentiEconomiaSection.tsx`
- `src/pages/CentroControllo.tsx`

## Contratti dati coinvolti
- `@rifornimenti`
- `@rifornimenti_autisti_tmp`

## Ultime modifiche eseguite
- Creato `docs/data/CHECK_REALE_RIFORNIMENTI_ITEMS.md`.
- Classificati i campi canonici per affidabilita reale dal punto di vista del repo.
- Chiarito che esiste un nucleo importabile, ma non la piena parita col gestionale madre.

## File coinvolti
- docs/data/CHECK_REALE_RIFORNIMENTI_ITEMS.md
- docs/change-reports/2026-03-08_2033_docs_check-reale-rifornimenti-items.md
- docs/continuity-reports/2026-03-08_2033_continuity_d04-rifornimenti-items-check.md

## Decisioni gia prese
- Il futuro reader NEXT `D04` non deve leggere `@rifornimenti_autisti_tmp`.
- Il futuro reader NEXT `D04` non deve usare merge o fallback `value.items`.
- Il primo sottocontratto leggibile da `@rifornimenti.items` e piu stretto del target `D04` completo.

## Vincoli da non rompere
- Nessuna modifica a gestionale madre, app autisti, backend o storage.
- Nessun reader NEXT che recuperi `km`, `autistaNome` o `badgeAutista` dal `tmp`.
- Nessuna promozione implicita di `data` stringa a `timestamp` canonico completo.

## Parti da verificare
- Diffusione reale nel live document di `items` top-level senza residui `value.items`.
- Frequenza reale di `km` e `costo` valorizzati nel canonico.

## Rischi aperti
- Un import NEXT troppo ambizioso potrebbe confondere il sottocontratto minimo con il contratto `D04` target.
- Senza verifica live, la copertura reale del canonico resta solo indirettamente dimostrata dal repo.

## Punti da verificare collegati
- DA VERIFICARE

## Prossimo passo consigliato
- Se si vuole davvero aprire `D04` nella NEXT, implementare solo una lista read-only minima dal solo `@rifornimenti.items`, con campi strettamente limitati al sottocontratto approvato.

## Cosa NON fare nel prossimo task
- Non leggere `@rifornimenti_autisti_tmp`.
- Non mostrare `autistaNome`, `badgeAutista`, `source` o `validation` come se fossero gia presenti nel canonico.
- Non usare `km` o `costo` come campi obbligatori del primo blocco.

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
- `docs/data/AUDIT_RIFORNIMENTI_NEXT_READONLY.md`
- `docs/data/CHECK_REALE_RIFORNIMENTI_ITEMS.md`
