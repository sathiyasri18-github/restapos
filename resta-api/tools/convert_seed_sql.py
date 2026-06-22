#!/usr/bin/env python3
"""Convert MySQL database.sql dump to SQL Server seed script for restapos database."""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from generate_from_sql import (
    col_to_property,
    get_primary_key,
    mysql_to_csharp,
    parse_tables,
    table_to_entity,
)

SQL_FILE = ROOT.parent / "database.sql"
OUT_FILE = ROOT / "src" / "CustomerApi.Infrastructure" / "Data" / "restapos_seed.sql"


def extract_inserts(sql: str) -> list[tuple[str, str]]:
    results = []
    pattern = re.compile(
        r"-- Dumping data for table `(\w+)`\s*--\s*\n\s*(INSERT INTO .*?;)",
        re.DOTALL | re.IGNORECASE,
    )
    for match in pattern.finditer(sql):
        table = match.group(1)
        insert = match.group(2)
        results.append((table, insert))
    return results


def mysql_insert_to_sqlserver(insert: str, table: str) -> str:
    entity_table = table_to_entity(table)
    s = insert.replace("`", "")
    s = re.sub(r"\bINSERT INTO \w+", f"INSERT INTO [{entity_table}]", s, count=1)
    s = s.replace("\\r\\n", "' + CHAR(13)+CHAR(10) + '")
    s = s.replace("\\n", "' + CHAR(10) + '")
    s = s.replace("\\'", "''")
    s = s.replace("@@", "@")

    def replace_columns(match: re.Match[str]) -> str:
        cols = [c.strip() for c in match.group(2).split(",")]
        bracketed = ", ".join(f"[{col_to_property(table, c)}]" for c in cols)
        return f"{match.group(1)}({bracketed}){match.group(3)}"

    s = re.sub(
        r"(INSERT INTO \[\w+\] )\(([^)]+)\)(\s*VALUES)",
        replace_columns,
        s,
        count=1,
        flags=re.IGNORECASE | re.DOTALL,
    )
    return s


def has_identity_insert(table: str, tables: dict) -> bool:
    columns = tables.get(table, [])
    if get_primary_key(table, columns) != ["id"]:
        return False
    id_col = next((c for c in columns if c["name"] == "id"), None)
    if id_col is None:
        return False
    return mysql_to_csharp(id_col["type"], False) in ("int", "long")


def main():
    sql = SQL_FILE.read_text(encoding="utf-8", errors="replace")
    tables = parse_tables(sql)
    inserts = extract_inserts(sql)

    lines = [
        "SET NOCOUNT ON;",
        "",
    ]

    for table, insert in inserts:
        entity_table = table_to_entity(table)
        converted = mysql_insert_to_sqlserver(insert, table)
        has_identity = has_identity_insert(table, tables)
        lines.append(f"-- Seed {entity_table}")
        if has_identity:
            lines.append(f"SET IDENTITY_INSERT [{entity_table}] ON;")
        lines.append(converted)
        if has_identity:
            lines.append(f"SET IDENTITY_INSERT [{entity_table}] OFF;")
        lines.append("")

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {len(inserts)} table seed blocks to {OUT_FILE}")


if __name__ == "__main__":
    main()
