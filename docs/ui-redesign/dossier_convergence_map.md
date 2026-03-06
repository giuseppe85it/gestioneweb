# Mappa di convergenza moduli verso nuova architettura

Data: 2026-03-06  
Base di partenza: `docs/ui-redesign/modules_index_table.md` (85 moduli censiti, esclusa riga header).

## Macro-aree target
1. Home / Centro di Controllo
2. Flotta
3. Dossier Mezzo
4. Operatività
5. Magazzino
6. Analisi
7. Autisti
8. Sistema / Supporto

## 1) Home / Centro di Controllo
| Moduli assegnati | Destinazione finale | Nota pratica |
|---|---|---|
| `Home`, `CentroControllo`, `GestioneOperativa`, `DossierLista`, `IAHome` | **DIVENTA ACCESSO DAL CENTRO DI CONTROLLO** | Restano punti d’ingresso e orchestrazione, non contenitori di logica verticale completa. |

## 2) Flotta
| Moduli assegnati | Destinazione finale | Nota pratica |
|---|---|---|
| `Mezzi` | **RESTA GLOBALE** | Anagrafica flotta centrale condivisa. |
| `Manutenzioni`, `LavoriDaEseguire`, `LavoriInAttesa`, `LavoriEseguiti`, `DettaglioLavoro`, `CapoMezzi`, `CapoCostiMezzo` | **VA NEL DOSSIER** | Moduli per targa/intervento da consolidare come viste del Dossier Mezzo. |

## 3) Dossier Mezzo
| Moduli assegnati | Destinazione finale | Nota pratica |
|---|---|---|
| `DossierMezzo`, `DossierGomme`, `DossierRifornimenti`, `Mezzo360` | **VA NEL DOSSIER** | Nucleo funzionale del dossier per targa. |
| `IALibretto`, `IACoperturaLibretti`, `ControlloDebug`, `LibrettiExport` | **VA NEL DOSSIER** | IA libretti, audit e export dossierizzati sul mezzo. |

## 4) Operatività
| Moduli assegnati | Destinazione finale | Nota pratica |
|---|---|---|
| `Acquisti`, `MaterialiDaOrdinare`, `OrdiniInAttesa`, `OrdiniArrivati`, `DettaglioOrdine` | **RESTA GLOBALE** | Flusso procurement trasversale, non mezzo-centrico puro. |
| `Colleghi`, `Fornitori`, `AttrezzatureCantieri` | **RESTA GLOBALE** | Anagrafiche/asset operativi condivisi da più aree. |
| `IADocumenti` | **RESTA GLOBALE** | Pipeline documentale multi-dominio (`mezzi`, `magazzino`, `generici`). |
| `CisternaCaravatePage`, `CisternaCaravateIA` | **RESTA GLOBALE** | Dominio specialistico separato dalla UX Dossier standard. |

## 5) Magazzino
| Moduli assegnati | Destinazione finale | Nota pratica |
|---|---|---|
| `Inventario`, `MaterialiConsegnati` | **RESTA GLOBALE** | Moduli core stock/movimenti; nel Dossier solo viste derivate per mezzo. |

## 6) Analisi
| Moduli assegnati | Destinazione finale | Nota pratica |
|---|---|---|
| `AnalisiEconomica`, `GommeEconomiaSection`, `RifornimentiEconomiaSection` | **VA NEL DOSSIER** | Analisi per targa da integrare in dashboard mezzo. |
| `Autista360` | **RESTA GLOBALE** | Vista trasversale driver-eventi, utile anche fuori contesto mezzo singolo. |

## 7) Autisti
| Moduli assegnati | Destinazione finale | Nota pratica |
|---|---|---|
| `AutistiGate`, `LoginAutista`, `SetupMezzo`, `HomeAutista`, `CambioMezzoAutista` | **RESTA AREA AUTISTI** | Flusso operativo mobile/autista dedicato. |
| `Rifornimento`, `ControlloMezzo`, `Segnalazioni`, `RichiestaAttrezzature` | **RESTA AREA AUTISTI** | Writer eventi campo. |
| `AutistiInboxHome`, `CambioMezzoInbox`, `AutistiControlliAll`, `AutistiSegnalazioniAll`, `RichiestaAttrezzatureAll`, `AutistiGommeAll`, `AutistiLogAccessiAll` | **RESTA AREA AUTISTI** | Vista admin inbox/monitoraggio. |
| `AutistiAdmin` | **RESTA AREA AUTISTI** | Centro rettifica/import eventi autisti. |

## 8) Sistema / Supporto
| Moduli assegnati | Destinazione finale | Nota pratica |
|---|---|---|
| `IAApiKey` | **RESTA SISTEMA / SUPPORTO** | Configurazione tecnica IA. |
| `PdfPreviewModal`, `TargaPicker`, `ModalGomme`, `AutistiEventoModal`, `AutistiImportantEventsModal` | **RESTA SISTEMA / SUPPORTO** | Componenti riusabili trasversali. |
| `SessioniAttiveCard`, `RifornimentiCard` | **RESTA SISTEMA / SUPPORTO** | Widget compositivi inbox. |
| `storageSync`, `homeEvents`, `pdfEngine`, `pdfPreview`, `aiCore`, `alertsState`, `cisterna collections`, `firebase config` | **RESTA SISTEMA / SUPPORTO** | Layer tecnico infrastrutturale e utility core. |
| `Functions entry`, `Functions estrazioneDocumenti`, `Functions analisiEconomica`, `Functions iaCisternaExtract`, `Functions-schede entry`, `Functions-schede estrazioneScheda`, `Functions-schede documenti` | **RESTA SISTEMA / SUPPORTO** | Backend function layer. |
| `CisternaSchedeTest` | **RESTA SISTEMA / SUPPORTO** | Tool operativo specialistico, attivo ma secondario. |
| `API Vercel pdf-ai-enhance` | **LEGACY / DA ESCLUDERE** | Uso frontend non dimostrato nel repo. |
| `Route alias dossier`, `Route alias acquisti dettaglio` | **LEGACY / DA ESCLUDERE** | Alias compatibilità da deprecare dopo consolidamento routing. |
| `Backup file (AutistiInboxHome.tsx.bak2)`, `Artefatto zip (main.zip)`, `Root stub (rcautistiSetupMezzo.tsx)` | **LEGACY / DA ESCLUDERE** | Artefatti non funzionali alla nuova architettura. |

---

## Moduli che confluiscono nel Dossier Mezzo
- `Manutenzioni`
- `LavoriDaEseguire`
- `LavoriInAttesa`
- `LavoriEseguiti`
- `DettaglioLavoro`
- `CapoMezzi`
- `CapoCostiMezzo`
- `DossierMezzo`
- `DossierGomme`
- `DossierRifornimenti`
- `Mezzo360`
- `IALibretto`
- `IACoperturaLibretti`
- `ControlloDebug`
- `LibrettiExport`
- `AnalisiEconomica`
- `GommeEconomiaSection`
- `RifornimentiEconomiaSection`

## Moduli che restano globali
- `Mezzi`
- `Acquisti`
- `MaterialiDaOrdinare`
- `OrdiniInAttesa`
- `OrdiniArrivati`
- `DettaglioOrdine`
- `Colleghi`
- `Fornitori`
- `AttrezzatureCantieri`
- `Inventario`
- `MaterialiConsegnati`
- `Autista360`
- `IADocumenti`
- `CisternaCaravatePage`
- `CisternaCaravateIA`

## Moduli che diventano solo scorciatoie/accessi dal Centro di Controllo
- `Home`
- `CentroControllo`
- `GestioneOperativa`
- `DossierLista`
- `IAHome`

## Moduli legacy/esclusi
- `API Vercel pdf-ai-enhance`
- `Route alias dossier`
- `Route alias acquisti dettaglio`
- `src/autistiInbox/AutistiInboxHome.tsx.bak2`
- `src/main.zip`
- `rcautistiSetupMezzo.tsx`

## Note moduli ibridi (trattamento futura UI)
- `MaterialiConsegnati`: modulo globale con vista dossier derivata per targa, senza duplicare writer.
- `IADocumenti`: intake globale; nel Dossier solo pannelli di consultazione documenti mezzo.
- `Autista360`: vista analitica trasversale, da collegare al Dossier come drill-down e non come sostituzione.
- `CisternaSchedeTest`: mantenere accesso tecnico controllato fuori navigazione primaria utente.
