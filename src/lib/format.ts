const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function formatDate(d: Date): string {
  return dateFmt.format(d);
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
