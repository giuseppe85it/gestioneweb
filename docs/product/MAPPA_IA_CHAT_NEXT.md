# MAPPA IA CHAT NEXT — costituzione del rifacimento

Versione: 2026-04-27 (telaio completo)
Stato: vincolante per il lavoro di rifacimento della chat IA NEXT.

---

## 1. Cosa voglio dalla chat IA NEXT

Una chat unica dove scrivo una targa, un nome, una domanda libera, e ottengo:

- dati precisi e strutturati come oggi mi danno Mezzo 360, Autista 360 e Centro Controllo
- incroci tra dati di qualunque settore (mezzi, autisti, manutenzioni, materiali, fatture, libretti, cisterna, ecc.)
- report mensili o periodici, catalogati per targa o per autista, salvati in un archivio interno della chat
- riapertura dei report dall'archivio quando mi servono
- esportazione dei report come PDF, come faccio oggi nei moduli madre

La chat deve leggere tutto Firestore e Storage e ricostruire qualsiasi dato io le chieda.

---

## 2. Una sola chat

Una sola interfaccia, una sola UI. Niente quattro surface come oggi. Accessibile da ovunque (Home, menu, link diretti) ma sempre la stessa pagina, lo stesso comportamento.

---

## 3. Come deve essere la UI

- Solo un campo libero dove scrivo.
- Niente bottoni di scorciatoia, niente menu a tendina, niente filtri precaricati. La chat deve restare una chat, non una console.
- Indicatore visivo "sto leggendo i dati..." durante l'attesa, perche le risposte saranno piu lente dei moduli madre (3-5 secondi vs istantaneo).
- Risposte strutturate dove serve (card, tabelle, modali) e in linguaggio naturale dove serve.
- Report come modali strutturati, divisi e ordinati per la richiesta che ho fatto, esportabili come PDF.

---

## 4. Quando la chat non capisce

Quando un prompt non rientra in nessuna capability nota, la chat NON improvvisa, NON inventa dati e NON da elenchi generici di "cosa sa fare in totale".

La chat risponde restando dentro il settore della mia richiesta. Se ho chiesto rifornimenti e non ha capito, mi dice cosa sa fare sui rifornimenti. Se ho chiesto manutenzioni e non ha capito, mi dice cosa sa fare sulle manutenzioni. Mai cose fuori contesto.

---

## 5. Cosa NON deve avere

- niente storico conversazioni: la memoria e solo nella sessione corrente
- niente allegati in input (oggi)
- niente integrazione con Archivista: l'Archivista resta separato, intatto, perimetro chiuso

---

## 6. Cosa salva e dove

I report mensili e i report puntuali (per targa o per autista) si salvano nello stesso archivio dove vivono i miei dati. Si accumulano in un archivio della chat, consultabile dalla chat stessa: storico, riapertura, esportazione PDF.

---

## 7. Architettura del codice

Il codice della chat IA NEXT non deve essere un file unico monolitico da migliaia di righe. Va diviso a settori, ognuno con cartella e file piccoli e indipendenti.

Settori previsti:

- Mezzi (lettura, incrocio, report mezzo)
- Autisti (lettura, incrocio, report autista)
- Manutenzioni e scadenze (cross-mezzo, cross-periodo)
- Materiali e magazzino (lettura, incrocio)
- Costi e fatture (lettura, incrocio)
- Documenti (libretti, allegati)
- Cisterna (lettura, incrocio)
- Motore IA (smistamento prompt + LLM)
- Motore report (generazione + archivio)

Quando in futuro un settore non bastera, se ne aggiunge uno nuovo, senza toccare gli altri.

---

## 8. Cosa resta intatto

- Madre completa: Mezzo 360, Autista 360, Centro Controllo continuano a vivere come oggi finche' la NEXT non diventa la nuova madre.
- Archivista NEXT: sistema separato, funziona, perimetro chiuso, non si tocca.
- Lavoro Mezzi modal NEXT (chiusura scrivente Mezzi).
- Lavoro Archivista libretto NEXT (persistenza campi libretto).

---

## 9. Cosa si spegne

Quando la chat IA sara completa e affidabile, nella NEXT si spengono e cancellano (o archiviano):

- Mezzo 360 NEXT
- Autista 360 NEXT
- Centro Controllo NEXT

La madre resta intatta finche la NEXT non sara stata promossa a nuova madre. Solo dopo si valutera se spegnere anche nella madre.

---

## 10. Decisioni prese

- 2026-04-27: confermato che la chat IA e la strada giusta, non un nuovo modulo unificato.
- 2026-04-27: il motore unificato non si cancella, ma viene limitato alle richieste trasversali.
- 2026-04-27: la card mezzo (Step Zero) e il primo test concreto. Funziona tecnicamente, ma il routing della chat e incasinato.
- 2026-04-27: invece di continuare a fixare per fix mirati, si fa rifacimento integrale della chat IA NEXT con audit profondo, spec a settori, verifica spec, implementazione modulare.
- 2026-04-27: telaio del rifacimento definito con Giuseppe in chat (questo file).
- 2026-04-27: i report restano salvati in un archivio della chat, accessibili dalla chat stessa, esportabili come PDF.
- 2026-04-27: una sola chat, una sola UI, niente bottoni / menu / scorciatoie. Solo campo libero.
- 2026-04-27: quando non capisce, la chat risponde restando nel settore della richiesta.
- 2026-04-27: codice diviso a settori, niente file monolitici.

---

## 11. Glossario minimo

- Card / scheda strutturata: dati mostrati in tabella, riquadri o modale, non a parole.
- Settore: ambito tematico (Mezzi, Autisti, ecc.) con cartella e file dedicati nel codice.
- Motore IA: pezzo del sistema che capisce la richiesta e decide a quale settore mandarla.
- Motore report: pezzo del sistema che genera report, li salva, li mostra, li esporta in PDF.
- OpenAI: il modello esterno che riformula in italiano naturale i dati gia letti dal sistema. Non legge mai i dati da solo.
- Archivio chat: deposito interno alla chat dove i report generati restano salvati e riapribili.
- Madre / NEXT: madre = versione vecchia ancora viva e funzionante, NEXT = versione in costruzione che diventera la nuova madre.

---

## 12. Prossimi passi pianificati

1. Audit profondo della chat IA NEXT esistente, mirato al telaio di questo file. Output in docs/audit/AUDIT_IA_CHAT_360_RIFACIMENTO_<data>.md.
2. Lettura tua + mia dell'audit. Decisioni di alto livello: cosa salvare, cosa buttare, cosa rifare.
3. Spec del rifacimento, divisa in piu file dentro docs/product/SPEC_IA_CHAT_RIFACIMENTO_NEXT/, uno per settore.
4. Verifica spec con Codex: ogni affermazione tecnica deve corrispondere al codice reale, divergenze = 0.
5. Implementazione settore per settore. Ogni settore una sessione, una checklist, una verifica. Niente big bang.

## 13. Roadmap dopo settore Mezzi v1

Versione: 2026-04-28.

### Priorita 1 - Completamento settore Mezzi (parita Mezzo 360)

1.1 Download libretti e PDF dalla chat (clic su documento -> scarica
    o anteprima).
1.2 Apertura modali esistenti su richiesta utente
    (es: "apri Mezzo X" -> Dossier Mezzo NEXT).
1.3 Fallback contestuale migliorato per prompt mezzo senza targa.

### Priorita 2 - Settore Flotta/Analisi (NUOVO)

2.1 Lista mezzi con filtri ("lista mezzi", "mezzi categoria cisterna",
    "mezzi revisione scaduta").
2.2 Calcoli rifornimenti ("rifornimenti aprile 2026",
    "rifornimenti cisterna Caravate vs distributori",
    "consumo medio TI282780 ultimi 6 mesi").
2.3 Ricerca pattern nello storico ("questa segnalazione e gia
    successa?", "quante volte rotto questo pezzo?").
2.4 Trend e statistiche ("costi manutenzione 2026",
    "mezzi piu problematici").

### Priorita 3 - Settore Autisti

3.1 Scheda autista (come Autista 360).
3.2 Lista e ricerca autisti.
3.3 Performance autisti (segnalazioni, consumi, ecc.).

### Priorita 4 - Settore Manutenzioni e Scadenze

4.1 Cruscotto scadenze (come Centro Controllo).
4.2 Pianificazione manutenzioni e carico officina.

### Priorita 5 - Settori secondari

5.1 Materiali e magazzino.
5.2 Costi e fatture.
5.3 Cisterna AdBlue.

### Priorita 6 - Funzioni trasversali aggiuntive

6.1 Memoria di sessione intelligente: la chat ricorda l'ultimo
    mezzo/autista citato nella sessione corrente, per follow-up
    naturali ("rifornimenti?" dopo "TI282780"). Niente persistenza
    tra sessioni.
6.2 Suggerimenti proattivi: la chat inserisce note tipo
    "questa segnalazione e gia successa 3 volte negli ultimi 6 mesi"
    nelle risposte mezzo/autista.
6.3 Multi-targa e comparazioni ("confronta TI282780 e TI313387").
6.4 Esportazione dati raw (CSV/Excel) oltre al PDF.
6.5 Voice input via Web Speech API per uso in officina.
6.6 Notifiche/alert proattivi (lavoro a lungo termine, complessita
    alta).

### Stima tempi

- Priorita 1: 1 settimana.
- Priorita 2: 2-3 settimane.
- Priorita 3: 1-2 settimane.
- Priorita 4: 1 settimana.
- Priorita 5: 1-2 settimane per settore.
- Priorita 6: distribuita lungo il percorso.

Totale realistico: 2-3 mesi di lavoro distribuito.

### Pattern di lavoro per ogni settore

Niente piu audit larghi. Ogni nuovo settore segue:

1. Spec settore (1 prompt Codex).
2. Verifica spec (1 prompt Codex, regola n.5 Giuseppe).
3. Eventuali correzioni (1 prompt se servono).
4. Implementazione settore con fasi (1 prompt Codex).

Totale tipico per settore: 3-5 prompt Codex.

### Cosa NON sara nella chat (decisioni gia prese)

- Niente scrittura business diretta dalla chat IA.
- Niente nuovi modali per inserire/modificare dati.
- Niente integrazione Archivista.
- Niente memoria persistente tra sessioni.
- Niente foto/OCR in input (escluso da telaio).

Ogni richiesta di "scrittura" dalla chat passa SEMPRE attraverso i
modali esistenti del gestionale (Dossier, Mezzi modal, Archivista,
ecc.). La chat IA puo aprirli ma non sostituirli.

FINE CONTENUTO DEL FILE.
