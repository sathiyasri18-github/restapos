import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AppModule } from '../../../module/app.module';
import {
  CmsPageService,
  DynamicPage,
  PageForm
} from '../../../services/cms/cms-page.service';

const CAREERS_SLUG = 'careers';

@Component({
  selector: 'app-cms-careers',
  imports: [AppModule],
  templateUrl: './careers.component.html',
  styleUrls: ['./careers.component.scss'],
  providers: [MessageService]
})
export class CmsCareersComponent implements OnInit {
  page: DynamicPage | null = null;
  form: PageForm = {
    title: 'Careers',
    slug: CAREERS_SLUG,
    content: '',
    metaDescription: '',
    isPublished: true
  };
  isLoading = false;
  isSaving = false;

  constructor(
    private service: CmsPageService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.service.getAll().subscribe({
      next: data => {
        const pages = Array.isArray(data) ? data : [];
        this.page = pages.find(p => p.slug === CAREERS_SLUG) ?? null;
        if (this.page) {
          this.form = {
            title: this.page.title,
            slug: CAREERS_SLUG,
            content: this.page.content || '',
            metaDescription: this.page.metaDescription || '',
            isPublished: this.page.isPublished
          };
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load careers page.'
        });
        this.cdr.detectChanges();
      }
    });
  }

  onSave(): void {
    if (!this.form.title.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Title is required.' });
      return;
    }

    this.isSaving = true;
    this.form.slug = CAREERS_SLUG;
    const op = this.page
      ? this.service.update(this.page.id, this.form)
      : this.service.create(this.form);

    op.subscribe({
      next: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Careers page updated.' });
        this.load();
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not save careers page.' });
        this.cdr.detectChanges();
      }
    });
  }
}
