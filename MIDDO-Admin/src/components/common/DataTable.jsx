import React from 'react';

export function DataTable({actions, columns, rows}) {
  const renderCell = (column, cell) => {
    if (React.isValidElement(cell)) {
      return cell;
    }

    const value = String(cell ?? '-');
    const key = column.toLowerCase();
    const normalized = value.toLowerCase();

    if (key.includes('status') || key.includes('priority')) {
      let tone = 'neutral';
      if (/(delivered|active|visible|enabled|paid|low|confirmed|ready)/.test(normalized)) {
        tone = 'success';
      } else if (/(preparing|review|draft|medium|pending|on the way|out for delivery)/.test(normalized)) {
        tone = 'warning';
      } else if (/(delayed|failed|cancelled|high|disabled)/.test(normalized)) {
        tone = 'danger';
      }

      return <span className={`table-badge ${tone}`}>{value}</span>;
    }

    if (key.includes('payment') && value !== '-') {
      return <span className="table-badge payment">{value}</span>;
    }

    if (key.includes('order') || key.includes('ticket')) {
      return <span className="table-code">{value}</span>;
    }

    return value;
  };

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map(column => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const rowSource = row?.source || row;
            const cells = row?.cells || row;

            return (
            <tr key={row?.key || rowSource?._id || rowIndex}>
              {cells.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`}>
                  {renderCell(columns[cellIndex] || '', cell)}
                </td>
              ))}
              {actions ? <td>{actions(rowSource)}</td> : null}
            </tr>
          );
          })}
        </tbody>
      </table>
    </div>
  );
}
