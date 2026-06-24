import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent, formatYesNo } from '../../common/grid-report';
import { MetaService } from '../../services/meta.service';
import {
  CreateCustomFieldDto,
  CustomField,
  CustomFieldService,
  UpdateCustomFieldDto
} from '../../services/custom-field.service';
import {
  CreateCustomFieldValueDto,
  CustomFieldValue,
  CustomFieldValueService,
  UpdateCustomFieldValueDto
} from '../../services/custom-field-value.service';

type DialogMode = 'add' | 'edit';

interface SelectOption<T = number> {
  label: string;
  value: T;
}

interface FieldFormErrors {
  entityTypeId?: string;
  fieldTypeId?:  string;
  fieldKey?:     string;
  label?:        string;
}

interface ValueFormErrors {
  entityId?: string;
}

const ENTITY_TYPE_CODES = ['CUSTOM_FIELD_ENTITY', 'ENTITY_TYPE'] as const;
const FIELD_TYPE_CODES  = ['CUSTOM_FIELD_TYPE', 'FIELD_TYPE'] as const;

function emptyFieldForm(entityTypeId: number | null = null): CustomField {
  return {
    customFieldId: 0,
    entityTypeId:  entityTypeId,
    fieldTypeId:   0,
    fieldKey:      '',
    label:         '',
    optionsJson:   null,
    sortOrder:     0,
    isRequired:    false,
    isActive:      true,
  };
}

function emptyValueForm(customFieldId: number | null = null): CustomFieldValue {
  return {
    customFieldValueId: 0,
    customFieldId:      customFieldId ?? 0,
    entityId:           0,
    valueText:          '',
  };
}

@Component({
  selector: 'app-custom-field',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './custom-field.component.html',
  styleUrls: ['./custom-field.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class CustomFieldComponent implements OnInit, OnDestroy {

  customFields: CustomField[] = [];
  selectedField: CustomField | null = null;
  fieldLoading = false;
  fieldTotalRecords = 0;
  fieldSearchTerm = '';
  filterEntityTypeId: number | null = null;
  private fieldSearch$ = new Subject<string>();

  fieldDialogVisible = false;
  fieldDialogMode: DialogMode = 'add';
  fieldFormData: CustomField = emptyFieldForm();
  fieldFormErrors: FieldFormErrors = {};
  fieldSaving = false;

  values: CustomFieldValue[] = [];
  selectedValue: CustomFieldValue | null = null;
  valueLoading = false;
  valueTotalRecords = 0;
  valueSearchTerm = '';
  private valueSearch$ = new Subject<string>();

  valueDialogVisible = false;
  valueDialogMode: DialogMode = 'add';
  valueFormData: CustomFieldValue = emptyValueForm();
  valueFormErrors: ValueFormErrors = {};
  valueSaving = false;

  entityTypeOptions: SelectOption[] = [];
  fieldTypeOptions: SelectOption[] = [];
  private fieldTypeNameMap = new Map<number, string>();

  private destroy$ = new Subject<void>();

  constructor(
    private customFieldService: CustomFieldService,
    private customFieldValueService: CustomFieldValueService,
    private metaService: MetaService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fieldSearch$.pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => this.loadCustomFields(term));
    this.valueSearch$.pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => this.loadValues(term));

    this.loadLookups();
    this.loadCustomFields();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get fieldDialogTitle(): string {
    return this.fieldDialogMode === 'add' ? 'Add Custom Field' : 'Edit Custom Field';
  }

  get valueDialogTitle(): string {
    return this.valueDialogMode === 'add' ? 'Add Field Value' : 'Edit Field Value';
  }

  get hasFieldSearch(): boolean {
    return !!this.fieldSearchTerm.trim() || this.filterEntityTypeId != null;
  }

  get hasValueSearch(): boolean {
    return !!this.valueSearchTerm.trim();
  }

  get hasSelectedField(): boolean {
    return this.selectedField != null;
  }

  get showOptionsJson(): boolean {
    const name = this.fieldTypeNameMap.get(this.fieldFormData.fieldTypeId) ?? '';
    return name.toLowerCase().includes('dropdown') || name.toLowerCase().includes('select');
  }

  loadLookups(): void {
    this.loadEntityTypes();
    this.loadFieldTypes();
  }

  private loadEntityTypes(): void {
    const tryLoad = (index: number) => {
      if (index >= ENTITY_TYPE_CODES.length) return;
      this.metaService.getByMetaTypeCode(ENTITY_TYPE_CODES[index]).subscribe({
        next: (res) => {
          const items = this.extractItems(res);
          if (items.length > 0) {
            this.bindEntityTypes(items);
            this.cdr.detectChanges();
          } else {
            tryLoad(index + 1);
          }
        },
        error: () => tryLoad(index + 1)
      });
    };
    tryLoad(0);
  }

  private loadFieldTypes(): void {
    const tryLoad = (index: number) => {
      if (index >= FIELD_TYPE_CODES.length) {
        this.messageService.add({ severity: 'warn', summary: 'Lookups', detail: 'Could not load field type metas.' });
        return;
      }
      this.metaService.getByMetaTypeCode(FIELD_TYPE_CODES[index]).subscribe({
        next: (res) => {
          const items = this.extractItems(res);
          if (items.length > 0) {
            this.bindFieldTypes(items);
            this.cdr.detectChanges();
          } else {
            tryLoad(index + 1);
          }
        },
        error: () => tryLoad(index + 1)
      });
    };
    tryLoad(0);
  }

  private bindEntityTypes(res: any): void {
    const list = this.extractItems(res);
    this.entityTypeOptions = list.map((c: any) => ({
      label: c.metaName ?? c.categoryName ?? '',
      value: c.metaId ?? c.categoryId ?? c.id ?? 0,
    })).filter(o => o.value > 0);
  }

  private bindFieldTypes(res: any): void {
    const list = this.extractItems(res);
    this.fieldTypeNameMap.clear();
    this.fieldTypeOptions = list.map((c: any) => {
      const id = c.metaId ?? c.categoryId ?? c.id ?? 0;
      const name = c.metaName ?? c.categoryName ?? '';
      this.fieldTypeNameMap.set(id, name);
      return { label: name, value: id };
    }).filter(o => o.value > 0);
  }

  loadCustomFields(search = ''): void {
    this.fieldLoading = true;
    this.customFieldService.getAll({
      entityTypeId: this.filterEntityTypeId ?? undefined,
      search,
      pageSize: 200,
    }).subscribe({
      next: (res: any) => {
        const raw = this.extractItems(res);
        this.customFields = raw.map((x: any) => this.mapField(x));
        this.fieldTotalRecords = res?.totalCount ?? this.customFields.length;
        this.fieldLoading = false;

        if (this.selectedField) {
          const still = this.customFields.find(f => f.customFieldId === this.selectedField!.customFieldId);
          if (still) {
            this.selectedField = still;
            this.loadValues(this.valueSearchTerm);
          } else {
            this.clearValuePanel();
          }
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.fieldLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load custom fields.' });
      }
    });
  }

  private mapField(x: any): CustomField {
    return {
      customFieldId:  Number(x.customFieldId ?? x.id ?? 0),
      entityTypeId:   Number(x.entityTypeId ?? 0),
      entityTypeName: x.entityTypeName ?? '',
      fieldTypeId:    Number(x.fieldTypeId ?? 0),
      fieldTypeName:  x.fieldTypeName ?? '',
      fieldKey:       x.fieldKey ?? '',
      label:          x.label ?? '',
      optionsJson:    x.optionsJson ?? null,
      sortOrder:      Number(x.sortOrder ?? 0),
      isRequired:     !!x.isRequired,
      isActive:       x.isActive !== false,
    };
  }

  loadValues(search = ''): void {
    if (!this.selectedField) return;
    this.valueLoading = true;
    this.customFieldValueService.getAll({
      customFieldId: this.selectedField.customFieldId,
      search,
      pageSize: 200,
    }).subscribe({
      next: (res: any) => {
        const raw = this.extractItems(res);
        this.values = raw.map((x: any) => this.mapValue(x));
        this.valueTotalRecords = res?.totalCount ?? this.values.length;
        this.valueLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.valueLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load field values.' });
      }
    });
  }

  private mapValue(x: any): CustomFieldValue {
    return {
      customFieldValueId: Number(x.customFieldValueId ?? x.id ?? 0),
      customFieldId:      Number(x.customFieldId ?? 0),
      fieldKey:           x.fieldKey ?? '',
      fieldLabel:         x.fieldLabel ?? '',
      entityId:           Number(x.entityId ?? 0),
      valueText:          x.valueText ?? '',
    };
  }

  private extractItems(res: any): any[] {
    return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
  }

  onFieldSearchChange(): void { this.fieldSearch$.next(this.fieldSearchTerm); }
  onEntityTypeFilterChange(): void { this.loadCustomFields(this.fieldSearchTerm); }
  onClearFieldSearch(): void {
    this.fieldSearchTerm = '';
    this.filterEntityTypeId = null;
    this.loadCustomFields();
  }

  onFieldSelect(): void {
    this.selectedValue = null;
    this.valueSearchTerm = '';
    if (this.selectedField) this.loadValues();
    else this.clearValuePanel();
  }

  private clearValuePanel(): void {
    this.values = [];
    this.selectedValue = null;
    this.valueTotalRecords = 0;
  }

  onValueSearchChange(): void { this.valueSearch$.next(this.valueSearchTerm); }
  onClearValueSearch(): void { this.valueSearchTerm = ''; this.loadValues(); }

  openFieldAddDialog(): void {
    this.fieldDialogMode = 'add';
    this.fieldFormData = emptyFieldForm(this.filterEntityTypeId);
    this.fieldFormErrors = {};
    this.fieldDialogVisible = true;
  }

  openFieldEditDialog(item: CustomField): void {
    this.fieldDialogMode = 'edit';
    this.fieldFormData = { ...item };
    this.fieldFormErrors = {};
    this.fieldDialogVisible = true;
  }

  onFieldEditSelected(): void {
    if (this.selectedField) this.openFieldEditDialog(this.selectedField);
  }

  onFieldDialogHide(): void { this.fieldFormErrors = {}; this.fieldSaving = false; }

  private validateField(): boolean {
    this.fieldFormErrors = {};
    if (!this.fieldFormData.entityTypeId) this.fieldFormErrors.entityTypeId = 'Entity type is required';
    if (!this.fieldFormData.fieldTypeId)  this.fieldFormErrors.fieldTypeId = 'Field type is required';
    if (!this.fieldFormData.fieldKey?.trim()) this.fieldFormErrors.fieldKey = 'Field key is required';
    if (!this.fieldFormData.label?.trim())    this.fieldFormErrors.label = 'Label is required';
    return Object.keys(this.fieldFormErrors).length === 0;
  }

  onFieldSave(): void {
    if (!this.validateField()) return;
    this.fieldSaving = true;
    this.fieldDialogMode === 'add' ? this.saveFieldAdd() : this.saveFieldEdit();
  }

  private toCreateFieldDto(f: CustomField): CreateCustomFieldDto {
    return {
      entityTypeId: f.entityTypeId!,
      fieldTypeId:  f.fieldTypeId,
      fieldKey:     f.fieldKey.trim(),
      label:        f.label.trim(),
      optionsJson:  f.optionsJson?.trim() || null,
      sortOrder:    f.sortOrder ?? 0,
      isRequired:   f.isRequired,
      isActive:     f.isActive,
      createdBy:    null,
    };
  }

  private toUpdateFieldDto(f: CustomField): UpdateCustomFieldDto {
    return {
      entityTypeId: f.entityTypeId!,
      fieldTypeId:  f.fieldTypeId,
      fieldKey:     f.fieldKey.trim(),
      label:        f.label.trim(),
      optionsJson:  f.optionsJson?.trim() || null,
      sortOrder:    f.sortOrder ?? 0,
      isRequired:   f.isRequired,
      isActive:     f.isActive,
      modifiedBy:   null,
    };
  }

  private saveFieldAdd(): void {
    this.customFieldService.create(this.toCreateFieldDto(this.fieldFormData)).subscribe({
      next: (res: any) => {
        const added = this.mapField(res?.data ?? res ?? this.fieldFormData);
        this.customFields = [...this.customFields, added];
        this.fieldTotalRecords++;
        this.fieldDialogVisible = false;
        this.fieldSaving = false;
        this.messageService.add({ severity: 'success', summary: 'Field Added', detail: `"${added.label}" was added.` });
      },
      error: () => {
        this.fieldSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not add custom field.' });
      }
    });
  }

  private saveFieldEdit(): void {
    this.customFieldService.update(this.fieldFormData.customFieldId, this.toUpdateFieldDto(this.fieldFormData)).subscribe({
      next: () => {
        const idx = this.customFields.findIndex(f => f.customFieldId === this.fieldFormData.customFieldId);
        if (idx !== -1) {
          this.customFields = [...this.customFields.slice(0, idx), { ...this.fieldFormData }, ...this.customFields.slice(idx + 1)];
        }
        if (this.selectedField?.customFieldId === this.fieldFormData.customFieldId) {
          this.selectedField = { ...this.fieldFormData };
        }
        this.fieldDialogVisible = false;
        this.fieldSaving = false;
        this.messageService.add({ severity: 'success', summary: 'Field Updated', detail: 'Custom field updated.' });
      },
      error: () => {
        this.fieldSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Update Failed', detail: 'Could not update custom field.' });
      }
    });
  }

  confirmFieldDelete(item: CustomField, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete field "<strong>${item.label}</strong>"? All values for this field will also be removed.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeFieldDelete(item)
    });
  }

  onFieldDeleteSelected(event: Event): void {
    if (this.selectedField) this.confirmFieldDelete(this.selectedField, event);
  }

  private executeFieldDelete(item: CustomField): void {
    this.customFieldService.delete(item.customFieldId).subscribe({
      next: () => {
        this.customFields = this.customFields.filter(f => f.customFieldId !== item.customFieldId);
        if (this.selectedField?.customFieldId === item.customFieldId) {
          this.selectedField = null;
          this.clearValuePanel();
        }
        this.fieldTotalRecords--;
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Custom field deleted.' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete custom field.' });
      }
    });
  }

  openValueAddDialog(): void {
    if (!this.selectedField) return;
    this.valueDialogMode = 'add';
    this.valueFormData = emptyValueForm(this.selectedField.customFieldId);
    this.valueFormErrors = {};
    this.valueDialogVisible = true;
  }

  openValueEditDialog(item: CustomFieldValue): void {
    this.valueDialogMode = 'edit';
    this.valueFormData = { ...item };
    this.valueFormErrors = {};
    this.valueDialogVisible = true;
  }

  onValueEditSelected(): void {
    if (this.selectedValue) this.openValueEditDialog(this.selectedValue);
  }

  onValueDialogHide(): void { this.valueFormErrors = {}; this.valueSaving = false; }

  private validateValue(): boolean {
    this.valueFormErrors = {};
    if (!this.valueFormData.entityId || this.valueFormData.entityId <= 0) {
      this.valueFormErrors.entityId = 'Entity ID is required';
    }
    return Object.keys(this.valueFormErrors).length === 0;
  }

  onValueSave(): void {
    if (!this.validateValue()) return;
    this.valueSaving = true;
    this.valueDialogMode === 'add' ? this.saveValueAdd() : this.saveValueEdit();
  }

  private toCreateValueDto(f: CustomFieldValue): CreateCustomFieldValueDto {
    return {
      customFieldId: f.customFieldId,
      entityId:      f.entityId,
      valueText:     f.valueText?.trim() || null,
      createdBy:     null,
    };
  }

  private toUpdateValueDto(f: CustomFieldValue): UpdateCustomFieldValueDto {
    return {
      customFieldId: f.customFieldId,
      entityId:      f.entityId,
      valueText:     f.valueText?.trim() || null,
      modifiedBy:    null,
    };
  }

  private saveValueAdd(): void {
    this.customFieldValueService.create(this.toCreateValueDto(this.valueFormData)).subscribe({
      next: (res: any) => {
        const added = this.mapValue(res?.data ?? res ?? this.valueFormData);
        this.values = [...this.values, added];
        this.valueTotalRecords++;
        this.valueDialogVisible = false;
        this.valueSaving = false;
        this.messageService.add({ severity: 'success', summary: 'Value Added', detail: 'Field value added.' });
      },
      error: () => {
        this.valueSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not add field value.' });
      }
    });
  }

  private saveValueEdit(): void {
    this.customFieldValueService.update(this.valueFormData.customFieldValueId, this.toUpdateValueDto(this.valueFormData)).subscribe({
      next: () => {
        const idx = this.values.findIndex(v => v.customFieldValueId === this.valueFormData.customFieldValueId);
        if (idx !== -1) {
          this.values = [...this.values.slice(0, idx), { ...this.valueFormData }, ...this.values.slice(idx + 1)];
        }
        if (this.selectedValue?.customFieldValueId === this.valueFormData.customFieldValueId) {
          this.selectedValue = { ...this.valueFormData };
        }
        this.valueDialogVisible = false;
        this.valueSaving = false;
        this.messageService.add({ severity: 'success', summary: 'Value Updated', detail: 'Field value updated.' });
      },
      error: () => {
        this.valueSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Update Failed', detail: 'Could not update field value.' });
      }
    });
  }

  confirmValueDelete(item: CustomFieldValue, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Delete this field value?',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeValueDelete(item)
    });
  }

  onValueDeleteSelected(event: Event): void {
    if (this.selectedValue) this.confirmValueDelete(this.selectedValue, event);
  }

  private executeValueDelete(item: CustomFieldValue): void {
    this.customFieldValueService.delete(item.customFieldValueId).subscribe({
      next: () => {
        this.values = this.values.filter(v => v.customFieldValueId !== item.customFieldValueId);
        if (this.selectedValue?.customFieldValueId === item.customFieldValueId) {
          this.selectedValue = null;
        }
        this.valueTotalRecords--;
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Field value deleted.' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete field value.' });
      }
    });
  }

  get customFieldsReportConfig(): GridReportConfig {
    const parts: string[] = [];
    if (this.filterEntityTypeId != null) {
      const opt = this.entityTypeOptions.find(o => o.value === this.filterEntityTypeId);
      if (opt) parts.push(`Entity: ${opt.label}`);
    }
    if (this.hasFieldSearch) parts.push(`Search: ${this.fieldSearchTerm}`);
    return {
      title: 'Custom Fields',
      subtitle: parts.length ? parts.join(' | ') : undefined,
      fileName: 'custom_fields',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Key', field: 'fieldKey' },
        { header: 'Label', field: 'label' },
        { header: 'Entity', field: 'entityTypeName' },
        { header: 'Type', field: 'fieldTypeName' },
        { header: 'Active', field: 'isActive', format: (v) => formatYesNo(v) }
      ],
      rows: this.customFields.map(f => ({
        fieldKey: f.fieldKey,
        label: f.label,
        entityTypeName: f.entityTypeName,
        fieldTypeName: f.fieldTypeName,
        isActive: f.isActive
      }))
    };
  }

  get customFieldValuesReportConfig(): GridReportConfig {
    const field = this.selectedField;
    return {
      title: 'Custom Field Values',
      subtitle: field
        ? `Field: ${field.label || field.fieldKey} (${field.entityTypeName ?? ''})`
        : undefined,
      fileName: field ? `custom_field_values_${field.customFieldId}` : 'custom_field_values',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Entity ID', field: 'entityId', align: 'right' },
        { header: 'Value', field: 'valueText' }
      ],
      rows: this.values.map(v => ({
        entityId: v.entityId,
        valueText: v.valueText
      }))
    };
  }
}
