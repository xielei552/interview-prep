import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PortfolioFeatureState } from '../app.state';
import { adapter } from './portfolios.reducer';

const selectPortfoliosState = createFeatureSelector<PortfolioFeatureState>('portfolios');

const { selectAll, selectEntities, selectTotal } = adapter.getSelectors();

export const selectAllPortfolios    = createSelector(selectPortfoliosState, selectAll);
export const selectPortfolioEntities = createSelector(selectPortfoliosState, selectEntities);
export const selectPortfolioCount   = createSelector(selectPortfoliosState, selectTotal);

export const selectPortfoliosLoading = createSelector(
  selectPortfoliosState, (s) => s.loading
);
export const selectPortfoliosError = createSelector(
  selectPortfoliosState, (s) => s.error
);
export const selectSelectedPortfolioId = createSelector(
  selectPortfoliosState, (s) => s.selectedId
);
export const selectSelectedPortfolio = createSelector(
  selectPortfolioEntities,
  selectSelectedPortfolioId,
  (entities, id) => (id ? entities[id] ?? null : null)
);

// ─── Derived / Aggregated ────────────────────────────────────────────────────

export const selectTotalAUM = createSelector(
  selectAllPortfolios,
  (portfolios) => portfolios.reduce((sum, p) => sum + p.totalValue, 0)
);

export const selectTotalDailyPnL = createSelector(
  selectAllPortfolios,
  (portfolios) => portfolios.reduce((sum, p) => sum + p.dailyPnL, 0)
);

export const selectAllocationByPortfolio = createSelector(
  selectAllPortfolios,
  (portfolios) => portfolios.map((p) => ({
    label: p.name,
    value: p.totalValue,
  }))
);

export const selectTopPortfoliosByReturn = createSelector(
  selectAllPortfolios,
  (portfolios) =>
    [...portfolios]
      .sort((a, b) => b.ytdReturnPercent - a.ytdReturnPercent)
      .slice(0, 5)
);
