import { API_BASE_URL } from '../config/api';
import { authFetch } from './authSession';

async function parseResponse(response, fallbackMessage) {
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || fallbackMessage);
  }
  return data.data || data;
}

function toQuery(params = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
    ),
  ).toString();
  return query ? `?${query}` : '';
}

export async function fetchCustomerPlans() {
  const response = await authFetch(`${API_BASE_URL}/api/customer/plans`);
  return parseResponse(response, 'Unable to fetch plans');
}

export async function fetchCustomerMeals(params) {
  const response = await authFetch(
    `${API_BASE_URL}/api/customer/meals${toQuery(params)}`,
  );
  return parseResponse(response, 'Unable to fetch meals');
}

export async function fetchCustomerSubscriptions(params) {
  const response = await authFetch(
    `${API_BASE_URL}/api/customer/subscriptions${toQuery(params)}`,
  );
  return parseResponse(response, 'Unable to fetch subscriptions');
}

export async function fetchCustomerOrders(params) {
  const response = await authFetch(
    `${API_BASE_URL}/api/customer/orders${toQuery(params)}`,
  );
  return parseResponse(response, 'Unable to fetch orders');
}

export async function purchaseCustomerSubscription(payload) {
  const response = await authFetch(`${API_BASE_URL}/api/customer/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse(response, 'Unable to purchase subscription');
}

export async function fetchSubscriptionCalendar(params) {
  const response = await authFetch(
    `${API_BASE_URL}/api/customer/subscriptions/calendar${toQuery(params)}`,
  );
  return parseResponse(response, 'Unable to fetch subscription calendar');
}

export async function skipSubscriptionMeal(payload) {
  const response = await authFetch(
    `${API_BASE_URL}/api/customer/subscriptions/skip-meal`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
  return parseResponse(response, 'Unable to skip meal');
}

export async function createPaymentOrder(payload) {
  const response = await authFetch(`${API_BASE_URL}/api/customer/payments/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse(response, 'Unable to create payment order');
}

export async function verifyPayment(payload) {
  const response = await authFetch(`${API_BASE_URL}/api/customer/payments/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse(response, 'Unable to verify payment');
}

export async function submitCustomerReview(payload) {
  const response = await authFetch(`${API_BASE_URL}/api/customer/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse(response, 'Unable to submit review');
}

export async function fetchCustomerReviews(params) {
  const response = await authFetch(
    `${API_BASE_URL}/api/customer/reviews${toQuery(params)}`,
  );
  return parseResponse(response, 'Unable to fetch reviews');
}

export async function fetchCustomerNotifications() {
  const response = await authFetch(`${API_BASE_URL}/api/customer/notifications`);
  return parseResponse(response, 'Unable to fetch notifications');
}

export async function createSupportTicket(payload) {
  const response = await authFetch(`${API_BASE_URL}/api/customer/support/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse(response, 'Unable to create support ticket');
}
