# CONTINUITY REPORT - Stabilita console e hot reload IA interna

## Contesto generale
- Il clone NEXT resta in fase `read-only` fedele alla madre con innesti controllati sopra `/next/*`.
- Il sottosistema `/next/ia/interna*` non ha ricevuto modifiche a facade, domain o backend in questo task.

## Modulo/area su cui si stava lavorando
- stabilita console/hot reload del perimetro IA interna
- verifica warning React e caricamento dev server

## Stato attuale
- `src/next/NextInternalAiPage.tsx` risulta stabile nello stato corrente del repo:
  - nessun syntax error persistente rilevato;
  - `eslint` passa sul file;
  - la build generale passa.
- Il warning React sulle `key` e stato ricondotto alla `Home` madre, non al subtree IA.
- In `src/pages/Home.tsx` le liste sospette usano ora chiavi stabili anche quando la stessa targa si ripete.

## Legacy o Next
- NEXT + MADRE MINIMALE

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- shell UI del sottosistema IA
- chat locale controllata
- ricerca guidata targhe
- memoria locale del modulo
- preview report mezzo read-only
- preview analisi economica read-only
- home/preview IA ripulite a livello UX

## Prossimo step di migrazione
- Tenere separati i prossimi task tra stabilita tecnica, UI e copertura dati dei report.

## Moduli impattati
- `src/pages/Home.tsx`

## Contratti dati coinvolti
- nessuno nuovo
- nessuna lettura/scrittura business modificata

## Ultime modifiche eseguite
- Verificato che il `500 / failed to reload` su `NextInternalAiPage.tsx` non e persistente.
- Corretta la root cause concreta del warning `key` in `Home`.
- Allineata la documentazione operativa IA/NEXT al risultato dell'audit tecnico.

## File coinvolti
- `src/pages/Home.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- Non applicare patch cosmetiche a `NextInternalAiPage.tsx` in assenza di un errore riproducibile.
- Correggere la madre solo nel punto minimo necessario, perche il warning citava davvero `Home`.
- Lasciare fuori dal task qualsiasi pulizia legacy non direttamente collegata a questo warning/fix.

## Vincoli da non rompere
- nessuna scrittura business
- nessun riuso runtime IA legacy
- testi visibili in italiano
- nessun cambiamento ai flussi correnti

## Parti da verificare
- Verifica manuale browser che la console non mostri piu il warning `key` nel rendering della `Home`.
- Se il dev server dovesse mostrare di nuovo un `500` su `NextInternalAiPage.tsx`, raccogliere stack trace e contenuto esatto prima di patchare.

## Rischi aperti
- `src/pages/Home.tsx` contiene altri problemi legacy preesistenti non collegati a questo task.
- Questo task non dimostra l'assenza assoluta di warning React altrove nel repo; chiude solo il punto concreto individuato.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Mantenere i prossimi task IA separati tra UI, runtime e copertura dati, senza riaprire la madre salvo cause dimostrate.

## Cosa NON fare nel prossimo task
- Non estendere la patch a refactor generali della `Home`.
- Non usare il warning chiuso qui come pretesto per toccare facade/domain del sottosistema IA.

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
