import React, {useState} from 'react';
import {trackingStatuses} from '../../constants/adminConfig';
import {Panel} from '../../components/common/Panel';

export function Orders({
  canAssign = false,
  canUpdateTracking = false,
  orders,
  onAssignRider,
  onAssignVendor,
  onStatusChange,
  riders = [],
  vendors = [],
}) {
  const [assignValues, setAssignValues] = useState({});
  const getAssignValue = (orderId, key) => assignValues[orderId]?.[key] || '';
  const setAssignValue = (orderId, key, value) => {
    setAssignValues(current => ({
      ...current,
      [orderId]: {
        ...(current[orderId] || {}),
        [key]: value,
      },
    }));
  };

  return (
    <Panel title="Orders and Tracking">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {['Order', 'Customer', 'Meal', 'HomeChef', 'Rider', 'Assign', 'Tracking', 'Amount', 'Payment', 'Payment ID'].map(column => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map(order => {
              const orderId = order.id || order.orderId;
              const status = trackingStatuses.includes(order.status)
                ? order.status
                : 'Order Confirmed';
              const activeIndex = trackingStatuses.indexOf(status);
              const isDelivered = ['delivered', 'completed'].includes(
                String(order.status || status).toLowerCase(),
              );
              const vendorAssigned = Boolean(
                order.homeChefId ||
                  order.homeChefName ||
                  order.homeChefOwner ||
                  order.chef,
              );
              const riderAssigned = Boolean(
                order.riderId ||
                  order.riderName ||
                  order.riderEmail ||
                  order.riderPhone ||
                  order.deliveryPartnerName ||
                  order.deliveryPartnerEmail ||
                  order.deliveryPartnerPhone,
              );
              const canAssignVendor = canAssign && !vendorAssigned;
              const canAssignRider = canAssign && !riderAssigned;

              return (
                <tr key={orderId}>
                  <td><span className="table-code">{orderId}</span></td>
                  <td>{order.customer}</td>
                  <td>{order.meal}</td>
                  <td>
                    <strong>{order.homeChefName || order.chef || '-'}</strong>
                    <small>{order.homeChefPhone || order.homeChefEmail || ''}</small>
                  </td>
                  <td>
                    <strong>{order.deliveryPartnerName || '-'}</strong>
                    <small>{order.deliveryPartnerPhone || order.deliveryPartnerEmail || 'Not assigned'}</small>
                  </td>
                  <td>
                    {isDelivered ? (
                      <div className="assignment-readonly">
                        <strong>Delivered</strong>
                        <small>Vendor: {order.homeChefName || order.chef || '-'}</small>
                        <small>Rider: {order.deliveryPartnerName || order.riderName || '-'}</small>
                      </div>
                    ) : (
                      <div className="assignment-box">
                        <label>
                          Vendor
                          <select
                            disabled={!canAssignVendor}
                            value={getAssignValue(orderId, 'vendorId')}
                            onChange={event => setAssignValue(orderId, 'vendorId', event.target.value)}>
                            <option value="">Select kitchen</option>
                            {vendors.map(vendor => {
                              const isOpen = vendor.kitchenOpen !== false && vendor.status === 'Approved';
                              return (
                                <option key={vendor._id} value={vendor._id} disabled={!isOpen}>
                                  {vendor.name} · {isOpen ? 'Kitchen ON' : 'Kitchen OFF'}
                                </option>
                              );
                            })}
                          </select>
                        </label>
                        <button
                          type="button"
                          disabled={!canAssignVendor || !getAssignValue(orderId, 'vendorId')}
                          onClick={() => {
                            const vendor = vendors.find(item => String(item._id) === getAssignValue(orderId, 'vendorId'));
                            if (vendor) {
                              onAssignVendor(orderId, vendor);
                            }
                          }}>
                          {vendorAssigned ? 'Vendor Assigned' : 'Assign Vendor'}
                        </button>
                        {vendorAssigned ? <small>Vendor already assigned</small> : null}
                        <label>
                          Rider
                          <select
                            disabled={!canAssignRider}
                            value={getAssignValue(orderId, 'riderId')}
                            onChange={event => setAssignValue(orderId, 'riderId', event.target.value)}>
                            <option value="">Select rider</option>
                            {riders.map(rider => {
                              const isOnline = rider.isOnline !== false && rider.status === 'Active';
                              return (
                                <option key={rider._id} value={rider._id} disabled={!isOnline}>
                                  {rider.name} · {isOnline ? 'Online' : 'Offline'}
                                </option>
                              );
                            })}
                          </select>
                        </label>
                        <div className="assignment-row">
                          <input
                            disabled={!canAssignRider}
                            min="1"
                            placeholder="Seq"
                            type="number"
                            value={getAssignValue(orderId, 'deliverySequence')}
                            onChange={event => setAssignValue(orderId, 'deliverySequence', event.target.value)}
                          />
                          <button
                            type="button"
                            disabled={!canAssignRider || !getAssignValue(orderId, 'riderId')}
                            onClick={() => {
                              const rider = riders.find(item => String(item._id) === getAssignValue(orderId, 'riderId'));
                              if (rider) {
                                onAssignRider(orderId, rider, {
                                  deliverySequence: getAssignValue(orderId, 'deliverySequence'),
                                });
                              }
                            }}>
                            {riderAssigned ? 'Rider Assigned' : 'Assign Rider'}
                          </button>
                        </div>
                        {riderAssigned ? <small>Rider already assigned</small> : null}
                        {!canAssign ? <small>Super admin/admin can assign</small> : null}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="tracking-control">
                      {canUpdateTracking ? (
                        <select
                          value={status}
                          onChange={event => onStatusChange(orderId, event.target.value)}>
                          {trackingStatuses.map(option => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="tracking-readonly">{status}</span>
                      )}
                      <div className="tracking-mini">
                        {trackingStatuses.map((option, index) => (
                          <button
                            type="button"
                            key={option}
                            className={[
                              index <= activeIndex ? 'tracking-mini-dot done' : 'tracking-mini-dot',
                              !canUpdateTracking ? 'readonly' : '',
                            ].filter(Boolean).join(' ')}
                            disabled={!canUpdateTracking}
                            onClick={() => canUpdateTracking && onStatusChange(orderId, option)}
                            title={option}
                          />
                        ))}
                      </div>
                      {!canUpdateTracking ? (
                        <span className="tracking-lock">Super admin controls tracking updates</span>
                      ) : null}
                    </div>
                  </td>
                  <td>{order.amount}</td>
                  <td>
                    <span className="table-badge payment">
                      {order.paymentProvider || 'Razorpay'} · {order.paymentMethod || 'Online'} · {order.paymentStatus || 'Paid'}
                    </span>
                  </td>
                  <td>{order.paymentId || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
