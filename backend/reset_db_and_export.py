import models, database, excel_utils
import pandas as pd
from datetime import datetime

# Dump to Excel
db = database.SessionLocal()

try:
    students = db.query(models.Student).all()
    if students:
        s_data = []
        for s in students:
            s_data.append({
                "Name": s.name,
                "Entry Number": s.entry_number,
                "Class": s.class_name,
                "Registered At": "Imported Before Reset"
            })
        df_students = pd.DataFrame(s_data)
        df_students.to_excel(f"students_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx", index=False)
        print("Backed up students.")
    
    attendance = db.query(models.Attendance).all()
    if attendance:
        a_data = []
        for a in attendance:
            student = db.query(models.Student).filter(models.Student.id == a.student_id).first()
            if student:
                a_data.append({
                    "Entry Number": student.entry_number,
                    "Name": student.name,
                    "Class": student.class_name,
                    "Timestamp": a.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                    "Status": "Present"
                })
        df_attendance = pd.DataFrame(a_data)
        df_attendance.to_excel(f"attendance_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx", index=False)
        print("Backed up attendance logs.")

    # Remove all data
    db.query(models.Attendance).delete()
    db.query(models.Student).delete()
    db.commit()
    print("Database cleared successfully.")
    
except Exception as e:
    db.rollback()
    print(f"An error occurred: {e}")
finally:
    db.close()
