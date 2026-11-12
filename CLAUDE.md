# Educational Games

Browser-based learning games for children, from preschool to grade 8. Plain HTML, CSS and JavaScript. There is no build step and nothing to install: each game runs by opening its `index.html`.

## Working with me

- I am not a programmer. Explain what you changed in plain English, and tell me how to try it on an iPad.
- Ask before changing how a game works for the child (rules, rewards, difficulty). I decide what the children should learn and how.

## Rules that must not be broken

- **This repository is public.** Never add children's names, photos, school names or any other personal information, including in examples, tests and commit messages.
- **Never break a saved game.** Children's progress lives in the browser. If the saved format has to change, move old saves over automatically. Never wipe or rename a save key without asking me.
- **Every answer the game marks right or wrong must be correct.** For math, check generated questions with the tests. Do not ship a question type without a check.
- **Content must suit the age group.** Definitions, example sentences and feedback are read by children. Feedback is encouraging, never harsh.
- **Keep it installation-free.** No frameworks, package managers or build tools. A game folder must work when opened directly or served from GitHub Pages.

## Layout

One folder per game, each with its own `index.html` and `README.md`:

- `math-quest/`: Math Quest: Rainbow Realms, math for grades 4 to 8
- `word-wizards/`: Word Wizards, weekly spelling practice for grades 2 to 8
- `unicorn-letters/`: Unicorn Letter Land, letters and sounds for preschoolers, one self-contained file

The root `README.md` has a table of every game. Add a row when adding a game.

## Things that are easy to get wrong

- Math Quest and Word Wizards share player profiles and gems through the browser save key `mathquest.v1`. A change to the profile format affects both games.
- Word Wizards takes its themes from `../math-quest/style.css`, so the two folders must stay side by side.
- The main device is an iPad in Safari. Everything must work by touch, and typing games use the game's own on-screen keyboard so autocorrect cannot give answers away.
- Sound matters: several games speak. Check spoken prompts after changing them, since the device voice can mispronounce single letters.

## Checking a change

Run the tests for the game you changed:

```bash
node math-quest/tests/check-questions.js
```

```bash
node word-wizards/tests/check.js
```

Unicorn Letter Land has no automated tests. Open it in a browser, play one round of the game you changed, and confirm there are no console errors.

For any change to a screen, also open the game at iPad size and tap through it.

When a game's behavior changes, update that game's `README.md` in the same change.
