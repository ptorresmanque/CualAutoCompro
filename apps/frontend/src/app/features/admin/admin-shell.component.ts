import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

interface SubLink {
  path: string;
  label: string;
}

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, MatTabsModule],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShellComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly subLinks: SubLink[] = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/brands', label: 'Marcas' },
    { path: '/admin/models', label: 'Modelos' },
    { path: '/admin/versions', label: 'Versiones' },
    { path: '/admin/equipment', label: 'Equipamiento' },
    { path: '/admin/maintenance', label: 'Mantención' },
    { path: '/admin/dealers', label: 'Concesionarios' },
    { path: '/admin/fuel-prices', label: 'Precios combustible' },
    { path: '/admin/users', label: 'Usuarios' },
    { path: '/admin/trash', label: 'Papelera' },
  ];

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  isActive(path: string): boolean {
    const url = this.currentUrl();
    if (path === '/admin') {
      return url === '/admin' || url === '/admin/';
    }
    return url.startsWith(path);
  }
}
