import React from 'react';
import {DataTable} from '../../components/common/DataTable';
import {Panel} from '../../components/common/Panel';
import {RowActions} from '../../components/common/RowActions';

export function Plans({
  canManage = true,
  message,
  onCreatePlan,
  onDeletePlan,
  onEditPlan,
  onPlanFormChange,
  planForm,
  plans = [],
}) {
  return (
    <section className="split-grid">
      {canManage && planForm && onPlanFormChange && onCreatePlan ? (
        <Panel title="Create Subscription Plan">
          <form className="admin-form compact" onSubmit={onCreatePlan}>
            <label>
              Plan Name
              <input
                required
                value={planForm.name}
                onChange={event => onPlanFormChange({...planForm, name: event.target.value})}
                placeholder="e.g. Monthly Tiffin Plan"
              />
            </label>
            <label>
              Duration (days)
              <input
                required
                type="number"
                min="1"
                value={planForm.durationDays ?? 7}
                onChange={event =>
                  onPlanFormChange({
                    ...planForm,
                    durationDays: event.target.value === '' ? '' : Number(event.target.value),
                  })
                }
              />
            </label>
            <label>
              Meals Description
              <input
                value={planForm.meals}
                onChange={event => onPlanFormChange({...planForm, meals: event.target.value})}
                placeholder="e.g. 30 days · Lunch + Dinner"
              />
            </label>
            <label>
              Price
              <input
                required
                value={planForm.price}
                onChange={event => onPlanFormChange({...planForm, price: event.target.value})}
                placeholder="e.g. ₹4,999 or ₹69/meal"
              />
            </label>
            <label>
              Active Users
              <input
                type="number"
                min="0"
                value={planForm.users ?? 0}
                onChange={event =>
                  onPlanFormChange({
                    ...planForm,
                    users: event.target.value === '' ? 0 : Number(event.target.value),
                  })
                }
                placeholder="0"
              />
            </label>
            <label>
              Status
              <select
                value={planForm.status || 'Visible'}
                onChange={event => onPlanFormChange({...planForm, status: event.target.value})}>
                <option value="Visible">Visible</option>
                <option value="Hidden">Hidden</option>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
              </select>
            </label>
            <button className="form-primary" type="submit">Create Plan</button>
            {message ? <p className="form-message">{message}</p> : null}
          </form>
        </Panel>
      ) : null}

      <Panel title="Subscription Plans">
        <DataTable
          actions={
            canManage && (onEditPlan || onDeletePlan)
              ? plan => (
                  <RowActions
                    onDelete={onDeletePlan ? () => onDeletePlan(plan) : undefined}
                    onEdit={onEditPlan ? () => onEditPlan(plan) : undefined}
                  />
                )
              : undefined
          }
          columns={[
            'Plan',
            'Duration',
            'Meals',
            'Price',
            'Users',
            'Status',
            ...(canManage && (onEditPlan || onDeletePlan) ? ['Actions'] : []),
          ]}
          rows={(plans || []).map(row => ({
            key: row._id || row.name,
            source: row,
            cells: [
              row.name || '-',
              row.durationDays ? `${row.durationDays} days` : '-',
              row.meals || '-',
              row.price || '-',
              row.users ?? 0,
              row.status || 'Visible',
            ],
          }))}
        />
      </Panel>
    </section>
  );
}
