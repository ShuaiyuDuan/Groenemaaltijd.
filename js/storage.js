/* storage.js — the ONLY file that touches localStorage.
   Move to a server one day = rewrite this file, nothing else. */

const KEY = 'gm.v1';

const DEFAULTS = {
  profile: {
    gender: 'f',
    birthYear: 2000,
    heightCm: 165,
    weightKg: 73,
    expenditure:  { workout: 2300, rest: 1950 },   // what you BURN
    intakeTarget: { workout: 1800, rest: 1550 },   // what you aim to EAT
    multipliers: {                                  // grams per kg bodyweight
      protein: { workout: 1.6, rest: 0.9 },
      carbs:   { workout: 2.0, rest: 1.2 },
      fat:     { workout: 0.8, rest: 0.8 }
    },
    carbsAuto: false          // when true, carbs = leftover calories
  },
  measurements: [],
  days: {},
  favorites: []
};

export let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const saved = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULTS),
      ...saved,
      profile: { ...structuredClone(DEFAULTS.profile), ...(saved.profile || {}) }
    };
  } catch (err) {
    console.error('Could not read saved data:', err);
    return structuredClone(DEFAULTS);
  }
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.error('Could not save:', err);
    alert('Could not save — browser storage may be full or blocked.');
    return false;
  }
}

/* ---------- dates ---------- */

export function todayKey(d = new Date()) {
  // local date. toISOString() would roll over at the wrong hour.
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function shiftKey(key, days) {
  const d = new Date(key + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return todayKey(d);
}

/* ---------- derived profile values ---------- */

export function latestWeight() {
  if (!state.measurements.length) return state.profile.weightKg;
  return [...state.measurements].sort((a, b) => b.date.localeCompare(a.date))[0].weightKg;
}

export function currentAge() {
  return new Date().getFullYear() - state.profile.birthYear;
}

/* Targets for a given mode. Carbs can be "auto" = whatever calories are left. */
export function buildTargets(isWorkout) {
  const mode = isWorkout ? 'workout' : 'rest';
  const kg = latestWeight();
  const m = state.profile.multipliers;
  const kcal = state.profile.intakeTarget[mode];

  const protein = r1(m.protein[mode] * kg);
  const fat     = r1(m.fat[mode] * kg);
  const carbs   = state.profile.carbsAuto
    ? Math.max(0, r1((kcal - protein * 4 - fat * 9) / 4))
    : r1(m.carbs[mode] * kg);

  return { kcal, expenditure: state.profile.expenditure[mode], protein, carbs, fat };
}

/* ---------- days ---------- */

export function getDay(dateKey = todayKey()) {
  if (!state.days[dateKey]) {
    state.days[dateKey] = {
      date: dateKey,
      workout: false,
      targets: buildTargets(false),   // snapshot, so old days don't rewrite
      entries: []
    };
    save();
  }
  return state.days[dateKey];
}

export function setWorkout(dateKey, isWorkout) {
  const day = getDay(dateKey);
  day.workout = isWorkout;
  day.targets = buildTargets(isWorkout);
  save();
}

export function refreshTargets(dateKey) {
  const day = getDay(dateKey);
  day.targets = buildTargets(day.workout);
  save();
}

/* ---------- entries ---------- */

export function addEntry(dateKey, entry) {
  const day = getDay(dateKey);
  day.entries.push({ id: uid(), ...entry });
  save();
}

export function updateEntry(dateKey, id, patch) {
  const day = getDay(dateKey);
  const e = day.entries.find(x => x.id === id);
  if (e) Object.assign(e, patch);
  save();
}

export function deleteEntry(dateKey, id) {
  const day = getDay(dateKey);
  day.entries = day.entries.filter(x => x.id !== id);
  save();
}

/* ---------- favourites (a food, not a log entry) ---------- */

export function toggleFavorite(food) {
  const i = state.favorites.findIndex(f => f.name === food.name);
  if (i >= 0) state.favorites.splice(i, 1);
  else state.favorites.push({ name: food.name, per100g: food.per100g });
  save();
}

export function isFavorite(name) {
  return state.favorites.some(f => f.name === name);
}

/* ---------- measurements ---------- */

export function addMeasurement(m) {
  const i = state.measurements.findIndex(x => x.date === m.date);
  if (i >= 0) state.measurements[i] = m;      // one per date
  else state.measurements.push(m);
  state.measurements.sort((a, b) => a.date.localeCompare(b.date));
  save();
}

export function deleteMeasurement(date) {
  state.measurements = state.measurements.filter(m => m.date !== date);
  save();
}

/* ---------- backup ---------- */

export function exportJSON() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `groenemaaltijd-${todayKey()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importJSON(text) {
  const parsed = JSON.parse(text);          // throws on bad JSON — caller catches
  if (!parsed.profile || !parsed.days) throw new Error('Not a Groenemaaltijd backup');
  Object.keys(state).forEach(k => delete state[k]);
  Object.assign(state, structuredClone(DEFAULTS), parsed);
  save();
}

const r1 = n => Math.round(n * 10) / 10;
const uid = () => Math.random().toString(36).slice(2, 10);
