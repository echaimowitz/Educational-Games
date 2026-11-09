/* Word Wizards — games: Hear & Type, Write It, Look-Cover-Write-Check, Letter Puzzles,
 * Spelling Bee boss battle, Test Day, Word Search, Memory Match. */
(function () {
  'use strict';
  const WW = (window.WW = window.WW || {});
  const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pickL = (a) => a[Math.floor(Math.random() * a.length)];
  const shuf = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const normS = (s) => String(s).toLowerCase().replace(/[’‘`]/g, "'").replace(/\s+/g, ' ').trim();

  // ======================= pure helpers (also used by the tests) =======================
  const isCorrect = (typed, word) => normS(typed) === normS(word);

  /** Longest-common-subsequence letter matching, for showing which letters were right. */
  function lcsMarks(a, b) {
    const n = a.length, m = b.length, dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const ma = new Array(n).fill(false), mb = new Array(m).fill(false);
    let i = 0, j = 0;
    while (i < n && j < m) { if (a[i] === b[j]) { ma[i] = mb[j] = true; i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++; }
    return { ma, mb };
  }

  /** Letters to blank out in "missing letters": tricky spots first (silent letters, doubles), then vowels. */
  function blanksFor(word) {
    const w = word.toLowerCase(), letters = [];
    for (let i = 0; i < w.length; i++) if (/[a-z]/.test(w[i])) letters.push(i);
    const target = Math.max(1, Math.min(letters.length - 1, Math.round(letters.length * 0.35)));
    const out = new Set(), add = (i) => { if (out.size < target && i >= 0 && i < w.length && /[a-z]/.test(w[i])) out.add(i); };
    [['kn', 0], ['wr', 0], ['gn', 0], ['mb', 1], ['gh', 0], ['gh', 1], ['ph', 0], ['ph', 1], ['ck', 0], ['ei', 0], ['ie', 0], ['ough', 1], ['tion', 1], ['sion', 1]]
      .forEach(([pat, off]) => { let p = w.indexOf(pat); while (p >= 0) { add(p + off); p = w.indexOf(pat, p + 1); } });
    for (let i = 1; i < w.length; i++) if (w[i] === w[i - 1] && /[a-z]/.test(w[i])) add(i);
    shuf(letters.filter((i) => 'aeiouy'.includes(w[i]))).forEach(add);
    shuf(letters).forEach(add);
    return [...out].sort((a, b) => a - b);
  }

  /** Shuffle the letters of a word so it never comes out in the original order (when possible). */
  function scramble(word) {
    const letters = word.toLowerCase().split('').filter((c) => c !== ' ');
    if (new Set(letters).size < 2) return letters;
    let s; do { s = shuf(letters); } while (s.join('') === letters.join(''));
    return s;
  }

  /** Build a word search. Words go across, down, and diagonally (never backwards). */
  function buildSearch(words) {
    const W = [...new Set(words.map((w) => w.toUpperCase().replace(/[^A-Z]/g, '')).filter((w) => w.length > 1))];
    const longest = Math.max(...W.map((w) => w.length), 5);
    let size = Math.max(8, Math.min(16, longest + 2));
    const dirs = [[0, 1], [1, 0], [1, 1], [-1, 1]];
    const usable = W.filter((w) => w.length <= 16).sort((a, b) => b.length - a.length);
    for (let attempt = 0; attempt < 80; attempt++) {
      const grid = new Array(size * size).fill(''), placed = [];
      let ok = true;
      for (const w of usable) {
        let done = false;
        for (let t = 0; t < 400 && !done; t++) {
          const [dr, dc] = pickL(dirs), r0 = R(0, size - 1), c0 = R(0, size - 1), r1 = r0 + dr * (w.length - 1), c1 = c0 + dc * (w.length - 1);
          if (r1 < 0 || r1 >= size || c1 < 0 || c1 >= size) continue;
          let fits = true;
          for (let i = 0; i < w.length && fits; i++) { const c = grid[(r0 + dr * i) * size + c0 + dc * i]; if (c && c !== w[i]) fits = false; }
          if (!fits) continue;
          for (let i = 0; i < w.length; i++) grid[(r0 + dr * i) * size + c0 + dc * i] = w[i];
          placed.push({ word: w, r0, c0, dr, dc }); done = true;
        }
        if (!done) { ok = false; break; }
      }
      if (ok) {
        const ABC = 'ABCDEFGHIJKLMNOPRSTUVWY';
        for (let i = 0; i < grid.length; i++) if (!grid[i]) grid[i] = ABC[R(0, ABC.length - 1)];
        return { size, grid, placed };
      }
      if (attempt % 10 === 9 && size < 16) size++;
    }
    return null;
  }
  WW.spellUtil = { isCorrect, lcsMarks, blanksFor, scramble, buildSearch };
  if (typeof document === 'undefined') return; // running in the tests

  // ======================= shared game UI =======================
  let G = null, T = null, pad = null, timerId = null, autoId = null;
  const esc = (s) => WW.esc(s);
  const word = () => G && WW.wordById(G.queue[G.idx]);
  function endSession() { T = null; pad = null; if (timerId) clearInterval(timerId); timerId = null; if (autoId) clearTimeout(autoId); autoId = null; }
  function screenOf(html) { WW.setScreen('game'); WW.show(html); WW.setCleanup(endSession); }
  const gemsFor = (w) => (w.challenge ? 2 : 1);
  /** Pay gems out right away (into the shared Math Quest bank), so leaving a game early never loses them. */
  function earn(n) { G.gems = (G.gems || 0) + n; WW.addGems(n); }

  // ---- on-screen keyboard (no iPad autocorrect or word suggestions) ----
  const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  function kbHTML(label = '✓ Check') {
    return `<div class="typed" id="typed">${typedHTML()}</div>
      <div class="kb">${ROWS.map((r, i) => `<div class="kb-row">${r.split('').map((c) => `<button class="kb-key" data-k="${c}">${c}</button>`).join('')}${i === 2 ? '<button class="kb-key wide" data-k="⌫">⌫</button>' : ''}</div>`).join('')}
        <div class="kb-row"><button class="kb-key" data-k="'">'</button><button class="kb-key" data-k="-">-</button><button class="kb-key space" data-k=" ">space</button><button class="kb-key go" data-k="enter">${label}</button></div></div>`;
  }
  function typedHTML() {
    const v = T ? T.value : '';
    return (v ? v.split('').map((c) => `<span class="tl">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('') : '<span class="ph">tap the letters</span>') + '<span class="caret"></span>';
  }
  const setTyped = () => { const el = document.getElementById('typed'); if (el) el.innerHTML = typedHTML(); };
  function typeKey(k) {
    if (!T) return;
    if (k === 'enter') { if (T.value.trim()) T.onEnter(T.value); return; }
    if (k === '⌫') T.value = T.value.slice(0, -1);
    else if (T.value.length < 30 && !(k === ' ' && (!T.value || T.value.endsWith(' ')))) T.value += k;
    WW.sfx.tap(); setTyped();
  }
  function shake(id) { const el = document.getElementById(id); if (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); } }
  document.addEventListener('pointerdown', (e) => { const k = e.target.closest('[data-k]'); if (!k) return; e.preventDefault(); typeKey(k.dataset.k); });
  document.addEventListener('keydown', (e) => {
    if (WW.getScreen() !== 'game' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (!T) { if (e.key === 'Enter') { const nb = document.getElementById('next-btn'); if (nb) { e.preventDefault(); nb.click(); } } return; }
    const k = e.key;
    if (/^[a-zA-Z]$/.test(k)) { e.preventDefault(); typeKey(k.toLowerCase()); }
    else if (k === "'" || k === '’' || k === '-' || k === ' ') { e.preventDefault(); typeKey(k === '’' ? "'" : k); }
    else if (k === 'Backspace') { e.preventDefault(); typeKey('⌫'); }
    else if (k === 'Enter') { e.preventDefault(); typeKey('enter'); }
  });

  // ---- handwriting pad ----
  function padHTML(h = 220) { return `<div class="pad-wrap"><canvas class="pad" id="pad" style="height:${h}px"></canvas><div class="pad-tools"><button class="btn sm" data-act="pad-undo">↶ Undo</button><button class="btn sm" data-act="pad-clear">🧽 Clear</button></div></div>`; }
  function makePad(guide) {
    const canvas = document.getElementById('pad'); if (!canvas) return null;
    const ctx = canvas.getContext('2d'), dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth, H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.scale(dpr, dpr);
    const strokes = []; let cur = null;
    const lw = Math.max(3, H / 40);
    function background() {
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      ctx.lineWidth = 1.5; ctx.strokeStyle = '#b9d4ff';
      [[0.2, []], [0.5, [8, 8]], [0.8, []]].forEach(([y, dash]) => { ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(10, H * y); ctx.lineTo(W - 10, H * y); ctx.stroke(); });
      ctx.setLineDash([]); ctx.strokeStyle = '#ff9aa8'; ctx.beginPath(); ctx.moveTo(10, H * 0.8); ctx.lineTo(W - 10, H * 0.8); ctx.stroke();
      if (guide) {
        let fs = H * 0.62; ctx.font = `${fs}px Fredoka, Nunito, sans-serif`;
        const tw = ctx.measureText(guide).width; if (tw > W - 30) { fs *= (W - 30) / tw; ctx.font = `${fs}px Fredoka, Nunito, sans-serif`; }
        ctx.fillStyle = 'rgba(122, 75, 255, 0.22)'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(guide, W / 2, H * 0.8);
      }
    }
    function line(a, b) { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#2b2140'; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x + 0.01, b.y); ctx.stroke(); }
    function redraw() { background(); strokes.forEach((s) => { for (let i = 0; i < s.length; i++) line(s[Math.max(0, i - 1)], s[i]); }); }
    const pos = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); try { canvas.setPointerCapture(e.pointerId); } catch (x) { /* none */ } cur = [pos(e)]; strokes.push(cur); line(cur[0], cur[0]); });
    canvas.addEventListener('pointermove', (e) => {
      if (!cur) return; e.preventDefault();
      (e.getCoalescedEvents ? e.getCoalescedEvents() : [e]).forEach((ev) => { const p = pos(ev); line(cur[cur.length - 1], p); cur.push(p); });
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => canvas.addEventListener(t, () => { cur = null; }));
    redraw();
    return { clear() { strokes.length = 0; redraw(); }, undo() { strokes.pop(); redraw(); }, isEmpty: () => !strokes.length, image: () => canvas.toDataURL('image/png'), setGuide(g) { guide = g; strokes.length = 0; redraw(); } };
  }

  // ---- shared pieces ----
  const progressText = () => `Word ${Math.min(G.idx + 1, G.queue.length)} of ${G.queue.length}`;
  function diffHTML(typed, correct) {
    const a = normS(typed), b = correct, { ma, mb } = lcsMarks(a, b.toLowerCase());
    const show = (c) => (c === ' ' ? '&nbsp;' : esc(c));
    return `<div class="diff"><div><span class="dlabel">You typed</span>${a.split('').map((c, i) => `<span class="dl ${ma[i] ? 'ok' : 'bad'}">${show(c)}</span>`).join('')}</div>
      <div><span class="dlabel">Correct</span>${b.split('').map((c, i) => `<span class="dl ${mb[i] ? 'ok' : 'miss'}">${show(c)}</span>`).join('')}</div></div>`;
  }
  const bigWord = (w) => `<div class="reveal-word">${w.word.split('').map((c) => `<span>${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('')}</div>`;
  function gameHead(title) {
    return `${WW.topbar('home')}<div class="game-head"><b>${title}</b><span>${G.queue ? progressText() : ''}</span><span>⭐ ${G.correct || 0}</span></div>`;
  }
  function requeue(w) { G.requeued = G.requeued || {}; const n = G.requeued[w.id] || 0; if (n < 2) { G.queue.push(w.id); G.requeued[w.id] = n + 1; } }
  function finish(lines, extraGems = 0) {
    const gems = (G.gems || 0) + extraGems;
    WW.addGems(extraGems + (G.unpaid || 0)); WW.gameDone(G.id);
    WW.sfx.win(); WW.confetti(['✨', '⭐', '📚', ...WW.world().deco]);
    const missed = [...(G.missed || [])].map(WW.wordById).filter(Boolean);
    const id = G.id;
    G = null; endSession();
    screenOf(`${WW.topbar('home')}<div class="card results">
      <div class="intro-emoji">🧙‍♀️</div><h2>Great practice!</h2>
      ${lines.map((l) => `<p class="score">${l}</p>`).join('')}
      <p class="score">💎 +${gems}</p>
      ${missed.length ? `<p>Words to keep practicing: ${missed.map((w) => `<b>${esc(w.word)}</b>`).join(', ')}</p>` : ''}
      <div class="menu-row"><button class="btn primary" data-act="game" data-arg="${id}">🔁 Play again</button><button class="btn" data-act="home">🏠 Home</button></div></div>`);
  }
  const words = () => WW.me().words;

  // ======================= 🎧 HEAR & TYPE =======================
  function startHear() {
    G = { id: 'hear', queue: WW.practiceOrder(words()).map((w) => w.id), idx: 0, correct: 0, gems: 0, missed: new Set(), phase: 'ask' };
    askHear();
  }
  function askHear() {
    const w = word(); G.phase = 'ask';
    screenOf(`${gameHead('🎧 Hear & Type')}
      <div class="card play-card" data-hide-word="1"><p class="center">Listen, then type the word. Tap the buttons to hear it again.</p>${WW.promptBar(w)}
        <div id="hear-panel">${kbHTML()}</div></div>`);
    T = { value: '', onEnter: submitHear }; // after drawing the screen (drawing clears the old keyboard)
    WW.speech.sayDictation(w);
  }
  function submitHear(v) {
    const w = word();
    if (G.phase === 'copy') {
      if (isCorrect(v, w.word)) { T = null; WW.sfx.good(); return nextHear(); }
      WW.sfx.bad(); T.value = ''; setTyped(); return shake('typed');
    }
    const first = !G.missed.has(w.id);
    if (isCorrect(v, w.word)) {
      WW.recordRecall(w, true);
      if (first) { G.correct++; earn(gemsFor(w)); }
      WW.sfx.good(); T = null;
      document.getElementById('hear-panel').innerHTML = `<div class="feedback good"><div class="fb-title">✨ Correct! ${first ? `<span class="plus">+${gemsFor(w)} 💎</span>` : ''}</div>${bigWord(w)}<button class="btn big primary" id="next-btn" data-act="hear-next">Next ➜</button></div>`;
    } else {
      WW.recordRecall(w, false); G.missed.add(w.id); requeue(w); WW.sfx.bad();
      G.phase = 'copy'; T = { value: '', onEnter: submitHear };
      document.getElementById('hear-panel').innerHTML = `<div class="feedback bad"><div class="fb-title">Almost! Look closely:</div>${diffHTML(v, w.word)}<p><b>Now type it correctly once to lock it in 🔒</b></p></div>${kbHTML('✓ Done')}`;
      WW.speech.sayWord(w, true);
    }
  }
  function nextHear() { G.idx++; if (G.idx >= G.queue.length) return finish([`${G.correct} of ${new Set(G.queue).size} words right on the first try`]); askHear(); }

  // ======================= ✍️ WRITE IT =======================
  function startWrite() { G = { id: 'write', queue: WW.practiceOrder(words()).map((w) => w.id), idx: 0, correct: 0, gems: 0, missed: new Set() }; askWrite(); }
  function askWrite() {
    const w = word();
    screenOf(`${gameHead('✍️ Write It')}
      <div class="card play-card" data-hide-word="1"><p class="center">Listen, then write the word with your finger or pencil.</p>${WW.promptBar(w)}
        ${padHTML()}<div id="write-panel"><button class="btn big primary" data-act="write-check">✓ Check my writing</button></div></div>`);
    pad = makePad(); WW.speech.sayDictation(w);
  }
  function writeCheck() {
    if (!pad || pad.isEmpty()) return WW.toast('Write the word first ✍️');
    const w = word();
    document.getElementById('write-panel').innerHTML = `<div class="compare"><div class="note">Compare your writing with the real spelling, letter by letter:</div>${bigWord(w)}
      <p><b>Did you spell it exactly right?</b></p>
      <div class="menu-row"><button class="btn big primary" data-act="write-mark" data-arg="yes">✅ Yes, I got it!</button><button class="btn big" data-act="write-mark" data-arg="no">❌ Not quite</button></div></div>`;
  }
  function writeMark(ok) {
    const w = word(), m = WW.me(), first = !G.missed.has(w.id);
    m.stats.hand = (m.stats.hand || 0) + 1; if (m.stats.hand >= 25) WW.award('hand');
    WW.recordRecall(w, ok);
    if (ok) { if (first) { G.correct++; earn(gemsFor(w)); } WW.sfx.good(); return nextWrite(); }
    G.missed.add(w.id); requeue(w);
    pad.setGuide(w.word);
    document.getElementById('write-panel').innerHTML = `<div class="feedback bad"><div class="fb-title">Let's practice it: trace the word ✍️</div><button class="btn big primary" id="next-btn" data-act="write-next">Done tracing ➜</button></div>`;
    WW.speech.spellAloud(w);
  }
  function nextWrite() { G.idx++; if (G.idx >= G.queue.length) return finish([`${G.correct} of ${new Set(G.queue).size} words written right on the first try`]); askWrite(); }

  // ======================= 👀 LOOK · COVER · WRITE · CHECK =======================
  function startLcwc() { G = { id: 'lcwc', mode: WW.me().stats.lcwcMode || 'write', queue: WW.practiceOrder(words()).map((w) => w.id), idx: 0, correct: 0, gems: 0, missed: new Set() }; lookLcwc(); }
  function modeChips() { return `<div class="grade-pick center-row"><button class="chip ${G.mode === 'write' ? 'sel' : ''}" data-act="lcwc-mode" data-arg="write">✍️ Write</button><button class="chip ${G.mode === 'type' ? 'sel' : ''}" data-act="lcwc-mode" data-arg="type">⌨️ Type</button></div>`; }
  function lookLcwc() {
    const w = word(); T = null; pad = null;
    const m = w.meanings[0];
    screenOf(`${gameHead('👀 Look · Cover · Write · Check')}
      <div class="card play-card"><div class="steps-row"><span class="on">1 Look</span><span>2 Cover</span><span>3 Write</span><span>4 Check</span></div>
        <p class="center">Look carefully at the word. Say it, and notice the tricky parts!</p>${bigWord(w)}
        ${WW.promptBar(w, { spell: true })}${m ? `<p class="note center">📖 ${esc(m.def)}</p>` : ''}${modeChips()}
        <button class="btn big primary" id="next-btn" data-act="lcwc-cover">🙈 Cover it!</button></div>`);
    WW.speech.sayWord(w);
  }
  function coverLcwc() {
    const w = word();
    screenOf(`${gameHead('👀 Look · Cover · Write · Check')}
      <div class="card play-card" data-hide-word="1"><div class="steps-row"><span class="done">1 Look</span><span class="done">2 Cover</span><span class="on">3 ${G.mode === 'write' ? 'Write' : 'Type'}</span><span>4 Check</span></div>
        <p class="center">The word is covered! ${G.mode === 'write' ? 'Write' : 'Type'} it from memory.</p>${WW.promptBar(w)}
        ${G.mode === 'write' ? `${padHTML()}<div id="lcwc-panel"><button class="btn big primary" data-act="lcwc-check">4 ✓ Check</button></div>` : `<div id="lcwc-panel">${kbHTML()}</div>`}</div>`);
    if (G.mode === 'write') pad = makePad(); else T = { value: '', onEnter: (v) => lcwcResult(isCorrect(v, w.word), v) };
  }
  function lcwcCheck() {
    if (!pad || pad.isEmpty()) return WW.toast('Write the word first ✍️');
    document.getElementById('lcwc-panel').innerHTML = `<div class="compare"><div class="note">Uncover and check, letter by letter:</div>${bigWord(word())}<div class="menu-row"><button class="btn big primary" data-act="lcwc-mark" data-arg="yes">✅ I got it!</button><button class="btn big" data-act="lcwc-mark" data-arg="no">❌ Not quite</button></div></div>`;
  }
  function lcwcResult(ok, typed) {
    const w = word(), first = !G.missed.has(w.id); T = null;
    WW.recordRecall(w, ok);
    if (ok) { if (first) { G.correct++; earn(gemsFor(w)); } WW.sfx.good(); }
    else { G.missed.add(w.id); requeue(w); WW.sfx.bad(); }
    document.getElementById('lcwc-panel').innerHTML = `<div class="feedback ${ok ? 'good' : 'bad'}"><div class="fb-title">${ok ? '✨ You remembered it!' : 'Not yet. It will come back for another try!'}</div>${typed != null && !ok ? diffHTML(typed, w.word) : bigWord(w)}<button class="btn big primary" id="next-btn" data-act="lcwc-next">Next ➜</button></div>`;
  }
  function nextLcwc() { G.idx++; if (G.idx >= G.queue.length) return finish([`${G.correct} of ${new Set(G.queue).size} words spelled from memory on the first try`]); lookLcwc(); }

  // ======================= 🧩 LETTER PUZZLES =======================
  function startPuzzle() { G = { id: 'puzzle', queue: WW.practiceOrder(words()).map((w) => w.id), idx: 0, correct: 0, gems: 0, missed: new Set() }; askPuzzle(); }
  function askPuzzle() {
    const w = word(), kind = G.idx % 2 === 0 ? 'scramble' : 'missing';
    G.p = { kind, hinted: false, tries: 0 };
    if (kind === 'scramble') { G.p.tiles = scramble(w.word).map((c, i) => ({ c, i, used: false })); G.p.built = []; }
    else {
      G.p.blanks = blanksFor(w.word); G.p.fill = {};
      const need = G.p.blanks.map((i) => w.word[i].toLowerCase()), extra = [];
      const pool = 'aeioubcdgklmnprst'.split('').filter((c) => !need.includes(c));
      while (extra.length < Math.min(4, Math.max(2, 7 - need.length))) { const c = pickL(pool); if (!extra.includes(c)) extra.push(c); }
      G.p.tiles = shuf(need.concat(extra)).map((c, i) => ({ c, i, used: false }));
    }
    renderPuzzle(); WW.speech.sayWord(w);
  }
  function renderPuzzle() {
    const w = word(), p = G.p;
    let answer;
    if (p.kind === 'scramble') {
      const slots = []; let k = 0;
      for (const ch of w.word) { if (ch === ' ') slots.push('<span class="gap"></span>'); else { const t = p.built[k]; slots.push(t ? `<button class="slot filled" data-act="pz-back" data-arg="${k}">${esc(t.c)}</button>` : '<span class="slot"></span>'); k++; } }
      answer = slots.join('');
    } else {
      answer = w.word.split('').map((ch, i) => (p.blanks.includes(i) ? (p.fill[i] ? `<button class="slot filled" data-act="pz-unfill" data-arg="${i}">${esc(p.fill[i].c)}</button>` : '<span class="slot blank"></span>') : ch === ' ' ? '<span class="gap"></span>' : `<span class="slot fixed">${esc(ch)}</span>`)).join('');
    }
    screenOf(`${gameHead('🧩 Letter Puzzles')}
      <div class="card play-card" data-hide-word="1"><p class="center"><b>${p.kind === 'scramble' ? '🔀 Unscramble the letters!' : '🕳️ Fill in the missing letters!'}</b></p>${WW.promptBar(w)}
        <div class="slots" id="slots">${answer}</div>
        <div class="tiles">${p.tiles.map((t, ti) => `<button class="tile ${t.used ? 'used' : ''}" data-act="pz-tile" data-arg="${ti}" ${t.used ? 'disabled' : ''}>${esc(t.c)}</button>`).join('')}</div>
        <div class="menu-row"><button class="btn sm" data-act="pz-hint">💡 Hint</button><button class="btn sm ghost" data-act="pz-reset">🔄 Start over</button></div>
        <div id="pz-panel"></div></div>`);
  }
  function puzzleFull() { const w = word(), p = G.p; return p.kind === 'scramble' ? p.built.length === w.word.replace(/ /g, '').length : p.blanks.every((i) => p.fill[i]); }
  function puzzleCheck() {
    const w = word(), p = G.p;
    const attempt = p.kind === 'scramble' ? (() => { let k = 0; return w.word.split('').map((ch) => (ch === ' ' ? ' ' : p.built[k++].c)).join(''); })() : w.word.split('').map((ch, i) => (p.blanks.includes(i) ? p.fill[i].c : ch)).join('');
    if (isCorrect(attempt, w.word)) {
      if (!p.hinted && p.tries === 0) { G.correct++; earn(1); }
      WW.sfx.good();
      document.getElementById('pz-panel').innerHTML = `<div class="feedback good"><div class="fb-title">🧩 Solved!</div>${bigWord(w)}<button class="btn big primary" id="next-btn" data-act="pz-next">Next ➜</button></div>`;
      document.querySelectorAll('.tile, .slot.filled').forEach((b) => { b.disabled = true; });
    } else { p.tries++; G.missed.add(w.id); WW.sfx.bad(); shake('slots'); WW.toast(p.tries >= 2 ? 'Try the 💡 Hint!' : 'Not quite. Tap a letter to take it back.'); }
  }
  function puzzleHint() {
    const w = word(), p = G.p; p.hinted = true;
    if (p.kind === 'scramble') {
      const target = w.word.replace(/ /g, '').toLowerCase();
      let k = 0; while (k < p.built.length && p.built[k].c === target[k]) k++;
      p.built.splice(k).forEach((t) => { t.used = false; });
      const t = p.tiles.find((x) => !x.used && x.c === target[k]); if (t) { t.used = true; p.built.push(t); }
    } else {
      const i = p.blanks.find((b) => !p.fill[b] || p.fill[b].c !== w.word[b].toLowerCase());
      if (i != null) { if (p.fill[i]) p.fill[i].used = false; const t = p.tiles.find((x) => !x.used && x.c === w.word[i].toLowerCase()); if (t) { t.used = true; p.fill[i] = t; } }
    }
    renderPuzzle(); if (puzzleFull()) puzzleCheck();
  }
  function nextPuzzle() { G.idx++; if (G.idx >= G.queue.length) return finish([`${G.correct} of ${G.queue.length} puzzles solved with no hints or mistakes`]); askPuzzle(); }

  // ======================= 🐝 SPELLING BEE BOSS =======================
  function startBoss() {
    const ws = WW.practiceOrder(words()).slice(0, 15), boss = WW.world().boss;
    G = { id: 'boss', queue: ws.map((w) => w.id), idx: 0, hp: ws.length, max: ws.length, hearts: 3, correct: 0, gems: 0, missed: new Set(), boss };
    screenOf(`${WW.topbar('home')}<div class="card intro">
      <div class="intro-emoji boss-bob">${boss.emoji}</div><h2>🐝 Spelling Bee: ${esc(boss.name)}</h2>
      <p class="taunt">"Spell my words right… if you can!"</p>
      <ul class="rules"><li>Hear each word and type it. Every correct spelling hits the boss!</li><li>You have ❤️❤️❤️. A wrong spelling${WW.settings().timer !== 'off' ? ' or running out of time' : ''} costs a heart.</li>
      <li>${WW.settings().timer === 'off' ? 'No timer.' : `${WW.settings().timer === 'relaxed' ? 60 : 30} seconds per word.`}</li></ul>
      <button class="btn big danger" data-act="boss-go">⚔️ FIGHT!</button></div>`);
  }
  function askBoss(anim) {
    const w = word(), secs = WW.settings().timer === 'off' ? 0 : WW.settings().timer === 'relaxed' ? 60 : 30;
    screenOf(`${WW.topbar('home')}
      <div class="boss-area"><div class="boss-emoji ${anim || ''}">${G.boss.emoji}</div><div class="boss-stats"><div class="boss-name">${esc(G.boss.name)}</div>
        <div class="hp"><div class="hp-fill" style="width:${(G.hp / G.max) * 100}%"></div></div><div class="hearts">${'❤️'.repeat(G.hearts)}${'🤍'.repeat(3 - G.hearts)}</div></div></div>
      ${secs ? '<div class="timer"><div id="timer-fill" class="timer-fill"></div><span id="timer-label"></span></div>' : ''}
      <div class="card play-card" data-hide-word="1">${WW.promptBar(w)}<div id="boss-panel">${kbHTML('⚔️ Attack')}</div></div>`);
    T = { value: '', onEnter: (v) => bossAnswer(isCorrect(v, w.word), v) };
    WW.speech.sayDictation(w);
    if (secs) {
      const end = Date.now() + secs * 1000;
      timerId = setInterval(() => {
        const left = (end - Date.now()) / 1000, f = document.getElementById('timer-fill'), l = document.getElementById('timer-label');
        if (f) { f.style.width = Math.max(0, (left / secs) * 100) + '%'; f.classList.toggle('low', left < 8); }
        if (l) l.textContent = Math.max(0, Math.ceil(left)) + 's';
        if (left <= 0) { clearInterval(timerId); timerId = null; bossAnswer(false, null); }
      }, 200);
    }
  }
  function bossAnswer(ok, typed) {
    if (timerId) { clearInterval(timerId); timerId = null; }
    const w = word(); T = null;
    WW.recordRecall(w, ok);
    if (ok) { G.hp--; G.correct++; earn(gemsFor(w)); WW.sfx.hit(); }
    else { G.hearts--; G.missed.add(w.id); G.queue.push(w.id); WW.sfx.bad(); }
    const over = G.hp <= 0 || G.hearts <= 0;
    document.getElementById('boss-panel').innerHTML = `<div class="feedback ${ok ? 'good' : 'bad'}"><div class="fb-title">${ok ? '💥 Direct hit!' : typed == null ? '⏰ Time\'s up!' : '🛡️ The boss blocked it!'}</div>${ok ? '' : typed ? diffHTML(typed, w.word) : bigWord(w)}
      <button class="btn big primary" id="next-btn" data-act="boss-next">${over ? 'See what happened ➜' : 'Next word ➜'}</button></div>`;
    const be = document.querySelector('.boss-emoji'); if (be) { be.classList.add(ok ? 'hit' : 'attack'); }
    const hpf = document.querySelector('.hp-fill'); if (hpf) hpf.style.width = (G.hp / G.max) * 100 + '%';
    const h = document.querySelector('.hearts'); if (h) h.innerHTML = '❤️'.repeat(G.hearts) + '🤍'.repeat(3 - G.hearts);
  }
  function nextBoss() {
    if (G.hp <= 0) { WW.award('boss'); return finish([`🏆 You defeated ${esc(G.boss.name)}!`, `${G.correct} words spelled correctly`], 15); }
    if (G.hearts <= 0) {
      const b = G.boss; WW.gameDone('boss'); G = null; endSession();
      return screenOf(`${WW.topbar('home')}<div class="card results"><div class="intro-emoji">${b.emoji}</div><h2>The boss wins this time…</h2><p>Practice with the other games, then come back for a rematch!</p><div class="menu-row"><button class="btn danger" data-act="game" data-arg="boss">🔁 Rematch</button><button class="btn" data-act="home">🏠 Home</button></div></div>`);
    }
    G.idx++; askBoss();
  }

  // ======================= 📝 TEST DAY =======================
  function startTest() {
    G = { id: 'test', mode: WW.me().stats.testMode || 'write', queue: shuf(words()).map((w) => w.id), idx: 0, answers: {}, marks: {} };
    screenOf(`${WW.topbar('home')}<div class="card intro"><div class="intro-emoji">📝</div><h2>Test Day practice</h2>
      <p>Just like the real test: you'll hear <b>${G.queue.length}</b> words in a mixed-up order. Each word is said, used in a sentence, then said again. No hints, and you'll see your score at the end.</p>
      <div class="label">How will you answer?</div>${modeChips().replace(/lcwc-mode/g, 'test-mode')}
      <button class="btn big primary" data-act="test-go">Begin the test ✏️</button></div>`);
  }
  function askTest() {
    const w = word(), n = G.idx + 1;
    screenOf(`${WW.topbar('home')}<div class="game-head"><b>📝 Test Day</b><span>Word ${n} of ${G.queue.length}</span><span>${G.mode === 'write' ? '✍️' : '⌨️'}</span></div>
      <div class="card play-card"><div class="test-num">${n}.</div>
        <div class="say-bar"><button class="btn say" data-act="test-repeat">🔁 Hear it again</button><button class="btn say" data-act="say-slow" data-arg="${w.id}">🐢 Slowly</button></div>
        ${G.mode === 'write' ? `${padHTML()}<button class="btn big primary" data-act="test-next">Next word ➜</button>` : kbHTML('Next word ➜')}</div>`);
    if (G.mode === 'write') pad = makePad(); else T = { value: '', onEnter: (v) => { G.answers[w.id] = v; nextTest(); } };
    WW.speech.sayDictation(w, n);
  }
  function nextTest() {
    const w = word();
    if (G.mode === 'write') { if (!pad || pad.isEmpty()) return WW.toast('Write the word first ✍️'); G.answers[w.id] = pad.image(); }
    T = null; G.idx++;
    if (G.idx < G.queue.length) return askTest();
    if (G.mode === 'type') G.queue.forEach((id) => { G.marks[id] = isCorrect(G.answers[id], WW.wordById(id).word); });
    reviewTest();
  }
  function reviewTest() {
    const all = G.queue.map(WW.wordById), marked = all.every((w) => G.marks[w.id] != null);
    screenOf(`${WW.topbar('home')}<div class="card results test-review"><h2>📝 Check your test</h2>
      ${G.mode === 'write' && !marked ? '<p class="note">Compare each word you wrote with the real spelling, then tap ✓ or ✗. Be honest. That\'s how wizards get better!</p>' : ''}
      <table class="board">${all.map((w, i) => `<tr><td class="rank">${i + 1}.</td>
        <td>${G.mode === 'write' ? `<img class="test-img" src="${G.answers[w.id]}" alt="your writing">` : `<span class="${G.marks[w.id] ? 'right' : 'wrong'}">${esc(G.answers[w.id] || '')}</span>`}</td>
        <td><b>${esc(w.word)}</b></td>
        <td>${G.mode === 'write' ? `<button class="chip ${G.marks[w.id] === true ? 'sel' : ''}" data-act="test-mark" data-arg="${w.id},1">✓</button><button class="chip ${G.marks[w.id] === false ? 'sel bad' : ''}" data-act="test-mark" data-arg="${w.id},0">✗</button>` : G.marks[w.id] ? '✅' : '❌'}</td></tr>`).join('')}</table>
      <button class="btn big primary" data-act="test-finish" ${marked ? '' : 'disabled'}>${marked ? 'See my score ➜' : 'Mark every word to see your score'}</button></div>`);
  }
  function finishTest() {
    const all = G.queue.map(WW.wordById), right = all.filter((w) => G.marks[w.id]);
    all.forEach((w) => WW.recordRecall(w, !!G.marks[w.id]));
    G.missed = new Set(all.filter((w) => !G.marks[w.id]).map((w) => w.id));
    const pct = Math.round((right.length / all.length) * 100), m = WW.me();
    G.gems = G.unpaid = right.reduce((s, w) => s + gemsFor(w), 0);
    const best = m.stats.best.test || 0; if (pct > best) m.stats.best.test = pct; WW.save();
    if (pct === 100) WW.award('perfect');
    finish([`Score: <b>${right.length} / ${all.length}</b> (${pct}%)${pct > best && best ? ' 🎉 New best!' : ''}`, pct >= 90 ? '🌟 Test-day ready!' : pct >= 70 ? 'Nice work! A bit more practice on the missed words.' : 'Keep practicing: the games will help these words stick.'], pct >= 90 ? 10 : 0);
  }

  // ======================= 🔍 WORD SEARCH =======================
  const FOUND_COLORS = 8;
  function startSearch() {
    const ws = words(), built = buildSearch(ws.map((w) => w.word));
    if (!built) return WW.toast('Could not build a puzzle from these words');
    G = { id: 'search', built, found: [], sel: null, gems: 0, correct: 0, hint: null };
    G.list = built.placed.map((p) => ({ p, w: ws.find((w) => w.word.toUpperCase().replace(/[^A-Z]/g, '') === p.word) }));
    renderSearch();
  }
  function cellsOf(p) { return Array.from({ length: p.word.length }, (_, i) => [p.r0 + p.dr * i, p.c0 + p.dc * i]); }
  function renderSearch() {
    const { size, grid } = G.built, cls = {};
    G.found.forEach((f, fi) => cellsOf(f.p).forEach(([r, c]) => { cls[r * size + c] = 'found f' + (fi % FOUND_COLORS); }));
    if (G.sel) cls[G.sel[0] * size + G.sel[1]] = (cls[G.sel[0] * size + G.sel[1]] || '') + ' sel';
    if (G.hint != null) cls[G.hint] = (cls[G.hint] || '') + ' hint';
    screenOf(`${WW.topbar('home')}<div class="game-head"><b>🔍 Word Search</b><span>Found ${G.found.length} of ${G.list.length}</span><span></span></div>
      <div class="card play-card"><p class="center">Tap the <b>first</b> letter of a word, then its <b>last</b> letter. Words go across, down, and diagonally.</p>
        <div class="ws-grid" style="grid-template-columns:repeat(${size},1fr)">${grid.map((ch, i) => `<button class="ws-cell ${cls[i] || ''}" data-act="ws-cell" data-arg="${i}">${ch}</button>`).join('')}</div>
        <div class="ws-list">${G.list.map((x) => `<span class="${G.found.includes(x) ? 'done' : ''}">${esc(x.w ? x.w.word : x.p.word.toLowerCase())}</span>`).join('')}</div>
        <div class="menu-row"><button class="btn sm" data-act="ws-hint">💡 Hint</button></div></div>`);
  }
  function searchTap(i) {
    const size = G.built.size, r = Math.floor(i / size), c = i % size;
    G.hint = null;
    if (!G.sel) { G.sel = [r, c]; WW.sfx.tap(); return renderSearch(); }
    const [r0, c0] = G.sel; G.sel = null;
    if (r0 === r && c0 === c) return renderSearch();
    const hit = G.list.find((x) => !G.found.includes(x) && ((x.p.r0 === r0 && x.p.c0 === c0 && x.p.r0 + x.p.dr * (x.p.word.length - 1) === r && x.p.c0 + x.p.dc * (x.p.word.length - 1) === c) || (x.p.r0 === r && x.p.c0 === c && x.p.r0 + x.p.dr * (x.p.word.length - 1) === r0 && x.p.c0 + x.p.dc * (x.p.word.length - 1) === c0)));
    if (hit) {
      G.found.push(hit); earn(1); WW.sfx.good();
      if (hit.w) { WW.speech.sayWord(hit.w); const m = hit.w.meanings[0]; WW.toast(`✨ <b>${esc(hit.w.word)}</b>${m ? `<br><small>${esc(m.def.slice(0, 90))}</small>` : ''}`); }
      if (G.found.length === G.list.length) { renderSearch(); return setTimeout(() => finish([`You found all ${G.list.length} words! 🔍`], 4), 900); }
    } else { WW.sfx.bad(); }
    renderSearch();
  }
  function searchHint() {
    const left = G.list.filter((x) => !G.found.includes(x)); if (!left.length) return;
    const x = pickL(left); G.hint = x.p.r0 * G.built.size + x.p.c0; renderSearch();
    if (x.w) WW.speech.sayWord(x.w);
  }

  // ======================= 🃏 MEMORY MATCH =======================
  const clue = (w) => { const m = w.meanings.find((x) => x.def); if (m) return m.def.length > 80 ? m.def.slice(0, 78) + '…' : m.def; const s = WW.speech.firstSentence(w); return s ? WW.hideWord(s, w.word) : ''; };
  function startMemory() {
    const ws = WW.practiceOrder(words()).filter((w) => clue(w));
    if (ws.length < 2) return WW.toast('Memory Match needs at least 2 words with meanings');
    G = { id: 'memory', rest: ws, round: 0, moves: 0, gems: 0, correct: 0 };
    dealMemory();
  }
  function dealMemory() {
    const batch = G.rest.splice(0, 6); G.round++;
    G.cards = shuf(batch.flatMap((w) => [{ id: w.id, kind: 'word', up: false, done: false }, { id: w.id, kind: 'def', up: false, done: false }]));
    G.open = []; renderMemory();
  }
  function renderMemory() {
    screenOf(`${WW.topbar('home')}<div class="game-head"><b>🃏 Memory Match</b><span>Round ${G.round}</span><span>Moves: ${G.moves}</span></div>
      <div class="card play-card"><p class="center">Flip two cards. Match each <b>word</b> with its <b>meaning</b>!</p>
        <div class="mem-grid">${G.cards.map((c, i) => { const w = WW.wordById(c.id); return `<button class="mem-card ${c.up || c.done ? 'up' : ''} ${c.done ? 'done' : ''} ${c.kind}" data-act="mem-flip" data-arg="${i}">${c.up || c.done ? (c.kind === 'word' ? `<b>${esc(w.word)}</b>` : `<small>${clue(w)}</small>`) : '<span class="mem-back">🧙‍♀️</span>'}</button>`; }).join('')}</div></div>`);
  }
  function memFlip(i) {
    const c = G.cards[i]; if (c.up || c.done || G.open.length >= 2) return;
    c.up = true; G.open.push(c);
    if (c.kind === 'word') WW.speech.sayWord(WW.wordById(c.id));
    if (G.open.length === 2) {
      G.moves++;
      const [a, b] = G.open;
      if (a.id === b.id) { a.done = b.done = true; G.open = []; G.correct++; earn(1); WW.sfx.good(); }
      else { WW.sfx.bad(); autoId = setTimeout(() => { a.up = b.up = false; G.open = []; if (G && G.id === 'memory') renderMemory(); }, 1300); }
    }
    renderMemory();
    if (G.cards.every((x) => x.done)) {
      if (G.rest.length) autoId = setTimeout(() => { WW.toast('🎉 Round complete! Next round…'); dealMemory(); }, 1000);
      else autoId = setTimeout(() => finish([`All ${G.correct} pairs matched in ${G.moves} moves!`], 3), 1000);
    }
  }

  // ======================= routing =======================
  const STARTS = { hear: startHear, write: startWrite, lcwc: startLcwc, puzzle: startPuzzle, boss: startBoss, test: startTest, search: startSearch, memory: startMemory };
  function start(id) { if (!words().length) return WW.toast('Add some words first ✏️'); endSession(); G = null; (STARTS[id] || startHear)(); }
  function route(act, arg) {
    switch (act) {
      case 'home': if (G && WW.getScreen() === 'game' && !confirm('Leave this game? Words you finished are already saved.')) return true; G = null; endSession(); return false;
      case 'pad-undo': if (pad) pad.undo(); return true;
      case 'pad-clear': if (pad) pad.clear(); return true;
      case 'hear-next': nextHear(); return true;
      case 'write-check': writeCheck(); return true;
      case 'write-mark': writeMark(arg === 'yes'); return true;
      case 'write-next': nextWrite(); return true;
      case 'lcwc-mode': G.mode = arg; WW.me().stats.lcwcMode = arg; WW.save(); lookLcwc(); return true;
      case 'lcwc-cover': WW.speech.stop(); coverLcwc(); return true;
      case 'lcwc-check': lcwcCheck(); return true;
      case 'lcwc-mark': lcwcResult(arg === 'yes', null); return true;
      case 'lcwc-next': nextLcwc(); return true;
      case 'pz-tile': {
        const p = G.p, t = p.tiles[+arg]; if (t.used) return true;
        if (p.kind === 'scramble') { t.used = true; p.built.push(t); } else { const i = p.blanks.find((b) => !p.fill[b]); if (i == null) return true; t.used = true; p.fill[i] = t; }
        WW.sfx.tap(); renderPuzzle(); if (puzzleFull()) puzzleCheck(); return true;
      }
      case 'pz-back': { const p = G.p; p.built.splice(+arg).forEach((t) => { t.used = false; }); renderPuzzle(); return true; }
      case 'pz-unfill': { const p = G.p, i = +arg; if (p.fill[i]) { p.fill[i].used = false; delete p.fill[i]; } renderPuzzle(); return true; }
      case 'pz-reset': { const p = G.p; p.tiles.forEach((t) => { t.used = false; }); p.built = []; p.fill = {}; renderPuzzle(); return true; }
      case 'pz-hint': puzzleHint(); return true;
      case 'pz-next': nextPuzzle(); return true;
      case 'boss-go': askBoss(); return true;
      case 'boss-next': nextBoss(); return true;
      case 'test-mode': WW.me().stats.testMode = arg; WW.save(); startTest(); return true;
      case 'test-go': askTest(); return true;
      case 'test-repeat': WW.speech.sayDictation(word(), G.idx + 1); return true;
      case 'test-next': nextTest(); return true;
      case 'test-mark': { const [id, v] = arg.split(','); G.marks[id] = v === '1'; reviewTest(); return true; }
      case 'test-finish': finishTest(); return true;
      case 'ws-cell': searchTap(+arg); return true;
      case 'ws-hint': searchHint(); return true;
      case 'mem-flip': memFlip(+arg); return true;
    }
    return false;
  }
  WW.games = { start, route, _debug: { session: () => G, typing: () => T } };
})();
