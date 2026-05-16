/**
 * PROMPT 40 — Componente unico per la frase storia.
 *
 * Componente React stateless: riceve i campi di RecordChiuso (spread-friendly)
 * e renderizza la frase storia standard in un <p class="frase-storia-record">.
 * Display standard del NEXT per la storia di segnalazioni / controlli / manutenzioni.
 */

import type { CSSProperties, ReactElement } from "react";

import { buildFraseStoria, type RecordChiuso } from "../helpers/frasestoriaRecord";

type Props = RecordChiuso & {
  /** Variante compatta per liste e righe dense. */
  compact?: boolean;
  /** Elemento di rendering. "span" quando il genitore non ammette <p> (es. <button>). */
  as?: "p" | "span";
  className?: string;
  style?: CSSProperties;
};

export function FraseStoriaRecord({
  compact = false,
  as = "p",
  className,
  style,
  ...record
}: Props): ReactElement {
  const frase = buildFraseStoria(record);
  const baseStyle: CSSProperties = {
    display: "block",
    margin: compact ? "6px 0 0" : "10px 0 0",
    color: "#4b5563",
    fontSize: compact ? 12 : 13,
    lineHeight: 1.45,
    ...style,
  };
  const classNames = [
    "frase-storia-record",
    compact ? "frase-storia-record--compact" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  const Tag = as;
  return (
    <Tag className={classNames} style={baseStyle}>
      {frase}
    </Tag>
  );
}

export default FraseStoriaRecord;
