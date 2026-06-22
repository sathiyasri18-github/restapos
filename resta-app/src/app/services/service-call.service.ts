// service-call.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface ServiceCall {
  serviceCallId:       number;
  customerId:          number;
  serviceTypeId:       number;
  problemReport:       string;
  actionTakenId:       number | null;
  assignedEngineerId:  number | null;
  chiefEngineerId:     number | null;
  serviceDate:         Date | null;
  dueDate:             Date | null;
  completedDate:       Date | null;
  statusId:            number;
  priorityId:            number | null;
  remarks:             string;
  createdDate?:        Date | null;
  createdBy?:          number | null;
  modifiedDate?:       Date | null;
  modifiedBy?:         number | null;
}

export interface CreateServiceCallDto {
  customerId:          number;
  serviceTypeId:       number;
  problemReport:       string;
  actionTakenId:       number | null;
  assignedEngineerId:  number | null;
  chiefEngineerId:     number | null;
  serviceDate:         string;
  dueDate:             string | null;
  statusId:            number;
  priorityId:          number | null;
  remarks:             string | null;
  createdBy:           number | null;
}

export interface UpdateServiceCallDto {
  serviceCallId:       number;
  customerId:          number;
  serviceTypeId:       number;
  problemReport:       string;
  actionTakenId:       number | null;
  assignedEngineerId:  number | null;
  chiefEngineerId:     number | null;
  serviceDate:         string;
  dueDate:             string | null;
  completedDate:       string | null;
  statusId:            number;
  priorityId:          number | null;
  remarks:             string | null;
  modifiedBy:          number | null;
}

export interface ServiceCallListParams {
  search?:     string;
  statusId?:   number;
  customerId?: number;
  pageNumber?: number;
  pageSize?:   number;
}

@Injectable({ providedIn: 'root' })
export class ServiceCallService {

  private readonly apiUrl = apiUrl('ServiceCalls');

  constructor(private http: HttpClient) {}

  getAll(params: ServiceCallListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.search)     p = p.set('search',     params.search);
    if (params.statusId)   p = p.set('statusId',   params.statusId.toString());
    if (params.customerId) p = p.set('customerId', params.customerId.toString());
    if (params.pageNumber) p = p.set('pageNumber', params.pageNumber.toString());
    if (params.pageSize)   p = p.set('pageSize',   params.pageSize.toString());
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateServiceCallDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateServiceCallDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
