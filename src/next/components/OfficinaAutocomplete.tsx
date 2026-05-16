/**
 * PROMPT 42 — T2 — Autocomplete officina NON vincolante.
 *
 * Input testo libero con suggerimenti read-only dall'anagrafica `@officine`.
 * - L'utente puo' selezionare un suggerimento OPPURE scrivere a mano: in
 *   entrambi i casi il valore finale e' una stringa libera, nessuna validazione.
 * - 2+ caratteri senza match -> "Nessun suggerimento" (non blocca).
 * - lista officine vuota -> si comporta come normale input testo.
 * - NIENTE "+ aggiungi officina", NIENTE redirect, NIENTE scrittura su `@officine`.
 *
 * Pattern mirrorato da NextScadenzeCollaudiPage (autocomplete officine pre-collaudo).
 */

import { useMemo, useState, type ReactElement } from "react";

import type { NextOfficinaReadOnlyItem } from "../domain/nextOfficineDomain";

type Props = {
  value: string;
  onChange: (value: string) => void;
  officine: NextOfficinaReadOnlyItem[];
  placeholder?: string;
  id?: string;
};

function filterOfficine(
  items: NextOfficinaReadOnlyItem[],
  query: string,
): NextOfficinaReadOnlyItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("it");
  const matched = normalizedQuery
    ? items.filter((item) => item.nome.toLocaleLowerCase("it").includes(normalizedQuery))
    : items;
  // Suggerimenti ordinati per nome: una voce per riga, sola label.
  return [...matched]
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"))
    .slice(0, 8);
}

export function OfficinaAutocomplete({
  value,
  onChange,
  officine,
  placeholder,
  id,
}: Props): ReactElement {
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => filterOfficine(officine, value), [officine, value]);
  const queryLength = value.trim().length;
  const hasOfficine = officine.length > 0;

  return (
    <div className="officina-ac">
      <input
        id={id}
        className="officina-ac__input"
        value={value}
        placeholder={placeholder ?? "Es. Officina Rossi"}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
      />
      {open && hasOfficine ? (
        filtered.length > 0 ? (
          <div className="officina-ac__menu">
            {filtered.map((officina) => (
              <button
                key={officina.id}
                type="button"
                className="officina-ac__option"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(officina.nome);
                  setOpen(false);
                }}
              >
                {officina.nome}
              </button>
            ))}
          </div>
        ) : queryLength >= 2 ? (
          <div className="officina-ac__menu officina-ac__menu--empty">
            <span className="officina-ac__empty">Nessun suggerimento</span>
          </div>
        ) : null
      ) : null}
    </div>
  );
}

export default OfficinaAutocomplete;
