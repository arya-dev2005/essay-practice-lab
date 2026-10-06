/* ==========================================================================
   Essay Practice Lab — app.js
   Pure vanilla JavaScript (ES6). No external dependencies.
   Modules: Storage, Topics, Router, Home, Prewrite, Session (timer/editor),
   Analyzer, Scoring, Results, Progress, Settings, UI utilities.
   ========================================================================== */
'use strict';

/* ============================ DATA: TOPICS ============================ */

const TOPICS = [
  { id: 't01', title: 'Climate change and individual responsibility', category: 'Environment', difficulty: 'Medium' },
  { id: 't02', title: 'The power of positive thinking', category: 'Personal Development', difficulty: 'Easy' },
  { id: 't03', title: 'Remote work: boon or bane', category: 'Workplace', difficulty: 'Medium' },
  { id: 't04', title: 'Time management for success', category: 'Personal Development', difficulty: 'Easy' },
  { id: 't05', title: 'Online learning or traditional learning', category: 'Education', difficulty: 'Easy' },
  { id: 't06', title: 'Women empowerment in the workplace', category: 'Society', difficulty: 'Medium' },
  { id: 't07', title: 'Role of technology in education', category: 'Technology', difficulty: 'Easy' },
  { id: 't08', title: 'Work-life balance in the corporate world', category: 'Workplace', difficulty: 'Medium' },
  { id: 't09', title: 'Importance of communication skills for engineers', category: 'Education', difficulty: 'Easy' },
  { id: 't10', title: 'Impact of Artificial Intelligence on employment', category: 'Technology', difficulty: 'Challenging' },
  { id: 't11', title: 'Is social media making us more connected or isolated', category: 'Society', difficulty: 'Medium' },
  { id: 't12', title: 'Digital India: Opportunities and Challenges', category: 'Economy', difficulty: 'Medium' },
  { id: 't13', title: 'Cyber security and data privacy in the modern world', category: 'Technology', difficulty: 'Challenging' },
  { id: 't14', title: 'The rise of E-commerce and its impact on small businesses', category: 'Economy', difficulty: 'Medium' },
  { id: 't15', title: 'Importance of cloud computing in today’s business', category: 'Technology', difficulty: 'Medium' },
  { id: 't16', title: 'Importance of mental health awareness', category: 'Society', difficulty: 'Medium' },
  { id: 't17', title: 'Corporate social responsibility (CSR) and sustainability', category: 'Workplace', difficulty: 'Challenging' },
  { id: 't18', title: 'Leadership qualities for success in the corporate world', category: 'Workplace', difficulty: 'Medium' },
  { id: 't19', title: 'The importance of lifelong learning', category: 'Personal Development', difficulty: 'Easy' },
  { id: 't20', title: 'How reading enhances critical thinking', category: 'Education', difficulty: 'Easy' },
];

const CATEGORIES = ['Technology', 'Society', 'Education', 'Workplace', 'Environment', 'Economy', 'Personal Development'];

/* Practice profiles: configurable data, not hard-coded UI text. */
const PROFILES = [
  { id: 'infosys', name: 'Infosys Practice', minutes: 10, minWords: 160, maxWords: 200, recMin: 192, recMax: 200 },
  { id: 'tm-15', name: 'Tech Mahindra Practice', minutes: 15, minWords: 180, maxWords: 200, recMin: null, recMax: null },
  { id: 'tm-25', name: 'Tech Mahindra Extended', minutes: 25, minWords: 270, maxWords: 300, recMin: null, recMax: null },
];

/* Small built-in dictionary of frequent confusions for post-session signals. */
const SPELLING_WATCHLIST = {
  recieve: 'receive', beleive: 'believe', seperate: 'separate', definately: 'definitely',
  occured: 'occurred', untill: 'until', goverment: 'government', enviroment: 'environment',
  succesful: 'successful', neccessary: 'necessary', accomodate: 'accommodate', acheive: 'achieve',
  buisness: 'business', wich: 'which', thier: 'their', adress: 'address', devlopment: 'development',
  tecnology: 'technology', oppertunity: 'opportunity', competetion: 'competition', experiance: 'experience',
};

const TRANSITION_WORDS = ['however', 'moreover', 'furthermore', 'in addition', 'on the other hand', 'for example', 'for instance', 'therefore', 'consequently', 'in contrast', 'firstly', 'secondly', 'meanwhile', 'as a result'];
const CONCLUSION_MARKERS = ['in conclusion', 'to conclude', 'to sum up', 'in summary', 'overall', 'ultimately', 'in closing'];
const INTRO_MARKERS = ['in today', 'nowadays', 'in recent years', 'it is often', 'this essay', 'in this essay', 'plays a', 'has become', 'is one of the', 'an important', 'a topic of'];

/* ============================ UTILS ============================ */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function formatClock(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function formatDate(ts) {
  try {
    return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return '—'; }
}
function uid() {
  return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function countWords(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let toastTimer = null;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ============================ STORAGE ============================ */

const Storage = {
  KEYS: {
    settings: 'essayLab.settings',
    currentSession: 'essayLab.currentSession',
    history: 'essayLab.history',
    topicStats: 'essayLab.topicStats',
    recentTopics: 'essayLab.recentTopics',
  },
  available: (() => {
    try { localStorage.setItem('essayLab.__t', '1'); localStorage.removeItem('essayLab.__t'); return true; }
    catch { return false; }
  })(),
  read(key, fallback) {
    if (!this.available) return fallback;
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch { return fallback; }
  },
  write(key, value) {
    if (!this.available) return;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full — fail silently */ }
  },
  remove(key) {
    if (!this.available) return;
    try { localStorage.removeItem(key); } catch { /* noop */ }
  },
};

const DEFAULT_SETTINGS = {
  theme: 'light', fontSize: 'medium', sound: true, warnings: true,
  guidedDefault: true, duration: 10, minWords: 160, maxWords: 200, recommended: 'range',
};

const Settings = {
  get() {
    const s = Storage.read(Storage.KEYS.settings, {});
    return { ...DEFAULT_SETTINGS, ...(typeof s === 'object' && s ? s : {}) };
  },
  save(patch) {
    const next = { ...this.get(), ...patch };
    Storage.write(Storage.KEYS.settings, next);
    applySettings(next);
    return next;
  },
};

const History = {
  all() {
    const h = Storage.read(Storage.KEYS.history, []);
    return Array.isArray(h) ? h : [];
  },
  add(record) {
    const h = this.all();
    h.unshift(record);
    Storage.write(Storage.KEYS.history, h.slice(0, 200));
  },
  remove(id) {
    Storage.write(Storage.KEYS.history, this.all().filter(r => r.id !== id));
  },
  clear() { Storage.write(Storage.KEYS.history, []); },
};

const TopicStats = {
  all() {
    const s = Storage.read(Storage.KEYS.topicStats, {});
    return typeof s === 'object' && s ? s : {};
  },
  get(topicId) { return this.all()[topicId] || { count: 0, lastAt: null, bestScore: null }; },
  bump(topicId, score) {
    const all = this.all();
    const cur = all[topicId] || { count: 0, lastAt: null, bestScore: null };
    cur.count += 1;
    cur.lastAt = Date.now();
    cur.bestScore = cur.bestScore === null ? score : Math.max(cur.bestScore, score);
    all[topicId] = cur;
    Storage.write(Storage.KEYS.topicStats, all);
  },
  status(topicId) {
    const s = this.get(topicId);
    if (s.count === 0) return 'Not Practiced';
    if (s.bestScore >= 80) return 'Strong';
    if (s.bestScore >= 55) return 'Practiced';
    return 'Needs Improvement';
  },
};

/* ============================ STREAKS / DAILY GOAL ============================ */

const Daily = {
  GOAL: 1,
  dayKey(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  },
  todayCount() {
    const key = this.dayKey(Date.now());
    return History.all().filter(r => this.dayKey(r.timestamp) === key).length;
  },
  streak() {
    const days = new Set(History.all().map(r => this.dayKey(r.timestamp)));
    if (!days.size) return 0;
    let streak = 0;
    const cursor = new Date();
    // allow streak to count from today or yesterday
    if (!days.has(this.dayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);
    while (days.has(this.dayKey(cursor.getTime()))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  },
};

/* ============================ ROUTER ============================ */

const ROUTES = ['home', 'topics', 'prewrite', 'writing', 'results', 'essay', 'progress', 'guide', 'settings'];
let currentRoute = 'home';

function navigate(route) {
  if (!ROUTES.includes(route)) route = 'home';
  // Guard: don't walk away from a live session by accident
  if (currentRoute === 'writing' && route !== 'writing' && Session.active && !Session.finished) {
    if (!confirm('Leave the writing session? Your essay so far is autosaved and you can resume it.')) {
      history.replaceState(null, '', '#/writing');
      return;
    }
    Session.abandonToPause();
  }
  currentRoute = route;
  $$('.screen').forEach(s => { s.hidden = s.dataset.screen !== route; });
  $$('.main-nav a').forEach(a => a.classList.toggle('active', a.dataset.nav === route));
  document.body.classList.toggle('exam-mode', route === 'writing' && Session.active && Session.mode === 'exam');
  if (route === 'home') renderHome();
  if (route === 'topics') renderTopics();
  if (route === 'progress') renderProgress();
  if (route === 'settings') renderSettings();
  $('#main').focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  return h.split('?')[0] || 'home';
}

window.addEventListener('hashchange', () => navigate(parseHash()));

/* ============================ HOME ============================ */

function renderHome() {
  const history = History.all();
  $('#statToday').textContent = Daily.todayCount();
  $('#statSessions').textContent = history.length;
  $('#statStreak').textContent = Daily.streak();

  const settings = Settings.get();
  const inRange = history.filter(r => r.wordCount >= r.minWords && r.wordCount <= r.maxWords);
  $('#statBestWords').textContent = inRange.length ? Math.max(...inRange.map(r => r.wordCount)) : '—';

  const last = history[0];
  const cont = $('#continueCard');
  if (last) {
    cont.hidden = false;
    $('#homeEmpty').hidden = true;
    $('#continueTopic').textContent = last.topicTitle;
    $('#continueScore').textContent = `${last.score} / 100`;
    $('#continueDate').textContent = formatDate(last.timestamp);
    $('#continueDuration').textContent = formatClock(last.timeUsed);
  } else {
    cont.hidden = true;
    $('#homeEmpty').hidden = false;
  }
  renderDailyChip();
}

function renderDailyChip() {
  const n = Daily.todayCount();
  const chip = $('#dailyChip');
  $('#dailyChipText').textContent = `${n} / ${Daily.GOAL} today`;
  chip.classList.toggle('done', n >= Daily.GOAL);
}

/* ============================ TOPICS ============================ */

function renderTopics() {
  const catSel = $('#filterCategory');
  if (catSel.options.length <= 1) {
    CATEGORIES.forEach(c => {
      const o = document.createElement('option');
      o.value = c; o.textContent = c;
      catSel.appendChild(o);
    });
  }
  const cat = catSel.value, diff = $('#filterDifficulty').value, status = $('#filterStatus').value;
  const grid = $('#topicGrid');
  grid.innerHTML = '';

  const visible = TOPICS.filter(t => {
    if (cat !== 'all' && t.category !== cat) return false;
    if (diff !== 'all' && t.difficulty !== diff) return false;
    if (status !== 'all' && TopicStats.status(t.id) !== status) return false;
    return true;
  });

  $('#topicEmpty').hidden = visible.length > 0;

  visible.forEach(t => {
    const stats = TopicStats.get(t.id);
    const st = TopicStats.status(t.id);
    const card = document.createElement('article');
    card.className = 'topic-card';
    card.setAttribute('role', 'listitem');
    const statusClass = st === 'Strong' ? 'status-strong' : st === 'Needs Improvement' ? 'status-needs' : '';
    card.innerHTML = `
      <div class="topic-tags">
        <span class="tag">${escapeHtml(t.category)}</span>
        <span class="tag slate">${escapeHtml(t.difficulty)}</span>
        <span class="tag slate ${statusClass}">${escapeHtml(st)}</span>
      </div>
      <h3>${escapeHtml(t.title)}</h3>
      <div class="topic-meta">
        <span>Practiced ${stats.count}×</span>
        <span>${stats.lastAt ? 'Last: ' + formatDate(stats.lastAt) : 'Never practiced'}</span>
      </div>
      <button class="btn btn-primary btn-sm" type="button">Practice this topic</button>
    `;
    card.querySelector('button').addEventListener('click', () => openPrewrite(t.id));
    grid.appendChild(card);
  });
}

['filterCategory', 'filterDifficulty', 'filterStatus'].forEach(id =>
  document.addEventListener('change', e => { if (e.target.id === id && currentRoute === 'topics') renderTopics(); }));

/* ---- Surprise me: prefer least-practiced, avoid recent selections ---- */
let surpriseTopicId = null;

function pickSurpriseTopic() {
  const recent = Storage.read(Storage.KEYS.recentTopics, []);
  const pool = TOPICS
    .map(t => ({ t, count: TopicStats.get(t.id).count, recent: Array.isArray(recent) ? recent.indexOf(t.id) : -1 }))
    .filter(x => x.recent === -1);
  const candidates = pool.length ? pool : TOPICS.map(t => ({ t, count: TopicStats.get(t.id).count }));
  const minCount = Math.min(...candidates.map(x => x.count));
  const least = candidates.filter(x => x.count === minCount);
  const pick = least[Math.floor(Math.random() * least.length)].t;

  const nextRecent = [pick.id, ...(Array.isArray(recent) ? recent : [])].slice(0, 6);
  Storage.write(Storage.KEYS.recentTopics, nextRecent);
  return pick;
}

function openSurprise() {
  const t = pickSurpriseTopic();
  surpriseTopicId = t.id;
  $('#surpriseTitle').textContent = t.title;
  showModal('#surpriseModal', '#surpriseStart');
}

$('#surpriseBtn').addEventListener('click', openSurprise);
$('#surpriseAgain').addEventListener('click', () => {
  const t = pickSurpriseTopic();
  surpriseTopicId = t.id;
  const title = $('#surpriseTitle');
  title.style.opacity = 0;
  setTimeout(() => { title.textContent = t.title; title.style.opacity = 1; }, 140);
});
$('#surpriseClose').addEventListener('click', () => hideModal('#surpriseModal'));
$('#surpriseStart').addEventListener('click', () => {
  hideModal('#surpriseModal');
  if (surpriseTopicId) openPrewrite(surpriseTopicId);
});

/* ============================ MODAL HELPERS ============================ */

let lastFocused = null;
function showModal(sel, focusSel) {
  lastFocused = document.activeElement;
  $(sel).hidden = false;
  if (focusSel) $(focusSel).focus();
}
function hideModal(sel) {
  $(sel).hidden = true;
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}

/* ============================ PREWRITE ============================ */

const Prewrite = {
  topicId: null,
  profileId: 'infosys',
  custom: false,
};

function effectiveProfile() {
  if (Prewrite.custom) {
    const s = Settings.get();
    return {
      id: 'custom', name: 'Custom', minutes: clampInt(s.duration, 3, 60, 10),
      minWords: clampInt(s.minWords, 50, 1000, 160), maxWords: clampInt(s.maxWords, 60, 1200, 200),
      recMin: s.recommended === 'strict' ? Math.max(60, clampInt(s.maxWords, 60, 1200, 200) - 8) : null,
      recMax: s.recommended === 'strict' ? clampInt(s.maxWords, 60, 1200, 200) : null,
    };
  }
  return PROFILES.find(p => p.id === Prewrite.profileId) || PROFILES[0];
}

function clampInt(v, min, max, fallback) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function openPrewrite(topicId) {
  Prewrite.topicId = topicId;
  Prewrite.profileId = 'infosys';
  Prewrite.custom = false;
  renderPrewrite();
  location.hash = '#/prewrite';
}

function renderPrewrite() {
  const topic = TOPICS.find(t => t.id === Prewrite.topicId) || TOPICS[0];
  const p = effectiveProfile();
  $('#preCategory').textContent = `${topic.category} · ${topic.difficulty}`;
  $('#preTopicTitle').textContent = topic.title;
  $('#preTime').textContent = `${p.minutes} minutes`;
  $('#preTarget').textContent = `${p.minWords}–${p.maxWords} words`;
  const recWrap = $('#preRecommendedWrap');
  if (p.recMin && p.recMax) {
    recWrap.hidden = false;
    $('#preRecommended').textContent = `${p.recMin}–${p.recMax} words`;
  } else recWrap.hidden = true;

  // mode default from settings
  const guided = Settings.get().guidedDefault;
  $$('input[name="mode"]').forEach(r => { r.checked = (r.value === (guided ? 'guided' : 'exam')); });

  // profile pills
  const wrap = $('#profileOptions');
  wrap.innerHTML = '';
  [...PROFILES, { id: 'custom', name: 'Custom (from Settings)' }].forEach(prof => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'profile-pill';
    const active = prof.id === 'custom' ? Prewrite.custom : (!Prewrite.custom && Prewrite.profileId === prof.id);
    b.setAttribute('aria-pressed', String(active));
    b.textContent = prof.id === 'custom' ? prof.name : `${prof.name} · ${prof.minutes} min / ${prof.minWords === prof.maxWords ? prof.maxWords : prof.minWords + '–' + prof.maxWords} words`;
    b.addEventListener('click', () => {
      if (prof.id === 'custom') Prewrite.custom = true;
      else { Prewrite.custom = false; Prewrite.profileId = prof.id; }
      renderPrewrite();
    });
    wrap.appendChild(b);
  });

  // reset checklist
  $$('#preChecklist input').forEach(cb => { cb.checked = false; });
  $('#startWritingBtn').disabled = true;
}

$('#preChecklist').addEventListener('change', () => {
  const all = $$('#preChecklist input').every(cb => cb.checked);
  $('#startWritingBtn').disabled = !all;
});
$('#prewriteBack').addEventListener('click', () => { location.hash = '#/topics'; });
$('#startWritingBtn').addEventListener('click', () => {
  const mode = ($('input[name="mode"]:checked') || {}).value || 'guided';
  Session.start(Prewrite.topicId, effectiveProfile(), mode);
});

/* ============================ WRITING SESSION ============================ */

const Session = {
  active: false,
  finished: false,
  paused: false,
  topicId: null,
  profile: null,
  mode: 'guided',
  endAt: 0,          // timestamp (ms) when time runs out
  remainingMs: 0,    // used when paused
  totalMs: 0,
  startedAt: 0,
  rafId: null,
  autosaveId: null,
  lastPhaseIdx: -1,
  timeUp: false,

  PHASES: [
    { at: 0.0, text: 'Understand the topic.' },
    { at: 0.1, text: 'Plan two main points.' },
    { at: 0.3, text: 'Develop your argument.' },
    { at: 0.9, text: 'Review spelling and grammar.' },
  ],

  start(topicId, profile, mode) {
    const topic = TOPICS.find(t => t.id === topicId);
    if (!topic) return;
    this.active = true;
    this.finished = false;
    this.paused = false;
    this.timeUp = false;
    this.topicId = topicId;
    this.profile = profile;
    this.mode = mode;
    this.totalMs = profile.minutes * 60 * 1000;
    this.remainingMs = this.totalMs;
    this.startedAt = Date.now();
    this.endAt = this.startedAt + this.totalMs;
    this.lastPhaseIdx = -1;

    $('#writeTopic').textContent = topic.title;
    $('#targetLine').textContent = `${profile.minWords}–${profile.maxWords} words`;
    $('#editor').value = '';
    $('#editor').disabled = false;
    this.updateWordUI();
    this.renderTimer(this.totalMs);

    location.hash = '#/writing';
    document.body.classList.toggle('exam-mode', mode === 'exam');
    this.tickLoop();
    this.startAutosave();
    setTimeout(() => $('#editor').focus(), 60);
    if (mode === 'guided') this.showPhase('Understand the topic.');
    this.persist();
  },

  /* Timestamp-based ticking — no drift. */
  tickLoop() {
    cancelAnimationFrame(this.rafId);
    const step = () => {
      if (!this.active || this.finished) return;
      if (!this.paused) {
        const remaining = this.endAt - Date.now();
        this.remainingMs = remaining;
        this.renderTimer(remaining);
        this.maybePhase();
        if (remaining <= 0) { this.onTimeUp(); return; }
      }
      this.rafId = requestAnimationFrame(step);
    };
    this.rafId = requestAnimationFrame(step);
  },

  renderTimer(ms) {
    const el = $('#timerDisplay');
    const secs = Math.max(0, Math.ceil(ms / 1000));
    const shown = el.textContent;
    const next = formatClock(secs);
    if (shown !== next) {
      el.textContent = next;
      el.setAttribute('aria-label', `${Math.floor(secs / 60)} minutes ${secs % 60} seconds remaining`);
    }
    el.classList.remove('warn', 'urgent', 'final');
    if (secs <= 10) el.classList.add('final');
    else if (secs <= 60) el.classList.add('urgent');
    else if (secs <= 180) el.classList.add('warn');

    if (Settings.get().warnings && Settings.get().sound && (secs === 60 || secs === 10)) this.beep();
  },

  beep() {
    try {
      const ctx = Session._audio || (Session._audio = new (window.AudioContext || window.webkitAudioContext)());
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch { /* audio unavailable — fine */ }
  },

  maybePhase() {
    if (this.mode !== 'guided') return;
    const elapsedRatio = 1 - this.remainingMs / this.totalMs;
    let idx = -1;
    this.PHASES.forEach((p, i) => { if (elapsedRatio >= p.at) idx = i; });
    if (idx !== this.lastPhaseIdx && idx >= 0) {
      this.lastPhaseIdx = idx;
      this.showPhase(this.PHASES[idx].text);
    }
  },

  showPhase(text) {
    const el = $('#phasePrompt');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(this._phaseT);
    this._phaseT = setTimeout(() => el.classList.remove('show'), 6000);
  },

  updateWordUI() {
    const text = $('#editor').value;
    const n = countWords(text);
    const wc = $('#wordCount');
    const { minWords, maxWords } = this.profile || { minWords: 160, maxWords: 200 };
    let state = 'below', label = `${n} words · Below target`;
    if (n >= minWords && n <= maxWords) { state = 'on'; label = `${n} words · On target`; }
    else if (n > maxWords) { state = 'over'; label = `${n} words · Over target`; }
    wc.textContent = label;
    wc.className = `word-count ${state}`;
    const pct = Math.min(100, (n / maxWords) * 100);
    const fill = $('#progressFill');
    fill.style.width = pct + '%';
    fill.className = 'progress-fill' + (state === 'on' ? ' on' : state === 'over' ? ' over' : '');
  },

  pause() {
    if (!this.active || this.finished || this.paused) return;
    this.paused = true;
    this.remainingMs = this.endAt - Date.now();
    showModal('#pauseModal', '#resumeBtn');
    this.persist();
  },
  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.endAt = Date.now() + this.remainingMs;
    hideModal('#pauseModal');
    $('#editor').focus();
    this.persist();
  },

  onTimeUp() {
    this.timeUp = true;
    this.remainingMs = 0;
    this.renderTimer(0);
    this.finish(true);
    showModal('#timeUpModal', '#timeUpReview');
  },

  finish(byTimer = false) {
    if (this.finished || !this.active) return;
    this.finished = true;
    cancelAnimationFrame(this.rafId);
    clearInterval(this.autosaveId);
    $('#editor').disabled = true;

    const text = $('#editor').value;
    const timeUsedMs = byTimer ? this.totalMs : Math.min(this.totalMs, Date.now() - this.startedAt - this.pausedAccumulated());
    const record = this.buildRecord(text, timeUsedMs, byTimer);
    this.lastRecord = record;
    History.add(record);
    TopicStats.bump(this.topicId, record.score);
    Storage.remove(Storage.KEYS.currentSession);
    this.active = false;
    document.body.classList.remove('exam-mode');
    renderDailyChip();
    renderResults(record);
    location.hash = '#/results';
  },

  _pausedMs: 0,
  _pauseStart: 0,
  pausedAccumulated() { return this._pausedMs; },

  buildRecord(text, timeUsedMs, timedOut) {
    const analysis = Analyzer.analyze(text);
    const timeUsedSec = Math.round(timeUsedMs / 1000);
    const minutes = Math.max(timeUsedSec / 60, 0.25);
    const wpm = Math.round(analysis.words / minutes);
    const scoring = Scoring.score(analysis, {
      minWords: this.profile.minWords, maxWords: this.profile.maxWords,
      totalMs: this.totalMs, timeUsedMs, timedOut,
    });
    return {
      id: uid(),
      timestamp: Date.now(),
      topicId: this.topicId,
      topicTitle: (TOPICS.find(t => t.id === this.topicId) || {}).title || 'Untitled topic',
      mode: this.mode,
      profile: this.profile.name,
      durationSec: Math.round(this.totalMs / 1000),
      timeUsed: timeUsedSec,
      wordCount: analysis.words,
      paragraphCount: analysis.paragraphs,
      sentenceCount: analysis.sentences.length,
      wpm,
      minWords: this.profile.minWords,
      maxWords: this.profile.maxWords,
      timedOut,
      score: scoring.total,
      grade: scoring.grade,
      breakdown: scoring.breakdown,
      signals: analysis.signals,
      wentWell: scoring.wentWell,
      improve: scoring.improve,
      structure: analysis.structure,
      text,
    };
  },

  /* Keep the session (autosaved) but leave the writing screen. */
  abandonToPause() {
    this.paused = true;
    this.remainingMs = Math.max(0, this.endAt - Date.now());
    this.persist();
    document.body.classList.remove('exam-mode');
  },

  startAutosave() {
    clearInterval(this.autosaveId);
    this.autosaveId = setInterval(() => this.persist(), 3000);
  },

  persist() {
    if (!this.active) return;
    Storage.write(Storage.KEYS.currentSession, {
      topicId: this.topicId,
      profile: this.profile,
      mode: this.mode,
      text: $('#editor').value,
      remainingMs: this.paused ? this.remainingMs : Math.max(0, this.endAt - Date.now()),
      totalMs: this.totalMs,
      savedAt: Date.now(),
      finished: this.finished,
    });
  },

  /* Recovery after accidental refresh. */
  tryRecover() {
    const s = Storage.read(Storage.KEYS.currentSession, null);
    if (!s || s.finished || !s.topicId || typeof s.remainingMs !== 'number') return;
    const age = Date.now() - (s.savedAt || 0);
    if (age > 24 * 3600 * 1000) { Storage.remove(Storage.KEYS.currentSession); return; }
    const topic = TOPICS.find(t => t.id === s.topicId);
    if (!topic) { Storage.remove(Storage.KEYS.currentSession); return; }

    $('#resumeDetail').textContent = `“${topic.title}” — ${formatClock(s.remainingMs / 1000)} remaining, ${countWords(s.text || '')} words written.`;
    showModal('#resumeModal', '#resumeYes');
    $('#resumeYes').onclick = () => {
      hideModal('#resumeModal');
      this.active = true;
      this.finished = false;
      this.paused = false;
      this.timeUp = false;
      this.topicId = s.topicId;
      this.profile = s.profile;
      this.mode = s.mode;
      this.totalMs = s.totalMs;
      this.remainingMs = s.remainingMs;
      this.startedAt = Date.now() - (s.totalMs - s.remainingMs);
      this.endAt = Date.now() + s.remainingMs;
      this._pausedMs = 0;
      this.lastPhaseIdx = -1;
      $('#writeTopic').textContent = topic.title;
      $('#targetLine').textContent = `${s.profile.minWords}–${s.profile.maxWords} words`;
      $('#editor').value = s.text || '';
      $('#editor').disabled = false;
      this.updateWordUI();
      location.hash = '#/writing';
      document.body.classList.toggle('exam-mode', s.mode === 'exam');
      this.tickLoop();
      this.startAutosave();
      setTimeout(() => $('#editor').focus(), 60);
    };
    $('#resumeNo').onclick = () => {
      Storage.remove(Storage.KEYS.currentSession);
      hideModal('#resumeModal');
    };
  },
};

$('#editor').addEventListener('input', () => Session.updateWordUI());
$('#pauseBtn').addEventListener('click', () => Session.pause());
$('#resumeBtn').addEventListener('click', () => Session.resume());
$('#quitBtn').addEventListener('click', () => {
  hideModal('#pauseModal');
  if (countWords($('#editor').value) > 0) Session.finish(false);
  else {
    Session.finished = true; Session.active = false;
    cancelAnimationFrame(Session.rafId); clearInterval(Session.autosaveId);
    Storage.remove(Storage.KEYS.currentSession);
    document.body.classList.remove('exam-mode');
    location.hash = '#/home';
  }
});
$('#finishBtn').addEventListener('click', () => {
  if (countWords($('#editor').value) === 0) {
    if (!confirm('Your essay is empty. Finish anyway?')) return;
  }
  Session.finish(false);
});
$('#timeUpReview').addEventListener('click', () => hideModal('#timeUpModal'));

// track paused duration honestly
(function watchPause() {
  const origPause = Session.pause.bind(Session);
  Session.pause = () => { Session._pauseStart = Date.now(); origPause(); };
  const origResume = Session.resume.bind(Session);
  Session.resume = () => { Session._pausedMs += Date.now() - Session._pauseStart; origResume(); };
})();

// Warn before leaving mid-session
window.addEventListener('beforeunload', e => {
  if (Session.active && !Session.finished) { Session.persist(); e.preventDefault(); e.returnValue = ''; }
});

/* ============================ ANALYZER (deterministic, no AI) ============================ */

const Analyzer = {
  analyze(text) {
    const clean = (text || '').replace(/\r\n/g, '\n');
    const words = countWords(clean);
    const paragraphs = clean.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const sentences = this.splitSentences(clean);
    const sentenceLengths = sentences.map(s => countWords(s));
    const avgSentenceLen = sentences.length ? words / sentences.length : 0;
    const longSentences = sentenceLengths.filter(l => l > 30).length;
    const lower = ' ' + clean.toLowerCase() + ' ';

    // repeated words (content-ish words appearing disproportionately)
    const freq = {};
    (clean.toLowerCase().match(/[a-z']+/g) || []).forEach(w => {
      if (w.length >= 4) freq[w] = (freq[w] || 0) + 1;
    });
    const repeated = Object.entries(freq).filter(([w, c]) => c >= 5 && words / c < 30).map(([w]) => w);

    const repeatedPunct = /([!?.,])\1{1,}/.test(clean.replace(/\.\.\./g, ''));
    const lowerStarts = sentences.filter(s => /^[a-z]/.test(s.trim())).length;
    const spellingHits = Object.keys(SPELLING_WATCHLIST).filter(w =>
      new RegExp(`\\b${w}\\b`, 'i').test(clean)).map(w => `${w} → ${SPELLING_WATCHLIST[w]}`);
    const transitions = TRANSITION_WORDS.filter(t => lower.includes(' ' + t));
    const hasConclusion = CONCLUSION_MARKERS.some(m => lower.includes(m));
    const hasIntro = INTRO_MARKERS.some(m => lower.includes(m)) || (paragraphs.length > 0 && countWords(paragraphs[0]) >= 10);
    const singleSentenceParas = paragraphs.filter(p => this.splitSentences(p).length === 1).length;

    const signals = [
      { name: 'Word count', value: String(words), ok: words > 0 },
      { name: 'Sentences', value: String(sentences.length), ok: sentences.length > 0 },
      { name: 'Avg. sentence length', value: sentences.length ? avgSentenceLen.toFixed(1) + ' words' : '—', ok: avgSentenceLen >= 8 && avgSentenceLen <= 24, warn: avgSentenceLen > 24 },
      { name: 'Paragraphs', value: String(paragraphs.length), ok: paragraphs.length >= 2, warn: paragraphs.length < 2 },
      { name: 'Very long sentences (>30 words)', value: String(longSentences), ok: longSentences === 0, warn: longSentences > 1 },
      { name: 'Over-repeated words', value: repeated.length ? repeated.slice(0, 3).join(', ') : 'None', ok: repeated.length === 0, warn: repeated.length > 0 },
      { name: 'Repeated punctuation', value: repeatedPunct ? 'Detected' : 'None', ok: !repeatedPunct, warn: repeatedPunct },
      { name: 'Sentences starting lowercase', value: String(lowerStarts), ok: lowerStarts === 0, warn: lowerStarts > 1 },
      { name: 'Possible spelling slips', value: spellingHits.length ? spellingHits.slice(0, 3).join('; ') : 'None spotted', ok: spellingHits.length === 0, warn: spellingHits.length > 0 },
      { name: 'Transition language', value: transitions.length ? transitions.slice(0, 3).join(', ') : 'None detected', ok: transitions.length >= 2 },
      { name: 'Conclusion indicator', value: hasConclusion ? 'Possible conclusion detected' : 'None detected', ok: hasConclusion },
      { name: 'Introductory framing', value: hasIntro ? 'Possible introduction detected' : 'None detected', ok: hasIntro },
      { name: 'Single-sentence paragraphs', value: String(singleSentenceParas), ok: singleSentenceParas <= 1, warn: singleSentenceParas > 2 },
    ];

    const structure = [
      { label: 'Introduction detected', ok: hasIntro, warn: 'Very short or missing introduction' },
      { label: 'Multiple body ideas detected', ok: paragraphs.length >= 3 || (paragraphs.length >= 2 && transitions.length >= 1), warn: 'Body may need clearer separation of ideas' },
      { label: 'Example / explanation detected', ok: transitions.some(t => ['for example', 'for instance'].includes(t)) || sentences.length >= 5, warn: 'Few supporting examples or explanations found' },
      { label: 'Conclusion detected', ok: hasConclusion, warn: 'No obvious conclusion — try signalling with “In conclusion”' },
    ];

    return { words, paragraphs: paragraphs.length, sentences, sentenceLengths, avgSentenceLen, longSentences, repeated, repeatedPunct, lowerStarts, spellingHits, transitions, hasConclusion, hasIntro, singleSentenceParas, signals, structure };
  },

  splitSentences(text) {
    return text
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => /[a-zA-Z]/.test(s));
  },
};

/* ============================ SCORING ============================ */

const Scoring = {
  score(a, ctx) {
    const { minWords, maxWords, totalMs, timeUsedMs, timedOut } = ctx;

    // Word count — 25
    let wordPts;
    if (a.words >= minWords && a.words <= maxWords) wordPts = 25;
    else if (a.words >= minWords * 0.85 && a.words <= maxWords * 1.15) wordPts = 18;
    else if (a.words >= minWords * 0.6) wordPts = 10;
    else wordPts = 4;

    // Structure — 25
    let structPts = 0;
    if (a.paragraphs >= 3) structPts += 9; else if (a.paragraphs === 2) structPts += 5;
    if (a.hasIntro) structPts += 5;
    if (a.hasConclusion) structPts += 6;
    if (a.transitions.length >= 2) structPts += 5; else if (a.transitions.length === 1) structPts += 2;

    // Time management — 20
    const ratio = timeUsedMs / totalMs;
    let timePts;
    if (a.words >= minWords && ratio >= 0.55) timePts = 20;
    else if (ratio >= 0.7) timePts = 16;
    else if (ratio >= 0.4) timePts = 12;
    else timePts = 6;

    // Sentence quality signals — 15
    let sentPts = 15;
    if (a.longSentences > 1) sentPts -= 4;
    if (a.repeatedPunct) sentPts -= 3;
    if (a.lowerStarts > 1) sentPts -= 3;
    if (a.spellingHits.length > 0) sentPts -= Math.min(4, a.spellingHits.length * 2);
    if (a.repeated.length > 1) sentPts -= 2;
    sentPts = Math.max(0, sentPts);

    // Revision behaviour — 15
    let revPts = 0;
    if (!timedOut) revPts += 8;                     // finished before the clock
    if (ratio <= 0.97 && !timedOut) revPts += 4;    // left room to breathe
    if (a.lowerStarts === 0 && !a.repeatedPunct) revPts += 3; // surface is tidy
    if (timedOut && a.words >= minWords) revPts += 3;

    const breakdown = [
      { name: 'Word count', pts: wordPts, max: 25 },
      { name: 'Structure', pts: structPts, max: 25 },
      { name: 'Time management', pts: timePts, max: 20 },
      { name: 'Sentence quality signals', pts: sentPts, max: 15 },
      { name: 'Revision behaviour', pts: revPts, max: 15 },
    ];
    const total = breakdown.reduce((s, b) => s + b.pts, 0);

    const inRange = a.words >= minWords && a.words <= maxWords;
    const strongStructure = structPts >= 18;
    let grade, gradeLabel;
    if (inRange && !timedOut && strongStructure) { grade = 'excellent'; gradeLabel = 'Excellent'; }
    else if (inRange && total >= 55) { grade = 'good'; gradeLabel = 'Good'; }
    else { grade = 'needs'; gradeLabel = 'Needs practice'; }

    const wentWell = [];
    const improve = [];
    if (inRange) wentWell.push('Stayed within the target word range.');
    else if (a.words < minWords) improve.push(`Essay is below the target — aim for at least ${minWords} words.`);
    else improve.push(`Essay is above the target — practise closing inside ${maxWords} words.`);
    if (a.paragraphs >= 3) wentWell.push('Used multiple paragraphs with visible separation.');
    else improve.push('Separate the essay into clear paragraphs (introduction, body, conclusion).');
    if (!timedOut) wentWell.push('Completed within the time limit.');
    else improve.push('Time ran out — plan faster and keep the final minute for revision.');
    if (a.transitions.length >= 2) wentWell.push('Used transition language to connect ideas.');
    else improve.push('Add linking phrases (“however”, “for example”, “as a result”) to connect ideas.');
    if (a.hasConclusion) wentWell.push('Conclusion signalled clearly.');
    else improve.push('Conclusion may be missing — signal it with “In conclusion” or similar.');
    if (a.longSentences > 1) improve.push(`${a.longSentences} very long sentences — split them for clarity.`);
    if (a.lowerStarts > 1) improve.push('Several sentences start with a lowercase letter — check capitalization.');
    if (a.spellingHits.length) improve.push('Possible spelling slips: ' + a.spellingHits.slice(0, 3).join('; ') + '.');
    if (a.avgSentenceLen > 24) improve.push('Average sentence length is high — vary with some shorter sentences.');
    if (!wentWell.length) wentWell.push('You completed a timed session — that consistency is the foundation.');
    if (!improve.length) improve.push('Keep practising with new topics to stay sharp.');

    return { total, grade, gradeLabel, breakdown, wentWell, improve };
  },
};

/* ============================ RESULTS ============================ */

function renderResults(r) {
  $('#resultsTopic').textContent = r.topicTitle;
  const grade = $('#resultGrade');
  grade.textContent = r.grade === 'excellent' ? 'Excellent' : r.grade === 'good' ? 'Good' : 'Needs practice';
  grade.className = 'result-grade' + (r.grade === 'good' ? ' good' : r.grade === 'needs' ? ' needs' : '');

  $('#resTime').textContent = formatClock(r.timeUsed) + (r.timedOut ? ' (time up)' : '');
  $('#resWords').textContent = `${r.wordCount} / ${r.minWords}–${r.maxWords}`;
  $('#resWpm').textContent = `≈ ${r.wpm} WPM`;
  $('#resScore').textContent = `${r.score} / 100`;

  const sc = $('#scorecard');
  sc.innerHTML = '';
  r.breakdown.forEach(b => {
    const row = document.createElement('div');
    row.className = 'score-row';
    row.innerHTML = `
      <span class="score-name">${escapeHtml(b.name)}</span>
      <span class="score-bar"><i style="width:${(b.pts / b.max) * 100}%"></i></span>
      <span class="score-pts">${b.pts} / ${b.max}</span>`;
    sc.appendChild(row);
  });

  const fill = (sel, items) => {
    const ul = $(sel); ul.innerHTML = '';
    items.forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
  };
  fill('#wentWellList', r.wentWell);
  fill('#improveList', r.improve);

  const struct = $('#structureCheck');
  struct.innerHTML = '';
  r.structure.forEach(s => {
    const li = document.createElement('li');
    li.innerHTML = s.ok
      ? `<span class="mark-ok" aria-hidden="true">✓</span> ${escapeHtml(s.label)}`
      : `<span class="mark-warn" aria-hidden="true">!</span> ${escapeHtml(s.warn)}`;
    struct.appendChild(li);
  });

  const grid = $('#signalGrid');
  grid.innerHTML = '';
  r.signals.forEach(s => {
    const d = document.createElement('div');
    d.className = 'signal' + (s.warn ? ' warn' : s.ok ? ' ok' : '');
    d.innerHTML = `<b>${escapeHtml(s.name)}</b><span class="signal-val">${escapeHtml(s.value)}</span>`;
    grid.appendChild(d);
  });
}

$('#viewEssayBtn').addEventListener('click', () => {
  const r = Session.lastRecord || History.all()[0];
  if (!r) return;
  $('#essayTitle').textContent = r.topicTitle;
  $('#essayMeta').textContent = `${formatDate(r.timestamp)} · ${r.mode === 'exam' ? 'Exam Simulation' : 'Guided Practice'} · ${r.profile}`;
  $('#essayText').textContent = r.text || '(empty essay)';
  $('#esWords').textContent = r.wordCount;
  $('#esSentences').textContent = r.sentenceCount;
  $('#esParagraphs').textContent = r.paragraphCount;
  $('#esWpm').textContent = `≈ ${r.wpm}`;
  $('#esTime').textContent = formatClock(r.timeUsed);
  location.hash = '#/essay';
});
$('#essayBack').addEventListener('click', () => { location.hash = '#/results'; });

/* ============================ PROGRESS ============================ */

function renderProgress() {
  const history = History.all();
  $('#dailyGoalText').textContent = `${Math.min(Daily.todayCount(), Daily.GOAL)} / ${Daily.GOAL} essays completed today`;
  renderDailyChip();

  const stats = $('#progressStats');
  const empty = $('#progressEmpty');
  const content = $('#progressContent');

  if (!history.length) {
    stats.innerHTML = '';
    empty.hidden = false;
    content.hidden = true;
    return;
  }
  empty.hidden = true;
  content.hidden = false;

  const avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  const cards = [
    ['Total sessions', history.length],
    ['Average words', avg(history.map(r => r.wordCount))],
    ['Average WPM', avg(history.map(r => r.wpm))],
    ['Best WPM', Math.max(...history.map(r => r.wpm))],
    ['Best score', Math.max(...history.map(r => r.score)) + ' / 100'],
    ['Current streak', Daily.streak() + (Daily.streak() === 1 ? ' day' : ' days')],
  ];
  stats.innerHTML = '';
  cards.forEach(([label, value]) => {
    const d = document.createElement('div');
    d.className = 'stat-card';
    d.innerHTML = `<span class="stat-label">${escapeHtml(label)}</span><span class="stat-value">${escapeHtml(String(value))}</span>`;
    stats.appendChild(d);
  });

  drawBars('#chartWords', history.slice(0, 14).reverse().map(r => ({ v: r.wordCount, tip: `${r.wordCount} words` })), history.some(r => r.wordCount >= r.minWords && r.wordCount <= r.maxWords));
  drawBars('#chartWpm', history.slice(0, 14).reverse().map(r => ({ v: r.wpm, tip: `${r.wpm} WPM` })), false);
  drawBars('#chartScore', history.slice(0, 14).reverse().map(r => ({ v: r.score, tip: `${r.score}/100 · ${r.topicTitle.slice(0, 24)}` })), false);

  // Strongest / weakest from breakdown averages
  const dimTotals = {};
  const dimCounts = {};
  history.forEach(r => (r.breakdown || []).forEach(b => {
    dimTotals[b.name] = (dimTotals[b.name] || 0) + b.pts / b.max;
    dimCounts[b.name] = (dimCounts[b.name] || 0) + 1;
  }));
  const dims = Object.entries(dimTotals).map(([name, sum]) => ({ name, ratio: sum / dimCounts[name] })).sort((a, b) => b.ratio - a.ratio);
  const strong = $('#strongList'); strong.innerHTML = '';
  dims.slice(0, 3).forEach(d => {
    const li = document.createElement('li');
    li.textContent = `${d.name} — averaging ${Math.round(d.ratio * 100)}% of available points.`;
    strong.appendChild(li);
  });
  const weak = $('#weakList'); weak.innerHTML = '';
  dims.slice(-3).reverse().forEach(d => {
    const li = document.createElement('li');
    li.textContent = d.ratio < 0.99
      ? `${d.name} — averaging ${Math.round(d.ratio * 100)}% of available points.`
      : `${d.name} — currently strong; keep it consistent.`;
    weak.appendChild(li);
  });

  renderHistoryList();
}

function drawBars(sel, data, highlightMax) {
  const el = $(sel);
  el.innerHTML = '';
  if (!data.length) return;
  const max = Math.max(...data.map(d => d.v), 1);
  const maxVal = Math.max(...data.map(d => d.v));
  data.forEach(d => {
    const b = document.createElement('div');
    b.className = 'bar' + (highlightMax && d.v === maxVal ? ' accent' : '');
    b.style.height = Math.max(6, (d.v / max) * 100) + '%';
    b.dataset.tip = d.tip;
    el.appendChild(b);
  });
}

function renderHistoryList() {
  const list = $('#historyList');
  list.innerHTML = '';
  History.all().forEach(r => {
    const row = document.createElement('div');
    row.className = 'history-row';
    row.innerHTML = `
      <span class="h-topic">${escapeHtml(r.topicTitle)}</span>
      <span class="h-meta">${formatDate(r.timestamp)} · ${formatClock(r.timeUsed)} · ${r.wordCount} words · ≈${r.wpm} WPM</span>
      <span class="h-grade ${r.grade}">${r.grade === 'needs' ? 'Needs practice' : r.grade}</span>
      <span class="h-meta">${r.score}/100</span>
      <span class="history-actions">
        <button class="btn btn-ghost btn-sm" type="button" data-view>View</button>
        <button class="btn btn-ghost btn-sm danger" type="button" data-del>Delete</button>
      </span>`;
    row.querySelector('[data-view]').addEventListener('click', () => {
      Session.lastRecord = r;
      renderResults(r);
      location.hash = '#/results';
    });
    row.querySelector('[data-del]').addEventListener('click', () => {
      if (confirm('Delete this session from your history?')) {
        History.remove(r.id);
        renderProgress();
        toast('Session deleted.');
      }
    });
    list.appendChild(row);
  });
}

$('#clearHistoryBtn').addEventListener('click', () => {
  if (confirm('Clear ALL session history? This cannot be undone.')) {
    History.clear();
    renderProgress();
    toast('History cleared.');
  }
});

/* ============================ SETTINGS ============================ */

function renderSettings() {
  const s = Settings.get();
  $('#setTheme').value = s.theme;
  $('#setFontSize').value = s.fontSize;
  $('#setSound').checked = s.sound;
  $('#setWarnings').checked = s.warnings;
  $('#setGuided').checked = s.guidedDefault;
  $('#setDuration').value = s.duration;
  $('#setMinWords').value = s.minWords;
  $('#setMaxWords').value = s.maxWords;
  $('#setRecommended').value = s.recommended;
}

function bindSettings() {
  $('#setTheme').addEventListener('change', e => Settings.save({ theme: e.target.value }));
  $('#setFontSize').addEventListener('change', e => Settings.save({ fontSize: e.target.value }));
  $('#setSound').addEventListener('change', e => Settings.save({ sound: e.target.checked }));
  $('#setWarnings').addEventListener('change', e => Settings.save({ warnings: e.target.checked }));
  $('#setGuided').addEventListener('change', e => Settings.save({ guidedDefault: e.target.checked }));
  $('#setDuration').addEventListener('change', e => Settings.save({ duration: clampInt(e.target.value, 3, 60, 10) }));
  $('#setMinWords').addEventListener('change', e => Settings.save({ minWords: clampInt(e.target.value, 50, 1000, 160) }));
  $('#setMaxWords').addEventListener('change', e => Settings.save({ maxWords: clampInt(e.target.value, 60, 1200, 200) }));
  $('#setRecommended').addEventListener('change', e => Settings.save({ recommended: e.target.value }));
}

function applySettings(s) {
  const theme = s.theme === 'system'
    ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : s.theme;
  document.documentElement.dataset.theme = theme;
  const size = { small: '16px', medium: '19px', large: '22px' }[s.fontSize] || '19px';
  document.documentElement.style.setProperty('--editor-size', size);
}

if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (Settings.get().theme === 'system') applySettings(Settings.get());
  });
}

/* ============================ INIT ============================ */

(function init() {
  applySettings(Settings.get());
  bindSettings();
  navigate(parseHash());
  Session.tryRecover();
  if (!Storage.available) {
    toast('Local storage is unavailable — sessions will not be saved between visits.');
  }
})();
