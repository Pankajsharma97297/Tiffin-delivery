import React, {useState} from 'react';
import {allPermissionKeys, permissionActions, permissionGroups, productIconOptions, productStatusOptions, productTagOptions} from '../../constants/adminConfig';
import {DataTable} from '../../components/common/DataTable';
import {Panel} from '../../components/common/Panel';
import {RowActions} from '../../components/common/RowActions';
import {WeeklyMenuEditor} from '../../components/common/WeeklyMenuEditor';
import {getCategoryOptions} from '../../utils/adminUtils';
import {resolveImageUri} from '../../utils/imageUrl';

export function SuperAdmin({
  activeSection: controlledActiveSection,
  admins,
  categoryForm,
  categories,
  loginForm,
  managedForm,
  managedRows,
  managedTables,
  message,
  onCategoryChange,
  onCreateCategory,
  onCreateHomeChef,
  onCreateManagedRow,
  onDeleteManagedRow,
  onHomeChefChange,
  onLogin,
  onLoginChange,
  onLogout,
  onManagedFormChange,
  onPermissionsChange,
  onSavePermissions,
  onSectionChange,
  onTableChange,
  onUpdateManagedRow,
  homeChefForm,
  homeChefs,
  products,
  scheduleItems,
  selectedTable,
  superAdmin,
}) {
  const [localActiveSection, setLocalActiveSection] = useState('overview');
  const [locationMessage, setLocationMessage] = useState('');
  const activeSection = controlledActiveSection || localActiveSection;
  const setActiveSection = section => {
    if (onSectionChange) {
      onSectionChange(section);
      return;
    }

    setLocalActiveSection(section);
  };
  const reverseGeocodeLocation = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
      );
      const data = await response.json();
      const address = data.address || {};
      const area = [
        address.suburb || address.neighbourhood || address.village || address.town || address.city_district,
        address.city || address.town || address.state_district,
        address.state,
      ].filter(Boolean).join(', ');

      return {
        liveAddress: data.display_name || area || `Live location: ${latitude}, ${longitude}`,
        location: area || data.name || `Live location: ${latitude}, ${longitude}`,
      };
    } catch {
      return {
        liveAddress: `Live location: ${latitude}, ${longitude}`,
        location: `Live location: ${latitude}, ${longitude}`,
      };
    }
  };

  const captureHomeChefLocation = () => {
    if (!navigator.geolocation?.getCurrentPosition) {
      setLocationMessage('Browser location is not available.');
      return;
    }

    setLocationMessage('Capturing current location...');
    navigator.geolocation.getCurrentPosition(
      async position => {
        const latitude = Number(position.coords.latitude.toFixed(6));
        const longitude = Number(position.coords.longitude.toFixed(6));
        const resolvedLocation = await reverseGeocodeLocation(latitude, longitude);

        onHomeChefChange({
          ...homeChefForm,
          latitude,
          longitude,
          location: resolvedLocation.location,
          liveAddress: resolvedLocation.liveAddress,
          address: resolvedLocation.liveAddress,
        });
        setLocationMessage(`Location captured: ${latitude}, ${longitude}`);
      },
      () => setLocationMessage('Location permission denied or unavailable.'),
      {enableHighAccuracy: true, timeout: 8000, maximumAge: 60000},
    );
  };

  if (!superAdmin) {
    return (
      <Panel title="Super Admin Login">
        <form className="admin-form compact" onSubmit={onLogin}>
          <label>
            Email
            <input
              value={loginForm.email}
              onChange={event => onLoginChange({...loginForm, email: event.target.value})}
              type="email"
            />
          </label>
          <label>
            Password
            <input
              value={loginForm.password}
              onChange={event => onLoginChange({...loginForm, password: event.target.value})}
              type="password"
            />
          </label>
          <button className="form-primary">Login</button>
          {message ? <p className="form-message">{message}</p> : null}
        </form>
      </Panel>
    );
  }

  const categoryOptions = getCategoryOptions(categories);
  const selectedCategory =
    categoryOptions.find(category => category.label === homeChefForm.cuisine) || categoryOptions[0];
  const activePermissions = superAdmin.permissions || [];
  const setPermissions = permissions => {
    onPermissionsChange([...new Set(permissions)].filter(permission => allPermissionKeys.includes(permission)));
  };
  const togglePermission = permission => {
    setPermissions(
      activePermissions.includes(permission)
        ? activePermissions.filter(item => item !== permission)
        : [...activePermissions, permission],
    );
  };
  const setGroupPermissions = (group, mode) => {
    const withoutGroup = activePermissions.filter(permission => !group.permissions.includes(permission));

    if (mode === 'full') {
      setPermissions([...withoutGroup, ...group.permissions]);
      return;
    }

    if (mode === 'read') {
      setPermissions([...withoutGroup, `${group.key}:read`]);
      return;
    }

    setPermissions(withoutGroup);
  };
  const sections = [
    {key: 'overview', label: 'Overview'},
    {key: 'homechef', label: 'Add HomeChef'},
    {key: 'permissions', label: 'Permissions'},
    {key: 'database', label: 'Database'},
    {key: 'schedule', label: 'Weekly Schedule'},
    {key: 'categories', label: 'Categories'},
    {key: 'homeChefsList', label: 'HomeChefs'},
    {key: 'changeRequests', label: 'Change Requests'},
  ];
  const getMenuItems = menu => (Array.isArray(menu) ? menu : []);
  const getCountMap = (items, getKey) =>
    (items || []).reduce((counts, item) => {
      const key = getKey(item) || 'Unknown';
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
  const toChartRows = counts =>
    Object.entries(counts)
      .map(([label, value]) => ({label, value}))
      .sort((left, right) => right.value - left.value);
  const homeChefStatusRows = toChartRows(
    getCountMap(homeChefs, chef => chef.status || (chef.isActive === false ? 'Inactive' : 'Active')),
  );
  const roleRows = toChartRows(getCountMap(admins, user => user.role));
  const categoryRows = toChartRows(getCountMap(homeChefs, chef => chef.cuisine || chef.category));
  const scheduleRows = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => {
    const item = (scheduleItems || []).find(schedule => String(schedule.day || '').toUpperCase().slice(0, 3) === day);
    return {
      label: day,
      value: item ? 1 : 0,
      title: item?.title || item?.meal || 'Not scheduled',
      status: item?.status || (item?.active ? 'Active' : 'Missing'),
    };
  });
  const maxHomeChefCategory = Math.max(1, ...categoryRows.map(row => row.value));
  const maxRoleCount = Math.max(1, ...roleRows.map(row => row.value));
  const activeHomeChefCount = (homeChefs || []).filter(chef => chef.status === 'Active' || chef.isActive === true).length;
  const totalHomeChefCount = Math.max(1, (homeChefs || []).length);
  const homeChefActivePercent = Math.round((activeHomeChefCount / totalHomeChefCount) * 100);
  const scheduleCoveragePercent = Math.round(
    (scheduleRows.filter(row => row.value).length / scheduleRows.length) * 100,
  );

  return (
    <div className="super-grid super-sectioned">
      <nav className="super-section-tabs" aria-label="Super admin sections">
        {sections.map(section => (
          <button
            key={section.key}
            type="button"
            className={activeSection === section.key ? 'active' : ''}
            onClick={() => {
              setActiveSection(section.key);
              if (section.key === 'changeRequests') {
                onTableChange('homeChefChangeRequests');
              }
            }}>
            {section.label}
          </button>
        ))}
      </nav>

      {activeSection === 'overview' ? (
      <>
      <section className="super-admin-hero">
        <div>
          <p className="eyebrow">Super Admin Control</p>
          <h2>Manage platform setup from focused sections</h2>
          <span>Add HomeChefs, menus, permissions, categories and database rows from separate screens.</span>
        </div>
        <div className="super-stats">
          <strong>{homeChefs?.length || 0}</strong>
          <span>HomeChefs</span>
        </div>
        <div className="super-stats">
          <strong>{categoryOptions.length}</strong>
          <span>Categories</span>
        </div>
        <div className="super-stats">
          <strong>{scheduleItems?.length || 0}</strong>
          <span>Schedule Days</span>
        </div>
      </section>
      <section className="super-dashboard-charts">
        <article className="chart-card chart-card-wide">
          <div className="chart-head">
            <div>
              <p className="eyebrow">Kitchen Health</p>
              <h3>HomeChef status overview</h3>
            </div>
            <strong>{homeChefActivePercent}% active</strong>
          </div>
          <div className="donut-row">
            <div
              className="donut-chart"
              style={{'--percent': `${homeChefActivePercent}%`}}
              aria-label={`${homeChefActivePercent}% active HomeChefs`}>
              <span>{homeChefActivePercent}%</span>
            </div>
            <div className="chart-list">
              {(homeChefStatusRows.length ? homeChefStatusRows : [{label: 'No data', value: 0}]).map(row => (
                <div className="chart-list-row" key={row.label}>
                  <span>{row.label}</span>
                  <b>{row.value}</b>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="chart-card">
          <div className="chart-head">
            <div>
              <p className="eyebrow">Users</p>
              <h3>Roles in database</h3>
            </div>
            <strong>{(admins || []).length}</strong>
          </div>
          <div className="bar-list">
            {(roleRows.length ? roleRows : [{label: 'No users', value: 0}]).map(row => (
              <div className="bar-row" key={row.label}>
                <div>
                  <span>{row.label.replace('_', ' ')}</span>
                  <b>{row.value}</b>
                </div>
                <i style={{width: `${Math.max(8, (row.value / maxRoleCount) * 100)}%`}} />
              </div>
            ))}
          </div>
        </article>

        <article className="chart-card">
          <div className="chart-head">
            <div>
              <p className="eyebrow">Cuisine Mix</p>
              <h3>HomeChefs by category</h3>
            </div>
            <strong>{categoryRows.length}</strong>
          </div>
          <div className="bar-list">
            {(categoryRows.length ? categoryRows : [{label: 'No category', value: 0}]).map(row => (
              <div className="bar-row accent" key={row.label}>
                <div>
                  <span>{row.label}</span>
                  <b>{row.value}</b>
                </div>
                <i style={{width: `${Math.max(8, (row.value / maxHomeChefCategory) * 100)}%`}} />
              </div>
            ))}
          </div>
        </article>

        <article className="chart-card chart-card-wide">
          <div className="chart-head">
            <div>
              <p className="eyebrow">Weekly Coverage</p>
              <h3>Schedule completion</h3>
            </div>
            <strong>{scheduleCoveragePercent}%</strong>
          </div>
          <div className="schedule-graph">
            {scheduleRows.map(row => (
              <div className={row.value ? 'schedule-day active' : 'schedule-day'} key={row.label}>
                <span>{row.label}</span>
                <i />
                <b>{row.title}</b>
                <small>{row.status}</small>
              </div>
            ))}
          </div>
        </article>
      </section>
      </>
      ) : null}

      {activeSection === 'permissions' ? (
      <Panel title="Super Admin Permissions">
        <div className="permission-card">
          <div className="permission-profile">
            <div>
              <strong>{superAdmin.name}</strong>
              <span>{superAdmin.email}</span>
            </div>
            <em>{activePermissions.length}/{allPermissionKeys.length} enabled</em>
          </div>
          <div className="permission-toolbar">
            <button type="button" onClick={() => setPermissions(allPermissionKeys)}>
              Full Access
            </button>
            <button
              type="button"
              onClick={() =>
                setPermissions(permissionGroups.map(group => `${group.key}:read`))
              }>
              Read Only
            </button>
            <button type="button" onClick={() => setPermissions([])}>
              Clear
            </button>
          </div>
          <div className="permission-manager">
            {permissionGroups.map(group => (
              <section className="permission-group" key={group.key}>
                <div className="permission-group-head">
                  <strong>{group.label}</strong>
                  <div>
                    <button type="button" onClick={() => setGroupPermissions(group, 'full')}>
                      Full
                    </button>
                    <button type="button" onClick={() => setGroupPermissions(group, 'read')}>
                      Read
                    </button>
                    <button type="button" onClick={() => setGroupPermissions(group, 'clear')}>
                      Clear
                    </button>
                  </div>
                </div>
                <div className="permission-options">
                  {permissionActions.map(action => {
                    const permission = `${group.key}:${action}`;

                    return (
                      <label key={permission}>
                        <input
                          checked={activePermissions.includes(permission)}
                          onChange={() => togglePermission(permission)}
                          type="checkbox"
                        />
                        <span>{action}</span>
                      </label>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
          <button className="form-primary" onClick={() => onSavePermissions(activePermissions)}>
            Save Permissions
          </button>
          <button onClick={onLogout}>Logout</button>
        </div>
      </Panel>
      ) : null}

      {activeSection === 'homechef' ? (
      <Panel title="Add HomeChef">
        <form className="admin-form" onSubmit={onCreateHomeChef}>
          <label>
            Kitchen Name
            <input
              required
              value={homeChefForm.name}
              onChange={event => onHomeChefChange({...homeChefForm, name: event.target.value})}
              placeholder="Kitchen name"
            />
          </label>
          <label>
            Category
            <select
              required
              value={homeChefForm.cuisine || selectedCategory?.label || ''}
              onChange={event => {
                const category = categoryOptions.find(item => item.label === event.target.value);
                const nextTags =
                  event.target.value === 'Veg' ? 'Veg, Home Style' : `Veg, ${event.target.value}`;
                onHomeChefChange({
                  ...homeChefForm,
                  cuisine: event.target.value,
                  image: category?.icon || homeChefForm.image,
                  tags: productTagOptions.includes(nextTags) ? nextTags : homeChefForm.tags,
                });
              }}>
              {categoryOptions.map(category => (
                <option key={category.label} value={category.label}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Owner
	            <input
	              required
	              value={homeChefForm.owner}
	              onChange={event => onHomeChefChange({...homeChefForm, owner: event.target.value})}
	              placeholder="Owner name"
	            />
	          </label>
	          <label>
	            Email
	            <input
	              value={homeChefForm.email}
	              onChange={event => onHomeChefChange({...homeChefForm, email: event.target.value})}
	              placeholder="HomeChef login email"
	              type="email"
	            />
	          </label>
	          <label>
	            Phone
	            <input
	              value={homeChefForm.phone}
	              onChange={event => onHomeChefChange({...homeChefForm, phone: event.target.value})}
	              placeholder="HomeChef login phone"
	            />
	          </label>
	          <label>
	            Icon
            <select
              value={homeChefForm.image}
              onChange={event => onHomeChefChange({...homeChefForm, image: event.target.value})}
            >
              {productIconOptions.map(icon => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </label>
          <label>
            Price
            <input
              required
              value={homeChefForm.price}
              onChange={event => onHomeChefChange({...homeChefForm, price: event.target.value})}
              placeholder="₹89/meal"
            />
          </label>
          <label>
            Tags
            <select
              value={homeChefForm.tags}
              onChange={event => onHomeChefChange({...homeChefForm, tags: event.target.value})}
            >
              {productTagOptions.map(tags => (
                <option key={tags} value={tags}>
                  {tags}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={homeChefForm.status}
              onChange={event => onHomeChefChange({...homeChefForm, status: event.target.value})}
            >
              {productStatusOptions.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Badge
            <input
              value={homeChefForm.badge}
              onChange={event => onHomeChefChange({...homeChefForm, badge: event.target.value})}
              placeholder="Bestseller"
            />
          </label>
          <label>
            Distance
            <input
              value={homeChefForm.distance}
              onChange={event => onHomeChefChange({...homeChefForm, distance: event.target.value})}
              placeholder="1.2 km"
            />
          </label>
          <label>
            Time
            <input
              value={homeChefForm.time}
              onChange={event => onHomeChefChange({...homeChefForm, time: event.target.value})}
              placeholder="30 min"
            />
          </label>
          <label className="wide">
            Rating
            <input
              value={homeChefForm.rating}
              onChange={event => onHomeChefChange({...homeChefForm, rating: event.target.value})}
              placeholder="4.8"
            />
          </label>
          <label>
            Review Count
            <input
              value={homeChefForm.reviewCount}
              onChange={event => onHomeChefChange({...homeChefForm, reviewCount: event.target.value})}
              placeholder="142"
              type="number"
            />
          </label>
          <label>
            Location
            <input
              value={homeChefForm.location}
              onChange={event => onHomeChefChange({...homeChefForm, location: event.target.value})}
              placeholder="Bandra West"
            />
          </label>
          <label className="wide">
            Full Address
            <textarea
              value={homeChefForm.address}
              onChange={event => onHomeChefChange({
                ...homeChefForm,
                address: event.target.value,
                liveAddress: homeChefForm.liveAddress || event.target.value,
              })}
              placeholder="Complete kitchen address"
            />
          </label>
          <label className="wide">
            Live Address
            <input
              value={homeChefForm.liveAddress}
              onChange={event => onHomeChefChange({...homeChefForm, liveAddress: event.target.value})}
              placeholder="Auto captured or verified address"
            />
          </label>
          <div className="edit-field-group wide">
            <span>Location Capture</span>
            <button className="ghost-action" type="button" onClick={captureHomeChefLocation}>
              Use Current Location
            </button>
            {locationMessage ? <small>{locationMessage}</small> : null}
          </div>
          <label>
            Experience
            <input
              value={homeChefForm.experience}
              onChange={event => onHomeChefChange({...homeChefForm, experience: event.target.value})}
              placeholder="3 yrs"
            />
          </label>
          <label>
            Subscribers
            <input
              value={homeChefForm.subscribers}
              onChange={event => onHomeChefChange({...homeChefForm, subscribers: event.target.value})}
              placeholder="500+"
            />
          </label>
          <label className="wide">
            About
            <textarea
              value={homeChefForm.about}
              onChange={event => onHomeChefChange({...homeChefForm, about: event.target.value})}
              placeholder="Short profile intro shown in the mobile app"
            />
          </label>
          <label>
            FSSAI Status
            <input
              value={homeChefForm.fssaiStatus}
              onChange={event => onHomeChefChange({...homeChefForm, fssaiStatus: event.target.value})}
              placeholder="Certified"
            />
          </label>
          <label>
            Food Type
            <input
              value={homeChefForm.foodType}
              onChange={event => onHomeChefChange({...homeChefForm, foodType: event.target.value})}
              placeholder="100% Veg"
            />
          </label>
          <label>
            Achievement
            <input
              value={homeChefForm.achievement}
              onChange={event => onHomeChefChange({...homeChefForm, achievement: event.target.value})}
              placeholder="Top HomeChef"
            />
          </label>
          <label>
            Hygiene Rating
            <input
              value={homeChefForm.hygieneRating}
              onChange={event => onHomeChefChange({...homeChefForm, hygieneRating: event.target.value})}
              placeholder="A+"
            />
          </label>
          <div className="admin-field-group wide">
            <span>Weekly Menu</span>
            <WeeklyMenuEditor
              value={homeChefForm.weeklyMenu}
              onChange={weeklyMenu => onHomeChefChange({...homeChefForm, weeklyMenu})}
            />
          </div>
          <div className="admin-field-group wide">
            <span>Sample Menu</span>
            <WeeklyMenuEditor
              mode="sample"
              value={homeChefForm.sampleMenu}
              onChange={sampleMenu => onHomeChefChange({...homeChefForm, sampleMenu})}
            />
          </div>
          <button className="form-primary wide">Create HomeChef</button>
          {message ? <p className="form-message wide">{message}</p> : null}
        </form>
      </Panel>
      ) : null}

      {activeSection === 'categories' ? (
      <Panel title="Add Category">
        <form className="admin-form compact" onSubmit={onCreateCategory}>
          <label>
            Category Label
            <input
              required
              value={categoryForm.label}
              onChange={event => onCategoryChange({...categoryForm, label: event.target.value})}
              placeholder="Punjabi"
            />
          </label>
          <label>
            Icon
            <select
              value={categoryForm.icon}
              onChange={event => onCategoryChange({...categoryForm, icon: event.target.value})}
            >
              {productIconOptions.map(icon => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sort Order
            <input
              value={categoryForm.sortOrder}
              onChange={event =>
                onCategoryChange({...categoryForm, sortOrder: event.target.value})
              }
              placeholder="7"
              type="number"
            />
          </label>
          <button className="form-primary">Create Category</button>
        </form>
      </Panel>
      ) : null}

      {activeSection === 'database' ? (
      <Panel title="Database Manager">
        <form className="database-manager" onSubmit={onCreateManagedRow}>
          <label>
            Select Table
            <select value={selectedTable} onChange={event => onTableChange(event.target.value)}>
              {managedTables.map(table => (
                <option key={table.key} value={table.key}>
                  {table.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            New Row JSON
            <textarea
              value={managedForm}
              onChange={event => onManagedFormChange(event.target.value)}
              spellCheck={false}
            />
          </label>
          <button className="form-primary">Add To Database</button>
          {message ? <p className="form-message">{message}</p> : null}
        </form>
      </Panel>
      ) : null}

      {activeSection === 'schedule' ? (
      <Panel title="Weekly Meal Schedule">
        <DataTable
          actions={day => (
            <RowActions
              onDelete={() => onDeleteManagedRow('scheduleItems', day)}
              onEdit={() => onUpdateManagedRow('scheduleItems', day)}
            />
          )}
          columns={['Day', 'Title', 'Meal Type', 'Meta', 'Chef', 'Status', 'Actions']}
          rows={(scheduleItems || []).map(day => ({
            key: day._id || day.day,
            source: day,
            cells: [
              day.day,
              day.title || day.meal,
              day.mealType || '-',
              day.meta || '-',
              day.chef || '-',
              day.status || (day.active ? 'Active' : 'Scheduled'),
            ],
          }))}
        />
      </Panel>
      ) : null}

      {activeSection === 'database' ? (
      <Panel title={`${managedTables.find(table => table.key === selectedTable)?.label || selectedTable} Rows`}>
        <DataTable
          actions={row => (
            <RowActions
              onDelete={() => onDeleteManagedRow(selectedTable, row)}
              onEdit={() => onUpdateManagedRow(selectedTable, row)}
            />
          )}
          columns={['Name / Title', 'Status', 'Price / Amount', 'Created', 'Actions']}
          rows={(managedRows || []).map(row => ({
            key: row._id,
            source: row,
            cells: [
            row.name || row.title || row.orderId || row.ticketId || row.customer || row.day || row.type || row._id,
            row.status || row.priority || row.active || row.isActive || '-',
            row.price || row.amount || row.walletBalance || '-',
            row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-',
            ],
          }))}
        />
      </Panel>
      ) : null}

      {activeSection === 'categories' ? (
      <Panel title="Categories in Database">
        <DataTable
          actions={category => (
            <RowActions
              onDelete={() => onDeleteManagedRow('categories', category)}
              onEdit={() => onUpdateManagedRow('categories', category)}
            />
          )}
          columns={['Icon', 'Category', 'Sort Order', 'Status', 'Actions']}
          rows={(categories || []).map(category => ({
            key: category._id,
            source: category,
            cells: [
              category.icon,
              category.label || category.name,
              category.sortOrder ?? '-',
              category.isActive === false ? 'Inactive' : 'Active',
            ],
          }))}
        />
      </Panel>
      ) : null}

      {activeSection === 'homeChefsList' ? (
      <Panel title="HomeChefs in Database">
        <div className="homechef-admin-list">
          {(homeChefs || []).map(chef => {
            const weeklyMenu = getMenuItems(chef.weeklyMenu);
            const sampleMenu = getMenuItems(chef.sampleMenu);
            const chefImageUri = resolveImageUri(chef.image || chef.avatar);

            return (
              <article className="homechef-admin-card" key={chef._id || chef.name}>
                <div className="homechef-admin-main">
                  <div className="homechef-admin-icon">
                    {chefImageUri ? (
                      <img alt={chef.name || 'HomeChef'} src={chefImageUri} />
                    ) : (
                      chef.image || '🍱'
                    )}
                  </div>
                  <div className="homechef-admin-title">
                    <div>
                      <h3>{chef.name || 'Unnamed Kitchen'}</h3>
                      <p>{chef.owner || 'Owner not added'}</p>
                    </div>
                    <span className={`table-badge ${chef.status === 'Active' ? 'success' : 'warning'}`}>
                      {chef.status || 'Review'}
                    </span>
                  </div>
                  <div className="homechef-admin-meta">
                    <span>{chef.cuisine || '-'}</span>
                    <span>{Array.isArray(chef.tags) ? chef.tags.join(', ') : chef.tags || '-'}</span>
                    <strong>{chef.price || '-'}</strong>
                  </div>
                  <div className="homechef-admin-location">
                    <span>{chef.liveAddress || chef.address || chef.location || 'Address not added'}</span>
                    <small>
                      {chef.latitude && chef.longitude
                        ? `${Number(chef.latitude).toFixed(4)}, ${Number(chef.longitude).toFixed(4)}`
                        : 'Coordinates not added'}
                    </small>
                  </div>
                </div>

                <div className="homechef-menu-panel">
                  <div className="homechef-menu-head">
                    <strong>Weekly Menu</strong>
                    <span>{weeklyMenu.length || 0} days</span>
                  </div>
                  <div className="homechef-menu-grid">
                    {weeklyMenu.length ? (
                      weeklyMenu.slice(0, 7).map(item => (
                        <div className="homechef-menu-chip" key={`${chef._id}-${item.day}-${item.title}`}>
                          <span>{item.day || '-'}</span>
                          <b>{item.title || item.meal || '-'}</b>
                          <small>{item.items || item.meta || item.mealType || '-'}</small>
                        </div>
                      ))
                    ) : (
                      <em>No weekly menu added</em>
                    )}
                  </div>
                </div>

                <div className="homechef-sample-panel">
                  <strong>Sample Menu</strong>
                  <div>
                    {sampleMenu.length ? (
                      sampleMenu.slice(0, 4).map(item => (
                        <span key={`${chef._id}-sample-${item.title}`}>
                          {item.icon || '🍽️'} {item.title || item.name || '-'} {item.price ? `· ${item.price}` : ''}
                        </span>
                      ))
                    ) : (
                      <em>No sample menu added</em>
                    )}
                  </div>
                </div>

                <RowActions
                  onDelete={() => onDeleteManagedRow('homeChefs', chef)}
                  onEdit={() => onUpdateManagedRow('homeChefs', chef)}
                />
              </article>
            );
          })}
          {!(homeChefs || []).length ? (
            <div className="empty-state">No HomeChefs added yet.</div>
          ) : null}
        </div>
      </Panel>
      ) : null}

      {activeSection === 'changeRequests' ? (
      <Panel title="HomeChef Change Requests">
        <DataTable
          actions={request => (
            <RowActions
              onDelete={() => onDeleteManagedRow('homeChefChangeRequests', request)}
              onEdit={() => onUpdateManagedRow('homeChefChangeRequests', request)}
            />
          )}
          columns={['Request', 'Customer', 'Current Chef', 'Preferred Chef', 'Reason', 'Status', 'Created', 'Actions']}
          rows={(managedRows || [])
            .filter(row => selectedTable === 'homeChefChangeRequests' || row.requestId)
            .map(request => ({
              key: request._id || request.requestId,
              source: request,
              cells: [
                request.requestId || '-',
                request.customerName || '-',
                request.currentChefName || '-',
                request.requestedChefName || 'No preference',
                request.reason || '-',
                request.status || 'Pending Admin Approval',
                request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '-',
              ],
            }))}
        />
        <div className="database-manager">
          <button
            className="form-primary"
            type="button"
            onClick={() => onTableChange('homeChefChangeRequests')}>
            Refresh Change Requests
          </button>
          <button
            type="button"
            onClick={() => onTableChange('homeChefChangeSettings')}>
            Manage Request Settings
          </button>
          {message ? <p className="form-message">{message}</p> : null}
        </div>
      </Panel>
      ) : null}
    </div>
  );
}
