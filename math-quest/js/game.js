/* Math Quest: Rainbow Realms — game engine & screens. */
(function () {
  'use strict';
  const MQ = window.MQ, Q = MQ.Q, WORLDS = MQ.WORLDS;
  const app = document.getElementById('app');

  const SAVE_KEY = 'mathquest.v1';
  const Q_PER_MISSION = 8, BOSS_HP = 10, HEARTS = 3, HINT_COST = 2, START_GEMS = 10;
  const LEVELS = { 1: { name: 'Warm-up', icon: '🌱' }, 2: { name: 'Tricky', icon: '🔥' }, 3: { name: 'Expert', icon: '⚡' } };
  const RAINBOW = ['#ff3b3b', '#ff8c1a', '#ffd400', '#2ecc40', '#1e90ff', '#4b3bff', '#a64dff'];
  const AVATARS = [
    { e: '🦄', cost: 0 }, { e: '👸', cost: 0 }, { e: '🐠', cost: 0 }, { e: '🥋', cost: 0 }, { e: '🧜‍♀️', cost: 0 }, { e: '🐱', cost: 0 },
    { e: '🐬', cost: 40 }, { e: '🦋', cost: 40 }, { e: '🐢', cost: 50 }, { e: '🐼', cost: 50 }, { e: '🦊', cost: 75 }, { e: '🐙', cost: 75 },
    { e: '🦁', cost: 100 }, { e: '🧚', cost: 120 }, { e: '🦸‍♀️', cost: 150 }, { e: '🥷', cost: 180 }, { e: '🦖', cost: 220 }, { e: '🐲', cost: 300 },
    { e: '🌈', cost: 400 }, { e: '👑', cost: 500 },
  ];
  const BADGES = [
    { id: 'first', e: '🎉', name: 'First Splash', desc: 'Finish your first mission' },
    { id: 'perfect', e: '💯', name: 'Flawless', desc: 'Get 8 out of 8 in a mission' },
    { id: 'streak10', e: '🔥', name: 'On Fire', desc: 'Answer 10 in a row correctly' },
    { id: 'streak25', e: '☄️', name: 'Unstoppable', desc: 'Answer 25 in a row correctly' },
    { id: 'nohint3', e: '🧠', name: 'Big Brain', desc: 'Earn 3 stars without using a hint' },
    { id: 'expert5', e: '⚡', name: 'Expert Mode', desc: 'Reach Expert level in 5 different skills' },
    { id: 'boss', e: '⚔️', name: 'Boss Buster', desc: 'Defeat a boss' },
    { id: 'flawlessboss', e: '🛡️', name: 'Untouchable', desc: 'Defeat a boss without losing a heart' },
    { id: 'world3', e: '🏅', name: 'World Master', desc: 'Get 3 stars on every mission in a world' },
    { id: 'gems200', e: '💎', name: 'Treasure Hunter', desc: 'Earn 200 gems in total' },
    { id: 'rainbow', e: '🌈', name: 'Rainbow Restored', desc: 'Defeat all five bosses' },
  ];

  // ---------------- storage ----------------
  function load() {
    try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && Array.isArray(s.profiles)) return s; } catch (e) { /* ignore */ }
    return { profiles: [], settings: { sound: true, timer: 'normal' }, current: null };
  }
  const store = load();
  store.settings = Object.assign({ sound: true, timer: 'normal' }, store.settings);
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(store)); } catch (e) { /* storage unavailable: play continues unsaved */ } }
  const P = () => store.profiles.find((p) => p.id === store.current);

  function newProfile(name, avatar, grade) {
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name, avatar, grade, worldUnlocked: Math.max(0, Math.min(4, grade - 4)),
      gems: START_GEMS, lifetimeGems: 0, missions: {}, bosses: {}, levels: {},
      owned: AVATARS.filter((a) => a.cost === 0).map((a) => a.e), badges: [],
      stats: { answered: 0, correct: 0, streak: 0, bestStreak: 0 },
    };
  }

  // ---------------- helpers ----------------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const mkey = (wi, mi) => `w${wi}m${mi}`;
  const starsOf = (p, wi, mi) => (p.missions[mkey(wi, mi)] || {}).stars || 0;
  const worldStars = (p, wi) => WORLDS[wi].missions.reduce((s, _, mi) => s + starsOf(p, wi, mi), 0);
  const missionUnlocked = (p, wi, mi) => wi <= p.worldUnlocked && (mi === 0 || starsOf(p, wi, mi - 1) > 0);
  const bossUnlocked = (p, wi) => wi <= p.worldUnlocked && WORLDS[wi].missions.every((_, mi) => starsOf(p, wi, mi) > 0);
  const colorsRestored = (p) => { const c = new Set(); WORLDS.forEach((w, wi) => { if (p.bosses[wi]) w.colors.forEach((x) => c.add(x)); }); return c; };
  const starStr = (n, max = 3) => '★'.repeat(n) + '☆'.repeat(max - n);

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

  // ---------------- badges ----------------
  function award(p, id) {
    if (p.badges.includes(id)) return;
    p.badges.push(id);
    const b = BADGES.find((x) => x.id === id);
    if (b) setTimeout(() => toast(`<b>${b.e} Badge earned!</b><br>${b.name}`), 600);
  }
  function addGems(p, n) { p.gems += n; p.lifetimeGems += n; if (p.lifetimeGems >= 200) award(p, 'gems200'); }

  // ---------------- screen state ----------------
  let screen = 'profiles', S = null, timerId = null;
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
  function show(html, theme) {
    stopTimer();
    app.innerHTML = `<div class="screen ${theme || 'theme-home'}">${deco(theme || 'theme-home')}<div class="wrap">${html}</div></div>`;
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
        <span class="pmeta">Grade ${p.grade} · 💎 ${p.gems} · ⚔️ ${Object.keys(p.bosses).length}/5</span>
      </button>`).join('');
    show(`
      <h1 class="title">🌈 Math Quest<small>Rainbow Realms</small></h1>
      <p class="story card">${MQ.STORY}</p>
      <h2 class="on-bg">Who's playing?</h2>
      <div class="grid profiles">${cards}
        <button class="profile card new" data-act="new-profile"><span class="avatar">➕</span><span class="pname">New Player</span></button>
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
        <div class="grade-pick">${[4, 5, 6, 7, 8].map((g) => `<button class="chip ${draft.grade === g ? 'sel' : ''}" data-act="draft-grade" data-arg="${g}">Grade ${g}<small>${WORLDS[g - 4].emoji} ${WORLDS[g - 4].name}</small></button>`).join('')}</div>
        <p class="note">Your grade's world and every world before it are unlocked. Higher worlds unlock when you beat each boss.</p>
        <button class="btn big primary" data-act="create-profile">Start my quest! ✨</button>
      </div>`);
    const inp = document.getElementById('pname');
    inp.addEventListener('input', () => { draft.name = inp.value; });
    if (!draft.name) inp.focus();
  }

  // ---------------- MAP ----------------
  function renderMap() {
    screen = 'map';
    const p = P();
    const worlds = WORLDS.map((w, wi) => {
      const locked = wi > p.worldUnlocked;
      return `<button class="world card ${w.theme} ${locked ? 'locked' : ''}" data-act="${locked ? 'locked-world' : 'world'}" data-arg="${wi}">
        <span class="wemoji">${locked ? '🔒' : w.emoji}</span>
        <span class="winfo"><span class="wname">${w.name}</span><span class="wgrade">Grade ${w.grade} · ${w.guide.emoji} ${w.guide.name}</span>
        <span class="wstars">${locked ? `Defeat ${WORLDS[wi - 1].boss.name} to unlock` : `★ ${worldStars(p, wi)}/15 &nbsp; ${p.bosses[wi] ? `✅ ${w.boss.emoji} defeated` : `${w.boss.emoji} boss waiting`}`}</span></span>
      </button>`;
    }).join('');
    show(`${topbar(p)}
      <h1 class="title sm">🗺️ The Five Realms</h1>
      ${rainbowBar(p)}
      <div class="menu-row">
        <button class="btn" data-act="treasures">🎁 Treasures</button>
        <button class="btn" data-act="shop">🛍️ Avatar Shop</button>
        <button class="btn" data-act="badges">🏅 Badges</button>
      </div>
      <div class="world-path">${worlds}</div>
      ${colorsRestored(p).size === 7 ? '<p class="card center">🌈 You restored the whole rainbow! Keep going for 3 stars everywhere and every badge!</p>' : ''}`);
  }

  // ---------------- WORLD ----------------
  function renderWorld(wi) {
    screen = 'world';
    const p = P(), w = WORLDS[wi];
    const missions = w.missions.map((m, mi) => {
      const un = missionUnlocked(p, wi, mi), st = starsOf(p, wi, mi), lvl = p.levels[m.topic] || 1;
      return `<button class="mission card ${un ? '' : 'locked'}" data-act="${un ? 'mission' : 'locked-mission'}" data-arg="${wi},${mi}">
        <span class="mnum">${un ? (st ? m.treasure : mi + 1) : '🔒'}</span>
        <span class="minfo"><span class="mname">${m.name}</span><span class="mskill">${m.skill}</span></span>
        <span class="mside"><span class="stars">${starStr(st)}</span><span class="lvl-tag">${LEVELS[lvl].icon} ${LEVELS[lvl].name}</span></span>
      </button>`;
    }).join('');
    const bu = bossUnlocked(p, wi);
    show(`${topbar(p, 'map')}
      <h1 class="title sm">${w.emoji} ${w.name}</h1>
      <div class="guide card"><span class="guide-emoji">${w.guide.emoji}</span><div><b>${w.guide.name}:</b> ${w.intro}</div></div>
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
          <li>${Q_PER_MISSION} questions. Answer 3 in a row and you level up: 🌱 → 🔥 → ⚡</li>
          <li>★ = 5 correct &nbsp; ★★ = 7 correct &nbsp; ★★★ = 7 correct <b>and</b> reach ⚡ Expert</li>
          <li>Stuck? A hint costs ${HINT_COST} 💎</li>
        </ul>
        <p>You'll start at <b>${LEVELS[lvl].icon} ${LEVELS[lvl].name}</b>.</p>
        <button class="btn big primary" data-act="start-mission" data-arg="${wi},${mi}">Let's go! 🚀</button>
      </div>`, w.theme);
  }

  // ---------------- PLAY ----------------
  function startMission(wi, mi) {
    const p = P(), m = WORLDS[wi].missions[mi];
    S = { mode: 'mission', wi, mi, topic: m.topic, lvl: p.levels[m.topic] || 1, idx: 0, correct: 0, results: [], run: 0, miss: 0, reachedHard: false, hints: 0, gemsEarned: 0, seen: new Set() };
    nextQuestion();
  }
  function startBoss(wi) {
    const w = WORLDS[wi];
    S = { mode: 'boss', wi, topics: w.missions.map((m) => m.topic), lvl: 2, hp: BOSS_HP, hearts: HEARTS, run: 0, miss: 0, hints: 0, gemsEarned: 0, seen: new Set(), lastTopic: null, count: 0, lostHeart: false };
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

  function nextQuestion() {
    if (S.mode === 'mission' && S.idx >= Q_PER_MISSION) return finishMission();
    if (S.mode === 'boss' && (S.hp <= 0 || S.hearts <= 0)) return finishBoss();
    let topic = S.topic;
    if (S.mode === 'boss') { const opts = S.topics.filter((t) => t !== S.lastTopic); topic = pick(opts); S.lastTopic = topic; S.count++; }
    S.q = Q.generate(topic, S.lvl, S.seen);
    S.input = ''; S.answered = false; S.hintShown = false; S.msg = ''; S.levelMsg = '';
    renderPlay();
    if (S.mode === 'boss') startTimer();
  }

  function startTimer() {
    stopTimer();
    if (store.settings.timer === 'off') { S.deadline = null; return; }
    const w = WORLDS[S.wi];
    let secs = w.baseTime + (S.q.topic.endsWith('_word') ? 20 : 0);
    if (store.settings.timer === 'relaxed') secs *= 2;
    S.timeTotal = secs; S.deadline = Date.now() + secs * 1000;
    timerId = setInterval(tick, 200);
    tick();
  }
  function tick() {
    if (!S || S.answered || !S.deadline) return stopTimer();
    const left = (S.deadline - Date.now()) / 1000;
    const fill = document.getElementById('timer-fill'), label = document.getElementById('timer-label');
    if (fill) { fill.style.width = Math.max(0, (left / S.timeTotal) * 100) + '%'; fill.classList.toggle('low', left < 10); }
    if (label) label.textContent = Math.max(0, Math.ceil(left)) + 's';
    if (left <= 0) { stopTimer(); record(false, true); }
  }

  function renderPlay() {
    screen = 'play';
    const p = P(), w = WORLDS[S.wi], q = S.q, a = q.a;
    let head;
    if (S.mode === 'mission') {
      const dots = Array.from({ length: Q_PER_MISSION }, (_, i) => `<span class="dot ${S.results[i] === true ? 'ok' : S.results[i] === false ? 'bad' : i === S.idx ? 'now' : ''}"></span>`).join('');
      head = `<div class="progress">${dots}</div>`;
    } else {
      head = `<div class="boss-area">
        <div class="boss-emoji ${S.anim || ''}">${w.boss.emoji}</div>
        <div class="boss-stats">
          <div class="boss-name">${w.boss.name}</div>
          <div class="hp"><div class="hp-fill" style="width:${(S.hp / BOSS_HP) * 100}%"></div></div>
          <div class="hearts">${'❤️'.repeat(S.hearts)}${'🤍'.repeat(HEARTS - S.hearts)}</div>
        </div></div>
        ${S.deadline !== null && store.settings.timer !== 'off' ? `<div class="timer"><div id="timer-fill" class="timer-fill"></div><span id="timer-label"></span></div>` : ''}`;
    }
    const lvl = LEVELS[S.lvl];
    let controls;
    if (S.answered) {
      const ok = S.lastOk;
      controls = `<div class="feedback ${ok ? 'good' : 'bad'}">
        <div class="fb-title">${ok ? `✅ ${pick(w.cheers)} <span class="plus">+${S.lastGems} 💎</span>` : S.timedOut ? '⏰ Time\'s up!' : '❌ Not quite!'}</div>
        ${ok ? '' : `<div class="fb-answer">Answer: <b>${Q.answerHTML(a)}</b></div><div class="fb-explain">${q.explain}</div>`}
        ${S.levelMsg ? `<div class="fb-level">${S.levelMsg}</div>` : ''}
        <button class="btn big primary" data-act="next" id="next-btn">Next ➜</button>
      </div>`;
    } else if (a.kind === 'choice') {
      controls = `<div class="choices">${a.choices.map((c, i) => `<button class="btn choice" data-act="choose-answer" data-arg="${i}"><span class="key">${i + 1}</span>${c}</button>`).join('')}</div>`;
    } else {
      const keys = ['7', '8', '9', '⌫', '4', '5', '6', '−', '1', '2', '3', '/', '0', '.', 'space', '✓'];
      controls = `<div class="answer-box"><span id="answer-display">${esc(S.input) || '<span class="ph">type your answer</span>'}</span></div>
        <div class="keypad">${keys.map((k) => `<button class="key-btn ${k === '✓' ? 'go' : ''} ${k === 'space' ? 'small' : ''}" data-act="key" data-arg="${k}">${k === 'space' ? 'space<small>2 1/3</small>' : k}</button>`).join('')}</div>`;
    }
    const canHint = !S.hintShown && !S.answered;
    app.innerHTML = `<div class="screen ${w.theme} play">${deco(w.theme)}<div class="wrap">
      <div class="topbar">
        <button class="btn ghost" data-act="quit">✖ Quit</button>
        ${head.startsWith('<div class="progress"') ? head : '<span></span>'}
        <div class="gems">💎 ${p.gems}</div>
      </div>
      ${S.mode === 'boss' ? head : ''}
      <div class="qcard card">
        <div class="qmeta"><span class="lvl-tag l${S.lvl}">${lvl.icon} ${lvl.name}</span>
          <span>${S.mode === 'mission' ? `Question ${Math.min(S.idx + 1, Q_PER_MISSION)} of ${Q_PER_MISSION}` : `Round ${S.count}`}</span></div>
        <div class="qtext">${q.q}</div>
        ${S.hintShown ? `<div class="hint">💡 ${q.hint}</div>` : ''}
        ${S.msg ? `<div class="msg">${S.msg}</div>` : ''}
        ${canHint ? `<button class="btn hint-btn" data-act="hint" ${p.gems < HINT_COST ? 'disabled' : ''}>💡 Hint (${HINT_COST} 💎)</button>` : ''}
      </div>
      <div class="controls">${controls}</div>
    </div></div>`;
    S.anim = '';
    if (S.answered) { const nb = document.getElementById('next-btn'); if (nb) nb.focus(); }
    if (S.mode === 'boss' && !S.answered) tick();
  }

  function updateDisplay() {
    const d = document.getElementById('answer-display');
    if (d) d.innerHTML = esc(S.input) || '<span class="ph">type your answer</span>';
  }

  function pressKey(k) {
    if (!S || S.answered || S.q.a.kind === 'choice') return;
    if (k === '⌫') S.input = S.input.slice(0, -1);
    else if (k === '✓') return submit(S.input);
    else if (k === 'space') { if (S.input && !S.input.endsWith(' ')) S.input += ' '; }
    else if (k === '−' || k === '-') { S.input = S.input.startsWith('-') ? S.input.slice(1) : '-' + S.input; }
    else if (S.input.length < 14) S.input += k;
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
    S.answered = true; S.lastOk = ok; S.timedOut = timedOut;
    p.stats.answered++;
    if (ok) {
      p.stats.correct++; p.stats.streak++;
      p.stats.bestStreak = Math.max(p.stats.bestStreak, p.stats.streak);
      if (p.stats.streak >= 10) award(p, 'streak10');
      if (p.stats.streak >= 25) award(p, 'streak25');
      S.lastGems = S.lvl; S.gemsEarned += S.lvl; addGems(p, S.lvl);
      if (S.lvl === 3) S.reachedHard = true;
      S.run++; S.miss = 0;
      if (S.run >= 3 && S.lvl < 3) { S.lvl++; S.run = 0; S.levelMsg = `Level up! Now: ${LEVELS[S.lvl].icon} ${LEVELS[S.lvl].name}`; setTimeout(sfx.level, 350); }
      sfx.good();
    } else {
      p.stats.streak = 0; S.run = 0; S.miss++;
      if (S.miss >= 2 && S.lvl > 1) { S.lvl--; S.miss = 0; S.levelMsg = `Let's practice at ${LEVELS[S.lvl].icon} ${LEVELS[S.lvl].name} for a bit.`; }
      sfx.bad();
    }
    if (S.mode === 'mission') {
      S.results[S.idx] = ok; if (ok) S.correct++; S.idx++;
      if (ok) confetti(WORLDS[S.wi].deco, 14);
    } else {
      if (ok) { S.hp--; S.anim = 'hit'; setTimeout(sfx.hit, 120); } else { S.hearts--; S.lostHeart = true; S.anim = 'attack'; }
    }
    save();
    renderPlay();
  }

  function useHint() {
    const p = P();
    if (!S || S.hintShown || S.answered || p.gems < HINT_COST) return;
    p.gems -= HINT_COST; S.hints++; S.hintShown = true;
    save();
    const keepInput = S.input;
    renderPlay();
    S.input = keepInput; updateDisplay();
  }

  function finishMission() {
    const p = P(), w = WORLDS[S.wi], m = w.missions[S.mi], key = mkey(S.wi, S.mi);
    const stars = S.correct >= 7 && S.reachedHard ? 3 : S.correct >= 7 ? 2 : S.correct >= 5 ? 1 : 0;
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
    const nextUn = S.mi < 4 && missionUnlocked(p, S.wi, S.mi + 1);
    const tip = stars === 0 ? 'You need 5 correct to earn a star. Use hints if you get stuck — you can do it!' : stars < 3 ? (S.reachedHard ? 'Get 7 correct to earn the third star!' : 'For ★★★, answer 3 in a row to climb to ⚡ Expert and get 7 correct.') : 'Perfect mission! You are a math legend.';
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
          ${S.mi === 4 && bossUnlocked(p, S.wi) && !p.bosses[S.wi] ? `<button class="btn danger" data-act="boss" data-arg="${S.wi}">⚔️ Fight the boss!</button>` : ''}
          <button class="btn ghost" data-act="world" data-arg="${S.wi}">🗺️ World</button>
        </div>
      </div>`, w.theme);
  }

  function finishBoss() {
    const p = P(), w = WORLDS[S.wi], won = S.hp <= 0;
    screen = 'results';
    let html;
    if (won) {
      const first = !p.bosses[S.wi];
      p.bosses[S.wi] = true;
      addGems(p, first ? 50 : 15);
      if (S.wi < 4) p.worldUnlocked = Math.max(p.worldUnlocked, S.wi + 1);
      award(p, 'boss');
      if (!S.lostHeart) award(p, 'flawlessboss');
      if (WORLDS.every((_, i) => p.bosses[i])) award(p, 'rainbow');
      sfx.win(); confetti(['🌈', '⭐', '✨', ...w.deco], 60);
      html = `<h2>VICTORY! 🏆</h2><div class="intro-emoji">${w.boss.emoji}💫</div><p>${w.boss.win}</p>
        ${rainbowBar(p)}
        <p class="score">💎 +${S.gemsEarned + (first ? 50 : 15)}</p>
        ${first && S.wi < 4 ? `<p><b>New world unlocked: ${WORLDS[S.wi + 1].emoji} ${WORLDS[S.wi + 1].name}!</b></p>` : ''}
        <div class="menu-row">${first && S.wi < 4 ? `<button class="btn primary" data-act="world" data-arg="${S.wi + 1}">Go to ${WORLDS[S.wi + 1].name} ➜</button>` : ''}<button class="btn" data-act="map">🗺️ Map</button></div>`;
    } else {
      sfx.bad();
      html = `<h2>The boss wins this time…</h2><div class="intro-emoji">${w.boss.emoji}</div><p>${w.boss.lose}</p>
        <p class="note">You hit the boss ${BOSS_HP - S.hp} out of ${BOSS_HP} times. Practicing missions makes you stronger!</p>
        <div class="menu-row"><button class="btn danger" data-act="boss" data-arg="${S.wi}">🔁 Rematch</button><button class="btn" data-act="world" data-arg="${S.wi}">🗺️ World</button></div>`;
    }
    save();
    show(`${topbar(p, 'world:' + S.wi)}<div class="card results">${html}</div>`, w.theme);
  }

  // ---------------- TREASURES / SHOP / BADGES ----------------
  function renderTreasures() {
    screen = 'treasures';
    const p = P();
    const rows = WORLDS.map((w, wi) => `<div class="card treasure-row">
      <h3>${w.emoji} ${w.name}</h3>
      <div class="treasures">${w.missions.map((m, mi) => { const st = starsOf(p, wi, mi); return `<div class="treasure ${st ? '' : 'missing'}"><span>${st ? m.treasure : '❔'}</span><small>${st ? m.treasureName : '???'}</small><small class="stars">${starStr(st)}</small></div>`; }).join('')}
        <div class="treasure ${p.bosses[wi] ? '' : 'missing'}"><span>${p.bosses[wi] ? '🌈' : '❔'}</span><small>${p.bosses[wi] ? 'Rainbow color' : 'Boss prize'}</small></div></div>
    </div>`).join('');
    show(`${topbar(p, 'map')}<h1 class="title sm">🎁 Treasure Room</h1>${rainbowBar(p)}${rows}`);
  }
  function renderShop() {
    screen = 'shop';
    const p = P();
    show(`${topbar(p, 'map')}<h1 class="title sm">🛍️ Avatar Shop</h1>
      <p class="card center">Earn 💎 by answering questions (harder levels earn more!). Tap an avatar you own to wear it.</p>
      <div class="grid shop">${AVATARS.map((a) => {
        const own = p.owned.includes(a.e), wearing = p.avatar === a.e;
        return `<button class="card shop-item ${wearing ? 'sel' : ''}" data-act="buy" data-arg="${a.e}"><span class="avatar">${a.e}</span><span>${wearing ? 'Wearing' : own ? 'Wear' : `💎 ${a.cost}`}</span></button>`;
      }).join('')}</div>`);
  }
  function renderBadges() {
    screen = 'badges';
    const p = P(), s = p.stats;
    show(`${topbar(p, 'map')}<h1 class="title sm">🏅 Badges</h1>
      <div class="card stats">✅ ${s.correct} correct of ${s.answered} · 🔥 best streak ${s.bestStreak} · 💎 ${p.lifetimeGems} earned</div>
      <div class="grid badges">${BADGES.map((b) => { const has = p.badges.includes(b.id); return `<div class="card badge ${has ? '' : 'missing'}"><span class="avatar">${has ? b.e : '🔒'}</span><b>${b.name}</b><small>${b.desc}</small></div>`; }).join('')}</div>`);
  }

  // ---------------- GROWN-UPS ----------------
  function renderSettings() {
    screen = 'settings';
    const st = store.settings;
    const prof = store.profiles.map((p) => `<div class="prow"><span>${p.avatar} <b>${esc(p.name)}</b> · Grade ${p.grade} · ${p.stats.correct}/${p.stats.answered} correct (${p.stats.answered ? Math.round((100 * p.stats.correct) / p.stats.answered) : 0}%)</span>
      <span class="prow-btns"><button class="btn sm" data-act="unlock-all" data-arg="${p.id}">Unlock all worlds</button><button class="btn sm danger" data-act="delete-profile" data-arg="${p.id}">Delete</button></span></div>`).join('') || '<p>No players yet.</p>';
    const curriculum = WORLDS.map((w) => `<li><b>${w.emoji} Grade ${w.grade} — ${w.name}:</b> ${w.missions.map((m) => m.skill).join('; ')}.</li>`).join('');
    show(`<div class="topbar"><button class="btn ghost" data-act="profiles">⬅ Back</button></div>
      <div class="card form">
        <h2>⚙️ For Grown-ups</h2>
        <div class="label">Sound</div>
        <div class="grade-pick"><button class="chip ${st.sound ? 'sel' : ''}" data-act="set-sound" data-arg="on">🔊 On</button><button class="chip ${!st.sound ? 'sel' : ''}" data-act="set-sound" data-arg="off">🔇 Off</button></div>
        <div class="label">Boss battle timer</div>
        <div class="grade-pick">${[['normal', '⏱️ Normal'], ['relaxed', '🐢 Relaxed (2× time)'], ['off', '🚫 Off']].map(([k, v]) => `<button class="chip ${st.timer === k ? 'sel' : ''}" data-act="set-timer" data-arg="${k}">${v}</button>`).join('')}</div>
        <div class="label">Players</div>${prof}
        <div class="label">How it works</div>
        <ul class="rules">
          <li>Each world matches a grade (based on Common Core topics). Each has 5 missions and a boss.</li>
          <li>Missions adapt: 3 correct in a row raises the level (🌱 → 🔥 → ⚡), and 2 misses in a row lowers it. The level is saved per skill.</li>
          <li>3 stars require 7/8 correct <i>and</i> reaching Expert, so kids have to push themselves.</li>
          <li>Bosses mix all the world's skills, with a timer and 3 hearts.</li>
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
        store.profiles.push(np); store.current = np.id; save();
        sfx.win(); confetti(['🌈', '⭐', '✨']);
        return renderMap();
      }
      case 'map': return renderMap();
      case 'world': return renderWorld(+arg);
      case 'locked-world': return toast('🔒 Beat the boss of the world before to unlock this one!');
      case 'locked-mission': return toast('🔒 Earn a star on the mission before this one first!');
      case 'locked-boss': return toast('🔒 Earn at least 1 star on every mission to face the boss!');
      case 'mission': { const [wi, mi] = arg.split(',').map(Number); return renderMissionIntro(wi, mi); }
      case 'start-mission': { const [wi, mi] = arg.split(',').map(Number); return startMission(wi, mi); }
      case 'boss': return startBoss(+arg);
      case 'begin-boss': return nextQuestion();
      case 'key': return pressKey(arg);
      case 'choose-answer': return submit(+arg);
      case 'hint': return useHint();
      case 'next': return nextQuestion();
      case 'quit':
        if (confirm('Leave now? Progress in this ' + (S.mode === 'boss' ? 'battle' : 'mission') + ' will be lost (gems you earned are kept).')) { stopTimer(); const wi = S.wi; S = null; renderWorld(wi); }
        return;
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
      case 'unlock-all': { const t = store.profiles.find((x) => x.id === arg); if (t) { t.worldUnlocked = 4; save(); toast(`All worlds unlocked for ${esc(t.name)}`); } return renderSettings(); }
      case 'delete-profile': {
        const t = store.profiles.find((x) => x.id === arg);
        if (t && confirm(`Delete ${t.name}'s progress forever?`)) { store.profiles = store.profiles.filter((x) => x.id !== arg); if (store.current === arg) store.current = null; save(); }
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

  document.addEventListener('keydown', (e) => {
    if (screen === 'new-profile' && e.key === 'Enter') { route('create-profile'); return; }
    if (screen !== 'play' || !S || e.metaKey || e.ctrlKey || e.altKey) return;
    if (S.answered) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextQuestion(); } return; }
    if (S.q.a.kind === 'choice') {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= S.q.a.choices.length) { e.preventDefault(); submit(n - 1); }
      return;
    }
    if (/^[0-9./]$/.test(e.key)) { e.preventDefault(); pressKey(e.key); }
    else if (e.key === '-' || e.key === '−') { e.preventDefault(); pressKey('−'); }
    else if (e.key === ' ') { e.preventDefault(); pressKey('space'); }
    else if (e.key === 'Backspace') { e.preventDefault(); pressKey('⌫'); }
    else if (e.key === 'Enter') { e.preventDefault(); pressKey('✓'); }
    else if (e.key.toLowerCase() === 'h') { useHint(); }
  });

  // used by automated play-tests to read the current question
  MQ._debug = { session: () => S, store: () => store };

  // start
  if (P()) renderMap(); else renderProfiles();
})();
