// app.module.ts

import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberModule } from 'primeng/inputnumber';
import { PasswordModule } from 'primeng/password';
import { TabsModule } from 'primeng/tabs';

const PRIMENG_MODULES = [
  ButtonModule,
  TableModule,
  InputTextModule,
  DialogModule,
  DatePickerModule,
  TextareaModule,
  SelectModule,
  CheckboxModule,
  ToastModule,
  ConfirmDialogModule,
  SkeletonModule,
  TagModule,
  TooltipModule,
  IconFieldModule,
  InputIconModule,
  MultiSelectModule,
  InputNumberModule,
  PasswordModule,
  TabsModule,
];

@NgModule({
  imports: [
    FormsModule,
    CommonModule,
    ...PRIMENG_MODULES,
  ],
  exports: [
    FormsModule,
    CommonModule,
    ...PRIMENG_MODULES,
  ]
})
export class AppModule {}
