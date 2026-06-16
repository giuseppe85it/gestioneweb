/**
 * Campo Officina: input nativo con <datalist> di suggerimenti dall'anagrafica
 * `@officine`. Tendina di SISTEMA (coerente con i <select> Mezzo/Tipo) e al tempo
 * stesso campo a testo libero: l'utente puo' SCRIVERE un'officina nuova OPPURE
 * SELEZIONARNE una dall'elenco. Nessuna validazione, nessuna scrittura su `@officine`.
 */

import { useId, type ReactElement } from "react";

import type { NextOfficinaReadOnlyItem } from "../domain/nextOfficineDomain";

type Props = {
  value: string;
  onChange: (value: string) => void;
  officine: NextOfficinaReadOnlyItem[];
  placeholder?: string;
  id?: string;
};

export function OfficinaAutocomplete({
  value,
  onChange,
  officine,
  placeholder,
  id,
}: Props): ReactElement {
  const generatedId = useId();
  const listId = `officine-list-${generatedId}`;
  // Suggerimenti ordinati per nome, una voce per riga (sola label).
  const sorted = [...officine].sort((a, b) => a.nome.localeCompare(b.nome, "it"));

  return (
    <>
      <input
        id={id}
        className="officina-ac__input"
        list={listId}
        value={value}
        placeholder={placeholder ?? "Es. Officina Rossi"}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
      />
      <datalist id={listId}>
        {sorted.map((officina) => (
          <option key={officina.id} value={officina.nome} />
        ))}
      </datalist>
    </>
  );
}

export default OfficinaAutocomplete;
