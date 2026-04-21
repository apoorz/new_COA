import cv2
import numpy as np
import face_recognition
import json
from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import models
import database
import excel_utils
import bcrypt

def hash_password(password: str) -> str:
    # bcrypt has a 72-byte limit; truncate to avoid errors
    password_bytes = password.encode('utf-8')[:72]
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    password_bytes = password.encode('utf-8')[:72]
    return bcrypt.checkpw(password_bytes, hashed.encode('utf-8'))

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_face_encoding(image_bytes):
    from PIL import Image, ImageOps
    import io
    
    try:
        # Load the uploaded image file robustly using PIL
        image = Image.open(io.BytesIO(image_bytes))
        
        # Correct image orientation from EXIF metadata (often the case with smartphone photos)
        image = ImageOps.exif_transpose(image)
        
        # Convert to RGB to ensure it's standard 8-bit RGB format, regardless of input type (RGBA, HEIF, etc.)
        image = image.convert("RGB")
        
        # Convert to numpy array, strictly enforcing uint8 type and contiguous memory layout
        # (dlib explicitly demands contiguous 8-bit RGB arrays, which PIL operations might sometimes break)
        rgb_img = np.ascontiguousarray(np.array(image, dtype=np.uint8))
        
        # Get face locations and encodings
        face_locations = face_recognition.face_locations(rgb_img)
        if not face_locations:
            return None, []
        
        face_encodings = face_recognition.face_encodings(rgb_img, face_locations)
        return face_encodings, face_locations
    except Exception as e:
        print(f"Error processing image: {e}")
        return None, []

@app.post("/api/teacher/signup")
def signup_teacher(username: str = Form(...), password: str = Form(...), subject: str = Form(""), db: Session = Depends(get_db)):
    try:
        subject_clean = subject.strip()
        if not subject_clean:
            raise HTTPException(status_code=400, detail="Subject is required.")

        # Block exact duplicate (same username + same subject)
        existing_exact = db.query(models.Teacher).filter(
            models.Teacher.username == username,
            models.Teacher.subject == subject_clean
        ).first()
        if existing_exact:
            raise HTTPException(status_code=400, detail=f"Teacher '{username}' is already registered for subject '{subject_clean}'.")

        # If teacher exists for another subject, reuse their password hash
        existing_any = db.query(models.Teacher).filter(models.Teacher.username == username).first()
        if existing_any:
            if not verify_password(password, existing_any.password_hash):
                raise HTTPException(status_code=403, detail="Password does not match your existing account. Use the same password to add a new subject.")
            hashed_password = existing_any.password_hash  # reuse
        else:
            hashed_password = hash_password(password)

        new_teacher = models.Teacher(username=username, password_hash=hashed_password, subject=subject_clean)
        db.add(new_teacher)
        db.commit()
        return {"message": "Teacher registered successfully", "username": username, "subject": subject_clean}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")

@app.post("/api/teacher/login")
def login_teacher(username: str = Form(...), password: str = Form(...), subject: str = Form(""), db: Session = Depends(get_db)):
    try:
        subject_clean = subject.strip()
        # Find exact match on username + subject
        teacher = db.query(models.Teacher).filter(
            models.Teacher.username == username,
            models.Teacher.subject == subject_clean
        ).first()
        if not teacher:
            raise HTTPException(status_code=401, detail=f"No account found for username '{username}' with subject '{subject_clean}'.")
        if not verify_password(password, teacher.password_hash):
            raise HTTPException(status_code=401, detail="Invalid password")
        return {"message": "Login successful", "username": username, "subject": subject_clean}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.post("/api/student/login")
def login_student(entry_number: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    try:
        # Find all rows for this entry_number (one per subject)
        students = db.query(models.Student).filter(models.Student.entry_number == entry_number).all()
        if not students:
            raise HTTPException(status_code=401, detail="No student found with that entry number")
        # Verify password against the first row that has a hash
        auth_student = next((s for s in students if s.password_hash), students[0])
        if auth_student.password_hash:
            if not verify_password(password, auth_student.password_hash):
                raise HTTPException(status_code=401, detail="Invalid password")
        else:
            if password != entry_number:
                raise HTTPException(status_code=401, detail="Invalid password")
        subjects = [s.class_name for s in students]
        return {
            "message": "Login successful",
            "name": students[0].name,
            "entry_number": entry_number,
            "subjects": subjects
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Student login error: {e}")
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.get("/api/student/attendance")
def get_student_attendance(entry_number: str, db: Session = Depends(get_db)):
    import datetime as dt
    # Get ALL rows for this entry_number (one per subject)
    students = db.query(models.Student).filter(models.Student.entry_number == entry_number).all()
    if not students:
        raise HTTPException(status_code=404, detail="Student not found")

    today = dt.datetime.now(dt.timezone(dt.timedelta(hours=5, minutes=30))).date().isoformat()
    subjects_data = []

    for student in students:
        logs = db.query(models.Attendance).filter(
            models.Attendance.student_id == student.id
        ).order_by(models.Attendance.timestamp.desc()).all()

        days_set = set()
        records = []
        for att in logs:
            day = att.timestamp.date().isoformat()
            days_set.add(day)
            records.append({
                "id": att.id,
                "date": day,
                "time": att.timestamp.strftime("%H:%M:%S"),
                "teacher_username": att.teacher_username or "—",
            })

        present_today = any(r["date"] == today for r in records)
        subjects_data.append({
            "subject": student.class_name,
            "total_days_present": len(days_set),
            "present_today": present_today,
            "records": records
        })

    overall_present_today = any(s["present_today"] for s in subjects_data)

    return {
        "student": {
            "name": students[0].name,
            "entry_number": entry_number,
        },
        "present_today": overall_present_today,
        "subjects": subjects_data
    }

@app.post("/api/register")
async def register_student(name: str = Form(...), entry_number: str = Form(...), class_name: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    
    # Allow same entry_number for DIFFERENT subjects – block exact duplicate (entry_number + subject)
    existing = db.query(models.Student).filter(
        models.Student.entry_number == entry_number,
        models.Student.class_name == class_name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Student '{entry_number}' is already registered for subject '{class_name}'.")
        
    image_bytes = await file.read()
    encodings, _ = get_face_encoding(image_bytes)
    
    if not encodings:
        raise HTTPException(status_code=400, detail="No face detected in the image.")
    
    if len(encodings) > 1:
        raise HTTPException(status_code=400, detail="Multiple faces detected. Please upload an image with only one face.")
    
    try:
        encoding_json = json.dumps(encodings[0].tolist())

        # Reuse password_hash from existing row if student is already registered for another subject
        existing_any = db.query(models.Student).filter(
            models.Student.entry_number == entry_number
        ).first()
        password_hash = existing_any.password_hash if existing_any else hash_password(entry_number)

        new_student = models.Student(
            name=name, entry_number=entry_number,
            class_name=class_name, face_encoding=encoding_json,
            password_hash=password_hash
        )
        db.add(new_student)
        db.commit()
        db.refresh(new_student)
        
        # Log to Excel
        excel_utils.append_student_to_excel(name, entry_number, class_name)
        
        return {"message": "Student registered successfully", "student_id": new_student.id, "name": new_student.name}
    except Exception as e:
        db.rollback()
        print(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred during registration.")

@app.post("/api/mark-attendance")
async def mark_attendance(
    file: UploadFile = File(...), 
    teacher_username: str = Form(None), 
    teacher_subject: str = Form(None), 
    db: Session = Depends(get_db)
):
    import datetime as dt
    IST = dt.timezone(dt.timedelta(hours=5, minutes=30))

    image_bytes = await file.read()
    encodings, _ = get_face_encoding(image_bytes)

    if not encodings:
        return {"message": "No face detected", "recognized": []}

    # Load only students for this teacher's subject (or all if no subject set)
    student_query = db.query(models.Student)
    if teacher_subject:
        student_query = student_query.filter(models.Student.class_name == teacher_subject)
    students = student_query.all()

    if not students:
        return {"message": f"No students registered for subject '{teacher_subject}'", "recognized": []}

    known_encodings = []
    student_ids = []
    student_names = []

    for s in students:
        known_encodings.append(np.array(json.loads(s.face_encoding)))
        student_ids.append(s.id)
        student_names.append(s.name)

    recognized_names = set()
    already_marked_names = set()

    try:
        for face_encoding in encodings:
            matches = face_recognition.compare_faces(known_encodings, face_encoding)
            face_distances = face_recognition.face_distance(known_encodings, face_encoding)

            if len(face_distances) > 0:
                best_match_index = np.argmin(face_distances)
                if matches[best_match_index]:
                    student_id = student_ids[best_match_index]
                    student_name = student_names[best_match_index]

                    # Debounce: skip if marked in the last 1 hour
                    last_attendance = db.query(models.Attendance).filter(
                        models.Attendance.student_id == student_id,
                        models.Attendance.teacher_username == teacher_username
                    ).order_by(models.Attendance.timestamp.desc()).first()

                    now_ist = dt.datetime.now(IST).replace(tzinfo=None)
                    if last_attendance:
                        time_diff = (now_ist - last_attendance.timestamp).total_seconds()
                        if time_diff < 3600:
                            already_marked_names.add(student_name)
                            continue

                    new_attendance = models.Attendance(
                        student_id=student_id,
                        teacher_username=teacher_username,
                        timestamp=now_ist
                    )
                    db.add(new_attendance)
                    recognized_names.add(student_name)

                    # Log to Excel
                    excel_utils.log_attendance_to_excel(
                        student_name,
                        students[best_match_index].entry_number,
                        students[best_match_index].class_name,
                        teacher_username
                    )

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Attendance processing error: {e}")
        return {"message": "Error processing attendance", "recognized": []}

    return {
        "message": "Attendance processed",
        "recognized": list(recognized_names),
        "already_marked": list(already_marked_names)
    }

@app.get("/api/logs")
def get_logs(teacher_username: str = None, teacher_subject: str = None, db: Session = Depends(get_db)):
    import datetime as dt
    IST = dt.timezone(dt.timedelta(hours=5, minutes=30))
    today = dt.datetime.now(IST).date()  # IST today – matches IST-stored timestamps

    query = db.query(models.Attendance, models.Student).join(
        models.Student, models.Attendance.student_id == models.Student.id
    )
    if teacher_username:
        query = query.filter(models.Attendance.teacher_username == teacher_username)
    # Filter by subject: only return attendance for students in teacher's subject
    if teacher_subject:
        query = query.filter(models.Student.class_name == teacher_subject)

    logs = query.order_by(models.Attendance.timestamp.desc()).all()

    result = []
    for attendance, student in logs:
        if attendance.timestamp.date() == today:
            result.append({
                "id": attendance.id,
                "student_id": student.id,
                "entry_number": student.entry_number,
                "name": student.name,
                "subject": student.class_name,
                "timestamp": attendance.timestamp.isoformat()
            })
    return result

@app.get("/api/dashboard")
def get_dashboard(teacher_username: str = None, teacher_subject: str = None, db: Session = Depends(get_db)):
    import datetime as dt
    IST = dt.timezone(dt.timedelta(hours=5, minutes=30))
    today = dt.datetime.now(IST).date()  # IST today

    # Students registered for this teacher's subject (or all if no subject)
    student_query = db.query(models.Student)
    if teacher_subject:
        student_query = student_query.filter(models.Student.class_name == teacher_subject)
    all_students = student_query.all()
    total_students = len(all_students)
    student_ids_in_subject = {s.id for s in all_students}

    # Today's attendance for this teacher (scoped to their subject's students)
    att_query = db.query(models.Attendance, models.Student).join(
        models.Student, models.Attendance.student_id == models.Student.id
    )
    if teacher_username:
        att_query = att_query.filter(models.Attendance.teacher_username == teacher_username)
    if teacher_subject:
        att_query = att_query.filter(models.Student.class_name == teacher_subject)

    today_logs = [(att, stu) for att, stu in att_query.all() if att.timestamp.date() == today]

    present_ids = set(att.student_id for att, stu in today_logs)
    present_count = len(present_ids)
    absent_count = total_students - present_count

    # Hourly breakdown
    hourly: dict[int, int] = {}
    for att, stu in today_logs:
        hour = att.timestamp.hour
        hourly[hour] = hourly.get(hour, 0) + 1
    hourly_data = [{"hour": f"{h:02d}:00", "count": hourly[h]} for h in sorted(hourly)]

    # Student list with present/absent status
    students_list = [
        {
            "id": s.id,
            "name": s.name,
            "entry_number": s.entry_number,
            "class_name": s.class_name,
            "present_today": s.id in present_ids
        }
        for s in all_students
    ]

    return {
        "subject": teacher_subject or "All Subjects",
        "total_students": total_students,
        "present_count": present_count,
        "absent_count": absent_count,
        "hourly_data": hourly_data,
        "students": students_list
    }

