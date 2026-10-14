import { API_BASE_URL } from '../config/api';
import { authFetch } from './authSession';
export async function topUpWallet(payload) {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/top-up`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Unable to add wallet balance');
  }
  return data.data || data;
}
export async function fetchWalletTransactions(params) {
  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, value]) => Boolean(value)),
    ),
  ).toString();
  const response = await authFetch(
    `${API_BASE_URL}/api/wallet/transactions${query ? `?${query}` : ''}`,
  );
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Unable to fetch wallet transactions');
  }
  return data.transactions || data.data?.transactions || [];
}
