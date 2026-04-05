# Continuity Report - IA interna Euromecc read-only

## Stato consegnato
- La chat libera `/next/ia/interna` puo leggere `Euromecc` in sola lettura.
- Il perimetro e confinato a `src/next/internal-ai/*`.
- Il modulo `Euromecc` non apre scritture nuove tramite IA.

## File runtime chiave
- `src/next/internal-ai/internalAiEuromeccReadonly.ts`
- `src/next/internal-ai/internalAiChatOrchestratorBridge.ts`
- `src/next/internal-ai/internalAiUniversalContracts.ts`
- `src/next/internal-ai/internalAiUniversalRequestResolver.ts`

## Contratto operativo
- sorgente dati: `readEuromeccSnapshot()` + `euromeccAreas.ts`
- snapshot esposto: aree, sili, cemento, pending, done recenti, issue aperte/chiuse, stato area, contatori, incroci critici
- risposta IA: solo lettura, nessun writer

## Verifica rapida
- aprire `/next/ia/interna`
- chiedere cemento silo, problemi aperti, manutenzioni da fare, sili senza cemento, stato Euromecc
- confermare riferimenti `Euromecc` e assenza di azioni di scrittura
