/* Pathfinder 1.2 calm navigation model.
   Existing feature views remain intact, but only five primary destinations are exposed.
*/

export const VIEW_IDS = [
  'today',
  'meals',
  'food',
  'exercise',
  'guide',
  'routines',
  'assistant',
  'progress',
  'review',
  'history',
  'settings'
];

export const PRIMARY_SECTIONS = ['today', 'food', 'movement', 'progress', 'settings'];

export const SECTION_DEFINITIONS = {
  today: {
    label: 'Today',
    description: 'Daily dashboard, routines, and companion guidance.',
    defaultView: 'today',
    views: [
      { id: 'today', label: 'Today' },
      { id: 'routines', label: 'Routines' },
      { id: 'assistant', label: 'Assistant' }
    ]
  },
  food: {
    label: 'Food',
    description: 'Today’s food, meal plan, saved foods, and search.',
    defaultView: 'meals',
    views: [
      { id: 'meals', label: 'Today’s Food' },
      { id: 'food', label: 'Plan & Library' }
    ]
  },
  movement: {
    label: 'Movement',
    description: 'Today’s workout and beginner exercise guidance.',
    defaultView: 'exercise',
    views: [
      { id: 'exercise', label: 'Today’s Workout' },
      { id: 'guide', label: 'Exercise Guide' }
    ]
  },
  progress: {
    label: 'Progress',
    description: 'Overview, reviews, and detailed history.',
    defaultView: 'progress',
    views: [
      { id: 'progress', label: 'Overview' },
      { id: 'review', label: 'Reviews' },
      { id: 'history', label: 'History' }
    ]
  },
  settings: {
    label: 'Settings',
    description: 'Personal targets, backups, storage, and app controls.',
    defaultView: 'settings',
    views: [{ id: 'settings', label: 'Settings' }]
  }
};

const VIEW_TO_SECTION = Object.entries(SECTION_DEFINITIONS).reduce((map, [section, definition]) => {
  definition.views.forEach(view => { map[view.id] = section; });
  return map;
}, {});

export function normalizeView(view) {
  return VIEW_IDS.includes(view) ? view : 'today';
}

export function sectionForView(view) {
  return VIEW_TO_SECTION[normalizeView(view)] || 'today';
}

export function defaultViewForSection(section) {
  return SECTION_DEFINITIONS[section]?.defaultView || 'today';
}

export function sectionDefinition(section) {
  return SECTION_DEFINITIONS[PRIMARY_SECTIONS.includes(section) ? section : 'today'];
}
