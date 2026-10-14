import React, {useEffect, useState} from 'react';
import {DataTable} from '../../components/common/DataTable';
import {Panel} from '../../components/common/Panel';

export function Commission({
  canManage = false,
  message = '',
  onSave,
  reports = {},
  settings = {},
}) {
  const [form, setForm] = useState({
    vendorCommissionPercent: settings.vendorCommissionPercent ?? 0,
    riderCommissionPercent: settings.riderCommissionPercent ?? 0,
    isActive: settings.isActive !== false,
  });

  useEffect(() => {
    setForm({
      vendorCommissionPercent: settings.vendorCommissionPercent ?? 0,
      riderCommissionPercent: settings.riderCommissionPercent ?? 0,
      isActive: settings.isActive !== false,
    });
  }, [settings]);

  return (
    <section className="split-grid">
      <Panel title="Manage Commission">
        <form
          className="admin-form compact"
          onSubmit={event => {
            event.preventDefault();
            onSave?.({
              vendorCommissionPercent: Number(form.vendorCommissionPercent || 0),
              riderCommissionPercent: Number(form.riderCommissionPercent || 0),
              isActive: form.isActive,
            });
          }}>
          <label>
            Vendor Commission %
            <input
              disabled={!canManage}
              max="100"
              min="0"
              step="0.01"
              type="number"
              value={form.vendorCommissionPercent}
              onChange={event => setForm(current => ({...current, vendorCommissionPercent: event.target.value}))}
            />
          </label>
          <label>
            Rider Commission %
            <input
              disabled={!canManage}
              max="100"
              min="0"
              step="0.01"
              type="number"
              value={form.riderCommissionPercent}
              onChange={event => setForm(current => ({...current, riderCommissionPercent: event.target.value}))}
            />
          </label>
          <label>
            Status
            <select
              disabled={!canManage}
              value={form.isActive ? 'active' : 'inactive'}
              onChange={event => setForm(current => ({...current, isActive: event.target.value === 'active'}))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <button className="form-primary" disabled={!canManage} type="submit">
            Save Commission
          </button>
          {message ? <p className="form-message">{message}</p> : null}
        </form>
      </Panel>

      <Panel title="Current Commission">
        <DataTable
          columns={['Type', 'Rate', 'Source']}
          rows={[
            ['Vendor', `${settings.vendorCommissionPercent ?? 0}%`, 'Admin setting'],
            ['Rider', `${settings.riderCommissionPercent ?? 0}%`, 'Admin setting'],
            ['Status', settings.isActive === false ? 'Inactive' : 'Active', settings.updatedBy || '-'],
          ]}
        />
      </Panel>

      <Panel title="Commission Report">
        <DataTable
          columns={['Metric', 'Value', 'Note']}
          rows={(reports.commission || []).map(row => [row.label, row.value, row.note])}
        />
      </Panel>
    </section>
  );
}
