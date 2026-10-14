import React from 'react';
import {DataTable} from '../../components/common/DataTable';
import {Panel} from '../../components/common/Panel';

export function Performance({reports = {}}) {
  return (
    <section className="split-grid">
      <Panel title="Vendor Performance">
        <DataTable
          columns={['Vendor', 'Orders', 'Revenue / Commission Status']}
          rows={(reports.vendorPerformance || []).map(row => [row.label, row.value, row.note])}
        />
      </Panel>
      <Panel title="Rider Performance">
        <DataTable
          columns={['Rider', 'Deliveries', 'Assigned / Order Value']}
          rows={(reports.riderPerformance || []).map(row => [row.label, row.value, row.note])}
        />
      </Panel>
    </section>
  );
}
