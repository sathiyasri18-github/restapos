import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AppModule } from '../../../module/app.module';
import {
  CmsSettingsService,
  SiteSettings,
  defaultSiteSettings
} from '../../../services/cms/cms-settings.service';

@Component({
  selector: 'app-cms-settings',
  imports: [AppModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  providers: [MessageService]
})
export class CmsSettingsComponent implements OnInit {
  form: SiteSettings = defaultSiteSettings();
  isLoading = false;
  isSaving = false;

  constructor(
    private service: CmsSettingsService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.service.get().subscribe({
      next: data => {
        this.form = { ...defaultSiteSettings(), ...(data || {}) };
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load site settings.' });
      }
    });
  }

  onSave(): void {
    this.isSaving = true;
    this.service.update(this.form).subscribe({
      next: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Site settings updated.' });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not save settings.' });
      }
    });
  }
}
