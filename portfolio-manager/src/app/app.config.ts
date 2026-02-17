import { isDevMode } from '@angular/core';
import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  provideRouter,
  withRouterConfig,
} from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { provideStore }        from '@ngrx/store';
import { provideEffects }      from '@ngrx/effects';
import { provideRouterStore }  from '@ngrx/router-store';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { APP_ROUTES }           from './app.routes';
import { authInterceptor }       from './core/interceptors/auth.interceptor';
import { retryInterceptor }      from './core/interceptors/retry.interceptor';
import { errorInterceptor }      from './core/interceptors/error.interceptor';
import { portfoliosReducer }     from './store/portfolios/portfolios.reducer';
import { PortfoliosEffects }     from './store/portfolios/portfolios.effects';
import { positionsReducer }      from './store/positions/positions.reducer';
import { PositionsEffects }      from './store/positions/positions.effects';
import { transactionsReducer }   from './store/transactions/transactions.reducer';
import { TransactionsEffects }   from './store/transactions/transactions.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      APP_ROUTES,
      withRouterConfig({ paramsInheritanceStrategy: 'always' })
    ),
    provideAnimations(),
    provideHttpClient(
      withInterceptors([authInterceptor, retryInterceptor, errorInterceptor])
    ),
    provideStore({
      portfolios:   portfoliosReducer,
      positions:    positionsReducer,
      transactions: transactionsReducer,
    }),
    provideEffects([PortfoliosEffects, PositionsEffects, TransactionsEffects]),
    provideRouterStore(),
    provideStoreDevtools({
      maxAge:        50,
      logOnly:       !isDevMode(),
      connectInZone: true,
    }),
  ],
};
