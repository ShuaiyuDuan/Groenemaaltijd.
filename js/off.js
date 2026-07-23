/* off.js — Open Food Facts lookup.
   It's a volunteer-run project, so: debounce, cache, keep page_size small. */

const ENDPOINT = 'https://world.openfoodfacts.org/cgi/search.pl';
const cache = new Map();

export async function searchOFF(term) {
  const q = term.trim().toLowerCase();
  if (q.length < 3) return [];
  if (cache.has(q)) return cache.get(q);

  const url = `${ENDPOINT}?search_terms=${encodeURIComponent(q)}` +
    '&search_simple=1&action=process&json=1&page_size=15' +
    '&fields=code,product_name,brands,nutriments';

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open Food Facts returned ${res.status}`);
  const data = await res.json();

  const out = (data.products || []).map(toFood).filter(Boolean);
  cache.set(q, out);
  return out;
}

/* OFF is crowdsourced — plenty of products have missing nutriments.
   Skip anything without calories; there's nothing to log. */
function toFood(p) {
  const n = p.nutriments || {};
  const kcal = num(n['energy-kcal_100g']);
  if (kcal === null) return null;

  const name = [p.product_name, p.brands ? `(${p.brands.split(',')[0].trim()})` : '']
    .filter(Boolean).join(' ').trim();
  if (!name) return null;

  return {
    name,
    code: p.code,
    source: 'off',
    per100g: {
      kcal,
      protein: num(n.proteins_100g)      ?? 0,
      carbs:   num(n.carbohydrates_100g) ?? 0,
      fat:     num(n.fat_100g)           ?? 0
    },
    incomplete: [n.proteins_100g, n.carbohydrates_100g, n.fat_100g]
      .some(v => num(v) === null)
  };
}

function num(v) {
  const x = parseFloat(v);
  return isNaN(x) ? null : Math.round(x * 10) / 10;
}

export function debounce(fn, ms = 400) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
