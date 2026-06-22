import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent } from '../../common/grid-report';
import { UnitService } from '../../services/unit.service';
import { Unit } from '../../services/unit.service';

type DialogMode = 'add' | 'edit';

interface FormErrors {
  name?: string;
}

@Component({
  selector: 'app-unit',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './unit.component.html',
  styleUrls: ['./unit.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class UnitComponent implements OnInit {

  units: Unit[] = [];
  filteredUnits: Unit[] = [];

  isLoading = false;

  searchName = '';
  searchDescription = '';

  dialogVisible = false;
  dialogMode: DialogMode = 'add';

  selectedUnit: Unit | null = null;

  formUnit: Unit = { id: 0, name: '', description: '' };
  formErrors: FormErrors = {};

  constructor(
    private unitService: UnitService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUnits();
  }

  // ─── Derived state ────────────────────────────────────────────────────────

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Unit' : 'Edit Unit';
  }

  get hasActiveSearch(): boolean {
    return !!this.searchName || !!this.searchDescription;
  }

  // ─── Data loading ─────────────────────────────────────────────────────────

  loadUnits(): void {
    this.isLoading = true;
    this.unitService.getUnits().subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res) ? res : (res?.items ?? []);
        this.units = raw.map((x: any) => ({
          id: x.unitId ?? x.id,
          name: x.name ?? '',
          description: x.description ?? ''
        }));
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load units. Please try again.'
        });
      }
    });
  }

  // ─── Search ───────────────────────────────────────────────────────────────

  onSearch(): void {
    this.applyFilter();
  }

  onClearSearch(): void {
    this.searchName = '';
    this.searchDescription = '';
    this.applyFilter();
  }

  private applyFilter(): void {
    const name = this.searchName.trim().toLowerCase();
    const desc = this.searchDescription.trim().toLowerCase();
    this.filteredUnits = this.units.filter(u =>
      u.name.toLowerCase().includes(name) &&
      (u.description ?? '').toLowerCase().includes(desc)
    );
  }

  // ─── Dialog open ──────────────────────────────────────────────────────────

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formUnit = { id: 0, name: '', description: '' };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(unit: Unit): void {
    this.dialogMode = 'edit';
    this.formUnit = { ...unit };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedUnit) {
      this.openEditDialog(this.selectedUnit);
    }
  }

  onDialogHide(): void {
    this.formErrors = {};
  }

  // ─── Validation ───────────────────────────────────────────────────────────

  private validateForm(): boolean {
    this.formErrors = {};
    if (!this.formUnit.name?.trim()) {
      this.formErrors.name = 'Name is required';
    }
    return Object.keys(this.formErrors).length === 0;
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  onSave(): void {
    if (!this.validateForm()) return;
    if (this.dialogMode === 'add') {
      this.saveAdd();
    } else {
      this.saveEdit();
    }
  }

  private saveAdd(): void {
    this.unitService.createUnit(this.formUnit).subscribe({
      next: (res: any) => {
        const added: Unit = {
          id: res?.unitId ?? res?.id,
          name: res?.name ?? this.formUnit.name,
          description: res?.description ?? this.formUnit.description ?? ''
        };
        this.units = [...this.units, added];
        this.applyFilter();
        this.dialogVisible = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Unit Added',
          detail: `"${added.name}" was added successfully.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not add unit. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.unitService.updateUnit(this.formUnit).subscribe({
      next: () => {
        const index = this.units.findIndex(x => x.id === this.formUnit.id);
        if (index !== -1) {
          this.units = [
            ...this.units.slice(0, index),
            { ...this.formUnit },
            ...this.units.slice(index + 1)
          ];
        }
        if (this.selectedUnit?.id === this.formUnit.id) {
          this.selectedUnit = { ...this.formUnit };
        }
        this.applyFilter();
        this.dialogVisible = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Unit Updated',
          detail: `"${this.formUnit.name}" was updated successfully.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Could not update unit. Please try again.'
        });
      }
    });
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  confirmDelete(unit: Unit, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${unit.name}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.executeDelete(unit)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedUnit) {
      this.confirmDelete(this.selectedUnit, event);
    }
  }

  private executeDelete(unit: Unit): void {
    this.unitService.deleteUnit(unit.id).subscribe({
      next: () => {
        this.units = this.units.filter(x => x.id !== unit.id);
        if (this.selectedUnit?.id === unit.id) {
          this.selectedUnit = null;
        }
        this.applyFilter();
        this.messageService.add({
          severity: 'success',
          summary: 'Unit Deleted',
          detail: `"${unit.name}" was deleted.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete unit. Please try again.'
        });
      }
    });
  }

  // ─── Toolbar actions ──────────────────────────────────────────────────────

  get unitReportConfig(): GridReportConfig {
    return {
      title: 'Unit List',
      subtitle: this.hasActiveSearch
        ? `Name: ${this.searchName || '—'} | Description: ${this.searchDescription || '—'}`
        : undefined,
      fileName: 'units',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Name', field: 'name' },
        { header: 'Description', field: 'description' }
      ],
      rows: this.units.map(u => ({ name: u.name, description: u.description }))
    };
  }
}
