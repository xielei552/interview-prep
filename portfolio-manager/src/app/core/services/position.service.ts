import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Position } from '../../store/app.state';

export interface PositionPage {
  data: Position[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class PositionService {
  private readonly base = '/api/positions';

  constructor(private http: HttpClient) {}

  getAll(portfolioId?: string): Observable<Position[]> {
    let params = new HttpParams();
    if (portfolioId) {
      params = params.set('portfolioId', portfolioId);
    }
    return this.http.get<Position[]>(this.base, { params });
  }
}
