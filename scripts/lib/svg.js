// Shared SVG helpers: document frame, text, chips, measuring and escaping.
// Static paint uses hex attributes (works in every renderer); the palette is
// also declared as CSS custom properties for the keyframes.
import { palette as P, fonts } from '../config.js';

export const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
  // Strip characters that are illegal in XML 1.0.
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '');

const kebab = (k) => k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
const cssVars = Object.entries(P).map(([k, v]) => `--${kebab(k)}:${v}`).join(';');

// Rough advance widths (em) for a Segoe UI / Helvetica-like sans. Errs wide.
function sansWidth(ch) {
  if (' '.includes(ch)) return 0.29;
  if ('iljI.,:;\'|!·'.includes(ch)) return 0.27;
  if ('ftr()[]{}/-'.includes(ch)) return 0.37;
  if ('mw'.includes(ch)) return 0.82;
  if ('MW'.includes(ch)) return 0.88;
  if ('—→↗▸'.includes(ch)) return 0.92;
  if (/[A-Z]/.test(ch)) return 0.66;
  if (/[0-9]/.test(ch)) return 0.56;
  return 0.54;
}

export function measure(text, size, family = 'sans', weight = 400) {
  const s = String(text);
  if (family === 'mono') return [...s].length * 0.6 * size;
  const w = [...s].reduce((a, ch) => a + sansWidth(ch), 0) * size;
  return weight >= 600 ? w * 1.06 : w;
}

export function wrap(text, size, maxW, family = 'sans') {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? cur + ' ' + w : w;
    if (measure(next, size, family) <= maxW || !cur) cur = next;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

export function truncate(text, max) {
  const s = String(text ?? '').split('\n')[0].trim();
  return [...s].length > max ? [...s].slice(0, max - 1).join('').trimEnd() + '…' : s;
}

// <text>. opts: size, fam ('sans'|'mono'), fill (palette key or hex), weight, anchor, ls, cls, extra
export function text(x, y, str, o = {}) {
  const fill = P[o.fill] ?? o.fill ?? P.ink;
  const attrs = [
    `x="${r(x)}"`, `y="${r(y)}"`, `class="${o.fam === 'mono' ? 'm' : 's'}${o.cls ? ' ' + o.cls : ''}"`,
    `font-size="${o.size ?? 20}"`, `fill="${fill}"`,
    o.weight ? `font-weight="${o.weight}"` : '',
    o.anchor ? `text-anchor="${o.anchor}"` : '',
    o.ls ? `letter-spacing="${o.ls}"` : '',
    o.extra ?? '',
  ].filter(Boolean).join(' ');
  return `<text ${attrs}>${o.raw ? str : esc(str)}</text>`;
}

export const r = (n) => Math.round(n * 10) / 10;

// Pill chip. Returns { svg, w }. y is the top edge.
export function chip(x, y, label, o = {}) {
  const size = o.size ?? 20;
  const fam = o.fam ?? 'mono';
  const h = o.h ?? 34;
  const padX = o.padX ?? 14;
  const dotW = o.dot ? 16 : 0;
  const w = measure(label, size, fam) + padX * 2 + dotW;
  const parts = [
    `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${h}" rx="${h / 2}" fill="${P[o.bg] ?? o.bg ?? P.surface}" stroke="${P[o.stroke] ?? o.stroke ?? P.border}" stroke-width="1.5"${o.dash ? ' stroke-dasharray="5 4"' : ''}/>`,
  ];
  if (o.dot) parts.push(`<circle cx="${r(x + padX + 4)}" cy="${r(y + h / 2)}" r="5" fill="${P[o.dot] ?? o.dot}"/>`);
  parts.push(text(x + padX + dotW, y + h / 2 + size * 0.35, label, { size, fam, fill: o.color ?? 'greenInk' }));
  const svg = o.cls ? `<g class="${o.cls}">${parts.join('')}</g>` : parts.join('');
  return { svg, w };
}

export const shadowFilter = `<filter id="sh" x="-10%" y="-10%" width="120%" height="130%">
<feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="${P.pink}" flood-opacity=".06"/>
<feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="${P.green}" flood-opacity=".06"/></filter>`;

// Full SVG document with its own rounded --bg frame.
// css: static rules. motion: rules applied only when motion is allowed.
export function doc({ w, h, title, desc = '', css = '', motion = '', body, defs = '', radius = 24, bg = 'bg', border = true, dashed = false }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title><desc id="d">${esc(desc || title)}</desc>
<style>:root{${cssVars}}
.s{font-family:${fonts.sans}}.m{font-family:${fonts.mono}}
${css}
@media (prefers-reduced-motion:no-preference){${motion}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>
<defs>${defs}</defs>
<rect x="0.75" y="0.75" width="${w - 1.5}" height="${h - 1.5}" rx="${radius}" fill="${P[bg] ?? bg}"${border ? ` stroke="${P.border}" stroke-width="1.5"` : ''}${dashed ? ' stroke-dasharray="10 7"' : ''}/>
${body}
</svg>
`;
}

// Build a @keyframes translate track through points at given cycle percentages.
// stops: [{ p: 0..100, x, y, extra: 'opacity:1' }]
export function keyframes(name, stops) {
  return `@keyframes ${name}{${stops.map((s) => `${r(s.p)}%{${s.x !== undefined ? `transform:translate(${r(s.x)}px,${r(s.y)}px);` : ''}${s.extra ?? ''}}`).join('')}}`;
}
