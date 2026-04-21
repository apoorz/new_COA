"""
Migration: Add password_hash column to students table.
Sets default password = hash(entry_number) for all existing students.
"""
import sqlite3
import bcrypt

conn = sqlite3.connect('attendance.db')
cursor = conn.cursor()

# Add column if not exists
cursor.execute("PRAGMA table_info(students)")
cols = [row[1] for row in cursor.fetchall()]
if 'password_hash' not in cols:
    cursor.execute("ALTER TABLE students ADD COLUMN password_hash TEXT")
    print("Added password_hash column")

# Set default password = hash(entry_number) for every student that has no password yet
cursor.execute("SELECT id, entry_number FROM students WHERE password_hash IS NULL")
students = cursor.fetchall()
for student_id, entry_number in students:
    pw_bytes = entry_number.encode('utf-8')[:72]
    hashed = bcrypt.hashpw(pw_bytes, bcrypt.gensalt()).decode('utf-8')
    cursor.execute("UPDATE students SET password_hash = ? WHERE id = ?", (hashed, student_id))
    print(f"  Set default password for student id={student_id}, entry={entry_number}")

conn.commit()
conn.close()
print("Migration complete!")
