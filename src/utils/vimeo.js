/** Returns numeric Vimeo video id from URL or raw id string, or null. */
export function extractVimeoId(input) {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}
