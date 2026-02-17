import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { map } from 'rxjs';

import { AppState, Portfolio } from '../../store/app.state';
import { PositionsActions } from '../../store/positions/positions.actions';
import { selectAllPositions } from '../../store/positions/positions.selectors';
import { selectAssetClassBreakdown } from '../../store/positions/positions.selectors';
import { TransactionsActions } from '../../store/transactions/transactions.actions';

import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { PercentFormatPipe } from '../../shared/pipes/percent-format.pipe';
import { PnlColorPipe } from '../../shared/pipes/pnl-color.pipe';

@Component({
  selector: 'app-portfolio-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
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
    <div class="detail-page">
      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <a mat-button routerLink="/portfolios">
          <mat-icon>arrow_back</mat-icon> Portfolios
        </a>
      </div>

      @if (portfolio) {
        <div class="page-header">
          <div>
            <h1 class="page-title">{{ portfolio.name }}</h1>
            <p class="subtitle">{{ portfolio.description }}</p>
          </div>
          <mat-chip>{{ portfolio.currency }}</mat-chip>
        </div>

        <!-- KPIs -->
        <div class="kpi-grid">
          <app-kpi-card
            label="Total Value"
            [value]="portfolio.totalValue"
            icon="account_balance_wallet"
          ></app-kpi-card>
          <app-kpi-card
            label="Daily P&L"
            [value]="portfolio.dailyPnL"
            [change]="portfolio.dailyPnL"
            [changePercent]="portfolio.dailyPnLPercent"
            icon="today"
            [iconColor]="portfolio.dailyPnL >= 0 ? '#00c853' : '#f44336'"
          ></app-kpi-card>
          <app-kpi-card
            label="YTD Return"
            [value]="portfolio.ytdReturn"
            [change]="portfolio.ytdReturn"
            [changePercent]="portfolio.ytdReturnPercent"
            icon="calendar_today"
            [iconColor]="portfolio.ytdReturn >= 0 ? '#00c853' : '#f44336'"
          ></app-kpi-card>
          <app-kpi-card
            label="Positions"
            [value]="positionCount()"
            icon="list"
            iconColor="#26c6da"
          ></app-kpi-card>
        </div>

        <!-- Asset class chart -->
        <div class="charts-row">
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>Asset Class Breakdown</mat-card-title>
            </mat-card-header>
            <mat-card-content class="chart-content">
              @if (breakdownChartData().datasets[0].data.length > 0) {
                <canvas
                  baseChart
                  [data]="breakdownChartData()"
                  [options]="barOptions"
                  type="bar"
                ></canvas>
              }
            </mat-card-content>
          </mat-card>

          <!-- Top positions -->
          <mat-card class="positions-card">
            <mat-card-header>
              <mat-card-title>Top Positions</mat-card-title>
              <div class="flex-spacer"></div>
              <a mat-button [routerLink]="['/positions']">View All</a>
            </mat-card-header>
            <mat-card-content>
              @for (pos of topPositions(); track pos.id) {
                <div class="pos-row">
                  <div class="pos-info">
                    <span class="pos-symbol">{{ pos.symbol }}</span>
                    <span class="pos-weight">{{ pos.weight.toFixed(2) }}%</span>
                  </div>
                  <div class="pos-values">
                    <span class="pos-value price-mono">{{ pos.marketValue | currencyFormat : 'USD' : true }}</span>
                    <span class="pos-pnl price-mono" [class]="pos.unrealizedPnLPercent | pnlColor">
                      {{ pos.unrealizedPnLPercent | percentFormat }}
                    </span>
                  </div>
                </div>
                <mat-divider></mat-divider>
              }
            </mat-card-content>
          </mat-card>
        </div>
      } @else {
        <app-loading-spinner message="Loading portfolio..."></app-loading-spinner>
      }
    </div>
  `,
  styles: [`
    .detail-page { max-width: 1400px; margin: 0 auto; }
    .breadcrumb { margin-bottom: 8px; }
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .page-title { margin: 0 0 4px; font-size: 24px; font-weight: 600; }
    .subtitle { margin: 0; color: rgba(0,0,0,.6); font-size: 14px; }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 768px) { .charts-row { grid-template-columns: 1fr; } }

    .chart-card, .positions-card { min-height: 350px; }
    .chart-content {
      height: 280px;
      display: flex;
      align-items: center;
    }

    .pos-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
    }
    .pos-info { display: flex; flex-direction: column; }
    .pos-symbol { font-weight: 600; }
    .pos-weight { font-size: 12px; color: rgba(0,0,0,.6); }
    .pos-values { text-align: right; }
    .pos-value { display: block; }
    .pos-pnl { font-size: 13px; }
  `],
})
export class PortfolioDetailComponent implements OnInit {
  private store = inject(Store<AppState>);
  private route = inject(ActivatedRoute);

  portfolio: Portfolio | null = this.route.snapshot.data['portfolio'];

  allPositions = toSignal(this.store.select(selectAllPositions), { initialValue: [] });
  breakdown    = toSignal(this.store.select(selectAssetClassBreakdown), { initialValue: [] });

  portfolioPositions = computed(() =>
    this.allPositions().filter((p) => p.portfolioId === this.portfolio?.id)
  );
  positionCount = computed(() => this.portfolioPositions().length);
  topPositions  = computed(() =>
    [...this.portfolioPositions()]
      .sort((a, b) => b.marketValue - a.marketValue)
      .slice(0, 8)
  );

  breakdownChartData = computed<ChartData<'bar'>>(() => ({
    labels:   this.breakdown().map((d) => d.label),
    datasets: [{
      label:           'Market Value',
      data:            this.breakdown().map((d) => d.value),
      backgroundColor: ['#5c6bc0', '#26c6da', '#66bb6a', '#ffa726'],
    }],
  }));

  barOptions: ChartOptions<'bar'> = {
    responsive:          true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales:  { y: { ticks: { callback: (v) => `$${Number(v).toLocaleString()}` } } },
  };

  ngOnInit(): void {
    if (this.portfolio) {
      this.store.dispatch(
        PositionsActions.loadPositions({ portfolioId: this.portfolio.id })
      );
    }
  }
}
