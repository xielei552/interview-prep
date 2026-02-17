import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, of, switchMap, withLatestFrom } from 'rxjs';
import { PositionService } from '../../core/services/position.service';
import { AppState } from '../app.state';
import { PositionsActions } from './positions.actions';
import { selectFilteredPositions } from './positions.selectors';

@Injectable()
export class PositionsEffects {
  private actions$ = inject(Actions);
  private svc      = inject(PositionService);
  private store    = inject(Store<AppState>);

  loadPositions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PositionsActions.loadPositions),
      switchMap(({ portfolioId }) =>
        this.svc.getAll(portfolioId).pipe(
          map((positions) =>
            PositionsActions.loadPositionsSuccess({
              positions,
              totalCount: positions.length,
            })
          ),
          catchError((error) =>
            of(PositionsActions.loadPositionsFailure({ error: error.message ?? 'Load failed' }))
          )
        )
      )
    )
  );

  /**
   * CSV Export side-effect — uses withLatestFrom to pull filtered positions
   * from the store at the moment of dispatch.
   */
  exportCsv$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PositionsActions.exportCSV),
        withLatestFrom(this.store.select(selectFilteredPositions)),
        map(([, positions]) => {
          const headers = [
            'Symbol', 'Name', 'Asset Class', 'Quantity',
            'Avg Cost', 'Current Price', 'Market Value',
            'Unrealized PnL', 'Unrealized PnL %', 'Day Change %',
          ];
          const rows = positions.map((p) => [
            p.symbol,
            p.name,
            p.assetClass,
            p.quantity,
            p.avgCost,
            p.currentPrice,
            p.marketValue,
            p.unrealizedPnL,
            p.unrealizedPnLPercent,
            p.dayChangePercent,
          ]);
          const csv = [headers, ...rows]
            .map((r) => r.join(','))
            .join('\n');

          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url  = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href     = url;
          link.download = `positions-${new Date().toISOString().slice(0, 10)}.csv`;
          link.click();
          URL.revokeObjectURL(url);

          return PositionsActions.exportCSVSuccess();
        })
      ),
    { dispatch: false }
  );
}
