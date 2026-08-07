import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CmsApiService } from './cms-api.service';

export interface VideoItem {
  id: number;
  title: string;
  description?: string;
  source: number;
  videoUrl?: string;
  youTubeId?: string;
  thumbnailUrl?: string;
  category?: string;
  isPublished: boolean;
}

export interface VideoForm {
  title: string;
  description: string;
  source: number;
  videoUrl: string;
  youTubeId: string;
  thumbnailUrl: string;
  category: string;
  isPublished: boolean;
}

export const defaultVideoForm = (): VideoForm => ({
  title: '',
  description: '',
  source: 2,
  videoUrl: '',
  youTubeId: '',
  thumbnailUrl: '',
  category: '',
  isPublished: true,
});

export const VideoSources = [
  { label: 'Upload', value: 1 },
  { label: 'YouTube', value: 2 },
];

@Injectable({ providedIn: 'root' })
export class CmsVideoService {
  private readonly api = inject(CmsApiService);

  getAll(): Observable<VideoItem[]> {
    return this.api.get<VideoItem[]>('videos');
  }

  create(form: VideoForm): Observable<unknown> {
    return this.api.post('videos', this.toRequest(form));
  }

  update(id: number, form: VideoForm): Observable<unknown> {
    return this.api.put(`videos/${id}`, this.toRequest(form));
  }

  delete(id: number): Observable<boolean> {
    return this.api.delete(`videos/${id}`);
  }

  private toRequest(form: VideoForm) {
    return {
      title: form.title,
      description: form.description || null,
      source: form.source,
      videoUrl: form.videoUrl || null,
      youTubeId: form.youTubeId || null,
      thumbnailUrl: form.thumbnailUrl || null,
      category: form.category || null,
      isPublished: form.isPublished,
    };
  }
}
