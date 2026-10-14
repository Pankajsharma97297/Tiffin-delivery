import { API_BASE_URL } from '../config/api';
import { authFetch } from './authSession';

export async function fetchCustomerAppContent(keys = []) {
  const query = keys.length ? `?keys=${keys.map(encodeURIComponent).join(',')}` : '';
  const response = await authFetch(`${API_BASE_URL}/api/customer/content${query}`);
  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Unable to fetch app content');
  }

  return data.content || data.data?.content || {};
}
