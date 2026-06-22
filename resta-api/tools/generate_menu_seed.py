#!/usr/bin/env python3
"""Generate Menu table seed SQL for master pages."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "CustomerApi.Infrastructure" / "Data" / "menu_seed.sql"

MASTERS = [
    ("MASTERS", "Masters", None, "pi pi-database", 1),
    ("ACCOUNT", "Account", "/account", "pi pi-book", 10),
    ("BILLER", "Biller", "/biller", "pi pi-id-card", 20),
    ("BRAND", "Brand", "/brand", "pi pi-star", 30),
    ("CATEGORY", "Category", "/category", "pi pi-tags", 40),
    ("COUPON", "Coupon", "/coupon", "pi pi-ticket", 50),
    ("CURRENCY", "Currency", "/currency", "pi pi-dollar", 60),
    ("CUSTOMER", "Customer", "/customer", "pi pi-user-plus", 70),
    ("CUSTOMER_GROUP", "Customer Group", "/customer-group", "pi pi-users", 80),
    ("DEPARTMENT", "Department", "/department", "pi pi-building", 90),
    ("EMPLOYEE", "Employee", "/employee", "pi pi-id-card", 100),
    ("EXPENSE_CATEGORY", "Expense Category", "/expense-category", "pi pi-wallet", 110),
    ("HOLIDAY", "Holiday", "/holiday", "pi pi-calendar", 120),
    ("LANGUAGE", "Language", "/language", "pi pi-globe", 130),
    ("PRODUCT", "Product", "/product", "pi pi-box", 140),
    ("PRODUCT_UNIT", "Product Unit", "/product-unit", "pi pi-percentage", 150),
    ("SUPPLIER", "Supplier", "/supplier", "pi pi-truck", 160),
    ("TAX", "Tax", "/tax", "pi pi-percentage", 170),
    ("VARIANT", "Variant", "/variant", "pi pi-sliders-h", 180),
    ("WAREHOUSE", "Warehouse", "/warehouse", "pi pi-home", 190),
    ("GIFT_CARD", "Gift Card", "/gift-card", "pi pi-gift", 200),
    ("POS_SETTING", "POS Setting", "/pos-setting", "pi pi-cog", 210),
    ("GENERAL_SETTING", "General Setting", "/general-setting", "pi pi-cog", 220),
    ("HRM_SETTING", "HRM Setting", "/hrm-setting", "pi pi-briefcase", 230),
    ("REWARD_POINT_SETTING", "Reward Point Setting", "/reward-point-setting", "pi pi-star-fill", 240),
]

lines = [
    "SET NOCOUNT ON;",
    "",
    "IF NOT EXISTS (SELECT 1 FROM [Menu])",
    "BEGIN",
    "SET IDENTITY_INSERT [Menu] ON;",
]

for i, (code, name, route, icon, sort) in enumerate(MASTERS, start=1):
    parent = "NULL" if i == 1 else "1"
    route_sql = "NULL" if route is None else f"'{route}'"
    lines.append(
        f"INSERT INTO [Menu] ([Id], [ParentMenuId], [MenuCode], [MenuName], [RoutePath], [Icon], [SortOrder], [IsActive]) "
        f"VALUES ({i}, {parent}, '{code}', '{name}', {route_sql}, '{icon}', {sort}, 1);"
    )

lines.extend([
    "SET IDENTITY_INSERT [Menu] OFF;",
    "END",
    "",
])

OUT.write_text("\n".join(lines), encoding="utf-8")
print(f"Wrote {OUT}")
