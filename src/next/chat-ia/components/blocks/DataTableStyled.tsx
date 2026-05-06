import type { ChatIaBlockDataTableStyled } from "../../core/chatIaTypes";
import ChatIaEntityLink from "./ChatIaEntityLink";

type DataTableStyledProps = {
  block: ChatIaBlockDataTableStyled;
};

export default function DataTableStyled({ block }: DataTableStyledProps) {
  const { table } = block;
  const hasActions = Boolean(table.rowActions?.some(Boolean));
  return (
    <section className="chat-ia-viz-block chat-ia-viz-data-table-styled">
      <h3>{table.title}</h3>
      <div className="chat-ia-viz-table-scroll">
        <table>
          <thead>
            <tr>
              {table.columns.map((column) => (
                <th className={`chat-ia-viz-align-${column.align ?? "left"}`} key={column.key}>{column.label}</th>
              ))}
              {hasActions ? <th className="chat-ia-viz-align-center">Apri</th> : null}
            </tr>
          </thead>
          <tbody>
            {table.rows.length > 0 ? (
              table.rows.map((row, rowIndex) => (
                <tr data-chat-ia-fingerprint={String(row._id ?? "")} key={`${table.title}-${row._id ?? rowIndex}`}>
                  {table.columns.map((column) => (
                    <td className={`chat-ia-viz-align-${column.align ?? "left"}`} key={column.key}>
                      <span className={String(row[column.key] ?? "").length > 70 ? "chat-ia-viz-cell-text chat-ia-viz-cell-text--long" : "chat-ia-viz-cell-text"} title={String(row[column.key] ?? "")}>
                        {row[column.key] ?? "n.d."}
                      </span>
                    </td>
                  ))}
                  {hasActions ? (
                    <td className="chat-ia-viz-align-center">
                      <ChatIaEntityLink action={table.rowActions?.[rowIndex] ?? null} />
                    </td>
                  ) : null}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={table.columns.length + (hasActions ? 1 : 0)}>{table.emptyText}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
