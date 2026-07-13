/* Pathfinder 1.4 built-in catalogs and default templates.
   Kept separate from the application controller so meal, workout, routine,
   and exercise-guide content can evolve without enlarging app.js.
*/

const defaultMealPlan = {
  planName: '1,500-Calorie Egg Fried Rice Plan',
  baseCalories: 1480,
  calorieRange: '1,480–1,500',
  meals: {
    breakfast: {
      label: 'Meal 1 · Breakfast nutrition block',
      shortLabel: 'Breakfast block',
      subtitle: 'Lentils, milk, fruit, flax',
      calories: 440,
      protein: 30,
      fiber: 15,
      items: ['3/4 cup cooked lentils', '1 1/2 cups 1% milk', '1 cup frozen fruit', '1 Tbsp ground flaxseed'],
      recipe: {
        prep: '5 minutes',
        cook: '0–5 minutes if lentils are already cooked',
        steps: ['Add cooked lentils to a bowl or container.', 'Add milk, frozen fruit, and ground flaxseed.', 'Stir and let it sit a few minutes so the fruit softens, or prep it the night before.', 'Eat cold like a simple breakfast bowl, or warm the lentils separately first if you prefer.'],
        note: 'This is meant to be fast and repeatable, not fancy.'
      }
    },
    lunch: {
      label: 'Meal 2 · Lunch egg fried rice bowl',
      shortLabel: 'Lunch bowl',
      subtitle: 'Healthier egg fried rice',
      calories: 520,
      protein: 28,
      fiber: 8,
      items: ['1 1/4 cups cooked jasmine rice', '1 large whole egg', '1/2 cup liquid egg whites', '1 cup riced cauliflower', '1/2 cup pepper/onion blend', '1/2 cup mixed vegetables', '1 tsp oil', 'Garlic powder, pepper, low-sodium soy sauce, or Sriracha'],
      recipe: {
        prep: '5–8 minutes if rice is cooked',
        cook: '8–12 minutes',
        steps: ['Heat 1 tsp oil in a nonstick pan or wok over medium heat.', 'Cook pepper/onion blend, riced cauliflower, and mixed vegetables until hot and most extra water cooks off.', 'Push vegetables to the side and scramble the egg plus egg whites.', 'Add cooked rice and stir everything together until hot.', 'Season lightly with garlic powder, pepper, low-sodium soy sauce, and Sriracha to taste.'],
        note: 'Cook the vegetables first so the bowl does not turn watery.'
      }
    },
    dinner: {
      label: 'Meal 3 · Dinner egg fried rice bowl',
      shortLabel: 'Dinner bowl',
      subtitle: 'Same bowl, easy repeat',
      calories: 520,
      protein: 28,
      fiber: 8,
      items: ['1 1/4 cups cooked jasmine rice', '1 large whole egg', '1/2 cup liquid egg whites', '1 cup riced cauliflower', '1/2 cup pepper/onion blend', '1/2 cup mixed vegetables', '1 tsp oil', 'Garlic powder, pepper, low-sodium soy sauce, or Sriracha'],
      recipe: {
        prep: '5–8 minutes if rice is cooked',
        cook: '8–12 minutes',
        steps: ['Heat 1 tsp oil in a nonstick pan or wok over medium heat.', 'Cook pepper/onion blend, riced cauliflower, and mixed vegetables until hot and most extra water cooks off.', 'Push vegetables to the side and scramble the egg plus egg whites.', 'Add cooked rice and stir everything together until hot.', 'Season lightly with garlic powder, pepper, low-sodium soy sauce, and Sriracha to taste.'],
        note: 'Same method as lunch. Keep it boring and easy.'
      }
    }
  },
  baseMacros: { protein: 86, fat: 31, carbs: 213, fiber: 31 }
};

const defaultFoods = [
  { id: 'jasmine-rice', name: 'Cooked jasmine rice', serving: '1 cup cooked', calories: 205, protein: 4, fiber: 1, category: 'Carb base' },
  { id: 'brown-lentils', name: 'Cooked brown lentils', serving: '1 cup cooked', calories: 230, protein: 18, fiber: 16, category: 'Protein/fiber' },
  { id: 'black-beans', name: 'Cooked black beans', serving: '1 cup cooked', calories: 227, protein: 15, fiber: 15, category: 'Protein/fiber' },
  { id: 'egg', name: 'Large egg', serving: '1 egg', calories: 72, protein: 6, fiber: 0, category: 'Protein' },
  { id: 'egg-whites', name: 'Liquid egg whites', serving: '1/2 cup', calories: 67, protein: 13, fiber: 0, category: 'Protein' },
  { id: 'riced-cauliflower', name: 'Riced cauliflower', serving: '1 cup', calories: 25, protein: 2, fiber: 2, category: 'Vegetable' },
  { id: 'pepper-onion', name: 'Pepper/onion blend', serving: '1/2 cup', calories: 35, protein: 1, fiber: 2, category: 'Vegetable' },
  { id: 'mixed-veggies', name: 'Frozen mixed vegetables', serving: '1 cup', calories: 80, protein: 3, fiber: 5, category: 'Vegetable' },
  { id: 'one-percent-milk', name: '1% milk', serving: '1 cup', calories: 102, protein: 8, fiber: 0, category: 'Dairy' },
  { id: 'frozen-fruit', name: 'Frozen fruit', serving: '1 cup', calories: 80, protein: 1, fiber: 3, category: 'Fruit' },
  { id: 'flaxseed', name: 'Ground flaxseed', serving: '1 Tbsp', calories: 37, protein: 1, fiber: 2, category: 'Add-in' },
  { id: 'olive-oil', name: 'Olive oil', serving: '1 tsp', calories: 40, protein: 0, fiber: 0, category: 'Fat' },
  { id: 'greek-yogurt', name: 'Plain Greek yogurt', serving: '3/4 cup', calories: 105, protein: 18, fiber: 0, category: 'Protein' },
  { id: 'canned-salmon', name: 'Canned salmon', serving: '4 oz', calories: 180, protein: 25, fiber: 0, category: 'Protein' }
];

const localFoodDatabase = [
  ...defaultFoods.map(item => ({ ...item, source: 'Pathfinder starter' })),
  { id: 'db-cooked-white-rice-half', name: 'Cooked white rice', serving: '1/2 cup cooked', calories: 103, protein: 2, fiber: 0.3, category: 'Carb base', source: 'Starter database' },
  { id: 'db-brown-rice', name: 'Cooked brown rice', serving: '1 cup cooked', calories: 216, protein: 5, fiber: 4, category: 'Carb base', source: 'Starter database' },
  { id: 'db-oatmeal', name: 'Oatmeal cooked with water', serving: '1 cup cooked', calories: 154, protein: 6, fiber: 4, category: 'Breakfast', source: 'Starter database' },
  { id: 'db-bacon-slice', name: 'Cooked bacon', serving: '1 slice', calories: 43, protein: 3, fiber: 0, category: 'Breakfast protein', source: 'Starter database' },
  { id: 'db-english-muffin', name: 'Plain English muffin', serving: '1 muffin', calories: 134, protein: 5, fiber: 1, category: 'Breakfast bread', source: 'Starter database' },
  { id: 'db-pork-chop', name: 'Lean pork chop cooked', serving: '4 oz', calories: 210, protein: 30, fiber: 0, category: 'Protein', source: 'Starter database' },
  { id: 'db-banana', name: 'Banana', serving: '1 medium', calories: 105, protein: 1, fiber: 3, category: 'Fruit', source: 'Starter database' },
  { id: 'db-orange', name: 'Orange', serving: '1 medium', calories: 62, protein: 1, fiber: 3, category: 'Fruit', source: 'Starter database' },
  { id: 'db-apple', name: 'Apple', serving: '1 medium', calories: 95, protein: 0, fiber: 4, category: 'Fruit', source: 'Starter database' },
  { id: 'db-whole-milk', name: 'Whole milk', serving: '1 cup', calories: 149, protein: 8, fiber: 0, category: 'Dairy', source: 'Starter database' },
  { id: 'db-skim-milk', name: 'Skim milk', serving: '1 cup', calories: 83, protein: 8, fiber: 0, category: 'Dairy', source: 'Starter database' },
  { id: 'db-nonfat-greek-yogurt', name: 'Nonfat Greek yogurt', serving: '3/4 cup', calories: 100, protein: 18, fiber: 0, category: 'Protein', source: 'Starter database' },
  { id: 'db-cottage-cheese', name: 'Low-fat cottage cheese', serving: '1/2 cup', calories: 90, protein: 13, fiber: 0, category: 'Protein', source: 'Starter database' },
  { id: 'db-chicken-breast', name: 'Chicken breast cooked', serving: '4 oz', calories: 187, protein: 35, fiber: 0, category: 'Protein', source: 'Starter database' },
  { id: 'db-tuna-water', name: 'Canned tuna in water', serving: '1 can drained', calories: 120, protein: 26, fiber: 0, category: 'Protein', source: 'Starter database' },
  { id: 'db-salmon-pouch', name: 'Salmon pouch/can', serving: '3 oz', calories: 120, protein: 17, fiber: 0, category: 'Protein', source: 'Starter database' },
  { id: 'db-ground-turkey', name: 'Ground turkey cooked', serving: '4 oz', calories: 220, protein: 28, fiber: 0, category: 'Protein', source: 'Starter database' },
  { id: 'db-tofu', name: 'Firm tofu', serving: '1/2 block', calories: 180, protein: 20, fiber: 2, category: 'Protein', source: 'Starter database' },
  { id: 'db-broccoli', name: 'Broccoli cooked', serving: '1 cup', calories: 55, protein: 4, fiber: 5, category: 'Vegetable', source: 'Starter database' },
  { id: 'db-green-beans', name: 'Green beans cooked', serving: '1 cup', calories: 44, protein: 2, fiber: 4, category: 'Vegetable', source: 'Starter database' },
  { id: 'db-carrots', name: 'Carrots cooked', serving: '1 cup', calories: 55, protein: 1, fiber: 5, category: 'Vegetable', source: 'Starter database' },
  { id: 'db-spinach', name: 'Spinach cooked', serving: '1 cup', calories: 41, protein: 5, fiber: 4, category: 'Vegetable', source: 'Starter database' },
  { id: 'db-frozen-stir-fry', name: 'Frozen stir-fry vegetables', serving: '1 cup', calories: 60, protein: 2, fiber: 4, category: 'Vegetable', source: 'Starter database' },
  { id: 'db-avocado', name: 'Avocado', serving: '1/2 medium', calories: 120, protein: 2, fiber: 5, category: 'Fat/fiber', source: 'Starter database' },
  { id: 'db-peanut-butter', name: 'Peanut butter', serving: '1 Tbsp', calories: 95, protein: 4, fiber: 1, category: 'Fat/protein', source: 'Starter database' },
  { id: 'db-sesame-oil', name: 'Toasted sesame oil', serving: '1 tsp', calories: 40, protein: 0, fiber: 0, category: 'Fat/flavor', source: 'Starter database' },
  { id: 'db-soy-sauce-low', name: 'Low-sodium soy sauce', serving: '1 Tbsp', calories: 10, protein: 1, fiber: 0, category: 'Flavor', source: 'Starter database' },
  { id: 'db-sriracha', name: 'Sriracha', serving: '1 tsp', calories: 5, protein: 0, fiber: 0, category: 'Flavor', source: 'Starter database' },
  { id: 'db-protein-shake', name: 'Protein shake', serving: '1 scoop mixed with water', calories: 120, protein: 24, fiber: 0, category: 'Protein', source: 'Starter database' },
  { id: 'db-sub-sandwich', name: 'Deli/turkey sandwich estimate', serving: '1 sandwich', calories: 450, protein: 28, fiber: 4, category: 'Real-world estimate', source: 'Starter database' },
  { id: 'db-fast-food-burger', name: 'Fast food burger estimate', serving: '1 burger', calories: 550, protein: 25, fiber: 2, category: 'Real-world estimate', source: 'Starter database' },
  { id: 'db-fried-rice-restaurant', name: 'Restaurant fried rice estimate', serving: '2 cups', calories: 700, protein: 20, fiber: 4, category: 'Real-world estimate', source: 'Starter database' }
];

const defaultSavedMeals = [
  { id: 'planned-breakfast', name: 'Breakfast nutrition block', calories: 440, protein: 30, fiber: 15, notes: 'Lentils, 1% milk, fruit, flax.' },
  { id: 'egg-rice-bowl', name: 'Egg fried rice bowl', calories: 520, protein: 28, fiber: 8, notes: 'Rice, egg, egg whites, riced cauliflower, vegetables, 1 tsp oil.' },
  { id: 'minimum-protein-backup', name: 'Minimum backup meal', calories: 300, protein: 22, fiber: 4, notes: 'Use when the full plan is not happening. Log it instead of leaving the day blank.' }
];

const defaultSwaps = [
  { id: 'extra-fruit', name: 'Extra frozen fruit', calories: 80, protein: 1, fiber: 3, use: 'When hunger is high and you want something easy.' },
  { id: 'yogurt-protein', name: 'Greek yogurt protein boost', calories: 105, protein: 18, fiber: 0, use: 'When protein looks low.' },
  { id: 'salmon-boost', name: 'Canned salmon boost', calories: 180, protein: 25, fiber: 0, use: 'Use occasionally, not every day.' },
  { id: 'rice-reduce', name: 'Reduce rice by 1/2 cup', calories: -100, protein: -2, fiber: 0, use: 'When calories need trimming without changing the whole meal.' }
];

const workouts = [
  {
    id: 'chair-posture', title: 'Chair posture strength', focus: 'posture', level: 1, quiet: true,
    bestFor: 'Workdays when you need strength without noise.',
    full: ['Chair sit-to-stand · 3 x 8', 'Wall angels · 3 x 8', 'Counter pushups · 3 x 8', 'Dead bug or heel taps · 2 x 8 each side', 'Easy bike · 8–12 min'],
    minimum: ['Chair sit-to-stand · 1 x 8', 'Wall angels · 1 x 8', '2 min easy walk'],
    recovery: ['Wall posture hold · 2 x 20 sec', 'Gentle shoulder rolls · 1 min', 'Slow breathing · 2 min']
  },
  {
    id: 'quiet-cardio', title: 'Quiet cardio + mobility', focus: 'stamina', level: 1, quiet: true,
    bestFor: 'Low-energy evenings where the bike is the easiest win.',
    full: ['Easy bike warmup · 5 min', 'Bike steady pace · 15–20 min', 'Standing calf stretch · 2 x 30 sec', 'Hip flexor stretch · 2 x 30 sec', 'Box breathing · 2 min'],
    minimum: ['Bike or march in place · 5 min', 'One stretch that feels good'],
    recovery: ['Easy bike · 5 min', 'Calf stretch · 30 sec each side']
  },
  {
    id: 'core-stamina', title: 'Core + stamina builder', focus: 'core', level: 2, quiet: true,
    bestFor: 'Days when energy is okay and you want to build capacity.',
    full: ['Chair sit-to-stand · 3 x 10', 'Bird dog · 2 x 8 each side', 'Counter plank · 3 x 20 sec', 'Step-back lunges to comfortable range · 2 x 6 each side', 'Easy bike · 10 min'],
    minimum: ['Counter plank · 2 x 15 sec', 'Easy bike · 5 min'],
    recovery: ['Bird dog · 1 x 5 each side', 'Easy bike · 5 min']
  },
  {
    id: 'posture-cardio', title: 'Posture reset + low-impact cardio', focus: 'posture', level: 1, quiet: true,
    bestFor: 'Good default between lunch and dinner.',
    full: ['Wall posture hold · 3 x 30 sec', 'Wall angels · 3 x 8', 'Chair march · 3 x 30 sec', 'Easy bike · 15 min', 'Slow breathing · 2 min'],
    minimum: ['Wall posture hold · 1 x 30 sec', 'Chair march · 1 min'],
    recovery: ['Wall posture hold · 1 x 20 sec', 'Slow breathing · 2 min']
  },
  {
    id: 'minimum-friday', title: 'Minimum-win Friday', focus: 'habit', level: 1, quiet: true,
    bestFor: 'Protecting the habit at the end of the workweek.',
    full: ['Easy bike · 10–15 min', 'Chair sit-to-stand · 2 x 8', 'Counter pushups · 2 x 8', 'Stretch anything tight · 5 min'],
    minimum: ['5 min movement. Anything counts.'],
    recovery: ['Stretch anything tight · 3 min']
  },
  {
    id: 'long-comfortable', title: 'Longer comfortable movement', focus: 'stamina', level: 2, quiet: true,
    bestFor: 'Weekend stamina building without intensity.',
    full: ['Easy bike or walk · 20–30 min', 'Chair sit-to-stand · 3 x 8', 'Wall angels · 3 x 8', 'Hip/hamstring/calf stretch · 8 min', 'Weekly check-in'],
    minimum: ['10 min easy movement', 'Quick stretch'],
    recovery: ['Easy walk or bike · 8 min', 'Gentle stretch · 3 min']
  },
  {
    id: 'weekly-reset', title: 'Recovery + weekly reset', focus: 'recovery', level: 1, quiet: true,
    bestFor: 'Sunday reset, soreness, or low sleep.',
    full: ['5 min easy bike or walk', '10 min mobility flow', 'Chair hamstring stretch · 2 rounds', 'Wall posture hold · 3 x 30 sec', 'Plan tomorrow\'s meals'],
    minimum: ['5 min gentle stretch', 'Log weight or mood'],
    recovery: ['2 min breathing', 'One gentle stretch']
  }
];

const weekdayWorkoutOrder = ['weekly-reset', 'chair-posture', 'quiet-cardio', 'core-stamina', 'posture-cardio', 'minimum-friday', 'long-comfortable'];

const exerciseGuide = [
  {
    id: 'chair-sit-to-stand', name: 'Chair sit-to-stand', category: 'Legs + stamina', tags: ['quiet', 'chair', 'beginner', 'no equipment'],
    purpose: 'Builds the strength you use every time you get out of a chair, car, or bed.',
    reps: 'Start with 1–3 rounds of 6–10 reps.',
    steps: ['Stand in front of a sturdy chair with your feet about shoulder-width apart.', 'Reach your hips back and touch the chair like you are sitting down slowly.', 'Pause lightly on the chair if needed, then stand back up by pushing through your feet.', 'Keep your chest tall and let your knees point the same direction as your toes.'],
    feel: 'Thighs, glutes, and a little breathing effort. It should feel like work, not joint pain.',
    easier: 'Use your hands lightly on your thighs or chair arms, or use a taller chair.',
    harder: 'Slow the lower down to three seconds or do not fully sit between reps.',
    mistake: 'Dropping into the chair, rocking forward hard, or letting the knees collapse inward.',
    stop: 'Sharp knee, hip, or back pain; dizziness; or feeling unstable.'
  },
  {
    id: 'wall-angels', name: 'Wall angels', category: 'Posture', tags: ['quiet', 'posture', 'upper back'],
    purpose: 'Helps open the chest and wake up the upper back after sitting or leaning forward.',
    reps: 'Start with 1–3 rounds of 6–8 slow reps.',
    steps: ['Stand with your back near a wall and feet a few inches away.', 'Gently bring your ribs down so you are not arching your lower back hard.', 'Place arms against the wall in a goal-post shape if comfortable.', 'Slide your arms up and down slowly only as far as your shoulders allow.'],
    feel: 'Gentle stretch in chest/shoulders and light work between shoulder blades.',
    easier: 'Move your feet farther from the wall or keep arms slightly away from the wall.',
    harder: 'Move slower and pause for one breath at the top and bottom.',
    mistake: 'Forcing the arms flat, shrugging shoulders to ears, or arching the lower back to cheat.',
    stop: 'Sharp shoulder pain, numbness, or tingling.'
  },
  {
    id: 'counter-pushup', name: 'Counter pushup', category: 'Upper body', tags: ['quiet', 'beginner', 'no floor'],
    purpose: 'Builds chest, shoulders, arms, and core without getting on the floor.',
    reps: 'Start with 1–3 rounds of 6–10 reps.',
    steps: ['Place hands on a sturdy counter or wall, slightly wider than shoulders.', 'Step your feet back so your body is in a straight line.', 'Bend your elbows and bring your chest toward the counter.', 'Push back to the starting position while keeping your body stiff like a plank.'],
    feel: 'Chest, arms, shoulders, and light core tension.',
    easier: 'Use a wall or higher surface.',
    harder: 'Use a lower sturdy surface or slow the lowering part.',
    mistake: 'Letting hips sag, shrugging shoulders, or flaring elbows straight out.',
    stop: 'Sharp shoulder, wrist, elbow, or chest pain.'
  },
  {
    id: 'dead-bug', name: 'Dead bug / heel taps', category: 'Core', tags: ['quiet', 'floor', 'core'],
    purpose: 'Teaches your core to brace without yanking on your neck or back.',
    reps: 'Start with 1–2 rounds of 5–8 each side.',
    steps: ['Lie on your back with knees bent.', 'Gently tighten your belly like you are bracing before a cough.', 'Lift one foot and slowly tap the heel back down, then switch sides.', 'Keep breathing and keep the lower back from arching hard.'],
    feel: 'Deep core effort, not neck strain.',
    easier: 'Keep both arms down and tap one heel at a time.',
    harder: 'Reach the opposite arm back as the heel taps down.',
    mistake: 'Holding breath, rushing, or letting the back arch hard off the floor.',
    stop: 'Sharp back pain or hip pinching.'
  },
  {
    id: 'bird-dog', name: 'Bird dog', category: 'Core + back', tags: ['quiet', 'floor', 'posture'],
    purpose: 'Builds back-friendly core control and balance.',
    reps: 'Start with 1–2 rounds of 5–8 each side.',
    steps: ['Start on hands and knees.', 'Brace gently and keep your back flat like a table.', 'Reach one leg back. Add the opposite arm only if stable.', 'Pause for one breath, then return slowly and switch sides.'],
    feel: 'Core, glutes, and upper back working to keep you steady.',
    easier: 'Move only one leg at a time or keep toes touching the floor.',
    harder: 'Pause longer without twisting.',
    mistake: 'Twisting the hips open, arching the low back, or rushing reps.',
    stop: 'Sharp back, shoulder, wrist, or knee pain.'
  },
  {
    id: 'counter-plank', name: 'Counter plank', category: 'Core', tags: ['quiet', 'no floor', 'beginner'],
    purpose: 'Builds core stiffness and posture without floor planks.',
    reps: 'Start with 2–3 holds of 10–20 seconds.',
    steps: ['Place forearms or hands on a sturdy counter.', 'Step back until your body forms a straight line.', 'Squeeze glutes lightly and brace your belly.', 'Hold while breathing normally.'],
    feel: 'Core, shoulders, and glutes working together.',
    easier: 'Use a higher surface or shorter hold.',
    harder: 'Step farther back or hold longer.',
    mistake: 'Letting hips sag, holding breath, or shrugging shoulders.',
    stop: 'Sharp back, shoulder, wrist, or chest pain.'
  },
  {
    id: 'chair-march', name: 'Chair march', category: 'Cardio', tags: ['quiet', 'chair', 'stamina'],
    purpose: 'Raises heart rate gently without jumping or bothering downstairs neighbors.',
    reps: 'Start with 30–60 seconds, repeat 1–3 times.',
    steps: ['Sit tall near the front of a sturdy chair.', 'Hold the sides of the chair if needed.', 'Lift one knee, set it down, then lift the other knee.', 'Keep a smooth rhythm and breathe.'],
    feel: 'Light cardio, hip flexors, and core posture.',
    easier: 'Lift feet only a little or slow down.',
    harder: 'Move a little faster or extend the time.',
    mistake: 'Slumping backward or holding breath.',
    stop: 'Dizziness, chest pain, or sharp hip/back pain.'
  },
  {
    id: 'easy-bike', name: 'Easy stationary bike', category: 'Stamina', tags: ['bike', 'low impact', 'cardio'],
    purpose: 'Builds stamina with low joint impact and a very clear intensity dial.',
    reps: 'Start with 5–20 minutes at easy to comfortable effort.',
    steps: ['Set resistance low enough that your knees feel smooth.', 'Pedal easy for two minutes.', 'Settle into a pace where you can still talk in short sentences.', 'Cool down easy for one to two minutes.'],
    feel: 'Warmth, breathing effort, and leg work without grinding knees.',
    easier: 'Lower resistance or ride for five minutes only.',
    harder: 'Add a few minutes, not a big jump in resistance.',
    mistake: 'Starting too hard, cranking resistance, or chasing exhaustion.',
    stop: 'Chest pain, dizziness, unusual shortness of breath, or sharp knee pain.'
  },
  {
    id: 'wall-posture-hold', name: 'Wall posture hold', category: 'Posture reset', tags: ['quiet', 'posture', 'recovery'],
    purpose: 'A simple reset for standing tall and relaxing the neck/shoulders.',
    reps: 'Hold 20–30 seconds, repeat 1–3 times.',
    steps: ['Stand with your back near a wall.', 'Let the back of your head move gently toward the wall without forcing it.', 'Keep ribs relaxed and breathe slowly.', 'Think tall through the crown of your head.'],
    feel: 'Gentle posture awareness, not a hard stretch.',
    easier: 'Stand away from the wall and do the same tall posture.',
    harder: 'Add slow breathing or gentle chin tucks.',
    mistake: 'Forcing the head back or arching the lower back.',
    stop: 'Neck pain, headache, numbness, or tingling.'
  },
  {
    id: 'hip-flexor-stretch', name: 'Standing hip flexor stretch', category: 'Mobility', tags: ['quiet', 'mobility', 'recovery'],
    purpose: 'Helps the front of the hip after long sitting days.',
    reps: 'Hold 20–30 seconds each side.',
    steps: ['Stand in a split stance with one foot forward and one foot back.', 'Hold a wall or chair for balance.', 'Gently tuck your hips under like tightening a belt buckle.', 'Shift forward slightly until you feel the front of the back hip.'],
    feel: 'Mild stretch in the front of the hip/thigh.',
    easier: 'Shorten the stance and use support.',
    harder: 'Reach the same-side arm overhead if comfortable.',
    mistake: 'Arching the low back or bouncing.',
    stop: 'Sharp hip, knee, or back pain.'
  }
];


const windDownPrompts = [
  'What went right today, even if it was small?',
  'What made today harder than it needed to be?',
  'What is one thing tomorrow-you would appreciate?',
  'Where did you keep a promise to yourself today?',
  'What can be lighter, simpler, or kinder tomorrow?',
  'What did your body need today?',
  'What is one reason to be proud of not giving up?'
];

const defaultRoutines = {
  workday: {
    label: 'Workday mode',
    morning: [
      { id: 'm-brush-teeth', text: 'Brush teeth for 2 minutes', minutes: 2 },
      { id: 'm-tongue-mouth', text: 'Tongue scrape + mouthwash if using it', minutes: 1 },
      { id: 'm-face', text: 'Rinse or cleanse face; use eye cream/moisturizer as planned', minutes: 3 },
      { id: 'm-deodorant-lip', text: 'Deodorant + lip balm', minutes: 1 },
      { id: 'm-check-app', text: 'Open Pathfinder and see today\'s focus', minutes: 1 },
      { id: 'm-pack-food', text: 'Confirm meals are packed or planned', minutes: 2 },
      { id: 'm-water', text: 'Start water early', minutes: 1 }
    ],
    betweenLunchDinner: [
      { id: 'bd-log-lunch', text: 'Log lunch honestly', minutes: 1 },
      { id: 'bd-movement', text: 'Movement before dinner', minutes: 20 },
      { id: 'bd-water', text: 'Check water before the evening gets away', minutes: 1 }
    ],
    evening: [
      { id: 'e-dinner', text: 'Log dinner or swap', minutes: 1 },
      { id: 'e-brush-teeth', text: 'Brush teeth for 2 minutes', minutes: 2 },
      { id: 'e-floss', text: 'Floss or water flosser + tongue scrape', minutes: 3 },
      { id: 'e-cleanse', text: 'Cleanse face', minutes: 2 },
      { id: 'e-retinol-moisturizer', text: 'Retinol if scheduled, then night moisturizer', minutes: 2 },
      { id: 'e-hands-feet-lips', text: 'Hand cream, foot cream as needed, and lip balm', minutes: 2 },
      { id: 'e-winddown', text: 'Wind-down note', minutes: 4 },
      { id: 'e-tomorrow', text: 'Make tomorrow easier', minutes: 3 }
    ]
  },
  weekend: {
    label: 'Weekend mode',
    morning: [
      { id: 'wm-brush-teeth', text: 'Brush teeth + tongue scrape', minutes: 3 },
      { id: 'wm-face', text: 'Face routine: rinse/cleanse, eye cream, moisturizer', minutes: 4 },
      { id: 'wm-weight', text: 'Weigh in when convenient', minutes: 1 },
      { id: 'wm-review', text: 'Check progress trend', minutes: 3 }
    ],
    betweenLunchDinner: [
      { id: 'wbd-movement', text: 'Longer comfortable movement', minutes: 30 },
      { id: 'wbd-prep', text: 'Prep or restock simple meals', minutes: 20 }
    ],
    evening: [
      { id: 'we-brush-floss', text: 'Brush + floss/water flosser', minutes: 5 },
      { id: 'we-skin', text: 'Night face routine + lip balm', minutes: 4 },
      { id: 'we-weekly-nails', text: 'Weekly nails: trim/file with nail kit if needed', minutes: 8 },
      { id: 'we-foot-care', text: 'Weekly foot check: dry feet, heel cream/pumice if needed', minutes: 6 },
      { id: 'we-shoe-powder', text: 'Shoe odor powder/reset if needed', minutes: 2 },
      { id: 'we-review', text: 'Weekly review or light recap', minutes: 8 },
      { id: 'we-reset', text: 'Reset the app for Monday', minutes: 3 }
    ]
  }
};

export {
  defaultMealPlan,
  defaultFoods,
  localFoodDatabase,
  defaultSavedMeals,
  defaultSwaps,
  workouts,
  weekdayWorkoutOrder,
  exerciseGuide,
  windDownPrompts,
  defaultRoutines
};
