// meta-type-component.ts

import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent } from '../../common/grid-report';
import {
  Meta,
  MetaService,
  CreateMetaDto,
  UpdateMetaDto
} from '../../services/meta.service';
import {
  MetaType,
  MetaTypeService,
  CreateMetaTypeDto,
  UpdateMetaTypeDto
} from '../../services/meta-type.service';

type DialogMode = 'add' | 'edit';

interface MetaTypeFormErrors {
  metaTypeCode?: string;
  metaTypeName?: string;
}

interface MetaFormErrors {
  metaName?: string;
}

function emptyMetaTypeForm(): MetaType {
  return { metaTypeId: 0, metaTypeCode: '', metaTypeName: '' };
}

function emptyMetaForm(metaTypeId: number | null = null): Meta {
  return { metaId: 0, metaName: '', metaTypeId };
}

@Component({
  selector: 'app-meta-type-component',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './meta-type-component.html',
  styleUrls: ['./meta-type-component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class MetaTypeComponent implements OnInit, OnDestroy {

  // â”€â”€â”€ Meta Type state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  metaTypes: MetaType[] = [];
  selectedMetaType: MetaType | null = null;
  metaTypeLoading = false;
  metaTypeTotalRecords = 0;
  metaTypeSearchTerm = '';
  private metaTypeSearch$ = new Subject<string>();

  metaTypeDialogVisible = false;
  metaTypeDialogMode: DialogMode = 'add';
  metaTypeFormData: MetaType = emptyMetaTypeForm();
  metaTypeFormErrors: MetaTypeFormErrors = {};
  metaTypeSaving = false;

  // â”€â”€â”€ Meta state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  metas: Meta[] = [];
  selectedMeta: Meta | null = null;
  metaLoading = false;
  metaTotalRecords = 0;
  metaSearchTerm = '';
  private metaSearch$ = new Subject<string>();

  metaDialogVisible = false;
  metaDialogMode: DialogMode = 'add';
  metaFormData: Meta = emptyMetaForm();
  metaFormErrors: MetaFormErrors = {};
  metaSaving = false;

  private destroy$ = new Subject<void>();

  constructor(
    private metaTypeService: MetaTypeService,
    private metaService: MetaService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.metaTypeSearch$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => this.loadMetaTypes(term));

    this.metaSearch$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => this.loadMetas(term));

    this.loadMetaTypes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // â”€â”€â”€ Derived â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  get metaTypeDialogTitle(): string {
    return this.metaTypeDialogMode === 'add' ? 'Add Meta Type' : 'Edit Meta Type';
  }

  get metaDialogTitle(): string {
    return this.metaDialogMode === 'add' ? 'Add Meta' : 'Edit Meta';
  }

  get hasMetaTypeSearch(): boolean {
    return !!this.metaTypeSearchTerm.trim();
  }

  get hasMetaSearch(): boolean {
    return !!this.metaSearchTerm.trim();
  }

  get hasSelectedMetaType(): boolean {
    return this.selectedMetaType != null;
  }

  formatDate(value: Date | null | undefined): string {
    if (!value) return 'â€”';
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return 'â€”';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // â”€â”€â”€ Meta Type: load â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  loadMetaTypes(search = ''): void {
    this.metaTypeLoading = true;
    this.metaTypeService.getAll({ search, pageSize: 200 }).subscribe({
      next: (res: any) => {
        const raw: any[] = this.extractItems(res);
        this.metaTypes = raw.map(x => this.mapMetaType(x));
        this.metaTypeTotalRecords = res?.totalCount ?? this.metaTypes.length;
        this.metaTypeLoading = false;

        if (this.selectedMetaType) {
          const still = this.metaTypes.find(
            t => t.metaTypeId === this.selectedMetaType!.metaTypeId
          );
          if (still) {
            this.selectedMetaType = still;
            this.loadMetas(this.metaSearchTerm);
          } else {
            this.clearMetaPanel();
          }
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.metaTypeLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load meta types.'
        });
      }
    });
  }

  private mapMetaType(x: any): MetaType {
    return {
      metaTypeId:   x.metaTypeId ?? x.id ?? 0,
      metaTypeCode: x.metaTypeCode ?? '',
      metaTypeName: x.metaTypeName ?? '',
      createdDate:  x.createdDate  ? new Date(x.createdDate)  : null,
      modifiedDate: x.modifiedDate ? new Date(x.modifiedDate) : null,
    };
  }

  onMetaTypeSearchChange(): void {
    this.metaTypeSearch$.next(this.metaTypeSearchTerm);
  }

  onClearMetaTypeSearch(): void {
    this.metaTypeSearchTerm = '';
    this.loadMetaTypes();
  }

  onMetaTypeSelect(): void {
    this.selectedMeta = null;
    this.metaSearchTerm = '';
    if (this.selectedMetaType) {
      this.loadMetas();
    } else {
      this.clearMetaPanel();
    }
  }

  // â”€â”€â”€ Meta Type: dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  openMetaTypeAddDialog(): void {
    this.metaTypeDialogMode = 'add';
    this.metaTypeFormData   = emptyMetaTypeForm();
    this.metaTypeFormErrors = {};
    this.metaTypeDialogVisible = true;
  }

  openMetaTypeEditDialog(item: MetaType): void {
    this.metaTypeDialogMode = 'edit';
    this.metaTypeFormData   = { ...item };
    this.metaTypeFormErrors = {};
    this.metaTypeDialogVisible = true;
  }

  onMetaTypeEditSelected(): void {
    if (this.selectedMetaType) this.openMetaTypeEditDialog(this.selectedMetaType);
  }

  onMetaTypeDialogHide(): void {
    this.metaTypeFormErrors = {};
    this.metaTypeSaving = false;
  }

  private validateMetaType(): boolean {
    this.metaTypeFormErrors = {};
    if (!this.metaTypeFormData.metaTypeCode?.trim()) {
      this.metaTypeFormErrors.metaTypeCode = 'Meta type code is required';
    }
    if (!this.metaTypeFormData.metaTypeName?.trim()) {
      this.metaTypeFormErrors.metaTypeName = 'Meta type name is required';
    }
    return Object.keys(this.metaTypeFormErrors).length === 0;
  }

  onMetaTypeSave(): void {
    if (!this.validateMetaType()) return;
    this.metaTypeSaving = true;
    this.metaTypeDialogMode === 'add' ? this.saveMetaTypeAdd() : this.saveMetaTypeEdit();
  }

  private toCreateMetaTypeDto(f: MetaType): CreateMetaTypeDto {
    return {
      metaTypeCode: f.metaTypeCode.trim(),
      metaTypeName: f.metaTypeName.trim(),
    };
  }

  private toUpdateMetaTypeDto(f: MetaType): UpdateMetaTypeDto {
    return {
      metaTypeCode: f.metaTypeCode.trim(),
      metaTypeName: f.metaTypeName.trim(),
    };
  }

  private saveMetaTypeAdd(): void {
    this.metaTypeService.create(this.toCreateMetaTypeDto(this.metaTypeFormData)).subscribe({
      next: (res: any) => {
        const added = this.mapMetaType(res?.data ?? res ?? this.metaTypeFormData);
        this.metaTypes = [...this.metaTypes, added];
        this.metaTypeTotalRecords++;
        this.metaTypeDialogVisible = false;
        this.metaTypeSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Meta Type Added',
          detail: `"${added.metaTypeName}" was added successfully.`
        });
      },
      error: () => {
        this.metaTypeSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not add meta type.' });
      }
    });
  }

  private saveMetaTypeEdit(): void {
    this.metaTypeService
      .update(this.metaTypeFormData.metaTypeId, this.toUpdateMetaTypeDto(this.metaTypeFormData))
      .subscribe({
        next: () => {
          const idx = this.metaTypes.findIndex(t => t.metaTypeId === this.metaTypeFormData.metaTypeId);
          if (idx !== -1) {
            this.metaTypes = [
              ...this.metaTypes.slice(0, idx),
              { ...this.metaTypeFormData },
              ...this.metaTypes.slice(idx + 1)
            ];
          }
          if (this.selectedMetaType?.metaTypeId === this.metaTypeFormData.metaTypeId) {
            this.selectedMetaType = { ...this.metaTypeFormData };
          }
          this.metaTypeDialogVisible = false;
          this.metaTypeSaving = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Meta Type Updated',
            detail: `"${this.metaTypeFormData.metaTypeName}" was updated successfully.`
          });
        },
        error: () => {
          this.metaTypeSaving = false;
          this.messageService.add({ severity: 'error', summary: 'Update Failed', detail: 'Could not update meta type.' });
        }
      });
  }

  confirmMetaTypeDelete(item: MetaType, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${item.metaTypeName}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeMetaTypeDelete(item)
    });
  }

  onMetaTypeDeleteSelected(event: Event): void {
    if (this.selectedMetaType) this.confirmMetaTypeDelete(this.selectedMetaType, event);
  }

  private executeMetaTypeDelete(item: MetaType): void {
    this.metaTypeService.delete(item.metaTypeId).subscribe({
      next: () => {
        this.metaTypes = this.metaTypes.filter(t => t.metaTypeId !== item.metaTypeId);
        if (this.selectedMetaType?.metaTypeId === item.metaTypeId) {
          this.selectedMetaType = null;
          this.clearMetaPanel();
        }
        this.metaTypeTotalRecords--;
        this.messageService.add({
          severity: 'success',
          summary: 'Meta Type Deleted',
          detail: `"${item.metaTypeName}" was deleted.`
        });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete meta type.' });
      }
    });
  }

  // â”€â”€â”€ Meta: load â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  loadMetas(search = ''): void {
    if (!this.selectedMetaType) return;

    this.metaLoading = true;
    this.metaService.getAll({
      metaTypeId: this.selectedMetaType.metaTypeId,
      search,
      pageSize: 200
    }).subscribe({
      next: (res: any) => {
        const raw: any[] = this.extractItems(res);
        this.metas = raw.map(x => this.mapMeta(x));
        this.metaTotalRecords = res?.totalCount ?? this.metas.length;
        this.metaLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.metaLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load metas.'
        });
      }
    });
  }

  private mapMeta(x: any): Meta {
    return {
      metaId:     x.metaId ?? x.id ?? 0,
      metaName:   x.metaName ?? '',
      metaTypeId: x.metaTypeId != null ? Number(x.metaTypeId) : null,
      createdDate:    x.createdDate  ? new Date(x.createdDate)  : null,
      modifiedDate:   x.modifiedDate ? new Date(x.modifiedDate) : null,
    };
  }

  private extractItems(res: any): any[] {
    return Array.isArray(res)
      ? res
      : Array.isArray(res?.items) ? res.items
      : Array.isArray(res?.data)  ? res.data
      : [];
  }

  private clearMetaPanel(): void {
    this.metas = [];
    this.selectedMeta = null;
    this.metaTotalRecords = 0;
  }

  onMetaSearchChange(): void {
    this.metaSearch$.next(this.metaSearchTerm);
  }

  onClearMetaSearch(): void {
    this.metaSearchTerm = '';
    this.loadMetas();
  }

  // â”€â”€â”€ Meta: dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  openMetaAddDialog(): void {
    if (!this.selectedMetaType) return;
    this.metaDialogMode = 'add';
    this.metaFormData   = emptyMetaForm(this.selectedMetaType.metaTypeId);
    this.metaFormErrors = {};
    this.metaDialogVisible = true;
  }

  openMetaEditDialog(item: Meta): void {
    this.metaDialogMode = 'edit';
    this.metaFormData   = { ...item };
    this.metaFormErrors = {};
    this.metaDialogVisible = true;
  }

  onMetaEditSelected(): void {
    if (this.selectedMeta) this.openMetaEditDialog(this.selectedMeta);
  }

  onMetaDialogHide(): void {
    this.metaFormErrors = {};
    this.metaSaving = false;
  }

  private validateMeta(): boolean {
    this.metaFormErrors = {};
    if (!this.metaFormData.metaName?.trim()) {
      this.metaFormErrors.metaName = 'Meta name is required';
    }
    return Object.keys(this.metaFormErrors).length === 0;
  }

  onMetaSave(): void {
    if (!this.validateMeta()) return;
    this.metaSaving = true;
    this.metaDialogMode === 'add' ? this.saveMetaAdd() : this.saveMetaEdit();
  }

  private toCreateMetaDto(f: Meta): CreateMetaDto {
    return {
      metaName:   f.metaName.trim(),
      metaTypeId: f.metaTypeId,
    };
  }

  private toUpdateMetaDto(f: Meta): UpdateMetaDto {
    return {
      metaName:   f.metaName.trim(),
      metaTypeId: f.metaTypeId,
    };
  }

  private saveMetaAdd(): void {
    this.metaService.create(this.toCreateMetaDto(this.metaFormData)).subscribe({
      next: (res: any) => {
        const added = this.mapMeta(res?.data ?? res ?? this.metaFormData);
        this.metas = [...this.metas, added];
        this.metaTotalRecords++;
        this.metaDialogVisible = false;
        this.metaSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Meta Added',
          detail: `"${added.metaName}" was added successfully.`
        });
      },
      error: () => {
        this.metaSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not add meta.' });
      }
    });
  }

  private saveMetaEdit(): void {
    this.metaService
      .update(this.metaFormData.metaId, this.toUpdateMetaDto(this.metaFormData))
      .subscribe({
        next: () => {
          const idx = this.metas.findIndex(c => c.metaId === this.metaFormData.metaId);
          if (idx !== -1) {
            this.metas = [
              ...this.metas.slice(0, idx),
              { ...this.metaFormData },
              ...this.metas.slice(idx + 1)
            ];
          }
          if (this.selectedMeta?.metaId === this.metaFormData.metaId) {
            this.selectedMeta = { ...this.metaFormData };
          }
          this.metaDialogVisible = false;
          this.metaSaving = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Meta Updated',
            detail: `"${this.metaFormData.metaName}" was updated successfully.`
          });
        },
        error: () => {
          this.metaSaving = false;
          this.messageService.add({ severity: 'error', summary: 'Update Failed', detail: 'Could not update meta.' });
        }
      });
  }

  confirmMetaDelete(item: Meta, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${item.metaName}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeMetaDelete(item)
    });
  }

  onMetaDeleteSelected(event: Event): void {
    if (this.selectedMeta) this.confirmMetaDelete(this.selectedMeta, event);
  }

  private executeMetaDelete(item: Meta): void {
    this.metaService.delete(item.metaId).subscribe({
      next: () => {
        this.metas = this.metas.filter(c => c.metaId !== item.metaId);
        if (this.selectedMeta?.metaId === item.metaId) {
          this.selectedMeta = null;
        }
        this.metaTotalRecords--;
        this.messageService.add({
          severity: 'success',
          summary: 'Meta Deleted',
          detail: `"${item.metaName}" was deleted.`
        });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete meta.' });
      }
    });
  }

  get metaTypesReportConfig(): GridReportConfig {
    return {
      title: 'Meta Types',
      subtitle: this.hasMetaTypeSearch ? `Search: ${this.metaTypeSearchTerm}` : undefined,
      fileName: 'meta_types',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Code', field: 'metaTypeCode' },
        { header: 'Name', field: 'metaTypeName' }
      ],
      rows: this.metaTypes.map(t => ({
        metaTypeCode: t.metaTypeCode,
        metaTypeName: t.metaTypeName
      }))
    };
  }

  get metasReportConfig(): GridReportConfig {
    const type = this.selectedMetaType;
    return {
      title: 'Metas',
      subtitle: type
        ? `Type: ${type.metaTypeName || type.metaTypeCode}`
        : undefined,
      fileName: type ? `metas_${type.metaTypeId}` : 'metas',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Name', field: 'metaName' }
      ],
      rows: this.metas.map(c => ({ metaName: c.metaName }))
    };
  }
}
