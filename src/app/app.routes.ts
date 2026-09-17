import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'login' },
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent
          ),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password.component').then(
            (m) => m.ResetPasswordComponent
          ),
      },
    ],
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        data: { titleKey: 'nav.dashboard' },
        loadComponent: () =>
          import('./shared/pages/placeholder-page.component').then((m) => m.PlaceholderPageComponent),
      },
      {
        path: 'kanban',
        data: { titleKey: 'nav.kanban' },
        loadComponent: () => import('./features/kanban/kanban.component').then((m) => m.KanbanComponent),
      },
      {
        path: 'applications',
        data: { titleKey: 'nav.applications' },
        loadComponent: () =>
          import('./features/applications/applications-list/applications-list.component').then(
            (m) => m.ApplicationsListComponent
          ),
      },
      {
        path: 'applications/:id',
        loadComponent: () =>
          import('./features/applications/application-detail/application-detail.component').then(
            (m) => m.ApplicationDetailComponent
          ),
      },
      {
        path: 'matches',
        data: { titleKey: 'nav.matches' },
        loadComponent: () =>
          import('./shared/pages/placeholder-page.component').then((m) => m.PlaceholderPageComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];
