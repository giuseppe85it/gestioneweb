# AUDIT TECNICO D04 - Rifornimenti e consumi per futura lettura NEXT read-only

## Scopo
- Fotografare il flusso reale dei rifornimenti senza modificare runtime, storage o backend.
- Capire se oggi esiste un sottoinsieme dati davvero leggibile dalla NEXT senza usare tolleranze legacy.
- Preparare la decisione corretta per il prossimo step del dominio `D04`.

## Esito audit
- Esito secco: `NON ESISTE ANCORA SOTTOINSIEME IMPORTABILE`
- Motivo sintetico: il gestionale madre visualizza bene i rifornimenti grazie a letture tolleranti, fallback di shape e merge con il dataset `tmp`; la NEXT non puo replicare questo comportamento senza derogare al contratto canonico attuale.

## Perimetro verificato
- Documenti:
  - `docs/data/MAPPA_COMPLETA_DATI.md`
  - `docs/data/REGOLE_STRUTTURA_DATI.md`
  - `docs/data/DOMINI_DATI_CANONICI.md`
- Runtime letto:
  - `src/autisti/Rifornimento.tsx`
  - `src/autistiInbox/AutistiAdmin.tsx`
  - `src/pages/DossierMezzo.tsx`
  - `src/pages/RifornimentiEconomiaSection.tsx`
  - `src/utils/storageSync.ts`
  - `src/utils/homeEvents.ts`

## 1. Flusso reale oggi

### Origine del rifornimento
- Il rifornimento nasce quasi sempre nell'app autisti tramite `src/autisti/Rifornimento.tsx`.
- L'admin puo anche creare, correggere o cancellare il record da `src/autistiInbox/AutistiAdmin.tsx`.

### Sequenza di scrittura reale
1. L'app autisti costruisce un record operativo completo con dati di mezzo, autista, litri, km, importo, note e timestamp numerico.
2. Quel record viene scritto prima in `storage/@rifornimenti_autisti_tmp` tramite `setItemSync`.
3. Subito dopo viene costruita una proiezione ridotta per il dossier e salvata in `storage/@rifornimenti`.
4. L'admin ripete la stessa logica quando modifica o cancella un rifornimento: aggiorna il `tmp` e poi riallinea `@rifornimenti`.

### Come arriva oggi al Dossier
- `src/pages/DossierMezzo.tsx` non legge `@rifornimenti`.
- Il Dossier legacy legge direttamente `@rifornimenti_autisti_tmp`, filtra per `targaCamion` e mostra una vista semplificata.
- `src/pages/RifornimentiEconomiaSection.tsx` legge invece sia `@rifornimenti` sia `@rifornimenti_autisti_tmp`; usa il canonico come base ma recupera dati mancanti dal `tmp`, soprattutto il `km`.

## 2. Dataset reali e ruolo effettivo

| Dataset fisico | Writer reali | Ruolo reale oggi | Shape osservate nel runtime |
| --- | --- | --- | --- |
| `storage/@rifornimenti_autisti_tmp` | `Rifornimento.tsx`, `AutistiAdmin.tsx` via `setItemSync` | Intake operativo ad alta fedelta, origine dei record autisti | Fisicamente `storageSync` salva `{ value: [...] }`; i reader usano spesso il valore gia estratto da `getItemSync`, ma il runtime tollera anche `value` |
| `storage/@rifornimenti` | `Rifornimento.tsx`, `AutistiAdmin.tsx` via `setDoc` diretto | Proiezione dossier/business dei rifornimenti | `items`, legacy `value.items`, in alcuni reader anche fallback piu ampi |

### Ruolo effettivo dei due dataset
- `@rifornimenti_autisti_tmp` contiene il record operativo piu completo e vicino alla sorgente reale.
- `@rifornimenti` contiene una versione ridotta e trasformata, pensata per dossier/report ma non ancora uniforme abbastanza per la NEXT.

## 3. Shape reali e duplicazioni

### Shape operativa del `tmp`
Campi osservati con alta frequenza nella scrittura autisti/admin:
- `id`
- `autistaId`
- `autistaNome`
- `badgeAutista`
- `targaCamion`
- `targaRimorchio`
- `tipo`
- `metodoPagamento`
- `paese`
- `km`
- `litri`
- `importo`
- `note`
- `data`
- `timestamp` in alcuni flussi admin
- `flagVerifica`
- `confermatoAutista`

### Shape reale della proiezione `@rifornimenti`
La funzione `buildDossierItem(...)` oggi scrive nel dossier una proiezione con:
- `id`
- `mezzoTarga`
- `data` come stringa formattata UI, non `timestamp` numerico
- `litri`
- `km`
- `distributore`
- `costo`
- `note`

### Duplicazioni e divergenze reali
- Lo stesso rifornimento vive in due dataset con shape diverse.
- La proiezione dossier perde dati operativi presenti nel `tmp`, tra cui autore pieno del record, badge, metodo pagamento e stato operativo.
- La chiave mezzo e duplicata con naming diversi:
  - `targaCamion`
  - `targaMotrice`
  - `mezzoTarga`
  - fallback secondari `targa`
- Il campo temporale non e uniforme:
  - nel `tmp` prevale valore numerico (`data` o `timestamp`)
  - nel dossier prevale `data` come stringa gia formattata
- Il campo economico nasce come `importo` nel `tmp` e viene proiettato come `costo` nel dossier.

## 4. Campi oggi davvero piu stabili

### Campi abbastanza stabili nel `tmp`
- `id`
- `targaCamion`
- `autistaNome`
- `badgeAutista`
- `litri`
- `km`
- `importo`
- `tipo`
- `note`
- `data` numerico

### Campi abbastanza stabili nella proiezione `@rifornimenti`
- `id`
- `mezzoTarga`
- `data` stringa
- `litri`
- `costo`
- `distributore`
- `note`

### Campi NON ancora abbastanza stabili per una NEXT canonica
- `timestamp` numerico nel dataset business target `@rifornimenti.items`
- `source`
- `validation`
- `km` pienamente affidabile nel solo canonico, perche il runtime legacy lo recupera dal `tmp` quando manca

## 5. Perche il gestionale madre oggi funziona

Il gestionale madre funziona perche non richiede una sorgente unica e rigorosa.

### Tolleranze in uso oggi
- Il Dossier legacy legge direttamente il dataset `tmp`, quindi vede il record piu ricco appena salvato.
- La sezione economia legge due dataset contemporaneamente.
- I reader legacy accettano shape multiple:
  - array diretto
  - `items`
  - `value.items`
  - in alcuni casi `value`
- I reader legacy fanno fallback sul naming targa:
  - `mezzoTarga`
  - `targaCamion`
  - `targaMotrice`
- La sezione economia effettua un merge euristico con il `tmp` per recuperare `km` mancanti nel canonico.
- Anche altri moduli trasversali, come `homeEvents`, continuano a leggere `@rifornimenti_autisti_tmp`.

### Conseguenza pratica
- Il madre riesce a mostrare i rifornimenti perche tollera incoerenze e ricompone i record in lettura.
- La NEXT non puo fare la stessa cosa se vuole restare pulita, dominio-centrica e separata dalla legacy.

## 6. Sottoinsieme importabile per la NEXT

### Verdetto
- Non esiste ancora un sottoinsieme che permetta alla NEXT di leggere gli stessi rifornimenti visibili oggi nel madre senza usare trucchi legacy.

### Perche non esiste ancora
- La sorgente target documentata e `@rifornimenti.items`, ma il runtime reale non garantisce ancora li dentro:
  - `timestamp` numerico affidabile
  - `source`
  - `validation`
  - `km` sempre completo
- Il dato che oggi il madre mostra meglio arriva ancora in larga parte dal `tmp` o da merge tra `tmp` e canonico.
- Un reader NEXT che leggesse solo `@rifornimenti.items` dovrebbe:
  - accettare `data` stringa al posto di `timestamp`
  - rinunciare a `source` e `validation`
  - tollerare `km` incompleti
  - oppure introdurre fallback proibiti

### Sottoinsieme osservabile ma non approvato per la NEXT
Dal solo `@rifornimenti.items` si puo spesso leggere un nucleo ridotto:
- `id`
- `mezzoTarga`
- `data`
- `litri`
- `costo`
- `distributore`
- `note`

Questo pero non va considerato ancora un sottoinsieme importabile per la NEXT perche:
- non coincide col contratto target di `D04`
- non garantisce parita con quanto il madre mostra oggi
- spingerebbe la NEXT ad adottare una shape legacy provvisoria come se fosse canonica

## 7. Consigli pratici per importare gli stessi dati nella NEXT senza rompere il madre

### Cosa si puo fare subito
- Usare questo audit come riferimento per bloccare qualunque reader NEXT che provi a leggere sia `tmp` sia canonico.
- Tenere separati due obiettivi:
  - parita con il madre
  - purezza del reader NEXT
- Verificare fuori dalla NEXT il contenuto reale di `storage/@rifornimenti.items` su dati correnti per misurare quante righe hanno davvero `km`, `costo` e una chiave mezzo coerente.

### Cosa non va fatto
- Non leggere `@rifornimenti_autisti_tmp` dalla NEXT.
- Non usare fallback `value.items` o merge di shape multiple nella NEXT.
- Non ricostruire `km` reader-side cercando il record corrispondente nel `tmp`.
- Non promuovere automaticamente `data` stringa a `timestamp` canonico.
- Non trattare `importo` e `costo` come equivalenti senza uno step esplicito di normalizzazione.

### Mini-step minimo richiesto prima del prossimo tentativo NEXT
Serve uno di questi due passaggi, scelto in modo esplicito:

1. **Percorso preferito**
- Riallineare fuori dalla NEXT il dataset business `@rifornimenti.items` affinche esponga davvero il contratto target:
  - `mezzoTarga`
  - `timestamp`
  - `costo`
  - `source`
  - `validation`
  - `km` affidabile quando previsto

2. **Percorso transitorio documentato**
- Approvare formalmente un contratto provvisorio di sola lettura basato sulla shape reale corrente del canonico:
  - `id`
  - `mezzoTarga`
  - `data`
  - `litri`
  - `costo`
  - `distributore`
  - `note`
- Questo percorso richiede pero una deroga esplicita al target definito in `DOMINI_DATI_CANONICI.md`.

## Decisione operativa dopo l'audit
- Stato decisionale per la NEXT: `NON IMPORTARE D04`.
- Documento di riferimento per il prossimo step: `docs/data/AUDIT_RIFORNIMENTI_NEXT_READONLY.md`.
- Condizione minima per riaprire il tema: scelta esplicita tra percorso preferito e percorso transitorio, senza introdurre merge legacy nella NEXT.
