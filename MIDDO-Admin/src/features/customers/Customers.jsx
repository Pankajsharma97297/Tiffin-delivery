import React from 'react';
import {DataTable} from '../../components/common/DataTable';
import {Panel} from '../../components/common/Panel';
import {RowActions} from '../../components/common/RowActions';
import {resolveImageUri} from '../../utils/imageUrl';

export function Customers({canEdit, customers, onDeleteCustomer, onEditCustomer}) {
  return (
    <Panel title="Customer Profiles">
      <DataTable
        actions={
          canEdit
              ? row => (
                <RowActions
                  onDelete={onDeleteCustomer ? () => onDeleteCustomer(row) : undefined}
                  onEdit={onEditCustomer ? () => onEditCustomer(row) : undefined}
                />
              )
            : undefined
        }
        columns={[
          'Profile Image',
          'Customer',
          'Email',
          'Phone',
          'Source',
          'Address',
          'Coordinates',
          'Wallet',
          'Orders',
          ...(canEdit ? ['Actions'] : []),
        ]}
        rows={(customers || []).map(row => [
          {
            source: row,
            cells: [
              resolveImageUri(row.avatar) ? (
                <img
                  className="profile-avatar"
                  src={resolveImageUri(row.avatar)}
                  alt={`${row.name || 'Customer'} profile`}
                />
              ) : 'Not uploaded',
              row.name,
              row.email || '-',
              row.phone || '-',
              row.source || row.authProvider || 'local',
              row.liveAddress || row.address || row.location || '-',
              row.latitude && row.longitude
                ? `${Number(row.latitude).toFixed(4)}, ${Number(row.longitude).toFixed(4)}`
                : '-',
              row.wallet || `₹${row.walletBalance || 0}`,
              row.orders,
            ],
          },
        ]).flat()}
      />
    </Panel>
  );
}
