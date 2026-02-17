import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { computed } from '@angular/core';

import { AppState } from '../../store/app.state';
import { PortfoliosActions } from '../../store/portfolios/portfolios.actions';
import {
  selectAllPortfolios,
  selectAllocationByPortfolio,
  selectPortfoliosLoading,
  selectTotalAUM,
  selectTotalDailyPnL,
} from '../../store/portfolios/portfolios.selectors';
import { selectTopMovers } from '../../store/positions/positions.selectors';
import { PositionsActions } from '../../store/positions/positions.actions';

import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { PercentFormatPipe } from '../../shared/pipes/percent-format.pipe';
import { PnlColorPipe } from '../../shared/pipes/pnl-color.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    NgChartsModule,
    KpiCardComponent,
    LoadingSpinnerComponent,
    CurrencyFormatPipe,
    PercentFormatPipe,
    PnlColorPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard">
      <h1 class="page-title">Dashboard</h1>

      @if (loading()) {
        <app-loading-spinner message="Loading portfolio data..."></app-loading-spinner>
      } @else {
        <!-- KPI Row -->
        <div class="kpi-grid">
          <app-kpi-card
            label="Total AUM"
            [value]="totalAUM()"
            icon="account_balance_wallet"
            iconColor="#5c6bc0"
          ></app-kpi-card>
          <app-kpi-card
            label="Daily P&L"
            [value]="totalDailyPnL()"
            [change]="totalDailyPnL()"
            icon="trending_up"
            [iconColor]="totalDailyPnL() >= 0 ? '#00c853' : '#f44336'"
          ></app-kpi-card>
          <app-kpi-card
            label="Portfolios"
            [value]="portfolioCount()"
            icon="folder_open"
            iconColor="#26c6da"
            currency="USD"
          ></app-kpi-card>
        </div>

        <!-- Charts + Movers -->
        <div class="charts-row">
          <!-- Allocation doughnut -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>Portfolio Allocation</mat-card-title>
            </mat-card-header>
            <mat-card-content class="chart-content">
              @if (chartData().datasets[0].data.length > 0) {
                <canvas
                  baseChart
                  [data]="chartData()"
                  [options]="chartOptions"
                  type="doughnut"
                ></canvas>
              } @else {
                <p>No data available</p>
              }
            </mat-card-content>
          </mat-card>

          <!-- Top movers -->
          <mat-card class="movers-card">
            <mat-card-header>
              <mat-card-title>Top Movers</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @for (pos of topMovers(); track pos.id) {
                <div class="mover-row">
                  <div class="mover-info">
                    <span class="mover-symbol">{{ pos.symbol }}</span>
                    <span class="mover-name">{{ pos.name }}</span>
                  </div>
                  <span
                    class="mover-pct price-mono"
                    [class]="pos.dayChangePercent | pnlColor"
                  >
                    {{ pos.dayChangePercent | percentFormat }}
                  </span>
                </div>
                <mat-divider></mat-divider>
              } @empty {
                <p>No position data yet.</p>
              }
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Portfolio list -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>All Portfolios</mat-card-title>
            <div class="flex-spacer"></div>
            <a mat-button routerLink="/portfolios">View All</a>
          </mat-card-header>
          <mat-card-content>
            @for (p of portfolios(); track p.id) {
              <div class="portfolio-row" [routerLink]="['/portfolios', p.id]">
                <span class="p-name">{{ p.name }}</span>
                <span class="p-value price-mono">{{ p.totalValue | currencyFormat : 'USD' : true }}</span>
                <span class="p-pnl price-mono" [class]="p.ytdReturnPercent | pnlColor">
                  {{ p.ytdReturnPercent | percentFormat }} YTD
                </span>
              </div>
              <mat-divider></mat-divider>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .dashboard { max-width: 1400px; margin: 0 auto; }
    .page-title { margin: 0 0 24px; font-size: 24px; font-weight: 600; }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    @media (max-width: 768px) {
      .charts-row { grid-template-columns: 1fr; }
    }

    .chart-card, .movers-card { height: 350px; }
    .chart-content {
      height: 280px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .mover-row {
      display: flex;
      align-items: center;
      padding: 10px 0;
      gap: 12px;
      cursor: pointer;
      &:hover { background: var(--surface-elevation-1); }
    }
    .mover-info { flex: 1; }
    .mover-symbol { font-weight: 600; display: block; }
    .mover-name { font-size: 12px; color: rgba(0,0,0,.6); }
    .mover-pct { font-weight: 600; }

    .portfolio-row {
      display: flex;
      align-items: center;
      padding: 12px 0;
      gap: 16px;
      cursor: pointer;
      &:hover { background: var(--surface-elevation-1); }
    }
    .p-name { flex: 1; font-weight: 500; }
    .p-value { min-width: 120px; text-align: right; }
    .p-pnl   { min-width: 100px; text-align: right; font-size: 13px; }
  `],
})
export class DashboardComponent implements OnInit {
  private store = inject(Store<AppState>);

  loading     = toSignal(this.store.select(selectPortfoliosLoading), { initialValue: false });
  portfolios  = toSignal(this.store.select(selectAllPortfolios),     { initialValue: [] });
  totalAUM    = toSignal(this.store.select(selectTotalAUM),          { initialValue: 0 });
  totalDailyPnL = toSignal(this.store.select(selectTotalDailyPnL),  { initialValue: 0 });
  topMovers   = toSignal(this.store.select(selectTopMovers),         { initialValue: [] });

  portfolioCount = computed(() => this.portfolios().length);

  allocation = toSignal(this.store.select(selectAllocationByPortfolio), { initialValue: [] });

  chartData = computed<ChartData<'doughnut'>>(() => ({
    labels:   this.allocation().map((a) => a.label),
    datasets: [{
      data:            this.allocation().map((a) => a.value),
      backgroundColor: [
        '#5c6bc0', '#26c6da', '#66bb6a', '#ffa726', '#ef5350',
      ],
      borderWidth: 2,
    }],
  }));

  chartOptions: ChartOptions<'doughnut'> = {
    responsive:          true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' },
    },
  };

  ngOnInit(): void {
    this.store.dispatch(PortfoliosActions.loadPortfolios());
    this.store.dispatch(PositionsActions.loadPositions({}));
  }
}
