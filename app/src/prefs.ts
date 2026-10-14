/**
 * ?theme=blue|yellow and ?mode=preview|surprise pick the accent and the variation
 * for this session (kept across reloads and "Start over"); otherwise the build's env.
 */
export function fromUrlOrSession(param: string, allowed: string[], fallback: string): string {
  const key = `booth-wizard-${param}`;
  try {
    const q = new URLSearchParams(location.search).get(param);
    if (q && allowed.includes(q)) sessionStorage.setItem(key, q);
    return sessionStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}
