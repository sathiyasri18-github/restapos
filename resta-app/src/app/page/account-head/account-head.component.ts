// account-head.component.ts

import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent } from '../../common/grid-report';
import {
  AccountHead,
  AccountHeadService,
  CreateAccountHeadDto,
  UpdateAccountHeadDto
} from '../../services/account-head.service';

type DialogMode = 'add' | 'edit';

interface FormErrors {
  name?:    string;
  phoneNo?: string;
  email?:   string;
}

function emptyForm(): AccountHead {
  return {
    accountHeadId: 0,
    name:          '',
    address:       '',
    city:          '',
    state:         '',
    phoneNo:       '',
    email:         '',
    faxNo:         '',
    cellNo:        '',
    remarks:       '',
  };
}

@Component({
  selector: 'app-account-head',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './account-head.component.html',
  styleUrls: ['./account-head.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class AccountHeadComponent implements OnInit, OnDestroy {

  // ─── Grid state ─────────────────────────────────────────────────────────────
  accountHeads: AccountHead[] = [];
  selectedAccountHead: AccountHead | null = null;
  isLoading = false;
  totalRecords = 0;

  // ─── Search ─────────────────────────────────────────────────────────────────
  searchTerm = '';
  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  // ─── Dialog state ───────────────────────────────────────────────────────────
  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: AccountHead = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  constructor(
    private accountHeadService: AccountHeadService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => this.loadAccountHeads(term));

    this.loadAccountHeads();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Derived ─────────────────────────────────────────────────────────────────

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Account Head' : 'Edit Account Head';
  }

  get hasActiveSearch(): boolean {
    return !!this.searchTerm.trim();
  }

  // ─── Load ────────────────────────────────────────────────────────────────────

  loadAccountHeads(search = ''): void {
    this.isLoading = true;
    this.accountHeadService.getAll({ search, pageSize: 200 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items) ? res.items
          : Array.isArray(res?.data)  ? res.data
          : [];
        this.accountHeads = raw.map(x => this.mapAccountHead(x));
        this.totalRecords = res?.totalCount ?? this.accountHeads.length;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load account heads. Please try again.'
        });
      }
    });
  }

  private mapAccountHead(x: any): AccountHead {
    return {
      accountHeadId: x.accountHeadId ?? x.id ?? 0,
      name:          x.name ?? '',
      address:       x.address ?? '',
      city:          x.city ?? '',
      state:         x.state ?? '',
      phoneNo:       x.phoneNo ?? '',
      email:         x.email ?? '',
      faxNo:         x.faxNo ?? '',
      cellNo:        x.cellNo ?? '',
      remarks:       x.remarks ?? '',
      createdDate:   x.createdDate ? new Date(x.createdDate) : null,
      createdBy:     x.createdBy ?? null,
      modifiedDate:  x.modifiedDate ? new Date(x.modifiedDate) : null,
      modifiedBy:    x.modifiedBy ?? null,
    };
  }

  // ─── Search ──────────────────────────────────────────────────────────────────

  onSearchChange(): void {
    this.search$.next(this.searchTerm);
  }

  onClearSearch(): void {
    this.searchTerm = '';
    this.loadAccountHeads();
  }

  // ─── Dialog ──────────────────────────────────────────────────────────────────

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData   = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(accountHead: AccountHead): void {
    this.dialogMode = 'edit';
    this.formData   = { ...accountHead };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedAccountHead) this.openEditDialog(this.selectedAccountHead);
  }

  onDialogHide(): void {
    this.formErrors = {};
    this.isSaving   = false;
  }

  // ─── Validation ──────────────────────────────────────────────────────────────

  private validate(): boolean {
    this.formErrors = {};

    if (!this.formData.name?.trim()) {
      this.formErrors.name = 'Account head name is required';
    }
    if (this.formData.phoneNo && !/^\d{7,15}$/.test(this.formData.phoneNo.replace(/[\s\-]/g, ''))) {
      this.formErrors.phoneNo = 'Enter a valid phone number';
    }
    if (this.formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email)) {
      this.formErrors.email = 'Enter a valid email address';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  // ─── Save ────────────────────────────────────────────────────────────────────

  onSave(): void {
    if (!this.validate()) return;
    this.isSaving = true;
    if (this.dialogMode === 'add') {
      this.saveAdd();
    } else {
      this.saveEdit();
    }
  }

  private toCreateDto(f: AccountHead): CreateAccountHeadDto {
    return {
      name:      f.name,
      address:   f.address,
      city:      f.city,
      state:     f.state,
      phoneNo:   f.phoneNo,
      email:     f.email,
      faxNo:     f.faxNo,
      cellNo:    f.cellNo,
      remarks:   f.remarks,
      createdBy: null,
    };
  }

  private toUpdateDto(f: AccountHead): UpdateAccountHeadDto {
    return {
      name:       f.name,
      address:    f.address,
      city:       f.city,
      state:      f.state,
      phoneNo:    f.phoneNo,
      email:      f.email,
      faxNo:      f.faxNo,
      cellNo:     f.cellNo,
      remarks:    f.remarks,
      modifiedBy: null,
    };
  }

  private saveAdd(): void {
    this.accountHeadService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapAccountHead(res?.data ?? res ?? this.formData);
        this.accountHeads = [...this.accountHeads, added];
        this.totalRecords++;
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Account Head Added',
          detail: `"${added.name}" was added successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not add account head. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.accountHeadService.update(this.formData.accountHeadId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        const idx = this.accountHeads.findIndex(a => a.accountHeadId === this.formData.accountHeadId);
        if (idx !== -1) {
          this.accountHeads = [
            ...this.accountHeads.slice(0, idx),
            { ...this.formData },
            ...this.accountHeads.slice(idx + 1)
          ];
        }
        if (this.selectedAccountHead?.accountHeadId === this.formData.accountHeadId) {
          this.selectedAccountHead = { ...this.formData };
        }
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Account Head Updated',
          detail: `"${this.formData.name}" was updated successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Could not update account head. Please try again.'
        });
      }
    });
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────

  confirmDelete(accountHead: AccountHead, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${accountHead.name}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(accountHead)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedAccountHead) this.confirmDelete(this.selectedAccountHead, event);
  }

  private executeDelete(accountHead: AccountHead): void {
    this.accountHeadService.delete(accountHead.accountHeadId).subscribe({
      next: () => {
        this.accountHeads = this.accountHeads.filter(a => a.accountHeadId !== accountHead.accountHeadId);
        if (this.selectedAccountHead?.accountHeadId === accountHead.accountHeadId) {
          this.selectedAccountHead = null;
        }
        this.totalRecords--;
        this.messageService.add({
          severity: 'success',
          summary: 'Account Head Deleted',
          detail: `"${accountHead.name}" was deleted.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete account head. Please try again.'
        });
      }
    });
  }

  // ─── Report ──────────────────────────────────────────────────────────────────

  get accountHeadReportConfig(): GridReportConfig {
    return {
      title: 'Account Head List',
      subtitle: this.hasActiveSearch ? `Search: ${this.searchTerm}` : undefined,
      fileName: 'account_heads',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Name', field: 'name' },
        { header: 'Phone No.', field: 'phoneNo' },
        { header: 'Mobile', field: 'cellNo' },
        { header: 'City', field: 'city' },
        { header: 'State', field: 'state' },
        { header: 'Email', field: 'email' }
      ],
      rows: this.accountHeads.map(a => ({
        name: a.name,
        phoneNo: a.phoneNo,
        cellNo: a.cellNo,
        city: a.city,
        state: a.state,
        email: a.email
      }))
    };
  }
}
