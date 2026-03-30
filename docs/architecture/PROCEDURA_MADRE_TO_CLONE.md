# PROCEDURA MADRE -> CLONE

## Scopo
- Leggere la madre per capire UI, flussi, modali, report, PDF, dipendenze e dati reali.
- Ricostruire la controparte NEXT senza montare la madre come runtime finale.

## Regole fisse
- Madre intoccabile.
- `src/next/**` e l'unico perimetro sicuro di evoluzione.
- La madre si legge, non si patcha per chiudere il clone.
- La route NEXT finale non deve montare `NextMotherPage`, `src/pages/**`, `src/autisti/**`, `src/autistiInbox/**`.
- Il clone resta `read-only` finche non esiste una decisione esplicita diversa.

## Metodo
1. Leggere davvero il modulo madre.
2. Elencare route, file, modali, PDF, flussi principali e side effect.
3. Ricostruire la pagina NEXT vera con stessa UI esterna e stessa navigazione pratica.
4. Sotto usare layer NEXT puliti, adapter clone-safe e stato locale clone solo dove strettamente necessario.
5. Non riattivare scritture business reali nel clone.

## Chiusura modulo
Un modulo e chiuso solo se tutte queste condizioni sono vere:
- la route ufficiale NEXT non monta runtime madre;
- la UI esterna e equivalente alla madre;
- i flussi principali sono equivalenti;
- i modali principali sono equivalenti;
- i report/PDF principali sono equivalenti;
- sotto usa layer NEXT puliti o chiaramente ripuliti.

Se una voce critica e `no`, il modulo non e chiuso.

## Execution e audit
- `execution != audit`
- il task di execution non auto-certifica la chiusura;
- il report esecutivo non e prova finale;
- sui task grandi o sensibili serve audit separato.

## Prove ammesse
- verifica route/file reali;
- assenza mount legacy dove richiesta;
- parity esterna dimostrata;
- layer NEXT usati davvero.

## Blocchi reali
- Se per chiudere il task serve un file fuori whitelist, fermarsi e scrivere solo:
- `SERVE FILE EXTRA: <path>`

