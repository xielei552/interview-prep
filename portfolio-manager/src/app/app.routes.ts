import { Routes } from '@angular/router';
import { portfolioGuard } from './core/guards/portfolio.guard';
import { portfolioDetailResolver } from './core/resolvers/portfolio-detail.resolver';

export const APP_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    canActivate: [portfolioGuard],
    title: 'Dashboard — Portfolio Manager',
  },
  {
    path: 'portfolios',
    loadComponent: () =>
      import('./features/portfolios/portfolios.component').then(
        (m) => m.PortfoliosComponent
      ),
    canActivate: [portfolioGuard],
    title: 'Portfolios — Portfolio Manager',
  },
  {
    path: 'portfolios/:id',
    loadComponent: () =>
      import('./features/portfolio-detail/portfolio-detail.component').then(
        (m) => m.PortfolioDetailComponent
      ),
    resolve: { portfolio: portfolioDetailResolver },
    title: 'Portfolio Detail — Portfolio Manager',
  },
  {
    path: 'positions',
    loadComponent: () =>
      import('./features/positions/positions.component').then(
        (m) => m.PositionsComponent
      ),
    canActivate: [portfolioGuard],
    title: 'Positions — Portfolio Manager',
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./features/transactions/transactions.component').then(
        (m) => m.TransactionsComponent
      ),
    title: 'Transactions — Portfolio Manager',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
