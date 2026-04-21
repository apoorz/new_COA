"""
Migration: Ensure students can have same entry_number with different subjects.
No schema change needed (entry_number is not UNIQUE in SQLite).
Just verifies the DB state.
"""
import sqlite3

conn = sqlite3.connect('attendance.db')
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(students)")
cols = [row[1] for row in cursor.fetchall()]
print("Students columns:", cols)
cursor.execute("SELECT entry_number, class_name, COUNT(*) FROM students GROUP BY entry_number, class_name")
rows = cursor.fetchall()
print("Current (entry_number, subject) pairs:")
for r in rows:
    print(f"  {r[0]} | {r[1]} | count={r[2]}")
conn.close()
print("Done. No migration needed – entry_number has no UNIQUE constraint in SQLite.")
