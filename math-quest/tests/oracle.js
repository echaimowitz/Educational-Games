// Independent answer checker. Run with: node math-quest/tests/oracle.js
// It does NOT reuse the generators' math. It reads the question text the
// kid sees, recomputes the answer from scratch, and compares the result with
// the game's answer key. It covers arithmetic expressions, equations (by
// plugging the answer back in), missing-number puzzles, comparisons,
// rounding, place value, remainders and scientific notation.
global.window = global;
require('../js/questions.js');
const { Q } = window.MQ;

const strip = (s) => s.replace(/<[^>]+>/g, '');
function toJS(html) {
  let s = html
    .replace(/<span class="frac"><span class="fn">(.*?)<\/span><span class="fd">(.*?)<\/span><\/span>/g, '(($1)/($2))')
    .replace(/(\d+)&#8239;(\(\(.*?\)\/\(.*?\)\))/g, '($1+$2)')
    .replace(/<sup>(.*?)<\/sup>/g, '**($1)')
    .replace(/<\/?(i|b|u)>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/').replace(/\[/g, '(').replace(/\]/g, ')')
    .replace(/(\d),(\d{3})/g, '$1$2').replace(/(\d),(\d{3})/g, '$1$2')
    .replace(/√(\d+)/g, 'Math.sqrt($1)').replace(/∛(\d+)/g, 'Math.cbrt($1)')
    .replace(/\|([^|]+)\|/g, 'Math.abs($1)')
    .replace(/(\d+)% of (\d+)/g, '($1/100*$2)').replace(/(\d+)%/g, '($1/100)');
  s = s.replace(/(\d|\))\s*(x|\()/g, '$1*$2').replace(/\)\s*\(/g, ')*(');
  return s;
}
const ev = (js, x) => Function('x', `"use strict"; return (${js});`)(x);
const val = (a) => (a.kind === 'num' ? a.value : a.n / a.d);
const close = (u, v, tol = 1e-6) => Math.abs(u - v) <= tol * Math.max(1, Math.abs(v)) + 1e-9;

let checked = 0, failures = 0;
const counts = {};
function fail(t, q, why) { failures++; if (failures <= 30) console.error(`FAIL ${t}: ${why}\n   ${strip(q.q)}\n   key: ${strip(Q.answerHTML(q.a))}`); }

// Linear equation "L = R" in x (and maybe y) -> coefficients [cx, cy, c] with cx*x + cy*y = c
function linear(eqHTML) {
  const [L, Rt] = toJS(strip(eqHTML.replace(/<i>y<\/i>/g, 'y'))).replace(/(\d|\))\s*y/g, '$1*y').split('=');
  const F = (x, y) => Function('x', 'y', `return (${L}) - (${Rt});`)(x, y);
  const f0 = F(0, 0);
  return [F(1, 0) - f0, F(0, 1) - f0, -f0];
}
const nums = (s) => (strip(s).replace(/−/g, '-').match(/-?\d+(\.\d+)?/g) || []).map(Number);
const parsePt = (s) => nums(s).slice(0, 2);
const ptStr = (x, y) => `(${x}, ${y})`.replace(/-/g, '−');

function semantic(t, q) {
  const text = q.q, a = q.a, correct = a.kind === 'choice' ? strip(a.choices[a.correct]) : null;
  let m;
  if ((m = text.match(/is a <b>factor<\/b> of <b>(\d+)/))) { const N = +m[1]; return a.choices.every((c, i) => (N % +strip(c) === 0) === (i === a.correct)); }
  if ((m = text.match(/is a <b>multiple<\/b> of <b>(\d+)/))) { const k = +m[1]; return a.choices.every((c, i) => (+strip(c) % k === 0) === (i === a.correct)); }
  if ((m = text.match(/Is <b>(\d+)<\/b> prime/))) { const N = +m[1]; let p = N > 1; for (let i = 2; i * i <= N; i++) if (N % i === 0) p = false; return correct === (p ? 'Prime' : 'Composite'); }
  if ((m = text.match(/How many <b>factors<\/b> does <b>(\d+)/))) { const N = +m[1]; let c = 0; for (let i = 1; i <= N; i++) if (N % i === 0) c++; return a.value === c; }
  if (/Solve the inequality|makes this inequality <b>true/.test(text)) {
    const big = strip(text.match(/<div class="big">([\s\S]*?)<\/div>/)[1]).replace(/&gt;/g, '>').replace(/&lt;/g, '<');
    const [lhs, op, rhs] = big.split(/\s(>|<|≥|≤)\s/);
    const cmp = (u, o, v) => (o === '>' ? u > v + 1e-9 : o === '<' ? u < v - 1e-9 : o === '≥' ? u >= v - 1e-9 : u <= v + 1e-9);
    const f = (x) => ev(toJS(lhs), x), c = ev(toJS(rhs));
    const holds = (x) => cmp(f(x), op, c);
    if (/makes this inequality/.test(text)) return a.choices.every((ch, i) => holds(+strip(ch).replace('−', '-')) === (i === a.correct));
    // every choice "x OP v": exactly the correct one must describe the same solution set
    const same = (ch) => { const s = strip(ch).replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/−/g, '-'); const [, o2, v2] = s.match(/x (>|<|≥|≤) (-?[\d.]+)/); for (let x = -40; x <= 40; x += 0.25) if (holds(x) !== cmp(x, o2, +v2)) return false; return true; };
    return a.choices.every((ch, i) => same(ch) === (i === a.correct));
  }
  if (/Solve the system|solution to <b>both<\/b>/.test(text)) {
    const lines = text.split('<br>').slice(1);
    const [[a1, b1, c1], [a2, b2, c2]] = lines.map(linear);
    const det = a1 * b2 - a2 * b1, x = (c1 * b2 - c2 * b1) / det, y = (a1 * c2 - a2 * c1) / det;
    if (/both/.test(text)) return a.choices.every((ch, i) => { const [px, py] = parsePt(ch); return (close(px, x) && close(py, y)) === (i === a.correct); });
    return close(a.value, /What is <b>y/.test(text) ? y : x);
  }
  if ((m = text.match(/Point <b>(\([^)]*\))<\/b> is <b>(translated|reflected|rotated [^<]*|dilated)<\/b>(.*?)Where/))) {
    const [x, y] = parsePt(m[1]), how = m[2], rest = strip(m[3]);
    let want;
    if (how === 'translated') { const d = rest.match(/(\d+) (right|left) and (\d+) (up|down)/); want = [x + (d[2] === 'right' ? +d[1] : -d[1]), y + (d[4] === 'up' ? +d[3] : -d[3])]; }
    else if (how === 'reflected') want = /x-axis/.test(rest) ? [x, -y] : [-x, y];
    else if (how === 'dilated') { const s = +rest.match(/factor of (\d+)/)[1]; want = [s * x, s * y]; }
    else want = /90/.test(how) ? [-y, x] : [-x, -y];
    return a.choices.every((ch, i) => { const [px, py] = parsePt(ch); return (px === want[0] && py === want[1]) === (i === a.correct); });
  }
  if ((m = text.match(/starts at <b>(\([^)]*\))<\/b>\. She trots <b>(\d+) right<\/b> and <b>(\d+) up/))) { const [x, y] = parsePt(m[1]); return correct === ptStr(x + +m[2], y + +m[3]); }
  if ((m = text.match(/corners at <b>(\([^)]*\))<\/b>, <b>(\([^)]*\))<\/b>, <b>(\([^)]*\))<\/b>/))) {
    const [p1, , p3] = [m[1], m[2], m[3]].map(parsePt), w = Math.abs(p3[0] - p1[0]), h = Math.abs(p3[1] - p1[1]);
    return a.value === (/area/.test(text) ? w * h : 2 * (w + h));
  }
  if (/cylinder-shaped star jar|cone-shaped comet|sphere-shaped planet/.test(text)) {
    const [r, h] = nums(text.replace(/3\.14/, ''));
    const want = /cylinder/.test(text) ? 3.14 * r * r * h : /cone/.test(text) ? (3.14 * r * r * h) / 3 : (4 / 3) * 3.14 * r ** 3;
    return Math.abs(a.value - want) < 0.011;
  }
  // ---- round 3 topics ----
  if ((m = text.match(/0\.(\d+)…/)) && /repeating decimal/.test(text)) {
    const rep = strip(text).match(/the "?(\d+)"? repeats/)[1], want = +rep / (10 ** rep.length - 1);
    return close(val(a), want, 1e-12);
  }
  if (/rational or irrational/.test(text)) {
    const raw = text.match(/<div class="big">([\s\S]*?)<\/div>$/)[1], s = strip(raw);
    let rational;
    if (/π/.test(s)) rational = false;
    else if (!/frac/.test(raw) && (m = s.match(/^√(\d+)$/))) rational = Number.isInteger(Math.sqrt(+m[1]));
    else if (/^√/.test(s)) { const n = +raw.match(/class="fn">(\d+)/)[1], d = +raw.match(/class="fd">(\d+)/)[1]; rational = Number.isInteger(Math.sqrt(n)) && Number.isInteger(Math.sqrt(d)); }
    else rational = true; // integers, terminating or repeating decimals, fractions
    return correct === (rational ? 'Rational' : 'Irrational');
  }
  if ((m = text.match(/Estimate <b>√(\d+)<\/b> to the nearest <b>tenth/))) return a.value === Math.round(Math.sqrt(+m[1]) * 10) / 10;
  // angle equations: collect the angle expressions in bold and the relationship
  if (/What is <i>x<\/i>\?/.test(text) && /°/.test(text)) {
    const angs = [...text.matchAll(/<b>\(?((?:(?!<b>).)*?)\)?°<\/b>/g)].map((x) => x[1]);
    const evA = (e) => ev(toJS(e), a.value);
    const vals = angs.map(evA);
    if (/vertical|alternate interior/.test(text)) return close(vals[0], vals[1]) && vals[0] > 0;
    if (/complementary/.test(text)) return close(vals[0] + vals[1], 90) && vals.every((v) => v > 0);
    if (/supplementary|same-side interior/.test(text)) return close(vals[0] + vals[1], 180) && vals.every((v) => v > 0);
    if (/triangle/.test(text)) return close(vals.reduce((s, v) => s + v, 0), 180) && vals.every((v) => v > 0);
  }
  if (/parallel lines are cut/i.test(text) && (m = text.match(/One angle is <b>(\d+)°/))) { const ang = +m[1]; return a.value === (/same-side/.test(text) ? 180 - ang : ang); }
  if (/exterior angle/.test(text)) { const [p1, p2] = [...text.matchAll(/<b>(\d+)°<\/b>/g)].map((x) => +x[1]); return a.value === (/What is the <b>exterior/.test(text) ? p1 + p2 : p1 - p2); }
  if (/third angle\?/.test(text)) { const [p1, p2] = [...text.matchAll(/<b>(\d+)°<\/b>/g)].map((x) => +x[1]); return a.value === 180 - p1 - p2; }
  if (/triangle has angles of <b>/.test(text) && /What kind/.test(text)) { const big = Math.max(...nums(text.match(/angles of <b>([^<]*)<\/b>/)[1])); return correct === (big < 90 ? 'Acute' : big === 90 ? 'Right' : 'Obtuse') + ' triangle'; }
  if (/triangle has sides of <b>/.test(text)) { const s = nums(text.match(/sides of <b>([^<]*)<\/b>/)[1]), u = new Set(s).size; return correct === (u === 1 ? 'Equilateral' : u === 2 ? 'Isosceles' : 'Scalene'); }
  // statistics: data list is "a, b, c, and d" before the first '.'
  const dataList = () => nums(strip(text).split(/scored|parties:|chests:|day:/)[1].split('.')[0]);
  if (/What is the <b>mean<\/b> score/.test(text)) { const v = dataList(); return close(a.value, v.reduce((s, x) => s + x, 0) / v.length); }
  if (/royal parties.*<b>median/.test(text)) { const v = dataList().sort((x, y) => x - y), n = v.length; return close(a.value, (v[n / 2 - 1] + v[n / 2]) / 2); }
  if (/interquartile range/.test(text)) { const v = dataList().sort((x, y) => x - y), med = (u) => (u.length % 2 ? u[(u.length - 1) / 2] : (u[u.length / 2 - 1] + u[u.length / 2]) / 2); return close(a.value, med(v.slice(4)) - med(v.slice(0, 4))); }
  if (/mean absolute deviation/.test(text)) { const v = dataList(), mean = v.reduce((s, x) => s + x, 0) / v.length; return close(a.value, v.reduce((s, x) => s + Math.abs(x - mean), 0) / v.length); }
  // functions
  if (/relation a <b>function/.test(text)) { const pts = [...strip(text).matchAll(/\((−?\d+), (−?\d+)\)/g)].map((x) => [x[1], x[2]]); const byX = {}; let isF = true; pts.forEach(([x, y]) => { if (byX[x] !== undefined && byX[x] !== y) isF = false; byX[x] = y; }); return correct === (isF ? 'Yes' : 'No'); }
  if ((m = text.match(/At <b>(\d+) s<\/b> it is at <b>(−?\d+) m<\/b>, and at <b>(\d+) s<\/b> it is at <b>(−?\d+) m/))) { const [t1, h1, t2, h2] = [m[1], m[2], m[3], m[4]].map((x) => +x.replace('−', '-')); return close(a.value, (h2 - h1) / (t2 - t1)); }
  if (/greater rate of change/.test(text)) { const fA = toJS(strip(text.match(/Function A:<\/b>(.*?)<br>/)[1]).split('=')[1]), mA = ev(fA, 1) - ev(fA, 0), ys = [...text.matchAll(/<td>(−?\d+)<\/td>/g)].map((x) => +x[1].replace('−', '-')).slice(4), mB = ys[1] - ys[0]; return correct === (mA > mB ? 'Function A' : 'Function B'); }
  // volume, money, sampling
  if ((m = strip(text).match(/(\d+) cubes long, (\d+) cubes wide and (\d+) layers/))) return a.value === m[1] * m[2] * m[3];
  if ((m = strip(text).match(/base area of (\d+) square cm and a height of (\d+)/))) return a.value === m[1] * m[2];
  if ((m = strip(text).match(/Part A is (\d+) × (\d+) × (\d+) m and part B is (\d+) × (\d+) × (\d+)/))) return a.value === m[1] * m[2] * m[3] + m[4] * m[5] * m[6];
  if ((m = strip(text).match(/\$([\d,]+) .*?earns (\d+)% simple interest per year.*? (\d+) year/))) { const P = +m[1].replace(/,/g, ''), I = (P * m[2] * m[3]) / 100; return close(a.value, /total/.test(text) ? P + I : I); }
  if ((m = strip(text).match(/for \$(\d+) each and marks them up (\d+)%/))) return close(a.value, m[1] * (1 + m[2] / 100));
  if ((m = strip(text).match(/earns (\d+)% commission\. She sells \$([\d,]+)/))) return close(a.value, (m[1] * +m[2].replace(/,/g, '')) / 100);
  if ((m = strip(text).match(/guessed there were (\d+) .*actually (\d+)/))) return close(a.value, (Math.abs(m[1] - m[2]) / m[2]) * 100);
  if ((m = strip(text).match(/sample of (\d+) students, (\d+) said .* school's ([\d,]+) students/))) return close(a.value, (m[2] / m[1]) * +m[3].replace(/,/g, ''));
  if ((m = strip(text).match(/spins a spinner (\d+) times and lands on red (\d+) times/))) return close(val(a), m[2] / m[1]);
  if ((m = strip(text).match(/rolled (\d+) times/))) return close(a.value, m[1] / 6);
  if ((m = strip(text).match(/has (\d+) headbands, (\d+) karate gis and (\d+) belts/))) return a.value === m[1] * m[2] * m[3];
  if ((m = strip(text).match(/You flip (\d+) fair coins/))) return close(val(a), 1 / 2 ** m[1]);
  if ((m = strip(text).match(/(\d+) magic pies are shared equally by (\d+)/))) return close(val(a), m[1] / m[2]);
  if ((m = text.match(/is <b>.*?<\/b> greater than, less than, or equal to <b>(\d+)<\/b>/))) { const f = ev(toJS(text.match(/is <b>(.*?) × \d+<\/b>/)[1])); return correct === (f > 1 ? 'Greater than' : f < 1 ? 'Less than' : 'Equal to') + ' ' + m[1]; }
  if ((m = strip(text).match(/triangular royal flag has corners at \((−?\d+), (−?\d+)\), \((−?\d+), (−?\d+)\) and \((−?\d+), (−?\d+)\)/))) { const [x1, y1, x2, , , y3] = m.slice(1).map((x) => +x.replace('−', '-')); return close(a.value, (Math.abs(x2 - x1) * Math.abs(y3 - y1)) / 2); }
  if ((m = strip(text).match(/from \((−?\d+), (−?\d+)\) to \((−?\d+), (−?\d+)\)\?/))) { const [x1, y1, x2, y2] = m.slice(1).map((x) => +x.replace('−', '-')); return a.value === Math.abs(x2 - x1) + Math.abs(y2 - y1); }
  return null;
}

function verify(t, q) {
  const text = q.q, a = q.a;
  const sem = semantic(t, q);
  if (sem !== null) return sem || fail(t, q, 'semantic check failed'), true;
  const bigM = text.match(/<div class="big">([\s\S]*?)<\/div>/);
  // rounding
  let m = text.match(/round to the nearest <b>([\d,]+)<\/b>/);
  if (m && bigM) {
    const p = +m[1].replace(/,/g, ''), n = +strip(bigM[1]).replace(/,/g, '');
    const lower = n - (n % p), want = n % p >= p / 2 ? lower + p : lower;
    return close(a.value, want) || fail(t, q, `rounding expected ${want}`), true;
  }
  m = text.match(/round to the nearest <b>(tenth|hundredth)<\/b>/);
  if (m && bigM) {
    // string-based rounding, no floating point
    const s = strip(bigM[1]), [w, f] = s.split('.'), keep = m[1] === 'tenth' ? 1 : 2;
    let units = +(w + f.slice(0, keep));
    if (+f[keep] >= 5) units++;
    const want = units / 10 ** keep;
    return close(a.value, want) || fail(t, q, `decimal rounding expected ${want}`), true;
  }
  if (/thousandths<\/b> digit worth/.test(text)) {
    const s = strip(text.match(/in <b>([\d.]+)<\/b>/)[1]), want = +s.split('.')[1][2] / 1000;
    return close(a.value, want) || fail(t, q, `thousandths expected ${want}`), true;
  }
  // place value of underlined digit
  if (/underlined/.test(text) && bigM) {
    const raw = bigM[1].replace(/,/g, ''), idx = raw.indexOf('<u>'), digits = raw.replace(/<\/?u>/g, '');
    const d = +digits[idx], place = digits.length - 1 - idx;
    return close(a.value, d * 10 ** place) || fail(t, q, `place value expected ${d * 10 ** place}`), true;
  }
  if (!bigM) return false;
  const big = bigM[1];
  if (/<table/.test(big)) return false;
  // quotient & remainder choice
  if (/quotient and remainder/.test(text)) {
    const [n, d] = toJS(big).split('/').map((s) => +s.trim());
    const want = `${Math.floor(n / d)} R ${n % d}`;
    return a.choices[a.correct] === want || fail(t, q, `remainder expected ${want}`), true;
  }
  // comparison symbols
  if (/Which symbol/.test(text)) {
    const [L, Rt] = toJS(big).split('?').map((s) => ev(s.trim()));
    const want = L > Rt ? '&gt;' : L < Rt ? '&lt;' : '=';
    return a.choices[a.correct] === want || fail(t, q, `symbol expected ${want}`), true;
  }
  // scientific notation answers
  if (a.kind === 'choice' && /10<sup>/.test(a.choices[a.correct])) {
    const sciVal = (h) => ev(toJS(h));
    let want;
    if (/Write <b>/.test(text)) { want = +strip(text.match(/Write <b>(.*?)<\/b>/)[1]).replace(/,/g, ''); }
    else want = ev(toJS(big));
    const got = sciVal(a.choices[a.correct]);
    const mant = +strip(a.choices[a.correct]).split('×')[0];
    if (!(mant >= 1 && mant < 10)) fail(t, q, 'not proper scientific notation');
    const others = a.choices.filter((_, i) => i !== a.correct).filter((c) => close(sciVal(c), want) && (() => { const mm = +strip(c).split('×')[0]; return mm >= 1 && mm < 10; })());
    if (others.length) fail(t, q, 'another choice is also correct');
    return close(got, want, 1e-9) || fail(t, q, `sci expected ${want}`), true;
  }
  if (a.kind === 'choice') return false;
  let js = toJS(big);
  // proportions / ratios written with ":"
  js = js.replace(/(\d+)\s*:\s*(\d+|\?)/g, '($1/$2)').replace(/\?\s*:\s*(\d+)/g, '(?/$1)');
  if (js.includes('?') && js.includes('=')) {
    const [L, Rt] = js.replace(/\?/g, `(${val(a)})`).split('=');
    if (/\*\*\(\(/.test(L + Rt) || /\*\*\(\?\)/.test(L + Rt)) return false;
    return close(ev(L), ev(Rt)) || fail(t, q, 'missing-number check failed'), true;
  }
  if (js.includes('?')) return false; // sequences ("what comes next")
  if (js.includes('=')) {
    if (!/x/.test(js)) return false;
    const [L, Rt] = js.split('=');
    return close(ev(L, val(a)), ev(Rt, val(a))) || fail(t, q, `x = ${val(a)} does not satisfy equation`), true;
  }
  if (/\bx\b/.test(js)) {
    const xm = text.match(/when <i>x<\/i> = (−?\d+)/);
    if (!xm) return false;
    return close(ev(js, +xm[1].replace('−', '-')), val(a)) || fail(t, q, 'evaluation mismatch'), true;
  }
  if (/[ab]/.test(js.replace(/Math\.\w+/g, ''))) return false;
  let want = ev(js);
  if (/Write as a percent/.test(text)) want *= 100;
  return close(val(a), want, 1e-9) || fail(t, q, `expected ${want}`), true;
}

for (const t of Q.topics) {
  for (const g of t.startsWith('b_') ? [4, 5, 6, 7, 8] : [6]) for (const l of [1, 2, 3]) for (let i = 0; i < 300; i++) {
    const q = Q.generate(t, l, null, g);
    let ok;
    try { ok = verify(t, q); } catch (e) { fail(t, q, 'checker could not parse: ' + e.message); ok = true; }
    if (ok) { checked++; counts[t] = (counts[t] || 0) + 1; }
  }
}
const uncovered = Q.topics.filter((t) => !counts[t]);
console.log(`Independently verified ${checked} questions across ${Object.keys(counts).length} topics. ${failures} failures.`);
console.log('Topics checked only by the main test + manual review (word problems, data, etc.):', uncovered.join(', '));
process.exit(failures ? 1 : 0);
