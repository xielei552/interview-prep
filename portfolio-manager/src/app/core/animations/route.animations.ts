import {
  animate,
  group,
  query,
  style,
  transition,
  trigger,
} from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        width: '100%',
        opacity: 0,
      }),
    ], { optional: true }),
    group([
      query(':leave', [
        animate('150ms ease-out', style({ opacity: 0 })),
      ], { optional: true }),
      query(':enter', [
        animate('200ms 100ms ease-in', style({ opacity: 1 })),
      ], { optional: true }),
    ]),
  ]),
]);
