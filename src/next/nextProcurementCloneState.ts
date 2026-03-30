const NEXT_PROCUREMENT_CLONE_ORDERS_KEY = "@next_clone_procurement:orders";

type NextProcurementCloneMaterialRecord = {
  id: string;
  descrizione: string;
  quantita: number;
  unita: string;
  arrivato: boolean;
  dataArrivo?: string;
  fotoUrl?: string | null;
  fotoStoragePath?: string | null;
};

export type NextProcurementCloneOrderRecord = {
  id: string;
  idFornitore: string;
  nomeFornitore: string;
  dataOrdine: string;
  materiali: NextProcurementCloneMaterialRecord[];
  arrivato: boolean;
  ordineNote?: string;
  __nextCloneOnly: true;
  __nextCloneSavedAt: number;
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readState(): NextProcurementCloneOrderRecord[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(NEXT_PROCUREMENT_CLONE_ORDERS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as NextProcurementCloneOrderRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeState(next: NextProcurementCloneOrderRecord[]) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(NEXT_PROCUREMENT_CLONE_ORDERS_KEY, JSON.stringify(next));
}

export function readNextProcurementCloneOrders(): NextProcurementCloneOrderRecord[] {
  return readState().filter(
    (entry): entry is NextProcurementCloneOrderRecord =>
      Boolean(entry) &&
      typeof entry === "object" &&
      entry.__nextCloneOnly === true &&
      typeof entry.id === "string" &&
      Array.isArray(entry.materiali),
  );
}

export function appendNextProcurementCloneOrder(order: NextProcurementCloneOrderRecord) {
  const current = readNextProcurementCloneOrders();
  writeState([order, ...current.filter((entry) => entry.id !== order.id)]);
}
