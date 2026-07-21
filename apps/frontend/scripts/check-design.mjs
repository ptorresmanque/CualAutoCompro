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

for await (const file of walk(SRC_ROOT)) {
  const text = await fs.readFile(file, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const r of RULES) {
      if (r.allow && r.allow.test(line)) continue;
      const msg = r.test(line);
      if (!msg) continue;
      console.error(`✘ ${r.id}  ${path.relative(FRONTEND_ROOT, file)}:${i + 1}  ${msg}`);
      console.error(`    ${line.trim()}`);
      errors += 1;
    }
  });
}

if (errors > 0) {
  console.error(`\nDesign system: ${errors} violación(es). Ver apps/frontend/AGENTS.md.`);
  process.exit(1);
}
console.log(`Design system: OK (${errors} violación(es))`);
