import { API_BASE_URL } from '../config/api';
import { authFetch } from './authSession';

// Home screen ko backend se jo fields milti hain, unhe ek predictable shape me rakha gaya hai.
// Yahan demo data add nahi hota; backend empty bhejega to UI section hide rahega.
const normalizeHomeData = (data = {}) => ({
  customer: data.customer || null,
  meals: {
    today: data.meals?.today || null,
    next: data.meals?.next || null,
    tomorrow: data.meals?.tomorrow || null,
  },
  assignedChef: data.assignedChef || null,
  schedule: data.schedule || [],
  categories: data.categories || [],
  products: data.products || [],
  activeOrder: data.activeOrder || null,
  activeSubscription: data.activeSubscription || null,
  homeChefChange: data.homeChefChange,
  nearbyChefs: data.nearbyChefs || [],
});
export async function fetchHomeData() {
  const response = await authFetch(`${API_BASE_URL}/api/home`);
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Unable to fetch home data');
  }
  return normalizeHomeData(data.data || data);
}
export async function submitHomeChefChangeRequest(payload) {
  const response = await authFetch(
    `${API_BASE_URL}/api/home/home-chef-change-requests`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Unable to submit HomeChef change request');
  }
  return data.data || data;
}
export async function submitSubscriptionRequest(payload) {
  const response = await authFetch(
    `${API_BASE_URL}/api/home/subscription-requests`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Unable to submit subscription request');
  }
  return data.data || data;
}
