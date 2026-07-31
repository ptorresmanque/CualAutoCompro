import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { adminGuard } from './core/admin.guard';
import { COMPARE_DEFAULT_META } from './core/page-meta.service';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        data: {
          meta: {
            title: 'cualautocompro — compara autos nuevos en Chile',
            description:
              'Explora el catálogo de autos nuevos en Chile, filtra por lo que necesitas y compara modelos de distintas marcas antes de decidir.',
          },
        },
        loadComponent: () =>
          import('./features/landing/landing.component').then(
            (m) => m.LandingComponent,
          ),
      },
      {
        path: 'catalogo',
        data: {
          meta: {
            title: 'Catálogo de autos nuevos en Chile — cualautocompro',
            description:
              'Busca entre los autos nuevos disponibles en Chile y filtra por precio, segmento, combustible, transmisión y rendimiento.',
          },
        },
        loadComponent: () =>
          import('./features/catalog/catalog.component').then(
            (m) => m.CatalogComponent,
          ),
      },
      {
        path: 'compare',
        data: { meta: COMPARE_DEFAULT_META },
        loadComponent: () =>
          import('./features/compare/compare.component').then(
            (m) => m.CompareComponent,
          ),
      },
      {
        path: 'c/:slug',
        data: { meta: COMPARE_DEFAULT_META },
        loadComponent: () =>
          import('./features/compare/compare.component').then(
            (m) => m.CompareComponent,
          ),
      },
      {
        path: 'login',
        data: {
          meta: {
            title: 'Iniciar sesión — cualautocompro',
            description:
              'Entra a tu cuenta para guardar comparaciones y favoritos.',
            noindex: true,
          },
        },
        loadComponent: () =>
          import('./features/auth/login.component').then(
            (m) => m.LoginComponent,
          ),
      },
      {
        path: 'register',
        data: {
          meta: {
            title: 'Crear cuenta — cualautocompro',
            description:
              'Crea una cuenta para guardar tus comparaciones y favoritos.',
            noindex: true,
          },
        },
        loadComponent: () =>
          import('./features/auth/register.component').then(
            (m) => m.RegisterComponent,
          ),
      },
      {
        path: 'account/comparisons',
        data: {
          meta: {
            title: 'Tus comparaciones — cualautocompro',
            description:
              'Las comparaciones que guardaste.',
            noindex: true,
          },
        },
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/account/comparisons.component').then(
            (m) => m.ComparisonsComponent,
          ),
      },
      {
        path: 'account/settings',
        data: {
          meta: {
            title: 'Tu cuenta — cualautocompro',
            description:
              'Ajustes de tu cuenta.',
            noindex: true,
          },
        },
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/account/settings.component').then(
            (m) => m.AccountSettingsComponent,
          ),
      },
      {
        path: 'account/forgot-password',
        data: {
          meta: {
            title: 'Recuperar contraseña — cualautocompro',
            description:
              'Te enviamos un enlace para restablecer tu contraseña.',
            noindex: true,
          },
        },
        loadComponent: () =>
          import('./features/account/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent,
          ),
      },
      {
        path: 'account/reset-password',
        data: {
          meta: {
            title: 'Nueva contraseña — cualautocompro',
            description:
              'Define una contraseña nueva para tu cuenta.',
            noindex: true,
          },
        },
        loadComponent: () =>
          import('./features/account/reset-password.component').then(
            (m) => m.ResetPasswordComponent,
          ),
      },

      {
        path: 'favoritos',
        data: {
          meta: {
            title: 'Tus favoritos — cualautocompro',
            description:
              'Los autos que guardaste para revisar después.',
            noindex: true,
          },
        },
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/favorites/favorites.component').then(
            (m) => m.FavoritesComponent,
          ),
      },
      {
        path: 'legal/privacidad',
        data: {
          doc: 'privacidad',
          meta: {
            title: 'Política de privacidad — cualautocompro',
            description:
              'Qué datos guardamos, qué cookies usamos y cómo puedes pedirnos que los borremos.',
          },
        },
        loadComponent: () =>
          import('./features/legal/legal.component').then(
            (m) => m.LegalComponent,
          ),
      },
      {
        path: 'legal/terminos',
        data: {
          doc: 'terminos',
          meta: {
            title: 'Términos de uso — cualautocompro',
            description:
              'Condiciones de uso del comparador y alcance de la información publicada.',
          },
        },
        loadComponent: () =>
          import('./features/legal/legal.component').then(
            (m) => m.LegalComponent,
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
        data: {
          meta: {
            title: 'Administración — cualautocompro',
            description:
              'Panel interno.',
            noindex: true,
          },
        },
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
            path: 'colors',
            loadComponent: () =>
              import('./features/admin/colors-admin.component').then(
                (m) => m.ColorsAdminComponent,
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
        data: {
          meta: {
            title: 'Página no encontrada — cualautocompro',
            description:
              'La página que buscas no existe o cambió de dirección.',
            noindex: true,
          },
        },
        loadComponent: () =>
          import('./features/not-found.component').then(
            (m) => m.NotFoundComponent,
          ),
      },
    ],
  },
];
