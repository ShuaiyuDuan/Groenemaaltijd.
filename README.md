# Groenemaaltijd

Personal nutrition tracker. Runs entirely in the browser — no server, no PHP, no accounts.
Data is stored in `localStorage` on this device only.

## Live version

Deployed via GitHub Pages at **https://shuaiyuduan.github.io/Groenemaaltijd./** — it redeploys
automatically a minute or so after every push to `main`, no build step required.

## Two versions of the same app

| File | Use it when |
|---|---|
| `groenemaaltijd-single.html` | You just want it to run. Everything inlined, no folders. |
| `index.html` + `css/` + `js/` | You want to work on the code. This is the real source. |

**The split version is the source of truth.** After editing it, run:

```bash
python3 build.py
```

That regenerates `groenemaaltijd-single.html` from `index.html`, `css/style.css` and the `js/` modules. Never edit the single file by hand — your changes get overwritten on the next build.

## Running it

ES modules and `fetch` don't work from `file://`, so you need a local server:

```bash
php -S localhost:8000
```

Or right-click `index.html` in VS Code → **Open with Live Server**.

## Structure

```
groenemaaltijd/
├── index.html      four views (Summary / Food / Weight / Settings)
├── build.py        bundles everything into one file
├── css/
│   └── style.css   tokens at the top, mobile-first, min-width only
└── js/
    ├── data.js     starter food list, per 100 g
    ├── storage.js  the ONLY file that touches localStorage
    ├── calc.js     pure maths — no DOM, no storage
    ├── off.js      Open Food Facts search (debounced + cached)
    └── app.js      view switching + all four renderers
```

The nav switches views by hiding sections — there's only one page, no reloads.

## Rules the code follows

- **Per-100 g values plus an amount** are stored, never pre-multiplied totals — so portions stay editable
- **Totals are recomputed on every render**, never cached — they can't go stale
- **Each day snapshots its targets** when first opened, so changing settings in October doesn't rewrite August
- **Metric only in storage**; convert at display time if you ever add lb
- Dates are local `YYYY-MM-DD`, never `toISOString()` — that rolls over at the wrong hour in Belgium
- All rendering is `textContent` or escaped via `escapeHtml()` — Open Food Facts names are user-submitted

## Calories and macros

Three separate numbers, deliberately:

- **Expenditure** — what you burn (higher on workout days)
- **Intake target** — what you aim to eat (below expenditure when cutting)
- **Actual intake** — summed from the Food page

Macros are set as **grams per kg of bodyweight**, using your most recent measurement.
Because macros carry calories, they can disagree with your intake target; the app shows the
gap rather than silently "fixing" it. Turn on **Carbs fill the gap** in Settings to make carbs
absorb the remainder instead, and the two always reconcile.

## Backup

`localStorage` is wiped if you clear browser data. **Settings → Export backup** downloads a JSON
file; Import restores it. Do this occasionally.

## Open Food Facts

Search hits their public API from the browser. It's volunteer-run, so the code debounces to
400 ms, caches per search term, and requests 15 results at a time. Products with no calorie
data are filtered out; products missing some macros are marked ⚠ and default those to 0 —
check and correct them before saving.

## Not built yet

- Barcode scanning (would use the device camera + the OFF barcode endpoint)
- Weekly averages on the summary
- Copying a previous day's meals
