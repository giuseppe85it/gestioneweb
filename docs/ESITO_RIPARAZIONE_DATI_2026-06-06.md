# ESITO RIPARAZIONE DATI - FASE 2 STEP 2

Data esecuzione finale: 2026-06-06T16:26:03.729Z
Modalita: scritture Firestore autorizzate dal prompt, limitate ai record/campi elencati. Nessuna modifica a codice runtime.

## Backup confermato

| File | Dimensione byte |
|---|---:|
| `C:\tmp\riparazione_dati_backup_2026-06-06\segnalazioni_autisti_tmp_2026-06-06T16-19-32-324Z.json` | 43206 |
| `C:\tmp\riparazione_dati_backup_2026-06-06\controlli_mezzo_autisti_2026-06-06T16-19-32-324Z.json` | 174931 |
| `C:\tmp\riparazione_dati_backup_2026-06-06\manutenzioni_2026-06-06T16-19-32-324Z.json` | 59522 |

## Riepilogo

Esito complessivo: RIPARAZIONE COMPLETATA

| Categoria | Riparati | Falliti |
|---|---:|---:|
| A - sgancio segnalazione fantasma | 16 | 0 |
| A - sgancio controllo fantasma | 5 | 0 |
| B - ricucitura climatizzatore TI324623 | 1 | 0 |
| B - ricucitura freni TI313387 | 1 | 0 |
| C - chiusura manuale luci TI287110 | 1 | 0 |
| D - controllo TI239279 rimozione solo link fantasma | 1 | 0 |
| E - gruppo+collegata azzera gruppoSegnalazioneId | 2 | 0 |

## Log per record

### A - sgancio segnalazione fantasma

- ID: `82ff0b71-623b-4d72-8587-6b8d0be6b77f`
- Targa: TI178456
- Autista: GIUSEPPE MILIO
- Data: 2026-01-06
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: "99f8c820-63c4-449c-a10b-7b2260c2ffc6" -> null
  - linkedLavoroIds: ASSENTE -> null
  - linkedMultiple: ASSENTE -> false
  - dataPresaInCarico: ASSENTE -> null
  - letta: true -> false
  - stato: "presa_in_carico" -> "nuova"

### A - sgancio segnalazione fantasma

- ID: `e8750e0e-e421-4d07-aa6d-03722fc13012`
- Targa: TI233827
- Autista: ELTON SELIMI
- Data: 2026-01-13
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: "b994ae30-9ea9-49f3-aa31-fc7438188808" -> null
  - linkedLavoroIds: ASSENTE -> null
  - linkedMultiple: ASSENTE -> false
  - dataPresaInCarico: ASSENTE -> null
  - letta: true -> false
  - stato: "presa_in_carico" -> "nuova"

### A - sgancio segnalazione fantasma

- ID: `f9e2e351-35a4-415d-b791-f638008518d3`
- Targa: TI315407
- Autista: GIUSEPPE MILIO
- Data: 2026-01-14
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: "4d455c2a-3d18-4106-b8fe-8af344585aff" -> null
  - linkedLavoroIds: ASSENTE -> null
  - linkedMultiple: ASSENTE -> false
  - dataPresaInCarico: ASSENTE -> null
  - letta: true -> false
  - stato: "presa_in_carico" -> "nuova"

### A - sgancio segnalazione fantasma

- ID: `4017ba91-a08a-440c-a2d3-6015d8d5c797`
- Targa: TI313387
- Autista: GIUSEPPE MILIO
- Data: 2026-01-15
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: "c624c75d-e672-46db-af37-9f7cc88456eb" -> null
  - linkedLavoroIds: ASSENTE -> null
  - linkedMultiple: ASSENTE -> false
  - dataPresaInCarico: ASSENTE -> null
  - letta: true -> false
  - stato: "presa_in_carico" -> "nuova"

### A - sgancio segnalazione fantasma

- ID: `fa8ee153-fda7-40f8-9347-bdc48961e56c`
- Targa: TI298409
- Autista: RICCARDO FENDERICO
- Data: 2026-01-22
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: "4ffc49f9-e322-4ccd-bb07-046aafa7f7a3" -> null
  - linkedLavoroIds: ASSENTE -> null
  - linkedMultiple: ASSENTE -> false
  - dataPresaInCarico: ASSENTE -> null
  - letta: true -> false
  - stato: "presa_in_carico" -> "nuova"

### A - sgancio segnalazione fantasma

- ID: `eee4adb6-5623-4bed-858d-e3347cac4dde`
- Targa: TI84822
- Autista: RICCARDO FENDERICO
- Data: 2026-01-29
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: "23c31228-9f39-447e-88d3-0539f7399ad9" -> null
  - linkedLavoroIds: ASSENTE -> null
  - linkedMultiple: ASSENTE -> false
  - dataPresaInCarico: ASSENTE -> null
  - letta: true -> false
  - stato: "presa_in_carico" -> "nuova"

### A - sgancio segnalazione fantasma

- ID: `b883f689-4c92-4a8e-8bf1-011e4bd99c79`
- Targa: TI298409
- Autista: RICCARDO FENDERICO
- Data: 2026-01-30
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: "be49d61f-65a2-4c15-8349-90e8fbde5612" -> null
  - linkedLavoroIds: ASSENTE -> null
  - linkedMultiple: ASSENTE -> false
  - dataPresaInCarico: ASSENTE -> null
  - letta: true -> false
  - stato: "presa_in_carico" -> "nuova"

### A - sgancio segnalazione fantasma

- ID: `45feb9b9-3874-4219-814a-262f21799185`
- Targa: TI285053
- Autista: RICCARDO FENDERICO
- Data: 2026-02-03
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: "deb7da3e-2412-40d3-89ab-437e91acd98f" -> null
  - linkedLavoroIds: ASSENTE -> null
  - linkedMultiple: ASSENTE -> false
  - dataPresaInCarico: ASSENTE -> null
  - letta: true -> false
  - stato: "presa_in_carico" -> "nuova"

### A - sgancio segnalazione fantasma

- ID: `7e9925c6-b92c-4daa-9209-b8bd496564a1`
- Targa: TI84069
- Autista: SANDRO CALABRESE
- Data: 2026-02-05
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: "1d8dfe6f-7d93-4333-963e-d14fb52cfc4a" -> null
  - linkedLavoroIds: ASSENTE -> null
  - linkedMultiple: ASSENTE -> false
  - dataPresaInCarico: ASSENTE -> null
  - letta: true -> false
  - stato: "presa_in_carico" -> "nuova"

### A - sgancio segnalazione fantasma

- ID: `c11828ee-9835-494a-8c08-91a18009ed78`
- Targa: TI239279
- Autista: FILIPPO MARTINELLI
- Data: 2026-02-10
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: "7eaa65ad-f74d-44d4-a5f1-df277b11c830" -> null
  - linkedLavoroIds: ASSENTE -> null
  - linkedMultiple: ASSENTE -> false
  - dataPresaInCarico: ASSENTE -> null
  - letta: true -> false
  - stato: "presa_in_carico" -> "nuova"

### A - sgancio segnalazione fantasma

- ID: `2a629be1-3395-4449-8a3f-2b67ffbce6b0`
- Targa: TI298409
- Autista: RICCARDO FENDERICO
- Data: 2026-02-17
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: "74699f0a-83fe-4d6e-a43d-676de939a20f" -> null
  - linkedLavoroIds: ASSENTE -> null
  - linkedMultiple: ASSENTE -> false
  - dataPresaInCarico: ASSENTE -> null
  - letta: true -> false
  - stato: "presa_in_carico" -> "nuova"

### A - sgancio segnalazione fantasma

- ID: `6a64e3bd-4f9b-44e1-859a-90aa4d1f2c0f`
- Targa: TI285217
- Autista: FILIPPO MARTINELLI
- Data: 2026-02-19
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: "b090c8a5-8eb4-48da-8619-b4f86fcbcde0" -> null
  - linkedLavoroIds: ASSENTE -> null
  - linkedMultiple: ASSENTE -> false
  - dataPresaInCarico: ASSENTE -> null
  - letta: true -> false
  - stato: "presa_in_carico" -> "nuova"

### A - sgancio segnalazione fantasma

- ID: `ed063f99-e343-4642-8487-037e97b9a003`
- Targa: TI287110
- Autista: RICCARDO FENDERICO
- Data: 2026-02-24
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: "dedc1377-1d4d-42b3-aff4-22f469a7a573" -> null
  - linkedLavoroIds: ASSENTE -> null
  - linkedMultiple: ASSENTE -> false
  - dataPresaInCarico: ASSENTE -> null
  - letta: true -> false
  - stato: "presa_in_carico" -> "nuova"

### A - sgancio segnalazione fantasma

- ID: `8bcb855c-920f-459b-9a84-b5b127cf11e5`
- Targa: TI113417
- Autista: SANDRO CALABRESE
- Data: 2026-02-27
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: "eab98d6b-768d-4a5d-9e5a-03e5278c2177" -> null
  - linkedLavoroIds: ASSENTE -> null
  - linkedMultiple: ASSENTE -> false
  - dataPresaInCarico: ASSENTE -> null
  - letta: true -> false
  - stato: "presa_in_carico" -> "nuova"

### A - sgancio segnalazione fantasma

- ID: `c2568521-a959-4791-aea8-485fb2c9e944`
- Targa: TI280132
- Autista: RICCARDO FENDERICO
- Data: 2026-04-01
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: "8d2b5c5a-04bd-429a-87b7-739a41f11536" -> null
  - linkedLavoroIds: ASSENTE -> null
  - linkedMultiple: ASSENTE -> false
  - dataPresaInCarico: ASSENTE -> null
  - letta: true -> false
  - stato: "presa_in_carico" -> "nuova"

### A - sgancio segnalazione fantasma

- ID: `1dab2f26-db6b-4bc5-9856-4ee1fa4b21aa`
- Targa: TI280132
- Autista: DANIELE LIVI
- Data: 2026-05-13
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: "3b167c1a-2bdd-4f00-ad8e-336a41765e62" -> null
  - linkedLavoroIds: ASSENTE -> null
  - linkedMultiple: ASSENTE -> false
  - dataPresaInCarico: ASSENTE -> null
  - letta: true -> false
  - stato: "presa_in_carico" -> "nuova"

### A - sgancio controllo fantasma

- ID: `80049ab9-c74d-4687-9eca-67b061bd3eec`
- Targa: TI313387
- Autista: GIUSEPPE MILIO
- Data: 2025-12-26
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: ASSENTE -> null
  - linkedLavoroIds: ["9a12c1c7-6ecd-45f4-8f0d-ab2cd50adf19","93beea7d-1245-4369-b955-ce9d211fa5e3"] -> null
  - linkedMultiple: true -> false
  - dataPresaInCarico: ASSENTE -> null
  - letta: true -> false

### A - sgancio controllo fantasma

- ID: `25166fae-6344-4e4e-b40c-4ffb5dd4822c`
- Targa: TI178456
- Autista: ELTON SELIMI
- Data: 2026-01-20
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: "7420fd2e-cdad-4d71-b7f6-08550d13b39f" -> null
  - linkedLavoroIds: ASSENTE -> null
  - linkedMultiple: ASSENTE -> false
  - dataPresaInCarico: ASSENTE -> null
  - letta: true -> false

### A - sgancio controllo fantasma

- ID: `36af4b0d-b646-4da8-96aa-9324946eb228`
- Targa: TI298409
- Autista: RICCARDO FENDERICO
- Data: 2026-01-26
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: ASSENTE -> null
  - linkedLavoroIds: ["c3ef6c33-482b-4a64-96b6-62a76c101808","aa3e15a8-3b4c-4b3b-8ee6-971d7e7fed77"] -> null
  - linkedMultiple: true -> false
  - dataPresaInCarico: ASSENTE -> null
  - letta: true -> false

### A - sgancio controllo fantasma

- ID: `d0934d91-b117-42ed-95c5-0a4bb704f048`
- Targa: TI313387
- Autista: ELTON SELIMI
- Data: 2026-02-04
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: "4c0a2df1-e445-4eeb-ba65-bbd6652f5432" -> null
  - linkedLavoroIds: ASSENTE -> null
  - linkedMultiple: ASSENTE -> false
  - dataPresaInCarico: ASSENTE -> null
  - letta: true -> false

### A - sgancio controllo fantasma

- ID: `48660226-d99a-44db-9b41-c340716338df`
- Targa: TI279216
- Autista: PIERO LAURO
- Data: 2026-03-25
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: "26c60405-ffc4-4481-abe5-5746d483922f" -> null
  - linkedLavoroIds: ASSENTE -> null
  - linkedMultiple: ASSENTE -> false
  - dataPresaInCarico: ASSENTE -> null
  - letta: true -> false

### B - ricucitura climatizzatore TI324623

- ID: `5411913c-2956-47f6-9cce-b1d9df17c6e8`
- Targa: TI324623
- Autista: IVAN ATTARDI
- Data: 2026-04-20
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: "1776868559013" -> "from-lavoro-f2ab2ab1-7e0c-491d-b8c6-a98ff65d90d8"
  - linkedLavoroIds: null -> null
  - linkedMultiple: false -> false
  - stato: "chiusa" -> "chiusa"
  - chiusuraDi: "manutenzione" -> "manutenzione"
  - chiusuraRefId: "1776868559013" -> "from-lavoro-f2ab2ab1-7e0c-491d-b8c6-a98ff65d90d8"
  - chiusuraData: 1776808800000 -> "2026-04-22"
  - _manutenzioneTarget: "from-lavoro-f2ab2ab1-7e0c-491d-b8c6-a98ff65d90d8" -> "from-lavoro-f2ab2ab1-7e0c-491d-b8c6-a98ff65d90d8"
  - _origineRefs: [] -> [{"tipo":"segnalazione","refKey":"@segnalazioni_autisti_tmp","refId":"5411913c-2956-47f6-9cce-b1d9df17c6e8"}]

### B - ricucitura freni TI313387

- ID: `5cdfe350-804f-45c8-879b-433574b0700d`
- Targa: TI313387
- Autista: ORLANDO BUTTI
- Data: 2026-03-30
- Esito: OK
- Nota: manutenzione target gia conteneva la segnalazione come origineRefId; origineRefs non duplicato
- Campi toccati prima -> dopo:
  - linkedLavoroId: "from-lavoro-7c6af494-9b02-4bf2-ac67-c994b39436c0" -> "from-lavoro-7c6af494-9b02-4bf2-ac67-c994b39436c0"
  - linkedLavoroIds: ASSENTE -> null
  - linkedMultiple: ASSENTE -> false
  - stato: "presa_in_carico" -> "chiusa"
  - chiusa: true -> true
  - chiusa_by: "centro_controllo_next" -> "centro_controllo_next"
  - dataChiusura: 1778446877382 -> "2026-04-22T16:59:06.683Z"
  - chiusuraDi: ASSENTE -> "manutenzione"
  - chiusuraRefId: ASSENTE -> "from-lavoro-7c6af494-9b02-4bf2-ac67-c994b39436c0"
  - chiusuraData: ASSENTE -> "2026-04-22T16:59:06.683Z"
  - _manutenzioneTarget: "from-lavoro-7c6af494-9b02-4bf2-ac67-c994b39436c0" -> "from-lavoro-7c6af494-9b02-4bf2-ac67-c994b39436c0"
  - _origineRefId: "5cdfe350-804f-45c8-879b-433574b0700d" -> "5cdfe350-804f-45c8-879b-433574b0700d"
  - _origineRefs: ASSENTE -> ASSENTE

### C - chiusura manuale luci TI287110

- ID: `f83dbbe1-f955-404c-978f-e295e2080f55`
- Targa: TI287110
- Autista: RICCARDO FENDERICO
- Data: 2026-02-25
- Esito: OK
- Nota: nessun esempio di chiusura manuale pura trovato; usata shape minima senza manutenzione
- Campi toccati prima -> dopo:
  - linkedLavoroId: ASSENTE -> null
  - linkedLavoroIds: ASSENTE -> null
  - linkedMultiple: ASSENTE -> false
  - stato: "nuova" -> "chiusa"
  - chiusa: true -> true
  - chiusa_by: "centro_controllo_next" -> "centro_controllo_next"
  - dataChiusura: 1778481001738 -> 1778481001738
  - chiusuraDi: ASSENTE -> null
  - chiusuraRefId: ASSENTE -> null
  - chiusuraData: ASSENTE -> 1778481001738

### D - controllo TI239279 rimozione solo link fantasma

- ID: `44ebe449-2750-45e6-add6-4d5c8ef9a8d3`
- Targa: TI239279
- Autista: ANDREA SCALAMATO
- Data: 2026-04-02
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: ASSENTE -> "from-lavoro-82df827a-b18b-43fa-b4ee-abf8e3b36389"
  - linkedLavoroIds: ["from-lavoro-82df827a-b18b-43fa-b4ee-abf8e3b36389","f8288347-2b06-4976-9e86-8ea152da1bd2"] -> null
  - linkedMultiple: true -> false

### E - gruppo+collegata azzera gruppoSegnalazioneId

- ID: `7fa81331-a6ec-47e2-9d1a-1c30189fe76a`
- Targa: TI233827
- Autista: ELTON SELIMI
- Data: 2026-05-20
- Esito: OK
- Campi toccati prima -> dopo:
  - gruppoSegnalazioneId: "79a72198-cd97-4ae0-8690-b99e1d411671" -> null

### E - gruppo+collegata azzera gruppoSegnalazioneId

- ID: `0cd32f30-a2a1-454c-86a2-1e370b14c234`
- Targa: TI233827
- Autista: ELTON SELIMI
- Data: 2026-05-29
- Esito: OK
- Campi toccati prima -> dopo:
  - gruppoSegnalazioneId: "79a72198-cd97-4ae0-8690-b99e1d411671" -> null

## Note finali

- Gli 11 disallineati innocui non sono stati toccati.
- Gli eseguiti con sorgente aperta da richiudere via UI non sono stati toccati.
- Nessun record fuori perimetro e nessun file di codice e stato modificato da questa esecuzione.
