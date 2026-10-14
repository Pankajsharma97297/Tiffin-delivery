const env =
  typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

export const API_BASE_URL = (
  env.VITE_MIDDO_API_BASE_URL ||
  env.VITE_API_BASE_URL ||
  'http://162.240.223.89:3002'
).replace(/\/+$/, '');

async function readJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    return {
      success: false,
      message: 'Backend returned an invalid response',
    };
  }
}

export async function adminRequest(path, {body, method = 'GET', token} = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
    },
    ...(body ? {body: JSON.stringify(body)} : {}),
  });
  const payload = await readJsonResponse(response);

  if (!response.ok || payload.success === false) {
    const message = payload.message || 'Request failed';

    if (
      token &&
      [
        'Access denied. Token is required',
        'Invalid or expired token',
        'Super admin account is inactive or missing',
        'Invalid or expired super admin token',
        'Super admin token is required',
      ].includes(message)
    ) {
      localStorage.removeItem('middoAdminSession');
      localStorage.removeItem('middoSuperAdmin');
      localStorage.removeItem('middoSuperAdminToken');
      throw new Error('Session expired. Please login again.');
    }

    throw new Error(message);
  }

  return payload;
}
