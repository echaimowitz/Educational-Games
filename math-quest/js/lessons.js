/* Math Quest: Rainbow Realms — introductory lessons, one per topic.
 * Each lesson: big (the big idea), words (key vocabulary), steps (how to do it), tip (watch out!).
 * A worked example and practice questions are generated automatically from the topic's own
 * question generator, so every lesson always matches the questions in its mission.
 * Bonus-world topics adapt to the player's grade: { lo: lesson for Gr 4–5, hi: lesson for Gr 6–8 }.
 */
(function () {
  'use strict';
  const MQ = (window.MQ = window.MQ || {});

  MQ.LESSONS = {
    // ======================= GRADE 4 =======================
    g4_round: {
      big: "Every digit in a number has a <b>place</b>, and its place tells you what it is worth. In 4,382 the 4 is worth 4,000, but in 482 the 4 is only worth 400! <b>Rounding</b> means finding the nearest “friendly” number, like the nearest ten or hundred, to make a number easier to think about.",
      words: [["Place value", "What a digit is worth because of where it sits (ones, tens, hundreds, thousands…)."], ["Rounding", "Changing a number to the closest ten, hundred, thousand… that's easier to use."]],
      steps: ["<b>Place value:</b> count places from the right: ones, tens, hundreds, thousands, ten-thousands… The digit is worth digit × place. In 52,<u>7</u>31 the 7 is in the hundreds place, so it's worth 700.", "<b>Rounding:</b> find the digit in the place you're rounding to.", "Look at the digit just to its <b>right</b>.", "5 or more → round <b>up</b> (add one to your digit). 4 or less → keep it the same.", "Every digit after it becomes 0. Example: 3,<b>6</b>72 to the nearest hundred → look at the 7 → round up → 3,700."],
      tip: "Place-value and rounding questions look alike! Read carefully: “worth how much” is place value, “round to” is rounding.",
    },
    g4_mult: {
      big: "Multiplying a big number is just lots of small multiplications added together. We <b>break the number apart</b> by place value, multiply each part, then add.",
      words: [["Product", "The answer to a multiplication."], ["Partial products", "The smaller answers you add together to get the full product."]],
      steps: ["Break the bigger number into parts: 234 = 200 + 30 + 4.", "Multiply each part: 200 × 6 = 1,200, 30 × 6 = 180, 4 × 6 = 24.", "Add the parts: 1,200 + 180 + 24 = 1,404.", "For 2-digit × 2-digit (like 47 × 23), split 23 into 20 + 3: 47 × 20 = 940, 47 × 3 = 141, then 940 + 141 = 1,081."],
      tip: "Estimate first! 47 × 23 is about 50 × 20 = 1,000, so an answer like 10,810 must be wrong.",
    },
    g4_div: {
      big: "Dividing means sharing into equal groups. Sometimes things don't share out perfectly, and the leftover is called the <b>remainder</b>.",
      words: [["Quotient", "How many in each group (the answer)."], ["Remainder (R)", "What's left over. It must be smaller than the number you divide by."]],
      steps: ["Ask: how many times does the divisor fit? For 87 ÷ 4, think 4 × 20 = 80.", "Subtract: 87 − 80 = 7. Can 4 fit into 7 again? Yes, once more (4 × 1 = 4), leaving 3.", "Add up the groups: 20 + 1 = 21. The leftover is 3.", "Answer: 21 R 3. Check: 4 × 21 + 3 = 87 ✔"],
      tip: "If your remainder is as big as the divisor (or bigger), another group fits. Make the quotient one bigger!",
    },
    g4_frac: {
      big: "A fraction is part of a whole. The bottom number (<b>denominator</b>) tells how many equal pieces the whole is cut into, and the top (<b>numerator</b>) tells how many pieces you have.",
      words: [["Equivalent fractions", "Different fractions that are the same amount, like 1/2 and 2/4."], ["Like denominators", "Fractions with the same bottom number."]],
      steps: ["<b>Equivalent fractions:</b> multiply (or divide) the top AND bottom by the same number: 2/3 = (2×4)/(3×4) = 8/12.", "<b>Adding with the same denominator:</b> add the tops, keep the bottom: 2/7 + 3/7 = 5/7.", "<b>Comparing:</b> rename both fractions so they have the same denominator, then compare the tops.", "<b>Improper fraction → mixed number:</b> 11/4 means 11 ÷ 4 = 2 R 3, which is 2 3/4."],
      tip: "When adding fractions, never add the denominators! 1/4 + 1/4 is 2/4, not 2/8.",
    },
    g4_word: {
      big: "Word problems are stories with math hiding inside. The trick is to figure out <b>what the question asks</b> and <b>which operation</b> (+ − × ÷) matches the story.",
      words: [["Area", "The space inside a shape: length × width (square units)."], ["Perimeter", "The distance all the way around: add all the sides."]],
      steps: ["Read the whole problem. What is the question asking for?", "Underline the numbers and what they mean.", "Pick the operation: “in all” / “altogether” → add or multiply; “left” / “how many more” → subtract; “each” / “share equally” → divide.", "Some problems need two steps, so solve one part, then use that answer.", "Ask: does my answer make sense?"],
      tip: "Area is “inside” (multiply), perimeter is “around the edge” (add). For a rectangle: perimeter = 2 × (length + width).",
    },
    g4_dec: {
      big: "Decimals are another way to write fractions with 10 or 100 on the bottom. The first place after the point is <b>tenths</b>, the second is <b>hundredths</b>.",
      words: [["Tenths", "One tenth = 1/10 = 0.1"], ["Hundredths", "One hundredth = 1/100 = 0.01"]],
      steps: ["7/10 = 0.7 (seven tenths).", "35/100 = 0.35 (thirty-five hundredths).", "To compare decimals, give them the same number of places: 0.4 = 0.40, so 0.40 is bigger than 0.38.", "Adding 3/10 + 45/100? Change 3/10 to 30/100, then 30/100 + 45/100 = 75/100."],
      tip: "More digits doesn't mean bigger! 0.5 is bigger than 0.45 because 0.50 > 0.45.",
    },
    g4_angle: {
      big: "An angle is how much something turns. We measure angles in <b>degrees (°)</b>. A full turn all the way around is 360°.",
      words: [["Right angle", "A square corner: exactly 90°."], ["Acute / Obtuse", "Acute is less than 90°; obtuse is between 90° and 180°."], ["Straight angle", "A straight line: 180°."]],
      steps: ["Quarter turn = 90°, half turn = 180°, three-quarter turn = 270°, full turn = 360°.", "Angles that sit together on a straight line add up to 180°: if one is 130°, the other is 50°.", "A right angle split in two: the parts add to 90°.", "Clock angles: each hour mark is 30° apart (360 ÷ 12). At 3:00 the hands are 3 × 30 = 90° apart."],
      tip: "Missing angle? Start with the total (90, 180 or 360) and subtract the angles you know.",
    },
    g4_factor: {
      big: "<b>Factors</b> are numbers you multiply to make a number. <b>Multiples</b> are what you get when you count by a number. Some numbers have just two factors. Those are called <b>prime</b>.",
      words: [["Factor", "Divides a number evenly. Factors of 12: 1, 2, 3, 4, 6, 12."], ["Multiple", "Skip-count: multiples of 4 are 4, 8, 12, 16…"], ["Prime / Composite", "Prime = exactly 2 factors (1 and itself). Composite = more than 2."]],
      steps: ["To find factors, list factor pairs: 1 × 18, 2 × 9, 3 × 6. So the factors of 18 are 1, 2, 3, 6, 9, 18.", "To check a multiple, divide: is 56 a multiple of 7? 56 ÷ 7 = 8 with no remainder, so yes!", "Prime check: try dividing by 2, 3, 5 and 7. If none work evenly (for numbers under 100), it's prime.", "Counting factors: count every number in your factor pairs (a pair like 6 × 6 counts once)."],
      tip: "1 is neither prime nor composite, and 2 is the only even prime number!",
    },
    g4_fracmul: {
      big: "Multiplying a whole number by a fraction means “that many groups of the fraction.” 3 × 1/4 is three quarter-pieces: 3/4!",
      words: [["Unit fraction", "A fraction with 1 on top, like 1/5."]],
      steps: ["Multiply the whole number by the <b>numerator</b> (top).", "Keep the <b>denominator</b> (bottom) the same.", "Example: 4 × 2/5 = 8/5.", "If the top is bigger than the bottom, you can change it to a mixed number: 8/5 = 1 3/5."],
      tip: "Don't multiply the bottom number! The size of each piece (fifths) stays the same, and you just have more pieces.",
    },
    g4_addsub: {
      big: "Big numbers are added and subtracted one place at a time, starting with the ones. When a column gets too big (or too small), we <b>regroup</b>.",
      words: [["Regroup (carry)", "Trade 10 ones for 1 ten, 10 tens for 1 hundred…"], ["Borrow", "Trade 1 ten for 10 ones (or 1 hundred for 10 tens) when subtracting."]],
      steps: ["Line up the numbers by place value (ones under ones).", "Adding: add each column from the right. If a column is 10 or more, write the ones digit and carry 1 to the next column.", "Subtracting: if the top digit is smaller, borrow from the next place to the left.", "Across zeros (like 5,004 − 1,286): borrow from the first nonzero digit. 5,004 becomes 4 thousands, 9 hundreds, 9 tens, 14 ones.", "Check subtraction by adding: answer + the number you subtracted = the starting number."],
      tip: "Estimate first so you can spot mistakes: 4,912 + 3,075 is about 5,000 + 3,000 = 8,000.",
    },
    g4_mixed: {
      big: "A <b>mixed number</b> has a whole number and a fraction, like 2 3/4 (two wholes and three quarters).",
      words: [["Mixed number", "A whole number plus a fraction: 3 1/2."], ["Improper fraction", "Top is bigger than the bottom: 7/2 (also 3 1/2)."]],
      steps: ["Adding: add the wholes, then add the fractions: 2 1/5 + 1 3/5 = 3 4/5.", "If the fractions add to a whole or more, trade: 4/4 = 1 whole. 1 3/4 + 2 2/4 = 3 5/4 = 4 1/4.", "Subtracting: subtract wholes and fractions separately: 5 4/6 − 2 1/6 = 3 3/6.", "Not enough to subtract? Trade 1 whole for fraction pieces: 4 1/5 = 3 6/5, then subtract."],
      tip: "Another way: change both mixed numbers to improper fractions first, then add or subtract the tops.",
    },
    g4_shapes: {
      big: "Shapes are named by their <b>sides</b> and <b>angles</b>. A <b>line of symmetry</b> is a fold line where both halves match perfectly.",
      words: [["Parallel", "Lines that never meet, like train tracks."], ["Equilateral / Isosceles / Scalene", "Triangles with 3 equal sides / 2 equal sides / no equal sides."], ["Quadrilateral", "Any shape with 4 sides."]],
      steps: ["Symmetry: imagine folding the shape. A square has 4 fold lines, a rectangle 2, an equilateral triangle 3.", "Triangles by angles: biggest angle under 90° → acute; exactly 90° → right; over 90° → obtuse.", "Square: 4 equal sides + 4 right angles. Rectangle: 4 right angles. Rhombus: 4 equal sides.", "Trapezoid: exactly one pair of parallel sides. Parallelogram: two pairs."],
      tip: "Regular shapes (all sides and angles equal) have as many lines of symmetry as they have sides!",
    },

    // ======================= GRADE 5 =======================
    g5_dec: {
      big: "Decimals work just like whole numbers. The decimal point simply shows where the ones end and the parts of one begin. The secret is <b>lining up the decimal points</b>.",
      words: [["Decimal point", "Separates whole numbers from tenths, hundredths…"], ["Power of 10", "10, 100, 1,000…"]],
      steps: ["Adding/subtracting: line up the points. Fill empty places with zeros: 6.4 − 2.75 → 6.40 − 2.75 = 3.65.", "× 10, 100, 1,000: move the point right 1, 2, 3 places (3.27 × 100 = 327).", "÷ 10, 100, 1,000: move the point left (45.6 ÷ 100 = 0.456).", "Multiplying decimals: multiply like whole numbers, then count total decimal places: 0.6 × 0.7 → 6 × 7 = 42 → 2 places → 0.42.", "Dividing by a whole number: divide normally, keep the point in the same spot: 8.4 ÷ 4 = 2.1."],
      tip: "Estimate: 4.9 × 3.1 is about 5 × 3 = 15, so 15.19 makes sense but 1.519 doesn't.",
    },
    g5_fadd: {
      big: "You can only add or subtract fractions when the pieces are the <b>same size</b>. So first we make the denominators match with a <b>common denominator</b>.",
      words: [["Common denominator", "A number both denominators divide into. For 1/4 and 1/6, use 12."], ["Simplest form", "When the top and bottom can't be divided by the same number anymore."]],
      steps: ["Find a common denominator (a multiple of both). For 2/3 + 1/4, use 12.", "Rename each fraction: 2/3 = 8/12 and 1/4 = 3/12.", "Add (or subtract) the tops: 8/12 + 3/12 = 11/12.", "Simplify if you can: 6/8 = 3/4.", "Mixed numbers: change to improper fractions first, or add wholes and fractions separately."],
      tip: "Multiplying the two denominators always gives a common denominator, but a smaller one is easier!",
    },
    g5_fmul: {
      big: "Multiplying fractions is the easy one: top × top, bottom × bottom. “1/2 of 3/4” means 1/2 × 3/4!",
      words: [["Of", "In math, “of” usually means multiply: 1/3 of 12 = 4."], ["Reciprocal", "Flip a fraction: the reciprocal of 1/5 is 5."]],
      steps: ["Fraction × whole: 2/3 × 6 = 12/3 = 4.", "Fraction × fraction: 2/5 × 3/4 = (2×3)/(5×4) = 6/20 = 3/10.", "Whole ÷ unit fraction: 3 ÷ 1/4 asks “how many quarters in 3?” Each whole has 4, so 3 × 4 = 12.", "Unit fraction ÷ whole: 1/3 ÷ 2 means split a third into 2 parts: 1/6."],
      tip: "Multiplying by a fraction less than 1 makes things smaller. That's normal!",
    },
    g5_ops: {
      big: "When a problem has several operations, everyone has to do them in the <b>same order</b> or we'd all get different answers! That order is called the <b>order of operations</b>.",
      words: [["Order of operations", "Parentheses → Exponents → Multiply & Divide (left to right) → Add & Subtract (left to right)."], ["Exponent", "A small raised number: 3² = 3 × 3."]],
      steps: ["First do anything inside parentheses ( ) or brackets [ ]. Work from the inside out.", "Next exponents: 4² = 16.", "Then × and ÷, going left to right.", "Last + and −, going left to right.", "Example: 3 + 4 × (6 − 1) → 3 + 4 × 5 → 3 + 20 = 23."],
      tip: "Multiplication doesn't always go before division. They're a team, so go left to right. The same goes for + and −.",
    },
    g5_word: {
      big: "These word problems use volume, money and fractions. Picture the story, find the question, and choose the operation.",
      words: [["Volume", "Space inside a 3-D box: length × width × height (cubic units)."]],
      steps: ["Read the question twice. What exactly do they want?", "Volume of a box: multiply length × width × height.", "Money: multiply prices like decimals (or think in cents: $3.25 = 325¢). Change = what you paid − total cost.", "“Fraction of” means multiply: 2/3 of 3/4 = 2/3 × 3/4.", "How many 1/4-pieces in 3? That's division: 3 ÷ 1/4 = 12."],
      tip: "Write money answers with two decimal places: $7.50, not $7.5.",
    },
    g5_longdiv: {
      big: "Long division breaks a big division into small steps: <b>Divide, Multiply, Subtract, Bring down</b>, then repeat!",
      words: [["Divisor", "The number you divide by."], ["Dividend", "The number being divided."]],
      steps: ["Example: 1,632 ÷ 24. Estimate: 24 is about 25, and 1,632 ÷ 25 is about 65.", "Divide: how many 24s in 163? Try 6: 24 × 6 = 144.", "Subtract: 163 − 144 = 19. Bring down the 2 → 192.", "How many 24s in 192? 24 × 8 = 192. Subtract → 0.", "Answer: 68. Check: 24 × 68 = 1,632 ✔"],
      tip: "Make a quick list of multiples of the divisor (24, 48, 72, 96…) to speed up each step.",
    },
    g5_place: {
      big: "Each place is <b>10 times</b> the place to its right. That works for decimals too: tenths, hundredths, <b>thousandths</b>… And 10 with an exponent is a quick way to write 10, 100, 1,000…",
      words: [["Thousandths", "The 3rd place after the point: 0.004 is 4 thousandths."], ["10³", "10 × 10 × 10 = 1,000 (a 1 with three zeros)."]],
      steps: ["10² = 100, 10³ = 1,000, 10⁴ = 10,000: the exponent tells how many zeros.", "× 10³ moves the decimal point 3 places right: 2.45 × 10³ = 2,450.", "Compare decimals by lining up places: 0.305 vs 0.35 → 0.305 vs 0.350 → 0.35 is bigger.", "Round decimals like whole numbers: 4.276 to the nearest tenth → look at the 7 → 4.3."],
      tip: "When comparing, add zeros so the decimals have the same length. Then compare like whole numbers.",
    },
    g5_coord: {
      big: "A coordinate grid is like a treasure map. Every point has an address (x, y): <b>x says how far across</b>, <b>y says how far up</b>.",
      words: [["Coordinates (x, y)", "The address of a point: first across, then up."], ["Origin", "The starting corner (0, 0)."]],
      steps: ["To plot (3, 5): start at (0, 0), go 3 right, then 5 up.", "Moving right or left changes x; moving up or down changes y.", "Distance along a straight line: subtract the coordinates that change. From (2, 4) to (9, 4) is 9 − 2 = 7.", "Rectangle: width = difference in x, height = difference in y. Then area = width × height.", "Two patterns: if Pattern B adds 3 times as much as A each step, B is always 3 times A."],
      tip: "Remember “across the hall, then up the stairs”: x first, then y!",
    },
    g5_scaling: {
      big: "A fraction is also a division! 3/4 means 3 ÷ 4. So if 3 pizzas are shared by 4 friends, each gets 3/4 of a pizza.",
      words: [["Scaling", "Multiplying changes size: by more than 1 → bigger, by less than 1 → smaller."]],
      steps: ["Sharing: a things shared by b people → each gets a/b.", "Scaling: 3/5 × 200 is less than 200 (since 3/5 < 1). 7/4 × 200 is more than 200 (7/4 > 1).", "Multiplying mixed numbers: change to improper fractions first: 1 1/2 × 2 1/3 = 3/2 × 7/3 = 21/6 = 3 1/2."],
      tip: "You can answer scaling questions without multiplying at all. Just compare the fraction to 1!",
    },
    g5_volume: {
      big: "Volume is how many <b>unit cubes</b> fit inside a 3-D shape. For a box, count one layer, then multiply by the number of layers.",
      words: [["Cubic unit", "A cube 1 unit on each side (cubic cm, cubic inches…)."], ["Base area (B)", "The area of the bottom layer."]],
      steps: ["V = length × width × height.", "Or V = B × h (base area × height). If the base is 12 sq cm and height 5 cm, V = 60 cubic cm.", "Combined shapes: split into boxes, find each volume, then add."],
      tip: "Volume answers use cubic units (like cubic cm), because you're counting cubes.",
    },
    g5_shapes: {
      big: "Shapes belong to families. A square is a special rectangle AND a special rhombus, because it has everything those shapes need!",
      words: [["Parallelogram", "2 pairs of parallel sides."], ["Rhombus", "4 equal sides."], ["Rectangle", "4 right angles."]],
      steps: ["Family tree: Quadrilaterals → Parallelograms → Rectangles and Rhombuses → Squares (both!).", "“Every square is a rectangle”: TRUE (it has 4 right angles).", "“Every rectangle is a square”: FALSE (its sides don't have to be equal).", "Triangle angles always add to 180°; quadrilateral angles add to 360°."],
      tip: "For “every A is a B” questions, ask: does EVERY A have all of B's properties?",
    },

    // ======================= GRADE 6 =======================
    g6_ratio: {
      big: "A <b>ratio</b> compares two amounts, like 2 cups of sugar for every 3 cups of flour (2 : 3). A <b>rate</b> compares different units, like miles per hour.",
      words: [["Ratio a : b", "For every a of one thing, there are b of another."], ["Unit rate", "How much for ONE: per hour, per cupcake…"]],
      steps: ["Equivalent ratios: multiply both parts by the same number: 2 : 3 = 8 : 12.", "Unit rate: divide. 150 miles in 3 hours → 150 ÷ 3 = 50 miles per hour.", "Part-to-whole: ratio 3 : 5 means groups of 8. With 40 total → 40 ÷ 8 = 5 groups → 3 × 5 = 15 and 5 × 5 = 25."],
      tip: "A table of equivalent ratios (2:3, 4:6, 6:9…) helps you see the pattern.",
    },
    g6_pct: {
      big: "<b>Percent</b> means “out of 100.” 35% means 35 out of every 100. 50% is half, 25% is a quarter, 10% is a tenth.",
      words: [["Percent (%)", "Per hundred: 40% = 40/100 = 0.40."]],
      steps: ["Find 10% by dividing by 10: 10% of 80 = 8.", "Build others from 10%: 30% = 3 × 8 = 24; 5% = half of 10% = 4.", "Or multiply: 35% of 60 = 0.35 × 60 = 21.", "What percent is 18 of 72? 18/72 = 1/4 = 25%.", "18 is 30% of what? If 30% = 18, then 10% = 6, so 100% = 60."],
      tip: "Benchmarks are your friends: 50% = ½, 25% = ¼, 75% = ¾, 20% = 1/5, 10% = 1/10.",
    },
    g6_fdiv: {
      big: "Dividing by a fraction asks “how many of these fit?” The shortcut: <b>Keep, Change, Flip</b>!",
      words: [["Reciprocal", "The flipped fraction: the reciprocal of 2/3 is 3/2."]],
      steps: ["Keep the first fraction.", "Change ÷ to ×.", "Flip the second fraction (use its reciprocal).", "Example: 3/4 ÷ 1/2 = 3/4 × 2/1 = 6/4 = 1 1/2.", "Mixed numbers: change them to improper fractions first."],
      tip: "Sanity check: dividing by a fraction less than 1 gives a BIGGER answer (4 ÷ 1/2 = 8).",
    },
    g6_eq: {
      big: "An <b>equation</b> is a balance. Whatever you do to one side, you do to the other. To solve, <b>undo</b> what was done to x.",
      words: [["Variable", "A letter that stands for an unknown number."], ["Exponent", "2⁵ = 2 × 2 × 2 × 2 × 2 = 32."], ["GCF / LCM", "Greatest common factor / least common multiple."]],
      steps: ["x + 7 = 15 → subtract 7 from both sides → x = 8.", "4x = 36 → divide both sides by 4 → x = 9.", "x ÷ 3 = 5 → multiply both sides by 3 → x = 15.", "GCF of 18 and 24: the biggest number dividing both → 6. LCM of 4 and 6: the smallest number both divide into → 12.", "Evaluate 2x² + 1 when x = 3: exponent first → 9, then 2 × 9 + 1 = 19."],
      tip: "Check your answer by plugging it back in: does 8 + 7 really equal 15? ✔",
    },
    g6_word: {
      big: "Royal word problems mix ratios, rates, percents and area. Find the question, then pick your tool.",
      words: [["Discount", "Money taken off the price."], ["Area of a triangle", "½ × base × height."]],
      steps: ["Sale price: find the percent off, then subtract it from the price (or find what % is left: 25% off means you pay 75%).", "Rate: find the amount per 1 first, then multiply.", "Triangle area: ½ × base × height.", "Dividing into fraction-sized pieces: 6 ÷ 3/4 = 6 × 4/3 = 8."],
      tip: "Underline the question sentence. Many mistakes come from answering a different question!",
    },
    g6_int: {
      big: "<b>Negative numbers</b> are less than zero, like temperatures below zero or depths below sea level. On a number line, they're to the left of 0.",
      words: [["Integer", "Whole numbers and their opposites: …−2, −1, 0, 1, 2…"], ["Absolute value |x|", "Distance from 0 (never negative): |−7| = 7."], ["Quadrants", "The 4 sections of the coordinate plane (I, II, III, IV)."]],
      steps: ["Further left = smaller: −8 < −3.", "Opposites: the opposite of −6 is 6.", "Quadrants: I (+,+), II (−,+), III (−,−), IV (+,−). Go counterclockwise from the top right.", "Distance between (2, −4) and (2, 5): count from −4 up to 0 (4) and 0 up to 5 (5), so 9."],
      tip: "−10 is less than −2, even though 10 is bigger than 2. Think of temperatures!",
    },
    g6_geo: {
      big: "Area measures flat space; volume measures 3-D space; surface area is the total area of all the outside faces, like wrapping paper!",
      words: [["Parallelogram area", "base × height."], ["Trapezoid area", "½ × (base₁ + base₂) × height."], ["Surface area", "Add the areas of every face."]],
      steps: ["Triangle: ½ × b × h. Parallelogram: b × h.", "Trapezoid: average the two parallel sides, then × height.", "Prism volume: length × width × height (fractions/decimals allowed: 4 × 3 × 2.5 = 30).", "Box surface area: 2 × (lw + lh + wh).", "Composite shapes: split into simpler shapes and add."],
      tip: "The height must be straight up (perpendicular) from the base, not the slanted side.",
    },
    g6_expr: {
      big: "An <b>expression</b> is a math phrase with numbers and variables, like 3n + 5. Words can be translated into expressions, and <b>inequalities</b> show “more than” or “less than.”",
      words: [["Expression", "Like 2x − 4 (no equals sign)."], ["Like terms", "Terms with the same variable: 3x and 5x."], ["Inequality", ">, <, ≥ (at least), ≤ (at most)."]],
      steps: ["“5 less than 3 times n” → 3n − 5 (“less than” flips the order!).", "“3 times the sum of n and 4” → 3(n + 4).", "Distribute: 4(x + 2) = 4x + 8.", "Combine like terms: 2x + 5 + 3x = 5x + 5.", "“At least 10” → x ≥ 10. “More than 10” → x > 10."],
      tip: "Test your expression with a number: if n = 2, does 3n − 5 give 1? Read the words: 3 × 2 = 6, and 5 less is 1 ✔",
    },
    g6_dec: {
      big: "Big decimal problems use the same rules as whole numbers, just keep track of the decimal point!",
      words: [["Standard algorithm", "The usual column method for adding, subtracting, multiplying and dividing."]],
      steps: ["Add/subtract: line up the decimal points and fill gaps with zeros.", "Multiply: ignore the points, multiply, then put back the total number of decimal places: 2.4 × 1.25 → 24 × 125 = 3,000 → 3 places → 3.000 = 3.", "Divide by a decimal: move the point in BOTH numbers until the divisor is whole: 7.56 ÷ 0.4 → 75.6 ÷ 4 = 18.9.", "Long division with 2-digit divisors: divide, multiply, subtract, bring down."],
      tip: "Estimate first. 7.56 ÷ 0.4 is about 8 ÷ 0.5 = 16, so 18.9 is reasonable.",
    },
    g6_stats: {
      big: "Statistics helps us describe a set of data with one or two numbers: the <b>center</b> (mean, median) and the <b>spread</b> (range, IQR, MAD).",
      words: [["Mean", "Add everything, divide by how many."], ["Median", "The middle number when in order."], ["IQR", "Q3 − Q1: the spread of the middle half."], ["MAD", "Average distance from the mean."]],
      steps: ["Mean of 4, 8, 9: (4 + 8 + 9) ÷ 3 = 7.", "Median: order the data and find the middle. With an even count, average the two middle numbers.", "IQR (8 values): order them, Q1 = median of the lowest 4, Q3 = median of the highest 4, IQR = Q3 − Q1.", "MAD: find each value's distance from the mean (ignore negatives), then average those distances."],
      tip: "Always put the data in order before finding the median or quartiles!",
    },
    g6_eqdec: {
      big: "Equations can have fractions and decimals too. Same rule: undo the operation on both sides.",
      words: [["Reciprocal", "Multiplying by it undoes a fraction: (3/4)·x → multiply by 4/3."]],
      steps: ["0.5x = 12 → divide by 0.5 → x = 24.", "x + 2.75 = 6.5 → subtract 2.75 → x = 3.75.", "(2/3)x = 10 → multiply by 3/2 → x = 15.", "x − 1/4 = 2/3 → add 1/4 → x = 8/12 + 3/12 = 11/12."],
      tip: "Dividing by 0.5 is the same as multiplying by 2. Decimals can be friendly!",
    },
    g6_poly: {
      big: "We can draw shapes on the coordinate plane, even in the negative quadrants, and find their side lengths and areas by counting.",
      words: [["Vertex", "A corner point of a shape."]],
      steps: ["Horizontal length (same y): subtract the x's. From (−3, 2) to (5, 2) is 5 − (−3) = 8.", "Vertical length (same x): subtract the y's.", "Rectangle: width × height = area; 2 × (width + height) = perimeter.", "Triangle with a flat base: base = horizontal length, height = how far the top point is above the base. Area = ½ × b × h."],
      tip: "Subtracting a negative is adding: 5 − (−3) = 8. Or count squares across 0!",
    },

    // ======================= GRADE 7 =======================
    g7_int: {
      big: "Integers (positive and negative whole numbers) follow sign rules. A number line helps for + and −; simple rules help for × and ÷.",
      words: [["Opposite", "Same distance from 0, other side: −5 and 5."]],
      steps: ["Adding a negative = moving left: 3 + (−8) = −5.", "Subtracting = adding the opposite: 4 − (−6) = 4 + 6 = 10.", "Multiplying/dividing: same signs → positive; different signs → negative. (−3)(−4) = 12, (−20) ÷ 5 = −4.", "Multi-step: follow the order of operations and track signs carefully."],
      tip: "Two negatives make a positive only when multiplying or dividing, not when adding! (−3) + (−4) = −7.",
    },
    g7_eq: {
      big: "Two-step equations need two “undo” moves. Undo in reverse order: first the adding/subtracting, then the multiplying/dividing.",
      words: [["Coefficient", "The number in front of a variable: in 5x, it's 5."], ["Distributive property", "a(b + c) = ab + ac."]],
      steps: ["3x + 5 = 20 → subtract 5 → 3x = 15 → divide by 3 → x = 5.", "x/4 − 2 = 3 → add 2 → x/4 = 5 → multiply by 4 → x = 20.", "−2x + 7 = 15 → subtract 7 → −2x = 8 → divide by −2 → x = −4.", "4(x − 3) = 20 → divide by 4 → x − 3 = 5 → x = 8. (Or distribute first.)", "Combine like terms first: 2x + 3x − 4 = 21 → 5x = 25 → x = 5."],
      tip: "Check by plugging in: 3(5) + 5 = 20 ✔",
    },
    g7_pct: {
      big: "A <b>proportion</b> says two ratios are equal. Percents show up everywhere: sales, tax, tips and growth.",
      words: [["Proportion", "Two equal ratios: 2/3 = 8/12."], ["Percent change", "Change ÷ original × 100."]],
      steps: ["Solve a proportion by cross-multiplying: 3/5 = x/20 → 5x = 60 → x = 12.", "Discount: 20% off $50 → you pay 80% → 0.8 × 50 = $40.", "Tax/tip: 8% tax on $25 → 0.08 × 25 = $2 → total $27.", "Percent increase from 40 to 50: change = 10, 10 ÷ 40 = 0.25 = 25%."],
      tip: "Percent change always divides by the ORIGINAL amount, not the new one.",
    },
    g7_geo: {
      big: "<b>Probability</b> tells how likely something is, from 0 (impossible) to 1 (certain). <b>Circles</b> use π ≈ 3.14. <b>Angles</b> follow sum rules.",
      words: [["Probability", "Favorable outcomes ÷ total outcomes."], ["Radius / Diameter", "Center to edge / all the way across (d = 2r)."], ["Circumference", "Distance around a circle."]],
      steps: ["P(red) with 3 red out of 10 marbles = 3/10.", "Two events (coin AND die): multiply the probabilities.", "Circumference = π × d (or 2 × π × r). Area = π × r × r.", "Complementary angles add to 90°; supplementary add to 180°; triangle angles add to 180°."],
      tip: "Area uses the RADIUS. If you're given the diameter, halve it first!",
    },
    g7_word: {
      big: "Dojo word problems use rates, integers, equations and percents. Turn the story into math, one step at a time.",
      words: [["Rate", "Amount per unit time, like boards per minute."]],
      steps: ["Rates: find the amount per 1 minute, then multiply by the minutes asked.", "Temperatures/scores with negatives: add gains, subtract losses.", "“Starts with 5 and earns 3 each month until 20”: 5 + 3m = 20 → m = 5.", "Discount then tax: do them in order, using the new price each time."],
      tip: "Write an equation for the story first, then solve it.",
    },
    g7_rat: {
      big: "<b>Rational numbers</b> are numbers that can be written as fractions, including negative fractions and decimals. The integer sign rules still apply!",
      words: [["Rational number", "Any number that can be a fraction of integers: −3/4, 0.5, 7."], ["Repeating decimal", "Digits repeat forever: 1/3 = 0.333…"]],
      steps: ["Add/subtract fractions with signs: find a common denominator, then use integer rules on the tops.", "Multiply/divide: do the fraction or decimal math, then apply sign rules (same → +, different → −).", "Subtracting a negative = adding: 2.5 − (−1.25) = 3.75.", "Repeating or stopping? Simplify the fraction. If the denominator has only 2s and 5s as factors, it stops; otherwise it repeats (1/6 = 0.1666…)."],
      tip: "Decide the sign first, then do the math with the positive numbers.",
    },
    g7_ineq: {
      big: "Inequalities are solved like equations, with one twist: if you multiply or divide by a <b>negative</b>, <b>flip the sign</b>!",
      words: [["Inequality symbols", "> greater, < less, ≥ greater or equal, ≤ less or equal."], ["Solution set", "All the numbers that make it true."]],
      steps: ["x + 4 > 9 → subtract 4 → x > 5.", "3x − 2 ≤ 13 → add 2 → 3x ≤ 15 → divide by 3 → x ≤ 5.", "−2x + 1 > 9 → subtract 1 → −2x > 8 → divide by −2 AND flip → x < −4.", "Test it: pick a number in your answer and check it in the original."],
      tip: "Why flip? 2 < 3, but −2 > −3. Multiplying by a negative reverses the order!",
    },
    g7_scale: {
      big: "A <b>scale drawing</b> is a picture that's smaller (or bigger) than the real thing, but in proportion. The <b>scale</b> tells you how they match.",
      words: [["Scale", "e.g. 1 inch = 4 feet."], ["Scale factor", "How many times bigger or smaller."], ["Prism", "A 3-D shape with the same shape all the way through."]],
      steps: ["Drawing → real: multiply by the scale: 3.5 in × 4 ft = 14 ft.", "Real → drawing: divide: 30 m ÷ 5 m per cm = 6 cm.", "Scaling area: if lengths × k, area × k². Double the sides → 4 times the area!", "Prism volume = area of the base shape × length. Triangular base: (½ × b × h) × length."],
      tip: "Write the units next to every number. They tell you whether to multiply or divide.",
    },
    g7_angles: {
      big: "Angle relationships give us equations to solve. If we know two angles must be equal or must add up to 90° or 180°, we can find x!",
      words: [["Vertical angles", "Opposite angles where two lines cross. They're equal."], ["Complementary / Supplementary", "Add to 90° / add to 180°."]],
      steps: ["Vertical: set them equal: 3x + 10 = 70 → x = 20.", "Supplementary: add them, set = 180: (2x) + (x + 30) = 180 → 3x = 150 → x = 50.", "Triangle: all three angles add to 180.", "Plug x back in to check every angle is positive and makes sense."],
      tip: "Draw a quick sketch and label it. It makes the relationship easy to see.",
    },
    g7_money: {
      big: "Percents run the money world: interest grows savings, markups set store prices, commissions pay salespeople.",
      words: [["Simple interest", "I = P × r × t (principal × rate × years)."], ["Markup", "Amount added to the cost to get the selling price."], ["Commission", "Pay that is a percent of sales."], ["Percent error", "|guess − actual| ÷ actual × 100."]],
      steps: ["Interest: $500 at 4% for 3 years → 500 × 0.04 × 3 = $60.", "Total in account = principal + interest = $560.", "Markup: cost $40, 50% markup → 40 + 20 = $60.", "Commission: 5% of $2,000 = $100.", "Percent error: guessed 45, actual 50 → 5 ÷ 50 = 10%."],
      tip: "Change the percent to a decimal first: 4% = 0.04 (not 0.4!).",
    },
    g7_sample: {
      big: "We can't ask everyone, so we ask a <b>random sample</b> and use it to <b>predict</b>. Experiments give <b>experimental probability</b>.",
      words: [["Random sample", "A group picked fairly from the whole population."], ["Experimental probability", "What actually happened ÷ number of tries."], ["Theoretical probability", "What should happen in theory."]],
      steps: ["Experimental: 12 heads in 30 flips → 12/30 = 2/5.", "Predict: 9 of 30 sampled like green → 9/30 of 600 students = 180.", "Expected results: a fair die rolled 60 times → expect each number 60 × 1/6 = 10 times.", "Counting outcomes: 3 shirts × 4 pants = 12 outfits.", "All heads on 3 coins: ½ × ½ × ½ = 1/8."],
      tip: "Bigger samples usually give better predictions.",
    },

    // ======================= GRADE 8 =======================
    g8_eq: {
      big: "Some equations have x on <b>both sides</b>. Collect the x's on one side and the numbers on the other. Some equations have one solution, some none, some infinitely many!",
      words: [["No solution", "The sides can never be equal (like 2x + 1 = 2x + 5)."], ["Infinitely many", "Both sides are identical (like 2(x + 1) = 2x + 2)."]],
      steps: ["5x + 3 = 2x + 12 → subtract 2x → 3x + 3 = 12 → 3x = 9 → x = 3.", "Distribute first: 3(x + 4) = 5x + 2 → 3x + 12 = 5x + 2 → 10 = 2x → x = 5.", "How many solutions? Simplify both sides. Different x-coefficients → one solution. Same x-coefficient, different numbers → none. Everything the same → infinitely many."],
      tip: "Move the smaller x-term to keep your x-coefficient positive. It's easier!",
    },
    g8_lin: {
      big: "A linear function makes a straight line: y = mx + b. The <b>slope m</b> is how steep it is (rise over run), and <b>b</b> is where it crosses the y-axis.",
      words: [["Slope", "Change in y ÷ change in x (rise/run)."], ["y-intercept", "Where the line crosses the y-axis (when x = 0)."]],
      steps: ["Evaluate f(x) = 3x − 2 at x = 4: 3(4) − 2 = 10.", "Slope through (1, 2) and (4, 11): (11 − 2) ÷ (4 − 1) = 9/3 = 3.", "y-intercept: use y = mx + b with a point: 2 = 3(1) + b → b = −1.", "Slope of 2x + 3y = 6: solve for y → y = −(2/3)x + 2 → slope −2/3."],
      tip: "Going down from left to right = negative slope.",
    },
    g8_exp: {
      big: "Exponents are repeated multiplication, and they follow handy rules. <b>Scientific notation</b> uses powers of 10 to write huge or tiny numbers.",
      words: [["Product rule", "aᵐ × aⁿ = aᵐ⁺ⁿ"], ["Quotient rule", "aᵐ ÷ aⁿ = aᵐ⁻ⁿ"], ["Power rule", "(aᵐ)ⁿ = aᵐˣⁿ"], ["Scientific notation", "a × 10ⁿ with 1 ≤ a < 10"]],
      steps: ["2³ × 2⁴ = 2⁷ (add exponents). 5⁶ ÷ 5² = 5⁴ (subtract). (3²)⁴ = 3⁸ (multiply).", "Zero exponent: any nonzero number⁰ = 1. Negative exponent: 2⁻³ = 1/2³ = 1/8.", "Scientific notation: 45,000,000 = 4.5 × 10⁷ (count how many places the point moves).", "Small numbers get negative exponents: 0.0032 = 3.2 × 10⁻³.", "Multiply: (3 × 10⁴)(2 × 10⁵) = 6 × 10⁹."],
      tip: "In scientific notation, the front number must be at least 1 and less than 10.",
    },
    g8_pyth: {
      big: "In every right triangle: <b>a² + b² = c²</b>, where c is the longest side (the hypotenuse, across from the right angle).",
      words: [["Hypotenuse", "The longest side, opposite the right angle."], ["Square root √", "The number that times itself gives the value: √49 = 7."]],
      steps: ["Find the hypotenuse: legs 6 and 8 → 36 + 64 = 100 → √100 = 10.", "Find a leg: hypotenuse 13, leg 5 → 169 − 25 = 144 → √144 = 12.", "Distance between points: the horizontal and vertical gaps are the legs.", "Estimate roots: √50 is between 7 (√49) and 8 (√64)."],
      tip: "Famous triples to remember: 3-4-5, 5-12-13, 8-15-17, 7-24-25.",
    },
    g8_word: {
      big: "Starlight word problems combine everything: systems, linear functions, the Pythagorean theorem and volume.",
      words: [["System", "Two conditions that must both be true at once."]],
      steps: ["Heads & legs: if all animals had 2 legs, how many legs would there be? The extra legs tell you how many 4-legged animals.", "“$5 plus $3 per ride, spent $41”: 5 + 3r = 41 → r = 12.", "Ladder against a wall: the ladder is the hypotenuse.", "Cylinder volume: π × r² × h.", "“When will they have the same amount?” Set the two expressions equal and solve."],
      tip: "Name your unknown with a letter and write an equation before you calculate.",
    },
    g8_sys: {
      big: "A <b>system</b> is two equations at once. The solution is the point (x, y) that works in BOTH, where their lines cross.",
      words: [["Substitution", "Replace one variable using the other equation."], ["Elimination", "Add or subtract equations to cancel a variable."]],
      steps: ["Check a point: plug it into both equations. It must work in both!", "If both are y = …, set them equal: 2x + 1 = −x + 7 → 3x = 6 → x = 2, then y = 5.", "Elimination: x + y = 10 and x − y = 4 → add → 2x = 14 → x = 7, y = 3.", "Multiply an equation first if needed so a variable cancels."],
      tip: "After finding x, plug it back in to find y, then check both equations.",
    },
    g8_vol: {
      big: "Round 3-D shapes have volume formulas with π. A cone is exactly ⅓ of a cylinder with the same base and height!",
      words: [["Cylinder", "V = π r² h"], ["Cone", "V = ⅓ π r² h"], ["Sphere", "V = ⁴⁄₃ π r³"]],
      steps: ["Cylinder r = 3, h = 10: 3.14 × 9 × 10 = 282.6.", "Cone r = 3, h = 10: ⅓ of 282.6 = 94.2.", "Sphere r = 3: ⁴⁄₃ × 3.14 × 27 = 113.04.", "Use the radius, not the diameter!"],
      tip: "r² means r × r; r³ means r × r × r.",
    },
    g8_trans: {
      big: "Transformations move shapes on the grid. <b>Translations</b> slide, <b>reflections</b> flip, <b>rotations</b> turn, and <b>dilations</b> resize.",
      words: [["Translation", "Slide: add to x and/or y."], ["Reflection", "Flip over a line (axis)."], ["Rotation", "Turn around the origin."], ["Dilation", "Multiply both coordinates by the scale factor."]],
      steps: ["Translate (2, 3) right 4, down 5 → (6, −2).", "Reflect over the x-axis: (x, y) → (x, −y). Over the y-axis: (x, y) → (−x, y).", "Rotate 90° counterclockwise: (x, y) → (−y, x). Rotate 180°: (x, y) → (−x, −y).", "Dilate by 3: (x, y) → (3x, 3y)."],
      tip: "Reflecting over the x-axis changes the y, because the point flips up or down across it.",
    },
    g8_func: {
      big: "A <b>function</b> is a rule that gives each input exactly ONE output, like a vending machine: press B3, always get the same snack.",
      words: [["Function", "Each x has exactly one y."], ["Rate of change", "How fast y changes compared to x (the slope)."], ["Linear vs nonlinear", "Straight line vs curve."]],
      steps: ["Function test: look for a repeated x with different y's. If you find one, it's NOT a function.", "Rate of change: (change in y) ÷ (change in x).", "From a table, the rate is how much y changes when x goes up by 1.", "Nonlinear clues: x², x³, x in a denominator (like 5/x), x as an exponent (like 2ˣ)."],
      tip: "Linear equations can be rearranged into y = mx + b. Nonlinear ones can't.",
    },
    g8_irr: {
      big: "<b>Rational</b> numbers can be written as fractions. <b>Irrational</b> numbers can't. Their decimals go on forever without repeating, like π and √2.",
      words: [["Rational", "Fractions, integers, decimals that stop or repeat."], ["Irrational", "Never-ending, never-repeating decimals: π, √2, √10…"]],
      steps: ["√ of a perfect square (√49 = 7) is rational; √ of a non-perfect square (√50) is irrational.", "Estimate √50: 7² = 49 and 8² = 64, so √50 ≈ 7.1.", "Repeating decimal → fraction: 0.777… = 7/9. Two repeating digits: 0.4545… = 45/99.", "Why? If x = 0.777…, then 10x = 7.777…, so 9x = 7 and x = 7/9."],
      tip: "Every repeating decimal is rational, even though it goes on forever!",
    },
    g8_angles: {
      big: "When a line (a <b>transversal</b>) cuts across two parallel lines, it makes pairs of angles that are equal or add up to 180°.",
      words: [["Transversal", "A line crossing two (or more) lines."], ["Alternate interior / Corresponding", "Equal angle pairs with parallel lines."], ["Exterior angle", "Outside angle of a triangle = sum of the two far inside angles."]],
      steps: ["Corresponding, alternate interior and alternate exterior angles are EQUAL.", "Same-side interior angles add to 180°.", "Exterior angle of a triangle = the sum of the two remote interior angles.", "Algebra: equal pairs → set expressions equal; same-side pairs → add and set = 180."],
      tip: "Looks like a “Z”? Those are alternate interior angles, and they're equal. Looks like an “F”? Those are corresponding angles, also equal.",
    },

    // ======================= BONUS WORLDS (by grade band) =======================
    b_convert: {
      lo: { big: "We measure things in different units: inches and feet, minutes and hours, grams and kilograms. Converting means changing to a different unit without changing the amount.", words: [["1 foot", "12 inches"], ["1 hour", "60 minutes"], ["1 kilogram", "1,000 grams"], ["1 meter", "100 centimeters"]], steps: ["Big unit → small unit: MULTIPLY. 4 feet = 4 × 12 = 48 inches.", "Small unit → big unit: DIVIDE. 120 minutes = 120 ÷ 60 = 2 hours.", "Mixed: 3 ft 5 in = 36 + 5 = 41 inches.", "Metric with decimals: 2.5 kg = 2.5 × 1,000 = 2,500 g."], tip: "Changing to smaller units gives you MORE of them, so the number gets bigger." },
      hi: { big: "Unit conversions use rates like 12 inches per foot. You can convert speeds and use map scales the same way.", words: [["Conversion factor", "How many small units in one big unit."], ["Scale", "e.g. 1 cm = 25 km."]], steps: ["Small → big: divide. 90 minutes ÷ 60 = 1.5 hours.", "Rate conversions: 5 meters per second × 60 = 300 meters per minute.", "Map scale: multiply map distance by the scale: 3.5 cm × 25 km = 87.5 km."], tip: "Write the units in your calculation. They should cancel out to leave the unit you want." },
    },
    b_time: {
      lo: { big: "Elapsed time is how much time passes from a start time to an end time.", words: [["Elapsed time", "Time that passes."], ["AM / PM", "Before noon / after noon."]], steps: ["Add hours first, then minutes: 9:40 + 1 hour 35 min → 10:40 + 35 min.", "If minutes reach 60 or more, make a new hour: 10:75 → 11:15.", "Finding duration: count up to the next hour, then add the rest. 9:35 to 10:55 = 25 + 55 = 80 minutes."], tip: "Draw a number-line “time jump” with hops for hours and minutes." },
      hi: { big: "Distance, rate and time are connected: <b>distance = rate × time</b>.", words: [["Rate", "Speed, like km per hour."]], steps: ["Distance: 12 km/h for 3 hours = 36 km.", "Time: 60 km at 15 km/h = 60 ÷ 15 = 4 hours.", "Rate: 6 km in 30 minutes → 30 min is ½ hour → 6 ÷ ½ = 12 km/h."], tip: "Make sure the time units match. Change minutes into hours first!" },
    },
    b_deal: {
      lo: { big: "Measurements can mix units, like 2 lb 5 oz. To add or compare them, change everything to the smaller unit.", words: [["1 pound (lb)", "16 ounces (oz)"], ["1 foot (ft)", "12 inches (in)"]], steps: ["2 lb 5 oz = 2 × 16 + 5 = 37 oz.", "Add: 37 oz + 20 oz = 57 oz.", "Compare/subtract: change both to ounces first, then subtract."], tip: "Always convert first, then do the math." },
      hi: { big: "The <b>unit price</b> (price for one) lets you find the better deal, even when packs are different sizes.", words: [["Unit price", "Total cost ÷ number of items."]], steps: ["Shop A: 6 for $4.20 → $0.70 each. Shop B: 8 for $5.20 → $0.65 each.", "The lower unit price is the better deal (Shop B).", "Savings on 10 items: ($0.70 − $0.65) × 10 = $0.50."], tip: "Big packs aren't always cheaper. Check the unit price!" },
    },
    b_mean: {
      lo: { big: "The <b>mean</b> (average) is the “fair share.” If everyone put their amounts together and shared equally, how much would each get?", words: [["Mean", "Total ÷ how many."]], steps: ["Add all the numbers: 4 + 7 + 10 = 21.", "Divide by how many there are: 21 ÷ 3 = 7.", "The mean is 7."], tip: "The mean is always between the smallest and largest numbers." },
      hi: { big: "The mean is the total shared equally. You can also work backwards to find a missing value!", words: [["Mean", "Sum ÷ count."]], steps: ["Mean = sum ÷ count.", "Missing value: if the mean of 5 scores is 18, the total must be 5 × 18 = 90.", "Subtract the known scores from 90 to find the missing one."], tip: "Total = mean × count. This trick solves lots of problems." },
    },
    b_median: {
      lo: { big: "Three ways to describe data: the <b>median</b> (middle), the <b>mode</b> (most common) and the <b>range</b> (spread).", words: [["Median", "Middle number in order."], ["Mode", "Appears most often."], ["Range", "Biggest − smallest."]], steps: ["Put numbers in order: 3, 5, 8, 9, 12. The median is 8.", "Even count? Average the two middle numbers: 4, 6, 8, 10 → (6 + 8) ÷ 2 = 7.", "Mode: 2, 5, 5, 7 → 5.", "Range: 12 − 3 = 9."], tip: "Always order the numbers first!" },
      hi: { big: "Median, mode and range summarize data quickly. The median is great when there are extreme values.", words: [["Median", "Middle value (average of the two middle values if even)."], ["Range", "Max − min."]], steps: ["Order the data.", "Odd count: the middle value. Even count: average the two middle values (can be a .5).", "Mode: most frequent value. Range: max − min."], tip: "One huge number changes the mean a lot but barely moves the median." },
    },
    b_chance: {
      lo: { big: "Probability tells how likely something is. If there are more of something, it's more likely to be picked.", words: [["Probability", "Chance as a fraction: favorable ÷ total."], ["Likely / Unlikely", "More / less than half the chance."]], steps: ["4 red and 9 blue balls: blue is more likely (more of them).", "P(bone) with 2 bone sections out of 6: 2/6 = 1/3.", "Predicting: if P = 1/4 and you spin 40 times, expect about 40 × 1/4 = 10."], tip: "Equal amounts means equally likely." },
      hi: { big: "Probability = favorable ÷ total. For two independent events, multiply. “Not” = 1 minus the probability.", words: [["Independent events", "One doesn't affect the other."], ["Complement", "P(not A) = 1 − P(A)."]], steps: ["P(bone) = 3/8 → P(not bone) = 5/8.", "Expected count: 3/8 × 80 spins = 30.", "Both: P(A and B) = P(A) × P(B): 1/2 × 1/3 = 1/6."], tip: "Probabilities are always between 0 and 1." },
    },
    b_pattern: {
      lo: { big: "Patterns follow a rule. Find what changes from one number to the next and you can predict the rest!", words: [["Rule", "What you do each step, like +6."], ["Term", "Each number in the pattern."]], steps: ["Find the difference: 5, 11, 17, 23 → +6 each time → next is 29.", "Decreasing patterns subtract.", "The 10th term: start + 9 jumps. 5 + 9 × 6 = 59."], tip: "From the 1st to the 10th term is only 9 jumps!" },
      hi: { big: "Arithmetic sequences add the same amount; geometric sequences multiply by the same amount. A rule like 3n + 2 gives any term directly.", words: [["Arithmetic", "Add a constant difference."], ["Geometric", "Multiply by a constant ratio."]], steps: ["3, 7, 11, 15 → +4 → next 19.", "2, 6, 18, 54 → ×3 → next 162.", "Rule for 5, 8, 11, 14: jump 3 → 3n, then check n = 1: 3 + 2 = 5 → rule 3n + 2."], tip: "The jump size is the number in front of n." },
    },
    b_table: {
      lo: { big: "An input/output machine follows a secret rule. Figure out what happens to each In to make its Out!", words: [["Input / Output", "What goes in / what comes out."]], steps: ["Compare pairs: 2 → 7, 3 → 10, 5 → 16.", "Try a rule: × 3 then + 1? 2×3+1 = 7 ✔ 3×3+1 = 10 ✔", "Use the rule on the new input.", "Missing input? Work backwards: undo the steps."], tip: "Test your rule on EVERY pair in the table." },
      hi: { big: "A linear table follows y = mx + b. The change in y per step of x is the slope m; the output at x = 0 is b.", words: [["Slope m", "Change in output per 1 change in input."], ["Intercept b", "Output when input is 0."]], steps: ["x: 0, 1, 2 → y: 4, 7, 10. Each step +3 → m = 3.", "At x = 0, y = 4 → b = 4. Rule: y = 3x + 4.", "Use it for any x: x = 20 → y = 64."], tip: "Check that the change is the same every step. If not, it's not linear." },
    },
    b_expr: {
      lo: { big: "A missing-number puzzle is an equation. Use the <b>opposite operation</b> to find the missing number.", words: [["Inverse operations", "+ undoes −, × undoes ÷."]], steps: ["7 × ? = 56 → 56 ÷ 7 = 8.", "? ÷ 6 = 9 → 9 × 6 = 54.", "482 − ? = 197 → 482 − 197 = 285.", "(? × 4) + 5 = 37 → undo +5 → 32 → undo ×4 → 8."], tip: "Undo the LAST step first." },
      hi: { big: "Expressions can be evaluated, simplified (combine like terms) and expanded (distribute).", words: [["Like terms", "Same variable part: 3x and −5x."], ["Distribute", "a(b + c) = ab + ac"]], steps: ["Evaluate 3a + 2b for a = 4, b = −1: 12 − 2 = 10.", "Simplify 4x + 3 + 2x − 7 = 6x − 4.", "Expand 3(2x − 5) = 6x − 15."], tip: "When you distribute, multiply EVERY term inside the parentheses." },
    },
    b_facts: {
      lo: { big: "Speed facts! Knowing multiplication facts by heart makes every other math topic faster.", words: [["Fact family", "3 × 4 = 12, 4 × 3 = 12, 12 ÷ 3 = 4, 12 ÷ 4 = 3."]], steps: ["Use facts you know: 7 × 8 = 7 × 7 + 7 = 56.", "×9 trick: 9 × 6 = 60 − 6 = 54.", "Division: think of the multiplication: 63 ÷ 7 → 7 × ? = 63 → 9."], tip: "Practice a little every day. Speed comes from repetition!" },
      hi: { big: "Quick mental math: multiplication facts, squares, cubes, signed numbers and easy percents.", words: [["Square", "n² = n × n"], ["Cube", "n³ = n × n × n"]], steps: ["Squares to know: 11² = 121 … 15² = 225, 20² = 400.", "Signs: (−7)(8) = −56; (−42) ÷ (−6) = 7.", "Quick %: 10% → ÷10, 50% → half, 25% → quarter."], tip: "Memorize squares up to 15². They show up everywhere." },
    },
    b_equiv: {
      lo: { big: "The same amount can be written as a fraction or a decimal: 1/2 = 0.5, 3/10 = 0.3, 25/100 = 0.25.", words: [["Tenths", "1/10 = 0.1"], ["Hundredths", "1/100 = 0.01"]], steps: ["Tenths: 7/10 = 0.7.", "Hundredths: 43/100 = 0.43.", "Other fractions: make the bottom 10 or 100: 3/5 = 6/10 = 0.6, 1/4 = 25/100 = 0.25."], tip: "Memorize: 1/2 = 0.5, 1/4 = 0.25, 3/4 = 0.75, 1/5 = 0.2." },
      hi: { big: "Fractions, decimals and percents are three outfits for the same number: 3/4 = 0.75 = 75%.", words: [["Percent", "Out of 100."]], steps: ["Fraction → percent: make the bottom 100: 3/20 = 15/100 = 15%.", "Decimal → percent: × 100: 0.35 = 35%, 1.25 = 125%.", "Percent → fraction: over 100, then simplify: 35% = 35/100 = 7/20.", "Eighths: 1/8 = 0.125, 3/8 = 0.375."], tip: "Moving between decimal and percent = moving the point 2 places." },
    },
    b_estimate: {
      lo: { big: "Estimating means finding an answer that's <b>close enough</b>, fast, by rounding to friendly numbers first.", words: [["Estimate", "A close, quick answer."]], steps: ["Round each number: 487 + 312 → 500 + 300 = 800.", "Multiply: round each to its greatest place: 88 × 7 → 90 × 7 = 630.", "Bigger: 363 × 56 → 400 × 60 = 24,000."], tip: "Use estimates to check exact answers. If they're far apart, something went wrong!" },
      hi: { big: "Estimation with decimals and percents: round to friendly numbers, then compute in your head.", words: [["Friendly numbers", "Numbers that are easy to compute with."]], steps: ["4.87 × 19.6 → 5 × 20 = 100.", "24% of 81 → 25% of 80 = 20.", "Round decimals to whole numbers, and big numbers to their leading digit."], tip: "Pick friendly numbers that make the math easy, like 25% of 80." },
    },
  };

  MQ.getLesson = function (topic, grade) {
    const L = MQ.LESSONS[topic];
    if (!L) return null;
    return L.lo ? (grade <= 5 ? L.lo : L.hi) : L;
  };
})();
