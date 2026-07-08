import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AuthService } from '../core/auth.service';
import { CompareStore } from '../core/compare-store.service';
import { SidenavService } from '../core/sidenav.service';
import { FooterComponent } from './footer.component';
import { TopNavBarComponent } from './top-nav-bar.component';

interface NavLink {
  path: string;
  label: string;
  icon?: string;
  exact?: boolean;
}

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
    FooterComponent,
    TopNavBarComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private auth = inject(AuthService);
  private compareStore = inject(CompareStore);
  sidenav = inject(SidenavService);

  readonly user = this.auth.currentUser;
  readonly compareCount = computed(() => this.compareStore.ids().length);

  readonly navLinks = computed<NavLink[]>(() => {
    const u = this.user();
    const base: NavLink[] = [
      { path: '/', label: 'Inicio', icon: 'home', exact: true },
      { path: '/catalogo', label: 'Catálogo', icon: 'directions_car' },
      { path: '/compare', label: 'Comparar', icon: 'compare_arrows' },
    ];
    if (u) {
      base.splice(2, 0, { path: '/favoritos', label: 'Favoritos', icon: 'favorite' });
      base.push({ path: '/account/comparisons', label: 'Mis comparaciones', icon: 'bookmarks' });
    }
    if (u?.role === 'ADMIN') {
      base.push({ path: '/admin', label: 'Admin', icon: 'admin_panel_settings' });
    }
    return base;
  });

  readonly initials = computed(() => {
    const u = this.user();
    if (!u) return '';
    const parts = u.name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  });

  onNavLinkClick(): void {
    this.sidenav.close();
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    this.sidenav.close();
  }
}