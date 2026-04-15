import database
import models
import numpy as np
import json
import os

def test_db_setup():
    print("Setting up database...")
    models.Base.metadata.create_all(bind=database.engine)
    print("Models created!")

def test_mock_recognition():
    db = database.SessionLocal()
    # Create mock encoding
    mock_encoding = np.random.rand(128).tolist()
    encoding_json = json.dumps(mock_encoding)
    
    student = models.Student(name="Test User", face_encoding=encoding_json)
    db.add(student)
    db.commit()
    db.refresh(student)
    print(f"Added Test User with ID: {student.id}")
    
    # Try to fetch
    students = db.query(models.Student).all()
    print(f"Total students in DB: {len(students)}")
    assert len(students) >= 1
    
    # Verify we can decode
    first_student = students[-1]
    decoded = json.loads(first_student.face_encoding)
    print(f"Decoded vector length: {len(decoded)}")
    
    db.close()
    print("Database test passed!")

if __name__ == "__main__":
    test_db_setup()
    test_mock_recognition()
