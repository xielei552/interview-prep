import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap, tap } from 'rxjs';
import { PortfolioService } from '../../core/services/portfolio.service';
import { PortfoliosActions } from './portfolios.actions';

@Injectable()
export class PortfoliosEffects {
  private actions$ = inject(Actions);
  private svc      = inject(PortfolioService);
  private snackBar = inject(MatSnackBar);

  loadPortfolios$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PortfoliosActions.loadPortfolios),
      switchMap(() =>
        this.svc.getAll().pipe(
          map((portfolios) => PortfoliosActions.loadPortfoliosSuccess({ portfolios })),
          catchError((error) =>
            of(PortfoliosActions.loadPortfoliosFailure({ error: error.message ?? 'Load failed' }))
          )
        )
      )
    )
  );

  loadPortfolio$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PortfoliosActions.loadPortfolio),
      switchMap(({ id }) =>
        this.svc.getById(id).pipe(
          map((portfolio) => PortfoliosActions.loadPortfolioSuccess({ portfolio })),
          catchError((error) =>
            of(PortfoliosActions.loadPortfolioFailure({ error: error.message ?? 'Load failed' }))
          )
        )
      )
    )
  );

  createPortfolio$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PortfoliosActions.createPortfolio),
      exhaustMap(({ portfolio }) =>
        this.svc.create(portfolio).pipe(
          map((created) => PortfoliosActions.createPortfolioSuccess({ portfolio: created })),
          catchError((error) =>
            of(PortfoliosActions.createPortfolioFailure({ error: error.message ?? 'Create failed' }))
          )
        )
      )
    )
  );

  updatePortfolio$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PortfoliosActions.updatePortfolio),
      exhaustMap(({ id, changes }) =>
        this.svc.update(id, changes).pipe(
          map((portfolio) => PortfoliosActions.updatePortfolioSuccess({ portfolio })),
          catchError((error) =>
            of(PortfoliosActions.updatePortfolioFailure({ error: error.message ?? 'Update failed' }))
          )
        )
      )
    )
  );

  deletePortfolio$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PortfoliosActions.deletePortfolio),
      exhaustMap(({ id }) =>
        this.svc.delete(id).pipe(
          map(() => PortfoliosActions.deletePortfolioSuccess({ id })),
          catchError((error) =>
            of(PortfoliosActions.deletePortfolioFailure({ error: error.message ?? 'Delete failed' }))
          )
        )
      )
    )
  );

  // Notification side-effects (dispatch: false)
  notifyCreateSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PortfoliosActions.createPortfolioSuccess),
        tap(({ portfolio }) =>
          this.snackBar.open(`Portfolio "${portfolio.name}" created`, 'Close', { duration: 3000 })
        )
      ),
    { dispatch: false }
  );

  notifyUpdateSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PortfoliosActions.updatePortfolioSuccess),
        tap(({ portfolio }) =>
          this.snackBar.open(`Portfolio "${portfolio.name}" updated`, 'Close', { duration: 3000 })
        )
      ),
    { dispatch: false }
  );

  notifyDeleteSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PortfoliosActions.deletePortfolioSuccess),
        tap(() =>
          this.snackBar.open('Portfolio deleted', 'Close', { duration: 3000 })
        )
      ),
    { dispatch: false }
  );

  notifyError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          PortfoliosActions.loadPortfoliosFailure,
          PortfoliosActions.createPortfolioFailure,
          PortfoliosActions.updatePortfolioFailure,
          PortfoliosActions.deletePortfolioFailure
        ),
        tap(({ error }) =>
          this.snackBar.open(`Error: ${error}`, 'Close', {
            duration:   5000,
            panelClass: ['error-snack'],
          })
        )
      ),
    { dispatch: false }
  );
}
