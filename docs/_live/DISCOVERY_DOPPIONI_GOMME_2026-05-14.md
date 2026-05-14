# DISCOVERY DOPPIONI GOMME - 2026-05-14

> Audit quantitativo dei doppioni daFare gomme in `@manutenzioni` vs cambio gomme eseguito in `@gomme_eventi`.
> Generato dallo script `scripts/oneoff/discovery-doppioni-gomme-2026-05-14.cjs`.
> Lettura Firestore read-only. Zero scritture.
> Esecuzione: 2026-05-14T08:42:14.296Z

## 1. Numeri di sintesi

- `@manutenzioni` totali: **75**
- daFare/programmata totali: **10**
- daFare gomme (con keyword): **2**
  - di cui senza data di nascita ricostruibile (non valutabili per finestra): **0**
- `@gomme_eventi` totali: **11**
  - eventi senza targa riconoscibile: 0
  - eventi senza data riconoscibile: 0
- keyword gomme usate: `gomma`, `gomme`, `pneumatici`, `pneumatico`, `ruota`, `ruote`, `gommista`

## 2. Match daFare gomme <-> @gomme_eventi

Distribuzione per finestra temporale (giorni tra nascita daFare e primo cambio gomme successivo sulla stessa targa):

| Finestra | Numero daFare con match | % sul totale daFare gomme |
|----------|-------------------------|---------------------------|
| 0-30 gg | 1 | 50.0% |
| 31-60 gg | 0 | 0.0% |
| 61-90 gg | 0 | 0.0% |
| 91-180 gg | 0 | 0.0% |
| >180 gg | 0 | 0.0% |
| Nessun match (orfani) | 1 | 50.0% |
| Non valutabili (daFare senza data) | 0 | 0.0% |

## 3. Casi di alta probabilita' chiusura ciclo (0-60 gg)

| id daFare | targa | descrizione | nascita daFare | id @gomme_eventi | data cambio | distanza gg |
|-----------|-------|-------------|----------------|------------------|-------------|-------------|
| `from-lavoro-a5ba1512-2961-40a9-9c00-a27b6559bef2` | TI298409 | Segnalazione: gomme - 4 gomme di trazione usurate, quasi finite. Da sostituire | 2026-05-08 (record) | `554348b3-f6ec-40e8-a861-6873af7cce56` | 2026-05-12 | 4 |

## 4. Casi di media probabilita' (61-180 gg)

_Nessun caso in finestra 61-180 gg._

## 5. Orfani senza match

daFare gomme che NON hanno alcun cambio gomme posteriore sulla stessa targa in `@gomme_eventi`.
Possibili interpretazioni:
- cambio gomme non ancora eseguito (legittimo, daFare valida);
- cambio gomme fatto ma NON registrato via app (intervento gommista esterno);
- daFare ridondante o gia' gestita altrove.

Inclusi anche i match >180 gg (distanza cosi' ampia da essere verosimilmente scollegata).

| id daFare | targa | descrizione | nascita daFare | origineTipo | match >180gg (id / gg) |
|-----------|-------|-------------|----------------|-------------|------------------------|
| `from-lavoro-daade4a2-c681-46d0-99d4-1906d151116d` | TI280132 | Controllo KO: GOMME | 2026-04-01 (record) | controllo | - |

## 6. Conclusioni operative

- **Alta probabilita' (0-60 gg): 1 daFare.** Sono i candidati piu' forti per una riconciliazione una-tantum: ogni daFare ha un cambio gomme reale entro 60 giorni dalla sua nascita.
- **Media probabilita' (61-180 gg): 0 daFare.** Richiedono conferma manuale di Giuseppe: la distanza temporale rende il legame plausibile ma non certo.
- **Orfani (nessun match): 1 daFare** (+ 0 con match solo >180 gg). Richiedono decisione manuale: chiudere senza match, lasciare aperti come reminder, o indagare interventi gommista esterni non registrati.

**Finestra temporale suggerita per il matching futuro (live):** da decidere sulla base della distribuzione qui sopra. 
Se la massa dei match e' concentrata in 0-30 / 0-60 gg, una finestra di 60 giorni cattura la maggior parte dei cicli reali con basso rischio di falsi positivi.

> Nota: questo report fornisce SOLO numeri. La scelta della finestra e della strategia di fix (riconciliazione retroattiva via script vs solo fix live) e' demandata al prompt successivo.

## 7. Stato Firestore

Confermato invariato - lo script usa esclusivamente `.get()`:
- `@manutenzioni`: 75 record (sola lettura)
- `@gomme_eventi`: 11 record (sola lettura)
- `@cambi_gomme_autisti_tmp`: 12 record (sola lettura)
- `@segnalazioni_autisti_tmp`: 37 record (sola lettura)
- `@controlli_mezzo_autisti`: 350 record (sola lettura)
- Zero scritture eseguite (nessun set/update/delete/commit nel codice).
