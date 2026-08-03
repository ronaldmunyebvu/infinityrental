export function formatRelativeTime(dateStr?: string): string | null {
  if (!dateStr) return null;
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  if (diff < 0) return null;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function pricePeriodShort(period?: string): string {
  const p = (period || '').toLowerCase();
  if (p.includes('day')) return '/day';
  if (p.includes('night')) return '/night';
  if (p.includes('week')) return '/wk';
  if (p.includes('month')) return '/mo';
  return '/mo';
}
