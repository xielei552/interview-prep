import { createActionGroup, props } from '@ngrx/store';
import { Transaction } from '../app.state';

export const TransactionsActions = createActionGroup({
  source: 'Transactions',
  events: {
    'Load Transactions': props<{
      portfolioId?: string;
      page:         number;
      pageSize:     number;
      dateFrom?:    string;
      dateTo?:      string;
    }>(),
    'Load Transactions Success': props<{
      transactions: Transaction[];
      totalCount:   number;
      page:         number;
      pageSize:     number;
    }>(),
    'Load Transactions Failure': props<{ error: string }>(),

    'Set Date Range':  props<{ dateFrom: string | null; dateTo: string | null }>(),
    'Set Page':        props<{ page: number }>(),
    'Set Page Size':   props<{ pageSize: number }>(),
  },
});
