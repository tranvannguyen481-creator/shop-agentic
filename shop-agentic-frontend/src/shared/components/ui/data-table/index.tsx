import { ReactNode } from "react";
import styles from "./index.module.scss";

export interface TableColumn<TData> {
  key: keyof TData;
  header: string;
  render?: (value: TData[keyof TData], row: TData) => ReactNode;
}

interface DataTableProps<TData extends Record<string, unknown>> {
  columns: TableColumn<TData>[];
  data: TData[];
  className?: string;
}

function DataTable<TData extends Record<string, unknown>>({
  columns,
  data,
  className,
}: DataTableProps<TData>) {
  return (
    <div className={`${styles.wrapper} ${className ?? ""}`.trim()}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column) => {
                const value = row[column.key];

                return (
                  <td key={String(column.key)}>
                    {column.render
                      ? column.render(value, row)
                      : String(value ?? "")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
