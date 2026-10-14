import React from 'react';

export function TaskList({items}) {
  return (
    <div className="task-list">
      {items.map(item => (
        <label key={item}>
          <input type="checkbox" />
          <span>{item}</span>
        </label>
      ))}
    </div>
  );
}
