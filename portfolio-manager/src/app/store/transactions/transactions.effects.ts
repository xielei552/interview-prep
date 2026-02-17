import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, of, switchMap, withLatestFrom } from 'rxjs';
import { TransactionService } from '../../core/services/transaction.service';
import { AppState } from '../app.state';
import { TransactionsActions } from './transactions.actions';
import {
  selectTransactionsDateFrom,
  selectTransactionsDateTo,
  selectTransactionsPage,
  selectTransactionsPageSize,
} from './transactions.selectors';

@Injectable()
export class TransactionsEffects {
  private actions$ = inject(Actions);
  private svc      = inject(TransactionService);
  private store    = inject(Store<AppState>);

  loadTransactions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TransactionsActions.loadTransactions),
      switchMap(({ portfolioId, page, pageSize, dateFrom, dateTo }) =>
        this.svc.getPage({ portfolioId, page, pageSize, dateFrom, dateTo }).pipe(
          map(({ data, totalCount }) =>
            TransactionsActions.loadTransactionsSuccess({
              transactions: data,
              totalCount,
              page,
              pageSize,
            })
          ),
          catchError((error) =>
            of(
              TransactionsActions.loadTransactionsFailure({
                error: error.message ?? 'Load failed',
              })
            )
          )
        )
      )
    )
  );

  // Re-load when page/pageSize/dateRange changes
  reloadOnPageChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        TransactionsActions.setPage,
        TransactionsActions.setPageSize,
        TransactionsActions.setDateRange
      ),
      withLatestFrom(
        this.store.select(selectTransactionsPage),
        this.store.select(selectTransactionsPageSize),
        this.store.select(selectTransactionsDateFrom),
        this.store.select(selectTransactionsDateTo)
      ),
      map(([, page, pageSize, dateFrom, dateTo]) =>
        TransactionsActions.loadTransactions({
          page,
          pageSize,
          dateFrom: dateFrom ?? undefined,
          dateTo:   dateTo   ?? undefined,
        })
      )
    )
  );
}
