# 🧙‍♀️ Word Wizards

A weekly spelling practice app with the same worlds and themes as [Math Quest](../math-quest/). Each child enters her weekly spelling words, and the app turns them into games.

## How to use it

1. Open `index.html` (or the GitHub Pages link: `.../Educational-Games/word-wizards/`).
2. Pick a player. Players are **shared with Math Quest**, and so are 💎 gems, which can be spent in Math Quest's avatar shop. New players can be created here too.
3. Pick a world (theme). It can be changed any time with 🎨 World.
4. Tap **✏️ Add this week's words**, then paste or type the list, one word per line (commas work too). Put a `*` before a ⭐ challenge word (`*necessary`).
5. Tap **✨ Look up words.** Each word is looked up in the free dictionary at [dictionaryapi.dev](https://dictionaryapi.dev):
   - pronunciation, plus a real recording when available
   - one or two meanings, chosen to skip specialist, slang and old-fashioned senses
   - example sentences, keeping only ones that read like real, kid-appropriate sentences
6. Check the words. Reword definitions in kid-friendly language, add or remove sentences (one per meaning is ideal), add meanings, or pick **📚 Other meanings from the dictionary**. Yellow cards still need a definition or sentence. Then **💾 Save**.

Either a grown-up or the child can edit the list. **🗓️ Start a new week** clears the old words and progress.

## Hearing words

Every game has 🔊 **Say it** (the real recording, or the device voice), 🐢 **Slowly**, 🗣️ **In a sentence** and 📖 **Meaning**. Typing games use the teacher's test style: word → sentence → word. Speed and voice can be changed in ⚙️ For Grown-ups.

## Games

| Game | How it works | Answer by |
|---|---|---|
| 🎧 Hear & Type | Hear the word and sentence, then type it. A mistake shows which letters were wrong; type it correctly once to "lock it in", and the word comes back later. | Typing |
| ✍️ Write It | Write on the screen with a finger or Apple Pencil (on handwriting lines), then compare with the real spelling and self-check. A missed word is traced once, then comes back. | Handwriting |
| 👀 Look · Cover · Write · Check | The classic teacher method: study the word, cover it, write or type it from memory, check. | Write or type |
| 🧩 Letter Puzzles | Alternates between unscrambling letter tiles and filling in the missing letters. The tricky parts (silent letters, double letters, vowels) are blanked first. | Tap |
| 🐝 Spelling Bee Battle | Your world's boss, 3 hearts, and a timer (30 s, 60 s or off). Each correct spelling is a hit. | Typing |
| 📝 Test Day | Like the Friday test: every word in random order with no help, then a scored review. In writing mode, she marks each handwritten word against the correct spelling. | Write or type |
| 🔍 Word Search | Find every word (across, down, diagonal) by tapping the first and last letter. Each found word is spoken with its meaning. | Tap |
| 🃏 Memory Match | Match each word card to its meaning card, 6 pairs per round. | Tap |

**Test-ready stars:** a word gets ⭐ for each correct spelling in a row from memory (Hear & Type, Write It, Look-Cover-Write-Check, Spelling Bee, Test Day). After 3 in a row it's **test-ready**, and one miss resets it. Games show the least-known words first.

Typing games use the app's **own keyboard**, so the iPad's autocorrect and word suggestions can't give the answer away. A physical keyboard works too.

## Saving

- **Each player's words are saved in her player profile**, together with her gems. They stay until someone taps **🗓️ Start a new week** (or deletes the player).
- The editor **saves as you type**. Leaving it any way (Back, closing the app) keeps the changes, and a half-typed list is kept too.
- Progress (test-ready stars, badges) is saved after every answer.
- Profiles are stored in this browser (`mathquest.v1`, shared with Math Quest). If both apps are open in different tabs, they keep each other up to date. Word Wizards' own save (`wordwizards.v1`) only holds voice, speed, sound and timer settings.
- **Backups:** ⚙️ For Grown-ups → 💾 Backups can download a backup file or copy a save code with all players, gems and words. It restores in Word Wizards or Math Quest (Math Quest's backups include the words too). Use one if the browser ever clears its data, or to move to another device.
- Older saves, from before words were stored in profiles, move over automatically.

## Files

- `index.html`, `ww.css`: page and styles (themes come from `../math-quest/style.css`)
- `js/dict.js`: dictionary lookup and meaning selection, plus speech
- `js/app.js`: players, themes, word editor, My Words, settings
- `js/games.js`: the eight games
- `tests/check.js`: run `node word-wizards/tests/check.js` (dictionary parsing on saved real responses, word-search building, puzzles, answer checking)
