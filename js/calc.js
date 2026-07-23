/* calc.js — pure functions. No DOM, no storage.
   Everything derived on the fly, never cached, so it can't go stale. */

export const MEALS = [
  { key: 'breakfast' },
  { key: 'lunch'     },
  { key: 'dinner'    },
  { key: 'snacks'    }
];

export function entryTotals(e) {
  const s = e.amount / 100;                 // stored data is per 100 g
  return {
    kcal:    e.per100g.kcal    * s,
    protein: e.per100g.protein * s,
    carbs:   e.per100g.carbs   * s,
    fat:     e.per100g.fat     * s
  };
}

export function sumEntries(entries) {
  return entries.reduce((t, e) => {
    const v = entryTotals(e);
    return {
      kcal: t.kcal + v.kcal, protein: t.protein + v.protein,
      carbs: t.carbs + v.carbs, fat: t.fat + v.fat
    };
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
}

export function ringState(actual, target) {
  const safe = target > 0 ? target : 1;
  const raw = (actual / safe) * 100;
  return { pct: Math.min(100, raw), raw, left: target - actual, over: raw > 100 };
}

export function impliedKcal(t) {
  return t.protein * 4 + t.carbs * 4 + t.fat * 9;
}

export function bmr({ gender, weightKg, heightCm, age }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === 'm' ? base + 5 : base - 161);
}

export function bmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

/* Map values to SVG coordinates. Each series scales on its own axis,
   otherwise body fat % (~20) flattens against weight (~70). */
export function scaleSeries(values, y0, y1) {
  const nums = values.filter(v => typeof v === 'number' && !isNaN(v));
  if (!nums.length) return null;
  let min = Math.min(...nums), max = Math.max(...nums);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.15;
  min -= pad; max += pad;
  return {
    min, max,
    y: v => y1 - ((v - min) / (max - min)) * (y1 - y0)
  };
}

export const round = (n, d = 0) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};
