import React from 'react';

export function Panel({title, children}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
        <button>Manage</button>
      </div>
      {children}
    </section>
  );
}
