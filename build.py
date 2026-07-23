#!/usr/bin/env python3
"""build.py — inline css/ and js/ into one standalone HTML file.

Run:  python3 build.py
Out:  groenemaaltijd-single.html
"""
import re, pathlib

base = pathlib.Path(__file__).parent
html = (base / 'index.html').read_text(encoding='utf-8')
css  = (base / 'css/style.css').read_text(encoding='utf-8')

# concatenation order matters: no imports survive bundling
order = ['data.js', 'storage.js', 'calc.js', 'off.js', 'i18n.js', 'app.js']

def strip_modules(src):
    src = re.sub(r'^\s*import\s[\s\S]*?;\s*$', '', src, flags=re.M)
    src = re.sub(r'^export\s+(async\s+function|function|const|let|var|class)', r'\1', src, flags=re.M)
    src = re.sub(r'^\s*export\s*\{[^}]*\};\s*$', '', src, flags=re.M)
    return src

js = '\n\n'.join(strip_modules((base / 'js' / f).read_text(encoding='utf-8')) for f in order)

html = html.replace('<link rel="stylesheet" href="css/style.css">',
                    '<style>\n' + css + '\n</style>')
html = html.replace('<script type="module" src="js/app.js"></script>',
                    '<script>\n' + js + '\n</script>')

out = base / 'groenemaaltijd-single.html'
out.write_text(html, encoding='utf-8')
print(f'wrote {out.name} ({len(html):,} bytes)')