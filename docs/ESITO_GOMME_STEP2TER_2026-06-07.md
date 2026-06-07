# ESITO GOMME D1 - STEP 2-TER

Data esecuzione: 2026-06-07

Modalita: esecuzione finale approvata, nessuna modifica al codice.

## Esito

ESECUZIONE COMPLETATA con anomalia conteggio su `@gomme_eventi`.

Le operazioni richieste sono state eseguite per id esatto. In `@gomme_eventi` il record test futuro TI282780 con id `ea43d48f-0ef3-40d5-8c63-8245333fc142` era presente due volte nel dato fisico; la rimozione per id esatto ha eliminato entrambe le occorrenze. Per questo il delta fisico di `@gomme_eventi` e' `-3` invece del `-2` atteso.

## Backup

Path: `C:\tmp\gomme_step2ter_backup_2026-06-07`

File verificati non vuoti:

| Key | File | Dimensione |
| --- | --- | ---: |
| `@manutenzioni` | `C:\tmp\gomme_step2ter_backup_2026-06-07\manutenzioni_2026-06-07T20-21-54-397Z.json` | 67596 bytes |
| `@cambi_gomme_autisti_tmp` | `C:\tmp\gomme_step2ter_backup_2026-06-07\cambi_gomme_autisti_tmp_2026-06-07T20-21-54-397Z.json` | 13577 bytes |
| `@gomme_eventi` | `C:\tmp\gomme_step2ter_backup_2026-06-07\gomme_eventi_2026-06-07T20-21-54-397Z.json` | 13694 bytes |

Manifest: `C:\tmp\gomme_step2ter_backup_2026-06-07\manifest_2026-06-07T20-21-54-397Z.json`

## Conteggi

| Key | Prima | Dopo | Delta | Atteso |
| --- | ---: | ---: | ---: | ---: |
| `@manutenzioni` | 82 | 83 | +1 | +1 |
| `@cambi_gomme_autisti_tmp` | 14 | 8 | -6 | -6 |
| `@gomme_eventi` | 14 | 11 | -3 | -2 |

## Operazioni

| Operazione | Esito | Dettaglio verifica |
| --- | --- | --- |
| Import TI282780 26/05/2026 in `@manutenzioni` | FATTO | Creata manutenzione `from-gomme-evento-71f003d9-59b4-4ce5-9301-852723bfa937`; riletta presente una sola volta. |
| Cancellazione 5 test TI313387 da `@cambi_gomme_autisti_tmp` | FATTO | Tutti i 5 id target riletti a 0 occorrenze. |
| Cancellazione duplicato TI313387 `4b0dcad6...` da `@gomme_eventi` | FATTO | Id riletto a 0 occorrenze. |
| Cancellazione test futuro TI282780 da `@cambi_gomme_autisti_tmp` | FATTO | Id `ea43d48f-0ef3-40d5-8c63-8245333fc142` riletto a 0 occorrenze. |
| Cancellazione test futuro TI282780 da `@gomme_eventi` | FATTO CON ANOMALIA DATI | Id `ea43d48f-0ef3-40d5-8c63-8245333fc142` presente 2 volte prima; entrambe le occorrenze eliminate per id esatto. |

## Import TI282780

Evento origine lasciato intatto:

| Campo | Valore |
| --- | --- |
| Key origine | `@gomme_eventi` e `@cambi_gomme_autisti_tmp` |
| Id origine | `71f003d9-59b4-4ce5-9301-852723bfa937` |
| Target | `TI282780` |
| Data evento | 2026-05-26 |
| Tipo evento | `riparazione` |
| Asse | `asse3` / `3o asse` |
| Contenuto | `SOSTITUZIONE VALVOLA LATO SX 3 ASSE` |
| Km evento | `1234` |
| Autista | `SANDRO CALABRESE`, badge `530` |

Manutenzione creata in `@manutenzioni`:

```json
{
  "id": "from-gomme-evento-71f003d9-59b4-4ce5-9301-852723bfa937",
  "targa": "TI282780",
  "tipo": "mezzo",
  "stato": "eseguita",
  "data": "2026-05-26",
  "dataEsecuzione": "2026-05-26",
  "descrizione": "CAMBIO GOMME - straordinario\nSOSTITUZIONE VALVOLA LATO SX 3 ASSE\nKm evento autista: 1234 (non importato nel campo km)",
  "gommeInterventoTipo": "straordinario",
  "gommeStraordinario": {
    "asseId": "asse3",
    "motivo": "sostituzione valvola lato sx"
  },
  "segnalatoDa": "SANDRO CALABRESE",
  "origineTipo": "gomme_evento",
  "origineRefKey": "@gomme_eventi",
  "origineRefId": "71f003d9-59b4-4ce5-9301-852723bfa937"
}
```

Verifica: il campo `km` non e' stato scritto nella manutenzione; il valore `1234` compare solo nel testo descrittivo.

## Record rimossi da `@cambi_gomme_autisti_tmp`

| Id | Targa | Data logica | Motivo |
| --- | --- | --- | --- |
| `dc6ae1a5-c824-411a-9d52-b8479adbcccc` | TI313387 | 2025-12-27 | Test/bozza cluster TI313387 |
| `bec9e2c4-c911-4f43-bef2-c91968b5460e` | TI313387 | 2025-12-27 | Test/bozza cluster TI313387 |
| `a9d13560-d80a-47ac-a2b4-d86b0a47496a` | TI313387 | 2025-12-28 | Test/bozza cluster TI313387 |
| `a42d3045-b2e8-46d0-8efc-1eb02b0a070c` | TI313387 | 2025-12-28 | Test/bozza cluster TI313387 |
| `4b0dcad6-5981-487a-b5a1-7979bf392092` | TI313387 | 2025-12-28 | Test/bozza cluster TI313387 |
| `ea43d48f-0ef3-40d5-8c63-8245333fc142` | TI282780 | 2026-06-26 | Test futuro, marca `Prova`, km `1234` |

## Record rimossi da `@gomme_eventi`

| Id | Targa | Data logica | Occorrenze rimosse | Motivo |
| --- | --- | --- | ---: | --- |
| `4b0dcad6-5981-487a-b5a1-7979bf392092` | TI313387 | 2025-12-28 | 1 | Test/bozza cluster TI313387 |
| `ea43d48f-0ef3-40d5-8c63-8245333fc142` | TI282780 | 2026-06-26 | 2 | Test futuro, marca `Prova`, km `1234`; duplicato fisico con stesso id |

## Verifica finale

Risultati rilettura:

| Check | Esito |
| --- | --- |
| Nuova manutenzione TI282780 presente | OK |
| Evento origine TI282780 `71f003d9...` ancora presente in `@cambi_gomme_autisti_tmp` | OK |
| Evento origine TI282780 `71f003d9...` ancora presente in `@gomme_eventi` | OK |
| Id TI313387 rimossi da `@cambi_gomme_autisti_tmp` | OK, tutte 0 occorrenze |
| Id TI313387 `4b0dcad6...` rimosso da `@gomme_eventi` | OK, 0 occorrenze |
| Id test TI282780 `ea43d48f...` rimosso da `@cambi_gomme_autisti_tmp` | OK, 0 occorrenze |
| Id test TI282780 `ea43d48f...` rimosso da `@gomme_eventi` | OK, 0 occorrenze |

## File dati non toccati

Non sono stati toccati: TI84069, TI279216, controllo TI279216 del 25/03/2026, TI298409, `@lavori`, codice runtime.
