import React from 'react';
import {DataTable} from '../../components/common/DataTable';
import {Panel} from '../../components/common/Panel';
import {TaskList} from '../../components/common/TaskList';

export function Dashboard({data, role}) {
  const openTickets = (data.supportTickets || []).filter(ticket => ticket.status !== 'Closed').length;
  const pendingKyc = [
    ...(data.vendors || []),
    ...(data.riders || []),
  ].filter(partner => ['Pending Review', 'Not Submitted'].includes(partner.kycStatus || 'Not Submitted')).length;
  const liveOrders = (data.orders || []).filter(order => !['Delivered', 'Cancelled'].includes(order.status)).length;
  const menuPending = (data.chefs || []).filter(chef => !(chef.weeklyMenu?.length || chef.sampleMenu?.length)).length;
  const focusItems = [
    `${liveOrders} live orders need tracking`,
    `${pendingKyc} partner KYC profiles need review`,
    `${openTickets} support tickets are unresolved`,
    `${menuPending} kitchens have no menu configured`,
  ];

  if (role === 'super_admin') {
    const activeChefs = (data.chefs || []).filter(chef => chef.status === 'Active').length;
    const menuReady = (data.chefs || []).filter(chef => chef.weeklyMenu?.length || chef.sampleMenu?.length).length;
    const pendingOrders = (data.orders || []).filter(order => !['Delivered', 'Cancelled'].includes(order.status)).length;

    return (
      <>
        <section className="super-dashboard-hero">
          <div>
            <p className="eyebrow">Super Admin Command Center</p>
            <h2>Platform control, approvals, menus and live operations</h2>
            <span>Use this dashboard for ownership-level monitoring. Management sections are available from the sidebar without a separate Super Admin tab.</span>
          </div>
          <div className="super-dashboard-card">
            <strong>{activeChefs}</strong>
            <span>Active HomeChefs</span>
          </div>
          <div className="super-dashboard-card">
            <strong>{menuReady}</strong>
            <span>Menus Configured</span>
          </div>
          <div className="super-dashboard-card">
            <strong>{pendingOrders}</strong>
            <span>Live Orders</span>
          </div>
        </section>

        <section className="metric-grid super-metrics">
          {data.metrics.map(metric => (
            <article className="metric-card" key={metric.label}>
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
              <span className={metric.tone}>{metric.delta}</span>
            </article>
          ))}
        </section>

        <section className="split-grid">
          <Panel title="Live Operations">
            <DataTable
              columns={['Order', 'Customer', 'Meal', 'Status', 'ETA']}
              rows={(data.orders || []).map(order => [order.id, order.customer, order.meal, order.status, order.eta])}
            />
          </Panel>
          <Panel title="Super Admin Focus">
            <TaskList
              items={focusItems}
            />
          </Panel>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="metric-grid">
        {data.metrics.map(metric => (
          <article className="metric-card" key={metric.label}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            <span className={metric.tone}>{metric.delta}</span>
          </article>
        ))}
      </section>
      <section className="split-grid">
        <Panel title="Live Orders">
          <DataTable columns={['Order', 'Customer', 'Status', 'ETA']} rows={data.orders.map(order => [order.id, order.customer, order.status, order.eta])} />
        </Panel>
        <Panel title="Today Focus">
          <TaskList items={focusItems} />
        </Panel>
      </section>
    </>
  );
}
