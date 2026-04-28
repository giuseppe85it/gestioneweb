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

FINE CONTENUTO DEL FILE.
