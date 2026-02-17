import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, tap } from 'rxjs';
import { AppState } from '../../store/app.state';
import { PortfoliosActions } from '../../store/portfolios/portfolios.actions';
import { selectAllPortfolios, selectPortfoliosLoading } from '../../store/portfolios/portfolios.selectors';

/**
 * Ensures portfolios are loaded in the store before activating the route.
 * If not yet loaded, dispatches loadPortfolios and waits.
 */
export const portfolioGuard: CanActivateFn = () => {
  const store  = inject(Store<AppState>);
  const router = inject(Router);

  return store.select(selectAllPortfolios).pipe(
    tap((portfolios) => {
      if (portfolios.length === 0) {
        store.dispatch(PortfoliosActions.loadPortfolios());
      }
    }),
    filter((portfolios) => portfolios.length > 0),
    map(() => true)
  );
};
