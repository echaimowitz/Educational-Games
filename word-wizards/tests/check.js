// Run with: node word-wizards/tests/check.js
global.window = global;
require('../js/dict.js');
require('../js/games.js');
const { parseEntries } = window.WW.dict;
const { isCorrect, lcsMarks, blanksFor, scramble, buildSearch } = window.WW.spellUtil;

let checks = 0, failures = 0;
const ok = (cond, msg) => { checks++; if (!cond) { failures++; console.error('FAIL:', msg); } };

// ---- dictionary parsing on real saved responses ----
for (const w of ['because', 'bright', 'receive', 'bear', 'thought', 'necessary']) {
  const r = parseEntries(require('./fixtures/' + w + '.json'));
  ok(r.found, `${w}: found`);
  ok(/^https:\/\/.+\.mp3$/.test(r.audio), `${w}: has a recording`);
  ok(r.meanings.length >= 1 && r.meanings.length <= 2, `${w}: 1-2 meanings`);
  r.meanings.forEach((m) => { ok(m.def && m.pos, `${w}: meaning has pos + definition`); m.sentences.forEach((s) => ok(/^["“'‘A-Z]/.test(s) && s.split(' ').length >= 4, `${w}: sentence looks like a sentence: ${s}`)); });
  ok(r.alts.length > 0, `${w}: has other meanings to choose from`);
}
const bear = parseEntries(require('./fixtures/bear.json'));
ok(/mammal/.test(bear.meanings[0].def), 'bear: animal meaning first');
ok(!bear.meanings.some((m) => /price/i.test(m.def)), 'bear: stock-market meaning skipped');
const bright = parseEntries(require('./fixtures/bright.json'));
ok(bright.meanings[0].pos === 'adjective' && !bright.meanings.some((m) => /brush/.test(m.def)), 'bright: adjective, no paintbrush');
ok(!parseEntries({ title: 'No Definitions Found' }).found, 'not-found response handled');
ok(!parseEntries(null).found, 'empty response handled');

// ---- answer checking ----
ok(isCorrect('Because', 'because') && isCorrect('  because ', 'because'), 'case and spaces ignored');
ok(isCorrect('don’t', "don't"), 'curly apostrophe accepted');
ok(!isCorrect('becuase', 'because'), 'misspelling rejected');
ok(isCorrect('ice  cream', 'ice cream'), 'double spaces ok');
const { ma, mb } = lcsMarks('becuase', 'because');
ok(ma.filter(Boolean).length === 6 && mb.filter((x) => !x).length === 1, 'letter diff marks the mistake');

// ---- puzzles ----
const words = ['because', 'bright', 'receive', 'necessary', 'knight', 'thought', 'wrinkle', 'Wednesday', 'ice cream', "don't", 'a', 'by'];
for (const w of words) {
  for (let t = 0; t < 200; t++) {
    const b = blanksFor(w), letters = w.replace(/[^a-z]/gi, '').length;
    ok(b.length >= 1 || letters <= 1, `${w}: at least one blank`);
    ok(b.length < Math.max(2, letters), `${w}: never every letter blank`);
    ok(b.every((i) => /[a-z]/i.test(w[i])), `${w}: only letters are blanked`);
    const s = scramble(w);
    ok(s.length === w.replace(/ /g, '').length, `${w}: scramble keeps every letter`);
    ok(s.slice().sort().join('') === w.toLowerCase().replace(/ /g, '').split('').sort().join(''), `${w}: scramble same letters`);
    if (new Set(w.replace(/ /g, '')).size > 1) ok(s.join('') !== w.toLowerCase().replace(/ /g, ''), `${w}: scramble actually scrambled`);
  }
}
ok(blanksFor('knight').includes(0), 'silent k is a blank in knight');

// ---- word search ----
const lists = [words, ['beautiful', 'neighbor', 'separate', 'definitely', 'accommodate', 'rhythm', 'embarrass', 'occurrence', 'conscience', 'miniature', 'mischievous', 'privilege', 'questionnaire', 'restaurant', 'thorough', 'vacuum', 'weird', 'yacht', 'guarantee', 'license'], ['cat', 'dog']];
for (const list of lists) for (let t = 0; t < 30; t++) {
  const s = buildSearch(list);
  ok(s, 'word search built');
  if (!s) continue;
  ok(s.grid.length === s.size * s.size && s.grid.every((c) => /^[A-Z]$/.test(c)), 'grid full of letters');
  const want = [...new Set(list.map((w) => w.toUpperCase().replace(/[^A-Z]/g, '')).filter((w) => w.length > 1))];
  ok(s.placed.length === want.length, `all words placed (${s.placed.length}/${want.length})`);
  for (const p of s.placed) {
    let read = '';
    for (let i = 0; i < p.word.length; i++) read += s.grid[(p.r0 + p.dr * i) * s.size + p.c0 + p.dc * i];
    ok(read === p.word, `placed word reads correctly: ${p.word}`);
    ok(p.dc >= 0 && !(p.dr === 0 && p.dc === 0), 'never backwards');
  }
}

console.log(`${checks} checks, ${failures} failures`);
process.exit(failures ? 1 : 0);
