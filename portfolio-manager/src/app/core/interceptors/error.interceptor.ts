import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export interface AppError {
  status:  number;
  message: string;
  url:     string | null;
}

/**
 * Normalizes HTTP errors into a consistent AppError shape.
 * Handles 401 (unauthorized), 403 (forbidden), and network failures.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err) => {
      let message = 'An unexpected error occurred.';

      if (err.status === HttpStatusCode.Unauthorized) {
        message = 'Unauthorized — please log in.';
        // In a real app: inject AuthService and call logout()
      } else if (err.status === HttpStatusCode.Forbidden) {
        message = 'Access denied — insufficient permissions.';
      } else if (err.status === 0) {
        message = 'Network error — check your connection.';
      } else if (err.error?.message) {
        message = err.error.message;
      } else if (err.statusText) {
        message = err.statusText;
      }

      const appError: AppError = {
        status:  err.status,
        message,
        url:     req.urlWithParams,
      };

      console.error('[ErrorInterceptor]', appError);
      return throwError(() => appError);
    })
  );
};
