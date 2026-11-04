/* Math Quest: Rainbow Realms — question generators.
 * Every topic generator takes a level (1 = warm-up, 2 = tricky, 3 = expert)
 * and returns { q: html, a: answerSpec, hint: html, explain: html }.
 * Answer specs:
 *   { kind:'num', value, tol }            any equal number (fractions typed are evaluated)
 *   { kind:'frac', n, d, simplest }       equal fraction; simplest=true requires lowest terms
 *   { kind:'choice', choices:[html], correct:index }
 */
(function () {
  'use strict';
  const MQ = (window.MQ = window.MQ || {});

  // ---------- helpers ----------
  const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; };
  const lcm = (a, b) => (a / gcd(a, b)) * b;
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const nz = (a, b) => { let x; do { x = R(a, b); } while (x === 0); return x; };
  const sign = () => (Math.random() < 0.5 ? -1 : 1);
  const MINUS = '−';
  const rnd = (x, p = 8) => Number(x.toFixed(p));
  const fmt = (n) => { const s = Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 8 }); return n < 0 ? MINUS + s : s; };
  const sp = (n) => (n < 0 ? `(${fmt(n)})` : fmt(n)); // negative numbers in parentheses
  const fr = (n, d) => (typeof n === 'number' && n < 0 ? MINUS + fr(-n, d) : `<span class="frac"><span class="fn">${n}</span><span class="fd">${d}</span></span>`);
  const mixed = (w, n, d) => `${w}&#8239;${fr(n, d)}`;
  const money = (x) => '$' + x.toFixed(2);
  const pw = (b, e) => `${b}<sup>${e < 0 ? MINUS + -e : e}</sup>`;
  const lv = (l, a, b, c) => (l === 1 ? a : l === 2 ? b : c);
  const big = (s) => `<div class="big">${s}</div>`;
  // linear term formatting: coef x, with sign handling
  const term = (c, v, first) => {
    const abs = Math.abs(c);
    const body = (abs === 1 && v ? '' : abs) + (v || '');
    if (first) return (c < 0 ? MINUS : '') + body;
    return (c < 0 ? ` ${MINUS} ` : ' + ') + body;
  };
  const constTerm = (c) => (c === 0 ? '' : c < 0 ? ` ${MINUS} ${-c}` : ` + ${c}`);
  const simp = (n, d) => { const g = gcd(n, d) || 1; let a = n / g, b = d / g; if (b < 0) { a = -a; b = -b; } return [a, b]; };
  const fracHTML = (n, d) => { const [a, b] = simp(n, d); if (b === 1) return fmt(a); const neg = a < 0, A = Math.abs(a); const core = A > b ? `${fr(A, b)} = ${mixed(Math.floor(A / b), A % b, b)}` : fr(A, b); return neg ? MINUS + (A > b ? `${fr(A, b)} = ${MINUS}${mixed(Math.floor(A / b), A % b, b)}` : fr(A, b)) : core; };

  // ---------- answers ----------
  const num = (value, tol) => ({ kind: 'num', value: rnd(value), tol: tol == null ? 1e-6 : tol });
  const cash = (value) => ({ kind: 'num', value: rnd(value, 2), tol: 0.005, money: true });
  const frac = (n, d, simplest) => { if (d < 0) { n = -n; d = -d; } return { kind: 'frac', n, d, simplest: !!simplest }; };
  const choice = (correct, distractors) => {
    let opts = [correct];
    distractors.forEach((x) => { if (!opts.includes(x) && opts.length < 4) opts.push(x); });
    opts = shuffle(opts);
    return { kind: 'choice', choices: opts, correct: opts.indexOf(correct) };
  };
  const choiceFixed = (list, correct) => ({ kind: 'choice', choices: list.slice(), correct: list.indexOf(correct) });

  function parseAnswer(raw) {
    const s = String(raw).replace(/,/g, '').replace(/−/g, '-').replace(/\$/g, '').replace(/\s+/g, ' ').trim();
    let m;
    if ((m = s.match(/^(-)?(\d+) (\d+)\/(\d+)$/))) {
      const w = +m[2], n = +m[3], d = +m[4];
      if (d === 0) return null;
      const sg = m[1] ? -1 : 1;
      return { form: 'mixed', n: sg * (w * d + n), d, partN: n, value: sg * (w + n / d) };
    }
    if ((m = s.match(/^(-)?(\d+)\/(\d+)$/))) {
      const n = +m[2], d = +m[3];
      if (d === 0) return null;
      const sg = m[1] ? -1 : 1;
      return { form: 'frac', n: sg * n, d, value: (sg * n) / d };
    }
    if (/^-?(\d+\.?\d*|\.\d+)$/.test(s)) {
      const v = parseFloat(s);
      if (/\./.test(s)) return { form: 'dec', value: v };
      return { form: 'int', value: v, n: v, d: 1 };
    }
    return null;
  }

  function check(a, input) {
    if (a.kind === 'choice') return { ok: input === a.correct };
    const v = parseAnswer(input);
    if (!v) return { retry: true, msg: 'Type a number like 12, −4, 3.5 or 3/4 (mixed number: 2 1/3).' };
    if (a.kind === 'num') return { ok: Math.abs(v.value - a.value) <= a.tol + 1e-9 };
    const equal = v.form === 'dec' ? Math.abs(v.value - a.n / a.d) < 1e-9 : v.n * a.d === a.n * v.d;
    if (!equal) return { ok: false };
    if (a.simplest) {
      const tip = 'Correct value! Now write it in simplest form.';
      if (v.form === 'dec') return { retry: true, msg: 'Correct value! Write it as a fraction in simplest form.' };
      if (v.form === 'frac' && (gcd(v.n, v.d) !== 1 || v.d === 1)) return { retry: true, msg: tip };
      if (v.form === 'mixed' && (v.partN === 0 || v.partN >= v.d || gcd(v.partN, v.d) !== 1)) return { retry: true, msg: tip };
    }
    return { ok: true };
  }

  function answerHTML(a) {
    if (a.kind === 'choice') return a.choices[a.correct];
    if (a.kind === 'num') return a.money ? money(a.value) : fmt(a.value);
    return fracHTML(a.n, a.d);
  }

  // canonical typed answer (used by tests)
  function sampleInput(a) {
    if (a.kind === 'choice') return a.correct;
    if (a.kind === 'num') return String(a.value);
    const [n, d] = simp(a.n, a.d);
    return d === 1 ? String(n) : `${n}/${d}`;
  }

  const PLACE = { 1: 'ones', 10: 'tens', 100: 'hundreds', 1000: 'thousands', 10000: 'ten-thousands', 100000: 'hundred-thousands', 1000000: 'millions' };
  function underlineDigit(n, i) {
    const s = String(n), pos = s.length - 1 - i;
    let out = '';
    for (let k = 0; k < s.length; k++) {
      const fromRight = s.length - 1 - k;
      out += k === pos ? `<u>${s[k]}</u>` : s[k];
      if (fromRight > 0 && fromRight % 3 === 0) out += ',';
    }
    return out;
  }

  const G = {};

  // ======================= GRADE 4 — Rainbow Reef =======================
  G.g4_round = (l) => {
    if (l > 1 && Math.random() < 0.35) {
      const n = l === 2 ? R(10000, 99999) : R(100000, 9999999);
      const len = String(n).length;
      let i, d;
      do { i = R(0, len - 1); d = Math.floor(n / 10 ** i) % 10; } while (d === 0);
      const val = d * 10 ** i;
      return {
        q: `What is the <b>value</b> of the underlined digit?${big(underlineDigit(n, i))}`, a: num(val),
        hint: `The digit is ${d}. Count places from the right: ones, tens, hundreds, thousands…`,
        explain: `The ${d} is in the ${PLACE[10 ** i]} place, so its value is ${fmt(val)}.`,
      };
    }
    let n, p;
    if (l === 1) { n = R(1000, 9999); p = pick([10, 100]); }
    else if (l === 2) { n = R(10000, 99999); p = pick([100, 1000]); }
    else { n = R(100000, 9999999); p = pick([1000, 10000, 100000]); }
    const ans = Math.round(n / p) * p, lo = Math.floor(n / p) * p;
    return {
      q: `Round to the nearest <b>${fmt(p)}</b>:${big(fmt(n))}`, a: num(ans),
      hint: `Find the ${PLACE[p]} digit. Look at the digit just to its right: 5 or more rounds up, 4 or less rounds down.`,
      explain: `${fmt(n)} is between ${fmt(lo)} and ${fmt(lo + p)}. It rounds to ${fmt(ans)}.`,
    };
  };

  G.g4_mult = (l) => {
    let a, b;
    if (l === 1) { a = R(12, 99); b = R(3, 9); }
    else if (l === 2) { a = Math.random() < 0.5 ? R(102, 999) : R(1002, 9999); b = R(3, 9); }
    else { a = R(13, 99); b = R(12, 99); }
    const ans = a * b;
    let hint, explain;
    if (l === 3) {
      const t = Math.floor(b / 10) * 10, o = b % 10;
      hint = `Split ${b} into ${t} + ${o}. Find ${a} × ${t} and ${a} × ${o}, then add.`;
      explain = `${a} × ${t} = ${fmt(a * t)} and ${a} × ${o} = ${fmt(a * o)}. ${fmt(a * t)} + ${fmt(a * o)} = ${fmt(ans)}.`;
    } else {
      const parts = []; let rest = a, place = 1;
      while (rest > 0) { const d = rest % 10; if (d) parts.unshift(d * place); rest = Math.floor(rest / 10); place *= 10; }
      hint = `Break ${fmt(a)} apart: ${parts.map(fmt).join(' + ')}. Multiply each part by ${b}, then add.`;
      explain = parts.map((p) => `${fmt(p)} × ${b} = ${fmt(p * b)}`).join(', ') + `. Total: ${fmt(ans)}.`;
    }
    return { q: `Multiply:${big(`${fmt(a)} × ${b}`)}`, a: num(ans), hint, explain };
  };

  G.g4_div = (l) => {
    if (l === 1) {
      const d = R(2, 9), q = R(Math.max(3, Math.ceil(11 / d)), Math.floor(99 / d)), n = d * q;
      return { q: `Divide:${big(`${n} ÷ ${d}`)}`, a: num(q), hint: `Think: ${d} × what = ${n}?`, explain: `${d} × ${q} = ${n}, so ${n} ÷ ${d} = ${q}.` };
    }
    const d = l === 2 ? R(3, 9) : R(4, 9);
    const q = l === 2 ? R(12, 99) : R(102, 999);
    const r = l === 2 ? R(1, d - 1) : R(0, d - 1);
    const n = d * q + r;
    const c = `${q} R ${r}`;
    const ds = [`${q + 1} R ${r}`, `${q - 1} R ${r}`, `${q} R ${(r + 1) % d}`, `${q} R ${r + d}`, `${q * 10} R ${r}`, `${q + 10} R ${r}`];
    return {
      q: `Divide. Choose the quotient and remainder:${big(`${fmt(n)} ÷ ${d}`)}`, a: choice(c, shuffle(ds)),
      hint: `The remainder must be smaller than ${d}. Try ${d} × ${q - (q % 10)} first, then see how much is left.`,
      explain: `${d} × ${q} = ${fmt(d * q)}, and ${fmt(n)} − ${fmt(d * q)} = ${r}. So the answer is ${q} R ${r}.`,
    };
  };

  G.g4_frac = (l) => {
    if (l === 1) {
      const d = R(2, 10), n = R(1, d - 1), k = R(2, 6);
      if (Math.random() < 0.5)
        return { q: `Fill in the missing numerator:${big(`${fr(n, d)} = ${fr('?', d * k)}`)}`, a: num(n * k), hint: `${d} × ${k} = ${d * k}. Multiply the top by ${k} too!`, explain: `${fr(n, d)} = ${fr(n + ' × ' + k, d + ' × ' + k)} = ${fr(n * k, d * k)}.` };
      return { q: `Fill in the missing denominator:${big(`${fr(n * k, d * k)} = ${fr(n, '?')}`)}`, a: num(d), hint: `${n * k} ÷ ${k} = ${n}. Divide the bottom by ${k} too!`, explain: `Divide top and bottom by ${k}: ${fr(n * k, d * k)} = ${fr(n, d)}.` };
    }
    if (l === 2) {
      const d = R(4, 12);
      let a = R(1, d), b = R(1, d);
      if (Math.random() < 0.5) {
        if (a < b) [a, b] = [b, a];
        if (a === b) a++;
        return { q: `Subtract:${big(`${fr(a, d)} ${MINUS} ${fr(b, d)}`)}`, a: frac(a - b, d), hint: `Same denominator! Subtract the numerators and keep the ${d}.`, explain: `${a} − ${b} = ${a - b}, so the answer is ${fr(a - b, d)}.` };
      }
      return { q: `Add:${big(`${fr(a, d)} + ${fr(b, d)}`)}`, a: frac(a + b, d), hint: `Same denominator! Add the numerators and keep the ${d}. (You can type an answer like ${a + b}/${d}.)`, explain: `${a} + ${b} = ${a + b}, so the answer is ${fr(a + b, d)}.` };
    }
    const kind = R(1, 3);
    if (kind === 1) {
      let a, b, c, d;
      do { b = R(3, 12); d = R(3, 12); a = R(1, b - 1); c = R(1, d - 1); } while (b === d || a * d === c * b);
      const s = a * d > c * b ? '&gt;' : '&lt;';
      return { q: `Which symbol makes this true?${big(`${fr(a, b)} &nbsp;?&nbsp; ${fr(c, d)}`)}`, a: choiceFixed(['&lt;', '&gt;', '='], s), hint: `Rename both fractions with the denominator ${b * d}, then compare the numerators.`, explain: `${fr(a, b)} = ${fr(a * d, b * d)} and ${fr(c, d)} = ${fr(c * b, b * d)}. So ${fr(a, b)} ${s} ${fr(c, d)}.` };
    }
    if (kind === 2) {
      const d = R(3, 9); let n; do { n = R(d + 1, d * 6); } while (n % d === 0);
      const w = Math.floor(n / d), r = n % d;
      const ds = [mixed(w + 1, r, d), mixed(w, d - r, d), mixed(r, w, d), mixed(w - 1 > 0 ? w - 1 : w + 2, r, d)];
      return { q: `Which mixed number equals ${fr(n, d)}?`, a: choice(mixed(w, r, d), ds), hint: `How many groups of ${d} fit in ${n}? That's the whole number. The leftover is the new numerator.`, explain: `${n} ÷ ${d} = ${w} R ${r}, so ${fr(n, d)} = ${mixed(w, r, d)}.` };
    }
    const d = R(3, 10), n = R(1, d - 1), w = d * R(2, 12);
    return { q: `What is ${fr(n, d)} of ${w}?`, a: num((w / d) * n), hint: `First find ${fr(1, d)} of ${w} by dividing by ${d}. Then multiply by ${n}.`, explain: `${w} ÷ ${d} = ${w / d}, and ${w / d} × ${n} = ${(w / d) * n}.` };
  };

  G.g4_word = (l) => {
    const t = R(1, 7);
    if (t === 1) {
      const L = lv(l, R(4, 12), R(12, 30), R(25, 80)), W = lv(l, R(3, 9), R(6, 15), R(12, 45));
      return { q: `Coral the Clownfish is planting a rectangular sea-garden that is <b>${L} m</b> long and <b>${W} m</b> wide. What is its <b>area</b> in square meters?`, a: num(L * W), hint: `Area of a rectangle = length × width.`, explain: `${L} × ${W} = ${fmt(L * W)} square meters.` };
    }
    if (t === 2) {
      const L = lv(l, R(5, 15), R(15, 60), R(45, 250)), W = lv(l, R(3, 10), R(8, 40), R(30, 180));
      return { q: `A rainbow ribbon goes all the way around a rectangular lagoon that is <b>${L} m</b> by <b>${W} m</b>. How many meters of ribbon are needed?`, a: num(2 * (L + W)), hint: `Going "all the way around" means perimeter: add all four sides.`, explain: `${L} + ${W} + ${L} + ${W} = ${2 * (L + W)} m.` };
    }
    if (t === 3) {
      const n = lv(l, R(3, 9), R(6, 12), R(12, 30)), k = lv(l, R(4, 9), R(12, 25), R(15, 48)), m = R(Math.ceil((n * k) / 6), Math.floor((n * k) / 2));
      return { q: `There are <b>${n}</b> schools of fish with <b>${k}</b> fish in each school. Then <b>${m}</b> fish swim off to look for food. How many fish are left?`, a: num(n * k - m), hint: `Step 1: multiply to find the total. Step 2: subtract the fish that swam away.`, explain: `${n} × ${k} = ${n * k}, and ${n * k} − ${m} = ${n * k - m}.` };
    }
    if (t === 4) {
      const k = lv(l, R(3, 6), R(4, 9), R(6, 9)); let n; do { n = lv(l, R(10, 40), R(40, 99), R(100, 500)); } while (n % k === 0);
      return { q: `<b>${n}</b> baby sea turtles need a ride to the surface. Each magic bubble holds <b>${k}</b> turtles. How many bubbles are needed so <i>every</i> turtle gets a ride?`, a: num(Math.ceil(n / k)), hint: `Divide ${n} by ${k}. If there is a remainder, those leftover turtles still need a bubble!`, explain: `${n} ÷ ${k} = ${Math.floor(n / k)} R ${n % k}. The ${n % k} leftover turtles need one more bubble: ${Math.ceil(n / k)}.` };
    }
    if (t === 5) {
      const W = lv(l, R(3, 9), R(6, 12), R(12, 30)), L = lv(l, R(4, 12), R(12, 30), R(20, 60));
      return { q: `The floor of a rectangular fish tank has an area of <b>${fmt(W * L)} square inches</b>. It is <b>${W} inches</b> wide. How long is it?`, a: num(L), hint: `Area = length × width, so length = area ÷ width.`, explain: `${fmt(W * L)} ÷ ${W} = ${L} inches.` };
    }
    if (t === 6) {
      const b = R(3, lv(l, 5, 8, 12)); let a; do { a = R(1, b - 1); } while (gcd(a, b) !== 1);
      const n = b * lv(l, R(2, 8), R(5, 15), R(10, 40));
      return { q: `A mermaid has <b>${n}</b> pearls. She gives ${fr(a, b)} of them to her sister. How many pearls does she give away?`, a: num((n / b) * a), hint: `Find ${fr(1, b)} of ${n} first (divide by ${b}), then multiply by ${a}.`, explain: `${n} ÷ ${b} = ${n / b}, and ${n / b} × ${a} = ${(n / b) * a}.` };
    }
    const k = lv(l, R(3, 9), R(12, 40), R(25, 99)), e = R(5, 30);
    if (l === 3) return { q: `A rainbow fish has 7 colors of scales with <b>${k}</b> scales of each color, plus <b>${e}</b> silver scales. Her 3 sisters each have exactly the same number of scales. How many scales do the <b>4 fish</b> have altogether?`, a: num(4 * (7 * k + e)), hint: `First find one fish's scales: 7 × ${k} + ${e}. Then multiply by 4.`, explain: `7 × ${k} + ${e} = ${7 * k + e}, and 4 × ${7 * k + e} = ${fmt(4 * (7 * k + e))}.` };
    return { q: `A rainbow fish has 7 colors of scales with <b>${k}</b> scales of each color, plus <b>${e}</b> silver scales. How many scales does she have in all?`, a: num(7 * k + e), hint: `Multiply 7 × ${k}, then add the ${e} silver scales.`, explain: `7 × ${k} = ${7 * k}, and ${7 * k} + ${e} = ${7 * k + e}.` };
  };

  // ======================= GRADE 5 — Unicorn Meadows =======================
  const decStr = (units, places) => (units / 10 ** places).toFixed(places);
  G.g5_dec = (l) => {
    if (l === 1) {
      const pa = R(1, 2), pb = R(1, 2);
      let A = R(11, 999), B = R(11, 999);
      let a100 = A * 10 ** (2 - pa), b100 = B * 10 ** (2 - pb);
      let as = decStr(A, pa), bs = decStr(B, pb);
      if (Math.random() < 0.5) {
        if (a100 < b100) { [a100, b100] = [b100, a100]; [as, bs] = [bs, as]; }
        return { q: `Subtract:${big(`${as} ${MINUS} ${bs}`)}`, a: num((a100 - b100) / 100), hint: `Line up the decimal points. Add zeros so both numbers have the same number of decimal places.`, explain: `${as} − ${bs} = ${fmt(rnd((a100 - b100) / 100))}.` };
      }
      return { q: `Add:${big(`${as} + ${bs}`)}`, a: num((a100 + b100) / 100), hint: `Line up the decimal points, then add like whole numbers.`, explain: `${as} + ${bs} = ${fmt(rnd((a100 + b100) / 100))}.` };
    }
    if (l === 2) {
      const pl = R(1, 3), A = R(11, 9999), a = A / 10 ** pl, as = decStr(A, pl), p = pick([10, 100, 1000]);
      const zeros = String(p).length - 1;
      if (Math.random() < 0.5) return { q: `Multiply:${big(`${as} × ${fmt(p)}`)}`, a: num(rnd(a * p)), hint: `Multiplying by ${fmt(p)} moves the decimal point ${zeros} place${zeros > 1 ? 's' : ''} to the <b>right</b>.`, explain: `${as} × ${fmt(p)} = ${fmt(rnd(a * p))}.` };
      return { q: `Divide:${big(`${as} ÷ ${fmt(p)}`)}`, a: num(rnd(a / p)), hint: `Dividing by ${fmt(p)} moves the decimal point ${zeros} place${zeros > 1 ? 's' : ''} to the <b>left</b>.`, explain: `${as} ÷ ${fmt(p)} = ${fmt(rnd(a / p))}.` };
    }
    if (Math.random() < 0.55) {
      const A = R(11, 99), B = Math.random() < 0.5 ? R(2, 9) : R(11, 49);
      const as = decStr(A, 1), bs = decStr(B, 1);
      return { q: `Multiply:${big(`${as} × ${bs}`)}`, a: num((A * B) / 100), hint: `Multiply ${A} × ${B} like whole numbers. Then count decimal places: 1 + 1 = 2.`, explain: `${A} × ${B} = ${A * B}. Two decimal places: ${fmt((A * B) / 100)}.` };
    }
    const d = R(2, 9), Q = R(11, 999), N = Q * d;
    return { q: `Divide:${big(`${decStr(N, 2)} ÷ ${d}`)}`, a: num(Q / 100), hint: `Divide like whole numbers (${N} ÷ ${d}), then put the decimal point straight above.`, explain: `${N} ÷ ${d} = ${Q}, so ${decStr(N, 2)} ÷ ${d} = ${decStr(Q, 2)}.` };
  };

  G.g5_fadd = (l) => {
    if (l < 3) {
      let d1, d2;
      if (l === 1) { d1 = pick([2, 3, 4, 5]); d2 = d1 * pick([2, 3]); }
      else { do { d1 = R(2, 10); d2 = R(2, 10); } while (d1 === d2 || d1 % d2 === 0 || d2 % d1 === 0); }
      let a = R(1, d1 - 1), b = R(1, d2 - 1);
      if (Math.random() < 0.5) [a, b, d1, d2] = [b, a, d2, d1];
      const D = lcm(d1, d2), A = a * (D / d1), B = b * (D / d2);
      const sub = Math.random() < 0.5 && A !== B;
      if (sub && A < B) { [a, b, d1, d2] = [b, a, d2, d1]; }
      const AA = a * (D / d1), BB = b * (D / d2);
      const res = sub ? AA - BB : AA + BB;
      return { q: `${sub ? 'Subtract' : 'Add'}:${big(`${fr(a, d1)} ${sub ? MINUS : '+'} ${fr(b, d2)}`)}`, a: frac(res, D), hint: `Use a common denominator. The least common denominator of ${d1} and ${d2} is ${D}.`, explain: `${fr(a, d1)} = ${fr(AA, D)} and ${fr(b, d2)} = ${fr(BB, D)}. ${fr(AA, D)} ${sub ? '−' : '+'} ${fr(BB, D)} = ${fracHTML(res, D)}.` };
    }
    let d1, d2; do { d1 = R(2, 8); d2 = R(2, 8); } while (d1 === d2 || lcm(d1, d2) > 24);
    let w1 = R(1, 6), w2 = R(1, 5); const a = R(1, d1 - 1), b = R(1, d2 - 1);
    const D = lcm(d1, d2);
    let N1 = (w1 * d1 + a) * (D / d1), N2 = (w2 * d2 + b) * (D / d2);
    const sub = Math.random() < 0.5 && N1 !== N2;
    let left = mixed(w1, a, d1), right = mixed(w2, b, d2);
    if (sub && N1 < N2) { [N1, N2] = [N2, N1]; [left, right] = [right, left]; }
    const res = sub ? N1 - N2 : N1 + N2;
    return { q: `${sub ? 'Subtract' : 'Add'}. Give your answer in <b>simplest form</b> (like 3 1/4 or 13/4):${big(`${left} ${sub ? MINUS : '+'} ${right}`)}`, a: frac(res, D, true), hint: `Turn both into improper fractions with denominator ${D}, then ${sub ? 'subtract' : 'add'} the numerators.`, explain: `With denominator ${D}: ${fr(N1, D)} ${sub ? '−' : '+'} ${fr(N2, D)} = ${fracHTML(res, D)}.` };
  };

  G.g5_fmul = (l) => {
    if (l === 1) {
      const b = R(2, 9), a = R(1, b - 1), w = R(2, 12);
      return { q: `Multiply:${big(`${fr(a, b)} × ${w}`)}`, a: frac(a * w, b), hint: `Multiply the numerator by ${w}: ${a} × ${w}. Keep the denominator ${b}.`, explain: `${fr(a, b)} × ${w} = ${fr(a * w, b)} = ${fracHTML(a * w, b)}.` };
    }
    if (l === 2 || Math.random() < 0.4) {
      const b = R(2, 9), d = R(2, 9), a = R(1, b - 1), c = R(1, d);
      const s = l === 3;
      return { q: `Multiply${s ? '. Give your answer in <b>simplest form</b>' : ''}:${big(`${fr(a, b)} × ${fr(c, d)}`)}`, a: frac(a * c, b * d, s), hint: `Multiply top × top and bottom × bottom.${s ? ' Then simplify!' : ''}`, explain: `${fr(a + ' × ' + c, b + ' × ' + d)} = ${fr(a * c, b * d)} = ${fracHTML(a * c, b * d)}.` };
    }
    const b = R(2, 9), w = R(2, 9);
    if (Math.random() < 0.5) return { q: `Divide:${big(`${w} ÷ ${fr(1, b)}`)}`, a: num(w * b), hint: `How many ${fr(1, b)}s fit in 1 whole? ${b}. So how many fit in ${w} wholes?`, explain: `Each whole has ${b} pieces of size ${fr(1, b)}, so ${w} × ${b} = ${w * b}.` };
    return { q: `Divide:${big(`${fr(1, b)} ÷ ${w}`)}`, a: frac(1, b * w), hint: `Split ${fr(1, b)} into ${w} equal parts. Dividing by ${w} is the same as multiplying by ${fr(1, w)}.`, explain: `${fr(1, b)} × ${fr(1, w)} = ${fr(1, b * w)}.` };
  };

  G.g5_ops = (l) => {
    if (l === 1) {
      const a = R(2, 12), b = R(2, 12), c = R(2, 12), f = R(1, 3);
      if (f === 1) return { q: `Solve using order of operations:${big(`${a} + ${b} × ${c}`)}`, a: num(a + b * c), hint: `Multiply before you add!`, explain: `${b} × ${c} = ${b * c}, then ${a} + ${b * c} = ${a + b * c}.` };
      if (f === 2) return { q: `Solve:${big(`(${a} + ${b}) × ${c}`)}`, a: num((a + b) * c), hint: `Parentheses first!`, explain: `${a} + ${b} = ${a + b}, then ${a + b} × ${c} = ${(a + b) * c}.` };
      const x = a * b, y = R(1, x - 1);
      return { q: `Solve:${big(`${a} × ${b} ${MINUS} ${y}`)}`, a: num(x - y), hint: `Multiply first, then subtract.`, explain: `${a} × ${b} = ${x}, then ${x} − ${y} = ${x - y}.` };
    }
    if (l === 2) {
      if (Math.random() < 0.5) {
        const a = R(2, 9), b = R(2, 12), c = R(2, 12), t = a * (b + c), d = R(1, t - 1);
        return { q: `Solve:${big(`${a} × (${b} + ${c}) ${MINUS} ${d}`)}`, a: num(t - d), hint: `Parentheses → multiply → subtract.`, explain: `${b} + ${c} = ${b + c}; ${a} × ${b + c} = ${t}; ${t} − ${d} = ${t - d}.` };
      }
      const a = R(5, 30), b = R(2, 9), c = R(2, 9), e = R(2, 9), k = R(1, Math.min(9, a + b * c - 1)), d = e * k;
      const v = a + b * c - k;
      return { q: `Solve:${big(`${a} + ${b} × ${c} ${MINUS} ${d} ÷ ${e}`)}`, a: num(v), hint: `Do × and ÷ first (left to right), then + and − (left to right).`, explain: `${b} × ${c} = ${b * c} and ${d} ÷ ${e} = ${k}. Then ${a} + ${b * c} − ${k} = ${v}.` };
    }
    const f = R(1, 3);
    if (f === 1) {
      const b = R(2, 9), c = R(2, 9), d = R(2, 9), tt = Math.ceil((b * c + 1) / d) + R(0, 4), a = d * tt - b * c;
      return { q: `Solve:${big(`(${a} + ${b} × ${c}) ÷ ${d}`)}`, a: num(tt), hint: `Inside the parentheses, multiply before adding. Then divide.`, explain: `${b} × ${c} = ${b * c}; ${a} + ${b * c} = ${a + b * c}; ${a + b * c} ÷ ${d} = ${tt}.` };
    }
    if (f === 2) {
      const a = R(2, 6), b = R(2, 15), d = R(1, 9), c = d + R(1, 9);
      const v = a * (b + (c - d));
      return { q: `Solve:${big(`${a} × [${b} + (${c} ${MINUS} ${d})]`)}`, a: num(v), hint: `Work from the inside out: ( ) first, then [ ].`, explain: `${c} − ${d} = ${c - d}; ${b} + ${c - d} = ${b + c - d}; ${a} × ${b + c - d} = ${v}.` };
    }
    const a = R(2, 5), b = R(1, 6), c = R(2, 9), d = R(2, 9);
    const v = (a + b) ** 2 - c * d;
    if (v <= 0) return G.g5_ops(3);
    return { q: `Solve:${big(`(${a} + ${b})<sup>2</sup> ${MINUS} ${c} × ${d}`)}`, a: num(v), hint: `Parentheses, then the exponent (squared means times itself), then multiply, then subtract.`, explain: `(${a + b})² = ${(a + b) ** 2}; ${c} × ${d} = ${c * d}; ${(a + b) ** 2} − ${c * d} = ${v}.` };
  };

  G.g5_word = (l) => {
    const t = R(1, 6);
    if (t === 1) {
      const a = lv(l, R(2, 6), R(4, 12), R(8, 20)), b = lv(l, R(2, 5), R(3, 10), R(6, 15)), c = lv(l, R(2, 5), R(3, 8), R(5, 12));
      return { q: `Sparkle the Unicorn's treasure chest is <b>${a} in</b> long, <b>${b} in</b> wide, and <b>${c} in</b> tall. What is its <b>volume</b> in cubic inches?`, a: num(a * b * c), hint: `Volume = length × width × height.`, explain: `${a} × ${b} × ${c} = ${a * b * c} cubic inches.` };
    }
    if (t === 2) {
      const n = lv(l, R(2, 5), R(3, 8), R(3, 9)), cents = 25 * R(5, lv(l, 24, 40, 48)), total = n * cents;
      if (l === 3 && total < 5000) return { q: `Sparkle buys <b>${n}</b> golden horseshoes for <b>${money(cents / 100)}</b> each. She pays with a <b>$50</b> bill. How much change does she get?`, a: cash((5000 - total) / 100), hint: `First multiply to find the total cost, then subtract it from $50.00.`, explain: `${n} × ${money(cents / 100)} = ${money(total / 100)}. $50.00 − ${money(total / 100)} = ${money((5000 - total) / 100)}.` };
      return { q: `Sparkle buys <b>${n}</b> golden horseshoes for <b>${money(cents / 100)}</b> each. How much does she spend in all?`, a: cash(total / 100), hint: `Multiply ${n} × ${money(cents / 100)}. (Try thinking in cents: ${cents}¢.)`, explain: `${n} × ${cents}¢ = ${total}¢ = ${money(total / 100)}.` };
    }
    if (t === 3) {
      const b = R(2, 6), a = R(1, b - 1), d = R(2, 6), c = R(1, d - 1), s = l === 3;
      return { q: `${fr(a, b)} of the meadow is covered in rainbow flowers. The unicorns munch ${fr(c, d)} of those flowers. What fraction of the <b>whole meadow</b> did they munch?${s ? ' (simplest form)' : ''}`, a: frac(a * c, b * d, s), hint: `"${fr(c, d)} of ${fr(a, b)}" means ${fr(c, d)} × ${fr(a, b)}.`, explain: `${fr(c, d)} × ${fr(a, b)} = ${fr(a * c, b * d)} = ${fracHTML(a * c, b * d)}.` };
    }
    if (t === 4) {
      const L = lv(l, R(2, 6), R(4, 12), R(8, 25)), b = pick([2, 3, 4, 5, 6, 8]);
      return { q: `A rainbow ribbon is <b>${L} meters</b> long. Each unicorn's mane bow needs ${fr(1, b)} meter. How many bows can be made?`, a: num(L * b), hint: `How many ${fr(1, b)}s are in ${L}? That's ${L} ÷ ${fr(1, b)}.`, explain: `There are ${b} pieces in each meter, so ${L} × ${b} = ${L * b} bows.` };
    }
    if (t === 5) {
      let A = R(105, lv(l, 400, 900, 2500)), B = R(105, lv(l, 400, 900, 2500)); if (A === B) A += 7; if (A < B) [A, B] = [B, A];
      return { q: `Starlight gallops <b>${decStr(A, 2)} km</b> on Monday and <b>${decStr(B, 2)} km</b> on Tuesday. How much farther does she gallop on Monday?`, a: num((A - B) / 100), hint: `"How much farther" means subtract. Line up the decimal points!`, explain: `${decStr(A, 2)} − ${decStr(B, 2)} = ${decStr(A - B, 2)} km.` };
    }
    const L = lv(l, R(2, 5), R(3, 9), R(5, 12)), W = lv(l, R(2, 5), R(3, 9), R(4, 10)), H = lv(l, R(2, 6), R(3, 10), R(5, 15));
    return { q: `A crystal box has a volume of <b>${L * W * H} cubic cm</b>. It is <b>${L} cm</b> long and <b>${W} cm</b> wide. How <b>tall</b> is it?`, a: num(H), hint: `Volume = length × width × height. Find ${L} × ${W} first, then divide the volume by that.`, explain: `${L} × ${W} = ${L * W}, and ${L * W * H} ÷ ${L * W} = ${H} cm.` };
  };

  // ======================= GRADE 6 — Enchanted Castle =======================
  G.g6_ratio = (l) => {
    if (l === 1) {
      let a = R(1, 9), b = R(2, 9); const k = R(2, 9);
      if (a === b) b++;
      if (Math.random() < 0.5) return { q: `Complete the equivalent ratio:${big(`${a} : ${b} = ${a * k} : ?`)}`, a: num(b * k), hint: `${a} was multiplied by ${k}. Do the same to ${b}.`, explain: `${b} × ${k} = ${b * k}.` };
      return { q: `Complete the equivalent ratio:${big(`${a} : ${b} = ? : ${b * k}`)}`, a: num(a * k), hint: `${b} was multiplied by ${k}. Do the same to ${a}.`, explain: `${a} × ${k} = ${a * k}.` };
    }
    if (l === 2) {
      if (Math.random() < 0.5) { const h = R(2, 8), r = R(8, 45); return { q: `Princess Lumi's carriage travels <b>${h * r} miles</b> in <b>${h} hours</b>. How many miles per hour is that?`, a: num(r), hint: `Unit rate: divide miles by hours.`, explain: `${h * r} ÷ ${h} = ${r} miles per hour.` }; }
      const n = R(3, 12), p = 25 * R(2, 20), c = n * p;
      return { q: `<b>${n}</b> royal cupcakes cost <b>${money(c / 100)}</b>. What is the cost of <b>1</b> cupcake?`, a: cash(p / 100), hint: `Divide the total cost by the number of cupcakes.`, explain: `${money(c / 100)} ÷ ${n} = ${money(p / 100)}.` };
    }
    let a, b; do { a = R(1, 9); b = R(2, 9); } while (gcd(a, b) !== 1 || a === b);
    const k = R(3, 15);
    if (Math.random() < 0.5) {
      const which = Math.random() < 0.5;
      return { q: `In the royal garden, the ratio of red roses to white roses is <b>${a} : ${b}</b>. There are <b>${(a + b) * k}</b> roses in all. How many are <b>${which ? 'red' : 'white'}</b>?`, a: num((which ? a : b) * k), hint: `Each "group" has ${a} + ${b} = ${a + b} roses. How many groups are there?`, explain: `${(a + b) * k} ÷ ${a + b} = ${k} groups. ${which ? a : b} × ${k} = ${(which ? a : b) * k}.` };
    }
    return { q: `A royal recipe uses <b>${a}</b> cups of sugar for every <b>${b}</b> cups of flour. If the baker uses <b>${b * k}</b> cups of flour, how many cups of sugar are needed?`, a: num(a * k), hint: `How many times bigger is ${b * k} than ${b}?`, explain: `${b * k} ÷ ${b} = ${k}, so sugar = ${a} × ${k} = ${a * k} cups.` };
  };

  G.g6_pct = (l) => {
    if (l === 1) {
      const p = pick([10, 20, 25, 50, 75]), step = 100 / gcd(p, 100), n = step * R(1, lv(1, 20, 0, 0));
      return { q: `What is <b>${p}%</b> of <b>${n}</b>?`, a: num((p * n) / 100), hint: p === 50 ? `50% is half.` : p === 25 ? `25% is one quarter: divide by 4.` : p === 75 ? `75% is three quarters: find one quarter, then times 3.` : `10% means divide by 10.${p === 20 ? ' 20% is double that.' : ''}`, explain: `${p}% of ${n} = ${p}/100 × ${n} = ${(p * n) / 100}.` };
    }
    if (l === 2) {
      const p = 5 * R(1, 19), n = 20 * R(1, 15);
      return { q: `What is <b>${p}%</b> of <b>${n}</b>?`, a: num((p * n) / 100), hint: `Find 10% (÷10) and 5% (half of 10%), then build ${p}% from those.`, explain: `${p}% × ${n} = ${(p * n) / 100}.` };
    }
    const p = pick([5, 10, 15, 20, 25, 30, 40, 45, 60, 70, 75, 80, 90]), n = 20 * R(1, 12), part = (p * n) / 100;
    if (Math.random() < 0.5) return { q: `<b>${part}</b> is what percent of <b>${n}</b>?`, a: num(p), hint: `Make the fraction ${fr(part, n)}, then rename it out of 100.`, explain: `${fr(part, n)} = ${fr(p, 100)} = ${p}%.` };
    return { q: `<b>${part}</b> is <b>${p}%</b> of what number?`, a: num(n), hint: `If ${p}% is ${part}, find 1% first (÷ ${p}), then 100%.`, explain: `${part} ÷ ${p} = ${rnd(part / p)} is 1%, so 100% is ${n}.` };
  };

  G.g6_fdiv = (l) => {
    if (l === 1) {
      const b = R(2, 9), a = R(1, b - 1), w = a * R(1, 6);
      return { q: `Divide:${big(`${w} ÷ ${fr(a, b)}`)}`, a: frac(w * b, a), hint: `Dividing by a fraction = multiplying by its reciprocal ${fr(b, a)}.`, explain: `${w} × ${fr(b, a)} = ${fr(w * b, a)} = ${fracHTML(w * b, a)}.` };
    }
    if (l === 2) {
      const b = R(2, 9), d = R(2, 9), a = R(1, b), c = R(1, d - 1);
      return { q: `Divide:${big(`${fr(a, b)} ÷ ${fr(c, d)}`)}`, a: frac(a * d, b * c), hint: `Keep, change, flip: ${fr(a, b)} × ${fr(d, c)}.`, explain: `${fr(a, b)} × ${fr(d, c)} = ${fr(a * d, b * c)} = ${fracHTML(a * d, b * c)}.` };
    }
    const b = R(2, 6), a = R(1, b - 1), w = R(1, 4), d = R(2, 8), c = R(1, d - 1);
    const N = w * b + a;
    if (Math.random() < 0.5) {
      const w2 = R(1, 3), N2 = w2 * d + c;
      return { q: `Divide. Answer in <b>simplest form</b>:${big(`${mixed(w, a, b)} ÷ ${mixed(w2, c, d)}`)}`, a: frac(N * d, b * N2, true), hint: `Change both to improper fractions: ${fr(N, b)} ÷ ${fr(N2, d)}. Then keep, change, flip.`, explain: `${fr(N, b)} × ${fr(d, N2)} = ${fr(N * d, b * N2)} = ${fracHTML(N * d, b * N2)}.` };
    }
    return { q: `Divide. Answer in <b>simplest form</b>:${big(`${mixed(w, a, b)} ÷ ${fr(c, d)}`)}`, a: frac(N * d, b * c, true), hint: `Change ${mixed(w, a, b)} to ${fr(N, b)}. Then multiply by ${fr(d, c)}.`, explain: `${fr(N, b)} × ${fr(d, c)} = ${fr(N * d, b * c)} = ${fracHTML(N * d, b * c)}.` };
  };

  G.g6_eq = (l) => {
    if (l === 1) {
      const x = R(2, 60), a = R(2, 50), f = R(1, 3);
      if (f === 1) return { q: `Solve for <i>x</i>:${big(`<i>x</i> + ${a} = ${x + a}`)}`, a: num(x), hint: `Undo + ${a} by subtracting ${a} from both sides.`, explain: `${x + a} − ${a} = ${x}.` };
      if (f === 2) return { q: `Solve for <i>x</i>:${big(`<i>x</i> ${MINUS} ${a} = ${x}`)}`, a: num(x + a), hint: `Undo − ${a} by adding ${a} to both sides.`, explain: `${x} + ${a} = ${x + a}.` };
      return { q: `Solve for <i>x</i>:${big(`${a} + <i>x</i> = ${x + a}`)}`, a: num(x), hint: `What plus ${a} makes ${x + a}?`, explain: `${x + a} − ${a} = ${x}.` };
    }
    if (l === 2) {
      const f = R(1, 3);
      if (f === 1) { const a = R(2, 12), x = R(2, 15); return { q: `Solve for <i>x</i>:${big(`${a}<i>x</i> = ${a * x}`)}`, a: num(x), hint: `${a}x means ${a} × x. Divide both sides by ${a}.`, explain: `${a * x} ÷ ${a} = ${x}.` }; }
      if (f === 2) { const a = R(2, 9), b = R(2, 12); return { q: `Solve for <i>x</i>:${big(`${fr('<i>x</i>', a)} = ${b}`)}`, a: num(a * b), hint: `x is being divided by ${a}. Multiply both sides by ${a}.`, explain: `${b} × ${a} = ${a * b}.` }; }
      const b = R(2, 5), e = b === 2 ? R(3, 6) : b === 3 ? R(2, 4) : R(2, 3);
      return { q: `Evaluate:${big(pw(b, e))}`, a: num(b ** e), hint: `${pw(b, e)} means ${Array(e).fill(b).join(' × ')}.`, explain: `${Array(e).fill(b).join(' × ')} = ${b ** e}.` };
    }
    const f = R(1, 3);
    if (f === 1) {
      let a, b; do { a = R(2, 9); b = R(2, 9); } while (gcd(a, b) !== 1 || a === b);
      const g = R(2, 12);
      return { q: `What is the <b>greatest common factor</b> (GCF) of <b>${a * g}</b> and <b>${b * g}</b>?`, a: num(g), hint: `List the factors of each number and find the biggest one they share.`, explain: `${a * g} = ${g} × ${a} and ${b * g} = ${g} × ${b}. The GCF is ${g}.` };
    }
    if (f === 2) {
      let a, b; do { a = R(4, 15); b = R(4, 15); } while (a === b || a % b === 0 || b % a === 0);
      return { q: `What is the <b>least common multiple</b> (LCM) of <b>${a}</b> and <b>${b}</b>?`, a: num(lcm(a, b)), hint: `List multiples of ${Math.max(a, b)} until you find one that ${Math.min(a, b)} also divides.`, explain: `The smallest number both ${a} and ${b} divide into is ${lcm(a, b)}.` };
    }
    const c = R(2, 5), x = R(2, 6), k = R(1, 12), s = sign();
    const v = c * x * x + s * k;
    return { q: `Evaluate when <i>x</i> = ${x}:${big(`${c}<i>x</i><sup>2</sup>${constTerm(s * k)}`)}`, a: num(v), hint: `Exponent first: ${x}² = ${x * x}. Then multiply by ${c}.`, explain: `${c} × ${x * x} ${s > 0 ? '+' : '−'} ${k} = ${v}.` };
  };

  G.g6_word = (l) => {
    const t = R(1, 6);
    if (t === 1) {
      const p = 20 * R(2, lv(l, 6, 12, 25)), d = lv(l, pick([10, 25, 50]), 5 * R(2, 9), 5 * R(3, 17));
      return { q: `A royal ball gown costs <b>$${p}</b>. Today it is <b>${d}% off</b>. What is the sale price?`, a: cash(p - (p * d) / 100), hint: `Find ${d}% of $${p}, then subtract it from $${p}.`, explain: `${d}% of ${p} = ${(p * d) / 100}. $${p} − $${(p * d) / 100} = $${p - (p * d) / 100}.` };
    }
    if (t === 2) {
      const b = lv(l, R(2, 10) * 2, R(5, 20), R(9, 35)), h = lv(l, R(3, 12), R(5, 20), R(9, 35));
      return { q: `A triangular castle flag has a base of <b>${b} in</b> and a height of <b>${h} in</b>. What is its area in square inches?`, a: num((b * h) / 2), hint: `Area of a triangle = ${fr(1, 2)} × base × height.`, explain: `${fr(1, 2)} × ${b} × ${h} = ${fmt((b * h) / 2)} square inches.` };
    }
    if (t === 3) {
      const h = R(2, 6), r = R(3, 15), h2 = R(2, 10) + (l > 1 ? R(1, 12) : 0);
      return { q: `The royal baker makes <b>${h * r}</b> pies in <b>${h}</b> hours. At the same rate, how many pies can she make in <b>${h2}</b> hours?`, a: num(r * h2), hint: `Find the unit rate (pies per hour) first.`, explain: `${h * r} ÷ ${h} = ${r} pies per hour. ${r} × ${h2} = ${r * h2}.` };
    }
    if (t === 4) {
      let a, b; do { a = R(2, 9); b = R(2, 9); } while (gcd(a, b) !== 1);
      const k = R(2, lv(l, 6, 12, 25));
      return { q: `At the castle ball, the ratio of princesses to knights is <b>${a} : ${b}</b>. There are <b>${b * k}</b> knights. How many princesses are there?`, a: num(a * k), hint: `${b} × ? = ${b * k}. Then multiply ${a} by the same number.`, explain: `${b * k} ÷ ${b} = ${k}; ${a} × ${k} = ${a * k} princesses.` };
    }
    if (t === 5) {
      const b = pick([2, 3, 4, 5, 6, 8]), a = R(1, b - 1), w = a * R(2, lv(l, 4, 8, 15));
      return { q: `Princess Lumi has <b>${w} cups</b> of glitter. Each crown needs ${fr(a, b)} cup of glitter. How many crowns can she decorate?`, a: num((w * b) / a), hint: `Divide ${w} by ${fr(a, b)}: multiply ${w} by ${fr(b, a)}.`, explain: `${w} × ${fr(b, a)} = ${fr(w * b, a)} = ${(w * b) / a} crowns.` };
    }
    const top = R(20, lv(l, 80, 150, 400)), moat = R(5, lv(l, 15, 40, 90));
    return { q: `The top of the castle tower is <b>${top} ft</b> above the water. The bottom of the moat is at <b>${MINUS}${moat} ft</b> (below the water). How far is it from the bottom of the moat to the top of the tower?`, a: num(top + moat), hint: `Distance from ${MINUS}${moat} up to 0, then from 0 up to ${top}.`, explain: `${moat} + ${top} = ${top + moat} ft.` };
  };

  // ======================= GRADE 7 — Karate Dojo =======================
  G.g7_int = (l) => {
    if (l === 1) {
      const a = nz(-20, 20), b = nz(-20, 20);
      if (Math.random() < 0.5) return { q: `Add:${big(`${fmt(a)} + ${sp(b)}`)}`, a: num(a + b), hint: `Think of a number line. Adding a negative moves left.`, explain: `${fmt(a)} + ${sp(b)} = ${fmt(a + b)}.` };
      return { q: `Subtract:${big(`${fmt(a)} ${MINUS} ${sp(b)}`)}`, a: num(a - b), hint: `Subtracting a number = adding its opposite: ${fmt(a)} + ${sp(-b)}.`, explain: `${fmt(a)} + ${sp(-b)} = ${fmt(a - b)}.` };
    }
    if (l === 2) {
      const a = nz(-12, 12), b = nz(-12, 12);
      if (Math.abs(a) === 1 || Math.abs(b) === 1) return G.g7_int(2);
      if (Math.random() < 0.5) return { q: `Multiply:${big(`${sp(a)} × ${sp(b)}`)}`, a: num(a * b), hint: `Same signs → positive. Different signs → negative.`, explain: `${Math.abs(a)} × ${Math.abs(b)} = ${Math.abs(a * b)}, and the sign is ${a * b > 0 ? 'positive' : 'negative'}: ${fmt(a * b)}.` };
      return { q: `Divide:${big(`${sp(a * b)} ÷ ${sp(b)}`)}`, a: num(a), hint: `Same signs → positive. Different signs → negative.`, explain: `${Math.abs(a * b)} ÷ ${Math.abs(b)} = ${Math.abs(a)}, sign ${a > 0 ? 'positive' : 'negative'}: ${fmt(a)}.` };
    }
    const a = nz(-6, 6), b = R(-9, 9), c = R(-9, 9), e = nz(-5, 5), k = R(-6, 6), d = e * k;
    const v = a * (b - c) + k;
    return { q: `Solve:${big(`${sp(a)} × (${fmt(b)} ${MINUS} ${sp(c)}) + ${sp(d)} ÷ ${sp(e)}`)}`, a: num(v), hint: `Parentheses first, then × and ÷, then add.`, explain: `${fmt(b)} − ${sp(c)} = ${fmt(b - c)}; ${sp(a)} × ${sp(b - c)} = ${fmt(a * (b - c))}; ${sp(d)} ÷ ${sp(e)} = ${fmt(k)}; total ${fmt(v)}.` };
  };

  G.g7_eq = (l) => {
    if (l === 1) {
      const a = R(2, 9), x = R(1, 15), b = R(1, 30), c = a * x + b;
      return { q: `Solve for <i>x</i>:${big(`${a}<i>x</i> + ${b} = ${c}`)}`, a: num(x), hint: `Undo the + ${b} first (subtract ${b}), then divide by ${a}.`, explain: `${c} − ${b} = ${a * x}; ${a * x} ÷ ${a} = ${x}.` };
    }
    if (l === 2) {
      if (Math.random() < 0.6) {
        const a = nz(-9, 9) || 2, x = nz(-12, 12), b = nz(-20, 20), c = a * x + b;
        if (Math.abs(a) === 1) return G.g7_eq(2);
        return { q: `Solve for <i>x</i>:${big(`${term(a, '<i>x</i>', true)}${constTerm(b)} = ${fmt(c)}`)}`, a: num(x), hint: `Move the constant first: ${b > 0 ? 'subtract' : 'add'} ${Math.abs(b)} on both sides. Then divide by ${fmt(a)}.`, explain: `${term(a, 'x', true)} = ${fmt(c - b)}, so x = ${fmt(c - b)} ÷ ${sp(a)} = ${fmt(x)}.` };
      }
      const a = R(2, 6), k = nz(-8, 8), x = a * k, b = nz(-15, 15), c = k + b;
      return { q: `Solve for <i>x</i>:${big(`${fr('<i>x</i>', a)}${constTerm(b)} = ${fmt(c)}`)}`, a: num(x), hint: `Undo the constant first, then multiply both sides by ${a}.`, explain: `${fr('x', a)} = ${fmt(c - b)}, so x = ${fmt(c - b)} × ${a} = ${fmt(x)}.` };
    }
    if (Math.random() < 0.5) {
      const a = nz(-7, 7), b = nz(-9, 9), x = nz(-10, 10), c = a * (x + b);
      if (Math.abs(a) === 1) return G.g7_eq(3);
      return { q: `Solve for <i>x</i>:${big(`${fmt(a)}(<i>x</i>${constTerm(b)}) = ${fmt(c)}`)}`, a: num(x), hint: `Divide both sides by ${fmt(a)} first, or distribute ${fmt(a)}.`, explain: `x${constTerm(b)} = ${fmt(c)} ÷ ${sp(a)} = ${fmt(x + b)}, so x = ${fmt(x)}.` };
    }
    let p, q; do { p = nz(-8, 9); q = nz(-6, 6); } while (p + q === 0 || Math.abs(p + q) === 1);
    const x = nz(-9, 9), c = nz(-20, 20), d = (p + q) * x + c;
    return { q: `Solve for <i>x</i>:${big(`${term(p, '<i>x</i>', true)}${term(q, '<i>x</i>')}${constTerm(c)} = ${fmt(d)}`)}`, a: num(x), hint: `Combine like terms first: ${fmt(p)}x and ${fmt(q)}x make ${fmt(p + q)}x.`, explain: `${term(p + q, 'x', true)}${constTerm(c)} = ${fmt(d)} → ${term(p + q, 'x', true)} = ${fmt(d - c)} → x = ${fmt(x)}.` };
  };

  G.g7_pct = (l) => {
    if (l === 1) {
      let p, q; do { p = R(1, 9); q = R(2, 9); } while (gcd(p, q) !== 1 || p === q);
      let k1 = R(1, 6), k2 = R(2, 9); if (k1 === k2) k2++;
      if (Math.random() < 0.5) return { q: `Solve the proportion:${big(`${fr(p * k1, q * k1)} = ${fr(p * k2, '<i>x</i>')}`)}`, a: num(q * k2), hint: `Cross-multiply: ${p * k1} × x = ${q * k1} × ${p * k2}.`, explain: `x = ${q * k1} × ${p * k2} ÷ ${p * k1} = ${q * k2}.` };
      return { q: `Solve the proportion:${big(`${fr('<i>x</i>', q * k1)} = ${fr(p * k2, q * k2)}`)}`, a: num(p * k1), hint: `Simplify ${fr(p * k2, q * k2)} to ${fr(p, q)} first.`, explain: `${fr(p, q)} = ${fr(p * k1, q * k1)}, so x = ${p * k1}.` };
    }
    if (l === 2) {
      const f = R(1, 3);
      if (f === 1) { const p = 20 * R(2, 10), d = 5 * R(2, 14); return { q: `A karate gi costs <b>$${p}</b> and is <b>${d}% off</b>. What is the sale price?`, a: cash(p - (p * d) / 100), hint: `Sale price = ${100 - d}% of the original.`, explain: `${100 - d}% of $${p} = $${((100 - d) * p) / 100}.` }; }
      if (f === 2) { const p = R(12, 90), r = pick([5, 6, 7, 8, 9, 10]); return { q: `Sparring gloves cost <b>$${p}.00</b>. Sales tax is <b>${r}%</b>. What is the total cost with tax?`, a: cash((p * (100 + r)) / 100), hint: `Find ${r}% of $${p} and add it on. (Or multiply $${p} by ${(1 + r / 100).toFixed(2)}.)`, explain: `Tax: ${r}% × ${p} = $${((p * r) / 100).toFixed(2)}. Total: ${money((p * (100 + r)) / 100)}.` }; }
      const b = 4 * R(5, 25), r = pick([15, 20, 25]);
      return { q: `The dojo team dinner costs <b>$${b}.00</b>. They leave a <b>${r}%</b> tip. How much is the tip?`, a: cash((b * r) / 100), hint: `Find 10% (÷10), then build ${r}%.`, explain: `${r}% of $${b} = ${money((b * r) / 100)}.` };
    }
    const o = 20 * R(1, 12), pct = 5 * R(1, 15), up = Math.random() < 0.5;
    const n = up ? o + (o * pct) / 100 : o - (o * pct) / 100;
    if (n <= 0) return G.g7_pct(3);
    return { q: `The dojo had <b>${o}</b> students last year. This year it has <b>${n}</b>. What is the percent <b>${up ? 'increase' : 'decrease'}</b>?`, a: num(pct), hint: `Percent change = change ÷ original × 100. The change is ${Math.abs(n - o)}.`, explain: `${Math.abs(n - o)} ÷ ${o} = ${rnd(Math.abs(n - o) / o)} = ${pct}%.` };
  };

  G.g7_geo = (l) => {
    if (l === 1) {
      if (Math.random() < 0.5) {
        const r = R(1, 9), b = R(1, 9), g = R(1, 9), col = pick([['red', r], ['blue', b], ['green', g]]);
        return { q: `A bag has <b>${r}</b> red, <b>${b}</b> blue and <b>${g}</b> green belts. You pick one without looking. What is the probability it is <b>${col[0]}</b>? (as a fraction)`, a: frac(col[1], r + b + g), hint: `Probability = (number of ${col[0]}) ÷ (total number).`, explain: `${col[1]} ÷ ${r + b + g} = ${fracHTML(col[1], r + b + g)}.` };
      }
      const n = R(4, 12), k = R(1, n - 1);
      return { q: `A spinner has <b>${n}</b> equal sections. <b>${k}</b> of them are gold. What is the probability of landing on gold? (as a fraction)`, a: frac(k, n), hint: `Favorable outcomes ÷ total outcomes.`, explain: `${fracHTML(k, n)}.` };
    }
    if (l === 2) {
      const r = R(2, 12), f = R(1, 3), note = ' Use π ≈ 3.14.';
      if (f === 1) return { q: `A circular target has a <b>diameter of ${2 * r} cm</b>. What is its circumference?${note}`, a: num((314 * 2 * r) / 100, 0.011), hint: `Circumference = π × diameter.`, explain: `3.14 × ${2 * r} = ${fmt((314 * 2 * r) / 100)} cm.` };
      if (f === 2) return { q: `A circular mat has a <b>radius of ${r} ft</b>. What is its circumference?${note}`, a: num((314 * 2 * r) / 100, 0.011), hint: `Circumference = 2 × π × radius.`, explain: `2 × 3.14 × ${r} = ${fmt((314 * 2 * r) / 100)} ft.` };
      return { q: `A circular mat has a <b>radius of ${r} ft</b>. What is its <b>area</b>?${note}`, a: num((314 * r * r) / 100, 0.011), hint: `Area = π × radius × radius.`, explain: `3.14 × ${r} × ${r} = ${fmt((314 * r * r) / 100)} sq ft.` };
    }
    const f = R(1, 4);
    if (f === 1) { const s = R(2, 12), c = 6 - Math.abs(s - 7); return { q: `You roll two number cubes (1–6). What is the probability the numbers add up to <b>${s}</b>? (as a fraction)`, a: frac(c, 36), hint: `There are 6 × 6 = 36 outcomes. List the pairs that add to ${s}.`, explain: `There are ${c} ways to make ${s}, so ${fr(c, 36)} = ${fracHTML(c, 36)}.` }; }
    if (f === 2) { const k = R(1, 5); return { q: `You flip a coin and roll a number cube. What is the probability of getting <b>heads</b> AND a number <b>greater than ${k}</b>? (as a fraction)`, a: frac(6 - k, 12), hint: `Multiply the probabilities: ${fr(1, 2)} × P(greater than ${k}).`, explain: `${fr(1, 2)} × ${fr(6 - k, 6)} = ${fracHTML(6 - k, 12)}.` }; }
    if (f === 3) {
      if (Math.random() < 0.5) { const a = R(12, 78); return { q: `Two angles are <b>complementary</b>. One is <b>${a}°</b>. What is the other?`, a: num(90 - a), hint: `Complementary angles add up to 90°.`, explain: `90 − ${a} = ${90 - a}°.` }; }
      const a = R(20, 160); return { q: `Two angles are <b>supplementary</b>. One is <b>${a}°</b>. What is the other?`, a: num(180 - a), hint: `Supplementary angles add up to 180°.`, explain: `180 − ${a} = ${180 - a}°.` };
    }
    const a = R(25, 90), b = R(20, 150 - a);
    return { q: `A triangle has angles of <b>${a}°</b> and <b>${b}°</b>. What is the third angle?`, a: num(180 - a - b), hint: `The angles of a triangle add up to 180°.`, explain: `180 − ${a} − ${b} = ${180 - a - b}°.` };
  };

  G.g7_word = (l) => {
    const t = R(1, 6);
    if (t === 1) {
      const m = R(2, 5), r = R(3, 12), m2 = R(3, 12) + (l > 1 ? R(2, 10) : 0);
      return { q: `Kai breaks <b>${m * r}</b> boards in <b>${m}</b> minutes. At that rate, how many boards can Kai break in <b>${m2}</b> minutes?`, a: num(r * m2), hint: `Find boards per minute first.`, explain: `${m * r} ÷ ${m} = ${r} per minute; ${r} × ${m2} = ${r * m2}.` };
    }
    if (t === 2) {
      const s = R(-15, 5), up = R(3, 20), dn = R(10, 35);
      return { q: `At dawn the mountain dojo is <b>${fmt(s)}°C</b>. By noon it warms up <b>${up}°</b>. At night it drops <b>${dn}°</b>. What is the temperature at night?`, a: num(s + up - dn), hint: `Start at ${fmt(s)}, add ${up}, then subtract ${dn}.`, explain: `${fmt(s)} + ${up} = ${fmt(s + up)}; ${fmt(s + up)} − ${dn} = ${fmt(s + up - dn)}°C.` };
    }
    if (t === 3) {
      const b = R(2, 20), k = R(2, 6), mo = R(3, lv(l, 8, 15, 30));
      return { q: `Mia has <b>${b}</b> karate patches. She earns <b>${k}</b> new patches every month. After how many months will she have <b>${b + k * mo}</b> patches?`, a: num(mo), hint: `Write an equation: ${b} + ${k}m = ${b + k * mo}.`, explain: `${b + k * mo} − ${b} = ${k * mo}; ${k * mo} ÷ ${k} = ${mo} months.` };
    }
    if (t === 4) {
      const p = 20 * R(2, 8), d = pick([10, 20, 25, 30]), r = pick([5, 8, 10]);
      const sale = p - (p * d) / 100, total = (sale * (100 + r)) / 100;
      return { q: `A black-belt gi costs <b>$${p}</b>. It is <b>${d}% off</b>, then <b>${r}%</b> sales tax is added to the sale price. What is the final cost?`, a: cash(total), hint: `Step 1: find the sale price. Step 2: add ${r}% of the sale price.`, explain: `Sale: $${sale}. Tax: ${money((sale * r) / 100)}. Total: ${money(total)}.` };
    }
    if (t === 5) {
      const a = R(2, 6), b = R(2, 5), x = R(3, 12), y = R(2, 14);
      return { q: `In a tournament you score <b>+${a}</b> points for each clean kick and <b>${MINUS}${b}</b> points for each foul. Ren makes <b>${x}</b> clean kicks and <b>${y}</b> fouls. What is Ren's score?`, a: num(a * x - b * y), hint: `${a} × ${x} + (${MINUS}${b}) × ${y}.`, explain: `${a * x} + (${MINUS}${b * y}) = ${fmt(a * x - b * y)}.` };
    }
    const d = 2 * R(2, 10);
    return { q: `A circular training mat has a <b>diameter of ${d} ft</b>. What is its area? Use π ≈ 3.14.`, a: num((314 * (d / 2) ** 2) / 100, 0.011), hint: `Radius = half the diameter = ${d / 2}. Area = π × r × r.`, explain: `3.14 × ${d / 2} × ${d / 2} = ${fmt((314 * (d / 2) ** 2) / 100)} sq ft.` };
  };

  // ======================= GRADE 8 — Starlight Kingdom =======================
  G.g8_eq = (l) => {
    if (l === 1) {
      let a, c; do { a = R(2, 12); c = R(1, 11); } while (a === c);
      const x = R(-10, 12), b = R(-20, 20), d = a * x + b - c * x;
      return { q: `Solve for <i>x</i>:${big(`${a}<i>x</i>${constTerm(b)} = ${term(c, '<i>x</i>', true)}${constTerm(d)}`)}`, a: num(x), hint: `Get the x's on one side: subtract ${term(c, 'x', true)} from both sides.`, explain: `${term(a - c, 'x', true)} = ${fmt(d - b)}, so x = ${fmt(x)}.` };
    }
    if (l === 2 || Math.random() < 0.5) {
      let a, c; do { a = nz(-6, 8); c = nz(-6, 8); } while (a === c || Math.abs(a) === 1);
      const b = nz(-9, 9), x = R(-9, 9), e = a * (x + b) - c * x;
      return { q: `Solve for <i>x</i>:${big(`${fmt(a)}(<i>x</i>${constTerm(b)}) = ${term(c, '<i>x</i>', true)}${constTerm(e)}`)}`, a: num(x), hint: `Distribute ${fmt(a)} first, then collect the x terms on one side.`, explain: `${term(a, 'x', true)}${constTerm(a * b)} = ${term(c, 'x', true)}${constTerm(e)} → ${term(a - c, 'x', true)} = ${fmt(e - a * b)} → x = ${fmt(x)}.` };
    }
    const p = nz(-5, 6), q = nz(-6, 6), r = R(-9, 9), kind = pick(['one', 'none', 'inf']);
    const left = `${fmt(p)}(<i>x</i>${constTerm(q)})${constTerm(r)}`;
    let s, t;
    if (kind === 'one') { do { s = nz(-6, 6); } while (s === p); t = R(-15, 15); }
    else if (kind === 'none') { s = p; t = p * q + r + nz(-5, 5); }
    else { s = p; t = p * q + r; }
    const right = `${term(s, '<i>x</i>', true)}${constTerm(t)}`;
    const names = { one: 'Exactly one solution', none: 'No solution', inf: 'Infinitely many solutions' };
    return { q: `How many solutions does this equation have?${big(`${left} = ${right}`)}`, a: choiceFixed([names.one, names.none, names.inf], names[kind]), hint: `Distribute and simplify the left side to ${term(p, 'x', true)}${constTerm(p * q + r)}. Compare the x-coefficients and the constants.`, explain: `Left side = ${term(p, 'x', true)}${constTerm(p * q + r)}. ${kind === 'one' ? 'The x-coefficients are different, so there is exactly one solution.' : kind === 'none' ? 'Same x-coefficient but different constants → never equal → no solution.' : 'Both sides are identical → every x works → infinitely many.'}` };
  };

  G.g8_lin = (l) => {
    if (l === 1) {
      const m = nz(-9, 9), b = R(-15, 15), x = R(-5, 8);
      return { q: `If <i>f</i>(<i>x</i>) = ${term(m, '<i>x</i>', true)}${constTerm(b)}, what is <i>f</i>(${fmt(x)})?`, a: num(m * x + b), hint: `Replace x with ${fmt(x)}: ${fmt(m)} × ${sp(x)}${constTerm(b)}.`, explain: `${fmt(m)} × ${sp(x)} = ${fmt(m * x)}; ${fmt(m * x)}${constTerm(b)} = ${fmt(m * x + b)}.` };
    }
    if (l === 2) {
      const x1 = R(-8, 8), y1 = R(-8, 8), run = nz(-6, 6), rise = R(-9, 9);
      return { q: `What is the <b>slope</b> of the line through <b>(${fmt(x1)}, ${fmt(y1)})</b> and <b>(${fmt(x1 + run)}, ${fmt(y1 + rise)})</b>?`, a: frac(rise, run), hint: `Slope = (change in y) ÷ (change in x) = (y₂ − y₁) ÷ (x₂ − x₁).`, explain: `(${fmt(y1 + rise)} − ${sp(y1)}) ÷ (${fmt(x1 + run)} − ${sp(x1)}) = ${fr(fmt(rise), fmt(run))} = ${fracHTML(rise, run)}.` };
    }
    if (Math.random() < 0.5) {
      const m = nz(-5, 5), b = R(-10, 10), x1 = R(-5, 5); let x2 = R(-5, 5); if (x2 === x1) x2 = x1 + R(1, 3);
      return { q: `A line passes through <b>(${fmt(x1)}, ${fmt(m * x1 + b)})</b> and <b>(${fmt(x2)}, ${fmt(m * x2 + b)})</b>. What is its <b>y-intercept</b>?`, a: num(b), hint: `Find the slope first. Then use y = mx + b with one point to solve for b.`, explain: `Slope = ${fmt(m)}. ${fmt(m * x1 + b)} = ${fmt(m)} × ${sp(x1)} + b, so b = ${fmt(b)}.` };
    }
    const a = nz(-6, 6), bb = nz(-6, 6), c = R(-12, 12);
    return { q: `What is the slope of the line <b>${term(a, '<i>x</i>', true)}${term(bb, '<i>y</i>')} = ${fmt(c)}</b>?`, a: frac(-a, bb), hint: `Solve for y to get y = mx + b form. The slope is the number in front of x.`, explain: `${term(bb, 'y', true)} = ${term(-a, 'x', true)}${constTerm(c)}, so slope = ${fracHTML(-a, bb)}.` };
  };

  G.g8_exp = (l) => {
    if (l === 1) {
      const b = R(2, 9), m = R(2, 9), n = R(2, 9), f = R(1, 3);
      if (f === 1) return { q: `Write the missing exponent:${big(`${pw(b, m)} × ${pw(b, n)} = ${pw(b, '?')}`)}`, a: num(m + n), hint: `Same base, multiplying → add the exponents.`, explain: `${m} + ${n} = ${m + n}.` };
      if (f === 2) { const M = m + n; return { q: `Write the missing exponent:${big(`${pw(b, M)} ÷ ${pw(b, n)} = ${pw(b, '?')}`)}`, a: num(m), hint: `Same base, dividing → subtract the exponents.`, explain: `${M} − ${n} = ${m}.` }; }
      return { q: `Write the missing exponent:${big(`(${pw(b, m)})<sup>${n}</sup> = ${pw(b, '?')}`)}`, a: num(m * n), hint: `Power of a power → multiply the exponents.`, explain: `${m} × ${n} = ${m * n}.` };
    }
    if (l === 2) {
      const f = R(1, 4);
      if (f === 1) { const b = R(2, 5), e = R(1, b === 2 ? 4 : 2); return { q: `Evaluate (as a fraction):${big(pw(b, -e))}`, a: frac(1, b ** e), hint: `A negative exponent means "1 over": ${pw(b, -e)} = ${fr(1, pw(b, e))}.`, explain: `${fr(1, pw(b, e))} = ${fr(1, b ** e)}.` }; }
      if (f === 2) { const b = R(2, 99), c = R(2, 30); return { q: `Evaluate:${big(`${b}<sup>0</sup> + ${c}`)}`, a: num(1 + c), hint: `Any nonzero number to the power 0 equals 1.`, explain: `${b}<sup>0</sup> = 1, so 1 + ${c} = ${1 + c}.` }; }
      if (f === 3) { const b = R(2, 5), e = pick([2, 3]); return { q: `Evaluate:${big(`(${MINUS}${b})<sup>${e}</sup>`)}`, a: num((-b) ** e), hint: `Multiply ${MINUS}${b} by itself ${e} times. Count the negatives!`, explain: `(${MINUS}${b})<sup>${e}</sup> = ${fmt((-b) ** e)}.` }; }
      const b = R(2, 4), m = R(1, 4), n = m + R(1, 2);
      return { q: `Simplify to a fraction:${big(`${pw(b, m)} × ${pw(b, -n)}`)}`, a: frac(1, b ** (n - m)), hint: `Add the exponents: ${m} + (${MINUS}${n}) = ${m - n}.`, explain: `${pw(b, m - n)} = ${fr(1, b ** (n - m))}.` };
    }
    const sci = (m, e) => `${m} × 10<sup>${e < 0 ? MINUS + -e : e}</sup>`;
    const f = R(1, 3);
    if (f === 1) {
      let D; do { D = R(11, 99); } while (D % 10 === 0);
      const m = (D / 10).toFixed(1);
      if (Math.random() < 0.5) {
        const e = R(3, 9), N = D * 10 ** (e - 1);
        return { q: `Write <b>${fmt(N)}</b> in scientific notation.`, a: choice(sci(m, e), [sci(m, e - 1), sci(m, e + 1), sci(D, e - 1), sci(m, -e)]), hint: `Move the decimal point until you have a number between 1 and 10. Count the moves.`, explain: `${fmt(N)} = ${sci(m, e)}.` };
      }
      const e = R(2, 6), N = '0.' + '0'.repeat(e - 1) + String(D);
      return { q: `Write <b>${N}</b> in scientific notation.`, a: choice(sci(m, -e), [sci(m, e), sci(m, -e + 1), sci(m, -e - 1), sci(D, -e - 1)]), hint: `Small number → negative exponent. Count how many places the decimal moves right to get ${m}.`, explain: `${N} = ${sci(m, -e)}.` };
    }
    const a = R(1, 4), b = R(2, Math.floor(9 / a)), p = R(2, 9), q = R(2, 9);
    if (f === 2) return { q: `Multiply:${big(`(${sci(a, p)}) × (${sci(b, q)})`)}`, a: choice(sci(a * b, p + q), [sci(a * b, p * q), sci(a + b, p + q), sci(a * b, p + q - 1), sci(a * b, p + q + 1)]), hint: `Multiply the front numbers, add the exponents.`, explain: `${a} × ${b} = ${a * b}; 10<sup>${p}+${q}</sup> = 10<sup>${p + q}</sup>.` };
    const P = p + q;
    return { q: `Divide:${big(`(${sci(a * b, P)}) ÷ (${sci(b, q)})`)}`, a: choice(sci(a, P - q), [sci(a, P + q), sci(a * b * b, P - q), sci(a, P - q - 1), sci(a, Math.round(P / q))]), hint: `Divide the front numbers, subtract the exponents.`, explain: `${a * b} ÷ ${b} = ${a}; 10<sup>${P}−${q}</sup> = 10<sup>${P - q}</sup>.` };
  };

  const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]];
  const triple = (l) => { const base = l === 2 ? pick(TRIPLES.slice(0, 3)) : pick(TRIPLES); const k = base[2] > 20 ? 1 : R(1, base[0] === 3 ? 5 : 2); return base.map((x) => x * k); };
  G.g8_pyth = (l) => {
    if (l === 1) {
      if (Math.random() < 0.65) { const n = R(2, 20); return { q: `Evaluate:${big(`√${n * n}`)}`, a: num(n), hint: `What number times itself is ${n * n}?`, explain: `${n} × ${n} = ${n * n}.` }; }
      const n = R(2, 6); return { q: `Evaluate:${big(`∛${n ** 3}`)}`, a: num(n), hint: `What number times itself times itself is ${n ** 3}?`, explain: `${n} × ${n} × ${n} = ${n ** 3}.` };
    }
    if (l === 2) {
      const [a, b, c] = triple(2), sw = Math.random() < 0.5;
      return { q: `A right triangle has legs of <b>${sw ? b : a}</b> and <b>${sw ? a : b}</b>. How long is the hypotenuse?`, a: num(c), hint: `a² + b² = c². ${a}² + ${b}² = ?`, explain: `${a * a} + ${b * b} = ${c * c}, and √${c * c} = ${c}.` };
    }
    const f = R(1, 3);
    if (f === 1) { const [a, b, c] = triple(3); return { q: `A right triangle has a hypotenuse of <b>${c}</b> and one leg of <b>${a}</b>. How long is the other leg?`, a: num(b), hint: `b² = c² − a² = ${c * c} − ${a * a}.`, explain: `${c * c} − ${a * a} = ${b * b}; √${b * b} = ${b}.` }; }
    if (f === 2) {
      const [a, b, c] = triple(2), x1 = R(-6, 6), y1 = R(-6, 6), sx = sign(), sy = sign();
      return { q: `How far apart are the points <b>(${fmt(x1)}, ${fmt(y1)})</b> and <b>(${fmt(x1 + sx * a)}, ${fmt(y1 + sy * b)})</b>?`, a: num(c), hint: `Draw a right triangle: the legs are the horizontal and vertical distances (${a} and ${b}).`, explain: `√(${a}² + ${b}²) = √${c * c} = ${c}.` };
    }
    let n; do { n = R(3, 150); } while (Number.isInteger(Math.sqrt(n)));
    const lo = Math.floor(Math.sqrt(n));
    return { q: `√${n} is between which two whole numbers?`, a: choice(`${lo} and ${lo + 1}`, [`${lo - 1} and ${lo}`, `${lo + 1} and ${lo + 2}`, `${Math.floor(n / 2)} and ${Math.floor(n / 2) + 1}`]), hint: `Which perfect squares are just below and just above ${n}?`, explain: `${lo}² = ${lo * lo} and ${lo + 1}² = ${(lo + 1) ** 2}. ${n} is between them.` };
  };

  G.g8_word = (l) => {
    const t = R(1, 6);
    if (t === 1) {
      const u = R(2, lv(l, 10, 20, 40)), p = R(2, lv(l, 10, 20, 40));
      return { q: `In the Starlight stables there are unicorns (4 legs) and phoenixes (2 legs). There are <b>${u + p}</b> heads and <b>${4 * u + 2 * p}</b> legs. How many <b>unicorns</b> are there?`, a: num(u), hint: `If every animal had 2 legs there would be ${2 * (u + p)} legs. Each unicorn adds 2 extra legs.`, explain: `${4 * u + 2 * p} − ${2 * (u + p)} = ${2 * u} extra legs; ${2 * u} ÷ 2 = ${u} unicorns.` };
    }
    if (t === 2) {
      const e = R(3, 15), r = R(2, 6), n = R(3, 15);
      return { q: `The Starlight Carnival costs <b>$${e}</b> to enter plus <b>$${r}</b> per ride. Nova spent <b>$${e + r * n}</b>. How many rides did she go on?`, a: num(n), hint: `${e} + ${r}r = ${e + r * n}.`, explain: `${e + r * n} − ${e} = ${r * n}; ${r * n} ÷ ${r} = ${n} rides.` };
    }
    if (t === 3) {
      const [a, b, c] = triple(l === 1 ? 2 : 3);
      return { q: `A <b>${c} ft</b> rainbow bridge leans against a castle wall, reaching <b>${b} ft</b> up the wall. How far from the wall is the bottom of the bridge?`, a: num(a), hint: `The bridge is the hypotenuse. a² = ${c}² − ${b}².`, explain: `${c * c} − ${b * b} = ${a * a}; √${a * a} = ${a} ft.` };
    }
    if (t === 4) {
      let b, d; do { b = R(2, 12); d = R(1, 10); } while (b <= d);
      const w = R(2, lv(l, 8, 15, 25)), c = R(20, 100), a = c - (b - d) * w;
      if (a < 0) return G.g8_word(l);
      return { q: `Princess Lumi has <b>$${a}</b> and saves <b>$${b}</b> each week. Sensei Koa has <b>$${c}</b> and saves <b>$${d}</b> each week. After how many weeks will they have the same amount?`, a: num(w), hint: `${a} + ${b}w = ${c} + ${d}w. Solve for w.`, explain: `${b - d}w = ${c - a}, so w = ${w}.` };
    }
    if (t === 5) {
      const r = R(1, lv(l, 3, 5, 8)), h = R(2, lv(l, 5, 10, 15));
      return { q: `A cylinder-shaped fish tank has a radius of <b>${r} ft</b> and a height of <b>${h} ft</b>. What is its volume? Use π ≈ 3.14.`, a: num((314 * r * r * h) / 100, 0.011), hint: `Volume of a cylinder = π × r² × h.`, explain: `3.14 × ${r * r} × ${h} = ${fmt((314 * r * r * h) / 100)} cubic ft.` };
    }
    const s = R(50, 200), rate = R(5, 25), n = R(3, lv(l, 10, 20, 40));
    return { q: `The Rainbow Dragon is flying at <b>${s} m</b> and climbs <b>${rate} m</b> every second. After how many seconds will it reach <b>${s + rate * n} m</b>?`, a: num(n), hint: `Write y = ${rate}x + ${s} and set y = ${s + rate * n}.`, explain: `${s + rate * n} − ${s} = ${rate * n}; ${rate * n} ÷ ${rate} = ${n} seconds.` };
  };

  // ---------- public API ----------
  function generate(topic, level, seen) {
    const g = G[topic];
    if (!g) throw new Error('Unknown topic ' + topic);
    let q;
    for (let i = 0; i < 12; i++) { q = g(level); if (!seen || !seen.has(q.q)) break; }
    if (seen) seen.add(q.q);
    q.topic = topic;
    q.level = level;
    return q;
  }

  MQ.Q = { generate, check, answerHTML, parseAnswer, sampleInput, topics: Object.keys(G) };
})();
