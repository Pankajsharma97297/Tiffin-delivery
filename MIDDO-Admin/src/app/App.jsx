import React, {useEffect, useMemo, useState} from 'react';
import {API_BASE_URL, adminRequest} from '../api/adminApi';
import {navItems, initialAdminForm, initialCategoryForm, initialHomeChefForm, initialPlanForm, managedTables, productStatusOptions, registerRoles} from '../constants/adminConfig';
import {EditRowModal} from '../components/common/EditRowModal';
import {AdminLogin} from '../features/auth/AdminLogin';
import {Admins} from '../features/admins/Admins';
import {Commission} from '../features/commission/Commission';
import {Customers} from '../features/customers/Customers';
import {Dashboard} from '../features/dashboard/Dashboard';
import {HomeChefs} from '../features/home-chefs/HomeChefs';
import {PartnerKyc} from '../features/kyc/PartnerKyc';
import {Notifications} from '../features/notifications/Notifications';
import {Orders} from '../features/orders/Orders';
import {Performance} from '../features/performance/Performance';
import {Plans} from '../features/plans/Plans';
import {Reviews} from '../features/reviews/Reviews';
import {Reports} from '../features/reports/Reports';
import {Schedule} from '../features/schedule/Schedule';
import {Subscriptions} from '../features/subscriptions/Subscriptions';
import {SuperAdmin} from '../features/super-admin/SuperAdmin';
import {Support} from '../features/support/Support';
import {Wallet} from '../features/wallet/Wallet';
import {
  buildEditedPayload,
  getCategoryOptions,
  getEditableRowValues,
  getLandingTabForRole,
  getRowLabel,
  getTableTemplate,
  getVisibleNavItemsForRole,
  isSessionExpiredError,
} from '../utils/adminUtils';

const activeTabStorageKey = 'middoAdminActiveTab';

const getInitialActiveTab = role => {
  const savedTab = localStorage.getItem(activeTabStorageKey);
  const visibleTabs = getVisibleNavItemsForRole(role, navItems);

  if (savedTab && visibleTabs.some(item => item.key === savedTab)) {
    return role === 'super_admin' && ['dashboard', 'homeChefs', 'schedule'].includes(savedTab)
      ? 'superAdmin'
      : savedTab;
  }

  return getLandingTabForRole(role);
};

export function App() {
  const [adminSession, setAdminSession] = useState(() => {
    const saved = localStorage.getItem('middoAdminSession');
    return saved ? JSON.parse(saved) : null;
  });
  const [active, setActive] = useState(() =>
    getInitialActiveTab(JSON.parse(localStorage.getItem('middoAdminSession') || 'null')?.role),
  );
  const [adminData, setAdminData] = useState({
    metrics: [],
    orders: [],
    subscriptions: [],
    chefs: [],
    customers: [],
    admins: [],
    categories: [],
    products: [],
    scheduleItems: [],
    plans: [],
    walletTransactions: [],
    reviews: [],
    supportTickets: [],
    notifications: [],
    riders: [],
    vendors: [],
    commissionSettings: {
      vendorCommissionPercent: 0,
      riderCommissionPercent: 0,
      isActive: true,
    },
  });
  const [apiStatus, setApiStatus] = useState('Loading Node API response...');
  const [superAdmin, setSuperAdmin] = useState(() => {
    const saved = localStorage.getItem('middoAdminSession');
    const session = saved ? JSON.parse(saved) : null;
    return session?.role === 'super_admin' ? session.user : null;
  });
  const [superAdminToken, setSuperAdminToken] = useState(
    () => JSON.parse(localStorage.getItem('middoAdminSession') || 'null')?.token || '',
  );
  const [loginForm, setLoginForm] = useState({
    email: 'admin@middo.com',
    password: 'Admin@123',
  });
  const [authMode, setAuthMode] = useState('login');
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer',
  });
  const [homeChefForm, setHomeChefForm] = useState(initialHomeChefForm);
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm);
  const [adminForm, setAdminForm] = useState(initialAdminForm);
  const [planForm, setPlanForm] = useState(initialPlanForm);
  const [selectedTable, setSelectedTable] = useState('homeChefs');
  const [managedRows, setManagedRows] = useState([]);
  const [managedForm, setManagedForm] = useState(() => getTableTemplate('homeChefs'));
  const [editRow, setEditRow] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [superAdminMessage, setSuperAdminMessage] = useState('');
  const [superAdminSection, setSuperAdminSection] = useState('overview');
  const visibleNavItems = useMemo(
    () => getVisibleNavItemsForRole(adminSession?.role, navItems),
    [adminSession?.role],
  );
  const activeLabel = useMemo(() => {
    if (active === 'superAdmin') {
      return 'Super Admin Dashboard';
    }

    return visibleNavItems.find(item => item.key === active)?.label || 'Dashboard';
  }, [active, visibleNavItems]);
  const superAdminNavSections = {
    dashboard: 'overview',
    homeChefs: 'homeChefsList',
    schedule: 'schedule',
  };
  const handleNavClick = key => {
    localStorage.setItem(activeTabStorageKey, key);

    if (adminSession?.role === 'super_admin' && superAdminNavSections[key]) {
      setSuperAdminSection(superAdminNavSections[key]);
      setActive('superAdmin');
      return;
    }

    setActive(key);
  };
  const isNavActive = key => {
    if (active === 'superAdmin' && adminSession?.role === 'super_admin') {
      const sectionNavKey = Object.entries(superAdminNavSections).find(
        ([, section]) => section === superAdminSection,
      )?.[0];

      return key === (sectionNavKey || 'dashboard');
    }

    return key === active;
  };

  const getOperationToken = () => adminSession?.token || superAdminToken || '';
  const ensureOperationToken = () => {
    const token = getOperationToken();

    if (!token) {
      setSuperAdminMessage('Session expired. Please login again.');
      handleLogout();
      return '';
    }

    return token;
  };

  const refreshAdminDashboard = async token => {
    const payload = await adminRequest('/api/admin/dashboard', {
      token: token || getOperationToken(),
    });

    setAdminData(payload.data || payload);
    setApiStatus('Live API response loaded from Node backend');
    return payload.data || payload;
  };

  const updateOrderInState = updatedOrder => {
    setAdminData(current => ({
      ...current,
      orders: (current.orders || []).map(order =>
        (order.id || order.orderId) === updatedOrder.orderId
          ? {
              ...order,
              ...updatedOrder,
              id: updatedOrder.orderId,
              deliveryPartnerName: updatedOrder.riderName,
              deliveryPartnerPhone: updatedOrder.riderPhone,
              deliveryPartnerEmail: updatedOrder.riderEmail,
            }
          : order,
      ),
    }));
  };

  const handleAdminLogin = async event => {
    event.preventDefault();
    setSuperAdminMessage('Checking role...');

    try {
      let session;

      try {
        const result = await adminRequest('/api/super-admin/login', {
          method: 'POST',
          body: loginForm,
        });

        session = {
          role: result.admin.role,
          token: result.token,
          user: result.admin,
        };
        setSuperAdmin(result.admin);
        setSuperAdminToken(result.token);
      } catch (superAdminError) {
        const result = await adminRequest('/api/auth/login', {
          method: 'POST',
          body: loginForm,
        });

        session = {
          role: result.user.role,
          token: result.token,
          user: result.user,
        };
        setSuperAdmin(null);
        setSuperAdminToken('');
      }

      localStorage.setItem('middoAdminSession', JSON.stringify(session));
      localStorage.removeItem('middoSuperAdmin');
      localStorage.removeItem('middoSuperAdminToken');
      localStorage.setItem(activeTabStorageKey, getLandingTabForRole(session.role));
      setAdminSession(session);
      setSuperAdminSection('overview');
      setActive(getLandingTabForRole(session.role));
      setSuperAdminMessage(`Login successful as ${session.role}`);

      // Always refresh dashboard data after login for all roles
      try {
        await refreshAdminDashboard(session.token);
      } catch (_err) {
        // non-fatal
      }

      if (session.role === 'super_admin') {
        const [products, tableRows, categoryRows, admins, scheduleRows, homeChefRows, subscriptionRows, planRows] = await Promise.all([
          adminRequest('/api/super-admin/products', {token: session.token}),
          adminRequest(`/api/super-admin/tables/${selectedTable}`, {token: session.token}),
          adminRequest('/api/super-admin/tables/categories', {token: session.token}),
          adminRequest('/api/super-admin/admins', {token: session.token}),
          adminRequest('/api/super-admin/tables/scheduleItems', {token: session.token}),
          adminRequest('/api/super-admin/tables/homeChefs', {token: session.token}),
          adminRequest('/api/super-admin/tables/subscriptions', {token: session.token}),
          adminRequest('/api/super-admin/tables/plans', {token: session.token}),
        ]);
        setAdminData(current => ({
          ...current,
          admins: admins.admins || [],
          categories: categoryRows.rows || [],
          chefs: homeChefRows.rows || [],
          products: products.products || [],
          scheduleItems: scheduleRows.rows || [],
          subscriptions: subscriptionRows.rows || current.subscriptions || [],
          plans: planRows.rows || current.plans || [],
        }));
        setManagedRows(tableRows.rows || []);
      }
    } catch (error) {
      setSuperAdminMessage(error.message);
    }
  };

  const handleRegister = async event => {
    event.preventDefault();
    setSuperAdminMessage('Creating account...');

    try {
      const result = await adminRequest('/api/auth/register', {
        method: 'POST',
        body: registerForm,
      });
      const session = {
        role: result.user.role,
        token: result.token,
        user: result.user,
      };

      localStorage.setItem('middoAdminSession', JSON.stringify(session));
      localStorage.setItem(activeTabStorageKey, getLandingTabForRole(session.role));
      setAdminSession(session);
      setSuperAdmin(null);
      setSuperAdminToken('');
      setSuperAdminSection('overview');
      setActive(getLandingTabForRole(session.role));
      setSuperAdminMessage(`Registered successfully as ${session.role}`);
    } catch (error) {
      setSuperAdminMessage(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('middoAdminSession');
    localStorage.removeItem('middoSuperAdmin');
    localStorage.removeItem('middoSuperAdminToken');
    localStorage.removeItem(activeTabStorageKey);
    setAdminSession(null);
    setSuperAdmin(null);
    setSuperAdminToken('');
    setSuperAdminSection('overview');
    setActive('dashboard');
    setSuperAdminMessage('');
  };

  useEffect(() => {
    let mounted = true;

    refreshAdminDashboard()
      .then(() => {
        if (!mounted) {
          return;
        }
      })
      .catch(error => {
        if (!mounted) {
          return;
        }

        setApiStatus(error instanceof Error ? error.message : 'Unable to load live admin data');
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (adminSession?.role !== 'super_admin' || !superAdminToken) {
      return undefined;
    }

    let mounted = true;

    Promise.all([
      adminRequest('/api/super-admin/products', {token: superAdminToken}),
      adminRequest('/api/super-admin/tables/categories', {token: superAdminToken}),
      adminRequest('/api/super-admin/admins', {token: superAdminToken}),
      adminRequest('/api/super-admin/tables/scheduleItems', {token: superAdminToken}),
      adminRequest('/api/super-admin/tables/homeChefs', {token: superAdminToken}),
      adminRequest(`/api/super-admin/tables/${selectedTable}`, {token: superAdminToken}),
      adminRequest('/api/super-admin/tables/subscriptions', {token: superAdminToken}),
      adminRequest('/api/super-admin/tables/plans', {token: superAdminToken}),
    ])
      .then(([products, categoryRows, admins, scheduleRows, homeChefRows, tableRows, subscriptionRows, planRows]) => {
        if (!mounted) {
          return;
        }

        setAdminData(current => ({
          ...current,
          categories: categoryRows.rows || [],
          admins: admins.admins || [],
          chefs: homeChefRows.rows || [],
          products: products.products || [],
          scheduleItems: scheduleRows.rows || [],
          subscriptions: subscriptionRows.rows || current.subscriptions || [],
          plans: planRows.rows || current.plans || [],
        }));
        setManagedRows(tableRows.rows || []);
      })
      .catch(error => {
        if (mounted) {
          if (isSessionExpiredError(error)) {
            handleLogout();
          }
          setSuperAdminMessage(error.message);
        }
      });

    return () => {
      mounted = false;
    };
  }, [adminSession?.role, selectedTable, superAdminToken]);

  if (!adminSession) {
    return (
      <AdminLogin
        authMode={authMode}
        loginForm={loginForm}
        message={superAdminMessage}
        onLogin={handleAdminLogin}
        onLoginChange={setLoginForm}
        onModeChange={mode => {
          setAuthMode(mode);
          setSuperAdminMessage('');
        }}
        onRegister={handleRegister}
        onRegisterChange={setRegisterForm}
        registerForm={registerForm}
        registerRoles={registerRoles}
      />
    );
  }

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">M</span>
          <div>
            <strong>MIDDO</strong>
            <small>Admin Console</small>
          </div>
        </div>
        <nav className="nav-list">
          {visibleNavItems.map(item => (
            <button
              key={item.key}
              className={isNavActive(item.key) ? 'nav-item active' : 'nav-item'}
              onClick={() => handleNavClick(item.key)}>
              <span>{item.short}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operations</p>
            <h1>{activeLabel}</h1>
          </div>
          <div className="top-actions">
            <span className="api-pill">{apiStatus}</span>
            <span className="session-pill">{adminSession.user?.name || adminSession.user?.email}</span>
            <button onClick={handleLogout}>Logout</button>
            <button className="primary">{adminSession.role}</button>
          </div>
        </header>

        {active === 'dashboard' ? <Dashboard data={adminData} role={adminSession.role} /> : null}
        {active === 'reports' ? <Reports reports={adminData.reports} /> : null}
        {active === 'performance' ? <Performance reports={adminData.reports} /> : null}
        {active === 'commission' ? (
          <Commission
            canManage={['admin', 'super_admin'].includes(adminSession.role)}
            message={superAdminMessage}
            reports={adminData.reports}
            settings={adminData.commissionSettings}
            onSave={async settings => {
              if (!['admin', 'super_admin'].includes(adminSession.role)) {
                setSuperAdminMessage('Only admin or super admin can update commission.');
                return;
              }

              const token = ensureOperationToken();
              if (!token) {
                return;
              }

              setSuperAdminMessage('Saving commission settings...');
              try {
                const result = await adminRequest('/api/admin/commission', {
                  token,
                  method: 'PUT',
                  body: settings,
                });
                setAdminData(current => ({
                  ...current,
                  commissionSettings: result.settings,
                }));
                await refreshAdminDashboard();
                setSuperAdminMessage('Commission settings updated');
              } catch (error) {
                if (isSessionExpiredError(error)) {
                  handleLogout();
                }
                setSuperAdminMessage(error.message);
              }
            }}
          />
        ) : null}
        {active === 'kyc' ? (
          <PartnerKyc
            data={adminData}
            onReviewKyc={async (partner, status, reason = '') => {
              if (!['admin', 'super_admin'].includes(adminSession.role)) {
                setSuperAdminMessage('Only admin or super admin can review KYC.');
                return;
              }

              if (status === 'Rejected' && !reason.trim()) {
                setSuperAdminMessage('KYC reject karne ke liye reason required hai.');
                return;
              }

              const token = ensureOperationToken();
              if (!token) {
                return;
              }

              setSuperAdminMessage(`${status} KYC for ${partner.name}...`);
              try {
                await adminRequest(`/api/admin/partners/${partner._id}/kyc`, {
                  token,
                  method: 'PATCH',
                  body: {
                    status,
                    note: status === 'Approved' ? 'Verified by admin' : reason.trim(),
                  },
                });
                await refreshAdminDashboard();
                setSuperAdminMessage(`${partner.name} KYC ${status.toLowerCase()}.`);
              } catch (error) {
                if (isSessionExpiredError(error)) {
                  handleLogout();
                }
                setSuperAdminMessage(error.message);
              }
            }}
          />
        ) : null}
        {active === 'orders' ? (
          <Orders
            canAssign={['admin', 'super_admin'].includes(adminSession.role)}
            canUpdateTracking={['admin', 'super_admin'].includes(adminSession.role)}
            orders={adminData.orders}
            riders={adminData.riders || []}
            vendors={adminData.vendors || []}
            onAssignVendor={async (orderId, vendor) => {
              if (!['admin', 'super_admin'].includes(adminSession.role)) {
                setSuperAdminMessage('Only admin or super admin can assign vendors.');
                return;
              }
              if (vendor.kitchenOpen === false || vendor.status !== 'Approved') {
                setSuperAdminMessage(`${vendor.name} kitchen OFF hai. Order assign nahi ho sakta.`);
                return;
              }

              const token = ensureOperationToken();
              if (!token) {
                return;
              }

              setSuperAdminMessage(`Assigning vendor ${vendor.name} to ${orderId}...`);
              try {
                const result = await adminRequest(`/api/admin/orders/${orderId}/assign-vendor`, {
                  token,
                  method: 'PATCH',
                  body: {
                    chef: vendor.name,
                    homeChefId: vendor._id,
                    homeChefName: vendor.name,
                    homeChefOwner: vendor._id,
                  },
                });
                updateOrderInState(result.order);
                await refreshAdminDashboard();
                setSuperAdminMessage(
                  result.notificationPushed
                    ? `${orderId} assigned to ${vendor.name}. Push sent.`
                    : `${orderId} assigned to ${vendor.name}. Push not sent: ${result.notificationReason || 'token/config missing'}. In-app alert saved.`,
                );
              } catch (error) {
                if (isSessionExpiredError(error)) {
                  handleLogout();
                }
                setSuperAdminMessage(error.message);
              }
            }}
            onAssignRider={async (orderId, rider, assignment) => {
              if (!['admin', 'super_admin'].includes(adminSession.role)) {
                setSuperAdminMessage('Only admin or super admin can assign riders.');
                return;
              }
              if (rider.isOnline === false || rider.status !== 'Active') {
                setSuperAdminMessage(`${rider.name} offline hai. Order assign nahi ho sakta.`);
                return;
              }

              const token = ensureOperationToken();
              if (!token) {
                return;
              }

              setSuperAdminMessage(`Assigning rider ${rider.name} to ${orderId}...`);
              try {
                const result = await adminRequest(`/api/admin/orders/${orderId}/assign-rider`, {
                  token,
                  method: 'PATCH',
                  body: {
                    deliveryBatchId: `BATCH-${new Date().toISOString().slice(0, 10)}`,
                    deliverySequence: assignment.deliverySequence || 1,
                    riderEmail: rider.email,
                    riderId: rider._id,
                    riderName: rider.name,
                    riderPhone: rider.phone,
                  },
                });
                updateOrderInState(result.order);
                await refreshAdminDashboard();
                setSuperAdminMessage(
                  result.notificationPushed
                    ? `${orderId} assigned to ${rider.name}. Push sent.`
                    : `${orderId} assigned to ${rider.name}. Push not sent: ${result.notificationReason || 'token/config missing'}. In-app alert saved.`,
                );
              } catch (error) {
                if (isSessionExpiredError(error)) {
                  handleLogout();
                }
                setSuperAdminMessage(error.message);
              }
            }}
            onStatusChange={async (orderId, status) => {
              if (!['admin', 'super_admin'].includes(adminSession.role)) {
                setSuperAdminMessage('Only admin or super admin can update order tracking.');
                return;
              }

              const token = ensureOperationToken();
              if (!token) {
                return;
              }

              setSuperAdminMessage(`Updating ${orderId} tracking...`);
              try {
                const result = await adminRequest(`/api/admin/orders/${orderId}/status`, {
                  token,
                  method: 'PATCH',
                  body: {status},
                });
                updateOrderInState(result.order);
                setSuperAdminMessage(`${orderId} tracking updated to ${status}`);
              } catch (error) {
                if (isSessionExpiredError(error)) {
                  handleLogout();
                }
                setSuperAdminMessage(error.message);
              }
            }}
          />
        ) : null}
        {active === 'subscriptions' ? (
          <Subscriptions
            canExpire={adminSession.role === 'super_admin'}
            subscriptions={adminData.subscriptions}
            onExpireSubscription={async subscription => {
              if (adminSession.role !== 'super_admin') {
                setSuperAdminMessage('Only super admin can expire subscriptions.');
                return;
              }

              setSuperAdminMessage(`Expiring ${subscription.customer || 'subscription'}...`);
              try {
                const result = await adminRequest(`/api/super-admin/subscriptions/${subscription._id}/expire`, {
                  token: superAdminToken,
                  method: 'PATCH',
                });
                setAdminData(current => ({
                  ...current,
                  subscriptions: (current.subscriptions || []).map(row =>
                    row._id === subscription._id ? result.row : row,
                  ),
                }));
                setSuperAdminMessage('Subscription expired');
              } catch (error) {
                if (isSessionExpiredError(error)) {
                  handleLogout();
                }
                setSuperAdminMessage(error.message);
              }
            }}
          />
        ) : null}
        {active === 'homeChefs' ? (
          <HomeChefs
            canEdit={['admin', 'super_admin'].includes(adminSession.role)}
            chefs={adminData.chefs || []}
            onDeleteChef={async chef => {
              if (!chef?._id || !window.confirm(`Delete HomeChef "${chef.name || 'profile'}"?`)) return;
              const token = ensureOperationToken();
              if (!token) return;
              try {
                const managePath = adminSession.role === 'super_admin'
                  ? `/api/super-admin/tables/homeChefs/${chef._id}`
                  : `/api/admin/partners/manage/homeChefs/${chef._id}`;
                await adminRequest(managePath, {
                  token,
                  method: 'DELETE',
                });
                setAdminData(current => ({
                  ...current,
                  chefs: (current.chefs || []).filter(item => item._id !== chef._id),
                }));
                setSuperAdminMessage(`HomeChef deleted: ${chef.name || chef._id}`);
              } catch (error) {
                if (isSessionExpiredError(error)) handleLogout();
                setSuperAdminMessage(error.message);
              }
            }}
            onEditChef={chef => {
              setEditRow({table: 'homeChefs', row: chef});
              setEditValues(getEditableRowValues(chef));
            }}
          />
        ) : null}
        {active === 'customers' ? (
          <Customers
            canEdit={['admin', 'super_admin'].includes(adminSession.role)}
            customers={adminData.customers}
            onDeleteCustomer={async customer => {
              if (!customer?._id || !window.confirm(`Delete customer "${customer.name || 'profile'}"?`)) return;
              const token = ensureOperationToken();
              if (!token) return;
              try {
                const managePath = adminSession.role === 'super_admin'
                  ? `/api/super-admin/tables/customers/${customer._id}`
                  : `/api/admin/partners/manage/customers/${customer._id}`;
                await adminRequest(managePath, {
                  token,
                  method: 'DELETE',
                });
                setAdminData(current => ({
                  ...current,
                  customers: (current.customers || []).filter(item => item._id !== customer._id),
                }));
                setSuperAdminMessage(`Customer deleted: ${customer.name || customer._id}`);
              } catch (error) {
                if (isSessionExpiredError(error)) handleLogout();
                setSuperAdminMessage(error.message);
              }
            }}
            onEditCustomer={customer => {
              setEditRow({table: 'customers', row: customer});
              setEditValues(getEditableRowValues(customer));
            }}
          />
        ) : null}
        {active === 'schedule' ? (
          <Schedule
            canEdit={adminSession.role === 'super_admin'}
            scheduleItems={adminData.scheduleItems || []}
            onEditSchedule={day => {
              setEditRow({table: 'scheduleItems', row: day});
              setEditValues(getEditableRowValues(day));
            }}
          />
        ) : null}
        {active === 'admins' ? (
          <Admins
            adminForm={adminForm}
            admins={adminData.admins || []}
            message={superAdminMessage}
            onAdminFormChange={setAdminForm}
            onCreateAdmin={async event => {
              event.preventDefault();
              setSuperAdminMessage('Creating user...');
              try {
                const result = await adminRequest('/api/super-admin/admins', {
                  token: superAdminToken,
                  method: 'POST',
                  body: adminForm,
                });
                setAdminData(current => ({
                  ...current,
                  admins: [result.admin, ...(current.admins || [])],
                }));
                setAdminForm(initialAdminForm);
                setSuperAdminMessage(`User created: ${result.admin.email}`);
              } catch (error) {
                if (isSessionExpiredError(error)) {
                  handleLogout();
                }
                setSuperAdminMessage(error.message);
              }
            }}
            onDeleteAdmin={async admin => {
              if (!admin?._id || !window.confirm(`Delete user ${admin.email}?`)) {
                return;
              }

              setSuperAdminMessage(`Deleting ${admin.email}...`);
              try {
                await adminRequest(`/api/super-admin/admins/${admin._id}`, {
                  token: superAdminToken,
                  method: 'DELETE',
                });
                setAdminData(current => ({
                  ...current,
                  admins: (current.admins || []).filter(item => item._id !== admin._id),
                }));
                setSuperAdminMessage(`User deleted: ${admin.email}`);
              } catch (error) {
                if (isSessionExpiredError(error)) {
                  handleLogout();
                }
                setSuperAdminMessage(error.message);
              }
            }}
            onEditAdmin={admin => {
              setEditRow({table: 'admins', row: {...admin, password: ''}});
              setEditValues(getEditableRowValues({...admin, password: ''}));
            }}
          />
        ) : null}
        {active === 'plans' ? (
          <Plans
            canManage={['admin', 'super_admin'].includes(adminSession.role)}
            message={superAdminMessage}
            planForm={planForm}
            plans={adminData.plans || []}
            onPlanFormChange={setPlanForm}
            onCreatePlan={async event => {
              event.preventDefault();
              setSuperAdminMessage('Creating plan...');
              const token = ensureOperationToken();
              if (!token) return;
              try {
                const result = await adminRequest('/api/super-admin/tables/plans', {
                  token,
                  method: 'POST',
                  body: planForm,
                });
                setAdminData(current => ({
                  ...current,
                  plans: [result.row, ...(current.plans || [])],
                }));
                setPlanForm(initialPlanForm);
                setSuperAdminMessage(`Plan created: ${result.row?.name || planForm.name}`);
              } catch (error) {
                if (isSessionExpiredError(error)) handleLogout();
                setSuperAdminMessage(error.message);
              }
            }}
            onEditPlan={plan => {
              setEditRow({table: 'plans', row: plan});
              setEditValues(getEditableRowValues(plan));
            }}
            onDeletePlan={async plan => {
              if (!plan?._id || !window.confirm(`Delete plan "${plan.name}"?`)) return;
              setSuperAdminMessage(`Deleting plan ${plan.name}...`);
              const token = ensureOperationToken();
              if (!token) return;
              try {
                await adminRequest(`/api/super-admin/tables/plans/${plan._id}`, {
                  token,
                  method: 'DELETE',
                });
                setAdminData(current => ({
                  ...current,
                  plans: (current.plans || []).filter(p => p._id !== plan._id),
                }));
                setSuperAdminMessage(`Plan deleted: ${plan.name}`);
              } catch (error) {
                if (isSessionExpiredError(error)) handleLogout();
                setSuperAdminMessage(error.message);
              }
            }}
          />
        ) : null}
        {active === 'wallet' ? <Wallet reports={adminData.reports} walletRows={adminData.walletTransactions || []} /> : null}
        {active === 'reviews' ? <Reviews reviews={adminData.reviews || []} /> : null}
        {active === 'support' ? <Support tickets={adminData.supportTickets || []} /> : null}
        {active === 'notifications' ? <Notifications notifications={adminData.notifications || []} /> : null}
        {active === 'superAdmin' ? (
          <SuperAdmin
            categoryForm={categoryForm}
            admins={adminData.admins || []}
            loginForm={loginForm}
            managedForm={managedForm}
            managedRows={managedRows}
            managedTables={managedTables}
            message={superAdminMessage}
            categories={adminData.categories}
            homeChefForm={homeChefForm}
            homeChefs={adminData.chefs || []}
            products={adminData.products}
            scheduleItems={adminData.scheduleItems || []}
            selectedTable={selectedTable}
            superAdmin={superAdmin}
            activeSection={superAdminSection}
            onCategoryChange={setCategoryForm}
            onSectionChange={setSuperAdminSection}
            onManagedFormChange={setManagedForm}
            onLoginChange={setLoginForm}
            onLogout={() => {
              handleLogout();
            }}
            onHomeChefChange={setHomeChefForm}
            onPermissionsChange={permissions => {
              setSuperAdmin(current => ({...current, permissions}));
            }}
            onSavePermissions={async permissions => {
              setSuperAdminMessage('Saving permissions...');
              try {
                const result = await adminRequest('/api/super-admin/permissions', {
                  token: superAdminToken,
                  method: 'PUT',
                  body: {permissions},
                });
                const updatedSession = {
                  ...adminSession,
                  user: result.admin,
                };
                localStorage.setItem('middoAdminSession', JSON.stringify(updatedSession));
                setAdminSession(updatedSession);
                setSuperAdmin(result.admin);
                setSuperAdminMessage('Permissions updated successfully');
              } catch (error) {
                if (isSessionExpiredError(error)) {
                  handleLogout();
                }
                setSuperAdminMessage(error.message);
              }
            }}
            onTableChange={async table => {
              setSelectedTable(table);
              setManagedForm(getTableTemplate(table));
              setSuperAdminMessage(`Loading ${table}...`);
              try {
                const result = await adminRequest(`/api/super-admin/tables/${table}`, {
                  token: superAdminToken,
                });
                setManagedRows(result.rows || []);
                setSuperAdminMessage(`${table} loaded`);
              } catch (error) {
                if (isSessionExpiredError(error)) {
                  handleLogout();
                }
                setManagedRows([]);
                setSuperAdminMessage(error.message);
              }
            }}
            onCreateManagedRow={async event => {
              event.preventDefault();
              setSuperAdminMessage(`Creating ${selectedTable} row...`);
              try {
                const body = JSON.parse(managedForm);
                const result = await adminRequest(`/api/super-admin/tables/${selectedTable}`, {
                  token: superAdminToken,
                  method: 'POST',
                  body,
                });
                setManagedRows(current => [result.row, ...current]);
                if (selectedTable === 'products') {
                  setAdminData(current => ({
                    ...current,
                    products: [result.row, ...(current.products || [])],
                  }));
                }
                if (selectedTable === 'categories') {
                  setAdminData(current => ({
                    ...current,
                    categories: [result.row, ...(current.categories || [])],
                  }));
                }
                if (selectedTable === 'homeChefs') {
                  setAdminData(current => ({
                    ...current,
                    chefs: [result.row, ...(current.chefs || [])],
                  }));
                }
                if (selectedTable === 'scheduleItems') {
                  setAdminData(current => ({
                    ...current,
                    scheduleItems: [result.row, ...(current.scheduleItems || [])],
                  }));
                }
                setManagedForm(getTableTemplate(selectedTable));
                setSuperAdminMessage(`${selectedTable} row created`);
              } catch (error) {
                if (isSessionExpiredError(error)) {
                  handleLogout();
                }
                setSuperAdminMessage(
                  error instanceof SyntaxError ? 'JSON format is invalid' : error.message,
                );
              }
            }}
            onCreateCategory={async event => {
              event.preventDefault();
              setSuperAdminMessage('Creating category...');
              try {
                const category = await adminRequest('/api/super-admin/categories', {
                  token: superAdminToken,
                  method: 'POST',
                  body: categoryForm,
                });
                setCategoryForm(initialCategoryForm);
                setAdminData(current => ({
                  ...current,
                  categories: [category.category, ...(current.categories || [])],
                }));
                if (selectedTable === 'categories') {
                  setManagedRows(current => [category.category, ...current]);
                }
                setSuperAdminMessage(`Category created: ${category.category.label}`);
              } catch (error) {
                if (isSessionExpiredError(error)) {
                  handleLogout();
                }
                setSuperAdminMessage(error.message);
              }
            }}
            onDeleteManagedRow={async (table, row) => {
              if (!row?._id || !window.confirm(`Delete ${getRowLabel(row)}?`)) {
                return;
              }

              setSuperAdminMessage(`Deleting ${getRowLabel(row)}...`);
              try {
                await adminRequest(`/api/super-admin/tables/${table}/${row._id}`, {
                  token: superAdminToken,
                  method: 'DELETE',
                });
                setManagedRows(current => current.filter(item => item._id !== row._id));
                if (table === 'products') {
                  setAdminData(current => ({
                    ...current,
                    products: (current.products || []).filter(item => item._id !== row._id),
                  }));
                }
                if (table === 'categories') {
                  setAdminData(current => ({
                    ...current,
                    categories: (current.categories || []).filter(item => item._id !== row._id),
                  }));
                }
                if (table === 'homeChefs') {
                  setAdminData(current => ({
                    ...current,
                    chefs: (current.chefs || []).filter(item => item._id !== row._id),
                  }));
                }
                if (table === 'scheduleItems') {
                  setAdminData(current => ({
                    ...current,
                    scheduleItems: (current.scheduleItems || []).filter(item => item._id !== row._id),
                  }));
                }
                setSuperAdminMessage(`${getRowLabel(row)} deleted`);
              } catch (error) {
                if (isSessionExpiredError(error)) {
                  handleLogout();
                }
                setSuperAdminMessage(error.message);
              }
            }}
            onUpdateManagedRow={async (table, row) => {
              setEditRow({table, row});
              const nextValues = getEditableRowValues(row);
              if (table === 'homeChefChangeRequests') {
                setEditValues({
                  ...nextValues,
                  assignedChefId: nextValues.assignedChefId || '',
                  assignedChefName: nextValues.assignedChefName || '',
                  requestedChefId: nextValues.requestedChefId || '',
                  requestedChefName: nextValues.requestedChefName || '',
                  adminNote: nextValues.adminNote || '',
                });
                return;
              }

              setEditValues(nextValues);
            }}
            onCreateHomeChef={async event => {
              event.preventDefault();
              setSuperAdminMessage('Creating HomeChef...');
              try {
                const categoryOptions = getCategoryOptions(adminData.categories);
                const selectedCategory = homeChefForm.cuisine || categoryOptions[0].label;
                const category = categoryOptions.find(item => item.label === selectedCategory);
                const tags = String(homeChefForm.tags || selectedCategory)
                  .split(',')
                  .map(item => item.trim())
                  .filter(Boolean);
                const parsedWeeklyMenu = Array.isArray(homeChefForm.weeklyMenu)
                  ? homeChefForm.weeklyMenu
                  : JSON.parse(homeChefForm.weeklyMenu || '[]');

                if (!Array.isArray(parsedWeeklyMenu)) {
                  throw new Error('Weekly menu must be a JSON array');
                }

                const parsedSampleMenu = Array.isArray(homeChefForm.sampleMenu)
                  ? homeChefForm.sampleMenu
                  : JSON.parse(homeChefForm.sampleMenu || '[]');

                if (!Array.isArray(parsedSampleMenu)) {
                  throw new Error('Sample menu must be a JSON array');
                }

                const homeChefPayload = {
                  ...homeChefForm,
                  cuisine: selectedCategory,
                  image: homeChefForm.image || category?.icon || '🍱',
                  tags: [...new Set([selectedCategory, ...tags])],
                  orders: homeChefForm.orders === '' ? 0 : Number(homeChefForm.orders),
                  latitude: homeChefForm.latitude === '' ? undefined : Number(homeChefForm.latitude),
                  longitude: homeChefForm.longitude === '' ? undefined : Number(homeChefForm.longitude),
                  liveAddress: homeChefForm.liveAddress || homeChefForm.address || homeChefForm.location,
                  reviewCount:
                    homeChefForm.reviewCount === '' ? 0 : Number(homeChefForm.reviewCount),
                  status: homeChefForm.status || productStatusOptions[0],
                  weeklyMenu: parsedWeeklyMenu,
                  sampleMenu: parsedSampleMenu,
                };
                const result = await adminRequest('/api/super-admin/tables/homeChefs', {
                  token: superAdminToken,
                  method: 'POST',
                  body: homeChefPayload,
                });
                setAdminData(current => ({
                  ...current,
                  chefs: [result.row, ...(current.chefs || [])],
                }));
                if (selectedTable === 'homeChefs') {
                  setManagedRows(current => [result.row, ...current]);
                }
                setHomeChefForm(initialHomeChefForm);
                setSuperAdminMessage(`HomeChef created: ${result.row.name}`);
              } catch (error) {
                if (isSessionExpiredError(error)) {
                  handleLogout();
                }
                setSuperAdminMessage(error.message);
              }
            }}
            onLogin={async event => {
              await handleAdminLogin(event);
            }}
          />
        ) : null}
        {editRow ? (
          <EditRowModal
            categories={adminData.categories}
            homeChefs={adminData.chefs || []}
            row={editRow.row}
            table={editRow.table}
            values={editValues}
            onChange={(key, value) => setEditValues(current => ({...current, [key]: value}))}
            onClose={() => {
              setEditRow(null);
              setEditValues({});
            }}
            onSubmit={async event => {
              event.preventDefault();
              setSuperAdminMessage(`Updating ${getRowLabel(editRow.row)}...`);

              try {
                if (editRow.table === 'admins') {
                  const result = await adminRequest(
                    `/api/super-admin/admins/${editRow.row._id}`,
                    {
                      token: superAdminToken,
                      method: 'PUT',
                      body: buildEditedPayload(editValues, editRow.row),
                    },
                  );
                  const updatedAdmin = result.admin;

                  setAdminData(current => ({
                    ...current,
                    admins: (current.admins || []).map(item =>
                      item._id === updatedAdmin._id ? updatedAdmin : item,
                    ),
                  }));
                  setEditRow(null);
                setEditValues({});
                  setSuperAdminMessage(`User updated: ${updatedAdmin.email}`);
                  return;
                }

                if (editRow.table === 'scheduleItems') {
                  const payload = buildEditedPayload(editValues, editRow.row);
                  const targetDay = String(payload.day || editRow.row.day || '').toUpperCase().slice(0, 3);
                  const result = await adminRequest(
                    `/api/home/schedule/${targetDay}`,
                    {
                      token: superAdminToken,
                      method: 'PUT',
                      body: payload,
                    },
                  );
                  const updatedSchedule = result.scheduleItem;

                  setManagedRows(current =>
                    current.some(item => item._id === updatedSchedule._id)
                      ? current.map(item => (item._id === updatedSchedule._id ? updatedSchedule : item))
                      : [updatedSchedule, ...current],
                  );
                  setAdminData(current => ({
                    ...current,
                    scheduleItems: (current.scheduleItems || []).some(
                      item => item._id === updatedSchedule._id,
                    )
                      ? (current.scheduleItems || []).map(item =>
                          item._id === updatedSchedule._id ? updatedSchedule : item,
                        )
                      : [updatedSchedule, ...(current.scheduleItems || [])],
                  }));
                  setEditRow(null);
                  setEditValues({});
                  setSuperAdminMessage(`${updatedSchedule.day} meal updated`);
                  return;
                }

                const result = await adminRequest(
                  adminSession.role === 'super_admin'
                    ? `/api/super-admin/tables/${editRow.table}/${editRow.row._id}`
                    : `/api/admin/partners/manage/${editRow.table}/${editRow.row._id}`,
                  {
                    token: superAdminToken,
                    method: 'PUT',
                    body: buildEditedPayload(editValues, editRow.row),
                  },
                );
                const updatedRow = result.row;

                setManagedRows(current =>
                  current.map(item => (item._id === updatedRow._id ? updatedRow : item)),
                );
                if (editRow.table === 'products') {
                  setAdminData(current => ({
                    ...current,
                    products: (current.products || []).map(item =>
                      item._id === updatedRow._id ? updatedRow : item,
                    ),
                  }));
                }
                if (editRow.table === 'categories') {
                  setAdminData(current => ({
                    ...current,
                    categories: (current.categories || []).map(item =>
                      item._id === updatedRow._id ? updatedRow : item,
                    ),
                  }));
                }
                if (editRow.table === 'homeChefs') {
                  setAdminData(current => ({
                    ...current,
                    chefs: (current.chefs || []).map(item =>
                      item._id === updatedRow._id ? updatedRow : item,
                    ),
                  }));
                }
                if (editRow.table === 'plans') {
                  setAdminData(current => ({
                    ...current,
                    plans: (current.plans || []).map(item =>
                      item._id === updatedRow._id ? updatedRow : item,
                    ),
                  }));
                }
                if (editRow.table === 'customers') {
                  setAdminData(current => ({
                    ...current,
                    customers: (current.customers || []).map(item =>
                      item._id === updatedRow._id ? updatedRow : item,
                    ),
                  }));
                }
                if (editRow.table === 'subscriptions') {
                  setAdminData(current => ({
                    ...current,
                    subscriptions: (current.subscriptions || []).map(item =>
                      item._id === updatedRow._id ? updatedRow : item,
                    ),
                  }));
                }
                if (editRow.table === 'scheduleItems') {
                  setAdminData(current => ({
                    ...current,
                    scheduleItems: (current.scheduleItems || []).map(item =>
                      item._id === updatedRow._id ? updatedRow : item,
                    ),
                  }));
                }
                setEditRow(null);
                setEditValues({});
                setSuperAdminMessage(`${getRowLabel(updatedRow)} updated`);
              } catch (error) {
                if (isSessionExpiredError(error)) {
                  handleLogout();
                }
                setSuperAdminMessage(error.message);
              }
            }}
          />
        ) : null}
      </section>
    </main>
  );
}
