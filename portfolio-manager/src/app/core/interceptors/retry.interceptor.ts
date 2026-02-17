import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { throwError, timer } from 'rxjs';
import { catchError, mergeMap, retry } from 'rxjs/operators';

const MAX_RETRIES     = 3;
const BACKOFF_BASE_MS = 1000;

/**
 * Exponential backoff retry for GET requests only.
 * Skips retry on 4xx client errors.
 */
export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') {
    return next(req);
  }

  return next(req).pipe(
    retry({
      count: MAX_RETRIES,
      delay: (error, retryCount) => {
        // Don't retry on client errors (4xx)
        if (
          error.status >= HttpStatusCode.BadRequest &&
          error.status < HttpStatusCode.InternalServerError
        ) {
          return throwError(() => error);
        }
        const delayMs = BACKOFF_BASE_MS * Math.pow(2, retryCount - 1);
        console.warn(
          `[RetryInterceptor] Retry ${retryCount}/${MAX_RETRIES} after ${delayMs}ms`,
          error
        );
        return timer(delayMs);
      },
    })
  );
};
