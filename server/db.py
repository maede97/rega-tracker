from __future__ import annotations

import sqlite3


def _add_column_if_missing(conn: sqlite3.Connection, table_name: str, column_name: str, definition: str) -> None:
    columns = {
        row[1]
        for row in conn.execute(f"PRAGMA table_info({table_name})").fetchall()
    }

    if column_name not in columns:
        conn.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {definition}")


def ensure_schema(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS flights (
            timestamp numeric,
            callsign TEXT,
            latitude REAL,
            longitude REAL,
            height REAL,
            active BOOLEAN
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS flights_history (
            observed_at numeric,
            callsign TEXT,
            latitude REAL,
            longitude REAL,
            height REAL,
            recorded_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    _add_column_if_missing(conn, "flights", "height", "REAL")
    _add_column_if_missing(conn, "flights_history", "height", "REAL")
