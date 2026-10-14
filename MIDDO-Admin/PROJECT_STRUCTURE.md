# MIDDO Admin Project Structure

This file defines the target structure for the MIDDO Admin panel. Read this before adding new admin features.

## Current Entry

```text
index.html
src/main.jsx
src/App.jsx
src/styles.css
```

`src/main.jsx` is the only browser entry point. `src/App.jsx` should remain the temporary shell until screens and shared UI are extracted.

## Target Structure

```text
src/
  main.jsx
  app/
    App.jsx
    routes.js
    session.js
  api/
    httpClient.js
    adminApi.js
    superAdminApi.js
  components/
    common/
      DataTable.jsx
      Panel.jsx
      RowActions.jsx
      EditModal.jsx
      FormField.jsx
    layout/
      Sidebar.jsx
      Topbar.jsx
  config/
    api.js
    options.js
  constants/
    permissions.js
    tables.js
    tracking.js
  data/
    fallbackAdminData.js
  features/
    auth/
      AdminLogin.jsx
    dashboard/
      Dashboard.jsx
    orders/
      Orders.jsx
    super-admin/
      SuperAdmin.jsx
      ProductForm.jsx
      CategoryForm.jsx
      DatabaseManager.jsx
      PermissionManager.jsx
    customers/
    plans/
    wallet/
    reviews/
    support/
    notifications/
  hooks/
    useAdminSession.js
    useSuperAdminData.js
  styles/
    global.css
    tables.css
    forms.css
    modal.css
    layout.css
  utils/
    rowUtils.js
    formatters.js
```

## Rules

- Do not add new large components directly inside `App.jsx`.
- Reusable UI goes in `src/components/common`.
- Page-specific UI goes in `src/features/<feature-name>`.
- API calls must go through `src/api`.
- Static options and dropdown values go in `src/config` or `src/constants`.
- Fallback/sample data goes in `src/data`.
- Session/localStorage logic goes in hooks or `src/app/session.js`.
- Keep backend routes in one API layer so URL changes do not spread across the UI.

## Refactor Order

1. Extract `Panel`, `DataTable`, `RowActions`, and `EditRowModal`.
2. Extract API helper into `src/api/httpClient.js`.
3. Extract constants/options into `src/constants` and `src/config`.
4. Extract login/session logic into `src/features/auth` and `src/hooks`.
5. Extract screens one by one: Dashboard, Orders, Super Admin, Customers.
6. Split CSS into layout/forms/tables/modal files after components are extracted.

## Quality Checklist

- `npm run build` must pass after every change.
- Admin CRUD must keep working for products, categories, and generic database tables.
- No browser `prompt` UI for edit flows.
- No duplicate API request logic in components.
- No secrets or backend credentials in frontend files.
