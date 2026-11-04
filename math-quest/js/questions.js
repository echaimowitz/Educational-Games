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
    const s = String(raw).replace(/,/g, '').replace(/−/g, '-').replace(/[$%]/g, '').replace(/\s+/g, ' ').trim();
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
        q: `📍 <b>Place value</b> (not rounding!): the underlined <b>${d}</b> is worth how much in this number?${big(underlineDigit(n, i))}`, a: num(val),
        hint: `Count places from the right: ones, tens, hundreds, thousands… The ${d} is worth ${d} × that place.`,
        explain: `The ${d} is in the ${PLACE[10 ** i]} place, so it is worth ${d} × ${fmt(10 ** i)} = ${fmt(val)}. (Rounding would be a different question!)`,
      };
    }
    let n, p;
    if (l === 1) { n = R(1000, 9999); p = pick([10, 100]); }
    else if (l === 2) { n = R(10000, 99999); p = pick([100, 1000]); }
    else { n = R(100000, 9999999); p = pick([1000, 10000, 100000]); }
    const ans = Math.round(n / p) * p, lo = Math.floor(n / p) * p;
    return {
      q: `🎯 <b>Rounding:</b> round to the nearest <b>${fmt(p)}</b>.${big(fmt(n))}`, a: num(ans),
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

  // ======================= Extra Grade 4 missions =======================
  const d1 = (x) => x.toFixed(1), d2 = (x) => x.toFixed(2);
  G.g4_dec = (l) => {
    if (l === 1) {
      if (Math.random() < 0.5) { const n = R(1, 9); return { q: `Write as a decimal:${big(fr(n, 10))}`, a: num(n / 10), hint: `${fr(1, 10)} is one tenth, written 0.1.`, explain: `${fr(n, 10)} = ${n} tenths = ${d1(n / 10)}.` }; }
      const n = R(1, 99); return { q: `Write as a decimal:${big(fr(n, 100))}`, a: num(n / 100), hint: `Hundredths use two places after the decimal point.`, explain: `${fr(n, 100)} = ${d2(n / 100)}.` };
    }
    if (l === 2) {
      if (Math.random() < 0.5) {
        const a = R(1, 9); let b; do { b = R(10, 99); } while (b % 10 === 0);
        let L = d1(a / 10), Rt = d2(b / 100), lv1 = a * 10, rv = b;
        if (Math.random() < 0.5) { [L, Rt] = [Rt, L]; [lv1, rv] = [rv, lv1]; }
        const s = lv1 > rv ? '&gt;' : '&lt;';
        return { q: `Which symbol makes this true?${big(`${L} &nbsp;?&nbsp; ${Rt}`)}`, a: choiceFixed(['&lt;', '&gt;', '='], s), hint: `Write tenths as hundredths: 0.${a} = 0.${a}0. Then compare.`, explain: `${d2(lv1 / 100)} vs ${d2(rv / 100)}, so ${L} ${s} ${Rt}.` };
      }
      const a = R(1, 9), b = R(1, 99);
      return { q: `Add, and write the answer in hundredths:${big(`${fr(a, 10)} + ${fr(b, 100)} = ${fr('?', 100)}`)}`, a: num(10 * a + b), hint: `${fr(a, 10)} = ${fr(a * 10, 100)}. Now add the hundredths.`, explain: `${fr(a * 10, 100)} + ${fr(b, 100)} = ${fr(10 * a + b, 100)}.` };
    }
    let x, y; do { x = R(1, 9); y = R(1, 9); } while (x === y);
    const vals = [x / 10, (10 * x + y) / 100, (10 * y + x) / 100, y / 100];
    const strs = [d1(vals[0]), d2(vals[1]), d2(vals[2]), d2(vals[3])];
    const most = Math.random() < 0.5;
    const target = most ? Math.max(...vals) : Math.min(...vals);
    const correct = strs[vals.indexOf(target)];
    return { q: `Which decimal is the <b>${most ? 'greatest' : 'least'}</b>?`, a: choice(correct, strs.filter((s) => s !== correct)), hint: `Line them up as hundredths (0.${x} = 0.${x}0) and compare digit by digit.`, explain: `As hundredths: ${vals.map((v) => d2(v)).join(', ')}. The ${most ? 'greatest' : 'least'} is ${correct}.` };
  };

  G.g4_angle = (l) => {
    if (l === 1) {
      if (Math.random() < 0.5) { const t = pick([['a quarter turn', 90], ['a half turn', 180], ['a three-quarter turn', 270], ['a full turn', 360]]); return { q: `An anglerfish spins <b>${t[0]}</b>. How many degrees is that?`, a: num(t[1]), hint: `A full turn is 360°.`, explain: `${t[0]} = ${t[1]}°.` }; }
      const a = R(20, 160); return { q: `Two angles sit together on a straight line. One is <b>${a}°</b>. What is the other?`, a: num(180 - a), hint: `A straight line makes 180°.`, explain: `180 − ${a} = ${180 - a}°.` };
    }
    if (l === 2) {
      if (Math.random() < 0.5) { const a = R(10, 80); return { q: `A right angle is split into two angles. One is <b>${a}°</b>. What is the other?`, a: num(90 - a), hint: `A right angle is 90°.`, explain: `90 − ${a} = ${90 - a}°.` }; }
      const a = R(60, 150), b = R(60, 150); return { q: `Three angles go all the way around a point. Two are <b>${a}°</b> and <b>${b}°</b>. What is the third?`, a: num(360 - a - b), hint: `All the way around a point is 360°.`, explain: `360 − ${a} − ${b} = ${360 - a - b}°.` };
    }
    if (Math.random() < 0.5) { const h = R(1, 11), ang = Math.min(h, 12 - h) * 30; return { q: `What is the smaller angle between the clock hands at <b>${h}:00</b>?`, a: num(ang), hint: `The clock is 360°, and each hour mark is 360 ÷ 12 = 30° apart.`, explain: `${Math.min(h, 12 - h)} hour marks × 30° = ${ang}°.` }; }
    const k = pick(['Acute', 'Right', 'Obtuse', 'Straight']), deg = k === 'Acute' ? R(5, 85) : k === 'Right' ? 90 : k === 'Obtuse' ? R(95, 175) : 180;
    return { q: `What kind of angle measures <b>${deg}°</b>?`, a: choiceFixed(['Acute', 'Right', 'Obtuse', 'Straight'], k), hint: `Acute < 90°, right = 90°, obtuse is between 90° and 180°, straight = 180°.`, explain: `${deg}° is ${k.toLowerCase()}.` };
  };

  // ======================= Extra Grade 6 missions =======================
  G.g6_int = (l) => {
    if (l === 1) {
      const f = R(1, 3);
      if (f === 1) { const n = nz(-50, 50); return { q: `Evaluate:${big(`|${fmt(n)}|`)}`, a: num(Math.abs(n)), hint: `Absolute value is the distance from 0. It is never negative.`, explain: `${fmt(n)} is ${Math.abs(n)} away from 0.` }; }
      if (f === 2) { const n = nz(-40, 40); return { q: `What is the <b>opposite</b> of ${fmt(n)}?`, a: num(-n), hint: `Opposites are the same distance from 0 on different sides.`, explain: `The opposite of ${fmt(n)} is ${fmt(-n)}.` }; }
      let a, b; do { a = R(-20, 5); b = R(-20, 5); } while (a === b);
      const s = a > b ? '&gt;' : '&lt;';
      return { q: `Which symbol makes this true?${big(`${fmt(a)} &nbsp;?&nbsp; ${fmt(b)}`)}`, a: choiceFixed(['&lt;', '&gt;', '='], s), hint: `On a number line, numbers to the right are greater.`, explain: `${fmt(a)} ${s} ${fmt(b)}.` };
    }
    if (l === 2) {
      if (Math.random() < 0.5) {
        const x = nz(-9, 9), y = nz(-9, 9), qd = x > 0 ? (y > 0 ? 'I' : 'IV') : y > 0 ? 'II' : 'III';
        return { q: `The magic mirror is at point <b>(${fmt(x)}, ${fmt(y)})</b>. Which quadrant is it in?`, a: choiceFixed(['Quadrant I', 'Quadrant II', 'Quadrant III', 'Quadrant IV'], 'Quadrant ' + qd), hint: `I is (+, +), II is (−, +), III is (−, −), IV is (+, −).`, explain: `x is ${x > 0 ? 'positive' : 'negative'} and y is ${y > 0 ? 'positive' : 'negative'}, so it's Quadrant ${qd}.` };
      }
      const x = nz(-9, 9), y1 = R(1, 12), y2 = -R(1, 12);
      return { q: `How far apart are the points <b>(${fmt(x)}, ${y1})</b> and <b>(${fmt(x)}, ${fmt(y2)})</b>?`, a: num(y1 - y2), hint: `Same x, so count vertically: from ${fmt(y2)} up to 0, then up to ${y1}.`, explain: `${-y2} + ${y1} = ${y1 - y2} units.` };
    }
    if (Math.random() < 0.5) {
      const set = new Set(); while (set.size < 4) set.add(R(-24, 12) / 4);
      const vals = [...set], most = Math.random() < 0.5, t = most ? Math.max(...vals) : Math.min(...vals);
      const correct = fmt(t);
      return { q: `Which number is the <b>${most ? 'greatest' : 'least'}</b>?`, a: choice(correct, vals.filter((v) => v !== t).map(fmt)), hint: `Picture a number line. Negative numbers farther from 0 are smaller.`, explain: `In order: ${vals.slice().sort((a, b) => a - b).map(fmt).join(' < ')}.` };
    }
    const sub = R(20, 300), bird = R(10, 150);
    return { q: `A submarine is at <b>${MINUS}${sub} m</b> (below sea level). A royal falcon flies at <b>${bird} m</b>. How far apart are they vertically?`, a: num(sub + bird), hint: `Distance = |${MINUS}${sub}| + ${bird}.`, explain: `${sub} + ${bird} = ${sub + bird} m.` };
  };

  G.g6_geo = (l) => {
    if (l === 1) {
      const b = R(3, 20), h = R(2, 15);
      if (Math.random() < 0.5) return { q: `A parallelogram-shaped castle window has a base of <b>${b} in</b> and a height of <b>${h} in</b>. What is its area?`, a: num(b * h), hint: `Area of a parallelogram = base × height.`, explain: `${b} × ${h} = ${b * h} sq in.` };
      return { q: `A triangular banner has a base of <b>${b} ft</b> and a height of <b>${h} ft</b>. What is its area?`, a: num((b * h) / 2), hint: `Area of a triangle = ${fr(1, 2)} × base × height.`, explain: `${fr(1, 2)} × ${b} × ${h} = ${fmt((b * h) / 2)} sq ft.` };
    }
    if (l === 2) {
      if (Math.random() < 0.5) { const b1 = R(4, 16), b2 = R(4, 16), h = R(2, 12); return { q: `A trapezoid-shaped garden has parallel sides of <b>${b1} m</b> and <b>${b2} m</b>, and a height of <b>${h} m</b>. What is its area?`, a: num(((b1 + b2) * h) / 2), hint: `Area of a trapezoid = ${fr(1, 2)} × (base₁ + base₂) × height.`, explain: `${fr(1, 2)} × ${b1 + b2} × ${h} = ${fmt(((b1 + b2) * h) / 2)} sq m.` }; }
      const L = R(2, 9), W = R(2, 9), H = R(1, 6) + 0.5;
      return { q: `A royal jewel box is <b>${L} cm</b> long, <b>${W} cm</b> wide, and <b>${H} cm</b> tall. What is its volume?`, a: num(L * W * H), hint: `Volume = length × width × height. ${H} is ${Math.floor(H)} and a half.`, explain: `${L} × ${W} × ${H} = ${fmt(L * W * H)} cubic cm.` };
    }
    if (Math.random() < 0.5) { const L = R(2, 10), W = R(2, 8), H = R(2, 8), sa = 2 * (L * W + L * H + W * H); return { q: `A gift box for the princess is <b>${L} in</b> × <b>${W} in</b> × <b>${H} in</b>. How much wrapping paper covers the whole outside (its <b>surface area</b>)?`, a: num(sa), hint: `A box has 6 faces in 3 matching pairs: ${L}×${W}, ${L}×${H}, ${W}×${H}.`, explain: `2 × (${L * W} + ${L * H} + ${W * H}) = ${sa} sq in.` }; }
    const W = 2 * R(2, 8), H = R(3, 12), t = R(2, 10);
    return { q: `A castle wall is a rectangle <b>${W} ft</b> wide and <b>${H} ft</b> tall with a triangle on top that is <b>${t} ft</b> tall (same ${W} ft base). What is the total area?`, a: num(W * H + (W * t) / 2), hint: `Add the rectangle's area and the triangle's area.`, explain: `${W} × ${H} = ${W * H}; ${fr(1, 2)} × ${W} × ${t} = ${(W * t) / 2}; total ${W * H + (W * t) / 2} sq ft.` };
  };

  // ======================= BONUS WORLDS (grade-aware) =======================
  // These take (level, grade) so they fit every player's grade.
  const SING = { feet: 'foot', yards: 'yard', hours: 'hour', minutes: 'minute', pounds: 'pound', gallons: 'gallon', kilograms: 'kilogram', meters: 'meter', kilometers: 'kilometer', liters: 'liter', days: 'day', weeks: 'week' };
  const CONV = [['feet', 'inches', 12], ['yards', 'feet', 3], ['hours', 'minutes', 60], ['minutes', 'seconds', 60], ['pounds', 'ounces', 16], ['gallons', 'quarts', 4], ['kilograms', 'grams', 1000], ['meters', 'centimeters', 100], ['kilometers', 'meters', 1000], ['liters', 'milliliters', 1000], ['days', 'hours', 24], ['weeks', 'days', 7]];
  const METRIC = CONV.filter((c) => c[2] === 100 || c[2] === 1000);

  // --- Mermaid Lagoon: measurement ---
  G.b_convert = (l, g) => {
    const [bigU, small, f] = pick(CONV);
    if (g <= 5) {
      if (l === 1) { const n = R(2, 12); return { q: `Marina the Mermaid asks: <b>${n} ${bigU}</b> = how many <b>${small}</b>?`, a: num(n * f), hint: `1 ${SING[bigU]} = ${f} ${small}. Multiply by ${f}.`, explain: `${n} × ${f} = ${fmt(n * f)} ${small}.` }; }
      if (l === 2) { const n = R(2, 9), r = R(1, Math.min(f - 1, 99)); return { q: `<b>${n} ${bigU} ${r} ${small}</b> = how many <b>${small}</b> in all?`, a: num(n * f + r), hint: `Change ${n} ${bigU} to ${small} first (× ${f}), then add ${r}.`, explain: `${n} × ${f} = ${fmt(n * f)}, plus ${r} = ${fmt(n * f + r)} ${small}.` }; }
      if (g === 4) { const n = R(2, 15); return { q: `<b>${fmt(n * f)} ${small}</b> = how many <b>${bigU}</b>?`, a: num(n), hint: `Going from small units to big units: divide by ${f}.`, explain: `${fmt(n * f)} ÷ ${f} = ${n} ${bigU}.` }; }
      const [mb, ms, mf] = pick(METRIC), X = R(11, 99);
      return { q: `<b>${d1(X / 10)} ${mb}</b> = how many <b>${ms}</b>?`, a: num((X * mf) / 10), hint: `1 ${SING[mb]} = ${fmt(mf)} ${ms}. Multiply ${d1(X / 10)} × ${fmt(mf)}.`, explain: `${d1(X / 10)} × ${fmt(mf)} = ${fmt((X * mf) / 10)} ${ms}.` };
    }
    if (l === 1) { const [b2, s2, f2] = pick(CONV.filter((c) => c[2] % 2 === 0)), k = R(3, 21), v = (k * f2) / 2; return { q: `<b>${fmt(v)} ${s2}</b> = how many <b>${b2}</b>?`, a: num(k / 2), hint: `Small → big: divide by ${f2}. The answer might be a decimal!`, explain: `${fmt(v)} ÷ ${f2} = ${fmt(k / 2)} ${b2}.` }; }
    if (l === 2) {
      const [from, to, f2, who] = pick([['second', 'minute', 60, 'A dolphin'], ['minute', 'hour', 60, 'A sea turtle'], ['hour', 'day', 24, 'A whale']]), r = R(2, 15);
      return { q: `${who} swims <b>${r} meters per ${from}</b>. How many meters is that per <b>${to}</b>?`, a: num(r * f2), hint: `There are ${f2} ${from}s in a ${to}.`, explain: `${r} × ${f2} = ${fmt(r * f2)} meters per ${to}.` };
    }
    const s = pick([5, 10, 20, 25, 50]), d = R(2, 15) + pick([0, 0.5]);
    return { q: `On Marina's treasure map, <b>1 cm = ${s} km</b>. Two islands are <b>${d} cm</b> apart on the map. How far apart are they really, in km?`, a: num(d * s), hint: `Each cm stands for ${s} km. Multiply.`, explain: `${d} × ${s} = ${fmt(d * s)} km.` };
  };

  const clock = (mins) => { mins = ((mins % 1440) + 1440) % 1440; let h = Math.floor(mins / 60); const m = mins % 60, ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')} ${ap}`; };
  const durText = (mins) => { const h = Math.floor(mins / 60), m = mins % 60; return [h ? `${h} hour${h > 1 ? 's' : ''}` : '', m ? `${m} minutes` : ''].filter(Boolean).join(' '); };
  G.b_time = (l, g) => {
    if (g <= 5) {
      const start = l === 1 ? 15 * R(28, 64) : 5 * R(84, 192);
      const dur = l === 1 ? 60 * R(1, 4) + pick([0, 15, 30]) : 5 * R(4, 26);
      const end = start + dur;
      if (l === 3) return { q: `Mermaid swim practice starts at <b>${clock(start)}</b> and ends at <b>${clock(end)}</b>. How many <b>minutes</b> long is it?`, a: num(dur), hint: `Count up to the next hour first, then add the rest.`, explain: `From ${clock(start)} to ${clock(end)} is ${durText(dur)} = ${dur} minutes.` };
      return { q: `The mermaid concert starts at <b>${clock(start)}</b> and lasts <b>${durText(dur)}</b>. What time does it end?`, a: choice(clock(end), [clock(end + 60), clock(end - 10), clock(end + 15), clock(end - 60), clock(end + 30)]), hint: `Add the hours first, then the minutes. 60 minutes makes a new hour.`, explain: `${clock(start)} + ${durText(dur)} = ${clock(end)}.` };
    }
    if (l === 1) { const r = R(3, 25), t = R(2, 9); return { q: `A mermaid swims at <b>${r} km per hour</b> for <b>${t} hours</b>. How far does she swim?`, a: num(r * t), hint: `distance = rate × time.`, explain: `${r} × ${t} = ${r * t} km.` }; }
    if (l === 2) { const r = R(3, 25), t = R(2, 12); return { q: `A dolphin needs to swim <b>${r * t} km</b> at <b>${r} km per hour</b>. How many hours will it take?`, a: num(t), hint: `time = distance ÷ rate.`, explain: `${r * t} ÷ ${r} = ${t} hours.` }; }
    const s = R(2, 12), M = pick([15, 20, 30, 45, 90]), D = (s * M) / 60;
    return { q: `A sea turtle swims <b>${fmt(D)} km</b> in <b>${M} minutes</b>. What is its speed in <b>km per hour</b>?`, a: num(s), hint: `${M} minutes is ${fr(M, 60)} of an hour. How many ${M}-minute chunks are in 60 minutes?`, explain: `${fmt(D)} ÷ ${fr(M, 60)} = ${fmt(D)} × ${fmt(60 / M)} = ${s} km per hour.` };
  };

  G.b_deal = (l, g) => {
    if (g <= 5) {
      const lbs = Math.random() < 0.5, B = lbs ? 'lb' : 'ft', S = lbs ? 'oz' : 'in', f = lbs ? 16 : 12, thing = lbs ? 'pearl sacks' : 'kelp ribbons';
      const a = R(1, 6), b = R(1, f - 1), c = R(1, 5), d = R(1, f - 1);
      if (l === 1) return { q: `A ${lbs ? 'pearl sack weighs' : 'kelp ribbon is'} <b>${a} ${B} ${b} ${S}</b>. How many <b>${S}</b> is that?`, a: num(a * f + b), hint: `1 ${B} = ${f} ${S}.`, explain: `${a} × ${f} + ${b} = ${a * f + b} ${S}.` };
      const A = a * f + b, C = c * f + d;
      if (l === 2) return { q: `Two ${thing}: <b>${a} ${B} ${b} ${S}</b> and <b>${c} ${B} ${d} ${S}</b>. What is the total in <b>${S}</b>?`, a: num(A + C), hint: `Change each one to ${S} (1 ${B} = ${f} ${S}), then add.`, explain: `${A} + ${C} = ${A + C} ${S}.` };
      const hi = Math.max(A, C), lo = Math.min(A, C) === hi ? hi - 1 : Math.min(A, C);
      const show = (v) => `${Math.floor(v / f)} ${B} ${v % f} ${S}`;
      return { q: `One of the ${thing} is <b>${show(hi)}</b> and the other is <b>${show(lo)}</b>. How many <b>${S}</b> bigger is the first one?`, a: num(hi - lo), hint: `Change both to ${S}, then subtract.`, explain: `${hi} − ${lo} = ${hi - lo} ${S}.` };
    }
    let pA, pB; do { pA = 5 * R(10, 60); pB = 5 * R(10, 60); } while (pA === pB);
    const nA = R(2, 8); let nB; do { nB = R(2, 8); } while (nB === nA);
    const shops = `<b>Shop A:</b> ${nA} shells for ${money((nA * pA) / 100)}. <b>Shop B:</b> ${nB} shells for ${money((nB * pB) / 100)}.`;
    if (l === 1) return { q: `At Pearl Market, ${shops} What is the price of <b>one shell at Shop A</b>?`, a: cash(pA / 100), hint: `Unit price = total cost ÷ number of shells.`, explain: `${money((nA * pA) / 100)} ÷ ${nA} = ${money(pA / 100)}.` };
    if (l === 2) return { q: `At Pearl Market, ${shops} Which is the better deal?`, a: choiceFixed(['Shop A', 'Shop B'], pA < pB ? 'Shop A' : 'Shop B'), hint: `Find the price of ONE shell at each shop.`, explain: `A: ${money(pA / 100)} each. B: ${money(pB / 100)} each. ${pA < pB ? 'A' : 'B'} is cheaper.` };
    const k = R(6, 20);
    return { q: `At Pearl Market, ${shops} How much do you save on <b>${k} shells</b> by buying at the cheaper shop?`, a: cash((k * Math.abs(pA - pB)) / 100), hint: `Find each unit price, subtract, then multiply by ${k}.`, explain: `Difference per shell: ${money(Math.abs(pA - pB) / 100)}. × ${k} = ${money((k * Math.abs(pA - pB)) / 100)}.` };
  };

  // --- Puppy Park: data ---
  const listStr = (v) => v.length === 2 ? v.join(' and ') : v.slice(0, -1).join(', ') + ', and ' + v[v.length - 1];
  function meanSet(n, m, spread) {
    for (;;) {
      const v = []; let s = 0;
      for (let i = 0; i < n - 1; i++) { const x = R(Math.max(1, m - spread), m + spread); v.push(x); s += x; }
      const last = n * m - s;
      if (last >= 1 && last <= m + spread * 2 && last >= m - spread * 2) { v.push(last); return v; }
    }
  }
  G.b_mean = (l, g) => {
    const n = lv(l, 3, 4, 5) + (g >= 7 ? 1 : 0), m = R(lv(l, 4, 8, 12), lv(l, 12, 25, 40)) + (g >= 6 ? 10 : 0), v = meanSet(n, m, Math.max(3, Math.floor(m / 3)));
    const ctx = pick([['puppies', 'weigh', 'pounds'], ['puppies', 'learned', 'tricks'], ['puppies', 'ate', 'treats']]);
    if (l === 3 && g >= 6) {
      const known = v.slice(0, -1);
      return { q: `The <b>mean</b> of ${n} puppies' scores at the dog show is <b>${m}</b>. ${n - 1} of the scores are ${listStr(known)}. What is the last puppy's score?`, a: num(v[n - 1]), hint: `The total must be ${n} × ${m} = ${n * m}. Subtract the scores you know.`, explain: `${n * m} − ${known.reduce((a, b) => a + b, 0)} = ${v[n - 1]}.` };
    }
    return { q: `The ${n} ${ctx[0]} at Puppy Park ${ctx[1]} ${listStr(v)} ${ctx[2]}. What is the <b>mean</b> (average)?`, a: num(m), hint: `Add them all up, then divide by ${n}.`, explain: `Sum = ${n * m}. ${n * m} ÷ ${n} = ${m}.` };
  };

  G.b_median = (l, g) => {
    const top = lv(l, 20, 50, 100) + (g >= 6 ? 50 : 0);
    if (l === 2) {
      if (Math.random() < 0.5) {
        const set = new Set(); while (set.size < 5) set.add(R(1, top));
        const v = [...set], dup = pick(v), all = shuffle([...v, dup]);
        return { q: `Puppies fetched these numbers of balls: ${listStr(all)}. What is the <b>mode</b>?`, a: num(dup), hint: `The mode is the number that appears most often.`, explain: `${dup} appears twice.` };
      }
      const v = Array.from({ length: 6 }, () => R(1, top));
      return { q: `Puppy tail-wags per minute: ${listStr(v)}. What is the <b>range</b>?`, a: num(Math.max(...v) - Math.min(...v)), hint: `Range = biggest − smallest.`, explain: `${Math.max(...v)} − ${Math.min(...v)} = ${Math.max(...v) - Math.min(...v)}.` };
    }
    const n = l === 1 ? pick([5, 7]) : pick([4, 6]), v = Array.from({ length: n }, () => R(1, top)), s = v.slice().sort((a, b) => a - b);
    const med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
    return { q: `Puppies' jump heights (in inches): ${listStr(v)}. What is the <b>median</b>?`, a: num(med), hint: `Put them in order first.${n % 2 ? '' : ' With an even count, the median is halfway between the two middle numbers.'}`, explain: `In order: ${s.join(', ')}. The median is ${fmt(med)}.` };
  };

  G.b_chance = (l, g) => {
    if (g <= 5 && l === 1) {
      const r = R(1, 9), b = Math.random() < 0.2 ? r : R(1, 9);
      return { q: `A toy box has <b>${r} red</b> balls and <b>${b} blue</b> balls. A puppy grabs one without looking. Which color is <b>more likely</b>?`, a: choiceFixed(['Red', 'Blue', 'Equally likely'], r > b ? 'Red' : b > r ? 'Blue' : 'Equally likely'), hint: `Whichever color has more balls is more likely.`, explain: `${r} red vs ${b} blue.` };
    }
    const n = R(4, 10), k = R(1, n - 1);
    if (l === 1 || (l === 2 && g <= 5)) return { q: `A spinner has <b>${n}</b> equal parts, and <b>${k}</b> ${k === 1 ? "has" : "have"} a 🦴 bone. What is the probability of landing on a bone? (as a fraction)`, a: frac(k, n), hint: `Bone parts ÷ all parts.`, explain: `${fracHTML(k, n)}.` };
    if (l === 2 || g <= 5) { const T = n * R(2, 10); return { q: `A spinner has <b>${n}</b> equal parts, and <b>${k}</b> ${k === 1 ? "has" : "have"} a bone. If you spin it <b>${T}</b> times, about how many times should you land on a bone?`, a: num((T * k) / n), hint: `Expected = probability × number of spins = ${fr(k, n)} × ${T}.`, explain: `${fr(k, n)} × ${T} = ${(T * k) / n}.` }; }
    if (Math.random() < 0.5) return { q: `A spinner has <b>${n}</b> equal parts, and <b>${k}</b> ${k === 1 ? "has" : "have"} a bone. What is the probability of <b>NOT</b> landing on a bone? (as a fraction)`, a: frac(n - k, n), hint: `P(not) = 1 − P(bone).`, explain: `1 − ${fr(k, n)} = ${fracHTML(n - k, n)}.` };
    const m = R(3, 8), j = R(1, m - 1);
    return { q: `Spin a ${n}-part spinner (${k} parts have a bone) <b>and</b> pick from a bag of ${m} balls (${j} are green). What is the probability of a bone AND a green ball? (as a fraction)`, a: frac(k * j, n * m), hint: `Independent events: multiply the probabilities.`, explain: `${fr(k, n)} × ${fr(j, m)} = ${fracHTML(k * j, n * m)}.` };
  };

  // --- Space Station: patterns & algebra ---
  G.b_pattern = (l, g) => {
    if (g <= 5) {
      const a = R(1, 30), d = l === 1 ? R(2, 12) : R(6, 25), down = l === 2 && Math.random() < 0.5;
      const step = down ? -d : d, start = down ? a + 6 * d : a, terms = [0, 1, 2, 3].map((i) => start + i * step);
      if (l === 3) return { q: `Comet pattern: ${terms.join(', ')}, … What is the <b>10th</b> number?`, a: num(start + 9 * step), hint: `Each step adds ${d}. From the 1st to the 10th number is 9 steps.`, explain: `${start} + 9 × ${d} = ${start + 9 * step}.` };
      return { q: `What comes next in the comet pattern?${big(terms.join(', ') + ', ?')}`, a: num(start + 4 * step), hint: `What do you ${down ? 'subtract' : 'add'} each time?`, explain: `The rule is ${down ? '−' : '+'}${d}: ${terms[3]} ${down ? '−' : '+'} ${d} = ${start + 4 * step}.` };
    }
    if (l === 1) { const a = R(-20, 20), d = nz(-9, 9), t = [0, 1, 2, 3].map((i) => a + i * d); return { q: `What comes next?${big(t.map(fmt).join(', ') + ', ?')}`, a: num(a + 4 * d), hint: `Find the difference between neighbors.`, explain: `The rule is ${d > 0 ? '+' : '−'}${Math.abs(d)}, so next is ${fmt(a + 4 * d)}.` }; }
    if (l === 2) { const a = R(1, 5), r = pick([2, 3, -2]), t = [0, 1, 2, 3].map((i) => a * r ** i); return { q: `What comes next?${big(t.map(fmt).join(', ') + ', ?')}`, a: num(a * r ** 4), hint: `This one multiplies each time. By what?`, explain: `× ${fmt(r)} each time: ${fmt(t[3])} × ${sp(r)} = ${fmt(a * r ** 4)}.` }; }
    if (g >= 8 && Math.random() < 0.5) { const c = R(-3, 6), t = [1, 2, 3, 4].map((n) => n * n + c); return { q: `What comes next?${big(t.map(fmt).join(', ') + ', ?')}`, a: num(25 + c), hint: `Look at the differences between terms. They grow by 2 each time!`, explain: `These are n² ${c >= 0 ? '+' : '−'} ${Math.abs(c)}: 5² ${c >= 0 ? '+' : '−'} ${Math.abs(c)} = ${25 + c}.` }; }
    const d = R(2, 9), c = R(-6, 9), t = [1, 2, 3, 4].map((n) => d * n + c);
    const rule = (k, cc) => `${term(k, '<i>n</i>', true)}${constTerm(cc)}`;
    return { q: `Which rule gives the pattern <b>${t.map(fmt).join(', ')}, …</b> (where <i>n</i> is the position 1, 2, 3, …)?`, a: choice(rule(d, c), [rule(d, c + d), rule(c === 0 ? d + 1 : Math.abs(c), d), `<i>n</i> + ${d}`, rule(d + 1, c - 1)]), hint: `The jump between terms is the number in front of n. Then check n = 1.`, explain: `Jump = ${d}, and ${d}(1)${constTerm(c)} = ${t[0]}, so the rule is ${rule(d, c)}.` };
  };

  const ioTable = (xs, ys) => `<table class="io"><tr><th>In</th>${xs.map((x) => `<td>${typeof x === 'number' ? fmt(x) : x}</td>`).join('')}</tr><tr><th>Out</th>${ys.map((y) => `<td>${typeof y === 'number' ? fmt(y) : y}</td>`).join('')}</tr></table>`;
  G.b_table = (l, g) => {
    if (g <= 5) {
      const k = R(2, 9), c = l === 1 ? 0 : R(1, 9), add = l === 1 && Math.random() < 0.4, f = (x) => (add ? x + k * 3 : k * x + c);
      const xs = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 4).sort((a, b) => a - b);
      const rule = add ? `add ${k * 3}` : c ? `× ${k}, then + ${c}` : `× ${k}`;
      if (l === 3) { const ys = xs.map(f); return { q: `Robot Rule machine! Find the missing <b>input</b>:${ioTable([xs[0], xs[1], xs[2], '?'], ys)}`, a: num(xs[3]), hint: `First discover the rule from the full columns. Then work backwards.`, explain: `The rule is ${rule}. Working back from ${ys[3]} gives ${xs[3]}.` }; }
      return { q: `Robot Rule machine! What is the missing <b>output</b>?${ioTable(xs, [f(xs[0]), f(xs[1]), f(xs[2]), '?'])}`, a: num(f(xs[3])), hint: `Look at how each In becomes its Out. Is it adding? Multiplying?`, explain: `The rule is ${rule}, so ${xs[3]} → ${f(xs[3])}.` };
    }
    const k = nz(-6, 6), c = R(-9, 9), f = (x) => k * x + c, off = R(0, 1), xs = [-2, -1, 0, 1, 2].slice(off, off + 4);
    if (l === 1) return { q: `What is the missing output?${ioTable(xs, [f(xs[0]), f(xs[1]), f(xs[2]), '?'])}`, a: num(f(xs[3])), hint: `How much does Out change each time In goes up by 1?`, explain: `y = ${term(k, 'x', true)}${constTerm(c)}, so ${fmt(xs[3])} → ${fmt(f(xs[3]))}.` };
    if (l === 2) { const X = R(10, 25); return { q: `This robot follows a linear rule. What is the output when the input is <b>${X}</b>?${ioTable(xs, xs.map(f))}`, a: num(f(X)), hint: `Find the rule first: the change per step is the slope, and the output at In = 0 is the starting value.`, explain: `y = ${term(k, 'x', true)}${constTerm(c)}, so ${k} × ${X}${constTerm(c)} = ${fmt(f(X))}.` }; }
    const eq = (kk, cc) => `<i>y</i> = ${term(kk, '<i>x</i>', true)}${constTerm(cc)}`;
    return { q: `Which equation matches this table?${ioTable(xs, xs.map(f))}`, a: choice(eq(k, c), [eq(-k, c), eq(k, c + k), eq(c === 0 ? k + 1 : c, k), eq(k + 1, c)]), hint: `The change in Out per 1 step of In is the slope. The output at In = 0 is the y-intercept.`, explain: `Slope ${fmt(k)}, intercept ${fmt(c)}: ${eq(k, c)}.` };
  };

  G.b_expr = (l, g) => {
    if (g <= 5) {
      if (l === 1) { const a = R(2, 12), b = R(2, 12); return Math.random() < 0.5 ? { q: `Find the missing number:${big(`${a} × ? = ${a * b}`)}`, a: num(b), hint: `Think: ${a * b} ÷ ${a}.`, explain: `${a} × ${b} = ${a * b}.` } : { q: `Find the missing number:${big(`? ÷ ${a} = ${b}`)}`, a: num(a * b), hint: `Undo division with multiplication: ${b} × ${a}.`, explain: `${a * b} ÷ ${a} = ${b}.` }; }
      if (l === 2) { const t = R(300, 1500), x = R(100, t - 50); return Math.random() < 0.5 ? { q: `Find the missing number:${big(`${fmt(t)} ${MINUS} ? = ${fmt(t - x)}`)}`, a: num(x), hint: `What do you take from ${fmt(t)} to get ${fmt(t - x)}? Subtract them.`, explain: `${fmt(t)} − ${fmt(t - x)} = ${fmt(x)}.` } : { q: `Find the missing number:${big(`? + ${fmt(x)} = ${fmt(t)}`)}`, a: num(t - x), hint: `Undo the addition: ${fmt(t)} − ${fmt(x)}.`, explain: `${fmt(t)} − ${fmt(x)} = ${fmt(t - x)}.` }; }
      const b = R(2, 12), a = R(2, 9), c = R(1, 20);
      return { q: `Find the missing number:${big(`(? × ${a}) + ${c} = ${a * b + c}`)}`, a: num(b), hint: `Undo the + ${c} first, then the × ${a}.`, explain: `${a * b + c} − ${c} = ${a * b}; ${a * b} ÷ ${a} = ${b}.` };
    }
    const X = '<i>x</i>';
    if (l === 1) { const a = R(2, 9), b = nz(-6, 6), x = R(-5, 8), y = R(-5, 8); return { q: `Evaluate when <i>a</i> = ${fmt(x)} and <i>b</i> = ${fmt(y)}:${big(`${a}<i>a</i>${term(b, '<i>b</i>')}`)}`, a: num(a * x + b * y), hint: `Substitute: ${a} × ${sp(x)} + ${sp(b)} × ${sp(y)}.`, explain: `${a * x} + ${sp(b * y)} = ${fmt(a * x + b * y)}.` }; }
    const ex = (k, c) => `${term(k, X, true)}${constTerm(c)}`;
    if (l === 2) {
      const p = R(2, 9), r = nz(-6, 6), q = R(1, 12), s = R(1, 12);
      if (p + r === 0) return G.b_expr(l, g);
      return { q: `Simplify:${big(`${p}${X} + ${q}${term(r, X)} ${MINUS} ${s}`)}`, a: choice(ex(p + r, q - s), [ex(p + r, q + s), ex(p - r, q - s), ex(p + r + q - s, 0), ex(p * r, q - s)]), hint: `Combine the x terms (${p} and ${fmt(r)}) and the plain numbers (${q} and −${s}) separately.`, explain: `${p} + ${sp(r)} = ${fmt(p + r)} and ${q} − ${s} = ${fmt(q - s)}: ${ex(p + r, q - s)}.` };
    }
    const a = nz(-6, 7), b = R(2, 7), c = nz(-9, 9);
    if (Math.abs(a) === 1) return G.b_expr(l, g);
    return { q: `Expand:${big(`${fmt(a)}(${b}${X}${constTerm(c)})`)}`, a: choice(ex(a * b, a * c), [ex(a * b, c), ex(a + b, a * c), ex(b, a * c), ex(a * b, -a * c)]), hint: `Multiply ${fmt(a)} by BOTH terms inside the parentheses.`, explain: `${fmt(a)} × ${b}x = ${fmt(a * b)}x and ${fmt(a)} × ${sp(c)} = ${fmt(a * c)}.` };
  };

  // --- Dino Valley: speed & number sense ---
  G.b_facts = (l, g) => {
    if (g <= 5) {
      if (l === 3 && Math.random() < 0.5) { const a = R(2, 12), b = R(2, 12); return { q: `Quick!${big(`${a * b} ÷ ${a}`)}`, a: num(b), hint: `${a} × ? = ${a * b}`, explain: `${a} × ${b} = ${a * b}.` }; }
      const top = lv(l, 9, 12, 15), a = R(2, top), b = R(2, l === 3 ? 9 : top);
      return { q: `Quick!${big(`${a} × ${b}`)}`, a: num(a * b), hint: `Break it up: ${a} × ${b} = ${a} × ${b - 1} + ${a}.`, explain: `${a} × ${b} = ${a * b}.` };
    }
    if (l === 1) { const a = R(3, 12), b = R(3, 12); return { q: `Quick!${big(`${a} × ${b}`)}`, a: num(a * b), hint: `Use a fact you know nearby.`, explain: `${a * b}.` }; }
    if (l === 2) { if (Math.random() < 0.5) { const n = R(11, 20); return { q: `Quick!${big(`${n}<sup>2</sup>`)}`, a: num(n * n), hint: `${n}² = ${n} × ${n}.`, explain: `${n} × ${n} = ${n * n}.` }; } const a = nz(-12, 12), b = nz(-12, 12); return { q: `Quick!${big(`${sp(a)} × ${sp(b)}`)}`, a: num(a * b), hint: `Same signs → positive; different → negative.`, explain: `${fmt(a * b)}.` }; }
    const f = R(1, 3);
    if (f === 1) { const a = nz(-12, 12), b = nz(-9, 9); return { q: `Quick!${big(`${sp(a * b)} ÷ ${sp(b)}`)}`, a: num(a), hint: `Signs: same → +, different → −.`, explain: `${fmt(a)}.` }; }
    if (f === 2) { const n = R(2, 6); return { q: `Quick!${big(`${n}<sup>3</sup>`)}`, a: num(n ** 3), hint: `${n} × ${n} × ${n}.`, explain: `${n ** 3}.` }; }
    const p = pick([10, 20, 25, 50]), n = (100 / gcd(p, 100)) * R(2, 20);
    return { q: `Quick!${big(`${p}% of ${n}`)}`, a: num((p * n) / 100), hint: `${p}% = ${fracHTML(p, 100)}.`, explain: `${(p * n) / 100}.` };
  };

  const BENCH = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10], [1, 20], [1, 8], [3, 8]];
  G.b_equiv = (l, g) => {
    if (g <= 5) {
      if (l === 1) { const n = R(1, 9); return { q: `Match the fossil! Write as a decimal:${big(fr(n, 10))}`, a: num(n / 10), hint: `Tenths: one digit after the point.`, explain: `${d1(n / 10)}.` }; }
      if (l === 2) { const n = R(1, 99); return Math.random() < 0.5 ? { q: `Write as a decimal:${big(fr(n, 100))}`, a: num(n / 100), hint: `Hundredths: two digits after the point.`, explain: `${d2(n / 100)}.` } : { q: `Fill in the missing numerator:${big(`${d2(n / 100)} = ${fr('?', 100)}`)}`, a: num(n), hint: `The digits after the point tell you how many hundredths.`, explain: `${d2(n / 100)} = ${fr(n, 100)}.` }; }
      const [n, d] = pick(BENCH.filter((x) => x[1] <= 5 || x[1] === 10));
      return { q: `Write as a decimal:${big(fr(n, d))}`, a: num(n / d), hint: `Make an equivalent fraction with denominator 10 or 100.`, explain: `${fr(n, d)} = ${fr((n * 100) / d, 100)} = ${fmt(n / d)}.` };
    }
    if (l === 1) { const [n, d] = pick(BENCH.filter((x) => x[1] !== 8)); return { q: `Write as a percent:${big(fr(n, d))}`, a: num((100 * n) / d), hint: `Percent means "out of 100". Make the denominator 100.`, explain: `${fr(n, d)} = ${fr((100 * n) / d, 100)} = ${(100 * n) / d}%.` }; }
    if (l === 2) { const v = pick([R(1, 99), R(101, 250), R(1, 9)]); return { q: `Write as a percent:${big(fmt(v / 100))}`, a: num(v), hint: `Multiply by 100 (move the decimal point 2 places right).`, explain: `${fmt(v / 100)} × 100 = ${v}%.` }; }
    if (Math.random() < 0.5) { let p; do { p = 5 * R(1, 19); } while (p === 50); return { q: `Write as a fraction in <b>simplest form</b>:${big(p + '%')}`, a: frac(p, 100, true), hint: `${p}% = ${fr(p, 100)}. Now simplify.`, explain: `${fr(p, 100)} = ${fracHTML(p, 100)}.` }; }
    const n = pick([1, 3, 5, 7]); return { q: `Write as a decimal:${big(fr(n, 8))}`, a: num(n / 8), hint: `${fr(1, 8)} = 0.125. Multiply by ${n}.`, explain: `${n} × 0.125 = ${fmt(n / 8)}.` };
  };

  const roundLead = (n) => { const p = 10 ** (String(Math.round(Math.abs(n))).length - 1); return Math.round(n / p) * p; };
  // Distractors are a whole place value off (or double), so only one choice is ever close to the real answer.
  const estChoice = (est) => choice(fmt(est), [fmt(est * 10), fmt(est / 10), fmt(est * 2), fmt(est * 100)]);
  G.b_estimate = (l, g) => {
    if (l === 1) { const a = R(110, 989), b = R(110, 989), est = Math.round(a / 100) * 100 + Math.round(b / 100) * 100; return { q: `T-Rex needs a fast estimate! <b>Round each number to the nearest hundred</b>, then add:${big(`${a} + ${b}`)}`, a: estChoice(est), hint: `Round each number to the nearest hundred, then add.`, explain: `${Math.round(a / 100) * 100} + ${Math.round(b / 100) * 100} = ${fmt(est)}.` }; }
    if (l === 2 || g <= 5) {
      const a = l === 2 ? R(12, 98) : R(110, 989), b = l === 2 ? R(3, 9) : R(12, 98);
      const ra = roundLead(a), rb = roundLead(b), est = ra * rb;
      return { q: `Estimate! <b>Round each number to its greatest place</b> (like 87 → 90, 412 → 400), then multiply:${big(`${a} × ${b}`)}`, a: estChoice(est), hint: `Round to ${fmt(ra)} × ${fmt(rb)}.`, explain: `${fmt(ra)} × ${fmt(rb)} = ${fmt(est)}.` };
    }
    if (Math.random() < 0.5) { const a = R(21, 99) / 10, b = R(110, 990) / 10, est = Math.round(a) * roundLead(b); return { q: `Estimate! <b>Round ${a} to the nearest whole number</b> and <b>${b} to its greatest place</b>, then multiply:${big(`${a} × ${b}`)}`, a: estChoice(est), hint: `Round to ${Math.round(a)} × ${fmt(roundLead(b))}.`, explain: `${Math.round(a)} × ${fmt(roundLead(b))} = ${fmt(est)}.` }; }
    const bp = pick([10, 20, 25, 50, 75]), p = bp + pick([-2, -1, 1, 2]), base = (100 / gcd(bp, 100)) * R(2, 15), n = base + pick([-1, 1, 2]), est = (bp * base) / 100;
    return { q: `Estimate using friendly numbers (${p}% is close to ${bp}%):${big(`${p}% of ${n}`)}`, a: estChoice(est), hint: `${p}% is close to ${bp}%, and ${n} is close to ${base}.`, explain: `${bp}% of ${base} = ${fmt(est)}.` };
  };

  // ======================= MORE TOPICS PER GRADE =======================
  const divisors = (n) => { const d = []; for (let i = 1; i <= n; i++) if (n % i === 0) d.push(i); return d; };
  const isPrime = (n) => n > 1 && divisors(n).length === 2;
  const trimDec = (units, places) => decStr(units, places).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  const pt = (x, y) => `(${fmt(x)}, ${fmt(y)})`;

  // ---- Grade 4: factors, multiples & primes (4.OA.4)
  G.g4_factor = (l) => {
    if (l === 1) {
      if (Math.random() < 0.5) {
        const N = R(2, 9) * R(3, 12), divs = divisors(N).filter((x) => x > 1 && x < N && x <= 12);
        const f = pick(divs.length ? divs : [N]), non = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((x) => N % x !== 0));
        if (non.length < 3) return G.g4_factor(l);
        return { q: `Which number is a <b>factor</b> of <b>${N}</b>?`, a: choice(String(f), non.slice(0, 3).map(String)), hint: `A factor divides ${N} evenly, with no remainder.`, explain: `${N} ÷ ${f} = ${N / f}, with no remainder.` };
      }
      const k = R(3, 9), m = k * R(3, 12), wrong = shuffle([m + 1, m - 1, m + Math.ceil(k / 2), m + k + 1, m - k + 1].filter((x) => x % k !== 0 && x > 0));
      return { q: `Which number is a <b>multiple</b> of <b>${k}</b>?`, a: choice(String(m), wrong.slice(0, 3).map(String)), hint: `Multiples of ${k} are what you get when you count by ${k}s.`, explain: `${k} × ${m / k} = ${m}.` };
    }
    if (l === 2) {
      const prime = Math.random() < 0.5;
      let N; do { N = R(11, 99); } while (isPrime(N) !== prime || (!prime && N % 2 === 0 && Math.random() < 0.6));
      const d = divisors(N);
      return { q: `Is <b>${N}</b> prime or composite?`, a: choiceFixed(['Prime', 'Composite'], prime ? 'Prime' : 'Composite'), hint: `Prime numbers have exactly 2 factors: 1 and themselves. Try dividing ${N} by 2, 3, 5 and 7.`, explain: prime ? `${N} has only two factors (1 and ${N}), so it's prime.` : `${N} = ${d[1]} × ${N / d[1]}, so it has more than two factors. It's composite.` };
    }
    const N = pick([12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48, 50, 54, 56, 60, 64, 72, 80, 84, 90, 96, 100]), d = divisors(N);
    const pairs = d.filter((x) => x * x <= N).map((x) => `${x}×${N / x}`).join(', ');
    return { q: `How many <b>factors</b> does <b>${N}</b> have?`, a: num(d.length), hint: `List factor pairs: 1 × ${N}, 2 × ?, … Count every number you used (count a square pair like 6 × 6 once).`, explain: `Factor pairs: ${pairs}. The factors are ${d.join(', ')}, so there are ${d.length}.` };
  };

  // ---- Grade 4: multiply a fraction by a whole number (4.NF.4)
  G.g4_fracmul = (l) => {
    const d = R(2, 10);
    if (l === 1) { const w = R(2, 9); return { q: `Multiply:${big(`${w} × ${fr(1, d)}`)}`, a: frac(w, d), hint: `${w} groups of ${fr(1, d)} = ${w} copies of ${fr(1, d)} added together.`, explain: `${w} × ${fr(1, d)} = ${fr(w, d)} = ${fracHTML(w, d)}.` }; }
    if (l === 2) { const w = R(2, 9), n = R(2, Math.max(2, d - 1)); return { q: `Multiply:${big(`${w} × ${fr(n, d)}`)}`, a: frac(w * n, d), hint: `Multiply the whole number by the numerator: ${w} × ${n}. Keep the denominator ${d}.`, explain: `${w} × ${fr(n, d)} = ${fr(w * n, d)} = ${fracHTML(w * n, d)}.` }; }
    const n = R(1, Math.max(1, d - 1)), w = R(3, 12);
    return { q: `Each clownfish eats ${fr(n, d)} of a pound of sea-snacks. How many pounds do <b>${w}</b> clownfish eat? (Fractions and mixed numbers are both OK.)`, a: frac(w * n, d), hint: `${w} × ${fr(n, d)} means ${w} × ${n} pieces of size ${fr(1, d)}.`, explain: `${w} × ${fr(n, d)} = ${fr(w * n, d)} = ${fracHTML(w * n, d)} pounds.` };
  };

  // ---- Grade 5: multi-digit multiplication & long division (5.NBT.5–6)
  G.g5_longdiv = (l) => {
    if (l === 1) { const a = R(102, 999), b = R(12, 99); return { q: `Multiply:${big(`${fmt(a)} × ${b}`)}`, a: num(a * b), hint: `Multiply ${fmt(a)} × ${b % 10}, then ${fmt(a)} × ${b - (b % 10)}, and add.`, explain: `${fmt(a)} × ${b % 10} = ${fmt(a * (b % 10))}; ${fmt(a)} × ${b - (b % 10)} = ${fmt(a * (b - (b % 10)))}; total ${fmt(a * b)}.` }; }
    if (l === 2) { const d = R(11, 49), q = R(12, 99), n = d * q; return { q: `Divide:${big(`${fmt(n)} ÷ ${d}`)}`, a: num(q), hint: `Estimate: about how many ${d}s are in ${fmt(n)}? Try ${d} × ${Math.round(q / 10) * 10 || 10}.`, explain: `${d} × ${q} = ${fmt(n)}, so ${fmt(n)} ÷ ${d} = ${q}.` }; }
    const d = R(12, 60), q = R(100, 250), r = R(1, d - 1), n = d * q + r;
    return { q: `Divide. Choose the quotient and remainder:${big(`${fmt(n)} ÷ ${d}`)}`, a: choice(`${q} R ${r}`, [`${q + 1} R ${r}`, `${q - 1} R ${r}`, `${q} R ${r + 1 < d ? r + 1 : r - 1}`, `${q * 10} R ${r}`]), hint: `The remainder must be less than ${d}. Check: ${d} × your quotient + remainder = ${fmt(n)}.`, explain: `${d} × ${q} = ${fmt(d * q)}, and ${fmt(n)} − ${fmt(d * q)} = ${r}. So ${q} R ${r}.` };
  };

  // ---- Grade 5: decimal place value, powers of 10, rounding decimals (5.NBT.1–4)
  G.g5_place = (l) => {
    if (l === 1) {
      if (Math.random() < 0.5) { const e = R(2, 6); return { q: `Evaluate:${big(pw(10, e))}`, a: num(10 ** e), hint: `${pw(10, e)} is 1 followed by ${e} zeros.`, explain: `${pw(10, e)} = ${fmt(10 ** e)}.` }; }
      const A = R(11, 999), pl = R(1, 2), e = R(1, 3), as = decStr(A, pl);
      return { q: `Multiply:${big(`${as} × ${pw(10, e)}`)}`, a: num(rnd((A / 10 ** pl) * 10 ** e)), hint: `× ${pw(10, e)} moves the decimal point ${e} place${e > 1 ? 's' : ''} right.`, explain: `${as} × ${fmt(10 ** e)} = ${fmt(rnd((A / 10 ** pl) * 10 ** e))}.` };
    }
    if (l === 2) {
      let A, B; do { A = R(1, 999); B = R(1, 999); } while (A === B);
      const av = A / 10 ** 3, bv = B / 10 ** 3;
      const as = trimDec(A, 3) || '0', bs = trimDec(B, 3) || '0';
      if (as === bs) return G.g5_place(l);
      const s = av > bv ? '&gt;' : '&lt;';
      return { q: `Which symbol makes this true?${big(`${as} &nbsp;?&nbsp; ${bs}`)}`, a: choiceFixed(['&lt;', '&gt;', '='], s), hint: `Write both with three decimal places (add zeros), then compare digit by digit.`, explain: `${decStr(A, 3)} vs ${decStr(B, 3)}, so ${as} ${s} ${bs}.` };
    }
    if (Math.random() < 0.5) {
      const U = R(1001, 99999), p = pick([1, 2]), ans = Math.round(U / 10 ** (3 - p)) / 10 ** p;
      return { q: `🎯 <b>Rounding:</b> round to the nearest <b>${p === 1 ? 'tenth' : 'hundredth'}</b>.${big(decStr(U, 3))}`, a: num(ans), hint: `Look at the digit just to the right of the ${p === 1 ? 'tenths' : 'hundredths'} place. 5 or more rounds up.`, explain: `${decStr(U, 3)} rounds to ${ans.toFixed(p)}.` };
    }
    let U; do { U = R(1001, 99999); } while (U % 10 === 0);
    return { q: `📍 <b>Place value:</b> what is the <b>thousandths</b> digit worth in <b>${decStr(U, 3)}</b>? (Write it as a decimal.)`, a: num((U % 10) / 1000), hint: `The thousandths place is the 3rd digit after the decimal point.`, explain: `The thousandths digit is ${U % 10}, so it is worth ${((U % 10) / 1000).toFixed(3)}.` };
  };

  // ---- Grade 5: coordinate plane & numerical patterns (5.G.1–2, 5.OA.3)
  G.g5_coord = (l) => {
    if (l === 1) {
      const x = R(0, 8), y = R(0, 8), a = R(1, 6), b = R(1, 6), c = pt(x + a, y + b);
      return { q: `A unicorn starts at <b>${pt(x, y)}</b>. She trots <b>${a} right</b> and <b>${b} up</b>. Where is she now?`, a: choice(c, [pt(y + b, x + a), pt(x + b, y + a), pt(x - a < 0 ? x + a + 1 : x - a, y + b), pt(x + a, y)]), hint: `Right changes the first number (x). Up changes the second number (y).`, explain: `x: ${x} + ${a} = ${x + a}; y: ${y} + ${b} = ${y + b}. So ${c}.` };
    }
    if (l === 2) {
      const x1 = R(1, 6), x2 = x1 + R(2, 6), y1 = R(1, 6), y2 = y1 + R(2, 6), ar = Math.random() < 0.5;
      return { q: `A rectangle has corners at <b>${pt(x1, y1)}</b>, <b>${pt(x2, y1)}</b>, <b>${pt(x2, y2)}</b> and <b>${pt(x1, y2)}</b>. What is its <b>${ar ? 'area' : 'perimeter'}</b>?`, a: num(ar ? (x2 - x1) * (y2 - y1) : 2 * (x2 - x1 + y2 - y1)), hint: `Width = ${x2} − ${x1}. Height = ${y2} − ${y1}.`, explain: `Width ${x2 - x1}, height ${y2 - y1}: ${ar ? `area = ${(x2 - x1) * (y2 - y1)}` : `perimeter = ${2 * (x2 - x1 + y2 - y1)}`}.` };
    }
    const a = R(2, 6), k = R(2, 4), b = a * k, n = R(3, 8);
    return { q: `Two unicorn patterns both start at 0. Pattern A adds <b>${a}</b> each step. Pattern B adds <b>${b}</b> each step. When Pattern A reaches <b>${a * n}</b>, what is Pattern B at?`, a: num(b * n), hint: `Pattern B grows ${k} times as fast as Pattern A.`, explain: `A reaches ${a * n} after ${n} steps. B after ${n} steps: ${b} × ${n} = ${b * n}.` };
  };

  // ---- Grade 6: expressions & inequalities (6.EE.2–4, 6.EE.8)
  const X = '<i>x</i>', N = '<i>n</i>';
  G.g6_expr = (l) => {
    if (l === 1) {
      const a = R(2, 9), b = R(2, 12);
      const T = pick([
        [`${b} less than ${a} times a number <i>n</i>`, `${a}${N} ${MINUS} ${b}`, [`${b} ${MINUS} ${a}${N}`, `${a}(${N} ${MINUS} ${b})`, `${a} + ${N} ${MINUS} ${b}`]],
        [`${b} more than a number <i>n</i>, divided by ${a}`, `(${N} + ${b}) ÷ ${a}`, [`${N} + ${b} ÷ ${a}`, `${a} ÷ (${N} + ${b})`, `${a}(${N} + ${b})`]],
        [`${a} times the sum of a number <i>n</i> and ${b}`, `${a}(${N} + ${b})`, [`${a}${N} + ${b}`, `${a} + ${N} + ${b}`, `${N}(${a} + ${b})`]],
        [`the product of ${a} and a number <i>n</i>, plus ${b}`, `${a}${N} + ${b}`, [`${a}(${N} + ${b})`, `${a} + ${b}${N}`, `${b}${N} + ${a}`]],
      ]);
      return { q: `Which expression means: <b>"${T[0]}"</b>?`, a: choice(T[1], T[2]), hint: `Read carefully. "Less than" flips the order, and "the sum of" means the adding happens first (parentheses).`, explain: `"${T[0]}" is written ${T[1]}.` };
    }
    if (l === 2) {
      const a = R(2, 9), b = R(2, 12), c = R(2, 9);
      if (Math.random() < 0.5) return { q: `Which expression is <b>equivalent</b> to <b>${a}(${X} + ${b})</b>?`, a: choice(`${a * 1}${X} + ${a * b}`, [`${a}${X} + ${b}`, `${a + b}${X}`, `${X} + ${a * b}`]), hint: `Distribute: multiply ${a} by BOTH ${X} and ${b}.`, explain: `${a} × x + ${a} × ${b} = ${a}x + ${a * b}.` };
      return { q: `Which expression is <b>equivalent</b> to <b>${a}${X} + ${b} + ${c}${X}</b>?`, a: choice(`${a + c}${X} + ${b}`, [`${a + b + c}${X}`, `${a * c}${X} + ${b}`, `${a + c}${X} + ${b}${X}`]), hint: `Combine like terms: the x terms go together.`, explain: `${a}x + ${c}x = ${a + c}x, so ${a + c}x + ${b}.` };
    }
    if (Math.random() < 0.5) {
      const T = pick([['at least', '≥'], ['more than', '&gt;'], ['at most', '≤'], ['fewer than', '&lt;']]), k = R(5, 40);
      return { q: `<b>${T[0][0].toUpperCase() + T[0].slice(1)} ${k}</b> guests are coming to the royal ball. Which inequality shows the number of guests <i>g</i>?`, a: choiceFixed([`<i>g</i> &gt; ${k}`, `<i>g</i> ≥ ${k}`, `<i>g</i> &lt; ${k}`, `<i>g</i> ≤ ${k}`], `<i>g</i> ${T[1]} ${k}`), hint: `"At least" includes the number itself (≥). "More than" does not (>).`, explain: `"${T[0]} ${k}" is g ${T[1].replace('&gt;', '>').replace('&lt;', '<')} ${k}.` };
    }
    const b = R(2, 20), c = b + R(3, 25), gt = Math.random() < 0.5, t = c - b;
    const good = gt ? t + R(1, 6) : t - R(1, Math.min(6, t));
    const bad = gt ? [t, t - 1, t - R(2, 6)] : [t, t + 1, t + R(2, 6)];
    return { q: `Which value of ${X} makes this inequality <b>true</b>?${big(`${X} + ${b} ${gt ? '&gt;' : '&lt;'} ${c}`)}`, a: choice(String(good), bad.map(String)), hint: `Try each choice: add ${b} and compare with ${c}. ${gt ? 'It must be MORE than' : 'It must be LESS than'} ${c} (not equal).`, explain: `${good} + ${b} = ${good + b}, which is ${gt ? 'greater' : 'less'} than ${c}.` };
  };

  // ---- Grade 6: multi-digit decimal operations & long division (6.NS.2–3)
  G.g6_dec = (l) => {
    if (l === 1) {
      const A = R(1001, 99999), B = R(101, 9999), pa = R(1, 3), pb = R(1, 3);
      let a = A * 10 ** (3 - pa), b = B * 10 ** (3 - pb), as = decStr(A, pa), bs = decStr(B, pb);
      if (Math.random() < 0.5) { if (a < b) { [a, b] = [b, a]; [as, bs] = [bs, as]; } return { q: `Subtract:${big(`${as} ${MINUS} ${bs}`)}`, a: num((a - b) / 1000), hint: `Line up the decimal points and fill empty places with zeros.`, explain: `${as} − ${bs} = ${fmt((a - b) / 1000)}.` }; }
      return { q: `Add:${big(`${as} + ${bs}`)}`, a: num((a + b) / 1000), hint: `Line up the decimal points and fill empty places with zeros.`, explain: `${as} + ${bs} = ${fmt((a + b) / 1000)}.` };
    }
    if (l === 2) {
      if (Math.random() < 0.5) { const d = R(12, 89), q = R(102, 999), n = d * q; return { q: `Divide:${big(`${fmt(n)} ÷ ${d}`)}`, a: num(q), hint: `Long division: how many ${d}s fit into the first digits of ${fmt(n)}?`, explain: `${d} × ${q} = ${fmt(n)}.` }; }
      const A = R(12, 999), pa = R(1, 2), B = R(2, 99), pb = R(1, 2);
      return { q: `Multiply:${big(`${decStr(A, pa)} × ${decStr(B, pb)}`)}`, a: num((A * B) / 10 ** (pa + pb)), hint: `Multiply ${A} × ${B} as whole numbers, then count ${pa + pb} decimal places.`, explain: `${A} × ${B} = ${fmt(A * B)}. With ${pa + pb} decimal places: ${fmt((A * B) / 10 ** (pa + pb))}.` };
    }
    const B = R(2, 99), pb = R(1, 2), Q = R(11, 999), units = B * Q, places = pb + 1;
    const dividend = trimDec(units, places), divisor = decStr(B, pb);
    return { q: `Divide:${big(`${dividend} ÷ ${divisor}`)}`, a: num(Q / 10), hint: `Move the decimal point ${pb} place${pb > 1 ? 's' : ''} right in BOTH numbers so you divide by a whole number (${B}).`, explain: `${dividend} ÷ ${divisor} = ${trimDec(units, places - pb)} ÷ ${B} = ${fmt(Q / 10)}.` };
  };

  // ---- Grade 7: rational numbers (7.NS.1–2)
  G.g7_rat = (l) => {
    if (l === 1) {
      let b, d; do { b = R(2, 8); d = R(2, 8); } while (lcm(b, d) > 24);
      const a = nz(-7, 7), c = nz(-7, 7), sub = Math.random() < 0.5;
      const res = sub ? a * d - c * b : a * d + c * b;
      return { q: `${sub ? 'Subtract' : 'Add'}:${big(`${fr(a, b)} ${sub ? MINUS : '+'} ${c < 0 ? `(${fr(c, d)})` : fr(c, d)}`)}`, a: frac(res, b * d), hint: `Use a common denominator (${lcm(b, d)}). Watch the signs!${sub ? ' Subtracting a negative is adding.' : ''}`, explain: `= ${fracHTML(res, b * d)}.` };
    }
    if (l === 2) {
      if (Math.random() < 0.5) {
        const A = nz(-50, 50), B = nz(-50, 50);
        if (A % 10 === 0 || B % 10 === 0) return G.g7_rat(l);
        return { q: `Multiply:${big(`${sp(A / 10)} × ${sp(B / 10)}`)}`, a: num((A * B) / 100), hint: `Multiply ${Math.abs(A)} × ${Math.abs(B)}, place 2 decimal places, then decide the sign.`, explain: `${Math.abs(A * B)} → ${fmt(Math.abs(A * B) / 100)}, sign ${A * B > 0 ? '+' : '−'}: ${fmt((A * B) / 100)}.` };
      }
      const a = nz(-8, 8), b = R(2, 9), c = nz(-8, 8), d = R(2, 9);
      return { q: `Divide:${big(`${a < 0 ? `(${fr(a, b)})` : fr(a, b)} ÷ ${c < 0 ? `(${fr(c, d)})` : fr(c, d)}`)}`, a: frac(a * d, b * c), hint: `Keep, change, flip. Then: same signs → +, different signs → −.`, explain: `${fr(a, b)} × ${fr(d, c)} = ${fracHTML(a * d, b * c)}.` };
    }
    if (Math.random() < 0.5) {
      const rep = pick([[1, 3], [2, 3], [1, 6], [5, 6], [1, 9], [4, 9], [2, 7], [5, 11], [7, 12], [1, 12]]);
      const term = shuffle([[1, 8], [3, 5], [7, 20], [3, 4], [9, 25], [5, 16], [1, 40], [7, 10]]).slice(0, 3);
      return { q: `Which fraction makes a <b>repeating</b> decimal (one that goes on forever in a pattern)?`, a: choice(fr(...rep), term.map((t) => fr(...t))), hint: `In simplest form, if the denominator has only 2s and 5s as prime factors, the decimal stops. Otherwise it repeats.`, explain: `${fr(...rep)}'s denominator ${rep[1]} has a prime factor other than 2 or 5, so it repeats.` };
    }
    const a = nz(-40, 40) / 4, b = nz(-40, 40) / 4, c = nz(-40, 40) / 4, v = a + b - c;
    return { q: `Evaluate:${big(`${fmt(a)} + ${sp(b)} ${MINUS} ${sp(c)}`)}`, a: num(v), hint: `Subtracting a negative is the same as adding a positive.`, explain: `${fmt(a)} + ${sp(b)} = ${fmt(a + b)}; ${fmt(a + b)} − ${sp(c)} = ${fmt(v)}.` };
  };

  // ---- Grade 7: solving inequalities (7.EE.4b)
  const FLIP = { '&gt;': '&lt;', '&lt;': '&gt;', '≥': '≤', '≤': '≥' };
  G.g7_ineq = (l) => {
    const op = pick(['&gt;', '&lt;', '≥', '≤']), t = R(-9, 12);
    let a, b;
    if (l === 1) { a = 1; b = nz(-15, 15); }
    else if (l === 2) { a = R(2, 9); b = nz(-15, 15); }
    else { a = -R(2, 9); b = nz(-15, 15); }
    const c = a * t + b, res = a < 0 ? FLIP[op] : op;
    const lhs = `${term(a, X, true)}${constTerm(b)}`;
    const ans = (o, v) => `${X} ${o} ${fmt(v)}`;
    return { q: `Solve the inequality:${big(`${lhs} ${op} ${fmt(c)}`)}`, a: choice(ans(res, t), [ans(FLIP[res], t), ans(res, -t === t ? t + 1 : -t), ans(res, c - b), ans(op === res ? FLIP[op] : op, t)]), hint: a < 0 ? `When you divide both sides by a NEGATIVE number, flip the inequality sign!` : `Solve it like an equation: undo the ${b > 0 ? '+' : '−'} ${Math.abs(b)}${a > 1 ? `, then divide by ${a}` : ''}.`, explain: `${term(a, 'x', true)} ${op} ${fmt(c - b)} → x ${res} ${fmt(t)}${a < 0 ? ' (flipped because we divided by a negative)' : ''}.` };
  };

  // ---- Grade 7: scale drawings & prisms (7.G.1, 7.G.6)
  G.g7_scale = (l) => {
    if (l === 1) { const s = pick([2, 3, 4, 5, 10]), d = R(2, 12) + pick([0, 0.5]); return { q: `On the dojo blueprint, <b>1 inch = ${s} feet</b>. The sparring mat is <b>${d} inches</b> long on the drawing. How long is the real mat, in feet?`, a: num(d * s), hint: `Each inch stands for ${s} feet. Multiply.`, explain: `${d} × ${s} = ${fmt(d * s)} feet.` }; }
    if (l === 2) {
      if (Math.random() < 0.5) { const s = pick([2, 4, 5, 10]), real = s * R(3, 20); return { q: `On a scale drawing, <b>1 cm = ${s} m</b>. The real dojo is <b>${real} m</b> long. How long is it on the drawing, in cm?`, a: num(real / s), hint: `How many groups of ${s} m are in ${real} m?`, explain: `${real} ÷ ${s} = ${real / s} cm.` }; }
      const k = R(2, 5), L = R(2, 8), W = R(2, 8);
      return { q: `A ${L} cm by ${W} cm photo of a karate belt is enlarged with a scale factor of <b>${k}</b>. What is the <b>area</b> of the new photo, in square cm?`, a: num(L * k * W * k), hint: `Multiply BOTH sides by ${k} first, then find the area.`, explain: `${L * k} × ${W * k} = ${L * k * W * k} sq cm (that's ${k * k} times bigger!).` };
    }
    const b = 2 * R(2, 8), h = R(2, 10), len = R(3, 15);
    if (Math.random() < 0.5) return { q: `A triangular prism-shaped tent has a triangle base of <b>${b} ft</b>, triangle height <b>${h} ft</b>, and is <b>${len} ft</b> long. What is its volume?`, a: num((b * h * len) / 2), hint: `Volume = (area of the triangle) × length = (${fr(1, 2)} × ${b} × ${h}) × ${len}.`, explain: `${fr(1, 2)} × ${b} × ${h} = ${(b * h) / 2}; × ${len} = ${(b * h * len) / 2} cubic ft.` };
    const L = R(2, 12), W = R(2, 10), H = R(2, 10);
    return { q: `A box of karate gear is <b>${L} in</b> long, <b>${W} in</b> wide and <b>${H} in</b> tall. What is its <b>volume</b>?`, a: num(L * W * H), hint: `V = length × width × height.`, explain: `${L} × ${W} × ${H} = ${L * W * H} cubic in.` };
  };

  // ---- Grade 8: systems of equations (8.EE.8)
  G.g8_sys = (l) => {
    const x0 = R(-6, 6), y0 = R(-6, 9);
    if (l < 3) {
      let m1, m2; do { m1 = nz(-4, 4); m2 = nz(-4, 4); } while (m1 === m2);
      const b1 = y0 - m1 * x0, b2 = y0 - m2 * x0, eq = (m, b) => `<i>y</i> = ${term(m, X, true)}${constTerm(b)}`;
      if (l === 1) return { q: `Which point is a solution to <b>both</b> equations?<br>${eq(m1, b1)}<br>${eq(m2, b2)}`, a: choice(pt(x0, y0), [pt(y0, x0), pt(x0 + 1, y0 + m1), pt(x0 - 1, y0 - m2), pt(-x0, y0)]), hint: `Plug each point in. The answer must work in BOTH equations.`, explain: `At x = ${fmt(x0)}: ${fmt(m1)}(${fmt(x0)})${constTerm(b1)} = ${fmt(y0)} and ${fmt(m2)}(${fmt(x0)})${constTerm(b2)} = ${fmt(y0)}. ✔` };
      return { q: `Solve the system. What is <i>x</i>?<br>${eq(m1, b1)}<br>${eq(m2, b2)}`, a: num(x0), hint: `Set them equal: ${term(m1, 'x', true)}${constTerm(b1)} = ${term(m2, 'x', true)}${constTerm(b2)}.`, explain: `${term(m1 - m2, 'x', true)} = ${fmt(b2 - b1)}, so x = ${fmt(x0)} (and y = ${fmt(y0)}).` };
    }
    let a1, b1, a2, b2; do { a1 = R(1, 5); b1 = nz(-4, 4); a2 = R(1, 5); b2 = nz(-4, 4); } while (a1 * b2 - a2 * b1 === 0);
    const c1 = a1 * x0 + b1 * y0, c2 = a2 * x0 + b2 * y0, askY = Math.random() < 0.5;
    const eq = (a, b, c) => `${term(a, X, true)}${term(b, '<i>y</i>')} = ${fmt(c)}`;
    return { q: `Solve the system. What is <b>${askY ? 'y' : 'x'}</b>?<br>${eq(a1, b1, c1)}<br>${eq(a2, b2, c2)}`, a: num(askY ? y0 : x0), hint: `Use elimination: multiply one or both equations so a variable cancels when you add or subtract them.`, explain: `The solution is x = ${fmt(x0)}, y = ${fmt(y0)}. Check: ${a1}(${fmt(x0)}) + ${sp(b1)}(${fmt(y0)}) = ${fmt(c1)} ✔` };
  };

  // ---- Grade 8: volume of cylinders, cones & spheres (8.G.9)
  G.g8_vol = (l) => {
    const note = ' Use π ≈ 3.14.';
    if (l === 1) { const r = R(1, 9), h = R(2, 15); return { q: `A cylinder-shaped star jar has radius <b>${r} cm</b> and height <b>${h} cm</b>. What is its volume?${note}`, a: num((314 * r * r * h) / 100, 0.011), hint: `V = π × r² × h.`, explain: `3.14 × ${r * r} × ${h} = ${fmt((314 * r * r * h) / 100)} cubic cm.` }; }
    if (l === 2) { const r = R(1, 9), h = 3 * R(1, 6); return { q: `A cone-shaped comet has radius <b>${r} m</b> and height <b>${h} m</b>. What is its volume?${note}`, a: num((314 * r * r * h) / 300, 0.011), hint: `V = ${fr(1, 3)} × π × r² × h. (A cone is ${fr(1, 3)} of a cylinder.)`, explain: `${fr(1, 3)} × 3.14 × ${r * r} × ${h} = ${fmt((314 * r * r * h) / 300)} cubic m.` }; }
    const r = pick([3, 6, 9]);
    return { q: `A sphere-shaped planet model has radius <b>${r} in</b>. What is its volume?${note}`, a: num((4 * 314 * r ** 3) / 300, 0.011), hint: `V = ${fr(4, 3)} × π × r³. Here r³ = ${r ** 3}.`, explain: `${fr(4, 3)} × 3.14 × ${r ** 3} = ${fmt((4 * 314 * r ** 3) / 300)} cubic in.` };
  };

  // ---- Grade 8: transformations on the coordinate plane (8.G.1–4)
  G.g8_trans = (l) => {
    let x, y; do { x = nz(-8, 8); y = nz(-8, 8); } while (Math.abs(x) === Math.abs(y));
    const P = pt(x, y);
    if (l === 1) {
      const a = nz(-6, 6), b = nz(-6, 6), dir = `${Math.abs(a)} ${a > 0 ? 'right' : 'left'} and ${Math.abs(b)} ${b > 0 ? 'up' : 'down'}`;
      return { q: `Point <b>${P}</b> is <b>translated</b> ${dir}. Where does it land?`, a: choice(pt(x + a, y + b), [pt(x + b, y + a), pt(x - a, y - b), pt(x + a, y - b), pt(x - a, y + b)]), hint: `Left/right changes x. Up/down changes y.`, explain: `(${fmt(x)} ${a > 0 ? '+' : '−'} ${Math.abs(a)}, ${fmt(y)} ${b > 0 ? '+' : '−'} ${Math.abs(b)}) = ${pt(x + a, y + b)}.` };
    }
    const opts = { rx: pt(x, -y), ry: pt(-x, y), r180: pt(-x, -y), r90: pt(-y, x), r270: pt(y, -x), swap: pt(y, x) };
    if (l === 2) {
      const ax = Math.random() < 0.5 ? 'x' : 'y', c = ax === 'x' ? opts.rx : opts.ry;
      return { q: `Point <b>${P}</b> is <b>reflected</b> over the <b>${ax}-axis</b>. Where does it land?`, a: choice(c, [ax === 'x' ? opts.ry : opts.rx, opts.r180, opts.swap]), hint: `Reflecting over the ${ax}-axis flips the sign of the ${ax === 'x' ? 'y' : 'x'}-coordinate only.`, explain: `${P} → ${c}.` };
    }
    const k = pick(['r90', 'r180', 'dil']);
    if (k === 'dil') { const s = R(2, 4); return { q: `Point <b>${P}</b> is <b>dilated</b> by a scale factor of <b>${s}</b> from the origin. Where does it land?`, a: choice(pt(s * x, s * y), [pt(x + s, y + s), pt(s * x, y), opts.r180, pt(-s * x, -s * y)]), hint: `Dilation from the origin multiplies BOTH coordinates by ${s}.`, explain: `(${s} × ${fmt(x)}, ${s} × ${fmt(y)}) = ${pt(s * x, s * y)}.` }; }
    const c = opts[k];
    return { q: `Point <b>${P}</b> is <b>rotated ${k === 'r90' ? '90° counterclockwise' : '180°'}</b> around the origin. Where does it land?`, a: choice(c, [k === 'r90' ? opts.r270 : opts.r90, k === 'r90' ? opts.r180 : opts.rx, opts.swap, opts.ry]), hint: k === 'r90' ? `90° counterclockwise: (x, y) → (−y, x).` : `180°: (x, y) → (−x, −y).`, explain: `${P} → ${c}.` };
  };

  // ======================= ROUND 3: three more topics per grade =======================
  const deg = (s) => `<b>${s}°</b>`;
  const lin = (a, b, v = X) => `${term(a, v, true)}${constTerm(b)}`; // "3x + 10"

  // ---- Grade 4: multi-digit addition & subtraction (4.NBT.4)
  G.g4_addsub = (l) => {
    if (l === 1) { const a = R(1200, 8999), b = R(1200, 8999); return { q: `Add:${big(`${fmt(a)} + ${fmt(b)}`)}`, a: num(a + b), hint: `Line up the place values. Start with the ones and regroup (carry) when a column makes 10 or more.`, explain: `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.` }; }
    if (l === 2) {
      const a = R(1, 9) * 10000 + R(0, 9) * 100 + pick([0, 0, R(1, 9)]), b = R(1001, a - 101);
      return { q: `Subtract:${big(`${fmt(a)} ${MINUS} ${fmt(b)}`)}`, a: num(a - b), hint: `Regroup across zeros: borrow from the first nonzero digit to the left. Check by adding your answer to ${fmt(b)}.`, explain: `${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}. Check: ${fmt(a - b)} + ${fmt(b)} = ${fmt(a)}.` };
    }
    if (Math.random() < 0.5) { const t = pick([10000, 20000, 50000, 100000]), b = R(1001, t - 1001); return { q: `Find the missing number:${big(`? + ${fmt(b)} = ${fmt(t)}`)}`, a: num(t - b), hint: `Undo the addition: ${fmt(t)} − ${fmt(b)}.`, explain: `${fmt(t)} − ${fmt(b)} = ${fmt(t - b)}.` }; }
    const a = R(20000, 89999), b = R(10000, 49999), c = R(1000, a + b - 1000);
    return { q: `Solve from left to right:${big(`${fmt(a)} + ${fmt(b)} ${MINUS} ${fmt(c)}`)}`, a: num(a + b - c), hint: `First add ${fmt(a)} + ${fmt(b)}, then subtract ${fmt(c)}.`, explain: `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}; ${fmt(a + b)} − ${fmt(c)} = ${fmt(a + b - c)}.` };
  };

  // ---- Grade 4: adding & subtracting mixed numbers, like denominators (4.NF.3)
  G.g4_mixed = (l) => {
    const d = R(3, 12);
    let w1 = R(1, 8), w2 = R(1, 6), n1, n2, sub;
    if (l === 1) { sub = false; n1 = R(1, d - 2); n2 = R(1, d - 1 - n1); }
    else if (l === 2) { sub = Math.random() < 0.5; if (sub) { n2 = R(1, d - 2); n1 = R(n2 + 1, d - 1); w1 = w2 + R(1, 4); } else { n1 = R(2, d - 1); n2 = R(d - n1, d - 1); } }
    else { sub = true; n1 = R(1, d - 2); n2 = R(n1 + 1, d - 1); w1 = w2 + R(1, 5); }
    const A = w1 * d + n1, B = w2 * d + n2, res = sub ? A - B : A + B;
    const regroup = sub ? n1 < n2 : n1 + n2 >= d;
    return { q: `${sub ? 'Subtract' : 'Add'}. (Mixed numbers or fractions are both OK.)${big(`${mixed(w1, n1, d)} ${sub ? MINUS : '+'} ${mixed(w2, n2, d)}`)}`, a: frac(res, d),
      hint: sub ? (regroup ? `${n1} − ${n2} won't work, so trade 1 whole for ${fr(d, d)}: ${mixed(w1, n1, d)} = ${mixed(w1 - 1, n1 + d, d)}.` : `Subtract the wholes, then subtract the fractions.`) : `Add the wholes, then add the fractions.${regroup ? ` If the fraction part is ${fr(d, d)} or more, trade it for 1 whole.` : ''}`,
      explain: `${fr(A, d)} ${sub ? '−' : '+'} ${fr(B, d)} = ${fracHTML(res, d)}.` };
  };

  // ---- Grade 4: lines, symmetry & classifying shapes (4.G.1–3)
  const SYM = [['a square', 4], ['a rectangle (not a square)', 2], ['an equilateral triangle', 3], ['a regular hexagon', 6], ['a regular pentagon', 5], ['an isosceles triangle (not equilateral)', 1], ['a scalene triangle', 0], ['a rhombus (not a square)', 2], ['a parallelogram with no right angles and unequal sides', 0], ['a regular octagon', 8], ['a heart shape ♥', 1]];
  const QUADS = [['I have 4 equal sides and 4 right angles.', 'Square'], ['I have 4 right angles, but my sides are not all equal.', 'Rectangle'], ['I have 4 equal sides, but no right angles.', 'Rhombus'], ['I have exactly one pair of parallel sides.', 'Trapezoid'], ['I have 2 pairs of parallel sides, no right angles, and my sides are not all equal.', 'Parallelogram']];
  G.g4_shapes = (l) => {
    if (l === 1) { const [s, n] = pick(SYM); return { q: `How many <b>lines of symmetry</b> does ${s} have?`, a: num(n), hint: `A line of symmetry folds the shape into two matching halves. Imagine folding it every way you can.`, explain: `${s[0].toUpperCase() + s.slice(1)} has ${n} line${n === 1 ? '' : 's'} of symmetry.` }; }
    if (l === 2) {
      if (Math.random() < 0.5) {
        const k = pick(['Acute', 'Right', 'Obtuse']);
        let A, B; if (k === 'Right') { A = 90; B = R(20, 70); } else if (k === 'Obtuse') { A = R(95, 150); B = R(10, 175 - A); } else { A = R(50, 85); B = R(Math.max(10, 96 - A), 85); }
        const C = 180 - A - B, angs = shuffle([A, B, C]);
        if (k === 'Acute' && Math.max(...angs) >= 90) return G.g4_shapes(l);
        return { q: `A triangle has angles of <b>${angs.join('°, ')}°</b>. What kind of triangle is it?`, a: choiceFixed(['Acute triangle', 'Right triangle', 'Obtuse triangle'], k + ' triangle'), hint: `Look at the BIGGEST angle: less than 90° → acute, exactly 90° → right, more than 90° → obtuse.`, explain: `The biggest angle is ${Math.max(...angs)}°, so it's ${k.toLowerCase()}.` };
      }
      const k = pick(['Equilateral', 'Isosceles', 'Scalene']); let s;
      if (k === 'Equilateral') { const x = R(3, 15); s = [x, x, x]; } else if (k === 'Isosceles') { const x = R(4, 15); let y; do { y = R(2, 2 * x - 1); } while (y === x); s = shuffle([x, x, y]); } else { let a, b, c; do { a = R(3, 15); b = R(3, 15); c = R(3, 15); } while (a === b || b === c || a === c || a + b <= c || a + c <= b || b + c <= a); s = [a, b, c]; }
      return { q: `A triangle has sides of <b>${s.join(' cm, ')} cm</b>. What kind of triangle is it?`, a: choiceFixed(['Equilateral', 'Isosceles', 'Scalene'], k), hint: `All 3 sides equal → equilateral. Exactly 2 equal → isosceles. None equal → scalene.`, explain: `It is ${k.toLowerCase()}.` };
    }
    const [clue, ans] = pick(QUADS);
    return { q: `Shape riddle: <b>"${clue}"</b> What shape am I?`, a: choice(ans, QUADS.map((x) => x[1]).filter((x) => x !== ans)), hint: `Think about sides (equal? parallel?) and angles (right angles?).`, explain: `"${clue}" describes a ${ans.toLowerCase()}.` };
  };

  // ---- Grade 5: fractions as division & multiplication as scaling (5.NF.3, 5.NF.5, 5.NF.6)
  G.g5_scaling = (l) => {
    if (l === 1) { const b = R(2, 9), a = R(1, 12); return { q: `<b>${a}</b> magic pies are shared equally by <b>${b}</b> unicorns. How much pie does each unicorn get? (A fraction or mixed number is fine.)`, a: frac(a, b), hint: `Sharing ${a} things among ${b} means ${a} ÷ ${b}, which is the fraction ${fr(a, b)}.`, explain: `${a} ÷ ${b} = ${fracHTML(a, b)} of a pie each.` }; }
    if (l === 2) {
      const n = R(24, 500), kind = pick(['less', 'greater', 'equal']), d = R(3, 9);
      const f = kind === 'less' ? [R(1, d - 1), d] : kind === 'greater' ? [d + R(1, 5), d] : [d, d];
      const opts = [`Greater than ${n}`, `Less than ${n}`, `Equal to ${n}`], ans = kind === 'less' ? opts[1] : kind === 'greater' ? opts[0] : opts[2];
      return { q: `Without multiplying: is <b>${fr(f[0], f[1])} × ${n}</b> greater than, less than, or equal to <b>${n}</b>?`, a: choiceFixed(opts, ans), hint: `Multiplying by a fraction LESS than 1 makes a number smaller. More than 1 makes it bigger. Exactly 1 keeps it the same.`, explain: `${fr(f[0], f[1])} is ${kind === 'less' ? 'less than' : kind === 'greater' ? 'more than' : 'equal to'} 1, so the product is ${ans.toLowerCase()}.` };
    }
    const b = R(2, 5), a = R(1, b - 1), w1 = R(1, 4), d = R(2, 5), c = R(1, d - 1), w2 = R(1, 3);
    const N1 = w1 * b + a, N2 = w2 * d + c;
    return { q: `Multiply. (Fractions or mixed numbers are both OK.)${big(`${mixed(w1, a, b)} × ${mixed(w2, c, d)}`)}`, a: frac(N1 * N2, b * d), hint: `Change both to improper fractions first: ${fr(N1, b)} × ${fr(N2, d)}.`, explain: `${fr(N1, b)} × ${fr(N2, d)} = ${fr(N1 * N2, b * d)} = ${fracHTML(N1 * N2, b * d)}.` };
  };

  // ---- Grade 5: volume with unit cubes, V = B × h, composite figures (5.MD.3–5)
  G.g5_volume = (l) => {
    if (l === 1) { const L = R(2, 8), W = R(2, 6), H = R(2, 6); return { q: `A unicorn toy box is packed with 1-inch cubes: <b>${L}</b> cubes long, <b>${W}</b> cubes wide and <b>${H}</b> layers tall. How many cubes are inside?`, a: num(L * W * H), hint: `One layer has ${L} × ${W} cubes. How many layers are there?`, explain: `${L} × ${W} = ${L * W} per layer; × ${H} layers = ${L * W * H} cubes.` }; }
    if (l === 2) { const B = R(6, 60), h = R(2, 12); return { q: `A crystal prism has a <b>base area of ${B} square cm</b> and a <b>height of ${h} cm</b>. What is its volume?`, a: num(B * h), hint: `Volume = base area × height.`, explain: `${B} × ${h} = ${B * h} cubic cm.` }; }
    const d = [R(2, 10), R(2, 8), R(2, 8), R(2, 10), R(2, 8), R(2, 8)], v1 = d[0] * d[1] * d[2], v2 = d[3] * d[4] * d[5];
    return { q: `A unicorn stable is made of two rectangular prisms stuck together. Part A is <b>${d[0]} × ${d[1]} × ${d[2]} m</b> and part B is <b>${d[3]} × ${d[4]} × ${d[5]} m</b>. What is the total volume?`, a: num(v1 + v2), hint: `Find each part's volume separately, then add.`, explain: `A: ${v1} cubic m. B: ${v2} cubic m. Total: ${v1 + v2} cubic m.` };
  };

  // ---- Grade 5: classifying 2-D figures (5.G.3–4)
  const FACTS = [['Every square is a rectangle.', 'True'], ['Every rectangle is a square.', 'False'], ['Every square is a rhombus.', 'True'], ['Every rhombus is a square.', 'False'], ['Every rectangle is a parallelogram.', 'True'], ['Every parallelogram is a rectangle.', 'False'], ['Every rhombus is a parallelogram.', 'True'], ['Every parallelogram is a quadrilateral.', 'True'], ['Every quadrilateral is a parallelogram.', 'False'], ['Every equilateral triangle is also isosceles.', 'True'], ['Every isosceles triangle is equilateral.', 'False'], ['A right triangle can also be isosceles.', 'True'], ['A triangle can have two right angles.', 'False'], ['A triangle can be both right and obtuse.', 'False'], ['A rhombus always has 4 equal sides.', 'True'], ['A rectangle always has 4 equal sides.', 'False']];
  const PROPS = [['How many pairs of parallel sides does a rectangle have?', 2], ['How many pairs of parallel sides does a triangle have?', 0], ['How many pairs of parallel sides does a regular hexagon have?', 3], ['How many pairs of parallel sides does a regular octagon have?', 4], ['How many right angles does a square have?', 4], ['How many right angles can a triangle have at most?', 1], ['What do the angles of any triangle add up to (in degrees)?', 180], ['What do the angles of any quadrilateral add up to (in degrees)?', 360], ['How many sides does a hexagon have?', 6], ['How many sides does an octagon have?', 8]];
  G.g5_shapes = (l) => {
    if (l < 3) { const pool = l === 1 ? FACTS.slice(0, 9) : FACTS.slice(9); const [s, ans] = pick(pool); return { q: `True or false? <b>"${s}"</b>`, a: choiceFixed(['True', 'False'], ans), hint: `Think about what each shape MUST have. A shape belongs to a group if it has all of that group's properties.`, explain: `${s} → ${ans}.` }; }
    const [s, n] = pick(PROPS);
    return { q: s, a: num(n), hint: `Picture or sketch the shape.`, explain: `The answer is ${n}.` };
  };

  // ---- Grade 6: statistics: mean, median, IQR, MAD (6.SP.3–5)
  G.g6_stats = (l) => {
    if (l === 1) { const n = R(4, 6), m = R(8, 40), v = meanSet(n, m, Math.max(3, Math.floor(m / 3))); return { q: `The royal archers scored ${listStr(v)}. What is the <b>mean</b> score?`, a: num(m), hint: `Add all ${n} scores, then divide by ${n}.`, explain: `Sum = ${n * m}; ${n * m} ÷ ${n} = ${m}.` }; }
    if (l === 2) {
      if (Math.random() < 0.5) { const n = pick([6, 8]), v = Array.from({ length: n }, () => R(10, 99)), s = v.slice().sort((a, b) => a - b), med = (s[n / 2 - 1] + s[n / 2]) / 2; return { q: `Guests at ${n} royal parties: ${listStr(v)}. What is the <b>median</b>?`, a: num(med), hint: `Order them. With an even count, the median is halfway between the two middle numbers.`, explain: `Ordered: ${s.join(', ')}. Median = (${s[n / 2 - 1]} + ${s[n / 2]}) ÷ 2 = ${fmt(med)}.` }; }
      const v = Array.from({ length: 8 }, () => R(10, 99)), s = v.slice().sort((a, b) => a - b), q1 = (s[1] + s[2]) / 2, q3 = (s[5] + s[6]) / 2;
      return { q: `Jewels in 8 royal chests: ${listStr(v)}. What is the <b>interquartile range</b> (IQR)?`, a: num(q3 - q1), hint: `Order the data. Q1 = median of the lower 4 values; Q3 = median of the upper 4. IQR = Q3 − Q1.`, explain: `Ordered: ${s.join(', ')}. Q1 = ${fmt(q1)}, Q3 = ${fmt(q3)}, IQR = ${fmt(q3 - q1)}.` };
    }
    const n = pick([4, 5]), m = R(10, 30), v = meanSet(n, m, 8), dev = v.map((x) => Math.abs(x - m)), mad = dev.reduce((a, b) => a + b, 0) / n;
    return { q: `Dragon eggs found each day: ${listStr(v)}. The mean is <b>${m}</b>. What is the <b>mean absolute deviation</b> (MAD)?`, a: num(mad), hint: `Find how far each value is from ${m} (ignore negatives), then average those distances.`, explain: `Distances: ${dev.join(', ')}. Average = ${dev.reduce((a, b) => a + b, 0)} ÷ ${n} = ${fmt(mad)}.` };
  };

  // ---- Grade 6: equations with fractions & decimals (6.EE.7)
  G.g6_eqdec = (l) => {
    if (l === 1) {
      if (Math.random() < 0.5) { const c = pick([0.2, 0.25, 0.4, 0.5, 0.8, 1.5, 2.5]), x = R(2, 40), b = rnd(c * x); return { q: `Solve for ${X}:${big(`${c}${X} = ${fmt(b)}`)}`, a: num(x), hint: `Divide both sides by ${c}.`, explain: `${fmt(b)} ÷ ${c} = ${fmt(x)}.` }; }
      const a = R(11, 99) / 4, x = R(5, 120) / 4; return { q: `Solve for ${X}:${big(`${X} + ${fmt(a)} = ${fmt(a + x)}`)}`, a: num(x), hint: `Subtract ${fmt(a)} from both sides. Line up the decimals!`, explain: `${fmt(a + x)} − ${fmt(a)} = ${fmt(x)}.` };
    }
    if (l === 2) {
      if (Math.random() < 0.5) { const d = R(2, 9), n = R(1, d - 1), k = R(2, 12); return { q: `Solve for ${X}:${big(`${fr(n, d)}${X} = ${n * k}`)}`, a: num(d * k), hint: `Multiply both sides by the reciprocal ${fr(d, n)}.`, explain: `${n * k} × ${fr(d, n)} = ${d * k}.` }; }
      const d1 = R(2, 6), d2 = R(2, 6), n1 = R(1, d1 - 1), n2 = R(1, 2 * d2);
      return { q: `Solve for ${X}:${big(`${X} ${MINUS} ${fr(n1, d1)} = ${fr(n2, d2)}`)}`, a: frac(n2 * d1 + n1 * d2, d1 * d2), hint: `Add ${fr(n1, d1)} to both sides. Use a common denominator.`, explain: `${X} = ${fr(n2, d2)} + ${fr(n1, d1)} = ${fracHTML(n2 * d1 + n1 * d2, d1 * d2)}.` };
    }
    if (Math.random() < 0.5) { const n = R(3, 8), c = 5 * R(20, 199), t = n * c; return { q: `Princess Lumi buys <b>${n}</b> identical ribbons for <b>${money(t / 100)}</b> in all. Solve <b>${n}<i>p</i> = ${money(t / 100).slice(1)}</b> to find the price of one ribbon.`, a: cash(c / 100), hint: `Divide ${money(t / 100)} by ${n}.`, explain: `${money(t / 100)} ÷ ${n} = ${money(c / 100)}.` }; }
    let d, n; do { d = R(3, 8); n = R(1, d - 1); } while (gcd(n, d) !== 1);
    const k = R(3, 15);
    return { q: `${fr(n, d)} of the castle guests are dancing. That's <b>${n * k}</b> guests. How many guests are at the castle in all? (Solve ${fr(n, d)}<i>g</i> = ${n * k}.)`, a: num(d * k), hint: `If ${n} part${n > 1 ? 's' : ''} = ${n * k}, then 1 part = ${k}. There are ${d} parts.`, explain: `${n * k} ÷ ${n} = ${k} per part; ${k} × ${d} = ${d * k} guests.` };
  };

  // ---- Grade 6: polygons on the coordinate plane (6.G.3, 6.NS.8)
  G.g6_poly = (l) => {
    if (l === 1) {
      if (Math.random() < 0.5) { const y = nz(-8, 8), x1 = R(-9, -1), x2 = R(1, 9); return { q: `How long is the castle wall from <b>${pt(x1, y)}</b> to <b>${pt(x2, y)}</b>?`, a: num(x2 - x1), hint: `Same y, so count across. From ${fmt(x1)} to 0 is ${-x1}, and 0 to ${x2} is ${x2}.`, explain: `${-x1} + ${x2} = ${x2 - x1} units.` }; }
      const x = nz(-8, 8), y1 = R(-9, -1), y2 = R(1, 9); return { q: `How long is the tower from <b>${pt(x, y1)}</b> to <b>${pt(x, y2)}</b>?`, a: num(y2 - y1), hint: `Same x, so count up and down.`, explain: `${-y1} + ${y2} = ${y2 - y1} units.` };
    }
    if (l === 2) {
      const x1 = R(-8, -1), x2 = R(1, 8), y1 = R(-8, -1), y2 = R(1, 8), ar = Math.random() < 0.5;
      return { q: `A castle garden is a rectangle with corners at <b>${pt(x1, y1)}</b>, <b>${pt(x2, y1)}</b>, <b>${pt(x2, y2)}</b> and <b>${pt(x1, y2)}</b>. What is its <b>${ar ? 'area' : 'perimeter'}</b>?`, a: num(ar ? (x2 - x1) * (y2 - y1) : 2 * (x2 - x1 + y2 - y1)), hint: `Width = ${x2} − (${fmt(x1)}) and height = ${y2} − (${fmt(y1)}).`, explain: `Width ${x2 - x1}, height ${y2 - y1}. ${ar ? `Area = ${(x2 - x1) * (y2 - y1)}` : `Perimeter = ${2 * (x2 - x1 + y2 - y1)}`}.` };
    }
    const x1 = R(-8, 0), x2 = x1 + 2 * R(1, 6), y1 = R(-6, 2), y3 = y1 + R(2, 9), x3 = R(-8, 8);
    return { q: `A triangular royal flag has corners at <b>${pt(x1, y1)}</b>, <b>${pt(x2, y1)}</b> and <b>${pt(x3, y3)}</b>. What is its area?`, a: num(((x2 - x1) * (y3 - y1)) / 2), hint: `The base is the flat side from ${pt(x1, y1)} to ${pt(x2, y1)}. The height is how far ${pt(x3, y3)} is above it.`, explain: `Base ${x2 - x1}, height ${y3 - y1}: ${fr(1, 2)} × ${x2 - x1} × ${y3 - y1} = ${((x2 - x1) * (y3 - y1)) / 2}.` };
  };

  // ---- Grade 7: writing & solving equations from angle relationships (7.G.5)
  G.g7_angles = (l) => {
    const x = R(5, 30);
    if (l === 1) {
      const a = R(2, 5), b = R(-10, 30), v = a * x + b;
      if (v <= 10 || v >= 170) return G.g7_angles(l);
      return { q: `Two lines cross. One angle is ${deg(`(${lin(a, b)})`)} and the angle <b>vertical</b> to it is ${deg(v)}. What is ${X}?`, a: num(x), hint: `Vertical angles are equal: ${lin(a, b)} = ${v}.`, explain: `${a}x${constTerm(b)} = ${v} → ${a}x = ${v - b} → x = ${x}.` };
    }
    if (l === 2) {
      const a = R(2, 6), b = R(-10, 20), c = R(1, 5), total = pick([90, 180]), dd = total - (a + c) * x - b, v1 = a * x + b, v2 = c * x + dd;
      if (v1 <= 5 || v2 <= 5) return G.g7_angles(l);
      return { q: `Angles ${deg(`(${lin(a, b)})`)} and ${deg(`(${lin(c, dd)})`)} are <b>${total === 90 ? 'complementary' : 'supplementary'}</b>. What is ${X}?`, a: num(x), hint: `${total === 90 ? 'Complementary' : 'Supplementary'} angles add up to ${total}°: (${lin(a, b)}) + (${lin(c, dd)}) = ${total}.`, explain: `${a + c}x${constTerm(b + dd)} = ${total} → x = ${x}. (The angles are ${v1}° and ${v2}°.)` };
    }
    const a = R(1, 3), b = R(1, 3), c = R(1, 3), e = R(-10, 30), f = 180 - (a + b + c) * x - e;
    const angs = [a * x, b * x + e, c * x + f];
    if (angs.some((v) => v <= 5)) return G.g7_angles(l);
    return { q: `A triangle has angles ${deg(`${term(a, X, true)}`)}, ${deg(`(${lin(b, e)})`)} and ${deg(`(${lin(c, f)})`)}. What is ${X}?`, a: num(x), hint: `The three angles of a triangle add up to 180°.`, explain: `${a + b + c}x${constTerm(e + f)} = 180 → x = ${x}. (Angles: ${angs.join('°, ')}°.)` };
  };

  // ---- Grade 7: simple interest, markup, commission, percent error (7.RP.3)
  G.g7_money = (l) => {
    if (l === 1) { const P = 100 * R(2, 30), r = R(2, 8), t = R(1, 5); return { q: `Sensei Koa puts <b>$${fmt(P)}</b> in a savings account that earns <b>${r}%</b> simple interest per year. How much <b>interest</b> does he earn in <b>${t}</b> year${t > 1 ? 's' : ''}?`, a: cash((P * r * t) / 100), hint: `Simple interest: I = P × r × t = ${fmt(P)} × ${r / 100} × ${t}.`, explain: `${fmt(P)} × ${r / 100} × ${t} = ${money((P * r * t) / 100)}.` }; }
    if (l === 2) {
      if (Math.random() < 0.5) { const c = 4 * R(3, 25), m = pick([25, 50, 75, 100]); return { q: `The dojo shop buys karate belts for <b>$${c}</b> each and marks them up <b>${m}%</b>. What is the selling price?`, a: cash(c + (c * m) / 100), hint: `Markup = ${m}% of $${c}. Add it to the cost.`, explain: `${m}% of ${c} = ${(c * m) / 100}; $${c} + $${(c * m) / 100} = ${money(c + (c * m) / 100)}.` }; }
      const S = 50 * R(4, 60), r = pick([3, 4, 5, 6, 8, 10]); return { q: `A salesperson earns <b>${r}%</b> commission. She sells <b>$${fmt(S)}</b> of karate gear. How much commission does she earn?`, a: cash((S * r) / 100), hint: `Commission = ${r}% of $${fmt(S)}.`, explain: `${r / 100} × ${fmt(S)} = ${money((S * r) / 100)}.` };
    }
    if (Math.random() < 0.5) { const A = 20 * R(2, 15), p = 5 * R(1, 6), up = Math.random() < 0.5, E = up ? A + (A * p) / 100 : A - (A * p) / 100; return { q: `Mia guessed there were <b>${E}</b> students at the tournament. There were actually <b>${A}</b>. What is her <b>percent error</b>?`, a: num(p), hint: `Percent error = |guess − actual| ÷ actual × 100.`, explain: `|${E} − ${A}| = ${Math.abs(E - A)}; ${Math.abs(E - A)} ÷ ${A} × 100 = ${p}%.` }; }
    const P = 100 * R(2, 20), r = R(2, 6), t = R(2, 5);
    return { q: `<b>$${fmt(P)}</b> earns <b>${r}%</b> simple interest per year for <b>${t}</b> years. What is the <b>total</b> in the account at the end (starting amount plus interest)?`, a: cash(P + (P * r * t) / 100), hint: `Find the interest (P × r × t), then add it to $${fmt(P)}.`, explain: `Interest: ${money((P * r * t) / 100)}. Total: ${money(P + (P * r * t) / 100)}.` };
  };

  // ---- Grade 7: sampling, predictions & experimental probability (7.SP.1–2, 7.SP.6–8)
  G.g7_sample = (l) => {
    if (l === 1) { const n = pick([20, 25, 40, 50, 60, 80, 100]), k = R(1, n - 1); return { q: `Kai spins a spinner <b>${n}</b> times and lands on red <b>${k}</b> times. What is the <b>experimental probability</b> of red? (as a fraction)`, a: frac(k, n), hint: `Experimental probability = times it happened ÷ total tries.`, explain: `${k} ÷ ${n} = ${fracHTML(k, n)}.` }; }
    if (l === 2) {
      const s = pick([20, 25, 40, 50]), k = R(1, s - 1), g = gcd(k, s), mult = s / g, T = mult * R(Math.ceil(100 / mult), Math.floor(2000 / mult));
      return { q: `In a random sample of <b>${s}</b> students, <b>${k}</b> said their favorite belt color is green. Predict how many of the school's <b>${fmt(T)}</b> students would say green.`, a: num((T * k) / s), hint: `Set up a proportion: ${fr(k, s)} = ${fr('?', fmt(T))}.`, explain: `${fr(k, s)} × ${fmt(T)} = ${fmt((T * k) / s)} students.` };
    }
    const f = R(1, 3);
    if (f === 1) { const T = 6 * R(5, 40); return { q: `A fair number cube (1–6) is rolled <b>${T}</b> times. About how many times would you <b>expect</b> to roll a ${R(1, 6)}?`, a: num(T / 6), hint: `The theoretical probability of any one number is ${fr(1, 6)}.`, explain: `${fr(1, 6)} × ${T} = ${T / 6}.` }; }
    if (f === 2) { const a = R(2, 6), b = R(2, 6), c = R(2, 4); return { q: `Mia has <b>${a}</b> headbands, <b>${b}</b> karate gis and <b>${c}</b> belts. How many different outfits (one of each) can she make?`, a: num(a * b * c), hint: `Use the counting principle: multiply the choices.`, explain: `${a} × ${b} × ${c} = ${a * b * c} outfits.` }; }
    const n = R(2, 4);
    return { q: `You flip <b>${n}</b> fair coins. What is the probability they ALL land heads? (as a fraction)`, a: frac(1, 2 ** n), hint: `Each coin is ${fr(1, 2)}. Multiply for all ${n} coins.`, explain: `${Array(n).fill('½').join(' × ')} = ${fr(1, 2 ** n)}.` };
  };

  // ---- Grade 8: functions (8.F.1–3, 8.F.4–5)
  G.g8_func = (l) => {
    if (l === 1) {
      const isF = Math.random() < 0.5, xs = shuffle([-4, -3, -2, -1, 0, 1, 2, 3, 4, 5]).slice(0, 4), pairs = xs.map((x) => [x, R(-9, 9)]);
      if (!isF) { let y; do { y = R(-9, 9); } while (y === pairs[0][1]); pairs[3] = [pairs[0][0], y]; }
      return { q: `Is this relation a <b>function</b>?${big(`{ ${shuffle(pairs).map((p) => pt(p[0], p[1])).join(', ')} }`)}`, a: choiceFixed(['Yes', 'No'], isF ? 'Yes' : 'No'), hint: `A function gives each input (x) exactly ONE output (y). Look for a repeated x with different y's.`, explain: isF ? `Every x appears once, so it is a function.` : `x = ${fmt(pairs[0][0])} has two different outputs, so it is NOT a function.` };
    }
    if (l === 2) {
      const m = nz(-8, 12), b = R(0, 60), t1 = R(0, 4), t2 = t1 + R(2, 6);
      if (Math.random() < 0.5) return { q: `The Rainbow Dragon's height is a linear function of time. At <b>${t1} s</b> it is at <b>${m * t1 + b + 100} m</b>, and at <b>${t2} s</b> it is at <b>${m * t2 + b + 100} m</b>. What is the <b>rate of change</b> in meters per second?`, a: num(m), hint: `Rate of change = change in height ÷ change in time.`, explain: `(${m * t2 + b + 100} − ${m * t1 + b + 100}) ÷ (${t2} − ${t1}) = ${fmt(m)} m per second.` };
      const mA = R(1, 9); let mB; do { mB = R(1, 9); } while (mB === mA);
      const xs = [0, 1, 2, 3], c = R(-5, 10);
      return { q: `Which function has the <b>greater rate of change</b>?<br><b>Function A:</b> <i>y</i> = ${lin(mA, R(-9, 9))}<br><b>Function B:</b>${ioTable(xs, xs.map((x) => mB * x + c))}`, a: choiceFixed(['Function A', 'Function B'], mA > mB ? 'Function A' : 'Function B'), hint: `A's rate is the number in front of x. B's rate is how much y changes each time x goes up by 1.`, explain: `A's rate is ${mA}; B's rate is ${mB}. ${mA > mB ? 'A' : 'B'} is greater.` };
    }
    const lins = [`<i>y</i> = ${lin(R(2, 9), R(-9, 9))}`, `<i>y</i> = ${fr(X, R(2, 5))}${constTerm(R(1, 9))}`, `${R(2, 6)}${X} + <i>y</i> = ${R(2, 20)}`, `<i>y</i> = ${MINUS}${R(2, 9)}${X}`, `<i>y</i> = ${R(2, 20)}`];
    const nons = [`<i>y</i> = ${X}<sup>2</sup>${constTerm(nz(-9, 9))}`, `<i>y</i> = ${X}<sup>3</sup>`, `<i>y</i> = ${fr(R(2, 9), X)}`, `<i>y</i> = ${R(2, 5)}<sup>${X}</sup>`, `<i>xy</i> = ${R(2, 20)}`];
    const non = pick(nons);
    return { q: `Which equation is <b>NOT</b> a linear function?`, a: choice(non, shuffle(lins).slice(0, 3)), hint: `Linear functions make straight lines: x has power 1, and it isn't in a denominator, an exponent, or multiplied by y.`, explain: `${non} is not linear. Its graph curves.` };
  };

  // ---- Grade 8: rational & irrational numbers, square-root estimates, repeating decimals (8.NS.1–2)
  G.g8_irr = (l) => {
    if (l === 1) {
      const items = [[`√${pick([4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144])}`, 'Rational'], [`√${pick([2, 3, 5, 6, 7, 8, 10, 11, 12, 15, 20])}`, 'Irrational'], ['π', 'Irrational'], [fr(R(1, 9), R(2, 11)), 'Rational'], [`${MINUS}${R(1, 20)}`, 'Rational'], [`0.${R(1, 9)}${R(1, 9)}`, 'Rational'], [`0.${R(1, 9)}${R(1, 9)}${R(1, 9)}… (the digits repeat)`, 'Rational'], [`√(${fr(pick([1, 4, 9]), pick([16, 25, 49]))})`, 'Rational']];
      const [s, ans] = pick(items);
      return { q: `Is this number rational or irrational?${big(s)}`, a: choiceFixed(['Rational', 'Irrational'], ans), hint: `Rational numbers can be written as a fraction of integers. Square roots of non-perfect squares and π are irrational.`, explain: `${s} is ${ans.toLowerCase()}.` };
    }
    if (l === 2) {
      let n; do { n = R(2, 150); } while (Number.isInteger(Math.sqrt(n)) || Math.abs(Math.sqrt(n) * 10 - Math.round(Math.sqrt(n) * 10) - 0.5) < 0.05);
      const ans = Math.round(Math.sqrt(n) * 10) / 10;
      return { q: `Estimate <b>√${n}</b> to the nearest <b>tenth</b>.`, a: num(ans), hint: `${Math.floor(Math.sqrt(n)) ** 2} < ${n} < ${Math.ceil(Math.sqrt(n)) ** 2}, so √${n} is between ${Math.floor(Math.sqrt(n))} and ${Math.ceil(Math.sqrt(n))}. Square some decimals in between to get closer.`, explain: `${fmt(rnd(ans - 0.05, 2))}² = ${fmt(rnd((ans - 0.05) ** 2, 4))} and ${fmt(rnd(ans + 0.05, 2))}² = ${fmt(rnd((ans + 0.05) ** 2, 4))}. ${n} is between them, so √${n} ≈ ${ans}.` };
    }
    if (Math.random() < 0.5) { const d = R(1, 8); return { q: `Write the repeating decimal as a fraction:${big(`0.${String(d).repeat(4)}…`)}<div class="note">(the ${d} repeats forever)</div>`, a: frac(d, 9), hint: `Let x = 0.${d}${d}${d}… Then 10x = ${d}.${d}${d}${d}… Subtract: 9x = ${d}.`, explain: `9x = ${d}, so x = ${fracHTML(d, 9)}.` }; }
    let ab; do { ab = R(1, 98); } while (ab % 11 === 0);
    const s2 = String(ab).padStart(2, '0');
    return { q: `Write the repeating decimal as a fraction:${big(`0.${s2.repeat(3)}…`)}<div class="note">(the "${s2}" repeats forever)</div>`, a: frac(ab, 99), hint: `Let x = 0.${s2}${s2}… Then 100x = ${ab}.${s2}${s2}… Subtract: 99x = ${ab}.`, explain: `99x = ${ab}, so x = ${fracHTML(ab, 99)}.` };
  };

  // ---- Grade 8: parallel lines, transversals & exterior angles (8.G.5)
  G.g8_angles = (l) => {
    if (l === 1) {
      const a = R(30, 150), rel = pick([['alternate interior', true], ['corresponding', true], ['alternate exterior', true], ['same-side (consecutive) interior', false]]);
      return { q: `Two parallel lines are cut by a transversal. One angle is ${deg(a)}. What is its <b>${rel[0]}</b> angle?`, a: num(rel[1] ? a : 180 - a), hint: rel[1] ? `With parallel lines, ${rel[0]} angles are EQUAL.` : `Same-side interior angles are SUPPLEMENTARY (add to 180°).`, explain: rel[1] ? `They're equal: ${a}°.` : `180 − ${a} = ${180 - a}°.` };
    }
    if (l === 2) {
      const a = R(20, 80), b = R(20, 80);
      if (Math.random() < 0.5) return { q: `A triangle has two interior angles of ${deg(a)} and ${deg(b)}. What is the <b>exterior angle</b> next to the third angle?`, a: num(a + b), hint: `An exterior angle equals the sum of the two remote interior angles.`, explain: `${a} + ${b} = ${a + b}°.` };
      return { q: `An exterior angle of a triangle is ${deg(a + b)}. One of the remote interior angles is ${deg(a)}. What is the other remote interior angle?`, a: num(b), hint: `Exterior angle = sum of the two remote interior angles.`, explain: `${a + b} − ${a} = ${b}°.` };
    }
    const x = R(5, 30);
    if (Math.random() < 0.5) {
      let a, c; do { a = R(2, 7); c = R(2, 7); } while (a === c);
      const b = R(-20, 30), d = a * x + b - c * x, v = a * x + b;
      if (v <= 10 || v >= 170) return G.g8_angles(l);
      return { q: `Parallel lines are cut by a transversal. Two <b>alternate interior</b> angles measure ${deg(`(${lin(a, b)})`)} and ${deg(`(${lin(c, d)})`)}. What is ${X}?`, a: num(x), hint: `Alternate interior angles are equal: ${lin(a, b)} = ${lin(c, d)}.`, explain: `${a}x${constTerm(b)} = ${c}x${constTerm(d)} → x = ${x}. (Each angle is ${v}°.)` };
    }
    const a = R(2, 6), c = R(1, 5), b = R(-10, 20), d = 180 - (a + c) * x - b, v1 = a * x + b, v2 = c * x + d;
    if (v1 <= 5 || v2 <= 5) return G.g8_angles(l);
    return { q: `Parallel lines are cut by a transversal. Two <b>same-side interior</b> angles measure ${deg(`(${lin(a, b)})`)} and ${deg(`(${lin(c, d)})`)}. What is ${X}?`, a: num(x), hint: `Same-side interior angles add up to 180°.`, explain: `${a + c}x${constTerm(b + d)} = 180 → x = ${x}. (Angles: ${v1}° and ${v2}°.)` };
  };

  // ---------- public API ----------
  function generate(topic, level, seen, grade) {
    const g = G[topic];
    if (!g) throw new Error('Unknown topic ' + topic);
    let q;
    for (let i = 0; i < 12; i++) { q = g(level, grade || 6); if (!seen || !seen.has(q.q)) break; }
    if (seen) seen.add(q.q);
    q.topic = topic;
    q.level = level;
    return q;
  }

  MQ.Q = { generate, check, answerHTML, parseAnswer, sampleInput, topics: Object.keys(G) };
})();
