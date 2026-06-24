using CustomerApi.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CustomerApi.Infrastructure.Persistence;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<User, Role, int>(options)
{
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Adjustment> Adjustments => Set<Adjustment>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<Biller> Billers => Set<Biller>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<CashRegister> CashRegisters => Set<CashRegister>();
    public DbSet<Category> Categorys => Set<Category>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<Currency> Currencys => Set<Currency>();
    public DbSet<CustomerGroup> CustomerGroups => Set<CustomerGroup>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Delivery> Deliverys => Set<Delivery>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Deposit> Deposits => Set<Deposit>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<ExpenseCategory> ExpenseCategorys => Set<ExpenseCategory>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<FailedJob> FailedJobs => Set<FailedJob>();
    public DbSet<GeneralSetting> GeneralSettings => Set<GeneralSetting>();
    public DbSet<GiftCardRecharge> GiftCardRecharges => Set<GiftCardRecharge>();
    public DbSet<GiftCard> GiftCards => Set<GiftCard>();
    public DbSet<Holiday> Holidays => Set<Holiday>();
    public DbSet<HrmSetting> HrmSettings => Set<HrmSetting>();
    public DbSet<Language> Languages => Set<Language>();
    public DbSet<SchemaMigration> SchemaMigrations => Set<SchemaMigration>();
    public DbSet<Menu> Menus => Set<Menu>();
    public DbSet<MetaType> MetaTypes => Set<MetaType>();
    public DbSet<Meta> Metas => Set<Meta>();
    public DbSet<MoneyTransfer> MoneyTransfers => Set<MoneyTransfer>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<PasswordReset> PasswordResets => Set<PasswordReset>();
    public DbSet<PaymentWithCheque> PaymentWithCheques => Set<PaymentWithCheque>();
    public DbSet<PaymentWithCreditCard> PaymentWithCreditCards => Set<PaymentWithCreditCard>();
    public DbSet<PaymentWithGiftCard> PaymentWithGiftCards => Set<PaymentWithGiftCard>();
    public DbSet<PaymentWithPaypal> PaymentWithPaypals => Set<PaymentWithPaypal>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Payroll> Payrolls => Set<Payroll>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<PosSetting> PosSettings => Set<PosSetting>();
    public DbSet<ProductAdjustment> ProductAdjustments => Set<ProductAdjustment>();
    public DbSet<ProductBatch> ProductBatchs => Set<ProductBatch>();
    public DbSet<ProductPurchase> ProductPurchases => Set<ProductPurchase>();
    public DbSet<ProductQuotation> ProductQuotations => Set<ProductQuotation>();
    public DbSet<ProductReturn> ProductReturns => Set<ProductReturn>();
    public DbSet<ProductSale> ProductSales => Set<ProductSale>();
    public DbSet<ProductTransfer> ProductTransfers => Set<ProductTransfer>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<ProductWarehouse> ProductWarehouses => Set<ProductWarehouse>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<PurchaseProductReturn> PurchaseProductReturns => Set<PurchaseProductReturn>();
    public DbSet<Purchase> Purchases => Set<Purchase>();
    public DbSet<Quotation> Quotations => Set<Quotation>();
    public DbSet<ReturnPurchase> ReturnPurchases => Set<ReturnPurchase>();
    public DbSet<SaleReturn> SaleReturns => Set<SaleReturn>();
    public DbSet<RewardPointSetting> RewardPointSettings => Set<RewardPointSetting>();
    public DbSet<RoleHasPermission> RoleHasPermissions => Set<RoleHasPermission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RoleMenu> RoleMenus => Set<RoleMenu>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<StockCount> StockCounts => Set<StockCount>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Tax> Taxs => Set<Tax>();
    public DbSet<Transfer> Transfers => Set<Transfer>();
    public DbSet<ProductUnit> ProductUnits => Set<ProductUnit>();
    public DbSet<Variant> Variants => Set<Variant>();
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        // Single RoleId FK model — skip Identity join/claim tables.
        modelBuilder.Ignore<IdentityUserRole<int>>();
        modelBuilder.Ignore<IdentityUserClaim<int>>();
        modelBuilder.Ignore<IdentityUserLogin<int>>();
        modelBuilder.Ignore<IdentityUserToken<int>>();
        modelBuilder.Ignore<IdentityRoleClaim<int>>();
    }
}
