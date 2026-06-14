# SPEC - Sistema permessi per-autista (gating moduli)

## Scopo
Gestire la visibilita dei bottoni modulo nella Home Autista per singolo badge.
I 5 moduli esistenti nascono attivi per tutti; ogni modulo futuro nasce disattivato
per tutti finche l'admin non lo attiva esplicitamente per badge.

## Decisioni (Giuseppe, non reinterpretare)
- Permessi per singolo autista, chiave = badge trattato sempre come stringa.
- Dati in documento separato `storage/@permessi_autisti`, NON dentro `@colleghi`.
- Gate solo lato `HomeAutista` (nasconde i bottoni). Nessun guard di route: URL diretto accettato.
- Le forzature admin per badge+modulo vincono sul default del modulo.
- Non esiste piu il concetto di `moduliInProva`.

## Dato - storage/@permessi_autisti
Documento singolo Firestore nella collection `storage`, chiave `@permessi_autisti`,
wrapper `{ value: ... }` (stesso pattern di `@colleghi`).

Forma di `value`:
```ts
{
  permessi: {
    [badge: string]: {
      [moduleId: string]: boolean
    }
  }
}
```

Significato:
- `permessi[badge][moduleId] = true` forza il modulo attivo per quel badge.
- `permessi[badge][moduleId] = false` forza il modulo disattivato per quel badge.
- Se manca la voce per `(badge, moduleId)`, si usa il default del modulo.

La vecchia forma `{ moduliInProva, permessi: string[] }` e trattata come assente/non
valida dal lettore: non rompe il runtime e ricade sui default.

## Elenco moduli e default
I moduli stabili corrispondono ai bottoni esistenti in `HomeAutista`.

```ts
[
  { id: "rifornimento", label: "Rifornimento", defaultOn: true },
  { id: "segnalazioni", label: "Segnalazioni", defaultOn: true },
  { id: "gomme", label: "Gomme", defaultOn: true },
  { id: "richiesta-attrezzature", label: "Richiesta attrezzature", defaultOn: true },
  { id: "cambio-mezzo", label: "Cambio mezzo", defaultOn: true },
]
```

Regola permanente: qualunque modulo futuro non incluso tra i moduli `defaultOn: true`
deve nascere disattivato per tutti (`defaultOn: false`) e va acceso a mano per badge.

## Regola di visibilita (HomeAutista)
Per ogni bottone-modulo con id `M` e badge corrente `B`:

```ts
visibile(M, B) =
  permessi[String(B)] ha una voce booleana per M
    ? permessi[String(B)][M]
    : defaultOn(M)
```

Documento assente, badge assente o modulo assente -> default del modulo. Per i 5 moduli
di oggi il default e `true`, quindi restano visibili come prima.

## Lettura runtime autista
`HomeAutista` legge `storage/@permessi_autisti` una volta al mount (`getItemSync`) e
normalizza solo la forma nuova `{ permessi: { badge: { modulo: boolean } } }`.
Record vecchi o malformati vengono ignorati senza errore.

## Pannello admin (src/autistiInbox/AutistiAdmin.tsx, montato su /next/autisti-admin)
Il bottone "Permessi moduli autisti" apre un modale con tabellone:
- righe = colleghi con badge da `@colleghi`;
- colonne = moduli dell'elenco sopra;
- ogni cella mostra lo stato calcolato: `Attivo` verde oppure `Disattivato` rosso;
- click sulla cella inverte lo stato e scrive una forzatura esplicita per quel badge+modulo;
- in cima a ogni colonna ci sono i comandi `Attiva` e `Disattiva` per impostare tutta la colonna;
- pulsante Salva -> scrive `storage/@permessi_autisti` via `storageSync.setItemSync`
  nella forma `{ permessi }`.

Non ci sono piu switch "in prova" ne diciture "OK per tutti".

## Esempi
Documento assente:
```ts
undefined
```
Risultato: i 5 moduli esistenti sono visibili per tutti.

Disattivare `gomme` per badge `530`:
```ts
{
  permessi: {
    "530": {
      "gomme": false
    }
  }
}
```

Attivare un modulo futuro `nuovo-modulo` per badge `530`:
```ts
{
  permessi: {
    "530": {
      "nuovo-modulo": true
    }
  }
}
```

## Barriera (src/utils/cloneWriteBarrier.ts)
La chiave `@permessi_autisti` resta nella whitelist `AUTISTI_ADMIN_INBOX_ALLOWED_STORAGE_KEYS`
(deroga path-only gia esistente per `/next/autisti-admin`). Nessun nuovo meccanismo.

## Fuori perimetro
`@colleghi` e `Colleghi.tsx`; writer/domain NEXT anagrafiche; `LoginAutista`; route
`/autisti/*`; `pdfEngine`; storage rules.

## Verifica attesa
`npm run build` verde. Con documento assente o vecchia forma salvata, `HomeAutista`
mostra ancora i 5 moduli correnti. Salvando dal pannello admin, Firestore riceve
`value = { permessi: { [badge]: { [moduleId]: boolean } } }`.
