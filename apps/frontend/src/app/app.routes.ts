import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/landing/landing.component').then(
            (m) => m.LandingComponent,
          ),
      },
      {
        path: 'catalogo',
        loadComponent: () =>
          import('./features/catalog/catalog.component').then(
            (m) => m.CatalogComponent,
          ),
      },
      {
        path: 'compare',
        loadComponent: () =>
          import('./features/compare/compare.component').then(
            (m) => m.CompareComponent,
          ),
      },
      {
        path: 'c/:slug',
        loadComponent: () =>
          import('./features/compare/compare.component').then(
            (m) => m.CompareComponent,
          ),
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login.component').then(
            (m) => m.LoginComponent,
          ),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register.component').then(
            (m) => m.RegisterComponent,
          ),
      },
      {
        path: 'account/comparisons',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/account/comparisons.component').then(
            (m) => m.ComparisonsComponent,
          ),
      },
      {
        path: 'account/settings',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/account/settings.component').then(
            (m) => m.AccountSettingsComponent,
          ),
      },
      {
        path: 'account/forgot-password',
        loadComponent: () =>
          import('./features/account/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent,
          ),
      },
      {
        path: 'account/reset-password',
        loadComponent: () =>
          import('./features/account/reset-password.component').then(
            (m) => m.ResetPasswordComponent,
          ),
      },

      {
        path: 'favoritos',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/favorites/favorites.component').then(
            (m) => m.FavoritesComponent,
          ),
      },
      {
        path: 'brand/:brandSlug/model/:modelSlug',
        loadComponent: () =>
          import('./features/model/model.component').then(
            (m) => m.ModelComponent,
          ),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/admin/admin-shell.component').then(
            (m) => m.AdminShellComponent,
          ),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/admin/admin-dashboard.component').then(
                (m) => m.AdminDashboardComponent,
              ),
          },
          {
            path: 'brands',
            loadComponent: () =>
              import('./features/admin/brands-admin.component').then(
                (m) => m.BrandsAdminComponent,
              ),
          },
          {
            path: 'models',
            loadComponent: () =>
              import('./features/admin/models-admin.component').then(
                (m) => m.ModelsAdminComponent,
              ),
          },
          {
            path: 'versions',
            loadComponent: () =>
              import('./features/admin/versions-admin.component').then(
                (m) => m.VersionsAdminComponent,
              ),
          },
          {
            path: 'equipment',
            loadComponent: () =>
              import('./features/admin/equipment-admin.component').then(
                (m) => m.EquipmentAdminComponent,
              ),
          },
          {
            path: 'maintenance',
            loadComponent: () =>
              import('./features/admin/maintenance-admin.component').then(
                (m) => m.MaintenanceAdminComponent,
              ),
          },
          {
            path: 'dealers',
            loadComponent: () =>
              import('./features/admin/dealers-admin.component').then(
                (m) => m.DealersAdminComponent,
              ),
          },
          {
            path: 'fuel-prices',
            loadComponent: () =>
              import('./features/admin/fuel-prices-admin.component').then(
                (m) => m.FuelPricesAdminComponent,
              ),
          },
          {
            path: 'users',
            loadComponent: () =>
              import('./features/admin/users-admin.component').then(
                (m) => m.UsersAdminComponent,
              ),
          },
          {
            path: 'trash',
            loadComponent: () =>
              import('./features/admin/trash-admin.component').then(
                (m) => m.TrashAdminComponent,
              ),
          },
        ],
      },
      {
        path: '**',
        loadComponent: () =>
          import('./features/not-found.component').then(
            (m) => m.NotFoundComponent,
          ),
      },
    ],
  },
];
