from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime

IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30))

def now_ist():
    return datetime.datetime.now(IST).replace(tzinfo=None)

class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)          # NOT unique – same teacher can have multiple subjects
    password_hash = Column(String)
    subject = Column(String, nullable=True)        # Teacher's subject for this row

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    entry_number = Column(String, index=True)
    name = Column(String, index=True)
    class_name = Column(String, index=True)
    face_encoding = Column(String)  # JSON-serialized list of floats
    password_hash = Column(String, nullable=True)  # Default password = entry_number hash

    attendances = relationship("Attendance", back_populates="student")

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    teacher_username = Column(String, ForeignKey("teachers.username"), nullable=True)
    timestamp = Column(DateTime, default=now_ist)  # Stored in IST

    student = relationship("Student", back_populates="attendances")

