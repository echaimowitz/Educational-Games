# 🌈 Math Quest: Rainbow Realms

A math adventure for grades 4–8. The Rainbow Crown has shattered, and its seven colors are scattered across five realms. Kids complete math missions and defeat a boss in each realm to restore the rainbow. There are also four bonus worlds, a daily challenge and a two-player race mode.

## How to play

Open `index.html` in any web browser (double-click it). Nothing needs to be installed. It works on tablets, phones, laptops and desktops, with an on-screen keypad for touch and full keyboard support.

To play on an iPad or share a link, host it free with **GitHub Pages**: in the repo go to *Settings → Pages*, choose the branch and `/ (root)`, and the game will be at `https://<your-username>.github.io/Educational-Games/math-quest/`.

## Main worlds (one per grade, 11–12 missions each, plus a boss)

| Grade | World | Missions | Boss |
|---|---|---|---|
| 4 | 🐠 Rainbow Reef | Place value & rounding · Multi-digit multiplication · Division with remainders · Fractions · Word problems · Decimals (tenths/hundredths) · Angles · Factors, multiples & primes · Fraction × whole number · Multi-digit addition & subtraction · Mixed numbers · Symmetry & classifying shapes | 🐙 Grumpy Kraken |
| 5 | 🦄 Unicorn Meadows | Decimal operations · Adding/subtracting unlike fractions · Multiplying/dividing fractions · Order of operations · Word problems · Long division · Decimal place value & rounding · Coordinate plane & patterns · Fractions as division & scaling · Volume · Classifying shapes | ⛈️ Thundercloud Troll |
| 6 | 👑 Enchanted Castle | Ratios & rates · Percents · Dividing fractions · Equations, exponents, GCF/LCM · Word problems · Negative numbers & coordinate plane · Area, volume & surface area · Expressions & inequalities · Multi-digit decimals · Statistics (mean, median, IQR, MAD) · Equations with fractions & decimals · Polygons on the coordinate plane | 🧙‍♀️ Wicked Sorceress |
| 7 | 🥋 Karate Dojo | Integers · Two-step equations · Proportions & percents · Probability, circles, angles · Word problems · Rational numbers · Inequalities · Scale drawings & prisms · Angle equations · Interest, markup & commission · Sampling & predictions | 🥷 Shadow Ninja |
| 8 | 🌟 Starlight Kingdom | Multi-step equations · Slope & linear functions · Exponents & scientific notation · Pythagorean theorem · Word problems · Systems of equations · Volume (cylinders, cones, spheres) · Transformations · Functions · Rational & irrational numbers · Parallel lines & exterior angles | 🐉 Rainbow Dragon |

## Bonus worlds (always open, matched to the player's grade)

| World | Missions | Boss |
|---|---|---|
| 🧜‍♀️ Mermaid Lagoon | Unit conversions · Elapsed time / distance-rate-time · Mixed units / best buys | 🦈 Captain Chomp |
| 🐶 Puppy Park | Mean · Median, mode & range · Probability & predictions | 😼 Sneaky Cat Burglar |
| 🚀 Space Station | Patterns & sequences · Input/output tables · Missing numbers / expressions | 👾 Glitch Invader |
| 🦖 Dino Valley | ⏱️ Speed facts · Fractions/decimals/percents · ⏱️ Estimation | 🌋 Mount Kaboom |

## Competition modes

- **📅 Daily Challenge:** 12 new questions every day at the player's grade, from warm-up to expert, including 2 from the bonus worlds. Everyone in the same grade gets the same questions. There are no hints, and the clock pauses while feedback is shown. The first try counts on the **family scoreboard**, ranked by correct answers and then by time. Daily streaks earn bonus gems.
- **🏁 Race Mode:** two players race on one screen, side by side, or stacked on a phone. Each player answers at their own grade, so a 4th grader and a 6th grader can race fairly. A wrong answer freezes the player for 3 seconds and shows the right answer. The first to 5, 10 or 15 correct wins. A head-to-head record is kept between players.

## What makes it challenging

- **Adaptive levels:** 🌱 Warm-up → 🔥 Tricky → ⚡ Expert. Three correct answers in a row raise the level, and two misses in a row lower it. The level is saved for each skill.
- **Missions** have 10 questions. **Stars:** ★ = 6/10 correct, ★★ = 8/10, ★★★ = 8/10 *and* reaching Expert.
- **Bosses** take 12 hits to defeat. Their questions mix every skill in the world, each answer is timed, and the player has 3 hearts. Beating a main boss unlocks the next world.
- **Hints** cost 2 💎, and every answer comes with a step-by-step explanation.
- **Rewards:** gems, treasures, an avatar shop and 18 badges.

## For grown-ups

The ⚙️ *For Grown-ups* button on the player screen lets you:

- turn sound on or off
- set the timers to normal, relaxed (2×) or off
- change a player's grade
- unlock all worlds for a player
- see each player's accuracy, daily-challenge count and race record
- delete a profile

### Saving & backups

- Progress saves **automatically** after every answer and whenever the app is closed or switched away from. There is also a **💾 Save** button on every screen.
- An **unfinished mission, boss battle or daily challenge** is remembered. Reopen the game and tap **Continue ▶** on the map.
- Saves live in the browser on each device. Browsers can occasionally clear website data, and on iPad/iPhone a Home Screen icon keeps separate saves from a Safari tab. Grown-ups can protect progress in **⚙️ For Grown-ups → Saving & backups**:
  - **Download backup file** or **Copy save code** (paste it into Notes or a message).
  - **Restore from file** or **Paste save code** on any device. Players in the backup replace the same players, and other players are kept.
- If a browser can't save at all (for example, with Private Browsing on), a red warning bar appears.

## Files

- `index.html`, `style.css`: page and themes
- `js/questions.js`: question generators for every topic and level, plus answer checking (accepts fractions, mixed numbers, decimals, negatives). Bonus-world generators also take the player's grade.
- `js/worlds.js`: worlds, missions, story and bosses
- `js/game.js`: screens, profiles, missions, bosses, daily challenge, race mode, shop and badges
- `tests/check-questions.js`: run `node math-quest/tests/check-questions.js` to generate about 140,000 questions and confirm each is well-formed and its answer is accepted
- `tests/oracle.js`: run `node math-quest/tests/oracle.js` for an **independent math check**. It reads each question as the kid sees it, recomputes the answer from scratch (evaluating expressions, plugging solutions back into equations, rounding by digits, checking factors, inequalities, systems, transformations, angle equations, statistics, functions and more), and compares it with the answer key. Word problems and data questions are checked by hand.
