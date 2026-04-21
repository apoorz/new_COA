"""
Migration: Remove UNIQUE constraint on teachers.username so same teacher
can register for multiple subjects. Also sets (username, subject) as the
logical unique pair (enforced in application code).
"""
import sqlite3, shutil, os

DB = 'attendance.db'

conn = sqlite3.connect(DB)
c = conn.cursor()

# Check current teachers table
c.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='teachers'")
row = c.fetchone()
print("Current teachers DDL:", row[0])

# Recreate teachers table WITHOUT UNIQUE constraint on username
c.executescript("""
    BEGIN;
    CREATE TABLE teachers_new (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password_hash TEXT,
        subject  TEXT
    );
    INSERT INTO teachers_new (id, username, password_hash, subject)
        SELECT id, username, password_hash, subject FROM teachers;
    DROP TABLE teachers;
    ALTER TABLE teachers_new RENAME TO teachers;
    CREATE INDEX IF NOT EXISTS ix_teachers_id ON teachers (id);
    CREATE INDEX IF NOT EXISTS ix_teachers_username ON teachers (username);
    COMMIT;
""")

# Verify
c.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='teachers'")
print("New teachers DDL:", c.fetchone()[0])
c.execute("SELECT username, subject FROM teachers")
for r in c.fetchall():
    print(f"  teacher: {r[0]} | subject: {r[1]}")

conn.close()
print("Migration complete!")
