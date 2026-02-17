import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { Transaction, TransactionFeatureState } from '../app.state';
import { TransactionsActions } from './transactions.actions';

export const adapter: EntityAdapter<Transaction> = createEntityAdapter<Transaction>({
  sortComparer: (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
});

export const initialState: TransactionFeatureState = adapter.getInitialState({
  loading:    false,
  error:      null,
  page:       1,
  pageSize:   25,
  totalCount: 0,
  dateFrom:   null,
  dateTo:     null,
});

export const transactionsReducer = createReducer(
  initialState,

  on(TransactionsActions.loadTransactions, (state) => ({
    ...state, loading: true, error: null,
  })),
  on(TransactionsActions.loadTransactionsSuccess, (state, { transactions, totalCount, page, pageSize }) =>
    adapter.setAll(transactions, {
      ...state, loading: false, totalCount, page, pageSize,
    })
  ),
  on(TransactionsActions.loadTransactionsFailure, (state, { error }) => ({
    ...state, loading: false, error,
  })),

  on(TransactionsActions.setDateRange, (state, { dateFrom, dateTo }) => ({
    ...state, dateFrom, dateTo, page: 1,
  })),

  on(TransactionsActions.setPage, (state, { page }) => ({ ...state, page })),
  on(TransactionsActions.setPageSize, (state, { pageSize }) => ({
    ...state, pageSize, page: 1,
  })),
);
