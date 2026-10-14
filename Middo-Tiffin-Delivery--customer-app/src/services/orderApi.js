import { API_BASE_URL } from '../config/api';
import { authFetch } from './authSession';
export async function fetchOrders() {
  const response = await authFetch(`${API_BASE_URL}/api/orders`);
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Unable to fetch orders');
  }
  return data.orders || [];
}
export async function fetchOrderById(orderId) {
  const response = await authFetch(`${API_BASE_URL}/api/orders/${orderId}`);
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Unable to fetch order');
  }
  return data.order;
}
export async function createOrder(orderInput) {
  const response = await authFetch(`${API_BASE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderInput),
  });
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Unable to create order');
  }
  return data.order;
}
