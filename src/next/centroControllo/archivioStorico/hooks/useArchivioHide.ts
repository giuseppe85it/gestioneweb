// PROMPT 31.1 — hook orchestrazione hide Archivio Storico.
// Responsabilità:
//  - state pendingRecord + confirmOpen + busy + errorMessage
//  - openConfirm(kind, recordId, kindLabel, recordTitle)
//  - executeHide() → setArchivioHidden + refetch + chiude confirm
//  - cancelConfirm()
// Il rimosso ottimistico è gestito dal refetch del dataset; non
// teniamo un override locale per mantenere l'invariante "verità
// dalla persistenza dopo write".

import { useCallback, useState } from "react";

import {
  setArchivioHidden,
  type ArchivioHideKind,
} from "../../../nextArchivioHideWriter";

type PendingHide = {
  kind: ArchivioHideKind;
  recordId: string;
  kindLabel: string;
  recordTitle: string | null;
};

export type UseArchivioHideState = {
  confirmOpen: boolean;
  pending: PendingHide | null;
  busy: boolean;
  errorMessage: string | null;
  openConfirm: (req: PendingHide) => void;
  cancelConfirm: () => void;
  executeHide: () => Promise<void>;
};

type Options = {
  refetch: () => Promise<void> | void;
};

export function useArchivioHide({ refetch }: Options): UseArchivioHideState {
  const [pending, setPending] = useState<PendingHide | null>(null);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openConfirm = useCallback((req: PendingHide): void => {
    setPending(req);
    setErrorMessage(null);
    setConfirmOpen(true);
  }, []);

  const cancelConfirm = useCallback((): void => {
    if (busy) return;
    setConfirmOpen(false);
    setPending(null);
    setErrorMessage(null);
  }, [busy]);

  const executeHide = useCallback(async (): Promise<void> => {
    if (!pending || busy) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      const result = await setArchivioHidden({
        kind: pending.kind,
        recordId: pending.recordId,
        hidden: true,
      });
      if (!result.ok) {
        setErrorMessage(result.error ?? "Eliminazione fallita.");
        return;
      }
      await refetch();
      setConfirmOpen(false);
      setPending(null);
    } catch (err: unknown) {
      const msg: string =
        err instanceof Error ? err.message : "Eliminazione fallita.";
      setErrorMessage(msg);
    } finally {
      setBusy(false);
    }
  }, [pending, busy, refetch]);

  return {
    confirmOpen,
    pending,
    busy,
    errorMessage,
    openConfirm,
    cancelConfirm,
    executeHide,
  };
}
