# CONTINUITY REPORT - Memoria operativa locale IA

## Contesto
Il sottosistema IA interno disponeva gia di:
- scaffolding isolato sotto `/next/ia/interna*`;
- report targa in anteprima;
- archivio artifact locale isolato;
- chat interna controllata mock;
- autosuggest targhe reali.

Mancava ancora una memoria pratica e persistente del solo modulo IA, utile per riaprire la pagina e riprendere il lavoro senza introdurre tracking globale o persistenza business.

## Stato raggiunto
- Il modulo IA interno conserva ora memoria locale persistente nel browser del clone.
- La memoria include:
  - targhe recenti;
  - prompt chat recenti;
  - artifact recenti;
  - intenti usati;
  - ultimo stato di lavoro.
- Il tracking registra solo eventi del subtree IA interno.
- L'overview mostra una sezione minima di memoria recente.

## Decisioni operative fissate
- Nessun backend reale.
- Nessuna persistenza business.
- Nessun tracking globale del gestionale.
- Nessun riuso runtime di backend o moduli IA legacy.
- Memoria solo locale, namespaced e reversibile.

## Prossimo passo coerente
- Valutare in task separato se estendere questa memoria locale alla chat in modo piu ricco, sempre senza trasformarla in memoria operativa globale del gestionale.
- Tenere separata la futura memoria operativa completa, che richiedera backend, permessi e governance dedicati.

## Vincoli da mantenere
- Tutti i testi visibili devono restare in italiano.
- Ogni futuro task IA deve aggiornare `docs/product/CHECKLIST_IA_INTERNA.md`.
- Nessuna scrittura su dataset business.
- Nessun riuso runtime di backend IA/PDF legacy.
