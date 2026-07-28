#!/usr/bin/env node
// Linter del Design System "Pizarra Digital".
// Ver apps/frontend/AGENTS.md.
//
// Alcance: todo apps/frontend/src/**/*.{html,ts,css}.
// Cualquier violación produce ERROR y exit 1.
import { promises as fs } from 'node:fs';
import path from 'node:path';

const FRONTEND_ROOT = path.resolve(process.cwd());
const SRC_ROOT = path.join(FRONTEND_ROOT, 'src');

const EXTS = new Set(['.html', '.ts', '.css']);

const RULES = [
  {
    id: 'rounded-soft',
    test: (l) => /\brounded-(full|3xl|2xl|xl)\b/.test(l) ? 'rounded-* no permitido (radio es 0 o 2px)' : null,
  },
  {
    id: 'shadow-soft',
    test: (l) => /\bshadow-(sm|md|lg|xl|2xl|inner)\b/.test(l) ? 'sombras suaves no permitidas; usar hairline o sombra dura' : null,
  },
  {
    id: 'tailwind-palette',
    test: (l) => /\b(bg|text|border)-(red|blue|green|yellow|pink|purple|indigo|orange|teal|cyan|emerald|sky|amber|fuchsia|rose|slate|zinc|gray|neutral|stone)-\d{2,3}\b/.test(l) ? 'paleta Tailwind cruda; usar tokens (--ink, --engine, etc.)' : null,
    allow: /\b(bg-(paper|paper-warm|paper-cool|engine-100|engine-50|caution-light|surface-muted))\b/,
  },
  {
    id: 'mat-fab-primary',
    test: (l) => /mat-fab[^>]*color="primary"|mat-fab[^>]*extended/.test(l) ? 'mat-fab color="primary" rompe el sistema; usar .ficha-compare' : null,
  },
  {
    id: 'mat-card-layout',
    test: (l) => /<mat-card[^>]*appearance="outlined"/.test(l) ? 'mat-card outlined no se usa como layout grande; usar .ficha' : null,
    allow: /data-testid=.*appearance="outlined"/,
  },
];

async function* walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      yield* walk(full);
    } else if (EXTS.has(path.extname(e.name))) {
      yield full;
    }
  }
}

let errors = 0;

const report = (id, loc, msg, detail) => {
  console.error(`✘ ${id}  ${loc}  ${msg}`);
  if (detail) console.error(`    ${detail}`);
  errors += 1;
};

// ---------------------------------------------------------------------------
// Reglas línea a línea
// ---------------------------------------------------------------------------

/** Todos los `var(--x)` del proyecto, con el archivo/línea donde aparecen. */
const tokenUses = new Map(); // '--x' -> [{ file, line, hasFallback }]

for await (const file of walk(SRC_ROOT)) {
  const text = await fs.readFile(file, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const r of RULES) {
      if (r.allow && r.allow.test(line)) continue;
      const msg = r.test(line);
      if (!msg) continue;
      report(r.id, `${path.relative(FRONTEND_ROOT, file)}:${i + 1}`, msg, line.trim());
    }

    for (const m of line.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)\s*(,?)/g)) {
      const [, name, comma] = m;
      if (!tokenUses.has(name)) tokenUses.set(name, []);
      tokenUses.get(name).push({
        file: path.relative(FRONTEND_ROOT, file),
        line: i + 1,
        hasFallback: comma === ',',
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Paleta: parseo del `:root` de styles.css
// ---------------------------------------------------------------------------

const stylesPath = path.join(SRC_ROOT, 'styles.css');
const stylesText = await fs.readFile(stylesPath, 'utf8');
const rootBlock = stylesText.slice(
  stylesText.indexOf(':root {'),
  stylesText.indexOf('\n}', stylesText.indexOf(':root {')),
);

/** '--x' -> valor crudo (hex, `var(--y)`, lo que sea). */
const tokens = new Map();
for (const m of rootBlock.matchAll(/^\s*(--[A-Za-z0-9_-]+)\s*:\s*([^;]+);/gm)) {
  tokens.set(m[1], m[2].trim());
}

/** Resuelve cadenas de alias hasta llegar a un `#rrggbb`. */
function resolveHex(name, seen = new Set()) {
  if (seen.has(name)) return null;
  seen.add(name);
  const raw = tokens.get(name);
  if (!raw) return null;
  const hex = raw.match(/^#([0-9A-Fa-f]{6})$/);
  if (hex) return `#${hex[1].toUpperCase()}`;
  const alias = raw.match(/^var\(\s*(--[A-Za-z0-9_-]+)\s*\)$/);
  return alias ? resolveHex(alias[1], seen) : null;
}

const relLuminance = (hex) => {
  const ch = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
};

const contrast = (a, b) => {
  const [hi, lo] = [relLuminance(a), relLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// ---------------------------------------------------------------------------
// Regla `undefined-token`
//
// Atrapa el bug histórico de `--engine-50`: usado en 6 lugares, definido en
// ninguno, y sin fallback → el fondo simplemente no se pintaba.
// Los `--mat-*` / `--mdc-*` los define el prebuilt theme de Material, no
// nosotros, así que quedan fuera del chequeo.
// ---------------------------------------------------------------------------

for (const [name, uses] of tokenUses) {
  if (/^--(mat|mdc)-/.test(name)) continue;
  if (tokens.has(name)) continue;
  const withoutFallback = uses.filter((u) => !u.hasFallback);
  if (withoutFallback.length === 0) continue;
  const { file, line } = withoutFallback[0];
  report(
    'undefined-token',
    `${file}:${line}`,
    `var(${name}) no está definido en el :root de src/styles.css y no tiene fallback`,
    withoutFallback.length > 1 ? `+ ${withoutFallback.length - 1} uso(s) más` : '',
  );
}

// ---------------------------------------------------------------------------
// Regla `contrast-aa`
//
// Pares fg/bg que el sistema garantiza. 4.5 = texto normal (AA), 3.0 = borde
// de control / texto grande (AA, WCAG 1.4.11). Si agregás un token de color
// que se combine con otro, agregá el par acá.
// ---------------------------------------------------------------------------

const CONTRAST_PAIRS = [
  // El peor caso del sistema: mono 11px sobre la cabecera de la ficha.
  ['--graphite', '--paper-warm', 4.5, 'dt / labels sobre paper-warm'],
  ['--graphite', '--paper', 4.5, 'brand-meta sobre el fondo'],
  ['--graphite', '--paper-cool', 4.5, 'captions sobre tarjeta'],
  ['--ink-muted', '--paper-warm', 4.5, 'texto secundario sobre paper-warm'],
  ['--ink', '--paper-warm', 4.5, 'texto principal sobre paper-warm'],
  ['--engine', '--paper-warm', 4.5, 'links sobre paper-warm'],
  ['--engine', '--paper-cool', 4.5, 'links sobre tarjeta'],
  ['--engine-dark', '--engine-50', 4.5, 'mensajes informativos'],
  ['--paper', '--ink', 4.5, 'label del CTA primario'],
  ['--paper', '--engine', 4.5, 'label del CTA en hover'],
  ['--caution-dark', '--caution-light', 4.5, 'aviso / nota legal'],
  ['--danger-dark', '--danger-light', 4.5, 'mensaje de error'],
  ['--success-dark', '--success-light', 4.5, 'mensaje de confirmación'],
  ['--paper', '--danger', 4.5, 'label sobre relleno destructivo'],
  ['--rule-strong', '--paper-cool', 3.0, 'borde de control (WCAG 1.4.11)'],
  ['--rule-strong', '--paper', 3.0, 'borde de control sobre el fondo'],
];

const rel = path.relative(FRONTEND_ROOT, stylesPath);

for (const [fg, bg, min, what] of CONTRAST_PAIRS) {
  const a = resolveHex(fg);
  const b = resolveHex(bg);
  if (!a || !b) {
    report('contrast-aa', rel, `no se pudo resolver ${!a ? fg : bg} a un hex`, what);
    continue;
  }
  const ratio = contrast(a, b);
  if (ratio >= min) continue;
  report(
    'contrast-aa',
    rel,
    `${fg} sobre ${bg} da ${ratio.toFixed(2)}:1, se requiere ${min}:1`,
    `${what} — ${a} / ${b}`,
  );
}

// `--engine-dark` es el hover de `--engine`: tiene que oscurecer, no aclarar.
{
  const base = resolveHex('--engine');
  const dark = resolveHex('--engine-dark');
  if (base && dark && relLuminance(dark) >= relLuminance(base)) {
    report(
      'contrast-aa',
      rel,
      `--engine-dark (${dark}) no es más oscuro que --engine (${base})`,
      'el hover del acento tiene que oscurecer',
    );
  }
}

if (errors > 0) {
  console.error(`\nDesign system: ${errors} violación(es). Ver apps/frontend/AGENTS.md.`);
  process.exit(1);
}
console.log(`Design system: OK (${errors} violación(es))`);
