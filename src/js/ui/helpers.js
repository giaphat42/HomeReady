export const $ = (id) => document.getElementById(id);
export const money = (value, decimals = 0) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
export const percent = (value) => `${value.toFixed(2)}%`;
export const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export const setText = (id, value) => {
  const element = $(id);
  if (element) element.textContent = value;
};

export function duration(months) {
  if (!Number.isFinite(months)) return 'Not yet funded';
  if (months === 0) return 'Goal reached';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [years ? `${years}y` : '', rest ? `${rest}m` : ''].filter(Boolean).join(' ');
}

export function targetDate(months) {
  if (!Number.isFinite(months)) return 'Add positive monthly savings';
  if (months === 0) return 'Your savings target is covered';
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  return date.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
}

let toastTimeout;
export function toast(message) {
  setText('toast', message);
  $('toast').classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => $('toast').classList.remove('visible'), 4000);
}

export function downloadJson(value, filename) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
