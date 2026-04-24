# STATO ATTUALE DEL PROGETTO

Ultimo aggiornamento: 2026-04-23
Fonte: `docs/audit/AUDIT_GAP_NEXT_VS_MADRE_2026-04-22.md`

---

## 1. Verdetto corrente

> **NEXT NON pronta a sostituire la madre.**

La NEXT copre ~34 dei 36 moduli madre (incluse versioni read-only), ma 5 moduli scriventi (aggiornamento 2026-04-23: chiusi Materiali da ordinare + Acquisti alias) sono privi di write-authorization nel `cloneWriteBarrier` o non hanno ancora parity scrivente effettiva, 2 pagine madre non sono state portate nella NEXT per decisione strategica registrata (`Mezzo360`, `Autista360`), l'autenticazione è basata su `signInAnonymously()` (nessun claim di ruolo reale) e `storage.rules` è deny-all — incompatibile con i path Storage già usati dal codice NEXT.

Finché questi bloccanti restano aperti, la NEXT non può sostituire la madre in produzione senza rompere flussi operativi critici (gestione ordini, anagrafiche, flotta, cisterna) e senza esporre scritture business a utenti anonimi non autenticati.

---

## 2. Numeri chiave

Fonte: §7 dell'audit.

| Indicatore | Valore |
|---|---|
| Moduli madre coperti in NEXT (inclusi read-only) | ~34 su 36 |
| Moduli NEXT con write authorization attiva nel barrier | 10 |
| Moduli NEXT read-only dove la madre scrive | **5** (aggiornamento 2026-04-23: chiusi Materiali da ordinare + Acquisti alias) |
| Pagine madre non portate nella NEXT | **2** |
| Bloccanti infrastrutturali | **2** (auth + storage.rules) |
| Moduli con verifiche browser "DA VERIFICARE" | **10+** |

---

## 3. Fase attuale

Il progetto è in **fase di promozione progressiva modulo per modulo**: i moduli con write authorization attiva (`Lavori`, `Manutenzioni`, `Magazzino`, `MaterialiDaOrdinare`, `Euromecc`, `Dossier`, `IA Libretto`, `IA Documenti`, `IA Archivista`) sono funzionalmente avanzati. `MaterialiDaOrdinare` è il primo modulo NEXT verificato scrivente in produzione (2026-04-23: salvaOrdine, foto fabbisogno, dettaglio ordine, eliminazione).

I moduli read-only (`Colleghi`, `Fornitori`, `Mezzi`, `Ordini`, `AttrezzatureCantieri`, `Cisterna`) replicano la superficie visiva della madre ma non permettono creazione, modifica o eliminazione di dati — bloccando la sostituzione operativa. `Acquisti` è un alias URL di `MaterialiDaOrdinare` (Navigate replace, nessuna logica propria) e da 2026-04-23 eredita tutti i writer attivi.

---

## 4. Bloccanti aperti

### 4a. Gap scriventi (5 moduli — aggiornamento 2026-04-23: chiusi Materiali da ordinare + Acquisti alias)

| Priorità | Modulo | Gap |
|---|---|---|
| 🔴 ALTA | Mezzi | Nessuna write su `@mezzi_aziendali` |
| 🔴 ALTA | Colleghi | Nessuna write su registro colleghi |
| 🔴 ALTA | Fornitori | Nessuna write su registro fornitori |
| 🟠 MEDIA | AttrezzatureCantieri | Nessuna write su `@attrezzature_cantieri` |
| 🟠 MEDIA | Cisterna | Nessun `setDoc`/`updateDoc` documenti cisterna |

**Chiusi il 2026-04-23**: `MaterialiDaOrdinare` (scrivente verificato in browser) + `Acquisti` (alias URL — scrivente per ereditarietà).

### 4b. Pagine non portate nella NEXT (2)

- `Mezzo360` — nessuna route NEXT, nessun componente equivalente. Escluso dal perimetro NEXT per scelta strategica (Giuseppe, 2026-04-23). Candidato a sostituzione con capability IA + chat unificata. Scelta attiva ma non definitiva, da rivalutare. Non va trattato come gap tecnico di migrazione ma come obsolescenza pianificata in valutazione. Riferimento: `docs/DIARIO_DECISIONI.md`
- `Autista360` — `NextDriverExperiencePage` è un placeholder non routed. Escluso dal perimetro NEXT per scelta strategica (Giuseppe, 2026-04-23). Candidato a sostituzione con capability IA + chat unificata. Scelta attiva ma non definitiva, da rivalutare. Non va trattato come gap tecnico di migrazione ma come obsolescenza pianificata in valutazione. Riferimento: `docs/DIARIO_DECISIONI.md`

### 4c. Bloccanti infrastrutturali (2)

- **Auth**: solo `signInAnonymously()`, nessun claim di ruolo reale; `NextRoleGuard` è frontend-only
- **storage.rules**: deny-all incompatibile con i path già scritti dal codice NEXT

---

## 5. Dove leggere il dettaglio

Il dettaglio completo con evidenze codice, tabella moduli, roadmap 13 step e lista DA VERIFICARE è in:

`docs/audit/AUDIT_GAP_NEXT_VS_MADRE_2026-04-22.md`

---

## 6. Decisioni strategiche registrate

Le scelte di perimetro e prodotto non sono tracciate in questo file. La fonte unica delle decisioni strategiche e `docs/DIARIO_DECISIONI.md`, che e un registro temporale: ogni decisione ha una data e non viene corretta retroattivamente.

Decisioni attive che impattano lo stato di questo documento (al 2026-04-23):
- Dettaglio Ordine inglobato in Materiali da ordinare
- Mezzo360 e Autista360 esclusi dal perimetro NEXT in favore di capability IA+chat (in valutazione)
- Materiali da ordinare NEXT chiuso scrivente 2026-04-23 (primo modulo NEXT davvero scrivente in produzione)
- Acquisti NEXT confermato alias URL di Materiali da ordinare 2026-04-23 — scrivente per ereditarietà

Per eventuali cambi o nuove decisioni, aggiornare sempre prima `docs/DIARIO_DECISIONI.md`.

---

## 7. Cronistoria aggiornamenti

| Data | Evento |
|---|---|
| 2026-04-23 | Riscrittura integrale da audit `AUDIT_GAP_NEXT_VS_MADRE_2026-04-22.md`. |
| 2026-04-23 | Patch fine giornata. Materiali da ordinare NEXT chiuso scrivente. Acquisti NEXT confermato alias URL. Gap scriventi 7 → 5. |
