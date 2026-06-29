import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

/** Authenticated sidebar routes — keep in sync with MenuRouteDefinitions.cs in the API. */
export const routes: Routes = [
  {
    path: 'sign-in',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./page/auth/sign-in/sign-in.component').then(m => m.SignInComponent)
  },
  {
    path: 'sign-up',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./page/auth/sign-up/sign-up.component').then(m => m.SignUpComponent)
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./page/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./page/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/layout').then(m => m.Layout),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./page/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'meta-type',
        loadComponent: () =>
          import('./page/meta-type/meta-type-component').then(m => m.MetaTypeComponent)
      },
      {
        path: 'voucher-entry',
        loadComponent: () =>
          import('./page/voucher-entry/voucher-entry.component').then(m => m.VoucherEntryComponent)
      },
      {
        path: 'customer-credit-debit-note',
        loadComponent: () =>
          import('./page/customer-credit-debit-note/customer-credit-debit-note.component').then(m => m.CustomerCreditDebitNoteComponent)
      },
      {
        path: 'supplier-credit-debit-note',
        loadComponent: () =>
          import('./page/supplier-credit-debit-note/supplier-credit-debit-note.component').then(m => m.SupplierCreditDebitNoteComponent)
      },
      {
        path: 'payment-reminder',
        loadComponent: () =>
          import('./page/payment-reminder/payment-reminder.component').then(m => m.PaymentReminderComponent)
      },
      {
        path: 'product-purchase',
        loadComponent: () =>
          import('./page/purchases/purchase-order/purchase-order.component').then(m => m.PurchaseOrderComponent)
      },
      {
        path: 'purchase-list',
        redirectTo: 'product-purchase',
        pathMatch: 'full'
      },
      {
        path: 'purchase-entry',
        redirectTo: 'product-purchase',
        pathMatch: 'full'
      },
      {
        path: 'return-purchase-entry',
        loadComponent: () =>
          import('./page/return-purchase-entry/return-purchase-entry.component').then(m => m.ReturnPurchaseEntryComponent)
      },
      {
        path: 'purchase',
        redirectTo: 'product-purchase',
        pathMatch: 'full'
      },
      {
        path: 'pos',
        loadComponent: () =>
          import('./page/sales/pos/pos.component').then(m => m.PosComponent)
      },
      {
        path: 'sale-list',
        redirectTo: 'sale',
        pathMatch: 'full'
      },
      {
        path: 'sales',
        redirectTo: 'sale',
        pathMatch: 'full'
      },
      {
        path: 'sale',
        loadComponent: () =>
          import('./page/sales/sale/sale.component').then(m => m.SaleComponent)
      },
      {
        path: 'return-sale',
        loadComponent: () =>
          import('./page/sales/return-sale/return-sale.component').then(m => m.ReturnSaleComponent)
      },
      {
        path: 'call-log',
        loadComponent: () =>
          import('./page/call-log/call-log.component').then(m => m.ServiceCallLogComponent)
      },
      {
        path: 'service-call',
        loadComponent: () =>
          import('./page/service-call/service-call.component').then(m => m.ServiceCallComponent)
      },
      {
        path: 'custom-fields',
        loadComponent: () =>
          import('./page/custom-field/custom-field.component').then(m => m.CustomFieldComponent)
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./page/user/user.component').then(m => m.UserComponent)
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./page/role/role.component').then(m => m.RoleComponent)
      },
      {
        path: 'menus',
        loadComponent: () =>
          import('./page/menu/menu.component').then(m => m.MenuComponent)
      },
      {
        path: 'user-roles',
        loadComponent: () =>
          import('./page/user-role/user-role.component').then(m => m.UserRoleComponent)
      },
      {
        path: 'role-menus',
        loadComponent: () =>
          import('./page/role-menu/role-menu.component').then(m => m.RoleMenuComponent)
      },
      {
        path: 'brand',
        loadComponent: () =>
          import('./page/brand/brand.component').then(m => m.BrandComponent)
      },
      {
        path: 'category',
        loadComponent: () =>
          import('./page/category/category.component').then(m => m.CategoryComponent)
      },
      {
        path: 'variant',
        loadComponent: () =>
          import('./page/variant/variant.component').then(m => m.VariantComponent)
      },
      {
        path: 'product-unit',
        loadComponent: () =>
          import('./page/products/product-unit/product-unit.component').then(m => m.ProductUnitComponent)
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./page/products/product/product.component').then(m => m.ProductComponent)
      },
      {
        path: 'tax',
        loadComponent: () =>
          import('./page/tax/tax.component').then(m => m.TaxComponent)
      },
      {
        path: 'warehouse',
        loadComponent: () =>
          import('./page/warehouse/warehouse.component').then(m => m.WarehouseComponent)
      },
      {
        path: 'supplier',
        loadComponent: () =>
          import('./page/supplier/supplier.component').then(m => m.SupplierComponent)
      },
      {
        path: 'adjustment',
        loadComponent: () =>
          import('./page/adjustment/adjustment.component').then(m => m.AdjustmentComponent)
      },
      {
        path: 'product-adjustment',
        loadComponent: () =>
          import('./page/products/product-adjustment/product-adjustment.component').then(m => m.ProductAdjustmentComponent)
      },
      {
        path: 'stock-count',
        loadComponent: () =>
          import('./page/stock-count/stock-count.component').then(m => m.StockCountComponent)
      },
      {
        path: 'transfer',
        loadComponent: () =>
          import('./page/transfer/transfer.component').then(m => m.TransferComponent)
      },
      {
        path: 'product-transfer',
        loadComponent: () =>
          import('./page/products/product-transfer/product-transfer.component').then(m => m.ProductTransferComponent)
      },
      {
        path: 'product-warehouse',
        loadComponent: () =>
          import('./page/products/product-warehouse/product-warehouse.component').then(m => m.ProductWarehouseComponent)
      },
      {
        path: 'product-batch',
        loadComponent: () =>
          import('./page/products/product-batch/product-batch.component').then(m => m.ProductBatchComponent)
      },
      {
        path: 'currency',
        loadComponent: () =>
          import('./page/currency/currency.component').then(m => m.CurrencyComponent)
      },
      {
        path: 'expense-category',
        loadComponent: () =>
          import('./page/expense-category/expense-category.component').then(m => m.ExpenseCategoryComponent)
      },
      {
        path: 'customer',
        loadComponent: () =>
          import('./page/customer/customer/customer.component').then(m => m.CustomerComponent)
      },
      {
        path: 'customer-group',
        loadComponent: () =>
          import('./page/customer/customer-group/customer-group.component').then(m => m.CustomerGroupComponent)
      },
      {
        path: 'pos-setting',
        loadComponent: () =>
          import('./page/pos-settings/pos-setting/pos-setting.component').then(m => m.PosSettingComponent)
      },
      {
        path: 'general-setting',
        loadComponent: () =>
          import('./page/general-setting/general-setting.component').then(m => m.GeneralSettingComponent)
      },
      {
        path: 'hrm-setting',
        loadComponent: () =>
          import('./page/hrm-setting/hrm-setting.component').then(m => m.HrmSettingComponent)
      },
      {
        path: 'reward-point-setting',
        loadComponent: () =>
          import('./page/reward-point-setting/reward-point-setting.component').then(m => m.RewardPointSettingComponent)
      },
      {
        path: 'language',
        loadComponent: () =>
          import('./page/language/language.component').then(m => m.LanguageComponent)
      },
      {
        path: 'settings/security',
        loadComponent: () =>
          import('./page/settings/change-password/change-password.component').then(m => m.ChangePasswordComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'sign-in' }
];
