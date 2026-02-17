import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { Position, PositionFeatureState } from '../app.state';
import { PositionsActions } from './positions.actions';

export const adapter: EntityAdapter<Position> = createEntityAdapter<Position>({
  sortComparer: (a, b) => b.marketValue - a.marketValue,
});

const defaultFilters = {
  search:        '',
  assetClass:    '' as const,
  portfolioId:   '',
  sortColumn:    'marketValue',
  sortDirection: 'desc' as const,
};

export const initialState: PositionFeatureState = adapter.getInitialState({
  loading:    false,
  error:      null,
  filters:    defaultFilters,
  totalCount: 0,
});

export const positionsReducer = createReducer(
  initialState,

  on(PositionsActions.loadPositions, (state) => ({
    ...state, loading: true, error: null,
  })),
  on(PositionsActions.loadPositionsSuccess, (state, { positions, totalCount }) =>
    adapter.setAll(positions, { ...state, loading: false, totalCount })
  ),
  on(PositionsActions.loadPositionsFailure, (state, { error }) => ({
    ...state, loading: false, error,
  })),

  on(PositionsActions.setFilters, (state, { filters }) => ({
    ...state,
    filters: { ...state.filters, ...filters },
  })),

  on(PositionsActions.resetFilters, (state) => ({
    ...state, filters: defaultFilters,
  })),
);
