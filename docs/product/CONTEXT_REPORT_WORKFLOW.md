# CONTEXT REPORT WORKFLOW

Versione: 2026-03-06  
Scopo: definire come creare un report di continuita pronto da incollare in ChatGPT.

## 1) A cosa serve
- trasferire velocemente il contesto operativo tra chat diverse
- ripartire senza dipendere dalla memoria della conversazione precedente
- ridurre errori su vincoli, decisioni e stato reale

## 2) Quando usarlo
- prima di aprire una nuova chat operativa
- dopo una serie di task collegati
- quando cambia area modulo o owner operativo
- quando e necessario un handover tecnico sintetico

## 3) Fonti da leggere per compilarlo
1. ultimi commit rilevanti (`git log --oneline` su finestra recente)
2. ultimi change reports in `docs/change-reports/`
3. blueprint ufficiale:
   - `docs/PROJECT_MASTER_BLUEPRINT.md`
   - `docs/product/PROJECT_DECISIONS_LOG.md`
   - `docs/architecture/NEXT_APP_ARCHITECTURE.md`
   - `docs/data/DATA_MASTER_MAP.md`
   - `docs/security/SECURITY_AND_PERMISSIONS_BLUEPRINT.md`
4. stato modulo/area corrente (file e documenti toccati)

## 4) Differenza tra continuity report e change report
- **Change report**:
  - descrive un singolo task
  - e puntuale e breve
  - traccia output immediato
- **Continuity report**:
  - riassume stato operativo complessivo recente
  - collega piu task/commit/report
  - e pronto per copia/incolla in nuova chat

## 5) Procedura consigliata
1. raccogli ultimi 3-10 commit rilevanti
2. leggi gli ultimi change report collegati all'area
3. estrai decisioni gia prese e vincoli da non rompere
4. compila il template:
   - `docs/continuity-reports/_TEMPLATE_CONTINUITY_REPORT.md`
5. marca i punti non certi con `DA VERIFICARE` o `NON TROVATO`
6. salva in `docs/continuity-reports/` con naming standard

## 6) Convenzione nome file continuity report
Formato obbligatorio:
- `YYYY-MM-DD_HHMM_continuity_<area-o-modulo>.md`

Esempio:
- `2026-03-06_1930_continuity_dossier-mezzo.md`

## 7) Output pensato per ChatGPT
Il file deve essere:
- breve ma completo
- privo di codice e diff
- leggibile anche dopo settimane
- copiabile integralmente in chat senza editing
