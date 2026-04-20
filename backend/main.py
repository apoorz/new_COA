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

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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

@app.post("/api/register")
async def register_student(name: str = Form(...), entry_number: str = Form(...), class_name: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    
    # Check if entry_number already exists
    existing_user = db.query(models.Student).filter(models.Student.entry_number == entry_number).first()
    if existing_user:
        raise HTTPException(status_code=400, detail=f"Student with entry number {entry_number} is already registered.")
        
    image_bytes = await file.read()
    encodings, _ = get_face_encoding(image_bytes)
    
    if not encodings:
        raise HTTPException(status_code=400, detail="No face detected in the image.")
    
    if len(encodings) > 1:
        raise HTTPException(status_code=400, detail="Multiple faces detected. Please upload an image with only one face.")
    
    try:
        encoding_json = json.dumps(encodings[0].tolist())
        
        new_student = models.Student(name=name, entry_number=entry_number, class_name=class_name, face_encoding=encoding_json)
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
async def mark_attendance(file: UploadFile = File(...), db: Session = Depends(get_db)):
    image_bytes = await file.read()
    encodings, _ = get_face_encoding(image_bytes)
    
    if not encodings:
        return {"message": "No face detected", "recognized": []}
    
    students = db.query(models.Student).all()
    if not students:
        return {"message": "No students registered", "recognized": []}
    
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
            # Compare current face encoding with all known encodings
            matches = face_recognition.compare_faces(known_encodings, face_encoding)
            face_distances = face_recognition.face_distance(known_encodings, face_encoding)
            
            if len(face_distances) > 0:
                best_match_index = np.argmin(face_distances)
                if matches[best_match_index]:
                    student_id = student_ids[best_match_index]
                    student_name = student_names[best_match_index]
                    
                    # Check for debounce (don't log if logged in the last 1 hour)
                    last_attendance = db.query(models.Attendance).filter(
                        models.Attendance.student_id == student_id
                    ).order_by(models.Attendance.timestamp.desc()).first()
                    
                    import datetime as dt
                    now = dt.datetime.now(dt.timezone.utc).replace(tzinfo=None)
                    if last_attendance:
                        time_diff = (now - last_attendance.timestamp).total_seconds()
                        if time_diff < 3600:
                            already_marked_names.add(student_name)
                            continue # Skip inserting a new record

                    new_attendance = models.Attendance(student_id=student_id, timestamp=now)
                    db.add(new_attendance)
                    recognized_names.add(student_name)
                    
                    # Log to Excel
                    excel_utils.log_attendance_to_excel(student_name, students[best_match_index].entry_number, students[best_match_index].class_name)
        
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
def get_logs(db: Session = Depends(get_db)):
    import datetime as dt
    # Use UTC for "today" to accurately match the UTC timestamps saved in mark_attendance
    today = dt.datetime.now(dt.timezone.utc).date()
    
    logs = db.query(models.Attendance, models.Student).join(
        models.Student, models.Attendance.student_id == models.Student.id
    ).order_by(models.Attendance.timestamp.desc()).all()
    
    # Normally we would filter by date, but since SQLite datetime filtering can be tricky,
    # we'll fetch recently and format.
    result = []
    for attendance, student in logs:
        # Only return today's attendance for the "Daily Log"
        if attendance.timestamp.date() == today:
            result.append({
                "id": attendance.id,
                "student_id": student.id,
                "entry_number": student.entry_number,
                "name": student.name,
                "timestamp": attendance.timestamp.isoformat()
            })
        
    return result
