/* app.js — wires everything together. */

import {
  state, save, todayKey, shiftKey, getDay, setWorkout, refreshTargets,
  addEntry, updateEntry, deleteEntry, toggleFavorite, isFavorite,
  addMeasurement, deleteMeasurement, latestWeight, currentAge,
  exportJSON, importJSON
} from './storage.js';
import {
  MEALS, entryTotals, sumEntries, ringState, impliedKcal,
  bmr, bmi, scaleSeries, round
} from './calc.js';
import { searchOFF, debounce } from './off.js';
import { STARTER_FOODS } from './data.js';
import { t, getLang, setLang, localeTag, applyStaticI18n } from './i18n.js';

const $ = id => document.getElementById(id);
let viewDate = todayKey();
let editingId = null;

/* =========================================================
   NAVIGATION
   ========================================================= */

const VIEWS = ['summary', 'food', 'weight', 'settings'];
let currentView = 'summary';

function showView(name) {
  currentView = name;
  VIEWS.forEach(v => { $('view-' + v).hidden = v !== name; });
  document.querySelectorAll('.nav button').forEach(b => {
    if (b.dataset.view === name) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  $('fab').hidden = name !== 'food';
  window.scrollTo(0, 0);
  sessionStorage.setItem('gm.view', name);

  if (name === 'summary')  renderSummary();
  if (name === 'food')     renderFood();
  if (name === 'weight')   renderWeight();
  if (name === 'settings') renderSettings();
}

document.querySelectorAll('.nav button').forEach(b => {
  b.addEventListener('click', () => showView(b.dataset.view));
});

document.querySelectorAll('.lang-switch button').forEach(b => {
  b.addEventListener('click', () => {
    setLang(b.dataset.lang);
    applyStaticI18n();
    showView(currentView);
  });
});

function friendlyDate(key) {
  if (key === todayKey()) return t('today');
  if (key === shiftKey(todayKey(), -1)) return t('yesterday');
  return new Date(key + 'T12:00:00')
    .toLocaleDateString(localeTag(), { weekday: 'short', day: 'numeric', month: 'short' });
}

function stepDate(days) {
  const next = shiftKey(viewDate, days);
  if (next > todayKey()) return;
  viewDate = next;
  renderSummary();
  renderFood();
}

/* =========================================================
   SUMMARY
   ========================================================= */

const RINGS = [
  { key: 'kcal',    nameKey: 'ring_calories', unit: 'kcal' },
  { key: 'protein', nameKey: 'ring_protein',  unit: 'g'    },
  { key: 'carbs',   nameKey: 'ring_carbs',    unit: 'g'    },
  { key: 'fat',     nameKey: 'ring_fat',      unit: 'g'    }
];
const R = 46, C = 2 * Math.PI * R;

function renderSummary() {
  const day = getDay(viewDate);
  const actual = sumEntries(day.entries);
  const targets = day.targets;

  $('date-label').textContent = friendlyDate(viewDate);
  $('next-day').disabled = viewDate >= todayKey();
  $('workout').checked = day.workout;

  $('rings').innerHTML = RINGS.map(r => {
    const name = t(r.nameKey);
    const s = ringState(actual[r.key], targets[r.key]);
    const offset = C - (s.pct / 100) * C;
    const sub = s.over
      ? t('ring_over', { n: round(Math.abs(s.left)), unit: r.unit })
      : t('ring_left', { n: round(s.left), unit: r.unit });
    return `
      <div class="ring-card ${s.over ? 'ring-card--over' : ''}">
        <svg class="ring" viewBox="0 0 110 110" role="img"
             aria-label="${name}: ${round(actual[r.key])} of ${round(targets[r.key])} ${r.unit}">
          <circle class="ring__track" cx="55" cy="55" r="${R}" fill="none" stroke-width="9"/>
          <circle class="ring__fill" cx="55" cy="55" r="${R}" fill="none" stroke-width="9"
                  stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${offset}"
                  transform="rotate(-90 55 55)"/>
          <text class="ring__pct" x="55" y="52" text-anchor="middle">${round(s.raw)}%</text>
          <text class="ring__sub" x="55" y="66" text-anchor="middle">${sub}</text>
          <text class="ring__sub" x="55" y="78" text-anchor="middle">${t('ring_of', { n: round(targets[r.key]), unit: r.unit })}</text>
        </svg>
        <div class="ring-card__name">${name}</div>
      </div>`;
  }).join('');

  const def = targets.expenditure - actual.kcal;
  $('burned').textContent = round(targets.expenditure);
  $('eaten').textContent  = round(actual.kcal);
  const d = $('deficit');
  d.textContent = (def >= 0 ? '' : '+') + round(Math.abs(def));
  d.className = 'deficit__val ' + (def >= 0 ? 'deficit__val--good' : 'deficit__val--bad');

  const implied = impliedKcal(targets), gap = round(implied - targets.kcal);
  const n = $('notice');
  if (Math.abs(gap) > 50) {
    n.hidden = false;
    n.innerHTML = t('notice_macro_mismatch', {
      implied: round(implied), target: round(targets.kcal),
      gap: (gap > 0 ? '+' : '') + gap
    });
  } else n.hidden = true;
}

$('prev-day').addEventListener('click', () => stepDate(-1));
$('next-day').addEventListener('click', () => stepDate(1));
$('workout').addEventListener('change', e => {
  setWorkout(viewDate, e.target.checked);
  renderSummary();
});

/* =========================================================
   FOOD
   ========================================================= */

const TRASH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>`;
const HEART = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20s-7-4.5-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.5-7 9-7 9z"/></svg>`;

function renderFood() {
  const day = getDay(viewDate);
  $('f-date').textContent = friendlyDate(viewDate);
  $('f-next').disabled = viewDate >= todayKey();

  $('meals').innerHTML = MEALS.map(meal => {
    const rows = day.entries.filter(e => e.meal === meal.key);
    const sub = sumEntries(rows);

    const entryRows = rows.map(e => {
      const v = entryTotals(e);
      return `
        <div class="entry">
          <button class="entry__main" data-edit="${e.id}">
            <div class="entry__name">${escapeHtml(e.name)} · ${round(e.amount)} g</div>
            <div class="entry__macros">${round(v.kcal)} kcal · P ${round(v.protein,1)} · C ${round(v.carbs,1)} · F ${round(v.fat,1)}</div>
          </button>
          <button class="icon-btn icon-btn--fav ${isFavorite(e.name) ? 'is-on' : ''}"
                  data-fav="${e.id}" aria-label="${t('fav_label')}">${HEART}</button>
          <button class="icon-btn" data-del="${e.id}" aria-label="${t('delete_label')}">${TRASH}</button>
        </div>`;
    }).join('');

    const addRow = `<button class="empty-meal" data-add="${meal.key}">` +
      (rows.length ? t('add_another') : t('nothing_logged')) + '</button>';

    const body = entryRows + addRow;

    return `
      <div class="meal-head">
        <h2>${t('meal_' + meal.key)}</h2>
        <span class="meal-head__sub">${rows.length ? round(sub.kcal) + ' kcal' : ''}</span>
      </div>
      ${body}`;
  }).join('');
}

$('meals').addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  if (btn.dataset.add)  return openModal(null, btn.dataset.add);
  if (btn.dataset.edit) return openModal(btn.dataset.edit);
  if (btn.dataset.del) {
    if (confirm(t('confirm_delete_entry'))) { deleteEntry(viewDate, btn.dataset.del); renderFood(); }
    return;
  }
  if (btn.dataset.fav) {
    const entry = getDay(viewDate).entries.find(x => x.id === btn.dataset.fav);
    if (entry) { toggleFavorite(entry); renderFood(); }
  }
});

$('f-prev').addEventListener('click', () => stepDate(-1));
$('f-next').addEventListener('click', () => stepDate(1));
$('fab').addEventListener('click', () => openModal(null, 'breakfast'));

/* =========================================================
   ADD / EDIT MODAL
   ========================================================= */

function openModal(id, mealKey) {
  editingId = id;
  $('modal-title').textContent = id ? t('modal_edit_food') : t('modal_add_food');
  $('suggest').hidden = true;

  if (id) {
    const e = getDay(viewDate).entries.find(x => x.id === id);
    $('e-name').value = e.name;
    $('e-meal').value = e.meal;
    $('e-amount').value = e.amount;
    $('e-kcal').value = e.per100g.kcal;
    $('e-protein').value = e.per100g.protein;
    $('e-carbs').value = e.per100g.carbs;
    $('e-fat').value = e.per100g.fat;
  } else {
    $('e-name').value = '';
    $('e-meal').value = mealKey || 'breakfast';
    $('e-amount').value = 100;
    ['e-kcal','e-protein','e-carbs','e-fat'].forEach(k => $(k).value = '');
  }
  $('modal').hidden = false;
  updatePreview();
  $('e-name').focus();
}

function closeModal() { $('modal').hidden = true; editingId = null; }

$('modal-close').addEventListener('click', closeModal);
$('e-cancel').addEventListener('click', closeModal);
$('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('modal').hidden) closeModal(); });

['e-amount','e-kcal','e-protein','e-carbs','e-fat'].forEach(id =>
  $(id).addEventListener('input', updatePreview));

function updatePreview() {
  const amt = parseFloat($('e-amount').value);
  const k = parseFloat($('e-kcal').value);
  const p = $('preview');
  if (!amt || isNaN(k)) { p.hidden = true; return; }
  const s = amt / 100;
  p.hidden = false;
  p.innerHTML = `<strong>${round(amt)} g</strong> = ${round(k * s)} kcal · ` +
    `P ${round((parseFloat($('e-protein').value)||0) * s, 1)} g · ` +
    `C ${round((parseFloat($('e-carbs').value)||0) * s, 1)} g · ` +
    `F ${round((parseFloat($('e-fat').value)||0) * s, 1)} g`;
}

$('e-save').addEventListener('click', () => {
  const name = $('e-name').value.trim();
  const amount = parseFloat($('e-amount').value);
  const kcal = parseFloat($('e-kcal').value);
  if (!name)               return alert(t('alert_need_name'));
  if (!amount || amount <= 0) return alert(t('alert_need_amount'));
  if (isNaN(kcal))         return alert(t('alert_need_kcal'));

  const payload = {
    name, meal: $('e-meal').value, amount, unit: 'g',
    per100g: {
      kcal,
      protein: parseFloat($('e-protein').value) || 0,
      carbs:   parseFloat($('e-carbs').value)   || 0,
      fat:     parseFloat($('e-fat').value)     || 0
    }
  };

  if (editingId) updateEntry(viewDate, editingId, payload);
  else addEntry(viewDate, payload);

  closeModal();
  renderFood();
});

/* ---------- search: favourites + starter list + Open Food Facts ---------- */

const runSearch = debounce(async term => {
  const box = $('suggest');
  const local = [...state.favorites, ...STARTER_FOODS]
    .filter(f => f.name.toLowerCase().includes(term.toLowerCase()))
    .slice(0, 5);

  box.hidden = false;
  box.innerHTML = renderSuggestions(local, t('search_searching'));

  try {
    const remote = await searchOFF(term);
    box.innerHTML = renderSuggestions([...local, ...remote],
      remote.length ? '' : t('search_no_matches'));
  } catch (err) {
    console.error(err);
    box.innerHTML = renderSuggestions(local, t('search_unreachable'));
  }
}, 450);

function renderSuggestions(list, status) {
  const items = list.map((f, i) => {
    const p = f.per100g;
    window.__sugg = window.__sugg || [];
    window.__sugg[i] = f;
    return `<button data-sugg="${i}">
        ${escapeHtml(f.name)}${f.incomplete ? ' ⚠' : ''}
        <span class="suggest__meta">${round(p.kcal)} kcal · P ${p.protein} · C ${p.carbs} · F ${p.fat} per 100 g</span>
      </button>`;
  }).join('');
  return items + (status ? `<div class="suggest__status">${status}</div>` : '');
}

$('e-name').addEventListener('input', e => {
  const v = e.target.value.trim();
  if (v.length < 3) { $('suggest').hidden = true; return; }
  runSearch(v);
});

$('suggest').addEventListener('click', e => {
  const btn = e.target.closest('button[data-sugg]');
  if (!btn) return;
  const f = window.__sugg[+btn.dataset.sugg];
  $('e-name').value = f.name;
  $('e-kcal').value = f.per100g.kcal;
  $('e-protein').value = f.per100g.protein;
  $('e-carbs').value = f.per100g.carbs;
  $('e-fat').value = f.per100g.fat;
  $('suggest').hidden = true;
  updatePreview();
});

/* =========================================================
   WEIGHT
   ========================================================= */

function renderWeight() {
  if (!$('m-date').value) $('m-date').value = todayKey();
  updateDerived();
  renderChart();
  renderMeasurementList();
}

function updateDerived() {
  const w = parseFloat($('m-weight').value);
  const h = state.profile.heightCm;
  const b = bmi(w, h);
  $('m-bmi').value = b ?? '—';
  $('m-bmr').value = w
    ? bmr({ gender: state.profile.gender, weightKg: w, heightCm: h, age: currentAge() })
    : '—';
}

$('m-weight').addEventListener('input', updateDerived);

$('m-save').addEventListener('click', () => {
  const date = $('m-date').value;
  const weightKg = parseFloat($('m-weight').value);
  const bodyFatPct = parseFloat($('m-fat').value);
  if (!date)      return alert(t('alert_pick_date'));
  if (!weightKg)  return alert(t('alert_need_weight'));

  addMeasurement({ date, weightKg, bodyFatPct: isNaN(bodyFatPct) ? null : bodyFatPct });
  refreshTargets(viewDate);        // targets follow bodyweight
  $('m-weight').value = ''; $('m-fat').value = '';
  updateDerived();
  renderWeight();
});

$('m-clear').addEventListener('click', () => {
  $('m-weight').value = ''; $('m-fat').value = '';
  $('m-date').value = todayKey();
  updateDerived();
});

$('range').addEventListener('change', renderChart);

function measurementsInRange() {
  const days = +$('range').value;
  const cutoff = shiftKey(todayKey(), -days);
  return state.measurements.filter(m => m.date >= cutoff);
}

/* Two independent Y axes — weight left, body fat right.
   One shared axis would flatten the fat line against the weight line. */
function renderChart() {
  const data = measurementsInRange();
  const holder = $('chart-holder');

  if (data.length < 2) {
    holder.innerHTML = `<p class="muted" style="text-align:center;padding:var(--s6) 0">
      ${t('chart_empty_hint')}</p>`;
    return;
  }

  const W = 320, H = 180, L = 34, Rt = 34, T = 12, B = 26;
  const x0 = L, x1 = W - Rt, y0 = T, y1 = H - B;

  const ws = scaleSeries(data.map(d => d.weightKg), y0, y1);
  const fatVals = data.map(d => d.bodyFatPct).filter(v => typeof v === 'number');
  const fs = fatVals.length >= 2 ? scaleSeries(data.map(d => d.bodyFatPct), y0, y1) : null;

  const xAt = i => data.length === 1 ? (x0 + x1) / 2
    : x0 + (i / (data.length - 1)) * (x1 - x0);

  const path = (accessor, scale) => data.reduce((acc, d, i) => {
    const v = accessor(d);
    if (typeof v !== 'number' || isNaN(v)) return acc;
    return acc + (acc ? ' L' : 'M') + xAt(i).toFixed(1) + ' ' + scale.y(v).toFixed(1);
  }, '');

  const grid = [0, 0.5, 1].map(f => {
    const y = y0 + f * (y1 - y0);
    return `<line class="chart__grid" x1="${x0}" y1="${y}" x2="${x1}" y2="${y}"/>
            <text class="chart__lbl" x="${x0 - 4}" y="${y + 3}" text-anchor="end">${round(ws.max - f * (ws.max - ws.min), 1)}</text>
            ${fs ? `<text class="chart__lbl" x="${x1 + 4}" y="${y + 3}">${round(fs.max - f * (fs.max - fs.min), 1)}</text>` : ''}`;
  }).join('');

  holder.innerHTML = `
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('chart_aria')}">
      ${grid}
      <path class="chart__wline" d="${path(d => d.weightKg, ws)}"/>
      ${fs ? `<path class="chart__fline" d="${path(d => d.bodyFatPct, fs)}"/>` : ''}
      <text class="chart__lbl" x="${x0}" y="${H - 8}">${shortDate(data[0].date)}</text>
      <text class="chart__lbl" x="${x1}" y="${H - 8}" text-anchor="end">${shortDate(data[data.length-1].date)}</text>
    </svg>`;
}

function renderMeasurementList() {
  const list = [...state.measurements].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
  $('mlist').innerHTML = list.length
    ? `<h2 style="margin-top:0">${t('recent_measurements')}</h2>` + list.map(m => `
        <div class="mrow">
          <span class="mrow__date">${shortDate(m.date)}</span>
          <span><strong>${m.weightKg}</strong> kg</span>
          <span>${m.bodyFatPct != null ? m.bodyFatPct + ' %' : '—'}</span>
          <button class="icon-btn" data-mdel="${m.date}" aria-label="${t('delete_label')}">${TRASH}</button>
        </div>`).join('')
    : `<p class="muted" style="margin:0">${t('no_measurements_yet')}</p>`;
}

$('mlist').addEventListener('click', e => {
  const btn = e.target.closest('button[data-mdel]');
  if (btn && confirm(t('confirm_delete_measurement'))) {
    deleteMeasurement(btn.dataset.mdel);
    renderWeight();
  }
});

const shortDate = key =>
  new Date(key + 'T12:00:00').toLocaleDateString(localeTag(), { day: 'numeric', month: 'short' });

/* =========================================================
   SETTINGS
   ========================================================= */

const S = {
  's-gender': p => p.gender, 's-birth': p => p.birthYear, 's-height': p => p.heightCm,
  's-exp-w': p => p.expenditure.workout, 's-exp-r': p => p.expenditure.rest,
  's-int-w': p => p.intakeTarget.workout, 's-int-r': p => p.intakeTarget.rest,
  's-p-w': p => p.multipliers.protein.workout, 's-p-r': p => p.multipliers.protein.rest,
  's-c-w': p => p.multipliers.carbs.workout,   's-c-r': p => p.multipliers.carbs.rest,
  's-f-w': p => p.multipliers.fat.workout,     's-f-r': p => p.multipliers.fat.rest
};

function renderSettings() {
  const p = state.profile;
  Object.entries(S).forEach(([id, get]) => { $(id).value = get(p); });
  $('s-carbsauto').checked = p.carbsAuto;

  const kg = latestWeight();
  $('s-derived').textContent = t('derived_text', {
    kg, age: currentAge(), bmi: bmi(kg, p.heightCm),
    bmr: bmr({ gender: p.gender, weightKg: kg, heightCm: p.heightCm, age: currentAge() })
  });

  checkSettings();
}

function checkSettings() {
  const box = $('s-check');
  const kg = latestWeight();
  const pv = id => parseFloat($(id).value) || 0;
  const prot = pv('s-p-w') * kg, fat = pv('s-f-w') * kg;
  const carbs = $('s-carbsauto').checked
    ? Math.max(0, (pv('s-int-w') - prot * 4 - fat * 9) / 4)
    : pv('s-c-w') * kg;
  const implied = prot * 4 + carbs * 4 + fat * 9;
  const gap = round(implied - pv('s-int-w'));

  if (Math.abs(gap) <= 50) {
    box.hidden = true; return;
  }
  box.hidden = false;
  box.innerHTML = t('settings_mismatch_notice', {
    implied: round(implied), target: round(pv('s-int-w')),
    gap: (gap > 0 ? '+' : '') + gap
  });
}

Object.keys(S).forEach(id => $(id).addEventListener('input', checkSettings));
$('s-carbsauto').addEventListener('change', checkSettings);

$('s-save').addEventListener('click', () => {
  const p = state.profile, v = id => parseFloat($(id).value);
  p.gender = $('s-gender').value;
  p.birthYear = v('s-birth');
  p.heightCm = v('s-height');
  p.expenditure  = { workout: v('s-exp-w'), rest: v('s-exp-r') };
  p.intakeTarget = { workout: v('s-int-w'), rest: v('s-int-r') };
  p.multipliers = {
    protein: { workout: v('s-p-w'), rest: v('s-p-r') },
    carbs:   { workout: v('s-c-w'), rest: v('s-c-r') },
    fat:     { workout: v('s-f-w'), rest: v('s-f-r') }
  };
  p.carbsAuto = $('s-carbsauto').checked;
  save();
  refreshTargets(viewDate);       // today follows the new settings; past days keep their snapshot
  renderSettings();
  alert(t('alert_settings_saved'));
});

$('s-export').addEventListener('click', exportJSON);
$('s-import-btn').addEventListener('click', () => $('s-import').click());
$('s-import').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  if (!confirm(t('confirm_import'))) { e.target.value = ''; return; }
  try {
    importJSON(await file.text());
    alert(t('alert_backup_restored'));
    location.reload();
  } catch (err) {
    alert(t('alert_backup_read_error', { msg: err.message }));
  }
  e.target.value = '';
});

/* =========================================================
   BOOT
   ========================================================= */

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

applyStaticI18n();
const lastView = sessionStorage.getItem('gm.view');
showView(VIEWS.includes(lastView) ? lastView : 'summary');
