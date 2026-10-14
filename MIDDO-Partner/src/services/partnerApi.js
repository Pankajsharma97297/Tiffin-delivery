import {
  getPartnerSession,
  loadPartnerSession,
  partnerRequest,
  savePartnerSession,
} from './partnerSession';

const toAmount = value => Number(String(value || '').replace(/[^\d.]/g, '')) || 0;

const toHomeChefStatus = status => {
  if (status === 'Order Confirmed') return 'New Order';
  if (status === 'Pending') return 'New Order';
  if (status === 'Ready') return 'Ready For Pickup';
  if (status === 'Ready for Pickup') return 'Ready For Pickup';
  if (status === 'Delivered') return 'Completed';
  return status || 'New Order';
};

const toBackendStatus = status => {
  if (status === 'Ready For Pickup') return 'Ready';
  if (status === 'Completed') return 'Delivered';
  if (status === 'Picked Up') return 'Out For Delivery';
  if (status === 'Out for Delivery') return 'Out For Delivery';
  return status;
};

export function mapOrderToHomeChefOrder(order) {
  return {
    id: order.orderId,
    customer: order.customer || '',
    slot: order.eta || 'Today',
    meal: order.meal || order.items?.join(', ') || '',
    type: order.orderType === 'subscription' ? 'Subscription' : order.orderType || '',
    amount: toAmount(order.amount),
    status: toHomeChefStatus(order.status),
  };
}

export function mapOrderToRiderDelivery(order) {
  return {
    id: order.orderId,
    batch: order.deliveryBatchId || order.batch || '',
    sequence: Number(order.deliverySequence || 0),
    customer: order.customer || '',
    phone: order.customerPhone || '',
    slot: order.eta || '',
    meal: order.meal || order.items?.join(', ') || '',
    address: order.address || '',
    pickup: order.homeChefName || order.chef || '',
    distance: order.distance || '',
    amount: toAmount(order.amount),
    rider: order.riderName || '',
    status:
      order.status === 'Ready'
        ? 'Assigned'
        : order.status === 'Out For Delivery'
          ? 'Out for Delivery'
          : order.status || 'Assigned',
  };
}

export async function fetchPartnerOrders(role) {
  const payload = await partnerRequest('/api/delivery-partner/orders');
  const orders = payload.orders || [];

  return role === 'rider'
    ? orders.map(mapOrderToRiderDelivery)
    : orders.map(mapOrderToHomeChefOrder);
}

export async function fetchPartnerDashboard() {
  const payload = await partnerRequest('/api/delivery-partner/orders/dashboard');
  return payload.dashboard || payload.data?.dashboard || {};
}

export async function fetchHomeChefDashboard() {
  return fetchPartnerDashboard();
}

export async function fetchPartnerNotifications() {
  const payload = await partnerRequest('/api/delivery-partner/profile/notifications');
  return payload.notifications || [];
}

export async function clearPartnerNotifications() {
  const payload = await partnerRequest('/api/delivery-partner/profile/notifications', {
    method: 'DELETE',
  });
  return payload.deletedCount || 0;
}

export async function updatePartnerOrderStatus(orderId, status) {
  return partnerRequest(`/api/delivery-partner/orders/${orderId}/status`, {
    method: 'PATCH',
    body: { status: toBackendStatus(status) },
  });
}

export async function updatePartnerRole(role) {
  let payload = null;
  const roleCandidates =
    role === 'rider' ? ['rider'] : ['homechef', 'homechefs'];
  let lastError = null;

  for (const candidate of roleCandidates) {
    try {
      payload = await partnerRequest('/api/delivery-partner/profile/role', {
        method: 'PATCH',
        body: { role: candidate },
      });
      break;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : '';
      const canTryNextAlias =
        message.includes('valid enum value') ||
        message.includes('Invalid role') ||
        message.includes('homechef') ||
        message.includes('homechefs');

      if (!canTryNextAlias) {
        break;
      }
    }
  }

  if (!payload) {
    throw lastError || new Error('Unable to update partner role.');
  }

  const currentSession = getPartnerSession() || await loadPartnerSession();

  await savePartnerSession({
    ...(currentSession || {}),
    ...(payload.token ? { token: payload.token } : {}),
    ...(payload.user ? { user: payload.user } : {}),
    ...(payload.profile ? { profile: payload.profile } : {}),
  });

  return payload;
}
