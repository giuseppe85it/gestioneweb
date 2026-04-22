# CHECK REALE `@rifornimenti.items`

## Scopo
- Verificare se il canonico reale dei rifornimenti, cioe `storage/@rifornimenti` con lista `items`, espone gia un nucleo dati leggibile dalla NEXT in modalita `read-only` minima.
- Fare il check senza modificare runtime, storage, backend o NEXT.

## Esito sintetico
- `ESISTE SOTTOINSIEME IMPORTABILE DA @rifornimenti.items`
- Il sottoinsieme esiste solo come contratto minimo di lettura.
- Non coincide ancora col target completo di `D04` definito in `DOMINI_DATI_CANONICI.md`.

## Limite della prova diretta sul dataset live
- Tentata una lettura read-only del documento Firestore `storage/@rifornimenti`.
- Esito: `Missing or insufficient permissions`.
- Conseguenza:
  - il repo prova come `@rifornimenti.items` viene popolato e come viene letto;
  - il repo NON permette di misurare da qui la percentuale reale dei record gia riallineati nel documento live.
- Dove non esiste prova diretta sul contenuto attuale di Firestore, il report usa `DA VERIFICARE`.

## 1. Come viene popolato oggi `@rifornimenti.items`

### Writer confermati
- `src/autisti/Rifornimento.tsx`
- `src/autistiInbox/AutistiAdmin.tsx`

### Regola di popolamento verificata
- Entrambi i writer costruiscono il canonico con una funzione `buildDossierItem(...)` molto simile.
- La proiezione scritta in `@rifornimenti` contiene sempre questi campi:
  - `id`
  - `mezzoTarga`
  - `data`
  - `litri`
  - `km`
  - `distributore`
  - `costo`
  - `note`

### Flusso reale verificato
1. Il record operativo nasce nel feed autisti/admin.
2. Il record completo viene scritto nel `tmp` (`@rifornimenti_autisti_tmp`).
3. Il canonico business viene poi riscritto come proiezione ridotta in `@rifornimenti`.

## 2. Shape e varianti reali viste dal codice

### Shape verso cui scrivono i writer correnti
- I writer correnti riscrivono il documento come root object con `items`.
- Quindi la shape target attivamente prodotta oggi e:
  - `storage/@rifornimenti = { ..., items: [...] }`

### Shape legacy ancora tollerate dai reader
I reader del gestionale attuale accettano ancora:
- `items`
- `value.items`
- `value`
- in alcuni casi anche array root

### Implicazione pratica
- Il repo dimostra che la scrittura corrente punta a `items`.
- Il repo NON dimostra da solo che il documento live non contenga ancora residui legacy o campi ibridi.

## 3. Affidabilita campo per campo in `@rifornimenti.items`

| Campo | Stato | Motivo concreto | Nota per la NEXT |
| --- | --- | --- | --- |
| `id` | affidabile | Generato o mantenuto da entrambi i writer e usato per upsert/deduplica | Puo essere usato come chiave record |
| `mezzoTarga` | affidabile | Sempre derivato da `targaCamion/targaMotrice/mezzoTarga`; i flussi create richiedono una targa mezzo valida | Puo essere usato come chiave mezzo del reader |
| `data` | affidabile | Entrambi i writer la scrivono sempre come stringa formattata UI | Usarla solo come label di data, non come `timestamp` canonico |
| `timestamp` | non affidabile | Non viene scritto nella proiezione canonica corrente; i reader lo cercano solo come fallback | Non va letto come campo canonico di `@rifornimenti.items` |
| `litri` | affidabile | E obbligatorio nei flussi create autista/admin ed entra direttamente nel canonico | Puo stare nel subset minimo read-only |
| `km` | parzialmente affidabile | Viene scritto nel canonico, ma reader legacy fanno merge col `tmp` quando manca o non e coerente | Non va usato come campo garantito del subset minimo |
| `costo` | parzialmente affidabile | Deriva da `importo`; in molti casi puo restare `null` perche non sempre viene valorizzato nel flusso operativo | Ammissibile solo come opzionale nullable |
| `distributore` | affidabile | Viene sempre derivato in stringa dal record origine (`tipo`, `paese`, `metodoPagamento`) | Puo stare nel subset minimo come label descrittiva |
| `note` | affidabile | I writer la salvano sempre come stringa, anche vuota | Puo stare nel subset minimo come campo opzionale display |
| `autistaNome` | non affidabile | Non fa parte della proiezione canonica scritta da `buildDossierItem(...)` | Va lasciato fuori dal reader NEXT minimale |
| `badgeAutista` | non affidabile | Non fa parte della proiezione canonica corrente | Va lasciato fuori |
| `source` | non affidabile | Non viene scritto oggi in `@rifornimenti.items` | Va lasciato fuori fino a riallineamento del contratto |
| `validation` | non affidabile | Non viene scritto oggi in `@rifornimenti.items` | Va lasciato fuori fino a riallineamento del contratto |

## 4. Cosa usa davvero oggi il gestionale quando legge il canonico

### Letture canoniche reali confermate
- `src/pages/RifornimentiEconomiaSection.tsx`
- `src/pages/CentroControllo.tsx`

### Comportamento reale dei reader legacy
- leggono `@rifornimenti`
- accettano shape legacy multiple
- cercano `mezzoTarga` ma tollerano anche alias targa legacy
- usano `data` e `timestamp` in fallback
- completano `km`, `autistaNome`, `badgeAutista` e in alcuni casi `costo` tramite merge col `tmp`

### Conseguenza
- Il fatto che il gestionale madre mostri bene i rifornimenti NON significa che `@rifornimenti.items` sia gia autosufficiente per tutti i campi.
- Significa invece che il canonico corrente contiene gia un nucleo utile, ma i reader legacy lo estendono con tolleranze non ammesse nella NEXT.

## 5. Minimo sottoinsieme read-only leggibile dalla NEXT

### Sottoinsieme minimo approvabile senza merge e senza fallback legacy
- `id`
- `mezzoTarga`
- `data`
- `litri`
- `distributore`
- `note`

### Campi leggibili solo come opzionali non garantiti
- `km`
- `costo`

### Campi da escludere nel primo reader NEXT
- `timestamp`
- `autistaNome`
- `badgeAutista`
- `source`
- `validation`

## 6. Condizioni e cautele per un futuro reader NEXT

Il futuro reader minimale su `@rifornimenti.items` puo esistere solo se:
- legge esclusivamente `storage/@rifornimenti`
- accetta solo `items` top-level
- non usa `value.items`
- non legge `@rifornimenti_autisti_tmp`
- non ricostruisce `km`
- non recupera `autistaNome` o `badgeAutista` da dataset esterni
- tratta `data` come label display e non come `timestamp` business
- tratta `km` e `costo` come campi opzionali nullable, non come prerequisiti del blocco

## 7. Cosa resta fuori
- parita completa con il gestionale madre attuale
- dati autista nel canonico
- `timestamp` numerico canonico
- metadati `source`
- metadati `validation`
- qualsiasi uso analitico serio basato su `km` o `costo` come campi sempre affidabili

## 8. Mini-step minimo consigliato prima del prossimo task
- Se il prossimo task vuole importare `D04` nella NEXT, deve dichiarare esplicitamente che entra solo il sottocontratto minimo:
  - `id`
  - `mezzoTarga`
  - `data`
  - `litri`
  - `distributore`
  - `note`
- `km` e `costo` possono entrare solo come opzionali, senza fallback.
- Tutto il resto resta fuori finche il runtime business non riallinea davvero `timestamp`, `source` e `validation`.

## Verdetto finale
- `ESISTE SOTTOINSIEME IMPORTABILE DA @rifornimenti.items`
- Il sottoinsieme importabile e minimale, descrittivo e read-only.
- Non autorizza ancora un blocco NEXT che pretenda parita col madre o analisi consumi complete.
