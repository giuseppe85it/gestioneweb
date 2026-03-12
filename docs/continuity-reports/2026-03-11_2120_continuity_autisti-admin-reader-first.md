# CONTINUITY REPORT - Autisti Admin reader-first

## Contesto generale
- La strategia attiva resta il clone fedele `read-only` della madre sotto `src/next/*`.
- La famiglia Autisti nel clone comprende gia inbox home + listati e l'app autisti quasi completa per tranche.

## Modulo/area su cui si stava lavorando
- `Autisti Admin`
- Route clone `/next/autisti-admin`
- Area `Operativita Globale`

## Stato attuale
- `Autisti Admin` e ora presente nel clone solo in modalita reader-first.
- La pagina mostra tabs, liste, filtri, foto e anteprime PDF, ma non espone rettifiche, delete, `crea lavoro` o writer reali.
- Gli ingressi clone da `Autisti Inbox` e dai quick link del `Centro di Controllo` restano nel subtree `/next`.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Route `/next/autisti-admin`
- Pagina dedicata `NextAutistiAdminPage`
- Consultazione di `sessioni attive`, `rifornimenti`, `segnalazioni`, `controlli`, `gomme`, `richieste attrezzature` e `storico cambio mezzo`
- Allineamento routing clone-safe da inbox e centro controllo

## Prossimo step di migrazione
- Se servira estendere il modulo, il passo corretto successivo non e aprire i writer ma valutare prima un merge reader tra dataset legacy e `@next_clone_autisti:*`

## Moduli impattati
- `src/next/NextAutistiAdminPage.tsx`
- `src/App.tsx`
- `src/next/NextAutistiInboxHomePage.tsx`
- `src/next/NextCentroControlloPage.tsx`
- metadata/access NEXT

## Contratti dati coinvolti
- Lettura read-only di `@autisti_sessione_attive`
- Lettura read-only di `@storico_eventi_operativi`
- Lettura read-only di `@mezzi_aziendali`
- Lettura read-only degli stream autisti via `loadHomeEvents`
- Nessun writer reale verso `@lavori`, `@rifornimenti_autisti_tmp`, `storage/@rifornimenti`, `@segnalazioni_autisti_tmp`, `@richieste_attrezzature_autisti_tmp`, `@controlli_mezzo_autisti`, `@gomme_eventi`

## Ultime modifiche eseguite
- Aggiunta la route clone `/next/autisti-admin`
- Creata la pagina reader-first dedicata
- Rimossi dal perimetro clone tutte le CTA che nel modulo madre scrivono o distruggono
- Riallineati ingressi clone-safe da inbox e quick link operativi
- Aggiornati `REGISTRO_MODIFICHE_CLONE.md` e `STATO_MIGRAZIONE_NEXT.md`

## File coinvolti
- `src/App.tsx`
- `src/next/NextAutistiAdminPage.tsx`
- `src/next/next-autisti-admin-reader.css`
- `src/next/NextAutistiInboxHomePage.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/nextData.ts`
- `src/next/nextAccess.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Decisioni gia prese
- `Autisti Admin` non va importato 1:1 come blocco unico.
- Prima viene la shell reader-first.
- Merge reader clone+legacy, rettifiche reali, `crea lavoro`, delete allegati e rifornimenti admin scriventi restano fuori.

## Vincoli da non rompere
- Nessuna modifica a `src/autisti/**`
- Nessuna uscita dal perimetro `/next`
- Nessuna falsa UX di rettifica riuscita
- Nessun allargamento ai flussi scriventi admin

## Parti da verificare
- Quando e se il clone admin dovra visualizzare anche i record `@next_clone_autisti:*`
- Se il modulo andra poi diviso in sottoblocchi reader/writer separati invece di estendere una sola pagina

## Rischi aperti
- La pagina resta volutamente incompleta lato funzionalita operative: mostra i dati ma non li puo correggere nel clone.
- Il dominio autisti conserva ancora il punto aperto sulla sorgente canonica eventi (`@storico_eventi_operativi` vs `autisti_eventi`).

## Punti da verificare collegati
- `Stream eventi autisti canonico definitivo`

## Prossimo passo consigliato
- Fermarsi sul reader-first appena aperto e pianificare un task separato solo se serve il merge reader clone+legacy

## Cosa NON fare nel prossimo task
- Non aprire rettifiche reali o writer distruttivi
- Non usare wrapper puro di `AutistiAdmin`
- Non toccare `src/autisti/**`

## Commit/hash rilevanti
- `NON ESEGUITO`

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
