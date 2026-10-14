import { API_BASE_URL } from '../config/api';
import { authFetch } from './authSession';
async function parseResponse(response, fallbackMessage) {
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || fallbackMessage);
  }
  return data.data || data;
}
export async function updateCustomerSettings(identity, settings) {
  const response = await authFetch(`${API_BASE_URL}/api/auth/settings`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...identity,
      settings,
    }),
  });
  return parseResponse(response, 'Unable to update settings');
}
export async function updateCustomerAddresses(identity, savedAddresses) {
  const response = await authFetch(`${API_BASE_URL}/api/auth/addresses`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...identity,
      savedAddresses,
    }),
  });
  return parseResponse(response, 'Unable to update addresses');
}
export async function deactivateCustomerAccount(identity) {
  const response = await authFetch(`${API_BASE_URL}/api/auth/deactivate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(identity),
  });
  return parseResponse(response, 'Unable to deactivate account');
}
export async function deleteCustomerAccount(identity) {
  const response = await authFetch(`${API_BASE_URL}/api/auth/account`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(identity),
  });
  return parseResponse(response, 'Unable to delete account');
}
