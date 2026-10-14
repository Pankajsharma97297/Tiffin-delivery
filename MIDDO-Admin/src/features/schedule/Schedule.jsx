import React from 'react';
import {DataTable} from '../../components/common/DataTable';
import {Panel} from '../../components/common/Panel';

export function Schedule({canEdit, onEditSchedule, scheduleItems}) {
  return (
    <section className="content-stack">
      <Panel title="Weekly Meal Schedule">
        <DataTable
          actions={
            canEdit
              ? day => (
                  <div className="row-actions">
                    <button type="button" onClick={() => onEditSchedule(day)}>
                      Edit
                    </button>
                  </div>
                )
              : null
          }
          columns={[
            'Day',
            'Icon',
            'Title',
            'Meal Type',
            'Meta',
            'Chef',
            'Status',
            ...(canEdit ? ['Actions'] : []),
          ]}
          rows={(scheduleItems || []).map(day => ({
            key: day._id || day.day,
            source: day,
            cells: [
              day.day,
              day.icon || '-',
              day.title || day.meal || '-',
              day.mealType || '-',
              day.meta || '-',
              day.chef || '-',
              day.status || (day.active ? 'Active' : 'Scheduled'),
            ],
          }))}
        />
      </Panel>
    </section>
  );
}
