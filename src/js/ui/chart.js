import { $ } from './helpers.js';

/** SVG keeps the chart dependency-free and scales to mobile screens. */
export function renderSavingsChart(plan) {
  const horizon = Math.min(
    120,
    Math.max(12, Math.ceil((Number.isFinite(plan.months) ? plan.months : 60) / 12) * 12),
  );
  const maxValue = Math.max(plan.target, plan.saved, 1) * 1.1;
  const width = 680,
    height = 220,
    left = 48,
    top = 15,
    right = 14,
    bottom = 32;
  const x = (month) => left + (month / horizon) * (width - left - right);
  const y = (amount) => top + (1 - amount / maxValue) * (height - top - bottom);
  const points = (monthly) =>
    Array.from({ length: 81 }, (_, index) => {
      const month = (index / 80) * horizon;
      return `${x(month)},${y(Math.min(Math.max(plan.target, plan.saved), plan.saved + monthly * month))}`;
    }).join(' ');
  let content = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Savings projection over ${horizon} months. Dark line: current savings. Gold line: extra weekly contribution.">`;
  for (let i = 0; i <= 3; i++) {
    const value = (maxValue * i) / 3;
    content += `<line x1="${left}" x2="${width - right}" y1="${y(value)}" y2="${y(value)}" class="chart-grid"/>`;
    content += `<text x="${left - 9}" y="${y(value) + 3}" text-anchor="end">$${Math.round(value / 1000)}k</text>`;
  }
  content += `<line x1="${left}" x2="${width - right}" y1="${y(plan.target)}" y2="${y(plan.target)}" class="chart-target"/>`;
  content += `<polyline points="${points(plan.monthly)}" class="chart-base"/>`;
  content += `<polyline points="${points(plan.monthly + plan.extra)}" class="chart-extra"/>`;
  for (let i = 0; i <= 4; i++) {
    const month = Math.round((horizon * i) / 4);
    content += `<text x="${x(month)}" y="${height - 7}" text-anchor="${i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}">${month ? month + ' months' : 'Today'}</text>`;
  }
  $('savings-chart').innerHTML = content + '</svg>';
  $('chart-horizon').textContent =
    `Illustrated over ${horizon / 12} years · No savings interest or house-price growth`;
}
