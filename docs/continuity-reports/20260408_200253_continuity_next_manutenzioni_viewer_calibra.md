# Continuity Report - 2026-04-08 20:02:53

## Stato prima
- Il viewer tecnico `Sinistra/Destra` mostrava ancora i cerchi neutrali del renderer SVG anche quando non esistevano target strutturati da evidenziare.
- Tutti i target foto/hotspot usavano la stessa grammatica visiva.
- Non esisteva una modalita dedicata per distinguere runtime operativo e preview/calibrazione.

## Stato dopo
- In modalita normale la tavola tecnica resta pulita e mostra solo assi realmente salvati.
- `Calibra` concentra preview asse e grammatica target senza sporcare il runtime operativo.
- `mezziHotspotAreas.ts` governa ora una tassonomia target riusabile dal viewer.

## Limiti espliciti
- `Fronte/Retro` restano sul fallback foto/hotspot.
- Nessuna modifica a writer business, backend, Firestore o modale legacy.
