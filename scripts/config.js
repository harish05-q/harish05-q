// Single source of truth for the profile. Edit values here, then run
// `npm run build` (or let the Action do it). README.md is generated.
// Anything still written as [[PLACEHOLDER]] or left empty is hidden.

export const person = {
  displayName: 'Harish Pal',
  fullName: 'Harish Pal',
  username: 'harish05-q',
  eyebrow: 'SYSTEMS · BACKEND · AGENTIC AI · FINTECH',
  role: 'Systems & Backend Engineer · Generative / Agentic AI',
  tagline: 'I build systems that diagnose, decide and recover safely.',
  location: '[[LOCATION]]',
  currently: 'building agentic payment recovery',
};

export const links = [
  { id: 'portfolio', label: 'Portfolio', icon: 'globe', accent: 'green', url: 'https://portfolio-three-jade-97.vercel.app/' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'person', accent: 'pink', url: 'https://www.linkedin.com/in/harish0501/' },
  { id: 'email', label: 'Email', icon: 'mail', accent: 'green', url: 'mailto:harishpal0501@gmail.com' },
  { id: 'resume', label: 'Resume', icon: 'doc', accent: 'pink', url: '[[RESUME_URL]]' },
  { id: 'leetcode', label: 'LeetCode', icon: 'brackets', accent: 'green', url: 'https://leetcode.com/u/harish_60/' },
  { id: 'codechef', label: 'CodeChef', icon: 'braces', accent: 'pink', url: 'https://www.codechef.com/users/harish_pal_67' },
  { id: 'codeforces', label: 'Codeforces', icon: 'bars', accent: 'green', url: '[[CODEFORCES_URL]]' },
];

export const cp = {
  leetcode: 'harish_60',
  codechef: 'harish_pal_67',
  codeforces: '[[CODEFORCES_HANDLE]]',
  // Shown only if the CodeChef scrape fails.
  codechefRating: '[[CODECHEF_RATING]]',
  codechefStars: '[[CODECHEF_STARS]]',
};

// Brand palette. Vivid tokens are for shapes and large text; *Ink tokens are
// darker variants so small text passes WCAG AA (4.5:1) on --bg and --surface.
export const palette = {
  bg: '#FFF6F8',
  surface: '#FFFFFF',
  surfaceAlt: '#F3FBF7',
  border: '#F1D6E0',
  grid: '#F6E4EB',
  ink: '#1B1B1F',
  muted: '#6B6870',
  subtle: '#9A96A0',
  subtleInk: '#706C76',
  green: '#129A6A',
  greenInk: '#0B7A53',
  greenSoft: '#BFEBD7',
  pink: '#E0457B',
  pinkInk: '#C2255C',
  pinkSoft: '#FAD3E1',
};

export const fonts = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
};

export const stages = ['diagnose', 'recommend', 'policy check', 'execute', 'observe', 'recover'];
export const loopLabel = 'learn · repeat';

// Which projects own which lifecycle stage (lifecycle strip).
export const stageOwners = {
  diagnose: ['CodeAutopsy'],
  recommend: ['MarketIQ', 'R.AI'],
  'policy check': ['QGen-AI', 'R.AI'],
  execute: ['Trafiqon', 'R.AI'],
  observe: ['MarketIQ', 'Trafiqon'],
  recover: ['R.AI', 'Trafiqon'],
};

// Featured projects, in grid order. `anim` picks the card animation.
export const projects = [
  {
    slug: 'trafiqon', name: 'Trafiqon', repo: 'Trafiqon', anim: 'routes',
    demo: '[[TRAFIQON_DEMO_URL]]', signature: 'execute',
    description: 'CVRP workbench: OR-Tools, annealing and a QPSO-inspired hybrid judged by one evaluator, with live replanning.',
    chips: ['Python', 'FastAPI', 'OR-Tools', 'PostgreSQL', 'Next.js'],
  },
  {
    slug: 'rai', name: 'R.AI', repo: 'rai', anim: 'lanes',
    demo: '[[RAI_DEMO_URL]]', signature: 'policy check',
    description: 'Payment recovery agent. The LLM proposes, a deterministic policy engine decides, every action is audited.',
    chips: ['FastAPI', 'PostgreSQL', 'Next.js', 'Alembic', 'Docker'],
  },
  {
    slug: 'marketiq', name: 'MarketIQ', repo: 'MarketIQ', anim: 'pipeline',
    demo: 'https://market-iq-pi.vercel.app/', signature: 'observe',
    description: 'Market intelligence from financial news: collect, enrich, connect and explore with RAG.',
    chips: ['FastAPI', 'Kafka', 'Qdrant', 'PostgreSQL', 'Next.js'],
  },
  {
    slug: 'codeautopsy', name: 'CodeAutopsy', repo: 'CodeAutopsy', anim: 'graph',
    demo: 'https://code-autopsy-nine.vercel.app/', signature: 'diagnose',
    description: 'Code health engine: Tree-sitter analysis, dependency graphs, risk hotspots and health grades.',
    chips: ['Tree-sitter', 'FastAPI', 'FAISS', 'React Flow'],
  },
  {
    slug: 'qgen-ai', name: 'QGen-AI', repo: 'QGen-AI', anim: 'gates',
    demo: 'https://qgen-ai.onrender.com/', signature: 'policy check',
    description: 'Natural language to safe SQL: regex gate, read-only connection, forced LIMIT, retry on bad columns.',
    chips: ['Next.js', 'TypeScript', 'SQLite', 'Groq LLM'],
  },
];

export const lab = {
  title: 'Lab notebook',
  line: 'Experiments and smaller builds: LSTM, classifiers, coursework.',
  // Short tags shown as dashed chips on the lab card.
  tags: ['LSTM', 'transformers', 'agents', 'RAG', 'full-stack', 'notebooks'],
  // Always listed (if the repo still exists). One-liners override the API description.
  include: {
    'Stock-price-prediction-LSTM': 'LSTM forecaster for stock closing prices (Keras).',
    'Transformer-Based-Text-Classification': 'Classical ML vs RNN vs fine-tuned transformers on AG News.',
    'PInSight': 'Agentic payment-incident investigation with cited root causes.',
    'WhyThisMoment': 'AI cricket explainer for tactical turning points.',
    'Candidate-Transformer-Pipeline': 'Config-driven pipeline unifying candidate data from many sources.',
    'SkillSwap': 'Semantic skill exchange using NLP for peer learning.',
    'EduSwap': 'Student resource marketplace with credits (Next.js, Supabase).',
    'FinTrack': 'Full-stack personal finance tracker with budgets and charts.',
    'EveGala': 'PHP event booking and reservations app.',
    'SehatLink-telemedicine': 'Telemedicine web app.',
  },
  // Never listed. Featured repos, forks and this profile repo are excluded automatically.
  exclude: [
    'portfolio', 'proj', 'Story', 'Demo', 'localrepo', 'E-commerce-platform',
    'full-stack-project-2', 'full-stack-project-3',
    'skills-introduction-to-github', 'skills-introduction-to-github1',
    'LetsGrowMore-Python-VIP-Task-1', 'LetsGrowMore-Python-VIP-Task-2', 'LetsGrowMore-Python-Task-3',
  ],
  // Forks you want listed anyway.
  forksToInclude: [],
};

// Tech stack chips, grouped. Languages detected in featured repos are appended.
export const stack = [
  { group: 'Languages', items: ['Python', 'C++', 'Java', 'JavaScript', 'TypeScript'] },
  { group: 'Backend & Data', items: ['FastAPI', 'Node.js', 'Express.js', 'REST APIs', 'Auth', 'API Design', 'Concurrency', 'PostgreSQL', 'MySQL', 'MongoDB'] },
  { group: 'Frontend', items: ['React.js', 'Next.js', 'Tailwind CSS', 'React Flow'] },
  { group: 'AI / LLM', items: ['Generative AI', 'LLMs', 'RAG', 'LangChain', 'Agentic Systems', 'Embeddings', 'Semantic Retrieval', 'FAISS', 'Qdrant', 'n8n'] },
  { group: 'Infra & Tooling', items: ['Docker', 'AWS', 'Linux', 'GitHub Actions', 'Git', 'GitHub'] },
  { group: 'Core CS', items: ['DSA', 'OOP', 'Operating Systems', 'DBMS', 'Computer Networks', 'System Design'] },
];
// Languages GitHub reports that aren't worth a chip.
export const ignoredLanguages = ['HTML', 'CSS', 'Dockerfile', 'Mako', 'Shell', 'PowerShell', 'Batchfile', 'Makefile', 'Procfile', 'Jupyter Notebook'];

export const languageColors = {
  Python: '#3572A5', TypeScript: '#3178C6', JavaScript: '#C9A800', Java: '#B07219',
  'C++': '#F34B7D', PHP: '#4F5D95', 'Jupyter Notebook': '#DA5B0B', HTML: '#E34C26',
  CSS: '#563D7C', Go: '#00ADD8', Shell: '#89E051',
};

export const isFilled = (v) => typeof v === 'string' && v.trim() !== '' && !/\[\[.*\]\]/.test(v);
