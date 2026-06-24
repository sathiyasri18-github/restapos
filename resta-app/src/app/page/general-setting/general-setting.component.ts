import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, forkJoin, of } from 'rxjs';
import { AppModule } from '../../module/app.module';
import {
  CreateGeneralSettingDto,
  GeneralSetting,
  GeneralSettingService,
  UpdateGeneralSettingDto
} from '../../services/general-setting.service';
import { MetaService } from '../../services/meta.service';

interface FormErrors {
  siteTitle?: string;
  currency?: string;
  staffAccess?: string;
  dateFormat?: string;
  theme?: string;
  currencyPosition?: string;
}

interface SelectOption {
  label: string;
  value: string;
}

const META_TYPE_CODES = {
  currency: 'CURRENCY',
  currencyPosition: 'CURRENCYPOSITION',
  dateFormat: 'DATEFORMAT',
  invoiceFormat: 'INVOICEFORMAT',
} as const;

function emptyForm(): GeneralSetting {
  return {
    generalSettingId: 0,
    siteTitle: '',
    siteLogo: '',
    favicon: '',
    isRtl: false,
    currency: '',
    staffAccess: '',
    dateFormat: '',
    developedBy: '',
    invoiceFormat: '',
    state: null,
    theme: '',
    currencyPosition: '',
  };
}

@Component({
  selector: 'app-general-setting',
  imports: [AppModule],
  templateUrl: './general-setting.component.html',
  styleUrls: ['./general-setting.component.scss'],
  providers: [MessageService]
})
export class GeneralSettingComponent implements OnInit {
  formData: GeneralSetting = emptyForm();
  formErrors: FormErrors = {};
  isLoading = false;
  isSaving = false;
  lookupsLoading = false;

  currencyOptions: SelectOption[] = [];
  currencyPositionOptions: SelectOption[] = [];
  dateFormatOptions: SelectOption[] = [];
  invoiceFormatOptions: SelectOption[] = [];

  logoPreviewUrl: string | null = null;
  faviconPreviewUrl: string | null = null;
  isUploadingLogo = false;
  isUploadingFavicon = false;

  private pendingLogoFile: File | null = null;
  private pendingFaviconFile: File | null = null;

  constructor(
    private generalSettingService: GeneralSettingService,
    private metaService: MetaService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMetaLookups();
    this.loadSetting();
  }

  get isEditMode(): boolean {
    return this.formData.generalSettingId > 0;
  }

  get canUploadAssets(): boolean {
    return this.isEditMode;
  }

  private loadMetaLookups(): void {
    this.lookupsLoading = true;
    forkJoin({
      currency: this.metaService.getByMetaTypeCode(META_TYPE_CODES.currency).pipe(catchError(() => of(null))),
      currencyPosition: this.metaService.getByMetaTypeCode(META_TYPE_CODES.currencyPosition).pipe(catchError(() => of(null))),
      dateFormat: this.metaService.getByMetaTypeCode(META_TYPE_CODES.dateFormat).pipe(catchError(() => of(null))),
      invoiceFormat: this.metaService.getByMetaTypeCode(META_TYPE_CODES.invoiceFormat).pipe(catchError(() => of(null))),
    }).subscribe({
      next: (res) => {
        this.currencyOptions = this.toSelectOptions(res.currency);
        this.currencyPositionOptions = this.toSelectOptions(res.currencyPosition);
        this.dateFormatOptions = this.toSelectOptions(res.dateFormat);
        this.invoiceFormatOptions = this.toSelectOptions(res.invoiceFormat);
        this.lookupsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.lookupsLoading = false;
      }
    });
  }

  private toSelectOptions(res: any): SelectOption[] {
    return this.extractItems(res)
      .map((m: any) => ({
        label: m.metaName ?? m.categoryName ?? '',
        value: m.metaName ?? m.categoryName ?? '',
      }))
      .filter((o: SelectOption) => o.value);
  }

  private loadSetting(): void {
    this.isLoading = true;
    this.generalSettingService.getAll({ pageSize: 1 }).pipe(
      catchError(() => of(null))
    ).subscribe({
      next: (res: any) => {
        const raw = this.extractItems(res);
        if (raw.length) {
          this.formData = this.mapSetting(raw[0]);
          this.refreshAssetPreviews();
        }
        this.isLoading = false;
        if (!res) {
          this.messageService.add({
            severity: 'error',
            summary: 'Load Failed',
            detail: 'Could not load general settings. Please try again.'
          });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load general settings. Please try again.'
        });
      }
    });
  }

  private mapSetting(x: any): GeneralSetting {
    return {
      generalSettingId: x.generalSettingId ?? x.id ?? 0,
      siteTitle: x.siteTitle ?? '',
      siteLogo: x.siteLogo ?? '',
      favicon: x.favicon ?? '',
      isRtl: x.isRtl ?? false,
      currency: x.currency ?? '',
      staffAccess: x.staffAccess ?? '',
      dateFormat: x.dateFormat ?? '',
      developedBy: x.developedBy ?? '',
      invoiceFormat: x.invoiceFormat ?? '',
      state: x.state ?? null,
      theme: x.theme ?? '',
      currencyPosition: x.currencyPosition ?? '',
    };
  }

  private extractItems(res: any): any[] {
    return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
  }

  private refreshAssetPreviews(): void {
    this.logoPreviewUrl = this.generalSettingService.resolveAssetUrl(this.formData.siteLogo);
    this.faviconPreviewUrl = this.generalSettingService.resolveAssetUrl(this.formData.favicon);
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!this.canUploadAssets) {
      this.pendingLogoFile = file;
      this.logoPreviewUrl = URL.createObjectURL(file);
      this.messageService.add({
        severity: 'info',
        summary: 'Logo selected',
        detail: 'Save settings first, then the logo will upload automatically.'
      });
      return;
    }

    this.uploadLogo(file);
  }

  onFaviconSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!this.canUploadAssets) {
      this.pendingFaviconFile = file;
      this.faviconPreviewUrl = URL.createObjectURL(file);
      this.messageService.add({
        severity: 'info',
        summary: 'Favicon selected',
        detail: 'Save settings first, then the favicon will upload automatically.'
      });
      return;
    }

    this.uploadFavicon(file);
  }

  removeLogo(): void {
    if (!this.canUploadAssets) {
      this.pendingLogoFile = null;
      this.formData.siteLogo = '';
      this.logoPreviewUrl = null;
      return;
    }

    this.isUploadingLogo = true;
    this.generalSettingService.deleteSiteLogo(this.formData.generalSettingId).subscribe({
      next: (res: any) => {
        const updated = this.mapSetting(res?.data ?? res ?? {});
        this.formData.siteLogo = updated.siteLogo ?? '';
        this.refreshAssetPreviews();
        this.isUploadingLogo = false;
      },
      error: () => {
        this.isUploadingLogo = false;
        this.messageService.add({ severity: 'error', summary: 'Remove Failed', detail: 'Could not remove site logo.' });
      }
    });
  }

  removeFavicon(): void {
    if (!this.canUploadAssets) {
      this.pendingFaviconFile = null;
      this.formData.favicon = '';
      this.faviconPreviewUrl = null;
      return;
    }

    this.isUploadingFavicon = true;
    this.generalSettingService.deleteFavicon(this.formData.generalSettingId).subscribe({
      next: (res: any) => {
        const updated = this.mapSetting(res?.data ?? res ?? {});
        this.formData.favicon = updated.favicon ?? '';
        this.refreshAssetPreviews();
        this.isUploadingFavicon = false;
      },
      error: () => {
        this.isUploadingFavicon = false;
        this.messageService.add({ severity: 'error', summary: 'Remove Failed', detail: 'Could not remove favicon.' });
      }
    });
  }

  private uploadLogo(file: File): void {
    this.isUploadingLogo = true;
    this.generalSettingService.uploadSiteLogo(this.formData.generalSettingId, file).subscribe({
      next: (res: any) => {
        const updated = this.mapSetting(res?.data ?? res ?? {});
        this.formData.siteLogo = updated.siteLogo ?? '';
        this.refreshAssetPreviews();
        this.isUploadingLogo = false;
        this.messageService.add({ severity: 'success', summary: 'Logo uploaded', detail: 'Site logo was updated.' });
      },
      error: (err) => {
        this.isUploadingLogo = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Upload Failed',
          detail: err?.error?.message ?? 'Could not upload site logo.'
        });
      }
    });
  }

  private uploadFavicon(file: File): void {
    this.isUploadingFavicon = true;
    this.generalSettingService.uploadFavicon(this.formData.generalSettingId, file).subscribe({
      next: (res: any) => {
        const updated = this.mapSetting(res?.data ?? res ?? {});
        this.formData.favicon = updated.favicon ?? '';
        this.refreshAssetPreviews();
        this.isUploadingFavicon = false;
        this.messageService.add({ severity: 'success', summary: 'Favicon uploaded', detail: 'Favicon was updated.' });
      },
      error: (err) => {
        this.isUploadingFavicon = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Upload Failed',
          detail: err?.error?.message ?? 'Could not upload favicon.'
        });
      }
    });
  }

  private uploadPendingAssets(): void {
    if (this.pendingLogoFile) {
      const file = this.pendingLogoFile;
      this.pendingLogoFile = null;
      this.uploadLogo(file);
    }
    if (this.pendingFaviconFile) {
      const file = this.pendingFaviconFile;
      this.pendingFaviconFile = null;
      this.uploadFavicon(file);
    }
  }

  private validate(): boolean {
    this.formErrors = {};

    if (!this.formData.siteTitle?.trim()) {
      this.formErrors.siteTitle = 'Site title is required';
    }
    if (!this.formData.currency?.trim()) {
      this.formErrors.currency = 'Currency is required';
    }
    if (!this.formData.staffAccess?.trim()) {
      this.formErrors.staffAccess = 'Staff access is required';
    }
    if (!this.formData.dateFormat?.trim()) {
      this.formErrors.dateFormat = 'Date format is required';
    }
    if (!this.formData.theme?.trim()) {
      this.formErrors.theme = 'Theme is required';
    }
    if (!this.formData.currencyPosition?.trim()) {
      this.formErrors.currencyPosition = 'Currency position is required';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  onSubmit(): void {
    if (!this.validate()) return;
    this.isSaving = true;

    if (this.isEditMode) {
      this.saveEdit();
    } else {
      this.saveAdd();
    }
  }

  private toCreateDto(f: GeneralSetting): CreateGeneralSettingDto {
    return {
      siteTitle: f.siteTitle.trim(),
      siteLogo: f.siteLogo?.trim() || null,
      favicon: f.favicon?.trim() || null,
      isRtl: f.isRtl,
      currency: f.currency.trim(),
      staffAccess: f.staffAccess.trim(),
      dateFormat: f.dateFormat.trim(),
      developedBy: f.developedBy?.trim() || null,
      invoiceFormat: f.invoiceFormat?.trim() || null,
      state: f.state,
      theme: f.theme.trim(),
      currencyPosition: f.currencyPosition.trim(),
    };
  }

  private toUpdateDto(f: GeneralSetting): UpdateGeneralSettingDto {
    return {
      id: f.generalSettingId,
      siteTitle: f.siteTitle.trim(),
      siteLogo: f.siteLogo?.trim() || null,
      favicon: f.favicon?.trim() || null,
      isRtl: f.isRtl,
      currency: f.currency.trim(),
      staffAccess: f.staffAccess.trim(),
      dateFormat: f.dateFormat.trim(),
      developedBy: f.developedBy?.trim() || null,
      invoiceFormat: f.invoiceFormat?.trim() || null,
      state: f.state,
      theme: f.theme.trim(),
      currencyPosition: f.currencyPosition.trim(),
    };
  }

  private saveAdd(): void {
    this.generalSettingService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        this.formData = this.mapSetting(res?.data ?? res ?? this.formData);
        this.refreshAssetPreviews();
        this.isSaving = false;
        this.uploadPendingAssets();
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'General settings were saved successfully.'
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not save general settings. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.generalSettingService.update(this.formData.generalSettingId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'General settings were saved successfully.'
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not save general settings. Please try again.'
        });
      }
    });
  }
}
