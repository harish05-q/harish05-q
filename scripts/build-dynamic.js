// Fetches live data (GitHub, LeetCode, Codeforces, CodeChef) and renders the
// generated SVGs. Every source fails independently: on error the previous SVG
// is kept and the script still exits 0. Run: node scripts/build-dynamic.js
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  person, palette as P, projects, lab, stack, cp, ignoredLanguages, languageColors, isFilled,
} from './config.js';
import { doc, text, chip, measure, truncate, esc, r, shadowFilter } from './lib/svg.js';
import { renderReadme } from './build-static.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'generated');
const USER = person.username;
const TOKEN = process.env.PROFILE_PAT || process.env.GITHUB_TOKEN || '';
const UA = { 'User-Agent': `${USER}-profile-builder` };
const changed = [];

mkdirSync(OUT, { recursive: true });
const read = (f) => (existsSync(f) ? readFileSync(f, 'utf8') : null);

function save(name, content) {
  const f = join(OUT, name);
  if (read(f) === content) return;
  writeFileSync(f, content);
  changed.push(name);
}

async function attempt(label, fn) {
  try { return await fn(); } catch (e) { console.warn(`[skip] ${label}: ${e.message}`); return null; }
}

async function get(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { ...UA, ...(opts.headers || {}) }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return opts.text ? res.text() : res.json();
}
const gh = (path) => get(`https://api.github.com${path}`, { headers: { Accept: 'application/vnd.github+json', ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) } });

// ---------------------------------------------------------------- contributions
async function contributionsGraphQL() {
  if (!TOKEN) throw new Error('no token');
  const query = `query($login:String!){user(login:$login){contributionsCollection{totalCommitContributions contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: { ...UA, Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { login: USER } }),
  });
  const json = await res.json();
  const c = json?.data?.user?.contributionsCollection;
  if (!c) throw new Error(json?.errors?.[0]?.message || 'no data');
  const days = c.contributionCalendar.weeks.flatMap((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })));
  return { days, commits: c.totalCommitContributions };
}

// Fallback: the public calendar HTML (no auth needed).
async function contributionsScrape() {
  const html = await get(`https://github.com/users/${USER}/contributions`, { text: true });
  const dates = {};
  for (const m of html.matchAll(/<td[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="([^"]+)"/g)) dates[m[2]] = m[1];
  for (const m of html.matchAll(/<td[^>]*id="([^"]+)"[^>]*data-date="(\d{4}-\d{2}-\d{2})"/g)) dates[m[1]] = m[2];
  const days = [];
  for (const m of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    if (!dates[m[1]]) continue;
    const n = /^(\d[\d,]*) contribution/.exec(m[2].trim());
    days.push({ date: dates[m[1]], count: n ? Number(n[1].replace(/,/g, '')) : 0 });
  }
  if (days.length < 300) throw new Error(`parsed only ${days.length} days`);
  return { days, commits: null };
}

function toWeeks(days) {
  const byWeek = new Map();
  for (const d of [...days].sort((a, b) => a.date.localeCompare(b.date))) {
    const dt = new Date(d.date + 'T00:00:00Z');
    dt.setUTCDate(dt.getUTCDate() - dt.getUTCDay());
    const k = dt.toISOString().slice(0, 10);
    byWeek.set(k, (byWeek.get(k) ?? 0) + d.count);
  }
  return [...byWeek.entries()].map(([start, total]) => ({ start, total })).slice(-52);
}

function pulseSvg({ days, commits }) {
  const W = 1280, H = 260, X0 = 56, X1 = 1224, BASE = 172;
  const weeks = toWeeks(days);
  const max = Math.max(1, ...weeks.map((w) => w.total));
  const step = (X1 - X0) / weeks.length;
  let d = `M${X0},${BASE}`;
  let len = 0, px = X0, py = BASE;
  const to = (x, y) => { d += ` L${r(x)},${r(y)}`; len += Math.hypot(x - px, y - py); px = x; py = y; };
  weeks.forEach((w, i) => {
    const cx = X0 + step * (i + 0.5);
    const h = w.total ? 12 + (Math.sqrt(w.total) / Math.sqrt(max)) * 92 : 3;
    to(cx - 7, BASE); to(cx - 4, BASE + 5); to(cx, BASE - h); to(cx + 4, BASE + Math.min(14, 4 + h * 0.12)); to(cx + 8, BASE);
  });
  to(X1, BASE);
  const L = Math.ceil(len);
  const last = weeks[weeks.length - 1];
  const lastX = X0 + step * (weeks.length - 0.5);
  const busiest = weeks.reduce((a, b) => (b.total > a.total ? b : a), weeks[0]);
  const total = days.reduce((a, b) => a + b.count, 0);
  const active = days.filter((x) => x.count > 0).length;
  const fmt = (s) => new Date(s + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const stats = [
    ['busiest week', `${fmt(busiest.start)} · ${busiest.total}`],
    [commits != null ? 'commits in the last year' : 'contributions in the last year', String(commits ?? total)],
    ['active days', String(active)],
  ];
  const statSvg = stats.map(([k, v], i) => {
    const x = [X0, 640, X1][i], anchor = ['start', 'middle', 'end'][i];
    return text(x, 238, `<tspan fill="${P.ink}" font-weight="700">${esc(v)}</tspan><tspan fill="${P.muted}"> ${esc(k)}</tspan>`, { fam: 'mono', anchor, raw: true });
  }).join('');
  const css = `@keyframes draw{0%{stroke-dashoffset:${L}}45%,100%{stroke-dashoffset:0}}@keyframes fade{0%,30%{opacity:0}55%,100%{opacity:1}}@keyframes beat{0%,45%{transform:scale(1);opacity:1}60%{transform:scale(2.4);opacity:0}100%{opacity:0}}`;
  const motion = '.ln{animation:draw 8s ease-out infinite}.ar{animation:fade 8s ease-out infinite}.bt{animation:beat 2s ease-out infinite;transform-box:fill-box;transform-origin:center}';
  const body = [
    text(X0, 50, 'Commit pulse', { fam: 'mono', size: 26, weight: 700, fill: 'pinkInk' }),
    text(X1, 48, 'drawn from real commits', { fam: 'mono', fill: 'subtleInk', anchor: 'end' }),
    `<line x1="${X0}" y1="${BASE}" x2="${X1}" y2="${BASE}" stroke="${P.grid}" stroke-width="1.5"/>`,
    `<path class="ar" d="${d} L${X1},${BASE + 14} L${X0},${BASE + 14} Z" fill="${P.pinkSoft}" fill-opacity=".55"/>`,
    `<path class="ln" d="${d}" fill="none" stroke="${P.pink}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="${L}" stroke-dashoffset="0"/>`,
    `<circle class="bt" cx="${r(lastX)}" cy="${BASE}" r="6" fill="${P.pink}" opacity=".5"/><circle cx="${r(lastX)}" cy="${BASE}" r="5" fill="${P.pink}"/>`,
    text(X0, 208, '52 weeks ago', { fam: 'mono', fill: 'subtleInk' }),
    text(X1, 208, `this week · ${last.total}`, { fam: 'mono', fill: 'subtleInk', anchor: 'end' }),
    `<line x1="${X0}" y1="216" x2="${X1}" y2="216" stroke="${P.grid}" stroke-width="1.5"/>`,
    statSvg,
  ].join('\n');
  return doc({ w: W, h: H, css, motion, body, title: 'Commit pulse', desc: `Weekly contributions over the last 52 weeks. Busiest week ${busiest.start} with ${busiest.total}; ${total} contributions; ${active} active days.` });
}

// ---------------------------------------------------------------- latest pushes
function ago(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 86400 * 45) return `${Math.round(s / 86400)}d ago`;
  return `${Math.round(s / (86400 * 30))}mo ago`;
}

function fit(str, size, maxW, fam = 'sans') {
  let s = str;
  while (s.length > 1 && measure(s, size, fam) > maxW) s = s.slice(0, -2) + '…';
  return s;
}

function latestSvg(rows) {
  const W = 1280, H = 240;
  const head = `<path d="M0.75,24.75 a24,24 0 0 1 24,-24 H${W - 24.75} a24,24 0 0 1 24,24 V52 H0.75 Z" fill="${P.surfaceAlt}"/><line x1="0.75" y1="52" x2="${W - 0.75}" y2="52" stroke="${P.border}" stroke-width="1.5"/>`
    + [P.pink, P.pinkSoft, P.green].map((c, i) => `<circle cx="${32 + i * 22}" cy="26" r="7" fill="${c}"/>`).join('')
    + text(112, 33, '$ git log --recent', { fam: 'mono', fill: 'ink', weight: 600 })
    + text(W - 32, 33, `${USER}`, { fam: 'mono', fill: 'subtleInk', anchor: 'end' });
  const lines = rows.map((x, i) => {
    const y = 96 + i * 38;
    const lc = languageColors[x.language] ?? P.subtle;
    return `<g class="row r${i}">`
      + text(48, y, '›', { fam: 'mono', fill: 'pinkInk', weight: 700 })
      + text(72, y, fit(x.name, 20, 250, 'mono'), { fam: 'mono', fill: 'greenInk', weight: 600 })
      + (x.language ? `<circle cx="340" cy="${y - 7}" r="6" fill="${lc}"/>` + text(354, y, x.language, { fill: 'muted' }) : '')
      + text(560, y, x.when, { fam: 'mono', fill: 'subtleInk', anchor: 'end' })
      + text(592, y, fit(truncate(x.message, 60), 20, 1240 - 592), { fill: 'ink' })
      + '</g>';
  }).join('\n');
  const css = '@keyframes in{from{opacity:0;transform:translate(-8px,0)}to{opacity:1;transform:translate(0,0)}}@keyframes cur{0%,49%{opacity:1}50%,100%{opacity:0}}';
  const motion = rows.map((_, i) => `.r${i}{animation:in .6s ease-out ${(0.15 + i * 0.18).toFixed(2)}s both}`).join('') + '.cur{animation:cur 1.1s steps(1) infinite}';
  const cursorX = 112 + measure('$ git log --recent', 20, 'mono') + 6;
  return doc({
    w: W, h: H, css, motion,
    body: head + `<rect class="cur" x="${r(cursorX)}" y="17" width="11" height="20" fill="${P.green}"/>` + lines,
    title: 'Latest pushes', desc: rows.map((x) => `${x.name} (${x.when}): ${x.message}`).join('; '),
  });
}

// ---------------------------------------------------------------- tech stack
function stackSvg(groups) {
  const W = 1280, LX = 56, CX = 280, MAX = 1224, ROW = 46;
  let y = 104;
  const parts = [];
  groups.forEach((g, gi) => {
    let x = CX, rows = 1;
    const chips = [];
    for (const item of g.items) {
      const dot = gi === 0 ? (languageColors[item] ?? P.green) : (gi % 2 ? P.pink : P.green);
      let c = chip(x, y + (rows - 1) * ROW, item, { fam: 'sans', size: 20, h: 34, padX: 12, dot, color: 'ink' });
      if (x + c.w > MAX) { rows++; x = CX; c = chip(x, y + (rows - 1) * ROW, item, { fam: 'sans', size: 20, h: 34, padX: 12, dot, color: 'ink' }); }
      chips.push(c.svg); x += c.w + 10;
    }
    parts.push(`<g class="grp g${gi}">${text(LX, y + 24, g.group, { weight: 700, fill: 'ink' })}${chips.join('')}</g>`);
    y += rows * ROW + 14;
    if (gi < groups.length - 1) parts.push(`<line x1="${LX}" y1="${y - 7}" x2="${MAX}" y2="${y - 7}" stroke="${P.grid}" stroke-width="1.5"/>`);
  });
  const H = y + 14;
  const css = '@keyframes in{from{opacity:0}to{opacity:1}}';
  const motion = groups.map((_, i) => `.g${i}{animation:in .8s ease-out ${(0.1 + i * 0.2).toFixed(2)}s both}`).join('');
  const body = text(LX, 44, '$ ls stack', { fam: 'mono', fill: 'subtleInk' }) + text(LX, 80, 'Tech stack', { fam: 'mono', size: 30, weight: 700, fill: 'pinkInk' }) + parts.join('\n');
  return doc({ w: W, h: H, css, motion, body, title: 'Tech stack', desc: groups.map((g) => `${g.group}: ${g.items.join(', ')}`).join('. ') });
}

// ---------------------------------------------------------------- competitive programming
async function leetcode(handle) {
  const res = await fetch('https://leetcode.com/graphql', {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: { ...UA, 'Content-Type': 'application/json', Referer: 'https://leetcode.com' },
    body: JSON.stringify({ query: 'query($u:String!){matchedUser(username:$u){submitStatsGlobal{acSubmissionNum{difficulty count}}}}', variables: { u: handle } }),
  });
  const list = (await res.json())?.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum;
  if (!list) throw new Error('no LeetCode data');
  const n = Object.fromEntries(list.map((x) => [x.difficulty, x.count]));
  return { kind: 'leetcode', total: n.All, easy: n.Easy, medium: n.Medium, hard: n.Hard };
}

async function codeforces(handle) {
  const info = (await get(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`)).result[0];
  const hist = await attempt('codeforces rating', async () => (await get(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`)).result.map((x) => x.newRating));
  return { kind: 'codeforces', rating: info.rating ?? 0, max: info.maxRating ?? 0, rank: info.rank ?? 'unrated', history: hist ?? [] };
}

async function codechef(handle) {
  const html = await get(`https://www.codechef.com/users/${encodeURIComponent(handle)}`, { text: true, headers: { 'User-Agent': 'Mozilla/5.0' } });
  const rating = /<div class="rating-number">\s*(\d+)/.exec(html)?.[1];
  const stars = (/<div class="rating-star">([\s\S]*?)<\/div>/.exec(html)?.[1].match(/&#9733;|★/g) ?? []).length;
  const highest = /Highest Rating (\d+)/.exec(html)?.[1];
  if (!rating) throw new Error('rating not found');
  return { kind: 'codechef', rating: Number(rating), stars, highest: highest ? Number(highest) : null };
}

function cpPanel(p, x, w) {
  const y = 76, h = 148;
  const frame = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${P.surface}" stroke="${P.border}" stroke-width="1.5" filter="url(#sh)"/>`;
  if (p.kind === 'leetcode') {
    const cx = x + 84, cy = y + h / 2, R = 48, C = 2 * Math.PI * R;
    let off = 0;
    const segs = [['easy', P.green], ['medium', P.pink], ['hard', P.ink]].map(([k, c]) => {
      const len = (p[k] / Math.max(1, p.total)) * C;
      const s = `<circle class="dn" cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${c}" stroke-width="14" stroke-dasharray="${r(len)} ${r(C - len)}" stroke-dashoffset="${r(-off)}" transform="rotate(-90 ${cx} ${cy})"/>`;
      off += len; return s;
    }).join('');
    const legend = [['Easy', p.easy, P.green], ['Medium', p.medium, P.pink], ['Hard', p.hard, P.ink]]
      .map(([k, v, c], i) => `<circle cx="${x + 170}" cy="${y + 68 + i * 26}" r="6" fill="${c}"/>` + text(x + 184, y + 75 + i * 26, `${k} `, { fam: 'mono', fill: 'muted' }) + text(x + w - 28, y + 75 + i * 26, String(v), { fam: 'mono', fill: 'ink', weight: 700, anchor: 'end' })).join('');
    return frame + `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${P.grid}" stroke-width="14"/>` + segs
      + text(cx, cy + 9, String(p.total), { size: 26, weight: 800, anchor: 'middle' })
      + text(x + 170, y + 38, 'LeetCode', { size: 24, weight: 700, fill: 'greenInk' }) + text(x + w - 28, y + 36, 'solved', { fam: 'mono', fill: 'subtleInk', anchor: 'end' }) + legend;
  }
  if (p.kind === 'codeforces') {
    const hs = p.history.length > 1 ? p.history : [p.rating, p.rating];
    const lo = Math.min(...hs), hi = Math.max(...hs), sx = x + 28, sw = w - 56, sy = y + 96, sh = 36;
    const pts = hs.map((v, i) => `${r(sx + (i / (hs.length - 1)) * sw)},${r(sy + sh - ((v - lo) / Math.max(1, hi - lo)) * sh)}`).join(' ');
    return frame + text(x + 28, y + 38, 'Codeforces', { size: 24, weight: 700, fill: 'greenInk' })
      + text(x + w - 28, y + 36, p.rank, { fam: 'mono', fill: 'pinkInk', anchor: 'end' })
      + text(x + 28, y + 80, `<tspan font-weight="800" fill="${P.ink}" font-size="30">${p.rating}</tspan><tspan fill="${P.muted}"> rating · max ${p.max}</tspan>`, { fam: 'mono', raw: true })
      + `<polyline class="sp" points="${pts}" fill="none" stroke="${P.pink}" stroke-width="2.5" stroke-linejoin="round"/>`;
  }
  const stars = Array.from({ length: Math.max(0, Math.min(7, p.stars)) }, (_, i) => `<path transform="translate(${x + 28 + i * 30},${y + 106})" d="M11 0l3.2 7 7.6.8-5.7 5.1 1.6 7.5L11 16.6 4.3 20.4l1.6-7.5L.2 7.8 7.8 7z" fill="${P.green}"/>`).join('');
  return frame + text(x + 28, y + 38, 'CodeChef', { size: 24, weight: 700, fill: 'greenInk' })
    + text(x + w - 28, y + 36, `${p.stars}★`, { fam: 'mono', fill: 'pinkInk', anchor: 'end', weight: 700 })
    + text(x + 28, y + 80, `<tspan font-weight="800" fill="${P.ink}" font-size="30">${p.rating}</tspan><tspan fill="${P.muted}"> rating${p.highest ? ` · highest ${p.highest}` : ''}</tspan>`, { fam: 'mono', raw: true })
    + stars;
}

function cpSvg(panels) {
  const W = 1280, H = 248, X0 = 56, X1 = 1224, GAP = 24;
  const w = (X1 - X0 - GAP * (panels.length - 1)) / panels.length;
  const body = text(X0, 44, '$ cat scoreboard', { fam: 'mono', fill: 'subtleInk' })
    + text(X1, 44, 'competitive programming', { fam: 'mono', fill: 'pinkInk', anchor: 'end', weight: 700 })
    + panels.map((p, i) => `<g class="pn p${i}">${cpPanel(p, r(X0 + i * (w + GAP)), r(w))}</g>`).join('');
  const css = '@keyframes in{from{opacity:0;transform:translate(0,8px)}to{opacity:1;transform:translate(0,0)}}';
  const motion = panels.map((_, i) => `.p${i}{animation:in .8s ease-out ${(0.1 + i * 0.2).toFixed(2)}s both}`).join('');
  return doc({ w: W, h: H, css, motion, body, defs: shadowFilter, title: 'Competitive programming scoreboard', desc: panels.map((p) => p.kind === 'leetcode' ? `LeetCode ${p.total} solved` : `${p.kind} rating ${p.rating}`).join('; ') });
}

// ---------------------------------------------------------------- main
async function main() {
  const meta = JSON.parse(read(join(OUT, 'meta.json')) ?? '{}');

  // Commit pulse
  const contrib = await attempt('contributions (graphql)', contributionsGraphQL) ?? await attempt('contributions (scrape)', contributionsScrape);
  if (contrib && contrib.days.length) save('pulse.svg', pulseSvg(contrib));

  // Repos: latest pushes + lab notebook
  const repos = await attempt('repo list', () => gh(`/users/${USER}/repos?per_page=100&sort=pushed&type=owner`));
  if (Array.isArray(repos)) {
    const own = repos.filter((x) => !x.fork && x.name.toLowerCase() !== USER.toLowerCase());
    const top = own.slice(0, 4);
    const rows = await attempt('latest commits', () => Promise.all(top.map(async (x) => {
      const commits = await attempt(`commits ${x.name}`, () => gh(`/repos/${USER}/${x.name}/commits?per_page=1`));
      const message = commits?.[0]?.commit?.message ?? x.description ?? '';
      return { name: x.name, language: x.language, when: ago(x.pushed_at), message };
    })));
    if (rows?.length) save('latest.svg', latestSvg(rows));

    const featured = new Set(projects.map((p) => p.repo.toLowerCase()));
    const excluded = new Set(lab.exclude.map((n) => n.toLowerCase()));
    const byName = new Map(repos.map((x) => [x.name.toLowerCase(), x]));
    const labList = [];
    for (const [name, line] of Object.entries(lab.include)) {
      const x = byName.get(name.toLowerCase());
      if (x) labList.push({ name: x.name, line, url: x.html_url });
    }
    for (const x of repos) {
      const k = x.name.toLowerCase();
      if (featured.has(k) || excluded.has(k) || k === USER.toLowerCase() || labList.some((l) => l.name.toLowerCase() === k)) continue;
      if (x.fork && !lab.forksToInclude.includes(x.name)) continue;
      labList.push({ name: x.name, line: x.description || `${x.language ?? 'Small'} project.`, url: x.html_url });
    }
    meta.lab = labList;
  }

  // Tech stack (config + languages detected in featured repos)
  const groups = structuredClone(stack);
  const detected = await attempt('languages', async () => {
    const all = await Promise.all(projects.map((p) => attempt(`languages ${p.repo}`, () => gh(`/repos/${USER}/${p.repo}/languages`))));
    if (all.some((x) => !x)) throw new Error('incomplete language data');
    const totals = {};
    for (const langs of all) {
      const sum = Object.values(langs).reduce((a, b) => a + b, 0) || 1;
      for (const [k, v] of Object.entries(langs)) if (v / sum >= 0.03) totals[k] = true;
    }
    return Object.keys(totals);
  });
  const langs = groups[0].items;
  for (const l of detected ?? []) if (!ignoredLanguages.includes(l) && !langs.some((x) => x.toLowerCase() === l.toLowerCase())) langs.push(l);
  // Without language data, keep the previous stack (it may hold detected languages).
  if (detected || !existsSync(join(OUT, 'stack.svg'))) save('stack.svg', stackSvg(groups));

  // Competitive programming
  const panels = [];
  if (isFilled(cp.leetcode)) { const p = await attempt('leetcode', () => leetcode(cp.leetcode)); if (p) panels.push(p); }
  if (isFilled(cp.codeforces)) { const p = await attempt('codeforces', () => codeforces(cp.codeforces)); if (p) panels.push(p); }
  if (isFilled(cp.codechef)) {
    let p = await attempt('codechef', () => codechef(cp.codechef));
    if (!p && isFilled(cp.codechefRating)) p = { kind: 'codechef', rating: Number(cp.codechefRating), stars: Number(isFilled(cp.codechefStars) ? cp.codechefStars : 0), highest: null };
    if (p) panels.push(p);
  }
  const anyHandle = [cp.leetcode, cp.codeforces, cp.codechef].some(isFilled);
  if (panels.length) save('cp.svg', cpSvg(panels));
  else if (!anyHandle) console.log('[cp] no handles configured; scoreboard hidden');

  const metaOld = read(join(OUT, 'meta.json'));
  const labChanged = JSON.stringify(JSON.parse(metaOld ?? '{}').lab ?? null) !== JSON.stringify(meta.lab ?? null);
  if (changed.length || labChanged || !meta.refreshedAt) meta.refreshedAt = new Date().toISOString();
  save('meta.json', JSON.stringify(meta, null, 2) + '\n');
  writeFileSync(join(ROOT, 'README.md'), renderReadme());
  console.log(changed.length ? `updated: ${changed.join(', ')}` : 'no visual changes');
}

main().catch((e) => { console.warn(`[warn] ${e.stack || e.message}`); }).finally(() => process.exit(0));
