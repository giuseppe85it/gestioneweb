# MATRICE ESECUTIVA NEXT

## Avvertenza critica 2026-03-30
- Questa matrice, nelle sue parti che dichiarano il backlog target chiuso, e superata dall'audit finale `docs/audit/AUDIT_VERIFICA_FINALE_NEXT_AUTONOMA.md`.
- Stato verificato nel repo alla data `2026-03-30`:
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`
  - il report 39 non e confermato dal codice reale su piu moduli
  - le route ufficiali del perimetro target non sono tutte indipendenti dal runtime madre

Versione: 2026-03-29
Stato: CURRENT
Scopo: fissare la nuova base esecutiva della NEXT dopo la sospensione della strategia precedente.

## Nota di continuita
- La strategia NEXT precedente basata su shell autonoma, import dominio-centrica progressiva e divieto di clone UX legacy e sospesa.
- Le snapshot della strategia precedente restano archiviate in `docs/_archive/2026-03-10-next-strategia-pre-clone/`.
- Da questo momento la priorita operativa della NEXT e costruire in `src/next/*` un clone fedele `read-only` della madre, senza toccare la madre.

## Regole operative globali
- Madre intoccabile: resta il gestionale operativo principale.
- NEXT = clone fedele della madre come UX, ordine dei blocchi, navigazione pratica, linguaggio operativo e flussi visibili.
- Clone solo `read-only`: nessuna creazione, modifica, delete, upload, import o side effect sui dati reali.
- Il clone deve leggere gli stessi dati reali della madre, senza inventare dataset o placeholder quando il dato esiste gia.
- In caso di dubbio tra fedelta UX e rischio scrittura, prevale sempre il blocco della scrittura.
- Niente redesign, niente reinterpretazione creativa, niente nuova shell concettuale.
- Layer puliti, IA e tracking restano obiettivi successivi: si innestano sopra il clone, non lo sostituiscono.

## Fasi ufficiali
1. Archiviare la NEXT attuale e le snapshot documentali della strategia superata, mantenendo tracciabilita.
2. Ricreare `src/next/*` come clone `read-only` fedele delle schermate madre prioritarie.
3. Neutralizzare tutte le scritture nel clone, con prevalenza del blocco su qualunque dubbio operativo.
4. Verificare che il clone legga gli stessi dati reali letti dalla madre.
5. Solo dopo il clone stabile: sostituire progressivamente i punti critici con layer puliti dedicati, senza alterare la UX clone.
6. Solo dopo: innestare IA e tracking sopra il clone `read-only`.

## Perimetro prioritario del clone

| Area madre | Target NEXT | Priorita | Stato atteso | Note |
| --- | --- | --- | --- | --- |
| `Home` / Centro di Controllo | Clone `read-only` fedele | 1 | Da costruire | Stessa chiarezza operativa del madre; nessuna reinterpretazione cockpit |
| `GestioneOperativa` | Clone `read-only` fedele | 1 | Da costruire | Stessi blocchi principali, stesse CTA, nessuna scrittura |
| `Mezzi` | Clone `read-only` fedele | 1 | Da costruire | Stessa esperienza di elenco/filtri/ingresso dossier, con azioni bloccate |
| `DossierMezzo` | Clone `read-only` fedele | 1 | Da costruire | Stesso ordine sezioni e stessa copertura funzionale visibile del madre |
| Moduli madre secondari collegati al Dossier | Clonazione progressiva | 2 | Da decidere dopo priorita 1 | Documenti, costi, PDF, analisi e altri blocchi vengono dopo il nucleo principale |
| Area Autisti | Fuori dal clone admin | Separata | Rimane legacy separata | Nessuna fusione nel backoffice NEXT |

## Task ammessi ora
- Archiviare la NEXT attuale senza perdita di recuperabilita.
- Archiviare le snapshot documentali della strategia precedente.
- Ricreare `/next/*` come clone fedele della madre.
- Disattivare o neutralizzare tutte le azioni di scrittura nel clone.
- Riutilizzare nel clone le letture reali gia usate dalla madre, purche la scrittura resti totalmente bloccata.
- Aggiungere guard-rail `read-only` espliciti lato clone per evitare scritture accidentali.

## Task vietati ora
- Proseguire con la shell NEXT reinterpretata attuale come base del progetto.
- Introdurre nuovi moduli NEXT dominio-centrici come strategia primaria prima del clone.
- Redesign o riordino creativo della UX madre.
- Aprire scritture NEXT business.
- Fondere l'area autisti nel clone admin.
- Sostituire la madre come runtime operativo principale.

## Stato documento
- Questa matrice sostituisce la precedente come base esecutiva `CURRENT`.
- Se un task NEXT non prepara, costruisce o consolida il clone `read-only` della madre, va rivalutato prima della patch.

## Aggiornamento operativo 2026-03-29
- Il principio esecutivo non cambia: madre intoccabile, NEXT solo perimetro di evoluzione e clone ancora `read-only`.
- Cambia pero lo stato reale del clone:
  - diverse route ufficiali NEXT non usano piu solo workbench o letture raw, ma montano la UI madre sopra bridge legacy-shaped puliti derivati dai domain NEXT;
  - il criterio operativo attivo diventa quindi `UI madre fuori + layer NEXT pulito sotto` ogni volta che il repo lo consente senza toccare la madre.

### Moduli oggi chiusi come `pari e puliti`
- `Home`
- `Centro di Controllo`
- `Mezzi`
- `Gestione Operativa`
- `Inventario`
- `Materiali consegnati`
- `Attrezzature cantieri`
- `Manutenzioni`
- `Ordini in attesa`
- `Ordini arrivati`
- `Dettaglio ordine`
- `Lavori da eseguire`
- `Lavori in attesa`
- `Lavori eseguiti`
- `Dettaglio lavoro`
- `Dossier Lista`
- `Dossier Mezzo`
- `Dossier Gomme`
- `Dossier Rifornimenti`
- `Analisi Economica`
- `Materiali da ordinare`
- `Colleghi`
- `Fornitori`
- `IA Home`
- `IA API Key`
- `IA Libretto`
- `IA Documenti`
- `IA Copertura Libretti`
- `Libretti Export`
- `Capo`
- `Acquisti / Preventivi / Listino`
- `Cisterna`
- `Cisterna IA`
- `Cisterna Schede Test`
- `Autisti / Inbox`

### Moduli ancora non chiusi nel perimetro target
- Nessuno nel perimetro target del clone/NEXT definito dai prompt 33-39.

### Regola esecutiva sui residui
- Il backlog operativo del clone fedele risulta chiuso sul perimetro target.
- Gli eventuali task successivi devono concentrarsi solo su hardening, pulizia di shared helper non critici, evoluzione dei layer NEXT e iniziative nuove sopra il clone gia chiuso.
- `SERVE FILE EXTRA` resta vincolante solo per futuri task che richiedano davvero file o contratti fuori whitelist.
