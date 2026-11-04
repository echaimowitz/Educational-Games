/* Math Quest: Rainbow Realms — game engine & screens. */
(function () {
  'use strict';
  const MQ = window.MQ, Q = MQ.Q, WORLDS = MQ.WORLDS;
  const app = document.getElementById('app');

  const SAVE_KEY = 'mathquest.v1';
  const Q_PER_MISSION = 10, BOSS_HP = 12, HEARTS = 3, HINT_COST = 2, START_GEMS = 10;
  const DAILY_COUNT = 12, FREEZE_MS = 3000;
  const MAIN_IDX = WORLDS.map((w, i) => (w.bonus ? -1 : i)).filter((i) => i >= 0);
  const BONUS_IDX = WORLDS.map((w, i) => (w.bonus ? i : -1)).filter((i) => i >= 0);
  const LAST_MAIN = MAIN_IDX[MAIN_IDX.length - 1];
  const LEVELS = { 1: { name: 'Warm-up', icon: '🌱' }, 2: { name: 'Tricky', icon: '🔥' }, 3: { name: 'Expert', icon: '⚡' } };
  const RAINBOW = ['#ff3b3b', '#ff8c1a', '#ffd400', '#2ecc40', '#1e90ff', '#4b3bff', '#a64dff'];
  const AVATARS = [
    { e: '🦄', cost: 0 }, { e: '👸', cost: 0 }, { e: '🐠', cost: 0 }, { e: '🥋', cost: 0 }, { e: '🧜‍♀️', cost: 0 }, { e: '🐱', cost: 0 },
    { e: '🐶', cost: 0 }, { e: '🦖', cost: 0 }, { e: '🚀', cost: 0 },
    { e: '🐬', cost: 40 }, { e: '🦋', cost: 40 }, { e: '🐢', cost: 50 }, { e: '🐼', cost: 50 }, { e: '🦊', cost: 75 }, { e: '🐙', cost: 75 },
    { e: '🦁', cost: 100 }, { e: '🧚', cost: 120 }, { e: '🦸‍♀️', cost: 150 }, { e: '🥷', cost: 180 }, { e: '👩‍🚀', cost: 200 }, { e: '🦕', cost: 220 },
    { e: '🐲', cost: 300 }, { e: '🌈', cost: 400 }, { e: '👑', cost: 500 },
  ];
  const BADGES = [
    { id: 'first', e: '🎉', name: 'First Splash', desc: 'Finish your first mission' },
    { id: 'perfect', e: '💯', name: 'Flawless', desc: 'Get 10 out of 10 in a mission' },
    { id: 'streak10', e: '🔥', name: 'On Fire', desc: 'Answer 10 in a row correctly' },
    { id: 'streak25', e: '☄️', name: 'Unstoppable', desc: 'Answer 25 in a row correctly' },
    { id: 'nohint3', e: '🧠', name: 'Big Brain', desc: 'Earn 3 stars without using a hint' },
    { id: 'expert5', e: '⚡', name: 'Expert Mode', desc: 'Reach Expert level in 5 different skills' },
    { id: 'boss', e: '⚔️', name: 'Boss Buster', desc: 'Defeat a boss' },
    { id: 'flawlessboss', e: '🛡️', name: 'Untouchable', desc: 'Defeat a boss without losing a heart' },
    { id: 'world3', e: '🏅', name: 'World Master', desc: 'Get 3 stars on every mission in a world' },
    { id: 'gems200', e: '💎', name: 'Treasure Hunter', desc: 'Earn 200 gems in total' },
    { id: 'rainbow', e: '🌈', name: 'Rainbow Restored', desc: 'Defeat all five main bosses' },
    { id: 'bonus', e: '🧜‍♀️', name: 'Explorer', desc: 'Defeat a bonus-world boss' },
    { id: 'daily1', e: '📅', name: 'Daily Hero', desc: 'Finish a Daily Challenge' },
    { id: 'daily10', e: '🌟', name: 'Perfect Day', desc: 'Get every Daily Challenge question right' },
    { id: 'dstreak3', e: '🔥', name: 'Three in a Row', desc: 'Play the Daily Challenge 3 days in a row' },
    { id: 'dstreak7', e: '🗓️', name: 'Week Warrior', desc: 'Play the Daily Challenge 7 days in a row' },
    { id: 'race1', e: '🏁', name: 'Speedster', desc: 'Win a race' },
    { id: 'race10', e: '🏎️', name: 'Race Champion', desc: 'Win 10 races' },
  ];

  // ---------------- storage ----------------
  function load() {
    try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && Array.isArray(s.profiles)) return s; } catch (e) { /* ignore */ }
    return { profiles: [], settings: {}, current: null };
  }
  const store = load();
  store.settings = Object.assign({ sound: true, timer: 'normal' }, store.settings);
  store.h2h = store.h2h || {};
  store.profiles.forEach(normalize);
  function normalize(p) {
    p.daily = p.daily || { streak: 0, last: null, log: {} };
    p.races = p.races || { played: 0, wins: 0 };
    p.owned = p.owned || [];
    AVATARS.filter((a) => a.cost === 0).forEach((a) => { if (!p.owned.includes(a.e)) p.owned.push(a.e); });
    return p;
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(store)); } catch (e) { /* storage unavailable: play continues unsaved */ } }
  const P = () => store.profiles.find((p) => p.id === store.current);
  const byId = (id) => store.profiles.find((p) => p.id === id);

  function newProfile(name, avatar, grade) {
    return normalize({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name, avatar, grade, worldUnlocked: Math.max(0, Math.min(LAST_MAIN, grade - 4)),
      gems: START_GEMS, lifetimeGems: 0, missions: {}, bosses: {}, levels: {}, owned: [], badges: [],
      stats: { answered: 0, correct: 0, streak: 0, bestStreak: 0 },
    });
  }

  // ---------------- helpers ----------------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const mkey = (wi, mi) => `w${wi}m${mi}`;
  const isBonus = (wi) => !!WORLDS[wi].bonus;
  const worldOpen = (p, wi) => isBonus(wi) || wi <= p.worldUnlocked;
  const starsOf = (p, wi, mi) => (p.missions[mkey(wi, mi)] || {}).stars || 0;
  const worldStars = (p, wi) => WORLDS[wi].missions.reduce((s, _, mi) => s + starsOf(p, wi, mi), 0);
  const missionUnlocked = (p, wi, mi) => worldOpen(p, wi) && (mi === 0 || starsOf(p, wi, mi - 1) > 0);
  const bossUnlocked = (p, wi) => worldOpen(p, wi) && WORLDS[wi].missions.every((_, mi) => starsOf(p, wi, mi) > 0);
  const colorsRestored = (p) => { const c = new Set(); WORLDS.forEach((w, wi) => { if (p.bosses[wi]) w.colors.forEach((x) => c.add(x)); }); return c; };
  const mainBosses = (p) => MAIN_IDX.filter((i) => p.bosses[i]).length;
  const starStr = (n, max = 3) => '★'.repeat(n) + '☆'.repeat(max - n);
  const gradeWorld = (grade) => MAIN_IDX[Math.max(0, Math.min(MAIN_IDX.length - 1, grade - 4))];
  const mmss = (ms) => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const dateKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const yesterdayKey = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dateKey(d); };

  function rainbowBar(p) {
    const lit = colorsRestored(p);
    return `<div class="rainbow-bar" title="Rainbow colors restored">${RAINBOW.map((c, i) => `<span style="${lit.has(i) ? `background:${c}` : ''}" class="${lit.has(i) ? 'lit' : ''}"></span>`).join('')}</div>`;
  }
  function deco(theme) {
    const w = WORLDS.find((x) => x.theme === theme);
    const set = w ? w.deco : ['🌈', '⭐', '🦄', '🐠', '👑', '🥋'];
    let out = '<div class="deco" aria-hidden="true">';
    for (let i = 0; i < 9; i++) out += `<span style="left:${(i * 11 + 3) % 96}%;top:${(i * 37 + 10) % 90}%;animation-delay:${i * 0.7}s;font-size:${22 + (i % 3) * 10}px">${set[i % set.length]}</span>`;
    return out + '</div>';
  }

  // ---------------- seeded randomness (daily challenge) ----------------
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function withSeed(seed, fn) { const orig = Math.random; Math.random = mulberry32(hashStr(seed)); try { return fn(); } finally { Math.random = orig; } }

  // ---------------- sound & confetti ----------------
  let ac = null;
  function tone(freqs, dur = 0.11, type = 'sine') {
    if (!store.settings.sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = ac.currentTime;
      freqs.forEach((f, i) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = type; o.frequency.value = f;
        const t = t0 + i * dur;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.05);
      });
    } catch (e) { /* no audio */ }
  }
  const sfx = {
    good: () => tone([660, 880, 1175]), bad: () => tone([300, 220], 0.16, 'triangle'), click: () => tone([520], 0.05),
    win: () => tone([523, 659, 784, 1047, 1319], 0.13), hit: () => tone([200, 400, 800], 0.07, 'square'), level: () => tone([784, 988, 1319, 1568], 0.08),
    freeze: () => tone([900, 700, 500], 0.08, 'triangle'),
  };
  function confetti(emojis, count = 36) {
    const layer = document.createElement('div');
    layer.className = 'confetti';
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.textContent = pick(emojis);
      s.style.left = Math.random() * 100 + '%';
      s.style.animationDelay = Math.random() * 0.6 + 's';
      s.style.animationDuration = 1.8 + Math.random() * 1.4 + 's';
      s.style.fontSize = 18 + Math.random() * 22 + 'px';
      layer.appendChild(s);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 3800);
  }
  function toast(html) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = html;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 2600);
  }

  // ---------------- badges & gems ----------------
  function award(p, id) {
    if (!p || p.badges.includes(id)) return;
    p.badges.push(id);
    const b = BADGES.find((x) => x.id === id);
    if (b) setTimeout(() => toast(`<b>${b.e} Badge earned!</b><br>${b.name}`), 600);
  }
  function addGems(p, n) { if (!p) return; p.gems += n; p.lifetimeGems += n; if (p.lifetimeGems >= 200) award(p, 'gems200'); }

  // ---------------- screen state ----------------
  let screen = 'profiles', S = null, timerId = null, swId = null, raceId = null, RC = null;
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
  function stopAll() { stopTimer(); if (swId) { clearInterval(swId); swId = null; } if (raceId) { clearInterval(raceId); raceId = null; } }
  function show(html, theme, extraClass) {
    stopAll();
    app.innerHTML = `<div class="screen ${theme || 'theme-home'} ${extraClass || ''}">${deco(theme || 'theme-home')}<div class="wrap">${html}</div></div>`;
    window.scrollTo(0, 0);
  }
  function topbar(p, back) {
    return `<div class="topbar">
      ${back ? `<button class="btn ghost" data-act="${back}">⬅ Back</button>` : `<button class="btn ghost" data-act="profiles">👥 Players</button>`}
      <div class="who"><span class="avatar sm">${p.avatar}</span> ${esc(p.name)}</div>
      <div class="gems">💎 ${p.gems}</div>
    </div>`;
  }

  // ---------------- PROFILES ----------------
  function renderProfiles() {
    screen = 'profiles';
    const cards = store.profiles.map((p) => `
      <button class="profile card" data-act="choose" data-arg="${p.id}">
        <span class="avatar">${p.avatar}</span>
        <span class="pname">${esc(p.name)}</span>
        <span class="pmeta">Grade ${p.grade} · 💎 ${p.gems} · ⚔️ ${mainBosses(p)}/5${p.daily.log[dateKey()] ? ' · 📅 ✅' : ''}</span>
      </button>`).join('');
    show(`
      <h1 class="title">🌈 Math Quest<small>Rainbow Realms</small></h1>
      <p class="story card">${MQ.STORY}</p>
      <h2 class="on-bg">Who's playing?</h2>
      <div class="grid profiles">${cards}
        <button class="profile card new" data-act="new-profile"><span class="avatar">➕</span><span class="pname">New Player</span></button>
      </div>
      <div class="feature-row">
        <button class="card feature race" data-act="race-setup"><span class="fe">🏁</span><span><b>Race Mode</b>Two players, one screen. First to the finish wins!</span></button>
        <button class="card feature daily" data-act="daily-board"><span class="fe">📅</span><span><b>Today's Scores</b>See who's winning the Daily Challenge</span></button>
      </div>
      <div class="center"><button class="btn ghost" data-act="settings">⚙️ For Grown-ups</button></div>`);
  }

  let draft = { name: '', avatar: '🦄', grade: 4 };
  function renderNewProfile() {
    screen = 'new-profile';
    const free = AVATARS.filter((a) => a.cost === 0);
    show(`
      <div class="topbar"><button class="btn ghost" data-act="profiles">⬅ Back</button></div>
      <div class="card form">
        <h2>Create your hero</h2>
        <label>Your name<input id="pname" maxlength="16" autocomplete="off" value="${esc(draft.name)}" placeholder="Type your name"></label>
        <div class="label">Pick an avatar</div>
        <div class="avatar-pick">${free.map((a) => `<button class="avatar-btn ${draft.avatar === a.e ? 'sel' : ''}" data-act="draft-avatar" data-arg="${a.e}">${a.e}</button>`).join('')}</div>
        <div class="label">What grade are you in?</div>
        <div class="grade-pick">${[4, 5, 6, 7, 8].map((g) => `<button class="chip ${draft.grade === g ? 'sel' : ''}" data-act="draft-grade" data-arg="${g}">Grade ${g}<small>${WORLDS[gradeWorld(g)].emoji} ${WORLDS[gradeWorld(g)].name}</small></button>`).join('')}</div>
        <p class="note">Your grade's world and every world before it are unlocked. Higher worlds unlock when you beat each boss. Bonus worlds are always open and match your grade.</p>
        <button class="btn big primary" data-act="create-profile">Start my quest! ✨</button>
      </div>`);
    const inp = document.getElementById('pname');
    inp.addEventListener('input', () => { draft.name = inp.value; });
    if (!draft.name) inp.focus();
  }

  // ---------------- MAP ----------------
  function worldCard(p, wi) {
    const w = WORLDS[wi], locked = !worldOpen(p, wi);
    const sub = w.bonus ? `${w.guide.emoji} ${w.guide.name}` : `Grade ${w.grade} · ${w.guide.emoji} ${w.guide.name}`;
    const prevBoss = !w.bonus && wi > 0 ? WORLDS[MAIN_IDX[MAIN_IDX.indexOf(wi) - 1]].boss.name : '';
    const status = locked ? `Defeat ${prevBoss} to unlock` : `★ ${worldStars(p, wi)}/${w.missions.length * 3} &nbsp; ${p.bosses[wi] ? `✅ ${w.boss.emoji}` : `${w.boss.emoji} boss waiting`}`;
    return `<button class="world card ${w.theme} ${locked ? 'locked' : ''}" data-act="${locked ? 'locked-world' : 'world'}" data-arg="${wi}">
      <span class="wemoji">${locked ? '🔒' : w.emoji}</span>
      <span class="winfo"><span class="wname">${w.name}</span><span class="wgrade">${sub}</span><span class="wstars">${status}</span></span>
    </button>`;
  }
  function renderMap() {
    screen = 'map';
    const p = P();
    const today = p.daily.log[dateKey()];
    show(`${topbar(p)}
      <h1 class="title sm">🗺️ The Realms</h1>
      ${rainbowBar(p)}
      <div class="feature-row">
        <button class="card feature daily ${today ? 'done' : ''}" data-act="daily"><span class="fe">📅</span><span><b>Daily Challenge</b>${today ? `Done today: ${today.correct}/${DAILY_COUNT} ✅` : `${DAILY_COUNT} new questions today! Win bonus 💎`}${p.daily.streak > 1 ? `<br><span class="streak">🔥 ${p.daily.streak}-day streak</span>` : ''}</span></button>
        <button class="card feature race" data-act="race-setup"><span class="fe">🏁</span><span><b>Race a Friend</b>Head-to-head on one screen${p.races.played ? `<br>🏆 ${p.races.wins} wins` : ''}</span></button>
      </div>
      <div class="menu-row">
        <button class="btn" data-act="treasures">🎁 Treasures</button>
        <button class="btn" data-act="shop">🛍️ Avatar Shop</button>
        <button class="btn" data-act="badges">🏅 Badges</button>
      </div>
      <div class="world-path">${MAIN_IDX.map((wi) => worldCard(p, wi)).join('')}</div>
      ${colorsRestored(p).size === 7 ? '<p class="card center">🌈 You restored the whole rainbow! Keep going for 3 stars everywhere and every badge!</p>' : ''}
      <h2 class="section-title">⭐ Bonus Worlds</h2>
      <p class="section-sub">Always open, with questions for Grade ${p.grade}</p>
      <div class="bonus-grid">${BONUS_IDX.map((wi) => worldCard(p, wi)).join('')}</div>`);
  }

  // ---------------- WORLD ----------------
  function renderWorld(wi) {
    screen = 'world';
    const p = P(), w = WORLDS[wi];
    const missions = w.missions.map((m, mi) => {
      const un = missionUnlocked(p, wi, mi), st = starsOf(p, wi, mi), lvl = p.levels[m.topic] || 1;
      return `<button class="mission card ${un ? '' : 'locked'}" data-act="${un ? 'mission' : 'locked-mission'}" data-arg="${wi},${mi}">
        <span class="mnum">${un ? (st ? m.treasure : mi + 1) : '🔒'}</span>
        <span class="minfo"><span class="mname">${m.name}${m.timed ? ' ⏱️' : ''}</span><span class="mskill">${m.skill}</span></span>
        <span class="mside"><span class="stars">${starStr(st)}</span><span class="lvl-tag">${LEVELS[lvl].icon} ${LEVELS[lvl].name}</span></span>
      </button>`;
    }).join('');
    const bu = bossUnlocked(p, wi);
    show(`${topbar(p, 'map')}
      <h1 class="title sm">${w.emoji} ${w.name}</h1>
      <div class="guide card"><span class="guide-emoji">${w.guide.emoji}</span><div><b>${w.guide.name}:</b> ${w.intro}${w.bonus ? `<br><small>Bonus world: questions are set for <b>Grade ${p.grade}</b>.</small>` : ''}</div></div>
      <div class="missions">${missions}
        <button class="mission card boss-card ${bu ? '' : 'locked'}" data-act="${bu ? 'boss' : 'locked-boss'}" data-arg="${wi}">
          <span class="mnum">${bu ? w.boss.emoji : '🔒'}</span>
          <span class="minfo"><span class="mname">BOSS: ${w.boss.name}</span><span class="mskill">${bu ? 'Mixed skills · timed · 3 hearts' : 'Earn at least 1 star on every mission to unlock'}</span></span>
          <span class="mside">${p.bosses[wi] ? '✅' : '⚔️'}</span>
        </button>
      </div>`, w.theme);
  }

  function renderMissionIntro(wi, mi) {
    screen = 'intro';
    const p = P(), w = WORLDS[wi], m = w.missions[mi], lvl = p.levels[m.topic] || 1;
    show(`${topbar(p, 'world:' + wi)}
      <div class="card intro">
        <div class="intro-emoji">${m.treasure}</div>
        <h2>Mission ${mi + 1}: ${m.name}</h2>
        <p class="skill">${m.skill}</p>
        <p>${w.guide.emoji} <i>${m.story}</i></p>
        <ul class="rules">
          <li>${Q_PER_MISSION} questions. Get 3 in a row right and you level up: 🌱 → 🔥 → ⚡</li>
          <li>★ = 6 correct &nbsp; ★★ = 8 correct &nbsp; ★★★ = 8 correct <b>and</b> reach ⚡ Expert</li>
          ${m.timed && store.settings.timer !== 'off' ? `<li>⏱️ Speed mission! ${m.timed * (store.settings.timer === 'relaxed' ? 2 : 1)} seconds per question.</li>` : ''}
          <li>Stuck? A hint costs ${HINT_COST} 💎</li>
        </ul>
        <p>You'll start at <b>${LEVELS[lvl].icon} ${LEVELS[lvl].name}</b>.</p>
        <button class="btn big primary" data-act="start-mission" data-arg="${wi},${mi}">Let's go! 🚀</button>
      </div>`, w.theme);
  }

  // ---------------- PLAY (mission / boss / daily) ----------------
  function startMission(wi, mi) {
    const p = P(), m = WORLDS[wi].missions[mi];
    S = { mode: 'mission', wi, mi, topic: m.topic, timed: m.timed || 0, grade: p.grade, lvl: p.levels[m.topic] || 1, idx: 0, correct: 0, results: [], run: 0, miss: 0, reachedHard: false, hints: 0, gemsEarned: 0, seen: new Set() };
    nextQuestion();
  }
  function startBoss(wi) {
    const w = WORLDS[wi];
    S = { mode: 'boss', wi, topics: w.missions.map((m) => m.topic), grade: P().grade, lvl: 2, hp: BOSS_HP, hearts: HEARTS, run: 0, miss: 0, hints: 0, gemsEarned: 0, seen: new Set(), lastTopic: null, count: 0, lostHeart: false };
    screen = 'boss-intro';
    show(`${topbar(P(), 'world:' + wi)}
      <div class="card intro">
        <div class="intro-emoji boss-bob">${w.boss.emoji}</div>
        <h2>${w.boss.name}</h2>
        <p class="taunt">"${w.boss.intro}"</p>
        <ul class="rules"><li>Hit the boss ${BOSS_HP} times with correct answers.</li><li>You have ${'❤️'.repeat(HEARTS)}. A wrong answer or running out of time costs a heart.</li><li>Questions mix every skill from this world.</li>
        <li>Timer: ${store.settings.timer === 'off' ? 'off' : store.settings.timer === 'relaxed' ? 'relaxed (double time)' : 'normal'} (grown-ups can change this)</li></ul>
        <button class="btn big danger" data-act="begin-boss">⚔️ FIGHT!</button>
      </div>`, w.theme);
  }

  function buildDaily(grade) {
    return withSeed(`${dateKey()}|${grade}`, () => {
      const main = WORLDS[gradeWorld(grade)].missions.map((m) => m.topic);
      const bonus = BONUS_IDX.flatMap((wi) => WORLDS[wi].missions.map((m) => m.topic));
      const seen = new Set(), list = [];
      for (let i = 0; i < DAILY_COUNT; i++) {
        const lvl = i < 4 ? 1 : i < 8 ? 2 : 3, pool = i === 5 || i === 10 ? bonus : main;
        list.push(Q.generate(pick(pool), lvl, seen, grade));
      }
      return list;
    });
  }
  function startDaily() {
    const p = P();
    S = { mode: 'daily', wi: gradeWorld(p.grade), grade: p.grade, list: buildDaily(p.grade), idx: 0, correct: 0, results: [], elapsed: 0, practice: !!p.daily.log[dateKey()], gemsEarned: 0, seen: new Set() };
    nextQuestion();
  }

  function nextQuestion() {
    if ((S.mode === 'mission' && S.idx >= Q_PER_MISSION)) return finishMission();
    if (S.mode === 'daily' && S.idx >= DAILY_COUNT) return finishDaily();
    if (S.mode === 'boss' && (S.hp <= 0 || S.hearts <= 0)) return finishBoss();
    if (S.mode === 'daily') { S.q = S.list[S.idx]; S.lvl = S.q.level; }
    else {
      let topic = S.topic;
      if (S.mode === 'boss') { const opts = S.topics.filter((t) => t !== S.lastTopic); topic = pick(opts); S.lastTopic = topic; S.count++; }
      S.q = Q.generate(topic, S.lvl, S.seen, S.grade);
    }
    S.input = ''; S.answered = false; S.hintShown = false; S.msg = ''; S.levelMsg = ''; S.qStart = Date.now();
    // per-question timer: bosses always, missions only when marked timed
    S.timeSecs = 0;
    if (store.settings.timer !== 'off') {
      if (S.mode === 'boss') S.timeSecs = WORLDS[S.wi].baseTime + (S.q.topic.endsWith('_word') ? 20 : 0);
      else if (S.mode === 'mission' && S.timed) S.timeSecs = S.timed;
      if (store.settings.timer === 'relaxed') S.timeSecs *= 2;
    }
    renderPlay();
    if (S.timeSecs) startTimer();
    if (S.mode === 'daily' && !swId) swId = setInterval(updateStopwatch, 500);
  }

  function startTimer() {
    stopTimer();
    S.deadline = Date.now() + S.timeSecs * 1000;
    timerId = setInterval(tick, 200);
    tick();
  }
  function tick() {
    if (!S || S.answered || !S.timeSecs) return stopTimer();
    const left = (S.deadline - Date.now()) / 1000;
    const fill = document.getElementById('timer-fill'), label = document.getElementById('timer-label');
    if (fill) { fill.style.width = Math.max(0, (left / S.timeSecs) * 100) + '%'; fill.classList.toggle('low', left < Math.min(10, S.timeSecs / 3)); }
    if (label) label.textContent = Math.max(0, Math.ceil(left)) + 's';
    if (left <= 0) { stopTimer(); record(false, true); }
  }
  function dailyElapsed() { return S.elapsed + (S.answered ? 0 : Date.now() - S.qStart); }
  function updateStopwatch() { const el = document.getElementById('stopwatch'); if (el && S && S.mode === 'daily') el.textContent = '⏱ ' + mmss(dailyElapsed()); }

  function renderPlay() {
    screen = 'play';
    const p = P(), w = WORLDS[S.wi], q = S.q, a = q.a;
    const total = S.mode === 'daily' ? DAILY_COUNT : Q_PER_MISSION;
    let progress = '', bossHead = '';
    if (S.mode !== 'boss') {
      progress = `<div class="progress">${Array.from({ length: total }, (_, i) => `<span class="dot ${S.results[i] === true ? 'ok' : S.results[i] === false ? 'bad' : i === S.idx ? 'now' : ''}"></span>`).join('')}</div>`;
    } else {
      bossHead = `<div class="boss-area">
        <div class="boss-emoji ${S.anim || ''}">${w.boss.emoji}</div>
        <div class="boss-stats">
          <div class="boss-name">${w.boss.name}</div>
          <div class="hp"><div class="hp-fill" style="width:${(S.hp / BOSS_HP) * 100}%"></div></div>
          <div class="hearts">${'❤️'.repeat(S.hearts)}${'🤍'.repeat(HEARTS - S.hearts)}</div>
        </div></div>`;
    }
    const timerBar = S.timeSecs ? `<div class="timer"><div id="timer-fill" class="timer-fill"></div><span id="timer-label"></span></div>` : '';
    const lvl = LEVELS[S.lvl];
    let controls;
    if (S.answered) {
      const ok = S.lastOk;
      controls = `<div class="feedback ${ok ? 'good' : 'bad'}">
        <div class="fb-title">${ok ? `✅ ${pick(w.cheers)}${S.lastGems ? ` <span class="plus">+${S.lastGems} 💎</span>` : ''}` : S.timedOut ? '⏰ Time\'s up!' : '❌ Not quite!'}</div>
        ${ok ? '' : `<div class="fb-answer">Answer: <b>${Q.answerHTML(a)}</b></div><div class="fb-explain">${q.explain}</div>`}
        ${S.levelMsg ? `<div class="fb-level">${S.levelMsg}</div>` : ''}
        <button class="btn big primary" data-act="next" id="next-btn">Next ➜</button>
      </div>`;
    } else if (a.kind === 'choice') {
      controls = `<div class="choices">${a.choices.map((c, i) => `<button class="btn choice" data-act="choose-answer" data-arg="${i}"><span class="key">${i + 1}</span>${c}</button>`).join('')}</div>`;
    } else {
      const keys = ['7', '8', '9', '⌫', '4', '5', '6', '−', '1', '2', '3', '/', '0', '.', 'space', '✓'];
      controls = `<div class="answer-box"><span id="answer-display">${showInput(S.input) || '<span class="ph">type your answer</span>'}</span></div>
        <div class="keypad">${keys.map((k) => `<button class="key-btn ${k === '✓' ? 'go' : ''} ${k === 'space' ? 'small' : ''}" data-act="key" data-arg="${k}">${k === 'space' ? 'space<small>2 1/3</small>' : k}</button>`).join('')}</div>`;
    }
    const canHint = S.mode !== 'daily' && !S.hintShown && !S.answered;
    const right = S.mode === 'daily' ? `<div class="stopwatch" id="stopwatch">⏱ ${mmss(dailyElapsed())}</div>` : `<div class="gems">💎 ${p.gems}</div>`;
    const meta = S.mode === 'boss' ? `Round ${S.count}` : `${S.mode === 'daily' ? '📅 Daily · ' : ''}Question ${Math.min(S.idx + 1, total)} of ${total}`;
    app.innerHTML = `<div class="screen ${w.theme} play">${deco(w.theme)}<div class="wrap">
      <div class="topbar"><button class="btn ghost" data-act="quit">✖ Quit</button>${progress || '<span></span>'}${right}</div>
      ${bossHead}${timerBar}
      <div class="qcard card">
        <div class="qmeta"><span class="lvl-tag l${S.lvl}">${lvl.icon} ${lvl.name}</span><span>${meta}</span></div>
        <div class="qtext">${q.q}</div>
        ${S.hintShown ? `<div class="hint">💡 ${q.hint}</div>` : ''}
        ${S.msg ? `<div class="msg">${S.msg}</div>` : ''}
        ${canHint ? `<button class="btn hint-btn" data-act="hint" ${p.gems < HINT_COST ? 'disabled' : ''}>💡 Hint (${HINT_COST} 💎)</button>` : ''}
      </div>
      <div class="controls">${controls}</div>
    </div></div>`;
    S.anim = '';
    if (S.answered) { const nb = document.getElementById('next-btn'); if (nb) nb.focus(); }
    if (S.timeSecs && !S.answered) tick();
  }

  // Show typed answers with thousands commas (4000 → 4,000). The stored answer has no commas,
  // and the checker ignores commas, so "4,000" and "4000" are always treated the same.
  function withCommas(input) {
    return String(input).replace(/(^|[^.\d])(\d{4,})/g, (m, pre, digits) => pre + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  }
  const showInput = (input) => esc(withCommas(input));
  function updateDisplay() {
    const d = document.getElementById('answer-display');
    if (d) d.innerHTML = showInput(S.input) || '<span class="ph">type your answer</span>';
  }
  function editInput(input, k) {
    if (k === ',') return input; // commas are added automatically, so a typed comma changes nothing
    if (k === '⌫') return input.slice(0, -1);
    if (k === 'space') return input && !input.endsWith(' ') ? input + ' ' : input;
    if (k === '−' || k === '-') return input.startsWith('-') ? input.slice(1) : '-' + input;
    return input.length < 14 ? input + k : input;
  }
  function pressKey(k) {
    if (!S || S.answered || S.q.a.kind === 'choice') return;
    if (k === '✓') return submit(S.input);
    S.input = editInput(S.input, k);
    if (S.msg) { S.msg = ''; const m = document.querySelector('.msg'); if (m) m.remove(); }
    updateDisplay();
  }
  function submit(value) {
    if (S.answered) return;
    if (S.q.a.kind !== 'choice' && !String(value).trim()) return;
    const res = Q.check(S.q.a, value);
    if (res.retry) { S.msg = res.msg; renderPlay(); return; }
    record(res.ok, false);
  }

  function record(ok, timedOut) {
    const p = P();
    stopTimer();
    if (S.mode === 'daily') S.elapsed += Date.now() - S.qStart;
    S.answered = true; S.lastOk = ok; S.timedOut = timedOut; S.lastGems = 0;
    p.stats.answered++;
    if (ok) {
      p.stats.correct++; p.stats.streak++;
      p.stats.bestStreak = Math.max(p.stats.bestStreak, p.stats.streak);
      if (p.stats.streak >= 10) award(p, 'streak10');
      if (p.stats.streak >= 25) award(p, 'streak25');
      if (S.mode !== 'daily') { S.lastGems = S.lvl; S.gemsEarned += S.lvl; addGems(p, S.lvl); }
      sfx.good();
    } else { p.stats.streak = 0; sfx.bad(); }
    if (S.mode !== 'daily') {
      if (ok) {
        if (S.lvl === 3) S.reachedHard = true;
        S.run++; S.miss = 0;
        if (S.run >= 3 && S.lvl < 3) { S.lvl++; S.run = 0; S.levelMsg = `Level up! Now: ${LEVELS[S.lvl].icon} ${LEVELS[S.lvl].name}`; setTimeout(sfx.level, 350); }
      } else {
        S.run = 0; S.miss++;
        if (S.miss >= 2 && S.lvl > 1) { S.lvl--; S.miss = 0; S.levelMsg = `Let's practice at ${LEVELS[S.lvl].icon} ${LEVELS[S.lvl].name} for a bit.`; }
      }
    }
    if (S.mode === 'boss') {
      if (ok) { S.hp--; S.anim = 'hit'; setTimeout(sfx.hit, 120); } else { S.hearts--; S.lostHeart = true; S.anim = 'attack'; }
    } else {
      S.results[S.idx] = ok; if (ok) S.correct++; S.idx++;
      if (ok) confetti(WORLDS[S.wi].deco, 14);
    }
    save();
    renderPlay();
  }

  function useHint() {
    const p = P();
    if (!S || S.mode === 'daily' || S.hintShown || S.answered || p.gems < HINT_COST) return;
    p.gems -= HINT_COST; S.hints++; S.hintShown = true;
    save();
    renderPlay();
  }

  function finishMission() {
    const p = P(), w = WORLDS[S.wi], m = w.missions[S.mi], key = mkey(S.wi, S.mi), last = w.missions.length - 1;
    const stars = S.correct >= 8 && S.reachedHard ? 3 : S.correct >= 8 ? 2 : S.correct >= 6 ? 1 : 0;
    const prev = p.missions[key] || { stars: 0, best: 0, plays: 0 };
    const firstTreasure = stars > 0 && !prev.stars;
    const bonus = stars * 5 + (stars > prev.stars ? 5 : 0);
    if (bonus) addGems(p, bonus);
    p.missions[key] = { stars: Math.max(prev.stars, stars), best: Math.max(prev.best, S.correct), plays: (prev.plays || 0) + 1 };
    p.levels[m.topic] = S.lvl;
    if (stars > 0) award(p, 'first');
    if (S.correct === Q_PER_MISSION) award(p, 'perfect');
    if (stars === 3 && S.hints === 0) award(p, 'nohint3');
    if (Object.values(p.levels).filter((x) => x === 3).length >= 5) award(p, 'expert5');
    if (w.missions.every((_, mi) => starsOf(p, S.wi, mi) === 3)) award(p, 'world3');
    save();
    screen = 'results';
    if (stars) { sfx.win(); confetti(['⭐', '🌈', ...w.deco]); }
    const nextUn = S.mi < last && missionUnlocked(p, S.wi, S.mi + 1);
    const tip = stars === 0 ? 'You need 6 correct to earn a star. Use hints if you get stuck. You can do it!' : stars < 3 ? (S.reachedHard ? 'Get 8 correct to earn the third star!' : 'For ★★★, get 3 in a row right to climb to ⚡ Expert, and get 8 correct.') : 'Perfect mission! You are a math legend.';
    show(`${topbar(p, 'world:' + S.wi)}
      <div class="card results">
        <h2>${stars ? 'Mission complete!' : 'So close!'}</h2>
        <div class="big-stars">${starStr(stars)}</div>
        <p class="score">${S.correct} / ${Q_PER_MISSION} correct · 💎 +${S.gemsEarned + bonus}</p>
        ${firstTreasure ? `<div class="treasure-won"><span>${m.treasure}</span>You found the <b>${m.treasureName}</b>!</div>` : ''}
        <p class="note">${tip}</p>
        <div class="menu-row">
          <button class="btn" data-act="mission" data-arg="${S.wi},${S.mi}">🔁 Play again</button>
          ${nextUn ? `<button class="btn primary" data-act="mission" data-arg="${S.wi},${S.mi + 1}">Next mission ➜</button>` : ''}
          ${S.mi === last && bossUnlocked(p, S.wi) && !p.bosses[S.wi] ? `<button class="btn danger" data-act="boss" data-arg="${S.wi}">⚔️ Fight the boss!</button>` : ''}
          <button class="btn ghost" data-act="world" data-arg="${S.wi}">🗺️ World</button>
        </div>
      </div>`, w.theme);
  }

  function finishBoss() {
    const p = P(), w = WORLDS[S.wi], won = S.hp <= 0;
    const nextMain = !w.bonus ? MAIN_IDX[MAIN_IDX.indexOf(S.wi) + 1] : undefined;
    screen = 'results';
    let html;
    if (won) {
      const first = !p.bosses[S.wi];
      p.bosses[S.wi] = true;
      addGems(p, first ? 50 : 15);
      if (nextMain !== undefined) p.worldUnlocked = Math.max(p.worldUnlocked, nextMain);
      award(p, w.bonus ? 'bonus' : 'boss');
      if (!S.lostHeart) award(p, 'flawlessboss');
      if (MAIN_IDX.every((i) => p.bosses[i])) award(p, 'rainbow');
      sfx.win(); confetti(['🌈', '⭐', '✨', ...w.deco], 60);
      const unlockedNow = first && nextMain !== undefined;
      html = `<h2>VICTORY! 🏆</h2><div class="intro-emoji">${w.boss.emoji}💫</div><p>${w.boss.win}</p>
        ${w.bonus ? '' : rainbowBar(p)}
        <p class="score">💎 +${S.gemsEarned + (first ? 50 : 15)}</p>
        ${unlockedNow ? `<p><b>New world unlocked: ${WORLDS[nextMain].emoji} ${WORLDS[nextMain].name}!</b></p>` : ''}
        <div class="menu-row">${unlockedNow ? `<button class="btn primary" data-act="world" data-arg="${nextMain}">Go to ${WORLDS[nextMain].name} ➜</button>` : ''}<button class="btn" data-act="map">🗺️ Map</button></div>`;
    } else {
      sfx.bad();
      html = `<h2>The boss wins this time…</h2><div class="intro-emoji">${w.boss.emoji}</div><p>${w.boss.lose}</p>
        <p class="note">You hit the boss ${BOSS_HP - S.hp} out of ${BOSS_HP} times. Practicing missions makes you stronger!</p>
        <div class="menu-row"><button class="btn danger" data-act="boss" data-arg="${S.wi}">🔁 Rematch</button><button class="btn" data-act="world" data-arg="${S.wi}">🗺️ World</button></div>`;
    }
    save();
    show(`${topbar(p, 'world:' + S.wi)}<div class="card results">${html}</div>`, w.theme);
  }

  // ---------------- DAILY ----------------
  function dailyBoardHTML(highlightId) {
    const today = dateKey();
    const rows = store.profiles.filter((p) => p.daily.log[today]).map((p) => ({ p, r: p.daily.log[today] }))
      .sort((a, b) => b.r.correct - a.r.correct || a.r.ms - b.r.ms);
    const medals = ['🥇', '🥈', '🥉'];
    if (!rows.length) return '<p class="center">Nobody has played today yet. Be the first! 🏁</p>';
    const waiting = store.profiles.filter((p) => !p.daily.log[today]);
    return `<table class="board">${rows.map((x, i) => `<tr class="${x.p.id === highlightId ? 'me' : ''}"><td class="rank">${medals[i] || i + 1}</td><td>${x.p.avatar} <b>${esc(x.p.name)}</b> <small>Gr ${x.p.grade}</small></td><td>${x.r.correct}/${DAILY_COUNT}</td><td>⏱ ${mmss(x.r.ms)}</td><td>${x.p.daily.streak > 1 ? `🔥${x.p.daily.streak}` : ''}</td></tr>`).join('')}</table>
      ${waiting.length ? `<p class="note center">Still to play: ${waiting.map((p) => `${p.avatar} ${esc(p.name)}`).join(', ')}</p>` : ''}
      <p class="note center">Ranked by correct answers, then by time. Each player gets questions for their own grade.</p>`;
  }
  function renderDailyBoard() {
    screen = 'daily-board';
    show(`<div class="topbar"><button class="btn ghost" data-act="profiles">⬅ Back</button></div>
      <div class="card results"><h2>📅 Today's Daily Challenge</h2>${dailyBoardHTML()}</div>`);
  }
  function renderDailyIntro() {
    screen = 'daily-intro';
    const p = P(), today = p.daily.log[dateKey()];
    show(`${topbar(p, 'map')}
      <div class="card intro">
        <div class="intro-emoji">📅</div>
        <h2>Daily Challenge</h2>
        <p>${DAILY_COUNT} questions for Grade ${p.grade}: 🌱 warm-up, then 🔥 tricky, then ⚡ expert, plus 2 surprise bonus-world questions.</p>
        <ul class="rules">
          <li>Everyone in the same grade gets the <b>same questions</b> today.</li>
          <li>No hints! The clock runs while you answer (it pauses while you read feedback).</li>
          <li>Your <b>first try</b> of the day counts for the family scoreboard and earns 3 💎 per correct answer.</li>
          <li>Play every day to grow your 🔥 streak.${p.daily.streak ? ` Current streak: <b>${p.daily.streak}</b>` : ''}</li>
        </ul>
        ${today ? `<p class="score">Today: ${today.correct}/${DAILY_COUNT} in ${mmss(today.ms)} ✅</p>` : ''}
        <button class="btn big primary" data-act="start-daily">${today ? '🔁 Practice again (score won\'t change)' : 'Start today\'s challenge! 🚀'}</button>
        <h3>Family scoreboard</h3>${dailyBoardHTML(p.id)}
      </div>`, 'theme-home');
  }
  function finishDaily() {
    const p = P(), today = dateKey(), ms = S.elapsed;
    let html = '';
    if (!S.practice && !p.daily.log[today]) {
      p.daily.streak = p.daily.last === yesterdayKey() ? p.daily.streak + 1 : 1;
      p.daily.last = today;
      p.daily.log[today] = { correct: S.correct, ms };
      Object.keys(p.daily.log).sort().slice(0, -30).forEach((k) => delete p.daily.log[k]);
      const streakBonus = Math.min(p.daily.streak, 7) * 2, gems = 3 * S.correct + (S.correct === DAILY_COUNT ? 10 : 0) + streakBonus;
      addGems(p, gems);
      award(p, 'daily1');
      if (S.correct === DAILY_COUNT) award(p, 'daily10');
      if (p.daily.streak >= 3) award(p, 'dstreak3');
      if (p.daily.streak >= 7) award(p, 'dstreak7');
      html = `<p class="score">💎 +${gems} <small>(includes 🔥 streak bonus +${streakBonus})</small></p><p class="streak">🔥 ${p.daily.streak}-day streak!</p>`;
    } else html = '<p class="note">Practice round. Your scoreboard result stays the same.</p>';
    save();
    screen = 'results';
    sfx.win(); confetti(['📅', '⭐', '🌈']);
    show(`${topbar(p, 'map')}
      <div class="card results">
        <h2>Daily Challenge complete!</h2>
        <p class="score">${S.correct} / ${DAILY_COUNT} correct · ⏱ ${mmss(ms)}</p>
        ${html}
        <h3>Family scoreboard</h3>${dailyBoardHTML(p.id)}
        <p class="note">Come back tomorrow for new questions!</p>
        <div class="menu-row"><button class="btn primary" data-act="map">🗺️ Map</button><button class="btn" data-act="profiles">👥 Switch player</button></div>
      </div>`);
  }

  // ---------------- RACE ----------------
  const GUESTS = [{ id: 'guest0', name: 'Guest', avatar: '🙂' }, { id: 'guest1', name: 'Guest 2', avatar: '😎' }];
  let raceDraft = null;
  function defaultRaceDraft() {
    const ps = store.profiles;
    const a = P() || ps[0], b = ps.find((x) => a && x.id !== a.id);
    const side = (pr, gi) => (pr ? { pid: pr.id, wi: gradeWorld(pr.grade) } : { pid: GUESTS[gi].id, wi: MAIN_IDX[0] });
    return { sides: [side(a, 0), side(b, 1)], target: 10 };
  }
  function racerInfo(side, i) {
    const pr = byId(side.pid);
    return pr ? { name: pr.name, avatar: pr.avatar, profile: pr } : { name: GUESTS[i].name, avatar: GUESTS[i].avatar, profile: null };
  }
  function renderRaceSetup() {
    screen = 'race-setup';
    raceDraft = raceDraft || defaultRaceDraft();
    const sideHTML = (i) => {
      const s = raceDraft.sides[i], other = raceDraft.sides[1 - i];
      const opts = [...store.profiles.map((p) => ({ id: p.id, label: `${p.avatar} ${esc(p.name)}` })), { id: GUESTS[i].id, label: `${GUESTS[i].avatar} ${GUESTS[i].name}` }];
      return `<div class="side"><h3>${i === 0 ? '🩷 Player 1 (left)' : '💙 Player 2 (right)'}</h3>
        <div class="grade-pick">${opts.map((o) => `<button class="chip ${s.pid === o.id ? 'sel' : ''}" data-act="race-pick" data-arg="${i}|${o.id}" ${other.pid === o.id ? 'disabled' : ''}>${o.label}</button>`).join('')}</div>
        <div class="label">Questions from</div>
        <div class="grade-pick">${MAIN_IDX.map((wi) => `<button class="chip ${s.wi === wi ? 'sel' : ''}" data-act="race-world" data-arg="${i}|${wi}">Grade ${WORLDS[wi].grade}<small>${WORLDS[wi].emoji} ${WORLDS[wi].name}</small></button>`).join('')}</div></div>`;
    };
    const ids = raceDraft.sides.map((s) => s.pid), h = h2hRecord(ids[0], ids[1]);
    show(`<div class="topbar"><button class="btn ghost" data-act="${P() ? 'map' : 'profiles'}">⬅ Back</button></div>
      <div class="card form race-setup">
        <h2>🏁 Race Mode</h2>
        <p class="note">Two players share one screen. Each player answers questions from their own grade, so it's fair! A wrong answer freezes you for 3 seconds ❄️ and shows the right answer.</p>
        ${sideHTML(0)}${sideHTML(1)}
        <div class="label">Race to</div>
        <div class="grade-pick">${[5, 10, 15].map((n) => `<button class="chip ${raceDraft.target === n ? 'sel' : ''}" data-act="race-target" data-arg="${n}">${n} correct</button>`).join('')}</div>
        ${h ? `<p class="h2h">Head-to-head: ${h}</p>` : ''}
        <button class="btn big primary" data-act="race-start">Ready, set, GO! 🏁</button>
      </div>`);
  }
  function h2hKey(a, b) { return [a, b].sort().join('|'); }
  function h2hRecord(a, b) {
    if (a.startsWith('guest') || b.startsWith('guest')) return '';
    const r = store.h2h[h2hKey(a, b)];
    if (!r) return '';
    const pa = byId(a), pb = byId(b);
    return `${pa.avatar} ${esc(pa.name)} <b>${r[a] || 0}</b> – <b>${r[b] || 0}</b> ${esc(pb.name)} ${pb.avatar}`;
  }
  function raceTopics(wi) { return WORLDS[wi].missions.map((m) => m.topic).filter((t) => !t.endsWith('_word')); }

  function startRace() {
    const d = raceDraft;
    RC = {
      target: d.target, over: false, started: Date.now(),
      pl: d.sides.map((s, i) => Object.assign(racerInfo(s, i), { pid: s.pid, wi: s.wi, grade: WORLDS[s.wi].grade, lvl: 1, run: 0, miss: 0, score: 0, input: '', q: null, frozenUntil: 0, seen: new Set(), last: null, msg: '' })),
    };
    screen = 'race';
    show(`<div class="topbar"><button class="btn ghost" data-act="race-quit">✖ Quit</button><b class="on-bg">🏁 Race to ${RC.target}!</b><span></span></div>
      <div class="track">${RC.pl.map((pl, i) => `<div class="lane"><span class="lscore" id="ls${i}">0</span><span class="runner" id="run${i}" style="left:6%">${pl.avatar}</span><span class="finish">🏁</span></div>`).join('')}</div>
      <div class="race-panels"><div class="rpanel p0" id="rp0"></div><div class="rpanel p1" id="rp1"></div></div>`, 'theme-home', 'race-screen');
    RC.pl.forEach((_, i) => newRaceQ(i));
    raceId = setInterval(raceTick, 150);
  }
  function newRaceQ(i) {
    const pl = RC.pl[i], topics = raceTopics(pl.wi).filter((t) => t !== pl.last), t = pick(topics);
    pl.last = t; pl.q = Q.generate(t, pl.lvl, pl.seen, pl.grade); pl.input = ''; pl.msg = ''; pl.frozenUntil = 0;
    renderRacePanel(i);
  }
  function renderRacePanel(i) {
    const pl = RC.pl[i], el = document.getElementById('rp' + i);
    if (!el) return;
    const a = pl.q.a;
    let controls;
    if (a.kind === 'choice') controls = `<div class="rchoices">${a.choices.map((c, ci) => `<button data-rc="${i}|${ci}">${c}</button>`).join('')}</div>`;
    else {
      const keys = ['7', '8', '9', '⌫', '4', '5', '6', '−', '1', '2', '3', '/', '0', '.', 'space', '✓'];
      controls = `<div class="rans" id="ra${i}">${showInput(pl.input) || '<span class="ph">answer</span>'}</div><div class="rkeys">${keys.map((k) => `<button data-rk="${i}|${k}" class="${k === '✓' ? 'go' : ''}">${k === 'space' ? '␣' : k}</button>`).join('')}</div>`;
    }
    const frozen = pl.frozenUntil > Date.now();
    el.innerHTML = `<div class="rhead"><span>${pl.avatar} ${esc(pl.name)}</span><span class="lvl-tag l${pl.lvl}">${LEVELS[pl.lvl].icon} Gr ${pl.grade}</span><span>${pl.score}/${RC.target}</span></div>
      <div class="rq">${pl.q.q}</div>${pl.msg ? `<div class="msg">${pl.msg}</div>` : ''}${controls}
      ${frozen ? `<div class="frozen"><div class="ice">🧊</div><b>Frozen!</b><div>The answer was: <b>${Q.answerHTML(a)}</b></div><div id="fz${i}"></div></div>` : ''}`;
  }
  function raceTick() {
    if (!RC || RC.over) return;
    const now = Date.now();
    RC.pl.forEach((pl, i) => {
      if (pl.frozenUntil && now >= pl.frozenUntil) newRaceQ(i);
      else if (pl.frozenUntil) { const f = document.getElementById('fz' + i); if (f) f.textContent = Math.ceil((pl.frozenUntil - now) / 1000) + '…'; }
    });
  }
  function raceInput(i, k) {
    if (!RC || RC.over) return;
    const pl = RC.pl[i];
    if (pl.frozenUntil > Date.now()) return;
    if (k === '✓') return raceSubmit(i, pl.input);
    pl.input = editInput(pl.input, k);
    if (pl.msg) { pl.msg = ''; renderRacePanel(i); return; }
    const d = document.getElementById('ra' + i); if (d) d.innerHTML = showInput(pl.input) || '<span class="ph">answer</span>';
  }
  function raceSubmit(i, value) {
    const pl = RC.pl[i];
    if (pl.frozenUntil > Date.now()) return;
    if (pl.q.a.kind !== 'choice' && !String(value).trim()) return;
    const res = Q.check(pl.q.a, value);
    if (res.retry) { pl.msg = res.msg; renderRacePanel(i); return; }
    if (res.ok) {
      pl.score++; pl.run++; pl.miss = 0;
      if (pl.run >= 3 && pl.lvl < 3) { pl.lvl++; pl.run = 0; }
      sfx.good();
      const r = document.getElementById('run' + i); if (r) r.style.left = 6 + (pl.score / RC.target) * 84 + '%';
      const s = document.getElementById('ls' + i); if (s) s.textContent = pl.score;
      if (pl.score >= RC.target) return raceWin(i);
      newRaceQ(i);
    } else {
      pl.run = 0; pl.miss++;
      if (pl.miss >= 2 && pl.lvl > 1) { pl.lvl--; pl.miss = 0; }
      pl.frozenUntil = Date.now() + FREEZE_MS;
      sfx.freeze();
      renderRacePanel(i);
    }
  }
  function raceWin(i) {
    RC.over = true;
    if (raceId) { clearInterval(raceId); raceId = null; }
    const win = RC.pl[i], lose = RC.pl[1 - i];
    [win, lose].forEach((pl) => { if (pl.profile) pl.profile.races.played++; });
    if (win.profile) { win.profile.races.wins++; addGems(win.profile, 15); award(win.profile, 'race1'); if (win.profile.races.wins >= 10) award(win.profile, 'race10'); }
    if (lose.profile) addGems(lose.profile, 5);
    if (win.profile && lose.profile) { const k = h2hKey(win.pid, lose.pid); store.h2h[k] = store.h2h[k] || {}; store.h2h[k][win.pid] = (store.h2h[k][win.pid] || 0) + 1; }
    save();
    sfx.win(); confetti([win.avatar, '🏁', '⭐', '🌈'], 60);
    const h = h2hRecord(RC.pl[0].pid, RC.pl[1].pid);
    const ov = document.createElement('div');
    ov.className = 'race-over';
    ov.innerHTML = `<div class="card"><div class="intro-emoji">${win.avatar}🏆</div><h2>${esc(win.name)} wins!</h2>
      <p class="score">${win.score} – ${lose.score} · ⏱ ${mmss(Date.now() - RC.started)}</p>
      <p>${win.profile ? `${esc(win.name)} +15 💎` : ''}${lose.profile ? ` · ${esc(lose.name)} +5 💎 for a great race` : ''}</p>
      ${h ? `<p class="h2h">Head-to-head: ${h}</p>` : ''}
      <div class="menu-row"><button class="btn primary" data-act="race-start">🔁 Rematch</button><button class="btn" data-act="race-setup">⚙️ Change setup</button><button class="btn ghost" data-act="${P() ? 'map' : 'profiles'}">🏠 Done</button></div></div>`;
    app.querySelector('.screen').appendChild(ov);
  }

  // ---------------- TREASURES / SHOP / BADGES ----------------
  function renderTreasures() {
    screen = 'treasures';
    const p = P();
    const rows = WORLDS.map((w, wi) => `<div class="card treasure-row">
      <h3>${w.emoji} ${w.name}${w.bonus ? ' <small>(bonus)</small>' : ''}</h3>
      <div class="treasures">${w.missions.map((m, mi) => { const st = starsOf(p, wi, mi); return `<div class="treasure ${st ? '' : 'missing'}"><span>${st ? m.treasure : '❔'}</span><small>${st ? m.treasureName : '???'}</small><small class="stars">${starStr(st)}</small></div>`; }).join('')}
        <div class="treasure ${p.bosses[wi] ? '' : 'missing'}"><span>${p.bosses[wi] ? (w.bonus ? w.boss.emoji : '🌈') : '❔'}</span><small>${p.bosses[wi] ? (w.bonus ? 'Boss friend' : 'Rainbow color') : 'Boss prize'}</small></div></div>
    </div>`).join('');
    show(`${topbar(p, 'map')}<h1 class="title sm">🎁 Treasure Room</h1>${rainbowBar(p)}${rows}`);
  }
  function renderShop() {
    screen = 'shop';
    const p = P();
    show(`${topbar(p, 'map')}<h1 class="title sm">🛍️ Avatar Shop</h1>
      <p class="card center">Earn 💎 from missions (harder levels earn more), daily challenges and races. Tap an avatar you own to wear it.</p>
      <div class="grid shop">${AVATARS.map((a) => {
        const own = p.owned.includes(a.e), wearing = p.avatar === a.e;
        return `<button class="card shop-item ${wearing ? 'sel' : ''}" data-act="buy" data-arg="${a.e}"><span class="avatar">${a.e}</span><span>${wearing ? 'Wearing' : own ? 'Wear' : `💎 ${a.cost}`}</span></button>`;
      }).join('')}</div>`);
  }
  function renderBadges() {
    screen = 'badges';
    const p = P(), s = p.stats;
    show(`${topbar(p, 'map')}<h1 class="title sm">🏅 Badges</h1>
      <div class="card stats">✅ ${s.correct} correct of ${s.answered} · 🔥 best streak ${s.bestStreak} · 💎 ${p.lifetimeGems} earned · 🏁 ${p.races.wins}/${p.races.played} races won · 📅 ${p.daily.streak}-day streak</div>
      <div class="grid badges">${BADGES.map((b) => { const has = p.badges.includes(b.id); return `<div class="card badge ${has ? '' : 'missing'}"><span class="avatar">${has ? b.e : '🔒'}</span><b>${b.name}</b><small>${b.desc}</small></div>`; }).join('')}</div>`);
  }

  // ---------------- GROWN-UPS ----------------
  function renderSettings() {
    screen = 'settings';
    const st = store.settings;
    const prof = store.profiles.map((p) => `<div class="prow"><span>${p.avatar} <b>${esc(p.name)}</b> · ${p.stats.correct}/${p.stats.answered} correct (${p.stats.answered ? Math.round((100 * p.stats.correct) / p.stats.answered) : 0}%) · 📅 ${Object.keys(p.daily.log).length} daily · 🏁 ${p.races.wins}/${p.races.played}</span>
      <span class="prow-btns"><span class="grade-pick">${[4, 5, 6, 7, 8].map((g) => `<button class="btn sm ${p.grade === g ? 'primary' : ''}" data-act="set-grade" data-arg="${p.id}|${g}">Gr ${g}</button>`).join('')}</span>
      <button class="btn sm" data-act="unlock-all" data-arg="${p.id}">Unlock all worlds</button><button class="btn sm danger" data-act="delete-profile" data-arg="${p.id}">Delete</button></span></div>`).join('') || '<p>No players yet.</p>';
    const curriculum = WORLDS.map((w) => `<li><b>${w.emoji} ${w.bonus ? 'Bonus' : 'Grade ' + w.grade} — ${w.name}:</b> ${w.missions.map((m) => m.skill).join('; ')}.</li>`).join('');
    show(`<div class="topbar"><button class="btn ghost" data-act="profiles">⬅ Back</button></div>
      <div class="card form">
        <h2>⚙️ For Grown-ups</h2>
        <div class="label">Sound</div>
        <div class="grade-pick"><button class="chip ${st.sound ? 'sel' : ''}" data-act="set-sound" data-arg="on">🔊 On</button><button class="chip ${!st.sound ? 'sel' : ''}" data-act="set-sound" data-arg="off">🔇 Off</button></div>
        <div class="label">Timers (bosses & speed missions)</div>
        <div class="grade-pick">${[['normal', '⏱️ Normal'], ['relaxed', '🐢 Relaxed (2× time)'], ['off', '🚫 Off']].map(([k, v]) => `<button class="chip ${st.timer === k ? 'sel' : ''}" data-act="set-timer" data-arg="${k}">${v}</button>`).join('')}</div>
        <div class="label">Players (tap a grade to change it; bonus worlds and the daily challenge follow it)</div>${prof}
        <div class="label">How it works</div>
        <ul class="rules">
          <li>Each main world matches a grade (based on Common Core topics), with missions and a boss. Bonus worlds are always open and adapt to the player's grade.</li>
          <li>Missions adapt: 3 correct in a row raises the level (🌱 → 🔥 → ⚡), and 2 misses in a row lowers it. The level is saved per skill.</li>
          <li>Missions have 10 questions. 3 stars require 8/10 correct <i>and</i> reaching Expert, so kids have to push themselves.</li>
          <li><b>Daily Challenge:</b> 12 questions per day at the player's grade, the same for everyone in that grade. The first try counts on the family scoreboard (ranked by correct answers, then time). There are no hints, and streaks earn bonus gems.</li>
          <li><b>Race Mode:</b> two players on one screen, each answering at their own grade. A wrong answer freezes the player for 3 seconds and shows the right answer. A head-to-head record is kept.</li>
          <li>Progress is saved in this browser on this device.</li>
        </ul>
        <div class="label">What's covered</div><ul class="rules">${curriculum}</ul>
      </div>`);
  }

  // ---------------- events ----------------
  function route(act, arg) {
    const p = P();
    switch (act) {
      case 'profiles': store.current = null; save(); return renderProfiles();
      case 'choose': store.current = arg; save(); return renderMap();
      case 'new-profile': draft = { name: '', avatar: '🦄', grade: 4 }; return renderNewProfile();
      case 'draft-avatar': draft.avatar = arg; return renderNewProfile();
      case 'draft-grade': draft.grade = +arg; return renderNewProfile();
      case 'create-profile': {
        const name = (draft.name || '').trim();
        if (!name) { toast('Type your name first! ✏️'); const i = document.getElementById('pname'); if (i) i.focus(); return; }
        const np = newProfile(name, draft.avatar, draft.grade);
        store.profiles.push(np); store.current = np.id; raceDraft = null; save();
        sfx.win(); confetti(['🌈', '⭐', '✨']);
        return renderMap();
      }
      case 'map': return p ? renderMap() : renderProfiles();
      case 'world': return renderWorld(+arg);
      case 'locked-world': return toast('🔒 Beat the boss of the world before to unlock this one!');
      case 'locked-mission': return toast('🔒 Earn a star on the mission before this one first!');
      case 'locked-boss': return toast('🔒 Earn at least 1 star on every mission to face the boss!');
      case 'mission': { const [wi, mi] = arg.split(',').map(Number); return renderMissionIntro(wi, mi); }
      case 'start-mission': { const [wi, mi] = arg.split(',').map(Number); return startMission(wi, mi); }
      case 'boss': return startBoss(+arg);
      case 'begin-boss': return nextQuestion();
      case 'daily': return renderDailyIntro();
      case 'daily-board': return renderDailyBoard();
      case 'start-daily': return startDaily();
      case 'key': return pressKey(arg);
      case 'choose-answer': return submit(+arg);
      case 'hint': return useHint();
      case 'next': return nextQuestion();
      case 'quit': {
        const what = S.mode === 'boss' ? 'battle' : S.mode === 'daily' ? 'daily challenge (you can start it again from the beginning)' : 'mission';
        if (confirm(`Leave now? Progress in this ${what} will be lost (gems you earned are kept).`)) { const wi = S.wi, mode = S.mode; S = null; stopAll(); if (mode === 'daily') renderDailyIntro(); else renderWorld(wi); }
        return;
      }
      case 'race-setup': return renderRaceSetup();
      case 'race-pick': { const [i, id] = arg.split('|'); raceDraft.sides[+i].pid = id; const pr = byId(id); if (pr) raceDraft.sides[+i].wi = gradeWorld(pr.grade); return renderRaceSetup(); }
      case 'race-world': { const [i, wi] = arg.split('|'); raceDraft.sides[+i].wi = +wi; return renderRaceSetup(); }
      case 'race-target': raceDraft.target = +arg; return renderRaceSetup();
      case 'race-start': if (!raceDraft) raceDraft = defaultRaceDraft(); return startRace();
      case 'race-quit': if (confirm('Stop the race?')) { RC = null; stopAll(); renderRaceSetup(); } return;
      case 'treasures': return renderTreasures();
      case 'shop': return renderShop();
      case 'badges': return renderBadges();
      case 'buy': {
        const a = AVATARS.find((x) => x.e === arg);
        if (p.owned.includes(arg)) { p.avatar = arg; save(); return renderShop(); }
        if (p.gems < a.cost) return toast(`You need ${a.cost - p.gems} more 💎`);
        p.gems -= a.cost; p.owned.push(arg); p.avatar = arg; save(); sfx.win(); confetti([arg]);
        return renderShop();
      }
      case 'settings': return renderSettings();
      case 'set-sound': store.settings.sound = arg === 'on'; save(); return renderSettings();
      case 'set-timer': store.settings.timer = arg; save(); return renderSettings();
      case 'set-grade': { const [id, g] = arg.split('|'); const t = byId(id); if (t) { t.grade = +g; t.worldUnlocked = Math.max(t.worldUnlocked, gradeWorld(+g)); save(); raceDraft = null; } return renderSettings(); }
      case 'unlock-all': { const t = byId(arg); if (t) { t.worldUnlocked = LAST_MAIN; save(); toast(`All worlds unlocked for ${esc(t.name)}`); } return renderSettings(); }
      case 'delete-profile': {
        const t = byId(arg);
        if (t && confirm(`Delete ${t.name}'s progress forever?`)) { store.profiles = store.profiles.filter((x) => x.id !== arg); if (store.current === arg) store.current = null; raceDraft = null; save(); }
        return renderSettings();
      }
      default:
        if (act.startsWith('world:')) return renderWorld(+act.split(':')[1]);
    }
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const act = el.getAttribute('data-act');
    if (act !== 'key') sfx.click();
    route(act, el.getAttribute('data-arg'));
  });

  // Race buttons use pointerdown so two kids can tap at the same time.
  document.addEventListener('pointerdown', (e) => {
    const k = e.target.closest('[data-rk]'), c = e.target.closest('[data-rc]');
    if (!k && !c) return;
    e.preventDefault();
    if (k) { const [i, key] = k.getAttribute('data-rk').split('|'); raceInput(+i, key); }
    else { const [i, ci] = c.getAttribute('data-rc').split('|').map(Number); raceSubmit(i, ci); }
  });

  document.addEventListener('keydown', (e) => {
    if (screen === 'new-profile' && e.key === 'Enter') { route('create-profile'); return; }
    if (screen !== 'play' || !S || e.metaKey || e.ctrlKey || e.altKey) return;
    if (S.answered) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextQuestion(); } return; }
    if (S.q.a.kind === 'choice') {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= S.q.a.choices.length) { e.preventDefault(); submit(n - 1); }
      return;
    }
    if (/^[0-9.,/]$/.test(e.key)) { e.preventDefault(); pressKey(e.key); }
    else if (e.key === '-' || e.key === '−') { e.preventDefault(); pressKey('−'); }
    else if (e.key === ' ') { e.preventDefault(); pressKey('space'); }
    else if (e.key === 'Backspace') { e.preventDefault(); pressKey('⌫'); }
    else if (e.key === 'Enter') { e.preventDefault(); pressKey('✓'); }
    else if (e.key.toLowerCase() === 'h') { useHint(); }
  });

  // used by automated play-tests to read the current question
  MQ._debug = { session: () => S, race: () => RC, store: () => store, withCommas };

  // start
  if (P()) renderMap(); else renderProfiles();
})();
