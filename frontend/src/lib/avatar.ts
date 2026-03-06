/**
 * Returns a deterministic avatar URL for a given name.
 * Uses DiceBear avataaars style (free, no API key needed).
 * Always returns the same avatar for the same name.
 */
export function defaultAvatar(name: string): string {
  const seed = encodeURIComponent(name || 'user');
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}
