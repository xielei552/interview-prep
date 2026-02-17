import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Portfolio } from '../app.state';

export const PortfoliosActions = createActionGroup({
  source: 'Portfolios',
  events: {
    'Load Portfolios':         emptyProps(),
    'Load Portfolios Success': props<{ portfolios: Portfolio[] }>(),
    'Load Portfolios Failure': props<{ error: string }>(),

    'Load Portfolio':         props<{ id: string }>(),
    'Load Portfolio Success': props<{ portfolio: Portfolio }>(),
    'Load Portfolio Failure': props<{ error: string }>(),

    'Select Portfolio': props<{ id: string | null }>(),

    'Create Portfolio':         props<{ portfolio: Omit<Portfolio, 'id'> }>(),
    'Create Portfolio Success': props<{ portfolio: Portfolio }>(),
    'Create Portfolio Failure': props<{ error: string }>(),

    'Update Portfolio':         props<{ id: string; changes: Partial<Portfolio> }>(),
    'Update Portfolio Success': props<{ portfolio: Portfolio }>(),
    'Update Portfolio Failure': props<{ error: string }>(),

    'Delete Portfolio':         props<{ id: string }>(),
    'Delete Portfolio Success': props<{ id: string }>(),
    'Delete Portfolio Failure': props<{ error: string }>(),
  },
});
