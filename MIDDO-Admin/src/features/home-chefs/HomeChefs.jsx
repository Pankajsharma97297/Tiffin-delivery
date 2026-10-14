import React from 'react';
import {DataTable} from '../../components/common/DataTable';
import {Panel} from '../../components/common/Panel';
import {RowActions} from '../../components/common/RowActions';
import {resolveImageUri} from '../../utils/imageUrl';

export function HomeChefs({canEdit = false, chefs = [], onDeleteChef, onEditChef}) {
  return (
    <Panel title="HomeChef Management">
      <DataTable
        actions={
          canEdit && onEditChef
            ? row => (
                <RowActions
                  onDelete={onDeleteChef ? () => onDeleteChef(row) : undefined}
                  onEdit={onEditChef ? () => onEditChef(row) : undefined}
                />
              )
            : undefined
        }
        columns={[
          'Profile Image',
          'Kitchen',
          'Owner',
          'Cuisine',
          'Address',
          'Coordinates',
          'Weekly Menu',
          'Sample Menu',
          'Rating',
          'Orders',
          'Status',
          ...(canEdit && onEditChef ? ['Actions'] : []),
        ]}
        rows={(chefs || []).map(row => ({
          key: row._id || row.name,
          source: row,
          cells: [
            resolveImageUri(row.avatar || row.image) ? (
              <img
                className="profile-avatar"
                src={resolveImageUri(row.avatar || row.image)}
                alt={`${row.name || 'HomeChef'} profile`}
              />
            ) : 'Not uploaded',
            row.name || '-',
            row.owner || '-',
            row.cuisine || '-',
            row.liveAddress || row.address || row.location || '-',
            row.latitude && row.longitude
              ? `${Number(row.latitude).toFixed(4)}, ${Number(row.longitude).toFixed(4)}`
              : '-',
            Array.isArray(row.weeklyMenu) && row.weeklyMenu.length
              ? row.weeklyMenu.map(item => `${item.day}: ${item.title || item.meal}`).join(' · ')
              : '-',
            Array.isArray(row.sampleMenu) && row.sampleMenu.length
              ? row.sampleMenu.map(item => item.title || item.name).join(' · ')
              : '-',
            row.rating ? (String(row.rating).includes('★') ? row.rating : `★ ${row.rating}`) : '-',
            row.orders ?? 0,
            row.status || 'Active',
          ],
        }))}
      />
    </Panel>
  );
}
