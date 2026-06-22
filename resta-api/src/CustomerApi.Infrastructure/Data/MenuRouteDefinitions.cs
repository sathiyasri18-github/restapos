namespace CustomerApi.Infrastructure.Data;

/// <summary>
/// Canonical sidebar menu entries aligned with resta-app app.routes.ts (authenticated child routes).
/// </summary>
public static class MenuRouteDefinitions
{
    public sealed record MenuRouteEntry(
        int Id,
        int? ParentMenuId,
        string MenuCode,
        string MenuName,
        string? RoutePath,
        string Icon,
        int SortOrder);

    public static IReadOnlyList<MenuRouteEntry> All { get; } =
    [
        // Top-level
        new(1, null, "DASHBOARD", "Dashboard", "/service-call-dashboard", "pi pi-chart-line", 1),
        new(2, null, "MASTERS", "Masters", null, "pi pi-list", 10),
        new(3, null, "PURCHASE", "Purchase", null, "pi pi-shopping-cart", 20),
        new(4, null, "SALES", "Sales", null, "pi pi-chart-bar", 30),
        new(5, null, "INVENTORY", "Inventory", null, "pi pi-box", 40),
        new(6, null, "SERVICE", "Service", null, "pi pi-wrench", 50),
        new(7, null, "ACCOUNTING", "Accounting", null, "pi pi-wallet", 60),
        new(8, null, "USERS", "Users", null, "pi pi-users", 70),
        new(9, null, "SETTINGS", "Settings", null, "pi pi-cog", 80),

        // Masters
        new(201, 2, "BRAND", "Brand", "/brand", "pi pi-star", 10),
        new(202, 2, "CATEGORY", "Category", "/category", "pi pi-tags", 20),
        new(203, 2, "VARIANT", "Variant", "/variant", "pi pi-sliders-h", 30),
        new(204, 2, "PRODUCT_UNIT", "Product Unit", "/product-unit", "pi pi-percentage", 40),
        new(205, 2, "PRODUCTS", "Products", "/products", "pi pi-box", 50),
        new(206, 2, "TAX", "Tax", "/tax", "pi pi-percentage", 60),
        new(207, 2, "WAREHOUSE", "Warehouse", "/warehouse", "pi pi-home", 70),
        new(208, 2, "SUPPLIER", "Supplier", "/supplier", "pi pi-truck", 80),
        new(209, 2, "CUSTOMER", "Customer", "/customer", "pi pi-user-plus", 90),
        new(210, 2, "CUSTOMER_GROUP", "Customer Group", "/customer-group", "pi pi-users", 100),
        new(211, 2, "CURRENCY", "Currency", "/currency", "pi pi-dollar", 110),
        new(212, 2, "EXPENSE_CATEGORY", "Expense Category", "/expense-category", "pi pi-wallet", 120),
        new(213, 2, "CATEGORY_TYPE", "Category Type", "/category-type", "pi pi-sitemap", 130),

        // Purchase
        new(301, 3, "PURCHASE_ORDER", "Purchase Order", "/product-purchase", "pi pi-shopping-cart", 10),
        new(304, 3, "RETURN_PURCHASE", "Return Purchase", "/return-purchase-entry", "pi pi-replay", 40),

        // Sales
        new(401, 4, "POS", "POS", "/pos", "pi pi-desktop", 10),
        new(402, 4, "SALE", "Sale", "/sale", "pi pi-shopping-bag", 20),
        new(403, 4, "RETURN_SALE", "Return Sale", "/return-sale", "pi pi-replay", 30),

        // Inventory
        new(501, 5, "ADJUSTMENT", "Adjustment", "/adjustment", "pi pi-sliders-h", 10),
        new(502, 5, "PRODUCT_ADJUSTMENT", "Product Adjustment", "/product-adjustment", "pi pi-sliders-h", 20),
        new(503, 5, "STOCK_COUNT", "Stock Count", "/stock-count", "pi pi-chart-bar", 30),
        new(504, 5, "TRANSFER", "Transfer", "/transfer", "pi pi-arrow-right-arrow-left", 40),
        new(505, 5, "PRODUCT_TRANSFER", "Product Transfer", "/product-transfer", "pi pi-arrow-right-arrow-left", 50),
        new(506, 5, "PRODUCT_WAREHOUSE", "Product Warehouse", "/product-warehouse", "pi pi-home", 60),
        new(507, 5, "PRODUCT_BATCH", "Product Batch", "/product-batch", "pi pi-box", 70),

        // Service
        new(601, 6, "SERVICE_CALL", "Service Call", "/service-call", "pi pi-wrench", 10),
        new(602, 6, "CALL_LOG", "Call Log", "/call-log", "pi pi-phone", 20),

        // Accounting
        new(701, 7, "VOUCHER_ENTRY", "Voucher Entry", "/voucher-entry", "pi pi-wallet", 10),
        new(702, 7, "CUST_CREDIT_NOTE", "Customer Credit/Debit Note", "/customer-credit-debit-note", "pi pi-file-edit", 20),
        new(703, 7, "SUPP_CREDIT_NOTE", "Supplier Credit/Debit Note", "/supplier-credit-debit-note", "pi pi-truck", 30),
        new(704, 7, "PAYMENT_REMINDER", "Payment Reminder", "/payment-reminder", "pi pi-bell", 40),

        // Users admin
        new(801, 8, "MGMT_USERS", "Users", "/users", "pi pi-user", 10),
        new(802, 8, "MGMT_ROLES", "Roles", "/roles", "pi pi-shield", 20),
        new(803, 8, "MGMT_MENUS", "Menus", "/menus", "pi pi-sitemap", 30),
        new(804, 8, "MGMT_USER_ROLES", "User Roles", "/user-roles", "pi pi-link", 40),
        new(805, 8, "MGMT_ROLE_MENUS", "Role Menus", "/role-menus", "pi pi-key", 50),

        // Settings
        new(901, 9, "CUSTOM_FIELDS", "Custom Fields", "/custom-fields", "pi pi-sliders-h", 10),
        new(902, 9, "POS_SETTING", "POS Setting", "/pos-setting", "pi pi-desktop", 20),
        new(903, 9, "GENERAL_SETTING", "General Setting", "/general-setting", "pi pi-cog", 30),
        new(904, 9, "HRM_SETTING", "HRM Setting", "/hrm-setting", "pi pi-briefcase", 40),
        new(905, 9, "REWARD_POINT_SETTING", "Reward Point Setting", "/reward-point-setting", "pi pi-star-fill", 50),
        new(906, 9, "LANGUAGE", "Language", "/language", "pi pi-globe", 60),
        new(907, 9, "CHANGE_PASSWORD", "Change Password", "/settings/security", "pi pi-shield", 70),
    ];

    public static HashSet<int> AllIds { get; } = All.Select(x => x.Id).ToHashSet();
}
