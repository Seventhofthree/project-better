/* Pathfinder 1.3 Today-first daily flow helpers. */

export const TODAY_PHASES = ['morning', 'betweenLunchDinner', 'evening', 'review'];

export const TODAY_PHASE_DEFINITIONS = {
  morning: {
    label: 'Morning',
    greeting: 'Good morning',
    summary: 'Set the anchors for food, energy, and the first useful routine steps.'
  },
  betweenLunchDinner: {
    label: 'Afternoon',
    greeting: 'Good afternoon',
    summary: 'Close lunch, use the movement window, and keep the rest of the day simple.'
  },
  evening: {
    label: 'Evening',
    greeting: 'Good evening',
    summary: 'Finish food honestly, take the smallest useful movement win, and close the day.'
  },
  review: {
    label: 'Saved day',
    greeting: 'Reviewing',
    summary: 'This is a saved date, so Pathfinder shows the record instead of guessing what matters now.'
  }
};

export function normalizeTodayPhase(phase) {
  return TODAY_PHASES.includes(phase) ? phase : 'morning';
}

export function todayPhaseForHour(hour, isSelectedToday = true) {
  if (!isSelectedToday) return 'review';
  const value = Number(hour);
  if (!Number.isFinite(value)) return 'morning';
  if (value < 11) return 'morning';
  if (value < 17) return 'betweenLunchDinner';
  return 'evening';
}

export function todayPhaseDefinition(phase) {
  return TODAY_PHASE_DEFINITIONS[normalizeTodayPhase(phase)];
}

export function currentMealForPhase(phase) {
  const normalized = normalizeTodayPhase(phase);
  if (normalized === 'morning') return 'breakfast';
  if (normalized === 'betweenLunchDinner') return 'lunch';
  if (normalized === 'evening') return 'dinner';
  return '';
}

export function calorieBudgetSummary({ goal = 0, logged = 0, loggedEntries = 0 } = {}) {
  const target = Math.max(0, Number(goal) || 0);
  const consumed = Math.max(0, Number(logged) || 0);
  const entries = Math.max(0, Number(loggedEntries) || 0);
  const remaining = target - consumed;
  const progressPercent = target > 0 ? Math.min(100, Math.max(0, (consumed / target) * 100)) : 0;

  if (!target) {
    return {
      target,
      consumed,
      entries,
      remaining: 0,
      progressPercent: 0,
      status: 'unconfigured',
      value: '—',
      label: 'calorie target not set',
      note: 'Set a daily calorie target in Settings.'
    };
  }

  if (remaining < 0) {
    return {
      target,
      consumed,
      entries,
      remaining,
      progressPercent: 100,
      status: 'over',
      value: Math.round(Math.abs(remaining)).toLocaleString(),
      label: 'calories over',
      note: 'Keep logging honestly. One day is information, not failure.'
    };
  }

  const closeToTarget = remaining <= Math.max(100, target * 0.1);
  return {
    target,
    consumed,
    entries,
    remaining,
    progressPercent,
    status: entries === 0 ? 'empty' : closeToTarget ? 'near' : 'within',
    value: Math.round(remaining).toLocaleString(),
    label: 'calories remaining',
    note: entries === 0
      ? 'Nothing is logged yet, so this is the full daily budget.'
      : closeToTarget
        ? 'You are close to the target. Finish the day with deliberate choices.'
        : 'This is the food budget left from what is currently logged.'
  };
}
