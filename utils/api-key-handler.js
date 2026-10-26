// Compatibility exports for older pages. Service failures never lock the browser.
export function handleApiKeyExhausted() { return null; }
export const isSoftError = () => false;
let started = false;
export function installApiKeyHandler() {
 if (started || typeof window === 'undefined') return;
 started = true;
 window.BTPApiStatus = { isSoftError, isExhausted: () => false, handleApiKeyExhausted };
 try {
  for (const key of ['api_key_status', 'api_key_exhausted_at', 'api_key_recovered_at']) localStorage.removeItem(key);
 } catch { /* Storage access is optional. */ }
}
