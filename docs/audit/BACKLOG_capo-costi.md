# BACKLOG - `Capo Costi`

- Modulo target: `Capo Costi`
- Route target:
  - `/next/capo/costi/:targa`
- Stato iniziale: `NOT_STARTED`
- Stato finale: `CLOSED`
- Blocchi reali rilevati:
  - `src/next/NextCapoCostiMezzoPage.tsx` usava `upsertNextCapoCloneApproval()` per salvare approvazioni locali clone-only.
  - `src/next/domain/nextCapoDomain.ts` leggeva `@preventivi_approvazioni` sovrapponendo override clone-only locali.
  - `src/next/domain/nextDocumentiCostiDomain.ts` includeva documenti clone-only locali nel dataset ufficiale.
  - `NextCapoCostiMezzoPage` generava `ANTEPRIMA TIMBRATO` locale clone-side invece di restare read-only esplicito.
- Path precisi:
  - `src/next/NextCapoCostiMezzoPage.tsx`
  - `src/next/domain/nextCapoDomain.ts`
  - `src/next/domain/nextDocumentiCostiDomain.ts`
  - `src/pages/CapoCostiMezzo.tsx`
