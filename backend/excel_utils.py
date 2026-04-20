import pandas as pd
import os
from datetime import datetime

STUDENTS_EXCEL = "students.xlsx"

def append_student_to_excel(name, entry_number, class_name):
    """Appends a new student to the students.xlsx file."""
    data = {
        "Name": [name],
        "Entry Number": [entry_number],
        "Class": [class_name],
        "Registered At": [datetime.now().strftime("%Y-%m-%d %H:%M:%S")]
    }
    df_new = pd.DataFrame(data)
    
    if os.path.exists(STUDENTS_EXCEL):
        try:
            df_old = pd.read_excel(STUDENTS_EXCEL)
            df_final = pd.concat([df_old, df_new], ignore_index=True)
            df_final.to_excel(STUDENTS_EXCEL, index=False)
        except Exception as e:
            print(f"Error reading/writing main students excel: {e}")
            fallback_filename = f"students_fallback_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            print(f"Saving to fallback file: {fallback_filename}")
            df_new.to_excel(fallback_filename, index=False)
    else:
        df_new.to_excel(STUDENTS_EXCEL, index=False)

def log_attendance_to_excel(student_name, entry_number, class_name):
    """Logs attendance to a class-specific daily excel file."""
    date_str = datetime.now().strftime("%Y-%m-%d")
    filename = f"Attendance_{class_name}_{date_str}.xlsx"
    
    data = {
        "Entry Number": [entry_number],
        "Name": [student_name],
        "Timestamp": [datetime.now().strftime("%H:%M:%S")],
        "Status": ["Present"]
    }
    df_new = pd.DataFrame(data)
    
    if os.path.exists(filename):
        try:
            df_old = pd.read_excel(filename)
            # Avoid duplicate logs for the same student in the same file if needed
            # For now, just append as requested (per day per class log)
            df_final = pd.concat([df_old, df_new], ignore_index=True)
            df_final.to_excel(filename, index=False)
        except Exception as e:
            print(f"Error accessing attendance excel {filename}: {e}")
            fallback_filename = f"Attendance_{class_name}_fallback_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            print(f"Saving to fallback file: {fallback_filename}")
            df_new.to_excel(fallback_filename, index=False)
    else:
        df_new.to_excel(filename, index=False)
