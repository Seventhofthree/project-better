/* Pathfinder 0.9.6
   Local-first daily companion app. No account, no server, no dependencies.
   0.9.6 is an Assistant Layer release built from the verified 0.9.5 source.
   Adds companion-style daily guidance using existing logged data without changing persistence.
*/

const APP_VERSION = '0.9.6';
const STORAGE_KEY = 'pathfinder.state.v8';
const STORAGE_BACKUP_KEY = 'pathfinder.state.v8.backup';
const SESSION_STORAGE_KEY = 'pathfinder.state.v8.session';
const IDB_DB_NAME = 'pathfinder-local-state';
const IDB_STORE_NAME = 'state';
const IDB_STATE_KEY = 'main';
const LEGACY_KEYS = ['pathfinder.state.v8.backup', 'pathfinder.state.v7', 'pathfinder.state.v1', 'pathfinder.0.1.state'];
let storageLoadSource = 'default';
let storageLastError = '';
let saveTimer = null;
const MEAL_KEYS = ['breakfast', 'lunch', 'dinner'];
const ROUTINE_BLOCKS = ['morning', 'betweenLunchDinner', 'evening'];
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const todayKey = () => toDateKey(new Date());

const mealStatusLabels = {
  '': 'Open',
  planned: 'Ate plan',
  swapped: 'Swapped',
  skipped: 'Skipped'
};

const exerciseStatusLabels = {
  '': 'Open',
  full: 'Full win',
  minimum: 'Minimum win',
  recovery: 'Recovery day',
  missed: 'Missed'
};

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

const appState = {
  activeTab: 'today',
  selectedDate: todayKey(),
  selectedGuideId: 'chair-sit-to-stand',
  data: loadState()
};

function defaultState() {
  return {
    version: APP_VERSION,
    meta: { createdAt: new Date().toISOString(), updatedAt: '' },
    settings: {
      name: 'Joshua',
      startingWeight: 305,
      goalWeight: 250,
      sex: 'male',
      age: 41,
      heightFeet: 5,
      heightInches: 8,
      activityLevel: 'sedentary',
      calorieGoal: 1500,
      maintenanceCalories: 2600,
      waterGoal: 8,
      exerciseWindow: 'Between lunch and dinner',
      bedtimeBufferHours: 2,
      routineMode: 'workday',
      experienceLevel: 1,
      morningBrief: true,
      windDown: true,
      assistantTone: 'friendly',
      weatherEnabled: true,
      weatherLocation: 'Muskogee, OK',
      weatherLatitude: 35.7479,
      weatherLongitude: -95.3697,
      foodSearch: '',
      lastSaveTestAt: '',
      lastSaveTestResult: ''
    },
    plan: structuredClone(defaultMealPlan),
    foods: structuredClone(defaultFoods),
    savedMeals: structuredClone(defaultSavedMeals),
    swaps: structuredClone(defaultSwaps),
    foodSearchResults: [],
    weather: { loading: false, fetchedAt: '', error: '', current: null, hourly: [] },
    workouts: structuredClone(workouts),
    routines: structuredClone(defaultRoutines),
    days: {}
  };
}

function loadState() {
  try {
    const candidates = [
      parseStateCandidate(safeLocalGet(STORAGE_KEY), 'localStorage'),
      parseStateCandidate(safeLocalGet(STORAGE_BACKUP_KEY), 'localStorage backup'),
      parseStateCandidate(safeSessionGet(SESSION_STORAGE_KEY), 'sessionStorage')
    ].filter(Boolean);

    for (const key of LEGACY_KEYS) {
      candidates.push(parseStateCandidate(safeLocalGet(key), key === STORAGE_BACKUP_KEY ? 'localStorage backup' : 'legacy localStorage'));
    }

    const best = chooseStoredStateCandidate(candidates);
    if (!best) {
      storageLoadSource = 'default';
      return defaultState();
    }

    storageLoadSource = best.source;
    const migrated = mergeDefaults(defaultState(), best.parsed);
    migrated.version = APP_VERSION;
    migrateState(migrated);
    return migrated;
  } catch (error) {
    storageLastError = error.message || String(error);
    console.warn('Unable to load saved state:', error);
    return defaultState();
  }
}

function migrateState(state) {
  state.plan = state.plan && state.plan.meals ? mergeDefaults(structuredClone(defaultMealPlan), state.plan) : structuredClone(defaultMealPlan);
  state.foods = Array.isArray(state.foods) && state.foods.length ? state.foods : structuredClone(defaultFoods);
  state.savedMeals = Array.isArray(state.savedMeals) && state.savedMeals.length ? state.savedMeals : structuredClone(defaultSavedMeals);
  state.swaps = Array.isArray(state.swaps) && state.swaps.length ? state.swaps : structuredClone(defaultSwaps);
  state.foodSearchResults = Array.isArray(state.foodSearchResults) ? state.foodSearchResults : [];
  state.weather = mergeDefaults({ loading: false, fetchedAt: '', error: '', current: null, hourly: [] }, state.weather || {});
  state.workouts = Array.isArray(state.workouts) && state.workouts.length ? state.workouts : structuredClone(workouts);
  state.routines = mergeRoutineDefaults(state.routines || {});
  Object.values(state.days || {}).forEach(migrateDay);
}

function mergeDefaults(base, incoming) {
  if (!incoming || typeof incoming !== 'object') return base;
  const output = Array.isArray(base) ? [...base] : { ...base };
  Object.keys(incoming).forEach(key => {
    if (incoming[key] && typeof incoming[key] === 'object' && !Array.isArray(incoming[key])) {
      output[key] = mergeDefaults(base[key] || {}, incoming[key]);
    } else {
      output[key] = incoming[key];
    }
  });
  return output;
}

function mergeRoutineDefaults(existing) {
  const merged = mergeDefaults(structuredClone(defaultRoutines), existing || {});
  Object.entries(defaultRoutines).forEach(([modeKey, defaultMode]) => {
    merged[modeKey] = merged[modeKey] || { label: defaultMode.label };
    merged[modeKey].label = merged[modeKey].label || defaultMode.label;
    ROUTINE_BLOCKS.forEach(block => {
      const current = Array.isArray(merged[modeKey][block]) ? merged[modeKey][block] : [];
      const seen = new Set(current.map(item => item.id));
      (defaultMode[block] || []).forEach(item => {
        if (!seen.has(item.id)) current.push({ ...item });
      });
      merged[modeKey][block] = current;
    });
  });
  return merged;
}

function safeLocalGet(key) {
  try { return localStorage.getItem(key); }
  catch (error) { storageLastError = error.message || String(error); return null; }
}

function safeSessionGet(key) {
  try { return sessionStorage.getItem(key); }
  catch (error) { storageLastError = error.message || String(error); return null; }
}

function parseStateCandidate(raw, source) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return { raw, parsed, source, updatedAt: candidateDateValue(parsed), hasUserData: stateHasUserData(parsed) };
  } catch {
    return null;
  }
}

function candidateDateValue(state) {
  return Date.parse(state?.meta?.updatedAt || state?.meta?.createdAt || '') || 0;
}

function chooseStoredStateCandidate(candidates) {
  const valid = candidates.filter(Boolean);
  if (!valid.length) return null;

  valid.sort((a, b) => {
    if (a.hasUserData !== b.hasUserData) return a.hasUserData ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });

  return valid[0];
}

function saveState() {
  appState.data.version = APP_VERSION;
  appState.data.meta = appState.data.meta || {};
  appState.data.meta.updatedAt = new Date().toISOString();
  const payload = JSON.stringify(appState.data);
  const errors = [];
  let syncSaved = false;

  try {
    localStorage.setItem(STORAGE_KEY, payload);
    localStorage.setItem(STORAGE_BACKUP_KEY, payload);
    const verifyPrimary = localStorage.getItem(STORAGE_KEY);
    if (verifyPrimary !== payload) throw new Error('localStorage verification failed after save');
    syncSaved = true;
  } catch (error) {
    errors.push(`localStorage: ${error.message || error}`);
    console.warn('Unable to save Pathfinder state to localStorage:', error);
  }

  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, payload);
    const verifySession = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (verifySession !== payload) throw new Error('sessionStorage verification failed after save');
    syncSaved = true;
  } catch (error) {
    errors.push(`sessionStorage: ${error.message || error}`);
    console.warn('Unable to save Pathfinder state to sessionStorage:', error);
  }

  queueIndexedDbSave(payload);

  storageLastError = errors.join(' | ');
  if (!syncSaved) showToast?.('Storage warning: export a backup');
}

function queueIndexedDbSave(payload) {
  if (!('indexedDB' in window)) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => savePayloadToIndexedDb(payload).catch(error => {
    storageLastError = error.message || String(error);
    console.warn('IndexedDB save failed:', error);
  }), 80);
}

function openPathfinderDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
    const request = indexedDB.open(IDB_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) db.createObjectStore(IDB_STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
  });
}

async function savePayloadToIndexedDb(payload) {
  const db = await openPathfinderDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    tx.objectStore(IDB_STORE_NAME).put({ id: IDB_STATE_KEY, payload, updatedAt: new Date().toISOString() });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error('IndexedDB write failed'));
  });
  db.close();
}

async function loadPayloadFromIndexedDb() {
  const db = await openPathfinderDb();
  const record = await new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readonly');
    const request = tx.objectStore(IDB_STORE_NAME).get(IDB_STATE_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error('IndexedDB read failed'));
  });
  db.close();
  return record?.payload || null;
}

function dayHasUserData(day) {
  if (!day || typeof day !== 'object') return false;
  const mealStatuses = Object.values(day.meals?.statuses || {});
  const mealNotes = Object.values(day.meals?.notes || {});
  const mealSwaps = Object.values(day.meals?.swaps || {});
  const routineDone = Object.values(day.routine?.completedIds || {}).some(Boolean);
  return (
    mealStatuses.some(Boolean) ||
    mealNotes.some(Boolean) ||
    mealSwaps.some(Boolean) ||
    (Array.isArray(day.meals?.customItems) && day.meals.customItems.length > 0) ||
    Boolean(day.exercise?.status || day.exercise?.minutes || day.exercise?.notes || day.exercise?.pain || day.exercise?.soreness) ||
    Boolean(day.checkin?.energy || day.checkin?.mood || day.checkin?.sleep || day.checkin?.stress || day.checkin?.hunger || day.checkin?.notes || Number(day.checkin?.water || 0) > 0) ||
    Boolean(day.windDown?.completed || day.windDown?.calmMinutes || day.windDown?.note) ||
    routineDone ||
    Boolean(day.weight || day.dailyNote)
  );
}

function stateHasUserData(state) {
  if (!state) return false;
  if (Object.values(state.days || {}).some(dayHasUserData)) return true;
  if (state.foods && state.foods.length !== defaultFoods.length) return true;
  if (state.savedMeals && state.savedMeals.length !== defaultSavedMeals.length) return true;
  if (state.swaps && state.swaps.length !== defaultSwaps.length) return true;
  if (state.workouts && state.workouts.length !== workouts.length) return true;
  return false;
}

async function hydrateFromIndexedDb() {
  try {
    const payload = await loadPayloadFromIndexedDb();
    if (!payload) return;

    const parsed = JSON.parse(payload);
    const migrated = mergeDefaults(defaultState(), parsed);
    migrated.version = APP_VERSION;
    migrateState(migrated);

    const currentHasData = stateHasUserData(appState.data);
    const idbHasData = stateHasUserData(migrated);

    // 0.8.8.5 safety rule:
    // IndexedDB is fallback only. It may restore only when the current loaded state has no meaningful user data.
    // It must not overwrite localStorage/sessionStorage data that already has user logs.
    if (!currentHasData && idbHasData) {
      appState.data = migrated;
      storageLoadSource = 'IndexedDB fallback';
      saveState();
      render();
      showToast('Saved Pathfinder data restored');
    }
  } catch (error) {
    storageLastError = error.message || String(error);
    console.warn('IndexedDB hydration skipped:', error);
  }
}

async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist) await navigator.storage.persist();
  } catch (error) {
    console.warn('Persistent storage request skipped:', error);
  }
}

function flushStateOnPageLeave() {
  try {
    saveState();
    localStorage.setItem('pathfinder.last-flush.v1', new Date().toISOString());
  } catch (error) {
    console.warn('Final save failed:', error);
  }
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromDateKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function shiftDate(key, offset) {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + offset);
  return toDateKey(date);
}

function formatDate(key, style = 'long') {
  return fromDateKey(key).toLocaleDateString(undefined, style === 'short'
    ? { weekday: 'short', month: 'short', day: 'numeric' }
    : { weekday: 'long', month: 'long', day: 'numeric' });
}

function dayOfWeek(key) {
  return fromDateKey(key).getDay();
}

function createDay(key) {
  return {
    key,
    meals: {
      statuses: { breakfast: '', lunch: '', dinner: '' },
      notes: { breakfast: '', lunch: '', dinner: '' },
      customItems: [],
      swaps: {}
    },
    exercise: { status: '', workoutId: workoutForDate(key).id, version: '', completed: false, minutes: '', intensity: 'comfortable', soreness: '', pain: '', notes: '' },
    checkin: { energy: '', mood: '', sleep: '', stress: '', hunger: '', water: 0, notes: '' },
    windDown: { completed: false, calmMinutes: '', note: '' },
    routine: { completedIds: {} },
    weight: '',
    dailyNote: '',
    createdAt: new Date().toISOString()
  };
}

function migrateDay(day) {
  day.meals = day.meals || {};
  day.meals.statuses = day.meals.statuses || {};
  day.meals.notes = day.meals.notes || {};
  day.meals.swaps = day.meals.swaps || {};
  MEAL_KEYS.forEach(key => {
    if (typeof day.meals[key] === 'boolean' && day.meals[key] && !day.meals.statuses[key]) day.meals.statuses[key] = 'planned';
    if (!Object.prototype.hasOwnProperty.call(day.meals.statuses, key)) day.meals.statuses[key] = '';
    if (!Object.prototype.hasOwnProperty.call(day.meals.notes, key)) day.meals.notes[key] = '';
    if (!Object.prototype.hasOwnProperty.call(day.meals.swaps, key)) day.meals.swaps[key] = '';
  });
  if (!Array.isArray(day.meals.customItems)) day.meals.customItems = [];
  const oldExercise = day.exercise || {};
  day.exercise = mergeDefaults({ status: '', workoutId: workoutForDate(day.key || todayKey()).id, version: '', completed: false, minutes: '', intensity: 'comfortable', soreness: '', pain: '', notes: '' }, oldExercise);
  if (!day.exercise.status && day.exercise.completed) day.exercise.status = day.exercise.version || 'minimum';
  day.exercise.completed = ['full', 'minimum', 'recovery'].includes(day.exercise.status) || Boolean(day.exercise.completed);
  day.checkin = mergeDefaults({ energy: '', mood: '', sleep: '', stress: '', hunger: '', water: 0, notes: '' }, day.checkin || {});
  day.windDown = mergeDefaults({ completed: false, calmMinutes: '', note: '' }, day.windDown || {});
  day.routine = mergeDefaults({ completedIds: {} }, day.routine || {});
  if (!Object.prototype.hasOwnProperty.call(day, 'weight')) day.weight = '';
  if (!Object.prototype.hasOwnProperty.call(day, 'dailyNote')) day.dailyNote = '';
}

function getDay(key = appState.selectedDate) {
  if (!appState.data.days[key]) {
    appState.data.days[key] = createDay(key);
    saveState();
  } else {
    migrateDay(appState.data.days[key]);
  }
  return appState.data.days[key];
}

function readDay(key = appState.selectedDate) {
  // 0.8.9 source cleanup:
  // Use this for charts, history, review, and projections when a screen needs to inspect a day
  // without creating a saved blank record.
  const existing = appState.data.days[key];
  if (existing) {
    migrateDay(existing);
    return existing;
  }
  return createDay(key);
}

function getPlan() {
  return appState.data.plan || defaultMealPlan;
}

function statusForMeal(day, key) {
  migrateDay(day);
  return day.meals.statuses[key] || '';
}

function mealLogged(day, key) { return Boolean(statusForMeal(day, key)); }
function mealPlanned(day, key) { return statusForMeal(day, key) === 'planned'; }
function mealSkipped(day, key) { return statusForMeal(day, key) === 'skipped'; }
function mealSwapped(day, key) { return statusForMeal(day, key) === 'swapped'; }
function plannedMealCount(day) { return MEAL_KEYS.filter(key => mealPlanned(day, key)).length; }
function mealLogCount(day) { return MEAL_KEYS.filter(key => mealLogged(day, key)).length; }
function mealLogComplete(day) { return MEAL_KEYS.every(key => mealLogged(day, key)); }

function loggedMealCalories(day) {
  const plan = getPlan();
  return MEAL_KEYS.reduce((sum, key) => sum + (mealPlanned(day, key) ? Number(plan.meals[key]?.calories || 0) : 0), 0);
}

function loggedMealProtein(day) {
  const plan = getPlan();
  return MEAL_KEYS.reduce((sum, key) => sum + (mealPlanned(day, key) ? Number(plan.meals[key]?.protein || 0) : 0), 0);
}

function loggedMealFiber(day) {
  const plan = getPlan();
  return MEAL_KEYS.reduce((sum, key) => sum + (mealPlanned(day, key) ? Number(plan.meals[key]?.fiber || 0) : 0), 0);
}

function customCalories(day) { return day.meals.customItems.reduce((sum, item) => sum + Number(item.calories || 0), 0); }
function customProtein(day) { return day.meals.customItems.reduce((sum, item) => sum + Number(item.protein || 0), 0); }
function customFiber(day) { return day.meals.customItems.reduce((sum, item) => sum + Number(item.fiber || 0), 0); }

function totalsForDay(day) {
  migrateDay(day);
  const plan = getPlan();
  const plannedCalories = Number(plan.baseCalories || MEAL_KEYS.reduce((sum, key) => sum + Number(plan.meals[key]?.calories || 0), 0));
  const plannedProtein = Number(plan.baseMacros?.protein || MEAL_KEYS.reduce((sum, key) => sum + Number(plan.meals[key]?.protein || 0), 0));
  const plannedFiber = Number(plan.baseMacros?.fiber || MEAL_KEYS.reduce((sum, key) => sum + Number(plan.meals[key]?.fiber || 0), 0));
  const loggedCalories = loggedMealCalories(day) + customCalories(day);
  const loggedProtein = loggedMealProtein(day) + customProtein(day);
  const loggedFiber = loggedMealFiber(day) + customFiber(day);
  return {
    plannedCalories,
    plannedProtein,
    plannedFiber,
    loggedCalories,
    loggedProtein,
    loggedFiber,
    fat: Number(plan.baseMacros?.fat || 0),
    carbs: Number(plan.baseMacros?.carbs || 0),
    fiber: loggedFiber
  };
}


function currentWeightForProjection(day = readDay()) {
  return getLastWeight()?.value || Number(day.weight || 0) || Number(appState.data.settings.startingWeight || 0);
}

function tdeeEstimate(weightOverride = null) {
  const settings = appState.data.settings || {};
  const weightLb = Number(weightOverride || currentWeightForProjection() || settings.startingWeight || 0);
  const age = Number(settings.age || 0);
  const feet = Number(settings.heightFeet || 0);
  const inches = Number(settings.heightInches || 0);
  const totalInches = feet * 12 + inches;
  const factors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
  const factor = factors[settings.activityLevel] || factors.sedentary;
  if (!weightLb || !age || !totalInches) {
    return { bmr: 0, tdee: Number(settings.maintenanceCalories || 0), factor, source: 'manual fallback' };
  }
  const kg = weightLb * 0.45359237;
  const cm = totalInches * 2.54;
  const bmr = (10 * kg) + (6.25 * cm) - (5 * age) + (settings.sex === 'female' ? -161 : 5);
  return { bmr, tdee: bmr * factor, factor, source: 'body stats' };
}

function exerciseCalories(day, weightOverride = null) {
  const minutes = Number(day.exercise?.minutes || 0);
  if (!minutes || day.exercise?.status === 'missed') return 0;
  const weightLb = Number(weightOverride || currentWeightForProjection(day) || appState.data.settings.startingWeight || 0);
  if (!weightLb) return 0;
  const kg = weightLb * 0.45359237;
  const statusMet = { recovery: 2.0, minimum: 2.8, full: 3.8 }[day.exercise?.status] || 3.0;
  const intensityAdjust = { easy: -0.4, comfortable: 0, challenging: 0.7 }[day.exercise?.intensity] || 0;
  const met = Math.max(1.8, statusMet + intensityAdjust);
  return Math.round(met * kg * (minutes / 60));
}

function dailyBurnEstimate(day, stats = null) {
  const currentWeight = currentWeightForProjection(day);
  const tdee = tdeeEstimate(currentWeight);
  const exerciseAdd = stats && Number.isFinite(stats.avgExerciseCalories) ? stats.avgExerciseCalories : exerciseCalories(day, currentWeight);
  const baseBurn = Number(tdee.tdee || appState.data.settings.maintenanceCalories || 0);
  return { baseBurn, exerciseAdd, totalBurn: baseBurn + exerciseAdd, currentWeight, tdee };
}

function checkinHasData(day) {
  const c = day.checkin;
  return Boolean(c.energy || c.mood || c.sleep || c.stress || c.hunger || Number(c.water || 0) > 0 || c.notes);
}

function routineCompletion(day) {
  const ids = routineItemsForSelectedMode().map(item => item.id);
  if (!ids.length) return 0;
  const completed = ids.filter(id => day.routine.completedIds[id]).length;
  return Math.round((completed / ids.length) * 100);
}

function completionScore(day) {
  migrateDay(day);
  const mealLogScore = (mealLogCount(day) / 3) * 22;
  const planScore = (plannedMealCount(day) / 3) * 12;
  const movementScore = day.exercise.status === 'full' ? 20 : day.exercise.status === 'minimum' ? 15 : day.exercise.status === 'recovery' ? 12 : 0;
  const windScore = day.windDown.completed ? 12 : 0;
  const checkinScore = checkinHasData(day) ? 10 : 0;
  const weightScore = day.weight !== '' && !Number.isNaN(Number(day.weight)) ? 8 : 0;
  const routineScore = Math.min(16, routineCompletion(day) * 0.16);
  return Math.min(100, Math.round(mealLogScore + planScore + movementScore + windScore + checkinScore + weightScore + routineScore));
}

function dataQuality(day) {
  const pieces = [mealLogComplete(day), checkinHasData(day), Boolean(day.exercise.status || day.exercise.minutes), day.windDown.completed || day.windDown.note, day.weight !== '', routineCompletion(day) > 0];
  return Math.round((pieces.filter(Boolean).length / pieces.length) * 100);
}

function setTitle(title) { $('#page-title').textContent = title; }

function render() {
  $('#date-picker').value = appState.selectedDate;
  $$('.tabs button').forEach(button => button.classList.toggle('active', button.dataset.tab === appState.activeTab));
  const renderers = { today: renderToday, meals: renderMeals, food: renderFood, exercise: renderExercise, guide: renderGuide, routines: renderRoutines, assistant: renderAssistant, progress: renderProgress, review: renderReview, history: renderHistory, settings: renderSettings };
  renderers[appState.activeTab]();
}

function guidanceButtonHtml(guidance) {
  if (guidance.tab === 'today' && guidance.button === 'Do quick check-in') {
    return `<button class="primary" data-action="focus-checkin">${escapeHtml(guidance.button)}</button>`;
  }
  return `<button class="primary" data-action="jump" data-tab-target="${escapeHtml(guidance.tab)}">${escapeHtml(guidance.button)}</button>`;
}


function currentTimeBlock() {
  if (appState.selectedDate !== todayKey()) return 'review';
  const hour = new Date().getHours();
  if (hour < 11) return 'morning';
  if (hour < 17) return 'betweenLunchDinner';
  return 'evening';
}

function routineFocusInfo(day) {
  const block = currentTimeBlock();
  const mode = selectedRoutineMode();
  if (block === 'review') return { block: 'morning', title: selectedRoutineLabel(), message: 'Viewing a saved date. Open the full routine board to review or edit.' };
  const labels = { morning: 'Morning focus', betweenLunchDinner: 'Between lunch and dinner focus', evening: 'Evening reset' };
  const items = mode[block] || [];
  const done = items.filter(item => day.routine.completedIds[item.id]).length;
  const missed = earlierRoutineMissCount(day, block);
  let message = `${done}/${items.length} done in this block.`;
  if (block === 'evening' && missed > 0) message = `${missed} earlier item(s) were missed. Do not chase the whole day now; close the night well.`;
  if (block === 'betweenLunchDinner' && missed > 0) message = `${missed} morning item(s) were missed. Shift to lunch, movement, and water now.`;
  return { block, title: labels[block] || selectedRoutineLabel(), message };
}

function earlierRoutineMissCount(day, currentBlock) {
  const mode = selectedRoutineMode();
  const order = ROUTINE_BLOCKS;
  const currentIndex = order.indexOf(currentBlock);
  if (currentIndex <= 0) return 0;
  return order.slice(0, currentIndex).flatMap(block => mode[block] || []).filter(item => !day.routine.completedIds[item.id]).length;
}

function weatherStale() {
  const w = appState.data.weather || {};
  if (!w.fetchedAt) return true;
  return Date.now() - new Date(w.fetchedAt).getTime() > 1000 * 60 * 35;
}

function ensureWeatherForToday() {
  const settings = appState.data.settings;
  const w = appState.data.weather || {};
  if (!settings.weatherEnabled || appState.selectedDate !== todayKey() || w.loading || !weatherStale()) return;
  refreshWeather(false);
}

async function refreshWeather(showMessage = true) {
  const settings = appState.data.settings;
  if (!settings.weatherEnabled) return showMessage && showToast('Weather is turned off');
  const lat = Number(settings.weatherLatitude);
  const lon = Number(settings.weatherLongitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return showMessage && showToast('Add weather latitude/longitude in Settings');
  appState.data.weather = { ...(appState.data.weather || {}), loading: true, error: '' };
  saveState();
  if (showMessage) render();
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
      hourly: 'temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,relative_humidity_2m',
      timezone: 'auto',
      forecast_days: '1',
      temperature_unit: 'fahrenheit',
      wind_speed_unit: 'mph',
      precipitation_unit: 'inch'
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!response.ok) throw new Error(`Weather ${response.status}`);
    const json = await response.json();
    const hourly = (json.hourly?.time || []).map((time, index) => ({
      time,
      temp: json.hourly.temperature_2m?.[index],
      feels: json.hourly.apparent_temperature?.[index],
      precip: json.hourly.precipitation_probability?.[index],
      code: json.hourly.weather_code?.[index],
      wind: json.hourly.wind_speed_10m?.[index],
      humidity: json.hourly.relative_humidity_2m?.[index]
    }));
    appState.data.weather = {
      loading: false,
      fetchedAt: new Date().toISOString(),
      error: '',
      current: {
        time: json.current?.time,
        temp: json.current?.temperature_2m,
        feels: json.current?.apparent_temperature,
        humidity: json.current?.relative_humidity_2m,
        precipNow: json.current?.precipitation,
        code: json.current?.weather_code,
        wind: json.current?.wind_speed_10m
      },
      hourly
    };
    saveState();
    if (appState.activeTab === 'today' || showMessage) render();
    if (showMessage) showToast('Weather updated');
  } catch (error) {
    console.warn(error);
    appState.data.weather = { ...(appState.data.weather || {}), loading: false, error: 'Weather unavailable. Check connection or coordinates.' };
    saveState();
    if (appState.activeTab === 'today' || showMessage) render();
    if (showMessage) showToast('Weather unavailable');
  }
}

function weatherCardHtml() {
  const settings = appState.data.settings;
  if (!settings.weatherEnabled) {
    return `<div class="card"><div class="card-title"><div><h3>Weather window</h3><p>Weather guidance is off.</p></div><span class="badge neutral">Off</span></div><div class="toggle-row"><button class="ghost" data-action="jump" data-tab-target="settings">Weather settings</button></div></div>`;
  }
  const w = appState.data.weather || {};
  if (w.loading) return `<div class="card"><div class="card-title"><div><h3>Weather window</h3><p>Checking current conditions and the next few hours…</p></div><span class="badge blue">Loading</span></div></div>`;
  if (w.error && !w.current) return `<div class="card warning"><div class="card-title"><div><h3>Weather window</h3><p>${escapeHtml(w.error)}</p></div><span class="badge warn">Offline</span></div><div class="toggle-row"><button class="ghost" data-action="refresh-weather">Try again</button><button class="ghost" data-action="jump" data-tab-target="settings">Settings</button></div></div>`;
  if (!w.current) return `<div class="card"><div class="card-title"><div><h3>Weather window</h3><p>Current conditions and the next 3–6 hours.</p></div><span class="badge neutral">Ready</span></div><div class="toggle-row"><button class="primary" data-action="refresh-weather">Load weather</button></div></div>`;
  const hours = nextWeatherHours(w.hourly || [], 6);
  const note = weatherGuidance(w.current, hours);
  return `<div class="card weather-card">
    <div class="card-title"><div><h3>Weather window</h3><p>${escapeHtml(settings.weatherLocation || 'Weather')} · now through the next few hours</p></div><span class="badge ${note.badge}">${escapeHtml(note.label)}</span></div>
    <div class="grid three compact-metrics">
      <div class="metric mini"><span class="value">${Math.round(w.current.temp ?? 0)}°</span><span class="label">now</span><small>feels ${Math.round(w.current.feels ?? w.current.temp ?? 0)}°</small></div>
      <div class="metric mini"><span class="value">${Math.round(w.current.humidity ?? 0)}%</span><span class="label">humidity</span><small>${Math.round(w.current.wind ?? 0)} mph wind</small></div>
      <div class="metric mini"><span class="value">${maxPrecip(hours)}%</span><span class="label">rain risk</span><small>next ${hours.length || 0} hrs</small></div>
    </div>
    <p class="note"><strong>Pathfinder note:</strong> ${escapeHtml(note.message)}</p>
    <div class="hour-strip">${hours.slice(0, 6).map(hourWeatherPill).join('')}</div>
    <div class="toggle-row"><button class="ghost small" data-action="refresh-weather">Refresh</button></div>
  </div>`;
}

function nextWeatherHours(hourly, count = 6) {
  const now = Date.now();
  return hourly.filter(hour => new Date(hour.time).getTime() >= now - 1000 * 60 * 45).slice(0, count);
}

function maxPrecip(hours) {
  return Math.max(0, ...hours.map(hour => Number(hour.precip || 0)));
}

function weatherGuidance(current, hours) {
  const feels = Number(current.feels ?? current.temp ?? 0);
  const humidity = Number(current.humidity || 0);
  const rain = maxPrecip(hours);
  const wind = Number(current.wind || 0);
  if (rain >= 60) return { label: 'Indoor', badge: 'warn', message: 'Rain or storms are likely soon. Keep movement inside and use the quiet apartment routine or bike.' };
  if (feels >= 92 || (feels >= 86 && humidity >= 65)) return { label: 'Hot/humid', badge: 'warn', message: 'Heat and humidity are high enough to favor indoor movement. Push water earlier than usual.' };
  if (feels <= 38 || wind >= 22) return { label: 'Indoor', badge: 'blue', message: 'Cold or windy conditions make indoor mobility, bike, or chair work the better default.' };
  if (feels >= 55 && feels <= 82 && rain < 35) return { label: 'Good window', badge: '', message: 'Weather looks reasonable. A short walk is a good option if energy and time allow.' };
  return { label: 'Flexible', badge: 'neutral', message: 'Weather does not force a change. Choose the workout based on energy, soreness, and time.' };
}

function hourWeatherPill(hour) {
  const time = new Date(hour.time).toLocaleTimeString([], { hour: 'numeric' });
  return `<span><strong>${escapeHtml(time)}</strong>${Math.round(hour.feels ?? hour.temp ?? 0)}° · ${Number(hour.precip || 0)}%</span>`;
}


function companionToneIntro() {
  const tone = appState.data.settings.assistantTone || 'friendly';
  if (tone === 'direct') return 'Priority check.';
  if (tone === 'gentle') return 'Gentle version.';
  return 'Friendly nudge.';
}

function foodNextStep(day, totals = totalsForDay(day)) {
  const openMeals = MEAL_KEYS.filter(key => !mealLogged(day, key));
  if (openMeals.length) return `Close ${openMeals[0]} with Ate plan, Swapped, Skipped, or a quick estimate.`;
  const calorieGoal = Number(appState.data.settings.calorieGoal || totals.plannedCalories || 0);
  const room = calorieGoal - totals.loggedCalories;
  if (room < -150) return 'Food is logged. Keep the rest of the day boring and do not turn one overage into a spiral.';
  if (Number(totals.loggedProtein || 0) < Number(totals.plannedProtein || 0) - 20) return 'Protein is short. Use a simple protein backup if you are still hungry.';
  return 'Food loop is usable today. Do not overwork it.';
}

function movementNextStep(day) {
  if (day.exercise.status === 'full') return 'Full workout is already logged. Stop trying to earn extra credit.';
  if (day.exercise.status === 'minimum') return 'Minimum win is logged. That counts. Optional stretch only if it feels good.';
  if (day.exercise.status === 'recovery') return 'Recovery is logged. Protect the habit and move on.';
  if (day.checkin.energy === 'Low' || day.checkin.sleep === 'Poor' || day.checkin.stress === 'High') return 'Take the minimum-win movement option. Five quiet minutes is enough.';
  return 'Do the planned movement before the evening gets away from you.';
}

function routineNextStepText(day) {
  if (routineCompletion(day) >= 80) return 'Routine is mostly handled. Do not add chores.';
  const items = routineItemsForSelectedMode().filter(item => !day.routine.completedIds[item.id]);
  if (items.length) return `Next routine item: ${items[0].text}`;
  return 'Routine board is clear for this mode.';
}

function windDownNextStep(day) {
  if (day.windDown.completed) return 'Wind-down is done. Let the day be finished.';
  if (completionScore(day) >= 70) return 'Close with one sentence: what helped today?';
  return 'Close with one sentence: what made today harder, and what would make tomorrow easier?';
}

function companionFocus(day, stats) {
  const totals = totalsForDay(day);
  const focusItems = [
    { key: 'food', label: 'Food', text: foodNextStep(day, totals), done: mealLogComplete(day), action: 'meals' },
    { key: 'movement', label: 'Movement', text: movementNextStep(day), done: ['full','minimum','recovery'].includes(day.exercise.status), action: 'exercise' },
    { key: 'routine', label: 'Routine', text: routineNextStepText(day), done: routineCompletion(day) >= 80, action: 'routines' },
    { key: 'winddown', label: 'Wind-down', text: windDownNextStep(day), done: !!day.windDown.completed, action: 'today' }
  ];
  const priority = focusItems.find(item => !item.done) || focusItems[0];
  const weeklyPattern = stats.mealLogDays < 4
    ? 'This week needs food logging more than new rules.'
    : stats.workouts < 3
      ? 'This week needs smaller movement, not harder movement.'
      : stats.windDowns < 3
        ? 'This week needs a calmer close at night.'
        : 'The week is building. Repeat the simple version.';
  return { priority, focusItems, weeklyPattern };
}

function companionTodayCardHtml(day, stats) {
  const focus = companionFocus(day, stats);
  const score = completionScore(day);
  const badgeClass = score >= 75 ? '' : score >= 45 ? 'blue' : 'neutral';
  return `<section class="card companion-card">
    <div class="card-title">
      <div>
        <h3>${escapeHtml(companionToneIntro())} Your next best step</h3>
        <p>${escapeHtml(focus.priority.text)}</p>
      </div>
      <span class="badge ${badgeClass}">${score}% today</span>
    </div>
    <div class="grid four">
      ${focus.focusItems.map(item => `<div class="metric"><span class="value">${item.done ? 'done' : 'open'}</span><span class="label">${escapeHtml(item.label)}</span><small>${escapeHtml(item.done ? 'handled' : item.text)}</small></div>`).join('')}
    </div>
    <p class="note"><strong>Pattern:</strong> ${escapeHtml(focus.weeklyPattern)}</p>
    <div class="toggle-row">
      <button class="primary small" data-action="jump" data-tab-target="${escapeHtml(focus.priority.action)}">Go to ${escapeHtml(focus.priority.label)}</button>
      <button class="ghost small" data-action="jump" data-tab-target="assistant">Open full brief</button>
    </div>
  </section>`;
}

function morningBriefCardHtml(day, stats) {
  const focus = companionFocus(day, stats);
  const trend = weightTrendDetail(stats);
  const recentFood = recentLoggedFoods(1)[0];
  return `<div class="card highlight">
    <div class="card-title">
      <div>
        <h3>Morning brief</h3>
        <p>Simple plan for today based on current logs.</p>
      </div>
      <span class="badge blue">${escapeHtml(focus.priority.label)}</span>
    </div>
    <div class="assistant-output">${escapeHtml([
      `${companionToneIntro()} ${focus.priority.text}`,
      `Food: ${foodNextStep(day)}`,
      `Movement: ${movementNextStep(day)}`,
      `Routine: ${routineNextStepText(day)}`,
      `Scale context: ${trend.meaning}`,
      recentFood ? `Useful repeat food: ${recentFood.name} (${Math.round(recentFood.calories)} kcal).` : 'Useful repeat food: none yet. Log a real-world meal once and it will show up here.'
    ].join('\n\n'))}</div>
  </div>`;
}

function nextActionStackHtml(day, stats) {
  const focus = companionFocus(day, stats);
  return `<div class="card">
    <div class="card-title">
      <div>
        <h3>Next action stack</h3>
        <p>Do these in order. Stop when the day is good enough.</p>
      </div>
      <span class="badge neutral">${escapeHtml(focus.priority.label)} first</span>
    </div>
    <ul class="check-list mini-list">
      ${focus.focusItems.map(item => `<li><span>${item.done ? '✓' : '○'}</span><span><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.text)}</span></li>`).join('')}
    </ul>
    <p class="note"><strong>Rule:</strong> finish the first open item before browsing for a better plan.</p>
  </div>`;
}

function eveningWindDownCoachHtml(day) {
  const recap = eveningRecap(day);
  const prompt = day.windDown.completed
    ? 'You already closed the loop. Let that count.'
    : 'Use one sentence. What made today easier or harder?';
  return `<div class="card">
    <div class="card-title">
      <div>
        <h3>Evening wind-down coach</h3>
        <p>${escapeHtml(prompt)}</p>
      </div>
      <span class="badge ${day.windDown.completed ? '' : 'neutral'}">${day.windDown.completed ? 'done' : 'open'}</span>
    </div>
    <div class="assistant-output">${escapeHtml(recap)}</div>
    <div class="toggle-row">
      <button class="secondary small" data-action="jump" data-tab-target="today">Open wind-down</button>
      <button class="ghost small" data-action="jump" data-tab-target="review">Open review</button>
    </div>
  </div>`;
}

function whatChangedCoachHtml(stats) {
  const previous = weeklyStats(shiftDate(stats.start, -1));
  const scoreDelta = stats.score - previous.score;
  const mealDelta = stats.mealLogDays - previous.mealLogDays;
  const moveDelta = stats.workouts - previous.workouts;
  const windDelta = stats.windDowns - previous.windDowns;
  const bestChange = [
    { label: 'score', value: scoreDelta, text: `${deltaText(scoreDelta, '%')} score` },
    { label: 'meal logging', value: mealDelta, text: `${deltaText(mealDelta, ' day(s)')} meal logging` },
    { label: 'movement', value: moveDelta, text: `${deltaText(moveDelta, ' day(s)')} movement` },
    { label: 'wind-down', value: windDelta, text: `${deltaText(windDelta, ' day(s)')} wind-down` }
  ].sort((a, b) => b.value - a.value)[0];
  const watch = stats.mealLogDays < 4 ? 'food logging' : stats.workouts < 3 ? 'minimum movement' : stats.windDowns < 3 ? 'wind-down' : 'consistency';
  return `<div class="card">
    <h3>What changed?</h3>
    <div class="assistant-output">${escapeHtml(`Compared with the previous 7-day window:\nScore: ${deltaText(scoreDelta, '%')}\nMeal-log days: ${deltaText(mealDelta, ' day(s)')}\nMovement days: ${deltaText(moveDelta, ' day(s)')}\nWind-downs: ${deltaText(windDelta, ' day(s)')}\n\nBest movement in the data: ${bestChange.text}.\nWatch next: ${watch}.`)}</div>
  </div>`;
}

function bodyExpectationCoachHtml(stats) {
  return `<div class="card">
    <h3>Body / weight expectation</h3>
    <p>${escapeHtml(forecastText(stats))}</p>
    <p class="note">This is rough paper math from logged food and your maintenance estimate. Use it to choose the next boring action, not to panic.</p>
  </div>`;
}

function companionPacketText(day, stats) {
  const focus = companionFocus(day, stats);
  return [
    `Pathfinder ${APP_VERSION} companion packet`,
    `Date: ${formatDate(appState.selectedDate)}`,
    `Today score: ${completionScore(day)}%`,
    `Priority: ${focus.priority.label}`,
    `Next best step: ${focus.priority.text}`,
    '',
    'Today status:',
    `- Food: ${foodNextStep(day)}`,
    `- Movement: ${movementNextStep(day)}`,
    `- Routine: ${routineNextStepText(day)}`,
    `- Wind-down: ${windDownNextStep(day)}`,
    '',
    'Weekly pattern:',
    `- ${focus.weeklyPattern}`,
    `- Meal-log days: ${stats.mealLogDays}/7`,
    `- Movement days: ${stats.workouts}/7`,
    `- Wind-downs: ${stats.windDowns}/7`,
    '',
    'Expectation:',
    forecastText(stats)
  ].join('\n');
}

async function copyCompanionPacket() {
  const text = companionPacketText(readDay(appState.selectedDate), weeklyStats(appState.selectedDate));
  try {
    await navigator.clipboard.writeText(text);
    showToast('Companion packet copied');
  } catch {
    console.log('Pathfinder companion packet:', text);
    showToast('Clipboard blocked; packet printed to console');
  }
}

function renderToday() {
  setTitle('Today');
  const day = getDay();
  const totals = totalsForDay(day);
  const score = completionScore(day);
  const stats = weeklyStats(appState.selectedDate);
  const guidance = dailyGuidance(day);
  const workout = recommendedWorkout(day);
  const mode = selectedRoutineMode();
  ensureWeatherForToday();
  const routineFocus = routineFocusInfo(day);

  $('#app').innerHTML = `
    <section class="hero">
      <div class="card highlight">
        <p class="eyebrow">${formatDate(appState.selectedDate)}</p>
        <h2>${greeting()}, ${escapeHtml(appState.data.settings.name || 'friend')}.</h2>
        <p>${escapeHtml(guidance.message)}</p>
        <div class="hero-actions">
          ${guidanceButtonHtml(guidance)}
          <button class="secondary" data-action="log-exercise-status" data-status="minimum">Minimum win</button>
          <button class="ghost" data-action="jump" data-tab-target="assistant">Open brief</button>
        </div>
      </div>
      <div class="card">
        <div class="score-circle" style="--score:${score}"><div><span>${score}</span><small>daily score</small></div></div>
        <p class="note"><strong>Goal:</strong> log food honestly, learn the movements, and use the projection as a direction check instead of a promise.</p>
      </div>
    </section>

    ${companionTodayCardHtml(day, stats)}

    <section class="progress-row" aria-label="Daily routine progress">
      ${stepCard('Breakfast', getPlan().meals.breakfast.shortLabel, mealLogged(day, 'breakfast'), mealStatusLabels[statusForMeal(day, 'breakfast')])}
      ${stepCard('Lunch', getPlan().meals.lunch.shortLabel, mealLogged(day, 'lunch'), mealStatusLabels[statusForMeal(day, 'lunch')])}
      ${stepCard('Dinner', getPlan().meals.dinner.shortLabel, mealLogged(day, 'dinner'), mealStatusLabels[statusForMeal(day, 'dinner')])}
      ${stepCard('Movement', appState.data.settings.exerciseWindow, ['full','minimum','recovery'].includes(day.exercise.status), exerciseStatusLabels[day.exercise.status] || 'Open', day.exercise.status === 'recovery')}
      ${stepCard('Routine', `${selectedRoutineLabel()} · ${routineCompletion(day)}%`, routineCompletion(day) >= 60, routineCompletion(day) ? `${routineCompletion(day)}% done` : 'Open')}
      ${stepCard('Wind-down', 'Calm review before bed', day.windDown.completed, day.windDown.completed ? 'Done' : 'Open')}
    </section>

    <section class="grid sidebar" style="margin-top:16px;">
      <div class="grid">
        <div class="card">
          <div class="card-title">
            <div>
              <h3>Today needs</h3>
              <p>${escapeHtml(guidance.reason)}</p>
            </div>
            <span class="badge ${guidance.badgeClass}">${escapeHtml(guidance.priority)}</span>
          </div>
          <div class="grid three">
            <div class="metric"><span class="value">${Math.round(totals.loggedCalories).toLocaleString()}</span><span class="label">logged calories</span><small>${appState.data.settings.calorieGoal.toLocaleString()} goal</small></div>
            <div class="metric"><span class="value">${Math.round(totals.loggedProtein)}g</span><span class="label">logged protein</span><small>${Math.round(totals.plannedProtein)}g planned</small></div>
            <div class="metric"><span class="value">${dataQuality(day)}%</span><span class="label">data quality</span><small>more honest beats perfect</small></div>
          </div>
        </div>

        <div class="card workout-card">
          <div class="card-title">
            <div>
              <h3>Recommended movement</h3>
              <p>${escapeHtml(workout.title)} · ${escapeHtml(workout.bestFor)}</p>
            </div>
            <span class="badge ${workoutBadge(day)}">${exerciseStatusLabels[day.exercise.status] || 'Open'}</span>
          </div>
          <ul class="check-list">
            ${workoutSuggestionSteps(day, workout).map(item => `<li><span>✓</span><span>${escapeHtml(item)}</span></li>`).join('')}
          </ul>
          <div class="toggle-row">
            <button class="primary" data-action="log-exercise-status" data-status="full">Full win</button>
            <button class="secondary" data-action="log-exercise-status" data-status="minimum">Minimum win</button>
            <button class="ghost" data-action="log-exercise-status" data-status="recovery">Recovery</button>
          </div>
        </div>

        <div class="card">
          <div class="card-title">
            <div>
              <h3>${escapeHtml(routineFocus.title)}</h3>
              <p>${escapeHtml(routineFocus.message)}</p>
            </div>
            <span class="badge neutral">${routineCompletion(day)}%</span>
          </div>
          ${routinePreviewHtml(day, true)}
          <div class="toggle-row"><button class="ghost" data-action="jump" data-tab-target="routines">Open full routine board</button></div>
        </div>
      </div>

      <aside class="grid">
        ${weatherCardHtml()}
        <div class="card" id="quick-checkin-card">
          <div class="card-title">
            <div>
              <h3>Quick check-in</h3>
              <p>Fast enough for tired workdays.</p>
            </div>
            <span class="badge neutral">${Number(day.checkin.water || 0)} / ${Number(appState.data.settings.waterGoal || 8)} water</span>
          </div>
          <div class="input-row">
            ${selectGroup('energy', 'Energy', day.checkin.energy, ['', 'Low', 'Okay', 'Good', 'Great'])}
            ${selectGroup('mood', 'Mood', day.checkin.mood, ['', 'Rough', 'Steady', 'Good', 'Proud'])}
            ${selectGroup('sleep', 'Sleep', day.checkin.sleep, ['', 'Poor', 'Okay', 'Good'])}
            ${selectGroup('stress', 'Stress', day.checkin.stress, ['', 'Low', 'Medium', 'High'])}
            ${selectGroup('hunger', 'Hunger', day.checkin.hunger, ['', 'Low', 'Normal', 'High'])}
            <div class="input-group"><label for="today-weight">Weight</label><input id="today-weight" data-field="weight" type="number" min="0" step="0.1" value="${escapeHtml(day.weight || '')}" /></div>
          </div>
          <div class="toggle-row">
            <button class="ghost small" data-action="water" data-delta="-1">− water</button>
            <span class="badge neutral">${Number(day.checkin.water || 0)} cups</span>
            <button class="ghost small" data-action="water" data-delta="1">+ water</button>
          </div>
          <div class="input-group" style="margin-top:12px;"><label for="daily-note">One-line note</label><input id="daily-note" data-field="dailyNote" type="text" placeholder="What affected today?" value="${escapeHtml(day.dailyNote || '')}" /></div>
        </div>

        <div class="card">
          <h3>Wind-down</h3>
          <p>${escapeHtml(promptForDate(appState.selectedDate))}</p>
          <textarea data-field="windDown.note" placeholder="A short note is enough.">${escapeHtml(day.windDown.note || '')}</textarea>
          <div class="input-row two" style="margin-top:10px;">
            <div class="input-group"><label>Calm minutes</label><input data-field="windDown.calmMinutes" type="number" min="0" value="${escapeHtml(day.windDown.calmMinutes || '')}" /></div>
            <div class="input-group"><label>Status</label><button class="${day.windDown.completed ? 'primary' : 'secondary'}" data-action="toggle" data-path="windDown.completed">${day.windDown.completed ? 'Done' : 'Mark done'}</button></div>
          </div>
        </div>
      </aside>
    </section>`;
}


function signedRemainingText(value, unit = '') {
  const amount = Math.round(Math.abs(Number(value || 0)));
  if (Number(value || 0) >= 0) return `${amount}${unit} left`;
  return `${amount}${unit} over`;
}

function mealDashboardGuidance(day, totals) {
  const calorieGoal = Number(appState.data.settings.calorieGoal || totals.plannedCalories || 0);
  const caloriesRemaining = calorieGoal - totals.loggedCalories;
  const proteinRemaining = Math.max(0, Number(totals.plannedProtein || 0) - Number(totals.loggedProtein || 0));
  const fiberRemaining = Math.max(0, Number(totals.plannedFiber || 0) - Number(totals.loggedFiber || 0));
  const unloggedMeals = MEAL_KEYS.filter(key => !mealLogged(day, key)).length;

  if (unloggedMeals === 3 && !day.meals.customItems.length) {
    return 'Start by marking Meal 1, or log what you actually ate. Blank is less useful than an estimate.';
  }
  if (caloriesRemaining < -150) {
    return 'You are over target today. Keep logging honestly; the weekly average matters more than one imperfect day.';
  }
  if (proteinRemaining > 20) {
    return `Protein is still short by about ${Math.round(proteinRemaining)}g. A simple protein backup can help.`;
  }
  if (fiberRemaining > 8) {
    return `Fiber is still short by about ${Math.round(fiberRemaining)}g. Lentils, beans, fruit, or vegetables help.`;
  }
  if (unloggedMeals > 0) {
    return `${unloggedMeals} meal${unloggedMeals === 1 ? '' : 's'} still need a status. Mark Ate plan, Swapped, or Skipped.`;
  }
  return 'Food logging looks complete for today.';
}


function quickFoodEstimates() {
  return [
    { name: 'Small snack estimate', meal: 'snack', calories: 150, protein: 5, fiber: 2, note: 'small snack' },
    { name: 'Protein snack estimate', meal: 'snack', calories: 250, protein: 20, fiber: 2, note: 'protein backup' },
    { name: 'Fast food sandwich estimate', meal: 'lunch', calories: 550, protein: 25, fiber: 3, note: 'real-world lunch' },
    { name: 'Restaurant meal estimate', meal: 'dinner', calories: 850, protein: 35, fiber: 5, note: 'safer high estimate' }
  ];
}

function quickFoodEstimateButtonsHtml(mode = 'fill') {
  const action = mode === 'log' ? 'log-food-estimate' : 'fill-food-estimate';
  const label = mode === 'log' ? 'Log' : 'Fill';
  return `<div class="toggle-row tight">${quickFoodEstimates().map(item => `<button class="ghost small" data-action="${action}" data-name="${escapeHtml(item.name)}" data-meal="${escapeHtml(item.meal)}" data-calories="${item.calories}" data-protein="${item.protein}" data-fiber="${item.fiber}">${label}: ${escapeHtml(item.note)}</button>`).join('')}</div>`;
}

function customFoodFormHtml() {
  return `<div class="card">
    <h3>Ate something else</h3>
    <p>Log a real-world swap instead of leaving the day blank. Estimates are better than missing data.</p>
    <div class="input-row two">
      <div class="input-group"><label>Name</label><input id="custom-food-name" type="text" placeholder="Example: Subway sandwich" /></div>
      <div class="input-group"><label>Meal</label><select id="custom-food-meal"><option value="snack">Snack/other</option>${MEAL_KEYS.map(key => `<option value="${key}">${capitalize(key)}</option>`).join('')}</select></div>
      <div class="input-group"><label>Servings / multiplier</label><input id="custom-food-servings" type="number" min="0.1" step="0.25" value="1" /></div>
      <div class="input-group"><label>Calories per serving</label><input id="custom-food-calories" type="number" step="1" placeholder="0" /></div>
      <div class="input-group"><label>Protein per serving</label><input id="custom-food-protein" type="number" step="1" placeholder="0" /></div>
      <div class="input-group"><label>Fiber per serving</label><input id="custom-food-fiber" type="number" step="1" placeholder="0" /></div>
      <div class="input-group"><label>Save?</label><select id="custom-food-save"><option value="no">Log only</option><option value="yes">Save as repeat food</option></select></div>
    </div>
    <p class="note">Use the quick estimates when you do not know exact calories. The goal is a useful weekly picture, not perfection.</p>
    ${quickFoodEstimateButtonsHtml('fill')}
    <div class="toggle-row"><button class="primary" data-action="add-custom-food">Add food log</button></div>
  </div>`;
}

function logFoodItemToday(source, options = {}) {
  if (!source) return false;
  const servings = Math.max(0.1, Number(options.servings || 1));
  const meal = options.meal || source.meal || 'snack';
  const item = {
    id: `${options.prefix || 'food'}-${slugify(source.name || 'food')}-${Date.now()}`,
    name: `${source.name || 'Food'}${servings !== 1 ? ` × ${servings}` : ''}`,
    meal,
    calories: Math.round(Number(source.calories || 0) * servings),
    protein: Number((Number(source.protein || 0) * servings).toFixed(1)),
    fiber: Number((Number(source.fiber || 0) * servings).toFixed(1)),
    createdAt: new Date().toISOString(),
    source: source.source || options.source || 'Food log'
  };
  const day = getDay();
  day.meals.customItems.push(item);
  if (MEAL_KEYS.includes(meal) && !day.meals.statuses[meal]) day.meals.statuses[meal] = 'swapped';
  return true;
}

function recentLoggedFoods(limit = 8) {
  const seen = new Map();
  for (let i = 0; i < 30; i += 1) {
    const key = shiftDate(appState.selectedDate, -i);
    const day = readDay(key);
    (day.meals.customItems || []).forEach(item => {
      if (!item?.name) return;
      const normalizedName = String(item.name).replace(/\s×\s[\d.]+$/, '').trim();
      const mapKey = `${normalizedName}|${Math.round(Number(item.calories || 0))}|${Number(item.protein || 0)}|${Number(item.fiber || 0)}`;
      if (!seen.has(mapKey)) {
        seen.set(mapKey, {
          name: normalizedName,
          meal: item.meal || 'snack',
          calories: Number(item.calories || 0),
          protein: Number(item.protein || 0),
          fiber: Number(item.fiber || 0),
          lastUsed: key
        });
      }
    });
  }
  return Array.from(seen.values()).slice(0, limit);
}

function recentFoodsHtml() {
  const foods = recentLoggedFoods(6);
  if (!foods.length) return '';
  return `<div class="card">
    <div class="card-title"><div><h3>Recent repeat foods</h3><p>One-tap repeats from recent custom food logs.</p></div><span class="badge neutral">${foods.length} shown</span></div>
    <div class="library-grid">${foods.map(item => `<div class="library-item">
      <strong>${escapeHtml(item.name)}</strong>
      <small>${Math.round(item.calories)} kcal · ${item.protein || 0}g protein · ${item.fiber || 0}g fiber · last ${formatDate(item.lastUsed, 'short')}</small>
      <div class="toggle-row tight"><button class="ghost small" data-action="repeat-food" data-name="${escapeHtml(item.name)}" data-meal="${escapeHtml(item.meal)}" data-calories="${item.calories}" data-protein="${item.protein}" data-fiber="${item.fiber}">Repeat today</button></div>
    </div>`).join('')}</div>
  </div>`;
}

function foodCounterHelpCardHtml() {
  const day = readDay(appState.selectedDate);
  const totals = totalsForDay(day);
  const calorieGoal = Number(appState.data.settings.calorieGoal || totals.plannedCalories || 0);
  const room = calorieGoal - totals.loggedCalories;
  return `<div class="card">
    <h3>Food counter helper</h3>
    <p>Use this when the planned meal did not happen. Pick an estimate, repeat a saved food, or search the food database.</p>
    <div class="grid two">
      <div class="metric"><span class="value">${signedRemainingText(room)}</span><span class="label">calorie room</span><small>${Math.round(totals.loggedCalories)} logged</small></div>
      <div class="metric"><span class="value">${MEAL_KEYS.filter(key => !mealLogged(day, key)).length}</span><span class="label">open meals</span><small>close blanks with estimates</small></div>
    </div>
    <p class="note">Rule: rough and logged beats blank and forgotten.</p>
  </div>`;
}

function selectedSavedFoodLoggerHtml() {
  if (!appState.data.foods.length) {
    return `<div class="card">
      <h3>Saved food quick log</h3>
      <p class="note">Save foods below first, then this becomes a fast repeat logger.</p>
    </div>`;
  }
  return `<div class="card">
    <div class="card-title"><div><h3>Saved food quick log</h3><p>Choose a saved food, meal slot, and serving multiplier.</p></div><span class="badge neutral">${appState.data.foods.length} foods</span></div>
    <div class="input-row three">
      <div class="input-group"><label>Saved food</label><select id="saved-food-select">${appState.data.foods.map(food => `<option value="${escapeHtml(food.id)}">${escapeHtml(food.name)} · ${escapeHtml(food.serving || 'serving')}</option>`).join('')}</select></div>
      <div class="input-group"><label>Meal</label><select id="saved-food-meal"><option value="snack">Snack/other</option>${MEAL_KEYS.map(key => `<option value="${key}">${capitalize(key)}</option>`).join('')}</select></div>
      <div class="input-group"><label>Servings</label><input id="saved-food-servings" type="number" min="0.1" step="0.25" value="1" /></div>
    </div>
    <div class="toggle-row"><button class="primary" data-action="quick-log-selected-food">Log selected food</button></div>
  </div>`;
}

function renderMeals() {
  setTitle('Meals');
  const day = getDay();
  const totals = totalsForDay(day);
  const plan = getPlan();
  const calorieGoal = Number(appState.data.settings.calorieGoal || totals.plannedCalories || 0);
  const caloriesRemaining = calorieGoal - totals.loggedCalories;
  const proteinRemaining = Math.max(0, Number(totals.plannedProtein || 0) - Number(totals.loggedProtein || 0));
  const fiberRemaining = Math.max(0, Number(totals.plannedFiber || 0) - Number(totals.loggedFiber || 0));
  $('#app').innerHTML = `
    <section class="grid sidebar">
      <div class="grid">
        <div class="card highlight">
          <div class="card-title">
            <div>
              <h3>${escapeHtml(plan.planName)}</h3>
              <p>Plan vs actual intake, saved swaps, simple calories/protein logging, and an at-this-pace projection.</p>
            </div>
            <span class="badge">${Math.round(totals.loggedCalories).toLocaleString()} kcal logged</span>
          </div>
          <div class="grid four">
            <div class="metric"><span class="value">${Math.round(totals.loggedCalories)}</span><span class="label">logged calories</span><small>${calorieGoal} goal</small></div>
            <div class="metric"><span class="value">${signedRemainingText(caloriesRemaining)}</span><span class="label">calorie room</span><small>based on logged food</small></div>
            <div class="metric"><span class="value">${Math.round(totals.loggedProtein)}g</span><span class="label">logged protein</span><small>${Math.round(proteinRemaining)}g left</small></div>
            <div class="metric"><span class="value">${Math.round(totals.loggedFiber)}g</span><span class="label">logged fiber</span><small>${Math.round(fiberRemaining)}g left</small></div>
          </div>
          <p class="note"><strong>Today:</strong> ${escapeHtml(mealDashboardGuidance(day, totals))}</p>
        </div>
        ${MEAL_KEYS.map(key => mealEditorCard(key, plan.meals[key], day)).join('')}
      </div>

      <aside class="grid">
        ${customFoodFormHtml()}
        ${recentFoodsHtml()}
        ${projectionCardHtml(day, weeklyStats(appState.selectedDate))}
        <div class="card">
          <h3>Saved meal quick add</h3>
          <p>Use these for repeat backups or common swaps.</p>
          <div class="library-grid">
            ${appState.data.savedMeals.map(meal => `<div class="library-item"><strong>${escapeHtml(meal.name)}</strong><small>${meal.calories} kcal · ${meal.protein}g protein · ${meal.fiber || 0}g fiber</small><p class="note">${escapeHtml(meal.notes || '')}</p><button class="ghost small" data-action="quick-add-saved-meal" data-id="${escapeHtml(meal.id)}">Add today</button></div>`).join('')}
          </div>
        </div>
        <div class="card">
          <h3>Today's extra food logs</h3>
          ${customItemsHtml(day)}
        </div>
      </aside>
    </section>`;
}

function mealEditorCard(key, meal, day) {
  const status = statusForMeal(day, key);
  return `<div class="card meal-detail ${status ? 'logged' : ''}">
    <div class="card-title">
      <div>
        <h3>${escapeHtml(meal.label)}</h3>
        <p>${escapeHtml(meal.subtitle || '')} · ${meal.calories} kcal · ${meal.protein}g protein</p>
      </div>
      <span class="badge ${status === 'skipped' ? 'warn' : status ? '' : 'neutral'}">${mealStatusLabels[status]}</span>
    </div>
    <ul class="food-list">${(meal.items || []).map(item => `<li><span>•</span><span>${escapeHtml(item)}</span></li>`).join('')}</ul>
    ${mealRecipeCardHtml(meal)}
    <div class="segmented" role="group" aria-label="${key} status">
      ${['planned', 'swapped', 'skipped'].map(value => `<button data-action="meal-status" data-meal="${key}" data-status="${value}" class="${status === value ? 'active' : ''}">${mealStatusLabels[value]}</button>`).join('')}
      <button data-action="meal-status" data-meal="${key}" data-status="" class="${status === '' ? 'active' : ''}">Clear</button>
    </div>
    <div class="input-row two">
      <div class="input-group"><label>Swap used</label><select data-meal-swap="${key}"><option value="">None / not needed</option>${appState.data.swaps.map(s => `<option value="${escapeHtml(s.id)}" ${day.meals.swaps[key] === s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}</select></div>
      <div class="input-group"><label>Meal note</label><input type="text" data-meal-note="${key}" value="${escapeHtml(day.meals.notes[key] || '')}" placeholder="What actually happened?" /></div>
    </div>
  </div>`;
}


function allFoodDatabaseItems() {
  const online = (appState.data.foodSearchResults || []).map(item => ({ ...item, source: item.source || 'Open Food Facts' }));
  const map = new Map();
  [...localFoodDatabase, ...appState.data.foods, ...online].forEach(item => {
    if (!item?.id) return;
    map.set(item.id, { ...item, source: item.source || (appState.data.foods.some(f => f.id === item.id) ? 'My foods' : 'Starter database') });
  });
  return Array.from(map.values());
}

function foodDatabaseMatches() {
  const query = String(appState.data.settings.foodSearch || '').trim().toLowerCase();
  const items = allFoodDatabaseItems();
  if (!query) return items.slice(0, 12);
  const words = query.split(/\s+/).filter(Boolean);
  return items.filter(item => {
    const haystack = `${item.name} ${item.serving || ''} ${item.category || ''} ${item.source || ''}`.toLowerCase();
    return words.every(word => haystack.includes(word));
  }).slice(0, 24);
}

function foodDatabaseSearchCard() {
  const query = appState.data.settings.foodSearch || '';
  const results = foodDatabaseMatches();
  const onlineCount = (appState.data.foodSearchResults || []).length;
  return `<div class="card highlight food-search-card">
    <div class="card-title"><div><h3>Food database search</h3><p>Search starter foods, saved foods, and optional online packaged-food results.</p></div><span class="badge neutral">${results.length} shown</span></div>
    <div class="input-row four">
      <div class="input-group"><label>Search food</label><input id="food-search-input" data-setting-field="foodSearch" value="${escapeHtml(query)}" placeholder="rice, egg, sandwich, yogurt…" /></div>
      <div class="input-group"><label>Meal</label><select id="db-meal-select"><option value="snack">Snack/other</option>${MEAL_KEYS.map(key => `<option value="${key}">${capitalize(key)}</option>`).join('')}</select></div>
      <div class="input-group"><label>Servings</label><input id="db-servings" type="number" min="0.1" step="0.25" value="1" /></div>
      <div class="input-group"><label>Search</label><div class="toggle-row tight"><button class="secondary small" data-action="apply-food-search">Search local</button><button class="ghost small" data-action="search-online-foods">Packaged</button></div></div>
    </div>
    <p class="note">Local starter values are estimates. Online packaged results come from Open Food Facts when available; verify labels when precision matters.</p>
    ${onlineCount ? `<div class="toggle-row"><span class="badge blue">${onlineCount} online results loaded</span><button class="ghost small" data-action="clear-online-foods">Clear online results</button></div>` : ''}
    <div class="library-grid food-db-results" style="margin-top:14px;">${results.map(foodDatabaseResultCard).join('') || '<p class="note">No matches yet. Try a simpler search.</p>'}</div>
  </div>`;
}

function foodDatabaseResultCard(item) {
  return `<div class="library-item food-result">
    <strong>${escapeHtml(item.name)}</strong>
    <small>${escapeHtml(item.serving || 'serving')} · ${Math.round(Number(item.calories || 0))} kcal · ${Number(item.protein || 0)}g protein · ${Number(item.fiber || 0)}g fiber</small>
    <span class="badge neutral">${escapeHtml(item.source || item.category || 'food')}</span>
    <div class="toggle-row"><button class="primary small" data-action="add-db-food" data-id="${escapeHtml(item.id)}">Log</button><button class="ghost small" data-action="save-db-food" data-id="${escapeHtml(item.id)}">Save</button></div>
  </div>`;
}

function renderFood() {
  setTitle('Food');
  const plan = getPlan();
  $('#app').innerHTML = `
    <section class="grid sidebar">
      <div class="grid">
        <div class="card highlight">
          <div class="card-title">
            <div>
              <h3>Plan editor</h3>
              <p>Edit the active meal plan without touching the code. Save after changes.</p>
            </div>
            <span class="badge">${escapeHtml(plan.planName)}</span>
          </div>
          <div class="input-row three">
            <div class="input-group"><label>Plan name</label><input data-plan-field="planName" value="${escapeHtml(plan.planName)}" /></div>
            <div class="input-group"><label>Base calories</label><input data-plan-field="baseCalories" type="number" value="${escapeHtml(plan.baseCalories)}" /></div>
            <div class="input-group"><label>Calorie range</label><input data-plan-field="calorieRange" value="${escapeHtml(plan.calorieRange)}" /></div>
          </div>
        </div>
        ${foodCounterHelpCardHtml()}
        ${selectedSavedFoodLoggerHtml()}
        ${recentFoodsHtml()}
        ${foodDatabaseSearchCard()}
        <div class="grid three">
          ${MEAL_KEYS.map(key => planMealEditCard(key, plan.meals[key])).join('')}
        </div>
        <div class="card">
          <div class="card-title"><div><h3>My foods</h3><p>Foods you saved for fast repeat logging.</p></div><span class="badge neutral">${appState.data.foods.length} foods</span></div>
          <div class="input-row four">
            <div class="input-group"><label>Name</label><input id="food-name" placeholder="Food name" /></div>
            <div class="input-group"><label>Serving</label><input id="food-serving" placeholder="Serving" /></div>
            <div class="input-group"><label>Calories</label><input id="food-calories" type="number" /></div>
            <div class="input-group"><label>Protein</label><input id="food-protein" type="number" /></div>
          </div>
          <div class="input-row two" style="margin-top:10px;">
            <div class="input-group"><label>Fiber</label><input id="food-fiber" type="number" /></div>
            <div class="input-group"><label>Category</label><input id="food-category" placeholder="Protein, vegetable, etc." /></div>
          </div>
          <div class="toggle-row"><button class="primary" data-action="add-food-library">Add food</button></div>
          <div class="library-grid" style="margin-top:14px;">${appState.data.foods.map(foodLibraryCard).join('')}</div>
        </div>
      </div>

      <aside class="grid">
        <div class="card">
          <h3>Common swaps</h3>
          <p>Quick options the meal screen can attach to a swap.</p>
          <div class="library-grid">${appState.data.swaps.map(swapCard).join('')}</div>
        </div>
        <div class="card">
          <h3>Add swap</h3>
          <div class="input-row two">
            <div class="input-group"><label>Name</label><input id="swap-name" placeholder="Swap name" /></div>
            <div class="input-group"><label>Calories</label><input id="swap-calories" type="number" /></div>
            <div class="input-group"><label>Protein</label><input id="swap-protein" type="number" /></div>
            <div class="input-group"><label>Fiber</label><input id="swap-fiber" type="number" /></div>
          </div>
          <div class="input-group" style="margin-top:10px;"><label>Use case</label><input id="swap-use" placeholder="When would you use this?" /></div>
          <div class="toggle-row"><button class="primary" data-action="add-swap">Add swap</button></div>
        </div>
        <div class="card warning">
          <h3>Plan safety</h3>
          <p>Food data here is only an estimate. Use it for direction and consistency, not medical precision.</p>
          <div class="toggle-row"><button class="ghost" data-action="restore-default-plan">Restore default plan</button></div>
        </div>
      </aside>
    </section>`;
}

function planMealEditCard(key, meal) {
  return `<div class="card flat">
    <h3>${capitalize(key)}</h3>
    <div class="input-group"><label>Label</label><input data-plan-meal="${key}" data-meal-field="label" value="${escapeHtml(meal.label)}" /></div>
    <div class="input-group"><label>Short label</label><input data-plan-meal="${key}" data-meal-field="shortLabel" value="${escapeHtml(meal.shortLabel)}" /></div>
    <div class="input-group"><label>Subtitle</label><input data-plan-meal="${key}" data-meal-field="subtitle" value="${escapeHtml(meal.subtitle || '')}" /></div>
    <div class="input-row two">
      <div class="input-group"><label>Calories</label><input data-plan-meal="${key}" data-meal-field="calories" type="number" value="${escapeHtml(meal.calories)}" /></div>
      <div class="input-group"><label>Protein</label><input data-plan-meal="${key}" data-meal-field="protein" type="number" value="${escapeHtml(meal.protein)}" /></div>
      <div class="input-group"><label>Fiber</label><input data-plan-meal="${key}" data-meal-field="fiber" type="number" value="${escapeHtml(meal.fiber || 0)}" /></div>
    </div>
    <div class="input-group"><label>Items, one per line</label><textarea data-plan-meal="${key}" data-meal-field="items">${escapeHtml((meal.items || []).join('\n'))}</textarea></div>
    <div class="input-group"><label>Recipe steps, one per line</label><textarea data-plan-meal="${key}" data-meal-field="recipeSteps">${escapeHtml(((meal.recipe && meal.recipe.steps) || []).join('\n'))}</textarea></div>
    <div class="input-group"><label>Recipe note</label><input data-plan-meal="${key}" data-meal-field="recipeNote" value="${escapeHtml(meal.recipe?.note || '')}" /></div>
  </div>`;
}


function exerciseDashboardHtml(day, workout, suggestion) {
  const chosenStatus = day.exercise.status || 'open';
  const suggestedSteps = workoutSuggestionSteps(day, workout);
  const suggestedLabel = suggestion.forceRecovery
    ? 'Recovery version'
    : (day.checkin.energy === 'Low' || day.checkin.sleep === 'Poor' || day.checkin.stress === 'High')
      ? 'Minimum win'
      : 'Full version';
  const minutes = day.exercise.minutes || (suggestion.forceRecovery ? 5 : suggestedLabel === 'Minimum win' ? 5 : 25);
  const statusText = chosenStatus === 'open' ? 'Not logged yet' : (exerciseStatusLabels[day.exercise.status] || chosenStatus);
  const complete = ['full', 'minimum', 'recovery'].includes(day.exercise.status);
  return `<div class="card">
    <div class="card-title">
      <div>
        <h3>Today’s movement choice</h3>
        <p>Pick the smallest version that keeps the habit alive and does not aggravate pain.</p>
      </div>
      <span class="badge ${complete ? '' : 'neutral'}">${escapeHtml(statusText)}</span>
    </div>
    <div class="grid three">
      <div class="metric"><span class="value">${escapeHtml(suggestedLabel)}</span><span class="label">suggested version</span><small>${escapeHtml(suggestion.label)}</small></div>
      <div class="metric"><span class="value">${escapeHtml(String(minutes))}</span><span class="label">starter minutes</span><small>edit if needed</small></div>
      <div class="metric"><span class="value">${escapeHtml(day.exercise.intensity || 'easy')}</span><span class="label">intensity</span><small>${escapeHtml(day.exercise.pain ? `pain: ${day.exercise.pain}` : 'pain not flagged')}</small></div>
    </div>
    <div class="callout" style="margin-top:14px;">
      <strong>Do this first</strong>
      <ul class="check-list mini-list">${suggestedSteps.slice(0, 3).map(step => `<li><span>✓</span><span>${escapeHtml(step)}</span></li>`).join('')}</ul>
    </div>
    <div class="toggle-row">
      <button class="secondary small" data-action="log-exercise-status" data-status="minimum">Log minimum win</button>
      <button class="ghost small" data-action="log-exercise-status" data-status="recovery">Log recovery</button>
      <button class="ghost small" data-action="open-guide" data-guide-id="${escapeHtml(guideIdForWorkout(workout))}">Movement guide</button>
    </div>
  </div>`;
}

function workoutChoiceHelpHtml(workout) {
  return `<div class="card">
    <h3>How to choose today</h3>
    <div class="stack small-stack">
      <p><strong>Full win:</strong> Use when energy is okay, pain is not flagged, and you can finish without rushing.</p>
      <p><strong>Minimum win:</strong> Use when you are tired, busy, low motivation, or just need to keep the chain alive.</p>
      <p><strong>Recovery:</strong> Use for soreness, stress, rough sleep, or any day where gentle movement is the smarter move.</p>
    </div>
    <p class="note">Default workout: ${escapeHtml(workout.title)} · ${escapeHtml(workout.quiet ? 'quiet apartment friendly' : 'normal movement')}</p>
  </div>`;
}

function routineProgressDetail(day) {
  const items = routineItemsForSelectedMode();
  const done = items.filter(item => day.routine.completedIds[item.id]).length;
  const total = items.length;
  const left = Math.max(0, total - done);
  const percent = total ? Math.round((done / total) * 100) : 0;
  return { items, done, total, left, percent };
}

function routineNextItemsHtml(day, limit = 4) {
  const items = routineItemsForSelectedMode();
  const next = items.filter(item => !day.routine.completedIds[item.id]).slice(0, limit);
  if (!next.length) return '<p class="note">All visible routine items are done for this mode.</p>';
  return `<ul class="routine-list">${next.map(item => `<li><span>○</span><span>${escapeHtml(item.text)}<br><small class="muted">~${item.minutes || 1} min</small></span><button class="ghost small" style="margin-left:auto" data-action="toggle-routine-item" data-id="${escapeHtml(item.id)}">done</button></li>`).join('')}</ul>`;
}

function routineDashboardHtml(day) {
  const detail = routineProgressDetail(day);
  return `<div class="card">
    <div class="card-title">
      <div>
        <h3>Routine status</h3>
        <p>See what is done, what is left, and the next small action.</p>
      </div>
      <span class="badge ${detail.percent >= 80 ? '' : 'neutral'}">${detail.percent}%</span>
    </div>
    <div class="grid three">
      <div class="metric"><span class="value">${detail.done}</span><span class="label">done</span><small>routine items</small></div>
      <div class="metric"><span class="value">${detail.left}</span><span class="label">left</span><small>${escapeHtml(selectedRoutineLabel())}</small></div>
      <div class="metric"><span class="value">${detail.total}</span><span class="label">total</span><small>current mode</small></div>
    </div>
    <div style="margin-top:14px;">
      <h3>Next up</h3>
      ${routineNextItemsHtml(day)}
    </div>
  </div>`;
}

function renderExercise() {
  setTitle('Exercise');
  const day = getDay();
  const workout = getWorkoutById(day.exercise.workoutId) || workoutForDate(appState.selectedDate);
  const suggestion = exerciseSuggestion(day);
  $('#app').innerHTML = `
    <section class="grid sidebar">
      <div class="grid">
        <div class="card highlight">
          <div class="card-title">
            <div>
              <h3>Exercise system</h3>
              <p>Beginner instructions, form cues, pain warnings, and a movement guide you can use before each exercise.</p>
            </div>
            <span class="badge ${suggestion.badge}">${escapeHtml(suggestion.label)}</span>
          </div>
          <p>${escapeHtml(suggestion.message)}</p>
          <div class="input-row three">
            <div class="input-group"><label>Today's workout</label><select data-field="exercise.workoutId">${appState.data.workouts.map(w => `<option value="${escapeHtml(w.id)}" ${day.exercise.workoutId === w.id ? 'selected' : ''}>${escapeHtml(w.title)}</option>`).join('')}</select></div>
            ${selectGroupPath('exercise.intensity', 'Intensity', day.exercise.intensity, ['easy', 'comfortable', 'challenging'])}
            <div class="input-group"><label>Minutes</label><input data-field="exercise.minutes" type="number" min="0" value="${escapeHtml(day.exercise.minutes || '')}" /></div>
          </div>
          <div class="input-row three" style="margin-top:10px;">
            ${selectGroupPath('exercise.soreness', 'Soreness', day.exercise.soreness, ['', 'None', 'Mild', 'Moderate', 'High'])}
            ${selectGroupPath('exercise.pain', 'Pain warning', day.exercise.pain, ['', 'No', 'Mild', 'Yes'])}
            ${selectGroupPath('exercise.status', 'Win type', day.exercise.status, ['', 'full', 'minimum', 'recovery', 'missed'], exerciseStatusLabels)}
          </div>
          <div class="input-group" style="margin-top:10px;"><label>Exercise note</label><textarea data-field="exercise.notes" placeholder="What felt easy, hard, painful, or better than expected?">${escapeHtml(day.exercise.notes || '')}</textarea></div>
          <div class="toggle-row">
            <button class="primary" data-action="log-exercise-status" data-status="full">Full win</button>
            <button class="secondary" data-action="log-exercise-status" data-status="minimum">Minimum win</button>
            <button class="ghost" data-action="log-exercise-status" data-status="recovery">Recovery</button>
            <button class="ghost" data-action="log-exercise-status" data-status="missed">Missed</button>
          </div>
        </div>

        ${exerciseDashboardHtml(day, workout, suggestion)}
        ${workoutChoiceHelpHtml(workout)}

        <div class="grid three">
          ${workoutVersionCard('Full version', workout.full, 'full')}
          ${workoutVersionCard('Minimum win', workout.minimum, 'minimum')}
          ${workoutVersionCard('Recovery version', workout.recovery, 'recovery')}
        </div>

        <div class="card highlight">
          <div class="card-title"><div><h3>Beginner movement guide</h3><p>Tap a movement to see plain-English instructions, what it should feel like, common mistakes, and when to stop.</p></div><button class="primary" data-action="jump" data-tab-target="guide">Open guide</button></div>
          <div class="guide-strip">${exerciseGuide.slice(0, 5).map(guideChip).join('')}</div>
        </div>

        <div class="card">
          <div class="card-title"><div><h3>Workout library</h3><p>Pick the routine that matches the day, not the routine you wish you had energy for.</p></div><span class="badge neutral">${appState.data.workouts.length} routines</span></div>
          <div class="library-grid">${appState.data.workouts.map(workoutLibraryCard).join('')}</div>
        </div>
      </div>

      <aside class="grid">
        <div class="card">
          <h3>Progression level</h3>
          <p>Keep this conservative. It changes how Pathfinder talks about the workout, not medical advice.</p>
          <div class="segmented">
            ${[1,2,3].map(level => `<button data-action="set-setting" data-setting="experienceLevel" data-value="${level}" class="${Number(appState.data.settings.experienceLevel) === level ? 'active' : ''}">Level ${level}</button>`).join('')}
          </div>
          <p class="note"><strong>Level 1:</strong> build habit. <strong>Level 2:</strong> add volume. <strong>Level 3:</strong> more stamina when recovery is good.</p>
        </div>
        <div class="card warning">
          <h3>Pain rule</h3>
          <p>If pain is marked “Yes,” Pathfinder recommends recovery instead of pushing. Sharp pain, chest pain, dizziness, or unusual shortness of breath means stop and get appropriate help.</p>
        </div>
        <div class="card">
          <h3>Add simple workout</h3>
          <div class="input-group"><label>Title</label><input id="workout-title" placeholder="Example: Hotel room reset" /></div>
          <div class="input-row two" style="margin-top:10px;">
            <div class="input-group"><label>Focus</label><input id="workout-focus" placeholder="posture, stamina..." /></div>
            <div class="input-group"><label>Level</label><input id="workout-level" type="number" min="1" max="3" value="1" /></div>
          </div>
          <div class="input-group" style="margin-top:10px;"><label>Full steps, one per line</label><textarea id="workout-full"></textarea></div>
          <div class="input-group"><label>Minimum steps, one per line</label><textarea id="workout-minimum"></textarea></div>
          <div class="toggle-row"><button class="primary" data-action="add-workout">Add workout</button></div>
        </div>
      </aside>
    </section>`;
}

function workoutVersionCard(title, steps, status) {
  const hints = {
    full: 'Best when time and energy are decent.',
    minimum: 'Best when tired, busy, or low motivation.',
    recovery: 'Best when sore, stressed, or protecting the habit.'
  };
  return `<div class="card flat">
    <div class="card-title"><h3>${escapeHtml(title)}</h3><span class="badge neutral">${escapeHtml(exerciseStatusLabels[status])}</span></div>
    <p class="note">${escapeHtml(hints[status] || '')}</p>
    <ul class="check-list">${(steps || []).map(item => `<li><span>✓</span><span>${escapeHtml(item)}</span></li>`).join('')}</ul>
    <div class="toggle-row"><button class="ghost small" data-action="log-exercise-status" data-status="${status}">Log this</button></div>
  </div>`;
}


function renderGuide() {
  setTitle('Guide');
  const selected = exerciseGuide.find(item => item.id === appState.selectedGuideId) || exerciseGuide[0];
  const tags = Array.from(new Set(exerciseGuide.flatMap(item => item.tags))).sort();
  $('#app').innerHTML = `
    <section class="grid wide-sidebar">
      <aside class="grid">
        <div class="card highlight">
          <div class="card-title"><div><h3>Beginner exercise guide</h3><p>Built for learning what the movements mean before you do them.</p></div><span class="badge blue">Beginner</span></div>
          <p>Use this like a simple instruction manual. The goal is safe, repeatable movement — not looking like a fitness influencer.</p>
        </div>
        <div class="card">
          <h3>Quick filters</h3>
          <div class="tag-cloud">${tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
          <p class="note">Use tags to scan for chair, quiet, posture, recovery, and no-floor movements.</p>
        </div>
        <div class="card warning">
          <h3>Safety rule</h3>
          <p>Discomfort from muscles working is okay. Sharp pain, chest pain, dizziness, numbness, or unusual shortness of breath means stop.</p>
        </div>
      </aside>
      <div class="grid">
        ${exerciseDetailCard(selected)}
        <div class="card">
          <div class="card-title"><div><h3>Movement library</h3><p>Plain-English cards for the exercises Pathfinder actually recommends.</p></div><span class="badge neutral">${exerciseGuide.length} movements</span></div>
          <div class="library-grid guide-library">${exerciseGuide.map(guideCard).join('')}</div>
        </div>
      </div>
    </section>`;
}


function formSnapshotHtml(item) {
  const cues = formCuesForExercise(item);
  return `<div class="form-snapshot">
    <div class="snapshot-card"><strong>1 · Set up</strong><p>${escapeHtml(cues.setup)}</p></div>
    <div class="snapshot-card"><strong>2 · Move</strong><p>${escapeHtml(cues.move)}</p></div>
    <div class="snapshot-card"><strong>3 · Check</strong><p>${escapeHtml(cues.check)}</p></div>
  </div>`;
}

function formCuesForExercise(item) {
  const cueMap = {
    'chair-sit-to-stand': { setup: 'Feet planted, chair behind you, chest tall.', move: 'Sit back slowly, touch the chair, then stand through your feet.', check: 'Knees point with toes; no sharp knee or back pain.' },
    'wall-angels': { setup: 'Back near wall, ribs relaxed, arms comfortable.', move: 'Slide arms only through the range your shoulders allow.', check: 'No forcing, shrugging, numbness, or tingling.' },
    'counter-pushup': { setup: 'Hands on sturdy counter, body in one long line.', move: 'Lower chest toward counter, then push away smoothly.', check: 'Hips do not sag; shoulders stay away from ears.' },
    'dead-bug': { setup: 'Lie on back, knees bent, belly gently braced.', move: 'Tap one heel at a time while breathing.', check: 'Low back stays controlled; neck stays relaxed.' },
    'bird-dog': { setup: 'Hands and knees, back flat like a table.', move: 'Reach one leg back; add opposite arm only if stable.', check: 'Hips stay square; move slower than you think.' },
    'counter-plank': { setup: 'Hands or forearms on counter, feet stepped back.', move: 'Brace belly and hold while breathing normally.', check: 'No hip sag, breath holding, or sharp back pain.' },
    'chair-march': { setup: 'Sit tall near chair edge and hold sides if needed.', move: 'Lift one knee at a time with a smooth rhythm.', check: 'Stay tall; stop if dizzy or hip pain appears.' },
    'easy-bike': { setup: 'Low resistance; knees should feel smooth.', move: 'Pedal easy, then settle into a talkable pace.', check: 'Warm effort is okay; grinding knees is not.' },
    'wall-posture-hold': { setup: 'Stand tall near wall without forcing head back.', move: 'Breathe slowly and lengthen through crown of head.', check: 'Neck stays relaxed; no headache or tingling.' },
    'hip-flexor-stretch': { setup: 'Split stance, hand on wall/chair for balance.', move: 'Tuck hips gently and shift forward slightly.', check: 'Mild front-hip stretch; no low-back arching.' }
  };
  return cueMap[item.id] || { setup: item.steps?.[0] || 'Set up slowly.', move: item.steps?.[1] || 'Move with control.', check: item.mistake || 'Stop for sharp pain.' };
}

function exerciseDetailCard(item) {
  return `<div class="card highlight guide-detail">
    <div class="card-title"><div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.category)} · ${escapeHtml(item.purpose)}</p></div><span class="badge">${escapeHtml(item.reps)}</span></div>
    ${exerciseSvg(item.id)}
    ${formSnapshotHtml(item)}
    <div class="grid two" style="margin-top:14px;">
      <div><h4>How to do it</h4><ol class="step-list">${item.steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ol></div>
      <div class="grid">
        <div class="callout"><strong>What it should feel like</strong><p>${escapeHtml(item.feel)}</p></div>
        <div class="callout"><strong>Beginner version</strong><p>${escapeHtml(item.easier)}</p></div>
        <div class="callout"><strong>Make it harder later</strong><p>${escapeHtml(item.harder)}</p></div>
      </div>
    </div>
    <div class="grid two" style="margin-top:14px;">
      <div class="callout warning"><strong>Common mistake</strong><p>${escapeHtml(item.mistake)}</p></div>
      <div class="callout dangerish"><strong>Stop if</strong><p>${escapeHtml(item.stop)}</p></div>
    </div>
    <div class="tag-cloud" style="margin-top:14px;">${item.tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
  </div>`;
}

function guideCard(item) {
  const active = item.id === appState.selectedGuideId;
  return `<button class="library-item guide-card ${active ? 'active' : ''}" data-action="open-guide" data-guide-id="${escapeHtml(item.id)}">
    <strong>${escapeHtml(item.name)}</strong>
    <small>${escapeHtml(item.category)} · ${escapeHtml(item.reps)}</small>
    <p class="note">${escapeHtml(item.purpose)}</p>
    <div class="tag-cloud small-tags">${item.tags.slice(0, 3).map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
  </button>`;
}

function guideChip(item) {
  return `<button class="pill-button" data-action="open-guide" data-guide-id="${escapeHtml(item.id)}">${escapeHtml(item.name)}</button>`;
}

function getGuideById(id) {
  return exerciseGuide.find(item => item.id === id) || exerciseGuide[0];
}

function guideIdForWorkout(workout) {
  const text = `${workout.title} ${(workout.full || []).join(' ')} ${(workout.minimum || []).join(' ')}`.toLowerCase();
  const matches = [
    ['wall-angels', 'wall angel'], ['chair-sit-to-stand', 'sit-to-stand'], ['counter-pushup', 'pushup'], ['dead-bug', 'dead bug'],
    ['bird-dog', 'bird dog'], ['counter-plank', 'plank'], ['chair-march', 'march'], ['easy-bike', 'bike'], ['wall-posture-hold', 'wall posture'], ['hip-flexor-stretch', 'hip flexor']
  ];
  return matches.find(([, needle]) => text.includes(needle))?.[0] || 'chair-sit-to-stand';
}

function exerciseSvg(id) {
  const item = getGuideById(id);
  const label = item.name;
  const title = escapeHtml(label);
  const caption = escapeHtml(item.category || 'Movement');
  const commonStart = `<div class="exercise-visual" aria-label="Simple position illustration for ${title}"><svg viewBox="0 0 420 180" role="img" aria-hidden="true"><rect x="1" y="1" width="418" height="178" rx="24" fill="rgba(255,255,255,.035)" stroke="rgba(255,255,255,.12)"/>`;
  const commonText = `<text x="210" y="54" fill="currentColor" font-size="17" font-weight="900">${title}</text><text x="210" y="80" fill="currentColor" font-size="13" opacity=".72">${caption}</text>`;
  const close = `</svg></div>`;
  const drawings = {
    'chair-sit-to-stand': `<path d="M70 142 H164 M92 142 V96 H145 V142" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" opacity=".7"/><circle cx="120" cy="45" r="15" fill="none" stroke="currentColor" stroke-width="7"/><path d="M120 61 L118 98 L94 132 M118 98 L144 132 M116 78 L88 96 M119 78 L151 88" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M172 70 L190 70 M181 61 L190 70 L181 79" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M248 142 H342 M270 142 V96 H322 V142" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" opacity=".45"/><circle cx="292" cy="41" r="13" fill="none" stroke="currentColor" stroke-width="6" opacity=".65"/><path d="M292 55 L292 98 L274 136 M292 98 L316 136 M292 74 L264 94 M292 74 L320 94" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity=".65"/>`,
    'wall-angels': `<path d="M70 24 V154" stroke="currentColor" stroke-width="8" stroke-linecap="round" opacity=".65"/><circle cx="128" cy="45" r="14" fill="none" stroke="currentColor" stroke-width="7"/><path d="M128 60 L128 116 M128 78 L100 62 M128 78 L156 62 M128 116 L110 148 M128 116 L146 148" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><path d="M88 84 C94 56 106 38 126 28 M168 84 C162 56 150 38 130 28" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="6 8" opacity=".65"/>`,
    'counter-pushup': `<path d="M250 60 H352 M250 60 V144 M352 60 V144 M238 144 H365" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" opacity=".65"/><circle cx="82" cy="65" r="13" fill="none" stroke="currentColor" stroke-width="7"/><path d="M96 76 L154 96 L238 68 M154 96 L112 144 M154 96 L190 144 M238 68 L250 60" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M208 55 L229 61 L210 75" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity=".7"/>`,
    'dead-bug': `<path d="M58 142 H178" stroke="currentColor" stroke-width="7" stroke-linecap="round" opacity=".45"/><circle cx="82" cy="92" r="13" fill="none" stroke="currentColor" stroke-width="7"/><path d="M95 98 L140 120 M116 110 L100 52 M126 115 L160 66 M140 120 L112 148 M140 120 L178 146" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M103 52 L92 66 M160 66 L145 70" stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity=".75"/>`,
    'bird-dog': `<circle cx="80" cy="76" r="13" fill="none" stroke="currentColor" stroke-width="7"/><path d="M94 82 L143 102 L196 83 M143 102 L118 142 M143 102 L166 142 M196 83 L230 62 M94 82 L62 108" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 148 H178" stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity=".35"/>`,
    'counter-plank': `<path d="M245 62 H350 M245 62 V144 M350 62 V144 M234 144 H364" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" opacity=".6"/><circle cx="72" cy="73" r="13" fill="none" stroke="currentColor" stroke-width="7"/><path d="M86 80 L150 98 L238 70 M150 98 L116 144 M150 98 L202 144" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M75 34 C118 24 174 26 220 45" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="7 8" opacity=".45"/>`,
    'chair-march': `<path d="M70 145 H160 M92 145 V96 H145 V145" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" opacity=".65"/><circle cx="118" cy="46" r="14" fill="none" stroke="currentColor" stroke-width="7"/><path d="M118 61 L118 104 M118 78 L92 96 M118 78 L146 96 M118 104 L94 138 M119 104 L154 116 L168 142" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M168 104 C186 96 190 124 172 132" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="5 7" opacity=".65"/>`,
    'easy-bike': `<circle cx="82" cy="128" r="28" fill="none" stroke="currentColor" stroke-width="8" opacity=".7"/><circle cx="166" cy="128" r="28" fill="none" stroke="currentColor" stroke-width="8" opacity=".7"/><path d="M82 128 L120 92 L166 128 M120 92 L136 128 M120 92 H152 M152 92 L170 76" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="124" cy="50" r="13" fill="none" stroke="currentColor" stroke-width="7"/><path d="M124 64 L136 94 L108 116 M136 94 L168 86" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>`,
    'wall-posture-hold': `<path d="M78 24 V154" stroke="currentColor" stroke-width="8" stroke-linecap="round" opacity=".65"/><circle cx="126" cy="45" r="14" fill="none" stroke="currentColor" stroke-width="7"/><path d="M126 61 L126 116 M126 78 L102 96 M126 78 L150 96 M126 116 L108 148 M126 116 L144 148" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><path d="M118 32 L135 32 M116 38 L138 38" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity=".45"/><path d="M95 24 C108 12 144 12 158 24" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="5 7" opacity=".55"/>`,
    'hip-flexor-stretch': `<circle cx="100" cy="50" r="14" fill="none" stroke="currentColor" stroke-width="7"/><path d="M100 66 L104 104 M104 82 L72 96 M104 82 L138 84 M104 104 L72 142 M104 104 L156 142" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M180 46 V146 M174 146 H205" stroke="currentColor" stroke-width="8" stroke-linecap="round" opacity=".55"/><path d="M66 142 H164" stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity=".35"/>`
  };
  return `${commonStart}${drawings[id] || drawings['chair-sit-to-stand']}${commonText}${close}`;
}

function renderRoutines() {
  setTitle('Routines');
  const day = getDay();
  const modeKey = appState.data.settings.routineMode || 'workday';
  const mode = selectedRoutineMode();
  $('#app').innerHTML = `
    <section class="grid sidebar">
      <div class="grid">
        <div class="card highlight">
          <div class="card-title">
            <div>
              <h3>Routine builder</h3>
              <p>Morning/night grooming, oral care, skin care, hand/foot/lip care, and the between-lunch-and-dinner movement block.</p>
            </div>
            <span class="badge">${routineCompletion(day)}% today</span>
          </div>
          <div class="segmented">
            ${Object.entries(appState.data.routines).map(([key, value]) => `<button data-action="set-setting" data-setting="routineMode" data-value="${key}" class="${modeKey === key ? 'active' : ''}">${escapeHtml(value.label || key)}</button>`).join('')}
          </div>
        </div>
        ${routineDashboardHtml(day)}
        <div class="grid three">
          ${ROUTINE_BLOCKS.map(block => routineBlockCard(block, mode[block] || [], day)).join('')}
        </div>
      </div>
      <aside class="grid">
        <div class="card">
          <h3>Add routine item</h3>
          <div class="input-group"><label>Mode</label><select id="routine-mode">${Object.keys(appState.data.routines).map(key => `<option value="${key}" ${key === modeKey ? 'selected' : ''}>${escapeHtml(appState.data.routines[key].label || key)}</option>`).join('')}</select></div>
          <div class="input-group" style="margin-top:10px;"><label>Block</label><select id="routine-block">${ROUTINE_BLOCKS.map(key => `<option value="${key}">${routineBlockLabel(key)}</option>`).join('')}</select></div>
          <div class="input-group" style="margin-top:10px;"><label>Item</label><input id="routine-text" placeholder="Example: Lay out workout clothes" /></div>
          <div class="input-group" style="margin-top:10px;"><label>Minutes</label><input id="routine-minutes" type="number" min="0" value="2" /></div>
          <div class="toggle-row"><button class="primary" data-action="add-routine-item">Add item</button></div>
        </div>
        <div class="card warning">
          <h3>Design rule</h3>
          <p>Routines should reduce thinking. If a card makes the night harder, remove it. Pathfinder is supposed to support the real day, not an imaginary perfect day.</p>
        </div>
      </aside>
    </section>`;
}

function routineBlockCard(block, items, day) {
  return `<div class="card flat">
    <div class="card-title"><h3>${routineBlockLabel(block)}</h3><span class="badge neutral">${items.filter(item => day.routine.completedIds[item.id]).length}/${items.length}</span></div>
    <ul class="routine-list">
      ${items.map(item => `<li class="${day.routine.completedIds[item.id] ? 'done' : ''}"><span>${day.routine.completedIds[item.id] ? '✓' : '○'}</span><span>${escapeHtml(item.text)}<br><small class="muted">~${item.minutes || 1} min</small></span><button class="ghost small" style="margin-left:auto" data-action="toggle-routine-item" data-id="${escapeHtml(item.id)}">${day.routine.completedIds[item.id] ? 'undo' : 'done'}</button><button class="danger small" data-action="remove-routine-item" data-block="${block}" data-id="${escapeHtml(item.id)}">×</button></li>`).join('')}
    </ul>
  </div>`;
}

function renderAssistant() {
  setTitle('Assistant');
  const day = getDay();
  const stats = weeklyStats(appState.selectedDate);
  const focus = companionFocus(day, stats);
  $('#app').innerHTML = `
    <section class="grid sidebar">
      <div class="grid">
        ${morningBriefCardHtml(day, stats)}
        ${nextActionStackHtml(day, stats)}
        <div class="grid two">
          ${eveningWindDownCoachHtml(day)}
          ${whatChangedCoachHtml(stats)}
        </div>
        <div class="card">
          <div class="card-title">
            <div>
              <h3>Upcoming focus</h3>
              <p>One useful direction. Not a whole life overhaul.</p>
            </div>
            <span class="badge neutral">${escapeHtml(focus.priority.label)}</span>
          </div>
          <div class="assistant-output">${escapeHtml(upcomingFocus(stats))}</div>
        </div>
      </div>
      <aside class="grid">
        ${bodyExpectationCoachHtml(stats)}
        <div class="card">
          <h3>Quick jumps</h3>
          <p>Go straight to the area Pathfinder thinks matters most.</p>
          <div class="toggle-row">
            <button class="primary small" data-action="jump" data-tab-target="${escapeHtml(focus.priority.action)}">Open ${escapeHtml(focus.priority.label)}</button>
            <button class="ghost small" data-action="jump" data-tab-target="meals">Meals</button>
            <button class="ghost small" data-action="jump" data-tab-target="exercise">Exercise</button>
            <button class="ghost small" data-action="jump" data-tab-target="review">Review</button>
          </div>
        </div>
        <div class="card">
          <h3>Copy companion packet</h3>
          <p>Copy the current brief, weekly pattern, and rough expectation if you want deeper analysis later.</p>
          <div class="toggle-row"><button class="secondary small" data-action="copy-companion-packet">Copy packet</button></div>
        </div>
        <div class="card">
          <h3>Assistant settings</h3>
          <div class="input-group"><label>Tone</label><select data-setting-field="assistantTone"><option value="friendly" ${appState.data.settings.assistantTone === 'friendly' ? 'selected' : ''}>Friendly</option><option value="direct" ${appState.data.settings.assistantTone === 'direct' ? 'selected' : ''}>Direct</option><option value="gentle" ${appState.data.settings.assistantTone === 'gentle' ? 'selected' : ''}>Gentle</option></select></div>
          <div class="toggle-row"><button class="${appState.data.settings.morningBrief ? 'primary' : 'secondary'}" data-action="toggle-setting" data-setting="morningBrief">Morning brief ${appState.data.settings.morningBrief ? 'on' : 'off'}</button><button class="${appState.data.settings.windDown ? 'primary' : 'secondary'}" data-action="toggle-setting" data-setting="windDown">Wind-down ${appState.data.settings.windDown ? 'on' : 'off'}</button></div>
        </div>
      </aside>
    </section>`;
}

function formatSignedNumber(value, decimals = 1, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const fixed = Number(value).toFixed(decimals);
  return `${Number(value) > 0 ? '+' : ''}${fixed}${suffix}`;
}

function weightTrendDetail(stats) {
  const change = stats.weightChange;
  const weights = stats.weights || [];
  if (!weights.length) {
    return {
      label: 'No weigh-ins yet',
      badgeClass: 'neutral',
      changeText: '—',
      meaning: 'Log weight a few times this week before judging progress.',
      action: 'Add a weigh-in on Today when convenient.'
    };
  }
  if (weights.length === 1 || change === null) {
    return {
      label: 'One weigh-in',
      badgeClass: 'blue',
      changeText: '—',
      meaning: 'One weigh-in is useful, but it is not a trend.',
      action: 'Get 2–3 more weigh-ins before making conclusions.'
    };
  }
  if (change <= -1) {
    return {
      label: 'Trending down',
      badgeClass: '',
      changeText: formatSignedNumber(change, 1, ' lb'),
      meaning: 'The 7-day direction is down. Keep the plan steady unless energy, sleep, or hunger are getting rough.',
      action: 'Repeat the boring version: log food, hit minimum movement, and keep water steady.'
    };
  }
  if (change >= 1) {
    return {
      label: 'Trending up',
      badgeClass: 'warn',
      changeText: formatSignedNumber(change, 1, ' lb'),
      meaning: 'The 7-day direction is up, but a one-week jump can be water, sodium, soreness, sleep, timing, or logging gaps.',
      action: 'Do a 3-day tighten-up: log meals honestly, drink water earlier, and do minimum movement.'
    };
  }
  return {
    label: 'Mostly steady',
    badgeClass: 'blue',
    changeText: formatSignedNumber(change, 1, ' lb'),
    meaning: 'The scale is mostly steady this week. This is still useful feedback.',
    action: 'Focus on consistency before changing calories.'
  };
}

function progressComparison(stats) {
  const previous = weeklyStats(shiftDate(stats.start, -1));
  return {
    scoreDelta: stats.score - previous.score,
    mealDelta: stats.mealLogDays - previous.mealLogDays,
    workoutDelta: stats.workouts - previous.workouts,
    calorieDelta: stats.avgLoggedCalories && previous.avgLoggedCalories ? stats.avgLoggedCalories - previous.avgLoggedCalories : null
  };
}

function progressDashboardHtml(stats, lastWeight) {
  const trend = weightTrendDetail(stats);
  const comparison = progressComparison(stats);
  return `<div class="card highlight">
    <div class="card-title">
      <div>
        <h3>Progress direction</h3>
        <p>Use the trend and the behavior data together. The scale alone is too noisy.</p>
      </div>
      <span class="badge ${trend.badgeClass}">${escapeHtml(trend.label)}</span>
    </div>
    <div class="grid four">
      <div class="metric"><span class="value">${lastWeight ? lastWeight.value.toFixed(1) : '—'}</span><span class="label">latest weight</span><small>${lastWeight ? formatDate(lastWeight.key, 'short') : 'log first weigh-in'}</small></div>
      <div class="metric"><span class="value">${escapeHtml(trend.changeText)}</span><span class="label">7-day scale change</span><small>${(stats.weights || []).length} weigh-in${(stats.weights || []).length === 1 ? '' : 's'}</small></div>
      <div class="metric"><span class="value">${formatSignedNumber(comparison.scoreDelta, 0, '%')}</span><span class="label">score vs prior week</span><small>routine direction</small></div>
      <div class="metric"><span class="value">${formatSignedNumber(comparison.workoutDelta, 0, '')}</span><span class="label">movement days change</span><small>${stats.workouts}/7 this week</small></div>
    </div>
    <p class="note"><strong>What this means:</strong> ${escapeHtml(trend.meaning)}</p>
    <p class="note"><strong>Next move:</strong> ${escapeHtml(trend.action)}</p>
  </div>`;
}

function scaleContextText(stats) {
  const issues = [];
  if (stats.weightChange !== null && stats.weightChange >= 1) issues.push('the scale is up this week');
  if (stats.waterDays < 4) issues.push('water goal was hit fewer than 4 days');
  if (stats.workouts >= 3) issues.push('workouts can temporarily increase soreness and water retention');
  if (stats.mealLogDays < 5) issues.push('food logs are incomplete enough to blur the projection');
  if (!issues.length) return 'Nothing here screams panic. Keep watching the 2–3 week direction instead of reacting to one weigh-in.';
  return `Possible scale noise: ${issues.join(', ')}. That does not mean progress failed; it means the next few days should be boring and consistent.`;
}

function progressMeaningCardHtml(stats, lastWeight) {
  const trend = weightTrendDetail(stats);
  const quality = stats.mealLogDays >= 5 && stats.weights.length >= 2 ? 'good' : stats.mealLogDays >= 3 || stats.weights.length >= 2 ? 'partial' : 'thin';
  const qualityText = quality === 'good'
    ? 'There is enough data to use the trend as a useful direction check.'
    : quality === 'partial'
      ? 'There is some useful data, but missing logs can still make the story fuzzy.'
      : 'The data is still thin. Build the record before judging the plan.';
  return `<div class="card">
    <h3>What this means</h3>
    <p>${escapeHtml(progressNarrative(stats, lastWeight))}</p>
    <p class="note"><strong>Data quality:</strong> ${escapeHtml(qualityText)}</p>
    <p class="note"><strong>Practical move:</strong> ${escapeHtml(trend.action)}</p>
  </div>`;
}

function scaleContextCardHtml(stats) {
  return `<div class="card warning">
    <h3>Scale context</h3>
    <p>${escapeHtml(scaleContextText(stats))}</p>
    <p class="note">Daily weight can swing from water, sodium, soreness, sleep, stress, bathroom timing, and carb intake. Pathfinder should adjust from patterns, not panic.</p>
  </div>`;
}

function minimumWinsProgressCardHtml(stats) {
  const movementText = stats.workouts >= 4
    ? 'Movement showed up well this week.'
    : stats.workouts >= 2
      ? 'Movement is present, but the minimum-win button should stay easy to reach.'
      : 'Movement needs to be smaller before it can become automatic.';
  return `<div class="card">
    <h3>Behavior trend</h3>
    <p>${escapeHtml(movementText)}</p>
    <div class="grid two">
      <div class="metric"><span class="value">${stats.minimumWins}</span><span class="label">minimum wins</span><small>habit protected</small></div>
      <div class="metric"><span class="value">${stats.fullWorkouts}</span><span class="label">full workouts</span><small>do not force these</small></div>
    </div>
    <p class="note">${stats.recoveryDays} recovery day(s). Recovery still counts when it protects consistency.</p>
  </div>`;
}

function renderProgress() {
  setTitle('Progress');
  const stats = weeklyStats(appState.selectedDate);
  const lastWeight = getLastWeight();
  const startWeight = Number(appState.data.settings.startingWeight || 0);
  const goalWeight = Number(appState.data.settings.goalWeight || 0);
  const currentWeight = lastWeight?.value || startWeight || 0;
  const lost = startWeight && currentWeight ? Number((startWeight - currentWeight).toFixed(1)) : 0;
  const remaining = currentWeight && goalWeight ? Number((currentWeight - goalWeight).toFixed(1)) : 0;
  $('#app').innerHTML = `
    <section class="grid">
      <div class="grid four">
        <div class="metric"><span class="value">${currentWeight ? currentWeight.toFixed(1) : '—'}</span><span class="label">latest weight</span><small>${lastWeight ? formatDate(lastWeight.key, 'short') : 'No weight yet'}</small></div>
        <div class="metric"><span class="value">${lost > 0 ? '-' : ''}${Math.abs(lost).toFixed(1)}</span><span class="label">from start</span><small>start ${startWeight || '—'} lb</small></div>
        <div class="metric"><span class="value">${remaining > 0 ? remaining.toFixed(1) : '—'}</span><span class="label">to goal</span><small>goal ${goalWeight || '—'} lb</small></div>
        <div class="metric"><span class="value">${currentStreak(appState.selectedDate)}</span><span class="label">logging streak</span><small>days with any score</small></div>
      </div>

      ${progressDashboardHtml(stats, lastWeight)}

      <div class="grid two">
        <div class="card chart-card"><div class="card-title"><div><h3>Weight trend</h3><p>Includes recent weights and a 7-day average when enough data exists.</p></div></div><canvas id="weight-chart" width="960" height="360"></canvas></div>
        <div class="card chart-card"><div class="card-title"><div><h3>Non-scale wins</h3><p>Meals, movement, wind-down, and routine completion.</p></div></div><canvas id="habit-chart" width="960" height="360"></canvas></div>
      </div>

      <div class="grid three">
        ${progressMeaningCardHtml(stats, lastWeight)}
        ${projectionCardHtml(readDay(appState.selectedDate), stats)}
        ${scaleContextCardHtml(stats)}
      </div>

      <div class="grid two">
        ${minimumWinsProgressCardHtml(stats)}
        <div class="card">
          <h3>Trend rule</h3>
          <p>Do not change the plan from one noisy weigh-in. Look for the 2–3 week direction, then adjust the easiest lever first.</p>
          <p class="note">Easiest levers: complete meal logging, minimum movement, water earlier in the day, and sleep/wind-down consistency.</p>
        </div>
      </div>
    </section>`;
  drawWeightChart();
  drawHabitChart(stats);
}

function dailyWinsList(day) {
  const wins = [];
  if (mealLogComplete(day)) wins.push('Food loop closed');
  else if (MEAL_KEYS.some(key => mealLogged(day, key))) wins.push('Some food logged');
  if (day.exercise.status === 'full') wins.push('Full workout completed');
  if (day.exercise.status === 'minimum') wins.push('Minimum movement protected the habit');
  if (day.exercise.status === 'recovery') wins.push('Recovery movement counted');
  if (routineCompletion(day) >= 80) wins.push('Routine mostly finished');
  else if (routineCompletion(day) >= 40) wins.push('Routine started');
  if (day.windDown.completed) wins.push('Wind-down completed');
  if (Number(day.checkin.water || 0) >= Number(appState.data.settings.waterGoal || 8)) wins.push('Water goal hit');
  if (!wins.length) wins.push('You still created data Pathfinder can use');
  return wins;
}

function dailyAdjustmentsList(day) {
  const items = [];
  if (!mealLogComplete(day)) items.push('Close food gaps with a quick estimate instead of leaving blanks.');
  if (!['full','minimum','recovery'].includes(day.exercise.status)) items.push('Use the minimum-win movement option before the day gets away from you.');
  if (routineCompletion(day) < 60) items.push('Shrink the routine to the next one or two useful actions.');
  if (!day.windDown.completed) items.push('End with a one-sentence wind-down. No long journal required.');
  if (Number(day.checkin.water || 0) < Number(appState.data.settings.waterGoal || 8)) items.push('Start water earlier tomorrow instead of catching up at night.');
  if (!items.length) items.push('Do not add complexity tomorrow. Repeat the same boring win.');
  return items;
}

function dailyNextBestStep(day) {
  if (!mealLogComplete(day)) return 'Log or estimate the missing meal slots.';
  if (!['full','minimum','recovery'].includes(day.exercise.status)) return 'Take the minimum-win movement option.';
  if (routineCompletion(day) < 60) return 'Do the next unfinished routine item.';
  if (!day.windDown.completed) return 'Write the one-sentence wind-down.';
  return 'Set up tomorrow to be easy: food, water, and a tiny movement plan.';
}

function dailyReviewCardHtml(day) {
  const score = completionScore(day);
  const wins = dailyWinsList(day);
  const adjustments = dailyAdjustmentsList(day);
  const note = day.dailyNote || day.checkin.notes || day.exercise.notes || day.windDown.note || '';
  const badge = score >= 75 ? '' : score >= 45 ? 'blue' : 'neutral';
  return `<div class="card highlight">
    <div class="card-title">
      <div>
        <h3>Evening review</h3>
        <p>Close the day with useful feedback, not judgment.</p>
      </div>
      <span class="badge ${badge}">${score}% today</span>
    </div>
    <div class="grid three">
      <div class="metric"><span class="value">${mealLogComplete(day) ? 'closed' : `${mealLogCount(day)}/3`}</span><span class="label">food loop</span><small>${plannedMealCount(day)}/3 ate plan</small></div>
      <div class="metric"><span class="value">${escapeHtml(day.exercise.status ? exerciseStatusLabels[day.exercise.status] || day.exercise.status : 'open')}</span><span class="label">movement</span><small>${day.exercise.minutes || 0} min</small></div>
      <div class="metric"><span class="value">${routineCompletion(day)}%</span><span class="label">routine</span><small>${day.windDown.completed ? 'wind-down done' : 'wind-down open'}</small></div>
    </div>
    <div class="grid two" style="margin-top:14px;">
      <div>
        <h3>What went well</h3>
        <ul class="check-list mini-list">${wins.map(item => `<li><span>✓</span><span>${escapeHtml(item)}</span></li>`).join('')}</ul>
      </div>
      <div>
        <h3>What to adjust</h3>
        <ul class="check-list mini-list">${adjustments.slice(0, 4).map(item => `<li><span>→</span><span>${escapeHtml(item)}</span></li>`).join('')}</ul>
      </div>
    </div>
    <p class="note"><strong>Next best step:</strong> ${escapeHtml(dailyNextBestStep(day))}</p>
    ${note ? `<p class="note"><strong>Note:</strong> ${escapeHtml(note)}</p>` : ''}
  </div>`;
}

function weeklyReviewDashboardHtml(stats) {
  const trend = weightTrendDetail(stats);
  const prior = weeklyStats(shiftDate(stats.start, -1));
  const scoreDelta = stats.score - prior.score;
  const mealDelta = stats.mealLogDays - prior.mealLogDays;
  const movementDelta = stats.workouts - prior.workouts;
  const badge = stats.score >= 75 ? '' : stats.score >= 45 ? 'blue' : 'neutral';
  return `<div class="card">
    <div class="card-title">
      <div>
        <h3>Weekly dashboard</h3>
        <p>Pattern check for the last seven days.</p>
      </div>
      <span class="badge ${badge}">${stats.score}% week</span>
    </div>
    <div class="grid four">
      <div class="metric"><span class="value">${deltaText(scoreDelta, '%')}</span><span class="label">score change</span><small>vs prior 7 days</small></div>
      <div class="metric"><span class="value">${deltaText(mealDelta, '')}</span><span class="label">meal-log days</span><small>${stats.mealLogDays}/7 this week</small></div>
      <div class="metric"><span class="value">${deltaText(movementDelta, '')}</span><span class="label">movement days</span><small>${stats.workouts}/7 this week</small></div>
      <div class="metric"><span class="value">${escapeHtml(trend.changeText)}</span><span class="label">scale direction</span><small>${escapeHtml(trend.label)}</small></div>
    </div>
    <p class="note"><strong>Weekly read:</strong> ${escapeHtml(trend.meaning)}</p>
  </div>`;
}

function weeklyCoachCardsHtml(stats) {
  const weakest = weakestMeal(stats);
  const win = weeklyWin(stats).split('\n').map(line => line.replace(/^- /, '')).filter(Boolean);
  const friction = weeklyFriction(stats, weakest).split('\n').map(line => line.replace(/^- /, '')).filter(Boolean);
  return `<div class="grid three">
    <div class="card">
      <h3>What went well</h3>
      <ul class="check-list mini-list">${win.map(item => `<li><span>✓</span><span>${escapeHtml(item)}</span></li>`).join('')}</ul>
    </div>
    <div class="card">
      <h3>What got in the way</h3>
      <ul class="check-list mini-list">${friction.map(item => `<li><span>→</span><span>${escapeHtml(item)}</span></li>`).join('')}</ul>
    </div>
    <div class="card">
      <h3>Next best focus</h3>
      <p>${escapeHtml(nextWeekSuggestion(stats))}</p>
      <p class="note">Keep this small enough to do after a long workday.</p>
    </div>
  </div>`;
}

function weeklyReviewPacketHtml(stats) {
  return `<div class="card">
    <div class="card-title">
      <div>
        <h3>Weekly review packet</h3>
        <p>Copy-ready version for deeper analysis later.</p>
      </div>
      <span class="badge neutral">${formatDate(stats.start, 'short')} – ${formatDate(stats.end, 'short')}</span>
    </div>
    <div class="review-output">${escapeHtml(buildWeeklyReview(stats))}</div>
  </div>`;
}

function renderReview() {
  setTitle('Review');
  const day = readDay(appState.selectedDate);
  const stats = weeklyStats(appState.selectedDate);
  $('#app').innerHTML = `
    <section class="grid">
      ${dailyReviewCardHtml(day)}
      ${weeklyReviewDashboardHtml(stats)}
      ${weeklyCoachCardsHtml(stats)}
      <section class="grid sidebar">
        ${weeklyReviewPacketHtml(stats)}
        <aside class="grid">
          <div class="card">
            <h3>Week stats</h3>
            <div class="grid two">
              <div class="metric"><span class="value">${stats.score}%</span><span class="label">avg score</span></div>
              <div class="metric"><span class="value">${stats.workouts}/7</span><span class="label">movement</span></div>
              <div class="metric"><span class="value">${stats.mealLogDays}/7</span><span class="label">meal log days</span></div>
              <div class="metric"><span class="value">${stats.windDowns}/7</span><span class="label">wind-downs</span></div>
            </div>
          </div>
          <div class="card">
            <h3>Copy review</h3>
            <p>Use this if you want to paste the review back into chat for deeper analysis later.</p>
            <div class="toggle-row">
              <button class="primary" data-action="copy-review">Copy review</button>
              <button class="secondary" data-action="copy-ai-summary">Copy AI packet</button>
            </div>
          </div>
          <div class="card">
            <h3>Review rule</h3>
            <p>End the day by choosing the next easiest action. Do not punish yourself into a harder plan.</p>
            <p class="note">The win is making tomorrow easier to start.</p>
          </div>
        </aside>
      </section>
    </section>`;
}
function renderHistory() {
  setTitle('History');
  const rows = historyRows(30);
  $('#app').innerHTML = `
    <section class="grid">
      <div class="card highlight">
        <div class="card-title"><div><h3>Daily history</h3><p>Calendar cards make it easier to spot patterns: meals, movement, check-ins, water, and notes.</p></div><span class="badge neutral">last 30 days</span></div>
        <div class="calendar-grid">${rows.slice(-28).map(historyDayCard).join('')}</div>
      </div>
      <div class="card">
        <div class="card-title"><div><h3>Exportable table</h3><p>CSV export is still here for Excel/Sheets analysis.</p></div><button class="primary" data-action="export-csv">Export CSV</button></div>
        <div class="table-wrap"><table><thead><tr><th>Date</th><th>Score</th><th>Meal statuses</th><th>Ate plan</th><th>Calories</th><th>Exercise</th><th>Minutes</th><th>Water</th><th>Weight</th><th>Energy</th><th>Note</th></tr></thead><tbody>${rows.map(historyRowHtml).join('')}</tbody></table></div>
      </div>
    </section>`;
}


function storageCandidateSummary(label, raw) {
  const parsed = parseStateCandidate(raw, label);
  if (!parsed) {
    return { label, exists: false, version: '', updatedAt: '', days: 0, meaningfulDays: 0, bytes: raw ? raw.length : 0 };
  }
  const days = Object.values(parsed.parsed.days || {});
  return {
    label,
    exists: true,
    version: parsed.parsed.version || '',
    updatedAt: parsed.parsed.meta?.updatedAt || parsed.parsed.meta?.createdAt || '',
    days: days.length,
    meaningfulDays: days.filter(dayHasUserData).length,
    bytes: raw.length
  };
}

function storageDiagnostics() {
  return [
    storageCandidateSummary('localStorage primary', safeLocalGet(STORAGE_KEY)),
    storageCandidateSummary('localStorage backup', safeLocalGet(STORAGE_BACKUP_KEY)),
    storageCandidateSummary('sessionStorage refresh fallback', safeSessionGet(SESSION_STORAGE_KEY))
  ];
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  if (value >= 1024) return `${Math.round(value / 1024)} KB`;
  return `${value} B`;
}

function formatStoredDate(value) {
  if (!value) return 'not recorded';
  try { return new Date(value).toLocaleString(); }
  catch { return value; }
}

function storageDiagnosticsRowsHtml() {
  return storageDiagnostics().map(item => `
    <div class="storage-row">
      <div>
        <strong>${escapeHtml(item.label)}</strong>
        <small>${item.exists ? `${item.meaningfulDays}/${item.days} meaningful days · version ${escapeHtml(item.version || 'unknown')}` : 'not found'}</small>
      </div>
      <div class="right-text">
        <small>${escapeHtml(formatBytes(item.bytes))}</small>
        <small>${escapeHtml(formatStoredDate(item.updatedAt))}</small>
      </div>
    </div>
  `).join('');
}

function updateSafetyCardHtml() {
  const settings = appState.data.settings || {};
  const release = window.__PATHFINDER_RELEASE__ || {};
  const lastResult = settings.lastSaveTestResult || 'Not run yet';
  const resultBadge = lastResult.includes('passed') ? '' : lastResult === 'Not run yet' ? 'neutral' : 'warn';
  return `<div class="card update-safety-card">
    <div class="card-title">
      <div>
        <h3>Update safety</h3>
        <p>Use this before and after each Pathfinder update.</p>
      </div>
      <span class="badge blue">${escapeHtml(APP_VERSION)}</span>
    </div>
    <div class="stack small-stack">
      <small>Release: ${escapeHtml(release.release || `Pathfinder ${APP_VERSION}`)}</small>
      <small>Core app.js: ${escapeHtml(release.coreAppVersion || APP_VERSION)}</small>
      <small>Bootstrap: ${escapeHtml(release.bootstrapVersion || 'removed')}</small>
      <small>Service worker cache: ${escapeHtml(release.serviceWorkerCache || 'pathfinder-' + APP_VERSION)}</small>
      <small>Loaded saved state from: ${escapeHtml(storageLoadSource || 'unknown')}</small>
      <small>Last saved: ${escapeHtml(formatStoredDate(appState.data.meta?.updatedAt))}</small>
    </div>
    <div class="toggle-row" style="margin-top:12px;">
      <button class="primary small" data-action="run-save-test">Run save test</button>
      <button class="ghost small" data-action="export-json">Export backup</button>
      <button class="ghost small" data-action="copy-storage-debug">Copy debug info</button>
    </div>
    <p class="note"><strong>Save test:</strong> <span class="badge ${resultBadge}">${escapeHtml(lastResult)}</span>${settings.lastSaveTestAt ? ` · ${escapeHtml(formatStoredDate(settings.lastSaveTestAt))}` : ''}</p>
  </div>`;
}

function storageDebugCardHtml() {
  const diagnostics = storageDiagnostics();
  const anyMissing = diagnostics.filter(item => !item.exists).length;
  const badge = storageLastError ? 'warn' : anyMissing >= diagnostics.length ? 'warn' : '';
  return `<div class="card storage-debug-card">
    <div class="card-title">
      <div>
        <h3>Storage debug</h3>
        <p>Quick view of the saved copies Pathfinder can recover from.</p>
      </div>
      <span class="badge ${badge}">${storageLastError ? 'Warning' : 'Ready'}</span>
    </div>
    <div class="stack small-stack">
      ${storageDiagnosticsRowsHtml()}
    </div>
    ${storageLastError ? `<p class="note"><strong>Last storage warning:</strong> ${escapeHtml(storageLastError)}</p>` : '<p class="note">Primary, backup, and refresh fallback are checked without changing your data.</p>'}
  </div>`;
}

function storageDebugPacket() {
  const selectedDay = appState.data.days?.[appState.selectedDate] || null;
  return {
    appVersion: APP_VERSION,
    release: window.__PATHFINDER_RELEASE__ || null,
    selectedDate: appState.selectedDate,
    activeTab: appState.activeTab,
    storageLoadSource,
    storageLastError,
    updatedAt: appState.data.meta?.updatedAt || '',
    storageDiagnostics: storageDiagnostics(),
    selectedDaySummary: selectedDay ? {
      mealStatuses: selectedDay.meals?.statuses || {},
      mealNotes: selectedDay.meals?.notes || {},
      exercise: selectedDay.exercise || {},
      checkin: selectedDay.checkin || {},
      weight: selectedDay.weight || '',
      score: completionScore(selectedDay)
    } : null
  };
}

async function copyStorageDebugInfo() {
  const text = JSON.stringify(storageDebugPacket(), null, 2);
  try {
    await navigator.clipboard.writeText(text);
    showToast('Debug info copied');
  } catch {
    console.log('Pathfinder storage debug info:', text);
    showToast('Clipboard blocked; debug info printed to console');
  }
}

function runSaveTest() {
  const testKey = 'pathfinder.save-test.v1';
  const payload = JSON.stringify({
    app: 'Pathfinder',
    version: APP_VERSION,
    writtenAt: new Date().toISOString(),
    random: Math.random().toString(36).slice(2)
  });

  const results = [];

  try {
    localStorage.setItem(testKey, payload);
    results.push(localStorage.getItem(testKey) === payload ? 'localStorage passed' : 'localStorage failed verification');
    localStorage.removeItem(testKey);
  } catch (error) {
    results.push(`localStorage failed: ${error.message || error}`);
  }

  try {
    sessionStorage.setItem(testKey, payload);
    results.push(sessionStorage.getItem(testKey) === payload ? 'sessionStorage passed' : 'sessionStorage failed verification');
    sessionStorage.removeItem(testKey);
  } catch (error) {
    results.push(`sessionStorage failed: ${error.message || error}`);
  }

  const passed = results.some(result => result.includes('passed'));
  appState.data.settings.lastSaveTestAt = new Date().toISOString();
  appState.data.settings.lastSaveTestResult = passed ? `passed · ${results.join(' · ')}` : `failed · ${results.join(' · ')}`;
  saveState();
  render();
  showToast(passed ? 'Save test passed' : 'Save test failed');
}

function renderSettings() {
  setTitle('Settings');
  const settings = appState.data.settings;
  $('#app').innerHTML = `
    <section class="grid sidebar">
      <div class="card highlight">
        <div class="card-title"><div><h3>Settings</h3><p>Local-first app data. Nothing leaves this browser unless you export it.</p></div></div>
        <div class="input-row three">
          ${settingInput('name', 'Name', settings.name, 'text')}
          ${settingInput('startingWeight', 'Starting weight', settings.startingWeight, 'number')}
          ${settingInput('goalWeight', 'Goal weight', settings.goalWeight, 'number')}
          ${settingInput('calorieGoal', 'Calorie goal', settings.calorieGoal, 'number')}
          ${settingInput('waterGoal', 'Water goal cups', settings.waterGoal, 'number')}
          ${settingInput('exerciseWindow', 'Exercise window', settings.exerciseWindow, 'text')}
          ${settingInput('bedtimeBufferHours', 'Bedtime buffer hours', settings.bedtimeBufferHours, 'number')}
          <div class="input-group"><label>Default routine mode</label><select data-setting-field="routineMode">${Object.keys(appState.data.routines).map(key => `<option value="${key}" ${settings.routineMode === key ? 'selected' : ''}>${escapeHtml(appState.data.routines[key].label || key)}</option>`).join('')}</select></div>
        </div>
        <div class="card flat tdee-settings">
          <div class="card-title"><div><h3>TDEE inputs</h3><p>Used for bodyweight expectations and at-this-pace projections.</p></div><span class="badge neutral">${Math.round(tdeeEstimate().tdee || settings.maintenanceCalories || 0)} kcal/day</span></div>
          <div class="input-row three">
            <div class="input-group"><label>Sex</label><select data-setting-field="sex"><option value="male" ${settings.sex === 'male' ? 'selected' : ''}>Male</option><option value="female" ${settings.sex === 'female' ? 'selected' : ''}>Female</option></select></div>
            ${settingInput('age', 'Age', settings.age, 'number')}
            ${settingInput('heightFeet', 'Height feet', settings.heightFeet, 'number')}
            ${settingInput('heightInches', 'Height inches', settings.heightInches, 'number')}
            <div class="input-group"><label>Baseline activity</label><select data-setting-field="activityLevel"><option value="sedentary" ${settings.activityLevel === 'sedentary' ? 'selected' : ''}>Mostly sitting / baseline</option><option value="light" ${settings.activityLevel === 'light' ? 'selected' : ''}>Lightly active</option><option value="moderate" ${settings.activityLevel === 'moderate' ? 'selected' : ''}>Moderately active</option><option value="active" ${settings.activityLevel === 'active' ? 'selected' : ''}>Very active</option></select></div>
            ${settingInput('maintenanceCalories', 'Manual fallback maintenance', settings.maintenanceCalories, 'number')}
          </div>
          <p class="note">Pathfinder uses a TDEE estimate from your body stats, then adds logged exercise calories for the projection. It is still an estimate, but it reacts better to current weight and actual workouts.</p>
        </div>
        <div class="card flat weather-settings-card">
          <div class="card-title"><div><h3>Weather snippet</h3><p>Used on Today for current conditions and the next few hours.</p></div><span class="badge ${settings.weatherEnabled ? '' : 'neutral'}">${settings.weatherEnabled ? 'On' : 'Off'}</span></div>
          <div class="input-row three">
            <div class="input-group"><label>Weather</label><select data-setting-field="weatherEnabled"><option value="true" ${settings.weatherEnabled ? 'selected' : ''}>On</option><option value="false" ${!settings.weatherEnabled ? 'selected' : ''}>Off</option></select></div>
            ${settingInput('weatherLocation', 'Location label', settings.weatherLocation || '', 'text')}
            ${settingInput('weatherLatitude', 'Latitude', settings.weatherLatitude ?? '', 'number')}
            ${settingInput('weatherLongitude', 'Longitude', settings.weatherLongitude ?? '', 'number')}
          </div>
          <p class="note">Default is Muskogee, OK. Use latitude/longitude for the place Pathfinder should check. Weather uses Open-Meteo when online and quietly falls back when offline.</p>
          <div class="toggle-row"><button class="ghost" data-action="refresh-weather">Refresh weather now</button></div>
        </div>
      </div>
      <aside class="grid">
        ${updateSafetyCardHtml()}
        ${storageDebugCardHtml()}
        <div class="card">
          <h3>Storage status</h3>
          <p>Saved on this device/browser. Cloud sync starts in 0.9.</p>
          <div class="stack small-stack">
            <span class="badge ${storageLastError ? 'danger' : ''}">${storageLastError ? 'Storage warning' : 'Local save ready'}</span>
            <small>Loaded from: ${escapeHtml(storageLoadSource)}</small>
            <small>Last saved: ${escapeHtml(appState.data.meta?.updatedAt ? new Date(appState.data.meta.updatedAt).toLocaleString() : 'Not saved yet')}</small>
            ${storageLastError ? `<small>${escapeHtml(storageLastError)}</small>` : ''}
          </div>
          <div class="toggle-row" style="margin-top:12px;"><button class="ghost small" data-action="force-save">Save now</button></div>
        </div>
        <div class="card">
          <h3>Backup / restore</h3>
          <p>Use this before switching devices or testing risky changes.</p>
          <div class="toggle-row">
            <button class="primary" data-action="export-json">Export backup</button>
            <label class="secondary" style="display:inline-flex;align-items:center;gap:8px;border-radius:999px;padding:10px 14px;cursor:pointer;">Import backup <input type="file" id="import-json" accept="application/json" style="display:none"></label>
          </div>
        </div>
        <div class="card danger-zone">
          <h3>Reset</h3>
          <p>Restores a clean Pathfinder state on this browser only.</p>
          <button class="danger" data-action="reset-app">Reset app data</button>
        </div>
      </aside>
    </section>
    <p class="footer-note">Install tip: after hosting or serving locally, use the browser menu on phone/tablet and choose “Add to Home screen” or “Install app.”</p>`;
}

function settingInput(key, label, value, type) {
  return `<div class="input-group"><label>${escapeHtml(label)}</label><input data-setting-field="${key}" type="${type}" value="${escapeHtml(value ?? '')}" /></div>`;
}

function selectGroup(field, label, value, options) {
  return selectGroupPath(`checkin.${field}`, label, value, options);
}

function selectGroupPath(path, label, value, options, labels = {}) {
  return `<div class="input-group"><label>${escapeHtml(label)}</label><select data-field="${path}">${options.map(option => `<option value="${escapeHtml(option)}" ${String(value) === String(option) ? 'selected' : ''}>${escapeHtml(labels[option] || option || '—')}</option>`).join('')}</select></div>`;
}

function stepCard(title, subtitle, done, detail, warn = false) {
  return `<div class="step ${done ? 'done' : warn ? 'warn' : ''}"><div><strong><span class="status-dot"></span>${escapeHtml(title)}</strong><small>${escapeHtml(subtitle)}</small></div><small>${escapeHtml(detail || '')}</small></div>`;
}

function miniMeal(key, meal, status) {
  return `<div class="metric"><span class="value">${status ? '✓' : '○'}</span><span class="label">${escapeHtml(meal.shortLabel || key)}</span><small>${escapeHtml(mealStatusLabels[status] || 'Open')}</small></div>`;
}


function mealRecipeCardHtml(meal) {
  const recipe = meal.recipe || {};
  const steps = Array.isArray(recipe.steps) ? recipe.steps : [];
  if (!steps.length && !recipe.note) return '';
  return `<details class="recipe-card">
    <summary>Recipe card</summary>
    <div class="recipe-meta"><span>${escapeHtml(recipe.prep ? `Prep ${recipe.prep}` : 'Prep as needed')}</span><span>${escapeHtml(recipe.cook ? `Cook ${recipe.cook}` : 'Cook as needed')}</span></div>
    ${steps.length ? `<ol class="step-list recipe-steps">${steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ol>` : ''}
    ${recipe.note ? `<p class="note">${escapeHtml(recipe.note)}</p>` : ''}
  </details>`;
}

function customItemsHtml(day) {
  if (!day.meals.customItems.length) return '<p class="note">No custom food logged today.</p>';
  return `<ul class="food-list">${day.meals.customItems.map((item, index) => `<li><span>+</span><span><strong>${escapeHtml(item.name)}</strong><br><small>${item.calories || 0} kcal · ${item.protein || 0}g protein · ${item.fiber || 0}g fiber · ${escapeHtml(item.meal || 'other')}</small></span><button class="danger small" data-action="remove-custom-food" data-index="${index}" style="margin-left:auto;">remove</button></li>`).join('')}</ul>`;
}

function foodLibraryCard(food) {
  return `<div class="library-item">
    <strong>${escapeHtml(food.name)}</strong>
    <small>${escapeHtml(food.serving || 'serving')} · ${food.calories || 0} kcal · ${food.protein || 0}g protein · ${food.fiber || 0}g fiber</small>
    <span class="badge neutral">${escapeHtml(food.category || 'food')}</span>
    <div class="toggle-row tight">
      <button class="ghost small" data-action="quick-add-food" data-id="${escapeHtml(food.id)}" data-servings="0.5">½x</button>
      <button class="secondary small" data-action="quick-add-food" data-id="${escapeHtml(food.id)}" data-servings="1">Add</button>
      <button class="ghost small" data-action="quick-add-food" data-id="${escapeHtml(food.id)}" data-servings="2">2x</button>
    </div>
  </div>`;
}

function swapCard(swap) {
  return `<div class="library-item"><strong>${escapeHtml(swap.name)}</strong><small>${swap.calories || 0} kcal · ${swap.protein || 0}g protein · ${swap.fiber || 0}g fiber</small><p class="note">${escapeHtml(swap.use || '')}</p></div>`;
}

function workoutLibraryCard(workout) {
  const guideId = guideIdForWorkout(workout);
  return `<div class="library-item"><strong>${escapeHtml(workout.title)}</strong><small>${escapeHtml(workout.focus)} · level ${workout.level} · ${workout.quiet ? 'quiet' : 'normal'}</small><p class="note">${escapeHtml(workout.bestFor || '')}</p><div class="toggle-row"><button class="ghost small" data-action="choose-workout" data-id="${escapeHtml(workout.id)}">Use today</button><button class="ghost small" data-action="open-guide" data-guide-id="${escapeHtml(guideId)}">How to</button></div></div>`;
}

function routinePreviewHtml(day, focusOnly = false) {
  const mode = selectedRoutineMode();
  let items = routineItemsForSelectedMode();
  let extra = '';
  if (focusOnly) {
    const focus = routineFocusInfo(day);
    items = (mode[focus.block] || []).slice(0, 8);
    const missed = earlierRoutineMissCount(day, focus.block);
    if (missed > 0) extra = `<p class="note"><strong>Missed earlier:</strong> ${missed} item(s). Leave them collapsed unless one truly helps right now.</p>`;
  } else {
    items = items.slice(0, 5);
  }
  if (!items.length) return '<p class="note">No routine items yet.</p>';
  return `${extra}<ul class="routine-list">${items.map(item => `<li class="${day.routine.completedIds[item.id] ? 'done' : ''}"><span>${day.routine.completedIds[item.id] ? '✓' : '○'}</span><span>${escapeHtml(item.text)}</span><button class="ghost small" style="margin-left:auto" data-action="toggle-routine-item" data-id="${escapeHtml(item.id)}">${day.routine.completedIds[item.id] ? 'undo' : 'done'}</button></li>`).join('')}</ul>`;
}

function selectedRoutineMode() {
  const key = appState.data.settings.routineMode || 'workday';
  return appState.data.routines[key] || appState.data.routines.workday;
}

function selectedRoutineLabel() {
  return selectedRoutineMode().label || appState.data.settings.routineMode || 'Routine';
}

function routineItemsForSelectedMode() {
  const mode = selectedRoutineMode();
  return ROUTINE_BLOCKS.flatMap(block => mode[block] || []);
}

function routineBlockLabel(block) {
  return { morning: 'Morning', betweenLunchDinner: 'Between lunch and dinner', evening: 'Evening' }[block] || block;
}

function workoutForDate(key) {
  const id = weekdayWorkoutOrder[dayOfWeek(key)] || 'chair-posture';
  return getWorkoutById(id) || workouts.find(w => w.id === id) || workouts[0];
}

function getWorkoutById(id) {
  // 0.8.8.6 startup migration fix:
  // loadState() can migrate saved days while appState is still being created.
  // During that moment, reading appState throws a TDZ ReferenceError.
  let workoutList = workouts;
  try {
    if (appState?.data?.workouts?.length) workoutList = appState.data.workouts;
  } catch {
    workoutList = workouts;
  }
  return workoutList.find(workout => workout.id === id);
}

function recommendedWorkout(day) {
  const suggestion = exerciseSuggestion(day);
  if (suggestion.forceRecovery) return getWorkoutById('weekly-reset') || workoutForDate(appState.selectedDate);
  return getWorkoutById(day.exercise.workoutId) || workoutForDate(appState.selectedDate);
}

function workoutSuggestionSteps(day, workout) {
  const suggestion = exerciseSuggestion(day);
  if (suggestion.forceRecovery) return workout.recovery || workout.minimum || [];
  if (day.checkin.energy === 'Low' || day.checkin.sleep === 'Poor' || day.checkin.stress === 'High') return workout.minimum || [];
  return workout.full || [];
}

function exerciseSuggestion(day) {
  const pain = day.exercise.pain;
  const soreness = day.exercise.soreness;
  if (pain === 'Yes') return { label: 'Recovery recommended', badge: 'danger', forceRecovery: true, message: 'Pain is marked yes, so today should be recovery or a skip. Do not try to earn points through pain.' };
  if (soreness === 'High') return { label: 'Recovery recommended', badge: 'warn', forceRecovery: true, message: 'Soreness is high. Choose recovery movement and keep the habit alive without adding strain.' };
  if (day.checkin.sleep === 'Poor' || day.checkin.energy === 'Low') return { label: 'Minimum win recommended', badge: 'warn', forceRecovery: false, message: 'Low sleep or energy means the minimum-win version is the smart move.' };
  if (day.checkin.stress === 'High') return { label: 'Gentle movement', badge: 'warn', forceRecovery: false, message: 'Stress is high. Movement can help, but keep it comfortable.' };
  return { label: 'Full version is reasonable', badge: '', forceRecovery: false, message: 'Nothing logged today suggests you need to shrink the workout. Full version is reasonable if time and energy allow.' };
}

function workoutBadge(day) {
  if (day.exercise.status === 'missed') return 'danger';
  if (day.exercise.status === 'recovery') return 'warn';
  if (day.exercise.status) return '';
  return 'neutral';
}

function dailyGuidance(day) {
  const stats = weeklyStats(appState.selectedDate);
  if (day.exercise.pain === 'Yes') return { priority: 'Protect body', badgeClass: 'danger', tab: 'exercise', button: 'Open recovery plan', message: 'Pain is logged. Pathfinder wants recovery, not hero mode.', reason: 'The app should keep you consistent without encouraging you to push through pain.' };
  if (!checkinHasData(day)) return { priority: 'Check-in first', badgeClass: 'blue', tab: 'today', button: 'Do quick check-in', message: 'Start with a quick check-in so today’s plan can fit your real energy.', reason: 'Without sleep, energy, stress, and hunger, Pathfinder can only guess.' };
  if (day.checkin.sleep === 'Poor' || day.checkin.energy === 'Low') return { priority: 'Shrink the plan', badgeClass: 'warn', tab: 'exercise', button: 'Use minimum workout', message: 'Today looks like a minimum-win day. Keep the chain alive without draining the night.', reason: 'Low sleep or low energy is exactly when the smaller version protects long-term consistency.' };
  if (!mealLogged(day, 'breakfast')) return { priority: 'Food anchor', badgeClass: 'neutral', tab: 'meals', button: 'Log breakfast', message: 'Food is the first anchor today. Log breakfast as planned, swapped, or skipped.', reason: 'Honest meal data will tell us whether the plan is working in real life.' };
  if (!mealLogged(day, 'lunch')) return { priority: 'Lunch data', badgeClass: 'neutral', tab: 'meals', button: 'Log lunch', message: 'Lunch is still open. Logging it now keeps the evening from becoming guesswork.', reason: 'Lunch drives the between-lunch-and-dinner exercise window.' };
  if (!['full','minimum','recovery'].includes(day.exercise.status)) return { priority: 'Move before dinner', badgeClass: '', tab: 'exercise', button: 'Open movement', message: 'This is the main movement window. Do the full version if it fits, minimum if not.', reason: `Your preferred exercise window is ${appState.data.settings.exerciseWindow}.` };
  if (!mealLogged(day, 'dinner')) return { priority: 'Close food loop', badgeClass: 'neutral', tab: 'meals', button: 'Log dinner', message: 'Movement is handled. Dinner is the next clean close-the-loop task.', reason: 'Dinner logging keeps the weekly review from overreacting to incomplete calorie data.' };
  if (!day.windDown.completed) return { priority: 'Wind down', badgeClass: 'blue', tab: 'today', button: 'Do wind-down', message: 'You have the major pieces. End with a short note and let the day be done.', reason: 'Wind-down creates a record of what helped or hurt, not just what you ate.' };
  return { priority: 'Good enough', badgeClass: '', tab: 'assistant', button: 'See recap', message: 'Today has enough useful data. You do not need to chase perfect.', reason: `This week’s average routine score is ${stats.score}%. Keep building the boring repeatable version.` };
}

function promptForDate(key) {
  const date = fromDateKey(key);
  const dayIndex = Math.floor(date.getTime() / 86400000);
  return windDownPrompts[Math.abs(dayIndex) % windDownPrompts.length];
}

function setNested(target, path, value) {
  const parts = path.split('.');
  let current = target;
  parts.slice(0, -1).forEach(part => {
    if (!current[part]) current[part] = {};
    current = current[part];
  });
  current[parts.at(-1)] = value;
}

function getNested(target, path) {
  return path.split('.').reduce((current, part) => current && current[part], target);
}

function togglePath(path) {
  const day = getDay();
  setNested(day, path, !getNested(day, path));
  saveState();
  render();
}

function weekKeysEnding(endKey) {
  const start = shiftDate(endKey, -6);
  return Array.from({ length: 7 }, (_, index) => shiftDate(start, index));
}

function weeklyStats(endKey) {
  const start = shiftDate(endKey, -6);
  const keys = weekKeysEnding(endKey);
  const days = keys.map(key => ({ key, day: readDay(key) }));
  const workoutsDone = days.filter(({ day }) => ['full','minimum','recovery'].includes(day.exercise.status)).length;
  const minimumWins = days.filter(({ day }) => day.exercise.status === 'minimum').length;
  const fullWorkouts = days.filter(({ day }) => day.exercise.status === 'full').length;
  const recoveryDays = days.filter(({ day }) => day.exercise.status === 'recovery').length;
  const missedWorkouts = days.filter(({ day }) => day.exercise.status === 'missed').length;
  const mealLogDays = days.filter(({ day }) => mealLogComplete(day)).length;
  const planDays = days.filter(({ day }) => MEAL_KEYS.every(key => mealPlanned(day, key))).length;
  const windDowns = days.filter(({ day }) => day.windDown.completed).length;
  const routineDays = days.filter(({ day }) => routineCompletion(day) >= 60).length;
  const waterDays = days.filter(({ day }) => Number(day.checkin.water || 0) >= Number(appState.data.settings.waterGoal || 8)).length;
  const scores = days.map(({ day }) => completionScore(day));
  const score = Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
  const loggedCalDays = days.map(({ day }) => totalsForDay(day).loggedCalories).filter(value => value > 0);
  const avgLoggedCalories = loggedCalDays.length ? Math.round(loggedCalDays.reduce((sum, value) => sum + value, 0) / loggedCalDays.length) : 0;
  const loggedProteinDays = days.map(({ day }) => totalsForDay(day).loggedProtein).filter(value => value > 0);
  const avgLoggedProtein = loggedProteinDays.length ? Math.round(loggedProteinDays.reduce((sum, value) => sum + value, 0) / loggedProteinDays.length) : 0;
  const currentWeight = currentWeightForProjection(days.at(-1)?.day || getDay(endKey));
  const exerciseCalDays = days.map(({ day }) => exerciseCalories(day, currentWeight));
  const avgExerciseCalories = Math.round(exerciseCalDays.reduce((sum, value) => sum + value, 0) / exerciseCalDays.length);
  const totalExerciseCalories = exerciseCalDays.reduce((sum, value) => sum + value, 0);
  const weights = days.map(({ key, day }) => day.weight ? { key, value: Number(day.weight) } : null).filter(Boolean);
  const weightChange = weights.length >= 2 ? Number((weights.at(-1).value - weights[0].value).toFixed(1)) : null;
  const mealBreakdown = Object.fromEntries(MEAL_KEYS.map(key => [key, { logged: days.filter(({ day }) => mealLogged(day, key)).length, planned: days.filter(({ day }) => mealPlanned(day, key)).length, swapped: days.filter(({ day }) => mealSwapped(day, key)).length, skipped: days.filter(({ day }) => mealSkipped(day, key)).length }]));
  return { start, end: endKey, keys, days, workouts: workoutsDone, minimumWins, fullWorkouts, recoveryDays, missedWorkouts, mealLogDays, planDays, windDowns, routineDays, waterDays, score, avgLoggedCalories, avgLoggedProtein, avgExerciseCalories, totalExerciseCalories, weights, weightChange, mealBreakdown };
}

function buildWeeklyReview(stats) {
  const weightLine = stats.weightChange === null ? 'Weight trend: not enough weigh-ins yet to call a trend.' : `Weight trend: ${stats.weightChange > 0 ? '+' : ''}${stats.weightChange} lb across the logged week. Daily bumps are normal; watch the 2–3 week direction.`;
  const weakest = weakestMeal(stats);
  const consistency = stats.score >= 75 ? 'Strong routine week. Keep it boring and repeatable.' : stats.score >= 45 ? 'Partial routine week. That is useful data. Reduce friction instead of raising pressure.' : 'The routine was hard to reach. Shrink the plan before you quit the plan.';
  const movement = stats.workouts >= 4 ? `Movement was a strength: ${stats.fullWorkouts} full, ${stats.minimumWins} minimum, ${stats.recoveryDays} recovery.` : stats.workouts >= 2 ? 'Movement showed up, but it needs the minimum-win button earlier in the evening.' : 'Movement needs to be smaller. Five minutes after work is the default until the habit sticks.';
  const meals = stats.planDays >= 5 ? 'Meals were strong. The repeated food pattern is doing its job.' : stats.mealLogDays >= 4 ? `Meals were logged, but the plan bent. Watch ${weakest.label}; it had the most skips/swaps/open slots.` : 'Food logging was the biggest weak point. Use saved meals and “ate something else” instead of leaving blanks.';
  const routine = stats.routineDays >= 4 ? 'Routines are starting to create structure.' : 'Routines need pruning. Keep only cards that reduce thinking after work.';
  const calories = stats.avgLoggedCalories ? `Average logged calories: ${stats.avgLoggedCalories}/day. Average logged protein: ${stats.avgLoggedProtein}g/day.` : 'Average logged calories: not enough food data yet.';
  const projection = atPaceProjection(readDay(stats.end), stats);
  const next = nextWeekSuggestion(stats);
  const gotInWay = weeklyFriction(stats, weakest);
  const win = weeklyWin(stats);

  return `Pathfinder weekly review
${formatDate(stats.start, 'short')} – ${formatDate(stats.end, 'short')}

Scoreboard
Routine score: ${stats.score}%
Meal log days: ${stats.mealLogDays}/7
Ate-plan days: ${stats.planDays}/7
Movement days: ${stats.workouts}/7
Routine days: ${stats.routineDays}/7
Wind-downs: ${stats.windDowns}/7
Water goal days: ${stats.waterDays}/7
${calories}

Weight / prediction
${weightLine}
At-this-pace: ${projection.summary}
Confidence: ${projection.confidence} — ${projection.confidenceReason}

What went well
${win}
${movement}

What got in the way
${gotInWay}
${meals}
${routine}

Next week focus
${next}

Coach note
${consistency}`;
}

function weeklyWin(stats) {
  const wins = [];
  if (stats.mealLogDays >= 4) wins.push('you collected enough food data to start seeing patterns');
  if (stats.workouts >= 3) wins.push('movement showed up more than once, which is how the habit becomes normal');
  if (stats.minimumWins > 0) wins.push('you used minimum wins instead of making the day all-or-nothing');
  if (stats.windDowns >= 3) wins.push('you gave the day some closure instead of only tracking numbers');
  if (!wins.length) wins.push('you opened the app and created data we can use to make the plan smaller and better');
  return wins.map(item => `- ${item}`).join('\n');
}

function weeklyFriction(stats, weakest) {
  const friction = [];
  if (stats.mealLogDays < 4) friction.push('food blanks make the projection low-confidence');
  if (stats.workouts < 3) friction.push('movement is still the easiest place to shrink the goal');
  if (stats.waterDays < 3) friction.push('water is not yet automatic');
  if (stats.windDowns < 3) friction.push('evening closure is easy to skip when tired');
  if (weakest) friction.push(`${weakest.label} is currently the weakest meal slot`);
  return friction.map(item => `- ${item}`).join('\n');
}

function atPaceProjection(day, stats) {
  const currentWeight = currentWeightForProjection(day);
  const burn = dailyBurnEstimate(day, stats);
  const todayTotals = totalsForDay(day);
  const todayCalories = Number(todayTotals.loggedCalories || 0);
  const avgCalories = Number(stats.avgLoggedCalories || 0);
  const usedCalories = avgCalories || todayCalories;
  const loggedDays = stats.days.filter(({ day: d }) => totalsForDay(d).loggedCalories > 0).length;
  const completeDays = stats.mealLogDays;
  if (!burn.totalBurn || !usedCalories || !currentWeight) {
    return { summary: 'Add calories, weight, and body stats to enable the 5-week projection.', fiveWeekLow: null, fiveWeekHigh: null, weeklyLoss: 0, confidence: 'low', confidenceReason: 'missing TDEE inputs, weight, or food logs', usedCalories: 0, dailyGap: 0, burn };
  }
  const dailyGap = burn.totalBurn - usedCalories;
  const weeklyLoss = dailyGap * 7 / 3500;
  const fiveWeekLoss = weeklyLoss * 5;
  const confidence = completeDays >= 5 ? 'higher' : loggedDays >= 4 ? 'medium' : 'low';
  const uncertainty = confidence === 'higher' ? 1.5 : confidence === 'medium' ? 3 : 5;
  const projected = currentWeight - fiveWeekLoss;
  const fiveWeekLow = projected - uncertainty;
  const fiveWeekHigh = projected + uncertainty;
  const exerciseText = burn.exerciseAdd ? ` plus about ${Math.round(burn.exerciseAdd)} kcal/day from logged exercise` : ' with no meaningful logged exercise bonus yet';
  const summary = dailyGap <= 0
    ? `Paper math says logged calories are near or above estimated burn${exerciseText}. That usually means slow loss, a pause, or a need for tighter logging before changing the plan.`
    : `Paper math points toward a rough 5-week range of ${fiveWeekLow.toFixed(1)}–${fiveWeekHigh.toFixed(1)} lb${exerciseText}. Treat this as direction, not a promise.`;
  const confidenceReason = confidence === 'higher' ? 'most meal days are complete' : confidence === 'medium' ? 'some useful food data exists, but blanks still matter' : 'too few complete food logs for a confident projection';
  return { summary, fiveWeekLow, fiveWeekHigh, weeklyLoss: Math.max(0, weeklyLoss), confidence, confidenceReason, usedCalories, dailyGap, loggedDays, completeDays, burn };
}

function projectionCardHtml(day, stats) {
  const projection = atPaceProjection(day, stats);
  const totals = totalsForDay(day);
  const goal = Number(appState.data.settings.calorieGoal || 0);
  const delta = totals.loggedCalories && goal ? totals.loggedCalories - goal : 0;
  return `<div class="card prediction-card">
    <div class="card-title"><div><h3>At this pace</h3><p>Direction check using food logs, current weight, TDEE, and logged exercise.</p></div><span class="badge ${projection.confidence === 'low' ? 'warn' : projection.confidence === 'medium' ? 'blue' : ''}">${projection.confidence} confidence</span></div>
    <p>${escapeHtml(projection.summary)}</p>
    <div class="grid three">
      <div class="metric"><span class="value">${projection.weeklyLoss ? projection.weeklyLoss.toFixed(1) : '—'}</span><span class="label">lb/week rough math</span><small>not a promise</small></div>
      <div class="metric"><span class="value">${projection.burn?.totalBurn ? Math.round(projection.burn.totalBurn) : '—'}</span><span class="label">estimated daily burn</span><small>${projection.burn?.exerciseAdd ? '+' + Math.round(projection.burn.exerciseAdd) + ' exercise' : 'TDEE baseline'}</small></div>
      <div class="metric"><span class="value">${delta ? (delta > 0 ? '+' : '') + Math.round(delta) : '—'}</span><span class="label">vs calorie goal today</span><small>${Math.round(totals.loggedCalories) || 0} logged</small></div>
    </div>
    <p class="note">${escapeHtml(projection.confidenceReason)}. Pathfinder uses ranges because water, sodium, sleep, and logging gaps can move the scale.</p>
  </div>`;
}

function buildAiReviewPacket(stats) {
  const packet = {
    app: 'Pathfinder',
    version: APP_VERSION,
    week: { start: stats.start, end: stats.end },
    settings: {
      calorieGoal: appState.data.settings.calorieGoal,
      maintenanceCalories: appState.data.settings.maintenanceCalories,
      startingWeight: appState.data.settings.startingWeight,
      goalWeight: appState.data.settings.goalWeight,
      exerciseWindow: appState.data.settings.exerciseWindow
    },
    weeklyStats: {
      score: stats.score,
      mealLogDays: stats.mealLogDays,
      planDays: stats.planDays,
      workouts: stats.workouts,
      fullWorkouts: stats.fullWorkouts,
      minimumWins: stats.minimumWins,
      recoveryDays: stats.recoveryDays,
      windDowns: stats.windDowns,
      waterDays: stats.waterDays,
      avgLoggedCalories: stats.avgLoggedCalories,
      avgLoggedProtein: stats.avgLoggedProtein,
      avgExerciseCalories: stats.avgExerciseCalories,
      totalExerciseCalories: stats.totalExerciseCalories,
      tdeeEstimate: Math.round(tdeeEstimate(currentWeightForProjection(readDay(stats.end))).tdee || 0),
      weightChange: stats.weightChange,
      mealBreakdown: stats.mealBreakdown
    },
    dailySummaries: stats.days.map(({ key, day }) => ({
      date: key,
      score: completionScore(day),
      meals: { ...day.meals.statuses },
      loggedCalories: Math.round(totalsForDay(day).loggedCalories),
      exercise: { status: day.exercise.status, minutes: day.exercise.minutes, soreness: day.exercise.soreness, pain: day.exercise.pain },
      checkin: { energy: day.checkin.energy, mood: day.checkin.mood, sleep: day.checkin.sleep, stress: day.checkin.stress, hunger: day.checkin.hunger, water: day.checkin.water },
      weight: day.weight,
      note: day.dailyNote || day.checkin.notes || day.exercise.notes || day.windDown.note || ''
    })),
    request: 'Give Joshua a practical weekly review: what went well, what got in the way, likely weight/progress direction, and one small next-week adjustment. Be honest but not shaming.'
  };
  return JSON.stringify(packet, null, 2);
}

function weakestMeal(stats) {
  const plan = getPlan();
  const ranked = MEAL_KEYS.map(key => {
    const data = stats.mealBreakdown[key];
    return { key, label: plan.meals[key].shortLabel, misses: data.swapped + data.skipped + (7 - data.logged), data };
  }).sort((a, b) => b.misses - a.misses);
  return ranked[0];
}

function nextWeekSuggestion(stats) {
  if (stats.mealLogDays < 4) return 'make food logging easier. Use saved meals and “ate something else” instead of aiming for perfect plan adherence.';
  if (stats.workouts < 3) return 'keep the main movement window between lunch and dinner, but make the default button “minimum win.”';
  if (stats.windDowns < 3) return 'keep the wind-down note to one sentence. The goal is closure, not journaling homework.';
  if (stats.weightChange !== null && stats.weightChange > 1) return 'do not panic about the scale. Tighten meal logging and water for three days before changing calories.';
  return 'repeat this week with no major changes. Consistency beats adding complexity.';
}

function assistantBrief(day, stats) {
  const guidance = dailyGuidance(day);
  const tone = appState.data.settings.assistantTone || 'friendly';
  const intro = tone === 'direct' ? 'Here is the priority.' : tone === 'gentle' ? 'Here is the gentlest useful version of today.' : 'Here is the friendly nudge for today.';
  return `${intro}\n\nPriority: ${guidance.priority}\n${guidance.message}\n\nWhy: ${guidance.reason}\n\nThis week so far: ${stats.mealLogDays}/7 meal-log days, ${stats.workouts}/7 movement days, ${stats.windDowns}/7 wind-downs.\n\nBest next click: ${guidance.button}`;
}

function eveningRecap(day) {
  const score = completionScore(day);
  const wins = [];
  if (mealLogComplete(day)) wins.push('food loop closed');
  if (['full','minimum','recovery'].includes(day.exercise.status)) wins.push(exerciseStatusLabels[day.exercise.status].toLowerCase());
  if (routineCompletion(day) >= 60) wins.push('routine mostly done');
  if (day.windDown.completed) wins.push('wind-down done');
  if (!wins.length) wins.push('data collected by opening the app');
  const note = day.dailyNote || day.checkin.notes || day.windDown.note || 'No note yet.';
  return `Daily score: ${score}%\nWins: ${wins.join(', ')}.\nNote: ${note}\n\nClose the day by making tomorrow slightly easier, not by trying to fix everything tonight.`;
}

function whatChanged(stats) {
  const previous = weeklyStats(shiftDate(stats.start, -1));
  const scoreDelta = stats.score - previous.score;
  const mealDelta = stats.mealLogDays - previous.mealLogDays;
  const moveDelta = stats.workouts - previous.workouts;
  return `Compared with the previous 7-day window:\nScore: ${deltaText(scoreDelta, '%')}\nMeal-log days: ${deltaText(mealDelta, ' day(s)')}\nMovement days: ${deltaText(moveDelta, ' day(s)')}\n\nUse this as a pattern check. Small improvements count because the routine is supposed to become automatic.`;
}

function upcomingFocus(stats) {
  const weakest = weakestMeal(stats);
  const lines = [];
  lines.push(`Food focus: ${weakest.label} is the weakest meal slot right now.`);
  if (stats.workouts < 3) lines.push('Movement focus: reduce the workout to the minimum-win version and do it before dinner.');
  else lines.push('Movement focus: keep the same plan; do not add intensity yet unless recovery feels good.');
  if (stats.windDowns < 3) lines.push('Evening focus: one sentence wind-down. No long journal required.');
  if (stats.waterDays < 3) lines.push('Water focus: start earlier. Evening catch-up is annoying.');
  return lines.join('\n');
}

function deltaText(value, suffix) {
  if (value > 0) return `+${value}${suffix}`;
  if (value < 0) return `${value}${suffix}`;
  return `no change`;
}

function progressNarrative(stats, lastWeight) {
  if (!lastWeight) return 'Start by logging weight a few times this week. The app will avoid overreacting to a single weigh-in.';
  if (stats.weightChange === null) return 'A latest weight is logged. Add a few more entries so Pathfinder can talk about trend instead of one data point.';
  if (stats.weightChange < -1) return 'The weekly direction is down. Keep an eye on energy, sleep, and whether workouts still feel doable.';
  if (stats.weightChange > 1) return 'The weekly direction is up. This may be water, sodium, timing, or missed meals/logs. Do not panic; tighten the routine for the next few days.';
  return 'Weight is mostly steady this week. Focus on meal adherence and movement consistency before making big changes.';
}

function forecastText(stats) {
  const day = readDay(stats.end);
  const projection = atPaceProjection(day, stats);
  const burn = projection.burn || dailyBurnEstimate(day, stats);
  if (!projection.usedCalories) return 'Add food logs, weight, and TDEE inputs in Settings to enable the bodyweight expectation helper.';
  const burnLine = `Estimated daily burn: about ${Math.round(burn.totalBurn || 0)} kcal (${Math.round(burn.baseBurn || 0)} TDEE baseline${burn.exerciseAdd ? ` + ${Math.round(burn.exerciseAdd)} logged exercise` : ''}).`;
  const foodLine = `Average logged intake: about ${Math.round(projection.usedCalories)} kcal/day.`;
  const direction = projection.dailyGap <= 0
    ? 'That points to slow or paused loss unless food intake drops, activity increases, or logging gets tighter.'
    : `That points to roughly ${projection.weeklyLoss.toFixed(1)} lb/week on paper.`;
  return `${burnLine}\n${foodLine}\n${direction}\n${projection.confidence} confidence: ${projection.confidenceReason}.`;
}

function getLastWeight() {
  const entries = Object.entries(appState.data.days).filter(([, day]) => day.weight !== '' && day.weight !== null && !Number.isNaN(Number(day.weight))).sort(([a], [b]) => a.localeCompare(b));
  if (!entries.length) return null;
  const [key, day] = entries.at(-1);
  return { key, value: Number(day.weight) };
}

function currentStreak(endKey) {
  let streak = 0;
  let key = endKey;
  for (let i = 0; i < 365; i++) {
    const day = appState.data.days[key];
    if (!day || completionScore(day) === 0) break;
    streak += 1;
    key = shiftDate(key, -1);
  }
  return streak;
}

function historyRows(count = 30) {
  const keys = Array.from({ length: count }, (_, index) => shiftDate(appState.selectedDate, -index)).reverse();
  return keys.map(key => ({ key, day: readDay(key) }));
}

function historyDayCard({ key, day }) {
  const totals = totalsForDay(day);
  const note = day.dailyNote || day.checkin.notes || day.exercise.notes || day.windDown.note || '';
  return `<button class="day-card ${key === todayKey() ? 'today' : ''}" data-action="select-date" data-date="${key}">
    <span class="date">${formatDate(key, 'short')}</span>
    <small>${completionScore(day)}% · ${Math.round(totals.loggedCalories) || 0} kcal</small>
    <div class="dot-row">
      ${MEAL_KEYS.map(k => `<span class="tiny-dot ${mealPlanned(day,k) ? 'on' : mealLogged(day,k) ? 'warn' : ''}" title="${k}"></span>`).join('')}
      <span class="tiny-dot ${['full','minimum','recovery'].includes(day.exercise.status) ? 'on' : day.exercise.status === 'missed' ? 'warn' : ''}" title="exercise"></span>
      <span class="tiny-dot ${day.windDown.completed ? 'on' : ''}" title="wind-down"></span>
    </div>
    <small>${escapeHtml(note).slice(0, 64)}</small>
  </button>`;
}

function historyRowHtml({ key, day }) {
  const totals = totalsForDay(day);
  const mealText = MEAL_KEYS.map(k => (statusForMeal(day, k) || 'open').slice(0, 1).toUpperCase()).join('');
  const note = day.dailyNote || day.checkin.notes || day.exercise.notes || day.windDown.note || '';
  return `<tr class="${key === todayKey() ? 'active-day' : ''}"><td>${formatDate(key, 'short')}</td><td>${completionScore(day)}%</td><td>${mealText}</td><td>${plannedMealCount(day)}/3</td><td>${Math.round(totals.loggedCalories) || ''}</td><td>${exerciseStatusLabels[day.exercise.status] || ''}</td><td>${escapeHtml(day.exercise.minutes || '')}</td><td>${Number(day.checkin.water || 0)}</td><td>${escapeHtml(day.weight || '')}</td><td>${escapeHtml(day.checkin.energy || '')}</td><td>${escapeHtml(note).slice(0, 70)}</td></tr>`;
}

function drawWeightChart() {
  const canvas = $('#weight-chart');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  const entries = Object.entries(appState.data.days).filter(([, day]) => day.weight !== '' && !Number.isNaN(Number(day.weight))).sort(([a], [b]) => a.localeCompare(b)).slice(-30).map(([key, day]) => ({ key, value: Number(day.weight) }));
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = '18px system-ui';
  context.fillStyle = '#aec1b4';
  if (entries.length < 2) { context.fillText('Log at least two weights to draw a trend.', 32, 170); return; }
  const padding = 50;
  const values = entries.map(entry => entry.value);
  const min = Math.floor(Math.min(...values) - 2);
  const max = Math.ceil(Math.max(...values) + 2);
  const xStep = (canvas.width - padding * 2) / Math.max(entries.length - 1, 1);
  const yFor = value => canvas.height - padding - ((value - min) / (max - min || 1)) * (canvas.height - padding * 2);
  const xFor = index => padding + index * xStep;
  drawGrid(context, canvas, padding);
  context.strokeStyle = '#7bcf9e'; context.lineWidth = 5; context.lineJoin = 'round'; context.lineCap = 'round'; context.beginPath();
  entries.forEach((entry, index) => { const x = xFor(index); const y = yFor(entry.value); if (index === 0) context.moveTo(x, y); else context.lineTo(x, y); });
  context.stroke();
  if (entries.length >= 7) {
    const avg = entries.map((entry, index) => {
      const slice = entries.slice(Math.max(0, index - 6), index + 1);
      return { key: entry.key, value: slice.reduce((sum, item) => sum + item.value, 0) / slice.length };
    });
    context.strokeStyle = '#fff3d6'; context.lineWidth = 3; context.beginPath();
    avg.forEach((entry, index) => { const x = xFor(index); const y = yFor(entry.value); if (index === 0) context.moveTo(x, y); else context.lineTo(x, y); });
    context.stroke();
  }
  context.fillStyle = '#d8eadc'; context.font = '14px system-ui';
  context.fillText(`${min} lb`, 12, yFor(min)); context.fillText(`${max} lb`, 12, yFor(max) + 6);
}

function drawHabitChart(stats) {
  const canvas = $('#habit-chart');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  const metrics = [
    ['Meals', stats.mealLogDays], ['Ate plan', stats.planDays], ['Move', stats.workouts], ['Routine', stats.routineDays], ['Wind-down', stats.windDowns], ['Water', stats.waterDays]
  ];
  const padding = 50;
  drawGrid(context, canvas, padding);
  const barWidth = (canvas.width - padding * 2) / metrics.length * 0.62;
  metrics.forEach(([label, value], index) => {
    const x = padding + index * ((canvas.width - padding * 2) / metrics.length) + barWidth * 0.3;
    const height = (value / 7) * (canvas.height - padding * 2);
    const y = canvas.height - padding - height;
    context.fillStyle = '#7bcf9e';
    context.fillRect(x, y, barWidth, height);
    context.fillStyle = '#d8eadc'; context.font = '16px system-ui'; context.fillText(`${value}/7`, x + 4, y - 8);
    context.fillStyle = '#aec1b4'; context.font = '14px system-ui'; context.fillText(label, x, canvas.height - 18);
  });
}

function drawGrid(context, canvas, padding) {
  context.strokeStyle = 'rgba(255,255,255,.12)'; context.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const y = padding + i * ((canvas.height - padding * 2) / 3);
    context.beginPath(); context.moveTo(padding, y); context.lineTo(canvas.width - padding, y); context.stroke();
  }
}

function exportCsv() {
  const rows = Object.entries(appState.data.days).sort(([a], [b]) => a.localeCompare(b)).map(([key, day]) => {
    migrateDay(day);
    const totals = totalsForDay(day);
    return {
      date: key, score: completionScore(day), dataQuality: dataQuality(day), breakfast: statusForMeal(day, 'breakfast'), lunch: statusForMeal(day, 'lunch'), dinner: statusForMeal(day, 'dinner'), loggedCalories: Math.round(totals.loggedCalories), loggedProtein: Math.round(totals.loggedProtein), exerciseStatus: day.exercise.status, workoutId: day.exercise.workoutId, exerciseMinutes: day.exercise.minutes, intensity: day.exercise.intensity, soreness: day.exercise.soreness, pain: day.exercise.pain, water: day.checkin.water, energy: day.checkin.energy, mood: day.checkin.mood, sleep: day.checkin.sleep, stress: day.checkin.stress, hunger: day.checkin.hunger, weight: day.weight, routinePercent: routineCompletion(day), windDown: day.windDown.completed ? 'yes' : 'no', dailyNote: day.dailyNote || '', checkinNotes: day.checkin.notes || '', exerciseNotes: day.exercise.notes || '', windDownNote: day.windDown.note || ''
    };
  });
  const headers = Object.keys(rows[0] || { date: '', score: '' });
  const csv = [headers.join(','), ...rows.map(row => headers.map(header => csvCell(row[header])).join(','))].join('\n');
  downloadBlob(csv, `pathfinder-history-${todayKey()}.csv`, 'text/csv');
}

function exportJson() {
  downloadBlob(JSON.stringify(appState.data, null, 2), `pathfinder-backup-${todayKey()}.json`, 'application/json');
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function handleImport(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const merged = mergeDefaults(defaultState(), parsed);
      migrateState(merged);
      appState.data = merged;
      saveState();
      showToast('Backup imported');
      render();
    } catch (error) {
      console.error(error);
      showToast('Import failed');
    }
  };
  reader.readAsText(file);
}

function showToast(message) {
  const template = $('#toast-template');
  const toast = template.content.firstElementChild.cloneNode(true);
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function capitalize(value) { return String(value || '').charAt(0).toUpperCase() + String(value || '').slice(1); }
function slugify(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `item-${Date.now()}`; }
function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function wireEvents() {
  document.addEventListener('click', event => {
    const tabButton = event.target.closest('[data-tab]');
    if (tabButton) { appState.activeTab = tabButton.dataset.tab; render(); return; }
    const action = event.target.closest('[data-action]');
    if (!action) return;
    handleAction(action);
  });

  document.addEventListener('change', event => {
    const target = event.target;
    if (target.id === 'date-picker') { appState.selectedDate = target.value || todayKey(); render(); return; }
    if (target.id === 'import-json') { handleImport(target.files?.[0]); return; }
    const field = target.dataset.field;
    if (field) { updateDayField(field, target.value); return; }
    const setting = target.dataset.settingField;
    if (setting) { appState.data.settings[setting] = numericSetting(setting, target.value); saveState(); render(); return; }
    const planField = target.dataset.planField;
    if (planField) { appState.data.plan[planField] = planField === 'baseCalories' ? Number(target.value || 0) : target.value; recalcPlanMacros(); saveState(); render(); return; }
    const meal = target.dataset.planMeal;
    const mealField = target.dataset.mealField;
    if (meal && mealField) { updatePlanMeal(meal, mealField, target.value); return; }
    const mealNote = target.dataset.mealNote;
    if (mealNote) { const day = getDay(); day.meals.notes[mealNote] = target.value; saveState(); return; }
    const mealSwap = target.dataset.mealSwap;
    if (mealSwap) { const day = getDay(); day.meals.swaps[mealSwap] = target.value; if (target.value && !day.meals.statuses[mealSwap]) day.meals.statuses[mealSwap] = 'swapped'; saveState(); render(); }
  });

  document.addEventListener('input', event => {
    const target = event.target;
    const field = target.dataset.field;
    if (field && !target.matches('select')) updateDayField(field, target.value, false);
  });

  $('#prev-day').addEventListener('click', () => { appState.selectedDate = shiftDate(appState.selectedDate, -1); render(); });
  $('#next-day').addEventListener('click', () => { appState.selectedDate = shiftDate(appState.selectedDate, 1); render(); });
  $('#today-btn').addEventListener('click', () => { appState.selectedDate = todayKey(); render(); });
}

function focusQuickCheckin() {
  appState.activeTab = 'today';
  render();
  requestAnimationFrame(() => {
    const card = $('#quick-checkin-card');
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('attention-flash');
    const firstSelect = card.querySelector('select, input, textarea, button');
    firstSelect?.focus({ preventScroll: true });
    setTimeout(() => card.classList.remove('attention-flash'), 1400);
  });
  showToast('Quick check-in opened');
}

function handleAction(action) {
  const day = getDay();
  switch (action.dataset.action) {
    case 'jump': appState.activeTab = action.dataset.tabTarget; render(); break;
    case 'focus-checkin': focusQuickCheckin(); break;
    case 'minimum-win':
    case 'log-exercise-status': {
      const status = action.dataset.status || 'minimum';
      day.exercise.status = status;
      day.exercise.version = status;
      day.exercise.completed = ['full','minimum','recovery'].includes(status);
      if (!day.exercise.minutes) day.exercise.minutes = status === 'full' ? 25 : status === 'minimum' ? 5 : status === 'recovery' ? 5 : '';
      saveState(); render(); showToast(exerciseStatusLabels[status] || 'Movement logged'); break;
    }
    case 'meal-status': day.meals.statuses[action.dataset.meal] = action.dataset.status; saveState(); render(); break;
    case 'toggle': togglePath(action.dataset.path); break;
    case 'water': day.checkin.water = Math.max(0, Number(day.checkin.water || 0) + Number(action.dataset.delta || 0)); saveState(); render(); break;
    case 'fill-food-estimate': fillCustomFoodEstimate(action); break;
    case 'log-food-estimate': logFoodEstimate(action); break;
    case 'repeat-food': logFoodEstimate(action); break;
    case 'quick-log-selected-food': quickLogSelectedFood(); break;
    case 'add-custom-food': addCustomFood(); break;
    case 'remove-custom-food': day.meals.customItems.splice(Number(action.dataset.index), 1); saveState(); render(); break;
    case 'quick-add-saved-meal': quickAddSavedMeal(action.dataset.id); break;
    case 'quick-add-food': quickAddFood(action.dataset.id, Number(action.dataset.servings || 1), action.dataset.meal || 'snack'); break;
    case 'add-db-food': addDatabaseFood(action.dataset.id, false); break;
    case 'save-db-food': addDatabaseFood(action.dataset.id, true); break;
    case 'apply-food-search': appState.data.settings.foodSearch = $('#food-search-input')?.value || ''; saveState(); render(); break;
    case 'search-online-foods': searchOnlineFoods(); break;
    case 'clear-online-foods': appState.data.foodSearchResults = []; saveState(); render(); showToast('Online results cleared'); break;
    case 'refresh-weather': refreshWeather(true); break;
    case 'add-food-library': addFoodLibrary(); break;
    case 'add-swap': addSwap(); break;
    case 'restore-default-plan': appState.data.plan = structuredClone(defaultMealPlan); saveState(); render(); showToast('Default plan restored'); break;
    case 'choose-workout': day.exercise.workoutId = action.dataset.id; saveState(); render(); showToast('Workout selected'); break;
    case 'open-guide': appState.selectedGuideId = action.dataset.guideId || 'chair-sit-to-stand'; appState.activeTab = 'guide'; render(); break;
    case 'add-workout': addWorkout(); break;
    case 'set-setting': appState.data.settings[action.dataset.setting] = numericSetting(action.dataset.setting, action.dataset.value); saveState(); render(); break;
    case 'toggle-setting': appState.data.settings[action.dataset.setting] = !appState.data.settings[action.dataset.setting]; saveState(); render(); break;
    case 'toggle-routine-item': day.routine.completedIds[action.dataset.id] = !day.routine.completedIds[action.dataset.id]; saveState(); render(); break;
    case 'remove-routine-item': removeRoutineItem(action.dataset.block, action.dataset.id); break;
    case 'add-routine-item': addRoutineItem(); break;
    case 'copy-review': navigator.clipboard?.writeText(buildWeeklyReview(weeklyStats(appState.selectedDate))); showToast('Review copied'); break;
    case 'copy-ai-summary': navigator.clipboard?.writeText(buildAiReviewPacket(weeklyStats(appState.selectedDate))); showToast('AI packet copied'); break;
    case 'force-save': saveState(); render(); showToast('Saved on this device'); break;
    case 'run-save-test': runSaveTest(); break;
    case 'copy-storage-debug': copyStorageDebugInfo(); break;
    case 'copy-companion-packet': copyCompanionPacket(); break;
    case 'export-csv': exportCsv(); break;
    case 'export-json': exportJson(); break;
    case 'reset-app': if (confirm('Reset Pathfinder data on this browser?')) { appState.data = defaultState(); saveState(); render(); showToast('Reset complete'); } break;
    case 'select-date': appState.selectedDate = action.dataset.date; appState.activeTab = 'today'; render(); break;
    default: break;
  }
}

function updateDayField(path, value, rerender = true) {
  const day = getDay();
  const numericPaths = ['weight', 'checkin.water', 'windDown.calmMinutes', 'exercise.minutes'];
  setNested(day, path, numericPaths.includes(path) && value !== '' ? Number(value) : value);
  if (path === 'exercise.status') day.exercise.completed = ['full','minimum','recovery'].includes(value);
  saveState();
  if (rerender) render();
}

function updatePlanMeal(meal, field, value) {
  const target = appState.data.plan.meals[meal];
  if (!target) return;
  if (['calories','protein','fiber'].includes(field)) target[field] = Number(value || 0);
  else if (field === 'items') target.items = value.split('\n').map(item => item.trim()).filter(Boolean);
  else if (field === 'recipeSteps') { target.recipe = target.recipe || {}; target.recipe.steps = value.split('\n').map(item => item.trim()).filter(Boolean); }
  else if (field === 'recipeNote') { target.recipe = target.recipe || {}; target.recipe.note = value; }
  else target[field] = value;
  recalcPlanMacros(); saveState();
}

function recalcPlanMacros() {
  const plan = appState.data.plan;
  plan.baseCalories = Number(plan.baseCalories || MEAL_KEYS.reduce((sum, key) => sum + Number(plan.meals[key]?.calories || 0), 0));
  plan.baseMacros = plan.baseMacros || {};
  plan.baseMacros.protein = MEAL_KEYS.reduce((sum, key) => sum + Number(plan.meals[key]?.protein || 0), 0);
  plan.baseMacros.fiber = MEAL_KEYS.reduce((sum, key) => sum + Number(plan.meals[key]?.fiber || 0), 0);
}

function numericSetting(key, value) {
  if (['startingWeight', 'goalWeight', 'calorieGoal', 'maintenanceCalories', 'waterGoal', 'bedtimeBufferHours', 'experienceLevel', 'age', 'heightFeet', 'heightInches', 'weatherLatitude', 'weatherLongitude'].includes(key)) return Number(value || 0);
  if (['weatherEnabled'].includes(key)) return value === true || value === 'true';
  return value;
}


function findFoodDatabaseItem(id) {
  return allFoodDatabaseItems().find(item => item.id === id);
}

function addDatabaseFood(id, saveOnly = false) {
  const item = findFoodDatabaseItem(id);
  if (!item) return showToast('Food not found');
  const servings = Math.max(0.1, Number($('#db-servings')?.value || 1));
  const meal = $('#db-meal-select')?.value || 'snack';
  const logged = {
    id: `db-${item.id}-${Date.now()}`,
    name: `${item.name}${servings !== 1 ? ` × ${servings}` : ''}`,
    meal,
    calories: Math.round(Number(item.calories || 0) * servings),
    protein: Number((Number(item.protein || 0) * servings).toFixed(1)),
    fiber: Number((Number(item.fiber || 0) * servings).toFixed(1)),
    createdAt: new Date().toISOString(),
    source: item.source || 'Food database'
  };
  if (saveOnly) {
    const exists = appState.data.foods.some(food => food.name.toLowerCase() === item.name.toLowerCase() && food.serving === item.serving);
    if (!exists) appState.data.foods.push({ id: `${slugify(item.name)}-${Date.now()}`, name: item.name, serving: item.serving || 'serving', calories: Number(item.calories || 0), protein: Number(item.protein || 0), fiber: Number(item.fiber || 0), category: item.category || item.source || 'Saved food' });
    saveState(); render(); showToast('Food saved to My foods');
    return;
  }
  const day = getDay();
  day.meals.customItems.push(logged);
  if (MEAL_KEYS.includes(meal) && !day.meals.statuses[meal]) day.meals.statuses[meal] = 'swapped';
  saveState(); render(); showToast('Food logged');
}

async function searchOnlineFoods() {
  const query = String($('#food-search-input')?.value || appState.data.settings.foodSearch || '').trim();
  appState.data.settings.foodSearch = query;
  if (!query) return showToast('Type a food search first');
  showToast('Searching packaged foods…');
  try {
    const params = new URLSearchParams({ search_terms: query, search_simple: '1', action: 'process', json: '1', page_size: '12', fields: 'code,product_name,brands,serving_size,nutriments,categories_tags' });
    const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`);
    if (!response.ok) throw new Error(`Open Food Facts ${response.status}`);
    const json = await response.json();
    appState.data.foodSearchResults = (json.products || []).map(product => mapOpenFoodFactsProduct(product)).filter(Boolean);
    saveState(); render();
    showToast(appState.data.foodSearchResults.length ? 'Online foods loaded' : 'No online foods found');
  } catch (error) {
    console.warn(error);
    showToast('Online food search failed');
  }
}

function mapOpenFoodFactsProduct(product) {
  const nutr = product.nutriments || {};
  const name = product.product_name || product.brands || '';
  if (!name) return null;
  const calories = Number(nutr['energy-kcal_serving'] ?? nutr['energy-kcal_100g'] ?? nutr['energy-kcal'] ?? 0);
  const protein = Number(nutr.proteins_serving ?? nutr.proteins_100g ?? nutr.proteins ?? 0);
  const fiber = Number(nutr.fiber_serving ?? nutr.fiber_100g ?? nutr.fiber ?? 0);
  return {
    id: `off-${product.code || slugify(name)}-${Date.now()}-${Math.random().toString(16).slice(2,6)}`,
    name,
    serving: product.serving_size || (nutr['energy-kcal_serving'] ? '1 serving' : '100 g'),
    calories: Math.round(calories || 0),
    protein: Number((protein || 0).toFixed(1)),
    fiber: Number((fiber || 0).toFixed(1)),
    category: 'Packaged food',
    source: 'Open Food Facts'
  };
}

function fillCustomFoodEstimate(action) {
  const fields = {
    name: $('#custom-food-name'),
    meal: $('#custom-food-meal'),
    servings: $('#custom-food-servings'),
    calories: $('#custom-food-calories'),
    protein: $('#custom-food-protein'),
    fiber: $('#custom-food-fiber')
  };
  if (!fields.name) return showToast('Open Meals to fill the food logger');
  fields.name.value = action.dataset.name || '';
  if (fields.meal) fields.meal.value = action.dataset.meal || 'snack';
  if (fields.servings) fields.servings.value = '1';
  if (fields.calories) fields.calories.value = action.dataset.calories || 0;
  if (fields.protein) fields.protein.value = action.dataset.protein || 0;
  if (fields.fiber) fields.fiber.value = action.dataset.fiber || 0;
  showToast('Estimate filled. Edit if needed, then add food log.');
}

function logFoodEstimate(action) {
  const source = {
    name: action.dataset.name || 'Food estimate',
    meal: action.dataset.meal || 'snack',
    calories: Number(action.dataset.calories || 0),
    protein: Number(action.dataset.protein || 0),
    fiber: Number(action.dataset.fiber || 0),
    source: 'Quick estimate'
  };
  logFoodItemToday(source, { prefix: 'estimate', meal: source.meal, source: 'Quick estimate' });
  saveState(); render(); showToast('Food estimate logged');
}

function addCustomFood() {
  const name = $('#custom-food-name')?.value.trim();
  if (!name) return showToast('Add a food name');
  const servings = Math.max(0.1, Number($('#custom-food-servings')?.value || 1));
  const perServing = {
    name,
    meal: $('#custom-food-meal')?.value || 'snack',
    calories: Number($('#custom-food-calories')?.value || 0),
    protein: Number($('#custom-food-protein')?.value || 0),
    fiber: Number($('#custom-food-fiber')?.value || 0),
    source: 'Custom food'
  };
  logFoodItemToday(perServing, { servings, meal: perServing.meal, prefix: 'custom', source: 'Custom food' });
  if ($('#custom-food-save')?.value === 'yes') {
    const exists = appState.data.foods.some(food => food.name.toLowerCase() === name.toLowerCase());
    if (!exists) appState.data.foods.push({
      id: `${slugify(name)}-${Date.now()}`,
      name,
      serving: servings === 1 ? '1 serving' : `${servings} serving log`,
      calories: Math.round(perServing.calories * servings),
      protein: Number((perServing.protein * servings).toFixed(1)),
      fiber: Number((perServing.fiber * servings).toFixed(1)),
      category: 'Saved repeat food'
    });
  }
  saveState(); render(); showToast('Food logged');
}

function quickAddSavedMeal(id) {
  const meal = appState.data.savedMeals.find(item => item.id === id);
  if (!meal) return;
  logFoodItemToday(meal, { prefix: 'saved', meal: 'snack', source: 'Saved meal' });
  saveState(); render(); showToast('Saved meal added');
}

function quickAddFood(id, servings = 1, meal = 'snack') {
  const food = appState.data.foods.find(item => item.id === id);
  if (!food) return;
  logFoodItemToday(food, { servings, meal, prefix: 'library', source: 'My foods' });
  saveState(); render(); showToast('Food added today');
}

function quickLogSelectedFood() {
  const id = $('#saved-food-select')?.value;
  const servings = Math.max(0.1, Number($('#saved-food-servings')?.value || 1));
  const meal = $('#saved-food-meal')?.value || 'snack';
  quickAddFood(id, servings, meal);
}

function addFoodLibrary() {
  const name = $('#food-name').value.trim();
  if (!name) return showToast('Add a food name');
  appState.data.foods.push({ id: `${slugify(name)}-${Date.now()}`, name, serving: $('#food-serving').value.trim(), calories: Number($('#food-calories').value || 0), protein: Number($('#food-protein').value || 0), fiber: Number($('#food-fiber').value || 0), category: $('#food-category').value.trim() || 'Food' });
  saveState(); render(); showToast('Food added');
}

function addSwap() {
  const name = $('#swap-name').value.trim();
  if (!name) return showToast('Add a swap name');
  appState.data.swaps.push({ id: `${slugify(name)}-${Date.now()}`, name, calories: Number($('#swap-calories').value || 0), protein: Number($('#swap-protein').value || 0), fiber: Number($('#swap-fiber').value || 0), use: $('#swap-use').value.trim() });
  saveState(); render(); showToast('Swap added');
}

function addWorkout() {
  const title = $('#workout-title').value.trim();
  if (!title) return showToast('Add a workout title');
  appState.data.workouts.push({ id: `${slugify(title)}-${Date.now()}`, title, focus: $('#workout-focus').value.trim() || 'custom', level: Number($('#workout-level').value || 1), quiet: true, bestFor: 'Custom workout.', full: $('#workout-full').value.split('\n').map(x => x.trim()).filter(Boolean), minimum: $('#workout-minimum').value.split('\n').map(x => x.trim()).filter(Boolean), recovery: ['Gentle movement · 3–5 min'] });
  saveState(); render(); showToast('Workout added');
}

function addRoutineItem() {
  const mode = $('#routine-mode').value;
  const block = $('#routine-block').value;
  const text = $('#routine-text').value.trim();
  if (!text) return showToast('Add a routine item');
  appState.data.routines[mode][block].push({ id: `${mode}-${block}-${slugify(text)}-${Date.now()}`, text, minutes: Number($('#routine-minutes').value || 1) });
  saveState(); render(); showToast('Routine item added');
}

function removeRoutineItem(block, id) {
  const mode = selectedRoutineMode();
  mode[block] = (mode[block] || []).filter(item => item.id !== id);
  Object.values(appState.data.days).forEach(day => { if (day.routine?.completedIds) delete day.routine.completedIds[id]; });
  saveState(); render(); showToast('Routine item removed');
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./service-worker.js').catch(error => console.warn('Service worker registration failed', error));
  }
}

wireEvents();
render();
registerServiceWorker();
requestPersistentStorage();
hydrateFromIndexedDb();
window.addEventListener('pagehide', flushStateOnPageLeave);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushStateOnPageLeave(); });
