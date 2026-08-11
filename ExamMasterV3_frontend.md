# API Documentation

## Base URL

| App | Base URL |
|------|----------|
| `ExamMasterV3_frontend` | `https://localhost:7160/api` |

---

## Services

### 1. ExamService
**File:** `src/app/services/exam.service.ts`

| # | Method | Endpoint | Request Body | Response | Description |
|---|--------|----------|--------------|----------|-------------|
| 1 | GET | `/exams/student` | — | `ApiExamDto[]` | Fetch all exams available for the current student |
| 2 | GET | `/exams/{id}/questions` | — | `ApiExamDto` | Retrieve a single exam including all its questions |
| 3 | POST | `/exam-attempts/start` | `{ examId: number }` | `ApiExamAttemptDto` | Begin a new exam attempt for the given exam |
| 4 | POST | `/exam-attempts/submit` | `{ examAttemptId: number, answers: ExamAnswerSubmission[] }` where `ExamAnswerSubmission = { questionId: number, selectedAnswer?: string \| null }` | `ApiExamResultDto` | Submit all answers for an in-progress exam attempt |
| 5 | GET | `/exam-attempts/my-results` | — | `ApiExamResultDto[]` | Retrieve all exam results for the current student |
| 6 | GET | `/exam-attempts/results/{resultId}` | — | `ApiExamResultDto` | Fetch a specific exam result by its ID |

---

### 2. StudentAuthService
**File:** `src/app/services/student-auth.service.ts`

| # | Method | Endpoint | Request Body | Response | Description |
|---|--------|----------|--------------|----------|-------------|
| 1 | POST | `/auth/login` | `{ email: string, password: string, isStudentLogin: boolean }` | `ApiLoginResponse` (contains `accessToken`, `refreshToken`, `expiresAt`, `user`) | Authenticate a student. Stores tokens in `localStorage`. |
| 2 | GET | `/students/by-nic/{username}` | — | `Partial<StudentUser>` | Retrieve additional student profile details by NIC number |

---

### 3. StudentService
**File:** `src/app/services/student.service.ts`

| # | Method | Endpoint | Request Body | Response | Description |
|---|--------|----------|--------------|----------|-------------|
| 1 | GET | `/students/batch/{batchId}` | — | `Student[]` | Retrieve all students belonging to a specific batch |

---

## Components (Direct HTTP Calls)

### 4. ExamDashboardComponent
**File:** `src/app/components/exam-dashboard/exam-dashboard.component.ts`

| # | Method | Endpoint | Request Body | Response | Description |
|---|--------|----------|--------------|----------|-------------|
| 1 | GET | `/attendance/student/{studentId}` | — | `AttendanceDto[]` | Fetch attendance records for the current student to compute attendance percentage |

---

# Notes

- All endpoints returning `text` typically indicate a success message or empty string on success, or an error message on failure.
- Request/response DTO names (e.g., `CreateBatchDto`, `ApiExamDto`) are based on TypeScript interfaces/types found in the frontend code. The backend may use slightly different naming conventions.
- Query parameters are documented inline where present in the frontend code.
- Both apps share the same backend API base URL in development (`https://localhost:7160/api`).
