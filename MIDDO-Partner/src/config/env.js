const runtimeEnv =
  typeof process !== 'undefined' && process.env ? process.env : {};

export function getEnv(key, fallback = '') {
  return runtimeEnv[key] || fallback;
}
