import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CmsApiService } from './cms-api.service';

export interface ContactInquiry {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface PagedInquiries {
  items: ContactInquiry[];
  totalCount: number;
}

@Injectable({ providedIn: 'root' })
export class CmsContactService {
  private readonly api = inject(CmsApiService);

  getAll(page = 1, pageSize = 100): Observable<PagedInquiries | ContactInquiry[]> {
    return this.api.get(`contact?page=${page}&pageSize=${pageSize}`);
  }

  markAsRead(id: number): Observable<boolean> {
    return this.api.patch(`contact/${id}/read`);
  }

  delete(id: number): Observable<boolean> {
    return this.api.delete(`contact/${id}`);
  }
}
