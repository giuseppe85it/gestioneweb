# SPEC — Sistema permessi per-autista (gating moduli)

## Scopo
Rilascio graduale di moduli nuovi a tester selezionati. Un modulo "in prova" è visibile solo ai badge abilitati; i moduli "normali" restano visibili a tutti. Default di un modulo in prova: spento (nessun badge lo vede finché non abilitato).

## Decisioni (Giuseppe, non reinterpretare)
- Permessi per singolo autista, chiave = badge.
- Dati in documento separato storage/@permessi_autisti, NON dentro @colleghi.
- Gate solo lato HomeAutista (nasconde i bottoni). Nessun guard di route: URL diretto accettato.
- Solo i moduli marcati "in prova" sono nascosti; gli altri restano visibili a tutti.
- Accendere/spegnere un modulo in prova si fa dal pannello admin, senza cambi di codice.

## Dato — storage/@permessi_autisti
Documento singolo Firestore nella collection "storage", chiave @permessi_autisti, wrapper { value: ... } (stesso pattern di @colleghi).
Forma di value:
    moduliInProva: string[]                 elenco id moduli attualmente gated
    permessi: oggetto badge -> string[]     per ogni badge, id moduli in prova abilitati
Esempio di value:
    moduliInProva = ["cambio-mezzo"]
    permessi = { "530": ["cambio-mezzo"] }
Id moduli stabili (corrispondono ai bottoni esistenti in HomeAutista):
    rifornimento, segnalazioni, gomme, richiesta-attrezzature, cambio-mezzo
I moduli futuri aggiungono un nuovo id qui e un bottone gated in HomeAutista.

## Regola di visibilità (HomeAutista)
Per ogni bottone-modulo con id M e badge corrente B:
    visibile(M) = (M NON è in moduliInProva)  OPPURE  (permessi[B] include M)
Quindi: modulo non in prova = sempre visibile; modulo in prova = visibile solo se B è abilitato.

## Lettura runtime autista
HomeAutista legge storage/@permessi_autisti una volta al mount (getItemSync), ricava moduliInProva e permessi[badgeCorrente]. Il badge corrente è già in locale dopo il login. Documento assente o vuoto -> moduliInProva = [] -> tutti i moduli visibili (comportamento attuale invariato).

## Pannello admin (src/autistiInbox/AutistiAdmin.tsx, montato su /next/autisti-admin)
Nuova sezione "Permessi moduli autisti":
- per ogni modulo uno switch "in prova" (scrive moduliInProva)
- griglia badge (da @colleghi, solo colleghi con badge) per i moduli in prova, con checkbox (scrive permessi[badge])
- pulsante Salva -> scrive storage/@permessi_autisti via storageSync.setItemSync
- stile coerente con il resto di AutistiAdmin, nessuna libreria nuova

## Barriera (src/utils/cloneWriteBarrier.ts)
Aggiungere la chiave @permessi_autisti alla whitelist AUTISTI_ADMIN_INBOX_ALLOWED_STORAGE_KEYS (deroga path-only già esistente per /next/autisti-admin). Nessun nuovo meccanismo, solo una chiave in più.

## Fuori perimetro (NON toccare in implementazione)
@colleghi e Colleghi.tsx; writer/domain NEXT anagrafiche; LoginAutista (il gate non agisce al login); route /autisti/*; pdfEngine; storage rules (è un doc Firestore, non un file Storage).

## Default e retrocompatibilità
Documento assente -> tutti i moduli visibili come oggi. Accendere il sistema NON nasconde nulla finché non si marca un modulo "in prova".

## Verifica attesa (in fase implementativa, non ora)
npm run build verde; con moduliInProva vuoto HomeAutista identica a oggi; marcando un modulo in prova e abilitando un badge, quel modulo appare solo a quel badge.
