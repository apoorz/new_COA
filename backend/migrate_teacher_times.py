"""
Migration: Add class_start_time and class_end_time to teachers table.
"""
import sqlite3

DB = 'attendance.db'

conn = sqlite3.connect(DB)
c = conn.cursor()

c.execute("PRAGMA table_info(teachers)")
cols = [r[1] for r in c.fetchall()]

if 'class_start_time' not in cols:
    c.execute("ALTER TABLE teachers ADD COLUMN class_start_time TEXT")
    print("Added class_start_time column")

if 'class_end_time' not in cols:
    c.execute("ALTER TABLE teachers ADD COLUMN class_end_time TEXT")
    print("Added class_end_time column")

conn.commit()
conn.close()
print("Migration complete!")
