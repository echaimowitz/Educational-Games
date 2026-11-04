# 🌈 Math Quest: Rainbow Realms

A math adventure for grades 4–8. The Rainbow Crown has shattered, and its seven colors are scattered across five realms. Kids complete math missions and defeat a boss in each realm to restore the rainbow.

## How to play

Open `index.html` in any web browser (double-click it). Nothing needs to be installed. It works on tablets, phones, laptops and desktops, with an on-screen keypad for touch and full keyboard support.

To play on an iPad or share a link, host it free with **GitHub Pages**: in the repo go to *Settings → Pages*, choose the branch and `/ (root)`, and the game will be at `https://<your-username>.github.io/Educational-Games/math-quest/`.

## The worlds

| Grade | World | Guide | Missions | Boss |
|---|---|---|---|---|
| 4 | 🐠 Rainbow Reef | Coral the Clownfish | Rounding & place value · Multi-digit multiplication · Division with remainders · Fractions · Word problems (area, perimeter, multi-step) | 🐙 Grumpy Kraken |
| 5 | 🦄 Unicorn Meadows | Sparkle the Unicorn | Decimals · Adding/subtracting unlike fractions · Multiplying/dividing fractions · Order of operations · Word problems (volume, money) | ⛈️ Thundercloud Troll |
| 6 | 👑 Enchanted Castle | Princess Lumi | Ratios & rates · Percents · Dividing fractions · Equations, exponents, GCF/LCM · Word problems | 🧙‍♀️ Wicked Sorceress |
| 7 | 🥋 Karate Dojo | Sensei Koa | Integers · Two-step equations · Proportions, tax, discounts, percent change · Probability, circles, angles · Word problems | 🥷 Shadow Ninja |
| 8 | 🌟 Starlight Kingdom | Nova the Star Fairy | Multi-step equations · Slope & linear functions · Exponents & scientific notation · Pythagorean theorem & roots · Word problems (systems, cylinders) | 🐉 Rainbow Dragon |

## What makes it challenging

- **Adaptive levels:** 🌱 Warm-up → 🔥 Tricky → ⚡ Expert. Three correct answers in a row raise the level, and two misses in a row lower it. The level is saved for each skill.
- **Stars:** ★ = 5/8 correct, ★★ = 7/8, ★★★ = 7/8 *and* reaching Expert.
- **Bosses:** questions mix every skill in the world, each answer is timed, and the player has 3 hearts. The boss unlocks once every mission in the world has at least one star. Beating it unlocks the next world.
- **Hints** cost 2 💎. Every answer comes with a step-by-step explanation.
- **Rewards:** gems (harder levels earn more), a treasure for each mission, an avatar shop and 11 badges.

## For grown-ups

The ⚙️ *For Grown-ups* button on the player screen lets you:

- turn sound on or off
- set the boss timer to normal, relaxed (2×) or off
- unlock all worlds for a player
- see each player's accuracy and delete a profile

Each player picks their grade when the profile is created. That world and every lower world start unlocked.

Progress is saved in the browser (`localStorage`) on each device.

## Files

- `index.html`, `style.css`: page and themes
- `js/questions.js`: question generators for every topic and level, plus answer checking (accepts fractions, mixed numbers, decimals, negatives)
- `js/worlds.js`: worlds, missions, story and bosses
- `js/game.js`: screens, profiles, missions, bosses, shop and badges
- `tests/check-questions.js`: run `node math-quest/tests/check-questions.js` to generate thousands of questions and verify each one's answer is accepted
