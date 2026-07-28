# Paleta "Pizarra Digital 2.0" — decisión de diseño

**Fecha:** 2026-07-28
**Estado:** aplicado
**Alcance:** `apps/frontend/` completo

## Problema

El pedido original fue "hacer la paleta más atractiva y legible". Auditando el
sistema existente aparecieron cuatro defectos medibles, no de gusto:

1. **Falla de contraste WCAG AA.** `--graphite` (`#64748B`) sobre `--paper-warm`
   (`#EEF2F7`) daba **4.23:1**. Ese token pinta los `<dt>` de `.ficha-data`,
   `.filter-label`, `.ficha-num`, `.ficha-unit` y `.brand-meta`: el texto más
   chico del sitio (mono 11px) sobre el fondo donde peor se lee.

2. **Hover invertido.** `--engine-dark` (`#1D4ED8`, 6.70:1) era *más claro* que
   `--engine` (`#1E40AF`, 8.72:1). Todos los hovers del acento aclaraban.

3. **Tokens usados y nunca definidos.** `--engine-50` (6 usos), `--engine-100`
   (2), `--engine-200` (1), sin fallback → los fondos no se pintaban.
   Más `--c-border`, `--c-surface`, `--c-ink-muted`, que sí tenían fallback pero
   hardcodeaban la paleta vieja y no habrían seguido un cambio de tokens.

4. **Clases Tailwind que nunca se generaron.** La escala `engine` no tenía clave
   `dark`, así que `text-engine-dark` (12 usos) y `hover:bg-engine-dark` (2)
   no producían CSS. Lo mismo con `border-success` / `bg-success-light`, usados
   en `forgot-password` y `reset-password` sin que la escala `success` existiera.

A eso se sumaba un vacío semántico: no había tokens de éxito ni de error de
primera clase. La rampa ámbar `warn-*` cubría tres intenciones distintas —
avisos legítimos, errores de formulario y errores de carga — así que un fallo
de subida de imagen se veía igual que una nota legal.

## Opciones evaluadas

Se propusieron tres direcciones, las tres con contrastes verificados en AA:

| | Dirección | Riesgo | Por qué se descartó |
| --- | --- | --- | --- |
| **A** | **Pizarra Digital 2.0** — misma identidad azul acero, neutros recalibrados, rampa `engine` completa, semánticos nuevos | Bajo | **Elegida** |
| **B** | **Señalética** — neutros tibios hueso + acento naranja `#C2410C`, azul degradado a informativo | Medio | Más carácter, pero recolorea la identidad y obliga a revisar caso por caso los ~28 usos de `text-engine` para que el naranja no sature |
| **C** | **Chasis** — acento teal `#0F766E` + modo oscuro completo con toggle y `prefers-color-scheme` | Alto | El mayor salto visual, pero duplica cada token de superficie; desproporcionado frente al problema real, que era de contraste |

**Criterio de decisión:** los cuatro defectos son de legibilidad y de plomería,
no de identidad. La opción A los arregla sin pedirle al usuario que reaprenda
la interfaz. B y C quedan registradas como alternativas evaluadas, **no como
trabajo pendiente**.

## Paleta resultante

Ver la tabla completa con ratios en `apps/frontend/AGENTS.md` §1. Los cambios
de fondo:

- `--graphite` `#64748B` → `#56657A` (4.23 → **5.13** sobre `paper-warm`)
- `--ink-muted` `#475569` → `#3D4A5C`
- `--ink` `#0F172A` → `#0B1220`
- `--engine` `#1E40AF` → `#1D4ED8`, `--engine-dark` `#1D4ED8` → `#1E3A8A`
- `--rule-strong` `#7A8CA5` (nuevo) — bordes de control a 3:1
- `--danger*` / `--success*` (nuevos) — separados de `--caution*`

## Decisiones puntuales

- **`--rule` vs `--rule-strong`.** Los `mat-form-field` usaban `--rule` como
  borde (1.32:1), que falla WCAG 1.4.11 para controles. Se separó el hairline
  decorativo del borde de control en lugar de oscurecer `--rule` y ensuciar
  todos los separadores.

- **`--caution` se quedó igual.** Ya cumplía AA y su significado (aviso) no
  cambió. Solo se le sacaron de encima los usos que en realidad eran errores.

- **`.settings-btn-danger` sigue en `engine`, no en `danger`.** AGENTS.md §4 lo
  define así explícitamente ("outline engine, sin relleno rojo") y es una
  decisión de diseño previa, no un accidente. Tener `--danger` disponible no la
  invalida.

- **`::selection` pasó de `--caution` a `--engine-100`.** El ámbar quemado con
  texto `--ink` daba 1.9:1: seleccionar texto lo volvía ilegible.

- **Botones Material.** Material migró de `--mdc-filled-button-container-color`
  a `--mat-button-filled-container-color`. El override existente seteaba solo el
  token viejo, así que el CTA "Crear cuenta" venía saliendo azul contra la
  jerarquía de §3. Ahora se setean ambos.

## Guardas

Se agregaron dos reglas a `apps/frontend/scripts/check-design.mjs`
(`undefined-token` y `contrast-aa`, documentadas en AGENTS.md §5) para que
estos defectos no puedan volver en silencio. Se verificó que **fallan** cuando
corresponde, no solo que pasan.

La consecuencia práctica: la paleta ya no se puede editar "a ojo". Si alguien
aclara `--graphite` o invierte el hover del acento, el build lo detiene con el
ratio exacto.

## Hallazgos fuera de alcance

Detectados durante la auditoría, **no** corregidos acá:

- El resaltado de celdas distintas en la comparativa no funciona: el selector
  `.compare-table .row-diff td` no coincide con el marcado real (la tabla no
  lleva `compare-table` y `row-diff` va sobre el propio `<td>`). La copia de la
  página promete ese resaltado.
- Cinco bloques de CSS en `model.component.css` y `compare.component.css`
  apuntan a clases que ya no existen en los templates.
- La suite de frontend tiene 10 tests fallando en 4 archivos, previos a este
  cambio (verificado con `git stash`).
