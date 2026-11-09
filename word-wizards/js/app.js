/* Word Wizards — core: players (shared with Math Quest), storage, themes, word editor, My Words, settings. */
(function () {
  'use strict';
  const WW = (window.WW = window.WW || {});
  const WORLDS = (window.MQ && window.MQ.WORLDS) || [];
  const app = document.getElementById('app');
  const MQ_KEY = 'mathquest.v1', WW_KEY = 'wordwizards.v1';
  const FREE_AVATARS = ['🦄', '👸', '🐠', '🥋', '🧜‍♀️', '🐱', '🐶', '🦖', '🚀'];

  // ---------------- storage ----------------
  // Players and gems live in Math Quest's save (same device + same web address), so both apps share them.
  // Spelling words and progress live in Word Wizards' own save.
  const readJSON = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  let saveFailed = false;
  const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); if (saveFailed) { saveFailed = false; banner(); } return true; } catch (e) { saveFailed = true; banner(); return false; } };
  function mathStore() { const s = readJSON(MQ_KEY); return s && Array.isArray(s.profiles) ? s : { profiles: [], settings: {}, current: null }; }
  const players = () => mathStore().profiles;
  const player = (id) => players().find((p) => p.id === id);
  function updateProfile(id, fn) { const s = mathStore(), p = s.profiles.find((x) => x.id === id); if (!p) return null; fn(p); writeJSON(MQ_KEY, s); return p; }
  function createPlayer(name, avatar, grade) {
    const s = mathStore();
    const p = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, avatar, grade, worldUnlocked: Math.max(0, Math.min(4, grade - 4)),
      gems: 10, lifetimeGems: 0, missions: {}, bosses: {}, levels: {}, owned: FREE_AVATARS.slice(), badges: [],
      stats: { answered: 0, correct: 0, streak: 0, bestStreak: 0 }, daily: { streak: 0, last: null, log: {} }, races: { played: 0, wins: 0 }, lessons: {},
    };
    s.profiles.push(p); writeJSON(MQ_KEY, s); return p;
  }

  const ww = readJSON(WW_KEY) || { players: {}, settings: {} };
  ww.players = ww.players || {};
  ww.settings = Object.assign({ rate: 1, voice: '', sound: true, timer: 'normal' }, ww.settings);
  const save = () => writeJSON(WW_KEY, ww);
  WW.settings = () => ww.settings;
  let cur = null; // current player id
  function me() {
    const m = (ww.players[cur] = ww.players[cur] || {});
    m.words = m.words || []; m.prog = m.prog || {}; m.badges = m.badges || []; m.stats = m.stats || { games: {}, best: {} };
    m.stats.games = m.stats.games || {}; m.stats.best = m.stats.best || {};
    return m;
  }
  const key = (w) => String(w).toLowerCase().trim();
  const prog = (w) => (me().prog[key(w.word)] = me().prog[key(w.word)] || { right: 0, wrong: 0, streak: 0 });
  const stars = (w) => Math.min(3, prog(w).streak);
  const ready = (w) => stars(w) >= 3;

  // ---------------- helpers ----------------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const norm = (s) => String(s).toLowerCase().replace(/[’‘`]/g, "'").replace(/\s+/g, ' ').trim();
  const world = () => WORLDS[me().wi] || WORLDS[0];
  const theme = () => (me().wi == null ? 'theme-home' : world().theme);
  let ac = null;
  function tone(freqs, dur = 0.11, type = 'sine') {
    if (!ww.settings.sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = ac.currentTime;
      freqs.forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; const t = t0 + i * dur; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.05); });
    } catch (e) { /* no audio */ }
  }
  const sfx = { good: () => tone([660, 880, 1175]), bad: () => tone([300, 220], 0.16, 'triangle'), win: () => tone([523, 659, 784, 1047, 1319], 0.13), tap: () => tone([520], 0.04), hit: () => tone([200, 400, 800], 0.07, 'square') };
  function confetti(emojis, count = 36) {
    const layer = document.createElement('div'); layer.className = 'confetti';
    for (let i = 0; i < count; i++) { const s = document.createElement('span'); s.textContent = pick(emojis); s.style.left = Math.random() * 100 + '%'; s.style.animationDelay = Math.random() * 0.6 + 's'; s.style.animationDuration = 1.8 + Math.random() * 1.4 + 's'; s.style.fontSize = 18 + Math.random() * 22 + 'px'; layer.appendChild(s); }
    document.body.appendChild(layer); setTimeout(() => layer.remove(), 3800);
  }
  function toast(html) { const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html; t.style.bottom = 24 + document.querySelectorAll('.toast').length * 78 + 'px'; document.body.appendChild(t); setTimeout(() => t.classList.add('show'), 10); setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 2600); }
  function banner() {
    let b = document.getElementById('storage-warning');
    if (!saveFailed) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('div'); b.id = 'storage-warning'; document.body.appendChild(b); }
    b.innerHTML = '⚠️ <b>This browser is not saving progress</b> (Private Browsing may be on).';
  }
  function deco(th) {
    const w = WORLDS.find((x) => x.theme === th), set = w ? w.deco : ['📚', '✏️', '⭐', '🌈', '🦉', '✨'];
    let out = '<div class="deco" aria-hidden="true">';
    for (let i = 0; i < 9; i++) out += `<span style="left:${(i * 11 + 3) % 96}%;top:${(i * 37 + 10) % 90}%;animation-delay:${i * 0.7}s;font-size:${22 + (i % 3) * 10}px">${set[i % set.length]}</span>`;
    return out + '</div>';
  }
  let screen = 'players', cleanup = null;
  function show(html, th) {
    if (cleanup) { try { cleanup(); } catch (e) { /* ignore */ } cleanup = null; }
    WW.speech.stop();
    app.innerHTML = `<div class="screen ${th || theme()}">${deco(th || theme())}<div class="wrap">${html}</div></div>`;
    window.scrollTo(0, 0);
  }
  function topbar(back) {
    const p = player(cur);
    return `<div class="topbar">
      <button class="btn ghost" data-act="${back || 'players'}">${back ? '⬅ Back' : '👥 Players'}</button>
      <div class="who"><span class="avatar sm">${p ? p.avatar : ''}</span> ${p ? esc(p.name) : ''}</div>
      <div class="gems">💎 ${p ? p.gems : 0}</div>
    </div>`;
  }
  function addGems(n) { if (n > 0) updateProfile(cur, (p) => { p.gems += n; p.lifetimeGems = (p.lifetimeGems || 0) + n; }); }
  const BADGES = [
    { id: 'first', e: '🪄', name: 'Apprentice', desc: 'Finish your first spelling game' },
    { id: 'streak10', e: '🔥', name: 'Hot Streak', desc: 'Spell 10 words right in a row' },
    { id: 'ready', e: '⭐', name: 'Spelling Star', desc: 'Get every word on your list test-ready' },
    { id: 'boss', e: '🐝', name: 'Bee Champion', desc: 'Win a Spelling Bee boss battle' },
    { id: 'perfect', e: '💯', name: 'Perfect Test', desc: 'Score 100% on Test Day' },
    { id: 'explorer', e: '🧭', name: 'Game Explorer', desc: 'Play 5 different games' },
    { id: 'hand', e: '✍️', name: 'Neat Writer', desc: 'Write 25 words by hand' },
  ];
  function award(id) {
    const m = me(); if (m.badges.includes(id)) return;
    m.badges.push(id); save();
    const b = BADGES.find((x) => x.id === id); if (b) setTimeout(() => toast(`<b>${b.e} Badge earned!</b><br>${b.name}`), 700);
  }
  /** Record a spelling attempt from memory. Only these build the "test-ready" stars. */
  function recordRecall(w, ok) {
    const p = prog(w), m = me();
    if (ok) { p.right++; p.streak++; m.stats.run = (m.stats.run || 0) + 1; if (m.stats.run >= 10) award('streak10'); }
    else { p.wrong++; p.streak = 0; m.stats.run = 0; }
    p.last = Date.now();
    if (m.words.length && m.words.every(ready)) award('ready');
    save();
  }
  function gameDone(id) {
    const m = me(); m.stats.games[id] = (m.stats.games[id] || 0) + 1;
    award('first'); if (Object.keys(m.stats.games).length >= 5) award('explorer');
    save();
  }
  /** Words ordered so the least-known come first, ties shuffled. */
  function practiceOrder(words) { return shuffle(words).sort((a, b) => stars(a) - stars(b)); }

  // ---------------- word prompt bar (hear / slow / sentence / meaning / spell) ----------------
  function promptBar(w, opts = {}) {
    return `<div class="say-bar">
      <button class="btn say" data-act="say" data-arg="${w.id}">🔊 Say it</button>
      <button class="btn say" data-act="say-slow" data-arg="${w.id}">🐢 Slowly</button>
      ${WW.speech.firstSentence(w) ? `<button class="btn say" data-act="say-sentence" data-arg="${w.id}">🗣️ In a sentence</button>` : ''}
      ${opts.noMeaning || !(w.meanings || []).length ? '' : `<button class="btn say" data-act="say-meaning" data-arg="${w.id}">📖 Meaning</button>`}
      ${opts.spell ? `<button class="btn say" data-act="say-spell" data-arg="${w.id}">🔤 Spell it out</button>` : ''}
    </div><div id="meaning-box"></div>`;
  }
  const hideWord = (s, word) => esc(s).replace(new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\w*', 'ig'), '<span class="blank">_____</span>');
  function wordById(id) { return me().words.find((w) => w.id === id); }
  function sayRoute(act, id) {
    const w = wordById(id); if (!w) return;
    WW.speech.stop();
    if (act === 'say') WW.speech.sayWord(w);
    else if (act === 'say-slow') WW.speech.sayWord(w, true);
    else if (act === 'say-sentence') { const s = WW.speech.firstSentence(w); WW.speech.speak(s, 0.9); const box = document.getElementById('meaning-box'); if (box && document.querySelector('[data-hide-word]')) box.innerHTML = `<div class="hint">🗣️ ${hideWord(s, w.word)}</div>`; }
    else if (act === 'say-meaning') {
      const m = w.meanings[0]; if (!m) return;
      const hide = !!document.querySelector('[data-hide-word]');
      const box = document.getElementById('meaning-box');
      if (box) box.innerHTML = `<div class="hint">📖 <i>${esc(m.pos)}</i>: ${hide ? hideWord(m.def, w.word) : esc(m.def)}</div>`;
      WW.speech.speak(m.def, 0.95);
    } else if (act === 'say-spell') WW.speech.spellAloud(w);
  }

  // ---------------- PLAYERS ----------------
  function renderPlayers() {
    screen = 'players'; cur = null;
    const ps = players();
    show(`<h1 class="title">🧙‍♀️ Word Wizards<small>Spelling magic, one word at a time</small></h1>
      <p class="story card">Every week brings new spelling words. Learn them, play with them, and become a <b>Word Wizard</b>! ✨<br><small>Players and 💎 gems are shared with Math Quest on this device.</small></p>
      <h2 class="on-bg">Who's practicing?</h2>
      <div class="grid profiles">${ps.map((p) => { const m = ww.players[p.id]; const n = m && m.words ? m.words.length : 0; return `<button class="profile card" data-act="choose" data-arg="${p.id}"><span class="avatar">${p.avatar}</span><span class="pname">${esc(p.name)}</span><span class="pmeta">${n ? `📝 ${n} words this week` : 'No words yet'} · 💎 ${p.gems}</span></button>`; }).join('')}
        <button class="profile card new" data-act="new-player"><span class="avatar">➕</span><span class="pname">New Player</span></button></div>
      <div class="center menu-row"><button class="btn ghost" data-act="settings">⚙️ For Grown-ups</button><a class="btn ghost" href="../math-quest/index.html">🌈 Math Quest</a></div>`, 'theme-home');
  }
  let draft = { name: '', avatar: '🦄', grade: 4 };
  function renderNewPlayer() {
    screen = 'new-player';
    show(`<div class="topbar"><button class="btn ghost" data-act="players">⬅ Back</button></div>
      <div class="card form"><h2>New player</h2>
        <label>Name<input id="pname" maxlength="16" autocomplete="off" value="${esc(draft.name)}" placeholder="Type your name"></label>
        <div class="label">Pick an avatar</div>
        <div class="avatar-pick">${FREE_AVATARS.map((a) => `<button class="avatar-btn ${draft.avatar === a ? 'sel' : ''}" data-act="draft-avatar" data-arg="${a}">${a}</button>`).join('')}</div>
        <div class="label">Grade</div>
        <div class="grade-pick">${[2, 3, 4, 5, 6, 7, 8].map((g) => `<button class="chip ${draft.grade === g ? 'sel' : ''}" data-act="draft-grade" data-arg="${g}">Grade ${g}</button>`).join('')}</div>
        <p class="note">This player will also appear in Math Quest.</p>
        <button class="btn big primary" data-act="create-player">Create ✨</button></div>`, 'theme-home');
    const i = document.getElementById('pname'); i.addEventListener('input', () => { draft.name = i.value; }); if (!draft.name) i.focus();
  }

  // ---------------- THEME PICKER ----------------
  function renderThemes() {
    screen = 'themes';
    const m = me();
    show(`${m.wi != null ? topbar('home') : '<div class="topbar"><button class="btn ghost" data-act="players">⬅ Back</button></div>'}
      <h1 class="title sm">🎨 Pick your world</h1>
      <p class="card center">Your spelling games will use this world's colors, friends and boss. You can change it any time.</p>
      <div class="bonus-grid">${WORLDS.map((w, wi) => `<button class="world card ${w.theme} ${m.wi === wi ? 'chosen' : ''}" data-act="set-theme" data-arg="${wi}"><span class="wemoji">${w.emoji}</span><span class="winfo"><span class="wname">${w.name}</span><span class="wgrade">${w.guide.emoji} ${w.guide.name}</span></span></button>`).join('')}</div>`, 'theme-home');
  }

  // ---------------- HOME ----------------
  const GAMES = [
    { id: 'hear', e: '🎧', name: 'Hear & Type', desc: 'Listen, then type the word', tag: 'Typing' },
    { id: 'write', e: '✍️', name: 'Write It', desc: 'Write it on the screen, then check', tag: 'Handwriting' },
    { id: 'lcwc', e: '👀', name: 'Look · Cover · Write · Check', desc: 'Study it, hide it, spell it from memory', tag: 'Write or type' },
    { id: 'puzzle', e: '🧩', name: 'Letter Puzzles', desc: 'Unscramble tiles and fill in missing letters', tag: 'Tap' },
    { id: 'boss', e: '🐝', name: 'Spelling Bee Battle', desc: 'Beat your world\'s boss with correct spellings', tag: 'Typing' },
    { id: 'test', e: '📝', name: 'Test Day', desc: 'A practice test, just like at school', tag: 'Write or type' },
    { id: 'search', e: '🔍', name: 'Word Search', desc: 'Find your words hidden in the grid', tag: 'Tap' },
    { id: 'memory', e: '🃏', name: 'Memory Match', desc: 'Match each word to its meaning', tag: 'Tap' },
  ];
  function renderHome() {
    screen = 'home';
    const m = me(), w = world(), words = m.words, nReady = words.filter(ready).length;
    if (m.wi == null) return renderThemes();
    const needs = words.filter((x) => !x.meanings.length || !WW.speech.firstSentence(x)).length;
    show(`${topbar()}
      <h1 class="title sm">🧙‍♀️ Word Wizards</h1>
      <div class="guide card"><span class="guide-emoji">${w.guide.emoji}</span><div><b>${w.guide.name}:</b> ${words.length ? (nReady === words.length ? 'Every word is test-ready! You are a true Word Wizard! 🌟' : `You have <b>${words.length}</b> words this week. Let's practice!`) : 'No spelling words yet! Add this week\'s list to start the magic. ✨'}</div></div>
      ${words.length ? `<div class="card ready-card"><div class="ready-head"><b>⭐ Test-ready: ${nReady} of ${words.length}</b><span class="note">Spell a word right 3 times in a row from memory to make it test-ready.</span></div>
        <div class="ready-bar"><div style="width:${(nReady / words.length) * 100}%"></div></div>
        <div class="chips-row">${words.map((x) => `<span class="wchip s${stars(x)}" title="${stars(x)} of 3">${esc(x.word)}${x.challenge ? ' ⭐' : ''}</span>`).join('')}</div></div>` : ''}
      <div class="menu-row">
        <button class="btn ${words.length ? '' : 'big primary'}" data-act="edit">${words.length ? '✏️ Edit words' : '✏️ Add this week\'s words'}</button>
        ${words.length ? '<button class="btn primary" data-act="mywords">📚 My Words</button>' : ''}
        <button class="btn ghost" data-act="themes">🎨 World</button>
        <button class="btn ghost" data-act="badges">🏅 Badges</button>
      </div>
      ${needs ? `<p class="card warn">⚠️ ${needs} word${needs > 1 ? 's need' : ' needs'} a definition or sentence. Tap <b>Edit words</b> to add them.</p>` : ''}
      ${words.length ? `<h2 class="section-title">🎮 Games</h2><div class="game-grid">${GAMES.map((g) => `<button class="card game-tile" data-act="game" data-arg="${g.id}"><span class="ge">${g.e}</span><b>${g.name}</b><small>${g.desc}</small><span class="gtag">${g.tag}</span></button>`).join('')}</div>` : ''}`);
  }

  // ---------------- WORD EDITOR ----------------
  let edit = null; // { words: [...] } working copy
  const newId = () => 'w' + Math.random().toString(36).slice(2, 9);
  function renderEditList() {
    screen = 'edit-list';
    const m = me();
    const text = m.words.map((w) => (w.challenge ? '*' : '') + w.word).join('\n');
    show(`${topbar('home')}
      <div class="card form wide">
        <h2>✏️ This week's spelling words</h2>
        <p class="note">Type or paste the words, <b>one per line</b> (commas work too). Put a <b>*</b> in front of a challenge word, like <b>*necessary</b>. Then tap <b>Look up words</b>: the app finds the pronunciation, meanings and example sentences, and you can check and edit them.</p>
        <textarea id="wordlist" rows="12" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="because&#10;bright&#10;receive&#10;*necessary">${esc(text)}</textarea>
        <div class="menu-row"><button class="btn big primary" data-act="lookup">✨ Look up words</button></div>
        ${m.words.length ? '<div class="menu-row"><button class="btn danger sm" data-act="new-week">🗓️ Start a new week (clear these words)</button></div>' : ''}
      </div>`);
  }
  async function lookupAll() {
    const raw = document.getElementById('wordlist').value;
    const items = raw.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
    const seen = new Set(), list = [];
    items.forEach((s) => { const challenge = s.startsWith('*'), word = s.replace(/^\*+/, '').trim().replace(/\s+/g, ' '); if (word && !seen.has(key(word))) { seen.add(key(word)); list.push({ word, challenge }); } });
    if (!list.length) return toast('Type at least one word ✏️');
    if (list.length > 40) toast('That\'s a lot of words! Games work best with 10–20.');
    const old = {}; me().words.forEach((w) => { old[key(w.word)] = w; });
    edit = { words: list.map(({ word, challenge }) => (old[key(word)] && old[key(word)].status !== 'offline' ? Object.assign({}, old[key(word)], { challenge }) : { id: newId(), word, challenge, status: 'pending', meanings: [], alts: [], phonetic: '', audio: '' })) };
    renderEditor();
    for (const w of edit.words) {
      if (w.status !== 'pending') continue;
      const r = await WW.dict.lookup(w.word);
      if (!edit || screen !== 'editor') return;
      Object.assign(w, { status: r.status, phonetic: r.phonetic, audio: r.audio, meanings: r.meanings, alts: r.alts });
      const card = document.getElementById('card-' + w.id); if (card) card.outerHTML = editCard(w);
      updateEditorSummary();
    }
  }
  function flags(w) {
    const f = [];
    if (w.status === 'pending') f.push('⏳ looking up…');
    const hasDef = w.meanings.some((m) => m.def.trim());
    if (w.status === 'notfound' && !hasDef) f.push('❓ not in the dictionary. Check the spelling, or add a meaning yourself');
    if (w.status === 'offline' && !hasDef) f.push('📡 couldn\'t reach the dictionary (internet?). Add a meaning, or try again');
    if (w.status !== 'pending' && !w.meanings.some((m) => m.def.trim())) f.push('⚠️ needs a definition');
    if (w.status !== 'pending' && !w.meanings.some((m) => m.sentences.some((s) => s.trim()))) f.push('⚠️ needs a sentence');
    return f;
  }
  function editCard(w) {
    const f = flags(w);
    return `<div class="card edit-card ${f.some((x) => x.startsWith('⚠️') || x.startsWith('❓') || x.startsWith('📡')) ? 'needs' : ''}" id="card-${w.id}">
      <div class="edit-head">
        <input class="word-input" data-f="word" data-w="${w.id}" value="${esc(w.word)}" autocapitalize="off" autocorrect="off" spellcheck="false">
        <button class="chip ${w.challenge ? 'sel' : ''}" data-act="ed-challenge" data-arg="${w.id}">⭐ Challenge</button>
        <button class="btn sm" data-act="ed-say" data-arg="${w.id}">🔊</button>
        <span class="note">${esc(w.phonetic || '')} ${w.audio ? '🎙️ recording' : w.status === 'pending' ? '' : '🤖 device voice'}</span>
        <button class="btn sm ghost" data-act="ed-remove" data-arg="${w.id}" title="Remove word">🗑️</button>
      </div>
      ${f.length ? `<div class="flags">${f.map((x) => `<span>${x}</span>`).join('')}${w.status === 'offline' || w.status === 'notfound' ? ` <button class="btn sm" data-act="ed-retry" data-arg="${w.id}">🔄 Look up again</button>` : ''}</div>` : ''}
      ${w.meanings.map((m, mi) => `<div class="meaning">
        <div class="meaning-head"><input class="pos-input" data-f="pos" data-w="${w.id}" data-m="${mi}" value="${esc(m.pos)}" placeholder="noun, verb…"><span class="note">Meaning ${mi + 1}</span><button class="btn sm ghost" data-act="ed-del-meaning" data-arg="${w.id},${mi}">✖</button></div>
        <textarea data-f="def" data-w="${w.id}" data-m="${mi}" rows="2" placeholder="What does it mean? (kid-friendly words are best)">${esc(m.def)}</textarea>
        ${m.sentences.map((s, si) => `<div class="sent-row"><span>🗣️</span><textarea data-f="sent" data-w="${w.id}" data-m="${mi}" data-s="${si}" rows="2" placeholder="A sentence using the word">${esc(s)}</textarea><button class="btn sm ghost" data-act="ed-del-sent" data-arg="${w.id},${mi},${si}">✖</button></div>`).join('')}
        <button class="btn sm" data-act="ed-add-sent" data-arg="${w.id},${mi}">➕ Add a sentence</button>
      </div>`).join('')}
      <div class="menu-row left"><button class="btn sm" data-act="ed-add-meaning" data-arg="${w.id}">➕ Add a meaning</button>
        ${w.alts && w.alts.length ? `<select data-f="alt" data-w="${w.id}"><option value="">📚 Other meanings from the dictionary…</option>${w.alts.map((a, ai) => `<option value="${ai}">${esc(a.pos)}: ${esc(a.def.slice(0, 90))}${a.def.length > 90 ? '…' : ''}${a.ex ? ' (has a sentence)' : ''}</option>`).join('')}</select>` : ''}</div>
    </div>`;
  }
  function updateEditorSummary() {
    const el = document.getElementById('ed-summary'); if (!el || !edit) return;
    const pending = edit.words.filter((w) => w.status === 'pending').length, needs = edit.words.filter((w) => flags(w).some((x) => /⚠️|❓|📡/.test(x))).length;
    el.innerHTML = pending ? `⏳ Looking up ${pending} word${pending > 1 ? 's' : ''}…` : needs ? `⚠️ ${needs} word${needs > 1 ? 's need' : ' needs'} a little help (look for the yellow cards). You can still save now and finish later.` : '✅ All words have a meaning and a sentence. Check that the meanings make sense for your child, then save!';
  }
  function renderEditor() {
    screen = 'editor';
    show(`${topbar('edit')}
      <div class="card form wide"><h2>✏️ Check the words</h2>
        <p class="note">The dictionary's definitions are written for grown-ups, so feel free to reword them in kid-friendly language. Every word needs at least one meaning and one sentence. If a word has more than one meaning, add a sentence for each. 📚 <i>Other meanings</i> lists more options from the dictionary.</p>
        <p id="ed-summary" class="ed-summary"></p></div>
      <div id="ed-cards">${edit.words.map(editCard).join('')}</div>
      <div class="card center sticky-save"><button class="btn big primary" data-act="ed-save">💾 Save words</button></div>`);
    updateEditorSummary();
  }
  function editWord(id) { return edit && edit.words.find((w) => w.id === id); }
  function onEditInput(e) {
    const t = e.target, w = t.dataset && editWord(t.dataset.w); if (!w) return;
    const f = t.dataset.f, mi = +t.dataset.m, si = +t.dataset.s;
    if (f === 'word') w.word = t.value.trim();
    else if (f === 'pos') w.meanings[mi].pos = t.value;
    else if (f === 'def') w.meanings[mi].def = t.value;
    else if (f === 'sent') w.meanings[mi].sentences[si] = t.value;
    else if (f === 'alt') { if (e.type !== 'change' || t.value === '') return; const a = w.alts[+t.value]; w.meanings.push({ pos: a.pos, def: a.def, sentences: a.ex ? [a.ex] : [''] }); refreshCard(w); return; }
    if (e.type === 'change') refreshFlags(w);
  }
  // Update only the warning flags, so typing focus isn't lost when moving between boxes.
  function refreshFlags(w) {
    const card = document.getElementById('card-' + w.id); if (!card) return;
    const tmp = document.createElement('div'); tmp.innerHTML = editCard(w);
    const fresh = tmp.firstElementChild, oldF = card.querySelector('.flags'), newF = fresh.querySelector('.flags');
    card.className = fresh.className;
    if (oldF && newF) oldF.replaceWith(newF); else if (oldF) oldF.remove(); else if (newF) card.querySelector('.edit-head').after(newF);
    updateEditorSummary();
  }
  function refreshCard(w) {
    const card = document.getElementById('card-' + w.id); if (!card) return;
    card.outerHTML = editCard(w); updateEditorSummary();
  }
  function saveEdit() {
    const m = me(), seen = new Set();
    const words = edit.words.filter((w) => w.word && !seen.has(key(w.word)) && seen.add(key(w.word))).map((w) => ({
      id: w.id, word: w.word, challenge: !!w.challenge, phonetic: w.phonetic || '', audio: w.audio || '', status: w.status === 'pending' ? 'offline' : w.status,
      meanings: w.meanings.map((x) => ({ pos: (x.pos || '').trim(), def: (x.def || '').trim(), sentences: x.sentences.map((s) => s.trim()).filter(Boolean) })).filter((x) => x.def || x.sentences.length),
      alts: w.alts || [],
    }));
    const keep = new Set(words.map((w) => key(w.word)));
    Object.keys(m.prog).forEach((k) => { if (!keep.has(k)) delete m.prog[k]; });
    m.words = words; m.weekStart = m.weekStart || Date.now();
    edit = null; save();
    toast(`💾 Saved ${words.length} words!`);
    renderHome();
  }

  // ---------------- MY WORDS ----------------
  function renderMyWords() {
    screen = 'mywords';
    const m = me();
    show(`${topbar('home')}<h1 class="title sm">📚 My Words</h1>
      <p class="card center">Tap a word to hear it, learn what it means, and hear it in a sentence.</p>
      <div class="word-grid">${m.words.map((w) => `<button class="card word-card" data-act="word" data-arg="${w.id}"><b>${esc(w.word)}</b>${w.challenge ? '<span class="chal">⭐ challenge</span>' : ''}<span class="stars">${'★'.repeat(stars(w))}${'☆'.repeat(3 - stars(w))}</span><small>${esc((w.meanings[0] || {}).pos || '')}</small></button>`).join('')}</div>`);
  }
  function renderWord(id) {
    screen = 'word';
    const w = wordById(id); if (!w) return renderMyWords();
    show(`${topbar('mywords')}
      <div class="card word-detail">
        <div class="big-word">${esc(w.word)}</div>
        <div class="note center">${esc(w.phonetic || '')}${w.challenge ? ' · ⭐ challenge word' : ''} · ${'★'.repeat(stars(w))}${'☆'.repeat(3 - stars(w))}</div>
        ${promptBar(w, { noMeaning: true, spell: true })}
        ${w.meanings.length ? w.meanings.map((mm, i) => `<div class="meaning-view">
          <div><span class="pos-chip">${esc(mm.pos || 'meaning')}</span> <b>Meaning${w.meanings.length > 1 ? ' ' + (i + 1) : ''}:</b> ${esc(mm.def)} <button class="btn sm" data-act="speak-text" data-arg="${esc(mm.def)}">🔊</button></div>
          ${mm.sentences.map((s) => `<div class="sentence">🗣️ “${esc(s)}” <button class="btn sm" data-act="speak-text" data-arg="${esc(s)}">🔊</button></div>`).join('')}
        </div>`).join('') : '<p class="warn">No meaning yet. Ask a grown-up to add one in ✏️ Edit words.</p>'}
        <div class="menu-row"><button class="btn" data-act="word-nav" data-arg="${id},-1">⬅ Previous</button><button class="btn" data-act="word-nav" data-arg="${id},1">Next ➜</button></div>
      </div>`);
    WW.speech.sayWord(w);
  }

  // ---------------- BADGES / SETTINGS ----------------
  function renderBadges() {
    screen = 'badges';
    const m = me();
    show(`${topbar('home')}<h1 class="title sm">🏅 Spelling Badges</h1>
      <div class="grid badges">${BADGES.map((b) => { const has = m.badges.includes(b.id); return `<div class="card badge ${has ? '' : 'missing'}"><span class="avatar">${has ? b.e : '🔒'}</span><b>${b.name}</b><small>${b.desc}</small></div>`; }).join('')}</div>`);
  }
  function renderSettings() {
    screen = 'settings';
    const s = ww.settings, voices = WW.speech.englishVoices();
    show(`<div class="topbar"><button class="btn ghost" data-act="${cur ? 'home' : 'players'}">⬅ Back</button></div>
      <div class="card form wide"><h2>⚙️ For Grown-ups</h2>
        <div class="label">Speaking speed</div>
        <div class="grade-pick">${[[0.8, '🐢 Slower'], [1, '🙂 Normal'], [1.15, '🐇 Faster']].map(([v, l]) => `<button class="chip ${s.rate === v ? 'sel' : ''}" data-act="set-rate" data-arg="${v}">${l}</button>`).join('')}</div>
        <div class="label">Device voice (used when there's no real recording, and for sentences)</div>
        <select id="voice-pick"><option value="">Automatic</option>${voices.map((v) => `<option value="${esc(v.voiceURI)}" ${s.voice === v.voiceURI ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('')}</select>
        <button class="btn sm" data-act="test-voice">🔊 Test voice</button>
        <div class="label">Sound effects</div>
        <div class="grade-pick"><button class="chip ${s.sound ? 'sel' : ''}" data-act="set-sound" data-arg="on">🔊 On</button><button class="chip ${!s.sound ? 'sel' : ''}" data-act="set-sound" data-arg="off">🔇 Off</button></div>
        <div class="label">Spelling Bee timer</div>
        <div class="grade-pick">${[['normal', '⏱️ 30 seconds'], ['relaxed', '🐢 60 seconds'], ['off', '🚫 Off']].map(([k, l]) => `<button class="chip ${s.timer === k ? 'sel' : ''}" data-act="set-timer" data-arg="${k}">${l}</button>`).join('')}</div>
        <div class="label">Players' word lists</div>
        ${players().map((p) => { const m = ww.players[p.id]; return `<div class="prow"><span>${p.avatar} <b>${esc(p.name)}</b> · ${m && m.words ? m.words.length : 0} words</span>${m && m.words && m.words.length ? `<button class="btn sm danger" data-act="clear-week" data-arg="${p.id}">🗓️ Start a new week</button>` : ''}</div>`; }).join('') || '<p>No players yet.</p>'}
        <div class="label">How it works</div>
        <ul class="rules">
          <li>Each player has her own list for the current week. Either a grown-up or the child can add or edit words (✏️ Edit words).</li>
          <li>Words are looked up in the free dictionary at dictionaryapi.dev (internet needed for lookups and real recordings; only the word itself is sent). Definitions are written for adults, so rewording them helps a lot.</li>
          <li>A word becomes ⭐ <b>test-ready</b> after being spelled right 3 times in a row from memory (Hear & Type, Write It, Look-Cover-Write-Check, Spelling Bee, Test Day). One miss resets it.</li>
          <li>Typing games use the app's own keyboard, so the iPad's autocorrect and word suggestions can't give the answer away.</li>
          <li>Handwriting can't be graded by a computer, so after writing, kids compare with the real spelling and mark themselves honestly.</li>
          <li>💎 Gems are shared with Math Quest and can be spent in its avatar shop. Saves stay in this browser on this device. Math Quest's backup button includes the players and gems, but not the spelling words.</li>
        </ul>
      </div>`, 'theme-home');
    const vp = document.getElementById('voice-pick'); vp.addEventListener('change', () => { ww.settings.voice = vp.value; save(); });
  }

  // ---------------- routing ----------------
  function route(act, arg, el) {
    if (/^say/.test(act)) return sayRoute(act, arg);
    if (WW.games && WW.games.route(act, arg, el)) return;
    switch (act) {
      case 'players': return renderPlayers();
      case 'new-player': draft = { name: '', avatar: '🦄', grade: 4 }; return renderNewPlayer();
      case 'draft-avatar': draft.avatar = arg; return renderNewPlayer();
      case 'draft-grade': draft.grade = +arg; return renderNewPlayer();
      case 'create-player': { const n = draft.name.trim(); if (!n) return toast('Type a name first ✏️'); const p = createPlayer(n, draft.avatar, draft.grade); cur = p.id; return renderThemes(); }
      case 'choose': cur = arg; return me().wi == null ? renderThemes() : renderHome();
      case 'themes': return renderThemes();
      case 'set-theme': me().wi = +arg; save(); sfx.win(); return renderHome();
      case 'home': return renderHome();
      case 'edit': return renderEditList();
      case 'lookup': return lookupAll();
      case 'new-week': if (confirm('Start a new week? This week\'s words and progress will be cleared.')) { me().words = []; me().prog = {}; me().weekStart = Date.now(); save(); renderEditList(); } return;
      case 'ed-challenge': { const w = editWord(arg); w.challenge = !w.challenge; return refreshCard(w); }
      case 'ed-say': { const w = editWord(arg); return WW.speech.sayWord(w); }
      case 'ed-remove': { edit.words = edit.words.filter((w) => w.id !== arg); const c = document.getElementById('card-' + arg); if (c) c.remove(); return updateEditorSummary(); }
      case 'ed-retry': { const w = editWord(arg); w.status = 'pending'; refreshCard(w); WW.dict.lookup(w.word).then((r) => { Object.assign(w, { status: r.status, phonetic: r.phonetic, audio: r.audio, meanings: r.meanings.length ? r.meanings : w.meanings, alts: r.alts }); refreshCard(w); }); return; }
      case 'ed-add-meaning': { const w = editWord(arg); w.meanings.push({ pos: '', def: '', sentences: [''] }); return refreshCard(w); }
      case 'ed-del-meaning': { const [id, mi] = arg.split(','); const w = editWord(id); w.meanings.splice(+mi, 1); return refreshCard(w); }
      case 'ed-add-sent': { const [id, mi] = arg.split(','); const w = editWord(id); w.meanings[+mi].sentences.push(''); return refreshCard(w); }
      case 'ed-del-sent': { const [id, mi, si] = arg.split(','); const w = editWord(id); w.meanings[+mi].sentences.splice(+si, 1); return refreshCard(w); }
      case 'ed-save': return saveEdit();
      case 'mywords': return renderMyWords();
      case 'word': return renderWord(arg);
      case 'word-nav': { const [id, d] = arg.split(','), ws = me().words, i = ws.findIndex((w) => w.id === id); return renderWord(ws[(i + +d + ws.length) % ws.length].id); }
      case 'speak-text': WW.speech.stop(); return WW.speech.speak(arg, 0.95);
      case 'badges': return renderBadges();
      case 'settings': return renderSettings();
      case 'set-rate': ww.settings.rate = +arg; save(); return renderSettings();
      case 'set-sound': ww.settings.sound = arg === 'on'; save(); return renderSettings();
      case 'set-timer': ww.settings.timer = arg; save(); return renderSettings();
      case 'test-voice': WW.speech.stop(); return WW.speech.speak('Hello, Word Wizard! Your next word is: rainbow.', 0.9);
      case 'clear-week': { const p = player(arg); if (p && confirm(`Clear ${p.name}'s words and progress for a new week?`)) { const m = ww.players[arg]; m.words = []; m.prog = {}; m.weekStart = Date.now(); save(); } return renderSettings(); }
      case 'game': return WW.games.start(arg);
    }
  }
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
    if (el.tagName === 'A') return;
    route(el.dataset.act, el.dataset.arg, el);
  });
  document.addEventListener('input', onEditInput);
  document.addEventListener('change', onEditInput);
  document.addEventListener('keydown', (e) => { if (screen === 'new-player' && e.key === 'Enter') route('create-player'); });
  // keep gems current if Math Quest changes them in another tab
  window.addEventListener('storage', (e) => { if (e.key === MQ_KEY && screen === 'home') renderHome(); });
  // voices load asynchronously on some devices
  try { if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => { if (screen === 'settings') renderSettings(); }; } catch (e) { /* none */ }

  // shared with games.js
  Object.assign(WW, {
    esc, pick, shuffle, norm, show, topbar, toast, confetti, sfx, me, prog, stars, ready, recordRecall, gameDone, addGems, award, practiceOrder,
    promptBar, hideWord, wordById, world, theme, renderHome, setCleanup: (fn) => { cleanup = fn; }, setScreen: (s) => { screen = s; }, getScreen: () => screen, save,
    _debug: { ww: () => ww, cur: () => cur, edit: () => edit },
  });

  // start
  if (!writeJSON('ww_test', 1)) { saveFailed = true; banner(); } else localStorage.removeItem('ww_test');
  setTimeout(renderPlayers, 0);
})();
