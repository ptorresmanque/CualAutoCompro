import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingBarComponent } from './shared/ui/loading-bar.component';
import { PageMetaService } from './core/page-meta.service';
import { ScrollRestorationService } from './core/scroll-restoration.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoadingBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly pageMeta = inject(PageMetaService);
  private readonly scrollRestoration = inject(ScrollRestorationService);

  constructor() {
    // Acá y no en `app.config.ts`: la suscripción a `NavigationEnd` tiene que
    // estar viva antes de la primera navegación, pero el servicio necesita el
    // Router ya construido. El componente raíz cumple las dos condiciones.
    this.pageMeta.applyRouteDefaults();

    // Misma razón, y después de la metadata: escucha `Scroll`, que el router
    // emite recién al final de la navegación.
    this.scrollRestoration.keepRestoredPosition();
  }
}
