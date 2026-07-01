import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface SubLink {
  path: string;
  label: string;
}

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShellComponent {
  readonly subLinks: SubLink[] = [
    { path: '/admin', label: 'Dashboard', },
    { path: '/admin/brands', label: 'Marcas' },
    { path: '/admin/models', label: 'Modelos' },
    { path: '/admin/versions', label: 'Versiones' },
    { path: '/admin/equipment', label: 'Equipamiento' },
    { path: '/admin/maintenance', label: 'Mantención' },
  ];
}
