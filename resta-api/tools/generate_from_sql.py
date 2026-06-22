#!/usr/bin/env python3
"""Generate EF Core entities, configurations, and CRUD controllers from database.sql."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SQL_FILE = ROOT.parent / "database.sql"
DOMAIN = ROOT / "src" / "CustomerApi.Domain" / "Entities"
CONFIG = ROOT / "src" / "CustomerApi.Infrastructure" / "Persistence" / "Configurations"
CONTROLLERS = ROOT / "src" / "CustomerApi.API" / "Controllers"

TABLE_ENTITY_OVERRIDES = {
    "sales": "Sale",
    "returns": "SaleReturn",
    "units": "ProductUnit",
    "migrations": "SchemaMigration",
}

AUDIT_COLUMNS = {
    "created_at": "CreatedDate",
    "updated_at": "ModifiedDate",
    "created_by": "CreatedBy",
    "modified_by": "ModifiedBy",
}

COLUMN_OVERRIDES = {
    ("migrations", "migration"): "MigrationName",
}

AUDIT_DEFAULT_COLUMNS = {"CreatedDate", "ModifiedDate"}


def singularize(word: str) -> str:
    if word in TABLE_ENTITY_OVERRIDES:
        return TABLE_ENTITY_OVERRIDES[word].lower()
    special = {
        "purchases": "purchase",
        "quotations": "quotation",
        "permissions": "permission",
        "deliveries": "delivery",
        "categories": "category",
        "currencies": "currency",
        "taxes": "tax",
        "warehouses": "warehouse",
        "employees": "employee",
        "attendances": "attendance",
        "expenses": "expense",
        "deposits": "deposit",
        "payrolls": "payroll",
        "transfers": "transfer",
        "variants": "variant",
        "suppliers": "supplier",
        "customers": "customer",
        "accounts": "account",
        "billers": "biller",
        "brands": "brand",
        "coupons": "coupon",
        "products": "product",
        "payments": "payment",
        "purchases": "purchase",
        "sales": "sale",
    }
    if word in special:
        return special[word]
    if word.endswith("ies"):
        return word[:-3] + "y"
    if word.endswith("ches") or word.endswith("shes"):
        return word[:-2]
    if word.endswith("ses"):
        return word[:-2]
    if word.endswith("s") and not word.endswith("ss"):
        return word[:-1]
    return word


def table_to_entity(table_name: str) -> str:
    if table_name in TABLE_ENTITY_OVERRIDES:
        return TABLE_ENTITY_OVERRIDES[table_name]
    parts = table_name.split("_")
    if parts[-1] == "returns" and table_name != "returns":
        parts[-1] = "return"
    else:
        parts[-1] = singularize(parts[-1])
    return "".join(p.capitalize() for p in parts)


def col_to_property(table_name: str, col: str) -> str:
    key = (table_name, col)
    if key in COLUMN_OVERRIDES:
        return COLUMN_OVERRIDES[key]
    if col in AUDIT_COLUMNS:
        return AUDIT_COLUMNS[col]
    if col == "id":
        return "Id"
    parts = col.split("_")
    return "".join(p.capitalize() for p in parts)


def entity_to_dbset(entity_name: str) -> str:
    if entity_name.endswith("s"):
        return entity_name + "es"
    return entity_name + "s"


def controller_name(entity_name: str) -> str:
    return f"{entity_name}Controller"


def mysql_to_csharp(mysql_type: str, nullable: bool) -> str:
    t = mysql_type.lower().strip()
    csharp = "string"
    if t.startswith("bigint"):
        csharp = "long"
    elif t.startswith("int") or t.startswith("mediumint") or t.startswith("smallint"):
        csharp = "int"
    elif t.startswith("tinyint(1)") or t == "tinyint(1)":
        csharp = "bool"
    elif t.startswith("tinyint") or t.startswith("smallint"):
        csharp = "int"
    elif t.startswith("double") or t.startswith("float") or t.startswith("real"):
        csharp = "double"
    elif t.startswith("decimal") or t.startswith("numeric"):
        csharp = "decimal"
    elif t.startswith("date") and "time" not in t:
        csharp = "DateOnly"
    elif t.startswith("timestamp") or t.startswith("datetime"):
        csharp = "DateTime"
    elif t.startswith("time"):
        csharp = "TimeSpan"
    elif t.startswith("longtext") or t.startswith("mediumtext") or t.startswith("text") or t.startswith("varchar") or t.startswith("char"):
        csharp = "string"
    elif t.startswith("json"):
        csharp = "string"
    elif t.startswith("blob") or t.startswith("longblob"):
        csharp = "byte[]"

    if nullable and csharp not in ("string", "byte[]"):
        csharp += "?"
    elif nullable and csharp == "string":
        csharp = "string?"
    return csharp


def parse_tables(sql: str) -> dict:
    tables = {}
    pattern = re.compile(
        r"CREATE TABLE `(\w+)` \((.*?)\) ENGINE=",
        re.DOTALL | re.IGNORECASE,
    )
    for match in pattern.finditer(sql):
        table_name = match.group(1)
        body = match.group(2)
        columns = []
        for line in body.split("\n"):
            line = line.strip().rstrip(",")
            if not line.startswith("`"):
                continue
            col_match = re.match(
                r"`(\w+)`\s+(\w+(?:\(\d+(?:,\d+)?\))?(?:\s+UNSIGNED)?)\s*(.*)",
                line,
                re.IGNORECASE,
            )
            if not col_match:
                continue
            col_name = col_match.group(1)
            col_type = col_match.group(2)
            rest = col_match.group(3).upper()
            not_null = "NOT NULL" in rest
            nullable = not not_null or "DEFAULT NULL" in rest
            columns.append({
                "name": col_name,
                "type": col_type,
                "nullable": nullable,
                "not_null": not_null,
            })
        tables[table_name] = columns
    return tables


def get_primary_key(table_name: str, columns: list) -> list:
    col_names = [c["name"] for c in columns]
    if table_name == "role_has_permissions":
        return ["permission_id", "role_id"]
    if table_name == "password_resets":
        return ["email", "token"]
    if "id" in col_names:
        return ["id"]
    return [col_names[0]]


def generate_entity(table_name: str, columns: list) -> str:
    class_name = table_to_entity(table_name)
    pk_cols = get_primary_key(table_name, columns)
    lines = [
        "namespace CustomerApi.Domain.Entities;",
        "",
        f"public class {class_name}",
        "{",
    ]
    for col in columns:
        prop = col_to_property(table_name, col["name"])
        cs_type = mysql_to_csharp(col["type"], col["nullable"])
        if col["name"] == "id" and "id" in pk_cols:
            prop = "Id"
            cs_type = cs_type.replace("?", "")
        suffix = ""
        if cs_type == "string" and col["not_null"]:
            suffix = " = null!;"
        lines.append(f"    public {cs_type} {prop} {{ get; set; }}{suffix}")
    lines.append("}")
    lines.append("")
    return "\n".join(lines)


def generate_config(table_name: str, columns: list) -> str:
    class_name = table_to_entity(table_name)
    pk_cols = get_primary_key(table_name, columns)
    lines = [
        "using CustomerApi.Domain.Entities;",
        "using Microsoft.EntityFrameworkCore;",
        "using Microsoft.EntityFrameworkCore.Metadata.Builders;",
        "",
        "namespace CustomerApi.Infrastructure.Persistence.Configurations;",
        "",
        f"public class {class_name}Configuration : IEntityTypeConfiguration<{class_name}>",
        "{",
        f"    public void Configure(EntityTypeBuilder<{class_name}> builder)",
        "    {",
        f'        builder.ToTable("{class_name}");',
    ]

    if len(pk_cols) == 1 and pk_cols[0] == "id":
        id_col = next(c for c in columns if c["name"] == "id")
        id_cs = mysql_to_csharp(id_col["type"], False)
        lines.append(f'        builder.HasKey(x => x.Id).HasName("PK_{class_name}");')
        if id_cs in ("int", "long"):
            lines.append("        builder.Property(x => x.Id).UseIdentityColumn();")
    else:
        key_props = ", ".join(f"x.{col_to_property(table_name, c)}" for c in pk_cols)
        lines.append(f'        builder.HasKey(x => new {{ {key_props} }}).HasName("PK_{class_name}");')

    for col in columns:
        prop = col_to_property(table_name, col["name"])
        if col["name"] == "id" and "id" in pk_cols:
            prop = "Id"
        cs_type = mysql_to_csharp(col["type"], col["nullable"])
        mysql = col["type"]

        if "varchar" in mysql or "char" in mysql:
            m = re.search(r"\((\d+)\)", mysql)
            if m:
                lines.append(f"        builder.Property(x => x.{prop}).HasMaxLength({m.group(1)});")
        if cs_type == "string?" or (cs_type == "string" and col["nullable"]):
            lines.append(f"        builder.Property(x => x.{prop}).IsRequired(false);")
        elif cs_type == "string" and col["not_null"]:
            lines.append(f"        builder.Property(x => x.{prop}).IsRequired();")
        if cs_type in ("DateOnly", "DateOnly?"):
            lines.append(f"        builder.Property(x => x.{prop}).HasColumnType(\"date\");")
        if prop in AUDIT_DEFAULT_COLUMNS:
            lines.append(f'        builder.Property(x => x.{prop}).HasDefaultValueSql("GETDATE()");')
            lines.append(
                f'        builder.Property(x => x.{prop}).HasAnnotation("Relational:DefaultConstraintName", "DF_{class_name}_{prop}");'
            )

    lines.extend(["    }", "}", ""])
    return "\n".join(lines)


def generate_controller(table_name: str) -> str:
    entity_name = table_to_entity(table_name)
    ctrl = controller_name(entity_name)
    return f"""using Asp.Versioning;
using CustomerApi.API.Controllers.Base;
using CustomerApi.Application.Common.Interfaces;
using CustomerApi.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace CustomerApi.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{{version:apiVersion}}/{entity_name}")]
public class {ctrl}(IGenericRepository<{entity_name}> repository) : CrudControllerBase<{entity_name}>(repository)
{{
}}
"""


def generate_dbcontext(tables: dict) -> str:
    dbsets = []
    for table_name in sorted(tables.keys()):
        entity_name = table_to_entity(table_name)
        dbset_name = entity_to_dbset(entity_name)
        dbsets.append(f"    public DbSet<{entity_name}> {dbset_name} => Set<{entity_name}>();")

    dbset_block = "\n".join(dbsets)
    return f"""using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CustomerApi.Infrastructure.Persistence;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : DbContext(options)
{{
{dbset_block}

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {{
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }}
}}
"""


def main():
    sql = SQL_FILE.read_text(encoding="utf-8", errors="replace")
    tables = parse_tables(sql)
    print(f"Parsed {len(tables)} tables")

    DOMAIN.mkdir(parents=True, exist_ok=True)
    CONFIG.mkdir(parents=True, exist_ok=True)

    for f in DOMAIN.glob("*.cs"):
        f.unlink()
    for f in CONFIG.glob("*.cs"):
        f.unlink()
    for f in CONTROLLERS.glob("*.cs"):
        if f.name != "CrudControllerBase.cs" and f.parent.name != "Base":
            f.unlink()

    for table_name, columns in sorted(tables.items()):
        entity_name = table_to_entity(table_name)
        (DOMAIN / f"{entity_name}.cs").write_text(generate_entity(table_name, columns), encoding="utf-8")
        (CONFIG / f"{entity_name}Configuration.cs").write_text(generate_config(table_name, columns), encoding="utf-8")
        (CONTROLLERS / (controller_name(entity_name) + ".cs")).write_text(
            generate_controller(table_name), encoding="utf-8"
        )

    dbcontext_path = ROOT / "src" / "CustomerApi.Infrastructure" / "Persistence" / "ApplicationDbContext.cs"
    dbcontext_path.write_text(generate_dbcontext(tables), encoding="utf-8")

    registry_path = ROOT / "src" / "CustomerApi.Application" / "Common" / "EntityRegistry.cs"
    registry_lines = [
        "namespace CustomerApi.Application.Common;",
        "",
        "public static class EntityRegistry",
        "{",
        "    public static readonly Dictionary<string, Type> TableToType = new(StringComparer.OrdinalIgnoreCase)",
        "    {",
    ]
    for table_name in sorted(tables.keys()):
        entity_name = table_to_entity(table_name)
        registry_lines.append(f'        ["{entity_name}"] = typeof(Domain.Entities.{entity_name}),')
        registry_lines.append(f'        ["{table_name}"] = typeof(Domain.Entities.{entity_name}),')
    registry_lines.extend(["    };", "}", ""])
    registry_path.write_text("\n".join(registry_lines), encoding="utf-8")

    print("Generation complete.")


if __name__ == "__main__":
    main()
