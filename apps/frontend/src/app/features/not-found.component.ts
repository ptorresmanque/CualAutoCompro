import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-3xl px-4 py-24 text-center">
      <p class="stamp-label mb-3">Error 404</p>
      <h1 class="font-display text-5xl text-ink">Página no encontrada</h1>
      <p class="mt-4 text-ink-muted">La dirección que buscas no existe o ya no está disponible.</p>
      <a routerLink="/" class="mt-8 inline-flex bg-ink px-5 py-3 text-sm font-semibold text-paper hover:bg-engine transition-colors">Volver al inicio</a>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {}
