// Run with: node math-quest/tests/check-questions.js
// Generates many questions for every topic and level, and verifies that each
// one is well-formed and that its own correct answer is accepted.
global.window = global;
require('../js/questions.js');
require('../js/worlds.js');
const { Q, WORLDS } = window.MQ;

let failures = 0, total = 0;
const fail = (msg, q) => { failures++; if (failures <= 25) console.error('FAIL:', msg, '\n   ', q && q.q); };

for (const topic of Q.topics) {
  for (const level of [1, 2, 3]) {
    for (let i = 0; i < 400; i++) {
      total++;
      let q;
      try { q = Q.generate(topic, level); } catch (e) { fail(`${topic} L${level} threw ${e.stack}`); continue; }
      const text = q.q + q.hint + q.explain + Q.answerHTML(q.a);
      if (/undefined|NaN|Infinity|\[object/.test(text)) fail(`${topic} L${level} bad text`, q);
      const a = q.a;
      if (a.kind === 'num' && !Number.isFinite(a.value)) fail(`${topic} L${level} non-finite`, q);
      if (a.kind === 'frac' && (!Number.isInteger(a.n) || !Number.isInteger(a.d) || a.d === 0)) fail(`${topic} L${level} bad fraction ${a.n}/${a.d}`, q);
      if (a.kind === 'choice') {
        if (a.correct < 0 || a.choices.length < 2) fail(`${topic} L${level} bad choices`, q);
        if (new Set(a.choices).size !== a.choices.length) fail(`${topic} L${level} duplicate choices`, q);
      }
      const res = Q.check(a, Q.sampleInput(a));
      if (!res.ok) fail(`${topic} L${level} own answer rejected (${Q.sampleInput(a)}) ${JSON.stringify(res)}`, q);
    }
  }
}

// every mission topic in the worlds must exist
for (const w of WORLDS) for (const m of w.missions) if (!Q.topics.includes(m.topic)) fail(`world ${w.id} uses missing topic ${m.topic}`);

// answer checker spot checks
const spot = [
  [{ kind: 'frac', n: 6, d: 8, simplest: false }, '3/4', true],
  [{ kind: 'frac', n: 6, d: 8, simplest: false }, '0.75', true],
  [{ kind: 'frac', n: 6, d: 8, simplest: true }, '6/8', 'retry'],
  [{ kind: 'frac', n: 7, d: 3, simplest: true }, '2 1/3', true],
  [{ kind: 'frac', n: 7, d: 3, simplest: true }, '7/3', true],
  [{ kind: 'frac', n: -3, d: 2, simplest: false }, '-1 1/2', true],
  [{ kind: 'num', value: 1200, tol: 1e-6 }, '1,200', true],
  [{ kind: 'num', value: 0.125, tol: 1e-6 }, '1/8', true],
  [{ kind: 'num', value: -4, tol: 1e-6 }, '−4', true],
  [{ kind: 'num', value: 5, tol: 1e-6 }, 'abc', 'retry'],
];
for (const [a, input, want] of spot) {
  const r = Q.check(a, input);
  const got = r.retry ? 'retry' : r.ok;
  total++;
  if (got !== want) fail(`check(${JSON.stringify(a)}, "${input}") = ${got}, want ${want}`);
}

console.log(`${total} checks, ${failures} failures`);
process.exit(failures ? 1 : 0);
