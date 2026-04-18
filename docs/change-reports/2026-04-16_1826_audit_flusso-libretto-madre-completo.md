# CHANGE REPORT - audit flusso libretto madre completo

## File toccati
- `docs/audit/AUDIT_FLUSSO_LIBRETTO_MADRE_COMPLETO_2026-04-16_1826.md`

## Tipo intervento
- Solo documentazione
- Nessuna patch runtime
- Nessuna modifica madre

## Obiettivo
- Ricostruire in sola lettura il comportamento reale del flusso legacy `IA Libretto`, inclusi salvataggio, Storage, reader downstream e limiti dimostrabili del repo.

## Cosa e stato fatto
- verificata la route legacy reale `/ia/libretto` e i punti di ingresso UI;
- tracciata la chiamata frontend all’endpoint esterno `estrazione-libretto`;
- ricostruiti i campi realmente usati dal frontend dopo la risposta IA;
- ricostruita la sequenza reale di salvataggio su `storage/@mezzi_aziendali` e su Storage Firebase;
- verificato come leggono dopo il salvataggio `IALibretto`, `DossierMezzo`, `IACoperturaLibretti`, `ControlloDebug`, `LibrettiExport`, `Home` e `Mezzi`;
- verificata la compatibilita del path `mezzi_aziendali/<mezzoId>/libretto.jpg` con `storage.rules`;
- marcati esplicitamente i punti `NON DIMOSTRATO`.

## Esito
- audit documentale completato;
- nessun codice runtime modificato;
- verdetto finale dell’audit: `FLUSSO LIBRETTO MADRE NON ANCORA RICOSTRUITO AL 100%`.

## Blocco reale emerso
- il contratto backend completo dell’estrazione non e dimostrabile dal solo repo perche il servizio esterno `estrazione-libretto` non ha il codice sorgente disponibile qui.

## Commit hash
- NON ESEGUITO
