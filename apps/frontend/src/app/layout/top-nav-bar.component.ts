import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { CompareStore } from '../core/compare-store.service';

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
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopNavBarComponent {
  private auth = inject(AuthService);
  private compareStore = inject(CompareStore);
  private router = inject(Router);

  readonly user = this.auth.currentUser;
  readonly menuOpen = signal(false);
  readonly compareCount = computed(() => this.compareStore.ids().length);

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
    return base;
  });

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    this.closeMenu();
    await this.router.navigateByUrl('/');
  }
}
