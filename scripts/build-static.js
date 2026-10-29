// Renders the hand-authored visuals (hero, buttons, strip, cards, footer)
// from config.js, then assembles README.md. Run: node scripts/build-static.js
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  person, links, palette as P, stages, loopLabel, stageOwners, projects, lab, isFilled,
} from './config.js';
import { doc, text, chip, measure, wrap, keyframes, shadowFilter, esc, r } from './lib/svg.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STATIC = join(ROOT, 'assets', 'static');
const GENERATED = join(ROOT, 'assets', 'generated');

const write = (dir, name, svg) => { mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, name), svg); };
const policyIdx = stages.indexOf('policy check');

// Lifecycle node: circle, or a rounded square for policy check.
function node(cx, cy, i, o = {}) {
  const s = o.size ?? 16;
  const fill = o.fill ?? P.surface;
  const cls = o.cls ? ` class="${o.cls}"` : '';
  if (i === policyIdx) return `<rect${cls} x="${cx - s}" y="${cy - s}" width="${s * 2}" height="${s * 2}" rx="${s / 2}" fill="${fill}" stroke="${P.pink}" stroke-width="3"/>`;
  return `<circle${cls} cx="${cx}" cy="${cy}" r="${s}" fill="${fill}" stroke="${P.green}" stroke-width="3"/>`;
}

// ---------------------------------------------------------------- hero
function hero() {
  const W = 1280, H = 600, X = 72, Y = 482;
  const xs = stages.map((_, i) => 160 + i * 192);
  const T = 14; // two 7s cycles: green passes, pink is blocked
  const pct = (t) => (t / T) * 100;

  const rules = [104, 262, 384].map((y) => `<line x1="40" y1="${y}" x2="1240" y2="${y}" stroke="${P.grid}" stroke-width="1.5"/>`).join('');
  const nameW = measure(person.displayName, 124, 'sans', 800);
  const name = `<text x="${X}" y="226" class="s" font-size="124" font-weight="800" fill="${P.ink}" letter-spacing="-3">${esc(person.displayName)}<tspan fill="${P.pink}">.</tspan></text>`;

  let currently = '';
  if (isFilled(person.currently)) {
    const room = 1208 - Math.max(nameW + X + 60, 900);
    const n = Math.ceil(measure(person.currently, 20, 'mono') / room);
    const lines = wrap(person.currently, 20, Math.min(room, measure(person.currently, 20, 'mono') / n + 30), 'mono');
    currently = `<circle class="live" cx="${1208 - measure('currently', 20, 'mono') - 16}" cy="172" r="6" fill="${P.green}"/>`
      + text(1208, 179, 'currently', { fam: 'mono', fill: 'greenInk', anchor: 'end' })
      + lines.map((l, i) => text(1208, 211 + i * 28, l, { fam: 'mono', fill: 'muted', anchor: 'end' })).join('');
  }
  const loc = isFilled(person.location) ? text(1208, 76, person.location, { fam: 'mono', fill: 'subtleInk', anchor: 'end' }) : '';

  const labels = stages.map((s, i) => text(xs[i], 440, s, { fam: 'mono', anchor: 'middle', fill: i === policyIdx ? 'pinkInk' : 'muted', weight: i === policyIdx ? 600 : 400 })).join('');
  const nodes = stages.map((_, i) => node(xs[i], Y, i, { cls: `n${i}`, fill: i === policyIdx ? P.pinkSoft : P.greenSoft })).join('');
  const loopPath = `M${xs[5]},${Y + 18} C${xs[5]},${Y + 74} ${xs[5] - 30},560 ${xs[5] - 80},560 L${xs[0] + 40},560 C${xs[0] + 10},560 ${xs[0]},${Y + 74} ${xs[0]},${Y + 18}`;
  const loopW = measure(loopLabel, 20, 'mono') + 28;

  // Packet waypoints (seconds).
  const pass = [0.15, 0.725, 1.3, 2.867, 3.433, 4.0];
  const g = [
    [0, xs[0], Y, 0], [0.15, xs[0], Y, 1], [1.3, xs[2], Y, 1], [2.3, xs[2], Y, 1], [4.0, xs[5], Y, 1],
    [4.3, xs[5], 530, 1], [4.5, xs[5] - 40, 560, 1], [6.2, xs[0] + 40, 560, 1], [6.4, xs[0], 530, 1],
    [6.6, xs[0], Y, 1], [6.8, xs[0], Y, 0], [T, xs[0], Y, 0],
  ];
  const pk = [[0, xs[0], Y, 0], [7.0, xs[0], Y, 0], [7.15, xs[0], Y, 1], [8.4, xs[2], Y, 1], [9.4, xs[2], Y, 1], [10.0, xs[2], Y, 0], [T, xs[2], Y, 0]];
  const toStops = (arr) => arr.map(([t, x, y, o]) => ({ p: pct(t), x, y, extra: `opacity:${o}` }));
  const colorStops = (name, prop, list) => `@keyframes ${name}{${list.map(([t, v]) => `${r(pct(t))}%{${prop}:${v}}`).join('')}}`;

  const nodeKf = pass.map((t, i) => colorStops(`nf${i}`, 'fill', [
    [0, 'var(--surface)'], [Math.max(0, t - 0.01), 'var(--surface)'], [t + 0.15, i === policyIdx ? 'var(--pink-soft)' : 'var(--green-soft)'],
    [6.6, i === policyIdx ? 'var(--pink-soft)' : 'var(--green-soft)'], [7.0, 'var(--surface)'], [T, 'var(--surface)'],
  ])).join('');

  const css = [
    keyframes('pkg', toStops(g)), keyframes('pkp', toStops(pk)),
    colorStops('core', 'fill', [[0, 'var(--green)'], [1.3, 'var(--green)'], [1.4, 'var(--pink)'], [2.2, 'var(--pink)'], [2.3, 'var(--green)'], [T, 'var(--green)']]),
    colorStops('glow', 'opacity', [[0, 0], [1.3, 0], [1.45, 0.35], [2.2, 0.35], [2.35, 0], [T, 0]]),
    colorStops('pglow', 'opacity', [[0, 0], [8.35, 0], [8.6, 0.45], [9.6, 0.45], [10.2, 0], [T, 0]]),
    `@keyframes tag{0%{opacity:0;transform:translate(0,8px)}${r(pct(8.4))}%{opacity:0;transform:translate(0,8px)}${r(pct(8.65))}%{opacity:1;transform:translate(0,0)}${r(pct(10.6))}%{opacity:1;transform:translate(0,0)}${r(pct(11))}%{opacity:0;transform:translate(0,0)}100%{opacity:0}}`,
    '@keyframes live{0%,100%{opacity:1}50%{opacity:.35}}',
    nodeKf,
  ].join('\n');
  const motion = [
    `.pkg{animation:pkg ${T}s linear infinite}.pkp{animation:pkp ${T}s linear infinite}`,
    `.pkg .core{animation:core ${T}s linear infinite}.pkg .glow{animation:glow ${T}s linear infinite}`,
    `.pglow{animation:pglow ${T}s linear infinite}.tag{animation:tag ${T}s ease-out infinite}`,
    '.live{animation:live 3s ease-in-out infinite}',
    stages.map((_, i) => `.n${i}{animation:nf${i} ${T}s linear infinite}`).join(''),
  ].join('\n');

  const blocked = 'BLOCKED';
  const tagW = measure(blocked, 20, 'mono') + 28;
  const body = [
    text(X, 76, person.eyebrow, { ls: 4, fill: 'subtleInk', weight: 600 }), loc, rules, name, currently,
    text(X, 310, person.role, { fam: 'mono', size: 28, fill: 'greenInk' }),
    text(X, 352, person.tagline, { size: 28, fill: 'muted' }),
    `<line x1="${xs[0]}" y1="${Y}" x2="${xs[5]}" y2="${Y}" stroke="${P.border}" stroke-width="4" stroke-linecap="round"/>`,
    `<path d="${loopPath}" fill="none" stroke="${P.pink}" stroke-opacity=".7" stroke-width="2.5" stroke-dasharray="8 8" stroke-linecap="round"/>`,
    `<rect x="${640 - loopW / 2}" y="546" width="${loopW}" height="28" fill="${P.bg}"/>`,
    text(640, 567, loopLabel, { fam: 'mono', fill: 'pinkInk', anchor: 'middle' }),
    labels,
    `<circle class="pglow" cx="${xs[2]}" cy="${Y}" r="28" fill="${P.pink}" opacity="0"/>`,
    nodes,
    `<g class="tag" opacity="0"><rect x="${xs[2] - tagW / 2}" y="508" width="${tagW}" height="30" rx="15" fill="${P.pinkInk}"/>${text(xs[2], 530, blocked, { fam: 'mono', fill: '#FFFFFF', anchor: 'middle', weight: 700 })}</g>`,
    `<g class="pkp" transform="translate(${xs[2]},${Y})" opacity="0"><circle r="9" fill="${P.pink}"/></g>`,
    `<g class="pkg" transform="translate(${xs[5]},${Y})"><circle class="glow" r="22" fill="${P.pink}" opacity="0"/><circle class="core" r="9" fill="${P.green}"/></g>`,
  ].join('\n');
  return doc({
    w: W, h: H, css, motion, body,
    title: `${person.displayName}: ${person.role}`,
    desc: `${person.tagline} Lifecycle: ${stages.join(' → ')}, then ${loopLabel}.`,
  });
}

// ---------------------------------------------------------------- buttons
const ICONS = {
  globe: (c) => `<circle cx="9" cy="9" r="8" fill="none" stroke="${c}" stroke-width="2"/><ellipse cx="9" cy="9" rx="3.5" ry="8" fill="none" stroke="${c}" stroke-width="1.6"/><line x1="1" y1="9" x2="17" y2="9" stroke="${c}" stroke-width="1.6"/>`,
  person: (c) => `<circle cx="9" cy="5.5" r="4" fill="${c}"/><path d="M1 17c0-4.4 3.6-7 8-7s8 2.6 8 7z" fill="${c}"/>`,
  mail: (c) => `<rect x="1" y="3" width="16" height="12" rx="2.5" fill="none" stroke="${c}" stroke-width="2"/><path d="M2 5l7 5.5L16 5" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>`,
  doc: (c) => `<path d="M3 1h8l4 4v12H3z" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"/><line x1="6" y1="9" x2="12" y2="9" stroke="${c}" stroke-width="1.8"/><line x1="6" y1="13" x2="12" y2="13" stroke="${c}" stroke-width="1.8"/>`,
  brackets: (c) => `<path d="M6 3L1 9l5 6M12 3l5 6-5 6" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  braces: (c) => `<path d="M6 1.5C3.5 1.5 4 4 4 6.5S2 9 1.5 9 4 9.5 4 11.5s-.5 5 2 5M12 1.5c2.5 0 2 2.5 2 5S16 9 16.5 9 14 9.5 14 11.5s.5 5-2 5" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`,
  bars: (c) => `<rect x="1" y="9" width="4" height="8" rx="1" fill="${c}"/><rect x="7" y="4" width="4" height="13" rx="1" fill="${c}"/><rect x="13" y="1" width="4" height="16" rx="1" fill="${c}"/>`,
};
export const BUTTON_H = 48;
function button(l) {
  const w = Math.ceil(48 + measure(l.label, 20, 'mono') + 22);
  const c = l.accent === 'pink' ? P.pink : P.green;
  return {
    w,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${BUTTON_H}" viewBox="0 0 ${w} ${BUTTON_H}" role="img" aria-label="${esc(l.label)}">
<title>${esc(l.label)}</title>
<style>.m{font-family:ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace}</style>
<rect x="1" y="1" width="${w - 2}" height="${BUTTON_H - 2}" rx="${(BUTTON_H - 2) / 2}" fill="${P.surface}" stroke="${P.border}" stroke-width="1.5"/>
<g transform="translate(18,15)">${ICONS[l.icon](c)}</g>
${text(46, 31, l.label, { fam: 'mono', fill: 'ink' })}
</svg>
`,
  };
}

// ---------------------------------------------------------------- lifecycle strip
function strip() {
  const W = 1280, H = 220, Y = 82;
  const xs = stages.map((_, i) => 120 + i * 208);
  const cols = stages.map((s, i) => {
    const owners = stageOwners[s] ?? [];
    const chips = owners.map((name, j) => {
      const w = measure(name, 20, 'mono') + 28;
      return chip(xs[i] - w / 2, 110 + j * 44, name, { bg: 'surfaceAlt', stroke: 'green', color: 'greenInk' }).svg;
    }).join('');
    const conn = owners.length ? `<line x1="${xs[i]}" y1="${Y + 14}" x2="${xs[i]}" y2="110" stroke="${P.border}" stroke-width="2" stroke-dasharray="3 4"/>` : '';
    return `<g class="col c${i}">${text(xs[i], 44, s, { fam: 'mono', anchor: 'middle', fill: i === policyIdx ? 'pinkInk' : 'muted', weight: i === policyIdx ? 600 : 400 })}${conn}${node(xs[i], Y, i, { size: 12, fill: i === policyIdx ? P.pinkSoft : P.greenSoft })}${chips}</g>`;
  }).join('\n');
  const css = '@keyframes up{from{opacity:0;transform:translate(0,10px)}to{opacity:1;transform:translate(0,0)}}';
  const motion = stages.map((_, i) => `.c${i}{animation:up .9s ease-out ${(0.2 + i * 0.22).toFixed(2)}s both}`).join('');
  const body = `<line x1="${xs[0]}" y1="${Y}" x2="${xs[5]}" y2="${Y}" stroke="${P.border}" stroke-width="4" stroke-linecap="round"/>\n${cols}`;
  return doc({
    w: W, h: H, css, motion, body, title: 'Lifecycle stages and the projects that own them',
    desc: stages.map((s) => `${s}: ${(stageOwners[s] ?? []).join(', ')}`).join('; '),
  });
}

// ---------------------------------------------------------------- section titles
export function sectionTitle(cmd, title) {
  return doc({
    w: 1280, h: 110, title, desc: `${cmd} ${title}`,
    body: text(56, 44, cmd, { fam: 'mono', fill: 'subtleInk' })
      + text(56, 86, title, { fam: 'mono', size: 36, fill: 'pinkInk', weight: 700 })
      + `<line x1="${56 + measure(title, 36, 'mono') + 24}" y1="74" x2="1224" y2="74" stroke="${P.grid}" stroke-width="1.5"/>`,
  });
}

// ---------------------------------------------------------------- project cards
const CARD = { w: 620, h: 300, x0: 30, x1: 590 };

function miniLifecycle(signature) {
  const y = 270;
  const dots = stages.map((s, i) => {
    const sig = s === signature;
    return `<circle cx="${CARD.x0 + 6 + i * 24}" cy="${y}" r="${sig ? 7 : 6}" fill="${sig ? P.pink : P.green}"/>`;
  }).join('');
  const line = `<line x1="${CARD.x0 + 6}" y1="${y}" x2="${CARD.x0 + 6 + 5 * 24}" y2="${y}" stroke="${P.greenSoft}" stroke-width="3"/>`;
  return line + dots + text(CARD.x0 + 6 + 5 * 24 + 22, y + 7, signature, { fam: 'mono', fill: 'pinkInk' });
}

// Each animation draws inside the band y 176..246 and returns { body, css, motion }.
const ANIMS = {
  routes() {
    const H = [186, 212, 238], V = [60, 160, 260, 360, 460, 560];
    const roads = H.map((y) => `<line x1="${V[0]}" y1="${y}" x2="${V[5]}" y2="${y}"/>`).join('') + V.map((x) => `<line x1="${x}" y1="${H[0]}" x2="${x}" y2="${H[2]}"/>`).join('');
    const A = [[60, 238], [60, 212], [560, 212], [560, 186]];
    const B = [[60, 238], [60, 212], [260, 212], [260, 186], [360, 186], [360, 212], [560, 212], [560, 186]];
    const pts = (a) => a.map((p) => p.join(',')).join(' ');
    const len = (a) => a.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - a[i][0], p[1] - a[i][1]), 0);
    const LB = Math.ceil(len(B));
    // vehicle 1 timeline (8s): along A to the closure, wait, detour along B.
    const v1 = [
      { p: 0, x: 60, y: 238, extra: 'opacity:0' }, { p: 4, x: 60, y: 238, extra: 'opacity:1' }, { p: 10, x: 60, y: 212, extra: 'opacity:1' },
      { p: 32, x: 240, y: 212, extra: 'opacity:1' }, { p: 50, x: 240, y: 212, extra: 'opacity:1' }, { p: 53, x: 260, y: 212, extra: 'opacity:1' },
      { p: 57, x: 260, y: 186, extra: 'opacity:1' }, { p: 66, x: 360, y: 186, extra: 'opacity:1' }, { p: 70, x: 360, y: 212, extra: 'opacity:1' },
      { p: 86, x: 560, y: 212, extra: 'opacity:1' }, { p: 90, x: 560, y: 186, extra: 'opacity:1' }, { p: 96, x: 560, y: 186, extra: 'opacity:0' }, { p: 100, x: 560, y: 186, extra: 'opacity:0' },
    ];
    const css = [
      keyframes('v1', v1),
      '@keyframes v2{0%{transform:translate(560px,238px)}100%{transform:translate(160px,238px)}}',
      `@keyframes closed{0%,30%{stroke:var(--grid)}36%,100%{stroke:var(--pink)}}`,
      `@keyframes xmark{0%,32%{opacity:0}38%,100%{opacity:1}}`,
      `@keyframes ra{0%,36%{opacity:1}44%,100%{opacity:0}}`,
      `@keyframes rb{0%,40%{stroke-dashoffset:${LB}}58%,100%{stroke-dashoffset:0}}`,
    ].join('');
    const motion = '.v1{animation:v1 8s linear infinite}.v2{animation:v2 8s linear infinite}.closed{animation:closed 8s linear infinite}.xm{animation:xmark 8s linear infinite}.ra{animation:ra 8s linear infinite}.rb{animation:rb 8s ease-in-out infinite}';
    const car = (c) => `<rect x="-9" y="-6" width="18" height="12" rx="4" fill="${c}"/>`;
    const body = [
      `<g stroke="${P.grid}" stroke-width="7" stroke-linecap="round">${roads}</g>`,
      `<line class="closed" x1="262" y1="212" x2="358" y2="212" stroke="${P.pink}" stroke-width="7" stroke-linecap="round"/>`,
      `<g class="xm" stroke="${P.surface}" stroke-width="2.5" stroke-linecap="round"><line x1="305" y1="207" x2="315" y2="217"/><line x1="315" y1="207" x2="305" y2="217"/></g>`,
      `<polyline class="ra" points="${pts(A)}" fill="none" stroke="${P.green}" stroke-width="3" stroke-dasharray="6 6" opacity="0"/>`,
      `<polyline class="rb" points="${pts(B)}" fill="none" stroke="${P.green}" stroke-width="3" stroke-linejoin="round" stroke-dasharray="${LB}" stroke-dashoffset="0"/>`,
      `<rect x="51" y="229" width="18" height="18" rx="4" fill="${P.ink}"/>`,
      `<circle cx="560" cy="186" r="7" fill="${P.surface}" stroke="${P.green}" stroke-width="3"/>`,
      `<g class="v2" transform="translate(300,238)">${car(P.muted)}</g>`,
      `<g class="v1" transform="translate(500,212)">${car(P.green)}</g>`,
    ].join('');
    return { body, css, motion };
  },

  lanes() {
    const zones = [['LLM', 30, 200, 'greenInk', P.surfaceAlt], ['policy engine', 200, 400, 'pinkInk', '#FDF0F5'], ['executor', 400, 590, 'greenInk', P.surfaceAlt]];
    const xs = [75, 150, 300, 445, 505, 565], Y = 230;
    const z = zones.map(([l, a, b, c, f]) => `<rect x="${a + 2}" y="178" width="${b - a - 4}" height="70" rx="10" fill="${f}"/>${text(a + 12, 200, l, { fam: 'mono', fill: c })}`).join('');
    const seps = [200, 400].map((x) => `<line x1="${x}" y1="180" x2="${x}" y2="246" stroke="${P.border}" stroke-width="2" stroke-dasharray="4 4"/>`).join('');
    const pass = [6, 16, 36, 62, 72, 82];
    const nodes = xs.map((x, i) => node(x, Y, i, { size: 8, cls: `ln${i}`, fill: i === policyIdx ? P.pinkSoft : P.greenSoft })).join('');
    const pkt = [
      { p: 0, x: 75, y: Y, extra: 'opacity:0' }, { p: 6, x: 75, y: Y, extra: 'opacity:1' }, { p: 36, x: 300, y: Y, extra: 'opacity:1' },
      { p: 52, x: 300, y: Y, extra: 'opacity:1' }, { p: 82, x: 565, y: Y, extra: 'opacity:1' }, { p: 92, x: 565, y: Y, extra: 'opacity:0' }, { p: 100, x: 75, y: Y, extra: 'opacity:0' },
    ];
    const css = keyframes('lp', pkt)
      + '@keyframes lg{0%,35%{opacity:0}38%,50%{opacity:.4}54%,100%{opacity:0}}'
      + pass.map((p, i) => `@keyframes lf${i}{0%,${Math.max(0, p - 1)}%{fill:var(--surface)}${p + 2}%,92%{fill:${i === policyIdx ? 'var(--pink-soft)' : 'var(--green-soft)'}}97%,100%{fill:var(--surface)}}`).join('');
    const motion = '.lp{animation:lp 8s linear infinite}.lg{animation:lg 8s linear infinite}' + pass.map((_, i) => `.ln${i}{animation:lf${i} 8s linear infinite}`).join('');
    const body = z + seps
      + `<line x1="75" y1="${Y}" x2="565" y2="${Y}" stroke="${P.border}" stroke-width="3"/>`
      + `<circle class="lg" cx="300" cy="${Y}" r="17" fill="${P.pink}" opacity="0"/>` + nodes
      + `<g class="lp" transform="translate(565,${Y})"><circle r="6" fill="${P.green}"/></g>`;
    return { body, css, motion };
  },

  pipeline() {
    const st = ['Collect', 'Enrich', 'Connect', 'Explore'], xs = [70, 185, 300, 415], Y = 230;
    const nodes = st.map((s, i) => text(xs[i], 200, s, { anchor: 'middle', fill: i === 3 ? 'greenInk' : 'muted', weight: 600 })
      + `<rect x="${xs[i] - 10}" y="${Y - 10}" width="20" height="20" rx="6" fill="${P.surfaceAlt}" stroke="${P.green}" stroke-width="2.5"/>`).join('');
    const dots = [0, 1, 2].map((k) => `<circle class="fd fd${k}" cx="0" cy="0" r="4.5" fill="${P.green}" transform="translate(${xs[k] + 58},${Y})"/>`).join('');
    // sentiment ticker
    const spark = [[478, 236], [490, 228], [502, 232], [514, 214], [526, 222], [538, 240], [550, 226], [562, 206], [574, 212], [586, 196]];
    const sp = spark.map((p) => p.join(',')).join(' ');
    const css = `@keyframes flow{0%{transform:translate(${xs[0]}px,${Y}px);opacity:0}8%{opacity:1}92%{opacity:1}100%{transform:translate(${xs[3]}px,${Y}px);opacity:0}}`
      + '@keyframes draw{0%{stroke-dashoffset:200}60%,100%{stroke-dashoffset:0}}@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}';
    const motion = '.fd{animation:flow 3.6s linear infinite}.fd1{animation-delay:-1.2s}.fd2{animation-delay:-2.4s}.tk{animation:draw 6s ease-out infinite}.tkd{animation:blink 2s ease-in-out infinite}';
    const body = `<line x1="${xs[0]}" y1="${Y}" x2="${xs[3]}" y2="${Y}" stroke="${P.border}" stroke-width="3"/>` + nodes + dots
      + `<line x1="474" y1="246" x2="590" y2="246" stroke="${P.grid}" stroke-width="1.5"/><line x1="474" y1="221" x2="590" y2="221" stroke="${P.grid}" stroke-width="1.5" stroke-dasharray="3 4"/>`
      + `<polyline class="tk" points="${sp}" fill="none" stroke="${P.green}" stroke-width="2.5" stroke-linejoin="round" stroke-dasharray="200" stroke-dashoffset="0"/>`
      + `<circle cx="538" cy="240" r="3.5" fill="${P.pink}"/><circle class="tkd" cx="586" cy="196" r="5" fill="${P.green}"/>`;
    return { body, css, motion };
  },

  graph() {
    const N = [[70, 212], [150, 190], [150, 236], [240, 186], [240, 214], [240, 240], [330, 198], [330, 234], [410, 214]];
    const E = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [3, 6], [4, 6], [5, 7], [6, 8], [7, 8]];
    const HOT = 6;
    const delay = (i) => (i * 0.32).toFixed(2);
    const edges = E.map(([a, b]) => `<line class="ge" style="animation-delay:${delay(b)}s" x1="${N[a][0]}" y1="${N[a][1]}" x2="${N[b][0]}" y2="${N[b][1]}" stroke="${P.border}" stroke-width="2.5"/>`).join('');
    const nodes = N.map(([x, y], i) => i === HOT
      ? `<circle class="hring" cx="${x}" cy="${y}" r="10" fill="none" stroke="${P.pink}" stroke-width="2"/><circle class="gn" style="animation-delay:${delay(i)}s" cx="${x}" cy="${y}" r="9" fill="${P.pink}"/>`
      : `<circle class="gn" style="animation-delay:${delay(i)}s" cx="${x}" cy="${y}" r="7" fill="${P.surface}" stroke="${P.green}" stroke-width="2.5"/>`).join('');
    const badge = `<g class="gb"><rect x="450" y="186" width="140" height="52" rx="14" fill="${P.surfaceAlt}" stroke="${P.green}" stroke-width="2"/>`
      + text(466, 219, 'grade', { fam: 'mono', fill: 'subtleInk' }) + text(576, 224, 'B+', { size: 30, weight: 800, fill: 'greenInk', anchor: 'end' }) + '</g>';
    const css = '@keyframes gin{0%{opacity:0}6%,88%{opacity:1}96%,100%{opacity:0}}'
      + '@keyframes ring{0%,40%{opacity:0;stroke-width:2}55%{opacity:.9;stroke-width:6}75%,100%{opacity:0;stroke-width:2}}'
      + '@keyframes gb{0%,42%{opacity:0;transform:translate(0,6px)}50%,88%{opacity:1;transform:translate(0,0)}96%,100%{opacity:0}}';
    const motion = '.gn,.ge{animation:gin 8s ease-out infinite both}.hring{animation:ring 2.6s ease-out infinite}.gb{animation:gb 8s ease-out infinite}';
    return { body: edges + nodes + badge, css, motion };
  },

  gates() {
    const G = [['regex', 240], ['read-only', 350], ['LIMIT', 460]], Y = 224;
    const gates = G.map(([l, x], i) => text(x, 194, l, { fam: 'mono', anchor: 'middle', fill: 'muted' })
      + `<rect class="gt gt${i}" x="${x - 4}" y="202" width="8" height="44" rx="4" fill="${P.green}"/>`).join('');
    const dW = measure('DROP TABLE', 20, 'mono') + 24, sW = measure('SELECT', 20, 'mono') + 24;
    const pkt = (label, w, c, bg, cls, x) => `<g class="${cls}" transform="translate(${x},${Y - 15})"><rect width="${w}" height="30" rx="15" fill="${bg}" stroke="${c}" stroke-width="2"/>${text(12, 22, label, { fam: 'mono', fill: c === P.pink ? 'pinkInk' : 'greenInk' })}</g>`;
    const dStop = 240 - 8 - dW, sEnd = 590 - sW;
    const css = `@keyframes drop{0%{transform:translate(0px,${Y - 15}px);opacity:0}6%{opacity:1}24%{transform:translate(${r(dStop)}px,${Y - 15}px)}27%{transform:translate(${r(dStop - 6)}px,${Y - 15}px)}30%,42%{transform:translate(${r(dStop)}px,${Y - 15}px);opacity:1}48%,100%{transform:translate(${r(dStop)}px,${Y - 15}px);opacity:0}}`
      + `@keyframes dcol{0%,23%{stroke:var(--subtle)}25%,100%{stroke:var(--pink)}}`
      + `@keyframes sel{0%,50%{transform:translate(30px,${Y - 15}px);opacity:0}54%{opacity:1}88%{transform:translate(${r(sEnd)}px,${Y - 15}px);opacity:1}96%,100%{transform:translate(${r(sEnd)}px,${Y - 15}px);opacity:0}}`
      + `@keyframes g0{0%,22%{fill:var(--green)}25%,44%{fill:var(--pink)}48%,100%{fill:var(--green)}}`
      + `@keyframes x0{0%,24%{opacity:0}27%,44%{opacity:1}48%,100%{opacity:0}}`;
    const motion = '.dp{animation:drop 8s ease-out infinite}.dp rect{animation:dcol 8s linear infinite}.sl{animation:sel 8s linear infinite}.gt0{animation:g0 8s linear infinite}.gx{animation:x0 8s linear infinite}';
    const x = `<g class="gx" stroke="${P.pinkInk}" stroke-width="3" stroke-linecap="round"><line x1="${240 + 14}" y1="${Y - 8}" x2="${240 + 28}" y2="${Y + 6}"/><line x1="${240 + 28}" y1="${Y - 8}" x2="${240 + 14}" y2="${Y + 6}"/></g>`;
    const body = gates + pkt('DROP TABLE', dW, P.pink, '#FDF0F5', 'dp', dStop) + pkt('SELECT', sW, P.green, P.surfaceAlt, 'sl', sEnd) + x;
    return { body, css, motion };
  },
};

function card(p) {
  const { w, h, x0, x1 } = CARD;
  const anim = ANIMS[p.anim]();
  const desc = wrap(p.description, 20, x1 - x0, 'sans');
  if (desc.length > 2) throw new Error(`${p.name}: description wraps to ${desc.length} lines; shorten it in config.js`);
  const tag = isFilled(p.demo)
    ? text(x1, 50, 'live demo ↗', { fam: 'mono', fill: 'pinkInk', anchor: 'end' })
    : text(x1, 50, 'repo ↗', { fam: 'mono', fill: 'greenInk', anchor: 'end' });
  let cx = x0, chips = '';
  for (const c of p.chips) {
    const ch = chip(cx, 130, c, { size: 20, h: 32, padX: 12, color: 'ink', dot: 'green' });
    if (cx + ch.w > x1) break;
    chips += ch.svg; cx += ch.w + 8;
  }
  const body = [
    `<rect x="8" y="8" width="${w - 16}" height="${h - 16}" rx="16" fill="${P.surface}" stroke="${P.border}" stroke-width="1.5" filter="url(#sh)"/>`,
    text(x0, 54, p.name, { size: 32, weight: 700, fill: 'green' }), tag,
    desc.map((l, i) => text(x0, 90 + i * 26, l, { fill: 'muted' })).join(''),
    chips,
    anim.body,
    miniLifecycle(p.signature),
  ].join('\n');
  return doc({
    w, h, radius: 20, border: false, defs: shadowFilter, css: anim.css, motion: anim.motion, body,
    title: `${p.name}: ${p.description}`, desc: `Stack: ${p.chips.join(', ')}. Signature stage: ${p.signature}.`,
  });
}

function labCard(repos) {
  const { w, h, x0, x1 } = CARD;
  const lines = wrap(lab.line, 20, x1 - x0, 'sans');
  let cx = x0, chips = '';
  for (const tag of lab.tags) {
    const ch = chip(cx, 150, tag, { dash: true, color: 'muted', size: 20, h: 32, padX: 12 });
    if (cx + ch.w > x1) break;
    chips += ch.svg; cx += ch.w + 8;
  }
  const body = [
    `<rect x="8" y="8" width="${w - 16}" height="${h - 16}" rx="16" fill="${P.surface}" stroke="${P.pink}" stroke-opacity=".55" stroke-width="2" stroke-dasharray="9 7"/>`,
    text(x0, 54, lab.title, { size: 32, weight: 700, fill: 'pink' }),
    text(x1, 50, '$ ls', { fam: 'mono', fill: 'subtleInk', anchor: 'end' }),
    lines.map((l, i) => text(x0, 90 + i * 26, l, { fill: 'muted' })).join(''),
    chips,
    text(x0, 222, `${repos.length} repos · notebooks, side projects, coursework`, { fam: 'mono', fill: 'subtleInk' }),
    `<g class="ex">${text(x0, 274, 'expand ▸', { fam: 'mono', fill: 'pinkInk', weight: 600 })}</g>`,
  ].join('\n');
  return doc({
    w, h, radius: 20, border: false, body, css: '@keyframes nudge{0%,70%,100%{transform:translate(0,0)}80%{transform:translate(6px,0)}}', motion: '.ex{animation:nudge 4s ease-in-out infinite}',
    title: `${lab.title}: ${lab.line}`, desc: `Includes ${repos.join(', ')}.`,
  });
}

// ---------------------------------------------------------------- footer
function footer() {
  const W = 1280, H = 130, cx = 640, cy = 62, rx = 150, ry = 34;
  const N = 24;
  const pts = Array.from({ length: N + 1 }, (_, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    return { p: (i / N) * 100, x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
  });
  const lw = measure(loopLabel, 22, 'mono') + 30;
  const body = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${P.pink}" stroke-opacity=".6" stroke-width="2.5" stroke-dasharray="8 8"/>`
    + `<rect x="${cx - lw / 2}" y="${cy - 17}" width="${lw}" height="34" rx="17" fill="${P.bg}"/>`
    + text(cx, cy + 8, loopLabel, { fam: 'mono', size: 22, fill: 'pinkInk', anchor: 'middle', weight: 600 })
    + `<g class="fl" transform="translate(${cx},${cy - ry})"><circle r="7" fill="${P.green}"/></g>`
    + text(cx, 120, stages.join(' → '), { fam: 'mono', fill: 'subtleInk', anchor: 'middle' });
  return doc({ w: W, h: H + 14, body, css: keyframes('fl', pts), motion: '.fl{animation:fl 7s linear infinite}', title: loopLabel, desc: `${stages.join(' → ')}, then ${loopLabel}.` });
}

// ---------------------------------------------------------------- README
const hash = (file) => existsSync(file) ? createHash('sha1').update(readFileSync(file)).digest('hex').slice(0, 7) : '0';
const src = (dir, name) => `assets/${dir}/${name}?v=${hash(join(ROOT, 'assets', dir, name))}`;
const readJSON = (f, d) => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return d; } };

export function labRepos() {
  const meta = readJSON(join(GENERATED, 'meta.json'), {});
  if (Array.isArray(meta.lab) && meta.lab.length) return meta.lab;
  return Object.entries(lab.include).map(([name, line]) => ({ name, line, url: `https://github.com/${person.username}/${name}` }));
}

export function renderReadme() {
  const meta = readJSON(join(GENERATED, 'meta.json'), {});
  const gen = (n) => existsSync(join(GENERATED, n));
  const btns = links.filter((l) => isFilled(l.url)).map((l) => {
    const w = button(l).w;
    return `<a href="${esc(l.url)}"><img src="${src('static', `btn-${l.id}.svg`)}" alt="${esc(l.label)}" height="36" width="${Math.round((w * 36) / BUTTON_H)}"></a>`;
  }).join('\n  ');
  const cardCell = (p) => {
    const repo = `https://github.com/${person.username}/${p.repo}`;
    const linksRow = [`<a href="${repo}">repo</a>`, isFilled(p.demo) ? `<a href="${esc(p.demo)}">live demo</a>` : ''].filter(Boolean).join(' · ');
    return `<td width="50%" valign="top" align="center">
<a href="${repo}"><img src="${src('static', `card-${p.slug}.svg`)}" width="100%" alt="${esc(`${p.name}: ${p.description}`)}"></a>
<br><sub>${linksRow}</sub>
</td>`;
  };
  const labCell = `<td width="50%" valign="top" align="center">
<a href="#lab-notebook"><img src="${src('static', 'card-lab.svg')}" width="100%" alt="${esc(`${lab.title}: ${lab.line}`)}"></a>
<br><sub><a href="#lab-notebook">expand the lab notebook</a></sub>
</td>`;
  const cells = [...projects.map(cardCell), labCell];
  const rows = [];
  for (let i = 0; i < cells.length; i += 2) rows.push(`<tr>\n${cells[i]}\n${cells[i + 1] ?? '<td width="50%"></td>'}\n</tr>`);
  const labList = labRepos().map((x) => `<li><a href="${esc(x.url)}"><code>${esc(x.name)}</code></a> — ${esc(x.line)}</li>`).join('\n');
  const refreshed = meta.refreshedAt ? meta.refreshedAt.replace('T', ' ').slice(0, 16) + ' UTC' : new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const img = (dir, name, alt) => `<p align="center"><img src="${src(dir, name)}" width="100%" alt="${esc(alt)}"></p>`;

  return `<!-- Generated by scripts/build-static.js from scripts/config.js. Do not edit by hand. -->
${img('static', 'hero.svg', `${person.displayName}. ${person.role}. ${person.tagline}`)}

<p align="center">
  ${btns}
</p>

<p align="center">
  <a href="#projects"><code>$ cd projects</code></a> · <a href="#lifecycle"><code>$ cat lifecycle</code></a> · <a href="#pulse"><code>$ git log --pulse</code></a> · <a href="#stack"><code>$ ls stack</code></a>
</p>

<a name="lifecycle"></a>
${img('static', 'lifecycle-strip.svg', `Lifecycle: ${stages.map((s) => `${s} (${(stageOwners[s] ?? []).join(', ')})`).join(', ')}`)}

<a name="projects"></a>
${img('static', 'title-projects.svg', 'The lifecycle of what I build')}

<table>
${rows.join('\n')}
</table>

<a name="lab-notebook"></a>
<details>
<summary><code>$ ls lab-notebook/</code></summary>
<br>
<ul>
${labList}
</ul>
</details>

<a name="pulse"></a>
${gen('pulse.svg') ? img('generated', 'pulse.svg', 'Commit pulse: weekly contributions over the last year drawn as a heartbeat line') : ''}
${gen('latest.svg') ? img('generated', 'latest.svg', 'Latest pushes: the four most recently pushed repositories and their last commit') : ''}

<a name="stack"></a>
${gen('stack.svg') ? img('generated', 'stack.svg', 'Tech stack grouped by languages, backend and data, frontend, AI and LLM, infra and tooling, core CS') : ''}
${gen('cp.svg') ? img('generated', 'cp.svg', 'Competitive programming scoreboard') : ''}

${img('static', 'footer.svg', `${loopLabel}: ${stages.join(', ')}`)}
<p align="center"><sub>last refreshed ${refreshed} by a GitHub Action</sub></p>
`.replace(/\n{3,}/g, '\n\n');
}

// ---------------------------------------------------------------- main
export function buildStatic() {
  write(STATIC, 'hero.svg', hero());
  for (const l of links) if (isFilled(l.url)) write(STATIC, `btn-${l.id}.svg`, button(l).svg);
  write(STATIC, 'lifecycle-strip.svg', strip());
  write(STATIC, 'title-projects.svg', sectionTitle('$ cd projects', 'The lifecycle of what I build'));
  for (const p of projects) write(STATIC, `card-${p.slug}.svg`, card(p));
  write(STATIC, 'card-lab.svg', labCard(labRepos().map((x) => x.name)));
  write(STATIC, 'footer.svg', footer());
  writeFileSync(join(ROOT, 'README.md'), renderReadme());
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  buildStatic();
  console.log('static visuals + README written');
}
