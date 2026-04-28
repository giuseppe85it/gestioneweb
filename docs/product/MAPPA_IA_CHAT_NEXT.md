# MAPPA IA CHAT NEXT - costituzione del rifacimento

Versione: 2026-04-28 (telaio aggiornato per tool use)
Stato: vincolante per il lavoro di rifacimento della chat IA NEXT.

---

## 1. Cosa voglio dalla chat IA NEXT

Una chat unica dove scrivo una targa, un nome, una domanda libera, e ottengo:

- dati precisi e strutturati come oggi mi danno Mezzo 360, Autista 360 e Centro Controllo
- incroci tra dati di qualunque area (mezzi, autisti, manutenzioni, materiali, fatture, libretti, cisterna, ecc.)
- report mensili o periodici, catalogati per targa o per autista, salvati in un archivio interno della chat
- riapertura dei report dall'archivio quando mi servono
- esportazione dei report come PDF, come faccio oggi nei moduli madre

La chat deve leggere i dati attraverso reader clone-safe e tool dichiarati. Non scrive dati business direttamente.

---

## 2. PARADIGMA ARCHITETTURALE

La chat IA NEXT usa il paradigma OpenAI function calling (tool use). L'utente scrive una domanda libera, OpenAI riceve la domanda + l'elenco dei tool disponibili (funzioni che leggono dati o producono output), decide quali tool chiamare e in che ordine, raccoglie i risultati, compone la risposta in italiano.

I tool sono: reader clone-safe per leggere dati, generatori PDF, generatori grafici, formatter di output strutturati.

I tool NON includono scritture business. La chat resta sola lettura.

Vantaggi:

- Domande naturali infinite senza prevedere ogni intent
- Catene di azioni automatiche (es: trova mezzo + scheda + PDF)
- Combinazione dati di settori diversi
- Aggiunta nuovi tool e nuove capabilities a costo basso

Limiti:

- Costo API OpenAI piu alto (5-20 cent per domanda complessa)
- Possibili scelte tool sbagliate da gestire con prompt di sistema
- Debug piu complesso del pattern router+runner

---

## 3. Una sola chat

Una sola interfaccia, una sola UI. Niente quattro surface come oggi. Accessibile da ovunque (Home, menu, link diretti) ma sempre la stessa pagina, lo stesso comportamento.

---

## 4. Come deve essere la UI

- Solo un campo libero dove scrivo.
- Niente bottoni di scorciatoia, niente menu a tendina, niente filtri precaricati. La chat deve restare una chat, non una console.
- Indicatore visivo "sto leggendo i dati..." durante l'attesa, perche le risposte saranno piu lente dei moduli madre.
- Risposte strutturate dove serve (card, tabelle, modali) e in linguaggio naturale dove serve.
- Report come modali strutturati, divisi e ordinati per la richiesta che ho fatto, esportabili come PDF.

---

## 5. Quando la chat non capisce

Quando OpenAI non capisce quali tool chiamare, o il risultato dei tool non basta per rispondere, la chat NON improvvisa, NON inventa dati e NON da elenchi generici di "cosa sa fare in totale".

La chat risponde restando dentro il contesto della richiesta. Se ho chiesto rifornimenti e non ha capito, mi dice cosa puo fare sui rifornimenti. Se ho chiesto manutenzioni e non ha capito, mi dice cosa puo fare sulle manutenzioni. Mai cose fuori contesto.

Questo comportamento va imposto nel prompt di sistema e verificato nei test browser.

---

## 6. Cosa NON deve avere

- niente storico conversazioni: la memoria e solo nella sessione corrente
- niente memoria persistente tra sessioni
- niente allegati in input (oggi)
- niente integrazione con Archivista: l'Archivista resta separato, intatto, perimetro chiuso
- niente scrittura business diretta dalla chat IA
- niente router prompt manuale: l'instradamento e gestito da OpenAI
- niente runner settoriali fissi: tutto si esprime come tool

Ogni richiesta di "scrittura" dalla chat passa SEMPRE attraverso i modali esistenti del gestionale (Dossier, Mezzi modal, Archivista, ecc.). La chat IA puo aprirli ma non sostituirli.

---

## 7. Cosa salva e dove

I report mensili e i report puntuali (per targa o per autista) si salvano nello stesso archivio dove vivono i miei dati. Si accumulano in un archivio della chat, consultabile dalla chat stessa: storico, riapertura, esportazione PDF.

L'archivio report resta Firestore + Storage come decisione vincolante gia presa. Questa persistenza riguarda report e output della chat, non scritture business sui dati gestionali.

---

## 8. Architettura ad alto livello

Flusso attivo del nuovo paradigma:

1. UI chat NEXT: l'utente scrive una domanda libera.
2. Backend OpenAI function calling: il backend invia a OpenAI domanda, prompt di sistema e lista tool disponibili.
3. Selezione tool: OpenAI decide quali tool chiamare e in che ordine.
4. Esecuzione tool: il backend esegue tool locali controllati (reader clone-safe, generatori PDF, generatori grafici, formatter).
5. Composizione risposta: OpenAI riceve i risultati dei tool e compone risposta italiana, card, tabelle o report.
6. UI chat: mostra la risposta strutturata, eventuali grafici, PDF/report e azioni di apertura modali esistenti.

Il codice non deve diventare un file unico monolitico. La divisione principale non e piu "settore con runner", ma "tool piccoli e dichiarati".

Cartelle previste nel paradigma tool use:

- `src/next/chat-ia/tools/` per i tool.
- `src/next/chat-ia/toolRegistry` o equivalente per registrazione tool.
- `src/next/chat-ia/components/` per rendering card, tabelle, grafici e report.
- `src/next/chat-ia/backend/` o adapter esistente per il ponte con OpenAI function calling.
- reader clone-safe esistenti nei domain NEXT o moduli dedicati.

Tool candidati:

- reader anagrafica flotta
- reader dossier mezzo
- reader documenti mezzo
- reader rifornimenti
- reader segnalazioni e controlli
- reader cisterna
- generatori PDF report
- generatori grafici semplici
- formatter tabelle/card
- tool apertura modali esistenti

---

## 9. Cosa resta intatto

- Madre completa: Mezzo 360, Autista 360, Centro Controllo continuano a vivere come oggi finche' la NEXT non diventa la nuova madre.
- Archivista NEXT: sistema separato, funziona, perimetro chiuso, non si tocca.
- Lavoro Mezzi modal NEXT (chiusura scrivente Mezzi).
- Lavoro Archivista libretto NEXT (persistenza campi libretto).
- Decisione sola lettura business della chat IA.
- Archivio report della chat.
- Nessuna memoria persistente tra sessioni.

---

## 10. Piano di migrazione

Il settore Mezzi attuale, basato su pattern router+runner, resta come rete di sicurezza durante la transizione. Non viene cancellato mentre i tool Mezzi sono in costruzione.

La sostituzione avviene solo quando i tool Mezzi coprono le funzioni gia operative e sono testati in browser. Dopo quella verifica, il settore Mezzi router+runner puo essere rimosso o archiviato.

Durante la migrazione:

- non si rompono le funzioni gia disponibili
- non si tocca Archivista
- non si abilita scrittura business dalla chat
- si aggiungono tool incrementali, verificabili uno per volta

---

## 11. Cosa si spegne

Quando la chat IA sara completa e affidabile, nella NEXT si possono spegnere e cancellare (o archiviare) i moduli di sola consultazione che la chat sostituisce davvero:

- Mezzo 360 NEXT
- Autista 360 NEXT
- Centro Controllo NEXT

La madre resta intatta finche la NEXT non sara stata promossa a nuova madre. Solo dopo si valutera se spegnere anche nella madre.

---

## 12. Decisioni prese

- 2026-04-27: confermato che la chat IA e la strada giusta, non un nuovo modulo unificato.
- 2026-04-27: il motore unificato non si cancella, ma viene limitato alle richieste trasversali.
- 2026-04-27: la card mezzo (Step Zero) e il primo test concreto. Funziona tecnicamente, ma il routing della chat e incasinato.
- 2026-04-27: invece di continuare a fixare per fix mirati, si fa rifacimento integrale della chat IA NEXT.
- 2026-04-27: telaio del rifacimento definito con Giuseppe in chat.
- 2026-04-27: i report restano salvati in un archivio della chat, accessibili dalla chat stessa, esportabili come PDF.
- 2026-04-27: una sola chat, una sola UI, niente bottoni / menu / scorciatoie. Solo campo libero.
- 2026-04-27: quando non capisce, la chat risponde restando nel contesto della richiesta.
- 2026-04-27: niente file monolitici.
- 2026-04-28: paradigma aggiornato a OpenAI function calling (tool use).
- 2026-04-28: il backend OpenAI deve essere esteso per supportare function calling.
- 2026-04-28: il costo API OpenAI e accettabile per uso quotidiano.
- 2026-04-28: il settore Mezzi attuale resta finche i tool Mezzi non lo sostituiscono.

---

## 13. Glossario minimo

- Tool use / function calling: paradigma in cui OpenAI sceglie funzioni dichiarate dal backend, le chiama e usa i risultati per rispondere.
- Tool: funzione piccola e controllata che legge dati o produce output. Non scrive dati business.
- Reader clone-safe: funzione di lettura che usa fonti NEXT controllate e non apre scritture business.
- Card / scheda strutturata: dati mostrati in tabella, riquadri o modale, non a parole.
- Generatore PDF: tool o helper che produce PDF da un report gia calcolato.
- Generatore grafico: tool o helper che produce dati visualizzabili come barre, linee o tabelle grafiche.
- Motore IA: backend OpenAI che riceve prompt, lista tool, risultati tool e compone risposta finale.
- Archivio chat: deposito interno alla chat dove i report generati restano salvati e riapribili.
- Madre / NEXT: madre = versione vecchia ancora viva e funzionante, NEXT = versione in costruzione che diventera la nuova madre.

---

## 14. Prossimi passi pianificati

1. Aggiornare l'ossatura backend OpenAI per function calling.
2. Fare audit dati NEXT e censimento tool candidati.
3. Scrivere SPEC architettura tool use: protocollo, modello OpenAI, prompt di sistema, schema tool, registry, error handling.
4. Implementare base tool use con primi tool Mezzi.
5. Migrare progressivamente le capability oggi coperte da router+runner verso tool dichiarati.
6. Verificare in browser ogni tool nuovo.

---

## 15. Roadmap tool use

Versione: 2026-04-28.

### Priorita 1 - Estensione backend OpenAI per function calling

Operazione obbligatoria di sblocco.

Durata stimata: 3-5 giorni.

Obiettivo: backend capace di inviare a OpenAI elenco tool, ricevere tool calls, eseguire tool locali, restituire risultati al modello e ricevere risposta finale.

### Priorita 2 - Audit dati NEXT e censimento tool candidati

Durata stimata: 1-2 giorni di lettura repo.

Output: lista tool con nome, descrizione, input, output, reader usati, rischi e stato dati.

### Priorita 3 - Spec architettura tool use

Durata stimata: 1-2 giorni.

Contenuto: protocollo, modello OpenAI, prompt di sistema, schema tool, registry tool, gestione errori, fallback, log, test browser.

### Priorita 4 - Implementazione base + primi 5-8 tool

Durata stimata: 1 settimana.

Obiettivo: setup chat che usa tool reali, primi tool per Mezzi e risposta strutturata.

Primi tool candidati:

- trova mezzo per targa
- leggi dossier mezzo
- lista documenti mezzo
- cerca segnalazioni/controlli mezzo
- calcola riepilogo rifornimenti mezzo
- genera card Mezzo
- genera report PDF mezzo
- apri Dossier Mezzo esistente

### Priorita 5 - Aggiunta tool incrementale

- Tool flotta (lista, ricerca, comparazioni)
- Tool autisti (scheda, ricerca per badge/nome)
- Tool rifornimenti aggregati (calcoli, medie, grafici)
- Tool documenti (lettura, download libretti)
- Tool segnalazioni/controlli (ricerca testuale)
- Tool report (generazione PDF on-demand)
- Tool apertura modali esistenti (es: apri Dossier Mezzo X)
- Tool grafici (recharts wrapper come tool)

### Priorita 6 - Funzioni trasversali

- Memoria di sessione (contesto follow-up)
- Suggerimenti proattivi (l'IA aggiunge note rilevanti)
- Multi-targa, comparazioni
- Esportazione CSV/Excel
- Voice input

### Stima tempi rivista

- Priorita 1+2+3: 1-2 settimane (sblocco architetturale)
- Priorita 4: 1 settimana (prima chat tool funzionante)
- Priorita 5: 1-2 settimane per gruppo di tool
- Totale per arrivare a uso quotidiano completo: 4-8 settimane

### Pattern di lavoro per ogni nuovo tool

1. Definizione tool (nome, descrizione, parametri input, shape output)
2. Implementazione tool (singolo file in `src/next/chat-ia/tools/`)
3. Registrazione nel tool registry
4. Test in browser

Niente piu spec settore + verifica + correzioni + implementazione per ogni capability. Un tool e una funzione singola con descrizione.

### Cosa NON sara nella chat (decisioni gia prese)

- Niente scrittura business diretta dalla chat IA.
- Niente nuovi modali per inserire/modificare dati.
- Niente integrazione Archivista.
- Niente memoria persistente tra sessioni.
- Niente foto/OCR in input (escluso da telaio).
- Niente router prompt manuale.
- Niente runner settoriali fissi come architettura attiva.

Ogni richiesta di "scrittura" dalla chat passa SEMPRE attraverso i modali esistenti del gestionale (Dossier, Mezzi modal, Archivista, ecc.). La chat IA puo aprirli ma non sostituirli.

---

## 16. DECISIONI ARCHITETTURALI 2026-04-28

- Paradigma: OpenAI function calling (tool use)
- Backend OpenAI: estendibile per function calling
- Costo API: accettabile per uso quotidiano
- Settore Mezzi attuale: resta finche tool Mezzi non sostituisce

FINE CONTENUTO DEL FILE.
