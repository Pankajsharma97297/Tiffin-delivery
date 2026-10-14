import {managedTables} from '../constants/adminConfig';

export const getTableTemplate = table =>
  JSON.stringify(managedTables.find(item => item.key === table)?.template || {}, null, 2);

export const getCategoryOptions = categories => {
  const rows = (categories || [])
    .map(category => ({
      icon: category.icon || '🍽️',
      label: category.label || category.name || category.category,
    }))
    .filter(category => category.label);

  return rows;
};

export const getRowLabel = row =>
  row?.name || row?.title || row?.label || row?.orderId || row?.ticketId || row?.customer || row?.day || row?._id;

export const getEditableRowValues = row => {
  const {_id, __v, createdAt, updatedAt, ...editable} = row || {};

  return Object.fromEntries(
    Object.entries(editable).map(([key, value]) => [
      key,
      Array.isArray(value) && value.some(item => item && typeof item === 'object')
        ? JSON.stringify(value, null, 2)
        : Array.isArray(value)
          ? value.join(', ')
          : value ?? '',
    ]),
  );
};

export const buildEditedPayload = (values, originalRow) =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      const originalValue = originalRow?.[key];

      if (Array.isArray(originalValue)) {
        if (originalValue.some(item => item && typeof item === 'object')) {
          try {
            const parsed = JSON.parse(value || '[]');
            return [key, Array.isArray(parsed) ? parsed : []];
          } catch {
            return [key, originalValue];
          }
        }

        return [
          key,
          String(value || '')
            .split(',')
            .map(item => item.trim())
            .filter(Boolean),
        ];
      }

      if (typeof originalValue === 'boolean') {
        return [key, value === true || value === 'true'];
      }

      if (typeof originalValue === 'number') {
        return [key, value === '' ? 0 : Number(value)];
      }

      return [key, value];
    }),
  );

export const getLandingTabForRole = role => {
  const landingTabs = {
    super_admin: 'superAdmin',
    admin: 'dashboard',
    homechefs: 'homeChefs',
    rider: 'orders',
    customer: 'customers',
  };

  return landingTabs[role] || 'dashboard';
};

export const getVisibleNavItemsForRole = (role, navItems) => {
  const roleTabs = {
    super_admin: navItems
      .filter(item => item.key !== 'superAdmin')
      .map(item => item.key),
    admin: navItems
      .filter(item => !['admins', 'superAdmin'].includes(item.key))
      .map(item => item.key),
    homechefs: ['homeChefs', 'orders', 'reviews', 'support'],
    rider: ['orders', 'support'],
    customer: ['customers', 'subscriptions', 'wallet', 'support'],
  };
  const allowedTabs = roleTabs[role] || ['dashboard'];

  return navItems.filter(item => allowedTabs.includes(item.key));
};

export const isSessionExpiredError = error =>
  error?.message === 'Session expired. Please login again.';
