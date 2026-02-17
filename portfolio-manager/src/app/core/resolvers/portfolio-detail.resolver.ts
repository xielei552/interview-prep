import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, tap } from 'rxjs';
import { AppState, Portfolio } from '../../store/app.state';
import { PortfoliosActions } from '../../store/portfolios/portfolios.actions';
import {
  selectPortfolioEntities,
  selectPortfoliosLoading,
} from '../../store/portfolios/portfolios.selectors';

/**
 * Resolves the portfolio entity before the detail route activates.
 * Dispatches loadPortfolio if not already in store, then waits for entity.
 */
export const portfolioDetailResolver: ResolveFn<Portfolio | null> = (
  route: ActivatedRouteSnapshot
) => {
  const store = inject(Store<AppState>);
  const id    = route.paramMap.get('id')!;

  return store.select(selectPortfolioEntities).pipe(
    tap((entities) => {
      if (!entities[id]) {
        store.dispatch(PortfoliosActions.loadPortfolio({ id }));
      }
    }),
    filter((entities) => !!entities[id]),
    map((entities) => entities[id] ?? null)
  );
};
