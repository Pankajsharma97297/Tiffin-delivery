import React from 'react';
import {DataTable} from '../../components/common/DataTable';
import {Panel} from '../../components/common/Panel';

export function Support({tickets = []}) {
  return <Panel title="Support Queue"><DataTable columns={['Ticket', 'Customer', 'Channel', 'Issue', 'Priority']} rows={tickets.map(row => [row.ticketId || row.id, row.customer, row.channel, row.issue, row.priority])} /></Panel>;
}
