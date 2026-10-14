import React from 'react';
import {DataTable} from '../../components/common/DataTable';
import {Panel} from '../../components/common/Panel';

export function Reports({reports = {}}) {
  const reportRows = [
    ...(reports.sales || []).map(row => ({...row, group: 'Sales'})),
    ...(reports.subscriptions || []).map(row => ({...row, group: 'Subscriptions'})),
    ...(reports.commission || []).map(row => ({...row, group: 'Commission'})),
  ];

  return (
    <Panel title="Reports">
      <DataTable
        columns={['Report', 'Metric', 'Value', 'Note']}
        rows={reportRows.map(row => [row.group, row.label, row.value, row.note])}
      />
    </Panel>
  );
}
