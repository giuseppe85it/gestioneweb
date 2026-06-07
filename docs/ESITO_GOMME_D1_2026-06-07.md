# ESITO GOMME D1 2026-06-07

MODE = OPERAIO - D1 GOMME, STEP 2.

## Esito sintetico

RIPARAZIONE COMPLETATA.

- Record riparati in `storage/@manutenzioni`: 9/9.
- Falliti parte A: 0.
- Firestore scritto solo su `storage/@manutenzioni`.
- Codice runtime modificato: no.
- Parte B: sola lettura.

## Backup

Backup creato prima di ogni scrittura:

- Path: `C:\tmp\gomme_riparazione_backup_2026-06-07\storage_@manutenzioni_2026-06-07T19-05-48-556Z.json`
- Dimensione: 65.993 byte
- Fonte: `storage/@manutenzioni`
- Verifica: file esistente e non vuoto.

## Anomalia fuori perimetro

Il backup iniziale conteneva 84 record `@manutenzioni`. Dopo la riparazione e la rilettura corrente `@manutenzioni` contiene 82 record.

Confronto backup vs stato corrente:

| ID mancante nello stato corrente | Targa | Data | Descrizione | Stato |
| --- | --- | --- | --- | --- |
| `from-lavoro-7c6af494-9b02-4bf2-ac67-c994b39436c0` | TI313387 | 2026-04-22T16:59:06.683Z | Segnalazione: freni - Freni da controllare | eseguita |
| `from-lavoro-f609de79-f9d6-4696-99ef-4dcff25dff49` | TI313387 | 2026-04-22T16:58:28.891Z | Segnalazione: idraulico - Perdita olio freni posteriore lato guida | eseguita |

Nota operativa:
- i due record non sono gomme e non erano nella whitelist di scrittura;
- non sono stati ripristinati perche' il prompt autorizzava solo scritture additive sui record gomme elencati;
- l'anomalia resta DA VERIFICARE con Giuseppe o con la sessione UI attiva.

## Parte A - Riparazione record approvati

Campi marker usati:
- `gommeInterventoTipo`
- `assiCoinvolti`
- `gommePerAsse`
- `gommeStraordinario`

Descrizione e altri campi non sono stati modificati dai patch preparati.

| Record | Targa | Data | Esito | Prima | Dopo verificato |
| --- | --- | --- | --- | --- | --- |
| `1774962027367` | TI239045 | 2026-03-31 | VERIFICATO | marker assenti | `gommeInterventoTipo="ordinario"`; `assiCoinvolti=["posteriore"]`; `gommePerAsse=[{asseId:"posteriore", dataCambio:"2026-03-31", kmCambio:543423}]` |
| `1774962042583` | TI81027 | 2026-03-24 | VERIFICATO | marker assenti | `gommeInterventoTipo="ordinario"`; `assiCoinvolti=["asse1"]`; `gommePerAsse=[{asseId:"asse1", dataCambio:"2026-03-24", kmCambio:262836}]` |
| `1774363044856` | TI84069 | 2026-03-24 | VERIFICATO | marker assenti | `gommeInterventoTipo="ordinario"`; `assiCoinvolti=["asse3"]`; `gommePerAsse=[{asseId:"asse3", dataCambio:"2026-03-24", kmCambio:542114}]` |
| `1773066080204` | TI285195 | 2026-03-09 | VERIFICATO | marker assenti | `gommeInterventoTipo="ordinario"`; `assiCoinvolti=["asse3"]`; `gommePerAsse=[{asseId:"asse3", dataCambio:"2026-03-09", kmCambio:294278}]` |
| `1772635641628` | TI178456 | 2026-03-04 | VERIFICATO | marker assenti | `gommeInterventoTipo="straordinario"`; `gommeStraordinario={asseId:"asse1", quantita:1, motivo:"foratura"}` |
| `1772531987235` | TI239279 | 2026-02-27 | VERIFICATO | marker assenti | `gommeInterventoTipo="ordinario"`; `assiCoinvolti=["posteriore"]`; `gommePerAsse=[{asseId:"posteriore", dataCambio:"2026-02-27", kmCambio:266121}]` |
| `1768996701410` | TI84069 | 2026-01-21 | VERIFICATO | marker assenti | `gommeInterventoTipo="ordinario"`; `assiCoinvolti=["asse1"]`; `gommePerAsse=[{asseId:"asse1", dataCambio:"2026-01-21", kmCambio:535458}]` |
| `1768493626667` | TI84822 | 2026-01-15 | VERIFICATO | marker assenti | `gommeInterventoTipo="ordinario"`; `assiCoinvolti=["asse1","asse2","asse3"]`; `gommePerAsse=[{asse1, 2026-01-15, 290665}, {asse2, 2026-01-15, 290665}, {asse3, 2026-01-15, 290665}]` |
| `1777979571388` | TI285195 | 2026-05-05 | VERIFICATO | marker assenti | `gommeInterventoTipo="ordinario"`; `assiCoinvolti=["asse1"]`; `gommePerAsse=[{asseId:"asse1", dataCambio:"2026-05-05", kmCambio:300369}]` |

Record escluso e non toccato:
- `1780304893610` TI85688, 2026-06-01, falso positivo: tubo gomma cisterna, non pneumatici.

## Parte B - Censimento esteso sola lettura

### Key candidate dal codice

| Key | Evidenza codice |
| --- | --- |
| `@cambi_gomme_autisti_tmp` | `src/components/AutistiEventoModal.tsx:40`, `src/components/AutistiEventoModal.tsx:271-277`, `src/autistiInbox/AutistiAdmin.tsx:38`, `src/next/autistiInbox/NextAutistiAdminNative.tsx:68`, `src/autistiInbox/AutistiGommeAll.tsx:73`, `src/next/autistiInbox/NextAutistiGommeAllNative.tsx:69` |
| `@gomme_eventi` | `src/components/AutistiEventoModal.tsx:41`, `src/components/AutistiEventoModal.tsx:282-285`, `src/autistiInbox/AutistiAdmin.tsx:39`, `src/next/autistiInbox/NextAutistiAdminNative.tsx:69`, `src/next/autistiInbox/NextAutistiAdminNative.tsx:1889-1894` |
| `@manutenzioni` | `src/components/AutistiEventoModal.tsx:42`, `src/components/AutistiEventoModal.tsx:372-374`, `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:18`, `src/next/writers/nextChiusuraEventoWriter.ts:19` |
| `@lavori` | `src/components/AutistiEventoModal.tsx:546-547`, `src/pages/Mezzo360.tsx:17`, `src/pages/DossierMezzo.tsx:344`, `src/autistiInbox/AutistiAdmin.tsx:731-734` |
| `@segnalazioni_autisti_tmp` | `src/components/AutistiEventoModal.tsx:541`, `src/components/AutistiEventoModal.tsx:557-564`, `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:19`, `src/next/writers/nextChiusuraEventoWriter.ts:20`, `src/pages/Mezzo360.tsx:19` |
| `@controlli_mezzo_autisti` | `src/components/AutistiEventoModal.tsx:511-532`, `src/components/AutistiEventoModal.tsx:568-580`, `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:20`, `src/next/writers/nextChiusuraEventoWriter.ts:21`, `src/pages/Mezzo360.tsx:20` |
| `@storico_eventi_operativi` | `src/pages/Mezzo360.tsx:15`, `src/autistiInbox/AutistiAdmin.tsx:37`, `src/next/autistiInbox/NextAutistiAdminNative.tsx:67` |

### Key lette e conteggi

| Key | Record totali | Record gomme trovati | Senza corrispettivo in `@manutenzioni` |
| --- | ---: | ---: | ---: |
| `@cambi_gomme_autisti_tmp` | 14 | 14 | 7 |
| `@gomme_eventi` | 14 | 14 | 4 |
| `@lavori` | 18 | 2 | 1 |
| `@segnalazioni_autisti_tmp` | 46 | 5 | 1 |
| `@controlli_mezzo_autisti` | 400 | 3 | 2 |
| `@storico_eventi_operativi` | 416 | 0 | 0 |

Nota:
- i conteggi per key includono duplicati tra tmp e ufficiale;
- la tabella sotto deduplica per ID/contenuto quando lo stesso evento vive in piu' key.

### Record senza corrispettivo in `@manutenzioni`

| Targa | Data | Cosa dice | Dove vive | Verdetto |
| --- | --- | --- | --- | --- |
| TI282780 | 2026-05-26 | `riparazione | 3 asse | asse3`, km 1234 | `@cambi_gomme_autisti_tmp`, `@gomme_eventi` (`71f003d9-59b4-4ce5-9301-852723bfa937`) | INTERVENTO GOMME NON VISIBILE nello storico manutenzioni |
| TI282780 | 2026-06-26 | `riparazione | Prova | 1 asse | asse1`, km 1234 | `@cambi_gomme_autisti_tmp`, `@gomme_eventi` (`ea43d48f-0ef3-40d5-8c63-8245333fc142`) | INTERVENTO GOMME NON VISIBILE nello storico manutenzioni; testo contiene `Prova`, da decidere |
| TI313387 | 2025-12-28 | `sostituzione | kumo prova | 1 asse | asse1`, km 3589999 | `@cambi_gomme_autisti_tmp`, `@gomme_eventi` (`4b0dcad6-5981-487a-b5a1-7979bf392092`) | INTERVENTO GOMME NON VISIBILE; valori km/testo da verificare |
| TI313387 | 2025-12-28 | `sostituzione | 1 asse | asse1`, km 333333 | `@cambi_gomme_autisti_tmp` (`a42d3045-b2e8-46d0-8efc-1eb02b0a070c`) | INTERVENTO GOMME NON VISIBILE; valori km da verificare |
| TI313387 | 2025-12-28 | `sostituzione | 1 asse | asse1`, km 32588 | `@cambi_gomme_autisti_tmp` (`a9d13560-d80a-47ac-a2b4-d86b0a47496a`) | INTERVENTO GOMME NON VISIBILE |
| TI313387 | 2025-12-27 | `sostituzione | Anteriore | anteriore`, km 150000 | `@cambi_gomme_autisti_tmp` (`bec9e2c4-c911-4f43-bef2-c91968b5460e`) | INTERVENTO GOMME NON VISIBILE |
| TI313387 | 2025-12-27 | `sostituzione | 1 asse | asse1`, km 5000 | `@cambi_gomme_autisti_tmp` (`dc6ae1a5-c824-411a-9d52-b8479adbcccc`) | INTERVENTO GOMME NON VISIBILE; valori km da verificare |
| TI298409 | DA VERIFICARE | `Segnalazione: gomme - 4 gomme di trazione usurate, quasi finite. Da sostituire` | `@lavori` (`a5ba1512-2961-40a9-9c00-a27b6559bef2`) | Lavoro/segnalazione gomme senza manutenzione corrispondente trovata; non e' evento gomme ufficiale |
| TI84069 | 2026-02-05 | `Tagliata | gomme` | `@segnalazioni_autisti_tmp` (`7e9925c6-b92c-4daa-9209-b8bd496564a1`) | Segnalazione gomme nuova, non intervento eseguito |
| TI279216 | 2026-03-09 | `Sostituzione gomme 3 Asse km294278 | entrambi` | `@controlli_mezzo_autisti` (`7e29af95-efad-4922-8882-9adcb790a86a`) | Controllo con testo gomme, nessuna manutenzione corrispondente trovata |
| TI279216 | 2026-03-25 | `In data 24/03/ ho comunicato l'usura peneumatici 1 asse | rimorchio | KO gomme` | `@controlli_mezzo_autisti` (`48660226-d99a-44db-9b41-c340716338df`) | Controllo KO gomme, nessuna manutenzione corrispondente trovata |

### Record gomme fuori `@manutenzioni` con corrispettivo trovato

Esempi di corrispettivo confermato via targa+data o link forte:
- `@cambi_gomme_autisti_tmp` / `@gomme_eventi` TI298409 2026-05-12 -> `@manutenzioni` `1778587360877`
- `@cambi_gomme_autisti_tmp` / `@gomme_eventi` TI285195 2026-05-05 -> `@manutenzioni` `1777979571388`
- `@cambi_gomme_autisti_tmp` / `@gomme_eventi` TI239045 2026-03-31 -> `@manutenzioni` `1774962027367`
- `@cambi_gomme_autisti_tmp` / `@gomme_eventi` TI81027 2026-03-24 -> `@manutenzioni` `1774962042583`
- `@cambi_gomme_autisti_tmp` / `@gomme_eventi` TI324623 2026-03-24 -> `@manutenzioni` `1776958902385`
- `@cambi_gomme_autisti_tmp` / `@gomme_eventi` TI84069 2026-03-24 -> `@manutenzioni` `1774363044856`
- `@cambi_gomme_autisti_tmp` / `@gomme_eventi` TI239279 2026-02-27 -> `@manutenzioni` `1772531987235`
- `@lavori` `daade4a2-c681-46d0-99d4-1906d151116d` -> `@manutenzioni` `from-lavoro-daade4a2-c681-46d0-99d4-1906d151116d`

## Conclusione operativa

- La riparazione marker approvata e' stata applicata e verificata su tutti i 9 record.
- TI85688 e' rimasto escluso.
- Il censimento esteso ha trovato 7 eventi gomme unici in `@cambi_gomme_autisti_tmp` / `@gomme_eventi` senza corrispettivo in `@manutenzioni`.
- Ha trovato inoltre 4 record operativi gomme/KO gomme non importati come manutenzione: 1 lavoro, 1 segnalazione, 2 controlli.
- Nessuna scrittura e' stata fatta sulle key della parte B.
