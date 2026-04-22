# SPEC_LAVORI_NEXT_UI_UNIFICATA_LOGICA_REALE.md

## Obiettivo
Redesign completo dell’area **Lavori** nella NEXT con **UI unificata stile dashboard aziendale**, mantenendo però **la logica reale attuale dei moduli Lavori**.

Questa spec **NON** trasforma Lavori in una versione ridotta o read-only.

La regola è:
- **UI nuova unificata**
- **stessa logica attuale sotto**
- **stessi dati**
- **stesse scritture**
- **stessi risultati visibili**
- **stesse azioni utente**
- **stessa capacità operativa dei moduli attuali**

In pratica:
- si cambia la **carrozzeria**
- non si cambia il **motore**

---

## Principio guida non negoziabile
La nuova UI deve essere quella scelta nel file di riferimento precedente:
- topbar con tab
- stat card
- tabella moderna
- dettaglio in modale
- pagina più pulita e dashboard-like

Ma il comportamento deve restare quello reale attuale dei moduli Lavori.

Quindi:
- **In attesa** deve continuare a funzionare come oggi
- **Eseguiti** deve continuare a funzionare come oggi
- **Aggiungi** deve continuare a salvare come oggi
- **Dettaglio** deve continuare a leggere/scrivere/eseguire/eliminare come oggi

Il modale di dettaglio è consentito solo come **contenitore UI**, non come versione ridotta o impoverita del modulo.

---

## Perimetro di modifica

### File modificabili
- `src/next/NextLavoriDaEseguirePage.tsx` → nuovo entry point UI unificato
- `src/next/NextLavoriInAttesaPage.tsx` → logica e handler da preservare, UI eventualmente rifattorizzabile/riusabile
- `src/next/NextLavoriEseguitiPage.tsx` → logica e handler da preservare, UI eventualmente rifattorizzabile/riusabile
- `src/next/NextDettaglioLavoroPage.tsx` → resta la fonte di verità del dettaglio lavoro; può essere adattato per funzionare anche in modale
- `src/next/next-lavori.css` → nuovo file CSS dedicato
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/` (nuovo change report)
- `docs/continuity-reports/` (nuovo continuity report)
- `CONTEXT_CLAUDE.md`

### File da NON toccare
- `src/pages/*` (madre intoccabile)
- `src/App.tsx`
- `src/next/NextShell.tsx`
- `src/next/next-shell.css`
- `src/next/domain/*` salvo strettissima necessità dimostrata
- qualunque writer/storage/Firebase di base salvo strettissima necessità dimostrata
- route file e wiring globale shell

---

## Architettura nuova UI

### Struttura generale
`NextLavoriDaEseguirePage.tsx` diventa il **contenitore UI unificato** con 3 tab:
- **In attesa**
- **Eseguiti**
- **Aggiungi**

Ma le tab NON devono reinventare la logica.
Devono riusare o orchestrare la logica reale esistente dei moduli attuali.

### Regola architetturale chiave
La nuova pagina unificata deve essere una **shell UI sopra i moduli/logiche esistenti**, non una riscrittura ridotta del modulo.

Tradotto:
- la logica di `NextLavoriInAttesaPage` resta valida
- la logica di `NextLavoriEseguitiPage` resta valida
- la logica di `NextDettaglioLavoroPage` resta valida
- la logica di aggiunta/salvataggio gruppo lavori resta valida

Se serve, si estraggono componenti/piece UI o hook interni, ma:
- **nessun comportamento operativo va perso**
- **nessuna scrittura va disabilitata**
- **nessun flusso va impoverito**

---

## Route da mantenere coerenti
Le route devono continuare a esistere e a funzionare.

### Route principali
- `/next/lavori-da-eseguire` → nuova dashboard lavori, tab default `In attesa`
- `/next/lavori-in-attesa` → deve continuare a portare al comportamento reale “In attesa”, anche se la UI finale converge nella dashboard
- `/next/lavori-eseguiti` → deve continuare a portare al comportamento reale “Eseguiti”, anche se la UI finale converge nella dashboard
- `/next/dettagliolavori/:lavoroId` → deve continuare a funzionare davvero

### Regola importante sulla route dettaglio
Il dettaglio può essere mostrato come **modale** dentro la dashboard.

Ma la route `/next/dettagliolavori/:lavoroId`:
- non va impoverita
- non va svuotata
- non deve perdere la capacità di aprire il vero dettaglio

Soluzione corretta:
- esiste **un solo componente/logica di dettaglio reale**
- quel dettaglio può essere montato:
  - come modale sopra la dashboard
  - oppure come route diretta
- il contenitore cambia
- la logica resta la stessa

---

## Design system UI scelto

### Layout generale
- Sfondo pagina: `var(--color-background-tertiary)`
- Padding: `20px`
- Gap tra sezioni: `20px`

### Topbar pagina
```text
[Label "Operatività" muta] [Titolo "Lavori" 18px/500]    [TAB: In attesa | Eseguiti | Aggiungi]
```
- Separata dal contenuto da `border-bottom: 0.5px solid var(--color-border-tertiary)`
- Tab: background `var(--color-background-secondary)`, padding `3px`, border-radius md
- Tab attivo: background `var(--color-background-primary)`, border `0.5px solid var(--color-border-tertiary)`

### Stat card row
- Grid `repeat(4, 1fr)`, gap `10px`
- Background: `var(--color-background-secondary)`
- Border radius md
- Padding `10px 14px`
- Label: 11px muto
- Value: 22px/500
- Sub: 11px muto

### Card tabella
- Background: `var(--color-background-primary)`
- Border `0.5px solid var(--color-border-tertiary)`
- Border-radius lg
- Header con titolo + azioni a destra
- Search bar con input e select filtri
- Tabella con `th` secondary e righe hover

### Badge urgenza
- Alta: `#fee2e2 / #991b1b`
- Media: `#fef9c3 / #854d0e`
- Bassa: `#dcfce7 / #166534`
- In attesa: `#dbeafe / #1e40af`
- Eseguito: `#dcfce7 / #166534`

Questa parte UI resta valida.

---

## Tab 1 — In attesa

### Regola
La tab **In attesa** deve avere la UI nuova, ma deve continuare a usare la **logica vera attuale** del modulo lavori in attesa.

### Fonte dati
- usare la stessa fonte dati oggi usata dal modulo attuale
- non cambiare il contratto dati
- non creare scorciatoie o snapshot impoveriti

### Search bar
- cerca per targa o descrizione
- filtro urgenza
- filtro tipo

### Colonne tabella
| Colonna | Fonte logica | Note UI |
|---|---|---|
| Mezzo | logica attuale | foto 36x28px + modello + fallback |
| Descrizione lavoro | logica attuale | descrizione principale |
| Tipo | logica attuale | targa / magazzino |
| Urgenza | logica attuale | badge colorato |
| Data | logica attuale | formato dd/mm/yyyy |
| Stato | logica attuale | badge |
| Azioni | logica attuale | bottone `Dettaglio →` apre modale |

### Azioni header card
- `Export PDF` deve continuare a usare la logica reale esistente
- `+ Aggiungi` deve portare alla tab `Aggiungi`

---

## Tab 2 — Eseguiti

### Regola
La tab **Eseguiti** deve avere la UI nuova, ma deve continuare a usare la **logica vera attuale** del modulo lavori eseguiti.

### Fonte dati
- usare la stessa fonte logica oggi usata dal modulo eseguiti
- non cambiare la semantica dei dati

### Search bar
- cerca per targa o descrizione
- filtro mese
- filtro tipo

### Colonne tabella
| Colonna | Fonte logica | Note UI |
|---|---|---|
| Mezzo | logica attuale | targa + foto + modello |
| Descrizione lavoro | logica attuale | descrizione principale |
| Tipo | logica attuale | magazzino / targa |
| Urgenza originale | logica attuale | badge |
| Data esecuzione | logica attuale | dd/mm/yyyy |
| Eseguito da | logica attuale | avatar iniziali + nome |
| Azioni | logica attuale | `Dettaglio →` apre modale |

### Avatar esecutore
- cerchio 22px
- background `var(--color-background-info)`
- iniziali 9px
- se nome manca: `—`

---

## Tab 3 — Aggiungi

### Regola fondamentale
La tab **Aggiungi** NON deve essere read-only.

Deve mantenere il comportamento reale attuale di inserimento e salvataggio gruppo lavori.

### Vietato
- `disabled` sul bottone salva
- notice gialla di sola lettura
- fake form senza salvataggio
- blocco artificiale dei writer reali del modulo se oggi esistono e fanno parte del comportamento attuale

### Campi form
```text
[Tipo lavoro: select Targa/Magazzino]  [Data: input date]
[Targa mezzo: input con autocompletamento da flotta]  [Urgenza: 3 bottoni Bassa/Media/Alta]
---
[Sezione voci lavoro]
  [Input descrizione voce]  [Select urgenza voce]  [Bottone rimuovi ✕]
  ... (righe dinamiche)
  [Bottone "+ Aggiungi voce"]
---
[Footer: Annulla | Salva gruppo lavori]
```

### Regola logica
- i pulsanti devono funzionare davvero
- l’aggiunta voce deve funzionare davvero
- il salvataggio gruppo deve funzionare davvero
- il comportamento deve restare quello del modulo attuale

### Autocompletamento targa
- usare lo stesso pattern reale oggi esistente
- non inventare una nuova fonte dati

---

## Dettaglio lavoro come modale

### Regola principale
Il dettaglio si può mostrare come **modale**.

Ma il modale deve montare il **vero dettaglio**, non una versione ridotta.

### Trigger
- click su `Dettaglio →` in qualsiasi riga
- overlay scuro + modale centrato

### Header modale
```text
[Foto mezzo 48x36px]  [Targa]  [Modello/tipo mezzo]    [PDF] [✕]
```

### Body modale
- stessa logica reale del dettaglio attuale
- stessi dati reali
- stesse sezioni informative
- stessa semantica operativa

### Footer modale
I bottoni devono mantenere il comportamento reale attuale del dettaglio, se oggi esistono:
```text
[Modifica]  [Elimina]  [Segna come eseguito]
```

### Vietato
- bottoni `disabled`
- `opacity: 0.4` su azioni vere
- notice fake di sola lettura
- rimozione di funzioni attuali

### Fonte dati modale
- la stessa usata oggi dal dettaglio reale
- non creare uno snapshot ridotto solo per il modale

---

## Route diretta dettaglio

### Regola obbligatoria
La route `/next/dettagliolavori/:lavoroId` deve continuare a funzionare davvero.

### Soluzione ammessa
- può aprire la stessa UI di dettaglio in forma modale su shell lavori
- oppure può aprire una pagina che monta lo stesso componente dettaglio

### Soluzione NON ammessa
- route svuotata
- redirect che perdono stato o azioni
- route che non permette più il comportamento reale del dettaglio

---

## CSS — next-lavori.css

Creare `src/next/next-lavori.css` con tutte le classi UI nuove.

### Regole CSS
- solo classi scoped del modulo Lavori
- nessun impatto sulla shell
- nessun global leak
- nessun override pericoloso su moduli esterni

---

## Vincoli non negoziabili
- Madre intoccabile
- Nessun impoverimento di lettura/scrittura
- Nessun cambio del comportamento reale dei moduli Lavori
- Nessun read-only artificiale
- Nessun bottone operativo reale disabilitato
- Nessuna perdita di route reale
- Nessuna perdita di dettaglio reale
- Build OK obbligatoria
- UI in italiano

---

## Strategia tecnica consigliata

### Approccio corretto
1. Usare `NextLavoriDaEseguirePage.tsx` come nuova shell UI unificata
2. Riutilizzare la logica reale esistente dei moduli Lavori
3. Se serve, estrarre componenti UI comuni o adapter interni
4. Fare in modo che il dettaglio sia un componente unico riusabile:
   - dentro modale
   - su route diretta
5. Lasciare invariati i contratti dati e i writer reali del modulo

### Approccio da evitare
- riscrivere da zero la logica di Lavori dentro una dashboard nuova
- trasformare Lavori in un modulo read-only travestito
- cambiare il flusso solo perché “è più bello”

---

## Verifica obbligatoria post-patch
- `/next/lavori-da-eseguire` → tab `In attesa` con dati reali e azioni reali
- `/next/lavori-da-eseguire?tab=eseguiti` → tab `Eseguiti` con dati reali
- tab `Aggiungi` → form reale, salvataggio reale
- click `Dettaglio →` → modale si apre con dati veri e azioni vere
- azioni dettaglio → stesse capacità del modulo attuale
- `/next/dettagliolavori/:lavoroId` → continua a funzionare davvero
- `/next/autisti-inbox` → nessuna regressione shell
- `/next/materiali-da-ordinare` → nessuna regressione shell
- `npm run build` → OK
- `eslint` sui file toccati → OK

---

## Output atteso da Codex

```text
1. PATCH COMPLETATA oppure PATCH PARZIALE
2. FILE TOCCATI
3. COSA HAI IMPLEMENTATO
4. COME HAI PRESERVATO LA LOGICA REALE
5. DELTA ANCORA APERTI
6. VERIFICHE ESEGUITE
7. DOCUMENTI AGGIORNATI
```

---

## Nota finale di allineamento
Questa spec sostituisce la versione che rendeva:
- `Aggiungi` in sola lettura
- bottoni operativi `disabled`
- dettaglio impoverito o solo modale come nuova verità

La nuova regola è:
- **UI nuova scelta dall’utente**
- **logica reale attuale invariata**
- **dettaglio come modale sì, ma con stessa logica reale**
