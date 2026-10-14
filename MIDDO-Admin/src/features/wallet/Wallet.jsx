import React from 'react';
import {DataTable} from '../../components/common/DataTable';
import {Panel} from '../../components/common/Panel';

export function Wallet({reports, walletRows = []}) {
  return (
    <section className="split-grid">
      <Panel title="Wallet and Payments">
        <DataTable columns={['Customer', 'Type', 'Amount', 'Note']} rows={walletRows.map(row => [row.customer, row.type, row.amount, row.note])} />
      </Panel>
      <Panel title="Payment Summary">
        <DataTable
          columns={['Metric', 'Value', 'Note']}
          rows={[
            ...(reports?.sales || []),
            ...(reports?.commission || []),
          ].map(row => [row.label, row.value, row.note])}
        />
      </Panel>
    </section>
  );
}
