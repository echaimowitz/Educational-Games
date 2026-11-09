/* Word Wizards — dictionary lookups and speech.
 * Definitions, example sentences and recordings come from the free dictionary at dictionaryapi.dev
 * (needs internet). Speech falls back to the device's built-in voice.
 */
(function () {
  'use strict';
  const WW = (window.WW = window.WW || {});
  const API = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

  // Definitions about specialist subjects, slang or old-fashioned uses are less useful for kids.
  const AVOID = /\b(slang|vulgar|offensive|derogatory|obsolete|archaic|dated|rare|informal|nautical|computing|investments?|finance|financial|securities|stocks?|prices?|data|mathematics|law|legal|baseball|cricket|poker|military|biology|chemistry|physics|anatomy|botany|heraldry|printing|sexual|drug|alcohol)\b/i;
  // Example sentences with grown-up content are skipped (a grown-up can always write their own).
  const EX_AVOID = /\b(bloody|blood|kill\w*|dead|die[ds]?|murder\w*|hell|damn\w*|sex\w*|drunk\w*|beer|wine|whisk(e)?y|gun\w*|war|stupid|idiot|hate[ds]?|ruined)\b/i;
  const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const good = (d) => !AVOID.test(d.def) && !/^\(/.test(d.def);

  /** Turn the dictionary's answer into { found, phonetic, audio, meanings:[{pos, def, sentences}], alts:[{pos, def, ex}] }. */
  function parseEntries(data) {
    const out = { found: false, phonetic: '', audio: '', meanings: [], alts: [] };
    if (!Array.isArray(data) || !data.length) return out;
    out.found = true;
    for (const e of data) {
      if (!out.phonetic && e.phonetic) out.phonetic = e.phonetic;
      for (const ph of e.phonetics || []) {
        if (!out.phonetic && ph.text) out.phonetic = ph.text;
        // prefer the American recording, otherwise take any
        if (ph.audio && (!out.audio || (/-us\.mp3$/.test(ph.audio) && !/-us\.mp3$/.test(out.audio)))) out.audio = ph.audio;
      }
    }
    const byPos = {}, order = [];
    data.forEach((e, ei) => (e.meanings || []).forEach((m) => {
      const pos = m.partOfSpeech || 'word';
      if (!byPos[pos]) { byPos[pos] = []; order.push(pos); }
      (m.definitions || []).forEach((d) => { const def = clean(d.definition); if (def) byPos[pos].push({ pos, def, ex: clean(d.example), entry: ei }); });
    }));
    const all = order.flatMap((p) => byPos[p]);
    // only keep examples that read like real sentences ("She received…", not "to receive a lodger…")
    all.forEach((d) => { const n = d.ex.split(' ').length; if (d.ex && (!/^["“'‘A-Z]/.test(d.ex) || n < 4 || n > 25 || EX_AVOID.test(d.ex))) d.ex = ''; });
    out.alts = all.filter(good).concat(all.filter((d) => !good(d))).slice(0, 15).map((d) => ({ pos: d.pos, def: d.def, ex: d.ex }));
    // rank parts of speech: kid-friendly definitions, then example sentences, then the first (main) entry
    const score = (p) => { const g = byPos[p].filter(good); return g.length + 3 * g.filter((d) => d.ex).length + (byPos[p][0].entry === 0 ? 2 : 0); };
    const ranked = order.filter((p) => byPos[p].some(good)).sort((a, b) => score(b) - score(a));
    ranked.forEach((pos, i) => {
      if (out.meanings.length >= 2) return;
      const ds = byPos[pos].filter(good);
      // the main (first) meaning; if it has no example, a near-top meaning that does
      const main = ds[0].ex ? ds[0] : ds.slice(1, 3).find((d) => d.ex && d.entry === ds[0].entry) || ds[0];
      if (i > 0 && !main.ex) return; // a 2nd part of speech is only worth showing with a sentence
      out.meanings.push({ pos, def: main.def, sentences: main.ex ? [main.ex] : [] });
      // one part of speech only? add a second meaning of it if that has its own sentence
      if (ranked.length === 1) {
        const second = ds.find((d) => d !== main && d.ex && d.entry === main.entry);
        if (second) out.meanings.push({ pos, def: second.def, sentences: [second.ex] });
      }
    });
    if (!out.meanings.length && all.length) out.meanings.push({ pos: all[0].pos, def: all[0].def, sentences: all[0].ex ? [all[0].ex] : [] });
    return out;
  }

  /** Look a word up online. Resolves to parseEntries() output plus status: 'ok' | 'notfound' | 'offline'. */
  async function lookup(word) {
    const w = clean(word).toLowerCase();
    try {
      const res = await fetch(API + encodeURIComponent(w));
      if (res.status === 404) return Object.assign(parseEntries(null), { status: 'notfound' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return Object.assign(parseEntries(await res.json()), { status: 'ok' });
    } catch (e) {
      return Object.assign(parseEntries(null), { status: 'offline' });
    }
  }

  // ---------------- speech ----------------
  const settings = () => (WW.settings ? WW.settings() : { rate: 1, voice: '' });
  function voices() { try { return (window.speechSynthesis && speechSynthesis.getVoices()) || []; } catch (e) { return []; } }
  function englishVoices() { return voices().filter((v) => /^en/i.test(v.lang)); }
  function pickVoice() {
    const want = settings().voice, list = englishVoices();
    return list.find((v) => v.voiceURI === want) || list.find((v) => /en-US/i.test(v.lang) && /samantha|google us|aria|jenny|allison|ava/i.test(v.name)) || list.find((v) => /en-US/i.test(v.lang)) || list[0] || null;
  }
  let speakToken = 0;
  function stop() { speakToken++; try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) { /* none */ } if (current) { try { current.pause(); } catch (e) { /* none */ } current = null; } }
  function speak(text, rate = 1) {
    return new Promise((resolve) => {
      try {
        if (!window.speechSynthesis) return resolve();
        const u = new SpeechSynthesisUtterance(text);
        const v = pickVoice(); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-US';
        u.rate = Math.max(0.4, Math.min(1.6, rate * (settings().rate || 1)));
        u.onend = () => resolve(); u.onerror = () => resolve();
        speechSynthesis.speak(u);
        setTimeout(resolve, 2500 + text.length * 120); // never hang if the browser drops the 'end' event
      } catch (e) { resolve(); }
    });
  }
  let current = null;
  function playAudio(url, slow) {
    return new Promise((resolve, reject) => {
      try {
        const a = new Audio(url);
        current = a;
        a.playbackRate = slow ? 0.7 : 1;
        if ('preservesPitch' in a) a.preservesPitch = true;
        a.onended = () => resolve(); a.onerror = () => reject(new Error('audio'));
        a.play().catch(reject);
        setTimeout(resolve, 6000);
      } catch (e) { reject(e); }
    });
  }
  /** Say a word: the real recording if there is one, otherwise the built-in voice. */
  async function sayWord(w, slow) {
    if (w.audio && navigator.onLine !== false) { try { await playAudio(w.audio, slow); return; } catch (e) { /* fall back */ } }
    await speak(w.word, slow ? 0.55 : 0.85);
  }
  const firstSentence = (w) => { for (const m of w.meanings || []) for (const s of m.sentences || []) if (s.trim()) return s; return ''; };
  /** Teacher-style test prompt: word … sentence … word. */
  async function sayDictation(w, number) {
    stop();
    const token = speakToken;
    if (number) await speak('Number ' + number + '.', 1);
    if (token !== speakToken) return;
    await sayWord(w);
    if (token !== speakToken) return;
    const s = firstSentence(w);
    if (s) { await speak(s, 0.9); if (token !== speakToken) return; await sayWord(w); }
  }
  function spellAloud(w) { stop(); return speak(w.word.split('').map((c) => (c === ' ' ? 'space' : c === "'" ? 'apostrophe' : c === '-' ? 'dash' : c)).join(', '), 0.7); }

  WW.dict = { parseEntries, lookup, API };
  WW.speech = { speak, sayWord, sayDictation, spellAloud, stop, englishVoices, firstSentence };
})();
