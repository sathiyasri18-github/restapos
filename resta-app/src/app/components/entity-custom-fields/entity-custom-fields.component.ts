import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AppModule } from '../../module/app.module';
import {
  CustomFieldService,
  EntityCustomFieldFormEntry,
  EntityCustomFieldKind,
  EntityCustomFieldItem
} from '../../services/custom-field.service';

@Component({
  selector: 'app-entity-custom-fields',
  imports: [AppModule],
  templateUrl: './entity-custom-fields.component.html',
  styleUrls: ['./entity-custom-fields.component.scss'],
})
export class EntityCustomFieldsComponent implements OnChanges {
  @Input({ required: true }) entityType!: EntityCustomFieldKind;
  @Input() entityId = 0;

  fields: EntityCustomFieldFormEntry[] = [];
  fieldErrors: Record<number, string> = {};
  loading = false;
  hasFields = false;

  constructor(
    private customFieldService: CustomFieldService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entityType'] || changes['entityId']) {
      this.load();
    }
  }

  load(): void {
    if (!this.entityType) return;
    this.loading = true;
    this.fieldErrors = {};
    this.customFieldService.getForEntity(this.entityType, this.entityId).subscribe({
      next: (res: any) => {
        const raw: EntityCustomFieldItem[] = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
        this.fields = raw.map(x => this.mapField(x));
        this.hasFields = this.fields.length > 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.fields = [];
        this.hasFields = false;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private mapField(x: any): EntityCustomFieldFormEntry {
    const entry: EntityCustomFieldFormEntry = {
      customFieldId:      Number(x.customFieldId ?? 0),
      fieldKey:           x.fieldKey ?? '',
      label:              x.label ?? '',
      fieldTypeId:        Number(x.fieldTypeId ?? 0),
      fieldTypeName:      x.fieldTypeName ?? '',
      optionsJson:        x.optionsJson ?? null,
      sortOrder:          Number(x.sortOrder ?? 0),
      isRequired:         !!x.isRequired,
      customFieldValueId: x.customFieldValueId != null ? Number(x.customFieldValueId) : null,
      valueText:          x.valueText ?? '',
    };
    if (this.isDropdown(entry)) {
      entry.dropdownOptions = this.parseOptions(entry.optionsJson).map(o => ({ label: o, value: o }));
    }
    return entry;
  }

  isDropdown(f: EntityCustomFieldFormEntry): boolean {
    const t = (f.fieldTypeName ?? '').toLowerCase();
    return t.includes('dropdown') || t.includes('select') || t.includes('list');
  }

  isDate(f: EntityCustomFieldFormEntry): boolean {
    return (f.fieldTypeName ?? '').toLowerCase().includes('date');
  }

  isNumber(f: EntityCustomFieldFormEntry): boolean {
    const t = (f.fieldTypeName ?? '').toLowerCase();
    return t.includes('number') || t.includes('numeric') || t.includes('decimal');
  }

  private parseOptions(json: string | null): string[] {
    if (!json?.trim()) return [];
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }

  clearFieldError(fieldId: number): void {
    delete this.fieldErrors[fieldId];
  }

  validate(): boolean {
    this.fieldErrors = {};
    for (const f of this.fields) {
      if (f.isRequired && !f.valueText?.trim()) {
        this.fieldErrors[f.customFieldId] = `${f.label} is required`;
      }
    }
    return Object.keys(this.fieldErrors).length === 0;
  }

  saveValues(entityId: number): Observable<unknown> {
    if (!this.hasFields) return of(null);
    return this.customFieldService.upsertForEntity(
      this.entityType,
      entityId,
      this.fields.map(f => ({
        customFieldId: f.customFieldId,
        valueText:     f.valueText?.trim() || null,
      }))
    );
  }

  reset(): void {
    this.fields = [];
    this.fieldErrors = {};
    this.hasFields = false;
  }
}
