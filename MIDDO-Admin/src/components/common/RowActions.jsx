import React from 'react';

export function RowActions({onDelete, onEdit}) {
  return (
    <div className="row-actions">
      <button type="button" onClick={onEdit}>Edit</button>
      <button type="button" className="danger" onClick={onDelete}>Delete</button>
    </div>
  );
}
