const shouldLogDebugData =
  typeof __DEV__ === 'undefined' ? true : Boolean(__DEV__);

const sensitiveKeys = new Set([
  'authorization',
  'password',
  'refreshToken',
  'token',
]);

function hideSensitiveData(value) {
  if (Array.isArray(value)) {
    return value.map(item => hideSensitiveData(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      sensitiveKeys.has(key.toLowerCase())
        ? '[hidden for safety]'
        : hideSensitiveData(item),
    ]),
  );
}

export function logDebugData(title, data) {
  if (!shouldLogDebugData) {
    return;
  }

  console.log(`[MIDDO DEBUG] ${title}`, hideSensitiveData(data));
}
