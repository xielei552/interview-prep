import { EntityState } from '@ngrx/entity';
import { RouterReducerState } from '@ngrx/router-store';

// ─── Domain Models ───────────────────────────────────────────────────────────

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  currency: string;
  createdAt: string;
  totalValue: number;
  dailyPnL: number;
  dailyPnLPercent: number;
  ytdReturn: number;
  ytdReturnPercent: number;
}

export type AssetClass = 'Stock' | 'ETF' | 'Bond' | 'Crypto';

export interface Position {
  id: string;
  portfolioId: string;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  weight: number;
  dayChange: number;
  dayChangePercent: number;
}

export type TransactionType   = 'Buy' | 'Sell' | 'Dividend' | 'Transfer';
export type TransactionStatus = 'Settled' | 'Pending' | 'Cancelled';

export interface Transaction {
  id: string;
  portfolioId: string;
  symbol: string;
  name: string;
  type: TransactionType;
  quantity: number;
  price: number;
  total: number;
  fee: number;
  date: string;
  status: TransactionStatus;
}

// ─── Feature State Shapes ────────────────────────────────────────────────────

export interface PositionFilters {
  search: string;
  assetClass: AssetClass | '';
  portfolioId: string;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
}

export interface PortfolioFeatureState extends EntityState<Portfolio> {
  loading: boolean;
  error: string | null;
  selectedId: string | null;
}

export interface PositionFeatureState extends EntityState<Position> {
  loading: boolean;
  error: string | null;
  filters: PositionFilters;
  totalCount: number;
}

export interface TransactionFeatureState extends EntityState<Transaction> {
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  totalCount: number;
  dateFrom: string | null;
  dateTo: string | null;
}

// ─── Root App State ──────────────────────────────────────────────────────────

export interface AppState {
  portfolios:   PortfolioFeatureState;
  positions:    PositionFeatureState;
  transactions: TransactionFeatureState;
  router:       RouterReducerState;
}
