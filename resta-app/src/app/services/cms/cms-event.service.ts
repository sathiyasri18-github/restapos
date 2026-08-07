import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CmsApiService } from './cms-api.service';

export interface EventItem {
  id: number;
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  imageUrl?: string;
  isPublished: boolean;
}

export interface EventForm {
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  imageUrl: string;
  isPublished: boolean;
}

export const defaultEventForm = (): EventForm => ({
  title: '',
  description: '',
  location: '',
  startDate: '',
  endDate: '',
  imageUrl: '',
  isPublished: true,
});

@Injectable({ providedIn: 'root' })
export class CmsEventService {
  private readonly api = inject(CmsApiService);

  getAll(): Observable<EventItem[]> {
    return this.api.get<EventItem[]>('events');
  }

  create(form: EventForm): Observable<unknown> {
    return this.api.post('events', this.toDto(form));
  }

  update(id: number, form: EventForm): Observable<unknown> {
    return this.api.put(`events/${id}`, { id, ...this.toDto(form) });
  }

  delete(id: number): Observable<boolean> {
    return this.api.delete(`events/${id}`);
  }

  private toDto(form: EventForm) {
    return {
      title: form.title,
      description: form.description || null,
      location: form.location || null,
      startDate: form.startDate,
      endDate: form.endDate || null,
      imageUrl: form.imageUrl || null,
      isPublished: form.isPublished,
    };
  }
}
