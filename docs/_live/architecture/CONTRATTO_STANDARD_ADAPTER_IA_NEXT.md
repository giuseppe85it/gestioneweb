# CONTRATTO STANDARD ADAPTER IA NEXT

## 1. Scopo
Questo documento definisce il contratto unico con cui ogni modulo presente o futuro del clone/NEXT deve esporre alla chat/IA universale le proprie capacita di lettura, routing e aggancio UI.

Il contratto vale per:
- moduli gia presenti nel clone/NEXT;
- verticali specialistici;
- capability IA gia deployate che vengono riassorbite;
- moduli futuri che dovranno nascere `AI-readable by design`.

Dal `2026-03-26` il gate di conformita e anche runtime:
- il sistema universale espone una `conformance summary`;
- un modulo nuovo non e considerato completo se manca registry entry, contract adapter, hook UI o reader dichiarati.

## 2. Campi obbligatori del contratto
Ogni adapter deve dichiarare almeno questi campi:

1. `adapterId`
   - identificatore stabile e univoco
2. `domainCode`
   - codice dominio o famiglia (`D01`, `D06`, `D09`, `REPO`, `UNIVERSAL`)
3. `moduleLabel`
   - nome leggibile del modulo o del perimetro servito
4. `entityKinds`
   - entita servite davvero dall'adapter
5. `queryTypes`
   - tipi di interrogazione supportati
6. `lookupKeys`
   - chiavi di lookup realmente accettate
7. `relations`
   - relazioni che l'adapter puo esporre in modo spiegabile
8. `outputModel`
   - shape normalizzata consegnata al layer universale
9. `limits`
   - limiti reali dichiarati e non mascherati
10. `coverageStatus`
    - `assorbito` oppure `parziale`
11. `trustLevel`
    - `alta`, `media`, `prudente`
12. `liveReadCapability`
    - `clone_read_model_only`, `no_live_read_business` o stato analogo verificato
13. `uiHookIds`
    - hook UI reali agganciabili dal composer/action intent
14. `reusableCapabilityIds`
    - capability IA gia deployate o del clone che l'adapter puo riusare
15. `sourceReaders`
    - reader/snapshot reali da cui l'adapter dipende
16. `futureReady`
    - flag esplicito di conformita per i moduli futuri
17. `conformanceNotes`
    - note di conformita o limiti residui
18. `iaHandoff`
    - nel perimetro operativo corrente il modulo deve consumare davvero il riferimento `?iaHandoff=<id>` sulla route target, recuperare il payload e tracciarne lo stato; per i moduli futuri questa e una condizione di ingresso, non un miglioramento facoltativo

## 3. Regole di conformita
Un adapter e conforme solo se:
- non omette entita, lookup key o limiti reali;
- dichiara almeno un `outputModel` normalizzato;
- espone almeno un `uiHookId` reale oppure dichiara esplicitamente di non avere agganci UI;
- dichiara se puo o non puo fare live-read;
- dichiara le capability IA gia deployate che riusa, senza duplicarle in modo cieco;
- espone reader reali del clone/NEXT o snapshot IA separati, non accessi impliciti alla madre;
- puo essere registrato nel registry totale con coverage e trust espliciti.

## 4. Casi di non conformita bloccante
Un modulo NON e conforme se:
- usa solo prompt hardcoded e non dichiara entita/lookup reali;
- non dichiara limiti o li nasconde dietro fallback generici;
- apre un flusso UI ma non dichiara il relativo hook;
- dipende da runtime legacy sporco senza separare il valore riusabile dalla dipendenza sporca;
- pretende di essere assorbito nel sistema universale senza un output normalizzato;
- non passa un test minimo di lettura, registry e aggancio UI.

## 5. Test minimi di conformita
Ogni adapter deve poter superare almeno questi controlli:
1. `registry test`
   - il modulo compare nel registry totale con entita, route, reader, coverage e aiAssimilationStatus
2. `resolver test`
   - almeno una richiesta libera o un'entita forte seleziona l'adapter corretto
3. `ui hook test`
   - il modulo espone almeno un punto di aggancio valido o dichiara esplicitamente di non averlo
4. `limits test`
   - i limiti dichiarati compaiono nel contract e non vengono rimossi dal composer
5. `reuse test`
   - le capability IA gia deployate vengono mappate come riuso e non come doppione
6. `handoff test`
   - il modulo e in grado di essere agganciato e di consumare davvero un payload standard `iaHandoff`, con prefill o stato di verifica coerente

## 6. Flusso obbligatorio per i moduli futuri
Ogni nuovo modulo deve seguire questo ordine:
1. censimento nel registry totale del clone/NEXT;
2. dichiarazione del contratto adapter standard;
3. collegamento a entita, lookup key, reader, hook UI e capability riusabili;
4. passaggio dei test minimi di conformita;
5. solo dopo, esposizione alla chat/IA universale come modulo leggibile.

## 7. Regola architetturale per il futuro
Da ora in poi un modulo nuovo non e architetturalmente completo se non entra nel clone/NEXT con:
- contract standard adapter;
- registry entry;
- hook UI dichiarati;
- limiti e trust dichiarati;
- policy di riuso delle capability IA gia esistenti;
- supporto al payload standard `iaHandoff` o limite dichiarato;
- consumo reale del payload standard `iaHandoff` nel punto UI target;
- assenza di dipendenze sporche dalla madre come perimetro di evoluzione.
