import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Position, PositionFilters } from '../app.state';

export const PositionsActions = createActionGroup({
  source: 'Positions',
  events: {
    'Load Positions':         props<{ portfolioId?: string }>(),
    'Load Positions Success': props<{ positions: Position[]; totalCount: number }>(),
    'Load Positions Failure': props<{ error: string }>(),

    'Set Filters':    props<{ filters: Partial<PositionFilters> }>(),
    'Reset Filters':  emptyProps(),

    'Export CSV':         emptyProps(),
    'Export CSV Success': emptyProps(),
    'Export CSV Failure': props<{ error: string }>(),
  },
});
