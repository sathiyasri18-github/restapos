// unit.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface Unit {
  id: number;
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class UnitService {

  private readonly apiUrl = apiUrl('Units');

  constructor(private http: HttpClient) {}

  // =========================
  // GET ALL
  // =========================
  getUnits(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  // =========================
  // GET BY ID
  // =========================
  getUnitById(id: number): Observable<Unit> {
    return this.http.get<Unit>(`${this.apiUrl}/${id}`);
  }

  // =========================
  // CREATE
  // =========================
  createUnit(unit: Unit): Observable<Unit> {
    return this.http.post<Unit>(this.apiUrl, unit);
  }

  // =========================
  // UPDATE
  // =========================
  updateUnit(unit: Unit): Observable<any> {
    return this.http.put(`${this.apiUrl}`, unit);
  }

  // =========================
  // DELETE
  // =========================
  deleteUnit(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}