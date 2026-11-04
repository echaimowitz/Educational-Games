/* Math Quest: Rainbow Realms — worlds, missions and story. One world per grade. */
(function () {
  'use strict';
  const MQ = (window.MQ = window.MQ || {});

  MQ.STORY = 'The Rainbow Crown has shattered! Its seven colors are scattered across five magical realms, each guarded by a boss. Solve math missions to win back every color and restore the rainbow.';

  MQ.WORLDS = [
    {
      id: 'reef', grade: 4, name: 'Rainbow Reef', emoji: '🐠', theme: 'theme-reef', deco: ['🫧', '🐟', '🐚', '🌊', '🐠', '🪸'],
      guide: { name: 'Coral the Clownfish', emoji: '🐠' },
      intro: 'Welcome to Rainbow Reef! The red color of the rainbow sank deep under the sea. Help me and my fish friends get it back!',
      colors: [0], baseTime: 45,
      cheers: ['Fin-tastic!', 'You\'re o-fish-ally awesome!', 'Shell-ebrate!', 'Splash-tacular!', 'Totally reef-ic!'],
      boss: { name: 'The Grumpy Kraken', emoji: '🐙', intro: 'Nobody gets past my eight tentacles! Answer before the timer runs out… if you can!', win: 'The Kraken giggles, gives you a big squishy hug, and hands back the RED stripe of the rainbow!', lose: 'The Kraken squirts ink and swims away. Practice your missions and try again!' },
      missions: [
        { topic: 'g4_round', name: 'Coral Castle Count', skill: 'Place value & rounding', story: 'The coral builders need rounded numbers to plan their castles. Help them round!', treasure: '🐚', treasureName: 'Rainbow Shell' },
        { topic: 'g4_mult', name: 'Clownfish Parade', skill: 'Multi-digit multiplication', story: 'Clownfish are lining up in rows for the big parade. Multiply to count them all!', treasure: '⭐', treasureName: 'Sea Star' },
        { topic: 'g4_div', name: 'Seahorse Sharing', skill: 'Division with remainders', story: 'The seahorses want to share their sea-snacks fairly. Divide them up — what\'s left over?', treasure: '🦪', treasureName: 'Pearl Oyster' },
        { topic: 'g4_frac', name: 'Jellyfish Fractions', skill: 'Equivalent & comparing fractions', story: 'The glowing jellyfish split their light into fractions. Match and compare them!', treasure: '🐡', treasureName: 'Puffer Pal' },
        { topic: 'g4_word', name: 'Sunken Ship Treasure', skill: 'Word problems: area, perimeter & multi-step', story: 'A sunken ship is full of puzzles! Solve them to unlock the treasure chest.', treasure: '🔱', treasureName: 'Golden Trident' },
      ],
    },
    {
      id: 'meadow', grade: 5, name: 'Unicorn Meadows', emoji: '🦄', theme: 'theme-unicorn', deco: ['🌸', '🦋', '🌼', '✨', '🌈', '🍀'],
      guide: { name: 'Sparkle the Unicorn', emoji: '🦄' },
      intro: 'Neigh-ce to meet you! A storm blew the ORANGE and YELLOW stripes away from our meadow. Let\'s gallop through these missions together!',
      colors: [1, 2], baseTime: 50,
      cheers: ['Uni-credible!', 'Magical!', 'Sparkle-riffic!', 'Horn-some!', 'Rainbow-tastic!'],
      boss: { name: 'The Thundercloud Troll', emoji: '⛈️', intro: 'BOOM! I\'m keeping these sunny colors for myself! Beat my lightning-fast questions!', win: 'The Troll\'s storm clears into sunshine — the ORANGE and YELLOW stripes are free!', lose: 'Thunder rumbles and the Troll floats off. Train in the meadow and come back!' },
      missions: [
        { topic: 'g5_dec', name: 'Decimal Daisies', skill: 'Decimal operations', story: 'Each daisy petal holds a decimal. Add, subtract, multiply and divide to make them bloom!', treasure: '🌼', treasureName: 'Golden Daisy' },
        { topic: 'g5_fadd', name: 'Fraction Fields', skill: 'Adding & subtracting unlike fractions', story: 'The fields are cut into pieces of different sizes. Combine them with common denominators!', treasure: '🍀', treasureName: 'Lucky Clover' },
        { topic: 'g5_fmul', name: 'Butterfly Garden', skill: 'Multiplying & dividing fractions', story: 'The butterflies flutter in fractional groups. Multiply and divide to count them!', treasure: '🦋', treasureName: 'Butterfly Wings' },
        { topic: 'g5_ops', name: 'Order of the Horn', skill: 'Order of operations', story: 'Unicorn magic only works if you follow the right ORDER. Parentheses, exponents, multiply, divide, add, subtract!', treasure: '✨', treasureName: 'Sparkle Dust' },
        { topic: 'g5_word', name: 'Unicorn Market', skill: 'Word problems: volume, money & fractions', story: 'The unicorn market is busy today! Help the shopkeepers solve their tricky problems.', treasure: '🍎', treasureName: 'Golden Apple' },
      ],
    },
    {
      id: 'castle', grade: 6, name: 'Enchanted Castle', emoji: '👑', theme: 'theme-castle', deco: ['👑', '🏰', '💎', '🌹', '✨', '🦢'],
      guide: { name: 'Princess Lumi', emoji: '👸' },
      intro: 'Greetings, brave mathematician! A wicked sorceress locked the GREEN stripe in her tower. Only royal-level math can break her spells!',
      colors: [3], baseTime: 50,
      cheers: ['Royally correct!', 'Your Majesty is brilliant!', 'Crown-worthy!', 'A-mazing grace!', 'Fit for a queen!'],
      boss: { name: 'The Wicked Sorceress', emoji: '🧙‍♀️', intro: 'Mwa-ha-ha! My spells are unbreakable! Answer quickly or be turned into a frog!', win: 'Her wand fizzles into flower petals. The GREEN stripe floats free from the tower!', lose: 'Poof! The Sorceress vanishes in purple smoke. Study your spellbook and try again!' },
      missions: [
        { topic: 'g6_ratio', name: 'Royal Recipes', skill: 'Ratios & unit rates', story: 'The royal bakers need the perfect ratios for the princess\'s cake. Don\'t let it flop!', treasure: '🧁', treasureName: 'Royal Cupcake' },
        { topic: 'g6_pct', name: 'Ballroom Percents', skill: 'Percents', story: 'Everyone at the ball is counting percents. How much of the ballroom is dancing?', treasure: '👗', treasureName: 'Starlight Gown' },
        { topic: 'g6_fdiv', name: 'Glass Slipper Fractions', skill: 'Dividing fractions', story: 'The magic slippers come in fraction sizes. Divide them to find the perfect fit!', treasure: '👠', treasureName: 'Glass Slipper' },
        { topic: 'g6_eq', name: 'Spellbook Equations', skill: 'Equations, exponents, GCF & LCM', story: 'The castle spellbook is full of equations. Solve for x to break the locks!', treasure: '📜', treasureName: 'Magic Scroll' },
        { topic: 'g6_word', name: 'The Royal Ball', skill: 'Word problems: rates, discounts & area', story: 'The Royal Ball is tonight, and everything needs to be planned perfectly!', treasure: '💍', treasureName: 'Royal Ring' },
      ],
    },
    {
      id: 'dojo', grade: 7, name: 'Karate Dojo', emoji: '🥋', theme: 'theme-dojo', deco: ['🥋', '🎋', '🏮', '🌸', '⛩️', '🐉'],
      guide: { name: 'Sensei Koa', emoji: '🥋' },
      intro: 'Hai! Welcome to the mountain dojo. A shadow ninja stole the BLUE stripe. Earn your belts with sharp, focused math!',
      colors: [4], baseTime: 55,
      cheers: ['HI-YAH!', 'Black-belt brain!', 'Perfect form!', 'Kicking it!', 'Sensei is proud!'],
      boss: { name: 'The Shadow Ninja', emoji: '🥷', intro: 'You cannot see me… and you cannot beat my speed! Show me your focus!', win: 'The Ninja bows with respect and returns the BLUE stripe. "You are a true master."', lose: 'The Ninja vanishes in a puff of smoke. Keep training, young one!' },
      missions: [
        { topic: 'g7_int', name: 'Integer Kata', skill: 'Adding, subtracting, multiplying & dividing integers', story: 'A kata is a pattern of moves. Master the pattern of positive and negative numbers!', treasure: '🟨', treasureName: 'Yellow Belt' },
        { topic: 'g7_eq', name: 'Two-Step Sparring', skill: 'Two-step & multi-step equations', story: 'Every equation is a sparring partner. Undo each move in the right order to win!', treasure: '🟩', treasureName: 'Green Belt' },
        { topic: 'g7_pct', name: 'Proportion Power', skill: 'Proportions, tax, discounts & percent change', story: 'Balance is everything in karate — and in proportions! Keep both sides equal.', treasure: '🟦', treasureName: 'Blue Belt' },
        { topic: 'g7_geo', name: 'Circle of Chance', skill: 'Probability, circles & angles', story: 'The training ring is a circle and the tournament draw is left to chance!', treasure: '🟫', treasureName: 'Brown Belt' },
        { topic: 'g7_word', name: 'Board-Breaking Challenge', skill: 'Word problems: rates, integers & equations', story: 'Break through the toughest word problems like a stack of boards!', treasure: '⬛', treasureName: 'Black Belt' },
      ],
    },
    {
      id: 'star', grade: 8, name: 'Starlight Kingdom', emoji: '🌟', theme: 'theme-star', deco: ['⭐', '🌙', '✨', '🪐', '☄️', '🌟'],
      guide: { name: 'Nova the Star Fairy', emoji: '🧚' },
      intro: 'You made it to the Starlight Kingdom, where all the realms meet! The Rainbow Dragon guards the last two colors, INDIGO and VIOLET. This is the ultimate quest!',
      colors: [5, 6], baseTime: 60,
      cheers: ['Stellar!', 'Out of this world!', 'Cosmic!', 'You\'re a superstar!', 'Galaxy brain!'],
      boss: { name: 'The Rainbow Dragon', emoji: '🐉', intro: 'ROAR! I swallowed the last colors of the rainbow! Only the greatest mathematician in all five realms can defeat me!', win: 'The dragon hiccups out INDIGO and VIOLET! The Rainbow Crown shines again — you are the champion of all five realms!', lose: 'The dragon flies off into the stars. Sharpen your skills and challenge it again!' },
      missions: [
        { topic: 'g8_eq', name: 'Comet Equations', skill: 'Multi-step equations & number of solutions', story: 'Comets zoom on both sides of the equals sign. Collect the x\'s and solve!', treasure: '☄️', treasureName: 'Comet Tail' },
        { topic: 'g8_lin', name: 'Slope Slides', skill: 'Slope & linear functions', story: 'The moonbeam slides go up and down at different slopes. Measure them!', treasure: '🌙', treasureName: 'Moon Charm' },
        { topic: 'g8_exp', name: 'Exponent Galaxy', skill: 'Exponent rules & scientific notation', story: 'The galaxy is HUGE and atoms are TINY. Scientific notation handles both!', treasure: '🪐', treasureName: 'Ringed Planet' },
        { topic: 'g8_pyth', name: 'Pythagoras Peaks', skill: 'Pythagorean theorem & roots', story: 'Climb the crystal peaks using right triangles and square roots!', treasure: '💠', treasureName: 'Crystal Prism' },
        { topic: 'g8_word', name: 'The Grand Quest', skill: 'Word problems: systems, functions & geometry', story: 'Friends from every realm need your help — unicorns, princesses, ninjas and dragons!', treasure: '🏆', treasureName: 'Champion Trophy' },
      ],
    },
  ];
})();
