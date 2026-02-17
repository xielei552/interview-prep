import {
  ChangeDetectionStrategy,
  Component,
  effect,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { EventEmitter, Output } from '@angular/core';

import { Position } from '../../../store/app.state';
import { PositionsDataSource } from './positions-data-source';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { PercentFormatPipe } from '../../../shared/pipes/percent-format.pipe';
import { PnlColorPipe } from '../../../shared/pipes/pnl-color.pipe';

/** Row height for CDK virtual scroll — keep in sync with CSS */
export const ROW_HEIGHT = 48;

/**
 * Dumb component: knows nothing about NgRx.
 * Receives positions via @Input and emits sort events via @Output.
 * Uses CDK virtual scroll — only ~15 DOM rows rendered for 1000+ items.
 */
@Component({
  selector: 'app-positions-table',
  standalone: true,
  imports: [
    ScrollingModule,
    MatTableModule,
    MatSortModule,
    MatIconModule,
    CurrencyFormatPipe,
    PercentFormatPipe,
    PnlColorPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-wrapper">
      <!-- Table header (sticky, outside viewport) -->
      <table mat-table [dataSource]="dataSource" class="positions-header-table">
        @for (col of displayedColumns; track col) {
          <ng-container [matColumnDef]="col">
            <th mat-header-cell *matHeaderCellDef [class.text-right]="isNumericCol(col)">
              {{ colLabel(col) }}
            </th>
            <td mat-cell *matCellDef="let row"></td>
          </ng-container>
        }
        <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;" style="display:none;"></tr>
      </table>

      <!-- Virtual scroll body -->
      <cdk-virtual-scroll-viewport
        [itemSize]="rowHeight"
        class="virtual-viewport"
      >
        <table mat-table [dataSource]="dataSource" class="positions-body-table">
          <ng-container matColumnDef="symbol">
            <th mat-header-cell *matHeaderCellDef style="display:none;"></th>
            <td mat-cell *matCellDef="let row">
              <span class="symbol-badge">{{ row.symbol }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef style="display:none;"></th>
            <td mat-cell *matCellDef="let row" class="name-cell">{{ row.name }}</td>
          </ng-container>

          <ng-container matColumnDef="assetClass">
            <th mat-header-cell *matHeaderCellDef style="display:none;"></th>
            <td mat-cell *matCellDef="let row">
              <span class="asset-chip" [attr.data-class]="row.assetClass">
                {{ row.assetClass }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="quantity">
            <th mat-header-cell *matHeaderCellDef style="display:none;"></th>
            <td mat-cell *matCellDef="let row" class="text-right price-mono">
              {{ row.quantity.toLocaleString() }}
            </td>
          </ng-container>

          <ng-container matColumnDef="avgCost">
            <th mat-header-cell *matHeaderCellDef style="display:none;"></th>
            <td mat-cell *matCellDef="let row" class="text-right price-mono">
              {{ row.avgCost | currencyFormat }}
            </td>
          </ng-container>

          <ng-container matColumnDef="currentPrice">
            <th mat-header-cell *matHeaderCellDef style="display:none;"></th>
            <td mat-cell *matCellDef="let row" class="text-right price-mono">
              {{ row.currentPrice | currencyFormat }}
            </td>
          </ng-container>

          <ng-container matColumnDef="marketValue">
            <th mat-header-cell *matHeaderCellDef style="display:none;"></th>
            <td mat-cell *matCellDef="let row" class="text-right price-mono">
              {{ row.marketValue | currencyFormat : 'USD' : true }}
            </td>
          </ng-container>

          <ng-container matColumnDef="unrealizedPnL">
            <th mat-header-cell *matHeaderCellDef style="display:none;"></th>
            <td mat-cell *matCellDef="let row" class="text-right price-mono" [class]="row.unrealizedPnL | pnlColor">
              {{ row.unrealizedPnL | currencyFormat : 'USD' : true }}
            </td>
          </ng-container>

          <ng-container matColumnDef="unrealizedPnLPercent">
            <th mat-header-cell *matHeaderCellDef style="display:none;"></th>
            <td mat-cell *matCellDef="let row" class="text-right price-mono" [class]="row.unrealizedPnLPercent | pnlColor">
              {{ row.unrealizedPnLPercent | percentFormat }}
            </td>
          </ng-container>

          <ng-container matColumnDef="dayChangePercent">
            <th mat-header-cell *matHeaderCellDef style="display:none;"></th>
            <td mat-cell *matCellDef="let row" class="text-right price-mono" [class]="row.dayChangePercent | pnlColor">
              {{ row.dayChangePercent | percentFormat }}
            </td>
          </ng-container>

          <ng-container matColumnDef="weight">
            <th mat-header-cell *matHeaderCellDef style="display:none;"></th>
            <td mat-cell *matCellDef="let row" class="text-right price-mono">
              {{ row.weight.toFixed(2) }}%
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns" style="display:none;"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: displayedColumns;"
            [style.height.px]="rowHeight"
          ></tr>
        </table>
      </cdk-virtual-scroll-viewport>

      <div class="row-count">
        Showing {{ dataSource.length.toLocaleString() }} positions
      </div>
    </div>
  `,
  styles: [`
    .table-wrapper {
      border: 1px solid rgba(0,0,0,.12);
      border-radius: 4px;
      overflow: hidden;
    }

    .positions-header-table {
      width: 100%;
      .mat-mdc-header-row { position: sticky; top: 0; z-index: 10; }
    }

    .virtual-viewport {
      height: 600px;
      width: 100%;
    }

    .positions-body-table { width: 100%; }

    .symbol-badge {
      display: inline-block;
      background: rgba(92,107,192,.12);
      color: #5c6bc0;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 13px;
      font-family: 'Roboto Mono', monospace;
    }

    .name-cell {
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .asset-chip {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      &[data-class="Stock"]  { background: rgba(102,187,106,.15); color: #388e3c; }
      &[data-class="ETF"]    { background: rgba(38,198,218,.15);  color: #00838f; }
      &[data-class="Bond"]   { background: rgba(255,167,38,.15);  color: #e65100; }
      &[data-class="Crypto"] { background: rgba(92,107,192,.15);  color: #3949ab; }
    }

    .row-count {
      padding: 8px 16px;
      font-size: 12px;
      color: rgba(0,0,0,.6);
      border-top: 1px solid rgba(0,0,0,.08);
      background: rgba(0,0,0,.02);
    }
  `],
})
export class PositionsTableComponent implements OnInit, OnDestroy {
  @Input() set positions(val: Position[]) {
    this.dataSource.setData(val);
  }
  @Output() sortChange = new EventEmitter<Sort>();

  dataSource = new PositionsDataSource();
  rowHeight  = ROW_HEIGHT;

  displayedColumns = [
    'symbol', 'name', 'assetClass', 'quantity',
    'avgCost', 'currentPrice', 'marketValue',
    'unrealizedPnL', 'unrealizedPnLPercent', 'dayChangePercent', 'weight',
  ];

  ngOnInit(): void {}
  ngOnDestroy(): void { this.dataSource.disconnect(); }

  isNumericCol(col: string): boolean {
    return ['quantity','avgCost','currentPrice','marketValue',
      'unrealizedPnL','unrealizedPnLPercent','dayChangePercent','weight'].includes(col);
  }

  colLabel(col: string): string {
    const labels: Record<string, string> = {
      symbol:               'Symbol',
      name:                 'Name',
      assetClass:           'Asset Class',
      quantity:             'Qty',
      avgCost:              'Avg Cost',
      currentPrice:         'Price',
      marketValue:          'Mkt Value',
      unrealizedPnL:        'Unreal. P&L',
      unrealizedPnLPercent: 'Unreal. %',
      dayChangePercent:     'Day Chg %',
      weight:               'Weight',
    };
    return labels[col] ?? col;
  }
}
