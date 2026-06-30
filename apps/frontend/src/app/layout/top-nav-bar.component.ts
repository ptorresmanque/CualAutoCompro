import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';

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
  private router = inject(Router);

  readonly user = this.auth.currentUser;
  readonly menuOpen = signal(false);

  readonly initials = computed(() => {
    const u = this.user();
    if (!u) return '';
    const parts = u.name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  });

  readonly navLinks = computed<NavLink[]>(() => {
    const u = this.user();
    const base: NavLink[] = [
      { path: '/', label: 'Catálogo', icon: 'directions_car', exact: true },
      { path: '/compare', label: 'Comparar', icon: 'compare_arrows' },
    ];
    if (u) base.push({ path: '/account/comparisons', label: 'Mis comparaciones', icon: 'bookmarks' });
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
