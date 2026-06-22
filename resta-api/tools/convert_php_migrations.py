#!/usr/bin/env python3
"""Convert Laravel PHP migrations to idempotent SQL Server scripts."""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MIGRATIONS_DIR = ROOT.parent / "database" / "migrations"
OUTPUT = ROOT / "src" / "CustomerApi.Infrastructure" / "Data" / "php_migrations.sql"

sys.path.insert(0, str(ROOT / "tools"))
from generate_from_sql import (  # noqa: E402
    AUDIT_COLUMNS,
    COLUMN_OVERRIDES,
    col_to_property,
    table_to_entity,
)

PERMISSION_TABLES = {
    "permissions": "permissions",
    "roles": "roles",
    "model_has_permissions": "model_has_permissions",
    "model_has_roles": "model_has_roles",
    "role_has_permissions": "role_has_permissions",
}


def sql_table(laravel_table: str) -> str:
    return table_to_entity(laravel_table)


def sql_column(laravel_table: str, laravel_col: str) -> str:
    return col_to_property(laravel_table, laravel_col)


def bracket(name: str) -> str:
    return f"[{name}]"


@dataclass
class ColumnDef:
    name: str
    sql_type: str
    nullable: bool = True
    identity: bool = False
    is_pk: bool = False
    default: str | None = None


@dataclass
class ForeignKeyDef:
    column: str
    ref_table: str
    ref_column: str = "id"
    on_delete: str | None = None


@dataclass
class TableOp:
    kind: str  # create | alter | drop
    table: str
    columns: list[ColumnDef] = field(default_factory=list)
    composite_pk: list[str] = field(default_factory=list)
    foreign_keys: list[ForeignKeyDef] = field(default_factory=list)
    drop_unique: list[str] = field(default_factory=list)
    alter_columns: list[ColumnDef] = field(default_factory=list)


def preprocess(content: str) -> str:
    content = re.sub(
        r"\$tableNames\['(\w+)'\]",
        lambda m: f"'{PERMISSION_TABLES.get(m.group(1), m.group(1))}'",
        content,
    )
    content = re.sub(r"app\('cache'\)->forget\([^)]+\);?", "", content)
    return content


def extract_up_body(content: str) -> str:
    match = re.search(r"function\s+up\s*\(\s*\)\s*\{", content)
    if not match:
        return ""
    start = match.end()
    depth = 1
    i = start
    while i < len(content) and depth > 0:
        ch = content[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
        i += 1
    return content[start : i - 1]


def parse_modifiers(chain: str) -> dict:
    mods = {"nullable": False, "default": None, "change": False}
    if "->nullable()" in chain:
        mods["nullable"] = True
    if "->change()" in chain:
        mods["change"] = True
    default_match = re.search(r"->default\(([^)]+)\)", chain)
    if default_match:
        mods["default"] = default_match.group(1).strip().strip("'\"")
    return mods


def laravel_type_to_sql(method: str, args: str, mods: dict) -> tuple[str, bool, bool]:
    identity = False
    is_pk = False
    nullable = mods.get("nullable", False)

    if method == "increments":
        return "INT", False, True
    if method == "bigIncrements":
        return "BIGINT", False, True
    if method in ("integer", "unsignedInteger", "tinyInteger"):
        return "INT", nullable, False
    if method in ("bigInteger", "unsignedBigInteger"):
        return "BIGINT", nullable, False
    if method == "boolean":
        return "BIT", nullable, False
    if method == "double":
        return "FLOAT", nullable, False
    if method == "decimal":
        parts = [p.strip() for p in args.split(",")]
        precision = parts[1] if len(parts) > 1 else "8"
        scale = parts[2] if len(parts) > 2 else "2"
        return f"DECIMAL({precision},{scale})", nullable, False
    if method == "date":
        return "DATE", nullable, False
    if method in ("datetime", "timestamp"):
        return "DATETIME2", nullable, False
    if method in ("text", "longText"):
        return "NVARCHAR(MAX)", nullable, False
    if method == "uuid":
        return "NVARCHAR(36)", False, True
    if method == "string":
        length_match = re.match(r"[^,]+,\s*(\d+)", args)
        length = length_match.group(1) if length_match else "191"
        return f"NVARCHAR({length})", nullable, False
    return "NVARCHAR(191)", nullable, False


def parse_column_line(line: str, table: str) -> list[ColumnDef | ForeignKeyDef | str]:
    results: list[ColumnDef | ForeignKeyDef | str] = []

    morphs = re.search(r"\$table->morphs\(\s*'(\w+)'\s*\)", line)
    if morphs:
        prefix = morphs.group(1)
        results.append(ColumnDef(
            name=sql_column(table, f"{prefix}_id"),
            sql_type="BIGINT",
            nullable=False,
        ))
        results.append(ColumnDef(
            name=sql_column(table, f"{prefix}_type"),
            sql_type="NVARCHAR(191)",
            nullable=False,
        ))
        return results

    timestamps = re.search(r"\$table->timestamps\(\s*\)", line)
    if timestamps:
        results.append(ColumnDef(name="CreatedDate", sql_type="DATETIME2", nullable=True))
        results.append(ColumnDef(name="ModifiedDate", sql_type="DATETIME2", nullable=True))
        return results

    drop_unique = re.search(r"\$table->dropUnique\(\s*'([^']+)'\s*\)", line)
    if drop_unique:
        results.append(f"drop_unique:{drop_unique.group(1)}")
        return results

    primary = re.search(r"\$table->primary\(\s*\[(.*?)\]\s*\)", line)
    if primary:
        cols = re.findall(r"'(\w+)'", primary.group(1))
        results.append(f"primary:{','.join(cols)}")
        return results

    foreign = re.search(
        r"\$table->foreign\(\s*'(\w+)'\s*\).*?->references\(\s*'(\w+)'\s*\).*?->on\(\s*'(\w+)'\s*\)"
        r"(?:.*?->onDelete\(\s*'(\w+)'\s*\))?",
        line,
    )
    if foreign:
        on_delete = foreign.group(4)
        results.append(ForeignKeyDef(
            column=sql_column(table, foreign.group(1)),
            ref_table=sql_table(foreign.group(3)),
            ref_column=sql_column(foreign.group(3), foreign.group(2)),
            on_delete=on_delete,
        ))
        return results

    col_match = re.search(
        r"\$table->(\w+)\(\s*'(\w+)'(?:,\s*([^)]+))?\)(.*?);",
        line,
    )
    if not col_match:
        return results

    method, col_name, extra_args, chain = col_match.groups()
    extra_args = extra_args or ""
    mods = parse_modifiers(chain)
    sql_type, type_nullable, identity = laravel_type_to_sql(method, extra_args, mods)
    nullable = mods["nullable"] or type_nullable
    if identity:
        nullable = False

    col = ColumnDef(
        name=sql_column(table, col_name),
        sql_type=sql_type,
        nullable=nullable,
        identity=identity and method in ("increments", "bigIncrements"),
        is_pk=identity,
        default=mods.get("default"),
    )
    if mods.get("change"):
        results.append(col)
        return results
    results.append(col)
    return results


def parse_schema_blocks(up_body: str) -> list[TableOp]:
    ops: list[TableOp] = []
    create_pattern = re.compile(
        r"Schema::create\(\s*'(\w+)'\s*,\s*function\s*\(\s*Blueprint\s+\$table\s*\)\s*\{(.*?)\}\s*\)\s*;",
        re.DOTALL,
    )
    table_pattern = re.compile(
        r"Schema::table\(\s*'(\w+)'\s*,\s*function\s*\(\s*Blueprint\s+\$table\s*\)\s*\{(.*?)\}\s*\)\s*;",
        re.DOTALL,
    )
    drop_pattern = re.compile(r"Schema::(?:dropIfExists|drop)\(\s*'(\w+)'\s*\)\s*;")

    for match in create_pattern.finditer(up_body):
        table = match.group(1)
        body = match.group(2)
        op = TableOp(kind="create", table=table)
        for line in body.split("\n"):
            line = line.strip()
            if not line.startswith("$table"):
                continue
            for item in parse_column_line(line, table):
                if isinstance(item, ColumnDef):
                    op.columns.append(item)
                elif isinstance(item, ForeignKeyDef):
                    op.foreign_keys.append(item)
                elif isinstance(item, str) and item.startswith("primary:"):
                    op.composite_pk = [
                        sql_column(table, c) for c in item.split(":", 1)[1].split(",")
                    ]
        ops.append(op)

    for match in table_pattern.finditer(up_body):
        table = match.group(1)
        body = match.group(2)
        op = TableOp(kind="alter", table=table)
        for line in body.split("\n"):
            line = line.strip()
            if not line.startswith("$table"):
                continue
            for item in parse_column_line(line, table):
                if isinstance(item, ColumnDef):
                    if "->change()" in line:
                        op.alter_columns.append(item)
                    else:
                        op.columns.append(item)
                elif isinstance(item, ForeignKeyDef):
                    op.foreign_keys.append(item)
                elif isinstance(item, str):
                    if item.startswith("drop_unique:"):
                        op.drop_unique.append(item.split(":", 1)[1])
                    elif item.startswith("primary:"):
                        op.composite_pk = [
                            sql_column(table, c) for c in item.split(":", 1)[1].split(",")
                        ]
        ops.append(op)

    for match in drop_pattern.finditer(up_body):
        ops.append(TableOp(kind="drop", table=match.group(1)))

    return ops


def null_sql(col: ColumnDef) -> str:
    return "NULL" if col.nullable else "NOT NULL"


def column_ddl(col: ColumnDef) -> str:
    parts = [col.sql_type]
    if col.identity:
        parts.append("IDENTITY(1,1)")
    parts.append(null_sql(col))
    return " ".join(parts)


def generate_create(op: TableOp) -> list[str]:
    table = sql_table(op.table)
    lines: list[str] = []
    lines.append(f"IF OBJECT_ID(N'dbo.{bracket(table)}', N'U') IS NULL")
    lines.append("BEGIN")
    col_lines = []
    pk_col = next((c for c in op.columns if c.is_pk), None)
    for col in op.columns:
        col_lines.append(f"    {bracket(col.name)} {column_ddl(col)}")

    lines.append(f"  CREATE TABLE dbo.{bracket(table)} (")
    lines.append(",\n".join(col_lines))
    lines.append("  );")

    if pk_col and not op.composite_pk:
        lines.append(f"  ALTER TABLE dbo.{bracket(table)} ADD CONSTRAINT PK_{table} PRIMARY KEY ({bracket(pk_col.name)});")
    elif op.composite_pk:
        pk_cols = ", ".join(bracket(c) for c in op.composite_pk)
        lines.append(f"  ALTER TABLE dbo.{bracket(table)} ADD CONSTRAINT PK_{table} PRIMARY KEY ({pk_cols});")

    for col in op.columns:
        if col.name in ("CreatedDate", "ModifiedDate"):
            lines.append(
                f"  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_{table}_{col.name}')"
            )
            lines.append(
                f"    ALTER TABLE dbo.{bracket(table)} ADD CONSTRAINT DF_{table}_{col.name} DEFAULT GETDATE() FOR {bracket(col.name)};"
            )

    for fk in op.foreign_keys:
        fk_name = f"FK_{table}_{fk.column}"
        on_delete = f" ON DELETE {fk.on_delete.upper()}" if fk.on_delete else ""
        lines.append(
            f"  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'{fk_name}')"
        )
        lines.append(
            f"    ALTER TABLE dbo.{bracket(table)} ADD CONSTRAINT {fk_name} "
            f"FOREIGN KEY ({bracket(fk.column)}) REFERENCES dbo.{bracket(fk.ref_table)} ({bracket(fk.ref_column)}){on_delete};"
        )

    lines.append("END")
    return lines


def generate_alter(op: TableOp) -> list[str]:
    table = sql_table(op.table)
    lines: list[str] = []

    for idx in op.drop_unique:
        lines.append(
            f"IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'{idx}' AND object_id = OBJECT_ID(N'dbo.{bracket(table)}'))"
        )
        lines.append(f"  DROP INDEX {bracket(idx)} ON dbo.{bracket(table)};")

    for col in op.columns:
        lines.append(
            f"IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.{bracket(table)}') AND name = N'{col.name}')"
        )
        lines.append(
            f"  ALTER TABLE dbo.{bracket(table)} ADD {bracket(col.name)} {column_ddl(col)};"
        )

    for col in op.alter_columns:
        lines.append(
            f"IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.{bracket(table)}') AND name = N'{col.name}')"
        )
        lines.append(
            f"  ALTER TABLE dbo.{bracket(table)} ALTER COLUMN {bracket(col.name)} {col.sql_type} {null_sql(col)};"
        )

    if op.composite_pk:
        pk_cols = ", ".join(bracket(c) for c in op.composite_pk)
        lines.append(
            f"IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'PK_{table}' AND parent_object_id = OBJECT_ID(N'dbo.{bracket(table)}'))"
        )
        lines.append(
            f"  ALTER TABLE dbo.{bracket(table)} ADD CONSTRAINT PK_{table} PRIMARY KEY ({pk_cols});"
        )

    for fk in op.foreign_keys:
        fk_name = f"FK_{table}_{fk.column}"
        on_delete = f" ON DELETE {fk.on_delete.upper()}" if fk.on_delete else ""
        lines.append(
            f"IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'{fk_name}')"
        )
        lines.append(
            f"  ALTER TABLE dbo.{bracket(table)} ADD CONSTRAINT {fk_name} "
            f"FOREIGN KEY ({bracket(fk.column)}) REFERENCES dbo.{bracket(fk.ref_table)} ({bracket(fk.ref_column)}){on_delete};"
        )

    return lines


def generate_drop(op: TableOp) -> list[str]:
    table = sql_table(op.table)
    return [
        f"IF OBJECT_ID(N'dbo.{bracket(table)}', N'U') IS NOT NULL",
        f"  DROP TABLE dbo.{bracket(table)};",
    ]


def generate_migration_block(filename: str, batch: int, ops: list[TableOp]) -> str:
    name = filename.replace(".php", "")
    lines = [
        f"-- MIGRATION: {name}",
        f"IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'{name}')",
        "BEGIN",
    ]

    ddl_lines: list[str] = []
    for op in ops:
        if op.kind == "create":
            ddl_lines.extend(generate_create(op))
        elif op.kind == "alter":
            ddl_lines.extend(generate_alter(op))
        elif op.kind == "drop":
            ddl_lines.extend(generate_drop(op))

    if ddl_lines:
        lines.extend(f"  {l}" if not l.startswith("  ") and l else l for l in ddl_lines)
    else:
        lines.append("  -- no schema changes")

    lines.append(
        f"  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'{name}', {batch});"
    )
    lines.append("END")
    lines.append("GO")
    return "\n".join(lines)


def main() -> None:
    files = sorted(MIGRATIONS_DIR.glob("*.php"))
    if not files:
        raise SystemExit(f"No migration files found in {MIGRATIONS_DIR}")

    blocks: list[str] = [
        "SET NOCOUNT ON;",
        "-- Generated from Laravel PHP migrations",
        "",
    ]

    for batch, path in enumerate(files, start=1):
        content = preprocess(path.read_text(encoding="utf-8"))
        up_body = extract_up_body(content)
        ops = parse_schema_blocks(up_body)
        blocks.append(generate_migration_block(path.name, batch, ops))
        blocks.append("")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text("\n".join(blocks), encoding="utf-8")
    print(f"Generated {len(files)} migrations -> {OUTPUT}")


if __name__ == "__main__":
    main()
