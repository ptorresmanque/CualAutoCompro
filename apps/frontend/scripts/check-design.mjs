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

/** Valores de `border-radius` que el sistema acepta. Ver la regla `raw-radius`. */
const RADIUS_OK = /^(0|0px|2px|4px|0\.125rem|0\.25rem|50%|9999px)$/;

const RULES = [
  {
    id: 'rounded-soft',
    test: (l) => /\brounded-(full|3xl|2xl|xl)\b/.test(l) ? 'rounded-* no permitido (radio es 0, 2px o 4px)' : null,
  },
  {
    id: 'shadow-soft',
    test: (l) => /\bshadow-(sm|md|lg|xl|2xl|inner)\b/.test(l) ? 'sombras suaves no permitidas; usar hairline o sombra dura' : null,
  },
  {
    id: 'tailwind-palette',
    test: (l) => /\b(bg|text|border)-(red|blue|green|yellow|pink|purple|indigo|orange|teal|cyan|emerald|sky|amber|fuchsia|rose|slate|zinc|gray|neutral|stone)-\d{2,3}\b/.test(l) ? 'paleta Tailwind cruda; usar tokens (--ink, --engine, etc.)' : null,
    // `bg-surface-muted` vivía acá y salió con la familia `surface` de
    // `tailwind.config.js`: sin definición la clase no compila, así que no hay
    // nada que permitir.
    allow: /\b(bg-(paper|paper-warm|paper-cool|engine-100|engine-50|caution-light))\b/,
  },
  {
    id: 'raw-white',
    // El blanco del sistema es `--paper-cool` (bg-paper-cool / text-paper).
    // `text-white` / `bg-white` saltean la paleta y, con ella, los pares de
    // `CONTRAST_PAIRS`: un blanco que el linter no conoce no se puede chequear.
    // Anclado con \b para no disparar sobre `rgba(255, 255, 255, …)` ni sobre
    // clases que contengan la subcadena (`bg-whitespace`, `text-whiteboard`).
    test: (l) => /\b(text|bg)-white\b/.test(l) ? 'blanco crudo de Tailwind; usar text-paper / bg-paper-cool' : null,
  },
  {
    id: 'raw-radius',
    // El radio del sistema es 0, 2px o 4px. Ver AGENTS.md §3.
    //
    // Excepción acordada: `50%` y `9999px` están permitidos. No son decisiones
    // de branding, son formas dictadas por el control — círculo y píldora — y
    // el sistema no tiene un token para "redondo". Hoy los usan los thumbs del
    // range slider (shared/ui/range-slider.component.css:82 y :106) y un chip
    // del admin (features/admin/admin-edit-dialog.component.css:42). Si borrás
    // esta excepción por "limpieza", esos tres controles se vuelven cuadrados.
    //
    // Los valores en `rem` también se evalúan: `0.125rem` (2px) y `0.25rem`
    // (4px) son las únicas formas relativas del sistema. Antes quedaban fuera
    // del chequeo porque el repo arrastraba 7 radios preexistentes —seis en el
    // panel de admin y uno en los botones de login social— que ya se migraron
    // a `4px`; el hueco está cerrado.
    test: (l) => {
      const m = /border-radius\s*:\s*([^;{}]+)/.exec(l);
      if (!m) return null;
      const value = m[1].replace(/!important/g, '').trim();
      const parts = value.split(/[\s/]+/).filter(Boolean);
      if (parts.length === 0) return null;
      return parts.every((p) => RADIUS_OK.test(p))
        ? null
        : 'border-radius fuera del sistema (0, 2px o 4px; 50% y 9999px para formas circulares)';
    },
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

// ---------------------------------------------------------------------------
// Regla `semantic-alert` (chequeo sobre el texto completo, no línea a línea)
//
// `AGENTS.md` §1 reserva `engine` para información y `danger` para errores.
// Una caja de error pintada de azul pálido es indistinguible del banner
// "estás viendo una comparación guardada". Ocho cajas nacieron así y hubo que
// migrarlas; sin esta regla, la novena vuelve a nacer igual.
//
// No es una regla línea a línea a propósito: en este repo el `class="…"` y el
// `role="alert"` casi nunca comparten línea (mirá model.component.html o
// login.component.html — el `class` va arriba y el `role` una o dos líneas más
// abajo). Una regla que solo mirara la línea del `role` no encontraría nunca
// nada y pasaría la verificación sin haber chequeado nada.
//
// Por eso: por cada `role="alert"` se recorta la etiqueta que lo contiene
// (ver `sliceTagAround`, que ignora los `<` y `>` que viven adentro de un
// atributo) y se evalúa el `class` de esa etiqueta. Se reporta el archivo y la
// línea del `role`.
// ---------------------------------------------------------------------------

/** Paleta informativa: lo que una caja con `role="alert"` no puede usar. */
const INFO_PALETTE = /\b(bg-engine-\d{2,3}|border-engine(?:-\d{2,3})?|text-engine-dark)\b/;

/**
 * Paleta semántica propia. Si la etiqueta ya la trae, la mención a `engine` es
 * otra cosa (un hover, un link adentro) y no se reporta: el falso positivo de
 * `bg-danger-light … hover:text-engine` es peor que el hueco.
 */
const SEMANTIC_PALETTE = /\b(bg|border|text)-(danger|caution|warn|success)(-[a-z]+)?\b/;

/** Ninguna etiqueta del repo se acerca a esto; acota el escaneo hacia adelante. */
const TAG_WINDOW = 8000;

/**
 * Reemplaza por espacios el contenido de los valores entrecomillados, dejando
 * las comillas y el largo intactos (los índices siguen valiendo sobre el texto
 * original).
 *
 * Existe porque `<` y `>` viven adentro de los atributos todo el tiempo en
 * Angular — `[class.mb-4]="items.length > 0"`, `title="antes > despues"` — y
 * confundirlos con el cierre de la etiqueta hacía que `semantic-alert` se
 * apagara **en silencio**: recortaba mal la etiqueta, no encontraba el
 * `class`, y no reportaba nada. Un linter que falla callado es peor que no
 * tenerlo.
 */
function maskAttributeValues(s) {
  let out = '';
  let quote = null;
  for (const ch of s) {
    if (quote) {
      out += ch === quote ? ch : ' ';
      if (ch === quote) quote = null;
    } else {
      if (ch === '"' || ch === "'") quote = ch;
      out += ch;
    }
  }
  return out;
}

/**
 * Recorta la etiqueta que contiene la posición `at`. Va probando los `<`
 * hacia atrás: el candidato vale si abre una etiqueta (letra después del `<`)
 * y si, ignorando lo que está entrecomillado, no hay un `>` entre él y `at`.
 * Así también se descarta el `<` que vive adentro de un atributo
 * (`[attr.x]="a < b"`), que antes hacía perder la etiqueta entera.
 */
function sliceTagAround(text, at) {
  let open = text.lastIndexOf('<', at);
  for (let tries = 0; open !== -1 && at - open <= TAG_WINDOW && tries < 16; tries += 1) {
    if (/[A-Za-z]/.test(text[open + 1] ?? '')) {
      const raw = text.slice(open, Math.min(text.length, at + TAG_WINDOW));
      const masked = maskAttributeValues(raw);
      const rel = at - open;
      if (!masked.slice(0, rel).includes('>')) {
        const close = masked.indexOf('>', rel);
        if (close !== -1) return raw.slice(0, close + 1);
      }
    }
    open = text.lastIndexOf('<', open - 1);
  }
  return null;
}

function checkSemanticAlert(relFile, text) {
  for (const m of text.matchAll(/role\s*=\s*["']alert["']/g)) {
    const at = m.index;
    const tag = sliceTagAround(text, at);
    if (!tag) continue;

    const cls = [...tag.matchAll(/\bclass\s*=\s*"([^"]*)"/g)].map((c) => c[1]).join(' ');
    if (!INFO_PALETTE.test(cls)) continue;
    if (SEMANTIC_PALETTE.test(cls)) continue;

    const line = text.slice(0, at).split('\n').length;
    report(
      'semantic-alert',
      `${relFile}:${line}`,
      'role="alert" con paleta informativa (engine); los errores van en danger',
      tag.replace(/\s+/g, ' ').slice(0, 140),
    );
  }
}

/** Todos los `var(--x)` del proyecto, con el archivo/línea donde aparecen. */
const tokenUses = new Map(); // '--x' -> [{ file, line, hasFallback }]

for await (const file of walk(SRC_ROOT)) {
  const text = await fs.readFile(file, 'utf8');
  const lines = text.split(/\r?\n/);
  if (path.extname(file) !== '.css') {
    checkSemanticAlert(path.relative(FRONTEND_ROOT, file), text);
  }
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
  // El tercer fondo faltaba, y es el más común: 33 reglas ponen el texto en
  // `--engine` y el fondo de la página es `--paper`.
  ['--engine', '--paper', 4.5, 'links sobre el fondo'],
  ['--engine-dark', '--engine-50', 4.5, 'mensajes informativos'],
  // Los otros dos escalones de la rampa azul contra la tinta que los acompaña:
  // `--engine-100` pinta un fondo y `--engine-200` aparece en tres reglas,
  // siempre debajo de texto `--engine-dark` (7 reglas). Pasan holgados, pero
  // sin declararlos nadie garantiza que sigan pasando: tocar un hex de la
  // rampa no rompía nada visible hasta que alguien lo mirara.
  ['--engine-dark', '--engine-100', 4.5, 'chips y sellos de acento'],
  ['--engine-dark', '--engine-200', 4.5, 'hover de chips de acento'],
  ['--paper', '--ink', 4.5, 'label del CTA primario'],
  ['--paper', '--engine', 4.5, 'label del CTA en hover'],
  ['--caution-dark', '--caution-light', 4.5, 'aviso / nota legal'],
  ['--danger-dark', '--danger-light', 4.5, 'mensaje de error'],
  ['--success-dark', '--success-light', 4.5, 'mensaje de confirmación'],
  ['--paper', '--danger', 4.5, 'label sobre relleno destructivo'],
  // Botón destructivo outline (`.settings-btn-danger`, "Eliminar mi cuenta"):
  // texto y borde `danger` sobre la tarjeta blanca. Antes esas dos reglas eran
  // `engine` y por eso no había par declarado.
  ['--danger-dark', '--paper-cool', 4.5, 'texto del botón destructivo outline'],
  ['--danger', '--paper-cool', 3.0, 'borde del botón destructivo (WCAG 1.4.11)'],
  ['--rule-strong', '--paper-cool', 3.0, 'borde de control (WCAG 1.4.11)'],
  ['--rule-strong', '--paper', 3.0, 'borde de control sobre el fondo'],
  // Dos reglas ponen `--success` en un `border`. Un borde es componente no
  // textual: el umbral es 3:1, no 4.5:1.
  ['--success', '--paper-cool', 3.0, 'borde de confirmación'],
  ['--success', '--paper', 3.0, 'borde de confirmación sobre el fondo'],
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
