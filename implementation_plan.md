# Teacher/Admin Login System and Attendance Segregation

This plan outlines the architecture and changes required to implement a secure login/signup system for teachers and to separate their attendance data while keeping the student database shared.

## Goal
To allow teachers to create accounts and log in securely. After logging in, teachers can take attendance for the shared pool of students. The attendance records will be tied to the specific teacher who took the attendance and saved in a unique Excel file per teacher.

## User Review Required

> [!IMPORTANT]  
> Please review this plan. The key decision here is that **Student data remains globally shared** across all teachers, but **Attendance logs will be filtered and saved separately** per teacher.

## Open Questions

> [!WARNING]  
> Are you okay with storing the teacher's passwords using standard hashing (bcrypt), and passing a simple session username to the frontend for this version, or do you want a full JWT token-based authentication system? (For simplicity, this plan proposes standard hashing with a straightforward session state in the React app).

## Proposed Changes

---

### Backend (FastAPI & Database)

#### [MODIFY] [models.py](file:///c:/Users/acer/OneDrive/Desktop/coa/COA_Project/backend/models.py)
- **New Model:** Create a `Teacher` model with `id`, `username`, and `password_hash`.
- **Update Model:** Update the `Attendance` model to include a `teacher_username` column. This ties each attendance record to the teacher who took it.

#### [MODIFY] [excel_utils.py](file:///c:/Users/acer/OneDrive/Desktop/coa/COA_Project/backend/excel_utils.py)
- **Update Function:** Modify `log_attendance_to_excel` to accept `teacher_username`.
- **Change Filename Logic:** Update the excel filename format to `Attendance_{teacher_username}_{class_name}_{date_str}.xlsx` so each teacher gets their own Excel sheet.

#### [MODIFY] [main.py](file:///c:/Users/acer/OneDrive/Desktop/coa/COA_Project/backend/main.py)
- **New Endpoints:** 
  - `POST /api/teacher/signup` for creating an account (hashes password).
  - `POST /api/teacher/login` for verifying credentials.
- **Update Endpoint:** Modify `POST /api/mark-attendance` to accept `teacher_username` from the frontend and pass it to the database and excel logger.
- **Update Endpoint:** Modify `GET /api/logs` to accept a `teacher_username` query parameter so the frontend only fetches logs for the logged-in teacher.
- **Update Requirements:** Add `passlib` and `bcrypt` for secure password hashing.

---

### Frontend (Next.js & UI Components)

#### [NEW] [LoginSignup.tsx](file:///c:/Users/acer/OneDrive/Desktop/coa/COA_Project/frontend/src/components/LoginSignup.tsx)
- Create a new beautiful, modern UI component for logging in and signing up. It will feature a toggle between Login and Signup modes and will communicate with the new backend endpoints.

#### [MODIFY] [page.tsx](file:///c:/Users/acer/OneDrive/Desktop/coa/COA_Project/frontend/src/app/page.tsx)
- Add state to track the `loggedInTeacher`.
- If no teacher is logged in, display the `LoginSignup` component.
- If a teacher is logged in, display the main dashboard (Scanner, Register, Logs) and a "Logout" button in the header.

#### [MODIFY] [LiveScanner.tsx](file:///c:/Users/acer/OneDrive/Desktop/coa/COA_Project/frontend/src/components/LiveScanner.tsx)
- Update component to accept the logged-in teacher's username as a prop.
- Append `teacher_username` to the `FormData` sent to `/api/mark-attendance`.

#### [MODIFY] [DailyLog.tsx](file:///c:/Users/acer/OneDrive/Desktop/coa/COA_Project/frontend/src/components/DailyLog.tsx)
- Update component to accept the logged-in teacher's username as a prop.
- Modify the fetch URL to include the teacher's username as a query parameter (`/api/logs?teacher_username=...`).

## Verification Plan

### Automated Tests
- N/A

### Manual Verification
1. **Signup/Login**: Open the frontend, try to sign up with a new teacher account. Log out, then log in.
2. **Attendance Segregation**: Log in as Teacher A, register a student, run the live scanner. Verify `Attendance_TeacherA_...xlsx` is created. Log in as Teacher B, run the scanner. Verify `Attendance_TeacherB_...xlsx` is created, and the Daily Logs in the UI only show the respective teacher's scans.
