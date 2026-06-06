# ESITO RICONCILIAZIONE SEGNALAZIONI-MANUTENZIONI

Data esecuzione: 2026-06-06T17:58:44.387Z
Modalita: scritture Firestore autorizzate dal prompt, limitate agli 8 record-operazione indicati. Nessuna modifica a codice runtime.

## Backup confermato

| File | Dimensione byte |
|---|---:|
| `C:\tmp\riconciliazione_esec_backup_2026-06-06\segnalazioni_autisti_tmp_2026-06-06T17-54-42-807Z.json` | 44645 |
| `C:\tmp\riconciliazione_esec_backup_2026-06-06\controlli_mezzo_autisti_2026-06-06T17-54-42-807Z.json` | 175012 |
| `C:\tmp\riconciliazione_esec_backup_2026-06-06\manutenzioni_2026-06-06T17-54-42-807Z.json` | 60041 |

## Riepilogo

Esito complessivo: RICONCILIAZIONE COMPLETATA

| Operazione | Categoria | Esito | ID record | Targa |
|---:|---|---|---|---|
| 1 | TI239279 Tubo 10 metri rotto + guarnizioni | OK | `261619fc-be8a-4448-b0e9-bcf83b413772` | TI239279 |
| 2 | TI313387 Perdita olio freni posteriore | OK | `c7bc5a05-5356-4e9c-afc0-fdca84239ea0` | TI313387 |
| 3 | TI178456 Alternatore | OK | `0915617c-4ffd-4aa7-91ac-bf0b46ddd57a` | TI178456 |
| 4 | TI285217 Manometro pressione cisterna | OK | `c1fac5b8-e45c-493a-9706-0ec029096566` | TI285217 |
| 5 | TI233827 Ammortizzatori ultimo asse | OK | `e8750e0e-e421-4d07-aa6d-03722fc13012` | TI233827 |
| 6 | TI280132 Gomme primo asse | OK | `1dab2f26-db6b-4bc5-9856-4ee1fa4b21aa` | TI280132 |
| 7 | TI287110 luci ingombro laterali sx | OK | `ed063f99-e343-4642-8487-037e97b9a003` | TI287110 |
| 8 | TI 334558 note Sgfvhghh | OK | `5f1c973e-63cd-4b8a-a51b-b99dd5980077` | TI 334558 |

## Totali per categoria

| Categoria | Riparati | Falliti |
|---|---:|---:|
| A - chiusura con ricucitura | 6 | 0 |
| B - chiusura duplicato manuale | 1 | 0 |
| C - eliminazione controllo spazzatura | 1 | 0 |

## Log per record

### Operazione 1 - TI239279 Tubo 10 metri rotto + guarnizioni

- Categoria: A - chiusura con ricucitura
- ID: `261619fc-be8a-4448-b0e9-bcf83b413772`
- Targa: TI239279
- Esito: OK
- Nota: origine gia presente su manutenzione; origineRefs non modificato
- Campi toccati prima -> dopo:
  - linkedLavoroId: "from-lavoro-5dd4afde-4531-4560-9496-512e35c60167" -> "from-lavoro-5dd4afde-4531-4560-9496-512e35c60167"
  - linkedLavoroIds: ASSENTE -> null
  - linkedMultiple: ASSENTE -> false
  - stato: "presa_in_carico" -> "chiusa"
  - chiusa: ASSENTE -> true
  - chiusa_by: ASSENTE -> "centro_controllo_next"
  - dataChiusura: ASSENTE -> "2026-04-01T18:08:31.199Z"
  - chiusuraDi: ASSENTE -> "manutenzione"
  - chiusuraRefId: ASSENTE -> "from-lavoro-5dd4afde-4531-4560-9496-512e35c60167"
  - chiusuraData: ASSENTE -> "2026-04-01T18:08:31.199Z"
  - _manutenzioneTarget: ASSENTE -> "from-lavoro-5dd4afde-4531-4560-9496-512e35c60167"

### Operazione 2 - TI313387 Perdita olio freni posteriore

- Categoria: A - chiusura con ricucitura
- ID: `c7bc5a05-5356-4e9c-afc0-fdca84239ea0`
- Targa: TI313387
- Esito: OK
- Nota: origine gia presente su manutenzione; origineRefs non modificato
- Campi toccati prima -> dopo:
  - linkedLavoroId: "from-lavoro-f609de79-f9d6-4696-99ef-4dcff25dff49" -> "from-lavoro-f609de79-f9d6-4696-99ef-4dcff25dff49"
  - linkedLavoroIds: ASSENTE -> null
  - linkedMultiple: ASSENTE -> false
  - stato: "presa_in_carico" -> "chiusa"
  - chiusa: ASSENTE -> true
  - chiusa_by: ASSENTE -> "centro_controllo_next"
  - dataChiusura: ASSENTE -> "2026-04-22T16:58:28.891Z"
  - chiusuraDi: ASSENTE -> "manutenzione"
  - chiusuraRefId: ASSENTE -> "from-lavoro-f609de79-f9d6-4696-99ef-4dcff25dff49"
  - chiusuraData: ASSENTE -> "2026-04-22T16:58:28.891Z"
  - _manutenzioneTarget: ASSENTE -> "from-lavoro-f609de79-f9d6-4696-99ef-4dcff25dff49"

### Operazione 3 - TI178456 Alternatore

- Categoria: A - chiusura con ricucitura
- ID: `0915617c-4ffd-4aa7-91ac-bf0b46ddd57a`
- Targa: TI178456
- Esito: OK
- Nota: origine gia presente su manutenzione; origineRefs non modificato
- Campi toccati prima -> dopo:
  - linkedLavoroId: "1778592051280" -> "1778592051280"
  - linkedLavoroIds: null -> null
  - linkedMultiple: false -> false
  - stato: "presa_in_carico" -> "chiusa"
  - chiusa: ASSENTE -> true
  - chiusa_by: ASSENTE -> "centro_controllo_next"
  - dataChiusura: ASSENTE -> "2026-05-12"
  - chiusuraDi: ASSENTE -> "manutenzione"
  - chiusuraRefId: ASSENTE -> "1778592051280"
  - chiusuraData: ASSENTE -> "2026-05-12"
  - _manutenzioneTarget: ASSENTE -> "1778592051280"

### Operazione 4 - TI285217 Manometro pressione cisterna

- Categoria: A - chiusura con ricucitura
- ID: `c1fac5b8-e45c-493a-9706-0ec029096566`
- Targa: TI285217
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: ASSENTE -> "from-lavoro-4cc1d480-92a5-4113-ae34-fb0eddf1eb96"
  - linkedLavoroIds: ASSENTE -> null
  - linkedMultiple: ASSENTE -> false
  - stato: "nuova" -> "chiusa"
  - chiusa: ASSENTE -> true
  - chiusa_by: ASSENTE -> "centro_controllo_next"
  - dataChiusura: ASSENTE -> "2026-04-10"
  - chiusuraDi: ASSENTE -> "manutenzione"
  - chiusuraRefId: ASSENTE -> "from-lavoro-4cc1d480-92a5-4113-ae34-fb0eddf1eb96"
  - chiusuraData: ASSENTE -> "2026-04-10"
  - _manutenzioneOrigineRefs: ASSENTE -> [{"tipo":"segnalazione","refKey":"@segnalazioni_autisti_tmp","refId":"c1fac5b8-e45c-493a-9706-0ec029096566"}]
  - _manutenzioneTarget: ASSENTE -> "from-lavoro-4cc1d480-92a5-4113-ae34-fb0eddf1eb96"

### Operazione 5 - TI233827 Ammortizzatori ultimo asse

- Categoria: A - chiusura con ricucitura
- ID: `e8750e0e-e421-4d07-aa6d-03722fc13012`
- Targa: TI233827
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: null -> "1777474997286"
  - linkedLavoroIds: null -> null
  - linkedMultiple: false -> false
  - stato: "nuova" -> "chiusa"
  - chiusa: ASSENTE -> true
  - chiusa_by: ASSENTE -> "centro_controllo_next"
  - dataChiusura: ASSENTE -> "2026-02-12"
  - chiusuraDi: ASSENTE -> "manutenzione"
  - chiusuraRefId: ASSENTE -> "1777474997286"
  - chiusuraData: ASSENTE -> "2026-02-12"
  - _manutenzioneOrigineRefs: ASSENTE -> [{"tipo":"segnalazione","refKey":"@segnalazioni_autisti_tmp","refId":"e8750e0e-e421-4d07-aa6d-03722fc13012"}]
  - _manutenzioneTarget: ASSENTE -> "1777474997286"

### Operazione 6 - TI280132 Gomme primo asse

- Categoria: A - chiusura con ricucitura
- ID: `1dab2f26-db6b-4bc5-9856-4ee1fa4b21aa`
- Targa: TI280132
- Esito: OK
- Campi toccati prima -> dopo:
  - linkedLavoroId: null -> "from-lavoro-daade4a2-c681-46d0-99d4-1906d151116d"
  - linkedLavoroIds: null -> null
  - linkedMultiple: false -> false
  - stato: "nuova" -> "chiusa"
  - chiusa: ASSENTE -> true
  - chiusa_by: ASSENTE -> "centro_controllo_next"
  - dataChiusura: ASSENTE -> "2026-05-20"
  - chiusuraDi: ASSENTE -> "manutenzione"
  - chiusuraRefId: ASSENTE -> "from-lavoro-daade4a2-c681-46d0-99d4-1906d151116d"
  - chiusuraData: ASSENTE -> "2026-05-20"
  - _manutenzioneOrigineRefs: [{"tipo":"controllo","refId":"1667f266-5160-4163-a5a3-14796034b1c6","refKey":"@controlli_mezzo_autisti"},{"tipo":"segnalazione","refId":"c2568521-a959-4791-aea8-485fb2c9e944","refKey":"@segnalazioni_autisti_tmp"}] -> [{"tipo":"controllo","refId":"1667f266-5160-4163-a5a3-14796034b1c6","refKey":"@controlli_mezzo_autisti"},{"tipo":"segnalazione","refId":"c2568521-a959-4791-aea8-485fb2c9e944","refKey":"@segnalazioni_autisti_tmp"},{"tipo":"segnalazione","refKey":"@segnalazioni_autisti_tmp","refId":"1dab2f26-db6b-4bc5-9856-4ee1fa4b21aa"}]
  - _manutenzioneTarget: ASSENTE -> "from-lavoro-daade4a2-c681-46d0-99d4-1906d151116d"

### Operazione 7 - TI287110 luci ingombro laterali sx

- Categoria: B - chiusura duplicato manuale
- ID: `ed063f99-e343-4642-8487-037e97b9a003`
- Targa: TI287110
- Esito: OK
- Nota: chiusuraData replicata dalla gemella f83dbbe1-f955-404c-978f-e295e2080f55
- Campi toccati prima -> dopo:
  - linkedLavoroId: null -> null
  - linkedLavoroIds: null -> null
  - linkedMultiple: false -> false
  - stato: "nuova" -> "chiusa"
  - chiusa: ASSENTE -> true
  - chiusa_by: ASSENTE -> "centro_controllo_next"
  - dataChiusura: ASSENTE -> 1778481001738
  - chiusuraDi: ASSENTE -> null
  - chiusuraRefId: ASSENTE -> null
  - chiusuraData: ASSENTE -> 1778481001738

### Operazione 8 - TI 334558 note Sgfvhghh

- Categoria: C - eliminazione controllo spazzatura
- ID: `5f1c973e-63cd-4b8a-a51b-b99dd5980077`
- Targa: TI 334558
- Esito: OK
- Campi toccati prima -> dopo:
  - id: "5f1c973e-63cd-4b8a-a51b-b99dd5980077" -> "RIMOSSO"
  - targaCamion: "TI 334558" -> "RIMOSSO"
  - targaRimorchio: null -> "RIMOSSO"
  - note: "Sgfvhghh\n" -> "RIMOSSO"
  - timestamp: 1766395033002 -> "RIMOSSO"
  - autistaNome: "ELTON SELIMI" -> "RIMOSSO"

## Note finali

- Non sono stati toccati i punti 8-9-10 dello schema, le 3 MEDIE deboli, le 11 davvero aperte, le 34 manutenzioni A4, le divergenze verso `@lavori` legacy o `@lavori` in qualsiasi forma.
- Nessun file di codice e stato modificato da questa esecuzione.
