import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { Position } from '../../../store/app.state';

/**
 * Custom DataSource for CDK Virtual Scroll.
 * MatTableDataSource is incompatible with cdk-virtual-scroll-viewport —
 * this custom DataSource feeds rows directly to the viewport.
 */
export class PositionsDataSource extends DataSource<Position> {
  private _data$ = new BehaviorSubject<Position[]>([]);
  private _sub?: Subscription;

  get data(): Position[] { return this._data$.value; }
  get length(): number   { return this._data$.value.length; }

  connect(_viewer: CollectionViewer): Observable<Position[]> {
    return this._data$.asObservable();
  }

  disconnect(): void {
    this._sub?.unsubscribe();
  }

  setData(positions: Position[]): void {
    this._data$.next(positions);
  }
}
