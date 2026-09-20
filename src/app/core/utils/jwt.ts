/** true si el JWT caduca en menos de `marginSeconds` (o ya ha caducado). Un token ilegible se da por válido:
 * lo decide el servidor. */
export function isExpiringSoon(token: string, marginSeconds = 30): boolean {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '='));
    const exp = (JSON.parse(json) as { exp?: number }).exp;
    return typeof exp === 'number' && exp * 1000 - Date.now() < marginSeconds * 1000;
  } catch {
    return false;
  }
}
