import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Portfolio } from '../../store/app.state';

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private readonly base = '/api/portfolios';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Portfolio[]> {
    return this.http.get<Portfolio[]>(this.base);
  }

  getById(id: string): Observable<Portfolio> {
    return this.http.get<Portfolio>(`${this.base}/${id}`);
  }

  create(portfolio: Omit<Portfolio, 'id'>): Observable<Portfolio> {
    return this.http.post<Portfolio>(this.base, portfolio);
  }

  update(id: string, changes: Partial<Portfolio>): Observable<Portfolio> {
    return this.http.patch<Portfolio>(`${this.base}/${id}`, changes);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
