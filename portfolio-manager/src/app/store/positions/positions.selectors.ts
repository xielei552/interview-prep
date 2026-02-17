import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PositionFeatureState } from '../app.state';
import { adapter } from './positions.reducer';

const selectPositionsState = createFeatureSelector<PositionFeatureState>('positions');

const { selectAll } = adapter.getSelectors();

export const selectAllPositions = createSelector(selectPositionsState, selectAll);
export const selectPositionsLoading = createSelector(selectPositionsState, (s) => s.loading);
export const selectPositionsError   = createSelector(selectPositionsState, (s) => s.error);
export const selectPositionFilters  = createSelector(selectPositionsState, (s) => s.filters);
export const selectPositionsTotalCount = createSelector(selectPositionsState, (s) => s.totalCount);

/**
 * selectFilteredPositions — most complex selector.
 * Composes filter + sort in one memoized step.
 */
export const selectFilteredPositions = createSelector(
  selectAllPositions,
  selectPositionFilters,
  (positions, filters) => {
    let result = positions;

    // Portfolio filter
    if (filters.portfolioId) {
      result = result.filter((p) => p.portfolioId === filters.portfolioId);
    }

    // Asset class filter
    if (filters.assetClass) {
      result = result.filter((p) => p.assetClass === filters.assetClass);
    }

    // Full-text search (symbol + name)
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.symbol.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q)
      );
    }

    // Sorting
    const dir = filters.sortDirection === 'asc' ? 1 : -1;
    const col = filters.sortColumn as keyof typeof result[0];
    result = [...result].sort((a, b) => {
      const aVal = a[col];
      const bVal = b[col];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * dir;
      }
      return String(aVal).localeCompare(String(bVal)) * dir;
    });

    return result;
  }
);

// ─── Derived ─────────────────────────────────────────────────────────────────

export const selectTopMovers = createSelector(
  selectAllPositions,
  (positions) =>
    [...positions]
      .sort((a, b) => Math.abs(b.dayChangePercent) - Math.abs(a.dayChangePercent))
      .slice(0, 10)
);

export const selectAssetClassBreakdown = createSelector(
  selectAllPositions,
  (positions) => {
    const map = new Map<string, number>();
    for (const p of positions) {
      map.set(p.assetClass, (map.get(p.assetClass) ?? 0) + p.marketValue);
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }
);
