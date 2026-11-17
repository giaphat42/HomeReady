const paths = {
  home: 'M3 10 12 3l9 7M5 9v12h14V9M9 21v-8h6v8',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  plan: 'M5 22V3m0 1c6-4 8 4 15 0v11c-7 4-9-4-15 0',
  bank: 'm3 8 9-5 9 5H3ZM3 21h18M5 10v8m7-8v8m7-8v8',
  rates: 'M3 20h18M5 15l5-6 4 3 6-8M16 4h4v4',
  spark: 'm12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8L12 2Z',
  shield: 'm12 2 8 3v6c0 6-8 11-8 11S4 17 4 11V5l8-3Zm-5 9 3 3 6-6',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  external: 'M14 3h7v7m0-7L10 14M10 3H3v18h18v-7',
  refresh: 'M20 7a9 9 0 1 0 1 9M20 2v5h-5',
  plus: 'M12 4v16M4 12h16',
  check: 'm5 12 4 4L19 6',
  close: 'm6 6 12 12M6 18 18 6',
  chevron: 'm9 5 7 7-7 7',
  settings: 'M4 5h16M4 12h16M4 19h16M8 2v6m8 1v6M9 16v6',
};
export function renderIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((element) => {
    element.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[element.dataset.icon] || paths.spark}"/></svg>`;
  });
}
