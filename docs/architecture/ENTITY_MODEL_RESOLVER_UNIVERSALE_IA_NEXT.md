# ENTITY MODEL E RESOLVER UNIVERSALE IA NEXT

## 1. Scopo
Questo documento definisce il modello entita iniziale e il comportamento del resolver universale usato dal gateway `/next/ia/interna`.

Il resolver non e targa-centrico per obiettivo finale, ma oggi usa le entita forti gia dimostrate nel clone/NEXT e le estende in modo prudente verso documenti, procurement, magazzino, cisterna e moduli tecnici.

Dal `2026-03-26` la risoluzione non usa piu solo il prompt puro:
- il contesto include anche nome file, tipo allegato e testo allegato quando disponibile;
- questo permette al resolver di leggere prompt liberi e file nello stesso passaggio logico.

## 2. Modello entita canonico iniziale
| Entity kind | Alias principali | Lookup key canoniche | Sorgente forte attuale | Note |
| --- | --- | --- | --- | --- |
| `targa` | targa, mezzo | `targa`, `mezzoId` | catalogo mezzi clone-safe | chiave forte principale del dossier |
| `autista` | autista, driver | `badge`, `autistaId`, `nomeCompleto` | catalogo autisti clone-safe | matching badge-first |
| `fornitore` | fornitore, ragione sociale | `id`, `nome`, `codice` | catalogo fornitori clone-safe | utile per procurement e preventivi |
| `ordine` | ordine, arrivo | `ordineId`, `numeroOrdine` | snapshot procurement | copertura clone-safe con handoff e prefill canonico |
| `materiale` | materiale, articolo, ricambio | `codiceMateriale`, `descrizione` | snapshot D05 | utile per magazzino e movimenti |
| `documento` | documento, pdf, libretto, preventivo, fattura | `documentId`, `storagePath`, `targa` | routing documentale + D07/D08 | entita guida per allegati |
| `cisterna` | cisterna, scheda test | `targa`, `documentId` | verticale D09 | verticale specialistico gia fuso nel planner universale |
| `dossier` | dossier, quadro completo | `targa`, `mezzoId` | D01 + D10 | aggregatore mezzo-centrico |
| `evento_operativo` | alert, segnalazione, scadenza, controllo | `eventId`, `targa`, `badge` | D10 + autisti | usata per domande operative |
| `modulo` | modulo, area, flusso, route | `moduleId`, `path` | registry tecnico | usata per action intent e repo understanding |

## 3. Ordine reale di risoluzione
1. `targa / mezzo`
   - pattern targa nel prompt
   - conferma sul catalogo mezzi del clone
   - fallback prudente se il pattern non trova ancora conferma
2. `badge / autista / collega`
   - badge esplicito
   - nome dopo parole chiave `autista`, `driver`, `collega`
   - matching exact o candidate sul catalogo autisti
3. `fornitore`
   - nome dopo parole chiave `fornitore` o `ragione sociale`
   - matching exact o candidate sul catalogo fornitori
4. `entita deboli o contestuali`
   - documento, materiale, cisterna, dossier, evento operativo, modulo
   - risolte per parole chiave e poi usate dal request resolver
5. `contesto allegati`
   - nome file, tipo allegato e testo OCR/testuale disponibile vengono fusi nel corpus di risoluzione
   - serve a evitare che un upload `preventivo`, `libretto` o `scheda test` resti invisibile al resolver

## 4. Stati di risoluzione e fiducia
- `exact`
  - entita confermata dal catalogo forte
- `candidate`
  - entita probabile ma non univoca
- `heuristic`
  - entita dedotta dal testo o dal pattern, da trattare con prudenza

Livelli di fiducia:
- `alta`
  - match catalogo forte senza collisioni
- `media`
  - match candidato ragionevole ma non definitivo
- `prudente`
  - deduzione utile per non perdere contesto, ma non sufficiente a saturare il dominio

## 5. Regole di disambiguazione
1. Il resolver non forza un dominio forte solo per abitudine storica.
2. Se una targa e presente, il sistema non ignora automaticamente autista, fornitore o documento se il testo li richiede.
3. Se il testo dice esplicitamente `fornitore`, quel vincolo resta forte anche in presenza di un file ambiguo.
4. Se l'entita forte non e confermata, il sistema conserva il match prudente e lascia visibile il limite.
5. Le omonimie autista e i badge mancanti non vengono nascosti: restano nel livello di fiducia.
6. Se il file porta un segnale forte e il prompt porta un vincolo forte diverso, il sistema conserva entrambi e lascia la decisione finale al request resolver.

## 6. Collegamento con request resolver e document router
Il resolver entita non risponde da solo. Fornisce al sistema universale:
- entita rilevate;
- grado di fiducia;
- chiave di lookup usata;
- sorgente di conferma.

Il request resolver usa poi questo output per scegliere adapter, capability e action intent.
Il document router usa testo e allegati per evitare di buttare un file nel modulo sbagliato.

Da ora il composer e l'handoff standard ricevono anche:
- entita candidate per la inbox documentale universale;
- entityRef canonica per il payload `iaHandoff`;
- campi mancanti o da verificare quando la risoluzione non e ancora forte.

## 7. Estensioni obbligatorie future
Il modello dovra estendersi almeno a:
- impianto;
- collega non autista con ruolo gestionale;
- documento procurement con payload standard;
- dossier non mezzo-centrico;
- eventi operativi multi-modulo;
- nuove entita dei moduli futuri registrate via contract standard.
