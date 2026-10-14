import React from 'react';
import {DataTable} from '../../components/common/DataTable';
import {Panel} from '../../components/common/Panel';

export function Notifications({notifications = []}) {
  return <Panel title="Notification Controls"><DataTable columns={['Campaign', 'Audience', 'Status']} rows={notifications.map(row => [row.title, row.audience, row.status])} /></Panel>;
}
