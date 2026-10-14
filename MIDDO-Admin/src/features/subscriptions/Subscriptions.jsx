import React from 'react';
import {DataTable} from '../../components/common/DataTable';
import {Panel} from '../../components/common/Panel';

export function Subscriptions({canExpire = false, onExpireSubscription, subscriptions}) {
  return (
    <Panel title="Subscriptions and Purchased Plans">
      <DataTable
        actions={canExpire ? row => (
          <div className="row-actions">
            <button
              className="danger"
              disabled={row.status === 'Expired'}
              type="button"
              onClick={() => onExpireSubscription?.(row)}>
              Expire
            </button>
          </div>
        ) : undefined}
        columns={['Customer', 'Plan', 'HomeChef', 'Amount', 'Address', 'Location', 'Payment', 'Start', 'Expiry', 'Status', ...(canExpire ? ['Actions'] : [])]}
        rows={(subscriptions || []).map(row => ({
          key: row._id || row.orderId,
          source: row,
          cells: [
            row.customer || '-',
            row.plan || '-',
            row.homeChefOwner && row.homeChefName
              ? `${row.homeChefOwner} · ${row.homeChefName}`
              : row.homeChefName || '-',
            row.amount || row.price || '-',
            row.address || '-',
            row.latitude && row.longitude ? `${Number(row.latitude).toFixed(4)}, ${Number(row.longitude).toFixed(4)}` : '-',
            row.paymentMethod ? `${row.paymentProvider || 'Razorpay'} · ${row.paymentMethod} · ${row.paymentStatus || 'Paid'}` : '-',
            row.startDate ? new Date(row.startDate).toLocaleDateString() : '-',
            row.endDate ? new Date(row.endDate).toLocaleDateString() : row.renewal || '-',
            row.status || 'Active',
          ],
        }))}
      />
    </Panel>
  );
}
