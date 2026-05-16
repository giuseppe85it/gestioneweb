# Diagrammi Autisti e punti aperti

Data originale: 2026-05-07 — Aggiornato: 2026-05-16

## Aggiornamento 2026-05-16

Delta dal 2026-05-08 al 2026-05-16 sui diagrammi Autisti. Origine: `DIARIO_DECISIONI.md` + `AUDIT_NEXT_COMPLETO_2026-05-16.md`. I diagrammi originali restano per memoria storica; gli aggiornamenti specifici sono qui sotto.

- `[AGGIORNATO]` Sezioni 3 e 6/7 (controllo, segnalazione, richieste): il flusso "NEXT no-op managed key" sui dataset autisti è stato superato per il **lato Centro Controllo** dalla decisione 2026-05-09 (4 nuovi scope barrier). Le pagine driver `/next/autisti/*` restano read-only/no-op (corretto), ma il CC può ora scrivere business reale via writer dedicati `markSegnalazioneChiusa` ([src/next/nextSegnalazioniWriter.ts](../../../src/next/nextSegnalazioniWriter.ts)), `markControlloChiuso` ([src/next/nextControlliWriter.ts](../../../src/next/nextControlliWriter.ts)), `markRichiestaEvasa`, `createManutenzioneDaFareFromEvento` ([src/next/writers/nextManutenzioneDaFareCreateWriter.ts](../../../src/next/writers/nextManutenzioneDaFareCreateWriter.ts)).
- `[AGGIORNATO]` Sezione 4 "Autisti Inbox/Admin NEXT - lettura tmp e consolidamento": il flusso "LocalOverlay override clone" sui dataset ufficiali è stato superato per i casi attivati dal CC. La modale `NextHomeAutistiEventoModal` ora è autonoma (PROMPT 28, 2026-05-14): non wrappa più la madre `AutistiEventoModal.tsx` (opzione α, shared, intoccabile) ma usa wrapper NEXT autonomo che scrive `@manutenzioni daFare` reale.
- `[NUOVO]` Flusso CC "Marca chiusa/chiuso" (decisione 2026-05-09):
  ```mermaid
  flowchart TD
    CC[Centro Controllo NEXT]
    ArchivioStorico[Archivio Storico CC]
    Sinottica[Sinottica V2]
    MarkChiusa[markSegnalazioneChiusa]
    MarkChiuso[markControlloChiuso]
    MarkEvasa[markRichiestaEvasa]
    HardDelete[nextMezzoHardDeleteWriter]
    Segn[(storage/@segnalazioni_autisti_tmp)]
    Contr[(storage/@controlli_mezzo_autisti)]
    Rich[(storage/@richieste_attrezzature_autisti_tmp)]
    DatasetMezzo[11 dataset mezzo]

    ArchivioStorico -->|click Chiudi| MarkChiusa
    ArchivioStorico --> MarkChiuso
    ArchivioStorico --> MarkEvasa
    MarkChiusa -->|chiusa:true + dataChiusura + chiusa_by| Segn
    MarkChiuso -->|chiuso:true + dataChiusura + chiuso_by| Contr
    MarkEvasa -->|evasa:true + dataEvasione + evasa_by| Rich
    Sinottica -->|shift+click foto + conferma targa| HardDelete
    HardDelete -->|cascade by targa| DatasetMezzo
  ```
- `[NUOVO]` Flusso aggancio inverso PROMPT 47 (decisione 2026-05-15):
  ```mermaid
  flowchart TD
    ArchivioStorico[Archivio Storico CC]
    AggancioInverso[agganciaSegnalazioneAManutenzioneEsistente]
    Reader[manutenzioniPerAggancio.ts]
    Manut[(storage/@manutenzioni)]
    Segn[(storage/@segnalazioni_autisti_tmp)]
    Contr[(storage/@controlli_mezzo_autisti)]
    ClosureOrch[closureOrchestrator.ts]
    SganciaOrfano[sganciaLegameOrfano]

    ArchivioStorico -->|"Aggancia a manutenzione esistente"| AggancioInverso
    AggancioInverso --> Reader
    Reader -.->|finestra 365gg, tutti stati| Manut
    AggancioInverso -->|writeLegameLavoro + writeLegameOrigine se stand-alone| Manut
    AggancioInverso -->|forward-link| Segn
    AggancioInverso -->|forward-link| Contr
    AggancioInverso -->|target eseguito → propaga chiusura| ClosureOrch
    ArchivioStorico -->|"Sgancia orfano"| SganciaOrfano
    SganciaOrfano --> Segn
  ```
- `[AGGIORNATO]` Sezione 11 "Punti DA VERIFICARE rimasti": resta valido, ma il punto "Autisti NEXT non writer reale" è ora parziale (vedi file 04 aggiornato DV-33). Aggiungere: regole permanenti `AUDIT-CERCA-PER-TARGA` e `TIMESTAMP-MAI-DA-CLICK` in [AGENTS.md](../../../AGENTS.md).

Tutti i diagrammi sono Mermaid `flowchart`. Nessuna immagine generata.

## 1. Autisti madre vs NEXT - panoramica

```mermaid
flowchart TD
  LegacyRoutes[Route madre /autisti e /autisti-inbox]
  NextRoutes[Route NEXT /next/autisti e /next/autisti-inbox]
  LegacyWriters[Writer madre reali]
  NextRuntime[Runtime NEXT native/clone]
  NextNoop[Managed keys no-op o local overlay]
  Datasets[Dataset Autisti reali]

  LegacyRoutes --> LegacyWriters
  LegacyWriters --> Datasets
  NextRoutes --> NextRuntime
  NextRuntime --> NextNoop
  NextNoop -. non scrive business reale .-> Datasets
```

## 2. App Autisti NEXT - sessione, setup, cambio mezzo

```mermaid
flowchart TD
  Login[Next Login Autista]
  Setup[Next Setup Mezzo]
  Cambio[Next Cambio Mezzo]
  StorageSync[nextAutistiStorageSync]
  Sessioni["@autisti_sessione_attive"]
  Storico["@storico_eventi_operativi"]

  Login --> StorageSync
  Setup --> StorageSync
  Cambio --> StorageSync
  StorageSync -->|official runtime managed key: return| NoWrite[Nessuna scrittura business]
  NoWrite -.-> Sessioni
  NoWrite -.-> Storico
```

## 3. App Autisti NEXT - controllo, rifornimento, segnalazione, richiesta

```mermaid
flowchart TD
  Controllo[Next Controllo Mezzo]
  Rifornimento[Next Rifornimento]
  Segnalazione[Next Segnalazione]
  Richiesta[Next Richiesta Attrezzature]
  Sync[nextAutistiStorageSync]
  TmpControlli["@controlli_mezzo_autisti"]
  TmpRifornimenti["@rifornimenti_autisti_tmp"]
  TmpSegnalazioni["@segnalazioni_autisti_tmp"]
  TmpRichieste["@richieste_attrezzature_autisti_tmp"]

  Controllo --> Sync
  Rifornimento --> Sync
  Segnalazione --> Sync
  Richiesta --> Sync
  Sync -->|official runtime: no-op managed keys| NoWrite[Nessuna scrittura reale]
  NoWrite -.-> TmpControlli
  NoWrite -.-> TmpRifornimenti
  NoWrite -.-> TmpSegnalazioni
  NoWrite -.-> TmpRichieste
```

## 4. Autisti Inbox/Admin NEXT - lettura tmp e consolidamento

```mermaid
flowchart TD
  InboxHome[Next Inbox Home]
  Admin[Next Autisti Admin]
  Bridge[nextAutistiAdminBridges]
  Registry[nextUnifiedReadRegistryDomain]
  LocalOverlay["@next_clone_autisti:admin-bridge-docs"]
  Tmp[Tmp Autisti]
  Official[Dataset ufficiali]

  InboxHome --> Registry
  Admin --> Bridge
  Bridge --> Registry
  Bridge --> LocalOverlay
  Registry --> Tmp
  LocalOverlay -. override clone .-> Official
```

## 5. Rifornimenti autisti - tmp -> admin -> @rifornimenti

```mermaid
flowchart TD
  LegacyDriver[Madre Rifornimento.tsx]
  Tmp["@rifornimenti_autisti_tmp"]
  LegacyAdmin[Madre AutistiAdmin.tsx]
  Dossier["@rifornimenti"]
  NextDriver[Next Rifornimento]
  NextAdmin[Next Admin]
  NextOverlay[Overlay local NEXT]

  LegacyDriver --> Tmp
  LegacyDriver --> Dossier
  Tmp --> LegacyAdmin
  LegacyAdmin --> Dossier
  NextDriver --> NextOverlay
  NextAdmin --> NextOverlay
  NextOverlay -. non consolida Firebase reale .-> Dossier
```

## 6. Controlli autisti - tmp -> inbox/admin -> Centro Controllo

```mermaid
flowchart TD
  LegacyControllo[Madre ControlloMezzo]
  TmpControlli["@controlli_mezzo_autisti"]
  LegacyAdmin[Madre Admin Controlli]
  Centro[Centro Controllo NEXT]
  Reader[readNextAutistiReadOnlySnapshot]
  NextControllo[Next Controllo]

  LegacyControllo --> TmpControlli
  TmpControlli --> LegacyAdmin
  TmpControlli --> Reader
  Reader --> Centro
  NextControllo -. no-op managed key .-> TmpControlli
```

## 7. Segnalazioni autisti - tmp -> inbox/admin -> Dettaglio lavoro / Centro

```mermaid
flowchart TD
  LegacySegnalazione[Madre Segnalazioni]
  Storage[Storage allegati]
  TmpSegnalazioni["@segnalazioni_autisti_tmp"]
  LegacyAdmin[Madre AutistiAdmin]
  Lavori["@lavori"]
  Centro[Centro Controllo NEXT]
  NextSegnalazione[Next Segnalazione]

  LegacySegnalazione --> Storage
  LegacySegnalazione --> TmpSegnalazioni
  TmpSegnalazioni --> LegacyAdmin
  LegacyAdmin --> Lavori
  TmpSegnalazioni --> Centro
  NextSegnalazione -. no-op/clone .-> TmpSegnalazioni
```

## 8. Gomme autisti - tmp -> admin -> @gomme_eventi -> Dossier gomme

```mermaid
flowchart TD
  LegacyGomme[Madre GommeAutistaModal]
  TmpGomme["@cambi_gomme_autisti_tmp"]
  LegacyAdmin[Madre AutistiAdmin]
  Eventi["@gomme_eventi"]
  Dossier[Dossier Gomme NEXT]
  NextGomme[Next Gomme]

  LegacyGomme --> TmpGomme
  TmpGomme --> LegacyAdmin
  LegacyAdmin --> Eventi
  Eventi --> Dossier
  NextGomme -. no-op/clone .-> TmpGomme
```

## 9. Richieste attrezzature - tmp -> inbox/admin -> Magazzino/Attrezzature

```mermaid
flowchart TD
  LegacyRichiesta[Madre RichiestaAttrezzature]
  Storage[Storage allegati]
  TmpRichieste["@richieste_attrezzature_autisti_tmp"]
  LegacyAdmin[Madre AutistiAdmin]
  Magazzino[Magazzino/Attrezzature NEXT]
  NextRichiesta[Next Richiesta Attrezzature]

  LegacyRichiesta --> Storage
  LegacyRichiesta --> TmpRichieste
  TmpRichieste --> LegacyAdmin
  TmpRichieste -. relazione da audit mirato .-> Magazzino
  NextRichiesta -. no-op/clone .-> TmpRichieste
```

## 10. Archivista / IA documentale - documento -> Storage -> root collection -> moduli

```mermaid
flowchart TD
  File[File utente]
  Archivista[Archivista NEXT]
  Backend[Backend IA documentale]
  Storage[Firebase Storage documenti_pdf/preventivi]
  DocMezzi["@documenti_mezzi"]
  DocMag["@documenti_magazzino"]
  DocGen["@documenti_generici"]
  Preventivi["storage/@preventivi"]
  Mezzi["@mezzi_aziendali"]
  Dossier[Dossier Mezzo NEXT]
  Manutenzioni[Manutenzioni NEXT]
  Magazzino[Magazzino NEXT]
  ChatIA[Chat IA NEXT]

  File --> Archivista
  Archivista --> Backend
  Archivista --> Storage
  Archivista --> DocMezzi
  Archivista --> DocMag
  Archivista --> DocGen
  Archivista --> Preventivi
  Archivista --> Mezzi
  DocMezzi --> Dossier
  DocMezzi --> Manutenzioni
  DocMag --> Magazzino
  Preventivi --> Dossier
  DocMezzi --> ChatIA
```

## 11. Punti DA VERIFICARE rimasti - diagramma di rischio

```mermaid
flowchart TD
  Risks[Punti residui]
  Rules[Rules Firestore/Storage signed-in]
  Autisti[Autisti NEXT non writer reale]
  IA[Payload IA dinamici]
  Approvals["@preventivi_approvazioni writer NEXT assente"]
  Analisi["@analisi_economica_mezzi writer NEXT assente"]
  Css[CSS legacy UI-only]

  Risks --> Rules
  Risks --> Autisti
  Risks --> IA
  Risks --> Approvals
  Risks --> Analisi
  Risks --> Css
```

## 12. Dataset critici Autisti e Archivista - chi legge / chi scrive

```mermaid
flowchart TD
  MadreAutisti[Madre Autisti/Admin]
  NextAutisti[Next Autisti/Admin]
  Archivista[Archivista NEXT]
  Centro[Centro Controllo NEXT]
  Dossier[Dossier NEXT]
  Magazzino[Magazzino NEXT]
  TmpAutisti[Tmp Autisti]
  OfficialAutisti["@rifornimenti / @gomme_eventi / @lavori"]
  Documenti["@documenti_mezzi / @documenti_magazzino / @documenti_generici"]
  Preventivi["storage/@preventivi"]

  MadreAutisti --> TmpAutisti
  MadreAutisti --> OfficialAutisti
  NextAutisti -. overlay/no-op .-> TmpAutisti
  TmpAutisti --> Centro
  OfficialAutisti --> Dossier
  Archivista --> Documenti
  Archivista --> Preventivi
  Documenti --> Dossier
  Documenti --> Magazzino
  Preventivi --> Dossier
```
