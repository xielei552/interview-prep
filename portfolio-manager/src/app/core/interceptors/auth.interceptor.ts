import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Adds a mock Authorization header to every outgoing request.
 * In a real app this would pull from an auth service/store.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = 'mock-jwt-token-for-demo';
  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`),
  });
  return next(authReq);
};
