import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { Portfolio, PortfolioFeatureState } from '../app.state';
import { PortfoliosActions } from './portfolios.actions';

export const adapter: EntityAdapter<Portfolio> = createEntityAdapter<Portfolio>({
  sortComparer: (a, b) => b.totalValue - a.totalValue,
});

export const initialState: PortfolioFeatureState = adapter.getInitialState({
  loading:    false,
  error:      null,
  selectedId: null,
});

export const portfoliosReducer = createReducer(
  initialState,

  // Load many
  on(PortfoliosActions.loadPortfolios, (state) => ({
    ...state, loading: true, error: null,
  })),
  on(PortfoliosActions.loadPortfoliosSuccess, (state, { portfolios }) =>
    adapter.setAll(portfolios, { ...state, loading: false })
  ),
  on(PortfoliosActions.loadPortfoliosFailure, (state, { error }) => ({
    ...state, loading: false, error,
  })),

  // Load one
  on(PortfoliosActions.loadPortfolio, (state) => ({
    ...state, loading: true, error: null,
  })),
  on(PortfoliosActions.loadPortfolioSuccess, (state, { portfolio }) =>
    adapter.upsertOne(portfolio, { ...state, loading: false })
  ),
  on(PortfoliosActions.loadPortfolioFailure, (state, { error }) => ({
    ...state, loading: false, error,
  })),

  // Select
  on(PortfoliosActions.selectPortfolio, (state, { id }) => ({
    ...state, selectedId: id,
  })),

  // Create
  on(PortfoliosActions.createPortfolio, (state) => ({
    ...state, loading: true, error: null,
  })),
  on(PortfoliosActions.createPortfolioSuccess, (state, { portfolio }) =>
    adapter.addOne(portfolio, { ...state, loading: false })
  ),
  on(PortfoliosActions.createPortfolioFailure, (state, { error }) => ({
    ...state, loading: false, error,
  })),

  // Update
  on(PortfoliosActions.updatePortfolio, (state) => ({
    ...state, loading: true, error: null,
  })),
  on(PortfoliosActions.updatePortfolioSuccess, (state, { portfolio }) =>
    adapter.upsertOne(portfolio, { ...state, loading: false })
  ),
  on(PortfoliosActions.updatePortfolioFailure, (state, { error }) => ({
    ...state, loading: false, error,
  })),

  // Delete
  on(PortfoliosActions.deletePortfolio, (state) => ({
    ...state, loading: true, error: null,
  })),
  on(PortfoliosActions.deletePortfolioSuccess, (state, { id }) =>
    adapter.removeOne(id, { ...state, loading: false })
  ),
  on(PortfoliosActions.deletePortfolioFailure, (state, { error }) => ({
    ...state, loading: false, error,
  })),
);
