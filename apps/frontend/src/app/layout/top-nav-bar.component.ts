import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../core/auth.service';
import { CompareStore } from '../core/compare-store.service';
import { SidenavService } from '../core/sidenav.service';

interface NavLink {
  path: string;
  label: string;
  icon?: string;
  exact?: boolean;
}

@Component({
  selector: 'app-top-nav-bar',
  templateUrl: './top-nav-bar.component.html',
  styleUrl: './top-nav-bar.component.css',
  imports: [
    FormsModule,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopNavBarComponent {
  private auth = inject(AuthService);
  private compareStore = inject(CompareStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly sidenav = inject(SidenavService);

  readonly user = this.auth.currentUser;
  readonly compareCount = computed(() => this.compareStore.ids().length);

  readonly searchTerm = signal(
    this.route.snapshot.queryParamMap.get('q') ?? '',
  );

  readonly initials = computed(() => {
    const u = this.user();
    if (!u) return '';
    const parts = u.name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  });

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

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
  }

  onSearchSubmit(): void {
    const term = this.searchTerm().trim();
    void this.router.navigate(['/catalogo'], {
      queryParams: term ? { q: term } : {},
    });
  }

  toggleMenu(): void {
    this.sidenav.toggle();
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/');
  }
}