import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface PaymentReminder {
  paymentReminderId: number;
  customerId:        number;
  reminderTypeId:    number;
  reminderDate:      Date | null;
  dueDate:           Date | null;
  amount:            number | null;
  remarks:           string;
  isSent:            boolean;
  sentDate:          Date | null;
  customerName?:     string;
  reminderTypeName?: string;
}

export interface CreatePaymentReminderDto {
  customerId:     number;
  reminderTypeId:   number;
  reminderDate:     string;
  dueDate:          string | null;
  amount:           number | null;
  remarks:          string | null;
  isSent:           boolean;
  sentDate:         string | null;
  createdBy:        number | null;
}

export interface UpdatePaymentReminderDto {
  customerId:     number;
  reminderTypeId:   number;
  reminderDate:     string;
  dueDate:          string | null;
  amount:           number | null;
  remarks:          string | null;
  isSent:           boolean;
  sentDate:         string | null;
  modifiedBy:       number | null;
}

export interface PaymentReminderListParams {
  search?:     string;
  pageNumber?: number;
  pageSize?:   number;
}

@Injectable({ providedIn: 'root' })
export class PaymentReminderService {
  private readonly apiUrl = apiUrl('PaymentReminders');

  constructor(private http: HttpClient) {}

  getAll(params: PaymentReminderListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.search)     p = p.set('search', params.search);
    if (params.pageNumber) p = p.set('pageNumber', params.pageNumber.toString());
    if (params.pageSize)   p = p.set('pageSize', params.pageSize.toString());
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreatePaymentReminderDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdatePaymentReminderDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
