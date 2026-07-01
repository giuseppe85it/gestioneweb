import { useEffect, useMemo, useState } from "react";
import type { NextProcurementListinoItem } from "./domain/nextProcurementDomain";

export type AbbinaMaterialInput = {
  id: string;
  descrizione: string;
  quantita: number | null;
  unita: string | null;
  hasPrice: boolean;
};

export type AbbinaAssignment = {
  materialId: string;
  listinoId: string;
  prezzoUnitario: number;
  valuta: string | null;
  unita: string | null;
  articolo: string;
};

type Props = {
  open: boolean;
  supplierName: string | null;
  materials: AbbinaMaterialInput[];
  listino: NextProcurementListinoItem[];
  busy?: boolean;
  onClose: () => void;
  onConfirm: (assignments: AbbinaAssignment[]) => void | Promise<void>;
};

const NOISE_TOKENS = new Set([
  "DA",
  "DI",
  "DEL",
  "DELLA",
  "PER",
  "CON",
  "IL",
  "LA",
  "MM",
  "CM",
  "MT",
  "M",
  "NR",
  "N",
  "TIPO",
]);

function stripCodeSuffix(value: string): string {
  return String(value || "").replace(/\[[^\]]*\]/g, " ");
}

function normalizeForMatch(value: string): string {
  return stripCodeSuffix(value)
    .toUpperCase()
    .replace(/Ø/g, " ")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeForMatch(value)
    .split(" ")
    .filter((token) => token.length >= 2 && !NOISE_TOKENS.has(token));
}

function similarityScore(a: string, b: string): number {
  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let intersection = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) intersection += 1;
  });
  const union = tokensA.size + tokensB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function extractCode(value: string): string | null {
  const match = String(value || "").match(/\[([^\]]+)\]/);
  return match ? match[1].trim().toUpperCase() : null;
}

const MATCH_THRESHOLD = 0.34;

type Suggestion = {
  listinoId: string;
  score: number;
};

function suggestListinoId(
  material: AbbinaMaterialInput,
  listino: NextProcurementListinoItem[],
): Suggestion | null {
  const materialCode = extractCode(material.descrizione);
  if (materialCode) {
    const byCode = listino.find(
      (entry) => String(entry.codiceArticolo || "").trim().toUpperCase() === materialCode,
    );
    if (byCode) return { listinoId: byCode.id, score: 1 };
  }

  let bestId = "";
  let bestScore = 0;
  listino.forEach((entry) => {
    const score = similarityScore(material.descrizione, entry.articoloCanonico);
    if (score > bestScore) {
      bestScore = score;
      bestId = entry.id;
    }
  });

  if (bestId && bestScore >= MATCH_THRESHOLD) {
    return { listinoId: bestId, score: bestScore };
  }
  return null;
}

export default function NextAbbinaPrezziModal({
  open,
  supplierName,
  materials,
  listino,
  busy = false,
  onClose,
  onConfirm,
}: Props) {
  const listinoById = useMemo(() => {
    const map = new Map<string, NextProcurementListinoItem>();
    listino.forEach((entry) => map.set(entry.id, entry));
    return map;
  }, [listino]);

  const initialState = useMemo(() => {
    const selection: Record<string, string> = {};
    const apply: Record<string, boolean> = {};
    materials.forEach((material) => {
      const suggestion = suggestListinoId(material, listino);
      selection[material.id] = suggestion?.listinoId ?? "";
      apply[material.id] = Boolean(suggestion) && !material.hasPrice;
    });
    return { selection, apply };
  }, [materials, listino]);

  const [selection, setSelection] = useState<Record<string, string>>(initialState.selection);
  const [apply, setApply] = useState<Record<string, boolean>>(initialState.apply);

  // Ricalcola le proposte ogni volta che il modale viene aperto (le righe/il listino
  // possono essere cambiati dall'ultima apertura sullo stesso ordine).
  useEffect(() => {
    if (open) {
      setSelection(initialState.selection);
      setApply(initialState.apply);
    }
  }, [open, initialState]);

  if (!open) return null;

  const selectedCount = materials.filter(
    (material) => apply[material.id] && selection[material.id],
  ).length;

  const handleConfirm = () => {
    const assignments: AbbinaAssignment[] = [];
    materials.forEach((material) => {
      const listinoId = selection[material.id];
      if (!apply[material.id] || !listinoId) return;
      const entry = listinoById.get(listinoId);
      if (!entry || typeof entry.prezzoAttuale !== "number") return;
      assignments.push({
        materialId: material.id,
        listinoId,
        prezzoUnitario: entry.prezzoAttuale,
        valuta: entry.valuta ?? null,
        unita: entry.unita ?? null,
        articolo: entry.articoloCanonico,
      });
    });
    void onConfirm(assignments);
  };

  return (
    <div
      className="acq-modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div className="acq-modal-card acq-abbina-card">
        <div className="acq-link-foto-head">
          <div>
            <h4>Compila prezzi da preventivo</h4>
            <p className="acq-prev-draft-meta">
              Fornitore: {supplierName || "-"}. Controlla gli abbinamenti proposti dal listino
              e conferma quali prezzi scrivere sulle righe in attesa.
            </p>
          </div>
          <button
            type="button"
            className="acq-btn acq-btn--small"
            onClick={onClose}
            disabled={busy}
          >
            Chiudi
          </button>
        </div>

        <div className="acq-prev-table-wrap">
          <table className="acq-prev-table acq-abbina-table">
            <thead>
              <tr>
                <th>Applica</th>
                <th>Riga in attesa</th>
                <th>Abbina a (dal listino)</th>
                <th>Prezzo netto</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((material) => {
                const listinoId = selection[material.id] ?? "";
                const entry = listinoId ? listinoById.get(listinoId) : undefined;
                const prezzo =
                  entry && typeof entry.prezzoAttuale === "number"
                    ? `${entry.valuta ?? ""} ${entry.prezzoAttuale.toFixed(2)}`.trim()
                    : "-";
                return (
                  <tr key={material.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={Boolean(apply[material.id])}
                        disabled={busy || !listinoId}
                        onChange={(event) =>
                          setApply((current) => ({
                            ...current,
                            [material.id]: event.target.checked,
                          }))
                        }
                      />
                    </td>
                    <td>
                      <div style={{ display: "grid", gap: 2 }}>
                        <span>{material.descrizione || "-"}</span>
                        <small style={{ color: "#667085" }}>
                          Q.tà {material.quantita ?? "-"} {material.unita ?? ""}
                          {material.hasPrice ? " · prezzo già presente" : ""}
                        </small>
                      </div>
                    </td>
                    <td>
                      <select
                        className="acq-input acq-input--sm"
                        value={listinoId}
                        disabled={busy}
                        onChange={(event) => {
                          const value = event.target.value;
                          setSelection((current) => ({ ...current, [material.id]: value }));
                          setApply((current) => ({ ...current, [material.id]: Boolean(value) }));
                        }}
                      >
                        <option value="">— nessun abbinamento —</option>
                        {listino.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.articoloCanonico}
                            {option.codiceArticolo ? ` [${option.codiceArticolo}]` : ""}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{prezzo}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="acq-prev-actions">
          <button type="button" className="acq-btn" onClick={onClose} disabled={busy}>
            Annulla
          </button>
          <button
            type="button"
            className="acq-btn acq-btn--primary"
            onClick={handleConfirm}
            disabled={busy || selectedCount === 0}
          >
            {busy ? "Salvataggio..." : `Applica prezzi (${selectedCount})`}
          </button>
        </div>
      </div>
    </div>
  );
}
