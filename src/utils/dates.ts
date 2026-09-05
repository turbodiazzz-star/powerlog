/** Display dates as 15.08.2026. Storage can stay ISO. */
export function formatDateDot(input?: string | number | Date | null): string {
  if (input == null || input === '') return '';
  if (input instanceof Date) return fromLocalDate(input);

  const raw = String(input).trim();
  const already = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (already) {
    return `${already[1].padStart(2, '0')}.${already[2].padStart(2, '0')}.${already[3]}`;
  }

  const isoDate = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) {
    return `${isoDate[3]}.${isoDate[2]}.${isoDate[1]}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return fromLocalDate(parsed);
}

function fromLocalDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getFullYear()}`;
}
