# REPORT RIPARAZIONE DATI - FASE 2 STEP 1

Data report: 2026-06-06  
Modalita': sola lettura Firestore, nessuna scrittura su dati, nessuna modifica a codice runtime.  
Service account usato: `C:\Users\giumi\.firebase-keys\gestionemanutenzione-934ef-firebase-adminsdk-fbsvc-7a0850bcd3.json`

## 1. Scope e fonte dati

Il censimento e' stato rifatto sul dato fisico Firestore corrente, perche' dopo l'audit del 2026-06-05 e' entrata in produzione la Fase 1.

Collection lette:

- `storage/@manutenzioni`
- `storage/@segnalazioni_autisti_tmp`
- `storage/@controlli_mezzo_autisti`

Lettura eseguita a: `2026-06-06T05:51:05.866Z`

Conteggi fisici:

| Collection | Record |
|---|---:|
| `@manutenzioni` | 84 |
| `@segnalazioni_autisti_tmp` | 46 |
| `@controlli_mezzo_autisti` | 401 |

Distribuzione stati rilevante:

| Dataset | Stati |
|---|---|
| manutenzioni | `eseguita`: 42, `dafare`: 8, senza stato: 34 |
| segnalazioni | `presa_in_carico`: 28, `nuova`: 7, `chiusa`: 11 |
| controlli | `chiusa`: 1, senza stato: 400 |

## 2. Riepilogo operativo

| Categoria | Record censiti | Scritture proponibili dopo approvazione | Indicazione |
|---|---:|---:|---|
| FANTASMI | 23 | 22 non ambigue + 1 ambigua | Sgancio sorgenti con semantica esistente |
| CONTRADDITTORI | 2 | 2 solo dopo decisione | Serve scelta Giuseppe: riaprire o chiudere davvero |
| DISALLINEATI INNOCUI | 11 | 0 | NON INTERVENIRE |
| ESEGUITI CON SORGENTE APERTA | 3 | 2 via UI + 1 da decidere | Le 2 segnalazioni sono richiudibili da UI; il controllo richiede decisione |
| ALTRO | 2 | 0 o 2, da decidere | Coesistenza gruppo + manutenzione collegata |

Scritture non ambigue proponibili dopo approvazione: 24 record-operazione:

- 22 sganci fantasma, incluso il controllo `44ebe449-2750-45e6-add6-4d5c8ef9a8d3` solo per la rimozione del link mancante, preservando il link valido.
- 2 chiusure da UI `Richiudi` per segnalazioni aperte collegate a manutenzioni eseguite.

Categorie che si consiglia di non toccare in questa fase:

- `DISALLINEATI INNOCUI`: 11 record, stato sostanziale coerente; il rischio di riscrittura supera il beneficio.
- `ALTRO / gruppo + linked`: nessuna azione senza decisione sul modello dati atteso.
- `ESEGUITI CON SORGENTE APERTA / controllo`: nessuna azione automatica finche' non viene deciso se il bottone `Richiudi` deve coprire anche i controlli.

## 3. DIVERGENZE rispetto all'audit 2026-06-05

| Categoria audit | Numero audit | Numero fresco | Esito |
|---|---:|---:|---|
| FANTASMI | 17 | 23 | DIVERGENZA: restano 17 segnalazioni, emergono anche 6 controlli con link a manutenzioni inesistenti |
| ESEGUITI CON SORGENTE APERTA | 2 | 3 | DIVERGENZA: restano 2 segnalazioni; emerge 1 controllo collegato a manutenzione eseguita e ancora aperto |
| DISALLINEATI INNOCUI | 11 | 11 | invariato |
| CONTRADDITTORI | 2 | 2 | invariato |
| ALTRO: gruppo + linked | 2 | 2 | invariato |
| Origini orfane dentro manutenzioni | 0 | 0 | invariato |
| Residui bug `fornitore` | non censito | 0 | nessun residuo rilevato su campo `fornitore` undefined/stringa `undefined` |

## 4. FANTASMI

Definizione usata: record in `@segnalazioni_autisti_tmp` o `@controlli_mezzo_autisti` con `linkedLavoroId`/`linkedLavoroIds` che puntano a ID non presenti in `@manutenzioni`.

Riparazione standard proposta, coerente con lo sgancio sorgente esistente:

- Segnalazione senza altri link validi: scrivere `linkedLavoroId: null`, `linkedLavoroIds: null`, `linkedMultiple: false`, `dataPresaInCarico: null`, `letta: false`, `stato: "nuova"`.
- Controllo senza altri link validi: scrivere `linkedLavoroId: null`, `linkedLavoroIds: null`, `linkedMultiple: false`, `dataPresaInCarico: null`, `letta: false`.
- Record con link misti validi/mancanti: rimuovere solo il link mancante e mantenere i link validi.

### 4.1 Segnalazioni fantasma

| ID | Targa | Autista | Data | Descrizione breve | Anomalia esatta | Riparazione proposta |
|---|---|---|---|---|---|---|
| `82ff0b71-623b-4d72-8587-6b8d0be6b77f` | TI178456 | GIUSEPPE MILIO | 2026-01-06 | motore: Rumore (prova) | `linkedLavoroId` punta a manutenzione inesistente `99f8c820-63c4-449c-a10b-7b2260c2ffc6` | `linkedLavoroId:null`, `linkedLavoroIds:null`, `linkedMultiple:false`, `dataPresaInCarico:null`, `letta:false`, `stato:"nuova"` |
| `e8750e0e-e421-4d07-aa6d-03722fc13012` | TI233827 | ELTON SELIMI | 2026-01-13 | altro: Ammortizzatori ultimo asse | `linkedLavoroId` punta a manutenzione inesistente `b994ae30-9ea9-49f3-aa31-fc7438188808` | `linkedLavoroId:null`, `linkedLavoroIds:null`, `linkedMultiple:false`, `dataPresaInCarico:null`, `letta:false`, `stato:"nuova"` |
| `f9e2e351-35a4-415d-b791-f638008518d3` | TI315407 | GIUSEPPE MILIO | 2026-01-14 | altro: Anabbagliante dx non funzionante | `linkedLavoroId` punta a manutenzione inesistente `4d455c2a-3d18-4106-b8fe-8af344585aff` | `linkedLavoroId:null`, `linkedLavoroIds:null`, `linkedMultiple:false`, `dataPresaInCarico:null`, `letta:false`, `stato:"nuova"` |
| `4017ba91-a08a-440c-a2d3-6015d8d5c797` | TI313387 | GIUSEPPE MILIO | 2026-01-15 | altro: Manca attrezzatura per scaricare | `linkedLavoroId` punta a manutenzione inesistente `c624c75d-e672-46db-af37-9f7cc88456eb` | `linkedLavoroId:null`, `linkedLavoroIds:null`, `linkedMultiple:false`, `dataPresaInCarico:null`, `letta:false`, `stato:"nuova"` |
| `fa8ee153-fda7-40f8-9347-bdc48961e56c` | TI298409 | RICCARDO FENDERICO | 2026-01-22 | elettrico: Lampadina anabbaglianti dx bruciata | `linkedLavoroId` punta a manutenzione inesistente `4ffc49f9-e322-4ccd-bb07-046aafa7f7a3` | `linkedLavoroId:null`, `linkedLavoroIds:null`, `linkedMultiple:false`, `dataPresaInCarico:null`, `letta:false`, `stato:"nuova"` |
| `eee4adb6-5623-4bed-858d-e3347cac4dde` | TI84822 | RICCARDO FENDERICO | 2026-01-29 | elettrico: Fare posteriore dx tutto spento | `linkedLavoroId` punta a manutenzione inesistente `23c31228-9f39-447e-88d3-0539f7399ad9` | `linkedLavoroId:null`, `linkedLavoroIds:null`, `linkedMultiple:false`, `dataPresaInCarico:null`, `letta:false`, `stato:"nuova"` |
| `b883f689-4c92-4a8e-8bf1-011e4bd99c79` | TI298409 | RICCARDO FENDERICO | 2026-01-30 | altro: problemi al riscaldamento | `linkedLavoroId` punta a manutenzione inesistente `be49d61f-65a2-4c15-8349-90e8fbde5612` | `linkedLavoroId:null`, `linkedLavoroIds:null`, `linkedMultiple:false`, `dataPresaInCarico:null`, `letta:false`, `stato:"nuova"` |
| `45feb9b9-3874-4219-814a-262f21799185` | TI285053 | RICCARDO FENDERICO | 2026-02-03 | altro: asse sferzante bloccato storto | `linkedLavoroId` punta a manutenzione inesistente `deb7da3e-2412-40d3-89ab-437e91acd98f` | `linkedLavoroId:null`, `linkedLavoroIds:null`, `linkedMultiple:false`, `dataPresaInCarico:null`, `letta:false`, `stato:"nuova"` |
| `7e9925c6-b92c-4daa-9209-b8bd496564a1` | TI84069 | SANDRO CALABRESE | 2026-02-05 | gomme: Tagliata | `linkedLavoroId` punta a manutenzione inesistente `1d8dfe6f-7d93-4333-963e-d14fb52cfc4a` | `linkedLavoroId:null`, `linkedLavoroIds:null`, `linkedMultiple:false`, `dataPresaInCarico:null`, `letta:false`, `stato:"nuova"` |
| `c11828ee-9835-494a-8c08-91a18009ed78` | TI239279 | FILIPPO MARTINELLI | 2026-02-10 | elettrico: sensore Ad Blue non funziona | `linkedLavoroId` punta a manutenzione inesistente `7eaa65ad-f74d-44d4-a5f1-df277b11c830` | `linkedLavoroId:null`, `linkedLavoroIds:null`, `linkedMultiple:false`, `dataPresaInCarico:null`, `letta:false`, `stato:"nuova"` |
| `2a629be1-3395-4449-8a3f-2b67ffbce6b0` | TI298409 | RICCARDO FENDERICO | 2026-02-17 | elettrico: Cambiate 3 lampadine | `linkedLavoroId` punta a manutenzione inesistente `74699f0a-83fe-4d6e-a43d-676de939a20f` | `linkedLavoroId:null`, `linkedLavoroIds:null`, `linkedMultiple:false`, `dataPresaInCarico:null`, `letta:false`, `stato:"nuova"` |
| `6a64e3bd-4f9b-44e1-859a-90aa4d1f2c0f` | TI285217 | FILIPPO MARTINELLI | 2026-02-19 | altro: Tubo scarico crepato | `linkedLavoroId` punta a manutenzione inesistente `b090c8a5-8eb4-48da-8619-b4f86fcbcde0` | `linkedLavoroId:null`, `linkedLavoroIds:null`, `linkedMultiple:false`, `dataPresaInCarico:null`, `letta:false`, `stato:"nuova"` |
| `ed063f99-e343-4642-8487-037e97b9a003` | TI287110 | RICCARDO FENDERICO | 2026-02-24 | elettrico: luci ingombro laterali sx spente | `linkedLavoroId` punta a manutenzione inesistente `dedc1377-1d4d-42b3-aff4-22f469a7a573` | `linkedLavoroId:null`, `linkedLavoroIds:null`, `linkedMultiple:false`, `dataPresaInCarico:null`, `letta:false`, `stato:"nuova"` |
| `8bcb855c-920f-459b-9a84-b5b127cf11e5` | TI113417 | SANDRO CALABRESE | 2026-02-27 | motore: Perdita di olio + perdita di aria | `linkedLavoroId` punta a manutenzione inesistente `eab98d6b-768d-4a5d-9e5a-03e5278c2177` | `linkedLavoroId:null`, `linkedLavoroIds:null`, `linkedMultiple:false`, `dataPresaInCarico:null`, `letta:false`, `stato:"nuova"` |
| `c2568521-a959-4791-aea8-485fb2c9e944` | TI280132 | RICCARDO FENDERICO | 2026-04-01 | gomme: 1 asse quasi finito | `linkedLavoroId` punta a manutenzione inesistente `8d2b5c5a-04bd-429a-87b7-739a41f11536` | `linkedLavoroId:null`, `linkedLavoroIds:null`, `linkedMultiple:false`, `dataPresaInCarico:null`, `letta:false`, `stato:"nuova"` |
| `5411913c-2956-47f6-9cce-b1d9df17c6e8` | TI324623 | IVAN ATTARDI | 2026-04-20 | altro: Climatizzatore non funziona | `linkedLavoroId` punta a manutenzione inesistente `1776868559013`, ma la segnalazione e' gia' `stato:"chiusa"` | AMBIGUA: vedi sezione 9 |
| `1dab2f26-db6b-4bc5-9856-4ee1fa4b21aa` | TI280132 | DANIELE LIVI | 2026-05-13 | gomme: Gomme primo asse molto usurate | `linkedLavoroId` punta a manutenzione inesistente `3b167c1a-2bdd-4f00-ad8e-336a41765e62` | `linkedLavoroId:null`, `linkedLavoroIds:null`, `linkedMultiple:false`, `dataPresaInCarico:null`, `letta:false`, `stato:"nuova"` |

### 4.2 Controlli fantasma

| ID | Targa | Autista | Data | Descrizione breve | Anomalia esatta | Riparazione proposta |
|---|---|---|---|---|---|---|
| `80049ab9-c74d-4687-9eca-67b061bd3eec` | TI313387 | GIUSEPPE MILIO | 2025-12-26 | controllo senza descrizione | `linkedLavoroIds` punta a manutenzioni inesistenti `9a12c1c7-6ecd-45f4-8f0d-ab2cd50adf19`, `93beea7d-1245-4369-b955-ce9d211fa5e3` | `linkedLavoroId:null`, `linkedLavoroIds:null`, `linkedMultiple:false`, `dataPresaInCarico:null`, `letta:false` |
| `25166fae-6344-4e4e-b40c-4ffb5dd4822c` | TI178456 | ELTON SELIMI | 2026-01-20 | Spia avaria freni accesa | `linkedLavoroId` punta a manutenzione inesistente `7420fd2e-cdad-4d71-b7f6-08550d13b39f` | `linkedLavoroId:null`, `linkedLavoroIds:null`, `linkedMultiple:false`, `dataPresaInCarico:null`, `letta:false` |
| `36af4b0d-b646-4da8-96aa-9324946eb228` | TI298409 | RICCARDO FENDERICO | 2026-01-26 | Perdita d'aria non identificata; botola cisterna ant rotta | `linkedLavoroIds` punta a manutenzioni inesistenti `c3ef6c33-482b-4a64-96b6-62a76c101808`, `aa3e15a8-3b4c-4b3b-8ee6-971d7e7fed77` | `linkedLavoroId:null`, `linkedLavoroIds:null`, `linkedMultiple:false`, `dataPresaInCarico:null`, `letta:false` |
| `d0934d91-b117-42ed-95c5-0a4bb704f048` | TI313387 | ELTON SELIMI | 2026-02-04 | Perdita aria quando si preme il pedale | `linkedLavoroId` punta a manutenzione inesistente `4c0a2df1-e445-4eeb-ba65-bbd6652f5432` | `linkedLavoroId:null`, `linkedLavoroIds:null`, `linkedMultiple:false`, `dataPresaInCarico:null`, `letta:false` |
| `48660226-d99a-44db-9b41-c340716338df` | TI279216 | PIERO LAURO | 2026-03-25 | Usura pneumatici 1 asse | `linkedLavoroId` punta a manutenzione inesistente `26c60405-ffc4-4481-abe5-5746d483922f` | `linkedLavoroId:null`, `linkedLavoroIds:null`, `linkedMultiple:false`, `dataPresaInCarico:null`, `letta:false` |
| `44ebe449-2750-45e6-add6-4d5c8ef9a8d3` | TI239279 | ANDREA SCALAMATO | 2026-04-02 | Grossa perdita quando si aziona il compressore di scarico | `linkedLavoroIds` contiene un link valido `from-lavoro-82df827a-b18b-43fa-b4ee-abf8e3b36389` e un link mancante `f8288347-2b06-4976-9e86-8ea152da1bd2` | rimuovere solo `f8288347-2b06-4976-9e86-8ea152da1bd2`; scrivere `linkedLavoroId:"from-lavoro-82df827a-b18b-43fa-b4ee-abf8e3b36389"`, `linkedLavoroIds:null`, `linkedMultiple:false`, `letta:true` |

## 5. CONTRADDITTORI

Definizione usata: segnalazioni con interruttori di chiusura in conflitto grave, cioe' `chiusa:true` ma `stato` ancora aperto (`nuova` o `presa_in_carico`), oppure inverso grave. Nel dato corrente sono emersi 2 casi, entrambi del primo tipo.

| ID | Targa | Autista | Data | Descrizione breve | Anomalia esatta | Riparazione proposta |
|---|---|---|---|---|---|---|
| `f83dbbe1-f955-404c-978f-e295e2080f55` | TI287110 | RICCARDO FENDERICO | 2026-02-25 | elettrico: luci ingombro lato sx spente | `chiusa:true`, `stato:"nuova"`, `dataChiusura` presente, nessun `chiusuraRefId` valido rilevato | AMBIGUA: vedi sezione 9 |
| `5cdfe350-804f-45c8-879b-433574b0700d` | TI313387 | ORLANDO BUTTI | 2026-03-30 | freni: Freni da controllare | `chiusa:true`, `stato:"presa_in_carico"`, `dataChiusura` presente, nessun `chiusuraRefId` valido rilevato | AMBIGUA: vedi sezione 9 |

## 6. DISALLINEATI INNOCUI

Definizione usata: casi lievi dove il vecchio flag booleano e il nuovo stato non sono allineati, ma la sostanza del ciclo vita risulta coerente. Proposta per tutti: NON INTERVENIRE.

| ID | Targa | Autista | Data | Descrizione breve | Anomalia esatta | Riparazione proposta |
|---|---|---|---|---|---|---|
| `d4964b81-6b28-451c-bdc8-f77a851a5627` | TI285217 | GIUSEPPE MILIO | 2026-04-03 | manometro pressione rotto; tubo flessibile crepato | `stato:"chiusa"` con vecchio flag `chiusa` non vero; `chiusuraRefId` valorizzato | NON INTERVENIRE |
| `b74d5e20-f2de-4aa2-9379-cfa07abab370` | TI285997 | IVAN ATTARDI | 2026-04-08 | fanalino SX non funzionante | `stato:"chiusa"` con vecchio flag `chiusa` non vero; `chiusuraRefId` valorizzato | NON INTERVENIRE |
| `c8e188a9-dda4-4662-a6b5-7b198c2201e3` | TI233827 | ELTON SELIMI | 2026-04-20 | perdita potenza | `stato:"chiusa"` con vecchio flag `chiusa` non vero; `chiusuraRefId` valorizzato | NON INTERVENIRE |
| `5411913c-2956-47f6-9cce-b1d9df17c6e8` | TI324623 | IVAN ATTARDI | 2026-04-20 | climatizzatore non funziona | `stato:"chiusa"` con vecchio flag `chiusa` non vero; in piu' ha link fantasma | NON INTERVENIRE per il solo disallineamento innocuo; per il link fantasma vedi ambiguita' |
| `b2d22ee1-fb0e-4383-8b5f-9de43d71b336` | TI298409 | RICCARDO FENDERICO | 2026-04-24 | perdita liquido raffreddamento | `stato:"chiusa"` con vecchio flag `chiusa` non vero; `chiusuraRefId` valorizzato | NON INTERVENIRE |
| `f7fdb252-a7ad-428d-80df-a58734bf72cd` | TI233827 | ELTON SELIMI | 2026-04-29 | motore spento in partenza | `stato:"chiusa"` con vecchio flag `chiusa` non vero; `chiusuraRefId` valorizzato | NON INTERVENIRE |
| `7d1d8009-69af-4578-a8ef-060d1d4f5766` | TI298409 | RICCARDO FENDERICO | 2026-05-08 | 4 gomme trazione arrivate al ferro | `stato:"chiusa"` con vecchio flag `chiusa` non vero; `chiusuraRefId` valorizzato | NON INTERVENIRE |
| `810d56e5-d8f2-4052-b5fa-775f5b366e80` | TI84822 | ORLANDO BUTTI | 2026-05-12 | guarnizioni tubi scarico usurate | `stato:"chiusa"` con vecchio flag `chiusa` non vero; `chiusuraRefId` valorizzato | NON INTERVENIRE |
| `b6f4bf2f-997c-4243-bc60-498a53bc18ea` | TI298409 | RICCARDO FENDERICO | 2026-05-18 | perdita liquido raffreddamento | `stato:"chiusa"` con vecchio flag `chiusa` non vero; `chiusuraRefId` valorizzato | NON INTERVENIRE |
| `f6d88291-e394-461b-a74a-541c8983eeb0` | TI285195 | PIERO LAURO | 2026-05-28 | guarnizione coperchio cisterna | `stato:"chiusa"` con vecchio flag `chiusa` non vero; `chiusuraRefId` valorizzato | NON INTERVENIRE |
| `da522c9b-aad6-4f06-89e8-8f95076d8b78` | TI239045 | ORLANDO BUTTI | 2026-06-02 | sedile rotto | `stato:"chiusa"` con vecchio flag `chiusa` non vero; `chiusuraRefId` valorizzato | NON INTERVENIRE |

## 7. ESEGUITI CON SORGENTE APERTA

Definizione usata: manutenzioni `eseguita` o chiuse da evento che risultano ancora collegate a origini non chiuse. Per le segnalazioni, la Fase 1 rende possibile il richiudi manuale da UI. Nessuno script deve partire da questa fase.

| Manutenzione | Targa | Autista | Data manutenzione | Origine aperta | Descrizione origine | Anomalia esatta | Percorso UI / riparazione proposta |
|---|---|---|---|---|---|---|---|
| `from-lavoro-5dd4afde-4531-4560-9496-512e35c60167` | TI239279 | ORLANDO BUTTI | 2026-04-01 | segnalazione `261619fc-be8a-4448-b0e9-bcf83b413772` | altro: Tubo 10 metri rotto | manutenzione eseguita ma segnalazione ancora `stato:"presa_in_carico"` | UI: `/next/manutenzioni?role=admin` -> TI239279 -> dettaglio manutenzione -> `Richiudi`. Azione prevista: `chiudiSegnalazioneDaEvento("261619fc-be8a-4448-b0e9-bcf83b413772","manutenzione","from-lavoro-5dd4afde-4531-4560-9496-512e35c60167", data manutenzione 2026-04-01)` |
| `from-lavoro-82df827a-b18b-43fa-b4ee-abf8e3b36389` | TI239279 | ANDREA SCALAMATO | 2026-04-10 | controllo `44ebe449-2750-45e6-add6-4d5c8ef9a8d3` | grossa perdita compressore di scarico | manutenzione eseguita ma controllo sorgente ancora aperto; stesso controllo ha anche un link fantasma | AMBIGUA: il bottone `Richiudi` della Fase 1 chiude segnalazioni; decidere se estendere/gestire i controlli in step separato. Lo sgancio del link fantasma e' censito in sezione 4.2 |
| `from-lavoro-f609de79-f9d6-4696-99ef-4dcff25dff49` | TI313387 | ORLANDO BUTTI | 2026-04-22 | segnalazione `c7bc5a05-5356-4e9c-afc0-fdca84239ea0` | idraulico: Perdita olio freni posteriore lato guida | manutenzione eseguita ma segnalazione ancora `stato:"presa_in_carico"` | UI: `/next/manutenzioni?role=admin` -> TI313387 -> dettaglio manutenzione -> `Richiudi`. Azione prevista: `chiudiSegnalazioneDaEvento("c7bc5a05-5356-4e9c-afc0-fdca84239ea0","manutenzione","from-lavoro-f609de79-f9d6-4696-99ef-4dcff25dff49", data manutenzione 2026-04-22)` |

## 8. ALTRO

### 8.1 Segnalazioni contemporaneamente in gruppo e collegate a manutenzione

Nel dato corrente restano 2 segnalazioni che risultano sia dentro un gruppo sia collegate a una manutenzione. Non e' proposta una scrittura automatica: serve decisione sul modello dati atteso.

| ID | Targa | Autista | Data | Descrizione breve | Anomalia esatta | Riparazione proposta |
|---|---|---|---|---|---|---|
| `7fa81331-a6ec-47e2-9d1a-1c30189fe76a` | TI233827 | ELTON SELIMI | 2026-05-20 | motore: Motore in protezione | `gruppoSegnalazioneId:"79a72198-cd97-4ae0-8690-b99e1d411671"` e `linkedLavoroId:"1780597640377"` coesistono | AMBIGUA: vedi sezione 9 |
| `0cd32f30-a2a1-454c-86a2-1e370b14c234` | TI233827 | ELTON SELIMI | 2026-05-29 | altro: Valvole di non ritorno | `gruppoSegnalazioneId:"79a72198-cd97-4ae0-8690-b99e1d411671"` e `linkedLavoroId:"1780597640377"` coesistono | AMBIGUA: vedi sezione 9 |

### 8.2 Residui bug fornitore

Non trovati residui correnti dove il campo `fornitore` esista con valore `undefined` o stringa `"undefined"`.

### 8.3 Origini orfane dentro manutenzioni

Non trovate manutenzioni con `origineRefs` che puntano a sorgenti inesistenti.

## 9. AMBIGUITA' per decisione Giuseppe

### A1 - Segnalazione chiusa con link fantasma

Record: `5411913c-2956-47f6-9cce-b1d9df17c6e8`  
Targa/autista/data: TI324623, IVAN ATTARDI, 2026-04-20  
Anomalia: `stato:"chiusa"` ma `linkedLavoroId:"1776868559013"` punta a manutenzione inesistente.

- Opzione a: applicare sgancio standard sorgente. Scritture: `linkedLavoroId:null`, `linkedLavoroIds:null`, `linkedMultiple:false`, `dataPresaInCarico:null`, `letta:false`, `stato:"nuova"`. Effetto: la segnalazione viene riaperta semanticamente.
- Opzione b: preservare chiusura e rimuovere solo il link fantasma. Scritture: `linkedLavoroId:null`, `linkedLavoroIds:null`, `linkedMultiple:false`. Effetto: nessuna riapertura, ma non e' la semantica piena dello sgancio orfano standard.

### A2 - Contraddittorio `f83dbbe1-f955-404c-978f-e295e2080f55`

Record: `f83dbbe1-f955-404c-978f-e295e2080f55`  
Targa/autista/data: TI287110, RICCARDO FENDERICO, 2026-02-25  
Anomalia: `chiusa:true`, `stato:"nuova"`, `dataChiusura` presente, nessun target di chiusura valido.

- Opzione a: riaprire davvero. Scritture: `chiusa:false`, `chiusa_by:null`, `dataChiusura:null`; lasciare `stato:"nuova"`.
- Opzione b: chiudere davvero come chiusura manuale. Scritture: `stato:"chiusa"`, `chiusuraDi:"manuale"`, `chiusuraRefId:null`, `chiusuraData:1778481001738`.

### A3 - Contraddittorio `5cdfe350-804f-45c8-879b-433574b0700d`

Record: `5cdfe350-804f-45c8-879b-433574b0700d`  
Targa/autista/data: TI313387, ORLANDO BUTTI, 2026-03-30  
Anomalia: `chiusa:true`, `stato:"presa_in_carico"`, `dataChiusura` presente, nessun target di chiusura valido.

- Opzione a: riaprire davvero. Scritture: `chiusa:false`, `chiusa_by:null`, `dataChiusura:null`; lasciare `stato:"presa_in_carico"`.
- Opzione b: chiudere davvero come chiusura manuale. Scritture: `stato:"chiusa"`, `chiusuraDi:"manuale"`, `chiusuraRefId:null`, `chiusuraData:1778446877382`.

### A4 - Manutenzione eseguita con controllo aperto

Record origine: controllo `44ebe449-2750-45e6-add6-4d5c8ef9a8d3`  
Manutenzione: `from-lavoro-82df827a-b18b-43fa-b4ee-abf8e3b36389`  
Anomalia: manutenzione eseguita, origine controllo non chiusa; il controllo ha anche un link fantasma aggiuntivo.

- Opzione a: in questo step dati riparare solo il link fantasma del controllo, preservando il link valido alla manutenzione eseguita. Scritture: `linkedLavoroId:"from-lavoro-82df827a-b18b-43fa-b4ee-abf8e3b36389"`, `linkedLavoroIds:null`, `linkedMultiple:false`, `letta:true`.
- Opzione b: aprire decisione separata per chiusura dei controlli da manutenzione eseguita. Nessuna scrittura di chiusura in Fase 2 finche' non viene definita la semantica.

### A5 - Gruppo + manutenzione collegata

Record: `7fa81331-a6ec-47e2-9d1a-1c30189fe76a`, `0cd32f30-a2a1-454c-86a2-1e370b14c234`  
Anomalia: segnalazioni con `gruppoSegnalazioneId` e `linkedLavoroId` contemporanei.

- Opzione a: vietare la coesistenza. Scritture per ciascun record: azzerare `gruppoSegnalazioneId` e gli eventuali metadati gruppo collegati, mantenendo `linkedLavoroId:"1780597640377"`.
- Opzione b: ammettere la coesistenza gruppo + manutenzione collegata. Scritture: nessuna.

## 10. Conclusione

REPORT COMPLETATO.

Nessuna scrittura dati e nessuna riparazione sono state eseguite in questa sessione. Il presente documento e' una proposta per approvazione esplicita prima di qualunque step operativo successivo.
