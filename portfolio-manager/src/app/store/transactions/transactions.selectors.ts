import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TransactionFeatureState } from '../app.state';
import { adapter } from './transactions.reducer';

const selectTransactionsState =
  createFeatureSelector<TransactionFeatureState>('transactions');

const { selectAll } = adapter.getSelectors();

export const selectAllTransactions     = createSelector(selectTransactionsState, selectAll);
export const selectTransactionsLoading = createSelector(selectTransactionsState, (s) => s.loading);
export const selectTransactionsError   = createSelector(selectTransactionsState, (s) => s.error);
export const selectTransactionsPage    = createSelector(selectTransactionsState, (s) => s.page);
export const selectTransactionsPageSize = createSelector(selectTransactionsState, (s) => s.pageSize);
export const selectTransactionsTotalCount = createSelector(selectTransactionsState, (s) => s.totalCount);
export const selectTransactionsDateFrom = createSelector(selectTransactionsState, (s) => s.dateFrom);
export const selectTransactionsDateTo   = createSelector(selectTransactionsState, (s) => s.dateTo);
