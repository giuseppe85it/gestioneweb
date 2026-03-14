# CONTINUITY REPORT - Riordino home/preview IA interna

## Contesto generale
- Il clone NEXT resta in fase `read-only` fedele alla madre con innesti controllati sopra `/next/*`.
- Il sottosistema `/next/ia/interna*` continua a crescere come modulo isolato, senza backend IA reale e senza scritture business.

## Modulo/area su cui si stava lavorando
- UI/UX della home IA interna
- preview report mezzo e analisi economica

## Stato attuale
- La home mostra ora solo gli ingressi principali: chat centrale, richiesta targa e accesso rapido secondario.
- Report mezzo e analisi economica si aprono in una preview overlay ampia e ordinata, separata dalla home.
- I dettagli tecnici del modulo restano accessibili ma sono stati spostati nell'area avanzata comprimibile.
- Le liste toccate nel subtree IA usano ora chiavi piu stabili per ridurre il warning React sui `key`.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- shell UI del sottosistema IA
- chat locale controllata
- ricerca guidata targhe
- memoria locale del modulo
- preview report mezzo read-only
- preview analisi economica read-only
- preview overlay dedicata separata dalla home

## Prossimo step di migrazione
- Valutare in task separato se mantenere un'unica preview overlay anche per future modalita `report autista` e `report combinato`, solo dopo decisione chiara sul loro perimetro dati.

## Moduli impattati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internal-ai.css`

## Contratti dati coinvolti
- nessuno nuovo
- letture dati esistenti del sottosistema IA interno restano invariate

## Ultime modifiche eseguite
- Rimossa la preview inline che appesantiva la home.
- Introdotto un pannello preview grande con header forte, selettore rapido e corpo ordinato.
- Compattata la colonna laterale e spostati disponibilita modalita, assorbimento legacy e guard rail nell'area avanzata.
- Rafforzato il contrasto visivo del modulo e corretti i `key` deboli nelle liste toccate.

## File coinvolti
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internal-ai.css`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- Nessuna modifica a facade, domain o backend in questo task.
- L'errore Vite segnalato non e riproducibile nello stato attuale del repo: la build e pulita.
- Il warning React sui `key` e stato corretto nel perimetro toccato.
- La preview deve restare separata dalla home per evitare nuova confusione visiva.

## Vincoli da non rompere
- nessuna scrittura business
- nessun riuso runtime IA legacy
- testi visibili in italiano
- perimetro clone/NEXT isolato e in sola lettura

## Parti da verificare
- Verifica manuale browser della nuova overlay su viewport piccole, soprattutto nella combinazione chat lunga + preview aperta.
- Verifica UX futura se verranno aggiunte nuove modalita report nello stesso contenitore.

## Rischi aperti
- Il task migliora molto la UX ma non modifica la copertura dati dei report.
- Una futura estensione della home puo reintrodurre caos se non mantiene la separazione tra ingresso e risultato.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Tenere distinti i prossimi task tra UI della preview, perimetro dati dei report e capability legacy da assorbire.

## Cosa NON fare nel prossimo task
- Non rimettere preview lunghe dentro la home.
- Non mescolare redesign UI con modifiche ai domain o ai writer business.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
