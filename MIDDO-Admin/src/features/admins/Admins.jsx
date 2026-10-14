import React from 'react';
import {accountRoleOptions} from '../../constants/adminConfig';
import {DataTable} from '../../components/common/DataTable';
import {Panel} from '../../components/common/Panel';
import {RowActions} from '../../components/common/RowActions';

export function Admins({
  adminForm,
  admins,
  message,
  onAdminFormChange,
  onCreateAdmin,
  onDeleteAdmin,
  onEditAdmin,
}) {
  return (
    <section className="split-grid">
      <Panel title="Create User / Role">
        <form className="admin-form compact" onSubmit={onCreateAdmin}>
          <label>
            Name
            <input
              required
              value={adminForm.name}
              onChange={event => onAdminFormChange({...adminForm, name: event.target.value})}
              placeholder="MIDDO Admin"
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              value={adminForm.email}
              onChange={event => onAdminFormChange({...adminForm, email: event.target.value})}
              placeholder="admin@middo.com"
            />
          </label>
          <label>
            Phone
            <input
              value={adminForm.phone}
              onChange={event => onAdminFormChange({...adminForm, phone: event.target.value})}
              placeholder="+91 90000 00001"
            />
          </label>
          <label>
            Role
            <select
              value={adminForm.role}
              onChange={event => onAdminFormChange({...adminForm, role: event.target.value})}
            >
              {accountRoleOptions.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Password
            <input
              required
              type="password"
              value={adminForm.password}
              onChange={event => onAdminFormChange({...adminForm, password: event.target.value})}
              placeholder="Minimum 6 characters"
            />
          </label>
          <label>
            Status
            <select
              value={String(adminForm.isActive)}
              onChange={event =>
                onAdminFormChange({...adminForm, isActive: event.target.value === 'true'})
              }>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
          <button className="form-primary">Create User</button>
          {message ? <p className="form-message">{message}</p> : null}
        </form>
      </Panel>

      <Panel title="All Users in Database">
        <DataTable
          actions={admin => (
            <RowActions
              onDelete={() => onDeleteAdmin(admin)}
              onEdit={() => onEditAdmin(admin)}
            />
          )}
          columns={['Name', 'Email', 'Phone', 'Role', 'Status', 'Created', 'Actions']}
          rows={(admins || []).map(admin => ({
            key: admin._id,
            source: admin,
            cells: [
              admin.name,
              admin.email,
              admin.phone || '-',
              accountRoleOptions.find(role => role.value === admin.role)?.label || admin.role || '-',
              admin.isActive === false ? 'Inactive' : 'Active',
              admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : '-',
            ],
          }))}
        />
      </Panel>
    </section>
  );
}
